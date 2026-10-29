# Exporter le film en vidéo verticale (TikTok, Reels, Shorts, statut WhatsApp)

Chaîne testée : page servie en local → enregistrement Chromium 1080×1920 → son synthétisé calé sur les temps forts → MP4 H.264 + AAC.

## 1. Préparer la page

- La page appelle `createUIStory` avec `onCue: (n) => (window.__cues ||= []).push([n, performance.now()])`.
- En mode vidéo, ajouter la classe `us-video` à l'élément racine (voir `assets/demo.html`, paramètre `?video=1`) : la scène prend tout l'écran et les éléments sont agrandis pour le format vertical.
- Pour une vidéo, garder **un seul chapitre** (15 à 20 s) : c'est la durée qui marche sur les réseaux.

## 2. Enregistrer

```bash
npx http-server dossier-de-la-page -p 8080 &
node scripts/record.mjs --url "http://localhost:8080/demo.html?video=1" --seconds 20 --out sortie
```

Produit `sortie/film.webm` et `sortie/cues.json` (temps forts en secondes depuis le début de la vidéo). `--width` / `--height` changent le format (1080×1350 pour un post carré-portrait, 1920×1080 pour YouTube).

## 3. Son

```bash
python3 scripts/sound.py sortie/cues.json sortie/sound.wav --duree 20
```

## 4. Assembler

```bash
ffmpeg -y -i sortie/film.webm -i sortie/sound.wav \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 192k -shortest -movflags +faststart sortie/film.mp4
```

## 5. Vérifier

```bash
ffmpeg -i sortie/film.mp4 -vf "fps=1.2,scale=180:320" planche/v%02d.png   # puis assembler en planche avec Pillow
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact sortie/film.mp4
```

Regarder chaque image de la planche, et écouter le début : le son du premier clic doit tomber exactement sur l'enfoncement du bouton. Si tout est décalé du même écart, ajouter ce décalage aux temps de `cues.json` avant de relancer `sound.py`.

Limite connue : l'enregistrement de Chromium suit l'horloge réelle ; sur une machine très chargée, une animation peut saccader. Fermer les autres programmes et relancer si la planche montre des images manquantes.
