#!/usr/bin/env python3
"""Fetch the pinned OFL variable fonts and cut static instances for the wordmark.

Usage: python3 fonts.py <cache_dir> <family>:<opsz>:<wght>[:<SOFT>] ...
Writes <cache_dir>/<family>-<opsz>-<wght>.ttf. Fonts come from google/fonts (ofl/),
verified by sha256 so a silent upstream change can never alter the logo.
Only the drawn outlines end up in the logo; no font file is shipped (see ../LICENSE-NOTES.md).
"""
import hashlib, os, sys, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
SOURCES = {
    'literata': ('literata/Literata%5Bopsz,wght%5D.ttf', 'b41138c9373112f32abb589cc22e8674b06ed4048b0c513be922bdd26f274440'),
    'ebgaramond': ('ebgaramond/EBGaramond%5Bwght%5D.ttf', 'ef9512f92f6d579e5dc75af59a5a4b1b8b47d2eda89e00b954d44520e5369027'),
    'newsreader': ('newsreader/Newsreader%5Bopsz,wght%5D.ttf', '8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1'),
}

def variable(cache, fam):
    rel, sha = SOURCES[fam]
    p = os.path.join(cache, f'{fam}-VF.ttf')
    if not os.path.exists(p):
        data = urllib.request.urlopen(BASE + rel).read()
        open(p, 'wb').write(data)
    got = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    if got != sha:
        sys.exit(f'{fam}: sha256 mismatch {got}; upstream font changed, re-check outlines before updating the pin')
    return p

def main():
    cache = sys.argv[1]
    os.makedirs(cache, exist_ok=True)
    for spec in sys.argv[2:]:
        fam, opsz, wght = spec.split(':')
        out = os.path.join(cache, f'{fam}-{opsz}-{wght}.ttf')
        if os.path.exists(out):
            continue
        f = TTFont(variable(cache, fam))
        axes = {a.axisTag for a in f['fvar'].axes}
        loc = {'wght': float(wght)}
        if 'opsz' in axes and opsz != '-':
            loc['opsz'] = float(opsz)
        instantiateVariableFont(f, loc, inplace=True, updateFontNames=False)
        f.save(out)

main()
