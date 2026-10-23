"use strict";
const assert=require("node:assert/strict");
const {tradeCard}=require("./risk-card");
const playbook=require("./monday-cases-2026-10-26.json");
assert.equal(playbook.asOf,"2026-10-23");
assert.equal(playbook.reviewFor,"2026-10-26");
assert.equal(playbook.cases.length,3);
assert.deepEqual(playbook.cases.map(x=>x.direction),["long","short","long"]);
const seen=new Set();
for(const c of playbook.cases) {
  assert.ok(!seen.has(c.ticker));seen.add(c.ticker);
  assert.ok(c.trigger&&c.invalidation&&c.keyRisk&&c.source);
  const r=tradeCard(c,playbook.accountReferenceSEK,{leverage:playbook.illustrativeLeverage});
  assert.ok(r.rr>=2.999 && r.rr<=3.001);
  assert.ok(r.plannedRiskPctOfAccount<=4);
  assert.ok(r.stakeSEK<=2425);
  assert.equal(r.status,"RESEARCH_ONLY_3R_PLAN");
}
assert.throws(()=>tradeCard({entry:100,stop:99,target:98,direction:"long"},12125),/Incorrect/);
assert.throws(()=>tradeCard({entry:100,stop:101,target:103,direction:"short"},12125),/Incorrect/);
const heavy=tradeCard({entry:100,stop:90,target:130,direction:"long"},12125,{leverage:8});
assert.ok(heavy.stakeSEK<2425);
assert.ok(heavy.plannedRiskPctOfAccount<=4);
console.log("AG Invest Monday trade risk-card tests passed");
