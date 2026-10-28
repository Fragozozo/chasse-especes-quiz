// Questions de l'épreuve théorique, lues dans les fichiers Markdown du dossier questions/.
// Format : voir questions/LISEZMOI.md. Les fichiers sont trouvés automatiquement :
//   1. liste du dossier questions/ via l'API GitHub (fichiers ajoutés directement dans le repo) ;
//   2. à défaut (hors ligne, limite de l'API), la dernière liste connue, puis les 4 fichiers de base.

export const THEMES_BASE = {
  faune: "Faune et habitats",
  chasse: "Chasse",
  reglementation: "Lois et réglementation",
  armes: "Armes et sécurité",
};
const DEPOT = "Fragozozo/chasse-especes-quiz";
const CLE_LISTE = "questions-fichiers-v1";
const IGNORES = /^(lisezmoi|readme)\.md$/i;

const sansAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Analyse un fichier. Renvoie { theme, nom, questions, erreurs }.
export function analyser(texte, fichier) {
  const base = fichier.replace(/\.md$/i, "");
  let theme = THEMES_BASE[base] ? base : "";
  let nom = THEMES_BASE[base] || "";
  const questions = [];
  const erreurs = [];
  let q = null;
  const finir = () => {
    if (!q) return;
    const bonnes = q.choix.filter((c) => c.ok);
    if (q.choix.length !== 4 || bonnes.length !== 1) {
      erreurs.push(`${fichier}, « ${q.q} » : il faut 4 réponses dont une seule cochée [x] (trouvé ${q.choix.length} réponses, ${bonnes.length} cochée).`);
    } else {
      questions.push({ q: q.q, r: [bonnes[0].texte, ...q.choix.filter((c) => !c.ok).map((c) => c.texte)], ex: q.ex.join(" "), e: q.e });
    }
    q = null;
  };
  for (const ligne of texte.split(/\r?\n/)) {
    const l = ligne.trim();
    let m;
    if ((m = l.match(/^#\s+(.+)$/)) && !nom) nom = m[1].trim();
    else if ((m = l.match(/^th[eè]me\s*:\s*(.+)$/i))) {
      const v = sansAccents(m[1].trim());
      const connu = Object.entries(THEMES_BASE).find(([k, n]) => k === v || sansAccents(n) === v);
      if (connu) [theme, nom] = connu;
      else { theme = v.replace(/[^a-z0-9]+/g, "-"); nom = m[1].trim(); }
    } else if ((m = l.match(/^##\s+(.+)$/))) {
      finir();
      let titre = m[1].trim();
      const e = /\[\s*[ée]liminatoire\s*\]\s*$/i.test(titre);
      titre = titre.replace(/\[\s*[ée]liminatoire\s*\]\s*$/i, "").trim();
      q = { q: titre, choix: [], ex: [], e };
    } else if (q && (m = l.match(/^[-*]\s*\[( |x|X)\]\s*(.+)$/))) {
      q.choix.push({ ok: m[1] !== " ", texte: m[2].trim() });
    } else if (q && (m = l.match(/^>\s?(.*)$/))) {
      if (m[1].trim()) q.ex.push(m[1].trim());
    }
  }
  finir();
  if (!theme) theme = sansAccents(base).replace(/[^a-z0-9]+/g, "-");
  if (!nom) nom = base;
  return { theme, nom, questions, erreurs };
}

async function listeFichiers() {
  try {
    const r = await fetch(`https://api.github.com/repos/${DEPOT}/contents/questions`, { cache: "no-cache" });
    if (r.ok) {
      const liste = (await r.json()).map((f) => f.name).filter((n) => /\.md$/i.test(n) && !IGNORES.test(n));
      try { localStorage.setItem(CLE_LISTE, JSON.stringify(liste)); } catch {}
      return liste;
    }
  } catch {}
  try {
    const l = JSON.parse(localStorage.getItem(CLE_LISTE));
    if (Array.isArray(l) && l.length) return l;
  } catch {}
  return Object.keys(THEMES_BASE).map((k) => `${k}.md`);
}

// Charge toutes les questions. Chaque question reçoit son thème (t) et une clé stable (id) pour les statistiques.
export async function chargerQuestions() {
  const fichiers = await listeFichiers();
  const themes = {};
  const questions = [];
  const erreurs = [];
  await Promise.all(fichiers.map(async (f) => {
    try {
      const r = await fetch(`questions/${encodeURIComponent(f)}`, { cache: "no-cache" });
      if (!r.ok) return;
      const a = analyser(await r.text(), f);
      themes[a.theme] ||= a.nom;
      erreurs.push(...a.erreurs);
      for (const q of a.questions) questions.push({ ...q, t: a.theme, id: `${a.theme}:${q.q}` });
    } catch {}
  }));
  // Les thèmes de base d'abord, dans leur ordre, puis les thèmes ajoutés.
  const ordre = [...Object.keys(THEMES_BASE), ...Object.keys(themes).filter((k) => !THEMES_BASE[k]).sort()];
  const themesTries = Object.fromEntries(ordre.filter((k) => themes[k]).map((k) => [k, themes[k]]));
  if (erreurs.length) console.warn("Questions ignorées :\n" + erreurs.join("\n"));
  return { themes: themesTries, questions, erreurs };
}
