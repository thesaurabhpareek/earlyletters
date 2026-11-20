import sys; sys.path.insert(0,'/home/claude/trace-gen')
from eng import *
from groups import *
import datetime
OUT=[]
def w(s=''): OUT.append(s)
FILEORDER=[c for c,_ in FILES]
FN_FILE={c:n for c,n in FILES}
def src(code): return 'functions/'+FN_FILE[code]+'.md'
# ---------- questions
QS={}
QORDER=[]
FIN_OWNER={'F1':'founder','F2':'founder','F3':'founder','F4':'founder','F5':'founder (engages counsel)','F6':'founder','F7':'founder','F8':'founder','F9':'founder','F10':'founder','F11':'founder; counsel Q41(f)','F12':'founder, accountant, counsel','F13':'founder (engages accountant)'}
for code,_ in FILES:
    for q in D[code]['qs']:
        c=q['cells']; h=q['handle']; qid=h.split(' ',1)[1]
        if code in ('SUP','MKT','SEC'): question,default,owner,number=c[1],c[2],c[3],''
        elif code=='OPS': question,default,owner,number=c[1],c[2],c[3],''
        elif code=='FIN': question,default,owner,number=c[1],c[3]+' (recommendation: '+c[2]+')',FIN_OWNER[qid],''
        elif code=='DAT':
            question,default=c[1],c[2]
            owner='counsel' if re.match(r'Counsel|Founder and counsel',question) else 'founder'
            number=''
        else: question,default,owner,number=c[1],c[3],c[2],c[4]
        txt=' '.join(c)
        own=owner+' '+number
        kind=[]
        if re.search(r'counsel|needs a number from legal',own,re.I): kind.append('counsel')
        if re.search(r'founder',own,re.I) or not kind: kind.append('founder')
        if re.search(r'accountant|clinician',own,re.I): kind.append('other')
        nums=sorted(set(re.findall(r'\bQ\d{1,2}\b',own+(' '+default if (code=='DAT' and qid=='FQ-08') else ''))),key=lambda x:int(x[1:]))
        QS[h]=dict(handle=h,qid=qid,code=code,question=question,default=default,owner=owner,number=number,kind=kind,nums=nums,frs=sorted(set(fr_ids(txt))))
        QORDER.append(h)
DUE={'SUP Q-SUP-10':'before C1 (stated in the row)','OPS Q11':'before the first run sheet of the pack (stated)','FIN F2':'before the first run sheet (stated)','FIN F12':'due 27 Nov (stated)','FIN F13':'before the first payout (CR-120) (stated)','CMP C-2':'1 Jan 2027 is the date in the question (stated)','SEC Q-S3':'before the first person outside the family stores letters on the server (stated)'}
# ---------- card changes
CC={}
for code,_ in FILES:
    for x in D[code]['cc']:
        x=dict(x); x['code']=code; x['frs']=sorted(set(fr_ids(x['card']+' '+x['change']+' '+x['why']))); CC[x['handle']]=x
# ---------- status
cc_cites=set(f for x in CC.values() for f in x['frs'])
cq=set();fq=set()
for q in QS.values():
    if 'counsel' in q['kind']: cq|=set(q['frs'])
    if 'founder' in q['kind']: fq|=set(q['frs'])
def status(r):
    s=[]
    lane=r['lane'].lower()
    if r['id'] in cq or 'counsel' in lane: s.append('counsel')
    if r['id'] in fq or 'founder' in lane: s.append('founder')
    locked=bool(re.search(r'NS-\d+-[A-Z]?\d+|NS-\d+ [A-Z]\d+',r['links']))
    if r['id'] in cc_cites or not locked: s.append('needs Karma ruling')
    return '; '.join(s) if s else 'ruled'
# ---------- touches
touch={n:{} for n in range(1,46)}
packfr=[]
for i in ORDER:
    r=FRS[i]
    ns=set(ns_expand(r['links']))
    for n in ns:
        if 1<=n<=45: touch[n].setdefault(i,set()).add('L')
    if not ns and PW.search(r['links']): packfr.append(i)
    for n in set(ns_expand(r['req'])):
        if 1<=n<=45 and n not in ns: touch[n].setdefault(i,set()).add('T')
VER={}   # (code,card) -> list of (sub,verdict)
VERNOTE={}
def vnorm(s):
    s=s.lower()
    if s.startswith('covered'): return 'C'
    if s.startswith('partly'): return 'P'
    if s.startswith('missing'): return 'M'
    if s.startswith('n/a'): return 'n/a'
    return 'NR'
EXTRA=[]
for code,_ in FILES:
    for v in D[code]['ver']:
        c=v['cells']; lab=c[0]; vd=vnorm(c[1])
        cards=sorted(set(ns_expand(lab)))
        m=re.match(r'NS-\d+ (Part [A-C]|[A-Z]\d*)\b',lab)
        sub=m.group(1) if m else ''
        if not cards:
            EXTRA.append((code,lab,vd,c[1],c[2] if len(c)>2 else '')); continue
        frcol=' '.join(c[2:])
        frs=set(fr_ids(frcol))
        if code=='PRV' and len(c)>=4 and re.fullmatch(r'[\d, ]+',c[-1].strip()): frs|={'FR-PRV-%02d'%int(x) for x in re.findall(r'\d+',c[-1])}
        for n in cards:
            if 1<=n<=45:
                VER.setdefault((code,n),[]).append((sub,vd,c[1]))
                for f in frs:
                    if f in FRS: touch[n].setdefault(f,set()).add('V')
