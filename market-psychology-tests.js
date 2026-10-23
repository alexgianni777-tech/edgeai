"use strict";
const assert=require("node:assert/strict");
const {scoreSentiment,assessCrowdRisk,buildIdeaRadar,assessTraderReadiness}=require("./market-psychology");
function bars(start, pct=0.001, count=260, endDate="2026-10-23") {
  const anchor=Date.parse(endDate+"T00:00:00Z");
  return Array.from({length:count},(_,i)=>{
    const v=start*Math.pow(1+pct,i);
    return {t:new Date(anchor-(count-1-i)*86400000),open:v,high:v*1.005,low:v*.995,close:v};
  });
}
const up=bars(100,.002), down=bars(200,-.002);
const growth=Object.fromEntries(Array.from({length:12},(_,i)=>["U"+i,bars(50+i,.003)]));
const contraction=Object.fromEntries(Array.from({length:12},(_,i)=>["D"+i,bars(50+i,-.003)]));
const bullish=scoreSentiment(up,growth,{asOf:"2026-10-23"});
const bearish=scoreSentiment(down,contraction,{asOf:"2026-10-23"});
assert.equal(bullish.status,"OK");
assert.equal(bearish.status,"OK");
assert.ok(bullish.score>bearish.score,"market psychology should distinguish sustained advance vs decline");
assert.ok(bearish.score>=0&&bullish.score<=100);
assert.equal(scoreSentiment(up.slice(-10),growth,{asOf:"2026-10-23"}).status,"UNAVAILABLE");
assert.equal(scoreSentiment(up,{}, {asOf:"2026-10-23"}).status,"UNAVAILABLE");
const mk=(dir,ticker,barsAgo=0)=>({
 dir,ticker,barsAgo,entry:100,stop:dir==="short"?105:95,target:dir==="short"?85:115,
 rr:3,maxBars:10,evidenceStatus:"WATCH",eliteQualified:false,edge:{expectancyR:-.20},rs:dir==="short"?20:80,
 chart:bars(100,.001,22).map(b=>({c:b.close})),setup:dir==="short"?"Burry":"Pullback"
});
const sLong=mk("long","LONG"),sShort=mk("short","SHORT");
assert.ok(assessCrowdRisk(sShort,{status:"OK",label:"EXTREME_FEAR"}).warnings.includes("SHORT_CHASE_RISK_IN_FEAR"));
assert.ok(assessCrowdRisk(sLong,{status:"OK",label:"EXTREME_GREED"}).warnings.includes("LONG_FOMO_RISK_IN_GREED"));
assert.ok(assessCrowdRisk(sShort,{status:"OK",label:"EXTREME_GREED"}).warnings.includes("SHORT_SQUEEZE_RISK_IN_GREED"));
const radar=buildIdeaRadar([sLong,sShort,mk("short","OLD",5)],bullish,3);
assert.equal(radar.long.length,1);assert.equal(radar.short.length,1);
assert.equal(radar.short[0].ticker,"SHORT");
assert.equal(radar.short[0].psychologyStatus,"WATCH");
assert.ok(!radar.short.some(s=>s.ticker==="OLD"));
const conflict=buildIdeaRadar([mk("long","BOTH"),mk("short","BOTH"),sLong,sShort],bullish,3);
assert.deepEqual(conflict.conflicts,["BOTH"]);
assert.ok(!conflict.long.some(x=>x.ticker==="BOTH"));
assert.ok(!conflict.short.some(x=>x.ticker==="BOTH"));
assert.equal(assessTraderReadiness({planComplete:true,canMonitor:true,tilt:true}).status,"PAUSE");
assert.equal(assessTraderReadiness({planComplete:true,protectiveOrderVerified:true}).status,"REVIEW");
assert.equal(assessTraderReadiness({planComplete:false}).status,"PAUSE");
console.log("Market psychology/radar tests passed");
