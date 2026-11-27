"""Slice ChatGPT icon sheets (6 icons: 3 columns x 2 rows) into game-ready item icons.

    python tools/slice_icon_sheet.py                 # every art-incoming/armory/sheet-<n>.png found
    python tools/slice_icon_sheet.py 3               # only sheet-3.png
    python tools/slice_icon_sheet.py path.png 3      # any file, as batch 3
    python tools/slice_icon_sheet.py --check         # are all 53 armory icons there, 256x256 RGBA, registered?
    python tools/slice_icon_sheet.py --depth [n]     # the skill-depth sheets (art-incoming/depth/, docs/DEPTH-ICONS.md)
    python tools/slice_icon_sheet.py --missing [n]   # 8-icon 4x2 sheets (art-incoming/missing/, docs/MISSING-ICONS.md)
    options: --dry (preview only)  --holes (on a white/grey background, also clear enclosed pockets of it)

Batch <n> lists the 6 item ids in reading order (left to right, top row first): docs/ARMORY-ICONS.md
gives ChatGPT the same order. For each icon the script:
  1. finds the background: real transparency when the sheet has it (faint alpha haze is dropped),
     otherwise the flat or checkerboard colour of the sheet border, flood-filled from the edges
     (the icons' thick dark outline stops it), with the edge pixels un-mixed from that colour;
  2. finds the gutters between the 6 cells (lowest-ink column / row near the expected cut);
  3. keeps the drawing (connected blobs of a useful size, grid lines dropped), crops it, fits it
     centred in 256x256 like the existing icons, and saves assets/item-icons/<world>/<id>.png;
  4. adds the ids to js/item-images.js (the game and the service worker read that map).
A preview of the batch on a dark and a light tile is written next to the sheet (<sheet>-preview.png).
"""

import re
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "art-incoming" / "armory"
ICONS = ROOT / "assets" / "item-icons"
MAP_JS = ROOT / "js" / "item-images.js"
SIZE, FIT = 256, 240        # output tile, longest side of the drawing inside it
ALPHA_MIN = 48              # below this a "transparent" pixel is haze
COLS, ROWS = 3, 2

# id -> world folder, in sheet order (6 per sheet; the last sheet has 5).
WORLD = {
    "leaf": ["leaf_weights", "three_prong_kunai", "chakra_threads", "springtime_suit", "sand_gourd", "shark_skin_sword"],
    "seas": ["justice_coat", "red_vest", "straw_hat", "wado_blade", "black_leg_boots", "weather_baton", "sniper_goggles", "seastone_cuffs"],
    "soul": ["asauchi", "flash_sandals", "quincy_cross", "hollow_mask_half", "captain_haori", "bankai_blade"],
    "kaio": ["turtle_gi", "power_pole", "nimbus_charm", "senzu_pouch", "ki_blaster", "z_sword", "fusion_earrings"],
    "hex": ["jujutsu_uniform", "resonance_hammer", "playful_cloud", "cursed_finger", "sealing_cube", "inverted_spear", "limitless_blindfold"],
    "hunter": ["hunter_rod", "ten_vest", "medic_briefcase", "steel_skateboard", "steel_yoyos", "chain_of_judgement", "joker_cards", "royal_carapace"],
    "echo": ["nichirin_blade", "fox_warding_mask", "slayer_uniform", "stopped_watch", "steel_balls", "checkered_haori", "stand_arrow", "hanafuda_earrings"],
    "rift": ["torn_mask", "rift_mantle", "crossover_blade"],
}
# --depth: the skill-depth items (js/depth.js, docs/DEPTH-ICONS.md), sheets in art-incoming/depth/.
DEPTH_WORLD = {
    "leaf": ["chakra_sap", "fossil_amber", "living_wood", "divine_root", "living_idol", "divine_relief",
             "abundance_tonic_1", "abundance_tonic_2", "abundance_tonic_3", "thrift_tonic_1", "thrift_tonic_2", "thrift_tonic_3",
             "forager_tonic_1", "forager_tonic_2", "forager_tonic_3", "amber_pendant", "tool_woodcutting_4", "divine_bow"],
    "seas": ["fish_oil", "thunder_catfish", "coral_dragonet", "catfish_hotpot", "oil_tempura", "dragonet_sashimi",
             "thunder_harpoon", "tool_fishing_4"],
    "soul": ["reishi_dust", "sekki_stone", "kido_quartz", "sekki_ingot", "kido_ingot", "frostvoid_alloy", "sunstar_alloy",
             "sekki_bracers", "living_wood_mail", "frostvoid_scythe", "sunstar_plate", "kido_focus", "tool_mining_4"],
}
if "--depth" in sys.argv:
    WORLD, INCOMING = DEPTH_WORLD, ROOT / "art-incoming" / "depth"
