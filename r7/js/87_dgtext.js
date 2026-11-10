/* ============ MODULE SƠ ĐỒ — BỘ DÀN CHỮ TRONG HÌNH KHỐI ============ */
/* Mục tiêu: chữ trong hình khối ngắt dòng, căn lề, giãn dòng, gạch đầu dòng giống Word/PowerPoint để khi
   xuất .pptx, PowerPoint dàn lại ra đúng như đang thấy ở đây. Mọi đo đạc dùng canvas, kết quả được lưu đệm. */
const DG_BUL=1.1;                                   /* thụt lề gạch đầu dòng = 1,1 × cỡ chữ (pt) */
let _dgCtx=null;const _dgWc=new Map();
function dgMeasure(t,ff,b,i,fsU){
 if(!_dgCtx){const c=document.createElement("canvas");_dgCtx=c.getContext("2d")}
 const k=ff+"|"+(b?1:0)+(i?1:0)+"|"+t;let w=_dgWc.get(k);
 if(w===undefined){_dgCtx.font=`${i?"italic ":""}${b?"bold ":""}100px ${dgFont(ff)[1]}`;w=_dgCtx.measureText(t).width/100;if(_dgWc.size>6000)_dgWc.clear();_dgWc.set(k,w)}
 return w*fsU;
}
/* ---- phân tích chuỗi có đánh dấu: **đậm**, *nghiêng*, __gạch chân__, \ thoát ---- */
function dgParseRuns(s){
 const out=[];let b=false,i=false,u=false,cur="";
 const push=()=>{if(cur){const l=out[out.length-1];if(l&&l.b===b&&l.i===i&&l.u===u)l.t+=cur;else out.push({t:cur,b,i,u});cur=""}};
 for(let p=0;p<s.length;p++){
  const c=s[p];
  if(c==="\\"&&p+1<s.length&&"*_\\-".includes(s[p+1])){cur+=s[++p];continue}
  if(c==="*"&&s[p+1]==="*"){push();b=!b;p++;continue}
  if(c==="_"&&s[p+1]==="_"){push();u=!u;p++;continue}
  if(c==="*"){push();i=!i;continue}
  cur+=c;
 }
 push();return out;
}
function dgStripMarks(s){return dgParseRuns(s).map(r=>r.t).join("")}
/* escape văn bản thường thành chuỗi đánh dấu (dùng khi nhập từ nguồn ngoài) */
function dgEscMarks(s){return String(s).replace(/([*\\])/g,"\\$1").replace(/__/g,"_\\_")}
/* ---- tách đoạn: [{runs,st,bu,num}] ---- */
function dgParas(sh){
 const raw=String(sh.tx||"").split("\n"),tp=sh.tp||[];let num=0;
 return raw.map((line,ix)=>{
  const o=tp[ix]||{};let bu=o.bu||"";
  let m;if(!bu&&(m=/^(\s*)[-•]\s+/.exec(line))){bu="dot";line=line.slice(m[0].length)}
  if(bu==="num")num++;else num=0;
  const runs=dgParseRuns(line);
  return{runs,bu,num,st:{fs:o.fs||sh.fs,fb:o.fb!==undefined?o.fb:sh.fb,fi:o.fi!==undefined?o.fi:sh.fi,fu:o.fu!==undefined?o.fu:sh.fu,fc:o.fc||sh.fc,ta:o.ta||sh.ta}};
 });
}
const dgPlain=sh=>dgParas(sh).map(p=>p.runs.map(r=>r.t).join("")).join(" ¶ ");
/* ---- vùng chữ [l,t,r,b] trong hệ toạ độ hình khối, đã trừ lề ---- */
function dgTextBox(sh){
 const P=DG_PRESET[sh.k],r=P.tr(sh.w,sh.h,sh.a,sh.b),mg=sh.mg.map(v=>v*DGPT);
 return[r[0]+mg[0],r[1]+mg[1],r[2]-mg[2],r[3]-mg[3]];
}
/* ---- dàn chữ: trả về {lines,th,box} — mỗi dòng có runs đã có toạ độ x (tương đối với mép trái vùng chữ) ---- */
function dgLayout(sh){
 const box=dgTextBox(sh),W=Math.max(2,box[2]-box[0]),paras=dgParas(sh),lines=[];
 let y=0;
 paras.forEach((p,pi)=>{
  const s=p.st,fsU=s.fs*DGPT,fm=dgFont(sh.ff),bul=p.bu?s.fs*DG_BUL*DGPT:0,avail=Math.max(2,W-bul);
  /* nguyên tử: từ hoặc khoảng trắng, kèm kiểu */
  const atoms=[];
  p.runs.forEach(r=>{
   const b=!!(s.fb||r.b),i=!!(s.fi||r.i),u=!!(s.fu||r.u);
   r.t.split(/(\s+)/).forEach(t=>{if(t==="")return;atoms.push({t,sp:/^\s+$/.test(t),b,i,u,w:dgMeasure(t,sh.ff,b,i,fsU)})});
  });
  const pl=[];let L={at:[],w:0};
  const flush=last=>{while(L.at.length&&L.at[L.at.length-1].sp){L.w-=L.at[L.at.length-1].w;L.at.pop()}pl.push({at:L.at,w:L.w,last});L={at:[],w:0}};
  atoms.forEach(a=>{
   if(a.sp){if(L.at.length)L.at.push(a),L.w+=a.w;return}
   if(L.w+a.w<=avail+.01||(!L.at.length&&a.w<=avail)){L.at.push(a);L.w+=a.w;return}
   if(L.at.length)flush(false);
   if(a.w<=avail){L.at.push(a);L.w+=a.w;return}
   /* từ dài hơn chiều rộng: bẻ theo ký tự */
   let seg="";
   for(const ch of a.t){const w2=dgMeasure(seg+ch,sh.ff,a.b,a.i,fsU);
    if(w2>avail&&seg){L.at.push({...a,t:seg,w:dgMeasure(seg,sh.ff,a.b,a.i,fsU)});L.w+=L.at[L.at.length-1].w;flush(false);seg=ch}else seg+=ch}
   if(seg){L.at.push({...a,t:seg,w:dgMeasure(seg,sh.ff,a.b,a.i,fsU)});L.w+=L.at[L.at.length-1].w}
  });
  flush(true);
  if(!pl.length)pl.push({at:[],w:0,last:true});
  pl.forEach((ln,li)=>{
   const lh=(fm[2]+fm[3]+fm[4])*fsU*sh.ls,base=y+lh-fm[3]*fsU;
   let x0=bul,gap=0;
   if(s.ta==="c")x0=bul+(avail-ln.w)/2;else if(s.ta==="r")x0=bul+avail-ln.w;
   else if(s.ta==="j"&&!ln.last){const ns=ln.at.filter(a=>a.sp).length;if(ns)gap=(avail-ln.w)/ns}
   /* gộp các nguyên tử cùng kiểu thành đoạn chạy */
   const runs=[];let x=x0;
   ln.at.forEach(a=>{
    if(gap){if(!a.sp)runs.push({t:a.t,x,w:a.w,b:a.b,i:a.i,u:a.u});x+=a.w+(a.sp?gap:0);return}
    const l=runs[runs.length-1];
    if(l&&l.b===a.b&&l.i===a.i&&l.u===a.u&&Math.abs(l.x+l.w-x)<.001){l.t+=a.t;l.w+=a.w}else runs.push({t:a.t,x,w:a.w,b:a.b,i:a.i,u:a.u});
    x+=a.w;
   });
   lines.push({runs,y:base,top:y,h:lh,fs:s.fs,fsU,fc:s.fc,ff:sh.ff,bulX:li===0&&p.bu?0:null,bu:li===0?p.bu:"",num:p.num});
   y+=lh;
  });
  y+=sh.ps*DGPT*(pi<paras.length-1?1:0)+(pi<paras.length-1?0:0);
  if(pi<paras.length-1)lines[lines.length-1].gapAfter=sh.ps*DGPT;
 });
 return{lines,th:y,box,W};
}
/* ---- chiều cao cần để vừa chữ (auto-height) ---- */
function dgFitHeight(sh){
 const mg=sh.mg,P=DG_PRESET[sh.k];let h=sh.h;
 for(let k=0;k<4;k++){
  const t={...sh,h},lay=dgLayout(t),r=P.tr(sh.w,h,sh.a,sh.b),extra=h-(r[3]-r[1]);
  const nh=lay.th+(mg[1]+mg[3])*DGPT+extra;if(Math.abs(nh-h)<.05)break;h=nh;
 }
 return Math.max(12,Math.ceil(h*10)/10);
}
function dgAutoFit(sh){if(sh.af&&DG_PRESET[sh.k]){const nh=dgFitHeight(sh);if(Math.abs(nh-sh.h)>.05){
 if(sh.tv==="b"||false)sh.y-=nh-sh.h;sh.h=nh;return true}}return false}
