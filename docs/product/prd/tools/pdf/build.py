#!/usr/bin/env python3
"""Build the founder PDF "Early Letters: product requirements rev 2" from the locked pack.

Usage (from anywhere; nothing is written inside the repo):
  python3 -I docs/product/prd/tools/pdf/build.py [--repo ROOT] [--design-root DIR] [--out FILE] [--keep]

Defaults: ROOT is the repo this script sits in; DIR is /home/claude/wt/E (the design worktree, read only,
branch docs/e2e-ux-20nov) and falls back to ROOT when absent; FILE is /tmp/pdf/early-letters-requirements-rev2.pdf;
the work folder is /tmp/pdf/work and is deleted at the end unless --keep.

What it needs (all present on the build machine, checked 20 Nov 2026): python3, pandoc 3.1 (markdown to HTML),
wkhtmltopdf 0.12.6 (HTML to PDF; unpatched Qt, so no header, footer or toc switches),
reportlab 5 (page numbers, drawn on a transparent overlay), pypdf (merge the overlay, outline).
If pypdf is missing the PDF is still built, without page numbers or bookmarks.

Order of the PDF (the founder's item 11, the lock in 22 section 10):
  cover and status; contents;
  Part 1 mission, vision, today, market, benchmarking;
  Part 2 the final holistic spec (22, with section 7 founder answers and section 10 the lock);
  Part 3 the cards table (cards 00 to 27, one line per card from its header);
  Part 4 the site; Part 5 design (design language summary, the e2e INDEX);
  Part 6 product layer lists;
  Appendix A execution documents (23, 24, 13, the engineering project plan when present, FEEDBACK-LOOP);
  Appendix B the registry and load order; Appendix C the instruction coverage audit (25).

Rules kept by the script:
  - Source files are never edited. The product layer (Parts 1 to 6) is filtered line by line at render time:
    a line that carries a BL or PR id is left out of the PDF, and the count is printed on the status page.
    The appendices keep every id.
  - Output text is ASCII only (curly quotes, dashes, ellipsis, sub and superscripts are mapped to ASCII; anything
    else is replaced by "?" and counted). Fonts are DejaVu Sans and Liberation, so nothing draws as a box.
  - No figure is written by this script: every number in the PDF comes from a named source file or from p0.py.
"""
import argparse
import datetime
import html
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
TITLE = 'Early Letters: product requirements rev 2'
LOCK_DATE = '20 Nov 2026'  # the lock date, from 22-final-holistic-spec.md section 10; no clock is read

ID_RE = re.compile(r'\bBL-\d{3,4}\b|(?<![A-Za-z0-9&#])#\d{3,4}\b|\bPR\s?#?\d{3,4}\b')

TRANSLIT = {
    '‘': "'", '’': "'", '‚': "'", '‛': "'", '“': '"', '”': '"', '„': '"',
    '–': '-', '—': '-', '−': '-', '‐': '-', '‑': '-', '…': '...', ' ': ' ',
    '•': '-', '·': '-', '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '×': 'x',
    '≥': '>=', '≤': '<=', '≠': '!=', '≈': '~', '±': '+/-', '✓': 'yes', '✗': 'no',
    'é': 'e', 'è': 'e', 'à': 'a', 'ç': 'c', 'ü': 'u', 'ö': 'o', 'ä': 'a',
    '°': ' deg', '©': '(c)', '®': '(R)', '™': '(TM)', '½': '1/2', '¼': '1/4',
    '¾': '3/4', ' ': ' ', ' ': ' ', ' ': ' ', '​': '', '️': '', ' ': ' ',
}
STATS = {'replaced': 0, 'dropped_lines': {}, 'missing': []}


def ascii_only(text):
    out = []
    for ch in text:
        if ord(ch) < 128:
            out.append(ch)
        elif ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        else:
            nf = unicodedata.normalize('NFKD', ch)  # sub and superscript digits become plain digits
            nf = ''.join(c for c in nf if not unicodedata.combining(c))
            if nf and all(ord(c) < 128 for c in nf):
                out.append(nf)
            else:
                out.append('?')
                STATS['replaced'] += 1
    return ''.join(out)


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def maybe(path):
    if os.path.exists(path):
        return read(path)
    STATS['missing'].append(path)
    return None


