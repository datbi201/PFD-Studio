# Yêu cầu triển khai: Module "Vector" (vẽ vector kiểu Illustrator) cho PFD Studio — Rev.6

## 0. Bối cảnh — ĐỌC KỸ TRƯỚC KHI SỬA BẤT CỨ GÌ

PFD Studio là **một file HTML duy nhất** (hiện tại: `pfd-studio-26.10.26-Rev.5.html`), chạy
hoàn toàn offline trong trình duyệt, không cần cài đặt. Người dùng là kỹ sư dầu khí, **khiếm
thị, dùng Text-to-Speech**, nên code phải giữ các thuộc tính ARIA, thông báo trạng thái dạng
văn bản, và thao tác bàn phím đầy đủ đã có.

Mã nguồn **không nằm trong một file duy nhất khi phát triển** — nó được lắp ráp từ nhiều file
JS nhỏ bằng một script Python, rồi chèn vào một khung HTML. Thư mục làm việc hiện tại:

```
/tmp/pfd/r5/
├─ base5.html          # khung HTML, chèn JS tại chỗ đánh dấu /*@@JS@@*/
├─ assemble5.py         # nối các file JS theo ĐÚNG THỨ TỰ liệt kê trong biến `order`
├─ fonts.js             # font Liberation nhúng dạng base64 (dùng cho PDF vector)
├─ pipedb.js            # cơ sở dữ liệu quy cách ống
├─ lib/lib0.js … lib4c.js
├─ en/ui.js, en/cats.js, en/extra.js, en/rev5.js   # từ điển dịch tiếng Anh (khoá = chuỗi tiếng Việt)
├─ js/
│  ├─ 00_core.js        # hàm _() dịch, hằng số nền tảng
│  ├─ 10_state.js        # state, SHAPE_T, CAD_UNITS, normalizeState, autosave
│  ├─ 20_geom.js         # hình học cơ bản (đường ống PFD)
│  ├─ 30_draw.js         # render SVG (shapeMarkup, shapeBox, shapeGeomEl…)
│  ├─ 40_ui.js            # bắt sự kiện chuột/bàn phím PFD, kéo thả, chọn
│  ├─ 50_props.js        # panel thuộc tính bên phải
│  ├─ 60_io.js            # lưu/mở JSON, xuất SVG/PNG, buildBody (gộp nội dung để in/PDF)
│  ├─ 65_pdf.js           # BỘ GHI PDF VECTOR TỰ VIẾT (SVG → PDF), nhúng font Liberation subset
│  ├─ 66_help.js          # cửa sổ "Thông tin / Trợ giúp" — CÓ TAB CẦN THÊM CHO MODULE MỚI
│  ├─ 70_layout.js        # tự bố trí, tránh chồng lấn (PFD)
│  ├─ 80_boot.js          # khởi động, cài đặt, theme, ngôn ngữ — PHẢI SỬA CUỐI CÙNG TRONG ORDER
│  ├─ 85_cadgeo.js        # hình học cho module SimCAD (arc, dim, hatch…)
│  ├─ 90_cad.js           # state, snapping, dòng lệnh, overlay của SimCAD
│  ├─ 91_cadcmd.js        # tập lệnh SimCAD (CMDS, CAD_ALIAS)
│  ├─ 92_cadio.js         # DXF xuất/nhập của SimCAD
│  └─ 93_under.js         # ảnh nền / nhập PDF scan / dò đường cho SimCAD
└─ test/                  # kiểm thử Playwright, mỗi file test*.js mở `rev5.html` và thao tác qua console
```

Lệnh lắp ráp:
```
python3 assemble5.py <đường_dẫn_file_output.html>
```
nó đọc `order=[...]` trong `assemble5.py`, nối toàn bộ nội dung các file đó lại và thay thế
`/*@@JS@@*/` trong `base5.html`.

**Toàn bộ khai báo cấp cao nhất (function, const, let) nằm chung MỘT PHẠM VI TOÀN CỤC** vì tất
cả các file JS được nối thành một `<script>` duy nhất — không có module/import/export. Vì vậy:
- Không được đặt trùng tên biến/hàm với bất kỳ file nào khác (hãy `grep -rn` trước khi đặt tên).
- `const` dùng ở cấp module chỉ được tham chiếu tại runtime (trong hàm), không được đọc ngay
  khi file nạp, nếu không sẽ gặp lỗi "Temporal Dead Zone" vì thứ tự nối file.

