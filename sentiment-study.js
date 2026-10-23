"use strict";

const {scoreSentiment}=require("./market-psychology");
const {metrics}=require("./metrics");

const keyOf = t => {
 const d=new Date(t);
 return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);
};

// Historical classifier uses ONLY series up to the signal close, never future
// price bars or a label from the publication date.
function createHistoricalSentiment(indexBars,universe) {
 const indexDates=new Map((indexBars||[]).map((bar,i)=>[keyOf(bar.t),i]));
 const symbols=Object.entries(universe||{}).map(([ticker,bars])=>({
   ticker,bars,dates:new Map(bars.map((bar,i)=>[keyOf(bar.t),i])),
 }));
 const cache=new Map();
 return date=>{
   if(!date||!indexDates.has(date))return null;
   if(cache.has(date))return cache.get(date);
   const idx=indexDates.get(date);
   const truncatedIndex=indexBars.slice(0,idx+1);
   const truncatedUniverse={};
   for(const symbol of symbols){
     const j=symbol.dates.get(date);
     if(j!==undefined&&j>=200)truncatedUniverse[symbol.ticker]=symbol.bars.slice(0,j+1);
   }
   const value=scoreSentiment(truncatedIndex,truncatedUniverse,{asOf:date});
   cache.set(date,value);
   return value;
 };
}
function summarize(trades){
 const m=metrics(trades);
 return {n:m.n||0,winRatePct:m.n?+(m.winRate*100).toFixed(1):null,
    avgR:m.n?+m.expectancy.toFixed(3):null,
    totalR:m.n?+m.totalR.toFixed(2):null,
    profitFactor:m.n?Number.isFinite(m.profitFactor)?+m.profitFactor.toFixed(3):null:null};
}
function compareSentiment(trades,readHistoricalSentiment) {
 if(typeof readHistoricalSentiment!=="function")throw Error("Historical point-in-time sentiment reader required");
 const result={status:"RETROSPECTIVE_EXPLORATORY",policy:"Do not short when price/breadth proxy is FEAR or EXTREME_FEAR; do not open new longs in GREED or EXTREME_GREED; no optimization was performed.",
   validatedAlpha:false,featureSelection:"ex-post hypothesis on prior OOS strategy trades; requires future holdout",
   totalTrades:(trades||[]).length,unknownSentiment:0,bySide:{}};
 for(const direction of ["long","short"]){
   const source=(trades||[]).filter(t=>t.dir===direction);
   const rows=[];
   for(const trade of source) {
     // Missing signal timestamp => DO NOT use entry-day close; exclude instead.
     const at=keyOf(trade.signalT);
     const sentiment=at?readHistoricalSentiment(at):null;
     if(!sentiment||sentiment.status!=="OK"){result.unknownSentiment++;continue;}
     rows.push({trade,sentiment});
   }
   const avoided=rows.filter(x=>direction==="long"
     ? ["GREED","EXTREME_GREED"].includes(x.sentiment.label)
     : ["FEAR","EXTREME_FEAR"].includes(x.sentiment.label));
   const kept=rows.filter(x=>!avoided.includes(x));
   const shortSwing=items=>items.filter(({trade})=>Number.isFinite(trade.held)&&trade.held>=2&&trade.held<=4);
   result.bySide[direction]={
     sourceN:source.length,datedN:rows.length,blockedN:avoided.length,
     withoutFilter:summarize(rows.map(x=>x.trade)),
     withFilter:summarize(kept.map(x=>x.trade)),
     blocked:summarize(avoided.map(x=>x.trade)),
     held2to4:{
       withoutFilter:summarize(shortSwing(rows).map(x=>x.trade)),
       withFilter:summarize(shortSwing(kept).map(x=>x.trade))
     }
   };
 }
 return result;
}
module.exports={createHistoricalSentiment,compareSentiment,keyOf};
