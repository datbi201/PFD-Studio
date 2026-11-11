# ĐÁNH GIÁ TÍCH HỢP CSDL KÝ HIỆU MỞ VÀO PFD STUDIO Rev.7 — v0.1

**Ngày:** 2026-11-11
**Đối tượng kiểm tra:** `pfd-studio-26.10.30-Rev.7.html` (936 KB, 6.548 dòng, 1 file HTML duy nhất, file gốc giữ nguyên không sửa)
**CSDL đối chiếu:** gói PFD/P&ID Database v1.0 (catalog 1.106 ký hiệu)
**Kết luận ngắn:** **TÍCH HỢP ĐƯỢC** — và đây là hướng đúng: định dạng ký hiệu của app và CSDL mở khớp nhau ở mức SVG, app đã có sẵn cơ chế cổng nối/thêm cổng. Đã làm và kiểm chứng bản thử nghiệm (POC) chạy được. Việc chính cần làm tay là *điểm nối (ports)* và *làm sạch nét vẽ* cho từng ký hiệu khi chuyển đổi hàng loạt.

---

## 1. Kiến trúc thư viện ký hiệu của PFD Studio (đọc từ mã nguồn)

- Toàn bộ ký hiệu nằm trong một registry duy nhất: `const SYMBOLS={}` (dòng 579), đăng ký bằng hàm:

  `reg(key, label, cat, prefix, vars, opt)` — mỗi ký hiệu gồm: khóa, nhãn tiếng Việt, nhóm (category),
  tiền tố tag (V, E, P, K, PSV...), và **nhiều biến thể (vars)**, mỗi biến thể có một định nghĩa hình `def`.

- Định nghĩa hình do hàm `S(w,h,body,ports)` tạo ra: `body` là chuỗi SVG nội bộ (path/rect/circle/text...)
  **vẽ quanh gốc tọa độ (0,0)**, dùng hệ lớp chuẩn hoá: `body` (nền + viền chính), `ol` (nét phụ),
  `thin`, `dash`, `grey`, `wat`, `solid`. Khi hiển thị, hàm `sym()` thay các lớp này bằng màu/nét hiện hành
  — nhờ vậy ký hiệu tự đổi theo theme, chế độ đen-trắng và style riêng của từng node.

- **Cổng nối (ports)** có sẵn trong định nghĩa: mặc định 4 cổng W/E/N/S ở giữa các cạnh; nhiều ký hiệu khai
  cổng riêng có nhãn (FEED GAS, LNG, SHAFT...) qua hàm `PT(id,x,y,d,label)`. App còn có cơ chế người dùng
  **tự thêm cổng** (`n.xp`, hàm `xpPort`) và ẩn cổng (`n.hp`) — tức mô hình dữ liệu đã sẵn sàng chứa cổng
  tuỳ chỉnh mà không cần đổi schema.

- Hiện trạng thư viện: **114 ký hiệu** đăng ký bằng `reg()` (chưa tính ký hiệu động: instrument bubbles
  sinh theo chữ cái ISA, tổ hợp bơm–motor qua SHAFT, và khoảng >30 tổ hợp/thiết bị tổng hợp như LNG train),
  chia **14 nhóm** trong `CAT_ORDER` (Bình/Tháp 16, Van 13, Hạ tầng khí 12, Trao đổi nhiệt 10, Phụ kiện 8,
  Máy nén/Quạt/Turbine 7, Package 7, Bơm 3, C&I 3, Điện 2, Vận tải 4, Inline 4, Vào/ra 4, Chú thích 4).
  Định hướng của thư viện hiện tại là **PFD dầu khí thiên về sơ đồ chuỗi khí**, khá mỏng ở mảng P&ID chi tiết.

- Bản vẽ lưu dạng JSON (`nodes` với `type` = khóa ký hiệu, `v` = chỉ số biến thể; `edges` với
  `from/fromPort/to/toPort`), tự lưu localStorage (khóa `pfdstudio.rev6.*`), xuất SVG/PNG/PDF/PPTX.
  **Hệ quả quan trọng:** nếu thêm ký hiệu mới bằng đúng cơ chế `reg()`, bản vẽ cũ và mới hoàn toàn tương thích,
  không phải chuyển đổi định dạng lưu trữ gì cả.