FOLDER = {i: ("soul" if w == "rift" else w) for w, ids in WORLD.items() for i in ids}   # Rift gear sits with the Eye of the Rift
ORDER = [i for ids in WORLD.values() for i in ids]
BATCHES = {n + 1: ORDER[k:k + 6] for n, k in enumerate(range(0, len(ORDER), 6))}
# --missing: the 8-per-sheet batches (4x2) of docs/MISSING-ICONS.md, written by tools/missing_icons.js.
if "--missing" in sys.argv:
    import json
    spec = json.loads((ROOT / "tools" / "missing_icons.json").read_text(encoding="utf8"))
    COLS, ROWS, INCOMING = spec["cols"], spec["rows"], ROOT / "art-incoming" / "missing"
    BATCHES = {n + 1: [i for i, _ in s] for n, s in enumerate(spec["sheets"])}
    FOLDER = {i: f for s in spec["sheets"] for i, f in s}
    ORDER = [i for s in spec["sheets"] for i, _ in s]


# ------------------------------------------------------------------ background
def flood(cand, seeds):
    """Pixels of `cand` connected (4-way) to any seed pixel."""
    h, w = cand.shape
    out = np.zeros_like(cand)
    q = deque()
    for y, x in seeds:
        if cand[y, x] and not out[y, x]:
            out[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def border_colours(rgb):
    """The one or two colours (flat or checkerboard) that make up the sheet border."""
    ring = np.concatenate([rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3), rgb[:, :4].reshape(-1, 3), rgb[:, -4:].reshape(-1, 3)])
    q = (ring // 12).astype(int)
    keys, counts = np.unique(q[:, 0] * 10000 + q[:, 1] * 100 + q[:, 2], return_counts=True)
    top = keys[np.argsort(-counts)][:2]
    cols = []
    for k in top:
        sel = (q[:, 0] * 10000 + q[:, 1] * 100 + q[:, 2]) == k
        if sel.sum() > 0.1 * len(ring):
            cols.append(ring[sel].mean(axis=0))
    return np.array(cols)


def cut_out(img, holes):
    """RGBA float array with the background made transparent."""
    a = np.asarray(img.convert("RGBA")).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    if (al < 20).mean() > 0.2:                       # the sheet is really transparent
        al = np.where(al < ALPHA_MIN, 0, al)
        return np.dstack([rgb, al]), "alpha"
    bgs = border_colours(rgb)
    d = np.min(np.linalg.norm(rgb[:, :, None, :] - bgs[None, None], axis=-1), axis=-1)
    near = np.argmin(np.linalg.norm(rgb[:, :, None, :] - bgs[None, None], axis=-1), axis=-1)
    cand = d < 38
    h, w = cand.shape
    seeds = [(y, x) for y in (0, h - 1) for x in range(w)] + [(y, x) for x in (0, w - 1) for y in range(h)]
    bg = flood(cand, seeds)
    # Enclosed pockets (between two fists, inside a ring...): cleared when they are surely background,
    # i.e. the sheet uses a checkerboard (a pocket holding both squares) or a saturated key colour such
    # as pure green; with a white or grey background only on --holes, since icons have white parts too.
    keyed = len(bgs) == 1 and (bgs[0].max() - bgs[0].min()) > 120
    pockets = cand & ~bg
    if pockets.any() and (holes or keyed or len(bgs) == 2):
        for area, y0, x0, y1, x1, ys, xs in blobs(pockets):
            if area < 40:
                continue
            if not holes:
                # a generated background is flat: its pixels sit right on the key colour(s),
                # while painted shading drifts away from them
                if d[ys, xs].mean() > (6 if len(bgs) == 2 else 10):
                    continue
                if len(bgs) == 2 and (np.bincount(near[ys, xs], minlength=2) / area).min() < 0.2:
                    continue
            bg[ys, xs] = True
    al = np.where(bg, 0.0, 255.0)
    # Edge pixels: un-mix the background colour (colour-to-alpha) for a clean rim on any tile.
    edge = ~bg & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1)
                  | np.roll(bg, 2, 0) | np.roll(bg, -2, 0) | np.roll(bg, 2, 1) | np.roll(bg, -2, 1))
    ys, xs = np.nonzero(edge)
    B = bgs[near[ys, xs]]
    C = rgb[ys, xs]
    span = np.where(C < B, B, 255 - B)
    span = np.maximum(span, 1)
    t = np.clip(np.max(np.abs(C - B) / span, axis=1), 0.05, 1)
    rgb = rgb.copy()
    rgb[ys, xs] = np.clip((C - (1 - t)[:, None] * B) / t[:, None], 0, 255)
    al[ys, xs] = t * 255
    # Keyed colour (e.g. pure green): narrow slits the flood cannot reach (between two blades) keep
    # pixels that are just the key colour blended with the dark outline. Those lie on the line from the
    # outline colour to the key colour; real painted colours sit far from it. They fade out.
    if keyed:
        dark = rgb[edge & (rgb.sum(axis=2) < 240)]
        o = np.median(dark, axis=0) if len(dark) > 50 else np.array([42.0, 13.0, 30.0])
        kv = bgs[0] - o
        t = np.clip(((rgb - o) @ kv) / (kv @ kv), 0, 1)
        resid = np.linalg.norm(rgb - (o + t[..., None] * kv), axis=2)
        spill = ~bg & (resid < 30) & (t > 0.2)
        al = np.where(spill, al * np.clip((1 - t) / 0.8, 0, 1), al)
        rgb = np.where(spill[..., None], o, rgb)
    return np.dstack([rgb, al]), "key %s" % ", ".join("#%02x%02x%02x" % tuple(int(v) for v in c) for c in bgs)


