const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const o={};
  loadTemplate("gas");
  const a=state.nodes[0];
  state.edges.push({id:uid("e"),from:"",fromPort:"",to:"",toPort:"",fp:{x:100,y:900},tp:{x:400,y:1000},num:"",ab:true,as:1.5,props:""});
  state.edges.push({id:uid("e"),from:a.id,fromPort:"e",to:"",toPort:"",tp:{x:a.x+300,y:a.y-200},num:"",props:""});
  const c=mkNode("kiln",1500,200);c.fl="#fca5a5";
  const cs=mkNode("cshape",1500,500);
  renderAll();
  for(const f of ["streamRows","runChecks","autoLayout","openStreams","openChecks","openEquip","openDescribe"]){try{window[f]&&window[f]();o[f]="ok"}catch(e){o[f]="ERR "+e.message+" | "+(e.stack||"").split("\n").slice(1,4).join(" ; ")}}
  try{o.desc=(typeof describeText==="function"?describeText():"").length}catch(e){o.desc="ERR "+e.message}
  try{o.print=typeof openPrint==="function"?(openPrint(),"ok"):"na"}catch(e){o.print="ERR "+e.message}
  return o});
 console.log(JSON.stringify(r));
 await p.waitForTimeout(500);
 const m=await p.evaluate(()=>{const s=document.querySelector("#printRoot");return s?{pages:s.querySelectorAll("svg").length,mk:[...s.querySelectorAll("marker")].length,ids:new Set([...s.querySelectorAll("[id]")].map(x=>x.id)).size,allids:s.querySelectorAll("[id]").length}:null});
 console.log('print',JSON.stringify(m));
 console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close()})();
