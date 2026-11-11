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
const T_=s=>{if(LANG!=="en")return s;const e=EN[s];if(e!==undefined)return e;const m=/^([A-Z]) — ([\s\S]+)$/.exec(s);return m&&EN[m[2]]!==undefined?m[1]+" — "+EN[m[2]]:s};
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
const UNITS={};                          /* ký hiệu → {fam,f (về đơn vị gốc của họ),sys} */
(function(){
 const F=(fam,list)=>Object.entries(list).forEach(([u,[f,sys]])=>{UNITS[u]={fam,f,sys}});
 F("P",{"barg":[1,"S"],"bara":[1,"S"],"bar":[1,"S"],"kPag":[.01,"S"],"kPaa":[.01,"S"],"kPa":[.01,"S"],"MPag":[10,"S"],"MPaa":[10,"S"],"MPa":[10,"S"],"kg/cm²g":[.980665,"S"],"psig":[.0689476,"U"],"psia":[.0689476,"U"],"psi":[.0689476,"U"]});
 F("Lq",{"m³/h":[1,"S"],"m3/h":[1,"S"],"L/s":[3.6,"S"],"L/min":[.06,"S"],"m³/d":[1/24,"S"],"m3/d":[1/24,"S"],"gpm":[.227125,"U"],"bbl/d":[.158987/24,"U"],"bpd":[.158987/24,"U"],"kbbl/d":[158.987/24,"U"]});
 F("Gs",{"Sm³/h":[24,"S"],"Sm3/h":[24,"S"],"Sm³/d":[1,"S"],"Sm3/d":[1,"S"],"SCMD":[1,"S"],"MSm³/d":[1e3,"S"],"MSCMD":[1e3,"S"],"MMSm³/d":[1e6,"S"],"MMSCMD":[1e6,"S"],"scfh":[.0283168*24,"U"],"scfd":[.0283168,"U"],"Mscfd":[28.3168,"U"],"MMscfd":[28316.8,"U"],"MMscf/d":[28316.8,"U"],"Bscf/d":[28316800,"U"]});
 F("Mf",{"kg/h":[1,"S"],"t/h":[1000,"S"],"kg/s":[3600,"S"],"t/d":[1000/24,"S"],"lb/h":[.45359237,"U"],"klb/h":[453.59237,"U"],"lb/s":[1632.93,"U"],"klb/d":[453.59237/24,"U"]});
 F("Len",{"mm":[.001,"S"],"cm":[.01,"S"],"m":[1,"S"],"km":[1000,"S"],"in":[.0254,"U"],"ft":[.3048,"U"],"mi":[1609.344,"U"]});
 F("Vol",{"m³":[1,"S"],"m3":[1,"S"],"L":[.001,"S"],"ft³":[.0283168,"U"],"ft3":[.0283168,"U"],"gal":[.00378541,"U"],"bbl":[.158987,"U"]});
 F("Area",{"m²":[1,"S"],"m2":[1,"S"],"ft²":[.092903,"U"],"ft2":[.092903,"U"]});
 F("Mass",{"kg":[1,"S"],"lb":[.45359237,"U"]});
 F("Pow",{"kW":[1,"S"],"MW":[1000,"S"],"hp":[.7457,"U"]});
 F("Den",{"kg/m³":[1,"S"],"lb/ft³":[16.0185,"U"]});
 ["°C","degC","°F","degF","K"].forEach(u=>UNITS[u]={fam:"T",sys:(u==="°F"||u==="degF")?"U":"S"});
})();
/* các đại lượng và đơn vị mặc định theo hệ SI / US */
const QTY=[
 {id:"pressure",vi:"Áp suất",en:"Pressure",own:["barg","bara","bar","kPag","kPaa","kPa","MPag","MPaa","MPa","kg/cm²g","psig","psia","psi"],opts:["barg","bara","kPag","MPag","kg/cm²g","psig","psia"],si:"barg",us:"psig"},
 {id:"temperature",vi:"Nhiệt độ",en:"Temperature",own:["°C","degC","°F","degF","K"],opts:["°C","°F","K"],si:"°C",us:"°F"},
 {id:"gasFlow",vi:"Lưu lượng khí (lớn)",en:"Gas flow (large)",own:["MMSm³/d","MMSCMD","MMscfd","MMscf/d","Bscf/d"],opts:["MMSCMD","MMSm³/d","Bscf/d","MMscfd"],si:"MMSCMD",us:"MMscfd"},
 {id:"gasFlowS",vi:"Lưu lượng khí (nhỏ)",en:"Gas flow (small)",own:["Sm³/h","Sm3/h","Sm³/d","Sm3/d","SCMD","MSm³/d","MSCMD","scfh","scfd","Mscfd"],opts:["Sm³/h","Sm³/d","MSm³/d","scfh","scfd","Mscfd"],si:"Sm³/h",us:"scfh"},
 {id:"liquidFlow",vi:"Lưu lượng lỏng",en:"Liquid flow",own:["m³/h","m3/h","L/s","L/min","gpm"],opts:["m³/h","L/s","L/min","gpm"],si:"m³/h",us:"gpm"},
 {id:"liquidRate",vi:"Sản lượng dầu / lỏng theo ngày",en:"Oil / liquid rate (per day)",own:["m³/d","m3/d","bbl/d","bpd","kbbl/d"],opts:["m³/d","kbbl/d","bbl/d"],si:"m³/d",us:"bbl/d"},
 {id:"massFlow",vi:"Lưu lượng khối lượng",en:"Mass flow",own:["kg/h","t/h","kg/s","t/d","lb/h","klb/h","lb/s","klb/d"],opts:["kg/h","t/h","kg/s","t/d","lb/h","klb/h"],si:"kg/h",us:"lb/h"},
 {id:"length",vi:"Chiều dài / chiều cao",en:"Length / height",own:["m","cm","ft"],opts:["m","cm","ft"],si:"m",us:"ft"},
 {id:"distance",vi:"Cự ly (tuyến ống)",en:"Distance (pipeline)",own:["km","mi"],opts:["km","mi"],si:"km",us:"mi"},
 {id:"diameter",vi:"Đường kính",en:"Diameter",own:["mm","in"],opts:["mm","in","cm"],si:"mm",us:"in"},
 {id:"volume",vi:"Thể tích",en:"Volume",own:["m³","m3","L","ft³","ft3","gal","bbl"],opts:["m³","L","bbl","ft³","gal"],si:"m³",us:"bbl"},
 {id:"area",vi:"Diện tích",en:"Area",own:["m²","m2","ft²","ft2"],opts:["m²","ft²"],si:"m²",us:"ft²"},
 {id:"power",vi:"Công suất",en:"Power",own:["kW","MW","hp"],opts:["kW","MW","hp"],si:"kW",us:"hp"},
 {id:"mass",vi:"Khối lượng",en:"Mass",own:["kg","lb"],opts:["kg","lb"],si:"kg",us:"lb"},
 {id:"density",vi:"Khối lượng riêng",en:"Density",own:["kg/m³","lb/ft³"],opts:["kg/m³","lb/ft³"],si:"kg/m³",us:"lb/ft³"},
 {id:"speed",vi:"Tốc độ quay",en:"Rotational speed",own:[],opts:["rpm"],si:"rpm",us:"rpm"},
 {id:"voltage",vi:"Điện áp",en:"Voltage",own:[],opts:["V","kV"],si:"V",us:"V"}];
