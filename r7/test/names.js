const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const o=new Set();const CX='Công nghiệp khác (hoá chất · nước · khoáng · điện · thực phẩm)';o.add(CX);Object.entries(SYMBOLS).forEach(([k,s])=>{if(s.cat===CX){o.add(s.label);s.vars.forEach(v=>o.add(v.n.replace(/^[A-Z] — /,'')))}else s.vars.forEach(v=>{if(v.isnew)o.add(v.n.replace(/^[A-Z] — /,''))})});o.add('Thiết bị tuỳ chỉnh');o.add('Tuỳ chỉnh');return[...o]});
console.log(r.join('\n'));await b.close()})();
