const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(700);
 await p.click('#modVec');await p.waitForTimeout(400);
 const S=(wx,wy)=>p.evaluate(([x,y])=>{const r=board.getBoundingClientRect();return{x:r.left+view.x+x*view.k,y:r.top+view.y+y*view.k}},[wx,wy]);

 await p.evaluate(()=>{
  state.shapes=[];
  // hình có tô màu
  const r=vecNewPath(vecFromRect(140,140,380,300),true,"R"); r.fill="#dbeafe"; r.fo=1; r.col="#1d4ed8"; r.sw=2.5;
  // ellipse tô màu + đang được chọn (thấy tay cầm góc + cạnh)
  const e=vecNewPath(vecFromEllipse(620,220,130,90),true,"E"); e.fill="#ffedd5"; e.fo=1; e.col="#c2410c"; e.sw=2.5;
  // đường cong
  vecNewPath([{x:140,y:400,inX:140,inY:400,outX:260,outY:320,type:"smooth"},
              {x:420,y:470,inX:340,outY:560,inY:560,outX:500,outY:380,type:"smooth"},
              {x:700,y:400,inX:640,inY:400,outX:700,outY:400,type:"corner"}],false,"C");
  // chữ vector theo dòng
  const t1=vecNewText(140,520,"point"); t1.text="Chữ vector — xoay, lật, phóng được"; t1.fz=20; t1.b=true; t1.col="#0f2a44";
  // chữ trong vùng
  const t2=vecNewText(140,570,"area"); t2.w=330; t2.h=80; t2.fz=14;
  t2.text="Chữ trong vùng: tự động xuống dòng theo bề rộng hộp, có thể xoay và lật như mọi đối tượng vector khác.";
  t2.fill="#f1f5f9";
  sel=new Set([e.id]);selEdge=null;VEC.pivot=null;renderAll();
 });

 // đo
 await p.keyboard.press('d');await p.waitForTimeout(100);
 const a=await S(760,420), c=await S(980,420), d2=await S(980,300);
 await p.mouse.click(a.x,a.y);await p.mouse.click(c.x,c.y);await p.mouse.click(d2.x,d2.y);
 await p.waitForTimeout(150);
 await p.screenshot({path:__dirname+'/r6b-canvas.png'});

 // menu chuột phải trên ellipse
 await p.keyboard.press('v');await p.waitForTimeout(100);
 const e1=await S(620,220);
 await p.mouse.click(e1.x,e1.y,{button:'right'});
 await p.waitForTimeout(250);
 await p.screenshot({path:__dirname+'/r6b-menu.png'});
 await p.keyboard.press('Escape');

 // chế độ A + chữ được chọn
 await p.evaluate(()=>{const t=state.shapes.filter(h=>h.t==="vtext")[0];sel=new Set([t.id]);renderAll()});
 await p.waitForTimeout(200);
 await p.screenshot({path:__dirname+'/r6b-text.png'});
 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
