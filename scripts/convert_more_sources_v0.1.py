#!/usr/bin/env python3
"""convert_more_sources_v0.1.py — Đợt bổ sung dần cho PFD Studio:
1) draw.io PID stencils (87 shape, XML mxGraph) -> data .js
   - Hình: background/foreground gồm path(move/line/arc/curve/quad/close), rect, ellipse, text;
     lệnh tô fill/stroke/fillstroke áp cho các phần tử tích luỹ kể từ lệnh tô trước (đúng ngữ nghĩa draw.io).
   - Cổng: lấy từ <connections><constraint> có tên W/E/N/S (bỏ 'center') — cổng THẬT theo nguồn.
   - Giấy phép draw.io: Apache-2.0.
2) KiCad pnid-lib (PnID.kicad_sym, S-expression) -> data .js
   - Gộp các unit _0_1/_1_1... của cùng ký hiệu; hình: rectangle/polyline/circle/arc; trục y KiCad hướng lên -> lật dấu y.
   - Cổng: từ chân pin (vị trí + góc) — cổng THẬT theo nguồn.
   - Giấy phép GPL-3.0: tách file riêng symbols-kicad_v1.0.js, ghi rõ trong header + báo cáo để Đạt quyết khi phân phối.
Đầu ra cùng định dạng window.PFD_EXTRA_SYMBOLS như các đợt trước. Ports trong hệ toạ độ đã căn giữa (0,0) & co giãn.
"""
import os, re, sys, json, math, html
import xml.etree.ElementTree as ET

ROOT = "/home/hatch/workspace/pfd-pid-database"
INK = "#17202a"

def slug(s, maxlen=48):
    import unicodedata
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s[:maxlen].strip("_") or "sym"

def r1(v):
    return round(v, 1)

# ================= draw.io =================
DRAWIO_DIR = os.path.join(ROOT, "01_repos/drawio-vmassol/war/stencils/pid")
DIO_CAT = {
    "valves": "draw.io · Van",
    "pumps": "draw.io · Bơm",
    "compressors": "draw.io · Máy nén",
    "heat_exchangers": "draw.io · Trao đổi nhiệt",
    "vessels": "draw.io · Bình & bồn",
    "instruments": "draw.io · Đo lường",
}

def dio_path_d(path_el):
    d = []
    for c in path_el:
        t = c.tag
        if t == "move":
            d.append(f"M{float(c.get('x'))} {float(c.get('y'))}")
        elif t == "line":
            d.append(f"L{float(c.get('x'))} {float(c.get('y'))}")
        elif t == "arc":
            d.append(f"A{float(c.get('rx'))} {float(c.get('ry'))} {float(c.get('x-axis-rotation','0'))} "
                     f"{int(c.get('large-arc-flag','0'))} {int(c.get('sweep-flag','0'))} {float(c.get('x'))} {float(c.get('y'))}")
        elif t == "curve":
            d.append(f"C{float(c.get('x1'))} {float(c.get('y1'))} {float(c.get('x2'))} {float(c.get('y2'))} "
                     f"{float(c.get('x'))} {float(c.get('y'))}")
        elif t == "quad":
            d.append(f"Q{float(c.get('x1'))} {float(c.get('y1'))} {float(c.get('x'))} {float(c.get('y'))}")
        elif t == "close":
            d.append("Z")
    return " ".join(d)

