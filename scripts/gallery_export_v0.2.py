# gallery_export_v0.2.py — xuất toàn bộ ký hiệu LibreOffice Gallery ISO 10628 ra SVG qua UNO.
# Cách 1: item.Graphic -> GraphicProvider.storeGraphicByURL (image/svg+xml).
# Cách 2 (dự phòng): item.Drawing (model) -> storeToURL với filter draw_svg_Export.
# Ghi manifest JSON: theme, index, title, file, route, ok/vector.
import subprocess, time, os, json, signal, re, sys
PROF = "/home/hatch/workspace/.loprofile"
BASE = "/home/hatch/workspace/pfd-pid-database/08_more_sources/gallery_svg"
MAN  = "/home/hatch/workspace/pfd-pid-database/08_more_sources/gallery_manifest_v0.2.json"
os.makedirs(BASE, exist_ok=True)
proc = subprocess.Popen("soffice --headless --accept='socket,host=localhost,port=2005;urp;' --nofirststartwizard "
                        f"-env:UserInstallation=file://{PROF}",
                        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, preexec_fn=os.setsid)
def slug(s):
    s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_").lower()
    return s or "item"
out = {"themes": {}, "errors": []}
try:
    import uno
    from com.sun.star.beans import PropertyValue
    ctx = None
    for i in range(60):
        try:
            lc = uno.getComponentContext()
            r1 = lc.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", lc)
            ctx = r1.resolve("uno:socket,host=localhost,port=2005;urp;StarOffice.ComponentContext")
            break
        except Exception:
            time.sleep(1)
    if ctx is None: raise RuntimeError("UNO connect failed")
    smgr = ctx.ServiceManager
    prov = smgr.createInstanceWithContext("com.sun.star.gallery.GalleryThemeProvider", ctx)
    gp = smgr.createInstanceWithContext("com.sun.star.graphic.GraphicProvider", ctx)
    def pv(n, v):
        p = PropertyValue(); p.Name = n; p.Value = v; return p
    for tn in [n for n in prov.getElementNames() if "ISO 10628" in n]:
        th = prov.getByName(tn)
        letter = "ABC"["ABC".index(tn.split("ISO 10628 ")[1][0])]
        tdir = os.path.join(BASE, f"theme_{letter}"); os.makedirs(tdir, exist_ok=True)
        items = []
        for i in range(th.Count):
            it = th.getByIndex(i)
            title = it.getPropertyValue("Title") or f"item_{i}"
            fname = f"{i:03d}_{slug(title)[:60]}.svg"
            fpath = os.path.join(tdir, fname)
            route, ok, vector = None, False, False
            try:
                g = it.getPropertyValue("Graphic")
                url = uno.systemPathToFileUrl(fpath)
                gp.storeGraphic(g, (pv("URL", url), pv("MimeType", "image/svg+xml")))
                route = "graphic"
            except Exception as e:
                out["errors"].append(f"{tn}#{i} graphic: {type(e).__name__} {e}")
            if not (os.path.exists(fpath) and os.path.getsize(fpath) > 0):
                try:
                    dr = it.getPropertyValue("Drawing")
                    url = uno.systemPathToFileUrl(fpath)
                    dr.storeToURL(url, (pv("FilterName", "draw_svg_Export"), pv("Overwrite", True)))
                    route = "drawing"
                except Exception as e:
                    out["errors"].append(f"{tn}#{i} drawing: {type(e).__name__} {e}")
            if os.path.exists(fpath) and os.path.getsize(fpath) > 0:
                ok = True
                head = open(fpath, encoding="utf-8", errors="ignore").read(200000)
                vector = ("<path" in head or "<rect" in head or "<circle" in head or "<polygon" in head) and "<image" not in head
            items.append({"idx": i, "title": title, "file": f"theme_{letter}/{fname}" if ok else None,
                          "route": route, "ok": ok, "vector": vector})
        out["themes"][tn] = items
        print(tn, "->", sum(1 for x in items if x["ok"]), "/", len(items), "vector:", sum(1 for x in items if x["vector"]), flush=True)
finally:
    try: os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception: pass
json.dump(out, open(MAN, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("MANIFEST:", MAN)
