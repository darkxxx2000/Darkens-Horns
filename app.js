// Mirador: catálogo de anime. Datos: API pública de AniList (GraphQL). Sin contenido adulto.
const API = 'https://graphql.anilist.co';
const FIELDS = `id title{romaji english} coverImage{large} averageScore episodes format status seasonYear genres description(asHtml:false) siteUrl externalLinks{site url type}`;
const QUERY = `query($page:Int,$perPage:Int,$sort:[MediaSort],$search:String,$genre:String,$status:MediaStatus){
  Page(page:$page,perPage:$perPage){pageInfo{hasNextPage} media(type:ANIME,isAdult:false,sort:$sort,search:$search,genre:$genre,status:$status){${FIELDS}}}}`;
const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];
const GENRES_ES = {Action:'Acción',Adventure:'Aventura',Comedy:'Comedia',Drama:'Drama',Fantasy:'Fantasía',Horror:'Terror','Mahou Shoujo':'Chicas mágicas',Mecha:'Mecha',Music:'Música',Mystery:'Misterio',Psychological:'Psicológico',Romance:'Romance','Sci-Fi':'Ciencia ficción','Slice of Life':'Recuentos de la vida',Sports:'Deportes',Supernatural:'Sobrenatural',Thriller:'Suspense'};
const VIEWS = {
  trending:{t:'Tendencias',sort:['TRENDING_DESC']},
  popular:{t:'Populares',sort:['POPULARITY_DESC']},
  top:{t:'Mejor valorados',sort:['SCORE_DESC']},
  airing:{t:'En emisión',sort:['POPULARITY_DESC'],status:'RELEASING'}
};
const $ = (id) => document.getElementById(id);
const state = {view:'home', genre:null, search:'', page:1, hasNext:false, loading:false};

