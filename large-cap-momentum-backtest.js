"use strict";
// Exploratory walk-forward signal study; NOT a deployable trading strategy.
// On completed session t, rank eligible securities; enter NEXT bar open;
// exit after holdBars sessions at that bar close. No intrabar stop assumptions.
// Cost in bps applied on BOTH entry and exit; excludes leverage/funding.
const {rankLargeCapMomentum}=require("./large-cap-momentum");
function backtestMomentum(assets,opts={}) {
  const {holdBars=5,roundTripSideBps=15,minBaseRangeAtr=0}=opts;
  if(!Number.isInteger(holdBars)||holdBars<1||holdBars>30 ||
      !Number.isFinite(roundTripSideBps)||roundTripSideBps<0 ||
      !Number.isFinite(minBaseRangeAtr)||minBaseRangeAtr<0) throw Error("Invalid settings");
  if(!Array.isArray(assets)||!assets.length)return {trades:[],count:0,expectancyPct:null,winRatePct:null};
  // Require aligned full histories. No missing or duplicated sessions.
  const master=assets[0].bars;
  if(!Array.isArray(master)||master.length<140) return {trades:[],count:0,expectancyPct:null,winRatePct:null};
  if(assets.some(a=>!Array.isArray(a.bars)||a.bars.length!==master.length ||
      a.bars.some((b,i)=>b.date!==master[i].date))) throw Error("Unaligned history; supply common completed sessions");
  const trades=[];let nextAllowed=126;
  for(let i=126;i+holdBars<master.length;i++) {
    if(i<nextAllowed)continue;
    const asOf=master[i].date;
    const candidates=assets.map(a=>({...a,bars:a.bars.slice(0,i+1)}));
    const ranked=rankLargeCapMomentum(candidates,asOf).ranking;
    // Only OMXS30 data-date constituents; this research must not alter trade mandate.
    const pick=ranked.find(x=>x.researchFlags.omxs30ConstituentOnDataDate &&
      x.researchFlags.trend && x.researchFlags.breakout &&
      x.indicators.consolidationRangeAtr>=minBaseRangeAtr &&
      x.researchFlags.tightBase);
    if(!pick)continue;
    const asset=assets.find(a=>a.ticker===pick.ticker);
    const entry=asset.bars[i+1].open,exit=asset.bars[i+holdBars].close;
    if(!(entry>0&&exit>0))continue;
    const grossPct=(exit/entry-1)*100;
    const netPct=((exit*(1-roundTripSideBps/10000))/(entry*(1+roundTripSideBps/10000))-1)*100;
    trades.push({ticker:pick.ticker,signalDate:asOf,entryDate:asset.bars[i+1].date,
      exitDate:asset.bars[i+holdBars].date,grossPct,netPct});
    nextAllowed=i+holdBars+1; // one position at a time, no overlap
  }
  const wins=trades.filter(t=>t.netPct>0).length;
  return {trades,count:trades.length,
    expectancyPct:trades.length?trades.reduce((s,t)=>s+t.netPct,0)/trades.length:null,
    winRatePct:trades.length?100*wins/trades.length:null,
    assumptions:{holdBars,costBpsPerSide:roundTripSideBps,unlevered:true,
      fills:"NEXT_OPEN_ENTRY_HOLD_BARS_CLOSE_EXIT",dividends:"NOT_INCLUDED",
      caveat:"Exploratory in-sample; requires point-in-time membership, split-adjusted prices, OOS validation, funding and gap modeling before any production use."}};
}
module.exports={backtestMomentum};
