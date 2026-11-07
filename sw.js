/* Bablo Hub offline support + startup error reporting. */
const VERSION='bablo-offline-v32-posthog-analytics';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./offline-runtime.js','./posthog-analytics.js','./bablo-arcade.html','./arcade/','./arcade/index.html','./discover.html','./agr-101-food-security.html','./gst103-study-hub.html','./cos-101-plus-bank.js','./cos101plus-extracted.js','./mls101-data.js','./phy101-data.js','./mts-maths-topics.js','./mts-maths-induction-extra.js','./thermochemistry-data.js','./chm-practicals-native.js','./challenge-arena.js','./chess/','./chess/index.html','./chess/stockfish-worker.js','./practicals/','./practicals/index.html','./practicals/chm107-practicals.html','./practicals/phy107-practical.html','./chess-lab.html','./chess-lab/','./practicals/exp1-page.jpg','./practicals/exp1-readings.jpg','./practicals/exp2-page.jpg','./practicals/exp3-page.jpg','./practicals/exp4-page.jpg','./practicals/exp4-readings.jpg','./practicals/exp5-page.jpg','./practicals/exp5-procedure.jpg','./gst103-study-hub.html','./practicals/chm107-practical.html','./chm-practicals-native.js','./cos-101-plus-bank.js','./cos101plus-extracted.js','./mls101-data.js','./phy101-data.js','./mts-maths-topics.js','./mts-maths-induction-extra.js','./thermochemistry-data.js'];
const CHESS_EXTERNAL=['https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm','https://esm.sh/chess.js@1.4.0','https://cdn.jsdelivr.net/npm/stockfish@19.0.1/stockfish-19-lite-single.js','https://cdn.jsdelivr.net/npm/stockfish@19.0.1/stockfish-19-lite-single.wasm'];
function isChessExternal(url){return CHESS_EXTERNAL.includes(url.href)||(url.origin==='https://cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/stockfish@19.0.1/'))}
function timedFetch(req,ms,cacheMode){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(req,{signal:c.signal,cache:cacheMode||'default'}).finally(()=>clearTimeout(t));}
async function matchAny(req){const c=await caches.open(VERSION);return await c.match(req,{ignoreSearch:true})||await caches.match(req,{ignoreSearch:true});}
async function save(req,res){if(res&&res.ok&&res.type!=='opaque'){const c=await caches.open(VERSION);await c.put(req,res.clone());}}
async function decorate(res){
 if(!res||!res.ok||!(res.headers.get('content-type')||'').includes('text/html'))return res;
 try{let html=await res.text();if(!html.includes('id="app"')||html.includes('bablo-startup-guard'))return new Response(html,{status:res.status,headers:res.headers});
 const guard=`<script id="bablo-startup-guard">(function(){function show(t,d){if(document.getElementById('bablo-startup-error'))return;var x=document.createElement('div');x.id='bablo-startup-error';x.style.cssText='position:fixed;z-index:2147483647;inset:0;background:#0a1020;color:white;padding:26px 20px;font:16px/1.5 system-ui;overflow:auto';var h=document.createElement('h2');h.textContent=t;x.appendChild(h);var p=document.createElement('p');p.textContent=d;x.appendChild(p);var b=document.createElement('button');b.textContent='Try again';b.style.cssText='padding:12px 18px;border:0;border-radius:10px;background:#f0bd43;color:#111;font-weight:bold';b.onclick=function(){location.reload()};x.appendChild(b);document.body.appendChild(x)}window.addEventListener('error',function(e){show('Bablo Hub startup error',String(e.message||'Script error')+(e.filename?' • '+e.filename.split('/').pop():'')+(e.lineno?':'+e.lineno:''))});window.addEventListener('unhandledrejection',function(e){show('Bablo Hub startup error',String(e.reason&&e.reason.message||e.reason||'Promise failed'))});setTimeout(function(){var a=document.getElementById('app');if(a&&!a.children.length)show('Bablo Hub did not finish loading','The app failed to render. Tap Try again; if it repeats, send us this screen.')},25000)})();</script>`;
 html=html.replace(/<body([^>]*)>/i,m=>m+guard);
const analyticsTag='<script src="./posthog-analytics.js" defer></script>';
 if(!html.includes('posthog-analytics.js'))html=html.replace(/<\/body>/i,analyticsTag+'</body>');
 const runtimeTag='<script src="./offline-runtime.js" defer></script>';
 if(!html.includes('offline-runtime.js'))html=html.replace(/<\/body>/i,runtimeTag+'</body>');
 const h=new Headers(res.headers);h.delete('content-length');return new Response(html,{status:res.status,statusText:res.statusText,headers:h});
 }catch(e){return res}
}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(VERSION);for(const p of SHELL){try{const isHtml=p==='./'||p==='index.html'||p==='./index.html';const old=isHtml?null:await caches.match(p,{ignoreSearch:true});if(old&&!await c.match(p))await c.put(p,old)}catch(_){}}await Promise.all(SHELL.map(async p=>{try{const isHtml=p==='./'||p==='./index.html'||p==='index.html';const r=await timedFetch(p,isHtml?18000:7000);if(r.ok){const v=isHtml?await decorate(r):r;await c.put(p,v)}}catch(_){}}));await Promise.all(CHESS_EXTERNAL.map(async p=>{try{const r=await timedFetch(p,15000);if(r.ok||r.type==='opaque')await c.put(p,r.clone())}catch(_){}}));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>(k.startsWith('bablo-shell-')||k.startsWith('bablo-offline-'))&&k!==VERSION).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);
 if(q.method!=='GET'||(u.origin!==self.location.origin&&!isChessExternal(u)))return;
 if(u.origin===self.location.origin&&u.pathname==='/api/posthog-config')return;
 if(u.origin!==self.location.origin){e.respondWith((async()=>{const cached=await matchAny(q);if(cached)return cached;try{const r=await timedFetch(q,12000);if(r.ok){const c=await caches.open(VERSION);await c.put(q,r.clone())}return r}catch(_){return new Response('Chess rules module is not saved on this device yet. Connect once and open Bablo Chess to prepare offline play.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})());return;}
 const nav=q.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/';
 if(nav){
  e.respondWith((async()=>{
   const isHubShell=u.pathname==='/'||u.pathname.endsWith('/index.html');
   const cached=await matchAny(q);
   const shellFallback=isHubShell?(await matchAny('./index.html')||await matchAny('./')):null;
   if(cached||shellFallback){
    const hit=cached||shellFallback;
    e.waitUntil(timedFetch(q,9000,'reload').then(async r=>{if(r.ok){const v=await decorate(r);await save(q,v);if(isHubShell){await save('./index.html',v);await save('./',v)}}}).catch(()=>{}));
    return hit;
   }
   try{const r=await timedFetch(q,12000,'reload');if(r.ok){const v=await decorate(r);await save(q,v);if(isHubShell){await save('./index.html',v);await save('./',v)}return v}return r}
   catch(_){return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0a1020;color:white;padding:24px"><h2>Bablo Hub</h2><p>This page is not saved on this device yet. Reconnect briefly and open it once to make it available offline.</p><button onclick="location.reload()">Try again</button></body>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})}
  })());return;
 }
 const mathsAsset=/\/(?:mts-maths-topics|mts-maths-induction-extra)\.js$/.test(u.pathname);
 e.respondWith((async()=>{
  const cached=await matchAny(q);
  if(cached){
   e.waitUntil(timedFetch(q,9000).then(r=>save(q,r)).catch(()=>{}));
   return cached;
  }
  try{const r=await timedFetch(q,mathsAsset?12000:10000);if(r.ok)await save(q,r);return r}
  catch(_){return new Response('This resource has not been downloaded on this device yet. Reconnect briefly and open it once to save it for offline use.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
 })());
});
self.addEventListener('message',e=>{
 const d=e.data||{},source=e.source,reply=(e.ports&&e.ports[0])||source;
 if(d.type==='BABLO_PRECACHE'){
  e.waitUntil((async()=>{const c=await caches.open(VERSION);let saved=0;const pack=[...SHELL,...CHESS_EXTERNAL];for(const p of pack){try{const old=await c.match(p,{ignoreSearch:true});if(old){saved++;continue}const r=await timedFetch(p,15000);if(r.ok||r.type==='opaque'){await c.put(p,p==='./'||p==='./index.html'?await decorate(r):r);saved++}}catch(_){}}if(reply)reply.postMessage({type:'BABLO_PRECACHE_DONE',saved,total:pack.length})})());
  return;
 }
 if(d.type==='BABLO_CACHE_URLS'){
  e.waitUntil((async()=>{const id=String(d.courseId||'course').replace(/[^a-z0-9_-]/gi,'-').slice(0,60),cache=await caches.open('bablo-course-'+id);let saved=0,failed=0;const paths=Array.isArray(d.paths)?d.paths:[];for(const path of paths){try{const u=new URL(path,self.location.href);if(u.origin!==self.location.origin)throw new Error('Cross-origin resource');const r=await timedFetch(u.href,15000);if(!r.ok)throw new Error('HTTP '+r.status);await cache.put(u.href,r.clone());saved++;if(reply)reply.postMessage({type:'BABLO_CACHE_PROGRESS',courseId:id,saved,total:paths.length})}catch(_){failed++}}if(reply)reply.postMessage({type:'BABLO_CACHE_DONE',courseId:id,saved,failed,total:paths.length})})());
  return;
 }
 if(d.type==='BABLO_DELETE_COURSE'){
  e.waitUntil((async()=>{const id=String(d.courseId||'').replace(/[^a-z0-9_-]/gi,'-').slice(0,60);const deleted=await caches.delete('bablo-course-'+id);if(reply)reply.postMessage({type:'BABLO_DELETE_DONE',courseId:id,deleted})})());
 }
});
self.addEventListener('push',e=>{let d={title:'Bablo Hub',body:'',url:'./'};try{d=Object.assign(d,e.data.json())}catch(_){}e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const t=e.notification.data&&e.notification.data.url||'./';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(a=>{for(let i=0;i<a.length;i++)if('focus'in a[i])return a[i].focus();return clients.openWindow(t)}))});
