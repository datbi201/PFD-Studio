/* ============ HIỂN THỊ TRÊN MÀN HÌNH ============ */
const board=$("board"),vp=$("viewport"),gSheet=$("gSheet"),gShB=$("gShB"),gEdges=$("gEdges"),gNodes=$("gNodes"),gShF=$("gShF"),gDraft=$("gDraft"),gHand=$("gHand");
const SHAPE_TOOLS=["line","arrow","rect","ellipse","poly","pen"],LINE_TOOLS=["line","arrow"];
function applyView(){
 vp.setAttribute("transform",`translate(${view.x},${view.y}) scale(${view.k})`);$("zoomLbl").textContent=Math.round(view.k*100)+"%";
 if(selShapes().length===1&&sel.size===1)renderShapes();
 if(selEdge)renderEdges();
}
function setBoardBg(){board.style.background=state.meta.showSheet?SCH.board:SCH.paper}
function renderSheet(){gSheet.innerHTML=sheetMarkup(true)}
function allShapePts(h){return h.pts}
function mapShapePts(h,fn){h.pts=h.pts.map(fn)}
function detachShape(h){delete h.a0;delete h.a1}
function detachOutside(h,ids){["a0","a1"].forEach(k=>{if(h[k]&&!ids.has(h[k].n))delete h[k]})}
function ptSnap(ev){const w=worldPt(ev);return{x:sn(w.x),y:sn(w.y)}}
function renderShapes(){syncShapeAttach();gShB.innerHTML=shapesMarkup("b",true);gShF.innerHTML=shapesMarkup("f",true)}
function renderEdges(){gEdges.innerHTML=edgesMarkup(true);gHand.innerHTML=HANDLES}
/* vòng báo điểm hút (snap) */
function snapRing(sn){return sn?`<circle cx="${r3(sn.x)}" cy="${r3(sn.y)}" r="${r3(Math.max(7,11/view.k))}" fill="none" stroke="#16a34a" stroke-width="3"/>`:""}
function renderNodes(){gNodes.innerHTML=nodesMarkup(true)}
function renderCanvasOnly(){updateRS();$("dynDefs").innerHTML=gridDefs()+markerDefs();setBoardBg();renderSheet();renderShapes();renderEdges();renderNodes();if(typeof renderDg==="function")renderDg()}
function renderAll(){applyView();renderCanvasOnly();renderProps();updateToolUI();$("layoutBox").innerHTML=layoutButtons(true)}
function worldPt(ev){const r=board.getBoundingClientRect();return{x:(ev.clientX-r.left-view.x)/view.k,y:(ev.clientY-r.top-view.y)/view.k}}
function zoomAt(cx,cy,f){const r=board.getBoundingClientRect(),bx=(cx-r.left-view.x)/view.k,by=(cy-r.top-view.y)/view.k;view.k=Math.min(4,Math.max(.05,view.k*f));view.x=cx-r.left-bx*view.k;view.y=cy-r.top-by*view.k;applyView()}
function zoomBy(f){const r=board.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,f)}
function contentBBox(){
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 state.nodes.forEach(n=>{const d=symDef(n),sc=n.type==="area"?1:(n.sc||1),q=(n.rot||0)%180;const hw=(q?d.h:d.w)/2*sc+40,hh=(q?d.w:d.h)/2*sc+50;x0=Math.min(x0,n.x-hw);x1=Math.max(x1,n.x+hw);y0=Math.min(y0,n.y-hh);y1=Math.max(y1,n.y+hh)});
 state.edges.forEach(e=>{const g=edgeGeom(e);if(g)g.pts.forEach(p=>{x0=Math.min(x0,p.x-20);x1=Math.max(x1,p.x+20);y0=Math.min(y0,p.y-30);y1=Math.max(y1,p.y+30)})});
 state.shapes.forEach(h=>{const b=shapeBox(h);x0=Math.min(x0,b.x0-20);x1=Math.max(x1,b.x1+20);y0=Math.min(y0,b.y0-20);y1=Math.max(y1,b.y1+20)});
 if(typeof dgBBox==="function"&&state.dg){const b=dgBBox();if(b){x0=Math.min(x0,b.x0-(state.meta.dg?state.meta.dg.pad:0));y0=Math.min(y0,b.y0-(state.meta.dg?state.meta.dg.pad:0));x1=Math.max(x1,b.x1+(state.meta.dg?state.meta.dg.pad:0));y1=Math.max(y1,b.y1+(state.meta.dg?state.meta.dg.pad:0))}}
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
  if(s.nopal)return;
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
 if(sel.size===1){const n=getNode([...sel][0]);if(n)setStatus(_(`Đã chọn: ${n.tag||""} ${nTitle(n)||T_(SYMBOLS[n.type].label)}. Mũi tên để dịch chuyển, F2 sửa tag, Delete để xoá.`,`Selected: ${n.tag||""} ${nTitle(n)||T_(SYMBOLS[n.type].label)}. Arrow keys to move, F2 to edit tag, Delete to remove.`));
  else{const h=getShape([...sel][0]);if(h)setStatus(_(`Đã chọn hình vẽ: ${T_(SHAPE_T[h.t])}. Kéo để di chuyển, kéo chấm tròn để đổi hình.`,`Selected shape: ${T_(SHAPE_T[h.t])}. Drag to move; drag the handles to reshape.`))}}
 else if(sel.size>1)setStatus(_(`Đã chọn ${sel.size} đối tượng.`,`${sel.size} objects selected.`));
}
function selectEdge(id){selEdge=id;sel=new Set();renderEdges();renderNodes();renderShapes();renderProps();const e=state.edges.find(x=>x.id===id);if(e){const a=getNode(e.from),b=getNode(e.to);setStatus(_(`Đã chọn đường ${e.num?"số "+e.num:""}: ${a?a.tag||a.title:"?"} → ${b?b.tag||b.title:"?"}.`,`Selected line ${e.num?"No. "+e.num:""}: ${a?a.tag||a.title:"?"} → ${b?b.tag||b.title:"?"}.`))}}
function deleteSelected(){
 if(dgOn())return dgDeleteSel();
 if(!sel.size&&!selEdge){setStatus(_("Chưa chọn gì để xoá.","Nothing selected to delete."));return}
 if(sel.size){const cnt=sel.size;state.nodes=state.nodes.filter(n=>!sel.has(n.id));state.shapes=state.shapes.filter(h=>!sel.has(h.id));state.edges=state.edges.filter(e=>!sel.has(e.from)&&!sel.has(e.to));setStatus(_(`Đã xoá ${cnt} đối tượng (Ctrl+Z để hoàn tác).`,`Deleted ${cnt} object(s) (Ctrl+Z to undo).`));sel=new Set();commit(_(`Xoá ${cnt} đối tượng`,`Delete ${cnt} object(s)`))}
 if(selEdge){state.edges=state.edges.filter(e=>e.id!==selEdge);selEdge=null;setStatus(_("Đã xoá đường ống (Ctrl+Z để hoàn tác).","Line deleted (Ctrl+Z to undo)."));commit(_("Xoá đường ống","Delete line"))}
 renderAll();
}
function rotateSel(){const a=selNodes(),b=selShapes();if(!a.length&&!b.length)return;a.forEach(n=>n.rot=((n.rot||0)+90)%360);b.forEach(h=>{const bb=shapeBox(h),cx=(bb.x0+bb.x1)/2,cy=(bb.y0+bb.y1)/2;mapShapePts(h,p=>({x:cx-(p.y-cy),y:cy+(p.x-cx)}));detachShape(h)});commit(_("Xoay 90°","Rotate 90°"));renderAll()}
function flipSel(){const a=selNodes(),b=selShapes();a.forEach(n=>n.flip=!n.flip);b.forEach(h=>{const bb=shapeBox(h),cx=(bb.x0+bb.x1)/2;mapShapePts(h,p=>({x:2*cx-p.x,y:p.y}));detachShape(h)});commit(_("Lật","Flip"));renderAll()}
function retag(c){const m=/^([A-Za-z]+)-\d+/.exec(c.tag||"");return m?nextTag(m[1]):c.tag}
function copySel(){
 if(!sel.size)return;const ids=new Set(sel);
 clip={n:0,nodes:JSON.parse(JSON.stringify(state.nodes.filter(n=>ids.has(n.id)))),shapes:JSON.parse(JSON.stringify(state.shapes.filter(h=>ids.has(h.id)))),edges:JSON.parse(JSON.stringify(state.edges.filter(e=>(e.from||e.to)&&(!e.from||ids.has(e.from))&&(!e.to||ids.has(e.to)))))};
 setStatus(_(`Đã sao chép ${ids.size} đối tượng.`,`Copied ${ids.size} object(s).`));
}
function pasteClip(){
 if(!clip)return;clip.n++;const map={},ids=new Set();
 clip.nodes.forEach(n=>{const c=JSON.parse(JSON.stringify(n)),nid=uid("n");map[n.id]=nid;c.id=nid;c.x+=30*clip.n;c.y+=30*clip.n;c.tag=retag(c);state.nodes.push(c);ids.add(nid)});
 clip.shapes.forEach(h=>{const c=JSON.parse(JSON.stringify(h));c.id=uid("s");mapShapePts(c,p=>({x:p.x+30*clip.n,y:p.y+30*clip.n}));["a0","a1"].forEach(k=>{if(c[k]){if(map[c[k].n])c[k].n=map[c[k].n];else delete c[k]}});state.shapes.push(c);ids.add(c.id)});
 clip.edges.forEach(e=>{const c=JSON.parse(JSON.stringify(e));c.id=uid("e");c.from=e.from?map[e.from]:"";c.to=e.to?map[e.to]:"";if(c.fp)c.fp={x:c.fp.x+30*clip.n,y:c.fp.y+30*clip.n};if(c.tp)c.tp={x:c.tp.x+30*clip.n,y:c.tp.y+30*clip.n};c.mid=null;if(c.num!=="")c.num=String(state.nextStream++);state.edges.push(c)});
 sel=ids;selEdge=null;commit(_("Dán","Paste"));renderAll();setStatus(_(`Đã dán ${ids.size} đối tượng.`,`Pasted ${ids.size} object(s).`));
}
function dupSel(){copySel();pasteClip()}
function reverseEdge(){const e=state.edges.find(x=>x.id===selEdge);if(!e)return;[e.from,e.to]=[e.to,e.from];[e.fromPort,e.toPort]=[e.toPort,e.fromPort];{const a=e.fp,b=e.tp;delete e.fp;delete e.tp;if(b)e.fp=b;if(a)e.tp=a}e.mid=null;e.midAxis=null;commit(_("Đảo chiều ống","Reverse line"));renderAll()}
function resetRoute(){const e=state.edges.find(x=>x.id===selEdge);if(!e)return;e.mid=null;e.midAxis=null;commit(_("Đường đi tự động","Auto route"));renderAll()}
function insertOnEdge(type){
 const e=state.edges.find(x=>x.id===selEdge);if(!e||!SYMBOLS[type])return;const g=edgeGeom(e);if(!g)return;
 let bi=0,bl=-1;for(let i=0;i<g.pts.length-1;i++){const l=Math.hypot(g.pts[i+1].x-g.pts[i].x,g.pts[i+1].y-g.pts[i].y);if(l>bl){bl=l;bi=i}}
 const p=g.pts[bi],q=g.pts[bi+1],horiz=Math.abs(q.y-p.y)<.5,fwd=horiz?q.x>p.x:q.y>p.y,mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
 const n=mkNode(type,mx,my);n.rot=horiz?0:90;
 const inP=fwd?"w":"e",outP=fwd?"e":"w",pi=portRel(n,inP);
 if(horiz){n.x=sn(mx);n.y=my-pi.y}else{n.y=sn(my);n.x=mx-pi.x}
 const e2=JSON.parse(JSON.stringify(e));e2.id=uid("e");e2.from=n.id;e2.fromPort=outP;delete e2.fp;e2.mid=null;e2.midAxis=null;
 e.to=n.id;e.toPort=inP;delete e.tp;e.mid=null;e.midAxis=null;state.edges.push(e2);
 sel=new Set([n.id]);selEdge=null;commit(_("Chèn ","Insert ")+T_(SYMBOLS[type].label));renderAll();setStatus(_(`Đã chèn ${T_(SYMBOLS[type].label)} ${n.tag} lên đường ống.`,`Inserted ${T_(SYMBOLS[type].label)} ${n.tag} on the line.`));
}
/* tách ống tại điểm tg (từ edgeTarget), đặt điểm rẽ nhánh (junction); trả {node,port} là cổng để nối nhánh
   side = điểm đầu kia của nhánh, dùng để chọn phía rẽ */
