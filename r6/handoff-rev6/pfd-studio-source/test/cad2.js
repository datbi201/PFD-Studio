const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const nPfd=await p.evaluate(()=>state.nodes.length);
 await p.click('#modCad');await p.waitForTimeout(200);
 await p.evaluate(()=>{state.meta.snap=false;});
 // helper: world->screen
 const scr=async(ux,uy)=>p.evaluate(([ux,uy])=>{const w=u2w({x:ux,y:uy}),r=board.getBoundingClientRect();return{x:r.left+view.x+w.x*view.k,y:r.top+view.y+w.y*view.k}},[ux,uy]);
 await p.evaluate(()=>{state.meta.snap=true;fitView()});
 // keyboard-driven: type "l" Enter, click two points
 await p.keyboard.type('l');await p.keyboard.press('Enter');
 let a=await scr(2000,2000),c=await scr(6000,2000),d=await scr(6000,5000);
 await p.mouse.click(a.x,a.y);await p.mouse.click(c.x,c.y);await p.mouse.click(d.x,d.y);
 await p.keyboard.press('Escape');
 console.log('after line clicks',await p.evaluate(()=>state.shapes.map(h=>h.t+':'+shapeBrief(h)).join(' | ')));
 // typed polar
 await p.keyboard.type('l');await p.keyboard.press('Enter');
 await p.keyboard.type('8000,2000');await p.keyboard.press('Enter');
 await p.keyboard.type('@3000<60');await p.keyboard.press('Enter');
 await p.keyboard.press('Enter');
 console.log('polar',await p.evaluate(()=>shapeBrief(state.shapes[state.shapes.length-1])));
 // select all + move
 await p.keyboard.press('Escape');
 await p.evaluate(()=>cadSubmit('all'));
 await p.keyboard.type('m');await p.keyboard.press('Enter');
 await p.keyboard.type('0,0');await p.keyboard.press('Enter');
 await p.keyboard.type('@1000,500');await p.keyboard.press('Enter');
 console.log('moved',await p.evaluate(()=>state.shapes.map(h=>shapeBrief(h)).join(' | ')));
 await p.evaluate(()=>{sel=new Set();renderAll()});
 // rotate selected line 90 about its start
 await p.keyboard.type('ro');await p.keyboard.press('Enter');
 console.log('rotate prompt',await p.evaluate(()=>$('status').textContent));
 await p.keyboard.press('Escape');
 // undo / redo
 await p.evaluate(()=>undo());
 console.log('undo',await p.evaluate(()=>state.shapes.map(h=>shapeBrief(h)).join(' | ')));
 await p.evaluate(()=>redo());
 // module switch
 await p.click('#modPfd');await p.waitForTimeout(200);
 const nPfd2=await p.evaluate(()=>state.nodes.length+':'+state.meta.doc);
 await p.click('#modCad');await p.waitForTimeout(200);
 const nCad2=await p.evaluate(()=>state.shapes.length+':'+state.meta.doc);
 console.log('pfd nodes',nPfd,'->',nPfd2,' cad shapes',nCad2);
 // save json & reload
 const dd=await p.evaluate(()=>JSON.stringify(drawingData()));
 await p.evaluate(()=>setModule('pfd'));await p.evaluate(d=>loadData(JSON.parse(d)),dd);
 console.log('load cad json while in pfd ->',await p.evaluate(()=>state.meta.doc+' '+state.shapes.length+' body.cadmode='+document.body.classList.contains('cadmode')));
 // DXF export + import
 const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>exportDXF())]);
 await dl.saveAs(__dirname+'/out.dxf');
 console.log('dxf bytes',fs.statSync(__dirname+'/out.dxf').size);
 // PDF export
 await p.evaluate(()=>{openPrint()});await p.waitForTimeout(500);
 const [pd]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>downloadPDF())]);
 await pd.saveAs(__dirname+'/cad_out.pdf');
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
