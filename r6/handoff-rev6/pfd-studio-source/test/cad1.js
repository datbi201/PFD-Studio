const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 await p.evaluate(()=>setModule('cad'));await p.waitForTimeout(200);
 await p.screenshot({path:'cad0.png'});
 const run=async(...cmds)=>{for(const c of cmds){await p.evaluate(c=>cadSubmit(c),c)}};
 // rectangle 1000,1500 -> @4000,3000
 await run('rec','1000,1500','@4000,3000');
 await run('c','3000,3000','800');
 await run('l','1000,6000','@4000,0','@0,800');
 await run('');   // Enter ends line
 await run('a','5500,1500','6000,2300','5500,3000');
 await run('d','1000,1500','5000,1500','3000,800');   // dim horizontal below
 await run('d','5000,1500','5000,4500','5800,3000');  // vertical right
 await run('dal','1000,6000','5000,6800','2500,7600'); // aligned
 await run('dra');
 // radius pick: needs raw; simulate via click with raw
 await p.evaluate(()=>{CAD.cmd.click(u2w({x:3800,y:3000}),{raw:u2w({x:3800,y:3000})});CAD.cmd.click(u2w({x:4600,y:3900}),{})});
 await run('ddi');
 await p.evaluate(()=>{CAD.cmd.click(u2w({x:3000,y:3800}),{raw:u2w({x:3000,y:3800})});CAD.cmd.click(u2w({x:3000,y:5000}),{})});
 // hatch inside rect but outside circle
 await run('h');
 await p.evaluate(()=>{CAD.cmd.click(u2w({x:1500,y:2000}),{typed:true});cadEnter()});
 // text
 await run('t','1200,5200');
 await p.evaluate(()=>{const n=state.nodes[state.nodes.length-1];n.title='Phòng khách\nPhòng 1';renderAll()});
 // offset rect by 200
 await p.evaluate(()=>{sel=new Set()});
 await run('o','200');
 await p.evaluate(()=>{const h=state.shapes.find(s=>s.t==='rect');CAD.cmd.click(u2w({x:1000,y:3000}),{raw:u2w({x:1000,y:3000})});CAD.cmd.click(u2w({x:500,y:3000}),{});cadEnter()});
 const info=await p.evaluate(()=>({shapes:state.shapes.map(h=>h.t),nodes:state.nodes.length,status:$('status').textContent}));
 console.log(JSON.stringify(info));
 await p.evaluate(()=>{fitView();});
 await p.locator('#wrap').screenshot({path:'cad1.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
