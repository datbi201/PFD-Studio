# -*- coding: utf-8 -*-
"""convert_draftsperson_v0.1.py — Chuyển 150 block Draftsperson EN ISO 10628 (từ DXF do
LibreDWG xuất) thành file dữ liệu PFD Studio `symbols-draftsperson_v1.0.js`.

Đường đi: DXF (ezdxf) -> SVG trung gian từng block (04_cad/draftsperson_svg/) -> tái dùng
bộ chuẩn hoá v0.6 (collect_svg_elements + build_symbol) như mọi nguồn khác.
Cổng nối: dùng điểm POINT trên lớp PID_PORT của chính thư viện (353 điểm) — chiếu lên
khung ôm sát sau chuẩn hoá; điểm nằm sâu trong khung (>14% cạnh dài) thì bỏ (điểm dự phòng
ở chân stub ống của nguồn CAD). Giấy phép nguồn: free commercial use, không cần ghi nguồn.
Chạy bằng python của venv render (có ezdxf)."""
import sys, os, json, math, re, importlib.util
sys.path.insert(0, os.path.expanduser("~/workspace/.venvs/render/lib/python3.12/site-packages"))
import ezdxf
from ezdxf.path import make_path, from_hatch

ROOT = os.path.expanduser("~/workspace/pfd-pid-database")
DXF = os.path.join(ROOT, "04_cad/draftsperson_dxf/Draftsperson_EN-ISO-10628_v1.0.dxf")
SVGDIR = os.path.join(ROOT, "04_cad/draftsperson_svg")
LIC = "Free for commercial use (Draftsperson EN ISO 10628)"

spec = importlib.util.spec_from_file_location("v06", os.path.join(ROOT, "07_build_scripts/normalize_convert_all_v0.6.py"))
v06 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v06)
slug = v06.slug

