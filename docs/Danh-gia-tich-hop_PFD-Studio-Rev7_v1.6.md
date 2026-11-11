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

---

## Bổ sung v1.3 (2026-11-11) — Đợt bổ sung dần 2: draw.io + KiCad, và tải được LibreOffice Gallery

Đạt nhắc tiếp tục bổ sung dần theo tinh thần "add hết vào". Đợt này:

- **draw.io PID stencils: +87 ký hiệu** (`data/symbols-drawio_v1.0.js`, giấy phép Apache-2.0 của draw.io).
  Bộ chuyển đổi mới `convert_more_sources_v0.1.py` dịch định dạng mxGraph (path/rect/ellipse/text + lệnh tô
  fill/stroke/fillstroke). Điểm đáng giá: **85/87 ký hiệu mang theo cổng nối THẬT** từ `<constraint>` W/E/N/S của nguồn —
  chất lượng cổng cao hơn hẳn quy tắc suy đoán của đợt 1.
- **KiCad pnid-lib: +61 ký hiệu** (`data/symbols-kicad_v1.0.js`). Hai đính chính so với báo cáo CSDL v1.0:
  (1) số ký hiệu gốc thực tế là **61**, không phải 67 (đợt dựng catalog đếm lẫn unit con);
  (2) bộ này là thư viện của đội tên lửa sinh viên (SpaceTeam) — lẫn cảm biến/tên lửa, không thuần P&ID nhà máy.
  **49/61 ký hiệu có cổng thật từ chân pin** (vị trí + góc). Giấy phép **GPL-3.0** nên để file riêng, ghi rõ ở header —
  khi nào đóng gói sản phẩm phân phối thì Đạt quyết giữ hay bỏ file này. Lưu ý QA: các unit con của một ký hiệu
  được gộp khi chuyển đổi, một số ký hiệu có thể vẽ chồng hai biến thể — cần rà soát trực quan.
- **LibreOffice "Gallery for P&ID according to ISO 10628": ĐÃ TẢI ĐƯỢC** bản 1.0.0 (`.oxt` 1,86 MB, giấy phép LGPL,
  >300 ký hiệu) — đợt dựng CSDL chưa lấy được vì không lần ra link; lần này lần theo mã trang listing tìm được
  trang chi tiết (show/99612) và link tải chính thức. File gốc đã lưu vào CSDL (`08_more_sources/`).
  **Chưa chuyển đổi được trong đợt này**: gallery đóng gói dạng nhị phân SGA3 (.sdg/.sdv) của LibreOffice,
  không có SVG/XML bên trong để bóc như các nguồn khác. Muốn khai thác phải mở bằng LibreOffice trên máy thật
  rồi xuất từng theme ra vector — ghi vào danh sách việc dần dà, cần một phiên có LibreOffice.
- Tổng thư viện sau đợt 2: **1.172 ký hiệu / 44 nhóm** (114 gốc + 1.058 nạp ngoài). Kiểm chứng Node:
  1.058/1.058 ký hiệu đăng ký thành công, key không trùng, 0 phần tử vẽ thiếu class hiển thị ở cả 2 file mới.
  Gói cập nhật: `PFD-Studio_Package_v1.1.zip` (617 KB) — file chạy vẫn Rev.8, thư mục `data/` nay có 4 file.

**Còn lại trong danh sách dần dà:** rà soát trực quan bằng thumbnail (gồm cả vụ gộp unit của KiCad),
đặt tay cổng thật cho thiết bị chính của đợt Wikimedia/Radica, dịch nhãn tiếng Việt,
khai thác gallery LibreOffice (cần LibreOffice), tách 150 block Draftsperson DWG (cần công cụ CAD).

---

## Bổ sung v1.4 (2026-11-11) — Chuẩn hoá toàn bộ theo biên bản QA (bộ chuyển đổi v0.4)

Đạt gửi biên bản chạy thử trình duyệt cả 910 ký hiệu + soi 60 ảnh mẫu. Em đã xử lý **tận gốc** bằng bộ chuẩn hoá
mới `normalize_convert_all_v0.4.py`, áp thống nhất cho **cả 4 nguồn** (kể cả hai bộ mới draw.io/KiCad theo yêu cầu của Đạt):

