// notify.js — skickar en morgon-digest till Telegram från public/data.json.
// Samma sanning som hemsidan. Sätt TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID som
// miljövariabler (GitHub Actions secrets). Utan dem skrivs digesten bara ut.
//
//   node build-data.js && node notify.js

const fs = require("fs");
const path = require("path");

const FLAG = { US: "🇺🇸", SE: "🇸🇪" };
const fmt = (v, cur) => (cur === "$" ? "$" + v.toFixed(2) : v.toFixed(2) + " kr");

function buildMessage(data) {
  const date = new Date(data.generatedAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  let msg = `📊 EdgeAI — ${date}${data.demo ? "  (demo)" : ""}\n`;

  for (const key of ["US", "SE"]) {
    const m = data.markets[key];
    if (!m) continue;
    const reg = m.regime || { on: true, label: "risk-on" };
    const e = m.edge;
    msg += `\n${FLAG[key]} ${m.label} — ${reg.on ? "🟢" : "🔴"} ${reg.label}\n`;
    msg += `Edge: ${e.expectancyR >= 0 ? "+" : ""}${e.expectancyR}R · ${e.winRate}% · PF ${e.profitFactor} (OOS)\n`;

    if (!reg.on) { msg += `Sitter ute — index under 200-snittet.\n`; continue; }
    const score = s => { const sh = s.dir === "short"; return ((sh ? !s.above200 : s.above200) ? 1 : 0) + s.edge.expectancyR * 2 + (s.rr >= 2 ? 0.3 : 0) + ((sh ? 100 - (s.rs ?? 50) : (s.rs ?? 50)) / 100) * 0.5 - s.barsAgo * 0.1; };
    const fresh = m.setups.slice().sort((a, b) => score(b) - score(a)).slice(0, 3);
    if (!fresh.length) { msg += `Inga A-setups idag. Tålamod slår tvång.\n`; continue; }
    for (const s of fresh) {
      const when = s.barsAgo === 0 ? "idag" : s.barsAgo === 1 ? "igår" : `${s.barsAgo}d sedan`;
      const tag = /breakout/i.test(s.setup) ? "Breakout" : "Pullback";
      msg += `• ${s.ticker}${s.dir === "short" ? " (SHORT)" : ""} — ${tag} (${when})\n`;
      msg += `   entry ${fmt(s.entry, m.currency)} · stop ${fmt(s.stop, m.currency)} · target ${fmt(s.target, m.currency)}\n`;
    }
    const more = m.setups.length - fresh.length;
    if (more > 0) msg += `…+${more} fler setups på sajten.\n`;
  }
  msg += `\nEj rådgivning. Agera bara på ✓-edge och i risk-on.`;
  return msg;
}

async function send(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) { console.log("(ingen Telegram-secret satt — skriver bara ut)\n"); console.log(text); return; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    console.log(r.ok ? "Telegram-digest skickad ✓" : `Telegram-fel: ${r.status}`);
  } catch (e) {
    console.error("Telegram-nätverksfel (datan är ändå byggd & committad):", e.message);
  }
}

(async () => {
  const p = path.join(__dirname, "public", "data.json");
  let data;
  try { data = JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { console.error("Hittar inte public/data.json — kör 'node build-data.js' först."); process.exit(1); }
  await send(buildMessage(data));
})();
