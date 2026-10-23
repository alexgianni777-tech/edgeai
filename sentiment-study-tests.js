"use strict";
const assert=require("node:assert/strict");
const {createHistoricalSentiment,compareSentiment}=require("./sentiment-study");
const mk=(start,pct,n=280)=>{
 const t0=Date.UTC(2025,0,1);
 return Array.from({length:n},(_,i)=>{const close=start*Math.pow(1+pct,i);return {
   t:new Date(t0+i*86400000),close,open:close,high:close*1.003,low:close*.997,
 };});
};
const index=mk(100,.002),universe=Object.fromEntries(Array.from({length:8},(_,i)=>["S"+i,mk(80+i,.002)]));
const hist=createHistoricalSentiment(index,universe);
const at=index[240].t.toISOString().slice(0,10);
const score=hist(at);
assert.equal(score.status,"OK");
assert.equal(score.asOf,at);
// Crucial leakage test: future data radically reverses, historical score does not.
const changedIndex=index.map((b,i)=>i>240?{...b,close:b.close*.01}:b);
const changedUniverse=Object.fromEntries(Object.entries(universe).map(([k,v])=>[k,v.map((b,i)=>i>240?{...b,close:b.close*.01}:b)]));
assert.deepEqual(createHistoricalSentiment(changedIndex,changedUniverse)(at),score);
assert.equal(hist("2030-01-01"),null);
const earlier=index[220].t;
const sample=[
 {dir:"long",r:3,held:3,signalT:earlier},
 {dir:"long",r:-1,held:3,signalT:earlier},
 {dir:"short",r:-1,held:4,signalT:earlier},
 {dir:"short",r:2,held:5,signalT:earlier},
 {dir:"long",r:99,held:2,signalT:null},
];
const research=compareSentiment(sample,hist);
assert.equal(research.validatedAlpha,false);
assert.equal(research.unknownSentiment,1);
assert.equal(research.bySide.long.sourceN,3);
assert.equal(research.bySide.long.datedN,2);
assert.equal(research.bySide.short.datedN,2);
assert.equal(research.bySide.long.withFilter.n+research.bySide.long.blocked.n,2);
assert.equal(research.bySide.short.held2to4.withoutFilter.n,1);
assert.ok(research.bySide.long.withoutFilter.avgR<3);
assert.equal(research.status,"RETROSPECTIVE_EXPLORATORY");
// Unknown sentiment from a missing date never gets silently counted as a win.
console.log("Historical fear/greed no-lookahead studies passed");
