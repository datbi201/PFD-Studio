const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{loadTemplate('gas');Object.assign(state.meta,{company:'PETRO-VN EPC Co.',client:'Dự án Khí Nam Côn Sơn',project:'Nén khí + làm khô TEG',drawnBy:'DB',checkedBy:'NVA',approvedBy:'TTB',revs:[{r:'A',date:'2026-09-01',desc:'Issued for review',by:'DB',chk:'NVA',app:'TTB'},{r:'B',date:'2026-10-10',desc:'Updated per HAZOP comments',by:'DB',chk:'NVA',app:'TTB'}]});state.meta.showTable=true;fitToSheet();});
 for(const [tpl,sheet,orient] of [['iso','A3','landscape'],['ansi','ANSI_B','landscape'],['epc','A3','landscape'],['frame','A4','landscape'],['iso','A3','portrait'],['simple','A1','landscape']]){
  await p.evaluate(([t,s,o])=>{state.meta.template=t;state.meta.sheet=s;state.meta.orient=o;syncMetaUI();renderAll();fitView()},[tpl,sheet,orient]);
  await p.locator('#wrap').screenshot({path:`${__dirname}/tpl_${tpl}_${sheet}_${orient}.png`});
 }
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
