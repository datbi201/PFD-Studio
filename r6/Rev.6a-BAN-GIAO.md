# PFD Studio — Rev.6a (module Vector: phần vẽ)

Bản này là **Rev.6a** = mục 1.1 của `vector-module-prompt-Rev6.md` (vẽ vector).
Mục 1.2 (nhập PDF vector) để dành cho **Rev.6b** — chưa triển khai, nút mở PDF cố ý không hiển thị.

## File bàn giao

| File | Nội dung |
|---|---|
| `pfd-studio-26.10.26-Rev.6a.html` | Bản lắp ráp hoàn chỉnh, mở bằng trình duyệt là chạy |
| `handoff-rev6/pfd-studio-source/` | Toàn bộ mã nguồn rời (đã sửa cho Rev.6a) |

Lắp ráp lại: `python3 handoff-rev6/pfd-studio-source/assemble5.py <file-ra.html>`

## File thêm mới

| File | Việc |
|---|---|
| `js/95_vecgeo.js` | Hình học path Bézier: bao hình chính xác (cực trị giải tích), làm phẳng, hit-test khoảng cách, sinh `d`, biến đổi toạ độ, tách/xoá điểm neo, chuyển hình cơ bản → path |
| `js/96_vec.js` | `VEC` state, `STORE.vec`, `newVecState`, overlay điểm neo/tay cầm, nhóm, z-order, căn chỉnh & phân bố, xoay/tỷ lệ/lật có nhập số, panel thuộc tính, `vecBoot` |
| `js/97_veccmd.js` | Bút (Pen), chọn trực tiếp, kéo điểm neo/tay cầm, kéo góc để tỷ lệ, kéo ngoài góc để xoay, vẽ hình cơ bản, toàn bộ bảng phím tắt mục 4 |
| `en/rev6.js` | Từ điển tiếng Anh cho mọi chuỗi mới |

## File sửa (đều có guard `if(h.t==="path")` / `vecOn()` — không đổi hành vi PFD/SimCAD)

`js/10_state.js` (`path` trong `SHAPE_T`, `defaultVec`/`cleanVec`, `meta.vec`, `KEYC_VEC`, nhánh path trong `normalizeState`, khoá autosave) ·
`js/30_draw.js` (`shapeBox`/`shapeGeomEl`/`selDeco`/`shapeMarkup`) ·
`js/40_ui.js` (chụp `nodes` khi kéo, `vecMove` khi nudge, 4 điểm chèn cho `vecPointer*`/`vecKey`, `renderVecOverlay` trong `renderAll`) ·
`js/50_props.js` (`vecRenderProps`, `vecShapeFields`) ·
`js/60_io.js` (tên file `.vec.json`) ·
`js/66_help.js` (tab Vector, `HK_VEC`, `guideVec`, About, 3 FAQ) ·
`js/80_boot.js` (`vecBoot()`) ·
`js/85_cadgeo.js` (`allShapePts`/`mapShapePts` cho path) ·
`js/90_cad.js` (`STORE.vec`, `setModule('vec')`, `applyModuleUI`) ·
`base5.html` (nút `#modVec`, panel `#vecSide`, `<g id="gVec">`, CSS `vecmode`/`vectoronly`) ·
`assemble5.py` (thêm 4 file JS + `en/rev6.js`; **đổi `D` sang đường dẫn tương đối** — bản gốc hardcode `/tmp/pfd/r5/`) ·
`js/65_pdf.js` (chỉ đổi `Rev.5`→`Rev.6`; **không phải sửa gì thêm** — bộ ghi PDF đã có sẵn `parsePathD` + toán tử `c`)

## Kiểm thử

Chạy trên Windows: `NODE_PATH=<workspace>/node_modules node test/<tên>.js`

- 18 test cũ: **PASS** hết (smoke, t2–t10, pdf1, pdf2, cad1–cad3, under1, help1, fin1)
- `vec1.js` (mới): **PASS** — bút 3 điểm neo, rect/ellipse → path kín, click chọn đúng đối tượng, kéo dời đúng tỉ lệ, xoay 45°, nhóm/rã nhóm, z-order, thêm/xoá điểm neo, lưu→mở khớp, SVG có cung `C`, **PDF có toán tử `c` thật**, EN + theme tối, chuyển module qua lại không vỡ
- `enscan.js` = **8**, đúng bằng baseline của Rev.5 (8 chuỗi nằm trong SVG do template nạp lúc còn ở chế độ VI — lỗi có từ trước, ngoài phạm vi Rev.6)
- `enscan2.js` = **0**
- Quét riêng module Vector ở chế độ EN (trong `vec1.js`): **0 chuỗi tiếng Việt sót**

