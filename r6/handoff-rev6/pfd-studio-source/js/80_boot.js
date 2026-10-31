/* ============ ĐƠN VỊ SI / US ============ */
function setUnitDefault(role,u){state.meta.unitsDef[role]=u;commit(_("Đổi đơn vị mặc định","Change default unit"));renderUnitDefaults();renderProps()}
function resetUnitDefaults(){state.meta.unitsDef=unitPreset(state.meta.units);commit(_("Đặt lại đơn vị mặc định","Reset default units"));renderUnitDefaults();renderProps()}
function renderUnitDefaults(){
 const box=$("st_udef");if(!box)return;
 box.innerHTML=`<div class="udgrid">`+QTY.map(q=>{const cur=defUnit(q.id),opts=q.opts.includes(cur)?q.opts:[cur].concat(q.opts);return`<label for="ud_${q.id}">${esc(_(q.vi,q.en))}</label><select id="ud_${q.id}" data-udef="${q.id}">${opts.map(u=>`<option value="${esc(u)}"${u===cur?" selected":""}>${esc(u)}</option>`).join("")}</select>`}).join("")+`</div>`;
 box.querySelectorAll("[data-udef]").forEach(s=>s.addEventListener("change",()=>setUnitDefault(s.dataset.udef,s.value)));
}
function setUnits(u){
 if(u!==state.meta.units){
  const sys=u==="US"?"US":"SI";
  state.meta.unitsDef=unitPreset(sys);
  state.nodes.forEach(n=>{n.props=convertSystem(n.props,sys);if(n.type==="text"||n.type==="area")n.title=convertSystem(n.title,sys)});
  state.edges.forEach(e=>{e.P=convertSystem(e.P,sys);e.T=convertSystem(e.T,sys);e.flow=convertSystem(e.flow,sys);e.dist=convertSystem(e.dist,sys)});
  state.meta.units=u;commit(_(`Đổi sang hệ đơn vị ${u}`,`Switch to ${u} units`));
 }
 syncMetaUI();renderAll();syncSettingsUI();
 setStatus(_(`Hệ đơn vị: ${u==="US"?"US (psi, °F, ft, bbl…)":"SI (bar, °C, m, m³…)"}. Các giá trị đã được quy đổi gần đúng — hãy kiểm tra lại số liệu quan trọng.`,`Unit system: ${u==="US"?"US (psi, °F, ft, bbl…)":"SI (bar, °C, m, m³…)"}. Values were converted approximately — please re-check critical data.`));
}
/* ============ THEME · NGÔN NGỮ · TUỲ CHỌN ============ */
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({hc:HC,ui:UI,tips:TIPS,theme:THEME,darkPaper:DARKPAPER,lang:LANG,ports:SHOWPORTS,units:(state.meta.doc==="cad"&&STORE.pfd?STORE.pfd.state:state).meta.units,mod:state.meta.doc}))}catch(e){}}
function applyTheme(){
 try{SYSDARK=!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){SYSDARK=false}
 const dark=isDark();document.documentElement.setAttribute("data-theme",dark?"dark":"light");
 applyScheme();
 document.documentElement.style.setProperty("--palbg",SCH.paper);
 const b=$("themeBtn");if(b)b.textContent=THEME==="dark"?"🌙":THEME==="light"?"☀":"🌓";
}
function setTheme(t){THEME=t;savePrefs();applyTheme();renderPalette();renderAll();syncSettingsUI()}
function cycleTheme(){setTheme(THEME==="auto"?"light":THEME==="light"?"dark":"auto");setStatus(_("Giao diện: ","Theme: ")+({auto:_("tự động theo hệ thống","auto (system)"),light:_("sáng","light"),dark:_("tối","dark")})[THEME])}
function setDarkPaper(v){DARKPAPER=!!v;savePrefs();applyTheme();renderPalette();renderAll()}
function setUI(d){UI=Math.round(Math.min(1.8,Math.max(.8,UI+d))*10)/10;document.documentElement.style.setProperty("--ui",UI);savePrefs();setStatus(_("Cỡ chữ giao diện: ","UI text size: ")+Math.round(UI*100)+"%.")}
function toggleHC(){HC=!HC;document.body.classList.toggle("hc",HC);$("hcBtn").classList.toggle("active",HC);updateRS();renderPalette();renderAll();savePrefs();syncSettingsUI();setStatus(HC?_("Đã bật tương phản cao.","High contrast on."):_("Đã tắt tương phản cao.","High contrast off."))}
function toggleSide(s){$(s==="left"?"asideL":"asideR").classList.toggle("hidden");setTimeout(fitView,50)}
function toggleShowPorts(v){SHOWPORTS=v===undefined?!SHOWPORTS:!!v;savePrefs();updateToolUI();syncSettingsUI()}
function setLang(l){
 LANG=l==="en"?"en":"vi";document.documentElement.lang=LANG;savePrefs();
 fillStaticSelects();syncMetaUI();translateAll();renderPalette();renderAll();syncSettingsUI();if($("help").classList.contains("open"))renderHelp();
 setStatus(LANG==="en"?"Language: English.":"Ngôn ngữ: Tiếng Việt.");
}
function toggleLang(){setLang(LANG==="vi"?"en":"vi")}
function syncSettingsUI(){
 renderUnitDefaults();
 const set=(id,v)=>{const e=$(id);if(e){if(e.type==="checkbox")e.checked=!!v;else e.value=v}};
 set("st_theme",THEME);set("st_dark",DARKPAPER);set("st_lang",LANG);set("st_units",state.meta.units);set("st_hc",HC);set("st_tips",TIPS);set("st_ports",SHOWPORTS);set("optTips",TIPS);
 const lb=$("langBtn");if(lb)lb.textContent=LANG==="vi"?"VI":"EN";
 const ub=$("unitBtn");if(ub)ub.textContent=state.meta.units;
 if($("hcBtn"))$("hcBtn").classList.toggle("active",HC);
}
function openSettings(){syncSettingsUI();openModal("mSettings")}

