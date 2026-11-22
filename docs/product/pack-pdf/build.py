#!/usr/bin/env python3
"""Assemble the Early Letters product document and print it to PDF.

Usage: python3 build.py <repo checkout with the locked cards>
"""
import re, subprocess, sys, os, datetime

REPO = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'build')
os.makedirs(OUT, exist_ok=True)

def read(p):
    return open(p, encoding='utf-8').read()

def repo(p):
    return read(os.path.join(REPO, p))

def demote(md, levels=1, strip_title=False):
    """Shift markdown headings down so a repo file nests under a chapter."""
    lines = md.split('\n')
    out = []
    in_code = False
    for i, l in enumerate(lines):
        if l.startswith('```'):
            in_code = not in_code
        if not in_code and re.match(r'^#{1,5} ', l):
            if strip_title and i == 0 and l.startswith('# '):
                continue
            l = '#' * levels + l
        out.append(l)
    return '\n'.join(out)

# Rank table from the rank file
rank = repo('docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md')
rank_rows = [l for l in rank.split('\n') if re.match(r'^\| (Rank|---|\d+) ', l) or l.startswith('|---')]
rank_tbl = '\n'.join([l for l in rank.split('\n') if l.startswith('| Rank | Was |')] +
                     [l for l in rank.split('\n') if l.startswith('|---|---|---|---|---|---|---|---|')][:1] +
                     [l for l in rank.split('\n') if re.match(r'^\| \d+ \| \d+ \| [CN]-\d+', l)])

# Dependency table and journeys from the engineering and test plans
eng = repo('docs/product/prd/13-engineering-plan.md')
m = re.search(r'(## 3\. Buckets.*?)(## 4\. Order)', eng, re.S)
dep_tbl = demote(m.group(1), 1) if m else ''
test = repo('docs/product/prd/14-test-plan.md')
m = re.search(r'## 4\. Journeys\n(.*?)\n## 5', test, re.S)
journeys = '### Parent journeys tested end to end\n\n' + (m.group(1) if m else '')

strategy = read(os.path.join(HERE, '01-strategy.md'))
product = read(os.path.join(HERE, '02-product.md')).replace('{{RANK_TABLE}}', rank_tbl)
measure = read(os.path.join(HERE, '03-measure.md'))
delivery = read(os.path.join(HERE, '04-delivery.md')).replace('{{DEP_TABLE}}', dep_tbl).replace('{{JOURNEYS}}', journeys)

# Task list from the backlog (BL-922 onward)
import subprocess as _sp, json as _json
_js = _sp.run(['node','--input-type=module','-e', """
import fs from 'fs'; import {parseBacklog, eligibility} from './scripts/agents/lib.mjs';
const t=parseBacklog(fs.readFileSync('docs/BACKLOG.md','utf8')); const by=new Map(t.map(x=>[x.id,x]));
const out=t.filter(x=>+x.id.slice(3)>=922).map(x=>{const sat=(x.block.match(/- Satisfies:\\s*([^\\n]*)/)||[])[1]||'';const size=(x.block.match(/Size:\\s*([A-Z, to]+)\\./)||[])[1]||'';return {id:x.id,title:x.title,status:x.status,statusText:x.statusText,owners:x.owners,size,sat,ok:eligibility(x,by).ok};});
console.log(JSON.stringify(out));"""], cwd=REPO, capture_output=True, text=True, check=True).stdout
_tasks = _json.loads(_js)
def _cell(t): return t.replace('|', '/').replace('\n',' ')
_rows = ['| Task | What | Owner | Size | Status and what it waits on | Satisfies |', '|---|---|---|---|---|---|']
for t in _tasks:
    st = t['statusText'] + (' (eligible now)' if t['ok'] else '')
    sat = t['sat'] if len(t['sat']) < 160 else t['sat'][:157].rsplit(' ',1)[0] + ' ...'
    _rows.append(f"| {t['id']} | {_cell(t['title'])} | {', '.join(t['owners'])} | {t['size']} | {_cell(st)} | {_cell(sat)} |")
tasks_tbl = '\n'.join(_rows)
ready_ids = ', '.join(t['id'] for t in _tasks if t['ok'])
delivery = delivery.replace('{{TASKS}}', tasks_tbl).replace('{ready}', ready_ids)

# Part III: requirements (the locked cards, in full)
cards = ['01-photo-with-a-letter', '02-find', '03-family-hears-it-pilot', '04-hands-free-capture-spike',
         '05-share-one-letter', '06-firsts-sealed-letter-quick-capture', '07-remaining-capability-rows',
         '08-keeping-and-trust', '09-capture', '10-reading-and-family', '11-foundations', '12-parked-and-not-built']
