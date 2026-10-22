(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Wallpaper = factory(); }
})(this, function () {
  'use strict';
  function pickIndex(count, date) {
    if (!count) { return -1; }
    var day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    return day % count;
  }
  return { pickIndex: pickIndex };
});
