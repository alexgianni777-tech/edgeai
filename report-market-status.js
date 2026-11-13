"use strict";
const fs=require("node:fs"),path=require("node:path");
const {publicationStatus}=require("./publication-policy");
const d=JSON.parse(fs.readFileSync(path.join(__dirname,"public/data.json"),"utf8"));
if(d.demo)throw Error("Live market health check received DEMO data");
const st=publicationStatus(d.markets||{},new Date(d.generatedAt));
const lines=["## EdgeAI data delivery",...["US","SE"].map(key=>
  key+": "+(st[key].current?"CURRENT":"STALE")+
  " · actual "+(st[key].dataAsOf||"missing")+" · required "+st[key].expected),
  "STALE means: no new entry for that market. No missing market candle was synthesized."];
console.log(lines.join("\n"));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join("\n")+"\n");
if(process.argv.includes("--strict")&&(!st.US.current||!st.SE.current)){
 console.error("DEGRADED_DELIVERY: at least one market still lacks the latest completed session");
 process.exitCode=1;
}
