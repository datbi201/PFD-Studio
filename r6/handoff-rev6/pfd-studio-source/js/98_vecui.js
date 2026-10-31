/* ============ MODULE VECTOR — CHỮ VECTOR, THƯỚC, CÔNG CỤ ĐO, MENU CHUỘT PHẢI (Rev.6b-ui) ============ */
/* File này chỉ chứa phần GIAO DIỆN BỔ TRỢ: không quyết định hình học (95) hay tương tác chính (97). */

/* ================= 1. CHỮ VECTOR ================= */
/* Vẽ hộp chữ: nền (nếu có) → các dòng chữ → khung chọn khi đang sửa.
   Toàn bộ nằm trong một <g transform> để xoay/lật là một phép biến đổi duy nhất. */
function vtextMarkup(h,it){
 const fz=h.fz||14, lh=h.lh||1.28, pad=4;
 const ff=h.ff||(typeof FF==="function"?FF("note"):"Arial");
 const lines=vtextLines(h);
 const cx=h.x+h.w/2, cy=h.y+h.h/2;
 let inner="";
 if(h.fill)inner+=`<rect x="${r3(h.x)}" y="${r3(h.y)}" width="${r3(h.w)}" height="${r3(h.h)}" rx="2" fill="${esc(h.fill)}" fill-opacity="${r3(h.fo!=null?h.fo:1)}"/>`;
 if(it)inner+=`<rect x="${r3(h.x)}" y="${r3(h.y)}" width="${r3(h.w)}" height="${r3(h.h)}" fill="transparent" stroke="none"/>`;
 lines.forEach(function(ln,i){
  const y=h.y+pad+fz*(0.94+i*lh);
  const x=h.al==="c"?h.x+h.w/2:h.al==="r"?h.x+h.w-2:h.x+2;
  const anc=h.al==="c"?"middle":h.al==="r"?"end":"start";
  inner+=`<text x="${r3(x)}" y="${r3(y)}" text-anchor="${anc}" font-family="${esc(ff)}" font-size="${r3(fz)}" font-weight="${h.b?700:400}"${h.i?' font-style="italic"':""} fill="${esc(h.col||"#17202a")}">${esc(ln)}</text>`;
 });
 if(it)inner+=`<rect x="${r3(h.x)}" y="${r3(h.y)}" width="${r3(h.w)}" height="${r3(h.h)}" fill="none" stroke="#1677ff" stroke-width="${r3(1/view.k)}" stroke-dasharray="4 3" pointer-events="none"/>`;
 const sc=`scale(${h.mh?-1:1},${h.mv?-1:1})`;
 const tf=`translate(${r3(cx)},${r3(cy)}) rotate(${r3(h.rot||0)}) ${sc} translate(${r3(-cx)},${r3(-cy)})`;
 return `<g transform="${tf}">${inner}</g>`;
}
/* Bấm công cụ T: bấm = chữ theo dòng; KÉO = chữ trong vùng (có hộp) */
function vecTypeDown(ev,w){
 const t=ev.target, shEl=t&&t.closest?t.closest("[data-shape]"):null;
 if(shEl){
  const h=getShape(shEl.dataset.shape);
  if(h&&h.t==="vtext"){sel=new Set([h.id]);selEdge=null;renderAll();focusField("vTxt");return}
 }
 VEC.drag={type:"vtydraw",p0:vecSnapPt(w,null,ev),p1:vecSnapPt(w,null,ev),moved:false};
}
function vecTypeDrawMove(w,ev){
 const d=VEC.drag;
 let p1=vecSnapPt(w,null,ev);
 d.p1=p1;d.moved=Math.hypot(p1.x-d.p0.x,p1.y-d.p0.y)*view.k>6;
 if(d.moved){
  const x0=Math.min(d.p0.x,p1.x),y0=Math.min(d.p0.y,p1.y);
  VEC.live={x:p1.x,y:p1.y,text:`${r3(Math.abs(p1.x-d.p0.x))} × ${r3(Math.abs(p1.y-d.p0.y))}`};
  VEC.draft=null;
  renderVecOverlay();
  /* xem trước hộp chữ bằng một path chữ nhật tạm */
  const g=$("gVec");
  if(g)g.insertAdjacentHTML("beforeend",`<rect x="${r3(x0)}" y="${r3(y0)}" width="${r3(Math.abs(p1.x-d.p0.x))}" height="${r3(Math.abs(p1.y-d.p0.y))}" fill="#1677ff" fill-opacity=".06" stroke="#1677ff" stroke-width="${r3(1/view.k)}" stroke-dasharray="4 3" pointer-events="none"/>`);
 }
}
function vecTypeDrawUp(){
 const d=VEC.drag;VEC.drag=null;VEC.live=null;
 if(!d)return;
 let h;
 if(d.moved&&Math.abs(d.p1.x-d.p0.x)>8&&Math.abs(d.p1.y-d.p0.y)>8){
  h=vecNewText(Math.min(d.p0.x,d.p1.x),Math.min(d.p0.y,d.p1.y),"area");
  h.w=Math.abs(d.p1.x-d.p0.x);h.h=Math.abs(d.p1.y-d.p0.y);
  commit(_("Thêm chữ trong vùng","Add area text"));renderAll();
  setStatus(_("Đã tạo vùng chữ. Gõ nội dung ở ô bên phải — chữ tự xuống dòng theo bề rộng.","Area text created. Type in the panel on the right — it wraps to the box width."));
 }else{
  h=vecNewText(d.p0.x,d.p0.y,"point");
  setStatus(_("Đã tạo chữ theo dòng. Gõ nội dung ở ô bên phải; Enter để xuống dòng.","Point text created. Type in the panel on the right; Enter adds a new line."));
 }
 focusField("vTxt");
}

