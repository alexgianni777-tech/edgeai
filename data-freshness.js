"use strict";
// Retry only bars that genuinely lag the last COMPLETED session. Never
// synthesize missing OHLC and never publish older bars as fresh ones.
const sessionDate=bars=>{
 const t=bars?.at(-1)?.t; if(!t)return null;
 const d=new Date(t);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);
};
async function refreshLagging({universe,indexBars,indexSymbol,expected,loadFn,attempts=2,delay=async()=>{},logger=()=>{}}) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(expected||""))throw Error("expected completed ISO session date required");
 if(typeof loadFn!=="function")throw Error("loadFn required");
 const completed=bars=>(bars||[]).filter(b=>sessionDate([b])<=expected);
 let currentIndex=completed(indexBars), currentUniverse=Object.fromEntries(Object.entries(universe||{}).map(([tk,bars])=>[tk,completed(bars)]));
 let reloaded=0; const errors=[];
 for(let round=0;round<attempts;round++){
   const lagging=[...Object.entries(currentUniverse).filter(([,bars])=>sessionDate(bars)!==expected).map(([tk])=>tk)];
   if(sessionDate(currentIndex)!==expected)lagging.unshift(indexSymbol);
   if(!lagging.length)break;
   // If the entire exchange is missing, do not unleash dozens of extra
   // provider requests on every scheduled job. This remains fail-closed.
   if(lagging.length>8) {
     logger(`[YAHOO_LAG] ${lagging.length} serier saknas; hoppar över massretry`);
     break;
   }
   await delay(round);
   logger(`[YAHOO_LAG] ${lagging.length} serier saknar ${expected} – försök ${round+1}/${attempts}`);
   for(const symbol of lagging){
     try{
       const fresh=completed(await loadFn(symbol));
       if(sessionDate(fresh)===expected){
         if(symbol===indexSymbol)currentIndex=fresh;
         else currentUniverse[symbol]=fresh;
         reloaded++;
       } else {
         errors.push(`${symbol} remains ${sessionDate(fresh)||"missing"}; needs ${expected}`);
       }
     }catch(e){errors.push(`${symbol}: ${String(e?.message||e)}`);}
   }
 }
 const stillLagging=Object.entries(currentUniverse).filter(([,bars])=>sessionDate(bars)!==expected).map(([tk])=>tk);
 if(sessionDate(currentIndex)!==expected)stillLagging.unshift(indexSymbol);
 return {universe:currentUniverse,indexBars:currentIndex,stillLagging,reloaded,errors,
   status:stillLagging.length?"DATA_NOT_READY":"CURRENT"};
}
module.exports={sessionDate,refreshLagging};
