/* ============ MODULE SƠ ĐỒ — MÔ HÌNH, KIỂU, THƯ VIỆN HÌNH KHỐI ============ */
/* Mọi toạ độ: 1 đv = 0,25 mm (giống PFD). Cỡ chữ lưu bằng pt. Hình học các hình khối bám định nghĩa
   "preset shape" của Office (OOXML) để khi xuất .pptx hình giống hệt trong ứng dụng. */
const DGPT=1/PTU;                                   /* đơn vị bản vẽ trên 1 pt */
const DG_UNITS={mm:["mm",4],cm:["cm",40],in:["inch",101.6],pt:["pt",1/PTU]};   /* tên hiển thị, đv bản vẽ trên 1 đơn vị */
const DG_FONTS=[                                    /* tên, ngăn xếp CSS, ascent, descent, lineGap (em) — dàn dòng giống Office */
 ["Arial","Arial, Helvetica, 'Liberation Sans', sans-serif",.905,.212,.033],
 ["Calibri","Calibri, Carlito, Arial, sans-serif",.75,.25,.22],
 ["Times New Roman","'Times New Roman', Times, 'Liberation Serif', serif",.891,.216,.042],
 ["Cambria","Cambria, Caladea, 'Times New Roman', serif",.95,.222,0],
 ["Segoe UI","'Segoe UI', Tahoma, Arial, sans-serif",1.079,.251,0],
 ["Tahoma","Tahoma, Verdana, sans-serif",1.0,.207,0],
 ["Verdana","Verdana, Geneva, sans-serif",1.005,.21,0],
 ["Georgia","Georgia, 'Times New Roman', serif",.917,.219,0],
 ["Courier New","'Courier New', Courier, 'Liberation Mono', monospace",.833,.3,0],
 ["Consolas","Consolas, 'Courier New', monospace",.743,.257,.17]];
const dgFont=n=>DG_FONTS.find(f=>f[0]===n)||DG_FONTS[0];

/* ---------- kiểu nhanh (bảng màu kiểu Office) ---------- */
const DG_STYLES=[
 {id:"s1",n:"Xanh dương",fl:"#4472C4",ln:"#2F528F",fc:"#FFFFFF"},
 {id:"s2",n:"Cam",fl:"#ED7D31",ln:"#AE5A21",fc:"#FFFFFF"},
 {id:"s3",n:"Xám",fl:"#A5A5A5",ln:"#787878",fc:"#FFFFFF"},
 {id:"s4",n:"Vàng",fl:"#FFC000",ln:"#BF9000",fc:"#000000"},
 {id:"s5",n:"Xanh trời",fl:"#5B9BD5",ln:"#41719C",fc:"#FFFFFF"},
 {id:"s6",n:"Xanh lá",fl:"#70AD47",ln:"#507E32",fc:"#FFFFFF"},
 {id:"s7",n:"Trắng, viền xanh",fl:"#FFFFFF",ln:"#2F528F",fc:"#1F3864"},
 {id:"s8",n:"Xanh nhạt",fl:"#DAE3F3",ln:"#8FAADC",fc:"#1F3864"},
 {id:"s9",n:"Đỏ",fl:"#C00000",ln:"#800000",fc:"#FFFFFF"},
 {id:"s10",n:"Xanh lá nhạt",fl:"#E2F0D9",ln:"#A9D18E",fc:"#375623"},
 {id:"s11",n:"Cam nhạt",fl:"#FBE5D6",ln:"#F4B183",fc:"#833C0B"},
 {id:"s12",n:"Không tô",fl:"",ln:"#404040",fc:"#000000"}];
const dgStyle=id=>DG_STYLES.find(s=>s.id===id)||DG_STYLES[7];

const DG_ARROWS=["none","tri","open","stealth","oval","diamond"];
const DG_ARROW_N={none:"Không",tri:"Tam giác",open:"Mũi tên hở",stealth:"Nhọn (stealth)",oval:"Chấm tròn",diamond:"Hình thoi"};

