// Dessine les illustrations des questions de situation (questions/situations.md) dans questions/images/.
// Scènes simples en SVG : vue de côté (paysage) ou vue de dessus (plan de battue).
// Usage : node tools/dessiner-situations.mjs
import { writeFile, mkdir } from "node:fs/promises";

const DOSSIER = new URL("../questions/images/", import.meta.url);
const W = 400, H = 250;
const C = {
  ciel: "#cfe4f2", herbe: "#9cc27a", herbeSombre: "#7aa55a", terre: "#b08a5a", eau: "#6fa8d6",
  route: "#8a8a8a", ligne: "#f2f2f2", fluo: "#ff7a1a", chasseur: "#4a5a3a", peau: "#e7b98f",
  sanglier: "#3b2e25", chevreuil: "#b5652b", canard: "#5b6b4a", maison: "#e9dcc4", toit: "#a5452f",
  arbre: "#3f6e35", tronc: "#6b4a2b", promeneur: "#2f6db5", danger: "#d22", ok: "#2e8b3a",
};

const svg = (contenu, fond = "paysage") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="800" height="500">
${fond === "paysage" ? `<rect width="${W}" height="${H}" fill="${C.ciel}"/>` : `<rect width="${W}" height="${H}" fill="${C.herbe}"/>`}
${contenu}
</svg>\n`;

// ---------- Éléments de décor (vue de côté) ----------
const sol = (y = 190, couleur = C.herbe) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${couleur}"/>`;
const arbre = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-4" y="-30" width="8" height="30" fill="${C.tronc}"/><circle cx="0" cy="-44" r="22" fill="${C.arbre}"/></g>`;
const buisson = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${C.arbre}">
  <circle cx="-18" cy="-10" r="16"/><circle cx="2" cy="-18" r="20"/><circle cx="22" cy="-9" r="15"/><rect x="-32" y="-12" width="66" height="12"/></g>`;
const maison = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-25" y="-36" width="50" height="36" fill="${C.maison}" stroke="#8a7a60"/>
  <path d="M-31 -36 L0 -60 L31 -36 Z" fill="${C.toit}"/><rect x="-6" y="-20" width="12" height="20" fill="#7a5a3a"/>
  <rect x="-20" y="-28" width="9" height="9" fill="#9cc5e0"/><rect x="11" y="-28" width="9" height="9" fill="#9cc5e0"/></g>`;
const voiture = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-26 -8 L-26 -18 L-14 -18 L-8 -28 L12 -28 L20 -18 L28 -18 L28 -8 Z" fill="#2c5aa0"/>
  <circle cx="-14" cy="-6" r="6" fill="#222"/><circle cx="16" cy="-6" r="6" fill="#222"/></g>`;
// Personnage debout. couleur du gilet : fluo pour un chasseur, bleu pour un promeneur.
const personne = (x, y, s = 1, { gilet = C.fluo, fusil = true, sens = 1 } = {}) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})">
  <rect x="-5" y="-22" width="4" height="22" fill="#3a3a3a"/><rect x="1" y="-22" width="4" height="22" fill="#3a3a3a"/>
  <rect x="-7" y="-46" width="14" height="26" rx="3" fill="${gilet}"/><circle cx="0" cy="-53" r="6" fill="${C.peau}"/>
  <path d="M-7 -59 h14 v-4 h-14 z" fill="${C.chasseur}"/>
  ${fusil ? `<path d="M2 -40 L26 -50" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>` : ""}</g>`;
