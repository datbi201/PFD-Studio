const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},colorScheme:'dark'});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept());
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.click('#modDgm');await p.waitForTimeout(300);
 await p.evaluate(()=>{dgSelect([state.dg.shapes[1].id])});
 await p.keyboard.press('Enter');await p.keyboard.type('Hộp ngang cấp');await p.keyboard.press('Escape');
 await p.keyboard.press('Alt+ArrowUp');
 console.log(await p.evaluate(()=>document.getElementById('status').textContent));
 await p.keyboard.press('Control+z');await p.keyboard.press('Control+z');
 console.log('after undo',await p.evaluate(()=>state.dg.shapes.length));
 await p.keyboard.press('Control+y');
 await p.waitForTimeout(900);
 const n=await p.evaluate(()=>state.dg.shapes.length);
 await p.reload();await p.waitForTimeout(800);
 console.log('persist',n,await p.evaluate(()=>({doc:state.meta.doc,n:state.dg.shapes.length})));
 await p.screenshot({path:'/tmp/pfd/r7/test/dg7_dark.png'});
 console.log(errs.join('\n')||'NO ERRORS');await b.close();})();
