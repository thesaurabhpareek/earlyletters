"""Flattens every frame to 8-bit RGB with no alpha (Apple: "Images can't include alpha channels or transparencies"),
checks sizes, and builds screens/contact-sheet.png from the required set (all frames side by side).
    python3 -I finish.py
"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SETS = {"iphone-medium-1206x2622": (1206, 2622), "ios-6.9in": (1320, 2868)}

for d, size in SETS.items():
    for f in sorted((ROOT / d).glob("*.png")):
        im = Image.open(f)
        if im.size != size:
            raise SystemExit(f"{f}: {im.size} != {size}")
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.save(f, optimize=True)
        print(d, f.name, im.mode, im.size)

frames = sorted((ROOT / "iphone-medium-1206x2622").glob("*.png"))
th_w, th_h, gap = 402, 874, 24
sheet = Image.new("RGB", (gap + len(frames) * (th_w + gap), th_h + 2 * gap), (233, 226, 216))
for i, f in enumerate(frames):
    sheet.paste(Image.open(f).resize((th_w, th_h), Image.LANCZOS), (gap + i * (th_w + gap), gap))
sheet.save(ROOT / "contact-sheet.png", optimize=True)
print("contact-sheet.png", sheet.size)
