// build-data.js — bygger public/data.json som hemsidan läser.
// Förfinad: ÄKTA walk-forward-validering per marknad, walk-forward-valda
// parametrar för screeningen, och ett VÄXANDE track record-ledger som
// resolvar gamla signaler och loggar nya för varje körning.
//
//   node build-data.js          -> RIKTIG data (Yahoo) — kör på din maskin
//   node build-data.js --demo   -> syntetisk demodata (funkar var som helst)

const fs = require("fs");
const path = require("path");
const { genSynthetic } = require("./data");
const { runStrategy, DEFAULT_PARAMS } = require("./strategy");
const { walkForward } = require("./walkforward");
const { metrics } = require("./metrics");
const { monteCarlo } = require("./montecarlo");
const { screen } = require("./screener");

const demo = process.argv.includes("--demo");
const ACCOUNT = 100000, RISK = 0.01;
const round = (x, d = 2) => +(+x).toFixed(d);
const median = arr => { if (!arr.length) return null; const a = arr.slice().sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); };
const sizeFor = (e, s) => (Math.abs(e - s) > 0 ? Math.floor((ACCOUNT * RISK) / Math.abs(e - s)) : 0);

// Publish only after every ticker and index has the last completed daily candle.
    // Allow 90 minutes after each market's close for the final bar to settle.
    function expectedClosedSession(key, at = new Date()) {
      const zone = key === 'SE' ? 'Europe/Stockholm' : 'America/New_York';
      const cutoff = key === 'SE' ? 19 * 60 : 17 * 60 + 30;
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(at).map(p => [p.type, p.value]));
      const day = new Date([parts.year, parts.month, parts.day].join('-') + 'T00:00:00Z');
      if (Number(parts.hour) * 60 + Number(parts.minute) < cutoff) day.setUTCDate(day.getUTCDate() - 1);
      while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() - 1);
      return day.toISOString().slice(0, 10);
    }
    function assertCompleteDailyBars(key, tickers, universe, indexSymbol, indexBars, at = new Date()) {
      const expected = expectedClosedSession(key, at);
      const dateOf = bars => {
        const last = bars && bars[bars.length - 1];
        const date = last && new Date(last.t);
        return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : 'saknas';
      };
      const mismatches = [];
      const indexDate = dateOf(indexBars);
      if (indexDate !== expected) mismatches.push(indexSymbol + '=' + indexDate);
      for (const ticker of tickers) {
        const actual = dateOf(universe[ticker]);
        if (actual !== expected) mismatches.push(ticker + '=' + actual);
      }
      if (mismatches.length) throw new Error('[DATA_NOT_READY] ' + key + ' behöver kompletta dagskurser ' + expected + ', men ' + mismatches.length + ' symboler saknas/är gamla: ' + mismatches.slice(0, 12).join(', '));
      console.log('  [' + key + '] verifierade dagskurser för ' + expected + ' (' + tickers.length + ' aktier + index)');
      return expected;
    }
    
// ---- Marknadsregim: handla bara när indexet självt trendar (close > SMA200) ----
function sma(vals, p) {
  const out = new Array(vals.length).fill(null);
  let sum = 0;
  for (let i = 0; i < vals.length; i++) {
    sum += vals[i];
    if (i >= p) sum -= vals[i - p];
    if (i >= p - 1) out[i] = sum / p;
  }
  return out;
}
function regimeFrom(indexBars, period = 200) {
  const closes = indexBars.map(b => b.close);
  const ma = sma(closes, period);
  const map = {};
  indexBars.forEach((b, i) => { map[String(b.t)] = ma[i] == null ? true : b.close > ma[i]; });
  const last = indexBars.length - 1;
  const on = ma[last] == null ? true : closes[last] > ma[last];
  return { map, on };
}

