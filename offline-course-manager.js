/* Bablo Hub selective offline course-pack manager.
 * Course pages call BabloOffline.attachCourseButton({container, courseId, resources}).
 */
(function(root){
 'use strict';
 const PREFIX='bablo-course-pack-v1-';
 const safeId=v=>String(v||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-|-$/g,'').slice(0,64);
 function worker(){
  if(!('serviceWorker' in navigator))throw new Error('Offline downloads are not supported by this browser.');
  if(!navigator.serviceWorker.controller)throw new Error('Connect once and reopen Bablo Hub to activate offline downloads.');
  return navigator.serviceWorker.controller;
 }
 function send(type,payload,onProgress){
  return new Promise((resolve,reject)=>{
   let controller;try{controller=worker()}catch(e){reject(e);return}
   const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(new Error('Offline download timed out. Check your connection and retry.'))},10*60*1000);
   channel.port1.onmessage=e=>{
    const data=e.data||{};
    if(data.progress){if(onProgress)onProgress(data);return}
    clearTimeout(timer);channel.port1.close();
    if(data.ok)resolve(data);else reject(Object.assign(new Error(data.message||'Offline operation failed'),{details:data}));
   };
   controller.postMessage(Object.assign({type},payload),[channel.port2]);
  });
 }
 async function saveCourse(options){
  const id=safeId(options&&options.courseId),resources=options&&options.resources;
  if(!id)throw new Error('Course ID is required.');
  if(!Array.isArray(resources)||!resources.length)throw new Error('Add the course notes, question banks, flashcards and practical files to its offline resource list.');
  return send('BABLO_CACHE_COURSE',{courseId:id,resources},options.onProgress);
 }
 async function removeCourse(courseId){const id=safeId(courseId);if(!id)throw new Error('Course ID is required.');return send('BABLO_REMOVE_COURSE',{courseId:id})}
 async function listCourses(){const result=await send('BABLO_LIST_COURSES',{});return result.courses||[]}
 function attachCourseButton(options){
  const host=options&&options.container,id=safeId(options&&options.courseId);
  if(!host||!id||!Array.isArray(options.resources))throw new Error('Container, course ID and resource list are required.');
  if(host.querySelector('[data-bablo-offline-course]'))return host.querySelector('[data-bablo-offline-course]');
  const wrap=document.createElement('section');wrap.className='panel stack';wrap.dataset.babloOfflineCourse='1';
  const title=document.createElement('h3');title.textContent='Study offline';
  const status=document.createElement('p');status.className='small muted';status.textContent='Save this course’s learning materials to this phone. Downloads use Wi-Fi or mobile data.';
  const progress=document.createElement('progress');progress.max=100;progress.value=0;progress.hidden=true;
  const button=document.createElement('button');button.className='btn ghost block';button.type='button';button.textContent='Save course offline';
  const remove=document.createElement('button');remove.className='btn ghost block';remove.type='button';remove.textContent='Remove offline course';remove.hidden=true;
  button.onclick=async()=>{
   button.disabled=true;progress.hidden=false;progress.value=0;status.textContent='Preparing course download…';
   try{
    const result=await saveCourse({courseId:id,resources:options.resources,onProgress:p=>{progress.value=Math.round(p.completed/p.total*100);status.textContent='Saving '+p.completed+' of '+p.total+' files…'}});
    progress.value=100;status.textContent=result.completed+' files saved. This course is ready for offline study.';button.textContent='Course saved offline';remove.hidden=false;
   }catch(e){status.textContent=e.message;button.disabled=false;button.textContent='Retry course download'}
  };
  remove.onclick=async()=>{
   remove.disabled=true;try{await removeCourse(id);status.textContent='Offline course removed. Your account and study progress are unchanged.';button.disabled=false;button.textContent='Save course offline';progress.hidden=true;remove.hidden=true;}catch(e){status.textContent=e.message;remove.disabled=false}
  };
  wrap.append(title,status,progress,button,remove);host.appendChild(wrap);return wrap;
 }
 root.BabloOffline=Object.freeze({saveCourse,removeCourse,listCourses,attachCourseButton});
})(typeof window!=='undefined'?window:globalThis);
