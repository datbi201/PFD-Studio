/* ============ MODULE VECTOR — HÌNH HỌC PATH BÉZIER ============ */
/* Mọi hàm ở đây mang tiền tố "vec" để không đụng phạm vi toàn cục dùng chung.
   Quy ước dữ liệu (xem prompt Rev.6, mục 2):
     node = { x, y, inX, inY, outX, outY, type:"corner"|"smooth"|"asym" }
     - x,y       : điểm neo (anchor), toạ độ TUYỆT ĐỐI trong hệ bản vẽ
     - inX,inY   : tay cầm Bézier phía VÀO  (điều khiển đường cong tới điểm neo)
     - outX,outY : tay cầm Bézier phía RA    (điều khiển đường cong rời điểm neo)
     - tay cầm không có  ==  trùng toạ độ điểm neo  ==  đoạn thẳng
   Đoạn nối node[i] → node[i+1] là một cung bậc 3:
     C out(i)  in(i+1)  anchor(i+1)                                            */

const VEC_K = 0.5522847498307936;   /* hằng số "kappa": xấp xỉ 1/4 đường tròn bằng cung bậc 3 */
const VEC_EPS = 1e-9;

/* ---------- tạo / kiểm tra node ---------- */
function vecNum(v){return isFinite(+v)?+v:0}
function vecNode(x, y){
 x=vecNum(x); y=vecNum(y);
 return {x:x, y:y, inX:x, inY:y, outX:x, outY:y, type:"corner"};
}
function vecIsPath(h){return !!h && h.t==="path" && Array.isArray(h.nodes) && h.nodes.length>=2}
function vecHasIn(n){return Math.abs(n.inX-n.x)>1e-7 || Math.abs(n.inY-n.y)>1e-7}
function vecHasOut(n){return Math.abs(n.outX-n.x)>1e-7 || Math.abs(n.outY-n.y)>1e-7}
function vecHasHandle(n){return vecHasIn(n)||vecHasOut(n)}
function vecNodeType(n){return ["corner","smooth","asym"].includes(n.type)?n.type:"corner"}

/* Chuẩn hoá node đọc từ file: đảm bảo số hợp lệ, tay cầm mặc định = điểm neo. */
function vecNormNode(n){
 const x=vecNum(n&&n.x), y=vecNum(n&&n.y), o=vecNode(x,y);
 o.inX = n&&n.inX!=null ? vecNum(n.inX) : x;
 o.inY = n&&n.inY!=null ? vecNum(n.inY) : y;
 o.outX= n&&n.outX!=null? vecNum(n.outX): x;
 o.outY= n&&n.outY!=null? vecNum(n.outY): y;
 o.type= vecNodeType(n);
 return o;
}
function vecNormNodes(arr){
 return (Array.isArray(arr)?arr:[]).slice(0,4000).map(vecNormNode);
}

/* ---------- tách path thành danh sách cung bậc 3 ---------- */
/* Trả về [{a,b,c1,c2}] — a,b là node; c1 = tay cầm ra của a; c2 = tay cầm vào của b. */
function vecSegs(h){
 const N=(h&&h.nodes)||[], out=[];
 for(let i=0;i<N.length-1;i++) out.push([N[i],N[i+1]]);
 if(h&&h.closed && N.length>2) out.push([N[N.length-1],N[0]]);
 return out.map(function(p){
  const a=p[0], b=p[1];
  return {a:a, b:b, c1:{x:a.outX,y:a.outY}, c2:{x:b.inX,y:b.inY}};
 });
}
function vecSegStraight(s){return !vecHasOut(s.a) && !vecHasIn(s.b)}

/* ---------- sinh thuộc tính d của SVG ---------- */
function vecD(h){
 const N=(h&&h.nodes)||[];
 if(N.length<2) return "";
 let d="M "+r3(N[0].x)+" "+r3(N[0].y);
 const S=vecSegs(h);
 for(let i=0;i<S.length;i++){
  const s=S[i];
  if(vecSegStraight(s)) d+=" L "+r3(s.b.x)+" "+r3(s.b.y);
  else d+=" C "+r3(s.c1.x)+" "+r3(s.c1.y)+" "+r3(s.c2.x)+" "+r3(s.c2.y)+" "+r3(s.b.x)+" "+r3(s.b.y);
 }
 if(h.closed) d+=" Z";
 return d;
}

