/* Bablo Hub offline support + startup error reporting. */
const VERSION='bablo-offline-v24-instant-campus';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./offline-runtime.js','./bablo-arcade.html','./arcade','./discover.html','./agr-101-food-security.html','./gst103-study-hub.html','./cos-101-plus-bank.js','./cos101plus-extracted.js','./mls101-data.js','./phy101-data.js','./mts-maths-topics.js','./mts-maths-induction-extra.js','./thermochemistry-data.js','./chm-practicals-native.js','./challenge-arena.js','./practicals/','./practicals/index.html','./practicals/chm107-practicals.html','./practicals/phy107-practical.html'];
function timedFetch(req,ms,cacheMode){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(req,{signal:c.signal,cache:cacheMode||'default'}).finally(()=>clearTimeout(t));}
async function matchAny(req){const c=await caches.open(VERSION);return await c.match(req,{ignoreSearch:true})||await caches.match(req,{ignoreSearch:true});}
async function save(req,res){if(res&&res.ok&&res.type!=='opaque'){const c=await caches.open(VERSION);await c.put(req,res.clone());}}
async function decorate(res){
 if(!res||!res.ok||!(res.headers.get('content-type')||'').includes('text/html'))return res;
 try{let html=await res.text();if(!html.includes('id="app"')||html.includes('bablo-startup-guard'))return new Response(html,{status:res.status,headers:res.headers});
 const guard=`<script id="bablo-startup-guard">(function(){function show(t,d){if(document.getElementById('bablo-startup-error'))return;var x=document.createElement('div');x.id='bablo-startup-error';x.style.cssText='position:fixed;z-index:2147483647;inset:0;background:#0a1020;color:white;padding:26px 20px;font:16px/1.5 system-ui;overflow:auto';var h=document.createElement('h2');h.textContent=t;x.appendChild(h);var p=document.createElement('p');p.textContent=d;x.appendChild(p);var b=document.createElement('button');b.textContent='Try again';b.style.cssText='padding:12px 18px;border:0;border-radius:10px;background:#f0bd43;color:#111;font-weight:bold';b.onclick=function(){location.reload()};x.appendChild(b);document.body.appendChild(x)}window.addEventListener('error',function(e){show('Bablo Hub startup error',String(e.message||'Script error')+(e.filename?' • '+e.filename.split('/').pop():'')+(e.lineno?':'+e.lineno:''))});window.addEventListener('unhandledrejection',function(e){show('Bablo Hub startup error',String(e.reason&&e.reason.message||e.reason||'Promise failed'))});setTimeout(function(){var a=document.getElementById('app');if(a&&!a.children.length)show('Bablo Hub did not finish loading','The app failed to render. Tap Try again; if it repeats, send us this screen.')},25000)})();</script>`;
 html=html.replace(/<body([^>]*)>/i,m=>m+guard);
const runtimeTag='<script src="./offline-runtime.js" defer></script>';
 if(!html.includes('offline-runtime.js'))html=html.replace(/<\/body>/i,runtimeTag+'</body>');
 const h=new Headers(res.headers);h.delete('content-length');return new Response(html,{status:res.status,statusText:res.statusText,headers:h});
 }catch(e){return res}
}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(VERSION);for(const p of SHELL){try{const isHtml=p==='./'||p==='index.html'||p==='./index.html';const old=isHtml?null:await caches.match(p,{ignoreSearch:true});if(old&&!await c.match(p))await c.put(p,old)}catch(_){}}await Promise.all(SHELL.map(async p=>{try{const isHtml=p==='./'||p==='./index.html'||p==='index.html';const r=await timedFetch(p,isHtml?18000:7000);if(r.ok){const v=isHtml?await decorate(r):r;await c.put(p,v)}}catch(_){}}));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>(k.startsWith('bablo-shell-')||k.startsWith('bablo-offline-'))&&k!==VERSION).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);
 if(q.method!=='GET'||u.origin!==self.location.origin)return;
 const nav=q.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/';
 if(nav){
  e.respondWith((async()=>{
   const cached=await matchAny(q)||await matchAny('./index.html')||await matchAny('./');
   if(cached){
    e.waitUntil(timedFetch(q,9000,'reload').then(async r=>{if(r.ok){const v=await decorate(r);await save('./index.html',v);await save('./',v);await save(q,v)}}).catch(()=>{}));
    return cached;
   }
   try{const r=await timedFetch(q,12000,'reload');if(r.ok){const v=await decorate(r);await save('./index.html',v);await save('./',v);await save(q,v);return v}return r}
   catch(_){return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0a1020;color:white;padding:24px"><h2>Bablo Hub</h2><p>This device has not cached Bablo Hub yet. Connect briefly, open the app once, then it will be available offline.</p><button onclick="location.reload()">Try again</button></body>',{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})}
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
self.addEventListener('message',e=>{if(!e.data||e.data.type!=='BABLO_PRECACHE')return;e.waitUntil((async()=>{const c=await caches.open(VERSION);let saved=0;for(const p of SHELL){try{const old=await c.match(p,{ignoreSearch:true});if(old){saved++;continue}const r=await timedFetch(p,12000);if(r.ok){await c.put(p,p==='./'||p==='./index.html'?await decorate(r):r);saved++}}catch(_){}}if(e.source)e.source.postMessage({type:'BABLO_PRECACHE_DONE',saved,total:SHELL.length})})())});
self.addEventListener('push',e=>{let d={title:'Bablo Hub',body:'',url:'./'};try{d=Object.assign(d,e.data.json())}catch(_){}e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const t=e.notification.data&&e.notification.data.url||'./';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(a=>{for(let i=0;i<a.length;i++)if('focus'in a[i])return a[i].focus();return clients.openWindow(t)}))});
