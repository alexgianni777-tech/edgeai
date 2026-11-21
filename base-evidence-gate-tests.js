"use strict";
const assert = require("node:assert/strict");
const { holdsOosEvidence } = require("./base-evidence-gate");

const base = {n:407, expectancy:0.11, profitFactor:1.21, expectancyLow95:-0.02};
assert.equal(holdsOosEvidence(base,1),false,
  "positive point-estimate is not validated if confidence interval includes zero");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0},1),false,
  "a zero lower bound remains insufficient");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0.02},1),true,
  "positive lower bound plus support and payout can qualify as base evidence");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0.02,n:12},1),false,
  "too few trades cannot be validated");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0.02,profitFactor:1.0},1),false,
  "the profit factor gate must still apply");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0.02},0.4),false,
  "weak window stability must still fail");
assert.equal(holdsOosEvidence({...base,expectancyLow95:0.02,profitFactor:Infinity},1),false,
  "undefined risk of loss must not pass base evidence");
console.log("Positive-OOS base evidence regression tests passed");