/* ---------- toạ độ điểm trên cung tại tham số t ---------- */
function vecPointAt(s, t){
 const u=1-t, a=s.a, c1=s.c1, c2=s.c2, b=s.b;
 const uu=u*u, tt=t*t;
 return {
  x: uu*u*a.x + 3*uu*t*c1.x + 3*u*tt*c2.x + tt*t*b.x,
  y: uu*u*a.y + 3*uu*t*c1.y + 3*u*tt*c2.y + tt*t*b.y
 };
}
/* Đạo hàm bậc 1 của một thành phần toạ độ: A t² + B t + C  (giải để tìm cực trị) */
function vecExtremum(p0,p1,p2,p3){
 const A=3*(-p0+3*p1-3*p2+p3), B=6*(p0-2*p1+p2), C=3*(p1-p0);
 const ts=[];
 if(Math.abs(A)<1e-12){ if(Math.abs(B)>1e-12) ts.push(-C/B); }
 else{
  const disc=B*B-4*A*C;
  if(disc>=0){ const sq=Math.sqrt(disc); ts.push((-B+sq)/(2*A), (-B-sq)/(2*A)); }
 }
 const vals=[p0,p3];
 for(let i=0;i<ts.length;i++){
  const t=ts[i];
  if(t>0&&t<1){ const u=1-t; vals.push(u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3); }
 }
 return [Math.min.apply(null,vals), Math.max.apply(null,vals)];
}
/* Bao hình CHÍNH XÁC của một cung bậc 3 (không phải bao của 4 điểm điều khiển) */
function vecCubicBox(a,c1,c2,b){
 const bx=vecExtremum(a.x,c1.x,c2.x,b.x), by=vecExtremum(a.y,c1.y,c2.y,b.y);
 return {x0:bx[0],x1:bx[1],y0:by[0],y1:by[1]};
}
/* Bao hình toàn path: điểm neo + cực trị từng cung */
function vecBox(h){
 const N=(h&&h.nodes)||[];
 if(!N.length) return {x0:0,y0:0,x1:0,y1:0};
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(let i=0;i<N.length;i++){
  const n=N[i];
  if(n.x<x0)x0=n.x; if(n.x>x1)x1=n.x;
  if(n.y<y0)y0=n.y; if(n.y>y1)y1=n.y;
 }
 const S=vecSegs(h);
 for(let i=0;i<S.length;i++){
  const b=vecCubicBox(S[i].a,S[i].c1,S[i].c2,S[i].b);
  if(b.x0<x0)x0=b.x0; if(b.x1>x1)x1=b.x1;
  if(b.y0<y0)y0=b.y0; if(b.y1>y1)y1=b.y1;
 }
 return {x0:x0,y0:y0,x1:x1,y1:y1};
}

/* ---------- làm phẳng để hit-test / đo ---------- */
function vecFlatten(h, steps){
 const S=vecSegs(h), k=Math.max(2,Math.min(64,steps||12)), out=[];
 if(!S.length) return (h&&h.nodes?h.nodes.map(function(n){return{x:n.x,y:n.y}}):[]);
 out.push({x:S[0].a.x, y:S[0].a.y});
 for(let i=0;i<S.length;i++){
  const s=S[i];
  if(vecSegStraight(s)){ out.push({x:s.b.x,y:s.b.y}); continue; }
  for(let j=1;j<=k;j++) out.push(vecPointAt(s,j/k));
 }
 return out;
}
function vecDistToSeg(p,a,b){
 const dx=b.x-a.x, dy=b.y-a.y, L=dx*dx+dy*dy;
 let t = L>0 ? ((p.x-a.x)*dx+(p.y-a.y)*dy)/L : 0;
 t = t<0?0:(t>1?1:t);
 return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}
