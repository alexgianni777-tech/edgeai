const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");

const SOURCE_FILES = [
  "build-data.js", "walkforward.js", "screener.js", "strategy.js",
  "strategy-breakout.js", "strategy-bollinger.js", "strategy-momentum.js",
  "strategy-short.js", "strategy-big-short.js", "metrics.js", "montecarlo.js",
  "data-live.js", "notify.js", "server.js"
];

for (const file of SOURCE_FILES) {
  execFileSync(process.execPath, ["--check", path.join(__dirname, file)], { stdio: "pipe" });
}

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

const { walkForward } = require("./walkforward");
const bars = Array.from({ length: 20 }, (_, i) => ({
  t: new Date(Date.UTC(2026, 0, i + 1)),
  open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i,
}));
const warmupProbe = {
  name: "warmup-probe",
  GRID: [{ ok: true }],
  DEFAULT_PARAMS: { ok: true },
  runStrategy(series) {
    if (series.length < 10) return [];
    // Six IS trades satisfy pickBestParams; on the warm OOS slice, the
    // final synthetic trade lands inside the true OOS segment.
    const n = Math.min(6, series.length - 4);
    return Array.from({ length: n }, (_, j) => {
      const idx = Math.max(1, series.length - n + j);
      return {
        entryIdx: idx,
        t: series[idx].t,
        signalT: series[idx - 1].t,
        exitT: series[idx].t,
        r: 0.2,
        held: 1,
      };
    });
  },
};
const wf = walkForward(bars, { isLen: 10, oosLen: 5, step: 5 }, warmupProbe);
assert.ok(wf.oosTrades.length > 0, "OOS should retain pre-window indicator warmup");
assert.ok(
  wf.oosTrades.every(t => new Date(t.t) >= new Date(bars[10].t)),
  "warmup history must never be counted as OOS trades"
);

console.log("EdgeAI regression tests passed");