/* ================= 2. CÔNG CỤ ĐO (CAD) ================= */
function vecMeasureDown(ev,w){
 const p=vecSnapPt(w,null,ev);
 if(!VEC.measure||VEC.measure.pts.length>=3)VEC.measure={pts:[p],cur:p};
 else{VEC.measure.pts.push(p);VEC.measure.cur=p}
 renderVecOverlay();vecMeasureReport();
}
function vecMeasureCancel(){
 VEC.measure=null;renderVecOverlay();
 setStatus(_("Đã xoá số đo. Bấm 2 điểm để đo khoảng cách, 3 điểm để đo góc.","Measurement cleared. Click 2 points for a distance, 3 for an angle."));
}
function vecMeasureReport(){
 const M=VEC.measure;if(!M)return;
 const P=M.pts;
 if(P.length===1){setStatus(_("Đo: đã chọn điểm 1. Bấm điểm 2.","Measure: point 1 set. Click point 2."));return}
 const d=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y);
 const brg=(Math.atan2(-(P[1].y-P[0].y),P[1].x-P[0].x)*180/Math.PI+360)%360;
 if(P.length===2){
  setStatus(_(`Khoảng cách ${r3(d)} đơn vị (${r3(d/(typeof MM!=="undefined"?MM:4))} mm), góc phương vị ${r3(brg)}°. Bấm điểm 3 để đo góc.`,
   `Distance ${r3(d)} units (${r3(d/(typeof MM!=="undefined"?MM:4))} mm), bearing ${r3(brg)}°. Click a 3rd point to measure an angle.`));
  return;
 }
 const a1=Math.atan2(-(P[0].y-P[1].y),P[0].x-P[1].x), a2=Math.atan2(-(P[2].y-P[1].y),P[2].x-P[1].x);
 let ang=Math.abs((a2-a1)*180/Math.PI); if(ang>180)ang=360-ang;
 const d2=Math.hypot(P[2].x-P[1].x,P[2].y-P[1].y);
 setStatus(_(`Góc tại điểm giữa: ${r3(ang)}°. Cạnh 1 = ${r3(d)}, cạnh 2 = ${r3(d2)}.`,
   `Angle at the middle point: ${r3(ang)}°. Side 1 = ${r3(d)}, side 2 = ${r3(d2)}.`));
}
function vecMeasureMarkup(){
 const M=VEC.measure;if(!M)return"";
 const P=M.pts.slice();if(M.cur&&P.length<3)P.push(M.cur);
 if(P.length<2)return"";
 const U=(typeof MM!=="undefined"?MM:4);
 const k=1/view.k, fs=12*k;
 let s="";
 const dot=p=>`<circle cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(3.5*k)}" fill="#e11d48" pointer-events="none"/>`;
 s+=`<path d="${P.map((p,i)=>(i?"L":"M")+r3(p.x)+" "+r3(p.y)).join(" ")}" fill="none" stroke="#e11d48" stroke-width="${r3(1.6*k)}" stroke-dasharray="6 4" pointer-events="none"/>`;
 P.forEach(function(p){s+=dot(p)});
 const lbl=(x,y,txt,col)=>{
  const w=String(txt).length*6.6*k+10*k;
  return `<g pointer-events="none"><rect x="${r3(x-w/2)}" y="${r3(y-14*k)}" width="${r3(w)}" height="${r3(18*k)}" rx="${r3(3*k)}" fill="${col||"#e11d48"}"/><text x="${r3(x)}" y="${r3(y-1*k)}" text-anchor="middle" font-family="Arial" font-size="${r3(fs)}" fill="#fff">${esc(txt)}</text></g>`;
 };
 for(let i=0;i<P.length-1;i++){
  const a=P[i], b=P[i+1];
  const d=Math.hypot(b.x-a.x,b.y-a.y);
  const brg=(Math.atan2(-(b.y-a.y),b.x-a.x)*180/Math.PI+360)%360;
  s+=lbl((a.x+b.x)/2,(a.y+b.y)/2-k*10,`${r3(d)} (${r3(d/U)} mm)  ${r3(brg)}°`);
 }
 if(P.length>=3){
  const a1=Math.atan2(-(P[0].y-P[1].y),P[0].x-P[1].x), a2=Math.atan2(-(P[2].y-P[1].y),P[2].x-P[1].x);
  let ang=Math.abs((a2-a1)*180/Math.PI); if(ang>180)ang=360-ang;
  const r=Math.min(40*k, Math.hypot(P[0].x-P[1].x,P[0].y-P[1].y)*0.5);
  s+=`<path d="M ${r3(P[1].x+r)} ${r3(P[1].y)} A ${r3(r)} ${r3(r)} 0 0 ${((a2-a1)>0)?0:1} ${r3(P[1].x+Math.cos(a1)*r)} ${r3(P[1].y-Math.sin(a1)*r)}" fill="none" stroke="#e11d48" stroke-width="${r3(1.4*k)}" pointer-events="none"/>`;
  s+=lbl(P[1].x,P[1].y-26*k,`${r3(ang)}°`,"#be123c");
 }
 return s;
}