/* ---- ký tự gạch đầu dòng ---- */
const dgBulletChar=(bu,num)=>bu==="dot"?"•":bu==="dash"?"–":bu==="num"?num+".":"";
/* ---- sinh SVG chữ (toạ độ cục bộ của hình khối, gốc ở góc trên-trái khung) ---- */
function dgTextSvg(sh){
 const lay=dgLayout(sh);if(!lay.lines.length)return"";
 const box=lay.box,H=Math.max(0,box[3]-box[1]);
 const oy=sh.tv==="t"?0:sh.tv==="b"?H-lay.th:(H-lay.th)/2;
 const out=[];
 const attrs=(ff,fsU,b,i,fc)=>`font-family="${esc(dgFont(ff)[1].replace(/"/g,"'"))}" font-size="${r3(fsU)}"${b?' font-weight="700"':''}${i?' font-style="italic"':''} fill="${fc}"`;
 lay.lines.forEach(L=>{
  const by=box[1]+oy+L.y;
  if(L.bu){const ch=dgBulletChar(L.bu,L.num);if(ch)out.push(`<text x="${r3(box[0])}" y="${r3(by)}" ${attrs(L.ff,L.fsU,false,false,L.fc)} xml:space="preserve">${esc(ch)}</text>`)}
  L.runs.forEach(r=>{
   const x=box[0]+r.x;
   out.push(`<text x="${r3(x)}" y="${r3(by)}" ${attrs(L.ff,L.fsU,r.b,r.i,L.fc)} xml:space="preserve">${esc(r.t)}</text>`);
   if(r.u){const uy=by+L.fsU*.1;out.push(`<line x1="${r3(x)}" y1="${r3(uy)}" x2="${r3(x+r.w)}" y2="${r3(uy)}" stroke="${L.fc}" stroke-width="${r3(Math.max(.4,L.fsU*.06))}"/>`)}
  });
 });
 return out.join("");
}
