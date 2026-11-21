import re,glob,os,subprocess
HERE=os.path.dirname(os.path.abspath(__file__))
# repo root: docs/product/prd/tools/trace-gen -> five levels up
ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..','..'))
PRD=os.path.join(ROOT,'docs','product','prd')
FD=os.path.join(PRD,'functions')
# (code, file stem). First wave, then second wave, then third wave.
FILES=[('SUP','support'),('MKT','marketing'),('OPS','operations'),('FIN','finance'),('DAT','data-and-measurement'),('PRV','privacy'),('LEG','legal'),('CMP','compliance'),('SEC','risk-security'),
 ('BKO','back-office'),('MSG','messaging-and-entry-points'),('LOC','languages-and-localisation'),('REL','reliability'),('AIS','ai-and-speech'),('RSH','research-validation'),('QAL','quality'),('LCY','lifecycle-and-platforms'),('PRT','print-and-fulfilment'),
 ('DAY','days-library'),('NTC','notification-catalogue'),('CUL','cultural-background-data'),('PHS','photos-and-suggestions'),('OPP','feature-opportunities')]
FIRST=['SUP','MKT','OPS','FIN','DAT','PRV','LEG','CMP','SEC']   # first-wave file codes (their section layout is fixed)
FNAME={'SUP':'support','MKT':'marketing','OPS':'operations','FIN':'finance','DAT':'data','PRV':'privacy','LEG':'legal','CMP':'compliance','SEC':'risk-security',
 'BKO':'back-office','MSG':'messaging','LOC':'languages','REL':'reliability','AIS':'ai-and-speech','RSH':'research','QAL':'quality','LCY':'lifecycle','PRT':'print','DAY':'days','NTC':'notifications','CUL':'cultural-data','PHS':'photos','OPP':'opportunities'}
# FR code (the letters in FR-<CODE>-nn) -> short function name; POL and RSK live in the support and risk-security files
CODEFN={'SUP':'support','POL':'policy','MKT':'marketing','OPS':'operations','FIN':'finance','DAT':'data','PRV':'privacy','LEG':'legal','CMP':'compliance','SEC':'security','RSK':'risk',
 'BKO':'back-office','MSG':'messaging','LOC':'languages','REL':'reliability','AIS':'ai-and-speech','RSH':'research','QAL':'quality','LCY':'lifecycle','PRT':'print','DAY':'days','NTC':'notifications','CUL':'cultural-data','PHS':'photos','OPP':'opportunities'}
CODES='SUP|POL|MKT|OPS|FIN|DAT|PRV|LEG|CMP|RSK|SEC|BKO|MSG|LOC|REL|AIS|RSH|QAL|LCY|PRT|DAY|NTC|CUL|PHS|OPP'
BARE='SUP|POL|MKT|OPS|FIN|DAT|PRV|LEG|CMP|RSK|SEC|BKO|CUL'   # codes that may appear without "FR-" (OPP-nn is an opportunity id, others never bare)
FIDRE=r'FR-(?:%s)-\d+[a-z]?'%CODES
KNOWN=set()   # every FR id that has a row; filled by load() before any list expansion
def read(name): return open(os.path.join(FD,name+'.md'),encoding='utf-8').read()
def cells(l): return [x.strip() for x in l.strip().strip('|').split(' | ')]
def tables(sec):
    """list of (header, rows) for each pipe table in text"""
    out=[];cur=None
    for l in sec.split('\n'):
        if l.startswith('|'):
            if re.match(r'^\|[-| :]+\|$',l): continue
            if cur is None: cur=[cells(l),[]]
            else: cur[1].append(cells(l))
        else:
            if cur: out.append(tuple(cur)); cur=None
    if cur: out.append(tuple(cur))
    return out
