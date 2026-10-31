
"use strict";
/* ============ TIỆN ÍCH ============ */
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const INK="#17202a";            /* mã màu nền "đúc" trong thư viện ký hiệu — sym() đổi sang màu hiện hành */
const PTU=0.7087;               /* 1 đơn vị bản vẽ = 0,25 mm = 0,7087 pt */
const MM=4;                     /* đơn vị bản vẽ trên 1 mm */
const rnd=(v,n)=>{const f=Math.pow(10,n||0);return Math.round(v*f)/f};

/* ============ NGÔN NGỮ VI / EN ============ */
let LANG="vi";
const EN={};                    /* từ điển Việt→Anh, nạp ở lang_en.js */
const _=(vi,en)=>(LANG==="en"&&en!==undefined)?en:vi;
const T_=s=>LANG==="en"?(EN[s]!==undefined?EN[s]:s):s;
const symLabel=k=>T_(SYMBOLS[k].label);
const varName=(k,i)=>T_(SYMBOLS[k].vars[i].n);
const catName=c=>T_(c);

/* ============ GIAO DIỆN SÁNG / TỐI ============ */
const SCHEMES={
 light:{ink:"#17202a",fill:"#ffffff",paper:"#ffffff",grey:"#dbe4ee",wat:"#dbeafe",sub1:"#34495e",sub2:"#52667a",sub3:"#475569",board:"#cfd8e3",gridMinor:"#e6ecf2",gridMajor:"#cfd9e4",shadow:"#7d8da0",hit:"#fff",ph:{gas:"#c2410c",oil:"#166534",water:"#1d4ed8",mix:"#7e22ce"},road:"#78350f",sea:"#1d4ed8"},
 dark:{ink:"#e6edf3",fill:"#10161d",paper:"#10161d",grey:"#2b3846",wat:"#16324f",sub1:"#b8c6d4",sub2:"#8fa1b3",sub3:"#9fb0c3",board:"#05080c",gridMinor:"#1a232d",gridMajor:"#273444",shadow:"#000",hit:"#10161d",ph:{gas:"#fb923c",oil:"#4ade80",water:"#60a5fa",mix:"#c084fc"},road:"#d6a15c",sea:"#60a5fa"}
};
let SCH=SCHEMES.light;
let THEME="auto",DARKPAPER=true,SYSDARK=false;
let HC=false,UI=1,EXPORTING=false,TIPS=true,BW=false,SHOWPORTS=false,STICKY=false;
function isDark(){return THEME==="dark"||(THEME==="auto"&&SYSDARK)}
function applyScheme(){SCH=(isDark()&&DARKPAPER&&!EXPORTING)?SCHEMES.dark:SCHEMES.light}
function phaseCol(k){return BW?SCH.ink:(SCH.ph[k]||SCH.ink)}

/* ============ KHỔ GIẤY ============ */
/* đơn vị bản vẽ: 1 đv = 0,25 mm. w,h = khổ NGANG (landscape) */
const SHEETS={
 A4:{w:1188,h:840,n:"A4 (297 × 210 mm)",g:"ISO"},A3:{w:1680,h:1188,n:"A3 (420 × 297 mm)",g:"ISO"},A2:{w:2376,h:1680,n:"A2 (594 × 420 mm)",g:"ISO"},A1:{w:3364,h:2376,n:"A1 (841 × 594 mm)",g:"ISO"},A0:{w:4756,h:3364,n:"A0 (1189 × 841 mm)",g:"ISO"},
 ANSI_A:{w:1117.6,h:863.6,n:"ANSI A — Letter (11 × 8.5 in)",g:"US"},ANSI_B:{w:1727.2,h:1117.6,n:"ANSI B — Ledger (17 × 11 in)",g:"US"},ANSI_C:{w:2235.2,h:1727.2,n:"ANSI C (22 × 17 in)",g:"US"},ANSI_D:{w:3454.4,h:2235.2,n:"ANSI D (34 × 22 in)",g:"US"},ANSI_E:{w:4470.4,h:3454.4,n:"ANSI E (44 × 34 in)",g:"US"},
 ARCH_D:{w:3657.6,h:2438.4,n:"ARCH D (36 × 24 in)",g:"US"}
};
function sheetDimOf(m){const s=SHEETS[m.sheet]||SHEETS.A3;return m.orient==="portrait"?[s.h,s.w]:[s.w,s.h]}

/* ============ FONT CHỮ & CỠ CHỮ ============ */
const FONT_LIST=[["Arial","Arial, Helvetica, sans-serif"],["Helvetica","Helvetica, Arial, sans-serif"],["Segoe UI","'Segoe UI', Tahoma, Arial, sans-serif"],["Calibri","Calibri, Carlito, Arial, sans-serif"],["Tahoma","Tahoma, Verdana, sans-serif"],["Verdana","Verdana, Geneva, sans-serif"],["Arial Narrow","'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif"],["Times New Roman","'Times New Roman', Times, serif"],["Georgia","Georgia, 'Times New Roman', serif"],["Courier New","'Courier New', Courier, monospace"],["Consolas","Consolas, 'Courier New', monospace"],["Roboto","Roboto, Arial, sans-serif"],["Comic Sans MS","'Comic Sans MS', 'Comic Sans', cursive"],["ISO / kỹ thuật","ISOCPEUR, Osifont, 'Arial Narrow', Arial, sans-serif"]];
const FONT_DEFS=[
 ["tag","Nhãn thiết bị — tag",8.5],["desc","Nhãn thiết bị — tên / mô tả",7.5],["props","Thông số thiết bị (dưới nhãn)",7],
 ["svc","Nhãn đường ống (dịch vụ, size)",7.5],["num","Số dòng (trong hình thoi)",7.5],["note","Ghi chú / khung chữ (mặc định)",10],
 ["legend","Chú thích màu",8.5],["table","Bảng dòng trên bản vẽ",7.5],["tbT","Khung tên — tiêu đề",15],["tbC","Khung tên — ô thông tin",10]
];
function defaultFonts(){const o={};FONT_DEFS.forEach(d=>o[d[0]]={f:"Arial",s:d[2]});return o}
const fontStack=name=>{const f=FONT_LIST.find(x=>x[0]===name);return f?f[1]:(name?`'${String(name).replace(/['"<>]/g,"")}', Arial, sans-serif`:FONT_LIST[0][1])};

/* ============ THÔNG SỐ NÉT / CHỮ THEO KHỔ GIẤY ============ */
const RS={body:1.8,thin:1.3,edge:2.2,fk:1,lwk:1};
let _metaRef=null;                       /* được gán sau khi có state */
function curMeta(){return _metaRef?_metaRef():{}}
function updateRS(){
 applyScheme();
 const m=curMeta(),sh=SHEETS[m.sheet]||SHEETS.A3;
 const sf=(m.showSheet!==false&&m.lineMode==="sheet")?sh.w/1188:1;
 const hc=HC&&!EXPORTING;
 const lw=(+m.lw||1)*sf*(hc?1.5:1),fk=(+m.fs||1)*sf*(hc?1.15:1);
 RS.body=1.8*lw;RS.thin=1.3*lw;RS.edge=2.2*lw;RS.fk=fk;RS.lwk=lw;
}
function fontCfg(key){const m=curMeta(),f=(m.fonts&&m.fonts[key])||null,d=FONT_DEFS.find(x=>x[0]===key);return{f:(f&&f.f)||"Arial",s:(f&&+f.s)||(d?d[2]:8)}}
/* cỡ chữ theo đơn vị bản vẽ */
const FU=key=>fontCfg(key).s/PTU*RS.fk;
const FF=key=>fontStack(fontCfg(key).f);

/* ============ ĐƠN VỊ SI / US ============ */
const UNITS={};                          /* ký hiệu → {fam,f,sys,to} */
const UNIT_OPTS={P:[],T:["°C","°F","K"],Q:[],L:[]};
(function(){
 const fam=(name,list,to,optKey)=>{Object.entries(list).forEach(([u,[f,sys]])=>{UNITS[u]={fam:name,f,sys,to:to[u]};if(optKey&&!UNIT_OPTS[optKey].includes(u))UNIT_OPTS[optKey].push(u)})};
 fam("P",{"barg":[1,"S"],"bara":[1,"S"],"bar":[1,"S"],"kPag":[.01,"S"],"kPaa":[.01,"S"],"kPa":[.01,"S"],"MPag":[10,"S"],"MPaa":[10,"S"],"MPa":[10,"S"],"kg/cm²g":[.980665,"S"],"psig":[.0689476,"U"],"psia":[.0689476,"U"],"psi":[.0689476,"U"]},
  {barg:"psig",bara:"psia",bar:"psi",kPag:"psig",kPaa:"psia",kPa:"psi",MPag:"psig",MPaa:"psia",MPa:"psi","kg/cm²g":"psig",psig:"barg",psia:"bara",psi:"bar"},"P");
 fam("Lh",{"m³/h":[1,"S"],"m3/h":[1,"S"],"L/s":[3.6,"S"],"L/min":[.06,"S"],"gpm":[.227125,"U"]},{"m³/h":"gpm","m3/h":"gpm","L/s":"gpm","L/min":"gpm",gpm:"m³/h"},"Q");
 fam("Ld",{"m³/d":[1,"S"],"m3/d":[1,"S"],"bbl/d":[.158987,"U"],"bpd":[.158987,"U"]},{"m³/d":"bbl/d","m3/d":"bbl/d","bbl/d":"m³/d",bpd:"m³/d"},"Q");
 fam("Gh",{"Sm³/h":[1,"S"],"Sm3/h":[1,"S"],"scfh":[.0283168,"U"]},{"Sm³/h":"scfh","Sm3/h":"scfh",scfh:"Sm³/h"},"Q");
 fam("Gd",{"Sm³/d":[1,"S"],"Sm3/d":[1,"S"],"scfd":[.0283168,"U"]},{"Sm³/d":"scfd","Sm3/d":"scfd",scfd:"Sm³/d"},"Q");
 fam("Gk",{"MSm³/d":[1,"S"],"Mscfd":[.0283168,"U"]},{"MSm³/d":"Mscfd",Mscfd:"MSm³/d"},"Q");
 fam("Gm",{"MMSm³/d":[1,"S"],"MMscfd":[.0283168,"U"],"MMscf/d":[.0283168,"U"]},{"MMSm³/d":"MMscfd",MMscfd:"MMSm³/d","MMscf/d":"MMSm³/d"},"Q");
 fam("Mh",{"kg/h":[1,"S"],"lb/h":[.45359237,"U"]},{"kg/h":"lb/h","lb/h":"kg/h"},"Q");
 fam("Mt",{"t/h":[1,"S"],"klb/h":[.45359237,"U"]},{"t/h":"klb/h","klb/h":"t/h"},"Q");
 fam("Ms",{"kg/s":[1,"S"],"lb/s":[.45359237,"U"]},{"kg/s":"lb/s","lb/s":"kg/s"},"Q");
 fam("Md",{"t/d":[1,"S"],"klb/d":[.45359237,"U"]},{"t/d":"klb/d","klb/d":"t/d"},"Q");
 fam("Len",{"mm":[.001,"S"],"cm":[.01,"S"],"m":[1,"S"],"km":[1000,"S"],"in":[.0254,"U"],"ft":[.3048,"U"],"mi":[1609.344,"U"]},{mm:"in",cm:"in",m:"ft",km:"mi","in":"mm",ft:"m",mi:"km"},"L");
 fam("Vol",{"m³":[1,"S"],"m3":[1,"S"],"L":[.001,"S"],"ft³":[.0283168,"U"],"ft3":[.0283168,"U"],"gal":[.00378541,"U"],"bbl":[.158987,"U"]},{"m³":"ft³","m3":"ft³",L:"gal","ft³":"m³",ft3:"m³",gal:"L",bbl:"m³"},"L");
 fam("Area",{"m²":[1,"S"],"m2":[1,"S"],"ft²":[.092903,"U"],"ft2":[.092903,"U"]},{"m²":"ft²",m2:"ft²","ft²":"m²",ft2:"m²"},"L");
 fam("Mass",{"kg":[1,"S"],"lb":[.45359237,"U"]},{kg:"lb",lb:"kg"},"L");
 fam("Pow",{"kW":[1,"S"],"hp":[.7457,"U"]},{kW:"hp",hp:"kW"},"L");
 fam("Den",{"kg/m³":[1,"S"],"lb/ft³":[16.0185,"U"]},{"kg/m³":"lb/ft³","lb/ft³":"kg/m³"},"L");
 ["°C","degC","°F","degF","K"].forEach(u=>UNITS[u]={fam:"T",sys:u==="°F"||u==="degF"?"U":(u==="K"?"S":"S"),to:{"°C":"°F",degC:"°F","°F":"°C",degF:"°C",K:null}[u]});
})();
const _unitAlt=Object.keys(UNITS).sort((a,b)=>b.length-a.length).map(u=>u.replace(/[.*+?^${}()|[\]\\\/]/g,"\\$&")).join("|");
const _numP="[-+]?(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)";
const UNIT_RE=new RegExp(`(${_numP})(?:\\s*(→|->|–|—|-|\\s+to\\s+)\\s*(${_numP}))?\\s*(${_unitAlt})(?![A-Za-z0-9³²/])`,"g");
const numVal=s=>parseFloat(String(s).replace(/,/g,""));
function fmtNum(x,isT){if(!isFinite(x))return"0";if(isT)return String(rnd(x,1));const a=Math.abs(x);if(a===0)return"0";return String(parseFloat(x.toPrecision(4)))}
function convVal(v,from,to){
 const A=UNITS[from],B=UNITS[to];if(!A||!B)return v;
 if(A.fam==="T"||B.fam==="T"){
  const c=/°?C|degC/.test(from)?v:(/°?F|degF/.test(from)?(v-32)*5/9:v-273.15);
  return /°?C|degC/.test(to)?c:(/°?F|degF/.test(to)?c*9/5+32:c+273.15);
 }
 return v*A.f/B.f;
}
/* đổi toàn bộ đại lượng trong chuỗi sang hệ đơn vị đích ("SI" | "US") */
function convertSystem(text,toSys){
 const want=toSys==="US"?"U":"S";
 return String(text??"").replace(UNIT_RE,(m,n1,sep,n2,u)=>{
  const U=UNITS[u];if(!U||U.sys===want||!U.to)return m;
  if(U.fam==="T"&&u==="K")return m;
  const isT=U.fam==="T",t=U.to;
  const a=fmtNum(convVal(numVal(n1),u,t),isT),b=n2!==undefined?fmtNum(convVal(numVal(n2),u,t),isT):null;
  return b!==null?`${a}${sep.trim()?" "+sep.trim()+" ":sep}${b} ${t}`:`${a} ${t}`;
 });
}
/* đổi đơn vị của đại lượng đầu tiên trong chuỗi (ô chọn đơn vị) */
function setUnitInText(text,newU){
 text=String(text??"");const re=new RegExp(UNIT_RE.source,"g");let found=false;
 const out=text.replace(re,(m,n1,sep,n2,u)=>{
  if(found)return m;found=true;
  const same=UNITS[u]&&UNITS[newU]&&(UNITS[u].fam===UNITS[newU].fam),isT=UNITS[newU]&&UNITS[newU].fam==="T";
  const a=same?fmtNum(convVal(numVal(n1),u,newU),isT):n1,b=n2!==undefined?(same?fmtNum(convVal(numVal(n2),u,newU),isT):n2):null;
  return b!==null?`${a}${sep.trim()?" "+sep.trim()+" ":sep}${b} ${newU}`:`${a} ${newU}`;
 });
 if(found)return out;
 const m=/^\s*(-?[\d.,]+(?:\s*(?:→|->|–|-)\s*-?[\d.,]+)?)\s*(.*)$/.exec(text);
 if(m)return `${m[1]} ${newU}`+(m[2]?" "+m[2]:"");
 return text.trim()?text+" "+newU:"";
}
function unitOfText(text){const re=new RegExp(UNIT_RE.source,"g"),m=re.exec(String(text??""));return m?m[4]:""}

/* ===== THƯ VIỆN KÝ HIỆU Rev.3 — lõi ===== */
const S=(w,h,body,ports)=>({w,h,body,ports:ports||[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}]});
const SYMBOLS={};
const CAT_ORDER=["Bình / Tháp","Trao đổi nhiệt","Bơm","Máy nén / Quạt / Turbine","Van","Phụ kiện đường ống","Đo lường tại ống (inline)","Đo & điều khiển (C&I)","Điện / Tủ điều khiển","Giếng / Package / Xuất nhập","Hạ tầng chuỗi cung ứng khí","Vận tải (xe / tàu / tàu hỏa)","Dòng vào / ra & nối","Chú thích"];
function reg(key,label,cat,prefix,vars,opt){
 SYMBOLS[key]=Object.assign({label,cat,prefix,vars:vars.map(v=>({n:v[0],def:v[1]}))},opt||{});
 SYMBOLS[key].def=SYMBOLS[key].vars[0].def;
}
function varOf(n){const s=SYMBOLS[n.type];return s.vars[Math.min(Math.max(+n.v||0,0),s.vars.length-1)]}
function xpPort(def,p){
 const w=def.w,h=def.h,f=Math.min(1,Math.max(0,+p.f)),o=+p.o||0,s=p.s;
 if(s==="n")return{id:p.id,x:r2((f-.5)*w),y:r2(-h/2-o),d:"n",l:p.l,u:1};
 if(s==="s")return{id:p.id,x:r2((f-.5)*w),y:r2(h/2+o),d:"s",l:p.l,u:1};
 if(s==="w")return{id:p.id,x:r2(-w/2-o),y:r2((f-.5)*h),d:"w",l:p.l,u:1};
 return{id:p.id,x:r2(w/2+o),y:r2((f-.5)*h),d:"e",l:p.l,u:1};
}
const r2=v=>Math.round(v*100)/100;
function symDef(n){
 if(n.type==="text")return textDef(n);
 if(n.type==="area")return{w:n.w||420,h:n.h||260,ports:[],body:""};
 const def=varOf(n).def;
 if(!n.xp||!n.xp.length)return def;
 return Object.assign({},def,{ports:def.ports.concat(n.xp.map(p=>xpPort(def,p)))});
}
function sym(b,k){
 k=k||1;const bw=RS.body/k,tw=RS.thin/k,I=SCH.ink;
 return b.replace(/class="body"/g,`fill="${SCH.fill}" stroke="${I}" stroke-width="${bw}" stroke-linejoin="round"`)
  .replace(/class="thin"/g,`fill="none" stroke="${I}" stroke-width="${tw}"`)
  .replace(/class="dash"/g,`fill="none" stroke="${I}" stroke-width="${tw}" stroke-dasharray="4 3"`)
  .replace(/class="grey"/g,`fill="${SCH.grey}" stroke="${I}" stroke-width="${bw}" stroke-linejoin="round"`)
  .replace(/class="wat"/g,`fill="${SCH.wat}" stroke="${I}" stroke-width="${tw}" stroke-linejoin="round"`)
  .replace(/class="solid"/g,`fill="${I}" stroke="${I}" stroke-width="${tw}" stroke-linejoin="round"`)
  .split(INK).join(I);
}
/* cổng đặc biệt */
const PW=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"}];
const P4=(w,h,yv)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:yv===undefined?h/2:yv,d:"s"}];
const R=(x,y,w,h,c,rx)=>`<rect class="${c||"body"}" x="${x}" y="${y}" width="${w}" height="${h}"${rx?` rx="${rx}"`:""}/>`;
const C=(x,y,r,c)=>`<circle class="${c||"body"}" cx="${x}" cy="${y}" r="${r}"/>`;
const L=(d,c)=>`<path class="${c||"thin"}" d="${d}"/>`;
const T=(x,y,t,fs)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${fs||9}" font-weight="700" fill="${INK}">${t}</text>`;
/* SC: vẽ theo toạ độ tự nhiên rồi tự căn giữa về gốc (0,0) */
const SC=(x0,x1,y0,y1,body,ports)=>{const cx=(x0+x1)/2,cy=(y0+y1)/2;return S(r2(x1-x0),r2(y1-y0),`<g transform="translate(${r2(-cx)},${r2(-cy)})">${body}</g>`,ports?ports.map(p=>Object.assign({},p,{x:r2(p.x-cx),y:r2(p.y-cy)})):undefined)};
const PT=(id,x,y,d,l)=>({id,x,y,d,l});
const LB=(x,y,t,fs,a)=>`<text x="${x}" y="${y}" text-anchor="${a||"middle"}" font-family="Arial" font-size="${fs||7.5}" font-weight="700" fill="${INK}">${t}</text>`;
const BOWY=(a,hh,dy)=>`M${-a} ${-hh+dy} L${a} ${hh+dy} V${-hh+dy} L${-a} ${hh+dy} Z`;
const BOW=(a,hh)=>{a=a||18;hh=hh||10;return`M${-a} ${-hh} L${a} ${hh} V${-hh} L${-a} ${hh} Z`};

