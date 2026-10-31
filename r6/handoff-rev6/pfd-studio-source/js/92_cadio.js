/* ============ SimCAD — DXF (R12 ASCII), MÔ TẢ BẰNG CHỮ ============ */
const ACI_BASE={1:"#ff0000",2:"#ffff00",3:"#00ff00",4:"#00ffff",5:"#0000ff",6:"#ff00ff",7:"#17202a",8:"#808080",9:"#c0c0c0"};
function aciHex(n){
 n=+n;if(ACI_BASE[n])return ACI_BASE[n];
 if(n>=250&&n<=255){const g=[51,91,132,173,214,255][n-250];return"#"+[g,g,g].map(v=>v.toString(16).padStart(2,"0")).join("")}
 if(n>=10&&n<=249){
  const idx=Math.floor((n-10)/10),p=(n-10)%10,h=idx*15,v=[1,1,.65,.65,.5,.5,.3,.3,.15,.15][p],s=[1,.5,1,.5,1,.5,1,.5,1,.5][p];
  const f=k=>{const a=(k+h/60)%6,x=v*(1-s*Math.max(0,Math.min(a,4-a,1)));return Math.round(x*255)};
  return"#"+[f(5),f(3),f(1)].map(x=>x.toString(16).padStart(2,"0")).join("");
 }
 return"#17202a";
}
function hexAci(hex){
 const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex||"");if(!m)return 7;
 const c=[parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];
 let best=7,bd=1e9;
 [[1,255,0,0],[2,255,255,0],[3,0,255,0],[4,0,255,255],[5,0,0,255],[6,255,0,255],[7,23,32,42],[8,128,128,128],[9,192,192,192]].forEach(a=>{const d=(c[0]-a[1])**2+(c[1]-a[2])**2+(c[2]-a[3])**2;if(d<bd){bd=d;best=a[0]}});
 return best;
}
const DXF_LT={"":"CONTINUOUS",dash:"DASHED",dot:"DOT",dd:"DASHDOT"};
const DXF_INS={mm:4,cm:5,m:6,in:1,ft:2};

