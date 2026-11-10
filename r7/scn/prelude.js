/* Bộ trợ giúp dựng bản vẽ bằng chính hàm của PFD Studio */
window.__B={ids:{}};
function bN(key,type,x,y,o){o=o||{};
 const n=mkNode(type,+x.toFixed(2),+y.toFixed(2),o.tag!==undefined?o.tag:"",o.title!==undefined?o.title:"",o.props||"",o.v||0);
 if(o.sc)n.sc=o.sc;if(o.rot)n.rot=o.rot;if(o.flip)n.flip=true;if(o.lp)n.lp=o.lp;if(o.ls)n.ls=o.ls;
 if(type==="text"||type==="area"){if(o.w)n.w=o.w;if(o.h)n.h=o.h;if(o.ff)n.ff=o.ff;if(o.fz)n.fz=o.fz;if(o.b)n.b=true;if(o.al)n.al=o.al;if(o.bd)n.bd=true;if(o.bg)n.bg=o.bg}
 if(o.ht)n.ht=true;
 __B.ids[key]=n.id;return n.id}
function bL(a,ap,b,bp,o){o=o||{};
 const A=__B.ids[a],B=__B.ids[b];if(!A||!B)throw new Error("thiếu nút "+a+" / "+b);
 const e=newEdge(A,ap,B,bp,o.kind||"process");e.num=o.num!==undefined?o.num:"";
 Object.assign(e,{phase:o.phase||"",service:o.svc||"",mid:o.mid!=null?o.mid:null,midAxis:o.ax||null,wt:o.wt||1});
 state.edges.push(e);return e}
/* ---- hệ toạ độ: px của ảnh PDF (110 dpi) -> đơn vị bản vẽ ---- */
window.__M={ox:100,oy:110,k:1.6,px0:30,py0:60};
window.bX=px=>__M.ox+(px-__M.px0)*__M.k;window.bY=py=>__M.oy+(py-__M.py0)*__M.k;

/* đặt theo tâm */
function bQ(key,type,px,py,o){o=o||{};return bN(key,type,bX(px),bY(py),o)}
/* đặt "trên đường": cổng w nằm đúng trên đường ống (y) hoặc cổng w nằm trên đường đứng (x) khi rot=90/270 */
function bV(key,type,px,py,o){o=o||{};
 const id=bN(key,type,bX(px),bY(py),o),n=getNode(id),r=portRel(n,o.pt||"w");
 if(((n.rot||0)%180)===0)n.y=+(bY(py)-r.y).toFixed(2);else n.x=+(bX(px)-r.x).toFixed(2);return id}
/* nối: "a.e","b.w" */
function bC(a,b,o){const[ka,pa]=a.split("."),[kb,pb]=b.split(".");return bL(ka,pa,kb,pb,o)}
function bT(key,px,py,txt,o){o=o||{};return bN(key,"text",bX(px),bY(py),Object.assign({title:txt,w:150,h:30,fz:7,al:"c"},o))}
/* ---- vị trí cổng (đơn vị bản vẽ) và hướng ra ---- */
function bP(tok){const[k,p]=tok.split("."),n=getNode(__B.ids[k]);if(!n)throw new Error("thiếu "+k);const r=portPos(n,p);return{x:r.x,y:r.y,d:r.d,px:(r.x-__M.ox)/__M.k+__M.px0,py:(r.y-__M.oy)/__M.k+__M.py0}}
window._OPP={e:"w",w:"e",n:"s",s:"n"};
window._DV={e:[1,0],w:[-1,0],n:[0,-1],s:[0,1]};
function _dirOf(a,b){const dx=b.x-a.x,dy=b.y-a.y;return Math.abs(dx)>=Math.abs(dy)?(dx>=0?"e":"w"):(dy>=0?"s":"n")}
/* dây ống: danh sách thẻ "nút.cổng" hoặc [px,py] (góc). Mặc định: chỉ đoạn cuối có mũi tên. */
window._cn=0;
window._axisOf=d=>(d==="e"||d==="w")?"h":"v";
function bW(tokens,o){o=o||{};
 const pts=[];let lastAx=null;
 tokens.forEach(t=>{
  if(typeof t==="string"){const p=bP(t);pts.push({tok:t,x:p.x,y:p.y,d:p.d});return}
  const prev=pts[pts.length-1],ax=prev.tok?_axisOf(prev.d):lastAx,X=bX(t[0]),Y=bY(t[1]);
  const q=ax==="h"?{x:X,y:prev.y}:{x:prev.x,y:Y};
  lastAx=ax==="h"?"v":"h";pts.push({x:q.x,y:q.y,corner:true,ax});
 });
 const L=pts[pts.length-1];if(!L.tok)throw new Error("dây phải kết thúc bằng cổng");
 const k=pts.length-2;
 if(k>=0&&pts[k].corner){if(_axisOf(L.d)==="h")pts[k].y=L.y;else pts[k].x=L.x}
 const ids=pts.map(p=>{
  if(p.corner){const key="_c"+(++window._cn);bN(key,"junction",p.x,p.y,{sc:.1});return{k:key,corner:true,x:p.x,y:p.y}}
  return{k:p.tok.split(".")[0],port:p.tok.split(".")[1],x:p.x,y:p.y}});
 const eds=[];
 for(let i=0;i<ids.length-1;i++){
  const A=ids[i],B=ids[i+1];
  if(!A.corner&&!B.corner&&A.k===B.k)continue;
  const dir=_dirOf(A,B);
  eds.push([A.k,A.corner?dir:A.port,B.k,B.corner?_OPP[dir]:B.port]);
 }
 const arrowEnd=o.arrow==="end";
 eds.forEach(([a,pa,b,pb],i)=>{
  const e=bL(a,pa,b,pb,{kind:o.kind||"process",svc:o.svc,phase:o.phase,wt:o.wt});
  e.na=!(i===eds.length-1&&(arrowEnd||o.arrow==="end"));
  if(o.arrow==="all")e.na=false;
 });
}
/* đặt nút tương đối so với một cổng (đơn vị px ảnh); căn cổng pt của nút nằm trên đường nếu dx=0 hoặc dy=0 */
function bR(key,type,tok,dx,dy,o){o=o||{};const p=bP(tok);
 const id=bN(key,type,bX(p.px+dx),bY(p.py+dy),o),n=getNode(id),r=portRel(n,o.pt||"w");
 if(dx===0&&dy!==0)n.x=+(p.x-r.x).toFixed(2);else if(dy===0&&dx!==0)n.y=+(p.y-r.y).toFixed(2);
 return id}
/* thêm cổng phụ trên cạnh s (n/s/e/w) tại tỉ lệ f; trả về id cổng */
function bX_(key,side,f){const n=getNode(__B.ids[key]);return addPortTo(n,side,f,"").id}
