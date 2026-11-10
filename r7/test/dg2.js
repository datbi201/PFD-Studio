const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 p.on('dialog',d=>d.accept());
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 await p.click('#modDgm');await p.waitForTimeout(500);
 await p.screenshot({path:'/tmp/pfd/r7/test/dg2a.png'});
 console.log(await p.evaluate(()=>({shapes:state.dg.shapes.length,conns:state.dg.conns.length,bbox:dgBBox()})));
 // add child via keyboard
 await p.evaluate(()=>{dgSelect([state.dg.shapes[0].id])});
 await p.keyboard.press('Tab');await p.waitForTimeout(200);
 await p.keyboard.type('Nguyễn Thị Mới');await p.keyboard.press('Enter');await p.keyboard.type('Kế toán trưởng');await p.keyboard.press('Escape');await p.waitForTimeout(200);
 console.log(await p.evaluate(()=>({shapes:state.dg.shapes.length,last:state.dg.shapes[state.dg.shapes.length-1].tx,conns:state.dg.conns.length,sel:[...dsel]})));
 await p.evaluate(()=>fitView());await p.waitForTimeout(200);
 await p.screenshot({path:'/tmp/pfd/r7/test/dg2b.png'});
 // pptx
 const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>dgExportPptx())]);
 await dl.saveAs('/tmp/pfd/r7/test/out_org.pptx');
 const [dl2]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>dgExportSvg())]);
 await dl2.saveAs('/tmp/pfd/r7/test/out_org.svg');
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
