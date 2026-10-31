const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 await p.evaluate(()=>setModule('cad'));
 for(const f of ['scan.png','scan.jpg','scan_rgb.pdf','scan_gray.pdf','scan_flate.pdf','scan_1bit.pdf']){
  await p.evaluate(()=>{state.under=null;underKey="";});
  await p.setInputFiles('#underFile',__dirname+'/'+f);await p.waitForTimeout(700);
  const r=await p.evaluate(()=>({under:!!state.under,data:state.under?(UNDER_DATA[state.under.id]||'').length:0,status:$('status').textContent.slice(0,140)}));
  console.log(f,JSON.stringify(r));
 }
 // use flate pdf, trace
 await p.evaluate(()=>{state.under=null});
 await p.setInputFiles('#underFile',__dirname+'/scan_flate.pdf');await p.waitForTimeout(700);
 await p.evaluate(()=>{state.under.op=.6;underKey="";renderUnder()});
 await p.locator('#wrap').screenshot({path:'under_a.png'});
 await p.evaluate(()=>traceUnder(4,0));await p.waitForTimeout(800);
 console.log(await p.evaluate(()=>state.shapes.length+' lines; '+$('status').textContent.slice(0,200)));
 await p.evaluate(()=>{state.under.vis=false;underKey="";renderAll()});
 await p.locator('#wrap').screenshot({path:'under_b.png'});
 // calibrate: CAL
 await p.evaluate(()=>{state.under.vis=true;underKey="";renderAll()});
 await p.evaluate(()=>{cadSubmit('cal');});
 await p.evaluate(()=>{cadSubmit('2000,2000');cadSubmit('4000,2000');cadSubmit('5000')});
 console.log(await p.evaluate(()=>$('status').textContent));
 // save json incl underData, reload
 const d=await p.evaluate(()=>JSON.stringify(drawingData()));console.log('json kb',Math.round(d.length/1024));
 await p.evaluate(()=>{setModule('pfd')});
 await p.evaluate(d=>{loadData(JSON.parse(d))},d);
 console.log('reloaded under:',await p.evaluate(()=>underOK()+' doc='+state.meta.doc));
 // print include underlay -> PDF
 await p.evaluate(()=>{state.under.print=true;openPrint()});await p.waitForTimeout(400);
 const [pd]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>downloadPDF())]);await pd.saveAs(__dirname+'/under_out.pdf');
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
