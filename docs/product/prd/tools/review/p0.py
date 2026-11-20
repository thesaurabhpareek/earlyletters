#!/usr/bin/env python3
"""P0 register and backlog-gap finder for the PRD cards and function reviews.

Usage (from the repo root or anywhere):
  python3 -I p0.py <repo-root>            register table (card, P0 rows, reasons)
  python3 -I p0.py <repo-root> --gaps     gap report as markdown (counts, list, weak tier)
  python3 -I p0.py <repo-root> --md       the gap list (gap and card-level rows) as markdown
  python3 -I p0.py <repo-root> --groups   gap rows per proposed group (see BACKLOG-GAPS.md)
  python3 -I p0.py <repo-root> --json     every P0 row with its coverage, as JSON

What it reads
  Cards docs/product/prd/NN-*.md for NN 00 to 27 (27 holds NS-51 and NS-52) and docs/product/prd/functions/*.md
  (except BRIEF.md). An acceptance row is a markdown table row whose first cell
  is a row id and whose Priority column (found from the table header) starts
  with P0. quality.md also carries a copy of the P0 register for other
  files' FR rows; rows there whose id prefix is not FR-QAL are skipped.
  14-test-plan.md holds the register itself, not acceptance rows, so it is
  not read.

Coverage tiers, strongest first
  1 row     a backlog block in docs/BACKLOG.md names the row id, or a range
            ("NS-13-R1 to NS-13-R33", "NS-01-R38a to R38c") that contains it.
            A mention without a letter suffix (NS-01-R9) covers R9a and R9b.
  2 cite    the row's own text cites BL-nnn and that heading exists.
  3 card    only the whole card is named by a backlog block's Satisfies line.
            A band of the gap list, not counted as covered: gate G0 needs each
            P0 row to name a backlog row.
  gap       none of the above.

The dispatcher (scripts/agents/lib.mjs) reads headings matching
`^#### (BL-\\d{3})\\s+` only, so only headings count as existing backlog rows.
"""
import re, sys, glob, os, json, collections

ROW_ID = re.compile(r'^\[?([A-Z][A-Z0-9]*(?:-[A-Za-z0-9]+)+)\]?$')
BL = re.compile(r'\bBL-(\d{3,4})\b')
# NS row ids: NS-06-A2a, NS-01-R9b, NS-07-C5-3, NS-07-G11-1a
NSID = re.compile(r'NS-(\d+)-([A-Z])(\d+)(?:-(\d+))?([a-z])?')


def norm(card, letter, d1, d2, suf):
    """(card, group, num, suffix) for an NS row id."""
    if d2 is not None:
        return ('NS-' + card, letter + d1, int(d2), suf or '')
    return ('NS-' + card, letter, int(d1), suf or '')


def parse_ns(s):
    m = NSID.fullmatch(s)
    return norm(*m.groups()) if m else None


def read_backlog(root):
    text = open(os.path.join(root, 'docs/BACKLOG.md'), encoding='utf-8').read().split('\n')
    blocks = collections.OrderedDict()
    cur = None
    for line in text:
        if line.startswith('## '):
            cur = None
        m = re.match(r'^#### (BL-\d{3})\s+(.*)$', line)
        if m:
            cur = m.group(1)
            blocks[cur] = {'title': m.group(2), 'lines': [], 'status': ''}
            continue
        if cur:
            blocks[cur]['lines'].append(line)
            sm = re.match(r'^- Status:\s*([^.]*)', line)
            if sm and not blocks[cur]['status']:
                blocks[cur]['status'] = sm.group(1).strip()
    return blocks


TOK = re.compile(
    r'NS-\d+-[A-Z]\d+(?:-\d+)?[a-z]?'            # full NS row id
    r'|\[?(?:X\d+|FRAME)-[A-Za-z0-9]+\]?'        # X4-R1, FRAME-SLIP
    r'|(?<=[,&] )[AR]\d+[a-z]?\b|(?<=to )[AR]\d+[a-z]?\b|(?<=and )[AR]\d+[a-z]?\b'  # bare R40 after an id
    r'|NS-\d+(?![-\d])'                           # whole card
)