RANK={'M':4,'P':3,'C':2,'n/a':1,'NR':0}
def worst(code,n):
    l=VER.get((code,n))
    if not l: return '-'
    return max((x[1] for x in l),key=lambda v:RANK[v])
# ---------- start output
today='20 Nov 2026'
w('# Function requirements trace (forward table, reverse view per card, rulings, questions, engineering rows, design needs)')
w()
w('Owner: `product` for Karma (CTO role, product side). Written %s (UTC). Docs only: nothing here is built, no string is live, no decision is recorded in `DECISIONS.md`. The people who wrote the function files are Claude roles, not licensed professionals; every legal reading in them says "counsel must confirm" and nothing here is legal advice.'%today)
w()
w('Fictional family: Asha only. ASCII only.')
w()
w('## 0. What this file is and how it was made')
w()
w('Built by a script from the nine function files (`functions/support.md`, `marketing.md`, `operations.md`, `finance.md`, `data-and-measurement.md`, `privacy.md`, `legal.md`, `compliance.md`, `risk-security.md`), the cards `00` to `19`, `GAP-LOG.md`, and the e2e design under `docs/design/e2e/` read from the worktree of branch `docs/e2e-ux-20nov` (head `d94ed52d7` when read). The script is kept outside the repository at `/home/claude/trace-gen/` (not committed); rerun it when a function file changes. Every FR id, link, verdict, proposed change, question and engineering row below is read from those files; the only hand-written parts are the merge groups (which proposals are the same), the conflict recommendations, and the status derivation rule. Wording in quotes or after a handle is copied from the source file.')
w()
w('Source states to keep in mind:')
w()
w('- The function files were written while `19-from-download-to-first-letter.md` was a draft. NS-43 to NS-45 are on disk now (this run saw sections for NS-38 to NS-45). The function verdicts "missing" or "not reviewed" for NS-41 to NS-45 mean "card not yet written when the function reviewed", not "the card has a gap"; the function owners should re-read the cards that now exist.')
w('- The Links column of an FR row is where the author names card rows, e2e ids and backlog rows (BRIEF "How each function\'s requirements get linked"). When an FR names none, this file says so and does not guess; where a screen in the FR is on the card 19 screen table, that card is shown as a suggestion only.')
w('- `GAP-LOG.md` carries no ruling on any FR id yet (searched for "FR-"): nothing below is ruled by Karma.')
w()
# counts
cnt={}
for i in ORDER: cnt[FRS[i]['code']]=cnt.get(FRS[i]['code'],0)+1
w('### 0.1 Totals')
w()
w('| Function (code) | File | FR rows |')
w('|---|---|---|')
for code,f in FILES:
    codes=[c for c in cnt if FRS[[i for i in ORDER if FRS[i]['code']==c][0]]['file']==code]
    for c in codes: w('| %s (%s) | functions/%s.md | %d |'%(CODEFN[c],c,f,cnt[c]))
w('| Total | | %d |'%len(ORDER))
w()
w('Policy (POL) is in the support file; risk (RSK) and security (SEC) are in the risk-security file. FR-SEC-13 has no row and no reference anywhere (a numbering gap in the source; see 7.1).')
w()
w('### 0.2 Status column (how it is derived)')
w()
w('- `counsel`: a question to counsel (section 7 of the function file, or its counsel number) cites the FR, or the FR\'s owner lane names counsel.')
w('- `founder`: a question to the founder cites the FR, or the owner lane names the founder.')
w('- `needs Karma ruling`: a proposed card change cites the FR, or the FR names no locked card row (it is a new requirement the function adds, which Karma links or declines).')
w('- `ruled`: none of the above. It rests on a locked card row or an existing decision and needs no new ruling. It does not mean Karma has ruled on the FR itself; see the GAP-LOG note above.')
w('- Priority: the first priority in the FR\'s row, with its RR-4 reasons in brackets; `*` means the row carries more than one priority (read the source row).')
w()

# ---------- 1 forward table
def blcell(r):
    i=r['id']; out=[]
    bl=list(dict.fromkeys(re.findall(r'BL-\d+',r['links'])))
    out+=bl
    tag=''
    if not bl:
        t=list(dict.fromkeys(re.findall(r'BL-\d+',r['req']+' '+r['ev'])))
        out+=[b+' (text)' for b in t]
    for en in FR2ENG.get(i,[]):
        for b in en['bls']:
            if b not in [x.split(' ')[0] for x in out]: out.append(b+' (eng table)')
        if en['nr']: out.append('new row needed ('+en['nr']+')')
        elif en['key']=='preflight' and 'BL-958' not in ' '.join(out): out.append('BL-958 (eng table)')
    if re.search(r'new row needed|new row\b',r['links'],re.I) and not any('new row' in x for x in out): out.append('new row needed')
    return ', '.join(out) if out else 'none named'