// ---- Modo contenido propio (contenido.js) ----
const LOCAL = Array.isArray(window.CATALOGO) && window.CATALOGO.length > 0;
const SITIO = Object.assign({nombre:'Mira', destacado:'dor', subtitulo:'', buscar:'', nota:'', enlaces:'Dónde verlo (oficial)'}, window.SITIO || {});
function normLocal(c,i){
  return {id:String(c.id||('l'+i)), title:String(c.titulo||'Sin título'), cover:String(c.imagen||''),
    score:c.puntuacion?String(c.puntuacion):null, fila:c.fila||'Destacados',
    full:{episodes:c.episodios||null, format:String(c.tipo||''), year:c.anio||null, genres:Array.isArray(c.generos)?c.generos:[],
      desc:String(c.descripcion||''), url:null, anime:String(c.anime||''), personaje:String(c.personaje||''), hashtags:Array.isArray(c.hashtags)?c.hashtags.map(String):[],
      links:(c.enlaces||[]).filter((l)=>l&&/^https:\/\//.test(l.url)).map((l)=>({site:String(l.texto||'Abrir'),url:l.url,custom:true}))}};
}
const LOCAL_ITEMS = LOCAL ? window.CATALOGO.map(normLocal) : [];
const LOCAL_ROWS = [];
if (LOCAL) {
  const filas = [];
  LOCAL_ITEMS.forEach((m)=>{ if(!filas.includes(m.fila)) filas.push(m.fila); });
  filas.forEach((f,i)=>{ VIEWS['f'+i]={t:f,fila:f}; LOCAL_ROWS.push('f'+i); });
  VIEWS.all={t:'Todo el catálogo'};
}
function localFetch(v){
  let items = LOCAL_ITEMS.slice();
  if (v.fila) items = items.filter((m)=>m.fila===v.fila);
  if (v.genre) items = items.filter((m)=>m.full.genres.includes(v.genre));
  if (v.search){ const q=v.search.toLowerCase().replace(/^#/,''); items = items.filter((m)=>[m.title,m.full.desc,m.full.anime,m.full.personaje,m.fila,m.full.genres.join(' '),m.full.hashtags.join(' ')].join(' ').toLowerCase().includes(q)); }
  const start=(v.page-1)*v.perPage;
  return Promise.resolve({items:items.slice(start,start+v.perPage), hasNext:items.length>start+v.perPage});
}
function genreList(){ return LOCAL ? [...new Set(LOCAL_ITEMS.flatMap((m)=>m.full.genres))] : GENRES; }
// Marca: nombre, logo y textos
(function(){
  const l=$('logo'); l.textContent=SITIO.nombre;
  const sp=document.createElement('span'); sp.textContent=SITIO.destacado; l.appendChild(sp);
  document.title=SITIO.nombre+SITIO.destacado+(SITIO.subtitulo?' · '+SITIO.subtitulo:'');
  $('q').placeholder = SITIO.buscar || (LOCAL ? 'Buscar…' : 'Buscar anime…');
  $('h-links').textContent = LOCAL ? (SITIO.enlaces==='Dónde verlo (oficial)'?'Enlaces':SITIO.enlaces) : SITIO.enlaces;
  if (LOCAL) {
    $('note').textContent = SITIO.nota;
    const t=document.querySelector('[data-view="trending"]'); t.dataset.view='all'; t.textContent='📚 Todo el catálogo';
    ['popular','top','airing'].forEach((v)=>{document.querySelector('[data-view="'+v+'"]').hidden=true;});
  }
})();

// ---- Listas guardadas en el navegador ----
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return []}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const lists = {pend:load('mirador:pend'), visto:load('mirador:visto')};
function has(k,id){return lists[k].some((m)=>m.id===id)}
function toggle(k,m){
  if(has(k,m.id)) lists[k]=lists[k].filter((x)=>x.id!==m.id);
  else lists[k].push({id:m.id,title:m.title,cover:m.cover,score:m.score,full:m.full});
  save('mirador:'+k,lists[k]); counts();
}
function counts(){$('n-pend').textContent=lists.pend.length;$('n-visto').textContent=lists.visto.length}

// ---- Datos ----
async function fetchMedia(v){
  if (LOCAL) return localFetch(v);
  const res = await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:QUERY,variables:v})});
  if(!res.ok) throw new Error('HTTP '+res.status);
  const j = await res.json();
  if(j.errors) throw new Error('Error de la API');
  return {items:j.data.Page.media.map(norm), hasNext:j.data.Page.pageInfo.hasNextPage};
}
function clean(html){
  const d=new DOMParser().parseFromString(String(html||'').replace(/<br\s*\/?>/gi,'\n'),'text/html');
  return (d.body.textContent||'').trim();
}
function norm(m){
  return {id:m.id,title:m.title.english||m.title.romaji,cover:m.coverImage.large,
    score:m.averageScore?(m.averageScore/10).toFixed(1):null,
    full:{episodes:m.episodes,format:m.format,status:m.status,year:m.seasonYear,genres:m.genres||[],desc:clean(m.description),url:m.siteUrl,
      links:(m.externalLinks||[]).filter((l)=>l.type==='STREAMING'&&/^https:\/\//.test(l.url)).map((l)=>({site:l.site,url:l.url}))}};
}

// ---- Tarjetas ----
function card(m){
  const b=document.createElement('button'); b.className='card'; b.type='button';
  const p=document.createElement('div'); p.className='poster';
  const img=document.createElement('img'); img.loading='lazy'; img.alt=''; img.src=m.cover; p.appendChild(img);
  if(m.score){const s=document.createElement('span'); s.className='badge'; s.textContent='★ '+m.score; p.appendChild(s);}
  const n=document.createElement('div'); n.className='name'; n.textContent=m.title;
  b.append(p,n); b.onclick=()=>openModal(m); return b;
}
function skeletons(n){
  const f=document.createDocumentFragment();
  for(let i=0;i<n;i++){const c=document.createElement('div');c.className='card skeleton';c.innerHTML='<div class="poster"></div>';f.appendChild(c)}
  return f;
}

// ---- Vistas ----
function setMsg(t){$('msg').textContent=t||''}
function setActive(v){document.querySelectorAll('.side [data-view]').forEach((b)=>b.classList.toggle('active',b.dataset.view===v))}

async function showHome(){
  state.view='home'; setActive('home'); $('more').hidden=true; setMsg('');
  const box=$('content'); box.innerHTML=''; $('title').textContent='Inicio';
  for(const key of (LOCAL?LOCAL_ROWS:['trending','popular','top'])){
    const wrap=document.createElement('section');
    const head=document.createElement('div'); head.className='row-head';
    const h=document.createElement('h2'); h.textContent=VIEWS[key].t;
    const nav=document.createElement('div'); nav.className='nav';
    const prev=document.createElement('button'); prev.textContent='‹'; prev.setAttribute('aria-label','Anterior');
    const next=document.createElement('button'); next.textContent='›'; next.setAttribute('aria-label','Siguiente');
    const all=document.createElement('button'); all.className='all'; all.textContent='Ver todo'; all.onclick=()=>showGrid(key);
    nav.append(prev,next,all); head.append(h,nav);
    const row=document.createElement('div'); row.className='row'; row.appendChild(skeletons(8));
    prev.onclick=()=>row.scrollBy({left:-row.clientWidth*.8}); next.onclick=()=>row.scrollBy({left:row.clientWidth*.8});
    wrap.append(head,row); box.appendChild(wrap);
    fetchMedia({page:1,perPage:20,sort:VIEWS[key].sort,fila:VIEWS[key].fila}).then((r)=>{row.innerHTML='';r.items.forEach((m)=>row.appendChild(card(m)))})
      .catch(()=>{row.innerHTML='';setMsg('No se pudo cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.')});
  }
}

async function showGrid(view,reset=true){
  if(state.loading) return;
  if(reset){state.view=view;state.page=1;$('content').innerHTML='<div class="grid" id="grid"></div>';setActive(view)}
  const v=view==='search'?{t:'Resultados'}:VIEWS[view];
  $('title').textContent=state.search&&view==='search'?'Resultados para «'+state.search+'»':v.t+(state.genre?' · '+(GENRES_ES[state.genre]||state.genre):'');
  const grid=$('grid'); const sk=skeletons(12); grid.appendChild(sk); state.loading=true; setMsg(''); $('more').hidden=true;
  try{
    const vars={page:state.page,perPage:30,sort:view==='search'?['SEARCH_MATCH']:v.sort};
    if(state.genre) vars.genre=state.genre; if(v.status) vars.status=v.status; if(LOCAL&&v.fila) vars.fila=v.fila; if(view==='search') vars.search=state.search;
    const r=await fetchMedia(vars);
    grid.querySelectorAll('.skeleton').forEach((e)=>e.remove());
    r.items.forEach((m)=>grid.appendChild(card(m)));
    state.hasNext=r.hasNext; $('more').hidden=!r.hasNext;
    if(!grid.children.length) setMsg('No hay resultados.');
  }catch(e){grid.querySelectorAll('.skeleton').forEach((x)=>x.remove());setMsg('No se pudo cargar. Inténtalo de nuevo en unos segundos.')}
  state.loading=false;
}

function showList(k){
  state.view=k; setActive(k); $('more').hidden=true;
  $('title').textContent=k==='pend'?'Mis pendientes':'Vistos';
  const box=$('content'); box.innerHTML='<div class="grid" id="grid"></div>';
  lists[k].forEach((m)=>$('grid').appendChild(card(m)));
  setMsg(lists[k].length?'':'Todavía no hay nada aquí. Abre una ficha y usa los botones.');
}

async function showRandom(){
  if(LOCAL){ openModal(LOCAL_ITEMS[Math.floor(Math.random()*LOCAL_ITEMS.length)]); return; }
  setMsg('Buscando algo al azar…');
  try{
    const r=await fetchMedia({page:Math.ceil(Math.random()*200),perPage:1,sort:['POPULARITY_DESC']});
    setMsg(''); if(r.items[0]) openModal(r.items[0]);
  }catch(e){setMsg('No se pudo elegir uno al azar.')}
}

// ---- Ficha ----
let current=null;
function openModal(m){
  current=m; $('m-img').src=m.cover; $('m-title').textContent=m.title;
  const f=m.full||{}; const bits=[];
  if(m.score) bits.push('★ '+m.score); if(f.format) bits.push(String(f.format).replace('_',' ')); if(f.year) bits.push(f.year); if(f.episodes) bits.push(f.episodes+' episodios');
  $('m-meta').textContent=bits.join(' · ');
  const ex=[]; if(f.anime) ex.push('Anime: '+f.anime); if(f.personaje) ex.push('Personaje: '+f.personaje);
  $('m-extra').textContent=ex.join(' · '); $('m-extra').hidden=!ex.length;
  const hb=$('m-hash'); hb.innerHTML='';
  (f.hashtags||[]).forEach((t)=>{const b=document.createElement('button');b.type='button';b.className='tagbtn';b.textContent='#'+t;b.onclick=()=>{closeModal();$('q').value=t;$('search-form').requestSubmit()};hb.appendChild(b)});
  const tags=$('m-tags'); tags.innerHTML=''; (f.genres||[]).forEach((g)=>{const s=document.createElement('span');s.textContent=GENRES_ES[g]||g;tags.appendChild(s)});
  $('m-desc').textContent=f.desc||'Sin sinopsis disponible.';
  const links=$('m-links'); links.innerHTML='';
  (f.links||[]).forEach((l)=>links.appendChild(link('Ver en '+l.site,l.url)));
  if(f.url) links.appendChild(link('Ficha en AniList',f.url));
  if(!links.children.length) links.textContent='No hay enlaces oficiales registrados.';
  syncButtons(); $('modal').hidden=false; $('close').focus(); document.body.style.overflow='hidden';
}
function link(t,u){const a=document.createElement('a');a.textContent=t;a.href=u;a.target='_blank';a.rel='noopener noreferrer';return a}
function syncButtons(){
  const p=has('pend',current.id), v=has('visto',current.id);
  $('b-pend').textContent=p?'✓ En pendientes':'+ Quiero verlo'; $('b-pend').classList.toggle('on',p);
  $('b-visto').textContent=v?'✓ Visto':'Marcar como visto'; $('b-visto').classList.toggle('on',v);
}
function closeModal(){$('modal').hidden=true;document.body.style.overflow='';if(state.view==='pend'||state.view==='visto')showList(state.view)}
$('b-pend').onclick=()=>{toggle('pend',current);syncButtons()};
$('b-visto').onclick=()=>{toggle('visto',current);syncButtons()};
$('close').onclick=closeModal;
$('modal').addEventListener('click',(e)=>{if(e.target===$('modal'))closeModal()});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&!$('modal').hidden)closeModal()});

