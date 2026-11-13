"use strict";
// Probes Telegram without sending messages or revealing secrets in logs.
async function probeTelegram({token,chatId,fetchFn=fetch}) {
 if(!token||!chatId)throw Error("EDGEAI_TELEGRAM_SECRET_MISSING: configure bot token and chat id in edgeai repository Actions secrets");
 const query=async (method,payload={})=>{
  let res;
  try {
   res=await fetchFn("https://api.telegram.org/bot"+token+"/"+method,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)
   });
  }catch{throw Error("EDGEAI_TELEGRAM_NETWORK_FAILURE: cannot reach Telegram API");}
  let body;
  try{body=await res.json();}catch{throw Error("EDGEAI_TELEGRAM_INVALID_RESPONSE: non-JSON response");}
  if(!res.ok||!body?.ok||!body.result)throw Error("EDGEAI_TELEGRAM_"+method.toUpperCase()+"_FAILED: HTTP "+res.status+" code "+(body?.error_code||"unknown"));
  return body.result;
 };
 const bot=await query("getMe");
 if(!bot.id||bot.is_bot!==true)throw Error("EDGEAI_TELEGRAM_BOT_NOT_VERIFIED");
 const chat=await query("getChat",{chat_id:chatId});
 if(!chat.id)throw Error("EDGEAI_TELEGRAM_CHAT_NOT_VERIFIED");
 return {botConnected:true,chatReachable:true};
}
if(require.main===module){
 probeTelegram({token:process.env.TELEGRAM_BOT_TOKEN||process.env.TELEGRAM_TOKEN,chatId:process.env.TELEGRAM_CHAT_ID})
  .then(()=>console.log("EdgeAI Telegram: bot token valid, recipient chat reachable. No message was sent."))
  .catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={probeTelegram};