function makeTee(tg,side){
 const e=state.edges.find(x=>x.id===tg.edge);if(!e)return null;
 const n=mkNode("junction",tg.x,tg.y);
 const inP=tg.horiz?(tg.fwd?"w":"e"):(tg.fwd?"n":"s"),outP=tg.horiz?(tg.fwd?"e":"w"):(tg.fwd?"s":"n");
 const e2=JSON.parse(JSON.stringify(e));e2.id=uid("e");e2.from=n.id;e2.fromPort=outP;delete e2.fp;e2.mid=null;e2.midAxis=null;
 if(e2.num!==""&&e2.num!=null&&e2.kind!=="signal"&&e2.kind!=="shaft")e2.num=String(state.nextStream++);
 e.to=n.id;e.toPort=inP;delete e.tp;e.mid=null;e.midAxis=null;
 const k=state.edges.indexOf(e);state.edges.splice(k+1,0,e2);
 const bp=tg.horiz?((side&&side.y<tg.y)?"n":"s"):((side&&side.x<tg.x)?"w":"e");
 return{node:n.id,port:bp};
}
const teeRing=p=>p?`<circle cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(Math.max(8,12/view.k))}" fill="#16a34a" fill-opacity=".25" stroke="#16a34a" stroke-width="3"/><circle cx="${r3(p.x)}" cy="${r3(p.y)}" r="${r3(Math.max(3,4/view.k))}" fill="#16a34a"/>`:"";
function inferKind(A,fp,B,tp){
 const pa=A&&symDef(A).ports.find(p=>p.id===fp),pb=B&&symDef(B).ports.find(p=>p.id===tp);
 if((A&&SYMBOLS[A.type].bub)||(B&&SYMBOLS[B.type].bub))return"signal";
 if((pa&&pa.l==="SHAFT")||(pb&&pb.l==="SHAFT"))return"shaft";
 const tk={truck:"road",rail:"rail",ship:"sea"};
 return(A&&tk[A.type])||(B&&tk[B.type])||"process";
}
function newEdge(from,fp,to,tp,kind){
 const sig=kind==="signal"||kind==="shaft";
 return{id:uid("e"),from,fromPort:fp,to,toPort:tp,kind,phase:"",num:sig?"":String(state.nextStream++),service:"",size:"",std:"",nps:"",sch:"",wall:"",od:"",mat:"",matOther:"",cls:"",dist:"",P:"",T:"",flow:"",mid:null,midAxis:null,wt:1};
}
/* tạo đường ống có thể hở đầu: a/b = {node,port} hoặc {x,y} */
function makeOpenEdge(a,b){
 const e=newEdge(a.node||"",a.port||"",b.node||"",b.port||"",inferKind(a.node&&getNode(a.node),a.port,b.node&&getNode(b.node),b.port));
 if(!a.node)e.fp={x:a.x,y:a.y};if(!b.node)e.tp={x:b.x,y:b.y};
 if(!a.node&&!b.node&&e.kind!=="signal"&&e.kind!=="shaft"){e.num="";state.nextStream--}
 return e;
}
function makeEdge(from,fp,to,tp){
 if(from===to)return;
 if(state.edges.some(e=>e.from===from&&e.fromPort===fp&&e.to===to&&e.toPort===tp)){setStatus(_("Hai cổng này đã được nối.","These two ports are already connected."));return}
 const A=getNode(from),B=getNode(to),e=newEdge(from,fp,to,tp,inferKind(A,fp,B,tp));
 state.edges.push(e);selEdge=e.id;sel=new Set();commit(_("Nối ống","Connect"));renderAll();
 setStatus(_("Đã nối. Điền số dòng, dịch vụ, size / schedule, vật liệu ở bảng Thuộc tính bên phải.","Connected. Fill in line no., service, size / schedule and material in the Properties panel."));
}

