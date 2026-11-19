// =====================================================================
//  CONTENIDO DE TU WEB: edita este archivo para cambiar títulos,
//  imágenes y la información que se ve al hacer clic en cada una.
//  Si dejas CATALOGO vacío ( window.CATALOGO = []; ) la web vuelve
//  a mostrar el catálogo automático de AniList.
// =====================================================================

// 1) Nombre y textos de la web
window.SITIO = {
  nombre: 'Mi',              // primera parte del logo
  destacado: 'Catálogo',     // segunda parte (sale en otro color)
  subtitulo: 'Mi colección', // texto de la pestaña del navegador
  buscar: 'Buscar…',         // texto del buscador
  enlaces: 'Enlaces',        // título de la sección de enlaces en cada ficha
  nota: 'Colección personal.' // texto pequeño del menú lateral
};

// 2) Tus elementos. Copia y pega un bloque { ... }, separado por comas.
//    - imagen: ruta a un archivo que subas a tu repositorio (ej. 'imagenes/foto1.jpg')
//              o un enlace https a una imagen. Mejor formato vertical (2:3).
//    - fila: nombre de la fila donde aparece en Inicio (cada nombre distinto crea una fila).
//    - generos: etiquetas; con ellas se crean los botones de filtro.
//    - enlaces: botones al final de la ficha (solo se aceptan direcciones https).
window.CATALOGO = [
  {
    titulo: 'Título de ejemplo 1',
    imagen: 'https://picsum.photos/seed/uno/400/600',
    fila: 'Destacados',
    generos: ['Ejemplo', 'Aventura'],
    puntuacion: 4.5,
    anio: 2024,
    tipo: 'Serie',
    episodios: 12,
    descripcion: 'Aquí va el texto que se verá al hacer clic en esta imagen. Puedes escribir varios párrafos.',
    enlaces: [{ texto: 'Ver más', url: 'https://example.com' }]
  },
  {
    titulo: 'Título de ejemplo 2',
    imagen: 'https://picsum.photos/seed/dos/400/600',
    fila: 'Destacados',
    generos: ['Ejemplo', 'Comedia'],
    puntuacion: 4.0,
    anio: 2023,
    tipo: 'Película',
    descripcion: 'Segunda descripción de ejemplo. Cámbiala por la tuya.',
    enlaces: []
  },
  {
    titulo: 'Título de ejemplo 3',
    imagen: 'https://picsum.photos/seed/tres/400/600',
    fila: 'Novedades',
    generos: ['Ejemplo', 'Drama'],
    puntuacion: 3.8,
    anio: 2025,
    descripcion: 'Tercera descripción de ejemplo.',
    enlaces: []
  }
];
