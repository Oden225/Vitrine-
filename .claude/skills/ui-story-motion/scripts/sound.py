#!/usr/bin/env python3
"""Sound design synthétisé pour un film UI Story (bibliothèque standard uniquement).

Lit cues.json (produit par record.mjs) et écrit sound.wav : un son court et
discret par temps fort, calé à la milliseconde. Usage :
    python3 sound.py sortie/cues.json sortie/sound.wav [--duree 20]
Puis assembler avec ffmpeg (voir references/export-video.md).
"""
import json, math, random, struct, sys, wave

SR = 44100
random.seed(4)


def env(n, attack, release):
    """Enveloppe attaque/relâchement exponentiel, en échantillons."""
    a = max(1, int(attack * SR))
    out = []
    for i in range(n):
        g = i / a if i < a else math.exp(-(i - a) / (release * SR))
        out.append(g)
    return out


def sweep(f0, f1, dur, vol, attack=0.004, release=0.06, shape='sine'):
    n = int(dur * SR); e = env(n, attack, release); ph = 0.0; s = []
    for i in range(n):
        f = f0 * (f1 / f0) ** (i / n)
        ph += 2 * math.pi * f / SR
        v = math.sin(ph) if shape == 'sine' else (2 / math.pi) * math.asin(math.sin(ph))
        s.append(v * e[i] * vol)
    return s


def noise(dur, vol, attack, release, cut0=0.05, cut1=0.05):
    """Bruit filtré (passe-bas à une pôle dont la coupure glisse de cut0 à cut1)."""
    n = int(dur * SR); e = env(n, attack, release); y = 0.0; s = []
    for i in range(n):
        k = cut0 + (cut1 - cut0) * i / n
        y += k * (random.uniform(-1, 1) - y)
        s.append(y * e[i] * vol * 4)
    return s


def bell(dur, vol):
    """Souffle en cloche (montée puis descente), pour les « whoosh »."""
    n = int(dur * SR); y = 0.0; s = []
    for i in range(n):
        p = i / n; k = 0.02 + 0.25 * math.sin(math.pi * p)
        y += k * (random.uniform(-1, 1) - y)
        s.append(y * math.sin(math.pi * p) ** 2 * vol * 3)
    return s


def mix(*parts):
    n = max(len(p) for p in parts)
    return [sum(p[i] for p in parts if i < len(p)) for i in range(n)]


SOUNDS = {
    'streak': lambda: bell(0.5, 0.35),                                   # traînées de lumière
    'pop':    lambda: mix(sweep(900, 260, 0.16, 0.5, release=0.05), noise(0.02, 0.2, 0.001, 0.005, 0.5, 0.5)),
    'tick':   lambda: sweep(3200, 2600, 0.025, 0.08, 0.001, 0.008),      # lettre qui s'écrit
    'cta':    lambda: sweep(520, 880, 0.14, 0.35, release=0.05),          # bouton qui apparaît
    'click':  lambda: mix(noise(0.012, 0.35, 0.0005, 0.004, 0.6, 0.6), sweep(2100, 1700, 0.03, 0.18, 0.001, 0.01)),
    'whoosh': lambda: bell(0.42, 0.5),                                   # bascule 3D
    'land':   lambda: sweep(130, 55, 0.22, 0.6, 0.002, 0.08),            # l'écran se pose
    'whip':   lambda: bell(0.26, 0.45),                                  # panoramique filé
    'liquid': lambda: mix(sweep(340, 120, 0.32, 0.45, 0.01, 0.12), sweep(170, 90, 0.3, 0.25, 0.02, 0.1, 'tri')),
    'blip':   lambda: sweep(1250, 1250, 0.09, 0.22, 0.002, 0.04),
    'riser':  lambda: [v * (0.6 + 0.4 * math.sin(2 * math.pi * 9 * i / SR)) for i, v in enumerate(sweep(280, 1150, 1.5, 0.16, 0.6, 0.5))],
    'ding':   lambda: mix(sweep(1318.5, 1318.5, 0.9, 0.3, 0.002, 0.25), sweep(1975.5, 1975.5, 0.9, 0.18, 0.002, 0.18)),
}


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    data = json.load(open(sys.argv[1]))
    cues = data['cues']
    dur = float(sys.argv[sys.argv.index('--duree') + 1]) if '--duree' in sys.argv else (max(t for _, t in cues) + 2 if cues else 5)
    track = [0.0] * int(dur * SR)
    cache = {}
    for name, t in cues:
        if name not in SOUNDS:
            continue
        snd = cache.setdefault(name, SOUNDS[name]())
        start = int(max(0, t) * SR)
        for i, v in enumerate(snd):
            if start + i < len(track):
                track[start + i] += v
    peak = max(1e-9, max(abs(v) for v in track))
    gain = min(1.0, 0.89 / peak)
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v * gain)) * 32767)) for v in track))
    print(f'{sys.argv[2]} : {len(cues)} temps forts, {dur:.1f} s')


if __name__ == '__main__':
    main()