/* ---------- cài đặt riêng của tài liệu sơ đồ ---------- */
function defaultDgMeta(){return{ff:"Arial",fs:11,gs:10,snap:true,unit:"mm",sty:"s8",cty:"el",cas:"none",cae:"tri",clw:1.25,dir:"down",gapX:36,gapY:56,rl:true,pad:32,pngS:3,pngBg:"white"}}
function cleanDgMeta(m){
 const d=defaultDgMeta();m=m&&typeof m==="object"?m:{};const o={...d};
 o.ff=DG_FONTS.some(f=>f[0]===m.ff)?m.ff:d.ff;o.fs=Math.min(96,Math.max(4,+m.fs||d.fs));o.gs=[2,4,5,10,20,40].includes(+m.gs)?+m.gs:d.gs;o.snap=m.snap!==false;
 o.unit=DG_UNITS[m.unit]?m.unit:"mm";o.sty=DG_STYLES.some(s=>s.id===m.sty)?m.sty:d.sty;o.cty=["el","st","cv"].includes(m.cty)?m.cty:d.cty;
 o.cas=DG_ARROWS.includes(m.cas)?m.cas:d.cas;o.cae=DG_ARROWS.includes(m.cae)?m.cae:d.cae;o.clw=Math.min(12,Math.max(.25,+m.clw||d.clw));
 o.dir=["down","up","right","left"].includes(m.dir)?m.dir:d.dir;o.gapX=Math.min(400,Math.max(8,+m.gapX||d.gapX));o.gapY=Math.min(400,Math.max(8,+m.gapY||d.gapY));
 o.rl=m.rl!==false;o.pad=Math.min(400,Math.max(0,+m.pad>=0?+m.pad:d.pad));o.pngS=[1,2,3,4,6].includes(+m.pngS)?+m.pngS:d.pngS;o.pngBg=m.pngBg==="none"?"none":"white";
 return o;
}