def fid(code,n,suf=''): return 'FR-%s-%02d%s'%(code,int(n),suf)
FRTOK=re.compile(r'(?<![A-Za-z0-9-])(?:FR-(%s)|(%s))-(\d+)([a-z]?)(?![A-Za-z0-9])((?:(?:,| and| to|, and) (?:FR-)?(?:(?:%s)-)?-?\d+[a-z]?(?![A-Za-z0-9-]))*)'%(CODES,BARE,CODES))
def fr_ids(text,default=None):
    """FR ids named in text. List continuations ("FR-X-01, 03", "to 05", ", -03") are kept only when the id has a row (KNOWN)."""
    ids=[]
    for m in FRTOK.finditer(text):
        code=m.group(1) or m.group(2); n=int(m.group(3)); suf=m.group(4); rest=m.group(5)
        ids.append(fid(code,n,suf))
        prev=n;pc=code
        for sep,c2,n2,s2 in re.findall(r'(,| and| to|, and) (?:FR-)?(?:(%s)-)?-?(\d+)([a-z]?)'%CODES,rest):
            c2=c2 or pc
            if sep.strip()=='to' and c2==pc:
                for k in range(prev+1,int(n2)+1):
                    if fid(c2,k) in KNOWN: ids.append(fid(c2,k))
                if fid(c2,int(n2),s2) in KNOWN: ids.append(fid(c2,int(n2),s2))
            else:
                x=fid(c2,int(n2),s2)
                if x in KNOWN: ids.append(x)
            prev=int(n2);pc=c2
    if default and not ids and re.fullmatch(r'[\d, ]+',text.strip()):
        ids=[fid(default,x) for x in re.findall(r'\d+',text)]
    return list(dict.fromkeys(ids))
def ns_expand(text):
    """NS card numbers in text, incl ranges"""
    out=[]
    for m in re.finditer(r'NS-(\d+)(?:\s+to\s+(?:NS-)?(\d+))?',text):
        a=int(m.group(1))
        if m.group(2): out+=list(range(a,int(m.group(2))+1))
        else: out.append(a)
    return out
def ns_rows(text):
    """dict card -> list of row tokens from text like NS-05-R3a, R3b"""
    d={}
    for m in re.finditer(r'NS-(\d+)((?:-[A-Za-z]?\d+[a-z]?)?(?:(?:, | and )R\d+[a-z]?)*)',text):
        n=int(m.group(1)); suf=m.group(2)
        d.setdefault(n,[])
        for t in re.findall(r'[A-Za-z]?\d+[a-z]?',suf):
            if t not in d[n]: d[n].append(t)
    return d
# ---- section finders (heading text based, because the files number their sections differently)
def blocks(t,rx,levels=(2,3)):
    """text of every section whose heading matches rx; a section runs to the next heading of the same or a higher level"""
    L=t.split('\n'); out=[]; i=0
    while i<len(L):
        m=re.match(r'^(#{2,3}) (.*)',L[i])
        if m and len(m.group(1)) in levels and re.search(rx,m.group(2),re.I):
            lv=len(m.group(1)); j=i+1
            while j<len(L):
                m2=re.match(r'^(#{1,3}) ',L[j])
                if m2 and len(m2.group(1))<=lv: break
                j+=1
            out.append('\n'.join(L[i:j])); i=j
        else: i+=1
    return out
def sec_n(t,n):
    m=re.search(r'\n## %d\. .*?(?=\n## |\Z)'%n,t,re.S)   # ends at the next level-2 heading of any kind, so an unnumbered "## Addendum" is not read as part of the last numbered section
    return m.group(0) if m else ''
SECN={c:dict(cc=5,eng=6,q=7,des=4) for c in FIRST}; SECN['SEC']=dict(cc=8,eng=9,q=10,des=7)
FIN_OWNER={'F1':'founder','F2':'founder','F3':'founder','F4':'founder','F5':'founder (engages counsel)','F6':'founder','F7':'founder','F8':'founder','F9':'founder','F10':'founder','F11':'founder; counsel Q41(f)','F12':'founder, accountant, counsel','F13':'founder (engages accountant)'}
def vnorm(s):
    s=s.lower()
    if s.startswith('covered'): return 'C'
    if s.startswith('partly'): return 'P'
    if s.startswith('missing'): return 'M'
    if s.startswith('n/a'): return 'n/a'
    return 'NR'
def hidx(h,rx):
    for i,x in enumerate(h):
        if re.search(rx,x,re.I): return i
    return None
