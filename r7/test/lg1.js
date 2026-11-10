const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 const mode=process.argv[2]||'a';
 await p.evaluate(m=>{loadTemplate("gas");
  if(m==="a"){state.edges.forEach((e,i)=>{if(i%4===1)e.kind="dashed";if(i%5===2)e.phase=""});const n=state.nodes;state.edges.push(Object.assign(newEdge(n[0].id,"n",n[1].id,"s","signal"),{}));state.edges.push(Object.assign(newEdge(n[1].id,"n",n[2].id,"s","shaft")));state.edges.push(newEdge(n[2].id,"n",n[3].id,"s","road"));state.edges.push(newEdge(n[3].id,"n",n[4].id,"s","rail"));state.edges.push(newEdge(n[4].id,"n",n[5].id,"s","sea"));}
  if(m==="b"){state.edges.forEach(e=>{e.phase="";e.kind="process"})}
  if(m==="c"){state.edges.forEach(e=>{e.phase="gas";e.kind="process"})}
  state.meta.showSheet=true;renderAll();fitView();},mode);
 await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>{const L=sheetLayout();return JSON.stringify({n:L.items.map(i=>i.t+i.k),rows:L.lrows.map(r=>r.length),leg:L.leg})}));
 await p.screenshot({path:'/tmp/pfd/r7/test/lg_'+mode+'.png'});
 for(const [lp,lang] of [["tr","en"],["tl","vi"],["br","vi"]]){await p.evaluate(([a,l])=>{state.meta.legendPos=a;setLang(l);renderAll()},[lp,lang]);await p.screenshot({path:'/tmp/pfd/r7/test/lg_'+mode+lp+'.png'})}
 console.log(errs.join('\n')||'NO ERRORS');await b.close()})();
