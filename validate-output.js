// validate-output.js — fail closed before publishing malformed EdgeAI data.
// This also protects the existing Replit importer contract.

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "public", "data.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const finite = (v) => typeof v === "number" && Number.isFinite(v);

if (!data.generatedAt || Number.isNaN(new Date(data.generatedAt).getTime())) {
  errors.push("generatedAt is missing or invalid");
}

for (const key of ["US", "SE"]) {
  const m = data.markets?.[key];
  if (!m) {
    errors.push(`${key}: market missing`);
    continue;
  }
  if (!Array.isArray(m.setups)) errors.push(`${key}: setups is not an array`);
  if (!Array.isArray(m.strategies)) errors.push(`${key}: strategies is not an array`);
  if (!Array.isArray(m.rTrades)) errors.push(`${key}: rTrades is not an array`);
  if (!Array.isArray(m.rClusters)) errors.push(`${key}: rClusters is not an array`);
  // The proxy is supplemental price-based context, never the CNN F&G feed.
  const psych=m.psychology;
  if (!psych || psych.source !== "PRICE_BREADTH_PROXY" ||
      !["OK","UNAVAILABLE"].includes(psych.status)) {
    errors.push(`${key}.psychology: missing or invalid proxy provenance`);
  } else if (psych.status === "OK") {
    if (!finite(psych.score) || psych.score<0 || psych.score>100 ||
        !["EXTREME_FEAR","FEAR","NEUTRAL","GREED","EXTREME_GREED"].includes(psych.label))
      errors.push(`${key}.psychology: invalid bounded sentiment score`);
    if (m.dataAsOf && psych.asOf !== m.dataAsOf)
      errors.push(`${key}.psychology: stale sentiment date`);
  } else if (psych.score !== null) errors.push(`${key}.psychology: unavailable must have null score`);
  const radar=m.ideaRadar;
  if (!radar || !Array.isArray(radar.long) || !Array.isArray(radar.short) ||
      radar.long.length>3 || radar.short.length>3) {
    errors.push(`${key}.ideaRadar: missing or invalid long/short sides`);
  } else {
    for (const side of ["long","short"]) {
      const seen=new Set();
      for (const [i, idea] of radar[side].entries()) {
        const p=`${key}.ideaRadar.${side}[${i}]`;
        if (!idea.ticker || seen.has(idea.ticker)) errors.push(`${p}: missing/duplicate ticker`);
        seen.add(idea.ticker);
        if (idea.direction !== side) errors.push(`${p}: incorrect trade direction`);
        if (!finite(idea.entry) || !finite(idea.stop) || !finite(idea.target) ||
            !finite(idea.rr) || !finite(idea.barsAgo) || idea.barsAgo>2)
          errors.push(`${p}: invalid levels/freshness`);
        if (!["WATCH","REVIEW_REQUIRED"].includes(idea.psychologyStatus))
          errors.push(`${p}: psychologyStatus must require manual review`);
        if (!Array.isArray(idea.warnings)) errors.push(`${p}: missing psychology warnings`);
      }
    }
  }

  for (const [i, s] of (m.setups || []).entries()) {
    const p = `${key}.setups[${i}]`;
    for (const field of ["ticker", "dir", "setup", "grade"]) {
      if (!s[field]) errors.push(`${p}: missing ${field}`);
    }
    for (const field of ["entry", "stop", "target", "rr", "rs", "barsAgo"]) {
      if (!finite(s[field])) errors.push(`${p}: ${field} must be finite`);
    }
    if (!s.edge || !finite(s.edge.expectancyR) || !finite(s.edge.winRate) || !finite(s.edge.sample)) {
      errors.push(`${p}: Replit edge contract is invalid`);
    }
    if (!["long", "short"].includes(s.dir)) errors.push(`${p}: invalid dir ${s.dir}`);
    if (!["VALIDATED", "PROMISING", "WATCH"].includes(s.evidenceStatus)) {
      errors.push(`${p}: invalid evidenceStatus ${s.evidenceStatus}`);
    }
    if (!["QUALIFIED_OOS", "RESEARCH_ONLY"].includes(s.eliteStatus)) {
      errors.push(`${p}: eliteStatus must be explicit`);
    }
    if (typeof s.eliteQualified !== "boolean") errors.push(`${p}: eliteQualified must be boolean`);
    if (s.eliteQualified !== (s.eliteStatus === "QUALIFIED_OOS")) errors.push(`${p}: inconsistent elite status`);
    if (!s.eliteQualified && (s.grade !== "WATCH" || s.validatedEdge !== false)) {
      errors.push(`${p}: unqualified setups must never be shown as trade-approved`);
    }
    if (s.eliteQualified && s.rr < 3) errors.push(`${p}: elite requires planned R/R of at least 3`);
    if (s.dir === "long" && !(s.stop < s.entry && s.target > s.entry)) {
      errors.push(`${p}: long levels must satisfy stop < entry < target`);
    }
    if (s.dir === "short" && !(s.target < s.entry && s.stop > s.entry)) {
      errors.push(`${p}: short levels must satisfy target < entry < stop`);
    }
    if (s.size != null && (!finite(s.size) || s.size < 0)) {
      errors.push(`${p}: size must be non-negative`);
    }
  }

  if (!m.eliteTarget || m.eliteTarget.winRate !== 0.80 || m.eliteTarget.plannedRR !== 3) {
    errors.push(`${key}: elite target missing or changed`);
  }
  for (const [i, s] of (m.strategies || []).entries()) {
    const p = `${key}.strategies[${i}]`;
    if (!finite(s.expectancyR) || !finite(s.winRate) || !finite(s.profitFactor) || !finite(s.n)) {
      errors.push(`${p}: non-finite summary metric`);
    }
    if (s.executionDrift) {
      for (const field of ["n", "medianGapPct", "medianAbsGapPct", "p90AbsGapPct"]) {
        if (!finite(s.executionDrift[field])) errors.push(`${p}: executionDrift.${field} must be finite`);
      }
    }
  }

  if (m.trackRecordSummary) {
    for (const field of ["closed", "wins", "losses", "winRate", "netR"]) {
      if (!finite(m.trackRecordSummary[field])) errors.push(`${key}.trackRecordSummary: ${field} must be finite`);
    }
  }
  if (m.ranking && m.ranking.validated !== false) {
    errors.push(`${key}.ranking: heuristic ranking must not be marked validated`);
  }
  if (m.validation?.executionDrift) {
    for (const field of ["n", "medianGapPct", "medianAbsGapPct", "p90AbsGapPct"]) {
      if (!finite(m.validation.executionDrift[field])) errors.push(`${key}.validation.executionDrift.${field} must be finite`);
    }
  }

  for (const [i, c] of (m.rClusters || []).entries()) {
    if (!c.date || !finite(c.r) || !finite(c.n) || c.n < 1) {
      errors.push(`${key}.rClusters[${i}]: invalid cluster`);
    }
  }
}

if (errors.length) {
  console.error("EdgeAI output validation failed:");
  errors.slice(0, 50).forEach(e => console.error(" - " + e));
  if (errors.length > 50) console.error(` ... and ${errors.length - 50} more`);
  process.exit(1);
}

console.log("EdgeAI output contract validated");
