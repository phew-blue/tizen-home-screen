(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Catalog = factory(); }
})(this, function () {
  'use strict';
  // Match by exact app id: names collide with service apps (e.g. two "Apple TV", "YouTube").
  function idMatch(id) { return '^' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'; }
  var APPS = [
    { key: 'netflix', label: 'Netflix', match: idMatch('org.tizen.netflix-app') },
    { key: 'iplayer', label: 'BBC iPlayer', match: idMatch('DqEoaplKlw.bbchybrid'), launchIds: ['3201601007670'] },
    { key: 'disney', label: 'Disney+', match: idMatch('MCmYXNxgcu.DisneyPlus') },
    { key: 'appletv', label: 'Apple TV', match: idMatch('com.samsung.tv.aria-video') },
    { key: 'plex', label: 'Plex', match: idMatch('kIciSQlYEM.plex') },
    { key: 'youtube', label: 'YouTube', match: idMatch('com.samsung.tv.cobalt-yt') },
    { key: 'twitch', label: 'Twitch', match: idMatch('Jz7aUrV2Q4.Twitch') },
    { key: 'spotify', label: 'Spotify', match: idMatch('rJeHak5zRg.Spotify') },
    { key: 'itvx', label: 'ITVX', match: idMatch('OEvCiupaFR.ITVHub') },
    { key: 'channel4', label: 'Channel 4', match: idMatch('OCaxbgg9v6.chfourctv') },
    { key: 'now', label: 'NOW', match: idMatch('1Qb6IoAcGC.NowTV') },
    { key: 'tvplus', label: 'Samsung TV Plus', match: idMatch('com.samsung.tv.tvPlusDeeplinker'), hidden: true },
    { key: 'gallery', label: 'Gallery', match: idMatch('com.samsung.tv.gallery'), hidden: true },
    { key: 'internet', label: 'Internet', match: idMatch('org.tizen.browser'), hidden: true }
  ];
  var INPUTS = [
    { key: 'steam', label: 'Steam Machine', hdmi: 1 },
    { key: 'switch', label: 'Nintendo Switch', hdmi: 2 },
    { key: 'samsung-home', label: 'Samsung Home', action: 'samsung-home' }
  ];
  var SAMSUNG_HOME_APP_ID = 'com.samsung.tv.csfs';

  function find(installed, entry, used) {
    var re = new RegExp(entry.match, 'i');
    var best = null;
    for (var i = 0; i < installed.length; i++) {
      var a = installed[i];
      if (used[a.id] || !(re.test(a.name || '') || re.test(a.id))) { continue; }
      if (a.show) { return a; }
      if (!best) { best = a; }
    }
    return best;
  }
  function resolve(installed, catalog, prefs) {
    var used = {};
    var found = [];
    var missing = [];
    for (var i = 0; i < catalog.length; i++) {
      var e = catalog[i];
      var a = find(installed, e, used);
      if (a) {
        used[a.id] = true;
        found.push({ key: e.key, label: e.label, appId: a.id, iconPath: a.iconPath || '', launchIds: e.launchIds || [], defaultHidden: !!e.hidden });
      } else {
        missing.push({ key: e.key, label: e.label });
      }
    }
    var byKey = {};
    for (var j = 0; j < found.length; j++) { byKey[found[j].key] = found[j]; }
    var ordered = [];
    var placed = {};
    for (var k = 0; k < prefs.order.length; k++) {
      var t = byKey[prefs.order[k]];
      if (t && !placed[t.key]) { ordered.push(t); placed[t.key] = true; }
    }
    for (var m = 0; m < found.length; m++) {
      if (!placed[found[m].key]) { ordered.push(found[m]); }
    }
    var visible = [];
    var hidden = [];
    for (var n = 0; n < ordered.length; n++) {
      var tile = ordered[n];
      var isHidden = prefs.hidden === null ? tile.defaultHidden : prefs.hidden.indexOf(tile.key) >= 0;
      var out = { key: tile.key, label: tile.label, appId: tile.appId, iconPath: tile.iconPath, launchIds: tile.launchIds };
      (isHidden ? hidden : visible).push(out);
    }
    return { visible: visible, hidden: hidden, missing: missing };
  }
  function defaultHidden() {
    var keys = [];
    for (var i = 0; i < APPS.length; i++) { if (APPS[i].hidden) { keys.push(APPS[i].key); } }
    return keys;
  }
  return { APPS: APPS, INPUTS: INPUTS, SAMSUNG_HOME_APP_ID: SAMSUNG_HOME_APP_ID, resolve: resolve, defaultHidden: defaultHidden };
});
