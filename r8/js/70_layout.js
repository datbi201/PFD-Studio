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
/* Làm thẳng ống: dời nhẹ thiết bị để hai đầu ống nằm trên cùng một đường (hết đoạn gấp khúc nhỏ).
   - Không chọn gì: cả bản vẽ, lệch ≤ 10 mm.  - Có chọn thiết bị: các thiết bị đang chọn đứng yên, thiết bị khác căn theo.
   - Chọn 1 đường ống: chỉ làm thẳng ống đó (cho phép lệch lớn hơn), dời thiết bị đầu "đến". */
function straightenPipes(){
 const one=selEdge?state.edges.find(e=>e.id===selEdge):null,TH=one?600:40;
 const anchors=new Set(one?[]:selNodes().map(n=>n.id)),ok=n=>n&&n.type!=="text"&&n.type!=="area";
 const list=one?[one]:state.edges;
 const adj={x:{},y:{}},touched=[];
 const diff=(e)=>{
  if(!e.from||!e.to||e.from===e.to)return null;const A=getNode(e.from),B=getNode(e.to);if(!ok(A)||!ok(B))return null;
  const pa=portPos(A,e.fromPort),pb=portPos(B,e.toPort),H=d=>d==="e"||d==="w",V=d=>d==="n"||d==="s";
  if(H(pa.d)&&H(pb.d))return{ax:"y",d:pb.y-pa.y,A,B};
  if(V(pa.d)&&V(pb.d))return{ax:"x",d:pb.x-pa.x,A,B};
  return null;
 };
 list.forEach(e=>{const c=diff(e);if(!c)return;touched.push(e);(adj[c.ax][c.A.id]=adj[c.ax][c.A.id]||[]).push({e,o:c.B.id});(adj[c.ax][c.B.id]=adj[c.ax][c.B.id]||[]).push({e,o:c.A.id})});
 const moved=new Set();let fixed=0;
 ["x","y"].forEach(ax=>{
  const ids=Object.keys(adj[ax]),deg=id=>adj[ax][id].length;
  const seeds=one?[one.from,one.to].filter(i=>ids.includes(i)):[...ids.filter(i=>anchors.has(i)),...ids.filter(i=>!anchors.has(i)).sort((a,b)=>deg(b)-deg(a))];
  const vis=new Set();
  seeds.forEach(s=>{
   if(vis.has(s))return;vis.add(s);const q=[s];
   while(q.length){
    const u=q.shift();
    (adj[ax][u]||[]).forEach(({e,o})=>{
     if(vis.has(o))return;const c=diff(e);if(!c||c.ax!==ax)return;
     const d=c.d,uIsA=c.A.id===u;if(Math.abs(d)>TH)return;
     if(anchors.has(o))return;
     const n=getNode(o),dd=uIsA?-d:d;if(Math.abs(d)>=.5){n[ax]=r2(n[ax]+dd);moved.add(o)}
     vis.add(o);q.push(o);
    });
   }
  });
 });
 touched.forEach(e=>{const c=diff(e);if(c&&Math.abs(c.d)<.6){if(e.mid!=null){e.mid=null;e.midAxis=null}fixed++}});
 if(!moved.size){setStatus(_("Không có đường ống nào cần làm thẳng (chỉ xử lý ống lệch nhẹ dưới 10 mm; chọn riêng một ống để làm thẳng ống lệch nhiều hơn).","No pipe needs straightening (only slight offsets under 10 mm are handled; select a single pipe to straighten a larger offset)."));return}
 commit(_("Làm thẳng ống","Straighten pipes"));renderAll();
 setStatus(_(`Đã làm thẳng ${one?"đường ống đang chọn":"ống"}: dời nhẹ ${moved.size} thiết bị. Ctrl+Z để hoàn tác.${one?" (Bấm vào chỗ trống để bỏ chọn ống rồi bấm J để xử lý cả bản vẽ.)":""}`,`Straightened ${one?"the selected pipe":"pipes"}: ${moved.size} device(s) nudged. Ctrl+Z to undo.${one?" (Click empty space to deselect, then press J to process the whole drawing.)":""}`));
}
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
 nodes.forEach(n=>{n.x+=dx;n.y+=dy});shapes.forEach(h=>allShapePts(h).forEach(p=>{p.x+=dx;p.y+=dy}));
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
 (shapes||[]).forEach(h=>{mapShapePts(h,p=>({x:Cx+(p.x-Cx)*f+dx,y:Cy+(p.y-Cy)*f+dy}))});
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
