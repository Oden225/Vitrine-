# Sound design d'un film UI Story

Dans les promos de ce style, le son fait la moitié de l'effet : **chaque geste visuel a son son**, court, sec, et rien ne joue entre deux gestes. Pas de musique continue obligatoire ; si on en met une, elle reste sous les effets (−18 dB environ).

## Temps forts émis par le moteur (`onCue`)

| Nom | Moment | Son synthétisé par `scripts/sound.py` | Intention |
|---|---|---|---|
| `streak` | traînées de lumière | souffle en cloche 0,5 s | ouverture, anticipation |
| `pop` | le logo éclate | sinus qui chute 900 → 260 Hz + petit clic | impact, naissance |
| `tick` | chaque lettre du nom | clic aigu de 25 ms, très bas | machine à écrire légère |
| `cta` | le bouton apparaît | sinus qui monte 520 → 880 Hz | invitation |
| `click` | clic du curseur | bruit très court + clic 2 kHz | geste précis |
| `whoosh` | bascule 3D du bouton | souffle 0,42 s | transition |
| `land` | l'écran se pose | basse 130 → 55 Hz | poids, arrivée |
| `whip` | panoramique entre écrans | souffle court 0,26 s | vitesse |
| `liquid` | fonte liquide | « bloop » descendant 340 → 120 Hz | matière |
| `blip` | la notification apparaît | bip 1250 Hz | information |
| `riser` | remplissage de la barre | montée 280 → 1150 Hz avec trémolo, 1,5 s | tension |
| `ding` | coche de validation | deux notes (mi 6, si 6) qui résonnent | résolution |

## Modifier

- Changer un son : éditer la ligne correspondante dans `SOUNDS` (`sweep(f0, f1, durée, volume, attaque, relâchement)`, `noise(...)`, `bell(durée, volume)`, `mix(...)`).
- Ajouter un temps fort : appeler `cue('nom')` dans le moteur au moment voulu, puis ajouter `'nom'` dans `SOUNDS`.
- Utiliser de vrais échantillons (banque libre de droits) : remplacer la synthèse par la lecture d'un WAV mono 44,1 kHz et l'ajouter de la même façon à la piste. Vérifier la licence de chaque son.
- Le mixage final est normalisé à −1 dBFS ; si un son masque les autres, baisser son volume plutôt que monter les autres.
