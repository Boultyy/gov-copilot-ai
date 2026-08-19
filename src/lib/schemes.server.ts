import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SCHEME_ALIASES: Record<string, string[]> = {
  "pm-kisan": ["pm kisan", "pmkisan", "pradhan mantri kisan samman nidhi", "kisan samman nidhi", "pm-kisan"],
  "pmay": ["pradhan mantri awas yojana", "pm awas yojana", "pmay"],
  "pmay-g": ["pradhan mantri awaas yojana - gramin", "pmay gramin", "pmay-g"],
  "pmay-u": ["pradhan mantri awas yojana - urban", "pmay urban", "pmay-u"],
  "pm vishwakarma": ["pm vishwakarma scheme", "vishwakarma scheme", "pm vishwakarma"],
  "pm surya ghar": ["pm surya ghar: muft bijli yojana", "muft bijli yojana", "pm surya ghar"],
  "ayushman bharat": ["ayushman bharat pm-jay", "pradhan mantri jan arogya yojana", "pm-jay", "pmjay", "ayushman bharat"]
};

const STOPWORDS = new Set([
  "tell", "about", "what", "which", "when", "where", "whom", "does", "know", "give",
  "information", "info", "details", "detail", "please", "explain", "scheme", "schemes",
  "yojana", "government", "govt", "india", "indian", "there", "their", "this", "that",
  "help", "with", "from", "have", "need", "want", "more", "some", "under", "eligible",
  "eligibility", "benefit", "benefits", "apply", "application", "documents", "document",
]);

