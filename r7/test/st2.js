const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const logs=[];p.on('console',m=>logs.push(m.text()));
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{state=newState();
  const a=mkNode("h_sep",150,300),b2=mkNode("valve_gate",400,306),c=mkNode("pump",600,293);
  makeEdge(a.id,"e",b2.id,"w");makeEdge(b2.id,"e",c.id,"w");selEdge=null;sel=new Set();
  const s=straightenPipes.toString();
  straightenPipes();return JSON.stringify(state.nodes.map(n=>[n.x,n.y]))+" sel:"+selEdge+" status:"+document.getElementById("status")?.textContent}));
 await b.close()})();
