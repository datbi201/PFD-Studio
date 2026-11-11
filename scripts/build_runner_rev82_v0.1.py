#!/usr/bin/env python3
"""build_runner_rev82_v0.1.py — Dựng PFD-Studio_Rev.8.2.html từ Rev.8.1:
  1) NHÚNG toàn bộ 3 file data v1.2 (Wikimedia/Radica/draw.io đã chuẩn hoá v0.5) vào thẳng file HTML
     -> một file duy nhất, hết hẳn rủi ro mất thư mục data/ (điểm tồn tại số 1 trong QA v1.2).
     KiCad KHÔNG nhúng (đã bỏ khỏi gói: GPL-3.0 + chất lượng kém).
  2) Vá normalizeState: node nào thuộc loại ký hiệu không có trong thư viện sẽ được GHI LẠI
     vào window.__PFD_MISSING__ thay vì bị lọc bỏ lặng lẽ; script cảnh báo cuối file sẽ hiện
     băng đỏ nêu rõ số thiết bị + loại ký hiệu thiếu (kể cả khi mở bản vẽ cũ/bản vẽ từ máy khác).
  3) Băng cảnh báo cũ về data/ được thay bằng kiểm tra bản dựng nhúng (số ký hiệu mở < 500 = bản dựng lỗi).
"""
import os, re, sys

ROOT = "/home/hatch/workspace/pfd-pid-database"
PKG = os.path.join(ROOT, "PFD-Studio_Package")
SRC = os.path.join(PKG, "PFD-Studio_Rev.8.1.html")
DATA_DIR = os.path.join(PKG, "data")
OUT = os.path.join(PKG, "PFD-Studio_Rev.8.2.html")

DATA_FILES = ["symbols-wikimedia_v1.2.js", "symbols-radica_v1.2.js", "symbols-drawio_v1.2.js"]

OLD_TAGS = "".join(f'<script src="data/{n}"></script>\n' for n in
                   ["symbols-wikimedia_v1.1.js", "symbols-radica_v1.1.js",
                    "symbols-drawio_v1.1.js", "symbols-kicad_v1.1.js"])

MISSING_PATCH_OLD = ".filter(n=>SYMBOLS[n.type])"
MISSING_PATCH_NEW = (".filter(n=>{if(!SYMBOLS[n.type]){(window.__PFD_MISSING__=window.__PFD_MISSING__||[])"
                     ".push(n.type)}return SYMBOLS[n.type]})")

OLD_WARN = "/* Cảnh báo khi thiếu thư mục data/ (đề xuất trong biên bản QA 2026-11-11) */"
NEW_WARN_BLOCK = """/* Rev.8.2: thư viện ký hiệu mở đã NHÚNG trong file này — không còn phụ thuộc thư mục data/.
   Cảnh báo 1: bản dựng lỗi nếu số ký hiệu mở nạp được < 500.
   Cảnh báo 2: bản vẽ chứa loại ký hiệu không có trong thư viện (normalizeState ghi vào __PFD_MISSING__)
   -> hiện băng đỏ nêu rõ, không còn mất thiết bị lặng lẽ. */
window.addEventListener("load",function(){
 function showBanner(msg){if(document.getElementById("pfdLibWarn"))return;
  var d=document.createElement("div");d.id="pfdLibWarn";
  d.style.cssText="position:fixed;top:0;left:0;right:0;z-index:99999;background:#b91c1c;color:#fff;padding:10px 14px;font:600 14px Arial,sans-serif;text-align:center";
  d.textContent=msg;document.body.appendChild(d);}
 setTimeout(function(){try{
  var n=(window.PFD_EXTRA_SYMBOLS||[]).length;
  if(n<500)showBanner("⚠ BẢN DỰNG LỖI: thư viện ký hiệu mở nhúng trong file chỉ nạp được "+n+" ký hiệu (đúng phải có 842). Hãy dùng file PFD-Studio_Rev.8.2.html nguyên bản trong gói v1.3.");
 }catch(e){}},400);
 setInterval(function(){try{
  var miss=window.__PFD_MISSING__||[];
  if(miss.length){window.__PFD_MISSING__=[];
   var cnt={},uniq=[];miss.forEach(function(t){if(!cnt[t]){cnt[t]=0;uniq.push(t)}cnt[t]++});
   var detail=uniq.map(function(t){return t+" ("+cnt[t]+")"}).join(", ");
   showBanner("⚠ BẢN VẼ CHỨA "+miss.length+" THIẾT BỊ thuộc "+uniq.length+" loại ký hiệu KHÔNG có trong thư viện của bản này nên không hiển thị được: "+detail+". Các thiết bị còn lại vẫn mở bình thường; đừng lưu đè nếu cần giữ nguyên bản vẽ gốc.");
  }
 }catch(e){}},1200);
});"""


def main():
    html = open(SRC, encoding="utf-8").read()
    assert OLD_TAGS in html, "không tìm thấy khối <script src=data/...> của Rev.8.1"
    inline = []
    for name in DATA_FILES:
        js = open(os.path.join(DATA_DIR, name), encoding="utf-8").read()
        assert "</script" not in js, f"{name} chứa </script — không nhúng được"
        inline.append(f"<!-- ===== THƯ VIỆN NHÚNG: {name} ===== -->\n<script>\n{js}</script>\n")
    html = html.replace(OLD_TAGS, "".join(inline))
    assert MISSING_PATCH_OLD in html, "không tìm thấy .filter(n=>SYMBOLS[n.type])"
    html = html.replace(MISSING_PATCH_OLD, MISSING_PATCH_NEW, 1)
    # thay toàn bộ khối script cảnh báo cũ (từ marker tới </script> ngay sau nó)
    i = html.find(OLD_WARN)
    assert i >= 0, "không tìm thấy script cảnh báo cũ"
    j = html.find("</script>", i)
    assert j > i
    html = html[:i] + NEW_WARN_BLOCK + html[j:]
    html = html.replace("/* ===== NẠP THƯ VIỆN KÝ HIỆU TỪ THƯ MỤC data/ (file JS đi kèm, chạy offline) ===== */",
                        "/* ===== NẠP THƯ VIỆN KÝ HIỆU MỞ (đã nhúng trong file, Rev.8.2) ===== */")
    open(OUT, "w", encoding="utf-8").write(html)
    print(f"OK -> {OUT} ({len(html.encode())/1024:.0f} KB)")

if __name__ == "__main__":
    main()
