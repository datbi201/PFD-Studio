#!/usr/bin/env python3
"""normalize_convert_all_v0.6.py — Chuẩn hoá thư viện cho PFD Studio, vòng 2 theo biên bản QA v1.2 của Đạt (2026-11-11).

Vấn đề còn lại sau v0.4 và nguyên nhân gốc đã xác minh trong mã nguồn SVG gốc:
  (1) Wikimedia đặc đen TĂNG (65 so với 32 ở v0.3): v0.4 TÁCH path đa nhánh (compound path) thành từng nhánh
      rồi tô riêng -> các "lỗ" (vùng âm) của ký hiệu kiểu Regler/Luftfilter bị lấp -> khối đen.
      v0.5: GIỮ NGUYÊN compound path, bảo toàn fill-rule; hình kín tô đen lớn/đa nhánh => lớp "body" (viền + thân tô được),
      chỉ chi tiết tô đen NHỎ (chấm, đầu mũi tên) mới là "solid".
  (2) Sai tỉ lệ / vẽ lòi khung (gear x3, heat-exchanger-cross cao x3, rc_function_exponential 88x124):
      - bbox cũ bỏ qua độ phình của cung tròn (arc chỉ lấy 2 đầu mút) -> khung nhỏ hơn hình thật;
      - <use> trỏ tới phần tử thường (không phải <symbol>) bị bỏ qua; <use> của <symbol> có viewBox + width/height
        bị mất hệ số co giãn; chữ <tspan x/y> bị đọc sai về (0,0) và không tính bề rộng chữ vào bbox.
      v0.5: lấy mẫu điểm dọc cung cho bbox; chỉ mục id cho MỌI phần tử; use-symbol áp đúng phép co giãn viewBox;
      chữ đọc tspan và ước lượng bề rộng vào bbox.
  (3) Nguồn hỏng thật: 'Gear type, gearwheels type' có 49 <use> trỏ tới id không tồn tại trong file -> bỏ;
      'Pid combiketel' là sơ đồ chi tiết cả thiết bị (40 path + 14 text), không phải ký hiệu đơn -> bỏ.
  (4) Nhãn: 7 nhãn trùng (Air cooler, Bag, Funnel, Furnace, Kneader, Silencer, Viewing glass) -> thêm hậu tố thư mục nguồn;
      nhãn thô 'P&ID X8011' -> 'ISO symbol X8011'; nốt 2 nhãn Đức (Regler, Abzweig Verteilung).
  (5) KiCad: BỎ khỏi gói (QA: ~42/61 ký hiệu nét dày thành khối đen + giấy phép GPL-3.0 không hợp gói đóng).
Vòng v0.6 (sau QA trực quan toàn bộ 842 ký hiệu bằng contact sheet):
  (6) BUG của chính quy tắc cắt phần tử lạc ở v0.5: nó chọn hạt nhân theo DIỆN TÍCH bbox nên đường thẳng
      (diện tích 0) của 'Conveyer, belt type' bị cắt mất 3/4 nét. Thay bằng quy tắc leave-one-out:
      chỉ cắt phần tử khi bỏ nó đi làm cạnh dài khung co >= 50% mà bản thân nó <= 15% khung còn lại.
  (7) Hình kín tô đen DÀI-MỎNG (đường bao kiểu stroke-to-path của Inkscape, vd Cooler/Heater symbol):
      tỉ lệ diện tích hình / diện tích bbox < 0.20 => 'solid' (nét đặc như nguồn), không ép thành 'body'
      (body cộng thêm viền làm nét phình gấp đôi thành vệt đen lem).
      Tinh chỉnh tiếp trong cùng vòng: fill đen chỉ thành 'body' khi là hình bao chính (>= 55% diện tích
      khung) hoặc compound path; dấu đặc nội bộ giữ 'solid' — nếu không, cặp van plug NO/NC (chỉ khác nhau
      ở tô đen) sẽ trùng hệt nhau và bị khử trùng oan mất biến thể NC như ở v0.5.
  (8) Bỏ 'Allgemeiner Aufbau EMSR-Stellensymbol (DIN 19227)': mẫu biểu đồ có sẵn chữ placeholder tiếng Đức,
      không phải ký hiệu đơn.
Nền tảng giữ nguyên từ v0.4: kế thừa paint gieo từ <svg> gốc, <symbol>/<defs> chỉ vẽ qua <use> 1 lần,
khử trùng, khung ôm sát, cổng từ đầu nét thật chạm mép, xuất SVG độc lập cho Radica.
"""
import os, re, sys, json, math, html, unicodedata
import xml.etree.ElementTree as ET
import importlib.util

ROOT = "/home/hatch/workspace/pfd-pid-database"
NS = "{http://www.w3.org/2000/svg}"
INK = "#17202a"
WHITE = {"#ffffff", "#fff", "white", "rgb(255,255,255)"}
BLACK = {"#000000", "#000", "black", "rgb(0,0,0)", "#130000"}
GREYS = {"#808080", "grey", "gray", "#888", "#888888", "#999", "#999999", "#aaa", "#aaaaaa", "#bbb", "#bbbbbb", "#ccc", "#cccccc"}

def _load(mod, path):
    spec = importlib.util.spec_from_file_location(mod, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

V03 = _load("v03", os.path.join(ROOT, "07_build_scripts/convert_svg_batch_v0.3.py"))
MORE = _load("more", os.path.join(ROOT, "07_build_scripts/convert_more_sources_v0.1.py"))
slug = V03.slug
parse_style_rules = V03.parse_style_rules
get_pa = V03.get_pa
WM_CAT_VI = V03.WM_CAT_VI
RAD_CAT_VI = V03.RAD_CAT_VI

GERMAN_LABELS = {
    "Brand- und Rauchschutzklappe": "Fire and smoke damper",
    "Induktionsgerät": "Induction unit",
    "Lufterwärmer": "Air heater",
    "Luftkühler": "Air cooler",
    "Messfühler": "Measuring sensor",
    "Mischkammer mit geregeltem Luftvolumenstrom": "Mixing chamber, controlled air volume flow",
    "Mischkammer mit konstantem Luftvolumenstrom": "Mixing chamber, constant air volume flow",
    "Regler für konstanten Luftvolumenstrom": "Constant air volume flow controller",
    "Regler für variablen Luftvolumenstrom": "Variable air volume flow controller",
    "Rückschlagklappe": "Non-return damper",
    "Schalldämpfer": "Silencer",
    "Starre Luftleitungen mit Schalldämmung": "Rigid air ducts with sound insulation",
    "Starre Luftleitungen mit Wärmedämmung": "Rigid air ducts with thermal insulation",
    "Strömungsgleichrichter": "Flow straightener",
    "Ventil nach DIN": "Valve (DIN)",
    "Übergang gleichmäßig": "Gradual transition",
    "Übergang plötzlich": "Sudden transition",
    "Überströmklappe": "Overflow damper",
    "Regler": "Controller",
    "Abzweig Verteilung": "Branch distribution (tee)",
}

# ký hiệu bỏ hẳn vì nguồn hỏng / không phải ký hiệu đơn (đối chiếu biên bản QA v1.2)
DROP_KEYS = {
    "wm_gear_type_gearwheels_type": "file nguồn hỏng: 49 thẻ <use> trỏ tới id không tồn tại, chỉ còn 2 vòng tròn",
    "wm_pid_combiketel": "sơ đồ chi tiết cả thiết bị combi-boiler (40 path + 14 text), không phải ký hiệu đơn",
    "wm_symbols_iso_10628": "cả tờ bảng ký hiệu ISO 10628, không phải ký hiệu đơn (v0.5 gộp compound path nên bộ lọc >250 phần tử không còn bắt được)",
    "wm_allgemeiner_aufbau_emsr_stellensymbol_din_19227": "mẫu biểu đồ EMSR có sẵn chữ placeholder tiếng Đức (DIN 19227), không phải ký hiệu đơn",
}

# ---------- ma trận biến đổi (chỉ cần translate/scale/rotate/matrix cơ bản) ----------
IDENT = (1, 0, 0, 1, 0, 0)
def mat_mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1; a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)
def mat_pt(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)
def parse_transform(s):
    m = IDENT
    if not s:
        return m
    for cmd, args in re.findall(r"(translate|scale|rotate|matrix)\s*\(([^)]*)\)", s):
        v = [float(x) for x in re.split(r"[\s,]+", args.strip()) if x]
        if cmd == "translate":
            t = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif cmd == "scale":
            t = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        elif cmd == "rotate":
            th = math.radians(v[0]); co, si = math.cos(th), math.sin(th)
            t = (co, si, -si, co, 0, 0)
            if len(v) > 2:
                t = mat_mul(mat_mul((1, 0, 0, 1, v[1], v[2]), t), (1, 0, 0, 1, -v[1], -v[2]))
        else:
            t = tuple(v[:6])
        m = mat_mul(m, t)
    return m

