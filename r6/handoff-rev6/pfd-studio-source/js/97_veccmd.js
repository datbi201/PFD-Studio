/* ============ MODULE VECTOR — CÔNG CỤ, TƯƠNG TÁC, LỆNH (Rev.6a) ============ */
/* Thứ tự ưu tiên khi bấm chuột (rất quan trọng — đảo thứ tự là sinh lỗi khó hiểu):
     1. tay cầm Bézier (chỉ có ở A/P)
     2. điểm neo        (chỉ có ở A/P)
     3. tay cầm biến đổi: góc = giữ tỷ lệ, cạnh = không giữ tỷ lệ (chỉ có ở V)
     4. tâm quay        (chỉ có ở V)
     5. vùng xoay ngay ngoài góc (CHỈ ở V)
     6. công cụ đang chọn (bút / hình cơ bản / đo / chữ)
     7. bấm vào đối tượng → chọn + kéo (V)
     8. còn lại → nhường cho khung chọn của PFD
   Trước đây vùng xoay được kiểm tra TRƯỚC điểm neo, mà với hình chữ nhật thì 4 điểm neo
   nằm đúng 4 góc khung bao → bấm vào điểm neo bị hiểu thành bấm vùng xoay, nên "kéo điểm neo
   lại thành xoay cả hình". Đó là lỗi người dùng báo. */

/* ---------- bắt dính & ràng buộc góc ---------- */
function vecSnapPt(p, from, ev){
 const c=vecCfg();
 let x=p.x, y=p.y;
 if(c.grid&&c.gstep>0){ x=Math.round(x/c.gstep)*c.gstep; y=Math.round(y/c.gstep)*c.gstep; }
 if(ev&&ev.shiftKey&&from){
  const dx=x-from.x, dy=y-from.y, ang=Math.atan2(dy,dx), step=(c.angStep||45)*Math.PI/180;
  const q=Math.round(ang/step)*step, L=Math.hypot(dx,dy);
  x=from.x+Math.cos(q)*L; y=from.y+Math.sin(q)*L;
 }
 return {x:x, y:y};
}
function vecSquare(p0,p1){
 const dx=p1.x-p0.x, dy=p1.y-p0.y, m=Math.max(Math.abs(dx),Math.abs(dy));
 return {x:p0.x+(dx<0?-m:m), y:p0.y+(dy<0?-m:m)};
}
function vecLastAnchor(){
 const N=VEC.draft&&VEC.draft.nodes;
 return N&&N.length?N[N.length-1]:null;
}
function vecNearFirst(w){
 const N=VEC.draft&&VEC.draft.nodes;
 if(!N||N.length<2)return false;
 const f=N[0];
 return Math.hypot(f.x-w.x,f.y-w.y)*view.k<12;
}

/* ---------- BÚT (Pen) ---------- */
function vecPenDown(ev,w){
 if(!VEC.draft){
  VEC.draft={nodes:[vecNode(w.x,w.y)],closed:false};
  VEC.pen={i:0,x0:w.x,y0:w.y,moved:false};
  renderVecOverlay();
  setStatus(_("Bút: đã đặt điểm neo 1. Bấm tiếp để nối đoạn thẳng, hoặc BẤM-KÉO để tạo đường cong có tay cầm.","Pen: anchor 1 placed. Click again for a straight segment, or CLICK-DRAG to create a curve with handles."));
  return;
 }
 if(vecNearFirst(w)){vecPenFinish(true);return}
 const n=vecNode(w.x,w.y);
 VEC.draft.nodes.push(n);
 VEC.pen={i:VEC.draft.nodes.length-1,x0:w.x,y0:w.y,moved:false};
 renderVecOverlay();
}
function vecPenMove(ev,w){
 if(!VEC.pen||!VEC.draft)return;
 const n=VEC.draft.nodes[VEC.pen.i];if(!n)return;
 const dx=w.x-VEC.pen.x0, dy=w.y-VEC.pen.y0;
 if(!VEC.pen.moved&&Math.hypot(dx,dy)*view.k<3)return;
 VEC.pen.moved=true;
 n.outX=w.x; n.outY=w.y;
 if(ev.altKey){ n.inX=n.x; n.inY=n.y; n.type="asym"; }
 else { n.inX=n.x-dx; n.inY=n.y-dy; n.type="smooth"; }
 VEC.live={x:w.x,y:w.y,text:_("Tay cầm ","Handle ")+r3(Math.hypot(dx,dy))};
 renderVecOverlay();
}
function vecPenUp(){
 if(VEC.pen&&!VEC.pen.moved&&VEC.draft){
  const n=VEC.draft.nodes[VEC.pen.i];
  if(n){n.inX=n.x;n.inY=n.y;n.outX=n.x;n.outY=n.y;n.type="corner"}
 }
 VEC.pen=null;VEC.live=null;renderVecOverlay();
}
function vecPenFinish(close){
 const d=VEC.draft;VEC.draft=null;VEC.pen=null;VEC.live=null;
 if(!d||d.nodes.length<2){renderVecOverlay();setStatus(_("Cần ít nhất 2 điểm neo để tạo đường.","At least 2 anchors are needed."));return}
 d.closed=!!close&&d.nodes.length>=3;
 const h=vecNewPath(d.nodes,d.closed,_("Vẽ đường path","Draw path"));
 setStatus(_(`Đã vẽ đường path: ${h.nodes.length} điểm neo, ${h.closed?"kín":"hở"}. Bấm A để sửa từng điểm neo.`,
   `Path created: ${h.nodes.length} anchors, ${h.closed?"closed":"open"}. Press A to edit individual anchors.`));
}
function vecPenCancel(){
 VEC.draft=null;VEC.pen=null;VEC.live=null;renderVecOverlay();
 setStatus(_("Đã huỷ đường đang vẽ.","Cancelled the path being drawn."));
}

