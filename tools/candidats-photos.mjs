// Recherche des photos candidates sur Wikimedia Commons, pour chaque espèce.
// Télécharge des vignettes dans un dossier de travail et fabrique une planche contact par espèce,
// pour choisir ensuite à l'œil les photos à garder (tools/selection.json).
// Usage : node tools/candidats-photos.mjs <dossier de travail> [id d'espèce…]
//         node tools/candidats-photos.mjs <dossier de travail> --ajout <id> "<recherche Commons>" [nombre]
//         (ajoute des candidates à une espèce, par exemple pour trouver des photos de jeunes)
//         node tools/candidats-photos.mjs <dossier> --traces [id…]
//         (photos d'empreintes : autre dossier de travail, recherches et filtre propres aux traces)
import { writeFile, mkdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { ESPECES } from "../js/especes.js";

const TRACES = process.argv.includes("--traces");
if (TRACES) process.argv.splice(process.argv.indexOf("--traces"), 1);
const DOSSIER = process.argv[2];
if (!DOSSIER) throw new Error("Indiquer le dossier de travail");
const AJOUT = process.argv[3] === "--ajout" ? { id: process.argv[4], q: process.argv[5], n: Number(process.argv[6] || 12) } : null;
const SEULEMENT = AJOUT ? [] : process.argv.slice(3);
const PAR_ESPECE = 18;
const UA = { "User-Agent": "chasse-especes-quiz/1.0 (https://github.com/Fragozozo/chasse-especes-quiz ; application pédagogique)" };
const API = "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2";

const LIBRE = /(cc[- ]?by|cc0|public domain|domaine public|^pd|gfdl|free art)/i;
const HORS_SUJET = /(map|range|distribution|skull|skeleton|cr[aâ]ne|egg|oeuf|œuf|museum|mus[ée]um|naturalis|specimen|taxiderm|stuffed|mount(ed)?\b|empaill|drawing|dessin|illustration|painting|plate|lithograph|stamp|timbre|logo|sculpture|statue|track|footprint|feather|plume|dropping|scat|faeces|feces|hunting trophy|troph|carcass|dead|mort\b|roadkill|meat|menu|recipe|x-ray|\bzoo\b|tierpark|wildpark|captiv)/i;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const texte = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const existe = (p) => access(p).then(() => true, () => false);

async function requete(url, binaire = false) {
  for (let essai = 0; essai < 6; essai++) {
    let r;
    try {
      r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
    } catch (err) {
      console.log(`  délai dépassé, nouvel essai (${err.name})`);
      continue;
    }
    if (r.ok) return binaire ? Buffer.from(await r.arrayBuffer()) : r.json();
    if (r.status !== 429 && r.status < 500) throw new Error(`HTTP ${r.status}`);
    const attente = Number(r.headers.get("retry-after")) * 1000 || 2000 * 2 ** essai;
    console.log(`  attente ${Math.round(attente / 1000)} s (HTTP ${r.status})`);
    await pause(attente);
  }
  throw new Error("trop de tentatives");
}

async function chercher(q, n) {
  const d = await requete(`${API}&list=search&srnamespace=6&srlimit=${n}&srsearch=${encodeURIComponent(q)}`);
  return (d.query?.search || []).map((r) => r.title);
}

async function infos(titres) {
  const res = [];
  for (let i = 0; i < titres.length; i += 40) {
    const lot = titres.slice(i, i + 40);
    const d = await requete(`${API}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=400` +
      `&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|ImageDescription&titles=${encodeURIComponent(lot.join("|"))}`);
    for (const p of d.query?.pages || []) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      res.push({
        fichier: p.title.replace(/^File:/, "").replace(/ /g, "_"),
        vignette: ii.thumburl,
        mime: ii.mime, largeur: ii.width, hauteur: ii.height,
        auteur: texte(m.Artist?.value) || "Auteur inconnu",
        licence: texte(m.LicenseShortName?.value),
        licenceUrl: m.LicenseUrl?.value || "",
        description: texte(m.ImageDescription?.value).slice(0, 300),
      });
    }
  }
  return res;
}

// Pour les empreintes : le fichier doit parler de traces, et on garde les photos de petite taille.
const EST_TRACE = /(track|footprint|foot.?print|paw.?print|hoof.?print|spoor|empreinte|traces?\b|spur\b|spuren|trittsiegel|f[äa]hrte|trop|ślad|odcisk|pegada|huella|impronta|orma)/i;
const HORS_SUJET_TRACES = /(map|range|distribution|skull|skeleton|drawing|dessin|illustration|painting|plate|lithograph|stamp|logo|sculpture|statue|fossil|dinosaur|ichnite|sign|panneau|tafel)/i;