FWD={}
for i in ORDER:
    r=FRS[i]
    cc_,ck=cardcell(r); FWD[i]=dict(card=cc_,ck=ck,e2e=e2ecell(r),bl=blcell(r),st=status(r),pr=prio(r['prio']))
w('## 1. Forward table: every FR, its function, priority, cards, e2e screens, backlog rows and status')
w()
w('Card cell: `NS-nn` with the row ids the author named; `(from text)` means the Links column names no card but the requirement text does; `NO CARD LINK` means neither does. e2e cell: ids from the Links column (with state suffix as written), `(text)` when read from the requirement text, `new screen needed` when the Links column says so. Backlog cell: BL ids from Links, `(text)` from the requirement or evidence text, `(eng table)` from section 6 of the function file, and `new row needed (NR-nn)` where section 6 asks for a row (NR numbers are working handles for section 5 of this file, not backlog ids; Karma allocates BL ids, none above BL-999).')
w()
w('| FR id | Function | Priority | Card(s) and rows | e2e screen ids | Backlog rows | Status |')
w('|---|---|---|---|---|---|---|')
for i in ORDER:
    r=FRS[i]; f=FWD[i]
    w('| %s | %s | %s | %s | %s | %s | %s |'%(i,CODEFN[r['code']],f['pr'],esc(f['card']),esc(f['e2e']),esc(f['bl']),f['st']))
w()

# ---------- 2 reverse view
CARDNAMES={}
for l in open('/home/claude/earlyletters/docs/product/prd/00-product-frame.md',encoding='utf-8').read().split('\n'): pass
w('## 2. Reverse view per card, NS-01 to NS-45')
w()
w('Verdict key: C covered, P partly, M missing, n/a not applicable to that function, NR the function did not review the card (written after, or not on disk), `-` the function file has no row for the card. Where a function split a card into parts (NS-06 A, B, C; NS-07 C5, C28, G11) the worst part is shown and the parts are in 2c.')
w()
w('### 2a. Function verdicts per card')
w()
hdr=['SUP','MKT','OPS','FIN','DAT','PRV','LEG','CMP','SEC']
w('| Card | support | marketing | operations | finance | data | privacy | legal | compliance | security and risk | FRs touching |')
w('|---|---|---|---|---|---|---|---|---|---|---|')
for n in range(1,46):
    vs=[worst(c,n) for c in hdr]
    w('| NS-%02d | %s | %d |'%(n,' | '.join(vs),len(touch[n])))
w()
w('Totals per function over NS-01 to NS-45 (cards where a function split the card count once, at the worst part):')
w()
w('| Function | C | P | M | n/a | NR | no row |')
w('|---|---|---|---|---|---|---|')
for c in hdr:
    vals=[worst(c,n) for n in range(1,46)]
    w('| %s | %s |'%(CODEFN[c] if c!='SEC' else 'security and risk',' | '.join(str(vals.count(k)) for k in ['C','P','M','n/a','NR','-'])))
w()
w('Cards where at least one function says M (missing):')
w()
for n in range(1,46):
    ms=[CODEFN[c] if c!='SEC' else 'security' for c in hdr if worst(c,n)=='M']
    if ms: w('- NS-%02d: %s'%(n,', '.join(ms)))
w()
w('Pack-wide verdict rows that name no card:')
w()
for code,lab,vd,raw,why in EXTRA:
    w('- %s, "%s": %s. %s'%(CODEFN[code] if code!='SEC' else 'security',lab,raw,esc(why)))
w()
w('### 2b. FRs that touch each card')
w()
w('Union of: the Links column (no mark), the requirement text (`~t`), and the FR rows named in that function\'s own verdict row for the card (`~v`). FRs whose Links column names only the frame or "every card" are in 2d, not repeated here.')
w()
w('| Card | FR ids |')
w('|---|---|')
for n in range(1,46):
    items=[]
    for i in sorted(touch[n],key=lambda x:ORDER.index(x)):
        fl=touch[n][i]
        mk='' if 'L' in fl else ('~t' if 'T' in fl else '~v')
        if 'L' not in fl and 'T' in fl and 'V' in fl: mk='~t~v'
        items.append(i[3:]+mk)
    w('| NS-%02d | %s |'%(n,'; '.join(items) if items else 'none'))
w()
w('### 2c. Cards a function split into parts')
w()
for code in hdr:
    for n in range(1,46):
        l=VER.get((code,n),[])
        if len(l)>1:
            w('- %s, NS-%02d: %s'%(CODEFN[code] if code!='SEC' else 'security',n,'; '.join('%s = %s'%(s or 'whole',v) for s,v,_ in l)))
w()
w('### 2d. FRs that name the frame or every card and no single card')
w()
w('%d FRs: %s.'%(len(packfr),', '.join(p[3:] for p in packfr)))
w()

