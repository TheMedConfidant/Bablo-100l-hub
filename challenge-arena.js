(function(){
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CA={match:null,qs:[],idx:0,done:false,end:0,timer:null,tab:'overview',inbox:[],opted:false,ready:false,finishing:false};
function frame(node){style();const root=h('div',{id:'challenge-dashboard',class:'challenge-arena-root'},node);mount(wrap(root));}
async function call(fn,args={}){if(!DB||!DB.account||!DB.account.token)throw Error('Log in to use Challenge Arena.');return await hubCall(fn,{p_token:DB.account.token,...args});}
function courses(){return [...new Set((window.__BANK__||[]).map(q=>String(q.c||'').trim()).filter(Boolean))].sort();}
function questions(){return (window.__BANK__||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length>1&&q.a!==undefined);}

function style(){if($('#cd-style'))return;let s=document.createElement('style');s.id='cd-style';s.textContent=`
#challenge-dashboard{width:100%;max-width:1120px;margin:0 auto;padding:18px 0 70px;background:#000!important;color:#fff!important;--cd-bg:#000;--cd-fg:#fff;--cd-border:#555}
#challenge-dashboard,#challenge-dashboard *{box-sizing:border-box}
#challenge-dashboard .cd-hero{min-height:180px;border-radius:20px;padding:24px;background:#000!important;border:1px solid #555;color:#fff!important;display:flex;flex-direction:column;justify-content:center}
#challenge-dashboard .cd-hero *{color:#fff!important}
#challenge-dashboard .cd-kicker{font-size:.7rem;letter-spacing:.15em;color:#e4c36e!important;font-weight:900}
#challenge-dashboard .cd-panel,#challenge-dashboard .cd-stat,#challenge-dashboard .cd-row,#challenge-dashboard article{background:#000!important;color:#fff!important;border:1px solid #555!important;border-radius:14px;padding:14px}
#challenge-dashboard .cd-panel *:not(button),#challenge-dashboard .cd-stat * ,#challenge-dashboard .cd-row *{color:#fff!important}
#challenge-dashboard .cd-panel .muted,#challenge-dashboard .cd-panel small,#challenge-dashboard .muted{color:#fff!important;opacity:1!important}
#challenge-dashboard .cd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}
#challenge-dashboard .cd-stat b{display:block;font-size:1.5rem;color:#e4c36e!important}
#challenge-dashboard .cd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}
#challenge-dashboard .cd-modegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}
#challenge-dashboard .cd-tabs{display:flex;gap:7px;overflow:auto;margin:16px 0}
#challenge-dashboard .cd-grid{display:grid;grid-template-columns:1.4fr .8fr;gap:12px}
#challenge-dashboard .cd-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:8px 0}
#challenge-dashboard label{display:block;font-weight:800;margin:12px 0 6px;color:#fff!important}
#challenge-dashboard input,#challenge-dashboard select,#challenge-dashboard textarea{width:100%;padding:12px;border:1px solid #888!important;border-radius:10px;background:#000!important;color:#fff!important;caret-color:#fff}
#challenge-dashboard select option{background:#000!important;color:#fff!important}
#challenge-dashboard input::placeholder,#challenge-dashboard textarea::placeholder{color:#ddd!important;opacity:1!important}
#challenge-dashboard .cd-choice{display:block;width:100%;text-align:left;margin:8px 0;background:#000!important;color:#fff!important;border:1px solid #888!important}
#challenge-dashboard button{border:1px solid #e4c36e;border-radius:12px;padding:12px;background:#e4c36e!important;color:#000!important;font-weight:900;cursor:pointer}
#challenge-dashboard button.secondary,#challenge-dashboard .cd-tabs button{background:#000!important;color:#fff!important;border:1px solid #888!important}
#challenge-dashboard .cd-tabs button.active{background:#000!important;color:#fff!important;border:2px solid #e4c36e!important}
#challenge-dashboard button:disabled{opacity:.65!important;color:#ddd!important;cursor:not-allowed}
#challenge-dashboard button:focus-visible,#challenge-dashboard input:focus-visible,#challenge-dashboard select:focus-visible{outline:3px solid #e4c36e!important;outline-offset:2px}
@media(max-width:700px){#challenge-dashboard .cd-stats{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-actions{grid-template-columns:1fr 1fr}#challenge-dashboard .cd-modegrid{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-grid{grid-template-columns:1fr}}
@media(max-width:420px){#challenge-dashboard .cd-modegrid{grid-template-columns:1fr}}
`;document.head.append(s);}
function hero(){return h('section',{class:'cd-hero'},h('div',{class:'cd-kicker'},'BABLO HUB  /  ACADEMIC COMPETITION'),h('h1',null,'Challenge Arena'),h('p',null,'Compete across courses. Earn points. Climb the Champions League.'),h('div',{class:'cd-quick'},h('span',null,'⚡ Live academic battles'),h('span',null,' • '),h('span',null,'🏆 Verified results')))}
function stat(n,t){return h('div',{class:'cd-stat'},h('b',null,n),h('span',{class:'muted'},t))}
function dashboard(){
  CA.tab='overview';
  const nav=['Discover','My Challenges','Champions League'].map((t)=>h('button',{class:'secondary',onclick:()=>tab(t)},t));
  const content=h('div',{class:'challenge-home'});
  const actions=h('div',{class:'cd-actions'});
  actions.append(
    h('button',{onclick:()=>createPanel('quick_duel')},'＋ Create challenge'),
    h('button',{class:'secondary',onclick:joinPrompt},'↗ Join with code'),
    h('button',{class:'secondary',onclick:()=>tab('Discover')},'🌐 Find open challenges')
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
        h('label',null,'Invite username (optional)'),h('input',{id:'cd-invite',placeholder:'Enter Bablo username'}),
        h('label',null,'Leaderboard'),h('select',{id:'cd-private'},h('option',{value:'false'},'Keep score private'),h('option',{value:'true'},'Include in Champions League')),h('small',{class:'muted'},'Without an invite username, your room appears in Discover for other students.'))),
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
    if(!cs.length)throw Error('Select at least one course.');
    const pool=questions().filter(q=>cs.includes(String(q.c||'').trim())&&(!topics.length||topics.includes(String(q.u||q.topic||'').trim())));
    if(pool.length<n)throw Error('Only '+pool.length+' usable questions match those selections. Select more topics or reduce the question count.');
    const shuffled=[...pool].sort(()=>Math.random()-.5);
    const qs=shuffled.slice(0,n).map(q=>{
      const choices=q.o.map(String),raw=q.a;
      let answer=typeof raw==='number'?raw:(/^[A-D]$/i.test(String(raw))?String(raw).toUpperCase().charCodeAt(0)-65:choices.findIndex(v=>v.trim()===String(raw).trim()));
      if(answer<0)answer=Number.parseInt(raw,10);
      if(!Number.isInteger(answer)||answer<0||answer>=choices.length)throw Error('A selected question has an unrecognised answer key. Please report this question.');
      return {prompt:String(q.q),choices,answer_key:String(answer),course:q.c,topic:q.u||q.topic||'',explanation:q.explanation||q.e||''};
    });
    button.disabled=true;
    const x=await call('hub_challenge_create',{p_mode:$('#cd-mode').value,p_courses:cs,p_topics:topics,p_question_count:n,p_duration_seconds:+$('#cd-duration').value,p_question_set:qs,p_invited_username:$('#cd-invite').value.trim()||null,p_leaderboard_opt_in:$('#cd-private').value==='true'});
    CA.match=x.id||x.match_id;CA.opted=$('#cd-private').value==='true';CA.ready=false;room(CA.match,x.invite_code,x);watchLobby();
  }catch(e){toast(e.message);if(button)button.disabled=false;}
}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else alert(msg)}
function joinPrompt(){let code=prompt('Enter challenge room code');if(!code)return;call('hub_challenge_join_code',{p_code:code.trim()}).then(x=>open(x.id||x.match_id)).catch(e=>toast(e.message))}
async function quick(){createPanel('quick_duel')}
async function accept(id){try{await call('hub_challenge_accept',{p_match_id:id});open(id)}catch(e){toast(e.message)}}
async function open(id){try{clearInterval(CA.timer);CA.match=id;let x=await call('hub_challenge_get_questions',{p_match_id:id});CA.qs=x.questions||[];CA.idx=0;room(id,x.invite_code,x);if(x.status==='active')startMatch(x);else watchLobby()}catch(e){toast(e.message)}}
function room(id,code,x={}){let status=x.status||'waiting';frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Challenge lobby'),h('p',null,'Room code: '+(code||'Open inbox for code')),h('p',{class:'muted'},(x.question_count||CA.qs.length)+' questions · '+Math.round((x.duration_seconds||300)/60)+' minutes'),h('p',{id:'cd-lobby-status'},status==='ready'?'Opponent joined. Both players must press Ready.':status==='active'?'Starting match…':'Waiting for an opponent to join.'),h('p',null,'Share this code with your opponent.'),h('button',{id:'cd-ready',onclick:ready,disabled:status!=='ready'&&status!=='active'},status==='active'?'Starting…':status==='waiting'?'Waiting for opponent…':'I’m ready'),h('button',{class:'secondary',onclick:dashboard},'Back to Arena'))))}
async function ready(){try{let b=$('#cd-ready');if(b)b.disabled=true;let x=await call('hub_challenge_ready',{p_match_id:CA.match});CA.ready=true;if(x.status==='active'){let detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{let s=$('#cd-lobby-status');if(s)s.textContent='You’re ready. Waiting for your opponent to get ready…';if(b)b.textContent='Ready ✓';watchLobby()}}catch(e){let b=$('#cd-ready');if(b)b.disabled=false;toast(e.message)}}
function watchLobby(){clearInterval(CA.timer);CA.timer=setInterval(async()=>{try{let x=await call('hub_challenge_get_questions',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;startMatch(x);return}let s=$('#cd-lobby-status'),b=$('#cd-ready');if(s)s.textContent=x.status==='ready'?(CA.ready?'You’re ready. Waiting for your opponent…':'Opponent joined. Both players must press Ready.'):'Waiting for an opponent to join.';if(b&&x.status==='ready'&&!CA.ready){b.disabled=false;b.textContent='I’m ready'}}catch(e){let s=$('#cd-lobby-status');if(s)s.textContent=e.message}},2000)}
function startMatch(x){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;CA.idx=0;let start=Date.parse(x.starts_at||new Date().toISOString());let duration=Number(x.duration_seconds)||300;CA.startAt=start;CA.end=start+duration*1000;let wait=Math.max(0,start-Date.now());if(wait){frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Match starting'),h('p',{class:'muted'},'Both players are ready. Your shared timer begins in a moment.'),h('strong',{id:'cd-start-count'},Math.ceil(wait/1000)+' seconds'))));CA.timer=setInterval(()=>{let left=Math.max(0,CA.startAt-Date.now()),el=$('#cd-start-count');if(el)el.textContent=Math.ceil(left/1000)+' seconds';if(!left){clearInterval(CA.timer);play()}},200)}else play()}
function play(){let q=CA.qs[CA.idx];if(!q){finish();return}CA.done=false;CA.started=Date.now();frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('div',{class:'cd-row'},h('b',null,'Question '+(CA.idx+1)+' / '+CA.qs.length),h('strong',{id:'cd-clock'},'')),h('p',{class:'muted'},(q.course||'')+' · '+(q.topic||'')),h('div',{class:'cd-q'},q.prompt),h('div',{id:'cd-options'},...q.choices.map((c,i)=>h('button',{class:'cd-choice',onclick:()=>answer(i)},String.fromCharCode(65+i)+'. '+c))),h('div',{id:'cd-feedback'}),h('div',{class:'cd-quick'},h('button',{class:'secondary',onclick:react},'🔥'),h('button',{id:'cd-next',disabled:true,onclick:()=>{CA.idx++;play()}},'Next question')),h('div',{id:'cd-score',class:'muted'}))));tick();clearInterval(CA.timer);CA.timer=setInterval(tick,500);feed()}
function tick(){let el=$('#cd-clock');if(!el)return;let left=Math.max(0,CA.end-Date.now());el.textContent=Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0');if(!left)finish()}
async function answer(i){if(CA.done)return;CA.done=true;let bs=[...$('#cd-options').querySelectorAll('button')];bs.forEach(b=>b.disabled=true);try{let x=await call('hub_challenge_submit_answer',{p_match_id:CA.match,p_question_index:CA.idx,p_answer_key:String(i),p_response_ms:Math.max(0,Date.now()-(CA.started||Date.now()))});$('#cd-feedback').textContent=x.correct?'Correct — point earned.':'Answer submitted — not correct.';$('#cd-next').disabled=false;feed()}catch(e){CA.done=false;bs.forEach(b=>b.disabled=false);toast(e.message)}}
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
    card.append(h('b',null,'Question '+(i+1)),h('p',null,q.prompt));
    choices.forEach((choice,j)=>card.append(h('div',{class:'cd-row',style:j===answer?'border-color:#c59d45;background:rgba(197,157,69,.12)':''},
      h('span',null,String.fromCharCode(65+j)+'. '+choice),
      j===answer?h('strong',null,'Correct answer'):null)));
    if(q.explanation)card.append(h('p',{class:'muted'},'Explanation: '+q.explanation));
    if((q.responses||[]).length)card.append(h('div',{class:'muted'},'Responses: '+q.responses.map(r=>r.username+': '+(r.is_correct?'correct':'incorrect')+' ('+String.fromCharCode(65+(Number(r.answer_key)||0))+')').join(' · ')));
    panel.append(card);
  });
  panel.append(h('button',{onclick:dashboard},'Return to Arena'));
  frame(h('div',null,hero(),panel));
}
window.challengeDashboardView=function(){try{clearInterval(CA.timer);dashboard()}catch(e){console.error('[Challenge Arena render]',e);try{mount(wrap(h('main',{id:'challenge-dashboard',class:'panel stack'},h('h2',null,'Challenge Arena could not load'),h('p',{class:'muted'},String(e&&e.message||e)),h('button',{onclick:()=>location.hash='#/'},'Back home'))))}catch(renderError){console.error('[Challenge Arena fallback]',renderError)}}};
})();