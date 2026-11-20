// =====================================================================
//  TEXTOS DE TU WEB. Las imágenes se suben desde el panel admin (admin.html);
//  no hace falta tocar CATALOGO aquí. Si no hay ninguna imagen subida,
//  la web muestra el catálogo automático de AniList.
// =====================================================================
window.SITIO = {
  nombre: 'Mi',
  destacado: 'Catálogo',
  subtitulo: 'Mi colección',
  buscar: 'Buscar por título, anime, personaje o #hashtag…',
  enlaces: 'Enlaces',
  nota: 'Colección personal.',
  // Comentarios (Giscus). Rellena estos 4 datos cuando los tengas; si no, los comentarios no aparecen.
  giscus: { repo: '', repoId: '', category: '', categoryId: '' }
};

// Opcional: elementos escritos a mano (se suman a los del panel admin).
window.CATALOGO = [];
