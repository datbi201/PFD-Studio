const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
const r=await p.evaluate(()=>Object.entries(SYMBOLS).map(([k,s])=>k+' ['+s.cat+'] '+s.vars.map(v=>v.n).join(' | ')));
console.log(r.join('\n'));await b.close()})();
