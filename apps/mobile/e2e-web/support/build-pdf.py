"""Journey PDF: one page per step, screen inside an iPhone 17 Pro style frame (own drawing), three reviewer notes beside it.
Inputs (journey dir J): steps/*.json, screens/<id>.png, critiques/{product,design,quality}.json
critique file: {"<stepId>": {"verdict":"ok|fix|gap","findings":[{"sev":"blocker|major|minor","text":"...","fix":"..."}]}}
usage: python3 build_journey.py <journey_dir> <out.pdf>"""
import json, sys, glob, os, html, base64
J, OUT = sys.argv[1], sys.argv[2]
SMALL = sys.argv[3] if len(sys.argv) > 3 else None
import markdown
ROLES = [('product', 'Product lead'), ('design', 'Design lead'), ('quality', 'Quality engineer')]
steps = [json.load(open(f)) for f in sorted(glob.glob(f'{J}/steps/*.json'))]
steps.sort(key=lambda s: s['id'])
crit = {}
for r, _ in ROLES:
    p = f'{J}/critiques/{r}.json'
    crit[r] = json.load(open(p)) if os.path.exists(p) else {}
e = lambda s: html.escape(str(s or ''))
def img(p):
    if SMALL:
        q = os.path.join(SMALL, os.path.basename(p).replace('.png', '.jpg'))
        return 'data:image/jpeg;base64,' + base64.b64encode(open(q, 'rb').read()).decode() if os.path.exists(q) else ''
    return 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode() if os.path.exists(p) else ''
CSS = """
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}body{margin:0;font:11px/1.45 -apple-system,Helvetica,Arial,sans-serif;color:#2b2622}
.pg{width:297mm;min-height:210mm;page-break-after:always;padding:12mm 14mm;display:flex;gap:12mm;background:#FBF8F3}
.phonewrap{align-items:flex-start!important}.phone{position:sticky;top:0}
.sum{display:block;font-size:11px}.sum h1{font-size:22px}.sum h2{font-size:14px;margin:12px 0 4px}.sum ul{margin:2px 0 6px 16px;padding:0}.sum code{font-size:10px}
.cols{align-items:flex-start}.f{font-size:9.5px}
.phonewrap{flex:0 0 78mm;display:flex;align-items:center;justify-content:center}
.phone{position:relative;width:74mm;height:160mm;border-radius:11mm;background:linear-gradient(145deg,#8d8780,#c9c4bc 40%,#6f6a64);padding:.9mm;box-shadow:0 2mm 6mm rgba(0,0,0,.25)}
.bezel{width:100%;height:100%;border-radius:10.2mm;background:#0b0b0c;padding:1.6mm}
.screen{position:relative;width:100%;height:100%;border-radius:8.8mm;overflow:hidden;background:#fff}
.screen img{position:absolute;left:50%;transform:translateX(-50%);top:7.1%;height:89%;width:auto;display:block}
.island{position:absolute;top:2.2mm;left:50%;transform:translateX(-50%);width:21mm;height:6.2mm;border-radius:3.2mm;background:#000;z-index:3}
.sb{position:absolute;top:2.6mm;left:6mm;right:6mm;display:flex;justify-content:space-between;font-weight:600;font-size:8px;color:#111;z-index:2}
.home{position:absolute;bottom:1.6mm;left:50%;transform:translateX(-50%);width:24mm;height:1mm;border-radius:1mm;background:#111;opacity:.85;z-index:3}
.btn{position:absolute;background:#7c776f;width:.7mm;border-radius:.4mm}
.info{flex:1;min-width:0;display:flex;flex-direction:column}
.crumb{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#8a8178}
h1{font:600 18px/1.2 Georgia,serif;margin:2px 0 4px}h2{font-size:11px;margin:0 0 3px}
.tag{display:inline-block;padding:1px 7px;border-radius:9px;font-size:9px;font-weight:600;margin-right:4px}
.happy{background:#e4efe0;color:#2f5d2a}.unhappy{background:#f7e3d6;color:#8a3f12}
.note{margin:6px 0 8px}.cols{display:flex;gap:8px;flex:1}
.col{flex:1;background:#fff;border:1px solid #e7e0d6;border-radius:6px;padding:7px 8px;min-width:0}
.f{margin:0 0 6px;padding-left:6px;border-left:3px solid #ccc}
.f.blocker{border-color:#b3261e}.f.major{border-color:#d98a1c}.f.minor{border-color:#8a8178}
.f b{font-size:9px;text-transform:uppercase}.fx{color:#2f5d2a}.ok{color:#2f5d2a}
.flow{font-size:9px;color:#8a8178;margin-top:5px}
.cover{display:block;padding:30mm}.cover h1{font-size:30px}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e7e0d6;padding:3px 5px;text-align:left;font-size:10px}
"""
import subprocess as sp
def bgcol(i):
    q = os.path.join(SMALL or '', i + '.jpg')
    try:
        return '#' + sp.run(['convert', q, '-crop', '1x1+3+3', '-format', '%[hex:u]', 'info:'], capture_output=True, text=True).stdout.strip()[:6]
    except Exception:
        return '#FBF8F3'
