# EdgeAI | Sentiment study & deterministic data freshness (2026-10-24)

## Problem 1 – index/tickers lag behind on Yahoo
On 23 October, the daily live workflow failed because ^OMX ended on 22 October while the US market already had 23 October. Previously one ticker (ASSA-B.ST) also lagged. **Failing closed was correct**: do not send Telegram or overwrite the published dataset with misleading as-of dates.

`data-freshness.js` now retries only missing latest completed session series. Re-fetch each trailing symbol a maximum of **two** times, rather than re-downloading all ~110 shares. After those retries, retain original FAIL-CLOSED check `assertCompleteDailyBars`; never insert synthetic quotes, interpolate Friday or quietly mark Thursday as Friday.

If a Swedish holiday makes the expected date wrong, the guard can still fail. Investigate the exchange calendar rather than weakening freshness or pretending that a stale day is current.

## Problem 2 – does our Fear/Greed filter actually help?
A raw sentiment value is not alpha. New `sentiment-study.js` creates date-indexed point-in-time proxy values **as of the close preceding each historical trade**. Trades with no signal date or sufficient historical bars are excluded and counted `unknownSentiment` (never assumed winners).

Compares historical out-of-sample (OOS) trading outcomes:
- **baseline**: all dated OOS trades using the existing strategies and gap-aware fill model.
- **filtered**: skip long entries in our own GREED / EXTREME_GREED zones and skip short entries in FEAR / EXTREME_FEAR zones.
- **blocked**: OOS returns of entries that would have been excluded.
- **2–4 trading days**: same comparison restricted to short holding periods. Other positions up to the maximum remain separate.

Each comparison reports sample size, win rate, average R, net R, profit factor. Data is also broken out per strategy. All observed results, including any deterioration caused by the filter, are published.

**Extremely important:** these are *retrospective exploratory diagnostics on past OOS trade streams*, NOT a new independently held-out experiment. The psychology filter was selected after looking at the markets, so the analysis can be overfit; shares in today's universe introduce survivorship bias, corporate action adjustments may be revised, and many strategy outcomes overlap on the same underlying names. The 80% / 3R eligibility gate is unchanged; sentiment-study outputs must not upgrade a strategy. Before using this as entry filter, validate on a pre-registered future/untouched period and include mini-future costs and realistic slippage.

## No unauthorized actions
No Replit credit usage, paid deployments, new automatic trades or extra Telegram alerts. Existing daily schedule remains. Alerting remains gated on valid current bars.
