#!/usr/bin/env python3
"""
Owner: AT (atmosphere). Generates every texture and light profile the film uses, procedurally,
from code. No photos, no AI imagery. Output is deterministic (fixed seeds).

    python3 apps/web/scripts/atmosphere/make_textures.py
    python3 apps/web/scripts/atmosphere/make_textures.py --preview DIR   # also writes previews

Needs Pillow (with WebP) and numpy (`pip install --break-system-packages numpy`).

Writes:
  public/textures/grain-v1.webp   256 px tileable monochrome film grain around mid grey, lossless,
                                  for mix-blend-mode: overlay (multiplies in the darks, so black stays black)
  public/textures/paper-v1.webp   320 px tileable paper (formation, tooth, fibres) as RGBA over --paper,
                                  lossless palette; average colour of the page stays exactly --paper
  src/components/atmosphere/light.generated.ts
                                  CSS gradient stops for the light pools and the vignette, solved from a
                                  photometric model (inverse-square falloff, lampshade cone, bounce light,
                                  filmic shoulder, warmer and deeper toward the edge) over the tone they
                                  sit on. Zero bytes on the wire, sharp at any size.
Bump the -v1 suffix when a texture's look changes (lets the CDN cache forever).
"""
from __future__ import annotations

import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(WEB, 'public', 'textures')
GEN_TS = os.path.join(WEB, 'src', 'components', 'atmosphere', 'light.generated.ts')
VERSION = 'v1'

# Tokens (apps/web/src/app/globals.css). The script stops if they drift.
TOKENS = {
    'paper': '#fbf8f3',
    'night': '#161412',
    'dusk': '#3b302a',
    'lamp': '#f3c98b',
    'night-recording': '#f08c7c',
}


def check_tokens() -> None:
    css = open(os.path.join(WEB, 'src', 'app', 'globals.css'), encoding='utf-8').read().lower()
    for name, hex_ in TOKENS.items():
        if f'--{name}: {hex_}' not in css:
            sys.exit(f'token --{name} is no longer {hex_} in globals.css; update TOKENS and re-run')


# ---------------------------------------------------------------- colour

def hex_rgb(h: str) -> np.ndarray:
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float64)


