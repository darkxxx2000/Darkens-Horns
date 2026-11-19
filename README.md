# Mirador · catálogo de anime

Web estática (HTML + CSS + JS, sin instalar nada). Muestra tendencias, populares y mejor valorados con datos de la API pública de [AniList](https://anilist.co), filtro por género, buscador, ficha con sinopsis, enlaces a plataformas oficiales y listas «pendientes» y «vistos» guardadas en tu navegador. No aloja vídeos ni muestra contenido adulto.

## Probar en local
Abre `index.html` en el navegador (o `python3 -m http.server` y entra en http://localhost:8000). Necesita internet para consultar AniList.

## Publicar en GitHub Pages
```bash
git init && git add . && git commit -m "Mirador"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mirador.git
git push -u origin main
```
En el repositorio: Settings → Pages → Deploy from a branch → `main` / `(root)`. Tu web quedará en `https://TU_USUARIO.github.io/mirador/`.

Aviso: los datos y portadas pertenecen a AniList y a sus autores; si publicas la web, cita a AniList como fuente.