function exportDXF(){
 const c=cadCfg(),k=cadWPU(),out=[];
 const g=(code,val)=>out.push(String(code),String(val));
 const U=p=>w2u(p),f=v=>(Math.round(v*1e5)/1e5).toString();
 const layerName=id=>String(id).replace(/[^A-Za-z0-9_$\-]/g,"_").slice(0,31)||"0";
 const lay=h=>layerName(h.lay&&c.layers.some(l=>l.id===h.lay)?h.lay:"0");
 const layObj=h=>c.layers.find(l=>l.id===h.lay)||c.layers[0];
 const common=(h,type)=>{g(0,type);g(8,lay(h));const L=layObj(h);if(String(h.col).toLowerCase()!==L.col.toLowerCase())g(62,hexAci(h.col));if((h.dash||"")!==(L.dash||"")&&h.dash)g(6,DXF_LT[h.dash])};
 const line=(h,a,b)=>{common(h,"LINE");g(10,f(a.x));g(20,f(a.y));g(30,0);g(11,f(b.x));g(21,f(b.y));g(31,0)};
 const poly=(h,pts,closed)=>{common(h,"POLYLINE");g(66,1);g(10,0);g(20,0);g(30,0);g(70,closed?1:0);pts.forEach(p=>{g(0,"VERTEX");g(8,lay(h));g(10,f(p.x));g(20,f(p.y));g(30,0)});g(0,"SEQEND");g(8,lay(h))};
 const dxfStr=s=>String(s).replace(/[^\x20-\x7e]/g,ch=>"\\U+"+ch.charCodeAt(0).toString(16).toUpperCase().padStart(4,"0"));
 const text=(h,x,y,hgt,str,rotDeg,al)=>{common(h,"TEXT");g(10,f(x));g(20,f(y));g(30,0);g(40,f(hgt));g(1,dxfStr(str));if(rotDeg)g(50,f(rotDeg));if(al){g(72,al==="l"?0:al==="r"?2:1);g(11,f(x));g(21,f(y));g(31,0);g(73,al==="m"?2:0)}};
 // HEADER
 g(0,"SECTION");g(2,"HEADER");g(9,"$ACADVER");g(1,"AC1009");g(9,"$INSUNITS");g(70,DXF_INS[c.unit]||4);g(0,"ENDSEC");
 // TABLES
 g(0,"SECTION");g(2,"TABLES");
 g(0,"TABLE");g(2,"LTYPE");g(70,4);
 [["CONTINUOUS","Solid line",[]],["DASHED","Dashed",[6,-3]],["DOT","Dot",[.5,-3]],["DASHDOT","Dash dot",[6,-2,.5,-2]]].forEach(t=>{g(0,"LTYPE");g(2,t[0]);g(70,0);g(3,t[1]);g(72,65);g(73,t[2].length);g(40,t[2].reduce((s,v)=>s+Math.abs(v),0));t[2].forEach(v=>g(49,v))});
 g(0,"ENDTAB");
 g(0,"TABLE");g(2,"LAYER");g(70,c.layers.length);
 c.layers.forEach(l=>{g(0,"LAYER");g(2,layerName(l.id));g(70,l.lock?4:0);g(62,(l.vis?1:-1)*hexAci(l.col));g(6,DXF_LT[l.dash||""])});
 g(0,"ENDTAB");
 g(0,"TABLE");g(2,"STYLE");g(70,1);g(0,"STYLE");g(2,"STANDARD");g(70,0);g(40,0);g(41,1);g(50,0);g(71,0);g(42,2.5);g(3,"txt");g(4,"");g(0,"ENDTAB");
 g(0,"ENDSEC");
 // ENTITIES
 g(0,"SECTION");g(2,"ENTITIES");
 const mmPerWorld=1/MM,realPerWorld=1/k; // 1 đơn vị bản vẽ = realPerWorld đơn vị thực
 state.shapes.forEach(h=>{
  if(!layVis(h))return;const P=h.pts.map(U);
  switch(h.t){
   case"line":case"arrow":line(h,P[0],P[P.length-1]);break;
   case"rect":case"ellipse":case"poly":case"pen":{
    if(h.t==="rect"||h.t==="ellipse"){poly(h,shapePoly(h).pts.map(U),true)}
    else poly(h,P,h.t==="poly"&&h.closed);break}
   case"circle":{common(h,"CIRCLE");g(10,f(P[0].x));g(20,f(P[0].y));g(30,0);g(40,f(hyp(P[0],P[1])));break}
   case"arc":{
    const ga=arcGeom(P[0],P[1],P[2]);
    if(!ga){line(h,P[0],P[2]);break}
    let s=ga.a0,e=Math.atan2(P[2].y-ga.cy,P[2].x-ga.cx);if(!ga.sweep){const t=s;s=e;e=t}
    const dg=a=>(((a*180/Math.PI)%360)+360)%360;
    common(h,"ARC");g(10,f(ga.cx));g(20,f(ga.cy));g(30,0);g(40,f(ga.r));g(50,f(dg(s)));g(51,f(dg(e)));break}
   case"dim":{
    const d=dimGeom(h);
    d.lines.concat(d.ext).forEach(l=>line(h,U(l[0]),U(l[1])));
    d.arrows.forEach(a=>{const S=dimParams().S,t=a.tip,dd=a.dir,px=-dd.y,py=dd.x,hw=S/6,bx=t.x+dd.x*S,by=t.y+dd.y*S;poly(h,[t,{x:bx+px*hw,y:by+py*hw},{x:bx-px*hw,y:by-py*hw}].map(U),true)});
    if(d.text)text(h,U(d.text).x,U(d.text).y,dimParams().TH*realPerWorld*.72,d.text.str,-d.text.ang,d.text.anchor==="middle"?"c":d.text.anchor==="start"?"l":"r");
    break}
   case"hatch":{
    if(h.hpat==="solid"){poly(h,P,true);(h.rings||[]).forEach(r=>poly(h,r.map(U),true))}
    else{poly(h,P,true);(h.rings||[]).forEach(r=>poly(h,r.map(U),true));hatchSegs(h).forEach(s=>line(h,U(s[0]),U(s[1])))}
    break}
  }
 });
 state.nodes.forEach(n=>{
  if(n.type!=="text"||!layVis(n))return;
  const st=textStyle(n),lines=String(n.title||"").split("\n"),d=textDef(n),fu=st.fz/PTU,lh=fu*1.28;
  const hgtReal=fu*.72*realPerWorld,pseudo={lay:n.lay,col:n.col||"#17202a",dash:""};
  lines.forEach((l,i)=>{if(!l)return;const x=st.al==="l"?n.x-d.w/2+9:st.al==="r"?n.x+d.w/2-9:n.x,y=n.y-d.h/2+5+fu+i*lh;const u=U({x,y});text(pseudo,u.x,u.y,hgtReal,l,-(n.rot||0),st.al)});
 });
 g(0,"ENDSEC");g(0,"EOF");
 const txt=out.join("\r\n")+"\r\n";
 dl(new Blob([txt],{type:"application/dxf"}),fname(".dxf"));
}

