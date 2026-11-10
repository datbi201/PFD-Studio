const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
console.log(await p.evaluate((ks)=>ks.split(',').map(k=>k+': '+SYMBOLS[k].vars.map(v=>v.def.w+'x'+v.def.h).join(' ')).join('\n'),process.argv[2]));await b.close()})();