/* Khoảng cách từ điểm tới nét path (dùng cho chọn bằng click) */
function vecDist(h,p,steps){
 const F=vecFlatten(h,steps||10);
 if(F.length<2) return 1e18;
 let m=1e18;
 for(let i=0;i<F.length-1;i++){ const d=vecDistToSeg(p,F[i],F[i+1]); if(d<m)m=d; }
 return m;
}
/* Điểm có nằm trong vùng tô kín không (để click vào giữa hình đã tô) */
function vecInPoly(p,P){
 let inside=false;
 for(let i=0,j=P.length-1;i<P.length;j=i++){
  const xi=P[i].x, yi=P[i].y, xj=P[j].x, yj=P[j].y;
  if(((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/((yj-yi)||1e-12)+xi)) inside=!inside;
 }
 return inside;
}
/* Chọn được path khi: gần nét, HOẶC đã tô kín và điểm nằm trong hình */
function vecHit(h,p,tol){
 const T=Math.max(0.5, +tol||4);
 const d=vecDist(h,p,10);
 if(d<=T) return d;
 if(h.closed && h.fill){ const F=vecFlatten(h,8); if(F.length>2 && vecInPoly(p,F)) return 0; }
 return 1e18;
}

/* ---------- biến đổi toạ độ ---------- */
/* fn nhận {x,y} trả {x,y}; áp cho cả điểm neo lẫn 2 tay cầm (6 toạ độ / node) */
function vecMapNodes(h, fn){
 const N=(h&&h.nodes)||[];
 for(let i=0;i<N.length;i++){
  const n=N[i];
  const a=fn({x:n.x,y:n.y}), b=fn({x:n.inX,y:n.inY}), c=fn({x:n.outX,y:n.outY});
  n.x=vecNum(a.x); n.y=vecNum(a.y);
  n.inX=vecNum(b.x); n.inY=vecNum(b.y);
  n.outX=vecNum(c.x); n.outY=vecNum(c.y);
 }
 return h;
}
function vecMove(h,dx,dy){ return vecMapNodes(h,function(p){return {x:p.x+dx, y:p.y+dy}}) }
/* Trả về điểm neo dưới dạng object rời — dùng cho các hàm cũ chỉ biết mảng pts */
function vecPts(h){ return ((h&&h.nodes)||[]).map(function(n){return {x:n.x,y:n.y}}) }
/* Tất cả toạ độ (kể cả tay cầm) — dùng khi cần bao hình thô nhanh */
function vecAllPts(h){
 const o=[];
 ((h&&h.nodes)||[]).forEach(function(n){ o.push({x:n.x,y:n.y}); if(vecHasIn(n))o.push({x:n.inX,y:n.inY}); if(vecHasOut(n))o.push({x:n.outX,y:n.outY}); });
 return o;
}

/* ---------- tạo path từ hình cơ bản ---------- */
function vecFromRect(x0,y0,x1,y1){
 return [vecNode(x0,y0), vecNode(x1,y0), vecNode(x1,y1), vecNode(x0,y1)];
}
function vecFromEllipse(cx,cy,rx,ry){
 const k=VEC_K, hx=Math.abs(rx)*k, hy=Math.abs(ry)*k;
 return [
  {x:cx+rx, y:cy,    inX:cx+rx, inY:cy-hy, outX:cx+rx, outY:cy+hy, type:"smooth"},
  {x:cx,    y:cy+ry, inX:cx+hx, inY:cy+ry, outX:cx-hx, outY:cy+ry, type:"smooth"},
  {x:cx-rx, y:cy,    inX:cx-rx, inY:cy+hy, outX:cx-rx, outY:cy-hy, type:"smooth"},
  {x:cx,    y:cy-ry, inX:cx-hx, inY:cy-ry, outX:cx+hx, outY:cy-ry, type:"smooth"}
 ];
}
function vecFromLine(a,b){ return [vecNode(a.x,a.y), vecNode(b.x,b.y)] }
/* Chuyển một shape cũ (rect / ellipse / circle / line / arrow / poly) sang node path.
   Trả {nodes, closed} hoặc null nếu không chuyển được. */
function vecFromShape(h){
 if(!h) return null;
 if(h.t==="rect"){ const b=shapeBox(h); return {nodes:vecFromRect(b.x0,b.y0,b.x1,b.y1), closed:true}; }
 if(h.t==="ellipse"){ const b=shapeBox(h); return {nodes:vecFromEllipse((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.x1-b.x0)/2,(b.y1-b.y0)/2), closed:true}; }
 if(h.t==="circle"){ const r=Math.hypot(h.pts[1].x-h.pts[0].x, h.pts[1].y-h.pts[0].y); return {nodes:vecFromEllipse(h.pts[0].x,h.pts[0].y,r,r), closed:true}; }
 if(h.t==="line"||h.t==="arrow"){ return {nodes:vecFromLine(h.pts[0],h.pts[1]), closed:false}; }
 if(h.t==="poly"||h.t==="pen"){ return {nodes:h.pts.map(function(p){return vecNode(p.x,p.y)}), closed:!!h.closed}; }
 return null;
}

/* ---------- thêm / xoá điểm neo ---------- */
/* Tìm vị trí gần nhất trên path với một điểm cho trước */
function vecNearestOn(h,p,samples){
 const S=vecSegs(h), N=Math.max(4,Math.min(48,samples||24));
 let best={seg:-1, t:0, dist:1e18, p:null};
 for(let i=0;i<S.length;i++){
  const s=S[i];
  for(let j=0;j<=N;j++){
   const t=j/N, q=vecPointAt(s,t), d=Math.hypot(q.x-p.x, q.y-p.y);
   if(d<best.dist) best={seg:i, t:t, dist:d, p:q};
  }
 }
 return best;
}
function vecLerp(a,b,t){ return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t} }
/* Tách cung thứ i tại tham số t, chèn một điểm neo mới (de Casteljau).
   Trả về chỉ số của node mới, hoặc -1 nếu không tách được. */