def parse_cc(code,sec):
    cc=[]
    for h,rs in tables(sec):
        ci=hidx(h,r'^card')
        if ci is None: continue
        for r in rs:
            if len(r)<ci+2: continue
            if ci>0 and h[0] in ('#','Id'):
                hid=r[0]
                if hid.isdigit(): hid='C'+hid
                cc.append(dict(handle='%s %s'%(code,hid),card=r[ci],change=r[ci+1],why=r[ci+2] if len(r)>ci+2 else ''))
            else:
                cc.append(dict(handle='%s C%02d'%(code,len(cc)+1),card=r[ci],change=r[ci+1] if len(r)>ci+1 else '',why=r[ci+2] if len(r)>ci+2 else ''))
    return cc
def parse_qs(code,secs):
    qs=[]
    for sec in secs:
        for h,rs in tables(sec):
            if h[0] not in ('#','Id') or hidx(h,r'question') is None: continue
            qi=hidx(h,r'question'); di=hidx(h,r'default'); oi=hidx(h,r'^(To|Who)$'); ni=hidx(h,r'number')
            for r in rs:
                qid=r[0]
                if qid=='Existing numbers': continue   # PHS note row, not a question
                if code=='OPS': qid='Q%s'%qid
                c=r
                if code in FIRST:
                    if code in ('SUP','MKT','SEC','OPS'): question,default,owner,number=c[1],c[2],c[3],''
                    elif code=='FIN': question,default,owner,number=c[1],c[3]+' (recommendation: '+c[2]+')',FIN_OWNER[qid],''
                    elif code=='DAT':
                        question,default=c[1],c[2]
                        owner='counsel' if re.match(r'Counsel|Founder and counsel',question) else 'founder'; number=''
                    else: question,default,owner,number=c[1],c[3],c[2],c[4]
                else:
                    question=c[qi]; default=c[di] if di is not None and di<len(c) else ''
                    number=c[ni] if ni is not None and ni<len(c) else ''
                    if oi is not None and oi<len(c): owner=c[oi]
                    else:
                        m=re.match(r'(Counsel|Founder|Karma|Accountant|Founder and counsel)\b',question)
                        owner=m.group(1).lower() if m else ('counsel' if qid.startswith('Counsel') else 'not stated (read as founder)')
                qs.append(dict(handle='%s %s'%(code,qid),cells=c,header=h,question=question,default=default,owner=owner,number=number,qid=qid))
    return qs
def parse_design(code,secs):
    des=[]
    for sec in secs:
        tabs=tables(sec)
        for h,rs in tabs:
            for r in rs: des.append(dict(header=h,cells=r))
        if not tabs:
            for l in sec.split('\n'):
                m=re.match(r'^(?:- |\d+\. )(.*)',l)
                if m: des.append(dict(header=['bullet'],cells=[m.group(1)]))
    return des
def parse_eng(code,secs):
    """rows: dict(label,text,owner,rawcells,hdr) ; generic over table layouts and bullet lists"""
    rows=[]
    if code=='DAT':
        for sec in secs:
            for l in sec.split('\n'):
                m=re.match(r'- \*\*(.*?)\*\*:?\s*(.*)',l)
                if m:
                    label=m.group(1).strip().rstrip(':'); text=m.group(2).strip()
                    if label.startswith('No app code'): continue
                    rows.append(dict(label=label,text=text,owner='see label',rawcells=[],hdr=['bullet']))
        return rows
    for sec in secs:
        tabs=tables(sec)
        for h,rs in tabs:
            if h[0] in ('Card',): continue
            oi=hidx(h,r'owner|lane')
            for r in rs:
                label=r[0]
                if code in FIRST:
                    if len(r)>=3: text=r[1]; owner=r[2]
                    else: text=r[1] if len(r)>1 else ''; owner=''
                else:
                    owner=r[oi] if oi is not None and oi<len(r) else ''
                    rest=[x for i,x in enumerate(r) if i>0 and i!=oi]
                    text=' | '.join(rest)
                rows.append(dict(label=label,text=text,owner=owner,rawcells=r,hdr=h))
        if not tabs and not re.search(r'^(?:- |\d+\. )',sec,re.M):
            para=' '.join(l for l in sec.split('\n') if l.strip() and not l.startswith('#'))
            m=re.search(r'New rows? needed[^:]*:(.*?)(?:Existing rows?:(.*))?$',para)
            if m:
                for x in re.split(r';\s*',m.group(1).strip().rstrip('.')):
                    if x.strip(): rows.append(dict(label='New',text=x.strip(),owner='',rawcells=[x],hdr=['para']))
                for x in re.split(r',\s*(?=BL-\d)',(m.group(2) or '').strip().rstrip('.')):
                    if x.strip(): rows.append(dict(label=x.strip(),text='',owner='',rawcells=[x],hdr=['para']))
        if not tabs:
            for l in sec.split('\n'):
                m=re.match(r'^(?:- |\d+\. )(.*)',l)
                if not m: continue
                x=m.group(1).strip()
                if re.match(r'No (app )?code',x) or x.startswith('---'): continue
                mb=re.match(r'^(BL-\d+[^:]{0,30}):\s*(.*)',x)
                if mb: label,text=mb.group(1),mb.group(2)
                elif re.match(r'New row',x): label,text='New',re.sub(r'^New row[:,]?\s*','',x)
                else: label,text='Note',x
                ow=re.findall(r'[Oo]wner[s]? `([a-z-]+)`(?:, `([a-z-]+)`)?',x)
                rows.append(dict(label=label,text=text,owner=', '.join(y for y in ow[0] if y) if ow else '',rawcells=[x],hdr=['bullet']))
    return rows
