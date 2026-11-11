const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 await p.evaluate(()=>{setLang("en");state=newState();resetHistory();mkNode("pump",300,300);mkNode("h_sep",600,300);mkNode("pig",900,300);renderAll()});
 const en=await p.evaluate(()=>[...document.querySelectorAll("#gNodes text, #gNodes .node text")].map(t=>t.textContent).join(" | "));
 console.log('EN:',en);
 const tbl=await p.evaluate(()=>{openEquip();return document.getElementById("equipTbl").innerText.replace(/\s+/g," ")});console.log('EQUIP EN:',tbl.slice(0,200));
 await p.evaluate(()=>setLang("vi"));
 console.log('VI:',await p.evaluate(()=>[...document.querySelectorAll("#gNodes text")].map(t=>t.textContent).join(" | ")));
 console.log(errs.join()||'NO ERRORS');await b.close()})();