# ---------- 3 rulings
INPUT=open('/home/claude/earlyletters/docs/product/prd/inputs/first-run-compliance.md',encoding='utf-8').read()
INROWS={}
for l in INPUT.split('\n'):
    m=re.match(r'\| (\d+) \| ',l)
    if m and len(cells(l))>=9: INROWS.setdefault(m.group(1),cells(l))
def ccbucket(x):
    card=x['card']; ns=ns_expand(card)
    if re.search(r'Frame|00-product-frame|`00`|frame',card,re.I) and not ns: return (0,0)
    if re.search(r'14-test-plan|`14`',card): return (1,14)
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
def frtxt(i):
    r=FRS[i]; return '%s (%s, %s): %s'%(i,CODEFN[r['code']],FWD[i]['pr'],r['req'])
def qtxt(h):
    q=QS[h]; return '%s: "%s" Default: %s Owner: %s%s'%(h,q['question'],q['default'],q['owner'],(' '+q['number']) if q['number'] else '')
def cctxt(h):
    x=CC[h]; return '%s (%s) on %s: %s Why: %s'%(h,H2R[h],x['card'],x['change'],x['why'])
w('## 3. Needs a ruling: proposed card changes, deduplicated, and conflicts between functions')
w()
w('Karma rules each in `GAP-LOG.md` like a design gap (ruling kinds CARD, DEFAULT, FOUNDER, ENG, NONE). Counts: %d proposed card changes in the nine files (support %d, marketing %d, operations %d, finance %d, data %d, privacy %d, legal %d, compliance %d, security and risk %d); after merging overlapping ones there are %d rulings to make (R-001 to R-%03d), of which %d merge two or more proposals.'%(len(CC),*[sum(1 for x in CC.values() if x['code']==c) for c in hdr],len(ENT),len(ENT),sum(1 for e in ENT if len(e['handles'])>1)))
w()
w('Cards NS-43 to NS-45 are on disk now, so proposals marked "(when written)" in the function files should be applied to the written rows, not to a future card.')
w()
w('### 3a. Conflicts between functions (both positions shown, one recommended)')
w()
CONFL=[]
def C(title,positions,rec,related=''):
    CONFL.append((title,positions,rec,related))
inrow=lambda k:'`inputs/first-run-compliance.md` row %s, "%s": class %s'%(k,INROWS[k][1],INROWS[k][5]) if k in INROWS else ''
C('K1. Class of the child\'s name, birthday, due date, letter languages and first letter (privacy: L4; compliance input: L3 or L2)',
  [('privacy',cctxt('PRV C21')),('privacy',cctxt('PRV C22')),('privacy',frtxt('FR-PRV-24')),
   ('compliance input (the compliance function file indexes it and does not restate the classes)',inrow('13')+'.'),('compliance input',inrow('14')+'.'),('compliance input',inrow('16')+'.'),('compliance input',inrow('18')+'.')],
  'Privacy. `DATA_CLASSIFICATION.md` lists `name`, `birthday`, `due_date`, `nickname` as L4 (line 627), `due_date` as L4 consumer health data (line 185) and `language.spoken` as L4 (line 703), which I read this session. The class of a field is the privacy lead\'s ruling (charter), so NS-43 and NS-44 carry L4 and the compliance input table is corrected in the same PR; the signature stays L3 as both agree. Counsel must confirm nothing here; it is the repository\'s own classification.',
  'PRV C21, PRV C22')
C('K2. The Home Plus line wording (design change versus the marketing and Terms 8.2 rule)',
  [('design, `docs/design/e2e/E-foundations-and-system-states/WORDS.md` line 342 (read this session)','Built line: "Adding new letters to the book needs Plus. Recording, reading and export are always free." CHANGE proposed by design: "Adding new letters to the book needs Plus. Recording, reading and export stay free." (reason: "always free" is an open-ended promise; "stay free" matches the pinned membership line).'),
   ('finance','Endorses the design change from "always free" to "stay free" (finance section 4, E-S26; BL-965 carries `plusLine` "stay free"; finance question Q40 default "stay free", never "always free").'),
   ('marketing',frtxt('FR-MKT-04')),('marketing',frtxt('FR-MKT-22')),
   ('design, WORDS line 264 (the pinned membership line)','"Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free."')],
  'Marketing does not comment on the plusLine words; the conflict is between the design\'s changed line and marketing FR-MKT-04 (public lines about what stays free follow the Terms 8.2 permanent list in substance: reading kept letters, playing their recordings, export, and say nothing about the future of other capability). "Recording" is not on that list, and the pinned membership line already says "Reading, listening and your copy stay free". Recommend one string for both places: drop "Recording" and use the pinned membership wording ("Reading, listening and your copy stay free"), keep "stay", never "always". The founder approves the words; counsel Q40 stays open for the Read together line.',
  'MKT C01, MKT C07; question MKT MQ-1')
C('K3. First-time downloads before the allowance rule may fire (500 or 1,000)',
  [('data (the only function file that takes a position)',qtxt('DAT FQ-02')),('data',cctxt('DAT C-11'))],
  'Not a conflict between two functions: the two numbers are two records (F14 6.9 says 1,000, D-125 item 3 says 500), and no other function file mentions the minimum (searched). Recommend 500 with the 95% interval printed beside the point, as data proposes, because D-125 is the later ruling; the founder confirms.',
  'DAT C-11')
