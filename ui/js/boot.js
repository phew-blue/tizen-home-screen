(function () {
  'use strict';
  function fit() {
    var stage = document.getElementById('stage');
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = s === 1 ? '' : 'scale(' + s + ')';
    if (window.__TIZEN_MOCK__) { document.documentElement.className = 'preview'; }
  }
  fit();
  window.addEventListener('resize', fit);
  THS.Home.init({
    platform: THS.Platform.create(window.tizen),
    storage: window.localStorage,
    document: document,
    wallpapers: window.THS_WALLPAPERS || [],
    now: function () { return Date.now(); }
  });
})();