def dio_render(container):
    """Trả về chuỗi SVG cho 1 background/foreground: tích luỹ phần tử, lệnh tô quyết định class."""
    out, pending = [], []
    def flush(op):
        if not pending:
            return
        cls = {"fillstroke": "body", "fill": "solid", "stroke": "ol"}.get(op, "ol")
        for el in pending:
            out.append(el.replace('class="PEND"', f'class="{cls}"'))
        pending.clear()
    if container is None:
        return ""
    for c in container:
        t = c.tag
        if t == "path":
            d = dio_path_d(c)
            if d:
                pending.append(f'<path class="PEND" d="{html.escape(d, quote=True)}"/>')
        elif t == "rect":
            x, y, w, h = (float(c.get(a)) for a in ("x", "y", "w", "h"))
            pending.append(f'<rect class="PEND" x="{x}" y="{y}" width="{w}" height="{h}"/>')
        elif t == "ellipse":
            x, y, w, h = (float(c.get(a)) for a in ("x", "y", "w", "h"))
            pending.append(f'<ellipse class="PEND" cx="{x + w/2}" cy="{y + h/2}" rx="{w/2}" ry="{h/2}"/>')
        elif t == "text":
            s = c.get("str", "")
            if s.strip():
                x, y = float(c.get("x", 0)), float(c.get("y", 0))
                fs = 9
                out.append(f'<text x="{x}" y="{y}" text-anchor="middle" font-size="{fs}" font-weight="700" fill="{INK}">{html.escape(s)}</text>')
        elif t in ("fill", "stroke", "fillstroke"):
            flush(t)
        # save/restore/strokewidth/linejoin/fontsize/fontcolor: bỏ qua (Studio tự chuẩn hoá nét)
    flush("stroke")  # phần tử cuối chưa có lệnh tô -> nét (đa số là nét phụ)
    return "".join(out)

def convert_drawio():
    items, used = [], set()
    for fname in sorted(os.listdir(DRAWIO_DIR)):
        if not fname.endswith(".xml"):
            continue
        group = fname[:-4]
        cat = DIO_CAT.get(group, "draw.io · Khác")
        root = ET.parse(os.path.join(DRAWIO_DIR, fname)).getroot()
        for sh in root.iter("shape"):
            name = sh.get("name", "shape")
            w, h = float(sh.get("w", 100)), float(sh.get("h", 100))
            body_raw = dio_render(sh.find("background")) + dio_render(sh.find("foreground"))
            if len(body_raw) < 15:
                continue
            cx, cy = w / 2, h / 2
            scale = 72.0 / max(w, h)
            w2, h2 = r1(w * scale), r1(h * scale)
            body = (f'<g transform="translate({round(-cx*scale,2)},{round(-cy*scale,2)}) '
                    f'scale({round(scale,4)})">{body_raw}</g>')
            ports = []
            conns = sh.find("connections")
            if conns is not None:
                for cst in conns.iter("constraint"):
                    nm = (cst.get("name") or "").lower()
                    if nm not in ("w", "e", "n", "s"):
                        continue
                    px = (float(cst.get("x")) * w - cx) * scale
                    py = (float(cst.get("y")) * h - cy) * scale
                    ports.append({"id": nm, "x": r1(px), "y": r1(py), "d": nm})
            key = "dio_" + slug(group + "_" + name)
            base, i = key, 2
            while key in used:
                key = f"{base}_{i}"; i += 1
            used.add(key)
            it = {"key": key, "label": name, "cat": cat, "prefix": "",
                  "vars": [{"name": "A", "w": w2, "h": h2, "body": body}]}
            if ports:
                it["vars"][0]["ports"] = ports
            items.append(it)
    return items

# ================= KiCad =================
KICAD_FILE = os.path.join(ROOT, "01_repos/pnid-lib-kicad/PnID.kicad_sym")

def sexp_parse(text):
    toks = re.findall(r'\(|\)|"(?:[^"\\]|\\.)*"|[^\s()]+', text)
    pos = 0
    def parse():
        nonlocal pos
        t = toks[pos]; pos += 1
        if t == "(":
            out = []
            while toks[pos] != ")":
                out.append(parse())
            pos += 1
            return out
        if t.startswith('"'):
            return ("STR", t[1:-1])
        try:
            return float(t)
        except ValueError:
            return t
    return parse()

def find_all(node, tag):
    out = []
    if isinstance(node, list):
        if node and node[0] == tag:
            out.append(node)
        for ch in node:
            out.extend(find_all(ch, tag))
    return out

def sub(node, tag):
    for ch in node[1:]:
        if isinstance(ch, list) and ch and ch[0] == tag:
            return ch
    return None