# ---------------- nhãn tiếng Việt (150 block) ----------------
VI = {
"PID_ACT_DIAPHRAGM": "Cơ cấu chấp hành màng", "PID_ACT_HANDWHEEL": "Cơ cấu chấp hành tay quay",
"PID_ACT_LEVER": "Cơ cấu chấp hành cần gạt", "PID_ACT_MOTOR": "Cơ cấu chấp hành mô-tơ",
"PID_ACT_PISTON": "Cơ cấu chấp hành piston", "PID_ACT_SOLENOID": "Cơ cấu chấp hành điện từ (solenoid)",
"PID_ACT_SPRING": "Cơ cấu chấp hành lò xo",
"PID_ANALYSER_ELEMENT": "Phần tử phân tích (analyser)", "PID_BLIND_FLANGE": "Mặt bích mù",
"PID_BLOWER_FAN": "Quạt thổi", "PID_BUCKET_ELEVATOR": "Gầu tải", "PID_CENTRIFUGE": "Máy ly tâm",
"PID_COLUMN_PACKED": "Tháp đệm", "PID_COLUMN_TRAY": "Tháp đĩa", "PID_COLUMN_TRAY_PACKED": "Tháp đĩa + đệm",
"PID_COMPRESSOR_CENTRIFUGAL": "Máy nén ly tâm", "PID_COMPRESSOR_RECIPROCATING": "Máy nén piston",
"PID_COMPRESSOR_SCREW": "Máy nén trục vít", "PID_CONNECTOR_OFFPAGE": "Ký hiệu nối trang (off-page)",
"PID_CONVEYOR_BELT": "Băng tải đai", "PID_CONVEYOR_SCREW": "Băng tải trục vít",
"PID_COOLING_TOWER": "Tháp giải nhiệt", "PID_CRUSHER_JAW": "Máy nghiền hàm",
"PID_CRUSHER_ROLLER": "Máy nghiền trục", "PID_CYCLONE": "Cyclone tách",
"PID_DECANTER": "Thiết bị lắng gạn (decanter)", "PID_DRAIN_FUNNEL": "Phễu thoát",
"PID_DRIVE_MOTOR": "Mô-tơ dẫn động", "PID_DRIVE_TURBINE_STEAM": "Tuabin hơi dẫn động",
"PID_DRYER_ROTARY": "Máy sấy quay", "PID_DRYER_SPRAY": "Máy sấy phun",
"PID_EJECTOR": "Ejector (bơm tia)", "PID_ELECTROSTATIC_PRECIPITATOR": "Thiết bị lọc bụi tĩnh điện",
"PID_EXPANSION_JOINT": "Khớp giãn nở", "PID_FAN_AXIAL": "Quạt hướng trục",
"PID_FEEDER_VIBRATING": "Máy cấp liệu rung", "PID_FILTER_BAG": "Lọc túi",
"PID_FILTER_CARTRIDGE": "Lọc cartridge", "PID_FILTER_GENERAL": "Thiết bị lọc (chung)",
"PID_FILTER_PRESS": "Máy lọc ép", "PID_FIRED_HEATER": "Lò đốt",
"PID_FLAME_ARRESTOR": "Thiết bị chống cháy ngược", "PID_FLANGED_JOINT": "Mối nối mặt bích",
"PID_FLEXIBLE_HOSE": "Ống mềm", "PID_FLOW_DIRECTION": "Mũi tên hướng dòng",
"PID_FLOW_MAGNETIC": "Lưu lượng kế điện từ", "PID_FLOW_ORIFICE_ELEMENT": "Phần tử lưu lượng orifice",
"PID_FLOW_ROTAMETER": "Lưu lượng kế rotameter", "PID_FLOW_TURBINE_METER": "Lưu lượng kế tuabin",
"PID_FLOW_VENTURI": "Lưu lượng kế Venturi", "PID_GAS_HOLDER": "Bình chứa khí (gas holder)",
"PID_HOPPER": "Phễu chứa", "PID_HX_AIR_COOLED": "TBTN làm mát bằng không khí",
"PID_HX_COIL_IMMERSED": "TBTN ống xoắn ngâm", "PID_HX_CONDENSER_VERTICAL": "Thiết bị ngưng tụ đứng",
"PID_HX_DOUBLE_PIPE": "TBTN ống lồng ống", "PID_HX_KETTLE_REBOILER": "Reboiler kiểu kettle",
"PID_HX_PLATE": "TBTN tấm", "PID_HX_SHELL_TUBE_FIXED": "TBTN vỏ-ống, đầu cố định",
"PID_HX_SHELL_TUBE_U": "TBTN vỏ-ống, ống chữ U", "PID_HX_SPIRAL": "TBTN xoắn ốc",
"PID_HYDROCYCLONE": "Hydrocyclone", "PID_INST_BEHIND_PANEL": "Thiết bị đo, sau tủ điều khiển",
"PID_INST_COMPUTER": "Thiết bị đo, hệ máy tính", "PID_INST_FIELD": "Thiết bị đo, hiện trường",
"PID_INST_LOCAL_PANEL": "Thiết bị đo, tủ tại chỗ", "PID_INST_PANEL": "Thiết bị đo, tủ trung tâm",
"PID_INST_PLC": "Thiết bị đo, PLC", "PID_INST_SHARED_FIELD": "Thiết bị đo hiển thị chung, hiện trường",
"PID_INST_SHARED_PANEL": "Thiết bị đo hiển thị chung, tủ trung tâm",
"PID_KNOCKOUT_DRUM": "Bình tách lỏng (knock-out drum)", "PID_LEVEL_GAUGE_GLASS": "Kính đo mức",
"PID_LINE_CROSSING": "Đường ống giao nhau, không nối", "PID_LINE_JUNCTION": "Điểm nối đường ống",
"PID_LINE_PROCESS_MAIN": "Đường công nghệ chính", "PID_LINE_PROCESS_SECONDARY": "Đường công nghệ phụ",
"PID_MEMBRANE_MODULE": "Module màng lọc", "PID_MILL_BALL": "Máy nghiền bi",
"PID_MIXER_PADDLE": "Máy trộn cánh gạt", "PID_ORIFICE_PLATE": "Tấm lỗ (orifice plate)",
"PID_PIPE_INSULATED": "Đường ống bảo ôn", "PID_PIPE_JACKETED": "Đường ống vỏ áo",
"PID_PIPE_TRACED": "Đường ống gia nhiệt kèm (traced)", "PID_PUMP_CENTRIFUGAL": "Bơm ly tâm",
"PID_PUMP_CENTRIFUGAL_VERTICAL": "Bơm ly tâm đứng", "PID_PUMP_DIAPHRAGM": "Bơm màng",
"PID_PUMP_GEAR": "Bơm bánh răng", "PID_PUMP_GENERAL": "Bơm (chung)",
"PID_PUMP_RECIPROCATING": "Bơm piston", "PID_PUMP_ROTARY": "Bơm quay",
"PID_PUMP_SCREW": "Bơm trục vít", "PID_PUMP_VACUUM": "Bơm chân không",
"PID_REACTOR_FIXED_BED": "Thiết bị phản ứng lớp cố định",
"PID_REACTOR_FLUIDISED_BED": "Thiết bị phản ứng tầng sôi",
"PID_REACTOR_STIRRED": "Thiết bị phản ứng khuấy",
"PID_REDUCER_CONCENTRIC": "Côn thu đồng tâm", "PID_REDUCER_ECCENTRIC": "Côn thu lệch tâm",
"PID_RESTRICTION_ORIFICE": "Lỗ hạn chế (restriction orifice)",
"PID_ROTARY_AIRLOCK": "Van quay cấp liệu (airlock)", "PID_SCREEN_INCLINED": "Sàng nghiêng",
"PID_SCREEN_VIBRATING": "Sàng rung", "PID_SCRUBBER_PACKED": "Tháp rửa khí đệm",
"PID_SEPARATOR_THREE_PHASE": "Bình tách ba pha", "PID_SIGHT_GLASS": "Kính quan sát",
"PID_SIGNAL_CAPILLARY": "Đường tín hiệu mao dẫn", "PID_SIGNAL_DATA": "Đường tín hiệu dữ liệu",
"PID_SIGNAL_ELECTRIC": "Đường tín hiệu điện", "PID_SIGNAL_PNEUMATIC": "Đường tín hiệu khí nén",
"PID_SILENCER": "Ống tiêu âm", "PID_SILO_CONICAL": "Silo đáy côn",
"PID_SPADE_BLANK": "Đĩa bịt (spade blank)", "PID_SPECTACLE_BLIND": "Đĩa bịt hình số 8 (spectacle blind)",
"PID_STATIC_MIXER": "Thiết bị trộn tĩnh", "PID_STEAM_TRAP": "Bẫy hơi",
"PID_STRAINER_BASKET": "Lọc giỏ", "PID_STRAINER_Y": "Lọc chữ Y",
"PID_TANK_CONE_ROOF": "Bồn mái côn", "PID_TANK_DOME_ROOF": "Bồn mái cầu",
"PID_TANK_FIXED_ROOF": "Bồn mái cố định", "PID_TANK_FLOATING_ROOF": "Bồn mái phao",
"PID_TANK_OPEN": "Bồn hở", "PID_TURBINE_EXPANDER": "Tuabin giãn nở",
"PID_VALVE_ANGLE": "Van góc", "PID_VALVE_BALL": "Van bi", "PID_VALVE_BUTTERFLY": "Van bướm",
"PID_VALVE_CHECK": "Van một chiều", "PID_VALVE_CHECK_SWING": "Van một chiều lá lật",
"PID_VALVE_CONTROL": "Van điều khiển", "PID_VALVE_CONTROL_MOTOR": "Van điều khiển mô-tơ",
"PID_VALVE_DIAPHRAGM": "Van màng", "PID_VALVE_FOUR_WAY": "Van bốn ngả",
"PID_VALVE_GATE": "Van cổng", "PID_VALVE_GLOBE": "Van cầu", "PID_VALVE_MANUAL": "Van tay (chung)",
"PID_VALVE_NEEDLE": "Van kim", "PID_VALVE_PLUG": "Van nút",
"PID_VALVE_REGULATOR": "Van điều áp (regulator)", "PID_VALVE_RELIEF": "Van an toàn (relief)",
"PID_VALVE_RUPTURE_DISC": "Đĩa nổ (rupture disc)", "PID_VALVE_SOLENOID": "Van điện từ (solenoid)",
"PID_VALVE_THREE_WAY": "Van ba ngả", "PID_VENT_TO_ATMOSPHERE": "Xả ra khí quyển",
"PID_VESSEL_AGITATED": "Bình khuấy", "PID_VESSEL_COIL": "Bình ống xoắn",
"PID_VESSEL_HORIZONTAL": "Bình ngang", "PID_VESSEL_JACKETED": "Bình vỏ áo",
"PID_VESSEL_SPHERE": "Bình cầu", "PID_VESSEL_VERTICAL": "Bình đứng",
"PID_VESSEL_VERTICAL_FLAT": "Bình đứng đáy phẳng", "PID_WEIGH_HOPPER": "Phễu cân",
}

