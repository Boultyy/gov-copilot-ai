import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function searchSchemes(query: string, limit: number = 5) {
  // Normalize query for alias matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Precise Match (Name or Official Name)
  let { data: exactMatches } = await supabaseAdmin
    .from("schemes")
    .select("*")
    .eq("verification_status", "verified")
    .or(`name.ilike.${normalizedQuery},official_name.ilike.${normalizedQuery}`)
    .limit(limit);

  if (exactMatches && exactMatches.length > 0) {
    return exactMatches;
  }

  // 2. Keyword Match (Fuzzy-ish)
  // We use multiple ilike patterns for better coverage
  const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 2);
  let keywordFilter = `name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%,benefits.ilike.%${normalizedQuery}%`;
  
  if (keywords.length > 0) {
    // Also try matching first two keywords specifically if long query
    keywordFilter += `,name.ilike.%${keywords[0]}%,description.ilike.%${keywords[0]}%`;
  }

  const { data: fuzzyMatches } = await supabaseAdmin
    .from("schemes")
    .select("*")
    .eq("verification_status", "verified")
    .or(keywordFilter)
    .order("created_at", { ascending: false })
    .limit(limit);

  return fuzzyMatches || [];
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
    
    // Basic extraction: we want to avoid complex parsing that might break or be slow
    // Just grab common metadata or structural text if possible
    // For now, let's just return a snippet of the page text to ground the AI
    // We remove scripts, styles, and tags
    const text = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 3000); // Limit context size

    return text;
  } catch (e) {
    console.error(`Failed to fetch official source: ${url}`, e);
    return null;
  }
}
