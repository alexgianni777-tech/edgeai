"use strict";
/**
 * AG Invest board planning parameters effective 2026-11-25, OMXS30 only.
 * Read-only illustration of instrument PRICE moves; NOT live derivative quotes,
 * not brokerage stops, not position sizing approval, and never an order signal.
 */
const MANDATE=Object.freeze({
  from:"2026-11-25",
  through:"2027-06-30",
  projectEnd:"2030-01-01",
  endAtFirstNavSEK:1_000_000,
  targetEntryLeverage:8,
  illustrativeInstrumentStopPct:20,
  illustrativeInstrumentTargetPct:40,
  maxPlannedAccountRiskPct:4,
  haltThrough:"2026-11-27",
  singleNewPositionAt5000:true,
  manualBoardApprovalRequired:true,
});
const isDay=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
  !Number.isNaN(Date.parse(x+"T12:00:00Z"))&&
  new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
function mandateStatus({day,navSEK,hasEverReachedMillion=false}){
  if(!isDay(day)||!Number.isFinite(navSEK)||navSEK<=0)
    throw Error("Valid dated NAV required");
  if(hasEverReachedMillion||navSEK>=MANDATE.endAtFirstNavSEK)
    return "EXPIRED_MILLION_REACHED";
  if(day<MANDATE.from)return "NOT_YET_EFFECTIVE";
  if(day>MANDATE.through)return "EXPIRED_DATE";
  if(day<=MANDATE.haltThrough)return "HALTED_NO_NEW_TRADES";
  return "BOARD_REVIEW_REQUIRED";
}
function estimateInstrumentStake({navSEK,roundTripFrictionSEK=0}){
  if(!Number.isFinite(navSEK)||navSEK<=0||!Number.isFinite(roundTripFrictionSEK)||roundTripFrictionSEK<0)
    throw Error("Valid NAV and round-trip costs required");
  const riskCap=navSEK*MANDATE.maxPlannedAccountRiskPct/100;
  const maxStake=Math.max(0,(riskCap-roundTripFrictionSEK)/(MANDATE.illustrativeInstrumentStopPct/100));
  const assumedLoss=maxStake*MANDATE.illustrativeInstrumentStopPct/100+roundTripFrictionSEK;
  const targetGain=maxStake*MANDATE.illustrativeInstrumentTargetPct/100-roundTripFrictionSEK;
  return {
    maxPlannedLossSEK:+riskCap.toFixed(2),
    maxIllustrativeStakeSEK:+maxStake.toFixed(2),
    nominalStopLossSEK:+(maxStake*0.2).toFixed(2),
    estimatedAllInLossSEK:+assumedLoss.toFixed(2),
    estimatedNetTargetProfitSEK:+targetGain.toFixed(2),
    estimatedNetRewardRisk:riskCap>0?+(targetGain/riskCap).toFixed(3):0,
    underlyingStopMovePctAtEntryLeverage:2.5,
    underlyingTargetMovePctAtEntryLeverage:5,
    caveat:"Illustrative only. Knockout/gap may wipe out entire stake; changing leverage, bid/ask spread, financing, fees and stop slippage invalidate constant multiplier assumptions. Requires current instrument terms and independent board approval."
  };
}
module.exports={MANDATE,mandateStatus,estimateInstrumentStake};