/* ============ DỊCH GIAO DIỆN (VI → EN) ============ */
function trString(s){
 const m=/^([^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u.exec(s);
 if(!m||!m[2])return s;
 const key=m[2],en=EN[key];
 return en!==undefined?m[1]+en+m[3]:s;
}
const TR_ATTRS=["title","placeholder","aria-label"];
function trSkip(n){const p=n.nodeType===3?n.parentNode:n;return!p||(p.closest&&p.closest("svg,.nt,script,style,#printRoot,#ppView"))||(n.nodeType===3&&p.tagName==="TEXTAREA")}
function trText(node){
 if(node.__vi===undefined)node.__vi=node.data;
 else if(node.data!==node.__en&&node.data!==node.__vi)node.__vi=node.data;
 const target=LANG==="en"?trString(node.__vi):node.__vi;
 if(node.data!==target)node.data=target;
 node.__en=target;
}
function trEl(el){
 if(el.nodeType!==1||el.closest&&el.closest("svg,.nt,#printRoot,#ppView"))return;
 TR_ATTRS.forEach(a=>{
  if(!el.hasAttribute(a))return;const k="__vi_"+a,cur=el.getAttribute(a);
  if(el[k]===undefined||(cur!==el[k+"_en"]&&cur!==el[k]))el[k]=cur;
  const t=LANG==="en"?trString(el[k]):el[k];if(cur!==t)el.setAttribute(a,t);el[k+"_en"]=t;
 });
}
function trWalk(root){
 if(!root||trSkip(root))return;
 if(root.nodeType===3){trText(root);return}
 if(root.nodeType!==1)return;
 trEl(root);
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>trSkip(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 let n;while(n=w.nextNode()){n.nodeType===3?trText(n):trEl(n)}
}
let trBusy=false;
function translateAll(){
 trBusy=true;
 try{trWalk(document.body);document.title=LANG==="en"?"PFD Studio Rev.6 — Oil & Gas Process Flow Diagrams":"PFD Studio Rev.6 — Vẽ Process Flow Diagram Dầu Khí"}finally{trBusy=false}
}
new MutationObserver(muts=>{
 if(trBusy)return;trBusy=true;
 try{muts.forEach(m=>{
  if(m.type==="characterData"){if(m.target.__en!==m.target.data)trWalk(m.target)}
  else m.addedNodes.forEach(n=>trWalk(n));
 })}finally{trBusy=false}
}).observe(document.body,{childList:true,subtree:true,characterData:true});

/* ============ BẢN VẼ MỚI & MẪU ============ */
function newDrawing(){const keep=state.meta;state=newState();state.meta={...keep,project:"",revs:[],fonts:keep.fonts};sel=new Set();selEdge=null;commit(_("Bản vẽ mới","New drawing"));syncMetaUI();renderAll();fitView();setStatus(_("Đã tạo bản vẽ trống (Ctrl+Z để quay lại).","Blank drawing created (Ctrl+Z to go back)."))}
function trTemplate(){
 const tl=l=>{if(EN[l]!==undefined)return EN[l];const i=l.indexOf(":");if(i>0){const k=l.slice(0,i),v=l.slice(i+1).trim();const a=EN[k]!==undefined?EN[k]:k,b=EN[v]!==undefined?EN[v]:v;return a+": "+b}return l};
 const t=s=>s?String(s).split("\n").map(tl).join("\n"):s;
 state.nodes.forEach(n=>{n.title=t(n.title);n.props=t(n.props);if(n.note)n.note=t(n.note)});
 state.edges.forEach(e=>{e.service=t(e.service);e.flow=t(e.flow);e.dist=t(e.dist);if(e.note)e.note=t(e.note)});
 state.meta.project=t(state.meta.project);
}
function loadTemplate(name){
 const keep=state.meta;state=newState();state.meta={...keep,revs:[]};sel=new Set();selEdge=null;
 const add=(t,x,y,tag,title,props,v)=>mkNode(t,x,y,tag,title,props||"",v).id;
 const link=(a,ap,b,bp,o)=>{o=o||{};const e=newEdge(a,ap,b,bp,o.kind||"process");Object.assign(e,{phase:o.phase||"",service:o.svc||"",P:o.P||"",T:o.T||"",flow:o.flow||"",dist:o.dist||"",std:o.std||"",nps:o.nps||"",sch:o.sch||"",mat:o.mat||"",cls:o.cls||""});state.edges.push(e)};
 if(name==="gas"){
  const f=add("feed",140,300,"","FEED GAS"),s1=add("v_sep",320,300,"V-101","Inlet Separator","Áp suất thiết kế: 100 barg\nNhiệt độ vận hành: 30 °C"),k=add("compressor",520,300,"K-101","Gas Compressor","85 → 120 barg"),e1=add("aircooler",720,300,"E-101","Aftercooler","120 barg, 45 °C"),s2=add("v_sep",920,300,"V-102","Suction Scrubber"),t=add("column",1120,300,"T-101","TEG Contactor","Khí khô: dew point ≤ -10 °C"),p=add("product",1340,300,"","DRY GAS EXPORT"),pump=add("pd_pump",960,520,"P-101","TEG Pump");
  const g={std:"b3610",nps:"12",sch:"40",mat:"cs_a106b",cls:"600#"};
  link(f,"e",s1,"w",{svc:"Khí ướt",phase:"gas",P:"85 barg",T:"30 °C",...g});link(s1,"e",k,"w",{svc:"Khí",phase:"gas",std:"b3610",nps:"10",sch:"40",mat:"cs_a106b"});link(k,"e",e1,"w",{svc:"Khí nóng",phase:"gas",P:"120 barg",...g});link(e1,"e",s2,"w",{phase:"gas",T:"45 °C",...g});link(s2,"e",t,"w",{svc:"Khí",phase:"gas",...g});link(t,"e",p,"w",{svc:"Khí khô",phase:"gas",...g});link(t,"s",pump,"e",{svc:"TEG giàu",phase:"oil",std:"b3619",nps:"2",sch:"40S",mat:"ss316"});
  state.meta.project="Nén khí + làm khô TEG";
 }else if(name==="crude"){
  const f=add("feed",140,300,"","WELL FLUID"),h=add("heater",330,300,"H-101","Crude Heater","65 °C"),s=add("sep3",540,300,"V-101","3-Phase Separator","15 barg, 65 °C"),e1=add("exchanger",760,300,"E-101","Crude/Crude Exchanger"),col=add("column",980,300,"T-101","Stabilizer Column"),p=add("product",1220,300,"","OVERHEAD GAS"),tk=add("tank",980,560,"TK-101","Crude Storage"),wp=add("product",620,500,"","PRODUCED WATER");
  link(f,"e",h,"w",{svc:"Dầu ướt",phase:"mix",std:"b3610",nps:"8",sch:"40",mat:"cs_a106b"});link(h,"e",s,"w",{phase:"mix",T:"65 °C"});link(s,"e",e1,"w",{svc:"Dầu",phase:"oil"});link(e1,"e",col,"w",{phase:"oil"});link(col,"e",p,"w",{svc:"Khí overhead",phase:"gas"});link(col,"s",tk,"n",{svc:"Dầu ổn định",phase:"oil"});link(s,"s",wp,"w",{svc:"Nước",phase:"water"});
  state.meta.project="Ổn định dầu thô (stabilizer)";
 }else if(name==="sep"){
  const f=add("feed",140,330,"","WELL FLUID"),h=add("heater",330,330,"H-101","Inlet Heater","60 °C"),s=add("sep3",540,330,"V-101","3-Phase Separator","30 barg, 60 °C"),pcv=add("valve_control",760,220,"PCV-101","Pressure Control"),pic=add("instrument",760,120,"PIC-101","Pressure Ctrl"),k=add("compressor",950,220,"K-101","Gas Compressor","30 → 90 barg"),gp=add("product",1160,220,"","GAS EXPORT"),pump=add("pump",780,330,"P-101A","Oil Export Pump","15 m³/h, 90 barg"),op=add("product",980,330,"","OIL EXPORT"),wp=add("product",780,480,"","PRODUCED WATER");
  link(f,"e",h,"w",{svc:"Hỗn hợp giếng",phase:"mix",P:"30 barg",T:"40 °C"});link(h,"e",s,"w",{phase:"mix",T:"60 °C"});link(s,"n",pcv,"w",{svc:"Khí",phase:"gas",P:"30 barg"});link(pcv,"e",k,"w",{phase:"gas"});link(pic,"s",pcv,"n",{kind:"signal"});link(k,"e",gp,"w",{svc:"Khí xuất",phase:"gas",P:"90 barg"});link(s,"e",pump,"w",{svc:"Dầu",phase:"oil"});link(pump,"e",op,"w",{svc:"Dầu xuất",phase:"oil",P:"90 barg",flow:"15 m³/h"});link(s,"s",wp,"w",{svc:"Nước sản xuất",phase:"water"});
  state.meta.project="Cụm tách 3 pha + bơm dầu + nén khí";
 }else if(name==="turbo"){
  const st=add("steam_turbine",420,320,"ST-101","Steam Turbine (HP/LP)","HP 40 barg → LP 4 barg",5),k=add("compressor2",880,320,"K-201","2-Stage Gas Compressor","20 → 80 barg",0),hp=add("feed",140,230,"","HP STEAM"),lp=add("product",420,560,"","LP STEAM"),f=add("feed",880,590,"","SUCTION GAS"),o=add("product",1280,320,"","DISCHARGE GAS");
  link(hp,"e",st,"hp",{svc:"Hơi HP",phase:"water",P:"40 barg",T:"400 °C"});link(st,"lp",lp,"n",{svc:"Hơi LP",phase:"water",P:"4 barg"});link(st,"shR",k,"shL",{kind:"shaft",svc:"Trục"});link(f,"n",k,"s",{svc:"Khí hút",phase:"gas",P:"20 barg"});link(k,"e",o,"w",{svc:"Khí nén",phase:"gas",P:"80 barg"});
  state.meta.project="Máy nén 2 cấp dẫn động bằng turbine hơi";
 }else if(name==="chain"){
  const pf=add("platform",140,260,"PF-101","Giàn khai thác","Công suất: 8 MMscfd",3),gp=add("gas_plant",520,260,"GP-101","Nhà máy xử lý khí","Công suất: 5 MMSm³/d"),cs=add("comp_station",900,260,"CS-101","Trạm nén khí"),pr=add("city_gate",1280,260,"PRS-101","Trạm điều áp / đo đếm"),pp=add("power_plant",1280,520,"PP-101","Nhà máy điện khí"),tk=add("lng_tank",520,520,"TK-101","Bồn LNG","Thể tích: 160 000 m³"),sh=add("ship",900,640,"SH-101","Tàu LNG"),rg=add("regas",1280,720,"RV-101","Hóa khí LNG");
  link(pf,"e",gp,"w",{svc:"Khí ướt",phase:"gas",dist:"120 km",std:"b3610",nps:"16",sch:"40",mat:"api5l_x65",cls:"900#"});link(gp,"e",cs,"w",{svc:"Khí thương phẩm",phase:"gas",P:"70 barg",std:"b3610",nps:"24",sch:"STD",mat:"api5l_x65"});link(cs,"e",pr,"w",{svc:"Khí cao áp",phase:"gas",dist:"180 km",std:"b3610",nps:"24",sch:"STD",mat:"api5l_x65"});link(pr,"s",pp,"n",{svc:"Khí cấp điện",phase:"gas",P:"30 barg"});link(gp,"s",tk,"n",{svc:"LNG",phase:"oil",T:"-162 °C"});link(tk,"e",sh,"w",{kind:"sea",svc:"LNG",flow:"3.4 MTPA",dist:"2 500 km"});link(sh,"e",rg,"w",{kind:"sea",svc:"LNG",dist:"≈ 5 ngày"});
  state.meta.project="Chuỗi cung ứng khí: giàn → nhà máy → nén → tiêu thụ / LNG";
 }
 if(LANG==="en")trTemplate();
 try{state=normalizeState(JSON.parse(snapshot()))}catch(e){}
 commit(_("Nạp mẫu ","Load template ")+name);syncMetaUI();renderAll();fitView();setStatus(name==="blank"?_("Bản vẽ trống.","Blank drawing."):_("Đã nạp mẫu — sửa tag, kéo thiết bị, nối thêm ống. Ctrl+Z để quay lại bản trước.","Template loaded — edit tags, drag devices, connect more pipes. Ctrl+Z to go back."));
}

/* ============ KHỞI ĐỘNG ============ */
(function boot(){
 try{const p=JSON.parse(localStorage.getItem(PKEY)||localStorage.getItem("pfdstudio.rev4.prefs")||localStorage.getItem("pfdstudio.rev3.prefs")||"null");
  if(p){if(p.tips===false)TIPS=false;if(p.ui){UI=p.ui;document.documentElement.style.setProperty("--ui",UI)}if(p.hc){HC=true;document.body.classList.add("hc")}
   if(["auto","light","dark"].includes(p.theme))THEME=p.theme;if(p.darkPaper===false)DARKPAPER=false;if(p.lang==="en")LANG="en";if(p.ports)SHOWPORTS=true;
   if(p.units==="US")state.meta.units="US";}
 }catch(e){}
 document.documentElement.lang=LANG;
 try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(THEME==="auto"){applyTheme();renderPalette();renderAll()}})}catch(e){}
 applyTheme();fillStaticSelects();renderPalette();syncMetaUI();syncSettingsUI();
 let ok=false;
 try{const s=localStorage.getItem(KEY)||localStorage.getItem("pfdstudio.rev4.autosave")||localStorage.getItem("pfdstudio.rev3.autosave")||localStorage.getItem("pfdstudio.rev2.autosave");if(s){loadData(JSON.parse(s),true);ok=state.nodes.length>0||state.edges.length>0;if(ok)setStatus(_("Đã khôi phục bản vẽ tự lưu lần trước. Dùng Mới / Mẫu nếu muốn bắt đầu lại.","Restored your last auto-saved drawing. Use New / Templates to start over."))}}catch(e){ok=false}
 if(!ok){loadTemplate("sep");resetHistory(_("Mẫu ban đầu","Initial template"))}
 updateHistUI();translateAll();
 cadBoot();
 vecBoot();
 document.querySelectorAll("[data-cad]").forEach(e=>e.addEventListener("change",()=>cadSetting(e.dataset.cad,e.value,e)));
})();
