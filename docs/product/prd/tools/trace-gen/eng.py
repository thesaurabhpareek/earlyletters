import sys; sys.path.insert(0,'/home/claude/trace-gen')
from calc import *
ENG=[]  # dict(file,label,text,owner,frs,bls,kind)
for code,_ in FILES:
    sec=D[code]['engsec']
    if code=='DAT':
        for l in sec.split('\n'):
            m=re.match(r'- \*\*(.*?)\*\*:?\s*(.*)',l)
            if m:
                label=m.group(1).strip().rstrip(':'); text=m.group(2).strip()
                if label.startswith('No app code'): continue
                ENG.append(dict(file=code,label=label,text=text,owner='see label'))
            elif l.startswith('- No app code'): pass
        continue
    for h,rs in tables(sec):
        if h[0] in ('Card',): continue   # DAT events table etc
        for r in rs:
            label=r[0]
            if len(r)>=3: text=r[1]; owner=r[2]
            else: text=r[1] if len(r)>1 else ''; owner=''
            # PRV/LEG/CMP use columns (Row, What, FR) ; OPS (Row, Add, Owner); fine
            ENG.append(dict(file=code,label=label,text=text,owner=owner,rawcells=r))
for e in ENG:
    allt=e['label']+' '+e['text']+' '+(' '.join(e.get('rawcells',[])))
    e['frs']=sorted(set(fr_ids(allt)))
    e['bls']=sorted(set(re.findall(r'BL-\d+',e['label'])),key=lambda x:int(x[3:]))
    lab=e['label']
    if e['bls'] and re.match(r'(BL-|\#\d+|BL-\d+ pattern)',lab) : e['kind']='bl'
    elif re.match(r'(New|\*\*New)',lab) or lab.lower().startswith('new'): e['kind']='new'
    elif lab.startswith('BL-') : e['kind']='bl'
    elif e['file']=='MKT' or lab.startswith('ADR 0031'): e['kind']='new'
    else: e['kind']='other'
GROUPS=[
 ('free-limits', r'free-limits|Storage and egress|weekly limits job', 'Weekly Free-limits job reads Storage and egress, and NOT CHECKED fails'),
 ('mailto', r'Mail URL test|Pin the support', 'Pin every support mail target (fixed subject, empty body, no ids)'),
 ('canary', r'log canary|Log canary', 'Log canary with new-field fixtures (Find queries, labels, From names, typed days, photo paths)'),
 ('childinput', r'child-input', 'Tag the NS-16 flag child-input in the flag registry'),
 ('consentrec', r'record_policy_act|rendered_sha256|consent builder', 'Consent records: rendered text hash, app build, OS, locale, allowed method on every call site'),
 ('rulescan', r'rules\.test|rules scan|forbid scan|price scan', 'Content-rules scans extended (public-surface forbid list, price pattern, help content)'),
 ('restore', r'restore-check|Restore drill proves', 'Restore drill covers new columns and proves the purge replay'),
 ('withdraw', r'withdrawal control|Sensitive-data withdrawal', 'Sensitive-data consent withdrawal control'),
 ('gaterec', r'Gate record generator|claims diff', 'Store-candidate gate record and claims diff generator'),
 ('preflight', r'Preflight SDK|BL-958', 'Production preflight (flags, SDK guard, gate record, unknown-flag allowlist)'),
]
def gkey(e):
    if e['kind']=='bl' and e['bls']:
        if 'BL-958' in e['bls']: return 'preflight'
        return 'BL:'+', '.join(e['bls'])
    txt=e['label']+' '+e['text']
    for k,rx,_ in GROUPS:
        if re.search(rx,txt): return k
    return None
ENTRIES={}  # key -> dict
ordkeys=[]
for i,e in enumerate(ENG):
    k=gkey(e) or ('X%d'%i)
    if k not in ENTRIES: ENTRIES[k]=dict(key=k,rows=[],kind=e['kind']); ordkeys.append(k)
    ENTRIES[k]['rows'].append(e)
    if e['kind']=='new' or k in dict((g[0],1) for g in GROUPS): 
        if ENTRIES[k]['kind']!='new' and e['kind']=='new': ENTRIES[k]['kind']='new'
# preflight group: is existing BL-958 but also new rows -> keep kind bl with note
n=0
for k in ordkeys:
    en=ENTRIES[k]
    gl={g[0]:g[2] for g in GROUPS}
    r0=en['rows'][0]
    if gl.get(k): en['title']=gl[k]
    elif re.match(r'(New|ADR|Note|Existing)\b',r0['label']) and ':' not in r0['label']:
        t=r0['text']; lab=r0['label']
        body=t[:130]+('' if len(t)<=130 else ' [cont. in source]')
        en['title']=body if lab=='New' else lab+': '+body
    else: en['title']=r0['label']
    en['bls']=sorted(set(b for r in en['rows'] for b in r['bls']),key=lambda x:int(x[3:]))
    en['frs']=sorted(set(f for r in en['rows'] for f in r['frs']))
    en['files']=sorted(set(r['file'] for r in en['rows']),key=lambda c:[x[0] for x in FILES].index(c))
    if en['kind']=='new' and k!='preflight':
        n+=1; en['nr']='NR-%02d'%n
    else: en['nr']=None
FR2ENG={}
for en in ENTRIES.values():
    for f in en['frs']:
        FR2ENG.setdefault(f,[]).append(en)
