const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(300);
 const want=process.argv.slice(2);
 const o=await p.evaluate((want)=>{const r={};Object.entries(SYMBOLS).forEach(([k,s])=>{if(want.length&&!want.includes(k))return;r[k]={prefix:s.prefix,bub:!!s.bub,vars:s.vars.map(v=>({n:v.n,w:v.def.w,h:v.def.h,ports:v.def.ports.map(q=>q.id+':'+q.x+','+q.y+q.d)}))}});return r},want);
 console.log(JSON.stringify(o,null,0).replace(/\},\{/g,'},\n  {').replace(/"(\w+)":\{"prefix/g,'\n$1 {"prefix'));
 await b.close();
})();
