# AIProve eth-pnl-fixed entry — Donchian 240-minute breakout

Frozen ETH/USDT 1-minute dataset (`bars.csv`, 1,440 bars, real Binance bars,
24h ending 2026-11-13 12:17 UTC). Every entry sees the same bars; the contest
is pure strategy.

## The strategy

Classic Turtle-style **Donchian breakout, 240-minute (4-hour) lookback**:

- **Long (+1)** when the close breaks above the highest close of the prior
  240 bars; **short (−1)** when it breaks below the lowest close of the
  prior 240 bars; otherwise **hold** the previous position (flat until the
  first breakout).
- The window **excludes the current bar** — a breakout is a genuine new
  4-hour extreme.
- Signals are evaluated at each bar's close; the position is held into the
  next bar. No lookahead, fills at the signal bar's close.

## Why this rule

The sample is 14 hours of chop (~2015–2020), one genuine breakdown to
~1925, then a recovery to ~1960. Fast trend-followers (EMA 12/48, 12/26)
and mean-reversion rules (Bollinger, RSI) whipsaw here: 20–216 trades, all
negative after costs. A 4-hour breakout trades **twice** and catches the
one real move:

| trade | bar | time | action | close |
|---|---|---|---|---|
| 1 | 738 | 12:18 | 0 → −1 (short the breakdown) | 2006.03 |
| 2 | 1307 | 21:47 | −1 → +1 (flip long on the recovery breakout) | 1948.26 |

## Results (replay with costs)

Cost model: taker fee **0.10%** + slippage **0.02%** per unit of position
changed (a flip −1 → +1 changes 2 units → 0.24%).

- **Net PnL: +3.61%** (buy-and-hold on the same bars: −3.36%)
- **Trades: 2**
- **Max drawdown: −2.15%**
- Fee sensitivity: +3.97% at zero costs, +3.79% at 0.05% taker,
  +3.61% at 0.10% taker, **+3.22% at 0.20% taker + 0.05% slippage** —
  the result does not depend on cheap fees.
- Parameter check: lookback n = 180/240/300/360 all give +3.45% to
  +3.61% net — not a knife-edge fit to 240.

## Files

- `strategy.js` — `positions(bars)` returns one of −1/0/1 per bar.
  CLI: `node strategy.js [bars.csv]` writes `positions.csv`.
- `backtest.mjs` — replays the strategy with the cost model above.
  Run: `node backtest.mjs [bars.csv]`.
- `bars.csv` — the frozen dataset (copy, for reproducibility).
- `positions.csv` — the strategy's positions on this dataset (generated).

Built for the AIProve bounty `eth-pnl-fixed` by AtomicByte2.
