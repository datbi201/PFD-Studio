const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 const log=(...a)=>console.log(...a);
 const R=await p.evaluate(()=>{const r=board.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height}});
 // draw shapes by mouse
 async function drag(tool,pts){await p.evaluate(t=>setTool(t),tool);await p.mouse.move(pts[0][0],pts[0][1]);await p.mouse.down();for(const q of pts.slice(1)){await p.mouse.move(q[0],q[1],{steps:4})}await p.mouse.up()}
 await drag('line',[[420,620],[620,680]]);
 await drag('arrow',[[650,620],[800,700]]);
 await drag('rect',[[830,620],[950,700]]);
 await drag('ellipse',[[980,620],[1100,700]]);
 // pen
 await p.evaluate(()=>setTool('pen'));await p.mouse.move(420,730);await p.mouse.down();for(let i=0;i<40;i++){await p.mouse.move(420+i*8,730+Math.sin(i/3)*18)}await p.mouse.up();
 // poly
 await p.evaluate(()=>setTool('poly'));
 for(const q of [[700,740],[780,740],[780,790],[700,790]]){await p.mouse.click(q[0],q[1])}
 await p.mouse.click(700,740); // close
 log('shapes:',await p.evaluate(()=>state.shapes.map(h=>h.t+(h.closed?'*':'')+':'+h.pts.length).join(', ')));
 await p.screenshot({path:'/tmp/pfd/r7/test/d1.png'});
 // select last shape & change style
 await p.evaluate(()=>{sel=new Set([state.shapes[2].id]);renderAll()});
 await p.fill('#shSw','4');await p.selectOption('#shDash','dash');await p.check('#shFillOn');
 log('rect style:',await p.evaluate(()=>JSON.stringify({sw:state.shapes[2].sw,dash:state.shapes[2].dash,fill:state.shapes[2].fill})));
 // ports
 await p.evaluate(()=>{const n=state.nodes.find(n=>n.type==='sep3');sel=new Set([n.id]);renderAll()});
 await p.click('[data-addport="n"]');await p.click('[data-addport="s"]');await p.click('[data-addport="s"]');
 log('xp:',await p.evaluate(()=>JSON.stringify(state.nodes.find(n=>n.type==='sep3').xp)));
 const lab=await p.$$('.portrow [data-pf="l"]');await lab[0].fill('GAS LIFT');await lab[0].dispatchEvent('change');
 // connect new port to a product node
 await p.evaluate(()=>{const n=state.nodes.find(n=>n.type==='sep3'),t=mkNode('product',n.x+250,n.y+200,"","DRAIN");const e=newEdge(n.id,n.xp[1].id,t.id,'w','process');e.service='Drain';state.edges.push(e);commit('t');renderAll();fitView()});
 await p.screenshot({path:'/tmp/pfd/r7/test/d2.png'});
 // delete a port with edge -> reassign
 await p.evaluate(()=>{const n=state.nodes.find(n=>n.type==='sep3');sel=new Set([n.id]);renderAll()});
 await p.click('[data-delport="x2"]');
 log('after delport, edges ok:',await p.evaluate(()=>state.edges.every(e=>symDef(getNode(e.from)).ports.some(q=>q.id===e.fromPort)&&symDef(getNode(e.to)).ports.some(q=>q.id===e.toPort))));
 // pipe spec on an edge
 await p.evaluate(()=>{selectEdge(state.edges[1].id)});
 await p.selectOption('#ePs','b3610');await p.selectOption('#ePn','12');
 log('sch options:',await p.$$eval('#ePw option',o=>o.map(x=>x.textContent).join(' ; ')));
 await p.selectOption('#ePw','80');await p.selectOption('#eMat','ss316');
 await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));await p.selectOption('#m_pl','full');
 log('edge:',await p.evaluate(()=>{const e=state.edges[1];return JSON.stringify({std:e.std,nps:e.nps,sch:e.sch,mat:e.mat,calc:pipeCalc(e),lbl:edgeSpecText(e)})}));
 await p.selectOption('#eMat','other');await p.fill('#eMatO','Monel 400');
 log('other mat label:',await p.evaluate(()=>edgeSpecText(state.edges[1])));
 await p.selectOption('#ePs','custom');await p.fill('#ePod','88.9');await p.fill('#ePwl','5.49');
 log('custom calc:',await p.evaluate(()=>JSON.stringify(pipeCalc(state.edges[1]))));
 await p.selectOption('#ePs','tube');
 log('tube sizes:',await p.$$eval('#ePn option',o=>o.length));
 await p.selectOption('#ePs','b3610');
 // unit select
 await p.fill('#eP','85 barg');await p.selectOption('#eUP','psig');
 log('P converted:',await p.evaluate(()=>state.edges[1].P));
 await p.screenshot({path:'/tmp/pfd/r7/test/d3.png'});
 // units switch
 await p.evaluate(()=>setUnits('US'));
 log('US:',await p.evaluate(()=>JSON.stringify({props:state.nodes.filter(n=>n.props).slice(0,3).map(n=>n.props),P:state.edges.filter(e=>e.P).slice(0,2).map(e=>e.P+'|'+e.T)})));
 await p.evaluate(()=>setUnits('SI'));
 log('back SI:',await p.evaluate(()=>JSON.stringify(state.edges.filter(e=>e.P).slice(0,2).map(e=>e.P+'|'+e.T))));
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
