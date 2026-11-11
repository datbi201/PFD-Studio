import json,math
R=json.load(open('runs.json'))
X={x['key']:x for x in json.load(open('open_symbols.json',encoding='utf8'))}
def propose(k):
    r=R[k];w,h=r['w'],r['h'];cand=[]
    for side in 'wens':
        L=h if side in 'we' else w
        runs=r['sides'][side]
        short=[q for q in runs if q['l']<=0.5*L]
        use=short if short else runs
        if len(use)>3:
            use=[use[0],use[len(use)//2],use[-1]]
        for q in use:
            c=q['c']
            x,y={'w':(-w/2,c),'e':(w/2,c),'n':(c,-h/2),'s':(c,h/2)}[side]
            cand.append({'x':round(x,1),'y':round(y,1),'d':side,'short':bool(short),'l':q['l']})
    # merge near duplicates (corner)
    out=[]
    for c in cand:
        dup=[o for o in out if math.hypot(o['x']-c['x'],o['y']-c['y'])<4]
        if dup:
            o=dup[0]
            if c['l']<o['l']: o.update(c)
            continue
        out.append(c)
    return out
def agree(a,b):
    if not a or not b: return False
    ok1=all(any(math.hypot(p['x']-q['x'],p['y']-q['y'])<3 for q in b) for p in a)
    ok2=all(any(math.hypot(p['x']-q['x'],p['y']-q['y'])<3 for q in a) for p in b)
    return ok1 and ok2
if __name__=='__main__':
    import collections
    ch=[];same=0;cnt=collections.Counter()
    for k in R:
        pr=propose(k);ex=R[k]['ports'] or []
        cnt[len(pr)]+=1
        if k.startswith('dp_'): continue
        if len(pr)>=2 and not agree(ex,pr): ch.append(k)
        else: same+=1
    print('changed',len(ch),'same',same,dict(sorted(cnt.items())))
    json.dump(ch,open('changed_ports.json','w'))
    import collections
    print(collections.Counter(k.split('_')[0] for k in ch))
