const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{loadTemplate('gas')});
 await p.evaluate(()=>openFonts());await p.waitForTimeout(100);
 await p.selectOption('#fontAll',{index:3});await p.evaluate(()=>{fontAllApply();fontScaleAll(1.1);});await p.screenshot({path:'fonts.png'});
 await p.evaluate(()=>{closeModals();openRevs();addRevRow();addRevRow();});await p.screenshot({path:'revs.png'});
 await p.evaluate(()=>{closeModals();openHist();});await p.waitForTimeout(100);
 await p.evaluate(()=>{const tr=document.querySelector('#histList tr[data-i]');tr&&tr.click()});
 await p.evaluate(()=>{closeModals();document.body.classList.add('hc');renderAll()});await p.waitForTimeout(100);
 await p.screenshot({path:'hc.png'});
 await p.evaluate(()=>{document.body.classList.remove('hc');openModal('mSettings')});await p.screenshot({path:'settings.png'});
 // pipe spec dropdown flow on an edge
 const r=await p.evaluate(()=>{closeModals();const e=state.edges[0];selEdge=e.id;sel=new Set();renderAll();const ids=['eStd','eNps','eSch','eMat'].map(i=>!!document.getElementById(i));const nps=document.getElementById('eNps');const opts=nps?nps.options.length:0;return ids.join(',')+' nps options '+opts});
 console.log(r);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
