"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {completedWeekday,isFreshMarket,previousVerifiedMarket,publicationStatus}=require("./publication-policy");
const {buildMessage}=require("./notify");
const now=new Date("2026-11-13T10:00:00Z");
const market=(day,key,overrides={})=>({
 label:key==="US"?"United States":"Sweden",currency:key==="US"?"$":"kr",
 dataAsOf:day,indexSnapshot:{source:"YAHOO_FINANCE",asOf:day},
 marketTrendV2:{asOf:day},
 setups:[],strategies:[],regime:{on:true,label:"risk-on"},
 edge:{holds:false},eliteTarget:{qualifiedStrategies:0},
 ideaRadar:{long:[],short:[],conflicts:[]},...overrides
});
test("completed market sessions use local cutoffs, weekends and DST",()=>{
 assert.equal(completedWeekday("SE",now),"2026-11-12");
 assert.equal(completedWeekday("US",now),"2026-11-12");
 assert.equal(completedWeekday("SE",new Date("2026-11-16T06:00:00Z")),"2026-11-13");
 assert.equal(completedWeekday("US",new Date("2026-11-16T06:00:00Z")),"2026-11-13");
});
test("USA may be fresh while Swedish market remains historical",()=>{
 const us=market("2026-11-12","US"),se=market("2026-11-11","SE",{dataStatus:"STALE"});
 const p=publicationStatus({US:us,SE:se},now);
 assert.equal(p.US.current,true);
 assert.equal(p.SE.current,false);
 assert.equal(isFreshMarket("SE",se,now),false);
 assert.equal(isFreshMarket("US",us,now),true);
});
test("previous verified series is never relabeled as fresh or altered",()=>{
 const previous={demo:false,markets:{US:market("2026-11-12","US"),SE:market("2026-11-11","SE")}};
 const original=structuredClone(previous);
 const old=previousVerifiedMarket(previous,"SE",now);
 assert.equal(old.dataAsOf,"2026-11-11");
 assert.equal(old.dataStatus,"STALE");
 assert.match(old.dataWarning,/Historical market data/);
 assert.deepEqual(previous,original);
 const cached=previousVerifiedMarket(previous,"US",now);
 assert.equal(cached.dataStatus,"CURRENT_CACHED");
 assert.equal(cached.dataAsOf,"2026-11-12");
});
test("cannot cache unverified, future, demo or inconsistent daily snapshots",()=>{
 const base={demo:false,markets:{SE:market("2026-11-11","SE")}};
 for(const p of [
  {...base,demo:true},
  {demo:false,markets:{SE:market("2026-11-14","SE")}},
  {demo:false,markets:{SE:market("2026-11-11","SE",{indexSnapshot:{asOf:"2026-11-12",source:"YAHOO_FINANCE"}})}},
  {demo:false,markets:{SE:market("2026-11-11","SE",{indexSnapshot:{asOf:"2026-11-11",source:"UNKNOWN"}})}},
  {demo:false,markets:{SE:market("2026-11-11","SE",{marketTrendV2:{asOf:"2026-11-10"}})}}
 ])assert.throws(()=>previousVerifiedMarket(p,"SE",now),/CACHED_MARKET_UNVERIFIED/);
});
test("Telegram never repeats historical Swedish trade levels as a fresh watch",()=>{
 const us=market("2026-11-12","US"),se=market("2026-11-11","SE",{
  dataStatus:"STALE",
  ideaRadar:{long:[{ticker:"STOCK_STALE",entry:9999,stop:9998,target:10000,barsAgo:0}],short:[],conflicts:[]}
 });
 const msg=buildMessage({demo:false,generatedAt:now.toISOString(),markets:{US:us,SE:se}},now);
 assert.match(msg,/HISTORISKT UNDERLAG/);
 assert.doesNotMatch(msg,/STOCK_STALE|9999/);
 assert.match(msg,/United States/);
});
test("GitHub Pages stages only public files and ignores stale-signal promotion",()=>{
 const stage=fs.readFileSync(path.join(__dirname,"prepare-pages.js"),"utf8");
 const staticYml=fs.readFileSync(path.join(__dirname,".github/workflows/static.yml"),"utf8");
 const daily=fs.readFileSync(path.join(__dirname,".github/workflows/edgeai.yml"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"edgeai.html"),"utf8");
 assert.match(stage,/const files=\["index\.html","edgeai\.html","tracker\.html"/);
 assert.match(staticYml,/path: 'dist'/);
 assert.match(daily,/path: "dist"/);
 assert.match(html,/function renderTop3\(m\) \{[\s\S]*?if \(!marketIsFresh\(market, m\)\)/);
 assert.match(html,/const top = current\.slice\(\)/);
 assert.match(html,/function activeSetup\(s, m\)/);
});
