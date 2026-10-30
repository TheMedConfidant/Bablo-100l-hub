(function(){
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CA={match:null,qs:[],idx:0,done:false,end:0,timer:null,tab:'overview',inbox:[],leaderboard:false};
function frame(node){style();mount(wrap(node));}
async function call(fn,args={}){if(!DB||!DB.account||!DB.account.token)throw Error('Log in to use Challenge Arena.');return await hubCall(fn,{p_token:DB.account.token,...args});}
function courses(){return [...new Set((window.__BANK__||[]).map(q=>String(q.c||'').trim()).filter(Boolean))].sort();}
function answerIndex(q){const opts=(q.o||[]).map(v=>String(v).trim()),raw=String(q.a??'').trim();if(!raw)return -1;let i=opts.findIndex(v=>v.toLowerCase()===raw.toLowerCase());if(i>=0)return i;const m=raw.match(/^([A-J])(?:[.)]|$)/i);if(m){i=m[1].toUpperCase().charCodeAt(0)-65;if(i>=0&&i<opts.length)return i;}i=opts.findIndex(v=>v.replace(/^[A-J][.)]\s*/i,'').trim().toLowerCase()===raw.toLowerCase());if(i>=0)return i;if(/^\d+$/.test(raw)){const n=Number(raw);if(n>=0&&n<opts.length)return n;if(n>=1&&n<=opts.length)return n-1;}return -1;}
function questions(){return (window.__BANK__||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length>1&&answerIndex(q)>=0);}

