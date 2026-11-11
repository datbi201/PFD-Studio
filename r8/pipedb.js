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
function pipeWallLabel(w,units,std){
 const al=w.a&&w.a.length?" / "+w.a.join(" / "):"";
 const tT=units==="US"?r3d(w.t/IN).toFixed(3)+" in":w.t+" mm";
 const sched=(std==="b3610"||std==="b3619");
 if(!sched&&/^[\d.]+$/.test(w.k))return tT;
 const isSch=sched&&/^(10|20|30|40|60|80|100|120|140|160|5S|10S|40S|80S)$/.test(w.k);
 return`${isSch?"Sch ":""}${w.k}${al} — ${tT}`;
}
function pipeCalc(e){
 let od=null,t=null,dn=null,nps=null,schTxt="";
 if(e.std==="custom"){od=+e.od||null;t=+e.wall||null}
 else if(e.std&&PIPE_STD[e.std]){
  const z=pipeSize(e.std,e.nps);if(z){od=z.od;dn=z.dn;nps=z.k;
   const w=z.walls.find(q=>q.k===e.sch||(q.a||[]).includes(e.sch));if(w){t=w.t;schTxt=(w.a&&w.a.length?w.k+"/"+w.a.join("/"):w.k)}}
 }
 if(!od)return null;
 const id=t?r2d(od-2*t):null;
 return{od,t,id,dn,nps,sch:schTxt,mass:(t&&/b3610|b3619|iso|tube|custom/.test(e.std||""))?r2d((od-t)*t*0.02466):null};
}
/* văn bản hiển thị trên bản vẽ theo meta.pipeLabel và đơn vị */
function pipeSpecText(e,mode,units,matShort){
 if(!mode||mode==="none")return"";
 const c=pipeCalc(e);let s="";
 if(c){
  if(units==="US"){s=c.nps?`${npsLabel(c.nps)}"`:`OD ${r3d(c.od/IN)}"`}
  else s=c.dn?`DN${c.dn}`:`Ø${c.od}`;
  if((mode==="sch"||mode==="full")&&c.sch){
   if(e.std==="b3610"||e.std==="b3619")s+=` ${/^\d/.test(c.sch)&&!/[A-Za-z]/.test(c.sch)?"SCH ":""}${c.sch}`;
   else if(/^[\d.]+$/.test(c.sch))s+=` t${units==="US"?r3d(c.t/IN)+'"':c.t}`;
   else s+=` ${c.sch}`;
  }else if((mode==="sch"||mode==="full")&&c.t)s+=` t${units==="US"?r3d(c.t/IN)+'"':c.t}`;
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
