"""Builds docs/product/prd/FUNCTION-TRACE.md from the function files, the cards, GAP-LOG.md and the e2e design branch.
Run from anywhere:  python3 docs/product/prd/tools/trace-gen/gen.py
Check with:         python3 docs/product/prd/tools/trace-gen/check.py
"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from rulings import *
from groups import *
import json
OUT=[]
def w(s=''): OUT.append(s)
FILEORDER=[c for c,_ in FILES]
FN_FILE={c:n for c,n in FILES}
FIRSTWAVE=FIRST
LATER=[c for c in FILEORDER if c not in FIRST]
def src(code): return 'functions/'+FN_FILE[code]+'.md'
def fname(c): return CODEFN[c]
def fnm(c): return FNAME[c]
NCARDS=NMAX
# ---------- questions
QS={}
QORDER=[]
for code,_ in FILES:
    for q in D[code]['qs']:
        h=q['handle']; qid=q['qid']; question,default,owner,number=q['question'],q['default'],q['owner'],q['number']
        txt=' '.join(q['cells'])
        own=owner+' '+number
        kind=[]
        if re.search(r'counsel|needs a number from legal',own,re.I): kind.append('counsel')
        if re.search(r'founder',own,re.I) or not kind: kind.append('founder')
        if re.search(r'accountant|clinician',own,re.I): kind.append('other')
        nums=sorted(set(re.findall(r'\bQ\d{1,2}\b',own+(' '+default if (code=='DAT' and qid=='FQ-08') else ''))),key=lambda x:int(x[1:]))
        QS[h]=dict(handle=h,qid=qid,code=code,question=question,default=default,owner=owner,number=number,kind=kind,nums=nums,frs=sorted(set(fr_ids(txt,code)),key=lambda x:ORDER.index(x) if x in ORDER else 9999))
        QORDER.append(h)
DUE={'SUP Q-SUP-10':'before C1 (stated in the row)','OPS Q11':'before the first run sheet of the pack (stated)','FIN F2':'before the first run sheet (stated)','FIN F12':'due 27 Nov (stated)','FIN F13':'before the first payout (CR-120) (stated)','CMP C-2':'1 Jan 2027 is the date in the question (stated)','SEC Q-S3':'before the first person outside the family stores letters on the server (stated)'}
DATERX=re.compile(r'\b(\d{1,2} (?:Nov|Dec|Jan|Feb|Mar)[a-z]*(?: \d{4})?)')
def stated_due(h):
    if h in DUE: return DUE[h]
    q=QS[h]
    m=DATERX.search(q['question'])
    if m and QS[h]['code'] not in FIRST: return 'date in the question: %s (stated)'%m.group(1)
    m=re.search(r'\b(before [^.;,()]{6,70})',q['question'])
    if m and q['code'] not in FIRST: return m.group(1)+' (stated in the question)'
    return None
# ---------- card changes
CC={}
for code,_ in FILES:
    for x in D[code]['cc']:
        x=dict(x); x['code']=code; x['frs']=sorted(set(fr_ids(x['card']+' '+x['change']+' '+x['why'],code)),key=lambda f:ORDER.index(f) if f in ORDER else 9999); CC[x['handle']]=x
# ---------- status
cc_cites={}
for h,x in CC.items():
    for f in x['frs']: cc_cites.setdefault(f,[]).append(h)
cq=set();fq=set()
for q in QS.values():
    if 'counsel' in q['kind']: cq|=set(q['frs'])
    if 'founder' in q['kind']: fq|=set(q['frs'])
def ruled_ids_for_fr(i):
    ids=list(RULED_FR.get(i,[]))
    hs=cc_cites.get(i,[])
    if hs and all(h in RULED_CC for h in hs):
        for h in hs:
            for r in RULED_CC[h]:
                if r not in ids: ids.append(r)
    return ids
def status(r):
    s=[]
    lane=r['lane'].lower()
    if r['id'] in cq or 'counsel' in lane: s.append('counsel')
    if r['id'] in fq or 'founder' in lane: s.append('founder')
    locked=bool(re.search(r'NS-\d+-[A-Z]?\d+|NS-\d+ [A-Z]\d+',r['links']))
    need=(r['id'] in cc_cites or not locked)
    rid=ruled_ids_for_fr(r['id'])
    if need and rid:
        s.insert(0,'ruled (%s%s)'%(', '.join(rid),'; amended' if r['id'] in AMENDED else ''))
    elif need: s.append('needs Karma ruling')
    elif rid: s.insert(0,'locked row; ruling also %s'%', '.join(rid))
    return '; '.join(s) if s else 'locked row'
# ---------- touches
touch={n:{} for n in range(1,NCARDS+1)}
packfr=[]
for i in ORDER:
    r=FRS[i]
    ns=set(ns_expand(r['links']))
    for n in ns:
        if 1<=n<=NCARDS: touch[n].setdefault(i,set()).add('L')
    if not ns and PW.search(r['links']): packfr.append(i)
    for n in set(ns_expand(r['req'])):
        if 1<=n<=NCARDS and n not in ns: touch[n].setdefault(i,set()).add('T')
for n,fs in CARDFR.items():
    for f in fs:
        if f in FRS and 1<=n<=NCARDS: touch[n].setdefault(f,set()).add('C')
VER={}
EXTRA=[]
for code,_ in FILES:
    for v in D[code]['ver']:
        c=v['cells']; lab=c[0]; vd=vnorm(c[1]) if len(c)>1 else 'NR'
        cards=sorted(set(ns_expand(lab)))
        m=re.match(r'NS-\d+ (Part [A-C]|[A-Z]\d*)\b',lab)
        sub=m.group(1) if m else ''
        if not cards:
            EXTRA.append((code,lab,vd,c[1] if len(c)>1 else '',c[2] if len(c)>2 else '')); continue
        frcol=' '.join(c[2:])
        frs=set(fr_ids(frcol,code))
        if code=='PRV' and len(c)>=4 and re.fullmatch(r'[\d, ]+',c[-1].strip()): frs|={'FR-PRV-%02d'%int(x) for x in re.findall(r'\d+',c[-1])}
        for n in cards:
            if 1<=n<=NCARDS:
                VER.setdefault((code,n),[]).append((sub,vd,c[1] if len(c)>1 else ''))
                for f in frs:
                    if f in FRS: touch[n].setdefault(f,set()).add('V')
RANK={'M':4,'P':3,'C':2,'n/a':1,'NR':0}
def worst(code,n):
    l=VER.get((code,n))
    if not l: return '-'
    return max((x[1] for x in l),key=lambda v:RANK[v])
today='20 Nov 2026'
NF=len(FILES)
cnt={}
for i in ORDER: cnt[FRS[i]['code']]=cnt.get(FRS[i]['code'],0)+1
card21=os.path.exists(CARD21)
# ---------- header
w('# Function requirements trace (forward table, reverse view per card, rulings, questions, engineering rows, design needs)')
w()
w('Status: CURRENT (generated; LOCKED rev 2 inputs) | 20 Nov 2026 | Owner: `product` (script `tools/trace-gen/gen.py`) | Replaces: none | Load when: tracing one function requirement (FR id) to cards, screens, rulings and backlog rows; grep by FR id, never load whole (over 4,000 lines).')
w()
w('Owner: `product` for Karma (CTO role, product side). Written %s (UTC). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. The people who wrote the function files are Claude roles, not licensed professionals; every legal reading in them says "counsel must confirm" and nothing here is legal advice.'%today)
w()
w('Fictional family: Asha only. ASCII only.')
w()
w('## 0. What this file is and how it was made')
w()
w('Built by a script from the %d function files in `docs/product/prd/functions/` (first wave: `support`, `marketing`, `operations`, `finance`, `data-and-measurement`, `privacy`, `legal`, `compliance`, `risk-security`; second wave: `back-office`, `messaging-and-entry-points`, `languages-and-localisation`, `reliability`, `ai-and-speech`, `research-validation`, `quality`, `lifecycle-and-platforms`, `print-and-fulfilment`; third wave: `days-library`, `notification-catalogue`, `cultural-background-data`, `photos-and-suggestions`, `feature-opportunities`; `BRIEF.md` is the brief and is not read as a function), the cards `00` to `19` (titles, row ids and the first-run screen table of card 19) and `20-founder-direction-20nov.md` (the proposed cards NS-46 to NS-50)%s, `GAP-LOG.md` (the rulings K1 to K10, R-IA-1 to R-IA-6, N-1 to N-8, CB-1 to CB-6 and DL-1 to DL-10 are read from it and marked on the items they decide), and the e2e design inventory read from `%s` (head `%s` when read; %d of 5 `DESIGN.md` files found). The script is kept in the repository at `docs/product/prd/tools/trace-gen/` (`gen.py`, `parse.py`, `model.py`, `groups.py`, `eng.py`, `calc.py`, `rulings.py`, plus `check.py`, an independent re-parse); rerun `python3 docs/product/prd/tools/trace-gen/gen.py` then `python3 docs/product/prd/tools/trace-gen/check.py` when a function file, a card or `GAP-LOG.md` changes. Every FR id, link, verdict, proposed change, question and engineering row below is read from those files; the only hand-written parts are the merge groups in `groups.py` (which proposals are the same), the conflict texts in `gen.py` (positions are quoted from the files; recommendations are Karma-side proposals, not rulings), the mapping from a GAP-LOG ruling to the items it decides (`rulings.py`), and the status derivation rule. Wording in quotes or after a handle is copied from the source file.'%(NF,(', and `21-days-cultural-photos-home.md`' if card21 else ' (`21-days-cultural-photos-home.md` is not on disk when this was built; the generator reads it when it exists)'),E2EREF,E2EHEAD,E2EFILES))
w()
w('Source states to keep in mind:')
w()
w('- The first-wave function files were written while `19-from-download-to-first-letter.md` was a draft. NS-38 to NS-45 are on disk now. First-wave verdicts "missing" or "not reviewed" for NS-41 to NS-45 mean "card not yet written when the function reviewed", not "the card has a gap"; the function owners should re-read the cards that now exist.')
w('- NS-46 to NS-50: %s The reverse view in section 2 lists the FRs that name them, from the FR Links, the requirement text and (`~c`) the card\'s own text.'%('written in `21-days-cultural-photos-home.md` (LOCKED rev 2, 20 Nov: the open items are closed in `GAP-LOG.md` "Closures 20 Nov" and `22-final-holistic-spec.md` section 7) and read by ten reviews in `tools/review/ns46-50/` and by the third-wave function files (days, notification catalogue, cultural data, photos, opportunities); the first and second wave files did not read them, so their verdicts for NS-46 to NS-50 are "not reviewed".' if card21 else 'proposed by the founder direction (`20-founder-direction-20nov.md`) and by the days, cultural-data, notification-catalogue, photos and opportunities files; no card is on disk for them.'))
w('- The Links column of an FR row is where the author names card rows, e2e ids and backlog rows (BRIEF "How each function\'s requirements get linked"). When an FR names none, this file says so and does not guess; where a screen in the FR is on the card 19 screen table, or a linked FR has a card, that card is shown as a suggestion only.')
w('- `GAP-LOG.md` rulings taken so far on function items: %d (K1 to K10 and the SEC-13 note, R-IA-1 to R-IA-6, N-1 to N-8, CB-1 to CB-6, DL-1 to DL-10). Items they decide are marked `ruled (id)` below. A ruling that only says "founder confirms" or "counsel must confirm" is marked ruled with that open step kept in the item.'%len(RULINGS))
w('- The 20 Nov addenda to the function files (photo moments, pictures and videos; cards NS-51 and NS-52 in `27-photo-moments-and-media.md`) are read for their FR rows (sections 0.1 and 1, so every FR id of the addenda has a forward row and a P0 count) and for their Design needs subsections (section 6). Their card changes, questions and engineering rows are NOT read into sections 3, 4 and 5, and section 2 has no row for NS-51 and NS-52: an FR link to those two cards is kept in the forward table only. Read the addenda in the function files for those.')
w()
w('### 0.1 Totals')
w()
w('| Function (code) | File | FR rows | P0 rows |')
w('|---|---|---|---|')
p0n={}
for i in ORDER:
    if FRS[i]['prio'].startswith('P0'): p0n[FRS[i]['code']]=p0n.get(FRS[i]['code'],0)+1
for code,f in FILES:
    codes=[c for c in cnt if FRS[[i for i in ORDER if FRS[i]['code']==c][0]]['file']==code]
    for c in codes: w('| %s (%s) | functions/%s.md | %d | %d |'%(CODEFN[c],c,f,cnt[c],p0n.get(c,0)))
w('| Total | | %d | %d |'%(len(ORDER),sum(p0n.values())))
w()
w('Policy (POL) is in the support file; risk (RSK) and security (SEC) are in the risk-security file. FR ids with a letter suffix (FR-PRT-34a, FR-LCY-33 "(proposal)") are kept as written. Photos numbers its FRs in bands (01 to 04, 10 to 25, 30 to 34, 40 to 44, 50 to 57), so FR-PHS-05 to 09 and the other gaps are not missing rows. Quality\'s file also lists 143 existing FR ids in its P0 register (section 3c) and 296 + 96 card rows; those are index lines, not FR definitions, and are not counted here (see K16).')
w()
w('### 0.2 Status column (how it is derived)')
w()
w('- `counsel`: a question to counsel (section 7 of the function file, or its counsel number) cites the FR, or the FR\'s owner lane names counsel.')
w('- `founder`: a question to the founder cites the FR, or the owner lane names the founder.')
w('- `needs Karma ruling`: a proposed card change cites the FR, or the FR names no locked card row (it is a new requirement the function adds, which Karma links or declines), and no GAP-LOG ruling decides it.')
w('- `ruled (id)`: it would need a ruling, and a GAP-LOG ruling decides it: the ruling names the FR, or every proposed card change that cites the FR is ruled. `amended` means the ruling changes what the FR says (the FR text is not edited; see 3c).')
w('- `locked row`: none of the above. It rests on a locked card row or an existing decision and needs no new ruling. (This is what the earlier version of this file called "ruled"; it does not mean Karma has ruled on the FR itself.)')
w('- Priority: the first priority in the FR\'s row, with its RR-4 reasons in brackets; `*` means the row carries more than one priority (read the source row).')
w()

# ---------- 1 forward table
def blcell(r):
    i=r['id']; out=[]
    bl=list(dict.fromkeys(re.findall(r'BL-\d+',r['links'])))
    out+=bl
    if not bl:
        t=list(dict.fromkeys(re.findall(r'BL-\d+',r['req']+' '+r['ev'])))
        out+=[b+' (text)' for b in t]
    for en in FR2ENG.get(i,[]):
        for b in en['bls']:
            if b not in [x.split(' ')[0] for x in out]: out.append(b+' (eng table)')
        if en['nr']: out.append('new row needed ('+en['nr']+')')
        elif en['key']=='preflight' and 'BL-958' not in ' '.join(out): out.append('BL-958 (eng table)')
    if re.search(r'new row needed|new row\b',r['links'],re.I) and not any('new row' in x for x in out): out.append('new row needed')
    return ', '.join(dict.fromkeys(out)) if out else 'none named'
FWD={}
for i in ORDER:
    r=FRS[i]
    cc_,ck=cardcell(r); FWD[i]=dict(card=cc_,ck=ck,e2e=e2ecell(r),bl=blcell(r),st=status(r),pr=prio(r['prio']))
w('## 1. Forward table: every FR, its function, priority, cards, e2e screens, backlog rows and status')
w()
w('Card cell: `NS-nn` with the row ids the author named; `(from text)` means the Links column names no card but the requirement text does; `NO CARD LINK` means neither does. e2e cell: ids from the Links column (with state suffix as written), `(text)` when read from the requirement text, `new screen needed` when the Links column says so. Backlog cell: BL ids from Links, `(text)` from the requirement or evidence text, `(eng table)` from the engineering section of the function file, and `new row needed (NR-nn)` where that section asks for a row (NR numbers are working handles for section 5 of this file, not backlog ids; Karma allocates BL ids, none above BL-999). Status: see 0.2.')
w()
w('| FR id | Function | Priority | Card(s) and rows | e2e screen ids | Backlog rows | Status |')
w('|---|---|---|---|---|---|---|')
for i in ORDER:
    r=FRS[i]; f=FWD[i]
    w('| %s | %s | %s | %s | %s | %s | %s |'%(i,CODEFN[r['code']],f['pr'],esc(f['card']),esc(f['e2e']),esc(f['bl']),f['st']))
w()

# ---------- 2 reverse view
w('## 2. Reverse view per card, NS-01 to NS-%d'%NCARDS)
w()
w('Verdict key: C covered, P partly, M missing, n/a not applicable to that function, NR the function did not review the card (written after, or not on disk), `-` the function file has no per-card verdict row for the card. Where a function split a card into parts (NS-06 A, B, C; NS-07 C5, C28, G11) the worst part is shown and the parts are in 2c. Functions with no per-card verdict table at all are listed under the first table.')
w()
cards_with_ver={c for c in FILEORDER if any(k[0]==c for k in VER)}
noverd=[c for c in FILEORDER if c not in cards_with_ver]
w('### 2a. Function verdicts per card')
w()
w('Card titles are read from the cards on disk (NS-46 to NS-50 are the proposed titles, no card yet).')
w()
def vtable(codes,label):
    w('**%s**'%label)
    w()
    w('| Card | '+' | '.join(CODEFN[c] if c!='SEC' else 'security and risk' for c in codes)+' | FRs touching |')
    w('|---|'+'---|'*(len(codes)+1))
    for n in range(1,NCARDS+1):
        vs=[worst(c,n) for c in codes]
        w('| NS-%02d | %s | %d |'%(n,' | '.join(vs),len(touch[n])))
    w()
vtable(FIRSTWAVE,'First wave (nine functions)')
vtable(LATER,'Second and third wave (fourteen functions)')
w('No per-card verdict table in the file (all cells `-` above): %s. Of these, back-office gives a verdict per back-office area, not per card (its section 2.3); research, photos and opportunities give a coverage check and no verdict; notifications gives a coverage check and the proposed card NS-48.'%(', '.join(CODEFN[c] for c in noverd) or 'none'))
w()
w('Totals per function over NS-01 to NS-%d (cards where a function split the card count once, at the worst part):'%NCARDS)
w()
w('| Function | C | P | M | n/a | NR | no row |')
w('|---|---|---|---|---|---|---|')
for c in FILEORDER:
    vals=[worst(c,n) for n in range(1,NCARDS+1)]
    w('| %s | %s |'%(CODEFN[c] if c!='SEC' else 'security and risk',' | '.join(str(vals.count(k)) for k in ['C','P','M','n/a','NR','-'])))
w()
w('Cards where at least one function says M (missing):')
w()
for n in range(1,NCARDS+1):
    ms=[CODEFN[c] if c!='SEC' else 'security' for c in FILEORDER if worst(c,n)=='M']
    if ms: w('- NS-%02d: %s'%(n,', '.join(ms)))
w()
w('Pack-wide verdict rows that name no card:')
w()
for code,lab,vd,raw,why in EXTRA:
    w('- %s, "%s": %s. %s'%(CODEFN[code] if code!='SEC' else 'security',esc(lab),esc(raw),esc(why)))
w()
w('### 2b. FRs that touch each card')
w()
w('Union of: the Links column (no mark), the requirement text (`~t`), the FR rows named in that function\'s own verdict row for the card (`~v`), and the FR ids the card itself names (`~c`; only card 21 names any today). FRs whose Links column names only the frame or "every card" are in 2d, not repeated here. The Card column carries the title and the file it is read from.')
w()
w('| Card | FR ids |')
w('|---|---|')
for n in range(1,NCARDS+1):
    items=[]
    for i in sorted(touch[n],key=lambda x:ORDER.index(x)):
        fl=touch[n][i]
        mk='' if 'L' in fl else ('~t' if 'T' in fl else ('~v' if 'V' in fl else ''))
        if 'L' not in fl and 'T' in fl and 'V' in fl: mk='~t~v'
        if 'C' in fl and 'L' not in fl: mk+='~c'
        items.append(i[3:]+mk)
    srcf=CARDSRC.get(n)
    if n in PROPOSED and (n not in CARDSRC): srcf='no card yet'
    if card21 and n>=46 and n not in CARDSRC: srcf='no card yet'
    w('| NS-%02d %s (%s) | %s |'%(n,esc(CARDTITLE.get(n,'')),srcf or 'no card',('; '.join(items) if items else 'none')))
w()
w('### 2c. Cards a function split into parts')
w()
for code in FILEORDER:
    for n in range(1,NCARDS+1):
        l=VER.get((code,n),[])
        if len(l)>1:
            w('- %s, NS-%02d: %s'%(CODEFN[code] if code!='SEC' else 'security',n,'; '.join('%s = %s'%(s or 'whole',v) for s,v,_ in l)))
w()
w('### 2d. FRs that name the frame or every card and no single card')
w()
w('%d FRs: %s.'%(len(packfr),', '.join(p[3:] for p in packfr)))
w()
# ---------- 3 rulings
INPUT=open(os.path.join(PRD,'inputs','first-run-compliance.md'),encoding='utf-8').read()
INROWS={}
for l in INPUT.split('\n'):
    m=re.match(r'\| (\d+) \| ',l)
    if m and len(cells(l))>=9: INROWS.setdefault(m.group(1),cells(l))
def ccbucket(x):
    card=x['card']; ns=ns_expand(card)
    if re.search(r'Frame|00-product-frame|`00`|frame',card,re.I) and not ns: return (0,0)
    if re.search(r'14-test-plan|`14`|^14 s',card): return (1,14)
    if 'README' in card: return (1,15)
    if card.startswith('BL-'): return (1,16)
    if ns: return (2,ns[0])
    return (3,0)
assigned={}
ENT=[]
for title,hs,kind in CC_GROUPS:
    ENT.append(dict(title=title,handles=hs,kind=kind))
    for h in hs: assigned[h]=1
for h,x in CC.items():
    if h not in assigned: ENT.append(dict(title=None,handles=[h],kind='single'))
for e in ENT:
    e['bucket']=min(ccbucket(CC[h]) for h in e['handles'])
ENT.sort(key=lambda e:(e['bucket'],e['handles'][0]))
H2R={}
for k,e in enumerate(ENT,1):
    e['rid']='R-%03d'%k
    for h in e['handles']: H2R[h]=e['rid']
    rl=[]
    for h in e['handles']:
        for r in RULED_CC.get(h,[]):
            if r not in rl: rl.append(r)
    e['ruled']=rl
    e['nruled']=sum(1 for h in e['handles'] if h in RULED_CC)
def clip(s,n=700): return s if len(s)<=n else s[:n].rsplit(' ',1)[0]+' [cut; see source]'
def frtxt(i,n=700):
    r=FRS[i]; return '%s (%s, %s): %s'%(i,CODEFN[r['code']],FWD[i]['pr'],clip(r['req'],n))
def qtxt(h):
    q=QS[h]; return '%s: "%s" Default: %s Owner: %s%s'%(h,q['question'],clip(q['default'],500),q['owner'],(' '+q['number']) if q['number'] else '')
def cctxt(h):
    x=CC[h]; return '%s (%s) on %s: %s Why: %s'%(h,H2R[h],x['card'],clip(x['change'],500),clip(x['why'],300))
# P0 arithmetic for K16 (computed, not typed)
p0_all=sum(p0n.values()); p0_first=sum(v for k,v in p0n.items() if k in ('SUP','POL','MKT','OPS','FIN','DAT','PRV','LEG','CMP','SEC','RSK'))
p0_later=p0_all-p0_first-p0n.get('QAL',0)
t14=open(os.path.join(PRD,'14-test-plan.md'),encoding='utf-8').read()
i14=t14.index('## 7. The P0 register'); s14=t14[i14:]; j14=s14.find('\n## ',5); s14=s14[:j14] if j14>0 else s14
REG14=0
for l in s14.split('\n'):
    if l.startswith('| ') and not l.startswith('| Card'):
        c_=cells(l)
        if len(c_)>=3: REG14+=len([x for x in c_[1].split(', ') if x])
rows19=[l for l in t19.split('\n') if re.match(r'\| NS-(3[89]|4[0-5])-R\d+[a-z]? \|',l)]
P0_19=sum(1 for l in rows19 if re.search(r'\| P0\b',l))
quality_claim=296+96+1+143+16
AMBIG=[i for i in ORDER if 'P0' in FRS[i]['prio'] and not FRS[i]['prio'].startswith('P0')]
AMENDED_CC={'DAY C2':'CB-2 amends this proposal: a chosen day is a separate `libraryDay` source that feeds the same slot and budget, not a `typedDay` (card 21 reads it as a ranked source inside the typedDay group and asks Karma to confirm, its item 8)',
 'DAY C5':'CB-5 and DL-10 amend this proposal: a library day\'s name has its own switch, separate from `notifications.lockScreenNames` (N-3 stands for public days)'}
CONFL=[]
def C(cid,title,positions,rec,related=(),ruled=(),partial=False):
    CONFL.append(dict(id=cid,title=title,pos=positions,rec=rec,rel=list(related),ruled=list(ruled),partial=partial))
inrow=lambda k:'`inputs/first-run-compliance.md` row %s, "%s": class %s'%(k,INROWS[k][1],INROWS[k][5]) if k in INROWS else ''
C('K1','Class of the child\'s name, birthday, due date, letter languages and first letter (privacy: L4; compliance input: L3 or L2)',
  [('privacy',cctxt('PRV C21')),('privacy',cctxt('PRV C22')),('privacy',frtxt('FR-PRV-24')),
   ('compliance input (the compliance function file indexes it and does not restate the classes)',inrow('13')+'.'),('compliance input',inrow('14')+'.'),('compliance input',inrow('16')+'.'),('compliance input',inrow('18')+'.')],
  '',['PRV C21','PRV C22'],['K1'])
C('K2','The Home Plus line wording (design change versus the marketing and Terms 8.2 rule)',
  [('design, `docs/design/e2e/E-foundations-and-system-states/WORDS.md` line 342 (read earlier)','Built line: "Adding new letters to the book needs Plus. Recording, reading and export are always free." CHANGE proposed by design: "Adding new letters to the book needs Plus. Recording, reading and export stay free."'),
   ('finance','Endorses the design change from "always free" to "stay free" (finance section 4, E-S26; BL-965 carries `plusLine` "stay free"; finance question Q40 default "stay free", never "always free").'),
   ('marketing',frtxt('FR-MKT-04')),('marketing',frtxt('FR-MKT-22')),
   ('design, WORDS line 264 (the pinned membership line)','"Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free."')],
  '',[],['K2'])
C('K3','First-time downloads before the allowance rule may fire (500 or 1,000)',
  [('data (the only function file that takes a position)',qtxt('DAT FQ-02')),('data',cctxt('DAT C-11'))],'',['DAT C-11'],['K3'])
C('K4','What the deletion texts say (legal versus the card row versus privacy)',
  [('card, NS-01-R31 (read in `01-photo-with-a-letter.md`)','Given photos on in any build, the account-deletion text (`packages/content/src/pages.en.ts:240`) no longer says pictures are removed from places the server cannot reach, and says pictures on a phone go when that phone is erased. P0 (b); one content test.'),
   ('legal',cctxt('LEG C-3')),('legal',frtxt('FR-LEG-02')),('privacy',frtxt('FR-PRV-18')),
   ('support',frtxt('FR-SUP-14')),('operations',qtxt('OPS Q7')),('privacy',qtxt('PRV PQ-10'))],'',['LEG C-3','PRV C23'],['K4'])
C('K5','The Texas and California age signal: store nothing (compliance) versus record an enum (privacy)',
  [('compliance',frtxt('FR-CMP-15')),('compliance',qtxt('CMP C-2')),('compliance',qtxt('CMP C-3')),('privacy',frtxt('FR-PRV-25')),('support',qtxt('SUP Q-SUP-13'))],'',[],['K5'])
C('K6','Is the age-rating questionnaire re-answered for NS-05 Level 1 (compliance: yes; marketing: no change)',
  [('compliance',frtxt('FR-CMP-19')),('compliance',cctxt('CMP K-5')),('marketing',frtxt('FR-MKT-17')),('marketing',qtxt('MKT MQ-8')),('support',qtxt('SUP Q-SUP-7'))],'',['MKT C08','CMP K-5'],['K6'])
C('K7','Names of the store-build gates (G0 to G6 used for two different lists)',
  [('operations',cctxt('OPS C12')),('compliance',cctxt('CMP K-3')),('compliance',frtxt('FR-CMP-11'))],'',['OPS C12','CMP K-3'],['K7'])
C('K8','Thresholds for moving to paid vendor tiers (finance versus operations)',
  [('finance',qtxt('FIN F1')),('operations',qtxt('OPS Q1')),('finance',qtxt('FIN F7')),('operations',qtxt('OPS Q2')),('finance',qtxt('FIN F6')),('operations',qtxt('OPS Q3'))],'',['FIN C01','OPS C13'],['K8'])
C('K9','Screen ids proposed by functions that collide with the e2e design',
  [('support (section 4)','Proposes new screens E-S27 and E-S28 for "If you are struggling" and "Lines in other countries" (support says no e2e area gave them ids).'),
   ('design, E `DESIGN.md` section 5','E-S27 is "App Store page and install" and E-S28 is "Permission asks map" in the design read earlier (highest E screen id is E-S29), so both ids are taken.'),
   ('privacy','Proposes C-S23 for "Privacy in Me" and C-S23.withdraw. Highest C screen id in the design is C-S22, so C-S23 is free.'),
   ('operations','Proposes E-ST47 for "Server restored". Highest E state id in the design is E-ST46, so it is free.')],'',[],['K9'])
C('K10','Country count at sign-up: weekly aggregate (data) versus daily count kept 2 years (privacy)',
  [('data',frtxt('FR-DAT-35')),('privacy',frtxt('FR-PRV-26')),('data',qtxt('DAT FQ-09')),('privacy',qtxt('PRV PQ-7'))],'',['DAT C-13'],['K10'])
# ---- new overlaps from the second and third wave (open unless a ruling id is listed)
C('K11','Reminders and the notification catalogue versus reliability (what re-plans a schedule, and what a wrong clock does to the recency axis)',
  [('notifications',frtxt('FR-NTC-02')),('notifications',frtxt('FR-NTC-03')),
   ('GAP-LOG N-6','"the axis is days between the fire date and the newest made letter, not hours (every input must be known at plan time, iOS schedules up to 35 days ahead). Depends on NS-13\'s anchor and back-off, not yet built." (rules the axis, not what triggers a re-plan)'),
   ('reliability',frtxt('FR-REL-59')),('reliability',frtxt('FR-REL-56')),('reliability',frtxt('FR-REL-54')),
   ('messaging',frtxt('FR-MSG-21'))],
  'The catalogue does not say what re-plans it; reliability and messaging do (restore, time zone change), and a wrong clock or a changed letter day moves the anchor the recency axis reads. Recommend one rule in NS-13 and NS-32 (Karma rules): the plan is rebuilt on first launch after a restore, on a time zone change and on a clock change; the anchor is the newest made letter\'s stored local day (the day the parent can change with "another day"), never a delivery-time clock read, clamped so it is never after the plan date; and a rebuild on the same inputs gives the same set of (id, date, time, class), which is FR-NTC-02 applied to a rebuild. Add that as a test row to NS-48. N-6 stands.',
  [],['N-6'],True)
C('K12','Languages versus the days library (calendar pin and English-only names versus lunar and lunisolar days and a "which calendar" question)',
  [('languages',frtxt('FR-LOC-11')),('languages',frtxt('FR-LOC-12')),('languages',frtxt('FR-LOC-13')),('languages',frtxt('FR-LOC-02')),
   ('days',frtxt('FR-DAY-06')),('days',frtxt('FR-DAY-19')),
   ('GAP-LOG DL-3, DL-4, DL-9','DL-3: one row per authority and the parent picks or moves the date. DL-4: rule-based dates computed on the phone, astronomical days stored as a UTC instant. DL-9: Lunar New Year, Mid-Autumn and Norooz offered as culture-led days. (Rules the data and the computation; does not touch the display pin.)')],
  'Compatible if scoped: FR-LOC-11 and FR-LOC-12 govern what the parent sees and the age arithmetic (Gregorian, Western digits, no card converts a birthday to another calendar). The days module may use non-Gregorian arithmetic inside to find a date, but every date it shows is Gregorian in Western digits, and the question "Which calendar does your family follow?" (FR-DAY-06) is about which authority, so its words should say "which list" and not promise a calendar conversion. FR-LOC-11\'s test over `en-u-ca-*` locale tags must be scoped to display so it does not forbid the days module. English names (FR-DAY-19) are consistent with English-only at 1.0 (FR-LOC-02, FR-LOC-13); a day name in a script the build does not hear is the family\'s own words when they type it. Karma rules; DL-3, DL-4 stand.',
  [],['DL-3','DL-4'],True)
C('K13','Photos versus privacy (the suggestion title and date, the new transient copy and the erase scan, and the label line)',
  [('photos',frtxt('FR-PHS-14')),('photos',frtxt('FR-PHS-50')),('photos',frtxt('FR-PHS-33')),('photos',frtxt('FR-PHS-54')),
   ('privacy',frtxt('FR-PRV-34')),('privacy',frtxt('FR-PRV-30')),('privacy',frtxt('FR-PRV-06'))],
  'Two gaps and one tension. (1) FR-PHS-50 classes the in-memory title and date "L3 if it names a place or event" while the privacy registry gives each field one class (FR-PRV-07; the privacy lead rules a class, as K1 did); until privacy rules, treat both as L4 because a title can name a place and becomes the parent\'s photo words if kept. (2) FR-PHS-12 puts the Apple-provided copy in `Caches` and deletes it once read, but FR-PRV-34\'s Erase scan lists `Caches/ImagePicker` and `Caches/ScribePhoto` only: add the suggestion folder to the scan and to the log canary of FR-PRV-10 (FR-PHS-51). (3) FR-PHS-54 says the label effect is "no change" for level 2 and FR-PRV-30 answers "Photos or Videos No while NS-01-R15, R26 and R61 hold": both rest on "only the chosen picture reaches the app"; privacy re-runs the label per build and records it, and counsel reads FR-PHS-56. Karma rules; the founder is not needed.',
  [],[])
C('K14','Print versus finance and legal (who sells, tax, margin figures, Print Terms)',
  [('print',frtxt('FR-PRT-21')),('print',frtxt('FR-PRT-22')),('print',frtxt('FR-PRT-23')),('print',frtxt('FR-PRT-46')),('print',frtxt('FR-PRT-19')),
   ('finance',frtxt('FR-FIN-24')),('finance',qtxt('FIN F13')),('legal',frtxt('FR-LEG-12'))],
  'Three differences. (a) Timing: print wants the accountant settled before the first order (FR-PRT-21), finance before the first payout (F13, CR-120); take the earlier (before the first order) and tell finance. (b) Numbers: print\'s margin floor (35% [A]) and card fee (2.9% plus $0.30) are its own arithmetic and say "check against finance.md"; finance\'s run-cost register has no print row. Finance owns the register: when a partner quote exists it adds the print rows and the margin check; print does not publish a price before then (FR-PRT-23). (c) Terms: print says Print Terms and Terms 5.6 on print shops are needed before the flag (FR-PRT-46) while the free file ships in 1.0; legal\'s FR-LEG-12 covers the font allowlist only. Recommend legal drafts a one-line Terms note for the free file now and the Print Terms only when FR-PRT-34 is true. Nothing here ships in 1.0 (FR-PRT-01). Karma rules; the seller question (Q-PRT-2) is the founder\'s.',
  [],[])
C('K15','Lifecycle versus back-office on deletion, claim and hand acts',
  [('lifecycle',frtxt('FR-LCY-11')),('lifecycle',frtxt('FR-LCY-19')),('lifecycle',frtxt('FR-LCY-27')),('lifecycle',qtxt('LCY LQ-9')),
   ('back-office',frtxt('FR-BKO-07')),('back-office',frtxt('FR-BKO-26')),('back-office',frtxt('FR-BKO-27')),('back-office',qtxt('BKO Q-BKO-1'))],
  'Three points. (1) A parent who cannot act: lifecycle plans a runbook for who may receive one export of a sole parent\'s book (FR-LCY-27, LQ-9), back-office\'s rule is that nothing is changed or moved by hand and support never reads letters (FR-BKO-07, FR-BKO-02). These agree only if the export is made by the account holder\'s own phone or by a counsel-read process that hands over the Save a copy file the person already holds; recommend FR-LCY-27 says so and that no staff tool exports a book. (2) States: a deleted-elsewhere phone (FR-LCY-19, one line in Me) and a suspended account (FR-BKO-26, one neutral line) must not share words; ask `content` and area E for two lines and two states. (3) Claim after deletion (FR-LCY-11: the new account claims the phone\'s letters after the masked-email tap) is parent-driven and does not conflict with "no hand merge" (Q-BKO-1), provided the claim is never done by staff; say so in FR-LCY-11. A back-office deletion opened for someone (FR-BKO-27) sends the content-free email; the 30-day window in FR-LCY-19 applies to both. Counsel must confirm the death runbook; Karma rules the rest.',
  [],[])
C('K16','Quality\'s 552 P0 rows versus the test plan register (and the P0 rows the later files add)',
  [('quality, section 3d','Register in 14 section 7 (cards 01 to 12) 296; card 19 96; errata row 1; function review rows 143; QAL rows 16; "Total P0 rows named by the pack 296 + 96 + 1 + 143 + 16 = 552". "Not 552 distinct tests."'),
   ('quality, FR-QAL-01 and FR-QAL-02','14 section 7 regenerated with three tables plus the errata row, and `scripts/trace.mjs` reading `docs/product/prd` including `functions/*.md`.'),
   ('test plan, `14-test-plan.md` section 7','"Rebuilt 20 Nov 2026 ... 296 P0 rows" for cards 01 to 12 only (this script counted %d ids in the register).'%REG14),
   ('this script, recount','Card 19 P0 rows: %d of %d (quality: 96 of 123, matches). P0 FR rows now: %d across the %d files (first-wave files %d, QAL %d, the other thirteen later files %d). Quality counted 143 from the nine first-wave files and 16 for itself, so its 552 omits the later files\' %d P0 FR rows.'%(P0_19,len(rows19),p0_all,NF,p0_first,p0n.get('QAL',0),p0_later,p0_later))],
  'Quality\'s arithmetic reconciles with the register and card 19 and is right for the pack as it stood when quality wrote it; it is now stale. The new total of P0 ids the pack names is 296 + %d + 1 + %d (every P0 FR row in the %d files, QAL included) = %d, and it is a list of ids, not of tests (quality says so). Recommend `qa` regenerates 14 section 7 with all %d function files (FR-QAL-01 already asks for the extended script), prints the total, and does not publish 552. Quality\'s 143 for the nine first-wave files is exact (this script counts %d rows whose priority cell starts "P0"). %d rows (first-wave and later) have a priority cell that mentions P0 without starting with it (%s); the script does not count them as P0, and their owners should settle one priority before the register is regenerated.'%(P0_19,p0_all,NF,296+P0_19+1+p0_all,NF,p0_first,len(AMBIG),', '.join(a[3:] for a in AMBIG) or 'none'),
  [],[])
C('K17','Two proposals for the same row id NS-17-R11',
  [('languages',cctxt('LOC CC-LOC-7')),('ai-and-speech',cctxt('AIS C03'))],
  'The two rows are different (LOC-7: no claim that a letter in another language is noticed for distress until FR-LOC-18(a) holds; AIS C03: a compact-tier phone does not offer a language that passed only on the full tier). Both are P0 (a). Keep both, number them NS-17-R11 and NS-17-R12 in the order Karma rules them, and update the FR links (FR-LOC-18, FR-AIS rows) after the cards are edited.',
  ['LOC CC-LOC-7','AIS C03'],[])
C('K18','Days library versus cultural data: is a chosen day a typedDay or a separate source (and does NS-18 change)',
  [('days',frtxt('FR-DAY-03')),('days',cctxt('DAY C1')),('days',cctxt('DAY C2')),('cultural-data',cctxt('CUL C01')),('cultural-data',cctxt('CUL C02')),('cultural-data',qtxt('CUL CUL-Q12'))],
  '',['DAY C1','CUL C01','DAY C2','CUL C02'],['CB-2','N-2'])
C('K19','Days library versus cultural data: one names switch or a separate switch for a day\'s name on the lock screen',
  [('days',frtxt('FR-DAY-09')),('days',cctxt('DAY C5')),('cultural-data',cctxt('CUL C03')),('cultural-data',qtxt('CUL CUL-Q9')),('notifications',frtxt('FR-NTC-09')),('notifications',qtxt('NTC Q-NTC-2'))],
  '',['DAY C5','CUL C03'],['CB-5','N-3','DL-10'])
C('K20','Variants per day, per season and per grid cell (notification catalogue versus days library)',
  [('notifications',qtxt('NTC Q-NTC-1')),('days',qtxt('DAY Q-DAY-7')),('days',cctxt('DAY C8'))],
  '',['DAY C8'],['N-1','DL-5'])
C('K21','Exclamation marks in notifications: VOICE.md line 70 versus line 160 and the checker',
  [('notifications','VOICE.md:70 says "At most one exclamation mark per month across all notifications." VOICE.md:160 says exclamation marks are budgeted per surface, three in all, "none in notifications". The checker enforces none (notification-catalogue 12.1).'),('notifications',qtxt('NTC Q-NTC-7'))],
  '',[],['N-5'])
def c21(n):
    return CARD21ITEMS.get(n)
for c in CONFL:
    if c['id']=='K18' and c21(8):
        c['pos'].append(('card 21 (NS-46 to NS-50), "Conflicts and open items" item 8',clip(c21(8),900)))
    if c['id']=='K19':
        for n in (1,2,3):
            if c21(n): c['pos'].append(('card 21 (NS-46 to NS-50), "Conflicts and open items" item %d'%n,clip(c21(n),900)))
CONFL_REL={}
for c in CONFL:
    for h in c['rel']: CONFL_REL.setdefault(h,[]).append(c['id'])
w('## 3. Needs a ruling: proposed card changes, deduplicated, and conflicts between functions')
w()
w('Karma rules each in `GAP-LOG.md` like a design gap (ruling kinds CARD, DEFAULT, FOUNDER, ENG, NONE). Counts: %d proposed card changes in the %d files (%s); after merging overlapping ones there are %d rulings to make (R-001 to R-%03d), of which %d merge two or more proposals. %d of the %d are already ruled in `GAP-LOG.md` and marked `ruled (id)`; %d are partly ruled (some of the merged proposals are).'%(len(CC),NF,', '.join('%s %d'%(CODEFN[c] if c!='SEC' else 'security and risk',sum(1 for x in CC.values() if x['code']==c)) for c in FILEORDER),len(ENT),len(ENT),sum(1 for e in ENT if len(e['handles'])>1),sum(1 for e in ENT if e['nruled']==len(e['handles'])),len(ENT),sum(1 for e in ENT if 0<e['nruled']<len(e['handles']))))
w()
w('Cards NS-43 to NS-45 are on disk now, so proposals marked "(when written)" in the first-wave files should be applied to the written rows, not to a future card. Proposals for NS-46 to NS-50 (days, cultural background, catalogue, picture-first and suggestions, the Home slip) target cards that are proposed and not on disk; they are ruled together with the card outlines in the days, cultural-data, notification-catalogue, photos and opportunities files.')
w()
w('### 3a. Conflicts between functions (both positions shown; ruled ones carry the GAP-LOG text)')
w()
nconf=len(CONFL); nfull=sum(1 for c in CONFL if c['ruled'] and not c['partial']); npart=sum(1 for c in CONFL if c['partial'])
w('%d conflicts: K1 to K10 were in the earlier version of this file and are ruled in `GAP-LOG.md` ("Function conflict rulings K1 to K10"); K11 to K17 are new overlaps from the second and third wave functions (K11 and K12 are partly ruled by GAP-LOG rulings on the data side, K13 to K17 are open); K18 to K21 are overlaps between the third wave files that GAP-LOG already rules (CB-2, CB-5, DL-5, N-1, N-3, N-5, N-2, DL-10).'%nconf)
w()
for c in CONFL:
    ru=c['ruled']
    tag=(' [RULED %s]'%', '.join(ru)) if ru and not c['partial'] else ((' [PARTLY RULED: %s; the open part is the recommendation below]'%', '.join(ru)) if ru else ' [OPEN]')
    w('**%s%s%s**'%(c['id'].replace('K','K',1)+'. ',c['title'],tag))
    w()
    for who,txt in c['pos']: w('- %s: %s'%(who,esc(txt)))
    if ru:
        for r in ru:
            rid=r
            if rid in RULINGS: w('- Ruled %s (GAP-LOG): %s'%(rid,esc(RULINGS[rid]['text'])))
    if c['rec']: w('- Recommendation (not a ruling): %s'%esc(c['rec']))
    rel=[H2R[h] for h in c['rel'] if h in H2R]
    if rel: w('- Merged rulings: %s'%', '.join(sorted(set(rel))))
    w()
w('### 3b. Proposed card changes, merged (one ruling each)')
w()
w('Ordered frame first, then the test plan and README, then cards by number. "Handles" are `<function code> <id in that file>`; `Overlap` says whether merged proposals add to each other (complementary) or differ and need one answer (differs). FRs cited by the proposals are listed so a ruling can be traced back to section 1. `Ruled` marks a proposal a GAP-LOG ruling already decides, with the ruling id.')
w()
for e in ENT:
    hs=e['handles']
    frs=sorted(set(f for h in hs for f in CC[h]['frs']),key=lambda x:ORDER.index(x) if x in ORDER else 9999)
    files=sorted(set(CC[h]['code'] for h in hs),key=lambda c:FILEORDER.index(c))
    rtag=''
    if e['ruled']:
        rtag=' [RULED %s]'%', '.join(e['ruled']) if e['nruled']==len(hs) else ' [PARTLY RULED %s: %s]'%(', '.join(e['ruled']),', '.join(h for h in hs if h in RULED_CC))
    if len(hs)==1:
        x=CC[hs[0]]
        w('**%s**%s (%s). Target: %s'%(e['rid'],rtag,CODEFN[x['code']] if x['code']!='SEC' else 'security and risk',esc(x['card'])))
        w()
        w('- Change: %s'%esc(x['change']))
        w('- Why: %s'%esc(x['why']))
        w('- Handle: %s (`%s`). FRs: %s'%(hs[0],src(x['code']),', '.join(f[3:] for f in frs) or 'none cited'))
    else:
        w('**%s**%s %s. Overlap: %s. Proposed by %d files: %s'%(e['rid'],rtag,esc(e['title']),e['kind'],len(files),', '.join(CODEFN[c] if c!='SEC' else 'security' for c in files)))
        w()
        for h in hs:
            x=CC[h]
            w('- %s on %s: %s Why: %s'%(h,esc(x['card']),esc(x['change']),esc(x['why'])))
        w('- FRs: %s'%(', '.join(f[3:] for f in frs) or 'none cited'))
    for r in e['ruled']:
        if r in RULINGS: w('- Ruled %s (GAP-LOG): %s'%(r,esc(RULINGS[r]['text'])))
    cf=sorted(set(k for h in hs for k in CONFL_REL.get(h,[])))
    if cf: w('- Conflict: see %s in 3a'%', '.join(cf))
    for h in hs:
        if h in AMENDED_CC: w('- Note on %s: %s.'%(h,AMENDED_CC[h]))
    w()
w('### 3c. FRs whose text a ruling amends')
w()
for f,why in AMENDED.items(): w('- %s: %s. The FR text in the function file is not edited; the owner updates it in the next pass.'%(f,why))
w()
w('### 3d. Open items card 21 raises for Karma (NS-46 to NS-50)')
w()
if CARD21ITEMS:
    xref={1:'K19',2:'K19',3:'K19 (words)',4:'K18',5:'K11 (Home slip versus typed-day line is not a function overlap; ruled by Karma on card 21)',6:'K11',7:'no function conflict (design and test T3 decide)',8:'K18'}
    w('`21-days-cultural-photos-home.md` ends with %d items it does not resolve. They are between rulings and cards, not between functions, so only the cross-reference to the conflicts above is added here; the text is the card\'s.'%len(CARD21ITEMS))
    w()
    for n,tx in sorted(CARD21ITEMS.items()):
        w('- Item %d (%s): %s'%(n,xref.get(n,'-'),esc(clip(tx,420))))
else:
    w('`21-days-cultural-photos-home.md` is not on disk when this file was built.')
w()
# ---------- 4 questions
QENT=[]
done=set()
for title,hs in Q_GROUPS:
    QENT.append(dict(title=title,handles=hs)); done|=set(hs)
for h in QORDER:
    if h not in done: QENT.append(dict(title=None,handles=[h]))
for e in QENT:
    qs=[QS[h] for h in e['handles']]
    e['kind']='counsel' if any('counsel' in q['kind'] for q in qs) else 'founder'
    e['nums']=sorted(set(n for q in qs for n in q['nums']),key=lambda x:int(x[1:]))
    e['owners']='; '.join(dict.fromkeys(q['owner'] for q in qs))
    e['dues']=[x for x in (stated_due(h) for h in e['handles']) if x]
    e['frs']=sorted(set(f for q in qs for f in q['frs']),key=lambda x:ORDER.index(x) if x in ORDER else 9999)
    rl=[]
    for h in e['handles']:
        for r in RULED_Q.get(h,[]):
            if r not in rl: rl.append(r)
    e['ruled']=rl; e['nruled']=sum(1 for h in e['handles'] if h in RULED_Q)
    cards=sorted(set(n for q in qs for n in ns_expand(q['question']+' '+q['default'])))
    e['cards']=cards
def proposed_due(e):
    if e['kind']=='counsel': return 'proposed, not stated by any function: before G2 (counsel reads) of the store candidate whose flag the answer gates; until then the default holds'
    return 'proposed, not stated by any function: before the build or text it gates starts (G3 for words); until then the default holds'
w('## 4. Founder and counsel question index')
w()
w('Every question in the question section of the %d function files (first-wave section 7, risk-security section 10; the later files number their sections differently and are found by heading). %d questions read; after merging the same question asked by more than one function there are %d entries (QI-01 onward): counsel first, then founder. Defaults are copied per source; where two sources give different defaults both are shown. Owner is as the source states it; a file with no owner column (finance, data, notifications, quality, photos, research, languages, opportunities) is read from the question (a "Counsel:" or "Founder:" prefix) and marked "not stated (read as founder)" otherwise. Counsel numbers are packet 1.5.0 as the files cite them; "needs a number from legal" is shown as written. **Due dates:** no function file states a calendar date for most questions and the roadmap of record has no dated gate list for them, so a due date is given only where the source row states one ("stated"); every other entry carries a proposed due rule tied to the gate it blocks, labelled "proposed" so it is not read as a source date. Ruled entries carry the GAP-LOG ruling id.'%(NF,len(QS),len(QENT)))
w()
w('One row of the photos file ("Existing numbers", Q43 Q45 Q48 Q54 "unchanged") is a note, not a question, and is not counted.')
w()
k=0
for grp in ('counsel','founder'):
    w('### 4.%d %s questions'%(1 if grp=='counsel' else 2,'Counsel' if grp=='counsel' else 'Founder (and other owner)'))
    w()
    for e in [x for x in QENT if x['kind']==grp]:
        k+=1; e['qi']='QI-%02d'%k
        first=QS[e['handles'][0]]
        rt=''
        if e['ruled']: rt=' [RULED %s]'%', '.join(e['ruled']) if e['nruled']==len(e['handles']) else ' [PARTLY RULED %s: %s]'%(', '.join(e['ruled']),', '.join(h for h in e['handles'] if h in RULED_Q))
        w('**%s**%s %s'%(e['qi'],rt,esc(e['title'] or first['question'])))
        w()
        w('- Owner as stated: %s. %sDue: %s.'%(esc(e['owners']),('Counsel numbers: %s. '%(', '.join(e['nums']) or 'none cited (a source may say "needs a number from legal")')) if grp=='counsel' else (('Counsel numbers cited: %s. '%', '.join(e['nums'])) if e['nums'] else ''),'; '.join(e['dues']) or proposed_due(e)))
        for h in e['handles']:
            q=QS[h]
            w('- %s (`%s`): %s Default: %s%s'%(h,src(q['code']),esc(q['question']),esc(q['default']),(' Number: '+esc(q['number'])) if q['number'] and q['number'].lower()!='none' else ''))
        for r in e['ruled']:
            if r in RULINGS: w('- Ruled %s (GAP-LOG): %s'%(r,esc(RULINGS[r]['text'])))
        if e['frs']: w('- FRs cited: %s'%', '.join(f[3:] for f in e['frs']))
        w()
nstated=sum(1 for e in QENT if e['dues'])
nrq=sum(1 for e in QENT if e['ruled'] and e['nruled']==len(e['handles']))
nrp=sum(1 for e in QENT if e['ruled'] and e['nruled']<len(e['handles']))
w('### 4.3 Summary')
w()
w('| | Entries |')
w('|---|---|')
w('| Counsel entries | %d |'%sum(1 for e in QENT if e['kind']=='counsel'))
w('| Founder and other-owner entries | %d |'%sum(1 for e in QENT if e['kind']=='founder'))
w('| With a due date stated in a source | %d |'%nstated)
w('| With a proposed due rule only | %d |'%(len(QENT)-nstated))
w('| Ruled in GAP-LOG (every merged question) | %d |'%nrq)
w('| Partly ruled | %d |'%nrp)
w('| Open | %d |'%(len(QENT)-nrq-nrp))
w()
# ---------- 5 engineering
w('## 5. Engineering rows needed')
w()
w('From the engineering section of each function file (section 6 of the first-wave files, section 9 of risk-security, found by heading in the others; days and notifications keep theirs in sections 11 and 8 and 12.3). %d source rows merge into %d entries. New rows carry a working handle NR-nn; the backlog id is Karma\'s to allocate, and none may be above BL-999 (the dispatcher reads only three-digit ids; privacy and the dispatcher note under BL-999 say so). Sizes are given only where the source gave them; splitting into PRs a reviewer can read in ten minutes is for the engineering thread. A later-wave row is classed "new" unless it starts with a BL id, says "change" beside a BL id, or sits in a BL column.'%(len(ENG),len(ENTRIES)))
w()
w('Data\'s section 6.2 (candidate analytics events) is not an engineering row: none is in the catalogue and adding any is a founder decision while analytics is off (FR-DAT-26), so it is not listed here. Several later files also list sections that are not rows (BKO "Runbook cards that need writing" section 6 is covered by its row "report-a-concern.md ..."; REL and QAL tables of limits and fixtures are inputs to rows). Rows from the photos file that read "Planner change for NS-32: none" and from lifecycle "No row from this file for server migrations" are kept as notes in 5.3.')
w()
def entry_block(en):
    lines=[]
    for r in en['rows']:
        lines.append('%s: %s'%(CODEFN[r['file']] if r['file']!='SEC' else 'security',esc((r['label']+' | '+r['text'])[:2000]) if r['label'] not in en['title'] else esc(r['text'])))
    return lines
w('### 5.1 New rows needed')
w()
w('| Handle | Row | Asked by | Owner as stated | FRs | Existing rows named alongside |')
w('|---|---|---|---|---|---|')
for k in ordkeys:
    en=ENTRIES[k]
    if en['kind']!='new' or k=='preflight': continue
    owners='; '.join(dict.fromkeys(esc(r['owner']) for r in en['rows'] if r['owner'] and r['owner']!='see label'))
    w('| %s (new row needed) | %s | %s | %s | %s | %s |'%(en['nr'],esc(en['title']),', '.join(CODEFN[c] if c!='SEC' else 'security' for c in en['files']),owners or 'see source',', '.join(f[3:] for f in en['frs']) or 'none cited',', '.join(en['bls']) or '-'))
w()
w('Merged duplicates (same row asked by more than one function): '+'; '.join('%s = %s'%(ENTRIES[k]['nr'],', '.join('%s %s'%(CODEFN[r['file']] if r['file']!='SEC' else 'security',r['label'] if len(r['label'])<50 else r['label'][:50]) for r in ENTRIES[k]['rows'])) for k in ordkeys if ENTRIES[k]['kind']=='new' and len(ENTRIES[k]['rows'])>1 and k!='preflight')+'.')
w()
w('### 5.2 Existing backlog rows to change')
w()
w('| BL row | Status in BACKLOG.md | What each function asks to add or change | FRs |')
w('|---|---|---|---|')
for k in ordkeys:
    en=ENTRIES[k]
    if en['kind'] not in ('bl',) and k!='preflight': continue
    bls=en['bls'] or ['BL-958']
    st=', '.join('%s %s'%(b,BLSTATUS.get(b,'(listed in an older format, or not in BACKLOG.md; see it)')) for b in bls)
    ch='; '.join('%s: %s'%(CODEFN[r['file']] if r['file']!='SEC' else 'security',esc((r['text'] or r['label'])[:1200])) for r in en['rows'])
    if k=='preflight': ch=ch+' (the PRV row asks for a new preflight SDK guard, so this entry is existing BL-958 plus new scope)'
    w('| %s | %s | %s | %s |'%(', '.join(bls),esc(st),ch,', '.join(f[3:] for f in en['frs']) or '-'))
w()
w('### 5.3 Changes to other existing items (PRs, ADRs, docs) and notes')
w()
w('| Item | Asked by | What |')
w('|---|---|---|')
for k in ordkeys:
    en=ENTRIES[k]
    if en['kind']!='other': continue
    for r in en['rows']:
        w('| %s | %s | %s |'%(esc(r['label']),CODEFN[r['file']] if r['file']!='SEC' else 'security',esc(r['text'])))
w()
w('Related pairs to keep together when the rows are written: BL-485 (privacy) and the compliance withdrawal control are the same control; BL-577 (privacy) and the legal consent-record row are the same record writer; the BL-961 change (privacy, security and cultural-data, which adds its store to the `[X4-R1]` enumeration) must list the four split test ids from the security proposal CC-2 ('+H2R['SEC CC-2']+' in 3b).')
w()
allbl=sorted(set(int(b[3:]) for code,_ in FILES for b in re.findall(r'BL-\d+',D[code]['text'])))
over=[b for b in allbl if b>999]
bad999=[b for b in set(x for code,_ in FILES for x in re.findall(r'\bBL-\d{4,}',D[code]['text']))]
# ---------- 6 design needs per area
w('## 6. Design: function needs per e2e area, for the design leads')
w()
w('Each area lead records these as "Function needs accounted for" with the FR id (BRIEF step 5). 6.x.1 is every design-needs row the functions filed (design-needs section of their files, read by heading) whose screen id is in that area; 6.x.2 is the FRs whose Links column names a screen of the area but that no function filed a design-needs row for (the design response is then the FR requirement itself; read it in section 1). Screen ids are as written by the function; ids are checked against the five `DESIGN.md` files (section 7). A row naming screens in two areas appears in both. The design response is copied from the function row; it is a request, not a ruling. Rows that carry no screen id are in 6.F.')
w()
AREA_ROWS={a:[] for a in 'ABCDE'}
CROSS=[]
def design_row(code,h,c):
    if code in FIRST:
        if h[0].startswith('Code'):
            return dict(code=code,where='Error code: '+c[0],need=('Parent line: '+c[1]+' | what support needs: '+c[2]) if len(c)>2 else c[1],frs=[],letters=['E'],new=False)
        col0=c[0]; need=c[1] if len(c)>1 else ''
        if len(c)>2 and not fr_ids(c[2],code) and c[2].strip(): need=need+' (for: '+c[2]+')'
        frs=sorted(set(fr_ids(' '.join(c),code)),key=lambda x:ORDER.index(x) if x in ORDER else 9999)
        letters=[]
        for s_ in screens(col0):
            if s_[0] not in letters: letters.append(s_[0])
        if not letters:
            for s_ in screens(c[1] if len(c)>1 else ''):
                if s_[0] not in letters: letters.append(s_[0])
        if re.search(r'E design section 9|E-S23',col0) and not letters: letters=['E']
        new=bool(re.search(r'new screen|new state|new sheet|New artefact|Web:',col0+' '+need,re.I))
        return dict(code=code,where=col0,need=need,frs=frs,letters=letters,new=new)
    if h==['bullet']:
        t=c[0]; return dict(code=code,where='(no screen named)' if not screens(t) else ', '.join(screens(t)[:4]),need=t,frs=sorted(set(fr_ids(t,code)),key=lambda x:ORDER.index(x) if x in ORDER else 9999),letters=list(dict.fromkeys(s_[0] for s_ in screens(t))),new=bool(re.search(r'new screen|new state|new sheet',t,re.I)))
    wi=0
    for i_,x in enumerate(h):
        if re.search(r'^(Screen|Where|Keyed|Key$)',x,re.I): wi=i_; break
    where=c[wi] if wi<len(c) else ''
    rest=[x for i_,x in enumerate(c) if i_!=wi]
    need=' | '.join(rest)
    ai=next((i_ for i_,x in enumerate(h) if x=='Area'),None)
    letters=[]
    for s_ in screens(where):
        if s_[0] not in letters: letters.append(s_[0])
    if not letters:
        for s_ in screens(need):
            if s_[0] not in letters: letters.append(s_[0])
    if not letters and ai is not None and ai<len(c):
        for x in re.findall(r'\b([A-E])\b',c[ai]):
            if x not in letters: letters.append(x)
    frs=sorted(set(fr_ids(' '.join(c),code)),key=lambda x:ORDER.index(x) if x in ORDER else 9999)
    return dict(code=code,where=where,need=need,frs=frs,letters=letters,new=bool(re.search(r'new screen|new state|new sheet|New artefact|Web:',where+' '+need,re.I)))
NDES=0
for code,_ in FILES:
    for r in D[code]['des']:
        row=design_row(code,r['header'],r['cells']); NDES+=1
        if row['letters']:
            for L in row['letters']: AREA_ROWS[L].append(row)
        else: CROSS.append(row)
NAMES={'A':'A. Capture','B':'B. Book and reading','C':'C. Keeping and trust','D':'D. Family, sharing and reminders','E':'E. Foundations and system states'}
rowfrs={}
for L,rs in AREA_ROWS.items():
    for r in rs:
        for f in r['frs']: rowfrs.setdefault(L,set()).add(f)
CK={'A':'K2 (the Home Plus line sits on A-S01), K13 (picture start and suggestions on A-S01, A-S03), K19 and K18 (the Home days ask card)',
    'B':'K12 (dates and digits on the letter page and the book frame)',
    'C':'K4 (C-S20 deletion lines), K9 (C-S23 proposed by privacy), K15 (the suspended-account and deleted-elsewhere lines on C-S10 and C-S20)',
    'D':'K11 (reminders on D-S04 to D-S10), K12 and K18 and K19 (the days page and the day-name switch on D-S08, D-S10, D-S11), K21 (no exclamation marks in notifications)',
    'E':'K2 (E-S26 line), K5 (E-S03 minor-signal state versus "store nothing"), K9 (E-S27 and E-S28 are taken; E-ST47 is free), K10 (E-S03 country count), K15 (E-S15 and E-S24 states)'}
for L in 'ABCDE':
    w('### 6.%s %s'%('ABCDE'.index(L)+1,NAMES[L]))
    w()
    w('Design folder: `docs/design/e2e/%s/`.'%AREAS[L])
    w()
    w('Conflicts in section 3a that touch this area: %s.'%CK[L])
    w()
    w('**6.%d.1 Design-needs rows filed by the functions**'%('ABCDE'.index(L)+1))
    w()
    w('| From | Screen or state | Design response needed | FR ids |')
    w('|---|---|---|---|')
    for r in AREA_ROWS[L]:
        w('| %s | %s | %s | %s |'%(CODEFN[r['code']] if r['code']!='SEC' else 'security',esc(r['where']),esc(r['need']),', '.join(f[3:] for f in r['frs']) or '(none cited in the row)'))
    w()
    w('**6.%d.2 FRs naming screens of this area with no design-needs row**'%('ABCDE'.index(L)+1))
    w()
    lst=[]
    for i in ORDER:
        r=FRS[i]
        sl=[s_ for s_ in screens(r['links']) if s_[0]==L]
        if sl and i not in rowfrs.get(L,set()): lst.append('%s (%s)'%(i[3:],', '.join(sl[:5])))
    w('; '.join(lst) if lst else 'none')
    w()
w('### 6.F Needs that name no screen of any area (cross-area, website, artefacts)')
w()
w('| From | Where | Need | FR ids |')
w('|---|---|---|---|')
for r in CROSS:
    w('| %s | %s | %s | %s |'%(CODEFN[r['code']] if r['code']!='SEC' else 'security',esc(r['where']),esc(r['need']),', '.join(f[3:] for f in r['frs']) or '(none cited in the row)'))
w()
# ---------- 7 checks
w('## 7. Checks and findings')
w()
rowsum=len(ORDER)
fwd_ids=[re.match(r'\| (FR-[A-Z]+-\d+[a-z]?) \|',l).group(1) for l in OUT if re.match(r'\| FR-[A-Z]+-\d+[a-z]? \|',l)]
fwd_rows=len(fwd_ids)
uniq=len(set(fwd_ids))
allref=set()
for code,f in FILES: allref|=set(re.findall(FIDRE,D[code]['text']))
dang=sorted(allref-set(ORDER))
# references that are really ranges "FR-X-10 to 25" are fine; dangling = id with no row, shown with the files that cite it
dangsrc={d:[c for c,_ in FILES if re.search(re.escape(d)+r'(?![0-9a-z])',D[c]['text'])] for d in dang}
w('### 7.1 Counts reconcile')
w()
w('- FR rows read from the %d files: %d (%s).'%(NF,rowsum,'; '.join('%s %d'%(CODEFN[c],cnt[c]) for c in cnt)))
w('- Rows in the forward table: %d; distinct FR ids in it: %d; every FR id appears exactly once: %s.'%(fwd_rows,uniq,'yes' if fwd_rows==uniq==rowsum and set(fwd_ids)==set(ORDER) else 'NO'))
w('- FR ids written in any of the %d files that have no row: %s.'%(NF,('; '.join('%s (cited in %s)'%(d,', '.join(dangsrc[d])) for d in dang)) if dang else 'none (every cross-reference resolves)'))
w('- Gap in the source numbering: FR-SEC-13 has no row; GAP-LOG (K-SEC13 note) says the security author fills or retires it. FR-PHS numbers in bands and has no 05 to 09, 26 to 29, 35 to 39, 45 to 49 by design. FR-PRT-34a and FR-LCY-33 "(proposal)" are read as written.')
w('- Proposed card changes read: %d; rulings after merging: %d. Questions read: %d; index entries: %d. Engineering rows read: %d; entries: %d (new rows needed: %d). Design-needs rows read: %d.'%(len(CC),len(ENT),len(QS),len(QENT),len(ENG),len(ENTRIES),sum(1 for e in ENTRIES.values() if e['nr']),NDES))
w('- Rulings read from GAP-LOG: %d (%s). FRs marked ruled: %d. Card-change rulings marked ruled or partly ruled: %d of %d. Question entries ruled or partly ruled: %d of %d. Conflicts ruled in full: %d of %d (plus %d partly ruled).'%(len(RULINGS),', '.join(sorted(RULINGS,key=lambda x:(re.sub(r'[\d-]+$','',x),int(re.search(r'(\d+)$',x).group(1)) if re.search(r'(\d+)$',x) else 0))),sum(1 for i in ORDER if FWD[i]['st'].startswith('ruled')),sum(1 for e in ENT if e['ruled']),len(ENT),nrq+nrp,len(QENT),nfull,len(CONFL),npart))
w('- BL ids above BL-999 in the %d files: none proposed. The string "BL-1000" appears twice, both times to say that ids from BL-1000 are invisible to the dispatcher (%s); no function file allocates a BL id, every new row is "new row needed" and Karma allocates ids with `next-id.mjs`. Section 5 uses NR-nn working handles only. (The numbering rules at the top of `docs/BACKLOG.md` leave BL-055 to BL-099 unused; nothing here allocates in that range.)'%(NF,', '.join(sorted(set(CODEFN[c] for c,_ in FILES if re.search(r'BL-\d{4,}',D[c]['text']))))))
w()
w('### 7.2 Card links')
w()
kinds={'direct':0,'pack':0,'text':0,'none':0}
for i in ORDER: kinds[FWD[i]['ck']]+=1
w('- FRs whose Links column names at least one NS card: %d. Frame or every-card only: %d. No NS card in Links but one in the requirement text: %d. No card link at all: %d.'%(kinds['direct'],kinds['pack'],kinds['text'],kinds['none']))
w('- FRs with no card link at all (the author named decisions, counsel questions, e2e screens, files, other FRs or code instead of a card row; some name a proposed card such as NS-AI, which is not a card number). Per the BRIEF each FR should name a card row or "new card row needed"; these name neither. Suggested card, where shown, comes from the card 19 screen table or from a linked FR that has a card; it is a suggestion only:')
w()
w('| FR id | Function | What the Links column names | Suggested card |')
w('|---|---|---|---|')
def via_fr(i):
    out=[]
    for f in fr_ids(FRS[i]['links']):
        if f in FRS and f!=i and FWD[f]['ck']=='direct':
            ns=sorted(set(n for n in ns_expand(FRS[f]['links']) if 1<=n<=99))
            if ns: out.append('%s: %s'%(f[3:],', '.join('NS-%02d'%n for n in ns[:6])))
    return out
NOCARD=[]
for i in ORDER:
    if FWD[i]['ck']=='none':
        NOCARD.append(i)
        r=FRS[i]; sg=suggest_ns(r['links']+' '+r['req']); vf=via_fr(i)
        txt=', '.join('NS-%02d'%n for n in sg)
        if vf: txt=(txt+'; ' if txt else '')+'via linked FR (%s)'%'; '.join(vf)
        w('| %s | %s | %s | %s |'%(i,CODEFN[r['code']],esc(r['links']),txt or 'none derivable'))
w()
tx=[i for i in ORDER if FWD[i]['ck']=='text']
w('- FRs whose card appears only in the requirement text: %s.'%(', '.join(t[3:] for t in tx) or 'none'))
bypf={}
for i in ORDER:
    if FWD[i]['ck']=='none': bypf[FRS[i]['code']]=bypf.get(FRS[i]['code'],0)+1
w('- No-card-link counts by function code: %s.'%', '.join('%s %d'%(k,v) for k,v in sorted(bypf.items())))
w()
w('### 7.3 e2e screen ids and backlog links')
w()
noe=[i for i in ORDER if FWD[i]['e2e']=='-']
w('- FRs with no e2e screen id in Links or text: %d of %d (many are policy, finance, data or documentation requirements with no screen). They are: %s.'%(len(noe),rowsum,', '.join(i[3:] for i in noe)))
newscr=[i for i in ORDER if 'new screen needed' in FWD[i]['e2e']]
w('- FRs that say "new screen needed" in Links: %s.'%(', '.join(i[3:] for i in newscr) or 'none'))
badids=set()
for i in ORDER:
    for s_ in screens(FRS[i]['links']+' '+FRS[i]['req']):
        b=re.match(r'[A-E]-S(?:T)?\d+[a-z]?',s_).group(0)
        if b not in INV: badids.add(b)
alldist=set(re.match(r"[A-E]-S(?:T)?\d+[a-z]?",s_).group(0) for i in ORDER for s_ in screens(FRS[i]['links']+' '+FRS[i]['req']))
w('- Screen ids in FR rows that are not in the five DESIGN.md files: %s. (%d distinct ids in FR rows; the design inventory holds %d ids.)'%((', '.join(sorted(badids)) if badids else 'none'),len(alldist),len(INV)))
nobl=[i for i in ORDER if FWD[i]['bl']=='none named']
w('- FRs with no backlog row named in Links, text or any engineering table: %d of %d. Many are docs, founder or counsel items; Karma decides which need a row: %s.'%(len(nobl),rowsum,', '.join(i[3:] for i in nobl)))
badbl=sorted(set(b for i in ORDER for b in re.findall(r'BL-\d+',' '.join([FRS[i]['links'],FRS[i]['req'],FRS[i]['ev']])) if b not in BLANY))
w('- BL ids cited by FR rows that do not appear in `docs/BACKLOG.md`: %s. Several are ids the function file says it has not read on this branch (for example BL-999, BL-997, BL-992 in the reliability file are range-end ids the backlog may not carry yet); Karma checks them against `next-id.mjs` before the rows are filed.'%(', '.join(badbl) or 'none'))
w()
w('### 7.4 Coverage tables')
w()
miss=[]
for c in FILEORDER:
    nocard=[n for n in range(1,46) if worst(c,n)=='-']
    if nocard and len(nocard)<45: miss.append('%s has no verdict row for NS-%s'%(CODEFN[c],', NS-'.join('%02d'%n for n in nocard)))
w('- Functions with a per-card verdict table but gaps in it: '+('; '.join(miss) if miss else 'none (ranges counted)')+'.')
w('- Functions with no per-card verdict table: %s.'%(', '.join(CODEFN[c] for c in noverd) or 'none'))
w('- No function gives a verdict for NS-46 to NS-50 (no function reviewed them: they were written %s); the days, cultural-data, notification-catalogue, photos and opportunities files outline them.'%('afterwards, in card 21' if card21 else 'as outlines only'))
w()
w('### 7.5 What the parser could not read')
w()
zero=[]
for c in FILEORDER:
    d=D[c]
    for k,lab in (('cc','card changes'),('qs','questions'),('des','design needs'),('eng','engineering rows'),('ver','per-card verdicts')):
        if len(d[k])==0: zero.append('%s: no %s read'%(CODEFN[c],lab))
for z in zero: w('- %s.'%z)
w('- Notification catalogue has no table of card changes (it proposes the new card NS-48 in its section 11 instead); its engineering section is a paragraph ("New rows needed ...; Existing rows ...") plus a table of planner changes, both read.')
w('- Back-office gives its verdict by back-office area (section 2.3), not by card; those verdicts are not in the reverse view.')
w('- Research, photos and opportunities give a coverage check and no per-card verdict.')
w('- Quality\'s P0 register (3a, 3b, 3c, and Annex A to I) are index lines and test annexes, not FR rows; only the 24 FR-QAL rows are read as requirements. Annexes A to I (case tables, fixtures, charters, gate artifacts) are test annexes and are not parsed.')
w('- Photos: one row in the question table ("Existing numbers") is a note and is skipped. FR-PHS-05 to 09 and other band gaps are not missing rows.')
w('- Some engineering and design bullets in the research, opportunities, photos and notifications files are prose items; each bullet is read as one row, and a bullet that names no screen is listed under 6.F.')
w('- Where a function file reads a bare number list in an FR column (for example lifecycle "01, 02, 09, 21") it is read as FR ids of that file\'s own code.')
w()
w('### 7.6 ASCII scan')
w()
text='\n'.join(OUT)
bad=[(i,ch) for i,ch in enumerate(text) if ord(ch)>127]
w('- Characters above 127 in this file: %d (em dash, en dash, curly quotes, ellipsis character, emoji all count). The source files had 0.'%len(bad))
text='\n'.join(OUT)+'\n'
# keep ascii even if a source slips: replace and count
nonascii=sum(1 for ch in text if ord(ch)>127)
open(os.path.join(PRD,'FUNCTION-TRACE.md'),'w',encoding='ascii',errors='replace').write(text)
stats=dict(fr=rowsum,by_code=cnt,fwd_rows=fwd_rows,cc=len(CC),rulings=len(ENT),qs=len(QS),qent=len(QENT),eng=len(ENG),entries=len(ENTRIES),new=sum(1 for e in ENTRIES.values() if e['nr']),des=NDES,
 nocard=len(NOCARD),kinds=kinds,conflicts=len(CONFL),p0_all=p0_all,p0_first=p0_first,p0_later=p0_later,reg14=REG14,p0_19=P0_19,nonascii=nonascii,files=NF)
json.dump(stats,open(os.path.join(HERE,'last-run.json'),'w'),indent=1)
print('written',len(text),'bytes',len(OUT),'lines; nonascii',nonascii)
print(json.dumps(stats))
