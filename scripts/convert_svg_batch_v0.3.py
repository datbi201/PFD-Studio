#!/usr/bin/env python3
"""convert_svg_batch_v0.3.py — Chuyển đổi hàng loạt SVG (Wikimedia + Radica) trong CSDL PFD/P&ID
sang định dạng ký hiệu PFD Studio (data file .js nạp bằng <script src>, chạy offline file://).

Cải tiến so với POC v0.1:
- Gán class cho cả shape chỉ có stroke không fill (POC bỏ sót -> nét chính không theo theme): fill none + stroke -> "ol".
- Màu ngoài đen/trắng/xám (xanh #004c99, đỏ...) -> chuẩn hoá về mực chính ("solid"/"ol" tuỳ fill) để đồng bộ theme.
- Bung <symbol>/<use> kiểu Radica: nội dung symbol được chèn inline, bỏ transform .5px của use.
- Giữ <style> nội bộ tối thiểu: chỉ giữ rule .class{...} sau khi đổi tên tránh đụng độ (tiền tố riêng từng ký hiệu);
  thuộc tính trình bày trong style được dịch sang class của Studio khi suy ra được, còn lại giữ nguyên qua CSS riêng.
- Ports theo nhóm: van -> W/E/N ; phụ kiện + đường/nối -> W/E ; còn lại mặc định 4 cổng của hàm S().
- Key/label/nhóm lấy từ catalog symbols_master_v1.0.json (key duy nhất, có hậu tố khi trùng).
- Bỏ qua: legend_sheets (tờ chú giải nguyên trang), SVG không có viewBox lẫn width/height, body rỗng sau khi bóc.

Đầu ra: thư mục out_dir với 1 file .js / nguồn (concat vào window.PFD_EXTRA_SYMBOLS) + report JSON.
"""
import os, re, sys, json, html, unicodedata
import xml.etree.ElementTree as ET

ROOT = "/home/hatch/workspace/pfd-pid-database"
CATALOG = os.path.join(ROOT, "06_catalog/symbols_master_v1.0.json")
NS = "{http://www.w3.org/2000/svg}"
DROP_TAGS = {"metadata", "title", "desc", "namedview", "script"}
WHITE = {"#ffffff", "#fff", "white", "rgb(255,255,255)"}
BLACK = {"#000000", "#000", "black", "rgb(0,0,0)", "#130000"}

WM_CAT_VI = {  # category_code -> nhãn nhóm trong app (Wikimedia)
    "valves_actuators": "ISO · Van & truyền động",
    "instruments": "ISO · Đo & điều khiển",
    "piping_fittings": "ISO · Phụ kiện đường ống",
    "lines_connectors": "ISO · Đường ống & nối",
    "vessels_tanks": "ISO · Bình & bồn chứa",
    "columns_reactors": "ISO · Tháp & lò phản ứng",
    "heat_transfer": "ISO · Trao đổi nhiệt",
    "separation_filtration": "ISO · Tách & lọc",
    "rotating": "ISO · Thiết bị quay",
    "solids_handling": "ISO · Xử lý chất rắn",
    "mixing": "ISO · Khuấy trộn",
    "ventilation": "ISO · Thông gió & khí thải",
    "general": "ISO · Ký hiệu chung",
}
RAD_CAT_VI = {  # subcategory (stencil) -> nhãn nhóm (Radica)
    "pid-iso-equipment": "Radica ISO · Thiết bị",
    "pid-iso-valves": "Radica ISO · Van",
    "pid-iso-instruments": "Radica ISO · Đo lường",
    "pid-iso-fittings": "Radica ISO · Phụ kiện",
    "pid-iso-pipes-and-signal-lines": "Radica ISO · Ống & tín hiệu",
    "pid-pip-equipment": "Radica PIP · Thiết bị",
    "pid-pip-valves": "Radica PIP · Van",
    "pid-pip-instruments": "Radica PIP · Đo lường",
    "pid-pip-fittings": "Radica PIP · Phụ kiện",
    "pid-pip-pipes-and-signal-lines": "Radica PIP · Ống & tín hiệu",
}
PORT_RULES_WM = {  # category_code -> ports hoặc None (= mặc định 4)
    "valves_actuators": "WEN",
    "piping_fittings": "WE",
    "lines_connectors": "WE",
}
PORT_RULES_RAD = {
    "valves": "WEN", "fittings": "WE", "pipes-and-signal-lines": "WE",
}

