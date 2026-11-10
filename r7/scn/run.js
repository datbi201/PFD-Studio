const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
const name=process.argv[2];
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1900,height:1100},deviceScaleFactor:+process.argv[3]||1});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r6/test/rev6.html');await p.waitForTimeout(500);
 await p.evaluate(fs.readFileSync('/tmp/pfd/r6/scn/prelude.js','utf8'));
 const r=await p.evaluate(fs.readFileSync(`/tmp/pfd/r6/scn/${name}.js`,'utf8'));
 console.log(JSON.stringify(r));
 await p.waitForTimeout(300);
 await p.screenshot({path:`/tmp/pfd/r6/scn/${name}.png`});
 const data=await p.evaluate(()=>JSON.stringify(drawingData()));
 fs.writeFileSync(`/tmp/pfd/r6/scn/${name}.pfd.json`,data);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
