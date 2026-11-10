/* ============ MODULE SƠ ĐỒ — BẢNG THUỘC TÍNH & THIẾT LẬP TÀI LIỆU ============ */
const dgUF=()=>DG_UNITS[state.meta.dg.unit][1];
const dgUv=v=>Math.round(v/dgUF()*100)/100;
const dgFromUv=v=>v*dgUF();
const _o=(v,l,cur)=>`<option value="${esc(v)}"${String(cur)===String(v)?" selected":""}>${esc(l)}</option>`;
function dgFld(label,id,html){return`<label for="${id}">${label}</label>${html}`}
function dgNumIn(id,f,val,o){o=o||{};return`<input id="${id}" data-dgf="${f}" type="number" step="${o.step||.1}"${o.min!==undefined?` min="${o.min}"`:""}${o.max!==undefined?` max="${o.max}"`:""} value="${val}">`}
function dgColIn(id,f,val,allowNone,noneLabel){
 const none=allowNone&&!val;
 return`<div class="dgcol"><input id="${id}" data-dgf="${f}" type="color" value="${none?"#ffffff":val.toLowerCase()}" aria-label="${esc(noneLabel||f)}"${none?" disabled":""}>${allowNone?`<label class="chk" style="margin:0"><input type="checkbox" data-dgf="${f}_none"${none?" checked":""}>${_("Không","None")}</label>`:""}</div>`;
}
const DG_STYLE_EN={"Xanh dương":"Blue","Cam":"Orange","Xám":"Grey","Vàng":"Yellow","Xanh trời":"Light blue","Xanh lá":"Green","Trắng, viền xanh":"White, blue outline","Xanh nhạt":"Pale blue","Đỏ":"Red","Xanh lá nhạt":"Pale green","Cam nhạt":"Pale orange","Không tô":"No fill"};
const dgStyN=s=>_(s.n,DG_STYLE_EN[s.n]||s.n);
function dgStyleGallery(){
 return`<div class="dgsty" role="group" aria-label="${_("Kiểu nhanh","Quick styles")}">`+DG_STYLES.map(s=>`<button class="dgsw" data-dgsty="${s.id}" title="${esc(dgStyN(s))}" aria-label="${esc(dgStyN(s))}" style="background:${s.fl||"#fff"};border-color:${s.ln};color:${s.fc}">Aa</button>`).join("")+`</div>`;
}
const DG_LNW=[0,.25,.5,.75,1,1.5,2.25,3,4.5,6];
function dgFontSel(id,f,cur){return`<select id="${id}" data-dgf="${f}">${DG_FONTS.map(x=>`<option value="${esc(x[0])}"${cur===x[0]?" selected":""} style="font-family:${esc(x[1])}">${esc(x[0])}</option>`).join("")}</select>`}
function dgParentOptions(s){
 const pc=dgTreeParent(s.id),des=dgDescendants(s.id);
 return`<option value="">${_("(không có — là gốc)","(none — root)")}</option>`+state.dg.shapes.filter(o=>o.id!==s.id&&!des.has(o.id)).map(o=>`<option value="${esc(o.id)}"${pc&&pc.s.id===o.id?" selected":""}>${esc(dgTitle(o).slice(0,50))}</option>`).join("");
}
function renderDgProps(){
 const box=$("props");if(!box)return;
 const S=dgSelShapes(),C=dgSelConns();
 let h="";
 if(!S.length&&!C.length){
  h=`<h3 class="ph">${_("Sơ đồ","Diagram")}</h3><div class="hint">${_(`Có ${state.dg.shapes.length} hình khối, ${state.dg.conns.length} đường nối. Chọn một hình để chỉnh chữ, màu, kích thước.`,`${state.dg.shapes.length} shapes, ${state.dg.conns.length} connectors. Select a shape to edit its text, colours and size.`)}</div>
  <div class="hint"><b>${_("Mẹo nhanh","Quick tips")}:</b><ul><li>${_("Bấm hình ở thư viện bên trái để thêm.","Click a shape in the left library to add it.")}</li><li>${_("Bấm đúp hoặc F2 để gõ chữ.","Double-click or F2 to type text.")}</li><li>${_("Tab = thêm cấp dưới, Enter = thêm ngang cấp.","Tab = add child, Enter = add sibling.")}</li><li>${_("C = công cụ nối, kéo từ hình này sang hình kia.","C = connector tool, drag from one shape to another.")}</li><li>${_("Đưa vào Word: nút “Sao chép ảnh” hoặc “PowerPoint”.","To Word: use “Copy image” or “PowerPoint”.")}</li></ul></div>
  <button class="btn" style="width:100%" onclick="dgSelect([...state.dg.shapes.map(s=>s.id),...state.dg.conns.map(c=>c.id)])">${_("Chọn tất cả (Ctrl+A)","Select all (Ctrl+A)")}</button>`;
  box.innerHTML=h;return;
 }
 if(C.length===1&&!S.length){renderDgConnProps(box,C[0]);return}
 if(S.length===1&&!C.length){renderDgShapeProps(box,S[0]);return}
 renderDgMultiProps(box,S,C);
}
function dgBind(box,getTargets,after){
 box.querySelectorAll("[data-dgf]").forEach(el=>{
  const ev=(el.type==="range"||el.type==="number"||(el.tagName==="TEXTAREA")||(el.type==="text"))?"input":"change";
  el.addEventListener(ev,()=>{const T=getTargets();if(!T.length)return;dgApply(T,el);if(after)after(el)});
 });
 box.querySelectorAll("[data-dgsty]").forEach(b=>b.addEventListener("click",()=>{
  const st=dgStyle(b.dataset.dgsty),T=getTargets();
  T.forEach(s=>{if(s.k!==undefined&&s.w!==undefined){s.fl=st.fl;s.ln=st.ln;s.fc=st.fc;if(!st.fl&&s.fl==="")s.fo=1}else{s.ln=st.ln}});
  commit(_("Đổi kiểu","Change style"));renderAll();
 }));
}
function dgApply(T,el){
 const f=el.dataset.dgf,v=el.type==="checkbox"?el.checked:el.value,num=parseFloat(v);
 let label=_("Thay đổi thuộc tính","Change property"),layoutTxt=false;
 T.forEach(s=>{
  const isShape=s.w!==undefined&&s.k!==undefined&&DG_PRESET[s.k];
  switch(f){
   case"tx":s.tx=String(v);layoutTxt=true;label=_("Sửa chữ","Edit text");break;
   case"x":if(isFinite(num))s.x=dgFromUv(num);break;case"y":if(isFinite(num))s.y=dgFromUv(num);break;
   case"w":if(isFinite(num)&&num>0){s.w=Math.max(8,dgFromUv(num));layoutTxt=true}break;
   case"h":if(isFinite(num)&&num>0){s.h=Math.max(8,dgFromUv(num));if(s.af)s.af=false}break;
   case"rot":if(isFinite(num))s.rot=((num%360)+360)%360;break;
   case"a":if(isFinite(num))s.a=num;break;case"b":if(isFinite(num))s.b=num;break;
   case"fl":s.fl=String(v).toUpperCase();break;case"fl_none":s.fl=v?"":(s.fl||"#DAE3F3");break;
   case"ln":s.ln=String(v).toUpperCase();break;case"ln_none":s.ln=v?"":(s.ln||"#404040");break;
   case"fc":s.fc=String(v).toUpperCase();break;
   case"lw":if(isFinite(num)){s.lw=Math.max(0,num)}break;
   case"fo":if(isFinite(num))s.fo=Math.min(1,Math.max(0,num/100));break;
   case"ld":s.ld=v;break;
   case"ff":s.ff=v;layoutTxt=true;break;case"fs":if(isFinite(num)&&num>0){s.fs=num;layoutTxt=true}break;
   case"fb":case"fi":case"fu":s[f]=!!v;layoutTxt=true;break;
   case"ta":s.ta=v;break;case"tv":s.tv=v;break;
   case"af":s.af=!!v;layoutTxt=true;break;
   case"ls":if(isFinite(num)&&num>0){s.ls=num;layoutTxt=true}break;case"ps":if(isFinite(num)&&num>=0){s.ps=num;layoutTxt=true}break;
   case"mg0":case"mg1":case"mg2":case"mg3":if(isFinite(num)&&isFinite(s.mg?.[0])){s.mg[+f[2]]=Math.max(0,num);layoutTxt=true}break;
   case"k":if(DG_PRESET[v]){const P=DG_PRESET[v];s.k=v;if(P.adj!==undefined&&s.a===undefined)s.a=P.adj;if(P.adj2!==undefined&&s.b===undefined)s.b=P.adj2;layoutTxt=true}break;
   case"ty":s.ty=v;break;case"as":s.as=v;break;case"ae":s.ae=v;break;
   case"ctx":s.tx=String(v);break;case"lp":if(isFinite(num))s.lp=num/100;break;
   case"cfs":if(isFinite(num)&&num>0)s.fs=num;break;case"cfc":s.fc=String(v).toUpperCase();break;case"cbg":s.bg=!!v;break;case"cfb":s.fb=!!v;break;
   case"tree":s.tree=!!v;break;
   case"clw":if(isFinite(num))s.lw=Math.max(.25,num);break;case"cln":s.ln=String(v).toUpperCase();break;case"cld":s.ld=v;break;
  }
  if(layoutTxt&&isShape&&s.af)dgAutoFit(s);
 });
 renderDg();
 if(f==="k"||f==="af"||f==="tree"){commit(label);renderAll();return}
 if(f==="fl_none"||f==="ln_none"){commit(label);renderProps();renderDg();return}
 commitSoon(label);
}
function dgPlainPara(){return _("Mỗi dòng là một đoạn. Dùng **đậm**, *nghiêng*, __gạch chân__; “- ” đầu dòng = gạch đầu dòng.","Each line is a paragraph. Use **bold**, *italic*, __underline__; a leading “- ” makes a bullet.")}
function renderDgShapeProps(box,s){
 const P=DG_PRESET[s.k],U=DG_UNITS[state.meta.dg.unit][0],hasA=P.adj!==undefined,hasB=P.adj2!==undefined;
 const optK=Object.values(DG_PRESET).map(p=>_o(p.id,_(p.vi,p.en),s.k)).join("");
 box.innerHTML=`<h3 class="ph">${esc(dgKindName(s))}</h3>
 <details open><summary>${_("Văn bản trong hình","Text in shape")}</summary>
  <label for="dgPTx">${_("Nội dung","Content")}</label><textarea id="dgPTx" data-dgf="tx" rows="4" aria-describedby="dgPTxH">${esc(s.tx)}</textarea>
  <div class="hint" id="dgPTxH">${dgPlainPara()}</div>
  <div class="grid2"><button class="btn" onclick="dgEditText('${s.id}')">✏ ${_("Sửa trong hình (F2)","Edit in shape (F2)")}</button><button class="btn" onclick="dgInsMark('**')" title="Ctrl+B"><b>B</b> ${_("Đậm","Bold")}</button><button class="btn" onclick="dgInsMark('*')" title="Ctrl+I"><i>I</i> ${_("Nghiêng","Italic")}</button><button class="btn" onclick="dgInsMark('__')" title="Ctrl+U"><u>U</u> ${_("Gạch chân","Underline")}</button></div>
  <div class="row"><div>${dgFld(_("Font","Font"),"dgPff",dgFontSel("dgPff","ff",s.ff))}</div><div>${dgFld(_("Cỡ chữ (pt)","Size (pt)"),"dgPfs",dgNumIn("dgPfs","fs",s.fs,{step:.5,min:3,max:200}))}</div></div>
  <div class="row"><label class="chk"><input type="checkbox" data-dgf="fb"${s.fb?" checked":""}>${_("Đậm cả hình","Bold all")}</label><label class="chk"><input type="checkbox" data-dgf="fi"${s.fi?" checked":""}>${_("Nghiêng","Italic")}</label><label class="chk"><input type="checkbox" data-dgf="fu"${s.fu?" checked":""}>${_("Gạch chân","Underline")}</label></div>
  ${dgFld(_("Màu chữ","Text colour"),"dgPfc",dgColIn("dgPfc","fc",s.fc,false))}
  <div class="row"><div>${dgFld(_("Căn ngang","Horizontal"),"dgPta",`<select id="dgPta" data-dgf="ta">${_o("l",_("Trái","Left"),s.ta)}${_o("c",_("Giữa","Centre"),s.ta)}${_o("r",_("Phải","Right"),s.ta)}${_o("j",_("Đều hai bên","Justify"),s.ta)}</select>`)}</div><div>${dgFld(_("Căn dọc","Vertical"),"dgPtv",`<select id="dgPtv" data-dgf="tv">${_o("t",_("Trên","Top"),s.tv)}${_o("m",_("Giữa","Middle"),s.tv)}${_o("b",_("Dưới","Bottom"),s.tv)}</select>`)}</div></div>
  <div class="row"><div>${dgFld(_("Giãn dòng","Line spacing"),"dgPls",dgNumIn("dgPls","ls",s.ls,{step:.05,min:.5,max:3}))}</div><div>${dgFld(_("Cách đoạn (pt)","Para gap (pt)"),"dgPps",dgNumIn("dgPps","ps",s.ps,{step:1,min:0,max:60}))}</div></div>
  <div class="hint">${_("Lề chữ trong hình (pt): trái, trên, phải, dưới","Text insets (pt): left, top, right, bottom")}</div>
  <div class="row4">${[0,1,2,3].map(i=>`<input type="number" step=".5" min="0" data-dgf="mg${i}" value="${s.mg[i]}" aria-label="${[_("Lề trái","Left inset"),_("Lề trên","Top inset"),_("Lề phải","Right inset"),_("Lề dưới","Bottom inset")][i]}">`).join("")}</div>
  <label class="chk"><input type="checkbox" data-dgf="af"${s.af?" checked":""}>${_("Tự co chiều cao cho vừa chữ","Auto-fit height to text")}</label>
 </details>
 <details open><summary>${_("Hình & màu","Shape & colours")}</summary>
  ${dgFld(_("Đổi loại hình khối","Change shape type"),"dgPk",`<select id="dgPk" data-dgf="k">${optK}</select>`)}
  ${dgStyleGallery()}
  <div class="row"><div>${dgFld(_("Màu nền","Fill"),"dgPfl",dgColIn("dgPfl","fl",s.fl,true,_("Màu nền","Fill")))}</div><div>${dgFld(_("Màu viền","Outline"),"dgPln",dgColIn("dgPln","ln",s.ln,true,_("Màu viền","Outline")))}</div></div>
  <div class="row"><div>${dgFld(_("Độ dày viền (pt)","Outline width (pt)"),"dgPlw",`<select id="dgPlw" data-dgf="lw">${DG_LNW.map(v=>_o(v,v+" pt",s.lw)).join("")}${DG_LNW.includes(s.lw)?"":_o(s.lw,s.lw+" pt",s.lw)}</select>`)}</div><div>${dgFld(_("Kiểu nét","Dash"),"dgPld",`<select id="dgPld" data-dgf="ld">${Object.entries(DASHES).map(([k,l])=>_o(k,T_(l),s.ld)).join("")}</select>`)}</div></div>
  ${dgFld(_("Độ đặc của nền (%)","Fill opacity (%)"),"dgPfo",dgNumIn("dgPfo","fo",Math.round(s.fo*100),{step:5,min:0,max:100}))}
  ${hasA?dgFld(_("Điều chỉnh hình (độ bo/nhọn)","Shape adjust (corner/point)"),"dgPa",`<input id="dgPa" data-dgf="a" type="range" min="${P.amin??0}" max="${P.amax??1}" step=".005" value="${s.a}">`):""}
  ${hasB?dgFld(_("Điều chỉnh 2","Adjust 2"),"dgPb",`<input id="dgPb" data-dgf="b" type="range" min="${P.bmin??0}" max="${P.bmax??1}" step=".005" value="${s.b}">`):""}
 </details>
 <details open><summary>${_("Vị trí & kích thước","Position & size")} (${U})</summary>
  <div class="row"><div>${dgFld("X","dgPx",dgNumIn("dgPx","x",dgUv(s.x)))}</div><div>${dgFld("Y","dgPy",dgNumIn("dgPy","y",dgUv(s.y)))}</div></div>
  <div class="row"><div>${dgFld(_("Rộng","Width"),"dgPw",dgNumIn("dgPw","w",dgUv(s.w),{min:.1}))}</div><div>${dgFld(_("Cao","Height"),"dgPh",dgNumIn("dgPh","h",dgUv(s.h),{min:.1}))}</div></div>
  ${dgFld(_("Góc xoay (độ)","Rotation (deg)"),"dgProt",dgNumIn("dgProt","rot",Math.round(s.rot*10)/10,{step:1,min:0,max:360}))}
 </details>
 <details open><summary>${_("Cây phân cấp","Hierarchy")}</summary>
  ${dgFld(_("Cấp trên trực tiếp","Parent"),"dgPpar",`<select id="dgPpar">${dgParentOptions(s)}</select>`)}
  <div class="grid2"><button class="btn primary" onclick="dgAddChild('${s.id}')">⤵ ${_("Thêm cấp dưới (Tab)","Add child (Tab)")}</button><button class="btn" onclick="dgAddSibling('${s.id}')">↔ ${_("Thêm ngang cấp (Enter)","Add sibling (Enter)")}</button><button class="btn" onclick="dgMoveSibling('${s.id}',-1)">◀ ${_("Dời lên trước","Move earlier")}</button><button class="btn" onclick="dgMoveSibling('${s.id}',1)">${_("Dời ra sau","Move later")} ▶</button></div>
 </details>
 <details><summary>${_("Sắp xếp & thao tác","Arrange & actions")}</summary>
  <div class="grid2"><button class="btn" onclick="dgOrder('front')">${_("Lên trên cùng","Bring to front")}</button><button class="btn" onclick="dgOrder('back')">${_("Xuống dưới cùng","Send to back")}</button><button class="btn" onclick="dgOrder('up')">${_("Lên một lớp","Forward")}</button><button class="btn" onclick="dgOrder('down')">${_("Xuống một lớp","Backward")}</button><button class="btn" onclick="dgDup()">${_("Nhân đôi (Ctrl+D)","Duplicate (Ctrl+D)")}</button><button class="btn danger" onclick="dgDeleteSel()">${_("Xoá (Delete)","Delete")}</button></div>
  <button class="btn danger" style="width:100%;margin-top:.4rem" onclick="dgDeleteSel(true)">${_("Xoá cả nhánh (Shift+Delete)","Delete whole branch (Shift+Delete)")}</button>
 </details>`;
 dgBind(box,()=>dgSelShapes());
 const par=$("dgPpar");if(par)par.addEventListener("change",()=>{dgReparent(s.id,par.value||null);commit(_("Đổi cấp trên","Change parent"));renderAll()});
}
function dgInsMark(mk){
 const ta=$("dgPTx");if(!ta)return;ta.focus();dgWrapSel(ta,mk);ta.dispatchEvent(new Event("input"));
}
function renderDgConnProps(box,c){
 const U=DG_UNITS[state.meta.dg.unit][0];
 const ao=cur=>DG_ARROWS.map(a=>_o(a,T_(DG_ARROW_N[a]),cur)).join("");
 box.innerHTML=`<h3 class="ph">${_("Đường nối","Connector")}</h3>
 <details open><summary>${_("Kiểu & mũi tên","Type & arrowheads")}</summary>
  ${dgFld(_("Kiểu đường","Line type"),"dgCty",`<select id="dgCty" data-dgf="ty">${_o("el",_("Gấp khúc vuông góc (elbow)","Elbow"),c.ty)}${_o("st",_("Thẳng","Straight"),c.ty)}${_o("cv",_("Cong","Curved"),c.ty)}</select>`)}
  <div class="row"><div>${dgFld(_("Đầu bắt đầu","Start end"),"dgCas",`<select id="dgCas" data-dgf="as">${ao(c.as)}</select>`)}</div><div>${dgFld(_("Đầu kết thúc","End end"),"dgCae",`<select id="dgCae" data-dgf="ae">${ao(c.ae)}</select>`)}</div></div>
  <div class="row"><div>${dgFld(_("Màu","Colour"),"dgCln",dgColIn("dgCln","cln",c.ln,false))}</div><div>${dgFld(_("Độ dày (pt)","Width (pt)"),"dgClw",`<select id="dgClw" data-dgf="clw">${[.5,.75,1,1.25,1.5,2.25,3,4.5,6].map(v=>_o(v,v+" pt",c.lw)).join("")}${[.5,.75,1,1.25,1.5,2.25,3,4.5,6].includes(c.lw)?"":_o(c.lw,c.lw+" pt",c.lw)}</select>`)}</div></div>
  ${dgFld(_("Kiểu nét","Dash"),"dgCld",`<select id="dgCld" data-dgf="cld">${Object.entries(DASHES).map(([k,l])=>_o(k,T_(l),c.ld)).join("")}</select>`)}
  <label class="chk"><input type="checkbox" data-dgf="tree"${c.tree?" checked":""}>${_("Là liên kết cấp trên → cấp dưới (cây phân cấp)","Hierarchy link (parent → child)")}</label>
 </details>
 <details open><summary>${_("Nhãn trên đường nối","Connector label")}</summary>
  ${dgFld(_("Chữ nhãn (vd: Có / Không)","Label text (e.g. Yes / No)"),"dgCLabel",`<input id="dgCLabel" type="text" data-dgf="ctx" value="${esc(c.tx)}">`)}
  ${dgFld(_("Vị trí nhãn dọc đường (%)","Label position along line (%)"),"dgClp",`<input id="dgClp" data-dgf="lp" type="range" min="0" max="100" step="1" value="${Math.round(c.lp*100)}">`)}
  <div class="row"><div>${dgFld(_("Cỡ chữ (pt)","Size (pt)"),"dgCfs",dgNumIn("dgCfs","cfs",c.fs,{step:.5,min:3,max:100}))}</div><div>${dgFld(_("Màu chữ","Text colour"),"dgCfc",dgColIn("dgCfc","cfc",c.fc,false))}</div></div>
  <label class="chk"><input type="checkbox" data-dgf="cbg"${c.bg?" checked":""}>${_("Nền trắng sau chữ","White background behind text")}</label>
  <label class="chk"><input type="checkbox" data-dgf="cfb"${c.fb?" checked":""}>${_("Chữ đậm","Bold")}</label>
 </details>
 <div class="grid2" style="margin-top:.5rem"><button class="btn" onclick="dgReverseConn()">⇄ ${_("Đảo chiều","Reverse")}</button><button class="btn" onclick="dgResetAdj()">↺ ${_("Căn lại đoạn gấp","Reset bend")}</button></div>
 <button class="btn danger" style="width:100%;margin-top:.4rem" onclick="dgDeleteSel()">${_("Xoá đường nối (Delete)","Delete connector")}</button>`;
 dgBind(box,()=>dgSelConns());
}
function dgReverseConn(){
 dgSelConns().forEach(c=>{[c.s,c.e]=[c.e,c.s];[c.sp,c.ep]=[c.ep,c.sp];[c.as,c.ae]=[c.ae,c.as];if(!c.s){delete c.s;c.s=null}if(!c.e)c.e=null;c.lp=1-c.lp});
 commit(_("Đảo chiều đường nối","Reverse connector"));renderAll();
}
function dgResetAdj(){dgSelConns().forEach(c=>{c.adj=.5});commit(_("Căn lại đoạn gấp","Reset bend"));renderAll()}
function renderDgMultiProps(box,S,C){
 box.innerHTML=`<h3 class="ph">${_(`Đã chọn ${S.length} hình, ${C.length} đường nối`,`${S.length} shapes, ${C.length} connectors selected`)}</h3>
 ${S.length>=2?`<details open><summary>${_("Căn chỉnh","Align")}</summary><div class="grid2">
  <button class="btn" onclick="dgAlign('left')">⇤ ${_("Căn trái","Align left")}</button><button class="btn" onclick="dgAlign('right')">${_("Căn phải","Align right")} ⇥</button>
  <button class="btn" onclick="dgAlign('center')">↔ ${_("Giữa (cùng X)","Centre (same X)")}</button><button class="btn" onclick="dgAlign('middle')">↕ ${_("Giữa (cùng Y)","Middle (same Y)")}</button>
  <button class="btn" onclick="dgAlign('top')">⤒ ${_("Căn trên","Align top")}</button><button class="btn" onclick="dgAlign('bottom')">⤓ ${_("Căn dưới","Align bottom")}</button>
  <button class="btn" onclick="dgAlign('dh')">⇔ ${_("Chia đều ngang","Distribute H")}</button><button class="btn" onclick="dgAlign('dv')">⇕ ${_("Chia đều dọc","Distribute V")}</button>
  <button class="btn" onclick="dgSameSize('w')">${_("Cùng chiều rộng","Same width")}</button><button class="btn" onclick="dgSameSize('h')">${_("Cùng chiều cao","Same height")}</button>
  <button class="btn" style="grid-column:1/3" onclick="dgSameSize('')">${_("Cùng kích thước (theo hình đầu)","Same size (as first)")}</button></div></details>`:""}
 ${S.length?`<details open><summary>${_("Định dạng chung","Common format")}</summary>
  ${dgStyleGallery()}
  <div class="row"><div>${dgFld("Font","dgMff",dgFontSel("dgMff","ff",S[0].ff))}</div><div>${dgFld(_("Cỡ chữ (pt)","Size (pt)"),"dgMfs",dgNumIn("dgMfs","fs",S[0].fs,{step:.5,min:3,max:200}))}</div></div>
  <div class="row"><label class="chk"><input type="checkbox" data-dgf="fb"${S.every(s=>s.fb)?" checked":""}>${_("Đậm","Bold")}</label><label class="chk"><input type="checkbox" data-dgf="fi"${S.every(s=>s.fi)?" checked":""}>${_("Nghiêng","Italic")}</label></div>
  <div class="row"><div>${dgFld(_("Căn ngang","Horizontal"),"dgMta",`<select id="dgMta" data-dgf="ta">${_o("l",_("Trái","Left"),S[0].ta)}${_o("c",_("Giữa","Centre"),S[0].ta)}${_o("r",_("Phải","Right"),S[0].ta)}${_o("j",_("Đều hai bên","Justify"),S[0].ta)}</select>`)}</div><div>${dgFld(_("Độ dày viền (pt)","Outline (pt)"),"dgMlw",`<select id="dgMlw" data-dgf="lw">${DG_LNW.map(v=>_o(v,v+" pt",S[0].lw)).join("")}</select>`)}</div></div>
 </details>`:""}
 <div class="grid2"><button class="btn" onclick="dgOrder('front')">${_("Lên trên cùng","Bring to front")}</button><button class="btn" onclick="dgOrder('back')">${_("Xuống dưới cùng","Send to back")}</button><button class="btn" onclick="dgDup()">${_("Nhân đôi","Duplicate")}</button><button class="btn danger" onclick="dgDeleteSel()">${_("Xoá","Delete")}</button></div>`;
 dgBind(box,()=>dgSelShapes());
}
/* ============ THIẾT LẬP TÀI LIỆU SƠ ĐỒ ============ */
function renderDgSettings(){
 const box=$("dgSetBox");if(!box||!dgOn())return;
 const M=state.meta.dg,U=DG_UNITS[M.unit];
 const ao=cur=>DG_ARROWS.map(a=>_o(a,T_(DG_ARROW_N[a]),cur)).join("");
 box.innerHTML=`
 <div class="row"><div><label for="dgsFf">${_("Font mặc định","Default font")}</label>${dgFontSel("dgsFf","ff",M.ff).replace('data-dgf="ff"','data-dgm="ff"')}</div><div><label for="dgsFs">${_("Cỡ chữ (pt)","Size (pt)")}</label><input id="dgsFs" type="number" step=".5" min="4" max="96" data-dgm="fs" value="${M.fs}"></div></div>
 <label for="dgsSty">${_("Kiểu màu mặc định cho hình mới","Default style for new shapes")}</label><select id="dgsSty" data-dgm="sty">${DG_STYLES.map(s=>_o(s.id,dgStyN(s),M.sty)).join("")}</select>
 <div class="row"><div><label for="dgsUnit">${_("Đơn vị hiển thị","Display unit")}</label><select id="dgsUnit" data-dgm="unit">${Object.entries(DG_UNITS).map(([k,v])=>_o(k,v[0],M.unit)).join("")}</select></div><div><label for="dgsGs">${_("Bước lưới (đv)","Grid step")}</label><select id="dgsGs" data-dgm="gs">${[2,4,5,10,20,40].map(v=>_o(v,v+" ("+Math.round(v*25)/100+" mm)",M.gs)).join("")}</select></div></div>
 <label class="chk"><input type="checkbox" data-dgm="snap"${M.snap?" checked":""}>${_("Bắt dính vào lưới (giữ Alt khi kéo để tắt tạm)","Snap to grid (hold Alt while dragging to bypass)")}</label>
 <label for="dgsCty">${_("Kiểu đường nối mới","New connector type")}</label><select id="dgsCty" data-dgm="cty">${_o("el",_("Gấp khúc vuông góc","Elbow"),M.cty)}${_o("st",_("Thẳng","Straight"),M.cty)}${_o("cv",_("Cong","Curved"),M.cty)}</select>
 <div class="row"><div><label for="dgsCas">${_("Đầu bắt đầu","Start")}</label><select id="dgsCas" data-dgm="cas">${ao(M.cas)}</select></div><div><label for="dgsCae">${_("Đầu kết thúc","End")}</label><select id="dgsCae" data-dgm="cae">${ao(M.cae)}</select></div></div>
 <label for="dgsClw">${_("Độ dày đường nối (pt)","Connector width (pt)")}</label><input id="dgsClw" type="number" step=".25" min=".25" max="12" data-dgm="clw" value="${M.clw}">
 <hr><div class="hint"><b>${_("Cây phân cấp","Hierarchy")}</b></div>
 <label for="dgsDir">${_("Hướng phát triển","Direction")}</label><select id="dgsDir" data-dgm="dir">${_o("down",_("Từ trên xuống","Top → down"),M.dir)}${_o("right",_("Từ trái sang phải","Left → right"),M.dir)}${_o("up",_("Từ dưới lên","Bottom → up"),M.dir)}${_o("left",_("Từ phải sang trái","Right → left"),M.dir)}</select>
 <div class="row"><div><label for="dgsGx">${_("Khoảng cách anh em (đv)","Sibling gap")}</label><input id="dgsGx" type="number" step="2" min="8" max="400" data-dgm="gapX" value="${M.gapX}"></div><div><label for="dgsGy">${_("Khoảng cách giữa các cấp (đv)","Level gap")}</label><input id="dgsGy" type="number" step="2" min="8" max="400" data-dgm="gapY" value="${M.gapY}"></div></div>
 <label class="chk"><input type="checkbox" data-dgm="rl"${M.rl?" checked":""}>${_("Tự sắp xếp lại cây khi thêm / xoá hình","Auto re-layout when adding / deleting")}</label>
 <hr><div class="hint"><b>${_("Xuất ra Word / Office","Export to Word / Office")}</b></div>
 <label for="dgsPad">${_("Lề trắng quanh sơ đồ khi xuất (đv, 4 đv = 1 mm)","White margin around diagram on export (units, 4 = 1 mm)")}</label><input id="dgsPad" type="number" step="4" min="0" max="400" data-dgm="pad" value="${M.pad}">
 <div class="row"><div><label for="dgsPs">${_("Độ phân giải ảnh PNG","PNG resolution")}</label><select id="dgsPs" data-dgm="pngS">${[1,2,3,4,6].map(v=>_o(v,v+"×",M.pngS)).join("")}</select></div><div><label for="dgsPb">${_("Nền ảnh PNG","PNG background")}</label><select id="dgsPb" data-dgm="pngBg">${_o("white",_("Trắng","White"),M.pngBg)}${_o("none",_("Trong suốt","Transparent"),M.pngBg)}</select></div></div>`;
 box.querySelectorAll("[data-dgm]").forEach(el=>el.addEventListener("change",()=>{
  const k=el.dataset.dgm,v=el.type==="checkbox"?el.checked:(el.type==="number"?parseFloat(el.value):el.value),nm=cleanDgMeta({...M,[k]:v});
  Object.assign(state.meta.dg,nm);
  if(k==="dir"||k==="gapX"||k==="gapY"){if(M.rl&&dgRoots().length)dgLayoutAll()}
  commit(_("Đổi thiết lập sơ đồ","Change diagram settings"));renderAll();
  if(k==="unit"||k==="gs")renderDgSettings();
 }));
}