const sanglier = (x, y, s = 1, sens = 1) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})" fill="${C.sanglier}">
  <path d="M-30 -10 C-32 -26 -18 -36 0 -36 C14 -36 22 -30 28 -22 L40 -14 L38 -8 L26 -8 C24 -4 20 -2 16 -2 L-24 -2 C-28 -4 -30 -6 -30 -10 Z"/>
  <rect x="-24" y="-4" width="5" height="10"/><rect x="-12" y="-4" width="5" height="10"/><rect x="8" y="-4" width="5" height="10"/><rect x="18" y="-4" width="5" height="10"/>
  <path d="M-30 -14 L-36 -8" stroke="${C.sanglier}" stroke-width="3"/><path d="M20 -30 L18 -38 L24 -32 Z"/></g>`;
const chevreuil = (x, y, s = 1, sens = 1) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})" fill="${C.chevreuil}">
  <path d="M-24 -28 C-24 -36 14 -38 18 -30 L22 -44 C24 -50 30 -52 34 -48 L38 -44 L34 -40 L28 -40 L24 -26 C22 -22 -20 -20 -24 -28 Z"/>
  <rect x="-22" y="-26" width="3.5" height="26"/><rect x="-14" y="-26" width="3.5" height="26"/><rect x="10" y="-26" width="3.5" height="26"/><rect x="17" y="-26" width="3.5" height="26"/>
  <path d="M28 -50 L26 -60 M28 -50 L32 -60" stroke="${C.chevreuil}" stroke-width="2" fill="none"/></g>`;
const canardVol = (x, y, s = 1, sens = 1) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})">
  <ellipse cx="0" cy="0" rx="16" ry="6" fill="${C.canard}"/><circle cx="16" cy="-3" r="5" fill="#2f6a3a"/><path d="M20 -3 L27 -2 L20 0 Z" fill="#e0a020"/>
  <path d="M-4 -2 L-14 -22 L6 -4 Z M-2 2 L-10 20 L8 3 Z" fill="#6b7a58"/></g>`;
const faisanVol = (x, y, s = 1, sens = 1) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})">
  <ellipse cx="0" cy="0" rx="14" ry="6" fill="#b06a2a"/><circle cx="14" cy="-3" r="5" fill="#2a5a4a"/><circle cx="15" cy="-4" r="2" fill="#d22"/>
  <path d="M-12 0 L-40 6 L-12 3 Z" fill="#8a5a2a"/><path d="M-2 -2 L-10 -20 L8 -4 Z M0 2 L-6 18 L9 3 Z" fill="#9a6a3a"/></g>`;
const chien = (x, y, s = 1, sens = 1) => `<g transform="translate(${x} ${y}) scale(${s * sens} ${s})" fill="#f2e6d0" stroke="#7a5a3a" stroke-width="1">
  <path d="M-16 -12 C-16 -18 10 -18 12 -14 L16 -22 L24 -20 L24 -14 L16 -10 C14 -6 -14 -6 -16 -12 Z"/>
  <rect x="-14" y="-8" width="3" height="8"/><rect x="-7" y="-8" width="3" height="8"/><rect x="5" y="-8" width="3" height="8"/><rect x="11" y="-8" width="3" height="8"/>
  <path d="M-16 -13 L-22 -20" fill="none"/></g>`;
// Trajectoire d'un tir : flèche en pointillés.
const tir = (x1, y1, x2, y2, couleur = C.danger) => `<g stroke="${couleur}" stroke-width="2.5" fill="none" stroke-dasharray="7 5">
  <path d="M${x1} ${y1} L${x2} ${y2}"/></g><circle cx="${x2}" cy="${y2}" r="4" fill="${couleur}"/>`;
const texte = (x, y, t, taille = 12, couleur = "#222") => `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${taille}" font-weight="700" fill="${couleur}" text-anchor="middle">${t}</text>`;

