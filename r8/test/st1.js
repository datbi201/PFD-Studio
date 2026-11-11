const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 const jogs=()=>p.evaluate(()=>state.edges.map(e=>{const g=edgeGeom(e);return g?g.pts.length:0}).join(","));
 await p.evaluate(()=>{state=newState();state.meta.showSheet=false;resetHistory();
  const a=mkNode("h_sep",150,300),b2=mkNode("valve_gate",400,306),c=mkNode("pump",600,293),d=mkNode("exchanger",850,300),e=mkNode("v_sep",650,600);
  makeEdge(a.id,"e",b2.id,"w");makeEdge(b2.id,"e",c.id,"w");makeEdge(c.id,"e",d.id,"w");makeEdge(c.id,"s",e.id,"n");
  view={x:30,y:30,k:.9};renderAll()});
 console.log('before pts',await jogs(),JSON.stringify(await p.evaluate(()=>state.nodes.map(n=>[n.x,n.y]))));
 await p.screenshot({path:'/tmp/pfd/r7/test/st_a.png'});
 await p.evaluate(()=>{selEdge=null;sel=new Set();renderAll()});await p.keyboard.press("j");
 console.log('after J  pts',await jogs(),JSON.stringify(await p.evaluate(()=>state.nodes.map(n=>[n.x,n.y]))));
 await p.screenshot({path:'/tmp/pfd/r7/test/st_b.png'});
 await p.evaluate(()=>undo());console.log('undo',JSON.stringify(await p.evaluate(()=>state.nodes.map(n=>[n.x,n.y]))));
 // selected single edge with larger offset
 await p.evaluate(()=>{state.nodes[3].y+=120;renderAll();selectEdge(state.edges[2].id)});
 await p.keyboard.press("j");console.log('single edge',JSON.stringify(await p.evaluate(()=>state.nodes.map(n=>[n.x,n.y]))));
 console.log(errs.join('\n')||'NO ERRORS');await b.close()})();
