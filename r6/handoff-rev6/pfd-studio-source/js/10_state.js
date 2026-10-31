/* ============ HẰNG SỐ ============ */
const PHASE={gas:{n:"Khí"},oil:{n:"Dầu"},water:{n:"Nước"},mix:{n:"Hỗn hợp"}};
const KINDS={process:"Process — nét liền",dashed:"Utility / phụ trợ — nét đứt",signal:"Tín hiệu đo / điều khiển — chấm",shaft:"Trục / cơ khí — nét đôi",road:"Vận tải đường bộ — xe",rail:"Vận tải đường sắt — tàu hỏa",sea:"Vận tải đường thủy — tàu / sà lan"};
const TRANSPORT=["road","rail","sea"];
const isTransport=e=>TRANSPORT.includes(e.kind);
const isStream=e=>e.kind!=="signal"&&e.kind!=="shaft";
const DIRV={e:[1,0],w:[-1,0],n:[0,-1],s:[0,1]};
const KEYC="pfdstudio.rev5.cad.autosave",KEY="pfdstudio.rev5.autosave",PKEY="pfdstudio.rev5.prefs";
/* Rev.6 — khoá tự lưu RIÊNG của module Vector, không trùng PFD (KEY) hay SimCAD (KEYC) */
const KEYC_VEC="pfdstudio.rev6.vec.autosave";
const SHAPE_T={line:"Đường thẳng",arrow:"Mũi tên",rect:"Hình chữ nhật",ellipse:"Hình tròn / elip",poly:"Đa tuyến / đa giác",pen:"Nét bút tự do",circle:"Đường tròn",arc:"Cung tròn",dim:"Kích thước",hatch:"Mặt cắt / hatch",path:"Đường path Bézier",vtext:"Chữ vector"};
const DASHES={"":"Nét liền",dash:"Nét đứt",dot:"Chấm",dd:"Gạch chấm"};
const dashArr=(d,w)=>({dash:`${r3(w*5)} ${r3(w*3)}`,dot:`${r3(w*1.2)} ${r3(w*2.6)}`,dd:`${r3(w*6)} ${r3(w*2.5)} ${r3(w*1.2)} ${r3(w*2.5)}`}[d]||"");
const r3=v=>Math.round(v*1000)/1000;

/* ============ KHỞI TẠO TRẠNG THÁI ============ */
function defaultMeta(){return{
 title:"PROCESS FLOW DIAGRAM",project:"",client:"",company:"",rev:"Rev. 0",docNo:"PFD-001",drawnBy:"",checkedBy:"",approvedBy:"",date:new Date().toISOString().slice(0,10),
 scaleTxt:"NTS",sheetNo:"1",sheetOf:"1",docType:"Process Flow Diagram",
 sheet:"A3",orient:"landscape",template:"simple",tbLang:"auto",showSheet:true,showProps:true,showTable:false,colorByPhase:true,grid:true,snap:true,hops:true,
 lineMode:"fixed",lw:1,fs:1,fitMode:"sym",units:"SI",pipeLabel:"size",legendPos:"bl",showTitles:true,unitsDef:unitPreset("SI"),fonts:defaultFonts(),revs:[],doc:"pfd",cad:defaultCad(),vec:defaultVec()};}
/* ---- SimCAD: lớp, tỷ lệ, bắt điểm, kiểu kích thước ---- */
const CAD_UNITS={mm:1,cm:10,m:1000,in:25.4,ft:304.8};
const CAD_SCALES=[1,2,5,10,20,25,50,75,100,150,200,250,500,1000,2000,5000];
function defaultLayers(){return[
 {id:"0",n:"0 — Mặc định",col:"#17202a",vis:true,lock:false,dash:"",sw:2},
 {id:"OUT",n:"Đường bao (nét thấy)",col:"#17202a",vis:true,lock:false,dash:"",sw:3},
 {id:"CEN",n:"Đường tâm",col:"#dc2626",vis:true,lock:false,dash:"dd",sw:1.5},
 {id:"HID",n:"Nét khuất",col:"#7c3aed",vis:true,lock:false,dash:"dash",sw:2},
 {id:"DIM",n:"Kích thước",col:"#1d4ed8",vis:true,lock:false,dash:"",sw:1.5},
 {id:"TXT",n:"Chữ ghi chú",col:"#17202a",vis:true,lock:false,dash:"",sw:2},
 {id:"HAT",n:"Mặt cắt / hatch",col:"#6b7280",vis:true,lock:false,dash:"",sw:1.2}]}
