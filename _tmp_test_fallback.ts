import { searchSchemes } from "@/lib/schemes.server";
import { detectIntent, buildSchemeContext, renderFallbackAnswer } from "@/lib/scheme-enrichment.server";

const queries = [
  "Tell me about PM-KISAN.",
  "Who is eligible for PM-KISAN?",
  "How do I apply for PM-KISAN?",
  "When was PM-KISAN launched?",
  "Tell me about PM Vishwakarma.",
  "Tell me about PM Surya Ghar.",
  "Tell me about Ayushman Bharat.",
  "Tell me about Pradhan Mantri Awas Yojana.",
  "Tell me about XYZ_NONEXISTENT_SCHEME_123.",
];

for (const q of queries) {
  const t0 = Date.now();
  const schemes = await searchSchemes(q);
  const intent = detectIntent(q);
  console.log("\n================ QUERY:", q, "| intent:", intent);
  if (!schemes.length) { console.log("NO_SCHEME_MATCH"); continue; }
  const ctx = await buildSchemeContext(schemes[0]);
  console.log(renderFallbackAnswer(ctx, intent));
  console.log(`--- elapsed ${Date.now() - t0}ms`);
}

// discovery mode
for (const q of ["What schemes are available for farmers?"]) {
  const s = await searchSchemes(q);
  console.log("\nDISCOVERY:", q, "->", s.map((x:any)=>x.name));
}
