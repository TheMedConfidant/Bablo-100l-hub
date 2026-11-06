/* Bablo Hub offline runtime: device-wide connection awareness and local-first storage. */
(function(){
 'use strict';
 const DB='bablo-hub-offline-v1',STORE='records',QUEUE='pending-actions';
 let dbPromise;
 function db(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('Local storage unavailable'));return}const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'key'});if(!d.objectStoreNames.contains(QUEUE))d.createObjectStore(QUEUE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
 function tx(store,mode,work){return db().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let result;try{result=work(s)}catch(e){reject(e);return}t.oncomplete=()=>resolve(result&&result.result!==undefined?result.result:result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('Storage transaction aborted'))}))}
 const api={
  async saveLocal(key,value){await tx(STORE,'readwrite',s=>s.put({key:String(key),value,updatedAt:Date.now()}));return true},
  async getLocal(key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE).objectStore(STORE).get(String(key));r.onsuccess=()=>resolve(r.result?r.result.value:null);r.onerror=()=>reject(r.error)})},
  async queueAction(action){if(!action||!action.url)throw new Error('A same-origin URL is required');const url=new URL(action.url,location.href);if(url.origin!==location.origin)throw new Error('Only same-origin sync actions are supported');const item={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random(),url:url.pathname+url.search,method:action.method||'POST',body:action.body??null,createdAt:Date.now(),attempts:0};await tx(QUEUE,'readwrite',s=>s.put(item));window.dispatchEvent(new CustomEvent('bablo:sync-ready'));return item.id},
  async pendingActions(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(QUEUE).objectStore(QUEUE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})},
  async flushQueue(){if(!navigator.onLine)return {sent:0,pending:(await this.pendingActions()).length};const items=await this.pendingActions();let sent=0;for(const item of items){try{const response=await fetch(item.url,{method:item.method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Bablo-Offline-Id':item.id},body:item.body==null?undefined:JSON.stringify(item.body)});if(!response.ok)break;await tx(QUEUE,'readwrite',s=>s.delete(item.id));sent++}catch(_){break}}return {sent,pending:(await this.pendingActions()).length}},
  async storage(){if(!navigator.storage||!navigator.storage.estimate)return null;return navigator.storage.estimate()},
  precache(){return new Promise(resolve=>{if(!navigator.serviceWorker||!navigator.serviceWorker.controller){resolve(false);return}const ch=new MessageChannel();const timer=setTimeout(()=>resolve(false),15000);ch.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)};navigator.serviceWorker.controller.postMessage({type:'BABLO_PRECACHE'},[ch.port2])}
 };
 window.BabloOffline=api;
 const badge=document.createElement('div');badge.id='bablo-network-state';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.style.cssText='position:fixed;z-index:9997;top:calc(env(safe-area-inset-top,0px) + 8px);right:10px;padding:6px 10px;border-radius:999px;background:#17243b;color:#fff;border:1px solid rgba(240,189,67,.55);font:600 11px/1.2 system-ui;letter-spacing:.2px;box-shadow:0 3px 12px #0003;pointer-events:none;opacity:0;transition:opacity .2s';
 function connection(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;const weak=!!(c&&((c.effectiveType&&/2g|slow-2g/.test(c.effectiveType))||(c.rtt&&c.rtt>1800)||(c.downlink&&c.downlink<0.35)));if(!navigator.onLine){badge.textContent='Offline · saved content';badge.style.opacity='1'}else if(weak){badge.textContent='Weak network · data saved locally';badge.style.opacity='1'}else{badge.style.opacity='0'}window.dispatchEvent(new CustomEvent('bablo:connection',{detail:{online:navigator.onLine,weak}}))}
 window.addEventListener('online',()=>{connection();api.flushQueue().then(r=>{window.dispatchEvent(new CustomEvent('bablo:sync-complete',{detail:r}))}).catch(()=>{})});
 window.addEventListener('offline',connection);
 const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(conn&&conn.addEventListener)conn.addEventListener('change',connection);
 window.addEventListener('bablo:sync-ready',()=>{if(navigator.onLine)api.flushQueue().then(r=>window.dispatchEvent(new CustomEvent('bablo:sync-complete',{detail:r}))).catch(()=>{})});
 function mount(){if(!document.getElementById(badge.id)&&document.body)document.body.appendChild(badge);connection()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 if('serviceWorker'in navigator)navigator.serviceWorker.ready.then(()=>{if(navigator.onLine)api.precache()}).catch(()=>{});
})();
