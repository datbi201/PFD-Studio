const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{setLang('en');loadTemplate('turbo');});await p.waitForTimeout(300);
 await p.evaluate(()=>{sel=new Set([state.nodes.find(n=>n.type==='steam_turbine').id]);renderAll()});await p.waitForTimeout(200);
 await p.screenshot({path:'en1.png'});
 await p.evaluate(()=>{setUnits('US')});await p.waitForTimeout(200);
 await p.evaluate(()=>{sel=new Set();selEdge=state.edges[0].id;renderAll()});await p.waitForTimeout(200);
 await p.screenshot({path:'en2.png'});
 await p.evaluate(()=>{openPrint()});await p.waitForTimeout(300);await p.screenshot({path:'en3.png'});
 // Rev3 JSON migration
 const r3=fs.existsSync(__dirname+'/../base3.html');
 const res=await p.evaluate(()=>{closeModals();setLang('vi');setUnits('SI');
  const old={v:3,nodes:[{id:'n1',type:'v_sep',x:300,y:300,tag:'V-1',title:'Sep',props:'P: 10 barg',v:0},{id:'n2',type:'pump',x:600,y:300,tag:'P-1',title:'Pump',props:'',v:0}],edges:[{id:'e1',from:'n1',fp:'e',to:'n2',tp:'w',kind:'process',size:'8"',service:'Oil'}],meta:{title:'Old'}};
  try{loadJSON?loadJSON(JSON.stringify(old)):0}catch(e){return 'ERR '+e.message}
  return state.nodes.length+' nodes '+state.edges.length+' edges'});
 console.log('rev3 migrate:',res);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
