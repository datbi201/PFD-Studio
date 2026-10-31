/* vec1.js — kiểm thử module Vector (Rev.6a): bút, hình cơ bản, chọn, biến đổi, nhóm, z-order, lưu/mở, xuất PDF */
const { chromium } = require('playwright');
const F='file://'+__dirname.replace(/\\/g,'/')+'/rev6a.html';
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await p.goto(F);await p.waitForTimeout(700);

 const bb=await p.locator('#board').boundingBox();
 const at=(x,y)=>({x:bb.x+x,y:bb.y+y});
 const click=async(x,y,opt)=>{const q=at(x,y);await p.mouse.click(q.x,q.y,opt||{})};
 const drag=async(x0,y0,x1,y1)=>{const a=at(x0,y0),c=at(x1,y1);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(c.x,c.y,{steps:8});await p.mouse.up()};
 const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(60)};
 const S=async()=>p.evaluate(()=>({doc:state.meta.doc,shapes:state.shapes.map(h=>({t:h.t,n:h.nodes?h.nodes.length:0,closed:!!h.closed,g:h.g||null,col:h.col,fill:h.fill})),sel:[...sel],tool:tool,status:($('status')||{}).textContent||''}));

 /* 1. chuyển sang module Vector */
 await p.click('#modVec');await p.waitForTimeout(300);
 const m1=await p.evaluate(()=>({vec:document.body.classList.contains('vecmode'),name:$('appName').textContent,sub:$('appSub').textContent,side:!!document.querySelector('#vecSide'),visible:getComputedStyle(document.querySelector('#vecSide')).display}));
 console.log('MODULE:',JSON.stringify(m1));

 /* 2. bút: 3 điểm neo, trong đó điểm 2 kéo thành đường cong */
 await key('p');
 await click(300,300);
 await p.mouse.move(at(500,300).x,at(500,300).y);await p.mouse.down();
 await p.mouse.move(at(600,420).x,at(600,420).y,{steps:6});await p.mouse.up();  /* bấm-kéo = cong */
 await click(750,300);
 await key('Enter');
 const s1=await S();console.log('PEN:',JSON.stringify(s1.shapes),'sel',s1.sel.length);
 /* bấm-kéo ở điểm thứ 2 PHẢI tạo được tay cầm (lỗi Rev.6a đầu tiên: vecPenMove không được gọi) */
 const penH=await p.evaluate(()=>{const h=state.shapes.find(x=>x.t==='path');
  return {types:h.nodes.map(n=>n.type),
   hasHandle:h.nodes.some(n=>Math.abs(n.outX-n.x)>0.01||Math.abs(n.outY-n.y)>0.01)}});
 console.log('PEN-HANDLES:',JSON.stringify(penH));

 /* 3. hình chữ nhật (M) và ellipse (L) → phải thành path */
 await key('m');await drag(300,500,480,620);
 await key('l');await drag(560,500,720,620);
 const s2=await S();console.log('BASIC:',JSON.stringify(s2.shapes.map(h=>h.t+':'+h.n+':'+h.closed)));

 /* 3b. tương tác chuột THẬT: bấm vào nét path để chọn, rồi kéo dời */
 await key('v');
 await p.evaluate(()=>{sel=new Set();selEdge=null;renderAll()});
 const rectB=await p.evaluate(()=>{const h=state.shapes.find(x=>x.t==='path'&&x.closed&&x.nodes.length===4);const b=vecBox(h);
  /* đổi toạ độ BẢN VẼ sang toạ độ MÀN HÌNH: screen = boardLeft + view.x + world*view.k */
  const r=board.getBoundingClientRect();
  return {id:h.id,cx:(b.x0+b.x1)/2,cy:b.y0,sx:r.left+view.x+((b.x0+b.x1)/2)*view.k,sy:r.top+view.y+b.y0*view.k}});
 await p.mouse.click(rectB.sx, rectB.sy);     /* bấm đúng nét trên của hình chữ nhật */
 const picked=await p.evaluate(()=>[...sel]);
 const before=await p.evaluate(id=>{const h=getShape(id);return {x0:vecBox(h).x0,y0:vecBox(h).y0}},picked[0]||rectB.id);
 await p.mouse.move(rectB.sx,rectB.sy);await p.mouse.down();
 await p.mouse.move(rectB.sx+60,rectB.sy+40,{steps:8});await p.mouse.up();
 const after=await p.evaluate(id=>{const h=getShape(id);return {x0:vecBox(h).x0,y0:vecBox(h).y0}},picked[0]||rectB.id);
 console.log('CLICK+DRAG:',JSON.stringify({picked:picked.length,sameId:picked[0]===rectB.id,dx:Math.round(after.x0-before.x0),dy:Math.round(after.y0-before.y0)}));

 /* 3c. overlay: V chỉ khung bao (không điểm neo) — A mới hiện điểm neo + tay cầm */
 const ovV=await p.evaluate(()=>({n:document.querySelectorAll('#gVec [data-vnode]').length,
  h:document.querySelectorAll('#gVec [data-vhandle]').length,
  b:document.querySelectorAll('#gVec [data-vsh]').length}));
 await key('a');
 /* chọn đường ELLIPSE (có tay cầm) để kiểm tra overlay ở chế độ A */
 await p.evaluate(()=>{const h=state.shapes.find(x=>x.t==='path'&&x.nodes.some(n=>n.type==="smooth"));sel=new Set([h.id]);VEC.nodeSel=null;renderAll()});
 const ovA=await p.evaluate(()=>({n:document.querySelectorAll('#gVec [data-vnode]').length,
  h:document.querySelectorAll('#gVec [data-vhandle]').length}));
 await key('v');
 await p.evaluate(()=>{const h=state.shapes.find(x=>x.t==='path'&&x.nodes.some(n=>n.type==="smooth"));sel=new Set([h.id]);renderAll()});
 const ovV2=await p.evaluate(()=>({n:document.querySelectorAll('#gVec [data-vnode]').length,
  h:document.querySelectorAll('#gVec [data-vhandle]').length,
  b:document.querySelectorAll('#gVec [data-vsh]').length}));
 console.log('OVERLAY V/A:',JSON.stringify({V:ovV2,A:ovA}));

 /* 4. chọn tất cả + xoay 45° + đổi màu */
 await key('Control+a');
 const nSel=(await S()).sel.length;
 await p.evaluate(()=>vecRotateBy(45));
 const rot=await p.evaluate(()=>{const b=vecUnionBox(vecSel());return {n:vecSel().length,w:Math.round(b.x1-b.x0),h:Math.round(b.y1-b.y0)}});
 console.log('SELECT+ROTATE:',JSON.stringify({nSel,rot}));

 /* 5. nhóm / rã nhóm */
 await p.evaluate(()=>vecGroup());
 const g1=await p.evaluate(()=>({g:state.shapes.filter(h=>h.g).length,groups:new Set(state.shapes.map(h=>h.g).filter(Boolean)).size}));
 await p.evaluate(()=>vecUngroup());
 const g2=await p.evaluate(()=>state.shapes.filter(h=>h.g).length);
 console.log('GROUP:',JSON.stringify({after:g1,afterUngroup:g2}));

 /* 6. thứ tự lớp */
 const z0=await p.evaluate(()=>state.shapes.map(h=>h.id).join(','));
 await p.evaluate(()=>{sel=new Set([state.shapes[0].id]);vecZOrder('front')});
 const z1=await p.evaluate(()=>state.shapes.map(h=>h.id).join(','));
 console.log('ZORDER changed:',z0!==z1);

 /* 7. direct selection: thêm + xoá điểm neo */
 const addRes=await p.evaluate(()=>{
  const h=state.shapes.find(x=>x.t==='path');
  const n0=h.nodes.length;
  const near=vecNearestOn(h,{x:h.nodes[0].x+5,y:h.nodes[0].y+5},24);
  vecSplitSeg(h,near.seg,0.5);
  const n1=h.nodes.length;
  vecDelNode(h,1);
  return {n0,n1,n2:h.nodes.length};
 });
 console.log('NODES:',JSON.stringify(addRes));

 /* 8. lưu/mở .vec.json — kiểm tra dữ liệu khớp */
 const rt=await p.evaluate(()=>{
  const d=drawingData();
  const js=JSON.stringify(d);
  const ns=normalizeState(JSON.parse(js).state);
  return {ver:d.version,doc:ns.meta.doc,shapes:ns.shapes.length,paths:ns.shapes.filter(h=>h.t==='path').length,
   nodesSame:ns.shapes.filter(h=>h.t==='path').map(h=>h.nodes.length).join(','),
   vecCfg:!!ns.meta.vec,keyVec:KEYC_VEC};
 });
 console.log('ROUNDTRIP:',JSON.stringify(rt));

 /* 9. xuất SVG + PDF vector — kiểm tra có cung Bézier thật, không phải ảnh raster */
 const svgOut=await p.evaluate(()=>{
  const s=buildExport().svg;
  return {len:s.length,hasPath:/<path/.test(s),hasCurve:/C /.test(s),hasImage:/<image/.test(s)};
 });
 console.log('SVG:',JSON.stringify(svgOut));
 const pdf=await p.evaluate(async()=>{
  const bl=await buildPDF();
  const u8=new Uint8Array(await bl.arrayBuffer());
  let bin='';for(let i=0;i<u8.length;i+=8192)bin+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));
  return {size:u8.length,head:bin.slice(0,8),b64:btoa(bin)};
 });
 require('fs').writeFileSync(__dirname+'/out-vec.pdf',Buffer.from(pdf.b64,'base64'));
 console.log('PDF:',JSON.stringify({size:pdf.size,head:pdf.head}));

 /* 10. tiếng Anh + theme tối, chụp ảnh */
 await p.evaluate(()=>{setLang('en');setTheme('dark')});
 await p.waitForTimeout(500);
 const en=await p.evaluate(()=>({lang:LANG,title:document.title,app:$('appName').textContent}));
 console.log('EN:',JSON.stringify(en));

 /* 10b. quét riêng module Vector: còn chuỗi tiếng Việt nào trong chế độ EN không?
    (enscan.js không bao giờ chuyển sang module Vector nên phải quét riêng ở đây) */
 const viLeft=await p.evaluate(()=>{
  const VI=/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const found=new Set();
  const add=s=>{if(s){const t=String(s).trim();if(t&&VI.test(t)&&!/Bezier/i.test(t))found.add(t)}};
  ['#vecSide','#props','#status','header'].forEach(sel=>{
   const root=document.querySelector(sel);if(!root)return;
   const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
   while(n=w.nextNode()){
    /* .hv = khối tiếng Việt CỐ Ý (ẩn khi lang=en); .nt = "no translate" (nhãn song ngữ,
       số, ký hiệu). Bỏ qua cả hai, giống enscan.js. */
    const el=n.nodeType===3?n.parentNode:n;
    if(el&&el.closest&&el.closest('.hv,.nt,svg'))continue;
    if(n.nodeType===3){add(n.data)}
    else{['title','placeholder','aria-label'].forEach(a=>add(n.getAttribute&&n.getAttribute(a)))}
   }
  });
  return [...found];
 });
 console.log('VI-LEFT:',viLeft.length,JSON.stringify(viLeft.slice(0,8)));
 await p.screenshot({path:__dirname+'/vec1-en-dark.png'});
 await p.evaluate(()=>{setLang('vi');setTheme('light')});
 await p.waitForTimeout(300);
 await p.screenshot({path:__dirname+'/vec1-vi.png'});

 /* 11. quay lại PFD và SimCAD — không được vỡ */
 await p.click('#modPfd');await p.waitForTimeout(300);
 const backPfd=await p.evaluate(()=>({doc:state.meta.doc,nodes:state.nodes.length,cls:document.body.className}));
 await p.click('#modCad');await p.waitForTimeout(300);
 const backCad=await p.evaluate(()=>({doc:state.meta.doc,cls:document.body.className}));
 await p.click('#modVec');await p.waitForTimeout(300);
 const backVec=await p.evaluate(()=>({doc:state.meta.doc,shapes:state.shapes.length}));
 console.log('MODULE-SWITCH:',JSON.stringify({backPfd,backCad,backVec}));

 console.log(errs.length?errs.join('\n'):'NO ERRORS');
 await b.close();
})();
