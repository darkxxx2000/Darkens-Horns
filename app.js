// Home: Latest / Featured, pestañas por tipo, secciones por género, serie y personaje.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SITE = window.SITE || {}, C = window.Catalog;
  var items = [];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function setMsg(t) { $('msg').textContent = t || ''; }
  function eq(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }

  // ---------- Marca ----------
  (function brand() {
    var l = $('logo'); l.textContent = SITE.name || 'My';
    var sp = el('span', null, SITE.highlight || 'Catalog'); l.appendChild(sp);
    document.title = (SITE.name || 'My') + (SITE.highlight || 'Catalog') + (SITE.tagline ? ' · ' + SITE.tagline : '');
    $('q').placeholder = SITE.searchPlaceholder || 'Search…';
    if (SITE.description) document.querySelector('meta[name="description"]').setAttribute('content', SITE.description);
  })();

  // ---------- Rutas por hash ----------
  var KINDS = ['type', 'genre', 'series', 'character', 'q'];
  function parseRoute() {
    var h = location.hash.replace(/^#/, ''), i = h.indexOf('=');
    if (i < 0) return { k: 'home' };
    var k = h.slice(0, i), v = '';
    try { v = decodeURIComponent(h.slice(i + 1)); } catch (e) { return { k: 'home' }; }
    return KINDS.indexOf(k) >= 0 && v ? { k: k, v: v } : { k: 'home' };
  }
  function nav(k, v) {
    var t = '#' + k + '=' + encodeURIComponent(v);
    if (location.hash === t) render(); else location.hash = t;
  }
  function goHome() { if (location.hash && location.hash !== '#') location.hash = ''; else render(); }

  // ---------- Componentes ----------
  function badge(type) { var b = el('span', 'badge-type', type); b.style.setProperty('--c', C.typeColor(type)); return b; }
  function card(it, likes) {
    var b = el('button', 'card'); b.type = 'button';
    var p = el('div', 'poster'), im = el('img');
    im.loading = 'lazy'; im.alt = it.title; im.src = it.cover; im.onerror = function () { im.style.visibility = 'hidden'; };
    p.append(im, badge(it.type));
    if (typeof likes === 'number') p.appendChild(el('span', 'likes', '♥ ' + likes));
    b.append(p, el('div', 'name', it.title));
    b.onclick = function () { openModal(it); };
    return b;
  }
  function skeletons(n) {
    var f = document.createDocumentFragment();
    for (var i = 0; i < n; i++) { var c = el('div', 'card skeleton'); c.appendChild(el('div', 'poster')); f.appendChild(c); }
    return f;
  }
  function rowSection(title, sub) {
    var wrap = el('section'), head = el('div', 'row-head'), h = el('h2', null, title);
    if (sub) h.appendChild(el('span', 'sub', sub));
    var nav2 = el('div', 'nav'), prev = el('button', null, '‹'), next = el('button', null, '›');
    prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
    var row = el('div', 'row');
    prev.onclick = function () { row.scrollBy({ left: -row.clientWidth * 0.8 }); };
    next.onclick = function () { row.scrollBy({ left: row.clientWidth * 0.8 }); };
    nav2.append(prev, next); head.append(h, nav2); wrap.append(head, row);
    return { wrap: wrap, row: row };
  }

  // ---------- Pestañas y géneros ----------
  function renderTabs(r) {
    var box = $('tabs'); box.innerHTML = '';
    function mk(label, color, on, fn) {
      var b = el('button', 'tab' + (on ? ' on' : '')); b.type = 'button';
      if (color) b.style.setProperty('--c', color);
      b.append(el('i'), document.createTextNode(label)); b.onclick = fn; return b;
    }
    box.appendChild(mk('Home', null, r.k === 'home', goHome));
    C.TYPES.forEach(function (t) {
      box.appendChild(mk(t.name, t.color, r.k === 'type' && eq(r.v, t.name), function () { nav('type', t.name); }));
    });
  }
  function renderChips(r) {
    var box = $('chips'); box.innerHTML = '';
    var count = {};
    items.forEach(function (it) { it.genres.forEach(function (g) { var k = g.toLowerCase(); (count[k] = count[k] || { n: 0, label: g }).n++; }); });
    Object.keys(count).map(function (k) { return count[k]; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 30).forEach(function (g) {
      var c = el('button', 'chip' + (r.k === 'genre' && eq(r.v, g.label) ? ' on' : ''), g.label); c.type = 'button';
      c.onclick = function () { nav('genre', g.label); }; box.appendChild(c);
    });
  }

  // ---------- Vistas ----------
  function showGrid(box, title, list) {
    $('title').textContent = title;
    box.appendChild(el('h2', 'sect-title', title + ' · ' + list.length + (list.length === 1 ? ' post' : ' posts')));
    if (!list.length) { setMsg('No posts found.'); return; }
    var g = el('div', 'grid');
    list.slice().sort(C.newest).forEach(function (it) { g.appendChild(card(it)); });
    box.appendChild(g);
  }
  function contactPanel() {
    var c = SITE.contact || {}, p = el('div', 'contact');
    p.appendChild(el('h2', 'sect-title', 'Contact')).style.marginTop = '0';
    var has = false;
    if (c.text) { p.appendChild(el('p', null, c.text)); has = true; }
    if (c.email) { var a = el('a', null, c.email); a.href = 'mailto:' + c.email; p.appendChild(a); has = true; }
    (c.links || []).forEach(function (l) {
      if (l && /^https:\/\//.test(l.url)) { var x = el('a', null, l.label || l.url); x.href = l.url; x.target = '_blank'; x.rel = 'noopener noreferrer'; p.appendChild(x); has = true; }
    });
    if (!has) p.appendChild(el('p', 'muted', 'Contact details have not been added yet.'));
    return p;
  }
  function home(box) {
    $('title').textContent = 'Home';
    if (!items.length) { setMsg('No posts yet.'); return; }
    var L = rowSection('Latest', 'Newest posts');
    items.slice().sort(C.newest).slice(0, 20).forEach(function (it) { L.row.appendChild(card(it)); });
    box.appendChild(L.wrap);
    var F = rowSection('Featured', 'Most liked');
    F.row.appendChild(skeletons(7)); box.appendChild(F.wrap);
    loadFeatured(F.row);
  }
  function loadFeatured(row) {
    function note(t) { row.innerHTML = ''; row.appendChild(el('p', 'muted', t)); }
    if (!Social.enabled) { note('Featured posts will appear here once likes are enabled.'); return; }
    var byId = {}; items.forEach(function (it) { byId[it.id] = it; });
    Social.topPosts(40).then(function (list) {
      row.innerHTML = ''; var n = 0;
      list.forEach(function (p) { if (n < 7 && byId[p.id]) { row.appendChild(card(byId[p.id], p.likes)); n++; } });
      if (!n) note('No likes yet. Sign in and like a post to see it here.');
    }).catch(function (e) { console.warn(e); note('Featured posts are unavailable right now.'); });
  }

  function render() {
    var r = parseRoute(), box = $('content');
    renderTabs(r); renderChips(r); box.innerHTML = ''; setMsg('');
    if (r.k === 'home') { home(box); return; }
    var list, title;
    if (r.k === 'type') {
      title = r.v; list = items.filter(function (i) { return eq(i.type, r.v); });
      if (eq(r.v, 'Contact')) box.appendChild(contactPanel());
    } else if (r.k === 'genre') { title = 'Genre: ' + r.v; list = items.filter(function (i) { return i.genres.some(function (g) { return eq(g, r.v); }); }); }
    else if (r.k === 'series') { title = 'Series: ' + r.v; list = items.filter(function (i) { return i.series && eq(i.series, r.v); }); }
    else if (r.k === 'character') { title = 'Character: ' + r.v; list = items.filter(function (i) { return i.character && eq(i.character, r.v); }); }
    else {
      var q = r.v.toLowerCase(); title = 'Results for “' + r.v + '”';
      list = items.filter(function (i) { return [i.title, i.desc, i.series, i.character, i.type, i.genres.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0; });
    }
    if (r.k === 'type' && eq(r.v, 'Contact') && !list.length) { $('title').textContent = 'Contact'; return; }
    showGrid(box, title, list);
  }

  // ---------- Ficha ----------
  function xlink(text, k, v) {
    var a = el('a', 'xlink', text); a.href = '#' + k + '=' + encodeURIComponent(v);
    a.onclick = function (e) { e.preventDefault(); closeModal(); nav(k, v); };
    return a;
  }
  function openModal(it) {
    $('m-img').src = it.cover; $('m-img').alt = it.title;
    var t = $('m-type'); t.innerHTML = ''; t.appendChild(badge(it.type));
    $('m-title').textContent = it.title;
    var meta = $('m-meta'); meta.innerHTML = '';
    if (it.series) { meta.append(el('b', null, 'Series: '), xlink(it.series, 'series', it.series)); }
    if (it.series && it.character) meta.appendChild(document.createTextNode('  ·  '));
    if (it.character) { meta.append(el('b', null, 'Character: '), xlink(it.character, 'character', it.character)); }
    meta.hidden = !(it.series || it.character);
    var tags = $('m-tags'); tags.innerHTML = '';
    it.genres.forEach(function (g) {
      var a = el('a', null, g); a.href = '#genre=' + encodeURIComponent(g);
      a.onclick = function (e) { e.preventDefault(); closeModal(); nav('genre', g); }; tags.appendChild(a);
    });
    $('m-desc').textContent = it.desc || 'No description yet.';
    var rd = $('b-read'), can = it.pages.length || C.youtubeId(it.video);
    rd.hidden = !can; if (can) rd.href = 'lector.html?id=' + encodeURIComponent(it.id);
    $('modal').hidden = false; $('close').focus(); document.body.style.overflow = 'hidden';
  }
  function closeModal() { $('modal').hidden = true; document.body.style.overflow = ''; }
  $('close').onclick = closeModal;
  $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

  // ---------- Arranque ----------
  $('logo').onclick = function (e) { e.preventDefault(); $('q').value = ''; goHome(); };
  $('search-form').onsubmit = function (e) { e.preventDefault(); var q = $('q').value.trim(); if (q) nav('q', q); };
  window.addEventListener('hashchange', render);
  Social.mountAuth($('auth')); Social.init();
  renderTabs({ k: 'home' }); $('content').appendChild(skeletons(8));
  C.load().then(function (list) { items = list; render(); });
})();
