const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const out=await p.evaluate(async()=>{
  const VI=/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const found=new Map();const add=(s,ctx)=>{if(s&&VI.test(s)&&!found.has(s))found.set(s,ctx)};
  const tick=()=>new Promise(r=>setTimeout(r,40));
  const scan=ctx=>{document.querySelectorAll('details').forEach(d=>d.open=true);
   const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
   while(n=w.nextNode()){
    if(n.nodeType===3){const q=n.parentNode;if(q.closest('svg,.nt,script,style,textarea,#printRoot,#ppView,.hv'))continue;add(n.data.trim(),ctx)}
    else{if(n.closest('svg,.nt,#printRoot,#ppView,.hv'))continue;['title','placeholder','aria-label'].forEach(a=>add(n.getAttribute(a),ctx+'@'+a));if(n.tagName==='OPTION')add(n.textContent,ctx+'opt');if(n.tagName==='INPUT'&&n.type==='text')add(n.value,ctx+'@val')}}};
  const status=()=>{const s=document.getElementById('status');return s?s.textContent:''};
  setLang('en');setModule('cad');await tick();scan('cad base');
  add(status(),'status0');
  const run=async(...cs)=>{for(const c of cs){cadSubmit(c);await tick();add(status(),'status '+c);add(document.getElementById('cadPrompt').textContent,'prompt '+c)}};
  // go through every command
  for(const c of Object.keys(CMDS)){ if(['print','dxfout','dxfin','describe'].includes(c))continue;
   try{cadReset(true);cadStart(c);await tick();add(status(),'status start '+c);add(document.getElementById('cadPrompt').textContent,'prompt start '+c);cadReset(true)}catch(e){add('ERR '+c+e.message,'')}}
  await run('rec','1000,1500','@4000,3000','c','3000,3000','800','l','1000,6000','@4000,0','');
  await run('a','5500,1500','6000,2300','5500,3000');await run('d','1000,1500','5000,1500','3000,800');
  await run('t');await run('h');cadReset(true);
  // select each shape and scan panel
  for(const h of state.shapes){sel=new Set([h.id]);renderProps();await tick();scan('shape '+h.t+(h.ds||''));add(shapeBrief?shapeBrief(h):'', 'brief')}
  sel=new Set(state.shapes.map(h=>h.id));renderProps();scan('multi');
  sel=new Set();renderProps();scan('cadprops');
  try{cadDescribe();await tick();scan('desc');closeModals()}catch(e){add('ERR desc '+e.message,'')}
  for(const m of ['layer','all','sel','t_ortho','t_polar','t_snap','t_os','fit','undo','redo'])try{CMDS[m]&&cadStart(m);await tick();add(status(),'status '+m)}catch(e){}
  // underlay panel
  try{renderUnderPanel();scan('under');}catch(e){add('ERR under '+e.message,'')}
  document.querySelectorAll('.modal').forEach(m=>{m.classList.add('open');scan('modal '+m.id);m.classList.remove('open')});
  for(const t of ['guide','cad','keys','faq','about']){toggleHelp(true);renderHelp(t);scan('help '+t);closeModals()}
  return [...found.entries()];
 });
 fs.writeFileSync('en_left2.json',JSON.stringify(out,null,1));console.log(out.length);console.log(errs.join('\n'));await b.close();
})();
