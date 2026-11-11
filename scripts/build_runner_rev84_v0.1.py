# -*- coding: utf-8 -*-
"""build_runner_rev84_v0.1.py — Dựng PFD-Studio_Rev.8.4.html từ Rev.8.3:
nhúng thêm khối dữ liệu Draftsperson (symbols-draftsperson_v1.0.js, 150 ký hiệu)
ngay sau khối LibreOffice; cập nhật số đếm thư viện 893 -> 1043, Rev.8.3 -> Rev.8.4,
gói v1.4 -> v1.5. Loader nhãn Việt của Rev.8.3 áp dụng nguyên cho file mới."""
import os, json, re

ROOT = os.path.expanduser("~/workspace/pfd-pid-database")
PKG = os.path.join(ROOT, "PFD-Studio_Package")
SRC = os.path.join(PKG, "PFD-Studio_Rev.8.3.html")
DST = os.path.join(PKG, "PFD-Studio_Rev.8.4.html")

html = open(SRC, encoding="utf-8").read()
dp_js = open(os.path.join(PKG, "data", "symbols-draftsperson_v1.0.js"), encoding="utf-8").read()
assert "</script" not in dp_js
i = dp_js.index(".concat(") + len(".concat(")
n_dp = len(json.loads(dp_js[i:dp_js.rindex("]") + 1]))
total = 893 + n_dp

anchor = "symbols-libreoffice_v1.0.js"
i = html.index(anchor)
j = html.index("</script>", i) + len("</script>")
html = html[:j] + f"\n<!-- ===== THƯ VIỆN NHÚNG: symbols-draftsperson_v1.0.js ===== -->\n<script>\n{dp_js}</script>" + html[j:]

assert "đúng phải có 893" in html
html = html.replace("đúng phải có 893", f"đúng phải có {total}")
html = html.replace("PFD-Studio_Rev.8.3.html", "PFD-Studio_Rev.8.4.html")
html = html.replace("Rev.8.3", "Rev.8.4")
html = html.replace("gói v1.4", "gói v1.5")
open(DST, "w", encoding="utf-8").write(html)
print(f"OK -> {DST} ({len(html)//1024} KB), tổng ký hiệu mở: {total}")