function defaultCad(){return{scale:50,unit:"mm",dec:0,ortho:false,polar:false,pang:45,os:{end:true,mid:true,cen:true,int:true,nea:false},gs:true,gstep:500,dimTh:3,dimAh:3,dimSt:"arrow",layers:defaultLayers(),cur:"0"}}
function cleanCad(c){
 const d=defaultCad();c=c&&typeof c==="object"?c:{};const o={...d};
 o.scale=Math.min(100000,Math.max(.01,+c.scale||d.scale));o.unit=CAD_UNITS[c.unit]?c.unit:"mm";o.dec=Math.min(4,Math.max(0,Math.round(+c.dec>=0?+c.dec:0)));
 o.ortho=!!c.ortho;o.polar=!!c.polar;o.pang=[15,22.5,30,45,90].includes(+c.pang)?+c.pang:45;
 o.os={...d.os,...(c.os||{})};Object.keys(o.os).forEach(k=>o.os[k]=!!o.os[k]);
 o.gs=c.gs!==false;o.gstep=Math.max(.001,+c.gstep||d.gstep);o.dimTh=Math.min(20,Math.max(1,+c.dimTh||3));o.dimAh=Math.min(20,Math.max(.5,+c.dimAh||3));o.dimSt=c.dimSt==="tick"?"tick":"arrow";
 let L=Array.isArray(c.layers)?c.layers.slice(0,60).map((l,i)=>({id:String(l.id??("L"+i)).slice(0,24),n:String(l.n??l.id??"Layer").slice(0,60),col:/^#[0-9a-f]{6}$/i.test(l.col)?l.col:"#17202a",vis:l.vis!==false,lock:!!l.lock,dash:DASHES[l.dash]!==undefined?l.dash:"",sw:Math.min(30,Math.max(.5,+l.sw||2))})):[];
 const seen=new Set();L=L.filter(l=>!seen.has(l.id)&&seen.add(l.id));if(!L.length)L=defaultLayers();
 o.layers=L;o.cur=L.some(l=>l.id===c.cur)?c.cur:L[0].id;return o;
}
/* ---- Vector: lưới, bắt góc, kiểu nét mặc định (Rev.6) ---- */
function defaultVec(){return{
 grid:true,gstep:10,snapAngle:true,angStep:45,ruler:true,fz:16,
 stroke:"#17202a",sw:2,dash:"",fill:"",fo:1,ah:0,
 showNodes:true
}}
function cleanVec(v){
 const d=defaultVec();v=v&&typeof v==="object"?v:{};
 const o={...d};
 o.grid=v.grid!==false;
 o.gstep=Math.min(10000,Math.max(.1,+v.gstep||d.gstep));
 o.snapAngle=v.snapAngle!==false;
 o.angStep=[15,30,45,90].includes(+v.angStep)?+v.angStep:45;
 o.stroke=/^#[0-9a-f]{6}$/i.test(v.stroke)?v.stroke:d.stroke;
 o.sw=Math.min(30,Math.max(.5,+v.sw||d.sw));
 o.dash=DASHES[v.dash]!==undefined?v.dash:"";
 o.fill=/^#[0-9a-f]{6}$/i.test(v.fill)?v.fill:"";
 o.fo=Math.min(1,Math.max(0,v.fo!=null?+v.fo:1));
 o.ah=[0,1,2].includes(+v.ah)?+v.ah:0;
 o.showNodes=v.showNodes!==false;
 o.ruler=v.ruler!==false;
 return o;
}
function newState(){return{meta:defaultMeta(),nodes:[],edges:[],shapes:[],nextId:1,nextStream:1}}
let state=newState(),view={x:30,y:30,k:.6};
_metaRef=()=>state.meta;
let sel=new Set(),selEdge=null,tool="select",ptr=null,conn=null,spaceDown=false,clip=null,lastDown={id:null,t:0};
const getNode=id=>state.nodes.find(n=>n.id===id);
const getShape=id=>state.shapes.find(n=>n.id===id);
const uid=p=>p+(state.nextId++);
const gridW=()=>state.meta.doc==="cad"?cadGridW():10;
const sn=v=>{if(!state.meta.snap)return v;const g=gridW();return Math.round(v/g)*g};
const sheetDim=()=>sheetDimOf(state.meta);
const selNodes=()=>[...sel].map(getNode).filter(Boolean);
const selShapes=()=>[...sel].map(getShape).filter(Boolean);
const nodeName=id=>{const n=getNode(id);return n?(n.tag||n.title||"?"):"?"};

/* ============ CHUẨN HOÁ DỮ LIỆU (đọc cả Rev.1–3) ============ */
function cleanFonts(f){const d=defaultFonts(),o={};Object.keys(d).forEach(k=>{const s=f&&f[k]||{};o[k]={f:typeof s.f==="string"&&s.f?s.f:d[k].f,s:Math.min(60,Math.max(3,+s.s||d[k].s))}});return o}
function cadShapeExtra(h){
 const o={},P=a=>Array.isArray(a)?a.slice(0,400).map(p=>({x:+p.x||0,y:+p.y||0})):[];
 if(h.lay)o.lay=String(h.lay).slice(0,24);
 if(h.t==="dim"){o.ds=["al","h","v","r","d"].includes(h.ds)?h.ds:"al";if(h.dt)o.dt=String(h.dt).slice(0,60)}
 if(h.t==="hatch"){o.hpat=["lines","cross","solid"].includes(h.hpat)?h.hpat:"lines";o.ha=+h.ha||0;o.hs=Math.min(2000,Math.max(2,+h.hs||24));
  if(Array.isArray(h.rings))o.rings=h.rings.slice(0,40).map(P).filter(r=>r.length>=3)}
 return o;
}
function normalizeState(s){
 const meta={...defaultMeta(),...(s.meta||{})};
 if(meta.sheet==="A4"||!SHEETS[meta.sheet])meta.sheet=SHEETS[meta.sheet]?meta.sheet:"A3";
 if(!["landscape","portrait"].includes(meta.orient))meta.orient="landscape";
 if(!["simple","iso","ansi","epc","frame"].includes(meta.template))meta.template="simple";
 if(!["SI","US"].includes(meta.units))meta.units="SI";
 if(!["none","size","sch","full"].includes(meta.pipeLabel))meta.pipeLabel="size";
 if(!["tl","tr","bl","br","off"].includes(meta.legendPos))meta.legendPos="bl";
 meta.showTitles=meta.showTitles!==false;
 meta.doc=meta.doc==="cad"?"cad":meta.doc==="vec"?"vec":"pfd";meta.cad=cleanCad(meta.cad);meta.vec=cleanVec(meta.vec);
 { const pre=unitPreset(meta.units),ud=meta.unitsDef||{};meta.unitsDef={};QTY.forEach(q=>{const v=ud[q.id];meta.unitsDef[q.id]=(typeof v==="string"&&(q.opts.includes(v)||q.own.includes(v)))?v:pre[q.id]}) }
 meta.fonts=cleanFonts(meta.fonts);
 meta.revs=Array.isArray(meta.revs)?meta.revs.slice(0,30).map(r=>({r:String(r.r??""),date:String(r.date??""),desc:String(r.desc??""),by:String(r.by??""),chk:String(r.chk??""),app:String(r.app??"")})):[];
 const nodes=(s.nodes||[]).map(n=>{let t=n.type,v=+n.v||0;if(!SYMBOLS[t]&&LEGACY[t]){v=LEGACY[t][1];t=LEGACY[t][0]}return{...n,type:t,v}}).filter(n=>SYMBOLS[n.type]).map(n=>{
  const o={id:String(n.id),type:n.type,v:Math.min(Math.max(+n.v||0,0),SYMBOLS[n.type].vars.length-1),x:+n.x||0,y:+n.y||0,rot:+n.rot||0,flip:!!n.flip,sc:+n.sc||1,tag:n.tag??"",title:n.title??"",props:n.props??"",w:n.w,h:n.h,lp:["b","t","r","l"].includes(n.lp)?n.lp:"b"};
  if(n.ls&&+n.ls!==1)o.ls=Math.min(3,Math.max(.4,+n.ls));
  if(n.ht)o.ht=true;
  if(Array.isArray(n.hp)&&n.hp.length)o.hp=n.hp.map(String).slice(0,24);
  if(Array.isArray(n.xp)&&n.xp.length)o.xp=n.xp.slice(0,24).map((p,i)=>({id:String(p.id||"x"+(i+1)),s:["n","s","e","w"].includes(p.s)?p.s:"n",f:Math.min(1,Math.max(0,+p.f>=0?+p.f:.5)),o:+p.o||0,l:String(p.l??"")}));
  if(n.lay)o.lay=String(n.lay).slice(0,24);
  if(n.type==="text"){["ff","col","al"].forEach(k=>{if(n[k])o[k]=String(n[k])});if(n.fz)o.fz=Math.min(80,Math.max(3,+n.fz));if(n.b)o.b=true;if(n.i)o.i=true;if(n.bd)o.bd=true;if(n.bg)o.bg=String(n.bg)}
  return o});
 const ids=new Set(nodes.map(n=>n.id));
 let nextId=1;const bump=id=>{const k=parseInt(String(id).replace(/\D/g,""),10);if(k>=0&&k<1e6&&k>=nextId)nextId=k+1};
 nodes.forEach(n=>bump(n.id));(s.edges||[]).forEach(e=>{if(/^e\d{1,6}$/.test(String(e.id)))bump(e.id)});(s.shapes||[]).forEach(e=>bump(e.id));
 let ns=+s.nextStream||1;const seen=new Set(),edges=[];
 const nodeById=Object.fromEntries(nodes.map(n=>[n.id,n]));
 (s.edges||[]).forEach(e=>{[[e.from,e.fromPort],[e.to,e.toPort]].forEach(([id,p])=>{const n=nodeById[id];if(n&&n.hp){n.hp=n.hp.filter(x=>x!==p);if(!n.hp.length)delete n.hp}})});
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
 const shapes=(s.shapes||[]).filter(h=>{
  if(!SHAPE_T[h.t])return false;
  if(h.t==="path")return Array.isArray(h.nodes)&&h.nodes.length>=2;
  if(h.t==="vtext")return true;
  return Array.isArray(h.pts)&&h.pts.length>=(["arc","dim","hatch"].includes(h.t)?3:2);
 }).map(h=>{
  const o={id:String(h.id),t:h.t,col:String(h.col||"#17202a"),sw:Math.min(30,Math.max(.5,+h.sw||2)),dash:DASHES[h.dash]!==undefined?h.dash:"",fill:h.fill?String(h.fill):"",fo:Math.min(1,Math.max(0,h.fo!=null?+h.fo:.25)),ah:[0,1,2].includes(+h.ah)?+h.ah:(h.t==="arrow"?1:0),closed:!!h.closed||h.t==="rect"||h.t==="ellipse"||h.t==="circle",rx:+h.rx||0,z:h.z==="b"?"b":"f",...cadShapeExtra(h)};
  /* Rev.6 — path Bézier: nguồn hình học là nodes[], KHÔNG dùng pts[] */
  if(h.t==="path")o.nodes=vecNormNodes(h.nodes);
  else if(h.t==="vtext"){
   o.x=vecNum(h.x);o.y=vecNum(h.y);
   o.w=Math.min(20000,Math.max(4,+h.w||120));o.h=Math.min(20000,Math.max(4,+h.h||30));
   o.rot=isFinite(+h.rot)?(+h.rot)%360:0;
   o.mode=h.mode==="area"?"area":"point";
   o.text=String(h.text==null?"":h.text).slice(0,4000);
   o.ff=String(h.ff||"");o.fz=Math.min(200,Math.max(3,+h.fz||14));
   o.b=!!h.b;o.i=!!h.i;o.mh=!!h.mh;o.mv=!!h.mv;
   o.al=["l","c","r"].includes(h.al)?h.al:"l";
   o.lh=Math.min(3,Math.max(1,+h.lh||1.28));
   o.fill=h.fill?String(h.fill):"";o.fo=Math.min(1,Math.max(0,h.fo!=null?+h.fo:1));
  }
  else o.pts=h.pts.map(p=>({x:+p.x||0,y:+p.y||0}));
  return o;
 });
 let under=null;
 if(s.under&&typeof s.under==="object"&&typeof s.under.id==="string"){const u=s.under;under={id:u.id.slice(0,40),x:+u.x||0,y:+u.y||0,w:Math.max(1,+u.w||100),h:Math.max(1,+u.h||100),op:Math.min(1,Math.max(.05,+u.op||.5)),vis:u.vis!==false,print:!!u.print,unlock:false}}
 return{meta,nodes,edges,shapes,nextId,nextStream:ns,under};
}
function snapshot(){return JSON.stringify({meta:state.meta,nodes:state.nodes,edges:state.edges,shapes:state.shapes,nextId:state.nextId,nextStream:state.nextStream,under:state.under||null})}

/* ============ LỊCH SỬ (có tên từng bước) ============ */
let hist=[],fut=[],cur=null,asT=null,cT=null,pendLabel=null;
function resetHistory(label){hist=[];fut=[];cur={s:snapshot(),l:label||_("Khởi tạo","Initial")};updateHistUI()}
function commit(label){
 const s=snapshot();if(cur&&s===cur.s)return;
 if(cur){hist.push(cur);if(hist.length>150)hist.shift()}
 cur={s,l:label||pendLabel||_("Thay đổi","Edit")};pendLabel=null;fut=[];autosave();updateHistUI();
}
function commitSoon(label){pendLabel=label||pendLabel;clearTimeout(cT);cT=setTimeout(()=>commit(),500)}
function autosave(){clearTimeout(asT);asT=setTimeout(()=>{const k=state.meta.doc==="cad"?KEYC:state.meta.doc==="vec"?KEYC_VEC:KEY;try{localStorage.setItem(k,JSON.stringify(drawingData()))}catch(e){try{localStorage.setItem(k,JSON.stringify(drawingData(true)))}catch(e2){}}},400)}
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
