"use strict";
const fs=require("node:fs"),path=require("node:path");
const {publicationStatus}=require("./publication-policy");
const d=JSON.parse(fs.readFileSync(path.join(__dirname,"public/data.json"),"utf8"));
if(d.demo)throw Error("Live market health check received DEMO data");
const st=publicationStatus(d.markets||{},new Date(d.generatedAt));
const lines=["## EdgeAI OMXS30-only delivery",
  "SE/OMXS30: "+(st.SE.current?"CURRENT":"STALE")+
  " · actual "+(st.SE.dataAsOf||"missing")+" · required "+st.SE.expected,
  "US: ARCHIVED / no new candidates or signals",
  "STALE SE means no new entry. No missing OMXS30 candle was synthesized."];
console.log(lines.join("\n"));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join("\n")+"\n");
if(process.argv.includes("--strict")&&!st.SE.current){
 console.error("DEGRADED_DELIVERY: OMXS30 lacks the latest completed session");
 process.exitCode=1;
}