CAT_RULES = [
    ("PID_ACT_", "Draftsperson · Cơ cấu chấp hành"),
    ("PID_VALVE_", "Draftsperson · Van"),
    ("PID_PUMP_", "Draftsperson · Bơm"),
    ("PID_HX_", "Draftsperson · Trao đổi nhiệt"),
    ("PID_TANK_", "Draftsperson · Bình & bồn"), ("PID_VESSEL_", "Draftsperson · Bình & bồn"),
    ("PID_SILO", "Draftsperson · Bình & bồn"), ("PID_HOPPER", "Draftsperson · Bình & bồn"),
    ("PID_WEIGH_HOPPER", "Draftsperson · Bình & bồn"), ("PID_GAS_HOLDER", "Draftsperson · Bình & bồn"),
    ("PID_INST_", "Draftsperson · Đo lường"), ("PID_FLOW_", "Draftsperson · Đo lường"),
    ("PID_LEVEL_", "Draftsperson · Đo lường"), ("PID_ANALYSER", "Draftsperson · Đo lường"),
    ("PID_LINE_", "Draftsperson · Đường ống & tín hiệu"), ("PID_SIGNAL_", "Draftsperson · Đường ống & tín hiệu"),
    ("PID_PIPE_", "Draftsperson · Đường ống & tín hiệu"), ("PID_CONNECTOR", "Draftsperson · Đường ống & tín hiệu"),
    ("PID_COLUMN_", "Draftsperson · Thiết bị quá trình"), ("PID_REACTOR_", "Draftsperson · Thiết bị quá trình"),
    ("PID_SCRUBBER", "Draftsperson · Thiết bị quá trình"), ("PID_SEPARATOR", "Draftsperson · Thiết bị quá trình"),
    ("PID_KNOCKOUT", "Draftsperson · Thiết bị quá trình"), ("PID_MEMBRANE", "Draftsperson · Thiết bị quá trình"),
    ("PID_FIRED_HEATER", "Draftsperson · Thiết bị quá trình"), ("PID_COOLING_TOWER", "Draftsperson · Thiết bị quá trình"),
    ("PID_FILTER_", "Draftsperson · Tách & lọc"), ("PID_STRAINER", "Draftsperson · Tách & lọc"),
    ("PID_CYCLONE", "Draftsperson · Tách & lọc"), ("PID_HYDROCYCLONE", "Draftsperson · Tách & lọc"),
    ("PID_CENTRIFUGE", "Draftsperson · Tách & lọc"), ("PID_DECANTER", "Draftsperson · Tách & lọc"),
    ("PID_ELECTROSTATIC", "Draftsperson · Tách & lọc"), ("PID_SCREEN_", "Draftsperson · Tách & lọc"),
    ("PID_COMPRESSOR_", "Draftsperson · Máy quay"), ("PID_FAN_", "Draftsperson · Máy quay"),
    ("PID_BLOWER", "Draftsperson · Máy quay"), ("PID_DRIVE_", "Draftsperson · Máy quay"),
    ("PID_TURBINE_", "Draftsperson · Máy quay"), ("PID_EJECTOR", "Draftsperson · Máy quay"),
    ("PID_CONVEYOR_", "Draftsperson · Thiết bị rắn"), ("PID_FEEDER_", "Draftsperson · Thiết bị rắn"),
    ("PID_MILL_", "Draftsperson · Thiết bị rắn"), ("PID_CRUSHER_", "Draftsperson · Thiết bị rắn"),
    ("PID_MIXER_", "Draftsperson · Thiết bị rắn"), ("PID_DRYER_", "Draftsperson · Thiết bị rắn"),
    ("PID_BUCKET", "Draftsperson · Thiết bị rắn"), ("PID_ROTARY_AIRLOCK", "Draftsperson · Thiết bị rắn"),
    ("PID_STATIC_MIXER", "Draftsperson · Thiết bị rắn"),
]
def cat_of(name):
    for p, c in CAT_RULES:
        if name.startswith(p): return c
    return "Draftsperson · Phụ kiện"

