"""Synthesizes the game's core sound effects from physical models: no samples, no oscillator beeps.

Sonic palette (one identity for the whole game, tuned to D yo-pentatonic D E G A B):
  koto      Karplus-Strong string, plectrum near the bridge, paulownia body resonances
  taiko     circular-membrane modes with the strike's tension pitch-glide
  rin/bell  singing-bowl modes, each split in a detuned pair so it beats like real bronze
  shakuhachi breath noise + scooped pitch (meri -> kari) + late vibrato
  wood      hardwood-bar modes (hyoshigi clap) for UI
  washi     granular paper crackle for page turns
  steel     inharmonic blade modes for crits
Every sound goes through its own synthetic room (frequency-dependent decay).

Run:  python tools/sfx_synth.py [outdir]     -> outdir/*.ogg + *.mp3 (Safari), masters in scratch/sfx/wav
The game plays them through js/sfx.js.
"""
import os
import subprocess
import sys

import numpy as np
import scipy.signal as sg
from scipy.io import wavfile

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/sfx'
WAV = os.path.join('scratch', 'sfx', 'wav')

# D yo scale, by octave
NOTE = {'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'D5': 587.33, 'E5': 659.26, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53, 'D7': 2349.32}


# ---------- primitives ----------
def T(d):
    return np.arange(int(round(d * SR))) / SR


def db(x):
    return 10 ** (x / 20)


def expenv(t, t60):
    return np.exp(-6.9 * t / t60)


def filt(x, kind, f, order=2):
    return sg.sosfilt(sg.butter(order, f, btype=kind, fs=SR, output='sos'), x)


def peak(x, f, q):
    b, a = sg.iirpeak(f, q, fs=SR)
    return sg.lfilter(b, a, x)


def ramp_in(x, ms=0.5):
    n = max(1, int(ms * SR / 1000))
    x = x.copy()
    x[:n] *= np.linspace(0, 1, n)
    return x


def noise(d, rng):
    return rng.standard_normal(int(round(d * SR)))


def sweep_lp(x, fc):
    """Two-pole (cascaded one-pole) lowpass whose cutoff follows the array fc, sample by sample."""
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s1 = s2 = 0.0
    for i in range(len(x)):
        s1 += a[i] * (x[i] - s1)
        s2 += a[i] * (s1 - s2)
        y[i] = s2
    return y


class Mix:
    def __init__(self, dur):
        self.b = np.zeros((2, int(dur * SR)))

    def add(self, x, at=0.0, gain=1.0, pan=0.0):
        x = np.atleast_2d(np.asarray(x, dtype=float))
        if x.shape[0] == 1:
            x = np.vstack([x, x])
        th = (pan + 1) * np.pi / 4
        g = np.array([np.cos(th), np.sin(th)]) * np.sqrt(2) * gain
        i = int(at * SR)
        n = min(x.shape[1], self.b.shape[1] - i)
        if n > 0:
            self.b[:, i:i + n] += x[:, :n] * g[:, None]
        return self


# ---------- rooms ----------
def make_ir(rt60, pre=0.01, bright=0.6, seed=7):
    rng = np.random.default_rng(seed)
    t = T(rt60 * 1.25)
    chans = []
    for _ in range(2):
        n = rng.standard_normal(len(t))
        lo, mid, hi = filt(n, 'lowpass', 500), filt(n, 'bandpass', [500, 3500]), filt(n, 'highpass', 3500)
        x = lo * expenv(t, rt60 * 1.15) + mid * expenv(t, rt60) + bright * hi * expenv(t, rt60 * 0.4)
        x *= 1 - np.exp(-t / 0.008)
        for _k in range(7):  # sparse early reflections
            j = int(rng.uniform(0.002, 0.035) * SR)
            x[j] += rng.uniform(-1, 1) * 9 * rng.uniform(0.4, 1)
        x = np.concatenate([np.zeros(int(pre * SR)), x])
        chans.append(x / np.sqrt(np.sum(x ** 2)))
    return np.array(chans)


ROOM_S = make_ir(0.28, pre=0.004, bright=0.5, seed=3)
ROOM_M = make_ir(0.6, pre=0.008, bright=0.55, seed=5)
HALL = make_ir(1.8, pre=0.018, bright=0.5, seed=9)
TEMPLE = make_ir(2.9, pre=0.03, bright=0.45, seed=11)


def reverb(x, ir, wet):
    w = np.array([sg.fftconvolve(x[c], ir[c]) for c in range(2)])
    out = np.zeros_like(w)
    out[:, :x.shape[1]] += x
    return out + wet * w


# ---------- instruments ----------
def koto(f, rng, dur=2.0, t60=1.6, bright=0.55, pluck=0.13, os_=4):
    fs = SR * os_
    c = 0.25 + 0.7 * bright                 # loop lowpass: higher = brighter, longer high partials
    N = int(round(fs / f - (1 - c) / c))    # compensate the filter's phase delay -> in tune
    g = 0.001 ** (1 / (f * t60))
    n = int(dur * fs)
    burst = rng.standard_normal(N)
    burst = sg.lfilter([0.5 + 0.5 * bright], [1, -(0.5 - 0.5 * bright)], burst)
    k = max(1, int(pluck * N))
    burst[k:] -= burst[:-k].copy()          # plectrum position comb (near the bridge = twangy)
    y = np.zeros(n)
    y[:N] = burst
    s = 0.0
    for i in range(N, n):
        s += c * (y[i - N] - s)
        y[i] += g * s
    y = sg.resample_poly(y, 1, os_)
    body = peak(y, 205, 3) * 0.5 + peak(y, 390, 4) * 0.35 + peak(y, 830, 3) * 0.2
    y = y + body
    return ramp_in(y / (np.max(np.abs(y)) + 1e-9), 0.3)


def taiko(f0, rng, dur=1.6, vel=1.0):
    t = T(dur)
    ratios = [1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501]
    t60s = [1.2, 0.55, 0.38, 0.32, 0.25, 0.2, 0.17, 0.14]
    amps = [1, 0.45, 0.3, 0.2, 0.15, 0.11, 0.08, 0.06]
    bend = 1 + 0.2 * vel * np.exp(-t / 0.028)  # head tension spikes at the strike
    x = np.zeros_like(t)
    for r, d, a in zip(ratios, t60s, amps):
        ph = 2 * np.pi * np.cumsum(f0 * r * bend * (1 + rng.normal(0, 0.004))) / SR
        x += a * expenv(t, d * (0.7 + 0.3 * vel)) * np.sin(ph)
    stick = filt(noise(dur, rng), 'lowpass', 1600 + 1200 * vel) * expenv(t, 0.018)
    skin = filt(noise(dur, rng), 'bandpass', [250, 900]) * expenv(t, 0.06)
    shell = np.sin(2 * np.pi * 142 * t) * expenv(t, 0.16)
    x = x + 0.55 * vel * stick + 0.35 * skin + 0.12 * shell
    return np.tanh(1.6 * x) / np.tanh(1.6)


def bell(f0, rng, dur=4.0, size=1.0, hum=False, felt=False):
    """Singing bowl / temple bell. size stretches decays. Each partial is a beating pair.
    felt: struck with a padded mallet (no click, soft onset, dull upper partials)."""
    t = T(dur)
    ratios = [1, 2.71, 5.06, 8.0, 11.4]
    t60s = [5.0, 3.0, 1.6, 0.9, 0.5]
    amps = [1, 0.55, 0.32, 0.18, 0.1]
    if felt:
        amps = [a * 0.35 ** k for k, a in enumerate(amps)]
    x = np.zeros_like(t)
    for r, d, a in zip(ratios, t60s, amps):
        f = f0 * r
        if f > 15000:
            continue
        beat = rng.uniform(0.6, 2.4) * (1 + 0.3 * r)
        for sgn in (-1, 1):
            x += 0.5 * a * expenv(t, d * size) * np.sin(2 * np.pi * (f + sgn * beat / 2) * t + rng.uniform(0, 0.4))
    if hum:
        x += 0.5 * expenv(t, 7 * size) * np.sin(2 * np.pi * f0 * 0.5 * t) * (1 - np.exp(-t / 0.04))
    if felt:
        return x * (1 - np.exp(-t / 0.004))
    strike = filt(noise(dur, rng), 'highpass', 3000) * expenv(t, 0.006)
    return ramp_in(x + 0.25 * strike, 0.4)


def blade(f0, rng, dur=0.9):
    t = T(dur)
    ratios = [1, 1.39, 1.83, 2.41, 3.07, 3.72, 4.6]
    t60s = [0.8, 0.62, 0.5, 0.4, 0.3, 0.24, 0.17]
    amps = [1, 0.8, 0.62, 0.5, 0.4, 0.3, 0.2]
    x = np.zeros_like(t)
    for r, d, a in zip(ratios, t60s, amps):
        f = f0 * r
        if f > 16000:
            continue
        b = rng.uniform(3, 8)
        for sgn in (-1, 1):
            x += 0.5 * a * rng.uniform(0.7, 1) * expenv(t, d) * np.sin(2 * np.pi * (f + sgn * b / 2) * t)
    scrape = filt(noise(dur, rng), 'bandpass', [3500, 10000]) * expenv(t, 0.05)
    return ramp_in(x / len(ratios) + 0.25 * scrape, 0.3)


def clink(f0, rng, dur=0.25):
    t = T(dur)
    ratios = [1, 1.506, 2.24, 2.77, 3.57]
    t60s = [0.2, 0.13, 0.09, 0.07, 0.05]
    x = np.zeros_like(t)
    for r, d in zip(ratios, t60s):
        x += rng.uniform(0.3, 1) * expenv(t, d) * np.sin(2 * np.pi * f0 * r * (1 + rng.normal(0, 0.01)) * t)
    click = filt(noise(dur, rng), 'highpass', 4000) * expenv(t, 0.0015)
    return ramp_in(x / 3 + 0.4 * click, 0.2)


def glass(f0, rng, dur=0.6):
    t = T(dur)
    x = np.zeros_like(t)
    for r, d, a in zip([1, 2.32, 4.25, 6.63], [0.38, 0.2, 0.12, 0.07], [1, 0.4, 0.2, 0.1]):
        if f0 * r < 16000:
            x += a * expenv(t, d) * np.sin(2 * np.pi * f0 * r * t)
    return ramp_in(x, 0.5)


def wood(f0, rng, dur=0.12, hard=1.0):
    t = T(dur)
    x = np.zeros_like(t)
    for r, d, a in zip([1, 2.76, 5.40, 8.93], [0.055, 0.026, 0.013, 0.008], [1, 0.45, 0.22, 0.1]):
        x += a * expenv(t, d) * np.sin(2 * np.pi * f0 * r * (1 + rng.normal(0, 0.006)) * t)
    click = filt(noise(dur, rng), 'bandpass', [1800, 8000]) * expenv(t, 0.0018)
    hollow = np.sin(2 * np.pi * f0 * 0.48 * t) * expenv(t, 0.03)
    return ramp_in(x + 0.55 * hard * click + 0.25 * hollow, 0.15)


def thump(rng, f_hi=140, f_lo=48, tau=0.018, t60=0.14, drive=2.0):
    t = T(t60 * 1.6)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / tau)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * expenv(t, t60)
    return np.tanh(drive * ramp_in(x, 0.4)) / np.tanh(drive)


