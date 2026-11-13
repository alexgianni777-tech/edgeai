"use strict";
// EdgeAI non-trading status ping. Trigger only on the FIRST scheduled
// morning data failure; never include stale levels or claim new signals.
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.error("EdgeAI statusnotis ej konfigurerad: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID saknas");
    return;
  }
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
  const text = "⏳ EdgeAI " + day + ": nya verifierade dagskurser saknas ännu. " +
    "Ingen ny entry från historiska nivåer. GitHub gör fler schemalagda " +
    "dataförsök senare i dag. Kontrollera kursdatumen i appen.";
  const res = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chat, text})
  });
  if (!res.ok) throw Error("Telegram HTTP " + res.status);
  const body = await res.json();
  if (!body.ok || !body.result?.message_id) throw Error("Telegram bekräftade inte leverans");
  console.log("EdgeAI väntestatus levererad via Telegram");
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
