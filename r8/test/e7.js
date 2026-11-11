const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(600);
 await p.evaluate(()=>{state=newState();state.meta.showSheet=false;state.meta.snap=true;sel=new Set();selEdge=null;resetHistory();
  const a=mkNode("h_sep",200,200),b2=mkNode("pump",500,200),c=mkNode("exchanger",800,200);
  a.fl="#fde68a";a.ln="#b91c1c";a.ld="dash";
  b2.fl="#bbf7d0";b2.fo=.5;b2.ln="#166534";b2.lw=2;
  c.nb=true;c.fl="#bfdbfe";
  view={x:30,y:30,k:.9};renderAll();});
 const W=async(wx,wy)=>p.evaluate(([x,y])=>{const r=board.getBoundingClientRect();return[r.left+view.x+x*view.k,r.top+view.y+y*view.k]},[wx,wy]);
 // open pipe tool free->free
 await p.evaluate(()=>setTool("open"));
 let [x0,y0]=await W(200,400),[x1,y1]=await W(500,520);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:6});await p.mouse.up();
 console.log('edges after free-free',await p.evaluate(()=>JSON.stringify(state.edges.map(e=>({from:e.from,to:e.to,fp:e.fp,tp:e.tp,num:e.num})))));
 // open from port of pump east to free
 await p.evaluate(()=>setTool("open"));
 const pp=await p.evaluate(()=>{const n=state.nodes[1];const q=portPos(n,"e");return[q.x,q.y]});
 [x0,y0]=await W(pp[0],pp[1]);[x1,y1]=await W(650,300);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:6});await p.mouse.up();
 // two-way on the first edge
 await p.evaluate(()=>{state.edges[0].ab=true;state.edges[0].as=2;renderAll()});
 console.log('edges',await p.evaluate(()=>JSON.stringify(state.edges.map(e=>({from:e.from,fromPort:e.fromPort,to:e.to,fp:e.fp,tp:e.tp})))));
 // line snapping: draw arrow from exchanger west port to (900,330) free
 await p.evaluate(()=>setTool("arrow"));
 const pw=await p.evaluate(()=>{const q=portPos(state.nodes[2],"s");return[q.x,q.y]});
 [x0,y0]=await W(pw[0]+2,pw[1]-2);[x1,y1]=await W(pw[0]+150,pw[1]+90);
 await p.mouse.move(x0,y0);await p.mouse.down();await p.mouse.move(x1,y1,{steps:6});await p.mouse.up();
 console.log('shape',await p.evaluate(()=>JSON.stringify(state.shapes.map(h=>({t:h.t,a0:h.a0,a1:h.a1,pts:h.pts})))));
 // move exchanger and check arrow follows
 await p.evaluate(()=>{state.nodes[2].x+=100;state.nodes[2].y+=50;renderAll()});
 console.log('shape after move',await p.evaluate(()=>JSON.stringify(state.shapes.map(h=>h.pts))));
 // rect -> device
 await p.evaluate(()=>{const h={id:uid("s"),t:"rect",pts:[{x:300,y:600},{x:420,y:680}],col:"#17202a",sw:2,dash:"",fill:"#fca5a5",fo:.5,ah:0,closed:true,rx:6,z:"f"};state.shapes.push(h);
  const h2={id:uid("s"),t:"ellipse",pts:[{x:560,y:600},{x:680,y:680}],col:"#7c3aed",sw:0,dash:"dot",fill:"#c4b5fd",fo:.7,ah:0,closed:true,rx:0,z:"f",nb:true};state.shapes.push(h2);
  const h3={id:uid("s"),t:"poly",pts:[{x:800,y:700},{x:860,y:600},{x:920,y:700}],col:"#17202a",sw:2,dash:"",fill:"#fde68a",fo:1,ah:0,closed:true,rx:0,z:"f"};state.shapes.push(h3);
  const n=shapeToDevice(h);addPortTo(n,"e",.5);addPortTo(n,"w",.5);
  const h4=state.shapes.find(x=>x.t==="poly");const n2=shapeToDevice(h4);addPortTo(n2,"s",.5);
  commit("t");renderAll()});
 await p.screenshot({path:'/tmp/pfd/r7/test/f1.png'});
 const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>downloadPDF())]);
 await d.saveAs('/tmp/pfd/r7/test/e7.pdf');
 // svg export markup check
 const svgInfo=await p.evaluate(()=>{const o={};try{const f=typeof exportSVGString==='function'?exportSVGString():null;o.len=f?f.length:null}catch(e){o.err=e.message}return o});
 console.log('svg',JSON.stringify(svgInfo));
 await p.evaluate(()=>{state.meta.bw=true;renderAll()});
 await p.screenshot({path:'/tmp/pfd/r7/test/f1bw.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
