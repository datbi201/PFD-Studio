const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const tpl=process.argv[2]||'gas';
 await p.evaluate(t=>{loadTemplate(t);Object.assign(state.meta,{company:'PETRO-VN EPC Co.',client:'Dự án Khí Nam Côn Sơn',project:'Nén khí + làm khô TEG — Việt Nam',drawnBy:'Đặng Bình',checkedBy:'NVA',approvedBy:'TTB',template:'iso',showTable:true,revs:[{r:'A',date:'2026-09-01',desc:'Phát hành để xem xét',by:'DB',chk:'NVA',app:'TTB'}]});syncMetaUI();renderAll();fitToSheet();openPrint()},tpl);
 await p.waitForTimeout(300);
 const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>downloadPDF())]);
 await d.saveAs('vec_'+tpl+'.pdf');
 console.log('size',fs.statSync('vec_'+tpl+'.pdf').size);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
