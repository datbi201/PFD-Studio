/* ============ SimCAD — CÁC LỆNH VẼ & CHỈNH SỬA ============ */
const CAD_ALIAS={l:"line",line:"line",pl:"pline",pline:"pline",polyline:"pline",p:"pline",rec:"rect",rect:"rect",rectangle:"rect",r:"rect",c:"circle",circle:"circle",a:"arc",arc:"arc",el:"ellipse",ellipse:"ellipse",
 t:"text",text:"text",d:"dim",dli:"dim",dim:"dim",dal:"dimal",dra:"dimr",ddi:"dimd",h:"hatch",hatch:"hatch",
 m:"move",move:"move",co:"copy",cp:"copy",copy:"copy",ro:"rotate",rotate:"rotate",sc:"scale",scale:"scale",mi:"mirror",mirror:"mirror",o:"offset",offset:"offset",
 e:"erase",erase:"erase",x:"explode",explode:"explode",ar:"array",array:"array",tr:"trim",trim:"trim",ex:"extend",extend:"extend",
 z:"fit",ze:"fit",fit:"fit",u:"undo",undo:"undo",redo:"redo",ortho:"t_ortho",polar:"t_polar",snap:"t_snap",grid:"t_snap",osnap:"t_os",la:"layer",layer:"layer",pr:"print",print:"print",plot:"print",
 v:"sel",select:"sel",dxf:"dxfout",dxfin:"dxfin",all:"all",desc:"describe",mo:"describe"};
const CMDS={},IMMEDIATE=new Set(["fit","undo","redo","t_ortho","t_polar","t_snap","t_os","layer","print","sel","dxfout","dxfin","all","describe"]);
CMDS.fit=()=>{fitView();return null};CMDS.undo=()=>{undo();return null};CMDS.redo=()=>{redo();return null};
CMDS.t_ortho=()=>{cadToggle("ortho");return null};CMDS.t_polar=()=>{cadToggle("polar");return null};CMDS.t_snap=()=>{cadToggle("snap");return null};CMDS.t_os=()=>{cadToggle("os");return null};
CMDS.layer=()=>{const e=document.querySelector("#cadLayers .lay.cur [data-act=name]")||$("cadLayers");if(e)e.focus();setStatus(_("Bảng lớp ở khung bên trái.","Layer panel is in the left pane."));return null};
CMDS.print=()=>{openPrint();return null};CMDS.sel=()=>{cadReset(true);setTool("select");return null};
CMDS.all=()=>{sel=new Set([...state.nodes.filter(n=>!layLock(n)&&layVis(n)).map(n=>n.id),...state.shapes.filter(h=>!layLock(h)&&layVis(h)).map(h=>h.id)]);renderNodes();renderShapes();renderProps();announceSel();return null};
CMDS.dxfout=()=>{exportDXF();return null};CMDS.dxfin=()=>{$("dxfFile").click();return null};CMDS.describe=()=>{cadDescribe();return null};
function cadStartX(name){if(IMMEDIATE.has(name)){CMDS[name]();return true}return cadStart(name)}

/* ---------- tạo hình mới theo lớp ---------- */
function newCadShape(t,pts,extra,draft){
 const L=layerFor(t==="dim"?"dim":t==="hatch"?"hatch":"cur");
 return Object.assign({id:draft?"draft":uid("s"),t,pts,col:L.col,sw:L.sw,dash:L.dash,fill:"",fo:.25,ah:0,closed:t==="rect"||t==="ellipse"||t==="circle",rx:0,z:t==="hatch"?"b":"f",lay:L.id},extra||{});
}
function addCadShape(h,label,quiet){
 state.shapes.push(h);commit(label||(_("Vẽ ","Draw ")+T_(SHAPE_T[h.t])));renderShapes();
 if(!quiet)setStatus(_("Đã vẽ — ","Drawn — ")+shapeBrief(h));
}
const draftSh=(t,pts,extra)=>shapeMarkup(newCadShape(t,pts,extra,true),false);
const ghostG=list=>`<g opacity=".6">${list.join("")}</g>`;