# ------------------------------------------------------------------ grid and blobs
def cuts(profile, n):
    """n-1 cut positions: the lowest-ink line near each expected boundary."""
    L, out = len(profile), []
    for k in range(1, n):
        c, r = int(L * k / n), int(L * 0.09)
        out.append(c - r + int(np.argmin(profile[c - r:c + r])))
    return [0] + out + [L]


def blobs(fg):
    """Connected components of a boolean mask: list of (area, y0, x0, y1, x1, pixel index arrays)."""
    h, w = fg.shape
    seen = np.zeros_like(fg)
    out = []
    for y0, x0 in zip(*np.nonzero(fg)):
        if seen[y0, x0]:
            continue
        seen[y0, x0] = True
        q, ys, xs = deque([(y0, x0)]), [], []
        while q:
            y, x = q.popleft()
            ys.append(y); xs.append(x)
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        ys, xs = np.array(ys), np.array(xs)
        out.append((len(ys), ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, ys, xs))
    return out


def icon_from_cell(cell):
    h, w = cell.shape[:2]
    keep = np.zeros((h, w), bool)
    for area, y0, x0, y1, x1, ys, xs in blobs(cell[..., 3] > ALPHA_MIN):
        bw, bh = x1 - x0, y1 - y0
        line = (bw > 0.85 * w or bh > 0.85 * h) and (min(bw, bh) <= 12 or area < 0.08 * bw * bh)
        if area >= max(25, 0.0004 * h * w) and not line:   # drop specks and grid lines
            keep[ys, xs] = True
    if not keep.any():
        return None
    ys, xs = np.nonzero(keep)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop = cell[y0:y1, x0:x1].copy()
    crop[..., 3] *= keep[y0:y1, x0:x1]
    # Resize premultiplied, so the transparent edge never turns dark or pale.
    pm = crop.copy()
    pm[..., :3] *= pm[..., 3:4] / 255
    s = FIT / max(crop.shape[:2])
    nw, nh = max(1, round(crop.shape[1] * s)), max(1, round(crop.shape[0] * s))
    chans = [np.asarray(Image.fromarray(pm[..., i].astype(np.float32), "F").resize((nw, nh), Image.LANCZOS)) for i in range(4)]
    a = np.clip(chans[3], 0, 255)
    rgb = np.stack([np.where(a > 0, np.clip(c * 255 / np.maximum(a, 1e-3), 0, 255), 0) for c in chans[:3]], -1)
    out = np.zeros((SIZE, SIZE, 4), np.uint8)
    oy, ox = (SIZE - nh) // 2, (SIZE - nw) // 2
    out[oy:oy + nh, ox:ox + nw, :3] = rgb.astype(np.uint8)
    out[oy:oy + nh, ox:ox + nw, 3] = np.where(a < 8, 0, a).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# ------------------------------------------------------------------ item-images.js
