import re,sys,os
D=os.path.dirname(os.path.abspath(__file__))+os.sep
order=['js/00_core.js','lib/lib0.js','lib/lib1.js','lib/lib2.js','lib/lib3.js','lib/lib4a.js','lib/lib4b.js','lib/lib4c.js','pipedb.js','en/ui.js','en/cats.js','en/extra.js','en/rev5.js','en/rev6.js','js/10_state.js','js/20_geom.js','js/30_draw.js','js/40_ui.js','js/50_props.js','js/60_io.js','fonts.js','js/65_pdf.js','js/66_help.js','js/70_layout.js','js/85_cadgeo.js','js/90_cad.js','js/91_cadcmd.js','js/92_cadio.js','js/93_under.js','js/95_vecgeo.js','js/96_vec.js','js/97_veccmd.js','js/98_vecui.js','js/80_boot.js']
js='\n'.join(open(D+f,encoding='utf8').read() for f in order)
html=open(D+'base5.html',encoding='utf8').read().replace('/*@@JS@@*/',js.replace('\\','\\\\') if False else js)
out=sys.argv[1] if len(sys.argv)>1 else '/tmp/pfd/pfd-studio-26.10.26-Rev.5.html'
open(out,'w',encoding='utf8').write(html)
print(out,len(html))