/* ---------- thêm / xoá điểm neo ---------- */
function vecAddNodeAt(h,p){
 const near=vecNearestOn(h,p,24);
 if(near.seg<0)return;
 const i=vecSplitSeg(h,near.seg,near.t);
 if(i<0)return;
 commit(_("Thêm điểm neo","Add anchor"));renderAll();
 setStatus(_(`Đã thêm điểm neo thứ ${i+1}/${h.nodes.length} trên đường.`,`Added anchor ${i+1} of ${h.nodes.length}.`));
}
function vecDelNodeAt(h,i){
 if(!vecDelNode(h,i)){setStatus(_("Đường phải còn ít nhất 2 điểm neo.","A path needs at least 2 anchors."));return}
 VEC.nodeSel=null;
 commit(_("Xoá điểm neo","Delete anchor"));renderAll();
 setStatus(_(`Đã xoá điểm neo. Còn ${h.nodes.length} điểm.`,`Anchor deleted. ${h.nodes.length} remaining.`));
}

/* ---------- chọn điểm neo ---------- */
function vecPickNode(h,i){VEC.nodeSel={id:h.id,i:i};renderVecOverlay()}
function vecClearNodeSel(){VEC.nodeSel=null;renderVecOverlay()}

/* ---------- KÉO ĐIỂM NEO / TAY CẦM (chỉ ở A) ---------- */
function vecStartNodeDrag(ev,h,i){
 const n=h.nodes[i];
 VEC.nodeSel={id:h.id,i:i};
 VEC.drag={type:"vnode",id:h.id,i:i,x0:n.x,y0:n.y,
  nodes:h.nodes.map(q=>({x:q.x,y:q.y,inX:q.inX,inY:q.inY,outX:q.outX,outY:q.outY,type:q.type})),moved:false};
 renderVecOverlay();
 setStatus(_(`Đang kéo điểm neo ${i+1}/${h.nodes.length}. Chỉ điểm này di chuyển, cả hình giữ nguyên.`,`Dragging anchor ${i+1} of ${h.nodes.length}. Only this anchor moves; the rest of the shape stays put.`));
}
function vecStartHandleDrag(ev,h,i,which){
 VEC.drag={type:"vhandle",id:h.id,i:i,which:which,moved:false};
}

/* ---------- TÂM QUAY ---------- */
function vecPivotPoint(){
 const b=vecUnionBox(vecSel());
 if(!b)return null;
 if(VEC.pivot)return {x:VEC.pivot.x,y:VEC.pivot.y};
 return {x:(b.x0+b.x1)/2, y:(b.y0+b.y1)/2};
}