def mentions(lines):
    """Return (exact_ns_ids set of tuples, ranges list, literal ids set, cards set)."""
    exact, ranges, lits, cards = set(), [], set(), set()
    for line in lines:
        last = None  # last full NS id tuple on this line
        toks = [(m.start(), m.end(), m.group(0)) for m in TOK.finditer(line)]
        i = 0
        while i < len(toks):
            s, e, t = toks[i]
            tt = t.strip('[]')
            ns = None
            if NSID.fullmatch(tt):
                ns = parse_ns(tt)
            elif re.fullmatch(r'[AR]\d+[a-z]?', tt) and last and i > 0 and line[toks[i - 1][1]:s] in (', ', ' and ', ' to ', ', and ', ' & '):
                m = re.fullmatch(r'([AR])(\d+)([a-z]?)', tt)
                ns = (last[0], m.group(1) if last[1] in ('A', 'R') or last[1][0] == m.group(1) else last[1][0], int(m.group(2)), m.group(3))
                # bare ids keep the card of the previous id and the letter given
                if ns[1] != last[1]:
                    ns = (last[0], m.group(1), int(m.group(2)), m.group(3))
            elif re.fullmatch(r'NS-\d+', tt):
                cards.add(tt)
                i += 1
                continue
            else:
                lits.add(tt)
                i += 1
                continue
            if ns is None:
                i += 1
                continue
            last = ns
            # range: "X to Y" with only " to " between
            if i + 1 < len(toks):
                s2, e2, t2 = toks[i + 1]
                if line[e:s2] == ' to ':
                    t2s = t2.strip('[]')
                    hi = None
                    if NSID.fullmatch(t2s):
                        hi = parse_ns(t2s)
                    elif re.fullmatch(r'[AR]\d+[a-z]?', t2s):
                        m = re.fullmatch(r'([AR])(\d+)([a-z]?)', t2s)
                        hi = (ns[0], m.group(1), int(m.group(2)), m.group(3))
                    if hi and hi[0] == ns[0] and hi[1] == ns[1]:
                        ranges.append((ns, hi))
                        last = hi
                        i += 2
                        continue
            exact.add(ns)
            i += 1
    return exact, ranges, lits, cards


def row_covered(rid, exact, ranges, lits):
    ns = parse_ns(rid.strip('[]'))
    if ns is None:
        return rid in lits or rid.strip('[]') in lits
    card, grp, num, suf = ns
    for e in exact:
        if e[:3] == ns[:3] and (e[3] == suf or e[3] == ''):
            return True
    for lo, hi in ranges:
        if lo[0] == card and lo[1] == grp and lo[2] <= num <= hi[2]:
            return True
    return False


def read_rows(root):
    base = os.path.join(root, 'docs/product/prd')
    files = [f for f in sorted(glob.glob(os.path.join(base, '[0-9][0-9]-*.md'))) if int(os.path.basename(f)[:2]) <= 27 and os.path.basename(f)[:2] != '14']
    files += [f for f in sorted(glob.glob(os.path.join(base, 'functions', '*.md'))) if not f.endswith('BRIEF.md')]
    rows = []
    card_text_bl = {}
    for f in files:
        rel = os.path.relpath(f, base)
        raw = open(f, encoding='utf-8').read()
        card_text_bl[rel] = sorted({'BL-' + m for m in BL.findall(raw)})
        pri = None
        for line in raw.split('\n'):
            if not line.startswith('|'):
                pri = pri if line.strip() == '' and False else None
                continue
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if cells and cells[0].strip('`') in ('Id', 'ID', 'Row'):
                pri = next((i for i, c in enumerate(cells) if c.lower() == 'priority'), None)
                continue
            if pri is None or len(cells) <= pri:
                continue
            m = ROW_ID.match(cells[0].strip('`'))
            if not m:
                continue
            if not re.match(r'^\**P0\b', cells[pri]):
                continue
            rid = m.group(1)
            if rel == 'functions/quality.md' and rid.startswith('FR-') and not rid.startswith('FR-QAL'):
                continue
            reasons = sorted(set(re.findall(r'\(([abc])\)', cells[pri])))
            rows.append({'id': rid, 'file': rel, 'reasons': reasons, 'one_line': cells[1] if len(cells) > 1 else '', 'cells': ' '.join(cells)})
    return rows, card_text_bl


def card_of(rid):
    m = re.match(r'(NS-\d+|FR-[A-Z]+|X\d+|FRAME)', rid)
    return m.group(1) if m else rid


def from_gaps(b):
    """True for the 38 proposed rows filed from BACKLOG-GAPS.md."""
    return b['status'].lower().startswith('proposed (docs/product/prd/backlog-gaps')