def puff(rng, d=0.55, f_start=3500, f_end=250):
    t = T(d)
    fc = f_end + (f_start - f_end) * np.exp(-t / (d * 0.28))
    env = (1 - np.exp(-t / 0.008)) * expenv(t, d * 0.75)
    return np.array([sweep_lp(noise(d, rng), fc) * env for _ in range(2)]) * 2.2


def paper(rng, d=0.22, density=700):
    """Washi page turn: an air swish plus a cloud of tiny fibre crackles."""
    n = int(d * SR)
    t = T(d)
    shape = (t / d) ** 1.2 * (1 - t / d) ** 2.2
    shape /= shape.max()
    bands = [filt(noise(d, rng), 'bandpass', b) for b in ([1200, 2600], [2400, 5000], [4500, 9000], [7000, 12000])]
    x = np.zeros(n)
    p = shape / shape.sum()
    for _ in range(int(density * d)):
        i = rng.choice(n, p=p)
        L = int(rng.uniform(0.0005, 0.003) * SR)
        if i + L >= n:
            continue
        b = bands[rng.integers(len(bands))]
        x[i:i + L] += b[i:i + L] * np.hanning(L) * min(rng.pareto(3.5), 2.5) * 0.6
    swish = filt(noise(d, rng), 'bandpass', [500, 2600]) * shape * 0.35
    return x + swish