/* ---------- TỶ LỆ: góc = giữ tỷ lệ, cạnh = không giữ tỷ lệ ---------- */
function vecStartScale(ev,key){
 const hs=vecSel();const b=vecUnionBox(hs);if(!b)return;
 const w0=Math.max(1e-6,b.x1-b.x0), h0=Math.max(1e-6,b.y1-b.y0);
 let ax,ay,axis;
 if(/^c/.test(key)){
  const cs=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
  const o=cs[(+key[1]+2)%4];ax=o[0];ay=o[1];axis="both";
 }else{
  const i=+key[1];
  if(i===0){ax=(b.x0+b.x1)/2;ay=b.y1;axis="y"}
  else if(i===1){ax=b.x0;ay=(b.y0+b.y1)/2;axis="x"}
  else if(i===2){ax=(b.x0+b.x1)/2;ay=b.y0;axis="y"}
  else{ax=b.x1;ay=(b.y0+b.y1)/2;axis="x"}
 }
 VEC.drag={type:"vscale",key:key,cx:ax,cy:ay,axis:axis,w0:w0,h0:h0,b:b,moved:false,fx:1,fy:1,
  snap:hs.map(h=>({h:h,data:JSON.parse(JSON.stringify(h))}))};
 setStatus(axis==="both"?_("Phóng theo GÓC: giữ nguyên tỷ lệ. Giữ Shift để phóng đều 2 chiều.","Corner scale: keeps the aspect ratio. Hold Shift for uniform scaling."):_("Phóng theo CẠNH: chỉ đổi một chiều, KHÔNG giữ tỷ lệ.","Edge scale: changes one axis only, does NOT keep the ratio."));
}
function vecScaleFactor(d,w,ev){
 let fx=Math.abs(w.x-d.cx)/d.w0, fy=Math.abs(w.y-d.cy)/d.h0;
 if(d.axis==="x")fy=1;
 else if(d.axis==="y")fx=1;
 else{ const f=ev&&ev.shiftKey?Math.max(fx,fy):Math.max(fx,fy); fx=f; fy=f; }   /* góc luôn giữ tỷ lệ */
 return {fx:Math.min(50,Math.max(.01,fx)), fy:Math.min(50,Math.max(.01,fy))};
}
function vecApplySnapScale(fx,fy){
 VEC.drag.snap.forEach(s=>{
  const h=s.h, d=s.data, cx=VEC.drag.cx, cy=VEC.drag.cy;
  const fn=p=>({x:cx+(p.x-cx)*fx, y:cy+(p.y-cy)*fy});
  if(h.t==="path"&&d.nodes){ h.nodes=d.nodes.map(q=>{const A=fn({x:q.x,y:q.y}),B=fn({x:q.inX,y:q.inY}),C=fn({x:q.outX,y:q.outY});
    return{x:A.x,y:A.y,inX:B.x,inY:B.y,outX:C.x,outY:C.y,type:q.type}}) }
  else if(h.t==="vtext"&&d.t==="vtext"){
   const c0={x:d.x+d.w/2,y:d.y+d.h/2}, c1=fn(c0);
   h.w=Math.max(4,d.w*fx); h.h=Math.max(4,d.h*fy);
   h.x=c1.x-h.w/2; h.y=c1.y-h.h/2;
  }
  else if(d.pts){ h.pts=d.pts.map(fn) }
 });
}

/* ---------- XOAY: hiện góc real-time, Shift = bội 45°, tâm quay tuỳ chỉnh ---------- */
function vecStartRotate(ev){
 const hs=vecSel();const b=vecUnionBox(hs);if(!b)return;
 const pv=vecPivotPoint();if(!pv)return;
 const w=worldPt(ev);
 VEC.drag={type:"vrot",cx:pv.x,cy:pv.y,a0:Math.atan2(w.y-pv.y,w.x-pv.x),moved:false,deg:0,
  snap:hs.map(h=>({h:h,data:JSON.parse(JSON.stringify(h))}))};
 setStatus(_("Đang xoay. Giữ Shift để hút góc 45° (45–90–135–180…). Kéo chữ thập cam để đổi tâm quay.","Rotating. Hold Shift to snap to 45° steps (45–90–135–180…). Drag the orange cross to move the centre."));
}
function vecApplySnapRotate(deg){
 const a=deg*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a), cx=VEC.drag.cx, cy=VEC.drag.cy;
 const fn=p=>{const dx=p.x-cx,dy=p.y-cy;return{x:cx+dx*ca-dy*sa,y:cy+dx*sa+dy*ca}};
 VEC.drag.snap.forEach(s=>{
  const h=s.h, d=s.data;
  if(h.t==="path"&&d.nodes){
   h.nodes=d.nodes.map(q=>{const A=fn({x:q.x,y:q.y}),B=fn({x:q.inX,y:q.inY}),C=fn({x:q.outX,y:q.outY});
    return{x:A.x,y:A.y,inX:B.x,inY:B.y,outX:C.x,outY:C.y,type:q.type}});
  }else if(h.t==="vtext"&&d.t==="vtext"){
   const c1=fn({x:d.x+d.w/2,y:d.y+d.h/2});
   h.rot=(d.rot||0)+deg; h.x=c1.x-h.w/2; h.y=c1.y-h.h/2;
  }else if(d.pts){ h.pts=d.pts.map(fn) }
 });
}