def usable(b):
    """A backlog row counts as covering only if it delivers: not superseded or
    withdrawn, not one of the review or requirement-writing rows, and not one of the proposals filed from BACKLOG-GAPS.md."""
    st = b['status'].lower()
    # the 38 rows filed from BACKLOG-GAPS.md are the proposals for the gaps this script lists: they must not hide the gaps they propose to close
    if from_gaps(b):
        return False
    if st.startswith(('superseded', 'withdrawn', 'cancelled')):
        return False
    return not re.match(r'(Function review|End-to-end experience|Requirements from|Requirements completion)', b['title'])


def analyse(root):
    blocks = read_backlog(root)
    rows, card_text_bl = read_rows(root)
    per_bl = {k: mentions(v['lines'] + [v['title']]) for k, v in blocks.items()}
    # whole-card mentions: only a "Satisfies:" line that names the card itself
    # (not "sections of" lists and not the founder-instruction review rows)
    card_named = collections.defaultdict(set)
    for k, v in blocks.items():
        if from_gaps(v):
            continue
        for line in v['lines']:
            if line.startswith('- Satisfies:') and 'sections of' not in line and "founder's 20 Nov" not in line:
                for c in mentions([line])[3]:
                    card_named[c].add(k)
    seen = set()
    out = []
    for r in rows:
        key = (r['id'], r['file'])
        if key in seen:
            continue
        seen.add(key)
        tier, by = 'gap', []
        for k, (ex, rg, lt, cd) in per_bl.items():
            if row_covered(r['id'], ex, rg, lt):
                by.append(k)
        cites = sorted({'BL-' + m for m in BL.findall(r['cells'])})
        existing = [c for c in cites if c in blocks]
        missing = [c for c in cites if c not in blocks]
        by = [b for b in by if usable(blocks[b])]
        existing = [c for c in existing if usable(blocks[c])]
        if by:
            tier = 'row'
        elif existing:
            tier = 'cite'
        else:
            weak = set(card_named.get(card_of(r['id']), ()))
            if weak:
                tier = 'card-only'
                by = sorted(weak)
        r.update({'tier': tier, 'bl': by or existing, 'cited_missing': missing, 'card': card_of(r['id'])})
        out.append(r)
    return out, blocks


# ---- proposed grouping into new backlog rows (see BACKLOG-GAPS.md) ----
def _n(rid):
    m = re.search(r'-(\d+)[a-z]?$', rid)
    return int(m.group(1)) if m else 0


AIS = {
    'G22': {1, 2, 3, 6, 7, 8, 35, 39, 40, 45, 54, 56},
    'G23': {9, 10, 13, 15, 16, 17, 19, 43},
    'G24': {21, 23, 25, 26, 27, 29, 33, 34},
    'G25': {36, 37, 46, 47, 48, 49, 50, 51, 53},
}
NS_GROUP = {'NS-03': 'G02', 'NS-08': 'G03', 'NS-09': 'G04', 'NS-14': 'G04', 'NS-17': 'G05',
            'NS-19': 'G06', 'NS-21': 'G06', 'NS-24': 'G06', 'NS-35': 'G06', 'NS-37': 'G06',
            'NS-33': 'G07', 'NS-34': 'G08', 'NS-36': 'G09', 'NS-38': 'G10', 'NS-39': 'G11',
            'NS-40': 'G12', 'NS-41': 'G13', 'NS-42': 'G14', 'NS-43': 'G15', 'NS-44': 'G16',
            'NS-45': 'G17', 'NS-46': 'G18', 'NS-50': 'G18', 'NS-47': 'G19', 'NS-48': 'G20',
            'NS-49': 'G21'}
FR_GROUP = {'FR-LOC': 'G05', 'FR-QAL': 'G08', 'FR-CMP': 'G10', 'FR-DAY': 'G18', 'FR-CUL': 'G19',
            'FR-NTC': 'G20', 'FR-PHS': 'G21', 'FR-OPP': 'G21', 'FR-BKO': 'G26', 'FR-OPS': 'G26',
            'FR-FIN': 'G26', 'FR-REL': 'G27', 'FR-LCY': 'G27', 'FR-SEC': 'G28', 'FR-RSK': 'G28',
            'FR-DAT': 'G29', 'FR-PRV': 'G30', 'FR-LEG': 'G31', 'FR-PRT': 'G31', 'FR-MKT': 'G32',
            'FR-SUP': 'G33', 'FR-POL': 'G33', 'FR-RSH': 'G34', 'FR-MSG': 'G35'}


