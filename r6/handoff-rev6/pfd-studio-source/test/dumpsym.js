const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(300);
 const o=await p.evaluate(()=>({
  sym:Object.entries(SYMBOLS).map(([k,s])=>[k,s.cat,s.label,s.vars.map(v=>v.n)]),
  cats:CAT_ORDER,
  std:Object.entries(PIPE_STD).map(([k,v])=>[k,v.name]),
  mats:MATS.map(m=>[m[0],m[1],m[2]]),
  phase:Object.entries(PHASE).map(([k,v])=>[k,v.n]),
  kinds:Object.entries(KINDS),
  sheets:Object.entries(SHEETS).map(([k,v])=>[k,v.n]),
  tpl:Object.entries(TEMPLATES).map(([k,v])=>[k,v.n||v.name||JSON.stringify(Object.keys(v))]),
  shapes:SHAPE_T,transport:TRANSPORT,
  quick:typeof PARAM_QUICK!=='undefined'?PARAM_QUICK:null,
  fonts:FONT_LIST,fdefs:Object.keys(FONT_DEFS).map(k=>[k,FONT_DEFS[k].n||FONT_DEFS[k].label||'']),
  dashes:typeof DASHES!=='undefined'?DASHES:null,
  units:Object.entries(UNITS).map(([k,v])=>[k,JSON.stringify(v).slice(0,120)])
 }));
 fs.writeFileSync(__dirname+'/syms.json',JSON.stringify(o,null,1));
 console.log(o.sym.length,o.sym.reduce((a,s)=>a+s[3].length,0));
 await b.close();
})();
