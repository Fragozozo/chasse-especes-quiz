// Dessins schématiques des empreintes (pas à l'échelle), en SVG. Couleur : currentColor.
// Chaque entrée : nom du type d'empreinte, taille indicative et dessin.

const svg = (contenu, vb = "0 0 200 200") =>
  `<svg viewBox="${vb}" class="trace-svg" role="img" aria-hidden="true">${contenu}</svg>`;

// Une pince d'ongulé (moitié droite), symétrisée pour la gauche.
const pinces = (d, extra = "") => `<g fill="currentColor">
  <path d="${d}"/><path d="${d}" transform="translate(200 0) scale(-1 1)"/>${extra}</g>`;

// Doigt ovale, tourné de « a » degrés.
const doigt = (x, y, rx, ry, a = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`;
const griffe = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`;

export const TRACES = {
  sanglier: {
    nom: "Pinces arrondies et gardes écartées",
    taille: "5 à 8 cm",
    dessin: svg(pinces(
      "M104 30 C130 34 146 70 146 104 C146 126 132 138 116 138 C108 138 104 130 104 120 Z",
      `<ellipse cx="58" cy="168" rx="13" ry="16"/><ellipse cx="142" cy="168" rx="13" ry="16"/>`)),
  },
  cerf: {
    nom: "Larges pinces arrondies",
    taille: "7 à 9 cm (cerf élaphe)",
    dessin: svg(pinces("M104 22 C138 28 156 80 154 128 C153 160 136 176 118 176 C108 176 104 166 104 152 Z")),
  },
  chevreuil: {
    nom: "Pinces étroites et pointues",
    taille: "4 à 6 cm",
    dessin: svg(pinces("M104 20 C122 40 134 90 134 130 C134 160 124 178 112 178 C106 178 104 168 104 156 Z")),
  },
  chamois: {
    nom: "Pinces écartées aux bords tranchants",
    taille: "5 à 6 cm",
    dessin: svg(`<g fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round">
      <path d="M108 26 C140 36 154 96 150 140 C148 166 134 176 120 172 C112 150 110 90 108 26 Z"/>
      <path d="M92 26 C60 36 46 96 50 140 C52 166 66 176 80 172 C88 150 90 90 92 26 Z"/></g>`),
  },
  renard: {
    nom: "Quatre doigts, empreinte ovale et allongée",
    taille: "5 cm (renard) à 12 cm (loup)",
    dessin: svg(`<g fill="currentColor">
      ${doigt(82, 62, 13, 19, -6)}${doigt(118, 62, 13, 19, 6)}${doigt(52, 104, 12, 17, -24)}${doigt(148, 104, 12, 17, 24)}
      <path d="M100 118 C122 118 136 140 132 160 C128 176 112 172 100 168 C88 172 72 176 68 160 C64 140 78 118 100 118 Z"/>
      ${griffe(80, 40, 78, 26)}${griffe(120, 40, 122, 26)}${griffe(46, 84, 38, 72)}${griffe(154, 84, 162, 72)}</g>
      <path d="M60 88 L140 150 M140 88 L60 150" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5" opacity=".55"/>`),
  },
  felin: {
    nom: "Quatre doigts ronds, sans griffes",
    taille: "3 cm (genette) à 9 cm (lynx)",
    dessin: svg(`<g fill="currentColor">
      ${doigt(80, 56, 15, 17)}${doigt(120, 56, 15, 17)}${doigt(48, 90, 14, 16)}${doigt(152, 90, 14, 16)}
      <path d="M100 104 C126 104 150 122 150 148 C150 168 136 176 124 170 C116 166 108 172 100 172 C92 172 84 166 76 170 C64 176 50 168 50 148 C50 122 74 104 100 104 Z"/></g>`),
  },
  mustelide: {
    nom: "Cinq petits doigts en arc",
    taille: "1 cm (belette) à 4,5 cm (fouine)",
    dessin: svg(`<g fill="currentColor">
      ${doigt(100, 46, 10, 14)}${doigt(70, 54, 10, 14, -14)}${doigt(130, 54, 10, 14, 14)}${doigt(46, 78, 9, 13, -30)}${doigt(154, 78, 9, 13, 30)}
      <path d="M100 90 C130 90 150 108 148 132 C146 152 128 156 112 150 C106 160 94 160 88 150 C72 156 54 152 52 132 C50 108 70 90 100 90 Z"/>
      ${griffe(100, 30, 100, 22)}${griffe(68, 38, 64, 30)}${griffe(132, 38, 136, 30)}</g>`),
  },
  blaireau: {
    nom: "Cinq doigts alignés et longues griffes",
    taille: "5 à 6 cm de large",
    dessin: svg(`<g fill="currentColor">
      ${doigt(44, 86, 12, 15, -10)}${doigt(72, 76, 12, 15, -4)}${doigt(100, 72, 12, 15)}${doigt(128, 76, 12, 15, 4)}${doigt(156, 86, 12, 15, 10)}
      <path d="M36 118 C60 102 140 102 164 118 C176 128 166 162 140 166 C116 170 84 170 60 166 C34 162 24 128 36 118 Z"/>
      ${griffe(40, 68, 34, 32)}${griffe(70, 58, 66, 22)}${griffe(100, 54, 100, 18)}${griffe(130, 58, 134, 22)}${griffe(160, 68, 166, 32)}</g>`),
  },
  raton: {
    nom: "Cinq longs doigts, comme une petite main",
    taille: "6 à 7 cm",
    dessin: svg(`<g fill="currentColor">
      <path d="M100 110 L100 34" stroke="currentColor" stroke-width="16" stroke-linecap="round"/>
      <path d="M86 112 L62 42" stroke="currentColor" stroke-width="15" stroke-linecap="round"/>
      <path d="M114 112 L138 42" stroke="currentColor" stroke-width="15" stroke-linecap="round"/>
      <path d="M78 122 L32 80" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
      <path d="M122 122 L168 80" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
      <path d="M100 104 C132 104 150 126 146 150 C142 172 120 178 100 172 C80 178 58 172 54 150 C50 126 68 104 100 104 Z"/></g>`),
  },
  ours: {
    nom: "Cinq doigts et large plante du pied",
    taille: "25 à 30 cm (patte arrière)",
    dessin: svg(`<g fill="currentColor">
      ${doigt(40, 52, 12, 14, -14)}${doigt(70, 38, 13, 15, -6)}${doigt(102, 34, 14, 16)}${doigt(134, 38, 13, 15, 6)}${doigt(162, 52, 12, 14, 14)}
      <path d="M34 78 C70 64 132 64 168 78 C178 112 162 150 148 176 C132 196 70 196 56 176 C42 150 24 112 34 78 Z"/></g>`, "0 0 200 200"),
  },
  loutre: {
    nom: "Cinq doigts ronds reliés par une palmure",
    taille: "6 à 7 cm",
    dessin: svg(`<path d="M44 78 C60 44 140 44 156 78 L140 120 L60 120 Z" fill="currentColor" opacity=".35"/>
      <g fill="currentColor">${doigt(100, 46, 12, 13)}${doigt(68, 54, 12, 13)}${doigt(132, 54, 12, 13)}${doigt(44, 78, 11, 12)}${doigt(156, 78, 11, 12)}
      <path d="M100 100 C130 100 146 120 142 144 C138 164 116 164 100 158 C84 164 62 164 58 144 C54 120 70 100 100 100 Z"/></g>`),
  },
  ragondin: {
    nom: "Patte arrière allongée et palmée",
    taille: "12 à 15 cm (ragondin, castor)",
    dessin: svg(`<path d="M60 70 L100 30 L132 40 L150 70 L130 120 L80 120 Z" fill="currentColor" opacity=".35"/>
      <g fill="currentColor">
      <path d="M100 120 L100 30" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
      <path d="M92 122 L62 46" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>
      <path d="M108 122 L132 40" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>
      <path d="M116 126 L154 72" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
      <path d="M84 130 L40 100" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
      <path d="M80 118 C104 112 124 120 124 140 C124 172 112 190 100 190 C88 190 76 172 76 140 Z"/></g>`),
  },
  rongeur: {
    nom: "Doigts fins : quatre à l'avant, cinq à l'arrière",
    taille: "2 à 7 cm",
    dessin: svg(`<g fill="currentColor">
      <path d="M62 120 L62 74 M50 124 L30 86 M74 124 L94 86 M52 132 L28 120" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="62" cy="140" rx="20" ry="16"/>
      <path d="M140 110 L140 40 M128 112 L110 54 M152 112 L170 54 M124 124 L96 100 M156 124 L184 100" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M124 118 C140 112 156 118 156 132 C156 170 148 186 140 186 C132 186 124 170 124 132 Z"/></g>`),
  },
  lapin: {
    nom: "Piste en bonds : pattes arrière devant, pattes avant l'une derrière l'autre",
    taille: "6 à 9 cm (lapin), 10 à 15 cm (lièvre) pour la patte arrière",
    dessin: svg(`<g fill="currentColor">
      <ellipse cx="78" cy="56" rx="15" ry="36"/><ellipse cx="122" cy="56" rx="15" ry="36"/>
      <ellipse cx="100" cy="126" rx="11" ry="15"/><ellipse cx="96" cy="170" rx="11" ry="15"/></g>
      <path d="M176 150 L176 30 M166 44 L176 28 L186 44" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  },
  galliforme: {
    nom: "Trois gros doigts en avant, petit pouce en arrière",
    taille: "2,5 cm (caille) à 9 cm (grand tétras)",
    dessin: svg(`<g stroke="currentColor" stroke-width="15" stroke-linecap="round" fill="none">
      <path d="M100 130 L100 30"/><path d="M100 130 L40 64"/><path d="M100 130 L160 64"/><path d="M100 130 L100 168"/></g>`),
  },
  palme: {
    nom: "Trois doigts avant reliés par une palmure",
    taille: "4 cm (sarcelle) à 12 cm (oie)",
    dessin: svg(`<path d="M100 150 L30 56 C60 40 80 70 100 30 C120 70 140 40 170 56 Z" fill="currentColor" opacity=".4"/>
      <g stroke="currentColor" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M100 150 L100 30"/><path d="M100 150 L30 56"/><path d="M100 150 L170 56"/></g>`),
  },
  lobe: {
    nom: "Doigts bordés de lobes",
    taille: "7 à 8 cm (foulque)",
    dessin: svg(`<g fill="currentColor">
      ${doigt(100, 50, 14, 16)}${doigt(100, 88, 14, 16)}${doigt(62, 70, 13, 15, -40)}${doigt(42, 46, 12, 14, -40)}
      ${doigt(138, 70, 13, 15, 40)}${doigt(158, 46, 12, 14, 40)}${doigt(100, 160, 8, 12)}</g>
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M100 128 L100 30"/><path d="M100 128 L36 38"/><path d="M100 128 L164 38"/><path d="M100 128 L100 168"/></g>`),
  },
  echassier: {
    nom: "Trois doigts longs et fins, pouce réduit ou absent",
    taille: "3 cm (bécassine) à 15 cm (héron)",
    dessin: svg(`<g stroke="currentColor" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M100 150 L100 20"/><path d="M100 150 L30 52"/><path d="M100 150 L170 52"/><path d="M100 150 L104 170"/></g>`),
  },
  passereau: {
    nom: "Trois doigts fins en avant, long pouce en arrière",
    taille: "3 cm (alouette) à 10 cm (grand corbeau)",
    dessin: svg(`<g stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none">
      <path d="M100 110 L100 24"/><path d="M100 110 L52 40"/><path d="M100 110 L148 40"/><path d="M100 110 L100 186"/></g>`),
  },
  pigeon: {
    nom: "Trois doigts en avant légèrement tournés vers l'intérieur, pouce court",
    taille: "4 à 6 cm",
    dessin: svg(`<g stroke="currentColor" stroke-width="11" stroke-linecap="round" fill="none">
      <path d="M100 120 C100 90 96 60 90 30"/><path d="M100 120 C80 100 60 80 44 58"/><path d="M100 120 C120 100 140 84 158 74"/><path d="M100 120 L104 168"/></g>`),
  },
  rapace: {
    nom: "Quatre doigts puissants à longues serres",
    taille: "5 à 10 cm",
    dessin: svg(`<g stroke="currentColor" stroke-width="11" stroke-linecap="round" fill="none">
      <path d="M100 110 L100 44"/><path d="M100 110 L50 58"/><path d="M100 110 L150 58"/><path d="M100 110 L100 164"/></g>
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M100 44 C100 30 92 22 84 22"/><path d="M50 58 C42 46 32 44 26 48"/><path d="M150 58 C158 46 168 44 174 48"/><path d="M100 164 C100 180 108 186 116 186"/></g>`),
  },
};
