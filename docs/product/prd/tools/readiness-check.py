#!/usr/bin/env python3
"""Check the dependency tables in docs/product/READINESS-20nov.md.

Usage: python3 -I docs/product/prd/tools/readiness-check.py docs/product/READINESS-20nov.md

Reads every table row whose first cell looks like a work item id (section 2.2 to 2.11).
Fails (exit 1) if:
  - a Depends on id is not a row in the tables (a missing blocker)
  - the dependencies have a cycle
  - a row outside the instrumentation chain (ids that do not start with IN-) depends on an IN- row
  - a row is listed twice
Prints one line of counts. Reads one file, writes nothing.
"""
import re, sys

def main(path):
    text = open(path, encoding='ascii').read()
    start = text.index('### 2.2 ')
    end = text.index('### 2.12 ')
    rows = {}
    errors = []
    for line in text[start:end].split('\n'):
        if not line.startswith('| '):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 9 or cells[0] in ('Id',) or set(cells[0]) <= set('-'):
            continue
        rid, deps = cells[0], cells[2]
        if rid in rows:
            errors.append('duplicate row ' + rid)
        rows[rid] = [] if deps in ('-', '') else [d.strip() for d in deps.split(',')]
    for rid, deps in rows.items():
        for d in deps:
            if d not in rows:
                errors.append('missing blocker %s (needed by %s)' % (d, rid))
            elif d.startswith('IN-') and not rid.startswith('IN-'):
                errors.append('%s depends on instrumentation row %s' % (rid, d))
    color, stack = {}, []
    def visit(n):
        color[n] = 1
        stack.append(n)
        for d in rows[n]:
            if d not in rows:
                continue
            if color.get(d) == 1:
                errors.append('cycle: ' + ' -> '.join(stack[stack.index(d):] + [d]))
            elif d not in color:
                visit(d)
        stack.pop()
        color[n] = 2
    for n in rows:
        if n not in color:
            visit(n)
    edges = sum(len(v) for v in rows.values())
    print('rows %d, edges %d, errors %d' % (len(rows), edges, len(errors)))
    for e in errors:
        print('ERROR', e)
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