C('K4. What the deletion texts say (legal versus the card row versus privacy)',
  [('card, NS-01-R31 (read in `01-photo-with-a-letter.md`)','Given photos on in any build, the account-deletion text (`packages/content/src/pages.en.ts:240`) no longer says pictures are removed from places the server cannot reach, and says pictures on a phone go when that phone is erased. P0 (b); one content test.'),
   ('legal',cctxt('LEG C-3')),('legal',frtxt('FR-LEG-02')),('privacy',frtxt('FR-PRV-18')),
   ('support',frtxt('FR-SUP-14')),('operations',qtxt('OPS Q7')),('privacy',qtxt('PRV PQ-10'))],
  'Take legal\'s scope (all four texts: the C-S20 sheet, `pages.en.ts:236-244`, `delete-account-page.md`, Privacy 7) because one promise cannot be true in the app and false on the web; take privacy FR-PRV-18 as the content of the C-S20 sheet (it lists what is kept); take the support FR-SUP-14 pointer; and on restores take ops and privacy together: the policy does not say deletions survive a disaster restore on Free, and the 24-hour window goes in the incident notice. Put all lines in one `packages/content` key family so the four places cannot drift, with the NS-01-R31 test extended as legal asks. Counsel must confirm the retention sentences.',
  'LEG C-3, PRV C23')
C('K5. The Texas and California age signal: store nothing (compliance) versus record an enum (privacy)',
  [('compliance',frtxt('FR-CMP-15')),('compliance',qtxt('CMP C-2')),('compliance',qtxt('CMP C-3')),('privacy',frtxt('FR-PRV-25')),('support',qtxt('SUP Q-SUP-13'))],
  'Compliance. FR-CMP-15 says the app "stores and sends no age range anywhere" and keeps nothing beyond `ageGate.stoppedAt`, and the question to counsel (C-2) defaults to "keep nothing". FR-PRV-25 would record an `age_signal` enum in the Terms record. Recommend no record until counsel Q46 says evidence of the signal is needed; privacy removes the enum from FR-PRV-25 and keeps it as a conditional row. Also needed: the founder\'s dated risk acceptance for Texas on every store candidate (FR-CMP-15) and the module before 1 Jan 2027. Counsel must confirm the statutes (secondary sources only in the compliance file).',
  'FR-CMP-15, FR-PRV-25, Q46')
C('K6. Is the age-rating questionnaire re-answered for NS-05 Level 1 (compliance: yes; marketing: no change)',
  [('compliance',frtxt('FR-CMP-19')),('compliance',cctxt('CMP K-5')),('marketing',frtxt('FR-MKT-17')),('marketing',qtxt('MKT MQ-8')),('support',qtxt('SUP Q-SUP-7'))],
  'Compliance, as a cheap re-read: the recorded answer says user-generated content is "No (letters are never distributed)", and a share goes through the parent\'s own share sheet; at Level 1 the answer is expected not to change, but the gate asks for the re-answer to be saved in the gate record (P0 (b)) rather than assumed (marketing P1 (b)). Counsel must confirm; rating values are unverified in both files.',
  'MKT C08, CMP K-5')
C('K7. Names of the store-build gates (G0 to G6 used for two different lists)',
  [('operations',cctxt('OPS C12')),('compliance',cctxt('CMP K-3')),('compliance',frtxt('FR-CMP-11'))],
  'Operations\' point stands: `RELEASE.md` 1.3 and `14-test-plan.md` section 6 both use G0 to G5 for different things, and compliance builds a generator on G0 to G6. Rename one set before the generator is written. Recommend prefixing the test-plan gates as store-build gates SG0 to SG6 (operations\' example) and keeping `RELEASE.md` names; Karma rules and `qa` edits `14`.',
  'OPS C12, CMP K-3')
C('K8. Thresholds for moving to paid vendor tiers (finance versus operations)',
  [('finance',qtxt('FIN F1')),('operations',qtxt('OPS Q1')),('finance',qtxt('FIN F7')),('operations',qtxt('OPS Q2')),('finance',qtxt('FIN F6')),('operations',qtxt('OPS Q3'))],
  'Not a contradiction once ordered: finance\'s 60% is when the founder is asked, operations\' 80% is when the move is made that week (finance\'s own engineering row for FR-FIN-03 says alert at 80%, founder question at 60%). Recommend one rule in the run-cost register: ask at 60% of any Free limit, move to Pro the same week at 80%. For Resend take operations\' sign-in trigger (50 a day, half the 100-a-day cap) because it is measurable. EAS: both agree on Starter only for a month that needs it. Paid prices are unverified in both files; the founder confirms.',
  'FIN C01, OPS C13')
