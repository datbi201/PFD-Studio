#!/usr/bin/env python3
"""convert_gallery_v0.1.py — chuyển 314 ký hiệu LibreOffice Gallery ISO 10628 (đã xuất SVG bằng UNO)
sang định dạng PFD Studio, dùng chung bộ máy chuẩn hoá của normalize_convert_all_v0.6.
Khử trùng: (a) theo mã REG của ISO 10628 đối chiếu catalog Wikimedia (reg_no) của các ký hiệu ĐÃ có;
(b) theo nhãn tiếng Anh chuẩn hoá trùng hệt với thư viện hiện hữu; (c) trùng nội bộ Gallery.
Xuất: PFD-Studio_Package/data/symbols-libreoffice_v1.0.js + báo cáo convert_gallery_report_v0.1.json.
Nhãn Việt để trống — bổ sung bằng apply_labels (labels_vi_part4.json) như các nguồn khác."""
import json, os, re, sys, importlib.util

ROOT = "/home/hatch/workspace/pfd-pid-database"
spec = importlib.util.spec_from_file_location("v06", os.path.join(ROOT, "07_build_scripts/normalize_convert_all_v0.6.py"))
v06 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v06)
slug = v06.slug
GAL = os.path.join(ROOT, "08_more_sources")
MAN = json.load(open(os.path.join(GAL, "gallery_manifest_v0.2.json"), encoding="utf-8"))
CATS = {"A": "LibreOffice · Bình & tháp", "B": "LibreOffice · Thiết bị quá trình", "C": "LibreOffice · Vận chuyển & ống"}
LIC = "LGPL-3.0 (LibreOffice Gallery for P&ID ISO 10628)"

def load_js(p):
    t = open(p, encoding="utf-8").read(); i = t.index(".concat([") + len(".concat(")
    return json.loads(t[i:t.rindex("]") + 1])

# --- tập REG + nhãn đã có trong thư viện ---
def build_existing():
    cat = json.load(open(os.path.join(ROOT, "06_catalog/symbols_master_v1.0.json"), encoding="utf-8"))
    def load(p):
        t = open(p, encoding="utf-8").read(); i = t.index(".concat([") + len(".concat(")
        return json.loads(t[i:t.rindex("]") + 1])
    wm = load(os.path.join(ROOT, "staging_v06/symbols-wikimedia_v1.3.js"))
    wm_keys = {s["key"] for s in wm}
    regs = set()
    for r in cat:
        if r["source_id"] != "wikimedia_pid_symbols" or not r.get("reg_no"):
            continue
        base = "wm_" + slug(r["name_normalized"] or r["name_en"])
        if base in wm_keys or (base + "_2") in wm_keys:
            regs.add(r["reg_no"].strip().upper())
    labels = set()
    for f in ("symbols-wikimedia_v1.3.js", "symbols-radica_v1.3.js", "symbols-drawio_v1.3.js"):
        for s in load(os.path.join(ROOT, "staging_v06", f)):
            labels.add(norm_label(s["label"]))
    return regs, labels

def norm_label(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

SPELL = [("Barel", "Barrel"), ("citern", "cistern"), ("flate-blade", "flat-blade"),
         ("gat paddle", "gate paddle"), ("geeral", "general"), ("butterly", "butterfly"),
         ("exchnager", "exchanger"), ("Characeristics", "Characteristics"),
         ("glob type", "globe type")]
def split_title(t):
    # hậu tố " - 301" / " - X8079" = mã REG ISO; " - C0001" = mã nội bộ của extension (cũng tách khỏi nhãn)
    m = re.match(r"^(.*?) - ([XC]?\d{3,4})$", t.strip())
    if m:
        code = m.group(2).upper()
        reg = "" if code.startswith("C") else code
        label = m.group(1).strip()
    else:
        label, reg = t.strip(), ""
    for a, b in SPELL: label = label.replace(a, b)
    return label, reg

def main():
    regs_have, labels_have = build_existing()
    print("REG đã có:", len(regs_have), "| nhãn đã có:", len(labels_have))
    out, dropped, seen_titles = [], [], set()
    for tn, items in MAN["themes"].items():
        letter = tn.split("ISO 10628 ")[1][0]
        for it in items:
            if not it["ok"]:
                dropped.append((it["title"], "xuất SVG lỗi")); continue
            label, reg = split_title(it["title"])
            if reg and reg in regs_have:
                dropped.append((it["title"], f"trùng REG {reg} với Wikimedia")); continue
            nl = norm_label(label)
            if nl in labels_have:
                dropped.append((it["title"], "trùng nhãn với thư viện")); continue
            if nl in seen_titles:
                dropped.append((it["title"], "trùng nội bộ Gallery")); continue
            seen_titles.add(nl)
            path = os.path.join(GAL, "gallery_svg", it["file"])
            els, vb, us = v06.collect_svg_elements(path)
            built = v06.build_symbol(els, it["file"])
            if built is None:
                dropped.append((it["title"], "không dựng được hình")); continue
            body, w, h, ports, stats = built[0], built[1], built[2], built[3], built[4]
            key = "lo_" + slug(label) + (("_" + reg.lower()) if reg else "")
            out.append({"key": key, "label": label, "cat": CATS[letter], "prefix": "",
                        "lic": LIC, "reg": reg,
                        "vars": [{"name": "A", "w": w, "h": h, "body": body, "ports": ports}],
                        "ports_real": bool(ports)})
    # chống trùng key
    seen = set(); final = []
    for s in out:
        k = s["key"]; n = 2
        while k in seen: k = f"{s['key']}_{n}"; n += 1
        s["key"] = k; seen.add(k); final.append(s)
    js = ("/* PFD Studio — thư viện ký hiệu LibreOffice Gallery ISO 10628 (LGPL-3.0), chuẩn hoá v0.6 */\n"
          "window.PFD_EXTRA_SYMBOLS=(window.PFD_EXTRA_SYMBOLS||[]).concat("
          + json.dumps(final, ensure_ascii=False, separators=(",", ":")) + ");\n")
    assert "</script" not in js
    outp = os.path.join(ROOT, "PFD-Studio_Package/data/symbols-libreoffice_v1.0.js")
    open(outp, "w", encoding="utf-8").write(js)
    rep = {"kept": len(final), "dropped": len(dropped),
           "drop_reasons": dropped, "keys": [s["key"] for s in final]}
    json.dump(rep, open(os.path.join(ROOT, "07_build_scripts/convert_gallery_report_v0.1.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"GIỮ {len(final)} | BỎ {len(dropped)} -> {outp}")

if __name__ == "__main__":
    main()
