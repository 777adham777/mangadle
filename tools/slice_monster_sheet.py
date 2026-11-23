"""Slice the ChatGPT monster sheets (docs/MONSTER-SPRITES.md) into game-ready foe sprites.

    python tools/slice_monster_sheet.py              # every sheet found in art-incoming/monsters/
    python tools/slice_monster_sheet.py w-ki b-2     # only these sheets
    options: --dry (preview only, writes nothing in assets/ or js/)

For each foe the script:
  1. finds its cell (3x2 grid of 512 px for a world sheet, two 768x1024 cells for a guardian sheet,
     one cell for b-5), moving each cut to the emptiest column near where it should be;
  2. keeps the drawing (alpha >= ALPHA_MIN), crops it to its bounding box plus a small margin, and
     records its height as a share of the cell: the game draws every foe at that share of one
     common height, so a Sprout Fiend stays smaller than a Stone Golem (size classes of the brief);
  3. saves three WebP files in assets/monsters/<realm>/: <id>.webp (base), <id>-hard.webp
     (Hardcore: darker, pushed to crimson, red rim) and <id>-torn.webp (a Rift Tear foe: violet
     grade, magenta cracks, magenta rim; guardians have none, they never appear torn);
  4. writes js/monster-art.js (name -> path, height share, aspect, guardian), which the arena
     (js/arena.js) and the service worker (sw.js) read.
A preview of each sheet (base / hard / torn on the arena's dark grey) is written to
art-incoming/monsters/<sheet>-preview.png. The sheets themselves are never committed.
"""

import json
import random
import sys
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "art-incoming" / "monsters"
OUT = ROOT / "assets" / "monsters"
MAP_JS = ROOT / "js" / "monster-art.js"
ALPHA_MIN = 24       # below this a pixel is haze
PAD = 8              # margin kept around the drawing (room for the variants' rim)
MAX_H = {False: 512, True: 900}   # output height cap: foe, guardian
QUALITY = 90

# sheet -> (cols, rows, realm folder per foe, foe names in reading order)
SHEETS = {
    "w-shinobi": (3, 2, "shinobi", ["Bandit Thug", "Rogue Apprentice", "Mist Assassin", "Puppet Drone", "Ninken Alpha", "Stone Golem"]),
    "w-seas": (3, 2, "seas", ["Navy Recruit", "Cannon Brute", "Merfolk Brawler", "Reef Shark", "Sea Leviathan", "Storm Corsair"]),
    "w-soul": (3, 2, "soul", ["Lesser Husk", "Lurking Husk", "Towering Husk", "Sand Wraith", "Masked Lancer", "Bone Priest"]),
    "w-ki": (3, 2, "ki", ["Wasteland Brawler", "Raging Ape", "Sprout Fiend", "Elite Soldier", "Armored Commander", "Horned Mutant"]),
    "w-hex": (3, 2, "hex", ["Grudge Spirit", "Hollow Sorcerer", "Shrine Specter", "Bound Corpse", "Veil Walker", "Elder Curse"]),
    "w-hunter": (3, 2, "hunter", ["Rival Examinee", "Swamp Mimic", "Cliff Wyvern", "Bandit Hunter", "Ruin Guardian", "Feral Chimera"]),
    "w-echo": (3, 2, "echo", ["Masked Vampire", "Sunlight Monk", "Living Statue", "Echo Thief", "Pillar Warrior", "Wind Pillar Guard"]),
    "b-1": (2, 1, ["shinobi", "hunter"], ["Ashen Fox Beast", "Chimera King"]),
    "b-2": (2, 1, ["seas", "ki"], ["Admiral of the Tide", "Crimson Tyrant"]),
    "b-3": (2, 1, ["soul", "hex"], ["Masked Sovereign", "Cursed Matriarch"]),
    "b-4": (2, 1, ["echo", "rift"], ["Pillar Lord", "Rift Emperor"]),
    "b-5": (1, 1, ["rift"], ["The Unbound"]),
}
slug = lambda name: name.lower().replace("'", "").replace(" ", "-")