# ---------- bộ phân tích path: chuẩn hoá tuyệt đối, tách nhánh ----------
TOK_RE = re.compile(r"[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

def arc_sample_pts(x0, y0, rx, ry, rot_deg, laf, sf, x1, y1):
    """Lấy mẫu điểm dọc cung tròn (tham số hoá tâm theo chuẩn SVG) để bbox không thiếu độ phình của cung."""
    if rx == 0 or ry == 0 or (x0 == x1 and y0 == y1):
        return []
    rx, ry = abs(rx), abs(ry)
    phi = math.radians(rot_deg)
    cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x0 - x1) / 2, (y0 - y1) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2)
    if lam > 1:
        s = math.sqrt(lam); rx, ry = rx * s, ry * s
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = math.sqrt(max(0.0, num / den)) if den else 0.0
    if laf == sf:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x0 + x1) / 2, sp * cxp + cp * cyp + (y0 + y1) / 2
    def ang(ux, uy, vx, vy):
        dot = (ux * vx + uy * vy) / (math.hypot(ux, uy) * math.hypot(vx, vy) + 1e-12)
        a = math.acos(max(-1.0, min(1.0, dot)))
        return -a if (ux * vy - uy * vx) < 0 else a
    ux, uy = (x1p - cxp) / rx, (y1p - cyp) / ry
    th1 = ang(1, 0, ux, uy)
    dth = ang(ux, uy, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not sf and dth > 0:
        dth -= 2 * math.pi
    elif sf and dth < 0:
        dth += 2 * math.pi
    n = max(4, min(48, int(abs(dth) / (math.pi / 12)) + 1))
    pts = []
    for i in range(1, n):
        t = th1 + dth * i / n
        ex, ey = rx * math.cos(t), ry * math.sin(t)
        pts.append((cp * ex - sp * ey + cx, sp * ex + cp * ey + cy))
    return pts
def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".") if abs(v - round(v)) > 1e-9 else str(int(round(v)))

def parse_path(d):
    """-> list subpaths: {segs:[str], pts:[(x,y)], start, end, closed}"""
    toks = TOK_RE.findall(d or "")
    subs, cur = [], None
    x = y = sx = sy = 0.0
    cmd, i = None, 0
    prev_cp2, prev_cmd = None, None
    def new_sub(nx, ny):
        nonlocal cur, sx, sy
        cur = {"segs": [f"M{fmt(nx)} {fmt(ny)}"], "pts": [(nx, ny)], "start": (nx, ny), "end": (nx, ny), "closed": False}
        subs.append(cur); sx, sy = nx, ny
    while i < len(toks):
        if re.fullmatch(r"[A-Za-z]", toks[i]):
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                if cur:
                    cur["segs"].append("Z"); cur["closed"] = True; cur["end"] = cur["start"]
                    x, y = sx, sy
                prev_cmd = cmd; continue
            if cmd in "Mm":
                continue  # xử lý ở nhánh số bên dưới
            prev_cmd = cmd; continue
        # đọc 1 nhóm tham số theo cmd hiện hành
        c = cmd or "L"
        rel = c.islower(); C = c.upper()
        def num():
            nonlocal i
            v = float(toks[i]); i += 1; return v
        def pt():
            a, b = num(), num()
            return (x + a, y + b) if rel else (a, b)
        if C == "M":
            nx, ny = pt()
            new_sub(nx, ny); x, y = nx, ny
            cmd = "l" if rel else "L"; prev_cmd = "M"; prev_cp2 = None; continue
        if cur is None:
            new_sub(x, y)
        if C == "L":
            nx, ny = pt(); cur["segs"].append(f"L{fmt(nx)} {fmt(ny)}"); cur["pts"].append((nx, ny)); x, y = nx, ny; prev_cp2 = None
        elif C == "H":
            a = num(); nx = x + a if rel else a
            cur["segs"].append(f"L{fmt(nx)} {fmt(y)}"); cur["pts"].append((nx, y)); x = nx; prev_cp2 = None
        elif C == "V":
            a = num(); ny = y + a if rel else a
            cur["segs"].append(f"L{fmt(x)} {fmt(ny)}"); cur["pts"].append((x, ny)); y = ny; prev_cp2 = None
        elif C == "C":
            x1, y1 = pt(); x2, y2 = pt(); nx, ny = pt()
            cur["segs"].append(f"C{fmt(x1)} {fmt(y1)} {fmt(x2)} {fmt(y2)} {fmt(nx)} {fmt(ny)}")
            cur["pts"] += [(x1, y1), (x2, y2), (nx, ny)]; prev_cp2 = (x2, y2); x, y = nx, ny
        elif C == "S":
            x2, y2 = pt(); nx, ny = pt()
            x1, y1 = (2 * x - prev_cp2[0], 2 * y - prev_cp2[1]) if (prev_cp2 and prev_cmd in ("C", "S")) else (x, y)
            cur["segs"].append(f"C{fmt(x1)} {fmt(y1)} {fmt(x2)} {fmt(y2)} {fmt(nx)} {fmt(ny)}")
            cur["pts"] += [(x1, y1), (x2, y2), (nx, ny)]; prev_cp2 = (x2, y2); x, y = nx, ny
        elif C == "Q":
            x1, y1 = pt(); nx, ny = pt()
            cur["segs"].append(f"Q{fmt(x1)} {fmt(y1)} {fmt(nx)} {fmt(ny)}")
            cur["pts"] += [(x1, y1), (nx, ny)]; prev_cp2 = (x1, y1); x, y = nx, ny
        elif C == "T":
            nx, ny = pt()
            x1, y1 = (2 * x - prev_cp2[0], 2 * y - prev_cp2[1]) if (prev_cp2 and prev_cmd in ("Q", "T")) else (x, y)
            cur["segs"].append(f"Q{fmt(x1)} {fmt(y1)} {fmt(nx)} {fmt(ny)}")
            cur["pts"] += [(x1, y1), (nx, ny)]; prev_cp2 = (x1, y1); x, y = nx, ny
        elif C == "A":
            rx, ry, rot = num(), num(), num(); laf, sf = num(), num(); nx, ny = pt()
            cur["segs"].append(f"A{fmt(rx)} {fmt(ry)} {fmt(rot)} {int(laf)} {int(sf)} {fmt(nx)} {fmt(ny)}")
            cur["pts"] += arc_sample_pts(x, y, rx, ry, rot, int(laf), int(sf), nx, ny)
            cur["pts"].append((nx, ny)); prev_cp2 = None; x, y = nx, ny
        else:
            break
        cur["end"] = (x, y)
        prev_cmd = C
    for s in subs:
        if not s["closed"] and math.dist(s["start"], s["end"]) <= 1.0 and len(s["segs"]) > 1:
            s["closed"] = True; s["segs"].append("Z"); s["end"] = s["start"]
    return [s for s in subs if len(s["segs"]) > 1 or s["closed"]]

