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
      getAppsInfo: function (ok) { setTimeout(function () { ok(apps); }, 0); },
      launch: function (id, ok) { window.__MOCK_LOG.push(['launch', id]); setTimeout(ok, 0); }
    },
    systeminfo: { getPropertyValue: function (p, ok) { setTimeout(function () { ok(sources); }, 0); } },
    tvwindow: { setSource: function (src, ok) { window.__MOCK_LOG.push(['input', src.number]); setTimeout(ok, 0); } },
    tvinputdevice: { registerKey: function () {} }
  };
})();
