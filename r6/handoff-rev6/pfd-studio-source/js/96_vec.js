/* ============ MODULE VECTOR — TRẠNG THÁI, MODULE, OVERLAY (Rev.6a) ============ */
/* Module thứ ba, đặt tên nội bộ "vec". Bám đúng pattern của SimCAD (js/90_cad.js):
   STORE.vec giữ ngữ cảnh riêng, setModule() đổi qua lại, applyModuleUI() bật/tắt CSS. */

const VEC={draft:null,nodeSel:null,pen:null,drag:null,lastXf:null,box:null,
 pivot:null,      /* tâm quay tuỳ chỉnh {x,y}; null = tâm khung chọn */
 live:null,       /* nhãn real-time {x,y,text} hiện cạnh con trỏ khi kéo/xoay/phóng */
 measure:null,    /* dữ liệu công cụ đo {p0,p1,p2,step} */
 ctx:null};       /* menu chuột phải */
const VEC_TOOLS=["select","direct","pen","type","rect","ellipse","vline","rotate","scale","reflect","measure"];
const VEC_HINT={
 select:["Chọn: bấm để chọn, kéo để dời, kéo khung trên nền trống để chọn nhiều.","Select: click to pick, drag to move, drag on empty space to marquee."],
 direct:["Chọn trực tiếp: bấm vào đường để hiện điểm neo; kéo điểm neo hoặc tay cầm để sửa dạng đường.","Direct selection: click a path to show its anchors; drag an anchor or handle to reshape."],
 pen:["Bút: bấm để đặt điểm neo góc nhọn; bấm-kéo để tạo đường cong. Enter hoặc Esc để kết thúc, bấm lại điểm đầu để khép kín.","Pen: click to place a corner anchor; click-drag to make a curve. Enter or Esc to finish, click the first anchor to close."],
 type:["Chữ: bấm lên bản vẽ để đặt khung chữ.","Type: click on the drawing to place a text box."],
 rect:["Hình chữ nhật: kéo chéo. Giữ Shift để vuông.","Rectangle: drag diagonally. Hold Shift for a square."],
 ellipse:["Ellipse: kéo chéo khung bao. Giữ Shift để tròn đều.","Ellipse: drag the bounding box. Hold Shift for a circle."],
 vline:["Đường thẳng: kéo từ điểm đầu tới điểm cuối. Giữ Shift để 0/45/90°.","Line: drag from start to end. Hold Shift for 0/45/90°."],
 rotate:["Xoay: kéo quanh tâm khung chọn, hoặc nhập góc ở panel bên phải.","Rotate: drag around the selection centre, or type an angle in the panel."],
 scale:["Tỷ lệ: kéo góc khung chọn, hoặc nhập % ở panel bên phải.","Scale: drag a corner of the selection, or type a percentage in the panel."],
 reflect:["Lật: kéo để lật đối tượng qua trục đứng hoặc ngang.","Reflect: drag to mirror the object across a vertical or horizontal axis."],
 measure:["Đo: bấm 2 điểm để đo khoảng cách + góc phương vị; bấm điểm thứ 3 để đo góc tại điểm giữa. Esc để xoá.","Measure: click 2 points for distance + bearing; a 3rd point measures the angle at the middle point. Esc clears."]};

function vecOn(){return state.meta.doc==="vec"}
function vecCfg(){return state.meta.vec}
function vecShapes(){return state.shapes.filter(h=>h.t==="path"||h.t==="vtext")}
function vecSel(){return selShapes().filter(h=>h.t==="path"||h.t==="vtext")}
function vecHint(t){return VEC_HINT[t]||VEC_HINT.select}

/* ---------- trạng thái mới cho module Vector ---------- */
function newVecState(src){
 const s=newState(),m=s.meta;
 Object.assign(m,{doc:"vec",title:_("BẢN VẼ VECTOR","VECTOR DRAWING"),docNo:"VEC-001",docType:_("Bản vẽ vector","Vector drawing"),scaleTxt:"NTS",
  template:"frame",sheet:"A3",orient:"landscape",showProps:false,colorByPhase:false,showTable:false,grid:true,snap:false});
 if(src){["company","client","project","drawnBy","checkedBy","approvedBy","tbLang","orient","sheet","fonts"].forEach(k=>{if(src[k]!==undefined)m[k]=src[k]});m.project=""}
 return s;
}

/* ---------- công cụ ---------- */
function vecSetTool(t){
 VEC.draft=null;VEC.pen=null;VEC.nodeSel=null;VEC.cursor=null;VEC.measure=null;VEC.live=null;
 setTool(t);                       /* dùng lại setTool cũ: reset draft, con trỏ, cập nhật nút */
 const g=$("gVec");if(g)g.innerHTML="";
 updateToolUI();renderVecOverlay();
 setStatus(_(...vecHint(t)));
}
function vecToolUI(){
 const bs=document.querySelectorAll(".vectool");
 bs.forEach(b=>{const on=b.dataset.tool===tool;b.classList.toggle("active",on);b.setAttribute("aria-pressed",on)});
}

