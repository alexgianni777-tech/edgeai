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
