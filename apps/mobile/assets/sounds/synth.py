#!/usr/bin/env python3
"""Synthesize the Early Letters UI sound palette. Every sound is ours.

No samples, no downloads: sine partials with soft envelopes ("felt bell")
plus seeded, filtered noise ("paper"). Deterministic: same script, same bytes.

Usage:  python3 synth.py            # writes *.wav next to this file
Needs:  Python 3.9+, numpy.  Optional: ffmpeg (prints loudness report).

Output: mono, 44.1 kHz, 16-bit PCM WAV. WAV (not AAC/m4a) on purpose:
AAC adds encoder priming silence at the start of the file, which makes a
120 ms tick feel late, and .caf does not play on Android. These files are
small (under 70 KB each).

Spec and rationale: docs/design/SOUND.md
"""

import math
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
RNG_SEED = 20261001

# D major pentatonic, kept in the warm middle register (no shrill highs).
E4, A4, B4, D5, Fs5, A5 = 329.63, 440.0, 493.88, 587.33, 739.99, 880.0


def t_axis(ms):
    return np.arange(int(SR * ms / 1000)) / SR


def felt_bell(freq, ms, decay_ms, attack_ms=6.0, brightness=0.35):
    """A soft mallet on a small bell: fundamental, octave, a slightly
    stretched 3rd partial. Higher partials decay faster (warmth)."""
    t = t_axis(ms)
    partials = [(1.0, 1.0, 1.0), (2.0, brightness, 0.55), (3.01, brightness * 0.35, 0.35)]
    y = np.zeros_like(t)
    for ratio, amp, dscale in partials:
        y += amp * np.sin(2 * math.pi * freq * ratio * t) * np.exp(-t / (decay_ms / 1000 * dscale))
    attack = np.clip(t / (attack_ms / 1000), 0, 1)
    y *= 0.5 - 0.5 * np.cos(math.pi * attack)  # raised-cosine attack, no click
    r = min(len(y), int(SR * 0.015))
    y[-r:] *= 0.5 + 0.5 * np.cos(np.linspace(0, math.pi, r))  # release, no end click
    return y


def biquad(x, kind, f0, q=0.707):
    """RBJ cookbook biquad (lowpass / highpass / bandpass)."""
    w0 = 2 * math.pi * f0 / SR
    alpha = math.sin(w0) / (2 * q)
    c = math.cos(w0)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # bandpass, 0 dB peak
        b = [alpha, 0.0, -alpha]
    a = [1 + alpha, -2 * c, 1 - alpha]
    b = [v / a[0] for v in b]
    a = [1.0, a[1] / a[0], a[2] / a[0]]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, xi in enumerate(x):
        yi = b[0] * xi + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        y[i] = yi
    return y


def paper(ms, lo, hi, env_points, seed_offset=0):
    """Filtered noise with a piecewise-linear envelope.
    env_points: [(time_ms, gain), ...]"""
    rng = np.random.default_rng(RNG_SEED + seed_offset)
    n = rng.standard_normal(int(SR * ms / 1000))
    n = biquad(biquad(n, "hp", lo), "lp", hi)
    t = t_axis(ms) * 1000
    ts, gs = zip(*env_points)
    return n * np.interp(t, ts, gs)


def place(total_ms, *layers):
    """Mix (offset_ms, signal) layers into one buffer."""
    out = np.zeros(int(SR * total_ms / 1000))
    for offset_ms, sig in layers:
        i = int(SR * offset_ms / 1000)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i]
    return out


def finish(y, peak_dbfs, tail_ms=12):
    y = biquad(y, "lp", 5000)   # nothing bright near a sleeping baby
    y = biquad(y, "hp", 120)    # no rumble through phone speakers
    y = y - np.mean(y)
    n = int(SR * tail_ms / 1000)
    y[-n:] *= np.linspace(1, 0, n)  # guaranteed silent last sample
    y[:32] *= np.linspace(0, 1, 32)
    target = 10 ** (peak_dbfs / 20)
    return y * (target / np.max(np.abs(y)))


def write_wav(name, y):
    path = os.path.join(HERE, f"{name}.wav")
    pcm = np.clip(np.round(y * 32767), -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


# ---------------------------------------------------------------- palette
SOUNDS = {}

# 1. Nib down: a pen touching paper, then one soft note. 120 ms.
SOUNDS["record_start"] = (finish(place(
    120,
    (0, paper(30, 1500, 4500, [(0, 0), (3, 0.5), (30, 0)], 1)),
    (4, felt_bell(D5, 116, 45, brightness=0.25)),
), -22), 120)

# 2. Nib lifts: same voice a fourth lower, slightly longer. Closure. 140 ms.
SOUNDS["record_stop"] = (finish(place(
    140,
    (0, felt_bell(A4, 140, 55, brightness=0.25)),
    (2, paper(25, 1500, 4000, [(0, 0), (2, 0.35), (25, 0)], 2)),
), -23), 140)

# 3. Sealed: a sheet folding, then two notes rising a fifth (D5, A5).
#    Saved and filed into the month in one sound. 450 ms.
SOUNDS["sealed"] = (finish(place(
    450,
    (0, paper(90, 700, 3500, [(0, 0), (20, 0.30), (60, 0.20), (90, 0)], 3)),
    (70, felt_bell(D5, 380, 140, attack_ms=8)),
    (170, 0.8 * felt_bell(A5, 280, 120, attack_ms=8)),
), -18), 450)

# 4. Page turn: paper only, no pitch. Two soft swells. 220 ms.
SOUNDS["page_turn"] = (finish(place(
    220,
    (0, paper(220, 900, 3800, [(0, 0), (40, 0.6), (90, 0.25), (140, 0.5), (220, 0)], 4)),
), -26), 220)

# 5. Invite accepted: a letter arriving. D5, F#5, A5 at a walking pace. 700 ms.
SOUNDS["invite_accepted"] = (finish(place(
    700,
    (0, felt_bell(D5, 460, 160, attack_ms=8)),
    (120, 0.85 * felt_bell(Fs5, 460, 160, attack_ms=8)),
    (240, 0.75 * felt_bell(A5, 460, 170, attack_ms=8)),
), -18), 700)

# 6. Gentle error: two muted taps on one low note. Not a buzzer, not a fall. 300 ms.
SOUNDS["gentle_error"] = (finish(place(
    300,
    (0, felt_bell(E4, 150, 50, brightness=0.15)),
    (130, 0.8 * felt_bell(E4, 170, 55, brightness=0.15)),
), -24), 300)


def report(path):
    if not shutil.which("ffmpeg"):
        return ""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "astats=metadata=0", "-f", "null", "-"],
        capture_output=True, text=True)
    peak = rms = "?"
    for line in r.stderr.splitlines():
        if "Peak level dB" in line and peak == "?":
            peak = line.split(":")[-1].strip()
        if "RMS level dB" in line and rms == "?":
            rms = line.split(":")[-1].strip()
    return f"peak {peak} dBFS, RMS {rms} dBFS"


if __name__ == "__main__":
    for name, (y, ms) in SOUNDS.items():
        p = write_wav(name, y)
        print(f"{name:16s} {ms:4d} ms  {os.path.getsize(p):6d} B  {report(p)}")