/* hình vẽ → thiết bị tuỳ chỉnh (có điểm nối, nối ống được) */
function shapeToDevice(h){
 const b=shapeBox(h),cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,w=b.x1-b.x0,hh=b.y1-b.y0;
 const open=h.t==="line"||h.t==="arrow"||h.t==="pen"||(h.t==="poly"&&!h.closed);let cs;
 if(h.t==="rect")cs={t:"rect",w,h:hh,rx:h.rx||0};else if(h.t==="ellipse")cs={t:"ellipse",w,h:hh};
 else cs={t:h.t==="pen"?"pen":"poly",w,h:hh,pts:h.pts.map(p=>({x:r2(p.x-cx),y:r2(p.y-cy)})),closed:!open};
 const n={id:uid("n"),type:"cshape",v:0,x:r2(cx),y:r2(cy),rot:0,flip:false,sc:1,lp:"b",tag:"",title:"",props:"",cs:cleanCs(cs)};
 if(h.col&&String(h.col).toLowerCase()!==INK)n.ln=cleanCol(h.col)||undefined;if(!n.ln)delete n.ln;
 if(h.fill&&!open){n.fl=cleanCol(h.fill);if(!n.fl)delete n.fl;if(h.fo<1)n.fo=h.fo}
 if(h.dash)n.ld=h.dash;const lw=Math.round(h.sw/1.8*10)/10;if(Math.abs(lw-1)>.05&&lw>0)n.lw=Math.min(4,Math.max(.3,lw));
 if(h.nb||h.sw<=0)n.nb=true;
 state.shapes=state.shapes.filter(x=>x!==h);state.nodes.push(n);sel=new Set([n.id]);selEdge=null;
 return n;
}
function detachEnd(e,end){
 const pt=endPt(e,end);if(!pt||pt.free)return;const fk=end==="from"?"fp":"tp";
 e[end]="";e[end+"Port"]="";e[fk]={x:r2(pt.x),y:r2(pt.y)};e.mid=null;e.midAxis=null;
}
/* ============ CÔNG CỤ ============ */
const TOOL_HINT={
 select:["Chế độ chọn / kéo.","Select / drag mode."],connect:["Nối ống: kéo từ chấm xanh nguồn sang chấm đích, hoặc bấm chấm nguồn rồi chấm đích.","Connect: drag from a source dot to a target dot, or click source then target."],
 text:["Bấm lên bản vẽ để thêm khung chữ.","Click on the drawing to add a text box."],pan:["Kéo để di chuyển khung nhìn.","Drag to pan the view."],
 open:["Ống hở / mũi tên công nghệ: kéo từ điểm bất kỳ (hoặc từ điểm nối thiết bị) tới nơi cần; thả lên điểm nối thiết bị để gắn vào, thả ra ngoài để để hở. Giữ Alt để không hút điểm nối.","Open pipe / process arrow: drag from anywhere (or from a device port) to the end point; drop on a device port to attach, or in empty space to leave it open. Hold Alt to disable snapping."],
 port:["Thêm điểm nối: bấm vào thiết bị tại vị trí cần thêm cổng nối ống (Esc để thoát).","Add port: click on a device where a new pipe connection is needed (Esc to exit)."],
 line:["Vẽ đường thẳng: kéo từ điểm đầu đến điểm cuối.","Line: drag from start to end."],arrow:["Vẽ mũi tên: kéo từ gốc đến đầu mũi tên.","Arrow: drag from tail to head."],
 rect:["Vẽ hình chữ nhật: kéo chéo góc.","Rectangle: drag diagonally."],ellipse:["Vẽ hình tròn / elip: kéo chéo khung bao.","Ellipse: drag the bounding box."],
 poly:["Đa tuyến: bấm từng điểm; bấm đúp hoặc Enter để kết thúc; bấm lại điểm đầu để khép kín.","Polyline: click points; double-click or Enter to finish; click the first point to close."],
 pen:["Bút tự do: giữ chuột và vẽ.","Freehand pen: press and draw."]};
