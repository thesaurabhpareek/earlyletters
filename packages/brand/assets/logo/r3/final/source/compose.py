"""Compose opaque RGB app-icon PNGs from a mark coverage mask.

python3 compose.py <mask.png> <out.png> <mode> [seed]
  mask: white mark on black, anti-aliased (rendered by Chromium from the vector).
  mode: default | dark | tinted
The tile gradient is computed in float and dithered (triangular-PDF noise, +-1 LSB) before 8-bit quantisation,
so the ~27 code values between #9A613C and #7F4F30 do not form visible ~38 px bands. The mark is composited
in float too (no double rounding). Output is RGB with no alpha channel (App Store rule).
"""
import sys
import numpy as np
from PIL import Image

def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)

MODES = {
    'default': ('#9A613C', '#7F4F30', '#FBF8F3'),
    'dark': ('#2C2926', '#1F1B18', '#D9A47E'),
    'tinted': ('#000000', '#000000', '#FFFFFF'),
}

def compose(mask_path, out_path, mode, seed=7):
    m = np.asarray(Image.open(mask_path).convert('L'), dtype=np.float64) / 255.0
    h, w = m.shape
    top, bot, fg = (hexrgb(c) for c in MODES[mode])
    t = (np.arange(h, dtype=np.float64) + 0.5) / h
    bg = top[None, :] * (1 - t[:, None]) + bot[None, :] * t[:, None]          # (h, 3)
    bg = np.repeat(bg[:, None, :], w, axis=1)                                 # (h, w, 3)
    img = bg * (1 - m[..., None]) + fg[None, None, :] * m[..., None]
    if mode != 'tinted':
        rng = np.random.default_rng(seed)
        noise = rng.random((h, w, 1)) - rng.random((h, w, 1))                 # TPDF in (-1, 1), same on all channels (no colour speckle)
        img = img + noise
    out = np.clip(np.rint(img), 0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGB').save(out_path, optimize=True)
    return out

def bands(path):
    """Distinct values down the tile's left edge (a column with no mark): banding check."""
    a = np.asarray(Image.open(path).convert('RGB'))
    col = a[:, 8, :]
    runs, last, n = [], None, 0
    for v in map(tuple, col):
        if v == last:
            n += 1
        else:
            if last is not None:
                runs.append(n)
            last, n = v, 1
    runs.append(n)
    return len(set(map(tuple, col))), max(runs)

if __name__ == '__main__':
    mask, out, mode = sys.argv[1:4]
    compose(mask, out, mode, int(sys.argv[4]) if len(sys.argv) > 4 else 7)
    im = Image.open(out)
    print(out, im.mode, im.size, 'distinct/longest-run', bands(out))
