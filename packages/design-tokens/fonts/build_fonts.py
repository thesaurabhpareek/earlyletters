"""
Rebuild the bundled app fonts (founder decision 15: fonts ship in the app,
subset to the glyphs we use). Run from this folder with fontTools installed:

    python3 build_fonts.py <folder with the google/fonts source files>

Sources (SIL OFL 1.1, no Reserved Font Names), from github.com/google/fonts:
  ofl/literata/Literata[opsz,wght].ttf, ofl/literata/Literata-Italic[opsz,wght].ttf
  ofl/mukta/Mukta-Regular.ttf, Mukta-Medium.ttf, Mukta-SemiBold.ttf
  ofl/tirodevanagarihindi/TiroDevanagariHindi-Regular.ttf, -Italic.ttf

Literata is variable; we cut static instances so iOS and Android resolve one
family name per weight (custom fonts do not synthesise weights reliably).
Optical size: reading text at 16, titles at 30 (finer contrast at display sizes).
PostScript names are set to the file stem, which is the name the app uses as
fontFamily (packages/design-tokens/src/tokens.ts fontFamily).
"""
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT = Path(__file__).parent

LATIN = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x250))  # Basic Latin, Latin-1, Latin Extended-A and B (es, fr, pt, names)
    + [0x2BB, 0x2BC, 0x2C6, 0x2DA, 0x2DC, 0x300, 0x301, 0x302, 0x303, 0x308, 0x327]
    + list(range(0x2000, 0x2070)) + [0x20AC, 0x20B9, 0x2122, 0x2190, 0x2192, 0x2212, 0x25CC, 0xFEFF, 0xFFFD]
)
DEVANAGARI = list(range(0x900, 0x980)) + list(range(0xA8E0, 0xA900)) + list(range(0x1CD0, 0x1D00)) + [0x200C, 0x200D, 0x25CC]

def subset(font: TTFont, unicodes: list[int]) -> None:
    opts = Options()
    opts.layout_features = ['*']  # keep every shaping feature (Devanagari conjuncts, matras, kerning)
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.hinting = False  # Apple and modern Android ignore TrueType hints at app sizes
    s = Subsetter(options=opts)
    s.populate(unicodes=unicodes)
    s.subset(font)

def rename(font: TTFont, family: str, style: str, postscript: str) -> None:
    name = font['name']
    for rec in list(name.names):
        if rec.nameID in (1, 2, 4, 6, 16, 17, 25):
            name.removeNames(nameID=rec.nameID)
    name.setName(family, 1, 3, 1, 0x409)
    name.setName(style, 2, 3, 1, 0x409)
    name.setName(f'{family} {style}', 4, 3, 1, 0x409)
    name.setName(postscript, 6, 3, 1, 0x409)

def literata(src: str, out: str, opsz: int, wght: int, style: str) -> None:
    f = TTFont(SRC / src)
    f = instantiateVariableFont(f, {'opsz': opsz, 'wght': wght}, inplace=False)
    subset(f, LATIN)
    rename(f, 'Literata', style, out)
    f.save(OUT / f'{out}.ttf')

def plain(src: str, out: str, unicodes: list[int], family: str | None = None, style: str = 'Regular') -> None:
    f = TTFont(SRC / src)
    subset(f, unicodes)
    if family:
        rename(f, family, style, out)
    f.save(OUT / f'{out}.ttf')

literata('literata__Literata[opsz,wght].ttf', 'Literata-Regular', 16, 400, 'Regular')
literata('literata__Literata[opsz,wght].ttf', 'Literata-Medium', 30, 500, 'Medium')
literata('literata__Literata-Italic[opsz,wght].ttf', 'Literata-Italic', 16, 400, 'Italic')
for w in ('Regular', 'Medium', 'SemiBold'):
    plain(f'mukta__Mukta-{w}.ttf', f'Mukta-{w}', LATIN + DEVANAGARI)
# Devanagari letter text only (signatures are Latin), so no italic: 220 KB saved.
plain('tirodevanagarihindi__TiroDevanagariHindi-Regular.ttf', 'TiroDevanagariHindi-Regular', DEVANAGARI + list(range(0x20, 0x7F)), 'Tiro Devanagari Hindi')
for p in sorted(OUT.glob('*.ttf')):
    print(f'{p.name}: {p.stat().st_size // 1024} KB')
