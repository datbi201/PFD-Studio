/* ============ ẢNH NỀN / BẢN SCAN: NHẬP ẢNH & PDF SCAN, DỰNG LẠI NÉT THẲNG ============ */
const UNDER_DATA={};            /* id → data URL (JPEG đã giảm kích thước) */
let UNDER_PDF=null;             /* {bytes, imgs:[{...}], idx} — chỉ giữ trong phiên */
let underKey="";
const underOK=()=>!!(state.under&&UNDER_DATA[state.under.id]);

/* ---------- hiển thị ---------- */
function underMarkup(it){
 const u=state.under;if(!u||!u.vis||!UNDER_DATA[u.id])return"";
 if(!it&&!u.print)return"";
 return`<image href="${UNDER_DATA[u.id]}" x="${r3(u.x)}" y="${r3(u.y)}" width="${r3(u.w)}" height="${r3(u.h)}" preserveAspectRatio="none" opacity="${u.op}"/>`;
}
function renderUnder(){
 const g=$("gUnder");if(!g)return;const u=state.under;
 const key=u&&UNDER_DATA[u.id]?[u.id,u.x,u.y,u.w,u.h,u.op,u.vis,u.unlock].join("|"):"";
 if(key===underKey)return;underKey=key;
 if(!key){g.innerHTML="";g.removeAttribute("pointer-events");return}
 g.setAttribute("pointer-events",u.unlock?"all":"none");
 g.innerHTML=u.vis?`<image data-under="1" href="${UNDER_DATA[u.id]}" x="${r3(u.x)}" y="${r3(u.y)}" width="${r3(u.w)}" height="${r3(u.h)}" preserveAspectRatio="none" opacity="${u.op}" style="${u.unlock?"cursor:move":""}"/>`+(u.unlock?`<rect x="${r3(u.x)}" y="${r3(u.y)}" width="${r3(u.w)}" height="${r3(u.h)}" fill="none" stroke="#1677ff" stroke-width="1.5" stroke-dasharray="8 5" vector-effect="non-scaling-stroke" pointer-events="none"/>`:""):"";
}
/* kéo ảnh nền khi đã mở khoá */
window.addEventListener("pointerdown",ev=>{
 const u=state.under;if(!u||!u.unlock||!u.vis||ev.button!==0||(typeof CAD!=="undefined"&&CAD.cmd))return;
 const t=ev.target;if(!t||!t.closest||!t.closest("[data-under]"))return;
 ev.preventDefault();ev.stopImmediatePropagation();
 const w=worldPt(ev);ptr={type:"under",w0:w,x:u.x,y:u.y,moved:false};
},true);
window.addEventListener("pointermove",ev=>{
 if(!ptr||ptr.type!=="under"||!state.under)return;
 const w=worldPt(ev);state.under.x=ptr.x+w.x-ptr.w0.x;state.under.y=ptr.y+w.y-ptr.w0.y;ptr.moved=true;renderUnder();
});
window.addEventListener("pointerup",()=>{if(ptr&&ptr.type==="under"){const m=ptr.moved;ptr=null;if(m){commit(_("Dời ảnh nền","Move underlay"));renderUnderPanel()}}},true);

