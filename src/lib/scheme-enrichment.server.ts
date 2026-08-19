import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Reusable, scheme-agnostic official-source enrichment pipeline.
 *
 * scheme record -> official source fetch -> readable extraction -> section
 * classification -> structured context -> deterministic (non-AI) answer.
 *
 * Hard rules:
 *  - Never fabricate a fact. Missing values stay null.
 *  - Only the scheme's own stored official URL is fetched. No crawling.
 *  - Bounded time: 8s per attempt, max 1 retry, then graceful degradation.
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

export type SchemeContext = {
  schemeId: string;
  schemeName: string;
  officialName: string | null;
  ministry: string | null;
  department: string | null;
  governmentLevel: string | null;
  description: string | null;
  objective: string | null;
  benefits: string | null;
  eligibility: string | null;
  exclusions: string | null;
  applicationProcess: string | null;
  documentsRequired: string | null;
  launchDate: string | null;
  officialSource: string | null;
  sourceUrl: string | null;
  sourceLastChecked: string | null;
  sourceStatus: "live" | "cached" | "unavailable" | "no_source_url";
  sourceExcerpt: string | null;
};

export type SchemeIntent =
  | "overview"
  | "how_it_works"
  | "eligibility"
  | "benefits"
  | "application"
  | "documents"
  | "history"
  | "status";

/* ------------------------------------------------------------------ */
/* Intent detection                                                     */
/* ------------------------------------------------------------------ */

export function detectIntent(query: string): SchemeIntent {
  const q = query.toLowerCase();
  if (/\b(status|check my|beneficiary status|installment status|payment status)\b/.test(q)) return "status";
  if (/\b(document|documents|paperwork|papers required|kyc)\b/.test(q)) return "documents";
  if (/\b(apply|application|register|registration|enroll|sign up|how do i get)\b/.test(q)) return "application";
  if (/(\beligib|\bwho\s+(can|is|are)\b|\bqualif|\bcriteria\b|\bexclu)/.test(q)) return "eligibility";
  if (/\b(benefit|amount|how much|money|subsidy|instalment|installment|payout)\b/.test(q)) return "benefits";
  if (/\b(launch|started|when was|history|introduced|operational since)\b/.test(q)) return "history";
  if (/\b(how does .* work|how it works|mechanism|working|process flow)\b/.test(q)) return "how_it_works";
  return "overview";
}

/* ------------------------------------------------------------------ */
/* Official source fetch + extraction                                   */
/* ------------------------------------------------------------------ */

function htmlToReadableText(html: string): string {
  let cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  cleaned = cleaned
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Drop boilerplate / duplicate menu lines and keep meaningful lines only.
  const seen = new Set<string>();
  const lines = cleaned
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l) => {
      if (l.length < 25) return false;
      if (/^(skip to|screen reader|font size|site map|copyright|last updated|visitor|hindi|english)/i.test(l)) return false;
      const key = l.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return lines.join("\n").slice(0, 12000);
}

async function fetchOnce(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "GovCopilot/1.0 (official government scheme information assistant)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!/text\/html|text\/plain|application\/xhtml/i.test(ct)) return null;
    const html = await res.text();
    const text = htmlToReadableText(html);
    return text.length > 200 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch the scheme's own official URL. Bounded, no crawling, never throws. */
export async function fetchOfficialSource(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (isGenericDirectoryUrl(url)) {
    console.log(`[COPILOT_ENRICHMENT] skipping non-scheme-specific source URL: ${url}`);
    return null;
  }
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const text = await fetchOnce(url);
    if (text) return text;
  }
  return null;
}

/**
 * Directory/listing pages are not scheme-specific: scraping them would attach
 * another scheme's text to this scheme. Never enrich from them.
 */
export function isGenericDirectoryUrl(url: string): boolean {
  return /dbtbharat\.gov\.in\/central-scheme\/list|\/schemes?\/?$|\/scheme-list|\/all-schemes/i.test(url);
}

/* ------------------------------------------------------------------ */
/* Section classification from extracted source text                    */
/* ------------------------------------------------------------------ */

const SECTION_PATTERNS: Record<string, RegExp> = {
  objective: /\b(objective|aim of the scheme|purpose of the scheme)\b/i,
  benefits: /\b(benefit|financial assistance|amount of assistance|quantum of assistance|instalment|installment|subsidy of)\b/i,
  eligibility: /\b(eligib|who can apply|beneficiary criteria|criteria for)\b/i,
  exclusions: /\b(exclusion|not eligible|ineligible|shall not be eligible)\b/i,
  applicationProcess: /\b(how to apply|application process|registration process|new farmer registration|steps to apply|apply online)\b/i,
  documentsRequired: /\b(documents required|required documents|list of documents|document needed)\b/i,
  launchDate: /\b(launched on|came into effect|with effect from|w\.e\.f\.|operational from|inaugurated on)\b/i,
};

