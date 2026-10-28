/* Bablo Hub Challenge Arena — phase 1
 * Uses the existing Hub account token and question bank. Never writes private
 * challenge data directly from the browser; all mutations go through RPCs.
 */
(function () {
  'use strict';
  const MODES = [
    ['quick_duel','Quick Duel'],['multi_course','Multi-Course Mayhem'],
    ['course_clash','Course Clash'],['topic_battle','Topic Battle'],
    ['survival','Survival'],['marathon','Marathon'],['random','Random Challenge']
  ];
  const esc = s => String(s == null ? '' : s);
  const token = () => DB && DB.account && DB.account.token;
  const rpc = async (name, args) => {
    if (!token()) throw new Error('Log in to use Challenge Arena.');
    const response = await fetch(LB.url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: LB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ p_token: token() }, args || {}))
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.details || data.error || 'Challenge service is unavailable.');
    return data;
  };
  const panel = (...kids) => h('section',{class:'panel stack'},...kids);
  const label = (title, control) => h('label',{class:'field'},h('span',null,title),control);
  const btn = (text,fn,kind='primary') => h('button',{class:'btn '+kind,onclick:fn},text);
  const small = text => h('p',{class:'tiny muted'},text);
  const errorBox = () => h('p',{class:'small',style:{color:'var(--bad)'}});
  const courses = () => (Array.isArray(COURSES)?COURSES:[]).filter(c => Array.isArray(BANK) && BANK.some(q => q.c===c.code));
  const getBank = codes => (BANK||[]).filter(q=>codes.includes(q.c)&&Array.isArray(q.o)&&q.o.length>=2&&Number.isInteger(Number(q.a)));
  const shuffle = arr => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const stamp = v => { try{return new Date(v).toLocaleString();}catch(e){return '';} };
  const modeLabel = m => (MODES.find(x=>x[0]===m)||[m,m])[1];
  let inboxCache = null;

  async function loadInbox() {
    const j=await rpc('hub_challenge_inbox',{});
    if(!j||j.ok!==true) throw new Error((j&&j.error)||'Could not load your Challenge Arena inbox.');
    inboxCache=j; return j;
  }

  function challengeView() {
    if (!signedIn()) {
      mount(wrap(panel(h('p',{class:'eyebrow'},'BABLO HUB • CHALLENGE ARENA'),h('h1',null,'Log in to challenge friends'),
        h('p',{class:'muted'},'Challenge matches, friend requests, and results need a Bablo Hub account so they can follow you across devices.'),
        btn('Go to account area',()=>go('#/me'),'primary'),btn('Back home',()=>go('#/'),'ghost'))));
      renderNav('challenges');
      return;
    }
    const head=wrap(
      h('section',{class:'hero'},h('p',{class:'eyebrow'},'BABLO HUB • FRIEND COMPETITION'),
        h('h1',null,'Challenge Arena 🏆'),
        h('p',null,'Mix courses, race for points, and see who really knows the material.'),
        h('div',{class:'hero-stats'},h('div',null,h('b',null,'1–2'),h('span',null,'players per duel')),h('div',null,h('b',null,'Multi-course'),h('span',null,'challenge sets')))),
      h('div',{class:'row wrapr'},btn('＋ Create challenge',()=>showCreate()),btn('↻ Refresh',()=>challengeView(),'ghost')),
      panel(h('h2',null,'Join with a code'),small('Got an invitation code from a friend?'),
        (()=>{const input=h('input',{placeholder:'e.g. A1B2C3D4',maxlength:'10',autocomplete:'off'});const err=errorBox();return h('div',{class:'stack'},h('div',{class:'row wrapr'},input,btn('Join',async()=>{err.textContent='';try{const j=await rpc('hub_challenge_join_code',{p_code:input.value.trim()});if(!j.ok)throw new Error(j.error||'Could not join.');toast('Challenge joined!');go('#/challenges/'+j.match_id);}catch(e){err.textContent=e.message;}})),err);})()),
      panel(h('h2',null,'Your arena'),small('Invitations, active matches, recent results, and friend requests.'),
        h('div',{id:'challengeInbox',class:'stack'},h('p',{class:'muted small'},'Loading your arena…'))),
      panel(h('h2',null,'Friends'),small('Find friends by username. You can send challenges after they accept your request.'),
        (()=>{const input=h('input',{placeholder:'Username or leaderboard nickname',maxlength:'50',autocomplete:'off'});const err=errorBox();return h('div',{class:'stack'},h('div',{class:'row wrapr'},input,btn('Add friend',async()=>{err.textContent='';try{const j=await rpc('hub_friend_request_send',{p_target_username:input.value.trim().replace(/^@+/, '')});if(!j.ok)throw new Error(j.error||'Could not send request.');toast(j.status==='already_friends'?'You are already friends.':'Friend request sent.');input.value='';await refreshInbox();}catch(e){err.textContent=e.message;}})),err);})(),
        h('div',{id:'challengeFriends',class:'stack'},small('Loading friends…'))),
      small('Safety: only friends can receive private challenges and messages. Block/report controls are being added with the full friend tools.')
    );
    mount(head);
    refreshInbox().catch(e=>{const box=document.getElementById('challengeInbox');if(box)box.replaceChildren(h('p',{class:'small',style:{color:'var(--bad)'}},e.message));});
  }

  async function refreshInbox() {
    const j=await loadInbox();
    const box=document.getElementById('challengeInbox'),friends=document.getElementById('challengeFriends');
    if(box){
      const rows=j.challenges||[];
      const pending=(j.friend_requests||[]);
      const cards=[];
      pending.forEach(r => {
        const identity = h('div',{class:'stack',style:{gap:'2px'}},
          h('b',null,'Friend request from @'+esc(r.sender_username)), small(stamp(r.created_at)));
        const actions = h('div',{class:'row wrapr'},
          btn('Accept',async()=>{try{await rpc('hub_friend_request_respond',{p_request_id:r.id,p_accept:true});toast('Friend added.');await refreshInbox();}catch(e){toast(e.message);}},'primary'),
          btn('Decline',async()=>{try{await rpc('hub_friend_request_respond',{p_request_id:r.id,p_accept:false});await refreshInbox();}catch(e){toast(e.message);}},'ghost'));
        cards.push(panel(h('div',{class:'row between wrapr'},identity,actions)));
      });
      rows.forEach(m=>{
        const incoming=m.invited_uid===DB.account.uid&&m.created_by!==DB.account.uid&&m.status==='waiting';
        const active=m.status==='active'||m.status==='ready';
        cards.push(panel(h('div',{class:'row between wrapr'},h('div',{class:'stack',style:{gap:'3px',minWidth:'0'}},
          h('b',null,modeLabel(m.mode)),small((m.courses||[]).join(' + ')+' • '+m.question_count+' questions'),
          small((incoming?'Invitation from @'+esc(m.creator_username):'Code: '+esc(m.invite_code))+' • '+esc(m.status)+' • '+stamp(m.created_at))),
          h('div',{class:'row wrapr'},incoming?btn('Accept',async()=>{try{const a=await rpc('hub_challenge_accept',{p_match_id:m.id});if(!a.ok)throw new Error(a.error||'Could not accept.');go('#/challenges/'+m.id);}catch(e){toast(e.message);}}):btn(active?'Open match':'View',()=>go('#/challenges/'+m.id),active?'primary':'ghost'),
          m.status==='waiting'&&m.created_by===DB.account.uid?btn('Copy code',()=>copyCode(m.invite_code),'ghost'):null))));
      });
      box.replaceChildren(...(cards.length?cards:[small('No invitations yet. Create a challenge and invite a friend!')]));
    }
    if(friends){
      const list=j.friends||[];
      friends.replaceChildren(...(list.length?list.map(f=>panel(
        h('div',{class:'row between wrapr'},h('div',{class:'stack',style:{gap:'2px'}},h('b',null,'@'+esc(f.username||f.nickname)),small(esc(f.programme||'Bablo Hub friend'))),
          h('div',{class:'row wrapr'},btn('Challenge',()=>showCreate(f.username),'primary'),btn('Chat',()=>openChat(f.username),'ghost'),btn('Block',async()=>{if(!await confirmBox({title:'Block @'+f.username+'?',msg:'They will no longer be able to send you friend requests or messages. Existing friendship will be removed.',ok:'Block user',cancel:'Cancel',danger:true}))return;try{await rpc('hub_challenge_block_user',{p_target_username:f.username});toast('User blocked.');await refreshInbox();}catch(e){toast(e.message);}},'ghost'),btn('Report',()=>openReport(f.username),'ghost')))
      )):[small('Your saved friends will appear here once they accept a request.')]));
    }
  }


  async function openChat(username) {
    const close=modal(h('div',{class:'stack'},h('p',{class:'eyebrow'},'FRIEND CHAT'),h('h2',null,'@'+esc(username)),
      small('Messages are limited to accepted friends. Use Block or Report if a conversation becomes uncomfortable.'),
      (()=>{const feed=h('div',{class:'stack',style:{maxHeight:'42vh',overflowY:'auto'}});const input=h('input',{placeholder:'Write a message…',maxlength:'1000',autocomplete:'off'});const status=errorBox();
        async function load(){feed.replaceChildren(small('Loading messages…'));try{const j=await rpc('hub_friend_messages_get',{p_friend_username:username});feed.replaceChildren(...((j.messages||[]).map(m=>panel(h('div',{class:'row between'},h('b',null,m.mine?'You':'@'+esc(username)),small(stamp(m.created_at))),h('p',{class:'small',style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},m.body))))||[small('No messages yet. Say hello!')]);if(!(j.messages||[]).length)feed.replaceChildren(small('No messages yet. Say hello!'));}catch(e){feed.replaceChildren(small(e.message));}}
        const send=async()=>{status.textContent='';const body=input.value.trim();if(!body)return;try{await rpc('hub_friend_message_send',{p_recipient_username:username,p_body:body});input.value='';await load();}catch(e){status.textContent=e.message;}};
        setTimeout(load,0);
        return h('div',{class:'stack'},feed,h('div',{class:'row wrapr'},input,btn('Send',send,'primary')),status,h('div',{class:'row wrapr'},btn('Refresh',load,'ghost'),btn('Report friend',()=>openReport(username),'ghost'),btn('Close',close,'ghost')));
      })()),true);
  }

  function openReport(username) {
    const category=h('select',null,[['spam','Spam'],['harassment','Harassment'],['inappropriate','Inappropriate content'],['impersonation','Impersonation'],['other','Other']].map(([v,t])=>h('option',{value:v},t)));
    const details=h('input',{placeholder:'Optional details (max 1000 characters)',maxlength:'1000'});
    const status=errorBox();
    const close=modal(h('div',{class:'stack'},h('h2',null,'Report @'+esc(username)),small('Reports are reviewed for safety and misuse. Please do not include private information.'),
      label('Reason',category),label('Details (optional)',details),status,
      h('div',{class:'row wrapr'},btn('Submit report',async()=>{try{await rpc('hub_challenge_report_user',{p_target_username:username,p_category:category.value,p_details:details.value});toast('Report submitted.');close();}catch(e){status.textContent=e.message;}},'danger'),btn('Cancel',close,'ghost'))),true);
  }

  async function copyCode(code) {
    try { await navigator.clipboard.writeText(String(code));toast('Challenge code copied: '+code); }
    catch(e){modal(h('div',{class:'stack'},h('h2',null,'Share challenge code'),h('p',null,'Send this code to your friend:'),h('strong',{style:{fontSize:'1.5rem',letterSpacing:'.12em'}},code),btn('Done',()=>document.querySelector('.overlay')?.remove())));}
  }

  function showCreate(prefillUsername='') {
    const available=courses();
    if(!available.length){toast('No question bank is available yet.');return;}
    const selected=new Set(available.length? [available[0].code]:[]);
    const mode=h('select',null,MODES.map(([v,t])=>h('option',{value:v},t)));
    const topics=h('input',{placeholder:'Optional topics, comma-separated'});
    const count=h('select',null,[5,10,15,20,30,40,60,80,100].map(n=>h('option',{value:n},n+' questions')));count.value='10';
    const mins=h('select',null,[2,3,5,8,10,15,20,30,45,60].map(n=>h('option',{value:n},n+' minutes')));mins.value='5';
    const username=h('input',{value:prefillUsername,placeholder:'Friend username (optional)',maxlength:'30'});
    const share=h('input',{type:'checkbox',checked:false});
    const err=errorBox();
    const courseBox=h('div',{class:'grid2'});
    function drawCourses(){courseBox.replaceChildren(...available.map(c=>{const cb=h('input',{type:'checkbox',checked:selected.has(c.code)});cb.addEventListener('change',()=>{if(cb.checked)selected.add(c.code);else selected.delete(c.code);});return h('label',{class:'panel row',style:{alignItems:'center',gap:'10px',cursor:'pointer'}},cb,h('span',null,h('b',null,c.label),h('div',{class:'tiny muted'},c.title)));}));}
    drawCourses();
    const overlay=modal(h('div',{class:'stack'},h('p',{class:'eyebrow'},'CHALLENGE SETUP'),h('h2',null,'Build your challenge'),
      small('Select multiple courses to make it unpredictable. Questions are sampled from the existing Bablo question bank.'),
      label('Challenge mode',mode),h('b',null,'Courses (choose one or more)'),courseBox,
      label('Topics (optional)',topics),label('Question count',count),label('Time limit',mins),
      label('Invite a friend by username',username),
      h('label',{class:'row',style:{gap:'10px',alignItems:'center'}},share,h('span',null,'Allow completed results on the separate Challenge leaderboard')),
      err,h('div',{class:'row wrapr'},btn('Create challenge',async()=>{
        err.textContent='';
        try{
          if(!selected.size)throw new Error('Choose at least one course.');
          const codes=[...selected];
          const n=Number(count.value);
          const topicList=topics.value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
          let bank=getBank(codes);
          if(topicList.length)bank=bank.filter(q=>topicList.some(t=>(String(q.u||'')+' '+String(q.c||'')).toLowerCase().includes(t)));
          if(bank.length<n)throw new Error('Only '+bank.length+' questions match your selected courses/topics. Choose fewer questions, broader topics, or more courses.');
          const finalSet=shuffle(bank).slice(0,n).map(q=>({id:String(q.i),course:String(q.c),topic:String(q.u||''),prompt:String(q.q),choices:q.o.map(String),answer_key:String(q.a),explanation:String(q.e||'')}));
          const j=await rpc('hub_challenge_create',{p_mode:mode.value,p_courses:codes,p_topics:topicList,p_question_count:n,p_duration_seconds:Number(mins.value)*60,p_question_set:finalSet,p_invited_username:username.value.trim()||null,p_leaderboard_opt_in:share.checked});
          if(!j||!j.ok)throw new Error((j&&j.error)||'Challenge creation failed.');
          document.querySelector('.overlay')?.remove();
          toast('Challenge created. Share code '+j.invite_code+' with your friend.');
          if(navigator.share){try{await navigator.share({title:'Bablo Challenge Arena',text:'Join my Bablo Hub quiz challenge! Code: '+j.invite_code});}catch(e){}}
          go('#/challenges/'+j.match_id);
        }catch(e){err.textContent=e.message||'Could not create challenge.';}
      }),btn('Cancel',()=>document.querySelector('.overlay')?.remove(),'ghost'))));
  }

  async function matchView(matchId) {
    let j;
    try { j=await rpc('hub_challenge_get_questions',{p_match_id:matchId}); }
    catch(e){mount(wrap(panel(h('h2',null,'Challenge unavailable'),h('p',{class:'muted'},e.message),btn('Back to Arena',()=>go('#/challenges'),'primary'))));return;}
    if(!j||!j.ok){toast((j&&j.error)||'Could not load this challenge.');go('#/challenges');return;}

    const stillHere=()=>location.hash.includes('/challenges/'+matchId);
    if(j.status==='waiting' || j.status==='ready'){
      const waiting=j.status==='waiting';
      const lobby=wrap(panel(
        h('p',{class:'eyebrow'},'CHALLENGE LOBBY'),
        h('h1',null,waiting?'Waiting for your friend…':'Both players must be ready'),
        h('p',null,waiting?'Your opponent must accept the invitation first. Once they join, both players will enter the ready check.':'You are in the same lobby now. Press Ready, and the match starts only after both players are here.'),
        j.invite_code?h('div',{class:'stack'},h('span',{class:'tiny muted'},'INVITATION CODE'),h('strong',{style:{fontSize:'1.6rem',letterSpacing:'.15em'}},j.invite_code),btn('Copy invitation code',()=>copyCode(j.invite_code),'ghost')):null,
        !waiting?h('div',{class:'panel stack'},h('b',null,(j.ready_count||0)+' of 2 players ready'),h('p',{class:'muted small'},j.my_status==='ready'?'You are ready. Waiting for your friend to press Ready.':'The countdown begins when both players press Ready.'),j.my_status!=='ready'?btn('I’m Ready ⚡',async()=>{try{const r=await rpc('hub_challenge_ready',{p_match_id:matchId});if(!r.ok)throw new Error(r.error||'Could not mark ready.');toast(r.status==='active'?'Both ready! Match starting…':'Ready! Waiting for your opponent.');matchView(matchId);}catch(e){toast(e.message);}},'primary'):null):null,
        small('Keep this screen open. Bablo will automatically move both players into the match together.'),
        h('div',{class:'row wrapr'},btn('Refresh status',()=>matchView(matchId),'ghost'),btn('Back to Arena',()=>go('#/challenges'),'ghost'))
      ));
      mount(lobby);
      if(stillHere())setTimeout(()=>{if(stillHere())matchView(matchId);},1800);
      return;
    }

    const questions=j.questions||[];
    if(!questions.length){toast('This challenge has no questions.');go('#/challenges');return;}
    const startsAt=j.starts_at?new Date(j.starts_at).getTime():Date.now();
    const deadline=startsAt+Number(j.duration_seconds||300)*1000;
    if(Date.now()<startsAt){
      const countdown=h('b',null,'5');
      mount(wrap(panel(h('p',{class:'eyebrow'},'BOTH PLAYERS READY'),h('h1',null,'Get set…'),h('p',null,'The same countdown and deadline apply to both players.'),countdown,h('p',{class:'muted small'},'Keep Bablo open. Your questions will appear automatically.'))));
      const timerId=setInterval(()=>{if(!stillHere()){clearInterval(timerId);return;}const left=Math.max(0,startsAt-Date.now());countdown.textContent=(left/1000).toFixed(1)+'s';if(left<=0){clearInterval(timerId);matchView(matchId);}},100);
      return;
    }

    let index=0,score=0,correct=0,wrong=0,questionStarted=Date.now(),locked=false,finishing=false,answers=[];
    const timer=h('b',null,'--:--'),progress=h('span',{class:'tiny muted'},'Question 1 of '+questions.length),scoreEl=h('b',null,'0 points');
    const area=h('div',{class:'stack'}),err=errorBox(),feed=h('div',{class:'stack',style:{gap:'6px',maxHeight:'260px',overflowY:'auto'}}),playersBox=h('div',{class:'stack',style:{gap:'6px'}});
    const emojis=['😂','😭','🔥','👏','😮','💀','❤️','😤'];
    const reactionButtons=emojis.map(emoji=>btn(emoji,async()=>{try{await rpc('hub_challenge_reaction_send',{p_match_id:matchId,p_emoji:emoji});await refreshLive();}catch(e){toast(e.message);}},'ghost'));
    const reactionPanel=panel(h('h2',null,'React live 💬'),small('Your friend sees these instantly. Keep it fun.'),h('div',{class:'row wrapr'},...reactionButtons),h('h3',null,'Live reactions'),feed,h('h3',null,'Scoreboard'),playersBox);
    const questionPanel=panel(area,err,btn('Leave challenge',async()=>{if(confirm('Leave this challenge? Your completed answers will be kept.')){try{await rpc('hub_challenge_finish',{p_match_id:matchId,p_opt_into_leaderboard:false});}catch(e){}go('#/challenges');}},'ghost'));
    const shell=wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'LIVE CHALLENGE • TWO-PLAYER MATCH'),h('h1',null,'Challenge in progress ⚡'),h('p',null,(j.courses||[]).join(' + ')),h('div',{class:'hero-stats'},h('div',null,timer,h('span',null,'shared time remaining')),h('div',null,scoreEl,h('span',null,'your score')),h('div',null,progress))),
      h('div',{class:'row wrapr',style:{alignItems:'stretch',gap:'12px'}},h('div',{style:{flex:'1 1 320px',minWidth:'0'}},questionPanel),h('div',{style:{flex:'0 1 240px',minWidth:'220px'}},reactionPanel)));
    mount(shell);

    function draw(){
      locked=false;err.textContent='';
      const q=questions[index];questionStarted=Date.now();progress.textContent='Question '+(index+1)+' of '+questions.length;
      const choices=(q.choices||[]).map((c,i)=>btn(String.fromCharCode(65+i)+'. '+String(c),()=>answer(i),'ghost'));
      area.replaceChildren(h('div',{class:'stack'},h('p',{class:'eyebrow'},esc(q.course||'')+' • '+esc(q.topic||'')),h('h2',null,q.prompt||'Question'),...choices));
    }
    async function answer(choice){
      if(locked||finishing)return;locked=true;
      const ms=Math.min(7200000,Math.max(0,Date.now()-questionStarted));
      try{
        const result=await rpc('hub_challenge_submit_answer',{p_match_id:matchId,p_question_index:index,p_answer_key:String(choice),p_response_ms:ms});
        if(result.point_awarded)score++;if(result.correct)correct++;else wrong++;
        answers.push({index,choice,correct:result.correct,point:result.point_awarded});
        scoreEl.textContent=score+' point'+(score===1?'':'s');
        area.append(h('p',{class:'small',style:{color:result.correct?'var(--good)':'var(--bad)'}},result.correct?'Correct! Your point is yours—both players score independently.':'Not quite. Your answer is saved.'));
        area.append(btn(index+1<questions.length?'Next question':'Finish challenge',async()=>{if(index+1<questions.length){index++;draw();}else await finish();}));
        refreshLive();
      }catch(e){locked=false;err.textContent=e.message||'Answer could not be submitted.';}
    }
    async function refreshLive(){
      try{
        const live=await rpc('hub_challenge_reaction_feed',{p_match_id:matchId});
        const reactionRows=live.reactions||[];
        feed.replaceChildren(...(reactionRows.length?reactionRows.slice(-10).reverse().map(r=>h('div',{class:'panel row between',style:{padding:'7px 9px',gap:'8px'}},h('span',{style:{fontSize:'1.5rem'}},r.emoji),h('span',{class:'tiny',style:{overflowWrap:'anywhere'}},(r.mine?'You':'@'+esc(r.username)))):[small('No reactions yet. Send the first one!')]));
        playersBox.replaceChildren(...((live.players||[]).map(p=>h('div',{class:'panel stack',style:{padding:'8px 10px',gap:'3px'}},h('b',null,(p.username===DB.account.username?'You':'@'+esc(p.username))),h('div',{class:'row between'},h('span',{class:'tiny muted'},'Score'),h('strong',null,esc(p.score))),h('span',{class:'tiny muted'},esc(p.answered)+' / '+questions.length+' answered')))));
      }catch(e){}
    }
    async function finish(){
      if(finishing)return;finishing=true;
      try{
        const result=await rpc('hub_challenge_finish',{p_match_id:matchId,p_opt_into_leaderboard:false});
        const rows=result.players||[];
        const cards=rows.map(p=>h('div',{class:'panel stack'},h('b',null,'@'+esc(p.username||p.nickname||'Player')),h('div',{class:'row between'},h('span',null,'Score'),h('strong',null,esc(p.score)+' points')),small('Correct: '+esc(p.correct)+' • Incorrect: '+esc(p.incorrect)),small('Response time: '+Math.round((p.total_response_ms||0)/1000)+'s')));
        if(result.status!=='completed'){
          finishing=false;
          mount(wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'YOUR ANSWERS ARE IN'),h('h1',null,'Waiting for your opponent'),h('p',null,'Your answers are saved. Keep the screen open; results unlock when both players finish.')),
            panel(h('h2',null,'Current scores'),...cards),h('div',{class:'row wrapr'},btn('Refresh results',()=>finish(),'primary'),btn('Back to Arena',()=>go('#/challenges'),'ghost'))));
          return;
        }
        const qReview=(result.questions||[]).map((q,i)=>panel(h('b',null,(i+1)+'. '+esc(q.prompt)),h('p',{class:'small'},'Correct answer: '+esc((q.choices||[])[Number(q.answer_key)]||q.answer_key)),q.explanation?small(q.explanation):null));
        mount(wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'CHALLENGE COMPLETE'),h('h1',null,'Results & analytics'),h('p',null,'Your score: '+score+' points'),h('div',{class:'hero-stats'},h('div',null,h('b',null,correct),h('span',null,'correct answers')),h('div',null,h('b',null,wrong),h('span',null,'incorrect answers')),h('div',null,h('b',null,Math.round(correct/Math.max(1,answers.length)*100)+'%'),h('span',null,'your accuracy')))),
          panel(h('h2',null,'Match results'),...cards),panel(h('h2',null,'Answer review'),...qReview),
          h('div',{class:'row wrapr'},btn('Rematch',()=>showCreate(),'primary'),btn('Back to Arena',()=>go('#/challenges'),'ghost'))));
      }catch(e){finishing=false;err.textContent=e.message||'Could not finish challenge.';}
    }
    function tick(){
      const remaining=Math.max(0,deadline-Date.now()),s=Math.ceil(remaining/1000);
      timer.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
      if(remaining<=0){clearInterval(interval);if(!locked)finish();}
    }
    draw();tick();refreshLive();
    const interval=setInterval(()=>{if(!stillHere()){clearInterval(interval);clearInterval(liveInterval);return;}tick();},500);
    const liveInterval=setInterval(()=>{if(!stillHere()){clearInterval(interval);clearInterval(liveInterval);return;}refreshLive();},1200);
  }

  // Keep the Challenges entry visible whenever the Hub redraws its bottom nav.
  function addChallengeNav() {
    const bar=document.querySelector('#nav .in');
    if(!bar || bar.querySelector('[data-challenge-nav]')) return;
    const link=h('a',{href:'#/challenges','data-challenge-nav':'','aria-label':'Challenge Arena'},
      h('span',{class:'challenge-nav-icon','aria-hidden':'true'},'⚡'),'Challenges');
    bar.append(link);
    // The Hub's original navigation is a five-column grid; reserve a real slot
    // for the sixth Challenge Arena item so it isn't pushed off-screen.
    bar.style.gridTemplateColumns = 'repeat(6, minmax(0, 1fr))';
    bar.querySelectorAll('a').forEach(a => { a.style.minWidth='0'; a.style.fontSize='clamp(.58rem, 2.5vw, .74rem)'; });
  }
  const hubRenderNav = renderNav;
  renderNav = function(active) {
    hubRenderNav(active);
    addChallengeNav();
  };
  addChallengeNav();
  // Route Challenges through the real bottom-navigation item. Use an explicit
  // click handler as well as hashchange so embedded/mobile browsers cannot swallow
  // the navigation event or leave the core router on Home.
  document.addEventListener('click', function (event) {
    const link = event.target && event.target.closest
      ? event.target.closest('[data-challenge-nav], a[href="#/challenges"]')
      : null;
    if (!link) return;
    event.preventDefault();
    if (location.hash !== '#/challenges') location.hash = '#/challenges';
    setTimeout(dispatchChallengeRoute, 0);
  }, true);
  function dispatchChallengeRoute() {
    const raw=location.hash.slice(1).split('?')[0].split('/').filter(Boolean);
    if(raw[0]!=='challenges') return;
    if(!DB.profile) { challengeView(); return; }
    if(raw[1]) matchView(raw[1]); else challengeView();
  }
  window.addEventListener('hashchange', dispatchChallengeRoute);
  if(location.hash.slice(1).split('/').filter(Boolean)[0]==='challenges') setTimeout(dispatchChallengeRoute, 0);
})();