// ---- ÄKTA walk-forward över ett helt universum, för EN strategi ----
function validateUniverse(universe, strat, isLen = 378, oosLen = 126) {
  const pooled = [];
  const votes = {};
  for (const [tk, bars] of Object.entries(universe)) {
    if (bars.length < isLen + oosLen + 10) continue;
    const wf = walkForward(bars, { isLen, oosLen, step: oosLen }, strat);
    wf.oosTrades.forEach(t => pooled.push({ ...t, ticker: tk }));
    if (wf.windows.length) {
      const key = JSON.stringify(wf.windows[wf.windows.length - 1].params);
      votes[key] = (votes[key] || 0) + 1;
    }
  }
  let best = null, bestN = -1;
  for (const [k, n] of Object.entries(votes)) if (n > bestN) { bestN = n; best = k; }
  const params = best ? JSON.parse(best) : strat.DEFAULT_PARAMS;
  return { oosTrades: pooled, m: metrics(pooled), params };
}

// ---- Point-in-time relative strength for OOS validation ----
const dateKey = t => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function historicalRsRank(universe, ticker, at, cache) {
  const day = dateKey(at);
  if (!day) return null;
  if (!cache.has(day)) {
    const rets = [];
    for (const [tk, bars] of Object.entries(universe)) {
      const idx = bars.findIndex(b => dateKey(b.t) === day);
      if (idx >= 63) {
        const prev = bars[idx - 63]?.close;
        const cur = bars[idx]?.close;
        if (prev > 0 && cur > 0) rets.push([tk, cur / prev - 1]);
      }
    }
    rets.sort((a, b) => a[1] - b[1]);
    const ranks = {};
    rets.forEach(([tk], i) => {
      ranks[tk] = rets.length > 1 ? Math.round((i / (rets.length - 1)) * 100) : 50;
    });
    cache.set(day, ranks);
  }
  return cache.get(day)[ticker] ?? null;
}

// ---- Växande track record-ledger (resolvar öppna, loggar nya) ----
function updateLedger(ledgerPath, universe, setups) {
  let rows = [];
  try { rows = JSON.parse(fs.readFileSync(ledgerPath, "utf8")); } catch {}

  // Remove exact historical duplicates without rewriting unique legacy rows.
  const seenLegacy = new Set();
  rows = rows.filter(row => {
    const key = row.signalId || [
      row.ticker, row.setup, row.entry, row.stop, row.target, row.signalT || row.barT
    ].join("|");
    if (seenLegacy.has(key)) return false;
    seenLegacy.add(key);
    return true;
  });

  // Resolve only from bars AFTER the signal close. New v2 rows therefore
  // represent the same "yesterday close -> next-session proposal" shown live.
  for (const row of rows) {
    if (row.status !== "open") continue;
    const bars = universe[row.ticker];
    if (!bars) continue;
    const isShort = row.dir === "short";
    const risk = Math.abs(row.entry - row.stop);
    if (risk <= 0) continue;

    const startT = row.signalT || row.barT;
    const future = bars.filter(b => String(b.t) > String(startT));
    const maxBars = Math.max(1, Number(row.maxBars || 20));
    let exit = null, exitBar = null;
    const observed = future.slice(0, maxBars);

    for (const b of observed) {
      if (isShort) {
        if (b.high >= row.stop) { exit = row.stop; exitBar = b; break; }
        if (b.low <= row.target) { exit = row.target; exitBar = b; break; }
      } else {
        if (b.low <= row.stop) { exit = row.stop; exitBar = b; break; }
        if (b.high >= row.target) { exit = row.target; exitBar = b; break; }
      }
    }

    // Time-stop when the full holding window has elapsed.
    if (exit == null && future.length >= maxBars && observed.length) {
      exitBar = observed[observed.length - 1];
      exit = exitBar.close;
    }

    if (exit != null) {
      row.r = round(isShort ? (row.entry - exit) / risk : (exit - row.entry) / risk);
      row.status = "closed";
      row.closedAt = String(exitBar?.t || new Date().toISOString());
    }
  }

  // Signal identity is immutable: ticker + setup + actual signal bar.
  // A closed signal can never be re-added just because freshness spans 7 bars.
  const knownSignals = new Set(rows.map(r => r.signalId).filter(Boolean));
  for (const s of setups) {
    const signalT = s.signalT || null;
    const signalId = [s.ticker, s.setup, signalT].join("|");
    if (!signalT || knownSignals.has(signalId)) continue;
    rows.push({
      signalId, ledgerVersion: 2,
      ticker: s.ticker, setup: s.setup, dir: s.dir ?? "long",
      entry: s.entry, stop: s.stop, target: s.target,
      signalT, barT: signalT, maxBars: s.maxBars ?? 20,
      status: "open", loggedAt: new Date().toISOString(), r: null,
    });
    knownSignals.add(signalId);
  }

  fs.writeFileSync(ledgerPath, JSON.stringify(rows, null, 2));
  return rows.filter(r => r.status === "closed" && r.ledgerVersion === 2);
}

