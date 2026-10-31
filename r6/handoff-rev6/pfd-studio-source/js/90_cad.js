/* ============ SimCAD — MODULE, LỚP, BẮT ĐIỂM, DÒNG LỆNH ============ */
const STORE={pfd:null,cad:null,vec:null};
const CAD={cmd:null,last:"",cur:{x:0,y:0},snap:null,hist:[],hi:0,hatch:{pat:"lines",ha:45,hs:12,fill:""},mirDel:false,offD:0,gC:null,lastRaw:{x:0,y:0}};
const layName=l=>T_(l.n);

/* ---------- chuyển module PFD ⇄ SimCAD ---------- */
function saveCtx(){return{state,view:{...view},hist,fut,cur,sel:new Set(sel)}}
function loadCtx(c){state=c.state;view=c.view;hist=c.hist;fut=c.fut;cur=c.cur;sel=c.sel;selEdge=null}
function newCadState(src){
 const s=newState(),m=s.meta;
 Object.assign(m,{doc:"cad",title:_("BẢN VẼ KỸ THUẬT","TECHNICAL DRAWING"),docNo:"CAD-001",docType:"CAD Drawing",scaleTxt:"1:"+m.cad.scale,template:"iso",sheet:"A3",showProps:false,colorByPhase:false,showTable:false,grid:true,snap:true,lineMode:"fixed"});
 if(src){["company","client","project","drawnBy","checkedBy","approvedBy","tbLang","orient","sheet"].forEach(k=>{if(src[k]!==undefined)m[k]=src[k]});m.fonts=cleanFonts(src.fonts);m.project=""}
 return s;
}
function setModule(m){
 if(m===state.meta.doc)return;
 clearTimeout(cT);commit();cadReset(true);
 STORE[state.meta.doc]=saveCtx();
 if(STORE[m])loadCtx(STORE[m]);
 else{
  const o=state.meta;
  /* Rev.6 — module thứ ba: Vector (cùng pattern với SimCAD) */
  state=m==="vec"?newVecState(o):m==="cad"?newCadState(o):newState();
  view={x:30,y:30,k:.6};sel=new Set();selEdge=null;hist=[];fut=[];cur={s:snapshot(),l:_("Khởi tạo","Initial")};
 }
 applyModuleUI(true);savePrefs();
 setStatus(m==="vec"?_("Vector: V chọn, A sửa điểm neo, P bút, M chữ nhật, L ellipse, \\ đường thẳng. Bấm ? để xem đủ phím tắt.","Vector: V select, A edit anchors, P pen, M rectangle, L ellipse, \\ line. Press ? for all shortcuts."):m==="cad"?_("SimCAD: gõ chữ cái đầu của lệnh (L = đường thẳng, C = tròn…) rồi Enter; gõ toạ độ để nhập điểm. Bấm ? để xem bảng lệnh.","SimCAD: type the first letter of a command (L = line, C = circle…) then Enter; type coordinates to enter points. Press ? for the command table."):_("PFD Studio: bản vẽ sơ đồ công nghệ.","PFD Studio: process flow diagram."));
}
function adoptState(ns){
 const from=state.meta.doc,to=ns.meta.doc;
 if(from!==to){clearTimeout(cT);cadReset(true);STORE[from]=saveCtx()}
 state=ns;sel=new Set();selEdge=null;
 if(from!==to){hist=[];fut=[];cur={s:snapshot(),l:_("Mở bản vẽ","Open drawing")};applyModuleUI(false)}
}
function applyModuleUI(fit){
 const c=cadOn(),v=(typeof vecOn==="function")&&vecOn();
 document.body.classList.toggle("cadmode",c);
 document.body.classList.toggle("vecmode",v);
 if($("modPfd")){$("modPfd").classList.toggle("active",!c&&!v);$("modPfd").setAttribute("aria-pressed",!c&&!v)}
 if($("modCad")){$("modCad").classList.toggle("active",c);$("modCad").setAttribute("aria-pressed",c)}
 if($("modVec")){$("modVec").classList.toggle("active",v);$("modVec").setAttribute("aria-pressed",v)}
 $("appName").textContent=v?"Vector Studio":c?"SimCAD":"PFD Studio";
 $("appSub").textContent=v?_("Rev.6 • Vẽ vector 2D (path Bézier) • dùng chung khung giấy, in ấn, font","Rev.6 • 2D vector drawing (Bezier paths) • shares sheets, printing and fonts"):c?_("Rev.0 • CAD 2D đơn giản • dùng chung khung giấy, in ấn, font","Rev.0 • simple 2D CAD • shares sheets, printing and fonts"):_("Rev.6 • Vẽ Process Flow Diagram dầu khí • 1 file, không cần cài đặt","Rev.6 • Oil & gas Process Flow Diagram • single file, no install");
 tool="select";
 syncMetaUI();syncCadUI();renderLayers();renderAll();updateCadBar();
 if(v&&typeof vecToolUI==="function")vecToolUI();
 if(fit)fitView();
}
function cadBoot(){
 try{
  const raw=localStorage.getItem(KEYC);
  if(raw){const d=JSON.parse(raw);if(d.underData)Object.entries(d.underData).forEach(([k,v])=>{if(typeof v==="string"&&v.startsWith("data:image/"))UNDER_DATA[k]=v});const st=normalizeState(d.state||d);if(st.meta.doc==="cad"){STORE.cad={state:st,view:{x:30,y:30,k:.6},hist:[],fut:[],cur:{s:JSON.stringify({meta:st.meta,nodes:st.nodes,edges:st.edges,shapes:st.shapes,nextId:st.nextId,nextStream:st.nextStream}),l:_("Khôi phục","Restored")},sel:new Set()}}}
 }catch(e){}
 try{const p=JSON.parse(localStorage.getItem(PKEY)||"null");if(p&&p.mod==="cad")setModule("cad")}catch(e){}
 syncCadUI();renderLayers();
}