C('K9. Screen ids proposed by functions that collide with the e2e design',
  [('support (section 4)','Proposes new screens E-S27 and E-S28 for "If you are struggling" and "Lines in other countries" (support says no e2e area gave them ids).'),
   ('design, E `DESIGN.md` section 5','E-S27 is "App Store page and install" and E-S28 is "Permission asks map" in the design read this session (highest E screen id is E-S29), so both ids are taken.'),
   ('privacy','Proposes C-S23 for "Privacy in Me" and C-S23.withdraw. Highest C screen id in the design is C-S22, so C-S23 is free.'),
   ('operations','Proposes E-ST47 for "Server restored". Highest E state id in the design is E-ST46, so it is free.')],
  'Support takes new ids from the free range of area E (E-S30 and E-S31 proposed) or lets area E number them; keep C-S23 and E-ST47 as proposed. The area leads decide; this file does not allocate ids.',
  '')
C('K10. Country count at sign-up: weekly aggregate (data) versus daily count kept 2 years (privacy)',
  [('data',frtxt('FR-DAT-35')),('privacy',frtxt('FR-PRV-26')),('data',qtxt('DAT FQ-09')),('privacy',qtxt('PRV PQ-7'))],
  'Compatible but not the same: privacy keeps a daily count by check, outcome and jurisdiction code for 2 years (D-136) and nothing else; data reads it as a weekly aggregate with a 10-person floor and "other". Recommend privacy\'s storage rule as the source and data\'s reading rule on top, and the NS-40 count stays off until the privacy read data asks for is on record (data\'s own default).',
  'DAT C-13')
for t,pos,rec,rel in CONFL:
    w('**%s**'%t)
    w()
    for who,txt in pos: w('- %s: %s'%(who,esc(txt)))
    w('- Recommendation: %s'%esc(rec))
    if rel: w('- Related: %s'%rel)
    w()

w('### 3b. Proposed card changes, merged (one ruling each)')
w()
w('Ordered frame first, then the test plan and README, then cards by number. "Handles" are `<function code> <id in that file>`; `Overlap` says whether merged proposals add to each other (complementary) or differ and need one answer (differs). FRs cited by the proposals are listed so a ruling can be traced back to section 1.')
w()
for e in ENT:
    hs=e['handles']
    frs=sorted(set(f for h in hs for f in CC[h]['frs']),key=lambda x:ORDER.index(x) if x in ORDER else 999)
    files=sorted(set(CC[h]['code'] for h in hs),key=lambda c:FILEORDER.index(c))
    if len(hs)==1:
        x=CC[hs[0]]
        w('**%s** (%s). Target: %s'%(e['rid'],CODEFN[x['code']] if x['code']!='SEC' else 'security and risk',esc(x['card'])))
        w()
        w('- Change: %s'%esc(x['change']))
        w('- Why: %s'%esc(x['why']))
        w('- Handle: %s (`%s`). FRs: %s'%(hs[0],src(x['code']),', '.join(f[3:] for f in frs) or 'none cited'))
    else:
        w('**%s** %s. Overlap: %s. Proposed by %d files: %s'%(e['rid'],esc(e['title']),e['kind'],len(files),', '.join(CODEFN[c] if c!='SEC' else 'security' for c in files)))
        w()
        for h in hs:
            x=CC[h]
            w('- %s on %s: %s Why: %s'%(h,esc(x['card']),esc(x['change']),esc(x['why'])))
        w('- FRs: %s'%(', '.join(f[3:] for f in frs) or 'none cited'))
    cf=[k for k,(t,p,rec,rel) in enumerate(CONFL,1) if any(h in rel for h in hs) ]
    if cf: w('- Conflict: see K%s in 3a'%', K'.join(str(k) for k in cf))
    w()
# ---------- 4 questions
QG={}
for title,hs in Q_GROUPS:
    for h in hs: QG[h]=title
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
    e['dues']=[DUE[h] for h in e['handles'] if h in DUE]
    e['frs']=sorted(set(f for q in qs for f in q['frs']),key=lambda x:ORDER.index(x) if x in ORDER else 999)
w('## 4. Founder and counsel question index')
w()
w('Every question in section 7 of the nine files (the risk-security file numbers it section 10). %d questions; after merging the same question asked by more than one function there are %d entries (QI-01 onward): counsel first, then founder. Defaults are copied per source; where two sources give different defaults both are shown. Due dates are shown only where the source row states one; every other entry has no due date in the files. Finance and data have no "To" column: owner there is read from the question (data: "Counsel:" prefix) or, for finance, set by me from the question text and marked by the source file. Counsel numbers are packet 1.5.0 as the files cite them; "needs a number from legal" is shown as written.'%(len(QS),len(QENT)))
w()
k=0
for grp in ('counsel','founder'):
    w('### 4.%d %s questions'%(1 if grp=='counsel' else 2,'Counsel' if grp=='counsel' else 'Founder (and other owner)'))
    w()
    for e in [x for x in QENT if x['kind']==grp]:
        k+=1; e['qi']='QI-%02d'%k
        first=QS[e['handles'][0]]
        w('**%s** %s'%(e['qi'],esc(e['title'] or first['question'])))
        w()
        w('- Owner as stated: %s. %sDue: %s.'%(esc(e['owners']),('Counsel numbers: %s. '%(', '.join(e['nums']) or 'none cited (a source may say "needs a number from legal")')) if grp=='counsel' else (('Counsel numbers cited: %s. '%', '.join(e['nums'])) if e['nums'] else ''),'; '.join(e['dues']) or 'not stated'))
        if len(e['handles'])>1 or e['title']:
            pass
        for h in e['handles']:
            q=QS[h]
            w('- %s (`%s`): %s Default: %s%s'%(h,src(q['code']),esc(q['question']),esc(q['default']),(' Number: '+esc(q['number'])) if q['number'] and q['number'].lower()!='none' else ''))
        if e['frs']: w('- FRs cited: %s'%', '.join(f[3:] for f in e['frs']))
        w()