// fallback: härleda ett trovärdigt track record från backtest (för demo/tomt ledger)
function backtestTrack(universe, strategiesWithParams) {
  const recent = [];
  for (const { strat, params } of strategiesWithParams) {
    for (const [tk, bars] of Object.entries(universe)) {
      strat.runStrategy(bars, params).slice(-1).forEach(x =>
        recent.push({ ticker: tk, setup: strat.name, r: round(x.r), order: x.entryIdx }));
    }
  }
  recent.sort((a, b) => b.order - a.order);
  return recent.slice(0, 8).map(r => ({ ticker: r.ticker, setup: r.setup, r: r.r }));
}

async function buildMarket({ key, label, currency, realTickers, demoTickers, demoEdge, demoSeed, indexSymbol, demoIndexSeed }) {
  // universum + index
  let universe = {};
  let indexBars = null;
  if (demo) {
    demoTickers.forEach((tk, i) => {
      let bars = genSynthetic(700, demoSeed + i * 7, demoEdge);
      const target = 45 + ((i * 53 + 17) % 340);
      const scale = target / bars[bars.length - 1].close;
      bars = bars.map(b => ({ t: b.t, open: b.open * scale, high: b.high * scale, low: b.low * scale, close: b.close * scale }));
      universe[tk] = bars;
    });
    indexBars = genSynthetic(700, demoIndexSeed, 1.4); // uppåttrendande "index"
  } else {
    const { loadBars, loadUniverse } = require("./data-live");
    console.log(`  [${label}] hämtar ${realTickers.length} tickers + index ${indexSymbol} ...`);
    universe = await loadUniverse(realTickers, { years: 3 });
    try { indexBars = await loadBars(indexSymbol, { years: 3 }); } catch (e) { console.error("  (index-fel)", e.message); }
  }
  // Yahoo can already include today's *incomplete* candle during market hours.
      // Remove it before both validation and strategy calculations; yesterday's
      // complete bar can still be used if every symbol has it.
      if (!demo) {
        const expected = expectedClosedSession(key);
        const completedOnly = bars => (bars || []).filter(bar => {
          const date = new Date(bar.t);
          if (Number.isNaN(date.getTime())) throw new Error('Ogiltigt Yahoo-kursdatum för ' + key);
          return date.toISOString().slice(0, 10) <= expected;
        });
        for (const ticker of Object.keys(universe)) universe[ticker] = completedOnly(universe[ticker]);
        indexBars = completedOnly(indexBars);
      }
      const dataAsOf = demo ? null : assertCompleteDailyBars(key, realTickers, universe, indexSymbol, indexBars);
  const regime = indexBars && indexBars.length > 200 ? regimeFrom(indexBars) : { map: {}, on: true };

  // 1-3) Validera + screena VARJE strategi för sig (oberoende edge), slå ihop
  const STRATS = [require("./strategy"), require("./strategy-breakout"), require("./strategy-bollinger"), require("./strategy-momentum"), require("./strategy-short"), require("./strategy-big-short")];
  const pooledOOS = [];
  let allSetups = [];
  // ── Relative strength (63d avkastning, percentilrankad över universum) + bredd ──
  const relRets = {};
  let above = 0, total = 0;
  for (const [tk, b] of Object.entries(universe)) {
    const n = b.length;
    if (n > 63) relRets[tk] = b[n - 1].close / b[n - 64].close - 1;
    const c = b.map(x => x.close), ma = sma(c, 200);
    if (n > 0 && ma[n - 1] != null) { total++; if (c[n - 1] > ma[n - 1]) above++; }
  }
  const rsSorted = Object.entries(relRets).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  const rsRank = {};
  rsSorted.forEach((tk, i) => { rsRank[tk] = rsSorted.length > 1 ? Math.round((i / (rsSorted.length - 1)) * 100) : 50; });
  const breadth = total ? Math.round((above / total) * 100) : null;
  const rsHistoryCache = new Map();

  const stratParams = [];
  for (const strat of STRATS) {
    const v = validateUniverse(universe, strat);
    // Validation uses only information known on the SIGNAL bar. The live
    // proposal remains yesterday's close and is intentionally not changed.
    const isShort = strat.dir === "short";
    const regimeFiltered = v.oosTrades.filter(t =>
      isShort || regime.map[String(t.signalT || t.t)] !== false
    );

    // Validate the same point-in-time RS gate that is used live.
    const filtered = regimeFiltered.filter(t => {
      const rank = historicalRsRank(universe, t.ticker, t.signalT || t.t, rsHistoryCache);
      if (rank == null) return false;
      if (isShort) return rank <= (strat.shortRsMax ?? 35);
      if (/momentum/i.test(strat.name)) return rank >= 60;
      return true;
    }).sort((a, b) => new Date(a.t) - new Date(b.t));

    const fm = metrics(filtered);
    const stratHolds =
      (fm.n ?? 0) >= 30 &&
      (fm.expectancy ?? 0) > 0.03 &&
      (fm.profitFactor ?? 0) > 1.1;

    if (stratHolds) pooledOOS.push(...filtered);
    stratParams.push({ strat, params: v.params, m: fm, trades: filtered, holds: stratHolds });

    const winHeld = filtered.filter(t => t.r > 0 && t.held != null).map(t => t.held);
    const typicalDays = median(winHeld) ?? median(filtered.map(t => t.held).filter(h => h != null));

    // IMPORTANT: proposals are never removed merely because validation is weak.
    // A weak/negative strategy remains visible as WATCH; "validatedEdge" tells
    // consumers whether its OOS evidence currently passes the quality gate.
    const mergedParams = { ...(strat.DEFAULT_PARAMS || {}), ...(v.params || {}) };
    const setups = screen(universe, fm, v.params, 7, strat).map(s => ({
      dir: isShort ? "short" : "long",
      ticker: s.ticker, setup: s.setup,
      grade: stratHolds ? "A" : "WATCH",
      validatedEdge: stratHolds,
      regimeAligned: isShort ? true : regime.on,
      signalT: s.signalT,
      barsAgo: s.barsAgo, typicalDays,
      rs: rsRank[s.ticker] ?? 50,
      entry: s.entryRef, stop: s.stop, target: s.target, rr: s.rr,
      maxBars: mergedParams.maxBars ?? 20,
      size: sizeFor(s.entryRef, s.stop), edge: s.edge,
      above200: (() => { const b = universe[s.ticker] || []; const c = b.map(x => x.close); const ma = sma(c, 200); const i = b.length - 1; return i >= 0 && ma[i] != null ? c[i] > ma[i] : true; })(),
      chart: (universe[s.ticker] || []).slice(-22).map(b => ({ o: round(b.open), h: round(b.high), l: round(b.low), c: round(b.close) })),
    }));
    // Momentum handlar bara ledare. Burry-filtret handlar bara laggards:
    // den nedre tredjedelen av 63-dagars relativ styrka i respektive marknad.
    const gated = isShort
      ? setups.filter(x => (x.rs ?? 50) <= (strat.shortRsMax ?? 35))
      : /momentum/i.test(strat.name)
        ? setups.filter(x => (x.rs ?? 50) >= 60)
        : setups;
    allSetups.push(...gated);
  }

  // Chronological ordering is required for any path-dependent metric such as DD.
  pooledOOS.sort((a, b) => new Date(a.t) - new Date(b.t));
  const m = metrics(pooledOOS);
  let eq = 0;
  const equityCurve = pooledOOS.map(t => { eq += t.r; return round(eq); });
  const setups = allSetups;

  // Monte Carlo-riskprofil: vad ska man vänta sig vid 1% risk över 100 trades?
  const mc = monteCarlo(pooledOOS, { riskPerTrade: 0.01, horizon: 100, ruinLevel: 0.75, sims: 5000 });
  const risk = mc ? {
    riskPerTrade: 1, horizon: 100,
    medianMaxDD: round(mc.medianMaxDD * 100, 1),
    p95MaxDD: round(mc.p95MaxDD * 100, 1),
    medianReturn: round(mc.medianReturn * 100, 1),
    drawdown25Prob: round(mc.ruinProb * 100, 1),
  } : null;

  // 4) track record: växande ledger (per ticker+setup); fall tillbaka på backtest
  const ledgerPath = path.join(__dirname, "public", `ledger-${key}.json`);
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  const closed = updateLedger(ledgerPath, universe, setups);
  const trackRecord = closed.slice(-8).reverse().map(r => ({
    ticker: r.ticker, setup: r.setup, r: r.r
  }));

  // per-strategi-sammanfattning (för loggning)
  const strategies = stratParams.map(sp => {
    let seq = 0;
    return {
      name: sp.strat.name,
      expectancyR: round(sp.m.expectancy ?? 0),
      winRate: Math.round((sp.m.winRate ?? 0) * 100),
      profitFactor: round(sp.m.profitFactor ?? 0),
      n: sp.m.n ?? 0,
      holds: sp.holds,
      params: sp.params,
      equityCurve: sp.trades.map(t => { seq += t.r; return round(seq); }),
    };
  });

  return {
    label, currency, dataAsOf,
    edge: {
      expectancyR: round(m.expectancy ?? 0), winRate: Math.round((m.winRate ?? 0) * 100),
      profitFactor: round(m.profitFactor ?? 0), maxDDR: round(-(m.maxDD_R ?? 0), 1),
      n: m.n ?? 0, oosLabel: "walk-forward (OOS)",
      holds: (m.n ?? 0) >= 30 && (m.expectancy ?? 0) > 0.05 && (m.profitFactor ?? 0) > 1.15,
    },
    strategies,
    regime: { on: regime.on, label: regime.on ? "risk-on" : "risk-off", basis: "index vs 200-day average", breadth },
    risk,
    rTrades: pooledOOS.map(t => round(t.r)),
    equityCurve, setups, trackRecord, trackRecordSource: "live-ledger-v2",
  };
}

