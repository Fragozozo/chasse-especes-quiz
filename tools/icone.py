# Dessine l'icône de l'app (empreinte de chevreuil sur fond vert forêt) dans icons/.
# Usage : python3 tools/icone.py
from PIL import Image, ImageDraw

def bezier(p0, p1, p2, p3, n=30):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3))
            for t in (i / n for i in range(n + 1))]

def pince(d, s, sens):
    # Moitié d'empreinte de chevreuil, reprise du dessin de traces.js (repère 200 × 200).
    pts = (bezier((104, 20), (124, 42), (138, 92), (138, 132)) + bezier((138, 132), (138, 164), (126, 182), (113, 182))
           + bezier((113, 182), (106, 182), (104, 170), (104, 158)))
    k = 0.0036
    d.polygon([(s * (0.5 + sens * (x - 100) * k), s * (0.5 + (y - 100) * k)) for x, y in pts], fill="#f3ecd8")

def icone(taille, marge=0.0, fond_plein=True):
    s = 1024
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if fond_plein:
        d.rectangle([0, 0, s, s], fill="#2f4a2a")
    else:
        d.rounded_rectangle([0, 0, s, s], radius=int(s * 0.22), fill="#2f4a2a")
    k = 1 - 2 * marge
    calque = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dc = ImageDraw.Draw(calque)
    dc.ellipse([s * 0.12, s * 0.12, s * 0.88, s * 0.88], outline="#e2560f", width=int(s * 0.035))
    pince(dc, s, 1)
    pince(dc, s, -1)
    calque = calque.resize((int(s * k), int(s * k)), Image.LANCZOS)
    img.alpha_composite(calque, (int(s * marge), int(s * marge)))
    return img.resize((taille, taille), Image.LANCZOS)

icone(512, fond_plein=False).save("icons/icon-512.png")
icone(192, fond_plein=False).save("icons/icon-192.png")
icone(512, marge=0.1).save("icons/icon-maskable-512.png")
icone(180).convert("RGB").save("icons/apple-touch-icon.png")