def xform_sub(sp, m):
    if m == IDENT:
        return sp
    pts = [mat_pt(m, px, py) for px, py in sp["pts"]]
    # viết lại segs bằng cách biến đổi các cặp số trong chuỗi đã chuẩn hoá tuyệt đối
    def xf_seg(seg):
        head, rest = seg[0], seg[1:]
        nums = [float(v) for v in re.findall(r"[-+]?(?:\d*\.\d+|\d+\.?)", rest)]
        if head in "ML":
            X, Y = mat_pt(m, nums[0], nums[1]); return f"{head}{fmt(X)} {fmt(Y)}"
        if head == "C":
            out = []
            for k in range(0, 6, 2):
                X, Y = mat_pt(m, nums[k], nums[k + 1]); out.append(f"{fmt(X)} {fmt(Y)}")
            return "C" + " ".join(out)
        if head == "Q":
            out = []
            for k in range(0, 4, 2):
                X, Y = mat_pt(m, nums[k], nums[k + 1]); out.append(f"{fmt(X)} {fmt(Y)}")
            return "Q" + " ".join(out)
        if head == "A":
            X, Y = mat_pt(m, nums[5], nums[6])
            scx = math.hypot(m[0], m[1]) or 1; scy = math.hypot(m[2], m[3]) or 1
            return f"A{fmt(nums[0] * scx)} {fmt(nums[1] * scy)} {fmt(nums[2])} {int(nums[3])} {int(nums[4])} {fmt(X)} {fmt(Y)}"
        return seg
    segs = [xf_seg(s) if s != "Z" else "Z" for s in sp["segs"]]
    return {"segs": segs, "pts": pts, "start": mat_pt(m, *sp["start"]), "end": mat_pt(m, *sp["end"]), "closed": sp["closed"]}

