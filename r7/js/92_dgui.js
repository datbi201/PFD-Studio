/* ============ MODULE SƠ ĐỒ — GIAO DIỆN: thư viện, chọn/kéo/co giãn/xoay, nối dây, sửa chữ, phím tắt ============ */
let dptr=null,dgEditing=null,dgRaf=0,dgLastDown={id:null,t:0};
const DG_ACC="#1677ff";
function dgSetTool(t){setTool(t);if(dgOn()){board.style.cursor=t==="dc"?"crosshair":t==="pan"?"grab":"default";if(t==="dc")setStatus(_("Nối: kéo từ một hình sang hình khác (hoặc ra chỗ trống để tạo đầu tự do). Esc để thoát.","Connect: drag from one shape to another (or to empty space for a free end). Esc to exit."));renderDg()}}
function dgQueueRender(){if(dgRaf)return;dgRaf=requestAnimationFrame(()=>{dgRaf=0;renderDg()})}
function dgTitle(s){const p=dgTitleOf(s);return p.length?p.join(" — "):_("(không có chữ)","(no text)")}
function dgKindName(s){const P=DG_PRESET[s.k];return P?_(P.vi,P.en):s.k}
function dgAnnounce(){
 const S=dgSelShapes(),C=dgSelConns();
 if(S.length===1&&!C.length){
  const s=S[0],pc=dgTreeParent(s.id),kids=dgTreeKids(s.id).length;
  setStatus(_(`Đã chọn: ${dgKindName(s)} "${dgTitle(s)}".`,`Selected: ${dgKindName(s)} "${dgTitle(s)}".`)+(pc||kids?_(` Cấp dưới: ${kids}.`,` Children: ${kids}.`):"")+_(" Tab thêm cấp dưới, Enter thêm ngang cấp, F2 sửa chữ, Alt+mũi tên đi theo cây.", " Tab adds a child, Enter adds a sibling, F2 edits text, Alt+arrows navigate the tree."));
 }else if(C.length===1&&!S.length){
  const c=C[0],m=dgById(state.dg.shapes),a=c.s&&m.get(c.s.id),b=c.e&&m.get(c.e.id);
  setStatus(_(`Đã chọn đường nối từ "${a?dgTitle(a):"đầu tự do"}" đến "${b?dgTitle(b):"đầu tự do"}"${c.tx?`, nhãn "${c.tx}"`:""}. Delete để xoá, Enter để sửa nhãn.`,`Selected connector from "${a?dgTitle(a):"free end"}" to "${b?dgTitle(b):"free end"}"${c.tx?`, label "${c.tx}"`:""}. Delete removes it, Enter edits the label.`));
 }else if(dsel.size)setStatus(_(`Đã chọn ${dsel.size} đối tượng.`,`${dsel.size} objects selected.`));
 else setStatus(_("Đã bỏ chọn.","Selection cleared."));
}
function dgSelect(ids,quiet){dsel=new Set(ids);renderDg();renderProps();if(!quiet)dgAnnounce()}
/* ============ LỚP PHỦ CHỌN ============ */
function dgOverlay(){
 if(!dgOn())return"";
 const k=view.k,hs=6.5/k,sw=1.5/k;let o="";
 const m=dgById(state.dg.shapes);
 const S=dgSelShapes();
 S.forEach(s=>{
  const tf=`translate(${_f(s.x)} ${_f(s.y)})${s.rot?` rotate(${_f(s.rot)} ${_f(s.w/2)} ${_f(s.h/2)})`:""}`;
  o+=`<g transform="${tf}" pointer-events="none"><rect x="0" y="0" width="${_f(s.w)}" height="${_f(s.h)}" fill="none" stroke="${DG_ACC}" stroke-width="${_f(sw)}" stroke-dasharray="${_f(4/k)} ${_f(3/k)}"/></g>`;
 });
 if(S.length===1&&!dgSelConns().length&&!dgEditing&&!S[0].lock){
  const s=S[0],tf=`translate(${_f(s.x)} ${_f(s.y)})${s.rot?` rotate(${_f(s.rot)} ${_f(s.w/2)} ${_f(s.h/2)})`:""}`;
  const hp={nw:[0,0],n:[s.w/2,0],ne:[s.w,0],e:[s.w,s.h/2],se:[s.w,s.h],s:[s.w/2,s.h],sw:[0,s.h],w:[0,s.h/2]},cur={nw:"nwse-resize",se:"nwse-resize",ne:"nesw-resize",sw:"nesw-resize",n:"ns-resize",s:"ns-resize",e:"ew-resize",w:"ew-resize"};
  o+=`<g transform="${tf}">`;
  Object.entries(hp).forEach(([n,p])=>{o+=`<rect data-dh="${n}" x="${_f(p[0]-hs/2)}" y="${_f(p[1]-hs/2)}" width="${_f(hs)}" height="${_f(hs)}" fill="#fff" stroke="${DG_ACC}" stroke-width="${_f(sw)}" style="cursor:${cur[n]}" pointer-events="all"/>`});
  const ry=-26/k;
  o+=`<line x1="${_f(s.w/2)}" y1="0" x2="${_f(s.w/2)}" y2="${_f(ry)}" stroke="${DG_ACC}" stroke-width="${_f(sw)}" pointer-events="none"/><circle data-dh="rot" cx="${_f(s.w/2)}" cy="${_f(ry)}" r="${_f(hs*.75)}" fill="#fff" stroke="${DG_ACC}" stroke-width="${_f(sw)}" style="cursor:grab" pointer-events="all"/>`;
  o+="</g>";
 }
 /* điểm nối: của hình đang chọn (đơn) hoặc của mọi hình khi dùng công cụ Nối */
 const siteOf=tool==="dc"?state.dg.shapes:(S.length===1?S:[]);
 siteOf.forEach(s=>dgSites(s).forEach((p,i)=>{
  const hot=dptr&&dptr.tgt&&dptr.tgt.id===s.id&&dptr.tgt.p===i;
  o+=`<circle data-dsite="${esc(s.id)}:${i}" cx="${_f(p.x)}" cy="${_f(p.y)}" r="${_f((hot?6.5:4.5)/k)}" fill="${hot?DG_ACC:"#fff"}" stroke="${DG_ACC}" stroke-width="${_f(sw)}" style="cursor:crosshair" pointer-events="all"/>`;
 }));
 /* đường nối đang chọn: tay nắm 2 đầu + tay nắm giữa */
 dgSelConns().forEach(c=>{
  const R=dgRoute(c,m),n=R.pts.length;
  o+=`<path d="${R.d||"M"+R.pts.map(p=>_f(p[0])+" "+_f(p[1])).join("L")}" fill="none" stroke="${DG_ACC}" stroke-width="${_f(3/k)}" stroke-opacity=".35" pointer-events="none"/>`;
  [["s",R.pts[0]],["e",R.pts[n-1]]].forEach(([w,p])=>{o+=`<circle data-dce="${c.id}:${w}" cx="${_f(p[0])}" cy="${_f(p[1])}" r="${_f(5.5/k)}" fill="${c[w]?"#fff":DG_ACC}" stroke="${DG_ACC}" stroke-width="${_f(sw)}" style="cursor:move" pointer-events="all"/>`});
  if(c.ty==="el"&&n===4){const a=R.pts[1],b=R.pts[2];o+=`<rect data-dcm="${c.id}" x="${_f((a[0]+b[0])/2-hs/2)}" y="${_f((a[1]+b[1])/2-hs/2)}" width="${_f(hs)}" height="${_f(hs)}" fill="${DG_ACC}" stroke="#fff" stroke-width="${_f(sw*.6)}" style="cursor:${Math.abs(a[0]-b[0])<.5?"ew-resize":"ns-resize"}" pointer-events="all"/>`}
 });
 /* xem trước khi kéo dây / chọn vùng */
 if(dptr){
  if(dptr.type==="cnew"||dptr.type==="cend"){
   const a=dptr.a,b=dptr.b;if(a&&b)o+=`<line x1="${_f(a.x)}" y1="${_f(a.y)}" x2="${_f(b.x)}" y2="${_f(b.y)}" stroke="${DG_ACC}" stroke-width="${_f(2/k)}" stroke-dasharray="${_f(6/k)} ${_f(4/k)}" pointer-events="none"/>`;
  }else if(dptr.type==="marq"&&dptr.moved){
   const x=Math.min(dptr.x0,dptr.x1),y=Math.min(dptr.y0,dptr.y1);
   o+=`<rect x="${_f(x)}" y="${_f(y)}" width="${_f(Math.abs(dptr.x1-dptr.x0))}" height="${_f(Math.abs(dptr.y1-dptr.y0))}" fill="${DG_ACC}" fill-opacity=".08" stroke="${DG_ACC}" stroke-width="${_f(sw)}" stroke-dasharray="${_f(4/k)} ${_f(3/k)}" pointer-events="none"/>`;
  }
 }
 return o;
}
/* ============ TÌM ĐÍCH KHI NỐI ============ */
function dgTargetAt(ev,exclude){
 const w=worldPt(ev),tol=18/view.k;let best=null;
 const els=document.elementsFromPoint(ev.clientX,ev.clientY);
 const sEl=els.find(e=>e.dataset&&e.dataset.dsite);
 if(sEl){const[id,p]=sEl.dataset.dsite.split(":");return{id,p:+p}}
 const hit=els.map(e=>e.closest&&e.closest(".dgs")).find(g=>g&&(!exclude||g.dataset.did!==exclude));
 const cand=hit?[dgGet(hit.dataset.did)]:state.dg.shapes.filter(s=>(!exclude||s.id!==exclude));
 cand.forEach(s=>{if(!s)return;dgSites(s).forEach((p,i)=>{const d=Math.hypot(p.x-w.x,p.y-w.y);if((hit||d<tol)&&(!best||d<best.d))best={id:s.id,p:i,d}})});
 return best?{id:best.id,p:best.p}:null;
}
function dgSitePt(t){const s=dgGet(t.id);return s?dgSites(s)[t.p]:null}
/* ============ CON TRỎ ============ */
window.addEventListener("pointerdown",ev=>{
 if(!dgOn()||!board.contains(ev.target)||ev.button!==0||spaceDown||tool==="pan")return;
 if(document.querySelector(".modal.open"))return;
 if(dgEditing)dgEndEdit(true);
 const ae=document.activeElement;if(ae&&ae!==document.body&&ae.blur)ae.blur();
 ev.stopImmediatePropagation();ev.preventDefault();
 const t=ev.target,cl=q=>t.closest?t.closest(q):null,w=worldPt(ev);
 const hEl=cl("[data-dh]"),sEl=cl("[data-dsite]"),eEl=cl("[data-dce]"),mEl=cl("[data-dcm]"),shEl=cl(".dgs"),cEl=cl(".dgc");
 if(hEl){
  const s=dgSelShapes()[0];if(!s)return;
  dptr={type:hEl.dataset.dh==="rot"?"rot":"rs",hd:hEl.dataset.dh,id:s.id,o:JSON.parse(JSON.stringify(s)),moved:false};return;
 }
 if(sEl){const[id,p]=sEl.dataset.dsite.split(":"),pt=dgSitePt({id,p:+p});dptr={type:"cnew",from:{id,p:+p},a:{x:pt.x,y:pt.y},b:{x:w.x,y:w.y},tgt:null,moved:false};return}
 if(eEl){
  const[cid,end]=eEl.dataset.dce.split(":"),c=dgGetC(cid),R=dgRoute(c,dgById(state.dg.shapes)),other=end==="s"?R.pts[R.pts.length-1]:R.pts[0];
  dptr={type:"cend",id:cid,end,a:{x:other[0],y:other[1]},b:{x:w.x,y:w.y},tgt:null,moved:false};return;
 }
 if(mEl){dptr={type:"cadj",id:mEl.dataset.dcm,moved:false};return}
 if(tool==="dc"){
  if(shEl){
   const s=dgGet(shEl.dataset.did),sites=dgSites(s);let bi=0,bd=1e18;sites.forEach((p,i)=>{const d=Math.hypot(p.x-w.x,p.y-w.y);if(d<bd){bd=d;bi=i}});
   dptr={type:"cnew",from:{id:s.id,p:bi},a:{x:sites[bi].x,y:sites[bi].y},b:{x:w.x,y:w.y},tgt:null,moved:false};
  }else{const q={x:dgSn(w.x),y:dgSn(w.y)};dptr={type:"cnew",from:null,a:q,b:{x:w.x,y:w.y},tgt:null,moved:false}}
  return;
 }
 if(shEl){
  const id=shEl.dataset.did,now=Date.now();
  if(dgLastDown.id===id&&now-dgLastDown.t<450&&!ev.shiftKey){dgLastDown={id:null,t:0};dgSelect([id],true);dgEditText(id);return}
  dgLastDown={id,t:now};
  if(ev.shiftKey||ev.ctrlKey||ev.metaKey){if(dsel.has(id))dsel.delete(id);else dsel.add(id);renderDg();renderProps();return}
  if(!dsel.has(id)){dsel=new Set([id]);renderProps();dgAnnounce()}
  const orig=new Map();dgSelShapes().forEach(s=>orig.set(s.id,{x:s.x,y:s.y}));
  dptr={type:"mv",ref:id,sx:w.x,sy:w.y,cx:ev.clientX,cy:ev.clientY,orig,moved:false};renderDg();return;
 }
 if(cEl){
  const id=cEl.dataset.cid,now=Date.now();
  if(dgLastDown.id===id&&now-dgLastDown.t<450){dgLastDown={id:null,t:0};dgSelect([id],true);setTimeout(()=>{const e=$("dgCLabel");if(e){e.focus();e.select()}},30);return}
  dgLastDown={id,t:now};
  if(ev.shiftKey){if(dsel.has(id))dsel.delete(id);else dsel.add(id);renderDg();renderProps()}else dgSelect([id]);
  return;
 }
 /* chỗ trống */
 if(!ev.shiftKey&&dsel.size){dsel=new Set();renderProps();setStatus(_("Đã bỏ chọn.","Selection cleared."))}
 dptr={type:"marq",x0:w.x,y0:w.y,x1:w.x,y1:w.y,moved:false,base:new Set(dsel),cx:ev.clientX,cy:ev.clientY};renderDg();
},true);
window.addEventListener("pointermove",ev=>{
 if(!dptr||!dgOn())return;
 ev.stopImmediatePropagation();
 const w=worldPt(ev),M=state.meta.dg,snapOn=M.snap&&!ev.altKey;
 if(dptr.type==="mv"){
  if(!dptr.moved&&Math.hypot(ev.clientX-dptr.cx,ev.clientY-dptr.cy)<4)return;
  dptr.moved=true;
  let dx=w.x-dptr.sx,dy=w.y-dptr.sy;const r=dptr.orig.get(dptr.ref);
  if(snapOn&&r){dx=dgSn(r.x+dx)-r.x;dy=dgSn(r.y+dy)-r.y}
  dgSelShapes().forEach(s=>{const o=dptr.orig.get(s.id);if(o&&!s.lock){s.x=o.x+dx;s.y=o.y+dy}});
 }else if(dptr.type==="rs"){
  const s=dgGet(dptr.id);dptr.moved=true;const r=dgResizeCalc(dptr.o,dptr.hd,w,ev.shiftKey,snapOn);
  Object.assign(s,r);dgAutoFit(s);
 }else if(dptr.type==="rot"){
  const s=dgGet(dptr.id);dptr.moved=true;const cx=dptr.o.x+dptr.o.w/2,cy=dptr.o.y+dptr.o.h/2;
  let a=Math.atan2(w.y-cy,w.x-cx)*180/Math.PI+90;a=(a%360+360)%360;
  a=ev.shiftKey?Math.round(a/15)*15:(Math.abs(a%90)<3||Math.abs(a%90)>87?Math.round(a/90)*90:Math.round(a));
  s.rot=a%360;
 }else if(dptr.type==="cnew"||dptr.type==="cend"){
  dptr.moved=true;dptr.b={x:w.x,y:w.y};
  const excl=dptr.type==="cnew"&&dptr.from?null:null;
  dptr.tgt=dgTargetAt(ev,null);
  if(dptr.tgt){const p=dgSitePt(dptr.tgt);if(p)dptr.b={x:p.x,y:p.y}}
  else if(snapOn){dptr.b={x:dgSn(w.x),y:dgSn(w.y)}}
 }else if(dptr.type==="cadj"){
  const c=dgGetC(dptr.id),R=dgRoute(c,dgById(state.dg.shapes));dptr.moved=true;
  const A=R.A,B=R.B;
  if(R.pts.length===4){const hz=Math.abs(R.pts[1][1]-R.pts[0][1])<.5||Math.abs(R.pts[1][0]-R.pts[0][0])>.5&&Math.abs(R.pts[1][1]-R.pts[0][1])<.5;
   if(hz){const d=B.x-A.x;if(Math.abs(d)>1)c.adj=Math.round(((w.x-A.x)/d)*100)/100}else{const d=B.y-A.y;if(Math.abs(d)>1)c.adj=Math.round(((w.y-A.y)/d)*100)/100}}
 }else if(dptr.type==="marq"){
  if(!dptr.moved&&Math.hypot(ev.clientX-dptr.cx,ev.clientY-dptr.cy)<4)return;
  dptr.moved=true;dptr.x1=w.x;dptr.y1=w.y;
  const x0=Math.min(dptr.x0,dptr.x1),x1=Math.max(dptr.x0,dptr.x1),y0=Math.min(dptr.y0,dptr.y1),y1=Math.max(dptr.y0,dptr.y1);
  const ids=new Set(dptr.base);
  state.dg.shapes.forEach(s=>{const b=dgShapeBBox(s);if(b.x1>=x0&&b.x0<=x1&&b.y1>=y0&&b.y0<=y1)ids.add(s.id)});
  dsel=ids;
 }
 dgQueueRender();
},true);
window.addEventListener("pointerup",ev=>{
 if(!dptr||!dgOn())return;
 ev.stopImmediatePropagation();
 const d=dptr;dptr=null;const w=worldPt(ev);
 if(d.type==="mv"){
  if(d.moved){commit(_("Di chuyển","Move"));setStatus(_(`Đã di chuyển ${d.orig.size} hình.`,`Moved ${d.orig.size} shape(s).`))}
 }else if(d.type==="rs"){if(d.moved){commit(_("Đổi kích thước","Resize"));const s=dgGet(d.id);setStatus(_(`Kích thước mới ${dgUnitFmt(s.w)} × ${dgUnitFmt(s.h)}.`,`New size ${dgUnitFmt(s.w)} × ${dgUnitFmt(s.h)}.`))}}
 else if(d.type==="rot"){if(d.moved){commit(_("Xoay","Rotate"));setStatus(_(`Góc xoay ${Math.round(dgGet(d.id).rot)}°.`,`Rotation ${Math.round(dgGet(d.id).rot)}°.`))}}
 else if(d.type==="cadj"){if(d.moved)commit(_("Đổi vị trí đoạn gấp","Move bend"))}
 else if(d.type==="cnew"){
  const tgt=d.tgt||dgTargetAt(ev,null);
  const moved=d.moved&&Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y)>6/view.k;
  if(moved&&!(tgt&&d.from&&tgt.id===d.from.id&&tgt.p===d.from.p)){
   const M=state.meta.dg,ids=new Set(state.dg.shapes.map(s=>s.id));
   const c=cleanDgConn({id:uid("k"),s:d.from,e:tgt,sp:d.from?undefined:d.a,ep:tgt?undefined:(state.meta.dg.snap?{x:dgSn(w.x),y:dgSn(w.y)}:{x:w.x,y:w.y}),ty:M.cty,as:M.cas,ae:M.cae,lw:M.clw,ln:"#404040"},ids);
   state.dg.conns.push(c);dsel=new Set([c.id]);commit(_("Nối hai hình","Connect shapes"));renderProps();dgAnnounce();
   if(!STICKY&&false)dgSetTool("select");
  }else if(!d.moved&&d.from){dsel=new Set([d.from.id]);renderProps()}
 }else if(d.type==="cend"){
  if(d.moved){
   const c=dgGetC(d.id),tgt=d.tgt||dgTargetAt(ev,null);
   if(tgt){c[d.end]={id:tgt.id,p:tgt.p};delete c[d.end==="s"?"sp":"ep"]}
   else{c[d.end]=null;c[d.end==="s"?"sp":"ep"]=state.meta.dg.snap?{x:dgSn(w.x),y:dgSn(w.y)}:{x:w.x,y:w.y}}
   commit(_("Đổi điểm nối","Re-attach connector"));renderProps();dgAnnounce();
  }
 }else if(d.type==="marq"){if(d.moved){dgAnnounce();renderProps()}}
 renderAll();
},true);
window.addEventListener("pointercancel",()=>{if(dptr){dptr=null;renderDg()}},true);
function dgUnitFmt(u){const M=state.meta.dg,f=DG_UNITS[M.unit];return (Math.round(u/f[1]*100)/100)+" "+f[0]}
function dgResizeCalc(o,hd,P,shift,snap){
 const r=-(o.rot||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),cx=o.x+o.w/2,cy=o.y+o.h/2,dx=P.x-cx,dy=P.y-cy;
 let lx=dx*c-dy*s+o.w/2,ly=dx*s+dy*c+o.h/2;
 const hx=hd.includes("e")?1:hd.includes("w")?-1:0,hy=hd.includes("s")?1:hd.includes("n")?-1:0;
 const ax=hx===1?0:hx===-1?o.w:o.w/2,ay=hy===1?0:hy===-1?o.h:o.h/2;
 let w=o.w,h=o.h;
 if(hx){if(snap&&!o.rot)lx=dgSn(o.x+lx)-o.x;w=hx===1?lx:o.w-lx}
 if(hy){if(snap&&!o.rot)ly=dgSn(o.y+ly)-o.y;h=hy===1?ly:o.h-ly}
 w=Math.max(8,w);h=Math.max(8,h);
 if(shift&&hx&&hy){const k=Math.max(w/o.w,h/o.h);w=o.w*k;h=o.h*k}
 const nax=hx===1?0:hx===-1?w:w/2,nay=hy===1?0:hy===-1?h:h/2,A=dgRotPt(o,ax,ay);
 const R=(o.rot||0)*Math.PI/180,cr=Math.cos(R),sr=Math.sin(R),vx=nax-w/2,vy=nay-h/2;
 const ncx=A.x-(vx*cr-vy*sr),ncy=A.y-(vx*sr+vy*cr);
 return{x:ncx-w/2,y:ncy-h/2,w,h};
}
/* ============ SỬA CHỮ TRONG HÌNH ============ */
function dgEditText(id){
 const s=dgGet(id);if(!s)return;
 dgEndEdit(true);
 const wrap=$("wrap"),br=board.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
 const ta=document.createElement("textarea");ta.id="dgEdit";
 const k=view.k,bb=dgShapeBBox(s);
 const L=br.left-wr.left+view.x+bb.x0*k,T=br.top-wr.top+view.y+bb.y0*k,W=Math.max(150,(bb.x1-bb.x0)*k),H=Math.max(64,(bb.y1-bb.y0)*k);
 Object.assign(ta.style,{position:"absolute",left:Math.max(4,L)+"px",top:Math.max(4,T)+"px",width:W+"px",height:H+"px",zIndex:6,font:`${Math.max(13,s.fs*DGPT*k)}px ${dgFont(s.ff)[1]}`,border:"2px solid "+DG_ACC,borderRadius:"4px",padding:"4px",background:"#fff",color:"#000",resize:"both",boxShadow:"0 4px 18px rgba(0,0,0,.35)"});
 ta.value=s.tx;ta.setAttribute("aria-label",_("Nhập chữ cho hình khối. Enter xuống dòng, Esc xong, Tab thêm cấp dưới, Ctrl+B đậm, Ctrl+I nghiêng, Ctrl+U gạch chân.","Type the shape text. Enter = new line, Esc = done, Tab = add child, Ctrl+B bold, Ctrl+I italic, Ctrl+U underline."));
 wrap.appendChild(ta);dgEditing={id,before:s.tx};
 const live=()=>{s.tx=ta.value;if(s.af)dgAutoFit(s);renderDg();const pt=$("dgPTx");if(pt&&pt!==ta)pt.value=s.tx};
 ta.addEventListener("input",()=>{live();commitSoon(_("Sửa chữ","Edit text"))});
 ta.addEventListener("keydown",ev=>{
  const k=ev.key.toLowerCase(),mod=ev.ctrlKey||ev.metaKey;
  if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();dgEndEdit(true);return}
  if(ev.key==="Tab"&&!ev.shiftKey){ev.preventDefault();ev.stopPropagation();dgEndEdit(true);dgAddChild(id);return}
  if(ev.key==="Enter"&&mod){ev.preventDefault();ev.stopPropagation();dgEndEdit(true);dgAddSibling(id);return}
  if(mod&&(k==="b"||k==="i"||k==="u")){ev.preventDefault();ev.stopPropagation();dgWrapSel(ta,k==="b"?"**":k==="i"?"*":"__");live();commitSoon();return}
  ev.stopPropagation();
 });
 ta.addEventListener("blur",()=>{setTimeout(()=>{if(dgEditing&&dgEditing.id===id)dgEndEdit(true)},0)});
 ta.focus();ta.select();
 setStatus(_("Đang sửa chữ. Enter xuống dòng; Esc để xong; Tab thêm hình cấp dưới; Ctrl+Enter thêm hình ngang cấp.","Editing text. Enter = new line; Esc = done; Tab = add child shape; Ctrl+Enter = add sibling."));
}
function dgWrapSel(ta,mk){
 const a=ta.selectionStart,b=ta.selectionEnd,v=ta.value,sel=v.slice(a,b);
 if(sel&&sel.startsWith(mk)&&sel.endsWith(mk)&&sel.length>=2*mk.length){const inner=sel.slice(mk.length,sel.length-mk.length);ta.value=v.slice(0,a)+inner+v.slice(b);ta.setSelectionRange(a,a+inner.length)}
 else{ta.value=v.slice(0,a)+mk+sel+mk+v.slice(b);ta.setSelectionRange(a+mk.length,a+mk.length+sel.length)}
}
function dgEndEdit(save){
 if(!dgEditing)return;
 const ed=dgEditing;dgEditing=null;const ta=$("dgEdit");if(ta){ta.remove()}
 const s=dgGet(ed.id);
 if(s&&save){if(s.af)dgAutoFit(s);clearTimeout(cT);commit(_("Sửa chữ","Edit text"))}
 renderAll();
}
function dgCancel(){dptr=null;dgEndEdit(true)}
/* ============ BÀN PHÍM ============ */
window.addEventListener("keydown",ev=>{
 if(!dgOn())return;
 const ae=document.activeElement,tg=ae?ae.tagName:"",typing=tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT";
 if(typing||document.querySelector(".modal.open"))return;
 const mod=ev.ctrlKey||ev.metaKey,k=ev.key.toLowerCase(),shift=ev.shiftKey,alt=ev.altKey;
 const one=()=>{const S=dgSelShapes();return S.length===1?S[0]:null};
 const done=()=>{ev.preventDefault();ev.stopImmediatePropagation()};
 if(ev.key==="Escape"){
  if(dptr){dptr=null;renderDg();done();return}
  if(dsel.size){dsel=new Set();renderDg();renderProps();setStatus(_("Đã bỏ chọn.","Selection cleared."));if(tool!=="select")setTool("select");done();return}
  return;
 }
 if(mod&&(k==="s"||k==="p"||k==="z"||k==="y"||k==="0"))return;
 if(ev.code==="Space"||ev.key==="?"||ev.key==="+"||ev.key==="="||ev.key==="-")return;
 if(ev.key==="Delete"||ev.key==="Backspace"){done();dgDeleteSel(shift);return}
 if(ev.key==="Tab"){done();const s=one();if(!s){setStatus(_("Chọn một hình rồi nhấn Tab để thêm cấp dưới.","Select a shape then press Tab to add a child."));return}
  if(shift){const pc=dgTreeParent(s.id);if(pc){dgSelect([pc.s.id])}return}dgAddChild(s.id);return}
 if(ev.key==="Enter"){done();const s=one();if(s){dgAddSibling(s.id);return}const C=dgSelConns();if(C.length===1){const e=$("dgCLabel");if(e){e.focus();e.select()}}return}
 if(ev.key==="F2"){done();const s=one();if(s)dgEditText(s.id);else{const e=$("dgCLabel");if(e){e.focus();e.select()}}return}
 if(mod&&k==="a"){done();dgSelect([...state.dg.shapes.map(s=>s.id),...state.dg.conns.map(c=>c.id)]);return}
 if(mod&&k==="c"){done();dgCopy();return}
 if(mod&&k==="x"){done();dgCopy();dgDeleteSel();return}
 if(mod&&k==="v"){if(dgClip){done();dgPaste()}return}
 if(mod&&k==="d"){done();dgDup();return}
 if(mod&&(k==="b"||k==="i"||k==="u")){done();const S=dgSelShapes();if(!S.length)return;const f=k==="b"?"fb":k==="i"?"fi":"fu",v=!S.every(s=>s[f]);S.forEach(s=>{s[f]=v;if(s.af)dgAutoFit(s)});commit(_("Định dạng chữ","Text format"));renderAll();return}
 if(mod&&shift&&(ev.key==="ArrowLeft"||ev.key==="ArrowRight")){done();const s=one();if(s)dgMoveSibling(s.id,ev.key==="ArrowLeft"?-1:1);return}
 if(alt&&ev.key.startsWith("Arrow")){
  done();const s=one();if(!s)return;let t=null;const pc=dgTreeParent(s.id);
  if(ev.key==="ArrowUp"&&pc)t=pc.s.id;
  else if(ev.key==="ArrowDown"){const ks=dgTreeKids(s.id);if(ks.length)t=ks[0].s.id}
  else if(pc&&(ev.key==="ArrowLeft"||ev.key==="ArrowRight")){const sb=dgTreeKids(pc.s.id).map(o=>o.s.id),i=sb.indexOf(s.id),j=i+(ev.key==="ArrowLeft"?-1:1);if(j>=0&&j<sb.length)t=sb[j]}
  if(t)dgSelect([t]);else setStatus(_("Không có hình theo hướng đó trong cây.","No shape in that direction of the tree."));
  return;
 }
 if(ev.key.startsWith("Arrow")){
  const S=dgSelShapes();if(!S.length)return;done();
  const st=alt?1:(shift?state.meta.dg.gs*5:state.meta.dg.gs),dx=ev.key==="ArrowLeft"?-st:ev.key==="ArrowRight"?st:0,dy=ev.key==="ArrowUp"?-st:ev.key==="ArrowDown"?st:0;
  S.forEach(s=>{if(!s.lock){s.x+=dx;s.y+=dy}});renderAll();commitSoon(_("Dịch chuyển bằng phím","Nudge"));return;
 }
 if(!mod){
  if(k==="v"){done();dgSetTool("select");return}
  if(k==="h"){done();dgSetTool("pan");return}
  if(k==="c"){done();dgSetTool("dc");return}
  if(k==="t"){done();dgAdd("text");return}
  if(k==="l"){done();dgLayoutNow();return}
  if(/^[a-z]$/.test(k)){done();return}                  /* nuốt các phím chữ khác của PFD */
 }
},true);
function dgLayoutNow(){
 if(!dgRoots().length){setStatus(_("Chưa có cây phân cấp. Chọn một hình rồi nhấn Tab để thêm cấp dưới.","No hierarchy yet. Select a shape and press Tab to add a child."));return}
 const n=dgLayoutAll();commit(_("Sắp xếp lại cây","Re-layout tree"));renderAll();
 setStatus(_(`Đã sắp xếp lại ${n} hình theo cây.`,`Re-laid out ${n} shapes as a tree.`));
}
/* kéo thả từ thư viện */
$("wrap").addEventListener("drop",ev=>{
 const t=ev.dataTransfer.getData("text/plain");
 if(dgOn()&&t.startsWith("dg:")){ev.preventDefault();ev.stopImmediatePropagation();dgAdd(t.slice(3),worldPt(ev),true)}
},true);
/* dán văn bản nhiều dòng → hộp thoại nhập đề cương */
window.addEventListener("paste",ev=>{
 if(!dgOn())return;const ae=document.activeElement,tg=ae?ae.tagName:"";if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT")return;
 const t=ev.clipboardData&&ev.clipboardData.getData("text/plain");
 if(t&&t.includes("\n")){ev.preventDefault();dgOpenImport(t)}
});
/* ============ THƯ VIỆN HÌNH KHỐI (CỘT TRÁI) ============ */
function renderDgSide(){
 const box=$("dgSide");if(!box||!dgOn())return;
 const q=(($("dgSearch")||{}).value||"").toLowerCase().trim(),openC=box.__open||(box.__open=new Set(["org","basic","flow"]));
 let h=`<div class="dgblk"><label for="dgSearch">${_("Tìm hình khối","Search shapes")}</label><input id="dgSearch" value="${esc(q)}" placeholder="${_("vd: quyết định, mũi tên…","e.g. decision, arrow…")}" oninput="renderDgSide();document.getElementById('dgSearch').focus()"></div>`;
 DG_CATS.forEach(([cid,vi,en])=>{
  const items=Object.values(DG_PRESET).filter(P=>P.cat===cid&&(!q||[P.vi,P.en,P.id,P.prst].some(t=>String(t).toLowerCase().includes(q))));
  if(!items.length)return;
  h+=`<details data-cat="${cid}"${q||openC.has(cid)?" open":""}><summary>${_(vi,en)} <span class="nt">(${items.length})</span></summary><div class="dggrid">`+
   items.map(P=>`<button class="dgpal" data-k="${P.id}" draggable="true" title="${esc(_(P.vi,P.en))}" aria-label="${esc(_("Thêm hình: "+P.vi,"Add shape: "+P.en))}">${dgThumb(P.id)}<span>${esc(_(P.vi,P.en))}</span></button>`).join("")+`</div></details>`;
 });
 h+=`<div class="dgblk"><b>${_("Mẫu có sẵn","Templates")}</b><select id="dgTplSel" aria-label="${_("Chọn mẫu","Choose template")}">${DG_TEMPLATES.map(t=>`<option value="${t[0]}">${esc(_(t[1],t[2]))}</option>`).join("")}</select><button class="btn" style="width:100%;margin-top:.3rem" onclick="dgLoadTemplate($('dgTplSel').value)">${_("Nạp mẫu (hoàn tác được)","Load template (undoable)")}</button></div>
 <div class="dgblk"><b>${_("Cây phân cấp","Hierarchy")}</b>
  <button class="btn" style="width:100%;margin-top:.3rem" onclick="dgOpenImport('')">📥 ${_("Nhập từ đề cương / CSV…","Import from outline / CSV…")}</button>
  <button class="btn" style="width:100%;margin-top:.3rem" onclick="dgCopyOutline()">📤 ${_("Sao chép đề cương (văn bản)","Copy outline (text)")}</button>
  <button class="btn" style="width:100%;margin-top:.3rem" onclick="dgLayoutNow()" title="L">🌳 ${_("Sắp xếp lại cây (L)","Re-layout tree (L)")}</button></div>`;
 box.innerHTML=h;
 box.querySelectorAll("details[data-cat]").forEach(d=>d.addEventListener("toggle",()=>{if($("dgSearch")&&$("dgSearch").value)return;d.open?openC.add(d.dataset.cat):openC.delete(d.dataset.cat)}));
 box.querySelectorAll(".dgpal").forEach(b=>{
  b.addEventListener("click",()=>dgAdd(b.dataset.k));
  b.addEventListener("dragstart",ev=>{ev.dataTransfer.setData("text/plain","dg:"+b.dataset.k);ev.dataTransfer.effectAllowed="copy"});
 });
}
function dgCopyOutline(){const t=dgOutline();if(!t){setStatus(_("Chưa có cây phân cấp để xuất.","No hierarchy to export."));return}copyText(t)}
/* ---- hộp thoại nhập đề cương / CSV ---- */
function dgOpenImport(txt){
 let m=$("mDg");if(!m){m=document.createElement("div");m.className="modal";m.id="mDg";document.body.appendChild(m)}
 m.innerHTML=`<div class="card" role="dialog" aria-label="${_("Nhập sơ đồ từ văn bản","Import diagram from text")}"><h2>${_("Nhập sơ đồ từ văn bản","Import diagram from text")}</h2>
 <div class="hint">${_("Dán đề cương: mỗi dòng một hình, thụt đầu dòng (Tab hoặc dấu cách) để chỉ cấp dưới; chấp nhận cả gạch đầu dòng và số thứ tự. Hoặc dán CSV 3 cột: Tên, Chức danh, Quản lý trực tiếp.","Paste an outline: one shape per line, indent (Tab or spaces) for sub-levels; bullets and numbering are accepted. Or paste a 3-column CSV: Name, Title, Manager.")}</div>
 <textarea id="dgImpTxt" rows="12" style="font-family:monospace;font-size:.85rem;margin-top:.5rem" aria-label="${_("Nội dung cần nhập","Content to import")}">${esc(txt||"")}</textarea>
 <div class="row" style="margin-top:.5rem"><div><label for="dgImpFmt">${_("Định dạng","Format")}</label><select id="dgImpFmt"><option value="outline">${_("Đề cương thụt đầu dòng","Indented outline")}</option><option value="csv">CSV (${_("Tên, Chức danh, Quản lý","Name, Title, Manager")})</option></select></div>
 <div><label for="dgImpK">${_("Kiểu hình khối","Shape type")}</label><select id="dgImpK">${["org_person","org_dept","org_pos","roundRect","rect"].map(k=>`<option value="${k}">${esc(_(DG_PRESET[k].vi,DG_PRESET[k].en))}</option>`).join("")}</select></div></div>
 <label class="chk"><input type="checkbox" id="dgImpSplit" checked>${_("Tách “Tên | Chức danh” thành 2 dòng (tên đậm + chức danh)","Split “Name | Title” into 2 lines (bold name + title)")}</label>
 <div class="mbar"><button class="btn primary" onclick="dgDoImport()">${_("Tạo sơ đồ","Create diagram")}</button><span style="flex:1"></span><button class="btn" onclick="closeModals()">${_("Đóng","Close")}</button></div></div>`;
 openModal("mDg");setTimeout(()=>$("dgImpTxt").focus(),30);
}
function dgDoImport(){
 const t=$("dgImpTxt").value,fmt=$("dgImpFmt").value,opt={k:$("dgImpK").value,split:$("dgImpSplit").checked};
 closeModals();if(fmt==="csv")dgImportCSV(t,opt);else dgImportOutline(t,opt);
}
/* ============ ĐỒNG BỘ GIAO DIỆN KHI VÀO MODULE ============ */
function dgSync(){
 if(!dgOn())return;
 $("appName").textContent=_("Sơ đồ","Diagram");$("appSub").textContent=_("Rev.7 • Sơ đồ tổ chức, lưu đồ, sơ đồ khối • copy sang Word / PowerPoint","Rev.7 • Org charts, flowcharts, block diagrams • copy to Word / PowerPoint");
 renderDgSide();if(typeof renderDgSettings==="function")renderDgSettings();
 updateToolUI();
}
