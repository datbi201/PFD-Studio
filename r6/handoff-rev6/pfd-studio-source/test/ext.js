const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const out=await p.evaluate(async()=>{
  const VI=/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const keys=new Set();
  const add=s=>{if(!s)return;const m=/^([^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u.exec(s);if(m&&m[2]&&VI.test(m[2]))keys.add(m[2])};
  const scan=()=>{document.querySelectorAll('details').forEach(d=>d.open=true);
   const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
   while(n=w.nextNode()){
    if(n.nodeType===3){const p=n.parentNode;if(p.closest('svg,.nt,script,style,textarea,#printRoot,#ppView'))continue;add(n.data)}
    else{if(n.closest('svg,.nt,#printRoot,#ppView'))continue;['title','placeholder','aria-label'].forEach(a=>add(n.getAttribute(a)))}}};
  scan();
  // modals
  for(const f of ['openRevs','openFonts','openHist','openStreams','openEquip','openDescribe','openPrint','openChecks']){try{window[f]&&window[f]();}catch(e){}scan();closeModals()}
  document.querySelectorAll('.modal').forEach(m=>{m.classList.add('open');scan();m.classList.remove('open')});
  // props for different selections
  loadTemplate('turbo');renderAll();
  for(const n of state.nodes){sel=new Set([n.id]);selEdge=null;renderAll();scan()}
  for(const e of state.edges){sel=new Set();selEdge=e.id;renderAll();scan()}
  sel=new Set(state.nodes.map(n=>n.id));selEdge=null;renderAll();scan();
  for(const t of ['line','arrow','rect','ellipse','poly','pen']){try{state.shapes.push(mkShape?mkShape(t,[0,0],[100,100]):null)}catch(e){}}
  scan();
  return [...keys];
 });
 fs.writeFileSync('ui_keys.json',JSON.stringify(out,null,1));console.log(out.length);
 await b.close();
})();