/* ---------- nạp ảnh ---------- */
function loadImgEl(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error(_("Không đọc được ảnh (định dạng không hỗ trợ?).","Cannot read the image (unsupported format?).")));im.src=src})}
function drawToJpeg(src,maxPx){
 return loadImgEl(src).then(im=>{
  const sc=Math.min(1,(maxPx||2000)/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height)),w=Math.max(1,Math.round((im.naturalWidth||im.width)*sc)),h=Math.max(1,Math.round((im.naturalHeight||im.height)*sc));
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
  return{url:c.toDataURL("image/jpeg",.78),w,h};
 });
}
function placeUnder(img){
 const id="u"+Date.now().toString(36);UNDER_DATA[id]=img.url;
 const L=sheetLayout(),ax=L.use.l,ay=L.use.t,aw=L.use.r-L.use.l,ah=L.use.b-L.use.t,k=Math.min(aw/img.w,ah/img.h),w=img.w*k,h=img.h*k;
 state.under={id,x:ax+(aw-w)/2,y:ay+(ah-h)/2,w,h,op:.5,vis:true,print:false,unlock:false};
 underKey="";commit(_("Nhập ảnh nền","Import underlay image"));renderAll();renderUnderPanel();
}
function importUnderFile(ev){
 const f=ev.target.files[0];ev.target.value="";if(!f)return;
 const isPdf=/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name);
 const done=img=>{placeUnder(img);setStatus(_("Đã nhập ảnh nền. Dùng bảng “Ảnh nền / bản scan” để chỉnh độ mờ, vị trí, cỡ; rồi vẽ đè lên hoặc dùng “Tự nhận đường ngang / dọc”.","Underlay imported. Use the “Underlay / scan” panel to adjust opacity, position and size; then draw over it or use “Auto-detect horizontal / vertical lines”."))};
 const fail=e=>setStatus(_("Không nhập được: ","Cannot import: ")+(e&&e.message||e));
 if(!isPdf){const r=new FileReader();r.onload=()=>drawToJpeg(r.result).then(done,fail);r.onerror=()=>fail(new Error("read"));r.readAsDataURL(f);return}
 f.arrayBuffer().then(buf=>importPdfBytes(new Uint8Array(buf),0)).then(done,fail);
}