def to_lin(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(np.asarray(c, dtype=np.float64), 0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def luminance(srgb) -> float:
    lin = to_lin(srgb)
    return float(0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2])


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- periodic noise

def periodic_blur(a: np.ndarray, sigma: float) -> np.ndarray:
    """Gaussian blur on a torus (FFT), so a tile stays seamless."""
    h, w = a.shape
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    g = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def band_noise(rng: np.random.Generator, n: int, lo: float, hi: float) -> np.ndarray:
    """Periodic noise with features roughly between lo and hi pixels, unit std."""
    w = rng.standard_normal((n, n))
    a = periodic_blur(w, lo / 2.5) - periodic_blur(w, hi / 2.5)
    return a / a.std()


def norm(a: np.ndarray) -> np.ndarray:
    return (a - a.mean()) / a.std()


# ---------------------------------------------------------------- grain

GRAIN_STEPS = 4      # levels each side of zero: 9 in all
GRAIN_ALPHA = 0.5    # alpha of the strongest speck; CSS opacity scales it (see Grain in index.tsx)


def grain_field(n: int = 256, seed: int = 7) -> np.ndarray:
    """Film grain in -1..1: mostly per pixel, with a little clumping (silver grains cluster)."""
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((n, n))
    g = norm(0.6 * norm(white) + 0.4 * norm(periodic_blur(white, 0.65)))
    return np.clip(np.round(g * 1.55), -GRAIN_STEPS, GRAIN_STEPS) / GRAIN_STEPS


def make_grain(n: int = 256) -> Image.Image:
    """Signed grain as white and black specks with alpha. Under normal compositing this is additive
    noise of the same strength on any tone, so it works inside a sticky stage (a stacking context
    with a transparent backdrop), where a grey overlay texture would leave a grey veil."""
    q = grain_field(n)
    rgba = np.zeros((n, n, 4))
    rgba[..., :3] = np.where(q[..., None] > 0, 255.0, 0.0)
    rgba[..., 3] = np.round(np.abs(q) * GRAIN_ALPHA * 255)
    return Image.fromarray(rgba.astype(np.uint8), 'RGBA')


# ---------------------------------------------------------------- paper

def splat_fibre(acc: np.ndarray, rng: np.random.Generator, N: int, ss: int, length: float, width: float, value: float) -> None:
    """One gently curved, tapered fibre into acc (supersampled torus), anti-aliased by distance."""
    x, y = rng.uniform(0, N, 2)
    # Machine-made paper: fibres lean toward the machine direction, loosely.
    a = rng.normal(0, 0.8) + (np.pi if rng.random() < 0.5 else 0)
    bend = rng.normal(0, 0.02)
    steps = max(6, int(length * ss / 1.2))
    step = length * ss / steps
    for i in range(steps + 1):
        t = i / steps
        rad = max(0.3 * ss, width * ss / 2 * np.sin(np.pi * t) ** 0.4)
        ix0, ix1 = int(np.floor(x - rad - 2)), int(np.ceil(x + rad + 2))
        iy0, iy1 = int(np.floor(y - rad - 2)), int(np.ceil(y + rad + 2))
        ys, xs = np.arange(iy0, iy1), np.arange(ix0, ix1)
        d = np.sqrt((xs[None, :] + 0.5 - x) ** 2 + (ys[:, None] + 0.5 - y) ** 2)
        cov = np.clip(rad + 0.5 - d, 0, 1) * value
        idx = np.ix_(ys % N, xs % N)
        # Combine by largest magnitude, so stamps along one fibre do not stack into beads.
        acc[idx] = np.maximum(acc[idx], cov) if value > 0 else np.minimum(acc[idx], cov)
        a += bend + rng.normal(0, 0.035)
        x += np.cos(a) * step
        y += np.sin(a) * step


PAPER_DARK = np.array([92, 74, 58], dtype=np.float64)  # warm fibre brown (lignin, not grey)


def paper_delta(n: int = 320, seed: int = 11) -> np.ndarray:
    """Signed brightness change over --paper, in 8-bit levels."""
    rng = np.random.default_rng(seed)
    ss = 3
    N = n * ss
    # Formation: the soft cloudiness of fibre flocs, the thing that makes paper read as paper.
    formation = norm(0.55 * band_noise(rng, n, 8, 34) + 0.45 * band_noise(rng, n, 24, 90))
    # Tooth: a fine height field under raking light from the upper left.
    h = 0.75 * band_noise(rng, n, 1.0, 3.2) + 0.25 * band_noise(rng, n, 3, 9)
    hp = np.pad(h, 1, mode='wrap')
    gy, gx = np.gradient(hp)
    tooth = norm(-(gx[1:-1, 1:-1] * -0.62 + gy[1:-1, 1:-1] * -0.78))
    # Fibres: a modest number of fine ones, a few longer pale rag fibres; no single standout.
    dark = np.zeros((N, N))
    light = np.zeros((N, N))
    for _ in range(int(70 * (n / 320) ** 2)):
        L = float(np.clip(rng.lognormal(np.log(16), 0.5), 6, 48))
        splat_fibre(dark, rng, N, ss, L, float(rng.uniform(0.5, 0.9)), -float(rng.uniform(0.5, 1.0)))
    for _ in range(int(55 * (n / 320) ** 2)):
        L = float(np.clip(rng.lognormal(np.log(22), 0.45), 8, 70))
        splat_fibre(light, rng, N, ss, L, float(rng.uniform(0.7, 1.3)), float(rng.uniform(0.5, 1.0)))
    for _ in range(int(6 * (n / 320) ** 2)):
        splat_fibre(dark, rng, N, ss, float(rng.uniform(50, 110)), 0.6, -float(rng.uniform(0.3, 0.5)))

    def down(a: np.ndarray) -> np.ndarray:
        return a.reshape(n, ss, n, ss).mean(axis=(1, 3))

    fd, fl = down(dark), down(light)
    fd = 0.7 * fd + 0.3 * periodic_blur(fd, 0.7)
    fl = 0.6 * fl + 0.4 * periodic_blur(fl, 0.9)
    # Levels, tuned on screen against cotton letter paper under a lamp: formation carries the look,
    # tooth is felt more than seen, fibres are found only when you look. Paper has ~4 levels of
    # headroom above #FBF8F3, so the light side is kept small.
    d = 0.85 * formation + 0.8 * tooth + 5.0 * fd + 2.2 * fl
    d = d - d.mean()
    # Soft-limit so no single fleck stands out (one standout mark would reveal the tile's repeat).
    lim_lo, lim_hi = 6.0, 4.0
    d = np.where(d < 0, -lim_lo * np.tanh(-d / lim_lo), lim_hi * np.tanh(d / lim_hi))
    return d - d.mean()


def paper_rgba(delta: np.ndarray) -> Image.Image:
    paper = hex_rgb(TOKENS['paper']) * 255
    # Quantise the delta to quarter levels so the lossless palette stays small.
    d = np.round(delta * 2) / 2
    neg = d < 0
    a_neg = np.clip(-d / (paper - PAPER_DARK).mean(), 0, 1)
    a_pos = np.clip(d / (255 - paper).mean(), 0, 1)
    a = np.where(neg, a_neg, a_pos)
    rgba = np.zeros(delta.shape + (4,))
    rgba[..., :3] = np.where(neg[..., None], PAPER_DARK, 255.0)
    rgba[..., 3] = np.round(a * 255)
    rgba[..., :3] = np.where(rgba[..., 3:4] == 0, 255.0, rgba[..., :3])
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')


# ---------------------------------------------------------------- light pools

# r is the normalised radius of the layer (1 = closest side of the box).
# height: lamp height over the lit plane (inverse-square scale); cone/penumbra/spill: the lampshade's
# cut-off (spill 1 = no shade); hot: a broad lift under the bulb; bounce: room fill; shoulder: the
# filmic roll-off point in linear light. Colours: core (hottest), body (tungsten ~2700 K for lamp), edge.
POOLS = {
    'lamp': dict(surface='night', core='#ffc983', body='#f0a248', edge='#b85a22',
                 height=0.44, cone=0.52, penumbra=0.40, spill=0.30, hot=0.12, hot_r=0.28, bounce=0.08,
                 exposure=0.46, shoulder=0.5),
    'recording': dict(surface='night', core='#ffa992', body=TOKENS['night-recording'], edge='#b0442f',
                      height=0.40, cone=0.6, penumbra=0.5, spill=1.0, hot=0.0, hot_r=0.2, bounce=0.20,
                      exposure=0.30, shoulder=0.5),
    'dusk': dict(surface='dusk', core='#ffc77e', body='#eea04e', edge='#b05a22', window=0.3,
                 height=0.52, cone=0.6, penumbra=0.6, spill=1.0, hot=0.0, hot_r=0.2, bounce=0.30,
                 exposure=0.36, shoulder=0.5, edge_w=0.3),
}
STOP_R = np.array([0, .04, .08, .12, .17, .22, .27, .32, .37, .42, .47, .52, .57, .62, .67, .72,
                   .77, .82, .87, .92, .96, 1.0])


def pool_profile(p: dict, r: np.ndarray) -> np.ndarray:
    """Relative irradiance, 1 at the centre."""
    return _pool_raw(p, r) / _pool_raw(p, np.zeros(1))[0]


def _pool_raw(p: dict, r: np.ndarray) -> np.ndarray:
    h = p['height']
    body = (1 + (r / h) ** 2) ** -1.5  # irradiance from a point source over a plane: inverse square x cos
    shade = 1 - (1 - p['spill']) * smoothstep(p['cone'] - p['penumbra'] / 2, p['cone'] + p['penumbra'] / 2, r)
    hot = p['hot'] * (1 + (r / p['hot_r']) ** 2) ** -1.5
    bounce = p['bounce'] * np.exp(-(r / 0.62) ** 2)
    E = body * shade + hot + bounce
    return E * (1 - smoothstep(p.get('window', 0.62), 1.0, r))  # reaches exactly zero at the edge: no visible disc


def pool_colour(p: dict, E: np.ndarray) -> np.ndarray:
    """Linear-light colour of the pool at intensity E (0..1); hotter core, deeper edge."""
    core, body, edge = (to_lin(hex_rgb(p[k])) for k in ('core', 'body', 'edge'))
    core, body, edge = core / core.max(), body / body.max(), edge / edge.max()
    t = np.clip(E, 0, 1)[..., None]
    w_core = smoothstep(0.55, 1.0, t)
    w_edge = p.get('edge_w', 0.8) * smoothstep(0.4, 0.0, t)
    c = body * (1 - w_core - w_edge) + core * w_core + edge * w_edge
    return c / c.max(axis=-1, keepdims=True)


SURFACES = ('night', 'dusk', 'paper')
# Over paper, light cannot add much (paper is near white); a lamp on a page reads as a warmer centre
# with the page falling gently away. tint: how far the centre moves toward the lamp colour; lift: gain.
# Over paper the pool is one warm colour at alpha proportional to irradiance: monotonic, so no rings.
PAPER_LIGHT = {'lamp': ('#ffe2b4', 0.30), 'recording': ('#ffd2c4', 0.22), 'dusk': ('#ffd9a8', 0.34)}


def target_over(kind: str, surface: str, r: np.ndarray) -> np.ndarray:
    """What the camera would record: the pool on that surface, sRGB 0..1."""
    p = POOLS[kind]
    E = pool_profile(p, r)
    bg = hex_rgb(TOKENS[surface])
    if surface == 'paper':
        col, k = PAPER_LIGHT[kind]
        a = (k * E)[..., None]
        return bg * (1 - a) + hex_rgb(col) * a
    L = p['exposure'] * E[..., None] * pool_colour(p, E)
    # Filmic shoulder on luminance (hue-preserving, so the pool keeps its chroma instead of going
    # khaki or grey; at these low levels a paler core reads as grey, not as white-hot).
    Y = (L * np.array([0.2126, 0.7152, 0.0722])).sum(-1, keepdims=True)
    Yc = Y / (1 + Y / p['shoulder'])
    Lc = L * (Yc / np.maximum(Y, 1e-9))
    return to_srgb(to_lin(bg) + Lc)


def solve_rgba(target: np.ndarray, bg: np.ndarray):
    """rgb * a + bg * (1 - a) = target, with the smallest a that keeps rgb within 0..1."""
    up = np.where(target > bg, (target - bg) / np.maximum(1 - bg, 1e-9), 0)
    down = np.where(target < bg, (bg - target) / np.maximum(bg, 1e-9), 0)
    a = np.clip(np.maximum(up, down).max(axis=-1), 0, 1)
    rgb = (target - bg * (1 - a[..., None])) / np.maximum(a, 1e-9)[..., None]
    # Where alpha is 0 the colour does not matter; carry the neighbour so interpolation stays clean.
    for i in range(len(a)):
        if a[i] < 1e-4:
            rgb[i] = rgb[i - 1] if i else target[i]
    return np.clip(rgb, 0, 1), a


def solve_pool(kind: str, r: np.ndarray, surface: str | None = None):
    surface = surface or POOLS[kind]['surface']
    target = target_over(kind, surface, r)
    rgb, a = solve_rgba(target, hex_rgb(TOKENS[surface]))
    return rgb, a, target


def css_stops(rgb: np.ndarray, a: np.ndarray, r: np.ndarray) -> str:
    out = []
    for c, al, rr in zip(rgb, a, r):
        R, G, B = (int(round(v * 255)) for v in c)
        out.append(f'rgba({R},{G},{B},{al:.4f}) {rr * 100:.0f}%')
    return ', '.join(out)


# Vignette: natural lens falloff (cos^4 of the field angle) with a clean centre, warm black.
VIG_R = np.array([0, .3, .4, .5, .58, .66, .74, .82, .9, 1.0])
VIGNETTE_TONES = {'night': ((6, 5, 4), 1.0), 'dusk': ((20, 12, 8), 0.75), 'paper': ((92, 70, 48), 0.16)}


def vignette_alpha(r: np.ndarray) -> np.ndarray:
    k = 0.9
    fall = 1 - 1 / (1 + (k * r) ** 2) ** 2
    onset = smoothstep(0.28, 1.0, r)
    return np.clip(fall * onset * 0.95, 0, 1)


# Night sky: a deep-night backdrop. A breath cooler and lighter at the top (night sky through glass),
# settling into exactly --night by the middle and staying there, so the bottom edge hands off to a plain
# night scene with no seam. Levels are sRGB 8-bit offsets from --night. Pair with Grain (it dithers).
SKY_STOPS = [(0.0, (3, 4, 7)), (0.16, (2, 2.6, 4.6)), (0.32, (0.8, 1.1, 2)), (0.5, (0, 0, 0)), (1.0, (0, 0, 0))]
# Moonlight wash: a faint cool lift, the only cool light in the film (against the tungsten lamp).
MOON_COLOUR = '#a9b8d0'
MOON_R = np.array([0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0])


def sky_css() -> str:
    bg = hex_rgb(TOKENS['night'])
    parts = []
    for pos, off in SKY_STOPS:
        t = np.clip(bg + np.array(off) / 255, 0, 1)
        rgb, a = solve_rgba(t[None, :], bg)
        R, G, B = (int(round(v * 255)) for v in rgb[0])
        parts.append(f'rgba({R},{G},{B},{a[0]:.4f}) {pos * 100:.0f}%')
    return ', '.join(parts)


def moon_css() -> str:
    bg = hex_rgb(TOKENS['night'])
    E = (1 + (MOON_R / 0.5) ** 2) ** -1.5 * (1 - smoothstep(0.45, 1.0, MOON_R))
    col = to_lin(hex_rgb(MOON_COLOUR))
    target = to_srgb(to_lin(bg)[None, :] + 0.009 * E[:, None] * col / col.max())
    rgb, a = solve_rgba(target, bg)
    return css_stops(rgb, a, MOON_R)


def write_generated() -> dict:
    r = STOP_R
    info = {}
    lines = [
        '/**',
        ' * GENERATED by apps/web/scripts/atmosphere/make_textures.py. Do not edit by hand; change the model',
        ' * in the script and re-run it. Owner: AT.',
        ' *',
        ' * Light pools as CSS radial-gradient stops, solved so that, over their surface token, the result',
        ' * equals a photographed pool: inverse-square falloff under a lampshade cone, bounce light, a filmic',
        ' * shoulder, warmer and deeper toward the edge. Normal blending; transform and opacity only at runtime.',
        ' */',
        '',
        'export const POOL_STOPS = {',
    ]
    for surface in SURFACES:
        lines.append(f'  {surface}: {{')
        for kind in POOLS:
            rgb, a, target = solve_pool(kind, r, surface)
            lines.append(f"    {kind}: '{css_stops(rgb, a, r)}',")
            if surface == POOLS[kind]['surface']:
                info[kind] = target[0]
        lines.append('  },')
    lines.append('} as const;')
    lines.append('')
    lines.append('/** The surface each warmth belongs to by default. */')
    lines.append('export const POOL_SURFACE = { ' + ', '.join(f"{k}: '{v['surface']}'" for k, v in POOLS.items()) + ' } as const;')
    lines.append('')
    lines.append('/** sRGB centre colour of each pool at intensity 1, for contrast checks. */')
    lines.append('export const POOL_CORE = { ' + ', '.join(
        f"{k}: '#{''.join(f'{int(round(c * 255)):02x}' for c in v)}'" for k, v in info.items()) + ' } as const;')
    lines.append('')
    va = vignette_alpha(VIG_R)
    lines.append('/** Vignette stops per tone, for an ellipse sized to the farthest corner. Paper is a soft warm shade. */')
    lines.append('export const VIGNETTE_STOPS = {')
    for tone, (col, k) in VIGNETTE_TONES.items():
        stops = ', '.join(f'rgba({col[0]},{col[1]},{col[2]},{x * k:.4f}) {rr * 100:.0f}%' for x, rr in zip(va, VIG_R))
        lines.append(f"  {tone}: '{stops}',")
    lines.append('} as const;')
    lines.append('')
    pr = np.linspace(0, 1, 17)
    lines.append('/** Relative irradiance of each pool at r = 0, 1/16 .. 1 (for Motes: dust is only seen where it is lit). */')
    lines.append('export const POOL_PROFILE = {')
    for kind, p in POOLS.items():
        lines.append(f"  {kind}: [{', '.join(f'{v:.3f}' for v in pool_profile(p, pr))}],")
    lines.append('} as const;')
    lines.append('')
    lines.append('/** NightSky: vertical stops over --night (top to bottom), and the cool moonlight wash. */')
    lines.append(f"export const SKY_STOPS = '{sky_css()}';")
    lines.append(f"export const MOON_STOPS = '{moon_css()}';")
    lines.append('')
    lines.append(f'/** Grain: strongest speck alpha baked into grain-{VERSION}.webp. */')
    lines.append(f'export const GRAIN_ALPHA = {GRAIN_ALPHA};')
    lines.append('')
    lines.append(f"export const TEXTURE = {{ grain: '/textures/grain-{VERSION}.webp', paper: '/textures/paper-{VERSION}.webp' }} as const;")
    lines.append('')
    open(GEN_TS, 'w', encoding='utf-8').write('\n'.join(lines))
    return info


# ---------------------------------------------------------------- previews

def render_pool_preview(kind: str, n: int = 600, surface: str | None = None) -> Image.Image:
    """Simulates the browser: premultiplied sRGB interpolation between stops, then over the surface."""
    surface = surface or POOLS[kind]['surface']
    rgb, a, _ = solve_pool(kind, STOP_R, surface)
    bg = hex_rgb(TOKENS[surface])
    yy, xx = np.mgrid[0:n, 0:n]
    r = np.sqrt(((xx + 0.5) / n * 2 - 1) ** 2 + ((yy + 0.5) / n * 2 - 1) ** 2)
    pre = rgb * a[:, None]
    P = np.stack([np.interp(r, STOP_R, pre[:, i]) for i in range(3)], -1)
    A = np.interp(r, STOP_R, a)
    out = P + bg * (1 - A[..., None])
    return Image.fromarray(np.round(np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGB')


# ---------------------------------------------------------------- main

def save_webp_lossless(img: Image.Image, name: str) -> int:
    path = os.path.join(OUT, name)
    img.save(path, 'WEBP', lossless=True, quality=100, method=6)
    return os.path.getsize(path)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', help='directory for preview composites')
    args = ap.parse_args()
    check_tokens()
    os.makedirs(OUT, exist_ok=True)

    sizes = {}
    grain = make_grain()
    sizes[f'grain-{VERSION}.webp'] = save_webp_lossless(grain, f'grain-{VERSION}.webp')
    delta = paper_delta()
    paper = paper_rgba(delta)
    sizes[f'paper-{VERSION}.webp'] = save_webp_lossless(paper, f'paper-{VERSION}.webp')
    cores = write_generated()

    total = sum(sizes.values())
    for k, s in sizes.items():
        print(f'{k:24s} {s / 1024:6.1f} KB')
    print(f'{"total":24s} {total / 1024:6.1f} KB')
    q = grain_field()
    for tone in ('night', 'dusk', 'paper'):
        cb = hex_rgb(TOKENS[tone]).mean()
        for o in (0.06, 0.1):
            a = np.abs(q) * GRAIN_ALPHA * o
            d = np.where(q > 0, a * (1 - cb), -a * cb) * 255
            print(f'grain on {tone:5s} at opacity {o:.2f}: std {d.std():.2f} levels, mean {d.mean():+.2f}')
    print(f'paper delta std {delta.std():.2f} levels, range {delta.min():.1f}..{delta.max():.1f}')
    ink = luminance(hex_rgb('#f2ece4'))
    for k, c in cores.items():
        Lc = luminance(c)
        bg = hex_rgb(TOKENS[POOLS[k]['surface']])
        row = []
        for op in (1.0, 0.8, 0.6):
            mix = bg * (1 - op) + c * op  # CSS opacity composites in sRGB
            row.append(f'{op:.1f}: {(ink + .05) / (luminance(mix) + .05):.2f}')
        print(f'pool {k:10s} core #{"".join(f"{int(round(v * 255)):02x}" for v in c)}  night-ink contrast at intensity ' + ', '.join(row))

    if args.preview:
        d = args.preview
        os.makedirs(d, exist_ok=True)
        base = Image.new('RGBA', (paper.width * 3, paper.height * 2), TOKENS['paper'])
        for ox in range(0, base.width, paper.width):
            for oy in range(0, base.height, paper.height):
                base.alpha_composite(paper, (ox, oy))
        base.convert('RGB').save(os.path.join(d, 'paper-tiled.png'))
        base.crop((0, 0, 220, 220)).resize((660, 660), Image.NEAREST).convert('RGB').save(os.path.join(d, 'paper-crop3x.png'))
        amp = np.clip(128 + delta * 10, 0, 255).astype(np.uint8)
        Image.fromarray(np.tile(amp, (2, 3)), 'L').save(os.path.join(d, 'paper-delta-x10.png'))
        sheet = Image.new('RGB', (300 * len(POOLS), 300 * len(SURFACES)))
        for j, surface in enumerate(SURFACES):
            for i, kind in enumerate(POOLS):
                sheet.paste(render_pool_preview(kind, 300, surface), (300 * i, 300 * j))
        sheet.save(os.path.join(d, 'pools-sheet.png'))


if __name__ == '__main__':
    main()