function parseDXF(text){
 const L=String(text).split(/\r?\n/),rec=[];
 for(let i=0;i+1<L.length;i+=2)rec.push([parseInt(L[i].trim(),10),L[i+1]]);
 return rec;
}
function importDXFText(text){
 const rec=parseDXF(text);let i=0;const c=cadCfg();
 const num=v=>parseFloat(String(v).trim());
 let ins=null,section="",table="";const lays={},ents=[];
 // header + tables + entities
 while(i<rec.length){
  const[cd,v]=rec[i];
  if(cd===0&&v.trim()==="SECTION"){section=(rec[i+1]&&rec[i+1][1]||"").trim();i+=2;continue}
  if(cd===0&&v.trim()==="ENDSEC"){section="";i++;continue}
  if(section==="HEADER"&&cd===9&&v.trim()==="$INSUNITS"){ins=parseInt((rec[i+1]||[0,"0"])[1],10);i+=2;continue}
  if(section==="TABLES"){
   if(cd===0&&v.trim()==="LAYER"){let name="",col=7,j=i+1;while(j<rec.length&&rec[j][0]!==0){if(rec[j][0]===2)name=rec[j][1].trim();if(rec[j][0]===62)col=parseInt(rec[j][1],10);j++}if(name)lays[name]={col:Math.abs(col),off:col<0};i=j;continue}
  }
  if(section==="ENTITIES"&&cd===0){
   const type=v.trim(),e={type,g:{},pts:[],vs:[]};let j=i+1;
   while(j<rec.length&&rec[j][0]!==0){const[a,b]=rec[j];if(a===10||a===20){}e.g[a]=b;if(a===10)e.pts.push({x:num(b),y:0});else if(a===20&&e.pts.length)e.pts[e.pts.length-1].y=num(b);j++}
   if(type==="POLYLINE"){
    while(j<rec.length&&!(rec[j][0]===0&&rec[j][1].trim()==="SEQEND")){
     if(rec[j][0]===0&&rec[j][1].trim()==="VERTEX"){let vx=0,vy=0,k=j+1;while(k<rec.length&&rec[k][0]!==0){if(rec[k][0]===10)vx=num(rec[k][1]);if(rec[k][0]===20)vy=num(rec[k][1]);k++}e.vs.push({x:vx,y:vy});j=k}else j++;
    }
    while(j<rec.length&&!(rec[j][0]===0&&rec[j][1].trim()!=="SEQEND"))j++;
   }
   ents.push(e);i=j;continue;
  }
  i++;
 }
 if(!ents.length)throw new Error(_("Không tìm thấy đối tượng nào trong tệp DXF (ENTITIES).","No entities found in the DXF file (ENTITIES)."));
 // đổi sang đơn vị thực của bản vẽ
 const insMm={1:25.4,2:304.8,4:1,5:10,6:1000}[ins]||CAD_UNITS[c.unit],kc=insMm/CAD_UNITS[c.unit];
 const R=v=>v*kc,P=p=>({x:R(p.x),y:R(p.y)});
 const cvt=[];let skipped={};
 const addLayerIfNeeded=name=>{
  const id=String(name||"0").replace(/[^A-Za-z0-9_$\-]/g,"_").slice(0,24)||"0";
  if(!c.layers.some(l=>l.id===id)){const ld=lays[name]||{col:7};c.layers.push({id,n:String(name||id).slice(0,60),col:aciHex(ld.col),vis:!(ld.off),lock:false,dash:"",sw:2})}
  return id;
 };
 const colOf=(e,id)=>{const cc=e.g[62]!==undefined?parseInt(e.g[62],10):256;const L=c.layers.find(l=>l.id===id);return(cc>=1&&cc<=255)?aciHex(cc):(L?L.col:"#17202a")};
 ents.forEach(e=>{
  const id=addLayerIfNeeded((e.g[8]||"0").trim()),col=colOf(e,id),base={lay:id,col};
  const push=(t,pts,extra)=>cvt.push({t,pts,base,extra:extra||{}});
  switch(e.type){
   case"LINE":push("line",[P({x:num(e.g[10]),y:num(e.g[20])}),P({x:num(e.g[11]),y:num(e.g[21])})]);break;
   case"CIRCLE":{const ce={x:num(e.g[10]),y:num(e.g[20])},r=num(e.g[40]);push("circle",[P(ce),P({x:ce.x+r,y:ce.y})]);break}
   case"ARC":{
    const ce={x:num(e.g[10]),y:num(e.g[20])},r=num(e.g[40]),a0=num(e.g[50])*Math.PI/180,a1=num(e.g[51])*Math.PI/180;
    let dl=a1-a0;dl=((dl%PI2)+PI2)%PI2;if(dl<1e-9)dl=PI2;
    const q=a=>P({x:ce.x+r*Math.cos(a),y:ce.y+r*Math.sin(a)});push("arc",[q(a0),q(a0+dl/2),q(a0+dl)]);break}
   case"ELLIPSE":{
    const ce={x:num(e.g[10]),y:num(e.g[20])},mj={x:num(e.g[11]),y:num(e.g[21])},ra=num(e.g[40]),a=Math.hypot(mj.x,mj.y),b=a*ra,rot=Math.atan2(mj.y,mj.x),pts=[];
    const s0=e.g[41]!==undefined?num(e.g[41]):0,s1=e.g[42]!==undefined?num(e.g[42]):PI2,full=Math.abs(s1-s0-PI2)<1e-6;
    const n=full?96:Math.max(12,Math.round(Math.abs(s1-s0)/PI2*96));
    for(let k=0;k<=(full?n-1:n);k++){const t=s0+(s1-s0)*k/n,x=a*Math.cos(t),y=b*Math.sin(t);pts.push(P({x:ce.x+x*Math.cos(rot)-y*Math.sin(rot),y:ce.y+x*Math.sin(rot)+y*Math.cos(rot)}))}
    push("poly",pts,{closed:full});break}
   case"LWPOLYLINE":{const closed=(parseInt(e.g[70]||"0",10)&1)===1;if(e.pts.length>=2)push("poly",e.pts.map(P),{closed});break}
   case"POLYLINE":{const closed=(parseInt(e.g[70]||"0",10)&1)===1;if(e.vs.length>=2)push("poly",e.vs.map(P),{closed});break}
   case"TEXT":case"MTEXT":{
    let s=String(e.g[1]||"").replace(/\\U\+([0-9A-Fa-f]{4})/g,(m,h)=>String.fromCharCode(parseInt(h,16))).replace(/%%[cC]/g,"Ø").replace(/%%[dD]/g,"°").replace(/%%[pP]/g,"±");if(e.type==="MTEXT")s=s.replace(/\\P/g,"\n").replace(/\{?\\[A-Za-z][^;]*;/g,"").replace(/[{}]/g,"");
    const hasAl=(parseInt(e.g[72]||"0",10)>0||parseInt(e.g[73]||"0",10)>0)&&e.g[11]!==undefined,pt=hasAl?{x:num(e.g[11]),y:num(e.g[21])}:e.pts[0];if(!pt||!s.trim())break;
    cvt.push({text:s,pt:P(pt),h:R(num(e.g[40])||num(e.g[40])||2.5),rot:num(e.g[50])||0,base});break}
   default:skipped[e.type]=(skipped[e.type]||0)+1;
  }
 });
 if(!cvt.length)throw new Error(_("Không có đối tượng nào đọc được (chỉ hỗ trợ LINE, CIRCLE, ARC, POLYLINE, LWPOLYLINE, ELLIPSE, TEXT, MTEXT).","No readable objects (supported: LINE, CIRCLE, ARC, POLYLINE, LWPOLYLINE, ELLIPSE, TEXT, MTEXT)."));
 // phạm vi
 let x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;const ext=p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)};
 cvt.forEach(o=>{if(o.pts)o.pts.forEach(ext);else ext(o.pt)});
 const empty=!state.shapes.length&&!state.nodes.length;
 let ox=0,oy=0;
 if(empty){
  const L=sheetLayout(),pw=(L.use.r-L.use.l)/MM,ph=(L.use.b-L.use.t)/MM,cu=CAD_UNITS[c.unit];
  const need=Math.max((x1-x0)*cu/pw,(y1-y0)*cu/ph)*1.05;
  const N=CAD_SCALES.find(s=>s>=need)||Math.ceil(need);
  if(N!==c.scale){c.scale=N;c.gstep=niceNum(10*N/cu);state.meta.scaleTxt="1:"+N}
  const[Wd,Hd]=sheetDim(),k=cadWPU(),fcx=(L.use.l+L.use.r)/2/k,fcy=(Hd-(L.use.t+L.use.b)/2)/k;
  ox=fcx-(x0+x1)/2;oy=fcy-(y0+y1)/2;
 }
 const tw=p=>u2w({x:p.x+ox,y:p.y+oy});
 let n=0;
 cvt.forEach(o=>{
  if(o.text!==undefined){
   const pt=tw(o.pt),hpaper=o.h*CAD_UNITS[c.unit]/c.scale,fz=Math.min(80,Math.max(3,hpaper/.72*2.835));
   const nd=mkNode("text",pt.x,pt.y);nd.title=o.text;nd.fz=Math.round(fz*10)/10;nd.al="l";nd.col=o.base.col;nd.lay=o.base.lay;nd.rot=((-o.rot)%360+360)%360;
   const d=textDef(nd);nd.x=pt.x+d.w/2-9;nd.y=pt.y-d.h/2+5+nd.fz/PTU;n++;return;
  }
  const sh=newCadShape(o.t,o.pts.map(tw),Object.assign({lay:o.base.lay,col:o.base.col},o.extra));
  const L=c.layers.find(l=>l.id===o.base.lay);if(L){sh.sw=L.sw;sh.dash=L.dash}
  state.shapes.push(sh);n++;
 });
 commit(_("Nhập DXF","Import DXF"));syncCadUI();renderLayers();syncMetaUI();renderAll();if(empty)fitView();
 const sk=Object.entries(skipped).map(([a,b])=>a+"×"+b).join(", ");
 setStatus(_(`Đã nhập ${n} đối tượng từ DXF`,`Imported ${n} object(s) from DXF`)+(empty?_(` (tự chọn tỷ lệ 1:${c.scale})`,` (scale set to 1:${c.scale} automatically)`):"")+(sk?_(`. Bỏ qua loại chưa hỗ trợ: ${sk}.`,`. Skipped unsupported types: ${sk}.`):"."));
}
function loadDXF(ev){
 const f=ev.target.files[0];if(!f)return;
 f.text().then(t=>{try{if(!cadOn())setModule("cad");importDXFText(t)}catch(e){setStatus(_("Không nhập được DXF: ","Cannot import DXF: ")+e.message)}});
 ev.target.value="";
}

