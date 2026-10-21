# Installe dans photos/ les photos choisies dans tools/selection.json et écrit photos/credits.json.
# selection.json : { "id": ["03m", "07f", "11j", "02"] } = numéro de la candidate + rôle (m mâle, f femelle, j jeune).
# Usage : python3 tools/installer-photos.py <dossier de travail des candidates>
#         python3 tools/installer-photos.py <dossier des empreintes> --traces
#         (photos d'empreintes : tools/selection-traces.json → photos/traces/ et photos/traces.json)
import io, json, re, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
TRAVAIL = Path(sys.argv[1])
TRACES = "--traces" in sys.argv
SELECTION = RACINE / ("tools/selection-traces.json" if TRACES else "tools/selection.json")
DOSSIER = RACINE / ("photos/traces" if TRACES else "photos")
CREDITS = RACINE / ("photos/traces.json" if TRACES else "photos/credits.json")
UA = "chasse-especes-quiz/1.0 (https://github.com/Fragozozo/chasse-especes-quiz ; application pédagogique)"
ROLES = {"m": "male", "f": "femelle", "j": "jeune", "": ""}
LARGEUR = 800

def auteur_court(a):
    # Certaines fiches Commons mettent un long texte dans le champ auteur : on garde l'essentiel.
    a = re.sub(r"\s*Camera location.*$", "", a)
    m = re.search(r"taken by ([^.]+?) and released", a)
    if m:
        a = m.group(1)
    return a if len(a) <= 80 else a[:77].rstrip() + "…"

def telecharger(url):
    for essai in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500:
                raise
            attente = int(e.headers.get("retry-after") or 0) or 2 * 2 ** essai
            print(f"  attente {attente} s (HTTP {e.code})")
            time.sleep(attente)
    raise RuntimeError("trop de tentatives")

DOSSIER.mkdir(exist_ok=True)
selection = json.loads(SELECTION.read_text())
credits_path = CREDITS
anciens = json.loads(credits_path.read_text()) if credits_path.exists() else {}
sortie = {}
for id_, choix in selection.items():
    meta = {ph["n"]: ph for ph in json.loads((TRAVAIL / id_ / "meta.json").read_text())}
    liste = []
    for k, c in enumerate(choix, 1):
        n, role = int(c.rstrip("mfj")), ROLES[c.lstrip("0123456789")]
        ph = meta[n]
        nom = f"{id_}-{k}.jpg"
        deja = next((a for a in anciens.get(id_, []) if a["fichier"] == ph["fichier"]), None)
        cible = DOSSIER / nom
        if deja and deja["fichierLocal"] == nom and cible.exists():
            liste.append({**deja, "role": role, "auteur": auteur_court(deja["auteur"])})
            continue
        url = ph["vignette"].split("?")[0]
        url = url.replace("/500px-", "/960px-").replace("/400px-", "/960px-")
        try:
            donnees = telecharger(url)
        except Exception as e:
            print("  échec", id_, ph["fichier"], e)
            continue
        img = Image.open(io.BytesIO(donnees)).convert("RGB")
        if img.width > LARGEUR:
            img = img.resize((LARGEUR, round(img.height * LARGEUR / img.width)), Image.LANCZOS)
        img.save(cible, quality=78, optimize=True, progressive=True)
        liste.append({
            "fichierLocal": nom, "role": role, "fichier": ph["fichier"],
            "auteur": auteur_court(ph["auteur"]), "licence": ph["licence"], "licenceUrl": ph["licenceUrl"],
            "source": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(ph["fichier"]),
        })
        time.sleep(1)
    sortie[id_] = liste
    print(f"{id_} : {len(liste)} photo(s)")
# Garde les espèces déjà installées qui ne sont pas dans la sélection.
for id_, l in anciens.items():
    sortie.setdefault(id_, l)
credits_path.write_text(json.dumps(sortie, ensure_ascii=False, indent=1))
