"""Independent re-parse: reads the function files and FUNCTION-TRACE.md with its own, simpler code (no import of parse.py)
and checks that the counts in the generated file reconcile. Run after gen.py:  python3 docs/product/prd/tools/trace-gen/check.py
"""
import os,re,sys,glob,json
HERE=os.path.dirname(os.path.abspath(__file__))
PRD=os.path.abspath(os.path.join(HERE,'..','..'))
FD=os.path.join(PRD,'functions')
T=open(os.path.join(PRD,'FUNCTION-TRACE.md'),encoding='utf-8').read()
TL=T.split('\n')
fails=[]
def check(name,a,b):
    ok=(a==b)
    print(('PASS ' if ok else 'FAIL ')+name+': '+str(a)+('' if ok else ' != '+str(b)))
    if not ok: fails.append(name)
OWN={'support':'SUP|POL','risk-security':'SEC|RSK','marketing':'MKT','operations':'OPS','finance':'FIN','data-and-measurement':'DAT','privacy':'PRV','legal':'LEG','compliance':'CMP',
 'back-office':'BKO','messaging-and-entry-points':'MSG','languages-and-localisation':'LOC','reliability':'REL','ai-and-speech':'AIS','research-validation':'RSH','quality':'QAL','lifecycle-and-platforms':'LCY','print-and-fulfilment':'PRT',
 'days-library':'DAY','notification-catalogue':'NTC','cultural-background-data':'CUL','photos-and-suggestions':'PHS','feature-opportunities':'OPP'}
files=sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(FD,'*.md')) if not f.endswith('BRIEF.md'))
check('function files found',len(files),23)
check('every function file has an owner code in this checker',sorted(files),sorted(OWN))
# 1. FR rows
ids=[]
for f in files:
    for l in open(os.path.join(FD,f+'.md'),encoding='utf-8'):
        m=re.match(r'\| (FR-(?:%s)-\d+[a-z]?)[ |]'%OWN[f],l)
        if m: ids.append(m.group(1))
check('FR rows (own code only)',len(ids),741)
check('FR ids unique',len(set(ids)),len(ids))
# forward table in the trace
fw=[]
inf=False
for l in TL:
    if l.startswith('## 1. '): inf=True; continue
    if l.startswith('## 2. '): break
    m=re.match(r'\| (FR-[A-Z]{3}-\d+[a-z]?) \|',l)
    if inf and m: fw.append(m.group(1))
check('forward table rows',len(fw),len(ids))
check('forward table ids equal the re-parsed ids',sorted(fw),sorted(ids))
check('forward table: every id once',len(set(fw)),len(fw))
# per-code counts vs totals table
tot={}
for i in ids: c=i.split('-')[1]; tot[c]=tot.get(c,0)+1
doc={}
for l in TL:
    m=re.match(r'\| \S+ \(([A-Z]{3})\) \| functions/\S+ \| (\d+) \| (\d+) \|',l)
    if m: doc[m.group(1)]=int(m.group(2))
check('per-code totals table',doc,tot)
# 2. cards: each 2a table has 50 rows, 2b has 50 rows
rows2b=[l for l in TL if re.match(r'\| NS-\d\d [^|]* \(',l)]
check('2b rows (NS-01 to NS-50)',len(rows2b),50)
n2a=sum(1 for l in TL if re.match(r'\| NS-\d\d \| [-CPMNRa/ ]+ \|',l) or re.match(r'\| NS-\d\d \| (?:[-CPMNRa/]+ \| )+\d+ \|',l))
check('2a verdict rows (two tables of 50)',n2a,100)
# links vs the 2b unmarked list
def cards_of(text):
    out=set()
    for m in re.finditer(r'NS-(\d+)(?:\s+to\s+(?:NS-)?(\d+))?',text):
        a=int(m.group(1)); b=int(m.group(2)) if m.group(2) else a
        out|=set(range(a,b+1))
    return out
links={}
for f in files:
    for l in open(os.path.join(FD,f+'.md'),encoding='utf-8'):
        m=re.match(r'\| (FR-(?:%s)-\d+[a-z]?)[ |]'%OWN[f],l)
        if m:
            c=[x.strip() for x in l.strip().strip('|').split(' | ')]
            links[m.group(1).split(' ')[0]]=cards_of(c[2]) if len(c)>2 else set()
doc2b={}
for l in rows2b:
    n=int(re.match(r'\| NS-(\d\d)',l).group(1))
    cell=l.rsplit(' | ',1)[1].rstrip(' |')
    doc2b[n]={'FR-%s'%x.strip() for x in cell.split(';') if x.strip() and x.strip()!='none' and '~' not in x}
bad=[]
for n in range(1,51):
    exp={i for i,cs in links.items() if n in cs}
    # the doc lists an FR without a mark only when the Links column names the card; ids written without the FR- prefix
    got={'FR-'+x[3:] if x.startswith('FR-') else x for x in doc2b[n]}
    got={x if x.startswith('FR-') else 'FR-'+x for x in got}
    if exp!=got: bad.append((n,sorted(exp^got)[:4]))
