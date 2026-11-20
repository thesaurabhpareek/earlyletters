import os,re,glob
from parse import *
D=load()
FRS={}   # id -> dict
ORDER=[]
for code,_ in FILES:
    for r in D[code]['frs']:
        m=re.match(r'FR-([A-Z]+)-(\d+)([a-z]?)',r['id'])
        r=dict(r); r['code']=m.group(1); r['n']=int(m.group(2)); r['file']=code
        FRS[r['id']]=r; ORDER.append(r['id'])
NMAX=50   # cards NS-01 to NS-50 (NS-46 to NS-50 are proposed by the function files and the founder direction)
# backlog ids
BLTXT=open(os.path.join(ROOT,'docs','BACKLOG.md'),encoding='utf-8').read()
BLSET=set(re.findall(r'^#### (BL-\d+)',BLTXT,re.M))
BLSTATUS={}
for m in re.finditer(r'^#### (BL-\d+)[^\n]*\n- Status: ([a-z-]+)',BLTXT,re.M): BLSTATUS[m.group(1)]=m.group(2)
BLANY=set(re.findall(r'\bBL-\d+',BLTXT))
# e2e design inventory: read from the design branch without checking it out
E2EREF='origin/docs/e2e-ux-20nov'
AREAS={'A':'A-capture','B':'B-book-and-reading','C':'C-keeping-and-trust','D':'D-family-sharing-reminders','E':'E-foundations-and-system-states'}
INV=set(); E2EHEAD=''
import subprocess
try: E2EHEAD=subprocess.run(['git','-C',ROOT,'rev-parse','--short=9',E2EREF],capture_output=True,check=True).stdout.decode().strip()
except Exception: pass
E2EFILES=0
for a,d in AREAS.items():
    t=git_show(E2EREF,'docs/design/e2e/%s/DESIGN.md'%d)
    if t is None:
        p=os.path.join(ROOT,'docs/design/e2e',d,'DESIGN.md')
        t=open(p,encoding='utf-8').read() if os.path.exists(p) else ''
    if t: E2EFILES+=1
    INV|=set(re.findall(r'\b[A-E]-S\d+\b',t))|set(re.findall(r'\bE-ST\d+[a-z]?\b',t))
SCR=re.compile(r'\b([A-E]-S(?:T)?\d+[a-z]?)((?:\.[A-Za-z][A-Za-z0-9-]*)?)')
def screens(text):
    out=[]
    for m in SCR.finditer(text):
        s=m.group(1)+m.group(2)
        if s not in out: out.append(s)
    return out
# card list: titles from the cards on disk
CARDFILES=sorted(glob.glob(os.path.join(PRD,'[0-2][0-9]-*.md')))
CARDTITLE={}
for f in CARDFILES:
    for l in open(f,encoding='utf-8').read().split('\n'):
        m=re.match(r'^## NS-(\d+)\. (.*?)(?: \((?:candidate|candidates)[^)]*\))?$',l)
        if m: CARDTITLE[int(m.group(1))]=m.group(2)
        m=re.match(r'^# NS-(\d+): (.*?)(?: \(.*\))?$',l)
        if m and int(m.group(1)) not in CARDTITLE: CARDTITLE[int(m.group(1))]=m.group(2)
CARDSRC={}
for f in CARDFILES:
    t=open(f,encoding='utf-8').read()
    for n in set(int(x) for x in re.findall(r'^#+ NS-(\d+)',t,re.M)): CARDSRC.setdefault(n,os.path.basename(f))
CARD21=os.path.join(PRD,'21-days-cultural-photos-home.md')
PROPOSED={46:'Days we mark (the days library)',47:'Family background choice (religion and country)',48:'Notification catalogue',49:'Picture-first start and suggestions',50:'Home today slip (one more rank in the Home slip slot, R-IA-3)'}
for n,tt in PROPOSED.items():
    if n not in CARDTITLE: CARDTITLE[n]=tt+' [proposed, no card yet]'
# the first-run journey table of card 19 gives screen -> card suggestions
SCR2NS={}
t19=open(os.path.join(PRD,'19-from-download-to-first-letter.md'),encoding='utf-8').read()
for sec in blocks(t19,r'The path, step by step',(2,)):
    for l in sec.split('\n'):
        if l.startswith('|') and 'NS-' in l:
            c=cells(l)
            if len(c)>=4:
                for sc in re.findall(r'\b[A-E]-S(?:T)?\d+[a-z]?',c[2]):
                    for n in ns_expand(c[3]):
                        SCR2NS.setdefault(sc,[])
                        if n not in SCR2NS[sc]: SCR2NS[sc].append(n)
def suggest_ns(text):
    out=[]
    for s in screens(text):
        base=re.match(r'[A-E]-S(?:T)?\d+[a-z]?',s).group(0)
        for n in SCR2NS.get(base,[]):
            if n not in out: out.append(n)
    return out
# FR ids a card itself names (the card's own "function requirements" mentions), per card number
CARDFR={}
CARD21ITEMS={}   # numbered items of "Conflicts and open items for Karma" in card 21 (if on disk)
for f in CARDFILES:
    t=open(f,encoding='utf-8').read()
    heads=[(m.start(),int(m.group(1))) for m in re.finditer(r'^## NS-(\d+)\.',t,re.M)]
    ends=[m.start() for m in re.finditer(r'^## ',t,re.M)]+[len(t)]
    if heads:
        for pos,n in heads:
            end=min(e for e in ends if e>pos)
            for x in fr_ids(t[pos:end]): CARDFR.setdefault(n,set()).add(x)
    else:
        m=re.match(r'# NS-(\d+)\b',t)
        if m:
            for x in fr_ids(t): CARDFR.setdefault(int(m.group(1)),set()).add(x)
    # a card file's own trace table ("Trace: what each card carries") names the FR ids each card carries
    for sec in blocks(t,r'^Trace',(2,)):
        for l in sec.split('\n'):
            if l.startswith('| NS-'):
                c=cells(l); n=int(re.match(r'NS-(\d+)',c[0]).group(1))
                for x in fr_ids(c[-1]): CARDFR.setdefault(n,set()).add(x)
if os.path.exists(CARD21):
    t=open(CARD21,encoding='utf-8').read()
    m=re.search(r'^## Conflicts and open items for Karma.*?(?=^## |\Z)',t,re.M|re.S)
    if m:
        for mm in re.finditer(r'^(\d+)\. (.*)',m.group(0),re.M): CARD21ITEMS[int(mm.group(1))]=mm.group(2)
