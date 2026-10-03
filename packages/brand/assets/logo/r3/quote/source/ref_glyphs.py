# Extract the opening double quote (U+201C) from reference serifs as SVG paths (study only, not used in the mark).
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
F = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/wm/fonts/'
specs = [
 ('EB Garamond 500', F+'ebgaramond/EBGaramond[wght].ttf', {'wght':500}),
 ('EB Garamond 800', F+'ebgaramond/EBGaramond[wght].ttf', {'wght':800}),
 ('Literata 72/700', F+'literata/Literata[opsz,wght].ttf', {'opsz':72,'wght':700}),
 ('Newsreader 72/700', F+'newsreader/Newsreader[opsz,wght].ttf', {'opsz':72,'wght':700}),
 ('Source Serif 60/700', F+'sourceserif4/SourceSerif4[opsz,wght].ttf', {'opsz':60,'wght':700}),
 ('GFS Baskerville', '/usr/share/fonts/truetype/baskerville/GFSBaskerville.otf', None),
]
out = []
for name, path, loc in specs:
    f = TTFont(path)
    if loc:
        axes = {a.axisTag for a in f['fvar'].axes}
        f = instantiateVariableFont(f, {k:v for k,v in loc.items() if k in axes})
    gs = f.getGlyphSet(); cmap = f.getBestCmap()
    for cp in (0x201C, 0x2018):
        g = cmap.get(cp)
        if not g: continue
        pen = SVGPathPen(gs); gs[g].draw(pen)
        bp = BoundsPen(gs); gs[g].draw(bp)
        out.append({'name': name, 'cp': hex(cp), 'd': pen.getCommands(), 'b': bp.bounds})
json.dump(out, open(sys.argv[1], 'w'))
print(len(out))
