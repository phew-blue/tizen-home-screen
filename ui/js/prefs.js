(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Prefs = factory(); }
})(this, function () {
  'use strict';
  var KEY = 'ths.prefs.v1';
  function isStrArr(a) {
    if (Object.prototype.toString.call(a) !== '[object Array]') { return false; }
    for (var i = 0; i < a.length; i++) { if (typeof a[i] !== 'string') { return false; } }
    return true;
  }
  function valid(p) { return !!p && isStrArr(p.order) && (p.hidden === null || isStrArr(p.hidden)); }
  function defaults() { return { order: [], hidden: null }; }
  function load(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) { return defaults(); }
      var p = JSON.parse(raw);
      return valid(p) ? p : defaults();
    } catch (e) {
      return defaults();
    }
  }
  function save(storage, p) {
    if (!valid(p)) { throw new Error('Invalid prefs'); }
    storage.setItem(KEY, JSON.stringify(p));
  }
  function move(p, visibleKeys, key, delta) {
    var order = visibleKeys.slice();
    var i = order.indexOf(key);
    var j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) { return { order: order, hidden: p.hidden }; }
    order[i] = order[j];
    order[j] = key;
    return { order: order, hidden: p.hidden };
  }
  function toggleHidden(p, key, defaultHidden) {
    var hidden = (p.hidden === null ? defaultHidden : p.hidden).slice();
    var i = hidden.indexOf(key);
    if (i >= 0) { hidden.splice(i, 1); } else { hidden.push(key); }
    return { order: p.order.slice(), hidden: hidden };
  }
  return { KEY: KEY, defaults: defaults, load: load, save: save, move: move, toggleHidden: toggleHidden };
});