/* ---------- vẽ ---------- */
CMDS.line=()=>{
 let a=null;
 const c={base:()=>a,
  prompt:()=>a?["Điểm tiếp theo (bấm, hoặc gõ x,y / @dx,dy / số; Enter = kết thúc)","Next point (click, or type x,y / @dx,dy / a number; Enter = finish)"]:["Điểm đầu của đường thẳng (bấm, hoặc gõ x,y)","Start point (click or type x,y)"],
  click:p=>{if(!a){a=p;return cadPrompt()}if(hyp(a,p)<.01)return;const h=newCadShape("line",[a,p]);addCadShape(h);a=p;cadPrompt()},
  draft:()=>a?draftSh("line",[a,CAD.cur]):"",
  enter:()=>cadReset(true)};
 return c;
};
CMDS.pline=()=>{
 let P=[];
 const fin=close=>{if(P.length<2){cadReset(true);return}const h=newCadShape("poly",P.slice(),{closed:!!close&&P.length>=3});addCadShape(h,_("Vẽ đa tuyến","Draw polyline"));cadReset(true)};
 return{base:()=>P.length?P[P.length-1]:null,
  prompt:()=>P.length?["Điểm tiếp theo (Enter = kết thúc; gõ C rồi Enter = khép kín; bấm đúp = kết thúc)","Next point (Enter = finish; type C then Enter = close; double-click = finish)"]:["Điểm đầu của đa tuyến","Start point of the polyline"],
  click:p=>{if(P.length&&hyp(P[P.length-1],p)<.01){fin(false);return}if(P.length>=3&&hyp(P[0],p)<.01){fin(true);return}P.push(p);cadPrompt()},
  draft:()=>P.length?draftSh("poly",[...P,CAD.cur]):"",
  opt:t=>{if(t==="c"||t==="close"){fin(true);return true}return false},
  enter:()=>fin(false)};
};
CMDS.rect=()=>{
 let a=null;
 return{base:()=>a,prompt:()=>a?["Góc đối diện (bấm hoặc gõ @rộng,cao — vd @200,100)","Opposite corner (click or type @width,height — e.g. @200,100)"]:["Góc thứ nhất của hình chữ nhật","First corner of the rectangle"],
  click:p=>{if(!a){a=p;return cadPrompt()}if(Math.abs(p.x-a.x)<.01||Math.abs(p.y-a.y)<.01){setStatus(_("Hai góc trùng hàng hoặc cột — chọn điểm khác.","The corners share a row or column — pick another point."));return}const h=newCadShape("rect",[a,p],{closed:true});addCadShape(h);cadReset(true)},
  draft:()=>a?draftSh("rect",[a,CAD.cur],{closed:true}):"",enter:()=>cadReset(true)};
};
CMDS.circle=()=>{
 let o=null;
 return{base:()=>o,prompt:()=>o?["Bán kính: bấm một điểm trên đường tròn, hoặc gõ số","Radius: click a point on the circle, or type a number"]:["Tâm đường tròn","Centre of the circle"],
  click:p=>{if(!o){o=p;return cadPrompt()}if(hyp(o,p)<.01)return;const h=newCadShape("circle",[o,p],{closed:true});addCadShape(h);cadReset(true)},
  draft:()=>o?draftSh("circle",[o,CAD.cur],{closed:true})+`<path d="M${o.x} ${o.y}L${CAD.cur.x} ${CAD.cur.y}" stroke="#2563eb" stroke-width="${1/view.k}" stroke-dasharray="${5/view.k} ${4/view.k}"/>`:"",enter:()=>cadReset(true)};
};
CMDS.arc=()=>{
 const P=[];
 return{base:()=>P.length?P[P.length-1]:null,
  prompt:()=>P.length===0?["Điểm đầu của cung","Start point of the arc"]:P.length===1?["Điểm thứ hai nằm trên cung","A second point on the arc"]:["Điểm cuối của cung","End point of the arc"],
  click:p=>{P.push(p);if(P.length<3)return cadPrompt();if(!arcGeom(P[0],P[1],P[2])){setStatus(_("Ba điểm thẳng hàng — không tạo được cung. Chọn lại điểm cuối.","The three points are collinear — no arc. Pick another end point."));P.pop();return}const h=newCadShape("arc",P.slice());addCadShape(h);cadReset(true)},
  draft:()=>P.length===1?draftSh("line",[P[0],CAD.cur]):P.length===2?(arcGeom(P[0],P[1],CAD.cur)?draftSh("arc",[P[0],P[1],CAD.cur]):draftSh("line",[P[0],CAD.cur])):"",
  enter:()=>cadReset(true)};
};
CMDS.ellipse=()=>{
 let o=null;const mk=p=>{const dx=Math.max(1,Math.abs(p.x-o.x)),dy=Math.max(1,Math.abs(p.y-o.y));return[{x:o.x-dx,y:o.y-dy},{x:o.x+dx,y:o.y+dy}]};
 return{base:()=>o,prompt:()=>o?["Góc khung bao: khoảng cách tới tâm theo X và Y là hai bán trục (bấm hoặc gõ @rx,ry)","Bounding corner: its X and Y distances from the centre are the semi-axes (click or type @rx,ry)"]:["Tâm elip","Centre of the ellipse"],
  click:p=>{if(!o){o=p;return cadPrompt()}const h=newCadShape("ellipse",mk(p),{closed:true});addCadShape(h);cadReset(true)},
  draft:()=>o?draftSh("ellipse",mk(CAD.cur),{closed:true}):"",enter:()=>cadReset(true)};
};
CMDS.text=()=>({prompt:()=>["Bấm vị trí đặt chữ (tâm khung chữ). Sau đó gõ nội dung ở bảng Thuộc tính.","Click where the text goes (centre of the text box). Then type the content in the Properties panel."],
 click:p=>{
  const n=mkNode("text",p.x,p.y);n.lay=layerFor("text").id;n.col=layerFor("text").col;n.fz=10;n.title=_("Ghi chú","Note");
  sel=new Set([n.id]);selEdge=null;commit(_("Thêm chữ","Add text"));cadReset(true);renderAll();focusField("pTitle");
  setStatus(_("Đã thêm khung chữ — gõ nội dung ngay, Tab để chuyển sang ô khác.","Text box added — type the content now."));
 }});