## 2. Đối chiếu với CSDL mở v1.0

| Nguồn trong CSDL | Số lượng dùng được | Mức tương thích | Ghi chú |
|---|---|---|---|
| Wikimedia ISO 10628-2 (SVG) | 457 ký hiệu SVG (421 Public Domain) | **Cao** — cùng "ngôn ngữ" vector | SVG Inkscape: cần bóc metadata, chuẩn hoá fill/stroke đen-trắng về hệ lớp của app, căn gốc về (0,0), suy ports |
| Radica / Capital X (SVG) | 460 ký hiệu × (SVG+PNG+JPG+DXF+DWG), có biến thể ISO & PIP | **Cao về hình, cần dọn** | SVG sạch hơn, kích thước đồng đều 300×300; giấy phép "free + ghi nguồn" |
| draw.io stencils (XML shape) | 87 shape | Trung bình | Hình nằm trong XML riêng của draw.io, phải trích path — chỉ nên lấy khi thiếu |
| KiCad pnid-lib (GPL-3.0) | 67 | Thấp + vướng GPL | Định dạng KiCad, không khuyến nghị cho sản phẩm đóng |
| TikZ (9 shape) | 9 | Thấp | Không đáng công chuyển đổi |
| Draftsperson DWG (150 block) | 150 | Chưa dùng ngay | Cần tách block bằng công cụ CAD; có sẵn lớp PID_PORT (353 điểm nối) — là nguồn ports tốt nhất về sau |
| Bản vẽ mẫu + tài liệu | 289 + 25 | Không phải ký hiệu | Dùng làm mẫu (templates) và tài liệu tra cứu trong app |

**Lấp khoảng trống cho nhau:** thư viện hiện tại của app mạnh ở PFD chuỗi khí (platform, LNG, trạm nén, vận tải) —
phần mà CSDL mở gần như không có; ngược lại CSDL mở rất mạnh ở **P&ID chi tiết** mà app đang mỏng:
van các loại (170 mục liên quan), thiết bị đo & điều khiển (92), phụ kiện đường ống (239), phân tách/lọc (75),
tháp/cột (35), bơm (35), máy nén (48), trao đổi nhiệt (90), bồn chứa (87). Tích hợp xong, thư viện sẽ tăng
từ ~114 lên **khoảng 500–900 ký hiệu** tuỳ mức lọc (xem lộ trình).

## 3. Thử nghiệm tích hợp (POC) — đã làm và kiểm chứng

- Script chuyển đổi `convert_svg_to_studio_v0.1.py` (trong thư mục `07_build_scripts/` của gói CSDL):
  đọc SVG Wikimedia → bóc defs/metadata/thuộc tính Inkscape → phân loại nét vẽ về lớp `body/ol/solid`
  → bọc `<g transform>` căn giữa về (0,0) và co giãn cạnh dài nhất về ~72 đơn vị của app → sinh lệnh `reg()`.
- Đã chuyển 5 ký hiệu mẫu: van cổng, van điều khiển, bơm ly tâm, trao đổi nhiệt chung, bồn chứa chung
  (file kết quả: `poc_wikimedia_symbols_v0.1.js`).
- Đã chèn vào **bản sao** của app thành **Rev.7.1-POC** (thêm 1 nhóm mới "Thư viện ISO 10628-2 (mở)"
  vào `CAT_ORDER`, đăng ký trước mục Bình/Tháp, tiêu đề file ghi rõ POC) — file gốc Rev.7 không đổi.
- Kiểm chứng bằng Node.js (không chỉ nhìn bằng mắt):
  1. Toàn bộ khối script của bản POC **kiểm tra cú pháp đạt** (882.066 ký tự JS).
  2. Chạy thật phần đăng ký thư viện: cả 5 ký hiệu POC đăng ký thành công, đúng nhãn/nhóm/kích thước
     (72×72, bơm 72×38,4) và có đủ 4 cổng mặc định W/E/N/S.