def demote(md, levels, drop_title=False):
    out, fence = [], False
    first = True
    for line in md.split('\n'):
        if line.lstrip().startswith('```'):
            fence = not fence
        if not fence and re.match(r'^#{1,5} ', line):
            if drop_title and first and line.startswith('# '):
                first = False
                continue
            line = '#' * levels + line
        if line.strip():
            first = False
        out.append(line)
    return '\n'.join(out)


def filter_ids(md, label):
    """Product layer: leave out whole lines that carry a BL or PR id (render only; sources untouched)."""
    kept, dropped = [], 0
    fence = False
    for line in md.split('\n'):
        if line.lstrip().startswith('```'):
            fence = not fence
        if ID_RE.search(line):
            dropped += 1
            continue
        kept.append(line)
    STATS['dropped_lines'][label] = STATS['dropped_lines'].get(label, 0) + dropped
    return '\n'.join(kept)


def pandoc(md):
    p = subprocess.run(['pandoc', '-f', 'gfm-emoji', '-t', 'html5', '--wrap=none'], input=md.encode('utf-8'),
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if p.returncode != 0:
        sys.exit('pandoc failed: ' + p.stderr.decode('utf-8', 'replace')[:400])
    return p.stdout.decode('utf-8')


def esc(s):
    return html.escape(s, quote=True)


def first_paragraphs(md, limit):
    """Heading plus the first paragraph (up to limit characters) of each H2 section."""
    parts, cur_h, buf = [], None, []
    for line in md.split('\n') + ['## END']:
        if line.startswith('## '):
            if cur_h is not None:
                para = ''
                for blk in '\n'.join(buf).split('\n\n'):
                    b = blk.strip()
                    if b and not b.startswith('|') and not b.startswith('#'):
                        para = b
                        break
                if len(para) > limit:
                    para = para[:limit].rsplit(' ', 1)[0] + ' ...'
                parts.append('### ' + cur_h + '\n\n' + (para or '(table or list only; see the source file)'))
            cur_h, buf = line[3:].strip(), []
        else:
            buf.append(line)
    return '\n\n'.join(parts)


def table_rows(md, header_start):
    """Rows of the first markdown table whose header line starts with header_start."""
    rows, on = [], False
    for line in md.split('\n'):
        if line.startswith(header_start):
            on = True
            continue
        if on:
            if line.startswith('|---'):
                continue
            if line.startswith('|'):
                rows.append([c.strip() for c in line.strip().strip('|').split('|')])
            else:
                break
    return rows


class Doc:
    def __init__(self):
        self.parts = []  # (key, title, html, appendix)

    def add(self, key, title, body_html, appendix=False):
        self.parts.append((key, title, body_html, appendix))


CSS = """
@page { size: A4; }
body { font-family: 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif; font-size: 9.2pt; line-height: 1.38; color: #1c1c1c; }
h1 { font-size: 20pt; margin: 0 0 10pt 0; color: #2b2540; border-bottom: 2px solid #8a7fb0; padding-bottom: 4pt; }
h2 { font-size: 14pt; margin: 16pt 0 6pt 0; color: #2b2540; page-break-after: avoid; }
h3 { font-size: 11.2pt; margin: 12pt 0 4pt 0; color: #3a3358; page-break-after: avoid; }
h4, h5 { font-size: 9.8pt; margin: 9pt 0 3pt 0; color: #3a3358; page-break-after: avoid; }
p { margin: 0 0 6pt 0; word-wrap: break-word; }
li { margin: 0 0 2pt 0; word-wrap: break-word; }
code { font-family: 'DejaVu Sans Mono', monospace; font-size: 7.8pt; background: #f1eff6; padding: 0 1pt; word-wrap: break-word; }
pre { font-family: 'DejaVu Sans Mono', monospace; font-size: 7.4pt; background: #f1eff6; padding: 5pt; white-space: pre-wrap; word-wrap: break-word; page-break-inside: avoid; }
pre code { background: none; }
table { border-collapse: collapse; width: 100%; margin: 4pt 0 9pt 0; font-size: 7.4pt; line-height: 1.28; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th { background: #e6e2f1; text-align: left; border: 1px solid #b9b2d3; padding: 2.5pt 3pt; }
td { border: 1px solid #d3cfe3; padding: 2.5pt 3pt; vertical-align: top; word-wrap: break-word; }
blockquote { margin: 4pt 0 6pt 10pt; padding-left: 7pt; border-left: 3px solid #b9b2d3; color: #444; }
hr { border: 0; border-top: 1px solid #d3cfe3; margin: 10pt 0; }
.part { page-break-before: always; }
.cover { page-break-after: always; padding-top: 120pt; }
.cover h1 { font-size: 30pt; border: 0; margin-bottom: 6pt; }
.cover .sub { font-size: 13pt; color: #555; margin-bottom: 26pt; }
.status { border: 1px solid #b9b2d3; background: #f7f5fb; padding: 8pt 10pt; margin: 8pt 0; }
.small { font-size: 7.8pt; color: #555; }
.toc td { border: 0; border-bottom: 1px dotted #c9c4dc; font-size: 9pt; padding: 3pt 2pt; }
.toc td.pg { text-align: right; width: 34pt; }
.verdict { font-size: 11pt; font-weight: bold; }
"""


def wrap_html(body):
    return ('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(TITLE) + '</title><style>' + CSS +
            '</style></head><body>' + body + '</body></html>')


def run_wk(html_path, pdf_path):
    cmd = ['wkhtmltopdf', '-q', '--enable-local-file-access', '--disable-smart-shrinking', '--page-size', 'A4',
           '--margin-top', '17mm', '--margin-bottom', '18mm', '--margin-left', '15mm', '--margin-right', '15mm',
           '--encoding', 'utf-8', '--dpi', '96', html_path, pdf_path]
    env = dict(os.environ)
    env['XDG_RUNTIME_DIR'] = '/tmp/pdf/xdg'
    os.makedirs(env['XDG_RUNTIME_DIR'], mode=0o700, exist_ok=True)
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    if not os.path.exists(pdf_path):
        sys.exit('wkhtmltopdf failed: ' + p.stderr.decode('utf-8', 'replace')[-600:])


def p0_by_file(repo):
    script = os.path.join(repo, 'docs/product/prd/tools/review/p0.py')
    try:
        out = subprocess.run([sys.executable, '-I', script, repo, '--json'], stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, check=True).stdout
        rows = json.loads(out)
    except Exception as exc:  # the table still prints without the counts
        STATS['missing'].append('p0.py --json (' + str(exc)[:60] + ')')
        return {}, 0
    by = {}
    for r in rows:
        by[r['file']] = by.get(r['file'], 0) + 1
    return by, len(rows)


def git_head(repo):
    try:
        return subprocess.run(['git', '-C', repo, 'rev-parse', '--short=9', 'HEAD'], stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE, check=True).stdout.decode().strip()
    except Exception:
        return 'unknown'


def short_status(text):
    m = re.search(r'Status:\s*([^|\n]+?)(?:\s*\||\.\s|$)', text, re.M)
    s = m.group(1).strip() if m else 'no status line'
    s = re.sub(r'\s+', ' ', s)
    return s[:60]


def build_cards_table(repo, prd):
    by_file, total = p0_by_file(repo)
    files = sorted(f for f in os.listdir(prd) if re.match(r'^\d\d-.*\.md$', f))
    rows = []
    for f in files:
        txt = read(os.path.join(prd, f))
        h1 = next((ln[2:].strip() for ln in txt.split('\n') if ln.startswith('# ')), f)
        nsids = []
        for ln in txt.split('\n'):
            m = re.match(r'^#{1,3} (NS-\d+)\b', ln)
            if m and m.group(1) not in nsids:
                nsids.append(m.group(1))
        m = re.match(r'^(NS-\d+)(?: (?:to|and) (NS-\d+))?', h1)
        span = ''
        if m:
            span = m.group(1) + (' to ' + m.group(2) if m.group(2) else '')
        num = f[:2]
        rows.append((num, f, h1, span, short_status(txt), by_file.get(f, 0), txt, nsids))
    out = ['<table><thead><tr><th>Card</th><th>Covers</th><th>One-line summary (the card\'s own title)</th>'
           '<th>Status</th><th>P0 rows</th></tr></thead><tbody>']
    for num, f, h1, span, st, p0, _, _ in rows:
        title = re.sub(r'^(NS-\d+(?: (?:to|and) NS-\d+)?)[:.]\s*', '', h1)
        title = re.sub(r'^\d+\.\s*', '', title)
        out.append('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % (
            esc(num), esc(span or '-'), esc(title), esc(st), esc(str(p0) if p0 else '-')))
    out.append('</tbody></table>')
    out.append('<p class="small">Source: the H1 and Status line of each file in docs/product/prd (cards 00 to 27, '
               'file 17 is not in this branch). P0 rows are counted by tools/review/p0.py over the acceptance '
               'tables: %d rows in the cards and the function reviews together.</p>' % total)
    # per-NS lines for the multi-card files
    sub = ['### The individual cards (NS ids), one line each, from the card headings\n']
    for num, f, h1, span, st, p0, txt, nsids in rows:
        heads = [ln for ln in txt.split('\n') if re.match(r'^## NS-\d+\.', ln)]
        if not heads:
            continue
        sub.append('**Card %s** (`%s`)\n' % (num, f))
        for ln in heads:
            t = re.sub(r'^## ', '', ln)
            t = re.sub(r'\s*\((?:candidates?|kind)[^)]*\)\s*$', '', t)
            t = re.sub(r'\s*\(candidate[^)]*\)', '', t)
            sub.append('- ' + t)
        sub.append('')
    return ''.join(out), '\n'.join(sub)


