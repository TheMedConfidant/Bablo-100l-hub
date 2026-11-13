/* Bablo Hub offline support + startup error reporting. */
const VERSION='bablo-offline-v40-semester-course-gate';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./landing-premium.js','./landing-premium.css','./academic-engine.js','./offline-course-manager.js','./university-directory.js'];
const OPTIONAL_OFFLINE=['./mls101-data.js','./SOC101-data.js','./phy101-data.js','./mts-maths-topics.js','./mts-maths-induction-extra.js','./thermochemistry-data.js','./gst111-curated-pack.js','./gst111-native-bank.js','./gst111-native-resources.js','./gst111-source-bank.js','./challenge-arena.js','./wifi-challenge.js','./cos-101-plus-bank.js','./cos101plus-extracted.js','./chm-practicals-native.js','./agr-101-food-security.html','./gst103-study-hub.html','./practicals/','./practicals/index.html','./practicals/chm107-practicals.html','./practicals/phy107-practical.html'];
function timedFetch(req,ms,cacheMode){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(req,{signal:c.signal,cache:cacheMode||'default'}).finally(()=>clearTimeout(t));}
function vendorURL(u){const prefix='/calculator/vendor/';if(!u.pathname.includes(prefix))return null;const rel=u.pathname.split(prefix).pop();if(rel==='mathjs.js')return 'https://cdn.jsdelivr.net/npm/mathjs@14.8.1/lib/browser/math.js';if(rel==='mathlive.min.js'||rel==='mathlive-static.css'||rel==='mathlive-fonts.css'||rel.startsWith('fonts/')||rel.startsWith('sounds/'))return 'https://unpkg.com/mathlive@0.104.2/dist/'+rel;return null;}
async function matchAny(req){const c=await caches.open(VERSION);return await c.match(req,{ignoreSearch:true})||await caches.match(req,{ignoreSearch:true});}
async function save(req,res){
 if(!res||!res.ok||res.type==='opaque')return;
 // Keep explicitly downloaded course files inside their removable course cache.
 // Do not silently duplicate them into the general runtime cache.
 try{const names=await caches.keys();for(const name of names){if(name.startsWith('bablo-course-pack-v1-')){const pack=await caches.open(name);if(await pack.match(req,{ignoreSearch:true}))return;}}}catch(_){}
 try{const c=await caches.open(VERSION);await c.put(req,res.clone());}
 catch(e){
  try{
   const c=await caches.open(VERSION),keys=await c.keys(),protectedUrls=new Set(SHELL.map(p=>new URL(p,self.location.href).href));
   for(const k of keys){if(!protectedUrls.has(k.url)){await c.delete(k);try{await c.put(req,res.clone());return}catch(_){} }}
  }catch(_){}
 }
}
async function decorate(res){
 if(!res||!res.ok||!(res.headers.get('content-type')||'').includes('text/html'))return res;
 try{let html=await res.text();if(!html.includes('landing-premium.css'))html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="./landing-premium.css"></head>');const broken="    ...P.writtenQuestions.map((q, i) => h('article', { class: 'panel stack' }, h('h3', null, (i + 1) + '. ' + q.question), h('span', { class: 'chip' }, q.kind), h('details', null, h('summary', null, 'Show source answer'), h('p', { class: 'note-paragraph' }, q.answer))))))));";if(html.includes(broken))html=html.replace(broken,"    ...P.writtenQuestions.map((q, i) => h('article', { class: 'panel stack' }, h('h3', null, (i + 1) + '. ' + q.question), h('span', { class: 'chip' }, q.kind), h('details', null, h('summary', null, 'Show source answer'), h('p', { class: 'note-paragraph' }, q.answer)))))));");if(!html.includes('id="app"')||html.includes('bablo-startup-guard'))return new Response(html,{status:res.status,headers:res.headers});
 const guard=`<script id="bablo-storage-manager">(function(){
function add(){
 if((location.hash||'').indexOf('#/settings')!==0&&(location.hash||'').indexOf('#settings')!==0)return;
 var root=document.getElementById('app');if(!root||root.querySelector('[data-bablo-storage-card]'))return;
 var card=document.createElement('section');card.className='panel stack';card.setAttribute('data-bablo-storage-card','1');
 var title=document.createElement('h2');title.textContent='Phone storage';
 var copy=document.createElement('p');copy.className='small muted';copy.textContent='Clear Bablo Hub’s temporary offline files if your phone is low on space. Your account, quiz history, notes progress and saved study records are not deleted.';
 var usage=document.createElement('p');usage.className='tiny muted';usage.textContent='Checking Bablo cache size…';
 var button=document.createElement('button');button.className='btn ghost block';button.textContent='Clear Bablo offline cache';
 button.onclick=async function(){
  if(!confirm('Clear only Bablo Hub offline cache files? Your account and study progress will be kept. Some content will need internet to load again.'))return;
  button.disabled=true;button.textContent='Clearing…';
  try{var names=await caches.keys();await Promise.all(names.filter(function(n){return n.indexOf('bablo-offline-')===0||n.indexOf('bablo-shell-')===0||n.indexOf('bablo-course-pack-v1-')===0||n.indexOf('bablo-course-pack-stage-')===0||n==='bablo-course-pack-meta-v1';}).map(function(n){return caches.delete(n);}));
   usage.textContent='Bablo offline cache cleared. Your study data was kept.';button.textContent='Cache cleared';setTimeout(function(){location.reload()},900);
  }catch(e){usage.textContent='Could not clear the offline cache in this browser. Use Android app/browser storage settings.';button.disabled=false;button.textContent='Try again';}
 };
 card.append(title,copy,usage,button);root.appendChild(card);
 if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(x){var mb=(Number(x.usage)||0)/1048576;usage.textContent='Browser storage used by this site: '+mb.toFixed(1)+' MB (estimate).';}).catch(function(){usage.textContent='Storage estimate is unavailable on this browser.';});
}
window.addEventListener('hashchange',add);new MutationObserver(add).observe(document.documentElement,{childList:true,subtree:true});add();
})();</script><script id="bablo-startup-guard">(function(){function show(t,d){if(document.getElementById('bablo-startup-error'))return;var x=document.createElement('div');x.id='bablo-startup-error';x.style.cssText='position:fixed;z-index:2147483647;inset:0;background:#0a1020;color:white;padding:26px 20px;font:16px/1.5 system-ui;overflow:auto';var h=document.createElement('h2');h.textContent=t;x.appendChild(h);var p=document.createElement('p');p.textContent=d;x.appendChild(p);var b=document.createElement('button');b.textContent='Try again';b.style.cssText='padding:12px 18px;border:0;border-radius:10px;background:#f0bd43;color:#111;font-weight:bold';b.onclick=function(){location.reload()};x.appendChild(b);document.body.appendChild(x)}window.addEventListener('error',function(e){show('Bablo Hub startup error',String(e.message||'Script error')+(e.filename?' • '+e.filename.split('/').pop():'')+(e.lineno?':'+e.lineno:''))});window.addEventListener('unhandledrejection',function(e){show('Bablo Hub startup error',String(e.reason&&e.reason.message||e.reason||'Promise failed'))});setTimeout(function(){var a=document.getElementById('app');if(a&&!a.children.length)show('Bablo Hub did not finish loading','The app failed to render. Tap Try again; if it repeats, send us this screen.')},25000)})();</script><script src="./academic-engine.js" defer></script><script src="./university-directory.js" defer></script><script src="./landing-premium.js" defer></script><script src="./offline-course-manager.js" defer></script>`;
 html=html.replace(/<body([^>]*)>/i,m=>m+guard);const h=new Headers(res.headers);h.delete('content-length');return new Response(html,{status:res.status,statusText:res.statusText,headers:h});
 }catch(e){return res}
}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(VERSION);await Promise.all(SHELL.map(async p=>{try{const r=await timedFetch(p, p==='./'||p==='./index.html'?10000:5000);if(r.ok){const v=(p==='./'||p==='index.html'||p==='./index.html')?await decorate(r):r;await c.put(p,v)}}catch(_){}}));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>(k.startsWith('bablo-shell-')||k.startsWith('bablo-offline-'))&&k!==VERSION).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);if(q.method!=='GET'||u.origin!==self.location.origin)return;const vendor=vendorURL(u);if(vendor){e.respondWith((async()=>{const cached=await matchAny(q);if(cached)return cached;try{const r=await timedFetch(vendor,15000);if(r.ok)await save(q,r);return r}catch(_){return new Response('Calculator libraries have not been cached yet. Connect once and reload the calculator.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})());return}const mathsAsset=/\/(?:mts-maths-topics|mts-maths-induction-extra)\.js$/.test(u.pathname);if(mathsAsset){e.respondWith((async()=>{try{const fresh=await timedFetch(q,15000,'reload');if(fresh.ok){await save(q,fresh);return fresh}const cached=await matchAny(q);if(cached)return cached;return fresh}catch(_){const cached=await matchAny(q);return cached||new Response('Maths content is temporarily unavailable. Reconnect and reload.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})());return}const nav=q.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/';if(nav){e.respondWith((async()=>{const cached=await matchAny(q)||await matchAny('./index.html')||await matchAny('./');if(cached){e.waitUntil((async()=>{try{const fresh=await timedFetch(q,10000,'reload');if(fresh.ok){const v=await decorate(fresh);await save('./index.html',v);await save('./',v);await save(q,v)}}catch(_){}})());return decorate(cached)}try{const fresh=await timedFetch(q,12000,'reload');if(fresh.ok){const v=await decorate(fresh);await save('./index.html',v);await save('./',v);await save(q,v);return v}return fresh}catch(_){return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0a1020;color:white;padding:24px"><h2>Bablo Hub</h2><p>This device has not cached the app yet. Connect briefly, then reopen Bablo Hub to enable offline startup.</p><button onclick="location.reload()">Try again</button></body>',{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})}})());return}e.respondWith((async()=>{const old=await matchAny(q);if(old){e.waitUntil(timedFetch(q,6000).then(r=>save(q,r)).catch(()=>{}));return old}try{const r=await timedFetch(q,10000);if(r.ok)await save(q,r);return r}catch(_){return new Response('This resource has not been cached yet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})())});

// Selective course packs use immutable versioned caches plus a single active
// manifest pointer. The pointer is switched only after the new cache is complete.
const COURSE_PREFIX='bablo-course-pack-v1-';
const COURSE_META='bablo-course-pack-meta-v1';
function courseMetaRequest(id){return new Request(new URL('/__bablo_course_pack_meta__/'+id,self.location.href).href)}
async function activeCourseCache(id){const meta=await caches.open(COURSE_META),response=await meta.match(courseMetaRequest(id));if(!response)return null;try{return (await response.json()).cacheName||null}catch(_){return null}}
self.addEventListener('message',event=>{
 const msg=event.data||{},port=event.ports&&event.ports[0];
 if(!port||!['BABLO_CACHE_COURSE','BABLO_REMOVE_COURSE','BABLO_LIST_COURSES'].includes(msg.type))return;
 const reply=data=>{try{port.postMessage(data)}catch(_){}};
 event.waitUntil((async()=>{
  let newCacheName=null;
  try{
   if(msg.type==='BABLO_LIST_COURSES'){
    const meta=await caches.open(COURSE_META),keys=await meta.keys(),courses=[];
    for(const key of keys){const response=await meta.match(key);try{const data=await response.json();if(data.courseId&&data.cacheName&&await caches.has(data.cacheName))courses.push(data.courseId)}catch(_){}}
    // Include legacy single-cache packs until they are next refreshed or removed.
    for(const name of await caches.keys()){if(name.startsWith(COURSE_PREFIX)&&!name.slice(COURSE_PREFIX.length).includes('--')){const id=name.slice(COURSE_PREFIX.length);if(!courses.includes(id))courses.push(id)}}
    reply({ok:true,courses});return;
   }
   const id=String(msg.courseId||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-|-$/g,'').slice(0,64);
   if(!id)throw new Error('A valid course ID is required');
   const stageName='bablo-course-pack-stage-'+id,meta=await caches.open(COURSE_META),metaKey=courseMetaRequest(id);
   if(msg.type==='BABLO_REMOVE_COURSE'){
    const names=(await caches.keys()).filter(n=>n===COURSE_PREFIX+id||n.startsWith(COURSE_PREFIX+id+'--'));
    const removedKeys=[];
    for(const name of names){const cache=await caches.open(name);removedKeys.push(...await cache.keys());await caches.delete(name)}
    await caches.delete(stageName);await meta.delete(metaKey);
    const runtime=await caches.open(VERSION),protectedUrls=new Set(SHELL.map(p=>new URL(p,self.location.href).href));
    const otherNames=(await caches.keys()).filter(n=>n.startsWith(COURSE_PREFIX));
    for(const request of removedKeys){
     if(protectedUrls.has(request.url))continue;
     let retained=false;
     for(const name of otherNames){const pack=await caches.open(name);if(await pack.match(request,{ignoreSearch:true})){retained=true;break}}
     if(!retained)await runtime.delete(request,{ignoreSearch:true});
    }
    reply({ok:true,courseId:id,removed:true});return;
   }
   const paths=Array.isArray(msg.resources)?msg.resources:[];
   if(!paths.length)throw new Error('No course resources were supplied');
   if(paths.length>250)throw new Error('A course pack cannot contain more than 250 files');
   const unique=[...new Set(paths.map(p=>String(p||'')))],urls=unique.map(p=>new URL(p,self.location.href));
   if(urls.some(u=>u.origin!==self.location.origin||!/^https?:$/.test(u.protocol)))throw new Error('Course packs can only include files hosted by Bablo Hub');
   if(navigator.storage&&navigator.storage.estimate){try{const estimate=await navigator.storage.estimate();if(estimate.quota&&estimate.usage/estimate.quota>0.9)throw new Error('Phone storage is nearly full. Free some space before downloading this course.')}catch(error){if(error&&/nearly full/.test(error.message||''))throw error}}
   await caches.delete(stageName);const staging=await caches.open(stageName);let completed=0,failed=[];
   for(const url of urls){
    try{const request=new Request(url.href,{method:'GET',credentials:'same-origin'}),response=await timedFetch(request,20000,'reload');if(!response.ok||response.type==='opaque')throw new Error('HTTP '+response.status);const length=Number(response.headers.get('content-length')||0);if(length>25*1024*1024)throw new Error('File exceeds 25 MB safety limit');await staging.put(request,response.clone())}
    catch(error){failed.push({url:url.pathname,error:String(error&&error.message||error)})}
    completed++;reply({progress:true,courseId:id,completed,total:urls.length,failed:failed.length});
   }
   if(failed.length){await caches.delete(stageName);reply({ok:false,courseId:id,completed,total:urls.length,failed,message:'Some files could not be saved. Your previous offline pack was kept; retry when connected.'});return}
   // Build a brand-new immutable cache. The currently active manifest remains
   // untouched until every staged response has been copied successfully.
   newCacheName=COURSE_PREFIX+id+'--'+Date.now();const next=await caches.open(newCacheName);
   for(const request of await staging.keys()){const response=await staging.match(request);if(!response)throw new Error('A staged course file could not be read');await next.put(request,response)}
   if((await next.keys()).length!==urls.length)throw new Error('The new course pack did not pass its file-count check');
   const previous=await activeCourseCache(id);
   await meta.put(metaKey,new Response(JSON.stringify({courseId:id,cacheName:newCacheName,updatedAt:Date.now(),files:urls.length}),{headers:{'Content-Type':'application/json'}}));
   await caches.delete(stageName);
   if(previous&&previous!==newCacheName)await caches.delete(previous);
   // Remove any obsolete legacy cache for this course after the pointer commit.
   await caches.delete(COURSE_PREFIX+id);
   reply({ok:true,courseId:id,completed,total:urls.length,failed:0});
  }catch(error){
   if(newCacheName){const active=await activeCourseCache(String(msg.courseId||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-|-$/g,'').slice(0,64)).catch(()=>null);if(active!==newCacheName)await caches.delete(newCacheName).catch(()=>{})}
   await caches.delete('bablo-course-pack-stage-'+String(msg.courseId||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-|-$/g,'').slice(0,64)).catch(()=>{});
   reply({ok:false,message:String(error&&error.message||error)+' Your previous offline pack was kept.'});
  }
 })());
});
self.addEventListener('push',e=>{let d={title:'Bablo Hub',body:'',url:'./'};try{d=Object.assign(d,e.data.json())}catch(_){}e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const t=e.notification.data&&e.notification.data.url||'./';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(a=>{for(let i=0;i<a.length;i++)if('focus'in a[i])return a[i].focus();return clients.openWindow(t)}))});
