# PFD Studio (Process Flow Diagram Studio) — Rev.8.5

**PFD Studio** là ứng dụng thiết kế, mô phỏng và trực quan hóa sơ đồ công nghệ (Process Flow Diagram - PFD) và P&ID phục vụ kỹ thuật dầu khí, năng lượng và xử lý hóa chất.

Ứng dụng chạy hoàn toàn độc lập (Single-file offline HTML), không cần cài đặt máy chủ, không phụ thuộc internet.

---

## Tính Năng Cốt Lõi (Rev.8.5)
- **Thư viện chuẩn hóa 1.188 ký hiệu công nghệ:**
  - 144 ký hiệu gốc PFD Studio.
  - 1.043 ký hiệu mở theo các chuẩn ISO 10628, ANSI/ISA-5.1, PIP từ các nguồn: Draftsperson, Radica, LibreOffice, draw.io, Wikimedia.
  - Phân loại trực quan thành 22 họ thiết bị (Bình tách, Tháp, Bơm, Máy nén, Thiết bị trao đổi nhiệt, Van, v.v.).
- **Tự động gắn nhãn đa ngôn ngữ (Việt - Anh):** Nhãn kỹ thuật chuẩn hóa, tìm kiếm nhanh theo mã hoặc tên.
- **Hệ thống kết nối & Tuyến ống thông minh:**
  - Cổng nối (ports) mặc định đặt chính xác theo đầu ống vật lý.
  - Tự động bắt dính, tạo nhánh chữ T (Tee), đổi hướng, làm thẳng ống (phím J).
- **Xuất bản vẽ kỹ thuật cao cấp:** Định dạng SVG vector và PDF độ phân giải cao.

---

## Cấu Trúc Mã Nguồn Repository
```
01_REPO_GITHUB/
├── index.html                     # Bản phát hành chính Rev.8.5 (mở trực tiếp trên mọi trình duyệt)
├── apps/                          # Các bản phát hành ứng dụng độc lập
│   ├── PFD-Studio_Rev.8.5.html    # Bản mới nhất hoàn chỉnh 1.188 ký hiệu (gói v1.8)
│   ├── pfd-studio-26.11.11-Rev.8.html
│   └── pfd-studio-26.10.30-Rev.7.html
├── lib/                           # Thư viện ký hiệu chuẩn hóa (JavaScript & CSV)
│   ├── symbols-draftsperson_v1.0.js
│   ├── symbols-drawio_v1.3.js
│   ├── symbols-libreoffice_v1.0.js
│   ├── symbols-radica_v1.3.js
│   ├── symbols-wikimedia_v1.3.js
│   ├── symbols_master_v1.0.csv
│   └── poc_wikimedia_symbols_v0.1.js
├── scripts/                       # Bộ công cụ build & chuyển đổi dữ liệu SVG/CAD
│   ├── build_runner_rev84_v0.1.py
│   ├── normalize_convert_all_v0.6.py
│   ├── convert_draftsperson_v0.1.py
│   ├── convert_gallery_v0.1.py
│   └── ...
└── docs/                          # Hồ sơ đặc tả, báo cáo tích hợp & giấy phép
    ├── LICENSE-attribution_v1.3.md
    ├── Danh-gia-tich-hop_PFD-Studio-Rev7_v1.7.md
    └── README_PFD-PID-Database_v1.0.md
```

---

## Hướng Dẫn Sử Dụng
1. **Chạy ngay:** Mở trực tiếp file `index.html` hoặc `apps/PFD-Studio_Rev.8.5.html` bằng trình duyệt web bất kỳ (Chrome, Edge, Firefox).
2. **Thao tác nhanh:**
   - Kéo thả thiết bị từ thanh công cụ bên trái vào bản vẽ.
   - Nối ống bằng cách kéo từ cổng này sang cổng khác.
   - Nhấn `J` để làm thẳng tuyến ống.
   - Nhấn `Ctrl + S` để lưu dự án dưới dạng tệp JSON hoặc xuất PDF/SVG.

---

## Bản Quyền & Giấy Phép (Attribution)
Chi tiết điều khoản bản quyền và giấy phép của các nguồn biểu tượng mở được ghi nhận đầy đủ tại [`docs/LICENSE-attribution_v1.3.md`](docs/LICENSE-attribution_v1.3.md) (CC BY-SA 3.0/4.0, LGPL-3.0, Apache-2.0).
