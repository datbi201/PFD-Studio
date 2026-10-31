/* ============ SimCAD — HÌNH HỌC, KÍCH THƯỚC, HATCH, HIỂN THỊ ============ */
const cadOn=()=>state.meta.doc==="cad";
const cadCfg=()=>state.meta.cad;
const PI2=Math.PI*2;
const hyp=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const sgn=v=>v<0?-1:1;
function layerById(id){const L=state.meta.cad.layers;return L.find(l=>l.id===id)||L[0]}
function layVis(o){if(state.meta.doc!=="cad"||!o||!o.lay)return true;const l=state.meta.cad.layers.find(x=>x.id===o.lay);return!l||l.vis}
function layLock(o){if(state.meta.doc!=="cad"||!o||!o.lay)return false;const l=state.meta.cad.layers.find(x=>x.id===o.lay);return!!l&&l.lock}

/* ---- đổi đơn vị: 1 đơn vị bản vẽ = 0,25 mm trên giấy; thực = giấy × tỷ lệ ---- */
function cadWPU(){const c=state.meta.cad;return MM*CAD_UNITS[c.unit]/c.scale}   /* đơn vị bản vẽ trên 1 đơn vị thực */
function cadGridW(){return Math.max(.5,cadCfg().gstep*cadWPU())}
function w2u(p){const H=sheetDim()[1],k=cadWPU();return{x:p.x/k,y:(H-p.y)/k}}
function u2w(p){const H=sheetDim()[1],k=cadWPU();return{x:p.x*k,y:H-p.y*k}}
function lenW2U(l){return l/cadWPU()}
function lenU2W(l){return l*cadWPU()}
function fmtLen(wl,dec){const c=state.meta.cad,d=dec===undefined?c.dec:dec;let t=(wl/cadWPU()).toFixed(d);if(/^-0(\.0+)?$/.test(t))t=t.slice(1);return t}
function fmtAngle(a){return(Math.round(a*100)/100)+"°"}

/* ---- biến đổi mọi điểm của hình ---- */
/* Rev.6: path Bézier giữ hình học trong nodes[] (6 toạ độ/node) — đi qua vecAllPts / vecMapNodes
   để xoay, lật, dời, sao chép… vẫn dùng chung được với code cũ. */
function allShapePts(h){
 if(h&&h.t==="path")return vecAllPts(h);
 if(h&&h.t==="vtext")return vtextCorners(h);
 const a=[...h.pts];if(h.rings)h.rings.forEach(r=>a.push(...r));return a;
}
function mapShapePts(h,fn){
 if(h&&h.t==="path"){vecMapNodes(h,fn);return}
 /* chữ vector: chỉ dời (giữ nguyên hộp + góc xoay) — xoay/phóng/lật có hàm riêng */
 if(h&&h.t==="vtext"){const c=fn({x:h.x,y:h.y});h.x=c.x;h.y=c.y;return}
 h.pts=h.pts.map(fn);if(h.rings)h.rings=h.rings.map(r=>r.map(fn));
}

/* ---- cung tròn qua 3 điểm: đầu – giữa – cuối ---- */
function arcGeom(p0,p1,p2){
 const ax=p0.x,ay=p0.y,bx=p1.x,by=p1.y,cx=p2.x,cy=p2.y;
 const d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));
 if(Math.abs(d)<1e-6)return null;
 const a2=ax*ax+ay*ay,b2=bx*bx+by*by,c2=cx*cx+cy*cy;
 const ux=(a2*(by-cy)+b2*(cy-ay)+c2*(ay-by))/d,uy=(a2*(cx-bx)+b2*(ax-cx)+c2*(bx-ax))/d;
 const r=Math.hypot(ax-ux,ay-uy),cr=(bx-ax)*(cy-by)-(by-ay)*(cx-bx),sweep=cr>0?1:0;
 const a0=Math.atan2(ay-uy,ax-ux),ae=Math.atan2(cy-uy,cx-ux);
 let dl=(ae-a0)*(sweep?1:-1);dl=((dl%PI2)+PI2)%PI2;
 return{cx:ux,cy:uy,r,sweep,large:dl>Math.PI?1:0,a0,delta:dl,dir:sweep?1:-1};
}
function arcSample(g,n){const o=[];for(let i=0;i<=n;i++){const a=g.a0+g.dir*g.delta*i/n;o.push({x:g.cx+g.r*Math.cos(a),y:g.cy+g.r*Math.sin(a)})}return o}
/* cung từ tâm, góc đầu, góc cuối (ngược chiều kim đồng hồ trên màn hình = góc giảm) */
function arcFromCenter(c,r,aStart,aEnd,dir){
 let dl=(aEnd-aStart)*dir;dl=((dl%PI2)+PI2)%PI2;if(dl<1e-9)dl=PI2;
 const f=a=>({x:c.x+r*Math.cos(a),y:c.y+r*Math.sin(a)});
 return[f(aStart),f(aStart+dir*dl/2),f(aStart+dir*dl)];
}

