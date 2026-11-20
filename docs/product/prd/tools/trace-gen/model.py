import sys; sys.path.insert(0,'/home/claude/trace-gen')
from parse import *
import subprocess
D=load()
FRS={}   # id -> dict
ORDER=[]
FUNC={'SUP':'support','POL':'policy','MKT':'marketing','OPS':'operations','FIN':'finance','DAT':'data','PRV':'privacy','LEG':'legal','CMP':'compliance','SEC':'security','RSK':'risk'}
for code,_ in FILES:
    for r in D[code]['frs']:
        m=re.match(r'FR-([A-Z]+)-(\d+)',r['id'])
        r=dict(r); r['code']=m.group(1); r['n']=int(m.group(2)); r['file']=code
        FRS[r['id']]=r; ORDER.append(r['id'])
# BL ids in backlog
BLTXT=open('/home/claude/earlyletters/docs/BACKLOG.md',encoding='utf-8').read()
BLSET=set(re.findall(r'^#### (BL-\d+)',BLTXT,re.M))
BLSTATUS={}
for m in re.finditer(r'^#### (BL-\d+)[^\n]*\n- Status: ([a-z-]+)',BLTXT,re.M): BLSTATUS[m.group(1)]=m.group(2)
# e2e inventory from worktree
E2E='/home/claude/wt/E/docs/design/e2e'
AREAS={'A':'A-capture','B':'B-book-and-reading','C':'C-keeping-and-trust','D':'D-family-sharing-reminders','E':'E-foundations-and-system-states'}
INV=set()
for a,d in AREAS.items():
    t=open('%s/%s/DESIGN.md'%(E2E,d),encoding='utf-8').read()
    INV|=set(re.findall(r'\b[A-E]-S\d+\b',t))|set(re.findall(r'\bE-ST\d+[a-z]?\b',t))
SCR=re.compile(r'\b([A-E]-S(?:T)?\d+[a-z]?)((?:\.[A-Za-z][A-Za-z0-9-]*)?)')
def screens(text):
    out=[]
    for m in SCR.finditer(text):
        s=m.group(1)+m.group(2)
        if s not in out: out.append(s)
    return out

BLANY=set(re.findall(r'\bBL-\d+',BLTXT))
# screen -> NS from card 19 journey table (author-made mapping), used only as a suggestion
SCR2NS={}
for l in open('/home/claude/earlyletters/docs/product/prd/19-from-download-to-first-letter.md',encoding='utf-8').read().split('\n')[22:42]:
    if l.startswith('|') and 'NS-' in l:
        c=cells(l)
        if len(c)>=4:
            for sc in re.findall(r'\b[A-E]-S(?:T)?\d+[a-z]?',c[2]):
                for n in ns_expand(c[3]): SCR2NS.setdefault(sc,[]); 
                for n in ns_expand(c[3]):
                    if n not in SCR2NS[sc]: SCR2NS[sc].append(n)
def suggest_ns(text):
    out=[]
    for s in screens(text):
        base=re.match(r'[A-E]-S(?:T)?\d+[a-z]?',s).group(0)
        for n in SCR2NS.get(base,[]):
            if n not in out: out.append(n)
    return out
