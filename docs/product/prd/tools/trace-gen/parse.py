import re,glob,os
FD='/home/claude/earlyletters/docs/product/prd/functions'
FILES=[('SUP','support'),('MKT','marketing'),('OPS','operations'),('FIN','finance'),('DAT','data-and-measurement'),('PRV','privacy'),('LEG','legal'),('CMP','compliance'),('SEC','risk-security')]
FNAME={'SUP':'support','MKT':'marketing','OPS':'operations','FIN':'finance','DAT':'data','PRV':'privacy','LEG':'legal','CMP':'compliance','SEC':'risk-security'}
CODES='SUP|POL|MKT|OPS|FIN|DAT|PRV|LEG|CMP|RSK|SEC'
def read(name): return open(os.path.join(FD,name+'.md'),encoding='utf-8').read()
def cells(l): return [x.strip() for x in l.strip().strip('|').split(' | ')]
def section(t,pat_start,pat_end=r'\n## \d'):
    m=re.search(pat_start+r'.*?(?='+pat_end+r'|\Z)',t,re.S)
    return m.group(0) if m else ''
def tables(sec):
    """return list of (header, rows) for each table in text"""
    out=[];cur=None
    lines=sec.split('\n')
    for i,l in enumerate(lines):
        if l.startswith('|'):
            if re.match(r'^\|[-| ]+\|$',l): continue
            if cur is None:
                cur=[cells(l),[]]
            else: cur[1].append(cells(l))
        else:
            if cur: out.append(tuple(cur)); cur=None
    if cur: out.append(tuple(cur))
    return out
FRTOK=re.compile(r'\b(?:FR-)?('+CODES+r')-(\d+)((?:(?:,| and| to|, and) (?:FR-)?(?:(?:'+CODES+r')-)?\d+(?![\d-]))*)')
def fr_ids(text,default=None):
    ids=[]
    for m in FRTOK.finditer(text):
        code,n,rest=m.group(1),m.group(2),m.group(3)
        # skip tokens like SEC-R05 (regex needs digits right after dash so ok)
        ids.append((code,int(n)))
        parts=re.findall(r'(,| and| to|, and) (?:FR-)?(?:('+CODES+r')-)?(\d+)',rest)
        prev=int(n);pc=code
        for sep,c2,n2 in parts:
            c2=c2 or pc
            if sep.strip()=='to' and c2==pc:
                for k in range(prev+1,int(n2)+1): ids.append((c2,k))
            else: ids.append((c2,int(n2)))
            prev=int(n2);pc=c2
    return ['FR-%s-%02d'%(c,n) for c,n in ids]
def ns_expand(text):
    """NS card numbers in text, incl ranges and lists"""
    out=[]
    for m in re.finditer(r'NS-(\d+)(?:\s+to\s+(?:NS-)?(\d+))?',text):
        a=int(m.group(1))
        if m.group(2): out+=list(range(a,int(m.group(2))+1))
        else: out.append(a)
        # list "NS-13, NS-18, NS-32" handled by separate matches
        # "NS-19 to NS-24" handled
    # lists like "NS-19, NS-20" separate matches
    return out
def ns_rows(text):
    """dict card-> list of row suffix tokens from text like NS-05-R3a, R3b"""
    d={}
    for m in re.finditer(r'NS-(\d+)((?:-[A-Za-z]?\d+[a-z]?)?(?:(?:, | and )R\d+[a-z]?)*)',text):
        n=int(m.group(1)); suf=m.group(2)
        toks=[]
        if suf:
            for t in re.findall(r'[A-Za-z]?\d+[a-z]?',suf): toks.append(t)
        d.setdefault(n,[])
        for t in toks:
            if t not in d[n]: d[n].append(t)
    return d

SECN={'SUP':dict(cc=5,eng=6,q=7,des=4),'MKT':dict(cc=5,eng=6,q=7,des=4),'OPS':dict(cc=5,eng=6,q=7,des=4),'FIN':dict(cc=5,eng=6,q=7,des=4),
 'DAT':dict(cc=5,eng=6,q=7,des=4),'PRV':dict(cc=5,eng=6,q=7,des=4),'LEG':dict(cc=5,eng=6,q=7,des=4),'CMP':dict(cc=5,eng=6,q=7,des=4),'SEC':dict(cc=8,eng=9,q=10,des=7)}
def sec_n(t,n):
    m=re.search(r'\n## %d\. .*?(?=\n## \d+\. |\Z)'%n,t,re.S)
    return m.group(0) if m else ''
def load():
    D={}
    for code,f in FILES:
        t=read(f); D[code]={'text':t,'name':f}
        # FR rows
        rows=[]
        for l in t.split('\n'):
            if l.startswith('| FR-'):
                c=cells(l); rows.append(dict(id=c[0],req=c[1],links=c[2],prio=c[3],lane=c[4],ev=c[5]))
        D[code]['frs']=rows
        sn=SECN[code]
        # card changes
        cc=[]
        for h,rs in tables(sec_n(t,sn['cc'])):
            for i,r in enumerate(rs):
                if h[0] in ('#',):  cc.append(dict(handle='%s %s'%(code,r[0]),card=r[1],change=r[2],why=r[3]))
                else: cc.append(dict(handle='%s C%02d'%(code,len(cc)+1),card=r[0],change=r[1],why=r[2]))
        D[code]['cc']=cc
        # questions
        qs=[]
        for h,rs in tables(sec_n(t,sn['q'])):
            if h[0] in ('#','Id'):
                for r in rs:
                    qid=r[0]
                    if code=='OPS': qid='Q%s'%qid
                    qs.append(dict(handle='%s %s'%(code,qid),cells=r,header=h))
        D[code]['qs']=qs
        # design needs
        des=[]
        for h,rs in tables(sec_n(t,sn['des'])):
            for r in rs: des.append(dict(header=h,cells=r))
        D[code]['des']=des
        # verdicts
        ver=[]
        for h,rs in tables(sec_n(t,2)):
            if h[0]=='Card':
                for r in rs: ver.append(dict(cells=r,header=h))
        D[code]['ver']=ver
        # eng
        D[code]['engsec']=sec_n(t,sn['eng'])
    return D
