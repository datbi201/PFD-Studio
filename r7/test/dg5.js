const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1500,height:900}})).newPage();
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.click('#modDgm');await p.evaluate(()=>dgLoadTemplate('blank'));
 await p.click('.dgpal[data-k="rect"]');await p.keyboard.press('Escape');await p.click('.dgpal[data-k="ellipse"]');await p.keyboard.press('Escape');
 await p.evaluate(()=>{state.dg.shapes[1].x=state.dg.shapes[0].x+300;state.dg.shapes[1].y=state.dg.shapes[0].y+100;renderAll();fitView()});
 const r=await p.evaluate(()=>{const s=dgGet(state.dg.shapes[1].id),k=view.k,r=board.getBoundingClientRect();const x=r.left+view.x+(s.x+s.w/2)*k,y=r.top+view.y+(s.y+s.h/2)*k;return{x,y,els:document.elementsFromPoint(x,y).map(e=>e.tagName+'.'+(e.getAttribute('class')||'')+(e.dataset&&e.dataset.did?'#'+e.dataset.did:'')).slice(0,6)}});
 console.log(r);await b.close();})();
