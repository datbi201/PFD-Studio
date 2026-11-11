#!/usr/bin/env python3
"""apply_labels_vi_v0.1.py — gắn nhãn tiếng Việt (labelVi) vào 3 file data v1.3.
Nguồn dịch: labels_vi_part1/2/3.json (key -> nhãn Việt). Item giữ nguyên 'label' (Anh);
loader của Rev.8.3 sẽ hiển thị labelVi và đăng ký EN[labelVi] = label gốc để chế độ English vẫn đúng.
Chạy lại an toàn (ghi đè labelVi)."""
import json, os, re
ROOT = "/home/hatch/workspace/pfd-pid-database"
SCR = os.path.join(ROOT, "07_build_scripts")
DATA = os.path.join(ROOT, "PFD-Studio_Package", "data")
FILES = ["symbols-wikimedia_v1.3.js", "symbols-radica_v1.3.js", "symbols-drawio_v1.3.js", "symbols-libreoffice_v1.0.js"]

def load_js(path):
    t = open(path, encoding="utf-8").read()
    i = t.index(".concat([") + len(".concat(")
    return t[:i], json.loads(t[i:t.rindex("]") + 1])

def main():
    vi = {}
    for n in (1, 2, 3, 4):
        vi.update(json.load(open(os.path.join(SCR, f"labels_vi_part{n}.json"), encoding="utf-8")))
    print("bản đồ dịch:", len(vi), "key")
    for f in FILES:
        path = os.path.join(DATA, f)
        head, items = load_js(path)
        miss = []
        for s in items:
            v = vi.get(s["key"])
            if v: s["labelVi"] = v
            else: miss.append(s["key"])
        js = head + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ");\n"
        assert "</script" not in js
        open(path, "w", encoding="utf-8").write(js)
        print(f, len(items), "ký hiệu; thiếu dịch:", len(miss), miss[:5])

if __name__ == "__main__":
    main()