WORD_FIX = {"HX": "Heat exchanger", "INST": "Instrument", "ACT": "Actuator"}
PHRASE_FIX = [("Shell Tube Fixed", "shell & tube, fixed tubesheet"), ("Shell Tube U", "shell & tube, U-tube"),
              ("Three Phase", "three-phase"), ("Offpage", "off-page"), ("Fluidised", "fluidised"),
              ("Analyser", "analyser"), ("Kettle Reboiler", "kettle reboiler")]
def label_en(name):
    toks = name[4:].split("_")
    toks = [WORD_FIX.get(t, t.capitalize()) for t in toks]
    s = " ".join(toks)
    for a, b in PHRASE_FIX: s = s.replace(a, b)
    return s

# ---------------- DXF -> primitives ----------------
def flat_pts(path, tol):
    out = []
    for sub in path.sub_paths():
        pts = [sub.start]
        pts += list(sub.flattening(tol))
        clean = []
        for p in pts:
            q = (round(p.x, 3), round(-p.y, 3))   # lật trục y sang hệ SVG
            if not clean or math.dist(q, clean[-1]) > 1e-6: clean.append(q)
        closed = len(clean) > 2 and math.dist(clean[0], clean[-1]) < max(tol * 3, 0.05)
        if closed: clean = clean[:-1]
        if len(clean) >= 2: out.append((clean, closed))
    return out