/* ---------- kích thước ---------- */
function autoDs(p1,p2,c){
 const x0=Math.min(p1.x,p2.x),x1=Math.max(p1.x,p2.x),y0=Math.min(p1.y,p2.y),y1=Math.max(p1.y,p2.y);
 const inX=c.x>=x0&&c.x<=x1,inY=c.y>=y0&&c.y<=y1;
 if(inX&&!inY)return"h";if(inY&&!inX)return"v";
 if(inX&&inY)return(x1-x0)>=(y1-y0)?"h":"v";
 const dx=Math.max(x0-c.x,0,c.x-x1),dy=Math.max(y0-c.y,0,c.y-y1);return dy>=dx?"h":"v";
}
function dimCmd(aligned){
 const P=[];
 const ds=c=>aligned?"al":autoDs(P[0],P[1],c);
 return{base:()=>P.length===2?{x:(P[0].x+P[1].x)/2,y:(P[0].y+P[1].y)/2}:(P.length?P[0]:null),
  prompt:()=>P.length===0?["Điểm đo thứ nhất (đầu mút, tâm… — bật bắt điểm F3)","First measured point (endpoint, centre… — object snap F3)"]:P.length===1?["Điểm đo thứ hai","Second measured point"]:["Vị trí đường kích thước (kéo ra xa rồi bấm)","Dimension line position (move away and click)"],
  click:p=>{P.push(p);if(P.length<3)return cadPrompt();const h=newCadShape("dim",[P[0],P[1],p],{ds:ds(p)});addCadShape(h);cadReset(true)},
  draft:()=>P.length===1?draftSh("line",[P[0],CAD.cur],{dash:"dash",sw:1}):P.length===2?draftSh("dim",[P[0],P[1],CAD.cur],{ds:ds(CAD.cur)}):"",
  enter:()=>cadReset(true)};
}
CMDS.dim=()=>dimCmd(false);CMDS.dimal=()=>dimCmd(true);
function radCmd(kind){
 let src=null;
 const info=()=>{const h=src;if(h.t==="circle")return{c:h.pts[0],r:hyp(h.pts[0],h.pts[1])};const g=arcGeom(h.pts[0],h.pts[1],h.pts[2]);return g?{c:{x:g.cx,y:g.cy},r:g.r}:null};
 let pk=null;
 return{prompt:()=>!src?["Bấm vào một đường tròn hoặc cung tròn","Click a circle or an arc"]:["Bấm vị trí đặt chữ kích thước","Click where the dimension text goes"],
  click:(p,o)=>{
   if(!src){const h=pickShapeNear(o.raw||p,["circle","arc"]);if(!h){setStatus(_("Chưa thấy đường tròn / cung tròn ở đó — bấm sát nét hơn.","No circle or arc there — click closer to the outline."));return}src=h;const i=info();if(!i){src=null;return}const u=unit2(i.c,o.raw||p);pk={x:i.c.x+u.x*i.r,y:i.c.y+u.y*i.r};return cadPrompt()}
   const i=info();const h=newCadShape("dim",[i.c,pk,p],{ds:kind});addCadShape(h);cadReset(true);
  },
  draft:()=>src?draftSh("dim",[info().c,pk,CAD.cur],{ds:kind}):"",enter:()=>cadReset(true)};
}
CMDS.dimr=()=>radCmd("r");CMDS.dimd=()=>radCmd("d");

/* ---------- hatch ---------- */
function closedShapes(){return state.shapes.filter(h=>layVis(h)&&["rect","circle","ellipse"].includes(h.t)||(layVis(h)&&h.t==="poly"&&h.closed&&h.pts.length>=3))}
function hatchAt(p){
 const cs=closedShapes().map(h=>({h,pp:shapePoly(h).pts})).filter(o=>pointInRing(p,o.pp));
 if(!cs.length)return null;
 cs.sort((a,b)=>ringArea(a.pp)-ringArea(b.pp));
 const out=cs[0],holes=closedShapes().filter(h=>h!==out.h).map(h=>shapePoly(h).pts).filter(r=>r.every(q=>pointInRing(q,out.pp))&&!pointInRing(p,r));
 return{pts:out.pp.map(q=>({x:q.x,y:q.y})),rings:holes.map(r=>r.map(q=>({x:q.x,y:q.y})))};
}
CMDS.hatch=()=>({prompt:()=>["Bấm vào bên trong một vùng kín (hộp, tròn, elip, đa giác khép kín). Enter = xong. Kiểu hatch đặt ở ô bên phải.","Click inside a closed region (box, circle, ellipse, closed polygon). Enter = done. Pattern is set in the right panel."],
 click:p=>{
  const r=hatchAt(p);if(!r){setStatus(_("Điểm này không nằm trong hình kín nào. Hãy vẽ biên kín trước (hộp, tròn, elip, đa tuyến khép kín).","This point is not inside any closed shape. Draw a closed boundary first (box, circle, ellipse, closed polyline)."));return}
  const L=layerFor("hatch"),hh=CAD.hatch;
  const h=newCadShape("hatch",r.pts,{rings:r.rings,hpat:hh.pat,ha:hh.ha,hs:hh.hs,fill:hh.fill||"",fo:.35,sw:L.sw,closed:true});
  addCadShape(h);cadPrompt();
 },enter:()=>cadReset(true)});

