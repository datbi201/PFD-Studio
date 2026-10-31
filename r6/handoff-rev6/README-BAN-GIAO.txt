BÀN GIAO PFD STUDIO — PHÁT TRIỂN TIẾP REV.6 (MODULE VECTOR)
==============================================================

Nội dung gói này:

1. vector-module-prompt-Rev6.md
   -> Prompt chi tiết mô tả công việc cần làm. Dán nguyên văn nội dung
      file này cho agent/AI sẽ triển khai tiếp.

2. pfd-studio-26.10.26-Rev.5.html
   -> Bản đã lắp ráp hoàn chỉnh, chạy được ngay bằng trình duyệt.
      Dùng để xem/so sánh trạng thái hiện tại của phần mềm.

3. pfd-studio-source/
   -> TOÀN BỘ MÃ NGUỒN RỜI (chưa gộp). Đây là phần agent kia cần
      để sửa code, gồm:
        - base5.html         (khung HTML)
        - assemble5.py       (script lắp ráp — chạy:
                               python3 assemble5.py output.html)
        - js/*.js            (từng module chức năng)
        - en/*.js            (từ điển dịch tiếng Anh)
        - lib/*.js, pipedb.js, fonts.js
        - test/*.js          (kịch bản kiểm thử Playwright — đã xoá bớt
                               ảnh/PDF kết quả cũ để gói nhẹ hơn, các
                               file test .js vẫn còn đủ)

CÁCH DÙNG:
  1. Giải nén toàn bộ, giữ nguyên cấu trúc thư mục.
  2. Gửi cho agent: nội dung file vector-module-prompt-Rev6.md +
     đường dẫn tới thư mục pfd-studio-source/.
  3. Sau khi agent chạy xong, yêu cầu họ lắp ráp bằng:
       python3 pfd-studio-source/assemble5.py pfd-studio-26.10.26-Rev.6.html
     và chạy lại test trong pfd-studio-source/test/ trước khi coi là hoàn tất.
