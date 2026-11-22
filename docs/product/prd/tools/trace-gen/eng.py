from calc import *
ENG=[]  # dict(file,label,text,owner,frs,bls,kind)
for code,_ in FILES:
    for r in D[code]['eng']:
        e=dict(file=code,label=r['label'],text=r['text'],owner=r['owner'],rawcells=r['rawcells'])
        ENG.append(e)
def classify(e):
    lab=e['label']; txt=e['text']; code=e['file']
    allt=lab+' '+txt+' '+(' '.join(e.get('rawcells',[])))
    e['frs']=sorted(set(fr_ids(allt,code)))
    if code in FIRST:
        e['bls']=sorted(set(re.findall(r'BL-\d+',lab)),key=lambda x:int(x[3:]))
        if e['bls'] and re.match(r'(BL-|\#\d+|BL-\d+ pattern)',lab): e['kind']='bl'
        elif re.match(r'(New|\*\*New)',lab) or lab.lower().startswith('new'): e['kind']='new'
        elif lab.startswith('BL-'): e['kind']='bl'
        elif code=='MKT' or lab.startswith('ADR 0031'): e['kind']='new'
        else: e['kind']='other'
        return
    first_bl=re.findall(r'BL-\d+',txt)[:1]
    alls=sorted(set(re.findall(r'BL-\d+',lab+' '+txt)),key=lambda x:int(x[3:]))
    if re.match(r'(No row|No app code|None)\b',lab) or (lab=='Note' and not txt.startswith('`')):
        e['kind']='other'; e['bls']=alls
    elif re.match(r'(New|BL-new)',lab):
        e['kind']='new'; e['bls']=alls
    elif re.match(r'BL-\d+',lab):
        e['kind']='bl'; e['bls']=sorted(set(re.findall(r'BL-\d+',lab)),key=lambda x:int(x[3:]))
    elif lab=='Change':
        e['kind']='bl'; e['bls']=first_bl or alls
    elif re.search(r'BL-\d+ \(change\)',txt):
        e['kind']='bl'; e['bls']=re.findall(r'BL-\d+(?= \(change\))',txt)
    elif re.match(r'BL-\d+',txt.split(' | ')[-1].strip()) and not re.search(r'new row',txt,re.I):
        e['kind']='bl'; e['bls']=re.findall(r'BL-\d+',txt.split(' | ')[-1])[:1]
    else:
        e['kind']='new'; e['bls']=alls
for e in ENG: classify(e)
GROUPS=[
 ('free-limits', r'free-limits|Storage and egress|weekly limits job', 'Weekly Free-limits job reads Storage and egress, and NOT CHECKED fails'),
 ('mailto', r'Mail URL test|Pin the support', 'Pin every support mail target (fixed subject, empty body, no ids)'),
 ('canary', r'log canary|Log canary|Canary: synthetic|canary extension', 'Log canary with new-field fixtures (Find queries, labels, From names, typed days, photo paths, suggestion titles, tradition and day keys)'),
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
ENTRIES={}
ordkeys=[]
for i,e in enumerate(ENG):
    k=gkey(e) or ('X%d'%i)
    if k not in ENTRIES: ENTRIES[k]=dict(key=k,rows=[],kind=e['kind']); ordkeys.append(k)
    ENTRIES[k]['rows'].append(e)
    if e['kind']=='new' or k in dict((g[0],1) for g in GROUPS):
        if ENTRIES[k]['kind']!='new' and e['kind']=='new': ENTRIES[k]['kind']='new'
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
    else: en['title']=r0['label'][:160]+('' if len(r0['label'])<=160 else ' [cont. in source]')
    en['bls']=sorted(set(b for r in en['rows'] for b in r['bls']),key=lambda x:int(x[3:]))
    en['frs']=sorted(set(f for r in en['rows'] for f in r['frs']),key=lambda x:ORDER.index(x) if x in ORDER else 9999)
    en['files']=sorted(set(r['file'] for r in en['rows']),key=lambda c:[x[0] for x in FILES].index(c))
    if en['kind']=='new' and k!='preflight':
        n+=1; en['nr']='NR-%02d'%n
    else: en['nr']=None
FR2ENG={}
for en in ENTRIES.values():
    for f in en['frs']:
        FR2ENG.setdefault(f,[]).append(en)