/* ---------- overlay: điểm neo + tay cầm ---------- */
function vecNodeMarkup(h,n,i,r,on,clickable){
 const cx=n.x, cy=n.y;
 /* chấm vuông = điểm neo; đổi màu khi đang chọn.
    clickable=false → chỉ để nhìn (dùng ở chế độ Bút để không cướp cú bấm). */
 return `<rect class="vnode" data-vnode="${esc(h.id)}" data-vn="${i}" x="${r3(cx-r)}" y="${r3(cy-r)}" width="${r3(r*2)}" height="${r3(r*2)}" fill="${on?"#1677ff":"#fff"}" stroke="#1677ff" stroke-width="${r3(1.6/view.k)}" pointer-events="${clickable===false?"none":"all"}"/>`;
}
function vecHandleMarkup(h,n,i,which,r,clickable){
 const hx=which==="i"?n.inX:n.outX, hy=which==="i"?n.inY:n.outY;
 return `<path d="M ${r3(n.x)} ${r3(n.y)} L ${r3(hx)} ${r3(hy)}" stroke="#1677ff" stroke-width="${r3(1/view.k)}" stroke-dasharray="4 3" fill="none" pointer-events="none"/>`+
  `<circle class="vhandle" data-vhandle="${which}" data-vh="${esc(h.id)}" data-vn="${i}" cx="${r3(hx)}" cy="${r3(hy)}" r="${r3(r)}" fill="#1677ff" fill-opacity=".25" stroke="#1677ff" stroke-width="${r3(1.6/view.k)}" pointer-events="${clickable===false?"none":"all"}"/>`;
}
/* Khung chọn: 4 tay cầm GÓC (giữ tỷ lệ) + 4 tay cầm CẠNH (phóng không đều) + tuỳ chọn tâm quay */
function vecBoxMarkup(b,r,opts){
 opts=opts||{};
 const w=b.x1-b.x0,hh=b.y1-b.y0,mx=(b.x0+b.x1)/2,my=(b.y0+b.y1)/2;
 let s=`<rect x="${r3(b.x0)}" y="${r3(b.y0)}" width="${r3(w)}" height="${r3(hh)}" fill="none" stroke="#1677ff" stroke-width="${r3(1.2/view.k)}" stroke-dasharray="6 4" pointer-events="none"/>`;
 const sq=(x,y,key)=>{s+=`<rect class="vsh" data-vsh="${key}" x="${r3(x-r)}" y="${r3(y-r)}" width="${r3(r*2)}" height="${r3(r*2)}" fill="#fff" stroke="#1677ff" stroke-width="${r3(1.6/view.k)}" pointer-events="all"><title>${_("Kéo để phóng — giữ tỷ lệ","Drag to scale — keeps the ratio")}</title></rect>`};
 const bar=(x,y,key,horiz)=>{s+=`<rect class="vsh" data-vsh="${key}" x="${r3(x-(horiz?r*1.6:r*.7))}" y="${r3(y-(horiz?r*.7:r*1.6))}" width="${r3(horiz?r*3.2:r*1.4)}" height="${r3(horiz?r*1.4:r*3.2)}" rx="${r3(r*.4)}" fill="#fff" stroke="#1677ff" stroke-width="${r3(1.6/view.k)}" pointer-events="all"><title>${_("Kéo để phóng KHÔNG giữ tỷ lệ","Drag to scale WITHOUT keeping the ratio")}</title></rect>`};
 if(opts.corners!==false){sq(b.x0,b.y0,"c0");sq(b.x1,b.y0,"c1");sq(b.x1,b.y1,"c2");sq(b.x0,b.y1,"c3")}
 if(opts.edges!==false){bar(mx,b.y0,"e0",true);bar(b.x1,my,"e1",false);bar(mx,b.y1,"e2",true);bar(b.x0,my,"e3",false)}
 if(opts.pivot){
  const px=VEC.pivot?VEC.pivot.x:mx, py=VEC.pivot?VEC.pivot.y:my;
  s+=`<g class="vpivotg" data-vpivot="1" pointer-events="all"><circle cx="${r3(px)}" cy="${r3(py)}" r="${r3(r*1.5)}" fill="none" stroke="#f59e0b" stroke-width="${r3(2/view.k)}"/><path d="M ${r3(px-r*2.2)} ${r3(py)} H ${r3(px+r*2.2)} M ${r3(px)} ${r3(py-r*2.2)} V ${r3(py+r*2.2)}" stroke="#f59e0b" stroke-width="${r3(1.4/view.k)}"/><title>${_("Tâm quay — kéo để đổi chỗ","Rotation centre — drag to move")}</title></g>`;
 }
 return s;
}
function renderVecOverlay(){
 const g=$("gVec");if(!g)return;
 if(!vecOn()){g.innerHTML="";return}
 const r=Math.max(3.2,5.5/view.k);
 let s="";
 /* ---- nét đang vẽ dở (bút / hình cơ bản) ---- */
 if(VEC.draft){
  s+=`<path d="${vecD(VEC.draft)}" fill="none" stroke="#f59e0b" stroke-width="${r3(2/view.k)}" stroke-dasharray="6 4" pointer-events="none"/>`;
  VEC.draft.nodes.forEach((n,i)=>{
   /* vẽ luôn tay cầm của nét đang vẽ, nếu không thì lúc kéo người dùng không thấy gì */
   if(vecHasIn(n))s+=vecHandleMarkup(VEC.draft,n,i,"i",r*0.8,false);
   if(vecHasOut(n))s+=vecHandleMarkup(VEC.draft,n,i,"o",r*0.8,false);
   s+=vecNodeMarkup(VEC.draft,n,i,r*0.9,i===VEC.draft.nodes.length-1,false);
  });
  /* dây thun: từ điểm neo cuối tới con trỏ, để biết đoạn sắp vẽ nằm ở đâu */
  const last=VEC.draft.nodes[VEC.draft.nodes.length-1];
  if(last&&VEC.cursor&&!VEC.pen){
   s+=`<path d="M ${r3(last.x)} ${r3(last.y)} L ${r3(VEC.cursor.x)} ${r3(VEC.cursor.y)}" stroke="#f59e0b" stroke-width="${r3(1.2/view.k)}" stroke-dasharray="3 4" fill="none" pointer-events="none"/>`;
  }
 }
 /* số đo của công cụ Đo — phải vẽ cả khi không có vùng chọn */
 if(typeof vecMeasureMarkup==="function")s+=vecMeasureMarkup();
 const hs=vecSel();
 if(!hs.length){VEC.pivot=null;g.innerHTML=s;return}
 const direct=tool==="direct", penMode=tool==="pen";

 /* ---- Chọn trực tiếp (A) và Bút (P): CHỈ điểm neo + tay cầm, không khung bao, không vòng xoay ----
    Ở chế độ Bút, điểm neo chỉ để NHÌN (pointer-events:none) để không cướp cú bấm của bút. */
 if(direct||penMode){
  hs.forEach(h=>{
   if(!vecIsPath(h))return;
   h.nodes.forEach((n,i)=>{
    const on=VEC.nodeSel&&VEC.nodeSel.id===h.id&&VEC.nodeSel.i===i;
    if(vecHasIn(n))s+=vecHandleMarkup(h,n,i,"i",r*0.8);
    if(vecHasOut(n))s+=vecHandleMarkup(h,n,i,"o",r*0.8);
    s+=vecNodeMarkup(h,n,i,r,on,!penMode);
   });
  });
  /* nhãn nhỏ cho biết đang ở chế độ sửa điểm, tránh nhầm với V */
  if(direct&&hs.length===1&&vecIsPath(hs[0]))s+=vecHintLabel(hs[0],r);
  g.innerHTML=s;return;
 }

 /* ---- Chọn (V): khung bao + tay cầm góc (giữ tỷ lệ) + tay cầm cạnh (không giữ tỷ lệ) + tâm quay ---- */
 const b=vecUnionBox(hs);
 const showPivot=(tool==="rotate")||(VEC.drag&&VEC.drag.type==="vrot")||!!VEC.pivot;
 if(b)s+=vecBoxMarkup(b,r,{pivot:showPivot});
 /* dấu hiệu nhóm: khung nét liền màu cam bao quanh cả nhóm */
 if(hs.length>1&&hs.every(h=>h.g)&&new Set(hs.map(h=>h.g)).size===1&&b){
  s+=`<rect x="${r3(b.x0-7/view.k)}" y="${r3(b.y0-7/view.k)}" width="${r3(b.x1-b.x0+14/view.k)}" height="${r3(b.y1-b.y0+14/view.k)}" fill="none" stroke="#f59e0b" stroke-width="${r3(1.4/view.k)}" pointer-events="none"/>`;
 }
 /* nhãn real-time khi đang kéo / xoay / phóng */
 if(VEC.live)s+=`<g pointer-events="none"><rect x="${r3(VEC.live.x+12/view.k)}" y="${r3(VEC.live.y-14/view.k)}" width="${r3(String(VEC.live.text).length*6.4/view.k+12/view.k)}" height="${r3(18/view.k)}" rx="${r3(3/view.k)}" fill="#0f2a44" fill-opacity=".92"/><text x="${r3(VEC.live.x+18/view.k)}" y="${r3(VEC.live.y-1.5/view.k)}" font-family="Arial" font-size="${r3(12/view.k)}" fill="#fff">${esc(VEC.live.text)}</text></g>`;
 g.innerHTML=s;
}
/* nhãn "ĐANG SỬA ĐIỂM" nhỏ phía trên khung, giúp phân biệt A với V */
function vecHintLabel(h,r){
 const b=vecBox(h);
 return `<text x="${r3(b.x0)}" y="${r3(b.y0-10/view.k)}" font-family="Arial" font-size="${r3(11/view.k)}" fill="#1677ff" pointer-events="none">${esc(_("Đang sửa điểm (A) — V để di chuyển cả hình","Editing anchors (A) — press V to move the whole shape"))}</text>`;
}
/* Bao hình chung của nhiều đối tượng */
function vecUnionBox(hs){
 let b=null;
 (hs||[]).forEach(h=>{
  if(!h)return;
  const q=vecObjBox(h);
  if(!q)return;
  b=b?{x0:Math.min(b.x0,q.x0),y0:Math.min(b.y0,q.y0),x1:Math.max(b.x1,q.x1),y1:Math.max(b.y1,q.y1)}:q;
 });
 return b;
}
/* Bao hình của MỘT đối tượng vector bất kỳ */
function vecObjBox(o){
 if(!o)return null;
 if(o.t==="path")return vecBox(o);
 if(o.t==="vtext")return vtextBox(o);
 if(Array.isArray(o.pts))return shapeBox(o);
 return null;
}