# first id number added to each function file by the 20 Nov addenda (photo moments and pictures and videos). FR rows from
# this number on are group G38; the rows below it are the ones the grouping above was written for.
ADDENDUM_FROM = {'PRV': 36, 'LEG': 21, 'CMP': 22, 'SEC': 27, 'RSK': 7, 'PHS': 58, 'DAT': 36, 'FIN': 25, 'OPS': 37, 'REL': 62,
                 'BKO': 28, 'PRT': 48, 'AIS': 57, 'RSH': 30, 'QAL': 25, 'LOC': 30, 'LCY': 35, 'MSG': 39, 'MKT': 35, 'SUP': 24,
                 'NTC': 22, 'DAY': 26, 'CUL': 28, 'OPP': 13, 'POL': 14}
NS_GROUP.update({'NS-51': 'G36', 'NS-52': 'G37'})


def group_of(r):
    if r['tier'] == 'card-only':
        return 'G01'
    if r['card'].startswith('FR-') and _n(r['id']) >= ADDENDUM_FROM.get(r['card'][3:], 10 ** 6):
        return 'G38'
    if r['card'] == 'FR-AIS':
        n = _n(r['id'])
        return next(g for g, ids in AIS.items() if n in ids)
    return NS_GROUP.get(r['card']) or FR_GROUP[r['card']]


def card_key(c):
    m = re.match(r'NS-(\d+)', c)
    return (0, int(m.group(1)), '') if m else (1, 0, c)


def main():
    root = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else ''
    out, blocks = analyse(root)
    if mode == '--json':
        print(json.dumps([{k: v for k, v in r.items() if k != 'cells'} for r in out], indent=1))
        return
    cards = collections.OrderedDict()
    for r in sorted(out, key=lambda r: (card_key(r['card']), 0)):
        cards.setdefault(r['card'], []).append(r)
    if mode == '--gaps':
        print('| Card | P0 rows | Row-covered | Cite-covered | Card-only (weak) | Gap |')
        print('|---|---|---|---|---|---|')
        t = collections.Counter()
        for c, rs in cards.items():
            n = collections.Counter(r['tier'] for r in rs)
            print(f"| {c} | {len(rs)} | {n['row']} | {n['cite']} | {n['card-only']} | {n['gap']} |")
            t.update(n)
        print(f"| TOTAL | {len(out)} | {t['row']} | {t['cite']} | {t['card-only']} | {t['gap']} |")
        return
    if mode == '--groups':
        g = collections.OrderedDict()
        for r in out:
            if r['tier'] in ('gap', 'card-only'):
                g.setdefault(group_of(r), []).append(r)
        for k in sorted(g):
            print(k, len(g[k]), ' '.join(r['id'] for r in g[k]))
        return
    if mode == '--md':
        for c, rs in cards.items():
            g = [r for r in rs if r['tier'] in ('gap', 'card-only')]
            if not g:
                continue
            print(f"\n### {c} ({len(g)} of {len(rs)} P0 rows)\n")
            print('| Row | One line | Card file | Band | Group |')
            print('|---|---|---|---|---|')
            for r in g:
                one = re.sub(r'\s+', ' ', r['one_line']).replace('|', '/')
                one = one if len(one) <= 110 else one[:100].rsplit(' ', 1)[0] + ' (cut)'
                one = one.replace('`', '')
                band = 'card-level only: ' + ', '.join(r['bl'][:2]) + (' +%d' % (len(r['bl']) - 2) if len(r['bl']) > 2 else '') if r['tier'] == 'card-only' else 'none'
                print(f"| {r['id']} | {one} | {r['file']} | {band} | {group_of(r)} |")
        return
    print('| Card | P0 rows | Reasons |')
    print('|---|---|---|')
    for c, rs in cards.items():
        ids = list(dict.fromkeys(r['id'] for r in rs))
        reasons = sorted({x for r in rs for x in r['reasons']})
        print(f"| {c} | {', '.join(ids)} | {' '.join('(' + x + ')' for x in reasons) or 'see card'} |")
    print(f'\nTOTAL {len(out)}', file=sys.stderr)


if __name__ == '__main__':
    main()
