"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
const {resolvePublicAsset}=require("./server");
test("local AI proxy serves public frontend only",()=>{
 for(const file of ["/","/edgeai.html","/index.html","/tracker.html","/icon.svg","/manifest.json","/apple-touch-icon.png","/data.json"]) {
   const got=resolvePublicAsset(file);
   assert.equal(typeof got,"string");
   assert.ok(path.isAbsolute(got));
 }
 assert.match(resolvePublicAsset("/data.json"),/public[/\\]data\.json$/);
 for(const f of ["/server.js","/notify.js","/data-live.js","/public/ledger-SE.json",
                  "/.github/workflows/edgeai.yml","/%2e%2e/notify.js","/..%2fnotify.js",
                  "/package.json","/TELEGRAM-OPERATIONS.md","/public/data.json","/does-not-exist"]) {
  assert.equal(resolvePublicAsset(f),null,"must not expose "+f);
 }
});