/* ---------- chọn đối tượng cho lệnh sửa ---------- */
function refreshSel(){renderNodes();renderShapes();renderProps()}
function selClick(c,o){
 if(c.stage!=="sel")return false;
 const ob=o&&o.ev?pickAt(o.ev):null;
 if(ob){if(sel.has(ob.id))sel.delete(ob.id);else sel.add(ob.id);refreshSel();setStatus(_(`Đã chọn ${sel.size} đối tượng. Chọn thêm hoặc Enter để tiếp tục.`,`${sel.size} object(s) selected. Pick more or press Enter to continue.`));return true}
 if(o&&o.ev){const w=worldPt(o.ev);ptr={type:"marquee",x0:w.x,y0:w.y,add:true,base:new Set(sel),moved:false}}
 return true;
}
function selEnter(c){
 if(c.stage!=="sel")return false;
 if(!sel.size){cadReset(true);setStatus(_("Chưa chọn đối tượng nào — đã thoát lệnh.","No objects selected — command ended."));return true}
 c.stage="act";cadPrompt();return true;
}
const SELP=["Chọn đối tượng: bấm từng cái hoặc kéo khung; Enter khi xong","Select objects: click each or drag a window; Enter when done"];
function modBase(build){
 const c=build();c.stage=sel.size?"act":"sel";
 const p0=c.prompt,cl=c.click,en=c.enter;
 c.prompt=()=>c.stage==="sel"?SELP:p0();
 c.click=(p,o)=>{if(selClick(c,o))return;cl(p,o)};
 c.init=()=>{if(c.stage==="act"&&c.auto)c.auto()};
 c.enter=()=>{if(selEnter(c)){c.init();return}if(en)en();else cadReset(true)};
 const dr=c.draft;c.draft=()=>c.stage==="sel"?"":(dr?dr():"");
 return c;
}

/* ---------- biến đổi ---------- */
function cloneXform(h,fn,opt){
 const c=JSON.parse(JSON.stringify(h));opt=opt||{};
 if((c.t==="rect"||c.t==="ellipse")&&opt.nonAxis){const pp=shapePoly(c);c.t="poly";c.pts=pp.pts;c.closed=true;delete c.rx}
 mapShapePts(c,fn);
 if(c.t==="dim"&&(c.ds==="h"||c.ds==="v")){
  if(opt.nonAxis)c.ds="al";else if(opt.swap)c.ds=c.ds==="h"?"v":"h";
 }
 return c;
}
function xformTargets(){return{shapes:selShapes().filter(h=>!layLock(h)),nodes:selNodes().filter(n=>n.type==="text"&&!layLock(n))}}
function applyXform(fn,opt){
 opt=opt||{};const T=xformTargets(),made=[];
 T.shapes.forEach(h=>{const c=cloneXform(h,fn,opt);if(opt.copy){c.id=uid("s");state.shapes.push(c);made.push(c.id)}else{const id=h.id;Object.assign(h,c);h.id=id}});
 T.nodes.forEach(n=>{
  const c=JSON.parse(JSON.stringify(n)),p=fn({x:n.x,y:n.y});c.x=p.x;c.y=p.y;if(opt.rot)c.rot=(((n.rot||0)-opt.rot)%360+360)%360;if(opt.scale&&c.fz)c.fz=Math.max(3,Math.min(80,+c.fz*opt.scale));
  if(opt.copy){c.id=uid("n");state.nodes.push(c);made.push(c.id)}else{const id=n.id;Object.assign(n,c);n.id=id}
 });
 return made;
}
function ghostOf(fn,opt){
 const T=xformTargets(),o=[];
 T.shapes.forEach(h=>{const c=cloneXform(h,fn,opt);c.id="g";o.push(shapeMarkup(c,false))});
 T.nodes.forEach(n=>{const d=symDef(n),p=fn({x:n.x,y:n.y});o.push(`<rect x="${p.x-d.w/2}" y="${p.y-d.h/2}" width="${d.w}" height="${d.h}" fill="none" stroke="#1677ff" stroke-width="${1/view.k}" stroke-dasharray="4 3"/>`)});
 return ghostG(o);
}
const rotFn=(b,deg)=>{const a=deg*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);return p=>{const dx=p.x-b.x,dy=p.y-b.y;return{x:b.x+dx*ca+dy*sa,y:b.y-dx*sa+dy*ca}}};
const sclFn=(b,f)=>p=>({x:b.x+(p.x-b.x)*f,y:b.y+(p.y-b.y)*f});
const movFn=(a,b)=>p=>({x:p.x+b.x-a.x,y:p.y+b.y-a.y});
const angOf=(b,p)=>Math.atan2(-(p.y-b.y),p.x-b.x)*180/Math.PI;
const isAxisAng=a=>Math.abs(((a%90)+90)%90)<1e-6||Math.abs(((a%90)+90)%90-90)<1e-6;
const guide=(a,b)=>`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="#2563eb" stroke-width="${1/view.k}" stroke-dasharray="${5/view.k} ${4/view.k}" fill="none"/>`;
function doneMod(label,msg){commit(label);renderAll();setStatus(msg)}