**Nguyên nhân gốc của lỗi "Radica đặc đen"** (biên bản chỉ nêu triệu chứng): ở v0.3, thẻ `<symbol>` bị vẽ **2 lần** —
một lần trực tiếp (lúc đó fill kế thừa từ thẻ `<svg>` gốc bị mất, rơi về mặc định SVG là đen → gán nhầm lớp `solid`),
một lần qua `<use>` (đúng là thân trắng). Hai lớp chồng nhau vừa gây đặc đen, vừa làm nét và chữ (SIGNAL/PIPE) dày nhoè,
vừa phình file. v0.4: gieo kế thừa từ thẻ `<svg>` gốc, `<symbol>` chỉ vẽ qua `<use>` đúng 1 lần, tách path đa nhánh,
**hình khép kín → lớp `body` (tô màu được)**, chỉ fill màu/đen thật mới là `solid`, chữ không bao giờ mang stroke,
khử phần tử trùng, **khung ôm sát hình thật** (hết sai tỉ lệ/vẽ quá nhỏ), **cổng suy từ đầu nét thật chạm mép khung**.

Kết quả đối chiếu biên bản (kiểm chứng bằng Node + thống kê trên dữ liệu mới):
- Radica: lớp `solid` còn **59** phần tử (fill đen thật như mũi tên/điểm đặc); **501 phần tử `body`** — tô màu nền được.
  Kiểm tra mẫu: vòng tròn thiết bị đo = `body` ✓; bồn basin: thân chính = `body`, hai nét mép = `ol` ✓;
  van NO: 4 phần tử trùng → còn đúng 2 ✓. Cổng theo đầu nét thật: **266/317 (84%)**.
- Wikimedia: cổng thật **366/449 (82%)** (biên bản cũ: 98/450 cổng khai báo theo khung viewBox lệch).
  Đã bỏ `wm_symbols_iso_10628` (tờ bảng 394 phần tử) theo quy tắc >250 phần tử; wm_symbol_compressor và
  wm_pid_combiketel **không cần bỏ** — lỗi tỉ lệ của chúng do khung viewBox, chuẩn hoá ôm sát hình đã sửa.
- Dọn dữ liệu: bỏ 116 mảnh đường/tín hiệu Radica (trùng công cụ vẽ ống), 27 bản PIP trùng ISO (14 theo hash hình + 13 theo tên),
  7 tờ legend; sửa **17 nhãn tiếng Đức** sang tiếng Anh; gắn trường `lic` cho từng ký hiệu.
- Rủi ro mất `data/`: giữ hình thức gói thư mục như Đạt đã chốt, nhưng file chạy **Rev.8.1** nay có **băng cảnh báo đỏ**
  khi nạp thiếu thư viện (<500 ký hiệu) — không còn mất thiết bị trong im lặng. (Phương án nhúng 1 file vẫn để ngỏ nếu Đạt đổi ý.)
- Giấy phép: thêm `LICENSE-attribution_v1.0.md` vào gói, tóm tắt điều kiện từng nguồn.
- Theo yêu cầu trước đó của Đạt, bộ Radica cũng đã xuất thành **317 file .svg độc lập chuẩn hoá**
  (`Radica_SVG_Fixed_v1.0.zip`): thân thiết bị có fill trắng + viền đen tường minh, mở ở đâu cũng tô màu được;
  cả 317 file kiểm tra XML hợp lệ. Có 29 file vốn là ký hiệu nét hở (agitator, hood...) — không có thân kín để tô,
  nhưng nét viền đầy đủ và sạch.

Tổng thư viện sau chuẩn hoá: **914 ký hiệu mở** (Wikimedia 449 + Radica 317 + draw.io 87 + KiCad 61) / 42 nhóm,
đăng ký kiểm chứng 914/914, không trùng khóa, 0 phần tử chữ mang stroke. Gói: `PFD-Studio_Package_v1.2.zip` (586 KB),
file chạy Rev.8.1 + 4 file data v1.1 + file giấy phép.

**Còn lại:** rà soát trực quan từng ký hiệu vẫn nên làm một vòng (biên bản soi 60/910); cổng của ~16–18% ký hiệu
không có đầu nét chạm mép vẫn là cổng mặc định ở mép khung ôm sát (đã sát hình hơn nhiều so với khung viewBox cũ);
nhãn trùng giữa các nguồn khác nhau (25 nhãn Wikimedia ↔ Radica) giữ nguyên vì là hai bộ chuẩn khác nhau.

---

## Bổ sung v1.5 — Sửa toàn bộ tồn tại theo biên bản QA v1.2 (gói v1.3, file chạy Rev.8.2)