function vecSplitSeg(h,i,t){
 if(!vecIsPath(h)) return -1;
 const S=vecSegs(h);
 if(i<0||i>=S.length) return -1;
 const s=S[i], a=s.a, b=s.b;
 if(vecSegStraight(s)){
  const p=vecLerp(a,b,t);
  const nn=vecNode(p.x,p.y);
  const idx=h.nodes.indexOf(a)+1;
  if(b===h.nodes[0] && h.closed){ h.nodes.push(nn); return h.nodes.length-1; }
  h.nodes.splice(idx,0,nn);
  return idx;
 }
 const p01=vecLerp(a,s.c1,t), p12=vecLerp(s.c1,s.c2,t), p23=vecLerp(s.c2,b,t);
 const p012=vecLerp(p01,p12,t), p123=vecLerp(p12,p23,t), p=vecLerp(p012,p123,t);
 const nn={x:p.x, y:p.y, inX:p012.x, inY:p012.y, outX:p123.x, outY:p123.y, type:"smooth"};
 a.outX=p01.x; a.outY=p01.y;
 b.inX=p23.x;  b.inY=p23.y;
 if(b===h.nodes[0] && h.closed){ h.nodes.push(nn); return h.nodes.length-1; }
 const idx=h.nodes.indexOf(a)+1;
 h.nodes.splice(idx,0,nn);
 return idx;
}
/* Xoá một điểm neo; path phải còn tối thiểu 2 node */
function vecDelNode(h,i){
 if(!vecIsPath(h)||h.nodes.length<=2) return false;
 if(i<0||i>=h.nodes.length) return false;
 h.nodes.splice(i,1);
 return true;
}

/* ---------- CHỮ VECTOR (vtext) — hình học ---------- */
/* vtext = hộp chữ có thể xoay quanh tâm hộp:
     { x, y, w, h, rot, mode:"point"|"area", text, ff, fz, b, i, col, al, lh, fill, fo, mh, mv }
   x,y là góc trên-trái của hộp KHI CHƯA xoay; rot quay quanh tâm hộp. */
