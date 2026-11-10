const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(600);
 await p.evaluate(()=>{
  setModule('dgm');
  const ks=Object.keys(DG_PRESET);let i=0;
  ks.forEach(k=>{const P=DG_PRESET[k],st=dgStyle(P.sty||"s8"),col=i%6,row=Math.floor(i/6);
   const s=cleanDgShape({id:"d"+(i+1),k,x:col*230,y:row*150,w:P.w,h:P.h,a:P.adj,b:P.adj2,fl:P.noFill?"":st.fl,ln:P.noFill&&!P.dashed?"":st.ln,lw:1,ld:P.dashed?"dash":"",fc:st.fc,fs:11,
    tx:P.sample||(P.vi+"\n- gạch đầu\n- dòng hai **đậm**"),af:false});
   state.dg.shapes.push(s);i++});
  state.dg.conns.push(cleanDgConn({id:"c1",s:{id:"d4",p:1},e:{id:"d5",p:3},ty:"el",ae:"tri",tx:"Có"},new Set(state.dg.shapes.map(s=>s.id))));
  state.dg.conns.push(cleanDgConn({id:"c2",s:{id:"d4",p:2},e:{id:"d11",p:0},ty:"el",ae:"tri",as:"oval"},new Set(state.dg.shapes.map(s=>s.id))));
  renderAll();fitView();
 });
 await p.waitForTimeout(500);
 await p.screenshot({path:'/tmp/pfd/r7/test/dg1.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 console.log(await p.evaluate(()=>({shapes:state.dg.shapes.length,bbox:dgBBox(),doc:state.meta.doc})));
 await b.close();
})();