/* ===== BÌNH / THÁP ===== */
const HS=(x0,x1,y0,y1)=>`<rect class="body" x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="${(y1-y0)/2}"/>`;
reg("h_sep","Bình tách ngang","Bình / Tháp","V",[
 ["A — Cơ bản",S(124,48,HS(-62,62,-24,24)+L("M-62 6H62")+L("M-30 -24V6"))],
 ["B — Có demister",S(124,48,HS(-62,62,-24,24)+L("M-62 6H62")+L("M30 -24V6","dash")+L("M36 -24V6","dash"))],
 ["C — Đầu dĩa + chân đỡ",S(124,60,`<path class="body" d="M-50 -24H50Q62 -24 62 0Q62 24 50 24H-50Q-62 24 -62 0Q-62 -24 -50 -24Z"/>`+L("M-40 24V32M40 24V32M-48 32H-32M32 32H48"),P4(124,60,32))],
 ["D — Có thùng nước (boot)",S(124,70,HS(-62,62,-24,24)+L("M-62 6H62")+R(24,24,24,22,"body",3),[{id:"w",x:-62,y:0,d:"w"},{id:"e",x:62,y:0,d:"e"},{id:"n",x:0,y:-24,d:"n"},{id:"s",x:36,y:46,d:"s"}])]
]);
reg("v_sep","Bình tách đứng","Bình / Tháp","V",[
 ["A — Cơ bản",S(50,112,R(-25,-56,50,112,"body",25)+L("M-25 24H25"))],
 ["B — Có demister",S(50,112,R(-25,-56,50,112,"body",25)+L("M-25 -22H25","dash")+L("M-25 -16H25","dash"))],
 ["C — Cyclone (vào tiếp tuyến)",S(56,120,R(-25,-56,50,112,"body",25)+L("M-25 -30H-36M-36 -30l5 -4M-36 -30l5 4")+L("M-25 24H25"),[{id:"w",x:-25,y:-30,d:"w"},{id:"e",x:25,y:10,d:"e"},{id:"n",x:0,y:-56,d:"n"},{id:"s",x:0,y:56,d:"s"}])],
 ["D — Đầu dĩa + chân",S(54,130,`<path class="body" d="M-24 -50Q-24 -62 0 -62Q24 -62 24 -50V50Q24 62 0 62Q-24 62 -24 50Z"/>`+L("M-24 30H24")+L("M-18 62V70M18 62V70M-24 70H-12M12 70H24"),P4(54,130,70))]
]);
reg("sep3","Tách 3 pha","Bình / Tháp","V",[
 ["A — Boot nước",S(132,72,`<g transform="translate(0,-9)">`+HS(-66,66,-27,27)+L("M-66 8H66M18 -27V8")+R(34,20,28,24,"body",4)+`</g>`,[{id:"w",x:-66,y:-9,d:"w"},{id:"e",x:66,y:-9,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:48,y:35,d:"s"}])],
 ["B — Tấm chắn (weir)",S(132,60,HS(-66,66,-27,27)+L("M-66 6H66M20 -27V6","thin")+L("M20 6V20","thin")+L("M-66 -4H-10","dash"),[{id:"w",x:-66,y:0,d:"w"},{id:"e",x:66,y:0,d:"e"},{id:"n",x:0,y:-27,d:"n"},{id:"s",x:43,y:27,d:"s"}])],
 ["C — Đầu dĩa + chân",S(132,72,`<path class="body" d="M-52 -27H52Q66 -27 66 0Q66 27 52 27H-52Q-66 27 -66 0Q-66 -27 -52 -27Z"/>`+L("M-66 6H66M18 -27V6M-44 27V35M44 27V35M-52 35H-36M36 35H52"),[{id:"w",x:-66,y:0,d:"w"},{id:"e",x:66,y:0,d:"e"},{id:"n",x:0,y:-27,d:"n"},{id:"s",x:0,y:35,d:"s"}])]
]);
reg("scrubber","Scrubber / KO drum","Bình / Tháp","V",[
 ["A — Đứng có lưới",S(44,100,R(-22,-50,44,100,"body",20)+L("M-22 -28H22")+L("M-22 -22H22","dash"))],
 ["B — Có đáy chứa lỏng",S(44,110,R(-22,-50,44,100,"body",20)+L("M-22 -22H22","dash")+R(-8,50,16,12,"body",2),P4(44,110,62))],
 ["C — Nằm ngang",S(100,42,HS(-50,50,-21,21)+L("M10 -21V21","dash")+L("M16 -21V21","dash"))]
]);
reg("fsep","Lọc tách / Coalescer","Bình / Tháp","F",[
 ["A — Filter separator",S(120,46,HS(-60,60,-23,23)+L("M-5 -23V23")+L("M5 -23V23")+L("M-5 0H5","dash"))],
 ["B — Coalescer đứng",S(44,96,R(-22,-48,44,96,"body",16)+L("M-10 -28V30M10 -28V30M-10 30H10","thin"))]
]);
reg("desalter","Desalter / Tách tĩnh điện","Bình / Tháp","V",[
 ["A — Điện cực",S(130,50,HS(-65,65,-25,25)+L("M-30 -10H30M-30 0H30M-30 10H30","dash")+L("M-30 -25V-34M30 -25V-34M-36 -34H-24M24 -34H36")+L("M-65 14H65"))]
]);
reg("hydrocyclone","Hydrocyclone","Bình / Tháp","HC",[
 ["A — Hình nón",S(40,100,`<path class="body" d="M-18 -50H18V-8L5 50H-5L-18 -8Z"/>`+L("M-18 -30H-30M-30 -30l5 -4M-30 -30l5 4"),[{id:"w",x:-18,y:-30,d:"w"},{id:"e",x:18,y:-30,d:"e"},{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:50,d:"s"}])],
 ["B — Cụm 3 cyclone",S(90,100,[-30,0,30].map(x=>`<path class="body" d="M${x-10} -40H${x+10}V-8L${x+3} 40H${x-3}L${x-10} -8Z"/>`).join("")+R(-45,-50,90,14,"body",2))]
]);
reg("column","Tháp chưng cất / hấp thụ","Bình / Tháp","T",[
 ["A — Đĩa (tray)",S(58,154,R(-29,-77,58,154,"body",12)+L("M-29 -45H29M-29 -15H29M-29 15H29M-29 45H29"))],
 ["B — Đệm (packed)",S(58,154,R(-29,-77,58,154,"body",12)+`<g clip-path="none">`+L("M-29 -40L29 -10M-29 -10L29 -40M-29 -10L29 20M-29 20L29 -10M-29 20L29 50M-29 50L29 20","thin")+`</g>`)],
 ["C — Đĩa + phần đệm",S(58,154,R(-29,-77,58,154,"body",12)+L("M-29 -50H29M-29 -30H29")+L("M-29 0L29 28M-29 28L29 0M-29 28L29 56M-29 56L29 28"))],
 ["D — Mảnh (stripper)",S(40,150,R(-20,-75,40,150,"body",10)+L("M-20 -45H20M-20 -15H20M-20 15H20M-20 45H20"))]
]);
reg("reactor","Reactor / Lò phản ứng","Bình / Tháp","R",[
 ["A — Cơ bản",S(62,104,R(-31,-52,62,104,"body",28)+L("M-31 -10Q0 -28 31 -10M-31 18Q0 0 31 18"))],
 ["B — Có cánh khuấy (CSTR)",S(66,110,R(-31,-48,62,96,"body",14)+L("M0 -64V28")+L("M-14 28H14M-10 20H10","solid")+C(0,-64,5,"body"),[{id:"w",x:-31,y:0,d:"w"},{id:"e",x:31,y:0,d:"e"},{id:"n",x:0,y:-69,d:"n"},{id:"s",x:0,y:48,d:"s"}])],
 ["C — Tầng xúc tác cố định",S(62,110,R(-31,-52,62,104,"body",22)+L("M-31 -20H31M-31 14H31")+L("M-31 -20L31 14M-31 14L31 -20","thin"))],
 ["D — Có áo gia nhiệt",S(74,110,R(-31,-52,62,104,"body",22)+L("M-37 -30V30Q-37 40 -31 44M37 -30V30Q37 40 31 44","thin"))]
]);
reg("tank","Bồn chứa thường áp","Bình / Tháp","TK",[
 ["A — Mái côn",S(96,62,R(-48,-24,96,48,"body")+L("M-48 -24Q0 -46 48 -24M-48 10H48"))],
 ["B — Mái nổi",S(96,62,R(-48,-24,96,48,"body")+L("M-48 -14H48M-48 -10H48"))],
 ["C — Mái vòm",S(96,66,R(-48,-20,96,44,"body")+`<path class="body" d="M-48 -20Q0 -50 48 -20Z"/>`)],
 ["D — Bồn nằm (bullet)",S(110,46,HS(-55,55,-18,18)+L("M-30 18V28M30 18V28M-40 28H-20M20 28H40"),P4(110,46,28))]
]);
reg("sphere","Bồn cầu (LPG)","Bình / Tháp","TK",[
 ["A — Chân đỡ",S(76,92,C(0,-4,34)+L("M-34 8H34M-20 26L-24 40M20 26L24 40M-30 40H-18M18 40H30"),P4(76,92,40))],
 ["B — Đơn giản",S(70,70,C(0,0,34)+L("M-34 0H34","dash"))]
]);
reg("flare","Đuốc đốt khí (Flare)","Bình / Tháp","FL",[
 ["A — Ống đuốc",S(30,118,R(-5,-31,10,90,"body")+`<path class="body" d="M0 -59Q-14 -45 -6 -33H6Q14 -45 0 -59Z"/>`,[{id:"w",x:-5,y:30,d:"w"},{id:"s",x:0,y:59,d:"s"}])],
 ["B — Ground flare",S(70,70,R(-34,-30,68,60,"body")+`<path class="body" d="M0 -12Q-10 0 -4 8H4Q10 0 0 -12Z"/>`,[{id:"w",x:-34,y:0,d:"w"},{id:"s",x:0,y:30,d:"s"}])],
 ["C — Knock-out + đuốc",S(60,130,R(-18,10,36,50,"body",14)+R(-4,-60,8,70,"body")+`<path class="body" d="M0 -72Q-10 -62 -5 -58H5Q10 -62 0 -72Z"/>`,[{id:"w",x:-18,y:35,d:"w"},{id:"s",x:0,y:60,d:"s"}])]
]);
reg("slug_catcher","Slug catcher","Bình / Tháp","SC",[
 ["A — Kiểu ngón",S(100,84,R(-50,-42,100,36,"body",18)+L("M-30 -6V38M0 -6V38M30 -6V38M-30 38H30"),[{id:"w",x:-50,y:-24,d:"w"},{id:"e",x:50,y:-24,d:"e"},{id:"n",x:0,y:-42,d:"n"},{id:"s",x:0,y:38,d:"s"}])],
 ["B — Bình lớn",S(130,52,HS(-65,65,-26,26)+L("M-40 26V38M40 26V38"),P4(130,52,38))]
]);
reg("cpi","Tách dầu API / CPI","Bình / Tháp","S",[
 ["A — Hộp tấm nghiêng",S(100,50,R(-50,-25,100,50,"body")+L("M-30 -25L-20 25M-10 -25L0 25M10 -25L20 25M30 -25L40 25"))]
]);
reg("sump","Hố gom / Sump","Bình / Tháp","SP",[
 ["A — Hố hở",S(60,50,`<path class="body" d="M-30 -20H30L22 22H-22Z"/>`+L("M-26 -4H26","dash"),[{id:"w",x:-30,y:-20,d:"w"},{id:"e",x:30,y:-20,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["B — Bể chìm",S(70,50,R(-35,-25,70,50,"body")+L("M-35 -8H35","dash"))]
]);

/* ===== TRAO ĐỔI NHIỆT ===== */
reg("exchanger","Trao đổi nhiệt vỏ-ống","Trao đổi nhiệt","E",[
 ["A — Ký hiệu chữ thập",S(76,38,R(-38,-19,76,38,"body",6)+C(0,0,13,"thin")+L("M-13 0H13M0 -13V13"))],
 ["B — Ống chữ U",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 -8H20Q30 -8 30 0Q30 8 20 8H-24"))],
 ["C — Có vách ngăn (TEMA)",S(80,38,R(-40,-19,80,38,"body",6)+L("M-14 -19V8M14 -8V19M-40 0H-26M26 0H40","thin"))],
 ["D — Vỏ-ống đứng",S(40,80,R(-20,-40,40,80,"body",6)+L("M-8 -40V40M8 -40V40"))]
]);
reg("plate_hx","Trao đổi nhiệt tấm","Trao đổi nhiệt","E",[
 ["A — Tấm",S(60,48,R(-30,-24,60,48,"body")+L("M-20 -24V24M-10 -24V24M0 -24V24M10 -24V24M20 -24V24"))],
 ["B — Khung + tấm",S(70,48,R(-35,-24,6,48,"grey")+R(29,-24,6,48,"grey")+R(-29,-20,58,40,"body")+L("M-14 -20V20M-4 -20V20M6 -20V20M16 -20V20"))]
]);
reg("double_pipe","Ống lồng ống","Trao đổi nhiệt","E",[
 ["A — Hairpin",S(80,36,R(-40,-12,80,24,"body")+L("M-40 0H40"))]
]);
reg("reboiler","Reboiler / Kettle","Trao đổi nhiệt","E",[
 ["A — Kettle",S(80,40,R(-40,-20,80,40,"body",20)+L("M-26 0H-16L-9 -9L0 9L9 -9L16 0H26"))],
 ["B — Thermosyphon",S(44,70,R(-22,-35,44,70,"body",8)+L("M-10 -35V35M10 -35V35"))]
]);
reg("condenser","Condenser / Cooler","Trao đổi nhiệt","E",[
 ["A — Chữ nhật",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 -8L24 8M-24 8L24 -8","thin"))],
 ["B — Nước làm mát",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 6Q-12 -6 0 6Q12 -6 24 6"))]
]);
reg("chiller","Chiller","Trao đổi nhiệt","E",[
 ["A — Chiller",S(76,38,R(-38,-19,76,38,"body",19)+T(0,3,"CH",11))]
]);
reg("aircooler","Air cooler / Fin-fan","Trao đổi nhiệt","E",[
 ["A — Cấp gió (forced)",S(96,46,`<g transform="translate(0,-9)">`+R(-48,-14,96,28,"body")+C(-24,22,9,"thin")+C(24,22,9,"thin")+L("M-48 14H-33M48 14H33")+`</g>`,[{id:"w",x:-48,y:-9,d:"w"},{id:"e",x:48,y:-9,d:"e"},{id:"n",x:0,y:-23,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["B — Hút gió (induced)",S(96,46,`<g transform="translate(0,9)">`+R(-48,-14,96,28,"body")+C(-24,-22,9,"thin")+C(24,-22,9,"thin")+L("M-48 -14H-33M48 -14H33")+`</g>`,[{id:"w",x:-48,y:9,d:"w"},{id:"e",x:48,y:9,d:"e"},{id:"n",x:0,y:-31,d:"n"},{id:"s",x:0,y:23,d:"s"}])],
 ["C — Một quạt",S(64,46,`<g transform="translate(0,-9)">`+R(-32,-14,64,28,"body")+C(0,22,9,"thin")+`</g>`,[{id:"w",x:-32,y:-9,d:"w"},{id:"e",x:32,y:-9,d:"e"},{id:"n",x:0,y:-23,d:"n"},{id:"s",x:0,y:31,d:"s"}])]
]);
reg("heater","Lò gia nhiệt","Trao đổi nhiệt","H",[
 ["A — Hộp lửa",S(72,76,R(-36,-38,72,76,"body")+L("M-18 26Q-8 6 0 22Q8 4 18 26Q10 34 -18 26")+L("M-24 -18H24M-24 -6H24"))],
 ["B — Cabin + ống khói",S(72,100,R(-36,-18,72,56,"body")+R(-8,-50,16,32,"body")+L("M-24 -4H24M-24 8H24")+L("M-16 30Q-6 14 0 26Q6 12 16 30"),[{id:"w",x:-36,y:10,d:"w"},{id:"e",x:36,y:10,d:"e"},{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:38,d:"s"}])],
 ["C — Lò điện",S(60,50,R(-30,-25,60,50,"body")+L("M-20 0H-14L-8 -10L0 10L8 -10L14 0H20"))],
 ["D — Lò dầu nóng",S(70,70,R(-35,-35,70,70,"body")+C(0,0,18,"thin")+L("M-12 -4Q-6 -12 0 -4Q6 4 12 -4M-12 6Q-6 -2 0 6Q6 14 12 6"))]
]);
reg("wasteheat","Nồi hơi / Waste heat","Trao đổi nhiệt","B",[
 ["A — Boiler",S(80,70,R(-40,-35,80,70,"body")+C(0,0,20,"thin")+T(0,4,"B",12))],
 ["B — HRSG",S(90,60,R(-45,-30,90,60,"body")+L("M-30 -30V30M-10 -30V30M10 -30V30M30 -30V30","dash"))]
]);
reg("cooling_tower","Tháp giải nhiệt","Trao đổi nhiệt","CT",[
 ["A — Cooling tower",S(80,80,`<path class="body" d="M-40 -30H40L34 30H-34Z"/>`+L("M-34 -10H34M-36 10H36","dash")+C(0,-40,7,"thin"),[{id:"w",x:-37,y:0,d:"w"},{id:"e",x:37,y:0,d:"e"},{id:"n",x:0,y:-47,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);

/* ===== BƠM ===== */
const PORT_WE_N=(w,h,yn)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:yn,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("pump","Bơm ly tâm","Bơm","P",[
 ["A — Tròn + tam giác",S(48,40,C(0,0,18)+L("M0 -16L16 12H-16ZM-24 0H-18M18 0H24"))],
 ["B — ISO (đẩy lên trên)",S(48,46,C(0,4,18)+L("M0 -14V-22M0 -22H24")+L("M-24 4H-18"),[{id:"w",x:-24,y:4,d:"w"},{id:"e",x:24,y:-22,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["C — Volute (cổ ra phía trên)",S(54,50,`<path class="body" d="M-18 -4A18 18 0 1 0 14 -12L24 -22H-6V-12A18 18 0 0 0 -18 -4Z"/>`+L("M-26 4H-18"),[{id:"w",x:-26,y:4,d:"w"},{id:"e",x:24,y:-22,d:"e"},{id:"n",x:9,y:-22,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["D — Bơm + động cơ",S(86,40,C(-18,0,18)+L("M-18 -16L-2 12H-34Z")+R(0,-12,32,24,"body")+T(16,4,"M",11)+L("M-36 0H-42"),[{id:"w",x:-36,y:0,d:"w"},{id:"e",x:32,y:0,d:"e"},{id:"n",x:-18,y:-18,d:"n"},{id:"s",x:-18,y:18,d:"s"}])],
 ["E — Bơm đứng (sump)",S(40,100,R(-8,-30,16,70,"body")+C(0,-44,14)+L("M-14 -44H14M0 -58V-30","thin")+R(-12,40,24,14,"body",3),[{id:"w",x:-14,y:-44,d:"w"},{id:"e",x:14,y:-44,d:"e"},{id:"n",x:0,y:-58,d:"n"},{id:"s",x:0,y:54,d:"s"}])],
 ["F — Bơm chìm (ESP)",S(34,100,R(-8,-48,16,96,"body",5)+L("M-8 -28H8M-8 -8H8M-8 12H8M-8 32H8"))]
]);
reg("pd_pump","Bơm thể tích / định lượng","Bơm","P",[
 ["A — Bánh răng",S(48,40,C(0,0,18)+C(-6,0,6,"thin")+C(6,0,6,"thin")+L("M-24 0H-18M18 0H24"))],
 ["B — Piston (reciprocating)",S(54,40,R(-18,-14,36,28,"body",3)+L("M-6 -14V14M6 -14V14M-18 0H-24M18 0H24"))],
 ["C — Trục vít",S(54,40,R(-18,-14,36,28,"body",14)+L("M-12 -8L-4 8M-4 -8L4 8M4 -8L12 8M-24 0H-18M18 0H24"))],
 ["D — Màng (diaphragm)",S(48,40,C(0,0,18)+L("M-12 0Q0 -14 12 0")+L("M-24 0H-18M18 0H24"))],
 ["E — Trục vít xoắn (PCP)",S(60,40,R(-24,-12,48,24,"body",12)+L("M-14 -6Q-8 6 -2 -6T10 -6M-30 0H-24M24 0H30"),PW(60,40))],
 ["F — Định lượng (metering)",S(44,44,C(0,4,16)+L("M0 -12V-24M-8 -24H8")+L("M-8 4H8M0 -4V12"),[{id:"w",x:-16,y:4,d:"w"},{id:"e",x:16,y:4,d:"e"},{id:"n",x:0,y:-24,d:"n"},{id:"s",x:0,y:20,d:"s"}])]
]);
reg("vac_pump","Bơm chân không / Ejector","Bơm","VP",[
 ["A — Bơm chân không",S(48,40,C(0,0,18)+T(0,4,"V",11)+L("M-24 0H-18M18 0H24"))],
 ["B — Ejector",S(70,30,`<path class="body" d="M-35 -8H-10L5 -4H35V4H5L-10 8H-35Z"/>`,[{id:"w",x:-35,y:0,d:"w"},{id:"e",x:35,y:0,d:"e"},{id:"n",x:-12,y:-8,d:"n"},{id:"s",x:-12,y:8,d:"s"}])]
]);

/* ===== MÁY NÉN / QUẠT / TURBINE / ĐỘNG CƠ ===== */
reg("compressor","Máy nén","Máy nén / Quạt / Turbine","K",[
 ["A — Ly tâm (hình thang)",S(62,44,`<path class="body" d="M-28 -20H16L30 0L16 20H-28Z"/>`+L("M-28 0H30"))],
 ["B — Ly tâm (ISO)",S(60,52,`<path class="body" d="M-30 -26L30 -14V14L-30 26Z"/>`,[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:0,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:20,d:"s"}])],
 ["C — Piston (reciprocating)",S(70,50,C(-12,0,18)+R(6,-8,30,16,"body")+L("M-12 -18V-26M-12 18V26"),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:36,y:0,d:"e"},{id:"n",x:-12,y:-26,d:"n"},{id:"s",x:-12,y:26,d:"s"}])],
 ["D — Trục vít",S(60,44,R(-28,-18,56,36,"body",16)+L("M-18 -10L-8 10M-8 -10L2 10M2 -10L12 10"))],
 ["E — Hướng trục",S(70,46,`<path class="body" d="M-35 -10L35 -22V22L-35 10Z"/>`+L("M-20 -9V9M-6 -12V12M8 -15V15M22 -18V18"),[{id:"w",x:-35,y:0,d:"w"},{id:"e",x:35,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["F — Máy nén + động cơ",S(110,46,`<path class="body" d="M-52 -20H-8L6 0L-8 20H-52Z"/>`+L("M-52 0H6")+R(10,-14,40,28,"body")+T(30,5,"M",13),[{id:"w",x:-52,y:0,d:"w"},{id:"e",x:50,y:0,d:"e"},{id:"n",x:-24,y:-20,d:"n"},{id:"s",x:-24,y:20,d:"s"}])]
]);
reg("blower","Quạt / Blower","Máy nén / Quạt / Turbine","FN",[
 ["A — Quạt hướng trục",S(44,44,C(0,0,20)+L("M0 0L8 -14M0 0L-14 -6M0 0L6 14"))],
 ["B — Blower ly tâm",S(48,44,C(0,0,18)+L("M0 0L10 -14M0 0L-12 -8M0 0L2 16")+L("M18 -18H34"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:34,y:-18,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])]
]);
reg("expander","Turbine / Expander","Máy nén / Quạt / Turbine","K",[
 ["A — Turbo-expander",S(62,44,`<path class="body" d="M-30 -14H14L30 -22V22L14 14H-30Z"/>`)],
 ["B — Turbine hơi",S(62,44,`<path class="body" d="M-30 -14L30 -22V22L-30 14Z"/>`+T(0,4,"ST",10),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Turbine khí (GT)",S(100,50,`<path class="body" d="M-50 -24L-10 -14V14L-50 24Z"/>`+R(-10,-12,22,24,"body",4)+`<path class="body" d="M12 -14L50 -24V24L12 14Z"/>`,[{id:"w",x:-50,y:0,d:"w"},{id:"e",x:50,y:0,d:"e"},{id:"n",x:1,y:-17,d:"n"},{id:"s",x:1,y:17,d:"s"}])]
]);
reg("motor","Động cơ / Máy phát","Máy nén / Quạt / Turbine","M",[
 ["A — Động cơ điện (M)",S(40,40,C(0,0,18)+T(0,5,"M",14))],
 ["B — Máy phát (G)",S(40,40,C(0,0,18)+T(0,5,"G",14))],
 ["C — Động cơ đốt trong",S(46,40,R(-22,-18,44,36,"body",4)+T(0,5,"E",14))],
 ["D — Hộp số",S(40,32,R(-20,-16,40,32,"body")+C(-6,0,7,"thin")+C(7,0,5,"thin"))],
 ["E — Biến tần (VFD)",S(40,36,R(-20,-18,40,36,"body")+L("M-12 4Q-6 -8 0 4T12 4"))]
]);
reg("agitator","Máy khuấy / Mixer","Máy nén / Quạt / Turbine","AG",[
 ["A — Cánh khuấy",S(40,70,L("M0 -34V26")+L("M-14 26H14M-10 18H10","solid")+C(0,-40,6,"body"),[{id:"w",x:-6,y:-40,d:"w"},{id:"e",x:6,y:-40,d:"e"},{id:"n",x:0,y:-46,d:"n"},{id:"s",x:0,y:28,d:"s"}])],
 ["B — Mixer tĩnh",S(70,26,R(-35,-12,70,24,"body")+L("M-25 -12L-15 12M-5 -12L5 12M15 -12L25 12"))],
 ["C — Điểm trộn",S(44,44,C(0,0,20)+L("M-12 -12L12 12M12 -12L-12 12"))]
]);

/* ===== VAN ===== */
const ACT_D=(y)=>`<path class="body" d="M-11 ${y}A11 11 0 0 1 11 ${y}Z"/>`;
const ACT_P=(y)=>R(-9,y-16,18,16,"body")+L(`M-9 ${y-8}H9`);
const ACT_M=(y)=>C(0,y-9,9)+T(0,y-6,"M",10);
const ACT_S=(y)=>`<path class="body" d="M-11 ${y}A11 11 0 0 1 11 ${y}Z"/>`+L(`M-6 ${y-9}L6 ${y-9}M-5 ${y-6}L5 ${y-6}`);
const VP=(a,ytop,ybot)=>[{id:"w",x:-a,y:0,d:"w"},{id:"e",x:a,y:0,d:"e"},{id:"n",x:0,y:ytop,d:"n"},{id:"s",x:0,y:ybot,d:"s"}];
const VS=(a,hh,extra,ytop)=>S(a*2,Math.abs(ytop||-hh)+hh,`<path class="body" d="${BOW(a,hh)}"/>`+(extra||""),VP(a,ytop===undefined?-hh:ytop,hh));
reg("valve_gate","Van cổng (gate)","Van","HV",[
 ["A — Ký hiệu chuẩn",VS(18,10)],
 ["B — Có tay quay",VS(18,10,L("M0 0V-16M-7 -16H7"),-16)],
 ["C — Khóa (LO/LC)",VS(18,10,L("M0 0V-12")+R(-4,-20,8,8,"solid"),-20)]
]);
reg("valve_ball","Van bi (ball)","Van","HV",[
 ["A — Chấm đặc",VS(18,10,C(0,0,3.5,"solid"))],
 ["B — Tay gạt",VS(18,10,C(0,0,3.5,"solid")+L("M0 0V-12M-8 -12H8"),-12)],
 ["C — Van bi 3 ngả",S(36,36,`<path class="body" d="M-18 -10L0 0L-18 10ZM18 -10L0 0L18 10ZM-10 18L0 0L10 18Z"/>`+C(0,0,3.5,"solid"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-10,d:"n"}])]
]);
reg("valve_globe","Van cầu (globe)","Van","HV",[
 ["A — Vòng tròn",VS(18,10,C(0,0,4.5))],
 ["B — Có tay quay",VS(18,10,C(0,0,4.5)+L("M0 -4.5V-16M-7 -16H7"),-16)]
]);
reg("valve_butterfly","Van bướm","Van","HV",[
 ["A — Vạch đứng",VS(18,10,L("M0 -10V10"))],
 ["B — Cánh bướm",VS(18,10,`<path class="body" d="M-3 -8Q0 0 -3 8L3 8Q0 0 3 -8Z"/>`.replace("body","thin"))]
]);
reg("valve_plug","Van nút / Needle","Van","HV",[
 ["A — Van nút (plug)",VS(18,10,`<path class="thin" d="M-4 -6L4 -6L0 4Z"/>`)],
 ["B — Van kim (needle)",VS(18,10,L("M0 0V-10M-5 -10H5M-3 -3L0 4L3 -3"),-10)]
]);
reg("valve_check","Van một chiều","Van","CV",[
 ["A — Cơ bản",S(36,22,`<path class="body" d="M-18 -11L6 0L-18 11Z"/>`+L("M8 -11V11M6 0H18"),PW(36,22).concat([{id:"n",x:0,y:-11,d:"n"},{id:"s",x:0,y:11,d:"s"}]))],
 ["B — Swing check",S(36,22,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 -10V0M0 0L8 6"))],
 ["C — Wafer (dual plate)",S(36,24,R(-4,-12,8,24,"body")+L("M-18 0H-4M4 0H18")+L("M-4 -12L4 0L-4 12","thin"))]
]);
reg("valve_control","Van điều khiển","Van","PV",[
 ["A — Màng (diaphragm)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Piston",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_P(0),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-16,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Động cơ (motor)",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_M(0),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["D — Có positioner",S(48,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+R(8,-12,12,9,"body")+L("M11 -7H17"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_esd","Van ESD / SDV / BDV","Van","XV",[
 ["A — Màng + lò xo (SDV)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_S(-1),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Piston + lò xo",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_P(0)+L("M-4 -14L4 -10L-4 -6"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-16,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Van bi + solenoid (ESDV)",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+C(0,9,3.5,"solid")+L("M0 9V0")+R(-9,-14,18,14,"body")+L("M-5 -14L5 0M5 -14L-5 0"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_psv","Van an toàn PSV","Van","PSV",[
 ["A — Góc, lò xo",S(40,48,`<path class="body" d="M-9 22H9L0 8ZM0 8L16 -2V18Z"/>`+L("M0 8V-6L-5 -9L5 -13L-5 -17L5 -21L0 -24"),[{id:"s",x:0,y:22,d:"s"},{id:"e",x:16,y:8,d:"e"},{id:"n",x:0,y:-24,d:"n"}])],
 ["B — Thẳng, lò xo",S(36,56,`<path class="body" d="M-10 24L10 24L0 10Z"/>`+`<path class="body" d="M-10 -4H10L0 10Z"/>`+L("M0 -4V-12L-5 -15L5 -19L-5 -23L5 -27L0 -30"),[{id:"s",x:0,y:24,d:"s"},{id:"n",x:0,y:-30,d:"n"},{id:"e",x:10,y:3,d:"e"},{id:"w",x:-10,y:3,d:"w"}])],
 ["C — Pilot-operated",S(56,56,`<path class="body" d="M-9 22H9L0 8ZM0 8L16 -2V18Z"/>`+L("M0 8V-6L-5 -9L5 -13L-5 -17L5 -21L0 -24")+C(22,-18,7,"body")+L("M16 -2L22 -11M0 -14H15L22 -11"),[{id:"s",x:0,y:22,d:"s"},{id:"e",x:16,y:8,d:"e"},{id:"n",x:0,y:-24,d:"n"}])]
]);
reg("valve_rd","Đĩa nổ / Rupture disc","Van","RD",[
 ["A — Rupture disc",S(34,26,L("M-17 0H-8M8 0H17")+`<path class="body" d="M-8 -11Q4 0 -8 11M8 -11Q-4 0 8 11"/>`,PW(34,26))]
]);
reg("valve_reg","Van giảm áp / PCV tự lực","Van","PCV",[
 ["A — Tự lực (lò xo)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+L("M-14 -1L14 -1M0 -1V-6","thin"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Back-pressure",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+L("M-14 -8L14 -8"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_sol","Van điện từ / Float","Van","SV",[
 ["A — Solenoid",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+R(-8,-14,16,14,"body")+L("M-5 -11L5 -3M5 -11L-5 -3","thin"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Float valve",S(40,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-4L12 -4")+C(15,-4,4,"body"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Van 4 ngả",S(40,40,`<path class="body" d="M-18 -10L0 0L-18 10ZM18 -10L0 0L18 10ZM-10 18L0 0L10 18ZM-10 -18L0 0L10 -18Z"/>`,[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-18,d:"n"}])]
]);
reg("vent_valve","PVRV / Breather","Van","PV",[
 ["A — PV valve",S(36,44,`<path class="body" d="M-10 22H10L0 8ZM-10 -8H10L0 8Z"/>`+L("M-6 -12H6M-4 -16H4"),[{id:"s",x:0,y:22,d:"s"},{id:"n",x:0,y:-16,d:"n"},{id:"e",x:10,y:7,d:"e"},{id:"w",x:-10,y:7,d:"w"}])],
 ["B — Vent mở",S(30,40,L("M0 20V-4")+`<path class="body" d="M-12 -4H12L0 -20Z"/>`,[{id:"s",x:0,y:20,d:"s"},{id:"n",x:0,y:-20,d:"n"},{id:"e",x:12,y:-4,d:"e"},{id:"w",x:-12,y:-4,d:"w"}])]
]);
const INS_ITEMS=[];

/* ===== PHỤ KIỆN ĐƯỜNG ỐNG ===== */
const IP=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("reducer","Côn thu / Reducer","Phụ kiện đường ống","RD",[
 ["A — Đồng tâm",S(32,24,`<path class="body" d="M-16 -11L16 -5V5L-16 11Z"/>`)],
 ["B — Lệch tâm",S(32,24,`<path class="body" d="M-16 -11L16 -5V11H-16Z"/>`)],
 ["C — Mở rộng (swage)",S(34,24,`<path class="body" d="M-17 -4L17 -11V11L-17 4Z"/>`)]
]);
reg("strainer","Lọc ống / Strainer","Phụ kiện đường ống","STR",[
 ["A — Dạng Y",S(36,32,L("M-18 0H18")+`<path class="body" d="M-12 -8H12V8H-12Z"/>`+L("M0 8L8 20","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:8,y:20,d:"s"}])],
 ["B — Rổ lọc (basket)",S(40,36,R(-18,-12,36,24,"body")+L("M-12 -6V6M-4 -6V6M4 -6V6M12 -6V6")+L("M-22 0H-18M18 0H22"),PW(40,36))],
 ["C — Dạng T",S(36,32,R(-14,-8,28,16,"body")+L("M-14 0H14","dash"),IP(36,24))],
 ["D — Phin tạm (cone)",S(36,24,`<path class="body" d="M-16 -10L16 0L-16 10Z"/>`+L("M-16 -10V10"))]
]);
reg("arrestor","Chặn lửa / Flame arrestor","Phụ kiện đường ống","FA",[
 ["A — Flame arrestor",S(36,28,R(-14,-12,28,24,"body")+L("M-8 -12V12M-2 -12V12M4 -12V12M10 -12V12")+L("M-18 0H-14M14 0H18"),PW(36,28))]
]);
reg("spec_blind","Mặt bích mù / Spectacle","Phụ kiện đường ống","SB",[
 ["A — Spectacle (mở)",S(40,24,C(-9,0,8)+C(9,0,8,"solid")+L("M-17 0H-24M17 0H24"),PW(40,24))],
 ["B — Spectacle (đóng)",S(40,24,C(-9,0,8,"solid")+C(9,0,8)+L("M-17 0H-24M17 0H24"),PW(40,24))],
 ["C — Mặt bích mù",S(20,28,L("M-10 0H0")+R(-2,-12,6,24,"solid"),[{id:"w",x:-10,y:0,d:"w"},{id:"e",x:4,y:0,d:"e"}])],
 ["D — Nắp bịt (cap)",S(22,22,L("M-11 0H0")+`<path class="body" d="M0 -8Q10 0 0 8Z"/>`,[{id:"w",x:-11,y:0,d:"w"}])]
]);
reg("flange","Mặt bích / Khớp nối","Phụ kiện đường ống","FL",[
 ["A — Cặp mặt bích",S(24,26,L("M-12 0H12")+L("M-3 -11V11M3 -11V11"),PW(24,26))],
 ["B — Khớp giãn nở (bellows)",S(40,26,L("M-20 0H-14M14 0H20")+L("M-14 -9L-10 9L-6 -9L-2 9L2 -9L6 9L10 -9L14 9","thin"),PW(40,26))],
 ["C — Ống mềm (hose)",S(44,24,L("M-22 0H-16M16 0H22")+`<path class="thin" d="M-16 0Q-8 -12 0 0T16 0"/>`,PW(44,24))],
 ["D — Điểm nối nhanh",S(26,26,C(0,0,6,"solid")+L("M-13 0H-6M6 0H13"),PW(26,26))]
]);
reg("sight","Kính quan sát / Bẫy hơi","Phụ kiện đường ống","SG",[
 ["A — Sight glass",S(34,30,L("M-17 0H-10M10 0H17")+C(0,0,10)+L("M-6 -6L6 6M6 -6L-6 6","thin"),PW(34,30))],
 ["B — Steam trap",S(34,30,C(0,0,10)+L("M-17 0H-10M10 0H17")+T(0,4,"ST",9),PW(34,30))],
 ["C — Silencer",S(46,28,R(-18,-12,36,24,"body",6)+L("M-23 0H-18M18 0H23")+L("M-8 -12V12M0 -12V12M8 -12V12","dash"),PW(46,28))],
 ["D — Drain pot",S(40,50,R(-14,-14,28,36,"body",4)+L("M-20 -4H-14M14 -4H20")+L("M0 22V30"),[{id:"w",x:-20,y:-4,d:"w"},{id:"e",x:20,y:-4,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);
reg("vent_drain","Vent / Drain / Lấy mẫu","Phụ kiện đường ống","VT",[
 ["A — Vent",S(26,34,L("M0 17V-4")+`<path class="body" d="M-8 -4H8L0 -16Z"/>`,[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-16,d:"n"}])],
 ["B — Drain",S(26,34,L("M0 -17V4")+`<path class="body" d="M-8 4H8L0 16Z"/>`,[{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:16,d:"s"}])],
 ["C — Điểm lấy mẫu",S(30,34,L("M0 17V0")+C(0,-8,8)+T(0,-5,"S",10),[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-16,d:"n"}])],
 ["D — Điểm hoá chất (injection)",S(34,34,L("M0 17V-2")+C(0,-10,7)+L("M-5 -15L5 -5M5 -15L-5 -5","thin"),[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-17,d:"n"}])],
 ["E — Đầu nối ống mềm",S(34,26,L("M-17 0H-6")+`<path class="body" d="M-6 -7L6 -7L6 7L-6 7Z"/>`+L("M6 0H17"),PW(34,26))]
]);
reg("ptap","Thermowell / Nhánh đo","Phụ kiện đường ống","TW",[
 ["A — Thermowell",S(24,34,L("M0 -2V-17")+`<path class="body" d="M-4 -2H4V12L0 17L-4 12Z"/>`,[{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["B — Nhánh áp suất",S(24,30,L("M0 15V-8")+C(0,-12,4,"solid"),[{id:"s",x:0,y:15,d:"s"},{id:"n",x:0,y:-16,d:"n"}])]
]);

/* ===== ĐO LƯỜNG TẠI ỐNG (inline) ===== */
const IW=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("orifice","Tấm tiết lưu / FE","Đo lường tại ống (inline)","FE",[
 ["A — Orifice plate",S(36,40,L("M-18 0H-4M4 0H18")+L("M-4 -14V14M4 -14V14","body")+L("M-4 -14H4M-4 14H4","thin"),IW(36,40))],
 ["B — Có ống đo áp chênh",S(36,50,L("M-18 0H18")+L("M-3 -12V12M3 -12V12","body")+L("M-3 -12V-24M3 -12V-24","thin")+C(0,-24,2.5,"solid"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:12,d:"s"}])],
 ["C — Venturi",S(54,30,`<path class="body" d="M-27 -10L-8 -5H8L27 -10V10L8 5H-8L-27 10Z"/>`,IW(54,20))],
 ["D — Flow nozzle",S(44,30,`<path class="body" d="M-22 -10Q-6 -10 -2 -4H22V4H-2Q-6 10 -22 10Z"/>`,IW(44,20))],
 ["E — Pitot / Annubar",S(34,44,L("M-17 0H17")+L("M0 -22V8")+C(0,8,3,"solid"),[{id:"w",x:-17,y:0,d:"w"},{id:"e",x:17,y:0,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:10,d:"s"}])]
]);
reg("flowmeter","Lưu lượng kế (inline)","Đo lường tại ống (inline)","FT",[
 ["A — Coriolis",S(60,46,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+L("M-14 -6H10Q16 -6 16 0T10 6H-14","thin"),IW(60,24))],
 ["B — Siêu âm",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+L("M-12 -12L12 12","dash")+L("M12 -12L-12 12","dash"),IW(60,24))],
 ["C — Từ (mag)",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+T(0,4,"MAG",10),IW(60,24))],
 ["D — Vortex",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+`<path class="thin" d="M-4 -7L2 0L-4 7Z"/>`,IW(60,24))],
 ["E — Turbine",S(54,40,C(0,0,13)+L("M-27 0H-13M13 0H27")+L("M0 0L8 -9M0 0L-9 -5M0 0L3 10","thin"),IW(54,26))],
 ["F — PD (bánh răng)",S(54,40,C(0,0,13)+L("M-27 0H-13M13 0H27")+C(-5,0,5,"thin")+C(5,0,5,"thin"),IW(54,26))],
 ["G — Rotameter",S(34,50,`<path class="body" d="M-8 -20L8 -20L5 20H-5Z"/>`+L("M-17 20H-5M5 -20H17","thin")+L("M-3 6H3","solid"),[{id:"w",x:-17,y:20,d:"w"},{id:"e",x:17,y:-20,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:20,d:"s"}])]
]);
reg("analyzer","Đầu dò phân tích","Đo lường tại ống (inline)","AE",[
 ["A — Đầu dò (probe)",S(26,36,L("M0 18V0")+R(-8,-14,16,14,"body")+T(0,-3,"AE",8),[{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-14,d:"n"}])],
 ["B — H2S / CO2 online",S(46,40,R(-20,-14,40,28,"body",3)+T(0,4,"AT",12)+L("M0 14V22","thin"),[{id:"w",x:-20,y:0,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["C — Máy đo điểm sương",S(46,40,R(-20,-14,40,28,"body",3)+T(0,4,"DP",11),[{id:"w",x:-20,y:0,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:14,d:"s"}])]
]);
reg("levelinst","Đo mức (tại bình)","Đo lường tại ống (inline)","LG",[
 ["A — Kính đo mức (LG)",S(26,70,L("M0 -35H-10M0 35H-10")+R(0,-35,10,70,"body")+L("M0 5H10","dash"),[{id:"w",x:-10,y:-35,d:"w"},{id:"e",x:10,y:0,d:"e"},{id:"n",x:5,y:-35,d:"n"},{id:"s",x:5,y:35,d:"s"}])],
 ["B — Radar / sóng dẫn",S(34,64,L("M0 -10V32")+`<path class="body" d="M-12 -10H12L6 -30H-6Z"/>`+L("M-4 -34Q0 -38 4 -34","thin"),[{id:"w",x:-12,y:-10,d:"w"},{id:"e",x:12,y:-10,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:0,y:32,d:"s"}])],
 ["C — Phao (float)",S(34,60,R(-8,-26,16,52,"body",3)+C(0,6,6,"grey")+L("M-8 -10H-17M8 -10H17","thin"),[{id:"w",x:-17,y:-10,d:"w"},{id:"e",x:17,y:-10,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:26,d:"s"}])],
 ["D — Đo mức áp chênh (DP)",S(40,60,L("M-20 -24H0M-20 24H0")+R(0,-30,20,60,"body",3)+T(10,4,"DP",9),[{id:"w",x:-20,y:-24,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:10,y:-30,d:"n"},{id:"s",x:10,y:30,d:"s"}])]
]);

/* ===== ĐO & ĐIỀU KHIỂN (C&I): vòng tròn theo ISA 5.1 ===== */
const BUB=[
 ["A — Tại hiện trường",C(0,0,19)],
 ["B — Trong phòng điều khiển",C(0,0,19)+L("M-19 0H19")],
 ["C — Tủ phụ / local panel",C(0,0,19)+L("M-19 0H19","dash")],
 ["D — DCS (hiển thị chia sẻ)",R(-19,-19,38,38,"body")+C(0,0,15,"thin")],
 ["E — PLC / logic (thoi)",`<path class="body" d="M0 -22L22 0L0 22L-22 0Z"/>`+L("M-14 0H14","thin")],
 ["F — Máy tính (lục giác)",`<path class="body" d="M-20 0L-10 -18H10L20 0L10 18H-10Z"/>`]
];
function bub(key,label,prefix){reg(key,label,"Đo & điều khiển (C&I)",prefix,BUB.map(b=>[b[0],S(40,40,b[1])]),{bub:true})}
[["pt","Máy phát áp suất (PT)","PT"],["tt","Máy phát nhiệt độ (TT)","TT"],["ft","Máy phát lưu lượng (FT)","FT"],["lt","Máy phát mức (LT)","LT"],["at","Máy phân tích (AT)","AT"],["pdt","Máy phát áp chênh (PDT)","PDT"],
 ["pi","Chỉ thị áp suất (PI)","PI"],["ti","Chỉ thị nhiệt độ (TI)","TI"],["fi","Chỉ thị lưu lượng (FI)","FI"],["li","Chỉ thị mức (LI)","LI"],
 ["pic","Bộ điều khiển áp suất (PIC)","PIC"],["tic","Bộ điều khiển nhiệt độ (TIC)","TIC"],["fic","Bộ điều khiển lưu lượng (FIC)","FIC"],["lic","Bộ điều khiển mức (LIC)","LIC"],["aic","Bộ điều khiển phân tích (AIC)","AIC"],
 ["psh","Công tắc áp cao (PSH)","PSH"],["psl","Công tắc áp thấp (PSL)","PSL"],["pshh","Áp rất cao (PSHH)","PSHH"],["pall","Áp rất thấp (PSLL)","PSLL"],
 ["lsh","Công tắc mức cao (LSH)","LSH"],["lsl","Công tắc mức thấp (LSL)","LSL"],["lshh","Mức rất cao (LSHH)","LSHH"],["lsll","Mức rất thấp (LSLL)","LSLL"],
 ["tsh","Công tắc nhiệt cao (TSH)","TSH"],["fsl","Công tắc lưu lượng thấp (FSL)","FSL"],
 ["zs","Công tắc hành trình (ZSO/ZSC)","ZS"],["hs","Công tắc tay / nút (HS)","HS"],["ys","Rơ-le / logic (YS)","YS"],["fq","Tổng lưu (FQI)","FQI"],["sis","Chức năng an toàn (SIS)","SIS"]
].forEach(a=>bub(a[0],a[1],a[2]));
reg("instrument","Vòng đo / điều khiển (tự đặt tên)","Đo & điều khiển (C&I)","PIC",BUB.map(b=>[b[0],S(40,40,b[1])]),{bub:true});
reg("gauge","Đồng hồ cơ","Đo & điều khiển (C&I)","PI",[
 ["A — Đồng hồ áp suất",S(34,44,C(0,-6,12)+L("M0 6V16")+L("M-6 -3L0 -6L5 -12","thin"),[{id:"s",x:0,y:16,d:"s"},{id:"n",x:0,y:-18,d:"n"},{id:"w",x:-12,y:-6,d:"w"},{id:"e",x:12,y:-6,d:"e"}])],
 ["B — Đồng hồ nhiệt độ",S(34,50,C(0,-10,12)+L("M0 2V16")+C(0,20,4,"solid")+L("M-6 -7L0 -10L5 -16","thin"),[{id:"s",x:0,y:24,d:"s"},{id:"n",x:0,y:-22,d:"n"},{id:"w",x:-12,y:-10,d:"w"},{id:"e",x:12,y:-10,d:"e"}])],
 ["C — Đồng hồ + cách ly (seal)",S(34,56,C(0,-14,12)+L("M0 -2V10")+R(-7,10,14,10,"body",2)+L("M0 20V26"),[{id:"s",x:0,y:26,d:"s"},{id:"n",x:0,y:-26,d:"n"},{id:"w",x:-12,y:-14,d:"w"},{id:"e",x:12,y:-14,d:"e"}])]
]);
reg("alarm","Báo động / An toàn","Đo & điều khiển (C&I)","UA",[
 ["A — Còi (horn)",S(40,36,`<path class="body" d="M-16 -8H-4L12 -16V16L-4 8H-16Z"/>`+L("M16 -6Q22 0 16 6M20 -10Q30 0 20 10"))],
 ["B — Đèn báo",S(34,34,C(0,0,14)+L("M-10 -10L10 10M10 -10L-10 10","thin"))],
 ["C — Nút ESD (nấm)",S(34,36,`<path class="body" d="M-14 0Q0 -22 14 0Z"/>`+R(-8,0,16,12,"body")+T(0,10,"E",9))],
 ["D — Cảm biến lửa (FD)",S(34,34,C(0,0,14)+`<path class="solid" d="M0 -8Q-7 0 -3 6H3Q7 0 0 -8Z"/>`)],
 ["E — Cảm biến khí (GD)",S(34,34,C(0,0,14)+T(0,4,"GD",9))],
 ["F — Cảm biến khói (SD)",S(34,34,C(0,0,14)+T(0,4,"SD",9))]
]);

/* ===== ĐIỆN / TỦ ĐIỀU KHIỂN ===== */
function box(key,label,prefix,items){reg(key,label,"Điện / Tủ điều khiển",prefix,items.map(i=>[i[0],S(i[1]||72,i[2]||44,R(-(i[1]||72)/2,-(i[2]||44)/2,i[1]||72,i[2]||44,"body",i[4]||2)+T(0,5,i[3],11))]))}
box("cabinet","Tủ điều khiển","CAB",[["A — DCS",76,44,"DCS"],["B — PLC",76,44,"PLC"],["C — ESD / SIS",76,44,"ESD"],["D — RTU",76,44,"RTU"],["E — F&G panel",76,44,"F&amp;G"],["F — Hộp nối (JB)",56,36,"JB"]]);
reg("hmi","Trạm vận hành / HMI","Điện / Tủ điều khiển","HMI",[
 ["A — HMI",S(56,48,R(-26,-20,52,32,"body",3)+L("M-10 20H10M0 12V20")+L("M-18 -12H18M-18 -4H8","thin"))],
 ["B — Panel cục bộ (LCP)",S(60,48,R(-28,-22,56,44,"body",2)+C(-14,-8,5)+C(2,-8,5)+L("M-20 10H20","thin"))]
]);
reg("power","MCC / Máy biến áp / UPS","Điện / Tủ điều khiển","MCC",[
 ["A — MCC",S(60,44,R(-30,-22,60,44,"body")+L("M-10 -22V22M10 -22V22")+T(0,5,"MCC",10))],
 ["B — Biến áp",S(52,40,C(-8,0,14)+C(8,0,14))],
 ["C — UPS / Ắc quy",S(52,40,R(-26,-18,52,36,"body")+L("M-10 -8V8M-4 -4V4M2 -8V8M8 -4V4")+T(0,16,"UPS",8))],
 ["D — Cầu dao / Switchgear",S(50,40,R(-25,-18,50,36,"body")+L("M-14 0H-4L8 -8M8 0H14","thin"))]
]);

/* ===== GIẾNG / PACKAGE / XUẤT NHẬP ===== */
reg("wellhead","Đầu giếng (Xmas tree)","Giếng / Package / Xuất nhập","WH",[
 ["A — Cây thông",S(50,82,R(-5,-6,10,44,"body")+L("M-20 -22H20")+`<path class="body" d="M-20 -22H-5V-10H-20ZM5 -22H20V-10H5Z"/>`+R(-8,-36,16,14,"body")+R(-12,38,24,10,"grey"),[{id:"w",x:-20,y:-16,d:"w"},{id:"e",x:20,y:-16,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:0,y:48,d:"s"}])],
 ["B — Đầu giếng đơn giản",S(40,60,R(-6,-20,12,50,"body")+R(-14,-30,28,10,"grey")+L("M6 -10H20"),[{id:"w",x:-6,y:0,d:"w"},{id:"e",x:20,y:-10,d:"e"},{id:"n",x:0,y:-30,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);
reg("choke","Van tiết lưu (choke)","Giếng / Package / Xuất nhập","CK",[
 ["A — Choke",S(40,36,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 0V-14M-8 -14H8")+L("M-4 6L4 6","thin"))],
 ["B — Choke điều chỉnh được",S(40,44,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 0V-14")+`<path class="body" d="M-12 -14A12 12 0 0 1 12 -14Z"/>`+L("M-6 -4L6 6","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:10,d:"s"}])]
]);
reg("manifold","Manifold / Header","Giếng / Package / Xuất nhập","MF",[
 ["A — Header 4 nhánh",S(160,40,R(-80,-8,160,16,"body",3)+[-60,-20,20,60].map(x=>L(`M${x} -8V-20`)).join(""),[{id:"w",x:-80,y:0,d:"w"},{id:"e",x:80,y:0,d:"e"},{id:"n",x:-60,y:-20,d:"n"},{id:"s",x:60,y:8,d:"s"},{id:"n2",x:-20,y:-20,d:"n"},{id:"n3",x:20,y:-20,d:"n"},{id:"n4",x:60,y:-20,d:"n"},{id:"s2",x:-60,y:8,d:"s"},{id:"s3",x:-20,y:8,d:"s"},{id:"s4",x:20,y:8,d:"s"}])],
 ["B — Header dọc",S(40,140,R(-8,-60,16,120,"body",3)+[-40,-10,20,50].map(y=>L(`M8 ${y}H20`)).join(""),[{id:"n",x:0,y:-60,d:"n"},{id:"s",x:0,y:60,d:"s"},{id:"e",x:20,y:-40,d:"e"},{id:"e2",x:20,y:-10,d:"e"},{id:"e3",x:20,y:20,d:"e"},{id:"e4",x:20,y:50,d:"e"},{id:"w",x:-8,y:0,d:"w"}])]
]);
reg("pig","Pig launcher / receiver","Giếng / Package / Xuất nhập","PL",[
 ["A — Launcher",S(92,32,R(-46,-6,48,12,"body")+`<path class="body" d="M2 -6L18 -16V16L2 6Z"/>`+R(18,-16,28,32,"body"),[{id:"w",x:-46,y:0,d:"w"},{id:"e",x:46,y:0,d:"e"},{id:"n",x:32,y:-16,d:"n"},{id:"s",x:32,y:16,d:"s"}])],
 ["B — Receiver",S(92,32,R(-46,-16,28,32,"body")+`<path class="body" d="M-18 -16L-2 -6V6L-18 16Z"/>`+R(-2,-6,48,12,"body"),[{id:"w",x:-46,y:0,d:"w"},{id:"e",x:46,y:0,d:"e"},{id:"n",x:-32,y:-16,d:"n"},{id:"s",x:-32,y:16,d:"s"}])]
]);
reg("skid","Skid / Package","Giếng / Package / Xuất nhập","PK",[
 ["A — Skid đo đếm (LACT)",S(90,52,R(-45,-26,90,52,"body")+L("M-45 -26L-33 -14M45 -26L33 -14","thin")+T(0,5,"LACT",11))],
 ["B — Skid hoá chất",S(80,50,R(-40,-25,80,50,"body")+R(-28,-14,24,28,"body",3)+R(4,-14,24,28,"body",3))],
 ["C — Package chung",S(90,52,R(-45,-26,90,52,"body")+L("M-45 -26H45","thin")+T(0,10,"PKG",12))],
 ["D — Skid đo ngoài (bơm + lưu lượng)",S(90,52,R(-45,-26,90,52,"body")+C(-20,0,12)+R(2,-10,28,20,"body",3))]
]);
reg("loading","Xuất nhập (xe / tàu / toa)","Giếng / Package / Xuất nhập","LD",[
 ["A — Cần xuất (loading arm)",S(60,60,L("M-30 0H-4L16 -20H30")+C(-4,0,4,"solid")+C(16,-20,3,"solid"),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:-20,d:"e"},{id:"n",x:16,y:-20,d:"n"},{id:"s",x:-4,y:0,d:"s"}])],
 ["B — Xe bồn",S(100,44,R(-34,-14,68,24,"body",12)+R(-50,-6,16,16,"body",2)+C(-40,14,6)+C(-8,14,6)+C(18,14,6)+L("M-50 14H-46M-2 14H12","thin"),[{id:"w",x:-50,y:0,d:"w"},{id:"e",x:34,y:-2,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:20,d:"s"}])],
 ["C — Tàu / Jetty",S(120,50,`<path class="body" d="M-60 -6H60L48 14H-48Z"/>`+R(-20,-22,36,16,"body")+L("M-60 -6H-70"),[{id:"w",x:-60,y:-6,d:"w"},{id:"e",x:60,y:-6,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:14,d:"s"}])],
 ["D — Toa tàu hoả",S(100,36,R(-40,-12,80,22,"body",10)+C(-26,16,5)+C(-10,16,5)+C(10,16,5)+C(26,16,5)+L("M-50 4H-40M40 4H50"),[{id:"w",x:-50,y:4,d:"w"},{id:"e",x:50,y:4,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:21,d:"s"}])]
]);
reg("pipeline","Đường ống / Riser / SSIV","Giếng / Package / Xuất nhập","PL",[
 ["A — Pipeline (đoạn dài)",S(140,20,L("M-70 -5H70M-70 5H70","body")+L("M-70 -5V5M70 -5V5","thin"),IW(140,10))],
 ["B — Riser",S(24,100,L("M-5 -50V50M5 -50V50","body")+L("M-5 40L-14 50M5 40L14 50","thin"),[{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:50,d:"s"},{id:"w",x:-5,y:0,d:"w"},{id:"e",x:5,y:0,d:"e"}])],
 ["C — Cắt ngắt (break)",S(40,30,L("M-20 -6H-8L-2 6L2 -6L8 6H20","thin"),PW(40,30))]
]);

/* ===== DÒNG VÀO / RA & NỐI ===== */
reg("feed","Dòng vào (Feed)","Dòng vào / ra & nối","",[
 ["A — Mũi tên",S(78,26,`<path class="body" d="M-39 -13H20L39 0L20 13H-39Z"/>`,[{id:"e",x:39,y:0,d:"e"},{id:"w",x:-39,y:0,d:"w"}])],
 ["B — Hình tròn",S(40,40,C(0,0,18)+L("M-8 0H8M3 -5L8 0L3 5","thin"),[{id:"e",x:18,y:0,d:"e"},{id:"w",x:-18,y:0,d:"w"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Tam giác",S(46,36,`<path class="body" d="M-23 -18L23 0L-23 18Z"/>`,[{id:"e",x:23,y:0,d:"e"},{id:"w",x:-23,y:0,d:"w"}])]
]);
reg("product","Dòng ra (Product)","Dòng vào / ra & nối","",[
 ["A — Mũi tên",S(78,26,`<path class="body" d="M-20 -13H39V13H-20L-39 0Z"/>`,[{id:"w",x:-39,y:0,d:"w"},{id:"e",x:39,y:0,d:"e"}])],
 ["B — Hình tròn",S(40,40,C(0,0,18)+L("M-8 0H8M3 -5L8 0L3 5","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Tam giác",S(46,36,`<path class="body" d="M23 -18L-23 0L23 18Z"/>`,[{id:"e",x:23,y:0,d:"e"},{id:"w",x:-23,y:0,d:"w"}])]
]);
reg("offpage","Ký hiệu nối bản vẽ","Dòng vào / ra & nối","OP",[
 ["A — Đến bản vẽ khác",S(56,34,`<path class="body" d="M-28 -17H8L28 0L8 17H-28Z"/>`,[{id:"w",x:-28,y:0,d:"w"},{id:"e",x:28,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["B — Từ bản vẽ khác",S(56,34,`<path class="body" d="M-8 -17H28V17H-8L-28 0Z"/>`,[{id:"w",x:-28,y:0,d:"w"},{id:"e",x:28,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["C — Vòng số hiệu",S(40,40,C(0,0,18),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["D — Điểm nối (tie-in)",S(44,40,`<path class="body" d="M-22 0L-11 -18H11L22 0L11 18H-11Z"/>`)]
]);
reg("junction","Điểm rẽ nhánh (tee)","Dòng vào / ra & nối","",[
 ["A — Chấm",S(10,10,C(0,0,4,"solid"),[{id:"w",x:-5,y:0,d:"w"},{id:"e",x:5,y:0,d:"e"},{id:"n",x:0,y:-5,d:"n"},{id:"s",x:0,y:5,d:"s"}])],
 ["B — Chấm lớn",S(16,16,C(0,0,6,"solid"),[{id:"w",x:-8,y:0,d:"w"},{id:"e",x:8,y:0,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:0,y:8,d:"s"}])]
],{nolabel:true});

/* ===== CHÚ THÍCH ===== */
reg("text","Khung chữ / Ghi chú","Chú thích","",[["A — Chữ",S(110,36,"",[])]]);
reg("area","Khung ranh giới / Package","Chú thích","",[["A — Gạch chấm",S(110,60,"",[])]]);
reg("note","Ghi chú / Hold / Revision","Chú thích","",[
 ["A — Nhãn ghi chú",S(90,40,`<path class="body" d="M-45 -20H33L45 -8V20H-45Z"/>`+L("M33 -20V-8H45"))],
 ["B — Hold (△)",S(40,40,`<path class="body" d="M0 -18L18 16H-18Z"/>`+T(0,10,"H",12))],
 ["C — Revision (△)",S(40,40,`<path class="body" d="M0 -18L18 16H-18Z"/>`+T(0,10,"1",12))],
 ["D — Mũi tên chỉ hướng",S(60,26,`<path class="solid" d="M-28 -4H10V-10L28 0L10 10V4H-28Z"/>`,[])]
],{nolabel:false});
const INSERTABLE=["valve_gate","valve_ball","valve_globe","valve_butterfly","valve_check","valve_control","valve_esd","valve_reg","valve_sol","pump","pd_pump","exchanger","plate_hx","condenser","filter_dummy","aircooler","heater","strainer","orifice","flowmeter","reducer","arrestor","spec_blind","flange","sight","junction","blower","agitator"].filter(k=>SYMBOLS[k]);

/* ===== Bổ sung: phin lọc + bản đồ tương thích với file cũ ===== */
reg("filter","Phin lọc / Filter","Bình / Tháp","F",[
 ["A — Phin lọc đứng",S(44,58,R(-22,-29,44,58,"body",10)+L("M-22 -6H22","dash"))],
 ["B — Cartridge",S(44,64,R(-22,-32,44,64,"body",6)+L("M-10 -18V18M0 -18V18M10 -18V18M-10 18H10","thin"))],
 ["C — Lọc ngang",S(80,36,HS(-40,40,-18,18)+L("M-12 -18V18M12 -18V18")+L("M-12 0H12","dash"))],
 ["D — Lọc than hoạt tính",S(50,64,R(-25,-32,50,64,"body",10)+L("M-25 -8H25M-25 8H25")+C(-10,-20,2,"solid")+C(10,-20,2,"solid"))]
]);
const LEGACY={mixer:["agitator",2],valve_3way:["valve_ball",2],filter:["filter",0]};

/* ===== TURBINE HƠI NHIỀU ÁP SUẤT & MÁY NÉN NHIỀU CẤP (Rev.4) ===== */
/* Turbine hơi: hình thang hẹp ở phía hơi vào (trái), rộng ở phía xả (phải). Cổng hơi = đầu ống nhô lên/xuống từ thân. */
function _stg(a,hl,hr){return{a,hl,hr,yt:x=>-hl-(x+a)*(hr-hl)/(2*a),yb:x=>hl+(x+a)*(hr-hl)/(2*a)}}
function stTurb(o){
 const a=o.a||34,hl=o.hl||12,hr=o.hr||24,g=_stg(a,hl,hr),ports=[];let pre="",post="",x0=-a,x1=a,y0=-hr,y1=hr;
 (o.stubs||[]).forEach(s=>{
  const top=s.side==="t",y=top?g.yt(s.x):g.yb(s.x),len=s.len||14,ye=top?y-len:y+len;
  if(s.duct){pre+=`<path class="body" d="M${s.x-11} ${top?g.yt(s.x-11)-2:g.yb(s.x-11)+2}V${top?ye:ye}H${s.x+11}V${top?g.yt(s.x+11)-2:g.yb(s.x+11)+2}"/>`+L(`M${s.x-7} ${ye+(top?2:-2)}V${ye+(top?10:-10)}M${s.x} ${ye+(top?2:-2)}V${ye+(top?10:-10)}M${s.x+7} ${ye+(top?2:-2)}V${ye+(top?10:-10)}`,"thin")}
  else pre+=L(`M${s.x} ${y}V${ye}`,"body");
  if(s.arrow){const ym=(y+ye)/2;post+=`<path class="solid" d="M${s.x-3.5} ${ym-3}L${s.x+3.5} ${ym-3}L${s.x} ${ym+3.5}Z"/>`}
  if(s.l)post+=LB(s.x+(s.lx||0),top?ye-3:ye+9,s.l);
  ports.push(PT(s.id,s.x,ye,top?"n":"s",s.l));
  y0=Math.min(y0,Math.min(ye,y)-(s.l&&top?9:0));y1=Math.max(y1,Math.max(ye,y)+(s.l&&!top?10:0));
 });
 let b=pre+`<path class="body" d="M${-a} ${-hl}L${a} ${-hr}V${hr}L${-a} ${hl}Z"/>`;
 if(o.shL){b+=L(`M${-a-o.shL} 0H${-a}`,"body");x0=-a-o.shL;ports.push(PT("shL",x0,0,"w","SHAFT"))}
 if(o.shR){b+=L(`M${a} 0H${a+o.shR}`,"body");x1=a+o.shR;ports.push(PT("shR",x1,0,"e","SHAFT"))}
 if(o.cpl){b+=R(a+4,-5,5,10,"body")+R(a+10,-5,5,10,"body")}
 return{b:b+post,ports,x0,x1,y0,y1,a,hl,hr,g};
}
function stSym(o){const t=stTurb(o);return SC(t.x0,t.x1,t.y0,t.y1,t.b,t.ports)}
reg("steam_turbine","Turbine hơi (HP / MP / LP)","Máy nén / Quạt / Turbine","ST",[
 ["A — Đối áp (HP vào → LP ra)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"LP",arrow:1}],shL:12,shR:12})],
 ["B — Ngưng hơi (xả chân không)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:20,id:"ex",l:"EXH",duct:1,len:18}],shL:12,shR:12})],
 ["C — Trích hơi MP (đối áp)",stSym({a:38,stubs:[{side:"t",x:-26,id:"hp",l:"HP",arrow:1},{side:"b",x:-2,id:"mp",l:"MP",arrow:1},{side:"b",x:28,id:"ex",l:"LP",arrow:1}],shL:12,shR:12})],
 ["D — Nhiều áp suất HP / MP / LP",stSym({a:42,hl:12,hr:26,stubs:[{side:"t",x:-30,id:"hp",l:"HP",arrow:1},{side:"t",x:-2,id:"mp",l:"MP",arrow:1},{side:"t",x:24,id:"lp",l:"LP",arrow:1},{side:"b",x:30,id:"ex",l:"EXH",arrow:1}],shL:12,shR:12})],
 ["E — Trích + ngưng (extraction-condensing)",stSym({a:40,stubs:[{side:"t",x:-28,id:"hp",l:"HP",arrow:1},{side:"b",x:-6,id:"mp",l:"MP",arrow:1},{side:"b",x:26,id:"ex",l:"EXH",duct:1,len:18}],shL:12,shR:12})],
 ["F — Turbine + máy phát (STG)",(()=>{
   const t=stTurb({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"EXH",duct:1,len:18}],shL:0,shR:16}),gx=t.x1+16;
   return SC(t.x0,gx+16,t.y0,t.y1,t.b+C(gx,0,16)+LB(gx,4,"G",12)+L(`M${t.x1} 0H${gx-16}`,"body"),[...t.ports,PT("e",gx+16,0,"e","POWER")]);
 })()],
 ["G — HP + LP hai thân, hâm hơi (reheat)",(()=>{
   const h=stTurb({a:22,hl:8,hr:14,stubs:[{side:"t",x:-12,id:"hp",l:"HP",arrow:1},{side:"b",x:12,id:"crh",l:"CRH"}]}),
         l=stTurb({a:36,hl:12,hr:26,stubs:[{side:"t",x:-22,id:"hrh",l:"HRH",arrow:1},{side:"b",x:24,id:"ex",l:"EXH",duct:1,len:18}]}),gap=28,ox=h.x1+gap+36;
   const body=h.b+`<g transform="translate(${ox},0)">${l.b}</g>`+L(`M${h.a} 0H${ox-36}`,"body")+L(`M${-h.a-12} 0H${-h.a}`,"body");
   const ports=[...h.ports,...l.ports.map(p=>PT(p.id,p.x+ox,p.y,p.d,p.l)),PT("shL",-h.a-12,0,"w","SHAFT"),PT("shR",ox+36+12,0,"e","SHAFT")];
   return SC(-h.a-12,ox+48,Math.min(h.y0,l.y0),Math.max(h.y1,l.y1),body+L(`M${ox+36} 0H${ox+48}`,"body"),ports);
 })()],
 ["H — Dẫn động máy nén (khớp nối + trục)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"LP",arrow:1}],shL:10,shR:28,cpl:1})]
]);

/* ===== MÁY NÉN NHIỀU CẤP ===== */
function _cs(x0,x1,hs,hd){return`<path class="body" d="M${x0} ${-hs}L${x1} ${-hd}V${hd}L${x0} ${hs}Z"/>`}
const _csYb=(x0,x1,hs,hd,x)=>hs+(x-x0)/(x1-x0)*(hd-hs);
const _cstub=(x,y0,y1)=>L(`M${x} ${y0}V${y1}`,"body");
const _cooler=(x,y,w,h)=>R(x,y,w,h,"body",4)+L(`M${x+8} ${y+h/2}Q${x+w*.3} ${y+3} ${x+w/2} ${y+h/2}T${x+w-8} ${y+h/2}`,"thin");
reg("compressor2","Máy nén nhiều cấp (2–3 cấp)","Máy nén / Quạt / Turbine","K",[
 ["A — 2 cấp ly tâm + làm mát giữa cấp",(()=>{
   const yb1=_csYb(-58,-8,24,16,-14),yb2=_csYb(30,74,18,11,38);
   const b=_cs(-58,-8,24,16)+_cs(30,74,18,11)+L("M-58 0H-8M30 0H74","thin")+L(`M-14 ${yb1}V51H-4`,"body")+L(`M38 ${yb2}V51H30`,"body")+_cooler(-4,40,34,22)+LB(13,74,"IC",7);
   return SC(-58,74,-24,76,b,[PT("w",-58,0,"w","SUCTION"),PT("e",74,0,"e","DISCH"),PT("cw1",6,62,"s","CW"),PT("cw2",20,62,"s","CW")]);
 })()],
 ["B — 2 cấp, cửa liên cấp để hở (IS-out / IS-in)",(()=>{
   const yb1=_csYb(-58,-8,24,16,-14),yb2=_csYb(8,52,18,11,22);
   const b=_cs(-58,-8,24,16)+_cs(8,52,18,11)+L("M-58 0H-8M8 0H52","thin")+_cstub(-14,yb1,36)+_cstub(22,yb2,36)+LB(-14,46,"IS-OUT")+LB(22,46,"IS-IN");
   return SC(-58,52,-24,48,b,[PT("w",-58,0,"w","SUCTION"),PT("e",52,0,"e","DISCH"),PT("isout",-14,36,"s","IS-OUT"),PT("isin",22,36,"s","IS-IN")]);
 })()],
 ["C — Piston 2 cấp (2 xy-lanh, cửa liên cấp)",(()=>{
   const b=R(-56,-18,38,36,"body",2)+L("M-37 -18V18","thin")+R(16,-11,30,22,"body",2)+L("M31 -11V11","thin")+C(-1,0,9)+L("M-18 0H-10M8 0H16M-1 -9V9","thin")+L("M-37 18V38M31 11V38","body")+LB(-37,48,"IS-OUT")+LB(31,48,"IS-IN");
   return SC(-56,46,-18,50,b,[PT("w",-56,0,"w","SUCTION"),PT("e",46,0,"e","DISCH"),PT("isout",-37,38,"s","IS-OUT"),PT("isin",31,38,"s","IS-IN")]);
 })()],
 ["D — Piston 2 cấp + làm mát giữa cấp",(()=>{
   const b=R(-56,-18,38,36,"body",2)+L("M-37 -18V18","thin")+R(16,-11,30,22,"body",2)+L("M31 -11V11","thin")+C(-1,0,9)+L("M-18 0H-10M8 0H16M-1 -9V9","thin")+L("M-37 18V50H-18M31 11V50H14","body")+_cooler(-18,38,32,24)+LB(-2,74,"IC",7);
   return SC(-56,46,-18,78,b,[PT("w",-56,0,"w","SUCTION"),PT("e",46,0,"e","DISCH"),PT("cw1",-8,62,"s","CW"),PT("cw2",4,62,"s","CW")]);
 })()],
 ["E — 3 cấp ly tâm (cửa liên cấp 1 và 2)",(()=>{
   const y1=_csYb(-84,-36,24,17,-42),y2=_csYb(-26,20,19,13,-6),y3=_csYb(-26,20,19,13,16);
   const b=_cs(-84,-36,24,17)+_cs(-26,20,19,13)+_cs(30,72,15,10)+L("M-84 0H-36M-26 0H20M30 0H72","thin")+_cstub(-42,y1,34)+_cstub(-6,-y2,-32)+_cstub(14,y3,34)+_cstub(40,-_csYb(30,72,15,10,40),-30)+LB(-42,44,"IS1-OUT")+LB(-6,-35,"IS1-IN")+LB(14,44,"IS2-OUT")+LB(40,-33,"IS2-IN");
   return SC(-84,72,-40,46,b,[PT("w",-84,0,"w","SUCTION"),PT("e",72,0,"e","DISCH"),PT("is1o",-42,34,"s","IS1-OUT"),PT("is1i",-6,-32,"n","IS1-IN"),PT("is2o",14,34,"s","IS2-OUT"),PT("is2i",40,-30,"n","IS2-IN")]);
 })()],
 ["F — 1 vỏ, 2 phần (back-to-back)",(()=>{
   const b=R(-52,-22,104,44,"body",12)+L("M0 -22V22","thin")+`<path class="body" d="M-44 -16L-8 -10V10L-44 16Z"/><path class="body" d="M8 -10L44 -16V16L8 10Z" transform="scale(1,1)"/>`+L("M-44 0H-8M8 0H44","thin")+L("M-26 22V38M26 -22V-38","body")+LB(-26,48,"IS-OUT")+LB(26,-41,"IS-IN");
   return SC(-52,52,-40,50,b,[PT("w",-52,0,"w","SUCTION"),PT("e",52,0,"e","DISCH"),PT("isout",-26,38,"s","IS-OUT"),PT("isin",26,-38,"n","IS-IN")]);
 })()],
 ["G — 2 cấp ly tâm + động cơ điện",(()=>{
   const y1=_csYb(-46,-6,22,15,-12);
   const b=R(-100,-15,42,30,"body",3)+LB(-79,5,"M",13)+L("M-58 0H-46","body")+_cs(-46,-6,22,15)+_cs(6,46,17,10)+L("M-46 0H-6M6 0H46","thin")+_cstub(-34,-_csYb(-46,-6,22,15,-34),-34)+_cstub(-12,y1,34)+_cstub(16,-_csYb(6,46,17,10,16),-34)+LB(-34,-37,"IN")+LB(-12,44,"IS-OUT")+LB(16,-37,"IS-IN");
   return SC(-100,46,-36,46,b,[PT("n",-34,-34,"n","SUCTION"),PT("e",46,0,"e","DISCH"),PT("isout",-12,34,"s","IS-OUT"),PT("isin",16,-34,"n","IS-IN")]);
 })()]
]);

/* ===== HẠ TẦNG CHUỖI CUNG ỨNG KHÍ (Rev.4) ===== */
const CAT_INF="Hạ tầng chuỗi cung ứng khí";
/* sóng nước, đáy biển, nhà */
const WV=(x0,x1,y,cls)=>{let n=Math.max(1,Math.round((x1-x0)/10));return`<path class="thin" d="M${x0} ${y}q5 -4 10 0${" t10 0".repeat(n-1)}"/>`};
const SEABED=(x0,x1,y)=>L(`M${x0} ${y}H${x1}`,"body")+L(Array.from({length:Math.floor((x1-x0)/10)},(_,i)=>`M${x0+4+i*10} ${y}l-4 6`).join(""),"thin");
const HOUSE=(x,y,w,h,door)=>`<path class="body" d="M${x} ${y}V${y-h}L${x+w/2} ${y-h-w*.38}L${x+w} ${y-h}V${y}Z"/>`+(door===false?"":R(x+w/2-3,y-9,6,9,"thin"));
const FLAME=(x,y,s)=>`<path class="solid" d="M${x} ${y}Q${x-4*s} ${y-5*s} ${x-1*s} ${y-12*s}Q${x} ${y-8*s} ${x+2*s} ${y-9*s}Q${x+5*s} ${y-4*s} ${x} ${y}Z"/>`;
const STACK=(x,y0,y1,w)=>R(x-(w||5)/2,y0,w||5,y1-y0,"body");
const BRK=(x,y,s)=>`<path class="body" d="M${x-8*s} ${y-6*s}L${x+8*s} ${y+6*s}V${y-6*s}L${x-8*s} ${y+6*s}Z"/>`;

/* --- Giàn khoan / khai thác --- */
const _jacket=(xl,xr,yt,yb)=>`<path class="body" d="M${xl} ${yt}L${xl-8} ${yb}H${xr+8}L${xr} ${yt}Z"/>`+L(`M${xl-3} ${yt+(yb-yt)*.32}H${xr+3}M${xl-6} ${yt+(yb-yt)*.66}H${xr+6}M${xl} ${yt}L${xr+3} ${yt+(yb-yt)*.32}M${xr} ${yt}L${xl-3} ${yt+(yb-yt)*.32}M${xl-3} ${yt+(yb-yt)*.32}L${xr+6} ${yt+(yb-yt)*.66}M${xr+3} ${yt+(yb-yt)*.32}L${xl-6} ${yt+(yb-yt)*.66}`,"thin");
reg("platform","Giàn khai thác / FPSO","Hạ tầng chuỗi cung ứng khí","PF",[
 ["A — Giàn cố định (jacket)",SC(-46,46,-48,40,_jacket(-24,24,-14,40)+WV(-46,46,0,"wat")+SEABED(-46,46,40)+R(-32,-26,64,12,"body")+R(-24,-38,14,12,"body")+R(-6,-34,20,8,"body")+L("M26 -26L40 -44M-30 -26V-46M-30 -46L-12 -40")+FLAME(40,-44,.8),[PT("w",-32,-20,"w"),PT("e",32,-20,"e"),PT("n",-17,-38,"n"),PT("s",0,40,"s","RISER")])],
 ["B — Giàn tự nâng (jack-up)",SC(-44,44,-54,36,R(-34,-22,68,12,"body")+L("M-24 -10V36M0 -10V36M24 -10V36","body")+`<path class="body" d="M-32 36H-16L-24 28ZM-8 36H8L0 28ZM16 36H32L24 28Z"/>`+`<path class="thin" d="M12 -22L18 -50L24 -22Z"/>`+R(-34,-28,18,6,"body")+WV(-44,44,6,"wat")+L("M-44 36H44","body"),[PT("w",-34,-16,"w"),PT("e",34,-16,"e"),PT("n",18,-50,"n"),PT("s",0,36,"s")])],
 ["C — Giàn bán chìm (semi-submersible)",SC(-46,46,-54,24,R(-36,-32,72,12,"body")+R(-28,-20,10,30,"body")+R(18,-20,10,30,"body")+R(-42,10,40,12,"body",6)+R(2,10,40,12,"body",6)+`<path class="thin" d="M-6 -32L0 -54L6 -32Z"/>`+WV(-46,46,0,"wat"),[PT("w",-36,-26,"w"),PT("e",36,-26,"e"),PT("n",0,-54,"n"),PT("s",0,22,"s")])],
 ["D — FPSO (tàu chứa nổi)",SC(-58,58,-54,42,`<path class="body" d="M-56 -2V10Q-56 18 -48 18H38L56 -4Z"/>`+R(-44,-18,22,16,"body")+R(-16,-26,16,24,"body")+L("M-50 -2V-40")+FLAME(-50,-40,.9)+R(26,-12,10,16,"body")+L("M31 18V42M31 18L20 38M31 18L42 38","body")+WV(-58,58,8,"wat"),[PT("w",-56,4,"w"),PT("e",56,-4,"e"),PT("n",-8,-26,"n"),PT("s",31,42,"s","RISER")])],
 ["E — Giàn đầu giếng không người (WHP)",SC(-30,30,-46,38,L("M-10 -14L-20 38M10 -14L20 38M0 -14V38","body")+R(-18,-24,36,10,"body")+R(-7,-36,14,12,"body")+L("M-18 -24V-44")+WV(-30,30,6,"wat")+L("M-30 38H30","body"),[PT("w",-18,-19,"w"),PT("e",18,-19,"e"),PT("n",0,-36,"n"),PT("s",0,38,"s")])],
 ["F — Giàn xử lý trung tâm (CPP)",SC(-52,62,-60,42,_jacket(-34,34,-12,42)+WV(-52,62,2,"wat")+SEABED(-52,62,42)+R(-46,-22,92,10,"body")+R(-40,-38,24,16,"body")+R(-12,-34,16,12,"body")+R(8,-44,34,22,"body")+L("M44 -44L58 -62")+FLAME(58,-62,.8)+L("M46 -17H58"),[PT("w",-46,-17,"w"),PT("e",58,-17,"e"),PT("n",-28,-38,"n"),PT("s",0,42,"s")])]
]);
reg("subsea","Thiết bị dưới biển (Subsea)","Hạ tầng chuỗi cung ứng khí","SS",[
 ["A — Cây thông dưới biển (subsea tree)",SC(-30,30,-30,36,SEABED(-30,30,26)+R(-20,-26,40,52,"dash")+R(-14,18,28,8,"body")+R(-6,-8,12,26,"body",2)+C(0,2,4)+R(-8,-18,16,10,"body",2)+L("M6 4H26"),[PT("w",-30,10,"w"),PT("e",26,4,"e","FLOWLINE"),PT("n",0,-26,"n","UMB"),PT("s",0,36,"s","WELL")])],
 ["B — Manifold dưới biển",SC(-48,48,-24,34,SEABED(-48,48,24)+R(-42,-16,84,34,"dash")+L("M-36 -4H36","body")+L("M-26 -4V18M-9 -4V18M9 -4V18M26 -4V18")+C(-26,6,3,"solid")+C(-9,6,3,"solid")+C(9,6,3,"solid")+C(26,6,3,"solid"),[PT("w",-42,-4,"w"),PT("e",42,-4,"e"),PT("s1",-26,24,"s"),PT("s2",-9,24,"s"),PT("s3",9,24,"s"),PT("s4",26,24,"s")])],
 ["C — PLEM / PLET (đầu nối ống đáy biển)",SC(-34,34,-22,26,SEABED(-34,34,18)+R(-24,-14,48,30,"dash")+L("M-34 0H-6","body")+C(2,0,5)+L("M7 0H34","body")+L("M2 -5V-14","body"),[PT("w",-34,0,"w"),PT("e",34,0,"e"),PT("n",2,-14,"n")])],
 ["D — Template 3 cây thông",SC(-52,52,-30,34,SEABED(-52,52,24)+R(-46,-24,92,44,"dash")+[-26,0,26].map(x=>R(x-5,-8,10,24,"body",2)+R(x-7,-16,14,8,"body",2)+L(`M${x} -16V-24`)).join("")+L("M-46 -20H46","thin"),[PT("w",-46,0,"w"),PT("e",46,0,"e"),PT("n",0,-24,"n"),PT("s",0,24,"s")])]
]);
/* --- Nhà máy & trạm --- */
reg("gas_plant","Nhà máy xử lý khí / LNG","Hạ tầng chuỗi cung ứng khí","GP",[
 ["A — Nhà máy xử lý khí (GPP)",SC(-56,56,-48,36,R(-52,-42,104,76,"dash")+R(-44,-34,14,56,"body",5)+R(-24,-24,12,46,"body",5)+HS(-6,32,6,22)+STACK(46,-40,22,6)+C(10,-10,8)+L("M-30 -20H-24M-12 -8H-6M32 14H42M18 -10H26")+L("M-52 14H-44M42 22H52","body"),[PT("w",-52,14,"w"),PT("e",52,22,"e"),PT("n",-37,-34,"n"),PT("s",-18,34,"s")])],
 ["B — Dây chuyền hóa lỏng LNG (train)",SC(-62,62,-52,38,R(-52,-14,26,28,"body",14)+LB(-39,4,"K",12)+L("M-26 0H-14","body")+R(-14,-44,24,78,"body",2)+L("M-14 -28H10M-14 -10H10M-14 8H10M-14 26H10","thin")+R(26,-30,32,58,"body",4)+`<path class="body" d="M26 -30Q42 -48 58 -30"/>`+L("M10 18H26","body"),[PT("w",-52,0,"w","FEED GAS"),PT("e",58,6,"e","LNG"),PT("n",-2,-44,"n"),PT("s",-2,34,"s")])],
 ["C — Phân đoạn NGL / LPG (3 tháp)",SC(-56,56,-50,36,R(-48,-44,14,76,"body",5)+L("M-48 -22H-34M-48 -2H-34M-48 18H-34")+R(-22,-30,14,62,"body",5)+L("M-22 -10H-8M-22 10H-8")+R(4,-16,14,48,"body",5)+C(40,10,10)+L("M-34 -30H-22M-8 -16H4M18 16H30M-27 32V40H11V32","body"),[PT("w",-48,-30,"w"),PT("e",50,10,"e"),PT("n",-41,-44,"n"),PT("s",-8,40,"s")])]
]);
reg("comp_station","Trạm nén khí","Hạ tầng chuỗi cung ứng khí","CS",[
 ["A — Trạm nén ly tâm",SC(-48,48,-46,22,R(-40,-18,80,40,"body",3)+L("M-40 -18L0 -28L40 -18","body")+C(-16,2,10)+C(14,2,10)+L("M-26 2H-6M4 2H24","thin")+STACK(30,-46,-24,6),[PT("w",-48,6,"w"),PT("e",48,6,"e"),PT("n",30,-46,"n"),PT("s",0,22,"s")])],
 ["B — Trạm nén dùng turbine khí",SC(-52,52,-46,22,R(-44,-18,88,40,"body",3)+`<path class="body" d="M-34 -8L-14 -2V14L-34 20Z"/>`+R(-14,-4,16,16,"body",3)+`<path class="body" d="M2 -2L22 -8V20L2 14Z"/>`+L("M22 6H30","thin")+C(38,6,6)+STACK(-6,-46,-18,10),[PT("w",-52,6,"w"),PT("e",52,6,"e"),PT("n",-6,-46,"n"),PT("s",0,22,"s")])],
 ["C — Trạm nén piston",SC(-48,48,-46,22,R(-40,-18,80,40,"body",3)+[-24,0,24].map(x=>R(x-6,-34,12,22,"body",2)+L(`M${x-6} -26H${x+6}`)).join("")+L("M-34 12H34","thin")+L("M-40 4H-48M40 4H48","body"),[PT("w",-48,4,"w"),PT("e",48,4,"e"),PT("n",0,-34,"n"),PT("s",0,22,"s")])]
]);
reg("lng_tank","Bồn LNG / Kho lạnh","Hạ tầng chuỗi cung ứng khí","TK",[
 ["A — Full containment (mái vòm)",SC(-44,44,-44,30,R(-40,-18,80,48,"body")+`<path class="body" d="M-40 -18Q0 -52 40 -18"/>`+R(-33,-14,66,42,"dash")+L("M-40 -2H40M-40 12H40","thin"),[PT("w",-40,6,"w"),PT("e",40,6,"e"),PT("n",0,-34,"n"),PT("s",0,30,"s")])],
 ["B — Single containment + đê bao",SC(-56,56,-36,30,`<path class="dash" d="M-56 30L-46 14H46L56 30Z"/>`+R(-28,-20,56,46,"body")+`<path class="body" d="M-28 -20L0 -34L28 -20Z"/>`+L("M-28 4H28","thin"),[PT("w",-28,2,"w"),PT("e",28,2,"e"),PT("n",0,-34,"n"),PT("s",0,30,"s")])],
 ["C — Bồn cầu LNG (Moss) + skirt",SC(-34,34,-38,40,C(0,-4,30)+L("M-30 -4H30","thin")+`<path class="body" d="M-22 20L-16 40H16L22 20"/>`+L("M0 -34V-42M-4 -42H4","body"),[PT("w",-30,-4,"w"),PT("e",30,-4,"e"),PT("n",0,-42,"n"),PT("s",0,40,"s")])],
 ["D — Bồn chìm / bán chìm",SC(-50,50,-34,34,L("M-50 -4H-34M34 -4H50","body")+R(-34,-4,68,36,"body")+`<path class="body" d="M-34 -4Q0 -30 34 -4"/>`+L("M-34 8H34","dash"),[PT("w",-50,-4,"w"),PT("e",50,-4,"e"),PT("n",0,-17,"n"),PT("s",0,32,"s")])],
 ["E — Bồn LNG nhỏ (vệ tinh, chân đỡ)",SC(-24,24,-44,44,R(-14,-34,28,60,"body",14)+L("M-10 26V42M10 26V42M-18 42H-4M4 42H18")+L("M-14 -8H14","thin"),[PT("w",-14,-4,"w"),PT("e",14,-4,"e"),PT("n",0,-34,"n"),PT("s",0,42,"s")])]
]);
reg("regas","Hóa khí LNG (Regas)","Hạ tầng chuỗi cung ứng khí","RV",[
 ["A — ORV (giàn trao đổi nhiệt nước biển)",SC(-40,40,-44,40,R(-36,-38,72,8,"body")+[-30,-18,-6,6,18,28].map(x=>R(x,-30,8,56,"body")).join("")+R(-36,26,72,8,"body")+L("M-20 -44V-38M20 -44V-38","body")+WV(-30,30,-20,"wat"),[PT("w",-36,30,"w","LNG"),PT("e",36,-34,"e","NG"),PT("n",0,-44,"n","SW"),PT("s",0,34,"s")])],
 ["B — SCV (đốt chìm)",SC(-40,40,-52,32,R(-32,-14,64,44,"body",3)+WV(-28,28,-4,"wat")+L("M-22 8H-12L-8 14L0 4L8 14L12 8H22","thin")+STACK(22,-50,-14,8)+FLAME(-14,30,1)+L("M-32 18H-40M32 8H40","body"),[PT("w",-40,18,"w","LNG"),PT("e",40,8,"e","NG"),PT("n",22,-50,"n"),PT("s",0,30,"s")])],
 ["C — AAV (bay hơi bằng không khí)",SC(-36,36,-44,44,R(-5,-38,10,76,"body")+L("M-5 -28H-30M5 -28H30M-5 -12H-30M5 -12H30M-5 4H-30M5 4H30M-5 20H-30M5 20H30","thin")+L("M-30 -34V26M30 -34V26","thin")+L("M0 38V44M0 -38V-44","body"),[PT("w",-30,26,"w"),PT("e",30,-34,"e"),PT("n",0,-44,"n","NG"),PT("s",0,44,"s","LNG")])],
 ["D — IFV (môi chất trung gian)",SC(-50,50,-26,28,HS(-34,34,-12,12)+L("M-22 -4H-14L-8 4L0 -4L8 4L14 -4H22","thin")+R(-6,-26,12,14,"body",2)+L("M-50 0H-34M34 0H50","body")+C(0,22,5,"body"),[PT("w",-50,0,"w","LNG"),PT("e",50,0,"e","NG"),PT("n",0,-26,"n"),PT("s",0,28,"s")])]
]);
reg("city_gate","Trạm điều áp / đo đếm (PRS / PRMS)","Hạ tầng chuỗi cung ứng khí","PRS",[
 ["A — Trạm điều áp (PRS)",SC(-46,46,-34,26,R(-38,-24,76,46,"dash")+L("M-46 0H-14M14 0H46","body")+C(0,0,14)+BRK(0,0,.9)+`<path class="body" d="M-7 -14A7 7 0 0 1 7 -14Z"/>`+L("M0 -14V-21H20V-30M14 -30H26","thin"),[PT("w",-46,0,"w","IN"),PT("e",46,0,"e","OUT"),PT("n",20,-30,"n","RELIEF"),PT("s",0,22,"s")])],
 ["B — Trạm đo đếm (metering)",SC(-46,46,-28,26,R(-38,-22,76,44,"dash")+L("M-46 0H-14M14 0H46","body")+C(0,0,14)+LB(0,4,"M",12)+L("M-26 -2V-14M26 -2V-14M-26 -14H26","thin"),[PT("w",-46,0,"w","IN"),PT("e",46,0,"e","OUT"),PT("n",0,-22,"n"),PT("s",0,22,"s")])],
 ["C — Trạm điều áp + đo đếm (PRMS)",SC(-60,60,-34,26,R(-52,-24,104,46,"dash")+L("M-60 0H-30M-10 0H10M30 0H60","body")+C(-20,0,10)+BRK(-20,0,.7)+C(20,0,10)+LB(20,4,"M",10)+`<path class="body" d="M-26 -10A6 6 0 0 1 -14 -10Z"/>`,[PT("w",-60,0,"w","IN"),PT("e",60,0,"e","OUT"),PT("n",0,-24,"n"),PT("s",0,22,"s")])]
]);
reg("power_plant","Nhà máy điện khí","Hạ tầng chuỗi cung ứng khí","PP",[
 ["A — Chu trình hỗn hợp (CCGT)",SC(-72,66,-58,32,C(-52,0,14)+LB(-52,4,"GT",10)+L("M-38 0H-20","body")+R(-20,-30,28,58,"body",2)+L("M-20 -14H8M-20 2H8M-20 18H8","thin")+STACK(-6,-56,-30,8)+L("M8 0H24","body")+C(40,0,14)+LB(40,4,"ST",10)+L("M54 0H66","body")+L("M-66 0H-66","thin"),[PT("w",-66,0,"w","FUEL"),PT("e",66,0,"e","POWER"),PT("n",-6,-56,"n","STACK"),PT("s",-6,28,"s","WATER")])],
 ["B — Tua-bin khí + máy phát (GT)",SC(-40,52,-48,24,C(-22,0,14)+LB(-22,4,"GT",10)+L("M-8 0H6","body")+C(20,0,13)+LB(20,4,"G",12)+STACK(-22,-46,-14,8)+L("M-40 0H-36M33 0H52","body"),[PT("w",-40,0,"w","FUEL"),PT("e",52,0,"e","POWER"),PT("n",-22,-46,"n","EXH"),PT("s",0,24,"s")])],
 ["C — Nhà máy động cơ khí (gas engine)",SC(-52,52,-30,28,[-34,0,34].map(x=>R(x-14,-12,28,24,"body",3)+LB(x,5,"E",11)+L(`M${x+14} 0H${x+20}`,"body")).join("")+L("M-52 0H-48","body")+C(-34,22,0.01)+L("M-34 12V20M0 12V20M34 12V20M-34 20H34","body"),[PT("w",-52,0,"w","GAS"),PT("e",50,0,"e","POWER"),PT("n",0,-12,"n"),PT("s",0,20,"s")])],
 ["D — Nhiệt điện khí (lò hơi + turbine)",SC(-62,62,-54,30,R(-52,-24,34,52,"body",3)+FLAME(-35,28,1.2)+STACK(-35,-52,-24,8)+L("M-18 -6H0","body")+C(18,-6,14)+LB(18,-2,"ST",10)+L("M32 -6H44","body")+C(52,-6,10)+LB(52,-2,"G",9),[PT("w",-52,4,"w","GAS"),PT("e",62,-6,"e","POWER"),PT("n",-35,-52,"n"),PT("s",18,12,"s","COND")])]
]);
reg("consumer","Hộ tiêu thụ khí","Hạ tầng chuỗi cung ứng khí","CU",[
 ["A — Nhà máy / khu công nghiệp",SC(-44,40,-40,26,`<path class="body" d="M-40 24V-6L-26 -18V-6L-12 -18V-6L2 -18V24Z"/>`+R(12,-34,8,58,"body")+R(26,-24,8,48,"body")+R(-34,8,10,8,"thin")+R(-18,8,10,8,"thin")+L("M-44 24H40","body"),[PT("w",-40,8,"w"),PT("e",34,8,"e"),PT("n",16,-34,"n"),PT("s",0,24,"s")])],
 ["B — Khu dân cư / đô thị",SC(-54,54,-46,24,HOUSE(-50,24,28,18)+HOUSE(-14,24,32,26)+HOUSE(26,24,26,16)+L("M-54 24H54","body"),[PT("w",-54,6,"w"),PT("e",54,6,"e"),PT("n",2,-46,"n"),PT("s",0,24,"s")])],
 ["C — Trạm nạp CNG / LNG (cây xăng)",SC(-42,42,-40,28,R(-40,-34,80,8,"body")+L("M-32 -26V24M32 -26V24","body")+R(-8,-16,16,38,"body",2)+R(-5,-12,10,9,"thin")+L("M8 -4Q22 -4 20 10","thin")+LB(0,16,"CNG",6.5)+L("M-42 24H42","body"),[PT("w",-42,0,"w"),PT("e",42,0,"e"),PT("n",0,-34,"n"),PT("s",0,28,"s")])],
 ["D — Hộ gia đình / bếp",SC(-30,30,-40,26,HOUSE(-24,24,48,28)+FLAME(0,24,1.3)+L("M-30 24H30","body"),[PT("w",-30,6,"w"),PT("e",30,6,"e"),PT("n",0,-40,"n"),PT("s",0,24,"s")])],
 ["E — Nhà máy phân đạm / hóa chất",SC(-54,54,-52,32,R(-48,-44,14,76,"body",5)+L("M-48 -24H-34M-48 -4H-34M-48 16H-34")+C(-8,6,18)+L("M-26 6H-34","thin")+L("M-8 -12V-40")+R(16,-10,28,40,"body",4)+STACK(50,-50,-10,6)+L("M-34 -34H-8","thin"),[PT("w",-48,-34,"w"),PT("e",44,8,"e"),PT("n",-41,-44,"n"),PT("s",0,32,"s")])],
 ["F — Tòa nhà thương mại / khách sạn",SC(-32,32,-50,28,R(-20,-44,40,72,"body")+L("M-20 -28H20M-20 -12H20M-20 4H20M-20 20H20M-6 -44V28M8 -44V28","thin")+R(-30,10,10,18,"body")+R(20,0,10,28,"body"),[PT("w",-30,18,"w"),PT("e",30,14,"e"),PT("n",0,-44,"n"),PT("s",0,28,"s")])]
]);
reg("valve_station","Trạm van tuyến ống","Hạ tầng chuỗi cung ứng khí","VS",[
 ["A — Trạm van chặn (block valve)",SC(-40,40,-26,26,R(-22,-20,44,40,"dash")+L("M-40 0H-12M12 0H40","body")+BRK(0,0,1.1)+L("M0 -8V-16M-6 -16H6","thin"),[PT("w",-40,0,"w"),PT("e",40,0,"e"),PT("n",0,-20,"n"),PT("s",0,20,"s")])],
 ["B — Trạm phóng / nhận thoi (pig)",SC(-48,48,-30,26,R(-40,-24,80,46,"dash")+HS(-34,4,-8,8)+R(4,-6,8,12,"body")+L("M-48 0H-34M12 0H20M20 0H48","body")+BRK(30,0,.8)+L("M-16 -8V-20H-4","thin"),[PT("w",-48,0,"w"),PT("e",48,0,"e"),PT("n",-4,-20,"n","KICKER"),PT("s",0,22,"s")])],
 ["C — Trạm cắt khẩn cấp (SSV / ESD)",SC(-40,40,-36,26,R(-22,-24,44,46,"dash")+L("M-40 0H-12M12 0H40","body")+BRK(0,0,1.1)+L("M0 -8V-14","thin")+`<path class="body" d="M-8 -14A8 8 0 0 1 8 -14Z"/>`+C(18,-20,0.01)+C(26,-26,6)+L("M20 -22L8 -16","thin"),[PT("w",-40,0,"w"),PT("e",40,0,"e"),PT("n",0,-24,"n"),PT("s",0,22,"s")])]
]);
reg("terminal","Cảng / Kho / Phao (terminal)","Hạ tầng chuỗi cung ứng khí","TM",[
 ["A — Cầu cảng (jetty) + tàu",SC(-56,60,-34,32,L("M-56 0H12","body")+L("M-48 0V18M-32 0V18M-16 0V18M0 0V18","body")+WV(-56,60,16,"wat")+`<path class="body" d="M10 6H60L52 24H18Z"/>`+R(34,-8,18,14,"body")+L("M12 0L28 -14L40 -14","body")+C(12,0,3,"solid")+C(28,-14,2.5,"solid"),[PT("w",-56,0,"w"),PT("e",60,6,"e"),PT("n",28,-14,"n","ARM"),PT("s",-24,18,"s")])],
 ["B — Phao một điểm (SPM / CALM)",SC(-40,40,-40,40,WV(-40,40,0,"wat")+`<path class="body" d="M-14 0L-10 -14H10L14 0Z"/>`+L("M0 -14V-26M-8 -26H8","body")+L("M0 0V30M-6 0L-24 30M6 0L24 30","thin")+L("M0 -22C20 -30 26 -20 40 -20","dash")+L("M-40 30H40","body"),[PT("w",-40,30,"w","PLEM"),PT("e",40,-20,"e","HOSE"),PT("n",0,-26,"n"),PT("s",0,30,"s")])],
 ["C — Kho LPG (bồn trụ nằm + bồn cầu)",SC(-60,60,-32,34,HS(-56,-16,-12,12)+L("M-46 12V22M-26 12V22M-52 22H-40M-32 22H-20")+C(14,-4,22)+L("M-8 26L-6 34M14 18V34M36 26L34 34M-12 34H40")+HS(30,60,-18,-2)+L("M-16 0H-8","body"),[PT("w",-56,0,"w"),PT("e",60,-10,"e"),PT("n",14,-26,"n"),PT("s",14,34,"s")])],
 ["D — Kho xăng dầu (3 bồn + đê)",SC(-62,62,-34,30,R(-60,-2,120,32,"dash")+[-40,0,40].map(x=>R(x-16,-22,32,44,"body")+`<path class="body" d="M${x-16} -22L${x} -30L${x+16} -22Z"/>`).join(""),[PT("w",-60,16,"w"),PT("e",60,16,"e"),PT("n",0,-30,"n"),PT("s",0,30,"s")])]
]);
reg("storage","Kho chứa khí ngầm (UGS)","Hạ tầng chuỗi cung ứng khí","UGS",[
 ["A — Mỏ cạn kiệt (depleted reservoir)",SC(-52,52,-30,50,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+L("M0 -4V22","body")+`<path class="body" d="M-40 36Q-30 18 0 18Q30 18 40 36Q30 46 0 46Q-30 46 -40 36Z"/>`+C(-20,34,1.5,"solid")+C(-6,38,1.5,"solid")+C(10,34,1.5,"solid")+C(24,38,1.5,"solid")+C(0,30,1.5,"solid"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,46,"s")])],
 ["B — Hang muối (salt cavern)",SC(-52,52,-30,56,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+`<path class="body" d="M-3 -4V10Q-22 18 -20 36Q-18 52 0 52Q18 52 20 36Q22 18 3 10V-4"/>`+L("M-14 30Q0 24 14 30","thin"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,52,"s")])],
 ["C — Tầng chứa nước (aquifer)",SC(-52,52,-30,50,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+L("M0 -4V20","body")+`<path class="body" d="M-50 40Q0 4 50 40"/>`+`<path class="thin" d="M-50 50Q0 14 50 50"/>`+L("M-30 34L-24 40M-10 24L-4 30M10 24L16 30M30 34L36 40","thin"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,50,"s")])]
]);

/* ===== VẬN TẢI: XE / TÀU / TÀU HỎA / CONTAINER (Rev.4) ===== */
const WHL=(x,y,r)=>C(x,y,r||5)+C(x,y,1.6,"solid");
const CAB=(x,y)=>`<path class="body" d="M${x} ${y+8}V${y-12}H${x+14}L${x+22} ${y-2}V${y+8}Z"/>`+L(`M${x+4} ${y-8}H${x+13}L${x+17} ${y-3}H${x+4}Z`,"thin");
const TCAT="Vận tải (xe / tàu / tàu hỏa)";
reg("truck","Xe bồn / Xe chuyên chở khí","Vận tải (xe / tàu / tàu hỏa)","TR",[
 ["A — Xe bồn LNG (rơ-moóc 2 lớp chân không)",SC(-52,52,-20,18,L("M-44 8H30","body")+HS(-42,24,-18,4)+HS(-38,20,-15,1).replace('class="body"','class="dash"')+R(-52,-8,8,16,"body")+CAB(30,0)+WHL(-30,12)+WHL(-18,12)+WHL(-6,12)+WHL(36,12)+WHL(46,12),[PT("w",-52,0,"w"),PT("e",52,0,"e"),PT("n",-9,-18,"n","FILL"),PT("s",-9,18,"s","DRAIN")])],
 ["B — Xe bồn LPG (bồn áp lực)",SC(-52,52,-26,18,L("M-44 8H30","body")+HS(-42,26,-16,6)+R(-20,-22,8,6,"body")+R(2,-22,8,6,"body")+L("M-16 -16V-22M6 -16V-22","thin")+R(-52,-6,8,14,"body")+CAB(30,0)+WHL(-30,12)+WHL(-18,12)+WHL(-6,12)+WHL(36,12)+WHL(46,12),[PT("w",-52,0,"w"),PT("e",52,0,"e"),PT("n",-16,-26,"n","FILL"),PT("s",-9,18,"s")])],
 ["C — Xe bồn xăng dầu (3 ngăn)",SC(-48,50,-22,18,L("M-44 8H30","body")+R(-40,-16,70,24,"body",9)+L("M-16 -16V8M8 -16V8","thin")+R(-34,-21,6,5,"body")+R(-10,-21,6,5,"body")+R(14,-21,6,5,"body")+CAB(30,0)+WHL(-28,12)+WHL(-16,12)+WHL(36,12)+WHL(46,12),[PT("w",-48,0,"w"),PT("e",50,0,"e"),PT("n",-7,-21,"n","FILL"),PT("s",-12,18,"s")])],
 ["D — Xe ống CNG (tube trailer)",SC(-50,52,-22,18,L("M-46 8H30","body")+R(-44,-20,72,28,"body",2)+[-16,-8,0].map(y=>HS(-40,24,y,y+6)).join("")+L("M24 -16H28M24 -8H28M24 0H28","thin")+CAB(30,0)+WHL(-30,12)+WHL(-18,12)+WHL(-6,12)+WHL(36,12)+WHL(46,12),[PT("w",-50,-4,"w"),PT("e",52,0,"e"),PT("n",-8,-20,"n","FILL"),PT("s",-8,18,"s")])],
 ["E — Xe chở container ISO tank",SC(-50,52,-30,18,L("M-46 8H30","body")+R(-44,-26,74,32,"body",1)+HS(-38,24,-20,-4)+[[-44,-26],[26,-26],[-44,2],[26,2]].map(p=>R(p[0],p[1],4,4,"solid")).join("")+CAB(32,0)+WHL(-30,12)+WHL(-18,12)+WHL(-6,12)+WHL(38,12)+WHL(48,12),[PT("w",-50,-4,"w"),PT("e",54,0,"e"),PT("n",-7,-30,"n","FILL"),PT("s",-7,18,"s")])],
 ["F — Xe bồn LNG nhỏ (khung cứng)",SC(-44,44,-22,18,L("M-40 8H20","body")+HS(-38,16,-18,6)+HS(-34,12,-15,3).replace('class="body"','class="dash"')+R(-44,-6,6,14,"body")+CAB(20,0)+WHL(-26,12)+WHL(-12,12)+WHL(26,12)+WHL(36,12),[PT("w",-44,0,"w"),PT("e",42,0,"e"),PT("n",-11,-18,"n","FILL"),PT("s",-11,18,"s")])]
]);
reg("rail","Tàu hỏa / Toa bồn","Vận tải (xe / tàu / tàu hỏa)","RL",[
 ["A — Đầu máy + 2 toa bồn",SC(-96,56,-24,18,L("M-96 10H56","body")+HS(-92,-48,-14,6)+R(-76,-18,8,4,"body")+WHL(-86,14,4)+WHL(-76,14,4)+WHL(-62,14,4)+WHL(-52,14,4)+L("M-48 0H-44","body")+HS(-42,2,-14,6)+R(-26,-18,8,4,"body")+WHL(-36,14,4)+WHL(-26,14,4)+WHL(-12,14,4)+WHL(-2,14,4)+L("M2 0H8","body")+`<path class="body" d="M8 10V-12H34V-18H46L56 -4V10Z"/>`+R(36,-12,8,8,"thin")+WHL(16,14,4)+WHL(28,14,4)+WHL(44,14,4),[PT("w",-96,0,"w"),PT("e",56,0,"e"),PT("n",-70,-18,"n","FILL"),PT("s",-40,18,"s")])],
 ["B — Toa bồn LPG (áp lực)",SC(-56,56,-24,18,L("M-56 10H56","body")+HS(-48,48,-16,6)+R(-6,-22,12,6,"body",2)+L("M-48 10V6M48 10V6","thin")+WHL(-38,14,4)+WHL(-26,14,4)+WHL(26,14,4)+WHL(38,14,4)+L("M-56 0H-48M48 0H56","body"),[PT("w",-56,0,"w"),PT("e",56,0,"e"),PT("n",0,-22,"n","FILL"),PT("s",0,18,"s")])],
 ["C — Toa bồn dầu thô",SC(-56,56,-26,18,L("M-56 10H56","body")+HS(-48,48,-16,6)+R(-8,-22,16,6,"body",1)+L("M-30 -16V6M30 -16V6","thin")+L("M-6 -24H6","thin")+WHL(-38,14,4)+WHL(-26,14,4)+WHL(26,14,4)+WHL(38,14,4)+L("M-56 0H-48M48 0H56","body"),[PT("w",-56,0,"w"),PT("e",56,0,"e"),PT("n",0,-24,"n","FILL"),PT("s",0,18,"s")])],
 ["D — Toa chở container ISO",SC(-56,56,-34,18,L("M-56 10H56","body")+R(-52,2,104,6,"body")+R(-48,-26,96,28,"body",1)+HS(-42,42,-20,-4)+[[-48,-26],[44,-26],[-48,-2],[44,-2]].map(p=>R(p[0],p[1],4,4,"solid")).join("")+WHL(-38,14,4)+WHL(-26,14,4)+WHL(26,14,4)+WHL(38,14,4),[PT("w",-56,0,"w"),PT("e",56,0,"e"),PT("n",0,-26,"n","FILL"),PT("s",0,18,"s")])]
]);
const _hull=(x0,x1,y,d)=>`<path class="body" d="M${x0} ${y}H${x1}L${x1-12} ${y+d}H${x0+8}Q${x0} ${y+d} ${x0} ${y+d-8}Z"/>`;
const _acc=(x)=>R(x,-22,18,20,"body")+R(x+4,-30,6,8,"body")+L(`M${x+3} -16H${x+15}M${x+3} -10H${x+15}`,"thin");
reg("ship","Tàu / Sà lan chở khí & dầu","Vận tải (xe / tàu / tàu hỏa)","SH",[
 ["A — Tàu LNG (màng, bồn lăng trụ)",SC(-72,72,-34,18,_hull(-70,70,-2,16)+_acc(-66)+[-40,-12,16,44].map(x=>R(x-12,-14,24,12,"body",2)+R(x-3,-18,6,4,"body")).join("")+L("M-44 -6H60","thin")+WV(-72,72,8,"wat"),[PT("w",-70,6,"w"),PT("e",70,-2,"e"),PT("n",2,-18,"n","MANIFOLD"),PT("s",0,14,"s")])],
 ["B — Tàu LNG (Moss, 4 bồn cầu)",SC(-72,72,-34,18,_hull(-70,70,-2,16)+_acc(-66)+[-36,-10,16,42].map(x=>C(x,-10,12)).join("")+WV(-72,72,8,"wat"),[PT("w",-70,6,"w"),PT("e",70,-2,"e"),PT("n",2,-22,"n","MANIFOLD"),PT("s",0,14,"s")])],
 ["C — Tàu LPG (bồn trụ nằm)",SC(-72,72,-34,18,_hull(-70,70,-2,16)+_acc(-66)+[-36,-8,20].map(x=>HS(x-12,x+14,-16,-2)+R(x-2,-20,4,4,"body")).join("")+WV(-72,72,8,"wat"),[PT("w",-70,6,"w"),PT("e",70,-2,"e"),PT("n",0,-20,"n","MANIFOLD"),PT("s",0,14,"s")])],
 ["D — Tàu dầu (tanker)",SC(-72,72,-34,18,_hull(-70,70,-2,16)+_acc(-66)+L("M-46 -6H62","thin")+[-40,-20,0,20,40].map(x=>R(x-6,-8,12,6,"body")).join("")+L("M-46 -10H-46M-46 -10V-2","thin")+WV(-72,72,8,"wat"),[PT("w",-70,6,"w"),PT("e",70,-2,"e"),PT("n",0,-8,"n","MANIFOLD"),PT("s",0,14,"s")])],
 ["E — Sà lan chở khí / dầu (barge)",SC(-52,52,-26,16,`<path class="body" d="M-50 0H50L44 12H-44Z"/>`+HS(-36,26,-14,0)+R(30,-14,14,14,"body")+L("M33 -9H41","thin")+WV(-52,52,8,"wat"),[PT("w",-50,6,"w"),PT("e",50,6,"e"),PT("n",-5,-14,"n","FILL"),PT("s",0,12,"s")])],
 ["F — FSRU (tàu chứa & hóa khí nổi)",SC(-72,76,-40,18,_hull(-70,70,-2,16)+_acc(-66)+[-40,-14,12].map(x=>R(x-12,-14,24,12,"body",2)+R(x-3,-18,6,4,"body")).join("")+R(32,-24,24,22,"body",2)+L("M38 -24V-34M50 -24V-34","body")+L("M56 -8H76","body")+WV(-72,76,8,"wat"),[PT("w",-70,6,"w"),PT("e",76,-8,"e","NG OUT"),PT("n",-14,-18,"n","LNG"),PT("s",0,14,"s")])],
 ["G — Tàu CNG (giá bình khí)",SC(-72,72,-34,18,_hull(-70,70,-2,16)+_acc(-66)+R(-44,-20,100,18,"body",1)+Array.from({length:12},(_,i)=>L(`M${-36+i*8} -20V-2`,"thin")).join("")+WV(-72,72,8,"wat"),[PT("w",-70,6,"w"),PT("e",70,-2,"e"),PT("n",6,-20,"n","MANIFOLD"),PT("s",0,14,"s")])],
 ["H — Tàu kéo / tàu phục vụ giàn",SC(-38,38,-32,14,`<path class="body" d="M-36 0H36L30 10H-30Q-36 10 -36 4Z"/>`+R(-6,-14,20,14,"body")+R(-24,-10,8,10,"body")+L("M4 -14V-30M-2 -24H10","body")+L("M-6 -8H14","thin")+WV(-38,38,10,"wat"),[PT("w",-36,2,"w"),PT("e",36,0,"e"),PT("n",4,-30,"n"),PT("s",0,10,"s")])]
]);
reg("container","Container / ISO tank / Bình khí","Vận tải (xe / tàu / tàu hỏa)","CT",[
 ["A — ISO tank container",SC(-44,44,-20,20,R(-42,-18,84,36,"body",1)+HS(-36,36,-12,12)+[[-42,-18],[38,-18],[-42,14],[38,14]].map(p=>R(p[0],p[1],4,4,"solid")).join("")+R(-6,-16,12,4,"body"),[PT("w",-42,0,"w"),PT("e",42,0,"e"),PT("n",0,-18,"n","FILL"),PT("s",0,18,"s","DRAIN")])],
 ["B — Container CNG (giá bình nằm)",SC(-44,44,-24,24,R(-42,-22,84,44,"body",1)+[-16,-8,0,8,16].map(y=>HS(-36,36,y-3,y+3)).join("")+[[-42,-22],[38,-22],[-42,18],[38,18]].map(p=>R(p[0],p[1],4,4,"solid")).join(""),[PT("w",-42,0,"w"),PT("e",42,0,"e"),PT("n",0,-22,"n","FILL"),PT("s",0,22,"s")])],
 ["C — Cụm bình khí (module chai)",SC(-30,30,-32,32,R(-28,-30,56,60,"body",2)+[-16,0,16].map(y=>[-14,0,14].map(x=>C(x,y,6)).join("")).join("")+L("M-28 -22H28","thin"),[PT("w",-28,0,"w"),PT("e",28,0,"e"),PT("n",0,-30,"n","FILL"),PT("s",0,30,"s")])],
 ["D — Bình LPG (chai 12 kg)",SC(-14,14,-30,26,R(-11,-18,22,40,"body",10)+R(-6,-24,12,6,"body",2)+L("M0 -24V-30M-4 -30H4","body")+L("M-9 18H9","thin")+R(-12,22,24,4,"body"),[PT("w",-11,2,"w"),PT("e",11,2,"e"),PT("n",0,-30,"n","VALVE"),PT("s",0,26,"s")])]
]);

/* ============ CƠ SỞ DỮ LIỆU ỐNG: SIZE / SCHEDULE / TUBE / VẬT LIỆU ============
 Nguồn đối chiếu: ASME B36.10M (thép carbon & hợp kim), ASME B36.19M (inox),
 ISO 4200 / EN 10220 (hệ mét), TEMA/BWG (ống trao đổi nhiệt), ASTM B88 (ống đồng),
 ISO 4427 (PE100, SDR). Giá trị chiều dày danh định (mm); ID & khối lượng chỉ tính xấp xỉ. */
const NPS_DN={"1/8":6,"1/4":8,"3/8":10,"1/2":15,"3/4":20,"1":25,"1-1/4":32,"1-1/2":40,"2":50,"2-1/2":65,"3":80,"3-1/2":90,"4":100,"5":125,"6":150,"8":200,"10":250,"12":300,"14":350,"16":400,"18":450,"20":500,"22":550,"24":600,"26":650,"28":700,"30":750,"32":800,"34":850,"36":900,"38":950,"40":1000,"42":1050,"44":1100,"46":1150,"48":1200,"52":1300,"56":1400,"60":1500,"64":1600,"68":1700,"72":1800,"76":1900,"80":2000};
/* B36.10M — cột: 10,20,30,40,STD,60,80,XS,100,120,140,160,XXS ; "-" = không có */
const B3610_COLS=["10","20","30","40","STD","60","80","XS","100","120","140","160","XXS"];
const B3610_ROWS=`1/8|10.3|1.24 - - 1.73 1.73 - 2.41 2.41 - - - - -
1/4|13.7|1.65 - - 2.24 2.24 - 3.02 3.02 - - - - -
3/8|17.1|1.65 - - 2.31 2.31 - 3.20 3.20 - - - - -
1/2|21.3|2.11 - - 2.77 2.77 - 3.73 3.73 - - - 4.78 7.47
3/4|26.7|2.11 - - 2.87 2.87 - 3.91 3.91 - - - 5.56 7.82
1|33.4|2.77 - - 3.38 3.38 - 4.55 4.55 - - - 6.35 9.09
1-1/4|42.2|2.77 - - 3.56 3.56 - 4.85 4.85 - - - 6.35 9.70
1-1/2|48.3|2.77 - - 3.68 3.68 - 5.08 5.08 - - - 7.14 10.15
2|60.3|2.77 - - 3.91 3.91 - 5.54 5.54 - - - 8.74 11.07
2-1/2|73.0|3.05 - - 5.16 5.16 - 7.01 7.01 - - - 9.53 14.02
3|88.9|3.05 - - 5.49 5.49 - 7.62 7.62 - - - 11.13 15.24
3-1/2|101.6|3.05 - - 5.74 5.74 - 8.08 8.08 - - - - 16.15
4|114.3|3.05 - - 6.02 6.02 - 8.56 8.56 - 11.13 - 13.49 17.12
5|141.3|3.40 - - 6.55 6.55 - 9.53 9.53 - 12.70 - 15.88 19.05
6|168.3|3.40 - - 7.11 7.11 - 10.97 10.97 - 14.27 - 18.26 21.95
8|219.1|3.76 6.35 7.04 8.18 8.18 10.31 12.70 12.70 15.09 18.26 20.62 23.01 22.23
10|273.1|4.19 6.35 7.80 9.27 9.27 12.70 15.09 12.70 18.26 21.44 25.40 28.58 25.40
12|323.9|4.57 6.35 8.38 10.31 9.53 14.27 17.48 12.70 21.44 25.40 28.58 33.32 25.40
14|355.6|6.35 7.92 9.53 11.13 9.53 15.09 19.05 12.70 23.83 27.79 31.75 35.71 -
16|406.4|6.35 7.92 9.53 12.70 9.53 16.66 21.44 12.70 26.19 30.96 36.53 40.49 -
18|457.2|6.35 7.92 11.13 14.27 9.53 19.05 23.83 12.70 29.36 34.93 39.67 45.24 -
20|508.0|6.35 9.53 12.70 15.09 9.53 20.62 26.19 12.70 32.54 38.10 44.45 50.01 -
22|558.8|6.35 9.53 12.70 - 9.53 22.23 28.58 12.70 34.93 41.28 47.63 53.98 -
24|609.6|6.35 9.53 14.27 17.48 9.53 24.61 30.96 12.70 38.89 46.02 52.37 59.54 -
26|660.4|7.92 12.70 - - 9.53 - - 12.70 - - - - -
28|711.2|7.92 12.70 15.88 - 9.53 - - 12.70 - - - - -
30|762.0|7.92 12.70 15.88 - 9.53 - - 12.70 - - - - -
32|812.8|7.92 12.70 15.88 17.48 9.53 - - 12.70 - - - - -
34|863.6|7.92 12.70 15.88 17.48 9.53 - - 12.70 - - - - -
36|914.4|7.92 12.70 15.88 19.05 9.53 - - 12.70 - - - - -
38|965.2|- - - - 9.53 - - 12.70 - - - - -
40|1016.0|- - - - 9.53 - - 12.70 - - - - -
42|1066.8|- - - - 9.53 - - 12.70 - - - - -
44|1117.6|- - - - 9.53 - - 12.70 - - - - -
46|1168.4|- - - - 9.53 - - 12.70 - - - - -
48|1219.2|- - - - 9.53 - - 12.70 - - - - -
52|1320.8|- - - - 9.53 - - 12.70 - - - - -
56|1422.4|- - - - 9.53 - - 12.70 - - - - -
60|1524.0|- - - - 9.53 - - 12.70 - - - - -
64|1625.6|- - - - 9.53 - - 12.70 - - - - -
68|1727.2|- - - - 9.53 - - 12.70 - - - - -
72|1828.8|- - - - 9.53 - - 12.70 - - - - -
76|1930.4|- - - - 9.53 - - 12.70 - - - - -
80|2032.0|- - - - 9.53 - - 12.70 - - - - -`;
/* B36.19M — inch: 5S,10S,40S,80S (inox) */
const B3619_ROWS=`1/8|0.405|- .049 .068 .095
1/4|0.540|- .065 .088 .119
3/8|0.675|- .065 .091 .126
1/2|0.840|.065 .083 .109 .147
3/4|1.050|.065 .083 .113 .154
1|1.315|.065 .109 .133 .179
1-1/4|1.660|.065 .109 .140 .191
1-1/2|1.900|.065 .109 .145 .200
2|2.375|.065 .109 .154 .218
2-1/2|2.875|.083 .120 .203 .276
3|3.500|.083 .120 .216 .300
3-1/2|4.000|.083 .120 .226 .318
4|4.500|.083 .120 .237 .337
5|5.563|.109 .134 .258 .375
6|6.625|.109 .134 .280 .432
8|8.625|.109 .148 .322 .500
10|10.750|.134 .165 .365 .500
12|12.750|.156 .180 .375 .500
14|14.000|.156 .188 .375 .500
16|16.000|.165 .188 .375 .500
18|18.000|.165 .188 .375 .500
20|20.000|.188 .218 .375 .500
22|22.000|.188 .218 .375 .500
24|24.000|.218 .250 .375 .500
30|30.000|.250 .312 .375 .500`;
const B3619_COLS=["5S","10S","40S","80S"];
/* Hệ mét ISO 4200 / EN 10220 (loạt 1) */
const ISO_OD=[10.2,13.5,17.2,21.3,26.9,33.7,42.4,48.3,60.3,76.1,88.9,114.3,139.7,168.3,219.1,273,323.9,355.6,406.4,457,508,559,610,660,711,762,813,864,914,1016,1067,1118,1168,1219,1422,1626,1829];
const ISO_DN={10.2:6,13.5:8,17.2:10,21.3:15,26.9:20,33.7:25,42.4:32,48.3:40,60.3:50,76.1:65,88.9:80,114.3:100,139.7:125,168.3:150,219.1:200,273:250,323.9:300,355.6:350,406.4:400,457:450,508:500,559:550,610:600,660:650,711:700,762:750,813:800,864:850,914:900,1016:1000,1067:1050,1118:1100,1168:1150,1219:1200,1422:1400,1626:1600,1829:1800};
const ISO_WALLS=[1.6,2,2.3,2.6,2.9,3.2,3.6,4,4.5,5,5.6,6.3,7.1,8,8.8,10,11,12.5,14.2,16,17.5,20,22.2,25,28,30,32,36,40,45,50,55,60];
/* Ống trao đổi nhiệt: OD (in) + BWG */
const BWG={7:.180,8:.165,9:.148,10:.134,11:.120,12:.109,13:.095,14:.083,15:.072,16:.065,17:.058,18:.049,19:.042,20:.035,21:.032,22:.028,23:.025,24:.022};
const TUBE_OD_IN=["1/4","3/8","1/2","5/8","3/4","7/8","1","1-1/4","1-1/2","2"];
const TUBE_OD_MM=[16,19.05,20,25,25.4,30,32,38,50.8];
const TUBE_MM_WALLS=[1.0,1.2,1.5,1.6,2.0,2.11,2.5,2.77,3.0,3.4];
/* Ống nhỏ đo lường / thủy lực */
const TUBING_OD_IN=["1/16","1/8","3/16","1/4","5/16","3/8","1/2","5/8","3/4","7/8","1"];
const TUBING_OD_MM=[3,4,6,8,10,12,14,15,16,18,20,22,25];
const TUBING_IN_WALLS=[.010,.014,.020,.028,.035,.049,.065,.083,.095,.109,.120];
const TUBING_MM_WALLS=[0.5,0.8,1.0,1.5,2.0,2.5,3.0];
/* Ống đồng ASTM B88: danh nghĩa → OD = nominal + 1/8 in ; K/L/M (in) */
const CU_ROWS=`1/4|.375|.035 .030 -
3/8|.500|.049 .035 .025
1/2|.625|.049 .040 .028
5/8|.750|.049 .042 -
3/4|.875|.065 .045 .032
1|1.125|.065 .050 .035
1-1/4|1.375|.065 .055 .042
1-1/2|1.625|.072 .060 .049
2|2.125|.083 .070 .058
2-1/2|2.625|.095 .080 .065
3|3.125|.109 .090 .072
3-1/2|3.625|.120 .100 .083
4|4.125|.134 .110 .095
5|5.125|.160 .125 .109
6|6.125|.192 .140 .122
8|8.125|.271 .200 .170
10|10.125|.338 .250 .212
12|12.125|.405 .280 .254`;
/* PE100 — ISO 4427 : OD (mm) × SDR */
const PE_OD=[20,25,32,40,50,63,75,90,110,125,140,160,180,200,225,250,280,315,355,400,450,500,560,630,710,800,900,1000,1200];
const PE_SDR=[41,33,26,21,17,13.6,11,9,7.4];

const IN=25.4,r2d=v=>Math.round(v*100)/100,r3d=v=>Math.round(v*1000)/1000;
const npsLabel=k=>k.replace("-"," ");
function parseRows(txt){return txt.split("\n").map(l=>{const a=l.split("|"),w=a[2].trim().split(/\s+/);return{k:a[0],od:+a[1],w}})}
const PIPE_STD={};
(function build(){
 const x=parseRows(B3610_ROWS);
 PIPE_STD.b3610={name:"ASME B36.10M — Thép carbon / hợp kim (NPS 1/8–80)",kind:"nps",sizes:x.map(r=>{
   const walls=[];B3610_COLS.forEach((c,i)=>{const v=r.w[i];if(v&&v!=="-")walls.push({k:c,t:+v})});
   return{k:r.k,od:r.od,dn:NPS_DN[r.k],walls:mergeAlias(walls)}})};
 const y=parseRows(B3619_ROWS);
 PIPE_STD.b3619={name:"ASME B36.19M — Inox (NPS 1/8–30, 5S/10S/40S/80S)",kind:"nps",sizes:y.map(r=>{
   const walls=[];B3619_COLS.forEach((c,i)=>{const v=r.w[i];if(v&&v!=="-")walls.push({k:c,t:r2d(+v*IN)})});
   return{k:r.k,od:r2d(r.od*IN),dn:NPS_DN[r.k],walls:mergeAlias(walls)}})};
 PIPE_STD.iso={name:"Hệ mét ISO 4200 / EN 10220 (OD loạt 1)",kind:"od",sizes:ISO_OD.map(od=>{
   const lo=od<30?1.6:od<100?2:od<300?3.2:4,walls=ISO_WALLS.filter(t=>t>=lo&&t<=od/4).map(t=>({k:String(t),t,a:[]}));
   return{k:String(od),od,dn:ISO_DN[od],walls}})};
 PIPE_STD.tube={name:"Ống trao đổi nhiệt / tube (OD + BWG)",kind:"od",sizes:[...TUBE_OD_IN.map(k=>{const od=r2d(evalFrac(k)*IN);return{k:k+'"',od,walls:Object.entries(BWG).filter(([g,t])=>t*IN<od/2.2).map(([g,t])=>({k:"BWG "+g,t:r2d(t*IN),a:[]}))}}),
   ...TUBE_OD_MM.map(od=>({k:od+" mm",od,walls:TUBE_MM_WALLS.filter(t=>t<od/2.2).map(t=>({k:String(t),t,a:[]}))}))]};
 PIPE_STD.tubing={name:"Ống nhỏ đo lường / thủy lực (tubing)",kind:"od",sizes:[...TUBING_OD_IN.map(k=>{const od=r2d(evalFrac(k)*IN);return{k:k+'"',od,walls:TUBING_IN_WALLS.filter(t=>t*IN<od/2.3).map(t=>({k:'.'+String(Math.round(t*1000)).padStart(3,"0")+'"',t:r2d(t*IN),a:[]}))}}),
   ...TUBING_OD_MM.map(od=>({k:od+" mm",od,walls:TUBING_MM_WALLS.filter(t=>t<od/2.3).map(t=>({k:String(t),t,a:[]}))}))]};
 PIPE_STD.cu={name:"Ống đồng ASTM B88 (Type K / L / M)",kind:"nps",sizes:parseRows(CU_ROWS).map(r=>{const walls=[];["K","L","M"].forEach((c,i)=>{const v=r.w[i];if(v&&v!=="-")walls.push({k:"Type "+c,t:r2d(+v*IN),a:[]})});return{k:r.k,od:r2d(r.od*IN),dn:null,walls}})};
 PIPE_STD.pe={name:"HDPE PE100 — ISO 4427 (OD × SDR)",kind:"od",sizes:PE_OD.map(od=>({k:String(od),od,walls:PE_SDR.map(s=>({k:"SDR "+s,t:Math.max(2,Math.ceil(od/s*10-1e-9)/10),a:[]})).filter(w=>w.t<=od/2.2)}))};
 PIPE_STD.custom={name:"Tùy chỉnh (nhập OD & chiều dày)",kind:"custom",sizes:[]};
})();
function evalFrac(k){const m=/^(?:(\d+)-)?(\d+)\/(\d+)$/.exec(k);if(m)return(+m[1]||0)+(+m[2])/(+m[3]);return +k}
function mergeAlias(walls){
 /* gộp các schedule cùng chiều dày: STD/40, XS/80 ... */
 const out=[];walls.forEach(w=>{const f=out.find(o=>Math.abs(o.t-w.t)<.005);if(f)f.a.push(w.k);else out.push({k:w.k,t:w.t,a:[]})});return out;
}
function pipeStdList(){return Object.entries(PIPE_STD).map(([k,v])=>[k,v.name])}
function pipeSize(std,k){const s=PIPE_STD[std];return s?(s.sizes.find(z=>z.k===String(k))||null):null}
/* nhãn kích thước theo hệ đơn vị */
function pipeSizeLabel(std,z,units){
 const s=PIPE_STD[std];if(!z)return"";
 const odT=units==="US"?r3d(z.od/IN)+" in":z.od+" mm";
 if(s.kind==="nps"&&std!=="cu"){return units==="US"?`NPS ${npsLabel(z.k)} (DN ${z.dn}) — OD ${odT}`:`DN ${z.dn} (NPS ${npsLabel(z.k)}) — OD ${odT}`}
 if(std==="cu")return`${npsLabel(z.k)}" danh nghĩa — OD ${odT}`;
 if(std==="iso")return z.dn?`DN ${z.dn} — OD ${odT}`:`OD ${odT}`;
 return`OD ${z.k} — ${odT}`;
}
function pipeWallLabel(w,units){
 const al=w.a&&w.a.length?" / "+w.a.join(" / "):"";
 const tT=units==="US"?r3d(w.t/IN).toFixed(3)+" in":w.t+" mm";
 const isSch=/^(10|20|30|40|60|80|100|120|140|160|5S|10S|40S|80S)$/.test(w.k);
 if(/^[\d.]+$/.test(w.k))return tT;
 return`${isSch?"Sch ":""}${w.k}${al} — ${tT}`;
}
/* thông số suy ra của một đường ống (hoặc null) */
function pipeCalc(e){
 let od=null,t=null,dn=null,nps=null,schTxt="";
 if(e.std==="custom"){od=+e.od||null;t=+e.wall||null}
 else if(e.std&&PIPE_STD[e.std]){
  const z=pipeSize(e.std,e.nps);if(z){od=z.od;dn=z.dn;nps=z.k;
   const w=z.walls.find(q=>q.k===e.sch||(q.a||[]).includes(e.sch));if(w){t=w.t;schTxt=(w.a&&w.a.length?w.k+"/"+w.a.join("/"):w.k)}}
 }
 if(!od)return null;
 const id=t?r2d(od-2*t):null;
 return{od,t,id,dn,nps,sch:schTxt,mass:(t&&/b3610|b3619|iso|tube/.test(e.std||""))?r2d((od-t)*t*0.02466):null};
}
/* văn bản hiển thị trên bản vẽ theo meta.pipeLabel và đơn vị */
function pipeSpecText(e,mode,units,matShort){
 if(!mode||mode==="none")return"";
 const c=pipeCalc(e);let s="";
 if(c){
  if(units==="US"){s=c.nps?`${npsLabel(c.nps)}"`:`OD ${r3d(c.od/IN)}"`}
  else s=c.dn?`DN${c.dn}`:`Ø${c.od}`;
  if((mode==="sch"||mode==="full")&&c.sch)s+=` ${/^\d/.test(c.sch)&&!/[A-Za-z]/.test(c.sch)?"SCH ":""}${c.sch}`;
  else if((mode==="sch"||mode==="full")&&c.t)s+=` t${units==="US"?r3d(c.t/IN)+'"':c.t}`;
 }else if(e.size)s=e.size;
 if(mode==="full"&&matShort)s+=(s?" • ":"")+matShort;
 return s;
}
/* ===== VẬT LIỆU ỐNG ===== */
const MATS=[
 ["cs_a106b","Thép carbon ASTM A106 Gr.B (liền mạch)","CS A106-B"],
 ["cs_a53b","Thép carbon ASTM A53 Gr.B","CS A53-B"],
 ["api5l_b","Thép đường ống API 5L Gr.B","API 5L B"],
 ["api5l_x52","Thép đường ống API 5L X52","API 5L X52"],
 ["api5l_x60","Thép đường ống API 5L X60","API 5L X60"],
 ["api5l_x65","Thép đường ống API 5L X65","API 5L X65"],
 ["api5l_x70","Thép đường ống API 5L X70","API 5L X70"],
 ["ltcs","Thép carbon nhiệt độ thấp ASTM A333 Gr.6","LTCS A333-6"],
 ["galv","Thép carbon mạ kẽm (A53 galvanized)","CS GALV"],
 ["p11","Hợp kim ASTM A335 P11 (1¼Cr–½Mo)","A335 P11"],
 ["p22","Hợp kim ASTM A335 P22 (2¼Cr–1Mo)","A335 P22"],
 ["p91","Hợp kim ASTM A335 P91 (9Cr–1Mo–V)","A335 P91"],
 ["ss304","Inox 304 / 304L (A312 TP304L)","SS 304L"],
 ["ss316","Inox 316 / 316L (A312 TP316L)","SS 316L"],
 ["ss321","Inox 321 / 347 (ổn định hóa)","SS 321/347"],
 ["dss2205","Duplex 2205 (UNS S31803 / S32205)","DSS 2205"],
 ["sdss2507","Super duplex 2507 (UNS S32750)","SDSS 2507"],
 ["a825","Hợp kim Incoloy 825 (UNS N08825)","Alloy 825"],
 ["a625","Hợp kim Inconel 625 (UNS N06625)","Alloy 625"],
 ["cuni","Cu-Ni 90/10 (UNS C70600)","CuNi 90/10"],
 ["ti2","Titan Gr.2","Ti Gr.2"],
 ["hdpe","Nhựa HDPE PE100","HDPE PE100"],
 ["gre","Composite GRE / GRP (sợi thủy tinh)","GRE/GRP"],
 ["other","Khác (tự nhập)…","…"]
];
const matDef=k=>MATS.find(m=>m[0]===k)||null;
function matShort(e){if(!e.mat)return"";if(e.mat==="other")return e.matOther||"";const m=matDef(e.mat);return m?m[2]:""}


/* ============ HẰNG SỐ ============ */
const PHASE={gas:{n:"Khí"},oil:{n:"Dầu"},water:{n:"Nước"},mix:{n:"Hỗn hợp"}};
const KINDS={process:"Process — nét liền",dashed:"Utility / phụ trợ — nét đứt",signal:"Tín hiệu đo / điều khiển — chấm",shaft:"Trục / cơ khí — nét đôi",road:"Vận tải đường bộ — xe",rail:"Vận tải đường sắt — tàu hỏa",sea:"Vận tải đường thủy — tàu / sà lan"};
const TRANSPORT=["road","rail","sea"];
const isTransport=e=>TRANSPORT.includes(e.kind);
const isStream=e=>e.kind!=="signal"&&e.kind!=="shaft";
const DIRV={e:[1,0],w:[-1,0],n:[0,-1],s:[0,1]};
const KEY="pfdstudio.rev4.autosave",PKEY="pfdstudio.rev4.prefs";
const SHAPE_T={line:"Đường thẳng",arrow:"Mũi tên",rect:"Hình chữ nhật",ellipse:"Hình tròn / elip",poly:"Đa tuyến / đa giác",pen:"Nét bút tự do"};
const DASHES={"":"Nét liền",dash:"Nét đứt",dot:"Chấm",dd:"Gạch chấm"};
const dashArr=(d,w)=>({dash:`${r3(w*5)} ${r3(w*3)}`,dot:`${r3(w*1.2)} ${r3(w*2.6)}`,dd:`${r3(w*6)} ${r3(w*2.5)} ${r3(w*1.2)} ${r3(w*2.5)}`}[d]||"");
const r3=v=>Math.round(v*1000)/1000;

/* ============ KHỞI TẠO TRẠNG THÁI ============ */
function defaultMeta(){return{
 title:"PROCESS FLOW DIAGRAM",project:"",client:"",company:"",rev:"Rev. 0",docNo:"PFD-001",drawnBy:"",checkedBy:"",approvedBy:"",date:new Date().toISOString().slice(0,10),
 scaleTxt:"NTS",sheetNo:"1",sheetOf:"1",docType:"Process Flow Diagram",
 sheet:"A3",orient:"landscape",template:"simple",tbLang:"auto",showSheet:true,showProps:true,showTable:false,colorByPhase:true,grid:true,snap:true,hops:true,
 lineMode:"fixed",lw:1,fs:1,fitMode:"sym",units:"SI",pipeLabel:"size",fonts:defaultFonts(),revs:[]};}
function newState(){return{meta:defaultMeta(),nodes:[],edges:[],shapes:[],nextId:1,nextStream:1}}
let state=newState(),view={x:30,y:30,k:.6};
_metaRef=()=>state.meta;
let sel=new Set(),selEdge=null,tool="select",ptr=null,conn=null,spaceDown=false,clip=null,lastDown={id:null,t:0};
const getNode=id=>state.nodes.find(n=>n.id===id);
const getShape=id=>state.shapes.find(n=>n.id===id);
const uid=p=>p+(state.nextId++);
const sn=v=>state.meta.snap?Math.round(v/10)*10:v;
const sheetDim=()=>sheetDimOf(state.meta);
const selNodes=()=>[...sel].map(getNode).filter(Boolean);
const selShapes=()=>[...sel].map(getShape).filter(Boolean);
const nodeName=id=>{const n=getNode(id);return n?(n.tag||n.title||"?"):"?"};

/* ============ CHUẨN HOÁ DỮ LIỆU (đọc cả Rev.1–3) ============ */
function cleanFonts(f){const d=defaultFonts(),o={};Object.keys(d).forEach(k=>{const s=f&&f[k]||{};o[k]={f:typeof s.f==="string"&&s.f?s.f:d[k].f,s:Math.min(60,Math.max(3,+s.s||d[k].s))}});return o}
function normalizeState(s){
 const meta={...defaultMeta(),...(s.meta||{})};
 if(meta.sheet==="A4"||!SHEETS[meta.sheet])meta.sheet=SHEETS[meta.sheet]?meta.sheet:"A3";
 if(!["landscape","portrait"].includes(meta.orient))meta.orient="landscape";
 if(!["simple","iso","ansi","epc","frame"].includes(meta.template))meta.template="simple";
 if(!["SI","US"].includes(meta.units))meta.units="SI";
 if(!["none","size","sch","full"].includes(meta.pipeLabel))meta.pipeLabel="size";
 meta.fonts=cleanFonts(meta.fonts);
 meta.revs=Array.isArray(meta.revs)?meta.revs.slice(0,30).map(r=>({r:String(r.r??""),date:String(r.date??""),desc:String(r.desc??""),by:String(r.by??""),chk:String(r.chk??""),app:String(r.app??"")})):[];
 const nodes=(s.nodes||[]).map(n=>{let t=n.type,v=+n.v||0;if(!SYMBOLS[t]&&LEGACY[t]){v=LEGACY[t][1];t=LEGACY[t][0]}return{...n,type:t,v}}).filter(n=>SYMBOLS[n.type]).map(n=>{
  const o={id:String(n.id),type:n.type,v:Math.min(Math.max(+n.v||0,0),SYMBOLS[n.type].vars.length-1),x:+n.x||0,y:+n.y||0,rot:+n.rot||0,flip:!!n.flip,sc:+n.sc||1,tag:n.tag??"",title:n.title??"",props:n.props??"",w:n.w,h:n.h,lp:["b","t","r","l"].includes(n.lp)?n.lp:"b"};
  if(n.ls&&+n.ls!==1)o.ls=Math.min(3,Math.max(.4,+n.ls));
  if(Array.isArray(n.xp)&&n.xp.length)o.xp=n.xp.slice(0,24).map((p,i)=>({id:String(p.id||"x"+(i+1)),s:["n","s","e","w"].includes(p.s)?p.s:"n",f:Math.min(1,Math.max(0,+p.f>=0?+p.f:.5)),o:+p.o||0,l:String(p.l??"")}));
  if(n.type==="text"){["ff","col","al"].forEach(k=>{if(n[k])o[k]=String(n[k])});if(n.fz)o.fz=Math.min(80,Math.max(3,+n.fz));if(n.b)o.b=true;if(n.i)o.i=true;if(n.bd)o.bd=true;if(n.bg)o.bg=String(n.bg)}
  return o});
 const ids=new Set(nodes.map(n=>n.id));
 let nextId=1;const bump=id=>{const k=parseInt(String(id).replace(/\D/g,""),10);if(k>=0&&k<1e6&&k>=nextId)nextId=k+1};
 nodes.forEach(n=>bump(n.id));(s.edges||[]).forEach(e=>{if(/^e\d{1,6}$/.test(String(e.id)))bump(e.id)});(s.shapes||[]).forEach(e=>bump(e.id));
 let ns=+s.nextStream||1;const seen=new Set(),edges=[];
 const nodeById=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const fixPort=(n,pid,dflt)=>{const d=symDef(n);return d.ports.some(p=>p.id===pid)?pid:(d.ports.some(p=>p.id===dflt)?dflt:(d.ports[0]?d.ports[0].id:dflt))};
 (s.edges||[]).forEach(e=>{
  if(!ids.has(e.from)||!ids.has(e.to))return;
  let id=String(e.id);if(!/^e\d{1,6}$/.test(id)||seen.has(id))id="e"+(nextId++);seen.add(id);
  const kind=KINDS[e.kind]?e.kind:"process";
  let num=e.num;if(num===undefined||num===null)num=(kind==="signal"||kind==="shaft")?"":ns++;else if(/^\d+$/.test(String(num)))ns=Math.max(ns,+num+1);
  const A=nodeById[e.from],B=nodeById[e.to];
  edges.push({id,from:e.from,fromPort:fixPort(A,e.fromPort||"e","e"),to:e.to,toPort:fixPort(B,e.toPort||"w","w"),kind,phase:PHASE[e.phase]?e.phase:"",num:String(num),service:e.service??"",size:e.size??"",
   std:e.std&&(PIPE_STD[e.std])?e.std:"",nps:e.nps!=null?String(e.nps):"",sch:e.sch!=null?String(e.sch):"",wall:e.wall??"",od:e.od??"",mat:e.mat??"",matOther:e.matOther??"",cls:e.cls??"",dist:e.dist??"",
   P:e.P??"",T:e.T??"",flow:e.flow??"",mid:typeof e.mid==="number"?e.mid:null,midAxis:e.midAxis||null,wt:[1,1.6,2.4].includes(+e.wt)?+e.wt:1});
 });
 const shapes=(s.shapes||[]).filter(h=>SHAPE_T[h.t]&&Array.isArray(h.pts)&&h.pts.length>=2).map(h=>({id:String(h.id),t:h.t,pts:h.pts.map(p=>({x:+p.x||0,y:+p.y||0})),col:String(h.col||"#17202a"),sw:Math.min(30,Math.max(.5,+h.sw||2)),dash:DASHES[h.dash]!==undefined?h.dash:"",fill:h.fill?String(h.fill):"",fo:Math.min(1,Math.max(0,h.fo!=null?+h.fo:.25)),ah:[0,1,2].includes(+h.ah)?+h.ah:(h.t==="arrow"?1:0),closed:!!h.closed||h.t==="rect"||h.t==="ellipse",rx:+h.rx||0,z:h.z==="b"?"b":"f"}));
 return{meta,nodes,edges,shapes,nextId,nextStream:ns};
}
function snapshot(){return JSON.stringify({meta:state.meta,nodes:state.nodes,edges:state.edges,shapes:state.shapes,nextId:state.nextId,nextStream:state.nextStream})}

/* ============ LỊCH SỬ (có tên từng bước) ============ */
let hist=[],fut=[],cur=null,asT=null,cT=null,pendLabel=null;
function resetHistory(label){hist=[];fut=[];cur={s:snapshot(),l:label||_("Khởi tạo","Initial")};updateHistUI()}
function commit(label){
 const s=snapshot();if(cur&&s===cur.s)return;
 if(cur){hist.push(cur);if(hist.length>150)hist.shift()}
 cur={s,l:label||pendLabel||_("Thay đổi","Edit")};pendLabel=null;fut=[];autosave();updateHistUI();
}
function commitSoon(label){pendLabel=label||pendLabel;clearTimeout(cT);cT=setTimeout(()=>commit(),500)}
function autosave(){clearTimeout(asT);asT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(drawingData()))}catch(e){}},400)}
function restore(s){
 state=normalizeState(JSON.parse(s));
 sel=new Set([...sel].filter(id=>getNode(id)||getShape(id)));if(selEdge&&!state.edges.find(e=>e.id===selEdge))selEdge=null;
 syncMetaUI();renderAll();autosave();updateHistUI();
}
function undo(){clearTimeout(cT);commit();if(!hist.length){setStatus(_("Không còn bước để hoàn tác.","Nothing left to undo."));return}fut.push(cur);cur=hist.pop();restore(cur.s);setStatus(_("Đã hoàn tác: ","Undone: ")+cur.l)}
function redo(){if(!fut.length){setStatus(_("Không còn bước để làm lại.","Nothing left to redo."));return}hist.push(cur);cur=fut.pop();restore(cur.s);setStatus(_("Đã làm lại: ","Redone: ")+cur.l)}
function histList(){return[...hist,cur,...[...fut].reverse()].filter(Boolean)}
function jumpHist(i){
 clearTimeout(cT);commit();const p=hist.length;
 if(i<p){while(hist.length>i){fut.push(cur);cur=hist.pop()}}else if(i>p){while(hist.length<i&&fut.length){hist.push(cur);cur=fut.pop()}}
 restore(cur.s);renderHistPanel();setStatus(_("Đã quay về bước: ","Jumped to step: ")+cur.l);
}
function updateHistUI(){if($("btnUndo"))$("btnUndo").disabled=!hist.length;if($("btnRedo"))$("btnRedo").disabled=!fut.length;if($("mHist")&&$("mHist").classList.contains("open"))renderHistPanel()}
function renderHistPanel(){
 const L=histList(),p=hist.length;
 $("histList").innerHTML=L.map((h,i)=>`<tr class="clk${i===p?" cur":""}" data-i="${i}"><td>${i+1}</td><td>${esc(h.l)}</td><td>${i===p?_("◀ hiện tại","◀ current"):i>p?_("(làm lại)","(redo)"):""}</td></tr>`).join("");
}
function setStatus(s){const e=$("status");if(e)e.textContent=s}

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
  if(n.title)rows.push([n.title,FU("desc")*ls,400,SCH.sub1,FF("desc")]);
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
function nodesMarkup(it){return[...state.nodes].sort((a,b)=>(a.type==="area"?0:1)-(b.type==="area"?0:1)).map(n=>nodeMarkup(n,it)).join("")}

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
 const xs=h.pts.map(p=>p.x),ys=h.pts.map(p=>p.y);
 return{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};
}
function shapeGeomEl(h,attrs){
 const b=shapeBox(h);
 if(h.t==="rect")return`<rect x="${r3(b.x0)}" y="${r3(b.y0)}" width="${r3(b.x1-b.x0)}" height="${r3(b.y1-b.y0)}" rx="${h.rx||0}" ${attrs}/>`;
 if(h.t==="ellipse")return`<ellipse cx="${r3((b.x0+b.x1)/2)}" cy="${r3((b.y0+b.y1)/2)}" rx="${r3((b.x1-b.x0)/2)}" ry="${r3((b.y1-b.y0)/2)}" ${attrs}/>`;
 let d;
 if(h.t==="pen")d=smoothPath(h.pts);
 else d=h.pts.map((p,i)=>(i?"L":"M")+r3(p.x)+" "+r3(p.y)).join(" ")+(h.closed&&h.t==="poly"?" Z":"");
 return`<path d="${d}" ${attrs}/>`;
}
function shapeMarkup(h,it){
 const w=h.sw*RS.lwk,col=shCol(h.col),closedKind=h.t==="rect"||h.t==="ellipse"||(h.t==="poly"&&h.closed);
 const fill=closedKind&&h.fill?`fill="${BW?"#e5e7eb":h.fill}" fill-opacity="${h.fo}"`:`fill="none"`;
 const da=dashArr(h.dash,w);
 let ah="";
 if(!closedKind&&h.ah){const id=`url(#sa${hex6(h.col)})`;ah=` marker-end="${id}"`+(h.ah===2?` marker-start="${id}"`:"")}
 let s=`<g class="shp${it&&sel.has(h.id)?" selected":""}" data-shape="${h.id}">`;
 if(it){
  const hitFill=closedKind&&h.fill?"fill=\"transparent\" pointer-events=\"visiblePainted\"":"fill=\"none\" pointer-events=\"stroke\"";
  s+=shapeGeomEl(h,`${hitFill} stroke="transparent" stroke-width="${Math.max(14,w+8)}"`);
 }
 s+=shapeGeomEl(h,`${fill} stroke="${col}" stroke-width="${r3(w)}"${da?` stroke-dasharray="${da}"`:""} stroke-linecap="round" stroke-linejoin="round"${ah} pointer-events="none"`);
 if(it&&sel.has(h.id)){
  const b=shapeBox(h),hr=Math.max(5,8/view.k);
  s+=`<rect x="${r3(b.x0-4)}" y="${r3(b.y0-4)}" width="${r3(b.x1-b.x0+8)}" height="${r3(b.y1-b.y0+8)}" fill="none" stroke="#1677ff" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  if(sel.size===1){
   if(h.t==="rect"||h.t==="ellipse"){[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].forEach((c,i)=>{s+=`<circle class="shh" data-sh="${h.id}" data-pi="c${i}" cx="${r3(c[0])}" cy="${r3(c[1])}" r="${r3(hr)}"/>`})}
   else if(h.t!=="pen"){h.pts.forEach((p,i)=>{s+=`<circle class="shh" data-sh="${h.id}" data-pi="${i}" cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(hr)}"/>`})}
  }
 }
 return s+"</g>";
}
const shapesMarkup=(z,it)=>state.shapes.filter(h=>h.z===z).map(h=>shapeMarkup(h,it)).join("");
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
 const used=[...new Set(state.edges.map(e=>e.phase).filter(Boolean))],leg=m.colorByPhase&&used.length>0;
 const top=fy0+(leg?58:28),bottom=(rev?rev.y:(tb?tb.y:fy1))-18;
 return{W,H,mg,fx0,fy0,fx1,fy1,tb,rev,used,leg,use:{l:fx0+28,t:top,r:fx1-28,b:bottom}};
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
 const availR=L.tb?L.tb.x-14:L.fx1-14,avail=availR-L.fx0-20,f=Math.min(1,avail/tot),cw=base.map(v=>v*f),W=tot*f,th=(rows.length+1)*rh,x0=L.fx0+20,ty=L.fy1-12-th;
 const ff=FF("table"),nm=id=>nodeName(id),tr=(v,i)=>trunc(v,Math.floor(cw[i]/(fz*.55)));
 let s=`<rect x="${x0}" y="${r3(ty)}" width="${r3(W)}" height="${r3(th)}" fill="${SCH.paper}" stroke="${I}" stroke-width="1.4"/><rect x="${x0}" y="${r3(ty)}" width="${r3(W)}" height="${r3(rh)}" fill="${SCH.grey}" stroke="${I}" stroke-width="1.4"/>`;
 const heads=[_("Dòng","Line"),_("Từ → Đến","From → To"),_("Dịch vụ","Service"),_("Spec / cự ly","Spec / distance"),"P","T",_("Lưu lượng","Flow")];let cx=x0;
 heads.forEach((h,i)=>{s+=`<text x="${r3(cx+4)}" y="${r3(ty+rh*.7)}" font-family="${ff}" font-size="${r3(fz)}" font-weight="700" fill="${I}">${esc(h)}</text>`;if(i>0)s+=`<path d="M${r3(cx)} ${r3(ty)} V${r3(ty+th)}" stroke="${I}" stroke-width=".8"/>`;cx+=cw[i]});
 rows.forEach((e,r)=>{const y=ty+(r+1)*rh;s+=`<path d="M${x0} ${r3(y)} H${r3(x0+W)}" stroke="${SCH.sub2}" stroke-width=".8"/>`;let x=x0;
  const spec=isTransport(e)?(e.dist||""):[pipeSpecText(e,"sch",state.meta.units,""),matShort(e)].filter(Boolean).join(" • ")||e.size;
  [e.num,nm(e.from)+" → "+nm(e.to),e.service,spec,e.P,e.T,e.flow].forEach((v,i)=>{s+=`<text x="${r3(x+4)}" y="${r3(y+rh*.7)}" font-family="${ff}" font-size="${r3(fz)}"${i===0?' font-weight="700"':""} fill="${I}">${esc(tr(v,i))}</text>`;x+=cw[i]})});
 return s;
}
function legendMarkup(L){
 if(!L.leg)return"";
 const fz=FU("legend"),ff=FF("legend");let x=L.fx0+20,y=L.fy0+fz*1.5+6,s=`<text x="${x}" y="${y}" font-family="${ff}" font-size="${r3(fz)}" font-weight="700" fill="${SCH.ink}">${esc(tbL("legend"))}</text>`;
 x+=tbL("legend").length*fz*.58+14;
 L.used.forEach(k=>{const c=phaseCol(k),nm=T_(PHASE[k].n);s+=`<path d="M${r3(x)} ${r3(y-fz*.35)} H${r3(x+30)}" stroke="${c}" stroke-width="3.5"/><text x="${r3(x+36)}" y="${y}" font-family="${ff}" font-size="${r3(fz)}" font-weight="600" fill="${c}">${esc(nm)}</text>`;x+=36+nm.length*fz*.6+22});
 return s;
}
function gridDefs(){
 return`<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${SCH.gridMinor}" stroke-width="1"/></pattern><pattern id="grid5" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="${SCH.gridMajor}" stroke-width="1"/></pattern>`;
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

/* ============ HIỂN THỊ TRÊN MÀN HÌNH ============ */
const board=$("board"),vp=$("viewport"),gSheet=$("gSheet"),gShB=$("gShB"),gEdges=$("gEdges"),gNodes=$("gNodes"),gShF=$("gShF"),gDraft=$("gDraft");
const SHAPE_TOOLS=["line","arrow","rect","ellipse","poly","pen"];
function applyView(){
 vp.setAttribute("transform",`translate(${view.x},${view.y}) scale(${view.k})`);$("zoomLbl").textContent=Math.round(view.k*100)+"%";
 if(selShapes().length===1&&sel.size===1)renderShapes();
}
function setBoardBg(){board.style.background=state.meta.showSheet?SCH.board:SCH.paper}
function renderSheet(){gSheet.innerHTML=sheetMarkup(true)}
function renderShapes(){gShB.innerHTML=shapesMarkup("b",true);gShF.innerHTML=shapesMarkup("f",true)}
function renderEdges(){gEdges.innerHTML=edgesMarkup(true)}
function renderNodes(){gNodes.innerHTML=nodesMarkup(true)}
function renderCanvasOnly(){updateRS();$("dynDefs").innerHTML=gridDefs()+markerDefs();setBoardBg();renderSheet();renderShapes();renderEdges();renderNodes()}
function renderAll(){applyView();renderCanvasOnly();renderProps();updateToolUI();$("layoutBox").innerHTML=layoutButtons(true)}
function worldPt(ev){const r=board.getBoundingClientRect();return{x:(ev.clientX-r.left-view.x)/view.k,y:(ev.clientY-r.top-view.y)/view.k}}
function zoomAt(cx,cy,f){const r=board.getBoundingClientRect(),bx=(cx-r.left-view.x)/view.k,by=(cy-r.top-view.y)/view.k;view.k=Math.min(4,Math.max(.05,view.k*f));view.x=cx-r.left-bx*view.k;view.y=cy-r.top-by*view.k;applyView()}
function zoomBy(f){const r=board.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,f)}
function contentBBox(){
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 state.nodes.forEach(n=>{const d=symDef(n),sc=n.type==="area"?1:(n.sc||1),q=(n.rot||0)%180;const hw=(q?d.h:d.w)/2*sc+40,hh=(q?d.w:d.h)/2*sc+50;x0=Math.min(x0,n.x-hw);x1=Math.max(x1,n.x+hw);y0=Math.min(y0,n.y-hh);y1=Math.max(y1,n.y+hh)});
 state.edges.forEach(e=>{const g=edgeGeom(e);if(g)g.pts.forEach(p=>{x0=Math.min(x0,p.x-20);x1=Math.max(x1,p.x+20);y0=Math.min(y0,p.y-30);y1=Math.max(y1,p.y+30)})});
 state.shapes.forEach(h=>{const b=shapeBox(h);x0=Math.min(x0,b.x0-20);x1=Math.max(x1,b.x1+20);y0=Math.min(y0,b.y0-20);y1=Math.max(y1,b.y1+20)});
 return x0>x1?[0,0,800,600]:[x0,y0,x1,y1];
}
function fitView(){
 const r=board.getBoundingClientRect();if(!r.width||!r.height)return;
 let b;if(state.meta.showSheet){const[W,H]=sheetDim();b=[0,0,W,H]}else b=contentBBox();
 const w=b[2]-b[0],h=b[3]-b[1],k=Math.min((r.width-20)/w,(r.height-20)/h,2);
 view.k=k;view.x=(r.width-w*k)/2-b[0]*k;view.y=(r.height-h*k)/2-b[1]*k;applyView();
}

/* ============ THƯ VIỆN KÝ HIỆU (PALETTE) ============ */
const palVar={},openCats=new Set(["Bình / Tháp","Bơm","Van","Đo & điều khiển (C&I)"]);
function palSvg(k,v){const d=SYMBOLS[k].vars[v||0].def;return`<svg viewBox="${-d.w/2-4} ${-d.h/2-6} ${d.w+8} ${d.h+12}" aria-hidden="true">${k==="text"?`<text x="0" y="5" text-anchor="middle" font-size="16" font-family="Arial" fill="${SCH.ink}">Aa</text>`:k==="area"?`<rect x="${-d.w/2+4}" y="${-d.h/2+4}" width="${d.w-8}" height="${d.h-8}" fill="none" stroke="${SCH.sub3}" stroke-width="2" stroke-dasharray="10 5"/>`:sym(d.body,1)}</svg>`}
function renderPalette(){
 const q=($("search").value||"").toLowerCase().trim(),box=$("palette");box.innerHTML="";const cats={};let total=0;
 Object.entries(SYMBOLS).forEach(([k,s])=>{
  if(q&&!([s.label,T_(s.label),k,s.cat,T_(s.cat),...s.vars.map(v=>v.n),...s.vars.map(v=>T_(v.n))].some(t=>String(t).toLowerCase().includes(q))))return;
  (cats[s.cat]=cats[s.cat]||[]).push([k,s]);total++;
 });
 CAT_ORDER.forEach(cat=>{
  if(!cats[cat])return;
  const det=document.createElement("details");det.open=!!q||openCats.has(cat);
  det.addEventListener("toggle",()=>{if(q)return;det.open?openCats.add(cat):openCats.delete(cat)});
  const sm=document.createElement("summary");sm.textContent=catName(cat)+" ("+cats[cat].length+")";det.appendChild(sm);
  const g=document.createElement("div");g.className="grid";
  cats[cat].forEach(([k,s])=>{
   const d=document.createElement("div");d.className="pal";d.setAttribute("role","button");d.tabIndex=0;d.draggable=true;const lb=T_(s.label);d.title=_("Bấm hoặc kéo để thêm: ","Click or drag to add: ")+lb;d.setAttribute("aria-label",_("Thêm ","Add ")+lb);
   d.innerHTML=`<div class="pv">${palSvg(k,palVar[k])}</div><div>${esc(lb)}</div>`;
   if(s.vars.length>1){
    const se=document.createElement("select");se.setAttribute("aria-label",_("Kiểu vẽ của ","Style of ")+lb);
    se.innerHTML=s.vars.map((v,i)=>`<option value="${i}"${(palVar[k]||0)===i?" selected":""}>${esc(T_(v.n))}</option>`).join("");
    ["click","pointerdown","keydown","mousedown"].forEach(ev=>se.addEventListener(ev,e=>e.stopPropagation()));
    se.draggable=false;
    se.addEventListener("change",()=>{palVar[k]=+se.value;d.querySelector(".pv").innerHTML=palSvg(k,palVar[k])});
    d.appendChild(se);
   }
   d.addEventListener("click",()=>addNode(k));
   d.addEventListener("keydown",ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target===d){ev.preventDefault();addNode(k)}});
   d.addEventListener("dragstart",ev=>{ev.dataTransfer.setData("text/plain","pfd:"+k+":"+(palVar[k]||0));ev.dataTransfer.effectAllowed="copy"});
   g.appendChild(d);
  });
  det.appendChild(g);box.appendChild(det);
 });
 if(!total)box.innerHTML=`<p class="hint">${_("Không tìm thấy thiết bị.","No equipment found.")}</p>`;
}
function nextTag(prefix){
 if(!prefix)return"";const re=new RegExp("^"+prefix+"-(\\d+)");let mx=100;
 state.nodes.forEach(n=>{const m=re.exec(n.tag||"");if(m)mx=Math.max(mx,+m[1])});
 return prefix+"-"+(mx+1);
}
function mkNode(type,x,y,tag,title,props,v){
 const s=SYMBOLS[type];
 const n={id:uid("n"),type,v:Math.min(Math.max(+v||0,0),s.vars.length-1),x,y,rot:0,flip:false,sc:1,lp:"b",tag:tag!==undefined?tag:nextTag(s.prefix),title:title!==undefined?title:(s.bub?"":s.label),props:props||""};
 if(type==="area"){n.w=420;n.h=260;n.title=title!==undefined?title:"Package / Battery limit";n.tag=""}
 if(type==="text"){n.tag="";if(title===undefined)n.title=_("Ghi chú","Note")}
 state.nodes.push(n);return n;
}
function addNode(type,x,y,v){
 let pt;
 if(x===undefined){
  const r=board.getBoundingClientRect();pt={x:(r.width/2-view.x)/view.k,y:(r.height/2-view.y)/view.k};
  for(let t=0;t<14&&state.nodes.some(n=>Math.abs(n.x-sn(pt.x))<24&&Math.abs(n.y-sn(pt.y))<24);t++){pt.x+=30;pt.y+=30}
 }else pt={x,y};
 const n=mkNode(type,sn(pt.x),sn(pt.y),undefined,undefined,undefined,v!==undefined?v:(palVar[type]||0));
 sel=new Set([n.id]);selEdge=null;const lb=T_(SYMBOLS[type].label);commit(_("Thêm ","Add ")+lb+(n.tag?" "+n.tag:""));renderAll();
 setStatus(_(`Đã thêm ${lb}${n.tag?" "+n.tag:""} (${T_(varOf(n).n)}). Kéo để di chuyển, Q để đổi kiểu vẽ.`,`Added ${lb}${n.tag?" "+n.tag:""} (${T_(varOf(n).n)}). Drag to move, Q to change style.`));
}
$("wrap").addEventListener("dragover",e=>e.preventDefault());
$("wrap").addEventListener("drop",ev=>{ev.preventDefault();const t=ev.dataTransfer.getData("text/plain");if(t.startsWith("pfd:")){const pp=t.split(":"),k=pp[1];if(SYMBOLS[k]){const w=worldPt(ev);addNode(k,sn(w.x),sn(w.y),+pp[2]||0)}}});

/* ============ CHỌN, SỬA, XOÁ ============ */
function announceSel(){
 if(sel.size===1){const n=getNode([...sel][0]);if(n)setStatus(_(`Đã chọn: ${n.tag||""} ${n.title||T_(SYMBOLS[n.type].label)}. Mũi tên để dịch chuyển, F2 sửa tag, Delete để xoá.`,`Selected: ${n.tag||""} ${n.title||T_(SYMBOLS[n.type].label)}. Arrow keys to move, F2 to edit tag, Delete to remove.`));
  else{const h=getShape([...sel][0]);if(h)setStatus(_(`Đã chọn hình vẽ: ${T_(SHAPE_T[h.t])}. Kéo để di chuyển, kéo chấm tròn để đổi hình.`,`Selected shape: ${T_(SHAPE_T[h.t])}. Drag to move; drag the handles to reshape.`))}}
 else if(sel.size>1)setStatus(_(`Đã chọn ${sel.size} đối tượng.`,`${sel.size} objects selected.`));
}
function selectEdge(id){selEdge=id;sel=new Set();renderEdges();renderNodes();renderShapes();renderProps();const e=state.edges.find(x=>x.id===id);if(e){const a=getNode(e.from),b=getNode(e.to);setStatus(_(`Đã chọn đường ${e.num?"số "+e.num:""}: ${a?a.tag||a.title:"?"} → ${b?b.tag||b.title:"?"}.`,`Selected line ${e.num?"No. "+e.num:""}: ${a?a.tag||a.title:"?"} → ${b?b.tag||b.title:"?"}.`))}}
function deleteSelected(){
 if(!sel.size&&!selEdge){setStatus(_("Chưa chọn gì để xoá.","Nothing selected to delete."));return}
 if(sel.size){const cnt=sel.size;state.nodes=state.nodes.filter(n=>!sel.has(n.id));state.shapes=state.shapes.filter(h=>!sel.has(h.id));state.edges=state.edges.filter(e=>!sel.has(e.from)&&!sel.has(e.to));setStatus(_(`Đã xoá ${cnt} đối tượng (Ctrl+Z để hoàn tác).`,`Deleted ${cnt} object(s) (Ctrl+Z to undo).`));sel=new Set();commit(_(`Xoá ${cnt} đối tượng`,`Delete ${cnt} object(s)`))}
 if(selEdge){state.edges=state.edges.filter(e=>e.id!==selEdge);selEdge=null;setStatus(_("Đã xoá đường ống (Ctrl+Z để hoàn tác).","Line deleted (Ctrl+Z to undo)."));commit(_("Xoá đường ống","Delete line"))}
 renderAll();
}
function rotateSel(){const a=selNodes(),b=selShapes();if(!a.length&&!b.length)return;a.forEach(n=>n.rot=((n.rot||0)+90)%360);b.forEach(h=>{const bb=shapeBox(h),cx=(bb.x0+bb.x1)/2,cy=(bb.y0+bb.y1)/2;h.pts=h.pts.map(p=>({x:cx-(p.y-cy),y:cy+(p.x-cx)}))});commit(_("Xoay 90°","Rotate 90°"));renderAll()}
function flipSel(){const a=selNodes(),b=selShapes();a.forEach(n=>n.flip=!n.flip);b.forEach(h=>{const bb=shapeBox(h),cx=(bb.x0+bb.x1)/2;h.pts=h.pts.map(p=>({x:2*cx-p.x,y:p.y}))});commit(_("Lật","Flip"));renderAll()}
function retag(c){const m=/^([A-Za-z]+)-\d+/.exec(c.tag||"");return m?nextTag(m[1]):c.tag}
function copySel(){
 if(!sel.size)return;const ids=new Set(sel);
 clip={n:0,nodes:JSON.parse(JSON.stringify(state.nodes.filter(n=>ids.has(n.id)))),shapes:JSON.parse(JSON.stringify(state.shapes.filter(h=>ids.has(h.id)))),edges:JSON.parse(JSON.stringify(state.edges.filter(e=>ids.has(e.from)&&ids.has(e.to))))};
 setStatus(_(`Đã sao chép ${ids.size} đối tượng.`,`Copied ${ids.size} object(s).`));
}
function pasteClip(){
 if(!clip)return;clip.n++;const map={},ids=new Set();
 clip.nodes.forEach(n=>{const c=JSON.parse(JSON.stringify(n)),nid=uid("n");map[n.id]=nid;c.id=nid;c.x+=30*clip.n;c.y+=30*clip.n;c.tag=retag(c);state.nodes.push(c);ids.add(nid)});
 clip.shapes.forEach(h=>{const c=JSON.parse(JSON.stringify(h));c.id=uid("s");c.pts=c.pts.map(p=>({x:p.x+30*clip.n,y:p.y+30*clip.n}));state.shapes.push(c);ids.add(c.id)});
 clip.edges.forEach(e=>{const c=JSON.parse(JSON.stringify(e));c.id=uid("e");c.from=map[e.from];c.to=map[e.to];c.mid=null;if(c.num!=="")c.num=String(state.nextStream++);state.edges.push(c)});
 sel=ids;selEdge=null;commit(_("Dán","Paste"));renderAll();setStatus(_(`Đã dán ${ids.size} đối tượng.`,`Pasted ${ids.size} object(s).`));
}
function dupSel(){copySel();pasteClip()}
function reverseEdge(){const e=state.edges.find(x=>x.id===selEdge);if(!e)return;[e.from,e.to]=[e.to,e.from];[e.fromPort,e.toPort]=[e.toPort,e.fromPort];e.mid=null;e.midAxis=null;commit(_("Đảo chiều ống","Reverse line"));renderAll()}
function resetRoute(){const e=state.edges.find(x=>x.id===selEdge);if(!e)return;e.mid=null;e.midAxis=null;commit(_("Đường đi tự động","Auto route"));renderAll()}
function insertOnEdge(type){
 const e=state.edges.find(x=>x.id===selEdge);if(!e||!SYMBOLS[type])return;const g=edgeGeom(e);if(!g)return;
 let bi=0,bl=-1;for(let i=0;i<g.pts.length-1;i++){const l=Math.hypot(g.pts[i+1].x-g.pts[i].x,g.pts[i+1].y-g.pts[i].y);if(l>bl){bl=l;bi=i}}
 const p=g.pts[bi],q=g.pts[bi+1],horiz=Math.abs(q.y-p.y)<.5,fwd=horiz?q.x>p.x:q.y>p.y,mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
 const n=mkNode(type,mx,my);n.rot=horiz?0:90;
 const inP=fwd?"w":"e",outP=fwd?"e":"w",pi=portRel(n,inP);
 if(horiz){n.x=sn(mx);n.y=my-pi.y}else{n.y=sn(my);n.x=mx-pi.x}
 const e2=JSON.parse(JSON.stringify(e));e2.id=uid("e");e2.from=n.id;e2.fromPort=outP;e2.mid=null;e2.midAxis=null;
 e.to=n.id;e.toPort=inP;e.mid=null;e.midAxis=null;state.edges.push(e2);
 sel=new Set([n.id]);selEdge=null;commit(_("Chèn ","Insert ")+T_(SYMBOLS[type].label));renderAll();setStatus(_(`Đã chèn ${T_(SYMBOLS[type].label)} ${n.tag} lên đường ống.`,`Inserted ${T_(SYMBOLS[type].label)} ${n.tag} on the line.`));
}
function inferKind(A,fp,B,tp){
 const pa=symDef(A).ports.find(p=>p.id===fp),pb=symDef(B).ports.find(p=>p.id===tp);
 if(SYMBOLS[A.type].bub||SYMBOLS[B.type].bub)return"signal";
 if((pa&&pa.l==="SHAFT")||(pb&&pb.l==="SHAFT"))return"shaft";
 const tk={truck:"road",rail:"rail",ship:"sea"};
 return tk[A.type]||tk[B.type]||"process";
}
function newEdge(from,fp,to,tp,kind){
 const sig=kind==="signal"||kind==="shaft";
 return{id:uid("e"),from,fromPort:fp,to,toPort:tp,kind,phase:"",num:sig?"":String(state.nextStream++),service:"",size:"",std:"",nps:"",sch:"",wall:"",od:"",mat:"",matOther:"",cls:"",dist:"",P:"",T:"",flow:"",mid:null,midAxis:null,wt:1};
}
function makeEdge(from,fp,to,tp){
 if(from===to)return;
 if(state.edges.some(e=>e.from===from&&e.fromPort===fp&&e.to===to&&e.toPort===tp)){setStatus(_("Hai cổng này đã được nối.","These two ports are already connected."));return}
 const A=getNode(from),B=getNode(to),e=newEdge(from,fp,to,tp,inferKind(A,fp,B,tp));
 state.edges.push(e);selEdge=e.id;sel=new Set();commit(_("Nối ống","Connect"));renderAll();
 setStatus(_("Đã nối. Điền số dòng, dịch vụ, size / schedule, vật liệu ở bảng Thuộc tính bên phải.","Connected. Fill in line no., service, size / schedule and material in the Properties panel."));
}

/* ============ CÔNG CỤ ============ */
const TOOL_HINT={
 select:["Chế độ chọn / kéo.","Select / drag mode."],connect:["Nối ống: kéo từ chấm xanh nguồn sang chấm đích, hoặc bấm chấm nguồn rồi chấm đích.","Connect: drag from a source dot to a target dot, or click source then target."],
 text:["Bấm lên bản vẽ để thêm khung chữ.","Click on the drawing to add a text box."],pan:["Kéo để di chuyển khung nhìn.","Drag to pan the view."],
 port:["Thêm điểm nối: bấm vào thiết bị tại vị trí cần thêm cổng nối ống (Esc để thoát).","Add port: click on a device where a new pipe connection is needed (Esc to exit)."],
 line:["Vẽ đường thẳng: kéo từ điểm đầu đến điểm cuối.","Line: drag from start to end."],arrow:["Vẽ mũi tên: kéo từ gốc đến đầu mũi tên.","Arrow: drag from tail to head."],
 rect:["Vẽ hình chữ nhật: kéo chéo góc.","Rectangle: drag diagonally."],ellipse:["Vẽ hình tròn / elip: kéo chéo khung bao.","Ellipse: drag the bounding box."],
 poly:["Đa tuyến: bấm từng điểm; bấm đúp hoặc Enter để kết thúc; bấm lại điểm đầu để khép kín.","Polyline: click points; double-click or Enter to finish; click the first point to close."],
 pen:["Bút tự do: giữ chuột và vẽ.","Freehand pen: press and draw."]};
function setTool(t){
 tool=t;polyDraft=null;gDraft.innerHTML="";
 if(conn){conn=null;hideTemp()}
 board.classList.toggle("connecting",t==="connect");
 board.style.cursor=t==="pan"?"grab":t==="text"?"text":(t==="connect"||t==="port"||SHAPE_TOOLS.includes(t))?"crosshair":"default";
 updateToolUI();renderProps();setStatus(_(...(TOOL_HINT[t]||TOOL_HINT.select)));
}
function updateToolUI(){document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b.dataset.tool===tool));const bp=$("btnPorts");if(bp)bp.classList.toggle("active",SHOWPORTS);board.classList.toggle("showports",SHOWPORTS)}
function hideTemp(){$("tempEdge").setAttribute("display","none");board.classList.toggle("connecting",tool==="connect")}
function showTemp(ev){
 if(!conn)return;const n=getNode(conn.node);if(!n)return;const a=portPos(n,conn.port),w=worldPt(ev);
 const t=$("tempEdge");t.setAttribute("display","inline");t.setAttribute("d",`M ${a.x} ${a.y} L ${w.x} ${w.y}`);
}
/* kiểu nét vẽ mặc định */
const penStyle={col:"#17202a",sw:2,dash:"",fill:"",fo:.25,ah:0};
let polyDraft=null;
function mkShape(t,pts){
 const ps=penStyle,h={id:uid("s"),t,pts,col:ps.col,sw:ps.sw,dash:ps.dash,fill:ps.fill,fo:ps.fo,ah:t==="arrow"?(ps.ah||1):(t==="line"||t==="poly"||t==="pen"?ps.ah:0),closed:t==="rect"||t==="ellipse",rx:0,z:"f"};
 return h;
}
function finishShape(h,label){
 state.shapes.push(h);sel=new Set([h.id]);selEdge=null;commit(label||(_("Vẽ ","Draw ")+T_(SHAPE_T[h.t])));gDraft.innerHTML="";
 if(!STICKY)setTool("select");else{renderAll()}
 renderAll();announceSel();
}
function draftShow(h){gDraft.innerHTML=shapeMarkup(Object.assign({},h,{id:"draft"}),false)}
function polyFinish(close){
 const d=polyDraft;polyDraft=null;gDraft.innerHTML="";if(!d)return;
 let pts=d.pts.slice();if(pts.length<2){setStatus(_("Cần ít nhất 2 điểm.","At least 2 points are needed."));return}
 const h=mkShape("poly",pts);h.closed=!!close&&pts.length>=3;finishShape(h);
}

/* ============ TƯƠNG TÁC CON TRỎ ============ */
board.addEventListener("pointerdown",ev=>{
 if(ev.button===2){if(polyDraft){polyFinish(false);ev.preventDefault()}return}
 const t=ev.target,cl=s=>t.closest?t.closest(s):null;
 if(ev.button===1||spaceDown||tool==="pan"){ptr={type:"pan",x:ev.clientX,y:ev.clientY,vx:view.x,vy:view.y};board.style.cursor="grabbing";ev.preventDefault();return}
 const portEl=cl("[data-port]"),handleEl=cl("[data-handle]"),shhEl=cl("[data-pi]"),nodeEl=cl(".node"),edgeEl=cl("[data-edge]"),shapeEl=cl("[data-shape]");
 if(SHAPE_TOOLS.includes(tool)){startDraw(ev);return}
 if(tool==="port"){
  if(nodeEl){const n=getNode(nodeEl.dataset.id);if(n&&!["text","area"].includes(n.type)){const pf=portFromPoint(n,worldPt(ev)),p=addPortTo(n,pf.s,pf.f);sel=new Set([n.id]);selEdge=null;commit(_("Thêm điểm nối ","Add port ")+(n.tag||""));renderAll();setStatus(_(`Đã thêm điểm nối ${p.id} cho ${n.tag||n.title}. Đặt tên / chỉnh vị trí ở bảng Thuộc tính.`,`Added port ${p.id} to ${n.tag||n.title}. Name / adjust it in the Properties panel.`))}}
  return;
 }
 if(portEl){
  if(ev.altKey&&portEl.dataset.xp){ptr={type:"pmove",node:portEl.dataset.node,port:portEl.dataset.port,moved:false};return}
  startConn(ev,portEl.dataset.node,portEl.dataset.port);return;
 }
 if(handleEl){const e=state.edges.find(x=>x.id===handleEl.dataset.handle),g=e&&edgeGeom(e);if(g&&g.axis){ptr={type:"handle",id:e.id,axis:g.axis,moved:false}}return}
 if(shhEl&&shhEl.dataset.sh){ptr={type:"shh",id:shhEl.dataset.sh,pi:shhEl.dataset.pi,moved:false};return}
 if(nodeEl){objDown(ev,nodeEl.dataset.id);return}
 if(shapeEl){objDown(ev,shapeEl.dataset.shape);return}
 if(edgeEl){selectEdge(edgeEl.dataset.edge);return}
 if(tool==="text"){const w=worldPt(ev),n=mkNode("text",sn(w.x),sn(w.y));sel=new Set([n.id]);selEdge=null;commit(_("Thêm khung chữ","Add text box"));renderAll();setTool("select");setStatus(_("Đã thêm khung chữ — sửa nội dung, font, cỡ chữ ở bảng Thuộc tính.","Text box added — edit content, font and size in the Properties panel."));focusField("pTitle");return}
 if(conn&&conn.armed){conn=null;hideTemp();setStatus(_("Đã huỷ nối ống.","Connection cancelled."))}
 const w=worldPt(ev);
 if(!ev.shiftKey){sel=new Set();selEdge=null;renderNodes();renderEdges();renderShapes();renderProps()}
 ptr={type:"marquee",x0:w.x,y0:w.y,add:ev.shiftKey,base:new Set(sel),moved:false};
});
function objDown(ev,id){
 if(conn&&conn.armed){
  const n=getNode(id);
  if(n&&conn.node!==id){makeEdge(conn.node,conn.port,id,nearestPort(n,worldPt(ev)))}
  conn=null;hideTemp();return;
 }
 const now=Date.now(),node=getNode(id);
 if(node&&lastDown.id===id&&now-lastDown.t<380){lastDown={id:null,t:0};focusField(node.type==="text"?"pTitle":"pTag");return}
 lastDown={id,t:now};
 let changed=false;
 if(ev.shiftKey){if(sel.has(id))sel.delete(id);else sel.add(id);changed=true}
 else if(!sel.has(id)||selEdge){sel=new Set([id]);changed=true}
 if(selEdge){selEdge=null;changed=true}
 const w=worldPt(ev);
 ptr={type:"drag",w0:w,starts:[...sel].map(i=>{const n=getNode(i);if(n)return{id:i,x:n.x,y:n.y};const h=getShape(i);return h?{id:i,pts:h.pts.map(p=>({...p}))}:null}).filter(Boolean),moved:false};
 if(changed){renderNodes();renderEdges();renderShapes();renderProps();announceSel()}
}
function startConn(ev,nid,pid){
 if(conn&&conn.armed){if(conn.node!==nid)makeEdge(conn.node,conn.port,nid,pid);conn=null;hideTemp();return}
 conn={node:nid,port:pid,armed:false,dragging:true,x0:ev.clientX,y0:ev.clientY};
 board.classList.add("connecting");showTemp(ev);
}
function finishConn(ev){
 const c=conn;c.dragging=false;
 if(Math.hypot(ev.clientX-c.x0,ev.clientY-c.y0)<6){c.armed=true;setStatus(_("Đã chọn cổng nguồn — bấm cổng hoặc thiết bị đích. Esc để huỷ.","Source port selected — click the target port or device. Esc to cancel."));return}
 const t=document.elementFromPoint(ev.clientX,ev.clientY);let target=null;
 const pe=t&&t.closest?t.closest("[data-port]"):null,ne=t&&t.closest?t.closest(".node"):null;
 if(pe&&pe.dataset.node!==c.node)target={node:pe.dataset.node,port:pe.dataset.port};
 else if(ne&&ne.dataset.id!==c.node){const nn=getNode(ne.dataset.id);if(nn)target={node:nn.id,port:nearestPort(nn,worldPt(ev))}}
 conn=null;hideTemp();
 if(target&&target.port)makeEdge(c.node,c.port,target.node,target.port);else setStatus(_("Chưa nối: hãy thả vào một cổng hoặc thân thiết bị đích.","Not connected: drop on a port or on the target device body."));
}
/* --- vẽ hình --- */
function startDraw(ev){
 const w=worldPt(ev),p={x:sn(w.x),y:sn(w.y)};
 if(tool==="poly"){
  const now=Date.now();
  if(!polyDraft)polyDraft={pts:[p],cur:p,t:now};
  else{
   const f=polyDraft.pts[0],near=Math.hypot(f.x-w.x,f.y-w.y)*view.k<12;
   if(polyDraft.pts.length>=3&&near){polyFinish(true);return}
   const l=polyDraft.pts[polyDraft.pts.length-1];
   if(now-polyDraft.t<350&&Math.hypot(l.x-p.x,l.y-p.y)*view.k<8){polyFinish(false);return}
   polyDraft.pts.push(p);polyDraft.t=now;
  }
  draftShow(mkShape("poly",[...polyDraft.pts,polyDraft.cur]));return;
 }
 if(tool==="pen"){ptr={type:"pen",pts:[{x:w.x,y:w.y}]};draftShow(mkShape("pen",[{x:w.x,y:w.y},{x:w.x+.01,y:w.y+.01}]));return}
 ptr={type:"sdraw",t:tool,p0:p,p1:p,moved:false};
}
window.addEventListener("pointermove",ev=>{
 if(conn&&(conn.dragging||conn.armed))showTemp(ev);
 if(tool==="poly"&&polyDraft){const w=worldPt(ev);polyDraft.cur={x:sn(w.x),y:sn(w.y)};draftShow(mkShape("poly",[...polyDraft.pts,polyDraft.cur]))}
 if(!ptr)return;
 if(ptr.type==="pan"){view.x=ptr.vx+ev.clientX-ptr.x;view.y=ptr.vy+ev.clientY-ptr.y;applyView()}
 else if(ptr.type==="drag"){
  const w=worldPt(ev);let dx=w.x-ptr.w0.x,dy=w.y-ptr.w0.y;
  if(!ptr.moved&&Math.hypot(dx,dy)*view.k<3)return;
  ptr.moved=true;if(state.meta.snap){dx=Math.round(dx/10)*10;dy=Math.round(dy/10)*10}
  let sh=false;
  ptr.starts.forEach(s=>{
   if(s.pts){const h=getShape(s.id);if(h){h.pts=s.pts.map(p=>({x:p.x+dx,y:p.y+dy}));sh=true}return}
   const n=getNode(s.id);if(!n)return;n.x=s.x+dx;n.y=s.y+dy;const el=gNodes.querySelector(`[data-id="${s.id}"]`);if(el)el.setAttribute("transform",`translate(${n.x},${n.y})`);
  });
  if(sh)renderShapes();renderEdges();
 }else if(ptr.type==="marquee"){
  const w=worldPt(ev),m=$("marq");ptr.moved=true;ptr.x1=w.x;ptr.y1=w.y;
  m.setAttribute("display","inline");m.setAttribute("x",Math.min(ptr.x0,w.x));m.setAttribute("y",Math.min(ptr.y0,w.y));m.setAttribute("width",Math.abs(w.x-ptr.x0));m.setAttribute("height",Math.abs(w.y-ptr.y0));
 }else if(ptr.type==="handle"){
  const e=state.edges.find(x=>x.id===ptr.id);if(!e)return;const w=worldPt(ev);
  e.mid=sn(ptr.axis==="x"?w.x:w.y);e.midAxis=ptr.axis;ptr.moved=true;renderEdges();
 }else if(ptr.type==="sdraw"){
  const w=worldPt(ev);ptr.p1={x:sn(w.x),y:sn(w.y)};
  if(ev.shiftKey&&(ptr.t==="line"||ptr.t==="arrow")){const dx=ptr.p1.x-ptr.p0.x,dy=ptr.p1.y-ptr.p0.y;if(Math.abs(dx)>Math.abs(dy)*2)ptr.p1.y=ptr.p0.y;else if(Math.abs(dy)>Math.abs(dx)*2)ptr.p1.x=ptr.p0.x;else{const m=Math.max(Math.abs(dx),Math.abs(dy));ptr.p1={x:ptr.p0.x+Math.sign(dx)*m,y:ptr.p0.y+Math.sign(dy)*m}}}
  else if(ev.shiftKey&&(ptr.t==="rect"||ptr.t==="ellipse")){const dx=ptr.p1.x-ptr.p0.x,dy=ptr.p1.y-ptr.p0.y,m=Math.max(Math.abs(dx),Math.abs(dy));ptr.p1={x:ptr.p0.x+Math.sign(dx||1)*m,y:ptr.p0.y+Math.sign(dy||1)*m}}
  ptr.moved=true;draftShow(mkShape(ptr.t,[ptr.p0,ptr.p1]));
 }else if(ptr.type==="pen"){
  const w=worldPt(ev),l=ptr.pts[ptr.pts.length-1];
  if(Math.hypot(w.x-l.x,w.y-l.y)*view.k>2.5){ptr.pts.push({x:w.x,y:w.y});draftShow(mkShape("pen",ptr.pts.length>1?ptr.pts:[...ptr.pts,{x:w.x+.01,y:w.y}]))}
 }else if(ptr.type==="shh"){
  const h=getShape(ptr.id);if(!h)return;const w=worldPt(ev),p={x:sn(w.x),y:sn(w.y)};ptr.moved=true;
  if(/^c/.test(ptr.pi)){const b=shapeBox(h),cs=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]],i=+ptr.pi[1],o=cs[(i+2)%4];if(!ptr.fix)ptr.fix={x:o[0],y:o[1]};h.pts=[{...ptr.fix},p]}
  else h.pts[+ptr.pi]=p;
  renderShapes();
 }else if(ptr.type==="pmove"){
  const n=getNode(ptr.node);if(!n)return;const pp=(n.xp||[]).find(q=>q.id===ptr.port);if(!pp)return;const pf=portFromPoint(n,worldPt(ev));pp.s=pf.s;pp.f=pf.f;ptr.moved=true;renderCanvasOnly();
 }
});
function pointerEnd(ev){
 if(ptr){
  const p=ptr;ptr=null;board.style.cursor=tool==="pan"?"grab":(tool==="connect"||tool==="port"||SHAPE_TOOLS.includes(tool))?"crosshair":"default";
  if(p.type==="drag"&&p.moved){commit(_("Di chuyển","Move"));renderProps()}
  else if(p.type==="handle"&&p.moved)commit(_("Dời đoạn ống","Move pipe segment"));
  else if(p.type==="shh"&&p.moved){commit(_("Chỉnh hình vẽ","Reshape"));renderProps()}
  else if(p.type==="pmove"&&p.moved){commit(_("Di chuyển điểm nối","Move port"));renderProps()}
  else if(p.type==="sdraw"){
   gDraft.innerHTML="";
   if(p.moved&&Math.hypot(p.p1.x-p.p0.x,p.p1.y-p.p0.y)>3)finishShape(mkShape(p.t,[p.p0,p.p1]));
  }else if(p.type==="pen"){
   gDraft.innerHTML="";
   const eps=Math.max(.7,1.6/view.k);let pts=rdp(p.pts,eps);
   if(pts.length>=2&&Math.hypot(pts[pts.length-1].x-pts[0].x,pts[pts.length-1].y-pts[0].y)+p.pts.length>3)finishShape(mkShape("pen",pts));
  }else if(p.type==="marquee"){
   $("marq").setAttribute("display","none");
   if(p.moved){
    const x0=Math.min(p.x0,p.x1),x1=Math.max(p.x0,p.x1),y0=Math.min(p.y0,p.y1),y1=Math.max(p.y0,p.y1);
    const ns=new Set(p.base);state.nodes.forEach(n=>{if(n.type!=="area"&&n.x>=x0&&n.x<=x1&&n.y>=y0&&n.y<=y1)ns.add(n.id)});
    state.shapes.forEach(h=>{const b=shapeBox(h);if(b.x0>=x0&&b.x1<=x1&&b.y0>=y0&&b.y1<=y1)ns.add(h.id)});
    sel=ns;renderNodes();renderShapes();renderProps();announceSel();
   }
  }
 }
 if(conn&&conn.dragging)finishConn(ev);
}
window.addEventListener("pointerup",pointerEnd);
window.addEventListener("pointercancel",()=>{ptr=null;if(conn&&conn.dragging){conn=null;hideTemp()}$("marq").setAttribute("display","none");gDraft.innerHTML=""});
board.addEventListener("wheel",ev=>{ev.preventDefault();if(ev.shiftKey){view.x-=ev.deltaY;applyView();return}zoomAt(ev.clientX,ev.clientY,ev.deltaY<0?1.1:0.91)},{passive:false});
board.addEventListener("contextmenu",e=>e.preventDefault());
function focusField(id){setTimeout(()=>{const e=$(id);if(e){e.focus();if(e.select)e.select()}},30)}

/* ============ BÀN PHÍM ============ */
window.addEventListener("keydown",ev=>{
 const ae=document.activeElement,tg=ae?ae.tagName:"",typing=tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT";
 const mod=ev.ctrlKey||ev.metaKey,k=ev.key.toLowerCase();
 if(ev.key==="Escape"){
  if(polyDraft){polyFinish(false);return}
  closeModals();if(conn){conn=null;hideTemp()}ptr=null;$("marq").setAttribute("display","none");gDraft.innerHTML="";
  if(tool!=="select")setTool("select");return;
 }
 if(ev.key==="Enter"&&polyDraft&&!typing){polyFinish(false);return}
 if(mod&&k==="s"){ev.preventDefault();saveJSON();return}
 if(mod&&k==="p"){ev.preventDefault();openPrint();return}
 if(typing)return;
 if(ev.code==="Space"&&tg!=="BUTTON"){spaceDown=true;ev.preventDefault();return}
 if(document.querySelector(".modal.open"))return;
 if(ev.key==="Delete"||ev.key==="Backspace"){ev.preventDefault();deleteSelected();return}
 if(mod&&k==="z"){ev.preventDefault();ev.shiftKey?redo():undo();return}
 if(mod&&k==="y"){ev.preventDefault();redo();return}
 if(mod&&k==="a"){ev.preventDefault();sel=new Set([...state.nodes.map(n=>n.id),...state.shapes.map(h=>h.id)]);selEdge=null;renderNodes();renderEdges();renderShapes();renderProps();announceSel();return}
 if(mod&&k==="c"){copySel();return}
 if(mod&&k==="x"){copySel();deleteSelected();return}
 if(mod&&k==="v"){pasteClip();return}
 if(mod&&k==="d"){ev.preventDefault();dupSel();return}
 if(mod&&k==="0"){ev.preventDefault();fitView();return}
 if(mod)return;
 if(ev.key==="F2"){ev.preventDefault();const n=sel.size===1?getNode([...sel][0]):null;if(n)focusField(n.type==="text"?"pTitle":"pTag");return}
 const TK={v:"select",c:"connect",t:"text",h:"pan",p:"port",l:"line",a:"arrow",b:"rect",o:"ellipse",y:"poly",d:"pen"};
 if(TK[k]&&!ev.altKey){setTool(TK[k]);return}
 if(k==="r"&&sel.size)rotateSel();else if(k==="f"&&sel.size)flipSel();else if(k==="q"&&sel.size)cycleVariant();
 else if(k==="+"||k==="=")zoomBy(1.2);else if(k==="-")zoomBy(0.83);else if(ev.key==="?"){toggleHelp(true)}
 else if(k.startsWith("arrow")&&sel.size){
  ev.preventDefault();const st=ev.shiftKey?50:10,dx=k==="arrowleft"?-st:k==="arrowright"?st:0,dy=k==="arrowup"?-st:k==="arrowdown"?st:0;
  selNodes().forEach(n=>{n.x+=dx;n.y+=dy});selShapes().forEach(h=>h.pts.forEach(p=>{p.x+=dx;p.y+=dy}));renderNodes();renderEdges();renderShapes();renderProps();commitSoon(_("Dịch chuyển bằng phím","Nudge"));
 }
});
window.addEventListener("keyup",ev=>{if(ev.code==="Space")spaceDown=false});

/* ============ BẢNG THUỘC TÍNH ============ */
function bindIn(id,fn,label){const e=$(id);if(!e)return;e.addEventListener("input",()=>{fn(e.value);renderCanvasOnly()});e.addEventListener("change",()=>{if(label)pendLabel=label;commit()})}
function bindChk(id,fn,label,full){const e=$(id);if(!e)return;e.addEventListener("change",()=>{fn(e.checked);commit(label);full?renderAll():renderCanvasOnly()})}
function bindSel(id,fn,label,full){const e=$(id);if(!e)return;e.addEventListener("change",()=>{fn(e.value);commit(label);full?renderAll():renderCanvasOnly()})}
const optList=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(cur)===String(v)?" selected":""}>${esc(l)}</option>`).join("");
const fontOpts=(cur,withDefault)=>(withDefault?`<option value=""${!cur?" selected":""}>${_("— theo cài đặt chung —","— global setting —")}</option>`:"")+FONT_LIST.map(f=>`<option value="${esc(f[0])}"${cur===f[0]?" selected":""} style="font-family:${esc(f[1])}">${esc(T_(f[0]))}</option>`).join("");
const PARAM_QUICK=["Áp suất thiết kế","Nhiệt độ thiết kế","Áp suất vận hành","Nhiệt độ vận hành","Công suất","Lưu lượng","Thể tích","Đường kính × chiều cao","Vật liệu","Diện tích truyền nhiệt","Cột áp","Tốc độ quay","Điện áp","Tỷ số nén","Khối lượng"];
function unitSel(id,txt,fam){
 const cur=unitOfText(txt),opts=UNIT_OPTS[fam].slice();if(cur&&!opts.includes(cur))opts.unshift(cur);
 return`<select id="${id}" class="usel" aria-label="${_("Đổi đơn vị","Change unit")}"><option value=""${cur?"":" selected"}>${cur?"":_("đơn vị","unit")}</option>`+opts.map(u=>`<option value="${esc(u)}"${u===cur?" selected":""}>${esc(u)}</option>`).join("")+"</select>";
}
function defaultWall(z){
 if(!z||!z.walls.length)return"";const has=(k)=>z.walls.find(w=>w.k===k||(w.a||[]).includes(k));
 const w=has("STD")||has("40")||has("40S")||has("Type L")||has("SDR 17")||z.walls[Math.floor(z.walls.length/2)];return w.k;
}
function renderProps(){
 const box=$("props");
 const nSel=selNodes(),hSel=selShapes();
 if(sel.size>1){
  const hasN=nSel.length>1;
  box.innerHTML=`<h3 class="ph">${_(`Đã chọn ${sel.size} đối tượng`,`${sel.size} objects selected`)}</h3>
  ${hasN?`<div class="hint">${_("Căn thẳng hàng (chỉ đổi 1 toạ độ, giữ nguyên toạ độ còn lại):","Align (changes only one coordinate, keeps the other):")}</div>
  <div class="grid2"><button class="btn" onclick="alignSel('left')" title="${_("Cạnh trái cùng X","Left edges to same X")}">⇤ ${_("Căn trái","Align left")}</button><button class="btn" onclick="alignSel('right')">${_("Căn phải","Align right")} ⇥</button><button class="btn" onclick="alignSel('center')" title="${_("Tất cả cùng X (xếp thành 1 cột dọc)","All same X (stack in a column)")}">↔ ${_("Cùng X (cột dọc)","Same X (column)")}</button><button class="btn" onclick="alignSel('top')">⤒ ${_("Căn trên","Align top")}</button><button class="btn" onclick="alignSel('bottom')">⤓ ${_("Căn dưới","Align bottom")}</button><button class="btn" onclick="alignSel('middle')" title="${_("Tất cả cùng Y (xếp thành 1 hàng ngang)","All same Y (line up in a row)")}">↕ ${_("Cùng Y (hàng ngang)","Same Y (row)")}</button><button class="btn" onclick="alignSel('dh')" title="${_("Giãn đều khoảng hở giữa các thiết bị theo chiều ngang","Equal gaps horizontally")}">⇔ ${_("Chia đều ngang","Distribute H")}</button><button class="btn" onclick="alignSel('dv')">⇕ ${_("Chia đều dọc","Distribute V")}</button></div>`:""}
  ${layoutButtons()}
  <div class="grid2"><button class="btn primary" onclick="fitToSheet()">⤢ ${_("Vừa khổ giấy","Fit to sheet")}</button><button class="btn" onclick="cycleVariant()">🔁 ${_("Đổi kiểu vẽ","Change style")}</button><button class="btn" onclick="scaleSel(1.1)">＋10%</button><button class="btn" onclick="scaleSel(0.9)">－10%</button></div>
  <div class="grid2"><button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div>
  <p class="hint">${_("Mẹo: nếu thiết bị bị dồn vào nhau, bấm “Tránh chồng lấn” hoặc “Giãn khoảng cách”. Ctrl+Z hoàn tác bất kỳ bước nào.","Tip: if devices collapse together, press “Remove overlaps” or “Spread”. Ctrl+Z undoes any step.")}</p>`;
  const ov=overlapPairs(nSel);
  if(ov)box.insertAdjacentHTML("afterbegin",`<div class="warnbox">⚠ ${_(`${ov} cặp thiết bị đang chồng lên nhau. Bấm “Tránh chồng lấn”.`,`${ov} pair(s) of devices overlap. Press “Remove overlaps”.`)}</div>`);
  return;
 }
 if(hSel.length===1){renderShapeProps(hSel[0]);return}
 if(nSel.length===1){renderNodeProps(nSel[0]);return}
 const e=state.edges.find(x=>x.id===selEdge);
 if(e){renderEdgeProps(e);return}
 if(SHAPE_TOOLS.includes(tool)){renderPenProps();return}
 box.innerHTML=`<p class="hint">${_("Chưa chọn đối tượng nào.","Nothing selected.")}<br><br>• ${_("Bấm thiết bị ở thư viện để thêm","Click equipment in the library to add it")}<br>• ${_("Kéo chấm xanh để nối ống","Drag the blue dots to connect pipes")}<br>• ${_("Phím P: thêm điểm nối ống tuỳ ý cho thiết bị","Key P: add custom pipe connection points to a device")}<br>• ${_("Phím L / A / B / O / Y / D: vẽ đường, mũi tên, hộp, elip, đa tuyến, bút tự do","Keys L / A / B / O / Y / D: line, arrow, box, ellipse, polyline, freehand pen")}<br>• ${_("Kéo khung trên nền trống để chọn nhiều","Drag on empty background to select many")}<br>• ${_("Bấm đường ống để sửa dòng, size, schedule, vật liệu","Click a line to edit stream, size, schedule, material")}<br>• ${_("Nút ? Hướng dẫn có đủ phím tắt","The ? Help button lists all shortcuts")}</p>${layoutButtons(true)}`;
}
function layoutButtons(all){
 return`<div class="hint" style="margin-top:.5rem">${all?_("Bố trí cho toàn bản vẽ:","Layout for the whole drawing:"):_("Bố trí (áp dụng cho phần đang chọn):","Layout (applies to the selection):")}</div>
 <div class="grid2"><button class="btn" onclick="autoLayout()" title="${_("Sắp xếp tự động từ trái sang phải theo dòng chảy","Auto-arrange left to right following the flow")}">🧭 ${_("Tự bố trí theo dòng","Auto layout")}</button><button class="btn" onclick="deOverlap()" title="${_("Đẩy các thiết bị đang chồng lên nhau ra xa","Push overlapping devices apart")}">🧲 ${_("Tránh chồng lấn","Remove overlaps")}</button><button class="btn" onclick="spreadSel(1.2)" title="${_("Tăng khoảng cách giữa các thiết bị, giữ cỡ ký hiệu","Increase spacing, keep symbol size")}">↔ ${_("Giãn khoảng cách","Spread")} +20%</button><button class="btn" onclick="spreadSel(0.85)">⇥⇤ ${_("Co khoảng cách","Tighten")} −15%</button><button class="btn" onclick="centerOnPage()">⊕ ${_("Đặt giữa trang","Center on page")}</button><button class="btn" onclick="openHist()">🕘 ${_("Lịch sử thao tác","History")}</button></div>`;
}

/* --- thiết bị --- */
function renderNodeProps(n){
 const box=$("props"),T=n.type,isText=T==="text",isArea=T==="area",sy=SYMBOLS[T];
 let h=`<h3 class="ph">${esc(T_(sy.label))}</h3>`;
 if(!isText&&!isArea)h+=`<label for="pTag">${_("Tag (số hiệu) — F2","Tag (number) — F2")}</label><input id="pTag" value="${esc(n.tag)}">`;
 h+=isText?`<label for="pTitle">${_("Nội dung chữ (xuống dòng được)","Text (line breaks allowed)")}</label><textarea id="pTitle" rows="4">${esc(n.title)}</textarea>`:`<label for="pTitle">${_("Tên / Mô tả","Name / description")}</label><input id="pTitle" value="${esc(n.title)}">`;
 if(!isText&&!isArea&&sy.vars.length>1)h+=`<label for="pVar">${_("Kiểu vẽ (phím Q để đổi nhanh)","Drawing style (Q to cycle)")}</label><select id="pVar">${sy.vars.map((v,i)=>`<option value="${i}"${(n.v||0)===i?" selected":""}>${esc(T_(v.n))}</option>`).join("")}</select>`;
 if(isText){
  const st=textStyle(n),b=fontCfg("note");
  h+=`<div class="sect">${_("Định dạng chữ","Text format")}</div>
  <label for="pFF">${_("Font chữ","Font family")}</label><select id="pFF">${fontOpts(n.ff||"",true)}</select>
  <div class="row"><div><label for="pFZ">${_("Cỡ chữ (pt)","Size (pt)")}</label><input id="pFZ" type="number" min="3" max="80" step="0.5" value="${n.fz||""}" placeholder="${b.s}"></div><div><label for="pAl">${_("Căn lề","Align")}</label><select id="pAl">${optList([["l",_("Trái","Left")],["c",_("Giữa","Center")],["r",_("Phải","Right")]],n.al||"c")}</select></div></div>
  <div class="row"><label class="chk"><input type="checkbox" id="pB"${n.b!==false?" checked":""}>${_("Đậm","Bold")}</label><label class="chk"><input type="checkbox" id="pI"${n.i?" checked":""}>${_("Nghiêng","Italic")}</label><label class="chk"><input type="checkbox" id="pBd"${n.bd?" checked":""}>${_("Viền","Border")}</label></div>
  <div class="row"><div><label for="pCol">${_("Màu chữ","Text colour")}</label><input id="pCol" type="color" value="${esc(n.col||INK)}"></div><div><label for="pBg">${_("Màu nền","Background")}</label><input id="pBg" type="color" value="${esc(n.bg||"#ffffff")}"></div></div>
  <div class="row"><label class="chk"><input type="checkbox" id="pBgOn"${n.bg?" checked":""}>${_("Tô nền","Fill background")}</label><button class="btn" id="pColReset" style="flex:0 0 auto">${_("Màu chữ mặc định","Default text colour")}</button></div>`;
 }
 if(!isText&&!isArea&&!sy.nolabel){
  h+=`<div class="row"><div><label for="pLp">${_("Vị trí nhãn","Label position")}</label><select id="pLp">${optList([["b",_("Phía dưới","Below")],["t",_("Phía trên","Above")],["r",_("Bên phải","Right")],["l",_("Bên trái","Left")]],n.lp||"b")}</select></div><div><label for="pLs">${_("Cỡ nhãn","Label size")}: <span id="pLsV">${(n.ls||1).toFixed(1)}×</span></label><input id="pLs" type="range" min="0.5" max="3" step="0.1" value="${n.ls||1}"></div></div>`;
 }
 if(!isText&&!isArea){
  h+=`<label for="pProps">${_("Thông số thiết bị (mỗi dòng một thông số)","Equipment parameters (one per line)")}</label><textarea id="pProps" rows="4" placeholder="${_("VD: Áp suất thiết kế: 100 barg\nCông suất: 2.5 MW","e.g. Design pressure: 100 barg\nPower: 2.5 MW")}">${esc(n.props)}</textarea>
  <div class="row"><select id="pQuick" aria-label="${_("Thêm nhanh tên thông số","Quick-add parameter name")}"><option value="">${_("＋ Thêm nhanh tên thông số…","＋ Quick-add parameter name…")}</option>${PARAM_QUICK.map(p=>`<option value="${esc(p)}">${esc(T_(p))}</option>`).join("")}</select></div>`;
 }
 if(isArea)h+=`<div class="row"><div><label for="pW">${_("Rộng","Width")}</label><input id="pW" type="number" min="60" step="10" value="${n.w||420}"></div><div><label for="pH">${_("Cao","Height")}</label><input id="pH" type="number" min="60" step="10" value="${n.h||260}"></div></div>`;
 if(!isArea)h+=`<label for="pSc">${_("Kích thước ký hiệu","Symbol size")}: <span id="pScV">${(n.sc||1).toFixed(1)}×</span></label><input id="pSc" type="range" min="0.5" max="3" step="0.1" value="${n.sc||1}">`;
 if(!isText&&!isArea){
  const nb=symDef(n).ports.length-(n.xp||[]).length;
  h+=`<div class="sect">${_("Điểm nối ống","Pipe connection points")} <span class="hint">(${_(`có sẵn ${nb}`,`${nb} built-in`)}${(n.xp||[]).length?_(`, thêm ${n.xp.length}`,`, +${n.xp.length} custom`):""})</span></div>
  <div class="grid2"><button class="btn" data-addport="n">＋ ${_("Trên","Top")}</button><button class="btn" data-addport="s">＋ ${_("Dưới","Bottom")}</button><button class="btn" data-addport="w">＋ ${_("Trái","Left")}</button><button class="btn" data-addport="e">＋ ${_("Phải","Right")}</button></div>
  <div class="hint">${_("Hoặc bấm phím P rồi bấm đúng vị trí trên thiết bị. Giữ Alt và kéo chấm cam để dời điểm nối.","Or press P and click the exact spot on the device. Hold Alt and drag an orange dot to move a port.")}</div>`;
  (n.xp||[]).forEach(p=>{h+=`<div class="portrow" data-pid="${esc(p.id)}"><div class="row"><input data-pf="l" value="${esc(p.l)}" placeholder="${_("Tên cổng","Port name")} (${esc(p.id)})" aria-label="${_("Tên cổng","Port name")}"><select data-pf="s" aria-label="${_("Cạnh","Side")}">${optList([["n",_("Trên","Top")],["s",_("Dưới","Bottom")],["w",_("Trái","Left")],["e",_("Phải","Right")]],p.s)}</select><button class="btn danger" data-delport="${esc(p.id)}" style="flex:0 0 auto" aria-label="${_("Xoá điểm nối","Delete port")}">✕</button></div><div class="row"><label class="mini">${_("Vị trí","Position")}<input data-pf="f" type="range" min="0" max="100" value="${Math.round(p.f*100)}"></label><label class="mini">${_("Nhô ra","Offset")}<input data-pf="o" type="number" step="2" value="${p.o||0}"></label></div></div>`});
 }
 h+=`<div class="grid2"><button class="btn" onclick="rotateSel()">↻ ${_("Xoay 90° (R)","Rotate 90° (R)")}</button>${isText||isArea?"":`<button class="btn" onclick="flipSel()">⇋ ${_("Lật (F)","Flip (F)")}</button>`}<button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div><p class="hint">${_("Vị trí","Position")} X ${Math.round(n.x)} • Y ${Math.round(n.y)} • ${_("Góc","Angle")} ${n.rot||0}°</p>`;
 box.innerHTML=h;
 bindIn("pTag",v=>n.tag=v,_("Sửa tag","Edit tag"));bindIn("pTitle",v=>n.title=v,_("Sửa tên / nội dung","Edit name / text"));bindIn("pProps",v=>n.props=v,_("Sửa thông số thiết bị","Edit parameters"));
 bindIn("pW",v=>n.w=Math.max(60,+v||60),_("Đổi kích thước khung","Resize frame"));bindIn("pH",v=>n.h=Math.max(60,+v||60),_("Đổi kích thước khung","Resize frame"));
 bindIn("pSc",v=>{n.sc=+v;$("pScV").textContent=(+v).toFixed(1)+"×"},_("Đổi cỡ ký hiệu","Change symbol size"));
 bindIn("pLs",v=>{n.ls=+v===1?undefined:+v;$("pLsV").textContent=(+v).toFixed(1)+"×"},_("Đổi cỡ nhãn","Change label size"));
 if($("pVar"))$("pVar").addEventListener("change",()=>{n.v=+$("pVar").value;commit(_("Đổi kiểu vẽ","Change style"));renderAll()});
 if($("pLp"))$("pLp").addEventListener("change",()=>{n.lp=$("pLp").value;commit(_("Đổi vị trí nhãn","Label position"));renderCanvasOnly()});
 if($("pQuick"))$("pQuick").addEventListener("change",()=>{const v=$("pQuick").value;if(!v)return;const ta=$("pProps");ta.value=(ta.value&&!/\n$/.test(ta.value)?ta.value+"\n":ta.value)+T_(v)+": ";n.props=ta.value;$("pQuick").value="";ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);renderCanvasOnly();commitSoon(_("Thêm thông số","Add parameter"))});
 if(isText){
  bindSel("pFF",v=>{if(v)n.ff=v;else delete n.ff},_("Đổi font chữ","Change font"));
  bindIn("pFZ",v=>{if(+v>0)n.fz=Math.min(80,+v);else delete n.fz},_("Đổi cỡ chữ","Change text size"));
  bindSel("pAl",v=>{if(v==="c")delete n.al;else n.al=v},_("Căn lề chữ","Text align"));
  bindChk("pB",v=>{if(v)delete n.b;else n.b=false},_("Đậm / thường","Bold"));bindChk("pI",v=>{if(v)n.i=true;else delete n.i},_("Nghiêng","Italic"));bindChk("pBd",v=>{if(v)n.bd=true;else delete n.bd},_("Viền khung chữ","Text border"));
  bindIn("pCol",v=>{if(v.toLowerCase()===INK)delete n.col;else n.col=v},_("Đổi màu chữ","Text colour"));
  bindIn("pBg",v=>{if($("pBgOn").checked)n.bg=v},_("Đổi màu nền","Background colour"));bindChk("pBgOn",v=>{if(v)n.bg=$("pBg").value;else delete n.bg},_("Tô nền","Background"));
  $("pColReset").addEventListener("click",()=>{delete n.col;commit(_("Màu chữ mặc định","Default text colour"));renderAll()});
 }
 box.querySelectorAll("[data-addport]").forEach(b=>b.addEventListener("click",()=>{const s=b.dataset.addport;addPortTo(n,s,freeFraction(n,s));commit(_("Thêm điểm nối","Add port"));renderAll()}));
 box.querySelectorAll("[data-delport]").forEach(b=>b.addEventListener("click",()=>{removePort(n,b.dataset.delport);commit(_("Xoá điểm nối","Delete port"));renderAll()}));
 box.querySelectorAll(".portrow").forEach(r=>{
  const p=(n.xp||[]).find(q=>q.id===r.dataset.pid);if(!p)return;
  r.querySelectorAll("[data-pf]").forEach(inp=>{
   const f=inp.dataset.pf;
   inp.addEventListener("input",()=>{if(f==="l")p.l=inp.value;else if(f==="s")p.s=inp.value;else if(f==="f")p.f=+inp.value/100;else if(f==="o")p.o=+inp.value||0;renderCanvasOnly()});
   inp.addEventListener("change",()=>{commit(_("Chỉnh điểm nối","Edit port"));if(f==="s")renderAll()});
  });
 });
}

/* --- đường ống --- */
function pipeSpecHTML(e){
 const U=state.meta.units;
 const stdOpts=`<option value="">${_("— nhập tay / không chỉ định —","— manual / unspecified —")}</option>`+pipeStdList().map(([k,n])=>`<option value="${k}"${e.std===k?" selected":""}>${esc(T_(n))}</option>`).join("");
 let h=`<div class="sect">${_("Quy cách ống: size · schedule · vật liệu","Pipe spec: size · schedule · material")}</div><label for="ePs">${_("Tiêu chuẩn kích thước","Dimension standard")}</label><select id="ePs">${stdOpts}</select>`;
 if(e.std&&e.std!=="custom"){
  const S=PIPE_STD[e.std],z=pipeSize(e.std,e.nps);
  h+=`<label for="ePn">${_("Kích thước (NPS / DN / OD)","Size (NPS / DN / OD)")}</label><select id="ePn"><option value="">${_("— chọn —","— select —")}</option>${S.sizes.map(s=>`<option value="${esc(s.k)}"${s.k===String(e.nps)?" selected":""}>${esc(pipeSizeLabel(e.std,s,U))}</option>`).join("")}</select>`;
  if(z)h+=`<label for="ePw">${_("Schedule / độ dày thành ống","Schedule / wall thickness")}</label><select id="ePw">${z.walls.map(w=>`<option value="${esc(w.k)}"${(w.k===e.sch||(w.a||[]).includes(e.sch))?" selected":""}>${esc(pipeWallLabel(w,U))}</option>`).join("")}</select>`;
 }else if(e.std==="custom"){
  h+=`<div class="row"><div><label for="ePod">${_("OD ngoài (mm)","Outer dia. OD (mm)")}</label><input id="ePod" type="number" step="0.1" min="0" value="${esc(e.od)}"></div><div><label for="ePwl">${_("Chiều dày (mm)","Wall (mm)")}</label><input id="ePwl" type="number" step="0.01" min="0" value="${esc(e.wall)}"></div></div>`;
 }else h+=`<label for="eSize">${_("Kích thước (nhập tay)","Size (manual)")}</label><input id="eSize" value="${esc(e.size)}" placeholder='12" / DN300'>`;
 const c=e.std?pipeCalc(e):null;
 if(c){const IN=25.4,f=v=>U==="US"?(v/IN).toFixed(3)+" in":v+" mm";h+=`<div class="calc" role="status">OD ${f(c.od)}${c.t?` • ${_("dày","t")} ${f(c.t)}`:""}${c.id?` • ID ${f(c.id)}`:""}${c.mass?` • ≈ ${U==="US"?(c.mass*0.6720).toFixed(2)+" lb/ft":c.mass.toFixed(2)+" kg/m"} (${_("thép","steel")})`:""}</div>`}
 h+=`<label for="eMat">${_("Vật liệu ống","Pipe material")}</label><select id="eMat"><option value="">${_("— chưa chọn —","— not set —")}</option>${MATS.map(m=>`<option value="${m[0]}"${e.mat===m[0]?" selected":""}>${esc(T_(m[1]))}</option>`).join("")}</select>`;
 if(e.mat==="other")h+=`<input id="eMatO" value="${esc(e.matOther)}" placeholder="${_("Nhập tên / mác vật liệu","Enter material name / grade")}" aria-label="${_("Vật liệu khác","Other material")}" style="margin-top:.3rem">`;
 h+=`<label for="eCls">${_("Cấp ống / pipe class / rating","Pipe class / rating")}</label><input id="eCls" value="${esc(e.cls)}" placeholder="150# / 300# / A1A">`;
 return h;
}
function renderEdgeProps(e){
 const box=$("props"),a=getNode(e.from),b=getNode(e.to),tr=isTransport(e),sig=e.kind==="signal",sh=e.kind==="shaft";
 const kindOpts=Object.entries(KINDS).map(([k,l])=>`<option value="${k}"${e.kind===k?" selected":""}>${esc(T_(l))}</option>`).join("");
 const phOpts=`<option value="">${_("— không —","— none —")}</option>`+Object.entries(PHASE).map(([k,v])=>`<option value="${k}"${e.phase===k?" selected":""}>${esc(T_(v.n))}</option>`).join("");
 let h=`<h3 class="ph">${tr?_("Tuyến vận tải","Transport route"):sig?_("Đường tín hiệu","Signal line"):sh?_("Trục / khớp nối","Shaft / coupling"):_("Đường ống","Pipe line")}</h3><p class="hint">${esc(a?a.tag||a.title:"")} → ${esc(b?b.tag||b.title:"")}</p>`;
 h+=`<label for="eKind">${_("Loại đường","Line type")}</label><select id="eKind">${kindOpts}</select>`;
 if(!sig&&!sh)h+=`<div class="row"><div><label for="eNum">${_("Số dòng","Stream no.")}</label><input id="eNum" value="${esc(e.num)}"></div><div><label for="eSvc">${tr?_("Hàng hoá","Cargo"):_("Dịch vụ","Service")}</label><input id="eSvc" value="${esc(e.service)}" placeholder="${tr?"LNG / CNG / LPG":_("VD: Khí ướt","e.g. Wet gas")}"></div></div>`;
 else h+=`<label for="eSvc">${_("Ghi chú trên đường","Label")}</label><input id="eSvc" value="${esc(e.service)}">`;
 if(tr){
  h+=`<div class="row"><div><label for="eF">${_("Công suất / số lượng","Capacity / quantity")}</label><input id="eF" value="${esc(e.flow)}" placeholder="3.4 MTPA"></div><div><label for="eDist">${_("Cự ly / thời gian","Distance / time")}</label><input id="eDist" value="${esc(e.dist)}" placeholder="2 500 km"></div></div>`;
 }else if(!sig&&!sh){
  h+=pipeSpecHTML(e);
  h+=`<div class="sect">${_("Thông số dòng","Stream data")}</div>
  <label for="eP">${_("Áp suất","Pressure")}</label><div class="row"><input id="eP" value="${esc(e.P)}" placeholder="85 barg">${unitSel("eUP",e.P,"P")}</div>
  <label for="eT">${_("Nhiệt độ","Temperature")}</label><div class="row"><input id="eT" value="${esc(e.T)}" placeholder="45 °C">${unitSel("eUT",e.T,"T")}</div>
  <label for="eF">${_("Lưu lượng","Flow")}</label><div class="row"><input id="eF" value="${esc(e.flow)}" placeholder="120 MMscfd">${unitSel("eUF",e.flow,"Q")}</div>
  <label for="ePh">${_("Pha (màu)","Phase (colour)")}</label><select id="ePh">${phOpts}</select>`;
 }
 h+=`<label for="eWt">${_("Độ đậm nét","Line weight")}</label><select id="eWt">${optList([["1",_("Bình thường","Normal")],["1.6",_("Đậm (ống chính)","Heavy (main line)")],["2.4",_("Rất đậm","Extra heavy")]],String(e.wt))}</select>
 <div class="grid2"><button class="btn" onclick="reverseEdge()">⇄ ${_("Đảo chiều","Reverse")}</button><button class="btn" onclick="resetRoute()">↺ ${_("Đường đi tự động","Auto route")}</button></div>`;
 if(!tr&&!sig&&!sh)h+=`<label for="eIns">${_("Chèn lên đường ống","Insert on line")}</label><div class="row"><select id="eIns">${INSERTABLE.map(k=>`<option value="${k}">${esc(T_(SYMBOLS[k].label))}</option>`).join("")}</select><button class="btn primary" style="flex:0 0 auto" onclick="insertOnEdge($('eIns').value)">${_("Chèn","Insert")}</button></div>`;
 h+=`<button class="btn danger" style="width:100%;margin-top:.6rem" onclick="deleteSelected()">🗑 ${_("Xoá đường","Delete line")}</button><p class="hint">${_("Kéo chấm tròn xanh giữa đường để dời đoạn ống.","Drag the blue dot in the middle of the line to move the segment.")}</p>`;
 box.innerHTML=h;
 [["eNum","num"],["eSvc","service"],["eP","P"],["eT","T"],["eF","flow"],["eDist","dist"],["eSize","size"],["eCls","cls"],["eMatO","matOther"]].forEach(([id,f])=>bindIn(id,v=>e[f]=v,_("Sửa dòng ","Edit line ")+(e.num||"")));
 bindIn("ePod",v=>e.od=v,_("Sửa OD","Edit OD"));bindIn("ePwl",v=>e.wall=v,_("Sửa chiều dày","Edit wall"));
 ["ePh","eWt"].forEach(id=>{const el=$(id);if(el)el.addEventListener("change",()=>{if(id==="ePh")e.phase=el.value;else e.wt=+el.value||1;commit(_("Sửa dòng ","Edit line ")+(e.num||""));renderCanvasOnly()})});
 $("eKind").addEventListener("change",()=>{e.kind=$("eKind").value;if((e.kind==="signal"||e.kind==="shaft")&&e.num){e.num=""}else if(e.kind!=="signal"&&e.kind!=="shaft"&&e.num===""){e.num=String(state.nextStream++)}commit(_("Đổi loại đường","Change line type"));renderAll()});
 const uh=(id,fid,key)=>{const el=$(id);if(!el)return;el.addEventListener("change",()=>{if(!el.value)return;e[key]=setUnitInText(e[key],el.value);commit(_("Đổi đơn vị","Change unit"));renderAll()})};
 uh("eUP","eP","P");uh("eUT","eT","T");uh("eUF","eF","flow");
 const ps=$("ePs");if(ps)ps.addEventListener("change",()=>{e.std=ps.value;const z=pipeSize(e.std,e.nps);if(!z){e.nps="";e.sch=""}else if(!z.walls.some(w=>w.k===e.sch||(w.a||[]).includes(e.sch)))e.sch=defaultWall(z);commit(_("Đổi tiêu chuẩn ống","Change pipe standard"));renderAll()});
 const pn=$("ePn");if(pn)pn.addEventListener("change",()=>{e.nps=pn.value;const z=pipeSize(e.std,e.nps);e.sch=z?defaultWall(z):"";commit(_("Đổi size ống","Change pipe size"));renderAll()});
 const pw=$("ePw");if(pw)pw.addEventListener("change",()=>{e.sch=pw.value;commit(_("Đổi schedule","Change schedule"));renderAll()});
 const mt=$("eMat");if(mt)mt.addEventListener("change",()=>{e.mat=mt.value;commit(_("Đổi vật liệu ống","Change pipe material"));renderAll()});
}

/* --- hình vẽ tự do --- */
function styleFields(o,prefix,isShape){
 const closedKind=!isShape||o.t==="rect"||o.t==="ellipse"||(o.t==="poly"&&o.closed),arrowKind=!isShape||(!closedKind&&o.t!=="rect"&&o.t!=="ellipse");
 return`<div class="row"><div><label for="${prefix}Col">${_("Màu nét","Stroke colour")}</label><input id="${prefix}Col" type="color" value="${esc(o.col)}"></div><div><label for="${prefix}Sw">${_("Độ dày","Width")}</label><input id="${prefix}Sw" type="number" min="0.5" max="30" step="0.5" value="${o.sw}"></div></div>
 <label for="${prefix}Dash">${_("Kiểu nét","Line style")}</label><select id="${prefix}Dash">${optList(Object.entries(DASHES).map(([k,v])=>[k,T_(v)]),o.dash)}</select>
 ${arrowKind?`<label for="${prefix}Ah">${_("Đầu mũi tên","Arrowheads")}</label><select id="${prefix}Ah">${optList([["0",_("Không có","None")],["1",_("Cuối đường","At end")],["2",_("Hai đầu","Both ends")]],String(o.ah))}</select>`:""}
 ${closedKind?`<div class="row"><label class="chk"><input type="checkbox" id="${prefix}FillOn"${o.fill?" checked":""}>${_("Tô màu","Fill")}</label><input id="${prefix}Fill" type="color" value="${esc(o.fill||"#93c5fd")}"><label class="mini" style="flex:1.2">${_("Độ đặc","Opacity")}<input id="${prefix}Fo" type="range" min="0" max="1" step="0.05" value="${o.fo}"></label></div>`:""}`;
}
function bindStyle(o,prefix,onChange){
 const set=(k,v)=>{o[k]=v;onChange()};
 bindIn(prefix+"Col",v=>{o.col=v;onChange()});bindIn(prefix+"Sw",v=>{o.sw=Math.max(.5,+v||1);onChange()});
 bindSel(prefix+"Dash",v=>{o.dash=v;onChange()});
 const ah=$(prefix+"Ah");if(ah)ah.addEventListener("change",()=>{o.ah=+ah.value;commit(_("Đổi đầu mũi tên","Arrowheads"));onChange();renderCanvasOnly()});
 const fo=$(prefix+"FillOn");if(fo){fo.addEventListener("change",()=>{o.fill=fo.checked?$(prefix+"Fill").value:"";commit(_("Tô màu hình","Fill"));onChange();renderCanvasOnly()});
  bindIn(prefix+"Fill",v=>{if($(prefix+"FillOn").checked){o.fill=v;onChange()}});bindIn(prefix+"Fo",v=>{o.fo=+v;onChange()})}
}
function renderShapeProps(h){
 const box=$("props");
 let s=`<h3 class="ph">${_("Hình vẽ: ","Shape: ")}${esc(T_(SHAPE_T[h.t]))}</h3>${styleFields(h,"sh",true)}`;
 if(h.t==="rect")s+=`<label for="shRx">${_("Bo góc","Corner radius")}</label><input id="shRx" type="number" min="0" step="2" value="${h.rx||0}">`;
 if(h.t==="poly")s+=`<label class="chk"><input type="checkbox" id="shClosed"${h.closed?" checked":""}>${_("Khép kín (đa giác)","Closed (polygon)")}</label>`;
 s+=`<label for="shZ">${_("Lớp hiển thị","Layer")}</label><select id="shZ">${optList([["f",_("Phía trước thiết bị","In front of equipment")],["b",_("Phía sau thiết bị","Behind equipment")]],h.z)}</select>
 <div class="grid2"><button class="btn" onclick="rotateSel()">↻ ${_("Xoay 90°","Rotate 90°")}</button><button class="btn" onclick="flipSel()">⇋ ${_("Lật","Flip")}</button><button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div>
 <p class="hint">${h.t==="pen"?_("Nét bút: kéo để di chuyển; vẽ lại nếu cần chỉnh.","Pen stroke: drag to move; redraw to change the shape."):_("Kéo thân để di chuyển, kéo các chấm tròn để đổi hình.","Drag the body to move; drag the dots to reshape.")}</p>`;
 box.innerHTML=s;
 const ch=()=>{renderShapes()};
 bindStyle(h,"sh",ch);
 bindIn("shRx",v=>{h.rx=Math.max(0,+v||0)},_("Bo góc","Corner radius"));
 bindChk("shClosed",v=>{h.closed=v},_("Khép kín","Close shape"));
 bindSel("shZ",v=>{h.z=v},_("Đổi lớp hiển thị","Change layer"));
}
function renderPenProps(){
 const box=$("props");
 box.innerHTML=`<h3 class="ph">${_("Kiểu nét sẽ vẽ","Style for new shapes")}</h3><div class="hint">${_("Công cụ: ","Tool: ")}${esc(T_(SHAPE_T[tool]))}. ${_(...(TOOL_HINT[tool]||TOOL_HINT.select))}</div>${styleFields(Object.assign({t:tool,closed:tool==="rect"||tool==="ellipse"},penStyle),"pn",true)}
 <label class="chk"><input type="checkbox" id="pnSticky"${STICKY?" checked":""}>${_("Giữ công cụ để vẽ liên tiếp","Keep the tool active for repeated drawing")}</label>`;
 bindStyle(penStyle,"pn",()=>{});
 const st=$("pnSticky");if(st)st.addEventListener("change",()=>{STICKY=st.checked});
}

/* ============ KHUNG TÊN / THIẾT LẬP BẢN VẼ ============ */
function updMetaLbl(){if($("m_lwV"))$("m_lwV").textContent=(+state.meta.lw||1).toFixed(1)+"×";if($("m_fsV"))$("m_fsV").textContent=(+state.meta.fs||1).toFixed(1)+"×"}
function syncMetaUI(){document.querySelectorAll("[data-meta]").forEach(e=>{const v=state.meta[e.dataset.meta];if(e.type==="checkbox")e.checked=!!v;else e.value=v??""});updMetaLbl()}
function metaChange(ev,final){
 const t=ev.target;if(!t.dataset||!t.dataset.meta)return;const k=t.dataset.meta;
 if(k==="units"){if(final)setUnits(t.value);return}
 state.meta[k]=t.type==="checkbox"?t.checked:t.value;
 if(k==="lw"||k==="fs")state.meta[k]=+t.value||1;
 updMetaLbl();updateRS();
 if(["showTable","showSheet","grid","colorByPhase","showProps","snap","sheet","hops","lineMode","fitMode","orient","template","tbLang","pipeLabel"].includes(k))syncMetaUI();
 if(k==="sheet"||k==="showSheet"||k==="orient"){renderAll();if(final)fitView()}else renderCanvasOnly();
 if(final)commit(_("Đổi thiết lập bản vẽ","Drawing setup"));
}
document.addEventListener("input",ev=>metaChange(ev,false));
document.addEventListener("change",ev=>metaChange(ev,true));
function fillStaticSelects(){
 const sh=$("m_sheet");
 sh.innerHTML=["ISO","US"].map(g=>`<optgroup label="${g==="ISO"?"ISO / A-series":"US / ANSI-ARCH"}">`+Object.entries(SHEETS).filter(([k,s])=>s.g===g).map(([k,s])=>`<option value="${k}">${s.n}</option>`).join("")+"</optgroup>").join("");
 $("m_tpl").innerHTML=Object.entries(TEMPLATES).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");
}
/* ----- bảng revision ----- */
function openRevs(){renderRevTable();openModal("mRevs")}
function renderRevTable(){
 const rs=state.meta.revs,inp=(i,f,w)=>`<input data-ri="${i}" data-rf="${f}" value="${esc(rs[i][f])}" style="width:${w}" aria-label="${f}">`;
 $("revTbl").innerHTML=`<thead><tr><th>Rev.</th><th>Ngày</th><th>Nội dung thay đổi</th><th>Vẽ</th><th>Kiểm</th><th>Duyệt</th><th></th></tr></thead><tbody>`+(rs.length?rs.map((r,i)=>`<tr><td>${inp(i,"r","4rem")}</td><td>${inp(i,"date","7rem")}</td><td>${inp(i,"desc","16rem")}</td><td>${inp(i,"by","4rem")}</td><td>${inp(i,"chk","4rem")}</td><td>${inp(i,"app","4rem")}</td><td><button class="btn danger" data-rdel="${i}">✕</button></td></tr>`).join(""):`<tr><td colspan="7">Chưa có dòng revision. Bấm “Thêm dòng”.</td></tr>`)+`</tbody>`;
}
$("revTbl").addEventListener("input",ev=>{const t=ev.target;if(t.dataset.ri===undefined)return;state.meta.revs[+t.dataset.ri][t.dataset.rf]=t.value;renderCanvasOnly()});
$("revTbl").addEventListener("change",()=>commit(_("Sửa bảng revision","Edit revision table")));
$("revTbl").addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-rdel]");if(!b)return;state.meta.revs.splice(+b.dataset.rdel,1);commit(_("Xoá dòng revision","Delete revision row"));renderRevTable();renderCanvasOnly()});
function addRevRow(){const m=state.meta;m.revs.push({r:m.rev||"",date:m.date||"",desc:"",by:m.drawnBy||"",chk:m.checkedBy||"",app:m.approvedBy||""});commit(_("Thêm dòng revision","Add revision row"));renderRevTable();renderCanvasOnly()}
/* ----- font & cỡ chữ ----- */
function openFonts(){renderFontTable();openModal("mFonts")}
function renderFontTable(){
 const f=state.meta.fonts;
 $("fontTbl").innerHTML=`<thead><tr><th>${_("Phần chữ","Text element")}</th><th>${_("Font","Font")}</th><th>${_("Cỡ (pt)","Size (pt)")}</th></tr></thead><tbody>`+FONT_DEFS.map(d=>`<tr><td>${esc(T_(d[1]))}</td><td><select data-fk="${d[0]}" data-ff="f">${fontOpts(f[d[0]].f,false)}</select></td><td><input data-fk="${d[0]}" data-ff="s" type="number" min="3" max="60" step="0.5" value="${f[d[0]].s}" style="width:5rem"></td></tr>`).join("")+`</tbody>`;
 $("fontAll").innerHTML=fontOpts("",true).replace(_("— theo cài đặt chung —","— global setting —"),_("— chọn font —","— choose font —"));
}
$("fontTbl").addEventListener("input",ev=>{const t=ev.target;if(!t.dataset.fk)return;const o=state.meta.fonts[t.dataset.fk];if(t.dataset.ff==="f")o.f=t.value;else o.s=Math.min(60,Math.max(3,+t.value||o.s));renderCanvasOnly()});
$("fontTbl").addEventListener("change",()=>commit(_("Đổi font / cỡ chữ","Change fonts / sizes")));
function fontAllApply(){const v=$("fontAll").value;if(!v)return;Object.values(state.meta.fonts).forEach(o=>o.f=v);commit(_("Áp font cho mọi chữ","Apply font to all text"));renderFontTable();renderCanvasOnly()}
function fontScaleAll(k){Object.values(state.meta.fonts).forEach(o=>o.s=Math.min(60,Math.max(3,Math.round(o.s*k*2)/2)));commit(_("Đổi cỡ mọi chữ","Scale all text"));renderFontTable();renderCanvasOnly()}
function fontReset(){state.meta.fonts=defaultFonts();commit(_("Font mặc định","Default fonts"));renderFontTable();renderCanvasOnly()}
function openHist(){renderHistPanel();openModal("mHist")}

/* ============ LƯU / MỞ ============ */
function drawingData(){return{app:"PFD Studio",version:4,state:{meta:state.meta,nodes:state.nodes,edges:state.edges,shapes:state.shapes,nextId:state.nextId,nextStream:state.nextStream}}}
function dl(blob,name){try{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);setStatus(_("Đã tạo tệp ","Created file ")+name+_(" (kiểm tra thư mục Tải xuống)."," (check your Downloads folder)."))}catch(e){setStatus(_("Trình duyệt chặn tải tệp — hãy dùng nút { } JSON để sao chép.","The browser blocked the download — use the { } JSON button to copy."))}}
const fname=ext=>(((state.meta.docNo||"PFD")+"-"+(state.meta.rev||"")).replace(/[^\w\-. ]/g,"").trim()||"PFD")+ext;
function saveJSON(){dl(new Blob([JSON.stringify(drawingData(),null,2)],{type:"application/json"}),fname(".pfd.json"))}
function loadData(d,auto){
 let s;
 if(d&&d.version>=2&&d.state)s=d.state;
 else if(d&&d.state&&d.state.nodes)s={meta:{...defaultMeta(),title:d.title||"PROCESS FLOW DIAGRAM",project:d.project||"",rev:d.rev||"Rev. 0"},nodes:d.state.nodes,edges:(d.state.edges||[]).map(e=>({...e,service:e.service??e.label??""})),nextStream:1};
 else throw new Error(_("Tệp không đúng định dạng PFD Studio","Not a PFD Studio file"));
 state=normalizeState(s);sel=new Set();selEdge=null;
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
 const body=bg+sheetMarkup(false)+shapesMarkup("b",false)+edgesMarkup(false)+nodesMarkup(false)+shapesMarkup("f",false);
 const defs=markerDefs();
 EXPORTING=pEXP;BW=pBW;updateRS();
 return{body,defs,vb};
}
function buildExport(opts){
 const b=buildBody(opts),vb=b.vb;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(vb[2])}" height="${Math.round(vb[3])}" viewBox="${r3(vb[0])} ${r3(vb[1])} ${r3(vb[2])} ${r3(vb[3])}" font-family="Arial, Helvetica, sans-serif"><defs>${b.defs}</defs>${b.body}</svg>`;
 return{svg,w:vb[2],h:vb[3]};
}
function exportSVG(){const b=buildExport();dl(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+b.svg],{type:"image/svg+xml;charset=utf-8"}),fname(".svg"))}
function exportPNG(){
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
function doPrint(){
 const{cfg,list}=ppAllPagesSvg(true);
 let st=$("printStyle");if(!st){st=document.createElement("style");st.id="printStyle";document.head.appendChild(st)}
 st.textContent=`@page{size:${r3(cfg.pw)}mm ${r3(cfg.ph)}mm;margin:0}@media print{html,body{height:auto!important;overflow:visible!important;display:block!important;background:#fff!important}body>*:not(#printRoot){display:none!important}#printRoot{display:block!important}.pp{width:${r3(cfg.pw)}mm;height:${r3(cfg.ph)}mm;overflow:hidden;page-break-after:always;break-after:page}.pp:last-child{page-break-after:auto;break-after:auto}}`;
 let root=$("printRoot");if(!root){root=document.createElement("div");root.id="printRoot";document.body.appendChild(root)}
 root.innerHTML=list.map(s=>`<div class="pp">${s}</div>`).join("");
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
async function buildPDF(){
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
function exportEquipCSV(){dl(new Blob([csv([[T_("Tag"),T_("Tên / mô tả"),T_("Loại"),T_("Thông số thiết bị")],...equipRows().map(n=>[n.tag,n.title,T_(SYMBOLS[n.type].label),String(n.props||"").replace(/\n/g,"; ")])])],{type:"text/csv;charset=utf-8"}),fname("-thiet-bi.csv"))}

/* ============ CỬA SỔ PHỤ ============ */
function openModal(id){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("open"));$(id).classList.add("open")}
function closeModals(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("open"))}
function toggleHelp(o){o?openModal("help"):closeModals()}
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
 $("equipTbl").innerHTML=`<thead><tr><th>Tag</th><th>Tên / mô tả</th><th>Loại</th><th>Thông số thiết bị</th></tr></thead><tbody>`+(rows.length?rows.map(n=>`<tr class="clk" data-id="${n.id}"><td><b>${esc(n.tag)}</b></td><td>${esc(n.title)}</td><td>${esc(T_(SYMBOLS[n.type].label))}</td><td>${esc(String(n.props||"").replace(/\n/g,"; "))}</td></tr>`).join(""):`<tr><td colspan="4">Chưa có thiết bị.</td></tr>`)+`</tbody>`;
 openModal("mEquip");
}
$("equipTbl").addEventListener("click",ev=>{const tr=ev.target.closest&&ev.target.closest("tr[data-id]");if(!tr)return;sel=new Set([tr.dataset.id]);selEdge=null;closeModals();renderAll();announceSel()});
$("histList").addEventListener("click",ev=>{const tr=ev.target.closest&&ev.target.closest("tr[data-i]");if(tr)jumpHist(+tr.dataset.i)});
function openDescribe(){
 const m=state.meta,eq=equipRows(),st=streamRows(),sg=state.edges.filter(e=>!isStream(e)),nm=n=>(n.tag?n.tag+" — ":"")+(n.title||T_(SYMBOLS[n.type].label)),U=m.units;
 const en=LANG==="en";
 let s=en?`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Sheet ${m.sheet}.\nThe drawing has ${eq.length} equipment items, ${st.length} streams and ${sg.length} signal or mechanical lines.\n\nEQUIPMENT\n`:`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Khổ giấy ${m.sheet}.\nBản vẽ có ${eq.length} thiết bị, ${st.length} dòng công nghệ và ${sg.length} đường tín hiệu hoặc cơ khí.\n\nTHIẾT BỊ\n`;
 s+=eq.length?eq.map((n,i)=>`${i+1}. ${nm(n)}${n.props?" — "+String(n.props).replace(/\n/g,"; "):""}${(n.xp||[]).length?(en?`; ${n.xp.length} extra connection point(s)`:`; thêm ${n.xp.length} điểm nối ống`):""}.`).join("\n"):_("Chưa có thiết bị.","No equipment.");
 s+=en?"\n\nSTREAMS\n":"\n\nDÒNG CÔNG NGHỆ\n";
 s+=st.length?st.map(e=>{const sp=isTransport(e)?"":edgeSpecTextPlain(e,U);
  return en?`Stream ${e.num||"unnumbered"}: from ${nodeName(e.from)} to ${nodeName(e.to)}${e.service?", "+e.service:""}${e.kind!=="process"?", "+T_(KINDS[e.kind]).split(" — ")[0]:""}${e.phase?", phase "+PHASE[e.phase].n.toLowerCase():""}${e.P?", pressure "+e.P:""}${e.T?", temperature "+e.T:""}${e.flow?", flow "+e.flow:""}${e.dist?", distance "+e.dist:""}${sp?", pipe "+sp:""}.`
   :`Dòng ${e.num||"không số"}: từ ${nodeName(e.from)} đến ${nodeName(e.to)}${e.service?", "+e.service:""}${e.kind!=="process"?", "+KINDS[e.kind].split(" — ")[0].toLowerCase():""}${e.phase?", pha "+PHASE[e.phase].n.toLowerCase():""}${e.P?", áp suất "+e.P:""}${e.T?", nhiệt độ "+e.T:""}${e.flow?", lưu lượng "+e.flow:""}${e.dist?", cự ly "+e.dist:""}${sp?", ống "+sp:""}.`}).join("\n"):_("Chưa có đường ống.","No pipes.");
 if(sg.length)s+=(en?"\n\nSIGNAL / MECHANICAL\n":"\n\nTÍN HIỆU / CƠ KHÍ\n")+sg.map(e=>en?`From ${nodeName(e.from)} to ${nodeName(e.to)} (${T_(KINDS[e.kind]).split(" — ")[0]}).`:`Từ ${nodeName(e.from)} đến ${nodeName(e.to)} (${KINDS[e.kind].split(" — ")[0]}).`).join("\n");
 if(state.shapes.length)s+=en?`\n\nThe drawing also contains ${state.shapes.length} freehand annotation shape(s).`:`\n\nBản vẽ còn có ${state.shapes.length} hình vẽ chú thích tự do.`;
 const lone=eq.filter(n=>!state.edges.some(e=>e.from===n.id||e.to===n.id));
 if(lone.length)s+=(en?"\n\nNOTE: no pipe connected to ":"\n\nLƯU Ý: chưa nối ống cho ")+lone.map(n=>n.tag||n.title).join(", ")+".";
 $("descTxt").textContent=s;openModal("mDesc");$("descTxt").focus();
}
function edgeSpecTextPlain(e,U){const c=e.std?pipeCalc(e):null;if(!c)return e.size||"";const base=pipeSpecText(e,"sch",U,"");const mt=e.mat?(e.mat==="other"?e.matOther:matDef(e.mat)[1]):"";return[base,mt,e.cls].filter(Boolean).join(", ")}

/* ============ TOOLTIP KHI RÊ CHUỘT ============ */
const tipEl=$("tip");let tipKey="";
function setTips(v){TIPS=!!v;if(!TIPS)hideTip();savePrefs()}
function hideTip(){tipEl.style.display="none";tipKey=""}
function tipFor(t){
 const cl=q=>t&&t.closest?t.closest(q):null,pe=cl("[data-port]"),ne=cl(".node"),ee=cl("[data-edge]"),he=cl("[data-handle]"),se=cl("[data-shape]");
 if(he)return{k:"h"+he.dataset.handle,h:`<b>${_("Tay nắm đường ống","Line handle")}</b>\n${_("Kéo để dời đoạn ống đứng / ngang","Drag to move the vertical / horizontal segment")}`};
 if(pe){const n=getNode(pe.dataset.node);if(!n)return null;const p=symDef(n).ports.find(q=>q.id===pe.dataset.port);const lb=p&&p.l?` “${esc(p.l)}”`:"";return{k:"p"+pe.dataset.node+pe.dataset.port+lb,h:`<b>${_("Cổng","Port")} ${esc(pe.dataset.port)}${lb}</b> — ${esc(n.tag||n.title)}${pe.dataset.xp?`\n${_("Điểm nối thêm — giữ Alt và kéo để dời","Custom port — hold Alt and drag to move")}`:""}\n${_("Kéo sang thiết bị khác để nối ống","Drag to another device to connect")}`}}
 if(ne){
  const n=getNode(ne.dataset.id);if(!n)return null;const sy=SYMBOLS[n.type];
  const inn=state.edges.filter(e=>e.to===n.id),out=state.edges.filter(e=>e.from===n.id);
  const lb=T_(sy.label);
  let h=`<b>${esc(n.tag||lb)}</b>${n.title&&n.title!==sy.label?" — "+esc(n.title):""}\n${_("Loại","Type")}: ${esc(lb)}${sy.vars.length>1?`\n${_("Kiểu vẽ","Style")}: `+esc(T_(varOf(n).n)):""}`;
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

/* ============ KÍCH THƯỚC / CHỒNG LẤN ============ */
function extOf(n,f,mode){
 const d=symDef(n),isA=n.type==="area",q=(n.rot||0)%180;
 let sc=isA?1:(n.sc||1);if(!isA&&mode==="sym")sc=Math.min(4,Math.max(.3,sc*f));
 const w=isA?(n.w||420)*f:(q?d.h:d.w)*sc,h=isA?(n.h||260)*f:(q?d.w:d.h)*sc;
 return{hw:(isA?w:(q?d.h:d.w)*sc)/2,hh:(isA?h:(q?d.w:d.h)*sc)/2};
}
function overlapPairs(nodes,margin){
 let c=0;margin=margin==null?4:margin;const a=nodes.filter(n=>n.type!=="area");
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const ea=extOf(a[i],1,"sym"),eb=extOf(a[j],1,"sym");if(Math.abs(a[i].x-a[j].x)<ea.hw+eb.hw-margin&&Math.abs(a[i].y-a[j].y)<ea.hh+eb.hh-margin)c++}
 return c;
}
function resetMids(ids){state.edges.forEach(e=>{if(ids.has(e.from)||ids.has(e.to)){e.mid=null;e.midAxis=null}})}
const targetNodes=()=>{const s=selNodes();return s.length>=2?s:state.nodes.filter(n=>n.type!=="area")};

/* ============ CĂN CHỈNH ============ */
function alignSel(mode){
 const a=selNodes();if(a.length<2)return;
 const E=a.map(n=>extOf(n,1,"sym"));
 if(mode==="left"){const v=Math.min(...a.map((n,i)=>n.x-E[i].hw));a.forEach((n,i)=>n.x=v+E[i].hw)}
 if(mode==="right"){const v=Math.max(...a.map((n,i)=>n.x+E[i].hw));a.forEach((n,i)=>n.x=v-E[i].hw)}
 if(mode==="center"){const xs=a.map(n=>n.x),c=(Math.min(...xs)+Math.max(...xs))/2;a.forEach(n=>n.x=c)}
 if(mode==="top"){const v=Math.min(...a.map((n,i)=>n.y-E[i].hh));a.forEach((n,i)=>n.y=v+E[i].hh)}
 if(mode==="bottom"){const v=Math.max(...a.map((n,i)=>n.y+E[i].hh));a.forEach((n,i)=>n.y=v-E[i].hh)}
 if(mode==="middle"){const ys=a.map(n=>n.y),c=(Math.min(...ys)+Math.max(...ys))/2;a.forEach(n=>n.y=c)}
 if(mode==="dh")distribute(a,"x");
 if(mode==="dv")distribute(a,"y");
 resetMids(new Set(a.map(n=>n.id)));
 const lab={left:["Căn trái","Align left"],right:["Căn phải","Align right"],center:["Cùng X","Same X"],top:["Căn trên","Align top"],bottom:["Căn dưới","Align bottom"],middle:["Cùng Y","Same Y"],dh:["Chia đều ngang","Distribute H"],dv:["Chia đều dọc","Distribute V"]}[mode];
 commit(_(...lab));renderAll();
 const ov=overlapPairs(a);
 setStatus(ov?_(`Đã căn chỉnh, nhưng ${ov} cặp thiết bị đang chồng lên nhau — bấm “Tránh chồng lấn” hoặc Ctrl+Z.`,`Aligned, but ${ov} pair(s) of devices now overlap — press “Remove overlaps” or Ctrl+Z.`):_("Đã căn chỉnh.","Aligned."));
}
/* chia đều KHOẢNG HỞ theo kích thước thiết bị; xử lý được cả khi các thiết bị đã trùng toạ độ */
function distribute(nodes,axis){
 const hk=axis==="x"?"hw":"hh";
 const items=nodes.map((n,i)=>({n,i,e:extOf(n,1,"sym")})).sort((p,q)=>(p.n[axis]-q.n[axis])||(p.i-q.i));
 const f=items[0],l=items[items.length-1],start=f.n[axis]-f.e[hk],end=l.n[axis]+l.e[hk],sum=items.reduce((s,it)=>s+2*it.e[hk],0);
 let gap=(end-start-sum)/(items.length-1);if(gap<44)gap=44;
 let pos=start;items.forEach(it=>{it.n[axis]=pos+it.e[hk];pos+=2*it.e[hk]+gap});
 if(state.meta.snap)items.forEach(it=>it.n[axis]=Math.round(it.n[axis]/10)*10);
}
/* đẩy các thiết bị đang chồng nhau ra xa */
function deOverlap(){
 const nodes=targetNodes();if(nodes.length<2){setStatus(_("Cần ít nhất 2 thiết bị.","At least 2 devices are needed."));return}
 const pad=40,E=nodes.map(n=>extOf(n,1,"sym"));let rounds=0;
 for(;rounds<400;rounds++){
  let moved=false;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y;
   const ox=E[i].hw+E[j].hw+pad-Math.abs(dx),oy=E[i].hh+E[j].hh+pad-Math.abs(dy);
   if(ox>0&&oy>0){
    moved=true;
    if(Math.abs(dx)<1&&Math.abs(dy)<1){const ang=((j*37+i*11)%360)*Math.PI/180;dx=Math.cos(ang);dy=Math.sin(ang)}
    if(ox<=oy*1.4||Math.abs(dy)<1&&false){const s=dx>=0?1:-1;a.x-=s*(ox/2+.5);b.x+=s*(ox/2+.5)}else{const s=dy>=0?1:-1;a.y-=s*(oy/2+.5);b.y+=s*(oy/2+.5)}
   }
  }
  if(!moved)break;
 }
 if(state.meta.snap)nodes.forEach(n=>{n.x=Math.round(n.x/10)*10;n.y=Math.round(n.y/10)*10});
 resetMids(new Set(nodes.map(n=>n.id)));
 commit(_("Tránh chồng lấn","Remove overlaps"));renderAll();
 const ov=overlapPairs(nodes);
 setStatus(ov?_(`Còn ${ov} cặp chồng nhau — thử “Giãn khoảng cách”.`,`${ov} pair(s) still overlap — try “Spread”.`):_(`Đã tách các thiết bị ra (${rounds} vòng lặp). Dùng ⤢ Vừa khổ giấy để khớp lại trang.`,`Devices separated (${rounds} passes). Use ⤢ Fit to sheet to refit the page.`));
}
function centroidOf(nodes,shapes){
 const pts=[...nodes.map(n=>[n.x,n.y]),...shapes.flatMap(h=>h.pts.map(p=>[p.x,p.y]))];
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
}
/* giãn / co KHOẢNG CÁCH giữa các thiết bị, giữ nguyên cỡ ký hiệu */
function spreadSel(f){
 const nodes=sel.size?selNodes().filter(n=>n.type!=="area"):targetNodes(),shapes=sel.size?selShapes():[];
 if(nodes.length<2){setStatus(_("Cần ít nhất 2 thiết bị.","At least 2 devices are needed."));return}
 const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
 if(Math.max(...xs)-Math.min(...xs)<5&&Math.max(...ys)-Math.min(...ys)<5){deOverlap();return}
 const[Cx,Cy]=centroidOf(nodes,shapes);
 applyScale(nodes,f,Cx,Cy,0,0,"pos",shapes);
 commit(f>1?_("Giãn khoảng cách","Spread"):_("Co khoảng cách","Tighten"));renderAll();
 setStatus(_(`Đã ${f>1?"giãn":"co"} khoảng cách ×${f.toFixed(2)} (giữ nguyên cỡ ký hiệu).`,`Spacing ${f>1?"increased":"reduced"} ×${f.toFixed(2)} (symbol size unchanged).`));
}
function centerOnPage(){
 const nodes=sel.size?selNodes():state.nodes,shapes=sel.size?selShapes():state.shapes;if(!nodes.length&&!shapes.length)return;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 nodes.forEach(n=>{if(n.type==="area"&&!sel.size)return;const e=extOf(n,1,"sym");x0=Math.min(x0,n.x-e.hw);x1=Math.max(x1,n.x+e.hw);y0=Math.min(y0,n.y-e.hh);y1=Math.max(y1,n.y+e.hh+30)});
 shapes.forEach(h=>{const b=shapeBox(h);x0=Math.min(x0,b.x0);x1=Math.max(x1,b.x1);y0=Math.min(y0,b.y0);y1=Math.max(y1,b.y1)});
 if(x0>x1)return;
 const[W,H]=sheetDim(),L=state.meta.showSheet?sheetLayout().use:{l:45,r:W-45,t:45,b:H-45};
 const dx=(L.l+L.r)/2-(x0+x1)/2,dy=(L.t+L.b)/2-(y0+y1)/2;
 nodes.forEach(n=>{n.x+=dx;n.y+=dy});shapes.forEach(h=>h.pts.forEach(p=>{p.x+=dx;p.y+=dy}));
 state.edges.forEach(e=>{if(typeof e.mid==="number")e.mid+=e.midAxis==="x"?dx:dy});
 commit(_("Đặt giữa trang","Center on page"));renderAll();setStatus(_("Đã đặt toàn bộ vào giữa vùng vẽ của trang.","Centered inside the drawing area of the sheet."));
}

/* ============ TỰ BỐ TRÍ THEO DÒNG CHẢY ============ */
function autoLayout(){
 const picked=targetNodes().filter(n=>n.type!=="text");
 if(picked.length<2){setStatus(_("Cần ít nhất 2 thiết bị.","At least 2 devices are needed."));return}
 const ids=new Set(picked.map(n=>n.id)),isB=n=>!!SYMBOLS[n.type].bub;
 const main=picked.filter(n=>!isB(n)),inst=picked.filter(isB),mid=new Set(main.map(n=>n.id));
 const E=new Map(picked.map(n=>[n.id,extOf(n,1,"sym")]));
 const fe=state.edges.filter(e=>e.kind!=="signal"&&mid.has(e.from)&&mid.has(e.to)&&e.from!==e.to);
 /* bỏ cạnh ngược để chặn vòng lặp (DFS) */
 const out=new Map(main.map(n=>[n.id,[]]));fe.forEach(e=>out.get(e.from).push(e.to));
 const st=new Map(),back=new Set();
 const dfs=u=>{st.set(u,1);out.get(u).forEach(v=>{if(st.get(v)===1)back.add(u+">"+v);else if(!st.get(v))dfs(v)});st.set(u,2)};
 const hasIn=new Set(fe.map(e=>e.to));
 main.filter(n=>!hasIn.has(n.id)).forEach(n=>{if(!st.get(n.id))dfs(n.id)});main.forEach(n=>{if(!st.get(n.id))dfs(n.id)});
 const dag=fe.filter(e=>!back.has(e.from+">"+e.to));
 const layer=new Map(main.map(n=>[n.id,0]));
 for(let it=0;it<main.length+2;it++){let ch=false;dag.forEach(e=>{if(layer.get(e.to)<layer.get(e.from)+1){layer.set(e.to,layer.get(e.from)+1);ch=true}});if(!ch)break}
 const connected=new Set();dag.forEach(e=>{connected.add(e.from);connected.add(e.to)});
 const loose=main.filter(n=>!connected.has(n.id));
 const lay=main.filter(n=>connected.has(n.id)),nL=lay.length?Math.max(...lay.map(n=>layer.get(n.id)))+1:0;
 const cols=Array.from({length:nL},()=>[]);lay.forEach(n=>cols[layer.get(n.id)].push(n));
 /* sắp thứ tự trong cột theo trung bình vị trí lân cận (barycenter) */
 const idx=new Map();cols.forEach(c=>c.forEach((n,i)=>idx.set(n.id,i)));
 const nb=(n,dir)=>dag.filter(e=>dir<0?e.to===n.id:e.from===n.id).map(e=>dir<0?e.from:e.to);
 for(let s=0;s<4;s++){
  const order=s%2?[...cols.keys()].reverse():[...cols.keys()];
  order.forEach(ci=>{const c=cols[ci],dir=s%2?1:-1;const bc=n=>{const a=nb(n,dir);return a.length?a.reduce((t,id)=>t+(idx.get(id)||0),0)/a.length:idx.get(n.id)};c.sort((p,q)=>bc(p)-bc(q));c.forEach((n,i)=>idx.set(n.id,i))});
 }
 const gapX=120,gapY=80,labelH=46;
 const colW=cols.map(c=>Math.max(...c.map(n=>2*E.get(n.id).hw)));
 const colH=cols.map(c=>c.reduce((t,n)=>t+2*E.get(n.id).hh+gapY+labelH,-gapY));
 const maxH=Math.max(0,...colH);
 /* gốc toạ độ */
 let ox,oy;
 if(state.meta.showSheet){const u=sheetLayout().use;ox=u.l+20;oy=u.t+60}
 else{ox=Math.min(...picked.map(n=>n.x-E.get(n.id).hw));oy=Math.min(...picked.map(n=>n.y-E.get(n.id).hh))+60}
 let x=ox;
 cols.forEach((c,ci)=>{
  const cx=x+colW[ci]/2;let y=oy+(maxH-colH[ci])/2;
  c.forEach(n=>{const e=E.get(n.id);n.x=cx;n.y=y+e.hh;y+=2*e.hh+gapY+labelH});
  x+=colW[ci]+gapX;
 });
 /* thiết bị chưa nối: một hàng ở dưới */
 let lx=ox,ly=oy+maxH+gapY+60;
 loose.forEach(n=>{const e=E.get(n.id);n.x=lx+e.hw;n.y=ly+e.hh;lx+=2*e.hw+gapX*.6});
 /* thiết bị đo: đặt ngay trên thiết bị / van mà nó điều khiển hoặc đo */
 const slot=new Map();
 inst.forEach(n=>{
  const se=state.edges.find(e=>e.kind==="signal"&&((e.from===n.id&&mid.has(e.to))||(e.to===n.id&&mid.has(e.from))));
  const tid=se?(se.from===n.id?se.to:se.from):null,t=tid&&getNode(tid);
  if(t){const k=slot.get(tid)||0;slot.set(tid,k+1);const te=E.get(tid);n.x=t.x+k*50-(k?0:0);n.y=t.y-te.hh-70-Math.floor(k/3)*50}
  else{n.x=lx+30;n.y=ly+30;lx+=60}
 });
 resetMids(ids);
 if(state.meta.snap)picked.forEach(n=>{n.x=Math.round(n.x/10)*10;n.y=Math.round(n.y/10)*10});
 commit(_("Tự bố trí theo dòng","Auto layout"));renderAll();
 setStatus(_(`Đã bố trí ${picked.length} thiết bị thành ${nL} cột theo chiều dòng chảy (trái → phải). Bấm ⤢ Vừa khổ giấy để khớp trang.`,`Arranged ${picked.length} devices into ${nL} column(s) following the flow (left → right). Press ⤢ Fit to sheet to fit the page.`));
}

/* ============ VỪA KHỔ GIẤY / CO GIÃN HỆ THỐNG ============ */
function bboxAt(nodes,shapes,f,Cx,Cy,mode){
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 nodes.forEach(n=>{const x=Cx+(n.x-Cx)*f,y=Cy+(n.y-Cy)*f,e=extOf(n,f,mode);x0=Math.min(x0,x-e.hw);x1=Math.max(x1,x+e.hw);y0=Math.min(y0,y-e.hh);y1=Math.max(y1,y+e.hh)});
 shapes.forEach(h=>h.pts.forEach(p=>{const x=Cx+(p.x-Cx)*f,y=Cy+(p.y-Cy)*f;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}));
 return[x0,y0,x1,y1];
}
function posCenter(nodes,shapes){return centroidOf(nodes,shapes||[])}
function applyScale(nodes,f,Cx,Cy,dx,dy,mode,shapes){
 const ids=new Set(nodes.map(n=>n.id));
 nodes.forEach(n=>{
  n.x=Cx+(n.x-Cx)*f+dx;n.y=Cy+(n.y-Cy)*f+dy;
  if(n.type==="area"){n.w=Math.max(60,(n.w||420)*f);n.h=Math.max(60,(n.h||260)*f)}
  else if(mode==="sym")n.sc=Math.round(Math.min(4,Math.max(.3,(n.sc||1)*f))*100)/100;
 });
 (shapes||[]).forEach(h=>{h.pts=h.pts.map(p=>({x:Cx+(p.x-Cx)*f+dx,y:Cy+(p.y-Cy)*f+dy}))});
 state.edges.forEach(e=>{
  const a=ids.has(e.from),b=ids.has(e.to);
  if(!a&&!b)return;
  if(!(a&&b)){e.mid=null;e.midAxis=null;return}
  if(typeof e.mid==="number")e.mid=e.midAxis==="x"?Cx+(e.mid-Cx)*f+dx:Cy+(e.mid-Cy)*f+dy;
 });
}
const scaleTargets=()=>sel.size?selNodes():state.nodes.slice();
const scaleShapes=()=>sel.size?selShapes():state.shapes.slice();
function scaleSel(f){
 const nodes=scaleTargets(),shapes=scaleShapes();if(!nodes.length&&!shapes.length){setStatus(_("Chưa có gì để co giãn.","Nothing to scale."));return}
 const[Cx,Cy]=posCenter(nodes,shapes);
 applyScale(nodes,f,Cx,Cy,0,0,state.meta.fitMode==="pos"?"pos":"sym",shapes);
 commit(f>1?_("Phóng to +10%","Enlarge +10%"):_("Thu nhỏ −10%","Shrink −10%"));renderAll();setStatus(_(`Đã ${f>1?"phóng to":"thu nhỏ"} ×${f.toFixed(2)}. Dùng ⤢ Vừa khổ giấy để tự khớp.`,`${f>1?"Enlarged":"Reduced"} ×${f.toFixed(2)}. Use ⤢ Fit to sheet to auto-fit.`));
}
function fitToSheet(){
 const nodes=scaleTargets(),shapes=scaleShapes();if(!nodes.length&&!shapes.length){setStatus(_("Chưa có gì để co giãn.","Nothing to scale."));return}
 const m=state.meta,[W,H]=sheetDim(),mode=m.fitMode==="pos"?"pos":"sym";
 let left=45,right=W-45,top=m.colorByPhase&&state.edges.some(e=>e.phase)?80:55,bottom=H-45;
 if(m.showSheet){const L=sheetLayout();left=L.use.l;right=L.use.r;top=L.use.t;bottom=L.use.b;if(m.showTable){const rows=streamRows().length;if(rows)bottom=Math.min(bottom,L.fy1-12-(rows+1)*FU("table")*1.9-18)}}
 const padB=55,aw=right-left,ah=bottom-top-padB;
 if(aw<100||ah<100){setStatus(_("Khung giấy quá nhỏ để vừa — tắt bảng dòng hoặc chọn khổ giấy lớn hơn.","The sheet is too small to fit — hide the stream table or pick a larger sheet."));return}
 const[Cx,Cy]=posCenter(nodes,shapes);
 let lo=.05,hi=12;
 for(let i=0;i<45;i++){const f=(lo+hi)/2,b=bboxAt(nodes,shapes,f,Cx,Cy,mode);if(b[2]-b[0]<=aw&&b[3]-b[1]<=ah)lo=f;else hi=f}
 const f=lo,b=bboxAt(nodes,shapes,f,Cx,Cy,mode),dx=(left+right)/2-(b[0]+b[2])/2,dy=top+ah/2-(b[1]+b[3])/2;
 applyScale(nodes,f,Cx,Cy,dx,dy,mode,shapes);
 commit(_("Vừa khổ giấy","Fit to sheet"));renderAll();fitView();
 setStatus(_(`Đã ${mode==="sym"?"co giãn cả ký hiệu lẫn khoảng cách":"co giãn khoảng cách"} ×${f.toFixed(2)} — vừa khổ ${m.sheet}${m.showSheet?"":" (đang ẩn khung giấy)"}. Nếu thiết bị bị dồn lại: “Giãn khoảng cách” hoặc “Tránh chồng lấn”.`,`${mode==="sym"?"Scaled symbols and spacing":"Scaled spacing"} ×${f.toFixed(2)} — fits ${m.sheet}${m.showSheet?"":" (sheet hidden)"}. If devices crowd together use “Spread” or “Remove overlaps”.`));
}
function resetScale(){state.nodes.forEach(n=>{if(n.type!=="area")n.sc=1});commit(_("Trả cỡ ký hiệu về 1×","Reset symbol size 1×"));renderAll();setStatus(_("Đã trả cỡ mọi ký hiệu về 1×.","All symbols reset to 1×."))}
function cycleVariant(){
 const a=selNodes().filter(n=>SYMBOLS[n.type].vars.length>1);if(!a.length){setStatus(_("Thiết bị này chỉ có một kiểu vẽ.","This device has only one drawing style."));return}
 a.forEach(n=>n.v=((n.v||0)+1)%SYMBOLS[n.type].vars.length);commit(_("Đổi kiểu vẽ","Change style"));renderAll();
 setStatus(a.length===1?_(`Kiểu vẽ: ${T_(varOf(a[0]).n)} (${(a[0].v||0)+1}/${SYMBOLS[a[0].type].vars.length}).`,`Style: ${T_(varOf(a[0]).n)} (${(a[0].v||0)+1}/${SYMBOLS[a[0].type].vars.length}).`):_(`Đã đổi kiểu vẽ ${a.length} thiết bị.`,`Changed style of ${a.length} devices.`));
}

/* ============ ĐƠN VỊ SI / US ============ */
function setUnits(u){
 if(u!==state.meta.units){
  const sys=u==="US"?"US":"SI";
  state.nodes.forEach(n=>{n.props=convertSystem(n.props,sys);if(n.type==="text"||n.type==="area")n.title=convertSystem(n.title,sys)});
  state.edges.forEach(e=>{e.P=convertSystem(e.P,sys);e.T=convertSystem(e.T,sys);e.flow=convertSystem(e.flow,sys);e.dist=convertSystem(e.dist,sys)});
  state.meta.units=u;commit(_(`Đổi sang hệ đơn vị ${u}`,`Switch to ${u} units`));
 }
 syncMetaUI();renderAll();syncSettingsUI();
 setStatus(_(`Hệ đơn vị: ${u==="US"?"US (psi, °F, ft, bbl…)":"SI (bar, °C, m, m³…)"}. Các giá trị đã được quy đổi gần đúng — hãy kiểm tra lại số liệu quan trọng.`,`Unit system: ${u==="US"?"US (psi, °F, ft, bbl…)":"SI (bar, °C, m, m³…)"}. Values were converted approximately — please re-check critical data.`));
}
/* ============ THEME · NGÔN NGỮ · TUỲ CHỌN ============ */
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({hc:HC,ui:UI,tips:TIPS,theme:THEME,darkPaper:DARKPAPER,lang:LANG,ports:SHOWPORTS,units:state.meta.units}))}catch(e){}}
function applyTheme(){
 try{SYSDARK=!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){SYSDARK=false}
 const dark=isDark();document.documentElement.setAttribute("data-theme",dark?"dark":"light");
 applyScheme();
 document.documentElement.style.setProperty("--palbg",SCH.paper);
 const b=$("themeBtn");if(b)b.textContent=THEME==="dark"?"🌙":THEME==="light"?"☀":"🌓";
}
function setTheme(t){THEME=t;savePrefs();applyTheme();renderPalette();renderAll();syncSettingsUI()}
function cycleTheme(){setTheme(THEME==="auto"?"light":THEME==="light"?"dark":"auto");setStatus(_("Giao diện: ","Theme: ")+({auto:_("tự động theo hệ thống","auto (system)"),light:_("sáng","light"),dark:_("tối","dark")})[THEME])}
function setDarkPaper(v){DARKPAPER=!!v;savePrefs();applyTheme();renderPalette();renderAll()}
function setUI(d){UI=Math.round(Math.min(1.8,Math.max(.8,UI+d))*10)/10;document.documentElement.style.setProperty("--ui",UI);savePrefs();setStatus(_("Cỡ chữ giao diện: ","UI text size: ")+Math.round(UI*100)+"%.")}
function toggleHC(){HC=!HC;document.body.classList.toggle("hc",HC);$("hcBtn").classList.toggle("active",HC);updateRS();renderPalette();renderAll();savePrefs();syncSettingsUI();setStatus(HC?_("Đã bật tương phản cao.","High contrast on."):_("Đã tắt tương phản cao.","High contrast off."))}
function toggleSide(s){$(s==="left"?"asideL":"asideR").classList.toggle("hidden");setTimeout(fitView,50)}
function toggleShowPorts(v){SHOWPORTS=v===undefined?!SHOWPORTS:!!v;savePrefs();updateToolUI();syncSettingsUI()}
function setLang(l){
 LANG=l==="en"?"en":"vi";document.documentElement.lang=LANG;savePrefs();
 fillStaticSelects();syncMetaUI();translateAll();renderPalette();renderAll();syncSettingsUI();
 setStatus(LANG==="en"?"Language: English.":"Ngôn ngữ: Tiếng Việt.");
}
function toggleLang(){setLang(LANG==="vi"?"en":"vi")}
function syncSettingsUI(){
 const set=(id,v)=>{const e=$(id);if(e){if(e.type==="checkbox")e.checked=!!v;else e.value=v}};
 set("st_theme",THEME);set("st_dark",DARKPAPER);set("st_lang",LANG);set("st_units",state.meta.units);set("st_hc",HC);set("st_tips",TIPS);set("st_ports",SHOWPORTS);set("optTips",TIPS);
 const lb=$("langBtn");if(lb)lb.textContent=LANG==="vi"?"VI":"EN";
 const ub=$("unitBtn");if(ub)ub.textContent=state.meta.units;
 if($("hcBtn"))$("hcBtn").classList.toggle("active",HC);
}
function openSettings(){syncSettingsUI();openModal("mSettings")}

/* ============ DỊCH GIAO DIỆN (VI → EN) ============ */
function trString(s){
 const m=/^([^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u.exec(s);
 if(!m||!m[2])return s;
 const key=m[2],en=EN[key];
 return en!==undefined?m[1]+en+m[3]:s;
}
const TR_ATTRS=["title","placeholder","aria-label"];
function trSkip(n){const p=n.nodeType===3?n.parentNode:n;return!p||(p.closest&&p.closest("svg,.nt,script,style,textarea,#printRoot,#ppView"))}
function trText(node){
 if(node.__vi===undefined)node.__vi=node.data;
 else if(node.data!==node.__en&&node.data!==node.__vi)node.__vi=node.data;
 const target=LANG==="en"?trString(node.__vi):node.__vi;
 if(node.data!==target)node.data=target;
 node.__en=target;
}
function trEl(el){
 if(el.nodeType!==1||el.closest&&el.closest("svg,.nt,#printRoot,#ppView"))return;
 TR_ATTRS.forEach(a=>{
  if(!el.hasAttribute(a))return;const k="__vi_"+a,cur=el.getAttribute(a);
  if(el[k]===undefined||(cur!==el[k+"_en"]&&cur!==el[k]))el[k]=cur;
  const t=LANG==="en"?trString(el[k]):el[k];if(cur!==t)el.setAttribute(a,t);el[k+"_en"]=t;
 });
}
function trWalk(root){
 if(!root||trSkip(root))return;
 if(root.nodeType===3){trText(root);return}
 if(root.nodeType!==1)return;
 trEl(root);
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>trSkip(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 let n;while(n=w.nextNode()){n.nodeType===3?trText(n):trEl(n)}
}
let trBusy=false;
function translateAll(){
 trBusy=true;
 try{trWalk(document.body);document.title=LANG==="en"?"PFD Studio Rev.4 — Oil & Gas Process Flow Diagrams":"PFD Studio Rev.4 — Vẽ Process Flow Diagram Dầu Khí"}finally{trBusy=false}
}
new MutationObserver(muts=>{
 if(trBusy)return;trBusy=true;
 try{muts.forEach(m=>{
  if(m.type==="characterData"){if(m.target.__en!==m.target.data)trWalk(m.target)}
  else m.addedNodes.forEach(n=>trWalk(n));
 })}finally{trBusy=false}
}).observe(document.body,{childList:true,subtree:true,characterData:true});

/* ============ BẢN VẼ MỚI & MẪU ============ */
function newDrawing(){const keep=state.meta;state=newState();state.meta={...keep,project:"",revs:[],fonts:keep.fonts};sel=new Set();selEdge=null;commit(_("Bản vẽ mới","New drawing"));syncMetaUI();renderAll();fitView();setStatus(_("Đã tạo bản vẽ trống (Ctrl+Z để quay lại).","Blank drawing created (Ctrl+Z to go back)."))}
function loadTemplate(name){
 const keep=state.meta;state=newState();state.meta={...keep,revs:[]};sel=new Set();selEdge=null;
 const add=(t,x,y,tag,title,props,v)=>mkNode(t,x,y,tag,title,props||"",v).id;
 const link=(a,ap,b,bp,o)=>{o=o||{};const e=newEdge(a,ap,b,bp,o.kind||"process");Object.assign(e,{phase:o.phase||"",service:o.svc||"",P:o.P||"",T:o.T||"",flow:o.flow||"",dist:o.dist||"",std:o.std||"",nps:o.nps||"",sch:o.sch||"",mat:o.mat||"",cls:o.cls||""});state.edges.push(e)};
 if(name==="gas"){
  const f=add("feed",140,300,"","FEED GAS"),s1=add("v_sep",320,300,"V-101","Inlet Separator","Áp suất thiết kế: 100 barg\nNhiệt độ vận hành: 30 °C"),k=add("compressor",520,300,"K-101","Gas Compressor","85 → 120 barg"),e1=add("aircooler",720,300,"E-101","Aftercooler","120 barg, 45 °C"),s2=add("v_sep",920,300,"V-102","Suction Scrubber"),t=add("column",1120,300,"T-101","TEG Contactor","Khí khô: dew point ≤ -10 °C"),p=add("product",1340,300,"","DRY GAS EXPORT"),pump=add("pd_pump",960,520,"P-101","TEG Pump");
  const g={std:"b3610",nps:"12",sch:"40",mat:"cs_a106b",cls:"600#"};
  link(f,"e",s1,"w",{svc:"Khí ướt",phase:"gas",P:"85 barg",T:"30 °C",...g});link(s1,"e",k,"w",{svc:"Khí",phase:"gas",std:"b3610",nps:"10",sch:"40",mat:"cs_a106b"});link(k,"e",e1,"w",{svc:"Khí nóng",phase:"gas",P:"120 barg",...g});link(e1,"e",s2,"w",{phase:"gas",T:"45 °C",...g});link(s2,"e",t,"w",{svc:"Khí",phase:"gas",...g});link(t,"e",p,"w",{svc:"Khí khô",phase:"gas",...g});link(t,"s",pump,"e",{svc:"TEG giàu",phase:"oil",std:"b3619",nps:"2",sch:"40S",mat:"ss316"});
  state.meta.project="Nén khí + làm khô TEG";
 }else if(name==="crude"){
  const f=add("feed",140,300,"","WELL FLUID"),h=add("heater",330,300,"H-101","Crude Heater","65 °C"),s=add("sep3",540,300,"V-101","3-Phase Separator","15 barg, 65 °C"),e1=add("exchanger",760,300,"E-101","Crude/Crude Exchanger"),col=add("column",980,300,"T-101","Stabilizer Column"),p=add("product",1220,300,"","OVERHEAD GAS"),tk=add("tank",980,560,"TK-101","Crude Storage"),wp=add("product",620,500,"","PRODUCED WATER");
  link(f,"e",h,"w",{svc:"Dầu ướt",phase:"mix",std:"b3610",nps:"8",sch:"40",mat:"cs_a106b"});link(h,"e",s,"w",{phase:"mix",T:"65 °C"});link(s,"e",e1,"w",{svc:"Dầu",phase:"oil"});link(e1,"e",col,"w",{phase:"oil"});link(col,"e",p,"w",{svc:"Khí overhead",phase:"gas"});link(col,"s",tk,"n",{svc:"Dầu ổn định",phase:"oil"});link(s,"s",wp,"w",{svc:"Nước",phase:"water"});
  state.meta.project="Ổn định dầu thô (stabilizer)";
 }else if(name==="sep"){
  const f=add("feed",140,330,"","WELL FLUID"),h=add("heater",330,330,"H-101","Inlet Heater","60 °C"),s=add("sep3",540,330,"V-101","3-Phase Separator","30 barg, 60 °C"),pcv=add("valve_control",760,220,"PCV-101","Pressure Control"),pic=add("instrument",760,120,"PIC-101","Pressure Ctrl"),k=add("compressor",950,220,"K-101","Gas Compressor","30 → 90 barg"),gp=add("product",1160,220,"","GAS EXPORT"),pump=add("pump",780,330,"P-101A","Oil Export Pump","15 m³/h, 90 barg"),op=add("product",980,330,"","OIL EXPORT"),wp=add("product",780,480,"","PRODUCED WATER");
  link(f,"e",h,"w",{svc:"Hỗn hợp giếng",phase:"mix",P:"30 barg",T:"40 °C"});link(h,"e",s,"w",{phase:"mix",T:"60 °C"});link(s,"n",pcv,"w",{svc:"Khí",phase:"gas",P:"30 barg"});link(pcv,"e",k,"w",{phase:"gas"});link(pic,"s",pcv,"n",{kind:"signal"});link(k,"e",gp,"w",{svc:"Khí xuất",phase:"gas",P:"90 barg"});link(s,"e",pump,"w",{svc:"Dầu",phase:"oil"});link(pump,"e",op,"w",{svc:"Dầu xuất",phase:"oil",P:"90 barg",flow:"15 m³/h"});link(s,"s",wp,"w",{svc:"Nước sản xuất",phase:"water"});
  state.meta.project="Cụm tách 3 pha + bơm dầu + nén khí";
 }else if(name==="turbo"){
  const st=add("steam_turbine",420,320,"ST-101","Steam Turbine (HP/LP)","HP 40 barg → LP 4 barg",5),k=add("compressor2",880,320,"K-201","2-Stage Gas Compressor","20 → 80 barg",0),hp=add("feed",140,230,"","HP STEAM"),lp=add("product",420,560,"","LP STEAM"),f=add("feed",880,590,"","SUCTION GAS"),o=add("product",1280,320,"","DISCHARGE GAS");
  link(hp,"e",st,"hp",{svc:"Hơi HP",phase:"water",P:"40 barg",T:"400 °C"});link(st,"lp",lp,"n",{svc:"Hơi LP",phase:"water",P:"4 barg"});link(st,"shR",k,"shL",{kind:"shaft",svc:"Trục"});link(f,"n",k,"s",{svc:"Khí hút",phase:"gas",P:"20 barg"});link(k,"e",o,"w",{svc:"Khí nén",phase:"gas",P:"80 barg"});
  state.meta.project="Máy nén 2 cấp dẫn động bằng turbine hơi";
 }else if(name==="chain"){
  const pf=add("platform",140,260,"PF-101","Giàn khai thác","Công suất: 8 MMscfd",3),gp=add("gas_plant",520,260,"GP-101","Nhà máy xử lý khí","Công suất: 5 MMSm³/d"),cs=add("comp_station",900,260,"CS-101","Trạm nén khí"),pr=add("city_gate",1280,260,"PRS-101","Trạm điều áp / đo đếm"),pp=add("power_plant",1280,520,"PP-101","Nhà máy điện khí"),tk=add("lng_tank",520,520,"TK-101","Bồn LNG","Thể tích: 160 000 m³"),sh=add("ship",900,640,"SH-101","Tàu LNG"),rg=add("regas",1280,720,"RV-101","Hóa khí LNG");
  link(pf,"e",gp,"w",{svc:"Khí ướt",phase:"gas",dist:"120 km",std:"b3610",nps:"16",sch:"40",mat:"api5l_x65",cls:"900#"});link(gp,"e",cs,"w",{svc:"Khí thương phẩm",phase:"gas",P:"70 barg",std:"b3610",nps:"24",sch:"STD",mat:"api5l_x65"});link(cs,"e",pr,"w",{svc:"Khí cao áp",phase:"gas",dist:"180 km",std:"b3610",nps:"24",sch:"STD",mat:"api5l_x65"});link(pr,"s",pp,"n",{svc:"Khí cấp điện",phase:"gas",P:"30 barg"});link(gp,"s",tk,"n",{svc:"LNG",phase:"oil",T:"-162 °C"});link(tk,"e",sh,"w",{kind:"sea",svc:"LNG",flow:"3.4 MTPA",dist:"2 500 km"});link(sh,"e",rg,"w",{kind:"sea",svc:"LNG",dist:"≈ 5 ngày"});
  state.meta.project="Chuỗi cung ứng khí: giàn → nhà máy → nén → tiêu thụ / LNG";
 }
 try{state=normalizeState(JSON.parse(snapshot()))}catch(e){}
 commit(_("Nạp mẫu ","Load template ")+name);syncMetaUI();renderAll();fitView();setStatus(name==="blank"?_("Bản vẽ trống.","Blank drawing."):_("Đã nạp mẫu — sửa tag, kéo thiết bị, nối thêm ống. Ctrl+Z để quay lại bản trước.","Template loaded — edit tags, drag devices, connect more pipes. Ctrl+Z to go back."));
}

/* ============ KHỞI ĐỘNG ============ */
(function boot(){
 try{const p=JSON.parse(localStorage.getItem(PKEY)||localStorage.getItem("pfdstudio.rev3.prefs")||"null");
  if(p){if(p.tips===false)TIPS=false;if(p.ui){UI=p.ui;document.documentElement.style.setProperty("--ui",UI)}if(p.hc){HC=true;document.body.classList.add("hc")}
   if(["auto","light","dark"].includes(p.theme))THEME=p.theme;if(p.darkPaper===false)DARKPAPER=false;if(p.lang==="en")LANG="en";if(p.ports)SHOWPORTS=true;
   if(p.units==="US")state.meta.units="US";}
 }catch(e){}
 document.documentElement.lang=LANG;
 try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(THEME==="auto"){applyTheme();renderPalette();renderAll()}})}catch(e){}
 applyTheme();fillStaticSelects();renderPalette();syncMetaUI();syncSettingsUI();
 let ok=false;
 try{const s=localStorage.getItem(KEY)||localStorage.getItem("pfdstudio.rev3.autosave")||localStorage.getItem("pfdstudio.rev2.autosave");if(s){loadData(JSON.parse(s),true);ok=state.nodes.length>0||state.edges.length>0;if(ok)setStatus(_("Đã khôi phục bản vẽ tự lưu lần trước. Dùng Mới / Mẫu nếu muốn bắt đầu lại.","Restored your last auto-saved drawing. Use New / Templates to start over."))}}catch(e){ok=false}
 if(!ok){loadTemplate("sep");resetHistory(_("Mẫu ban đầu","Initial template"))}
 updateHistUI();translateAll();
})();

