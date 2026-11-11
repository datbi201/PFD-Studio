/* ============ THÔNG TIN / TRỢ GIÚP ============ */
const HELP_TABS=[["guide","📘","Hướng dẫn PFD","PFD guide"],["keys","⌨","Phím tắt & lệnh","Hotkeys & commands"],["faq","❓","Hỏi đáp (FAQ)","FAQ"],["about","ℹ","Về phần mềm","About"]];
let helpTab="";
const hk=s=>s.split("|").map(x=>`<span class="kbd">${escH(x)}</span>`).join(" ");
function escH(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function helpTable(title,rows){
 return `<h3>${title}</h3><table class="t helpk"><thead><tr><th>${_("Phím / lệnh","Key / command")}</th><th>${_("Tác dụng","Action")}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${hk(r[0])}</td><td>${_(r[1],r[2])}</td></tr>`).join("")}</tbody></table>`;
}
const HK_PFD=[
 ["V","Công cụ chọn","Select tool"],["C","Công cụ nối ống (kéo từ chấm xanh cũng nối được)","Connect-pipe tool (dragging from a blue dot also connects)"],
 ["P","Thêm điểm nối ống tuỳ ý: bấm đúng vị trí trên thiết bị","Add a custom pipe connection point: click the exact spot on the device"],
 ["E","Ống hở / mũi tên công nghệ: kéo từ chỗ bất kỳ hoặc từ điểm nối; thả lên điểm nối để gắn, thả ra ngoài để hở (giữ Alt: không hút điểm nối)","Open pipe / process arrow: drag from anywhere or from a port; drop on a port to attach, in empty space to leave open (hold Alt: no snapping)"],
 ["J","Làm thẳng ống: dời nhẹ thiết bị để các đoạn ống gấp khúc nhỏ thành thẳng (không chọn gì: cả bản vẽ; chọn thiết bị: các thiết bị đó đứng yên; chọn 1 ống: chỉ ống đó)","Straighten pipes: nudge devices so small kinks become straight (nothing selected: whole drawing; devices selected: they stay fixed; one pipe selected: only that pipe)"],
 ["T","Thêm khung chữ","Add a text box"],["H|Space","Kéo khung nhìn (giữ Space rồi kéo; hoặc nút giữa chuột)","Pan the view (hold Space and drag; or middle mouse button)"],
 ["L","Vẽ đường","Draw a line"],["A","Vẽ mũi tên","Draw an arrow"],["B","Vẽ hộp","Draw a box"],["O","Vẽ elip / tròn","Draw an ellipse / circle"],
 ["Y","Vẽ đa tuyến (Enter hoặc chuột phải để kết thúc)","Draw a polyline (Enter or right-click to finish)"],["D","Bút vẽ tự do","Freehand pen"],
 ["Shift","Khi vẽ: giữ để vẽ thẳng / vuông / tròn đều","While drawing: hold for straight / square / true circle"],
 ["Alt","Giữ Alt và kéo chấm cam để dời điểm nối ống","Hold Alt and drag an orange dot to move a connection point"],
 ["Ctrl+A","Chọn tất cả","Select all"],["Ctrl+C|Ctrl+X|Ctrl+V","Sao chép / cắt / dán","Copy / cut / paste"],["Ctrl+D","Nhân bản","Duplicate"],
 ["←|↑|→|↓","Dịch đối tượng đang chọn 10 đơn vị (giữ Shift: 50)","Nudge the selection 10 units (hold Shift: 50)"],
 ["R","Xoay đối tượng đang chọn","Rotate the selection"],["F","Lật đối tượng đang chọn","Flip the selection"],["Q","Đổi kiểu vẽ (biến thể) của thiết bị","Cycle the drawing variant of a device"],
 ["Delete|Backspace","Xoá","Delete"],["F2","Sửa nhanh Tag (hoặc nội dung chữ)","Quick-edit the Tag (or the text content)"],
 ["Ctrl+Z|Ctrl+Y","Hoàn tác / làm lại (Ctrl+Shift+Z cũng là làm lại)","Undo / redo (Ctrl+Shift+Z also redoes)"],
 ["Ctrl+S","Lưu bản vẽ ra file JSON","Save the drawing as a JSON file"],["Ctrl+P","In / xuất PDF","Print / export PDF"],
 ["Ctrl+0","Vừa khung nhìn","Fit to view"],["+|-","Phóng to / thu nhỏ (cũng có thể lăn chuột; Shift+lăn = cuộn ngang)","Zoom in / out (mouse wheel works too; Shift+wheel = scroll sideways)"],
 ["Esc","Hủy thao tác, đóng cửa sổ, về công cụ chọn","Cancel, close dialogs, return to the select tool"],["?","Mở cửa sổ Thông tin / Trợ giúp này","Open this Info / Help window"]];

function guideKeys(){
 return `<h2>${_("Phím tắt & lệnh","Hotkeys & commands")}</h2><p class="hint">${_("Bảng được sinh trực tiếp từ danh sách lệnh của phần mềm. Phím chỉ hoạt động khi con trỏ không nằm trong ô nhập liệu.","The tables are generated from the app's own command lists. Keys only work when the cursor is not in an input field.")}</p>`+
 helpTable(_("PFD — bàn phím","PFD — keyboard"),HK_PFD);
}
const FAQ=[
 ["Bản vẽ của tôi lưu ở đâu? Có bị mất khi đóng trình duyệt không?","Where is my drawing stored? Is it lost when I close the browser?","Phần mềm tự lưu liên tục trong bộ nhớ của trình duyệt (mỗi module một bản). Khi mở lại sẽ khôi phục. Tuy nhiên xoá dữ liệu duyệt web hoặc dùng chế độ ẩn danh sẽ mất — hãy bấm Lưu (Ctrl+S) để giữ file JSON.","The app auto-saves continuously in the browser's storage (one copy per module) and restores it on reopening. Clearing browsing data or using a private window loses it — press Save (Ctrl+S) to keep a JSON file."],
 ["Dữ liệu của tôi có bị gửi lên mạng không?","Is my data sent over the internet?","Không. Toàn bộ xử lý chạy trong trình duyệt của bạn, không có máy chủ nhận dữ liệu.","No. Everything runs in your browser; there is no server receiving data."],
 ["Làm sao để PDF xuất ra là vector, không phải ảnh?","How do I get a vector PDF instead of an image?","Dùng In / PDF rồi bấm “Tải PDF”. File được tạo thẳng từ đường nét, chữ nhúng font Liberation nên phóng to bao nhiêu cũng nét.","Use Print / PDF and press “Download PDF”. The file is generated from strokes and text with embedded Liberation fonts, so it stays sharp at any zoom."],
 ["Nút In không phản ứng?","The Print button does nothing?","Một số khung xem trước hoặc trình duyệt nhúng chặn cửa sổ in. Hãy dùng “Tải PDF” rồi in file PDF, hoặc mở file HTML trực tiếp bằng Chrome / Edge / Firefox.","Some embedded viewers block the print dialog. Use “Download PDF” and print that file, or open the HTML file directly in Chrome / Edge / Firefox."],
 ["Đổi SI ⇄ US có tự đổi số liệu không? (PFD)","Does switching SI ⇄ US convert my values? (PFD)","Có, phần mềm quy đổi gần đúng các đại lượng đã nhập kèm đơn vị. Hãy kiểm tra lại số quan trọng. Trong Cài đặt có thể đặt đơn vị mặc định cho từng đại lượng.","Yes, it approximately converts quantities entered with units. Check important numbers. In Settings you can set a default unit per quantity."],
 ["Tôi bị mù / khiếm thị, dùng thế nào cho tiện?","I am blind or vision-impaired. How can I work comfortably?","Phần mềm có nhãn ARIA và thông báo trạng thái đọc được bằng trình đọc màn hình. Nút “Mô tả” sinh văn bản mô tả toàn bộ bản vẽ.","The app has ARIA labels and status messages readable by screen readers. The “Describe” button generates a text description of the whole drawing."],
 ["Ống PFD không tự nối vuông góc, thiết bị chồng lên nhau?","PFD pipes do not route neatly or devices overlap?","Dùng nhóm nút bố trí: Tránh chồng lấn, Giãn khoảng cách, Tự bố trí theo dòng, Đặt giữa trang. Nút 🕘 mở lịch sử có tên từng bước để quay lại.","Use the layout buttons: Remove overlaps, Spread, Auto layout, Center on page. The 🕘 button opens a named history to go back."],
 ["Tôi muốn mở file cũ của Rev.trước?","Can I open files from earlier revisions?","File PFD cũ mở được bình thường. File SimCAD (.cad.json) của Rev.5 không còn được hỗ trợ ở Rev.6 — hãy mở bằng Rev.5.","Older PFD files open normally. SimCAD (.cad.json) files from Rev.5 are no longer supported in Rev.6 — open them with Rev.5."]];
function guideFaq(){
 return `<h2>${_("Hỏi đáp thường gặp","Frequently asked questions")}</h2>`+FAQ.map((f,i)=>`<details class="faq"${i===0?" open":""}><summary>${_(f[0],f[1])}</summary><p>${_(f[2],f[3])}</p></details>`).join("");
}
function guideAbout(){
 const P=(vi,en)=>`<p>${_(vi,en)}</p>`;
 return `<h2>PFD Studio — Rev.8</h2><p class="hint">${_("Phiên bản 26.11.11 • một file HTML duy nhất, chạy ngoại tuyến, không cần cài đặt","Version 26.10.26 • a single HTML file, works offline, no installation")}</p>`+
 P("<b>PFD Studio</b> — vẽ sơ đồ công nghệ (Process Flow Diagram) dầu khí: thiết bị, đường ống, quy cách ống, bảng dòng, thư viện hơn 1.000 ký hiệu theo ISO 10628 / ANSI / ISA.","<b>PFD Studio</b> — draws oil &amp; gas Process Flow Diagrams: equipment, pipes, pipe specs, stream tables, and a library of 1,000+ ISO 10628 / ANSI / ISA symbols.")+
 `<h3>${_("Tính năng chính","Main features")}</h3><ul>`+
 [["PFD: thư viện thiết bị lớn, ống tự đi vuông góc, quy cách ống ASME / ISO, bảng dòng, đơn vị SI / US","PFD: large equipment library, auto-orthogonal pipes, ASME / ISO pipe specs, stream table, SI / US units"],
  ["Chữ trong hình: ngắt dòng, căn lề, gạch đầu dòng, đậm / nghiêng / gạch chân, tự co chiều cao — dàn như Word / PowerPoint","Shape text: wrapping, alignment, bullets, bold / italic / underline, auto-height — laid out like Word / PowerPoint"],
  ["Xuất: PNG (dán thẳng vào Word), PowerPoint .pptx (hình khối thật), SVG sạch, PDF vector","Export: PNG (paste straight into Word), PowerPoint .pptx (real shapes), clean SVG, vector PDF"],
  ["Khổ ISO A0–A4, ANSI A–E, ARCH D; in nhiều trang","ISO A0–A4, ANSI A–E, ARCH D sheets; multi-page printing"],
  ["Giao diện sáng / tối, VI / EN, cỡ chữ, tương phản cao; hỗ trợ trình đọc màn hình","Light / dark, VI / EN, text size, high contrast; screen-reader support"]].map(a=>`<li>${_(a[0],a[1])}</li>`).join("")+`</ul>`+
 `<h3>${_("Định dạng file","File formats")}</h3><ul><li>${_("Lưu / mở: JSON (.pfd.json)","Save / open: JSON (.pfd.json)")}</li><li>${_("Xuất: PDF vector (nhúng font), SVG, PNG, bảng dòng CSV (PFD)","Export: vector PDF (embedded fonts), SVG, PNG, stream-table CSV (PFD)")}</li></ul>`+
 `<h3>${_("Giới hạn đã biết","Known limitations")}</h3><ul>`+
 [["Chưa thử trực tiếp trong Microsoft Word / PowerPoint; file .pptx được kiểm tra bằng LibreOffice và python-pptx.","Not yet tested directly in Microsoft Word / PowerPoint; the .pptx was checked with LibreOffice and python-pptx."],
  ["Font ngoài Arial / Times New Roman / Courier New có thể lệch số đo nếu máy không có font đó.","Fonts other than Arial / Times New Roman / Courier New may differ in metrics if the machine lacks them."],
  ["Module SimCAD và nhập bản scan của Rev.5 đã được loại bỏ.","The Rev.5 SimCAD module and scan import have been removed."],
  ["Quy đổi đơn vị PFD là gần đúng; ký hiệu PFD đơn giản hoá, không thay thế bản vẽ phát hành theo tiêu chuẩn dự án.","PFD unit conversion is approximate; PFD symbols are simplified and do not replace formally issued drawings."]].map(a=>`<li>${_(a[0],a[1])}</li>`).join("")+`</ul>`+
 `<h3>${_("Giấy phép & quyền riêng tư","Licences & privacy")}</h3>`+
 P("Font nhúng trong PDF là họ Liberation (SIL Open Font License 1.1). Phần mềm không thu thập hay gửi dữ liệu đi; toàn bộ lưu trữ nằm trong trình duyệt của bạn.","PDF-embedded fonts are the Liberation family (SIL Open Font License 1.1). The app collects and sends no data; all storage stays in your browser.")+
 P("Bảng kích thước ống lấy từ ASME B36.10M / B36.19M, ISO 4200, ASTM B88, ISO 4427 — hãy đối chiếu bản gốc khi thiết kế thật.","Pipe dimension tables come from ASME B36.10M / B36.19M, ISO 4200, ASTM B88, ISO 4427 — verify against the originals for real design.");
}
function renderHelp(tab){
 if(tab)helpTab=tab;if(!helpTab)helpTab="guide";
 const bar=$("hTabs");
 bar.innerHTML=HELP_TABS.map(t=>`<button class="btn htab${t[0]===helpTab?" on":""}" role="tab" aria-selected="${t[0]===helpTab}" data-t="${t[0]}">${t[1]} ${_(t[2],t[3])}</button>`).join("");
 bar.querySelectorAll("button").forEach(b=>b.onclick=()=>{renderHelp(b.dataset.t);$("hBody").scrollTop=0});
 const g=$("hGuide"),body=$("hBody");
 g.style.display=helpTab==="guide"?"block":"none";
 body.style.display=helpTab==="guide"?"none":"block";
 if(helpTab==="keys")body.innerHTML=guideKeys();else if(helpTab==="faq")body.innerHTML=guideFaq();else if(helpTab==="about")body.innerHTML=guideAbout();
 body.classList.add("nt");
}