/* ---------- mô tả bản vẽ CAD bằng chữ (đọc to / text-to-speech) ---------- */
function cadDescribe(){
 const m=state.meta,c=cadCfg(),en=LANG==="en",cnt={};
 state.shapes.forEach(h=>{if(layVis(h))cnt[h.t]=(cnt[h.t]||0)+1});
 const texts=state.nodes.filter(n=>n.type==="text"&&layVis(n));
 let s=en?`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Sheet ${m.sheet}, scale 1:${c.scale}, real-world unit ${c.unit}. Coordinates are measured from the lower-left corner of the sheet: X to the right, Y upward.\n`:`${m.title}${m.project?" — "+m.project:""}. ${m.rev}. Khổ giấy ${m.sheet}, tỷ lệ 1:${c.scale}, đơn vị thực ${c.unit}. Toạ độ tính từ góc dưới trái của tờ giấy: X sang phải, Y đi lên.\n`;
 const parts=Object.entries(cnt).map(([t,n])=>`${n} ${T_(SHAPE_T[t]).toLowerCase()}`);
 if(texts.length)parts.push(`${texts.length} ${en?"text box(es)":"khung chữ"}`);
 s+=en?`The drawing has ${parts.length?parts.join(", "):"no objects yet"}.\n`:`Bản vẽ có ${parts.length?parts.join(", "):"chưa có đối tượng nào"}.\n`;
 s+=(en?"\nLAYERS\n":"\nCÁC LỚP\n")+c.layers.map(l=>`• ${layName(l)}${l.vis?"":(en?" (hidden)":" (đang ẩn)")}${l.lock?(en?" (locked)":" (đã khoá)"):""}: ${state.shapes.filter(h=>h.lay===l.id).length+state.nodes.filter(n=>n.lay===l.id).length} ${en?"objects":"đối tượng"}`).join("\n");
 s+=(en?"\n\nOBJECTS\n":"\n\nCÁC ĐỐI TƯỢNG\n");
 const items=state.shapes.filter(layVis).map((h,i)=>`${i+1}. ${shapeBrief(h)}`);
 texts.forEach((n,i)=>items.push(`${state.shapes.length+i+1}. ${en?"Text":"Chữ"}: “${String(n.title||"").replace(/\n/g," / ")}” ${en?"at":"tại"} (${w2u(n).x.toFixed(c.dec)}; ${w2u(n).y.toFixed(c.dec)})`));
 s+=items.length?items.slice(0,300).join("\n")+(items.length>300?"\n…":""):(en?"(none)":"(chưa có)");
 $("descTxt").textContent=s;openModal("mDesc");$("descTxt").focus();
}
