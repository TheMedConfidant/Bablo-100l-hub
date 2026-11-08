(function(){
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CA={match:null,qs:[],idx:0,done:false,end:0,timer:null,tab:'overview',inbox:[],opted:false,ready:false,finishing:false,presenceTimer:null};
function frame(node){style();const root=h('div',{id:'challenge-dashboard',class:'challenge-arena-root'});const isHome=!!(node&&node.classList&&node.classList.contains('challenge-home'));if(!isHome){root.append(h('div',{class:'cd-screen-nav'},h('button',{class:'secondary cd-back',onclick:()=>{clearInterval(CA.timer);dashboard()}},'← Back to Arena'),h('span',{class:'cd-nav-label'},'CHALLENGE ARENA')))}root.append(node);mount(wrap(root));}
function cleanText(value){return String(value??'').replaceAll('\\n',' ').replaceAll('/n',' ').replaceAll('\\r',' ').replaceAll('\\t',' ').replaceAll('\r',' ').replaceAll('\n',' ').replace(/\s{2,}/g,' ').trim();}
async function call(fn,args={}){if(!DB||!DB.account||!DB.account.token)throw Error('Log in to use Challenge Arena.');let last;for(let attempt=0;attempt<3;attempt++){try{return await hubCall(fn,{p_token:DB.account.token,...args})}catch(e){last=e;const m=String(e&&e.message||e);console.warn('[Challenge Arena RPC]',fn,'attempt',attempt+1,m);if(!/failed to fetch|network|timeout|502|503|504|temporar/i.test(m)||attempt===2)throw e;await new Promise(r=>setTimeout(r,350*Math.pow(2,attempt)));}}throw last;}
function courses(){return [...new Set((window.__BANK__||[]).map(q=>String(q.c||'').trim()).filter(Boolean))].sort();}
function questions(){return (window.__BANK__||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length>1&&q.a!==undefined);}

function style(){if($('#cd-style'))return;let s=document.createElement('style');s.id='cd-style';s.textContent=`
#challenge-dashboard{width:100%;max-width:1120px;margin:0 auto;padding:12px 0 76px;color:#f7f5ef;--cd-ink:#f7f5ef;--cd-muted:#b9c1ce;--cd-gold:#e5bd62;--cd-line:rgba(255,255,255,.12);--cd-panel:rgba(20,31,49,.88);--cd-panel2:rgba(27,41,62,.92);--cd-accent:#e5bd62}
#challenge-dashboard,#challenge-dashboard *{box-sizing:border-box}
#challenge-dashboard .cd-screen-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;padding:4px 0}
#challenge-dashboard .cd-nav-label{font-size:.68rem;letter-spacing:.16em;color:var(--cd-gold)!important;font-weight:900}
#challenge-dashboard .cd-back{min-height:42px;padding:9px 15px}
#challenge-dashboard .cd-hero{position:relative;isolation:isolate;overflow:hidden;min-height:220px;border-radius:24px;padding:clamp(22px,5vw,38px);background:radial-gradient(circle at 88% 15%,rgba(229,189,98,.22),transparent 32%),linear-gradient(135deg,#17263c 0%,#101a2b 58%,#26334a 100%)!important;border:1px solid rgba(229,189,98,.38);box-shadow:0 18px 45px rgba(0,0,0,.22);color:#fff!important;display:flex;flex-direction:column;justify-content:center}
#challenge-dashboard .cd-hero:after{content:'⚔';position:absolute;z-index:-1;right:5%;bottom:-42px;font-size:clamp(110px,22vw,190px);line-height:1;color:rgba(229,189,98,.09);transform:rotate(-12deg)}
#challenge-dashboard .cd-hero *{color:#fff!important}
#challenge-dashboard .cd-kicker{font-size:.68rem;letter-spacing:.17em;color:#f0cf83!important;font-weight:900}
#challenge-dashboard .cd-hero h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.05;letter-spacing:-.04em;margin:12px 0 8px;font-weight:900}
#challenge-dashboard .cd-hero p{max-width:560px;color:#d7dfeb!important;font-size:1rem;line-height:1.55;margin:0}
#challenge-dashboard .cd-quick{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:18px;color:#f0cf83!important;font-size:.78rem;font-weight:800}
#challenge-dashboard .cd-quick span{color:inherit!important}
#challenge-dashboard .cd-panel,#challenge-dashboard .cd-stat,#challenge-dashboard .cd-row,#challenge-dashboard article{background:var(--cd-panel)!important;color:var(--cd-ink)!important;border:1px solid var(--cd-line)!important;border-radius:18px;padding:17px;box-shadow:0 10px 28px rgba(0,0,0,.12)}
#challenge-dashboard .cd-panel{margin-top:14px}
#challenge-dashboard .cd-panel h2,#challenge-dashboard .cd-panel h3{font-size:1.08rem;letter-spacing:-.02em;margin:0 0 8px;color:#fff!important}
#challenge-dashboard .cd-panel *:not(button){color:inherit}
#challenge-dashboard .cd-panel .muted,#challenge-dashboard .muted,#challenge-dashboard small{color:var(--cd-muted)!important;opacity:1!important}
#challenge-dashboard .cd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}
#challenge-dashboard .cd-stat{background:var(--cd-panel2)!important}
#challenge-dashboard .cd-stat b{display:block;font-size:1.5rem;color:var(--cd-gold)!important}
#challenge-dashboard .cd-stat span{font-size:.78rem;color:var(--cd-muted)!important}
#challenge-dashboard .cd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}
#challenge-dashboard .cd-actions button{min-height:84px;text-align:left;padding:18px;border-radius:18px;display:flex;align-items:center;justify-content:flex-start;gap:10px;font-size:.95rem;box-shadow:0 10px 24px rgba(0,0,0,.16)}
#challenge-dashboard .cd-actions button:first-child{background:linear-gradient(135deg,#f0d28e,#d7a943)!important;color:#1a2432!important;border-color:#f0d28e}
#challenge-dashboard .cd-actions button.secondary{background:var(--cd-panel2)!important;color:#fff!important;border:1px solid var(--cd-line)!important}
#challenge-dashboard .cd-modegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}
#challenge-dashboard .cd-tabs{display:flex;gap:8px;overflow:auto;margin:18px 0 14px;padding:4px 1px;scrollbar-width:thin}
#challenge-dashboard .cd-tabs button{white-space:nowrap;border-radius:999px;padding:10px 16px;background:var(--cd-panel2)!important;color:#dce4ef!important;border:1px solid var(--cd-line)!important}
#challenge-dashboard .cd-tabs button.active{background:rgba(229,189,98,.16)!important;color:#f4d58f!important;border:1px solid rgba(229,189,98,.72)!important}
#challenge-dashboard .cd-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
#challenge-dashboard .cd-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:9px 0;background:var(--cd-panel2)!important}
#challenge-dashboard .cd-row b{font-size:.95rem;color:#fff!important}
#challenge-dashboard .cd-row .muted{font-size:.78rem;line-height:1.5}
#challenge-dashboard label{display:block;font-weight:800;margin:14px 0 7px;color:#f5f2eb!important}
#challenge-dashboard input,#challenge-dashboard select,#challenge-dashboard textarea{width:100%;padding:12px 13px;border:1px solid rgba(255,255,255,.2)!important;border-radius:12px;background:#111d2e!important;color:#fff!important;caret-color:#fff}
#challenge-dashboard select option{background:#111d2e!important;color:#fff!important}
#challenge-dashboard input::placeholder,#challenge-dashboard textarea::placeholder{color:#aeb9c8!important;opacity:1!important}
#challenge-dashboard .cd-choice{display:block;width:100%;text-align:left;margin:8px 0;background:var(--cd-panel2)!important;color:#fff!important;border:1px solid var(--cd-line)!important}
#challenge-dashboard button{border:1px solid #e5bd62;border-radius:12px;padding:12px 16px;background:#e5bd62!important;color:#172033!important;font-weight:900;cursor:pointer;transition:transform .16s ease,filter .16s ease}
#challenge-dashboard button:hover{filter:brightness(1.06);transform:translateY(-1px)}
#challenge-dashboard button.secondary{background:var(--cd-panel2)!important;color:#fff!important;border:1px solid var(--cd-line)!important}
#challenge-dashboard button:disabled{opacity:.55!important;cursor:not-allowed}
#challenge-dashboard button:focus-visible,#challenge-dashboard input:focus-visible,#challenge-dashboard select:focus-visible{outline:3px solid #e5bd62!important;outline-offset:2px}
@media(max-width:700px){#challenge-dashboard .cd-stats{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-actions{grid-template-columns:1fr}#challenge-dashboard .cd-actions button{min-height:62px}#challenge-dashboard .cd-modegrid{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-grid{grid-template-columns:1fr}#challenge-dashboard .cd-row{align-items:flex-start}}
@media(max-width:420px){#challenge-dashboard .cd-modegrid{grid-template-columns:1fr}#challenge-dashboard .cd-hero{min-height:200px}}
`;document.head.append(s);}
function hero(){return h('section',{class:'cd-hero'},h('div',{class:'cd-kicker'},'BABLO HUB  /  ACADEMIC COMPETITION'),h('h1',null,'Challenge Arena'),h('p',null,'Compete across courses. Earn points. Climb the Champions League.'),h('div',{class:'cd-quick'},h('span',null,'⚡ Live academic battles'),h('span',null,' • '),h('span',null,'🏆 Verified results')))}
function stat(n,t){return h('div',{class:'cd-stat'},h('b',null,n),h('span',{class:'muted'},t))}

let OFFLINE_MATCH=null;
function ghostKey(course,count){return 'bablo-ghost-v1:'+course+':'+count;}
function ghostFingerprint(q){return JSON.stringify([cleanText(q.q),...(q.o||[]).map(cleanText)]);}
function ghostEncode(data){const bytes=new TextEncoder().encode(JSON.stringify(data));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}
function ghostDecode(code){const raw=atob(String(code).trim().replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes));}
let GHOST_CHAMPIONS=[];
async function loadGhostChampions(){
  const period=$('#cd-ghost-period')?.value||'overall',select=$('#cd-ghost-champion');
  if(!select)return;
  select.replaceChildren(h('option',{value:''},'Loading Champions League…'));
  try{
    const data=await call('hub_challenge_leaderboard',{p_period:period});
    GHOST_CHAMPIONS=data.entries||[];
    select.replaceChildren(...(GHOST_CHAMPIONS.length?GHOST_CHAMPIONS.map(p=>h('option',{value:p.username},'#'+p.rank+' '+(p.nickname||p.username)+' · '+p.points+' pts · '+p.accuracy+'% accuracy · '+p.matches+' matches')):[h('option',{value:''},'No ranked players yet')]));
  }catch(e){select.replaceChildren(h('option',{value:''},'Could not load leaderboard'));toast('Champions League scores could not load: '+e.message);}
}
function offlineStartPanel(){
  const cs=courses();
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},
    h('h2',null,'Ghost Race · Offline Arena'),
    h('p',{class:'muted'},'Race your personal best, a friend’s ghost, or a Champions League accuracy benchmark. The benchmark is fetched online before the race; the race itself can run offline.'),
    h('label',null,'Course'),
    h('select',{id:'cd-offline-course'},...cs.map(c=>h('option',{value:c},c))),
    h('label',null,'Number of questions'),
    h('select',{id:'cd-offline-count'},...[5,10,15,20,30].map(n=>h('option',{value:n,selected:n===10},n+' questions'))),
    h('label',null,'Race opponent'),
    h('select',{id:'cd-ghost-mode'},h('option',{value:'pb'},'My personal best'),h('option',{value:'friend'},'A friend’s ghost code'),h('option',{value:'champions'},'Champions League score benchmark')),
    h('div',{id:'cd-champions-config',style:{display:'none'}},
      h('label',null,'Leaderboard period'),
      h('select',{id:'cd-ghost-period'},...['overall','monthly','weekly'].map(p=>h('option',{value:p},p[0].toUpperCase()+p.slice(1)))),
      h('button',{class:'secondary',onclick:loadGhostChampions},'Refresh Champions League scores'),
      h('label',null,'Choose a player to challenge'),
      h('select',{id:'cd-ghost-champion'},h('option',{value:''},'Load leaderboard scores first')),
      h('p',{class:'muted'},'This compares your run accuracy with the selected player’s verified Champions League accuracy. It is a score benchmark, not a replay of their exact questions or timing.')),
    h('label',null,'Friend ghost code (only for friend races)'),
    h('textarea',{id:'cd-ghost-code',rows:3,placeholder:'Paste a ghost code shared by a friend'}),
    h('label',null,'Time limit'),
    h('select',{id:'cd-offline-time'},...[[0,'No timer'],[5,'5 minutes'],[10,'10 minutes'],[20,'20 minutes'],[30,'30 minutes']].map(v=>h('option',{value:v[0]},v[1]))),
    h('div',{class:'cd-quick'},h('button',{onclick:offlineBegin},'Start ghost race'),h('button',{class:'secondary',onclick:dashboard},'Back')))));
  $('#cd-ghost-mode').addEventListener('change',e=>{const box=$('#cd-champions-config');if(box)box.style.display=e.target.value==='champions'?'block':'none';if(e.target.value==='champions')loadGhostChampions();});
}
function offlineBegin(){
  const course=$('#cd-offline-course').value,count=Number($('#cd-offline-count').value),mins=Number($('#cd-offline-time').value),mode=$('#cd-ghost-mode').value;
  let ghost=null,benchmark=null;
  if(mode==='champions'){
    const username=$('#cd-ghost-champion')?.value;
    benchmark=GHOST_CHAMPIONS.find(p=>p.username===username);
    if(!benchmark){toast('Choose a player from the loaded Champions League scores first.');return;}
  }
  if(mode==='pb'){
    try{ghost=JSON.parse(localStorage.getItem(ghostKey(course,count))||'null');}catch(_){}
    if(!ghost){toast('No personal best yet. Complete one run first to create your ghost.');return;}
  }else if(mode==='friend'){
    try{ghost=ghostDecode($('#cd-ghost-code').value);}
    catch(_){toast('That ghost code could not be read. Check the copied code.');return;}
    if(ghost.v!==1||ghost.course!==course||ghost.count!==count||!Array.isArray(ghost.fingerprints)||!Array.isArray(ghost.durations)||ghost.fingerprints.length!==count||ghost.durations.length!==count){toast('This ghost does not match the selected course or question count.');return;}
  }
  const pool=questions().filter(q=>String(q.c||'').trim()===course&&q.q&&Array.isArray(q.o)&&q.o.length>1);
  const indexed=new Map(pool.map(q=>[ghostFingerprint(q),q]));
  let picked;
  if(ghost){picked=ghost.fingerprints.map(fp=>indexed.get(fp)).filter(Boolean);if(picked.length!==count){toast('This device is missing one or more questions from that ghost run. Download the course content first.');return;}}
  else picked=[...pool].sort(()=>Math.random()-.5).slice(0,count);
  if(picked.length<count){toast('Not enough usable questions are available for '+course+'.');return;}
  picked=picked.map(q=>{
    const choices=q.o.map(String),raw=q.a;
    let answer=typeof raw==='number'?raw:(/^[A-D]$/i.test(String(raw))?String(raw).toUpperCase().charCodeAt(0)-65:choices.findIndex(v=>v.trim()===String(raw).trim()));
    if(answer<0)answer=Number.parseInt(raw,10);
    return {prompt:cleanText(q.q),choices:choices.map(cleanText),answer,explanation:cleanText(q.explanation||q.e||''),topic:cleanText(q.u||q.topic||''),fingerprint:ghostFingerprint(q)};
  }).filter(q=>Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);
  if(picked.length<count){toast('Some questions have incomplete answer keys. Try another course or question count.');return;}
  OFFLINE_MATCH={course,questions:picked,index:0,correct:0,answers:[],durations:[],started:Date.now(),questionStarted:Date.now(),end:mins?Date.now()+mins*60000:0,done:false,timer:null,ghost:ghost||null,ghostMode:mode,benchmark:benchmark||null};
  offlineRenderQuestion();
}
function offlineGhostStatus(){
  const m=OFFLINE_MATCH,el=$('#cd-ghost-status');if(!m||!el)return;
  if(m.benchmark){el.textContent='Champions League target: '+m.benchmark.accuracy+'% accuracy ('+m.benchmark.points+' verified points across '+m.benchmark.matches+' matches).';return;}
  if(!m.ghost){el.textContent='No ghost opponent · this run will set your first personal best.';return;}
  const target=m.ghost.durations.slice(0,m.index).reduce((a,b)=>a+b,0),elapsed=Math.max(0,Date.now()-m.started);
  const diff=elapsed-target;
  el.textContent=diff<=0?'You are '+Math.ceil(Math.abs(diff)/1000)+'s ahead of the ghost':'Ghost is '+Math.ceil(diff/1000)+'s ahead';
}
function offlineRenderQuestion(){
  const m=OFFLINE_MATCH;if(!m)return;
  if(m.index>=m.questions.length){offlineFinish();return;}
  const q=m.questions[m.index];m.done=false;m.questionStarted=Date.now();
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},
    h('div',{class:'cd-row'},h('b',null,'Ghost Race · Question '+(m.index+1)+' / '+m.questions.length),h('strong',{id:'cd-offline-clock'},'')),
    h('p',{id:'cd-ghost-status',class:'muted'},'Tracking ghost pace…'),
    h('p',{class:'muted'},m.course+' · '+(q.topic||'General')),
    h('div',{class:'cd-q'},q.prompt),
    h('div',{id:'cd-offline-options'},...q.choices.map((choice,i)=>h('button',{class:'cd-choice',onclick:()=>offlineAnswer(i)},String.fromCharCode(65+i)+'. '+choice))),
    h('div',{id:'cd-offline-feedback'}),
    h('button',{id:'cd-offline-next',disabled:true,onclick:()=>{m.index++;offlineRenderQuestion()}},'Next question'))));
  clearInterval(m.timer);
  m.timer=setInterval(()=>{
    const elapsed=Date.now()-m.started,left=m.end?Math.max(0,m.end-Date.now()):0,clock=$('#cd-offline-clock');
    if(clock)clock.textContent=m.end?Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0'):Math.floor(elapsed/60000)+':'+String(Math.floor(elapsed/1000)%60).padStart(2,'0');
    offlineGhostStatus();if(m.end&&!left)offlineFinish();
  },400);
  offlineGhostStatus();
}
function offlineAnswer(i){
  const m=OFFLINE_MATCH;if(!m||m.done)return;m.done=true;
  const q=m.questions[m.index],correct=i===q.answer;if(correct)m.correct++;
  m.durations.push(Math.max(250,Date.now()-m.questionStarted));m.answers.push({selected:i,correct});
  $('#cd-offline-options').querySelectorAll('button').forEach((button,j)=>{button.disabled=true;if(j===q.answer)button.style.borderColor='#65c58a';if(j===i&&!correct)button.style.borderColor='#e57373'});
  const feedback=$('#cd-offline-feedback');
  feedback.append(h('p',{class:'cd-row'},correct?'Correct':'Not quite · Correct answer: '+String.fromCharCode(65+q.answer)),q.explanation?h('p',{class:'muted'},'Explanation: '+q.explanation):null);
  $('#cd-offline-next').disabled=false;
}
async function offlineFinish(){
  const m=OFFLINE_MATCH;if(!m)return;clearInterval(m.timer);OFFLINE_MATCH=null;
  const secs=Math.max(1,Math.round((Date.now()-m.started)/1000)),pct=Math.round(m.correct/m.questions.length*100),entry={ts:Date.now(),course:m.course,mode:'ghost-race',ghostMode:m.ghostMode,benchmarkUsername:m.benchmark?.username||null,benchmarkAccuracy:m.benchmark?.accuracy??null,opponentScore:m.ghost?.score??null,n:m.questions.length,correct:m.correct,pct,secs,offline:true};
  const record={v:1,course:m.course,count:m.questions.length,score:m.correct,pct,secs,fingerprints:m.questions.map(q=>q.fingerprint),durations:m.durations};
  let isPB=false;
  try{const key=ghostKey(m.course,m.questions.length),old=JSON.parse(localStorage.getItem(key)||'null');if(!old||record.score>old.score||(record.score===old.score&&record.secs<old.secs)){localStorage.setItem(key,JSON.stringify(record));isPB=true;}}catch(_){}
  DB.history=DB.history||[];DB.history.push(entry);DB.history=DB.history.slice(-300);
  try{save();if(window.BabloOffline)await window.BabloOffline.saveLocal('offline-challenge-history',DB.history.filter(x=>x.offline).slice(-100));}catch(_){}
  const shareCode=ghostEncode(record);
  const result=h('div',null,hero(),h('section',{class:'cd-panel'},
    h('h2',null,'Ghost race complete'),
    h('div',{class:'cd-stats'},stat(m.correct+'/'+m.questions.length,'Correct answers'),stat(pct+'%','Accuracy'),stat(Math.floor(secs/60)+'m '+(secs%60)+'s','Time used'),stat(isPB?'NEW PB':'Saved','Personal best')),
    h('p',{class:'muted'},m.benchmark?('Champions League benchmark: '+(pct>Number(m.benchmark.accuracy)?'You beat ':'You did not beat ')+(m.benchmark.nickname||m.benchmark.username)+'’s '+m.benchmark.accuracy+'% verified accuracy. '+(pct===Number(m.benchmark.accuracy)?'You matched the benchmark.':'')):m.ghost?(m.ghost.score===m.correct?(secs<=m.ghost.secs?'You beat the ghost on time.':'You matched the ghost score.'):(m.correct>m.ghost.score?'You beat the ghost score.':'The ghost scored higher this time.')):'Your first run is saved. Race it next time to chase your personal best.'),
    h('label',null,'Share this ghost with a friend'),
    h('textarea',{id:'cd-ghost-share',rows:3,readonly:true},shareCode),
    h('button',{onclick:()=>{const el=$('#cd-ghost-share');el.select();if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(shareCode).then(()=>toast('Ghost code copied.')).catch(()=>toast('Select and copy the ghost code.'));else toast('Select and copy the ghost code.');}},'Copy ghost code'),
    h('button',{onclick:offlineStartPanel},'Race again'),
    h('button',{class:'secondary',onclick:dashboard},'Return to Arena')));
  frame(result);
}
function openCourseAnalytics(){if(window.BabloCourseAnalytics){window.BabloCourseAnalytics.open();return;}const s=document.createElement('script');s.src='./course-analytics.js';s.onload=()=>window.BabloCourseAnalytics&&window.BabloCourseAnalytics.open();s.onerror=()=>toast('Course analytics could not load.');document.head.append(s);}
function openWifiBattle(){if(window.BabloWifiChallenge){window.BabloWifiChallenge.open();return;}const s=document.createElement('script');s.src='./wifi-challenge.js';s.onload=()=>window.BabloWifiChallenge&&window.BabloWifiChallenge.open();s.onerror=()=>toast('Local Wi-Fi battle module could not load.');document.head.append(s);}
function profilePanel(){
  const a=(DB&&DB.account)||{};
  const pick=(...keys)=>{for(const k of keys){const v=a[k];if(v!==undefined&&v!==null&&String(v).trim())return String(v)}return 'Not available'};
  const uid=pick('unique_id','uniqueId','uid');
  const panel=h('section',{class:'cd-panel'});
  panel.append(h('div',{class:'cd-eyebrow'},'YOUR BABLO IDENTITY'),h('h2',null,'My Profile'),h('p',{class:'muted'},'Your account identity used across Bablo Hub challenges and connected experiences.'));
  const grid=h('div',{class:'cd-profile-grid'});
  const guest=(a.is_guest??a.isGuest)===true;
  const items=[['Bablo ID',uid],['Username',pick('username','handle')],['Full name',pick('full_name','fullName','name')],['Display name',pick('nickname','nick','display_name')],['Programme',pick('programme')],['Account type',guest?'Guest':'Student'],['Membership',a.premium?'Premium':'Standard']];
  items.forEach(([label,value])=>grid.append(h('article',{class:'cd-profile-item'},h('span',{class:'muted'},label),h('strong',null,value))));
  panel.append(grid);
  const copy=h('button',{class:'secondary',onclick:async()=>{try{await navigator.clipboard.writeText(uid);copy.textContent='Copied!';setTimeout(()=>copy.textContent='Copy Bablo ID',1600)}catch(_){copy.textContent='Select the ID above to copy'}}},'Copy Bablo ID');
  panel.append(copy,h('p',{class:'muted'},'Keep your Bablo ID available when adding friends or recovering access. Never share your password or session token.'));
  frame(h('div',null,hero(),h('div',{class:'cd-tabs'},h('button',{class:'secondary',onclick:dashboard},'← Challenge Arena')),panel));
}
function dashboard(){
  stopPresence();
  CA.tab='overview';
  const nav=['Discover','My Challenges','Champions League'].map((t)=>h('button',{class:'secondary',onclick:()=>tab(t)},t));
  const content=h('div',{class:'challenge-home'});
  const actions=h('div',{class:'cd-actions'});
  actions.append(
    h('button',{onclick:()=>createPanel('quick_duel')},'＋ Create challenge'),
    h('button',{class:'secondary',onclick:joinPrompt},'↗ Join with code'),
    h('button',{class:'secondary',onclick:()=>tab('Discover')},'🌐 Find open challenges'),
    h('button',{class:'secondary',onclick:offlineStartPanel},'🏁 Ghost Race'),
    h('button',{class:'secondary',onclick:openWifiBattle},'📡 Local Wi-Fi Battle'),
    h('button',{class:'secondary',onclick:openCourseAnalytics},'📊 Course Analytics'),
    h('button',{class:'secondary',onclick:profilePanel},'👤 My Profile')
  );
  const rooms=h('section',{class:'cd-panel'});
  rooms.append(h('h3',null,'Your active challenges'),h('div',{id:'cd-inbox',class:'cd-list'},'Loading your challenges…'));
  content.append(
    hero(),
    h('p',{class:'muted'},'Create a quiz battle, join a public room, and compete across your courses.'),
    actions,
    h('div',{class:'cd-tabs'},...nav),
    rooms
  );
  frame(content);
  loadInbox();
}
async function loadInbox(){let el=$('#cd-inbox');if(!el)return;try{let x=await call('hub_challenge_inbox',{});CA.inbox=x.challenges||[];el.replaceChildren(...(CA.inbox.length?CA.inbox.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+m.status),h('div',{class:'muted'},'Room '+(m.invite_code||'—'))),m.status==='waiting'?h('button',{onclick:()=>accept(m.id)},'Accept'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open'))):[h('p',{class:'muted'},'No active rooms yet. Start a Quick Match or create a challenge.')]))}catch(e){el.textContent=e.message}}
async function tab(name){
  const tabs=['Overview','Discover','My Challenges','Champions League'];
  if(name==='Overview'){dashboard();return;}
  const shell=()=>h('div',null,hero(),h('div',{class:'cd-tabs'},...tabs.map(t=>h('button',{class:t===name?'active':'secondary',onclick:()=>tab(t)},t))));
  try{
    if(name==='Discover'){
      const x=await call('hub_challenge_discover',{});
      const rows=x.challenges||[];
      const panel=h('section',{class:'cd-panel'},h('h2',null,'Open challenges'),h('p',{class:'muted'},'Join a public room and compete with another Bablo student.'));
      panel.append(...(rows.length?rows.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Student'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions'),h('div',{class:'muted'},m.mode+' · '+Math.round((m.duration_seconds||300)/60)+' min')),h('button',{onclick:()=>accept(m.id)},'Join'))):[h('p',{class:'muted'},'No open public challenges right now. Create one and invite others.')] ));
      frame(h('div',null,shell(),panel));return;
    }
    if(name==='My Challenges'){
      const [activeData,historyData]=await Promise.all([
        call('hub_challenge_inbox',{}),
        call('hub_challenge_history',{})
      ]);
      const rows=activeData.challenges||[],history=historyData.matches||[];
      const panel=h('section',{class:'cd-panel'},h('h2',null,'Active & recent challenges'));
      const active=rows.filter(m=>['waiting','ready','active'].includes(m.status));
      panel.append(h('h3',null,'Active rooms'));
      panel.append(...(active.length?active.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+m.status),h('div',{class:'muted'},'Code: '+(m.invite_code||'—'))),m.status==='waiting'&&m.created_by!==((DB&&DB.account&&(DB.account.unique_id||DB.account.uid))||'')?h('button',{onclick:()=>accept(m.id)},'Accept'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open lobby'))):[h('p',{class:'muted'},'No active rooms.')] ));
      const completed=history.filter(m=>m.status==='completed'),abandoned=history.filter(m=>m.status==='abandoned');
      panel.append(h('h3',null,'Completed results'));
      panel.append(...(completed.length?completed.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,(m.courses||[]).join(', ')||'Challenge match'),h('div',{class:'muted'},new Date(m.completed_at||m.created_at).toLocaleString()+' · '+m.question_count+' questions'),h('div',{class:'muted'},(m.players||[]).map(p=>p.username+' '+p.score+' pts').join(' · '))),h('button',{onclick:()=>openSavedReview(m.id)},'Review results'))):[h('p',{class:'muted'},'Completed matches will appear here.')] ));
      panel.append(h('h3',null,'Abandoned matches'));
      panel.append(...(abandoned.length?abandoned.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,(m.courses||[]).join(', ')||'Challenge match'),h('div',{class:'muted'},'Abandoned · '+new Date(m.completed_at||m.created_at).toLocaleString()),h('div',{class:'muted'},(m.players||[]).map(p=>p.username+' '+p.score+' pts').join(' · '))),h('span',{class:'muted'},'Not ranked'))):[h('p',{class:'muted'},'No abandoned matches.')] ));
      const ghostRuns=(DB.history||[]).filter(r=>r.mode==='ghost-race').slice(-20).reverse();
      panel.append(h('h3',null,'Ghost Race history'));
      panel.append(...(ghostRuns.length?ghostRuns.map(r=>h('div',{class:'cd-row'},
        h('div',null,h('b',null,r.course||'Ghost Race'),h('div',{class:'muted'},new Date(r.ts).toLocaleString()+' · '+r.n+' questions · '+(r.ghostMode==='champions'?'Champions League benchmark':r.ghostMode==='friend'?'Friend ghost':'Personal best'))),
        h('strong',null,r.correct+'/'+r.n+' · '+r.pct+'%'))):[h('p',{class:'muted'},'Offline and ghost races completed on this device will appear here.')]));
      frame(h('div',null,shell(),panel));return;
    }
    if(name==='Champions League'){
      const period=CA.leaguePeriod||'overall';
      const x=await call('hub_challenge_leaderboard',{p_period:period});
      const panel=h('section',{class:'cd-panel'},h('h2',null,'Champions League'),h('p',{class:'muted'},'Rankings are based on verified completed matches from opted-in players.'));
      const periods=h('div',{class:'cd-tabs'});
      [['overall','Overall'],['monthly','Monthly'],['weekly','Weekly']].forEach(([key,label])=>periods.append(h('button',{class:period===key?'active':'secondary',onclick:()=>{CA.leaguePeriod=key;tab('Champions League')}},label)));
      panel.append(periods,h('div',{class:'cd-stats'},stat((x.entries||[]).length,'Ranked players'),stat((x.entries||[]).reduce((n,p)=>n+Number(p.matches||0),0),'Completed entries')));
      panel.append(...((x.entries||[]).length?(x.entries||[]).map(p=>h('div',{class:'cd-row'},h('div',null,h('b',null,'#'+p.rank+' '+(p.nickname||p.username)),h('div',{class:'muted'},(p.programme||'')+' · '+p.matches+' matches · '+p.wins+' wins · '+p.accuracy+'% accuracy')),h('strong',null,p.points+' pts'))):[h('p',{class:'muted'},'No verified leaderboard entries for this period yet. Complete a match and opt in to appear.')] ));
      frame(h('div',null,shell(),panel));return;
    }
  }catch(e){frame(h('div',null,shell(),h('section',{class:'cd-panel'},h('p',{class:'muted'},e.message),h('button',{onclick:()=>tab(name)},'Retry'))));}
}
function topicOptions(selectedCourses){
  const bank=questions().filter(q=>selectedCourses.includes(String(q.c||'').trim()));
  return [...new Set(bank.map(q=>String(q.u||q.topic||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function refreshChallengeTopics(){
  const coursesEl=$('#cd-courses'),topicsEl=$('#cd-topics');if(!coursesEl||!topicsEl)return;
  const chosen=[...coursesEl.selectedOptions].map(o=>o.value);
  const previous=new Set([...topicsEl.selectedOptions].map(o=>o.value));
  const topics=topicOptions(chosen);
  topicsEl.replaceChildren(...topics.map(t=>h('option',{value:t,selected:previous.has(t)},t)));
  const hint=$('#cd-topic-hint');
  if(hint)hint.textContent=topics.length?topics.length+' topics available. Select one or more, or leave unselected for all topics.':'No topic labels found; all questions in the selected course(s) remain available.';
}
function createPanel(mode){
  const cs=courses();
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Create a challenge'),
    h('div',{class:'cd-grid'},
      h('div',null,
        h('label',null,'Game mode'),h('select',{id:'cd-mode'},...['First to Answer|quick_duel','Mixed Challenge|multi_course','Timed Test|course_clash','Topic Master|topic_battle','Survival|survival','Best of Several Rounds|marathon'].map(v=>h('option',{value:v.split('|')[1],selected:v.split('|')[1]===(mode||'quick_duel')},v.split('|')[0]))),
        h('label',null,'Courses — select multiple'),h('select',{id:'cd-courses',multiple:true,size:6},...cs.map(c=>h('option',{value:c},c))),
        h('label',null,'Topics — select multiple'),h('select',{id:'cd-topics',multiple:true,size:6}),
        h('small',{id:'cd-topic-hint',class:'muted'},'Select course(s) to load topics. Leave topics unselected to include all topics.'),
        h('label',null,'Question count'),h('select',{id:'cd-count'},...[5,10,15,20,30,50].map(n=>h('option',{value:n,selected:n===10},n+' questions')))),
      h('div',null,
        h('label',null,'Match duration'),h('select',{id:'cd-duration'},...[[180,'3 minutes'],[300,'5 minutes'],[600,'10 minutes'],[900,'15 minutes'],[1800,'30 minutes']].map(v=>h('option',{value:v[0]},v[1]))),
        h('label',null,'Players (2–8)'),h('select',{id:'cd-max-players'},...[2,3,4,5,6,7,8].map(n=>h('option',{value:n,selected:n===2},n+' players'))),
        h('small',{class:'muted'},'Public rooms can host up to 8 students. Private username invites remain 1-vs-1.'),
        h('label',null,'Invite username (optional)'),h('input',{id:'cd-invite',placeholder:'Enter Bablo username'}),
        h('label',null,'Leaderboard'),h('select',{id:'cd-private'},h('option',{value:'false'},'Keep score private'),h('option',{value:'true'},'Include in Champions League')),h('small',{class:'muted'},'Without an invite username, your room appears in Discover for other students. Your leaderboard preference does not affect room visibility.'))),
    h('div',{class:'cd-quick'},h('button',{id:'cd-create-button',onclick:create},'Create room'),h('button',{class:'secondary',onclick:dashboard},'Cancel')))));
  if(typeof mode==='string')$('#cd-mode').value=mode;
  $('#cd-courses').addEventListener('change',refreshChallengeTopics);
  refreshChallengeTopics();
}
async function create(){
  const button=$('#cd-create-button');
  try{
    const cs=[...$('#cd-courses').selectedOptions].map(o=>o.value);
    const topics=[...$('#cd-topics').selectedOptions].map(o=>o.value);
    const n=+$('#cd-count').value;
    const maxPlayers=Number($('#cd-max-players')?.value||2);
    const invite=$('#cd-invite').value.trim();
    if(invite&&maxPlayers>2)throw Error('Private username invitations are currently 1-vs-1. Choose 2 players or create a public room for a larger group.');
    if(!cs.length)throw Error('Select at least one course.');
    const pool=questions().filter(q=>cs.includes(String(q.c||'').trim())&&(!topics.length||topics.includes(String(q.u||q.topic||'').trim())));
    if(pool.length<n)throw Error('Only '+pool.length+' usable questions match those selections. Select more topics or reduce the question count.');
    const shuffled=[...pool].sort(()=>Math.random()-.5);
    const qs=shuffled.slice(0,n).map(q=>{
      const choices=q.o.map(String),raw=q.a;
      let answer=typeof raw==='number'?raw:(/^[A-D]$/i.test(String(raw))?String(raw).toUpperCase().charCodeAt(0)-65:choices.findIndex(v=>v.trim()===String(raw).trim()));
      if(answer<0)answer=Number.parseInt(raw,10);
      if(!Number.isInteger(answer)||answer<0||answer>=choices.length)throw Error('A selected question has an unrecognised answer key. Please report this question.');
      return {prompt:cleanText(q.q),choices:choices.map(cleanText),answer_key:String(answer),course:cleanText(q.c),topic:cleanText(q.u||q.topic||''),explanation:cleanText(q.explanation||q.e||'')};
    });
    button.disabled=true;
    const x=await call('hub_challenge_create',{p_mode:$('#cd-mode').value,p_courses:cs,p_topics:topics,p_question_count:n,p_duration_seconds:+$('#cd-duration').value,p_question_set:qs,p_invited_username:invite||null,p_leaderboard_opt_in:$('#cd-private').value==='true',p_max_players:maxPlayers});
    CA.match=x.id||x.match_id;CA.opted=$('#cd-private').value==='true';CA.ready=false;room(CA.match,x.invite_code,{...x,is_host:true,player_count:1,ready_count:0,my_status:'joined',players:[]});watchLobby();
  }catch(e){toast(e.message);if(button)button.disabled=false;}
}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else alert(msg)}
function joinPrompt(){let code=prompt('Enter challenge room code');if(!code)return;call('hub_challenge_join_code',{p_code:code.trim()}).then(x=>open(x.id||x.match_id)).catch(e=>toast(e.message))}
async function quick(){createPanel('quick_duel')}
async function accept(id){try{await call('hub_challenge_accept',{p_match_id:id});open(id)}catch(e){toast(e.message)}}
function stopPresence(){clearInterval(CA.presenceTimer);CA.presenceTimer=null;}
async function refreshPresence(){if(!CA.match)return;try{const x=await call('hub_challenge_presence',{p_match_id:CA.match});const roster=$('#cd-lobby-roster');if(roster)roster.replaceChildren(...(x.players||[]).map(p=>h('div',{class:'cd-row'},h('span',null,(p.username||'Player')+(p.is_host?' · Host':'')),h('span',{class:'muted'},(p.online?'● Online':'○ Reconnecting')+' · '+(p.status||'joined')))));const status=$('#cd-presence-status');if(status)status.textContent=x.is_host?'You are the room host.':x.host_online?'Host: '+(x.host_username||'connected')+'.':'Host connection lost. Eligible players can take over automatically.';const start=$('#cd-start-early');if(start){start.style.display=x.is_host?'':'none';start.disabled=(x.player_count||0)<2||(x.ready_count||0)!==(x.player_count||0);start.textContent='▶ Start with current players ('+(x.player_count||0)+')'}}catch(e){const status=$('#cd-presence-status');if(status)status.textContent='Connection check paused. Reconnecting…';}}
function watchPresence(){stopPresence();refreshPresence();CA.presenceTimer=setInterval(refreshPresence,8000);}
async function open(id){try{clearInterval(CA.timer);stopPresence();CA.match=id;await call('hub_challenge_presence',{p_match_id:id});let x=await call('hub_challenge_get_questions',{p_match_id:id});CA.qs=x.questions||[];CA.answers=x.my_answers||{};CA.ready=x.my_status==='ready';CA.idx=nextUnanswered(0);if(x.status==='completed'){const review=await call('hub_challenge_review',{p_match_id:id});showReview(review);return;}room(id,x.invite_code,x);watchPresence();if(x.status==='active')startMatch(x);else watchLobby()}catch(e){console.warn('[Challenge Arena resume]',e);toast(e.message)}}
function nextUnanswered(from){for(let i=Math.max(0,from);i<CA.qs.length;i++)if(!Object.prototype.hasOwnProperty.call(CA.answers||{},String(i)))return i;return CA.qs.length;}
function room(id,code,x={}){let status=x.status||'waiting',max=Number(x.max_players||2),count=Number(x.player_count||x.ready_count||1),host=!!x.is_host;frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Challenge lobby'),h('p',null,'Room code: '+(code||'Open inbox for code')),h('p',{class:'muted'},(x.question_count||CA.qs.length)+' questions · '+Math.round((x.duration_seconds||300)/60)+' minutes · '+max+' players max'),h('p',{id:'cd-lobby-count',class:'muted'},count+' / '+max+' players joined'),h('div',{id:'cd-lobby-roster',class:'cd-list'},...(x.players||[]).map(p=>h('div',{class:'cd-row'},h('span',null,p.username||'Player'),h('span',{class:'muted'},p.status||'joined')))),h('p',{id:'cd-presence-status',class:'muted'},'Checking player connections…'),h('p',{id:'cd-lobby-status'},status==='ready'?'Everyone here is ready. The host can start now or wait for more players.':status==='active'?'Starting match…':'Waiting for players. Joined players can mark themselves Ready.'),h('p',null,'Share this code with your group.'),h('button',{id:'cd-ready',onclick:ready,disabled:status==='active'||x.my_status==='ready'},x.my_status==='ready'?'Ready ✓':'I’m ready'),h('button',{id:'cd-start-early',onclick:startCurrent,disabled:count<2||Number(x.ready_count||0)<count||status==='active',style:{display:host?'':'none'}},'▶ Start with current players ('+count+')'),h('button',{class:'secondary',onclick:()=>{stopPresence();clearInterval(CA.timer);dashboard()}},'Back to Arena'))))}
async function ready(){try{let b=$('#cd-ready');if(b)b.disabled=true;let x=await call('hub_challenge_ready',{p_match_id:CA.match});CA.ready=true;if(x.status==='active'){let detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{let s=$('#cd-lobby-status');if(s)s.textContent='You’re ready. Waiting for everyone else. The host can start once all joined players are ready.';if(b)b.textContent='Ready ✓';watchLobby()}}catch(e){let b=$('#cd-ready');if(b)b.disabled=false;toast(e.message)}}
async function startCurrent(){try{const b=$('#cd-start-early');if(b)b.disabled=true;const x=await call('hub_challenge_start_now',{p_match_id:CA.match});if(x.status==='active'){const detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}}catch(e){toast(e.message);const b=$('#cd-start-early');if(b)b.disabled=false}}
function watchLobby(){clearInterval(CA.timer);CA.timer=setInterval(async()=>{try{let x=await call('hub_challenge_get_questions',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;startMatch(x);return}let s=$('#cd-lobby-status'),b=$('#cd-ready'),count=$('#cd-lobby-count');if(count)count.textContent=(x.player_count||0)+' / '+(x.max_players||2)+' players joined';if(s)s.textContent=x.status==='active'?'Starting match…':(x.ready_count||0)===(x.player_count||0)&&(x.player_count||0)>=2?'Everyone is ready. The host can start now or wait for the room to fill.':'Waiting for all joined players to press Ready.';if(b&&x.status!=='active'&&!CA.ready){b.disabled=false;b.textContent='I’m ready'}const start=$('#cd-start-early');if(start){start.style.display=x.is_host?'':'none';start.disabled=(x.player_count||0)<2||(x.ready_count||0)!==(x.player_count||0)||x.status==='active';start.textContent='▶ Start with current players ('+(x.player_count||0)+')'}}catch(e){let s=$('#cd-lobby-status');if(s)s.textContent=e.message}},2000)}
function startMatch(x){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;CA.answers=x.my_answers||CA.answers||{};CA.idx=nextUnanswered(0);let start=Date.parse(x.starts_at||new Date().toISOString());let duration=Number(x.duration_seconds)||300;CA.startAt=start;CA.end=start+duration*1000;let wait=Math.max(0,start-Date.now());if(wait){frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Match starting'),h('p',{class:'muted'},'Both players are ready. Your shared timer begins in a moment.'),h('strong',{id:'cd-start-count'},Math.ceil(wait/1000)+' seconds'))));CA.timer=setInterval(()=>{let left=Math.max(0,CA.startAt-Date.now()),el=$('#cd-start-count');if(el)el.textContent=Math.ceil(left/1000)+' seconds';if(!left){clearInterval(CA.timer);play()}},200)}else play()}
function play(){CA.idx=nextUnanswered(CA.idx);let q=CA.qs[CA.idx];if(!q){finish();return}CA.done=false;CA.started=Date.now();frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('div',{class:'cd-row'},h('b',null,'Question '+(CA.idx+1)+' / '+CA.qs.length),h('strong',{id:'cd-clock'},'')),h('p',{class:'muted'},(q.course||'')+' · '+(q.topic||'')),h('div',{class:'cd-q'},cleanText(q.prompt)),h('div',{id:'cd-options'},...q.choices.map((c,i)=>h('button',{class:'cd-choice',onclick:()=>answer(i)},String.fromCharCode(65+i)+'. '+cleanText(c)))),h('div',{id:'cd-feedback'}),h('div',{class:'cd-quick'},h('button',{class:'secondary',onclick:react},'🔥'),h('button',{id:'cd-next',disabled:true,onclick:()=>{CA.idx++;play()}},'Next question')),h('div',{id:'cd-score',class:'muted'}))));tick();clearInterval(CA.timer);CA.timer=setInterval(tick,500);feed()}
function tick(){let el=$('#cd-clock');if(!el)return;let left=Math.max(0,CA.end-Date.now());el.textContent=Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0');if(!left)finish()}
async function answer(i){if(CA.done)return;CA.done=true;let bs=[...$('#cd-options').querySelectorAll('button')];bs.forEach(b=>b.disabled=true);try{let x=await call('hub_challenge_submit_answer',{p_match_id:CA.match,p_question_index:CA.idx,p_answer_key:String(i),p_response_ms:Math.max(0,Date.now()-(CA.started||Date.now()))});CA.answers=CA.answers||{};CA.answers[String(CA.idx)]={answer_key:String(i),is_correct:!!x.correct,awarded_point:!!x.point_awarded};$('#cd-feedback').textContent=x.correct?(x.point_awarded?'Correct — first point secured.':'Correct — the point was already claimed.'):'Answer submitted — not correct.';$('#cd-next').disabled=false;feed()}catch(e){try{const state=await call('hub_challenge_get_questions',{p_match_id:CA.match});CA.answers=state.my_answers||{};if(Object.prototype.hasOwnProperty.call(CA.answers,String(CA.idx))){const saved=CA.answers[String(CA.idx)];$('#cd-feedback').textContent=saved.is_correct?(saved.awarded_point?'Answer saved — first point secured.':'Answer saved — correct, but the point was already claimed.'):'Answer saved.';$('#cd-next').disabled=false;feed();return;}}catch(syncError){}CA.done=false;bs.forEach(b=>b.disabled=false);toast('Connection interrupted. Your answer was not confirmed. Retry this answer when your connection returns. '+String(e.message||e));}}
async function feed(){try{let x=await call('hub_challenge_reaction_feed',{p_match_id:CA.match});let el=$('#cd-score');if(el)el.textContent=(x.players||[]).map(p=>p.username+' · '+p.score+' pts').join('  |  ')}catch(e){}}
async function react(){try{await call('hub_challenge_reaction_send',{p_match_id:CA.match,p_emoji:'🔥'})}catch(e){}}
async function finish(){
  if(CA.finishing)return;
  CA.finishing=true;clearInterval(CA.timer);
  try{
    const x=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:CA.opted});
    if(x.status==='completed'){const review=await call('hub_challenge_review',{p_match_id:CA.match});showReview(review);return;}
    frame(h('div',null,hero(),h('section',{class:'cd-panel'},
      h('h2',null,'Your answers are submitted'),
      h('p',{class:'muted'},'Your opponent has not finished yet. The final review unlocks when both players have submitted.'),
      h('div',{id:'cd-review-wait',class:'cd-row'},'Checking match status…'),
      h('button',{class:'secondary',onclick:checkReview},'Check results now'),
      h('button',{class:'secondary',onclick:dashboard},'Back to Arena'))));
    CA.finishing=false;
    clearInterval(CA.timer);
    CA.timer=setInterval(checkReview,3000);
  }catch(e){CA.finishing=false;toast(e.message)}
}
async function checkReview(){
  if(!CA.match)return;
  try{
    const x=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:CA.opted});
    if(x.status!=='completed'){
      const el=$('#cd-review-wait');if(el)el.textContent='Waiting for your opponent to submit…';
      return;
    }
    clearInterval(CA.timer);CA.finishing=true;
    const review=await call('hub_challenge_review',{p_match_id:CA.match});
    showReview(review);
  }catch(e){const el=$('#cd-review-wait');if(el)el.textContent=e.message;}
}
async function openSavedReview(id){try{CA.match=id;const review=await call('hub_challenge_review',{p_match_id:id});showReview(review)}catch(e){toast('Could not reopen results: '+e.message)}}
function showReview(x){
  clearInterval(CA.timer);CA.finishing=false;
  const players=x.players||[],questions=x.questions||[];
  const panel=h('section',{class:'cd-panel'},h('h2',null,'Final standings'));
  panel.append(...players.map((p,i)=>h('div',{class:'cd-row'},
    h('div',null,h('b',null,(i+1)+'. '+p.username),h('div',{class:'muted'},p.correct+' correct · '+p.incorrect+' incorrect')),
    h('strong',null,p.score+' pts'))));
  panel.append(h('h2',null,'Answer review'));
  if(!questions.length)panel.append(h('p',{class:'muted'},'No question review was returned for this match.'));
  questions.forEach((q,i)=>{
    const choices=q.choices||[];
    const answer=Number.parseInt(q.correct_answer,10);
    const card=h('article',{class:'cd-panel',style:'margin:10px 0'});
    card.append(h('b',null,'Question '+(i+1)),h('p',null,cleanText(q.prompt)));
    choices.forEach((choice,j)=>card.append(h('div',{class:'cd-row',style:j===answer?'border-color:#c59d45;background:rgba(197,157,69,.12)':''},
      h('span',null,String.fromCharCode(65+j)+'. '+cleanText(choice)),
      j===answer?h('strong',null,'Correct answer'):null)));
    if(q.explanation)card.append(h('p',{class:'muted'},'Explanation: '+cleanText(q.explanation)));
    if((q.responses||[]).length)card.append(h('div',{class:'muted'},'Responses: '+q.responses.map(r=>r.username+': '+(r.is_correct?'correct':'incorrect')+' ('+String.fromCharCode(65+(Number(r.answer_key)||0))+')').join(' · ')));
    panel.append(card);
  });
  panel.append(h('button',{onclick:dashboard},'Return to Arena'));
  frame(h('div',null,hero(),panel));
}
window.challengeDashboardView=function(){try{clearInterval(CA.timer);dashboard()}catch(e){console.error('[Challenge Arena render]',e);try{mount(wrap(h('main',{id:'challenge-dashboard',class:'panel stack'},h('h2',null,'Challenge Arena could not load'),h('p',{class:'muted'},String(e&&e.message||e)),h('button',{onclick:()=>location.hash='#/'},'Back home'))))}catch(renderError){console.error('[Challenge Arena fallback]',renderError)}}};
})();