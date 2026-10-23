(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(root); }
  else { root.THS = root.THS || {}; root.THS.Home = factory(root); }
})(this, function (root) {
  'use strict';
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var TRACK_PAD = 24, SCALE_ROOM = 14;

  function init(opts) {
    var THS = root.THS;
    var doc = opts.document;
    var platform = opts.platform;
    var storage = opts.storage;
    var Catalog = THS.Catalog, Prefs = THS.Prefs, Focus = THS.Focus;
    var diag = THS.Diag.create(opts.now);
    var els = {
      stage: doc.getElementById('stage'), bg: doc.getElementById('bg'),
      apps: doc.getElementById('apps'), inputs: doc.getElementById('inputs'),
      hint: doc.getElementById('hint'), toast: doc.getElementById('toast'),
      diag: doc.getElementById('diag'), clock: doc.getElementById('clock'), date: doc.getElementById('date')
    };
    var state = { resolved: { visible: [], hidden: [], missing: [] }, prefs: Prefs.load(storage), focus: null, editing: false, inputStatus: null };
    var toastTimer = null;
    var HINT = els.hint.innerHTML;

    function appTiles() {
      return state.editing ? state.resolved.visible.concat(state.resolved.hidden) : state.resolved.visible;
    }
    function lengths() { return [appTiles().length, Catalog.INPUTS.length]; }
    function rowEl(i) { return i === 0 ? els.apps : els.inputs; }

    function attr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
    // Brand mark -> brand text -> TV icon -> label.
    function tileInner(t, brand) {
      if (brand && brand.mark) { return '<img class="mark" src="img/tiles/' + attr(t.key) + '.svg" alt="">'; }
      if (brand && brand.text) { return '<span class="wordmark">' + escapeHtml(brand.text) + '</span>'; }
      if (t.iconPath) { return '<img src="' + attr(t.iconPath) + '" alt="">'; }
      return escapeHtml(t.label);
    }
    function renderRow(el, tiles, hiddenFrom) {
      var html = '';
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var brand = THS.Brands.get(t.key);
        var logo = brand && (brand.mark || brand.text);
        var isConsole = el === els.inputs;
        var cls = 'tile' + (logo ? ' branded' : '') + (hiddenFrom !== undefined && i >= hiddenFrom ? ' is-hidden' : '');
        var style = logo ? ' style="background:' + brand.bg + ';color:' + brand.fg + '"' : '';
        var inner = isConsole
          ? tileInner(t, brand) + '<span class="meta"><span class="title">' + escapeHtml(t.label) + '</span>' + statusLine(t) + '</span>'
          : tileInner(t, brand);
        html += '<div class="' + cls + '" data-key="' + attr(t.key) + '" title="' + attr(t.label) + '" aria-label="' + attr(t.label) + '">' +
          '<div class="card"' + style + '>' + inner + '</div>' +
          (isConsole ? '' : '<div class="label">' + escapeHtml(t.label) + '</div>') + '</div>';
      }
      el.innerHTML = html;
    }
    // Console status: coloured dot (when the HDMI state is known) + "HDMI n"; non-HDMI cards say "TV menus".
    function statusLine(t) {
      if (!t.hdmi) { return '<span class="status">TV menus</span>'; }
      var known = state.inputStatus && state.inputStatus[t.hdmi] !== undefined;
      var dot = known ? '<span class="dot ' + (state.inputStatus[t.hdmi] ? 'on' : 'off') + '"></span>' : '';
      return '<span class="status">' + dot + 'HDMI ' + t.hdmi + '</span>';
    }
    function escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function updateHint() {
      if (!state.editing) { els.hint.innerHTML = HINT; return; }
      var m = state.resolved.missing;
      var names = [];
      for (var i = 0; i < m.length; i++) { names.push(m[i].label); }
      els.hint.textContent = names.length ? 'Not installed: ' + names.join(', ') : 'All apps found';
    }
    function render() {
      renderRow(els.apps, appTiles(), state.editing ? state.resolved.visible.length : undefined);
      renderRow(els.inputs, Catalog.INPUTS);
      state.focus = state.focus ? Focus.clamp(state.focus, lengths()) : Focus.initial(lengths());
      els.stage.className = state.editing ? 'editing' : '';
      updateHint();
      applyFocus();
    }
    // Keep the focused tile's scaled box inside the track's padding box.
    // The track has TRACK_PAD of padding before the first tile; SCALE_ROOM covers the 1.08 focus scale.
    function scrollIntoView(trackRow, tile) {
      var track = trackRow.parentNode;
      var left = tile.offsetLeft;
      var right = left + tile.offsetWidth;
      var shift = Math.max(0, TRACK_PAD + right + SCALE_ROOM - track.clientWidth);
      shift = Math.min(shift, Math.max(0, left + TRACK_PAD - SCALE_ROOM));
      trackRow.style.transform = shift ? 'translateX(' + (-shift) + 'px)' : '';
    }
    function applyFocus() {
      var old = els.stage.querySelector('.tile.focused');
      if (old) { old.className = old.className.replace(' focused', ''); }
      var f = Focus.current(state.focus);
      if (f.row < 0) { return; }
      var tile = rowEl(f.row).children[f.col];
      if (!tile) { return; }
      tile.className += ' focused';
      scrollIntoView(rowEl(f.row), tile);
    }
    function toast(msg) {
      els.toast.textContent = msg;
      els.toast.className = 'show';
      if (toastTimer) { clearTimeout(toastTimer); }
      toastTimer = setTimeout(function () { els.toast.className = ''; }, 3000);
    }
    function fail(e) { toast(e && e.message ? e.message : String(e)); }

    function focusedTile() {
      var f = Focus.current(state.focus);
      if (f.row === 0) { return { row: 0, tile: appTiles()[f.col] }; }
      if (f.row === 1) { return { row: 1, tile: Catalog.INPUTS[f.col] }; }
      return null;
    }
    function activate(sel) {
      if (!sel || !sel.tile) { return; }
      var t = sel.tile;
      var p;
      if (sel.row === 0) { p = platform.launchFirst((t.launchIds || []).concat([t.appId])); }
      else if (t.hdmi) { p = platform.openInput(t.hdmi); }
      else { p = platform.launch(Catalog.SAMSUNG_HOME_APP_ID); }
      p.then(null, fail);
    }
    function rearrange(dir) {
      var sel = focusedTile();
      var keys = [], i;
      var vis = state.resolved.visible;
      for (i = 0; i < vis.length; i++) { keys.push(vis[i].key); }
      if (state.focus.row !== 0 || !sel.tile || keys.indexOf(sel.tile.key) < 0) { return; }
      state.prefs = Prefs.move(state.prefs, keys, sel.tile.key, dir === 'left' ? -1 : 1);
      Prefs.save(storage, state.prefs);
      refresh(sel.tile.key);
    }
    // Re-resolve from the cached app list after a prefs change; focus follows the tile.
    function refresh(key) {
      state.resolved = Catalog.resolve(state.installed, Catalog.APPS, state.prefs);
      var tiles = appTiles();
      for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].key === key) { state.focus.cols[0] = i; }
      }
      render();
    }
    function toggleHide() {
      var sel = focusedTile();
      if (!sel || sel.row !== 0 || !sel.tile) { return; }
      state.prefs = Prefs.toggleHidden(state.prefs, sel.tile.key, Catalog.defaultHidden());
      Prefs.save(storage, state.prefs);
      refresh(sel.tile.key);
    }
    function showDiag() {
      var s = diag.summary();
      els.diag.textContent = 'TTI: ' + s.ttiMs + ' ms\nmoves: ' + s.moves + '\np50: ' + s.p50 + ' ms\np95: ' + s.p95 + ' ms';
    }
    function onKey(e) {
      var a = THS.Keys.action(e);
      if (!a) { return; }
      e.preventDefault();
      if (a === 'left' || a === 'right' || a === 'up' || a === 'down') {
        if (state.editing && state.focus.row === 0 && (a === 'left' || a === 'right')) { rearrange(a); return; }
        var next = Focus.move(state.focus, a, lengths());
        if (next === state.focus) { return; }
        diag.moveStart();
        state.focus = next;
        applyFocus();
        requestAnimationFrame(function () { diag.moveEnd(); });
      } else if (a === 'ok') {
        if (!state.editing) { activate(focusedTile()); }
      } else if (a === 'back') {
        if (state.editing) { state.editing = false; render(); }
      } else if (a === 'yellow') {
        state.editing = !state.editing;
        render();
      } else if (a === 'blue') {
        if (state.editing) { toggleHide(); }
      } else if (a === 'red') {
        if (els.diag.className === 'open') { els.diag.className = ''; }
        else { showDiag(); els.diag.className = 'open'; }
      }
    }
    function tickClock() {
      var d = new Date();
      var m = d.getMinutes();
      els.clock.textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (m < 10 ? '0' : '') + m;
      els.date.textContent = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
    }

    // HDMI connection dots: best effort, never surfaces an error.
    function refreshInputStatus() {
      if (!platform.inputStatus) { return; }
      platform.inputStatus().then(function (st) {
        state.inputStatus = st;
        if (state.focus) { renderRow(els.inputs, Catalog.INPUTS); applyFocus(); }
      }, function () { /* no dot */ });
    }

    platform.registerKeys(THS.Keys.TIZEN_KEYS);
    var wp = opts.wallpapers;
    var idx = THS.Wallpaper.pickIndex(wp.length, new Date());
    if (idx >= 0) { els.bg.style.backgroundImage = 'url("' + wp[idx] + '")'; }
    tickClock();
    setInterval(tickClock, 30000);
    doc.addEventListener('keydown', onKey);
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) { refreshInputStatus(); } });
    refreshInputStatus();
    state.installed = [];
    platform.listApps().then(function (apps) {
      state.installed = apps;
      state.resolved = Catalog.resolve(apps, Catalog.APPS, state.prefs);
      render();
    }, function () {
      render();
      toast("Couldn't read apps");
    }).then(function () { diag.markInteractive(); });
  }
  return { init: init };
});