/* ---------- lớp (layer) ---------- */
function curLayer(){return layerById(cadCfg().cur)}
function layerFor(kind){const L=cadCfg().layers,m={dim:"DIM",hatch:"HAT",text:"TXT"}[kind],f=m&&L.find(l=>l.id===m);return f||curLayer()}
function renderLayers(){
 const box=$("cadLayers");if(!box)return;const c=cadCfg();
 box.innerHTML=c.layers.map(l=>`<div class="lay${l.id===c.cur?" cur":""}" data-lid="${esc(l.id)}" role="group" aria-label="${esc(_("Lớp ","Layer ")+layName(l))}">
  <button class="lb" data-act="cur" title="${_("Đặt làm lớp hiện hành (nét vẽ mới nằm trong lớp này)","Make current (new objects go to this layer)")}" aria-label="${_("Lớp hiện hành","Current layer")}" aria-pressed="${l.id===c.cur}">${l.id===c.cur?"●":"○"}</button>
  <button class="lb" data-act="vis" title="${_("Hiện / ẩn lớp","Show / hide layer")}" aria-label="${_("Hiện hoặc ẩn lớp","Show or hide layer")}" aria-pressed="${l.vis}">${l.vis?"👁":"🚫"}</button>
  <button class="lb" data-act="lock" title="${_("Khoá / mở khoá lớp","Lock / unlock layer")}" aria-label="${_("Khoá hoặc mở khoá lớp","Lock or unlock layer")}" aria-pressed="${l.lock}">${l.lock?"🔒":"🔓"}</button>
  <input type="color" data-act="col" value="${esc(l.col)}" aria-label="${_("Màu lớp","Layer colour")}">
  <input class="ln" data-act="name" value="${esc(layName(l))}" aria-label="${_("Tên lớp","Layer name")}">
  <button class="lb" data-act="del" title="${_("Xoá lớp (đối tượng chuyển về lớp 0)","Delete layer (objects move to layer 0)")}" aria-label="${_("Xoá lớp","Delete layer")}">✕</button></div>`).join("");
 box.querySelectorAll(".lay").forEach(row=>{
  const id=row.dataset.lid;
  row.querySelectorAll("[data-act]").forEach(el=>{
   const act=el.dataset.act;
   if(act==="col")el.addEventListener("change",()=>layerAct(id,"col",el.value));
   else if(act==="name")el.addEventListener("change",()=>layerAct(id,"name",el.value));
   else el.addEventListener("click",()=>layerAct(id,act));
  });
 });
}
function layerAct(id,act,val){
 const c=cadCfg(),l=c.layers.find(x=>x.id===id);if(!l)return;
 if(act==="cur"){c.cur=id;setStatus(_("Lớp hiện hành: ","Current layer: ")+layName(l))}
 else if(act==="vis"){l.vis=!l.vis;commit(_("Hiện/ẩn lớp ","Toggle layer ")+layName(l));setStatus(layName(l)+(l.vis?_(": đang hiện",": visible"):_(": đã ẩn",": hidden")))}
 else if(act==="lock"){l.lock=!l.lock;commit(_("Khoá/mở lớp ","Lock/unlock layer ")+layName(l));setStatus(layName(l)+(l.lock?_(": đã khoá (không chọn / sửa được)",": locked (cannot select / edit)"):_(": đã mở khoá",": unlocked")))}
 else if(act==="col"){const old=l.col;l.col=val;state.shapes.forEach(h=>{if(h.lay===id&&String(h.col).toLowerCase()===old.toLowerCase())h.col=val});commit(_("Đổi màu lớp ","Layer colour ")+layName(l))}
 else if(act==="name"){l.n=String(val).trim().slice(0,60)||l.n;commit(_("Đổi tên lớp","Rename layer"))}
 else if(act==="del"){
  if(c.layers.length<=1||id==="0"){setStatus(_("Không xoá được lớp 0 / lớp cuối cùng.","Layer 0 / the last layer cannot be deleted."));return}
  state.shapes.forEach(h=>{if(h.lay===id)h.lay="0"});state.nodes.forEach(n=>{if(n.lay===id)n.lay="0"});
  c.layers=c.layers.filter(x=>x.id!==id);if(c.cur===id)c.cur="0";commit(_("Xoá lớp ","Delete layer ")+layName(l));setStatus(_("Đã xoá lớp, đối tượng chuyển về lớp 0.","Layer deleted, objects moved to layer 0."))
 }
 renderLayers();renderShapes();renderNodes();renderProps();autosave();
}
function addLayer(){
 const c=cadCfg();let k=c.layers.length;while(c.layers.some(l=>l.id==="L"+k))k++;
 c.layers.push({id:"L"+k,n:_("Lớp mới ","New layer ")+k,col:"#0891b2",vis:true,lock:false,dash:"",sw:2});c.cur="L"+k;
 commit(_("Thêm lớp","Add layer"));renderLayers();setStatus(_("Đã thêm lớp mới và đặt làm lớp hiện hành. Đổi tên ở ô bên cạnh.","New layer added and made current. Rename it in the box beside."));
}

