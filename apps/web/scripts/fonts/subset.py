#!/usr/bin/env python3
"""Rebuild the S08 script subsets from the lines in src/content/site.ts.

Usage: python3 scripts/fonts/subset.py <dir with source TTFs>
Sources (SIL OFL 1.1, from github.com/google/fonts): TiroDevanagariHindi-Regular.ttf,
Amiri-Regular.ttf, NotoSerifSC-400.ttf (Noto Serif SC instanced at wght 400 with fontTools.varLib.instancer).
Output: src/scenes/parts/act3/fonts/*-subset.woff2
"""
import re, subprocess, sys, pathlib

root = pathlib.Path(__file__).resolve().parents[2]
src_dir = pathlib.Path(sys.argv[1])
site = (root / 'src/content/site.ts').read_text(encoding='utf8')
lines = dict(re.findall(r"lang: '([a-z]{2})(?:-[A-Za-z]+)?', dir: '\w+', name: '\w+', text: '([^']*)'", site))
out = root / 'src/scenes/parts/act3/fonts'
jobs = [
    ('hi', 'tirodevanagarihindi-TiroDevanagariHindi-Regular.ttf', 'tiro-devanagari-hindi-subset.woff2'),
    ('zh', 'notoserifsc-400.ttf', 'noto-serif-sc-subset.woff2'),
    ('ar', 'amiri-Amiri-Regular.ttf', 'amiri-subset.woff2'),
]
for lang, src, dst in jobs:
    text = lines[lang]
    subprocess.run([
        sys.executable, '-m', 'fontTools.subset', str(src_dir / src), f'--text={text}',
        "--layout-features=*", '--flavor=woff2', '--no-hinting', '--desubroutinize', f'--output-file={out / dst}',
    ], check=True)
    print(lang, dst, (out / dst).stat().st_size, 'bytes')
