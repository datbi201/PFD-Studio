const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 p.on('dialog',d=>d.accept());
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(500);
 await p.evaluate(()=>{
  setModule('dgm');state.dg.shapes=[];state.dg.conns=[];
  const ks=Object.keys(DG_PRESET);let i=0;
  ks.forEach(k=>{const P=DG_PRESET[k],st=dgStyle(P.sty||"s8"),col=i%5,row=Math.floor(i/5);
   const s=cleanDgShape({id:"d"+(i+1),k,x:col*230,y:row*150,w:P.w,h:P.h,a:P.adj,b:P.adj2,fl:P.noFill?"":st.fl,ln:P.noFill&&!P.dashed?"":st.ln,lw:1.5,ld:P.dashed?"dash":"",fc:st.fc,fs:11,
    tx:P.sample||(P.vi+"\n**đậm** thường\n- gạch đầu dòng"),af:false});
   state.dg.shapes.push(s);i++});
  const ids=new Set(state.dg.shapes.map(s=>s.id));
  const mk=(o)=>state.dg.conns.push(cleanDgConn(o,ids));
  mk({id:"c1",s:{id:"d1",p:2},e:{id:"d6",p:0},ty:"el",ae:"tri",lw:1.5});
  mk({id:"c2",s:{id:"d2",p:1},e:{id:"d3",p:3},ty:"el",ae:"stealth",as:"oval",tx:"Có"});
  mk({id:"c3",s:{id:"d4",p:2},e:{id:"d9",p:1},ty:"el",ae:"open"});
  mk({id:"c4",s:{id:"d5",p:2},e:{id:"d10",p:0},ty:"cv",ae:"tri"});
  mk({id:"c5",s:{id:"d11",p:3},e:{id:"d12",p:3},ty:"el",ae:"diamond"});
  renderAll();fitView();
 });
 for(const [fn,name] of [['dgExportPptx','gal.pptx'],['dgExportSvg','gal.svg']]){
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(fn+'()')]);await dl.saveAs('/tmp/pfd/r7/test/'+name);}
 const pg=await ctx.newPage();await pg.goto('file:///tmp/pfd/r7/test/gal.svg');
 const dim=await pg.evaluate(()=>{const s=document.documentElement;return[s.width.baseVal.value,s.height.baseVal.value]});
 await pg.setViewportSize({width:Math.ceil(dim[0]),height:Math.ceil(dim[1])});await pg.screenshot({path:'/tmp/pfd/r7/test/gal_svg.png'});
 console.log(dim,errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
