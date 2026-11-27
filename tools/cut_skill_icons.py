"""Cut the painted skill icon sheets (art-incoming/skill-icons/sheet-<n>.png, 3 x 2 icons each)
into game-ready 256x256 transparent PNGs in assets/skill-icons/<skill>.webp.

    python tools/cut_skill_icons.py          # cut every sheet, write a preview next to them
    python tools/cut_skill_icons.py --dry    # preview only

The sheets come from ChatGPT/Codex with a dark glowing (or pale) painted background whose colour is
close to the icons' ink outline, so a colour key cannot work. Per cell:
  1. GrabCut, seeded with the cell border as background and the bright, saturated paint as foreground;
  2. the ink outline is grown back: dark pixels in a thin ring around that shape join it;
  3. the ink outline alone (pixels clearly darker than their surroundings), filled, is added: it brings
     back grey parts GrabCut drops. MODE can use that outline alone for an icon;
  4. holes are filled, tiny specks dropped, the edge feathered by a pixel, and the drawing is
     cropped and fitted centred in 256x256 like the item icons.
Spare icons (alternatives not used in the game) are cut too, into art-incoming/skill-icons/spare/.
"""

import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "art-incoming" / "skill-icons"
OUT = ROOT / "assets" / "skill-icons"
SPARE = INCOMING / "spare"
SIZE, FIT = 256, 240

# Reading order (left to right, top row first). None = keep only as a spare.
SHEETS = {
    1: ["woodcutting", "arts", "mining", "smithing", "fishing", "cooking"],
    2: ["voyaging", "character", "spare_training_aura", "farming", "exorcism", "tracking"],
    3: ["archaeology", "restoration", "spare_spirit_arrow", "spare_ribbon_dagger", "bonding", "gravity"],
}
# Silhouette source per icon: "both" = GrabCut + filled ink outline (default), "ink" = the outline only
# (drops soft glows that have no outline, e.g. Archaeology's pink rays).
MODE = {"archaeology": "ink", "spare_ribbon_dagger": "ink"}


def cut_cell(cell, mode="both"):
    h, w = cell.shape[:2]
    hsv = cv2.cvtColor(cell, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(cell, cv2.COLOR_BGR2LAB)
    L = lab[..., 0].astype(np.float32)

    # Background model: the cell border (outer 4%).
    b = max(8, int(min(h, w) * 0.04))
    ring = np.zeros((h, w), bool)
    ring[:b], ring[-b:], ring[:, :b], ring[:, -b:] = True, True, True, True

    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[ring] = cv2.GC_BGD
    # Sure paint: far from the border colour in Lab and well inside the cell.
    bgc = np.median(lab[ring].reshape(-1, 3), axis=0)
    dist = np.linalg.norm(lab.astype(np.float32) - bgc, axis=-1)
    inner = np.zeros((h, w), bool)
    inner[2 * b:-2 * b, 2 * b:-2 * b] = True
    mask[inner & (dist > 70)] = cv2.GC_PR_FGD
    mask[inner & (dist > 110) & (hsv[..., 1] > 60)] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cell, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)

    # Keep the big pieces only (sparkles and chips are separate blobs, so keep anything sizeable).
    n, lbl, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    keep = np.zeros_like(fg)
    big = st[1:, cv2.CC_STAT_AREA].max() if n > 1 else 0
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= max(120, big * 0.004):
            keep[lbl == i] = 1
    fg = keep

    # Grow the ink outline back: dark pixels in a ring around the shape (a few passes).
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    local_bg = cv2.GaussianBlur(np.where(fg, np.nan_to_num(L.mean()), L), (0, 0), 25)
    dark = (L < np.minimum(local_bg - 6, 70))
    for _ in range(14):
        grown = cv2.dilate(fg, k) & dark.astype(np.uint8)
        if not (grown & ~fg.astype(bool)).any():
            break
        fg = fg | grown

    # Second cue, the ink outline: pixels clearly darker than their surroundings close each drawn
    # shape. Filled, it brings back grey, unsaturated parts GrabCut drops (anvil, trowel, ground).
    soft = cv2.GaussianBlur(L, (0, 0), 18)
    ink = ((L < soft - 18) & (L < 90)).astype(np.uint8)
    ink[~inner] = 0
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    inkfill = np.zeros_like(fg)
    for c in cnts:
        if cv2.contourArea(c) > 400:
            cv2.drawContours(inkfill, [c], -1, 1, cv2.FILLED)
    fg = inkfill if mode == "ink" else fg | inkfill

    # Fill enclosed holes, smooth the edge a little.
    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    solid = np.zeros_like(fg)
    cv2.drawContours(solid, cnts, -1, 1, cv2.FILLED)
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, k)
    alpha = cv2.GaussianBlur(solid.astype(np.float32) * 255, (3, 3), 0.8)

    ys, xs = np.where(alpha > 8)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([cell, alpha.astype(np.uint8)])[y0:y1, x0:x1]
    s = FIT / max(rgba.shape[:2])
    nh, nw = max(1, round(rgba.shape[0] * s)), max(1, round(rgba.shape[1] * s))
    # Resize premultiplied so the edge does not pick up background colour.
    a = rgba[..., 3:4].astype(np.float32) / 255
    pm = np.dstack([rgba[..., :3].astype(np.float32) * a, a * 255])
    pm = cv2.resize(pm, (nw, nh), interpolation=cv2.INTER_AREA)
    aa = np.clip(pm[..., 3], 0, 255)
    rgb = np.where(aa[..., None] > 0, np.clip(pm[..., :3] * 255 / np.maximum(aa[..., None], 1e-3), 0, 255), 0)
    out = np.zeros((SIZE, SIZE, 4), np.uint8)
    oy, ox = (SIZE - nh) // 2, (SIZE - nw) // 2
    out[oy:oy + nh, ox:ox + nw, :3] = rgb.astype(np.uint8)
    out[oy:oy + nh, ox:ox + nw, 3] = aa.astype(np.uint8)
    return out


def tile(icons, bg):
    t = np.full((SIZE, SIZE * len(icons), 3), bg, np.uint8)
    for i, ic in enumerate(icons):
        a = ic[..., 3:4].astype(np.float32) / 255
        sl = t[:, i * SIZE:(i + 1) * SIZE]
        sl[:] = (ic[..., :3] * a + sl * (1 - a)).astype(np.uint8)
    return t


def main():
    dry = "--dry" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    SPARE.mkdir(parents=True, exist_ok=True)
    rows = []
    for n, ids in SHEETS.items():
        im = cv2.imread(str(INCOMING / f"sheet-{n}.png"))
        H, W = im.shape[:2]
        icons = []
        for i, sid in enumerate(ids):
            r, c = divmod(i, 3)
            cell = im[r * H // 2:(r + 1) * H // 2, c * W // 3:(c + 1) * W // 3]
            ic = cut_cell(cell, MODE.get(sid, "both"))
            icons.append(ic)
            if not dry:
                dst = (SPARE / f"{sid[6:]}.png") if sid.startswith("spare_") else (OUT / f"{sid}.webp")
                cv2.imwrite(str(dst), ic, [cv2.IMWRITE_WEBP_QUALITY, 92] if dst.suffix == ".webp" else [])
        rows.append(np.vstack([tile(icons, (24, 20, 30)), tile(icons, (236, 232, 226))]))
    cv2.imwrite(str(INCOMING / "preview.png"), np.vstack(rows))
    print("ok", "(dry)" if dry else f"-> {OUT}")


if __name__ == "__main__":
    main()
