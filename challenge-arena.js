(function(){
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CA={match:null,qs:[],idx:0,done:false,end:0,timer:null,tab:'overview',inbox:[],opted:false,ready:false,finishing:false,heartbeatTimer:null};
try{
  const initialQuery=String(location.hash||'').split('?')[1]||'';
  const initialCode=new URLSearchParams(initialQuery).get('code');
  if(initialCode)sessionStorage.setItem('bablo_pending_challenge_code',initialCode);
}catch(_){}

function frame(node){style();const root=h('div',{id:'challenge-dashboard',class:'challenge-arena-root'});const isHome=!!(node&&node.classList&&node.classList.contains('challenge-home'));if(!isHome){root.append(h('div',{class:'cd-screen-nav'},h('button',{class:'secondary cd-back',onclick:()=>{clearInterval(CA.timer);dashboard()}},'← Back to Arena'),h('span',{class:'cd-nav-label'},'CHALLENGE ARENA')))}root.append(node);mount(wrap(root));}
function cleanText(value){return String(value??'').replaceAll('\\n',' ').replaceAll('/n',' ').replaceAll('\\r',' ').replaceAll('\\t',' ').replaceAll('\r',' ').replaceAll('\n',' ').replace(/\s{2,}/g,' ').trim();}
async function call(fn,args={}){if(!DB||!DB.account||!DB.account.token)throw Error('Log in to use Challenge Arena.');let last;for(let attempt=0;attempt<3;attempt++){try{return await hubCall(fn,{p_token:DB.account.token,...args})}catch(e){last=e;const m=String(e&&e.message||e);console.warn('[Challenge Arena RPC]',fn,'attempt',attempt+1,m);if(!/failed to fetch|network|timeout|502|503|504|temporar/i.test(m)||attempt===2)throw e;await new Promise(r=>setTimeout(r,350*Math.pow(2,attempt)));}}throw last;}
function courseAllowed(code){try{return typeof window.canAccessCourse==='function'&&window.canAccessCourse(String(code||'').trim())}catch(_){return false}}
function questions(){return (window.__BANK__||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length>1&&q.a!==undefined&&courseAllowed(q.c));}
function courses(){return [...new Set(questions().map(q=>String(q.c||'').trim()).filter(Boolean))].sort();}

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
function openLocalWifiBattle(){
  const launch=()=>{if(window.BabloWifiChallenge&&typeof window.BabloWifiChallenge.open==='function'){window.BabloWifiChallenge.open();return;}toast('Local Wi-Fi Battle could not start. Reopen Bablo Hub while connected once, then retry.');};
  if(window.BabloWifiChallenge){launch();return;}
  let script=document.querySelector('script[data-bablo-wifi]');
  if(script){script.addEventListener('load',launch,{once:true});script.addEventListener('error',()=>toast('Local Wi-Fi Battle asset is unavailable.'),{once:true});return;}
  script=document.createElement('script');script.src='./wifi-challenge.js';script.dataset.babloWifi='1';
  script.onload=launch;script.onerror=()=>toast('Local Wi-Fi Battle asset is unavailable. Open Bablo Hub online once, then retry.');
  document.head.append(script);
}
function dashboard(){
  clearInterval(CA.timer);CA.timer=null;
  clearInterval(CA.heartbeatTimer);CA.heartbeatTimer=null;
  CA.tab='overview';
  const nav=['Discover','My Challenges','Champions League'].map((t)=>h('button',{class:'secondary',onclick:()=>tab(t)},t));
  const content=h('div',{class:'challenge-home'});
  const actions=h('div',{class:'cd-actions'});
  actions.append(
    h('button',{onclick:quickPlay},'⚡ Quick Play · Auto match'),
    h('button',{class:'secondary',onclick:()=>createPanel('quick_duel')},'＋ Create a challenge'),
    h('button',{class:'secondary',onclick:joinPrompt},'↗ Join by link or code'),
    h('button',{class:'secondary',onclick:()=>tab('Discover')},'🌐 Browse public rooms'),
    h('button',{class:'secondary',onclick:openLocalWifiBattle},'📶 Local Wi-Fi Battle · No data')
  );
  const rooms=h('section',{class:'cd-panel'});
  rooms.append(h('h3',null,'Your active challenges'),h('div',{id:'cd-inbox',class:'cd-list'},'Loading your challenges…'));
  content.append(
    hero(),
    h('p',{class:'muted'},'Challenge classmates with questions from your courses. You can invite someone privately or open a room for other students.'),
    h('section',{class:'cd-panel'},h('h3',null,'How challenges work'),
      h('div',{class:'cd-row'},h('div',null,h('b',null,'1. Create'),h('div',{class:'muted'},'Quick Play picks a suitable course and game mode automatically. Hosts can still configure a custom challenge.'))),
      h('div',{class:'cd-row'},h('div',null,h('b',null,'2. Invite'),h('div',{class:'muted'},'Share the room link or 6-character code with your opponent. Public rooms can also be found in Discover.'))),
      h('div',{class:'cd-row'},h('div',null,h('b',null,'3. Play'),h('div',{class:'muted'},'Everyone joins the lobby, presses Ready, then answers the same questions. Results appear when the match is complete.')))
    ),
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
      panel.append(...(rows.length?rows.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Student'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions'),h('div',{class:'muted'},(QUICK_MODE_LABELS[m.mode]||m.mode)+' · '+(m.player_count||0)+'/'+(m.max_players||2)+' players · '+Math.round((m.duration_seconds||300)/60)+' min')),h('button',{onclick:()=>accept(m.id)},'Join'))):[h('p',{class:'muted'},'No open public challenges right now. Create one and invite others.')] ));
      frame(h('div',null,shell(),panel));return;
    }
    if(name==='My Challenges'){
      const x=await call('hub_challenge_inbox',{});
      const rows=x.challenges||[];
      const panel=h('section',{class:'cd-panel'},h('h2',null,'My challenges'));
      panel.append(...(rows.length?rows.map(m=>h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+m.status),h('div',{class:'muted'},'Code: '+(m.invite_code||'—'))),m.status==='waiting'&&m.created_by!==((DB&&DB.account&&(DB.account.unique_id||DB.account.uid))||'')?h('button',{onclick:()=>accept(m.id)},'Accept'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open lobby'))):[h('p',{class:'muted'},'Your challenge history will appear here.')] ));
      frame(h('div',null,shell(),panel));return;
    }
    if(name==='Champions League'){
      const x=await call('hub_challenge_leaderboard',{p_period:'overall'});
      const panel=h('section',{class:'cd-panel'},h('h2',null,'Champions League'),h('p',{class:'muted'},'Verified completed matches · students who opted into the leaderboard.'));
      panel.append(...((x.entries||[]).length?(x.entries||[]).map(p=>h('div',{class:'cd-row'},h('div',null,h('b',null,'#'+p.rank+' '+(p.nickname||p.username)),h('div',{class:'muted'},(p.programme||'')+' · '+p.matches+' matches · '+p.accuracy+'% accuracy')),h('strong',null,p.points+' pts'))):[h('p',{class:'muted'},'No verified leaderboard entries yet. Complete a match and opt in to appear.')] ));
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
        h('label',null,'Players (public room)'),h('select',{id:'cd-max-players'},...[2,3,4,5,6,7,8].map(n=>h('option',{value:n,selected:n===2},n+' players'))),
        h('small',{class:'muted'},'Public rooms support up to 8 players. A private username invitation is one-to-one.'),
        h('label',null,'Invite username (optional)'),h('input',{id:'cd-invite',placeholder:'Enter Bablo username'}),
        h('label',null,'Leaderboard'),h('select',{id:'cd-private'},h('option',{value:'false'},'Keep score private'),h('option',{value:'true'},'Include in Champions League')),h('small',{class:'muted'},'Without an invite username, your room appears in Discover for other students. Your leaderboard preference does not affect room visibility.'))),
    h('div',{class:'cd-quick'},h('button',{id:'cd-create-button',onclick:create},'Create room'),h('button',{class:'secondary',onclick:dashboard},'Cancel')))));
  if(typeof mode==='string')$('#cd-mode').value=mode;
  $('#cd-courses').addEventListener('change',refreshChallengeTopics);
  const invite=$('#cd-invite'),capacity=$('#cd-max-players');
  const syncCapacity=()=>{if(invite.value.trim()){capacity.value='2';capacity.disabled=true}else capacity.disabled=false};
  invite.addEventListener('input',syncCapacity);syncCapacity();
  refreshChallengeTopics();
}
async function create(){
  const button=$('#cd-create-button');
  try{
    const cs=[...$('#cd-courses').selectedOptions].map(o=>o.value);
    const topics=[...$('#cd-topics').selectedOptions].map(o=>o.value);
    const n=+$('#cd-count').value;
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
    const x=await call('hub_challenge_create',{p_mode:$('#cd-mode').value,p_courses:cs,p_topics:topics,p_question_count:n,p_duration_seconds:+$('#cd-duration').value,p_question_set:qs,p_invited_username:$('#cd-invite').value.trim()||null,p_leaderboard_opt_in:$('#cd-private').value==='true',p_max_players:+$('#cd-max-players').value});
    CA.match=x.id||x.match_id;CA.opted=$('#cd-private').value==='true';CA.ready=false;room(CA.match,x.invite_code,x);watchLobby();
  }catch(e){toast(e.message);if(button)button.disabled=false;}
}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else alert(msg)}
function challengeInviteUrl(code){
  const url=new URL(location.href);
  url.hash='/challenge?code='+encodeURIComponent(String(code||'').trim().replace(/[\\s-]/g,''));
  return url.toString();
}
async function copyChallengeCode(code){
  const value=String(code||'').trim();
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(value);toast('Room code copied. Share it with your opponent.');return;}
    const box=document.createElement('textarea');box.value=value;box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();
    const copied=document.execCommand('copy');box.remove();
    if(copied){toast('Room code copied. Share it with your opponent.');return;}
    prompt('Copy this Bablo Hub room code:',value);
  }catch(e){try{prompt('Copy this Bablo Hub room code:',value)}catch(_){toast('Room code: '+value)}}
}
async function shareChallenge(code){
  const link=challengeInviteUrl(code);
  const text='Join my Bablo Hub Challenge Arena match. Open this link to enter the room: '+link+'  Room code: '+code;
  try{
    if(navigator.share){await navigator.share({title:'Bablo Hub challenge invitation',text,url:link});return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(link);toast('Challenge link copied. Send it to your opponent.');return;}
    const box=document.createElement('textarea');box.value=link;box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();
    const copied=document.execCommand('copy');box.remove();
    if(copied){toast('Challenge link copied. Send it to your opponent.');return;}
    prompt('Copy this Bablo Hub invitation link:',link);
  }catch(e){
    if(e&&e.name==='AbortError')return;
    try{prompt('Copy this Bablo Hub invitation link:',link)}catch(_){toast('Could not share automatically. Room code: '+code)}
  }
}
async function copyChallengeLink(code){
  const link=challengeInviteUrl(code);
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(link);toast('Bablo Hub invite link copied. Send it to your opponent.');return;}
    const box=document.createElement('textarea');box.value=link;box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();
    const copied=document.execCommand('copy');box.remove();
    if(copied){toast('Bablo Hub invite link copied. Send it to your opponent.');return;}
    prompt('Copy this Bablo Hub invitation link:',link);
  }catch(e){try{prompt('Copy this Bablo Hub invitation link:',link)}catch(_){toast('Could not copy the link. Room code: '+code)}}
}
async function joinByCode(rawCode){
  const code=String(rawCode||'').trim().replace(/[\\s-]/g,'').toUpperCase();
  if(!code){toast('Enter the challenge room code first.');return;}
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Joining your challenge'),h('p',{class:'muted'},'Connecting to room '+code+'…'))));
  try{
    const x=await call('hub_challenge_join_code',{p_code:code});
    open(x.id||x.match_id);
  }catch(e){dashboard();toast(e.message||'That challenge link or code could not be opened. Check it and try again.')}
}
function joinPrompt(){
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},
    h('h2',null,'Join a challenge'),
    h('p',{class:'muted'},'Have a Bablo Hub invitation link? Open it and the room will load automatically. If you were sent a code, enter it below.'),
    h('label',null,'Challenge room code'),
    h('input',{id:'cd-join-code',placeholder:'Enter the code your friend shared',autocomplete:'one-time-code',autocapitalize:'characters',maxlength:12}),
    h('div',{class:'cd-quick'},
      h('button',{onclick:()=>joinByCode($('#cd-join-code').value)},'Join challenge'),
      h('button',{class:'secondary',onclick:dashboard},'Back to Arena')
    )
  )));
  const input=$('#cd-join-code');if(input)input.focus();
}

