const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{setTheme('dark');setLang('en');setModule('cad')});await p.waitForTimeout(300);
 for(const c of ['rec','1000,1500','@4000,3000','c','3000,3000','800','d','1000,1500','5000,1500','3000,800'])await p.evaluate(c=>cadSubmit(c),c);
 await p.evaluate(()=>fitView());await p.waitForTimeout(200);
 await p.screenshot({path:'fin_cad_dark_en.png'});
 await p.evaluate(()=>toggleHelp(true));await p.waitForTimeout(150);await p.screenshot({path:'fin_help_cad_dark_en.png'});
 await p.evaluate(()=>renderHelp('faq'));await p.screenshot({path:'fin_faq_dark_en.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();
})();
