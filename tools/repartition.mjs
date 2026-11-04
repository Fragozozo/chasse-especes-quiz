// Prépare la carte de présence des espèces en France métropolitaine.
//   js/france.js      : contours simplifiés des départements (IGN Admin Express via france-geojson, Licence ouverte)
//   js/repartition.js : nombre d'observations depuis 2000 par espèce et par département (GBIF)
// Usage : node tools/repartition.mjs   (quelques minutes ; relançable)
import { writeFile } from "node:fs/promises";
import { ESPECES } from "../js/especes.js";

const UA = { "User-Agent": "chasse-especes-quiz/1.0 (https://github.com/Fragozozo/chasse-especes-quiz)" };
const GEOJSON = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";
const DEPUIS = 2000;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const json = async (url) => {
  for (let essai = 0; essai < 5; essai++) {
    const r = await fetch(url, { headers: UA }).catch(() => null);
    if (r?.ok) return r.json();
    await pause(2000 * 2 ** essai);
  }
  throw new Error("échec " + url);
};
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

// ---------- Carte des départements ----------
const geo = await json(GEOJSON);
const LON0 = 2.5, LAT0 = 46.5, K = Math.cos((LAT0 * Math.PI) / 180);
const brut = (lon, lat) => [(lon - LON0) * K, -(lat - LAT0)];
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const f of geo.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const anneau of p) for (const [lon, lat] of anneau) {
    const [x, y] = brut(lon, lat);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
}
const L = 500, ech = L / (maxX - minX), H = Math.round((maxY - minY) * ech);
const pt = (lon, lat) => { const [x, y] = brut(lon, lat); return [((x - minX) * ech).toFixed(1), ((y - minY) * ech).toFixed(1)]; };
const departements = {};
for (const f of geo.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const d = polys.map((p) => p.map((anneau) => "M" + anneau.map(([lon, lat]) => pt(lon, lat).join(" ")).join("L") + "Z").join("")).join("");
  departements[f.properties.code] = { nom: f.properties.nom, d };
}
await writeFile(new URL("../js/france.js", import.meta.url),
  `// Contours simplifiés des départements de France métropolitaine (IGN Admin Express, Licence ouverte, via france-geojson).\n// Généré par tools/repartition.mjs : ne pas modifier à la main.\nexport const FRANCE = ${JSON.stringify({ largeur: L, hauteur: H, departements })};\n`);
console.log(Object.keys(departements).length, "départements");

// ---------- Correspondance GADM (GBIF) → code de département ----------
const parNom = Object.fromEntries(Object.entries(departements).map(([c, d]) => [norm(d.nom), c]));
const gadm = {};
for (const reg of await json("https://api.gbif.org/v1/geocode/gadm/FRA/subdivisions")) {
  for (const dep of await json(`https://api.gbif.org/v1/geocode/gadm/${reg.id}/subdivisions`)) {
    const code = parNom[norm(dep.name)];
    if (code) gadm[dep.id] = code;
    else console.warn("département inconnu", dep.name);
  }
}

// ---------- Observations par espèce ----------
const repartition = {};
for (const e of ESPECES) {
  const noms = e.latinPhotos || [e.latin];
  const counts = {};
  for (const nom of noms) {
    const m = await json(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(nom)}`);
    if (!m.usageKey || m.matchType === "NONE") continue;
    const d = await json(`https://api.gbif.org/v1/occurrence/search?taxonKey=${m.usageKey}&country=FR&year=${DEPUIS},2100` +
      `&occurrenceStatus=PRESENT&basisOfRecord=HUMAN_OBSERVATION&basisOfRecord=MACHINE_OBSERVATION&limit=0&facet=gadmLevel2Gid&facetLimit=200`);
    for (const c of d.facets?.[0]?.counts || []) {
      const code = gadm[c.name];
      if (code) counts[code] = (counts[code] || 0) + c.count;
    }
    if (Object.keys(counts).length) break;
  }
  repartition[e.id] = counts;
  console.log(`${e.id} : ${Object.keys(counts).length} départements`);
  await pause(300);
}
await writeFile(new URL("../js/repartition.js", import.meta.url),
  `// Observations de chaque espèce depuis ${DEPUIS}, par département (GBIF, observations humaines et automatiques).\n// Généré par tools/repartition.mjs le ${new Date().toISOString().slice(0, 10)} : ne pas modifier à la main.\nexport const REPARTITION = ${JSON.stringify(repartition)};\n`);