check('2b unmarked FR lists equal an independent read of the Links column',bad,[])
# 3. questions: rows under headings that contain "question"
nq=0
for f in files:
    sec=False
    for l in open(os.path.join(FD,f+'.md'),encoding='utf-8'):
        if l.startswith('#'): sec=bool(re.search(r'(founder|counsel).*question',l,re.I)) and l.startswith('##')
        elif sec and l.startswith('|') and not re.match(r'^\|[-| :]+\|$',l):
            c=[x.strip() for x in l.strip().strip('|').split(' | ')]
            if c[0] in ('#','Id','Id ','Question'): continue
            if c[0]=='Existing numbers': continue
            nq+=1
# subsection headings (###) that match "question" keep the section open in the independent scan only for ## headings; first-wave files use ## headings
m=re.search(r'Questions read: (\d+); index entries: (\d+)',T)
check('questions read (independent row count under "founder or counsel questions" headings)',nq,int(m.group(1)))
nh=sum(1 for l in TL if re.match(r'- \S[^`]* \(`functions/[a-z-]+\.md`\): ',l) and True)
qi=sum(1 for l in TL if l.startswith('**QI-'))
check('QI entries in section 4',qi,int(m.group(2)))
check('question lines in section 4 equal questions read',nh,int(m.group(1)))
# 4. card changes: table rows under headings containing "Card changes"
nc=0
for f in files:
    sec=False
    for l in open(os.path.join(FD,f+'.md'),encoding='utf-8'):
        if l.startswith('## '): sec=bool(re.search(r'Card changes',l,re.I))
        elif sec and l.startswith('|') and not re.match(r'^\|[-| :]+\|$',l):
            c=[x.strip() for x in l.strip().strip('|').split(' | ')]
            if c[0] in ('#','Id','Card row','Card'): continue
            nc+=1
m2=re.search(r'Proposed card changes read: (\d+); rulings after merging: (\d+)',T)
check('card changes read',nc,int(m2.group(1)))
sec3b=T[T.index('### 3b.'):T.index('### 3c.')]
single=len(re.findall(r'^- Handle: ',sec3b,re.M)); merged=len(re.findall(r'^- [A-Z]{3} \S+ on ',sec3b,re.M))
check('3b proposals shown (single plus merged lines)',single+merged,int(m2.group(1)))
check('3b ruling headings',len(re.findall(r'^\*\*R-\d{3}\*\*',sec3b,re.M)),int(m2.group(2)))
# 5. engineering
m3=re.search(r'Engineering rows read: (\d+); entries: (\d+) \(new rows needed: (\d+)\)',T)
sec5=T[T.index('### 5.1'):T.index('### 5.2')]
check('5.1 new-row table rows',len(re.findall(r'^\| NR-\d+ \(new row needed\)',sec5,re.M)),int(m3.group(3)))
# 6. design needs rows read vs independent count of table rows and bullets in design sections
nd=0
for f in files:
    sec=False; tabs=False; buf=[]
    lines=open(os.path.join(FD,f+'.md'),encoding='utf-8').read().split('\n')
    i=0
    while i<len(lines):
        l=lines[i]
        mm=re.match(r'^(#{2,3}) (.*)',l)
        if mm and re.search(r'Design needs',mm.group(2),re.I):
            lv=len(mm.group(1)); j=i+1
            while j<len(lines) and not (re.match(r'^(#{1,3}) ',lines[j]) and len(re.match(r'^(#+)',lines[j]).group(1))<=lv): j+=1
            blk=lines[i:j]
            rows=[x for x in blk if x.startswith('|') and not re.match(r'^\|[-| :]+\|$',x)]
            hdr=sum(1 for k,x in enumerate(blk) if x.startswith('|') and k+1<len(blk) and re.match(r'^\|[-| :]+\|$',blk[k+1]))
            if rows: nd+=len(rows)-hdr
            else: nd+=sum(1 for x in blk if re.match(r'^(- |\d+\. )',x))
            i=j
        else: i+=1
m4=re.search(r'Design-needs rows read: (\d+)',T)
check('design-needs rows read',nd,int(m4.group(1)))
# 7. ASCII and BL ids
check('non-ASCII characters in FUNCTION-TRACE.md',sum(1 for ch in T if ord(ch)>127),0)
srcs=[os.path.join(HERE,x) for x in os.listdir(HERE) if x.endswith('.py')]
check('non-ASCII characters in the generator sources',sum(sum(1 for ch in open(s,encoding='utf-8').read() if ord(ch)>127) for s in srcs),0)
over=sorted(set(re.findall(r'\bBL-\d{4,}',T)))
check('BL ids above BL-999 in FUNCTION-TRACE.md (only the warning string "BL-1000")',over,['BL-1000'])
# 8. generator stats equal the doc
st=json.load(open(os.path.join(HERE,'last-run.json')))
check('last-run FR total equals the doc',st['fr'],len(fw))
print('\n%d checks failed'%len(fails) if fails else '\nall checks passed')
sys.exit(1 if fails else 0)
