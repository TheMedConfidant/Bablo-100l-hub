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
        (()=>{const input=h('input',{placeholder:'Enter exact username',maxlength:'30',autocomplete:'off'});const err=errorBox();return h('div',{class:'stack'},h('div',{class:'row wrapr'},input,btn('Add friend',async()=>{err.textContent='';try{const j=await rpc('hub_friend_request_send',{p_target_username:input.value.trim()});if(!j.ok)throw new Error(j.error||'Could not send request.');toast(j.status==='already_friends'?'You are already friends.':'Friend request sent.');input.value='';await refreshInbox();}catch(e){err.textContent=e.message;}})),err);})(),
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
    if(j.status!=='active'){
      mount(wrap(panel(h('p',{class:'eyebrow'},'CHALLENGE LOBBY'),h('h1',null,j.status==='waiting'?'Waiting for your friend…':'Getting the arena ready'),
        h('p',null,'Share this code so your friend can join:'),
        h('strong',{style:{fontSize:'1.6rem',letterSpacing:'.15em'}},j.invite_code||'Open Arena inbox for code'),
        btn('Copy invitation code',()=>{if(j.invite_code)copyCode(j.invite_code);else toast('Refresh your Arena inbox to retrieve the code.');}),
        small('The quiz begins when two participants have joined. Refresh after your friend accepts.'),
        h('div',{class:'row wrapr'},btn('Refresh status',()=>matchView(matchId)),btn('Back to Arena',()=>go('#/challenges'),'ghost')))));
      return;
    }
    const questions=j.questions||[];
    if(!questions.length){toast('This challenge has no questions.');go('#/challenges');return;}
    let index=0,score=0,correct=0,wrong=0,started=Date.now(),locked=false,answers=[];
    const timer=h('b',null,'--:--'),progress=h('span',{class:'tiny muted'},'Question 1 of '+questions.length),scoreEl=h('b',null,'0 points');
    const area=h('div',{class:'stack'}),err=errorBox();
    const shell=wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'LIVE CHALLENGE'),h('h1',null,'Challenge in progress'),h('p',null,(j.courses||[]).join(' + ')),h('div',{class:'hero-stats'},h('div',null,timer,h('span',null,'remaining')),h('div',null,scoreEl,h('span',null,'your score')),h('div',null,progress))),
      panel(area,err,btn('Leave challenge',async()=>{if(confirm('Leave this challenge? Your completed answers will be kept.')){try{await rpc('hub_challenge_finish',{p_match_id:matchId,p_opt_into_leaderboard:false});}catch(e){}go('#/challenges');}},'ghost')));
    mount(shell);
    const deadline=Date.now()+Number(j.duration_seconds||300)*1000;
    function draw(){
      locked=false;err.textContent='';
      const q=questions[index];progress.textContent='Question '+(index+1)+' of '+questions.length;
      const choices=(q.choices||[]).map((c,i)=>btn(String.fromCharCode(65+i)+'. '+String(c),()=>answer(i),'ghost'));
      area.replaceChildren(h('div',{class:'stack'},h('p',{class:'eyebrow'},esc(q.course||'' )+' • '+esc(q.topic||'')),h('h2',null,q.prompt||'Question'),...choices));
    }
    async function answer(choice){
      if(locked)return;locked=true;
      const q=questions[index],ms=Math.min(7200000,Date.now()-started);
      try{
        const result=await rpc('hub_challenge_submit_answer',{p_match_id:matchId,p_question_index:index,p_answer_key:String(choice),p_response_ms:ms});
        if(result.point_awarded)score++;if(result.correct)correct++;else wrong++;
        answers.push({index,choice,correct:result.correct,point:result.point_awarded});
        scoreEl.textContent=score+' point'+(score===1?'':'s');
        area.append(h('p',{class:'small',style:{color:result.correct?'var(--good)':'var(--bad)'}},result.correct?(result.point_awarded?'Correct — you got the point!':'Correct, but your opponent answered correctly first.'):'Not quite. Your friend can still earn the point.'));
        area.append(btn(index+1<questions.length?'Next question':'Finish challenge',async()=>{if(index+1<questions.length){index++;started=Date.now();draw();}else await finish();}));
      }catch(e){locked=false;err.textContent=e.message||'Answer could not be submitted.';}
    }
    async function finish(){
      try{
        const result=await rpc('hub_challenge_finish',{p_match_id:matchId,p_opt_into_leaderboard:false});
        const rows=result.players||[];
        const cards=rows.map(p=>h('div',{class:'panel stack'},h('b',null,'@'+esc(p.username||p.nickname||'Player')),h('div',{class:'row between'},h('span',null,'Score'),h('strong',null,esc(p.score)+' points')),small('Correct: '+esc(p.correct)+' • Incorrect: '+esc(p.incorrect)),small('Response time: '+Math.round((p.total_response_ms||0)/1000)+'s')));
        if(result.status!=='completed'){
          mount(wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'YOUR ANSWERS ARE IN'),h('h1',null,'Waiting for your opponent'),h('p',null,'Your answers are saved. The full results and explanations unlock when both players finish.')),
            panel(h('h2',null,'Current scores'),...cards),
            h('div',{class:'row wrapr'},btn('Refresh results',()=>finish(),'primary'),btn('Back to Arena',()=>go('#/challenges'),'ghost'))));
          return;
        }
        const qReview=(result.questions||[]).map((q,i)=>panel(h('b',null,(i+1)+'. '+esc(q.prompt)),h('p',{class:'small'},'Correct answer: '+esc((q.choices||[])[Number(q.answer_key)]||q.answer_key)),q.explanation?small(q.explanation):null));
        mount(wrap(h('section',{class:'hero'},h('p',{class:'eyebrow'},'CHALLENGE COMPLETE'),h('h1',null,'Results & analytics'),h('p',null,'Your score: '+score+' points'),h('div',{class:'hero-stats'},h('div',null,h('b',null,correct),h('span',null,'correct answers')),h('div',null,h('b',null,wrong),h('span',null,'incorrect answers')),h('div',null,h('b',null,Math.round(correct/Math.max(1,answers.length)*100)+'%'),h('span',null,'your accuracy')))),
          panel(h('h2',null,'Match results'),...cards),
          panel(h('h2',null,'Answer review'),...qReview),
          h('div',{class:'row wrapr'},btn('Rematch',()=>showCreate(),'primary'),btn('Back to Arena',()=>go('#/challenges'),'ghost'))));
      }catch(e){err.textContent=e.message||'Could not finish challenge.';}
    }
    function tick(){
      const remaining=Math.max(0,deadline-Date.now()),s=Math.ceil(remaining/1000);
      timer.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
      if(remaining<=0){clearInterval(interval);finish();}
    }
    draw();tick();const interval=setInterval(tick,500);
  }

  const originalRenderNav = renderNav;
  renderNav = function(active) {
    originalRenderNav(active==='challenges'?'home':active);
    if(!DB.profile)return;
    const bar=document.querySelector('#nav .in');if(!bar)return;
    if(!bar.querySelector('[data-challenge-nav]')){
      const a=h('a',{href:'#/challenges','data-challenge-nav':'', 'aria-label':'Challenge Arena'},h('span',{class:'challenge-nav-icon'},'⚡'),h('span',null,'Challenges'));
      bar.append(a);
    }
    const link=bar.querySelector('[data-challenge-nav]');
    if(link){link.setAttribute('aria-current',active==='challenges'?'page':'false');}
  };
  const originalRoute = route;
  route = function(){
    const raw=location.hash.replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
    if(raw[0]==='challenges'){
      stopTimer();
      if(!DB.profile){originalRoute();return;}
      renderNav('challenges');
      if(raw[1])matchView(raw[1]);else challengeView();
      return;
    }
    return originalRoute();
  };
  window.addEventListener('hashchange',function(){
    const raw=location.hash.replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
    if(raw[0]==='challenges') route();
  });
  if(location.hash.replace(/^#\/?/,'').startsWith('challenges')) route();
})();