/* ---------- PDF scan: lấy ảnh nhúng trong PDF ---------- */
function pdfFindImages(bytes){
 let s="";const CH=32768;for(let i=0;i<bytes.length;i+=CH)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH));
 const out=[],re=/(\d+)\s+(\d+)\s+obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g;let m;
 while((m=re.exec(s))){
  const d=m[3];if(!/\/Subtype\s*\/Image/.test(d))continue;
  const start=re.lastIndex;let end=s.indexOf("endstream",start);if(end<0)continue;
  let len=-1;const lm=/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(d);if(lm)len=+lm[1];
  if(len<0||start+len>end)len=end-start;
  const num=k=>{const r=new RegExp("\\/"+k+"\\s+(\\d+)").exec(d);return r?+r[1]:0};
  const fl=(/\/Filter\s*(\[[^\]]*\]|\/\w+)/.exec(d)||[0,""])[1],filters=fl.match(/\/\w+/g)||[];
  const cs=(/\/ColorSpace\s*(\/\w+|\[[^\]]*\])/.exec(d)||[0,""])[1],dp=/\/Predictor\s+(\d+)/.exec(d),cols=/\/Columns\s+(\d+)/.exec(d),dec=/\/Decode\s*\[\s*1\s+0\s*\]/.test(d);
  out.push({w:num("Width"),h:num("Height"),bpc:num("BitsPerComponent")||8,filters:filters.map(x=>x.slice(1)),cs,pred:dp?+dp[1]:1,cols:cols?+cols[1]:0,inv:dec,start,len,mask:/\/ImageMask\s+true/.test(d)});
 }
 return out;
}
async function inflate(u8){
 if(typeof DecompressionStream==="undefined")throw new Error(_("Trình duyệt chưa hỗ trợ giải nén Flate (cần Chrome / Edge / Firefox bản mới).","This browser has no Flate decompression (use a recent Chrome / Edge / Firefox)."));
 const ds=new DecompressionStream("deflate"),w=ds.writable.getWriter();w.write(u8);w.close();
 return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
function pngUnpredict(d,rowBytes,bpp){
 const rows=d.length/(rowBytes+1)|0,out=new Uint8Array(rows*rowBytes);
 for(let y=0;y<rows;y++){
  const ft=d[y*(rowBytes+1)],src=y*(rowBytes+1)+1,dst=y*rowBytes;
  for(let x=0;x<rowBytes;x++){
   const a=x>=bpp?out[dst+x-bpp]:0,b=y?out[dst-rowBytes+x]:0,c=(x>=bpp&&y)?out[dst-rowBytes+x-bpp]:0;let v=d[src+x];
   if(ft===1)v+=a;else if(ft===2)v+=b;else if(ft===3)v+=(a+b)>>1;else if(ft===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c)}
   out[dst+x]=v&255;
  }
 }
 return out;
}
async function pdfImageToJpeg(bytes,im){
 const raw=bytes.subarray(im.start,im.start+im.len),f=im.filters;
 if(f.includes("DCTDecode")&&f[f.length-1]==="DCTDecode"&&f.length===1){
  const url="data:image/jpeg;base64,"+u8b64(raw);return drawToJpeg(url);
 }
 if(f.includes("CCITTFaxDecode")||f.includes("JBIG2Decode")||f.includes("JPXDecode"))throw new Error(_("Ảnh scan dùng nén "+f.join("+")+" — chưa giải mã được trong bản này. Hãy xuất trang đó thành ảnh JPG/PNG rồi nhập ảnh.","This scan uses "+f.join("+")+" compression — not decodable in this version. Export the page as a JPG/PNG image and import that."));
 if(f.length===1&&f[0]==="FlateDecode"){
  let d=await inflate(raw);const ncomp=/DeviceRGB/.test(im.cs)?3:/DeviceGray|DeviceCMYK/.test(im.cs)?(/CMYK/.test(im.cs)?4:1):(im.cs?0:1);
  if(!ncomp||ncomp===4)throw new Error(_("Không hỗ trợ không gian màu "+(im.cs||"?")+" của ảnh nhúng.","Unsupported colour space "+(im.cs||"?")+" of the embedded image."));
  const bits=im.bpc,rowBytes=Math.ceil(im.w*ncomp*bits/8);
  if(im.pred>=10)d=pngUnpredict(d,rowBytes,Math.max(1,Math.round(ncomp*bits/8)));
  if(d.length<rowBytes*im.h)throw new Error(_("Dữ liệu ảnh nhúng bị thiếu.","The embedded image data is incomplete."));
  const c=document.createElement("canvas");c.width=im.w;c.height=im.h;const x=c.getContext("2d"),id=x.createImageData(im.w,im.h),o=id.data;
  for(let y=0;y<im.h;y++)for(let px=0;px<im.w;px++){
   let r,g,b;
   if(bits===1){const bit=(d[y*rowBytes+(px>>3)]>>(7-(px&7)))&1,v=(im.inv?1-bit:bit)*255;r=g=b=v}
   else if(bits===8){const i=y*rowBytes+px*ncomp;if(ncomp===1){r=g=b=im.inv?255-d[i]:d[i]}else{r=d[i];g=d[i+1];b=d[i+2]}}
   else throw new Error(_("Chưa hỗ trợ ảnh nhúng "+bits+" bit.","Embedded "+bits+"-bit images are not supported."));
   const q=(y*im.w+px)*4;o[q]=r;o[q+1]=g;o[q+2]=b;o[q+3]=255;
  }
  x.putImageData(id,0,0);return drawToJpeg(c.toDataURL("image/png"));
 }
 throw new Error(_("Kiểu nén ảnh “"+f.join("+")+"” chưa hỗ trợ.","Image compression “"+f.join("+")+"” is not supported."));
}
function u8b64(u8){let s="";const CH=32768;for(let i=0;i<u8.length;i+=CH)s+=String.fromCharCode.apply(null,u8.subarray(i,i+CH));return btoa(s)}
async function importPdfBytes(bytes,idx){
 const imgs=pdfFindImages(bytes).filter(i=>i.w>0&&i.h>0&&!i.mask);
 if(!imgs.length){
  const r=await pdfJsFallback(bytes).catch(()=>null);if(r)return r;
  throw new Error(_("PDF này không chứa ảnh scan (có thể là PDF vector) hoặc không đọc được. Hãy xuất trang PDF thành ảnh JPG/PNG rồi nhập ảnh.","This PDF holds no scanned image (it may be a vector PDF) or cannot be read. Export the PDF page as a JPG/PNG image and import that."));
 }
 UNDER_PDF={bytes,imgs,idx};
 const big=imgs.map((m,i)=>({i,a:m.w*m.h})).filter(o=>o.a>=Math.max(...imgs.map(m=>m.w*m.h))*.3).map(o=>o.i),use=Math.min(imgs.length-1,Math.max(0,idx||big[0]));
 UNDER_PDF.idx=use;
 const r=await pdfImageToJpeg(bytes,imgs[use]).catch(async e=>{const fb=await pdfJsFallback(bytes).catch(()=>null);if(fb)return fb;throw e});
 return r;
}
/* phương án dự phòng: pdf.js từ CDN (cần mạng; không bắt buộc) */
async function pdfJsFallback(bytes){
 if(typeof navigator!=="undefined"&&navigator.onLine===false)return null;
 if(!window.pdfjsLib){
  await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=res;s.onerror=()=>rej(new Error("no net"));document.head.appendChild(s);setTimeout(()=>rej(new Error("timeout")),8000)});
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
 }
 const doc=await window.pdfjsLib.getDocument({data:bytes.slice()}).promise,pg=await doc.getPage(1),vp0=pg.getViewport({scale:1}),sc=2000/Math.max(vp0.width,vp0.height),vp=pg.getViewport({scale:sc});
 const c=document.createElement("canvas");c.width=Math.round(vp.width);c.height=Math.round(vp.height);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);
 await pg.render({canvasContext:x,viewport:vp}).promise;
 return{url:c.toDataURL("image/jpeg",.8),w:c.width,h:c.height};
}

