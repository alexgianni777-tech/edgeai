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
const { validateUniverse } = require("./universe-validation");
const { metrics } = require("./metrics");
const { monteCarlo } = require("./montecarlo");
const { screen } = require("./screener");
const { buildCohorts, maxConcurrentTrades, realizedDrawdownR } = require("./portfolio-risk");
const { legacyVotedParams, uniqueParamSets } = require("./proposal-params");

const demo = process.argv.includes("--demo");
const ACCOUNT = 100000, RISK = 0.01;
const round = (x, d = 2) => +(+x).toFixed(d);
const pfOut = x => Number.isFinite(x) ? round(x) : (x === Infinity ? 99 : 0);
const median = arr => { if (!arr.length) return null; const a = arr.slice().sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const percentile = (arr, p) => {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y);
  const idx = (a.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (idx - lo);
};
function executionDriftStats(trades = []) {
  const gaps = trades
    .filter(t => Number(t.signalRef) > 0 && Number.isFinite(Number(t.entryPrice)))
    .map(t => ((Number(t.entryPrice) - Number(t.signalRef)) / Number(t.signalRef)) * 100);
  const abs = gaps.map(Math.abs);
  return {
    n: gaps.length,
    medianGapPct: round(median(gaps) ?? 0, 2),
    medianAbsGapPct: round(median(abs) ?? 0, 2),
    p90AbsGapPct: round(percentile(abs, 0.90) ?? 0, 2),
  };
}
const sizeFor = (e, s) => (Math.abs(e - s) > 0 ? Math.floor((ACCOUNT * RISK) / Math.abs(e - s)) : 0);
const dateKey = t => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

// Publish only after every ticker and index has the same latest completed
// market session. The index itself defines the session date, so exchange
// holidays do not look like missing data.
function latestAllowedDate(key, at = new Date()) {
  const zone = key === "SE" ? "Europe/Stockholm" : "America/New_York";
  const cutoff = key === "SE" ? 19 * 60 : 17 * 60 + 30; // close + settlement buffer
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(at).map(p => [p.type, p.value]));
  const day = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
  if (Number(parts.hour) * 60 + Number(parts.minute) < cutoff) {
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return day.toISOString().slice(0, 10);
}

function assertCompleteDailyBars(key, tickers, universe, indexSymbol, indexBars, at = new Date()) {
  const allowed = latestAllowedDate(key, at);
  const dateOf = bars => {
    const last = bars && bars[bars.length - 1];
    return last ? dateKey(last.t) : null;
  };

  const indexDate = dateOf(indexBars);
  if (!indexDate) throw new Error(`[DATA_NOT_READY] ${key} saknar indexdata för ${indexSymbol}`);
  if (indexDate > allowed) throw new Error(`[DATA_NOT_READY] ${key} index innehåller en ofullständig framtida/session-bar ${indexDate}`);

  const ageDays = Math.floor((Date.parse(allowed) - Date.parse(indexDate)) / 86400000);
  if (ageDays > 6) {
    throw new Error(`[DATA_NOT_READY] ${key} senaste verifierade session ${indexDate} är för gammal`);
  }

  const mismatches = [];
  for (const ticker of tickers) {
    const actual = dateOf(universe[ticker]);
    if (actual !== indexDate) mismatches.push(`${ticker}=${actual || "saknas"}`);
  }
  if (mismatches.length) {
    throw new Error(
      `[DATA_NOT_READY] ${key} kräver samma avslutade session som index (${indexDate}), ` +
      `men ${mismatches.length} symboler avviker: ${mismatches.slice(0, 12).join(", ")}`
    );
  }

  console.log(`  [${key}] verifierade dagskurser för ${indexDate} (${tickers.length} aktier + index)`);
  return indexDate;
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
  indexBars.forEach((b, i) => { const k = dateKey(b.t); if (k) map[k] = ma[i] == null ? true : b.close > ma[i]; });
  const last = indexBars.length - 1;
  const on = ma[last] == null ? true : closes[last] > ma[last];
  return { map, on };
}

// ---- Point-in-time relative strength for OOS validation ----
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
    const startMs = new Date(startT).getTime();
    if (!Number.isFinite(startMs)) continue;
    const future = bars.filter(b => new Date(b.t).getTime() > startMs);
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
      const grossR = isShort ? (row.entry - exit) / risk : (exit - row.entry) / risk;
      const roundTripCostR = ((Number(row.costRate || 0) * 2) * row.entry) / risk;
      row.r = round(grossR - roundTripCostR);
      row.status = "closed";
      row.closedAt = String(exitBar?.t || new Date().toISOString());
    }
  }

  // Signal identity is immutable: ticker + setup + actual signal bar.
  // A closed signal can never be re-added just because freshness spans 7 bars.
  const knownSignals = new Set(rows.map(r => r.signalId).filter(Boolean));
  for (const s of setups) {
    const signalT = s.signalT || null;
    const signalDate = signalT ? dateKey(signalT) : null;
    const signalId = [s.ticker, s.setup, signalDate].join("|");
    if (!signalDate || knownSignals.has(signalId)) continue;
    rows.push({
      signalId, ledgerVersion: 2,
      ticker: s.ticker, setup: s.setup, dir: s.dir ?? "long",
      entry: s.entry, stop: s.stop, target: s.target,
      signalT, barT: signalT, maxBars: s.maxBars ?? 20,
      costRate: Number(s.costRate || 0),
      ledgerMode: s.ledgerMode || "published-levels",
      status: "open", loggedAt: new Date().toISOString(), r: null,
    });
    knownSignals.add(signalId);
  }

  fs.writeFileSync(ledgerPath, JSON.stringify(rows, null, 2));
  return rows.filter(r => r.status === "closed" && r.ledgerVersion === 2);
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
        const expected = latestAllowedDate(key);
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
    // Use the exact deployment filters during both IS parameter selection
    // and unseen OOS evaluation. This closes the "optimise one strategy,
    // deploy another" gap without changing the proposal mechanism.
    const isShort = strat.dir === "short";
    const deploymentFilter = t => {
      const signalDay = dateKey(t.signalT || t.t);
      if (!signalDay) return false;
      if (!isShort && regime.map[signalDay] !== true) return false;
      const rank = historicalRsRank(universe, t.ticker, t.signalT || t.t, rsHistoryCache);
      if (rank == null) return false;
      if (isShort) return rank <= (strat.shortRsMax ?? 35);
      if (/momentum/i.test(strat.name)) return rank >= 60;
      return true;
    };
    const v = validateUniverse(universe, strat, {
      calendarDates: indexBars.map(b => b.t),
      tradeFilter: deploymentFilter,
    });
    const legacyParams = legacyVotedParams(universe, strat);
    const filtered = v.oosTrades.slice().sort((a, b) => new Date(a.t) - new Date(b.t));

    const fm = metrics(filtered);
    const filteredWindowMetrics = (v.windows || []).map(w => {
      const trades = filtered.filter(t => {
        const d = dateKey(t.t);
        return d && d >= w.from && d <= w.to;
      });
      return metrics(trades);
    }).filter(x => (x.n ?? 0) > 0);
    const positiveWindows = filteredWindowMetrics.filter(x => (x.expectancy ?? 0) > 0).length;
    const positiveWindowRate = filteredWindowMetrics.length
      ? positiveWindows / filteredWindowMetrics.length
      : 0;
    const stratHolds =
      (fm.n ?? 0) >= 30 &&
      (fm.expectancy ?? 0) > 0.03 &&
      (fm.profitFactor ?? 0) > 1.1 &&
      (fm.expectancyLow95 ?? -Infinity) > -0.05 &&
      positiveWindowRate >= 0.5;
    const promising =
      !stratHolds &&
      (fm.n ?? 0) >= 20 &&
      (fm.expectancy ?? 0) > 0 &&
      (fm.profitFactor ?? 0) > 1;

    if (stratHolds) pooledOOS.push(...filtered);
    stratParams.push({
      strat, params: v.params, proposalParams: legacyParams, m: fm, trades: filtered, holds: stratHolds,
      promising, windows: v.windows || [], evaluatedWindows: filteredWindowMetrics.length, positiveWindowRate,
    });

    const winHeld = filtered.filter(t => t.r > 0 && t.held != null).map(t => t.held);
    const typicalDays = median(winHeld) ?? median(filtered.map(t => t.held).filter(h => h != null));

    // Candidate generation is deliberately broader than validation.
    // Legacy voted params run first so hardening cannot silently delete the
    // proposals users already rely on; market-level params may add candidates.
    const proposalSets = uniqueParamSets([
      { source: "legacy-vote", params: legacyParams },
      { source: "market-wf", params: v.params },
    ]);
    const proposalMap = new Map();

    for (const pset of proposalSets) {
      const mergedParams = { ...(strat.DEFAULT_PARAMS || {}), ...(pset.params || {}) };
      const raw = screen(universe, fm, pset.params, 7, strat).map(s => ({
        dir: isShort ? "short" : "long",
        ticker: s.ticker, setup: s.setup,
        grade: stratHolds ? "A" : (promising ? "B" : "WATCH"),
        evidenceStatus: stratHolds ? "VALIDATED" : (promising ? "PROMISING" : "WATCH"),
        validatedEdge: stratHolds,
        regimeAligned: isShort ? true : regime.on,
        proposalSource: pset.source,
        signalT: s.signalT,
        barsAgo: s.barsAgo, typicalDays,
        rs: rsRank[s.ticker] ?? 50,
        entry: s.entryRef, stop: s.stop, target: s.target, rr: s.rr,
        maxBars: mergedParams.maxBars ?? 20,
        costRate: (mergedParams.courtage ?? 0) + (mergedParams.slippage ?? 0),
        ledgerMode: "published-levels",
        size: sizeFor(s.entryRef, s.stop), edge: s.edge,
        above200: (() => {
          const b = universe[s.ticker] || [];
          const closes = b.map(x => x.close);
          const ma = sma(closes, 200);
          const i = b.length - 1;
          return i >= 0 && ma[i] != null ? closes[i] > ma[i] : true;
        })(),
        chart: (universe[s.ticker] || []).slice(-22).map(b => ({
          o: round(b.open), h: round(b.high), l: round(b.low), c: round(b.close)
        })),
      }));

      const gated = isShort
        ? raw.filter(x => (x.rs ?? 50) <= (strat.shortRsMax ?? 35))
        : /momentum/i.test(strat.name)
          ? raw.filter(x => (x.rs ?? 50) >= 60)
          : raw;

      for (const s of gated) {
        const key = s.ticker + "|" + s.setup;
        if (!proposalMap.has(key)) proposalMap.set(key, s);
      }
    }
    allSetups.push(...proposalMap.values());
  }

  // Chronological ordering is required for any path-dependent metric such as DD.
  pooledOOS.sort((a, b) => new Date(a.t) - new Date(b.t));
  const m = metrics(pooledOOS);
  let eq = 0;
  const equityCurve = pooledOOS.map(t => { eq += t.r; return round(eq); });
  const setups = allSetups;

  // Portfolio-aware risk: same-day signals are bootstrapped together.
  const cohorts = buildCohorts(pooledOOS);
  const mc = monteCarlo(cohorts, {
    riskPerTrade: 0.01,
    horizonTrades: 100,
    ruinLevel: 0.75,
    drawdownThreshold: 0.25,
    sims: 5000,
  });
  const risk = mc ? {
    riskPerTrade: 1,
    horizon: 100,
    model: "signal-cohort bootstrap",
    cohortCount: cohorts.length,
    maxConcurrentTrades: maxConcurrentTrades(pooledOOS),
    medianMaxDD: round(mc.medianMaxDD * 100, 1),
    p95MaxDD: round(mc.p95MaxDD * 100, 1),
    medianReturn: round(mc.medianReturn * 100, 1),
    drawdown25Prob: round(mc.drawdownThresholdProb * 100, 1),
    ruinProb: round(mc.ruinProb * 100, 1),
  } : null;

  // 4) proposal ledger: only immutable v2 proposal outcomes are displayed
  const ledgerPath = path.join(__dirname, "public", `ledger-${key}.json`);
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  const closed = updateLedger(ledgerPath, universe, setups);
  const closedChronological = closed.slice().sort((a, b) =>
    new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
  );
  const trackRecord = closedChronological.slice(0, 8).map(r => ({
    ticker: r.ticker, setup: r.setup, r: r.r
  }));
  const ledgerWins = closed.filter(r => Number(r.r) > 0).length;
  const trackRecordSummary = {
    closed: closed.length,
    wins: ledgerWins,
    losses: closed.length - ledgerWins,
    winRate: closed.length ? round((ledgerWins / closed.length) * 100, 1) : 0,
    netR: round(closed.reduce((sum, r) => sum + (Number(r.r) || 0), 0), 2),
    costAdjusted: true,
    basis: "displayed proposal levels, forward-resolved, round-trip costs deducted",
  };

  // per-strategi-sammanfattning (för loggning)
  const strategies = stratParams.map(sp => {
    let seq = 0;
    return {
      name: sp.strat.name,
      expectancyR: round(sp.m.expectancy ?? 0),
      winRate: Math.round((sp.m.winRate ?? 0) * 100),
      profitFactor: pfOut(sp.m.profitFactor ?? 0),
      n: sp.m.n ?? 0,
      holds: sp.holds,
      evidenceStatus: sp.holds ? "VALIDATED" : (sp.promising ? "PROMISING" : "WATCH"),
      expectancyLow95: round(sp.m.expectancyLow95 ?? 0),
      expectancyHigh95: round(sp.m.expectancyHigh95 ?? 0),
      positiveWindowRate: round((sp.positiveWindowRate ?? 0) * 100, 0),
      walkForwardWindows: sp.evaluatedWindows ?? sp.windows?.length ?? 0,
      executionDrift: executionDriftStats(sp.trades),
      params: sp.params,
      proposalParams: sp.proposalParams,
      equityCurve: sp.trades.map(t => { seq += t.r; return round(seq); }),
    };
  });

  return {
    label, currency, dataAsOf,
    edge: {
      expectancyR: round(m.expectancy ?? 0), winRate: Math.round((m.winRate ?? 0) * 100),
      profitFactor: pfOut(m.profitFactor ?? 0), maxDDR: round(-realizedDrawdownR(pooledOOS), 1),
      expectancyLow95: round(m.expectancyLow95 ?? 0),
      expectancyHigh95: round(m.expectancyHigh95 ?? 0),
      n: m.n ?? 0, oosLabel: "market-level calendar-aligned walk-forward (OOS)",
      holds: stratParams.some(sp => sp.holds),
      validatedStrategies: stratParams.filter(sp => sp.holds).length,
      promisingStrategies: stratParams.filter(sp => sp.promising).length,
    },
    strategies,
    regime: { on: regime.on, label: regime.on ? "risk-on" : "risk-off", basis: "index vs 200-day average", breadth },
    risk,
    validation: {
      procedure: "market-level calendar-aligned walk-forward; deployment filters applied in IS and OOS",
      rs: "point-in-time cross-sectional 63-session rank, applied in IS and OOS",
      regime: "signal-bar index close vs SMA200, applied in IS and OOS",
      executionReference: "proposal levels anchored to latest completed close; OOS fills use next-session open",
      executionDrift: executionDriftStats(pooledOOS),
      caveats: [
        "Historical validation uses the current/curated universe; survivorship bias is not fully eliminated.",
        "Drawdown uses realized exits rather than mark-to-market equity and can understate intratrade drawdown.",
        "Daily OHLC cannot reveal intraday ordering beyond the conservative stop-first rule when both stop and target are touched.",
      ],
    },
    rTrades: pooledOOS.map(t => round(t.r)),
    rClusters: cohorts.map(x => ({ date: x.date, r: round(x.r), n: x.n })),
    ranking: {
      method: "heuristic evidence-tier + trend + expectancy + R:R + RS + freshness",
      validated: false,
      note: "Ranking orders proposals; it is not itself a separately validated alpha model.",
    },
    equityCurve, setups, trackRecord, trackRecordSummary, trackRecordSource: "proposal-ledger-v2",
  };
}

(async () => {
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
    mk.strategies.forEach(s => console.log(`      - [${s.evidenceStatus}] ${s.name}: ${s.expectancyR}R ${s.winRate}% PF${s.profitFactor} n=${s.n} · WF+ ${s.positiveWindowRate}% · gap|med ${s.executionDrift?.medianAbsGapPct ?? 0}%`));
  }
})();