# ------------------------------------------------------------------ cutting
def cuts(alpha, n, axis):
    """n+1 cut positions along an axis. ChatGPT does not keep to the grid (a wide beast crosses into the
    next cell), but it leaves empty bands between the drawings: the n-1 widest empty bands inside the
    sheet are the cuts. With too few of them, a cut falls on the emptiest line near the expected one."""
    ink = (alpha >= ALPHA_MIN).sum(axis=axis)        # axis 0: per column, axis 1: per row
    size = len(ink)
    if n == 1:
        return [0, size]
    empty = ink <= 2
    runs, k = [], 0
    while k < size:
        if empty[k]:
            e = k
            while e < size and empty[e]:
                e += 1
            if k > 0 and e < size:
                runs.append((e - k, k, e))
            k = e
        else:
            k += 1
    if len(runs) >= n - 1:
        best = sorted(sorted(runs, reverse=True)[:n - 1], key=lambda r: r[1])
        return [0] + [(a + b) // 2 for _, a, b in best] + [size]
    out = [0]
    for k in range(1, n):
        c, r = round(size * k / n), round(size / n * 0.12)
        seg = ink[c - r:c + r]
        best = np.flatnonzero(seg == seg.min())
        out.append(c - r + int(best[len(best) // 2]))
    return out + [size]


def components(alpha, f=2, min_px=12):
    """Connected shapes of the sheet (on a 1/f grid): list of (pixel mask at 1/f, centroid x, centroid y)."""
    h, w = alpha.shape
    small = (alpha[:h - h % f, :w - w % f] >= ALPHA_MIN).reshape(h // f, f, w // f, f).any(axis=(1, 3))
    lab = np.zeros(small.shape, np.int32)
    out, n = [], 0
    H, W = small.shape
    for y0, x0 in zip(*np.nonzero(small)):
        if lab[y0, x0]:
            continue
        n += 1
        stack, pts = [(y0, x0)], []
        lab[y0, x0] = n
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and small[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        stack.append((yy, xx))
        if len(pts) >= min_px:
            ys_, xs_ = np.array(pts).T
            out.append((n, xs_.mean() * f, ys_.mean() * f, len(pts)))
    return lab, out


def crop_drawing(cell):
    a = np.asarray(cell)[:, :, 3]
    ys, xs = np.nonzero(a >= ALPHA_MIN)
    if not len(ys):
        raise SystemExit("empty cell")
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    touch = [s for s, hit in (("left", x0 == 0), ("right", x1 == a.shape[1]), ("top", y0 == 0), ("bottom", y1 == a.shape[0])) if hit]
    img = cell.crop((x0, y0, x1, y1))
    # drop the haze: anything under ALPHA_MIN becomes fully transparent
    arr = np.asarray(img).copy()
    arr[arr[:, :, 3] < ALPHA_MIN] = 0
    img = Image.fromarray(arr)
    padded = Image.new("RGBA", (img.width + 2 * PAD, img.height + PAD), (0, 0, 0, 0))   # no margin under the feet
    padded.paste(img, (PAD, PAD))
    return padded, (x0, y0, x1, y1), touch


# ------------------------------------------------------------------ variants
def rim(img, color, width):
    """A solid outline of `color` around the drawing, under it."""
    a = img.getchannel("A").point(lambda v: 255 if v >= 96 else 0)
    grown = a.filter(ImageFilter.MaxFilter(width * 2 + 1))
    base = Image.new("RGBA", img.size, color + (0,))
    base.putalpha(grown)
    base.alpha_composite(img)
    return base


def grade(img, dark, mid, light, mix, darken=1.0):
    """Gradient-map the colours by luminance (dark -> mid -> light), mixed with the original."""
    arr = np.asarray(img).astype(np.float32)
    rgb, a = arr[:, :, :3], arr[:, :, 3:]
    lum = (rgb @ np.array([0.299, 0.587, 0.114], np.float32))[:, :, None] / 255.0
    d, m, l = (np.array(c, np.float32) for c in (dark, mid, light))
    t = np.clip(lum * 2, 0, 1)
    lo = d + (m - d) * t
    t2 = np.clip(lum * 2 - 1, 0, 1)
    hi = m + (l - m) * t2
    mapped = np.where(lum < 0.5, lo, hi)
    out = rgb * (1 - mix) + mapped * mix
    out *= darken
    return Image.fromarray(np.concatenate([np.clip(out, 0, 255), a], axis=2).astype(np.uint8))


def hard_variant(img):
    g = grade(img, (20, 4, 10), (150, 24, 36), (255, 196, 170), 0.42, 0.88)
    return rim(g, (255, 42, 58), 3)


def torn_variant(img, seed):
    g = grade(img, (26, 10, 51), (122, 42, 216), (255, 209, 240), 0.5)
    # magenta cracks across the body, clipped to it
    w, h = g.size
    rnd = random.Random(seed)
    cracks = Image.new("RGBA", g.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(cracks)
    for _ in range(3 + (w * h) // 90000):
        x, y = rnd.uniform(0.2, 0.8) * w, rnd.uniform(0.15, 0.85) * h
        pts = [(x, y)]
        ang = rnd.uniform(0, 6.283)
        for _ in range(rnd.randint(3, 6)):
            ang += rnd.uniform(-0.9, 0.9)
            step = rnd.uniform(0.04, 0.09) * h
            x, y = x + np.cos(ang) * step, y + np.sin(ang) * step
            pts.append((x, y))
        lw = max(3, round(h / 110))
        dr.line(pts, fill=(255, 47, 176, 255), width=lw * 2, joint="curve")
        dr.line(pts, fill=(255, 225, 245, 255), width=max(1, lw // 2), joint="curve")
    body = g.getchannel("A").point(lambda v: 255 if v >= 200 else 0).filter(ImageFilter.MinFilter(5))
    ca = np.minimum(np.asarray(cracks.getchannel("A")), np.asarray(body))
    cracks.putalpha(Image.fromarray(ca))
    g.alpha_composite(cracks)
    return rim(g, (255, 47, 176), 3)


# ------------------------------------------------------------------ main
def fit(img, boss):
    cap = MAX_H[boss]
    if img.height <= cap:
        return img
    return img.resize((round(img.width * cap / img.height), cap), Image.LANCZOS)


def on_grey(img, h):
    bg = Image.new("RGBA", img.size, (44, 46, 56, 255))
    bg.alpha_composite(img)
    return bg.convert("RGB").resize((max(1, round(img.width * h / img.height)), h))


def slice_sheet(name, dry, registry):
    cols, rows, realm, foes = SHEETS[name]
    sheet = Image.open(INCOMING / f"{name}.png").convert("RGBA")
    alpha = np.asarray(sheet)[:, :, 3]
    boss = name.startswith("b-")
    ys = cuts(alpha, rows, 1)
    xs_row = [cuts(alpha[ys[r]:ys[r + 1]], cols, 0) for r in range(rows)]   # each row has its own column cuts
    # every connected shape goes to the cell its centre falls in (a lance under a ribbon, a wing over
    # the next cell's cape stay with their owner)
    lab, comps = components(alpha)
    owner = {}
    for n, cx, cy, _ in comps:
        r = max(k for k in range(rows) if cy >= ys[k])
        xs = xs_row[r]
        owner[n] = r * cols + max(k for k in range(cols) if cx >= xs[k])
    f = 2
    previews = []
    for i, foe in enumerate(foes):
        c, r = i % cols, i // cols
        keep = [n for n, k in owner.items() if k == i]
        small = np.isin(lab, keep)
        mask = np.zeros(alpha.shape, bool)
        mask[:small.shape[0] * f, :small.shape[1] * f] = small.repeat(f, 0).repeat(f, 1)
        mask = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
        arr = np.asarray(sheet).copy()
        arr[~mask] = 0
        cell_h = sheet.height / rows
        img, box, touch = crop_drawing(Image.fromarray(arr))
        touch = []
        h_share = (box[3] - box[1]) / cell_h
        folder = realm[i] if isinstance(realm, list) else realm
        img = fit(img, boss)
        hard = hard_variant(img)
        torn = None if boss else torn_variant(img, zlib.crc32(foe.encode()))
        rel = f"{folder}/{slug(foe)}"
        note = f"  ! touches the cell {', '.join(touch)}" if touch else ""
        print(f"  {foe:22s} {img.width:4d}x{img.height:<4d} height {h_share:.2f} of the cell{note}")
        if not dry:
            (OUT / folder).mkdir(parents=True, exist_ok=True)
            img.save(OUT / f"{rel}.webp", quality=QUALITY, method=6)
            hard.save(OUT / f"{rel}-hard.webp", quality=QUALITY, method=6)
            if torn:
                torn.save(OUT / f"{rel}-torn.webp", quality=QUALITY, method=6)
        registry[foe] = {"p": rel, "h": round(h_share, 3), "a": round(img.width / img.height, 3), "boss": 1 if boss else 0}
        row = [on_grey(img, 300), on_grey(hard, 300)] + ([on_grey(torn, 300)] if torn else [])
        previews.append(row)
    W = max(sum(p.width for p in row) + 10 * len(row) for row in previews)
    prev = Image.new("RGB", (W, 310 * len(previews)), (20, 21, 26))
    for k, row in enumerate(previews):
        x = 0
        for p in row:
            prev.paste(p, (x, 310 * k))
            x += p.width + 10
    prev.save(INCOMING / f"{name}-preview.png")


def write_js(registry):
    order = [f for _, _, _, foes in SHEETS.values() for f in foes]
    lines = [f"  {json.dumps(f)}: {json.dumps(registry[f], separators=(',', ': '))}," for f in order if f in registry]
    MAP_JS.write_text(
        "'use strict';\n"
        "/* Foe sprites: name -> { p: path under assets/monsters (no extension), h: height as a share of its sheet cell,\n"
        "   a: width / height, boss: guardian sheet }. Variants: <p>-hard.webp (Hardcore), <p>-torn.webp (Rift Tear, not\n"
        "   for guardians). Generated by tools/slice_monster_sheet.py from art-incoming/monsters/: do not edit by hand. */\n"
        "var MONSTER_ART = {\n" + "\n".join(lines) + "\n};\n"
        "var MONSTER_ART_URLS = [];\n"
        "for (const k in MONSTER_ART) { const m = MONSTER_ART[k]; MONSTER_ART_URLS.push(`./assets/monsters/${m.p}.webp`, `./assets/monsters/${m.p}-hard.webp`); if (!m.boss) MONSTER_ART_URLS.push(`./assets/monsters/${m.p}-torn.webp`); }\n",
        encoding="utf-8")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    names = args or [n for n in SHEETS if (INCOMING / f"{n}.png").exists()]
    registry = {}
    if MAP_JS.exists():   # keep the foes of sheets not re-sliced this time
        txt = MAP_JS.read_text(encoding="utf-8")
        for line in txt.splitlines():
            line = line.strip()
            if line.startswith('"') and line.endswith("},"):
                k, v = line[:-1].split(": ", 1)
                registry[json.loads(k)] = json.loads(v)
    for n in names:
        print(n)
        slice_sheet(n, dry, registry)
    if not dry:
        write_js(registry)
        print(f"{len(registry)} foes in {MAP_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
