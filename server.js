// server.js — kör EdgeAI lokalt på din egen dator. Inga beroenden, ingen molntjänst.
//
//   1) sätt din nyckel (en gång per terminalsession):
//        macOS/Linux:  export ANTHROPIC_API_KEY=sk-ant-...
//        Windows PS:   $env:ANTHROPIC_API_KEY="sk-ant-..."
//   2) node server.js
//   3) öppna http://localhost:3000
//
// API-nyckeln stannar i den här processen och skickas ALDRIG till webbläsaren.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY;
const AI_DAILY_CAP = +(process.env.AI_DAILY_CAP || 50); // tak per dag — kan aldrig spräckas av misstag
// Modell för förklaringarna. Default = Haiku (snabb & billig, gott nog för korta
// setup-förklaringar). Sätt AI_MODEL=claude-sonnet-4-6 om du vill ha Sonnet.
const AI_MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

// Räknar AI-anrop per dag i en liten fil. Nollställs automatiskt vid nytt datum.
const USAGE = path.join(__dirname, "public", "ai-usage.json");
function bumpUsage() {
  const today = new Date().toISOString().slice(0, 10);
  let u = { date: today, count: 0 };
  try { const r = JSON.parse(fs.readFileSync(USAGE, "utf8")); if (r.date === today) u = r; } catch {}
  if (u.count >= AI_DAILY_CAP) return { ok: false, count: u.count };
  u.count++;
  try { fs.mkdirSync(path.dirname(USAGE), { recursive: true }); fs.writeFileSync(USAGE, JSON.stringify(u)); } catch {}
  return { ok: true, count: u.count };
}

function send(res, code, type, body) {
  res.writeHead(code, { "Content-Type": type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // --- AI-proxy: gömmer nyckeln server-side ---
  if (req.method === "POST" && req.url === "/api/explain") {
    if (!KEY) return send(res, 500, "application/json", JSON.stringify({ error: "ANTHROPIC_API_KEY saknas. Sätt den och starta om servern." }));
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", async () => {
      try {
        const cap = bumpUsage();
        if (!cap.ok) return send(res, 429, "application/json", JSON.stringify({ error: `Dagligt AI-tak (${AI_DAILY_CAP}) nått — skyddar din plånbok. Höj med AI_DAILY_CAP eller vänta till imorgon.` }));
        const { system, content } = JSON.parse(body || "{}");
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: AI_MODEL, max_tokens: 1000,
            system, messages: [{ role: "user", content }],
          }),
        });
        send(res, r.status, "application/json", await r.text());
      } catch (e) {
        send(res, 500, "application/json", JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // --- statiska filer ---
  let file = req.url === "/" ? "edgeai.html" : req.url.replace(/^\//, "");
  file = file.split("?")[0];
  if (file === "data.json") file = "public/data.json"; // sidan hämtar 'data.json'
  const full = path.join(__dirname, file);
  if (!full.startsWith(__dirname)) return send(res, 403, "text/plain", "Forbidden");

  fs.readFile(full, (err, buf) => {
    if (err) return send(res, 404, "text/plain", "Not found");
    const ext = path.extname(full);
    const type = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" }[ext] || "text/plain";
    send(res, 200, type, buf);
  });
});

server.listen(PORT, () => {
  console.log(`\n  EdgeAI körs på  http://localhost:${PORT}`);
  console.log(`  AI-proxy: ${KEY ? "aktiv ✓" : "AV (sätt ANTHROPIC_API_KEY)"}  ·  modell: ${AI_MODEL}  ·  dagstak: ${AI_DAILY_CAP} anrop`);
  console.log(`  Ctrl+C för att stoppa.\n`);
});
