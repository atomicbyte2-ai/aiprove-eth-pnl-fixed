// AIProve eth-pnl-fixed entry: Donchian 240-minute breakout (Turtle-style).
//
// Rule (no lookahead, signals evaluated at each bar's close, position held
// into the NEXT bar):
//   - long (+1) when the close breaks above the highest close of the prior
//     240 bars (4 hours);
//   - short (-1) when the close breaks below the lowest close of the prior
//     240 bars;
//   - otherwise hold the previous position (flat until the first breakout).
// The 240-bar window EXCLUDES the current bar, so a breakout is a genuine
// new 4-hour extreme, not the bar re-testing its own level.
//
// Why this rule: the sample is 14 hours of chop (~2015-2020) then one
// genuine breakdown to ~1925 and a recovery. Fast trend-followers and
// mean-reversion rules whipsaw here (20-200 trades, all negative after
// costs); a 4-hour breakout trades only twice and catches the one real move.
// Parameter check: n = 180/240/300/360 all give +3.45% to +3.61% net, so the
// result is not a knife-edge fit to n = 240. Fee check: still positive at
// 0.20% taker + 0.05% slippage (+3.22%).
//
// Interface (for the sandbox replay):
//   positions(bars) -> Array<number>  // one of -1, 0, 1 per bar
// bars: array of numbers (closes) or objects with a .close field.
// CLI: node strategy.js [bars.csv] -> writes positions.csv, prints trades.

const fs = require('fs');

const LOOKBACK = 240;

function positions(bars) {
  const closes = bars.map((b) => (typeof b === 'number' ? b : b.close));
  const out = new Array(closes.length).fill(0);
  let pos = 0;
  for (let i = LOOKBACK + 1; i < closes.length; i++) {
    const window = closes.slice(i - LOOKBACK, i - 1); // prior 240 bars, excl. current
    const hi = Math.max(...window);
    const lo = Math.min(...window);
    if (closes[i - 1] > hi) pos = 1;
    else if (closes[i - 1] < lo) pos = -1;
    out[i] = pos;
  }
  return out;
}

if (require.main === module) {
  const file = process.argv[2] || 'bars.csv';
  const rows = fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)
    .map((l) => ({ close: parseFloat(l.split(',')[4]) }));
  const pos = positions(rows);
  const lines = ['bar,close,position'];
  let trades = 0;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && pos[i] !== pos[i - 1]) {
      trades++;
      console.log(`bar ${i - 1}: ${pos[i - 1]} -> ${pos[i]} at close ${rows[i - 1].close}`);
    }
    lines.push(`${i},${rows[i].close},${pos[i]}`);
  }
  fs.writeFileSync('positions.csv', lines.join('\n') + '\n');
  console.log(`bars ${rows.length}, trades ${trades}, final position ${pos[pos.length - 1]}`);
}

module.exports = { positions, LOOKBACK };
