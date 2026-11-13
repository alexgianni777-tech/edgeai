"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { regimeFrom } = require("./market-regime");
const bars = n => Array.from({length:n}, (_,i) => ({t:new Date(Date.UTC(2025,0,i+1)), close:100+i}));
test("insufficient SMA200 history never grants risk-on", () => {
  const r=regimeFrom(bars(199));
  assert.equal(r.on,false); assert.equal(r.sufficientHistory,false);
  assert.ok(Object.values(r.map).every(v=>v===false));
});
test("the first valid SMA200 session can be risk-on without lookahead", () => {
  const r=regimeFrom(bars(200));
  assert.equal(r.on,true); assert.equal(r.sufficientHistory,true);
  assert.equal(r.map["2025-01-01"],false);
});
test("invalid closing values fail closed and reset history", () => {
  const b=bars(202); b[201].close=NaN;
  const r=regimeFrom(b);
  assert.equal(r.on,false); assert.equal(r.sufficientHistory,false);
});
