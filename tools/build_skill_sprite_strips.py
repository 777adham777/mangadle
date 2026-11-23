"""Split the generated skill atlases into clean 4-frame horizontal PNG strips.

The atlases have faint alpha haze and thin cell-border lines, so each cell is thresholded
and only its real drawing (connected blobs of a useful size) is kept. Frames of one row share
one crop box (the union of the four drawings) so the animation does not jitter, and the strip
keeps the drawing's own aspect ratio: no empty padding around it, no squashing.
Prints the frame aspect ratios for css/background-art.css.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "concept-art" / "skill-sprites" / "source-atlases"
DEST = ROOT / "assets" / "skill-sprites"
FRAME_H = 320          # px per frame (shown at ~100-200 CSS px, sharp on 2x screens)
ALPHA_MIN = 56         # below this the atlas pixel is haze
PAD = 6
ROWS = {
    "shinobi": (2, ["woodcutting", "crafting"]),
    "seas": (3, [None, None, "voyaging"]),      # None = row not used in game
    "soul": (2, ["mining", "smithing"]),
    "ki": (2, ["gravity", "farming"]),
    "hex": (2, ["exorcism", None]),
    "hunter": (2, ["tracking", "tracking-trap"]),
    "echo": (3, ["archaeology", "restoration", None]),
}


def blobs_mask(alpha: np.ndarray) -> np.ndarray:
    """Keep connected blobs that are big enough and not thin border lines."""
    on = alpha >= ALPHA_MIN
    h, w = on.shape
    seen = np.zeros_like(on)
    keep = np.zeros_like(on)
    comps = []
    for y0, x0 in zip(*np.nonzero(on)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)])
        seen[y0, x0] = True
        pts = []
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and on[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        comps.append(pts)
    if not comps:
        return keep
    biggest = max(len(c) for c in comps)
    for pts in comps:
        ys = [p[0] for p in pts]
        xs = [p[1] for p in pts]
        bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        thin = min(bw, bh) <= 4 and max(bw, bh) > 40          # cell-border line
        frame = (bw > w * 0.8 or bh > h * 0.8) and len(pts) < bw * bh * 0.06   # cell outline
        if len(pts) >= max(30, biggest * 0.004) and not thin and not frame:
            for y, x in pts:
                keep[y, x] = True
    return keep


def split_row(image: Image.Image, rows: int, row: int, name: str) -> float:
    width, height = image.size
    y0, y1 = round(row * height / rows), round((row + 1) * height / rows)
    cells, boxes = [], []
    for col in range(4):
        x0, x1 = round(col * width / 4), round((col + 1) * width / 4)
        cell = np.array(image.crop((x0, y0, x1, y1)))
        keep = blobs_mask(cell[:, :, 3])
        cell[:, :, 3] = np.where(keep, cell[:, :, 3], 0)
        cells.append(Image.fromarray(cell))
        ys, xs = np.nonzero(keep)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    cw, ch = cells[0].size
    box = (max(0, min(b[0] for b in boxes) - PAD), max(0, min(b[1] for b in boxes) - PAD),
           min(cw, max(b[2] for b in boxes) + PAD), min(ch, max(b[3] for b in boxes) + PAD))
    bw, bh = box[2] - box[0], box[3] - box[1]
    fw = round(bw * FRAME_H / bh)
    strip = Image.new("RGBA", (fw * 4, FRAME_H), (0, 0, 0, 0))
    for col, cell in enumerate(cells):
        frame = cell.crop(box).resize((fw, FRAME_H), Image.Resampling.LANCZOS)
        strip.alpha_composite(frame, (col * fw, 0))
    # Flat cel-shaded art: a 256-colour palette keeps it identical to the eye at ~1/3 the size.
    strip.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(DEST / f"{name}.png", optimize=True)
    return fw / FRAME_H


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for atlas, (rows, names) in ROWS.items():
        image = Image.open(SOURCE / f"{atlas}.png").convert("RGBA")
        for row, name in enumerate(names):
            if not name:
                continue
            ratio = split_row(image, rows, row, name)
            print(f'.skill-prop[data-sprite="{name}"] {{ aspect-ratio: {ratio:.3f}; }}')


if __name__ == "__main__":
    main()
