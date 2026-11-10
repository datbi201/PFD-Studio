/* ============ MODULE SƠ ĐỒ — XUẤT SANG OFFICE: PNG (clipboard), SVG sạch, PowerPoint (.pptx) ============ */
/* ---------- tiện ích ---------- */
function dgBoxInfo(){                                 /* khung xuất = nội dung + lề trắng */
 const bb=dgBBox();if(!bb)return null;const p=state.meta.dg.pad;
 return{x0:bb.x0-p,y0:bb.y0-p,w:bb.x1-bb.x0+2*p,h:bb.y1-bb.y0+2*p};
}
const dgPx=u=>u*0.25*96/25.4;                         /* đơn vị bản vẽ → px ở 96 dpi (kích thước thật) */
function dgFname(ext){return fname(ext)}
/* ---------- SVG sạch cho Office ---------- */
function dgOfficeSvg(opt){
 opt=opt||{};const B=dgBoxInfo();if(!B)return null;
 let body=dgMarkup(false);
 if(!opt.stack)body=body.replace(/font-family="([^"]*)"/g,(m,v)=>{let f=v.split(",")[0].trim().replace(/^['"]|['"]$/g,"");return`font-family="${esc(f)}"`});
 const bg=(opt.bg===undefined?state.meta.dg.pngBg:opt.bg)==="white"?`<rect x="${_f(B.x0)}" y="${_f(B.y0)}" width="${_f(B.w)}" height="${_f(B.h)}" fill="#FFFFFF"/>`:"";
 const W=_f(dgPx(B.w)),H=_f(dgPx(B.h));
 return`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${_f(B.x0)} ${_f(B.y0)} ${_f(B.w)} ${_f(B.h)}">${bg}${body}</svg>`;
}
function dgExportSvg(){
 const s=dgOfficeSvg({bg:"none"});if(!s)return setStatus(_("Sơ đồ đang trống.","The diagram is empty."));
 dl(new Blob([s],{type:"image/svg+xml;charset=utf-8"}),dgFname(".svg"));
 setStatus(_("Đã xuất SVG (không dùng CSS, mỗi đoạn chữ là một thẻ text). Word 365: Chèn → Ảnh, rồi chuột phải → Chuyển thành hình dạng để sửa.","SVG exported (no CSS; each text run is one text element). Word 365: Insert → Pictures, then right-click → Convert to Shape to edit."));
}
/* ---------- PNG ---------- */
function dgCrc32(u8){
 if(!dgCrc32.t){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}dgCrc32.t=t}
 let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=dgCrc32.t[(c^u8[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;
}
function dgPngDpi(u8,dpi){                            /* chèn khối pHYs để Word/Office biết kích thước thật */
 const ppm=Math.round(dpi/0.0254),chunk=new Uint8Array(21),dv=new DataView(chunk.buffer);
 dv.setUint32(0,9);chunk.set([112,72,89,115],4);dv.setUint32(8,ppm);dv.setUint32(12,ppm);chunk[16]=1;
 dv.setUint32(17,dgCrc32(chunk.subarray(4,17)));
 const at=8+25;const out=new Uint8Array(u8.length+21);out.set(u8.subarray(0,at));out.set(chunk,at);out.set(u8.subarray(at),at+21);return out;
}
async function dgPngBlob(scale,bg){
 const svg=dgOfficeSvg({bg:bg||state.meta.dg.pngBg,stack:true});if(!svg)return null;
 const B=dgBoxInfo();let sc=scale||state.meta.dg.pngS;const W=dgPx(B.w),H=dgPx(B.h);
 sc=Math.min(sc,8000/Math.max(W,H));
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("svg"));i.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)});
 const c=document.createElement("canvas");c.width=Math.max(1,Math.round(W*sc));c.height=Math.max(1,Math.round(H*sc));
 const x=c.getContext("2d");x.drawImage(img,0,0,c.width,c.height);
 const bl=await new Promise(r=>c.toBlob(r,"image/png"));if(!bl)return null;
 const u8=new Uint8Array(await bl.arrayBuffer());
 return{blob:new Blob([dgPngDpi(u8,96*sc)],{type:"image/png"}),plain:bl,w:c.width,h:c.height};
}
async function dgExportPngFile(){
 try{const r=await dgPngBlob();if(!r)return setStatus(_("Sơ đồ đang trống.","The diagram is empty."));dl(r.blob,dgFname(".png"));setStatus(_(`Đã xuất ảnh PNG ${r.w}×${r.h} px (đã gắn độ phân giải để Word giữ đúng kích thước thật).`,`PNG ${r.w}×${r.h} px exported (resolution tagged so Word keeps the true size).`))}
 catch(e){setStatus(_("Trình duyệt không xuất được PNG — hãy dùng SVG hoặc PowerPoint.","The browser cannot export PNG — use SVG or PowerPoint."))}
}
async function dgCopyImage(){
 if(!dgBBox())return setStatus(_("Sơ đồ đang trống.","The diagram is empty."));
 try{
  const r=await dgPngBlob();
  if(!(navigator.clipboard&&window.ClipboardItem))throw new Error("noclip");
  await navigator.clipboard.write([new ClipboardItem({"image/png":r.plain})]);
  setStatus(_("Đã sao chép ảnh sơ đồ. Mở Word và nhấn Ctrl+V để dán. Muốn sửa được từng hình trong Word: dùng nút PowerPoint.","Diagram image copied. Open Word and press Ctrl+V to paste. To edit each shape in Word, use the PowerPoint button instead."));
 }catch(e){
  setStatus(_("Trình duyệt không cho sao chép ảnh trực tiếp — đã tải tệp PNG về, hãy chèn vào Word bằng Chèn → Ảnh.","The browser would not copy the image directly — a PNG file was downloaded; insert it in Word via Insert → Pictures."));
  dgExportPngFile();
 }
}
/* ---------- ZIP không nén ---------- */
function dgZip(files){
 const enc=new TextEncoder(),parts=[],cd=[];let off=0;
 const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
 files.forEach(f=>{
  const name=enc.encode(f.name),data=typeof f.data==="string"?enc.encode(f.data):f.data,crc=dgCrc32(data);
  const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);
  parts.push(lh,name,data);
  cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);
  off+=lh.length+name.length+data.length;
 });
 let cdLen=0;cd.forEach(p=>cdLen+=p.length);
 const end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(off),...u16(0)]);
 return new Blob([...parts,...cd,end],{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
}
/* ============ PPTX ============ */
const _x=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const DG_DASH_X={dash:"dash",dot:"sysDot",dd:"dashDot"};
const DG_ARW_X={tri:"triangle",open:"arrow",stealth:"stealth",oval:"oval",diamond:"diamond"};
const DG_ADJ1={roundRect:1,triangle:1,parallelogram:1,trapezoid:1,hexagon:1,octagon:1,plus:1,can:1,cube:1,foldedCorner:1,chevron:1,homePlate:1};
const DG_ADJ2={rightArrow:1,leftArrow:1,upArrow:1,downArrow:1,wedgeRectCallout:1};
function dgSolid(col,alpha){return`<a:solidFill><a:srgbClr val="${col.slice(1).toUpperCase()}">${alpha!==undefined&&alpha<1?`<a:alpha val="${Math.round(alpha*100000)}"/>`:""}</a:srgbClr></a:solidFill>`}
function dgLnX(ln,lw,ld,kk,extra){
 if(!ln||lw<=0)return`<a:ln><a:noFill/></a:ln>`;
 return`<a:ln w="${Math.max(1,Math.round(lw*12700*kk))}" cap="flat">${dgSolid(ln)}${ld?`<a:prstDash val="${DG_DASH_X[ld]||"solid"}"/>`:""}<a:miter lim="800000"/>${extra||""}</a:ln>`;
}
function dgRunX(r,s,fsPt,face){
 const b=!!(s.fb||r.b),i=!!(s.fi||r.i),u=!!(s.fu||r.u);
 return`<a:r><a:rPr lang="vi-VN" sz="${Math.max(100,Math.round(fsPt*100))}" b="${b?1:0}" i="${i?1:0}"${u?' u="sng"':""} dirty="0">${dgSolid(s.fc)}<a:latin typeface="${_x(face)}"/><a:cs typeface="${_x(face)}"/></a:rPr><a:t>${_x(r.t)}</a:t></a:r>`;
}
function dgTxBody(sh,kk,o){
 o=o||{};const ps=dgParas(sh),mg=sh.mg.map(v=>Math.round(v*12700*kk));
 const anchor=sh.tv==="t"?"t":sh.tv==="b"?"b":"ctr";
 let x=`<p:txBody><a:bodyPr wrap="${o.nowrap?"none":"square"}" lIns="${mg[0]}" tIns="${mg[1]}" rIns="${mg[2]}" bIns="${mg[3]}" rtlCol="0" anchor="${anchor}">${sh.af?"<a:spAutoFit/>":"<a:noAutofit/>"}</a:bodyPr><a:lstStyle/>`;
 ps.forEach(p=>{
  const s=p.st,fsPt=s.fs*kk,algn={l:"l",c:"ctr",r:"r",j:"just"}[s.ta]||"ctr",marL=p.bu?Math.round(s.fs*DG_BUL*12700*kk):0;
  x+=`<a:p><a:pPr algn="${algn}" marL="${marL}" indent="${-marL}"><a:lnSpc><a:spcPct val="${Math.round(sh.ls*100000)}"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="${Math.round(sh.ps*100*kk)}"/></a:spcAft>`;
  if(p.bu==="dot")x+=`<a:buFont typeface="Arial"/><a:buChar char="•"/>`;else if(p.bu==="dash")x+=`<a:buFont typeface="Arial"/><a:buChar char="–"/>`;else if(p.bu==="num")x+=`<a:buFont typeface="+mj-lt"/><a:buAutoNum type="arabicPeriod"/>`;else x+=`<a:buNone/>`;
  x+=`</a:pPr>`;
  const runs=p.runs.filter(r=>r.t!=="");
  runs.forEach(r=>{x+=dgRunX(r,s,fsPt,sh.ff)});
  x+=`<a:endParaRPr lang="vi-VN" sz="${Math.max(100,Math.round(fsPt*100))}" dirty="0">${dgSolid(s.fc)}<a:latin typeface="${_x(sh.ff)}"/></a:endParaRPr></a:p>`;
 });
 return x+`</p:txBody>`;
}
function dgAdjX(P,sh){
 if(DG_ADJ1[P.prst]&&sh.a!==undefined)return`<a:avLst><a:gd name="adj" fmla="val ${Math.round(sh.a*100000)}"/>${P.prst==="hexagon"?'<a:gd name="vf" fmla="val 115470"/>':""}</a:avLst>`;
 if(DG_ADJ2[P.prst]&&sh.a!==undefined)return`<a:avLst><a:gd name="adj1" fmla="val ${Math.round(sh.a*100000)}"/><a:gd name="adj2" fmla="val ${Math.round((sh.b??.5)*100000)}"/></a:avLst>`;
 return`<a:avLst/>`;
}
function dgPptxBuild(){
 const B=dgBoxInfo();if(!B)return null;
 const d=state.dg;let k=9000;const mx=51206400;if(Math.max(B.w,B.h)*k>mx)k=mx/Math.max(B.w,B.h);
 const kk=k/9000,E=v=>Math.round(v*k),X=v=>E(v-B.x0),Y=v=>E(v-B.y0);
 let id=1;const ids=new Map(),sps=[];
 d.shapes.forEach(s=>ids.set(s.id,++id));
 const name=(base,s)=>_x(base+" "+(s||""));
 d.shapes.forEach(sh=>{
  const P=DG_PRESET[sh.k],nid=ids.get(sh.id),hasTx=(sh.tx||"").trim()!=="";
  const fillX=sh.fl?dgSolid(sh.fl,sh.fo):"<a:noFill/>",lnX=dgLnX(sh.ln,sh.lw,sh.ld,kk);
  const isTb=sh.k==="text";
  const xf=(rot,x,y,w,h)=>`<a:xfrm${rot?` rot="${Math.round(rot*60000)}"`:""}><a:off x="${X(x)}" y="${Y(y)}"/><a:ext cx="${E(w)}" cy="${E(h)}"/></a:xfrm>`;
  const nm=name("Shape",String(nid));
  if(P.exact||!hasTx){
   sps.push(`<p:sp><p:nvSpPr><p:cNvPr id="${nid}" name="${nm}"/><p:cNvSpPr${isTb?' txBox="1"':""}/><p:nvPr/></p:nvSpPr><p:spPr>${xf(sh.rot,sh.x,sh.y,sh.w,sh.h)}<a:prstGeom prst="${P.prst}">${dgAdjX(P,sh)}</a:prstGeom>${fillX}${lnX}</p:spPr>${hasTx||isTb?dgTxBody(sh,kk):`<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="vi-VN" dirty="0"/></a:p></p:txBody>`}</p:sp>`);
  }else{                                            /* vùng chữ không trùng Office → bọc nhóm: hình + hộp chữ riêng */
   const tr=P.tr(sh.w,sh.h,sh.a,sh.b),gid=++id,tid=++id;
   sps.push(`<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${gid}" name="${name("Group",String(gid))}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm${sh.rot?` rot="${Math.round(sh.rot*60000)}"`:""}><a:off x="${X(sh.x)}" y="${Y(sh.y)}"/><a:ext cx="${E(sh.w)}" cy="${E(sh.h)}"/><a:chOff x="${X(sh.x)}" y="${Y(sh.y)}"/><a:chExt cx="${E(sh.w)}" cy="${E(sh.h)}"/></a:xfrm></p:grpSpPr>`+
    `<p:sp><p:nvSpPr><p:cNvPr id="${nid}" name="${nm}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xf(0,sh.x,sh.y,sh.w,sh.h)}<a:prstGeom prst="${P.prst}">${dgAdjX(P,sh)}</a:prstGeom>${fillX}${lnX}</p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="vi-VN" dirty="0"/></a:p></p:txBody></p:sp>`+
    `<p:sp><p:nvSpPr><p:cNvPr id="${tid}" name="${name("Text",String(tid))}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xf(0,sh.x+tr[0],sh.y+tr[1],tr[2]-tr[0],tr[3]-tr[1])}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>${dgTxBody({...sh,af:false},kk)}</p:sp></p:grpSp>`);
  }
 });
 const m=dgById(d.shapes);
 d.conns.forEach(c=>{
  const R=dgRoute(c,m),pts=R.pts,cid=++id,n=pts.length;
  const head=c.as!=="none"?`<a:headEnd type="${DG_ARW_X[c.as]}" w="med" len="med"/>`:"",tail=c.ae!=="none"?`<a:tailEnd type="${DG_ARW_X[c.ae]}" w="med" len="med"/>`:"";
  const lnX=dgLnX(c.ln,c.lw,c.ld,kk,head+tail);
  const glue=(e,tag)=>{if(!e)return"";const sh=m.get(e.id),P=sh&&DG_PRESET[sh.k];if(!P||!P.glue||c.ty==="cv")return"";return`<a:${tag} id="${ids.get(e.id)}" idx="${P.glue[e.p]}"/>`};
  const fit=c.ty==="cv"?null:dgBentFit(pts);
  let geom,xfrm;
  if(fit){
   const bx=fit.cx-fit.ew/2,by=fit.cy-fit.eh/2;
   xfrm=`<a:xfrm${fit.rot?` rot="${fit.rot*60000}"`:""}${fit.fh?' flipH="1"':""}${fit.fv?' flipV="1"':""}><a:off x="${X(bx)}" y="${Y(by)}"/><a:ext cx="${E(fit.ew)}" cy="${E(fit.eh)}"/></a:xfrm>`;
   geom=`<a:prstGeom prst="${fit.prst}"><a:avLst>${fit.adj.map((a,i)=>`<a:gd name="adj${i+1}" fmla="val ${Math.round(a*100000)}"/>`).join("")}</a:avLst></a:prstGeom>`;
  }else{
   const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let x0=Math.min(...xs),y0=Math.min(...ys),x1=Math.max(...xs),y1=Math.max(...ys);
   if(R.d){const nums=R.d.match(/-?[\d.]+/g).map(Number);for(let i=0;i<nums.length;i+=2){x0=Math.min(x0,nums[i]);x1=Math.max(x1,nums[i]);y0=Math.min(y0,nums[i+1]);y1=Math.max(y1,nums[i+1])}}
   const w=Math.max(1,E(x1-x0)),h=Math.max(1,E(y1-y0)),pt=(px,py)=>`<a:pt x="${E(px-x0)}" y="${E(py-y0)}"/>`;
   let path;
   if(R.d){const q=R.d.match(/-?[\d.]+/g).map(Number);path=`<a:moveTo>${pt(q[0],q[1])}</a:moveTo><a:cubicBezTo>${pt(q[2],q[3])}${pt(q[4],q[5])}${pt(q[6],q[7])}</a:cubicBezTo>`}
   else path=`<a:moveTo>${pt(pts[0][0],pts[0][1])}</a:moveTo>`+pts.slice(1).map(p=>`<a:lnTo>${pt(p[0],p[1])}</a:lnTo>`).join("");
   xfrm=`<a:xfrm><a:off x="${X(x0)}" y="${Y(y0)}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`;
   geom=`<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${w}" h="${h}" fill="none">${path}</a:path></a:pathLst></a:custGeom>`;
  }
  const g=(fit||c.ty!=="cv")?glue(c.s,"stCxn")+glue(c.e,"endCxn"):"";
  sps.push(`<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${cid}" name="${name("Connector",String(cid))}"/><p:cNvCxnSpPr>${fit?g:""}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm}${geom}${lnX}</p:spPr></p:cxnSp>`);
  const lb=dgConnLabelBox(c,pts);
  if(lb){
   const tid=++id,sh={tx:dgEscMarks(c.tx),tp:null,ff:c.ff,fs:c.fs,fb:c.fb,fi:false,fu:false,fc:c.fc,ta:"c",tv:"m",mg:[0,0,0,0],af:false,ls:1,ps:0};
   sps.push(`<p:sp><p:nvSpPr><p:cNvPr id="${tid}" name="${name("Label",String(tid))}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${X(lb.x)}" y="${Y(lb.y)}"/><a:ext cx="${E(lb.w)}" cy="${E(lb.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${c.bg?dgSolid("#FFFFFF"):"<a:noFill/>"}<a:ln><a:noFill/></a:ln></p:spPr>${dgTxBody(sh,kk,{nowrap:true})}</p:sp>`);
  }
 });
 return{shapes:sps.join(""),w:E(B.w),h:E(B.h)};
}
/* khớp đa tuyến vuông góc với bentConnector2..5 của Office */
function dgBentFit(pts){
 const n=pts.length;if(n<2)return null;
 const A=pts[0],Bp=pts[n-1],cx=(A[0]+Bp[0])/2,cy=(A[1]+Bp[1])/2,dx=Math.abs(Bp[0]-A[0]),dy=Math.abs(Bp[1]-A[1]);
 if(n===2){
  const fh=Bp[0]<A[0]?1:0,fv=Bp[1]<A[1]?1:0;
  return{prst:"straightConnector1",rot:0,fh,fv,cx,cy,ew:dx,eh:dy,adj:[]};
 }
 const prst={3:"bentConnector2",4:"bentConnector3",5:"bentConnector4",6:"bentConnector5"}[n];if(!prst)return null;
 for(const rot of[0,90,180,270])for(const fh of[0,1])for(const fv of[0,1]){
  const sw=rot===90||rot===270,ew=Math.max(1,sw?dy:dx),eh=Math.max(1,sw?dx:dy),r=-rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  const L=pts.map(p=>{const rx=p[0]-cx,ry=p[1]-cy;let lx=rx*c-ry*s+ew/2,ly=rx*s+ry*c+eh/2;if(fh)lx=ew-lx;if(fv)ly=eh-ly;return[lx,ly]});
  const T=1.3,eq=(a,b)=>Math.abs(a-b)<T;
  if(!(eq(L[0][0],0)&&eq(L[0][1],0)&&eq(L[n-1][0],ew)&&eq(L[n-1][1],eh)))continue;
  let ok=false,adj=[];
  if(n===3)ok=eq(L[1][0],ew)&&eq(L[1][1],0);
  else if(n===4){ok=eq(L[1][1],0)&&eq(L[2][1],eh)&&eq(L[1][0],L[2][0]);adj=[L[1][0]/ew]}
  else if(n===5){ok=eq(L[1][1],0)&&eq(L[1][0],L[2][0])&&eq(L[2][1],L[3][1])&&eq(L[3][0],ew);adj=[L[1][0]/ew,L[2][1]/eh]}
  else{ok=eq(L[1][1],0)&&eq(L[1][0],L[2][0])&&eq(L[2][1],L[3][1])&&eq(L[3][0],L[4][0])&&eq(L[4][1],eh);adj=[L[1][0]/ew,L[2][1]/eh,L[3][0]/ew]}
  if(ok)return{prst,rot,fh,fv,cx,cy,ew,eh,adj};
 }
 return null;
}
const DG_THEME=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
function dgPptxFiles(){
 const b=dgPptxBuild();if(!b)return null;
 const NS='xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
 const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
 const grp=`<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
 const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const rel=(items)=>H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+items.map(([i,t,g])=>`<Relationship Id="${i}" Type="${R}/${t}" Target="${g}"/>`).join("")+`</Relationships>`;
 const title=state.meta.title||"Diagram";
 return[
  {name:"[Content_Types].xml",data:H+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`},
  {name:"_rels/.rels",data:H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`},
  {name:"docProps/core.xml",data:H+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${_x(title)}</dc:title><dc:creator>PFD Studio</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`},
  {name:"docProps/app.xml",data:H+`<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>PFD Studio</Application><Slides>1</Slides></Properties>`},
  {name:"ppt/presentation.xml",data:H+`<p:presentation ${NS}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="${b.w}" cy="${b.h}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`},
  {name:"ppt/_rels/presentation.xml.rels",data:rel([["rId1","slideMaster","slideMasters/slideMaster1.xml"],["rId2","slide","slides/slide1.xml"],["rId3","theme","theme/theme1.xml"]])},
  {name:"ppt/slides/slide1.xml",data:H+`<p:sld ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${grp}${b.shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`},
  {name:"ppt/slides/_rels/slide1.xml.rels",data:rel([["rId1","slideLayout","../slideLayouts/slideLayout1.xml"]])},
  {name:"ppt/slideLayouts/slideLayout1.xml",data:H+`<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${grp}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`},
  {name:"ppt/slideLayouts/_rels/slideLayout1.xml.rels",data:rel([["rId1","slideMaster","../slideMasters/slideMaster1.xml"]])},
  {name:"ppt/slideMasters/slideMaster1.xml",data:H+`<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${grp}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`},
  {name:"ppt/slideMasters/_rels/slideMaster1.xml.rels",data:rel([["rId1","slideLayout","../slideLayouts/slideLayout1.xml"],["rId2","theme","../theme/theme1.xml"]])},
  {name:"ppt/theme/theme1.xml",data:DG_THEME}
 ];
}
function dgExportPptx(){
 const f=dgPptxFiles();if(!f)return setStatus(_("Sơ đồ đang trống.","The diagram is empty."));
 dl(dgZip(f),dgFname(".pptx"));
 setStatus(_("Đã xuất PowerPoint (.pptx): mỗi hình là một hình khối Office có chữ sửa được. Mở bằng PowerPoint, Ctrl+A, Ctrl+C rồi dán vào Word để giữ sửa được; hoặc dùng Chèn → Đối tượng.","PowerPoint (.pptx) exported: each shape is a native Office shape with editable text. Open in PowerPoint, Ctrl+A, Ctrl+C and paste into Word to keep it editable."));
}