function convient(ph) {
  if (TRACES) {
    const t = `${ph.fichier} ${ph.description}`;
    return ph.mime === "image/jpeg" && LIBRE.test(ph.licence) && EST_TRACE.test(t) && !HORS_SUJET_TRACES.test(t) && ph.largeur >= 500;
  }
  if (ph.mime !== "image/jpeg") return false;
  if (!LIBRE.test(ph.licence)) return false;
  if (HORS_SUJET.test(ph.fichier) || HORS_SUJET.test(ph.description)) return false;
  if (ph.largeur < 800 || ph.hauteur < 500) return false;
  const ratio = ph.largeur / ph.hauteur;
  return ratio > 0.6 && ratio < 2.2;
}

// Devine le rôle (mâle, femelle, jeune) à partir du nom de fichier et de la description.
function role(ph) {
  const t = `${ph.fichier} ${ph.description}`.toLowerCase();
  const f = /(female|femelle|weibchen|♀|\bhen\b|\bdoe\b|\bhind\b|\bewe\b|\bcane\b|vixen|\bsow\b|\blaie\b|\bbiche\b|chevrette|\bhase\b)/.test(t);
  const m = /(\bmale\b|\bmâle\b|männchen|♂|\bdrake\b|\bcock\b|\bcoq\b|\bbuck\b|\bstag\b|\bram\b|\bboar\b|brocard|\bbelier\b|bélier|\bjars\b|\bgander\b)/.test(t);
  const j = /(juvenile|juvénile|\bjuv\b|\byoung\b|\bjeune\b|chick|poussin|fawn|\bfaon\b|\bkid\b|\bcub\b|piglet|marcassin|leveret|levraut|duckling|caneton|\bcalf\b|jungtier|küken|\bpup\b|kit\b|\blamb\b|agneau|\bimmature\b)/.test(t);
  if (j) return "jeune";
  if (f && !m) return "femelle";
  if (m && !f) return "male";
  return "";
}

const ressemblent = (e) => /se ressemblent|identiques/.test(e.sexes);

async function telechargerTout(dossier, garde, debut) {
  let n = debut;
  for (const ph of garde) {
    n++;
    ph.n = n;
    const cible = join(dossier, `${String(n).padStart(2, "0")}.jpg`);
    if (await existe(cible)) continue;
    try {
      await writeFile(cible, await requete(ph.vignette, true));
    } catch (err) {
      ph.echec = err.message;
    }
    await pause(900);
  }
}

if (AJOUT) {
  const dossier = join(DOSSIER, AJOUT.id);
  const meta = JSON.parse(await readFile(join(dossier, "meta.json"), "utf8"));
  const connus = new Set(meta.map((ph) => ph.fichier));
  const titres = await chercher(AJOUT.q, AJOUT.n * 2);
  const nouvelles = (await infos(titres)).filter(convient).filter((ph) => !connus.has(ph.fichier)).slice(0, AJOUT.n).map((ph) => ({ ...ph, role: role(ph) }));
  await telechargerTout(dossier, nouvelles, Math.max(0, ...meta.map((ph) => ph.n)));
  await writeFile(join(dossier, "meta.json"), JSON.stringify([...meta, ...nouvelles], null, 2));
  console.log(`${AJOUT.id} : ${nouvelles.length} candidates ajoutées`);
  process.exit(0);
}

for (const e of ESPECES) {
  if (SEULEMENT.length && !SEULEMENT.includes(e.id)) continue;
  const dossier = join(DOSSIER, e.id);
  if (!SEULEMENT.length && (await existe(join(dossier, "meta.json")))) continue;
  await mkdir(dossier, { recursive: true });

  const noms = e.latinPhotos || [e.latin];
  const requetes = [];
  if (TRACES) {
    for (const l of noms) requetes.push([`"${l}" track`, 10], [`"${l}" footprint`, 10], [`"${l}" Trittsiegel`, 6], [`"${l}" Spur`, 6], [`"${l}" empreinte`, 6]);
  } else {
    for (const l of noms) requetes.push([`"${l}" incategory:"Quality images"`, 25]);
    if (!ressemblent(e)) {
      requetes.push([`"${noms[0]}" male`, 8], [`"${noms[0]}" female`, 8]);
    }
    requetes.push([`"${noms[0]}" juvenile`, 5]);
    for (const l of noms) requetes.push([`"${l}"`, 20]);
  }

  const titres = [];
  try {
    for (const [q, n] of requetes) {
      for (const t of await chercher(q, n)) if (!titres.includes(t)) titres.push(t);
      await pause(200);
    }
  } catch (err) {
    console.warn("recherche impossible", e.id, err.message);
    continue;
  }
  const liste = (await infos(titres)).filter(convient);
  // Garde l'ordre des requêtes (qualité d'abord), puis équilibre : au plus PAR_ESPECE.
  liste.sort((a, b) => titres.indexOf("File:" + a.fichier.replace(/_/g, " ")) - titres.indexOf("File:" + b.fichier.replace(/_/g, " ")));
  const garde = liste.slice(0, PAR_ESPECE).map((ph) => ({ ...ph, role: role(ph) }));

  await telechargerTout(dossier, garde, 0);
  await writeFile(join(dossier, "meta.json"), JSON.stringify(garde, null, 2));
  console.log(`${e.id} : ${garde.length} candidates`);
}