def block_primitives(doc, block):
    prims, texts, ports, notes = [], [], [], []
    for e in block:
        t = e.dxftype(); layer = e.dxf.layer
        if layer == "PID_PORT":
            if t == "POINT":
                p = e.dxf.location; ports.append((round(p.x, 3), round(-p.y, 3)))
            continue
        if t == "ATTDEF" or layer == "Defpoints": continue
        dashed = (layer == "PID_SIGNAL") or ("DASH" in (e.dxf.linetype or "").upper()) or ("HIDDEN" in (e.dxf.linetype or "").upper())
        try:
            if t in ("LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC", "ELLIPSE", "SPLINE"):
                for pts, closed in flat_pts(make_path(e), 0.04):
                    filled = bool(closed and layer == "PID_FILL")
                    prims.append({"pts": pts, "closed": closed, "filled": filled, "dash": dashed})
            elif t == "HATCH":
                solid = (e.dxf.solid_fill == 1) or (e.dxf.pattern_name.upper() == "SOLID")
                if not solid: notes.append(f"hatch không đặc: {e.dxf.pattern_name}")
                for pth in from_hatch(e):   # ezdxf 1.4: from_hatch là generator các Path
                    for pts, closed in flat_pts(pth, 0.04):
                        prims.append({"pts": pts, "closed": True, "filled": solid, "dash": False})
            elif t == "SOLID":
                vs = [e.dxf.vtx0, e.dxf.vtx1, e.dxf.vtx3, e.dxf.vtx2]
                pts = []
                for v in vs:
                    q = (round(v.x, 3), round(-v.y, 3))
                    if q not in pts: pts.append(q)
                if len(pts) >= 3: prims.append({"pts": pts, "closed": True, "filled": True, "dash": False})
            elif t == "TEXT":
                txt = re.sub(r"%%[a-zA-Z]", "", e.dxf.text).strip()
                if txt:
                    p = e.dxf.insert
                    texts.append({"text": txt, "x": round(p.x, 3), "y": round(-p.y, 3),
                                  "h": float(e.dxf.height)})
            elif t not in ("POINT",):
                notes.append(f"bỏ {t}")
        except Exception as ex:
            notes.append(f"lỗi {t}: {ex}")
    return prims, texts, ports, notes

