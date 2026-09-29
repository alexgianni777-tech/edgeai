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
      msg += `Validated pool: ${e.expectancyR >= 0 ? "+" : ""}${e.expectancyR}R · ${e.winRate}% · PF ${e.profitFactor} (OOS)\n`;
    } else {
      msg += "Ingen fullt validerad OOS-pool just nu — förslag visas ändå som B/WATCH.\n";
    }

    if (!reg.on) {
      msg += "Index är risk-off — förslag visas ändå, men regimstatusen ska vägas in.\n";
    }

    const top = (m.setups || []).slice().sort((a, b) => scoreSetup(b) - scoreSetup(a)).slice(0, 3);
    if (!top.length) {
      msg += "Inga förslag idag. Tålamod slår tvång.\n";
      continue;
    }

    for (const s of top) {
      const when = s.barsAgo === 0 ? "idag" : s.barsAgo === 1 ? "igår" : `${s.barsAgo}d sedan`;
      msg += `• ${s.ticker}${s.dir === "short" ? " (SHORT)" : ""} — ${setupTag(s)} (${when}) · ${statusLabel(s)}\n`;
      msg += `   entry ${fmt(s.entry, m.currency)} · stop ${fmt(s.stop, m.currency)} · target ${fmt(s.target, m.currency)}\n`;
    }

    const more = (m.setups || []).length - top.length;
    if (more > 0) msg += `…+${more} fler förslag på sajten.\n`;
  }

  msg += "\nA = validerad OOS, B = lovande men inte fullt validerad, WATCH = idé med svag/otillräcklig OOS-evidens. Förslag döljs inte av etiketten.";
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
