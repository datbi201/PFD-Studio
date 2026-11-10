const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.keyboard.press('?');await p.waitForTimeout(200);
 console.log('open',await p.evaluate(()=>document.getElementById('help').classList.contains('open')),await p.evaluate(()=>helpTab));
 for(const t of ['guide','cad','keys','faq','about']){
  await p.evaluate(t=>renderHelp(t),t);await p.waitForTimeout(100);
  await p.screenshot({path:`help_${t}.png`});
  console.log(t,await p.evaluate(()=>document.getElementById('hBody').innerText.length));
 }
 await p.evaluate(()=>setLang('en'));await p.waitForTimeout(200);
 await p.evaluate(()=>renderHelp('keys'));await p.screenshot({path:'help_keys_en.png'});
 await p.evaluate(()=>renderHelp('about'));await p.screenshot({path:'help_about_en.png'});
 await p.evaluate(()=>{closeModals();setLang('vi');setModule('cad')});await p.waitForTimeout(200);
 await p.keyboard.press('Escape');
 await p.evaluate(()=>toggleHelp(true));console.log('cad default tab',await p.evaluate(()=>helpTab));
 console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();
})();