# ---------- walker SVG: thu phần tử vẽ (đã biến đổi về hệ toạ độ gốc của file) ----------
DRAW = {"path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "text"}

def collect_svg_elements(path):
    """-> (elements, viewbox) ; element = dict(kind, pa, subs|shape..., pts, terminals, text...)
    v0.5: path giữ NGUYÊN đa nhánh; <use> tra id trên MỌI phần tử + áp co giãn viewBox của <symbol>;
    chữ đọc toạ độ <tspan> và tính bề rộng ước lượng vào bbox. Trả thêm stats use."""
    tree = ET.parse(path); root = tree.getroot()
    by_id, rules = {}, {}
    for el in root.iter():
        t = el.tag.replace(NS, "")
        if el.get("id"):
            by_id.setdefault(el.get("id"), el)
        if t == "style":
            rules.update(parse_style_rules(el.text or ""))
    root_pa = get_pa(root, rules, None)  # GIEO kế thừa từ thẻ <svg> gốc — sửa lỗi gốc của v0.3
    if root_pa.get("fill") is None:
        root_pa["fill"] = "black"        # mặc định SVG thật, chỉ khi file không hề khai báo
    if root_pa.get("stroke") is None:
        root_pa["stroke"] = "none"
    els = []
    ustats = {"use_total": 0, "use_missing": 0}
    def emit_draw(el, pa, m):
        t = el.tag.replace(NS, "")
        if t == "path":
            subs = [xform_sub(sp, m) for sp in parse_path(el.get("d", ""))]
            if not subs:
                return
            terms = []
            for sp in subs:
                if not sp["closed"]:
                    terms += [sp["start"], sp["end"]]
            els.append({"kind": "path", "pa": pa, "subs": subs,
                        "pts": [p for sp in subs for p in sp["pts"]],
                        "terminals": terms,
                        "closed": all(sp["closed"] for sp in subs),
                        "has_closed": any(sp["closed"] for sp in subs),
                        "n_subs": len(subs)})
        elif t in ("rect", "circle", "ellipse"):
            if t == "rect":
                X, Y = float(el.get("x", 0)), float(el.get("y", 0))
                W, H = float(el.get("width", 0)), float(el.get("height", 0))
                pts = [(X, Y), (X + W, Y), (X + W, Y + H), (X, Y + H)]
                geo = ("rect", X, Y, W, H, float(el.get("rx", 0) or 0))
            elif t == "circle":
                cx, cy, r = float(el.get("cx", 0)), float(el.get("cy", 0)), float(el.get("r", 0))
                pts = [(cx - r, cy - r), (cx + r, cy + r)]; geo = ("circle", cx, cy, r)
            else:
                cx, cy = float(el.get("cx", 0)), float(el.get("cy", 0))
                rx, ry = float(el.get("rx", 0)), float(el.get("ry", 0))
                pts = [(cx - rx, cy - ry), (cx + rx, cy + ry)]; geo = ("ellipse", cx, cy, rx, ry)
            pts = [mat_pt(m, px, py) for px, py in pts]
            els.append({"kind": t, "pa": pa, "geo": geo, "m": m, "pts": pts, "terminals": [], "closed": True})
        elif t in ("polygon", "polyline"):
            raw = [float(v) for v in re.split(r"[\s,]+", (el.get("points") or "").strip()) if v]
            pts = [(raw[i], raw[i + 1]) for i in range(0, len(raw) - 1, 2)]
            if len(pts) < 2:
                return
            pts = [mat_pt(m, px, py) for px, py in pts]
            closed = (t == "polygon") or math.dist(pts[0], pts[-1]) <= 1.0
            els.append({"kind": t, "pa": pa, "pts": pts, "closed": closed,
                        "terminals": [] if closed else [pts[0], pts[-1]]})
        elif t == "line":
            p1 = mat_pt(m, float(el.get("x1", 0)), float(el.get("y1", 0)))
            p2 = mat_pt(m, float(el.get("x2", 0)), float(el.get("y2", 0)))
            els.append({"kind": "line", "pa": pa, "pts": [p1, p2], "terminals": [p1, p2], "closed": False})
        elif t == "text":
            txt = "".join(el.itertext()).strip()
            if not txt:
                return
            # toạ độ thật thường nằm ở <tspan x/y> đầu tiên, không phải ở <text>
            tx, ty = el.get("x"), el.get("y")
            anchor = el.get("text-anchor") or pa.get("text-anchor") or "middle"
            for tsp in el.iter():
                if tsp.tag.replace(NS, "") == "tspan":
                    if tsp.get("x") is not None:
                        tx = tsp.get("x").split()[0]
                    if tsp.get("y") is not None:
                        ty = tsp.get("y").split()[0]
                    if tsp.get("text-anchor"):
                        anchor = tsp.get("text-anchor")
                    break
            try:
                fx = float(tx) if tx is not None else 0.0
            except ValueError:
                fx = 0.0
            try:
                fy = float(ty) if ty is not None else 0.0
            except ValueError:
                fy = 0.0
            X, Y = mat_pt(m, fx, fy)
            fs_raw = pa.get("font-size")
            try:
                fs = float(re.sub(r"[^0-9.]", "", str(fs_raw))) if fs_raw else 8.0
            except ValueError:
                fs = 8.0
            fs = fs * (math.hypot(m[0], m[1]) or 1.0)
            tw = 0.62 * fs * max(1, len(txt))
            if anchor == "start":
                bx0, bx1 = X, X + tw
            elif anchor == "end":
                bx0, bx1 = X - tw, X
            else:
                bx0, bx1 = X - tw / 2, X + tw / 2
            els.append({"kind": "text", "pa": pa, "pts": [(bx0, Y - 0.85 * fs), (bx1, Y + 0.25 * fs)],
                        "terminals": [], "text": txt, "anchor": anchor, "anchor_pt": (X, Y), "fs_src": fs})
    def walk(el, inherited, m, depth=0):
        t = el.tag.replace(NS, "")
        if t in ("defs", "style", "metadata", "title", "desc", "script", "symbol"):
            return  # symbol/defs KHÔNG tự vẽ — chỉ qua <use>: hết lỗi vẽ 2 lần
        pa = get_pa(el, rules, inherited)
        m2 = mat_mul(m, parse_transform(el.get("transform"))) if el.get("transform") else m
        if t == "use":
            ustats["use_total"] += 1
            href = el.get("href") or el.get("{http://www.w3.org/1999/xlink}href") or ""
            tgt = by_id.get(href.lstrip("#"))
            if tgt is None:
                ustats["use_missing"] += 1
                return
            if depth > 8:
                return
            ux, uy = float(el.get("x", 0) or 0), float(el.get("y", 0) or 0)
            m3 = mat_mul(m2, (1, 0, 0, 1, ux, uy))
            tt = tgt.tag.replace(NS, "")
            if tt == "symbol":
                # <symbol> có viewBox + use width/height => co giãn nội dung cho khớp viewport của use
                vb2 = tgt.get("viewBox")
                uw, uh = el.get("width"), el.get("height")
                if vb2 and uw and uh:
                    v = [float(x) for x in re.split(r"[\s,]+", vb2.strip()) if x]
                    if len(v) == 4 and v[2] and v[3]:
                        sx, sy = float(uw) / v[2], float(uh) / v[3]
                        m3 = mat_mul(m3, (sx, 0, 0, sy, -v[0] * sx, -v[1] * sy))
                for ch in tgt:
                    walk(ch, pa, m3, depth + 1)
            elif tt in DRAW:
                emit_draw(tgt, get_pa(tgt, rules, pa), m3)
            else:
                for ch in tgt:
                    walk(ch, get_pa(tgt, rules, pa), m3, depth + 1)
            return
        if t in DRAW:
            emit_draw(el, pa, m2); return
        for ch in el:
            walk(ch, pa, m2, depth)
    for ch in root:
        walk(ch, root_pa, IDENT)
    vb = root.get("viewBox")
    return els, vb, ustats

def norm_paint(v):
    return (v or "").replace(" ", "").lower()

def elem_area(e):
    """Diện tích xấp xỉ của phần tử (shoelace trên các điểm đã lấy mẫu, kể cả điểm điều khiển)."""
    k = e["kind"]
    if k == "path":
        tot = 0.0
        for sp in e["subs"]:
            pts = sp["pts"]; a = 0.0
            for i in range(len(pts)):
                x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
                a += x1 * y2 - x2 * y1
            tot += abs(a) / 2
        return tot
    if k == "rect":
        _, X, Y, W, H, _rx = e["geo"]; return abs(W * H)
    if k in ("circle", "ellipse"):
        if k == "circle":
            r = e["geo"][3]; return 3.14159 * r * r
        return 3.14159 * e["geo"][3] * e["geo"][4]
    if k == "polygon":
        pts = e["pts"]; a = 0.0
        for i in range(len(pts)):
            x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
            a += x1 * y2 - x2 * y1
        return abs(a) / 2
    x0, y0, x1, y1 = elem_bbox(e)
    return 0.5 * (x1 - x0) * (y1 - y0)

def elem_bbox(e):
    xs = [p[0] for p in e["pts"]]; ys = [p[1] for p in e["pts"]]
    return min(xs), min(ys), max(xs), max(ys)

def decide_class(e, content_wh, content_area=0.0):
    """-> body | bodyfill | solid | grey | ol | dash | text | drop
    v0.5: fill đen/màu + hình kín => 'body' nếu là hình LỚN hoặc path ĐA NHÁNH (giữ lỗ);
    chỉ chi tiết kín NHỎ mới giữ 'solid' (chấm, đầu mũi tên, tam giác chỉ hướng)."""
    if e["kind"] == "text":
        return "text"
    pa = e["pa"]
    f, s = norm_paint(pa.get("fill")), norm_paint(pa.get("stroke"))
    dash = bool(pa.get("stroke-dasharray")) and pa.get("stroke-dasharray") != "none"
    closed = e.get("closed")
    if e["kind"] == "path":
        closed = e.get("has_closed")
    if f in WHITE:
        if s in WHITE or s == "none" or not s:
            return "bodyfill"
        if closed:
            return "body"
        # nét hở mà fill trắng: chỉ làm body khi nó bao gần hết khung hình (vd thân bồn hở miệng)
        xs = [p[0] for p in e["pts"]]; ys = [p[1] for p in e["pts"]]
        if content_wh and (max(xs) - min(xs)) >= 0.55 * content_wh[0] and (max(ys) - min(ys)) >= 0.35 * content_wh[1]:
            return "body"
        return "dash" if dash else "ol"
    if f in ("none", ""):
        if s in WHITE:
            return "bodyfill" if closed else "drop"   # nét trắng hở = nét che (mask) -> bỏ
        if s in ("none", ""):
            return "drop"
        if closed:
            return "body"                              # đường bao kín chỉ có nét -> NÂNG thành body tô được
        return "dash" if dash else "ol"
    if f in GREYS:
        return "grey"
    # fill màu/đen thật: phân biệt thân thiết bị (body) với chi tiết đặc nhỏ (solid)
    if closed:
        ex0, ey0, ex1, ey1 = elem_bbox(e)
        bb_area = max((ex1 - ex0) * (ey1 - ey0), 1e-9)
        if elem_area(e) / bb_area < 0.20:
            return "solid"                             # v0.6: bao kín dài-mỏng (stroke-to-path) = nét đặc như nguồn
        if e["kind"] == "path" and e.get("n_subs", 1) > 1:
            return "body"                              # compound path: giữ nguyên lỗ, tô thân được
        if content_area:
            ex0, ey0, ex1, ey1 = elem_bbox(e)
            bb_a = (ex1 - ex0) * (ey1 - ey0)
            if bb_a >= 0.35 * content_area and elem_area(e) / max(bb_a, 1e-9) >= 0.6:
                return "body"                          # hình bao chính, đặc ruột (tròn/chữ nhật) -> thân tô được
        return "solid"                                 # còn lại: dấu đặc nội bộ (vd van NC tô đen, nơ van tỉ lệ 0.5) giữ solid như nguồn
    return "dash" if dash else "ol"

def geo_string(e, cls):
    """Chuỗi SVG (hệ toạ độ nguồn) cho 1 phần tử, class Studio."""
    k = e["kind"]
    if k == "path":
        d = " ".join(seg for sp in e["subs"] for seg in sp["segs"])
        fr = e["pa"].get("fill-rule")
        fr_attr = f' fill-rule="{fr}"' if fr and fr != "nonzero" else ""
        return f'<path class="{cls}"{fr_attr} d="{d}"/>'
    if k == "rect":
        _, X, Y, W, H, rx = e["geo"]
        pts = [mat_pt(e["m"], px, py) for px, py in [(X, Y), (X + W, Y), (X + W, Y + H), (X, Y + H)]]
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        return (f'<rect class="{cls}" x="{fmt(min(xs))}" y="{fmt(min(ys))}" '
                f'width="{fmt(max(xs) - min(xs))}" height="{fmt(max(ys) - min(ys))}"/>')
    if k in ("circle", "ellipse"):
        if k == "circle":
            _, cx, cy, r = e["geo"]; rx = ry = r
        else:
            _, cx, cy, rx, ry = e["geo"]
        CX, CY = mat_pt(e["m"], cx, cy)
        scx = math.hypot(e["m"][0], e["m"][1]) or 1; scy = math.hypot(e["m"][2], e["m"][3]) or 1
        return f'<ellipse class="{cls}" cx="{fmt(CX)}" cy="{fmt(CY)}" rx="{fmt(rx * scx)}" ry="{fmt(ry * scy)}"/>'
    if k in ("polygon", "polyline"):
        d = "M" + " L".join(f"{fmt(px)} {fmt(py)}" for px, py in e["pts"]) + (" Z" if e["closed"] else "")
        return f'<path class="{cls}" d="{d}"/>'
    if k == "line":
        (x1, y1), (x2, y2) = e["pts"]
        return f'<path class="{cls}" d="M{fmt(x1)} {fmt(y1)} L{fmt(x2)} {fmt(y2)}"/>'
    if k == "text":
        (X, Y) = e.get("anchor_pt", e["pts"][0])
        fs = e.get("fs_src")
        if not fs:
            raw = e["pa"].get("font-size")
            fs = float(re.sub(r"[^0-9.]", "", str(raw))) if raw else 8
        return (f'<text x="{fmt(X)}" y="{fmt(Y)}" text-anchor="{e.get("anchor", "middle")}" '
                f'font-family="Arial" font-size="{fmt(fs)}" font-weight="700" fill="{INK}">{html.escape(e["text"])}</text>')
    return ""

STANDALONE_PAINT = {
    "body":     ('fill="#FFFFFF" stroke="#000000"', True),
    "bodyfill": ('fill="#FFFFFF" stroke="none"', False),
    "solid":    ('fill="#000000" stroke="none"', False),
    "grey":     ('fill="#808080" stroke="#000000"', True),
    "ol":       ('fill="none" stroke="#000000"', True),
    "dash":     ('fill="none" stroke="#000000" stroke-dasharray="4 3"', True),
}
def geo_string_standalone(e, cls):
    if cls == "text":
        return geo_string(e, cls).replace(f'fill="{INK}"', 'fill="#000000"')
    paint, has_stroke = STANDALONE_PAINT[cls]
    sw = e["pa"].get("stroke-width")
    try:
        sw = float(sw) if sw else 1.0
    except (TypeError, ValueError):
        sw = 1.0
    base = geo_string(e, cls).replace(f'class="{cls}"', paint + (f' stroke-width="{fmt(sw)}"' if has_stroke else ""))
    return base

def build_symbol(els, src_kind):
    """els -> (studio_body, w2, h2, ports, stats, standalone_els) hoặc None nếu rỗng.
    studio_body đã căn giữa (0,0) + co giãn cạnh dài = 72."""
    # v0.6: cắt phần tử lạc bằng leave-one-out — chỉ cắt khi bỏ phần tử đi làm cạnh dài của khung
    # co >= 50% (nó đang phình khung oan) mà bản thân phần tử <= 15% cạnh dài khung còn lại.
    # (Quy tắc cụm theo diện tích ở v0.5 đã cắt nhầm các nét thẳng diện tích 0 của băng tải.)
    stats_stray = 0
    def _all_bbox(items):
        ps = [p for e in items for p in e["pts"]]
        if not ps:
            return None
        xs = [p[0] for p in ps]; ys = [p[1] for p in ps]
        return min(xs), min(ys), max(xs), max(ys)
    for _pass in range(10):
        nontext = [e for e in els if e["kind"] != "text"]
        if len(nontext) <= 2:
            break
        bb = _all_bbox(nontext)
        base_max = max(bb[2] - bb[0], bb[3] - bb[1])
        victim = None
        for e in nontext:
            rest = _all_bbox([x for x in nontext if x is not e])
            if rest is None:
                continue
            rest_max = max(rest[2] - rest[0], rest[3] - rest[1])
            ex0, ey0, ex1, ey1 = elem_bbox(e)
            edim = max(ex1 - ex0, ey1 - ey0)
            if edim <= 0.15 * rest_max and (base_max - rest_max) >= 0.5 * base_max:
                victim = e; break
        if victim is None:
            break
        els = [e for e in els if e is not victim]
        stats_stray += 1
    pts_all = [p for e in els for p in e["pts"]]
    if not pts_all:
        return None
    xs = [p[0] for p in pts_all]; ys = [p[1] for p in pts_all]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = x1 - x0, y1 - y0
    if w < 0.5 and h < 0.5:
        return None
    w = max(w, 0.5); h = max(h, 0.5)
    # phân lớp (cần content_wh cho quy tắc body nét hở)
    kept, seen, stats = [], set(), {"dup": 0, "drop": 0, "stray": stats_stray}
    for e in els:
        cls = decide_class(e, (w, h), w * h)
        if cls == "drop":
            stats["drop"] += 1; continue
        e["cls"] = cls
        g = geo_string(e, cls)
        if g in seen:
            stats["dup"] += 1; continue
        seen.add(g); e["geo_str"] = g; kept.append(e)
    if not kept:
        return None
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    scale = 72.0 / max(w, h)
    w2, h2 = round(w * scale, 1), round(h * scale, 1)
    # v0.5: NẤU phép chuẩn hoá vào thẳng toạ độ (không bọc <g scale>) — nếu không, nét vẽ trong app
    # bị nhân thêm hệ số scale của wrapper: nguồn đơn vị lớn (Wikimedia 841) thành nét tóc,
    # nguồn đơn vị nhỏ (Radica/KiCad) thành nét béo. Nấu vào toạ độ => nét đồng nhất như ký hiệu gốc của app.
    N = (scale, 0, 0, scale, -cx * scale, -cy * scale)
    def baked_geo(e):
        e2 = dict(e)
        if e["kind"] == "path":
            e2["subs"] = [xform_sub(sp, N) for sp in e["subs"]]
        elif e["kind"] in ("rect", "circle", "ellipse"):
            e2["m"] = mat_mul(N, e["m"])
        elif e["kind"] in ("polygon", "polyline", "line"):
            e2["pts"] = [mat_pt(N, px, py) for px, py in e["pts"]]
        elif e["kind"] == "text":
            e2["anchor_pt"] = mat_pt(N, *e.get("anchor_pt", e["pts"][0]))
            if e.get("fs_src"):
                e2["fs_src"] = e["fs_src"] * scale
        return geo_string(e2, e["cls"])
    body = "".join(baked_geo(e) for e in kept)
    # cổng từ đầu nét thật chạm mép khung ôm sát
    tol = max(3.0, 0.055 * max(w2, h2))
    ports, usedp = [], []
    for e in kept:
        for (px, py) in e["terminals"]:
            X, Y = (px - cx) * scale, (py - cy) * scale
            cand = None
            if abs(X + w2 / 2) <= tol: cand = ("w", -w2 / 2, Y)
            elif abs(X - w2 / 2) <= tol: cand = ("e", w2 / 2, Y)
            elif abs(Y + h2 / 2) <= tol: cand = ("n", X, -h2 / 2)
            elif abs(Y - h2 / 2) <= tol: cand = ("s", X, h2 / 2)
            if not cand:
                continue
            d, PX, PY = cand
            PY = max(-h2 / 2, min(h2 / 2, PY)); PX = max(-w2 / 2, min(w2 / 2, PX))
            if any(math.dist((PX, PY), q) < 3.5 for q in usedp):
                continue
            usedp.append((PX, PY))
            same = [p for p in ports if p["d"] == d]
            pid = d if not same else f"{d}{len(same) + 1}"
            ports.append({"id": pid, "x": round(PX, 1), "y": round(PY, 1), "d": d})
            if len(ports) >= 8:
                break
    stats["classes"] = {}
    for e in kept:
        stats["classes"][e["cls"]] = stats["classes"].get(e["cls"], 0) + 1
    standalone = (x0, y0, w, h, kept)
    return body, w2, h2, ports, stats, standalone

def fallback_ports(rule, w, h):
    if rule == "WE":
        return [{"id": "w", "x": -w / 2, "y": 0, "d": "w"}, {"id": "e", "x": w / 2, "y": 0, "d": "e"}]
    if rule == "WEN":
        return [{"id": "w", "x": -w / 2, "y": 0, "d": "w"}, {"id": "e", "x": w / 2, "y": 0, "d": "e"},
                {"id": "n", "x": 0, "y": -h / 2, "d": "n"}]
    return None

# ---------- nguồn SVG (Wikimedia + Radica) ----------
def convert_svg_sources(catalog, fixed_dir):
    wm_items, rad_items = [], []
    rep = {"dropped": [], "dup_removed": 0, "mask_dropped": 0, "labels_fixed": 0}
    rad_hash_seen = {}
    for row in catalog:
        src = row["source_id"]
        if src not in ("wikimedia_pid_symbols", "radica_capitalx") or "svg" not in row["formats"]:
            continue
        svg_rel = next((p.strip() for p in row["file_paths"].split(";") if p.strip().endswith(".svg")), None)
        if not svg_rel:
            continue
        label = re.sub(r"\s+", " ", row["name_en"]).strip()
        label = re.sub(r"\s*[-—]\s*ISO 10628-2$", "", label)
        m_pid = re.match(r"^P&ID\s+(.+)$", label)
        if m_pid:
            rest = m_pid.group(1)
            label = f"ISO symbol {rest}" if re.match(r"^[\dX]", rest) else rest
        if src == "wikimedia_pid_symbols":
            if row["category_code"] == "legend_sheets" or "Symbols Sheet" in label:
                rep["dropped"].append((row["symbol_id"], "tờ bảng ký hiệu — không phải ký hiệu")); continue
            if label in GERMAN_LABELS:
                label = GERMAN_LABELS[label]; rep["labels_fixed"] += 1
            prefix_key, cat = "wm_", WM_CAT_VI.get(row["category_code"], "ISO · Ký hiệu chung")
            rule = V03.PORT_RULES_WM.get(row["category_code"])
        else:
            sub = row["subcategory"]
            if "pipes-and-signal-lines" in sub:
                rep["dropped"].append((row["symbol_id"], "mảnh đường/tín hiệu Radica — trùng công cụ vẽ ống của app")); continue
            prefix_key, cat = "rc_", RAD_CAT_VI.get(sub, "Radica · Khác")
            rule = V03.PORT_RULES_RAD.get(sub.replace("pid-iso-", "").replace("pid-pip-", ""))
        try:
            els, _vb, ustats = collect_svg_elements(os.path.join(ROOT, svg_rel))
            built = build_symbol(els, src)
        except Exception as ex:
            rep["dropped"].append((row["symbol_id"], f"lỗi chuyển đổi: {ex}")); continue
        if built is None:
            rep["dropped"].append((row["symbol_id"], "rỗng/suy biến sau chuẩn hoá")); continue
        body, w2, h2, ports, stats, standalone = built
        rep["dup_removed"] += stats["dup"]; rep["mask_dropped"] += stats["drop"]
        rep["stray_removed"] = rep.get("stray_removed", 0) + stats.get("stray", 0)
        key = prefix_key + slug(row["name_normalized"] or row["name_en"])
        if key in DROP_KEYS:
            rep["dropped"].append((row["symbol_id"], DROP_KEYS[key])); continue
        if ustats["use_total"] >= 3 and ustats["use_missing"] > 0.5 * ustats["use_total"]:
            rep["dropped"].append((row["symbol_id"],
                f"nguồn hỏng: {ustats['use_missing']}/{ustats['use_total']} thẻ <use> trỏ tới id không tồn tại")); continue
        base_items = wm_items if src == "wikimedia_pid_symbols" else rad_items
        existing = {i["key"] for i in base_items}
        base_key, i = key, 2
        while key in existing:
            key = f"{base_key}_{i}"; i += 1
        if src == "radica_capitalx":
            hsh = hash(body)
            if hsh in rad_hash_seen and "-pip-" in svg_rel:
                rep["dropped"].append((row["symbol_id"], "bản PIP trùng hệt bản ISO (hash hình)")); continue
            rad_hash_seen.setdefault(hsh, row["symbol_id"])
        it = {"key": key, "label": label, "cat": cat, "prefix": "", "lic": (row["license"] or "")[:60],
              "_folder": os.path.basename(os.path.dirname(svg_rel)),
              "vars": [{"name": "A", "w": w2, "h": h2, "body": body}]}
        if src == "radica_capitalx":
            it["_standalone"] = standalone; it["_stencil"] = row["subcategory"]
        if src == "wikimedia_pid_symbols" and body.count("<path") + body.count("<rect") + body.count("<ellipse") > 250:
            rep["dropped"].append((row["symbol_id"], "ký hiệu dạng tờ bảng (quá nhiều phần tử) — không phải ký hiệu đơn")); continue
        use_ports = ports if ports else fallback_ports(rule, w2, h2)
        if use_ports:
            it["vars"][0]["ports"] = use_ports
            it["ports_real"] = bool(ports)
        base_items.append(it)
    # bỏ bản PIP trùng TÊN với ISO (sau khi đã bỏ theo hash)
    iso_names = {slug(i["label"]) for i in rad_items if i["cat"].startswith("Radica ISO")}
    kept_rad = []
    for i in rad_items:
        if i["cat"].startswith("Radica PIP") and slug(i["label"]) in iso_names:
            rep["dropped"].append((i["key"], "bản PIP trùng tên bản ISO")); continue
        kept_rad.append(i)
    # xuất bộ SVG độc lập đã chuẩn hoá — CHỈ cho các ký hiệu Radica còn giữ lại
    used_names = set()
    for i in kept_rad:
        st = i.pop("_standalone", None); sub = i.pop("_stencil", "misc")
        if st is None:
            continue
        x0, y0, w, h, kept = st
        sub_dir = os.path.join(fixed_dir, sub)
        os.makedirs(sub_dir, exist_ok=True)
        fname = slug(i["label"]) + ".svg"
        n = 2
        while (sub, fname) in used_names:
            fname = slug(i["label"]) + f"_{n}.svg"; n += 1
        used_names.add((sub, fname))
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(x0 - 2)} {fmt(y0 - 2)} {fmt(w + 4)} {fmt(h + 4)}">',
                 "<!-- Ký hiệu Radica (Capital X) đã chuẩn hoá: thân thiết bị có fill trắng + viền đen để tô màu; "
                 "nguồn: Radica Software, free with attribution. -->"]
        for e in kept:
            parts.append(geo_string_standalone(e, e["cls"]))
        parts.append("</svg>")
        open(os.path.join(sub_dir, fname), "w", encoding="utf-8").write("\n".join(parts))
    rep["radica_standalone_files"] = len(used_names)
    # nhãn trùng trong Wikimedia: thêm hậu tố thư mục nguồn để phân biệt (7 nhãn x2 ở v1.2)
    from collections import Counter
    cnt = Counter(i["label"] for i in wm_items)
    for i in wm_items:
        folder = i.pop("_folder", "")
        if cnt[i["label"]] > 1 and folder:
            i["label"] = f'{i["label"]} ({folder.replace("-", " ")})'
            rep["labels_disambiguated"] = rep.get("labels_disambiguated", 0) + 1
    for i in kept_rad:
        i.pop("_folder", None)
    return wm_items, kept_rad, rep