def load():
    D={}
    # pass 1: FR rows
    for code,f in FILES:
        t=read(f); D[code]={'text':t,'name':f}
        rows=[]
        for l in t.split('\n'):
            # an FR row has the six columns (id, requirement, links, priority, lane, evidence). The addenda also hold two- and
            # three-cell "neighbouring rows extended" lines that start with an id ("| FR-OPS-22 (flag matrix) | note |"); those are
            # pointers to a row that already exists and must not be read as a second row for that id. "FR-LCY-33 (proposal)" is a real row.
            ok=re.match(r'\| FR-%s-\d+[a-z]?[ |]'%('[A-Z]{3}' if code in FIRST else code),l) and len(cells(l))>=6
            if ok:
                c=cells(l); rows.append(dict(id=c[0].split(' ')[0],req=c[1],links=c[2],prio=c[3],lane=c[4],ev=c[5]))
        D[code]['frs']=rows
        for r in rows: KNOWN.add(r['id'])
    # pass 2: everything that cites FR ids
    for code,f in FILES:
        t=D[code]['text']
        if code in FIRST:
            sn=SECN[code]
            ccs=sec_n(t,sn['cc']); qsec=[sec_n(t,sn['q'])]; dsec=[sec_n(t,sn['des'])]+[b for b in blocks(t,r'Design needs',(3,)) if b not in sec_n(t,sn['des'])]; esec=[sec_n(t,sn['eng'])]   # design: the numbered section plus the addendum's Design needs subsections
        else:
            ccs='\n'.join(blocks(t,r'^\d+\.? .*Card changes',(2,)) or blocks(t,r'Card changes'))
            qsec=blocks(t,r'questions',(2,)) or blocks(t,r'questions')
            dsec=blocks(t,r'Design needs',(2,3))   # every Design needs section, the addendum's included (check.py counts the same way)
            esec=blocks(t,r'^(\d+\.? )?Engineering needs',(2,)) or blocks(t,r'Engineering needs')
            if code=='NTC': esec=blocks(t,r'neighbours must change',(2,))+esec
        D[code]['cc']=parse_cc(code,ccs)
        D[code]['qs']=parse_qs(code,qsec)
        D[code]['des']=parse_design(code,dsec)
        ver=[]
        vsecs=[sec_n(t,2)] if code in FIRST else blocks(t,r'verdict|Coverage',(2,3))
        for s in vsecs:
            for h,rs in tables(s):
                if h[0] in ('Card','Cards'):
                    for r in rs: ver.append(dict(cells=r,header=h))
        D[code]['ver']=ver
        D[code]['engsec']='\n'.join(esec)
        D[code]['eng']=parse_eng(code,esec)
    return D
# ---- git helpers for the e2e design branch (read only)
def git_show(ref,path):
    try: return subprocess.run(['git','-C',ROOT,'show','%s:%s'%(ref,path)],capture_output=True,check=True).stdout.decode('utf-8')
    except Exception: return None
