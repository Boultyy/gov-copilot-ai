import { syncSource } from "./src/lib/ingestion-engine.functions.ts";

async function run() {
  try {
    const result = await syncSource({ data: { sourceId: "693c61c9-247e-49aa-9b9c-a7bc57701902" } });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