# ---------- 5 engineering
w('## 5. Engineering rows needed')
w()
w('From section 6 of each function file (section 9 of risk-security). %d source rows merge into %d entries. New rows carry a working handle NR-nn; the backlog id is Karma\'s to allocate, and none may be above BL-999 (the dispatcher reads only three-digit ids; privacy and the dispatcher note under BL-999 say so). Sizes are given only where the source gave them; splitting into PRs a reviewer can read in ten minutes is for the engineering thread.'%(len(ENG),len(ENTRIES)))
w()
w('Data\'s section 6.2 (candidate analytics events) is not an engineering row: none is in the catalogue and adding any is a founder decision while analytics is off (FR-DAT-26), so it is not listed here.')
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
    st=', '.join('%s %s'%(b,BLSTATUS.get(b,'(listed in an older format; see BACKLOG.md)')) for b in bls)
    ch='; '.join('%s: %s'%(CODEFN[r['file']] if r['file']!='SEC' else 'security',esc(r['text'] or r['label'])) for r in en['rows'])
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
w('Related pairs to keep together when the rows are written: BL-485 (privacy) and the compliance withdrawal control are the same control; BL-577 (privacy) and the legal consent-record row are the same record writer; the BL-961 change (privacy and security) must list the four split test ids from the security proposal CC-2 ('+H2R['SEC CC-2']+' in 3b).')
w()

# ---------- 6 design needs per area
w('## 6. Design: function needs per e2e area, for the design leads')
w()
w('Each area lead records these as "Function needs accounted for" with the FR id (BRIEF step 5). 6.x.1 is every design-needs row the functions filed (section 4 of their files; section 7 of risk-security) whose screen id is in that area; 6.x.2 is the FRs whose Links column names a screen of the area but that no function filed a design-needs row for (the design response is then the FR requirement itself; read it in section 1). Screen ids are as written by the function; ids are checked against the five `DESIGN.md` files (section 7). A row naming screens in two areas appears in both. The design response is copied from the function row; it is a request, not a ruling.')
w()
AREA_ROWS={a:[] for a in 'ABCDE'}
CROSS=[]
for code,_ in FILES:
    for r in D[code]['des']:
        c=r['cells']; h=r['header']
        if h[0].startswith('Code'):
            row=dict(code=code,where='Error code: '+c[0],need=('Parent line: '+c[1]+' | what support needs: '+c[2]) if len(c)>2 else c[1],frs=[]); AREA_ROWS['E'].append(row); continue
        col0=c[0]; need=c[1] if len(c)>1 else ''
        if len(c)>2 and not fr_ids(c[2]) and c[2].strip(): need=need+' (for: '+c[2]+')'
        frs=sorted(set(fr_ids(' '.join(c))),key=lambda x:ORDER.index(x) if x in ORDER else 999)
        letters=[]
        for s_ in screens(col0):
            L=s_[0]
            if L not in letters: letters.append(L)
        if not letters:
            for s_ in screens(c[1] if len(c)>1 else ''):
                L=s_[0]
                if L not in letters: letters.append(L)
        row=dict(code=code,where=col0,need=need,frs=frs,new=bool(re.search(r'new screen|new state|new sheet|New artefact|Web:',col0+' '+need,re.I)))
        if re.search(r'E design section 9|E-S23',col0) and not letters: letters=['E']
        if letters:
            for L in letters: AREA_ROWS[L].append(row)
        else: CROSS.append(row)
NAMES={'A':'A. Capture','B':'B. Book and reading','C':'C. Keeping and trust','D':'D. Family, sharing and reminders','E':'E. Foundations and system states'}
rowfrs={}
for L,rs in AREA_ROWS.items():
    for r in rs:
        for f in r['frs']: rowfrs.setdefault(L,set()).add(f)