Ghi chú khi chạy test trên Windows: đã patch 25 file `test/*.js` từ đường dẫn Linux
(`/opt/npm-tools/...`, `file:///tmp/pfd/r5/...`) sang `require('playwright')` + `__dirname`.
`scan.png` được dựng lại từ `scan.jpg` vì gói bàn giao đã lược ảnh.

## Khác biệt so với prompt (có chủ ý)

1. **Kéo ngoài góc = xoay, kéo góc = tỷ lệ** — đúng như Illustrator, ngưỡng 9–26 px quanh góc.
   Ngoài ra còn có công cụ Xoay/Tỷ lệ riêng và ô nhập số trong panel.
2. **`\` là phím đường thẳng** (theo prompt), không phải `L`; `L` là Ellipse như prompt quy định.
3. **Nhóm chỉ để gom chọn** (`h.g`), chưa vẽ khung bao nhóm riêng — Rev.0 chấp nhận được.
4. **Chưa có Pathfinder / gradient / pattern / clipping mask / symbol** — đúng mục 1.3 (không bắt buộc).
5. **V và A hiển thị khác nhau (giống Illustrator):** `V` chỉ hiện khung bao + 4 chấm vuông ở góc;
   `A` mới hiện điểm neo + tay cầm. Vùng xoay ngoài góc dùng được ở **cả hai** chế độ.

## Sửa sau khi người dùng kiểm thử (bản 6a-2)

Người dùng báo 4 lỗi; đã tìm ra nguyên nhân gốc và sửa:

| Lỗi báo | Nguyên nhân gốc | Cách sửa |
|---|---|---|
| Bút không tạo được tay cầm | `vecPointerMove()` thoát sớm ở `if(!d)return false` vì bút không dùng `VEC.drag` → `vecPenMove()` **chưa bao giờ được gọi** | Xử lý nhánh bút **trước** khi kiểm tra `VEC.drag` |
| Bút không kết thúc đúng | `vecPointerUp()` không gọi `vecPenUp()` | Gọi `vecPenUp()` khi `tool==="pen" && VEC.pen` |
| Đang kéo không thấy tay cầm | Overlay chỉ vẽ tay cầm của path đã chọn, không vẽ của `VEC.draft` | Vẽ tay cầm cho cả nét đang vẽ; thêm dây thun tới con trỏ |
| `A` không xoay được | Vòng xoay ngoài góc bị chặn `tool==="select"` | Cho phép ở cả `V` và `A` |
| `V` lại hiện điểm neo + tay cầm của ellipse | `renderVecOverlay` vẽ node khi `single`, không phân biệt V với A | `V` chỉ vẽ khung bao; `A` mới vẽ điểm neo + tay cầm |
| **Bấm chọn đối tượng không hiện khung bao** (phát hiện thêm khi sửa) | `objDown()` trong `40_ui.js` chỉ gọi `renderShapes()`/`renderProps()`, không gọi overlay | Móc `renderVecOverlay()` vào `renderShapes()` khi đang ở module Vector |

Đã kiểm chứng lại bằng chuột thật (toạ độ tính tươi sau mỗi bước): kéo tay cầm đổi `out` từ
(560,355)→(690,240) và **giữ nguyên vùng chọn**; xoay ngoài góc ở A đổi node (560,300)→(540,228);
xoay ở V có đổi; kéo góc phóng rộng 346→499; bút tạo path 3 điểm neo kiểu `smooth/corner/corner`;
kéo điểm neo y 680→548. 19/19 test PASS, `enscan`=8, `enscan2`=0.

## Vòng 6a-3 — 10 yêu cầu bổ sung (ĐÃ LÀM)

| # | Yêu cầu | Cách làm |
|---|---|---|
| 1 | A phải **dời được điểm neo**, không phải dời/xoay cả hình | Đảo **thứ tự ưu tiên** trong `vecPointerDown`: tay cầm Bézier → điểm neo → tay cầm biến đổi → tâm quay → vùng xoay → công cụ. Trước đây vùng xoay được kiểm tra TRƯỚC điểm neo, mà hình chữ nhật có 4 điểm neo nằm đúng 4 góc khung bao → bấm điểm neo bị hiểu là bấm vùng xoay. Đồng thời **bỏ vùng xoay khỏi chế độ A** (đúng như người dùng phản ánh là "điểm lạ") |
| 2 | Xoay: Shift hút 45/90/135/180, hiện góc real-time, đổi được tâm quay | `Shift` → `Math.round(deg/45)*45`; nhãn góc hiện cạnh con trỏ **và** trên thanh trạng thái; tâm quay là chữ thập cam kéo được, `Alt+0` trả về giữa, chỉ hiện khi đang xoay / dùng công cụ R / đã đặt tâm riêng |
| 3 | Chữ (T) thành vùng vector hoàn toàn | Thêm loại `vtext` (không dùng text-node của PFD nữa): bấm = **chữ theo dòng**, kéo = **chữ trong vùng tự xuống dòng**; có khung bao, xoay, lật ngang/dọc, font/cỡ/đậm/nghiêng/màu/nền, panel nhập số đầy đủ, tự co hộp theo nội dung |
| 4 | Đổ màu được cho hình kín | `styleFields` chỉ hiện ô tô màu khi `closedKind` — mà `path` không nằm trong danh sách đó. Đã thêm `(o.t==="path" && o.closed)` |
| 5 | Thước + xác định kích thước khi vẽ | Thước ngang/dọc vẽ trong `<g id="gRuler">`, tự đổi bước chia theo zoom, bấm ô góc để bật/tắt. Khi vẽ/kéo: hiện `W × H` cạnh con trỏ **và** trên thanh trạng thái |
| 6 | Công cụ CAD: đo góc, đo dài, khoảng cách | Công cụ `measure` (phím `D`): 2 điểm → khoảng cách (kèm mm) + góc phương vị; 3 điểm → góc tại điểm giữa. Số đo vẽ trên bản vẽ, đọc ở thanh trạng thái, `Esc` xoá |
| 7 | Shift khi di chuyển = hút lưới; Ctrl = sao chép | Kéo dời chuyển sang `vmove` riêng: `Shift` hút delta theo bước lưới, `Ctrl` nhân bản ngay khi kéo, `Alt` khoá trục |
| 8 | Menu chuột phải | `#vecMenu` với 17 mục: cắt/sao chép/dán/nhân bản/xoá, nhóm/rã nhóm, 4 mức thứ tự lớp, 8 kiểu căn chỉnh & phân bố, xoay 90°, lật, đặt lại tâm quay, chọn tất cả, vừa khung nhìn |
| 9 | Nhóm không hoạt động | Nhóm **vẫn chạy** nhưng không có phản hồi thị giác nên tưởng là lỗi. Đã thêm khung cam nét liền quanh nhóm, thông báo trạng thái rõ, và bấm một thành viên là chọn cả nhóm (`vecExpandSel`) |
| 10 | Scale không giữ tỷ lệ khi kéo cạnh | Thêm **4 tay cầm CẠNH** (thanh nhỏ) phóng một chiều; 4 tay cầm **GÓC** phóng giữ tỷ lệ |

