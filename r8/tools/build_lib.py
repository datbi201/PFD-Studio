# -*- coding: utf-8 -*-
import json,re,sys
exec(open('/tmp/pfd/r8/taxo.py',encoding='utf8').read())
X=json.load(open('/tmp/pfd/r8/open_symbols.json',encoding='utf8'))
PF=json.load(open('/tmp/pfd/r8/ports_final.json'))
PB=json.load(open('/tmp/pfd/r8/ports_bi.json'))
RB=json.load(open('/tmp/pfd/r8/runs_bi.json'))
A=json.load(open('/tmp/claude-0/-home-claude/cff5f492-7470-576c-a083-03147860def2/scratchpad/all85.json'))
SRC=[('PFD Studio',['PFD Studio']),('ISO · Wikimedia',['ISO','Wikimedia']),('ISO · Radica',['ISO','Radica']),('ANSI/PIP · Radica',['ANSI/PIP','Radica']),('draw.io',['draw.io']),('ISO · LibreOffice',['ISO','LibreOffice']),('ISO · Draftsperson',['ISO','Draftsperson'])]
def srcidx(x):
    p=x['key'].split('_')[0]
    if p=='wm':return 1
    if p=='rc':return 3 if 'PIP' in x['cat'] else 2
    if p=='dio':return 4
    if p=='lo':return 5
    return 6
lic=[]
def li(s):
    if s not in lic: lic.append(s)
    return lic.index(s)
def rnd(v): return round(v,2)
import os
SN=json.load(open('/tmp/pfd/r8/snap.json')) if os.path.exists('/tmp/pfd/r8/snap.json') else {}
rows=[];miss=[]
for x in X:
    k=x['key'];c,s=classify(k,x['label']);v=x['vars'][0]
    ports=PF[k]['ports'] if k in PF else v.get('ports') or []
    pp=[[q['id'],rnd(q['x']),rnd(q['y']),q['d']] for q in ports]
    if k in SN and '0' in SN[k]: pp=SN[k]['0']
    rows.append([k,x['label'],x.get('labelVi') or '',c,s,srcidx(x),li(x.get('lic','')),rnd(v['w']),rnd(v['h']),v['body'],pp])
# built-in
bi_tax={};bi_ports={}
exist={a['k']:a for a in A}
for k,(c,s) in BI.items():
    bi_tax[k]=[c,s]
    pv=[]
    for vi,r in enumerate(PB[k]):
        ports=list(r['ports'])
        if c=='valve' and r['why']=='pair':
            ex=RB[k][vi]['ports'] or []
            ports+= [q for q in ex if q['id']=='n']
        pv.append([[q['id'],rnd(q['x']),rnd(q['y']),q['d']] for q in ports])
    if k in SN:
        for vi,pl in SN[k].items():
            vi=int(vi)
            while len(pv)<=vi: pv.append([])
            pv[vi]=pl
    bi_ports[k]=pv
js=[]
js.append('/* PFD Studio Rev.8 — phân loại thiết bị (sinh bởi build_lib.py) */')
js.append('const CLS_ORDER2='+json.dumps(CLS_ORDER)+';')
js.append('const CLS2='+json.dumps({k:list(v) for k,v in CLS.items()},ensure_ascii=False)+';')
js.append('const SUB2='+json.dumps({c:[list(t) for t in v] for c,v in SUB.items()},ensure_ascii=False)+';')
js.append('const SRC2='+json.dumps([[a,b] for a,b in SRC],ensure_ascii=False)+';')
js.append('const BI_TAX='+json.dumps(bi_tax)+';')
js.append('const BI_PORTS='+json.dumps(bi_ports)+';')
js.append('(function(){const E={};for(const c in CLS2){E[CLS2[c][0]]=CLS2[c][1]}for(const c in SUB2)SUB2[c].forEach(s=>{E[s[1]]=s[2]});Object.assign(EN,E)})();')
open('/tmp/pfd/r7/lib/taxo.js','w',encoding='utf8').write('\n'.join(js)+'\n')
j=[]
j.append('/* PFD Studio Rev.8 — thư viện ký hiệu mở (%d ký hiệu). Giấy phép từng ký hiệu: OPEN_LIC. Chi tiết: LICENSE-attribution.md */'%len(rows))
j.append('const OPEN_LIC='+json.dumps(lic,ensure_ascii=False)+';')
j.append('const OPEN_LIB=['+',\n'.join(json.dumps(r,ensure_ascii=False,separators=(',',':')) for r in rows)+'];')
j.append('''OPEN_LIB.forEach(a=>{const k=a[0],le=a[1],lv=a[2],c=a[3],s=a[4];
 reg(k,lv||le,CLS2[c][0],"",[["A",S(a[7],a[8],a[9],a[10].map(q=>({id:q[0],x:q[1],y:q[2],d:q[3]})))]]);
 const o=SYMBOLS[k];o.cls=c;o.sub=s;o.src=a[5];o.lic=OPEN_LIC[a[6]];if(lv)EN[lv]=le;});
for(const k in BI_TAX){const o=SYMBOLS[k];if(!o)continue;o.cls=BI_TAX[k][0];o.sub=BI_TAX[k][1];o.src=0;
 const pv=BI_PORTS[k];if(pv)o.vars.forEach((v,i)=>{const p=pv[i];if(p&&p.length)v.def.ports=p.map(q=>({id:q[0],x:q[1],y:q[2],d:q[3]}))});o.def=o.vars[0].def}''')
open('/tmp/pfd/r7/lib/open_lib.js','w',encoding='utf8').write('\n'.join(j)+'\n')
print(len(rows),len(lic),len(bi_tax))
import os;print(os.path.getsize('/tmp/pfd/r7/lib/open_lib.js'))