/* ---------- bảng điều khiển ảnh nền ---------- */
function renderUnderPanel(){
 const box=$("underBox");if(!box)return;const u=state.under,ok=underOK();
 const mm=v=>+(v/MM).toFixed(1);
 let s=`<button class="btn primary" style="width:100%" onclick="$('underFile').click()">📥 ${_("Nhập ảnh / PDF scan…","Import image / scanned PDF…")}</button>`;
 if(u&&!ok)s+=`<div class="warnbox">${_("Ảnh nền của bản vẽ này không còn dữ liệu trong bộ nhớ (chỉ giữ khi lưu tệp JSON). Nhập lại ảnh nếu cần.","This drawing's underlay image data is not in memory (it is kept only when saving the JSON file). Import the image again if needed.")}</div>`;
 if(u&&ok){
  s+=`<label class="chk"><input type="checkbox" id="unVis"${u.vis?" checked":""}>${_("Hiện ảnh nền","Show underlay")}</label>
  <label class="chk"><input type="checkbox" id="unPrint"${u.print?" checked":""}>${_("In / xuất kèm ảnh nền","Include underlay when printing / exporting")}</label>
  <label class="chk"><input type="checkbox" id="unLock"${u.unlock?" checked":""}>${_("Mở khoá để kéo ảnh bằng chuột","Unlock to drag the image with the mouse")}</label>
  <label for="unOp">${_("Độ đậm ảnh nền","Underlay opacity")}: <span id="unOpV">${Math.round(u.op*100)}%</span></label><input id="unOp" type="range" min="0.05" max="1" step="0.05" value="${u.op}">
  <div class="row"><div><label for="unX">X (mm giấy)</label><input id="unX" type="number" step="1" value="${mm(u.x)}"></div><div><label for="unY">Y (mm giấy)</label><input id="unY" type="number" step="1" value="${mm(u.y)}"></div></div>
  <div class="row"><div><label for="unW">${_("Rộng (mm giấy)","Width (paper mm)")}</label><input id="unW" type="number" min="1" step="1" value="${mm(u.w)}"></div><div><label for="unH">${_("Cao (mm giấy)","Height (paper mm)")}</label><input id="unH" type="number" min="1" step="1" value="${mm(u.h)}"></div></div>
  <div class="grid2"><button class="btn" id="unFit">⤢ ${_("Vừa khung giấy","Fit to frame")}</button><button class="btn danger" id="unDel">🗑 ${_("Gỡ ảnh nền","Remove")}</button></div>
  <div class="sect">${_("Dựng lại nét từ ảnh (bước đầu)","Rebuild lines from the image (first step)")}</div>
  <div class="hint">${_("Tự tìm các đường NGANG và DỌC rõ nét trong ảnh rồi tạo thành đường thẳng có thể sửa được. Chưa nhận đường chéo, đường cong, chữ, ký hiệu — hãy vẽ thêm bằng công cụ. Nên mở độ đậm ảnh nền ≥ 50% để đối chiếu.","Finds clear HORIZONTAL and VERTICAL lines in the image and turns them into editable straight lines. Diagonals, curves, text and symbols are not recognised — draw those with the tools. Keep the underlay opacity ≥ 50% for comparison.")}</div>
  <label for="trMin">${_("Độ dài nét tối thiểu (% bề rộng ảnh)","Minimum line length (% of image width)")}: <span id="trMinV">4</span>%</label><input id="trMin" type="range" min="1" max="20" step="1" value="4">
  <label for="trTh">${_("Ngưỡng nét đen (0 = tự động)","Dark threshold (0 = auto)")}: <span id="trThV">0</span></label><input id="trTh" type="range" min="0" max="250" step="5" value="0">
  <button class="btn primary" style="width:100%;margin-top:.4rem" id="trGo">✨ ${_("Tự nhận đường ngang / dọc → tạo nét vẽ","Auto-detect horizontal / vertical lines → create lines")}</button>`;
  if(UNDER_PDF&&UNDER_PDF.imgs.length>1)s+=`<label for="unPg">${_("Ảnh số (trong PDF có "+UNDER_PDF.imgs.length+" ảnh)","Image no. (the PDF has "+UNDER_PDF.imgs.length+" images)")}</label><input id="unPg" type="number" min="1" max="${UNDER_PDF.imgs.length}" value="${UNDER_PDF.idx+1}"><button class="btn" style="width:100%;margin-top:.3rem" id="unPgGo">${_("Lấy ảnh số này","Use this image")}</button>`;
  if(cadOn())s+=`<div class="hint" style="margin-top:.4rem">${_("SimCAD: gõ lệnh CAL để chỉnh tỉ lệ ảnh bằng hai điểm đã biết khoảng cách thật.","SimCAD: type the CAL command to scale the image using two points of known real distance.")}</div>`;
 }
 box.innerHTML=s;
 if(!(u&&ok))return;
 const upd=()=>{underKey="";renderUnder()};
 $("unVis").addEventListener("change",e=>{u.vis=e.target.checked;upd();commit(_("Hiện / ẩn ảnh nền","Toggle underlay"))});
 $("unPrint").addEventListener("change",e=>{u.print=e.target.checked;commit(_("In kèm ảnh nền","Print underlay"))});
 $("unLock").addEventListener("change",e=>{u.unlock=e.target.checked;upd();setStatus(u.unlock?_("Ảnh nền đã mở khoá: kéo ảnh để dời. Nhớ khoá lại trước khi vẽ.","Underlay unlocked: drag the image to move it. Lock it again before drawing."):_("Ảnh nền đã khoá.","Underlay locked."))});
 $("unOp").addEventListener("input",e=>{u.op=+e.target.value;$("unOpV").textContent=Math.round(u.op*100)+"%";upd()});$("unOp").addEventListener("change",()=>commit(_("Độ đậm ảnh nền","Underlay opacity")));
 const num=(id,fn)=>{const e=$(id);e.addEventListener("input",()=>{const v=parseFloat(e.value);if(isFinite(v)){fn(v*MM);upd()}});e.addEventListener("change",()=>{commit(_("Chỉnh ảnh nền","Adjust underlay"))})};
 num("unX",v=>u.x=v);num("unY",v=>u.y=v);
 const asp=u.w/u.h;
 num("unW",v=>{u.w=Math.max(4,v);u.h=u.w/asp;$("unH").value=+(u.h/MM).toFixed(1)});num("unH",v=>{u.h=Math.max(4,v);u.w=u.h*asp;$("unW").value=+(u.w/MM).toFixed(1)});
 $("unFit").addEventListener("click",()=>{const L=sheetLayout(),aw=L.use.r-L.use.l,ah=L.use.b-L.use.t,k=Math.min(aw/u.w,ah/u.h);u.w*=k;u.h*=k;u.x=L.use.l+(aw-u.w)/2;u.y=L.use.t+(ah-u.h)/2;upd();commit(_("Vừa khung giấy","Fit underlay"));renderUnderPanel()});
 $("unDel").addEventListener("click",()=>{state.under=null;UNDER_PDF=null;underKey="";commit(_("Gỡ ảnh nền","Remove underlay"));renderAll();renderUnderPanel()});
 $("trMin").addEventListener("input",e=>{$("trMinV").textContent=e.target.value});$("trTh").addEventListener("input",e=>{$("trThV").textContent=e.target.value});
 $("trGo").addEventListener("click",()=>traceUnder(+$("trMin").value,+$("trTh").value));
 const pg=$("unPgGo");if(pg)pg.addEventListener("click",async()=>{try{const i=Math.max(1,Math.min(UNDER_PDF.imgs.length,+$("unPg").value||1))-1,img=await pdfImageToJpeg(UNDER_PDF.bytes,UNDER_PDF.imgs[i]);UNDER_PDF.idx=i;UNDER_DATA[u.id]=img.url;underKey="";renderUnder();commit(_("Đổi ảnh trong PDF","Change PDF image"));setStatus(_("Đã lấy ảnh số "+(i+1),"Using image no. "+(i+1)))}catch(e){setStatus(e.message)}});
}