/* ---------- KÉO DỜI (V) — Shift hút lưới, Ctrl nhân bản ---------- */
function vecPickAndMove(ev,id){
 const hit=getShape(id);
 if(!hit)return false;
 if(ev.shiftKey){
  /* CHỈ thêm vào vùng chọn khi đối tượng chưa được chọn.
     Nếu đã chọn rồi thì giữ nguyên — để Shift còn dùng cho "hút lưới khi kéo".
     (Bỏ chọn: bấm thường rồi Shift+bấm, hoặc kéo khung chọn.) */
  if(!sel.has(id))sel.add(id);
 }else if(!sel.has(id)||selEdge){ sel=new Set([id]) }
 selEdge=null;
 vecExpandSel();
 if(!sel.size){renderAll();return true}
 let dup=false;
 if(ev.ctrlKey||ev.metaKey){
  const clones=vecCloneObjects([...sel]);
  sel=new Set(clones);dup=true;
  commit(_("Nhân bản khi kéo","Duplicate while dragging"));
 }
 const ids=[...sel];
 VEC.drag={type:"vmove",w0:worldPt(ev),dup:dup,moved:false,
  snap:ids.map(i=>{const h=getShape(i);return h?{id:i,data:JSON.parse(JSON.stringify(h))}:null}).filter(Boolean)};
 renderAll();
 setStatus(dup?_("Đang kéo BẢN SAO (giữ Ctrl). Thả ra để đặt bản sao, bản gốc vẫn giữ nguyên.","Dragging a COPY (Ctrl held). Release to drop the copy; the original stays."):_("Đang kéo. Giữ Shift để hút lưới, giữ Alt để khoá ngang/dọc, giữ Ctrl để nhân bản.","Dragging. Hold Shift to snap to the grid, Alt to lock an axis, Ctrl to duplicate."));
 return true;
}
function vecApplyMove(ev,w){
 const d=VEC.drag;
 let dx=w.x-d.w0.x, dy=w.y-d.w0.y;
 if(ev.shiftKey){const G=vecCfg().gstep||10;dx=Math.round(dx/G)*G;dy=Math.round(dy/G)*G}
 if(ev.altKey){ if(Math.abs(dx)>=Math.abs(dy))dy=0; else dx=0 }
 if(!d.moved&&Math.hypot(dx,dy)*view.k<3)return;
 d.moved=true;d.dx=dx;d.dy=dy;
 d.snap.forEach(s=>{
  const h=getShape(s.id);if(!h)return;
  const src=s.data;
  if(h.t==="path"&&src.nodes){ h.nodes=src.nodes.map(q=>({x:q.x+dx,y:q.y+dy,inX:q.inX+dx,inY:q.inY+dy,outX:q.outX+dx,outY:q.outY+dy,type:q.type})) }
  else if(h.t==="vtext"){ h.x=src.x+dx; h.y=src.y+dy }
  else if(src.pts){ h.pts=src.pts.map(p=>({x:p.x+dx,y:p.y+dy})) }
 });
 const b=vecUnionBox(vecSel());
 VEC.live={x:w.x,y:w.y,text:`Δ ${r3(dx)} , ${r3(dy)}`+(b?"  •  "+vecSizeLabel(b):"")};
 renderShapes();
 setStatus(_(`Dời ${r3(dx)} , ${r3(dy)}`+(b?` — kích thước ${vecSizeLabel(b)}`:""),`Moved ${r3(dx)}, ${r3(dy)}`+(b?` — size ${vecSizeLabel(b)}`:"")));
}