- **Giới hạn của POC cần nói rõ:** (a) cổng đang là cổng mặc định ở giữa cạnh — với ký hiệu như bơm ly tâm,
  cổng hút/xả thật không nằm ở giữa cạnh, cần đặt tay ở bước sản xuất; (b) một số SVG gốc dùng nét mảnh
  thuần stroke không fill (ví dụ thân bơm) thì bộ phân loại lớp chưa gán `class` cho nét chính — vẫn hiển thị
  được nhờ style gốc còn giữ một phần, nhưng khi app đổi theme/đen-trắng sẽ không đồng bộ hoàn toàn;
  cần vòng rà soát trực quan từng ký hiệu ở bước chuyển đổi hàng loạt.

## 4. Rủi ro và điểm cần quyết khi làm thật

1. **Trùng lặp khái niệm:** hai thư viện sẽ có nhiều ký hiệu cùng chức năng (ví dụ van cổng của app vs của ISO).
   Nên giữ cả hai dưới dạng *biến thể* của cùng một mục hoặc hai mục cạnh nhau có hậu tố nguồn — em đề xuất:
   ký hiệu của app giữ nguyên vị trí, ký hiệu mở thêm vào nhóm riêng theo bộ ISO 10628-2 để anh đối chiếu chọn.
2. **Kích thước file:** app đang 936 KB (đã gồm font nhúng base64). Nhúng thêm ~900 ký hiệu dạng body SVG
   ước tính cộng thêm ~0,4–1,5 MB. Vẫn ổn cho 1 file HTML duy nhất; nếu muốn gọn hơn thì tách thư viện mở
   thành file JS đi kèm (`pfd-studio-symbols-iso.js`) — nhưng như vậy mất tính "1 file" của app. Cần anh chốt.
3. **Giấy phép khi phân phối:** chỉ nên nhúng nhóm Public Domain/CC0 (Wikimedia, 421+ file) ở đợt 1;
   Radica cần ghi attribution trong mục Giới thiệu của app; CC BY-SA và GPL nên để ngoài gói chính.
4. **Chất lượng nét:** ký hiệu ISO trong CSDL là bản vẽ "đúng chuẩn để đọc", còn ký hiệu của app được vẽ tối ưu
   cho lưới và độ dày nét của app. Sau chuyển đổi hàng loạt cần một vòng QA trực quan (render thumbnail toàn bộ,
   soi các ký hiệu lỗi) — có thể tự động hoá bằng cách xuất ảnh chụp thư viện từ chính app.

## 5. Lộ trình tích hợp đề xuất

- **Đợt 1 (lõi P&ID):** chuyển đổi ~250–300 ký hiệu Wikimedia Public Domain thuộc các nhóm app đang mỏng
  (van, C&I, phụ kiện, inline, tách/lọc) + đặt ports tay cho nhóm này + QA thumbnail.
- **Đợt 2 (thiết bị chính):** bồn/tháp, trao đổi nhiệt, bơm, máy nén theo ISO 10628-2 + ports tay.
- **Đợt 3 (mở rộng):** bộ Radica (thêm biến thể PIP), tách block Draftsperson DWG kèm lớp PID_PORT,
  và nếu cần thì nạp tiếp LibreOffice Gallery ISO 10628 (>300 ký hiệu, chưa tải được ở đợt dựng CSDL).

**File bàn giao kèm báo cáo này:**
- `pfd-studio-26.10.30-Rev.7.1-POC.html` — bản sao app đã tích hợp 5 ký hiệu mẫu (mở trực tiếp bằng trình duyệt để thử kéo thả từ nhóm "Thư viện ISO 10628-2 (mở)").
- Script chuyển đổi và file JS ký hiệu mẫu nằm trong gói CSDL: `07_build_scripts/convert_svg_to_studio_v0.1.py`, `07_build_scripts/poc_wikimedia_symbols_v0.1.js`.
