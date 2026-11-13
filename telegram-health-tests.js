"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {probeTelegram}=require("./telegram-health");
test("Telegram configuration probe validates bot and chat without sending",async()=>{
 const called=[];
 const mock=async url=>{
  const method=url.split("/").pop();called.push(method);
  if(method==="getMe")return{ok:true,json:async()=>({ok:true,result:{id:42,is_bot:true}})};
  if(method==="getChat")return{ok:true,json:async()=>({ok:true,result:{id:99,type:"private"}})};
  throw Error("test should never send a message");
 };
 const v=await probeTelegram({token:"TESTONLY",chatId:"99",fetchFn:mock});
 assert.deepEqual(v,{botConnected:true,chatReachable:true});
 assert.deepEqual(called,["getMe","getChat"]);
});
test("Telegram configuration probe refuses missing or invalid settings",async()=>{
 await assert.rejects(probeTelegram({token:"",chatId:"99"}),/SECRET_MISSING/);
 await assert.rejects(probeTelegram({token:"TESTONLY",chatId:"99",fetchFn:async()=>({ok:false,status:401,json:async()=>({ok:false,error_code:401})})}),/GETME_FAILED/);
});
