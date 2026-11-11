#!/usr/bin/env python3
"""build_runner_rev83_v0.1.py — Dựng PFD-Studio_Rev.8.3.html từ Rev.8.2:
  1) Thay 3 khối dữ liệu nhúng v1.2 bằng data v1.3 (converter v0.6: sửa stray băng tải,
     nét đặc stroke-to-path, khôi phục van plug NC, bỏ mẫu EMSR) + nhãn tiếng Việt (labelVi).
  2) Vá loader: ưu tiên labelVi khi hiển thị và đăng ký EN[labelVi] = nhãn Anh gốc,
     để nút chuyển ngôn ngữ EN/VI của app vẫn dịch đúng các ký hiệu nhập.
  3) Cập nhật số đếm + số phiên bản trong băng cảnh báo bản dựng.
"""
import json, os, re
ROOT = "/home/hatch/workspace/pfd-pid-database"
PKG = os.path.join(ROOT, "PFD-Studio_Package")
SRC = os.path.join(PKG, "PFD-Studio_Rev.8.2.html")
OUT = os.path.join(PKG, "PFD-Studio_Rev.8.3.html")
PAIRS = [("symbols-wikimedia_v1.2.js", "symbols-wikimedia_v1.3.js"),
         ("symbols-radica_v1.2.js", "symbols-radica_v1.3.js"),
         ("symbols-drawio_v1.2.js", "symbols-drawio_v1.3.js")]

def count_items(js):
    i = js.index(".concat([") + len(".concat(")
    return len(json.loads(js[i:js.rindex("]") + 1]))

def main():
    html = open(SRC, encoding="utf-8").read()
    total = 0
    for old, new in PAIRS:
        js = open(os.path.join(PKG, "data", new), encoding="utf-8").read()
        assert "</script" not in js
        total += count_items(js)
        pat = re.compile(r"(<!-- ===== THƯ VIỆN NHÚNG: )" + re.escape(old) + r"( ===== -->\n<script>\n).*?(\n</script>)", re.S)
        html, n = pat.subn(lambda m: m.group(1) + new + m.group(2) + js + m.group(3), html, count=1)
        assert n == 1, f"không thay được khối {old}"
    # chèn thêm khối dữ liệu LibreOffice ngay sau khối draw.io
    lo_js = open(os.path.join(PKG, "data", "symbols-libreoffice_v1.0.js"), encoding="utf-8").read()
    assert "</script" not in lo_js
    total += count_items(lo_js)
    anchor = "symbols-drawio_v1.3.js"
    i = html.index(anchor)
    j = html.index("</script>", i) + len("</script>")
    html = html[:j] + f"\n<!-- ===== THƯ VIỆN NHÚNG: symbols-libreoffice_v1.0.js ===== -->\n<script>\n{lo_js}</script>" + html[j:]
    old_loader = "reg(d.key,d.label,d.cat,d.prefix,"
    new_loader = "reg(d.key,(function(){var lb=d.labelVi||d.label;if(d.labelVi){try{EN[d.labelVi]=d.label}catch(e){}}return lb})(),d.cat,d.prefix,"
    assert old_loader in html
    html = html.replace(old_loader, new_loader, 1)
    html = html.replace("đúng phải có 842", f"đúng phải có {total}")
    html = html.replace("file PFD-Studio_Rev.8.2.html nguyên bản trong gói v1.3",
                        "file PFD-Studio_Rev.8.3.html nguyên bản trong gói v1.4")
    html = html.replace("(đã nhúng trong file, Rev.8.2)", "(đã nhúng trong file, Rev.8.3)")
    html = html.replace("/* Rev.8.2: thư viện ký hiệu mở đã NHÚNG", "/* Rev.8.3: thư viện ký hiệu mở đã NHÚNG")
    open(OUT, "w", encoding="utf-8").write(html)
    print(f"OK -> {OUT} ({len(html.encode())/1024:.0f} KB), tổng ký hiệu mở: {total}")

if __name__ == "__main__":
    main()
