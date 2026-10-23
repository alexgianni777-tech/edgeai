"use strict";
const assert = require("node:assert/strict");
const { dailyExit, roundTripCostR } = require("./fill-model");
const bar=(open,high,low,close)=>({open,high,low,close});
// Short stop at 103, opening above it at 108 = -8 units, not -3.
assert.deepEqual(dailyExit(bar(108,110,105,106),"short",103,94),{price:108,reason:"STOP_GAP"});
assert.deepEqual(dailyExit(bar(101,104,92,95),"short",103,94),{price:103,reason:"STOP"});
assert.deepEqual(dailyExit(bar(100,101,92,95),"short",103,94),{price:94,reason:"TARGET"});
assert.deepEqual(dailyExit(bar(90,92,88,91),"short",103,94),{price:94,reason:"TARGET_GAP_CAPPED"});
// Long stop at 97, opening below it at 92 = -8 units.
assert.deepEqual(dailyExit(bar(92,95,90,93),"long",97,106),{price:92,reason:"STOP_GAP"});
assert.deepEqual(dailyExit(bar(99,107,96,104),"long",97,106),{price:97,reason:"STOP"});
assert.deepEqual(dailyExit(bar(100,107,99,105),"long",97,106),{price:106,reason:"TARGET"});
assert.deepEqual(dailyExit(bar(110,112,108,111),"long",97,106),{price:106,reason:"TARGET_GAP_CAPPED"});
assert.strictEqual(dailyExit(bar(100,102,98,101),"short",103,94),null);
assert.deepEqual(dailyExit(bar(108,110,105,106),"short",103),{price:108,reason:"STOP_GAP"});
assert.throws(()=>dailyExit({high:110,low:90,close:100},"short",103,94),/Missing/);
assert.throws(()=>dailyExit(bar(100,99,96,97),"short",103,94),/Inconsistent/);
assert.equal(roundTripCostR(100,108,3,0.003),0.208);
console.log("Gap-aware fill regression tests passed");