def toc_html(entries, pages):
    rows = ['<table class="toc">']
    for key, title, appendix in entries:
        pg = pages.get(key)
        rows.append('<tr><td>%s</td><td class="pg">%s</td></tr>' % (esc(title), ('%3d' % pg) if pg else '&nbsp;&nbsp;&nbsp;&nbsp;'))
    rows.append('</table>')
    return ''.join(rows)


def build(args):
    repo = os.path.abspath(args.repo)
    prd = os.path.join(repo, 'docs/product/prd')
    droot = args.design_root if os.path.isdir(os.path.join(args.design_root, 'docs/design/e2e')) else repo
    work = os.path.join(os.path.dirname(os.path.abspath(args.out)), 'work')
    os.makedirs(work, exist_ok=True)
    doc = Doc()
    head = git_head(repo)

    # ---------- status data
    audit = maybe(os.path.join(prd, '25-instruction-coverage-audit.md')) or ''
    verdict = ''
    for ln in audit.split('\n'):
        if ln.startswith('Top-line verdict:'):
            verdict = ln[len('Top-line verdict:'):].strip()
            break
    readme = read(os.path.join(prd, 'README.md'))
    status_line = next((ln for ln in readme.split('\n') if ln.startswith('Author:')), '')

    # ---------- Part 1
    vision = maybe(os.path.join(repo, 'docs/product/VISION.md')) or ''
    strategy = maybe(os.path.join(repo, 'docs/product/pack-pdf/01-strategy.md')) or ''
    market = maybe(os.path.join(repo, 'docs/prd/v2/04-market.md')) or ''
    bench = maybe(os.path.join(repo, 'docs/design/BENCHMARK.md')) or ''
    sources = maybe(os.path.join(repo, 'docs/product/pack-pdf/sources.md')) or ''
    notes = maybe(os.path.join(repo, 'docs/product/pack-pdf/research-notes.md')) or ''
    p1 = ['# Part 1. Mission, vision, what we have today, market and benchmarking\n',
          'Sources, read for this part: `docs/product/VISION.md` (the one-page vision, 19 Nov 2026), '
          '`docs/product/pack-pdf/01-strategy.md` (mission and vision, what we have today, customer and need, '
          'industry and market, positioning), `docs/prd/v2/04-market.md` (the landscape, prices, positioning), '
          '`docs/design/BENCHMARK.md` (the design benchmark, 1 Oct 2026) and the source lists in '
          '`docs/product/pack-pdf/sources.md` and `research-notes.md`. Market and competitor figures are as '
          'recorded in those files with their own read dates; this PDF did not re-verify them. We have no '
          'evidence from our own families yet.\n',
          '## 1.1 The vision in one page\n', demote(vision, 2, True),
          '\n## 1.2 Mission, what we have today, the customer, the market\n', demote(strategy, 2, True),
          '\n## 1.3 Market and positioning (docs/prd/v2/04-market.md)\n', demote(market, 2, True),
          '\n## 1.4 Benchmarking (docs/design/BENCHMARK.md, summarised: heading and first paragraph of each section)\n',
          demote(first_paragraphs(bench, 700), 1),
          '\n## 1.5 Where the facts in this part come from\n', demote(sources, 2, True),
          '\n', demote(notes, 2, True)]
    doc.add('p1', 'Part 1. Mission, vision, today, market and benchmarking',
            pandoc(ascii_only(filter_ids('\n'.join(p1), 'Part 1'))))

    # ---------- Part 2
    spec = read(os.path.join(prd, '22-final-holistic-spec.md'))
    p2 = ['# Part 2. The final holistic spec\n',
          'This is `docs/product/prd/22-final-holistic-spec.md` in full, including section 7 (the founder '
          'answers and what each default means) and section 10 (the lock). Where a line carried a backlog or '
          'pull request id it is left out of this rendering and stays in the source file.\n',
          demote(spec, 1, True)]
    doc.add('p2', 'Part 2. The final holistic spec (22, with the founder answers and the lock)',
            pandoc(ascii_only(filter_ids('\n'.join(p2), 'Part 2'))))

    # ---------- Part 3
    table_html, sub_md = build_cards_table(repo, prd)
    p3 = '<h1>Part 3. The cards</h1><p>One line per card, from its own header. The full acceptance rows live in ' \
         'the card files; this table is the index. Cards 20 and 26 are the founder\'s own direction (inputs, ' \
         'carried by cards 21 and 27); 15 and 16 are council records.</p>' + table_html + \
         pandoc(ascii_only(filter_ids(sub_md, 'Part 3')))
    doc.add('p3', 'Part 3. The cards table (cards 00 to 27)', p3)

    # ---------- Part 4 site
    story = maybe(os.path.join(repo, 'docs/web/STORYBOARD.md')) or ''
    flip = maybe(os.path.join(repo, 'docs/web/launch-flip.md')) or ''
    scenes = table_rows(story, '| # | id | Tone')
    web_files = []
    for rel in ['apps/web/src/content/site.ts', 'apps/web/src/content/pricing.ts', 'apps/web/content/legal/privacy/0.9.0.md',
                'apps/web/content/legal/terms/0.9.0.md', 'docs/web/STORYBOARD.md', 'docs/web/launch-flip.md',
                'docs/web/TEAM.md', 'docs/web/copy/BR1-audit.md', 'docs/web/ambient-sound.md']:
        web_files.append('- `%s` (%s)' % (rel, 'present' if os.path.exists(os.path.join(repo, rel)) else 'not found'))
    idea = ''
    m = re.search(r'## The idea\n(.*?)\n## ', story, re.S)
    if m:
        idea = m.group(1).strip()
    rules = ''
    m = re.search(r'## Film rules \(every scene\)\n(.*?)\n## ', story, re.S)
    if m:
        rules = m.group(1).strip()
    scene_tbl = ['| Scene | Id | Tone | Length (vh) | What we see |', '|---|---|---|---|---|']
    for r in scenes:
        if len(r) >= 5:
            what = r[4]
            if len(what) > 260:
                what = what[:260].rsplit(' ', 1)[0] + ' ...'
            scene_tbl.append('| %s | %s | %s | %s | %s |' % (r[0], r[1], r[2], r[3], what))
    p4 = ['# Part 4. The site (earlyletters.com)\n',
          'Item 11 of the founder\'s instructions asked for the site in the PDF. The site is a scroll film built '
          'from `apps/web`; its structure is in `docs/web/STORYBOARD.md` (v0, 3 Oct 2026, owner: coordinator) and '
          'its words are in `apps/web/src/content/site.ts`, which this PDF does not reproduce. Public words are '
          'the founder\'s to approve (22 section 7). What exists, by file:\n', '\n'.join(web_files), '',
          '## 4.1 The idea of the site (STORYBOARD.md)\n', idea, '',
          '## 4.2 Film rules for every scene (STORYBOARD.md)\n', rules, '',
          '## 4.3 The scenes (STORYBOARD.md, first columns; the motion idea and owner are in the source)\n',
          '\n'.join(scene_tbl), '',
          '## 4.4 Launch flip (docs/web/launch-flip.md)\n', demote(flip, 2, True)]
    doc.add('p4', 'Part 4. The site', pandoc(ascii_only(filter_ids('\n'.join(p4), 'Part 4'))))

    # ---------- Part 5 design
    dl = maybe(os.path.join(droot, 'docs/design/DESIGN_LANGUAGE.md')) or maybe(os.path.join(repo, 'docs/design/DESIGN_LANGUAGE.md')) or ''
    idx = maybe(os.path.join(droot, 'docs/design/e2e/INDEX.md')) or ''
    p5 = ['# Part 5. Design\n',
          'Design is read from the design branch (`docs/e2e-ux-20nov`, read only, worktree %s): the design '
          'language summary (`docs/design/DESIGN_LANGUAGE.md`: the heading and first paragraph of each section) '
          'and the end-to-end index (`docs/design/e2e/INDEX.md`, every screen of areas A to E). The design '
          'system, motion and words files of each area are listed in the registry (Appendix B); they are not '
          'copied here.\n' % ('(the design root)' if droot != repo else '(not found; the repo copy was used)'),
          '## 5.1 Design language, summary\n', demote(first_paragraphs(dl, 800), 1),
          '\n## 5.2 End-to-end screen index (docs/design/e2e/INDEX.md)\n', demote(idx, 2, True)]
    doc.add('p5', 'Part 5. Design (design language summary, the e2e index)',
            pandoc(ascii_only(filter_ids('\n'.join(p5), 'Part 5'))))

    # ---------- Part 6 product layer lists
    registry = read(os.path.join(prd, 'REGISTRY.md'))
    frows = table_rows(registry, '| Id | Path | Layer | Status | Owner | Replaces | Load when | Lines |')
    # the first table is section 1 (cards); function reviews are the rows whose path contains /functions/
    fn = [r for r in _all_registry_rows(registry) if len(r) >= 8 and '/functions/' in r[1]]
    ft = ['| Id | File | Owner | Use it for |', '|---|---|---|---|']
    for r in fn:
        ft.append('| %s | %s | %s | %s |' % (r[0], os.path.basename(r[1].strip('`')).replace('`', ''), r[4], r[6]))
    verb = maybe(os.path.join(prd, 'FOUNDER-MESSAGES-VERBATIM.md')) or ''
    instr = ''
    m = re.search(r'## Instruction index\n(.*)$', verb, re.S)
    if m:
        instr = m.group(1).strip()
    parked = maybe(os.path.join(prd, '12-parked-and-not-built.md')) or ''
    p6 = ['# Part 6. Product layer lists\n',
          'Lists a parent-facing reader needs, each from one source file. The product layer carries no backlog '
          'or pull request ids; the execution layer (Appendix A) holds them and maps back.\n',
          '## 6.1 The function reviews (docs/product/prd/functions, 23 files)\n', '\n'.join(ft), '',
          '## 6.2 What we said no to, and what would change our mind (card 12)\n', demote(parked, 2, True), '',
          '## 6.3 The founder\'s instructions, as indexed (FOUNDER-MESSAGES-VERBATIM.md)\n', instr]
    doc.add('p6', 'Part 6. Product layer lists', pandoc(ascii_only(filter_ids('\n'.join(p6), 'Part 6'))))

    # ---------- Appendices (ids kept)
    def appendix(key, title, files, intro):
        body = ['# ' + title + '\n', intro + '\n']
        for label, path in files:
            txt = maybe(path) if not path.startswith('@git:') else git_show(repo, path[5:])
            if txt is None:
                body.append('## %s\n\n(file not found in this checkout: `%s`)\n' % (label, path))
                continue
            body.append(demote(txt, 1))
        doc.add(key, title, pandoc(ascii_only('\n'.join(body))), appendix=True)

    plan17 = os.path.join(prd, '17-engineering-project-plan.md')
    if not os.path.exists(plan17):
        plan17 = '@git:origin/docs/engineering-project-plan-20nov:docs/product/prd/17-engineering-project-plan.md'
    appendix('a', 'Appendix A. Execution documents',
             [('23', os.path.join(prd, '23-dependency-map-and-plan.md')),
              ('24', os.path.join(prd, '24-engineering-handoff.md')),
              ('13', os.path.join(prd, '13-engineering-plan.md')),
              ('17', plan17),
              ('FEEDBACK-LOOP', os.path.join(prd, 'FEEDBACK-LOOP.md'))],
             'Dependency map and plan (23), engineering handoff (24), the engineering plan (13), the engineering '
             'project plan (17, from its own branch when it is not in this checkout) and the requirements feedback '
             'loop. Backlog and pull request ids are kept in this appendix: it is the execution layer.')
    appendix('b', 'Appendix B. The registry and load order',
             [('REGISTRY', os.path.join(prd, 'REGISTRY.md')), ('LOAD-ORDER', os.path.join(prd, 'LOAD-ORDER.md'))],
             'Every file of the locked pack by id, with layer, status, owner, load-when and size; and the least '
             'each role reads. The registry also says which layer each backlog and pull request id lives in.')
    appendix('c', 'Appendix C. Instruction coverage audit (final)',
             [('25', os.path.join(prd, '25-instruction-coverage-audit.md'))],
             'The audit of the founder\'s 33 instructions against the pack, and the readiness checklist.')

    # ---------- cover and TOC
    entries = [(k, t, a) for k, t, _, a in doc.parts]
    dropped = sum(STATS['dropped_lines'].values())
    cover = ('<div class="cover"><h1>%s</h1><div class="sub">Locked %s. Requirements rev 2: cards 00 to 27, '
             '23 function reviews, design areas A to E.</div>' % (esc(TITLE), LOCK_DATE))
    cover += '<div class="status"><b>Status.</b> %s</div>' % esc(ascii_only(status_line.replace('`', '')))
    if verdict:
        cover += '<div class="status verdict">Readiness to start development: %s</div>' % esc(ascii_only(verdict))
    cover += ('<div class="status small">Built from commit %s of the repository by '
              'docs/product/prd/tools/pdf/build.py. The product layer (Parts 1 to 6) leaves out %d source lines that '
              'carry backlog or pull request ids (per part: %s); the appendices keep every id. Nothing in the source '
              'files was changed to make this PDF. The founder wanted the PDF on Drive: the file is not uploaded '
              'by this script.</div></div>' % (
                  esc(head), dropped, esc(', '.join('%s %d' % (k, v) for k, v in sorted(STATS['dropped_lines'].items())))))

    def full_html(pages):
        body = [cover, '<div class="part"><h1>Contents</h1>', toc_html(entries, pages), '</div>']
        for key, title, body_html, appendix in doc.parts:
            body.append('<div class="part">' + body_html + '</div>')
        return wrap_html(''.join(body))

    # pass 1: no page numbers in the contents
    h1 = os.path.join(work, 'pass1.html')
    pdf1 = os.path.join(work, 'pass1.pdf')
    with open(h1, 'w', encoding='utf-8') as fh:
        fh.write(full_html({}))
    run_wk(h1, pdf1)
    pages = locate_parts(pdf1, entries)
    # pass 2: contents with page numbers (same line count, so the pagination does not move)
    h2 = os.path.join(work, 'pass2.html')
    pdf2 = os.path.join(work, 'pass2.pdf')
    with open(h2, 'w', encoding='utf-8') as fh:
        fh.write(full_html(pages))
    run_wk(h2, pdf2)
    finish(pdf2, args.out, entries, locate_parts(pdf2, entries))
    return pages


