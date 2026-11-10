const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const CATX_NAME='Công nghiệp khác (hoá chất · nước · khoáng · điện · thực phẩm)';
const sel=process.argv[2]||'new';const out=process.argv[3]||'/tmp/pfd/r7/test/sheet';const per=+process.argv[4]||30;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
const items=await p.evaluate((sel)=>{const a=[];Object.entries(SYMBOLS).forEach(([k,s])=>{s.vars.forEach((v,i)=>{if(sel==='new'?v.isnew:(sel==='newcat'?(s.cat==='Công nghiệp khác (hoá chất · nước · khoáng · điện · thực phẩm)'):k===sel))a.push([k,i,v.n])})});return a},sel);
console.log('items',items.length);
for(let pg=0;pg*per<items.length;pg++){
 const sub=items.slice(pg*per,(pg+1)*per);
 await p.evaluate((sub)=>{
  let h='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px;background:#fff;font:11px Arial">';
  sub.forEach(([k,i,n])=>{const d=SYMBOLS[k].vars[i].def;h+=`<div style="border:1px solid #ccc;padding:4px;text-align:center"><svg viewBox="${-d.w/2-30} ${-d.h/2-14} ${d.w+60} ${d.h+28}" width="220" height="130">${sym(d.body,1)}${d.ports.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3" fill="#f59e0b"/>`).join("")}</svg><div>${k}: ${n}</div></div>`});
  document.body.innerHTML=h+'</div>';document.body.style.background='#fff';document.body.style.display='block';},sub);
 await p.screenshot({path:`${out}${pg+1}.png`,fullPage:true});
}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close()})();