// ---------- Vue de dessus (plan) ----------
const poste = (x, y, nom) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.fluo}" stroke="#fff" stroke-width="2"/>${nom ? texte(x, y + 24, nom, 11) : ""}`;
// Zone interdite de 30° de part et d'autre de la direction d'un voisin, vue depuis (x, y).
function angle30(x, y, vx, vy) {
  const a = Math.atan2(vy - y, vx - x), r = 400, d = (30 * Math.PI) / 180;
  const p1 = [x + r * Math.cos(a - d), y + r * Math.sin(a - d)], p2 = [x + r * Math.cos(a + d), y + r * Math.sin(a + d)];
  return `<path d="M${x} ${y} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z" fill="${C.danger}" opacity=".22"/>`;
}
const sanglierDessus = (x, y, a = 0) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="${C.sanglier}">
  <ellipse cx="0" cy="0" rx="16" ry="8"/><path d="M14 -4 L24 0 L14 4 Z"/></g>`;
const perdrixDessus = (x, y, a = 0) => `<g transform="translate(${x} ${y}) rotate(${a})">
  <ellipse cx="0" cy="0" rx="7" ry="4" fill="#9a6a4a"/><path d="M-2 -3 L-6 -14 L4 -3 Z M-2 3 L-6 14 L4 3 Z" fill="#b08060"/></g>`;
const fleche = (x1, y1, x2, y2, couleur = "#222") => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 9;
  const p = (da) => `${(x2 - t * Math.cos(a + da)).toFixed(1)} ${(y2 - t * Math.sin(a + da)).toFixed(1)}`;
  return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${couleur}" stroke-width="2" stroke-dasharray="5 4"/><path d="M${x2} ${y2} L${p(0.45)} L${p(-0.45)} Z" fill="${couleur}"/>`;
};

