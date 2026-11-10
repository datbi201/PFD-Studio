/* ============ MODULE SƠ ĐỒ — VẼ HÌNH KHỐI VÀ ĐƯỜNG NỐI RA SVG ============ */
/* dgMarkup(ui): ui=true → có thuộc tính để chọn bằng chuột; false → SVG sạch dùng cho xuất file */
function dgShade(col,mode){                          /* lighten ≈ lumMod 60% lumOff 40%; dark ≈ lumMod 75% (như Office) */
 if(!col)return"none";
 const r=parseInt(col.slice(1,3),16)/255,g=parseInt(col.slice(3,5),16)/255,b=parseInt(col.slice(5,7),16)/255;
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}
 l=mode==="light"?l*.6+.4:l*.75;
 const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
 let R,G,B;if(!s)R=G=B=l;else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;R=f(p,q,h+1/3);G=f(p,q,h);B=f(p,q,h-1/3)}
 return"#"+[R,G,B].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("").toUpperCase();
}
function dgShapeSvg(sh,ui){
 const P=DG_PRESET[sh.k],w=sh.w,h=sh.h,lwU=sh.lw*DGPT,hasLn=sh.ln&&sh.lw>0;
 const tf=`translate(${_f(sh.x)} ${_f(sh.y)})${sh.rot?` rotate(${_f(sh.rot)} ${_f(w/2)} ${_f(h/2)})`:""}`;
 const fill=sh.fl||"none",fop=sh.fo<1&&sh.fl?` fill-opacity="${_f(sh.fo)}"`:"";
 const stroke=hasLn?` stroke="${sh.ln}" stroke-width="${_f(lwU)}" stroke-linejoin="miter"${sh.ld?` stroke-dasharray="${dashArr(sh.ld,lwU)}"`:""}`:' stroke="none"';
 const pe=ui?' pointer-events="all"':"";
 let o=`<g${ui?` class="dgs" data-did="${esc(sh.id)}"`:""} transform="${tf}">`;
 o+=`<path d="${P.path(w,h,sh.a,sh.b)}" fill="${fill}"${fop}${stroke}${pe}/>`;
 if(P.ex)P.ex(w,h,sh.a,sh.b).forEach(e=>{
  const f=e.fill==="none"||!sh.fl?"none":dgShade(sh.fl,e.fill);
  o+=`<path d="${e.d}" fill="${f}"${f!=="none"?fop:""}${e.stroke&&hasLn?stroke:' stroke="none"'}/>`;
 });
 o+=dgTextSvg(sh);
 return o+"</g>";
}
function dgConnLabelBox(c,pts){
 if(!c.tx)return null;
 const fsU=c.fs*DGPT,wd=dgMeasure(c.tx,c.ff,c.fb,false,fsU),fm=dgFont(c.ff),p=dgAtFrac(pts,c.lp);
 const pad=fsU*.3,bw=wd+pad*2,bh=(fm[2]+fm[3])*fsU+pad;
 return{cx:p.x,cy:p.y,x:p.x-bw/2,y:p.y-bh/2,w:bw,h:bh,tw:wd,fsU,base:p.y+(fm[2]-fm[3])*fsU/2};
}
function dgConnSvg(c,m,ui){
 const R=dgRoute(c,m),lwU=c.lw*DGPT,pts=R.pts.map(p=>p.slice());
 const n=pts.length,st=R.d?null:null;
 const insS=dgArrowInset(c.as,c.lw),insE=dgArrowInset(c.ae,c.lw);
 const aS=Math.atan2(R.pts[0][1]-R.pts[1][1],R.pts[0][0]-R.pts[1][0]),aE=Math.atan2(R.pts[n-1][1]-R.pts[n-2][1],R.pts[n-1][0]-R.pts[n-2][0]);
 const shorten=(i,j,k)=>{const dx=pts[j][0]-pts[i][0],dy=pts[j][1]-pts[i][1],l=Math.hypot(dx,dy);if(k>0&&l>k+.5){pts[i][0]+=dx/l*k;pts[i][1]+=dy/l*k}};
 let d;
 if(R.d)d=R.d;else{shorten(0,1,insS);shorten(n-1,n-2,insE);d="M"+pts.map(p=>_f(p[0])+" "+_f(p[1])).join("L")}
 const dash=c.ld?` stroke-dasharray="${dashArr(c.ld,lwU)}"`:"";
 let o=`<g${ui?` class="dgc" data-cid="${esc(c.id)}"`:""}>`;
 if(ui)o+=`<path d="${d}" fill="none" stroke="transparent" stroke-width="${_f(Math.max(lwU,12))}" pointer-events="stroke"/>`;
 o+=`<path d="${d}" fill="none" stroke="${c.ln}" stroke-width="${_f(lwU)}" stroke-linejoin="miter" stroke-linecap="butt"${dash}/>`;
 o+=dgArrowSvg(c.as,R.pts[0][0],R.pts[0][1],aS,c.lw,c.ln)+dgArrowSvg(c.ae,R.pts[n-1][0],R.pts[n-1][1],aE,c.lw,c.ln);
 const lb=dgConnLabelBox(c,R.pts);
 if(lb){
  if(c.bg)o+=`<rect x="${_f(lb.x)}" y="${_f(lb.y)}" width="${_f(lb.w)}" height="${_f(lb.h)}" fill="#FFFFFF"/>`;
  o+=`<text x="${_f(lb.cx-lb.tw/2)}" y="${_f(lb.base)}" font-family="${esc(dgFont(c.ff)[1].replace(/"/g,"'"))}" font-size="${_f(lb.fsU)}"${c.fb?' font-weight="700"':''} fill="${c.fc}" xml:space="preserve">${esc(c.tx)}</text>`;
 }
 return o+"</g>";
}
function dgMarkup(ui){
 const d=state.dg;if(!d||(!d.shapes.length&&!d.conns.length))return"";
 const m=dgById(d.shapes);
 return`<g id="${ui?"dgContent":"dgExport"}">`+d.shapes.map(s=>dgShapeSvg(s,ui)).join("")+d.conns.map(c=>dgConnSvg(c,m,ui)).join("")+"</g>";
}
/* khung bao nội dung sơ đồ (chưa cộng lề) */
function dgBBox(){
 const d=state.dg;if(!d||(!d.shapes.length&&!d.conns.length))return null;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const up=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)};
 d.shapes.forEach(s=>{const b=dgShapeBBox(s),e=s.lw*DGPT/2+1;up(b.x0-e,b.y0-e);up(b.x1+e,b.y1+e)});
 const m=dgById(d.shapes);
 d.conns.forEach(c=>{const R=dgRoute(c,m),e=c.lw*DGPT*2+6;R.pts.forEach(p=>{up(p[0]-e,p[1]-e);up(p[0]+e,p[1]+e)});
  const lb=dgConnLabelBox(c,R.pts);if(lb){up(lb.x,lb.y);up(lb.x+lb.w,lb.y+lb.h)}});
 return{x0,y0,x1,y1};
}
/* vẽ lên bảng + lớp chọn (do tệp UI cung cấp dgOverlay) */
function renderDg(){
 const g=document.getElementById("gDg");if(!g)return;
 if(!dgOn()){g.innerHTML="";return}
 const b=dgBBox(),pad=state.meta.dg.pad;
 let paper="";
 if(b)paper=`<rect class="dgpaper" x="${_f(b.x0-pad)}" y="${_f(b.y0-pad)}" width="${_f(b.x1-b.x0+2*pad)}" height="${_f(b.y1-b.y0+2*pad)}" fill="#FFFFFF" stroke="#C8C8C8" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
 g.innerHTML=paper+dgMarkup(true)+(typeof dgOverlay==="function"?dgOverlay():"");
}
/* hình thu nhỏ trong thư viện */
function dgThumb(k){
 const P=DG_PRESET[k],st=dgStyle(P.sty||"s8"),sc=Math.min(44/P.w,28/P.h,1),w=P.w*sc,h=P.h*sc;
 const sh={id:"t",k,x:2,y:2,w,h,rot:0,a:P.adj,b:P.adj2,fl:P.noFill?"":st.fl,ln:P.noFill&&!P.dashed?"":st.ln,lw:1,ld:P.dashed?"dash":"",fo:1,tx:"",ff:"Arial",fs:8,fb:false,fi:false,fu:false,fc:st.fc,ta:"c",tv:"m",mg:[0,0,0,0],af:false,ls:1,ps:0};
 return`<svg viewBox="0 0 ${_f(w+4)} ${_f(h+4)}" width="${_f(w+4)}" height="${_f(h+4)}" aria-hidden="true">${dgShapeSvg(sh,false).replace(/stroke-width="[\d.]+"/g,'stroke-width="1.4"')}</svg>`;
}