/* ---------- chuẩn hoá dữ liệu sơ đồ ---------- */
const dgNum=(v,d,lo,hi)=>{v=+v;if(!isFinite(v))v=d;return Math.min(hi,Math.max(lo,v))};
const dgCol=(c,d)=>typeof c==="string"&&/^#[0-9a-f]{6}$/i.test(c)?c.toUpperCase():(c===""?"":d);
function cleanDgPara(p){
 const o={};if(!p||typeof p!=="object")return o;
 if(isFinite(+p.fs)&&+p.fs>0)o.fs=dgNum(p.fs,11,3,200);
 ["fb","fi","fu"].forEach(k=>{if(p[k]===true||p[k]===false)o[k]=p[k]});
 if(typeof p.fc==="string"&&/^#[0-9a-f]{6}$/i.test(p.fc))o.fc=p.fc.toUpperCase();
 if(["l","c","r","j"].includes(p.ta))o.ta=p.ta;
 if(["dot","dash","num"].includes(p.bu))o.bu=p.bu;
 return o;
}
function cleanDgShape(h){
 if(!h||typeof h!=="object"||!DG_PRESET[h.k])return null;
 const P=DG_PRESET[h.k],o={id:String(h.id),k:h.k,x:dgNum(h.x,0,-1e6,1e6),y:dgNum(h.y,0,-1e6,1e6),w:dgNum(h.w,P.w,4,20000),h:dgNum(h.h,P.h,4,20000),rot:((+h.rot||0)%360+360)%360};
 if(P.adj!==undefined)o.a=dgNum(h.a,P.adj,P.amin??0,P.amax??1);
 if(P.adj2!==undefined)o.b=dgNum(h.b,P.adj2,P.bmin??0,P.bmax??1);
 o.fl=dgCol(h.fl,"#DAE3F3");o.ln=dgCol(h.ln,"#8FAADC");o.lw=dgNum(h.lw,1,0,24);o.ld=DASHES[h.ld]!==undefined?h.ld:"";
 o.fo=dgNum(h.fo,1,0,1);
 o.tx=String(h.tx??"").slice(0,4000);
 if(Array.isArray(h.tp)&&h.tp.length)o.tp=h.tp.slice(0,60).map(cleanDgPara);
 o.ff=DG_FONTS.some(f=>f[0]===h.ff)?h.ff:"Arial";o.fs=dgNum(h.fs,11,3,200);o.fb=!!h.fb;o.fi=!!h.fi;o.fu=!!h.fu;o.fc=dgCol(h.fc,"#000000")||"#000000";
 o.ta=["l","c","r","j"].includes(h.ta)?h.ta:"c";o.tv=["t","m","b"].includes(h.tv)?h.tv:"m";
 o.mg=Array.isArray(h.mg)&&h.mg.length===4?h.mg.map(v=>dgNum(v,4,0,100)):[7.2,3.6,7.2,3.6];
 o.af=!!h.af;o.ls=dgNum(h.ls,1,.5,3);o.ps=dgNum(h.ps,0,0,60);
 if(h.lock)o.lock=true;
 return o;
}
function cleanDgConn(c,ids){
 if(!c||typeof c!=="object")return null;
 const end=e=>e&&typeof e==="object"&&ids.has(String(e.id))?{id:String(e.id),p:[0,1,2,3].includes(+e.p)?+e.p:0}:null;
 const o={id:String(c.id),s:end(c.s),e:end(c.e)};
 const pt=p=>p&&isFinite(+p.x)&&isFinite(+p.y)?{x:+p.x,y:+p.y}:{x:0,y:0};
 if(!o.s)o.sp=pt(c.sp);
 if(!o.e)o.ep=pt(c.ep);
 o.ty=["el","st","cv"].includes(c.ty)?c.ty:"el";o.adj=dgNum(c.adj,.5,-3,4);
 o.ln=dgCol(c.ln,"#404040")||"#404040";o.lw=dgNum(c.lw,1.25,.25,12);o.ld=DASHES[c.ld]!==undefined?c.ld:"";
 o.as=DG_ARROWS.includes(c.as)?c.as:"none";o.ae=DG_ARROWS.includes(c.ae)?c.ae:"none";
 o.tx=String(c.tx??"").slice(0,300);o.lp=dgNum(c.lp,.5,0,1);
 o.ff=DG_FONTS.some(f=>f[0]===c.ff)?c.ff:"Arial";o.fs=dgNum(c.fs,10,3,100);o.fc=dgCol(c.fc,"#000000")||"#000000";o.fb=!!c.fb;o.bg=c.bg!==false;
 if(c.tree)o.tree=true;
 return o;
}
function cleanDg(d){
 d=d&&typeof d==="object"?d:{};
 const shapes=(Array.isArray(d.shapes)?d.shapes:[]).slice(0,5000).map(cleanDgShape).filter(Boolean);
 const ids=new Set(shapes.map(s=>s.id));
 const conns=(Array.isArray(d.conns)?d.conns:[]).slice(0,10000).map(c=>cleanDgConn(c,ids)).filter(Boolean);
 return{shapes,conns};
}

/* ============ THƯ VIỆN HÌNH KHỐI (preset) ============ */
/* path(w,h,a,b)→chuỗi SVG; ex(w,h,a,b)→nét/tô phụ [{d,fill:"none"|"dark"|"light",stroke:bool}];
   tr(w,h,a,b)→[l,t,r,b] vùng chữ; exact = vùng chữ trùng Office; st→4 điểm nối [trên,phải,dưới,trái];
   glue→chỉ số điểm nối trong Office (trên,phải,dưới,trái) hoặc null = không dính khi xuất .pptx */
const _f=n=>Math.round(n*1000)/1000;
const _arc=(rx,ry,x,y,sw)=>`A${_f(rx)} ${_f(ry)} 0 0 ${sw} ${_f(x)} ${_f(y)}`;
const _poly=(...p)=>"M"+p.map(q=>_f(q[0])+" "+_f(q[1])).join("L")+"Z";
const _ss=(w,h)=>Math.min(w,h);
const _mid4=(w,h)=>[[w/2,0],[w,h/2],[w/2,h],[0,h/2]];
const _full=(w,h)=>[0,0,w,h];
const _RG=[0,3,2,1];                                /* thứ tự điểm nối Office của hình chữ nhật: trên, trái, dưới, phải */
const _rectP=(w,h)=>_poly([0,0],[w,0],[w,h],[0,h]);
const _cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const DG_PRESET={};
const DG_CATS=[["org","Sơ đồ tổ chức","Org chart"],["basic","Hình cơ bản","Basic shapes"],["flow","Lưu đồ","Flowchart"],["arrow","Mũi tên khối & chú thích","Block arrows & callouts"],["misc","Khác","Other"]];
function dgReg(id,vi,en,cat,prst,w,h,o){DG_PRESET[id]=Object.assign({id,vi,en,cat,prst,w,h,exact:true,glue:null,st:_mid4,tr:_full},o)}

/* --- sơ đồ tổ chức --- */
dgReg("org_person","Hộp nhân sự (tên + chức danh)","Person box (name + title)","org","roundRect",176,72,{adj:.12,amin:0,amax:.5,glue:_RG,
 path:(w,h,a)=>DG_PRESET.roundRect.path(w,h,a),tr:(w,h,a)=>DG_PRESET.roundRect.tr(w,h,a),
 sample:"**Nguyễn Văn A**\nGiám đốc",sty:"s1"});
dgReg("org_dept","Hộp phòng ban","Department box","org","rect",176,60,{glue:_RG,path:_rectP,sample:"**Phòng Kỹ thuật**",sty:"s8"});
dgReg("org_pos","Hộp chức danh (viền)","Position box (outlined)","org","rect",160,56,{glue:_RG,path:_rectP,sample:"Trưởng phòng",sty:"s7"});

/* --- hình cơ bản --- */
dgReg("rect","Hình chữ nhật","Rectangle","basic","rect",160,64,{glue:_RG,path:_rectP});
dgReg("roundRect","Chữ nhật bo góc","Rounded rectangle","basic","roundRect",160,64,{adj:.16667,amin:0,amax:.5,glue:_RG,
 path:(w,h,a)=>{const r=_ss(w,h)*_cl(a,0,.5);return`M${_f(r)} 0H${_f(w-r)}${_arc(r,r,w,r,1)}V${_f(h-r)}${_arc(r,r,w-r,h,1)}H${_f(r)}${_arc(r,r,0,h-r,1)}V${_f(r)}${_arc(r,r,r,0,1)}Z`},
 tr:(w,h,a)=>{const i=_ss(w,h)*_cl(a,0,.5)*.29289;return[i,i,w-i,h-i]}});
dgReg("ellipse","Elip / hình tròn","Ellipse / circle","basic","ellipse",120,80,{glue:[0,6,4,2],
 path:(w,h)=>`M0 ${_f(h/2)}${_arc(w/2,h/2,w,h/2,1)}${_arc(w/2,h/2,0,h/2,1)}Z`,tr:(w,h)=>[w*.14645,h*.14645,w*.85355,h*.85355]});
dgReg("diamond","Hình thoi (quyết định)","Diamond (decision)","basic","diamond",144,96,{glue:_RG,
 path:(w,h)=>_poly([w/2,0],[w,h/2],[w/2,h],[0,h/2]),tr:(w,h)=>[w/4,h/4,w*3/4,h*3/4]});
dgReg("triangle","Tam giác","Triangle","basic","triangle",120,104,{adj:.5,amin:0,amax:1,
 path:(w,h,a)=>_poly([0,h],[w*a,0],[w,h]),tr:(w,h,a)=>[w*a/2,h/2,w*a/2+w/2,h],
 st:(w,h,a)=>[[w*a,0],[(w*a+w)/2,h/2],[w/2,h],[w*a/2,h/2]]});
dgReg("rtTriangle","Tam giác vuông","Right triangle","basic","rtTriangle",120,104,{exact:false,
 path:(w,h)=>_poly([0,h],[0,0],[w,h]),tr:(w,h)=>[0,h/2,w/2,h],st:(w,h)=>[[0,0],[w/2,h/2],[w/2,h],[0,h/2]]});
dgReg("parallelogram","Hình bình hành","Parallelogram","basic","parallelogram",160,64,{adj:.25,amin:0,amax:1.5,exact:false,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return _poly([0,h],[x,0],[w,0],[w-x,h])},
 tr:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[x*.6,0,w-x*.6,h]},
 st:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[[(w+x)/2,0],[w-x/2,h/2],[(w-x)/2,h],[x/2,h/2]]}});
