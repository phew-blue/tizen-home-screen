/* Fake tizen.* for the browser preview. Inert when a real tizen object exists. */
(function () {
  'use strict';
  if (typeof window.tizen !== 'undefined') { return; }
  window.__TIZEN_MOCK__ = true;
  window.__MOCK_LOG = [];
  var apps = window.__MOCK_APPS__ || [];
  var sources = window.__MOCK_SOURCES__ || { connected: [], disconnected: [] };
  window.tizen = {
    application: {
      getAppsInfo: function (ok) { if (window.__MOCK_APPS_HANG__) { return; } setTimeout(function () { ok(apps); }, 0); },
      launch: function (id, ok) { window.__MOCK_LOG.push(['launch', id]); setTimeout(ok, 0); },
      getCurrentApplication: function () { return { hide: function () { window.__MOCK_LOG.push(['hide']); } }; },
      getAppMetaData: function (id) {
        return id === 'DqEoaplKlw.bbchybrid' ? [{ key: 'http://samsung.com/tv/metadata/hbbtv.link', value: 'https://www.live.bbctvapps.co.uk/tap/iplayer_@FHD' }] : [];
      },
      launchAppControl: function (ac, id, ok) {
        var tid = (ac.data || []).filter(function (d) { return d.key === 'tizenid'; })[0];
        window.__MOCK_LOG.push(['appcontrol', id, tid && tid.value[0]]);
        setTimeout(ok, 0);
      }
    },
    systeminfo: { getPropertyValue: function (p, ok) { setTimeout(function () { ok(sources); }, 0); } },
    tvwindow: { setSource: function (src, ok) { window.__MOCK_LOG.push(src.type === 'HDMI' ? ['input', src.number] : ['source', src.type, src.number]); setTimeout(ok, 0); } },
    tvinputdevice: { registerKey: function () {} },
    ApplicationControl: function (op, uri, mime, cat, data) { this.operation = op; this.data = data; },
    ApplicationControlData: function (key, value) { this.key = key; this.value = value; }
  };
})();