def slug(s, maxlen=48):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s[:maxlen].strip("_") or "sym"

def parse_style_rules(css):
    """'.a{fill:#fff;stroke:none} .b{...}' -> {'a': {'fill':..., 'stroke':...}}"""
    rules = {}
    for m in re.finditer(r"\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}", css or ""):
        d = {}
        for kv in m.group(2).split(";"):
            if ":" in kv:
                k, v = kv.split(":", 1)
                d[k.strip()] = v.strip()
        rules[m.group(1)] = d
    return rules

def classify(fillv, strokev):
    """-> class Studio hoặc None (không gán được)."""
    f = (fillv or "").replace(" ", "").lower()
    s = (strokev or "").replace(" ", "").lower()
    if f in WHITE:
        return "body"
    if f in BLACK:
        return "solid"
    if f and f != "none":
        if "808080" in f or f in ("grey", "gray", "#888", "#999", "#aaa", "#bbb", "#ccc"):
            return "grey"
        return "solid"  # màu lạ -> mực chính (đồng bộ theme)
    if s and s != "none":
        return "ol"
    return None

def get_pa(el, rules, inherited=None):
    """Thuộc tính trình bày hiệu dụng: kế thừa từ cha (fill/stroke...) <- class rule <- attr <- style attr."""
    pa = dict(inherited or {})
    cls = el.get("class", "")
    for c in cls.split():
        pa.update(rules.get(c, {}))
    for a in ("fill", "stroke", "stroke-width", "stroke-dasharray", "fill-opacity", "stroke-opacity",
              "stroke-linecap", "stroke-linejoin", "font-size", "font-family", "font-weight"):
        if el.get(a) is not None:
            pa[a] = el.get(a)
    st = el.get("style", "")
    for kv in st.split(";"):
        if ":" in kv:
            k, v = kv.split(":", 1)
            pa[k.strip()] = v.strip()
    return pa

