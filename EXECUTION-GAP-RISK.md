# AG Invest: execution realism (gap-aware v1)

### What changed
All six EdgeAI strategy backtests use a shared daily OHLC fill model. If the **market opens through an adverse stop**, the modeled stop exit is the actual opening price, not the hoped-for stop level. With an intraday range touching both target and stop, the stop is prioritized. Favorable opening gaps are capped at the target price. Execution costs use entry + exit prices.

The proposal ledger applies the same model to **newly resolved** open proposals. Previously closed ledger rows were generated using a different, optimistic fill model. They remain preserved as audit history but are excluded from the new displayed gap-aware track record. No historic outcomes have been silently rewritten.

### Risk caveats
- This is not evidence of positive expected returns. It removes a source of backtest optimism and may **lower** historical R, win rate and qualification status.
- Bar data represents underlying shares, **not** actual mini futures or warrants. Missing derivative prices, spread, fees, knock-out mechanics, financing and liquidity may cause worse outcomes than modeled.
- A stop loss is not guaranteed; risk is not capped by this calculation.
- Same-day stop and target ambiguity is always resolved with stop first.
- Do not increase risk just because CI is green. Demand walk-forward positive net expectancy with reliable sample size, realistic cost assumptions and a manual trade card.

### Manual review
Run `npm test` and `npm run verify:data` after building a demo dataset. The pull-request workflow also attempts live Yahoo validation and can fail on provider rate limits independently of the code.

## Aspirational 80% / 3R objective — strict research gate

The user wants at least **80% observed win rate** and **1:3 planned risk/reward**. There is NO guarantee these jointly occur. At 80% wins and realized winning trade 3R against losing trade -1R, arithmetic expectancy would be +2.2R per trade *before* additional frictions. High win rate, low variance and such a high payoff are rarely simultaneous.

`elite-gate.js` requires **all** of:
- minimum 100 *out-of-sample* trades, across at least three evaluated OOS windows;
- observed OOS win rate at least 80%;
- realized average win / average absolute loss at least 3, with at least 10 actual losses;
- planned target at least 3R under the deployed parameters;
- maximum hold 15 daily bars (~three trading weeks);
- at least two thirds of OOS windows with positive expectancy;
- 95% lower confidence limit on OOS expected R above zero (approximation; correlated trades can invalidate simple IID assumptions).

This is an **aspirational hurdle, not an optimizer**: no automated searching/tweaking until a backtest passes. If unfulfilled, the model marks every proposed idea `RESEARCH_ONLY` / `WATCH`, with `validatedEdge=false`. Previously looser `VALIDATED` criteria remain in base strategy diagnostics to allow honest comparison, but no longer promote a trade. Signals are never orders.

An 80% hit rate against a 3R *target* does NOT necessarily mean realized payoff is 3: stops, gap slippage, early time exits and commissions can destroy the payoff. The outcome is evaluated separately.

**Do not trade to salvage competition standings; meeting a win-rate quota by curve fitting is statistically misleading.** The right output when no strategy qualifies is zero approved setups, not invented signals.
