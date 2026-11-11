#!/usr/bin/env python3
"""Convert Wikimedia ISO 10628-2 SVGs into PFD Studio symbol format (POC v0.1).
Studio def: S(w,h,body,ports) with body centred at (0,0), classes body/ol/thin/dash/grey/wat/solid.
Conversion: read viewBox/width/height, wrap content in a <g transform>, normalise plain black/white
drawing styles to studio classes (fill:white/black->class body/ol heuristics), strip metadata/editor attrs.
Ports: inferred from viewBox edges (default W/E + N/S) - POC level, to be hand-tuned later.
Outputs a JS snippet with reg() calls + a standalone POC html when used with --poc."""
import os, re, sys, json, html
import xml.etree.ElementTree as ET

SRC="/home/hatch/workspace/pfd-pid-database/02_wikimedia/pid_symbols"
NS="{http://www.w3.org/2000/svg}"
DROP_TAGS={"metadata","title","desc","defs","namedview","script","style"}

def clean_elem(el, out):
    tag=el.tag.replace(NS,"")
    if tag in DROP_TAGS or tag.startswith("{http://sodipodi") or tag.startswith("{http://www.inkscape"):
        return
    if tag=="svg":
        for ch in el: clean_elem(ch,out)
        return
    attrs={}
    for k,v in el.attrib.items():
        if k.startswith("{http://sodipodi") or k.startswith("{http://www.inkscape") or k in ("id","inkscape:connector-curvature"):
            continue
        attrs[k]=v
    style=attrs.get("style","")
    # classify: filled shapes -> body ; stroked-only -> ol ; grey fill -> grey
    fill=re.search(r"fill:\s*([^;]+)", style); stroke=re.search(r"stroke:\s*([^;]+)", style)
    fillv=(fill.group(1).strip().lower() if fill else attrs.get("fill","")).replace(" ","")
    strokev=(stroke.group(1).strip().lower() if stroke else attrs.get("stroke","")).replace(" ","")
    cls=None
    if tag in ("path","rect","circle","ellipse","polygon","polyline"):
        if fillv in ("#ffffff","#fff","white","rgb(255,255,255)"):
            cls="body"
        elif fillv in ("#000000","#000","black","rgb(0,0,0)"):
            cls="solid"
        elif fillv not in ("","none") and ("808080" in fillv or "grey" in fillv or "gray" in fillv or "%" in fillv):
            cls="grey"
        elif strokev not in ("","none"):
            cls="ol" if fillv in ("","none") else "body"
        if cls:
            for a in ("style","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-dasharray","stroke-dashoffset","stroke-opacity","fill-opacity","fill-rule"):
                attrs.pop(a,None)
            attrs["class"]=cls
    astr="".join(f' {k}="{html.escape(str(v),quote=True)}"' for k,v in attrs.items())
    if len(el):
        inner=[]
        for ch in el: clean_elem(ch,inner)
        out.append(f"<{tag}{astr}>"+"".join(inner)+f"</{tag}>")
    elif el.text and el.text.strip():
        out.append(f"<{tag}{astr}>{html.escape(el.text.strip())}</{tag}>")
    else:
        out.append(f"<{tag}{astr}/>")

def convert(path):
    tree=ET.parse(path); root=tree.getroot()
    vb=root.get("viewBox")
    if vb:
        nums=[float(x) for x in re.split(r"[\s,]+", vb.strip()) if x]
        x0,y0,w,h=nums[0],nums[1],nums[2],nums[3]
    else:
        w=float(re.sub(r"[^0-9.]","",root.get("width","100")) or 100); h=float(re.sub(r"[^0-9.]","",root.get("height","100")) or 100); x0=y0=0
    parts=[]
    for ch in root: clean_elem(ch,parts)
    body="".join(parts)
    if not body.strip(): return None
    cx,cy=x0+w/2,y0+h/2
    scale=72/max(w,h)  # normalise largest dimension to ~72 studio units
    w2,h2=round(w*scale,1),round(h*scale,1)
    g=f'<g transform="translate({round(-cx*scale,2)},{round(-cy*scale,2)}) scale({round(scale,4)})">{body}</g>'
    return w2,h2,g

POC=[
 ("valves/Gate valve.svg","wm_gate_valve","Van cổng ISO 10628-2 (Wikimedia)","XV"),
 ("valves/Control valve.svg","wm_control_valve","Van điều khiển ISO 10628-2 (Wikimedia)","PV"),
 ("liquid-pumps/Pump, centrifugal type (ISO 10628-2).svg","wm_pump_cent","Bơm ly tâm ISO 10628-2 (Wikimedia)","P"),
 ("heat-exchangers/Heat exchanger (general), condenser - ISO 10628-2.svg","wm_hx_gen","Trao đổi nhiệt chung ISO 10628-2 (Wikimedia)","E"),
 ("tanks-and-containers/Container, tank, cistern - ISO 10628-2.svg","wm_tank_gen","Bồn chứa chung ISO 10628-2 (Wikimedia)","TK"),
]
rows=[]
for rel,key,label,prefix in POC:
    p=os.path.join(SRC,rel)
    r=convert(p)
    if not r: print("SKIP (empty body):",rel); continue
    w,h,g=r
    js_body=g.replace("\\","\\\\").replace("`","\\`").replace("${","\\${")
    rows.append(f'reg("{key}","{label}","Thư viện ISO 10628-2 (mở)","{prefix}",[\n ["A — Wikimedia",S({w},{h},`{js_body}`)]\n]);')
    print("OK",key,w,h,"body chars:",len(g))
open("/home/hatch/workspace/pfd-pid-database/07_build_scripts/poc_wikimedia_symbols_v0.1.js","w").write("\n".join(rows)+"\n")
print("wrote", len(rows), "symbols")
