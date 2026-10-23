"use strict";
const assert = require("node:assert/strict");
const { eliteGate } = require("./elite-gate");
const passing = {
  n: 150, winRate: 0.82, avgWin: 3.2, avgLoss: -1,
  expectancyLow95: 1.0,
};
const params = {rrTarget: 3, maxBars: 10};
const yes = eliteGate(passing, params, 4, 0.75);
assert.equal(yes.qualified, true);
assert.equal(yes.status,"QUALIFIED_OOS");
assert.equal(yes.observed.realizedPayoff,3.2);
assert.equal(eliteGate({...passing,winRate:0.79},params,4,0.75).qualified,false);
assert.ok(eliteGate({...passing,winRate:0.79},params,4,0.75).reasons.includes("TRAFFSAKERHET_UNDER_80"));
assert.ok(eliteGate({...passing,avgWin:2.9},params,4,0.75).reasons.includes("VERKLIG_PAYOFF_UNDER_3"));
assert.ok(eliteGate(passing,{...params,rrTarget:2.5},4,0.75).reasons.includes("PLANERAD_RR_UNDER_3"));
assert.ok(eliteGate(passing,{...params,maxBars:20},4,0.75).reasons.includes("HALLTID_OVER_3_VECKOR"));
assert.ok(eliteGate(passing,params,2,0.75).reasons.includes("FOR_FA_OOS_PERIODER"));
assert.ok(eliteGate({...passing,n:20},params,4,0.75).reasons.includes("FOR_FA_OOS_AFFARER"));
assert.ok(eliteGate({...passing,avgLoss:0},params,4,0.75).reasons.includes("VERKLIG_PAYOFF_UNDER_3"));
assert.ok(eliteGate({...passing,expectancyLow95:-0.1},params,4,0.75).reasons.includes("OSAKER_POSITIV_FORVANTAN"));
assert.equal(eliteGate({}, {}, 0,0).qualified, false);
console.log("Elite 80/3 OOS gate tests passed");
