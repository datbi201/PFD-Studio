/* ============ BẢNG THUỘC TÍNH ============ */
function bindIn(id,fn,label){const e=$(id);if(!e)return;e.addEventListener("input",()=>{fn(e.value);renderCanvasOnly()});e.addEventListener("change",()=>{if(label)pendLabel=label;commit()})}
function bindChk(id,fn,label,full){const e=$(id);if(!e)return;e.addEventListener("change",()=>{fn(e.checked);commit(label);full?renderAll():renderCanvasOnly()})}
function bindSel(id,fn,label,full){const e=$(id);if(!e)return;e.addEventListener("change",()=>{fn(e.value);commit(label);full?renderAll():renderCanvasOnly()})}
const optList=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(cur)===String(v)?" selected":""}>${esc(l)}</option>`).join("");
const fontOpts=(cur,withDefault)=>(withDefault?`<option value=""${!cur?" selected":""}>${_("— theo cài đặt chung —","— global setting —")}</option>`:"")+FONT_LIST.map(f=>`<option value="${esc(f[0])}"${cur===f[0]?" selected":""} style="font-family:${esc(f[1])}">${esc(T_(f[0]))}</option>`).join("");
const PARAM_QUICK=["Áp suất thiết kế","Nhiệt độ thiết kế","Áp suất vận hành","Nhiệt độ vận hành","Công suất","Lưu lượng","Thể tích","Đường kính × chiều cao","Vật liệu","Diện tích truyền nhiệt","Cột áp","Tốc độ quay","Điện áp","Tỷ số nén","Khối lượng"];
function unitSel(id,txt,role){
 const cur=unitOfText(txt),opts=QTY_BY[role].opts.slice();if(cur&&!opts.includes(cur))opts.unshift(cur);
 return`<select id="${id}" class="usel" aria-label="${_("Đổi đơn vị","Change unit")}"><option value=""${cur?"":" selected"}>${cur?"":_("đơn vị","unit")}</option>`+opts.map(u=>`<option value="${esc(u)}"${u===cur?" selected":""}>${esc(u)}</option>`).join("")+"</select>";
}
function defaultWall(z){
 if(!z||!z.walls.length)return"";const has=(k)=>z.walls.find(w=>w.k===k||(w.a||[]).includes(k));
 const w=has("STD")||has("40")||has("40S")||has("Type L")||has("SDR 17")||z.walls[Math.floor(z.walls.length/2)];return w.k;
}
function flowRole(e){return e.phase==="gas"?"gasFlow":(e.phase==="oil"?"liquidRate":"liquidFlow")}
function portUsed(n,pid){return state.edges.some(e=>(e.from===n.id&&e.fromPort===pid)||(e.to===n.id&&e.toPort===pid))}
function hideUnusedPorts(list){list.forEach(n=>{if(n.type==="text"||n.type==="area"||!SYMBOLS[n.type])return;const hp=varOf(n).def.ports.filter(p=>!portUsed(n,p.id)).map(p=>p.id);if(hp.length>=varOf(n).def.ports.length)hp.pop();if(hp.length)n.hp=hp;else delete n.hp})}
function tidyAllPorts(hide){const l=state.nodes;if(hide)hideUnusedPorts(l);else l.forEach(n=>delete n.hp);commit(hide?_("Ẩn điểm nối chưa dùng","Hide unused ports"):_("Hiện lại điểm nối","Show ports"));renderAll()}
function titlesSel(hide){selNodes().forEach(n=>{if(hide)n.ht=true;else delete n.ht});commit(hide?_("Ẩn tên thiết bị","Hide equipment names"):_("Hiện tên thiết bị","Show equipment names"));renderAll()}
function renderProps(){
 /* Rev.6 — module Vector có panel thuộc tính riêng (không đụng panel PFD/SimCAD) */
 if(typeof vecOn==="function"&&vecOn())return vecRenderProps();
 const box=$("props");
 const nSel=selNodes(),hSel=selShapes();
 if(sel.size>1){
  const hasN=nSel.length>1;
  box.innerHTML=`<h3 class="ph">${_(`Đã chọn ${sel.size} đối tượng`,`${sel.size} objects selected`)}</h3>
  ${hasN?`<div class="hint">${_("Căn thẳng hàng (chỉ đổi 1 toạ độ, giữ nguyên toạ độ còn lại):","Align (changes only one coordinate, keeps the other):")}</div>
  <div class="grid2"><button class="btn" onclick="alignSel('left')" title="${_("Cạnh trái cùng X","Left edges to same X")}">⇤ ${_("Căn trái","Align left")}</button><button class="btn" onclick="alignSel('right')">${_("Căn phải","Align right")} ⇥</button><button class="btn" onclick="alignSel('center')" title="${_("Tất cả cùng X (xếp thành 1 cột dọc)","All same X (stack in a column)")}">↔ ${_("Cùng X (cột dọc)","Same X (column)")}</button><button class="btn" onclick="alignSel('top')">⤒ ${_("Căn trên","Align top")}</button><button class="btn" onclick="alignSel('bottom')">⤓ ${_("Căn dưới","Align bottom")}</button><button class="btn" onclick="alignSel('middle')" title="${_("Tất cả cùng Y (xếp thành 1 hàng ngang)","All same Y (line up in a row)")}">↕ ${_("Cùng Y (hàng ngang)","Same Y (row)")}</button><button class="btn" onclick="alignSel('dh')" title="${_("Giãn đều khoảng hở giữa các thiết bị theo chiều ngang","Equal gaps horizontally")}">⇔ ${_("Chia đều ngang","Distribute H")}</button><button class="btn" onclick="alignSel('dv')">⇕ ${_("Chia đều dọc","Distribute V")}</button></div>`:""}
  ${layoutButtons()}
  <div class="grid2"><button class="btn primary" onclick="fitToSheet()">⤢ ${_("Vừa khổ giấy","Fit to sheet")}</button><button class="btn" onclick="cycleVariant()">🔁 ${_("Đổi kiểu vẽ","Change style")}</button><button class="btn" onclick="scaleSel(1.1)">＋10%</button><button class="btn" onclick="scaleSel(0.9)">－10%</button></div>
  ${hasN?`<div class="grid2"><button class="btn" onclick="titlesSel(true)">🙈 ${_("Ẩn tên (chỉ tag)","Hide names (tag only)")}</button><button class="btn" onclick="titlesSel(false)">👁 ${_("Hiện tên","Show names")}</button><button class="btn" onclick="hideUnusedPorts(selNodes());commit(_('Ẩn điểm nối chưa dùng','Hide unused ports'));renderAll()">⚪ ${_("Ẩn điểm nối chưa dùng","Hide unused ports")}</button><button class="btn" onclick="selNodes().forEach(n=>delete n.hp);commit(_('Hiện lại điểm nối','Show ports'));renderAll()">⚫ ${_("Hiện lại điểm nối","Show ports")}</button></div>`:""}
  <div class="grid2"><button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div>
  <p class="hint">${_("Mẹo: nếu thiết bị bị dồn vào nhau, bấm “Tránh chồng lấn” hoặc “Giãn khoảng cách”. Ctrl+Z hoàn tác bất kỳ bước nào.","Tip: if devices collapse together, press “Remove overlaps” or “Spread”. Ctrl+Z undoes any step.")}</p>`;
  const ov=overlapPairs(nSel);
  if(ov)box.insertAdjacentHTML("afterbegin",`<div class="warnbox">⚠ ${_(`${ov} cặp thiết bị đang chồng lên nhau. Bấm “Tránh chồng lấn”.`,`${ov} pair(s) of devices overlap. Press “Remove overlaps”.`)}</div>`);
  return;
 }
 if(hSel.length===1){renderShapeProps(hSel[0]);return}
 if(nSel.length===1){renderNodeProps(nSel[0]);return}
 const e=state.edges.find(x=>x.id===selEdge);
 if(e){renderEdgeProps(e);return}
 if(cadOn()){renderCadProps();return}
 if(SHAPE_TOOLS.includes(tool)){renderPenProps();return}
 box.innerHTML=`<p class="hint">${_("Chưa chọn đối tượng nào.","Nothing selected.")}<br><br>• ${_("Bấm thiết bị ở thư viện để thêm","Click equipment in the library to add it")}<br>• ${_("Kéo chấm xanh để nối ống","Drag the blue dots to connect pipes")}<br>• ${_("Phím P: thêm điểm nối ống tuỳ ý cho thiết bị","Key P: add custom pipe connection points to a device")}<br>• ${_("Phím L / A / B / O / Y / D: vẽ đường, mũi tên, hộp, elip, đa tuyến, bút tự do","Keys L / A / B / O / Y / D: line, arrow, box, ellipse, polyline, freehand pen")}<br>• ${_("Kéo khung trên nền trống để chọn nhiều","Drag on empty background to select many")}<br>• ${_("Bấm đường ống để sửa dòng, size, schedule, vật liệu","Click a line to edit stream, size, schedule, material")}<br>• ${_("Nút ? Hướng dẫn có đủ phím tắt","The ? Help button lists all shortcuts")}</p>${layoutButtons(true)}`;
}
function layoutButtons(all){
 return`<div class="hint" style="margin-top:.5rem">${all?_("Bố trí cho toàn bản vẽ:","Layout for the whole drawing:"):_("Bố trí (áp dụng cho phần đang chọn):","Layout (applies to the selection):")}</div>
 <div class="grid2"><button class="btn" onclick="autoLayout()" title="${_("Sắp xếp tự động từ trái sang phải theo dòng chảy","Auto-arrange left to right following the flow")}">🧭 ${_("Tự bố trí theo dòng","Auto layout")}</button><button class="btn" onclick="deOverlap()" title="${_("Đẩy các thiết bị đang chồng lên nhau ra xa","Push overlapping devices apart")}">🧲 ${_("Tránh chồng lấn","Remove overlaps")}</button><button class="btn" onclick="spreadSel(1.2)" title="${_("Tăng khoảng cách giữa các thiết bị, giữ cỡ ký hiệu","Increase spacing, keep symbol size")}">↔ ${_("Giãn khoảng cách","Spread")} +20%</button><button class="btn" onclick="spreadSel(0.85)">⇥⇤ ${_("Co khoảng cách","Tighten")} −15%</button><button class="btn" onclick="centerOnPage()">⊕ ${_("Đặt giữa trang","Center on page")}</button><button class="btn" onclick="openHist()">🕘 ${_("Lịch sử thao tác","History")}</button>${all?`<button class="btn" onclick="tidyAllPorts(true)">⚪ ${_("Ẩn điểm nối chưa dùng (cả bản vẽ)","Hide unused ports (all)")}</button><button class="btn" onclick="tidyAllPorts(false)">⚫ ${_("Hiện lại mọi điểm nối","Show all ports")}</button>`:""}</div>`;
}

/* --- thiết bị --- */
function renderNodeProps(n){
 const box=$("props"),T=n.type,isText=T==="text",isArea=T==="area",sy=SYMBOLS[T];
 let h=`<h3 class="ph">${esc(T_(sy.label))}</h3>`;
 if(!isText&&!isArea)h+=`<label for="pTag">${_("Tag (số hiệu) — F2","Tag (number) — F2")}</label><input id="pTag" value="${esc(n.tag)}">`;
 h+=isText?`<label for="pTitle">${_("Nội dung chữ (xuống dòng được)","Text (line breaks allowed)")}</label><textarea id="pTitle" rows="4">${esc(n.title)}</textarea>`:`<label for="pTitle">${_("Tên / Mô tả","Name / description")}</label><input id="pTitle" value="${esc(n.title)}">`;
 if(!isText&&!isArea&&sy.vars.length>1)h+=`<label for="pVar">${_("Kiểu vẽ (phím Q để đổi nhanh)","Drawing style (Q to cycle)")}</label><select id="pVar">${sy.vars.map((v,i)=>`<option value="${i}"${(n.v||0)===i?" selected":""}>${esc(T_(v.n))}</option>`).join("")}</select>`;
 if(isText){
  const st=textStyle(n),b=fontCfg("note");
  h+=`<div class="sect">${_("Định dạng chữ","Text format")}</div>
  <label for="pFF">${_("Font chữ","Font family")}</label><select id="pFF">${fontOpts(n.ff||"",true)}</select>
  <div class="row"><div><label for="pFZ">${_("Cỡ chữ (pt)","Size (pt)")}</label><input id="pFZ" type="number" min="3" max="80" step="0.5" value="${n.fz||""}" placeholder="${b.s}"></div><div><label for="pAl">${_("Căn lề","Align")}</label><select id="pAl">${optList([["l",_("Trái","Left")],["c",_("Giữa","Center")],["r",_("Phải","Right")]],n.al||"c")}</select></div></div>
  <div class="row"><label class="chk"><input type="checkbox" id="pB"${n.b!==false?" checked":""}>${_("Đậm","Bold")}</label><label class="chk"><input type="checkbox" id="pI"${n.i?" checked":""}>${_("Nghiêng","Italic")}</label><label class="chk"><input type="checkbox" id="pBd"${n.bd?" checked":""}>${_("Viền","Border")}</label></div>
  <div class="row"><div><label for="pCol">${_("Màu chữ","Text colour")}</label><input id="pCol" type="color" value="${esc(n.col||INK)}"></div><div><label for="pBg">${_("Màu nền","Background")}</label><input id="pBg" type="color" value="${esc(n.bg||"#ffffff")}"></div></div>
  <div class="row"><label class="chk"><input type="checkbox" id="pBgOn"${n.bg?" checked":""}>${_("Tô nền","Fill background")}</label><button class="btn" id="pColReset" style="flex:0 0 auto">${_("Màu chữ mặc định","Default text colour")}</button></div>`;
 }
 if(!isText&&!isArea&&!sy.nolabel){
  h+=`<div class="row"><div><label for="pLp">${_("Vị trí nhãn","Label position")}</label><select id="pLp">${optList([["b",_("Phía dưới","Below")],["t",_("Phía trên","Above")],["r",_("Bên phải","Right")],["l",_("Bên trái","Left")]],n.lp||"b")}</select></div><div><label for="pLs">${_("Cỡ nhãn","Label size")}: <span id="pLsV">${(n.ls||1).toFixed(1)}×</span></label><input id="pLs" type="range" min="0.5" max="3" step="0.1" value="${n.ls||1}"></div></div>
  <label class="chk"><input type="checkbox" id="pHt"${n.ht?" checked":""}>${_("Ẩn tên / mô tả (chỉ hiện tag) — không xoá nội dung","Hide name / description (show tag only) — text is kept")}</label>`;
 }
 if(!isText&&!isArea){
  h+=`<label for="pProps">${_("Thông số thiết bị (mỗi dòng một thông số)","Equipment parameters (one per line)")}</label><textarea id="pProps" rows="4" placeholder="${_("VD: Áp suất thiết kế: 100 barg\nCông suất: 2.5 MW","e.g. Design pressure: 100 barg\nPower: 2.5 MW")}">${esc(n.props)}</textarea>
  <div class="row"><select id="pQuick" aria-label="${_("Thêm nhanh tên thông số","Quick-add parameter name")}"><option value="">${_("＋ Thêm nhanh tên thông số…","＋ Quick-add parameter name…")}</option>${PARAM_QUICK.map(p=>`<option value="${esc(p)}">${esc(T_(p))}</option>`).join("")}</select></div>`;
 }
 if(isArea)h+=`<div class="row"><div><label for="pW">${_("Rộng","Width")}</label><input id="pW" type="number" min="60" step="10" value="${n.w||420}"></div><div><label for="pH">${_("Cao","Height")}</label><input id="pH" type="number" min="60" step="10" value="${n.h||260}"></div></div>`;
 if(!isArea)h+=`<label for="pSc">${_("Kích thước ký hiệu","Symbol size")}: <span id="pScV">${(n.sc||1).toFixed(1)}×</span></label><input id="pSc" type="range" min="0.5" max="3" step="0.1" value="${n.sc||1}">`;
 if(!isText&&!isArea){
  const b0=varOf(n).def.ports,nb=b0.length-(n.hp||[]).length,DN={n:_("Trên","Top"),s:_("Dưới","Bottom"),e:_("Phải","Right"),w:_("Trái","Left")};
  h+=`<div class="sect">${_("Điểm nối ống","Pipe connection points")} <span class="hint">(${_(`có sẵn ${nb}/${b0.length}`,`${nb}/${b0.length} built-in`)}${(n.xp||[]).length?_(`, thêm ${n.xp.length}`,`, +${n.xp.length} custom`):""})</span></div>
  <div class="grid2"><button class="btn" data-addport="n">＋ ${_("Trên","Top")}</button><button class="btn" data-addport="s">＋ ${_("Dưới","Bottom")}</button><button class="btn" data-addport="w">＋ ${_("Trái","Left")}</button><button class="btn" data-addport="e">＋ ${_("Phải","Right")}</button></div>
  <div class="hint">${_("Hoặc bấm phím P rồi bấm đúng vị trí trên thiết bị. Giữ Alt và kéo chấm cam để dời điểm nối.","Or press P and click the exact spot on the device. Hold Alt and drag an orange dot to move a port.")}</div>
  <div class="hint" style="margin-top:.4rem">${_("Điểm nối có sẵn — bấm để ẩn / hiện (điểm đang có ống không ẩn được):","Built-in ports — click to hide / show (a port that has a pipe cannot be hidden):")}</div>
  <div class="chips">${b0.map(p=>{const hid=(n.hp||[]).includes(p.id),used=portUsed(n,p.id);return`<button class="chip${hid?" off":""}" data-hp="${esc(p.id)}"${used&&!hid?' disabled title="'+_("Đang có ống","Has a pipe")+'"':""}>${hid?"✕":"●"} ${esc(p.l||DN[p.d]||p.d)}</button>`}).join("")}</div>
  <div class="grid2"><button class="btn" data-hpall="hide">${_("Ẩn các điểm chưa nối","Hide unused ports")}</button><button class="btn" data-hpall="show"${(n.hp||[]).length?"":" disabled"}>${_("Hiện lại tất cả","Show all again")}</button></div>`;
  (n.xp||[]).forEach(p=>{h+=`<div class="portrow" data-pid="${esc(p.id)}"><div class="row"><input data-pf="l" value="${esc(p.l)}" placeholder="${_("Tên cổng","Port name")} (${esc(p.id)})" aria-label="${_("Tên cổng","Port name")}"><select data-pf="s" aria-label="${_("Cạnh","Side")}">${optList([["n",_("Trên","Top")],["s",_("Dưới","Bottom")],["w",_("Trái","Left")],["e",_("Phải","Right")]],p.s)}</select><button class="btn danger" data-delport="${esc(p.id)}" style="flex:0 0 auto" aria-label="${_("Xoá điểm nối","Delete port")}">✕</button></div><div class="row"><label class="mini">${_("Vị trí","Position")}<input data-pf="f" type="range" min="0" max="100" value="${Math.round(p.f*100)}"></label><label class="mini">${_("Nhô ra","Offset")}<input data-pf="o" type="number" step="2" value="${p.o||0}"></label></div></div>`});
 }
 h+=`<div class="grid2"><button class="btn" onclick="rotateSel()">↻ ${_("Xoay 90° (R)","Rotate 90° (R)")}</button>${isText||isArea?"":`<button class="btn" onclick="flipSel()">⇋ ${_("Lật (F)","Flip (F)")}</button>`}<button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div><p class="hint">${_("Vị trí","Position")} X ${Math.round(n.x)} • Y ${Math.round(n.y)} • ${_("Góc","Angle")} ${n.rot||0}°</p>`;
 box.innerHTML=h;
 bindIn("pTag",v=>n.tag=v,_("Sửa tag","Edit tag"));bindIn("pTitle",v=>n.title=v,_("Sửa tên / nội dung","Edit name / text"));if($("pProps"))$("pProps").addEventListener("change",()=>{const ta=$("pProps"),out=ta.value.split("\n").map(l=>{const m=/^(.+?):\s*(.*)$/.exec(l);if(!m)return l;const isDH=/đường kính.*chiều cao|diameter.*height/i.test(m[1]),role=isDH?"length":roleOfParam(m[1]);return role?m[1]+": "+autoUnit(m[2],role):l}).join("\n");if(out!==ta.value){ta.value=out;n.props=out}});
 bindIn("pProps",v=>n.props=v,_("Sửa thông số thiết bị","Edit parameters"));
 bindIn("pW",v=>n.w=Math.max(60,+v||60),_("Đổi kích thước khung","Resize frame"));bindIn("pH",v=>n.h=Math.max(60,+v||60),_("Đổi kích thước khung","Resize frame"));
 bindIn("pSc",v=>{n.sc=+v;$("pScV").textContent=(+v).toFixed(1)+"×"},_("Đổi cỡ ký hiệu","Change symbol size"));
 bindIn("pLs",v=>{n.ls=+v===1?undefined:+v;$("pLsV").textContent=(+v).toFixed(1)+"×"},_("Đổi cỡ nhãn","Change label size"));
 if($("pVar"))$("pVar").addEventListener("change",()=>{n.v=+$("pVar").value;commit(_("Đổi kiểu vẽ","Change style"));renderAll()});
 if($("pLp"))$("pLp").addEventListener("change",()=>{n.lp=$("pLp").value;commit(_("Đổi vị trí nhãn","Label position"));renderCanvasOnly()});
 if($("pQuick"))$("pQuick").addEventListener("change",()=>{const v=$("pQuick").value;if(!v)return;const ta=$("pProps");const role=roleOfParam(T_(v)),un=role?defUnit(role):"",isDH=/đường kính|diameter/i.test(T_(v))&&/×/.test(v),u2=isDH?defUnit("length"):un;ta.value=(ta.value&&!/\n$/.test(ta.value)?ta.value+"\n":ta.value)+T_(v)+": "+(u2?" "+u2:"");n.props=ta.value;$("pQuick").value="";ta.focus();const cp=ta.value.length-(u2?u2.length+1:0);ta.setSelectionRange(cp,cp);renderCanvasOnly();commitSoon(_("Thêm thông số","Add parameter"))});
 if(isText){
  bindSel("pFF",v=>{if(v)n.ff=v;else delete n.ff},_("Đổi font chữ","Change font"));
  bindIn("pFZ",v=>{if(+v>0)n.fz=Math.min(80,+v);else delete n.fz},_("Đổi cỡ chữ","Change text size"));
  bindSel("pAl",v=>{if(v==="c")delete n.al;else n.al=v},_("Căn lề chữ","Text align"));
  bindChk("pB",v=>{if(v)delete n.b;else n.b=false},_("Đậm / thường","Bold"));bindChk("pI",v=>{if(v)n.i=true;else delete n.i},_("Nghiêng","Italic"));bindChk("pBd",v=>{if(v)n.bd=true;else delete n.bd},_("Viền khung chữ","Text border"));
  bindIn("pCol",v=>{if(v.toLowerCase()===INK)delete n.col;else n.col=v},_("Đổi màu chữ","Text colour"));
  bindIn("pBg",v=>{if($("pBgOn").checked)n.bg=v},_("Đổi màu nền","Background colour"));bindChk("pBgOn",v=>{if(v)n.bg=$("pBg").value;else delete n.bg},_("Tô nền","Background"));
  $("pColReset").addEventListener("click",()=>{delete n.col;commit(_("Màu chữ mặc định","Default text colour"));renderAll()});
 }
 if($("pHt"))$("pHt").addEventListener("change",()=>{if($("pHt").checked)n.ht=true;else delete n.ht;commit(_("Ẩn / hiện tên thiết bị","Toggle equipment name"));renderCanvasOnly()});
 box.querySelectorAll("[data-hp]").forEach(b=>b.addEventListener("click",()=>{const id=b.dataset.hp;n.hp=n.hp||[];if(n.hp.includes(id))n.hp=n.hp.filter(x=>x!==id);else if(!portUsed(n,id))n.hp.push(id);if(!n.hp.length)delete n.hp;commit(_("Ẩn / hiện điểm nối có sẵn","Toggle built-in port"));renderAll()}));
 box.querySelectorAll("[data-hpall]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.hpall==="show")delete n.hp;else hideUnusedPorts([n]);commit(b.dataset.hpall==="show"?_("Hiện lại điểm nối","Show ports"):_("Ẩn điểm nối chưa dùng","Hide unused ports"));renderAll()}));
 box.querySelectorAll("[data-addport]").forEach(b=>b.addEventListener("click",()=>{const s=b.dataset.addport;addPortTo(n,s,freeFraction(n,s));commit(_("Thêm điểm nối","Add port"));renderAll()}));
 box.querySelectorAll("[data-delport]").forEach(b=>b.addEventListener("click",()=>{removePort(n,b.dataset.delport);commit(_("Xoá điểm nối","Delete port"));renderAll()}));
 box.querySelectorAll(".portrow").forEach(r=>{
  const p=(n.xp||[]).find(q=>q.id===r.dataset.pid);if(!p)return;
  r.querySelectorAll("[data-pf]").forEach(inp=>{
   const f=inp.dataset.pf;
   inp.addEventListener("input",()=>{if(f==="l")p.l=inp.value;else if(f==="s")p.s=inp.value;else if(f==="f")p.f=+inp.value/100;else if(f==="o")p.o=+inp.value||0;renderCanvasOnly()});
   inp.addEventListener("change",()=>{commit(_("Chỉnh điểm nối","Edit port"));if(f==="s")renderAll()});
  });
 });
}

/* --- đường ống --- */
function pipeSpecHTML(e){
 const U=state.meta.units;
 const stdOpts=`<option value="">${_("— nhập tay / không chỉ định —","— manual / unspecified —")}</option>`+pipeStdList().map(([k,n])=>`<option value="${k}"${e.std===k?" selected":""}>${esc(T_(n))}</option>`).join("");
 let h=`<div class="sect">${_("Quy cách ống: size · schedule · vật liệu","Pipe spec: size · schedule · material")}</div><label for="ePs">${_("Tiêu chuẩn kích thước","Dimension standard")}</label><select id="ePs">${stdOpts}</select>`;
 if(e.std&&e.std!=="custom"){
  const S=PIPE_STD[e.std],z=pipeSize(e.std,e.nps);
  h+=`<label for="ePn">${_("Kích thước (NPS / DN / OD)","Size (NPS / DN / OD)")}</label><select id="ePn"><option value="">${_("— chọn —","— select —")}</option>${S.sizes.map(s=>`<option value="${esc(s.k)}"${s.k===String(e.nps)?" selected":""}>${esc(pipeSizeLabel(e.std,s,U))}</option>`).join("")}</select>`;
  if(z)h+=`<label for="ePw">${_("Schedule / độ dày thành ống","Schedule / wall thickness")}</label><select id="ePw">${z.walls.map(w=>`<option value="${esc(w.k)}"${(w.k===e.sch||(w.a||[]).includes(e.sch))?" selected":""}>${esc(pipeWallLabel(w,U,e.std))}</option>`).join("")}</select>`;
 }else if(e.std==="custom"){
  h+=`<div class="row"><div><label for="ePod">${_("OD ngoài (mm)","Outer dia. OD (mm)")}</label><input id="ePod" type="number" step="0.1" min="0" value="${esc(e.od)}"></div><div><label for="ePwl">${_("Chiều dày (mm)","Wall (mm)")}</label><input id="ePwl" type="number" step="0.01" min="0" value="${esc(e.wall)}"></div></div>`;
 }else h+=`<label for="eSize">${_("Kích thước (nhập tay)","Size (manual)")}</label><input id="eSize" value="${esc(e.size)}" placeholder='12" / DN300'>`;
 const c=e.std?pipeCalc(e):null;
 if(c){const IN=25.4,f=v=>U==="US"?(v/IN).toFixed(3)+" in":v+" mm";h+=`<div class="calc" role="status">OD ${f(c.od)}${c.t?` • ${_("dày","t")} ${f(c.t)}`:""}${c.id?` • ID ${f(c.id)}`:""}${c.mass?` • ≈ ${U==="US"?(c.mass*0.6720).toFixed(2)+" lb/ft":c.mass.toFixed(2)+" kg/m"} (${_("thép","steel")})`:""}</div>`}
 h+=`<label for="eMat">${_("Vật liệu ống","Pipe material")}</label><select id="eMat"><option value="">${_("— chưa chọn —","— not set —")}</option>${MATS.map(m=>`<option value="${m[0]}"${e.mat===m[0]?" selected":""}>${esc(T_(m[1]))}</option>`).join("")}</select>`;
 if(e.mat==="other")h+=`<input id="eMatO" value="${esc(e.matOther)}" placeholder="${_("Nhập tên / mác vật liệu","Enter material name / grade")}" aria-label="${_("Vật liệu khác","Other material")}" style="margin-top:.3rem">`;
 h+=`<label for="eCls">${_("Cấp ống / pipe class / rating","Pipe class / rating")}</label><input id="eCls" value="${esc(e.cls)}" placeholder="150# / 300# / A1A">`;
 return h;
}
function renderEdgeProps(e){
 const box=$("props"),a=getNode(e.from),b=getNode(e.to),tr=isTransport(e),sig=e.kind==="signal",sh=e.kind==="shaft";
 const kindOpts=Object.entries(KINDS).map(([k,l])=>`<option value="${k}"${e.kind===k?" selected":""}>${esc(T_(l))}</option>`).join("");
 const phOpts=`<option value="">${_("— không —","— none —")}</option>`+Object.entries(PHASE).map(([k,v])=>`<option value="${k}"${e.phase===k?" selected":""}>${esc(T_(v.n))}</option>`).join("");
 let h=`<h3 class="ph">${tr?_("Tuyến vận tải","Transport route"):sig?_("Đường tín hiệu","Signal line"):sh?_("Trục / khớp nối","Shaft / coupling"):_("Đường ống","Pipe line")}</h3><p class="hint">${esc(a?a.tag||a.title:"")} → ${esc(b?b.tag||b.title:"")}</p>`;
 h+=`<label for="eKind">${_("Loại đường","Line type")}</label><select id="eKind">${kindOpts}</select>`;
 if(!sig&&!sh)h+=`<div class="row"><div><label for="eNum">${_("Số dòng","Stream no.")}</label><input id="eNum" value="${esc(e.num)}"></div><div><label for="eSvc">${tr?_("Hàng hoá","Cargo"):_("Dịch vụ","Service")}</label><input id="eSvc" value="${esc(e.service)}" placeholder="${tr?"LNG / CNG / LPG":_("VD: Khí ướt","e.g. Wet gas")}"></div></div>`;
 else h+=`<label for="eSvc">${_("Ghi chú trên đường","Label")}</label><input id="eSvc" value="${esc(e.service)}">`;
 if(tr){
  h+=`<div class="row"><div><label for="eF">${_("Công suất / số lượng","Capacity / quantity")}</label><input id="eF" value="${esc(e.flow)}" placeholder="3.4 MTPA"></div><div><label for="eDist">${_("Cự ly / thời gian","Distance / time")}</label><input id="eDist" value="${esc(e.dist)}" placeholder="2 500 km"></div></div>`;
 }else if(!sig&&!sh){
  h+=pipeSpecHTML(e);
  h+=`<div class="sect">${_("Thông số dòng","Stream data")}</div>
  <label for="eP">${_("Áp suất","Pressure")}</label><div class="row"><input id="eP" value="${esc(e.P)}" placeholder="85 ${defUnit("pressure")}">${unitSel("eUP",e.P,"pressure")}</div>
  <label for="eT">${_("Nhiệt độ","Temperature")}</label><div class="row"><input id="eT" value="${esc(e.T)}" placeholder="45 ${defUnit("temperature")}">${unitSel("eUT",e.T,"temperature")}</div>
  <label for="eF">${_("Lưu lượng","Flow")}</label><div class="row"><input id="eF" value="${esc(e.flow)}" placeholder="120 ${defUnit(flowRole(e))}">${unitSel("eUF",e.flow,flowRole(e))}</div>
  <label for="eDist">${_("Cự ly (nếu là tuyến ống dài)","Distance (long pipelines)")}</label><div class="row"><input id="eDist" value="${esc(e.dist)}" placeholder="120 ${defUnit("distance")}">${unitSel("eUD",e.dist,"distance")}</div>
  <label for="ePh">${_("Pha (màu)","Phase (colour)")}</label><select id="ePh">${phOpts}</select>`;
 }
 h+=`<label for="eWt">${_("Độ đậm nét","Line weight")}</label><select id="eWt">${optList([["1",_("Bình thường","Normal")],["1.6",_("Đậm (ống chính)","Heavy (main line)")],["2.4",_("Rất đậm","Extra heavy")]],String(e.wt))}</select>
 <div class="grid2"><button class="btn" onclick="reverseEdge()">⇄ ${_("Đảo chiều","Reverse")}</button><button class="btn" onclick="resetRoute()">↺ ${_("Đường đi tự động","Auto route")}</button></div>`;
 if(!tr&&!sig&&!sh)h+=`<label for="eIns">${_("Chèn lên đường ống","Insert on line")}</label><div class="row"><select id="eIns">${INSERTABLE.map(k=>`<option value="${k}">${esc(T_(SYMBOLS[k].label))}</option>`).join("")}</select><button class="btn primary" style="flex:0 0 auto" onclick="insertOnEdge($('eIns').value)">${_("Chèn","Insert")}</button></div>`;
 h+=`<button class="btn danger" style="width:100%;margin-top:.6rem" onclick="deleteSelected()">🗑 ${_("Xoá đường","Delete line")}</button><p class="hint">${_("Kéo chấm tròn xanh giữa đường để dời đoạn ống.","Drag the blue dot in the middle of the line to move the segment.")}</p>`;
 box.innerHTML=h;
 [["eP","P","pressure"],["eT","T","temperature"],["eF","flow",flowRole(e)],["eDist","dist","distance"]].forEach(([id,f,role])=>{const el=$(id);if(!el||(tr&&(id==="eF"||id==="eDist")))return;el.addEventListener("change",()=>{const v=autoUnit(el.value,role);if(v!==el.value){el.value=v;e[f]=v;renderAll()}})});
 [["eNum","num"],["eSvc","service"],["eP","P"],["eT","T"],["eF","flow"],["eDist","dist"],["eSize","size"],["eCls","cls"],["eMatO","matOther"]].forEach(([id,f])=>bindIn(id,v=>e[f]=v,_("Sửa dòng ","Edit line ")+(e.num||"")));
 bindIn("ePod",v=>e.od=v,_("Sửa OD","Edit OD"));bindIn("ePwl",v=>e.wall=v,_("Sửa chiều dày","Edit wall"));
 ["ePh","eWt"].forEach(id=>{const el=$(id);if(el)el.addEventListener("change",()=>{if(id==="ePh")e.phase=el.value;else e.wt=+el.value||1;commit(_("Sửa dòng ","Edit line ")+(e.num||""));renderCanvasOnly()})});
 $("eKind").addEventListener("change",()=>{e.kind=$("eKind").value;if((e.kind==="signal"||e.kind==="shaft")&&e.num){e.num=""}else if(e.kind!=="signal"&&e.kind!=="shaft"&&e.num===""){e.num=String(state.nextStream++)}commit(_("Đổi loại đường","Change line type"));renderAll()});
 const uh=(id,fid,key)=>{const el=$(id);if(!el)return;el.addEventListener("change",()=>{if(!el.value)return;e[key]=setUnitInText(e[key],el.value);commit(_("Đổi đơn vị","Change unit"));renderAll()})};
 uh("eUP","eP","P");uh("eUT","eT","T");uh("eUF","eF","flow");uh("eUD","eDist","dist");
 const ps=$("ePs");if(ps)ps.addEventListener("change",()=>{e.std=ps.value;const z=pipeSize(e.std,e.nps);if(!z){e.nps="";e.sch=""}else if(!z.walls.some(w=>w.k===e.sch||(w.a||[]).includes(e.sch)))e.sch=defaultWall(z);commit(_("Đổi tiêu chuẩn ống","Change pipe standard"));renderAll()});
 const pn=$("ePn");if(pn)pn.addEventListener("change",()=>{e.nps=pn.value;const z=pipeSize(e.std,e.nps);e.sch=z?defaultWall(z):"";commit(_("Đổi size ống","Change pipe size"));renderAll()});
 const pw=$("ePw");if(pw)pw.addEventListener("change",()=>{e.sch=pw.value;commit(_("Đổi schedule","Change schedule"));renderAll()});
 const mt=$("eMat");if(mt)mt.addEventListener("change",()=>{e.mat=mt.value;commit(_("Đổi vật liệu ống","Change pipe material"));renderAll()});
}

/* --- hình vẽ tự do --- */
function styleFields(o,prefix,isShape){
 const closedKind=!isShape||o.t==="rect"||o.t==="ellipse"||o.t==="circle"||o.t==="hatch"||(o.t==="poly"&&o.closed)||(o.t==="path"&&!!o.closed),arrowKind=!isShape||(!closedKind&&o.t!=="rect"&&o.t!=="ellipse"&&!["arc","dim"].includes(o.t));
 return`<div class="row"><div><label for="${prefix}Col">${_("Màu nét","Stroke colour")}</label><input id="${prefix}Col" type="color" value="${esc(o.col)}"></div><div><label for="${prefix}Sw">${_("Độ dày","Width")}</label><input id="${prefix}Sw" type="number" min="0.5" max="30" step="0.5" value="${o.sw}"></div></div>
 <label for="${prefix}Dash">${_("Kiểu nét","Line style")}</label><select id="${prefix}Dash">${optList(Object.entries(DASHES).map(([k,v])=>[k,T_(v)]),o.dash)}</select>
 ${arrowKind?`<label for="${prefix}Ah">${_("Đầu mũi tên","Arrowheads")}</label><select id="${prefix}Ah">${optList([["0",_("Không có","None")],["1",_("Cuối đường","At end")],["2",_("Hai đầu","Both ends")]],String(o.ah))}</select>`:""}
 ${closedKind?`<div class="row"><label class="chk"><input type="checkbox" id="${prefix}FillOn"${o.fill?" checked":""}>${_("Tô màu","Fill")}</label><input id="${prefix}Fill" type="color" value="${esc(o.fill||"#93c5fd")}"><label class="mini" style="flex:1.2">${_("Độ đặc","Opacity")}<input id="${prefix}Fo" type="range" min="0" max="1" step="0.05" value="${o.fo}"></label></div>`:""}`;
}
function bindStyle(o,prefix,onChange){
 const set=(k,v)=>{o[k]=v;onChange()};
 bindIn(prefix+"Col",v=>{o.col=v;onChange()});bindIn(prefix+"Sw",v=>{o.sw=Math.max(.5,+v||1);onChange()});
 bindSel(prefix+"Dash",v=>{o.dash=v;onChange()});
 const ah=$(prefix+"Ah");if(ah)ah.addEventListener("change",()=>{o.ah=+ah.value;commit(_("Đổi đầu mũi tên","Arrowheads"));onChange();renderCanvasOnly()});
 const fo=$(prefix+"FillOn");if(fo){fo.addEventListener("change",()=>{o.fill=fo.checked?$(prefix+"Fill").value:"";commit(_("Tô màu hình","Fill"));onChange();renderCanvasOnly()});
  bindIn(prefix+"Fill",v=>{if($(prefix+"FillOn").checked){o.fill=v;onChange()}});bindIn(prefix+"Fo",v=>{o.fo=+v;onChange()})}
}
function renderShapeProps(h){
 const box=$("props");
 let s=`<h3 class="ph">${_("Hình vẽ: ","Shape: ")}${esc(T_(SHAPE_T[h.t]))}</h3>${styleFields(h,"sh",true)}`;
 if(h.t==="rect")s+=`<label for="shRx">${_("Bo góc","Corner radius")}</label><input id="shRx" type="number" min="0" step="2" value="${h.rx||0}">`;
 if(h.t==="poly")s+=`<label class="chk"><input type="checkbox" id="shClosed"${h.closed?" checked":""}>${_("Khép kín (đa giác)","Closed (polygon)")}</label>`;
 s+=cadOn()?cadShapeFields(h):`<label for="shZ">${_("Lớp hiển thị","Layer")}</label><select id="shZ">${optList([["f",_("Phía trước thiết bị","In front of equipment")],["b",_("Phía sau thiết bị","Behind equipment")]],h.z)}</select>`;
 if(h.t==="path")s+=vecShapeFields(h);
 s+=`<div class="grid2"><button class="btn" onclick="rotateSel()">↻ ${_("Xoay 90°","Rotate 90°")}</button><button class="btn" onclick="flipSel()">⇋ ${_("Lật","Flip")}</button><button class="btn" onclick="dupSel()">⧉ ${_("Nhân bản","Duplicate")}</button><button class="btn danger" onclick="deleteSelected()">🗑 ${_("Xoá","Delete")}</button></div>
 <p class="hint">${h.t==="pen"?_("Nét bút: kéo để di chuyển; vẽ lại nếu cần chỉnh.","Pen stroke: drag to move; redraw to change the shape."):_("Kéo thân để di chuyển, kéo các chấm tròn để đổi hình.","Drag the body to move; drag the dots to reshape.")}</p>`;
 box.innerHTML=s;
 const ch=()=>{renderShapes()};
 bindStyle(h,"sh",ch);
 bindIn("shRx",v=>{h.rx=Math.max(0,+v||0)},_("Bo góc","Corner radius"));
 bindChk("shClosed",v=>{h.closed=v},_("Khép kín","Close shape"));
 bindSel("shZ",v=>{h.z=v},_("Đổi lớp hiển thị","Change layer"));
 if(h.t==="path")vecBindShapeFields(h);
 if(cadOn())cadBindShape(h);
}
function renderPenProps(){
 const box=$("props");
 box.innerHTML=`<h3 class="ph">${_("Kiểu nét sẽ vẽ","Style for new shapes")}</h3><div class="hint">${_("Công cụ: ","Tool: ")}${esc(T_(SHAPE_T[tool]))}. ${_(...(TOOL_HINT[tool]||TOOL_HINT.select))}</div>${styleFields(Object.assign({t:tool,closed:tool==="rect"||tool==="ellipse"},penStyle),"pn",true)}
 <label class="chk"><input type="checkbox" id="pnSticky"${STICKY?" checked":""}>${_("Giữ công cụ để vẽ liên tiếp","Keep the tool active for repeated drawing")}</label>`;
 bindStyle(penStyle,"pn",()=>{});
 const st=$("pnSticky");if(st)st.addEventListener("change",()=>{STICKY=st.checked});
}

/* ============ KHUNG TÊN / THIẾT LẬP BẢN VẼ ============ */
function updMetaLbl(){if($("m_lwV"))$("m_lwV").textContent=(+state.meta.lw||1).toFixed(1)+"×";if($("m_fsV"))$("m_fsV").textContent=(+state.meta.fs||1).toFixed(1)+"×"}
function syncMetaUI(){document.querySelectorAll("[data-meta]").forEach(e=>{const v=state.meta[e.dataset.meta];if(e.type==="checkbox")e.checked=!!v;else e.value=v??""});updMetaLbl();if(typeof renderUnderPanel==="function")renderUnderPanel()}
function metaChange(ev,final){
 const t=ev.target;if(!t.dataset||!t.dataset.meta)return;const k=t.dataset.meta;
 if(k==="units"){if(final)setUnits(t.value);return}
 state.meta[k]=t.type==="checkbox"?t.checked:t.value;
 if(k==="lw"||k==="fs")state.meta[k]=+t.value||1;
 updMetaLbl();updateRS();
 if(["showTable","showSheet","grid","colorByPhase","showProps","snap","sheet","hops","lineMode","fitMode","orient","template","tbLang","pipeLabel","legendPos","showTitles"].includes(k))syncMetaUI();
 if(k==="sheet"||k==="showSheet"||k==="orient"){renderAll();if(final)fitView()}else renderCanvasOnly();
 if(final)commit(_("Đổi thiết lập bản vẽ","Drawing setup"));
}
document.addEventListener("input",ev=>metaChange(ev,false));
document.addEventListener("change",ev=>metaChange(ev,true));
function fillStaticSelects(){
 const sh=$("m_sheet");
 sh.innerHTML=["ISO","US"].map(g=>`<optgroup label="${g==="ISO"?"ISO / A-series":"US / ANSI-ARCH"}">`+Object.entries(SHEETS).filter(([k,s])=>s.g===g).map(([k,s])=>`<option value="${k}">${s.n}</option>`).join("")+"</optgroup>").join("");
 $("m_tpl").innerHTML=Object.entries(TEMPLATES).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");
}
/* ----- bảng revision ----- */
function openRevs(){renderRevTable();openModal("mRevs")}
function renderRevTable(){
 const rs=state.meta.revs,inp=(i,f,w)=>`<input data-ri="${i}" data-rf="${f}" value="${esc(rs[i][f])}" style="width:${w}" aria-label="${f}">`;
 $("revTbl").innerHTML=`<thead><tr><th>Rev.</th><th>Ngày</th><th>Nội dung thay đổi</th><th>Vẽ</th><th>Kiểm</th><th>Duyệt</th><th></th></tr></thead><tbody>`+(rs.length?rs.map((r,i)=>`<tr><td>${inp(i,"r","4rem")}</td><td>${inp(i,"date","7rem")}</td><td>${inp(i,"desc","16rem")}</td><td>${inp(i,"by","4rem")}</td><td>${inp(i,"chk","4rem")}</td><td>${inp(i,"app","4rem")}</td><td><button class="btn danger" data-rdel="${i}">✕</button></td></tr>`).join(""):`<tr><td colspan="7">Chưa có dòng revision. Bấm “Thêm dòng”.</td></tr>`)+`</tbody>`;
}
$("revTbl").addEventListener("input",ev=>{const t=ev.target;if(t.dataset.ri===undefined)return;state.meta.revs[+t.dataset.ri][t.dataset.rf]=t.value;renderCanvasOnly()});
$("revTbl").addEventListener("change",()=>commit(_("Sửa bảng revision","Edit revision table")));
$("revTbl").addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-rdel]");if(!b)return;state.meta.revs.splice(+b.dataset.rdel,1);commit(_("Xoá dòng revision","Delete revision row"));renderRevTable();renderCanvasOnly()});
function addRevRow(){const m=state.meta;m.revs.push({r:m.rev||"",date:m.date||"",desc:"",by:m.drawnBy||"",chk:m.checkedBy||"",app:m.approvedBy||""});commit(_("Thêm dòng revision","Add revision row"));renderRevTable();renderCanvasOnly()}
/* ----- font & cỡ chữ ----- */
function openFonts(){renderFontTable();openModal("mFonts")}
function renderFontTable(){
 const f=state.meta.fonts;
 $("fontTbl").innerHTML=`<thead><tr><th>${_("Phần chữ","Text element")}</th><th>${_("Font","Font")}</th><th>${_("Cỡ (pt)","Size (pt)")}</th></tr></thead><tbody>`+FONT_DEFS.map(d=>`<tr><td>${esc(T_(d[1]))}</td><td><select data-fk="${d[0]}" data-ff="f">${fontOpts(f[d[0]].f,false)}</select></td><td><input data-fk="${d[0]}" data-ff="s" type="number" min="3" max="60" step="0.5" value="${f[d[0]].s}" style="width:5rem"></td></tr>`).join("")+`</tbody>`;
 $("fontAll").innerHTML=fontOpts("",true).replace(_("— theo cài đặt chung —","— global setting —"),_("— chọn font —","— choose font —"));
}
$("fontTbl").addEventListener("input",ev=>{const t=ev.target;if(!t.dataset.fk)return;const o=state.meta.fonts[t.dataset.fk];if(t.dataset.ff==="f")o.f=t.value;else o.s=Math.min(60,Math.max(3,+t.value||o.s));renderCanvasOnly()});
$("fontTbl").addEventListener("change",()=>commit(_("Đổi font / cỡ chữ","Change fonts / sizes")));
function fontAllApply(){const v=$("fontAll").value;if(!v)return;Object.values(state.meta.fonts).forEach(o=>o.f=v);commit(_("Áp font cho mọi chữ","Apply font to all text"));renderFontTable();renderCanvasOnly()}
function fontScaleAll(k){Object.values(state.meta.fonts).forEach(o=>o.s=Math.min(60,Math.max(3,Math.round(o.s*k*2)/2)));commit(_("Đổi cỡ mọi chữ","Scale all text"));renderFontTable();renderCanvasOnly()}
function fontReset(){state.meta.fonts=defaultFonts();commit(_("Font mặc định","Default fonts"));renderFontTable();renderCanvasOnly()}
function openHist(){renderHistPanel();openModal("mHist")}