/* ---------- thiết lập SimCAD (ô bên phải) ---------- */
function niceNum(v){const e=Math.pow(10,Math.floor(Math.log10(v))),f=v/e;return(f<1.5?1:f<3.5?2:f<7.5?5:10)*e}
function setCadScale(N){
 const c=cadCfg();N=Math.min(100000,Math.max(.01,+N||c.scale));
 if(N===c.scale)return;
 const f=c.scale/N,[W,H]=sheetDim(),cx=W/2,cy=H/2,fn=p=>({x:cx+(p.x-cx)*f,y:cy+(p.y-cy)*f});
 state.shapes.forEach(h=>mapShapePts(h,fn));state.nodes.forEach(n=>{const p=fn(n);n.x=p.x;n.y=p.y});
 c.gstep=niceNum(c.gstep*N/c.scale);c.scale=N;state.meta.scaleTxt="1:"+N;
 commit(_("Đổi tỷ lệ 1:","Change scale 1:")+N);syncCadUI();syncMetaUI();renderAll();
 setStatus(_(`Tỷ lệ bản vẽ 1:${N}. Hình giữ nguyên kích thước thực; khổ giấy đổi theo.`,`Drawing scale 1:${N}. Objects keep their real size; the paper changes accordingly.`));
}
function cadSetting(k,v,el){
 const c=cadCfg(),num=x=>{const n=parseFloat(String(x).replace(",","."));return isFinite(n)?n:null};
 switch(k){
  case"scale":setCadScale(num(v));return;
  case"unit":{const o=CAD_UNITS[c.unit];c.unit=v;c.gstep=niceNum(c.gstep*o/CAD_UNITS[v]);c.dec=v==="m"?2:v==="mm"?0:v==="cm"?1:2;commit(_("Đổi đơn vị","Change unit"));break}
  case"dec":c.dec=Math.min(4,Math.max(0,Math.round(num(v)||0)));commit(_("Số chữ số lẻ","Decimals"));break;
  case"gstep":{const n=num(v);if(n&&n>0)c.gstep=n;commit(_("Bước lưới","Grid step"));break}
  case"ortho":c.ortho=!!el.checked;break;
  case"polar":c.polar=!!el.checked;break;
  case"pang":c.pang=+v;break;
  case"snap":state.meta.snap=!!el.checked;break;
  case"osall":Object.keys(c.os).forEach(x=>{if(x!=="nea")c.os[x]=!!el.checked});break;
  case"os_end":case"os_mid":case"os_cen":case"os_int":case"os_nea":c.os[k.slice(3)]=!!el.checked;break;
  case"dimTh":{const n=num(v);if(n)c.dimTh=Math.min(20,Math.max(1,n));commit(_("Cỡ chữ kích thước","Dimension text size"));break}
  case"dimAh":{const n=num(v);if(n)c.dimAh=Math.min(20,Math.max(.5,n));commit(_("Cỡ mũi tên kích thước","Dimension arrow size"));break}
  case"dimSt":c.dimSt=v==="tick"?"tick":"arrow";commit(_("Kiểu đầu kích thước","Dimension ends"));break;
  case"hpat":CAD.hatch.pat=v;break;
  case"ha":CAD.hatch.ha=num(v)||0;break;
  case"hs":CAD.hatch.hs=Math.max(1,(num(v)||3)*MM);break;
  case"mirDel":CAD.mirDel=!!el.checked;break;
 }
 syncCadUI();renderAll();updateCadBar();autosave();
}
function syncCadUI(){
 const c=cadCfg(),set=(k,v)=>{const e=document.querySelector(`[data-cad="${k}"]`);if(!e)return;if(e.type==="checkbox")e.checked=!!v;else e.value=v};
 set("scale",c.scale);set("unit",c.unit);set("dec",c.dec);set("gstep",c.gstep);set("ortho",c.ortho);set("polar",c.polar);set("pang",c.pang);set("snap",state.meta.snap);
 set("osall",c.os.end&&c.os.mid&&c.os.cen&&c.os.int);["end","mid","cen","int","nea"].forEach(x=>set("os_"+x,c.os[x]));
 set("dimTh",c.dimTh);set("dimAh",c.dimAh);set("dimSt",c.dimSt);
 set("hpat",CAD.hatch.pat);set("ha",CAD.hatch.ha);set("hs",+(CAD.hatch.hs/MM).toFixed(2));set("mirDel",CAD.mirDel);
}
function updateCadBar(){
 const c=cadCfg(),on=(id,v)=>{const e=$(id);if(e){e.classList.toggle("active",!!v);e.setAttribute("aria-pressed",!!v)}};
 on("tgSnap",state.meta.snap);on("tgOrtho",c.ortho);on("tgPolar",c.polar);on("tgOs",c.os.end||c.os.mid||c.os.cen||c.os.int);
 const cu=$("cadUnitLbl");if(cu)cu.textContent="1:"+c.scale+" • "+c.unit;
}
function cadToggle(k){
 const c=cadCfg();
 if(k==="snap"){state.meta.snap=!state.meta.snap;setStatus(_("Bắt lưới: ","Grid snap: ")+(state.meta.snap?_("BẬT","ON"):_("TẮT","OFF")))}
 else if(k==="ortho"){c.ortho=!c.ortho;if(c.ortho)c.polar=false;setStatus(_("Ortho (chỉ ngang / dọc): ","Ortho (horizontal / vertical only): ")+(c.ortho?_("BẬT","ON"):_("TẮT","OFF")))}
 else if(k==="polar"){c.polar=!c.polar;if(c.polar)c.ortho=false;setStatus(_("Polar (hút góc "+c.pang+"°): ","Polar (angle snap "+c.pang+"°): ")+(c.polar?_("BẬT","ON"):_("TẮT","OFF")))}
 else if(k==="os"){const v=!(c.os.end||c.os.mid||c.os.cen||c.os.int);["end","mid","cen","int"].forEach(x=>c.os[x]=v);setStatus(_("Bắt điểm đối tượng (đầu mút, trung điểm, tâm, giao điểm): ","Object snap (endpoint, midpoint, centre, intersection): ")+(v?_("BẬT","ON"):_("TẮT","OFF")))}
 syncCadUI();updateCadBar();autosave();renderCanvasOnly();
}