# ---------- draw.io (chuẩn hoá cùng quy tắc) ----------
def convert_drawio():
    items, used = [], set()
    rep = {"dup_removed": 0}
    for fname in sorted(os.listdir(MORE.DRAWIO_DIR)):
        if not fname.endswith(".xml"):
            continue
        group = fname[:-4]
        cat = MORE.DIO_CAT.get(group, "draw.io · Khác")
        root = ET.parse(os.path.join(MORE.DRAWIO_DIR, fname)).getroot()
        for sh in root.iter("shape"):
            name = sh.get("name", "shape")
            w, h = float(sh.get("w", 100)), float(sh.get("h", 100))
            # thu phần tử + lệnh tô theo ngữ nghĩa stencil
            raw_els = []
            for cont_name in ("background", "foreground"):
                cont = sh.find(cont_name)
                if cont is None:
                    continue
                pending = []
                def flush(op, pending=pending):
                    for (kind, obj) in pending:
                        raw_els.append((op, kind, obj))
                    pending.clear()
                for c in cont:
                    t = c.tag
                    if t == "path":
                        for sp in parse_path(MORE.dio_path_d(c)):
                            pending.append(("path", sp))
                    elif t == "rect":
                        X, Y, W, H = (float(c.get(a)) for a in ("x", "y", "w", "h"))
                        raw_els.append(("__shape__", "rect", (X, Y, W, H)))
                    elif t == "ellipse":
                        X, Y, W, H = (float(c.get(a)) for a in ("x", "y", "w", "h"))
                        raw_els.append(("__shape__", "ellipse", (X, Y, W, H)))
                    elif t == "text":
                        s = c.get("str", "")
                        if s.strip():
                            raw_els.append(("__text__", "text", (float(c.get("x", 0)), float(c.get("y", 0)), s)))
                    elif t in ("fill", "stroke", "fillstroke"):
                        flush(t)
                flush("stroke")
            els = []
            for op, kind, obj in raw_els:
                if op == "__text__":
                    X, Y, s = obj
                    els.append({"kind": "text", "pa": {}, "pts": [(X, Y)], "terminals": [], "text": s, "anchor": "middle", "_op": op})
                elif op == "__shape__":
                    if kind == "rect":
                        X, Y, W, H = obj
                        els.append({"kind": "rect", "pa": {}, "geo": ("rect", X, Y, W, H, 0), "m": IDENT,
                                    "pts": [(X, Y), (X + W, Y + H)], "terminals": [], "closed": True, "_op": "fillstroke"})
                    else:
                        X, Y, W, H = obj
                        els.append({"kind": "ellipse", "pa": {}, "geo": ("ellipse", X + W / 2, Y + H / 2, W / 2, H / 2), "m": IDENT,
                                    "pts": [(X, Y), (X + W, Y + H)], "terminals": [], "closed": True, "_op": "fillstroke"})
                else:
                    els.append({"kind": "path", "pa": {}, "subs": [obj], "pts": obj["pts"],
                                "terminals": [] if obj["closed"] else [obj["start"], obj["end"]], "_op": op})
            if not els:
                continue
            built = build_symbol_dio(els, w, h)
            if built is None:
                continue
            body, w2, h2, ports, stats = built
            rep["dup_removed"] += stats["dup"]
            key = "dio_" + slug(group + "_" + name)
            base_key, i = key, 2
            while key in used:
                key = f"{base_key}_{i}"; i += 1
            used.add(key)
            it = {"key": key, "label": name, "cat": cat, "prefix": "", "lic": "Apache-2.0",
                  "vars": [{"name": "A", "w": w2, "h": h2, "body": body}]}
            # cổng: constraint của nguồn (tỉ lệ trên khung shape) -> hệ khung ôm sát
            conns = sh.find("connections")
            prts = []
            if conns is not None:
                for cst in conns.iter("constraint"):
                    nm = (cst.get("name") or "").lower()
                    if nm not in ("w", "e", "n", "s"):
                        continue
                    px = float(cst.get("x")) * w; py = float(cst.get("y")) * h
                    prts.append((nm, px, py))
            if prts:
                xs = [p[0] for e in els for p in e["pts"]]; ys = [p[1] for e in els for p in e["pts"]]
                cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
                scale = 72.0 / max(max(xs) - min(xs), max(ys) - min(ys), 0.5)
                plist = [{"id": nm, "x": round((px - cx) * scale, 1), "y": round((py - cy) * scale, 1), "d": nm}
                         for nm, px, py in prts]
                it["vars"][0]["ports"] = plist; it["ports_real"] = True
            elif ports:
                it["vars"][0]["ports"] = ports; it["ports_real"] = True
            items.append(it)
    return items, rep

