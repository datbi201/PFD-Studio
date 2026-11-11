/* ============ HẰNG SỐ ============ */
const PHASE={gas:{n:"Khí"},oil:{n:"Dầu"},water:{n:"Nước"},mix:{n:"Hỗn hợp"}};
const KINDS={process:"Process — nét liền",dashed:"Utility / phụ trợ — nét đứt",signal:"Tín hiệu đo / điều khiển — chấm",shaft:"Trục / cơ khí — nét đôi",road:"Vận tải đường bộ — xe",rail:"Vận tải đường sắt — tàu hỏa",sea:"Vận tải đường thủy — tàu / sà lan"};
const TRANSPORT=["road","rail","sea"];
const isTransport=e=>TRANSPORT.includes(e.kind);
const isStream=e=>e.kind!=="signal"&&e.kind!=="shaft"&&!!(e.from||e.to); // ống hở 2 đầu tự do = chỉ là mũi tên minh hoạ
const DIRV={e:[1,0],w:[-1,0],n:[0,-1],s:[0,1]};
const KEYD="pfdstudio.rev6.dgm.autosave",KEY="pfdstudio.rev6.autosave",PKEY="pfdstudio.rev6.prefs";
const SHAPE_T={line:"Đường thẳng",arrow:"Mũi tên",rect:"Hình chữ nhật",ellipse:"Hình tròn / elip",poly:"Đa tuyến / đa giác",pen:"Nét bút tự do"};
const DASHES={"":"Nét liền",dash:"Nét đứt",dot:"Chấm",dd:"Gạch chấm"};
const dashArr=(d,w)=>({dash:`${r3(w*5)} ${r3(w*3)}`,dot:`${r3(w*1.2)} ${r3(w*2.6)}`,dd:`${r3(w*6)} ${r3(w*2.5)} ${r3(w*1.2)} ${r3(w*2.5)}`}[d]||"");
const r3=v=>Math.round(v*1000)/1000;

/* ============ KHỞI TẠO TRẠNG THÁI ============ */
function defaultMeta(){return{
 title:"PROCESS FLOW DIAGRAM",project:"",client:"",company:"",rev:"Rev. 0",docNo:"PFD-001",drawnBy:"",checkedBy:"",approvedBy:"",date:new Date().toISOString().slice(0,10),
 scaleTxt:"NTS",sheetNo:"1",sheetOf:"1",docType:"Process Flow Diagram",
 sheet:"A3",orient:"landscape",template:"simple",tbLang:"auto",showSheet:true,showProps:true,showTable:false,colorByPhase:true,grid:true,snap:true,hops:true,
 lineMode:"fixed",lw:1,fs:1,fitMode:"sym",units:"SI",pipeLabel:"size",legendPos:"bl",showTitles:true,unitsDef:unitPreset("SI"),fonts:defaultFonts(),revs:[],doc:"pfd"};}
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
/* tên hiển thị: tên mặc định lưu bằng tiếng Việt, hiện theo ngôn ngữ đang chọn; chữ tự gõ giữ nguyên */
const nTitle=n=>{const t=n.title||"";return(n.type==="text"||n.type==="area")?(t==="Ghi chú"?T_(t):t):T_(t)};
const nodeName=id=>{if(!id)return"—";const n=getNode(id);return n?(n.tag||nTitle(n)||"?"):"?"};