(async () => {
      if (!demo) {
        const day = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(new Date());
        if (fs.existsSync(path.join(__dirname, 'sent-digests', day + '.json'))) {
          console.log('EdgeAI-digest redan levererad för ' + day + ' — ingen ny signal skapas');
          return;
        }
      }
      const dl = require("./data-live");
  const US = await buildMarket({
    key: "US", label: "United States", currency: "$",
    realTickers: demo ? [] : dl.US_LARGE, demoTickers: dl.US_LARGE, demoEdge: 0.9, demoSeed: 300,
    indexSymbol: dl.US_INDEX, demoIndexSeed: 9001,
  });
  const SE = await buildMarket({
    key: "SE", label: "Sweden", currency: "kr",
    realTickers: demo ? [] : dl.OMXS30, demoTickers: dl.OMXS30.map(t => t.replace(".ST", "")), demoEdge: 0.8, demoSeed: 600,
    indexSymbol: dl.SE_INDEX, demoIndexSeed: 9002,
  });

  const out = { generatedAt: new Date().toISOString(), demo, markets: { US, SE } };
  const dir = path.join(__dirname, "public");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify(out, null, 2));
  console.log(`Skrev public/data.json (demo=${demo})`);
  for (const k of ["US", "SE"]) {
    const mk = out.markets[k];
    console.log(`  ${k}: regime ${mk.regime.label} · combined ${mk.edge.expectancyR}R ${mk.edge.winRate}% PF${mk.edge.profitFactor} n=${mk.edge.n} holds=${mk.edge.holds} · ${mk.setups.length} setups`);
    mk.strategies.forEach(s => console.log(`      - ${s.name}: ${s.expectancyR}R ${s.winRate}% n=${s.n}`));
  }
})();
