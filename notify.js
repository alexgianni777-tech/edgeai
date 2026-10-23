// notify.js — morning digest from public/data.json.
// It reports the same proposals and evidence tiers as the dashboard.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FLAG = { US: "🇺🇸", SE: "🇸🇪" };
const fmt = (v, cur) => (cur === "$" ? "$" + v.toFixed(2) : v.toFixed(2) + " kr");

function statusLabel(s) {
  if (s.evidenceStatus === "VALIDATED") return "A/validated";
  if (s.evidenceStatus === "PROMISING") return "B/promising";
  return "WATCH";
}

function setupTag(s) {
  if (s.dir === "short") return "Short";
  if (/breakout/i.test(s.setup)) return "Breakout";
  if (/bollinger|reversion/i.test(s.setup)) return "Bollinger";
  if (/momentum|flag/i.test(s.setup)) return "Momentum";
  return "Pullback";
}

function scoreSetup(s) {
  const sh = s.dir === "short";
  const evidence = s.evidenceStatus === "VALIDATED"
    ? 2
    : s.evidenceStatus === "PROMISING"
      ? 1
      : 0;
  return evidence
    + ((sh ? !s.above200 : s.above200) ? 1 : 0)
    + s.edge.expectancyR * 2
    + (s.rr >= 2 ? 0.3 : 0)
    + ((sh ? 100 - (s.rs ?? 50) : (s.rs ?? 50)) / 100) * 0.5
    - s.barsAgo * 0.1;
}

function buildMessage(data) {
  const date = new Date(data.generatedAt).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
  let msg = `📊 EdgeAI — ${date}${data.demo ? "  (demo)" : ""}\n`;

  msg += `Dagskurser t.o.m. 🇺🇸 ${data.markets.US.dataAsOf} · 🇸🇪 ${data.markets.SE.dataAsOf}\n`;

  for (const key of ["US", "SE"]) {
    const m = data.markets[key];
    if (!m) continue;
    const reg = m.regime || { on: true, label: "risk-on" };
    const e = m.edge || {};

    msg += `\n${FLAG[key]} ${m.label} — ${reg.on ? "🟢" : "🔴"} ${reg.label}\n`;
    if (e.holds) {
      msg += `Tidigare OOS-basmodell: ${e.expectancyR >= 0 ? "+" : ""}${e.expectancyR}R · ${e.winRate}% · PF ${e.profitFactor}. INTE bevis för 80/3.\n`;
    } else {
      msg += "Inget positivt validerat OOS-basurval för denna marknad.\n";
    }
    msg += m.eliteTarget?.qualifiedStrategies
      ? `80/3-gate: ${m.eliteTarget.qualifiedStrategies} strategier når forskningskraven; individuell exekvering måste verifieras.\n`
      : "80/3-gate: inga strategier uppfyller kraven. ALLA idéer är WATCH.\n";

    if (!reg.on) {
      msg += "Index är risk-off — förslag visas ändå, men regimstatusen ska vägas in.\n";
    }

    const psych = m.psychology;
    if (psych?.status === "OK") {
      const labels = {EXTREME_FEAR:"EXTREM RÄDSLA",FEAR:"RÄDSLA",NEUTRAL:"NEUTRALT",GREED:"GIRIGHET",EXTREME_GREED:"EXTREM GIRIGHET"};
      msg += `Marknadspsykologi ${psych.score}/100: ${labels[psych.label]||psych.label} (egen pris-/breddproxy, INTE CNN-index)\n`;
    } else {
      msg += "Marknadspsykologi: otillräcklig data — ingen sentimenttolkning.\n";
    }
    const radar = m.ideaRadar;
    for (const side of ["long","short"]) {
      const items = radar?.[side] || [];
      msg += side === "long" ? "🟢 LONG-IDÉER (bevakning):\n" : "🔴 SHORT-IDÉER (bevakning):\n";
      if (!items.length) { msg += "  Inga färska kandidater. Avstå hellre än att tvinga fram en trade.\n"; continue; }
      for (const item of items) {
        msg += `• ${item.ticker} — ${item.setup} · ${item.evidenceStatus} · ${item.barsAgo}d gammal\n`;
        msg += `  ref ${fmt(item.entry,m.currency)} · stop ${fmt(item.stop,m.currency)} · mål ${fmt(item.target,m.currency)} (plan R/R ${item.rr})\n`;
        if (item.warnings?.length) msg += `  OBS: ${item.warnings.slice(0,2).join(", ")}\n`;
      }
    }
    msg += "Sentiment = sammanhang, inte entry. Long/short är WATCH tills aktuell kurs, 80/3-evidens, orderbok och egen handelsdisciplin granskats.\n";
  }

  msg += "\nWATCH = research, inte order. Kontrollera FOMO/tilt/revansch, rapportdatum, faktisk mini-future-risk och senast avslutad datadag.";
  return msg;
}

async function send(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    throw new Error("Telegram-secrets saknas; kan inte markera utskicket som lyckat");
  }

  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text }),
  });
  if (!r.ok) throw new Error("Telegram avvisade digest: HTTP " + r.status);
  const response = await r.json();
  if (!response.ok) throw new Error("Telegram svarade utan bekräftad leverans");
  console.log("Telegram-digest bekräftad av Telegram");
}

(async () => {
  const p = path.join(__dirname, "public", "data.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    console.error("Hittar inte public/data.json — kör 'node build-data.js' först.");
    process.exit(1);
  }

  if (data.demo || !data.markets?.US?.dataAsOf || !data.markets?.SE?.dataAsOf) {
    throw new Error("EdgeAI-data saknar verifierat kursdatum för båda marknaderna; inget utskick");
  }

  const created = new Date(data.generatedAt);
  const now = new Date();
  const stockholmDay = date => new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  if (
    Number.isNaN(created.getTime())
    || created > now
    || now.getTime() - created.getTime() > 24 * 60 * 60 * 1000
    || stockholmDay(created) !== stockholmDay(now)
  ) {
    throw new Error("EdgeAI-filen är inte skapad idag; inget Telegram-utskick");
  }

  const day = stockholmDay(created);
  const receipt = path.join(__dirname, "sent-digests", day + ".json");
  if (fs.existsSync(receipt)) {
    console.log("EdgeAI-digest redan levererad för " + day);
    return;
  }

  await send(buildMessage(data));
  fs.mkdirSync(path.dirname(receipt), { recursive: true });
  fs.writeFileSync(receipt, JSON.stringify({
    day,
    generatedAt: data.generatedAt,
    dataAsOf: {
      US: data.markets.US.dataAsOf,
      SE: data.markets.SE.dataAsOf,
    },
    deliveredAt: new Date().toISOString(),
  }) + "\n");

  if (process.env.GITHUB_ACTIONS === "true") {
    const git = (...args) => execFileSync("git", args, { cwd: __dirname, stdio: "inherit" });
    git("config", "user.name", "github-actions");
    git("config", "user.email", "actions@github.com");
    git("add", "--", path.relative(__dirname, receipt));
    git("commit", "-m", "Record delivered EdgeAI digest " + day);
    git("pull", "--rebase", "origin", "main");
    git("push", "origin", "HEAD:main");
  } else {
    console.log("Lokalt leveranskvitto sparat; omkörning på annan maskin kräver kontroll");
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { buildMessage, scoreSetup, statusLabel, setupTag };