CMDS.move=()=>modBase(()=>{
 let a=null;
 return{base:()=>a,prompt:()=>a?["Điểm đích (bấm, hoặc gõ @dx,dy / số)","Destination point (click, or type @dx,dy / a number)"]:["Điểm gốc để di chuyển","Base point for the move"],
  click:p=>{if(!a){a=p;return cadPrompt()}applyXform(movFn(a,p),{});doneMod(_("Di chuyển","Move"),_("Đã di chuyển.","Moved."));cadReset(true)},
  draft:()=>a?ghostOf(movFn(a,CAD.cur))+guide(a,CAD.cur):""};
});
CMDS.copy=()=>modBase(()=>{
 let a=null,n=0;
 return{base:()=>a,prompt:()=>a?["Điểm đích của bản sao (có thể bấm nhiều lần, Enter = xong)","Destination of the copy (click repeatedly; Enter = done)"]:["Điểm gốc để sao chép","Base point for the copy"],
  click:p=>{if(!a){a=p;return cadPrompt()}applyXform(movFn(a,p),{copy:true});n++;commit(_("Sao chép","Copy"));renderAll();setStatus(_(`Đã sao chép lần ${n}. Bấm tiếp hoặc Enter để xong.`,`Copy #${n} made. Click again or press Enter to finish.`))},
  draft:()=>a?ghostOf(movFn(a,CAD.cur))+guide(a,CAD.cur):"",enter:()=>cadReset(true)};
});
CMDS.rotate=()=>modBase(()=>{
 let b=null;
 const go=deg=>{applyXform(rotFn(b,deg),{rot:deg,nonAxis:!isAxisAng(deg),swap:Math.abs(((deg%180)+180)%180-90)<1e-6});doneMod(_("Xoay","Rotate"),_(`Đã xoay ${Math.round(deg*100)/100}° (ngược chiều kim đồng hồ là dương).`,`Rotated ${Math.round(deg*100)/100}° (counter-clockwise is positive).`));cadReset(true)};
 return{base:()=>b,prompt:()=>b?["Góc xoay: bấm hướng, hoặc gõ số độ (dương = ngược chiều kim đồng hồ)","Rotation angle: click a direction, or type degrees (positive = counter-clockwise)"]:["Điểm tâm xoay","Rotation centre"],
  click:p=>{if(!b){b=p;return cadPrompt()}if(hyp(b,p)<.01)return;go(angOf(b,p))},
  num:v=>{if(!b)return false;go(v)},
  draft:()=>{if(!b)return"";const d=angOf(b,CAD.cur),deg=hyp(b,CAD.cur)<.01?0:d;return ghostOf(rotFn(b,deg),{nonAxis:!isAxisAng(deg)})+guide(b,CAD.cur)}};
});
CMDS.scale=()=>modBase(()=>{
 let b=null,ref=null;
 const go=f=>{if(!(f>0)){setStatus(_("Hệ số phải lớn hơn 0.","The factor must be greater than 0."));return}applyXform(sclFn(b,f),{scale:f});doneMod(_("Tỷ lệ","Scale"),_(`Đã phóng / thu ×${Math.round(f*10000)/10000}.`,`Scaled ×${Math.round(f*10000)/10000}.`));cadReset(true)};
 return{base:()=>b,prompt:()=>!b?["Điểm gốc phóng / thu (điểm đứng yên)","Base point of the scaling (stays fixed)"]:!ref?["Gõ hệ số (vd 2 hoặc 0.5), hoặc bấm điểm tham chiếu rồi bấm điểm mới","Type a factor (e.g. 2 or 0.5), or click a reference point then a new point"]:["Bấm điểm mới (khoảng cách mới so với tham chiếu)","Click the new point (new distance relative to the reference)"],
  click:p=>{if(!b){b=p;return cadPrompt()}if(!ref){if(hyp(b,p)<.01)return;ref=p;return cadPrompt()}go(hyp(b,p)/hyp(b,ref))},
  num:v=>{if(!b)return false;go(v)},
  draft:()=>{if(!b)return"";const f=ref?hyp(b,CAD.cur)/hyp(b,ref):1;return(f>0&&isFinite(f)?ghostOf(sclFn(b,f)):"")+guide(b,ref||CAD.cur)}};
});
CMDS.mirror=()=>modBase(()=>{
 let a=null;
 const mf=(p1,p2)=>{const u=unit2(p1,p2);return p=>{const vx=p.x-p1.x,vy=p.y-p1.y,d=vx*u.x+vy*u.y;return{x:p1.x+2*d*u.x-vx,y:p1.y+2*d*u.y-vy}}};
 const na=(p1,p2)=>Math.abs(p2.x-p1.x)>1e-6&&Math.abs(p2.y-p1.y)>1e-6;
 return{base:()=>a,prompt:()=>a?["Điểm thứ hai của trục đối xứng","Second point of the mirror axis"]:["Điểm thứ nhất của trục đối xứng","First point of the mirror axis"],
  click:p=>{if(!a){a=p;return cadPrompt()}if(hyp(a,p)<.01)return;
   if(CAD.mirDel)applyXform(mf(a,p),{nonAxis:na(a,p)});else applyXform(mf(a,p),{copy:true,nonAxis:na(a,p)});
   doneMod(_("Đối xứng","Mirror"),CAD.mirDel?_("Đã lấy đối xứng (đã bỏ bản gốc).","Mirrored (original removed)."):_("Đã lấy đối xứng (giữ bản gốc). Muốn bỏ bản gốc: bật ô “Xoá bản gốc khi đối xứng” ở bảng bên phải.","Mirrored (original kept). To remove the original, tick “Delete source when mirroring” in the right panel."));cadReset(true)},
  draft:()=>a?ghostOf(mf(a,CAD.cur),{nonAxis:na(a,CAD.cur)})+guide(a,CAD.cur):""};
});
CMDS.erase=()=>{
 const del=()=>{const n=sel.size;deleteSelected();setStatus(_(`Đã xoá ${n} đối tượng.`,`${n} object(s) deleted.`))};
 if(sel.size){del();return null}
 return modBase(()=>({prompt:()=>SELP,click:()=>{},auto:()=>{del();cadReset(true)}}));
};
CMDS.explode=()=>{
 const run=()=>{
  let n=0;
  selShapes().filter(h=>!layLock(h)&&(h.t==="poly"||h.t==="rect")).forEach(h=>{
   const pp=shapePoly(h),segs=polySegs(pp);state.shapes=state.shapes.filter(x=>x!==h);sel.delete(h.id);
   segs.forEach(s=>{const c=JSON.parse(JSON.stringify(h));c.id=uid("s");c.t="line";c.pts=[{...s[0]},{...s[1]}];c.closed=false;c.fill="";delete c.rx;state.shapes.push(c);sel.add(c.id)});n++;
  });
  if(n){commit(_("Phá khối (Explode)","Explode"));renderAll()}setStatus(n?_(`Đã tách ${n} hình thành đoạn thẳng.`,`${n} shape(s) exploded into lines.`):_("Không có đa tuyến / hình chữ nhật nào để tách.","No polylines / rectangles to explode."));
 };
 if(sel.size){run();return null}
 return modBase(()=>({prompt:()=>SELP,click:()=>{},auto:()=>{run();cadReset(true)}}));
};

