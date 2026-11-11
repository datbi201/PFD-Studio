const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const LM=`(e)=>{const g=edgeGeom(e);let bi=0,bl=-1;for(let i=0;i<g.pts.length-1;i++){const l=Math.hypot(g.pts[i+1].x-g.pts[i].x,g.pts[i+1].y-g.pts[i].y);if(l>bl){bl=l;bi=i}}const a=g.pts[bi],b=g.pts[bi+1];return[(a.x+b.x)/2,(a.y+b.y)/2]}`;
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(600);
 await p.evaluate(()=>{state=newState();state.meta.showSheet=false;state.meta.snap=true;sel=new Set();selEdge=null;resetHistory();
  const a=mkNode("h_sep",150,200),b2=mkNode("pump",550,200),c=mkNode("exchanger",550,500),d=mkNode("v_sep",150,520),e=mkNode("pump",900,200);
  makeEdge(a.id,"e",b2.id,"w");makeEdge(b2.id,"e",e.id,"w");
  view={x:30,y:30,k:.9};renderAll();});
 const W=async(wx,wy)=>p.evaluate(([x,y])=>{const r=board.getBoundingClientRect();return[r.left+view.x+x*view.k,r.top+view.y+y*view.k]},[wx,wy]);
 const info=()=>p.evaluate(()=>JSON.stringify(state.edges.map(e=>[e.from.slice(-2),e.fromPort,e.to.slice(-2),e.toPort,e.num,e.fp||0,e.tp||0])));
 console.log('start',await info());
 // 1. select edge 0, drag 'to' handle to exchanger port
 await p.evaluate(()=>selectEdge(state.edges[0].id));
 let hp=await p.evaluate(()=>{const q=endPt(state.edges[0],"to");return[q.x,q.y]});
 let cp=await p.evaluate(()=>{const q=portPos(state.nodes[2],"w");return[q.x,q.y]});
 let [x0,y0]=await W(...hp),[x1,y1]=await W(...cp);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move((x0+x1)/2,(y0+y1)/2,{steps:5});await p.mouse.move(x1,y1,{steps:5});await p.mouse.up();
 console.log('reconnect to exchanger',await info());
 // 2. drag the 'from' end of edge0 to v_sep port n? choose e
 await p.evaluate(()=>selectEdge(state.edges[0].id));
 hp=await p.evaluate(()=>{const q=endPt(state.edges[0],"from");return[q.x,q.y]});
 cp=await p.evaluate(()=>{const q=portPos(state.nodes[3],"e");return[q.x,q.y]});
 [x0,y0]=await W(...hp);[x1,y1]=await W(...cp);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:8});await p.mouse.up();
 console.log('reconnect from v_sep',await info());
 // 3. tee: drag 'to' end of edge0 onto the middle of edge1 (pump->pump)
 await p.evaluate(()=>{selectEdge(state.edges[0].id)});
 hp=await p.evaluate(()=>{const q=endPt(state.edges[0],"to");return[q.x,q.y]});
 const mid=await p.evaluate(()=>{const g=edgeGeom(state.edges[1]);const a=g.pts[0],b=g.pts[g.pts.length-1];return[(a.x+b.x)/2+3,(a.y+b.y)/2+2]});
 [x0,y0]=await W(...hp);[x1,y1]=await W(...mid);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:8});
 await p.screenshot({path:'/tmp/pfd/r7/test/g1a.png'});
 await p.mouse.up();
 console.log('tee via eend',await info(),'nodes',await p.evaluate(()=>state.nodes.map(n=>n.type).join()));
 // 4. connect tool: from exchanger e port to middle of edge (the first half of tee'd edge)
 await p.evaluate(()=>{setTool("connect")});
 const sp=await p.evaluate(()=>{const q=portPos(state.nodes[2],"s");return[q.x,q.y]});
 const m2=await p.evaluate(`(${LM})(state.edges[0])`);
 [x0,y0]=await W(...sp);[x1,y1]=await W(...m2);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:8});await p.screenshot({path:'/tmp/pfd/r7/test/g1b.png'});await p.mouse.up();
 console.log('connect->tee',await info(),'nodes',await p.evaluate(()=>state.nodes.map(n=>n.type).join()));
 // 5. open tool: from free point to middle of exchanger edge
 await p.evaluate(()=>setTool("open"));
 [x0,y0]=await W(1100,450);const m3=await p.evaluate(`(${LM})(state.edges[2])`);
 [x1,y1]=await W(...m3);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:8});await p.mouse.up();
 console.log('open->tee',await info(),'nodes',await p.evaluate(()=>state.nodes.map(n=>n.type).join()));
 await p.evaluate(()=>{setTool("select");sel=new Set();selEdge=null;renderAll()});
 await p.screenshot({path:'/tmp/pfd/r7/test/g1c.png'});
 const chk=await p.evaluate(()=>{runChecks();return state.edges.every(e=>(e.from===""||getNode(e.from))&&(e.to===""||getNode(e.to)))});
 console.log('refs ok',chk);
 await p.evaluate(()=>{undo&&undo();});console.log('undo ok edges',await p.evaluate(()=>state.edges.length));
 console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close()})();
