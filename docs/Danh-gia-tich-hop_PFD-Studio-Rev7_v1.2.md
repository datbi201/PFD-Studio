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

---

## Bổ sung v1.1 (2026-11-11) — Đạt chốt hình thức bàn giao: gói thư mục + data rời

Đạt quyết định: **app bàn giao cuối cùng là 1 thư mục** gồm file chạy HTML và 1 thư mục nhỏ `data/` chứa dữ liệu;
chủ trương mở trên trình duyệt, chạy **offline**, không cần cài đặt. Quyết định này thay cho phương án "1 file duy nhất"
nêu ở mục 4.2 — hướng tách data thắng, và rất hợp với tích hợp thư viện: mỗi đợt bổ sung ký hiệu chỉ là **thay/cộng
thêm file trong `data/`**, không đụng vào file chạy.

Đã dựng lại bản POC theo đúng cấu trúc này (thư mục `PFD-Studio_Package/`, đóng gói `PFD-Studio_Package_v0.1.zip`):

- `PFD-Studio_Rev.7.2-POC.html` — file chạy (từ Rev.7 gốc; chỉ thêm 1 thẻ nạp data + 1 đoạn nạp thư viện ~10 dòng).
- `data/symbols-iso10628_poc_v0.1.js` — dữ liệu 5 ký hiệu mẫu dạng biến toàn cục `window.PFD_EXTRA_SYMBOLS`.

**Điểm kỹ thuật bắt buộc khi chạy offline bằng `file://`:** file data phải là **file .js nạp bằng thẻ `<script src>`**.
Không được dùng `fetch()` đọc JSON hay ES module — Chrome/Firefox chặn cả hai trên `file://` (lỗi CORS origin `null`),
app sẽ mất trắng thư viện mà không báo lỗi rõ ràng. Cách `<script src>` cổ điển không bị chặn.

Kiểm chứng bản 7.2-POC: thẻ nạp data đứng trước script chính; cú pháp toàn bộ script đạt; chạy thật khâu nạp —
nhóm "Thư viện ISO 10628-2 (mở)" được thêm vào `CAT_ORDER` (15 nhóm) và cả 5 ký hiệu đăng ký thành công với
đủ cổng mặc định. Cơ chế nạp cũng tự bỏ qua ký hiệu trùng khóa, nên các file data đợt sau cộng dồn an toàn.

---

## Bổ sung v1.2 (2026-11-11) — Đợt tích hợp toàn bộ SVG: gói Package v1.0 (Rev.8)

Đạt duyệt chạy tích hợp ("dần dà add hết vào"). Đợt này đã chuyển đổi **toàn bộ phần SVG dùng được của CSDL**:

- **910 ký hiệu**: Wikimedia 450 + Radica 460 (chỉ bỏ 7 tờ legend ISO nguyên trang — không phải ký hiệu).
  Cộng 114 ký hiệu gốc, thư viện trong app thành **1.024 ký hiệu / 37 nhóm** (14 nhóm gốc + 13 nhóm "ISO · ..." + 10 nhóm "Radica ISO/PIP · ...").
- File data: `data/symbols-wikimedia_v1.0.js` (618 KB) + `data/symbols-radica_v1.0.js` (471 KB);
  file chạy: `PFD-Studio_Rev.8.html` (nền Rev.7, thêm 2 thẻ nạp data + đoạn nạp như bản 7.2).
  Gói đóng: `PFD-Studio_Package_v1.0.zip` (606 KB) — cấu trúc thư mục đúng như Đạt chốt, mở offline bằng trình duyệt.
- Bộ chuyển đổi nâng lên **v0.3** (`convert_svg_batch_v0.3.py`): xử lý kế thừa fill/stroke qua thẻ cha và `<use>/<symbol>`
  của Radica, màu lạ quy về mực chuẩn, nét đứt -> lớp `dash`, và vá cuối: phần tử mất hết thông tin tô thì gán lớp `ol`
  thay vì để fill đen mặc định của SVG. Nhờ đó sau 3 vòng sửa: **0 / 6.759 phần tử vẽ thiếu thông tin hiển thị**
  (bản nháp đầu: 4.284). Ports theo nhóm: van W/E/N, phụ kiện và đường ống W/E, còn lại 4 cổng mặc định.
- Kiểm chứng: cú pháp toàn bộ đạt; chạy thật khâu nạp bằng Node — 910/910 ký hiệu đăng ký, key không trùng,
  nhóm và ports đúng quy tắc ở các ký hiệu soi mẫu (van cổng, bồn Radica, van Radica...).

**Việc "dần dà" còn lại** (chất lượng tăng dần, không chặn dùng): (1) rà soát *trực quan* từng ký hiệu bằng ảnh
thumbnail thư viện — một số ký hiệu gốc phức tạp (có chữ/hình chi tiết) có thể chưa đẹp ở cỡ app; (2) đặt ports
*đúng vị trí thật* cho nhóm thiết bị chính (hiện ports theo quy tắc nhóm + cổng mặc định giữa cạnh);
(3) dịch nhãn ký hiệu sang tiếng Việt (hiện nhãn tiếng Anh từ catalog, tìm kiếm vẫn chạy);
(4) các nguồn chưa ở dạng SVG: block Draftsperson DWG (150), stencils draw.io (87), LibreOffice Gallery (>300, chưa tải được).
