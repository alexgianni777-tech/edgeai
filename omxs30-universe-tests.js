"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const {NOVEMBER_2026, DECEMBER_2026, tickersForSession,
 temporaryIndexExceptions, isTradeEligible, SCOPE, stockholmDecisionDate}=require("./omxs30-universe");
test("official Nov 2026 OMXS30 list has 30 distinct constituents",()=>{
 assert.equal(NOVEMBER_2026.length,30);
 assert.equal(new Set(NOVEMBER_2026).size,30);
 for(const t of ["ADDT-B.ST","INDU-C.ST","LIFCO-B.ST","SKA-B.ST","EPI-A.ST"])
   assert.ok(isTradeEligible(t,"2026-11-23"),t);
 for(const t of ["GETI-B.ST","ELUX-B.ST","SSAB-A.ST","NVDA","AMZN","SOBI.ST"])
   assert.equal(isTradeEligible(t,"2026-11-23"),false,t);
});
test("index membership uses Stockholm decision day rather than D-1 candle day",()=>{
 const switchover = new Date("2026-11-30T23:17:00.000Z");
 assert.equal(stockholmDecisionDate(switchover), "2026-12-01");
 assert.ok(tickersForSession(stockholmDecisionDate(switchover)).includes("SOBI.ST"));
 assert.ok(!tickersForSession(stockholmDecisionDate(switchover)).includes("LIFCO-B.ST"));
 assert.equal(stockholmDecisionDate(new Date("2026-11-30T17:30:00.000Z")),"2026-11-30");
});
test("switch from Lifco to Sobi only after effective December 1 session",()=>{
 assert.ok(tickersForSession("2026-11-30").includes("LIFCO-B.ST"));
 assert.ok(!tickersForSession("2026-11-30").includes("SOBI.ST"));
 assert.ok(tickersForSession("2026-12-01").includes("SOBI.ST"));
 assert.ok(!tickersForSession("2026-12-01").includes("LIFCO-B.ST"));
 assert.equal(DECEMBER_2026.length,30);
 assert.equal(new Set(DECEMBER_2026).size,30);
});
test("temporary SKF Vertevo spin-off explicitly excluded from auto trading",()=>{
 assert.equal(temporaryIndexExceptions("2026-11-25").length,0);
 assert.equal(temporaryIndexExceptions("2026-11-26")[0].ticker,"SKFVER-B.ST");
 assert.equal(temporaryIndexExceptions("2026-12-01").length,0);
 assert.equal(isTradeEligible("SKFVER-B.ST","2026-11-27"),false);
});
test("missing/invalid session and US stocks fail closed",()=>{
 for(const date of ["2026-02-30","not-date",null])
   assert.throws(()=>tickersForSession(date));
 assert.equal(isTradeEligible("AAPL","2026-11-23"),false);
 assert.equal(SCOPE.activeMarket,"SE");
 assert.equal(SCOPE.universe,"OMXS30");
 assert.equal(SCOPE.leverageDefaultMax,4);
 assert.equal(SCOPE.leverageConditionalMax,8);
 assert.equal(SCOPE.tradingHaltThrough,"2026-11-27");
});