def build_symbol_dio(els, w, h):
    """Như build_symbol nhưng class suy từ lệnh tô của stencil thay vì fill/stroke."""
    pts_all = [p for e in els for p in e["pts"]]
    if not pts_all:
        return None
    xs = [p[0] for p in pts_all]; ys = [p[1] for p in pts_all]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    W, H = max(x1 - x0, 0.5), max(y1 - y0, 0.5)
    kept, seen, stats = [], set(), {"dup": 0, "drop": 0}
    for e in els:
        if e["kind"] == "text":
            cls = "text"
        else:
            closed = e.get("closed") or (e["kind"] == "path" and e["subs"][0]["closed"])
            if e["_op"] in ("fill", "fillstroke"):
                cls = "body" if closed else "ol"
            else:
                cls = "body" if closed else "ol"   # hình kín dù chỉ nét cũng là thân tô được
        e["cls"] = cls
        g = geo_string(e, cls)
        if g in seen:
            stats["dup"] += 1; continue
        seen.add(g); e["geo_str"] = g; kept.append(e)
    if not kept:
        return None
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    scale = 72.0 / max(W, H)
    w2, h2 = round(W * scale, 1), round(H * scale, 1)
    N = (scale, 0, 0, scale, -cx * scale, -cy * scale)
    def baked_geo_dio(e):
        e2 = dict(e)
        if e["kind"] == "path":
            e2["subs"] = [xform_sub(sp, N) for sp in e["subs"]]
        elif e["kind"] in ("rect", "circle", "ellipse"):
            e2["m"] = mat_mul(N, e["m"])
        elif e["kind"] in ("polygon", "polyline", "line"):
            e2["pts"] = [mat_pt(N, px, py) for px, py in e["pts"]]
        elif e["kind"] == "text":
            e2["anchor_pt"] = mat_pt(N, *e.get("anchor_pt", e["pts"][0]))
        return geo_string(e2, e["cls"])
    body = "".join(baked_geo_dio(e) for e in kept)
    stats["classes"] = {}
    for e in kept:
        stats["classes"][e["cls"]] = stats["classes"].get(e["cls"], 0) + 1
    return body, w2, h2, None, stats

