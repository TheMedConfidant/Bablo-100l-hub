/* Bablo Hub public landing and account entry. */
(function(){
 if(window.__babloPremiumLandingInstalled)return;
 window.__babloPremiumLandingInstalled=true;
 const guestFlow=window.onboarding;
 function removeOverlay(){const old=document.querySelector('.overlay');if(old)old.remove();}
 function markLandingOption(option){
  try{
   if(typeof DB==='undefined')return;
   const used=Array.isArray(DB.landingOptionsUsed)?DB.landingOptionsUsed:[];
   if(!used.includes(option)){DB.landingOptionsUsed=used.concat(option);save();}
  }catch(_){}
 }
 function openAuth(mode){
  markLandingOption(mode==='login'?'login':'signup');
  try{ACCOUNT_MODE=mode==='login'?'login':'signup';}catch(_){}
  removeOverlay();
  const section=accountSection();
  const back=document.createElement('button');
  back.type='button';back.className='landing-back';back.textContent='← Back to Bablo Hub';
  back.onclick=()=>{removeOverlay();showLanding();};
  section.appendChild(back);
  modal(section,false);
 }
 function openGuest(){
  markLandingOption('guest');
  removeOverlay();
  if(typeof guestFlow==='function')guestFlow();
 }
 function showLanding(){
  const topbar=h('header',{class:'landing-topbar'},
   h('a',{class:'landing-brand',href:'#/'},h('span',{class:'landing-mark'},'B'),h('span',{class:'landing-brand-copy'},h('strong',null,'Bablo Hub'),h('small',null,'THEMEDCONFIDANT'))),
   h('nav',{class:'landing-nav','aria-label':'Landing page'},h('a',{href:'#landing-system'},'How it works'),h('a',{href:'#landing-cohes'},'For Bowen CoHES'),h('a',{href:'#landing-tools'},'Study tools')),
   h('div',{class:'landing-top-actions'},h('button',{class:'landing-login',onclick:()=>openAuth('login')},'Log in'),h('button',{class:'landing-top-cta',onclick:()=>openAuth('signup')},'Get started →')));
  const preview=h('div',{class:'landing-preview'},
   h('div',{class:'landing-preview-head'},h('div',{class:'landing-preview-brand'},h('span',{class:'landing-preview-dot'},''),h('b',null,'Your study workspace')),h('span',{class:'landing-preview-level'},'100 LEVEL')),
   h('div',{class:'landing-preview-welcome'},h('span',null,'ACADEMIC DASHBOARD'),h('strong',null,'Built around your courses.'),h('small',null,'Bowen University · CoHES')),
   h('div',{class:'landing-preview-grid'},
    h('div',{class:'landing-preview-course'},h('span',null,'BIO'),h('b',null,'Biology'),h('small',null,'Notes · QBank')),
    h('div',{class:'landing-preview-course'},h('span',null,'CHM'),h('b',null,'Chemistry'),h('small',null,'Topics · Practice')),
    h('div',{class:'landing-preview-course'},h('span',null,'PHY'),h('b',null,'Physics'),h('small',null,'Concepts · Problems')),
    h('div',{class:'landing-preview-course'},h('span',null,'COS'),h('b',null,'Computing'),h('small',null,'Lessons · Questions'))),
   h('div',{class:'landing-preview-offline'},h('span',{class:'landing-live-dot'},''),h('span',null,'Offline course packs'),h('b',null,'Ready to save')));
  const hero=h('section',{class:'landing-hero'},
   h('div',{class:'landing-hero-copy'},
    h('span',{class:'landing-eyebrow'},'A MORE CONNECTED WAY TO STUDY'),
    h('h1',null,'Your courses should power your entire academic experience.'),
    h('p',null,'Bablo Hub brings course learning, revision, practical work and academic competition into one organised workspace — shaped by your university, programme, level and semester.'),
    h('div',{class:'landing-hero-actions'},h('button',{class:'landing-primary',onclick:()=>openAuth('signup')},'Create your account',h('span',null,'→')),h('button',{class:'landing-quiet',onclick:openGuest},'Explore as a guest')),
    h('div',{class:'landing-trust-line'},h('span',null,'CURRICULUM-LED'),h('i',null,'·'),h('span',null,'RESOURCE-DRIVEN'),h('i',null,'·'),h('span',null,'OFFLINE-READY'))),
   preview);
  const system=h('section',{class:'landing-system-section',id:'landing-system'},
   h('div',{class:'landing-section-heading'},h('span',{class:'landing-eyebrow'},'ONE ACADEMIC SOURCE OF TRUTH'),h('h2',null,'One course. Every way to learn.'),h('p',null,'Your verified course resources should not stop at the course page. They should connect the entire platform.')),
   h('div',{class:'landing-system-flow'},
    h('article',{class:'landing-system-source'},h('span',null,'01 · THE FOUNDATION'),h('strong',null,'Course resources'),h('p',null,'Notes, source documents, questions, flashcards and practical materials — organised by topic.')),
    h('div',{class:'landing-flow-arrow'},'→'),
    h('div',{class:'landing-system-output-grid'},
     h('article',null,h('b',null,'Learn'),h('small',null,'Notes & explanations')),
     h('article',null,h('b',null,'Recall'),h('small',null,'Flashcards & review')),
     h('article',null,h('b',null,'Practise'),h('small',null,'QBank & CBT')),
     h('article',null,h('b',null,'Apply'),h('small',null,'Practicals & labs')),
     h('article',null,h('b',null,'Compete'),h('small',null,'Challenges & Cup')),
     h('article',null,h('b',null,'Improve'),h('small',null,'Progress & analytics')))));
  const tools=h('section',{class:'landing-tools-section',id:'landing-tools'},
   h('div',{class:'landing-section-heading'},h('span',{class:'landing-eyebrow'},'BUILT FOR ACTIVE LEARNING'),h('h2',null,'The tools belong together.'),h('p',null,'No scattered resources. No disconnected activities. A clear path from understanding to confident application.')),
   h('div',{class:'landing-feature-grid'},
    h('article',null,h('span',{class:'landing-feature-icon'},'01'),h('h3',null,'Structured course library'),h('p',null,'Open a course and find its topics, notes, questions, flashcards and related learning materials in one place.')),
    h('article',null,h('span',{class:'landing-feature-icon'},'02'),h('h3',null,'Purposeful practice'),h('p',null,'Use topic practice, timed CBT-style sessions and review that explains why an answer is correct.')),
    h('article',null,h('span',{class:'landing-feature-icon'},'03'),h('h3',null,'Practical understanding'),h('p',null,'Connect theory with procedures, observations, calculations, diagrams and interpretation.')),
    h('article',null,h('span',{class:'landing-feature-icon'},'04'),h('h3',null,'Study beyond the network'),h('p',null,'Save supported course packs and keep learning when connectivity is unreliable.'))));
  const cohes=h('section',{class:'landing-cohes-section',id:'landing-cohes'},
   h('div',{class:'landing-cohes-copy'},h('span',{class:'landing-eyebrow'},'OUR FIRST DEEP BUILD'),h('h2',null,'Starting with Bowen CoHES 100 Level.'),h('p',null,'The first mapped pilot is Bowen University’s CoHES MBBS 100 Level track. Other CoHES programmes will receive their own verified course maps instead of inheriting MBBS courses. Your selected programme and semester will shape the course catalogue, practice, challenges and progress.'),h('div',{class:'landing-cohes-tags'},h('span',null,'Bowen University'),h('span',null,'CoHES'),h('span',null,'100 Level'))),
   h('div',{class:'landing-cohes-card'},h('span',null,'THE STUDENT JOURNEY'),h('ol',null,h('li',null,'Choose your university'),h('li',null,'Select your faculty / college'),h('li',null,'Choose your programme'),h('li',null,'Set your level and semester'),h('li',null,'Enter a workspace shaped by your curriculum'))));
  const finalCta=h('section',{class:'landing-final-cta'},h('span',{class:'landing-eyebrow'},'MAKE YOUR STUDY TIME COUNT'),h('h2',null,'Start with the courses you actually take.'),h('p',null,'Create an account to keep your academic identity and study progress connected.'),h('button',{class:'landing-primary',onclick:()=>openAuth('signup')},'Get started with Bablo Hub',h('span',null,'→')));
  const footer=h('footer',{class:'landing-footer'},h('span',null,'Bablo Hub™'),h('span',null,'An academic workspace by TheMedConfidant'),h('a',{href:'#/about'},'About'));
  const root=h('div',{class:'landing-page'},topbar,hero,system,tools,cohes,finalCta,footer);
  mount(wrap(root));
  window.scrollTo(0,0);
 }
 window.openLandingAuth=openAuth;
 window.onboarding=showLanding;
})();