#!/usr/bin/env python3
"""Collect P0 acceptance rows from the PRD cards and print a register table.

Reads every docs/product/prd/[01]*.md card. An acceptance row is a markdown
table row whose first cell is a bracketed or bare row id (NS-.., X..-R..) and
one of whose cells starts with P0. The reason letters (a) (b) (c) are read
from that cell or the cell after it.
"""
import re, sys, glob, os, collections

root = sys.argv[1]
files = [f for f in sorted(glob.glob(os.path.join(root, 'docs/product/prd/[01][0-9]-*.md'))) if int(os.path.basename(f)[:2]) <= 12]
idre = re.compile(r'^\[?((?:NS-\d+[A-Z]?|X\d+|FRAME)[-A-Za-z0-9]*)\]?$')
rows = collections.OrderedDict()
for f in files:
    for line in open(f, encoding='utf-8'):
        if not line.startswith('|'):
            continue
        cells = [c.strip().strip('`') for c in line.strip().strip('|').split('|')]
        if not cells:
            continue
        m = idre.match(cells[0].strip('`'))
        if not m:
            continue
        rid = m.group(1)
        for i, c in enumerate(cells):
            if re.match(r'^\**P0\b', c):
                text = c + ' ' + (cells[i + 1] if i + 1 < len(cells) else '')
                reasons = sorted(set(re.findall(r'\(([abc])(?=[):,;\s])', text) + re.findall(r'(?:^|[\s(,;])([abc])(?=[):,;])', text)))
                card = re.match(r'(NS-\d+|X\d+|FRAME)', rid).group(1)
                rows.setdefault(card, []).append((rid, reasons))
                break

def key(c):
    m = re.match(r'NS-(\d+)', c)
    return (0, int(m.group(1))) if m else (1, c)

total = 0
print('| Card | P0 rows | Reasons |')
print('|---|---|---|')
for card in sorted(rows, key=key):
    ids = []
    for r, _ in rows[card]:
        if r not in ids:
            ids.append(r)
    rs = sorted({x for _, rr in rows[card] for x in rr})
    total += len(ids)
    print(f"| {card} | {', '.join(ids)} | {' '.join('(' + x + ')' for x in rs) or 'see card'} |")
print(f'\nTOTAL {total}', file=sys.stderr)
