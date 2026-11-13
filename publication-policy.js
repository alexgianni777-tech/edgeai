"use strict";
// Read-only publication state. Never substitute a previous close for a missing new bar.
const { latestAllowedDate } = require("./data-freshness");
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
function completedWeekday(key, at = new Date()) {
  const date = latestAllowedDate(key, at);
  const day = new Date(date + "T00:00:00Z");
  while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}
function isFreshMarket(key, market, at = new Date()) {
  const expected = completedWeekday(key, at);
  return market && market.dataAsOf === expected &&
    market.dataStatus !== "STALE" &&
    market.indexSnapshot?.asOf === expected;
}
function previousVerifiedMarket(previous, key, at = new Date()) {
  const m = previous?.demo === false && previous?.markets?.[key];
  const date = m?.dataAsOf;
  const expected = completedWeekday(key, at);
  if (!m || !DAY_RE.test(date || "") || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date > expected || m.indexSnapshot?.asOf !== date ||
      m.indexSnapshot?.source !== "YAHOO_FINANCE" ||
      !Array.isArray(m.setups) || !Array.isArray(m.strategies) ||
      !m.marketTrendV2 || m.marketTrendV2.asOf !== date) {
    throw Error("CACHED_MARKET_UNVERIFIED: " + key + " has no independently verified previous dataset");
  }
  const current = date === expected;
  return {
    ...m,
    // Downstream importers may rely on generatedAt instead of dataAsOf.
    // Historical research statistics can survive, but stale trade proposals
    // must NEVER be copied into a newly published report.
    ...(current ? {} : {
      historicalSetupCount: m.setups.length,
      setups: [],
      ideaRadar: {long: [], short: [], conflicts: []}
    }),
    dataStatus: current ? "CURRENT_CACHED" : "STALE",
    dataWarning: current
      ? "Previous verified completed session reused after an upstream refresh failed; no newly fetched quote"
      : "Historical market data only. " + key + " source latest " + date + "; expected " + expected +
        ". All entries require new market data; no stale levels may be sent as a new trade.",
  };
}
function publicationStatus(markets, at = new Date()) {
  return Object.fromEntries(["US","SE"].map(key=>[key,{
    dataAsOf: markets[key]?.dataAsOf ?? null,
    expected: completedWeekday(key,at),
    current: !!isFreshMarket(key,markets[key],at),
    status: isFreshMarket(key,markets[key],at) ? "CURRENT" : "STALE"
  }]));
}
module.exports={completedWeekday,isFreshMarket,previousVerifiedMarket,publicationStatus};
