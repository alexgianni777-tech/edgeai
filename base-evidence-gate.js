"use strict";

// Conservative base evidence screen. Not a promise of broker-account returns.
// The current 95% CI treats trades as independent; same-day cohort correlation
// can widen uncertainty. A nonpositive lower bound is definitely insufficient
// to call an equity-strategy estimate "validated".
const MIN_TRADES = 30;
const MIN_EXPECTANCY_R = 0.03;
const MIN_PROFIT_FACTOR = 1.1;
const MIN_POSITIVE_WINDOW_RATE = 0.5;
function holdsOosEvidence(m = {}, positiveWindowRate = 0) {
  const n = Number(m.n);
  const expectation = Number(m.expectancy);
  const lower95 = Number(m.expectancyLow95);
  const pf = Number(m.profitFactor);
  return Number.isInteger(n) && n >= MIN_TRADES &&
    Number.isFinite(expectation) && expectation > MIN_EXPECTANCY_R &&
    Number.isFinite(lower95) && lower95 > 0 &&
    Number.isFinite(pf) && pf > MIN_PROFIT_FACTOR &&
    Number.isFinite(positiveWindowRate) && positiveWindowRate >= MIN_POSITIVE_WINDOW_RATE;
}
module.exports = { holdsOosEvidence, MIN_TRADES, MIN_EXPECTANCY_R,
  MIN_PROFIT_FACTOR, MIN_POSITIVE_WINDOW_RATE };