/* ---------- offset ---------- */
function offsetShape(h,d,side){
 const P=h.pts,mk=(pts,extra)=>{const c=JSON.parse(JSON.stringify(h));c.id=uid("s");c.pts=pts;Object.assign(c,extra||{});return c};
 if(h.t==="line"||h.t==="arrow"){const u=unit2(P[0],P[P.length-1]),n={x:-u.y,y:u.x},s=sgn((side.x-P[0].x)*n.x+(side.y-P[0].y)*n.y);return mk([{x:P[0].x+n.x*d*s,y:P[0].y+n.y*d*s},{x:P[P.length-1].x+n.x*d*s,y:P[P.length-1].y+n.y*d*s}])}
 if(h.t==="circle"){const r=hyp(P[0],P[1]),out=hyp(side,P[0])>r,r2=out?r+d:r-d;if(r2<=.01)return null;const u=unit2(P[0],P[1]);return mk([P[0],{x:P[0].x+u.x*r2,y:P[0].y+u.y*r2}])}
 if(h.t==="arc"){const g=arcGeom(P[0],P[1],P[2]);if(!g)return null;const out=hyp(side,{x:g.cx,y:g.cy})>g.r,r2=out?g.r+d:g.r-d;if(r2<=.01)return null;const f=r2/g.r,c={x:g.cx,y:g.cy};return mk(P.map(p=>({x:c.x+(p.x-c.x)*f,y:c.y+(p.y-c.y)*f})))}
 if(h.t==="rect"||h.t==="ellipse"){const b=shapeBox(h),inside=side.x>b.x0&&side.x<b.x1&&side.y>b.y0&&side.y<b.y1,e=inside?-d:d;if(b.x1-b.x0+2*e<=.01||b.y1-b.y0+2*e<=.01)return null;return mk([{x:b.x0-e,y:b.y0-e},{x:b.x1+e,y:b.y1+e}])}
 if(h.t==="poly"){
  const pp=shapePoly(h),S=polySegs(pp);let bi=0,bd=1e18;S.forEach((s,i)=>{const c=closestOnSeg(side,s[0],s[1]),dd=hyp(c,side);if(dd<bd){bd=dd;bi=i}});
  const u=unit2(S[bi][0],S[bi][1]),n={x:-u.y,y:u.x},cp=closestOnSeg(side,S[bi][0],S[bi][1]),s=sgn((side.x-cp.x)*n.x+(side.y-cp.y)*n.y);
  const off=S.map(sg=>{const v=unit2(sg[0],sg[1]),nn={x:-v.y*s,y:v.x*s};return[{x:sg[0].x+nn.x*d,y:sg[0].y+nn.y*d},{x:sg[1].x+nn.x*d,y:sg[1].y+nn.y*d}]});
  const out=[],m=off.length,cl=!!h.closed&&P.length>2;
  if(!cl){out.push(off[0][0]);for(let i=0;i<m-1;i++){const x=lineInt2(off[i][0],off[i][1],off[i+1][0],off[i+1][1]);out.push(x&&hyp(x,P[i+1])<d*6?x:off[i][1])}out.push(off[m-1][1])}
  else{for(let i=0;i<m;i++){const pr=off[(i+m-1)%m],cu=off[i],x=lineInt2(pr[0],pr[1],cu[0],cu[1]);out.push(x&&hyp(x,P[i])<d*6?x:cu[0])}}
  return mk(out);
 }
 return null;
}
function lineInt2(a,b,c,d){const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-9)return null;const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den;return{x:a.x+t*r.x,y:a.y+t*r.y}}
CMDS.offset=()=>{
 let d=CAD.offD>0?CAD.offD:0,st=d>0?0:0,src=null,p0=null;
 const dm=()=>fmtLen(d,Math.max(cadCfg().dec,1))+" "+cadCfg().unit;
 return{base:()=>st===0?p0:null,
  prompt:()=>st===0?(d>0?[`Khoảng cách offset hiện tại ${dm()} — gõ số mới, hoặc Enter để dùng`,`Current offset distance ${dm()} — type a new number, or press Enter to use it`]:["Khoảng cách offset: gõ số (vd 50) hoặc bấm hai điểm","Offset distance: type a number (e.g. 50) or click two points"]):st===1?["Bấm vào đường / hình cần offset (Enter = xong)","Click the object to offset (Enter = done)"]:["Bấm về phía cần offset (trong hay ngoài)","Click the side to offset toward (inside or outside)"],
  num:v=>{if(st!==0)return false;d=lenU2W(Math.abs(v));if(d<=0)return;CAD.offD=d;st=1;cadPrompt()},
  click:(p,o)=>{
   if(st===0){if(!p0){p0=p;return cadPrompt()}d=hyp(p0,p);if(d<.01){p0=null;return}CAD.offD=d;st=1;return cadPrompt()}
   if(st===1){const h=pickShapeNear((o&&o.raw)||p,["line","arrow","circle","arc","rect","ellipse","poly"]);if(!h){setStatus(_("Chưa thấy đối tượng có thể offset ở đó (đường, tròn, cung, hộp, elip, đa tuyến).","No offsettable object there (line, circle, arc, box, ellipse, polyline)."));return}src=h;st=2;return cadPrompt()}
   const nh=offsetShape(src,d,p);if(!nh){setStatus(_("Không offset được về phía đó (khoảng cách quá lớn so với hình).","Cannot offset toward that side (distance too large for the shape)."));st=1;return cadPrompt()}
   state.shapes.push(nh);commit(_("Offset","Offset"));renderShapes();st=1;src=null;cadPrompt(_("Đã offset. ","Offset made. "));
  },
  draft:()=>{if(st===2&&src){const nh=offsetShape(src,d,CAD.cur);if(nh){nh.id="draft";return ghostG([shapeMarkup(nh,false)])}}return ""},
  enter:()=>{if(st===0&&d>0){st=1;cadPrompt();return}cadReset(true)}};
};