/* ---------- tạo path mới ---------- */
function vecStyleFromCfg(){
 const c=vecCfg();
 return{col:c.stroke,sw:c.sw,dash:c.dash,fill:c.fill,fo:c.fo,ah:c.ah};
}
function vecNewPath(nodes,closed,label){
 const st=vecStyleFromCfg();
 const h={id:uid("s"),t:"path",nodes:nodes,closed:!!closed,col:st.col,sw:st.sw,dash:st.dash,fill:st.fill,fo:st.fo,ah:st.ah,z:"f"};
 state.shapes.push(h);
 sel=new Set([h.id]);selEdge=null;
 commit(label||_("Vẽ đường path","Draw path"));
 renderAll();
 return h;
}
/* Vẽ xong hình cơ bản → tự chuyển thành path để sửa được bằng Direct Selection */
function vecFinishBasic(h,label){
 const conv=vecFromShape(h);
 if(!conv){state.shapes.push(h);sel=new Set([h.id]);commit(label);renderAll();return h}
 return vecNewPath(conv.nodes,conv.closed,label);
}

/* ---------- nhóm / thứ tự lớp ---------- */
function vecGroup(){
 const hs=vecSel();if(hs.length<2){setStatus(_("Cần chọn từ 2 đối tượng trở lên để nhóm. Hãy dùng V rồi kéo khung chọn hoặc Ctrl+A.","Select at least 2 objects to group. Use V and drag a marquee, or press Ctrl+A."));return}
 const gid=uid("g");hs.forEach(h=>h.g=gid);
 commit(_("Nhóm đối tượng","Group objects"));renderAll();
 setStatus(_(`Đã nhóm ${hs.length} đối tượng (khung cam nét liền). Bấm vào một đối tượng trong nhóm sẽ chọn cả nhóm. Ctrl+Shift+G để rã nhóm.`,`Grouped ${hs.length} objects (solid orange frame). Clicking any member selects the whole group. Ctrl+Shift+G to ungroup.`));
}
function vecUngroup(){
 const hs=vecSel().filter(h=>h.g);if(!hs.length){setStatus(_("Đối tượng đang chọn không nằm trong nhóm nào.","The selection is not in any group."));return}
 const n=hs.length;hs.forEach(h=>delete h.g);
 commit(_("Rã nhóm","Ungroup"));renderAll();
 setStatus(_(`Đã rã nhóm ${n} đối tượng.`,`Ungrouped ${n} object(s).`));
}
/* Mở rộng vùng chọn: nếu đối tượng thuộc nhóm thì chọn cả nhóm */
function vecExpandSel(){
 const gs=new Set();[...sel].forEach(id=>{const h=getShape(id);if(h&&h.g)gs.add(h.g)});
 if(!gs.size)return;
 state.shapes.forEach(h=>{if(h.g&&gs.has(h.g))sel.add(h.id)});
}
/* Nhân bản nhanh các đối tượng đang chọn (dùng cho Ctrl+kéo) — nhóm được nhân bản thành nhóm mới */
function vecCloneObjects(ids){
 const gmap={},out=[];
 ids.forEach(id=>{
  const h=getShape(id);if(!h)return;
  const c=JSON.parse(JSON.stringify(h));
  c.id=uid("s");
  if(c.g){if(!gmap[c.g])gmap[c.g]=uid("g");c.g=gmap[c.g]}
  state.shapes.push(c);out.push(c.id);
 });
 return out;
}
/* Dời một đối tượng vector bất kỳ (path hoặc chữ) */
function vecObjMove(o,dx,dy){
 if(!o)return;
 if(o.t==="vtext"){o.x+=dx;o.y+=dy;return}
 vecMove(o,dx,dy);
}
/* Kích thước hiện tại của vùng chọn, dùng cho nhãn real-time */
function vecSizeLabel(b){
 return r3(b.x1-b.x0)+" × "+r3(b.y1-b.y0);
}
function vecZOrder(mode){
 const hs=vecSel();if(!hs.length)return;
 const ids=new Set(hs.map(h=>h.id));
 const arr=state.shapes, picked=arr.filter(h=>ids.has(h.id)), rest=arr.filter(h=>!ids.has(h.id));
 if(mode==="front")state.shapes=rest.concat(picked);
 else if(mode==="back")state.shapes=picked.concat(rest);
 else if(mode==="up"||mode==="down"){
  const step=mode==="up"?1:-1;
  const idx=arr.map((h,i)=>({h,i})).filter(o=>ids.has(o.h.id));
  /* duyệt từ phía cần dịch để không dồn vào nhau */
  const order=mode==="up"?idx.slice().reverse():idx;
  order.forEach(o=>{
   const i=arr.indexOf(o.h), j=i+step;
   if(j<0||j>=arr.length)return;
   if(ids.has(arr[j].id))return;
   arr.splice(i,1);arr.splice(j,0,o.h);
  });
 }
 const nm={front:_("đưa lên trên cùng","bring to front"),back:_("đưa xuống dưới cùng","send to back"),up:_("lên một bậc","bring forward"),down:_("xuống một bậc","send backward")}[mode];
 commit(_("Thứ tự lớp: ","Z-order: ")+nm);renderAll();
 setStatus(_(`Đã ${nm} ${hs.length} đối tượng.`,`${nm} ${hs.length} object(s).`));
}
/* ---------- căn chỉnh & phân bố (khái quát hoá từ js/70_layout.js) ---------- */
function vecAlign(mode){
 const hs=vecSel();if(hs.length<2)return;
 const boxes=hs.map(h=>({h:h,b:h.t==="path"?vecBox(h):shapeBox(h)}));
 const U=boxes.reduce((a,o)=>({x0:Math.min(a.x0,o.b.x0),y0:Math.min(a.y0,o.b.y0),x1:Math.max(a.x1,o.b.x1),y1:Math.max(a.y1,o.b.y1)}),{x0:1e18,y0:1e18,x1:-1e18,y1:-1e18});
 const mv=(o,dx,dy)=>{if(o.h.t==="path")vecMove(o.h,dx,dy);else mapShapePts(o.h,p=>({x:p.x+dx,y:p.y+dy}))};
 if(mode==="dh"||mode==="dv"){
  const horiz=mode==="dh";
  const s=boxes.slice().sort((a,b)=>horiz?a.b.x0-b.b.x0:a.b.y0-b.b.y0);
  const total=s.reduce((a,o)=>a+(horiz?(o.b.x1-o.b.x0):(o.b.y1-o.b.y0)),0);
  const span=horiz?(U.x1-U.x0):(U.y1-U.y0), gap=(span-total)/(s.length-1);
  let cur=horiz?U.x0:U.y0;
  s.forEach(o=>{const w=horiz?(o.b.x1-o.b.x0):(o.b.y1-o.b.y0);const d=cur-(horiz?o.b.x0:o.b.y0);mv(o,horiz?d:0,horiz?0:d);cur+=w+gap});
 }else{
  boxes.forEach(o=>{
   let dx=0,dy=0;
   if(mode==="left")dx=U.x0-o.b.x0;
   else if(mode==="right")dx=U.x1-o.b.x1;
   else if(mode==="cx")dx=(U.x0+U.x1)/2-(o.b.x0+o.b.x1)/2;
   else if(mode==="top")dy=U.y0-o.b.y0;
   else if(mode==="bottom")dy=U.y1-o.b.y1;
   else if(mode==="cy")dy=(U.y0+U.y1)/2-(o.b.y0+o.b.y1)/2;
   if(dx||dy)mv(o,dx,dy);
  });
 }
 const nm={left:_("căn trái","align left"),right:_("căn phải","align right"),cx:_("căn giữa theo chiều dọc","centre horizontally"),
  top:_("căn trên","align top"),bottom:_("căn dưới","align bottom"),cy:_("căn giữa theo chiều ngang","centre vertically"),
  dh:_("chia đều theo chiều ngang","distribute horizontally"),dv:_("chia đều theo chiều dọc","distribute vertically")}[mode];
 commit(_("Căn chỉnh: ","Align: ")+nm);renderAll();
 setStatus(_(`Đã ${nm} ${hs.length} đối tượng.`,`${nm} ${hs.length} object(s).`));
}

