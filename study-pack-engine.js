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
    const raw=String(text||'').replace(/\r/g,'');
    const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean);
    const isHeading=s=>s.length<=90&&!/[.!?]$/.test(s)&&(/^[A-Z0-9][A-Z0-9 /&,():-]{2,}$/.test(s)||/^(chapter|unit|topic|lecture|module|objectives?|introduction|summary|conclusion|definition|classification|functions?|types|importance|mechanism|causes|effects|structure|properties|examples?)\b/i.test(s));
    const headingLines=lines.filter(isHeading);
    const sentences=raw.split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9])/).map(x=>x.replace(/^[-•*\d.) ]+/,'').trim()).filter(x=>x.length>=35&&x.length<=900);
    const unique=[...new Set(sentences)].slice(0,300);
    const defs=[];
    unique.forEach(p=>{
      const m=p.match(/^([A-Z][A-Za-z0-9() ,/\-]{2,55}?)\s+(is defined as|are defined as|refers to|means|consists of|is|are)\s+(.{15,260})$/i);
      if(m){const term=m[1].trim().replace(/[,:;.]$/,'');const definition=m[3].trim().replace(/[.]$/,'');if(term.split(/\s+/).length<=7&&!defs.some(d=>d.term.toLowerCase()===term.toLowerCase()))defs.push({term,definition,source:p});}
    });
    const notes=[];
    let current=headingLines[0]||'Overview';
    let body=[];
    const flush=()=>{const joined=body.join(' ').trim();if(joined.length>=40)notes.push({heading:current,body:joined.slice(0,1100)});body=[];};
    lines.forEach(line=>{
      if(isHeading(line)){flush();current=line.replace(/[:：]$/,'');}
      else if(line.length>=30)body.push(line.replace(/^[-•*]+\s*/,'')); 
    });
    flush();
    if(!notes.length){for(let i=0;i<unique.length;i+=3){const chunk=unique.slice(i,i+3);if(chunk.length)notes.push({heading:'Key concepts '+(notes.length+1),body:chunk.join(' ').slice(0,1100)});}}
    const flashcards=[];
    defs.slice(0,60).forEach(d=>flashcards.push({front:'Define '+d.term+'.',back:d.definition,source_statement:d.source}));
    unique.forEach(p=>{if(flashcards.length>=80)return;if(p.length>=45&&p.length<=240&&!flashcards.some(f=>f.back.toLowerCase()===p.toLowerCase()))flashcards.push({front:'Explain this concept in '+(course||'this course')+'.',back:p,source_statement:p});});
    const questions=[];
    const definitionTerms=defs.filter(d=>d.term.length<=65&&d.definition.length<=220);
    definitionTerms.forEach((d,i)=>{
      if(questions.length>=50)return;
      const distractors=definitionTerms.filter((x,j)=>j!==i).map(x=>x.term).filter((x,j,a)=>a.findIndex(y=>y.toLowerCase()===x.toLowerCase())===j).slice(0,3);
      const options=[d.term,...distractors];
      if(options.length>=3){
        const shift=(i*3+1)%options.length;const shuffled=options.slice(shift).concat(options.slice(0,shift));const answer=shuffled.findIndex(x=>x===d.term);
        questions.push({type:'multiple_choice_draft',question:'Which term best matches this definition: '+d.definition+'?',options:shuffled,answer,expected_answer:d.term,explanation:'Matched to a definition in the uploaded source. Confirm that the distractors are appropriate for this course.',source_statement:d.source});
      }else{
        questions.push({type:'short_answer_draft',question:'Define '+d.term+'.',options:[],answer:null,expected_answer:d.definition,explanation:'Definition extracted from the uploaded source. Review before publishing.',source_statement:d.source});
      }
    });
    unique.forEach(p=>{
      if(questions.length>=60)return;
      if(defs.some(d=>d.source===p))return;
      const lead=p.split(/[;:,]/)[0].trim();
      if(lead.length>=12&&lead.length<=90&&p.length>65){
        questions.push({type:'short_answer_draft',question:'Explain the significance or function of: '+lead+'.',options:[],answer:null,expected_answer:p,explanation:'Source-based review prompt. Check the question wording and expected answer before publishing.',source_statement:p});
      }
    });
    const uniqueNotes=notes.slice(0,100);
    return {
      title:title||'Untitled study pack',course,generated_by:'BH lib source-based draft generator',
      quality_note:'Drafts are built from the uploaded text, not a general-purpose AI. Definitions can become term-matching questions; other material becomes review prompts. Check every answer, distractor and note before publishing.',
      notes:{title:title||'Study notes',sections:uniqueNotes},
      flashcards:flashcards.slice(0,80),questions:questions.slice(0,60),
      source_chars:raw.length,source_headings:headingLines.length,definition_count:defs.length
    };
  }
  window.BabloStudyPack={extract,generate};
})();