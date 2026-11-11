const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(600);
 await p.evaluate(()=>{state=newState();state.meta.showSheet=false;state.meta.snap=true;resetHistory();
  const a=mkNode("h_sep",150,200),b2=mkNode("pump",550,200);makeEdge(a.id,"e",b2.id,"w");view={x:30,y:30,k:.9};renderAll();setTool("open")});
 const W=async(wx,wy)=>p.evaluate(([x,y])=>{const r=board.getBoundingClientRect();return[r.left+view.x+x*view.k,r.top+view.y+y*view.k]},[wx,wy]);
 const m=await p.evaluate(()=>{const g=edgeGeom(state.edges[0]);return g.pts.map(q=>[q.x,q.y])});console.log(JSON.stringify(m));
 const mid=[(m[0][0]+m[m.length-1][0])/2,m[0][1]];
 let [x0,y0]=await W(350,400),[x1,y1]=await W(mid[0],mid[1]);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:8});
 console.log(await p.evaluate(()=>JSON.stringify(ptr&&{t:ptr.type,a:ptr.a,b:ptr.b,m:ptr.moved})));
 await p.screenshot({path:'/tmp/pfd/r7/test/g2.png'});await p.mouse.up();
 console.log(await p.evaluate(()=>JSON.stringify(state.edges.map(e=>[e.from,e.fromPort,e.to,e.toPort,e.fp,e.tp]))));
 console.log(errs.join('\n')||'NO ERRORS');await b.close()})();