def emit_svg(prims, texts):
    xs = [p[0] for pr in prims for p in pr["pts"]]; ys = [p[1] for pr in prims for p in pr["pts"]]
    if not xs: return None
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    sw = max(0.25, 0.016 * max(x1 - x0, y1 - y0))
    el = []
    for pr in prims:
        d = "M" + " L".join(f"{x} {y}" for x, y in pr["pts"]) + (" Z" if pr["closed"] else "")
        if pr["filled"]:
            el.append(f'<path d="{d}" fill="black" stroke="none"/>')
        else:
            dash = ' stroke-dasharray="5 3"' if pr["dash"] else ""
            el.append(f'<path d="{d}" fill="none" stroke="black" stroke-width="{sw:.2f}"{dash}/>')
    for tx in texts:
        el.append(f'<text x="{tx["x"]}" y="{tx["y"]}" font-size="{tx["h"]:.2f}" fill="black">{tx["text"]}</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1-x0} {y1-y0}" '
            f'width="{x1-x0}" height="{y1-y0}">' + "".join(el) + "</svg>")

def project_ports(ports_svg, standalone, w2, h2):
    x0, y0, w, h = standalone[0], standalone[1], standalone[2], standalone[3]
    cx, cy = x0 + w / 2, y0 + h / 2
    scale = 72.0 / max(w, h)
    long_side = max(w2, h2)
    out, used, consumed = [], [], set()
    for i, (px, py) in enumerate(ports_svg):
        X, Y = (px - cx) * scale, (py - cy) * scale
        dists = {"w": abs(X + w2 / 2), "e": abs(X - w2 / 2), "n": abs(Y + h2 / 2), "s": abs(Y - h2 / 2)}
        d = min(dists, key=dists.get)
        if dists[d] > 0.14 * long_side: continue
        consumed.add(i)
        if d == "w": PX, PY = -w2 / 2, max(-h2 / 2, min(h2 / 2, Y))
        elif d == "e": PX, PY = w2 / 2, max(-h2 / 2, min(h2 / 2, Y))
        elif d == "n": PX, PY = max(-w2 / 2, min(w2 / 2, X)), -h2 / 2
        else: PX, PY = max(-w2 / 2, min(w2 / 2, X)), h2 / 2
        if any(math.dist((PX, PY), q) < 3.5 for q in used): continue
        used.append((PX, PY))
        same = [p for p in out if p["d"] == d]
        out.append({"id": d if not same else f"{d}{len(same)+1}", "x": round(PX, 1), "y": round(PY, 1), "d": d})
        if len(out) >= 8: break
    # cứu: cạnh nào chưa có cổng thì lấy điểm CHƯA dùng có cạnh-gần-nhất là cạnh đó (khoảng cách
    # <= 35% cạnh dài). Vd PID_WEIGH_HOPPER: cổng vào trên nằm dưới đỉnh khung vì còn cổ phễu.
    # (Không dùng sector theo góc: van điều khiển khung cao hơn rộng làm điểm stub trong bị
    #  chiếu lệch thành cổng nam oan.)
    have = {p["d"] for p in out}
    kept_xy = [(p["x"], p["y"]) for p in out]
    def shadowed(X, Y):
        # bị che: nằm trên đoạn thẳng nối 2 cổng đã giữ (điểm stub trong của van nằm trên
        # đoạn w-e) — khoảng cách vuông góc <= 6% cạnh dài và hình chiếu nằm giữa hai cổng
        for a in range(len(kept_xy)):
            for b in range(a + 1, len(kept_xy)):
                (ax, ay), (bx, by) = kept_xy[a], kept_xy[b]
                vx, vy = bx - ax, by - ay
                L2 = vx * vx + vy * vy
                if L2 < 1e-9: continue
                t = ((X - ax) * vx + (Y - ay) * vy) / L2
                if -0.05 <= t <= 1.05:
                    px_, py_ = ax + t * vx, ay + t * vy
                    if math.dist((X, Y), (px_, py_)) <= 0.06 * long_side: return True
        return False
    cand = {}
    for i, (px, py) in enumerate(ports_svg):
        if i in consumed: continue
        X, Y = (px - cx) * scale, (py - cy) * scale
        dists = {"w": abs(X + w2 / 2), "e": abs(X - w2 / 2), "n": abs(Y + h2 / 2), "s": abs(Y - h2 / 2)}
        d = min(dists, key=dists.get)
        if d in have or dists[d] > 0.35 * long_side: continue
        if shadowed(X, Y): continue
        if d not in cand or dists[d] < cand[d][0]: cand[d] = (dists[d], X, Y)
    for d, (_, X, Y) in cand.items():
        if len(out) >= 8: break
        if d == "w": PX, PY = -w2 / 2, max(-h2 / 2, min(h2 / 2, Y))
        elif d == "e": PX, PY = w2 / 2, max(-h2 / 2, min(h2 / 2, Y))
        elif d == "n": PX, PY = max(-w2 / 2, min(w2 / 2, X)), -h2 / 2
        else: PX, PY = max(-w2 / 2, min(w2 / 2, X)), h2 / 2
        if any(math.dist((PX, PY), q) < 3.5 for q in used): continue
        used.append((PX, PY))
        out.append({"id": d, "x": round(PX, 1), "y": round(PY, 1), "d": d})
    return out

