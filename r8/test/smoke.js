const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(800);
 await p.screenshot({path:'/tmp/pfd/r7/test/s1.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 console.log(await p.evaluate(()=>({nodes:state.nodes.length,edges:state.edges.length,palCats:document.querySelectorAll('#palette details').length})));
 await b.close();
})();
