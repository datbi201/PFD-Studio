// usage: node sheet.js out.png cat1,cat2 libfiles...
const fs=require('fs');const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const out=process.argv[2];const filt=process.argv[3]||'';const libs=process.argv.slice(4);
(async()=>{
 const stub=`const INK="#17202a";const RS={body:1.8,thin:1.3,edge:2.2,font:12,fk:1};const SCH={ink:"#17202a",fill:"#fff",grey:"#dbe4ee",wat:"#dbeafe"};function textDef(n){return{w:70,h:30,ports:[]}}`;
 const src=libs.map(f=>fs.readFileSync(f,'utf8')).join('\n');
 const html=`<html><body style="margin:8px;background:#fff"><script>${stub}\n${src}\n
 const keys=${JSON.stringify(filt)}.split(',').filter(Boolean);
 const w=document.createElement('div');w.style.cssText='display:grid;grid-template-columns:repeat(5,230px);gap:6px;font:11px Arial';
 Object.entries(SYMBOLS).filter(([k,s])=>!keys.length||keys.includes(k)||keys.includes(s.cat)).forEach(([k,s])=>{s.vars.forEach((v,i)=>{const d=v.def;const el=document.createElement('div');el.style.cssText='border:1px solid #ccc;padding:3px;text-align:center';
  const sc=Math.min(210/(d.w+24),120/(d.h+24));
  el.innerHTML='<svg width="220" height="125" viewBox="'+(-d.w/2-12-(220/sc-d.w-24)/2)+' '+(-d.h/2-12-(125/sc-d.h-24)/2)+' '+(220/sc)+' '+(125/sc)+'">'+sym(d.body,1)+d.ports.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="2.2" fill="#e11"/>').join('')+'</svg><div><b>'+k+'</b> '+v.n+'</div>';w.appendChild(el)})});
 document.body.appendChild(w);
 </script></body></html>`;
 fs.writeFileSync('/tmp/pfd/r7/test/_h.html',html);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1250,height:800},deviceScaleFactor:1.2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///tmp/pfd/r7/test/_h.html');await p.waitForTimeout(200);
 await p.screenshot({path:out,fullPage:true});console.log('errors',errs);await b.close();
})();
