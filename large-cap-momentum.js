"use strict";
// Research-only Large Cap momentum. Never authorizes trades outside OMXS30.
// Input: [{ticker, bars:[{date,open,high,low,close,volume}], largeCap:true}]
// Bars must be ascending completed sessions, with a COMMON asOf date.
const { isTradeEligible } = require("./omxs30-universe");
const WINDOWS = Object.freeze({oneMonth:21, threeMonths:63, sixMonths:126});
const isNum = x => typeof x === "number" && Number.isFinite(x);
const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
const pct = (current,old) => 100*(current/old-1);
function analyze(asset,asOf) {
  if (!asset || !asset.largeCap || !/^[A-Z0-9-]+\.ST$/.test(asset.ticker||"")) return null;
  const b=asset.bars;
  if (!Array.isArray(b) || b.length<127 || b[b.length-1].date!==asOf) return null;
  for(let i=0;i<b.length;i++) {
    const v=b[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date||"") || (i && b[i-1].date>=v.date) ||
        ![v.open,v.high,v.low,v.close,v.volume].every(isNum) ||
        v.close<=0 || v.open<=0 || v.low<=0 || v.high<Math.max(v.open,v.close,v.low) ||
        v.low>Math.min(v.open,v.close) || v.volume<0) return null;
  }
  const n=b.length-1,c=b[n].close,cl=b.map(x=>x.close);
  const ret={};
  for (const [name,window] of Object.entries(WINDOWS)) ret[name]=pct(c,b[n-window].close);
  const sma=days=>mean(cl.slice(-days));
  const prior=b.slice(-11,-1); // exclude today: never use today's high as breakout reference
  const high10=Math.max(...prior.map(x=>x.high));
  const avVol20=mean(b.slice(-21,-1).map(x=>x.volume));
  const atrTR=[];
  for(let i=n-13;i<=n;i++)atrTR.push(Math.max(b[i].high-b[i].low,Math.abs(b[i].high-b[i-1].close),Math.abs(b[i].low-b[i-1].close)));
  const atr14=mean(atrTR), range10=Math.max(...prior.map(x=>x.high))-Math.min(...prior.map(x=>x.low));
  const trend=c>sma(20) && sma(20)>sma(50);
  return {
    ticker:asset.ticker, asOf, returnsPct:ret,
    score:0.2*ret.oneMonth+0.35*ret.threeMonths+0.45*ret.sixMonths,
    indicators:{sma10:sma(10),sma20:sma(20),sma50:sma(50),atr14,
      volumeRatio:avVol20>0?b[n].volume/avVol20:null,
      consolidationRangeAtr:atr14>0?range10/atr14:null,breakoutLevel:high10},
    researchFlags:{trend,breakout:c>high10 && b[n].volume>1.5*avVol20 && avVol20>0,
      tightBase:atr14>0 && range10/atr14<=5,
      // Status on NEXT decision day must be rechecked by the execution engine.
      omxs30ConstituentOnDataDate:isTradeEligible(asset.ticker,asOf)},
    status:"RESEARCH_ONLY_NO_ORDER"
  };
}
function rankLargeCapMomentum(assets,asOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf||"")) throw Error("Explicit completed session required");
  if (!Array.isArray(assets)) throw Error("assets must be an array");
  const result=assets.map(a=>analyze(a,asOf)).filter(Boolean)
    .sort((a,b)=>b.score-a.score || a.ticker.localeCompare(b.ticker));
  return {asOf,windowsTradingSessions:WINDOWS,totalSupplied:assets.length,eligibleForRanking:result.length,
    excluded:assets.length-result.length,ranking:result,tradeAuthorization:false,
    note:"Large Cap research only; OMXS30 trading mandate unchanged. Missing/stale history excluded, never imputed."};
}
module.exports={rankLargeCapMomentum,analyze,WINDOWS};
