// Inicio de sesión (Google, X/Twitter, Facebook), likes, comentarios y perfil con Firebase.
// Se activa rellenando window.SITE.firebase en contenido.js.
(function () {
  'use strict';
  var SITE = window.SITE || {};
  var cfg = SITE.firebase || {};
  var enabled = !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  var BASE = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var fbPromise = null, listeners = [], mounts = [], popEl = null, popKind = '';
  var profCache = {};
  var S = window.Social = { enabled: enabled, user: null, profile: null, ready: false };

  var ICONS = {
    google: '<svg viewBox="0 0 24 24" fill="#4285F4" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
  };
  var LABELS = { google: 'Continue with Google', twitter: 'Continue with X (Twitter)', facebook: 'Continue with Facebook' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  S.toast = function (msg) {
    if (!msg) return;
    var t = el('div', 'toast', msg); t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4500);
  };

  // ---------- Carga de Firebase ----------
  function load() {
    if (!enabled) return Promise.reject(new Error('Sign-in is not available yet.'));
    if (!fbPromise) {
      fbPromise = Promise.all([
        import(BASE + 'firebase-app.js'), import(BASE + 'firebase-auth.js'), import(BASE + 'firebase-firestore.js')
      ]).then(function (m) {
        var app = m[0].initializeApp(cfg);
        return { A: m[1], F: m[2], auth: m[1].getAuth(app), db: m[2].getFirestore(app) };
      });
    }
    return fbPromise;
  }

  function notify() {
    S.ready = true; closePop(); renderAuth();
    listeners.forEach(function (f) { try { f(); } catch (e) { console.warn(e); } });
  }
  S.onChange = function (f) { listeners.push(f); if (S.ready) f(); };

  function ensureProfile(fb, u) {
    var ref = fb.F.doc(fb.db, 'profiles', u.uid);
    return fb.F.getDoc(ref).then(function (snap) {
      if (snap.exists()) { var d = snap.data(); return { name: d.name || 'Reader', photo: d.photo || '' }; }
      // Perfil anónimo por defecto: nunca se usa el nombre real del proveedor.
      var p = { name: 'Reader' + (1000 + Math.floor(Math.random() * 9000)), photo: '', updated: Date.now() };
      return fb.F.setDoc(ref, p).then(function () { return { name: p.name, photo: '' }; });
    });
  }

  S.init = function () {
    if (!enabled) { notify(); return; }
    load().then(function (fb) {
      fb.A.onAuthStateChanged(fb.auth, function (u) {
        if (!u) { S.user = null; S.profile = null; notify(); return; }
        ensureProfile(fb, u).then(function (p) { S.user = u; S.profile = p; notify(); })
          .catch(function (e) { console.warn(e); S.user = u; S.profile = { name: 'Reader', photo: '' }; notify(); });
      });
    }).catch(function (e) { console.warn('Firebase could not load', e); notify(); });
  };

  // ---------- Avatar ----------
  S.avatar = function (p, size) {
    size = size || 32; p = p || {};
    var e;
    if (p.photo) { e = el('img', 'avatar'); e.src = p.photo; e.alt = ''; }
    else {
      var n = p.name || '?', h = 0;
      e = el('span', 'avatar', n.charAt(0).toUpperCase());
      for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
      e.style.background = 'hsl(' + h + ',55%,42%)';
    }
    e.style.width = e.style.height = size + 'px'; e.style.fontSize = Math.round(size * 0.45) + 'px';
    return e;
  };

  // ---------- Sesión ----------
  function authMessage(e) {
    var c = e && e.code;
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return '';
    if (c === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow popups for this site and try again.';
    if (c === 'auth/account-exists-with-different-credential') return 'An account with the same email already exists using another sign-in method. Use that one instead.';
    if (c === 'auth/unauthorized-domain') return 'This website is not authorized in the Firebase settings yet.';
    if (c === 'auth/operation-not-allowed') return 'This sign-in method is not enabled yet.';
    if (c === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
    return (e && e.message) || 'Sign-in failed. Please try again.';
  }
  S.signIn = function (name) {
    return load().then(function (fb) {
      var P = { google: fb.A.GoogleAuthProvider, twitter: fb.A.TwitterAuthProvider, facebook: fb.A.FacebookAuthProvider }[name];
      return fb.A.signInWithPopup(fb.auth, new P());
    }).catch(function (e) { throw new Error(authMessage(e)); });
  };
  S.signOut = function () { return load().then(function (fb) { return fb.A.signOut(fb.auth); }); };

  S.saveProfile = function (p) {
    var name = String(p.name || '').trim(), photo = String(p.photo || '');
    if (name.length < 2 || name.length > 24) return Promise.reject(new Error('Name must be 2 to 24 characters long.'));
    if (photo.length > 40000) return Promise.reject(new Error('That photo is too large.'));
    return load().then(function (fb) {
      var u = fb.auth.currentUser;
      if (!u) throw new Error('Please sign in first.');
      return fb.F.setDoc(fb.F.doc(fb.db, 'profiles', u.uid), { name: name, photo: photo, updated: Date.now() }).then(function () {
        S.profile = { name: name, photo: photo }; delete profCache[u.uid]; notify();
      });
    });
  };

  // ---------- Likes ----------
  S.likeInfo = function (id) {
    return load().then(function (fb) {
      var F = fb.F, u = fb.auth.currentUser;
      return Promise.all([
        F.getDoc(F.doc(fb.db, 'posts', id)),
        u ? F.getDoc(F.doc(fb.db, 'likes', id + '_' + u.uid)) : Promise.resolve(null)
      ]).then(function (r) {
        return { count: r[0].exists() ? (r[0].data().likes || 0) : 0, liked: !!(r[1] && r[1].exists()) };
      });
    });
  };
  S.toggleLike = function (id) {
    return load().then(function (fb) {
      var F = fb.F, u = fb.auth.currentUser;
      if (!u) throw new Error('Please sign in to like.');
      var likeRef = F.doc(fb.db, 'likes', id + '_' + u.uid), postRef = F.doc(fb.db, 'posts', id);
      return F.getDoc(likeRef).then(function (l) {
        var b = F.writeBatch(fb.db);
        if (l.exists()) { b.delete(likeRef); b.set(postRef, { likes: F.increment(-1) }, { merge: true }); }
        else { b.set(likeRef, { post: id, uid: u.uid, created: Date.now() }); b.set(postRef, { likes: F.increment(1) }, { merge: true }); }
        return b.commit();
      });
    }).then(function () { return S.likeInfo(id); })
      .catch(function (e) {
        if (e && e.code === 'permission-denied') throw new Error('Could not save your like. The database rules may not be set up yet.');
        throw e;
      });
  };
  S.topPosts = function (n) {
    return load().then(function (fb) {
      var F = fb.F;
      return F.getDocs(F.query(F.collection(fb.db, 'posts'), F.orderBy('likes', 'desc'), F.limit(n))).then(function (snap) {
        var out = [];
        snap.forEach(function (d) { var v = d.data().likes || 0; if (v > 0) out.push({ id: d.id, likes: v }); });
        return out;
      });
    });
  };

  // ---------- Comentarios ----------
  function getProfile(fb, uid) {
    if (profCache[uid]) return Promise.resolve(profCache[uid]);
    return fb.F.getDoc(fb.F.doc(fb.db, 'profiles', uid)).then(function (s) {
      var d = s.exists() ? s.data() : {};
      return (profCache[uid] = { name: d.name || 'Reader', photo: d.photo || '' });
    }).catch(function () { return { name: 'Reader', photo: '' }; });
  }
  S.comments = function (id) {
    return load().then(function (fb) {
      var F = fb.F;
      return F.getDocs(F.query(F.collection(fb.db, 'comments'), F.where('post', '==', id), F.limit(200))).then(function (snap) {
        var arr = [];
        snap.forEach(function (d) { var v = d.data(); arr.push({ id: d.id, uid: v.uid, text: v.text, created: v.created }); });
        arr.sort(function (a, b) { return b.created - a.created; });
        var uids = Array.from(new Set(arr.map(function (c) { return c.uid; })));
        return Promise.all(uids.map(function (u) { return getProfile(fb, u); })).then(function () {
          arr.forEach(function (c) { c.profile = profCache[c.uid] || { name: 'Reader', photo: '' }; });
          return arr;
        });
      });
    });
  };
  S.addComment = function (id, text) {
    text = String(text || '').trim().slice(0, 1000);
    if (!text) return Promise.reject(new Error('Write something first.'));
    return load().then(function (fb) {
      var u = fb.auth.currentUser;
      if (!u) throw new Error('Please sign in to comment.');
      return fb.F.addDoc(fb.F.collection(fb.db, 'comments'), { post: id, uid: u.uid, text: text, created: Date.now() });
    }).catch(function (e) {
      if (e && e.code === 'permission-denied') throw new Error('Could not post your comment. The database rules may not be set up yet.');
      throw e;
    });
  };
  S.deleteComment = function (cid) {
    return load().then(function (fb) { return fb.F.deleteDoc(fb.F.doc(fb.db, 'comments', cid)); });
  };

  // ---------- Interfaz: botón de sesión, ventana de proveedores, perfil ----------
  S.mountAuth = function (box) { if (box) { mounts.push(box); renderAuth(); } };

  function closePop() { if (popEl) { popEl.remove(); popEl = null; popKind = ''; } }

  function openPop(box, kind) {
    closePop(); popKind = kind;
    var p = el('div', 'pop'); p.setAttribute('role', 'dialog');
    if (kind === 'in') {
      p.appendChild(el('h3', null, 'Sign in'));
      p.appendChild(el('p', null, enabled ? 'Sign in to like posts and join the conversation.' : 'Sign-in is not available yet.'));
      ['google', 'twitter', 'facebook'].forEach(function (name) {
        var b = el('button', 'prov'); b.type = 'button'; b.disabled = !enabled;
        b.setAttribute('aria-label', LABELS[name]);
        b.innerHTML = ICONS[name];
        b.appendChild(el('span', null, LABELS[name]));
        b.onclick = function () {
          S.signIn(name).then(function () { closePop(); }).catch(function (e) { S.toast(e.message); });
        };
        p.appendChild(b);
      });
      p.appendChild(el('p', null, 'Your real name and photo are never shown. You choose a public nickname and picture in your profile.')).style.marginTop = '12px';
    } else {
      p.appendChild(el('h3', null, S.profile ? S.profile.name : 'Account'));
      var ed = el('button', 'item', 'Edit profile'); ed.type = 'button'; ed.onclick = function () { closePop(); openProfile(); };
      var so = el('button', 'item', 'Sign out'); so.type = 'button';
      so.onclick = function () { S.signOut().then(closePop).catch(function (e) { S.toast(e.message); }); };
      p.append(ed, so);
    }
    box.appendChild(p); popEl = p;
  }

  S.promptSignIn = function (msg) {
    if (msg) S.toast(msg);
    if (mounts[0]) { window.scrollTo({ top: 0, behavior: 'smooth' }); openPop(mounts[0], 'in'); }
  };

  function renderAuth() {
    mounts.forEach(function (box) {
      box.innerHTML = '';
      if (S.user && S.profile) {
        var b = el('button', 'userbtn'); b.type = 'button';
        b.append(S.avatar(S.profile, 30), el('span', 'uname', S.profile.name));
        b.onclick = function (e) { e.stopPropagation(); popKind === 'user' ? closePop() : openPop(box, 'user'); };
        box.appendChild(b);
      } else {
        var s = el('button', 'btn signin', 'Sign in'); s.type = 'button';
        s.onclick = function (e) { e.stopPropagation(); popKind === 'in' ? closePop() : openPop(box, 'in'); };
        box.appendChild(s);
      }
    });
  }
  document.addEventListener('click', function (e) { if (popEl && !popEl.contains(e.target)) closePop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });

  function resizeSquare(file, cb) {
    var img = new Image(), u = URL.createObjectURL(file);
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
      URL.revokeObjectURL(u); cb(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function () { URL.revokeObjectURL(u); cb(''); };
    img.src = u;
  }

  function openProfile() {
    if (!S.profile) return;
    var photo = S.profile.photo || '';
    var ovl = el('div', 'ovl'), dlg = el('div', 'dlg'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.appendChild(el('h3', null, 'Your public profile'));
    dlg.appendChild(el('p', 'note', 'Your real name and photo from Google, X or Facebook are never shown. Only the nickname and picture below are public, so you can stay anonymous.'));
    var prow = el('div', 'prow'), prev = el('span');
    function paint() { prev.innerHTML = ''; prev.appendChild(S.avatar({ name: nameIn.value || S.profile.name, photo: photo }, 80)); }
    var pick = el('button', 'btn alt', 'Choose photo'); pick.type = 'button';
    var rm = el('button', 'btn alt', 'Remove'); rm.type = 'button';
    var file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    pick.onclick = function () { file.click(); };
    rm.onclick = function () { photo = ''; paint(); };
    file.onchange = function () { var f = file.files[0]; if (f) resizeSquare(f, function (d) { if (d) { photo = d; paint(); } }); };
    prow.append(prev, pick, rm, file);
    var lab = el('label', null, 'Nickname (2–24 characters)'); lab.setAttribute('for', 'pf-name');
    var nameIn = el('input'); nameIn.type = 'text'; nameIn.id = 'pf-name'; nameIn.maxLength = 24; nameIn.value = S.profile.name;
    nameIn.oninput = paint;
    var err = el('div', 'err');
    var btns = el('div', 'btns'), save = el('button', 'btn', 'Save'), cancel = el('button', 'btn alt', 'Cancel');
    save.type = cancel.type = 'button';
    cancel.onclick = function () { ovl.remove(); };
    save.onclick = function () {
      save.disabled = true; err.textContent = '';
      S.saveProfile({ name: nameIn.value, photo: photo }).then(function () { ovl.remove(); S.toast('Profile saved.'); })
        .catch(function (e) { err.textContent = e.message; save.disabled = false; });
    };
    btns.append(save, cancel);
    dlg.append(prow, lab, nameIn, err, btns);
    ovl.appendChild(dlg); document.body.appendChild(ovl); paint();
    ovl.addEventListener('mousedown', function (e) { if (e.target === ovl) ovl.remove(); });
    nameIn.focus();
  }
})();