/* ---------- CON TRỎ XUỐNG ---------- */
function vecPointerDown(ev){
 const t=ev.target, cl=s=>t&&t.closest?t.closest(s):null;
 /* chuột phải: đang vẽ thì kết thúc, ngược lại mở menu ngữ cảnh */
 if(ev.button===2){
  if(VEC.draft){vecPenFinish(false);ev.preventDefault();return true}
  if(typeof vecContextMenu==="function"){vecContextMenu(ev);return true}
  return false;
 }
 if(ev.button===1||spaceDown||tool==="pan")return false;

 const vnEl=cl("[data-vnode]"), vhEl=cl("[data-vhandle]"), vshEl=cl("[data-vsh]"),
       vpEl=cl("[data-vpivot]"), shEl=cl("[data-shape]");
 const w=worldPt(ev);

 /* 1–2. tay cầm Bézier và điểm neo — ƯU TIÊN CAO NHẤT (xem ghi chú đầu file) */
 if(vhEl){const h=getShape(vhEl.dataset.vh);if(h&&vecIsPath(h)){
  sel=new Set([h.id]);selEdge=null;vecStartHandleDrag(ev,h,+vhEl.dataset.vn,vhEl.dataset.vhandle);ev.preventDefault();return true}}
 if(vnEl){const h=getShape(vnEl.dataset.vnode);if(h&&vecIsPath(h)){
  sel=new Set([h.id]);selEdge=null;vecStartNodeDrag(ev,h,+vnEl.dataset.vn);ev.preventDefault();return true}}

 /* 3. tay cầm biến đổi (góc / cạnh) */
 if(vshEl&&sel.size){vecStartScale(ev,vshEl.dataset.vsh);ev.preventDefault();return true}

 /* 4. tâm quay */
 if(vpEl&&sel.size){const pv=vecPivotPoint();VEC.pivot=pv?{x:pv.x,y:pv.y}:null;VEC.drag={type:"vpivot",moved:false};ev.preventDefault();return true}

 /* 5. vùng xoay ngoài góc — CHỈ ở V (ở A đã bị người dùng báo là gây nhầm lẫn) */
 if(tool==="select"&&sel.size){
  const b=vecUnionBox(vecSel());
  if(b){
   const cs=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
   for(let i=0;i<4;i++){
    const dd=Math.hypot(w.x-cs[i][0],w.y-cs[i][1])*view.k;
    const inside=w.x>=b.x0&&w.x<=b.x1&&w.y>=b.y0&&w.y<=b.y1;
    if(dd>9&&dd<26&&!inside){vecStartRotate(ev);ev.preventDefault();return true}
   }
  }
 }

 /* 6. công cụ đang chọn */
 if(tool==="pen"){vecPenDown(ev,vecSnapPt(w,vecLastAnchor(),ev));ev.preventDefault();return true}
 if(tool==="measure"){vecMeasureDown(ev,w);ev.preventDefault();return true}
 if(tool==="rect"||tool==="ellipse"||tool==="vline"){
  VEC.drag={type:"vdraw",t:tool,p0:vecSnapPt(w,null,ev),p1:vecSnapPt(w,null,ev),moved:false};
  ev.preventDefault();return true;
 }
 if(tool==="type"){
  vecTypeDown(ev,w);ev.preventDefault();return true;
 }
 if(tool==="rotate"&&sel.size){vecStartRotate(ev);ev.preventDefault();return true}

 /* 7. Chọn trực tiếp: bấm vào đường để hiện điểm neo */
 if(tool==="direct"){
  if(shEl){const h=getShape(shEl.dataset.shape);
   if(h&&vecIsPath(h)){sel=new Set([h.id]);selEdge=null;VEC.nodeSel=null;renderAll();
    setStatus(_(`Đang sửa đường: ${h.nodes.length} điểm neo. Kéo chấm vuông để dời điểm, kéo chấm tròn để uốn cong.`,`Editing path: ${h.nodes.length} anchors. Drag a square to move an anchor, a round dot to bend the curve.`));
    ev.preventDefault();return true}}
  sel=new Set();selEdge=null;VEC.nodeSel=null;renderAll();return true;
 }

 /* 8. V: bấm vào đối tượng → chọn + kéo */
 if(tool==="select"&&shEl){ if(vecPickAndMove(ev,shEl.dataset.shape)){ev.preventDefault();return true} }

 /* 9. còn lại (nền trống) → khung chọn của PFD */
 return false;
}