req = ['# Part III. Product requirements\n',
       'This part reproduces the locked requirement cards in full, as they stand in the repository (`docs/product/prd/`). '
       'Each card says who it is for and when, why, what and what is not in scope, the happy path, unhappy paths and edge cases, '
       'scenario coverage, acceptance criteria with priorities, non-functional budgets, state space, data and engineering detail, '
       'inventory rows, door lines, threats, design, content and legal inputs, the privacy label effect, claims, Free or Plus, '
       'measures, dependencies and open questions. Card ids (NS-nn) and row ids (NS-nn-Rn) are stable and are what the backlog, '
       'tests and the engineering plan refer to.\n',
       '## 12a. How a card is read\n', demote(re.sub(r'(?s)^.*?(### How to read a card)', r'\1', repo('docs/product/prd/README.md')).split('\n## ')[0], 0)]
for c in cards:
    md = repo(f'docs/product/prd/{c}.md')
    title = md.split('\n', 1)[0].lstrip('# ').strip()
    req.append(f'\n## {title}\n')
    req.append(demote(md, 1, strip_title=True))
requirements = '\n'.join(req)

frame = repo('docs/product/prd/00-product-frame.md')
appendix = ['# Appendix A. The product frame (repository text)\n', demote(frame, 1, strip_title=True),
            '\n# Appendix B. Engineering plan (repository text)\n', demote(eng, 1, strip_title=True),
            '\n# Appendix C. Test plan (repository text)\n', demote(test, 1, strip_title=True)]
rv2 = os.path.join(REPO, 'docs/product/prd/16-council-review-round-2.md')
if os.path.exists(rv2):
    appendix += ['\n# Appendix D. Executive review, round 2 (repository text)\n', demote(read(rv2), 1, strip_title=True)]
appendix += ['\n# Sources\n', read(os.path.join(HERE, 'sources.md'))]

today = '20 November 2026'
cover = f'''<div class="cover">
<h1 class="first">Early Letters</h1>
<div class="sub">Product vision, market, requirements and delivery plan</div>
<div class="sub">Locked v1.0 after two executive review rounds</div>
<div class="meta">Prepared by Karma (CTO role) with the executive council (Claude roles), for the founder.<br>
{today}. Source of truth: the repository <code>thesaurabhpareek/earlyletters</code>, branch <code>develop</code>, files under <code>docs/product/</code>.<br>
Every figure carries its source and date. Legal readings are the council roles' views, not legal advice: counsel must confirm them.<br>
Fictional family in all examples: Asha.</div>
</div>
'''
doc = '\n\n'.join([strategy, product, requirements, measure, delivery, '\n'.join(appendix)])
doc = re.sub(r'(?<!\\)\$', r'\\$', doc)
# House rules: replace any stray typographic punctuation
doc = doc.replace('\u2014', ', ').replace('\u2013', ' to ').replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"').replace('\u2026', '...')
open(os.path.join(OUT, 'doc.md'), 'w').write(doc)
open(os.path.join(OUT, 'cover.html'), 'w').write(cover)

subprocess.run(['pandoc', os.path.join(OUT, 'doc.md'), '-f', 'gfm', '-t', 'html5', '-s', '--toc', '--toc-depth=2',
                '--metadata', 'title=Early Letters: product vision, requirements and plan',
                '-B', os.path.join(OUT, 'cover.html'), '-c', os.path.join(HERE, 'style.css'),
                '--resource-path', HERE, '-o', os.path.join(OUT, 'doc.html')], check=True)
html = read(os.path.join(OUT, 'doc.html'))
# pandoc puts the title block before our cover; drop it and move the TOC after the cover
html = re.sub(r'<header id="title-block-header">.*?</header>', '', html, flags=re.S)
html = re.sub(r"<td>((?:<code>)?\[?(?:NS|NX|X|FRAME|BL)-?[A-Za-z0-9-]*\]?(?:</code>)?)</td>", r"<td class='rid'>\1</td>", html)
open(os.path.join(OUT, 'doc.html'), 'w').write(html)
pdf = os.path.join(OUT, 'Early-Letters-Product-Vision-Requirements-and-Plan.pdf')
subprocess.run(['google-chrome', '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                f'--print-to-pdf={pdf}', 'file://' + os.path.join(OUT, 'doc.html')], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(pdf)
