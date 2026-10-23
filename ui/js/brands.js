(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.THS = root.THS || {}; root.THS.Brands = factory(); }
})(this, function () {
  'use strict';
  // Tile key -> brand. mark: file in assets/marks (built to img/tiles/<key>.svg); text: fallback wordmark.
  var BRANDS = {
    netflix: { mark: 'netflix', bg: '#141414', fg: '#e50914' },
    iplayer: { text: 'iPlayer', bg: 'linear-gradient(135deg,#f54997,#8a3dd8)', fg: '#fff' },
    disney: { mark: 'disneyplus', bg: 'linear-gradient(135deg,#091550,#1f5bd8)', fg: '#fff' },
    appletv: { mark: 'appletv', bg: '#1c1c1e', fg: '#fff' },
    plex: { mark: 'plex', bg: '#1f1f1f', fg: '#e5a00d' },
    youtube: { mark: 'youtube', bg: '#e62117', fg: '#fff' },
    twitch: { mark: 'twitch', bg: '#9146ff', fg: '#fff' },
    spotify: { mark: 'spotify', bg: '#121212', fg: '#1ed760' },
    itvx: { mark: 'itvx', bg: '#0a0a0a', fg: '#ffffff' },
    channel4: { mark: 'channel4', bg: '#1b1b1b', fg: '#ffffff' },
    now: { text: 'NOW', bg: '#000000', fg: '#00e5c4' },
    tvplus: { text: 'TV Plus', bg: '#1428a0', fg: '#fff' },
    gallery: { text: 'Gallery', bg: '#5b2bd6', fg: '#fff' },
    internet: { text: 'Internet', bg: '#2b6be6', fg: '#fff' },
    steam: { mark: 'steam', bg: 'linear-gradient(135deg,#0b1a2e,#1b3a5f)', fg: '#fff' },
    'switch': { mark: 'nintendoswitch', bg: 'linear-gradient(135deg,#b3000e,#ff2a2a)', fg: '#fff' },
    'samsung-home': { mark: 'samsung', bg: '#1428a0', fg: '#fff' }
  };
  function get(key) {
    return Object.prototype.hasOwnProperty.call(BRANDS, key) ? BRANDS[key] : null;
  }
  return { BRANDS: BRANDS, get: get };
});