/* ---------- bắt điểm đối tượng ---------- */
function cadObjSnap(w,tol){
 const os=cadCfg().os;if(!(os.end||os.mid||os.cen||os.int||os.nea))return null;
 let best=null;const bias={end:0,int:.5,cen:.9,mid:.7,nea:3};
 const consider=(p,kind)=>{if(!os[kind])return;const d=hyp(p,w);if(d>tol)return;const sc=d+(bias[kind]||0)*tol*.12;if(!best||sc<best.sc)best={p:{x:p.x,y:p.y},kind,sc}};
 const near=[];
 state.shapes.forEach(h=>{
  if(h.t==="hatch"||!layVis(h))return;
  const b=shapeBox(h);if(w.x<b.x0-tol||w.x>b.x1+tol||w.y<b.y0-tol||w.y>b.y1+tol)return;
  near.push(h);const P=h.pts,mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  if(h.t==="line"||h.t==="arrow"){consider(P[0],"end");consider(P[P.length-1],"end");consider(mid(P[0],P[P.length-1]),"mid")}
  else if(h.t==="poly"){P.forEach(p=>consider(p,"end"));for(let i=0;i<P.length-1;i++)consider(mid(P[i],P[i+1]),"mid");if(h.closed&&P.length>2)consider(mid(P[P.length-1],P[0]),"mid")}
  else if(h.t==="rect"){const q=shapePoly(h).pts;q.forEach((p,i)=>{consider(p,"end");consider(mid(p,q[(i+1)%4]),"mid")})}
  else if(h.t==="ellipse"||h.t==="circle"){
   let c,rx,ry;if(h.t==="circle"){c=P[0];rx=ry=hyp(P[0],P[1])}else{const bb=shapeBox(h);c={x:(bb.x0+bb.x1)/2,y:(bb.y0+bb.y1)/2};rx=(bb.x1-bb.x0)/2;ry=(bb.y1-bb.y0)/2}
   consider(c,"cen");[[1,0],[0,1],[-1,0],[0,-1]].forEach(d=>consider({x:c.x+d[0]*rx,y:c.y+d[1]*ry},"end"));
  }else if(h.t==="arc"){const g=arcGeom(P[0],P[1],P[2]);consider(P[0],"end");consider(P[2],"end");if(g){consider({x:g.cx,y:g.cy},"cen");const a=g.a0+g.dir*g.delta/2;consider({x:g.cx+g.r*Math.cos(a),y:g.cy+g.r*Math.sin(a)},"mid")}}
  else if(h.t==="dim"){consider(P[0],"end");consider(P[1],"end")}
  else if(h.t==="pen"){consider(P[0],"end");consider(P[P.length-1],"end")}
 });
 if((os.int||os.nea)&&near.length){
  const segs=[];
  near.slice(0,40).forEach(h=>shapeSegs(h).forEach(s=>{const c=closestOnSeg(w,s[0],s[1]);if(hyp(c,w)<=tol*1.2)segs.push({h,s,c})}));
  segs.forEach(a=>consider(a.c,"nea"));
  if(os.int)for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){if(segs[i].h===segs[j].h)continue;const x=segInt(segs[i].s[0],segs[i].s[1],segs[j].s[0],segs[j].s[1]);if(x)consider(x,"int")}
 }
 state.nodes.forEach(n=>{if(n.type==="text"&&layVis(n)&&hyp(n,w)<=tol&&os.end)consider({x:n.x,y:n.y},"end")});
 return best;
}
function cadSnapPoint(w,base,ev){
 const c=cadCfg(),tol=12/view.k;let kind="free",p={x:w.x,y:w.y};
 const alt=!!(ev&&ev.altKey);
 const os=alt?null:cadObjSnap(w,tol);
 if(os)return{p:os.p,kind:os.kind};
 const ortho=base&&(c.ortho!==!!(ev&&ev.shiftKey));
 if(ortho){if(Math.abs(p.x-base.x)>=Math.abs(p.y-base.y))p={x:p.x,y:base.y};else p={x:base.x,y:p.y};kind="ortho"}
 else if(base&&c.polar){
  const dx=p.x-base.x,dy=p.y-base.y,L=Math.hypot(dx,dy);
  if(L>1e-6){const a=Math.atan2(-dy,dx)*180/Math.PI,st=c.pang,sa=Math.round(a/st)*st;if(Math.abs(a-sa)<3.5){const r=sa*Math.PI/180;p={x:base.x+L*Math.cos(r),y:base.y-L*Math.sin(r)};kind="polar"}}
 }
 if(state.meta.snap&&!alt){
  const u=w2u(p),st=c.gstep,rd=v=>Math.round(v/st)*st;
  if(kind==="ortho"){if(Math.abs(p.y-base.y)<1e-9){u.x=rd(u.x)}else u.y=rd(u.y);const q=u2w(u);p=Math.abs(p.y-base.y)<1e-9?{x:q.x,y:p.y}:{x:p.x,y:q.y}}
  else if(kind==="free"){u.x=rd(u.x);u.y=rd(u.y);p=u2w(u)}
 }
 return{p,kind};
}