Đạt chạy lại toàn bộ kiểm tra trên Rev.8.1 (xem mẫu 90 ký hiệu): Radica và draw.io đã tốt; Wikimedia còn 65 ký hiệu
đặc đen (nhiều hơn v1.0), 8 ký hiệu gần rỗng, vài ký hiệu sai tỉ lệ tới 3 lần khung; KiCad ~42/61 ký hiệu nét dày
thành khối đen; mở bản vẽ thiếu `data/` vẫn mất thiết bị lặng lẽ (chưa thấy cảnh báo phát huy tác dụng khi MỞ BẢN VẼ);
GPL-3.0 của KiCad và ghi nguồn CC BY-SA chưa liệt kê từng tác giả. Toàn bộ đã sửa trong đợt này bằng bộ chuyển đổi
mới `normalize_convert_all_v0.5.py` + `build_runner_rev82_v0.1.py`:

**Nguyên nhân gốc mới tìm ra (đều kiểm chứng trực tiếp trong file SVG nguồn):**
1. *Wikimedia đặc đen tăng do chính v0.4:* v0.4 tách path đa nhánh (compound path) thành từng nhánh rồi tô riêng —
   các "lỗ" (vùng âm) của ký hiệu kiểu Regler/Luftfilter bị lấp thành khối đen. Nguồn như `Regler.svg` là MỘT path
   duy nhất gồm đường bao ngoài + các nhánh âm; trình duyệt vẽ đúng nhờ hướng nét/fill-rule. v0.5 giữ nguyên compound
   path, bảo toàn `fill-rule`; hình kín tô đen lớn hoặc đa nhánh → lớp `body`, chỉ chi tiết đặc nhỏ (chấm, đầu mũi tên) là `solid`.
2. *Sai tỉ lệ/lòi khung:* bbox cũ bỏ qua độ phình của cung tròn (chỉ lấy 2 đầu mút cung); `<use>` trỏ tới phần tử
   thường (không phải `<symbol>`) bị bỏ qua hoàn toàn; `<use>` của `<symbol>` có viewBox bị mất hệ số co giãn;
   toạ độ chữ nằm ở `<tspan x/y>` bị đọc sai về (0,0) và bề rộng chữ không vào bbox (đây là lỗi của
   `rc_function_exponential` 88×124 — nay đúng 72×72, chữ xⁿ nằm gọn trong khung).
3. *Nét tóc/nét béo theo nguồn:* phép co giãn chuẩn hoá trước đây bọc trong `<g transform=scale>` làm độ dày nét
   trong app bị nhân thêm hệ số đó (nguồn 841 đơn vị → nét tóc; nguồn nhỏ → nét béo, cũng là cơ chế làm KiCad đen khối).
   v0.5 "nấu" phép chuẩn hoá thẳng vào toạ độ — mọi ký hiệu nhập đều có độ dày nét đúng chuẩn app như ký hiệu gốc.
4. *Phần tử lạc:* vài file chứa phần tử nhỏ nằm rất xa cụm hình chính (vd arc gương ở (−503,−423) trong
   `Screening device, basket reeltype`) làm khung phình và ký hiệu thu thành một chấm — v0.5 cắt phần tử lạc
   theo cụm hình chính (27 phần tử ở vòng này) và tính lại khung; ký hiệu trên nay vẽ đầy đủ.

**Đính chính so với báo cáo v1.4:** v1.4 ghi `wm_pid_combiketel` "không cần bỏ" — QA v1.2 cho thấy nó vẫn hỏng
(trông như ảnh mạch in). Đợt này BỎ hẳn: nó là sơ đồ chi tiết cả thiết bị combi-boiler (40 path + 14 text),
không phải ký hiệu đơn. Tương tự, `wm_symbols_iso_10628` len trở lại vì gộp compound path làm bộ lọc
">250 phần tử" hết tác dụng — đã đưa vào danh sách bỏ tường minh.

**Kết quả (kiểm chứng bằng render raster toàn bộ 842 ký hiệu bằng CairoSVG + đếm mực in, và Node):**
- Wikimedia 449 → **441**: bỏ 7 file nguồn hỏng có `<use>` trỏ tới id không tồn tại (gồm `Gear type, gearwheels type`
  với 49/49 use hỏng), combiketel, tờ bảng ISO. Ký hiệu còn `solid` mà không có `body`: **53 → 2**.
  Render: **0/441 ký hiệu đen khối (>55% mực), 0 gần rỗng**; ký hiệu "nặng" nhất chỉ 35,8% mực (buồng trộn — hình đặc thật).
  Cổng thật 359/441 (81%). Nhãn: 7 cặp nhãn trùng được thêm hậu tố thư mục nguồn (14 nhãn), 17 nhãn thô
  "P&ID X8011" → "ISO symbol X8011", dịch nốt "Regler" và "Abzweig Verteilung" (tổng 19 nhãn Đức đã dịch).
