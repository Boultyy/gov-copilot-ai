import { searchSchemes } from "@/lib/schemes.server";
const r = await searchSchemes("tell me about pradhan mantri awas yojana", 10);
console.log(r.map((x:any)=>x.name));