# ---------- KiCad (chuẩn hoá cùng quy tắc: hình kín -> body) ----------
def convert_kicad():
    tree = MORE.sexp_parse(open(MORE.KICAD_FILE, encoding="utf-8").read())
    units = {}
    for node in tree[1:]:
        if not (isinstance(node, list) and node and node[0] == "symbol"):
            continue
        base = node[1][1]
        subs = [ch for ch in node[1:] if isinstance(ch, list) and ch and ch[0] == "symbol"
                and re.match(r"^.*_\d+_\d+$", str(ch[1][1] if isinstance(ch[1], tuple) else ch[1]))]
        if subs:
            units[base] = subs
    items, used = [], set()
    rep = {"dup_removed": 0}
    for name in sorted(units.keys()):
        els, pins = [], []
        def fy(y): return -y
        for un in units[name]:
            for el in un[1:]:
                if not isinstance(el, list) or not el:
                    continue
                t = el[0]
                if t == "rectangle":
                    st, en = MORE.sub(el, "start"), MORE.sub(el, "end")
                    x0, y0, x1, y1 = st[1], fy(st[2]), en[1], fy(en[2])
                    els.append({"kind": "rect", "pa": {}, "geo": ("rect", min(x0, x1), min(y0, y1), abs(x1 - x0), abs(y1 - y0), 0),
                                "m": IDENT, "pts": [(x0, y0), (x1, y1)], "terminals": [], "closed": True, "_body": True})
                elif t == "circle":
                    c, r = MORE.sub(el, "center"), MORE.sub(el, "radius")
                    els.append({"kind": "circle", "pa": {}, "geo": ("circle", c[1], fy(c[2]), r[1]), "m": IDENT,
                                "pts": [(c[1] - r[1], fy(c[2]) - r[1]), (c[1] + r[1], fy(c[2]) + r[1])], "terminals": [], "closed": True, "_body": True})
                elif t == "polyline":
                    pts_el = MORE.sub(el, "pts")
                    xy = [(p[1], fy(p[2])) for p in pts_el[1:] if isinstance(p, list) and p and p[0] == "xy"]
                    if len(xy) < 2:
                        continue
                    closed = math.dist(xy[0], xy[-1]) <= 0.01
                    bg = MORE.fill_type(el) == "background"
                    els.append({"kind": "polyline", "pa": {}, "pts": xy, "closed": closed,
                                "terminals": [] if closed else [xy[0], xy[-1]], "_body": closed or bg})
                elif t == "arc":
                    st, md, en = MORE.sub(el, "start"), MORE.sub(el, "mid"), MORE.sub(el, "end")
                    if not (st and md and en):
                        continue
                    d = MORE.arc_path(st[1], fy(st[2]), md[1], fy(md[2]), en[1], fy(en[2]))
                    sp = parse_path(d)
                    if sp:
                        els.append({"kind": "path", "pa": {}, "subs": sp, "pts": sp[0]["pts"],
                                    "terminals": [sp[0]["start"], sp[0]["end"]], "_body": False})
                elif t == "pin":
                    at = MORE.sub(el, "at")
                    if at:
                        pins.append((at[1], fy(at[2]), at[3] if len(at) > 3 else 0))
                elif t == "text":
                    s = el[1][1] if len(el) > 1 and isinstance(el[1], tuple) else ""
                    at = MORE.sub(el, "at")
                    if s and at:
                        els.append({"kind": "text", "pa": {"font-size": 1.6}, "pts": [(at[1], fy(at[2]))],
                                    "terminals": [], "text": s, "anchor": "middle", "_body": False})
        if not els:
            continue
        # khung ôm sát (kể cả chân pin)
        xs = [p[0] for e in els for p in e["pts"]] + [p[0] for p in pins]
        ys = [p[1] for e in els for p in e["pts"]] + [p[1] for p in pins]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        W, H = max(x1 - x0, 0.5), max(y1 - y0, 0.5)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        scale = 72.0 / max(W, H)
        kept, seen = [], set()
        for e in els:
            cls = "text" if e["kind"] == "text" else ("body" if e.get("_body") else "ol")
            e["cls"] = cls
            g = geo_string(e, cls)
            if g in seen:
                rep["dup_removed"] += 1; continue
            seen.add(g); e["geo_str"] = g; kept.append(e)
        if not kept:
            continue
        body = (f'<g transform="translate({round(-cx * scale, 2)},{round(-cy * scale, 2)}) '
                f'scale({round(scale, 4)})">' + "".join(e["geo_str"] for e in kept) + "</g>")
        ports, seen_dir = [], {}
        for (px, py, ang) in pins:
            d = {0: "e", 90: "n", 180: "w", 270: "s"}.get(int(ang) % 360)
            if not d:
                continue
            seen_dir[d] = seen_dir.get(d, 0) + 1
            pid = d if seen_dir[d] == 1 else f"{d}{seen_dir[d]}"
            ports.append({"id": pid, "x": round((px - cx) * scale, 1), "y": round((py - cy) * scale, 1), "d": d})
        key = "kc_" + slug(name)
        base_key, i = key, 2
        while key in used:
            key = f"{base_key}_{i}"; i += 1
        used.add(key)
        it = {"key": key, "label": name.replace("_", " "), "cat": "KiCad · PnID (GPL)", "prefix": "", "lic": "GPL-3.0",
              "vars": [{"name": "A", "w": round(W * scale, 1), "h": round(H * scale, 1), "body": body}]}
        if ports:
            it["vars"][0]["ports"] = ports; it["ports_real"] = True
        items.append(it)
    return items, rep

