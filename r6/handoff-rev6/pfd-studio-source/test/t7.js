const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(400);
 const res=await p.evaluate(()=>{
  const old={app:'PFD Studio',version:3,state:{nodes:[{id:'n1',type:'h_sep',x:300,y:300,tag:'V-1',title:'Sep',props:'P: 10 barg',v:0,w:0},{id:'n3',type:'mixer',x:900,y:300,tag:'M-1',title:'Mx',props:'',v:0},{id:'n2',type:'pump',x:600,y:300,tag:'P-1',title:'Pump',props:'',v:0}],edges:[{id:'e1',from:'n1',fp:'e',to:'n2',tp:'w',kind:'process',size:'8"',service:'Oil'}],meta:{title:'Old',sheet:'A3'},nextStream:2}};
  loadData(old);
  const r=[state.nodes.length+' nodes',state.edges.length+' edges',state.meta.template,state.meta.fonts?'fonts':'nofonts',JSON.stringify(state.nodes.map(n=>n.type)),state.edges[0].size];
  return r.join(' ; ')});
 console.log('rev3 migrate:',res);
 // text node font change + new lib types via UI + shapes
 const r2=await p.evaluate(()=>{
  const out=[];
  loadTemplate('blank');
  for(const t of ['steam_turbine','compressor2','platform','subsea','gas_plant','comp_station','lng_tank','regas','city_gate','power_plant','consumer','valve_station','terminal','storage','truck','rail','ship','container']){
   try{ if(!SYMBOLS[t]) {out.push('MISSING '+t);continue}
     const id=mkNode(t,200+Math.random()*500,200+Math.random()*400,'X'+t.slice(0,3),'t','').id;
     state.nodes.find(n=>n.id===id)}catch(e){out.push('ERR '+t+e.message)}}
  renderAll();
  const tn=mkNode('text',300,300,'','Hello','');state.nodes.find(n=>n.id===tn.id).ff='Times New Roman';state.nodes.find(n=>n.id===tn.id).fz=20;state.nodes.find(n=>n.id===tn.id).b=1;renderAll();
  out.push(document.querySelectorAll('#wrap svg text').length+' svg texts');
  return out.join(' | ')});
 console.log(r2);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
