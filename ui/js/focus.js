(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Focus = factory(); }
})(this, function () {
  'use strict';
  function firstNonEmpty(lengths, start, step) {
    for (var r = start; r >= 0 && r < lengths.length; r += step) {
      if (lengths[r] > 0) { return r; }
    }
    return -1;
  }
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) { a.push(0); } return a; }
  function initial(lengths) { return { row: firstNonEmpty(lengths, 0, 1), cols: zeros(lengths.length) }; }
  function move(state, dir, lengths) {
    if (state.row < 0) { return state; }
    var cols = state.cols.slice();
    if (dir === 'left' || dir === 'right') {
      var c = cols[state.row] + (dir === 'right' ? 1 : -1);
      if (c < 0 || c >= lengths[state.row]) { return state; }
      cols[state.row] = c;
      return { row: state.row, cols: cols };
    }
    var step = dir === 'down' ? 1 : -1;
    var next = firstNonEmpty(lengths, state.row + step, step);
    return next < 0 ? state : { row: next, cols: cols };
  }
  function clamp(state, lengths) {
    var cols = [];
    for (var i = 0; i < lengths.length; i++) {
      var c = state.cols[i] || 0;
      cols.push(Math.max(0, Math.min(c, lengths[i] - 1)));
    }
    var row = state.row;
    if (row < 0 || row >= lengths.length || lengths[row] === 0) {
      row = firstNonEmpty(lengths, Math.max(row, 0), 1);
      if (row < 0) { row = firstNonEmpty(lengths, lengths.length - 1, -1); }
    }
    return { row: row, cols: cols };
  }
  function current(state) { return { row: state.row, col: state.row < 0 ? -1 : state.cols[state.row] }; }
  return { initial: initial, move: move, clamp: clamp, current: current };
});
