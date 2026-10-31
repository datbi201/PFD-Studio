/* ============ KHUNG CHỮ ============ */
function textStyle(n){
 const b=fontCfg("note");
 return{ff:fontStack(n.ff||b.f),fz:+n.fz||b.s,w:n.b===false?400:(n.b?800:650),it:!!n.i,col:n.col||SCH.ink,al:n.al||"c"};
}
function textDef(n){
 const st=textStyle(n),fu=st.fz/PTU*RS.fk,lines=String(n.title||"").split("\n");
 const mx=Math.max(2,...lines.map(l=>l.length));
 return{w:Math.max(40,Math.ceil(mx*fu*.58+18)),h:Math.max(24,Math.ceil(lines.length*fu*1.28+10)),ports:[],body:""};
}
function trunc(s,n){s=String(s??"");return s.length>n?s.slice(0,Math.max(1,n-1))+"…":s}
function fitSize(txt,size,maxw,minK){const need=String(txt).length*size*.56;if(need<=maxw)return size;return Math.max(size*(minK||.55),size*maxw/need)}

/* ============ VẼ THIẾT BỊ ============ */
function titleHidden(n){return !!n.ht||state.meta.showTitles===false}
function nodeMarkup(n,it){
 const def=symDef(n),sy=SYMBOLS[n.type],isText=n.type==="text",isArea=n.type==="area";
 const sc=isArea?1:(n.sc||1),fx=(n.flip&&!isText)?-1:1,rot=n.rot||0,selected=it&&sel.has(n.id);
 let inner="";
 if(isText){
  const st=textStyle(n),lines=String(n.title||"").split("\n"),fu=st.fz/PTU*RS.fk,lh=fu*1.28;
  const x=st.al==="l"?-def.w/2+9:st.al==="r"?def.w/2-9:0,anc=st.al==="l"?"start":st.al==="r"?"end":"middle";
  inner=(n.bg||n.bd||it?`<rect x="${-def.w/2}" y="${-def.h/2}" width="${def.w}" height="${def.h}" rx="3" fill="${n.bg?n.bg:(it?SCH.hit:"none")}" fill-opacity="${n.bg?1:(it?.01:0)}"${n.bd?` stroke="${SCH.ink}" stroke-width="${r3(1.4*RS.lwk)}"`:""}/>`:"")+
   lines.map((l,i)=>`<text x="${r3(x)}" y="${r3(-def.h/2+5+fu*1.0+i*lh)}" text-anchor="${anc}" font-family="${st.ff}" font-size="${r3(fu)}" font-weight="${st.w}"${st.it?' font-style="italic"':""} fill="${st.col}">${esc(l)}</text>`).join("");
 }else if(isArea){
  inner=`<rect x="${-def.w/2}" y="${-def.h/2}" width="${def.w}" height="${def.h}" fill="none" stroke="${SCH.sub3}" stroke-width="${r3(2*RS.lwk)}" stroke-dasharray="14 6 3 6"/>`+(it?`<rect x="${-def.w/2}" y="${-def.h/2}" width="${def.w}" height="${def.h}" fill="none" stroke="transparent" stroke-width="18" pointer-events="stroke"/>`:"")+`<text x="${-def.w/2+10}" y="${-def.h/2+FU("note")*1.1}" font-family="${FF("note")}" font-size="${r3(FU("note")*.95)}" font-weight="700" fill="${SCH.sub3}">${esc(n.title)}</text>`;
 }else inner=sym(def.body,sc);
 let m=`<g class="node${selected?" selected":""}" data-id="${n.id}" transform="translate(${n.x},${n.y})">`;
 m+=`<g transform="rotate(${rot}) scale(${fx*sc},${sc})">${inner}${it?`<rect class="selbox" x="${-def.w/2-6}" y="${-def.h/2-6}" width="${def.w+12}" height="${def.h+12}" rx="6"/>`:""}</g>`;
 if(!isText&&!isArea&&!sy.nolabel){
  const q=rot%180,hh=(q?def.w:def.h)/2*sc,hw=(q?def.h:def.w)/2*sc,ls=n.ls||1,rows=[];
  if(sy.bub){
   const mm=/^([^-]*)-?(.*)$/.exec(n.tag||"")||["","",""],bs=10*sc;
   m+=`<text x="0" y="${r3(-3*sc)}" text-anchor="middle" font-family="${FF("tag")}" font-size="${r3(bs)}" font-weight="700" fill="${SCH.ink}">${esc(mm[1])}</text><text x="0" y="${r3(11*sc)}" text-anchor="middle" font-family="${FF("tag")}" font-size="${r3(bs)}" fill="${SCH.ink}">${esc(mm[2])}</text>`;
  }else if(n.tag)rows.push([n.tag,FU("tag")*ls,700,SCH.ink,FF("tag")]);
  if(n.title&&!titleHidden(n))rows.push([n.title,FU("desc")*ls,400,SCH.sub1,FF("desc")]);
  if(state.meta.showProps&&n.props)String(n.props).split("\n").slice(0,8).forEach(l=>{if(l.trim())rows.push([l,FU("props")*ls,400,SCH.sub2,FF("props")])});
  if(rows.length){
   const lp=n.lp||"b",Hb=rows.reduce((a,r)=>a+r[1]*1.22,0);let x,top,anc;
   if(lp==="b"){x=0;top=hh+5;anc="middle"}else if(lp==="t"){x=0;top=-hh-5-Hb;anc="middle"}
   else if(lp==="r"){x=hw+8;top=-Hb/2;anc="start"}else{x=-hw-8;top=-Hb/2;anc="end"}
   let y=top;rows.forEach(r=>{const bl=y+r[1]*.98;m+=`<text x="${r3(x)}" y="${r3(bl)}" text-anchor="${anc}" font-family="${r[4]}" font-size="${r3(r[1])}" font-weight="${r[2]}" fill="${r[3]}">${esc(r[0])}</text>`;y+=r[1]*1.22});
  }
  (n.xp||[]).forEach(p=>{
   if(!p.l)return;const q=portRel(n,p.id),fs=FU("svc")*.82,o=7+fs*.2,dv=DIRV[q.d];
   const tx=q.x+dv[0]*o,ty=q.y+dv[1]*o+(q.d==="s"?fs:q.d==="n"?-2:fs*.35);
   m+=`<text x="${r3(tx)}" y="${r3(ty)}" text-anchor="${q.d==="e"?"start":q.d==="w"?"end":"middle"}" font-family="${FF("svc")}" font-size="${r3(fs)}" font-weight="600" fill="${SCH.sub2}">${esc(p.l)}</text>`;
  });
 }
 if(it)symDef(n).ports.forEach(p=>{const q=portRel(n,p.id);m+=`<circle class="port${p.u?" u":""}" cx="${q.x}" cy="${q.y}" r="7" data-node="${n.id}" data-port="${p.id}"${p.u?' data-xp="1"':""}/>`});
 return m+"</g>";
}
function nodesMarkup(it){return[...state.nodes].filter(layVis).sort((a,b)=>(a.type==="area"?0:1)-(b.type==="area"?0:1)).map(n=>nodeMarkup(n,it)).join("")}

