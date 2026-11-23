// Carga y normaliza el catálogo (contenido.js + datos.json) y define los tipos.
(function () {
  var TYPES = [
    { name: 'Comic', color: '#ef4444' },
    { name: 'Gallery', color: '#3b82f6' },
    { name: 'Post', color: '#22c55e' },
    { name: 'Light Novel', color: '#f97316' },
    { name: 'Video', color: '#8b5cf6' },
    { name: 'Contact', color: '#6b7280' }
  ];
  var COLORS = {};
  TYPES.forEach(function (t) { COLORS[t.name] = t.color; });
  var LEGACY = {
    'comic': 'Comic', 'cómic': 'Comic', 'gallery': 'Gallery', 'galería': 'Gallery', 'galeria': 'Gallery',
    'post': 'Post', 'novela ligera': 'Light Novel', 'light novel': 'Light Novel',
    'video': 'Video', 'vídeo': 'Video', 'contacto': 'Contact', 'contact': 'Contact'
  };
  function str(v) { return v == null ? '' : String(v); }
  function list(v) { return Array.isArray(v) ? v.map(function (x) { return str(x).trim(); }).filter(Boolean) : []; }
  function typeOf(c) {
    return LEGACY[str(c.tipo).trim().toLowerCase()] || LEGACY[str(c.fila).trim().toLowerCase()] || 'Comic';
  }
  function norm(c, i) {
    return {
      id: str(c.id || ('l' + i)), title: str(c.titulo).trim() || 'Untitled', cover: str(c.imagen),
      type: typeOf(c), series: str(c.anime).trim(), character: str(c.personaje).trim(),
      genres: list(c.generos), hashtags: list(c.hashtags), desc: str(c.descripcion),
      pages: list(c.paginas), video: str(c.video).trim(), date: Number(c.fecha) || 0, order: i
    };
  }
  function load() {
    return fetch('datos.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (d) {
        var all = (window.CATALOGO || []).concat(Array.isArray(d) ? d : []);
        return all.map(norm);
      });
  }
  function newest(a, b) { return (b.date - a.date) || (b.order - a.order); }
  function youtubeId(u) {
    var m = str(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }
  window.Catalog = {
    TYPES: TYPES, load: load, newest: newest, youtubeId: youtubeId,
    typeColor: function (n) { return COLORS[n] || '#6b7280'; }
  };
})();
