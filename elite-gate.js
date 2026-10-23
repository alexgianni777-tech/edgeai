"use strict";

// AG Invest aspiration gate. This DOES NOT tune parameters or manufacture alpha.
// Out-of-sample observed win rate and realized payoff are separate from planned 3R.
const REQUIREMENTS = Object.freeze({
  minOosTrades: 100,
  minOosWindows: 2,
  minWinRate: 0.80,
  minRealizedPayoff: 3,
  minPlannedRR: 3,
  maxHoldingBars: 15, // ~three trading weeks
  minLosses: 10,
  minPositiveWindowRate: 2 / 3,
});
function eliteGate(stats = {}, params = {}, windows = 0, positiveWindowRate = 0) {
  const reasons = [];
  const n = Number(stats.n) || 0;
  const winRate = Number(stats.winRate);
  const losses = Math.round(n * (1 - (Number.isFinite(winRate) ? winRate : 0)));
  const avgWin = Number(stats.avgWin);
  const avgLoss = Number(stats.avgLoss);
  const realizedPayoff = Number.isFinite(avgWin) && Number.isFinite(avgLoss) && avgWin > 0 && avgLoss < 0
    ? avgWin / Math.abs(avgLoss) : null;
  const plannedRR = Number(params.rrTarget);
  const holdingBars = Number(params.maxBars);
  if (n < REQUIREMENTS.minOosTrades) reasons.push("FOR_FA_OOS_AFFARER");
  if (windows < REQUIREMENTS.minOosWindows) reasons.push("FOR_FA_OOS_PERIODER");
  if (losses < REQUIREMENTS.minLosses) reasons.push("FOR_FA_FORLUSTER_FOR_PAYOFF");
  if (!Number.isFinite(winRate) || winRate < REQUIREMENTS.minWinRate) reasons.push("TRAFFSAKERHET_UNDER_80");
  if (realizedPayoff === null || realizedPayoff < REQUIREMENTS.minRealizedPayoff) reasons.push("VERKLIG_PAYOFF_UNDER_3");
  if (!Number.isFinite(plannedRR) || plannedRR < REQUIREMENTS.minPlannedRR) reasons.push("PLANERAD_RR_UNDER_3");
  if (!Number.isFinite(holdingBars) || holdingBars < 1 || holdingBars > REQUIREMENTS.maxHoldingBars) reasons.push("HALLTID_OVER_3_VECKOR");
  if (!Number.isFinite(positiveWindowRate) || positiveWindowRate < REQUIREMENTS.minPositiveWindowRate) reasons.push("FOR_FA_POSITIVA_OOS_PERIODER");
  if (!(Number(stats.expectancyLow95) > 0)) reasons.push("OSAKER_POSITIV_FORVANTAN");
  return {
    qualified: reasons.length === 0,
    status: reasons.length === 0 ? "QUALIFIED_OOS" : "RESEARCH_ONLY",
    requirements: REQUIREMENTS,
    observed: {
      n,
      windows,
      winRate: Number.isFinite(winRate) ? winRate : null,
      realizedPayoff: Number.isFinite(realizedPayoff) ? realizedPayoff : null,
      plannedRR: Number.isFinite(plannedRR) ? plannedRR : null,
      maxHoldingBars: Number.isFinite(holdingBars) ? holdingBars : null,
      positiveWindowRate,
    },
    reasons,
  };
}
module.exports = { REQUIREMENTS, eliteGate };