def phone(s):
    ins = s.get('safeArea', {})
    return f"""<div class=phone><div class=btn style="left:-.5mm;top:30mm;height:7mm"></div><div class=btn style="left:-.5mm;top:42mm;height:12mm"></div>
<div class=btn style="right:-.5mm;top:40mm;height:18mm"></div><div class=bezel><div class=screen style="background:{bgcol(s['id'])}"><div class=island></div>
<div class=sb><span>9:41</span><span>5G &#9679;&#9679;&#9679;</span></div><img src="{img(f'{J}/screens/{s["id"]}.png')}"><div class=home></div></div></div></div>"""
def col(role, label, sid):
    c = crit[role].get(sid)
    if not c: return f'<div class=col><h2>{label}</h2><i>Not reviewed</i></div>'
    fs = ''.join(f'<div class="f {e(f.get("sev","minor"))}"><b>{e(f.get("sev"))}</b> {e(f.get("text"))}' + (f'<br><span class=fx>Fix: {e(f["fix"])}</span>' if f.get('fix') else '') + '</div>' for f in c.get('findings', []))
    return f'<div class=col><h2>{label} <span class={"ok" if c.get("verdict")=="ok" else ""}>[{e(c.get("verdict"))}]</span></h2>{fs or "<i>No findings</i>"}</div>'
pages = []
n = {'blocker': 0, 'major': 0, 'minor': 0}
for r, _ in ROLES:
    for c in crit[r].values():  # counts all findings including journey-level
        for f in c.get('findings', []):
            n[f.get('sev', 'minor')] = n.get(f.get('sev', 'minor'), 0) + 1
pages.append(f"""<div class="pg cover"><div class=crumb>Early Letters, iOS app, v1.0 (on device)</div><h1>Customer journey, every screen</h1>
<p>{len(steps)} steps across {len({s['journey'] for s in steps})} journeys. Happy and unhappy paths. Each screen is the real app interface, shown in an iPhone 17 Pro style frame, with the product lead, design lead and quality engineer reviews beside it.</p>
<p>Open findings: {n['blocker']} blocker, {n['major']} major, {n['minor']} minor.</p>
<p class=flow>Screens come from the app's own code rendered through its web export, not from the iOS simulator. Native audio, purchase sheets and notifications are not shown; steps that depend on them say so. The phone frame is an illustration.</p></div>""")
def md(p, title):
    return f'<div class="pg sum"><div style="width:100%"><div class=crumb>{title}</div>' + markdown.markdown(open(p).read()) + '</div></div>' if os.path.exists(p) else ''
for r, l in ROLES:
    pages.append(md(f'{J}/critiques/{r}.md', f'{l}: summary'))
jl = ''
for r, l in ROLES:
    c = crit[r].get('_journey')
    if c:
        jl += f'<div class=col style="margin-bottom:8px"><h2>{l}: journey-level findings</h2>' + ''.join(f'<div class="f {e(f.get("sev","minor"))}"><b>{e(f.get("sev"))}</b> {e(f.get("text"))}' + (f'<br><span class=fx>Fix: {e(f["fix"])}</span>' if f.get('fix') else '') + '</div>' for f in c.get('findings', [])) + '</div>'
pages.append(f'<div class="pg sum"><div style="width:100%"><div class=crumb>Across the whole journey</div><h1>Gaps that are not one screen</h1>{jl}</div></div>')
for i, s in enumerate(steps):
    prev = f"From {e(s.get('from'))}" if s.get('from') else 'Start'
    pages.append(f"""<div class=pg><div class=phonewrap>{phone(s)}</div><div class=info>
<div class=crumb>{e(s['journey'])} &middot; {e(s['id'])} &middot; step {i+1} of {len(steps)}</div>
<h1>{e(s['title'])}</h1><div><span class="tag {e(s['kind'])}">{e(s['kind'])} path</span></div>
<div class=note>{e(s.get('note'))}</div><div class=cols>{''.join(col(r, l, s['id']) for r, l in ROLES)}</div>
<div class=flow>{prev}</div></div></div>""")
open(OUT + '.html', 'w').write(f'<meta charset=utf-8><style>{CSS}</style>' + ''.join(pages))
import subprocess
CH = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
if os.path.isdir(CH):
    CH = [os.path.join(CH, x) for x in os.listdir(CH) if x in ('chrome', 'chromium')][0] if any(x in ('chrome','chromium') for x in os.listdir(CH)) else CH
subprocess.run([CH, '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={os.path.abspath(OUT)}', 'file://' + os.path.abspath(OUT + '.html')], check=True, capture_output=True)
print('pages', len(pages))
