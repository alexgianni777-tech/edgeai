"use strict";
// Manual research calculator. Reference equity price levels ≠ mini-future/turbo prices.
// Leverage multiplier is only a local first-order approximation.
function tradeCard({entry,stop,target,direction}, account, opts={}) {
  const leverage=opts.leverage??6, allocationPct=opts.allocationPct??20, maxAccountRiskPct=opts.maxAccountRiskPct??4;
  const valid=Number.isFinite(entry)&&Number.isFinite(stop)&&Number.isFinite(target)&&entry>0&&
    ((direction==="long"&&stop<entry&&target>entry)||(direction==="short"&&target<entry&&stop>entry));
  if(!valid) throw new Error("Incorrect underlying entry/stop/target or trade direction");
  if(!Number.isFinite(account)||account<=0||!Number.isFinite(leverage)||leverage<1||
     !Number.isFinite(allocationPct)||allocationPct<=0||allocationPct>100||
     !Number.isFinite(maxAccountRiskPct)||maxAccountRiskPct<=0||maxAccountRiskPct>100)
     throw new Error("Invalid account/leverage/risk parameters");
  const r=Math.abs(entry-stop), reward=Math.abs(target-entry), rr=reward/r;
  const underlyingLossPct=r/entry*100,underlyingRewardPct=reward/entry*100;
  const approximateProductLossPct=underlyingLossPct*leverage;
  const stakeCeiling=account*allocationPct/100;
  const stopRiskCeiling=account*maxAccountRiskPct/100;
  const maxStakeAtStop=stopRiskCeiling/(approximateProductLossPct/100);
  const stake=Math.min(stakeCeiling,maxStakeAtStop);
  const approxLoss=stake*approximateProductLossPct/100;
  const approxGain=stake*underlyingRewardPct*leverage/100;
  return {
    rr:+rr.toFixed(3),direction,
    underlyingStopMovePct:+underlyingLossPct.toFixed(2),
    underlyingTargetMovePct:+underlyingRewardPct.toFixed(2),
    leverageAssumption:leverage,
    stakeSEK:+stake.toFixed(2),
    plannedRiskSEK:+approxLoss.toFixed(2),
    plannedRiskPctOfAccount:+(100*approxLoss/account).toFixed(2),
    illustrativeTargetProfitSEK:+approxGain.toFixed(2),
    status:rr>=3?"RESEARCH_ONLY_3R_PLAN":"BELOW_3R",
    warning:"Not a broker-specific or guaranteed stop. Gaps, knockout, changing leverage, spreads, financing, currency and fees can exceed planned loss. Verify real mini future ISIN and knockout before ordering.",
  };
}
module.exports={tradeCard};
if (require.main===module) {
  const cases=require("./monday-cases-2026-10-26.json");
  for(const x of cases.cases) console.log(x.ticker,tradeCard(x,cases.accountReferenceSEK,{leverage:cases.illustrativeLeverage}));
}