function vtextCorners(o){
 const cx=o.x+o.w/2, cy=o.y+o.h/2, a=(o.rot||0)*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
 return [[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.h],[o.x,o.y+o.h]].map(function(p){
  const dx=p[0]-cx, dy=p[1]-cy;
  return {x:cx+dx*ca-dy*sa, y:cy+dx*sa+dy*ca};
 });
}
function vtextBox(o){
 const C=vtextCorners(o), xs=C.map(p=>p.x), ys=C.map(p=>p.y);
 return {x0:Math.min.apply(null,xs),y0:Math.min.apply(null,ys),x1:Math.max.apply(null,xs),y1:Math.max.apply(null,ys)};
}
/* Dời / xoay / lật / phóng một hộp chữ */
function vtextMove(o,dx,dy){o.x+=dx;o.y+=dy;return o}
function vtextRotate(o,deg,cx,cy){
 const c=vecRotatePt({x:o.x+o.w/2,y:o.y+o.h/2},deg,cx,cy);
 o.rot=((o.rot||0)+deg)%360; o.x=c.x-o.w/2; o.y=c.y-o.h/2; return o;
}
function vtextScale(o,fx,fy,cx,cy){
 const c=vecScalePt({x:o.x+o.w/2,y:o.y+o.h/2},fx,fy,cx,cy);
 o.w=Math.max(4,o.w*fx); o.h=Math.max(4,o.h*fy); o.x=c.x-o.w/2; o.y=c.y-o.h/2; return o;
}
function vtextReflect(o,axis,cx,cy){
 const c={x:o.x+o.w/2,y:o.y+o.h/2};
 const m=axis==="h"?{x:2*cx-c.x,y:c.y}:{x:c.x,y:2*cy-c.y};
 o.rot=-(o.rot||0);
 if(axis==="h")o.mh=!o.mh; else o.mv=!o.mv;
 o.x=m.x-o.w/2; o.y=m.y-o.h/2; return o;
}
function vecRotatePt(p,deg,cx,cy){
 const a=deg*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a), dx=p.x-cx, dy=p.y-cy;
 return {x:cx+dx*ca-dy*sa, y:cy+dx*sa+dy*ca};
}
function vecScalePt(p,fx,fy,cx,cy){
 return {x:cx+(p.x-cx)*fx, y:cy+(p.y-cy)*fy};
}
/* Chia chuỗi thành dòng theo bề rộng hộp (đo xấp xỉ theo cỡ chữ) — dùng cho chữ vùng (area) */
function vtextWrap(text,w,fz){
 const out=[];
 String(text||"").split("\n").forEach(function(par){
  if(!par){out.push("");return}
  const words=par.split(/\s+/), maxCh=Math.max(1,Math.floor(w/(fz*0.52)));
  let line="";
  words.forEach(function(word){
   if(!line){line=word;return}
   if((line+" "+word).length<=maxCh){line+=" "+word}
   else{out.push(line);line=word}
  });
  out.push(line);
 });
 return out;
}
/* Số dòng thực tế của một hộp chữ */
function vtextLines(o){
 if(o.mode==="area")return vtextWrap(o.text,o.w,o.fz||14);
 return String(o.text||"").split("\n");
}
/* Chữ theo dòng: hộp tự co theo nội dung. Chữ trong vùng: giữ bề rộng, cao tối thiểu theo nội dung. */
function vtextAutoSize(o){
 const fz=o.fz||14, lh=o.lh||1.28;
 const lines=vtextLines(o);
 if(o.mode==="area"){
  o.h=Math.max(24, lines.length*fz*lh+8);
  return o;
 }
 let mx=1;
 lines.forEach(function(l){if(l.length>mx)mx=l.length});
 o.w=Math.max(20, Math.round(mx*fz*0.56+8));
 o.h=Math.max(fz*1.3, Math.round(lines.length*fz*lh+6));
 return o;
}
/* Chiều cao tự động cho chữ vùng khi nội dung dài hơn hộp */
function vtextFitHeight(o){
 const n=vtextLines(o).length, lh=(o.fz||14)*(o.lh||1.28);
 return Math.max(o.h, n*lh+8);
}
/* Đặt lại tay cầm đối xứng quanh điểm neo theo hướng (dx,dy) và độ dài len */
function vecSetHandle(n, dx, dy, len){
 const L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L;
 n.outX=n.x+ux*len; n.outY=n.y+uy*len;
 n.inX =n.x-ux*len; n.inY =n.y-uy*len;
 return n;
}
/* Độ dài tay cầm trung bình — dùng khi cần hiển thị hoặc co giãn */
function vecHandleLen(n){
 const a=vecHasOut(n)?Math.hypot(n.outX-n.x,n.outY-n.y):0;
 const b=vecHasIn(n)?Math.hypot(n.inX-n.x,n.inY-n.y):0;
 return Math.max(a,b);
}
/* Chuyển điểm neo góc nhọn ⇄ mượt (giống Convert Anchor Point của Illustrator) */
function vecConvertNode(n, toSmooth){
 if(!toSmooth){
  n.inX=n.x; n.inY=n.y; n.outX=n.x; n.outY=n.y; n.type="corner";
  return n;
 }
 /* sang mượt: nếu chưa có tay cầm, tạo tay cầm ngang ngắn để thấy ngay kết quả */
 if(!vecHasHandle(n)){
  const len=Math.max(8, vecHandleLen(n)||8);
  vecSetHandle(n, 1, 0, len);
 }
 n.type="smooth";
 /* cân lại cho đối xứng */
 const ox=n.outX-n.x, oy=n.outY-n.y;
 n.inX=n.x-ox; n.inY=n.y-oy;
 return n;
}