Ứng dụng đã có **hai module**, chuyển đổi bằng nút ở đầu trang (`#modPfd` / `#modCad`):
1. **PFD** — vẽ sơ đồ công nghệ dầu khí (thiết bị, ống, bảng dòng).
2. **SimCAD** (Rev.0) — CAD 2D đơn giản: dòng lệnh kiểu AutoCAD, bắt điểm, lớp, kích thước,
   DXF, ảnh nền/scan.

Hai module này **dùng chung**: khổ giấy, khung tên, hệ thống in/PDF/SVG/PNG, font, theme
sáng/tối, hệ i18n VI/EN, và cơ chế chuyển module (`STORE`, `saveCtx`/`loadCtx`, `setModule`,
`adoptState`).

### TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM
- Không sửa lại cách PFD hay SimCAD hoạt động, không đổi tên hàm/biến dùng chung mà không
  `grep` toàn repo trước.
- Không đổi thứ tự các file đã có trong `order` của `assemble5.py` — chỉ **thêm** file mới vào
  cuối danh sách, **trước** `js/80_boot.js` (vì `80_boot.js` gọi các hàm khởi tạo của mọi module,
  bao gồm module mới bạn sẽ thêm).
- Không đổi hotkey đã gán cho PFD (xem bảng bên dưới) trừ khi phím đó chỉ có tác dụng khi module
  Vector đang mở (xử lý giống cách SimCAD làm: `if(typeof CAD!=="undefined"&&CAD.cmd)…` chỉ chạy
  khi module đó active).
- Không phá bộ test hiện có trong `/tmp/pfd/r5/test/` (xem mục 8).
- Không thêm phụ thuộc mạng bắt buộc. Nếu cần thư viện ngoài (ví dụ để đọc nội dung PDF phức
  tạp hơn mức tự parse), áp dụng đúng pattern đã có ở `js/93_under.js` (`pdf.js` CDN) — **chỉ là
  phương án dự phòng không bắt buộc**, có try/catch, báo lỗi rõ ràng nếu không có mạng.

---

## 1. Yêu cầu chức năng

Thêm **module thứ ba: "Vector"** (đặt tên biến nội bộ `vec`), là một trình vẽ vector 2D tổng
quát lấy cảm hứng từ Adobe Illustrator — về cảm giác thao tác và phím tắt — **không** cần đúng
100% tính năng của Illustrator. Ưu tiên theo thứ tự:

### 1.1. Bắt buộc (Rev.0 của module Vector)
1. **Công cụ chọn** (Selection — phím `V`): chọn/kéo/resize đối tượng bằng khung bao (giống hệt
   PFD hiện có, có thể tái dùng phần lớn code chọn/kéo của `js/40_ui.js`).
2. **Công cụ chọn trực tiếp / sửa node** (Direct Selection — phím `A`): chọn và kéo từng điểm
   neo (anchor) hoặc tay cầm Bézier (handle) của một path.
3. **Công cụ bút (Pen — phím `P`)**: vẽ path bằng các điểm neo nối bằng đoạn thẳng hoặc đường
   cong Bézier bậc 3 (click = góc nhọn, click-kéo = tay cầm đối xứng tạo đường cong mượt, giữ
   Alt khi kéo = tay cầm không đối xứng). `Enter`/`Esc`/chuột phải để kết thúc path (hở);
   click lại vào điểm đầu để đóng path kín. `+`/`-` thêm/xoá điểm neo trên path có sẵn.