/* ================= 3. THƯỚC (RULER) ================= */
function vecRulerStep(){
 const cand=[1,2,5,10,20,25,50,100,200,250,500,1000,2000,5000,10000];
 for(let i=0;i<cand.length;i++)if(cand[i]*view.k>=52)return cand[i];
 return 10000;
}
function vecRulerDraw(){
 const g=$("gRuler");if(!g)return;
 if(!(typeof vecOn==="function"&&vecOn())||vecCfg().ruler===false){g.innerHTML="";return}
 const W=Math.max(1,board.clientWidth||800), H=Math.max(1,board.clientHeight||600);
 const T=18;                                   /* bề dày thước, px */
 const step=vecRulerStep(), sub=step/5;
 const x0=(0-view.x)/view.k, x1=(W-view.x)/view.k;
 const y0=(0-view.y)/view.k, y1=(H-view.y)/view.k;
 let s="";
 /* nền thước (dùng biến CSS để tự đổi theo theme sáng/tối) */
 s+=`<rect x="0" y="0" width="${W}" height="${T}" fill="var(--panel)" opacity=".93"/>`;
 s+=`<rect x="0" y="0" width="${T}" height="${H}" fill="var(--panel)" opacity=".93"/>`;
 s+=`<path d="M0 ${T}H${W}M${T} 0V${H}" stroke="var(--line2)" stroke-width="1"/>`;
 /* vạch phụ */
 let t1="",t2="";
 for(let x=Math.floor(x0/sub)*sub;x<=x1;x+=sub){
  const px=view.x+x*view.k; if(px<T)continue;
  t1+=`M${r3(px)} ${T}V${T-5}`;
 }
 for(let y=Math.floor(y0/sub)*sub;y<=y1;y+=sub){
  const py=view.y+y*view.k; if(py<T)continue;
  t2+=`M${T} ${r3(py)}H${T-5}`;
 }
 s+=`<path d="${t1}" stroke="currentColor" stroke-width="1" opacity=".55"/>`;
 s+=`<path d="${t2}" stroke="currentColor" stroke-width="1" opacity=".55"/>`;
 /* vạch chính + số */
 let t3="",t4="";
 for(let x=Math.floor(x0/step)*step;x<=x1;x+=step){
  const px=view.x+x*view.k; if(px<T)continue;
  t3+=`M${r3(px)} ${T}V${T-9}`;
  s+=`<text x="${r3(px+3)}" y="${T-3}" font-family="Arial" font-size="9" fill="currentColor">${r3(x)}</text>`;
 }
 for(let y=Math.floor(y0/step)*step;y<=y1;y+=step){
  const py=view.y+y*view.k; if(py<T)continue;
  t4+=`M${T} ${r3(py)}H${T-9}`;
  s+=`<text x="2" y="${r3(py-2)}" font-family="Arial" font-size="9" fill="currentColor">${r3(y)}</text>`;
 }
 s+=`<path d="${t3}" stroke="currentColor" stroke-width="1.3"/>`;
 s+=`<path d="${t4}" stroke="currentColor" stroke-width="1.3"/>`;
 /* ô góc: bấm để bật/tắt thước */
 s+=`<rect x="0" y="0" width="${T}" height="${T}" fill="var(--panel)" stroke="var(--line2)" stroke-width="1" pointer-events="all" style="cursor:pointer" onclick="vecRulerToggle()"><title>${_("Bật / tắt thước","Show / hide rulers")}</title></rect>`;
 s+=`<text x="4" y="12" font-family="Arial" font-size="9" fill="currentColor" pointer-events="none">px</text>`;
 g.innerHTML=s;
}
function vecRulerToggle(){
 const c=vecCfg();c.ruler=c.ruler===false;commit(_("Bật/tắt thước","Toggle rulers"));vecRulerDraw();
 setStatus(c.ruler?_("Đã bật thước.","Rulers on."):_("Đã tắt thước.","Rulers off."));
}