/* ---------- biến đổi có nhập số (quan trọng cho người dùng TTS) ---------- */
/* Áp một phép biến đổi cho MỌI loại đối tượng vector (path, chữ, shape cũ) */
function vecApplyRot(o,deg,cx,cy){
 if(o.t==="path"){vecMapNodes(o,p=>vecRotatePt(p,deg,cx,cy));return}
 if(o.t==="vtext"){vtextRotate(o,deg,cx,cy);return}
 if(Array.isArray(o.pts))mapShapePts(o,p=>vecRotatePt(p,deg,cx,cy));
}
function vecApplyScale(o,fx,fy,cx,cy){
 if(o.t==="path"){vecMapNodes(o,p=>vecScalePt(p,fx,fy,cx,cy));return}
 if(o.t==="vtext"){vtextScale(o,fx,fy,cx,cy);return}
 if(Array.isArray(o.pts))mapShapePts(o,p=>vecScalePt(p,fx,fy,cx,cy));
}
function vecApplyReflect(o,axis,cx,cy){
 const fn=axis==="h"?(p=>({x:2*cx-p.x,y:p.y})):(p=>({x:p.x,y:2*cy-p.y}));
 if(o.t==="path"){vecMapNodes(o,fn);return}
 if(o.t==="vtext"){vtextReflect(o,axis,cx,cy);return}
 if(Array.isArray(o.pts))mapShapePts(o,fn);
}
function vecRotateBy(deg, silent){
 const hs=vecSel();if(!hs.length)return;
 const b=vecUnionBox(hs);if(!b)return;
 const pv=vecPivotPoint()||{x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2};
 const cx=pv.x, cy=pv.y;
 hs.forEach(h=>vecApplyRot(h,deg,cx,cy));
 if(!silent){commit(_("Xoay ","Rotate ")+r3(deg)+"°");renderAll();
  setStatus(_(`Đã xoay ${hs.length} đối tượng ${r3(deg)}°.`,`Rotated ${hs.length} object(s) by ${r3(deg)}°.`))}
}
function vecScaleBy(k, silent){
 const hs=vecSel();if(!hs.length||!isFinite(k)||k===0)return;
 const b=vecUnionBox(hs);if(!b)return;
 const cx=(b.x0+b.x1)/2, cy=(b.y0+b.y1)/2;
 hs.forEach(h=>vecApplyScale(h,k,k,cx,cy));
 if(!silent){commit(_("Tỷ lệ ","Scale ")+Math.round(k*100)+"%");renderAll();
  setStatus(_(`Đã phóng ${hs.length} đối tượng lên ${Math.round(k*100)}%.`,`Scaled ${hs.length} object(s) to ${Math.round(k*100)}%.`))}
}
function vecReflect(axis){
 const hs=vecSel();if(!hs.length)return;
 const b=vecUnionBox(hs);if(!b)return;
 const cx=(b.x0+b.x1)/2, cy=(b.y0+b.y1)/2;
 hs.forEach(h=>vecApplyReflect(h,axis,cx,cy));
 commit(axis==="h"?_("Lật ngang","Flip horizontal"):_("Lật dọc","Flip vertical"));renderAll();
 setStatus(axis==="h"?_("Đã lật ngang đối tượng đang chọn.","Flipped the selection horizontally."):_("Đã lật dọc đối tượng đang chọn.","Flipped the selection vertically."));
}