def main():
    os.makedirs(SVGDIR, exist_ok=True)
    doc = ezdxf.readfile(DXF)
    names = [b.name for b in doc.blocks if b.name.startswith("PID_")]
    missing_vi = [n for n in names if n not in VI]
    assert not missing_vi, f"thiếu nhãn VI: {missing_vi}"
    items, report = [], []
    for name in sorted(names):
        block = doc.blocks[name]
        prims, texts, ports_cad, notes = block_primitives(doc, block)
        svg = emit_svg(prims, texts)
        if svg is None:
            report.append({"block": name, "error": "không có hình"}); continue
        spath = os.path.join(SVGDIR, name + ".svg")
        open(spath, "w", encoding="utf-8").write(svg)
        els, vb, us = v06.collect_svg_elements(spath)
        built = v06.build_symbol(els, name)
        if built is None:
            report.append({"block": name, "error": "build_symbol None", "notes": notes}); continue
        body, w2, h2, ports_auto, stats = built[0], built[1], built[2], built[3], built[4]
        ports = project_ports(ports_cad, built[5], w2, h2)
        ports_real = bool(ports)
        if not ports: ports = ports_auto
        key = "dp_" + slug(name[4:])
        items.append({"key": key, "label": label_en(name), "labelVi": VI[name], "cat": cat_of(name),
                      "prefix": "", "lic": LIC,
                      "vars": [{"name": "A", "w": w2, "h": h2, "body": body, "ports": ports}],
                      "ports_real": ports_real})
        report.append({"block": name, "key": key, "prims": len(prims), "ports_src": len(ports_cad),
                       "ports_kept": len(ports) if ports_real else 0, "ports_real": ports_real,
                       "texts": [t["text"] for t in texts], "notes": notes})
    seen = set()
    for s in items:
        assert s["key"] not in seen, s["key"]; seen.add(s["key"])
    js = ("/* PFD Studio — thư viện ký hiệu Draftsperson EN ISO 10628 (free commercial use), chuẩn hoá v0.6, cổng từ PID_PORT */\n"
          "window.PFD_EXTRA_SYMBOLS=(window.PFD_EXTRA_SYMBOLS||[]).concat("
          + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ");\n")
    assert "</script" not in js
    outp = os.path.join(ROOT, "PFD-Studio_Package/data/symbols-draftsperson_v1.0.js")
    open(outp, "w", encoding="utf-8").write(js)
    json.dump(report, open(os.path.join(ROOT, "07_build_scripts/convert_draftsperson_report_v0.1.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    n_real = sum(1 for s in items if s["ports_real"])
    print(f"GIỮ {len(items)}/150 | cổng thật PID_PORT: {n_real} | -> {outp}")
    bad = [r for r in report if "error" in r or r.get("notes")]
    for r in bad: print("  !", r)

if __name__ == "__main__":
    main()
