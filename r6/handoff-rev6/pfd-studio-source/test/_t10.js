const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto('file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html');await p.waitForTimeout(700);
 await p.click('#modVec');await p.waitForTimeout(400);
 console.log('boot:',errs.length?errs.join(' | '):'NO ERRORS');
 const S=(wx,wy)=>p.evaluate(([x,y])=>{const r=board.getBoundingClientRect();return{x:r.left+view.x+x*view.k,y:r.top+view.y+y*view.k}},[wx,wy]);
 const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(90)};

 // dựng 2 hình
 await p.evaluate(()=>{state.shapes=[];vecNewPath(vecFromRect(150,150,350,300),true,"R");
   vecNewPath(vecFromEllipse(600,220,120,80),true,"E");
   sel=new Set([state.shapes[0].id,state.shapes[1].id]);selEdge=null;renderAll()});

 // 9) NHÓM
 await key('Control+g');
 const g1=await p.evaluate(()=>({g:new Set(state.shapes.map(h=>h.g).filter(Boolean)).size,n:state.shapes.filter(h=>h.g).length,status:$('status').textContent.slice(0,40)}));
 console.log('GROUP:',JSON.stringify(g1));
 await key('Control+Shift+g');
 console.log('UNGROUP:',await p.evaluate(()=>state.shapes.filter(h=>h.g).length));

 // 4) ĐỔ MÀU
 await p.evaluate(()=>{const h=state.shapes[0];sel=new Set([h.id]);h.fill="#93c5fd";h.fo=0.8;renderAll()});
 const fillInfo=await p.evaluate(()=>{const g=document.querySelector('[data-shape]');const ps=[...g.querySelectorAll('path')];const el=ps[ps.length-1];return {fill:el.getAttribute('fill'),op:el.getAttribute('fill-opacity')}});
 console.log('FILL:',JSON.stringify(fillInfo));

 // 10) scale cạnh vs góc
 await p.evaluate(()=>{const h=state.shapes[0];sel=new Set([h.id]);VEC.pivot=null;renderAll()});
 const bb1=await p.evaluate(()=>{const b=vecBox(vecSel()[0]);return{w:Math.round(b.x1-b.x0),h:Math.round(b.y1-b.y0)}});
 const eMid=await p.evaluate(()=>{const b=vecBox(vecSel()[0]),r=board.getBoundingClientRect();
   return{x:r.left+view.x+b.x1*view.k,y:r.top+view.y+((b.y0+b.y1)/2)*view.k}});
 await key('v');
 await p.mouse.move(eMid.x,eMid.y);await p.mouse.down();
 await p.mouse.move(eMid.x+90,eMid.y,{steps:8});await p.mouse.up();
 const bb2=await p.evaluate(()=>{const b=vecBox(vecSel()[0]);return{w:Math.round(b.x1-b.x0),h:Math.round(b.y1-b.y0)}});
 console.log('EDGE-SCALE:',JSON.stringify({truoc:bb1,sau:bb2,chiNgang:bb2.w>bb1.w,giuCao:bb2.h===bb1.h}));

 // 2) xoay + shift 45 + góc realtime
 await p.evaluate(()=>{const h=state.shapes[1];sel=new Set([h.id]);VEC.pivot=null;renderAll()});
 const rot=await p.evaluate(()=>{const b=vecUnionBox(vecSel()),r=board.getBoundingClientRect();
   return {corner:{x:r.left+view.x+b.x1*view.k,y:r.top+view.y+b.y1*view.k},
           c:{x:r.left+view.x+((b.x0+b.x1)/2)*view.k,y:r.top+view.y+((b.y0+b.y1)/2)*view.k}}});
 await p.mouse.move(rot.corner.x+12,rot.corner.y+12);await p.mouse.down();
 await p.keyboard.down('Shift');
 await p.mouse.move(rot.c.x+140,rot.c.y+30,{steps:12});
 const live=await p.evaluate(()=>({live:VEC.live&&VEC.live.text,status:$('status').textContent.slice(0,30)}));
 await p.keyboard.up('Shift');await p.mouse.up();
 console.log('ROTATE-LIVE:',JSON.stringify(live));

 // 7) shift snap lưới khi kéo
 await p.evaluate(()=>{const h=state.shapes[1];sel=new Set([h.id]);renderAll()});
 const before=await p.evaluate(()=>{const b=vecBox(vecSel()[0]);return {x:Math.round(b.x0),y:Math.round(b.y0)}});
 const ctr=await p.evaluate(()=>{const b=vecBox(vecSel()[0]),r=board.getBoundingClientRect();
   return{x:r.left+view.x+((b.x0+b.x1)/2)*view.k,y:r.top+view.y+((b.y0+b.y1)/2)*view.k}});
 await key('v');
 await p.mouse.move(ctr.x+20,ctr.y+14);await p.keyboard.down('Shift');await p.mouse.down();
 await p.mouse.move(ctr.x+37,ctr.y+23,{steps:8});await p.mouse.up();await p.keyboard.up('Shift');
 const after=await p.evaluate(()=>{const b=vecBox(vecSel()[0]);return {x:Math.round(b.x0),y:Math.round(b.y0)}});
 console.log('SHIFT-SNAP-GRID:',JSON.stringify({before,after,dx:after.x-before.x,dy:after.y-before.y}));

 // 7b) ctrl nhân bản khi kéo
 const n0=await p.evaluate(()=>state.shapes.length);
 await p.mouse.move(ctr.x+20,ctr.y+14);await p.keyboard.down('Control');await p.mouse.down();
 await p.mouse.move(ctr.x+60,ctr.y+60,{steps:8});await p.mouse.up();await p.keyboard.up('Control');
 const n1=await p.evaluate(()=>state.shapes.length);
 console.log('CTRL-DUP-DRAG:',JSON.stringify({truoc:n0,sau:n1,them:n1-n0}));

 // 5) thước
 const rul=await p.evaluate(()=>({n:document.querySelectorAll('#gRuler *').length}));
 console.log('RULER:',JSON.stringify(rul));

 // 6) đo
 await key('d');
 const m1=await S(200,600), m2=await S(400,600), m3=await S(400,450);
 await p.mouse.click(m1.x,m1.y);await p.mouse.click(m2.x,m2.y);
 const st2=await p.evaluate(()=>$('status').textContent.slice(0,80));
 await p.mouse.click(m3.x,m3.y);
 const st3=await p.evaluate(()=>$('status').textContent.slice(0,80));
 const mEl=await p.evaluate(()=>document.querySelectorAll('#gVec circle').length);
 console.log('MEASURE:',JSON.stringify({st2,st3,marks:mEl}));

 // 3) chữ vector
 await key('t');
 const t1=await S(200,700);
 await p.mouse.click(t1.x,t1.y);
 const txt=await p.evaluate(()=>{const h=state.shapes[state.shapes.length-1];return {t:h.t,mode:h.mode,w:h.w,fz:h.fz,text:(h.text||'').slice(0,20)}});
 console.log('TEXT:',JSON.stringify(txt));
 const tMarkup=await p.evaluate(()=>{const h=state.shapes[state.shapes.length-1];const el=document.querySelector('[data-shape="'+h.id+'"] text');return {has:!!el,txt:el?el.textContent:null}});
 console.log('TEXT-RENDER:',JSON.stringify(tMarkup));

 // 8) menu chuột phải
 const mm=await S(300,250);
 await p.mouse.click(mm.x,mm.y,{button:'right'});
 await p.waitForTimeout(200);
 const menu=await p.evaluate(()=>({open:$('vecMenu').classList.contains('open'),items:document.querySelectorAll('#vecMenu .mi').length}));
 console.log('CTX-MENU:',JSON.stringify(menu));
 await p.keyboard.press('Escape');

 console.log('END:',errs.length?errs.join('\n'):'NO ERRORS');
 await p.screenshot({path:__dirname+'/shot-r6b.png'});
 await b.close();
})();