4. **Công cụ hình cơ bản**: Hình chữ nhật (`M`), Ellipse (`L`), Đường thẳng (`\`) — vẽ xong tự
   chuyển thành đối tượng path (có thể chỉnh sửa như path bất kỳ bằng Direct Selection).
5. **Công cụ chữ (Type — phím `T`)**: hộp text, chọn font/cỡ/đậm nghiêng/màu — tái dùng hệ
   thống text-node đã có ở PFD/SimCAD nếu phù hợp.
6. **Biến đổi hình học**: Xoay (`R`), Tỷ lệ (`S`), Đối xứng/Lật (`O`), tất cả thao tác bằng tay
   cầm trên khung chọn (giống Illustrator: kéo góc = scale, kéo ngoài góc = rotate) **và** nhập
   số chính xác trong panel thuộc tính (góc xoay độ, % tỷ lệ) — quan trọng với người dùng khiếm
   thị không thao tác chuột chính xác được.
7. **Tô màu & nét vẽ**: màu tô (fill), màu nét (stroke), độ dày nét, kiểu nét đứt, đầu mũi tên —
   tái dùng panel thuộc tính đã có cho shape ở PFD/SimCAD.
8. **Thứ tự lớp (z-order)**: đưa lên trên cùng / xuống dưới cùng / lên một bậc / xuống một bậc
   (`Ctrl+Shift+]` / `Ctrl+Shift+[` / `Ctrl+]` / `Ctrl+[`).
9. **Nhóm/rã nhóm** (`Ctrl+G` / `Ctrl+Shift+G`).
10. **Căn chỉnh & phân bố** (Align/Distribute) — tái dùng logic đã có trong `js/70_layout.js`
    của PFD nếu có thể khái quát hoá được.
11. **Lưới & bắt điểm** tuỳ chọn (không bắt buộc phức tạp như SimCAD, có thể chỉ cần bắt lưới
    đơn giản + Shift để giữ góc 0/45/90° khi vẽ/kéo, giống Illustrator).
12. **Lưu/mở riêng** định dạng `.vec.json` của module, tự lưu (autosave) riêng biệt với PFD và
    SimCAD, theo đúng pattern `STORE`/`saveCtx`/`loadCtx` đã có cho SimCAD.
13. **Xuất**: PDF vector (bắt buộc — dùng lại bộ ghi `js/65_pdf.js`, chỉ cần thêm khả năng ghi
    path Bézier tổng quát nếu writer hiện tại chưa hỗ trợ đủ — kiểm tra trước khi viết thêm),
    SVG, PNG.

### 1.2. Bắt buộc — Nhập & chỉnh sửa file PDF vector có sẵn (phần quan trọng nhất)
- Người dùng kéo-thả (hoặc dùng nút "Mở") một **file PDF** vào module Vector.
- Phần mềm phải **đọc nội dung vector thật sự** của PDF đó (không chỉ hiển thị dưới dạng ảnh
  nền như `js/93_under.js` đang làm cho SimCAD) — nghĩa là phải parse content stream của PDF
  (toán tử `m`, `l`, `c`, `v`, `y`, `re`, `h`, `S`, `s`, `f`, `f*`, `B`, `W`, `n`, màu `rg`/`RG`/
  `k`/`K`/`g`/`G`/`sc`/`SC`/`cs`/`CS`, ma trận biến đổi `cm`, văn bản `BT…ET`/`Tj`/`TJ`/`Td`/
  `Tm`/`Tf`) và chuyển mỗi path/toán tử vẽ thành một đối tượng **path Bézier có thể chỉnh sửa**
  trong hệ shape nội bộ của module Vector (xem mục 2 — mô hình dữ liệu).
- **Phạm vi thực tế chấp nhận được cho Rev.0** (ghi rõ trong code + trong UI khi cảnh báo):
  - Hỗ trợ tốt: PDF do chính PFD Studio xuất ra, hoặc PDF vector "đơn giản" từ Illustrator/
    Inkscape/CAD không có clipping phức tạp, không pattern, không gradient mesh, không
    transparency group lồng nhau, không ICC profile, font nhúng dạng Type1/TrueType/CFF đơn
    giản (không bắt buộc phải tách lại glyph thành path chỉnh sửa được — **được phép** giữ chữ
    nhập vào dưới dạng outline path "đông cứng" không sửa nội dung chữ, miễn là vẫn di chuyển/
    tô màu/xoá được — ghi rõ giới hạn này cho người dùng).
  - Không hỗ trợ (báo lỗi rõ ràng, liệt kê phần bị bỏ qua, theo đúng tinh thần
    `pdfFindImages`/decode lỗi trong `js/93_under.js`): PDF quét ảnh thuần (không có vector —
    hướng người dùng dùng chức năng ảnh nền hiện có của SimCAD thay thế), gradient mesh,
    pattern phức tạp, JavaScript nhúng, biểu mẫu (AcroForm), PDF mã hoá/có mật khẩu, font CID
    phức tạp (CJK) nếu không giải mã được — bỏ qua phần đó, không crash toàn bộ import.
  - Không tự ý dùng dịch vụ OCR/AI trực tuyến nào (người dùng đã quyết định việc đó để sau,
    cần API key riêng — KHÔNG triển khai trong phạm vi yêu cầu này).
- Sau khi nhập, người dùng chỉnh sửa path/text/màu như bất kỳ đối tượng Vector nào khác, rồi
  xuất lại thành PDF vector (dùng `js/65_pdf.js`) — tức là một vòng **import → edit → export**
  hoàn chỉnh.
- Viết thành file mới, ví dụ `js/99_vecpdf.js`, chứa bộ **parser PDF content stream** (tokenizer
  PDF cơ bản: đọc xref/trailer đơn giản — có thể chỉ hỗ trợ PDF không nén dạng object stream
  phức tạp trước, nêu rõ giới hạn — đọc page tree, lấy `/Contents`, giải nén `FlateDecode` nếu
  có (đã có hàm giải Flate trong `js/93_under.js`, **tái dùng nó**, đừng viết lại), tokenize
  theo cú pháp PDF (số, tên `/Name`, chuỗi `(...)`/`<...>`, mảng, dictionary, toán tử).

### 1.3. Không bắt buộc cho Rev.0 (có thể để "chưa làm", ghi rõ trong FAQ/About) nếu hết thời gian
- Pathfinder (hợp/trừ/giao/loại trừ hai path).
- Gradient, mesh, pattern tô.
- Clipping mask.
- Symbol/Instance (đối tượng lặp lại liên kết).
- Chỉnh sửa lại nội dung chữ của text được nhập từ PDF ngoài (chỉ cần di chuyển/xoá/đổi màu).

---

## 2. Mô hình dữ liệu (bám theo cấu trúc `state` đã có)

Hiện tại `state.shapes[]` của PFD/SimCAD có các loại trong `SHAPE_T` (`js/10_state.js`): line,
arrow, rect, ellipse, poly, pen, circle, arc, dim, hatch. Mỗi shape có `pts[]`, `col`, `sw`,
`dash`, `fill`, `fo`, `ah[]`, `lay` (lớp, module SimCAD)…

Cho module Vector, **thêm loại `path`** tổng quát, đại diện mọi hình (kể cả hình cơ bản sau khi
vẽ xong đều quy về `path`):
```
{
  id, t:"path",
  closed: true|false,
  nodes: [
    { x, y, inX, inY, outX, outY, type:"corner"|"smooth"|"asym" }
    // in*/out* là toạ độ TUYỆT ĐỐI của tay cầm Bézier vào/ra node đó;
    // nếu không có tay cầm thì bằng chính x,y (đoạn thẳng)
  ],
  col, sw, dash, fill, fo, lay, z
}
```
Giữ nguyên tinh thần `mapShapePts`/`allShapePts` đã có (dùng để xoay/lật/kéo hàng loạt) — path
mới phải implement cho các hàm này để tái dùng được code xoay/scale/move/copy/paste/nudge hiện
có thay vì viết lại.

Thêm `state.meta.doc="vec"` (giống `"pfd"`/`"cad"`), `state.meta.vec = {...cài đặt riêng...}`
(scale/đơn vị nếu cần, grid, snapAngle…), theo đúng pattern `state.meta.cad` đã có.

---

## 3. Tích hợp vào khung ứng dụng hiện có (bám sát pattern SimCAD)

1. **`js/10_state.js`**: thêm `path` vào `SHAPE_T`, `defaultVec()`, nhánh xử lý trong
   `normalizeState`, `cleanState`/`cleanCad`-tương-đương cho vec, `KEYC_VEC` (khoá localStorage
   autosave riêng, không trùng `pfdstudio.rev5.cad.autosave`).
2. **File mới `js/95_vecgeo.js`**: hình học path Bézier — tính bounding box, hit-test (điểm có
   nằm gần path không, để chọn bằng click), chia nhỏ Bézier để vẽ/hit-test, offset path (nếu
   làm pathfinder sau này), chuyển rect/ellipse/line thành `path`.
3. **File mới `js/96_vec.js`**: state `VEC` (giống `CAD` trong `90_cad.js`), `STORE.vec`,
   `setModule('vec')` (mở rộng hàm `setModule` đã có — **đọc kỹ code hiện tại trước khi sửa**,
   vì nó đang chỉ biết 2 giá trị `"pfd"`/`"cad"`), `applyModuleUI` mở rộng thêm class `vectoronly`
   (giống `pfdonly`/`cadonly` đã có trong CSS `base5.html`), overlay vẽ tay cầm Bézier đang chọn
   (chấm vuông cho anchor, chấm tròn cho handle, đường nét đứt nối handle-anchor — chuẩn mọi
   phần mềm vector).
4. **File mới `js/97_veccmd.js`**: xử lý công cụ Pen (trạng thái đang vẽ path dở, giống
   `polyDraft` đã có cho PFD trong `js/40_ui.js` — tham khảo logic đó), xử lý Direct Selection
   kéo node/handle, các phím tắt bảng dưới đây, nhóm/rã nhóm, z-order, align/distribute.
5. **File mới `js/98_vecio.js`**: lưu/mở `.vec.json`, xuất SVG/PNG module vec (tái dùng
   `exportSVG`/`exportPNG`/`buildBody` đã có, chỉ cần nhánh theo `state.meta.doc==="vec"`),
   xuất PDF vector (tái dùng `js/65_pdf.js` — **đọc file này trước, nó render từ SVG markup có
   sẵn nên khả năng cao chỉ cần đảm bảo `shapeMarkup` xuất path Bézier ra đúng `<path d="...">`
   là writer hiện tại tự xử lý được, không cần viết lại bộ ghi PDF**).
6. **File mới `js/99_vecpdf.js`**: bộ nhập PDF vector mô tả ở mục 1.2.
7. **`assemble5.py`**: thêm 5 file trên vào `order`, đặt **sau** `js/93_under.js` và **ngay
   trước** `js/80_boot.js`.
8. **`base5.html`**:
   - Thêm nút module thứ ba cạnh `#modPfd`/`#modCad` (ví dụ `#modVec`, nhãn "Vector").
   - Thêm `<aside>`/panel bên trái kiểu `#cadSide` cho công cụ Vector (lưới nút công cụ, panel
     lớp nếu có), đánh dấu `vectoronly`.
   - Thêm input `type=file accept=".pdf"` ẩn + vùng kéo-thả (dùng sự kiện `dragover`/`drop` trên
     `#board` hoặc toàn trang khi module Vector đang mở) để nhập PDF.
   - Thêm CSS cho `vectoronly` tương tự `cadonly`/`pfdonly` đã có (`body:not(.vecmode)
     .vectoronly{display:none!important}` …).
9. **`js/80_boot.js`**: gọi hàm khởi tạo module Vector (tương tự `cadBoot()`), bind sự kiện
   `[data-vec]` nếu có input cài đặt riêng.
10. **`js/66_help.js`**: thêm 1 tab "Hướng dẫn Vector" vào `HELP_TABS` (đang có 5 tab, theo đúng
    cấu trúc `guideCad()`/`guideKeys()` hiện có — tham khảo cách viết bilingual `_()` ở đó), thêm
    bảng phím tắt Vector vào `guideKeys()`, thêm mục About (giới hạn nhập PDF) vào `guideAbout()`,
    thêm vài câu hỏi FAQ liên quan (vd "Nhập PDF vector có giữ được chữ sửa được không?").
11. **Từ điển dịch tiếng Anh**: thêm file `en/rev6.js`, add vào `assemble5.py` order **sau**
    `en/rev5.js` nếu còn, nếu không thì sau `en/extra.js` — theo đúng vị trí nhóm `en/*.js` đã
    có (đọc lại `order` hiện tại để biết chính xác vị trí). Mọi chuỗi tiếng Việt mới trong UI
    tĩnh (`base5.html`) hoặc sinh động (`_()`) phải có bản dịch — dùng lại script kiểm tra
    `test/enscan.js`/`test/enscan2.js` đã có để tự rà soát chuỗi còn sót (mô tả ở mục 8).

---

## 4. Bảng phím tắt đề xuất cho module Vector (chỉ hoạt động khi module Vector đang mở, không
## nằm trong ô nhập liệu — bám theo mặc định Illustrator, có thể điều chỉnh nếu đụng phím hệ
## thống của trình duyệt)

| Phím | Chức năng |
|---|---|
| `V` | Công cụ chọn (Selection) |
| `A` | Công cụ chọn trực tiếp / sửa node (Direct Selection) |
| `P` | Công cụ bút (Pen) |
| `+` / `-` | Thêm / xoá điểm neo trên path (khi đang dùng Pen/Direct Selection, trỏ gần cạnh/điểm path) |
| `Shift+C` | Chuyển điểm neo góc nhọn ⇄ mượt (Convert Anchor Point) |
| `T` | Công cụ chữ |
| `M` | Hình chữ nhật |
| `L` | Ellipse |
| `\` | Đường thẳng |
| `R` | Xoay (kéo tay cầm quanh khung chọn, hoặc nhập góc trong panel) |
| `S` | Tỷ lệ (Scale) |
| `O` | Lật / đối xứng (Reflect) |
| `H` hoặc giữ `Space` | Kéo khung nhìn (Pan) — giống PFD/SimCAD |
| `Z` + kéo / lăn chuột | Phóng to/thu nhỏ |
| `Ctrl+G` / `Ctrl+Shift+G` | Nhóm / Rã nhóm |
| `Ctrl+]` / `Ctrl+[` | Lên một bậc / xuống một bậc |
| `Ctrl+Shift+]` / `Ctrl+Shift+[` | Lên trên cùng / xuống dưới cùng |
| `Ctrl+A` | Chọn tất cả |
| `Ctrl+C/X/V` | Sao chép / cắt / dán |
| `Ctrl+D` | Nhân bản dịch chuyển (lặp lại phép biến đổi cuối — giống "Transform Again") |
| `Alt+kéo` | Kéo để nhân bản tại chỗ |
| `Delete`/`Backspace` | Xoá đối tượng / xoá điểm neo đang chọn (nếu đang ở Direct Selection và chỉ chọn node) |
| `Esc` | Huỷ thao tác / kết thúc path đang vẽ (không đóng kín) |
| `Enter` | Kết thúc path đang vẽ |
| `Shift` (giữ khi vẽ/kéo) | Giữ góc 0/45/90°, hoặc hình vuông/tròn đều |
| `Ctrl+Z` / `Ctrl+Y` | Hoàn tác / làm lại |
| `Ctrl+S` | Lưu `.vec.json` |
| `Ctrl+P` | In / xuất PDF vector |
| `Ctrl+0` | Vừa khung nhìn |

Ghi toàn bộ bảng này vào `js/66_help.js` (mảng `HK_VEC` theo mẫu `HK_PFD`/`HK_CAD` đã có) để
hiện trong tab "Phím tắt & lệnh".

---

## 5. Nguyên tắc UI/UX bắt buộc (vì người dùng khiếm thị, dùng TTS)

- Mọi nút bấm phải có `title` (tooltip) và `aria-label` song ngữ như toàn bộ phần còn lại của
  app — xem cách PFD/SimCAD đang làm, copy đúng pattern.
- Mọi thao tác chọn/vẽ/biến đổi phải cập nhật thanh trạng thái `setStatus(...)` bằng câu mô tả
  đầy đủ bằng lời (ví dụ: "Đã xoay 2 đối tượng 45°." / "Đã nhập PDF: 38 path, 5 khối chữ, bỏ
  qua 1 gradient không hỗ trợ.") — đây là kênh thông tin chính cho TTS, không được bỏ qua.
- Panel thuộc tính bên phải phải cho **nhập số chính xác** (toạ độ, góc xoay, % tỷ lệ, cỡ nét)
  thay vì chỉ thao tác chuột, same as các panel PFD/SimCAD hiện tại.
- Giữ nguyên cơ chế `openModal`/`toggleHelp`, cơ chế dịch `trText`/`trString`, theme sáng/tối,
  cỡ chữ A-/A+, chế độ tương phản cao — module mới phải tương thích với toàn bộ, không tạo
  CSS/luồng render riêng biệt tách rời.

---

## 6. Yêu cầu về import PDF — chi tiết kỹ thuật tối thiểu cho parser

1. Đọc toàn bộ `ArrayBuffer` của file PDF.
2. Tìm `trailer`/`xref` (chấp nhận PDF không có cross-reference stream phức tạp trước — nhiều
   PDF xuất từ Illustrator/Inkscape/trình duyệt dùng xref table cổ điển, dễ parse hơn).
3. Lấy `/Root` → `/Pages` → duyệt cây page, lấy trang đầu tiên (Rev.0 chỉ cần 1 trang, có thể
   thêm chọn trang sau).
4. Lấy `/Contents` của trang (có thể là 1 stream hoặc mảng nhiều stream, nối lại).
5. Giải nén nếu `/Filter /FlateDecode` (**tái dùng hàm giải Flate đã có trong `js/93_under.js`
   cho phần đọc ảnh PDF scan** — đọc lại code đó trước khi viết hàm mới, tránh trùng lặp).
6. Tokenize content stream theo cú pháp PDF, dựng **state machine đồ hoạ** tối thiểu:
   - Theo dõi current transformation matrix (CTM) qua toán tử `cm`, ngăn xếp `q`/`Q`.
   - Theo dõi current path (toán tử `m`,`l`,`c`,`v`,`y`,`re`,`h`), khi gặp toán tử vẽ (`S`,`s`,
     `f`,`f*`,`B`,`B*`,`b`,`b*`) → chuyển path hiện tại (đã áp CTM) thành một hoặc nhiều đối
     tượng `path` trong `state.shapes`, lấy màu từ toán tử màu gần nhất (`rg`,`k`,`g`,`sc`…),
     độ dày nét từ `w`, nếu có `W`/`W*` trước toán tử vẽ thì đó là clipping path — **Rev.0 được
     phép bỏ qua phần bị clip (không cắt), chỉ cảnh báo trong log kết quả**, không bắt buộc
     implement clipping thật.
   - Theo dõi khối `BT…ET`: toán tử `Tf` (font+cỡ), `Tm`/`Td`/`TD` (vị trí), `Tj`/`TJ`/`'`/`"`
     (hiển thị chuỗi) → tạo đối tượng text (tái dùng text-node đã có nếu hợp lý, hoặc tạo loại
     `path`-group giữ outline nếu không tra được font gốc — ghi rõ trong code đây là rút gọn).
   - Font: Rev.0 **không bắt buộc** phải đọc font nhúng trong PDF để tái tạo glyph chính xác —
     được phép dùng font hệ thống gần giống nhất (sans-serif mặc định) để hiển thị lại chuỗi ký
     tự, miễn là vị trí/kích thước đúng và người dùng được **cảnh báo rõ** "chữ nhập từ PDF có
     thể không đúng font gốc, bạn nên kiểm tra lại". Nếu có thời gian, đọc `/Widths` của font để
     giữ đúng khoảng cách ký tự.
7. Trả về: số path/text nhập được, danh sách phần bị bỏ qua (loại toán tử lạ, filter không hỗ
   trợ như `/DCTDecode` lồng trong content stream dạng Form XObject phức tạp, v.v.), hiển thị
   bằng `setStatus(...)` và/hoặc một modal tóm tắt giống report kết quả dò nét trong SimCAD
   (`traceUnder` ở `js/93_under.js` đã có mẫu UX này — tái dùng).
8. Mọi lỗi parse (không phải PDF, bị mã hoá, không tìm thấy `/Contents`) → thông báo tiếng Việt
   rõ ràng, không throw lỗi làm treo trang.

---

## 7. Quy ước đặt tên file & bàn giao

- Tên file HTML lắp ráp cuối cùng: `/tmp/pfd/pfd-studio-26.10.26-Rev.6.html` (ngày giữ nguyên
  `26.10.26` theo quy ước đã dùng cho mọi revision trước — **không đổi ngày**).
- Giữ nguyên toàn bộ tên app/tiêu đề hiện có, chỉ cập nhật số "Rev.5" → "Rev.6" ở các chỗ đang
  hiển thị (tìm bằng `grep -rn "Rev\.5"` trong `base5.html` và `js/*.js`), bao gồm cả trong
  `appSub`, `<title>`, metadata PDF trong `js/65_pdf.js` (`Creator`, `Producer`).

---

## 8. Yêu cầu kiểm thử trước khi bàn giao lại

Thư mục `/tmp/pfd/r5/test/` đã có các kịch bản Playwright (`smoke.js`, `t2.js`…`t10.js`,
`pdf1.js`, `pdf2.js`, `cad1.js`, `cad2.js`, `cad3.js`, `under1.js`, `help1.js`, `enscan.js`,
`enscan2.js`). **Chạy lại toàn bộ**, đảm bảo vẫn "NO ERRORS" sau khi thêm module Vector (không
được có `PAGEERR`/`CONSOLE` lỗi mới, ngoại trừ dòng `ERR_TUNNEL_CONNECTION_FAILED` đã biết khi
môi trường không có mạng, liên quan đến fallback `pdf.js` của `93_under.js`).

Viết thêm kịch bản test mới tương tự pattern các file trên, ví dụ `vec1.js`:
- Mở module Vector, vẽ 1 path bằng Pen (vài điểm thẳng + 1 điểm cong), vẽ 1 rect, 1 ellipse.
- Chọn, xoay, scale, đổi màu, nhóm/rã nhóm, đưa lên trên/xuống dưới.
- Lưu `.vec.json`, tải lại, kiểm tra dữ liệu khớp.
- Xuất PDF vector, dùng `pdfinfo`/`pdftoppm` (đã dùng trong các test PDF trước) kiểm tra file
  hợp lệ và có nội dung vector thật (không phải ảnh raster).
- Nhập một file PDF vector mẫu đơn giản (tự tạo bằng chính app này xuất ra trước đó, hoặc một
  PDF vector nhỏ tự dựng bằng tay), kiểm tra số path/text đọc được đúng như kỳ vọng, không có
  lỗi console.
- Chạy ở cả `setLang('en')` và theme tối, chụp ảnh màn hình để kiểm tra bố cục không vỡ (dùng
  `page.screenshot` như các test khác đã làm).
- Chạy `enscan.js`/`enscan2.js` (hoặc viết thêm biến thể quét riêng module Vector theo đúng
  logic quét chuỗi tiếng Việt chưa dịch đã có) để đảm bảo không còn chuỗi tiếng Việt sót trong
  chế độ tiếng Anh.

---

## 9. Khi bàn giao lại cho người dùng

Trả lời **bằng tiếng Việt** (người dùng là người Việt, khiếm thị, dùng TTS). Sau khi hoàn
thành, gửi file `/tmp/pfd/pfd-studio-26.10.26-Rev.6.html`, kèm một đoạn tóm tắt ngắn gọn các
giới hạn đã biết của module Vector (đặc biệt: phạm vi PDF được hỗ trợ nhập, font chữ nhập vào
không giữ chính xác 100%, chưa có pathfinder/gradient/mesh nếu chưa kịp làm), và nhắc người
dùng có thể nghe lại bằng Text-to-Speech.

---

## 10. Tóm tắt việc cần làm (checklist)

- [ ] Đọc toàn bộ `/tmp/pfd/r5/js/90_cad.js`, `91_cadcmd.js`, `93_under.js` để hiểu đúng pattern
      trước khi viết module Vector (bắt chước kiến trúc, không phát minh lại).
- [ ] Thêm `path` vào `SHAPE_T`, mô hình dữ liệu Bézier (mục 2).
- [ ] Viết `js/95_vecgeo.js`, `96_vec.js`, `97_veccmd.js`, `98_vecio.js`, `99_vecpdf.js`.
- [ ] Cập nhật `assemble5.py` (thêm 5 file JS mới + `en/rev6.js`, giữ nguyên thứ tự còn lại).
- [ ] Cập nhật `base5.html`: nút module thứ 3, panel công cụ, CSS `vectoronly`, kéo-thả PDF.
- [ ] Cập nhật `js/80_boot.js` để khởi tạo module Vector.
- [ ] Cập nhật `js/66_help.js`: tab hướng dẫn Vector, bảng phím tắt, About, FAQ liên quan PDF.
- [ ] Dịch toàn bộ chuỗi mới sang tiếng Anh trong `en/rev6.js`.
- [ ] Chạy lại toàn bộ test cũ — không được có lỗi mới.
- [ ] Viết test mới cho module Vector (vẽ, chỉnh sửa, lưu/mở, xuất PDF, nhập PDF).
- [ ] Lắp ráp bản cuối: `python3 assemble5.py /tmp/pfd/pfd-studio-26.10.26-Rev.6.html`.
- [ ] Gửi file cho người dùng kèm tóm tắt giới hạn, trả lời bằng tiếng Việt.
