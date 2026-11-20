import sys; sys.path.insert(0,'/home/claude/trace-gen')
from model import *
PW=re.compile(r'frame|every card|all cards|each card|all e2e|every screen|all areas|all cards',re.I)
CODEFN={'SUP':'support','POL':'policy','MKT':'marketing','OPS':'operations','FIN':'finance','DAT':'data','PRV':'privacy','LEG':'legal','CMP':'compliance','SEC':'security','RSK':'risk'}
def esc(s): return s.replace('|','/').replace('\n',' ')
def prio(cell):
    m=re.match(r'(P[0-3])',cell)
    if not m: return esc(cell[:20])+' *'
    first=m.group(1)
    rs=[]
    for x in re.findall(r'\(([abc])\b',cell):
        if x not in rs: rs.append(x)
    others=[p for p in re.findall(r'P[0-3]',cell) if p!=first]
    s=first+(' (%s)'%','.join(rs) if rs else '')
    if others: s+=' *'
    return s
def runs(nums):
    nums=sorted(set(nums)); out=[];i=0
    while i<len(nums):
        j=i
        while j+1<len(nums) and nums[j+1]==nums[j]+1: j+=1
        out.append((nums[i],nums[j])); i=j+1
    return out
def cardcell(r,flag_none=True):
    links=r['links']; rows=ns_rows(links); allns=sorted(set(ns_expand(links)))
    parts=[]
    if allns:
        i=0
        for a,b in runs(allns):
            if b-a>=3 and not any(rows.get(n) for n in range(a,b+1)):
                parts.append('NS-%02d to NS-%02d'%(a,b))
            else:
                for n in range(a,b+1):
                    parts.append('NS-%02d'%n+((' '+' '.join(rows[n])) if rows.get(n) else ''))
        s='; '.join(parts)
        if PW.search(links): s+='; plus pack-wide'
        return s,'direct'
    if PW.search(links): return 'pack-wide (frame or every card)','pack'
    tx=sorted(set(ns_expand(r['req'])))
    if tx: return '(from text) '+', '.join('NS-%02d'%n for n in tx),'text'
    sg=suggest_ns(links+' '+r['req'])
    return 'NO CARD LINK'+((' (suggested via card 19 screen table: '+', '.join('NS-%02d'%n for n in sg)+')') if sg else ''),'none'
def e2ecell(r):
    sl=screens(r['links']); src=''
    if not sl:
        sl=screens(r['req']); src=' (text)' if sl else ''
    new=bool(re.search(r'new screen|new state|new sheet',r['links'],re.I))
    s=', '.join(sl[:8])+(' +%d more'%(len(sl)-8) if len(sl)>8 else '')
    if s: s+=src
    if new: s=(s+'; ' if s else '')+'new screen needed'
    return s or '-'