/* ---------- CON TRỎ DI CHUYỂN ---------- */
function vecPointerMove(ev){
 const w=worldPt(ev);
 VEC.cursor=w;
 /* BÚT phải xử lý trước mọi guard chung (xem ghi chú đầu file) */
 if(tool==="pen"){
  if(VEC.pen){vecPenMove(ev,w);return true}
  if(VEC.draft)renderVecOverlay();
  return true;
 }
 if(tool==="measure"){ if(VEC.measure){VEC.measure.cur=w;renderVecOverlay()} return true }
 const d=VEC.drag;
 if(!d)return false;

 if(d.type==="vmove"){vecApplyMove(ev,w);return true}
 if(d.type==="vtydraw"){vecTypeDrawMove(w,ev);return true}

 if(d.type==="vnode"){
  const h=getShape(d.id);if(!h||!vecIsPath(h))return true;
  const dx=w.x-d.x0, dy=w.y-d.y0;
  if(!d.moved&&Math.hypot(dx,dy)*view.k<2)return true;
  d.moved=true;
  h.nodes=d.nodes.map(q=>({x:q.x+dx,y:q.y+dy,inX:q.inX+dx,inY:q.inY+dy,outX:q.outX+dx,outY:q.outY+dy,type:q.type}));
  VEC.live={x:w.x,y:w.y,text:`${r3(w.x)} , ${r3(w.y)}`};
  renderShapes();return true;
 }
 if(d.type==="vhandle"){
  const h=getShape(d.id);if(!h||!vecIsPath(h))return true;
  const n=h.nodes[d.i];if(!n)return true;
  let p=w;
  const G=vecCfg().gstep;
  if(vecCfg().grid&&G>0&&ev.shiftKey)p={x:Math.round(p.x/G)*G,y:Math.round(p.y/G)*G};
  d.moved=true;
  if(d.which==="i"){n.inX=p.x;n.inY=p.y;if(n.type==="smooth"&&!ev.altKey){n.outX=n.x-(p.x-n.x);n.outY=n.y-(p.y-n.y)}}
  else{n.outX=p.x;n.outY=p.y;if(n.type==="smooth"&&!ev.altKey){n.inX=n.x-(p.x-n.x);n.inY=n.y-(p.y-n.y)}}
  if(ev.altKey)n.type="asym";
  VEC.live={x:p.x,y:p.y,text:_("tay cầm ","handle ")+r3(Math.hypot(p.x-n.x,p.y-n.y))};
  renderShapes();return true;
 }
 if(d.type==="vscale"){
  const f=vecScaleFactor(d,w,ev);
  d.moved=true;d.fx=f.fx;d.fy=f.fy;
  vecApplySnapScale(f.fx,f.fy);
  const b=vecUnionBox(vecSel());
  VEC.live={x:w.x,y:w.y,text:`${Math.round(f.fx*100)}% × ${Math.round(f.fy*100)}%`+(b?"  •  "+vecSizeLabel(b):"")};
  renderShapes();
  if(b)setStatus(_(`Phóng ${Math.round(f.fx*100)}% × ${Math.round(f.fy*100)}% — kích thước ${vecSizeLabel(b)}`,`Scale ${Math.round(f.fx*100)}% × ${Math.round(f.fy*100)}% — size ${vecSizeLabel(b)}`));
  return true;
 }
 if(d.type==="vrot"){
  const a=Math.atan2(w.y-d.cy,w.x-d.cx);
  let deg=(a-d.a0)*180/Math.PI;
  if(ev.shiftKey)deg=Math.round(deg/45)*45;      /* hút 45° theo yêu cầu */
  d.moved=true;d.deg=deg;
  vecApplySnapRotate(deg);
  VEC.live={x:w.x,y:w.y,text:r3(deg)+"°"};
  renderShapes();
  setStatus(_(`Xoay ${r3(deg)}°${ev.shiftKey?" (đã hút 45°)":""} — tâm quay ${r3(d.cx)} , ${r3(d.cy)}`,`Rotate ${r3(deg)}°${ev.shiftKey?" (snapped to 45°)":""} — centre ${r3(d.cx)}, ${r3(d.cy)}`));
  return true;
 }
 if(d.type==="vpivot"){
  VEC.pivot={x:w.x,y:w.y};d.moved=true;
  VEC.live={x:w.x,y:w.y,text:_("tâm quay","pivot")};
  renderVecOverlay();
  setStatus(_(`Tâm quay: ${r3(w.x)} , ${r3(w.y)}. Bấm đúp vào chữ thập để trả về giữa hình.`,`Rotation centre: ${r3(w.x)}, ${r3(w.y)}. Double-click the cross to reset to the centre.`));
  return true;
 }
 if(d.type==="vdraw"){
  let p1=vecSnapPt(w,d.p0,ev);
  if(ev.shiftKey&&(d.t==="rect"||d.t==="ellipse"))p1=vecSquare(d.p0,p1);
  d.p1=p1;d.moved=true;
  const nodes=d.t==="rect"?vecFromRect(Math.min(d.p0.x,p1.x),Math.min(d.p0.y,p1.y),Math.max(d.p0.x,p1.x),Math.max(d.p0.y,p1.y))
   :d.t==="ellipse"?vecFromEllipse((d.p0.x+p1.x)/2,(d.p0.y+p1.y)/2,Math.abs(p1.x-d.p0.x)/2,Math.abs(p1.y-d.p0.y)/2)
   :vecFromLine(d.p0,p1);
  VEC.draft={nodes:nodes,closed:d.t!=="vline",preview:true};
  VEC.live={x:p1.x,y:p1.y,text:`${r3(Math.abs(p1.x-d.p0.x))} × ${r3(Math.abs(p1.y-d.p0.y))}`};
  renderVecOverlay();
  setStatus(_(`Kích thước: ${r3(Math.abs(p1.x-d.p0.x))} × ${r3(Math.abs(p1.y-d.p0.y))}${ev.shiftKey?" (Shift: vuông/tròn đều)":""}`,`Size: ${r3(Math.abs(p1.x-d.p0.x))} × ${r3(Math.abs(p1.y-d.p0.y))}${ev.shiftKey?" (Shift: square/circle)":""}`));
  return true;
 }
 return false;
}