/* ============ VẼ ĐƯỜNG ỐNG ============ */
function edgeSpecText(e){
 const m=state.meta;
 if(isTransport(e)){return[e.service,e.flow,e.dist].filter(Boolean).join("  •  ")}
 if(e.kind==="shaft"||e.kind==="signal")return e.service||"";
 let sp=pipeSpecText(e,m.pipeLabel,m.units,matShort(e));
 if(m.pipeLabel==="full"&&e.cls)sp+=(sp?" • ":"")+e.cls;
 return[e.service,sp].filter(Boolean).join("  •  ");
}
function edgesMarkup(it){
 let out="";
 const geoms=allGeoms(),hopsMap=computeHops(geoms);
 for(const e of state.edges){
  const g=geoms.get(e.id);if(!g)continue;
  const col=edgeColor(e),isSig=e.kind==="signal",base=(isSig?Math.max(1.4,RS.edge-.8):RS.edge)*(e.wt||1);
  const d=pathFrom(g.pts,7,hopsMap.get(e.id)),isSel=it&&selEdge===e.id;
  out+=`<g data-edge="${e.id}">`;
  if(it){out+=`<path d="${d}" fill="none" stroke="transparent" stroke-width="16" pointer-events="stroke"/>`;if(isSel)out+=`<path d="${d}" fill="none" stroke="#1677ff" stroke-opacity=".35" stroke-width="${base*2+8}" pointer-events="none"/>`}
  const mk=`marker-end="url(#arr${hex6(col)})"`;
  if(e.kind==="shaft")out+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(base*2.8)}" pointer-events="none"/><path d="${d}" fill="none" stroke="${SCH.paper}" stroke-width="${r3(base*1.1)}" pointer-events="none"/>`;
  else if(e.kind==="road")out+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(base*2.4)}" stroke-linejoin="round" pointer-events="none"/><path d="${d}" fill="none" stroke="${SCH.paper}" stroke-width="${r3(base*.7)}" stroke-dasharray="${r3(base*4)} ${r3(base*3)}" pointer-events="none"/><path d="${d}" fill="none" stroke="transparent" ${mk} pointer-events="none"/>`;
  else if(e.kind==="rail")out+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(base*2.2)}" pointer-events="none"/><path d="${d}" fill="none" stroke="${SCH.paper}" stroke-width="${r3(base*1.5)}" stroke-dasharray="${r3(base*1.8)} ${r3(base*3.2)}" pointer-events="none"/><path d="${d}" fill="none" stroke="transparent" ${mk} pointer-events="none"/>`;
  else if(e.kind==="sea")out+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(base*1.4)}" stroke-dasharray="${r3(base*7)} ${r3(base*3)}" ${mk} pointer-events="none"/>`;
  else out+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${r3(base)}"${e.kind==="dashed"?` stroke-dasharray="9 5"`:isSig?` stroke-dasharray="2 4"`:""} ${mk} pointer-events="none"/>`;
  let bi=0,bl=-1;for(let i=0;i<g.pts.length-1;i++){const l=Math.hypot(g.pts[i+1].x-g.pts[i].x,g.pts[i+1].y-g.pts[i].y);if(l>bl){bl=l;bi=i}}
  const p=g.pts[bi],q=g.pts[bi+1];
  if(p&&q){
   const mx=(p.x+q.x)/2,my=(p.y+q.y)/2,horiz=Math.abs(q.y-p.y)<.5,fs=FU("svc"),nfs=FU("num");
   const hasNum=e.num!==""&&e.num!=null&&!isSig&&e.kind!=="shaft",txt=edgeSpecText(e);
   if(txt){
    const w=txt.length*(fs*.56)+10,off=hasNum?nfs+7:8,tx=horiz?mx:mx+(hasNum?nfs+9:8),ty=horiz?my-off:my+4,x0=horiz?tx-w/2:tx-4;
    out+=`<rect x="${r3(x0)}" y="${r3(ty-fs-1)}" width="${r3(w)}" height="${r3(fs+5)}" fill="${SCH.paper}" fill-opacity=".88" rx="3" pointer-events="none"/><text x="${r3(horiz?tx:tx+1)}" y="${r3(ty)}" text-anchor="${horiz?"middle":"start"}" font-family="${FF("svc")}" font-size="${r3(fs)}" fill="${col===SCH.ink?SCH.ink:col}" font-weight="600">${esc(txt)}</text>`;
   }
   if(hasNum){const h=nfs+3;out+=`<path d="M${r3(mx-h)} ${r3(my)} L${r3(mx)} ${r3(my-h)} L${r3(mx+h)} ${r3(my)} L${r3(mx)} ${r3(my+h)} Z" fill="${SCH.fill}" stroke="${col}" stroke-width="${r3(1.6*Math.max(1,RS.lwk*.8))}"/><text x="${r3(mx)}" y="${r3(my+nfs*.35)}" text-anchor="middle" font-family="${FF("num")}" font-size="${r3(nfs)}" font-weight="700" fill="${SCH.ink}">${esc(e.num)}</text>`}
  }
  if(isSel&&g.hx!=null)out+=`<circle data-handle="${e.id}" class="ehandle" cx="${r3(g.hx)}" cy="${r3(g.hy)}" r="8" fill="${SCH.hit}" stroke="#1677ff" stroke-width="2.5"><title>${_("Kéo để dời đoạn ống","Drag to move the pipe segment")}</title></circle>`;
  out+="</g>";
 }
 return out;
}

