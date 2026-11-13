/* Bablo Hub premium public landing + account entry. */
(function(){
 if(window.__babloPremiumLandingInstalled)return;window.__babloPremiumLandingInstalled=true;
 const guestFlow=window.onboarding;
 function removeOverlay(){const old=document.querySelector('.overlay');if(old)old.remove();}
 function clearProgramme(root){if(!root)return;root.querySelectorAll('label.field').forEach(label=>{const title=label.querySelector('span');if(title&&title.textContent.trim().toLowerCase()==='programme'){const input=label.querySelector('input');if(input)input.value='';}});}
 function openAuth(mode){
  try{ACCOUNT_MODE=mode==='login'?'login':'signup';}catch(_){}
  removeOverlay();const section=accountSection();if(ACCOUNT_MODE==='signup')clearProgramme(section);
  const tabs=section.querySelectorAll('.seg .opt');if(tabs[0])tabs[0].onclick=()=>openAuth('signup');if(tabs[1])tabs[1].onclick=()=>openAuth('login');
  const back=document.createElement('button');back.type='button';back.className='landing-back';back.textContent='← Back to welcome';back.onclick=()=>{removeOverlay();showLanding();};section.appendChild(back);modal(section,false);
 }
 function openGuest(){
  removeOverlay();if(typeof guestFlow==='function')guestFlow();
  setTimeout(()=>{const panel=document.querySelector('.overlay .modal');if(!panel)return;clearProgramme(panel);if(!panel.querySelector('.landing-back')){const back=document.createElement('button');back.type='button';back.className='landing-back';back.textContent='← Back to welcome';back.onclick=()=>{removeOverlay();showLanding();};panel.appendChild(back);}},0);
 }
 function showLanding(){
  const root=h('section',{class:'landing-shell stack'},
   h('div',{class:'landing-brand'},h('img',{class:'landing-mark',src:'./icon-192.png',alt:'',width:'48',height:'48','aria-hidden':'true'}),h('div',{class:'landing-wordmark'},h('strong',null,'Bablo Hub'),h('span',null,'™  •  STUDY. PRACTISE. GROW.'))),
   h('div',{class:'landing-copy stack'},h('span',{class:'landing-eyebrow'},'YOUR ACADEMIC WORKSPACE'),h('h1',null,'Confidence in clarity.'),h('p',null,'A focused learning environment for structured notes, active recall, CBT practice and practical learning—built for Bowen University College of Health Sciences (CoHES) students.'),h('div',{class:'landing-pill-row'},h('span',null,'COURSE LIBRARY'),h('span',null,'NOTES & FLASHCARDS'),h('span',null,'CBT PRACTICE'),h('span',null,'PRACTICALS'),h('span',null,'CHALLENGE ARENA'))),
   h('div',{class:'landing-actions stack'},h('button',{class:'btn landing-primary block',onclick:()=>openAuth('signup')},'Create your account'),h('button',{class:'btn landing-secondary block',onclick:()=>openAuth('login')},'Log in'),h('button',{class:'landing-guest',onclick:openGuest},'Explore as a guest  →')),
   h('p',{class:'landing-footnote'},'Built for Bowen University College of Health Sciences (CoHES). Course resources are organised around CoHES programmes and levels. Your progress syncs across devices when you sign in.')) ;
  modal(root,false);
 }
 window.openLandingAuth=openAuth;window.onboarding=showLanding;
 document.addEventListener('DOMContentLoaded',function(){
  try{if(typeof DB!=='undefined'){if(!DB.skin||DB.skin==='glass'||DB.skin==='green'){DB.skin='charcoal';save();}applyTheme();}}catch(e){console.warn('Bablo theme setup:',e);}
  try{if(typeof DB!=='undefined'&&!DB.profile){removeOverlay();showLanding();}}catch(e){console.warn('Bablo landing setup:',e);}
 },{once:true});
})();