def register(ids):
    src = MAP_JS.read_text(encoding="utf8")
    entries = dict(re.findall(r'^\s*"(\w+)": "([^"]+)"', src, re.M))
    for i in ids:
        entries[i] = "assets/item-icons/%s/%s.png" % (FOLDER[i], i)
    body = ",\n".join('  "%s": "%s"' % kv for kv in entries.items())
    MAP_JS.write_text("'use strict';\n/* Generated image paths for the %d item icons (tools/slice_icon_sheet.py adds the armory's). */\n"
                      "const ITEM_IMAGE_PATHS = Object.freeze({\n%s\n});\n" % (len(entries), body), encoding="utf8")


def preview(icons, path):
    n = len(icons)
    sheet = Image.new("RGBA", (n * (SIZE + 16) + 16, 2 * (SIZE + 16) + 16), (20, 20, 28, 255))
    for row, tile in enumerate(((38, 38, 52, 255), (226, 222, 214, 255))):
        for k, (_, im) in enumerate(icons):
            x, y = 16 + k * (SIZE + 16), 16 + row * (SIZE + 16)
            sheet.paste(Image.new("RGBA", (SIZE, SIZE), tile), (x, y))
            sheet.alpha_composite(im, (x, y))
    sheet.save(path)


def run(sheet_path, n, dry, holes):
    ids = BATCHES[n]
    img = Image.open(sheet_path)
    arr, mode = cut_out(img, holes)
    ink = arr[..., 3] > ALPHA_MIN
    xs, ys = cuts(ink.sum(axis=0), COLS), cuts(ink.sum(axis=1), ROWS)
    icons, missing = [], []
    for k, i in enumerate(ids):
        r, c = divmod(k, COLS)
        im = icon_from_cell(arr[ys[r]:ys[r + 1], xs[c]:xs[c + 1]])
        if im is None:
            missing.append(i)
            continue
        icons.append((i, im))
        if not dry:
            out = ICONS / FOLDER[i] / (i + ".png")
            out.parent.mkdir(parents=True, exist_ok=True)
            im.save(out, optimize=True)
    prev = Path(sheet_path).with_name(Path(sheet_path).stem + "-preview.png")
    preview(icons, prev)
    if not dry and icons:
        register([i for i, _ in icons])
    print("sheet %d  %s  %dx%d  background: %s  -> %d icons%s  preview: %s" % (
        n, Path(sheet_path).name, img.width, img.height, mode, len(icons),
        "  MISSING: " + ", ".join(missing) if missing else "", prev.relative_to(ROOT) if ROOT in prev.parents else prev))


def check():
    """Every armory icon present, 256x256 RGBA with transparent corners, and registered."""
    entries = dict(re.findall(r'^\s*"(\w+)": "([^"]+)"', MAP_JS.read_text(encoding="utf8"), re.M))
    bad = []
    for i in ORDER:
        path = ROOT / ("assets/item-icons/%s/%s.png" % (FOLDER[i], i))
        if entries.get(i) != "assets/item-icons/%s/%s.png" % (FOLDER[i], i):
            bad.append(i + " (not in js/item-images.js)")
        elif not path.exists():
            bad.append(i + " (no file)")
        else:
            im = Image.open(path)
            corners = [im.convert("RGBA").getpixel(xy)[3] for xy in ((0, 0), (SIZE - 1, 0), (0, SIZE - 1), (SIZE - 1, SIZE - 1))]
            if im.size != (SIZE, SIZE) or im.mode != "RGBA" or max(corners) > 0:
                bad.append("%s (%s %s, corner alpha %s)" % (i, im.size, im.mode, max(corners)))
    print("icons: %d / %d ok, map size %d" % (len(ORDER) - len(bad), len(ORDER), len(entries)))
    for b in bad:
        print("  BAD", b)
    return not bad


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry, holes = "--dry" in sys.argv, "--holes" in sys.argv
    if len(args) == 2:
        run(args[0], int(args[1]), dry, holes)
    elif len(args) == 1:
        run(INCOMING / ("sheet-%s.png" % args[0]), int(args[0]), dry, holes)
    else:
        found = sorted(INCOMING.glob("sheet-*.png"), key=lambda p: int(re.sub(r"\D", "", p.stem) or 0))
        found = [p for p in found if not p.stem.endswith("preview")]
        if not found:
            print("No sheet in %s (name them sheet-1.png ... sheet-%d.png)" % (INCOMING, len(BATCHES)))
        for p in found:
            run(p, int(re.sub(r"\D", "", p.stem)), dry, holes)