/* ---------- trim / extend (cho đoạn thẳng) ---------- */
function otherSegs(h){const o=[];state.shapes.forEach(x=>{if(x===h||x.t==="hatch"||x.t==="dim"||!layVis(x))return;shapeSegs(x).forEach(s=>o.push(s))});return o}
CMDS.trim=()=>({prompt:()=>["Bấm vào phần đoạn thẳng cần cắt bỏ (cắt tới giao điểm gần nhất; Enter = xong)","Click the part of a line to remove (cut to the nearest intersections; Enter = done)"],
 click:(p,o)=>{
  const h=pickShapeNear((o&&o.raw)||p,["line","arrow"]);
  if(!h){setStatus(_("Lệnh Trim hiện chỉ cắt đoạn thẳng. Với hộp / đa tuyến: dùng lệnh X (Explode) trước.","Trim currently works on straight lines. For boxes / polylines use X (Explode) first."));return}
  const A=h.pts[0],B=h.pts[h.pts.length-1],L2=(B.x-A.x)**2+(B.y-A.y)**2,rp=(o&&o.raw)||p,tc=((rp.x-A.x)*(B.x-A.x)+(rp.y-A.y)*(B.y-A.y))/L2;
  const ts=[];otherSegs(h).forEach(s=>{const x=segInt(A,B,s[0],s[1]);if(x&&x.t>1e-4&&x.t<1-1e-4)ts.push(x.t)});ts.sort((a,b)=>a-b);
  if(!ts.length){setStatus(_("Đoạn này không cắt đối tượng nào để làm biên.","This line crosses no other object to use as a cutting edge."));return}
  const lo=ts.filter(t=>t<tc).pop(),hi=ts.find(t=>t>tc),pt=t=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});
  const keep=[];if(lo!==undefined)keep.push([0,lo]);if(hi!==undefined)keep.push([hi,1]);
  if(lo===undefined&&hi===undefined)return;
  state.shapes=state.shapes.filter(x=>x!==h);sel.delete(h.id);
  keep.forEach(k=>{const c=JSON.parse(JSON.stringify(h));c.id=uid("s");c.pts=[pt(k[0]),pt(k[1])];state.shapes.push(c)});
  commit(_("Cắt (Trim)","Trim"));renderShapes();renderProps();setStatus(_("Đã cắt. Bấm tiếp hoặc Enter để xong.","Trimmed. Click again or press Enter to finish."));
 },enter:()=>cadReset(true)});