/* ---------- tự nhận đường ngang / dọc ---------- */
function otsu(gray){const h=new Array(256).fill(0);gray.forEach(v=>h[v]++);const tot=gray.length;let sum=0;for(let i=0;i<256;i++)sum+=i*h[i];let sB=0,wB=0,best=0,th=128;for(let t=0;t<256;t++){wB+=h[t];if(!wB)continue;const wF=tot-wB;if(!wF)break;sB+=t*h[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=t}}return th}
function runsOf(bin,W,H,minLen,transpose){
 const at=(a,b)=>transpose?bin[b*W+a]:bin[a*W+b],A=transpose?W:H,B=transpose?H:W; /* a = hàng/cột, b = vị trí dọc theo */
 const active=[],done=[];
 for(let a=0;a<A;a++){
  const runs=[];let b=0;
  while(b<B){
   if(at(a,b)){const s=b;let last=b;while(b<B&&(at(a,b)||(b+1<B&&at(a,b+1)))){if(at(a,b))last=b;b++}if(last-s+1>=minLen)runs.push([s,last]);}else b++;
  }
  const next=[];
  runs.forEach(r=>{
   let m=null;for(const g of active){if(g.a===a-1){const ov=Math.min(g.b1,r[1])-Math.max(g.b0,r[0]);if(ov>=.5*Math.min(g.b1-g.b0,r[1]-r[0])){m=g;break}}}
   if(m){m.a=a;m.sum+=a;m.n++;m.b0=Math.min(m.b0,r[0]);m.b1=Math.max(m.b1,r[1]);next.push(m)}else next.push({a,sum:a,n:1,b0:r[0],b1:r[1]});
  });
  active.forEach(g=>{if(g.a!==a)done.push(g)});
  active.length=0;active.push(...next);
 }
 active.forEach(g=>done.push(g));
 return done.filter(g=>g.n<=14).map(g=>({p:g.sum/g.n,b0:g.b0,b1:g.b1}));
}
async function traceUnder(minPct,thr){
 const u=state.under;if(!u||!UNDER_DATA[u.id])return;
 setStatus(_("Đang phân tích ảnh…","Analysing the image…"));
 try{
  const im=await loadImgEl(UNDER_DATA[u.id]),sc=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),W=Math.max(1,Math.round(im.naturalWidth*sc)),H=Math.max(1,Math.round(im.naturalHeight*sc));
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);x.drawImage(im,0,0,W,H);
  const d=x.getImageData(0,0,W,H).data,gray=new Uint8Array(W*H);for(let i=0;i<W*H;i++)gray[i]=(d[i*4]*.299+d[i*4+1]*.587+d[i*4+2]*.114)|0;
  const th=thr>0?thr:Math.min(200,Math.max(60,otsu(gray)-10)),bin=new Uint8Array(W*H);for(let i=0;i<W*H;i++)bin[i]=gray[i]<th?1:0;
  const minLen=Math.max(10,Math.round(W*minPct/100));
  const hs=runsOf(bin,W,H,minLen,false),vs=runsOf(bin,W,H,minLen,true);
  const sx=u.w/W,sy=u.h/H,segs=[];
  hs.forEach(r=>segs.push([{x:u.x+r.b0*sx,y:u.y+(r.p+.5)*sy},{x:u.x+(r.b1+1)*sx,y:u.y+(r.p+.5)*sy}]));
  vs.forEach(r=>segs.push([{x:u.x+(r.p+.5)*sx,y:u.y+r.b0*sy},{x:u.x+(r.p+.5)*sx,y:u.y+(r.b1+1)*sy}]));
  if(!segs.length){setStatus(_("Không tìm thấy đường ngang / dọc nào đủ dài. Thử giảm “Độ dài nét tối thiểu” hoặc đổi ngưỡng.","No long enough horizontal / vertical lines found. Try lowering the minimum length or changing the threshold."));return}
  if(segs.length>2500){setStatus(_(`Tìm thấy ${segs.length} đoạn — quá nhiều. Hãy tăng “Độ dài nét tối thiểu”.`,`${segs.length} segments found — too many. Increase the minimum line length.`));return}
  const cad=cadOn(),L=cad?curLayer():null;
  segs.forEach(s=>{
   const h={id:uid("s"),t:"line",pts:s,col:cad?L.col:INK,sw:cad?L.sw:1.5,dash:"",fill:"",fo:.25,ah:0,closed:false,rx:0,z:"f"};if(cad)h.lay=L.id;state.shapes.push(h);
  });
  commit(_("Dựng nét từ ảnh","Rebuild lines from image"));renderAll();
  setStatus(_(`Đã tạo ${segs.length} đường thẳng (${hs.length} ngang, ${vs.length} dọc). Ẩn ảnh nền để xem kết quả; xoá / sửa / nối thêm bằng công cụ vẽ. Đây mới là bước đầu: chưa nhận chữ, ký hiệu, đường cong, đường chéo.`,`Created ${segs.length} lines (${hs.length} horizontal, ${vs.length} vertical). Hide the underlay to see the result; delete / edit / add with the drawing tools. This is a first step: text, symbols, curves and diagonals are not recognised.`));
 }catch(e){setStatus(_("Lỗi phân tích ảnh: ","Image analysis error: ")+e.message)}
}

