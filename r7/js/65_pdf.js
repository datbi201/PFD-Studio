/* ============ XUẤT PDF VECTOR (SVG → PDF, nhúng font Unicode) ============ */
/* Không dùng thư viện ngoài: đọc SVG của chính bản vẽ, đổi sang lệnh vẽ PDF (đường, hình, chữ, mũi tên, vùng cắt, độ trong suốt).
   Chữ dùng font Liberation (tương thích Arial / Times / Courier), đã nhúng sẵn tập con Latin + tiếng Việt. */
const _b64u8=b=>{const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
async function _zinflate(u8){const ds=new DecompressionStream("deflate"),w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
async function _zdeflate(u8){const cs=new CompressionStream("deflate"),w=cs.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer())}
const _pn=v=>{let s=(Math.round(v*1000)/1000).toString();if(s==="-0")s="0";return s};

/* ---- đọc TTF: cmap (format 4), hmtx, head, hhea ---- */
function ttfParse(u8,z,rawLen,key){
 const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),nt=dv.getUint16(4),tb={};
 for(let i=0;i<nt;i++){const o=12+i*16,tag=String.fromCharCode(u8[o],u8[o+1],u8[o+2],u8[o+3]);tb[tag]={off:dv.getUint32(o+8),len:dv.getUint32(o+12)}}
 const hd=tb.head.off,upem=dv.getUint16(hd+18),bbox=[dv.getInt16(hd+36),dv.getInt16(hd+38),dv.getInt16(hd+40),dv.getInt16(hd+42)];
 const hh=tb.hhea.off,asc=dv.getInt16(hh+4),desc=dv.getInt16(hh+6),nh=dv.getUint16(hh+34),hm=tb.hmtx.off,adv=[];
 for(let i=0;i<nh;i++)adv.push(dv.getUint16(hm+i*4));
 const cm=tb.cmap.off,n=dv.getUint16(cm+2);let sub=-1;
 for(let i=0;i<n;i++){const o=cm+4+i*8,pid=dv.getUint16(o),eid=dv.getUint16(o+2),so=dv.getUint32(o+4);if((pid===3&&eid===1)||pid===0){sub=cm+so;if(pid===3)break}}
 const map=new Map();
 if(sub>=0&&dv.getUint16(sub)===4){
  const sc=dv.getUint16(sub+6)/2,endO=sub+14,startO=endO+sc*2+2,deltaO=startO+sc*2,rangeO=deltaO+sc*2;
  for(let i=0;i<sc;i++){
   const e=dv.getUint16(endO+i*2),s=dv.getUint16(startO+i*2),d=dv.getInt16(deltaO+i*2),ro=dv.getUint16(rangeO+i*2);
   for(let c=s;c<=e&&c<0xFFFF;c++){let g;if(ro===0)g=(c+d)&0xFFFF;else{g=dv.getUint16(rangeO+i*2+ro+(c-s)*2);if(g)g=(g+d)&0xFFFF}if(g)map.set(c,g)}
  }
 }
 return{key,z,rawLen,upem,bbox,asc,desc,adv,map};
}
let _pdfFontCache=null;
async function pdfFontSet(){
 if(_pdfFontCache)return _pdfFontCache;
 const set={};
 for(const k of Object.keys(PDF_FONTS)){const z=_b64u8(PDF_FONTS[k][0]),raw=await _zinflate(z);set[k]=ttfParse(raw,z,PDF_FONTS[k][1],k)}
 return _pdfFontCache=set;
}
function pdfPickFont(ff,weight,style){
 const first=String(ff||"").toLowerCase().split(",")[0].replace(/['"]/g,"").trim();
 let fam="sans",cond=1;
 if(/courier|consolas|monospace|mono/.test(first))fam="mono";
 else if(/times|georgia|serif/.test(first)&&!/sans/.test(first))fam="serif";
 if(/narrow|isocpeur|osifont|condensed/.test(first))cond=.84;
 const bold=(+weight>=600)||/bold/.test(String(weight||""));
 return{key:fam+(bold?"_b":"_r"),cond,italic:/italic|oblique/.test(String(style||""))};
}

/* ---- màu (dùng canvas để hiểu mọi kiểu màu CSS) ---- */
const _colCache={};let _colCtx=null;
function pdfColor(s){
 if(s==null)return null;s=String(s).trim();if(s===""||s==="none"||s==="transparent"||/^url\(/.test(s))return null;
 if(_colCache[s]!==undefined)return _colCache[s];
 let r=null;
 let m=/^#([0-9a-f]{6})$/i.exec(s);
 if(m)r={c:[parseInt(m[1].slice(0,2),16)/255,parseInt(m[1].slice(2,4),16)/255,parseInt(m[1].slice(4,6),16)/255],a:1};
 else if((m=/^#([0-9a-f]{3})$/i.exec(s)))r={c:[...m[1]].map(h=>parseInt(h+h,16)/255),a:1};
 else{
  try{if(!_colCtx)_colCtx=document.createElement("canvas").getContext("2d");_colCtx.fillStyle="#010203";_colCtx.fillStyle=s;const v=_colCtx.fillStyle;
   let mm=/^#([0-9a-f]{6})$/i.exec(v);if(mm)r={c:[parseInt(mm[1].slice(0,2),16)/255,parseInt(mm[1].slice(2,4),16)/255,parseInt(mm[1].slice(4,6),16)/255],a:1};
   else if((mm=/^rgba?\(([^)]+)\)/.exec(v))){const p=mm[1].split(",").map(x=>parseFloat(x));r={c:[p[0]/255,p[1]/255,p[2]/255],a:p.length>3?p[3]:1}}}catch(e){}
 }
 if(r&&r.a===0)r=null;
 return _colCache[s]=r;
}

/* ---- ma trận & path ---- */
const mMul=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
function parseTransform(s){
 let M=[1,0,0,1,0,0];if(!s)return M;
 const re=/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;let m;
 while((m=re.exec(s))){
  const a=m[2].split(/[\s,]+/).filter(x=>x!=="").map(Number);let T;
  switch(m[1]){
   case"matrix":T=a.slice(0,6);break;
   case"translate":T=[1,0,0,1,a[0]||0,a[1]||0];break;
   case"scale":T=[a[0],0,0,a.length>1?a[1]:a[0],0,0];break;
   case"rotate":{const r=(a[0]||0)*Math.PI/180,c=Math.cos(r),sn=Math.sin(r);T=[c,sn,-sn,c,0,0];if(a.length>2){T=mMul(mMul([1,0,0,1,a[1],a[2]],T),[1,0,0,1,-a[1],-a[2]])}break}
   case"skewX":T=[1,0,Math.tan((a[0]||0)*Math.PI/180),1,0,0];break;
   default:T=[1,Math.tan((a[0]||0)*Math.PI/180),0,1,0,0];
  }
  M=mMul(M,T);
 }
 return M;
}
function arcToBez(x1,y1,rx,ry,phi,fa,fs,x2,y2){
 if(rx===0||ry===0||(x1===x2&&y1===y2))return[["L",x2,y2]];
 rx=Math.abs(rx);ry=Math.abs(ry);const ph=phi*Math.PI/180,cp=Math.cos(ph),sp=Math.sin(ph);
 const dx=(x1-x2)/2,dy=(y1-y2)/2,x1p=cp*dx+sp*dy,y1p=-sp*dx+cp*dy;
 const lam=x1p*x1p/(rx*rx)+y1p*y1p/(ry*ry);if(lam>1){const s=Math.sqrt(lam);rx*=s;ry*=s}
 const num=rx*rx*ry*ry-rx*rx*y1p*y1p-ry*ry*x1p*x1p,den=rx*rx*y1p*y1p+ry*ry*x1p*x1p;
 let co=Math.sqrt(Math.max(0,num/den));if(fa===fs)co=-co;
 const cxp=co*rx*y1p/ry,cyp=-co*ry*x1p/rx,cx=cp*cxp-sp*cyp+(x1+x2)/2,cy=sp*cxp+cp*cyp+(y1+y2)/2;
 const ang=(ux,uy,vx,vy)=>{const a=Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy);return a};
 let t1=ang(1,0,(x1p-cxp)/rx,(y1p-cyp)/ry),dt=ang((x1p-cxp)/rx,(y1p-cyp)/ry,(-x1p-cxp)/rx,(-y1p-cyp)/ry);
 if(!fs&&dt>0)dt-=2*Math.PI;else if(fs&&dt<0)dt+=2*Math.PI;
 const n=Math.max(1,Math.ceil(Math.abs(dt)/(Math.PI/2)-1e-9)),d=dt/n,out=[];
 const k=4/3*Math.tan(d/4);
 for(let i=0;i<n;i++){
  const a1=t1+i*d,a2=a1+d,c1=Math.cos(a1),s1=Math.sin(a1),c2=Math.cos(a2),s2=Math.sin(a2);
  const p=(x,y)=>[cp*rx*x-sp*ry*y+cx,sp*rx*x+cp*ry*y+cy];
  const e1=p(c1-k*s1,s1+k*c1),e2=p(c2+k*s2,s2-k*c2),e=p(c2,s2);
  out.push(["C",e1[0],e1[1],e2[0],e2[1],e[0],e[1]]);
 }
 return out;
}
/* chuỗi path → mảng đoạn tuyệt đối [M|L|C|Z] */
function parsePathD(d){
 const segs=[],re=/([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
 const tk=[];let m;while((m=re.exec(d||"")))tk.push(m[1]||m[2]);
 let i=0,cx=0,cy=0,sx=0,sy=0,cmd="",lc=null,lq=null;
 const num=()=>parseFloat(tk[i++]);
 const flag=()=>{let t=tk[i];if(t.length>1&&/^[01]/.test(t)&&!/[.eE]/.test(t.slice(0,1))){tk[i]=t.slice(1);return +t[0]}i++;return +t};
 while(i<tk.length){
  if(/^[A-Za-z]$/.test(tk[i]))cmd=tk[i++];else if(cmd==="M")cmd="L";else if(cmd==="m")cmd="l";
  const rel=cmd===cmd.toLowerCase(),C=cmd.toUpperCase();let nc=null,nq=null;
  switch(C){
   case"M":{let x=num(),y=num();if(rel){x+=cx;y+=cy}cx=sx=x;cy=sy=y;segs.push(["M",x,y]);break}
   case"L":{let x=num(),y=num();if(rel){x+=cx;y+=cy}cx=x;cy=y;segs.push(["L",x,y]);break}
   case"H":{let x=num();if(rel)x+=cx;cx=x;segs.push(["L",cx,cy]);break}
   case"V":{let y=num();if(rel)y+=cy;cy=y;segs.push(["L",cx,cy]);break}
   case"C":{let a=num(),b=num(),c=num(),e=num(),x=num(),y=num();if(rel){a+=cx;b+=cy;c+=cx;e+=cy;x+=cx;y+=cy}segs.push(["C",a,b,c,e,x,y]);nc=[c,e];cx=x;cy=y;break}
   case"S":{let c=num(),e=num(),x=num(),y=num();if(rel){c+=cx;e+=cy;x+=cx;y+=cy}const a=lc?2*cx-lc[0]:cx,b=lc?2*cy-lc[1]:cy;segs.push(["C",a,b,c,e,x,y]);nc=[c,e];cx=x;cy=y;break}
   case"Q":{let a=num(),b=num(),x=num(),y=num();if(rel){a+=cx;b+=cy;x+=cx;y+=cy}segs.push(["C",cx+2/3*(a-cx),cy+2/3*(b-cy),x+2/3*(a-x),y+2/3*(b-y),x,y]);nq=[a,b];cx=x;cy=y;break}
   case"T":{let x=num(),y=num();if(rel){x+=cx;y+=cy}const a=lq?2*cx-lq[0]:cx,b=lq?2*cy-lq[1]:cy;segs.push(["C",cx+2/3*(a-cx),cy+2/3*(b-cy),x+2/3*(a-x),y+2/3*(b-y),x,y]);nq=[a,b];cx=x;cy=y;break}
   case"A":{const rx=num(),ry=num(),ph=num(),fa=flag(),fs=flag();let x=num(),y=num();if(rel){x+=cx;y+=cy}arcToBez(cx,cy,rx,ry,ph,fa,fs,x,y).forEach(s=>segs.push(s));cx=x;cy=y;break}
   case"Z":segs.push(["Z"]);cx=sx;cy=sy;break;
   default:i=tk.length;
  }
  lc=nc;lq=nq;
 }
 return segs;
}
const _K=.5522847498;
function rectSegs(x,y,w,h,rx,ry){
 rx=Math.min(rx||0,w/2);ry=Math.min(ry||0,h/2);
 if(!rx&&!ry)return[["M",x,y],["L",x+w,y],["L",x+w,y+h],["L",x,y+h],["Z"]];
 const kx=rx*_K,ky=ry*_K;
 return[["M",x+rx,y],["L",x+w-rx,y],["C",x+w-rx+kx,y,x+w,y+ry-ky,x+w,y+ry],["L",x+w,y+h-ry],["C",x+w,y+h-ry+ky,x+w-rx+kx,y+h,x+w-rx,y+h],["L",x+rx,y+h],["C",x+rx-kx,y+h,x,y+h-ry+ky,x,y+h-ry],["L",x,y+ry],["C",x,y+ry-ky,x+rx-kx,y,x+rx,y],["Z"]];
}
function ellipseSegs(cx,cy,rx,ry){
 const kx=rx*_K,ky=ry*_K;
 return[["M",cx+rx,cy],["C",cx+rx,cy+ky,cx+kx,cy+ry,cx,cy+ry],["C",cx-kx,cy+ry,cx-rx,cy+ky,cx-rx,cy],["C",cx-rx,cy-ky,cx-kx,cy-ry,cx,cy-ry],["C",cx+kx,cy-ry,cx+rx,cy-ky,cx+rx,cy],["Z"]];
}
function segsToOps(segs){
 return segs.map(s=>s[0]==="M"?_pn(s[1])+" "+_pn(s[2])+" m":s[0]==="L"?_pn(s[1])+" "+_pn(s[2])+" l":s[0]==="C"?s.slice(1).map(_pn).join(" ")+" c":"h").join("\n");
}
function jpegInfo(u8){
 let i=2;while(i<u8.length){if(u8[i]!==0xFF){i++;continue}const m=u8[i+1];if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return{h:(u8[i+5]<<8)|u8[i+6],w:(u8[i+7]<<8)|u8[i+8],nc:u8[i+9]};i+=2+((u8[i+2]<<8)|u8[i+3])}
 return null;
}

/* ---- bộ ghi PDF ---- */
function PdfDoc(fonts){this.fonts=fonts;this.pages=[];this.used={};this.gs=[];this.imgs=[];Object.keys(fonts).forEach(k=>this.used[k]=new Map())}
PdfDoc.prototype.gsName=function(ca,CA){
 const k=_pn(ca)+"_"+_pn(CA);let i=this.gs.findIndex(g=>g.k===k);if(i<0){this.gs.push({k,ca,CA});i=this.gs.length-1}return"GS"+(i+1);
};
PdfDoc.prototype.addImage=function(u8,info){this.imgs.push({u8,info});return"Im"+this.imgs.length};
PdfDoc.prototype.glyphs=function(fk,str){
 const f=this.fonts[fk],out=[];let w=0;
 for(const ch of String(str).normalize("NFC")){
  let cp=ch.codePointAt(0);if(cp===0xA0)cp=32;
  let g=f.map.get(cp);
  if(!g){const alt={0x2011:0x2d,0x2010:0x2d,0x2192:0x2192,0x21E5:0x2192,0x21E4:0x2190,0x2009:32,0x200A:32,0x2002:32,0x2003:32}[cp];g=f.map.get(alt||0x3f)||0;if(alt)cp=alt;else cp=0x3f}
  out.push(g);this.used[fk].set(g,cp);w+=f.adv[Math.min(g,f.adv.length-1)]/f.upem;
 }
 return{gids:out,w};
};
/* chuyển 1 trang SVG (chuỗi) thành lệnh PDF */
PdfDoc.prototype.addPageSvg=function(svg){
 const dom=new DOMParser().parseFromString(svg,"image/svg+xml"),root=dom.documentElement;
 if(dom.querySelector("parsererror"))throw new Error("SVG không hợp lệ");
 const len=(s,dflt)=>{const m=/^\s*([\d.]+)\s*(mm|pt|px|in|cm)?/.exec(s||"");if(!m)return dflt;const v=parseFloat(m[1]);return{mm:v*72/25.4,pt:v,px:v*.75,in:v*72,cm:v*72/2.54}[m[2]||"px"]};
 const vbA=(root.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);
 const Wp=len(root.getAttribute("width"),vbA[2]||595),Hp=len(root.getAttribute("height"),vbA[3]||842);
 const vb=vbA.length===4&&vbA[2]>0?vbA:[0,0,Wp,Hp],sx=Wp/vb[2],sy=Hp/vb[3];
 const markers={};dom.querySelectorAll("marker").forEach(m=>{markers[m.getAttribute("id")]=m});
 const P={w:Wp,h:Hp,ops:[],fonts:new Set(),gs:new Set(),ims:new Set()};
 const ops=P.ops,doc=this;
 ops.push(`q ${_pn(sx)} 0 0 ${_pn(-sy)} ${_pn(-vb[0]*sx)} ${_pn(Hp+vb[1]*sy)} cm`);
 const dflt={fill:{c:[0,0,0],a:1},stroke:null,sw:1,fo:1,so:1,op:1,dash:null,join:0,cap:0,ff:"Arial, Helvetica, sans-serif",fs:16,fw:400,fst:"normal",ta:"start"};
 const style=(el,p)=>{
  const c=Object.assign({},p),g=n=>el.getAttribute(n);let v;
  if((v=g("fill"))!=null)c.fill=pdfColor(v);
  if((v=g("stroke"))!=null)c.stroke=pdfColor(v);
  if((v=g("stroke-width"))!=null)c.sw=parseFloat(v)||0;
  if((v=g("fill-opacity"))!=null)c.fo=parseFloat(v);
  if((v=g("stroke-opacity"))!=null)c.so=parseFloat(v);
  if((v=g("opacity"))!=null)c.op=p.op*parseFloat(v);
  if((v=g("stroke-dasharray"))!=null)c.dash=(v==="none"||!v)?null:v.split(/[\s,]+/).filter(x=>x!=="").map(Number);
  if((v=g("stroke-linejoin"))!=null)c.join=v==="round"?1:v==="bevel"?2:0;
  if((v=g("stroke-linecap"))!=null)c.cap=v==="round"?1:v==="square"?2:0;
  if((v=g("font-family"))!=null)c.ff=v;if((v=g("font-size"))!=null)c.fs=parseFloat(v);
  if((v=g("font-weight"))!=null)c.fw=v;if((v=g("font-style"))!=null)c.fst=v;if((v=g("text-anchor"))!=null)c.ta=v;
  return c;
 };
 const setState=(c,doFill,doStroke)=>{
  let s="";
  const fa=doFill?c.fill.a*c.fo*c.op:1,sa=doStroke?c.stroke.a*c.so*c.op:1;
  if((doFill&&fa<1)||(doStroke&&sa<1)){const n=doc.gsName(doFill?fa:1,doStroke?sa:1);P.gs.add(n);s+="/"+n+" gs\n"}
  if(doFill)s+=c.fill.c.map(_pn).join(" ")+" rg\n";
  if(doStroke){
   s+=c.stroke.c.map(_pn).join(" ")+" RG\n"+_pn(c.sw)+" w\n"+c.join+" j\n"+c.cap+" J\n4 M\n";
   if(c.dash&&c.dash.length&&c.dash.some(x=>x>0)){let d=c.dash.slice();if(d.length%2)d=d.concat(d);s+="["+d.map(_pn).join(" ")+"] 0 d\n"}else s+="[] 0 d\n";
  }
  return s;
 };
 const paint=(segs,c,el)=>{
  const doFill=!!c.fill&&segs.length>1&&c.fo>0,doStroke=!!c.stroke&&c.sw>0&&c.so>0;
  if(segs.length&&(doFill||doStroke)){
   const op=doFill&&doStroke?"B":doFill?"f":"S";
   ops.push("q\n"+setState(c,doFill,doStroke)+segsToOps(segs)+"\n"+op+"\nQ");
  }
  if(el)drawMarkers(el,segs,c);
 };
 const dirAt=(segs,end)=>{
  const pts=[];let cur=null,start=null;
  segs.forEach(s=>{if(s[0]==="M"){cur=[s[1],s[2]];start=cur}else if(s[0]==="L"){pts.push({a:cur,b:[s[1],s[2]],c1:null,c2:null});cur=[s[1],s[2]]}else if(s[0]==="C"){pts.push({a:cur,b:[s[5],s[6]],c1:[s[1],s[2]],c2:[s[3],s[4]]});cur=[s[5],s[6]]}else if(s[0]==="Z"&&cur&&start){pts.push({a:cur,b:start,c1:null,c2:null});cur=start}});
  if(!pts.length)return null;
  if(end){const l=pts[pts.length-1];let p=l.c2||l.a;if(Math.hypot(l.b[0]-p[0],l.b[1]-p[1])<1e-6)p=l.c1||l.a;return{pt:l.b,ang:Math.atan2(l.b[1]-p[1],l.b[0]-p[0])}}
  const f=pts[0];let q=f.c1||f.b;if(Math.hypot(q[0]-f.a[0],q[1]-f.a[1])<1e-6)q=f.c2||f.b;return{pt:f.a,ang:Math.atan2(q[1]-f.a[1],q[0]-f.a[0])};
 };
 const drawMarkers=(el,segs,c)=>{
  [["marker-end",true],["marker-start",false]].forEach(([attr,end])=>{
   const ref=el.getAttribute(attr);if(!ref)return;const m=/url\(#([^)]+)\)/.exec(ref);if(!m||!markers[m[1]])return;
   const mk=markers[m[1]],d=dirAt(segs,end);if(!d)return;
   const vbm=(mk.getAttribute("viewBox")||"0 0 10 10").split(/[\s,]+/).map(Number),mw=parseFloat(mk.getAttribute("markerWidth")||3),mh=parseFloat(mk.getAttribute("markerHeight")||3);
   const rx=parseFloat(mk.getAttribute("refX")||0),ry=parseFloat(mk.getAttribute("refY")||0),orient=mk.getAttribute("orient")||"0";
   const sw=mk.getAttribute("markerUnits")==="userSpaceOnUse"?1:c.sw,k=Math.min(mw/vbm[2],mh/vbm[3])*sw;
   let ang=orient==="auto"?d.ang:orient==="auto-start-reverse"?(end?d.ang:d.ang+Math.PI):(parseFloat(orient)||0)*Math.PI/180;
   const cs=Math.cos(ang),sn=Math.sin(ang);
   let M=mMul([1,0,0,1,d.pt[0],d.pt[1]],[cs,sn,-sn,cs,0,0]);M=mMul(M,[k,0,0,k,0,0]);M=mMul(M,[1,0,0,1,-rx,-ry]);
   ops.push("q "+M.map(_pn).join(" ")+" cm");
   [...mk.children].forEach(ch=>node(ch,Object.assign({},dflt)));
   ops.push("Q");
  });
 };
 const drawText=(el,c)=>{
  const s=el.textContent;if(!s||!c.fill)return;
  const pf=pdfPickFont(c.ff,c.fw,c.fst),f=doc.fonts[pf.key],x=parseFloat((el.getAttribute("x")||"0").split(/[\s,]+/)[0])||0,y=parseFloat((el.getAttribute("y")||"0").split(/[\s,]+/)[0])||0;
  const g=doc.glyphs(pf.key,s),w=g.w*c.fs*pf.cond;
  const tx=c.ta==="middle"?x-w/2:c.ta==="end"?x-w:x;
  P.fonts.add(pf.key);
  const hex=g.gids.map(v=>v.toString(16).padStart(4,"0")).join("");
  const sk=pf.italic?.2126:0,gsn=c.fo*c.op<1?doc.gsName(c.fill.a*c.fo*c.op,1):(c.fill.a<1?doc.gsName(c.fill.a,1):"");
  if(gsn)P.gs.add(gsn);
  ops.push(`q\n${gsn?"/"+gsn+" gs\n":""}${c.fill.c.map(_pn).join(" ")} rg\nBT\n/${"F_"+pf.key} ${_pn(c.fs)} Tf\n${pf.cond!==1?_pn(pf.cond*100)+" Tz\n":""}1 0 ${_pn(sk)} -1 ${_pn(tx)} ${_pn(y)} Tm\n<${hex}> Tj\nET\nQ`);
 };
 const drawImage=(el,c)=>{
  const href=el.getAttribute("href")||el.getAttribute("xlink:href")||"";const m=/^data:image\/jpe?g;base64,(.*)$/i.exec(href);if(!m)return;
  const u8=_b64u8(m[1]),info=jpegInfo(u8);if(!info||info.nc===4)return;
  const x=parseFloat(el.getAttribute("x")||0),y=parseFloat(el.getAttribute("y")||0),w=parseFloat(el.getAttribute("width")||0),h=parseFloat(el.getAttribute("height")||0);
  const name=doc.addImage(u8,info);P.ims.add(name);
  const o=c.op*(parseFloat(el.getAttribute("opacity")||1));let gs="";if(o<1){const n=doc.gsName(o,o);P.gs.add(n);gs="/"+n+" gs\n"}
  ops.push(`q\n${gs}${_pn(w)} 0 0 ${_pn(-h)} ${_pn(x)} ${_pn(y+h)} cm\n/${name} Do\nQ`);
 };
 const node=(el,pc)=>{
  const tag=el.localName;if(el.nodeType!==1)return;
  if(["defs","title","desc","metadata","marker","style","pattern","clipPath","linearGradient","radialGradient","filter"].includes(tag))return;
  if(el.getAttribute("display")==="none"||el.getAttribute("visibility")==="hidden")return;
  const c=style(el,pc),T=el.getAttribute("transform"),has=!!T&&tag!=="svg";
  if(has)ops.push("q "+parseTransform(T).map(_pn).join(" ")+" cm");
  const num=n=>parseFloat(el.getAttribute(n))||0;
  switch(tag){
   case"g":[...el.children].forEach(ch=>node(ch,c));break;
   case"svg":{
    const x=num("x"),y=num("y"),w=el.getAttribute("width")?num("width"):0,h=el.getAttribute("height")?num("height"):0;
    const v=(el.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);
    ops.push("q");
    if(w>0&&h>0){ops.push(`${_pn(x)} ${_pn(y)} ${_pn(w)} ${_pn(h)} re W n`);
     if(v.length===4&&v[2]>0&&v[3]>0){const k=Math.min(w/v[2],h/v[3]),ox=x+(w-v[2]*k)/2-v[0]*k,oy=y+(h-v[3]*k)/2-v[1]*k;ops.push(`${_pn(k)} 0 0 ${_pn(k)} ${_pn(ox)} ${_pn(oy)} cm`)}
     else ops.push(`1 0 0 1 ${_pn(x)} ${_pn(y)} cm`);
    }
    [...el.children].forEach(ch=>node(ch,c));ops.push("Q");break}
   case"rect":paint(rectSegs(num("x"),num("y"),num("width"),num("height"),num("rx")||(el.getAttribute("ry")?num("ry"):0),num("ry")||num("rx")),c,null);break;
   case"circle":paint(ellipseSegs(num("cx"),num("cy"),num("r"),num("r")),c,null);break;
   case"ellipse":paint(ellipseSegs(num("cx"),num("cy"),num("rx"),num("ry")),c,null);break;
   case"line":paint([["M",num("x1"),num("y1")],["L",num("x2"),num("y2")]],Object.assign({},c,{fill:null}),el);break;
   case"polyline":case"polygon":{
    const p=(el.getAttribute("points")||"").split(/[\s,]+/).filter(x=>x!=="").map(Number),segs=[];
    for(let i=0;i+1<p.length;i+=2)segs.push([i?"L":"M",p[i],p[i+1]]);if(tag==="polygon")segs.push(["Z"]);
    paint(segs,tag==="polyline"?c:c,el);break}
   case"path":paint(parsePathD(el.getAttribute("d")),c,el);break;
   case"text":drawText(el,c);break;
   case"image":drawImage(el,c);break;
   default:[...el.children].forEach(ch=>node(ch,c));
  }
  if(has)ops.push("Q");
 };
 [...root.children].forEach(ch=>node(ch,style(root,dflt)));
 ops.push("Q");
 this.pages.push(P);
};
PdfDoc.prototype.finish=async function(info){
 const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
 const put=d=>{const u=typeof d==="string"?enc.encode(d):d;chunks.push(u);len+=u.length};
 const hexU16=s=>"FEFF"+[...String(s)].map(ch=>{const c=ch.codePointAt(0);return c>0xFFFF?(0xD800+((c-0x10000)>>10)).toString(16).padStart(4,"0")+(0xDC00+((c-0x10000)&0x3FF)).toString(16).padStart(4,"0"):c.toString(16).padStart(4,"0")}).join("");
 const objs=[];let nid=1;const alloc=()=>nid++;
 const catalog=alloc(),pagesId=alloc(),infoId=alloc();
 const fontIds={};
 const usedKeys=Object.keys(this.used).filter(k=>this.used[k].size>0);
 usedKeys.forEach(k=>{
  const f=this.fonts[k],t0=alloc(),cid=alloc(),desc=alloc(),ff=alloc(),tu=alloc(),bn="AAAAAA+Liberation-"+k.replace("_","-"),sc=1000/f.upem;
  fontIds[k]=t0;
  const gl=[...this.used[k].entries()].sort((a,b)=>a[0]-b[0]);
  const W=gl.map(([g])=>g+" ["+Math.round(f.adv[Math.min(g,f.adv.length-1)]*sc)+"]").join(" ");
  let cm="/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
  for(let i=0;i<gl.length;i+=100){const part=gl.slice(i,i+100);cm+=part.length+" beginbfchar\n"+part.map(([g,cp])=>"<"+g.toString(16).padStart(4,"0")+"> <"+(cp>0xFFFF?(0xD800+((cp-0x10000)>>10)).toString(16).padStart(4,"0")+(0xDC00+((cp-0x10000)&0x3FF)).toString(16).padStart(4,"0"):cp.toString(16).padStart(4,"0"))+">").join("\n")+"\nendbfchar\n"}
  cm+="endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
  objs[t0]=`<</Type/Font/Subtype/Type0/BaseFont/${bn}/Encoding/Identity-H/DescendantFonts[${cid} 0 R]/ToUnicode ${tu} 0 R>>`;
  objs[cid]=`<</Type/Font/Subtype/CIDFontType2/BaseFont/${bn}/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>/FontDescriptor ${desc} 0 R/DW 1000/W[${W}]/CIDToGIDMap/Identity>>`;
  objs[desc]=`<</Type/FontDescriptor/FontName/${bn}/Flags 32/FontBBox[${f.bbox.map(v=>Math.round(v*sc)).join(" ")}]/ItalicAngle 0/Ascent ${Math.round(f.asc*sc)}/Descent ${Math.round(f.desc*sc)}/CapHeight ${Math.round(f.asc*sc*.9)}/StemV ${/_b$/.test(k)?150:80}/FontFile2 ${ff} 0 R>>`;
  objs[ff]={stream:f.z,dict:`/Filter/FlateDecode/Length1 ${f.rawLen}`};
  objs[tu]={stream:enc.encode(cm),dict:"",z:true};
 });
 const gsIds=this.gs.map(()=>alloc()),imIds=this.imgs.map(()=>alloc());
 this.gs.forEach((g,i)=>{objs[gsIds[i]]=`<</Type/ExtGState/ca ${_pn(g.ca)}/CA ${_pn(g.CA)}>>`});
 this.imgs.forEach((m,i)=>{objs[imIds[i]]={stream:m.u8,dict:`/Type/XObject/Subtype/Image/Width ${m.info.w}/Height ${m.info.h}/ColorSpace/${m.info.nc===1?"DeviceGray":"DeviceRGB"}/BitsPerComponent 8/Filter/DCTDecode`}});
 const resCommon=`/Font<<${usedKeys.map(k=>`/F_${k} ${fontIds[k]} 0 R`).join(" ")}>>`+(this.gs.length?`/ExtGState<<${this.gs.map((g,i)=>`/GS${i+1} ${gsIds[i]} 0 R`).join(" ")}>>`:"")+(this.imgs.length?`/XObject<<${this.imgs.map((m,i)=>`/Im${i+1} ${imIds[i]} 0 R`).join(" ")}>>`:"");
 const pageIds=[];
 for(const P of this.pages){
  const pid=alloc(),cid=alloc();pageIds.push(pid);
  const raw=enc.encode(P.ops.join("\n")),z=await _zdeflate(raw);
  objs[cid]={stream:z,dict:"/Filter/FlateDecode"};
  objs[pid]=`<</Type/Page/Parent ${pagesId} 0 R/MediaBox[0 0 ${_pn(P.w)} ${_pn(P.h)}]/Resources<<${resCommon}>>/Contents ${cid} 0 R>>`;
 }
 objs[catalog]=`<</Type/Catalog/Pages ${pagesId} 0 R>>`;
 objs[pagesId]=`<</Type/Pages/Kids[${pageIds.map(i=>i+" 0 R").join(" ")}]/Count ${pageIds.length}>>`;
 const d=new Date(),pad=n=>String(n).padStart(2,"0"),cd=`D:${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
 objs[infoId]=`<</Title<${hexU16((info&&info.title)||"PFD Studio")}>/Author<${hexU16((info&&info.author)||"")}>/Creator<${hexU16("PFD Studio Rev.7")}>/Producer<${hexU16("PFD Studio Rev.7 — vector PDF writer")}>/CreationDate(${cd})>>`;
 put("%PDF-1.5\n%\xE2\xE3\xCF\xD3\n");
 for(let id=1;id<nid;id++){
  offs[id]=len;const o=objs[id];
  if(typeof o==="string")put(`${id} 0 obj\n${o}\nendobj\n`);
  else{let s=o.stream,dict=o.dict;if(o.z){s=await _zdeflate(s);dict="/Filter/FlateDecode"}
   put(`${id} 0 obj\n<<${dict}/Length ${s.length}>>\nstream\n`);put(s);put("\nendstream\nendobj\n")}
 }
 const xr=len;let x=`xref\n0 ${nid}\n0000000000 65535 f \n`;
 for(let id=1;id<nid;id++)x+=String(offs[id]).padStart(10,"0")+" 00000 n \n";
 x+=`trailer\n<</Size ${nid}/Root ${catalog} 0 R/Info ${infoId} 0 R>>\nstartxref\n${xr}\n%%EOF\n`;put(x);
 return new Blob(chunks,{type:"application/pdf"});
};
/* điểm vào: dựng PDF vector cho mọi trang đang cấu hình ở hộp in */
async function buildPDF(){
 const{list}=ppAllPagesSvg(false),fonts=await pdfFontSet(),doc=new PdfDoc(fonts);
 list.forEach((svg,i)=>{setStatus(_(`Đang dựng PDF vector: trang ${i+1}/${list.length}…`,`Building vector PDF: page ${i+1}/${list.length}…`));doc.addPageSvg(svg)});
 return doc.finish({title:(state.meta.docNo||"PFD")+" — "+(state.meta.title||""),author:state.meta.drawnBy||""});
}
