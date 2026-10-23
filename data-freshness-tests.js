"use strict";
const assert=require("node:assert/strict");
const {sessionDate,refreshLagging}=require("./data-freshness");
const bar=(date,px=100)=>({t:new Date(date+"T00:00:00Z"),open:px,high:px*1.01,low:px*.99,close:px});
const older=[bar("2026-10-22")],newer=[bar("2026-10-22"),bar("2026-10-23")];
async function run(){
 let calls=[];
 const fixed=await refreshLagging({universe:{AAA:older,BBB:newer},indexBars:older,indexSymbol:"^OMX",expected:"2026-10-23",
    loadFn:async tk=>{calls.push(tk);return newer;},attempts:1});
 assert.equal(fixed.status,"CURRENT");
 assert.deepEqual(calls,["^OMX","AAA"]);
 assert.equal(sessionDate(fixed.indexBars),"2026-10-23");
 assert.equal(sessionDate(fixed.universe.AAA),"2026-10-23");
 assert.equal(fixed.reloaded,2);
 calls=[];
 const unfixed=await refreshLagging({universe:{AAA:older},indexBars:newer,indexSymbol:"^OMX",expected:"2026-10-23",
   loadFn:async tk=>{calls.push(tk);return older;},attempts:2});
 assert.equal(unfixed.status,"DATA_NOT_READY");
 assert.deepEqual(unfixed.stillLagging,["AAA"]);
 assert.equal(sessionDate(unfixed.universe.AAA),"2026-10-22");
 assert.deepEqual(calls,["AAA","AAA"]);
 calls=[];
 const mass=await refreshLagging({universe:Object.fromEntries(
   Array.from({length:12},(_,i)=>["L"+i,older])
 ),indexBars:older,indexSymbol:"^OMX",expected:"2026-10-23",loadFn:async tk=>{calls.push(tk);return newer;}});
 assert.equal(mass.status,"DATA_NOT_READY");
 assert.equal(calls.length,0,"Do not amplify a whole-market provider outage");
 assert.equal(sessionDate(newer),"2026-10-23");
 console.log("Data freshness bounded retry tests passed");
}
module.exports=run;
