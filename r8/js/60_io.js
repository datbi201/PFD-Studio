/* ============ LƯU / MỞ ============ */
function drawingData(){return{app:"PFD Studio",version:5,state:{meta:state.meta,nodes:state.nodes,edges:state.edges,shapes:state.shapes,nextId:state.nextId,nextStream:state.nextStream}}}
function dl(blob,name){try{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);setStatus(_("Đã tạo tệp ","Created file ")+name+_(" (kiểm tra thư mục Tải xuống)."," (check your Downloads folder)."))}catch(e){setStatus(_("Trình duyệt chặn tải tệp — hãy dùng nút { } JSON để sao chép.","The browser blocked the download — use the { } JSON button to copy."))}}
const fname=ext=>(((state.meta.docNo||"PFD")+"-"+(state.meta.rev||"")).replace(/[^\w\-. ]/g,"").trim()||"PFD")+ext;
function saveJSON(){dl(new Blob([JSON.stringify(drawingData(),null,2)],{type:"application/json"}),fname(".pfd.json"))}
function loadData(d,auto){
 let s;
 if(d&&d.version>=2&&d.state)s=d.state;
 else if(d&&d.state&&d.state.nodes)s={meta:{...defaultMeta(),title:d.title||"PROCESS FLOW DIAGRAM",project:d.project||"",rev:d.rev||"Rev. 0"},nodes:d.state.nodes,edges:(d.state.edges||[]).map(e=>({...e,service:e.service??e.label??""})),nextStream:1};
 else throw new Error(_("Tệp không đúng định dạng PFD Studio","Not a PFD Studio file"));
 if(s&&s.meta&&s.meta.doc==="dgm"){setStatus(_("Tệp này là Sơ đồ (module đã bỏ từ Rev.8), không mở được.","This file is a Diagram (module removed in Rev.8) and cannot be opened."));return}
 adoptState(normalizeState(s));
 if(auto)resetHistory();else commit(_("Mở bản vẽ","Open drawing"));
 syncMetaUI();renderAll();fitView();
}
function loadFile(ev){const f=ev.target.files[0];if(!f)return;f.text().then(t=>{try{loadData(JSON.parse(t));setStatus(_("Đã mở ","Opened ")+f.name+_(" (Ctrl+Z để quay lại bản trước)."," (Ctrl+Z to go back)."))}catch(e){setStatus(_("Không mở được: ","Cannot open: ")+e.message)}});ev.target.value=""}
function openJSON(){$("jsonTxt").value=JSON.stringify(drawingData(),null,2);openModal("mJSON")}
function loadFromText(){try{loadData(JSON.parse($("jsonTxt").value));closeModals();setStatus(_("Đã nạp bản vẽ từ JSON.","Drawing loaded from JSON."))}catch(e){setStatus(_("JSON không hợp lệ: ","Invalid JSON: ")+e.message)}}
function copyText(t){
 const ok=()=>setStatus(_("Đã sao chép vào bộ nhớ tạm.","Copied to clipboard."));
 const fb=()=>{const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");ok()}catch(e){setStatus(_("Không sao chép tự động được — hãy bôi đen và Ctrl+C.","Automatic copy failed — select the text and press Ctrl+C."))}ta.remove()};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();
}

/* ============ XUẤT SVG / PNG ============ */
function buildBody(opts){
 const pEXP=EXPORTING,pBW=BW;EXPORTING=true;BW=!!(opts&&opts.bw);updateRS();
 let vb;
 if(state.meta.showSheet){const[W,H]=sheetDim();vb=[0,0,W,H]}else{const b=contentBBox();vb=[b[0],b[1],b[2]-b[0],b[3]-b[1]]}
 const bg=state.meta.showSheet?"":`<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>`;
 const body=bg+sheetMarkup(false)+(typeof dgMarkup==="function"?dgMarkup(false):"")+shapesMarkup("b",false)+edgesMarkup(false)+nodesMarkup(false)+shapesMarkup("f",false);
 const defs=markerDefs();
 EXPORTING=pEXP;BW=pBW;updateRS();
 return{body,defs,vb};
}
function buildExport(opts){
 const b=buildBody(opts),vb=b.vb;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(vb[2])}" height="${Math.round(vb[3])}" viewBox="${r3(vb[0])} ${r3(vb[1])} ${r3(vb[2])} ${r3(vb[3])}" font-family="Arial, Helvetica, sans-serif"><defs>${b.defs}</defs>${b.body}</svg>`;
 return{svg,w:vb[2],h:vb[3]};
}
function exportSVG(){if(dgOn())return dgExportSvg();const b=buildExport();dl(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+b.svg],{type:"image/svg+xml;charset=utf-8"}),fname(".svg"))}
function exportPNG(){
 if(dgOn())return dgExportPngFile();
 const b=buildExport(),img=new Image();
 img.onload=()=>{const sc=Math.min(3,3600/b.w),c=document.createElement("canvas");c.width=Math.round(b.w*sc);c.height=Math.round(b.h*sc);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);c.toBlob(bl=>bl?dl(bl,fname(".png")):setStatus(_("Không tạo được PNG — hãy dùng SVG.","Could not create the PNG — use SVG.")))};
 img.onerror=()=>setStatus(_("Trình duyệt không xuất được PNG — hãy dùng SVG.","The browser cannot export PNG — use SVG."));
 img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(b.svg);
}

