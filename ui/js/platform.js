(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Platform = factory(); }
})(this, function () {
  'use strict';
  var VIEWER_APP = 'org.tizen.tv-viewer';
  function create(tizen, opts) {
    var timeoutMs = (opts && opts.timeoutMs) || 8000;
    function call(what, fn) {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { reject(new Error(what + ': the TV did not respond')); }, timeoutMs);
        function ok(v) { clearTimeout(timer); resolve(v); }
        function err(e) { clearTimeout(timer); reject(e instanceof Error ? e : new Error(what + ': ' + (e && e.message || e))); }
        try { fn(ok, err); } catch (e) { err(e); }
      });
    }
    function listApps() {
      return call('App list', function (ok, err) { tizen.application.getAppsInfo(ok, err); }).then(function (apps) {
        var out = [];
        for (var i = 0; i < apps.length; i++) {
          out.push({ id: apps[i].id, name: apps[i].name, iconPath: apps[i].iconPath || '', show: !!apps[i].show });
        }
        return out;
      });
    }
    function launch(appId) {
      return call('Launch', function (ok, err) { tizen.application.launch(appId, ok, err); });
    }
    function openInput(hdmi) {
      return call('Input list', function (ok, err) {
        tizen.systeminfo.getPropertyValue('VIDEOSOURCE', ok, err);
      }).then(function (info) {
        var all = (info.connected || []).concat(info.disconnected || []);
        var src = all.find(function (s) { return s.type === 'HDMI' && s.number === hdmi; });
        if (!src) { throw new Error('HDMI ' + hdmi + ' is not reported by the TV'); }
        return call('Switch input', function (ok, err) { tizen.tvwindow.setSource(src, ok, err, 'MAIN'); });
      }).then(function () { return launch(VIEWER_APP); });
    }
    function registerKeys(names) {
      for (var i = 0; i < names.length; i++) {
        try { tizen.tvinputdevice.registerKey(names[i]); } catch (e) { /* key unsupported on this model */ }
      }
    }
    return { listApps: listApps, launch: launch, openInput: openInput, registerKeys: registerKeys };
  }
  return { create: create, VIEWER_APP: VIEWER_APP };
});
