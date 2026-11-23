"use strict";
// Active OMXS30 *constituent* universe for AG Invest.
// Official index membership as of 2026-11-02, per Nasdaq's OMXS30 fact sheet.
// 2026-11-23 Nasdaq notice: SOBI enters; LIFCO B leaves effective 2026-12-01.
// SKFVER B is a temporary spin-off addition 2026-11-26 through 2026-11-30;
// it is intentionally NOT a new trade candidate without a complete verified
// 3-year daily history. Track the temporary exception explicitly.
const NOVEMBER_2026 = Object.freeze([
  "ABB.ST", "ADDT-B.ST", "ALFA.ST", "ASSA-B.ST", "AZN.ST", "ATCO-A.ST",
  "BOL.ST", "EPI-A.ST", "EQT.ST", "ERIC-B.ST", "ESSITY-B.ST", "EVO.ST",
  "HM-B.ST", "HEXA-B.ST", "INDU-C.ST", "INVE-B.ST", "LIFCO-B.ST",
  "NIBE-B.ST", "NDA-SE.ST", "SAAB-B.ST", "SAND.ST", "SEB-A.ST",
  "SKA-B.ST", "SKF-B.ST", "SCA-B.ST", "SHB-A.ST", "SWED-A.ST",
  "TEL2-B.ST", "TELIA.ST", "VOLV-B.ST",
]);
const DECEMBER_2026 = Object.freeze(NOVEMBER_2026.map(t => t === "LIFCO-B.ST" ? "SOBI.ST" : t));
const OFFICIAL_SOURCE = "https://www.nasdaq.com/docs/global-indexes/OMXS30";
const RECONSTITUTION_NOTICE = "https://view.news.eu.nasdaq.com/view?id=b9f99d088ca06195b95a6c562a9649c20&lang=en&src=rss";
const SCOPE = Object.freeze({
  activeMarket: "SE",
  universe: "OMXS30",
  us: "ARCHIVED_NO_NEW_SIGNALS",
  leverageDefaultMax: 4,
  leverageConditionalMax: 8,
  expectedOutperformancePctPerWeek: null,
  aspirationalNetReturnPctPerWeek: 10,
  maxPlannedAccountRiskPct: 4,
  tradingHaltThrough: "2026-11-27",
  projectEnds: "2030-01-01",
});
function validDate(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date + "T12:00:00Z")) &&
    new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
}
function tickersForSession(date) {
  if (!validDate(date)) throw Error("Verified completed SE session date required");
  return [...(date >= "2026-12-01" ? DECEMBER_2026 : NOVEMBER_2026)];
}
function temporaryIndexExceptions(date) {
  if (!validDate(date)) throw Error("Verified completed SE session date required");
  return date >= "2026-11-26" && date < "2026-12-01"
    ? [{ticker: "SKFVER-B.ST", status: "TEMPORARY_INDEX_MEMBER_NOT_TRADE_ELIGIBLE",
        reason: "Spin-off has no verified multi-year OHLC/OOS record"}]
    : [];
}
function isTradeEligible(ticker, date) {
  return typeof ticker === "string" && tickersForSession(date).includes(ticker.toUpperCase());
}
module.exports = {NOVEMBER_2026, DECEMBER_2026, OFFICIAL_SOURCE, RECONSTITUTION_NOTICE,
  SCOPE, tickersForSession, temporaryIndexExceptions, isTradeEligible};