DRAW_TAGS = {"path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "text", "g", "use"}

def clean_elem(el, out, rules, symbols, depth=0, inherited=None):
    tag = el.tag.replace(NS, "")
    if tag in DROP_TAGS or tag.startswith("{") or tag == "defs":
        return
    if tag == "svg" or tag == "symbol":
        inh = get_pa(el, rules, inherited)
        for ch in el:
            clean_elem(ch, out, rules, symbols, depth + 1, inh)
        return
    if tag == "use":
        href = el.get("href") or el.get("{http://www.w3.org/1999/xlink}href") or ""
        ref = href.lstrip("#")
        target = symbols.get(ref)
        if target is not None:
            clean_elem(target, out, rules, symbols, depth + 1, get_pa(el, rules, inherited))
        return
    if tag not in DRAW_TAGS and tag != "a":
        # thẻ lạ (image, foreignObject...) -> bỏ, nhưng vẫn duyệt con của <a>/<g> lạ
        if tag in ("a",):
            for ch in el:
                clean_elem(ch, out, rules, symbols, depth + 1, inherited)
        return
    pa = get_pa(el, rules, inherited)
    attrs = {}
    for k, v in el.attrib.items():
        if k.startswith("{") or k in ("id", "class", "style"):
            continue
        attrs[k] = v
    # ngầm định SVG: fill đen, không stroke — classify() coi f rỗng là không có fill nên phải bổ sung ở đây
    eff_fill = pa.get("fill")
    if eff_fill is None:
        eff_fill = "black"
        pa["fill"] = "black"
    if tag in ("path", "rect", "circle", "ellipse", "polygon", "polyline", "line"):
        cls = classify(pa.get("fill"), pa.get("stroke"))
        if cls:
            for a in ("fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
                      "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset",
                      "stroke-opacity", "fill-opacity", "fill-rule"):
                attrs.pop(a, None)
            attrs["class"] = cls
            if pa.get("stroke-dasharray") and pa["stroke-dasharray"] != "none" and cls == "ol":
                attrs["class"] = "dash"
        else:
            # Không gán được class: thường là fill="none" + stroke kế thừa bị xoá attr ở phần tử cha đã gán class.
            # Giữ lại stroke/fill hiệu dụng (quy về mực chuẩn #17202a) để nét không biến mất khi render độc lập.
            fv, sv = pa.get("fill"), pa.get("stroke")
            if sv and sv != "none":
                attrs["stroke"] = "#17202a"
                if not fv:
                    attrs["fill"] = "none"
            elif fv and fv != "none":
                attrs["fill"] = fv if fv in WHITE else "#17202a"
            else:
                # Không còn thông tin tô nào: phần tử này ở SVG gốc hoặc được tô bởi <g> tổ tiên đã bị
                # gán class (nét vẽ của cha không áp xuống được sau khi tách) hoặc thật sự dùng mặc định
                # fill-đen-không-stroke. Gán "ol" (nét mực, không fill) — đúng với đa số nét ký hiệu P&ID
                # và tránh mảng đen đặc do fill mặc định của SVG.
                attrs["class"] = "ol"
    elif tag == "text":
        attrs.pop("fill", None)
        attrs["fill"] = "#17202a"  # INK của Studio; sym() sẽ thay theo theme
        if pa.get("font-size"):
            attrs["font-size"] = pa["font-size"]
    astr = "".join(f' {k}="{html.escape(str(v), quote=True)}"' for k, v in attrs.items())
    kids = []
    for ch in el:
        clean_elem(ch, kids, rules, symbols, depth + 1, pa)
    inner = "".join(kids)
    if el.text and el.text.strip() and tag == "text":
        inner = html.escape(el.text.strip()) + inner
    out.append(f"<{tag}{astr}>{inner}</{tag}>" if inner else f"<{tag}{astr}/>")

def convert(path):
    tree = ET.parse(path)
    root = tree.getroot()
    symbols = {}
    rules = {}
    for el in root.iter():
        t = el.tag.replace(NS, "")
        if t == "symbol" and el.get("id"):
            symbols[el.get("id")] = el
        elif t == "style":
            rules.update(parse_style_rules(el.text or ""))
    vb = root.get("viewBox")
    if vb:
        nums = [float(x) for x in re.split(r"[\s,]+", vb.strip()) if x]
        if len(nums) != 4:
            return None, "viewBox lạ"
        x0, y0, w, h = nums
    else:
        w = float(re.sub(r"[^0-9.]", "", root.get("width", "") or "") or 0)
        h = float(re.sub(r"[^0-9.]", "", root.get("height", "") or "") or 0)
        if not w or not h:
            return None, "không có viewBox/width-height"
        x0 = y0 = 0.0
    # Radica: viewBox thường chừa lề -10..; dùng chính viewBox làm khung, nội dung tự căn giữa theo viewBox
    parts = []
    for ch in root:
        clean_elem(ch, parts, rules, symbols)
    body = "".join(parts)
    if len(body) < 20:
        return None, "body rỗng sau khi bóc"
    cx, cy = x0 + w / 2, y0 + h / 2
    scale = 72.0 / max(w, h)
    w2, h2 = round(w * scale, 1), round(h * scale, 1)
    g = (f'<g transform="translate({round(-cx * scale, 2)},{round(-cy * scale, 2)}) '
         f'scale({round(scale, 4)})">{body}</g>')
    return (w2, h2, g), None

def ports_for(rule, w, h):
    if rule == "WE":
        return [{"id": "w", "x": -w / 2, "y": 0, "d": "w"}, {"id": "e", "x": w / 2, "y": 0, "d": "e"}]
    if rule == "WEN":
        return [{"id": "w", "x": -w / 2, "y": 0, "d": "w"}, {"id": "e", "x": w / 2, "y": 0, "d": "e"},
                {"id": "n", "x": 0, "y": -h / 2, "d": "n"}]
    return None  # S() tự cấp 4 cổng mặc định

def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    catalog = json.load(open(CATALOG, encoding="utf-8"))
    used_keys = set()
    per_source = {"wikimedia_pid_symbols": [], "radica_capitalx": []}
    report = {"converted": 0, "skipped": []}
    for row in catalog:
        src = row["source_id"]
        if src not in per_source or "svg" not in row["formats"]:
            continue
        if row["category_code"] == "legend_sheets":
            report["skipped"].append((row["symbol_id"], "legend sheet — không phải ký hiệu"))
            continue
        svg_rel = next((p.strip() for p in row["file_paths"].split(";") if p.strip().endswith(".svg")), None)
        if not svg_rel:
            report["skipped"].append((row["symbol_id"], "không tìm thấy đường dẫn SVG"))
            continue
        path = os.path.join(ROOT, svg_rel)
        try:
            r, err = convert(path)
        except Exception as e:
            r, err = None, f"lỗi đọc SVG: {e}"
        if r is None:
            report["skipped"].append((row["symbol_id"], err))
            continue
        w, h, body = r
        if src == "wikimedia_pid_symbols":
            prefix_key, cat = "wm_", WM_CAT_VI.get(row["category_code"], "ISO · Ký hiệu chung")
            rule = PORT_RULES_WM.get(row["category_code"])
        else:
            prefix_key, cat = "rc_", RAD_CAT_VI.get(row["subcategory"], "Radica · Khác")
            sub = row["subcategory"].replace("pid-iso-", "").replace("pid-pip-", "")
            rule = PORT_RULES_RAD.get(sub)
        key = prefix_key + slug(row["name_normalized"] or row["name_en"])
        base_key, i = key, 2
        while key in used_keys:
            key = f"{base_key}_{i}"; i += 1
        used_keys.add(key)
        label = re.sub(r"\s+", " ", row["name_en"]).strip()
        label = re.sub(r"\s*[-—]\s*ISO 10628-2$", "", label)
        item = {"key": key, "label": label, "cat": cat, "prefix": "",
                "vars": [{"name": "A", "w": w, "h": h, "body": body}]}
        prts = ports_for(rule, w, h)
        if prts:
            item["vars"][0]["ports"] = prts
        per_source[src].append(item)
        report["converted"] += 1
    names = {"wikimedia_pid_symbols": "symbols-wikimedia_v1.0.js",
             "radica_capitalx": "symbols-radica_v1.0.js"}
    for src, items in per_source.items():
        header = (f"/* PFD Studio — data thư viện ký hiệu nguồn mở: {src} ({len(items)} ký hiệu).\n"
                  "   Sinh tự động bởi convert_svg_batch_v0.3.py từ CSDL PFD/P&ID v1.0. Nạp bằng <script src>, chạy offline. */\n")
        js = header + ("window.PFD_EXTRA_SYMBOLS=(window.PFD_EXTRA_SYMBOLS||[]).concat("
                       + json.dumps(items, ensure_ascii=False) + ");\n")
        p = os.path.join(out_dir, names[src])
        open(p, "w", encoding="utf-8").write(js)
        report[names[src]] = {"count": len(items), "bytes": len(js.encode())}
    json.dump(report, open(os.path.join(out_dir, "convert_report_v0.3.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in report.items() if k != "skipped"}, ensure_ascii=False, indent=1))
    print("SKIPPED:", len(report["skipped"]))
    for s in report["skipped"][:20]:
        print("  -", s)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "PFD-Studio_Package/data"))
