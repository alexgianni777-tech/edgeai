"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
test("manual Telegram diagnostics never execute live Yahoo, notify or market publication",()=>{
 const yml=fs.readFileSync(".github/workflows/telegram-connection-check.yml","utf8");
 assert.match(yml,/workflow_dispatch/);
 assert.match(yml,/node telegram-health\.js/);
 assert.match(yml,/secrets\.TELEGRAM_CHAT_ID/);
 assert.doesNotMatch(yml,/build-data|npm run build|node notify\.js|git push|TELEGRAM_BOT_TOKEN:\s*["']?[0-9]+:/);
});