- Radica 317 → **314** (bắt thêm 3 bản PIP trùng nhờ hash trên toạ độ đã nấu). Render: **0 đen khối, 0 rỗng**;
  nhóm vòng tròn đo lường DCS/PLC/discrete và nhóm hàm (Σ, xⁿ...) nay nằm gọn trong khung 72×72. Cổng thật 263/314 (84%).
  Bộ SVG độc lập xuất lại: `Radica_SVG_Fixed_v1.1.zip` (314 file).
- draw.io **87** giữ nguyên chất lượng (0 lỗi render), cổng thật 85/87.
- **KiCad: bỏ khỏi gói** (61 ký hiệu) — đúng gợi ý của biên bản: GPL-3.0 không hợp phân phối đóng + ~42/61 ký hiệu
  hỏng do nét dày. File dữ liệu cũ chỉ còn trong kho dự án.
- **Mất thiết bị khi thiếu data/: giải quyết triệt để bằng nhúng.** File chạy **Rev.8.2 là MỘT file HTML duy nhất**
  (1,7 MB) chứa cả app + 842 ký hiệu — sao chép riêng file đi đâu cũng đủ thư viện. Thêm nữa, `normalizeState`
  đã được vá: node thuộc loại ký hiệu lạ (bản vẽ từ nguồn khác) được ghi lại và hiện **băng cảnh báo đỏ nêu rõ
  số thiết bị + tên loại thiếu** khi mở bản vẽ, thay vì bị lọc bỏ lặng lẽ như trước (đây chính là chỗ biên bản
  chỉ ra: cảnh báo cũ chỉ kiểm tra lúc nạp trang, không kiểm tra lúc mở bản vẽ).
- **Giấy phép:** `LICENSE-attribution_v1.1.md` liệt kê **từng ký hiệu CC BY-SA kèm tác giả** (33 ký hiệu:
  18 bản CC BY-SA 4.0, 15 bản 3.0; tác giả lấy từ metadata Wikimedia Commons) + 2 ký hiệu CC0; Wikimedia còn lại
  406 ký hiệu Public domain. Radica ghi nguồn theo yêu cầu của hãng; draw.io Apache-2.0.

**Tổng thư viện gói v1.3: 842 ký hiệu mở** (Wikimedia 441 + Radica 314 + draw.io 87) + 114 ký hiệu gốc của app.
Kiểm chứng Node trên Rev.8.2: 5/5 khối script đúng cú pháp, đăng ký 842/842, 0 trùng khóa, không còn thẻ
`<script src="data/...">`, vá cảnh báo ký hiệu lạ có mặt.

**Còn lại (không thuộc danh sách lỗi của biên bản):** rà soát trực quan từng ký hiệu một vòng nữa vẫn đáng làm
(biên bản soi mẫu 90/842); ~16–19% ký hiệu chưa có cổng từ đầu nét thật vẫn dùng cổng mặc định ở mép khung ôm sát;
nhãn vẫn là tiếng Anh (chưa dịch Việt); LibreOffice Gallery và thư viện DWG của Draftsperson chưa chuyển đổi được.

---

## Bổ sung v1.6 — QA trực quan toàn bộ + nhãn tiếng Việt + LibreOffice Gallery (gói v1.4, file chạy Rev.8.3)

Đạt duyệt tiếp tục làm dần các việc còn lại. Ba việc đã hoàn thành trong đợt này:

**1. Rà soát trực quan TOÀN BỘ 842 ký hiệu (không còn soi mẫu).**
Lisa dựng contact sheet cho cả thư viện và xem từng ký hiệu, phóng to kiểm chứng các ca nghi ngờ bằng cách
đối chiếu file SVG nguồn. Tìm và sửa được 4 lỗi thật bằng bộ chuyển đổi mới `normalize_convert_all_v0.6.py`:
- *Mất nét của băng tải (bug của chính quy tắc cắt phần tử lạc ở v0.5):* quy tắc cũ chọn hạt nhân cụm theo
  DIỆN TÍCH bbox nên các nét thẳng (diện tích 0) của `Conveyer, belt type` bị cắt mất 3/4. Quy tắc mới
  leave-one-out: chỉ cắt khi bỏ phần tử đi làm cạnh dài khung co ≥ 50% mà phần tử ≤ 15% khung còn lại.
- *Vệt đen lem ở Cooler/Heater symbol:* đường bao kiểu stroke-to-path của Inkscape (hình kín dài-mỏng)
  bị ép thành `body` nên thêm viền làm nét phình đôi. Nay: tỉ lệ diện tích hình/bbox < 0,20 → `solid`.
