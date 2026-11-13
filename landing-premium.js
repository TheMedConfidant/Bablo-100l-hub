/* Bablo Hub adaptive public landing + account entry. */
(function(){
 if(window.__babloPremiumLandingInstalled)return;window.__babloPremiumLandingInstalled=true;
 const guestFlow=window.onboarding;
 function removeOverlay(){const old=document.querySelector('.overlay');if(old)old.remove();}
 function markLandingOption(option){try{if(typeof DB==='undefined')return;const used=Array.isArray(DB.landingOptionsUsed)?DB.landingOptionsUsed:[];if(!used.includes(option)){DB.landingOptionsUsed=used.concat(option);save();}}catch(_){}}
 function clearProgramme(root){if(!root)return;root.querySelectorAll('label.field').forEach(label=>{const title=label.querySelector('span');if(title&&title.textContent.trim().toLowerCase()==='programme'){const input=label.querySelector('input');if(input)input.value='';}});}
 function openAuth(mode){
  markLandingOption(mode==='login'?'login':'signup');
  try{ACCOUNT_MODE=mode==='login'?'login':'signup';}catch(_){}
  removeOverlay();const section=accountSection();if(ACCOUNT_MODE==='signup')clearProgramme(section);
  const tabs=section.querySelectorAll('.seg .opt');if(tabs[0])tabs[0].onclick=()=>openAuth('signup');if(tabs[1])tabs[1].onclick=()=>openAuth('login');
  const back=document.createElement('button');back.type='button';back.className='landing-back';back.textContent='← Back to welcome';back.onclick=()=>{removeOverlay();showLanding();};section.appendChild(back);modal(section,false);
 }
 function openGuest(){
  markLandingOption('guest');
  removeOverlay();if(typeof guestFlow==='function')guestFlow();
  setTimeout(()=>{const panel=document.querySelector('.overlay .modal');if(!panel)return;clearProgramme(panel);if(!panel.querySelector('.landing-back')){const back=document.createElement('button');back.type='button';back.className='landing-back';back.textContent='← Back to welcome';back.onclick=()=>{removeOverlay();showLanding();};panel.appendChild(back);}},0);
 }
 function showLanding(){
  const root=h('section',{class:'landing-shell stack'},
   h('header',{class:'landing-brand'},h('div',{class:'landing-mark','aria-hidden':'true'},'B'),h('div',{class:'landing-wordmark'},h('strong',null,'Bablo Hub'),h('span',null,'YOUR ACADEMIC WORKSPACE'))),
   h('div',{class:'landing-copy stack'},
    h('span',{class:'landing-eyebrow'},'BUILT AROUND YOUR JOURNEY'),
    h('h1',null,'Your discipline. Your level. Your next move.'),
    h('p',null,'A connected academic workspace that adapts to what you study and where you are in your programme — from structured learning to advanced practice.'),
    h('div',{class:'landing-proof-grid'},
     h('article',{class:'landing-proof'},h('span',{class:'landing-proof-icon','aria-hidden':'true'},'01'),h('strong',null,'Study with structure'),h('p',null,'Course materials organised around your programme and current level.')),
     h('article',{class:'landing-proof'},h('span',{class:'landing-proof-icon','aria-hidden':'true'},'02'),h('strong',null,'Practise with purpose'),h('p',null,'Questions, revision tools and assessment experiences that fit your learning stage.')),
     h('article',{class:'landing-proof'},h('span',{class:'landing-proof-icon','aria-hidden':'true'},'03'),h('strong',null,'Grow into your field'),h('p',null,'Your workspace evolves as your academic work becomes more specialised.')))),
   h('div',{class:'landing-adaptive-note'},h('span',{class:'landing-adaptive-dot','aria-hidden':'true'}),h('p',null,'No one-size-fits-all dashboard. Your selected programme and level shape the experience you enter.')),
   h('div',{class:'landing-actions stack'},h('button',{class:'btn landing-primary block',onclick:()=>openAuth('signup')},'Create your account','  →'),h('button',{class:'btn landing-secondary block',onclick:()=>openAuth('login')},'Log in'),h('button',{class:'landing-guest',onclick:openGuest},'Explore as a guest')),
   h('p',{class:'landing-footnote'},'Sign in to keep your academic progress connected across devices. Guest access is available on this device.'));
  modal(root,false);
 }
 window.openLandingAuth=openAuth;window.onboarding=showLanding;
 document.addEventListener('DOMContentLoaded',function(){
  try{if(typeof DB!=='undefined'){if(!DB.skin||DB.skin==='glass'||DB.skin==='green'){DB.skin='charcoal';save();}applyTheme();}}catch(e){console.warn('Bablo theme setup:',e);}
  try{if(typeof DB!=='undefined'&&!DB.profile){removeOverlay();showLanding();}}catch(e){console.warn('Bablo landing setup:',e);}
 },{once:true});
})();