function classifySections(text: string | null): Partial<Record<keyof typeof SECTION_PATTERNS, string>> {
  if (!text) return {};
  const out: Record<string, string[]> = {};
  for (const line of text.split("\n")) {
    for (const [key, re] of Object.entries(SECTION_PATTERNS)) {
      if (re.test(line)) {
        out[key] = out[key] || [];
        if (out[key].length < 6) out[key].push(line.trim());
      }
    }
  }
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(out)) {
    const joined = v.join(" ").replace(/\s+/g, " ").trim();
    if (joined.length >= 40) result[k] = joined.slice(0, 1200);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Structured context builder                                           */
/* ------------------------------------------------------------------ */

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  // Reject generic placeholder text so it never masquerades as real content.
  if (/^(n\/a|na|general|unknown|available in official documentation|check official source)$/i.test(t)) return null;
  if (/^Official scheme listing from Direct Benefit Transfer Bharat\./i.test(t)) return null;
  return t;
}

function stringifyDocs(v: unknown): string | null {
  if (!v) return null;
  if (Array.isArray(v)) {
    const items = v.map((d) => (typeof d === "string" ? d : (d as any)?.name)).filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  if (typeof v === "string") return clean(v);
  return null;
}

export async function buildSchemeContext(scheme: any): Promise<SchemeContext> {
  const sourceUrl = clean(scheme.source_url);
  let sourceStatus: SchemeContext["sourceStatus"] = sourceUrl ? "unavailable" : "no_source_url";
  let sourceText: string | null = null;
  let sourceLastChecked: string | null = clean(scheme.source_last_checked);

  if (sourceUrl) {
    const live = await fetchOfficialSource(sourceUrl);
    if (live) {
      sourceText = live;
      sourceStatus = "live";
      sourceLastChecked = new Date().toISOString();
      // Cache the successful fetch (best-effort, never blocks the answer).
      try {
        await supabaseAdmin
          .from("schemes")
          .update({ source_content: live.slice(0, 20000), source_last_checked: sourceLastChecked } as any)
          .eq("id", scheme.id);
      } catch {
        /* cache write failures are non-fatal */
      }
    } else if (clean(scheme.source_content)) {
      sourceText = scheme.source_content as string;
      sourceStatus = "cached";
    }
  }

  const s = classifySections(sourceText);

  console.log(
    `[COPILOT_ENRICHMENT] scheme="${scheme.name}" source_status=${sourceStatus} sections=${Object.keys(s).join("|") || "none"}`,
  );

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    officialName: clean(scheme.official_name),
    ministry: clean(scheme.ministry),
    department: clean(scheme.department),
    governmentLevel: clean(scheme.government_level),
    description: clean(scheme.description),
    objective: clean(scheme.objective) ?? s.objective ?? null,
    benefits: clean(scheme.benefits) ?? s.benefits ?? null,
    eligibility: clean(scheme.eligibility_summary) ?? s.eligibility ?? null,
    exclusions: clean(scheme.exclusions) ?? s.exclusions ?? null,
    applicationProcess: clean(scheme.application_process) ?? s.applicationProcess ?? null,
    documentsRequired: stringifyDocs(scheme.required_documents) ?? s.documentsRequired ?? null,
    launchDate: clean(scheme.launch_date) ?? s.launchDate ?? null,
    officialSource: clean(scheme.official_source) ?? clean(scheme.source_name),
    sourceUrl,
    sourceLastChecked,
    sourceStatus,
    sourceExcerpt: sourceText ? sourceText.slice(0, 4000) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Deterministic (AI-free) answer rendering                             */
/* ------------------------------------------------------------------ */

const UNAVAILABLE = "Not available in the verified scheme information.";

const SECTION_ORDER: Record<SchemeIntent, string[]> = {
  overview: ["ABOUT", "OBJECTIVE", "HOW_IT_WORKS", "WHO_CAN_BENEFIT", "EXCLUSIONS", "BENEFITS", "HOW_TO_APPLY", "HISTORY", "FRESHNESS"],
  how_it_works: ["HOW_IT_WORKS", "OBJECTIVE", "BENEFITS", "ABOUT", "HOW_TO_APPLY"],
  eligibility: ["WHO_CAN_BENEFIT", "EXCLUSIONS", "DOCUMENTS", "ABOUT"],
  benefits: ["BENEFITS", "HOW_IT_WORKS", "ABOUT"],
  application: ["HOW_TO_APPLY", "DOCUMENTS", "STATUS_CHECK", "WHO_CAN_BENEFIT"],
  documents: ["DOCUMENTS", "STATUS_CHECK", "HOW_TO_APPLY"],
  history: ["HISTORY", "ABOUT"],
  status: ["STATUS_CHECK", "HOW_TO_APPLY", "ABOUT"],
};

const SECTION_TITLES: Record<string, string> = {
  ABOUT: "### What it is",
  OBJECTIVE: "### Objective",
  HOW_IT_WORKS: "### How it works",
  WHO_CAN_BENEFIT: "### Who it is for",
  BENEFITS: "### Benefits",
  HOW_TO_APPLY: "### How to apply / access",
  DOCUMENTS: "### Documents required",
  EXCLUSIONS: "### Who is excluded",
  HISTORY: "### Launch / operational history",
  STATUS_CHECK: "### How to check status",
  FRESHNESS: "### Official Source",
};

function sectionValue(key: string, c: SchemeContext): string | null {
  switch (key) {
    case "ABOUT":
      return c.description;
    case "OBJECTIVE":
      return c.objective;
    case "HOW_IT_WORKS":
      // Combine objective and mechanism if needed
      return c.objective && c.objective.length > 200 ? c.objective : null;
    case "WHO_CAN_BENEFIT":
      return c.eligibility;
    case "BENEFITS":
      return c.benefits;
    case "HOW_TO_APPLY":
      return c.applicationProcess;
    case "DOCUMENTS":
      return c.documentsRequired;
    case "EXCLUSIONS":
      return c.exclusions;
    case "HISTORY":
      return c.launchDate;
    case "STATUS_CHECK":
      // Detect application status info in process
      if (c.applicationProcess && /status|check|track/i.test(c.applicationProcess)) {
        return c.applicationProcess.split(/\.|\n/).filter(s => /status|check|track/i.test(s)).join(". ").trim();
      }
      return null;
    default:
      return null;
  }
}

export function renderFallbackAnswer(c: SchemeContext, intent: SchemeIntent): string {
  const lines: string[] = [];

  // 1. Header
  lines.push(`## ${c.officialName || c.schemeName}`);
  const details = [];
  if (c.ministry) details.push(`**Ministry:** ${c.ministry}`);
  if (c.department && c.department !== c.ministry) details.push(`**Department:** ${c.department}`);
  if (c.governmentLevel) details.push(`**Level:** ${c.governmentLevel}`);
  if (details.length) lines.push(details.join(" | "));

  lines.push(""); // Spacer

  // 2. Body Sections
  const order = SECTION_ORDER[intent];
  const primaryKey = order[0];
  const renderedSections = new Set<string>();

  for (const key of order) {
    if (key === "FRESHNESS") continue;
    const value = sectionValue(key, c);
    if (value) {
      lines.push(SECTION_TITLES[key]);
      lines.push(value);
      lines.push("");
      renderedSections.add(key);
    } else if (key === primaryKey) {
      lines.push(SECTION_TITLES[key]);
      lines.push(UNAVAILABLE);
      lines.push("");
    }
  }

  // 3. Attribution / Freshness
  lines.push(SECTION_TITLES["FRESHNESS"]);
  lines.push(`- **Source:** ${c.officialSource || "Official government source"}`);
  if (c.sourceUrl) lines.push(`- **Link:** [${c.sourceUrl}](${c.sourceUrl})`);
  
  if (c.sourceLastChecked) {
    const dateStr = new Date(c.sourceLastChecked).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    lines.push(`- **Verified on:** ${dateStr}`);
  }

  if (c.sourceStatus === "cached") {
    lines.push("\n*Note: Current information is from a verified snapshot as the official site is temporarily unreachable.*");
  } else if (c.sourceStatus === "unavailable") {
    lines.push("\n*Note: Information is based on the latest verified database record.*");
  }

  return lines.join("\n").trim();
}

/** Compact, grounded context block handed to the AI when it is available. */
export function renderAiContext(c: SchemeContext): string {
  const f = (label: string, v: string | null) => `${label}: ${v ?? "NULL"}`;
  return [
    f("CANONICAL_SCHEME_ID", c.schemeId),
    f("CANONICAL_SCHEME_NAME", c.schemeName),
    f("OFFICIAL_NAME", c.officialName),
    f("MINISTRY", c.ministry),
    f("DEPARTMENT", c.department),
    f("GOVERNMENT_LEVEL", c.governmentLevel),
    f("DESCRIPTION", c.description),
    f("OBJECTIVE", c.objective),
    f("BENEFITS", c.benefits),
    f("ELIGIBILITY", c.eligibility),
    f("EXCLUSIONS", c.exclusions),
    f("APPLICATION_PROCESS", c.applicationProcess),
    f("DOCUMENTS_REQUIRED", c.documentsRequired),
    f("LAUNCH_OR_OPERATIONAL_DATE", c.launchDate),
    f("OFFICIAL_SOURCE", c.officialSource),
    f("SOURCE_URL", c.sourceUrl),
    f("SOURCE_STATUS", c.sourceStatus),
    f("SOURCE_CHECKED_AT", c.sourceLastChecked),
    c.sourceExcerpt ? `OFFICIAL_SOURCE_EXCERPT:\n${c.sourceExcerpt}` : "OFFICIAL_SOURCE_EXCERPT: NULL",
  ].join("\n");
}

/** Answer used when no scheme matched at all. Never invents a scheme. */
export function renderNoMatchAnswer(query: string): string {
  return `I could not find a matching scheme in the verified GovCopilot government-scheme database for "${query}".

I will not guess or substitute a different scheme. You can try the official scheme name (for example "PM-KISAN" or "Ayushman Bharat PM-JAY"), or browse verified schemes in the Schemes section.`;
}
