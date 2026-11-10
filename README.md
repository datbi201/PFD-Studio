# PFD Studio (Process Flow Diagram Studio)

**PFD Studio** là ứng dụng thiết kế, mô phỏng và trực quan hóa sơ đồ công nghệ (Process Flow Diagram - PFD) phục vụ ngành dầu khí và xử lý công nghệ.

## Tính năng chính
- Thiết kế sơ đồ công nghệ trực quan trên trình duyệt (Web-based PFD Designer).
- Thư viện thiết bị công nghệ: Bình tách (Separator), Tháp chưng cất, Máy nén (Compressor), Bơm, Thiết bị trao đổi nhiệt (Heat Exchanger), Tuyến ống và Van điều khiển.
- Xuất bản vẽ kỹ thuật định dạng SVG, PDF chuẩn công nghiệp.
- Hoạt động độc lập (Offline / Single-file HTML), không cần cài đặt máy chủ.

## Cấu trúc thư mục
- `pfd-studio-*.html`: Các phiên bản phát hành ứng dụng (Rev.1 đến Rev.6a).
- `PFD-001-Rev. 0.pdf`: Bản vẽ xuất bản mẫu.
- `r6/`: Gói phát triển và bàn giao phiên bản Rev.6a.

## Rev.7 (26.10.30)
- `pfd-studio-26.10.30-Rev.7.html`: bản phát hành Rev.7 (file HTML duy nhất, chạy offline).
- `r7/`: mã nguồn Rev.7 — `base7.html` (khung trang + CSS), `assemble7.py` (script gộp thành 1 file, dùng `python3 assemble7.py <output.html>`), `js/`, `lib/` (thư viện ký hiệu thiết bị), `en/` (bản dịch tiếng Anh), `scn/`, `fontwork/`, `test/` (kịch bản kiểm tra Playwright, không gồm ảnh/PDF xuất ra).

Rev.7 bổ sung: nhiều kiểu dáng thiết bị mới (~150 biến thể + 17 loại ngành khác), tô màu/viền thiết bị, nét đứt/chấm, ống hở (mũi tên công nghệ không dẫn đi đâu), biến hình vẽ thành thiết bị tuỳ chỉnh, viền ẩn & độ trong suốt, đường/mũi tên tự dính điểm nối, mũi tên hai chiều, đổi chỗ nối ống sau khi đã nối, tự tạo điểm nhánh (tee) khi kéo ống vào thân ống khác, legend liệt kê theo loại đường có trong bản vẽ, sửa lỗi tên thiết bị không đổi theo ngôn ngữ, và lệnh "Làm thẳng ống" (phím J).