dgReg("trapezoid","Hình thang","Trapezoid","basic","trapezoid",160,64,{adj:.25,amin:0,amax:1.5,exact:false,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5*w/_ss(w,h));return _poly([0,h],[x,0],[w-x,0],[w,h])},
 tr:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5*w/_ss(w,h));return[x*.75,h*.25,w-x*.75,h]},
 st:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5*w/_ss(w,h));return[[w/2,0],[w-x/2,h/2],[w/2,h],[x/2,h/2]]}});
dgReg("hexagon","Lục giác","Hexagon","basic","hexagon",160,80,{adj:.25,amin:0,amax:.6,exact:false,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5*w/_ss(w,h));return _poly([0,h/2],[x,0],[w-x,0],[w,h/2],[w-x,h],[x,h])},tr:(w,h)=>[w/8,h/8,w*7/8,h*7/8]});
dgReg("octagon","Bát giác","Octagon","basic","octagon",120,120,{adj:.29289,amin:0,amax:.5,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5);return _poly([0,x],[x,0],[w-x,0],[w,x],[w,h-x],[w-x,h],[x,h],[0,h-x])},
 tr:(w,h,a)=>{const i=_ss(w,h)*_cl(a,0,.5)/2;return[i,i,w-i,h-i]}});
dgReg("pentagon","Ngũ giác đều","Regular pentagon","basic","pentagon",120,114,{exact:false,
 path:(w,h)=>_poly([0,.38197*h],[w/2,0],[w,.38197*h],[.80902*w,h],[.19098*w,h]),tr:(w,h)=>[w*.1,h*.2,w*.9,h*.95],
 st:(w,h)=>[[w/2,0],[w*.9,.38197*h],[w/2,h],[w*.1,.38197*h]]});
