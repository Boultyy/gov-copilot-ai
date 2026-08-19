import { searchSchemes } from "@/lib/schemes.server";
for (const q of ["What schemes are available for farmers?","schemes for students","Tell me about PM-KISAN."]) {
  const r = await searchSchemes(q, 5);
  console.log(q, "->", r.map((x:any)=>x.name));
}
