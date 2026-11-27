"use strict";
const assert=require("node:assert/strict");
const {rankLargeCapMomentum}=require("./large-cap-momentum");
function sample(ticker, drift=0.5, count=150, ending="2026-11-26") {
  const end=new Date(ending+"T12:00:00Z"), bars=[];
  for(let j=count-1;j>=0;j--) {
    const d=new Date(end);d.setUTCDate(d.getUTCDate()-j);
    const i=count-1-j,c=100+i*drift;
    bars.push({date:d.toISOString().slice(0,10),open:c,high:c+1,low:c-1,close:c,volume:1000});
  }
  return {ticker,largeCap:true,bars};
}
const a=sample("ABB.ST",0.8), b=sample("YUBICO.ST",1.4), short=sample("MIPS.ST",0.4,40);
const out=rankLargeCapMomentum([a,b,short],"2026-11-26");
assert.equal(out.eligibleForRanking,2);
assert.equal(out.excluded,1);
assert.equal(out.tradeAuthorization,false);
assert.equal(out.ranking[0].ticker,"YUBICO.ST");
assert.equal(out.ranking[0].status,"RESEARCH_ONLY_NO_ORDER");
assert.equal(out.ranking[0].researchFlags.omxs30ConstituentOnDataDate,false);
assert.equal(out.ranking[1].researchFlags.omxs30ConstituentOnDataDate,true);
assert.ok(out.ranking[0].returnsPct.sixMonths>out.ranking[0].returnsPct.oneMonth);
const stale=sample("SEB-A.ST",0.2,150,"2026-11-25");
assert.equal(rankLargeCapMomentum([stale],"2026-11-26").eligibleForRanking,0);
const corrupt=sample("ATCO-A.ST");corrupt.bars[30].close=-3;
assert.equal(rankLargeCapMomentum([corrupt],"2026-11-26").eligibleForRanking,0);
const duplicate=sample("SAAB-B.ST");duplicate.bars[15].date=duplicate.bars[14].date;
assert.equal(rankLargeCapMomentum([duplicate],"2026-11-26").eligibleForRanking,0);
const previous=sample("EVO.ST");previous.bars[previous.bars.length-1].close=previous.bars[previous.bars.length-1].high+10;
assert.equal(rankLargeCapMomentum([previous],"2026-11-26").eligibleForRanking,0);
assert.throws(()=>rankLargeCapMomentum([],""),/session/);
console.log("large-cap-momentum tests passed");
