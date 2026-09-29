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
