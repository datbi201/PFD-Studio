/* ============ HÌNH HỌC CỔNG & ĐƯỜNG ỐNG ============ */
function portRel(n,pid){
 const def=symDef(n),p=def.ports.find(q=>q.id===pid)||def.ports[0];
 if(!p)return{x:0,y:0,d:"e"};
 const sc=n.type==="area"?1:(n.sc||1),fx=n.flip&&n.type!=="text"?-1:1;
 const lx=p.x*fx*sc,ly=p.y*sc,rad=(n.rot||0)*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
 const dv=DIRV[p.d],dx=dv[0]*fx,dy=dv[1],rx=dx*c-dy*s,ry=dx*s+dy*c;
 return{x:r3(lx*c-ly*s),y:r3(lx*s+ly*c),d:Math.abs(rx)>Math.abs(ry)?(rx>0?"e":"w"):(ry>0?"s":"n")};
}
function portPos(n,pid){const r=portRel(n,pid);return{x:n.x+r.x,y:n.y+r.y,d:r.d}}
function nearestPort(n,w){let best=null,bd=1e12;symDef(n).ports.forEach(p=>{const q=portPos(n,p.id),d=(q.x-w.x)**2+(q.y-w.y)**2;if(d<bd){bd=d;best=p.id}});return best}
/* toạ độ thế giới → toạ độ cục bộ của ký hiệu (chưa xoay / lật / co giãn) */
function toLocal(n,w){
 const sc=n.type==="area"?1:(n.sc||1),fx=n.flip&&n.type!=="text"?-1:1,rad=-(n.rot||0)*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),dx=w.x-n.x,dy=w.y-n.y;
 return{x:(dx*c-dy*s)/sc*fx,y:(dx*s+dy*c)/sc};
}
/* tạo cổng tuỳ chọn từ một điểm bất kỳ gần viền thiết bị */
function portFromPoint(n,w){
 const def=varOfDef(n),l=toLocal(n,w),hw=def.w/2,hh=def.h/2;
 const dN=Math.abs(l.y+hh)/def.h,dS=Math.abs(l.y-hh)/def.h,dW=Math.abs(l.x+hw)/def.w,dE=Math.abs(l.x-hw)/def.w,m=Math.min(dN,dS,dW,dE);
 const s=m===dN?"n":m===dS?"s":m===dW?"w":"e";
 const f=(s==="n"||s==="s")?(l.x/def.w+.5):(l.y/def.h+.5);
 return{s,f:Math.round(Math.min(1,Math.max(0,f))*100)/100};
}
function varOfDef(n){if(n.type==="text"||n.type==="area")return symDef(n);return varOf(n).def}
function newPortId(n){let k=1;const have=new Set((n.xp||[]).map(p=>p.id));while(have.has("x"+k))k++;return"x"+k}
function addPortTo(n,s,f,label){
 n.xp=n.xp||[];const p={id:newPortId(n),s,f:f==null?.5:f,o:0,l:label||""};n.xp.push(p);return p;
}
function freeFraction(n,s){
 const used=(n.xp||[]).filter(p=>p.s===s).map(p=>p.f);const cand=[.5,.25,.75,.15,.85,.35,.65,.05,.95];
 for(const c of cand)if(!used.some(u=>Math.abs(u-c)<.08))return c;return .5;
}
function removePort(n,pid){
 const pos=portPos(n,pid);n.xp=(n.xp||[]).filter(p=>p.id!==pid);if(!n.xp.length)delete n.xp;
 const fallback=nearestPort(n,pos);
 state.edges.forEach(e=>{if(e.from===n.id&&e.fromPort===pid)e.fromPort=fallback;if(e.to===n.id&&e.toPort===pid)e.toPort=fallback;if((e.from===n.id&&e.fromPort===fallback)||(e.to===n.id&&e.toPort===fallback)){e.mid=null;e.midAxis=null}});
}