const SCENES = {
  // Sanglier sur une ligne de crête, ciel derrière : pas de butte de tir.
  "sanglier-crete": svg(`
    <path d="M0 250 L0 170 C60 160 120 120 200 100 C260 88 320 120 400 150 L400 250 Z" fill="${C.herbe}"/>
    ${sanglier(205, 100, 1)}
    ${personne(60, 205, 1.1)}
    ${tir(88, 152, 340, 40)}
    ${texte(350, 30, "?", 22, C.danger)}`),
  // Chevreuil en contrebas, tir depuis un mirador vers le sol.
  "chevreuil-mirador": svg(`
    ${sol(150)}${arbre(360, 152, 1)}${arbre(330, 152, 0.8)}
    <g stroke="#6b4a2b" stroke-width="4"><path d="M40 210 L60 100 M100 210 L80 100 M45 180 L95 180 M50 140 L90 140"/></g>
    <rect x="52" y="86" width="40" height="16" fill="#8a6a40"/>
    ${personne(72, 88, 0.8)}
    ${chevreuil(230, 205, 0.9)}
    ${tir(92, 60, 228, 186, C.ok)}`),
  // Canard au-dessus d'un étang, maison sur l'autre rive.
  "canard-etang-maison": svg(`
    ${sol(160)}<ellipse cx="210" cy="200" rx="170" ry="28" fill="${C.eau}"/>
    ${maison(330, 162, 1)}${arbre(280, 162, 0.8)}
    ${canardVol(250, 135, 1.1, -1)}
    ${personne(40, 225, 1.1)}`),
  // Faisan qui file vers une haie, un promeneur derrière.
  "faisan-haie-promeneur": svg(`
    ${sol(170)}${buisson(300, 172, 1.4)}
    ${personne(352, 172, 1, { gilet: C.promeneur, fusil: false })}
    ${faisanVol(230, 140, 1, 1)}
    ${personne(50, 225, 1.1)}`),
  // Forme sombre dans un roncier, animal non identifié.
  "forme-roncier": svg(`
    ${sol(165)}${arbre(70, 168, 1.1)}${arbre(340, 168, 1)}
    ${buisson(210, 190, 2.1)}
    <ellipse cx="205" cy="168" rx="20" ry="11" fill="#4a3a30" opacity=".75"/>
    ${texte(205, 120, "?", 26, C.danger)}`),
  // Sanglier au bord d'une route, une voiture passe.
  "sanglier-route": svg(`
    ${sol(150)}<rect x="0" y="182" width="${W}" height="30" fill="${C.route}"/>
    <path d="M0 197 H400" stroke="${C.ligne}" stroke-width="2" stroke-dasharray="16 12"/>
    ${voiture(320, 205, 1.1)}
    ${sanglier(170, 176, 0.9, 1)}
    ${personne(40, 245, 1)}`),
  // Lièvre en plaine dégagée, rien derrière.
  "lievre-plaine": svg(`
    ${sol(140)}<path d="M0 140 H400" stroke="${C.herbeSombre}" stroke-width="3"/>
    <g transform="translate(250 200)" fill="#9a7550"><ellipse cx="0" cy="-8" rx="16" ry="9"/><circle cx="15" cy="-14" r="6"/>
      <path d="M14 -18 L10 -34 L16 -20 Z M18 -18 L20 -34 L21 -19 Z"/><path d="M-12 -2 L-20 4" stroke="#9a7550" stroke-width="4"/></g>
    ${personne(60, 230, 1.1)}
    ${tir(90, 182, 246, 192, C.ok)}`),
  // Chien qui tient un sanglier au ferme.
  "chien-ferme": svg(`
    ${sol(160)}${buisson(330, 165, 1.2)}${arbre(60, 162, 0.9)}
    ${sanglier(210, 205, 1, -1)}
    ${chien(150, 210, 1.2, 1)}${chien(265, 214, 1.1, -1)}
    ${personne(60, 245, 1)}`),
  // Battue (vue de dessus) : sanglier dans l'angle de 30° du voisin.
  "battue-angle": svg(`
    <rect x="0" y="0" width="${W}" height="110" fill="${C.arbre}"/>
    ${angle30(200, 150, 70, 150)}${angle30(200, 150, 330, 150)}
    <path d="M0 150 H400" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 6"/>
    ${poste(70, 150, "voisin")}${poste(200, 150, "vous")}${poste(330, 150, "voisin")}
    ${sanglierDessus(110, 160, 90)}${fleche(110, 105, 110, 200)}
    ${texte(200, 30, "Traque", 13, "#fff")}`, "plan"),
  // Battue (vue de dessus) : sanglier passé derrière la ligne, hors des angles.
  "battue-derriere": svg(`
    <rect x="0" y="0" width="${W}" height="110" fill="${C.arbre}"/>
    ${angle30(200, 150, 70, 150)}${angle30(200, 150, 330, 150)}
    <path d="M0 150 H400" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 6"/>
    ${poste(70, 150, "voisin")}${poste(200, 150, "vous")}${poste(330, 150, "voisin")}
    ${sanglierDessus(200, 222, 90)}${fleche(200, 120, 200, 245)}
    ${texte(200, 30, "Traque", 13, "#fff")}`, "plan"),
  // Chasse en ligne (vue de dessus) : perdrix qui repart en arrière entre deux chasseurs.
  "ligne-perdrix-arriere": svg(`
    ${[60, 140, 220, 300].map((x, i) => poste(x, 130, i === 1 ? "vous" : "")).join("")}
    ${[60, 140, 220, 300].map((x) => fleche(x, 115, x, 70, "#fff")).join("")}
    ${perdrixDessus(180, 170, 90)}${fleche(180, 100, 180, 215, C.danger)}
    ${texte(200, 30, "Sens de marche", 13, "#fff")}`, "plan"),
  // Chevreuil à la lisière, derrière lui une maison.
  "chevreuil-maison": svg(`
    ${sol(165)}${maison(330, 168, 1.1)}${arbre(260, 168, 0.9)}
    ${chevreuil(200, 210, 0.9, -1)}
    ${personne(50, 240, 1.1)}`),
};

await mkdir(DOSSIER, { recursive: true });
for (const [nom, contenu] of Object.entries(SCENES)) await writeFile(new URL(`${nom}.svg`, DOSSIER), contenu);
console.log(Object.keys(SCENES).length, "illustrations dans questions/images/");
