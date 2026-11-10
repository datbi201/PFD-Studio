/* ============ MODULE SƠ ĐỒ — ĐIỂM NỐI, ĐỊNH TUYẾN ĐƯỜNG NỐI, MŨI TÊN ============ */
const DG_DIRS=[[0,-1],[1,0],[0,1],[-1,0]];          /* 0 lên, 1 phải, 2 xuống, 3 trái */
const dgById=a=>{const m=new Map();a.forEach(s=>m.set(s.id,s));return m};
const dgCenter=s=>({x:s.x+s.w/2,y:s.y+s.h/2});
function dgRotPt(s,px,py){                           /* điểm cục bộ → toạ độ bản vẽ (có xoay quanh tâm) */
 const cx=s.w/2,cy=s.h/2,r=(s.rot||0)*Math.PI/180,c=Math.cos(r),n=Math.sin(r),dx=px-cx,dy=py-cy;
 return{x:s.x+cx+dx*c-dy*n,y:s.y+cy+dx*n+dy*c};
}
function dgSites(s){                                 /* 4 điểm nối: [{x,y,v}] */
 const P=DG_PRESET[s.k],loc=P.st(s.w,s.h,s.a,s.b),k=Math.round((s.rot||0)/90)%4;
 return loc.map((p,i)=>{const q=dgRotPt(s,p[0],p[1]);return{x:q.x,y:q.y,v:DG_DIRS[(i+k+4)%4]}});
}
function dgFrameCorners(s){return[[0,0],[s.w,0],[s.w,s.h],[0,s.h]].map(p=>dgRotPt(s,p[0],p[1]))}
function dgShapeBBox(s){
 const c=dgFrameCorners(s),xs=c.map(p=>p.x),ys=c.map(p=>p.y);
 return{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};
}
function dgEndInfo(c,which,m){
 const e=c[which];
 if(e){const s=m.get(e.id);if(s){const st=dgSites(s)[e.p];return{x:st.x,y:st.y,v:st.v}}}
 const p=which==="s"?c.sp:c.ep;return{x:p?p.x:0,y:p?p.y:0,v:null};
}
/* ---- tiện ích đa tuyến ---- */
function dgClean(pts){
 const o=[];pts.forEach(p=>{const l=o[o.length-1];if(!l||Math.abs(l[0]-p[0])>.01||Math.abs(l[1]-p[1])>.01)o.push([p[0],p[1]])});
 let ch=true;while(ch){ch=false;for(let i=1;i<o.length-1;i++){
  const a=o[i-1],b=o[i],d=o[i+1];
  if((Math.abs(a[0]-b[0])<.01&&Math.abs(b[0]-d[0])<.01&&(b[1]-a[1])*(d[1]-b[1])>=0)||(Math.abs(a[1]-b[1])<.01&&Math.abs(b[1]-d[1])<.01&&(b[0]-a[0])*(d[0]-b[0])>=0)){o.splice(i,1);ch=true;break}}}
 return o;
}
const dgLen=p=>{let t=0;for(let i=1;i<p.length;i++)t+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return t};
const dgBends=p=>Math.max(0,p.length-2);
function dgAtFrac(p,f){
 const T=dgLen(p);if(T<1e-6)return{x:p[0][0],y:p[0][1],ang:0};let t=T*f;
 for(let i=1;i<p.length;i++){const l=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
  if(t<=l||i===p.length-1){const u=l?Math.min(1,t/l):0;return{x:p[i-1][0]+(p[i][0]-p[i-1][0])*u,y:p[i-1][1]+(p[i][1]-p[i-1][1])*u,ang:Math.atan2(p[i][1]-p[i-1][1],p[i][0]-p[i-1][0])}}
  t-=l}
}
/* ---- định tuyến vuông góc ---- */
const _dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
function dgFreeDir(A,vs,B){
 const dx=B.x-A.x,dy=B.y-A.y;
 if(dx*vs[0]+dy*vs[1]>0)return[-vs[0],-vs[1]];
 return vs[0]?[0,Math.sign(A.y-B.y)||1]:[Math.sign(A.x-B.x)||1,0];
}
function dgOrth(A,B,adj){
 let vs=A.v,ve=B.v;const dx=B.x-A.x,dy=B.y-A.y;
 if(!vs&&!ve){vs=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1]}
 if(!vs){const r=dgOrth(B,A,1-adj);return r.reverse()}
 if(!ve)ve=dgFreeDir(A,vs,B);
 const fwd=dx*vs[0]+dy*vs[1],d=_dot(vs,ve);
 const P0=[A.x,A.y],P1=[B.x,B.y];
 if(d===-1&&fwd>0){                                  /* hai đầu đối diện nhau: đường thẳng hoặc chữ Z */
  if(vs[0]){const xm=A.x+dx*adj;return dgClean([P0,[xm,A.y],[xm,B.y],P1])}
  const ym=A.y+dy*adj;return dgClean([P0,[A.x,ym],[B.x,ym],P1]);
 }
 if(d===0){                                          /* vuông góc: chữ L nếu hợp lệ */
  const C=vs[0]?[B.x,A.y]:[A.x,B.y];
  if((C[0]-A.x)*vs[0]+(C[1]-A.y)*vs[1]>.01&&(C[0]-B.x)*ve[0]+(C[1]-B.y)*ve[1]>.01)return dgClean([P0,C,P1]);
 }
 const g=24,cands=[];
 if(d===1){                                          /* cùng hướng: chữ U */
  const m=Math.max(A.x*vs[0]+A.y*vs[1],B.x*vs[0]+B.y*vs[1])+g;
  const S1=[A.x+vs[0]*(m-(A.x*vs[0]+A.y*vs[1])),A.y+vs[1]*(m-(A.x*vs[0]+A.y*vs[1]))];
  const E1=[B.x+vs[0]*(m-(B.x*vs[0]+B.y*vs[1])),B.y+vs[1]*(m-(B.x*vs[0]+B.y*vs[1]))];
  cands.push([P0,S1,E1,P1]);
 }
 const S1=[A.x+vs[0]*g,A.y+vs[1]*g],E1=[B.x+ve[0]*g,B.y+ve[1]*g];
 cands.push([P0,S1,[S1[0],E1[1]],E1,P1],[P0,S1,[E1[0],S1[1]],E1,P1]);
 if(d===-1){                                         /* quay lưng nhau: đi vòng qua điểm giữa */
  if(vs[0]){const ym=(A.y+B.y)/2;cands.push([P0,S1,[S1[0],ym],[E1[0],ym],E1,P1])}
  else{const xm=(A.x+B.x)/2;cands.push([P0,S1,[xm,S1[1]],[xm,E1[1]],E1,P1])}
 }
 let best=null,bs=1e18;
 cands.forEach(c=>{
  const q=dgClean(c);if(q.length<2)return;
  const f=[q[1][0]-q[0][0],q[1][1]-q[0][1]],l=q[q.length-1],p=q[q.length-2],e=[l[0]-p[0],l[1]-p[1]];
  const ok=(f[0]*vs[0]+f[1]*vs[1]>=-.01)&&(e[0]*ve[0]+e[1]*ve[1]<=.01);
  const sc=(ok?0:1e9)+dgBends(q)*1000+dgLen(q);
  if(sc<bs){bs=sc;best=q}
 });
 return best||dgClean([P0,P1]);
}
function dgCurve(A,B){
 let vs=A.v,ve=B.v;const dx=B.x-A.x,dy=B.y-A.y;
 if(!vs&&!ve){vs=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1]}
 if(!vs)vs=dgFreeDir(B,ve,A);
 if(!ve)ve=dgFreeDir(A,vs,B);
 const k=Math.max(24,Math.hypot(dx,dy)*.45);
 const c1=[A.x+vs[0]*k,A.y+vs[1]*k],c2=[B.x+ve[0]*k,B.y+ve[1]*k];
 const pts=[];for(let i=0;i<=32;i++){const t=i/32,u=1-t;
  pts.push([u*u*u*A.x+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*B.x,u*u*u*A.y+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*B.y])}
 return{pts,d:`M${_f(A.x)} ${_f(A.y)}C${_f(c1[0])} ${_f(c1[1])} ${_f(c2[0])} ${_f(c2[1])} ${_f(B.x)} ${_f(B.y)}`};
}
/* ---- hình học cuối cùng của một đường nối ---- */
function dgRoute(c,m){
 const A=dgEndInfo(c,"s",m),B=dgEndInfo(c,"e",m);let pts,d;
 if(c.ty==="cv"){const r=dgCurve(A,B);pts=r.pts;d=r.d}
 else{pts=c.ty==="st"?dgClean([[A.x,A.y],[B.x,B.y]]):dgOrth(A,B,c.adj);if(pts.length<2)pts=[[A.x,A.y],[B.x+.01,B.y]]}
 return{pts,d:d||null,A,B};
}
/* ---- mũi tên theo kích thước Office (trung bình, tối thiểu theo nét 2 pt) ---- */
function dgArrowDims(lwPt){const r=Math.max(lwPt,2)*DGPT;return r}
function dgArrowInset(kind,lwPt){return kind==="tri"||kind==="stealth"?dgArrowDims(lwPt)*(kind==="tri"?2.6:2):kind==="open"?0:0}
function dgArrowSvg(kind,x,y,ang,lwPt,col){
 if(kind==="none")return"";
 const r=dgArrowDims(lwPt),ca=Math.cos(ang),sa=Math.sin(ang),T=(u,v)=>[x+u*ca-v*sa,y+u*sa+v*ca];
 const ptsS=a=>a.map(q=>{const p=T(q[0],q[1]);return _f(p[0])+","+_f(p[1])}).join(" ");
 const sw=_f(lwPt*DGPT);
 if(kind==="tri")return`<polygon points="${ptsS([[0,0],[-3*r,-1.5*r],[-3*r,1.5*r]])}" fill="${col}" stroke="${col}" stroke-width="${_f(sw*.3)}" stroke-linejoin="miter"/>`;
 if(kind==="stealth")return`<polygon points="${ptsS([[0,0],[-3*r,-1.5*r],[-2*r,0],[-3*r,1.5*r]])}" fill="${col}" stroke="${col}" stroke-width="${_f(sw*.3)}" stroke-linejoin="miter"/>`;
 if(kind==="open")return`<polyline points="${ptsS([[-3*r,-1.5*r],[0,0],[-3*r,1.5*r]])}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
 if(kind==="oval"){const c=T(-1.5*r,0);return`<ellipse cx="${_f(c[0])}" cy="${_f(c[1])}" rx="${_f(1.5*r)}" ry="${_f(1.5*r)}" fill="${col}" stroke="${col}" stroke-width="${_f(sw*.3)}"/>`}
 if(kind==="diamond")return`<polygon points="${ptsS([[0,0],[-1.5*r,-1.5*r],[-3*r,0],[-1.5*r,1.5*r]])}" fill="${col}" stroke="${col}" stroke-width="${_f(sw*.3)}"/>`;
 return"";
}
/* khoảng cách từ điểm tới đa tuyến (để chọn đường nối) */
function dgDistPoly(p,x,y){
 let best=1e18;for(let i=1;i<p.length;i++){
  const ax=p[i-1][0],ay=p[i-1][1],bx=p[i][0],by=p[i][1],vx=bx-ax,vy=by-ay,l2=vx*vx+vy*vy;
  let t=l2?((x-ax)*vx+(y-ay)*vy)/l2:0;t=Math.max(0,Math.min(1,t));
  best=Math.min(best,Math.hypot(x-(ax+vx*t),y-(ay+vy*t)))}
 return best;
}
