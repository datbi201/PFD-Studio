const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:900},acceptDownloads:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));p.on('dialog',d=>d.accept());
 await p.goto('file:///tmp/pfd/r7/test/rev7.html');await p.waitForTimeout(400);
 await p.click('#modDgm');
 await p.evaluate(()=>{
  state.dg.shapes=[];state.dg.conns=[];
  const M=(k,x,y,o)=>{const s=dgNewShape(k,x,y,o);state.dg.shapes.push(s);return s};
  const a=M('rect',0,0,{tx:"**Tiêu đề dài** của một hộp văn bản có nhiều chữ tiếng Việt: Nguyễn Thị Thuận, Đặng Văn Tuyển, Phạm Quỳnh\n- Gạch đầu dòng một rất dài để kiểm tra ngắt dòng\n- Mục hai *nghiêng* và __gạch chân__",w:260,h:130,ta:"l",tv:"t",fs:10,af:false});
  const b=M('roundRect',0,220,{tx:"Căn đều hai bên: Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore",w:260,h:100,ta:"j",fs:10,ff:"Times New Roman"});
  const c=M('text',340,0,{tx:"Hộp văn bản tự co chiều cao: dòng một\ndòng hai rất dài để ngắt dòng khi vượt quá chiều rộng hộp",w:150,af:true});dgAutoFit(c);
  const d=M('fcDecision',340,200,{tx:"Đạt yêu cầu?",w:150,h:100,ff:"Courier New",fb:true});
  const e=M('rect',600,0,{tx:"Đích",w:100,h:60});const f=M('rect',600,200,{tx:"Xoay 30°",w:120,h:60,rot:30});
  const ids=new Set(state.dg.shapes.map(s=>s.id));
  [{s:{id:a.id,p:1},e:{id:e.id,p:0},tx:"nhãn dài"},{s:{id:d.id,p:1},e:{id:f.id,p:3},tx:"Có"},{s:{id:b.id,p:3},e:{id:a.id,p:3}},{s:{id:d.id,p:2},e:{id:e.id,p:2},ty:"cv"},{s:{id:c.id,p:2},e:{id:d.id,p:0}}].forEach((o,i)=>state.dg.conns.push(cleanDgConn({id:"k"+i,ae:"tri",...o},ids)));
  renderAll();fitView();
 });
 await p.waitForTimeout(300);await p.screenshot({path:'/tmp/pfd/r7/test/dg6.png'});
 for(const [fn,n] of [['dgExportPptx','h.pptx'],['dgExportSvg','h.svg']]){const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(fn+'()')]);await d.saveAs('/tmp/pfd/r7/test/'+n)}
 const pg=await ctx.newPage();await pg.goto('file:///tmp/pfd/r7/test/h.svg');const dim=await pg.evaluate(()=>[document.documentElement.width.baseVal.value,document.documentElement.height.baseVal.value]);await pg.setViewportSize({width:Math.ceil(dim[0]),height:Math.ceil(dim[1])});await pg.screenshot({path:'/tmp/pfd/r7/test/h_svg.png'});
 console.log(errs.join('\n')||'NO ERRORS');await b.close();})();