function style(){if($('#cd-style'))return;let s=document.createElement('style');s.id='cd-style';s.textContent='#challenge-dashboard{width:100%;max-width:1120px;margin:0 auto;padding:18px 0 70px;color:var(--ink)}#challenge-dashboard *{box-sizing:border-box}#challenge-dashboard .cd-hero{min-height:220px;border-radius:24px;padding:28px;background:linear-gradient(125deg,#101c2d,#273c51);color:#fff;display:flex;flex-direction:column;justify-content:center}#challenge-dashboard .cd-hero p{color:#d4deea;max-width:560px}#challenge-dashboard .cd-kicker{font-size:.7rem;letter-spacing:.15em;color:#e7c66e;font-weight:900}#challenge-dashboard .cd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard .cd-stat,#challenge-dashboard .cd-panel{background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:16px}#challenge-dashboard .cd-stat b{display:block;font-size:1.5rem;color:#c39b43}#challenge-dashboard .cd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard button{border:0;border-radius:12px;padding:12px;background:linear-gradient(135deg,#e4c36e,#c59d45);color:#17202b;font-weight:800;cursor:pointer}#challenge-dashboard button.secondary{background:var(--surface,#fff);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-modegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}#challenge-dashboard .cd-modecard{min-height:130px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:8px;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-tabs{display:flex;gap:7px;overflow:auto;margin:16px 0}#challenge-dashboard .cd-tabs button{white-space:nowrap;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard .cd-grid{display:grid;grid-template-columns:1.4fr .8fr;gap:12px}#challenge-dashboard .cd-row{display:flex;justify-content:space-between;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px}#challenge-dashboard label{display:block;font-weight:700;margin:12px 0 6px}#challenge-dashboard input,#challenge-dashboard select{width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}#challenge-dashboard .cd-choice{display:block;width:100%;text-align:left;margin:8px 0;background:var(--surface);color:var(--ink);border:1px solid var(--line)}#challenge-dashboard button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:700px){#challenge-dashboard .cd-stats{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-actions{grid-template-columns:1fr 1fr}#challenge-dashboard .cd-modegrid{grid-template-columns:repeat(2,1fr)}#challenge-dashboard .cd-grid{grid-template-columns:1fr}}@media(max-width:420px){#challenge-dashboard .cd-modegrid{grid-template-columns:1fr}}';s.textContent += "\n#challenge-dashboard{color:#edf3fb!important}\n#challenge-dashboard .cd-panel,#challenge-dashboard .cd-stat{background:#14243a!important;color:#edf3fb!important;border-color:#34465f!important;box-shadow:0 10px 28px rgba(0,0,0,.2)}\n#challenge-dashboard .cd-panel h2,#challenge-dashboard .cd-panel h3,#challenge-dashboard .cd-panel b,#challenge-dashboard .cd-stat b{color:#f7f9fd}\n#challenge-dashboard .cd-panel p,#challenge-dashboard .cd-panel span,#challenge-dashboard .cd-stat span,#challenge-dashboard .muted{color:#bdcadd!important}\n#challenge-dashboard .cd-modecard,#challenge-dashboard .cd-tabs button,#challenge-dashboard button.secondary,#challenge-dashboard .cd-choice{background:#1b2e47!important;color:#f1f5fa!important;border:1px solid #40536e!important}\n#challenge-dashboard .cd-tabs button.active{background:#e4c36e!important;color:#1a2635!important;border-color:#e4c36e!important}\n#challenge-dashboard input,#challenge-dashboard select{background:#0d1a2b!important;color:#f7f9fd!important;border-color:#40536e!important}\n#challenge-dashboard .cd-row{background:#192b43;color:#f1f5fa;border-color:#40536e}\n#challenge-dashboard .cd-row .muted{color:#bdcadd!important}\n#challenge-dashboard .cd-status{display:inline-flex;padding:4px 9px;border-radius:99px;background:#253a55;color:#e4c36e;font-size:.75rem;font-weight:800}\n#challenge-dashboard .cd-delete{background:#472735!important;color:#ffd8df!important;border:1px solid #9d5064!important;padding:8px 11px}\n#challenge-dashboard .cd-empty{padding:16px;border:1px dashed #536782;border-radius:12px;color:#c5d1e0}\n";
s.textContent += `
/* Bablo Hub high-visibility standard: true black surfaces and crisp white text */
#challenge-dashboard{background:#000!important;color:#fff!important}
#challenge-dashboard .cd-panel,#challenge-dashboard .cd-stat,
#challenge-dashboard .cd-row,#challenge-dashboard .cd-empty{
  background:#080808!important;color:#fff!important;border-color:#444!important
}
#challenge-dashboard .cd-panel *,
#challenge-dashboard .cd-stat *,
#challenge-dashboard .cd-row *,
#challenge-dashboard .cd-empty{color:#fff!important}
#challenge-dashboard .cd-panel .muted,
#challenge-dashboard .cd-stat .muted,
#challenge-dashboard .cd-row .muted{color:#d6d6d6!important}
#challenge-dashboard .cd-modecard,
#challenge-dashboard .cd-tabs button,
#challenge-dashboard button.secondary,
#challenge-dashboard .cd-choice{
  background:#111!important;color:#fff!important;border:1px solid #666!important
}
#challenge-dashboard .cd-tabs button.active{
  background:#e4c36e!important;color:#000!important;border-color:#e4c36e!important
}
#challenge-dashboard input,#challenge-dashboard select,
#challenge-dashboard textarea{
  background:#000!important;color:#fff!important;border:1px solid #777!important
}
#challenge-dashboard input::placeholder{color:#cfcfcf!important;opacity:1}
#challenge-dashboard button:focus-visible,
#challenge-dashboard input:focus-visible,
#challenge-dashboard select:focus-visible{
  outline:3px solid #f2cf72!important;outline-offset:2px
}
#challenge-dashboard button:disabled{opacity:.78!important;color:#eee!important}
#challenge-dashboard .cd-delete{background:#3b1018!important;color:#fff!important;border-color:#ff879b!important}
`;

s.textContent += `#challenge-dashboard{width:min(100% - 24px,1120px)!important;margin:0 auto!important;padding:12px 0 56px!important;background:#000!important;color:#fff!important}
#challenge-dashboard .cd-hero{background:linear-gradient(125deg,#090909,#171717)!important;border:1px solid #5a4927!important;color:#fff!important}
#challenge-dashboard .cd-hero h1,#challenge-dashboard .cd-hero h2,#challenge-dashboard .cd-hero span{color:#fff!important}
#challenge-dashboard .cd-hero p{color:#eee!important}
#challenge-dashboard .cd-tabs{display:flex!important;flex-wrap:nowrap!important;gap:8px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:10px 2px 14px!important;margin:10px 0 18px!important;border-bottom:1px solid #3d3320!important;scrollbar-width:thin}
#challenge-dashboard .cd-tabs button{flex:0 0 auto!important;min-width:max-content!important;padding:11px 15px!important;background:#101010!important;color:#fff!important;border:1px solid #555!important;border-radius:11px!important}
#challenge-dashboard .cd-tabs button.active{background:#e4c36e!important;color:#090909!important;border-color:#e4c36e!important}
#challenge-dashboard .cd-actions{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin:14px 0 18px!important}
#challenge-dashboard .cd-actions button{flex:1 1 190px!important;min-height:46px}
#challenge-dashboard .cd-panel,#challenge-dashboard .cd-stat,#challenge-dashboard .cd-row{background:#090909!important;color:#fff!important;border:1px solid #454545!important}
#challenge-dashboard .cd-panel h1,#challenge-dashboard .cd-panel h2,#challenge-dashboard .cd-panel h3,#challenge-dashboard .cd-panel b,#challenge-dashboard .cd-panel strong{color:#fff!important}
#challenge-dashboard .cd-panel p,#challenge-dashboard .cd-panel span,#challenge-dashboard .muted{color:#e2e2e2!important}
#challenge-dashboard input,#challenge-dashboard select,#challenge-dashboard textarea{background:#050505!important;color:#fff!important;border:1px solid #777!important}
#challenge-dashboard option{background:#050505!important;color:#fff!important}
#challenge-dashboard button:focus-visible,#challenge-dashboard input:focus-visible,#challenge-dashboard select:focus-visible{outline:3px solid #e4c36e!important;outline-offset:2px}
@media(max-width:600px){#challenge-dashboard{width:calc(100% - 20px)!important}#challenge-dashboard .cd-hero{padding:20px!important;min-height:170px!important}#challenge-dashboard .cd-tabs{margin-left:-2px!important;margin-right:-2px!important}#challenge-dashboard .cd-grid{grid-template-columns:1fr!important}#challenge-dashboard .cd-actions button{flex:1 1 100%!important}}
`;

document.head.append(s);}
function hero(){return h('section',{class:'cd-hero'},h('div',{class:'cd-kicker'},'BABLO HUB  /  ACADEMIC COMPETITION'),h('h1',null,'Challenge Arena'),h('p',null,'Compete across courses. Earn points. Climb the Champions League.'),h('div',{class:'cd-quick'},h('span',null,'⚡ Live academic battles'),h('span',null,' • '),h('span',null,'🏆 Verified results')))}
function stat(n,t){return h('div',{class:'cd-stat'},h('b',null,n),h('span',{class:'muted'},t))}
function challengeNav(active){
 const names=['Overview','Discover','My Challenges','Friends','Champions League','Create Challenge'];
 return h('nav',{class:'cd-tabs','aria-label':'Challenge Arena sections'},...names.map(t=>h('button',{class:t===active?'active':'',onclick:()=>tab(t)},t)));
}
function dashboard(){
 CA.tab='overview';
 const nav=challengeNav('Overview');
 const left=h('section',{class:'cd-panel'});
 left.append(h('h3',null,'Your challenges'),h('div',{id:'cd-inbox',class:'cd-list'},'Loading your rooms and invitations…'));
 const right=h('aside',{class:'cd-panel cd-rankpanel'});
 right.append(h('h3',null,'Compete. Learn. Climb.'),h('p',{class:'muted'},'Find an opponent, challenge a friend, or track your progress in the Champions League.'),h('button',{onclick:()=>tab('Discover')},'Explore open challenges'));
 const grid=h('div',{class:'cd-grid'},left,right);
 const actions=h('div',{class:'cd-actions'});
 actions.append(h('button',{onclick:()=>tab('Create Challenge')},'＋ Create a challenge'),h('button',{class:'secondary',onclick:joinPrompt},'↗ Join with code'));
 const content=h('div',{id:'challenge-dashboard'});
 content.append(hero(),nav,actions,h('div',{class:'cd-stats'},stat('—','Open rooms'),stat('—','Invitations'),stat('—','Wins'),stat('0','XP earned')),grid);
 frame(content);loadInbox();
}
async function loadInbox(){let el=$('#cd-inbox');if(!el)return;try{let x=await call('hub_challenge_inbox',{});CA.inbox=x.challenges||[];el.replaceChildren(...(CA.inbox.length?CA.inbox.map(m=>{const done=m.status==='completed';const row=h('div',{class:'cd-row'},h('div',{style:{minWidth:'0',flex:'1'}},h('b',null,m.creator_username||'Challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions'),h('div',{class:'muted'},'Room '+(m.invite_code||'—')+' · '+m.status)),h('div',{class:'cd-row-actions'},done?h('button',{class:'cd-delete',onclick:()=>hideChallenge(m.id)},'Delete'):m.status==='waiting'?h('button',{onclick:()=>accept(m.id)},'Accept'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open')));return row}):[h('p',{class:'cd-empty'},'No active or saved challenges yet. Create a room or join one with a code.')]))}catch(e){el.textContent=e.message}}
async function hideChallenge(id){try{if(!confirm('Delete this completed challenge from your history? This only removes it from your own list.'))return;await call('hub_challenge_hide',{p_match_id:id});toast('Challenge removed from your history.');await loadInbox()}catch(e){toast(e.message)}}
function tab(name){
 if(name==='Overview'){dashboard();return}
 if(name==='Create Challenge'){createPanel();return}
 CA.tab=name;
 const panel=h('section',{class:'cd-panel'},h('h2',null,name),h('p',{class:'muted'},'Live data from Bablo Hub.'));
 const root=h('div',{id:'challenge-dashboard'});
 root.append(hero(),challengeNav(name),panel);
 frame(root);
 if(name==='Discover')loadDiscover(panel);
 else if(name==='My Challenges')loadHistory(panel);
 else if(name==='Friends')loadFriends(panel);
 else if(name==='Champions League')loadLeaderboard(panel,'overall');
}
async function loadDiscover(panel){
 panel.append(h('p',{class:'muted'},'Open public rooms waiting for an opponent.'));
 try{const x=await call('hub_challenge_discover');const rows=x.challenges||[];
 if(!rows.length){panel.append(h('div',{class:'cd-empty'},'No open rooms right now. Create one and invite the campus to play.'));return}
 rows.forEach(m=>panel.append(h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Bablo player'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions · '+Math.round(m.duration_seconds/60)+' min'),h('div',{class:'muted'},m.mode.replaceAll('_',' '))),h('button',{onclick:()=>accept(m.id)},'Join room'))));
 }catch(e){panel.append(h('p',{class:'muted'},e.message))}
}
async function loadHistory(panel){
 try{const x=await call('hub_challenge_inbox');const rows=x.challenges||[];
 if(!rows.length){panel.append(h('div',{class:'cd-empty'},'Your challenge history is empty. Create a challenge to get started.'));return}
 rows.forEach(m=>panel.append(h('div',{class:'cd-row'},h('div',null,h('b',null,m.creator_username||'Challenge'),h('div',{class:'muted'},(m.courses||[]).join(', ')+' · '+m.question_count+' questions'),h('div',{class:'muted'},'Room '+m.invite_code+' · '+m.status)),m.status==='completed'?h('button',{class:'secondary',onclick:()=>open(m.id)},'Review'):m.status==='waiting'&&m.invited_uid? h('button',{onclick:()=>accept(m.id)},'Accept'):h('button',{class:'secondary',onclick:()=>open(m.id)},'Open lobby'))));
 }catch(e){panel.append(h('p',{class:'muted'},e.message))}
}
async function loadFriends(panel){
 panel.replaceChildren(h('h2',null,'Friends & challenges'));
 const search=h('input',{id:'cd-friend-search',placeholder:'Enter exact Bablo username'});
 const send=h('button',{onclick:async()=>{
  try{const v=search.value.trim();if(!v)throw Error('Enter a username.');await call('hub_friend_request_send',{p_target_username:v});toast('Friend request sent.');loadFriends(panel)}
  catch(e){toast(e.message)}
 }},'Send friend request');
 panel.append(h('h3',null,'Find a friend'),search,send);
 try{
  const x=await call('hub_challenge_inbox');
  panel.append(h('h3',null,'Pending requests'));
  const requests=x.friend_requests||[];
  if(!requests.length)panel.append(h('p',{class:'muted'},'No pending friend requests.'));
  requests.forEach(r=>{
   const acceptButton=h('button',{onclick:async()=>{try{await call('hub_friend_request_respond',{p_request_id:r.id,p_accept:true});loadFriends(panel)}catch(e){toast(e.message)}}},'Accept');
   const declineButton=h('button',{class:'secondary',onclick:async()=>{try{await call('hub_friend_request_respond',{p_request_id:r.id,p_accept:false});loadFriends(panel)}catch(e){toast(e.message)}}},'Decline');
   panel.append(h('div',{class:'cd-row'},h('b',null,r.sender_username),acceptButton,declineButton));
  });
  panel.append(h('h3',null,'Your friends'));
  const friends=x.friends||[];
  if(!friends.length)panel.append(h('p',{class:'muted'},'No friends added yet. Search by username above.'));
  friends.forEach(friend=>{
   const details=h('div',null,h('b',null,friend.username),h('div',{class:'muted'},friend.nickname+' · '+friend.programme));
   const challenge=h('button',{onclick:()=>createPanel('quick_duel',friend.username)},'Challenge');
   panel.append(h('div',{class:'cd-row'},details,challenge));
  });
 }catch(e){panel.append(h('p',{class:'muted'},e.message))}
}
async function loadLeaderboard(panel,period){
 panel.replaceChildren(h('h2',null,'Champions League'));
 panel.append(h('p',{class:'muted'},'Verified completed matches. Players appear only when they opt into the Champions League.'));
 const sel=h('select',{onchange:e=>loadLeaderboard(panel,e.target.value)},...['overall','weekly','monthly'].map(p=>h('option',{value:p,selected:p===period},p[0].toUpperCase()+p.slice(1))));
 panel.append(sel);
 try{const x=await call('hub_challenge_leaderboard',{p_period:period});const rows=x.entries||[];
 if(!rows.length){panel.append(h('div',{class:'cd-empty'},'No opted-in completed results yet. Be the first to qualify.'));return}
 rows.forEach(r=>panel.append(h('div',{class:'cd-row'},h('div',null,h('b',null,'#'+r.rank+'  '+r.username),h('div',{class:'muted'},r.nickname+' · '+r.programme),h('div',{class:'muted'},r.wins+' wins · '+r.matches+' matches · '+r.accuracy+'% accuracy')),h('strong',null,r.points+' pts'))));
 }catch(e){panel.append(h('p',{class:'muted'},e.message))}
}
function createPanel(mode,targetUsername){
 const cs=courses();
 const root=h('div',{id:'challenge-dashboard'});
 root.append(hero(),challengeNav('Create Challenge'));
 const panel=h('section',{class:'cd-panel'});
 panel.append(h('h2',null,'Create a challenge'));
 const grid=h('div',{class:'cd-grid'});
 const left=h('div'),right=h('div');
 const modeSelect=h('select',{id:'cd-mode'},...['First to Answer|quick_duel','Mixed Challenge|multi_course','Timed Test|course_clash','Topic Master|topic_battle','Survival|survival','Best of Several Rounds|marathon'].map(v=>h('option',{value:v.split('|')[1]},v.split('|')[0])));
 left.append(h('label',null,'Game mode'),modeSelect);
 left.append(h('label',null,'Courses — select multiple'));
 left.append(h('select',{id:'cd-courses',multiple:true,size:6},...cs.map(course=>h('option',{value:course},course))));
 left.append(h('label',null,'Question count'),h('select',{id:'cd-count'},...[5,10,15,20,30,50].map(n=>h('option',{value:n,selected:n===10},n+' questions'))));
 right.append(h('label',null,'Match duration'),h('select',{id:'cd-duration'},...[[180,'3 minutes'],[300,'5 minutes'],[600,'10 minutes'],[900,'15 minutes'],[1800,'30 minutes']].map(v=>h('option',{value:v[0]},v[1]))));
 right.append(h('label',null,'Invite username (optional)'),h('input',{id:'cd-invite',placeholder:'Enter Bablo username'}));
 right.append(h('label',null,'Result visibility'),h('select',{id:'cd-private'},h('option',{value:'false'},'Private result'),h('option',{value:'true'},'Include in Champions League')));
 grid.append(left,right);panel.append(grid);
 const actions=h('div',{class:'cd-actions'});
 actions.append(h('button',{onclick:create},'Create room'),h('button',{class:'secondary',onclick:dashboard},'Cancel'));
 panel.append(actions);root.append(panel);frame(root);
 if(typeof mode==='string')$('#cd-mode').value=mode;
 if(targetUsername)$('#cd-invite').value=targetUsername;
}
async function create(){try{let cs=[...$('#cd-courses').selectedOptions].map(o=>o.value),n=+$('#cd-count').value;if(!cs.length)throw Error('Select at least one course.');let pool=questions().filter(q=>cs.includes(q.c));if(pool.length<n)throw Error('Not enough prepared questions across selected courses.');pool.sort(()=>Math.random()-.5);let qs=pool.slice(0,n).map(q=>({prompt:String(q.q),choices:q.o.map(String),answer_key:String(answerIndex(q)),course:q.c,topic:q.u||''}));CA.leaderboard=$('#cd-private').value==='true';let x=await call('hub_challenge_create',{p_mode:$('#cd-mode').value,p_courses:cs,p_topics:[],p_question_count:n,p_duration_seconds:+$('#cd-duration').value,p_question_set:qs,p_invited_username:$('#cd-invite').value.trim()||null,p_leaderboard_opt_in:$('#cd-private').value==='true'});CA.match=x.id||x.match_id;room(CA.match,x.invite_code,x);watchLobby()}catch(e){toast(e.message)}}
function toast(msg){if(typeof window.toast==='function')window.toast(msg);else alert(msg)}
function joinPrompt(){let code=prompt('Enter challenge room code');if(!code)return;call('hub_challenge_join_code',{p_code:code.trim()}).then(x=>open(x.id||x.match_id)).catch(e=>toast(e.message))}
async function quick(){createPanel('quick_duel')}
async function accept(id){try{await call('hub_challenge_accept',{p_match_id:id});open(id)}catch(e){toast(e.message)}}
async function open(id){try{clearInterval(CA.timer);CA.match=id;let x=await call('hub_challenge_get_questions',{p_match_id:id});CA.qs=x.questions||[];CA.idx=0;if(x.status==='completed'){let result=await call('hub_challenge_review',{p_match_id:id});review(result);return}room(id,x.invite_code,x);if(x.status==='active')startMatch(x);else watchLobby()}catch(e){toast(e.message)}}
async function review(x){
 const root=h('div',{id:'challenge-dashboard'});
 const panel=h('section',{class:'cd-panel'});
 panel.append(h('h2',null,'Match review'));
 panel.append(h('p',{class:'muted'},'Final verified standings'));
 (x.players||[]).forEach((p,i)=>{
  const label=h('b',null,(i+1)+'. '+(p.username||'Player'));
  const score=h('strong',null,(p.score||0)+' pts · '+(p.correct||0)+' correct');
  panel.append(h('div',{class:'cd-row'},label,score));
 });
 const answerBox=h('div',{id:'cd-answer-review',class:'cd-list'});
 answerBox.append(h('p',{class:'muted'},'Loading question-by-question review…'));
 panel.append(answerBox);
 panel.append(h('button',{onclick:()=>dashboard()},'Return to Arena'));
 root.append(hero(),panel);
 frame(root);
 try{
  const detail=await call('hub_challenge_review',{p_match_id:CA.match});
  const box=$('#cd-answer-review');
  if(!box)return;
  const cards=[];
  (detail.questions||[]).forEach((q,i)=>{
   const card=h('article',{class:'cd-panel',style:{marginTop:'12px'}});
   const title='Question '+(i+1)+' · '+(q.course||'')+(q.topic?' / '+q.topic:'');
   card.append(h('b',null,title));
   card.append(h('p',{style:{margin:'8px 0'}},q.prompt));
   const correctIndex=Number(q.correct_answer);const correctText=Array.isArray(q.choices)&&Number.isInteger(correctIndex)?q.choices[correctIndex]:q.correct_answer;card.append(h('p',{class:'muted'},'Correct answer: '+correctText));
   (q.responses||[]).forEach(r=>{
    const answerIndex=Number(r.answer_key);const chosen=Array.isArray(q.choices)&&Number.isInteger(answerIndex)?q.choices[answerIndex]:r.answer_key;const verdict=(r.is_correct?'Correct':'Incorrect')+' · '+chosen+' · '+(Number(r.response_ms||0)/1000).toFixed(1)+'s';
    const who=h('span',null,r.username);
    const result=h('strong',null,verdict);
    card.append(h('div',{class:'cd-row'},who,result));
   });
   cards.push(card);
  });
  if(cards.length)box.replaceChildren(...cards);
  else box.replaceChildren(h('p',{class:'cd-empty'},'No question review is available.'));
 }catch(e){
  const box=$('#cd-answer-review');
  if(box)box.textContent='Detailed review unavailable: '+e.message;
 }
}
function room(id,code,x={}){let status=x.status||'waiting';frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Challenge lobby'),h('p',null,'Room code: '+(code||'Open inbox for code')),h('p',{class:'muted'},(x.question_count||CA.qs.length)+' questions · '+Math.round((x.duration_seconds||300)/60)+' minutes'),h('p',{id:'cd-lobby-status'},status==='ready'?'Opponent joined. Both players must be ready.':status==='active'?'Starting match…':'Waiting for an opponent to join.'),h('p',null,'Share this code with your opponent.'),h('button',{id:'cd-ready',onclick:ready,disabled:status==='active'},status==='active'?'Starting…':'I’m ready'),h('button',{class:'secondary',onclick:dashboard},'Back to Arena'))))}
async function ready(){try{let b=$('#cd-ready');if(b)b.disabled=true;let x=await call('hub_challenge_ready',{p_match_id:CA.match});if(x.status==='active'){let detail=await call('hub_challenge_get_questions',{p_match_id:CA.match});startMatch(detail)}else{let s=$('#cd-lobby-status');if(s)s.textContent='You’re ready. Waiting for your opponent to get ready…';if(b)b.textContent='Ready ✓';watchLobby()}}catch(e){let b=$('#cd-ready');if(b)b.disabled=false;toast(e.message)}}
function watchLobby(){clearInterval(CA.timer);CA.timer=setInterval(async()=>{try{let x=await call('hub_challenge_get_questions',{p_match_id:CA.match});if(x.status==='active'){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;startMatch(x);return}let s=$('#cd-lobby-status');if(s)s.textContent=x.status==='ready'?'Opponent joined. Both players must press Ready.':'Waiting for an opponent to join.'}catch(e){let s=$('#cd-lobby-status');if(s)s.textContent=e.message}},2000)}
function startMatch(x){clearInterval(CA.timer);CA.qs=x.questions||CA.qs;CA.idx=0;let start=Date.parse(x.starts_at||new Date().toISOString());let duration=Number(x.duration_seconds)||300;CA.startAt=start;CA.end=start+duration*1000;let wait=Math.max(0,start-Date.now());if(wait){frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('h2',null,'Match starting'),h('p',{class:'muted'},'Both players are ready. Your shared timer begins in a moment.'),h('strong',{id:'cd-start-count'},Math.ceil(wait/1000)+' seconds'))));CA.timer=setInterval(()=>{let left=Math.max(0,CA.startAt-Date.now()),el=$('#cd-start-count');if(el)el.textContent=Math.ceil(left/1000)+' seconds';if(!left){clearInterval(CA.timer);play()}},200)}else play()}
function play(){let q=CA.qs[CA.idx];if(!q){finish();return}CA.done=false;CA.started=Date.now();frame(h('div',null,hero(),h('section',{class:'cd-panel'},h('div',{class:'cd-row'},h('b',null,'Question '+(CA.idx+1)+' / '+CA.qs.length),h('strong',{id:'cd-clock'},'')),h('p',{class:'muted'},(q.course||'')+' · '+(q.topic||'')),h('div',{class:'cd-q'},q.prompt),h('div',{id:'cd-options'},...q.choices.map((c,i)=>h('button',{class:'cd-choice',onclick:()=>answer(i)},String.fromCharCode(65+i)+'. '+c))),h('div',{id:'cd-feedback'}),h('div',{class:'cd-quick'},h('button',{class:'secondary',onclick:react},'🔥'),h('button',{id:'cd-next',disabled:true,onclick:()=>{CA.idx++;play()}},'Next question')),h('div',{id:'cd-score',class:'muted'}))));tick();clearInterval(CA.timer);CA.timer=setInterval(tick,500);feed()}
function tick(){let el=$('#cd-clock');if(!el)return;let left=Math.max(0,CA.end-Date.now());el.textContent=Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0');if(!left)finish()}
async function answer(i){if(CA.done)return;CA.done=true;let bs=[...$('#cd-options').querySelectorAll('button')];bs.forEach(b=>b.disabled=true);try{let x=await call('hub_challenge_submit_answer',{p_match_id:CA.match,p_question_index:CA.idx,p_answer_key:String(i),p_response_ms:Math.max(0,Date.now()-(CA.started||Date.now()))});$('#cd-feedback').textContent=x.correct?'Correct — point earned.':'Answer submitted — not correct.';$('#cd-next').disabled=false;feed()}catch(e){CA.done=false;bs.forEach(b=>b.disabled=false);toast(e.message)}}
async function feed(){try{let x=await call('hub_challenge_reaction_feed',{p_match_id:CA.match});let el=$('#cd-score');if(el)el.textContent=(x.players||[]).map(p=>p.username+' · '+p.score+' pts').join('  |  ')}catch(e){}}
async function react(){try{await call('hub_challenge_reaction_send',{p_match_id:CA.match,p_emoji:'🔥'})}catch(e){}}
async function finish(){
 clearInterval(CA.timer);
 try{
  const result=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:!!CA.leaderboard});
  if(!result.waiting_for_opponent){review(result);return}
  const root=h('div',{id:'challenge-dashboard'});
  const panel=h('section',{class:'cd-panel'});
  panel.append(h('h2',null,'Your result is saved'));
  panel.append(h('p',{class:'muted'},'Waiting for your opponent to finish. Standings will update automatically.'));
  const scoreBox=h('div',{id:'cd-pending-scores'});
  (result.players||[]).forEach((p,i)=>scoreBox.append(h('div',{class:'cd-row'},h('b',null,(i+1)+'. '+p.username),h('span',null,p.score+' pts'))));
  panel.append(scoreBox,h('button',{class:'secondary',onclick:dashboard},'Return to Arena'));
  root.append(hero(),panel);frame(root);
  CA.timer=setInterval(async()=>{
   try{
    const latest=await call('hub_challenge_finish',{p_match_id:CA.match,p_opt_into_leaderboard:false});
    if(!latest.waiting_for_opponent){clearInterval(CA.timer);review(latest);return}
    const box=$('#cd-pending-scores');
    if(box){box.replaceChildren();(latest.players||[]).forEach((p,i)=>box.append(h('div',{class:'cd-row'},h('b',null,(i+1)+'. '+p.username),h('span',null,p.score+' pts'))))}
   }catch(e){clearInterval(CA.timer)}
  },4000);
 }catch(e){toast(e.message)}
}
window.challengeDashboardView=function(){try{clearInterval(CA.timer);dashboard()}catch(e){console.error('[Challenge Arena render]',e);try{mount(wrap(h('main',{id:'challenge-dashboard',class:'panel stack'},h('h2',null,'Challenge Arena could not load'),h('p',{class:'muted'},String(e&&e.message||e)),h('button',{onclick:()=>location.hash='#/'},'Back home'))))}catch(renderError){console.error('[Challenge Arena fallback]',renderError)}}};
})();