function setTool(t){
 tool=t;polyDraft=null;gDraft.innerHTML="";
 if(conn){conn=null;hideTemp()}
 board.classList.toggle("connecting",t==="connect");
 board.style.cursor=t==="pan"?"grab":t==="text"?"text":(t==="connect"||t==="port"||t==="open"||SHAPE_TOOLS.includes(t))?"crosshair":"default";
 updateToolUI();renderProps();setStatus(_(...(TOOL_HINT[t]||TOOL_HINT.select)));
}
function updateToolUI(){document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b.dataset.tool===tool));const bp=$("btnPorts");if(bp)bp.classList.toggle("active",SHOWPORTS);board.classList.toggle("showports",SHOWPORTS)}
function hideTemp(){$("tempEdge").setAttribute("display","none");gDraft.innerHTML="";board.classList.toggle("connecting",tool==="connect")}
function showTemp(ev){
 if(!conn)return;const n=getNode(conn.node);if(!n)return;const a=portPos(n,conn.port),w=worldPt(ev);
 const t=$("tempEdge");t.setAttribute("display","inline");t.setAttribute("d",`M ${a.x} ${a.y} L ${w.x} ${w.y}`);
 const s0=ev.altKey?null:snapTarget(w,12/view.k,conn.node),tg=s0?null:(ev.altKey?null:edgeTarget(w,12/view.k,null));
 gDraft.innerHTML=s0?snapRing(s0):teeRing(tg);
}
/* kiểu nét vẽ mặc định */
const penStyle={col:"#17202a",sw:2,dash:"",fill:"",fo:.25,ah:0,nb:false,as:1};
let polyDraft=null;
function mkShape(t,pts){
 const ps=penStyle,h={id:uid("s"),t,pts,col:ps.col,sw:ps.sw,dash:ps.dash,fill:ps.fill,fo:ps.fo,ah:t==="arrow"?(ps.ah||1):(t==="line"||t==="poly"||t==="pen"?ps.ah:0),closed:t==="rect"||t==="ellipse",rx:0,z:"f"};
 if(ps.nb)h.nb=true;if(+ps.as>0&&+ps.as!==1)h.as=+ps.as;
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
 if(tool==="open"){startOpen(ev);return}
 if(tool==="port"){
  if(nodeEl){const n=getNode(nodeEl.dataset.id);if(n&&!["text","area"].includes(n.type)){const pf=portFromPoint(n,worldPt(ev)),p=addPortTo(n,pf.s,pf.f);sel=new Set([n.id]);selEdge=null;commit(_("Thêm điểm nối ","Add port ")+(n.tag||""));renderAll();setStatus(_(`Đã thêm điểm nối ${p.id} cho ${n.tag||nTitle(n)}. Đặt tên / chỉnh vị trí ở bảng Thuộc tính.`,`Added port ${p.id} to ${n.tag||n.title}. Name / adjust it in the Properties panel.`))}}
  else if(shapeEl){const h=getShape(shapeEl.dataset.shape);if(h){const w=worldPt(ev),n=shapeToDevice(h);const pf=portFromPoint(n,w),p=addPortTo(n,pf.s,pf.f);commit(_("Hình vẽ thành thiết bị + điểm nối","Shape to device + port"));renderAll();setStatus(_(`Đã biến hình vẽ thành thiết bị tuỳ chỉnh và thêm điểm nối ${p.id}. Bấm P rồi bấm tiếp để thêm điểm nối khác.`,`Shape converted to a custom device and port ${p.id} added. Keep pressing on it to add more ports.`))}}
  return;
 }
 if(portEl){
  if(ev.altKey&&portEl.dataset.xp){ptr={type:"pmove",node:portEl.dataset.node,port:portEl.dataset.port,moved:false};return}
  startConn(ev,portEl.dataset.node,portEl.dataset.port);return;
 }
const eendEl=cl("[data-eend]");
 if(eendEl){const pp=eendEl.dataset.eend.split(":");ptr={type:"eend",id:pp[0],end:pp[1],moved:false,x0:ev.clientX,y0:ev.clientY};return}
 if(handleEl){const e=state.edges.find(x=>x.id===handleEl.dataset.handle),g=e&&edgeGeom(e);if(g&&g.axis){ptr={type:"handle",id:e.id,axis:g.axis,moved:false}}return}
 if(shhEl&&shhEl.dataset.sh){ptr={type:"shh",id:shhEl.dataset.sh,pi:shhEl.dataset.pi,moved:false};return}
 if(nodeEl){objDown(ev,nodeEl.dataset.id);return}
 if(shapeEl){objDown(ev,shapeEl.dataset.shape);return}
 if(edgeEl){
  if(conn&&conn.armed&&tool==="connect"){const tg=edgeTarget(worldPt(ev),14/view.k,null),n0=getNode(conn.node);if(tg&&n0){const t=makeTee(tg,portPos(n0,conn.port)),c0=conn;conn=null;hideTemp();if(t)makeEdge(c0.node,c0.port,t.node,t.port);return}}
  selectEdge(edgeEl.dataset.edge);return}
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
 ptr={type:"drag",att:state.shapes.some(h=>h.a0||h.a1),w0:w,starts:[...sel].map(i=>{const n=getNode(i);if(n)return{id:i,x:n.x,y:n.y};const h=getShape(i);return h?{id:i,pts:h.pts.map(p=>({...p}))}:null}).filter(Boolean),moved:false};
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
 if(!target&&!ev.altKey){const tg=edgeTarget(worldPt(ev),12/view.k,null),sn0=getNode(c.node);if(tg&&sn0){const sp=portPos(sn0,c.port),t=makeTee(tg,sp);if(t)target={node:t.node,port:t.port}}}
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
 let a0=null,pp=p;
 if(LINE_TOOLS.includes(tool)&&!ev.altKey){const sn0=snapTarget(w,12/view.k);if(sn0){a0={n:sn0.node,p:sn0.port};pp={x:sn0.x,y:sn0.y}}}
 ptr={type:"sdraw",t:tool,p0:pp,p1:pp,a0,a1:null,moved:false};
}
function startOpen(ev){
 const w=worldPt(ev),sn0=ev.altKey?null:snapTarget(w,12/view.k),tg=sn0||ev.altKey?null:edgeTarget(w,12/view.k,null);
 const a=sn0?{node:sn0.node,port:sn0.port,x:sn0.x,y:sn0.y}:tg?{x:tg.x,y:tg.y,tee:true}:{x:sn(w.x),y:sn(w.y)};
 ptr={type:"open",a,b:a,moved:false};
}
function openDraft(a,b,sn1,tb){
 const e=makeOpenEdge(a,b);e.id="draft";const g=edgeGeom(e);
 if(!g){gDraft.innerHTML="";return}
 const col=edgeColor(e);
 gDraft.innerHTML=`<path d="${pathFrom(g.pts,7)}" fill="none" stroke="${col}" stroke-width="${r3(RS.edge)}" marker-end="url(#arr${hex6(col)}_4)"/>`+snapRing(a.node?a:null)+(a.tee?teeRing(a):"")+snapRing(sn1)+(tb?teeRing(tb):"");
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
  const dset=new Set(ptr.starts.map(s=>s.id));
  ptr.starts.forEach(s=>{
   if(s.pts){const h=getShape(s.id);if(h){h.pts=s.pts.map(p=>({x:p.x+dx,y:p.y+dy}));detachOutside(h,dset);sh=true}return}
   const n=getNode(s.id);if(!n)return;n.x=s.x+dx;n.y=s.y+dy;const el=gNodes.querySelector(`[data-id="${s.id}"]`);if(el)el.setAttribute("transform",`translate(${n.x},${n.y})`);
  });
  if(sh||ptr.att)renderShapes();renderEdges();
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
  ptr.a1=null;let sn1=null;
  if(LINE_TOOLS.includes(ptr.t)&&!ev.altKey){sn1=snapTarget(w,12/view.k);if(sn1){ptr.p1={x:sn1.x,y:sn1.y};ptr.a1={n:sn1.node,p:sn1.port}}}
  ptr.moved=true;draftShow(mkShape(ptr.t,[ptr.p0,ptr.p1]));
  if(ptr.a0||sn1)gDraft.innerHTML+=snapRing(ptr.a0?{x:ptr.p0.x,y:ptr.p0.y}:null)+snapRing(sn1);
 }else if(ptr.type==="open"){
  const w=worldPt(ev),sn1=ev.altKey?null:snapTarget(w,12/view.k,ptr.a.node);
  const tb=sn1||ev.altKey?null:edgeTarget(w,12/view.k,null);
  ptr.b=sn1?{node:sn1.node,port:sn1.port,x:sn1.x,y:sn1.y}:tb?{x:tb.x,y:tb.y,tee:true}:{x:sn(w.x),y:sn(w.y)};
  ptr.moved=Math.hypot(ptr.b.x-ptr.a.x,ptr.b.y-ptr.a.y)>4;
  if(ptr.moved)openDraft(ptr.a,ptr.b,sn1,tb);
 }else if(ptr.type==="eend"){
  const e=state.edges.find(x=>x.id===ptr.id);if(!e)return;
  if(!ptr.moved&&Math.hypot(ev.clientX-ptr.x0,ev.clientY-ptr.y0)<5)return;
  const w=worldPt(ev),other=ptr.end==="from"?"to":"from",sn1=ev.altKey?null:snapTarget(w,12/view.k,e[other]||undefined);
  const end=ptr.end,ep=end+"Port",fk=end==="from"?"fp":"tp";
  let tg=null;
  if(sn1){e[end]=sn1.node;e[ep]=sn1.port;delete e[fk]}
  else{tg=ev.altKey?null:edgeTarget(w,12/view.k,e.id);e[end]="";e[ep]="";e[fk]=tg?{x:tg.x,y:tg.y}:{x:sn(w.x),y:sn(w.y)}}
  e.mid=null;e.midAxis=null;ptr.moved=true;renderEdges();
  gDraft.innerHTML=snapRing(sn1)+teeRing(tg);
  setStatus(tg?_("Thả để tạo điểm rẽ nhánh (tee) trên ống này.","Release to create a branch (tee) on this pipe."):sn1?_("Thả để nối vào cổng này.","Release to connect to this port."):_("Thả lên cổng thiết bị để nối; thả lên thân ống khác để rẽ nhánh; thả ra ngoài để để hở.","Drop on a device port to connect; on another pipe to branch; in empty space to leave open."));
 }else if(ptr.type==="pen"){
  const w=worldPt(ev),l=ptr.pts[ptr.pts.length-1];
  if(Math.hypot(w.x-l.x,w.y-l.y)*view.k>2.5){ptr.pts.push({x:w.x,y:w.y});draftShow(mkShape("pen",ptr.pts.length>1?ptr.pts:[...ptr.pts,{x:w.x+.01,y:w.y}]))}
 }else if(ptr.type==="shh"){
  const h=getShape(ptr.id);if(!h)return;const p=ptSnap(ev);ptr.moved=true;
  if(/^c/.test(ptr.pi)){const b=shapeBox(h),cs=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]],i=+ptr.pi[1],o=cs[(i+2)%4];if(!ptr.fix)ptr.fix={x:o[0],y:o[1]};h.pts=[{...ptr.fix},p]}
  else{
   const i=+ptr.pi,last=h.pts.length-1,k=i===0?"a0":i===last?"a1":null;let sn1=null;
   if(k&&!ev.altKey&&(h.t==="line"||h.t==="arrow"||h.t==="poly")){sn1=snapTarget(worldPt(ev),12/view.k);if(sn1){h[k]={n:sn1.node,p:sn1.port};h.pts[i]={x:sn1.x,y:sn1.y}}else{delete h[k];h.pts[i]=p}}
   else h.pts[i]=p;
   renderShapes();gDraft.innerHTML=snapRing(sn1);return;
  }
  renderShapes();
 }else if(ptr.type==="pmove"){
  const n=getNode(ptr.node);if(!n)return;const pp=(n.xp||[]).find(q=>q.id===ptr.port);if(!pp)return;const pf=portFromPoint(n,worldPt(ev));pp.s=pf.s;pp.f=pf.f;ptr.moved=true;renderCanvasOnly();
 }
});
function pointerEnd(ev){
 if(ptr){
  const p=ptr;ptr=null;board.style.cursor=tool==="pan"?"grab":(tool==="connect"||tool==="port"||tool==="open"||SHAPE_TOOLS.includes(tool))?"crosshair":"default";
  if(p.type==="drag"&&p.moved){commit(_("Di chuyển","Move"));renderProps()}
  else if(p.type==="handle"&&p.moved)commit(_("Dời đoạn ống","Move pipe segment"));
  else if(p.type==="shh"&&p.moved){gDraft.innerHTML="";commit(_("Chỉnh hình vẽ","Reshape"));renderProps()}
  else if(p.type==="eend"&&p.moved){
   gDraft.innerHTML="";
   const e=state.edges.find(x=>x.id===p.id),other=p.end==="from"?"to":"from",fk=p.end==="from"?"fp":"tp";
   if(e&&e[p.end]===""&&e[fk]&&!ev.altKey){
    const tg=edgeTarget(e[fk],6,e.id),op=endPt(e,other),t=tg&&makeTee(tg,op);
    if(t){e[p.end]=t.node;e[p.end+"Port"]=t.port;delete e[fk];e.mid=null;e.midAxis=null}
   }
   if(e&&e.from&&e.to){const A=getNode(e.from),B=getNode(e.to),k=inferKind(A,e.fromPort,B,e.toPort);if(k!=="process"&&e.kind==="process")e.kind=k}
   commit(_("Đổi / dời đầu ống","Reconnect / move pipe end"));renderAll();
   setStatus(_("Đã đổi đầu ống.","Pipe end changed."));
  }
  else if(p.type==="open"){
   gDraft.innerHTML="";
   if(p.moved&&!(p.a.node&&p.b.node&&p.a.node===p.b.node&&p.a.port===p.b.port)){
    let a0=p.a,b0=p.b;
    if(a0.tee){const tg=edgeTarget({x:a0.x,y:a0.y},6,null),t=tg&&makeTee(tg,b0);if(t)a0={node:t.node,port:t.port,x:a0.x,y:a0.y};else a0={x:a0.x,y:a0.y}}
    if(b0.tee){const tg=edgeTarget({x:b0.x,y:b0.y},6,null),t=tg&&makeTee(tg,a0);if(t)b0={node:t.node,port:t.port,x:b0.x,y:b0.y};else b0={x:b0.x,y:b0.y}}
    const e=makeOpenEdge(a0,b0);state.edges.push(e);selEdge=e.id;sel=new Set();commit(_("Vẽ ống hở","Draw open pipe"));
    if(!STICKY)setTool("select");renderAll();selectEdge(e.id);
    setStatus(_("Đã vẽ ống. Kéo ô vuông ở đầu hở để dời; thả lên điểm nối thiết bị để gắn vào. Tuỳ chọn mũi tên 2 chiều, cỡ mũi tên ở bảng Thuộc tính.","Pipe drawn. Drag the square at an open end to move it, or drop it on a device port to attach. Two-way arrow and arrow size are in the Properties panel."));
   }
  }
  else if(p.type==="pmove"&&p.moved){commit(_("Di chuyển điểm nối","Move port"));renderProps()}
  else if(p.type==="sdraw"){
   gDraft.innerHTML="";
   if(p.moved&&Math.hypot(p.p1.x-p.p0.x,p.p1.y-p.p0.y)>3){const h=mkShape(p.t,[p.p0,p.p1]);if(p.a0)h.a0=p.a0;if(p.a1)h.a1=p.a1;finishShape(h)}
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
window.addEventListener("pointercancel",()=>{ptr=null;gDraft.innerHTML="";if(conn&&conn.dragging){conn=null;hideTemp()}$("marq").setAttribute("display","none");gDraft.innerHTML=""});
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
 const TK={e:"open",v:"select",c:"connect",t:"text",h:"pan",p:"port",l:"line",a:"arrow",b:"rect",o:"ellipse",y:"poly",d:"pen"};
 if(TK[k]&&!ev.altKey){setTool(TK[k]);return}
 if(k==="j"&&!ev.altKey){straightenPipes();return}
 if(k==="r"&&sel.size)rotateSel();else if(k==="f"&&sel.size)flipSel();else if(k==="q"&&sel.size)cycleVariant();
 else if(k==="+"||k==="=")zoomBy(1.2);else if(k==="-")zoomBy(0.83);else if(ev.key==="?"){toggleHelp(true)}
 else if(k.startsWith("arrow")&&sel.size){
  ev.preventDefault();const st=ev.shiftKey?50:10,dx=k==="arrowleft"?-st:k==="arrowright"?st:0,dy=k==="arrowup"?-st:k==="arrowdown"?st:0;
  selNodes().forEach(n=>{n.x+=dx;n.y+=dy});selShapes().forEach(h=>{detachOutside(h,sel);allShapePts(h).forEach(p=>{p.x+=dx;p.y+=dy})});renderNodes();renderEdges();renderShapes();renderProps();commitSoon(_("Dịch chuyển bằng phím","Nudge"));
 }
});
window.addEventListener("keyup",ev=>{if(ev.code==="Space")spaceDown=false});
