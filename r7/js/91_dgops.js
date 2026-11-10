/* ============ MODULE SƠ ĐỒ — THAO TÁC DỮ LIỆU: thêm/xoá/chép/căn chỉnh, CÂY PHÂN CẤP, NHẬP/XUẤT ĐỀ CƯƠNG, MẪU ============ */
let dsel=new Set(),dgClip=null,dgAddN=0;
const dgGet=id=>state.dg.shapes.find(s=>s.id===id);
const dgGetC=id=>state.dg.conns.find(c=>c.id===id);
const dgSelShapes=()=>state.dg.shapes.filter(s=>dsel.has(s.id));
const dgSelConns=()=>state.dg.conns.filter(c=>dsel.has(c.id));
const dgSn=v=>{const d=state.meta.dg;return d.snap?Math.round(v/(d.gs))*d.gs:v};
function dgAfterRestore(){dsel=new Set([...dsel].filter(id=>dgGet(id)||dgGetC(id)));if(typeof dgSync==="function"&&dgOn())dgSync()}
function dgView(){const r=board.getBoundingClientRect();return{x:(r.width/2-view.x)/view.k,y:(r.height/2-view.y)/view.k}}
function dgFreeSpot(w,h){                              /* điểm đặt hình mới: giữa khung nhìn, lệch dần nếu trùng */
 const c=dgView();let x=c.x-w/2,y=c.y-h/2;
 for(let n=0;n<40;n++){if(!state.dg.shapes.some(s=>Math.abs(s.x-x)<8&&Math.abs(s.y-y)<8))break;x+=24;y+=24}
 return{x:dgSn(x),y:dgSn(y)};
}
/* ---- tạo hình khối mới ---- */
function dgNewShape(k,x,y,over){
 const P=DG_PRESET[k],M=state.meta.dg;
 const st=dgStyle(P.sty&&(k.startsWith("org_")||k==="chevron"||k==="homePlate")?P.sty:M.sty);
 const sh={id:uid("d"),k,x:x||0,y:y||0,w:P.w,h:P.h,rot:0,fl:P.noFill?"":st.fl,ln:P.noFill&&!P.dashed?"":st.ln,lw:1,ld:P.dashed?"dash":"",fo:1,
  tx:P.sample?_(P.sample,P.sampleEn||P.sample):"",ff:M.ff,fs:M.fs,fb:false,fi:false,fu:false,fc:P.noFill?"#000000":st.fc,ta:"c",tv:"m",mg:[7.2,3.6,7.2,3.6],af:false,ls:1,ps:0};
 if(P.adj!==undefined)sh.a=P.adj;if(P.adj2!==undefined)sh.b=P.adj2;
 if(k==="org_person"){sh.tx=_("**Họ và tên**\nChức danh","**Full name**\nJob title");sh.tp=[{},{fs:Math.max(6,Math.round(M.fs*.85))}]}
 if(k==="text"){sh.ta="l";sh.tv="t";sh.af=true;sh.mg=[3.6,3.6,3.6,3.6]}
 if(k==="frame"){sh.ta="l";sh.tv="t";sh.tx=_("**Nhóm**","**Group**")}
 if(k==="org_dept"){sh.tx=_("**Phòng ban**","**Department**")}
 if(k==="org_pos")sh.tx=_("Chức danh","Job title");
 Object.assign(sh,over||{});
 dgAutoFit(sh);
 return sh;
}
function dgAdd(k,pt,noEdit){
 const P=DG_PRESET[k];if(!P)return null;
 const p=pt?{x:dgSn(pt.x-P.w/2),y:dgSn(pt.y-P.h/2)}:dgFreeSpot(P.w,P.h);
 const sh=dgNewShape(k,p.x,p.y);
 state.dg.shapes.push(sh);dsel=new Set([sh.id]);
 commit(_("Thêm hình: ","Add shape: ")+_(P.vi,P.en));renderAll();
 setStatus(_(`Đã thêm "${P.vi}". F2 hoặc bấm đúp để nhập chữ, Delete để xoá, Tab để thêm cấp dưới.`,`Added "${P.en}". F2 or double-click to type text, Delete to remove, Tab to add a child.`));
 if(!noEdit&&P.sample!==undefined||k==="text")dgEditText(sh.id);
 return sh;
}
/* ---- xoá ---- */
function dgRemoveShapes(ids){
 state.dg.shapes=state.dg.shapes.filter(s=>!ids.has(s.id));
 state.dg.conns=state.dg.conns.filter(c=>!(c.s&&ids.has(c.s.id))&&!(c.e&&ids.has(c.e.id)));
}
function dgDescendants(id,acc){acc=acc||new Set();dgTreeKids(id).forEach(({s})=>{if(!acc.has(s.id)){acc.add(s.id);dgDescendants(s.id,acc)}});return acc}
function dgDeleteSel(branch){
 if(!dsel.size){setStatus(_("Chưa chọn gì để xoá.","Nothing selected to delete."));return}
 const ids=new Set([...dsel].filter(id=>dgGet(id))),cids=[...dsel].filter(id=>dgGetC(id));
 if(branch)[...ids].forEach(id=>dgDescendants(id,ids));
 else{                                                /* nối các con của hình bị xoá vào cha của nó */
  [...ids].forEach(id=>{
   const pc=dgTreeParent(id);if(!pc||ids.has(pc.s.id))return;
   const kids=dgTreeKids(id);let at=state.dg.conns.indexOf(pc);
   kids.forEach(({c,s})=>{if(ids.has(s.id))return;const nc=cleanDgConn({...c,id:uid("k"),s:{id:pc.s.id,p:c.s.p},e:c.e,tree:true},new Set(state.dg.shapes.map(x=>x.id)));if(nc){state.dg.conns.splice(++at,0,nc)}});
  });
 }
 const n=ids.size+cids.length;
 dgRemoveShapes(ids);state.dg.conns=state.dg.conns.filter(c=>!cids.includes(c.id));
 dsel=new Set();if(state.meta.dg.rl)dgLayoutAll();
 commit(_("Xoá ","Delete ")+n);renderAll();
 setStatus(_(`Đã xoá ${n} đối tượng (Ctrl+Z để hoàn tác).`,`Deleted ${n} object(s) (Ctrl+Z to undo).`));
}
/* ---- sao chép / dán ---- */
function dgCopy(){
 const ids=new Set([...dsel].filter(id=>dgGet(id)));if(!ids.size)return;
 dgClip={n:0,shapes:JSON.parse(JSON.stringify(state.dg.shapes.filter(s=>ids.has(s.id)))),conns:JSON.parse(JSON.stringify(state.dg.conns.filter(c=>(!c.s||ids.has(c.s.id))&&(!c.e||ids.has(c.e.id))&&(c.s||c.e)&&(dsel.has(c.id)||(c.s&&c.e)))))};
 setStatus(_(`Đã sao chép ${ids.size} hình.`,`Copied ${ids.size} shape(s).`));
}
function dgPaste(){
 if(!dgClip||!dgClip.shapes.length)return false;
 dgClip.n++;const off=20*dgClip.n,map={},ns=[];
 dgClip.shapes.forEach(s=>{const c=JSON.parse(JSON.stringify(s));c.id=uid("d");map[s.id]=c.id;c.x+=off;c.y+=off;state.dg.shapes.push(c);ns.push(c.id)});
 const ids=new Set(state.dg.shapes.map(s=>s.id)),nc=[];
 dgClip.conns.forEach(c0=>{const c=JSON.parse(JSON.stringify(c0));c.id=uid("k");
  if(c.s)c.s.id=map[c.s.id];else{c.sp.x+=off;c.sp.y+=off}
  if(c.e)c.e.id=map[c.e.id];else{c.ep.x+=off;c.ep.y+=off}
  const x=cleanDgConn(c,ids);if(x){state.dg.conns.push(x);nc.push(x.id)}});
 dsel=new Set([...ns,...nc]);commit(_("Dán","Paste"));renderAll();
 setStatus(_(`Đã dán ${ns.length} hình.`,`Pasted ${ns.length} shape(s).`));return true;
}
function dgDup(){dgCopy();dgPaste()}
/* ---- thứ tự lớp ---- */
function dgOrder(mode){
 const A=state.dg.shapes,ids=new Set([...dsel].filter(id=>dgGet(id)));if(!ids.size)return;
 const sel=A.filter(s=>ids.has(s.id)),rest=A.filter(s=>!ids.has(s.id));
 if(mode==="front")state.dg.shapes=[...rest,...sel];
 else if(mode==="back")state.dg.shapes=[...sel,...rest];
 else{const a=A.slice();
  if(mode==="up"){for(let i=a.length-2;i>=0;i--)if(ids.has(a[i].id)&&!ids.has(a[i+1].id))[a[i],a[i+1]]=[a[i+1],a[i]]}
  else for(let i=1;i<a.length;i++)if(ids.has(a[i].id)&&!ids.has(a[i-1].id))[a[i],a[i-1]]=[a[i-1],a[i]];
  state.dg.shapes=a}
 commit(_("Đổi thứ tự lớp","Change layer order"));renderAll();
}
/* ---- căn chỉnh & phân bố ---- */
function dgAlign(mode){
 const S=dgSelShapes();if(S.length<2){setStatus(_("Chọn từ 2 hình trở lên để căn chỉnh.","Select at least 2 shapes to align."));return}
 const B=S.map(s=>({s,b:dgShapeBBox(s)})),L=Math.min(...B.map(o=>o.b.x0)),R=Math.max(...B.map(o=>o.b.x1)),T=Math.min(...B.map(o=>o.b.y0)),Bt=Math.max(...B.map(o=>o.b.y1));
 B.forEach(({s,b})=>{
  if(mode==="left")s.x+=L-b.x0;else if(mode==="right")s.x+=R-b.x1;else if(mode==="center")s.x+=(L+R)/2-(b.x0+b.x1)/2;
  else if(mode==="top")s.y+=T-b.y0;else if(mode==="bottom")s.y+=Bt-b.y1;else if(mode==="middle")s.y+=(T+Bt)/2-(b.y0+b.y1)/2;
 });
 if(mode==="dh"||mode==="dv"){
  const h=mode==="dh",A=B.slice().sort((p,q)=>h?p.b.x0-q.b.x0:p.b.y0-q.b.y0);if(A.length<3)return setStatus(_("Cần từ 3 hình trở lên để chia đều.","Need at least 3 shapes to distribute."));
  const tot=A.reduce((t,o)=>t+(h?o.b.x1-o.b.x0:o.b.y1-o.b.y0),0),span=h?R-L:Bt-T,gap=(span-tot)/(A.length-1);let pos=h?L:T;
  A.forEach(o=>{const sz=h?o.b.x1-o.b.x0:o.b.y1-o.b.y0;if(h)o.s.x+=pos-o.b.x0;else o.s.y+=pos-o.b.y0;pos+=sz+gap});
 }
 commit(_("Căn chỉnh","Align"));renderAll();
}
function dgSameSize(mode){
 const S=dgSelShapes();if(S.length<2)return;const f=S[0];
 S.slice(1).forEach(s=>{if(mode!=="h")s.w=f.w;if(mode!=="w")s.h=f.h;dgAutoFit(s)});
 commit(_("Cùng kích thước","Same size"));renderAll();
}
/* ============ CÂY PHÂN CẤP ============ */
function dgTreeKids(id){const o=[];state.dg.conns.forEach(c=>{if(c.tree&&c.s&&c.e&&c.s.id===id){const s=dgGet(c.e.id);if(s)o.push({c,s})}});return o}
function dgTreeParent(id){return state.dg.conns.find(c=>c.tree&&c.s&&c.e&&c.e.id===id)||null}
const DG_SITES_BY_DIR={down:[2,0],up:[0,2],right:[1,3],left:[3,1]};
function dgTreeConn(pid,cid,after){
 const M=state.meta.dg,[sp,ep]=DG_SITES_BY_DIR[M.dir];
 const c=cleanDgConn({id:uid("k"),s:{id:pid,p:sp},e:{id:cid,p:ep},ty:"el",ln:"#595959",lw:1.25,as:"none",ae:"none",tree:true,adj:.5},new Set(state.dg.shapes.map(s=>s.id)));
 let at=after?state.dg.conns.indexOf(after)+1:-1;
 if(at<=0){/* sau con cuối cùng của cha */
  const kids=dgTreeKids(pid);at=kids.length?state.dg.conns.indexOf(kids[kids.length-1].c)+1:state.dg.conns.length}
 state.dg.conns.splice(at,0,c);return c;
}
function dgRoots(){
 const roots=[];state.dg.shapes.forEach(s=>{if(!dgTreeParent(s.id)&&dgTreeKids(s.id).length)roots.push(s)});return roots;
}
function dgLayoutRoot(root){
 const M=state.meta.dg,dir=M.dir,hz=dir==="right"||dir==="left",bs=n=>hz?n.h:n.w,ds=n=>hz?n.w:n.h,gb=M.gapX,gd=M.gapY;
 const seen=new Set(),W=new Map(),dep=new Map(),kids=new Map();
 const meas=(n,d)=>{
  seen.add(n.id);dep.set(n.id,d);
  const ks=dgTreeKids(n.id).map(o=>o.s).filter(k=>!seen.has(k.id));kids.set(n.id,ks);
  ks.forEach(k=>meas(k,d+1));
  const sum=ks.reduce((t,k)=>t+W.get(k.id),0)+gb*Math.max(0,ks.length-1);
  W.set(n.id,Math.max(bs(n),sum));
 };
 meas(root,0);
 const lvMax=[];seen.forEach(id=>{const n=dgGet(id),d=dep.get(id);lvMax[d]=Math.max(lvMax[d]||0,ds(n))});
 const lvStart=[0];for(let d=1;d<lvMax.length;d++)lvStart[d]=lvStart[d-1]+lvMax[d-1]+gd;
 const rb=hz?root.y+root.h/2:root.x+root.w/2,rx=root.x,ry=root.y,rr=root.x+root.w,rbm=root.y+root.h;
 const place=(n,b0)=>{                                /* b0 = mép đầu của dải rộng W(n) */
  const cb=b0+W.get(n.id)/2,d=dep.get(n.id);
  if(!hz){n.x=cb-n.w/2;n.y=dir==="down"?ry+lvStart[d]:rbm-lvStart[d]-n.h}
  else{n.y=cb-n.h/2;n.x=dir==="right"?rx+lvStart[d]:rr-lvStart[d]-n.w}
  const ks=kids.get(n.id);if(!ks.length)return;
  const tot=ks.reduce((t,k)=>t+W.get(k.id),0)+gb*(ks.length-1);let p=cb-tot/2;
  ks.forEach(k=>{place(k,p);p+=W.get(k.id)+gb});
 };
 place(root,rb-W.get(root.id)/2);
 /* giữ nguyên toạ độ gốc theo trục rộng */
 const dx=hz?0:rb-(root.x+root.w/2),dy=hz?rb-(root.y+root.h/2):0;
 seen.forEach(id=>{const n=dgGet(id);n.x=dgSn(n.x+dx);n.y=dgSn(n.y+dy)});
 const[sp,ep]=DG_SITES_BY_DIR[dir];
 state.dg.conns.forEach(c=>{if(c.tree&&c.s&&c.e&&seen.has(c.s.id)&&seen.has(c.e.id)){c.s.p=sp;c.e.p=ep;c.adj=.5}});
 return seen.size;
}
function dgLayoutAll(){let n=0;dgRoots().forEach(r=>{n+=dgLayoutRoot(r)});return n}
function dgDefaultTitle(){return _("**Mục mới**","**New item**")}
function dgAddChild(pid,afterConn,noEdit){
 const P=dgGet(pid);if(!P)return null;
 const kids=dgTreeKids(pid),ref=kids.length?kids[kids.length-1].s:P,M=state.meta.dg;
 const o=JSON.parse(JSON.stringify(ref));delete o.id;
 const sh=dgNewShape(ref.k,P.x,P.y,{...o,x:P.x,y:P.y,rot:0});
 if(P.k!=="org_person"&&!(ref.tx||"").trim())sh.tx="";
 if(ref.k==="org_person")sh.tx=_("**Họ và tên**\nChức danh","**Full name**\nJob title");
 else sh.tx=ref.k===P.k&&/^\*\*[^*]*\*\*$/.test(ref.tx||"")?dgDefaultTitle():(ref.tx?_("Mục mới","New item"):"");
 /* vị trí ban đầu: bên dưới / bên cạnh cha */
 const hz=M.dir==="right"||M.dir==="left";
 if(M.dir==="down")sh.y=P.y+P.h+M.gapY;else if(M.dir==="up")sh.y=P.y-sh.h-M.gapY;else if(M.dir==="right")sh.x=P.x+P.w+M.gapY;else sh.x=P.x-sh.w-M.gapY;
 if(!hz)sh.x=P.x+(P.w-sh.w)/2+kids.length*(sh.w+M.gapX);else sh.y=P.y+(P.h-sh.h)/2+kids.length*(sh.h+M.gapX);
 state.dg.shapes.push(sh);
 dgTreeConn(pid,sh.id,afterConn||null);
 if(M.rl)dgLayoutAll();
 dsel=new Set([sh.id]);commit(_("Thêm cấp dưới","Add child"));renderAll();
 setStatus(_("Đã thêm hình cấp dưới. Gõ nội dung rồi nhấn Esc; Tab thêm cấp dưới nữa, Enter thêm ngang cấp.","Child added. Type its text then press Esc; Tab adds another child, Enter adds a sibling."));
 if(!noEdit)dgEditText(sh.id);
 return sh;
}
function dgAddSibling(id){
 const S=dgGet(id);if(!S)return;
 const pc=dgTreeParent(id);
 if(pc)return dgAddChild(pc.s.id,pc,false);
 const M=state.meta.dg,sh=dgNewShape(S.k,S.x+S.w+M.gapX,S.y,(()=>{const o=JSON.parse(JSON.stringify(S));delete o.id;o.rot=0;o.tx=S.tx?_("Mục mới","New item"):"";return o})());
 if(S.k==="org_person")sh.tx=_("**Họ và tên**\nChức danh","**Full name**\nJob title");
 state.dg.shapes.push(sh);dsel=new Set([sh.id]);commit(_("Thêm hình cùng cấp","Add sibling"));renderAll();dgEditText(sh.id);
}
function dgMoveSibling(id,d){
 const pc=dgTreeParent(id);if(!pc)return;
 const sibs=dgTreeKids(pc.s.id).map(o=>o.c),i=sibs.indexOf(pc),j=i+d;if(j<0||j>=sibs.length)return;
 const a=state.dg.conns.indexOf(sibs[i]),b=state.dg.conns.indexOf(sibs[j]);
 [state.dg.conns[a],state.dg.conns[b]]=[state.dg.conns[b],state.dg.conns[a]];
 dgLayoutAll();commit(_("Đổi thứ tự anh em","Reorder sibling"));renderAll();
}
/* gắn hình vào cha (kéo-thả thay đổi cấp) hoặc gỡ khỏi cây */
function dgReparent(id,newPid){
 const old=dgTreeParent(id);if(old)state.dg.conns=state.dg.conns.filter(c=>c!==old);
 if(newPid&&newPid!==id&&!dgDescendants(id).has(newPid))dgTreeConn(newPid,id,null);
 if(state.meta.dg.rl)dgLayoutAll();
}
/* ============ ĐỀ CƯƠNG (OUTLINE) & CSV ============ */
function dgTitleOf(s){
 const ps=dgParas(s).map(p=>p.runs.map(r=>r.t).join("").trim()).filter(Boolean);
 return ps;
}
function dgOutline(){
 const out=[],walk=(s,d,seen)=>{
  if(seen.has(s.id))return;seen.add(s.id);
  const ps=dgTitleOf(s);out.push("\t".repeat(d)+(ps.length>1&&s.k==="org_person"?ps[0]+" | "+ps.slice(1).join(" "):ps.join(" ")));
  dgTreeKids(s.id).forEach(o=>walk(o.s,d+1,seen));
 };
 const seen=new Set();dgRoots().sort((a,b)=>a.x-b.x||a.y-b.y).forEach(r=>walk(r,0,seen));
 return out.join("\n");
}
function dgParseOutline(text){
 const lines=String(text).replace(/\r/g,"").split("\n").filter(l=>l.trim()!==""),items=[];
 const exp=l=>l.replace(/^[ \t]*/,m=>m.replace(/\t/g,"    "));
 let unit=0;
 lines.forEach(l=>{const sp=/^ */.exec(exp(l))[0].length;if(sp>0&&(!unit||sp<unit))unit=sp});
 unit=unit||4;
 let prev=-1;
 lines.forEach(l=>{
  const e=exp(l),sp=/^ */.exec(e)[0].length;let d=Math.round(sp/unit);
  let t=e.trim().replace(/^([-*•–▪●○]|\d+(\.\d+)*[.)]?|[a-zA-Z][.)])\s+/,"").trim();
  if(!t)return;d=Math.max(0,Math.min(d,prev+1));prev=d;items.push({d,t});
 });
 return items;
}
function dgParseCSV(text){
 const rows=[];let row=[],cur="",q=false;text=String(text).replace(/\r/g,"");
 const sep=(text.split("\n")[0].match(/;/g)||[]).length>(text.split("\n")[0].match(/,/g)||[]).length?";":(text.split("\n")[0].includes("\t")?"\t":",");
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
  else if(c==='"')q=true;else if(c===sep){row.push(cur);cur=""}else if(c==="\n"){row.push(cur);rows.push(row);row=[];cur=""}else cur+=c}
 if(cur!==""||row.length){row.push(cur);rows.push(row)}
 return rows.filter(r=>r.some(x=>x.trim()!==""));
}
function dgItemsFromCSV(text){
 const rows=dgParseCSV(text);if(!rows.length)return[];
 const h=rows[0].map(x=>x.trim().toLowerCase());
 const hasH=h.some(x=>/^(name|tên|ho ten|họ tên|họ và tên|title|chức danh|manager|quản lý|cấp trên|parent|reports to)$/.test(x));
 const col=(re,def)=>{const i=h.findIndex(x=>re.test(x));return hasH&&i>=0?i:def};
 const cN=col(/^(name|tên|ho ten|họ tên|họ và tên)$/,0),cT=col(/^(title|chức danh|position|vị trí)$/,1),cM=col(/^(manager|quản lý|cấp trên|parent|reports to)$/,2);
 const data=hasH?rows.slice(1):rows,byName=new Map(),items=[];
 data.forEach((r,i)=>{const n=(r[cN]||"").trim();if(!n)return;items.push({name:n,title:(r[cT]||"").trim(),mgr:(r[cM]||"").trim(),idx:items.length});if(!byName.has(n))byName.set(n,items.length-1)});
 items.forEach(it=>{it.p=it.mgr&&byName.has(it.mgr)&&byName.get(it.mgr)!==it.idx?byName.get(it.mgr):-1});
 return items;
}
/* dựng cây từ danh sách [{t|name,title,p}] ; trả về mảng id gốc */
function dgBuildForest(nodes,opt){
 const M=state.meta.dg,k=opt.k||"org_person",P=DG_PRESET[k],ids=[],shapes=[];
 const mk=n=>{
  const sh=dgNewShape(k,0,0);
  const name=n.name!==undefined?n.name:n.t,title=n.title||"";
  if(k==="org_person"){sh.tx=title?`**${dgEscMarks(name)}**\n${dgEscMarks(title)}`:`**${dgEscMarks(name)}**`}
  else sh.tx=(P.sample&&/^\*\*/.test(P.sample)?`**${dgEscMarks(name)}**`:dgEscMarks(name))+(title?"\n"+dgEscMarks(title):"");
  sh.tp=title&&k==="org_person"?[{},{fs:Math.max(6,Math.round(M.fs*.85))}]:undefined;if(!sh.tp)delete sh.tp;
  state.dg.shapes.push(sh);return sh;
 };
 nodes.forEach(n=>{shapes.push(mk(n))});
 nodes.forEach((n,i)=>{if(n.p>=0&&shapes[n.p])dgTreeConn(shapes[n.p].id,shapes[i].id,null)});
 const b=dgBBox(),oldIds=new Set(shapes.map(s=>s.id));
 /* vị trí: bên phải/bên dưới nội dung có sẵn */
 let ox=0,oy=0;
 const others=state.dg.shapes.filter(s=>!oldIds.has(s.id));
 if(others.length){const bb={x1:-1e9,y1:-1e9,x0:1e9};others.forEach(s=>{const q=dgShapeBBox(s);bb.x1=Math.max(bb.x1,q.x1);bb.x0=Math.min(bb.x0,q.x0);bb.y1=Math.max(bb.y1,q.y1)});ox=bb.x0;oy=bb.y1+M.gapY*1.5}
 const roots=shapes.filter(s=>!dgTreeParent(s.id));
 let cx=ox;
 roots.forEach(r=>{
  r.x=cx;r.y=oy;
  if(dgTreeKids(r.id).length){dgLayoutRoot(r)}
  const sub=new Set([r.id]);dgDescendants(r.id,sub);
  let x1=-1e9;sub.forEach(id=>{const q=dgShapeBBox(dgGet(id));x1=Math.max(x1,q.x1)});
  let x0=1e9;sub.forEach(id=>{const q=dgShapeBBox(dgGet(id));x0=Math.min(x0,q.x0)});
  if(x0<cx){const sh=cx-x0;sub.forEach(id=>{dgGet(id).x+=sh});x1+=sh}
  cx=x1+M.gapX*2;
 });
 return roots.map(r=>r.id);
}
function dgImportOutline(text,opt){
 const items=dgParseOutline(text);if(!items.length)return setStatus(_("Không có dòng nào để nhập.","No lines to import."));
 const nodes=[],stack=[];
 items.forEach((it,i)=>{
  let name=it.t,title="";
  if(opt.split&&it.t.includes("|")){const q=it.t.split("|");name=q[0].trim();title=q.slice(1).join("|").trim()}
  const n={name,title,p:it.d===0?-1:(stack[it.d-1]!==undefined?stack[it.d-1]:-1)};
  nodes.push(n);stack[it.d]=i;stack.length=it.d+1;
 });
 return dgFinishImport(nodes,opt);
}
function dgImportCSV(text,opt){
 const items=dgItemsFromCSV(text);if(!items.length)return setStatus(_("Không đọc được dữ liệu CSV.","Could not read the CSV data."));
 return dgFinishImport(items.map(i=>({name:i.name,title:i.title,p:i.p})),opt);
}
function dgFinishImport(nodes,opt){
 const roots=dgBuildForest(nodes,opt);
 dsel=new Set(roots);commit(_("Nhập sơ đồ từ văn bản","Import diagram from text"));renderAll();fitView();
 setStatus(_(`Đã nhập ${nodes.length} hình khối. Ctrl+Z để hoàn tác.`,`Imported ${nodes.length} shape(s). Ctrl+Z to undo.`));
}
/* ============ MẪU CÓ SẴN ============ */
const DG_TEMPLATES=[["org","Sơ đồ tổ chức công ty","Company org chart"],["flow","Lưu đồ có rẽ nhánh","Flowchart with decision"],["wbs","Phân cấp nằm ngang (WBS)","Horizontal hierarchy (WBS)"],["block","Sơ đồ khối đơn giản","Simple block diagram"],["steps","Quy trình 5 bước (chevron)","5-step process (chevron)"],["blank","Trang trắng","Blank page"]];
function dgLinkShapes(a,pa,b,pb,o){
 const c=cleanDgConn(Object.assign({id:uid("k"),s:{id:a.id,p:pa},e:{id:b.id,p:pb},ty:"el",ln:"#404040",lw:state.meta.dg.clw,as:"none",ae:"tri"},o||{}),new Set(state.dg.shapes.map(s=>s.id)));
 state.dg.conns.push(c);return c;
}
function dgStarter(kind){
 kind=kind||"org";const M=state.meta.dg;
 state.dg.shapes=[];state.dg.conns=[];dsel=new Set();
 const add=(k,x,y,tx,o)=>{const s=dgNewShape(k,x,y,Object.assign({tx},o||{}));state.dg.shapes.push(s);return s};
 if(kind==="org"){
  M.dir="down";
  const v=(a,b)=>_(a,b);
  const nodes=[
   {name:v("Nguyễn Văn An","An Nguyen"),title:v("Giám đốc","Director"),p:-1},
   {name:v("Trần Thị Bình","Binh Tran"),title:v("Phó giám đốc Kỹ thuật","Technical Deputy Director"),p:0},
   {name:v("Lê Văn Cường","Cuong Le"),title:v("Phó giám đốc Kinh doanh","Commercial Deputy Director"),p:0},
   {name:v("Phạm Thị Dung","Dung Pham"),title:v("Trưởng phòng Hành chính","Head of Administration"),p:0},
   {name:v("Hoàng Văn Em","Em Hoang"),title:v("Trưởng nhóm Vận hành","Operations Lead"),p:1},
   {name:v("Vũ Thị Phương","Phuong Vu"),title:v("Trưởng nhóm Bảo trì","Maintenance Lead"),p:1},
   {name:v("Đặng Văn Giang","Giang Dang"),title:v("Chuyên viên Kinh doanh","Sales Specialist"),p:2},
   {name:v("Bùi Thị Hoa","Hoa Bui"),title:v("Nhân sự","HR Officer"),p:3}];
  dgBuildForest(nodes,{k:"org_person"});
 }else if(kind==="wbs"){
  M.dir="right";
  const items=[["Dự án","Project",-1],["Thiết kế","Design",0],["Mua sắm","Procurement",0],["Thi công","Construction",0],["Thiết kế cơ sở","Basic design",1],["Thiết kế chi tiết","Detail design",1],["Đặt hàng thiết bị","Order equipment",2],["Lắp đặt","Installation",3],["Chạy thử","Commissioning",3]];
  const nodes=items.map(a=>({name:_(a[0],a[1]),title:"",p:a[2]}));
  dgBuildForest(nodes,{k:"roundRect"});
  state.dg.shapes.forEach(s=>{if(s.k==="roundRect"){s.w=150;s.h=44}});
  dgLayoutAll();
 }else if(kind==="flow"){
  const t=add("fcTerm",200,0,_("**Bắt đầu**","**Start**"),{fl:"#E2F0D9",ln:"#70AD47",fc:"#375623"});
  const p1=add("fcData",200,100,_("Nhập dữ liệu","Enter data"));
  const d=add("fcDecision",190,200,_("Dữ liệu hợp lệ?","Data valid?"),{w:160,h:100});
  const p2=add("fcProcess",200,360,_("Xử lý dữ liệu","Process data"));
  const e=add("fcTerm",200,470,_("**Kết thúc**","**End**"),{fl:"#FBE5D6",ln:"#ED7D31",fc:"#833C0B"});
  const er=add("fcProcess",440,230,_("Báo lỗi","Report error"),{fl:"#FBE5D6",ln:"#F4B183",fc:"#833C0B"});
  dgLinkShapes(t,2,p1,0);dgLinkShapes(p1,2,d,0);
  dgLinkShapes(d,2,p2,0,{tx:_("Có","Yes")});dgLinkShapes(p2,2,e,0);
  dgLinkShapes(d,1,er,3,{tx:_("Không","No")});
  dgLinkShapes(er,0,p1,1,{});
 }else if(kind==="block"){
  const a=add("rect",0,60,_("**Đầu vào**\nDữ liệu cảm biến","**Input**\nSensor data"),{});
  const b=add("roundRect",260,60,_("**Bộ xử lý**\nTính toán & lọc","**Processor**\nCalculate & filter"),{fl:"#4472C4",ln:"#2F528F",fc:"#FFFFFF"});
  const c=add("rect",520,60,_("**Đầu ra**\nBáo cáo","**Output**\nReport"),{});
  const d=add("can",285,230,_("Cơ sở\ndữ liệu","Database"),{w:90,h:100});
  dgLinkShapes(a,1,b,3);dgLinkShapes(b,1,c,3);
  dgLinkShapes(b,2,d,0,{as:"tri"});
 }else if(kind==="steps"){
  const names=[["Khảo sát","Survey"],["Thiết kế","Design"],["Thi công","Build"],["Nghiệm thu","Accept"],["Bàn giao","Handover"]],cols=["s1","s5","s6","s4","s2"];
  names.forEach((n,i)=>{const st=dgStyle(cols[i]);add("chevron",i*150,0,"**"+_(n[0],n[1])+"**",{w:170,h:70,fl:st.fl,ln:st.ln,fc:st.fc,a:.35})});
 }
 if(M.rl)dgLayoutAll();
}
function dgLoadTemplate(kind){
 if(dgOn()===false)return;
 const hasContent=state.dg.shapes.length>0;
 if(hasContent&&!confirm(_("Thay toàn bộ sơ đồ hiện tại bằng mẫu này? (có thể hoàn tác bằng Ctrl+Z)","Replace the whole current diagram with this template? (can be undone with Ctrl+Z)")))return;
 dgStarter(kind);commit(_("Nạp mẫu","Load template"));renderAll();fitView();dgSync();
 setStatus(_("Đã nạp mẫu. Bấm vào chữ trong hình (hoặc F2) để sửa nội dung.","Template loaded. Click a shape (or F2) to edit its text."));
}
function dgNew(){
 const keep=state.meta,ns=newDgmState(keep);ns.meta.dg={...keep.dg};ns.meta.title=keep.title;
 state=ns;dsel=new Set();commit(_("Sơ đồ mới","New diagram"));syncMetaUI();renderAll();fitView();dgSync();
 setStatus(_("Đã tạo sơ đồ trống (Ctrl+Z để quay lại).","Blank diagram created (Ctrl+Z to go back)."));
}