/* ============ XEM TRƯỚC KHI IN · IN · PDF ============ */
let PP={page:0,cfg:null,src:null};
function openPrint(){
 const m=state.meta;
 if(!$("pp_paper").options.length)$("pp_paper").innerHTML=["ISO","US"].map(g=>`<optgroup label="${g==="ISO"?"ISO / A-series":"US / ANSI-ARCH"}">`+Object.entries(SHEETS).filter(([k,s])=>s.g===g).map(([k,s])=>`<option value="${k}">${s.n}</option>`).join("")+"</optgroup>").join("");
 $("pp_paper").value=m.sheet;$("pp_orient").value="auto";$("pp_scale").value="fit";$("pp_pct").value=100;
 $("pp_margin").value=m.sheet.startsWith("ANSI")||m.sheet==="ARCH_D"?"6.35":"5";
 $("pp_bw").checked=false;PP.page=0;PP.src=null;
 openModal("mPrint");ppRefresh();
}
function ppSource(){
 const bw=$("pp_bw").checked,key=(bw?"1":"0")+snapshot().length+"|"+LANG;
 if(!PP.src||PP.src.key!==key){PP.src=Object.assign({key},buildBody({bw}));PP.src.bw=bw}
 return PP.src;
}
function ppConfig(){
 const src=ppSource(),vb=src.vb,paper=SHEETS[$("pp_paper").value]||SHEETS.A3;
 let orient=$("pp_orient").value,pw=paper.w/MM,ph=paper.h/MM;
 if(orient==="auto"){orient=vb[2]>=vb[3]?"landscape":"portrait"}
 if(orient==="portrait"){const t=pw;pw=ph;ph=t}
 const mg=Math.min(40,Math.max(0,+$("pp_margin").value||0)),aw=pw-2*mg,ah=ph-2*mg,Wd=vb[2]/MM,Hd=vb[3]/MM;
 let s,mode=$("pp_scale").value;
 if(mode==="fit")s=Math.min(aw/Wd,ah/Hd,8);else if(mode==="100")s=1;else s=Math.max(.05,(+$("pp_pct").value||100)/100);
 const nx=Math.max(1,Math.ceil(Wd*s/aw-1e-6)),ny=Math.max(1,Math.ceil(Hd*s/ah-1e-6)),pages=[];
 for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++)pages.push({ix,iy});
 return{pw,ph,mg,aw,ah,s,nx,ny,pages,vb,Wd,Hd,orient};
}
function pageSvg(cfg,i,src,forPrint){
 const pg=cfg.pages[i],{pw,ph,mg,aw,ah,s,vb}=cfg,single=cfg.pages.length===1;
 let x,y,w,h,v;
 if(single){w=cfg.Wd*s;h=cfg.Hd*s;x=mg+(aw-w)/2;y=mg+(ah-h)/2;v=vb}
 else{
  const ww=aw/s*MM,hh=ah/s*MM;x=mg;y=mg;
  w=Math.min(aw,(vb[2]-pg.ix*ww)*s/MM);h=Math.min(ah,(vb[3]-pg.iy*hh)*s/MM);
  v=[vb[0]+pg.ix*ww,vb[1]+pg.iy*hh,w/s*MM,h/s*MM];
 }
 const lab=single?"":`<text x="${mg}" y="${r3(Math.max(3,mg-1.2))}" font-family="Arial" font-size="3" fill="#555">${esc(state.meta.docNo)} — ${_("trang","page")} ${i+1}/${cfg.pages.length} (${_("hàng","row")} ${pg.iy+1}, ${_("cột","col")} ${pg.ix+1})</text>`;
 return`<svg xmlns="http://www.w3.org/2000/svg" ${forPrint?'style="display:block;width:100%;height:100%" ':`width="${r3(pw)}mm" height="${r3(ph)}mm" `}viewBox="0 0 ${r3(pw)} ${r3(ph)}" font-family="Arial, Helvetica, sans-serif"><defs>${src.defs}</defs><rect width="${r3(pw)}" height="${r3(ph)}" fill="#fff"/><svg x="${r3(x)}" y="${r3(y)}" width="${r3(w)}" height="${r3(h)}" viewBox="${r3(v[0])} ${r3(v[1])} ${r3(v[2])} ${r3(v[3])}" overflow="hidden">${src.body}</svg>${lab}</svg>`;
}
function ppRefresh(){
 const cfg=ppConfig();PP.cfg=cfg;PP.page=Math.min(PP.page,cfg.pages.length-1);
 $("pp_pctBox").style.display=$("pp_scale").value==="pct"?"":"none";
 $("ppView").style.aspectRatio=`${cfg.pw} / ${cfg.ph}`;
 $("ppView").innerHTML=pageSvg(cfg,PP.page,ppSource(),true);
 $("ppInfo").textContent=_(`Giấy ${r3(cfg.pw)} × ${r3(cfg.ph)} mm (${cfg.orient==="landscape"?"ngang":"dọc"}) • tỷ lệ in ${Math.round(cfg.s*1000)/10}% • ${cfg.pages.length} trang (${cfg.nx} × ${cfg.ny}) • lề ${cfg.mg} mm`,`Paper ${r3(cfg.pw)} × ${r3(cfg.ph)} mm (${cfg.orient}) • print scale ${Math.round(cfg.s*1000)/10}% • ${cfg.pages.length} page(s) (${cfg.nx} × ${cfg.ny}) • margin ${cfg.mg} mm`);
 $("ppPageLbl").textContent=(PP.page+1)+" / "+cfg.pages.length;
 $("ppPrev").disabled=PP.page<=0;$("ppNext").disabled=PP.page>=cfg.pages.length-1;
}
function ppNav(d){PP.page=Math.max(0,Math.min((PP.cfg?PP.cfg.pages.length:1)-1,PP.page+d));ppRefresh()}
function ppAllPagesSvg(forPrint){const cfg=ppConfig(),src=ppSource();return{cfg,list:cfg.pages.map((_p,i)=>pageSvg(cfg,i,src,forPrint))}}
/* id riêng cho từng trang in: nếu trùng id với bảng vẽ đang ẩn (display:none) trình duyệt sẽ lấy marker (mũi tên) ở phần bị ẩn → mất mũi tên khi in ra giấy */
function uniqSvgIds(svg,tag){return svg.replace(/([\s<])id="([^"]+)"/g,`$1id="${tag}_$2"`).replace(/url\(#([^)]+)\)/g,`url(#${tag}_$1)`).replace(/href="#([^"]+)"/g,`href="#${tag}_$1"`)}
function doPrint(){
 const{cfg,list}=ppAllPagesSvg(true);
 let st=$("printStyle");if(!st){st=document.createElement("style");st.id="printStyle";document.head.appendChild(st)}
 st.textContent=`@page{size:${r3(cfg.pw)}mm ${r3(cfg.ph)}mm;margin:0}@media print{html,body{height:auto!important;overflow:visible!important;display:block!important;background:#fff!important}body>*:not(#printRoot){display:none!important}#printRoot{display:block!important}.pp{width:${r3(cfg.pw)}mm;height:${r3(cfg.ph)}mm;overflow:hidden;page-break-after:always;break-after:page}.pp:last-child{page-break-after:auto;break-after:auto}}`;
 let root=$("printRoot");if(!root){root=document.createElement("div");root.id="printRoot";document.body.appendChild(root)}
 root.innerHTML=list.map((s,i)=>`<div class="pp">${uniqSvgIds(s,"pr"+i)}</div>`).join("");
 const cleanup=()=>{root.innerHTML="";window.removeEventListener("afterprint",cleanup)};
 window.addEventListener("afterprint",cleanup);
 setStatus(_("Đang mở hộp thoại in… Nếu không thấy gì, trình xem này có thể chặn in — hãy bấm “Tải PDF” hoặc mở tệp HTML trực tiếp bằng trình duyệt.","Opening the print dialog… If nothing appears, this viewer may block printing — use “Download PDF” or open the HTML file directly in a browser."));
 setTimeout(()=>{try{window.print()}catch(e){setStatus(_("Không in trực tiếp được ở đây — hãy bấm “Tải PDF”.","Cannot print directly here — use “Download PDF”."));cleanup()}},60);
}
function openPrintTab(){
 const{cfg,list}=ppAllPagesSvg(true);
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(state.meta.title)}</title><style>@page{size:${r3(cfg.pw)}mm ${r3(cfg.ph)}mm;margin:0}html,body{margin:0;background:#fff}.pp{width:${r3(cfg.pw)}mm;height:${r3(cfg.ph)}mm;overflow:hidden;page-break-after:always;break-after:page}.pp:last-child{page-break-after:auto}</style></head><body>${list.map(s=>`<div class="pp">${s}</div>`).join("")}<script>onload=function(){setTimeout(function(){print()},300)}<\/script></body></html>`;
 try{const w=window.open(URL.createObjectURL(new Blob([html],{type:"text/html"})),"_blank");if(!w)throw 0}catch(e){setStatus(_("Trình duyệt chặn cửa sổ mới — hãy dùng “Tải PDF”.","The browser blocked the new window — use “Download PDF”."))}
}
/* --- PDF thô (mỗi trang là một ảnh nén Flate) --- */
async function svgToImage(svg){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error("svg"));im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)})}
async function deflate(u8){
 if(typeof CompressionStream==="undefined")return null;
 const cs=new CompressionStream("deflate"),w=cs.writable.getWriter();w.write(u8);w.close();
 return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
async function buildPDFRaster(){
 const{cfg,list}=ppAllPagesSvg(false),bw=$("pp_bw").checked;
 const maxSide=4800,dpi=Math.min(200,maxSide/(Math.max(cfg.pw,cfg.ph)/25.4));
 const pxW=Math.round(cfg.pw/25.4*dpi),pxH=Math.round(cfg.ph/25.4*dpi),wpt=cfg.pw/25.4*72,hpt=cfg.ph/25.4*72;
 const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
 const put=d=>{const u=typeof d==="string"?enc.encode(d):d;chunks.push(u);len+=u.length};
 const objs=[];
 put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
 const n=list.length,pageIds=[],imgs=[];
 for(let i=0;i<n;i++){
  setStatus(_(`Đang dựng PDF: trang ${i+1}/${n}…`,`Building PDF: page ${i+1}/${n}…`));
  const im=await svgToImage(list[i]),cv=document.createElement("canvas");cv.width=pxW;cv.height=pxH;
  const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,pxW,pxH);cx.drawImage(im,0,0,pxW,pxH);
  const id=cx.getImageData(0,0,pxW,pxH).data,nc=bw?1:3,raw=new Uint8Array(pxW*pxH*nc);
  if(bw){for(let p=0,q=0;p<id.length;p+=4,q++)raw[q]=(id[p]*.3+id[p+1]*.59+id[p+2]*.11)|0}
  else{for(let p=0,q=0;p<id.length;p+=4){raw[q++]=id[p];raw[q++]=id[p+1];raw[q++]=id[p+2]}}
  let data=await deflate(raw),filter="FlateDecode";
  if(!data){const url=cv.toDataURL("image/jpeg",.92),b=atob(url.split(",")[1]);data=new Uint8Array(b.length);for(let k=0;k<b.length;k++)data[k]=b.charCodeAt(k);filter="DCTDecode"}
  imgs.push({data,filter,nc});
 }
 const objBytes=[];
 /* 1 catalog, 2 pages, rồi mỗi trang: page, content, image */
 const body=[];
 body[1]="<</Type/Catalog/Pages 2 0 R>>";
 const kids=[];for(let i=0;i<n;i++)kids.push((3+i*3)+" 0 R");
 body[2]=`<</Type/Pages/Kids[${kids.join(" ")}]/Count ${n}>>`;
 for(let i=0;i<n;i++){
  const pid=3+i*3,cid=pid+1,iid=pid+2,c=`q ${wpt.toFixed(2)} 0 0 ${hpt.toFixed(2)} 0 0 cm /Im0 Do Q`;
  body[pid]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${wpt.toFixed(2)} ${hpt.toFixed(2)}]/Resources<</XObject<</Im0 ${iid} 0 R>>>>/Contents ${cid} 0 R>>`;
  body[cid]={stream:enc.encode(c),dict:""};
  body[iid]={stream:imgs[i].data,dict:`/Type/XObject/Subtype/Image/Width ${pxW}/Height ${pxH}/ColorSpace/${imgs[i].nc===1?"DeviceGray":"DeviceRGB"}/BitsPerComponent 8/Filter/${imgs[i].filter}`};
 }
 const total=body.length;
 for(let id=1;id<total;id++){
  offs[id]=len;const o=body[id];
  if(typeof o==="string")put(`${id} 0 obj\n${o}\nendobj\n`);
  else{put(`${id} 0 obj\n<<${o.dict}/Length ${o.stream.length}>>\nstream\n`);put(o.stream);put("\nendstream\nendobj\n")}
 }
 const xr=len;let x=`xref\n0 ${total}\n0000000000 65535 f \n`;
 for(let id=1;id<total;id++)x+=String(offs[id]).padStart(10,"0")+" 00000 n \n";
 x+=`trailer\n<</Size ${total}/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF\n`;put(x);
 return new Blob(chunks,{type:"application/pdf"});
}
async function downloadPDF(){
 try{const b=await buildPDF();dl(b,fname(".pdf"))}catch(e){setStatus(_("Không dựng được PDF trong trình duyệt này: ","Could not build the PDF in this browser: ")+(e&&e.message||e)+_(" — hãy dùng SVG/PNG.",". Use SVG/PNG instead."))}
}

/* ============ CSV · BẢNG DÒNG · THIẾT BỊ ============ */
function csv(rows){return"﻿"+rows.map(r=>r.map(c=>{c=String(c??"");return/[",\n;]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(",")).join("\r\n")}
function streamRows(){return state.edges.filter(isStream).sort((a,b)=>(+a.num||0)-(+b.num||0))}
function specParts(e){
 const U=state.meta.units,c=e.std?pipeCalc(e):null;
 return{std:e.std&&PIPE_STD[e.std]?PIPE_STD[e.std].name.split(" — ")[0]:"",size:c?pipeSpecText(Object.assign({},e),"size",U,""):(e.size||""),sch:c?(c.sch||(c.t?String(c.t):"")):"",od:c?c.od:"",t:c?c.t||"":"",mat:e.mat?(e.mat==="other"?e.matOther:T_(matDef(e.mat)[1])):""};
}
function streamsCSVRows(){
 return[["Số dòng","Loại","Từ","Đến","Dịch vụ","Pha","Áp suất","Nhiệt độ","Lưu lượng","Tiêu chuẩn ống","Size","Schedule","OD (mm)","Dày (mm)","Vật liệu","Pipe class","Cự ly"].map(T_),...streamRows().map(e=>{const s=specParts(e);return[e.num,T_(KINDS[e.kind]).split(" — ")[0],nodeName(e.from),nodeName(e.to),e.service,e.phase?T_(PHASE[e.phase].n):"",e.P,e.T,e.flow,s.std,s.size,s.sch,s.od,s.t,s.mat,e.cls,e.dist]})];
}
function exportStreamsCSV(){dl(new Blob([csv(streamsCSVRows())],{type:"text/csv;charset=utf-8"}),fname("-bang-dong.csv"))}
function copyStreams(){copyText(streamsCSVRows().map(r=>r.join("\t")).join("\n"))}
function equipRows(){return state.nodes.filter(n=>!["text","area"].includes(n.type)).sort((a,b)=>String(a.tag).localeCompare(String(b.tag),undefined,{numeric:true}))}
function exportEquipCSV(){dl(new Blob([csv([[T_("Tag"),T_("Tên / mô tả"),T_("Loại"),T_("Thông số thiết bị")],...equipRows().map(n=>[n.tag,nTitle(n),T_(SYMBOLS[n.type].label),String(n.props||"").replace(/\n/g,"; ")])])],{type:"text/csv;charset=utf-8"}),fname("-thiet-bi.csv"))}

/* ============ CỬA SỔ PHỤ ============ */
function openModal(id){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("open"));$(id).classList.add("open")}
function closeModals(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("open"))}
function toggleHelp(o){if(o){helpTab="";renderHelp();openModal("help")}else closeModals()}
function renderStreamTable(){
 const rows=streamRows(),U=state.meta.units;
 const inp=(e,f,w)=>`<input data-e="${e.id}" data-f="${f}" value="${esc(e[f])}" aria-label="${f}" style="width:${w}">`;
 const sel1=(e,f,opts,cur,dis)=>`<select data-e="${e.id}" data-f="${f}"${dis?" disabled":""}>${opts}</select>`;
 const phO=v=>`<option value="">—</option>`+Object.entries(PHASE).map(([k,p])=>`<option value="${k}"${v===k?" selected":""}>${esc(T_(p.n))}</option>`).join("");
 const stdO=v=>`<option value="">—</option>`+pipeStdList().map(([k,n])=>`<option value="${k}"${v===k?" selected":""}>${esc(T_(n.split(" — ")[0]))}</option>`).join("");
 const npsO=e=>{const S=PIPE_STD[e.std];if(!S||e.std==="custom")return`<option value="">—</option>`;return`<option value="">—</option>`+S.sizes.map(z=>`<option value="${esc(z.k)}"${z.k===String(e.nps)?" selected":""}>${esc(pipeSpecText({std:e.std,nps:z.k,sch:""},"size",U,"")||z.k)}</option>`).join("")};
 const schO=e=>{const z=e.std&&pipeSize(e.std,e.nps);if(!z)return`<option value="">—</option>`;return z.walls.map(w=>`<option value="${esc(w.k)}"${(w.k===e.sch||(w.a||[]).includes(e.sch))?" selected":""}>${esc(w.k+(w.a&&w.a.length?"/"+w.a.join("/"):""))}</option>`).join("")};
 const matO=v=>`<option value="">—</option>`+MATS.map(m=>`<option value="${m[0]}"${v===m[0]?" selected":""}>${esc(m[2])}</option>`).join("");
 $("streamTbl").innerHTML=`<thead><tr><th>Dòng</th><th>Từ</th><th>Đến</th><th>Dịch vụ</th><th>Pha</th><th>P</th><th>T</th><th>Lưu lượng</th><th>Tiêu chuẩn ống</th><th>Size</th><th>Schedule</th><th>Vật liệu</th><th>Pipe class</th><th>Cự ly</th></tr></thead><tbody>`+(rows.length?rows.map(e=>{const tr=isTransport(e);return`<tr><td>${inp(e,"num","4rem")}</td><td>${esc(nodeName(e.from))}</td><td>${esc(nodeName(e.to))}</td><td>${inp(e,"service","9rem")}</td><td>${sel1(e,"phase",phO(e.phase))}</td><td>${inp(e,"P","5.5rem")}</td><td>${inp(e,"T","5.5rem")}</td><td>${inp(e,"flow","6.5rem")}</td><td>${sel1(e,"std",stdO(e.std),0,tr)}</td><td>${sel1(e,"nps",npsO(e),0,tr||!e.std)}</td><td>${sel1(e,"sch",schO(e),0,tr||!e.std)}</td><td>${sel1(e,"mat",matO(e.mat),0,tr)}</td><td>${inp(e,"cls","4.5rem")}</td><td>${inp(e,"dist","5.5rem")}</td></tr>`}).join(""):`<tr><td colspan="14">Chưa có đường ống công nghệ.</td></tr>`)+`</tbody>`;
}
$("streamTbl").addEventListener("change",ev=>{
 const t=ev.target;if(!t.dataset.e)return;const e=state.edges.find(x=>x.id===t.dataset.e);if(!e)return;const f=t.dataset.f;e[f]=t.value;
 if(f==="std"){const z=pipeSize(e.std,e.nps);if(!z){e.nps="";e.sch=""}else if(!z.walls.some(w=>w.k===e.sch||(w.a||[]).includes(e.sch)))e.sch=defaultWall(z)}
 if(f==="nps"){const z=pipeSize(e.std,e.nps);e.sch=z?defaultWall(z):""}
 commit(_("Sửa bảng dòng","Edit stream table"));renderCanvasOnly();renderProps();if(["std","nps"].includes(f))renderStreamTable();
});
function openStreams(){renderStreamTable();openModal("mStreams")}
function renumberStreams(){let i=1;streamRows().forEach(e=>e.num=String(i++));state.nextStream=i;commit(_("Đánh số lại dòng","Renumber streams"));renderStreamTable();renderCanvasOnly();renderProps();setStatus(_("Đã đánh số lại các dòng từ 1.","Streams renumbered from 1."))}
function openEquip(){
 const rows=equipRows();
 $("equipTbl").innerHTML=`<thead><tr><th>Tag</th><th>Tên / mô tả</th><th>Loại</th><th>Thông số thiết bị</th></tr></thead><tbody>`+(rows.length?rows.map(n=>`<tr class="clk" data-id="${n.id}"><td><b>${esc(n.tag)}</b></td><td>${esc(nTitle(n))}</td><td>${esc(T_(SYMBOLS[n.type].label))}</td><td>${esc(String(n.props||"").replace(/\n/g,"; "))}</td></tr>`).join(""):`<tr><td colspan="4">Chưa có thiết bị.</td></tr>`)+`</tbody>`;
 openModal("mEquip");
}
$("equipTbl").addEventListener("click",ev=>{const tr=ev.target.closest&&ev.target.closest("tr[data-id]");if(!tr)return;sel=new Set([tr.dataset.id]);selEdge=null;closeModals();renderAll();announceSel()});
$("histList").addEventListener("click",ev=>{const tr=ev.target.closest&&ev.target.closest("tr[data-i]");if(tr)jumpHist(+tr.dataset.i)});
function openDescribe(){
 const m=state.meta,eq=equipRows(),st=streamRows(),sg=state.edges.filter(e=>!isStream(e)&&(e.from||e.to)),nm=n=>(n.tag?n.tag+" — ":"")+(nTitle(n)||T_(SYMBOLS[n.type].label)),U=m.units;
 const en=LANG==="en",nn=id=>id?nodeName(id):(en?"open end":"đầu hở");
 let s=en?`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Sheet ${m.sheet}.\nThe drawing has ${eq.length} equipment items, ${st.length} streams and ${sg.length} signal or mechanical lines.\n\nEQUIPMENT\n`:`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Khổ giấy ${m.sheet}.\nBản vẽ có ${eq.length} thiết bị, ${st.length} dòng công nghệ và ${sg.length} đường tín hiệu hoặc cơ khí.\n\nTHIẾT BỊ\n`;
 s+=eq.length?eq.map((n,i)=>`${i+1}. ${nm(n)}${n.props?" — "+String(n.props).replace(/\n/g,"; "):""}${(n.xp||[]).length?(en?`; ${n.xp.length} extra connection point(s)`:`; thêm ${n.xp.length} điểm nối ống`):""}.`).join("\n"):_("Chưa có thiết bị.","No equipment.");
 s+=en?"\n\nSTREAMS\n":"\n\nDÒNG CÔNG NGHỆ\n";
 s+=st.length?st.map(e=>{const sp=isTransport(e)?"":edgeSpecTextPlain(e,U);
  return en?`Stream ${e.num||"unnumbered"}: from ${nn(e.from)} to ${nn(e.to)}${e.service?", "+e.service:""}${e.kind!=="process"?", "+T_(KINDS[e.kind]).split(" — ")[0]:""}${e.phase?", phase "+T_(PHASE[e.phase].n).toLowerCase():""}${e.P?", pressure "+e.P:""}${e.T?", temperature "+e.T:""}${e.flow?", flow "+e.flow:""}${e.dist?", distance "+e.dist:""}${sp?", pipe "+sp:""}.`
   :`Dòng ${e.num||"không số"}: từ ${nn(e.from)} đến ${nn(e.to)}${e.service?", "+e.service:""}${e.kind!=="process"?", "+(KINDS[e.kind]||KINDS.process).split(" — ")[0].toLowerCase():""}${e.phase?", pha "+PHASE[e.phase].n.toLowerCase():""}${e.P?", áp suất "+e.P:""}${e.T?", nhiệt độ "+e.T:""}${e.flow?", lưu lượng "+e.flow:""}${e.dist?", cự ly "+e.dist:""}${sp?", ống "+sp:""}.`}).join("\n"):_("Chưa có đường ống.","No pipes.");
 if(sg.length)s+=(en?"\n\nSIGNAL / MECHANICAL\n":"\n\nTÍN HIỆU / CƠ KHÍ\n")+sg.map(e=>en?`From ${nn(e.from)} to ${nn(e.to)} (${T_(KINDS[e.kind]).split(" — ")[0]}).`:`Từ ${nn(e.from)} đến ${nn(e.to)} (${(KINDS[e.kind]||KINDS.process).split(" — ")[0]}).`).join("\n");
 if(state.shapes.length)s+=en?`\n\nThe drawing also contains ${state.shapes.length} freehand annotation shape(s).`:`\n\nBản vẽ còn có ${state.shapes.length} hình vẽ chú thích tự do.`;
 const lone=eq.filter(n=>!state.edges.some(e=>e.from===n.id||e.to===n.id));
 if(lone.length)s+=(en?"\n\nNOTE: no pipe connected to ":"\n\nLƯU Ý: chưa nối ống cho ")+lone.map(n=>n.tag||nTitle(n)).join(", ")+".";
 $("descTxt").textContent=s;openModal("mDesc");$("descTxt").focus();
}
function edgeSpecTextPlain(e,U){const c=e.std?pipeCalc(e):null;if(!c)return e.size||"";const base=pipeSpecText(e,"sch",U,"");const mt=e.mat?(e.mat==="other"?e.matOther:T_(matDef(e.mat)[1])):"";return[base,mt,e.cls].filter(Boolean).join(", ")}

/* ============ TOOLTIP KHI RÊ CHUỘT ============ */
const tipEl=$("tip");let tipKey="";
function setTips(v){TIPS=!!v;if(!TIPS)hideTip();savePrefs()}
function hideTip(){tipEl.style.display="none";tipKey=""}
function tipFor(t){
 const cl=q=>t&&t.closest?t.closest(q):null,pe=cl("[data-port]"),ne=cl(".node"),ee=cl("[data-edge]"),he=cl("[data-handle]"),se=cl("[data-shape]");
 if(he)return{k:"h"+he.dataset.handle,h:`<b>${_("Tay nắm đường ống","Line handle")}</b>\n${_("Kéo để dời đoạn ống đứng / ngang","Drag to move the vertical / horizontal segment")}`};
 if(pe){const n=getNode(pe.dataset.node);if(!n)return null;const p=symDef(n).ports.find(q=>q.id===pe.dataset.port);const lb=p&&p.l?` “${esc(p.l)}”`:"";return{k:"p"+pe.dataset.node+pe.dataset.port+lb,h:`<b>${_("Cổng","Port")} ${esc(pe.dataset.port)}${lb}</b> — ${esc(n.tag||nTitle(n))}${pe.dataset.xp?`\n${_("Điểm nối thêm — giữ Alt và kéo để dời","Custom port — hold Alt and drag to move")}`:""}\n${_("Kéo sang thiết bị khác để nối ống","Drag to another device to connect")}`}}
 if(ne){
  const n=getNode(ne.dataset.id);if(!n)return null;const sy=SYMBOLS[n.type];
  const inn=state.edges.filter(e=>e.to===n.id),out=state.edges.filter(e=>e.from===n.id);
  const lb=T_(sy.label);
  let h=`<b>${esc(n.tag||lb)}</b>${n.title&&n.title!==sy.label?" — "+esc(nTitle(n)):""}\n${_("Loại","Type")}: ${esc(lb)}${sy.vars.length>1?`\n${_("Kiểu vẽ","Style")}: `+esc(T_(varOf(n).n)):""}`;
  if(n.type==="text"||n.type==="area")return{k:"n"+n.id+n.title,h:`<b>${esc(lb)}</b>\n${esc(n.title)}`};
  if(n.props)h+=`\n${_("Thông số","Parameters")}: `+esc(String(n.props).replace(/\n/g,"; "));
  if((n.xp||[]).length)h+=`\n${_("Điểm nối thêm","Extra ports")}: ${n.xp.map(p=>esc(p.l||p.id)).join(", ")}`;
  if(inn.length)h+=`\n${_("Vào","In")}: `+inn.map(e=>_("dòng ","stream ")+(e.num||_("không số","n/a"))+_(" từ "," from ")+esc(nodeName(e.from))).join(", ");
  if(out.length)h+=`\n${_("Ra","Out")}: `+out.map(e=>_("dòng ","stream ")+(e.num||_("không số","n/a"))+" → "+esc(nodeName(e.to))).join(", ");
  if(!inn.length&&!out.length)h+=`\n${_("(chưa nối ống)","(no pipe connected)")}`;
  return{k:"n"+n.id+"|"+h,h};
 }
 if(ee){
  const e=state.edges.find(x=>x.id===ee.dataset.edge);if(!e)return null;
  let h=`<b>${e.kind==="signal"?_("Tín hiệu","Signal"):_("Dòng ","Stream ")+(e.num||_("không số","n/a"))}</b>${e.service?" — "+esc(e.service):""}\n${esc(nodeName(e.from))} → ${esc(nodeName(e.to))}`;
  const f=[];if(e.phase)f.push(_("Pha","Phase")+": "+T_(PHASE[e.phase].n));
  const sp=edgeSpecTextPlain(e,state.meta.units);if(sp&&!isTransport(e))f.push(_("Ống","Pipe")+": "+esc(sp));
  if(e.P)f.push("P: "+esc(e.P));if(e.T)f.push("T: "+esc(e.T));if(e.flow)f.push(_("Lưu lượng","Flow")+": "+esc(e.flow));if(e.dist)f.push(_("Cự ly","Distance")+": "+esc(e.dist));
  if(f.length)h+="\n"+f.join(" • ");h+=`\n${_("Loại","Type")}: `+esc(T_(KINDS[e.kind]));
  return{k:"e"+e.id+"|"+h,h};
 }
 if(se){const hh=getShape(se.dataset.shape);if(hh)return{k:"s"+hh.id,h:`<b>${_("Hình vẽ","Shape")}</b>: ${esc(T_(SHAPE_T[hh.t]))}`}}
 return null;
}
function showTip(ev){
 if(!TIPS||ptr||(conn&&conn.dragging)){hideTip();return}
 const r=tipFor(ev.target);if(!r){hideTip();return}
 if(r.k!==tipKey){tipKey=r.k;tipEl.innerHTML=r.h}
 tipEl.style.display="block";
 const w=tipEl.offsetWidth,h=tipEl.offsetHeight;let x=ev.clientX+16,y=ev.clientY+18;
 if(x+w>innerWidth-6)x=ev.clientX-w-12;if(y+h>innerHeight-6)y=ev.clientY-h-12;
 tipEl.style.left=Math.max(4,x)+"px";tipEl.style.top=Math.max(4,y)+"px";
}
board.addEventListener("pointermove",showTip);
board.addEventListener("pointerleave",hideTip);
board.addEventListener("pointerdown",hideTip);
board.addEventListener("wheel",hideTip);

/* ============ KIỂM TRA BẢN VẼ ============ */
function runChecks(){
 const out=[],add=(sev,msg,ref)=>out.push({sev,msg,ref});
 const real=state.nodes.filter(n=>!["text","area","note"].includes(n.type));
 const connected=new Set();state.edges.forEach(e=>{connected.add(e.from);connected.add(e.to)});
 real.forEach(n=>{if(!connected.has(n.id))add("w",_(`${nodeName(n.id)} (${T_(SYMBOLS[n.type].label)}) chưa nối ống.`,`${nodeName(n.id)} (${T_(SYMBOLS[n.type].label)}) has no pipe connected.`),{n:n.id})});
 const tags={};real.forEach(n=>{if(n.tag&&!SYMBOLS[n.type].nolabel)(tags[n.tag]=tags[n.tag]||[]).push(n)});
 Object.entries(tags).forEach(([t,a])=>{if(a.length>1)add("e",_(`Trùng tag ${t}: ${a.length} thiết bị dùng cùng số hiệu.`,`Duplicate tag ${t}: ${a.length} devices share the number.`),{n:a[0].id})});
 const pe=state.edges.filter(isStream),nums={};
 pe.forEach(e=>{if(e.num==="")add("w",_(`Đường ${nodeName(e.from)} → ${nodeName(e.to)} chưa có số dòng.`,`Line ${nodeName(e.from)} → ${nodeName(e.to)} has no stream number.`),{e:e.id});else(nums[e.num]=nums[e.num]||[]).push(e)});
 Object.entries(nums).forEach(([k,a])=>{if(a.length>1)add("e",_(`Số dòng ${k} bị dùng ${a.length} lần.`,`Stream number ${k} is used ${a.length} times.`),{e:a[0].id})});
 pe.filter(e=>!isTransport(e)).forEach(e=>{
  const miss=[];if(!e.service)miss.push(_("dịch vụ","service"));if(!e.P)miss.push(_("áp suất","pressure"));if(!e.T)miss.push(_("nhiệt độ","temperature"));
  if(miss.length)add("i",_(`Dòng ${e.num||"?"} (${nodeName(e.from)} → ${nodeName(e.to)}) thiếu: ${miss.join(", ")}.`,`Stream ${e.num||"?"} (${nodeName(e.from)} → ${nodeName(e.to)}) is missing: ${miss.join(", ")}.`),{e:e.id});
  const m2=[];if(!(e.std&&e.nps)&&!e.size)m2.push(_("size","size"));if(e.std&&e.std!=="custom"&&e.nps&&!e.sch)m2.push("schedule");if(!e.mat)m2.push(_("vật liệu","material"));
  if(m2.length)add("i",_(`Dòng ${e.num||"?"} chưa có quy cách ống: ${m2.join(", ")}.`,`Stream ${e.num||"?"} has no pipe spec: ${m2.join(", ")}.`),{e:e.id});
 });
 const pc={};state.edges.forEach(e=>{[[e.from,e.fromPort],[e.to,e.toPort]].forEach(([i,p])=>{const k=i+"|"+p;pc[k]=(pc[k]||0)+1})});
 Object.entries(pc).forEach(([k,c])=>{if(c>1){const[i,p]=k.split("|"),n=getNode(i);if(n&&!SYMBOLS[n.type].nolabel&&n.type!=="manifold")add("w",_(`Cổng ${p} của ${nodeName(i)} có ${c} ống nối — hãy thêm điểm nối ống (phím P) hoặc dùng “Điểm rẽ nhánh (tee)”.`,`Port ${p} of ${nodeName(i)} has ${c} pipes — add another connection point (key P) or use a “Tee / branch point”.`),{n:i})}});
 real.forEach(n=>{if(SYMBOLS[n.type].bub&&!state.edges.some(e=>e.kind==="signal"&&(e.from===n.id||e.to===n.id)))add("i",_(`${nodeName(n.id)} chưa có đường tín hiệu nối vào thiết bị / van.`,`${nodeName(n.id)} has no signal line to a device / valve.`),{n:n.id})});
 state.edges.forEach(e=>{const a=getNode(e.from),b=getNode(e.to);if(!a||!b)return;if(b.type==="feed")add("w",_(`Ống đi vào ký hiệu “Dòng vào” (${nodeName(b.id)}) — đảo chiều?`,`Pipe enters a “Feed” symbol (${nodeName(b.id)}) — reverse it?`),{e:e.id});if(a.type==="product")add("w",_(`Ống đi ra từ ký hiệu “Dòng ra” (${nodeName(a.id)}) — đảo chiều?`,`Pipe leaves a “Product” symbol (${nodeName(a.id)}) — reverse it?`),{e:e.id})});
 for(let i=0;i<real.length;i++)for(let j=i+1;j<real.length;j++){
  const a=real[i],b=real[j];if(SYMBOLS[a.type].nolabel||SYMBOLS[b.type].nolabel)continue;
  const ea=extOf(a,1,"sym"),eb=extOf(b,1,"sym");
  if(Math.abs(a.x-b.x)<ea.hw+eb.hw-6&&Math.abs(a.y-b.y)<ea.hh+eb.hh-6)add("w",_(`${nodeName(a.id)} và ${nodeName(b.id)} chồng lên nhau — thử “Tránh chồng lấn”.`,`${nodeName(a.id)} and ${nodeName(b.id)} overlap — try “Remove overlaps”.`),{n:a.id});
 }
 if(state.meta.showSheet){const L=sheetLayout();real.forEach(n=>{const e=extOf(n,1,"sym");if(n.x-e.hw<L.fx0||n.x+e.hw>L.fx1||n.y-e.hh<L.fy0||n.y+e.hh>L.fy1)add("w",_(`${nodeName(n.id)} nằm ngoài khung giấy ${state.meta.sheet}. Thử ⤢ Vừa khổ giấy.`,`${nodeName(n.id)} is outside the ${state.meta.sheet} frame. Try ⤢ Fit to sheet.`),{n:n.id})})}
 if(!state.meta.drawnBy)add("i",_("Khung tên chưa ghi người vẽ.","Title block has no “drawn by”."),null);
 return out;
}
function openChecks(){
 const r=runChecks(),c={e:0,w:0,i:0};r.forEach(x=>c[x.sev]++);
 $("chkSum").textContent=r.length?_(`Phát hiện ${c.e} lỗi, ${c.w} cảnh báo, ${c.i} gợi ý. Bấm một dòng để chọn đối tượng trên bản vẽ.`,`Found ${c.e} error(s), ${c.w} warning(s), ${c.i} hint(s). Click a row to select the object on the drawing.`):_("Không phát hiện vấn đề nào. Bản vẽ ổn.","No problems found. The drawing looks fine.");
 const lab={e:_("Lỗi","Error"),w:_("Cảnh báo","Warning"),i:_("Gợi ý","Hint")};
 $("chkTbl").innerHTML=`<thead><tr><th>${_("Mức","Level")}</th><th>${_("Nội dung","Message")}</th></tr></thead><tbody>`+(r.length?r.map((x,i)=>`<tr class="${x.ref?"clk":""}" data-i="${i}"><td class="sev-${x.sev}">${lab[x.sev]}</td><td>${esc(x.msg)}</td></tr>`).join(""):`<tr><td colspan="2">✔ ${_("Không có vấn đề.","No problems.")}</td></tr>`)+`</tbody>`;
 $("chkTbl")._r=r;openModal("mChecks");
}
$("chkTbl").addEventListener("click",ev=>{
 const tr=ev.target.closest&&ev.target.closest("tr[data-i]");if(!tr)return;const x=$("chkTbl")._r[+tr.dataset.i];if(!x||!x.ref)return;
 closeModals();
 if(x.ref.n){sel=new Set([x.ref.n]);selEdge=null;renderAll();announceSel()}else if(x.ref.e){selectEdge(x.ref.e)}
});