// ---- Navegación ----
document.querySelectorAll('.side [data-view]').forEach((b)=>b.onclick=()=>{
  const v=b.dataset.view; $('side').classList.remove('open');
  if(v!=='random'){state.search='';$('q').value='';}
  if(v==='home'){state.genre=null;renderChips();showHome()}
  else if(v==='random') showRandom();
  else if(v==='pend'||v==='visto') showList(v);
  else showGrid(v);
});
$('menu').onclick=()=>$('side').classList.toggle('open');
$('logo').onclick=(e)=>{e.preventDefault();state.genre=null;state.search='';$('q').value='';renderChips();showHome()};
$('more').onclick=()=>{state.page++;showGrid(state.view,false)};
$('search-form').onsubmit=(e)=>{e.preventDefault();const q=$('q').value.trim();if(!q)return;state.search=q;state.genre=null;renderChips();showGrid('search')};

function renderChips(){
  const box=$('chips'); box.innerHTML='';
  const all=document.createElement('button'); all.className='chip'+(state.genre?'':' on'); all.textContent='Todo';
  all.onclick=()=>{state.genre=null;renderChips();state.view==='home'||state.view==='pend'||state.view==='visto'?showHome():showGrid(state.view)};
  box.appendChild(all);
  genreList().forEach((g)=>{
    const c=document.createElement('button'); c.className='chip'+(state.genre===g?' on':''); c.textContent=GENRES_ES[g]||g;
    c.onclick=()=>{state.genre=g;state.search='';$('q').value='';renderChips();showGrid(['home','pend','visto','search'].includes(state.view)?(LOCAL?'all':'popular'):state.view)};
    box.appendChild(c);
  });
}

counts(); renderChips(); showHome();