def shakuhachi(rng, notes, dur):
    """notes: [(freq, start, end)], played legato. Scoop up into the first note, glide between notes."""
    t = T(dur)
    f = np.full_like(t, notes[0][0])
    amp = np.zeros_like(t)
    for k, (fr, s, e) in enumerate(notes):
        m = (t >= s)
        f[m] = fr
        if k == 0:  # meri -> kari: start ~a semitone flat and rise
            mm = (t >= s) & (t < s + 0.12)
            f[mm] = fr * 2 ** ((-1.1 * (1 - (t[mm] - s) / 0.12) ** 2) / 12)
    f = np.convolve(f, np.ones(900) / 900, mode='same')  # ~20 ms glides
    f[:450] = f[450]
    s0, e1 = notes[0][1], notes[-1][2]
    amp = np.clip((t - s0) / 0.06, 0, 1) * np.clip((e1 - t) / 0.22, 0, 1)
    swell = 1 + 0.25 * np.clip((t - notes[-1][1]) / 0.4, 0, 1)
    vib_depth = 0.0065 * np.clip((t - notes[-1][1] - 0.18) / 0.3, 0, 1)
    f = f * (1 + vib_depth * np.sin(2 * np.pi * 5.3 * t))
    jitter = 1 + 0.06 * filt(noise(dur, rng), 'lowpass', 9) * 8
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = sum(a * np.sin(k * ph) for k, a in zip(range(1, 6), [1, 0.4, 0.16, 0.08, 0.035]))
    breath_air = filt(noise(dur, rng), 'bandpass', [1500, 6000]) * 0.07
    breath_tone = peak(noise(dur, rng), float(np.mean([n[0] for n in notes])), 6) * 0.3
    x = (tone + breath_air + breath_tone) * amp * swell * jitter
    for fr, s, e in notes:  # muraiki: the breath burst at each attack
        burst = filt(noise(dur, rng), 'bandpass', [700, 4500]) * np.where(t >= s, expenv(np.maximum(t - s, 0), 0.09), 0)
        x += 0.35 * burst
    return x