dgReg("plus","Dấu cộng","Cross","basic","plus",100,100,{adj:.25,amin:0,amax:.5,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5),X=w-x,Y=h-x;return _poly([0,x],[x,x],[x,0],[X,0],[X,x],[w,x],[w,Y],[X,Y],[X,h],[x,h],[x,Y],[0,Y])},
 tr:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,.5);return[x,x,w-x,h-x]}});
dgReg("can","Trụ / cơ sở dữ liệu","Cylinder / database","basic","can",100,120,{adj:.25,amin:0,amax:.5,
 path:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,.5*h/_ss(w,h))/2;return`M0 ${_f(y)}${_arc(w/2,y,w,y,1)}V${_f(h-y)}${_arc(w/2,y,0,h-y,1)}Z`},
 ex:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,.5*h/_ss(w,h))/2;return[{d:`M0 ${_f(y)}${_arc(w/2,y,w,y,0)}${_arc(w/2,y,0,y,0)}Z`,fill:"light",stroke:true}]},
 tr:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,.5*h/_ss(w,h))/2;return[0,2*y,w,h-y]}});
dgReg("cube","Khối hộp","Cube","basic","cube",120,104,{adj:.25,amin:0,amax:1,
 path:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,1);return _poly([0,y],[y,0],[w,0],[w,h-y],[w-y,h],[0,h])},
 ex:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,1);return[{d:_poly([0,y],[y,0],[w,0],[w-y,y]),fill:"light",stroke:true},{d:_poly([w-y,y],[w,0],[w,h-y],[w-y,h]),fill:"dark",stroke:true},{d:`M0 ${_f(y)}H${_f(w-y)}V${_f(h)}`,fill:"none",stroke:true}]},
 tr:(w,h,a)=>{const y=_ss(w,h)*_cl(a,0,1);return[0,y,w-y,h]}});
