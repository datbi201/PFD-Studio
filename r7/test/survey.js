const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file:///tmp/pfd/r7/test/rev5.html');await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{
  const tags={},attrs={},vals={transform:new Set(),ff:new Set(),marker:new Set(),dash:new Set(),other:new Set(),fill:new Set(),stroke:new Set(),pathcmd:new Set(),fs:new Set()};
  const scan=()=>{
   const src=buildBody({bw:false});
   const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+src.defs+src.body+'</svg>','image/svg+xml');
   if(doc.querySelector('parsererror'))return 'PARSEERR '+doc.querySelector('parsererror').textContent.slice(0,200);
   doc.querySelectorAll('*').forEach(e=>{tags[e.tagName]=(tags[e.tagName]||0)+1;[...e.attributes].forEach(a=>{const k=e.tagName+'@'+a.name;attrs[k]=(attrs[k]||0)+1;
    if(a.name==='transform')vals.transform.add(a.value.replace(/-?[\d.]+/g,'N'));
    if(a.name==='font-family')vals.ff.add(a.value);
    if(/^marker/.test(a.name))vals.marker.add(a.value);
    if(a.name==='stroke-dasharray')vals.dash.add(a.value.replace(/-?[\d.]+/g,'N'));
    if(a.name==='fill')vals.fill.add(a.value.replace(/#[0-9a-fA-F]{6}/g,'#hex'));
    if(a.name==='stroke')vals.stroke.add(a.value.replace(/#[0-9a-fA-F]{6}/g,'#hex'));
    if(a.name==='font-size')vals.fs.add(a.value.replace(/[\d.]+/g,'N'));
    if(a.name==='d'){(a.value.match(/[a-zA-Z]/g)||[]).forEach(c=>vals.pathcmd.add(c))}
    if(!['d','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','width','height','points','fill','stroke','stroke-width','transform','font-family','font-size','font-weight','text-anchor','fill-opacity','stroke-opacity','opacity','stroke-linejoin','stroke-linecap','stroke-dasharray','class','id','style','data-id','data-edge'].includes(a.name))vals.other.add(e.tagName+'@'+a.name)}) });
   return null;
  };
  const out=[];
  for(const t of ['gas','crude','sep','turbo','chain']){loadTemplate(t);state.meta.showTable=true;
   // add shapes
   ['line','arrow','rect','ellipse','poly','pen'].forEach(k=>{try{const s=mkShape(k,[100,100],[200,200]);}catch(e){}});
   renderAll();const e=scan();if(e)out.push(e)}
  // every symbol
  loadTemplate('blank');let y=100;Object.keys(SYMBOLS).forEach((k,i)=>{mkNode(k,100+(i%12)*120,100+Math.floor(i/12)*140,'T'+i,'ttl','a: 1')});renderAll();const e=scan();if(e)out.push(e);
  const ser=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v instanceof Set?[...v].slice(0,40):v]));
  return JSON.stringify({out,tags,attrs,vals:ser(vals)},null,1);
 });
 console.log(r);
 await b.close();
})();