/* ---------- CON TRÓ LÊN ---------- */
function vecPointerUp(ev){
 if(tool==="pen"&&VEC.pen){vecPenUp();return true}
 if(VEC.drag&&VEC.drag.type==="vtydraw"){vecTypeDrawUp();VEC.drag=null;return true}
 const d=VEC.drag;VEC.drag=null;VEC.live=null;
 if(!d)return false;
 if(d.type==="vmove"){ if(d.moved)commit(_("Di chuyển","Move")); renderAll(); return true }
 if(d.type==="vnode"){ if(d.moved)commit(_("Dời điểm neo","Move anchor")); renderAll(); return true }
 if(d.type==="vhandle"){ if(d.moved)commit(_("Sửa tay cầm đường cong","Adjust curve handle")); renderAll(); return true }
 if(d.type==="vpivot"){ renderAll(); return true }
 if(d.type==="vscale"){ if(d.moved){commit(_("Tỷ lệ ","Scale ")+Math.round(d.fx*100)+"% × "+Math.round(d.fy*100)+"%");renderAll()} return true }
 if(d.type==="vrot"){ if(d.moved){commit(_("Xoay ","Rotate ")+r3(d.deg)+"°");renderAll()} return true }
 if(d.type==="vdraw"){
  VEC.draft=null;
  if(!d.moved||(Math.abs(d.p1.x-d.p0.x)<1&&Math.abs(d.p1.y-d.p0.y)<1)){renderVecOverlay();return true}
  const nodes=d.t==="rect"?vecFromRect(Math.min(d.p0.x,d.p1.x),Math.min(d.p0.y,d.p1.y),Math.max(d.p0.x,d.p1.x),Math.max(d.p0.y,d.p1.y))
   :d.t==="ellipse"?vecFromEllipse((d.p0.x+d.p1.x)/2,(d.p0.y+d.p1.y)/2,Math.abs(d.p1.x-d.p0.x)/2,Math.abs(d.p1.y-d.p0.y)/2)
   :vecFromLine(d.p0,d.p1);
  const h=vecNewPath(nodes,d.t!=="vline",_("Vẽ ","Draw ")+T_(SHAPE_T[d.t==="vline"?"line":d.t]));
  setStatus(_(`Đã vẽ xong (${h.nodes.length} điểm neo, ${r3(Math.abs(d.p1.x-d.p0.x))} × ${r3(Math.abs(d.p1.y-d.p0.y))}). Bấm A để sửa từng điểm.`,
    `Shape created (${h.nodes.length} anchors, ${r3(Math.abs(d.p1.x-d.p0.x))} × ${r3(Math.abs(d.p1.y-d.p0.y))}). Press A to edit its anchors.`));
  return true;
 }
 return false;
}