- *Mất biến thể van plug NC:* ở v0.5 cả hai bản NO/NC cùng thành `body` nên trùng hệt nhau và NC bị khử
  trùng oan. Nay fill đen chỉ thành `body` khi là hình bao chính (≥ 35% diện tích khung VÀ đặc ruột ≥ 0,6)
  hoặc compound path — dấu đặc nội bộ giữ `solid`: NO = nơ trắng, NC = nơ đen, đủ cả hai.
- *Bỏ mẫu biểu đồ EMSR (DIN 19227)* có sẵn chữ placeholder tiếng Đức — không phải ký hiệu đơn.
Kết quả: Wikimedia 440, Radica 317 (khôi phục đủ cặp NO/NC), draw.io 87 = **844 ký hiệu**;
render raster toàn bộ: **0 đen khối, 0 gần rỗng, 0 lỗi**. 12 ký hiệu Wikimedia còn `solid` không `body`
đã phóng to kiểm chứng từng cái — đều là hình đặc đúng theo nguồn (đĩa bịt, cút thông gió, lớp đệm chấm...).

**2. Nhãn tiếng Việt cho toàn bộ thư viện.**
Cơ chế của app: nhãn lưu bằng tiếng Việt, từ điển `EN` dịch sang tiếng Anh khi chuyển ngôn ngữ.
Loader của Rev.8.3 đã được vá để hiển thị `labelVi` và tự đăng ký `EN[labelVi] = nhãn Anh gốc`,
nên cả hai chế độ VI/EN đều đúng. Đã dịch **893/893 nhãn** (ba nguồn cũ + LibreOffice), giữ nguyên mã ISA
(PI/TI/FI, DCS, PLC...), trạng thái van dịch rõ (NO = thường mở, NC = thường đóng).
Lưu ý nhỏ ở chế độ EN: 49 nhãn Việt là tên chung cho nhiều biến thể Anh gần nghĩa ở các nguồn khác nhau
(vd "Van bi" cho cả "Ball Valve"/"Ball valve") — app hiển thị một biến thể Anh cho nhóm đó; đúng thiết bị,
chỉ khác cách viết của nguồn.

**3. LibreOffice Gallery ISO 10628 — ĐÃ khai thác được (trước đây tưởng phải có máy thật).**
VM của Lisa có sẵn LibreOffice headless: nạp extension .oxt vào profile riêng, gọi API Gallery qua UNO
và xuất từng ký hiệu bằng `GraphicProvider.storeGraphic` → **314/314 ký hiệu ra SVG vector thật**
(theme A: bình/tháp/nội tạng/máy khuấy 61; B: thiết bị quá trình 123; C: vận chuyển/ống 130; kèm sẵn
tên + mã REG trong tiêu đề Gallery). Chuyển đổi bằng cùng bộ máy v0.6, khử trùng hai lớp:
115 ký hiệu trùng mã REG với Wikimedia, 150 trùng nhãn → **giữ 49 ký hiệu MỚI**, nổi bật là họ van bi
nhiều ngả (ba ngả lỗ L/T, bốn ngả, bốn ngả L/T/L đôi), bình vỏ áo + ống xoắn gia nhiệt, đĩa tháp các loại,
cánh khuấy kiểu cổng, bộ ký hiệu "đặc tính thiết bị" (bánh răng — thay đúng ký hiệu gear hỏng của Wikimedia),
thiết bị giãn nở khí, rotameter/venturi kèm vòng FI. Đã xem trực quan cả 49: đạt.
Giấy phép của nguồn này là **LGPL-3.0** — đã ghi rõ trong `LICENSE-attribution_v1.2.md` (mục 4) để Đạt cân
nhắc khi phân phối; file dữ liệu tách riêng (`symbols-libreoffice_v1.0.js`) nên gỡ ra rất nhanh nếu cần.

**Tổng thư viện gói v1.4: 893 ký hiệu mở** (Wikimedia 440 + Radica 317 + draw.io 87 + LibreOffice 49)
+ 114 ký hiệu gốc. Kiểm chứng Node trên Rev.8.3: 6/6 khối script đúng cú pháp, đăng ký 893/893,
0 trùng khóa, 893/893 có nhãn Việt, vá cảnh báo ký hiệu lạ còn nguyên.
Bộ SVG Radica độc lập xuất lại theo chuẩn v0.6: `Radica_SVG_Fixed_v1.2.zip` (317 file).

**Còn lại:** thư viện DWG của Draftsperson (150 block) vẫn chưa tách được (cần công cụ CAD đọc DWG);
mỗi ký hiệu nhập vẫn chỉ có 1 biến thể "A"; cổng nối của ~16–19% ký hiệu chưa có đầu nét thật vẫn là
cổng mặc định ở mép khung ôm sát.
