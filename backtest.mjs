// Replay the Donchian-240 strategy on bars.csv with the stated cost model.
// Costs (Binance spot, no discount): taker fee 0.10% + slippage 0.02% per
// unit of position changed. A flip from -1 to +1 changes 2 units -> 0.24%.
// Fills at the signal bar's close; no phantom fills, no lookahead.
// Usage: node backtest.mjs [bars.csv]
import { readFileSync } from 'node:fs';
import { positions } from './strategy.js';

const file = process.argv[2] || 'bars.csv';
const closes = readFileSync(file, 'utf8').trim().split('\n').slice(1)
  .map((l) => parseFloat(l.split(',')[4]));
const pos = positions(closes);

function replay(fee, slip) {
  let p = 0, pnl = 0, trades = 0, eq = 0, peak = 0, mdd = 0;
  for (let i = 1; i < closes.length; i++) {
    const t = pos[i - 1];
    if (t !== p) { pnl -= Math.abs(t - p) * (fee + slip); trades++; p = t; }
    const r = (closes[i] / closes[i - 1] - 1) * p;
    pnl += r; eq += r;
    peak = Math.max(peak, eq); mdd = Math.min(mdd, eq - peak);
  }
  return { pnl: pnl * 100, trades, mdd: mdd * 100 };
}

const main = replay(0.001, 0.0002);
console.log(`Donchian-240 on ${closes.length} bars (${closes[0]} -> ${closes.at(-1)}, buy&hold ${((closes.at(-1)/closes[0]-1)*100).toFixed(2)}%)`);
console.log(`net PnL ${main.pnl.toFixed(2)}% | trades ${main.trades} | max drawdown ${main.mdd.toFixed(2)}% (taker 0.10% + slip 0.02%)`);
console.log('fee sensitivity:');
for (const [fee, slip] of [[0, 0], [0.0005, 0.0001], [0.001, 0.0002], [0.002, 0.0005]]) {
  const r = replay(fee, slip);
  console.log(`  taker ${(fee*100).toFixed(2)}% + slip ${(slip*100).toFixed(2)}%: PnL ${r.pnl.toFixed(2)}%`);
}