def git_show(repo, spec):
    ref, path = spec.split(':', 1)
    p = subprocess.run(['git', '-C', repo, 'show', ref + ':' + path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        STATS['missing'].append(spec)
        return None
    return p.stdout.decode('utf-8')


def _all_registry_rows(md):
    rows = []
    for line in md.split('\n'):
        if line.startswith('| ') and not line.startswith('| Id ') and not line.startswith('|---'):
            rows.append([c.strip() for c in line.strip().strip('|').split('|')])
    return rows


def locate_parts(pdf_path, entries):
    try:
        from pypdf import PdfReader
    except ImportError:
        return {}
    rd = PdfReader(pdf_path)
    texts = [(pg.extract_text() or '') for pg in rd.pages]
    found = {}
    start = 2  # skip the cover and the contents pages when searching
    for key, title, _ in entries:
        head = re.sub(r'\s+', ' ', title).strip().split('.')[0] + '.'  # "Part 1." or "Appendix A."
        for i in range(start, len(texts)):
            flat = re.sub(r'\s+', ' ', texts[i])
            if flat.lstrip().startswith(head) or (head in flat[:200]):
                found[key] = i + 1
                start = i
                break
    return found


def finish(pdf_in, out, entries, pages):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
    except ImportError:
        shutil.copyfile(pdf_in, out)
        print('pypdf or reportlab missing: PDF written without page numbers or bookmarks')
        return
    rd = PdfReader(pdf_in)
    n = len(rd.pages)
    ov = os.path.join(os.path.dirname(pdf_in), 'overlay.pdf')
    c = canvas.Canvas(ov, pagesize=A4)
    for i in range(n):
        c.setFont('Helvetica', 7.5)
        c.setFillGray(0.4)
        if i > 0:
            c.drawString(42, 28, TITLE)
            c.drawRightString(A4[0] - 42, 28, 'Page %d of %d' % (i + 1, n))
        c.showPage()
    c.save()
    ovr = PdfReader(ov)
    w = PdfWriter()
    for i, pg in enumerate(rd.pages):
        pg.merge_page(ovr.pages[i])
        w.add_page(pg)
    for key, title, _ in entries:
        if key in pages:
            w.add_outline_item(title, pages[key] - 1)
    w.add_metadata({'/Title': TITLE, '/Author': 'product', '/Subject': 'Locked requirements pack, rev 2',
                    '/CreationDate': 'D:20261120000000Z', '/ModDate': 'D:20261120000000Z',
                    '/Producer': 'wkhtmltopdf, reportlab, pypdf'})
    with open(out, 'wb') as fh:
        w.write(fh)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', default=DEFAULT_REPO)
    ap.add_argument('--design-root', default='/home/claude/wt/E')
    ap.add_argument('--out', default='/tmp/pdf/early-letters-requirements-rev2.pdf')
    ap.add_argument('--keep', action='store_true')
    args = ap.parse_args()
    for tool in ('pandoc', 'wkhtmltopdf'):
        if not shutil.which(tool):
            sys.exit(tool + ' not found')
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    pages = build(args)
    work = os.path.join(os.path.dirname(os.path.abspath(args.out)), 'work')
    if not args.keep:
        shutil.rmtree(work, ignore_errors=True)
        shutil.rmtree('/tmp/pdf/xdg', ignore_errors=True)
    print('written', args.out)
    print('part start pages (pass 1):', pages)
    print('lines left out of the product layer:', STATS['dropped_lines'])
    print('non-ASCII characters replaced by "?":', STATS['replaced'])
    if STATS['missing']:
        print('missing inputs:', STATS['missing'])


if __name__ == '__main__':
    main()
