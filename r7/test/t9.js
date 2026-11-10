const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{loadTemplate('gas');state.meta.showTable=true;state.meta.template='iso';syncMetaUI();renderAll();fitToSheet();});
 await p.locator('#wrap').screenshot({path:'leg_bl.png'});
 await p.evaluate(()=>{state.meta.legendPos='br';renderAll();fitToSheet()});
 await p.locator('#wrap').screenshot({path:'leg_br.png'});
 // hide ports + names
 await p.evaluate(()=>{state.meta.legendPos='bl';state.nodes.forEach(n=>{});tidyAllPorts(true);const n=state.nodes.find(n=>n.type==='v_sep');n.ht=true;renderAll();sel=new Set([n.id]);renderAll()});
 await p.waitForTimeout(200);
 await p.screenshot({path:'hide1.png'});
 const info=await p.evaluate(()=>state.nodes.map(n=>n.type+':'+(n.hp||[]).length+'/'+varOf(n).def.ports.length).join(' '));
 console.log(info);
 // JSON roundtrip keeps hp/ht
 const rt=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(drawingData()));loadData(d);return state.nodes.filter(n=>n.hp).length+' hp nodes, '+state.nodes.filter(n=>n.ht).length+' ht nodes, edges '+state.edges.length});
 console.log(rt);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