/* ---------- BÀN PHÍM ---------- */
function vecKey(ev){
 const ae=document.activeElement, tg=ae?ae.tagName:"";
 const typing=tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT";
 if(typing)return false;
 const mod=ev.ctrlKey||ev.metaKey, k=ev.key.toLowerCase();

 if(ev.key==="Escape"){
  if(VEC.draft){vecPenCancel();return true}
  if(VEC.measure){vecMeasureCancel();return true}
  if(VEC.drag){VEC.drag=null;VEC.live=null;renderAll();return true}
  if(VEC.nodeSel){vecClearNodeSel();return true}
  if(tool!=="select"){vecSetTool("select");return true}
  return false;
 }
 if(ev.key==="Enter"){ if(VEC.draft){vecPenFinish(false);return true} return false }

 if(mod){
  if(k==="g"){ev.preventDefault();ev.shiftKey?vecUngroup():vecGroup();return true}
  if(ev.key==="]"||k==="]"){ev.preventDefault();vecZOrder(ev.shiftKey?"front":"up");return true}
  if(ev.key==="["||k==="["){ev.preventDefault();vecZOrder(ev.shiftKey?"back":"down");return true}
  return false;   /* các phím Ctrl khác do logic cũ lo */
 }

 if(k==="delete"||k==="backspace"){
  if(tool==="direct"&&VEC.nodeSel){
   const h=getShape(VEC.nodeSel.id);
   if(h&&vecIsPath(h)){ev.preventDefault();vecDelNodeAt(h,VEC.nodeSel.i);return true}
  }
  return false;
 }
 if(k==="+"||k==="="){
  const hs=vecSel();
  if(hs.length===1&&VEC.cursor&&(tool==="direct"||tool==="pen")){ev.preventDefault();vecAddNodeAt(hs[0],VEC.cursor);return true}
  return false;
 }
 if(k==="-"){
  const hs=vecSel();
  if(hs.length===1&&vecIsPath(hs[0])){
   const h=hs[0];
   if(VEC.nodeSel&&VEC.nodeSel.id===h.id){ev.preventDefault();vecDelNodeAt(h,VEC.nodeSel.i);return true}
   if(VEC.cursor){
    let bi=-1,bd=1e18;
    h.nodes.forEach((n,i)=>{const dd=Math.hypot(n.x-VEC.cursor.x,n.y-VEC.cursor.y);if(dd<bd){bd=dd;bi=i}});
    if(bi>=0&&bd*view.k<24){ev.preventDefault();vecDelNodeAt(h,bi);return true}
   }
   setStatus(_("Trỏ gần một điểm neo rồi bấm - để xoá điểm đó.","Point at an anchor and press - to delete it."));
   return true;
  }
  return false;
 }
 if(ev.shiftKey&&k==="c"){
  if(VEC.nodeSel){
   const h=getShape(VEC.nodeSel.id), n=h&&h.nodes[VEC.nodeSel.i];
   if(n){ev.preventDefault();vecConvertNode(n,vecNodeType(n)!=="smooth");commit(_("Đổi kiểu điểm neo","Convert anchor"));renderAll();
    setStatus(_("Đã đổi điểm neo giữa góc nhọn và mượt.","Anchor converted between corner and smooth."));return true}
  }
  return false;
 }
 /* đặt lại tâm quay về giữa hình */
 if(k==="0"&&ev.altKey){VEC.pivot=null;renderAll();setStatus(_("Đã đặt tâm quay về giữa hình.","Rotation centre reset to the middle."));return true}
 const TK={v:"select",a:"direct",p:"pen",t:"type",m:"rect",l:"ellipse","\\":"vline",r:"rotate",s:"scale",o:"reflect",h:"pan",d:"measure"};
 if(TK[k]&&!ev.altKey){ev.preventDefault();vecSetTool(TK[k]);return true}
 return false;
}
