const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{
  const out=[];
  out.push(JSON.stringify(state.meta.unitsDef).slice(0,200));
  out.push(convertSystem('Q 5 MMSCMD, 120 km, 300 mm, 12 m, 2.5 MW, 3000 Sm³/h, 100 m³/h, 15000 m³/d, 80 t/h, 160000 m³, 40 °C','US'));
  state.meta.units='US';state.meta.unitsDef=unitPreset('US');
  out.push(convertSystem('Q 176.6 MMscfd, 75 mi, 12 in, 40 ft, 3350 hp, 105000 scfh, 440 gpm, 94000 bbl/d, 176000 lb/h, 1000000 bbl, 104 °F','SI'));
  state.meta.units='SI';state.meta.unitsDef=unitPreset('SI');
  out.push(autoUnit('85','pressure')+' | '+autoUnit('85 → 100','temperature')+' | '+autoUnit('85 barg','pressure')+' | '+autoUnit('3 × 8','length'));
  // UI flow
  loadTemplate('gas');selEdge=state.edges[0].id;sel=new Set();renderAll();
  const eF=document.getElementById('eF');eF.value='120';eF.dispatchEvent(new Event('change',{bubbles:true}));
  out.push('after change flow='+state.edges[0].flow);
  // setUnits whole
  setUnits('US');out.push('US P='+state.edges[0].P+' T='+state.edges[0].T+' flow='+state.edges[0].flow+' def='+state.meta.unitsDef.pressure+'/'+state.meta.unitsDef.gasFlow);
  setUnits('SI');out.push('SI P='+state.edges[0].P+' T='+state.edges[0].T+' flow='+state.edges[0].flow);
  openModal('mSettings');out.push('udef rows '+document.querySelectorAll('#st_udef select').length);
  setUnitDefault('pressure','bara');out.push(defUnit('pressure'));
  // quick add
  const n=state.nodes.find(n=>n.type==='v_sep');sel=new Set([n.id]);selEdge=null;renderAll();
  const q=document.getElementById('pQuick');q.value='Áp suất thiết kế';q.dispatchEvent(new Event('change',{bubbles:true}));
  out.push('props='+JSON.stringify(document.getElementById('pProps').value));
  return out.join('\n')});
 console.log(r);
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