const QTY_BY=Object.fromEntries(QTY.map(q=>[q.id,q]));
const unitPreset=sys=>Object.fromEntries(QTY.map(q=>[q.id,sys==="US"?q.us:q.si]));
const roleOfUnit=u=>{const q=QTY.find(q=>q.own.includes(u));return q?q.id:null};
function defUnit(role){const m=_metaRef(),d=m&&m.unitsDef&&m.unitsDef[role];return d||unitPreset(m&&m.units)[role]}
/* điền đơn vị mặc định nếu người dùng chỉ gõ số */
const BARE_NUM=/^\s*[-+]?\d[\d.,]*(?:\s*(?:→|->|–|-|—|×|x|to)\s*[-+]?\d[\d.,]*)*\s*$/;
function autoUnit(text,role){const t=String(text??"");if(!role||!BARE_NUM.test(t))return t;return t.trim()+" "+defUnit(role)}
/* tên thông số → đại lượng */
function roleOfParam(name){
 const k=String(name||"").toLowerCase();
 if(/áp suất|pressure/.test(k))return"pressure";if(/nhiệt độ|temperature/.test(k))return"temperature";
 if(/công suất|power|duty/.test(k))return"power";if(/lưu lượng|flow/.test(k))return"liquidFlow";
 if(/thể tích|volume/.test(k))return"volume";if(/khối lượng|mass|weight/.test(k))return"mass";
 if(/diện tích|area/.test(k))return"area";if(/cột áp|head/.test(k))return"length";
 if(/tốc độ|speed/.test(k))return"speed";if(/điện áp|voltage/.test(k))return"voltage";
 if(/đường kính|diameter/.test(k))return"diameter";
 return null;
}
const _unitAlt=Object.keys(UNITS).sort((a,b)=>b.length-a.length).map(u=>u.replace(/[.*+?^${}()|[\]\\\/]/g,"\\$&")).join("|");
const _numP="[-+]?(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)";
const UNIT_RE=new RegExp(`(${_numP})(?:\\s*(→|->|–|—|-|\\s+to\\s+)\\s*(${_numP}))?\\s*(${_unitAlt})(?![A-Za-z0-9³²/])`,"g");
const numVal=s=>parseFloat(String(s).replace(/,/g,""));
function fmtNum(x,isT){if(!isFinite(x))return"0";if(isT)return String(rnd(x,1));const a=Math.abs(x);if(a===0)return"0";return String(parseFloat(x.toPrecision(5)))}
function convVal(v,from,to){
 const A=UNITS[from],B=UNITS[to];if(!A||!B)return v;
 if(A.fam==="T"||B.fam==="T"){
  const c=/°?C|degC/.test(from)?v:(/°?F|degF/.test(from)?(v-32)*5/9:v-273.15);
  return /°?C|degC/.test(to)?c:(/°?F|degF/.test(to)?c*9/5+32:c+273.15);
 }
 return v*A.f/B.f;
}
/* đổi toàn bộ đại lượng trong chuỗi sang hệ đơn vị đích ("SI" | "US") */
function convTarget(u,toSys){
 const want=toSys==="US"?"U":"S",role=roleOfUnit(u),U=UNITS[u];
 if(U.fam==="T")return want==="U"?"°F":"°C";
 if(role){const d=defUnit(role);if(d&&UNITS[d]&&UNITS[d].fam===U.fam&&d!==u)return d;const pr=unitPreset(toSys)[role];if(UNITS[pr])return pr}
 return null;
}
function convertSystem(text,toSys){
 const want=toSys==="US"?"U":"S";
 return String(text??"").replace(UNIT_RE,(m,n1,sep,n2,u)=>{
  const U=UNITS[u];if(!U||U.sys===want)return m;
  if(U.fam==="T"&&u==="K")return m;
  const t=convTarget(u,toSys);if(!t)return m;
  const isT=U.fam==="T";
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