const QUICK_MODE_LABELS={quick_duel:'First to Answer',multi_course:'Mixed Challenge',course_clash:'Timed Test',topic_battle:'Topic Master',survival:'Survival',marathon:'Best of Several Rounds'};
function quickModeFor(pool,selectedCourses){
  const topicCounts=new Map();
  pool.forEach(q=>{const t=String(q.u||q.topic||'').trim();if(t)topicCounts.set(t,(topicCounts.get(t)||0)+1)});
  const eligible=['quick_duel','course_clash','survival'];
  if(selectedCourses.length>1)eligible.push('multi_course');
  if([...topicCounts.values()].some(n=>n>=5))eligible.push('topic_battle');
  if(pool.length>=15)eligible.push('marathon');
  let last='';try{last=localStorage.getItem('bablo_challenge_auto_mode')||''}catch(_){}
  const start=eligible.indexOf(last);
  const next=eligible[start<0?0:(start+1)%eligible.length];
  try{localStorage.setItem('bablo_challenge_auto_mode',next)}catch(_){}
  return next;
}
function challengeQuestionPayload(pool,count){
  return [...pool].sort(()=>Math.random()-.5).slice(0,count).map(q=>{
    const choices=q.o.map(String),raw=q.a;
    let answer=typeof raw==='number'?raw:(/^[A-D]$/i.test(String(raw))?String(raw).toUpperCase().charCodeAt(0)-65:choices.findIndex(v=>v.trim()===String(raw).trim()));
    if(answer<0)answer=Number.parseInt(raw,10);
    if(!Number.isInteger(answer)||answer<0||answer>=choices.length)throw Error('A selected question has an unrecognised answer key. Please report this question.');
    return {prompt:cleanText(q.q),choices:choices.map(cleanText),answer_key:String(answer),course:cleanText(q.c),topic:cleanText(q.u||q.topic||''),explanation:cleanText(q.explanation||q.e||'')};
  });
}
async function quickPlay(){
  if(CA.quickBusy)return;
  CA.quickBusy=true;
  frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Finding your match…'),h('p',{class:'muted'},'Checking open rooms and choosing a suitable challenge for you.'))));
  try{
    const bank=questions(),availableCourses=courses().filter(course=>bank.filter(q=>String(q.c||'').trim()===course).length>=5);
    if(!availableCourses.length)throw Error('There are not enough usable questions in your course bank to start Quick Play yet.');
    const found=await call('hub_challenge_discover',{});
    const availableSet=new Set(availableCourses);
    const compatible=(found.challenges||[]).filter(room=>(room.courses||[]).some(course=>availableSet.has(String(course)))&&Number(room.question_count||0)>=5&&Number(room.player_count||0)<Number(room.max_players||2));
    for(const candidate of compatible){
      try{
        await call('hub_challenge_accept',{p_match_id:candidate.id});
        toast('Found an open room. Joining now…');
        await open(candidate.id);
        return;
      }catch(joinError){
        if(/room is full|no longer accepting|not accepting players/i.test(String(joinError.message||joinError)))continue;
        throw joinError;
      }
    }
    let selectedCourses=[availableCourses[Math.floor(Math.random()*availableCourses.length)]];
    let pool=bank.filter(q=>selectedCourses.includes(String(q.c||'').trim()));
    if(availableCourses.length>1&&Math.random()<0.35){
      const second=availableCourses.find(c=>!selectedCourses.includes(c));
      if(second){selectedCourses.push(second);pool=bank.filter(q=>selectedCourses.includes(String(q.c||'').trim()))}
    }
    let mode=quickModeFor(pool,selectedCourses);
    let topics=[];
    if(mode==='topic_battle'){
      const counts=new Map();
      pool.forEach(q=>{const t=String(q.u||q.topic||'').trim();if(t)counts.set(t,(counts.get(t)||0)+1)});
      const topic=[...counts.entries()].filter(([,n])=>n>=5).sort((a,b)=>b[1]-a[1])[0]?.[0];
      if(topic){topics=[topic];pool=pool.filter(q=>String(q.u||q.topic||'').trim()===topic)}
      else mode='quick_duel';
    }
    const count=pool.length>=10?10:5;
    if(pool.length<count)throw Error('Not enough questions are available for a Quick Play match.');
    const payload=challengeQuestionPayload(pool,count);
    toast('Bablo picked '+QUICK_MODE_LABELS[mode]+'. Setting up your room…');
    const x=await call('hub_challenge_create',{p_mode:mode,p_courses:selectedCourses,p_topics:topics,p_question_count:count,p_duration_seconds:300,p_question_set:payload,p_invited_username:null,p_leaderboard_opt_in:false,p_max_players:4});
    CA.match=x.id||x.match_id;CA.opted=false;CA.ready=false;
    room(CA.match,x.invite_code,{...x,mode,question_count:count,courses:selectedCourses});
    watchLobby();
  }catch(e){dashboard();toast(e.message||'Quick Play could not find a match. Please try again.')}
  finally{CA.quickBusy=false}
}
async function quick(){createPanel('quick_duel')}
async function accept(id){try{await call('hub_challenge_accept',{p_match_id:id});open(id)}catch(e){toast(e.message)}}
async function open(id){try{clearInterval(CA.timer);CA.match=id;let x=await call('hub_challenge_get_questions',{p_match_id:id});CA.qs=x.questions||[];CA.answers=x.my_answers||{};CA.idx=nextUnanswered(0);if(x.status==='completed'){const review=await call('hub_challenge_review',{p_match_id:id});showReview(review);return;}room(id,x.invite_code,x);if(x.status==='active')startMatch(x);else watchLobby()}catch(e){console.warn('[Challenge Arena resume]',e);toast(e.message)}}
function nextUnanswered(from){for(let i=Math.max(0,from);i<CA.qs.length;i++)if(!Object.prototype.hasOwnProperty.call(CA.answers||{},String(i)))return i;return CA.qs.length;}
function room(id,code,x={}){let status=x.status||'waiting';CA.ready=x.my_status==='ready';frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Challenge lobby'),h('p',null,'Room code: '+(code||'Open inbox for code')),h('button',{class:'secondary',onclick:()=>copyChallengeCode(code),disabled:!code},'Copy room code'),h('p',{class:'muted'},'Send your opponent the link below. Opening it takes them straight back to Bablo Hub and into this room.'),h('p',{class:'muted',style:'overflow-wrap:anywhere'},code?'Bablo Hub invite: '+challengeInviteUrl(code):'Invite link is being prepared…'),h('button',{onclick:()=>shareChallenge(code),disabled:!code},'↗ Share challenge link'),h('button',{class:'secondary',onclick:()=>copyChallengeLink(code),disabled:!code},'Copy invite link'),h('p',{class:'muted'},(x.question_count||CA.qs.length)+' questions · '+Math.round((x.duration_seconds||300)/60)+' minutes · '+(x.max_players||2)+' player slots'+(x.mode?' · '+(QUICK_MODE_LABELS[x.mode]||x.mode):'')),h('p',{id:'cd-lobby-status'},status==='active'?'Starting match…':'Players can ready up as they join.'),h('div',{id:'cd-player-list',class:'stack'},(x.players||[]).map(p=>h('p',{class:'small muted'},'@'+(p.username||'student')+' · '+p.status))),h('p',null,'Everyone in the room should press Ready. The host can start once all joined players are ready; a full room starts automatically.'),h('button',{id:'cd-ready',onclick:ready,disabled:status==='active'||CA.ready},CA.ready?'Ready ✓':status==='active'?'Starting…':'I’m ready'),h('button',{id:'cd-start-now',class:'secondary',onclick:startNow,hidden:true},'Start with ready players'),h('button',{class:'secondary',onclick:dashboard},'Back to Arena'))))}
async function ready(){try{let b=$('#cd-ready');if(b)b.disabled=true;let x=await call('hub_challenge_ready',{p_match_id:CA.match});CA.ready=true;if(x.status==='active'){let detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{if(b)b.textContent='Ready ✓';let st=$('#cd-lobby-status');if(st)st.textContent='You’re ready ('+(x.ready_count||1)+'/'+(x.player_count||2)+'). Waiting for the others…';watchLobby()}}catch(e){let b=$('#cd-ready');if(b)b.disabled=false;toast(e.message)}}
function watchLobby(){clearInterval(CA.timer);clearInterval(CA.heartbeatTimer);CA.heartbeatTimer=setInterval(()=>{if(CA.match)call('hub_challenge_heartbeat',{p_match_id:CA.match}).catch(e=>console.warn('[Challenge Arena heartbeat]',e))},15000);CA.timer=setInterval(async()=>{try{let x=await call('hub_challenge_get_questions',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);clearInterval(CA.heartbeatTimer);CA.heartbeatTimer=null;CA.qs=x.questions||CA.qs;startMatch(x);return}let st=$('#cd-lobby-status'),b=$('#cd-ready'),list=$('#cd-player-list'),start=$('#cd-start-now');if(st)st.textContent='Players ready: '+(x.ready_count||0)+' / '+(x.player_count||0)+' · Joined: '+(x.player_count||0)+' / '+(x.max_players||2);if(list)list.replaceChildren(...(x.players||[]).map(p=>h('p',{class:'small muted'},'@'+(p.username||'student')+' · '+p.status)));if(b){b.disabled=CA.ready||x.my_status==='ready';if(!CA.ready&&x.my_status!=='ready'){b.textContent='I’m ready';if(x.status==='waiting'||x.status==='ready')b.disabled=false}else b.textContent='Ready ✓'}if(start){const full=(x.player_count||0)>=(x.max_players||2);const everyoneReady=(x.player_count||0)>=2&&(x.ready_count||0)===(x.player_count||0);const canStart=!!x.is_host&&everyoneReady;start.hidden=!canStart;start.style.display=canStart?'':'none';if(full&&everyoneReady&&x.is_host&&!CA.autoStarting){CA.autoStarting=true;startNow().finally(()=>{CA.autoStarting=false})}}}catch(e){let st=$('#cd-lobby-status');if(st)st.textContent=/failed to fetch|network|timeout|502|503|504|temporar/i.test(String(e.message||e))?'Connection interrupted — reconnecting automatically…':e.message}},2000)}
async function startNow(){try{const b=$('#cd-start-now');if(b)b.disabled=true;const x=await call('hub_challenge_start_now',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);const detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{toast('Waiting for every joined player to press Ready.');if(b)b.disabled=false}}catch(e){const b=$('#cd-start-now');if(b)b.disabled=false;toast(e.message)}}
function startMatch(x){clearInterval(CA.timer);clearInterval(CA.heartbeatTimer);CA.heartbeatTimer=null;CA.qs=x.questions||CA.qs;CA.answers=x.my_answers||CA.answers||{};CA.idx=nextUnanswered(0);let start=Date.parse(x.starts_at||new Date().toISOString());let duration=Number(x.duration_seconds)||300;CA.startAt=start;CA.end=start+duration*1000;let wait=Math.max(0,start-Date.now());if(wait){frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Match starting'),h('p',{class:'muted'},'Both players are ready. Your shared timer begins in a moment.'),h('strong',{id:'cd-start-count'},Math.ceil(wait/1000)+' seconds'))));CA.timer=setInterval(()=>{let left=Math.max(0,CA.startAt-Date.now()),el=$('#cd-start-count');if(el)el.textContent=Math.ceil(left/1000)+' seconds';if(!left){clearInterval(CA.timer);play()}},200)}else play()}
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
window.challengeDashboardView=function(){try{
  clearInterval(CA.timer);
  const raw=String(location.hash||'').split('?')[1]||'';
  let incomingCode=new URLSearchParams(raw).get('code');
  try{incomingCode=incomingCode||sessionStorage.getItem('bablo_pending_challenge_code');sessionStorage.removeItem('bablo_pending_challenge_code')}catch(_){}
  if(incomingCode){
    history.replaceState(null,'',location.pathname+location.search+'#/challenge');
    joinByCode(incomingCode);
  }else dashboard();
}catch(e){console.error('[Challenge Arena render]',e);try{mount(wrap(h('main',{id:'challenge-dashboard',class:'panel stack'},h('h2',null,'Challenge Arena could not load'),h('p',{class:'muted'},String(e&&e.message||e)),h('button',{onclick:()=>location.hash='#/'},'Back home'))))}catch(renderError){console.error('[Challenge Arena fallback]',renderError)}}};
})();