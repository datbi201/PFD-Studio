const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const out=await p.evaluate(async()=>{
  setLang('en');
  const VI=/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const found=new Map();
  const add=(s,ctx)=>{if(s&&VI.test(s)&&!found.has(s))found.set(s,ctx)};
  const scan=ctx=>{document.querySelectorAll('details').forEach(d=>d.open=true);
   const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
   while(n=w.nextNode()){
    if(n.nodeType===3){const p=n.parentNode;if(p.closest('svg,.nt,script,style,textarea,#printRoot,#ppView,.hv'))continue;add(n.data.trim(),ctx)}
    else{if(n.closest('svg,.nt,#printRoot,#ppView,.hv'))continue;['title','placeholder','aria-label'].forEach(a=>add(n.getAttribute(a),ctx+'@'+a));if(n.tagName==='OPTION')add(n.textContent,ctx+'opt')}}
   // svg text (drawing)
   document.querySelectorAll('#wrap svg text, #ppView svg text').forEach(t=>add(t.textContent,ctx+'@svg'));};
  const tick=()=>new Promise(r=>setTimeout(r,30));
  scan('base');
  for(const f of ['openRevs','openFonts','openHist','openStreams','openEquip','openDescribe','openPrint','openChecks']){try{window[f]&&window[f]();}catch(e){add('ERR '+f+e.message,'')}await tick();scan(f);closeModals()}
  document.querySelectorAll('.modal').forEach(m=>{m.classList.add('open');scan('modal '+m.id);m.classList.remove('open')});
  for(const t of ['turbo','chain','crude','sep','gas']){loadTemplate(t);renderAll();await tick();scan('tpl '+t);
   for(const n of state.nodes){sel=new Set([n.id]);selEdge=null;renderAll();await tick();scan('node '+n.type)}
   for(const e of state.edges){sel=new Set();selEdge=e.id;renderAll();await tick();scan('edge '+e.kind)}
   sel=new Set(state.nodes.map(n=>n.id));selEdge=null;renderAll();await tick();scan('multi');
   for(const k of Object.keys(TEMPLATES)){state.meta.template=k;state.meta.showTable=true;renderAll();scan('sheet '+k)}
   sel=new Set();renderAll();
   try{runChecks&&openChecks&&openChecks()}catch(e){}scan('checks '+t);closeModals();
   try{openDescribe()}catch(e){}scan('desc '+t);closeModals();
  }
  // search palette & varied
  return [...found.entries()];
 });
 fs.writeFileSync('en_left.json',JSON.stringify(out,null,1));console.log(out.length);
 console.log(errs.join('\n'));
 await b.close();
})();