/* ---------- panel thuộc tính cho path ---------- */
function vecShapeFields(h,skipGeom){
 const b=vecObjBox(h)||{x0:0,y0:0,x1:0,y1:0},w=b.x1-b.x0,hh=b.y1-b.y0;
 const isPath=h.t==="path",nNodes=isPath?(h.nodes||[]).length:0;
 let s=`<div class="sect">${isPath?_("Hình học path","Path geometry"):_("Vị trí & kích thước","Position & size")}</div>
 <div class="hint">${isPath?(_("Số điểm neo: ","Anchors: ")+"<b>"+nNodes+"</b> • "+(h.closed?_("Đường kín","closed"):_("Đường hở","open"))+" • "):""}${_("Rộng ","W ")}${r3(w)} × ${_("cao ","H ")}${r3(hh)}</div>
 ${skipGeom?"":`<div class="row"><div><label for="vX">X</label><input id="vX" type="number" step="1" value="${r3(b.x0)}"></div><div><label for="vY">Y</label><input id="vY" type="number" step="1" value="${r3(b.y0)}"></div></div>
 <div class="row"><div><label for="vW">${_("Rộng","Width")}</label><input id="vW" type="number" step="1" min="0.5" value="${r3(w)}"></div><div><label for="vH">${_("Cao","Height")}</label><input id="vH" type="number" step="1" min="0.5" value="${r3(hh)}"></div></div>
 <label for="vAng">${_("Xoay (độ)","Rotate (degrees)")}</label><div class="row"><input id="vAng" type="number" step="5" value="0" placeholder="0"><button class="btn" style="flex:0 0 auto" onclick="vecRotateBy(parseFloat($('vAng').value)||0)">↻ ${_("Xoay","Rotate")}</button></div>
 <label for="vPct">${_("Tỷ lệ (%)","Scale (%)")}</label><div class="row"><input id="vPct" type="number" step="10" value="100" placeholder="100"><button class="btn" style="flex:0 0 auto" onclick="vecScaleBy((parseFloat($('vPct').value)||100)/100)">⤢ ${_("Áp dụng","Apply")}</button></div>
 <div class="grid2"><button class="btn" onclick="vecReflect('h')">⇋ ${_("Lật ngang","Flip H")}</button><button class="btn" onclick="vecReflect('v')">⇵ ${_("Lật dọc","Flip V")}</button></div>
 <label class="chk"><input type="checkbox" id="vClosed"${h.closed?" checked":""}>${_("Khép kín đường","Close the path")}</label>`}
 <div class="sect">${_("Thứ tự lớp","Z-order")}</div>
 <div class="grid2"><button class="btn" onclick="vecZOrder('front')" title="Ctrl+Shift+]">⤒ ${_("Lên trên cùng","To front")}</button><button class="btn" onclick="vecZOrder('back')" title="Ctrl+Shift+[">⤓ ${_("Xuống dưới cùng","To back")}</button><button class="btn" onclick="vecZOrder('up')" title="Ctrl+]">↑ ${_("Lên một bậc","Forward")}</button><button class="btn" onclick="vecZOrder('down')" title="Ctrl+[">↓ ${_("Xuống một bậc","Backward")}</button></div>
 <div class="sect">${_("Nhóm","Group")}</div>
 <div class="grid2"><button class="btn" onclick="vecGroup()" title="Ctrl+G">▣ ${_("Nhóm","Group")}</button><button class="btn" onclick="vecUngroup()" title="Ctrl+Shift+G">▢ ${_("Rã nhóm","Ungroup")}</button></div>`;
 return s;
}
function vecBindShapeFields(h){
 const onNum=(id,fn)=>{const e=$(id);if(!e)return;e.addEventListener("change",()=>{fn(parseFloat(String(e.value).replace(",",".")))})};
 onNum("vX",v=>{if(!isFinite(v))return;const b=vecBox(h);const d=v-b.x0;if(Math.abs(d)>1e-6){vecMove(h,d,0);commit(_("Dời theo X","Move X"));renderAll()}});
 onNum("vY",v=>{if(!isFinite(v))return;const b=vecBox(h);const d=v-b.y0;if(Math.abs(d)>1e-6){vecMove(h,0,d);commit(_("Dời theo Y","Move Y"));renderAll()}});
 onNum("vW",v=>{const b=vecBox(h),w=b.x1-b.x0;if(v>0.1&&Math.abs(v-w)>0.01)vecScaleBy(v/w)});
 onNum("vH",v=>{const b=vecBox(h),hh=b.y1-b.y0;if(v>0.1&&Math.abs(v-hh)>0.01)vecScaleBy(v/hh)});
 bindChk("vClosed",v=>{h.closed=v;commit(_("Khép kín đường","Close path"));renderAll()},_("Khép kín","Close"));
}
/* Panel khi đang dùng công cụ vẽ của module Vector */
function vecToolProps(){
 const box=$("props");if(!box)return;
 const c=vecCfg();
 box.innerHTML=`<h3 class="ph">${_("Vector — kiểu nét sẽ vẽ","Vector — style for new shapes")}</h3>
 <div class="hint">${_("Công cụ: ","Tool: ")}<b>${esc(T_(SHAPE_T[tool]||""))||esc(tool)}</b>. ${esc(_(...vecHint(tool)))}</div>
 <label for="vCol">${_("Màu nét","Stroke colour")}</label><input id="vCol" type="color" value="${c.stroke}">
 <label for="vSw">${_("Độ dày nét","Stroke width")}</label><input id="vSw" type="number" min="0.5" max="30" step="0.5" value="${c.sw}">
 <label for="vDash">${_("Kiểu nét","Dash style")}</label><select id="vDash">${optList(Object.entries(DASHES).map(([k,v])=>[k,_(v)]),c.dash)}</select>
 <label for="vFill">${_("Màu tô","Fill colour")}</label><input id="vFill" type="color" value="${c.fill||"#dbeafe"}">
 <label class="chk"><input type="checkbox" id="vNoFill"${c.fill?"":" checked"}>${_("Không tô","No fill")}</label>
 <label class="chk"><input type="checkbox" id="vGrid"${c.grid?" checked":""}>${_("Bắt dính lưới","Snap to grid")}</label>
 <label for="vGs">${_("Bước lưới","Grid step")}</label><input id="vGs" type="number" min="1" step="1" value="${c.gstep}">
 <label class="chk"><input type="checkbox" id="vAng"${c.snapAngle?" checked":""}>${_("Giữ góc 0/45/90° khi giữ Shift","Constrain to 0/45/90° with Shift")}</label>
 <p class="hint">${_("Phím tắt: V chọn • A sửa điểm • P bút • T chữ • M chữ nhật • L ellipse • \\\\ đường thẳng • R xoay • S tỷ lệ • O lật.","Shortcuts: V select • A direct • P pen • T type • M rectangle • L ellipse • \\\\ line • R rotate • S scale • O reflect.")}</p>`;
 const on=(id,ev,fn)=>{const e=$(id);if(e)e.addEventListener(ev,fn)};
 on("vCol","change",e=>{c.stroke=e.target.value;commit(_("Màu nét","Stroke colour"))});
 on("vSw","change",e=>{c.sw=Math.min(30,Math.max(.5,+e.target.value||2));commit(_("Độ dày nét","Stroke width"))});
 on("vDash","change",e=>{c.dash=e.target.value;commit(_("Kiểu nét","Dash style"))});
 on("vFill","change",e=>{c.fill=e.target.value;const n=$("vNoFill");if(n)n.checked=false;commit(_("Màu tô","Fill colour"))});
 on("vNoFill","change",e=>{c.fill=e.target.checked?"":($("vFill").value||"#dbeafe");commit(_("Tô màu","Fill"))});
 on("vGrid","change",e=>{c.grid=e.target.checked;commit(_("Bắt dính lưới","Snap to grid"))});
 on("vGs","change",e=>{c.gstep=Math.max(1,+e.target.value||10);commit(_("Bước lưới","Grid step"))});
 on("vAng","change",e=>{c.snapAngle=e.target.checked});
 on("vRuler","change",e=>{c.ruler=e.target.checked;commit(_("Bật/tắt thước","Toggle rulers"));if(typeof vecRulerDraw==="function")vecRulerDraw()});
}

