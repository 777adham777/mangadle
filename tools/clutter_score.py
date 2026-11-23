"""Visual clutter score for game screenshots (Season 3 UX, "Méthode").

A simplified Feature Congestion after Rosenholtz, Li & Nakano, "Measuring visual clutter",
Journal of Vision 7(2):17, 2007: clutter is how much the colour and the luminance contrast
already vary locally, so a new element has a hard time standing out. Simplifications: no
orientation channel, Gaussian pyramid of 3 scales, colour clutter = cube root of the local
CIELab covariance volume, contrast clutter = local spread of a centre-surround filter.

The number is relative: compare the same screen before and after a change, never two
different screens. Rule for each UX sprint: no key screen's score goes up.

  python tools/clutter_score.py shots/*.png                    # print scores
  python tools/clutter_score.py shots/*.png --save base.json   # keep a baseline
  python tools/clutter_score.py shots/*.png --compare base.json  # flag screens that got busier

Shots: node tools/clutter_shots.js <outdir>  (Playwright, game served on http://localhost:8771).
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image


def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], -1)


def gauss(img, sigma):
    r = max(1, int(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    pad = np.pad(img, [(r, r), (r, r)] + [(0, 0)] * (img.ndim - 2), mode='reflect')
    out = np.apply_along_axis(lambda v: np.convolve(v, k, 'valid'), 0, pad)
    return np.apply_along_axis(lambda v: np.convolve(v, k, 'valid'), 1, out)


def clutter(path, width=720):
    im = Image.open(path).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    lab = srgb_to_lab(np.asarray(im, dtype=np.float64))
    colour, contrast = [], []
    for _ in range(3):
        mu = gauss(lab, 2.0)
        d = lab - mu
        cov = gauss(np.einsum('...i,...j->...ij', d, d).reshape(*lab.shape[:2], 9), 2.0).reshape(*lab.shape[:2], 3, 3)
        det = np.linalg.det(cov + np.eye(3) * 1e-3)
        colour.append(np.cbrt(np.clip(det, 0, None)).mean())
        L = lab[..., 0]
        dog = gauss(L[..., None], 1.0)[..., 0] - gauss(L[..., None], 3.0)[..., 0]
        spread = np.sqrt(gauss((dog - gauss(dog[..., None], 2.0)[..., 0])[..., None] ** 2, 2.0)[..., 0])
        contrast.append(spread.mean())
        lab = gauss(lab, 1.0)[::2, ::2]
    # weights put the two channels on a similar footing for UI screenshots
    return round(float(np.mean(colour)) * 0.6 + float(np.mean(contrast)) * 0.4, 2)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('images', nargs='+')
    ap.add_argument('--save')
    ap.add_argument('--compare')
    a = ap.parse_args()
    scores = {os.path.basename(p): clutter(p) for p in a.images}
    base = json.load(open(a.compare, encoding='utf-8')) if a.compare else {}
    worse = 0
    for name, s in scores.items():
        if name in base:
            delta = s - base[name]
            flag = '  BUSIER' if delta > 0.05 else ''
            worse += bool(flag)
            print(f'{name:28s} {s:6.2f}  (was {base[name]:.2f}, {delta:+.2f}){flag}')
        else:
            print(f'{name:28s} {s:6.2f}')
    if a.save:
        json.dump(scores, open(a.save, 'w', encoding='utf-8'), indent=1)
    sys.exit(1 if worse else 0)


if __name__ == '__main__':
    main()
