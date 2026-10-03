"""Render PNGs for logo direction B with Playwright Chromium.

    npx tsx packages/brand/assets/logo/b/src/build.ts
    python3 packages/brand/assets/logo/b/src/render.py

Writes png/*.png, app-icon-1024.png (opaque RGB, no alpha channel, as the
App Store requires), and presentation screenshots in src/screens/.
"""
import base64
import json
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
PNG = OUT / "png"
SCREENS = HERE / "screens"
PNG.mkdir(exist_ok=True)
SCREENS.mkdir(exist_ok=True)

manifest = json.loads((HERE / "manifest.json").read_text())

# (file stem, output width in px)
SIZES = {
    "symbol": [512, 1024],
    "symbol-small": [64, 128],
    "wordmark": [1200, 2400],
    "lockup-horizontal": [1200, 2400],
    "lockup-stacked": [800, 1600],
}


def render_svg(page, svg_path: pathlib.Path, width: int, out: pathlib.Path, height=None, transparent=True):
    b64 = base64.b64encode(svg_path.read_bytes()).decode()
    page.set_content(
        f"""<!doctype html><html><head><style>html,body{{margin:0;background:transparent}}
        img{{display:block;width:{width}px;{'height:%dpx;' % height if height else ''}}}</style></head>
        <body><img id="i" src="data:image/svg+xml;base64,{b64}"></body></html>"""
    )
    page.wait_for_function("document.getElementById('i').complete")
    ok = page.evaluate("document.getElementById('i').naturalWidth > 0")
    assert ok, f"SVG failed to decode: {svg_path}"
    page.locator("#i").screenshot(path=str(out), omit_background=transparent)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=1)

        for f in manifest["files"]:
            stem = f[:-4]
            if stem == "favicon":
                continue
            base = next((b for b in sorted(SIZES, key=len, reverse=True) if stem.startswith(b)), None)
            if not base:
                continue
            for w in SIZES[base]:
                render_svg(page, OUT / f, w, PNG / f"{stem}-{w}.png")

        # favicon fallbacks (light browser chrome) and touch icon
        for w in (16, 32, 48):
            render_svg(page, OUT / "favicon.svg", w, PNG / f"favicon-{w}.png", height=w)

        # App icons: opaque, flattened to RGB.
        for name, src in (("app-icon-1024.png", "app-icon.svg"), ("app-icon-dark-1024.png", "app-icon-dark.svg"), ("app-icon-paper-1024.png", "app-icon-paper.svg")):
            tmp = PNG / f"_{name}"
            render_svg(page, HERE / "icon" / src, 1024, tmp, transparent=False)
            im = Image.open(tmp).convert("RGB")
            assert im.size == (1024, 1024), im.size
            target = OUT / name if name == "app-icon-1024.png" else PNG / name
            im.save(target, optimize=True)
            tmp.unlink()
            if name == "app-icon-1024.png":
                im.resize((180, 180), Image.LANCZOS).save(PNG / "apple-touch-icon-180.png", optimize=True)

        # Presentation screenshots
        pres = OUT / "presentation.html"
        if pres.exists():
            pg = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=1)
            pg.goto(pres.as_uri())
            pg.wait_for_timeout(600)
            pg.screenshot(path=str(SCREENS / "presentation-full.png"), full_page=True)
            for sec in pg.locator("section[id]").all():
                sid = sec.get_attribute("id")
                sec.screenshot(path=str(SCREENS / f"section-{sid}.png"))
            # mobile width check
            pm = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
            pm.goto(pres.as_uri())
            pm.wait_for_timeout(600)
            pm.screenshot(path=str(SCREENS / "presentation-mobile.png"), full_page=False)
            overflow = pm.evaluate("document.documentElement.scrollWidth > window.innerWidth")
            print("mobile horizontal overflow:", overflow)
        browser.close()


if __name__ == "__main__":
    main()
    print("rendered to", PNG)