/* ---------- SimCAD: lệnh CAL — chỉnh tỉ lệ ảnh bằng 2 điểm ---------- */
CMDS.cal=()=>{
 if(!underOK()){setStatus(_("Chưa có ảnh nền — nhập ảnh trước (bảng “Ảnh nền / bản scan”).","No underlay yet — import an image first (the “Underlay / scan” panel)."));return null}
 const P=[];
 return{base:()=>P.length?P[P.length-1]:null,
  prompt:()=>P.length===0?["Hiệu chỉnh tỉ lệ ảnh: bấm điểm thứ nhất trên ảnh (đầu đoạn đã biết chiều dài thật)","Calibrate: click the first point on the image (one end of a known real length)"]:P.length===1?["Bấm điểm thứ hai (đầu kia của đoạn đã biết)","Click the second point (other end of the known length)"]:[`Gõ chiều dài THẬT của đoạn này (${cadCfg().unit}) rồi Enter`,`Type the REAL length of this segment (${cadCfg().unit}) then Enter`],
  click:p=>{if(P.length<2){if(P.length===1&&hyp(P[0],p)<.5)return;P.push(p);cadPrompt()}},
  num:v=>{
   if(P.length<2)return false;if(!(v>0))return;
   const u=state.under,cur=hyp(P[0],P[1]),want=lenU2W(v),f=want/cur;
   u.w*=f;u.h*=f;u.x=P[0].x+(u.x-P[0].x)*f;u.y=P[0].y+(u.y-P[0].y)*f;underKey="";commit(_("Hiệu chỉnh tỉ lệ ảnh","Calibrate underlay"));renderAll();renderUnderPanel();
   setStatus(_(`Đã chỉnh tỉ lệ ảnh ×${Math.round(f*1000)/1000}. Hai điểm đã chọn nay cách nhau ${v} ${cadCfg().unit}.`,`Underlay scaled ×${Math.round(f*1000)/1000}. The two points are now ${v} ${cadCfg().unit} apart.`));cadReset(true);
  },
  draft:()=>P.length===1?`<path d="M${P[0].x} ${P[0].y}L${CAD.cur.x} ${CAD.cur.y}" stroke="#d946ef" stroke-width="${2/view.k}" stroke-dasharray="${8/view.k} ${5/view.k}"/>`:(P.length===2?`<path d="M${P[0].x} ${P[0].y}L${P[1].x} ${P[1].y}" stroke="#d946ef" stroke-width="${2/view.k}"/>`:""),
  enter:()=>cadReset(true)};
};
CAD_ALIAS.cal="cal";CAD_ALIAS.calib="cal";