CMDS.extend=()=>({prompt:()=>["Bấm gần đầu mút của đoạn thẳng cần kéo dài (tới đối tượng gần nhất; Enter = xong)","Click near the end of the line to extend (to the nearest object; Enter = done)"],
 click:(p,o)=>{
  const rp=(o&&o.raw)||p,h=pickShapeNear(rp,["line","arrow"]);
  if(!h){setStatus(_("Chưa thấy đoạn thẳng ở đó.","No straight line there."));return}
  const A=h.pts[0],B=h.pts[h.pts.length-1],endB=hyp(rp,B)<hyp(rp,A),from=endB?A:B,to=endB?B:A,u=unit2(from,to),far={x:to.x+u.x*1e6,y:to.y+u.y*1e6};
  let best=null;otherSegs(h).forEach(s=>{const x=segInt(to,far,s[0],s[1]);if(x&&x.t>1e-9&&(!best||x.t<best.t))best=x});
  if(!best){setStatus(_("Không có đối tượng nào phía trước để kéo dài tới.","Nothing ahead to extend to."));return}
  if(endB)h.pts[h.pts.length-1]={x:best.x,y:best.y};else h.pts[0]={x:best.x,y:best.y};
  commit(_("Kéo dài (Extend)","Extend"));renderShapes();renderProps();setStatus(_("Đã kéo dài. Bấm tiếp hoặc Enter để xong.","Extended. Click again or press Enter to finish."));
 },enter:()=>cadReset(true)});

/* ---------- array (nhân bản theo hàng cột / vòng tròn) ---------- */
function ensureArrayModal(){
 if($("mArray"))return;
 const d=document.createElement("div");d.className="modal";d.id="mArray";
 d.innerHTML=`<div class="card" role="dialog" aria-label="Array"><h2>Array — nhân bản theo hàng cột / vòng tròn</h2>
 <label for="arType">Kiểu</label><select id="arType"><option value="rect">Hàng × cột (rectangular)</option><option value="polar">Vòng tròn quanh một tâm (polar)</option></select>
 <div id="arRect"><div class="row"><div><label for="arRows">Số hàng</label><input id="arRows" type="number" min="1" max="200" value="2"></div><div><label for="arCols">Số cột</label><input id="arCols" type="number" min="1" max="200" value="3"></div></div>
 <div class="row"><div><label for="arDy">Khoảng cách hàng (đơn vị thực, + = lên)</label><input id="arDy" type="number" step="any" value="100"></div><div><label for="arDx">Khoảng cách cột (+ = sang phải)</label><input id="arDx" type="number" step="any" value="100"></div></div></div>
 <div id="arPolar" style="display:none"><div class="row"><div><label for="arN">Tổng số bản (kể cả bản gốc)</label><input id="arN" type="number" min="2" max="360" value="6"></div><div><label for="arAng">Góc phủ (°, 360 = đủ vòng)</label><input id="arAng" type="number" step="any" value="360"></div></div><p class="hint">Sau khi bấm OK, bấm (hoặc gõ toạ độ) điểm tâm vòng tròn.</p></div>
 <div class="mbar"><button class="btn" onclick="closeModals();cadReset(true)">Huỷ</button><span style="flex:1"></span><button class="btn primary" id="arOk">OK</button></div></div>`;
 document.body.appendChild(d);
 $("arType").addEventListener("change",()=>{const p=$("arType").value==="polar";$("arRect").style.display=p?"none":"";$("arPolar").style.display=p?"":"none"});
}
CMDS.array=()=>modBase(()=>{
 let ctr=null,mode=null;
 const c={base:()=>null,prompt:()=>mode==="polar"?["Bấm điểm tâm của vòng tròn","Click the centre of the circle"]:["Đang mở hộp thoại Array…","Opening the Array dialog…"],
  click:p=>{
   if(mode!=="polar")return;
   const n=Math.max(2,Math.min(360,Math.round(+$("arN").value||6))),ang=+$("arAng").value||360,step=Math.abs(ang)>=360?ang/n:ang/(n-1);
   for(let i=1;i<n;i++){const deg=step*i;applyXform(rotFn(p,deg),{copy:true,rot:deg,nonAxis:!isAxisAng(deg),swap:Math.abs(((deg%180)+180)%180-90)<1e-6})}
   doneMod(_("Array tròn","Polar array"),_(`Đã tạo ${n} bản quanh tâm.`,`${n} copies created around the centre.`));cadReset(true);
  },
  auto:()=>{
   ensureArrayModal();openModal("mArray");
   $("arOk").onclick=()=>{
    if($("arType").value==="polar"){mode="polar";closeModals();cadPrompt();return}
    const R=Math.max(1,Math.min(200,Math.round(+$("arRows").value||1))),C=Math.max(1,Math.min(200,Math.round(+$("arCols").value||1))),dy=+$("arDy").value||0,dx=+$("arDx").value||0,k=cadWPU();
    if(R*C>2000){setStatus(_("Quá nhiều bản (tối đa 2000).","Too many copies (max 2000)."));return}
    for(let r=0;r<R;r++)for(let q=0;q<C;q++){if(!r&&!q)continue;applyXform(movFn({x:0,y:0},{x:q*dx*k,y:-r*dy*k}),{copy:true})}
    closeModals();doneMod(_("Array hàng cột","Rectangular array"),_(`Đã tạo ${R*C-1} bản sao.`,`${R*C-1} copies created.`));cadReset(true);
   };
   focusField("arRows");
  }};
 return c;
});
