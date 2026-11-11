# -*- coding: utf-8 -*-
"""extract_draftsperson_v0.1.py — Giai đoạn 1: đọc DXF (do LibreDWG dwg2dxf xuất từ bộ
Draftsperson EN ISO 10628), liệt kê toàn bộ block: số thực thể theo loại, cổng PID_PORT,
ATTDEF tag, khung bao. Xuất inventory JSON để Lisa duyệt tên block trước khi chuyển đổi.
Chạy bằng python của venv render (có ezdxf)."""
import sys, os, json, math
sys.path.insert(0, os.path.expanduser("~/workspace/.venvs/render/lib/python3.12/site-packages"))
import ezdxf
from ezdxf.math import Matrix44, Vec3

DXF = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else "07_build_scripts/draftsperson_inventory_v0.1.json"

doc = ezdxf.readfile(DXF)
print("DXF version:", doc.dxfversion, "| layers:", len(doc.layers))

def count_entities(block, depth=0):
    types = {}
    ports = 0
    tags = []
    for e in block:
        t = e.dxftype()
        if t == "INSERT":
            if e.dxf.layer == "PID_PORT":
                ports += 1
            elif depth < 6 and e.dxf.name in doc.blocks:
                sub = count_entities(doc.blocks[e.dxf.name], depth + 1)
                for k, v in sub["types"].items():
                    types[k] = types.get(k, 0) + v
                ports += sub["ports"]
                tags += sub["tags"]
            types[t] = types.get(t, 0) + 1
            continue
        if e.dxf.layer == "PID_PORT":
            ports += 1
            continue
        if t == "ATTDEF":
            tags.append(e.dxf.tag)
        types[t] = types.get(t, 0) + 1
    return {"types": types, "ports": ports, "tags": tags}

inv = []
for block in doc.blocks:
    name = block.name
    if name.startswith("*") or name.lower() in ("*model_space", "*paper_space"):
        continue
    info = count_entities(block)
    n_geom = sum(v for k, v in info["types"].items())
    inv.append({"block": name, "base_point": [round(v, 3) for v in block.base_point],
                "entities_total": n_geom, "types": info["types"],
                "ports": info["ports"], "tags": info["tags"]})
inv.sort(key=lambda r: r["block"])
tot_ports = sum(r["ports"] for r in inv)
print(f"blocks: {len(inv)} | tổng cổng PID_PORT (đếm đệ quy): {tot_ports}")
json.dump(inv, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for r in inv:
    print(f"{r['block'][:64]:64s} ent={r['entities_total']:4d} ports={r['ports']:2d} tags={','.join(r['tags'])[:30]}")
print("->", OUT)
