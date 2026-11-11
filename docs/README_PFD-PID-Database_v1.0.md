# CƠ SỞ DỮ LIỆU KÝ HIỆU & TÀI LIỆU CHO PHẦN MỀM VẼ PFD / P&ID — v1.0

**Ngày bàn giao:** 2026-11-10
**Nguồn gốc:** xây dựng 100% từ các nguồn mở / công khai, bắt đầu từ Gist của Chintan Talapara
(<https://gist.github.com/ChintanTalapara/5d5d8fb26a16c980612ee03f49051230>) và mở rộng thêm các nguồn Lisa tự tìm.
**Nguyên tắc:** mọi mục đều ghi rõ nguồn và giấy phép ngay trong catalog; mục nào giấy phép không rõ
hoặc là tiêu chuẩn có bản quyền thì được gắn cờ **REFERENCE ONLY** (chỉ tra cứu nội bộ, không đóng gói vào sản phẩm thương mại).

---

## 1. Cách dùng nhanh cho phần mềm

File trung tâm là **`06_catalog/symbols_master_v1.0.sqlite`** (hoặc bản `.csv` / `.json` tương đương):

- Bảng `symbols` — **1.106 ký hiệu** đã phân loại, mỗi dòng có:
  `symbol_id, name_en, name_normalized` (dùng để search), `category_code, category_en, category_vi`,
  `subcategory, standard, reg_no` (số đăng ký ISO 10628-2 nếu có), `formats, file_paths`
  (đường dẫn tương đối tính từ gốc gói dữ liệu này), `source_id, license, description, notes`.
- Bảng `documents` — 25 tài liệu PDF/bản vẽ đã lập chỉ mục (tiêu chuẩn tra cứu, handbook, legend, bản vẽ mẫu).
- Bảng `examples` — **289 bản vẽ mẫu** (278 PFD + 11 P&ID) kèm giấy phép từng file.
- Bảng `sources` — 19 nguồn dữ liệu, trạng thái tải và ghi chú giấy phép.
- Các bảng tra cứu ISA 5.1 cho engine gắn tag: `isa_first_letters` (26 chữ cái đầu),
  `isa_succeeding_letters`, `isa_tag_examples`, `isa_instrument_shapes`, `isa_instrument_locations`,
  `line_types` (kiểu đường tín hiệu), `line_designation` (định dạng line number).
- Bảng `taxonomy` — 14 nhóm phân loại (song ngữ Anh–Việt).

Kiểm chứng tự động đã chạy (script `07_build_scripts/verify_catalog_v1.0.py`):
**1.106/1.106 dòng catalog trỏ tới file tồn tại thật; 917/917 file SVG đọc được bằng XML parser, 0 lỗi.**

## 2. Phân bố ký hiệu theo nhóm (bảng `symbols`)

| Nhóm | Số ký hiệu |
|---|---|
| Van & cơ cấu chấp hành (valves_actuators) | 163 |
| Đường tuyến, đầu nối & phần tử phụ trợ (lines_connectors) | 122 |
| Bồn, bể chứa & thiết bị dạng bình (vessels_tanks) | 114 |
| Đường ống & phụ kiện (piping_fittings) | 111 |
| Chung / bản vẽ kỹ thuật (general) | 102 |
| Thiết bị đo & chức năng điều khiển (instruments) | 93 |
| Truyền nhiệt (heat_transfer) | 92 |
| Xử lý & vận chuyển chất rắn (solids_handling) | 79 |
| Bơm, máy nén & thiết bị quay (rotating) | 75 |
| Phân tách & lọc (separation_filtration) | 54 |
| Thông gió (ventilation) | 40 |
| Tháp, phản ứng & cấu kiện trong (columns_reactors) | 28 |
| Khuấy trộn (mixing) | 19 |
| Bảng chú giải tổng hợp (legend_sheets) | 14 |

Theo nguồn: Wikimedia Commons 483 · Radica/Capital X 460 · draw.io stencils 87 · KiCad pnid-lib 67 · TikZ 9.
Ngoài catalog còn có **thư viện DWG của Draftsperson (150 block)** — chưa tách được từng block vì môi trường
này không có trình đọc DWG; file DWG có sẵn lớp `PID_PORT` với 353 điểm nối và thuộc tính TAG trên 25 ký hiệu.

## 3. Cấu trúc gói dữ liệu

```
00_sources_reference/   Gist gốc (.md) + trang ProjectMaterials (407 ký hiệu, snapshot HTML)
01_repos/               Các repo GitHub đã clone (đã bỏ .git; riêng draw.io chỉ giữ thư mục stencils/pid)
02_wikimedia/           pid_symbols/ (483 file theo 33 thư mục con) · example_pfds/ (278) · example_pids/ (11)
                        + metadata JSON gốc (giấy phép, mô tả, REG#) cho từng file
03_pdfs/                DOE Handbook Vol 1+2 · legend EdrawMax/EdrawSoft · ISA-5.1-2009 (REFERENCE ONLY)
04_cad/                 radica_capitalx/ (460 ký hiệu × 5 định dạng SVG/PNG/JPG/DXF/DWG, 10 stencil ISO & PIP)
                        + Draftsperson_EN-ISO-10628_..._150-symbols_v1.0.dwg
06_catalog/             symbols_master (sqlite/csv/json) · documents_index · examples_index · sources_index
                        · taxonomy · 7 file CSV bảng tra cứu ISA 5.1 / line
07_build_scripts/       Toàn bộ script tải & dựng catalog (chạy lại được để cập nhật; script Wikimedia
                        bỏ qua file đã có nên tải bổ sung rất nhanh)
```

## 4. Ghi chú trung thực về từng nguồn (khác với mô tả trong Gist)

- **Wikimedia Commons** là mỏ lớn nhất và sạch giấy phép nhất: Gist ghi "81 files" nhưng cây thư mục đệ quy
  thực tế có **483 file** (457 SVG), trong đó 421 file Public Domain, 38 CC BY-SA 4.0, 20 CC BY-SA 3.0;
  177 file có số đăng ký ISO 10628-2 (REG#) trích từ mô tả. Bộ 7 tờ legend ISO 10628-2:2012 (Baltakatei,
  CC BY-SA 4.0) có cả PDF và SVG.
- **Radica / Capital X Panel Designer**: tải đủ **460 ký hiệu × 5 định dạng = 2.300 file**, gồm cả hai biến thể
  **ISO và PIP** cho van, thiết bị, fitting, instrument, đường ống & đường tín hiệu. Giấy phép: free, yêu cầu ghi nguồn.
- **FreeCAD-symbols**: repo thật **không có ký hiệu P&ID nào** — chỉ có compass rose, ký hiệu chiếu, section marks.
  Vẫn giữ trong gói như tài liệu vẽ phụ trợ, nhưng đừng tính vào thư viện P&ID.
- **PIDcircuitTikZ**: chỉ định nghĩa **9 shape cơ sở** (không phải "full library" như Gist mô tả);
  giá trị chính là manual PDF 21 trang và ví dụ bản vẽ.
- **SpaceTeam/pnid-lib** (KiCad, GPL-3.0): 67 ký hiệu gốc sau khi bỏ các sub-symbol đơn vị;
  đây là thư viện của đội tên lửa sinh viên nên có cả ký hiệu rocket/sensor — phần van/bơm/orifice dùng tốt cho P&ID.
- **planttalk/pid-symbol-studio** (Gist liệt kê): repo **không còn tồn tại** (GitHub 404) — không lấy được.
- **LibreOffice Extension "Gallery for P&ID according to ISO 10628"** (>300 ký hiệu, 08-2026): đã xác định được
  sự tồn tại nhưng **chưa tải được** trong phiên này (không trích được link tải từ trang listing).
  Đây là mục bổ sung đáng giá nhất cho đợt sau — vào extensions.libreoffice.org tìm "P&ID".
- **Multicalci P&ID Symbol Finder** (385+ ký hiệu, export SVG): đã xác định, không scrape vì là công cụ web JS;
  bộ Radica đã phủ gần như cùng phạm vi.
- Hai repo AI/ML trong Gist (ch-hristov YOLOv5 dataset + Automated-PnID detection) đã tải đủ —
  để dành cho tính năng nhận dạng ký hiệu tự động về sau, không thuộc catalog vẽ.
- Repo **farhansurii/instrumentation-drawings**: bộ bản vẽ DWG thật (họ ký hiệu equipment/instrument/valve +
  P&ID boiler–turbine) kèm PDF — **không ghi giấy phép**, chỉ dùng tham khảo.
- **ISA-5.1-2009** (bản PDF 128 trang do ĐH UFPR host công khai, đúng link "free PDF" trong Gist):
  là tiêu chuẩn **có bản quyền** — chỉ tra cứu nội bộ để kiểm chứng quy tắc tag, **không** đóng gói vào sản phẩm.
- **DOE-HDBK-1016 Vol 1 (122 trang) + Vol 2 (98 trang)**: tài liệu **public domain** của Chính phủ Mỹ —
  nguồn sách giáo khoa miễn phí tốt nhất về đọc P&ID, ký hiệu van/bơm/thiết bị và ví dụ đọc bản vẽ hoàn chỉnh.

## 5. Hướng dẫn giấy phép khi đưa vào sản phẩm

- **Dùng thẳng được (kèm ghi nguồn nếu yêu cầu):** Public Domain, CC0, CC BY (Wikimedia từng file; Radica — ghi
  "Symbols: Radica Software / Capital X Panel Designer"), Apache-2.0 (draw.io stencils), DOE (public domain),
  Draftsperson DWG (free commercial, không cần ghi nguồn).
- **Share-alike — cân nhắc trước khi nhúng vào sản phẩm đóng:** CC BY-SA (một phần Wikimedia, gồm 7 tờ legend),
  GPL-3.0 (KiCad pnid-lib), LPPL (TikZ).
- **REFERENCE ONLY — không nhúng:** ISA-5.1-2009 PDF, các repo không ghi giấy phép
  (farhansurii, Automated-PnID), legend PDF của Edraw (chỉ tra cứu), trang ProjectMaterials.

Giấy phép của **từng ký hiệu** đã nằm trong cột `license` của catalog — lọc theo cột này khi build bản thương mại.

## 6. Việc còn thiếu / đề xuất đợt sau

1. Tải LibreOffice Gallery P&ID (>300 ký hiệu) — nguồn bổ sung lớn nhất còn mở.
2. Tách 150 block trong DWG Draftsperson thành từng ký hiệu + trích xuất 353 điểm nối PID_PORT làm
   chuẩn "ports" cho catalog (hiện catalog chưa có trường tọa độ điểm nối — đây là việc thiết kế dữ liệu
   quan trọng nhất trước khi code tính năng snap/nối ống).
3. Chuẩn hoá điểm nối (port) cho bộ SVG Wikimedia/Radica: suy ra từ hình học SVG hoặc gán tay cho ~100 ký hiệu chính.
4. Đối chiếu độ phủ với danh mục 407 ký hiệu của ProjectMaterials để tìm nhóm còn thiếu
   (ứng viên: ký hiệu PFD mức khái niệm theo ISO 10628-1, ký hiệu an toàn/ESD, package vendor).
5. Cân nhắc chuẩn trao đổi DEXPI (ISO 15926 / Proteus XML) nếu phần mềm cần import/export P&ID thông minh về sau.

---
*Đóng gói: `PFD-PID-Database_v1.0.zip` (phần lõi) và `PFD-PID-Examples_v1.0.zip` (289 bản vẽ mẫu Wikimedia).
Giải nén cả hai vào cùng một thư mục gốc để cây thư mục khớp với đường dẫn trong catalog.*
