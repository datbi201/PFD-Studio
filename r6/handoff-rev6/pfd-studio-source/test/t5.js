const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{loadTemplate('gas');state.meta.showTable=true;fitToSheet();});
 await p.evaluate(()=>openPrint());await p.waitForTimeout(300);
 console.log(await p.textContent('#ppInfo'));
 await p.screenshot({path:'pp1.png'});
 // tiling at 100%
 await p.selectOption('#pp_scale','100');await p.selectOption('#pp_paper','A4');await p.waitForTimeout(200);
 console.log('A4 100%:',await p.textContent('#ppInfo'));
 await p.selectOption('#pp_scale','fit');await p.selectOption('#pp_paper','A3');await p.waitForTimeout(200);
 // print via page.pdf under print emulation
 await p.evaluate(()=>{window.print=()=>{window.__printed=1}});
 await p.evaluate(()=>doPrint());await p.waitForTimeout(300);
 const cnt=await p.evaluate(()=>document.querySelectorAll('#printRoot .pp').length);
 await p.emulateMedia({media:'print'});
 await p.pdf({path:'out_print.pdf',preferCSSPageSize:true});
 await p.emulateMedia({media:'screen'});
 console.log('printRoot pages',cnt,'printed flag',await p.evaluate(()=>window.__printed));
 // downloadPDF
 const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>downloadPDF())]);
 await d.saveAs('out_dl.pdf');
 console.log('pdf size',fs.statSync('out_dl.pdf').size,fs.statSync('out_print.pdf').size);
 // dark theme
 await p.evaluate(()=>{closeModals();setTheme('dark')});await p.waitForTimeout(300);
 await p.screenshot({path:'dark1.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