/* ---------- lớp phủ: nháp lệnh + marker bắt điểm + số đo động ---------- */
function gCadEl(){
 if(!CAD.gC){const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("pointer-events","none");g.id="gCad";$("gTop").appendChild(g);CAD.gC=g}
 return CAD.gC;
}
function snapMarker(p,kind){
 const k=1/view.k,s=7*k,col="#16a34a",sw=2*k,lab={end:_("Đầu mút","Endpoint"),mid:_("Trung điểm","Midpoint"),cen:_("Tâm","Centre"),int:_("Giao điểm","Intersection"),nea:_("Gần nhất","Nearest"),ortho:"Ortho",polar:"Polar"}[kind];
 let m="";
 if(kind==="end")m=`<rect x="${p.x-s}" y="${p.y-s}" width="${2*s}" height="${2*s}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
 else if(kind==="mid")m=`<path d="M${p.x-s} ${p.y+s*.8}L${p.x+s} ${p.y+s*.8}L${p.x} ${p.y-s}Z" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
 else if(kind==="cen")m=`<circle cx="${p.x}" cy="${p.y}" r="${s}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
 else if(kind==="int")m=`<path d="M${p.x-s} ${p.y-s}L${p.x+s} ${p.y+s}M${p.x+s} ${p.y-s}L${p.x-s} ${p.y+s}" stroke="${col}" stroke-width="${sw}"/>`;
 else if(kind==="nea")m=`<path d="M${p.x-s} ${p.y-s}L${p.x+s} ${p.y-s}L${p.x-s} ${p.y+s}L${p.x+s} ${p.y+s}Z" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
 else m=`<path d="M${p.x-s} ${p.y}L${p.x+s} ${p.y}M${p.x} ${p.y-s}L${p.x} ${p.y+s}" stroke="#2563eb" stroke-width="${sw*.8}"/>`;
 if(lab&&kind!=="ortho"&&kind!=="polar")m+=`<text x="${p.x+s*1.6}" y="${p.y-s*1.4}" font-size="${12*k}" font-family="Arial" fill="${col}" font-weight="700">${esc(lab)}</text>`;
 return m;
}
function cadRedraw(){
 if(!cadOn()){if(CAD.gC)CAD.gC.innerHTML="";return}
 const g=gCadEl();let s="";
 const c=CAD.cmd;
 if(c&&c.draft)s+=c.draft();
 if(c&&CAD.snap){
  const b=cadBase();
  if(b&&(CAD.snap.kind==="ortho"||CAD.snap.kind==="polar"))s+=`<path d="M${b.x} ${b.y}L${CAD.snap.p.x} ${CAD.snap.p.y}" stroke="#2563eb" stroke-width="${1.2/view.k}" stroke-dasharray="${6/view.k} ${4/view.k}" fill="none"/>`;
  s+=snapMarker(CAD.snap.p,CAD.snap.kind);
  if(b){
   const d=hyp(b,CAD.snap.p);
   if(d>0.5){const a=Math.atan2(-(CAD.snap.p.y-b.y),CAD.snap.p.x-b.x)*180/Math.PI,k=1/view.k,t=`${fmtLen(d,Math.max(cadCfg().dec,1))} ∠${(Math.round((a<0?a+360:a)*10)/10)}°`;
    s+=`<text x="${CAD.snap.p.x+14*k}" y="${CAD.snap.p.y+22*k}" font-size="${12*k}" font-family="Arial" font-weight="700" fill="#1d4ed8" stroke="#fff" stroke-width="${3*k}" paint-order="stroke">${esc(t)}</text>`}
  }
 }
 g.innerHTML=s;
}
function cadReadout(p){
 const e=$("cadXY");if(!e)return;const u=w2u(p),d=cadCfg().dec+1;
 e.textContent=`X ${u.x.toFixed(Math.min(4,d))}  Y ${u.y.toFixed(Math.min(4,d))}`;
}
const cadBase=()=>CAD.cmd&&CAD.cmd.base?CAD.cmd.base():null;

/* ---------- con trỏ ---------- */
window.addEventListener("pointermove",ev=>{
 if(!cadOn())return;
 const t=ev.target;if(!(board.contains(t)||t===board))return;
 const w=worldPt(ev);CAD.lastRaw=w;
 if(CAD.cmd){
  const sp=cadSnapPoint(w,cadBase(),ev);CAD.snap=sp;CAD.cur=sp.p;cadReadout(sp.p);
  if(CAD.cmd.move)CAD.cmd.move(sp.p,sp.kind);cadRedraw();
 }else{cadReadout(w);if(CAD.snap){CAD.snap=null;cadRedraw()}}
});
window.addEventListener("pointerdown",ev=>{
 if(!cadOn()||!CAD.cmd)return;
 const t=ev.target;if(!(board.contains(t)||t===board))return;
 if(ev.button===2){ev.preventDefault();ev.stopImmediatePropagation();cadEnter();return}
 if(ev.button===1||spaceDown)return;
 ev.preventDefault();ev.stopImmediatePropagation();
 const w=worldPt(ev),sp=cadSnapPoint(w,cadBase(),ev);CAD.snap=sp;CAD.cur=sp.p;
 CAD.cmd.click(sp.p,{ev,raw:w,kind:sp.kind});cadRedraw();
},true);
board.addEventListener("pointerleave",()=>{if(CAD.snap){CAD.snap=null;cadRedraw()}});

/* ---------- lấy đối tượng dưới con trỏ ---------- */
function pickAt(ev){
 const e=document.elementFromPoint(ev.clientX,ev.clientY);if(!e||!e.closest)return null;
 const s=e.closest("[data-shape]"),n=e.closest(".node");
 const id=s?s.dataset.shape:(n?n.dataset.id:null);if(!id)return null;
 const o=getShape(id)||getNode(id);if(!o||layLock(o))return null;return o;
}
function pickShapeNear(w,types,tol){
 tol=tol||12/view.k;let best=null;
 state.shapes.forEach(h=>{
  if(!layVis(h)||layLock(h)||(types&&!types.includes(h.t)))return;
  const sg=shapeSegs(h);let d=1e18;sg.forEach(s=>{d=Math.min(d,hyp(closestOnSeg(w,s[0],s[1]),w))});
  if(h.t==="dim"){const b=shapeBox(h);if(w.x>=b.x0&&w.x<=b.x1&&w.y>=b.y0&&w.y<=b.y1)d=Math.min(d,tol*.9)}
  if(d<=tol&&(!best||d<best.d))best={h,d};
 });
 return best?best.h:null;
}

