"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { runDateWindow } = require("./universe-validation");

const bars = Array.from({length: 30}, (_, i) => ({
  t: new Date(Date.UTC(2026, 0, i + 1)),
  open: 100, high: 101, low: 99, close: 100,
}));
const strat = {
  DEFAULT_PARAMS: { maxBars: 4 },
  runStrategy(series) {
    return series.slice(0, -1).map((bar, entryIdx) => {
      const exitIdx = Math.min(series.length - 1, entryIdx + 4);
      return {
        entryIdx,
        t: bar.t,
        exitT: series[exitIdx].t,
        r: exitIdx - entryIdx,
      };
    });
  },
};
const source = [["AAA", bars]];
const day = item => new Date(item.t).toISOString().slice(0, 10);
const exitDay = item => new Date(item.exitT).toISOString().slice(0, 10);

test("IS selection excludes artificial time exits at the calendar boundary", () => {
  const trades = runDateWindow(source, strat, {}, {
    fromDate: "2026-01-05", toDate: "2026-01-15", warmup: 0,
  });
  assert.ok(trades.length > 0);
  assert.equal(day(trades.at(-1)), "2026-01-11");
  assert.ok(trades.every(trade => exitDay(trade) <= "2026-01-15"));
});

test("OOS evaluates late-window entries against genuinely later candles", () => {
  const trades = runDateWindow(source, strat, {}, {
    fromDate: "2026-01-05", toDate: "2026-01-15",
    warmup: 0, futureExitBars: 4,
  });
  const last = trades.find(trade => day(trade) === "2026-01-15");
  assert.ok(last, "entry near OOS boundary should not vanish if later candles exist");
  assert.equal(exitDay(last), "2026-01-19");
  assert.equal(last.r, 4);
  assert.ok(trades.every(trade => day(trade) <= "2026-01-15"),
    "future candles must only resolve exits, never add future entries");
});

test("OOS never counts unresolved latest-session trades as closed", () => {
  const trades = runDateWindow(source, strat, {}, {
    fromDate: "2026-01-25", toDate: "2026-01-30",
    warmup: 0, futureExitBars: 4,
  });
  assert.equal(day(trades.at(-1)), "2026-01-26");
  assert.ok(trades.every(trade => exitDay(trade) <= "2026-01-30"));
});

test("invalid horizons fail closed", () => {
  assert.throws(() => runDateWindow(source, strat, {maxBars: -1}, {
    fromDate: "2026-01-05", toDate: "2026-01-15",
  }), /exit horizons/);
});