/* ---- xấp xỉ mọi hình thành đa tuyến (dùng cho giao điểm, hatch, offset, trim) ---- */
function ellipsePoly(h,n){
 const b=shapeBox(h),cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,rx=(b.x1-b.x0)/2,ry=(b.y1-b.y0)/2,o=[];
 for(let i=0;i<n;i++){const a=PI2*i/n;o.push({x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)})}return o;
}
function shapePoly(h){
 switch(h.t){
  case"line":case"arrow":return{pts:[h.pts[0],h.pts[h.pts.length-1]],closed:false};
  case"rect":{const b=shapeBox(h);return{pts:[{x:b.x0,y:b.y0},{x:b.x1,y:b.y0},{x:b.x1,y:b.y1},{x:b.x0,y:b.y1}],closed:true}}
  case"ellipse":return{pts:ellipsePoly(h,96),closed:true};
  case"circle":{const r=hyp(h.pts[0],h.pts[1]),o=[];for(let i=0;i<96;i++){const a=PI2*i/96;o.push({x:h.pts[0].x+r*Math.cos(a),y:h.pts[0].y+r*Math.sin(a)})}return{pts:o,closed:true}}
  case"arc":{const g=arcGeom(h.pts[0],h.pts[1],h.pts[2]);return{pts:g?arcSample(g,Math.max(12,Math.round(g.delta/PI2*96))):[h.pts[0],h.pts[2]],closed:false}}
  case"poly":return{pts:h.pts,closed:!!h.closed};
  case"pen":return{pts:h.pts,closed:false};
 }
 return null;
}
function polySegs(pp){const s=[],P=pp.pts;for(let i=0;i<P.length-1;i++)s.push([P[i],P[i+1]]);if(pp.closed&&P.length>2)s.push([P[P.length-1],P[0]]);return s}
function shapeSegs(h){const p=shapePoly(h);return p?polySegs(p):[]}
function segInt(a,b,c,d){   /* giao điểm hai đoạn; trả {x,y,t,u} hoặc null */
 const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;
 if(Math.abs(den)<1e-9)return null;
 const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den,u=((c.x-a.x)*r.y-(c.y-a.y)*r.x)/den;
 if(t<-1e-9||t>1+1e-9||u<-1e-9||u>1+1e-9)return null;
 return{x:a.x+t*r.x,y:a.y+t*r.y,t,u};
}
function lineInt(a,b,c,d){   /* đường thẳng (a,b) kéo dài × đoạn (c,d) */
 const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;
 if(Math.abs(den)<1e-9)return null;
 const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den,u=((c.x-a.x)*r.y-(c.y-a.y)*r.x)/den;
 if(u<-1e-9||u>1+1e-9)return null;
 return{x:a.x+t*r.x,y:a.y+t*r.y,t,u};
}
function closestOnSeg(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;let t=l2?((p.x-a.x)*dx+(p.y-a.y)*dy)/l2:0;t=Math.max(0,Math.min(1,t));
 return{x:a.x+t*dx,y:a.y+t*dy,t};
}
function pointInRing(p,R){let c=false;for(let i=0,j=R.length-1;i<R.length;j=i++){const a=R[i],b=R[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c}return c}
function ringArea(R){let s=0;for(let i=0,j=R.length-1;i<R.length;j=i++)s+=(R[j].x+R[i].x)*(R[j].y-R[i].y);return Math.abs(s/2)}

/* ============ KÍCH THƯỚC ============ */
function dimParams(){const c=state.meta.cad;return{S:c.dimAh*MM,TH:c.dimTh*MM,G:1*MM,E:1.5*MM}}
const unit2=(a,b)=>{const l=Math.hypot(b.x-a.x,b.y-a.y)||1e-9;return{x:(b.x-a.x)/l,y:(b.y-a.y)/l}};
function dimText(h,val,pre){return h.dt?h.dt:(pre||"")+fmtLen(val)}
function dimGeom(h){
 const{S,TH,G,E}=dimParams(),P=h.pts,out={lines:[],arrows:[],text:null,ext:[]},ds=h.ds||"al";
 const txtRot=(u,pos,str,off)=>{let a=Math.atan2(u.y,u.x);if(a>Math.PI/2+1e-6||a<=-Math.PI/2+1e-6)a+=Math.PI;const above={x:Math.sin(a),y:-Math.cos(a)};return{x:pos.x+above.x*(off===undefined?TH*.3:off),y:pos.y+above.y*(off===undefined?TH*.3:off),ang:a*180/Math.PI,str,anchor:"middle"}};
 if(ds==="r"||ds==="d"){
  const c=P[0],q0=P[1],loc=P[2],r=hyp(c,q0)||1e-6;let u=unit2(c,loc);if(hyp(c,loc)<1e-6)u=unit2(c,q0);
  const q=ds==="r"?{x:c.x+u.x*r,y:c.y+u.y*r}:null,dl=hyp(c,loc);
  if(ds==="r"){
   if(dl>=r){out.lines.push([q,loc]);out.arrows.push({tip:q,dir:{x:-u.x,y:-u.y}})}
   else{out.lines.push([c,q]);out.arrows.push({tip:q,dir:{x:-u.x,y:-u.y}})}
   const rt=dimText(h,r,"R"),right=dl>=r?u.x>=0:true;
   out.text={x:loc.x+(dl>=r?(u.x>=0?TH*.4:-TH*.4):0),y:loc.y+(dl>=r?TH*.35:-TH*.35),ang:0,str:rt,anchor:dl>=r?(u.x>=0?"start":"end"):"middle"};
  }else{
   const q1={x:c.x-u.x*r,y:c.y-u.y*r},q2={x:c.x+u.x*r,y:c.y+u.y*r};
   out.lines.push([q1,q2]);out.arrows.push({tip:q1,dir:{x:u.x,y:u.y}},{tip:q2,dir:{x:-u.x,y:-u.y}});
   if(dl>r){out.lines.push([q2,loc]);out.text={x:loc.x+(u.x>=0?TH*.4:-TH*.4),y:loc.y+TH*.35,ang:0,str:dimText(h,2*r,"Ø"),anchor:u.x>=0?"start":"end"}}
   else out.text=txtRot(u,c,dimText(h,2*r,"Ø"));
  }
  return out;
 }
 const p1=P[0],p2=P[1],c3=P[2];let d1,d2,len;
 if(ds==="al"){const L=hyp(p1,p2)||1e-6,u=unit2(p1,p2),n={x:-u.y,y:u.x},off=(c3.x-p1.x)*n.x+(c3.y-p1.y)*n.y;d1={x:p1.x+n.x*off,y:p1.y+n.y*off};d2={x:p2.x+n.x*off,y:p2.y+n.y*off};len=L}
 else if(ds==="h"){d1={x:p1.x,y:c3.y};d2={x:p2.x,y:c3.y};len=Math.abs(p2.x-p1.x)}
 else{d1={x:c3.x,y:p1.y};d2={x:c3.x,y:p2.y};len=Math.abs(p2.y-p1.y)}
 const u=unit2(d1,d2);
 [[p1,d1],[p2,d2]].forEach(([p,d])=>{const dd=hyp(p,d);if(dd>G+.01){const e=unit2(p,d);out.ext.push([{x:p.x+e.x*G,y:p.y+e.y*G},{x:d.x+e.x*E,y:d.y+e.y*E}])}});
 const inside=len>=2.4*S;
 out.lines.push([d1,d2]);
 if(inside)out.arrows.push({tip:d1,dir:{x:u.x,y:u.y}},{tip:d2,dir:{x:-u.x,y:-u.y}});
 else{out.arrows.push({tip:d1,dir:{x:-u.x,y:-u.y},rev:1},{tip:d2,dir:{x:u.x,y:u.y},rev:1});out.lines.push([{x:d1.x-u.x*S*1.4,y:d1.y-u.y*S*1.4},d1],[d2,{x:d2.x+u.x*S*1.4,y:d2.y+u.y*S*1.4}])}
 out.text=txtRot(u,{x:(d1.x+d2.x)/2,y:(d1.y+d2.y)/2},dimText(h,len));
 return out;
}
function dimBoxPts(h){
 const P=[...h.pts];
 try{const g=dimGeom(h);g.lines.concat(g.ext).forEach(l=>P.push(l[0],l[1]));if(g.text){const w=g.text.str.length*dimParams().TH*.3;P.push({x:g.text.x-w,y:g.text.y-dimParams().TH},{x:g.text.x+w,y:g.text.y+dimParams().TH*.3})}}catch(e){}
 if((h.ds==="r"||h.ds==="d")){const r=hyp(h.pts[0],h.pts[1]);P.push({x:h.pts[0].x-r,y:h.pts[0].y-r},{x:h.pts[0].x+r,y:h.pts[0].y+r})}
 return P;
}
function dimMarkup(h,it){
 const g=dimGeom(h),{S,TH}=dimParams(),c=cadCfg(),col=shCol(h.col),w=h.sw*RS.lwk,tick=c.dimSt==="tick";
 let dl=g.lines.concat(g.ext).map(l=>`M${r3(l[0].x)} ${r3(l[0].y)}L${r3(l[1].x)} ${r3(l[1].y)}`).join("");
 let s="";
 if(it&&dl)s+=`<path d="${dl}" fill="none" stroke="transparent" stroke-width="${Math.max(14,w+8)}" pointer-events="stroke"/>`;
 s+=`<path d="${dl}" fill="none" stroke="${col}" stroke-width="${r3(w)}" stroke-linecap="butt" pointer-events="none"/>`;
 let ar="";
 g.arrows.forEach(a=>{
  const t=a.tip,d=a.dir,px=-d.y,py=d.x,hw=S/6;
  if(tick){const L=S*.55,ux=(d.x+px)*.7071,uy=(d.y+py)*.7071;ar+=`M${r3(t.x-ux*L)} ${r3(t.y-uy*L)}L${r3(t.x+ux*L)} ${r3(t.y+uy*L)}`}
  else{const bx=t.x+d.x*S,by=t.y+d.y*S;ar+=`M${r3(t.x)} ${r3(t.y)}L${r3(bx+px*hw)} ${r3(by+py*hw)}L${r3(bx-px*hw)} ${r3(by-py*hw)}Z`}
 });
 if(ar)s+=tick?`<path d="${ar}" fill="none" stroke="${col}" stroke-width="${r3(w*1.6)}" stroke-linecap="butt" pointer-events="none"/>`:`<path d="${ar}" fill="${col}" stroke="${col}" stroke-width="${r3(w*.3)}" stroke-linejoin="miter" pointer-events="none"/>`;
 if(g.text){
  const t=g.text,ff=fontStack(fontCfg("note").f),bw=String(t.str).length*TH*.56+TH*.3;
  s+=`<rect transform="translate(${r3(t.x)},${r3(t.y)}) rotate(${r3(t.ang)})" x="${r3(t.anchor==="middle"?-bw/2:t.anchor==="start"?-TH*.15:-bw+TH*.15)}" y="${r3(-TH*.88)}" width="${r3(bw)}" height="${r3(TH*1.02)}" fill="${SCH.paper}" stroke="none" pointer-events="none"/>`;
  s+=`<text transform="translate(${r3(t.x)},${r3(t.y)}) rotate(${r3(t.ang)})" text-anchor="${t.anchor}" font-family="${ff}" font-size="${r3(TH)}" fill="${col}" pointer-events="none">${esc(t.str)}</text>`;
  if(it){const tw=String(t.str).length*TH*.55;s+=`<rect transform="translate(${r3(t.x)},${r3(t.y)}) rotate(${r3(t.ang)})" x="${t.anchor==="middle"?-tw/2:t.anchor==="start"?0:-tw}" y="${r3(-TH)}" width="${r3(tw)}" height="${r3(TH*1.3)}" fill="transparent" pointer-events="all"/>`}
 }
 return s;
}

/* ============ HATCH (mặt cắt) — sinh bằng nét thẳng để xuất vector ============ */
function hatchSegs(h){
 const rings=[h.pts,...(h.rings||[])];if(h.hpat==="solid")return[];
 const dirs=h.hpat==="cross"?[h.ha||0,(h.ha||0)+90]:[h.ha||0],segs=[];
 let sp=Math.max(2,+h.hs||24);
 const b=shapeBox(h),diag=Math.hypot(b.x1-b.x0,b.y1-b.y0);if(diag/sp>1200)sp=diag/1200;
 dirs.forEach(deg=>{
  const a=-deg*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),R=rings.map(r=>r.map(p=>({x:p.x*ca-p.y*sa,y:p.x*sa+p.y*ca})));
  let y0=1e18,y1=-1e18;R.forEach(r=>r.forEach(p=>{y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}));
  const bk=-a,cb=Math.cos(bk),sb=Math.sin(bk);
  for(let y=Math.ceil(y0/sp)*sp+sp*.0001;y<y1;y+=sp){
   const xs=[];R.forEach(r=>{for(let i=0,j=r.length-1;i<r.length;j=i++){const p=r[j],q=r[i];if((p.y<=y&&q.y>y)||(q.y<=y&&p.y>y))xs.push(p.x+(y-p.y)/(q.y-p.y)*(q.x-p.x))}});
   xs.sort((m,n)=>m-n);
   for(let i=0;i+1<xs.length;i+=2){if(xs[i+1]-xs[i]<.05)continue;segs.push([{x:xs[i]*cb-y*sb,y:xs[i]*sb+y*cb},{x:xs[i+1]*cb-y*sb,y:xs[i+1]*sb+y*cb}])}
  }
 });
 return segs;
}
function hatchMarkup(h,it){
 const col=shCol(h.col),w=h.sw*RS.lwk,ring=r=>"M"+r.map(p=>r3(p.x)+" "+r3(p.y)).join("L")+"Z";
 const outline=[h.pts,...(h.rings||[])].map(ring).join("");
 let s="";
 if(h.hpat==="solid")s+=`<path d="${outline}" fill-rule="evenodd" fill="${BW?"#9ca3af":col}" fill-opacity="${h.fo!=null&&h.fill?h.fo:1}" stroke="none" pointer-events="none"/>`;
 else{
  if(h.fill)s+=`<path d="${outline}" fill-rule="evenodd" fill="${BW?"#e5e7eb":h.fill}" fill-opacity="${h.fo}" stroke="none" pointer-events="none"/>`;
  const sg=hatchSegs(h),d=sg.map(l=>`M${r3(l[0].x)} ${r3(l[0].y)}L${r3(l[1].x)} ${r3(l[1].y)}`).join("");
  if(d){if(it)s+=`<path d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(10,w+6)}" pointer-events="stroke"/>`;s+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(w)}" stroke-linecap="butt" pointer-events="none"/>`}
 }
 if(it&&h.hpat==="solid")s+=`<path d="${outline}" fill-rule="evenodd" fill="transparent" pointer-events="visiblePainted"/>`;
 return s;
}

/* ============ BẮT ĐIỂM / ĐIỂM THEO TOẠ ĐỘ (dùng chung cho kéo điểm điều khiển) ============ */
function ptSnap(ev){const w=worldPt(ev);if(cadOn())return cadSnapPoint(w,null,ev).p;return{x:sn(w.x),y:sn(w.y)}}
