/* ============ CHUYỂN MODULE: PFD ⇄ SƠ ĐỒ ============ */
const STORE={pfd:null,dgm:null};
const dgOn=()=>state.meta.doc==="dgm";
function saveCtx(){return{state,view:{...view},hist,fut,cur,sel:new Set(sel)}}
function loadCtx(c){state=c.state;view=c.view;hist=c.hist;fut=c.fut;cur=c.cur;sel=c.sel;selEdge=null}
function newDgmState(src){
 const s=newState(),m=s.meta;
 Object.assign(m,{doc:"dgm",title:_("SƠ ĐỒ","DIAGRAM"),docNo:"DG-001",docType:"Diagram",template:"frame",sheet:"A4",orient:"landscape",showSheet:false,showProps:false,colorByPhase:false,showTable:false,grid:true,snap:false,lineMode:"fixed"});
 m.dg=defaultDgMeta();
 if(src){["company","client","drawnBy","checkedBy","approvedBy","tbLang","fonts"].forEach(k=>{if(src[k]!==undefined)m[k]=src[k]});m.fonts=cleanFonts(src.fonts);m.project=""}
 return s;
}
function setModule(m){
 if(m===state.meta.doc)return;
 clearTimeout(cT);commit();if(typeof dgCancel==="function")dgCancel();
 STORE[state.meta.doc]=saveCtx();
 if(STORE[m])loadCtx(STORE[m]);
 else{
  const o=state.meta;state=m==="dgm"?newDgmState(o):newState();view={x:30,y:30,k:.6};sel=new Set();selEdge=null;hist=[];fut=[];cur={s:snapshot(),l:_("Khởi tạo","Initial")};
  if(m==="dgm"&&typeof dgStarter==="function")dgStarter();
 }
 applyModuleUI(true);savePrefs();
 setStatus(m==="dgm"?_("Sơ đồ: bấm một hình ở thư viện bên trái để thêm; Tab = thêm cấp dưới, Enter = thêm ngang cấp, F2 = sửa chữ. Bấm ? để xem hướng dẫn và phím tắt.","Diagram: click a shape in the library to add it; Tab = add child, Enter = add sibling, F2 = edit text. Press ? for the guide and hotkeys."):_("PFD: bấm hoặc kéo thiết bị từ thư viện vào bản vẽ.","PFD: click or drag equipment from the library onto the drawing."));
}
function adoptState(ns){
 const from=state.meta.doc,to=ns.meta.doc;
 if(from!==to){clearTimeout(cT);if(typeof dgCancel==="function")dgCancel();STORE[from]=saveCtx()}
 state=ns;sel=new Set();selEdge=null;
 if(from!==to){hist=[];fut=[];cur={s:snapshot(),l:_("Mở bản vẽ","Open drawing")};applyModuleUI(false)}
}
function applyModuleUI(fit){
 const d=dgOn();document.body.classList.toggle("dgmode",d);
 $("modPfd").classList.toggle("active",!d);$("modDgm").classList.toggle("active",d);
 $("modPfd").setAttribute("aria-pressed",!d);$("modDgm").setAttribute("aria-pressed",d);
 $("appName").textContent=d?_("Sơ đồ","Diagram"):"PFD Studio";
 $("appSub").textContent=d?_("Rev.7 • Sơ đồ tổ chức, lưu đồ, sơ đồ khối • copy sang Word / PowerPoint","Rev.7 • Org charts, flowcharts, block diagrams • copy to Word / PowerPoint"):_("Rev.7 • Vẽ Process Flow Diagram dầu khí • 1 file, không cần cài đặt","Rev.7 • Oil & gas Process Flow Diagram • single file, no install");
 board.setAttribute("aria-label",d?_("Bản vẽ sơ đồ","Diagram canvas"):_("Bản vẽ PFD","PFD drawing"));
 tool="select";
 syncMetaUI();renderAll();
 if(d&&typeof dgSync==="function")dgSync();
 if(fit)fitView();
}
function modBoot(){
 try{
  const raw=localStorage.getItem(KEYD);
  if(raw){const d=JSON.parse(raw),st=normalizeState(d.state||d);
   if(st.meta.doc==="dgm"){STORE.dgm={state:st,view:{x:30,y:30,k:.6},hist:[],fut:[],cur:{s:JSON.stringify({meta:st.meta,nodes:st.nodes,edges:st.edges,shapes:st.shapes,nextId:st.nextId,nextStream:st.nextStream,dg:st.dg}),l:_("Khôi phục","Restored")},sel:new Set()}}}
 }catch(e){}
 try{const p=JSON.parse(localStorage.getItem(PKEY)||"null");if(p&&p.mod==="dgm")setModule("dgm")}catch(e){}
}