def choir(rng, freqs, dur, attack, t60):
    """Additive 'aah' voices: each harmonic weighted by vowel formants, 3 detuned singers per note."""
    t = T(dur)
    formants = [(800, 90, 1.0), (1150, 100, 0.5), (2900, 140, 0.22), (3900, 160, 0.08)]
    out = np.zeros_like(t)
    for f0 in freqs:
        for _ in range(3):
            vib = 1 + 0.0045 * np.sin(2 * np.pi * rng.uniform(4.6, 5.6) * t + rng.uniform(0, 6)) + rng.uniform(-0.005, 0.005)
            ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
            k = 1
            while k * f0 < 7000:
                hf = k * f0
                g = sum(a / (1 + ((hf - F) / bw) ** 2) for F, bw, a in formants) + 0.02
                out += (g / k ** 0.6) * np.sin(k * ph + rng.uniform(0, 6))
                k += 1
    env = np.where(t < attack, 0.5 - 0.5 * np.cos(np.pi * t / attack), expenv(np.maximum(t - attack, 0), t60))
    air = filt(noise(dur, rng), 'bandpass', [600, 3200]) * 0.4
    return (out / (len(freqs) * 3) + air * 0.05) * env


# ---------- output ----------
def finish(m, name, peak_db, ir=None, wet=0.0, tail_db=-62):
    x = m.b
    if ir is not None:
        x = reverb(x, ir, wet)
    x = np.array([filt(c, 'highpass', 30) for c in x])
    a = np.max(np.abs(x), axis=0)
    last = np.nonzero(a > a.max() * db(tail_db))[0][-1]
    x = x[:, :last + 1]
    n = min(int(0.02 * SR), x.shape[1])
    x[:, -n:] *= np.linspace(1, 0, n)
    x = x / np.max(np.abs(x))
    x = np.tanh(1.3 * x) / np.tanh(1.3)          # glue the transients a touch
    x = x / np.max(np.abs(x)) * db(peak_db)
    os.makedirs(WAV, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    wp = os.path.join(WAV, name + '.wav')
    wavfile.write(wp, SR, (x.T * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wp, '-c:a', 'libvorbis', '-q:a', '6',
                    os.path.join(OUT, name + '.ogg')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wp, '-c:a', 'libmp3lame', '-q:a', '3',
                    os.path.join(OUT, name + '.mp3')], check=True)
    print(f'{name:22s} {x.shape[1] / SR:5.2f}s')


# ---------- the sounds ----------
def hit_normal(v):
    rng = np.random.default_rng(100 + v)
    m = Mix(0.5)
    m.add(thump(rng, rng.uniform(150, 190), rng.uniform(58, 70), 0.012, rng.uniform(0.06, 0.08), 4.0), gain=0.6)
    body = filt(noise(0.12, rng), 'lowpass', rng.uniform(900, 1300)) * expenv(T(0.12), 0.045)
    m.add(ramp_in(body, 0.3), gain=0.8)
    punch = filt(noise(0.06, rng), 'bandpass', [160, 600]) * expenv(T(0.06), 0.03)
    m.add(ramp_in(punch, 0.3), gain=1.1)
    slap = filt(noise(0.03, rng), 'bandpass', [1800, 6000]) * expenv(T(0.03), 0.008)
    m.add(ramp_in(slap, 0.1), gain=0.35, pan=rng.uniform(-0.15, 0.15))
    tc = T(0.09)
    cloth = filt(noise(0.09, rng), 'bandpass', [900, 3500]) * (1 - np.exp(-tc / 0.01)) * expenv(tc, 0.05)
    m.add(cloth, at=0.006, gain=0.13, pan=rng.uniform(-0.3, 0.3))
    finish(m, f'hit_normal_{v + 1}', -4, ROOM_S, 0.16)


def hit_crit(v):
    rng = np.random.default_rng(200 + v)
    m = Mix(1.2)
    crack = filt(noise(0.04, rng), 'highpass', 2500) * expenv(T(0.04), 0.012)
    m.add(ramp_in(crack, 0.1), gain=0.6)
    m.add(thump(rng, rng.uniform(170, 200), rng.uniform(52, 60), 0.016, 0.12, 4.0), gain=0.8)
    body = filt(noise(0.15, rng), 'lowpass', 1200) * expenv(T(0.15), 0.07)
    m.add(ramp_in(body, 0.3), gain=0.6)
    f0 = rng.uniform(2350, 2900)
    m.add(np.vstack([blade(f0, rng), blade(f0 * 1.004, rng)]), at=0.004, gain=0.65)
    ts = T(0.2)
    shk = filt(noise(0.2, rng), 'bandpass', [3000, 9000]) * (1 - np.exp(-ts / 0.005)) * expenv(ts, 0.12)
    m.add(shk, at=0.012, gain=0.16, pan=rng.uniform(-0.4, 0.4))
    tsub = T(0.4)
    m.add(np.sin(2 * np.pi * 42 * tsub) * expenv(tsub, 0.15) * (1 - np.exp(-tsub / 0.004)), gain=0.25)
    finish(m, f'hit_crit_{v + 1}', -2, ROOM_M, 0.22)


def foe_death(v):
    rng = np.random.default_rng(300 + v)
    # Light on purpose: the killing blow already plays its hit. Just the foe fading out: a soft breath and one
    # faint ping (2026-11-27 feedback: the old thump + 3 pings stacked on the hit).
    m = Mix(0.9)
    m.add(puff(rng, rng.uniform(0.26, 0.32), f_start=1600, f_end=200), gain=0.5)
    m.add(glass(NOTE[['A6', 'B6', 'D7'][v]], rng, dur=0.5), at=0.05, gain=0.16, pan=rng.uniform(-0.3, 0.3))
    finish(m, f'foe_death_{v + 1}', -12, ROOM_M, 0.2)


def loot_common(v):
    rng = np.random.default_rng(400 + v)
    m = Mix(0.6)
    m.add(wood(rng.uniform(500, 650), rng, hard=0.6), gain=0.25)
    base = rng.uniform(3000, 4200)
    at, dt = 0.0, rng.uniform(0.07, 0.09)
    for g in [1, 0.55, 0.3, 0.14][:int(rng.integers(3, 5))]:
        m.add(clink(base * rng.uniform(0.97, 1.03), rng), at=at, gain=g * 0.8, pan=rng.uniform(-0.2, 0.2))
        at += dt
        dt *= 0.62
    finish(m, f'loot_common_{v + 1}', -7, ROOM_S, 0.14)


def loot_rare():
    rng = np.random.default_rng(500)
    m = Mix(2.5)
    m.add(koto(NOTE['A5'], rng, t60=1.3, bright=0.6), gain=0.75, pan=-0.2)
    m.add(koto(NOTE['D6'], rng, t60=1.7, bright=0.62), at=0.09, gain=0.7, pan=0.2)
    m.add(bell(NOTE['A6'], rng, dur=2.2, size=0.35), at=0.09, gain=0.12, pan=0.1)
    finish(m, 'loot_rare', -5, HALL, 0.3)


def loot_epic():
    rng = np.random.default_rng(600)
    m = Mix(3.5)
    m.add(thump(rng, 120, 60, 0.03, 0.3, 1.4), gain=0.35)
    run = [('D5', 0, 0.55), ('E5', 0.055, 0.6), ('G5', 0.11, 0.66), ('A5', 0.165, 0.72), ('D6', 0.24, 0.85)]
    for k, (n, at, g) in enumerate(run):
        m.add(koto(NOTE[n], rng, dur=2.6, t60=2.2 if k == len(run) - 1 else 1.3, bright=0.58),
              at=at, gain=g, pan=-0.35 + 0.7 * k / (len(run) - 1))
    m.add(bell(NOTE['D5'], rng, dur=3.2, size=0.7), at=0.24, gain=0.28)
    finish(m, 'loot_epic', -3, HALL, 0.38)


def loot_legendary():
    rng = np.random.default_rng(700)
    m = Mix(5.5)
    m.add(taiko(72, rng, dur=2.0, vel=1.0), gain=0.9)
    sweep = ['D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6']
    for k, n in enumerate(sweep):
        last = k == len(sweep) - 1
        m.add(koto(NOTE[n], rng, dur=3.0 if last else 1.6, t60=2.6 if last else 1.1, bright=0.6),
              at=0.06 + k * 0.032, gain=0.35 + 0.3 * k / len(sweep), pan=-0.6 + 1.2 * k / (len(sweep) - 1))
    m.add(bell(NOTE['D4'], rng, dur=5.0, size=1.0, hum=True), at=0.45, gain=0.5)
    m.add(bell(NOTE['D6'], rng, dur=3.0, size=0.5), at=0.45, gain=0.16, pan=0.25)
    m.add(choir(rng, [NOTE['D4'], NOTE['A4'], NOTE['D5'], NOTE['E5']], 4.6, 0.75, 1.6), at=0.3, gain=0.3)
    finish(m, 'loot_legendary', -1.5, TEMPLE, 0.42)


def level_up():
    rng = np.random.default_rng(800)
    # Subtle (2026-11-27 feedback: taiko + flute was too intrusive): two felt-struck bowls, a fifth apart.
    m = Mix(2.2)
    m.add(bell(NOTE['G5'], rng, dur=2.0, size=0.3, felt=True), gain=0.6, pan=-0.15)
    m.add(bell(NOTE['D6'], rng, dur=2.0, size=0.32, felt=True), at=0.12, gain=0.5, pan=0.15)
    finish(m, 'level_up', -10, HALL, 0.25)


def ui_click(v):
    rng = np.random.default_rng(900 + v)
    m = Mix(0.2)
    m.add(wood([1420, 1530, 1330][v], rng), gain=1.0)
    finish(m, f'ui_click_{v + 1}', -9, ROOM_S, 0.06)


def ui_tab(v):
    rng = np.random.default_rng(1000 + v)
    m = Mix(0.4)
    d = 0.2 + 0.03 * v
    a, b, c = paper(rng, d), paper(rng, d), paper(rng, d)
    m.add(np.vstack([a + 0.35 * b, a + 0.35 * c]), gain=1.0)
    finish(m, f'ui_tab_{v + 1}', -10, ROOM_S, 0.08)


if __name__ == '__main__':
    for v in range(4):
        hit_normal(v)
    for v in range(3):
        hit_crit(v)
        foe_death(v)
        ui_click(v)
    loot_rare()
    loot_epic()
    loot_legendary()
    level_up()
