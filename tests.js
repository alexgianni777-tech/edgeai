const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");

const SOURCE_FILES = [
  "build-data.js", "walkforward.js", "universe-validation.js", "portfolio-risk.js", "proposal-params.js",
  "screener.js", "strategy.js", "strategy-breakout.js", "strategy-bollinger.js",
  "strategy-momentum.js", "strategy-short.js", "strategy-big-short.js",
  "metrics.js", "montecarlo.js", "data-live.js", "notify.js", "validate-output.js", "server.js"
];

for (const file of SOURCE_FILES) {
  execFileSync(process.execPath, ["--check", path.join(__dirname, file)], { stdio: "pipe" });
}

// Parse every inline browser script so dashboard syntax errors fail CI too.
const fs = require("fs");
const html = fs.readFileSync(path.join(__dirname, "edgeai.html"), "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1].trim())
  .filter(Boolean);
assert.ok(inlineScripts.length > 0, "dashboard must contain inline scripts");
for (const script of inlineScripts) {
  assert.doesNotThrow(() => new Function(script), "inline browser scripts must parse");
}

const { normalizeQuotes } = require("./data-live");
const normalized = normalizeQuotes([
  { date: new Date("2026-01-02T00:00:00Z"), open: 100, high: 110, low: 90, close: 100, adjclose: 50 },
  { date: new Date("2026-01-02T12:00:00Z"), open: 102, high: 112, low: 92, close: 102, adjclose: 51 },
  { date: new Date("2026-01-03T00:00:00Z"), open: 52, high: 55, low: 50, close: 54, adjclose: 54 },
]);
assert.strictEqual(normalized.length, 2, "duplicate Yahoo event rows must collapse by trading date");
assert.ok(Math.abs(normalized[0].close - 51) < 1e-9, "adjclose factor must scale historical OHLC");
assert.ok(normalized[0].t < normalized[1].t, "normalized bars must be chronological");

const { sizePosition } = require("./screener");
assert.strictEqual(
  sizePosition({ entryRef: 100, stop: 110 }, 100000, 0.01),
  100,
  "short sizing must use absolute entry-stop risk"
);
assert.strictEqual(
  sizePosition({ entryRef: 100, stop: 90 }, 100000, 0.01),
  100,
  "long sizing must remain unchanged"
);

const { metrics } = require("./metrics");
const m = metrics([{ r: 1 }, { r: -1 }, { r: 2 }, { r: -0.5 }, { r: 1 }]);
assert.strictEqual(m.n, 5);
assert.ok(m.expectancyLow95 < m.expectancy && m.expectancyHigh95 > m.expectancy,
  "expectancy must expose uncertainty bounds");

const { buildCohorts, maxConcurrentTrades } = require("./portfolio-risk");
const cohortTrades = [
  { r: 1, t: "2026-01-02", signalT: "2026-01-01", exitT: "2026-01-05" },
  { r: -1, t: "2026-01-02", signalT: "2026-01-01", exitT: "2026-01-03" },
  { r: 2, t: "2026-01-04", signalT: "2026-01-03", exitT: "2026-01-06" },
];
const cohorts = buildCohorts(cohortTrades);
assert.strictEqual(cohorts.length, 2, "same-day signals must be grouped");
assert.strictEqual(cohorts[0].n, 2);
assert.strictEqual(cohorts[0].r, 0);
assert.ok(maxConcurrentTrades(cohortTrades) >= 2, "concurrent exposure must be measured");

const { monteCarlo } = require("./montecarlo");
const mc = monteCarlo([
  { date: "2026-01-01", r: -3, n: 3 },
  { date: "2026-01-02", r: 2, n: 2 },
], { riskPerTrade: 0.05, horizonTrades: 20, sims: 500, drawdownThreshold: 0.10, seed: 7 });
assert.ok(mc && Number.isFinite(mc.medianMaxDD));
assert.ok(mc.drawdownThresholdProb >= 0 && mc.drawdownThresholdProb <= 1,
  "drawdown probability must be a real probability");

const { validateUniverse } = require("./universe-validation");
const mkBars = (shift = 0) => Array.from({ length: 30 }, (_, i) => ({
  t: new Date(Date.UTC(2026, 0, i + 1)),
  open: 100 + shift + i,
  high: 101 + shift + i,
  low: 99 + shift + i,
  close: 100 + shift + i,
}));
const probe = {
  name: "market-probe",
  DEFAULT_PARAMS: { bias: 1 },
  GRID: [{ bias: 1 }, { bias: -1 }],
  runStrategy(series, params) {
    if (series.length < 6) return [];
    const trades = [];
    for (let i = 5; i < series.length; i += 4) {
      trades.push({
        entryIdx: i,
        t: series[i].t,
        signalT: series[i - 1].t,
        exitT: series[i].t,
        r: params.bias > 0 ? 0.5 : -0.5,
        held: 1,
      });
    }
    return trades;
  },
};
const uv = validateUniverse({ AAA: mkBars(0), BBB: mkBars(10) }, probe, {
  isLen: 12, oosLen: 6, step: 6, warmup: 5, minTrades: 2,
});
assert.ok(uv.windows.length >= 1, "market-level walk-forward should create windows");
assert.strictEqual(uv.params.bias, 1, "live params must come from the latest market-level IS selection");
assert.ok(uv.oosTrades.length > 0, "market-level walk-forward should produce OOS trades");
assert.ok(uv.oosTrades.every(t => t.ticker === "AAA" || t.ticker === "BBB"),
  "OOS trades must retain ticker identity");

console.log("EdgeAI regression tests passed");
