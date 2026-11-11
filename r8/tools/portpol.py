import json,math
exec(open('taxo.py',encoding='utf8').read())
R=json.load(open('runs.json'))
def cands(k):
    r=R[k];w,h=r['w'],r['h'];out=[]
    for side in 'wens':
        L=h if side in 'we' else w
        for q in r['sides'][side]:
            c=q['c'];x,y={'w':(-w/2,c),'e':(w/2,c),'n':(c,-h/2),'s':(c,h/2)}[side]
            out.append({'x':round(x,1),'y':round(y,1),'d':side,'l':q['l'],'L':L,'c':c,'stub':q['l']<=0.3*L})
    return out
def best_on(cs,side):
    a=[c for c in cs if c['d']==side]
    if not a: return None
    return min(a,key=lambda c:(abs(c['c'])+ (0 if c['l']<=0.6*c['L'] else 4*c['L'])))
CAP={'pump':3,'comp':4,'drive':3,'hx':4,'fired':4,'mix':3,'solid':4,'sep':5,'vessel':6,'tank':6,'column':6,'hvac':4,'upstream':6,'transport':4,'water':6}
def policy(k,cls,sub,existing):
    if k.startswith('dp_'): return existing,'keep-dp'
    if cls in ('inst','line','misc','elec'): return existing,'keep'
    cs=cands(k)
    if not cs: return existing,'none'
    if cls=='act':
        s=best_on(cs,'s') or best_on(cs,'n')
        return ([{'id':'s','x':s['x'],'y':s['y'],'d':s['d']}] if s else existing),'act'
    if cls in ('valve',) or (cls=='pipe') or (cls=='sep' and sub=='strain'):
        w=best_on(cs,'w');e=best_on(cs,'e');n=best_on(cs,'n');s=best_on(cs,'s')
        pair=None
        if w and e: pair=[w,e]
        elif n and s: pair=[n,s]
        if not pair: return existing,'nopair'
        out=pair[:]
        if cls=='valve' and sub=='way':
            third=[x for x in (n,s) if x]
            if pair==[w,e] and third:
                out.append(min(third,key=lambda c:abs(c['c'])))
        return mk(out),'pair'
    # equipment
    cap=CAP.get(cls,6)
    stubs=[c for c in cs if c['stub']]
    walls=[c for c in cs if not c['stub']]
    sel=sorted(stubs,key=lambda c:c['l'])
    covered={c['d'] for c in sel}
    for c in walls:
        if c['d'] not in covered: sel.append(c);covered.add(c['d'])
    # dedupe near
    out=[]
    for c in sel:
        if any(math.hypot(o['x']-c['x'],o['y']-c['y'])<4 for o in out): continue
        out.append(c)
    out=out[:cap]
    if len(out)<2: return existing,'few'
    return mk(out),'equip'
def mk(cs):
    used={};res=[]
    for c in sorted(cs,key=lambda c:('wens'.index(c['d']),c['c'])):
        n=used.get(c['d'],0);used[c['d']]=n+1
        res.append({'id':c['d'] if n==0 else c['d']+str(n+1),'x':c['x'],'y':c['y'],'d':c['d']})
    return res
