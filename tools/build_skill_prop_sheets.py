"""Cut the ChatGPT prop sheets (art-incoming/props/<name>.png, 2x2 grid of 4 frames) into
the game's 4-frame horizontal strips (assets/skill-sprites/<name>.webp).

Frame 1 is top-left, 2 top-right, 3 bottom-left, 4 bottom-right. The generator does not always
keep the object at exactly the same spot in every cell, so frames 2-4 are re-aligned on frame 1
(best overlap of their opaque pixels) before cutting. All four frames then share one crop box,
so the animation does not jitter, and the strip keeps the drawing's own aspect ratio.
Prints the aspect-ratio rules for css/background-art.css.

    python tools/build_skill_prop_sheets.py            # every sheet found
    python tools/build_skill_prop_sheets.py mining     # only these
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art-incoming" / "props"
DEST = ROOT / "assets" / "skill-sprites"
NAMES = ["woodcutting", "crafting", "voyaging", "mining", "smithing", "gravity", "farming",
         "exorcism", "tracking", "tracking-trap", "archaeology", "restoration"]
FRAME_H = 400          # px per frame: the tallest prop (the tree) is ~330 CSS px on a wide screen
HAZE = 8               # alpha below this is generator noise
SOLID = 200            # alpha used to align frames (ignores soft glows)
PAD = 4
SEARCH = 48            # max re-alignment, in source px


def cells(sheet: Image.Image) -> list[np.ndarray]:
    w, h = sheet.size
    cw, ch = w // 2, h // 2
    out = []
    for x, y in ((0, 0), (cw, 0), (0, ch), (cw, ch)):
        a = np.array(sheet.crop((x, y, x + cw, y + ch)))
        a[a[:, :, 3] < HAZE] = 0
        out.append(a)
    return out


def overlap(ref: np.ndarray, mov: np.ndarray, dx: int, dy: int) -> int:
    """Opaque pixels shared by ref and mov shifted by (dx, dy)."""
    h, w = ref.shape
    ys, ye = max(0, dy), min(h, h + dy)
    xs, xe = max(0, dx), min(w, w + dx)
    return int(np.count_nonzero(ref[ys:ye, xs:xe] & mov[ys - dy:ye - dy, xs - dx:xe - dx]))


def best_shift(ref: np.ndarray, mov: np.ndarray) -> tuple[int, int]:
    # coarse search on a 4x smaller mask, then refine at full size
    k = 4
    r, m = ref[::k, ::k], mov[::k, ::k]
    s = SEARCH // k
    best = max(((overlap(r, m, dx, dy), dx, dy) for dx in range(-s, s + 1) for dy in range(-3, 4)))
    _, cx, cy = best
    best = max(((overlap(ref, mov, dx, dy), dx, dy)
                for dx in range(cx * k - k, cx * k + k + 1) for dy in range(cy * k - k, cy * k + k + 1)))
    return best[1], best[2]


def shift(a: np.ndarray, dx: int, dy: int) -> np.ndarray:
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    ys, ye = max(0, dy), min(h, h + dy)
    xs, xe = max(0, dx), min(w, w + dx)
    out[ys:ye, xs:xe] = a[ys - dy:ye - dy, xs - dx:xe - dx]
    return out


def build(name: str) -> float:
    frames = cells(Image.open(SOURCE / f"{name}.png").convert("RGBA"))
    ref = frames[0][:, :, 3] >= SOLID
    shifts = [(0, 0)]
    for f in frames[1:]:
        dx, dy = best_shift(ref, f[:, :, 3] >= SOLID)
        shifts.append((dx, dy))
    frames = [shift(f, dx, dy) for f, (dx, dy) in zip(frames, shifts)]
    h, w = frames[0].shape[:2]
    on = np.zeros((h, w), bool)
    for f in frames:
        on |= f[:, :, 3] > 0
    ys, xs = np.nonzero(on)
    box = (max(0, xs.min() - PAD), max(0, ys.min() - PAD), min(w, xs.max() + 1 + PAD), min(h, ys.max() + 1 + PAD))
    bw, bh = box[2] - box[0], box[3] - box[1]
    fw = round(bw * FRAME_H / bh)
    strip = Image.new("RGBA", (fw * 4, FRAME_H), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        img = Image.fromarray(f).crop(box).resize((fw, FRAME_H), Image.Resampling.LANCZOS)
        strip.alpha_composite(img, (i * fw, 0))
    strip.save(DEST / f"{name}.webp", quality=90, alpha_quality=100, method=6)
    print(f"/* {name}: shifts {shifts[1:]} */")
    return fw / FRAME_H


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[1:] or NAMES:
        ratio = build(name)
        print(f'.skill-prop[data-sprite="{name}"] {{ background-image: url(\'../assets/skill-sprites/{name}.webp\'); aspect-ratio: {ratio:.3f}; }}')


if __name__ == "__main__":
    main()
