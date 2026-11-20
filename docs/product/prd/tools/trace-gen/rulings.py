"""Rulings already taken in GAP-LOG.md, read from the file (ids, text, the FR ids and question ids each one cites)."""
from eng import *
GL=open(os.path.join(PRD,'GAP-LOG.md'),encoding='utf-8').read()
RULINGS={}   # id -> dict(text, sect)
SECTS=[('Function conflict rulings K1 to K10','K'),('IA audit rulings R-IA-1 to R-IA-6','R-IA'),('Notification catalogue rulings','N'),('Cultural background data rulings','CB'),('Days library rulings','DL')]
OPENNOTES=[]   # bullets in those sections that are not rulings (founder and counsel hand-offs)
for title,_ in SECTS:
    m=re.search(r'^## %s.*?(?=^## |\Z)'%re.escape(title),GL,re.M|re.S)
    if not m: continue
    sect=m.group(0)
    for l in sect.split('\n'):
        mm=re.match(r'^- ((?:K|R-IA-|N-|CB-|DL-)\d+)( \(([^)]*)\))?[:.]? (.*)',l)
        if mm:
            rid=mm.group(1)
            RULINGS[rid]=dict(id=rid,text=mm.group(4).strip(),refs=mm.group(3) or '',sect=title)
        elif l.startswith('- FR-SEC-13'):
            RULINGS['K-SEC13']=dict(id='K-SEC13',text=l[2:].strip(),refs='',sect=title)
        elif l.startswith('- FOUNDER') or l.startswith('- COUNSEL') or l.startswith('- Engineering') or l.startswith('- Process note') or l.startswith('- Tests T1'):
            OPENNOTES.append((title,l[2:].strip()))
for r in RULINGS.values():
    r['frs']=fr_ids(r['text']+' '+r['refs'])
    r['qrefs']=re.findall(r'Q-[A-Z]+-\d+|CUL-Q\d+',r['refs']+' '+r['text'])
def qhandle(ref):
    if ref.startswith('CUL-Q'): return 'CUL '+ref
    m=re.match(r'Q-([A-Z]+)-\d+',ref)
    return '%s %s'%(m.group(1),ref) if m else None
RULED_Q={}   # question handle -> [ruling ids]
def ruled_q(h,rid):
    if h and rid not in RULED_Q.setdefault(h,[]): RULED_Q[h].append(rid)
for rid,r in RULINGS.items():
    for q in r['qrefs']:
        if q.startswith('Q-FD'): continue
        ruled_q(qhandle(q),rid)
# explicit links read from the ruling text (the ruling does not print the question id)
for rid,hs in {'N-1':['NTC Q-NTC-8'],'N-7':['NTC Q-NTC-6'],'DL-1':['DAY Q-DAY-2'],'DL-5':['DAY Q-DAY-7'],'DL-9':['DAY Q-DAY-12'],
  'CB-2':['CUL CUL-Q12'],'CB-4':['CUL CUL-Q3'],'CB-5':['CUL CUL-Q9'],'CB-6':['CUL CUL-Q10'],
  'K3':['DAT FQ-02'],'K4':['PRV PQ-10','OPS Q7'],'K5':['CMP C-2','CMP C-3','SUP Q-SUP-13'],
  'K6':['MKT MQ-8'],'K8':['FIN F1','OPS Q1','FIN F7','OPS Q2','FIN F6','OPS Q3'],'K10':['DAT FQ-09','PRV PQ-7']}.items():
    for h in hs: ruled_q(h,rid)
# card-change proposals ruled (handles), with the ruling id
RULED_CC={}
def ruled_cc(h,rid):
    if rid not in RULED_CC.setdefault(h,[]): RULED_CC[h].append(rid)
for rid,hs in {'K1':['PRV C21','PRV C22'],'K3':['DAT C-11'],'K4':['LEG C-3','PRV C23'],'K6':['MKT C08','CMP K-5'],'K7':['OPS C12','CMP K-3'],'K10':['DAT C-13'],
  'CB-2':['DAY C1','CUL C01'],'N-2':['DAY C2','CUL C02','DAY C6'],'DL-2':['DAY C3','DAY C4'],'CB-5':['CUL C03','DAY C5'],'N-3':['DAY C5'],'DL-5':['DAY C8'],'CB-4':['CUL C05','CUL C06'],'CB-1':['CUL C07']}.items():
    for h in hs: ruled_cc(h,rid)
