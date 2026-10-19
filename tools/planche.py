# Planche contact des photos candidates d'une ou plusieurs espèces, pour les choisir à l'œil.
# Usage : python3 tools/planche.py <dossier de travail> <sortie.jpg> <id>[:premier numéro] [id…]
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

COLS, W, H = 6, 260, 195
travail, sortie, ids = Path(sys.argv[1]), sys.argv[2], sys.argv[3:]
police = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 22)
petite = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)

blocs = []
for i in ids:
    i, _, debut = i.partition(":")
    meta = json.loads((travail / i / "meta.json").read_text())
    blocs.append((i, [ph for ph in meta if ph["n"] >= int(debut or 0)]))
hauteur = sum(32 + ((len(m) + COLS - 1) // COLS) * (H + 4) for _, m in blocs)
img = Image.new("RGB", (COLS * (W + 4), max(hauteur, 40)), "white")
d = ImageDraw.Draw(img)
y = 0
for i, meta in blocs:
    d.text((6, y + 4), i, fill="black", font=police)
    y += 32
    for k, ph in enumerate(meta):
        x, yy = (k % COLS) * (W + 4), y + (k // COLS) * (H + 4)
        f = travail / i / f"{ph['n']:02d}.jpg"
        if f.exists():
            t = Image.open(f).convert("RGB")
            t.thumbnail((W, H))
            img.paste(t, (x + (W - t.width) // 2, yy + (H - t.height) // 2))
        etiquette = f"{ph['n']} {ph.get('role', '')}"
        d.rectangle([x, yy, x + 8 + 13 * len(etiquette), yy + 26], fill="black")
        d.text((x + 4, yy + 2), etiquette, fill="yellow", font=police)
        d.text((x + 4, yy + H - 18), ph["fichier"][:34], fill="white", font=petite, stroke_width=2, stroke_fill="black")
    y += ((len(meta) + COLS - 1) // COLS) * (H + 4)
img.save(sortie, quality=80)
