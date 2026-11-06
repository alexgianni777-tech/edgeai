"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const {assessMarketTrend,assessDirection}=require("./trend-regime");

function bars(slope,shock=0){
  return Array.from({length:260},(_,i)=>{
    const t=new Date(Date.UTC(2025,0,1+i));
    const trend=200+slope*i;
    const noise=0.6*Math.sin(i*0.53)+0.4*Math.cos(i*0.31);
    const close=trend+noise+(i>=255?shock*(i-254):0);
    return {t,open:close,high:close+1,low:close-1,close};
  });
}
const market=(index,stocks=9)=>Object.fromEntries(Array.from({length:stocks},(_,i)=>["ST"+i,index.map(b=>({...b,close:b.close*(1+i*.01)}))]));

test("completed bullish market is long WATCH, not a trade approval",()=>{
  const idx=bars(.3),out=assessMarketTrend(idx,market(idx),{asOf:"2025-09-17",indexSymbol:"^OMX"});
  assert.equal(out.status,"OK");assert.equal(out.regime,"BULLISH");
  assert.equal(out.bias,"LONG_WATCH");
  assert.equal(assessDirection(out,"long").code,"WITH_MARKET_TREND");
  assert.equal(assessDirection(out,"short").code,"COUNTERTREND_REQUIRES_REVIEW");
  assert.equal(out.tradeApproved,false);
});
test("completed bearish market prioritizes short watch",()=>{
  const idx=bars(-.35),out=assessMarketTrend(idx,market(idx));
  assert.equal(out.regime,"BEARISH");assert.equal(out.bias,"SHORT_WATCH");
  assert.equal(assessDirection(out,"long").code,"COUNTERTREND_REQUIRES_REVIEW");
});
test("sudden selloff cannot be called uncomplicated bullish",()=>{
  const idx=bars(.3,-8),out=assessMarketTrend(idx,market(idx));
  assert.notEqual(out.regime,"BULLISH");
  assert.notEqual(out.bias,"LONG_WATCH");
});
test("missing index, stale index and incomplete breadth fail closed",()=>{
  const idx=bars(.3);
  assert.equal(assessMarketTrend(idx.slice(-150),market(idx)).status,"UNAVAILABLE");
  assert.equal(assessMarketTrend(idx,market(idx),{asOf:"2026-11-06"}).regime,"UNKNOWN");
  const bad=market(idx);for(let i=0;i<5;i++)bad["ST"+i]=idx.slice(0,-1);
  assert.equal(assessMarketTrend(idx,bad).status,"UNAVAILABLE");
});
test("even matching market trend never upgrades a trade or silently changes legacy OOS",()=>{
  const idx=bars(.3),out=assessMarketTrend(idx,market(idx));
  const mark=assessDirection(out,"long");
  assert.equal(mark.tradeApproved,false);
  assert.equal(mark.status,"WATCH_PREFERRED");
});