# FRs named by a ruling
RULED_FR={}
for rid,r in RULINGS.items():
    for f in r['frs']: RULED_FR.setdefault(f,[])
    for f in r['frs']:
        if rid not in RULED_FR[f]: RULED_FR[f].append(rid)

# FRs a ruling decides or amends, read from the ruling text against the FR text (the ruling does not always print the FR id).
for rid,fs in {'CB-2':['FR-DAY-03'],'N-2':['FR-DAY-03'],'DL-2':['FR-DAY-07'],'DL-3':['FR-DAY-06','FR-DAY-24'],'DL-4':['FR-DAY-05'],'DL-6':['FR-DAY-08'],
  'N-3':['FR-DAY-09','FR-NTC-09'],'CB-5':['FR-DAY-09','FR-CUL-12','FR-CUL-14'],'DL-10':['FR-DAY-09'],'DL-1':['FR-DAY-11'],'R-IA-2':['FR-DAY-16'],'DL-7':['FR-DAY-18'],
  'N-6':['FR-NTC-03'],'N-4':['FR-NTC-05'],'N-5':['FR-NTC-10'],'N-8':['FR-NTC-12'],'N-7':['FR-NTC-13'],'N-1':['FR-NTC-18'],'DL-5':['FR-NTC-18'],
  'CB-1':['FR-CUL-01'],'CB-3':['FR-CUL-05'],'CB-4':['FR-CUL-10','FR-CUL-15'],'CB-6':['FR-CUL-18','FR-CUL-19','FR-CUL-20'],'R-IA-3':['FR-PHS-02','FR-OPP-02']}.items():
    for f in fs:
        if f in FRS:
            RULED_FR.setdefault(f,[])
            if rid not in RULED_FR[f]: RULED_FR[f].append(rid)
AMENDED={'FR-DAY-03':'CB-2 amends it: a chosen day is not a typed day; it is a separate yearly store with a `libraryDay` source (no new class); card 21 reads it as a ranked source inside the typedDay group and asks Karma to confirm (its item 8)',
 'FR-PHS-02':'R-IA-3 amends it: one more rank in the single Home slip slot, not a strip of several items'}

# Errata rows (18-errata-after-lock.md) and closure lines (GAP-LOG.md "Closures 20 Nov") that decide an FR.
# An E row names the FR in its "Where" cell (table rows) or in its heading (### E sections); a CL line names it in its
# parenthesis. Both are read from the files, so a new E or CL row that cites an FR shows up on the next run.
ERR=open(os.path.join(PRD,'18-errata-after-lock.md'),encoding='utf-8').read()
def _ruled_by(rid,f):
    if f in FRS:
        RULED_FR.setdefault(f,[])
        if rid not in RULED_FR[f]: RULED_FR[f].append(rid)
_cl_err={}   # CL id -> E id named in the CL line ("errata E46")
for l in GL.split('\n'):
    m=re.match(r'^- (CL-\d+) \(([^)]*)\)',l)
    if not m: continue
    cl,paren=m.group(1),m.group(2)
    me=re.search(r'errata (E\d+)',paren)
    if me: _cl_err[cl]=me.group(1)
    elif int(cl[3:])>=114:
        for f in fr_ids(paren): _ruled_by(cl,f)
for l in ERR.split('\n'):
    m=re.match(r'^\| (E\d+) \|(.*)\|\s*$',l)
    if m:
        for f in fr_ids(m.group(2)): _ruled_by(m.group(1),f)
    m=re.match(r'^### (E\d+): (.*)',l)
    if m and int(m.group(1)[1:])>=61:
        for f in fr_ids(m.group(2)): _ruled_by(m.group(1),f)
# RV-12 (GAP-LOG "Applied without an E number" in 18-errata): the wording of these two FRs follows it.
for _f in ('FR-OPP-03','FR-PHS-54'): _ruled_by('RV-12',_f)
