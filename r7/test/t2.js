const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 const log=(...a)=>console.log(...a);
 // ---- collapse scenario
 await p.evaluate(()=>{sel=new Set(state.nodes.filter(n=>n.type!=='text').map(n=>n.id));renderAll()});
 await p.evaluate(()=>{alignSel('center');alignSel('middle')});
 log('after align both:',await p.evaluate(()=>({ov:overlapPairs(state.nodes),xs:[...new Set(state.nodes.map(n=>n.x))].length,ys:[...new Set(state.nodes.map(n=>n.y))].length})));
 await p.evaluate(()=>{spreadSel(1.2)});
 log('after spread (coincident):',await p.evaluate(()=>({ov:overlapPairs(state.nodes)})));
 await p.screenshot({path:'/tmp/pfd/r7/test/c1.png'});
 await p.evaluate(()=>{autoLayout()});
 log('after autoLayout:',await p.evaluate(()=>({ov:overlapPairs(state.nodes)})));
 await p.evaluate(()=>{fitToSheet()});
 log('after fit:',await p.evaluate(()=>({ov:overlapPairs(state.nodes),sheetOK:state.nodes.every(n=>n.x>0&&n.x<1680&&n.y>0&&n.y<1188)})));
 await p.screenshot({path:'/tmp/pfd/r7/test/c2.png'});
 await p.evaluate(()=>{alignSel('center')});await p.evaluate(()=>{alignSel('dv')});
 log('column then distribute V:',await p.evaluate(()=>({ov:overlapPairs(state.nodes)})));
 await p.evaluate(()=>{deOverlap()});
 log('deOverlap:',await p.evaluate(()=>({ov:overlapPairs(state.nodes)})));
 // history labels
 log('hist:',await p.evaluate(()=>histList().map(h=>h.l).join(' | ')));
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