/* ============ HÌNH VẼ TỰ DO ============ */
const shCol=c=>BW?SCH.ink:(String(c).toLowerCase()===INK?SCH.ink:c);
function smoothPath(pts){
 if(pts.length<3)return pts.map((p,i)=>(i?"L":"M")+r3(p.x)+" "+r3(p.y)).join(" ");
 let d=`M ${r3(pts[0].x)} ${r3(pts[0].y)}`;
 for(let i=1;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];d+=` Q ${r3(a.x)} ${r3(a.y)} ${r3((a.x+b.x)/2)} ${r3((a.y+b.y)/2)}`}
 const l=pts[pts.length-1];return d+` L ${r3(l.x)} ${r3(l.y)}`;
}
function shapeBox(h){
 if(h.t==="path")return vecBox(h);
 if(h.t==="vtext")return vtextBox(h);
 let P=h.pts;
 if(h.t==="circle"){const r=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y);return{x0:P[0].x-r,y0:P[0].y-r,x1:P[0].x+r,y1:P[0].y+r}}
 if(h.t==="arc"){const g=arcGeom(P[0],P[1],P[2]);P=g?arcSample(g,36):P}
 else if(h.t==="dim"&&typeof dimBoxPts==="function")P=dimBoxPts(h);
 const xs=P.map(p=>p.x),ys=P.map(p=>p.y);
 return{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};
}
function shapeGeomEl(h,attrs){
 if(h.t==="path")return`<path d="${vecD(h)}" ${attrs}/>`;
 if(h.t==="vtext")return"";
 const b=shapeBox(h);
 if(h.t==="rect")return`<rect x="${r3(b.x0)}" y="${r3(b.y0)}" width="${r3(b.x1-b.x0)}" height="${r3(b.y1-b.y0)}" rx="${h.rx||0}" ${attrs}/>`;
 if(h.t==="ellipse")return`<ellipse cx="${r3((b.x0+b.x1)/2)}" cy="${r3((b.y0+b.y1)/2)}" rx="${r3((b.x1-b.x0)/2)}" ry="${r3((b.y1-b.y0)/2)}" ${attrs}/>`;
 if(h.t==="circle"){const r=Math.hypot(h.pts[1].x-h.pts[0].x,h.pts[1].y-h.pts[0].y);return`<circle cx="${r3(h.pts[0].x)}" cy="${r3(h.pts[0].y)}" r="${r3(r)}" ${attrs}/>`}
 if(h.t==="arc"){const g=arcGeom(h.pts[0],h.pts[1],h.pts[2]);if(g)return`<path d="M ${r3(h.pts[0].x)} ${r3(h.pts[0].y)} A ${r3(g.r)} ${r3(g.r)} 0 ${g.large} ${g.sweep} ${r3(h.pts[2].x)} ${r3(h.pts[2].y)}" ${attrs}/>`;return`<path d="M ${r3(h.pts[0].x)} ${r3(h.pts[0].y)} L ${r3(h.pts[2].x)} ${r3(h.pts[2].y)}" ${attrs}/>`}
 let d;
 if(h.t==="pen")d=smoothPath(h.pts);
 else d=h.pts.map((p,i)=>(i?"L":"M")+r3(p.x)+" "+r3(p.y)).join(" ")+(h.closed&&h.t==="poly"?" Z":"");
 return`<path d="${d}" ${attrs}/>`;
}
function selDeco(h){
 let s="";
 const b=shapeBox(h),hr=Math.max(5,8/view.k);
 s+=`<rect x="${r3(b.x0-4)}" y="${r3(b.y0-4)}" width="${r3(b.x1-b.x0+8)}" height="${r3(b.y1-b.y0+8)}" fill="none" stroke="#1677ff" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
 if(sel.size===1){
  if(h.t==="rect"||h.t==="ellipse"){[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].forEach((c,i)=>{s+=`<circle class="shh" data-sh="${h.id}" data-pi="c${i}" cx="${r3(c[0])}" cy="${r3(c[1])}" r="${r3(hr)}"/>`})}
  /* path: điểm neo + tay cầm do overlay của module Vector vẽ (js/96_vec.js), không vẽ ở đây */
  else if(h.t!=="pen"&&h.t!=="path"&&h.t!=="vtext"&&Array.isArray(h.pts)){h.pts.forEach((p,i)=>{s+=`<circle class="shh" data-sh="${h.id}" data-pi="${i}" cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(hr)}"/>`})}
 }
 return s;
}
function shapeMarkup(h,it){
 if(it&&typeof layLock==="function"&&layLock(h))it=false;
 const sl=it&&sel.has(h.id);
 /* Rev.6 — chữ vector: khung bao + xoay/lật do vtextMarkup (js/98_vecui.js) vẽ */
 if(h.t==="vtext"){
  const inner=(typeof vtextMarkup==="function")?vtextMarkup(h,it):"";
  return`<g class="shp${sl?" selected":""}" data-shape="${h.id}">${inner}</g>`;
 }
 if(h.t==="dim"||h.t==="hatch"){
  const inner=h.t==="dim"?dimMarkup(h,it):hatchMarkup(h,it);
  return`<g class="shp${sl?" selected":""}" data-shape="${h.id}">${inner}${sl?selDeco(h):""}</g>`;
 }
 const w=h.sw*RS.lwk,col=shCol(h.col),closedKind=h.t==="path"?!!h.closed:(h.t==="rect"||h.t==="ellipse"||h.t==="circle"||(h.t==="poly"&&h.closed));
 const fill=closedKind&&h.fill?`fill="${BW?"#e5e7eb":h.fill}" fill-opacity="${h.fo}"`:`fill="none"`;
 const da=dashArr(h.dash,w);
 let ah="";
 if(!closedKind&&h.ah&&h.t!=="arc"){const id=`url(#sa${hex6(h.col)})`;ah=` marker-end="${id}"`+(h.ah===2?` marker-start="${id}"`:"")}
 let s=`<g class="shp${sl?" selected":""}" data-shape="${h.id}">`;
 if(it){
  /* Rev.6: path kín thì bấm được cả BÊN TRONG (kể cả khi chưa tô màu) — dễ chọn hơn nhiều
     so với chỉ bấm đúng nét. Các loại shape cũ giữ nguyên hành vi. */
  const hitFill=(closedKind&&(h.fill||h.t==="path"))?"fill=\"transparent\" pointer-events=\"visiblePainted\"":"fill=\"none\" pointer-events=\"stroke\"";
  s+=shapeGeomEl(h,`${hitFill} stroke="transparent" stroke-width="${Math.max(14,w+8)}"`);
 }
 s+=shapeGeomEl(h,`${fill} stroke="${col}" stroke-width="${r3(w)}"${da?` stroke-dasharray="${da}"`:""} stroke-linecap="round" stroke-linejoin="round"${ah} pointer-events="none"`);
 if(sl)s+=selDeco(h);
 return s+"</g>";
}
const shapesMarkup=(z,it)=>state.shapes.filter(h=>h.z===z&&layVis(h)).map(h=>shapeMarkup(h,it)).join("");
/* làm gọn nét bút: Ramer–Douglas–Peucker */
function rdp(pts,eps){
 if(pts.length<3)return pts.slice();
 const a=pts[0],b=pts[pts.length-1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;let mi=0,md=0;
 for(let i=1;i<pts.length-1;i++){const d=Math.abs((pts[i].x-a.x)*dy-(pts[i].y-a.y)*dx)/L;if(d>md){md=d;mi=i}}
 if(md<=eps)return[a,b];
 const l=rdp(pts.slice(0,mi+1),eps),r=rdp(pts.slice(mi),eps);return l.slice(0,-1).concat(r);
}

/* ============ KHỔ GIẤY · KHUNG TÊN THEO MẪU ============ */
const TBL={owner:["Công ty / Chủ sở hữu","Company / Owner"],client:["Chủ đầu tư","Client"],project:["Dự án / Hệ thống","Project / System"],title:["Tiêu đề bản vẽ","Drawing title"],docNo:["Số bản vẽ","Drawing No."],rev:["Rev.","Rev."],drawn:["Người vẽ","Drawn by"],checked:["Kiểm tra","Checked by"],approved:["Phê duyệt","Approved by"],date:["Ngày","Date"],scale:["Tỷ lệ","Scale"],size:["Khổ giấy","Size"],sheet:["Tờ / tổng","Sheet / of"],type:["Loại tài liệu","Document type"],units:["Đơn vị","Units"],code:["Mã dự án","Project code"],dwg:["SỐ BẢN VẼ","DWG NO."],legend:["Chú thích màu:","Colour legend:"],revT:["REV.","REV."],revD:["Ngày","Date"],revDesc:["Nội dung thay đổi","Description"],revBy:["Vẽ","By"],revChk:["Kiểm","Chk"],revApp:["Duyệt","App"]};
function tbLang(){const l=state.meta.tbLang;return l==="vi"||l==="en"?l:LANG}
const tbL=k=>TBL[k][tbLang()==="en"?1:0];
function tbVal(f){
 const m=state.meta,sh=SHEETS[m.sheet]||SHEETS.A3;
 switch(f){
  case"size":return m.sheet.replace("_"," ")+(m.orient==="portrait"?" ▯":"");
  case"sheetOf":return(m.sheetNo||"1")+" / "+(m.sheetOf||"1");
  case"units":return m.units==="US"?"US customary":"SI";
  case"sheetUnits":return m.sheet.replace("_"," ")+" • "+(m.units==="US"?"US":"SI");
  default:return m[f]??"";
 }
}
const TB_SIMPLE={w:560,h:150,cells:[
 {x0:0,x1:1,y:0,h:74,l:"",f:"title",sub:"project",big:1},
 {x0:0,x1:.25,y:74,h:38,l:"rev",f:"rev"},{x0:.25,x1:.607,y:74,h:38,l:"docNo",f:"docNo"},{x0:.607,x1:1,y:74,h:38,l:"date",f:"date"},
 {x0:0,x1:.5,y:112,h:38,l:"drawn",f:"drawnBy"},{x0:.5,x1:1,y:112,h:38,l:"size",f:"sheetUnits"}]};
const TB_ISO={w:720,h:224,cells:[
 {x0:0,x1:.42,y:0,h:56,l:"owner",f:"company"},{x0:.42,x1:1,y:0,h:56,l:"project",f:"project"},
 {x0:0,x1:.72,y:56,h:84,l:"title",f:"title",big:1},{x0:.72,x1:1,y:56,h:84,l:"docNo",f:"docNo",bold:1},
 {x0:0,x1:.25,y:140,h:42,l:"drawn",f:"drawnBy"},{x0:.25,x1:.5,y:140,h:42,l:"checked",f:"checkedBy"},{x0:.5,x1:.75,y:140,h:42,l:"approved",f:"approvedBy"},{x0:.75,x1:1,y:140,h:42,l:"date",f:"date"},
 {x0:0,x1:.14,y:182,h:42,l:"rev",f:"rev"},{x0:.14,x1:.34,y:182,h:42,l:"scale",f:"scaleTxt"},{x0:.34,x1:.5,y:182,h:42,l:"size",f:"size"},{x0:.5,x1:.68,y:182,h:42,l:"sheet",f:"sheetOf"},{x0:.68,x1:1,y:182,h:42,l:"type",f:"docType"}]};
const TB_ANSI={w:640,h:252,cells:[
 {x0:0,x1:1,y:0,h:56,l:"owner",f:"company"},
 {x0:0,x1:1,y:56,h:72,l:"title",f:"title",big:1},
 {x0:0,x1:.25,y:128,h:40,l:"drawn",f:"drawnBy"},{x0:.25,x1:.5,y:128,h:40,l:"checked",f:"checkedBy"},{x0:.5,x1:.75,y:128,h:40,l:"approved",f:"approvedBy"},{x0:.75,x1:1,y:128,h:40,l:"date",f:"date"},
 {x0:0,x1:.12,y:168,h:46,l:"size",f:"size"},{x0:.12,x1:.42,y:168,h:46,l:"code",f:"project"},{x0:.42,x1:.8,y:168,h:46,l:"dwg",f:"docNo",bold:1},{x0:.8,x1:1,y:168,h:46,l:"rev",f:"rev"},
 {x0:0,x1:.3,y:214,h:38,l:"scale",f:"scaleTxt"},{x0:.3,x1:.55,y:214,h:38,l:"units",f:"units"},{x0:.55,x1:1,y:214,h:38,l:"sheet",f:"sheetOf"}]};
const TB_EPC={w:0,h:190,cells:[
 {x0:0,x1:.2,y:0,h:64,l:"owner",f:"company",bold:1},{x0:.2,x1:.45,y:0,h:64,l:"client",f:"client"},{x0:.45,x1:1,y:0,h:64,l:"project",f:"project"},
 {x0:0,x1:.62,y:64,h:72,l:"title",f:"title",big:1},{x0:.62,x1:.88,y:64,h:72,l:"docNo",f:"docNo",bold:1},{x0:.88,x1:1,y:64,h:72,l:"rev",f:"rev",bold:1},
 {x0:0,x1:.12,y:136,h:54,l:"drawn",f:"drawnBy"},{x0:.12,x1:.24,y:136,h:54,l:"checked",f:"checkedBy"},{x0:.24,x1:.36,y:136,h:54,l:"approved",f:"approvedBy"},{x0:.36,x1:.48,y:136,h:54,l:"date",f:"date"},{x0:.48,x1:.58,y:136,h:54,l:"scale",f:"scaleTxt"},{x0:.58,x1:.66,y:136,h:54,l:"size",f:"size"},{x0:.66,x1:.78,y:136,h:54,l:"sheet",f:"sheetOf"},{x0:.78,x1:.88,y:136,h:54,l:"units",f:"units"},{x0:.88,x1:1,y:136,h:54,l:"type",f:"docType"}]};
const TEMPLATES={simple:["Đơn giản (như Rev.3)","Simple (as Rev.3)"],iso:["ISO 5457 / ISO 7200 (khung tên 180 mm, lưới vùng)","ISO 5457 / ISO 7200 (180 mm title block, zone grid)"],ansi:["US — ASME Y14.1 (viền 0.5 in, vùng số/chữ)","US — ASME Y14.1 (0.5 in border, zone grid)"],epc:["EPC dầu khí (khung tên ngang toàn khổ)","Oil & gas EPC (full-width title strip)"],frame:["Chỉ khung viền (không khung tên)","Border only (no title block)"]};

function sheetLayout(){
 const m=state.meta,[W,H]=sheetDim(),t=m.template;let mg={l:20,t:20,r:20,b:20},tbd=null;
 if(t==="iso"){mg={l:80,t:40,r:40,b:40};tbd=TB_ISO}
 else if(t==="ansi"){mg={l:50.8,t:50.8,r:50.8,b:50.8};tbd=TB_ANSI}
 else if(t==="epc"){mg={l:40,t:40,r:40,b:40};tbd=TB_EPC}
 else if(t==="frame"){mg={l:40,t:40,r:40,b:40}}
 else tbd=TB_SIMPLE;
 const fx0=mg.l,fy0=mg.t,fx1=W-mg.r,fy1=H-mg.b;
 let tb=null,rev=null;
 if(tbd){const w=tbd.w||(fx1-fx0);tb={def:tbd,x:fx1-w,y:fy1-tbd.h,w,h:tbd.h}}
 if(tb&&(t==="iso"||t==="ansi"||t==="epc")&&m.revs.length){
  const rows=Math.min(8,m.revs.length),rh=22,rw=t==="epc"?Math.min(tb.w,640):tb.w;
  rev={x:fx1-rw,y:tb.y-(rows+1)*rh,w:rw,h:(rows+1)*rh,rows,rh};
 }
 const used=[...new Set(state.edges.map(e=>e.phase).filter(Boolean))],leg=m.colorByPhase&&used.length>0&&m.legendPos!=="off";
 const lp=m.legendPos||"bl",legTop=leg&&(lp==="tl"||lp==="tr"),legBot=leg&&(lp==="bl"||lp==="br");
 const nrow=m.showTable?streamRows().length:0,tblTop=nrow?fy1-12-(nrow+1)*FU("table")*1.9:null;
 const top=fy0+(legTop?58:28);let bottom=(rev?rev.y:(tb?tb.y:fy1))-18;
 const lh=FU("legend")*1.5+8;let legY=null;
 if(legBot){const base=lp==="bl"?(tblTop!=null?tblTop:fy1-6):((rev?rev.y:(tb?tb.y:fy1)));legY=base-8;bottom=Math.min(bottom,legY-lh-10)}
 else if(legTop)legY=fy0+FU("legend")*1.5+6;
 return{W,H,mg,fx0,fy0,fx1,fy1,tb,rev,used,leg,lp,legY,tblTop,use:{l:fx0+28,t:top,r:fx1-28,b:bottom}};
}
function tbMarkup(tb){
 const I=SCH.ink;let s=`<rect x="${tb.x}" y="${tb.y}" width="${tb.w}" height="${tb.h}" fill="${SCH.paper}" stroke="${I}" stroke-width="2"/>`;
 const fV=FU("tbC"),fT=FU("tbT"),fL=Math.max(6,fV*.52),ffC=FF("tbC"),ffT=FF("tbT"),m=state.meta;
 tb.def.cells.forEach(c=>{
  const x=tb.x+c.x0*tb.w,w=(c.x1-c.x0)*tb.w,y=tb.y+c.y,h=c.h;
  s+=`<rect x="${r3(x)}" y="${r3(y)}" width="${r3(w)}" height="${h}" fill="none" stroke="${I}" stroke-width="1.3"/>`;
  if(c.l)s+=`<text x="${r3(x+6)}" y="${r3(y+fL+3)}" font-family="${ffC}" font-size="${r3(fL)}" fill="${SCH.sub3}">${esc(tbL(c.l))}</text>`;
  const v=String(tbVal(c.f)||"");
  if(c.big){
   const sz=fitSize(v,fT,w-14,.5),ty=c.l?y+h*.62+sz*.25:y+(c.sub?h*.42:h*.6)+sz*.2;
   s+=`<text x="${r3(x+7)}" y="${r3(ty)}" font-family="${ffT}" font-size="${r3(sz)}" font-weight="700" fill="${I}">${esc(trunc(v,Math.floor((w-12)/(sz*.5))))}</text>`;
   if(c.sub){const sv=String(tbVal(c.sub)||""),ss=fitSize(sv,fV,w-14,.6);s+=`<text x="${r3(x+7)}" y="${r3(y+h*.8)}" font-family="${ffC}" font-size="${r3(ss)}" fill="${SCH.sub1}">${esc(trunc(sv,Math.floor((w-12)/(ss*.5))))}</text>`}
  }else{
   const base=c.bold?fV*1.25:fV,sz=fitSize(v,base,w-12,.5);
   s+=`<text x="${r3(x+7)}" y="${r3(y+h-Math.max(6,h*.22))}" font-family="${ffC}" font-size="${r3(sz)}" font-weight="700" fill="${I}">${esc(trunc(v,Math.floor((w-10)/(sz*.5))))}</text>`;
  }
 });
 return s;
}
function revMarkup(r){
 const I=SCH.ink,m=state.meta,fs=Math.min(FU("tbC")*.85,r.rh*.55),cols=[.1,.2,.68,.78,.89,1];
 let s=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${SCH.paper}" stroke="${I}" stroke-width="1.6"/>`;
 const heads=["revT","revD","revDesc","revBy","revChk","revApp"],x0=[0,.1,.2,.68,.78,.89];
 s+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.rh}" fill="${SCH.grey}" stroke="${I}" stroke-width="1.3"/>`;
 heads.forEach((h,i)=>{s+=`<text x="${r3(r.x+x0[i]*r.w+5)}" y="${r3(r.y+r.rh*.7)}" font-family="${FF("tbC")}" font-size="${r3(fs)}" font-weight="700" fill="${I}">${esc(tbL(h))}</text>`;if(i)s+=`<path d="M${r3(r.x+x0[i]*r.w)} ${r.y} V${r.y+r.h}" stroke="${I}" stroke-width="1"/>`});
 const rows=m.revs.slice(-r.rows);
 rows.forEach((v,i)=>{const y=r.y+r.h-(i+1)*r.rh;s+=`<path d="M${r.x} ${r3(y)} H${r.x+r.w}" stroke="${I}" stroke-width=".8"/>`;
  [v.r,v.date,v.desc,v.by,v.chk,v.app].forEach((t,k)=>{const w=((cols[k]-x0[k])*r.w)-8,sz=fitSize(t,fs,w,.6);s+=`<text x="${r3(r.x+x0[k]*r.w+5)}" y="${r3(y+r.rh*.7)}" font-family="${FF("tbC")}" font-size="${r3(sz)}" fill="${I}">${esc(trunc(t,Math.floor(w/(sz*.5))))}</text>`})});
 return s;
}
function zoneMarkup(L){
 const t=state.meta.template,I=SCH.ink,W=L.W,H=L.H;let s="";
 const fs=Math.min(14,Math.max(8,FU("tbC")*.9)),tf=`font-family="${FF("tbC")}" font-size="${fs}" fill="${I}" text-anchor="middle"`;
 const lab=i=>String.fromCharCode(65+i);
 if(t==="iso"){
  const strip=20,ox0=L.fx0-strip,oy0=L.fy0-strip,ox1=L.fx1+strip,oy1=L.fy1+strip;
  s+=`<rect x="${ox0}" y="${oy0}" width="${ox1-ox0}" height="${oy1-oy0}" fill="none" stroke="${I}" stroke-width="1"/>`;
  const nH=Math.max(2,2*Math.round((L.fx1-L.fx0)/4/100)),nV=Math.max(2,2*Math.round((L.fy1-L.fy0)/4/100));
  const zw=(L.fx1-L.fx0)/nH,zh=(L.fy1-L.fy0)/nV;
  for(let i=0;i<nH;i++){const cx=L.fx0+zw*(i+.5);if(i){const x=L.fx0+zw*i;s+=`<path d="M${r3(x)} ${oy0}V${L.fy0}M${r3(x)} ${L.fy1}V${oy1}" stroke="${I}" stroke-width="1"/>`}s+=`<text ${tf} x="${r3(cx)}" y="${r3(oy0+strip*.7)}">${i+1}</text><text ${tf} x="${r3(cx)}" y="${r3(L.fy1+strip*.7)}">${i+1}</text>`}
  for(let j=0;j<nV;j++){const cy=L.fy0+zh*(j+.5);if(j){const y=L.fy0+zh*j;s+=`<path d="M${ox0} ${r3(y)}H${L.fx0}M${L.fx1} ${r3(y)}H${ox1}" stroke="${I}" stroke-width="1"/>`}s+=`<text ${tf} x="${r3(ox0+strip/2)}" y="${r3(cy+fs*.35)}">${lab(j)}</text><text ${tf} x="${r3(L.fx1+strip/2)}" y="${r3(cy+fs*.35)}">${lab(j)}</text>`}
  const cm=`stroke="${I}" stroke-width="2.4"`;
  s+=`<path d="M${W/2} 0V${r3(oy0+4)}M${W/2} ${H}V${r3(oy1-4)}M0 ${H/2}H${r3(ox0+4)}M${W} ${H/2}H${r3(ox1-4)}" ${cm}/>`;
 }else if(t==="ansi"){
  const nH=Math.max(2,2*Math.round((L.fx1-L.fx0)/101.6/5)),nV=Math.max(2,2*Math.round((L.fy1-L.fy0)/101.6/5));
  const zw=(L.fx1-L.fx0)/nH,zh=(L.fy1-L.fy0)/nV,m=L.mg.l;
  for(let i=0;i<nH;i++){const cx=L.fx1-zw*(i+.5),n=i+1;if(i){const x=L.fx1-zw*i;s+=`<path d="M${r3(x)} ${L.fy0-m*.4}V${L.fy0}M${r3(x)} ${L.fy1}V${L.fy1+m*.4}" stroke="${I}" stroke-width="1"/>`}s+=`<text ${tf} x="${r3(cx)}" y="${r3(L.fy0-m*.4+fs*.9-1)}">${n}</text><text ${tf} x="${r3(cx)}" y="${r3(L.fy1+m*.4+fs*.9-1)}">${n}</text>`}
  for(let j=0;j<nV;j++){const cy=L.fy1-zh*(j+.5);if(j){const y=L.fy1-zh*j;s+=`<path d="M${L.fx0-m*.4} ${r3(y)}H${L.fx0}M${L.fx1} ${r3(y)}H${L.fx1+m*.4}" stroke="${I}" stroke-width="1"/>`}s+=`<text ${tf} x="${r3(L.fx0-m*.2)}" y="${r3(cy+fs*.35)}">${lab(j)}</text><text ${tf} x="${r3(L.fx1+m*.2)}" y="${r3(cy+fs*.35)}">${lab(j)}</text>`}
 }
 return s;
}
function tableMarkup(L){
 const rows=streamRows();if(!rows.length)return"";
 const I=SCH.ink,fz=FU("table"),rh=fz*1.9,base=[44,190,150,130,70,70,110],tot=base.reduce((a,b)=>a+b,0);
 const availR=L.tb?L.tb.x-14:L.fx1-14,avail=Math.max(120,availR-L.fx0-20),f=Math.min(1,avail/tot),cw=base.map(v=>v*f),W=tot*f,th=(rows.length+1)*rh,x0=L.fx0+20,ty=L.fy1-12-th;
 const ff=FF("table"),nm=id=>nodeName(id),tr=(v,i)=>trunc(v,Math.floor(cw[i]/(fz*.55)));
 let s=`<rect x="${x0}" y="${r3(ty)}" width="${r3(W)}" height="${r3(th)}" fill="${SCH.paper}" stroke="${I}" stroke-width="1.4"/><rect x="${x0}" y="${r3(ty)}" width="${r3(W)}" height="${r3(rh)}" fill="${SCH.grey}" stroke="${I}" stroke-width="1.4"/>`;
 const heads=[_("Dòng","Line"),_("Từ → Đến","From → To"),_("Dịch vụ","Service"),_("Spec / cự ly","Spec / distance"),"P","T",_("Lưu lượng","Flow")];let cx=x0;
 heads.forEach((h,i)=>{s+=`<text x="${r3(cx+4)}" y="${r3(ty+rh*.7)}" font-family="${ff}" font-size="${r3(fz)}" font-weight="700" fill="${I}">${esc(h)}</text>`;if(i>0)s+=`<path d="M${r3(cx)} ${r3(ty)} V${r3(ty+th)}" stroke="${I}" stroke-width=".8"/>`;cx+=cw[i]});
 rows.forEach((e,r)=>{const y=ty+(r+1)*rh;s+=`<path d="M${x0} ${r3(y)} H${r3(x0+W)}" stroke="${SCH.sub2}" stroke-width=".8"/>`;let x=x0;
  const spec=isTransport(e)?(e.dist||""):[pipeSpecText(e,"sch",state.meta.units,""),matShort(e)].filter(Boolean).join(" • ")||e.size;
  [e.num,nm(e.from)+" → "+nm(e.to),e.service,spec,e.P,e.T,e.flow].forEach((v,i)=>{s+=`<text x="${r3(x+4)}" y="${r3(y+rh*.7)}" font-family="${ff}" font-size="${r3(fz)}"${i===0?' font-weight="700"':""} fill="${I}">${esc(tr(v,i))}</text>`;x+=cw[i]})});
 return s;
}
function legendWidth(L){
 const fz=FU("legend");let w=tbL("legend").length*fz*.58+14;
 L.used.forEach(k=>{w+=36+T_(PHASE[k].n).length*fz*.6+22});return w-22;
}
function legendMarkup(L){
 if(!L.leg)return"";
 const fz=FU("legend"),ff=FF("legend"),y=L.legY,right=L.lp==="tr"||L.lp==="br";
 let x=right?L.fx1-20-legendWidth(L):L.fx0+20,s=`<text x="${r3(x)}" y="${r3(y)}" font-family="${ff}" font-size="${r3(fz)}" font-weight="700" fill="${SCH.ink}">${esc(tbL("legend"))}</text>`;
 x+=tbL("legend").length*fz*.58+14;
 L.used.forEach(k=>{const c=phaseCol(k),nm=T_(PHASE[k].n);s+=`<path d="M${r3(x)} ${r3(y-fz*.35)} H${r3(x+30)}" stroke="${c}" stroke-width="3.5"/><text x="${r3(x+36)}" y="${r3(y)}" font-family="${ff}" font-size="${r3(fz)}" font-weight="600" fill="${c}">${esc(nm)}</text>`;x+=36+nm.length*fz*.6+22});
 return s;
}
function gridDefs(){
 const g=cadOn()?cadGridW():20,G=g*5,H=cadOn()?sheetDim()[1]:0,o=cadOn()?(H%g):0,o5=cadOn()?(H%G):0;
 return`<pattern id="grid" y="${r3(o)}" width="${r3(g)}" height="${r3(g)}" patternUnits="userSpaceOnUse"><path d="M${r3(g)} 0H0V${r3(g)}" fill="none" stroke="${SCH.gridMinor}" stroke-width="1"/></pattern><pattern id="grid5" y="${r3(o5)}" width="${r3(G)}" height="${r3(G)}" patternUnits="userSpaceOnUse"><path d="M${r3(G)} 0H0V${r3(G)}" fill="none" stroke="${SCH.gridMajor}" stroke-width="1"/></pattern>`;
}
function sheetMarkup(it){
 const m=state.meta;
 if(!m.showSheet)return it?`<rect x="-6000" y="-6000" width="14000" height="14000" fill="${SCH.paper}"/>`+(m.grid?`<rect x="-6000" y="-6000" width="14000" height="14000" fill="url(#grid)"/><rect x="-6000" y="-6000" width="14000" height="14000" fill="url(#grid5)"/>`:""):"";
 const L=sheetLayout(),{W,H}=L,I=SCH.ink;let s="";
 if(it)s+=`<rect x="8" y="8" width="${W}" height="${H}" fill="${SCH.shadow}" opacity=".45"/>`;
 s+=`<rect x="0" y="0" width="${W}" height="${H}" fill="${SCH.paper}"/>`;
 if(it&&m.grid)s+=`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#grid)"/><rect x="0" y="0" width="${W}" height="${H}" fill="url(#grid5)"/>`;
 s+=`<rect x="${r3(L.fx0)}" y="${r3(L.fy0)}" width="${r3(L.fx1-L.fx0)}" height="${r3(L.fy1-L.fy0)}" fill="none" stroke="${I}" stroke-width="${m.template==="iso"?2.8:2.5}"/>`;
 s+=zoneMarkup(L);
 if(L.tb)s+=tbMarkup(L.tb);
 if(L.rev)s+=revMarkup(L.rev);
 s+=legendMarkup(L);
 if(m.showTable)s+=tableMarkup(L);
 return s;
}