dgReg("foldedCorner","Ghi chú (góc gập)","Note (folded corner)","basic","foldedCorner",144,96,{adj:.16667,amin:0,amax:.5,
 path:(w,h,a)=>{const d=_ss(w,h)*_cl(a,0,.5);return _poly([0,0],[w,0],[w,h-d],[w-d,h],[0,h])},
 ex:(w,h,a)=>{const d=_ss(w,h)*_cl(a,0,.5);return[{d:_poly([w-d,h],[w,h-d],[w-d,h-d]),fill:"dark",stroke:true}]},
 tr:(w,h,a)=>[0,0,w,h-_ss(w,h)*_cl(a,0,.5)]});

/* --- lưu đồ --- */
dgReg("fcProcess","Quá trình","Process","flow","flowChartProcess",160,64,{glue:_RG,path:_rectP});
dgReg("fcAlt","Quá trình thay thế","Alternate process","flow","flowChartAlternateProcess",160,64,{exact:false,
 path:(w,h)=>DG_PRESET.roundRect.path(w,h,.16667),tr:(w,h)=>DG_PRESET.roundRect.tr(w,h,.16667)});
dgReg("fcDecision","Quyết định","Decision","flow","flowChartDecision",144,96,{glue:_RG,
 path:(w,h)=>_poly([w/2,0],[w,h/2],[w/2,h],[0,h/2]),tr:(w,h)=>[w/4,h/4,w*3/4,h*3/4]});
dgReg("fcTerm","Bắt đầu / Kết thúc","Terminator","flow","flowChartTerminator",160,56,{glue:_RG,
 path:(w,h)=>{const r=w*3475/21600;return`M${_f(r)} 0H${_f(w-r)}${_arc(r,h/2,w-r,h,1)}H${_f(r)}${_arc(r,h/2,r,0,1)}Z`},
 tr:(w,h)=>[w*1018/21600,h*3163/21600,w*20582/21600,h*18437/21600]});
dgReg("fcData","Dữ liệu vào/ra","Data (input/output)","flow","flowChartInputOutput",160,64,{exact:false,
 path:(w,h)=>_poly([0,h],[w/5,0],[w,0],[w*4/5,h]),tr:(w,h)=>[w*.2,0,w*.8,h],st:(w,h)=>[[w*.6,0],[w*.9,h/2],[w*.4,h],[w*.1,h/2]]});
dgReg("fcDoc","Tài liệu","Document","flow","flowChartDocument",160,72,{exact:false,
 path:(w,h)=>`M0 0H${_f(w)}V${_f(h*17322/21600)}C${_f(w*.5)} ${_f(h*17322/21600)} ${_f(w*.5)} ${_f(h*23922/21600)} 0 ${_f(h*20172/21600)}Z`,
 tr:(w,h)=>[0,0,w,h*17322/21600],st:(w,h)=>[[w/2,0],[w,h*17322/21600/2],[w/2,h*18322/21600],[0,h*17322/21600/2]]});
dgReg("fcPre","Quá trình định nghĩa trước","Predefined process","flow","flowChartPredefinedProcess",160,64,{glue:_RG,
 path:_rectP,ex:(w,h)=>[{d:`M${_f(w/8)} 0V${_f(h)}M${_f(w*7/8)} 0V${_f(h)}`,fill:"none",stroke:true}],tr:(w,h)=>[w/8,0,w*7/8,h]});
dgReg("fcManual","Nhập thủ công","Manual input","flow","flowChartManualInput",160,64,{exact:false,
 path:(w,h)=>_poly([0,h/5],[w,0],[w,h],[0,h]),tr:(w,h)=>[0,h*.2,w,h]});
dgReg("fcPrep","Chuẩn bị","Preparation","flow","flowChartPreparation",160,64,{exact:false,
 path:(w,h)=>_poly([0,h/2],[w/5,0],[w*4/5,0],[w,h/2],[w*4/5,h],[w/5,h]),tr:(w,h)=>[w/5,0,w*4/5,h]});
dgReg("fcDelay","Trì hoãn","Delay","flow","flowChartDelay",140,64,{exact:false,
 path:(w,h)=>`M0 0H${_f(w/2)}${_arc(w/2,h/2,w/2,h,1)}H0Z`,tr:(w,h)=>[0,0,w*.85,h]});