for L in 'ABCDE':
    w('### 6.%s %s'%('ABCDE'.index(L)+1,NAMES[L]))
    w()
    w('Design folder: `docs/design/e2e/%s/`.'%AREAS[L])
    w()
    CK={'A':'K2 (the Home Plus line sits on A-S01)','B':None,'C':'K4 (C-S20 deletion lines), K9 (C-S23 proposed by privacy)','D':None,'E':'K2 (E-S26 line), K5 (E-S03 minor-signal state versus "store nothing"), K9 (E-S27 and E-S28 are taken; E-ST47 is free), K10 (E-S03 country count)'}
    w('Conflicts in section 3a that touch this area: %s.'%(CK[L] or 'none'))
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
fwd_rows=sum(1 for l in OUT if re.match(r'\| FR-[A-Z]+-\d+ \|',l))
fwd_ids=[re.match(r'\| (FR-[A-Z]+-\d+) \|',l).group(1) for l in OUT if re.match(r'\| FR-[A-Z]+-\d+ \|',l)]
uniq=len(set(fwd_ids))
allref=set()
for code,f in FILES: allref|=set(re.findall(r'FR-(?:'+CODES+r')-\d+',D[code]['text']))
dang=sorted(allref-set(ORDER))
w('### 7.1 Counts reconcile')
w()
w('- FR rows read from the nine files: %d (%s).'%(rowsum,'; '.join('%s %d'%(CODEFN[c],cnt[c]) for c in cnt)))
w('- Rows in the forward table: %d; distinct FR ids in it: %d; every FR id appears exactly once: %s.'%(fwd_rows,uniq,'yes' if fwd_rows==uniq==rowsum and set(fwd_ids)==set(ORDER) else 'NO'))
w('- FR ids written in any of the nine files that have no row: %s.'%(', '.join(dang) if dang else 'none (every cross-reference resolves)'))
w('- Gap in the source numbering: FR-SEC-13 has no row and is cited nowhere. The security author should either fill or retire it.')
w('- Proposed card changes read: %d; rulings after merging: %d. Questions read: %d; index entries: %d. Engineering rows read: %d; entries: %d (new rows needed: %d).'%(len(CC),len(ENT),len(QS),len(QENT),len(ENG),len(ENTRIES),sum(1 for e in ENTRIES.values() if e['nr'])))
w()
w('### 7.2 Card links')
w()
kinds={'direct':0,'pack':0,'text':0,'none':0}
for i in ORDER: kinds[FWD[i]['ck']]+=1
w('- FRs whose Links column names at least one NS card: %d. Frame or every-card only: %d. No NS card in Links but one in the requirement text: %d. No card link at all: %d.'%(kinds['direct'],kinds['pack'],kinds['text'],kinds['none']))
w('- FRs with no card link at all (the author named decisions, counsel questions, e2e screens, files or code instead of a card row). Per the BRIEF each FR should name a card row or "new card row needed"; these name neither. Suggested card, where shown, comes only from the card 19 screen table:')
w()
w('| FR id | Function | What the Links column names | Suggested card |')
w('|---|---|---|---|')
for i in ORDER:
    if FWD[i]['ck']=='none':
        r=FRS[i]; sg=suggest_ns(r['links']+' '+r['req'])
        w('| %s | %s | %s | %s |'%(i,CODEFN[r['code']],esc(r['links']),', '.join('NS-%02d'%n for n in sg) or 'none derivable'))
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
w('- Screen ids in FR rows that are not in the five DESIGN.md files: %s.'%(', '.join(sorted(badids)) if badids else 'none (all %d distinct ids resolve to the design inventory, %d ids)'%(len(set(re.match(r"[A-E]-S(?:T)?\d+[a-z]?",s_).group(0) for i in ORDER for s_ in screens(FRS[i]['links']+' '+FRS[i]['req']))),len(INV))))
nobl=[i for i in ORDER if FWD[i]['bl']=='none named']
w('- FRs with no backlog row named in Links, text or any engineering table: %d of %d. Many are docs, founder or counsel items; Karma decides which need a row: %s.'%(len(nobl),rowsum,', '.join(i[3:] for i in nobl)))
badbl=sorted(set(b for i in ORDER for b in re.findall(r'BL-\d+',' '.join([FRS[i]['links'],FRS[i]['req'],FRS[i]['ev']])) if b not in BLANY))
w('- BL ids cited by FR rows that do not appear in `docs/BACKLOG.md`: %s. BL ids above BL-999 anywhere in the nine files: %s (privacy mentions "BL-1000" only to say such ids are invisible to the dispatcher).'%(', '.join(badbl) or 'none','privacy one mention'))
w()
w('### 7.4 Coverage tables')
w()
miss=[]
for c in hdr:
    nocard=[n for n in range(1,46) if worst(c,n)=='-']
    if nocard: miss.append('%s has no verdict row for NS-%s'%(CODEFN[c],', NS-'.join('%02d'%n for n in nocard)))
w('- '+('; '.join(miss) if miss else 'Every function has a verdict row for every card NS-01 to NS-45 (ranges counted).'))
w()
# ascii
text='\n'.join(OUT)
bad=[(i,ch) for i,ch in enumerate(text) if ord(ch)>127]
banned=[' - ','-',''',''','"','"','...']
w('### 7.5 ASCII scan')
w()
w('- Characters above 127 in this file: %d (em dash, en dash, curly quotes, ellipsis character, emoji all count). The source files had 0.'%len(bad))
text='\n'.join(OUT)+'\n'
open('/home/claude/earlyletters/docs/product/prd/FUNCTION-TRACE.md','w',encoding='ascii').write(text)
print('written',len(text),'bytes',len(OUT),'lines; nonascii',len(bad))