/** Rank candidates by closeness of their name to the target term. */
function rankByNameCloseness<T extends { name: string; official_name?: string | null }>(rows: T[], target: string): T[] {
  const t = normalizeText(target);
  return [...rows].sort((a, b) => score(a) - score(b));

  function score(r: T): number {
    const n = normalizeText(r.name);
    const o = normalizeText(r.official_name || "");
    if (n === t || o === t) return 0;
    if (n.startsWith(t) || o.startsWith(t)) return 1 + n.length / 1000;

    // Token overlap: a name sharing more of the query's words is the closer scheme.
    const targetTokens = t.split(/\s+/).filter(Boolean);
    const nameTokens = new Set(`${n} ${o}`.split(/\s+/).filter(Boolean));
    const overlap = targetTokens.filter(tok => nameTokens.has(tok)).length;
    const ratio = targetTokens.length ? overlap / targetTokens.length : 0;
    return 2 + (1 - ratio) + n.length / 1000;
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    .replace(/[-\s]+/g, ' ')  // normalize spaces and hyphens to single space
    .trim();
}

export async function searchSchemes(query: string, limit: number = 5) {
  const normalizedQuery = normalizeText(query);
  console.log(`[COPILOT_RETRIEVAL] query: "${query}" normalized: "${normalizedQuery}"`);

  // 1. Precise Match (Name or Official Name)
  let { data: exactMatches } = await supabaseAdmin
    .from("schemes")
    .select("*")
    .eq("verification_status", "verified")
    .or(`name.ilike.${normalizedQuery},official_name.ilike.${normalizedQuery}`)
    .limit(limit);

  if (exactMatches && exactMatches.length > 0) {
    console.log(`[COPILOT_RETRIEVAL] match_mode: "exact_name" count: ${exactMatches.length}`);
    return exactMatches;
  }

  // 1b. Exact Match normalized check (handle cases where DB might have extra chars)
  // We'll search for ILIKE but verify the normalized version matches
  let { data: allCandidates } = await supabaseAdmin
    .from("schemes")
    .select("*")
    .eq("verification_status", "verified")
    .ilike("name", `%${normalizedQuery}%`)
    .limit(20);
  
  const strictMatches = allCandidates?.filter(s => 
    normalizeText(s.name) === normalizedQuery || 
    (s.official_name && normalizeText(s.official_name) === normalizedQuery)
  );

  if (strictMatches && strictMatches.length > 0) {
    console.log(`[COPILOT_RETRIEVAL] match_mode: "strict_normalized" count: ${strictMatches.length}`);
    return strictMatches.slice(0, limit);
  }

  // 2. Alias Match — search across every alias variant, then rank against the
  // longest alias phrase actually present in the user's query.
  for (const [canonical, aliases] of Object.entries(SCHEME_ALIASES)) {
    const variants = [canonical, ...aliases];
    const present = variants
      .filter(v => normalizedQuery.includes(normalizeText(v)))
      .sort((a, b) => b.length - a.length);

    if (present.length > 0) {
      console.log(`[COPILOT_RETRIEVAL] attempting alias match for: ${canonical}`);
      const filter = variants
        .map(v => `name.ilike.%${v}%,official_name.ilike.%${v}%`)
        .join(",");
      const { data: aliasMatches } = await supabaseAdmin
        .from("schemes")
        .select("*")
        .eq("verification_status", "verified")
        .or(filter)
        .limit(30);

      if (aliasMatches && aliasMatches.length > 0) {
        const ranked = rankByNameCloseness(aliasMatches, present[0]);
        console.log(`[COPILOT_RETRIEVAL] match_mode: "alias_match" canonical: ${canonical} top: "${ranked[0].name}"`);
        return ranked.slice(0, limit);
      }
    }
  }

  // Token-based matching (strong lexical) — stopwords removed so question words
  // like "tell"/"about" can never select an unrelated scheme.
  const tokens = normalizedQuery
    .split(/\s+/)
    .filter(t => t.length > 3 && !STOPWORDS.has(t));

  if (tokens.length > 0) {
    const tokenFilter = tokens.map(t => `name.ilike.%${t}%`).join(',');
    const { data: tokenMatches } = await supabaseAdmin
      .from("schemes")
      .select("*")
      .eq("verification_status", "verified")
      .or(tokenFilter)
      .limit(20);

    // Validation: the selected scheme name must actually contain a query token.
    const validated = (tokenMatches || []).filter(s => {
      const n = normalizeText(`${s.name} ${s.official_name || ""}`);
      return tokens.some(t => n.includes(t));
    });

    if (validated.length > 0) {
      const ranked = rankByNameCloseness(validated, tokens.join(" "));
      console.log(`[COPILOT_RETRIEVAL] match_mode: "token_match" tokens: ${tokens.join(',')} top: "${ranked[0].name}"`);
      return ranked.slice(0, limit);
    }
  }

  // 3. Discovery / Fuzzy Match (ONLY for general queries)
  const isBroadQuery = /scheme|help|support|farmer|student|woman|senior|benefit|what|how|available/i.test(normalizedQuery);
  
  if (isBroadQuery) {
    // Enhanced discovery for common categories
    const categories: Record<string, string[]> = {
      "farmer": ["farming", "agriculture", "kisan", "krishi", "crop", "fertilizer", "livestock"],
      "student": ["scholarship", "education", "fellowship", "stipend", "research"],
      "woman": ["mahila", "girl", "mother", "janani", "beti"],
      "senior": ["pension", "vaya vandana", "varishtha"]
    };

    let discoveryFilter = `name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%`;
    
    for (const [key, terms] of Object.entries(categories)) {
      if (normalizedQuery.includes(key)) {
        const categoryFilter = terms.map(t => `name.ilike.%${t}%,description.ilike.%${t}%,category.ilike.%${t}%`).join(',');
        discoveryFilter += `,${categoryFilter}`;
      }
    }

    const { data: discoveryMatches } = await supabaseAdmin
      .from("schemes")
      .select("*")
      .eq("verification_status", "verified")
      .or(discoveryFilter)
      .order("created_at", { ascending: false })
      .limit(limit);

    console.log(`[COPILOT_RETRIEVAL] match_mode: "discovery" count: ${discoveryMatches?.length || 0}`);
    return discoveryMatches || [];
  }

  console.log(`[COPILOT_RETRIEVAL] match_mode: "NO_SCHEME_MATCH"`);
  return [];
}

export async function fetchOfficialSchemeDetail(url: string) {
  if (!url || !url.startsWith('http')) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const text = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 3000);

    return text;
  } catch (e) {
    console.error(`Failed to fetch official source: ${url}`, e);
    return null;
  }
}