/* ================= 4. MENU CHUỘT PHẢI ================= */
function vecContextMenu(ev){
 const el=$("vecMenu");if(!el)return;
 const t=ev.target, shEl=t&&t.closest?t.closest("[data-shape]"):null;
 if(shEl&&!sel.has(shEl.dataset.shape)){
  sel=new Set([shEl.dataset.shape]);selEdge=null;vecExpandSel();renderAll();
 }
 const n=sel.size, one=n===1, multi=n>1;
 const has=!!n;
 const item=(act,label,key,dis)=>`<button class="mi" data-a="${act}"${dis?" disabled":""}><span>${esc(label)}</span>${key?`<span class="mk">${esc(key)}</span>`:""}</button>`;
 const sep=`<div class="msep"></div>`;
 let s="";
 s+=item("cut",_("Cắt","Cut"),"Ctrl+X",!has);
 s+=item("copy",_("Sao chép","Copy"),"Ctrl+C",!has);
 s+=item("paste",_("Dán","Paste"),"Ctrl+V",!clip);
 s+=item("dup",_("Nhân bản","Duplicate"),"Ctrl+D",!has);
 s+=item("del",_("Xoá","Delete"),"Del",!has);
 s+=sep;
 s+=item("group",_("Nhóm","Group"),"Ctrl+G",!multi);
 s+=item("ungroup",_("Rã nhóm","Ungroup"),"Ctrl+Shift+G",!has);
 s+=item("front",_("Lên trên cùng","Bring to front"),"Ctrl+Shift+]",!has);
 s+=item("back",_("Xuống dưới cùng","Send to back"),"Ctrl+Shift+[",!has);
 s+=item("up",_("Lên một bậc","Bring forward"),"Ctrl+]",!has);
 s+=item("down",_("Xuống một bậc","Send backward"),"Ctrl+[",!has);
 s+=sep;
 if(multi){
  s+=item("al",_("Căn trái","Align left"));
  s+=item("acx",_("Căn giữa dọc","Centre horizontally"));
  s+=item("ar",_("Căn phải","Align right"));
  s+=item("at",_("Căn trên","Align top"));
  s+=item("acy",_("Căn giữa ngang","Centre vertically"));
  s+=item("ab",_("Căn dưới","Align bottom"));
  s+=item("adh",_("Chia đều ngang","Distribute horizontally"));
  s+=item("adv",_("Chia đều dọc","Distribute vertically"));
  s+=sep;
 }
 s+=item("rot90",_("Xoay 90°","Rotate 90°"),"",!has);
 s+=item("fh",_("Lật ngang","Flip horizontal"),"",!has);
 s+=item("fv",_("Lật dọc","Flip vertical"),"",!has);
 s+=item("pivot",_("Đưa tâm quay về giữa","Reset rotation centre"),"",!has);
 s+=sep;
 s+=item("all",_("Chọn tất cả","Select all"),"Ctrl+A");
 s+=item("fit",_("Vừa khung nhìn","Fit to view"),"Ctrl+0");
 el.innerHTML=s;
 el.classList.add("open");
 const mw=230, mh=el.offsetHeight||420;
 el.style.left=Math.min(ev.clientX, window.innerWidth-mw-8)+"px";
 el.style.top=Math.min(ev.clientY, window.innerHeight-mh-8)+"px";
 el.querySelectorAll("button.mi").forEach(function(b){
  b.onclick=function(){vecMenuAct(b.dataset.a);vecMenuClose()};
 });
 VEC.ctx=ev;
 ev.preventDefault();
}
function vecMenuClose(){const el=$("vecMenu");if(el)el.classList.remove("open")}
function vecMenuAct(a){
 switch(a){
  case"cut":copySel();deleteSelected();break;
  case"copy":copySel();break;
  case"paste":pasteClip();break;
  case"dup":dupSel();break;
  case"del":deleteSelected();break;
  case"group":vecGroup();break;
  case"ungroup":vecUngroup();break;
  case"front":case"back":case"up":case"down":vecZOrder(a);break;
  case"al":vecAlign("left");break;case"ar":vecAlign("right");break;case"acx":vecAlign("cx");break;
  case"at":vecAlign("top");break;case"ab":vecAlign("bottom");break;case"acy":vecAlign("cy");break;
  case"adh":vecAlign("dh");break;case"adv":vecAlign("dv");break;
  case"rot90":vecRotateBy(90);break;
  case"fh":vecReflect("h");break;case"fv":vecReflect("v");break;
  case"pivot":VEC.pivot=null;renderAll();setStatus(_("Đã đặt tâm quay về giữa hình.","Rotation centre reset to the middle."));break;
  case"all":sel=new Set(state.shapes.filter(h=>h.t==="path"||h.t==="vtext").map(h=>h.id));selEdge=null;renderAll();setStatus(_(`Đã chọn ${sel.size} đối tượng.`,`${sel.size} object(s) selected.`));break;
  case"fit":fitView();break;
 }
}
/* đóng menu khi bấm ra ngoài / Esc */
document.addEventListener("pointerdown",function(ev){
 const el=$("vecMenu");if(!el||!el.classList.contains("open"))return;
 if(!el.contains(ev.target))vecMenuClose();
},true);
document.addEventListener("keydown",function(ev){if(ev.key==="Escape")vecMenuClose()},true);