def write_data_file(path, items, header_note):
    js = (f"/* PFD Studio — {header_note} ({len(items)} ký hiệu)\n"
          "   Sinh bởi normalize_convert_all_v0.6.py (chuẩn hoá vòng 3 sau QA trực quan toàn bộ, 2026-11-11). Nạp bằng <script src>, chạy offline. */\n"
          "window.PFD_EXTRA_SYMBOLS=(window.PFD_EXTRA_SYMBOLS||[]).concat("
          + json.dumps(items, ensure_ascii=False) + ");\n")
    open(path, "w", encoding="utf-8").write(js)
    return {"count": len(items), "bytes": len(js.encode()),
            "ports_real": sum(1 for i in items if i.get("ports_real")),
            "classes": {c: sum(i["vars"][0]["body"].count(f'class="{c}"') for i in items)
                        for c in ("body", "solid", "ol", "dash", "grey", "bodyfill")}}

def main(out_dir, fixed_dir):
    os.makedirs(out_dir, exist_ok=True)
    catalog = json.load(open(os.path.join(ROOT, "06_catalog/symbols_master_v1.0.json"), encoding="utf-8"))
    wm, rad, rep_svg = convert_svg_sources(catalog, fixed_dir)
    dio, rep_dio = convert_drawio()
    # KiCad: KHÔNG xuất nữa — bỏ khỏi gói theo QA v1.2 (chất lượng kém + GPL-3.0)
    report = {
        "wikimedia": write_data_file(os.path.join(out_dir, "symbols-wikimedia_v1.3.js"), wm,
                                     "thư viện Wikimedia Commons ISO 10628-2 đã chuẩn hoá v0.6"),
        "radica": write_data_file(os.path.join(out_dir, "symbols-radica_v1.3.js"), rad,
                                  "thư viện Radica/Capital X đã chuẩn hoá v0.6 (thân thiết bị tô màu được) — free with attribution"),
        "drawio": write_data_file(os.path.join(out_dir, "symbols-drawio_v1.3.js"), dio,
                                  "thư viện draw.io PID stencils đã chuẩn hoá v0.6 — Apache-2.0"),
        "kicad_removed": "Bỏ khỏi gói v1.3: ~42/61 ký hiệu nét dày thành khối đen, nội dung chủ yếu điện tử chung, giấy phép GPL-3.0",
        "svg_cleanup": rep_svg, "drawio_dup_removed": rep_dio["dup_removed"],
    }
    json.dump(report, open(os.path.join(ROOT, "07_build_scripts/normalize_report_v0.6.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(json.dumps(report, ensure_ascii=False, indent=1)[:2600])

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "PFD-Studio_Package/data"),
         os.path.join(ROOT, "09_radica_fixed_svg"))
