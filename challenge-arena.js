(function(){
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CA={match:null,qs:[],idx:0,done:false,end:0,timer:null,feedTimer:null,mode:null,tab:'overview',inbox:[],eliminated:false,questionCount:0,durationSeconds:300};
function frame(node){style();if(node&&node.id!=='challenge-dashboard'){const root=h('div',{id:'challenge-dashboard'});root.append(node);node=root;}mount(wrap(node));}
async function call(fn,args={}){if(!DB||!DB.account||!DB.account.token)throw Error('Log in to use Challenge Arena.');return await hubCall(fn,{p_token:DB.account.token,...args});}
function courses(){return [...new Set((window.__BANK__||[]).map(q=>String(q.c||'').trim()).filter(Boolean))].sort();}
function questions(){return (window.__BANK__||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length>1&&q.a!==undefined);}

function style(){if($('#cd-style'))return;let s=document.createElement('style');s.id='cd-style';s.textContent='#challenge-dashboard{width:100%;max-width:1120px;margin:0 auto;padding:18px 0 70px;color:var(--ink)}#challenge-dashboard *{box-sizing:border-box}#challenge-dashboard .cd-hero{min-height:220px;border-radius:24px;padding:28px;background:linear-gradient(125deg,#101c2d,#273c51);color:#fff;display:flex;flex-direction:column;justify-content:center}#challenge-dashboard .cd-hero p{color:#d4deea;max-width:560px}#challenge-dashboard .cd-kicker{font-size:.7rem;letter-spacing:.15em;color:#e7c66e;font-weight:900}#challenge-dashboard .cd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard .cd-stat,#challenge-dashboard .cd-panel{background:#101820;color:#fff;border:1px solid #344250;border-radius:16px;padding:16px}#challenge-dashboard .cd-panel .muted,#challenge-dashboard .cd-stat .muted{color:#c2ccd6}#challenge-dashboard input,#challenge-dashboard select{background:#080d12;color:#fff;border:1px solid #536273;border-radius:9px;padding:10px;max-width:100%}#challenge-dashboard option{background:#080d12;color:#fff}#challenge-dashboard .cd-row{border-color:#344250;color:#fff}#challenge-dashboard .cd-explanation{background:#172b24;border-left:3px solid #d6b45c;color:#f1f6f2;padding:12px;border-radius:8px}#challenge-dashboard .cd-stat b{display:block;font-size:1.5rem;color:#c39b43}#challenge-dashboard .cd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard .cd-checklist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 16px}#challenge-dashboard .cd-check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:600;margin:0}#challenge-dashboard .cd-check input{width:18px;height:18px;flex:0 0 auto;padding:0;margin:0}#challenge-dashboard .cd-actions{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:420px){#challenge-dashboard .cd-checklist{grid-template-columns:1fr}}#challenge-dashboard button{border:0;border-radius:12px;padding:12px;background:linear-gradient(135deg,#e4c36e,#c59d45);color:#17202b;font-weight:800;cursor:pointer}#challenge-dashboard button.secondary{background:var(--surface,#fff);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-modegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard .cd-modecard{min-height:130px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:8px;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-tabs{display:flex;gap:7px;overflow:auto;margin:16px 0}#challenge-dashboard .cd-tabs button{white-space:nowrap;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-grid{display:grid;grid-template-columns:1.4fr .8fr;gap:12px}#challenge-dashboard .cd-row{display:flex;justify-content:space-between;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px}#challenge-dashboard label{display:block;font-weight:700;margin:12px 0 6px}#challenge-dashboard input,#challenge-dashboard select{width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}#challenge-dashboard .cd-choice{display:block;width:100%;text-align:left;margin:8px 0;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:700px){#challenge-dashboard .cd-stats{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-actions{grid-template-columns:1fr 1fr}#challenge-dashboard .cd-modegrid{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-grid{grid-template-columns:1fr}}@media(max-width:420px){#challenge-dashboard .cd-modegrid{grid-template-columns:1fr}}';document.head.append(s);}
function hero(){return h('section',{class:'cd-hero'},h('div',{class:'cd-kicker'},'BABLO HUB  /  ACADEMIC COMPETITION'),h('h1',null,'Challenge Arena'),h('p',null,'Compete across courses. Earn points. Climb the Champions League.'),h('div',{class:'cd-quick'},h('span',null,'⚡ Live academic battles'),h('span',null,' • '),h('span',null,'🏆 Verified results')))}
function stat(n,t){return h('div',{class:'cd-stat'},h('b',null,n),h('span',{class:'muted'},t))}
function dashboard(){
 CA.tab='overview';
 const content=h('div',{id:'challenge-dashboard'});
 content.append(hero(),
  h('section',{class:'cd-panel'},
   h('h2',null,'Start a challenge'),
   h('p',{class:'muted'},'Create a quiz room, invite a friend or leave it open for another student to join.'),
   h('div',{class:'cd-actions'},
    h('button',{onclick:()=>createPanel()},'＋ Create challenge'),
    h('button',{class:'secondary',onclick:joinPrompt},'Join with code'),
    h('button',{class:'secondary',onclick:()=>tab('Discover')},'Find open challenges'))),
  h('div',{class:'cd-tabs'},
   h('button',{class:'active',onclick:dashboard},'My challenges'),
   h('button',{class:'secondary',onclick:()=>tab('Discover')},'Open challenges')),
  h('section',{class:'cd-panel'},
   h('div',{class:'cd-row'},h('h3',null,'My challenges'),h('button',{class:'secondary',onclick:loadInbox},'Refresh')),
   h('div',{id:'cd-inbox',class:'cd-list'},'Loading your challenges…')));
 frame(content);loadInbox();
}
async function loadInbox(){
 const el=$('#cd-inbox');if(!el)return;
 try{
  const x=await call('hub_challenge_inbox',{});CA.inbox=x.challenges||[];
  const openCount=CA.inbox.filter(m=>m.status==='waiting').length;
  const stats=$('#challenge-dashboard .cd-stats');
  if(stats){const vals=stats.querySelectorAll('.cd-stat b');if(vals[0])vals[0].textContent=String(openCount);if(vals[1])vals[1].textContent=String(CA.inbox.filter(m=>m.status==='waiting'&&m.created_by!==DB.profile.uid).length);}
  el.replaceChildren(...(CA.inbox.length?CA.inbox.map(m=>h('div',{class:'cd-row'},
   h('div',null,h('b',null,m.creator_username||'Quiz challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+m.status),h('div',{class:'muted'},'Room '+(m.invite_code||'—'))),
   m.created_by===DB.profile.uid?h('button',{class:'secondary',onclick:()=>open(m.id)},'Open lobby'):m.status==='waiting'?h('button',{onclick:()=>accept(m.id)},'Accept invite'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open match')
  )):[h('p',{class:'muted'},'No active rooms yet. Create a quiz challenge or join one with a room code.')]));
 }catch(e){el.textContent=e.message}
}
async function tab(name){
 if(name==='My challenges'){dashboard();return}
 const content=h('div',{id:'challenge-dashboard'},hero(),
  h('div',{class:'cd-tabs'},
   h('button',{class:'secondary',onclick:dashboard},'My challenges'),
   h('button',{class:'active',onclick:()=>tab('Discover')},'Open challenges')),
  h('section',{class:'cd-panel'},h('div',{class:'cd-row'},h('h3',null,'Open challenges'),h('button',{class:'secondary',onclick:()=>tab('Discover')},'Refresh')),h('div',{id:'cd-tab-content'},'Loading open challenges…')));
 frame(content);
 const out=$('#cd-tab-content');if(!out)return;
 try{
  const x=await call('hub_challenge_discover',{}),items=x.challenges||[];
  out.replaceChildren(...(items.length?items.map(m=>h('div',{class:'cd-row'},
   h('div',null,h('b',null,'@'+(m.creator_username||'student')),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+m.status)),
   h('button',{onclick:()=>accept(m.id)},'Join'))):[h('p',{class:'muted'},'No open challenges right now. Create one and invite a friend.')])); 
 }catch(e){out.replaceChildren(h('p',{class:'muted'},e.message||'Could not load open challenges.'),h('button',{class:'secondary',onclick:()=>tab('Discover')},'Try again'))}
}
function createPanel(){
 const cs=courses();
 const courseLabel=c=>{const found=(window.COURSES||[]).find(x=>x.code===c);return found?found.label:c};
 const courseChecks=cs.map(c=>h('label',{class:'cd-check'},h('input',{type:'checkbox',class:'cd-course-check',value:c}),h('span',null,courseLabel(c))));
 const content=h('div',{id:'challenge-dashboard'},hero(),
  h('section',{class:'cd-panel'},
   h('h2',null,'Create a challenge'),
   h('p',{class:'muted'},'Choose one or more courses. Topics will update automatically.'),
   h('label',null,'Courses'),
   h('div',{id:'cd-course-list',class:'cd-checklist'},...courseChecks),
   h('div',{id:'cd-topic-wrap'},
    h('label',null,'Topics'),
    h('div',{id:'cd-topics',class:'cd-checklist'},h('p',{class:'muted'},'Select course(s) to load topics.'))),
   h('div',{class:'cd-grid'},
    h('div',null,h('label',null,'Questions'),h('select',{id:'cd-count'},...[5,10,15,20,30,50].map(n=>h('option',{value:n,selected:n===10},n+' questions')))),
    h('div',null,h('label',null,'Time limit'),h('select',{id:'cd-duration'},...[[180,'3 minutes'],[300,'5 minutes'],[600,'10 minutes'],[900,'15 minutes']].map(v=>h('option',{value:v[0],selected:v[0]===300},v[1]))))),
   h('label',null,'Invite a username (optional)'),
   h('input',{id:'cd-invite',placeholder:'Leave blank to create an open challenge',autocomplete:'off'}),
   h('p',{class:'tiny muted'},'You can create more than one challenge. Open challenges can be joined by other students.'),
   h('div',{class:'cd-actions'},h('button',{onclick:create},'Create challenge'),h('button',{class:'secondary',onclick:dashboard},'Cancel')))));
 frame(content);
 const topicHost=$('#cd-topics');
 const updateTopics=()=>{
  const selected=[...document.querySelectorAll('.cd-course-check:checked')].map(x=>x.value);
  if(!selected.length){topicHost.replaceChildren(h('p',{class:'muted'},'Select course(s) to load topics.'));return}
  const list=[...new Set(questions().filter(q=>selected.includes(q.c)).map(q=>String(q.u||'').trim()).filter(Boolean))].sort();
  topicHost.replaceChildren(...(list.length?list.map(t=>h('label',{class:'cd-check'},h('input',{type:'checkbox',class:'cd-topic-check',value:t,checked:true}),h('span',null,t))):[h('p',{class:'muted'},'No topics found for the selected course(s).')]));
 };
 $('#cd-course-list').addEventListener('change',updateTopics);
}
async function create(){
 CA.eliminated=false;
 const button=$('#challenge-dashboard button[onclick="create"]');
 if(button){button.disabled=true;button.textContent='Creating…'}
 try{
  const cs=[...document.querySelectorAll('.cd-course-check:checked')].map(o=>o.value);
  const ts=[...document.querySelectorAll('.cd-topic-check:checked')].map(o=>o.value);
  const n=Number($('#cd-count').value);
  if(!cs.length)throw Error('Select at least one course.');
  if(!ts.length)throw Error('Select at least one topic.');
  const pool=questions().filter(q=>cs.includes(q.c)&&ts.includes(String(q.u||'')));
  if(pool.length<n)throw Error('Only '+pool.length+' questions are available for those topics. Reduce the question count or select more topics.');
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const answerIndex=q=>{
   const raw=String(q.a??'').trim(),opts=q.o.map(v=>String(v).trim());
   const byText=opts.findIndex(v=>v.toLowerCase()===raw.toLowerCase());
   if(byText>=0)return byText;
   if(/^[A-Z]$/i.test(raw)){const n=raw.toUpperCase().charCodeAt(0)-65;if(n>=0&&n<opts.length)return n;}
   if(/^\d+$/.test(raw)){const n=Number(raw);if(n>=0&&n<opts.length)return n;}
   throw Error('A question has an answer key that cannot be matched to its options. Please report it.');
  };
  const qs=pool.slice(0,n).map(q=>({prompt:String(q.q),choices:q.o.map(String),answer_key:String(answerIndex(q)),explanation:String(q.e||''),course:q.c,topic:q.u||''}));
  const duration=Number($('#cd-duration').value);
  CA.qs=qs.map(q=>({prompt:q.prompt,choices:q.choices,course:q.course,topic:q.topic}));CA.questionCount=n;CA.durationSeconds=duration;CA.mode='quick_duel';CA.idx=0;
  const x=await call('hub_challenge_create',{p_mode:'quick_duel',p_courses:cs,p_topics:ts,p_question_count:n,p_duration_seconds:duration,p_question_set:qs,p_invited_username:$('#cd-invite').value.trim()||null,p_leaderboard_opt_in:false});
  CA.match=x.match_id||x.id;room(CA.match,x.invite_code,x);watchLobby();
 }catch(e){toast(e.message)}
 finally{if(button){button.disabled=false;button.textContent='Create challenge'}}
}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else alert(msg)}
function joinPrompt(){let code=prompt('Enter challenge room code');if(!code)return;call('hub_challenge_join_code',{p_code:code.trim()}).then(x=>open(x.id||x.match_id)).catch(e=>toast(e.message))}
async function quick(){createPanel('quick_duel')}
async function accept(id){try{await call('hub_challenge_accept',{p_match_id:id});open(id)}catch(e){toast(e.message)}}
async function open(id){try{clearInterval(CA.timer);CA.eliminated=false;CA.match=id;let x=await call('hub_challenge_get_questions',{p_match_id:id});CA.mode=x.mode;CA.qs=x.questions||[];CA.idx=0;room(id,x.invite_code,x);if(x.status==='active')startMatch(x);else watchLobby()}catch(e){toast(e.message)}}
function room(id,code,x={}){let status=x.status||'waiting';frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Challenge lobby'),h('p',null,'Room code: '+(code||'Open inbox for code')),h('p',{class:'muted'},(x.question_count||CA.questionCount||CA.qs.length)+' questions · '+Math.round((x.duration_seconds||CA.durationSeconds||300)/60)+' minutes'),h('p',{id:'cd-lobby-status'},status==='ready'?'Opponent joined. Both players must be ready.':status==='active'?'Starting match…':'Waiting for an opponent to join.'),h('p',null,'Share this code with your opponent.'),h('button',{id:'cd-ready',onclick:ready,disabled:status==='active'},status==='active'?'Starting…':'I’m ready'),h('button',{class:'secondary',onclick:dashboard},'Back to Arena'))))}
async function ready(){try{let b=$('#cd-ready');if(b)b.disabled=true;let x=await call('hub_challenge_ready',{p_match_id:CA.match});if(x.status==='active'){let detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{let s=$('#cd-lobby-status');if(s)s.textContent='You’re ready. Waiting for your opponent to get ready…';if(b)b.textContent='Ready ✓';watchLobby()}}catch(e){let b=$('#cd-ready');if(b)b.disabled=false;toast(e.message)}}
function watchLobby(){clearInterval(CA.timer);CA.timer=setInterval(async()=>{try{let x=await call('hub_challenge_get_questions',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;startMatch(x);return}let s=$('#cd-lobby-status');if(s)s.textContent=x.status==='ready'?'Opponent joined. Both players must press Ready.':'Waiting for an opponent to join.'}catch(e){let s=$('#cd-lobby-status');if(s)s.textContent=e.message}},2000)}
function startMatch(x){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;CA.idx=0;let start=Date.parse(x.starts_at||new Date().toISOString());let duration=Number(x.duration_seconds)||300;CA.startAt=start;CA.end=start+duration*1000;let wait=Math.max(0,start-Date.now());if(wait){frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Match starting'),h('p',{class:'muted'},'Both players are ready. Your shared timer begins in a moment.'),h('strong',{id:'cd-start-count'},Math.ceil(wait/1000)+' seconds'))));CA.timer=setInterval(()=>{let left=Math.max(0,CA.startAt-Date.now()),el=$('#cd-start-count');if(el)el.textContent=Math.ceil(left/1000)+' seconds';if(!left){clearInterval(CA.timer);play()}},200)}else play()}
function play(){if(CA.eliminated){finish();return}let q=CA.qs[CA.idx];if(!q){finish();return}CA.done=false;CA.started=Date.now();frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('div',{class:'cd-row'},h('b',null,'Question '+(CA.idx+1)+' / '+CA.qs.length),h('strong',{id:'cd-clock'},'')),h('p',{class:'muted'},(q.course||'')+' · '+(q.topic||'')),h('div',{class:'cd-q'},q.prompt),h('div',{id:'cd-options'},...q.choices.map((c,i)=>h('button',{class:'cd-choice',onclick:()=>answer(i)},String.fromCharCode(65+i)+'. '+c))),h('div',{id:'cd-feedback'}),h('div',{class:'cd-quick'},h('button',{class:'secondary',onclick:react},'🔥'),h('button',{id:'cd-next',disabled:true,onclick:()=>{CA.idx++;play()}},'Next question')),h('div',{id:'cd-score',class:'muted'}))));tick();clearInterval(CA.timer);CA.timer=setInterval(tick,500);clearInterval(CA.feedTimer);feed();CA.feedTimer=setInterval(feed,2500)}
function tick(){let el=$('#cd-clock');if(!el)return;let left=Math.max(0,CA.end-Date.now());el.textContent=Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0');if(!left)finish()}
async function answer(i){if(CA.done||CA.eliminated)return;CA.done=true;let bs=[...$('#cd-options').querySelectorAll('button')];bs.forEach(b=>b.disabled=true);try{let x=await call('hub_challenge_submit_answer',{p_match_id:CA.match,p_question_index:CA.idx,p_answer_key:String(i),p_response_ms:Math.max(0,Date.now()-(CA.started||Date.now()))});$('#cd-feedback').textContent=x.correct?(x.point_awarded?'Correct — point earned.':'Correct — another player submitted the first correct answer.'):'Answer submitted — not correct.';feed();if(CA.mode==='survival'&&!x.correct){CA.eliminated=true;const next=$('#cd-next');if(next)next.disabled=true;$('#cd-feedback').textContent='Survival run ended. Your result has been recorded.';await finish();return}$('#cd-next').disabled=false;}catch(e){CA.done=false;bs.forEach(b=>b.disabled=false);toast(e.message)}}
async function feed(){try{let x=await call('hub_challenge_reaction_feed',{p_match_id:CA.match});let el=$('#cd-score');if(el)el.textContent=(x.players||[]).map(p=>p.username+' · '+p.score+' pts').join('  |  ')}catch(e){}}
async function react(){try{await call('hub_challenge_reaction_send',{p_match_id:CA.match,p_emoji:'🔥'})}catch(e){}}
async function finish(){
 clearInterval(CA.timer);clearInterval(CA.feedTimer);
 try{
  let x=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:false});
  if(x.waiting_for_opponent||x.status!=='completed'){
   frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'You’ve finished!'),h('p',{class:'muted'},'Your result is saved. Waiting for your opponent to finish before final standings are confirmed.'),h('div',{id:'cd-wait-status'},'Checking match status…'),h('button',{class:'secondary',onclick:dashboard},'Return to Arena'))));
   CA.timer=setInterval(async()=>{try{const state=await call('hub_challenge_get_questions',{p_match_id:CA.match});const el=$('#cd-wait-status');if(el)el.textContent='Opponent status: '+(state.status||'in progress');if(state.status==='completed'){clearInterval(CA.timer);const final=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:false});showFinal(final)}}catch(e){const el=$('#cd-wait-status');if(el)el.textContent=e.message}},2500);
   return;
  }
  showFinal(x);
 }catch(e){toast(e.message)}
}
function showFinal(x){
 clearInterval(CA.timer);clearInterval(CA.feedTimer);
 const box=h('section',{class:'cd-panel'},h('h2',null,'Final standings'),...(x.players||[]).map((p,i)=>h('div',{class:'cd-row'},h('b',null,(i+1)+'. '+p.username),h('span',null,p.score+' pts'))),h('button',{onclick:review},'Review answers'),h('button',{class:'secondary',onclick:dashboard},'Return to Arena'));
 frame(h('div',null,hero(),box));
}
async function review(){
 try{
  const x=await call('hub_challenge_review',{p_match_id:CA.match});
  const items=x.questions||[];
  const content=h('div',{id:'challenge-dashboard'},hero(),h('section',{class:'cd-panel'},h('h2',null,'Match review'),...items.map((q,i)=>h('article',{class:'cd-panel'},h('b',null,'Question '+(i+1)),h('p',null,q.prompt),h('p',{class:'muted'},'Correct answer: '+(Number.isInteger(Number(q.correct_answer))&&Number(q.correct_answer)>=0&&Number(q.correct_answer)<(q.choices||[]).length?String.fromCharCode(65+Number(q.correct_answer))+'. '+q.choices[Number(q.correct_answer)]:q.correct_answer)),q.explanation?h('p',{class:'cd-explanation'},q.explanation):null,...(q.responses||[]).map(r=>h('p',{class:'small'},'@'+r.username+' · '+(r.is_correct?'Correct':'Incorrect')+' · '+Math.round((r.response_ms||0)/1000)+'s')))),h('button',{class:'secondary',onclick:dashboard},'Return to Arena')));
  frame(content);
 }catch(e){toast(e.message)}
}
function installHomeEntry(){const path=location.hash.replace(/^#\/?/,'').split(/[/?]/)[0];if(path&&path!=='home')return;const app=document.getElementById('app'),main=app&&app.querySelector('main.wrap');if(!main||main.querySelector('[data-challenge-entry]'))return;const link=h('a',{href:'#/challenge',class:'btn primary block','data-challenge-entry':'true'},'🏆 Challenge Arena');const hero=main.querySelector('.hero');if(hero)hero.after(link);else main.prepend(link);}
function handleChallengeRoute(){const path=location.hash.replace(/^#\/?/,'').split(/[/?]/)[0];if(path==='challenge'){setTimeout(()=>{try{if(typeof DB!=='undefined'&&DB.profile&&window.challengeDashboardView)window.challengeDashboardView()}catch(e){console.error('[Challenge Arena route]',e)}},0)}else setTimeout(installHomeEntry,0)}
function watchShell(){const app=document.getElementById('app');if(app){new MutationObserver(()=>installHomeEntry()).observe(app,{childList:true,subtree:true});installHomeEntry();}if(location.hash.replace(/^#\/?/,'').split(/[/?]/)[0]==='challenge')handleChallengeRoute();}
window.addEventListener('hashchange',handleChallengeRoute);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchShell,{once:true});else watchShell();
if(location.hash.replace(/^#\/?/,'').split(/[/?]/)[0]==='challenge')setTimeout(handleChallengeRoute,0);
window.challengeDashboardView=function(){try{clearInterval(CA.timer);clearInterval(CA.feedTimer);dashboard()}catch(e){console.error('[Challenge Arena render]',e);try{mount(wrap(h('main',{id:'challenge-dashboard',class:'panel stack'},h('h2',null,'Challenge Arena could not load'),h('p',{class:'muted'},String(e&&e.message||e)),h('button',{onclick:()=>location.hash='#/'},'Back home'))))}catch(renderError){console.error('[Challenge Arena fallback]',renderError)}}};
})();