import sys
D='/tmp/pfd/r7/'
order=['js/00_core.js','lib/lib0.js','lib/lib1.js','lib/lib2.js','lib/lib3.js','lib/lib4a.js','lib/lib4b.js','lib/lib4c.js','lib/lib5.js','pipedb.js','en/ui.js','en/cats.js','en/extra.js','en/rev5.js','en/rev6.js','en/rev7.js','js/10_state.js','js/20_geom.js','js/30_draw.js','js/40_ui.js','js/50_props.js','js/60_io.js','fonts.js','js/65_pdf.js','js/66_help.js','js/70_layout.js','js/90_mod.js','js/80_boot.js']
import os
extra=[l.strip() for l in open(D+'order_extra.txt')] if os.path.exists(D+'order_extra.txt') else []
# order_extra.txt: một file mỗi dòng, chèn ngay trước js/90_mod.js
i=order.index('js/90_mod.js'); order[i:i]=extra
js='\n'.join(open(D+f,encoding='utf8').read() for f in order)
html=open(D+'base7.html',encoding='utf8').read().replace('/*@@JS@@*/',js)
out=sys.argv[1] if len(sys.argv)>1 else '/tmp/pfd/pfd-studio-26.10.30-Rev.7.html'
open(out,'w',encoding='utf8').write(html)
print(out,len(html))
