"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { latestAllowedDate, refreshLagging } = require("./data-freshness");

const date = (market, timestamp) => latestAllowedDate(market, new Date(timestamp));
const bars = day => [{ t: `${day}T00:00:00Z`, open: 100, high: 101, low: 99, close: 100 }];

test("the actual November 4 build was before both publication cutoffs", () => {
  assert.equal(date("SE", "2026-11-04T17:46:44.216Z"), "2026-11-03");
  assert.equal(date("US", "2026-11-04T17:46:44.216Z"), "2026-11-03");
});

test("winter close job can use the completed day in both markets", () => {
  assert.equal(date("SE", "2026-11-04T23:17:00Z"), "2026-11-04");
  assert.equal(date("US", "2026-11-04T23:17:00Z"), "2026-11-04");
});

test("summer close job can use the completed day despite Stockholm midnight", () => {
  assert.equal(date("SE", "2026-07-15T23:17:00Z"), "2026-07-15");
  assert.equal(date("US", "2026-07-15T23:17:00Z"), "2026-07-15");
});

test("US and Swedish cutoffs remain independent during the DST mismatch", () => {
  assert.equal(date("SE", "2026-10-28T18:30:00Z"), "2026-10-28");
  assert.equal(date("US", "2026-10-28T18:30:00Z"), "2026-10-27");
});

test("both cutoff boundaries are inclusive and retain the existing buffers", () => {
  assert.equal(date("SE", "2026-11-04T17:59:59Z"), "2026-11-03");
  assert.equal(date("SE", "2026-11-04T18:00:00Z"), "2026-11-04");
  assert.equal(date("US", "2026-11-04T22:29:59Z"), "2026-11-03");
  assert.equal(date("US", "2026-11-04T22:30:00Z"), "2026-11-04");
});

test("delayed next-morning runs retain the preceding date", () => {
  assert.equal(date("SE", "2026-11-05T06:17:00Z"), "2026-11-04");
  assert.equal(date("US", "2026-11-05T06:17:00Z"), "2026-11-04");
});

test("unknown markets and invalid timestamps fail closed", () => {
  assert.throws(() => date("UNKNOWN", "2026-11-04T23:17:00Z"), /Known market/);
  assert.throws(() => latestAllowedDate("SE", new Date("invalid")), /valid build/);
});

test("weekend calendar ceiling never relabels Friday bars as Sunday", async () => {
  const friday = bars("2026-10-30");
  const ceiling = date("SE", "2026-11-02T06:17:00Z");
  assert.equal(ceiling, "2026-11-01");
  const result = await refreshLagging({
    universe: { AAA: friday }, indexBars: friday, indexSymbol: "^OMX",
    expected: ceiling, attempts: 0, loadFn: async () => { throw Error("No network"); },
  });
  assert.equal(result.status, "DATA_NOT_READY");
  assert.equal(result.universe.AAA[0].t, "2026-10-30T00:00:00Z");
});

test("a missing holiday candle is not fabricated or dated forward", async () => {
  const prior = bars("2026-12-24");
  const result = await refreshLagging({
    universe: { AAA: prior }, indexBars: prior, indexSymbol: "^GSPC",
    expected: "2026-12-25", attempts: 0, loadFn: async () => { throw Error("No network"); },
  });
  assert.equal(result.status, "DATA_NOT_READY");
  assert.equal(result.indexBars[0].t, "2026-12-24T00:00:00Z");
});

test("future daily bars cannot be accepted before their cutoff", async () => {
  const result = await refreshLagging({
    universe: { AAA: bars("2026-11-05") }, indexBars: bars("2026-11-05"),
    indexSymbol: "^OMX", expected: "2026-11-04", attempts: 0,
    loadFn: async () => { throw Error("No network"); },
  });
  assert.equal(result.status, "DATA_NOT_READY");
  assert.deepEqual(result.indexBars, []);
});

test("schedule keeps three starts and includes the verified after-close time", () => {
  const workflow = fs.readFileSync(path.join(__dirname, ".github/workflows/edgeai.yml"), "utf8");
  const schedules = [...workflow.matchAll(/^\s+- cron: "([^"]+)"/gm)].map(x => x[1]);
  assert.deepEqual(schedules, ["17 23 * * 1-5", "17 6 * * 1-5", "37 9 * * 1-5"]);
});

test("daily workflow is main-only and still validates before committing or deploying", () => {
  const workflow = fs.readFileSync(path.join(__dirname, ".github/workflows/edgeai.yml"), "utf8");
  assert.match(workflow, /run:\s*\n\s*#.*\n\s*if: github\.ref == 'refs\/heads\/main'/);
  assert.ok(workflow.indexOf("npm run verify:data") < workflow.indexOf("git add -A public/"));
  assert.ok(workflow.indexOf("git add -A public/") < workflow.indexOf("uses: actions/deploy-pages"));
  assert.match(workflow, /- "data-freshness\.js"/);
});