/* ---------- nhập toạ độ bằng bàn phím ---------- */
function parseCoord(t){
 t=String(t).replace(/\s+/g,"").replace(/;/g,",");const rel=t[0]==="@";if(rel)t=t.slice(1);
 const base=cadBase(),k=cadWPU(),N="(-?\\d+(?:\\.\\d+)?)";
 let m=new RegExp("^"+N+","+N+"$").exec(t);
 if(m){const x=+m[1],y=+m[2];if(rel&&base)return{x:base.x+x*k,y:base.y-y*k};if(rel)return null;return u2w({x,y})}
 m=new RegExp("^"+N+"<"+N+"$").exec(t);
 if(m){const d=+m[1]*k,a=+m[2]*Math.PI/180,b=base||u2w({x:0,y:0});return{x:b.x+d*Math.cos(a),y:b.y-d*Math.sin(a)}}
 m=new RegExp("^"+N+"$").exec(t);
 if(m&&base){const d=+m[1]*k,dx=CAD.cur.x-base.x,dy=CAD.cur.y-base.y,L=Math.hypot(dx,dy);if(L<1e-9)return{x:base.x+d,y:base.y};return{x:base.x+dx/L*d,y:base.y+dy/L*d}}
 return null;
}
function cadSubmit(txt){
 txt=String(txt||"").trim();const c=CAD.cmd;
 if(!txt){cadEnter();return}
 if(CAD.hist[CAD.hist.length-1]!==txt)CAD.hist.push(txt);CAD.hi=CAD.hist.length;
 if(c&&c.opt&&/^[a-z]+$/i.test(txt)&&c.opt(txt.toLowerCase()))return;
 if(c&&c.click&&/^[-@\d.]/.test(txt)){
  if(c.num&&/^-?\d+(\.\d+)?$/.test(txt)&&c.num(parseFloat(txt))!==false){cadRedraw();return}
  const p=parseCoord(txt);
  if(p){CAD.cur=p;CAD.snap={p,kind:"free"};c.click(p,{typed:true});cadRedraw();return}
  setStatus(_("Không hiểu toạ độ. Dùng: x,y (tuyệt đối) • @dx,dy (tương đối) • @d<góc • hoặc một số = khoảng cách theo hướng chuột.","Cannot read the coordinate. Use: x,y (absolute) • @dx,dy (relative) • @d<angle • or a single number = distance along the cursor direction."));return;
 }
 if(c&&c.num&&/^-?\d+(\.\d+)?$/.test(txt)){c.num(parseFloat(txt));cadRedraw();return}
 const name=CAD_ALIAS[txt.toLowerCase()];
 if(name){if(!cadStart(name))return;return}
 setStatus(_(`Không có lệnh “${txt}”. Bấm ? để xem bảng lệnh.`,`Unknown command “${txt}”. Press ? for the command table.`));
}
function cadStart(name){
 if(IMMEDIATE.has(name)){CMDS[name]();return true}
 const f=CMDS[name];if(!f)return false;
 cadReset(true);
 const c=f();if(!c)return true;
 CAD.cmd=c;c.name=name;CAD.last=name;tool="cad";board.style.cursor="crosshair";
 cadPrompt();if(c.init)c.init();cadRedraw();syncCmdBtns();return true;
}
function cadPrompt(extra){
 const c=CAD.cmd;if(!c)return;const p=c.prompt();setStatus((extra?extra+" ":"")+_(p[0],p[1]));
 const e=$("cadPrompt");if(e)e.textContent=_(p[0],p[1]);
}
function cadReset(silent){
 if(CAD.cmd&&CAD.cmd.cleanup)try{CAD.cmd.cleanup()}catch(e){}
 CAD.cmd=null;CAD.snap=null;if(tool==="cad"){tool="select";board.style.cursor=""}
 if(CAD.gC)CAD.gC.innerHTML="";syncCmdBtns();const e=$("cadPrompt");if(e)e.textContent="";
 const m=$("marq");if(m)m.setAttribute("display","none");
 if(!silent)setStatus(_("Đã thoát lệnh.","Command ended."));
}
function cadEnter(){
 if(CAD.cmd){if(CAD.cmd.enter)CAD.cmd.enter();else cadReset()}
 else if(CAD.last)cadStart(CAD.last);
 cadRedraw();
}
function syncCmdBtns(){
 document.querySelectorAll("[data-cmd]").forEach(b=>{const on=CAD.cmd&&CAD.cmd.name===b.dataset.cmd;b.classList.toggle("active",!!on);b.setAttribute("aria-pressed",!!on)});
 const s=document.querySelector('.tool[data-tool="select"]');if(s&&cadOn())s.classList.toggle("active",!CAD.cmd&&tool==="select");
}

