"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {updateLedger}=require("./build-data");
const bar=(t,open,high,low,close)=>({t:new Date(t+"T00:00:00Z"),open,high,low,close});
test("quoted-OHLC v3 ledger archives pre-migration adjusted-price proposals without repricing",()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"edgeai-pricing-"));
 const p=path.join(dir,"ledger.json");
 try {
  const past={signalId:"AAA|Momentum|2026-10-01",ledgerVersion:2,status:"open",ticker:"AAA",setup:"Momentum",
    dir:"long",signalT:"2026-10-01",entry:80,stop:76,target:88,r:null};
  fs.writeFileSync(p,JSON.stringify([past]));
  const bars=[bar("2026-10-01",100,102,99,101),bar("2026-10-02",102,110,101,109)];
  assert.deepEqual(updateLedger(p,{AAA:bars},[]),[]);
  assert.equal(JSON.parse(fs.readFileSync(p))[0].status,"open");
  const setup={ticker:"AAA",setup:"Momentum",dir:"long",signalT:"2026-10-02",entry:109,
    stop:106,target:115,maxBars:5,costRate:0};
  assert.deepEqual(updateLedger(p,{AAA:bars},[setup]),[]);
  let rows=JSON.parse(fs.readFileSync(p));assert.equal(rows.length,2);
  assert.equal(rows[1].priceBasis,"YAHOO_QUOTED_OHLC_V1");assert.equal(rows[1].ledgerVersion,3);
  const result=updateLedger(p,{AAA:[...bars,bar("2026-10-05",110,116,109,115)]},[]);
  assert.equal(result.length,1);assert.equal(result[0].status,"closed");
  assert.equal(result[0].r,2); // 109 -> target 115, unit risk 3
  assert.equal(JSON.parse(fs.readFileSync(p))[0].status,"open");
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
