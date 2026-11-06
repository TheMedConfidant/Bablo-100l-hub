/* Bablo Hub: lightweight connectivity + deferred progress sync. */
(function(){
  'use strict';
  if (window.__BABLO_OFFLINE_RUNTIME__) return;
  window.__BABLO_OFFLINE_RUNTIME__ = true;
  var style=document.createElement('style');
  style.textContent='#bablo-network-status{position:fixed;z-index:9998;top:calc(env(safe-area-inset-top,0px) + 7px);left:50%;transform:translateX(-50%);max-width:min(94vw,520px);display:none;align-items:center;gap:9px;padding:9px 12px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:#111827;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.22);font:600 12px/1.3 system-ui,sans-serif}#bablo-network-status[data-state=offline]{background:#5b2430}#bablo-network-status[data-state=weak]{background:#55431c}#bablo-network-status button{pointer-events:auto;border:0;border-radius:999px;padding:6px 10px;background:#f0bd43;color:#171717;font:700 11px system-ui;white-space:nowrap}#bablo-network-status .bablo-net-copy{min-width:0}';
  document.head.appendChild(style);
  var bar=document.createElement('div');
  bar.id='bablo-network-status';bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
  var copy=document.createElement('span');copy.className='bablo-net-copy';
  var retry=document.createElement('button');retry.type='button';retry.textContent='Sync now';
  bar.append(copy,retry);document.body.appendChild(bar);
  var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  var hideTimer=0, syncing=false;
  function state(){
    if(!navigator.onLine)return 'offline';
    if(conn&&(conn.saveData||/^(slow-2g|2g)$/.test(conn.effectiveType||'')))return 'weak';
    return 'online';
  }
  function render(){
    var s=state();bar.dataset.state=s;
    if(s==='offline'){copy.textContent='You are offline. Saved study progress stays on this device.';retry.style.display='none';bar.style.display='flex';}
    else if(s==='weak'){copy.textContent='Weak connection detected. Bablo is using a lighter connection mode.';retry.style.display='';bar.style.display='flex';}
    else {copy.textContent='Connection restored.';retry.style.display='none';bar.style.display='flex';clearTimeout(hideTimer);hideTimer=setTimeout(function(){if(state()==='online')bar.style.display='none';},3200);}
  }
  async function sync(){
    if(!navigator.onLine||syncing)return;
    syncing=true;retry.disabled=true;retry.textContent='Syncing…';
    try{
      if(typeof window.pushProgress==='function')await window.pushProgress();
      if(typeof window.syncPastScores==='function')await window.syncPastScores();
      retry.textContent='Synced';
    }catch(e){retry.textContent='Try again';}
    finally{syncing=false;setTimeout(function(){retry.disabled=false;retry.textContent='Sync now';},1400);}
  }
  retry.addEventListener('click',sync);
  window.addEventListener('online',function(){render();setTimeout(sync,1200);});
  window.addEventListener('offline',render);
  if(conn&&conn.addEventListener)conn.addEventListener('change',render);
  window.addEventListener('focus',function(){if(navigator.onLine)sync();});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&navigator.onLine)sync();});
  render();
  window.BabloOffline={
    get status(){return state();},
    sync:sync,
    prepare:function(){
      return navigator.serviceWorker&&navigator.serviceWorker.ready.then(function(reg){
        var worker=reg.active||navigator.serviceWorker.controller;
        if(!worker)throw new Error('Offline engine is still starting.');
        worker.postMessage({type:'BABLO_PRECACHE'});
        return true;
      });
    }
  };
  if(navigator.onLine)setTimeout(sync,5000);
})();