/* ============ CHUẨN HOÁ DỮ LIỆU (đọc cả Rev.1–3) ============ */
function cleanFonts(f){const d=defaultFonts(),o={};Object.keys(d).forEach(k=>{const s=f&&f[k]||{};o[k]={f:typeof s.f==="string"&&s.f?s.f:d[k].f,s:Math.min(60,Math.max(3,+s.s||d[k].s))}});return o}
const cleanCol=c=>/^#[0-9a-fA-F]{3,8}$/.test(String(c||""))?String(c):"";
const clampN=(v,a,b,d)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):d};
function cleanCs(c){
 c=c||{};const t=["rect","ellipse","poly","pen"].includes(c.t)?c.t:"rect",o={t,w:clampN(c.w,10,4000,80),h:clampN(c.h,10,4000,60)};
 if(t==="rect"&&+c.rx>0)o.rx=clampN(c.rx,0,200,0);
 if(t==="poly"||t==="pen"){o.pts=(Array.isArray(c.pts)?c.pts:[]).slice(0,2000).map(p=>({x:+p.x||0,y:+p.y||0}));if(o.pts.length<2)o.pts=[{x:-o.w/2,y:0},{x:o.w/2,y:0}];o.closed=t==="poly"&&!!c.closed}
 return o;
}
const okPt=p=>p&&isFinite(+p.x)&&isFinite(+p.y)&&p.x!==null&&p.y!==null?{x:+p.x,y:+p.y}:null;
function normalizeState(s){
 const meta={...defaultMeta(),...(s.meta||{})};
 if(meta.sheet==="A4"||!SHEETS[meta.sheet])meta.sheet=SHEETS[meta.sheet]?meta.sheet:"A3";
 if(!["landscape","portrait"].includes(meta.orient))meta.orient="landscape";
 if(!["simple","iso","ansi","epc","frame"].includes(meta.template))meta.template="simple";
 if(!["SI","US"].includes(meta.units))meta.units="SI";
 if(!["none","size","sch","full"].includes(meta.pipeLabel))meta.pipeLabel="size";
 if(!["tl","tr","bl","br","off"].includes(meta.legendPos))meta.legendPos="bl";
 meta.showTitles=meta.showTitles!==false;
 meta.doc="pfd";delete meta.dg;
 { const pre=unitPreset(meta.units),ud=meta.unitsDef||{};meta.unitsDef={};QTY.forEach(q=>{const v=ud[q.id];meta.unitsDef[q.id]=(typeof v==="string"&&(q.opts.includes(v)||q.own.includes(v)))?v:pre[q.id]}) }
 meta.fonts=cleanFonts(meta.fonts);
 meta.revs=Array.isArray(meta.revs)?meta.revs.slice(0,30).map(r=>({r:String(r.r??""),date:String(r.date??""),desc:String(r.desc??""),by:String(r.by??""),chk:String(r.chk??""),app:String(r.app??"")})):[];
 const nodes=(s.nodes||[]).map(n=>{let t=n.type,v=+n.v||0;if(!SYMBOLS[t]&&LEGACY[t]){v=LEGACY[t][1];t=LEGACY[t][0]}return{...n,type:t,v}}).filter(n=>{if(!SYMBOLS[n.type]){(window.__PFD_MISSING__=window.__PFD_MISSING__||[]).push(n.type)}return SYMBOLS[n.type]}).map(n=>{
  const o={id:String(n.id),type:n.type,v:Math.min(Math.max(+n.v||0,0),SYMBOLS[n.type].vars.length-1),x:+n.x||0,y:+n.y||0,rot:+n.rot||0,flip:!!n.flip,sc:+n.sc||1,tag:n.tag??"",title:n.title??"",props:n.props??"",w:n.w,h:n.h,lp:["b","t","r","l"].includes(n.lp)?n.lp:"b"};
  if(n.ls&&+n.ls!==1)o.ls=Math.min(3,Math.max(.4,+n.ls));
  if(n.ht)o.ht=true;
  if(n.type!=="text"&&n.type!=="area"){
   const fl=cleanCol(n.fl),ln=cleanCol(n.ln);if(fl)o.fl=fl;if(ln)o.ln=ln;
   if(n.ld&&DASHES[n.ld])o.ld=n.ld;if(+n.lw>0&&+n.lw!==1)o.lw=clampN(n.lw,.3,4,1);if(n.nb)o.nb=true;if(n.fo!=null&&+n.fo<1)o.fo=clampN(n.fo,0,1,1);
  }
  if(n.type==="cshape")o.cs=cleanCs(n.cs);
  if(Array.isArray(n.hp)&&n.hp.length)o.hp=n.hp.map(String).slice(0,24);
  if(Array.isArray(n.xp)&&n.xp.length)o.xp=n.xp.slice(0,24).map((p,i)=>({id:String(p.id||"x"+(i+1)),s:["n","s","e","w"].includes(p.s)?p.s:"n",f:Math.min(1,Math.max(0,+p.f>=0?+p.f:.5)),o:+p.o||0,l:String(p.l??"")}));
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
  const fOk=ids.has(e.from),tOk=ids.has(e.to),fp=fOk?null:okPt(e.fp),tp=tOk?null:okPt(e.tp);
  if(!(fOk||fp)||!(tOk||tp))return;
  let id=String(e.id);if(!/^e\d{1,6}$/.test(id)||seen.has(id))id="e"+(nextId++);seen.add(id);
  const kind=KINDS[e.kind]?e.kind:"process";
  let num=e.num;if(num===undefined||num===null)num=(kind==="signal"||kind==="shaft")?"":ns++;else if(/^\d+$/.test(String(num)))ns=Math.max(ns,+num+1);
  const A=nodeById[e.from],B=nodeById[e.to];
  edges.push({id,from:fOk?e.from:"",fromPort:fOk?fixPort(A,e.fromPort||"e","e"):"",to:tOk?e.to:"",toPort:tOk?fixPort(B,e.toPort||"w","w"):"",kind,phase:PHASE[e.phase]?e.phase:"",num:String(num),service:e.service??"",size:e.size??"",
   std:e.std&&(PIPE_STD[e.std])?e.std:"",nps:e.nps!=null?String(e.nps):"",sch:e.sch!=null?String(e.sch):"",wall:e.wall??"",od:e.od??"",mat:e.mat??"",matOther:e.matOther??"",cls:e.cls??"",dist:e.dist??"",
   P:e.P??"",T:e.T??"",flow:e.flow??"",mid:typeof e.mid==="number"?e.mid:null,midAxis:e.midAxis||null,wt:[1,1.6,2.4].includes(+e.wt)?+e.wt:1,...(e.na?{na:true}:{}),...(fp?{fp}:{}),...(tp?{tp}:{}),...(e.ab?{ab:true}:{}),...((e.ao==="h"||e.ao==="v")?{ao:e.ao}:{}),...((+e.as>0&&+e.as!==1)?{as:clampN(e.as,.5,3,1)}:{})});
 });
 const shapes=(s.shapes||[]).filter(h=>SHAPE_T[h.t]&&Array.isArray(h.pts)&&h.pts.length>=2).map(h=>{
  const o={id:String(h.id),t:h.t,pts:h.pts.map(p=>({x:+p.x||0,y:+p.y||0})),col:String(h.col||"#17202a"),sw:(h.sw!=null&&isFinite(+h.sw))?Math.min(30,Math.max(0,+h.sw)):2,dash:DASHES[h.dash]!==undefined?h.dash:"",fill:h.fill?String(h.fill):"",fo:Math.min(1,Math.max(0,h.fo!=null?+h.fo:.25)),ah:[0,1,2].includes(+h.ah)?+h.ah:(h.t==="arrow"?1:0),closed:!!h.closed||h.t==="rect"||h.t==="ellipse"||h.t==="circle",rx:+h.rx||0,z:h.z==="b"?"b":"f"};
  if(h.nb)o.nb=true;if(+h.as>0&&+h.as!==1)o.as=clampN(h.as,.5,3,1);
  ["a0","a1"].forEach(k=>{const a=h[k];if(a&&nodeById[a.n]&&typeof a.p==="string")o[k]={n:String(a.n),p:a.p}});
  return o});
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
function autosave(){clearTimeout(asT);asT=setTimeout(()=>{const k=KEY;try{localStorage.setItem(k,JSON.stringify(drawingData()))}catch(e){}},400)}
function restore(s){
 state=normalizeState(JSON.parse(s));
 sel=new Set([...sel].filter(id=>getNode(id)||getShape(id)));if(selEdge&&!state.edges.find(e=>e.id===selEdge))selEdge=null;
 if(typeof dgAfterRestore==="function")dgAfterRestore();syncMetaUI();renderAll();autosave();updateHistUI();
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