### Lỗi phát sinh trong lúc làm (đã sửa)

- `vecShapeFields` gọi `h.nodes.length` → nổ khi mở panel của chữ vector. Đổi sang `vecObjBox()` + guard.
- `P.forEach(dot)` **bỏ mất kết quả trả về** → điểm đo không được vẽ. Đổi sang `P.forEach(p=>{s+=dot(p)})`.
- Shift vừa "thêm vào vùng chọn" vừa "hút lưới" → kéo bằng Shift bị **bỏ chọn** thay vì dời. Đổi: chỉ thêm vào vùng chọn khi đối tượng **chưa** được chọn.
- Path kín **chưa tô màu** chỉ bấm được đúng nét. Đổi vùng bắt điểm sang `visiblePainted` cho path kín → bấm được cả bên trong.
- Số đo vẽ sau `return` sớm khi không có vùng chọn → không hiện. Đã chuyển lên trước.

## Giới hạn đã biết

- Chưa nhập được PDF vector (Rev.6b).
- Chữ trong module Vector dùng lại text-node của PFD; chưa chuyển chữ thành outline path.
- 8 chuỗi tiếng Việt trong SVG khi ở chế độ EN là lỗi có từ Rev.5 (template nạp trước khi đổi ngôn ngữ), không phải do Rev.6a.