function vecRenderTextProps(h){
 const box=$("props");
 box.innerHTML=`<h3 class="ph">${_("Chữ vector","Vector text")}</h3>`+vecTextFields(h)+vecShapeFields(h,true);
 vecBindTextFields(h);vecBindShapeFields(h);
}
/* ---------- tạo chữ vector ---------- */
function vecNewText(x,y,mode){
 const c=vecCfg();
 const h={id:uid("s"),t:"vtext",x:x,y:y,w:mode==="area"?220:160,h:mode==="area"?90:28,rot:0,mode:mode||"point",
  text:mode==="area"?_("Chữ trong vùng — xuống dòng tự động theo bề rộng hộp.","Area text — wraps automatically to the box width."):_("Chữ vector","Vector text"),
  ff:"",fz:c.fz||16,b:false,i:false,mh:false,mv:false,al:"l",lh:1.28,
  col:c.stroke,fill:"",fo:1,z:"f"};
 vtextAutoSize(h);
 state.shapes.push(h);
 sel=new Set([h.id]);selEdge=null;
 commit(_("Thêm chữ vector","Add vector text"));renderAll();
 return h;
}
/* ---------- panel thuộc tính cho chữ vector ---------- */
function vecTextFields(h){
 const area=h.mode==="area";
 let s=`<div class="sect">${_("Nội dung chữ","Text content")}</div>
 <label for="vTxt">${area?_("Chữ trong vùng (tự xuống dòng)","Area text (wraps automatically)"):_("Chữ theo dòng (Enter để xuống dòng)","Point text (Enter for a new line)")}</label>
 <textarea id="vTxt" rows="4">${esc(h.text||"")}</textarea>
 <label for="vFf">${_("Font chữ","Font family")}</label><select id="vFf">${fontOpts(h.ff||"",true)}</select>
 <div class="row"><div><label for="vFz">${_("Cỡ chữ","Font size")}</label><input id="vFz" type="number" min="3" max="200" step="1" value="${h.fz}"></div>
  <div><label for="vAl">${_("Căn lề","Alignment")}</label><select id="vAl">${optList([["l",_("Trái","Left")],["c",_("Giữa","Centre")],["r",_("Phải","Right")]],h.al)}</select></div></div>
 <div class="grid2"><button class="btn${h.b?" active":""}" onclick="vecTextFlag('b')" title="Ctrl+B"><b>B</b> ${_("Đậm","Bold")}</button><button class="btn${h.i?" active":""}" onclick="vecTextFlag('i')" title="Ctrl+I"><i>I</i> ${_("Nghiêng","Italic")}</button></div>
 <div class="sect">${_("Kiểu chữ","Text mode")}</div>
 <div class="grid2"><button class="btn${area?"":" active"}" onclick="vecTextMode('point')">${_("Theo dòng","Point")}</button><button class="btn${area?" active":""}" onclick="vecTextMode('area')">${_("Trong vùng","Area")}</button></div>
 <label for="vTcol">${_("Màu chữ","Text colour")}</label><input id="vTcol" type="color" value="${esc(h.col||"#17202a")}">
 <div class="row"><label class="chk"><input type="checkbox" id="vTbgOn"${h.fill?" checked":""}>${_("Nền sau chữ","Background")}</label><input id="vTbg" type="color" value="${esc(h.fill||"#ffffff")}"></div>
 <div class="sect">${_("Hình học","Geometry")}</div>
 <div class="row"><div><label for="vTx">X</label><input id="vTx" type="number" step="1" value="${r3(h.x)}"></div><div><label for="vTy">Y</label><input id="vTy" type="number" step="1" value="${r3(h.y)}"></div></div>
 <div class="row"><div><label for="vTw">${_("Rộng","Width")}</label><input id="vTw" type="number" step="1" min="4" value="${r3(h.w)}"></div><div><label for="vTh">${_("Cao","Height")}</label><input id="vTh" type="number" step="1" min="4" value="${r3(h.h)}"></div></div>
 <label for="vTrot">${_("Xoay (độ)","Rotate (degrees)")}</label><div class="row"><input id="vTrot" type="number" step="5" value="${r3(h.rot||0)}"><button class="btn" style="flex:0 0 auto" onclick="vecTextRot(parseFloat($('vTrot').value)||0)">↻</button></div>
 <div class="grid2"><button class="btn" onclick="vecReflect('h')">⇋ ${_("Lật ngang","Flip H")}</button><button class="btn" onclick="vecReflect('v')">⇵ ${_("Lật dọc","Flip V")}</button></div>`;
 return s;
}
function vecTextFlag(k){
 const h=vecSel()[0];if(!h||h.t!=="vtext")return;
 h[k]=!h[k];commit(_("Định dạng chữ","Text style"));renderAll();
}
function vecTextMode(m){
 const h=vecSel()[0];if(!h||h.t!=="vtext")return;
 h.mode=m==="area"?"area":"point";
 if(h.mode==="area"&&h.w<80)h.w=220;
 vtextAutoSize(h);
 commit(_("Đổi kiểu chữ","Change text mode"));renderAll();
 setStatus(h.mode==="area"?_("Chữ trong vùng: tự xuống dòng theo bề rộng hộp.","Area text: wraps to the box width."):_("Chữ theo dòng: chỉ xuống dòng khi bạn gõ Enter.","Point text: only breaks where you press Enter."));
}
function vecTextRot(deg){
 const h=vecSel()[0];if(!h||h.t!=="vtext")return;
 const b=vecObjBox(h);
 vtextRotate(h,deg,(b.x0+b.x1)/2,(b.y0+b.y1)/2);
 commit(_("Xoay chữ","Rotate text"));renderAll();
}
function vecBindTextFields(h){
 const ta=$("vTxt");
 if(ta)ta.addEventListener("input",()=>{h.text=ta.value;renderCanvasOnly()});
 if(ta)ta.addEventListener("change",()=>{vtextAutoSize(h);commit(_("Sửa nội dung chữ","Edit text"));renderAll()});
 const onSel=(id,fn)=>{const e=$(id);if(e)e.addEventListener("change",()=>{fn(e.value);commit(_("Định dạng chữ","Text style"));renderAll()})};
 onSel("vFf",v=>{h.ff=v;vtextAutoSize(h)});
 onSel("vFz",v=>{h.fz=Math.min(200,Math.max(3,+v||14));vtextAutoSize(h)});
 onSel("vAl",v=>{h.al=v});
 onSel("vTcol",v=>{h.col=v});
 onNumEl("vTx",v=>{h.x=v});
 onNumEl("vTy",v=>{h.y=v});
 onNumEl("vTw",v=>{h.w=Math.max(4,v)});
 onNumEl("vTh",v=>{h.h=Math.max(4,v)});
 const bg=$("vTbgOn"),bc=$("vTbg");
 if(bg)bg.addEventListener("change",()=>{h.fill=bg.checked?(bc?bc.value:"#ffffff"):"";commit(_("Nền chữ","Text background"));renderAll()});
 if(bc)bc.addEventListener("change",()=>{if(bg&&bg.checked)h.fill=bc.value;commit(_("Nền chữ","Text background"));renderAll()});
}
function onNumEl(id,fn){
 const e=$(id);if(!e)return;
 e.addEventListener("change",()=>{const v=parseFloat(String(e.value).replace(",","."));if(isFinite(v)){fn(v);commit(_("Sửa chữ","Edit text"));renderAll()}});
}
/* ---------- panel thuộc tính riêng của module Vector ---------- */
function vecRenderProps(){
 const box=$("props");if(!box)return;
 const hSel=selShapes(), nSel=selNodes();
 if(sel.size>1){
  const n=sel.size;
  box.innerHTML=`<h3 class="ph">${_(`Đã chọn ${n} đối tượng`,`${n} objects selected`)}</h3>
  <div class="sect">${_("Căn chỉnh","Align")}</div>
  <div class="grid2">
   <button class="btn" onclick="vecAlign('left')">⇤ ${_("Trái","Left")}</button>
   <button class="btn" onclick="vecAlign('right')">${_("Phải","Right")} ⇥</button>
   <button class="btn" onclick="vecAlign('cx')">↔ ${_("Giữa dọc","Centre H")}</button>
   <button class="btn" onclick="vecAlign('top')">⤒ ${_("Trên","Top")}</button>
   <button class="btn" onclick="vecAlign('bottom')">⤓ ${_("Dưới","Bottom")}</button>
   <button class="btn" onclick="vecAlign('cy')">↕ ${_("Giữa ngang","Centre V")}</button>
  </div>
  <div class="sect">${_("Phân bố","Distribute")}</div>
  <div class="grid2"><button class="btn" onclick="vecAlign('dh')">⇔ ${_("Chia đều ngang","Distribute H")}</button><button class="btn" onclick="vecAlign('dv')">⇕ ${_("Chia đều dọc","Distribute V")}</button></div>
  <div class="sect">${_("Nhóm & thứ tự lớp","Group & z-order")}</div>
  <div class="grid2"><button class="btn" onclick="vecGroup()">▣ ${_("Nhóm","Group")}</button><button class="btn" onclick="vecUngroup()">▢ ${_("Rã nhóm","Ungroup")}</button>
   <button class="btn" onclick="vecZOrder('front')">⤒ ${_("Lên trên cùng","To front")}</button><button class="btn" onclick="vecZOrder('back')">⤓ ${_("Xuống dưới cùng","To back")}</button>
   <button class="btn" onclick="vecZOrder('up')">↑ ${_("Lên một bậc","Forward")}</button><button class="btn" onclick="vecZOrder('down')">↓ ${_("Xuống một bậc","Backward")}</button></div>
  <div class="sect">${_("Biến đổi","Transform")}</div>
  <div class="row"><div><label for="vAng2">${_("Xoay (độ)","Rotate (°)")}</label><input id="vAng2" type="number" step="5" value="0"></div><button class="btn" style="flex:0 0 auto" onclick="vecRotateBy(parseFloat($('vAng2').value)||0)">↻</button></div>
  <div class="row"><div><label for="vPct2">${_("Tỷ lệ (%)","Scale (%)")}</label><input id="vPct2" type="number" step="10" value="100"></div><button class="btn" style="flex:0 0 auto" onclick="vecScaleBy((parseFloat($('vPct2').value)||100)/100)">⤢</button></div>
  <div class="grid2"><button class="btn" onclick="vecReflect('h')">⇋ ${_("Lật ngang","Flip H")}</button><button class="btn" onclick="vecReflect('v')">⇵ ${_("Lật dọc","Flip V")}</button></div>
  <div class="grid2"><button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div>`;
  return;
 }
 if(hSel.length===1){
  if(hSel[0].t==="vtext"){vecRenderTextProps(hSel[0]);return}
  renderShapeProps(hSel[0]);return;
 }
 if(nSel.length===1){renderNodeProps(nSel[0]);return}
 vecToolProps();
}

/* ---------- khởi động ---------- */
function vecBoot(){
 try{
  const raw=localStorage.getItem(KEYC_VEC);
  if(raw){
   const d=JSON.parse(raw), st=normalizeState(d.state||d);
   if(st.meta.doc==="vec")STORE.vec={state:st,view:{x:30,y:30,k:.6},hist:[],fut:[],cur:{s:JSON.stringify({meta:st.meta,nodes:st.nodes,edges:st.edges,shapes:st.shapes,nextId:st.nextId,nextStream:st.nextStream}),l:_("Khôi phục","Restored")},sel:new Set()};
  }
 }catch(e){}
 try{const p=JSON.parse(localStorage.getItem(PKEY)||"null");if(p&&p.mod==="vec")setModule("vec")}catch(e){}
}