function cleanPts(p){
 const o=[];for(const q of p){const l=o[o.length-1];if(l&&Math.abs(l.x-q.x)<.01&&Math.abs(l.y-q.y)<.01)continue;o.push(q)}
 if(o.length<3)return o;
 const r=[o[0]];for(let i=1;i<o.length-1;i++){const a=r[r.length-1],b=o[i],c=o[i+1];if((Math.abs(a.x-b.x)<.01&&Math.abs(b.x-c.x)<.01)||(Math.abs(a.y-b.y)<.01&&Math.abs(b.y-c.y)<.01))continue;r.push(b)}
 r.push(o[o.length-1]);return r;
}
function route(a,b,mid,midAxis){
 const st=24,a2={x:a.x+DIRV[a.d][0]*st,y:a.y+DIRV[a.d][1]*st},b2={x:b.x+DIRV[b.d][0]*st,y:b.y+DIRV[b.d][1]*st};
 const aH=a.d==="e"||a.d==="w",bH=b.d==="e"||b.d==="w";
 const M=(ax,def)=>(typeof mid==="number"&&midAxis===ax)?mid:def;
 let mids=[],axis=null,hx=null,hy=null;
 if(aH&&bH){
  const fwd=(a.d==="e"&&b.d==="w"&&a2.x<=b2.x)||(a.d==="w"&&b.d==="e"&&a2.x>=b2.x);
  if(fwd){const mx=M("x",(a2.x+b2.x)/2);mids=[{x:mx,y:a.y},{x:mx,y:b.y}];axis="x";hx=mx;hy=(a.y+b.y)/2}
  else if(a.d===b.d){const ex=a.d==="e"?Math.max(a2.x,b2.x):Math.min(a2.x,b2.x),xx=M("x",ex);mids=[{x:xx,y:a.y},{x:xx,y:b.y}];axis="x";hx=xx;hy=(a.y+b.y)/2}
  else{const ym=M("y",(a.y+b.y)/2+(Math.abs(a.y-b.y)<40?70:0));mids=[a2,{x:a2.x,y:ym},{x:b2.x,y:ym},b2];axis="y";hx=(a2.x+b2.x)/2;hy=ym}
 }else if(!aH&&!bH){
  const fwd=(a.d==="s"&&b.d==="n"&&a2.y<=b2.y)||(a.d==="n"&&b.d==="s"&&a2.y>=b2.y);
  if(fwd){const my=M("y",(a2.y+b2.y)/2);mids=[{x:a.x,y:my},{x:b.x,y:my}];axis="y";hx=(a.x+b.x)/2;hy=my}
  else if(a.d===b.d){const ey=a.d==="s"?Math.max(a2.y,b2.y):Math.min(a2.y,b2.y),yy=M("y",ey);mids=[{x:a.x,y:yy},{x:b.x,y:yy}];axis="y";hx=(a.x+b.x)/2;hy=yy}
  else{const xm=M("x",(a.x+b.x)/2+(Math.abs(a.x-b.x)<40?70:0));mids=[a2,{x:xm,y:a2.y},{x:xm,y:b2.y},b2];axis="x";hx=xm;hy=(a2.y+b2.y)/2}
 }else if(aH&&!bH){
  const okx=(a.d==="e"&&b.x>a2.x)||(a.d==="w"&&b.x<a2.x),oky=(b.d==="n"&&a.y<b2.y)||(b.d==="s"&&a.y>b2.y);
  mids=(okx&&oky)?[{x:b.x,y:a.y}]:[a2,{x:a2.x,y:b2.y},b2];
 }else{
  const okx=(b.d==="e"&&a.x>b2.x)||(b.d==="w"&&a.x<b2.x),oky=(a.d==="s"&&b.y>a2.y)||(a.d==="n"&&b.y<a2.y);
  mids=(okx&&oky)?[{x:a.x,y:b.y}]:[a2,{x:b2.x,y:a2.y},b2];
 }
 return{pts:cleanPts([a,...mids,b]),axis,hx,hy};
}
const hopRadius=()=>4+RS.edge*1.4;
function pathFrom(pts,r,hops){
 const n=pts.length;if(n<2)return"";
 const cs=[];
 for(let i=1;i<n-1;i++){
  const p0=pts[i-1],p1=pts[i],p2=pts[i+1],l1=Math.hypot(p1.x-p0.x,p1.y-p0.y),l2=Math.hypot(p2.x-p1.x,p2.y-p1.y),rr=Math.min(r,l1/2,l2/2);
  cs[i]={a:{x:p1.x+(p0.x-p1.x)/l1*rr,y:p1.y+(p0.y-p1.y)/l1*rr},b:{x:p1.x+(p2.x-p1.x)/l2*rr,y:p1.y+(p2.y-p1.y)/l2*rr}};
 }
 const H=hopRadius();let d=`M ${pts[0].x} ${pts[0].y}`;
 for(let i=0;i<n-1;i++){
  const p=pts[i],q=pts[i+1],end=(i<n-2)?cs[i+1].a:q,hs=(hops&&hops[i])?hops[i]:[];
  if(hs.length){const dir=q.x>p.x?1:-1,list=dir>0?hs:[...hs].reverse();list.forEach(x=>{d+=` L ${r3(x-dir*H)} ${p.y} A ${r3(H)} ${r3(H)} 0 0 ${dir>0?1:0} ${r3(x+dir*H)} ${p.y}`})}
  d+=` L ${r3(end.x)} ${r3(end.y)}`;
  if(i<n-2)d+=` Q ${q.x} ${q.y} ${r3(cs[i+1].b.x)} ${r3(cs[i+1].b.y)}`;
 }
 return d;
}
function allGeoms(){const m=new Map();state.edges.forEach(e=>{const g=edgeGeom(e);if(g)m.set(e.id,g)});return m}
/* vòng cung nhảy: đoạn NGANG nhảy qua đoạn ĐỨNG của ống khác */
function computeHops(geoms){
 const hops=new Map();if(!state.meta.hops)return hops;
 const H=hopRadius(),m=H+9,V=[];
 geoms.forEach((g,id)=>{for(let i=0;i<g.pts.length-1;i++){const p=g.pts[i],q=g.pts[i+1];if(Math.abs(p.x-q.x)<.01&&Math.abs(p.y-q.y)>.01)V.push({id,x:p.x,y0:Math.min(p.y,q.y),y1:Math.max(p.y,q.y)})}});
 geoms.forEach((g,id)=>{
  const arr=[];
  for(let i=0;i<g.pts.length-1;i++){
   const p=g.pts[i],q=g.pts[i+1];arr.push([]);
   if(Math.abs(p.y-q.y)>.01||Math.abs(p.x-q.x)<.01)continue;
   const x0=Math.min(p.x,q.x),x1=Math.max(p.x,q.x),xs=[];
   V.forEach(v=>{if(v.id!==id&&v.x>x0+m&&v.x<x1-m&&p.y>v.y0+1&&p.y<v.y1-1)xs.push(v.x)});
   xs.sort((a,b)=>a-b);const out=[];xs.forEach(x=>{if(!out.length||x-out[out.length-1]>2*H+3)out.push(x)});arr[i]=out;
  }
  hops.set(id,arr);
 });
 return hops;
}
function edgeGeom(e){const A=getNode(e.from),B=getNode(e.to);if(!A||!B)return null;const a=portPos(A,e.fromPort),b=portPos(B,e.toPort);return route(a,b,e.mid,e.midAxis)}
function edgeColor(e){
 if(BW)return SCH.ink;
 if(e.kind==="road")return SCH.road;if(e.kind==="sea")return SCH.sea;
 if(e.kind==="rail"||e.kind==="shaft")return SCH.ink;
 return(state.meta.colorByPhase&&e.phase&&PHASE[e.phase])?SCH.ph[e.phase]:SCH.ink;
}
const hex6=c=>String(c).replace(/[^0-9a-fA-F]/g,"").slice(0,8);
function markerDefs(){
 const cols=new Set([SCH.ink,SCH.road,SCH.sea,...Object.values(SCH.ph)]);
 let out=[...cols].map(c=>`<marker id="arr${hex6(c)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join("");
 const sc=new Set(state.shapes.map(h=>h.col));
 out+=[...sc].map(c=>`<marker id="sa${hex6(c)}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join("");
 return out;
}
