/* Course analytics: transparent summaries from the locally available question bank and recorded attempts. */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function node(t,txt,cls){const n=document.createElement(t);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n}
function button(p,t,fn){const b=node('button',t);b.style.cssText='padding:11px 15px;border-radius:11px;border:1px solid #cda954;background:#dcb75f;color:#172033;font-weight:800;margin:6px 5px 6px 0';b.onclick=fn;p.append(b)}
function records(){const out=[];try{(window.DB?.history||[]).forEach(x=>out.push(x))}catch(_){}try{const a=JSON.parse(localStorage.getItem('bablo-ghost-v1-index')||'[]');a.forEach(x=>out.push(x))}catch(_){}return out}
function allCourses(){const bank=window.__BANK__||[];return [...new Set(bank.map(q=>String(q.c||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
function summarize(course,history){const qs=(window.__BANK__||[]).filter(q=>String(q.c||'').trim()===course&&q.q&&Array.isArray(q.o)&&q.o.length>1&&q.a!==undefined);const rows=history.filter(x=>String(x.course||x.c||'').trim()===course);let attempts=0,correct=0;rows.forEach(x=>{const n=Number(x.n??x.total??x.question_count??1);const c=Number(x.correct??x.score_correct??(x.is_correct?1:0));if(Number.isFinite(n))attempts+=n;if(Number.isFinite(c))correct+=c});const pct=attempts?Math.round(correct/attempts*100):null;const last=rows.reduce((m,x)=>Math.max(m,Number(x.ts||x.created_at||x.timestamp||0)),0);return{course,available:qs.length,records:rows.length,attempts,correct,pct,last,rows}}
function open(){const root=$('#challenge-dashboard')||document.getElementById('app')||document.body;let layer=document.getElementById('bablo-course-analytics');if(layer)layer.remove();layer=node('main');layer.id='bablo-course-analytics';layer.style.cssText='position:fixed;inset:0;z-index:2147483500;overflow:auto;padding:18px;background:#0b1424;color:#f7f5ef;font:15px/1.5 system-ui';const wrap=node('div');wrap.style.maxWidth='1000px';wrap.style.margin='auto';layer.append(wrap);wrap.append(node('p','BABLO HUB · LEARNING INSIGHTS',''));const h=node('h1','Course Analytics');h.style.color='#f0cf83';wrap.append(h,node('p','Course coverage and recorded practice performance across every course. Only saved attempts are counted; question-bank size is not treated as mastery.'));const history=records(),courses=allCourses(),data=courses.map(c=>summarize(c,history));const attempts=data.reduce((a,x)=>a+x.attempts,0),correct=data.reduce((a,x)=>a+x.correct,0),active=data.filter(x=>x.records).length;const stats=node('section');stats.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px';[[courses.length,'Courses available'],[active,'Courses with records'],[attempts,'Recorded answers'],[attempts?Math.round(correct/attempts*100)+'%':'—','Recorded accuracy']].forEach(([v,l])=>{let c=node('article');c.style.cssText='background:#17263b;border:1px solid #394b64;border-radius:14px;padding:15px';let b=node('b',String(v));b.style.cssText='display:block;font-size:1.6rem;color:#e6bf68';c.append(b,node('span',l));stats.append(c)});wrap.append(stats);const list=node('section');list.style.cssText='margin-top:18px';list.append(node('h2','All courses'));data.forEach(x=>{let card=node('article');card.style.cssText='background:#17263b;border:1px solid #394b64;border-radius:14px;padding:15px;margin:10px 0';let head=node('div');head.style.cssText='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap';head.append(node('strong',x.course),node('b',x.pct===null?'No recorded attempts':x.pct+'% recorded accuracy'));card.append(head,node('p',x.available+' usable questions in the local bank · '+x.records+' recorded sessions · '+x.attempts+' answers counted'));if(x.attempts){let bar=node('div');bar.style.cssText='height:9px;border-radius:9px;background:#34445b;overflow:hidden';let fill=node('div');fill.style.cssText='height:100%;width:'+Math.max(0,Math.min(100,x.pct))+'%;background:#dcb75f';bar.append(fill);card.append(bar)}list.append(card)});wrap.append(list);const note=node('p','Accuracy is calculated only where saved records contain a course and answer totals. Some older records may not expose per-question detail, so topic-level weakness and mastery are not inferred from incomplete data.');note.style.color='#c0cad8';wrap.append(note);
const synced=node('section');synced.style.cssText='margin-top:18px;background:#17263b;border:1px solid #394b64;border-radius:14px;padding:15px';
synced.append(node('h2','Synced account analytics'));
const account=window.DB?.account;
if(account?.token&&typeof window.hubCall==='function'){
  synced.append(node('p','Loading your saved course scores…'));
  wrap.append(synced);
  Promise.resolve(window.hubCall('hub_course_analytics',{p_token:account.token,p_days:365})).then(payload=>{
    const items=payload?.courses||payload?.data?.courses||[];
    synced.replaceChildren(node('h2','Synced account analytics'));
    if(!items.length){synced.append(node('p','No saved account-linked course attempts were found in this period.'));return;}
    items.forEach(item=>{
      const row=node('div');row.style.cssText='display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 0;border-top:1px solid #394b64';
      row.append(node('strong',item.course),node('span',String(item.average_accuracy??'—')+'% average · '+String(item.best_accuracy??'—')+'% best · '+item.attempts+' attempts'));
      row.append(node('small', 'Average time '+(item.average_seconds??'—')+'s'));
      synced.append(row);
    });
  }).catch(err=>{
    synced.replaceChildren(node('h2','Synced account analytics'),node('p','Account sync is temporarily unavailable. Local saved-attempt analytics remain available above.'));
    console.warn('[Bablo course analytics sync]',err);
  });
}else{
  synced.append(node('p','Sign in to see saved account-linked course scores across devices.'));
  wrap.append(synced);
}
button(wrap,'Refresh analytics',open);button(wrap,'Back to Challenge Arena',()=>layer.remove());root.append(layer)}
window.BabloCourseAnalytics={open};
})();