def fill_type(el):
    f = sub(el, "fill")
    if f:
        t = sub(f, "type")
        if t:
            return t[1]
    return "none"

def arc_path(sx, sy, mx, my, ex, ey):
    """Cung qua 3 điểm (start, mid, end) trong hệ đã lật y -> path A của SVG."""
    d = 2 * (sx * (my - ey) + mx * (ey - sy) + ex * (sy - my))
    if abs(d) < 1e-9:
        return f"M{sx} {sy} L{ex} {ey}"
    ux = ((sx**2 + sy**2) * (my - ey) + (mx**2 + my**2) * (ey - sy) + (ex**2 + ey**2) * (sy - my)) / d
    uy = ((sx**2 + sy**2) * (ex - mx) + (mx**2 + my**2) * (sx - ex) + (ex**2 + ey**2) * (mx - sx)) / d
    r = math.hypot(sx - ux, sy - uy)
    cross = (mx - sx) * (ey - sy) - (my - sy) * (ex - sx)
    sweep = 1 if cross < 0 else 0  # đã lật y: dấu chéo đảo so với hệ KiCad gốc
    return f"M{sx} {sy} A{r:.2f} {r:.2f} 0 0 {sweep} {ex} {ey}"

def convert_kicad():
    tree = sexp_parse(open(KICAD_FILE, encoding="utf-8").read())
    units = {}
    for node in tree[1:]:
        if not (isinstance(node, list) and node and node[0] == "symbol"):
            continue
        base = node[1][1]
        subs = []
        for ch in node[1:]:
            if isinstance(ch, list) and ch and ch[0] == "symbol":
                nm = ch[1][1] if isinstance(ch[1], tuple) else ch[1]
                if re.match(r"^.*_\d+_\d+$", str(nm)):
                    subs.append(ch)
        if subs:
            units[base] = subs
    items, used = [], set()
    for name in sorted(units.keys()):
        els, pins = [], []
        def fy(y):  # KiCad y hướng lên -> SVG y hướng xuống
            return -y
        for un in units[name]:
            for el in un[1:]:
                if not isinstance(el, list) or not el:
                    continue
                t = el[0]
                if t == "rectangle":
                    st, en = sub(el, "start"), sub(el, "end")
                    x0, y0, x1, y1 = st[1], fy(st[2]), en[1], fy(en[2])
                    cls = "body" if fill_type(el) == "background" else "ol"
                    els.append(f'<rect class="{cls}" x="{min(x0,x1)}" y="{min(y0,y1)}" '
                               f'width="{abs(x1-x0)}" height="{abs(y1-y0)}"/>')
                elif t == "circle":
                    c, r = sub(el, "center"), sub(el, "radius")
                    cls = "body" if fill_type(el) == "background" else "ol"
                    els.append(f'<circle class="{cls}" cx="{c[1]}" cy="{fy(c[2])}" r="{r[1]}"/>')
                elif t == "polyline":
                    pts = sub(el, "pts")
                    xy = [(p[1], fy(p[2])) for p in pts[1:] if isinstance(p, list) and p and p[0] == "xy"]
                    if len(xy) < 2:
                        continue
                    d = "M" + " L".join(f"{x} {y}" for x, y in xy)
                    cls = "body" if fill_type(el) == "background" else "ol"
                    els.append(f'<path class="{cls}" d="{d}"/>')
                elif t == "arc":
                    st, md, en = sub(el, "start"), sub(el, "mid"), sub(el, "end")
                    if not (st and md and en):
                        continue
                    d = arc_path(st[1], fy(st[2]), md[1], fy(md[2]), en[1], fy(en[2]))
                    cls = "body" if fill_type(el) == "background" else "ol"
                    els.append(f'<path class="{cls}" d="{d}"/>')
                elif t == "pin":
                    at = sub(el, "at")
                    if at:
                        ang = at[3] if len(at) > 3 else 0
                        pins.append((at[1], fy(at[2]), ang))
                elif t == "text":
                    s = el[1][1] if len(el) > 1 and isinstance(el[1], tuple) else ""
                    at = sub(el, "at")
                    if s and at:
                        els.append(f'<text x="{at[1]}" y="{fy(at[2])}" text-anchor="middle" '
                                   f'font-size="1.6" font-weight="700" fill="{INK}">{html.escape(s)}</text>')
        if not els:
            continue
        # khung bao từ toạ độ trong body (xấp xỉ bằng regex số trong thuộc tính d/x/cx...)
        nums_x, nums_y = [], []
        for e in els:
            for a in re.finditer(r'(?:x|cx)="(-?[0-9.]+)"', e):
                nums_x.append(float(a.group(1)))
            for a in re.finditer(r'(?:y|cy)="(-?[0-9.]+)"', e):
                nums_y.append(float(a.group(1)))
            for a in re.finditer(r'd="M([^"]+)"', e):
                for pair in re.finditer(r"(-?[0-9.]+) (-?[0-9.]+)", a.group(1)):
                    nums_x.append(float(pair.group(1))); nums_y.append(float(pair.group(2)))
        for (px, py, _a) in pins:
            nums_x.append(px); nums_y.append(py)
        if not nums_x or not nums_y:
            continue
        x0, x1, y0, y1 = min(nums_x), max(nums_x), min(nums_y), max(nums_y)
        w, h = max(1.0, x1 - x0), max(1.0, y1 - y0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        scale = 72.0 / max(w, h)
        w2, h2 = r1(w * scale), r1(h * scale)
        body = (f'<g transform="translate({round(-cx*scale,2)},{round(-cy*scale,2)}) '
                f'scale({round(scale,4)})">' + "".join(els) + "</g>")
        ports, seen_dir = [], {}
        for (px, py, ang) in pins:
            d = {0: "e", 90: "n", 180: "w", 270: "s"}.get(int(ang) % 360)
            if not d:
                continue
            seen_dir[d] = seen_dir.get(d, 0) + 1
            pid = d if seen_dir[d] == 1 else f"{d}{seen_dir[d]}"
            ports.append({"id": pid, "x": r1((px - cx) * scale), "y": r1((py - cy) * scale), "d": d})
        key = "kc_" + slug(name)
        base, i = key, 2
        while key in used:
            key = f"{base}_{i}"; i += 1
        used.add(key)
        it = {"key": key, "label": name.replace("_", " "), "cat": "KiCad · PnID (GPL)", "prefix": "",
              "vars": [{"name": "A", "w": w2, "h": h2, "body": body}]}
        if ports:
            it["vars"][0]["ports"] = ports
        items.append(it)
    return items

def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    jobs = [
        ("symbols-drawio_v1.0.js", convert_drawio(),
         "draw.io PID stencils (mxGraph) — giấy phép Apache-2.0. Cổng nối lấy từ constraint W/E/N/S của nguồn."),
        ("symbols-kicad_v1.0.js", convert_kicad(),
         "KiCad pnid-lib (SpaceTeam) — giấy phép GPL-3.0: file tách riêng để Đạt quyết khi phân phối sản phẩm. "
         "Cổng nối lấy từ chân pin (vị trí + góc) của nguồn."),
    ]
    rep = {}
    for fname, items, note in jobs:
        js = (f"/* PFD Studio — data bổ sung: {note} ({len(items)} ký hiệu)\n"
              "   Sinh bởi convert_more_sources_v0.1.py. Nạp bằng <script src>, chạy offline. */\n"
              "window.PFD_EXTRA_SYMBOLS=(window.PFD_EXTRA_SYMBOLS||[]).concat("
              + json.dumps(items, ensure_ascii=False) + ");\n")
        open(os.path.join(out_dir, fname), "w", encoding="utf-8").write(js)
        rep[fname] = {"count": len(items), "bytes": len(js.encode()),
                      "with_ports": sum(1 for i in items if "ports" in i["vars"][0])}
        print(fname, rep[fname])
    json.dump(rep, open(os.path.join(ROOT, "07_build_scripts/convert_more_report_v0.1.json"), "w"),
              ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "PFD-Studio_Package/data"))
