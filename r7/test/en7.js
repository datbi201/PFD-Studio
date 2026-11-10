const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 await p.evaluate(()=>setLang("en"));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const re=/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;const bad=new Set();
  for(const k in SYMBOLS){const t=SYMBOLS[k];if(re.test(T_(t.label)))bad.add("L:"+t.label);if(re.test(T_(t.cat||"")))bad.add("C:"+t.cat);(t.vars||[]).forEach(v=>{if(re.test(T_(v.n)))bad.add("V:"+v.n)})}
  const ui=[...document.querySelectorAll("button,label,.sect,h2,option")].map(e=>e.textContent.trim()).filter(x=>re.test(x));
  return{bad:[...bad],ui:[...new Set(ui)].slice(0,40)}});
 console.log(JSON.stringify(r,null,1));console.log(errs.join('\n')||'NO ERRORS');await b.close()})();
