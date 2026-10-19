/* Bablo Hub free study-pack engine: browser-side extraction and rule-based drafts. */
(function(){
  const CDN = {
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
    zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
  };
  function load(src){ return new Promise((resolve,reject)=>{ const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load document reader. Check connection.'));document.head.appendChild(s); }); }
  function clean(t){return String(t||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
  async function extract(file){
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='txt'||ext==='html'||ext==='htm'){const t=await file.text();if(ext!=='txt'){const d=new DOMParser().parseFromString(t,'text/html');return clean(d.body.innerText||d.body.textContent);}return clean(t);}
    if(ext==='pdf'){
      if(!window.pdfjsLib) await load(CDN.pdf);
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out=[];
      for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();out.push(c.items.map(x=>x.str).join(' '));}
      const text=clean(out.join('\n\n'));if(text.length<80)throw new Error('This PDF appears scanned or image-only. Text extraction without OCR cannot read it.');return text;
    }
    if(ext==='docx'){
      if(!window.mammoth) await load(CDN.mammoth);
      return clean((await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value);
    }
    if(ext==='pptx'){
      if(!window.JSZip) await load(CDN.zip);
      const z=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>parseInt(a.match(/slide(\d+)/)[1])-parseInt(b.match(/slide(\d+)/)[1]));
      const parts=[];for(const n of names){const xml=await z.files[n].async('text');const d=new DOMParser().parseFromString(xml,'application/xml');parts.push(Array.from(d.getElementsByTagName('a:t')).map(x=>x.textContent).join(' '));}
      return clean(parts.join('\n\n'));
    }
    throw new Error('Supported for automatic extraction: PDF, DOCX, PPTX, TXT and HTML. Legacy DOC/PPT files need conversion first.');
  }
  function generate(text,title,course){
    const paragraphs=clean(text).split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(x=>x.trim()).filter(x=>x.length>=30);
    const unique=[...new Set(paragraphs)].slice(0,250);
    const defs=[];
    unique.forEach(p=>{
      const m=p.match(/^([A-Z][A-Za-z0-9() ,/\-]{2,65}?)\s+(is defined as|are defined as|refers to|means|consists of|is|are)\s+(.{12,240})$/i);
      if(m) defs.push({term:m[1].trim().replace(/[,:;.]$/,''), relation:m[2].toLowerCase(), definition:m[3].trim().replace(/[.]$/,''), source:p});
    });
    const flashcards=[];
    defs.forEach(d=>{if(flashcards.length<80)flashcards.push({front:'What is '+d.term+'?',back:d.definition});});
    unique.forEach(p=>{if(flashcards.length>=80)return;if(p.length<280&&!flashcards.some(f=>f.back===p))flashcards.push({front:'Explain this key point from '+course+':',back:p});});
    const questions=[];
    defs.forEach((d,i)=>{
      if(questions.length>=60)return;
      const distractors=defs.filter((other,j)=>j!==i&&other.definition!==d.definition).map(other=>other.definition);
      const options=[d.definition,...distractors].slice(0,4);
      if(options.length>=2){
        const shuffled=options.map((value,index)=>({value,correct:index===0,sort:(index*7+3)%11})).sort((a,b)=>a.sort-b.sort);
        questions.push({type:'multiple_choice_draft',question:'What is '+d.term+'?',options:shuffled.map(x=>x.value),answer:shuffled.findIndex(x=>x.correct),explanation:'Drafted from a definition in the uploaded source. Verify wording and distractors before publishing.',source_statement:d.source});
      }else{
        questions.push({type:'short_answer_draft',question:'Define or explain '+d.term+'.',options:[],answer:null,expected_answer:d.definition,explanation:'Drafted from the uploaded source. Verify before publishing.',source_statement:d.source});
      }
    });
    const prompts=unique.filter(p=>!defs.some(d=>d.source===p)&&p.length<260);
    prompts.forEach(p=>{
      if(questions.length>=60)return;
      questions.push({type:'short_answer_draft',question:'Explain the following key point in your own words.',options:[],answer:null,expected_answer:p,explanation:'Short-answer review prompt generated from the source statement. Admin should rewrite it into a precise exam question where appropriate.',source_statement:p});
    });
    return {title:title||'Untitled study pack',course,generated_by:'Bablo Hub free rule-based generator',quality_note:'Rule-based draft, not AI. Admin review is required. Definition-based multiple-choice items are only generated when the source contains usable definitions; other items are short-answer review prompts, not exam-ready MCQs.',notes:{title:title||'Study notes',sections:unique.slice(0,120).map((p,i)=>({heading:'Key point '+(i+1),body:p}))},flashcards,questions:questions.slice(0,60),source_chars:text.length};
  }
  window.BabloStudyPack={extract,generate};
})();