dgReg("fcDisplay","Hiển thị","Display","flow","flowChartDisplay",160,64,{exact:false,
 path:(w,h)=>`M0 ${_f(h/2)}L${_f(w/6)} 0H${_f(w*5/6)}${_arc(w/6,h/2,w*5/6,h,1)}H${_f(w/6)}Z`,tr:(w,h)=>[w/6,0,w*5/6,h]});
dgReg("fcConn","Điểm nối","Connector (circle)","flow","flowChartConnector",44,44,{glue:[0,6,4,2],
 path:(w,h)=>`M0 ${_f(h/2)}${_arc(w/2,h/2,w,h/2,1)}${_arc(w/2,h/2,0,h/2,1)}Z`,tr:(w,h)=>[w*.14645,h*.14645,w*.85355,h*.85355],sample:"A"});
dgReg("fcOff","Liên kết sang trang","Off-page connector","flow","flowChartOffpageConnector",64,72,{exact:false,
 path:(w,h)=>_poly([0,0],[w,0],[w,h*.8],[w/2,h],[0,h*.8]),tr:(w,h)=>[0,0,w,h*.8],sample:"B"});
dgReg("fcStore","Lưu trữ nội bộ","Internal storage","flow","flowChartInternalStorage",140,80,{exact:false,
 path:_rectP,ex:(w,h)=>[{d:`M${_f(w/8)} 0V${_f(h)}M0 ${_f(h/8)}H${_f(w)}`,fill:"none",stroke:true}],tr:(w,h)=>[w/8,h/8,w,h]});
dgReg("fcOr","Hoặc","Or","flow","flowChartOr",48,48,{glue:[0,6,4,2],
 path:(w,h)=>`M0 ${_f(h/2)}${_arc(w/2,h/2,w,h/2,1)}${_arc(w/2,h/2,0,h/2,1)}Z`,
 ex:(w,h)=>[{d:`M${_f(w/2)} 0V${_f(h)}M0 ${_f(h/2)}H${_f(w)}`,fill:"none",stroke:true}],tr:(w,h)=>[w*.14645,h*.14645,w*.85355,h*.85355]});
dgReg("fcSum","Giao điểm","Summing junction","flow","flowChartSummingJunction",48,48,{glue:[0,6,4,2],
 path:(w,h)=>`M0 ${_f(h/2)}${_arc(w/2,h/2,w,h/2,1)}${_arc(w/2,h/2,0,h/2,1)}Z`,
 ex:(w,h)=>{const a=w*.14645,b=w*.85355,c=h*.14645,d=h*.85355;return[{d:`M${_f(a)} ${_f(c)}L${_f(b)} ${_f(d)}M${_f(b)} ${_f(c)}L${_f(a)} ${_f(d)}`,fill:"none",stroke:true}]},tr:(w,h)=>[w*.14645,h*.14645,w*.85355,h*.85355]});

