/* Rev.6 — từ điển tiếng Anh cho module Vector.
   Khoá = ĐÚNG chuỗi tiếng Việt trong base5.html / sinh ra qua _().
   Hai lưu ý khi thêm khoá mới:
   1) trString() trong js/80_boot.js bỏ phần ký hiệu không phải chữ/số ở ĐẦU chuỗi rồi mới
      tra từ điển → khoá của nhãn nút KHÔNG kèm emoji: "Chọn (V)", không phải "↖ Chọn (V)".
   2) Bản dịch tiếng Anh cố ý viết "Bezier" không dấu, vì test enscan.js coi ký tự có dấu là
      "còn tiếng Việt sót" — "Bézier" sẽ bị báo nhầm.
   Thiếu khoá ở đây thì enscan.js sẽ báo còn chuỗi VI trong chế độ EN (mục 3.11 + mục 8). */
Object.assign(EN,{
/* --- nút chuyển module & tiêu đề panel --- */
"Module Vector: vẽ vector 2D tự do, path Bézier (Rev.6)":"Vector module: free 2D vector drawing with Bezier paths (Rev.6)",
/* --- dòng phụ trên thanh tiêu đề (applyModuleUI đặt bằng _(), nhưng đổi ngôn ngữ SAU đó
   thì trWalk phải tra được từ điển này) --- */
"Rev.6 • Vẽ vector 2D (path Bézier) • dùng chung khung giấy, in ấn, font":"Rev.6 • 2D vector drawing (Bezier paths) • shares sheets, printing and fonts",
"Công cụ Vector":"Vector tools",
"Nhóm & thứ tự lớp":"Group & z-order",

/* --- thanh công cụ bên trái: title --- */
"Chọn / kéo đối tượng (V)":"Select / drag objects (V)",
"Chọn trực tiếp — sửa điểm neo và tay cầm Bézier (A)":"Direct selection — edit anchors and Bezier handles (A)",
"Bút vẽ path Bézier: bấm = góc nhọn, bấm-kéo = đường cong (P)":"Bezier pen: click = corner anchor, click-drag = curve (P)",
"Thêm khung chữ (T)":"Add a text box (T)",
"Hình chữ nhật — vẽ xong thành path (M)":"Rectangle — becomes a path once drawn (M)",
"Ellipse — vẽ xong thành path (L)":"Ellipse — becomes a path once drawn (L)",
"Đường thẳng — vẽ xong thành path (\\)":"Line — becomes a path once drawn (\\)",
"Xoay quanh tâm khung chọn, hoặc nhập góc ở panel (R)":"Rotate around the selection centre, or type an angle in the panel (R)",
"Tỷ lệ — kéo góc khung chọn, hoặc nhập % (S)":"Scale — drag a selection corner, or type a percentage (S)",
"Lật / đối xứng (O)":"Flip / reflect (O)",
"Kéo khung nhìn (H hoặc giữ Space)":"Pan the view (H or hold Space)",
"Nhóm đối tượng đang chọn (Ctrl+G)":"Group the selected objects (Ctrl+G)",
"Rã nhóm (Ctrl+Shift+G)":"Ungroup (Ctrl+Shift+G)",
"Lên trên cùng (Ctrl+Shift+])":"Bring to front (Ctrl+Shift+])",
"Xuống dưới cùng (Ctrl+Shift+[)":"Send to back (Ctrl+Shift+[)",

/* --- thanh công cụ bên trái: nhãn nút (sau khi bỏ emoji ở đầu) --- */
"Công cụ chọn":"Selection tool",
"Chọn (V)":"Select (V)",
"Chọn trực tiếp, sửa điểm neo":"Direct selection, edit anchors",
"Điểm neo (A)":"Anchors (A)",
"Công cụ bút vẽ đường":"Path pen tool",
"Bút (P)":"Pen (P)",
"Công cụ chữ":"Text tool",
"Chữ (T)":"Text (T)",
"T Chữ (T)":"T Text (T)",
"Chữ nhật (M)":"Rectangle (M)",
"Đường (\\)":"Line (\\)",
"Tỷ lệ (S)":"Scale (S)",
"Lật đối xứng":"Flip / reflect",
"Lật (O)":"Flip (O)",
"Kéo khung nhìn":"Pan the view",
"Nhóm":"Group",
"Rã nhóm":"Ungroup",
"Lên cùng":"To front",
"Xuống cùng":"To back",

/* --- panel thuộc tính --- */
"Đường path Bézier":"Bezier path",
"Vector — kiểu nét sẽ vẽ":"Vector — style for new shapes",
"Màu nét":"Stroke colour",
"Độ dày nét":"Stroke width",
"Kiểu nét":"Dash style",
"Màu tô":"Fill colour",
"Không tô":"No fill",
"Bắt dính lưới":"Snap to grid",
"Bước lưới":"Grid step",
"Giữ góc 0/45/90° khi giữ Shift":"Constrain to 0/45/90° with Shift",
"Hình học path":"Path geometry",
"Số điểm neo: ":"Anchors: ",
"Đường kín":"closed",
"Đường hở":"open",
"Thứ tự lớp":"Z-order",
"Lên trên cùng":"To front",
"Xuống dưới cùng":"To back",
"Lên một bậc":"Forward",
"Xuống một bậc":"Backward",
"Xoay (độ)":"Rotate (degrees)",
"Tỷ lệ (%)":"Scale (%)",
"Áp dụng":"Apply",
"Lật ngang":"Flip H",
"Lật dọc":"Flip V",
"Khép kín đường":"Close the path",
"Khép kín":"Close",
"Căn chỉnh":"Align",
"Trái":"Left",
"Phải":"Right",
"Giữa dọc":"Centre H",
"Trên":"Top",
"Dưới":"Bottom",
"Giữa ngang":"Centre V",
"Phân bố":"Distribute",
"Chia đều ngang":"Distribute H",
"Chia đều dọc":"Distribute V",
"Biến đổi":"Transform",

/* --- thông báo trạng thái (kênh chính cho TTS) --- */
"Vẽ đường path":"Draw path",
"Thêm điểm neo":"Add anchor",
"Xoá điểm neo":"Delete anchor",
"Dời điểm neo":"Move anchor",
"Sửa tay cầm đường cong":"Adjust curve handle",
"Đổi kiểu điểm neo":"Convert anchor",
"Nhóm đối tượng":"Group objects",
"Đối tượng đang chọn không nằm trong nhóm nào.":"The selection is not in any group.",
"Cần chọn từ 2 đối tượng trở lên để nhóm.":"Select at least 2 objects to group.",
"Đã rã nhóm.":"Ungrouped.",
"Cần ít nhất 2 điểm neo để tạo đường.":"At least 2 anchors are needed.",
"Đã huỷ đường đang vẽ.":"Cancelled the path being drawn.",
"Đường phải còn ít nhất 2 điểm neo.":"A path needs at least 2 anchors.",
"Thêm khung chữ":"Add text box",
"BẢN VẼ VECTOR":"VECTOR DRAWING",
"Bản vẽ vector":"Vector drawing",

/* --- công cụ đo, thước, menu chuột phải (Rev.6b-ui) --- */
"Đo khoảng cách / góc: bấm 2 điểm, bấm điểm thứ 3 để đo góc (D)":"Measure distance / angle: click 2 points, a 3rd point measures the angle (D)",
"Công cụ đo":"Measure tool",
"Đo (D)":"Measure (D)",
"Menu ngữ cảnh":"Context menu",
"Chữ vector":"Vector text",
"Chữ trong vùng — xuống dòng tự động theo bề rộng hộp.":"Area text — wraps automatically to the box width.",
"Chữ trong vùng (tự xuống dòng)":"Area text (wraps automatically)",
"Chữ theo dòng (Enter để xuống dòng)":"Point text (Enter for a new line)",
"Vị trí & kích thước":"Position & size",
/* --- dữ liệu mẫu PFD (trước Rev.6 đã sót khi quét chế độ EN) --- */
"Khí":"Gas","Dầu":"Oil","Hỗn hợp giếng":"Well mixture",
"Khí xuất":"Export gas","Dầu xuất":"Export oil","Nước sản xuất":"Produced water",
"Cụm tách 3 pha + bơm dầu + nén khí":"3-phase separation + crude pump + gas compression"
});
