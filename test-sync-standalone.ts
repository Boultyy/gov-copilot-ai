import { supabase } from "./src/integrations/supabase/client";

async function run() {
  const sourceId = "693c61c9-247e-49aa-9b9c-a7bc57701902";
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  const endpoint = "/resource/463666f8-410a-429a-b586-4447493a398d";

  console.log("SOURCE: Data.gov.in Schemes");
  console.log("ENDPOINT:", endpoint);
  console.log("CONFIGURED:", apiKey ? "YES" : "NO");
  
  if (!apiKey) {
    console.log("DATA.GOV.IN API KEY REQUIRED");
    process.exit(0);
  }

  try {
    const url = `https://api.data.gov.in${endpoint}?api-key=${apiKey}&format=json&limit=100`;
    console.log("REQUESTING:", url.replace(apiKey, "REDACTED"));
    
    const response = await fetch(url);
    console.log("HTTP STATUS:", response.status);
    
    if (!response.ok) {
      console.log("RESPONSE RECEIVED:", await response.text());
      process.exit(1);
    }
    
    const data = await response.json();
    const records = data.records || [];
    console.log("RECORDS RECEIVED:", records.length);
    
    let inserted = 0;
    let rejected = 0;
    let duplicates = 0;

    for (const raw of records) {
      const normalized = {
        name: raw.scheme_name || raw.title,
        department: raw.department || raw.ministry,
        ministry: raw.ministry,
        description: raw.description || raw.objective,
        benefits: raw.benefits,
        government_level: 'Central',
        verification_status: 'pending_verification',
        official_url: raw.link || raw.url,
        source_id: sourceId,
        source_record_id: btoa(JSON.stringify(raw)).substring(0, 255)
      };

      if (normalized.name && normalized.department) {
        // Use supabaseAdmin logic here if we were in the engine, but using client for test
        // In a real script we'd check for duplicates
        const { error } = await supabase.from('schemes').insert(normalized);
        if (error) {
          if (error.code === '23505') duplicates++;
          else {
            console.error("Insert error:", error.message);
            rejected++;
          }
        } else {
          inserted++;
        }
      } else {
        rejected++;
      }
    }

    console.log("RECORDS PARSED:", records.length);
    console.log("RECORDS INSERTED:", inserted);
    console.log("RECORDS REJECTED:", rejected);
    console.log("DUPLICATES:", duplicates);

  } catch (err) {
    console.error("EXACT ERROR:", err.message);
    process.exit(1);
  }
}

run();