/* --- mũi tên khối & chú thích --- */
function _arrowPts(w,h,a,b,dir){                    /* trả về đa giác mũi tên khối theo hướng right/left/up/down */
 const horiz=dir==="right"||dir==="left",L=horiz?w:h,B=horiz?h:w;
 const hl=Math.min(L,_ss(w,h)*_cl(b,0,5)),t=B*_cl(a,0,1),y1=(B-t)/2,y2=y1+t,x1=L-hl;
 const P=[[0,y1],[x1,y1],[x1,0],[L,B/2],[x1,B],[x1,y2],[0,y2]];
 return P.map(([u,v])=>{
  if(dir==="right")return[u,v];if(dir==="left")return[L-u,v];
  if(dir==="down")return[v,u];return[v,L-u]});
}
[["right","Mũi tên phải","Right arrow","rightArrow"],["left","Mũi tên trái","Left arrow","leftArrow"],["up","Mũi tên lên","Up arrow","upArrow"],["down","Mũi tên xuống","Down arrow","downArrow"]].forEach(([d,vi,en,ps])=>{
 const hz=d==="right"||d==="left";
 dgReg("arrow_"+d,vi,en,"arrow",ps,hz?128:72,hz?72:128,{adj:.5,amin:0,amax:1,adj2:.5,bmin:0,bmax:1,exact:false,
  path:(w,h,a,b)=>_poly(..._arrowPts(w,h,a,b,d)),
  tr:(w,h,a,b)=>{const hl=Math.min(hz?w:h,_ss(w,h)*_cl(b,0,5)),t=(hz?h:w)*_cl(a,0,1),y1=((hz?h:w)-t)/2;
   if(d==="right")return[0,y1,w-hl*.5,y1+t];if(d==="left")return[hl*.5,y1,w,y1+t];if(d==="down")return[y1,0,y1+t,h-hl*.5];return[y1,hl*.5,y1+t,h]},
  st:(w,h)=>d==="right"?[[w*.4,h*.25],[w,h/2],[w*.4,h*.75],[0,h/2]]:d==="left"?[[w*.6,h*.25],[0,h/2],[w*.6,h*.75],[w,h/2]]:d==="down"?[[w/2,0],[w*.75,h*.4],[w/2,h],[w*.25,h*.4]]:[[w/2,0],[w*.75,h*.6],[w/2,h],[w*.25,h*.6]]});
});
dgReg("chevron","Chevron (bước quy trình)","Chevron (process step)","arrow","chevron",144,64,{adj:.5,amin:0,amax:1,exact:false,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return _poly([0,0],[w-x,0],[w,h/2],[w-x,h],[0,h],[x,h/2])},
 tr:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[x,0,w-x,h]},
 st:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[[(w-x)/2,0],[w,h/2],[(w-x)/2,h],[x,h/2]]},sty:"s5"});
dgReg("homePlate","Mũi tên ngũ giác","Pentagon arrow","arrow","homePlate",144,64,{adj:.5,amin:0,amax:1,exact:false,
 path:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return _poly([0,0],[w-x,0],[w,h/2],[w-x,h],[0,h])},
 tr:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[0,0,w-x/2,h]},
 st:(w,h,a)=>{const x=_ss(w,h)*_cl(a,0,w/_ss(w,h));return[[(w-x)/2,0],[w,h/2],[(w-x)/2,h],[0,h/2]]},sty:"s5"});
dgReg("callout","Chú thích (bong bóng chữ nhật)","Callout (rectangular)","arrow","wedgeRectCallout",160,72,{adj:-.20833,amin:-3,amax:3,adj2:.625,bmin:-3,bmax:3,
 path:(w,h,a,b)=>{
  const dx=w*a,dy=h*b,xp=w/2+dx,yp=h/2+dy,dq=dx*h/w,dz=Math.abs(dy)-Math.abs(dq);
  const x1=w*(dx>0?7:2)/12,x2=w*(dx>0?10:5)/12,y1=h*(dy>0?7:2)/12,y2=h*(dy>0?10:5)/12;
  const xl=dz>0?0:(dx>0?0:xp),xt=dz>0?(dy>0?x1:xp):x1,xr=dz>0?w:(dx>0?xp:w),xb=dz>0?(dy>0?xp:x1):x1;
  const yl=dz>0?y1:(dx>0?y1:yp),yt=dz>0?(dy>0?0:yp):0,yr=dz>0?y1:(dx>0?yp:y1),yb=dz>0?(dy>0?yp:h):h;
  return _poly([0,0],[x1,0],[xt,yt],[x2,0],[w,0],[w,y1],[xr,yr],[w,y2],[w,h],[x2,h],[xb,yb],[x1,h],[0,h],[0,y2],[xl,yl],[0,y1]);
 },glue:null});

/* --- khác --- */
dgReg("text","Hộp văn bản","Text box","misc","rect",160,48,{path:_rectP,glue:_RG,noFill:true,sample:"Văn bản"});
dgReg("frame","Khung nhóm (đường đứt)","Group frame (dashed)","misc","rect",320,200,{path:_rectP,glue:_RG,noFill:true,dashed:true,sample:"**Nhóm**"});
