(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Keys = factory(); }
})(this, function () {
  'use strict';
  var CODES = {
    37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok',
    10009: 'back', 27: 'back', 8: 'back',
    403: 'red', 404: 'green', 405: 'yellow', 406: 'blue'
  };
  var LETTERS = { r: 'red', g: 'green', y: 'yellow', b: 'blue' };
  function action(e) {
    if (CODES.hasOwnProperty(e.keyCode)) { return CODES[e.keyCode]; }
    if (e.key && LETTERS.hasOwnProperty(e.key.toLowerCase())) { return LETTERS[e.key.toLowerCase()]; }
    return null;
  }
  return {
    action: action,
    TIZEN_KEYS: ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue']
  };
});
