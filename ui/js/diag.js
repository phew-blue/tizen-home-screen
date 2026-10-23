(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Diag = factory(); }
})(this, function () {
  'use strict';
  function pct(sorted, p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] : null; }
  function create(now, startAt) {
    var start = typeof startAt === 'number' ? startAt : now(), tti = null, pending = null, moves = [];
    return {
      markInteractive: function () { if (tti === null) { tti = now() - start; } },
      moveStart: function () { pending = now(); },
      moveEnd: function () { if (pending !== null) { moves.push(now() - pending); pending = null; } },
      summary: function () {
        var s = moves.slice().sort(function (a, b) { return a - b; });
        return { ttiMs: tti, moves: s.length, p50: pct(s, 0.5), p95: pct(s, 0.95) };
      }
    };
  }
  return { create: create };
});