/* ---------- bàn phím (bắt ở giai đoạn capture để chặn phím tắt PFD) ---------- */
window.addEventListener("keydown",ev=>{
 if(!cadOn())return;
 const ae=document.activeElement,tg=ae?ae.tagName:"",inp=ae&&ae.id==="cadIn";
 const mod=ev.ctrlKey||ev.metaKey,typing=!inp&&(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT");
 const stop=()=>{ev.preventDefault();ev.stopImmediatePropagation()};
 if(inp){
  if(ev.key==="Enter"||ev.key===" "){stop();const v=ae.value;if(ev.key===" "&&/[,;<@]$/.test(v))return;ae.value="";cadSubmit(v);return}
  if(ev.key==="Escape"){stop();ae.value="";ae.blur();cadReset();return}
  if(ev.key==="ArrowUp"){stop();if(CAD.hi>0){CAD.hi--;ae.value=CAD.hist[CAD.hi]||""}return}
  if(ev.key==="ArrowDown"){stop();if(CAD.hi<CAD.hist.length-1){CAD.hi++;ae.value=CAD.hist[CAD.hi]||""}else{CAD.hi=CAD.hist.length;ae.value=""}return}
  ev.stopImmediatePropagation();return;
 }
 if(typing||mod||ev.altKey)return;
 if(document.querySelector(".modal.open"))return;
 if(ev.key==="F3"){stop();cadToggle("os");return}
 if(ev.key==="F8"){stop();cadToggle("ortho");return}
 if(ev.key==="F9"){stop();cadToggle("snap");return}
 if(ev.key==="F10"){stop();cadToggle("polar");return}
 if(ev.key==="Escape"){if(CAD.cmd){stop();cadReset()}else if(sel.size){stop();sel=new Set();renderNodes();renderShapes();renderProps()}return}
 if(ev.key==="Enter"){stop();cadEnter();return}
 if(ev.key==="?"){stop();toggleHelp(true);return}
 if(ev.key.length===1&&/[a-z]/i.test(ev.key)||(CAD.cmd&&ev.key.length===1&&/[-@\d.<,;]/.test(ev.key))){
  const e=$("cadIn");if(e){stop();e.focus();e.value+=ev.key;return}
 }
},true);

/* ---------- mô tả ngắn một hình (đọc to / thông báo) ---------- */
function shapeBrief(h){
 const nm=T_(SHAPE_T[h.t]),P=h.pts,u=p=>{const q=w2u(p),d=Math.min(3,cadCfg().dec+1);return`(${q.x.toFixed(d)}; ${q.y.toFixed(d)})`},un=cadCfg().unit;
 const L=l=>fmtLen(l,Math.max(cadCfg().dec,1))+" "+un;
 let s=nm+": ";
 switch(h.t){
  case"line":case"arrow":{const a=Math.atan2(-(P[1].y-P[0].y),P[1].x-P[0].x)*180/Math.PI;s+=_(`từ ${u(P[0])} đến ${u(P[1])}, dài ${L(hyp(P[0],P[1]))}, góc ${Math.round((a<0?a+360:a)*10)/10}°`,`from ${u(P[0])} to ${u(P[1])}, length ${L(hyp(P[0],P[1]))}, angle ${Math.round((a<0?a+360:a)*10)/10}°`);break}
  case"circle":s+=_(`tâm ${u(P[0])}, bán kính ${L(hyp(P[0],P[1]))}`,`centre ${u(P[0])}, radius ${L(hyp(P[0],P[1]))}`);break;
  case"arc":{const g=arcGeom(P[0],P[1],P[2]);s+=g?_(`tâm ${u({x:g.cx,y:g.cy})}, bán kính ${L(g.r)}, góc quét ${Math.round(g.delta*180/Math.PI*10)/10}°`,`centre ${u({x:g.cx,y:g.cy})}, radius ${L(g.r)}, sweep ${Math.round(g.delta*180/Math.PI*10)/10}°`):_("ba điểm thẳng hàng","three collinear points");break}
  case"rect":{const b=shapeBox(h);s+=_(`${L(b.x1-b.x0)} × ${L(b.y1-b.y0)}, góc dưới trái ${u({x:b.x0,y:b.y1})}`,`${L(b.x1-b.x0)} × ${L(b.y1-b.y0)}, lower-left ${u({x:b.x0,y:b.y1})}`);break}
  case"ellipse":{const b=shapeBox(h);s+=_(`hai bán trục ${L((b.x1-b.x0)/2)} và ${L((b.y1-b.y0)/2)}`,`semi-axes ${L((b.x1-b.x0)/2)} and ${L((b.y1-b.y0)/2)}`);break}
  case"poly":{let len=0;for(let i=0;i<P.length-1;i++)len+=hyp(P[i],P[i+1]);if(h.closed)len+=hyp(P[P.length-1],P[0]);s+=_(`${P.length} đỉnh, ${h.closed?"khép kín, chu vi":"hở, dài"} ${L(len)}`,`${P.length} vertices, ${h.closed?"closed, perimeter":"open, length"} ${L(len)}`);break}
  case"dim":{const g=dimGeom(h);s+=_(`giá trị ${g.text?g.text.str:""}`,`value ${g.text?g.text.str:""}`);break}
  case"hatch":s+=_(`${h.hpat==="solid"?"tô đặc":h.hpat==="cross"?"lưới chéo":"gạch chéo"}, ${P.length} đỉnh biên`,`${h.hpat==="solid"?"solid":h.hpat==="cross"?"cross-hatch":"hatch lines"}, ${P.length} boundary vertices`);break;
  default:s+=P.length+_(" điểm"," points");
 }
 const l=h.lay&&state.meta.cad.layers.find(x=>x.id===h.lay);
 return s+(l?_(". Lớp ",". Layer ")+layName(l):"")+".";
}

/* ---------- bảng thuộc tính khi dùng SimCAD ---------- */
function renderCadProps(){
 const box=$("props"),c=CAD.cmd,l=curLayer();
 const p=c?c.prompt():null;
 box.innerHTML=`<h3 class="ph">SimCAD</h3>
 <div class="hint"><b>${_("Lớp hiện hành","Current layer")}:</b> ${esc(layName(l))}<br>${c?`<b>${_("Lệnh","Command")}:</b> ${esc(_(...p))}`:_("Chưa chọn đối tượng. Gõ chữ cái đầu của lệnh rồi Enter (L = đường thẳng, C = tròn, REC = chữ nhật, M = di chuyển, D = kích thước…), hoặc bấm nút trên thanh công cụ.","Nothing selected. Type the first letters of a command then Enter (L = line, C = circle, REC = rectangle, M = move, D = dimension…), or use the toolbar buttons.")}</div>
 <div class="hint" style="margin-top:.5rem"><b>${_("Nhập toạ độ bằng bàn phím","Keyboard coordinate entry")}:</b><br>• <code>100,50</code> ${_("toạ độ tuyệt đối (X,Y)","absolute (X,Y)")}<br>• <code>@100,50</code> ${_("cách điểm trước dX,dY","relative to the last point")}<br>• <code>@100&lt;45</code> ${_("dài 100, góc 45°","length 100 at 45°")}<br>• <code>100</code> ${_("khoảng cách theo hướng con trỏ","distance along the cursor direction")}</div>`;
}
function cadShapeFields(h){
 const c=cadCfg(),k=Math.min(3,c.dec+1);
 let s=`<label for="shLay">${_("Lớp","Layer")}</label><select id="shLay">${c.layers.map(l=>`<option value="${esc(l.id)}"${l.id===h.lay?" selected":""}>${esc(layName(l))}</option>`).join("")}</select>`;
 s+=`<div class="hint" id="shInfo" style="margin:.4rem 0">${esc(shapeBrief(h))}</div>`;
 if(h.t==="dim"){
  s+=`<label for="shDt">${_("Chữ thay thế (để trống = đo tự động)","Text override (empty = measured value)")}</label><input id="shDt" value="${esc(h.dt||"")}">`;
  if(h.ds==="h"||h.ds==="v"||h.ds==="al")s+=`<label for="shDs">${_("Kiểu đo","Measure type")}</label><select id="shDs">${optList([["al",_("Song song (aligned)","Aligned")],["h",_("Ngang","Horizontal")],["v",_("Dọc","Vertical")]],h.ds)}</select>`;
 }
 if(h.t==="hatch"){
  s+=`<label for="shHp">${_("Kiểu hatch","Hatch pattern")}</label><select id="shHp">${optList([["lines",_("Gạch chéo","Diagonal lines")],["cross",_("Lưới chéo","Cross-hatch")],["solid",_("Tô đặc","Solid")]],h.hpat)}</select>
  <div class="row"><div><label for="shHa">${_("Góc (°)","Angle (°)")}</label><input id="shHa" type="number" step="5" value="${h.ha||0}"></div><div><label for="shHs">${_("Khoảng cách nét (mm giấy)","Line spacing (paper mm)")}</label><input id="shHs" type="number" min="0.5" step="0.5" value="${+(h.hs/MM).toFixed(2)}"></div></div>`;
 }
 const ptLabels={line:[_("Điểm đầu","Start"),_("Điểm cuối","End")],arrow:[_("Gốc","Tail"),_("Đầu mũi tên","Head")],circle:[_("Tâm","Centre"),_("Điểm trên đường tròn","Point on circle")],rect:[_("Góc 1","Corner 1"),_("Góc 2","Corner 2")],ellipse:[_("Góc 1 khung bao","Bounding corner 1"),_("Góc 2 khung bao","Bounding corner 2")],arc:[_("Điểm đầu","Start"),_("Điểm giữa cung","Point on arc"),_("Điểm cuối","End")],dim:[_("Điểm đo 1","Measure point 1"),_("Điểm đo 2","Measure point 2"),_("Vị trí đường kích thước","Dimension line position")]};
 if(ptLabels[h.t]||(h.t==="poly"&&h.pts.length<=12)){
  s+=`<details${h.t==="poly"?"":" open"}><summary>${_("Toạ độ các điểm (","Point coordinates (")}${c.unit})</summary>`;
  h.pts.forEach((p,i)=>{const u=w2u(p),lb=(ptLabels[h.t]&&ptLabels[h.t][i])||(_("Đỉnh ","Vertex ")+(i+1));
   s+=`<div class="row"><div><label for="shX${i}">${esc(lb)} X</label><input id="shX${i}" type="number" step="any" data-pt="${i}" data-ax="x" value="${+u.x.toFixed(k)}"></div><div><label for="shY${i}">${esc(lb)} Y</label><input id="shY${i}" type="number" step="any" data-pt="${i}" data-ax="y" value="${+u.y.toFixed(k)}"></div></div>`});
  s+=`</details>`;
 }
 return s;
}
function cadBindShape(h){
 const lay=$("shLay");if(lay)lay.addEventListener("change",()=>{h.lay=lay.value;const l=layerById(h.lay);h.col=l.col;h.sw=l.sw;h.dash=l.dash;commit(_("Đổi lớp","Change layer"));renderAll()});
 bindIn("shDt",v=>{h.dt=v});
 const ds=$("shDs");if(ds)ds.addEventListener("change",()=>{h.ds=ds.value;commit(_("Đổi kiểu đo","Dimension type"));renderAll()});
 const hp=$("shHp");if(hp)hp.addEventListener("change",()=>{h.hpat=hp.value;commit(_("Đổi kiểu hatch","Hatch pattern"));renderAll()});
 bindIn("shHa",v=>{h.ha=+v||0});bindIn("shHs",v=>{h.hs=Math.max(2,(+v||3)*MM)});
 document.querySelectorAll("[data-pt]").forEach(el=>{
  el.addEventListener("input",()=>{
   const i=+el.dataset.pt,u=w2u(h.pts[i]);const v=parseFloat(el.value);if(!isFinite(v))return;u[el.dataset.ax]=v;h.pts[i]=u2w(u);
   if(h.t==="rect"||h.t==="ellipse"){}
   renderShapes();const inf=$("shInfo");if(inf)inf.textContent=shapeBrief(h);
  });
  el.addEventListener("change",()=>{pendLabel=_("Sửa toạ độ","Edit coordinates");commit();renderProps()});
 });
}
