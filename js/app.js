import { GROUPES, STATUTS, GROUPES_ESOD, ESPECES } from "./especes.js?v=10";
import { chargerQuestions } from "./questions.js?v=10";
import { TRACES } from "./traces.js?v=10";

// ---------- Utilitaires ----------
const $ = (sel, el = document) => el.querySelector(sel);
const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const melanger = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const tirer = (a, n) => melanger(a).slice(0, n);
const parId = Object.fromEntries(ESPECES.map((e) => [e.id, e]));
const ORDRE_FICHES = Object.keys(GROUPES).flatMap((g) => ESPECES.filter((e) => e.groupe === g).map((e) => e.id));
const estOiseau = (e) => GROUPES[e.groupe].classe === "oiseau";

const ROLES = { male: "Mâle", femelle: "Femelle", jeune: "Jeune" };
// Nom propre au mâle, à la femelle ou au jeune (« Brocard »), ou rien s'il n'y a pas de mot particulier.
const nomPropre = (e, role) => {
  const n = e.noms?.[role] || "";
  if (!n || /^(Mâle|Femelle|Jeune)\b/.test(n) || /\((mâle|femelle)\)/.test(n)) return "";
  return n;
};
const motCle = (s) => s.split(/[ (]/)[0].toLowerCase();
const libelleRole = (e, role) => {
  const n = nomPropre(e, role);
  return n ? `${ROLES[role]} : ${n.split(" (")[0]}` : ROLES[role];
};

// Thèmes d'entraînement : groupes d'espèces, plus ESOD et espèces protégées.
const THEMES = {
  tous: { nom: "Toutes", filtre: () => true },
  ...Object.fromEntries(Object.entries(GROUPES).map(([k, g]) => [k, { nom: g.nom, filtre: (e) => e.groupe === k }])),
  esod: { nom: "ESOD", filtre: (e) => e.statut === "esod" },
  protegee: { nom: "Protégées", filtre: (e) => e.statut === "protegee" },
};

// ---------- Stockage local ----------
const STATS = "stats-v1";
const statsVides = () => ({ especes: {}, savoirs: {}, sessions: [] });
function lireStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS));
    if (s && s.especes) return s;
  } catch {}
  return statsVides();
}
let stats = lireStats();
function sauverStats() {
  try { localStorage.setItem(STATS, JSON.stringify(stats)); } catch {}
}
function noter(type, cle, ok) {
  const t = (stats[type][cle] ||= { ok: 0, total: 0, dernier: false });
  t.total++;
  if (ok) t.ok++;
  t.dernier = ok;
  sauverStats();
}
const maitrisee = (id) => {
  const s = stats.especes[id];
  return s && s.dernier && s.ok >= 2;
};

// ---------- Photos (photos/credits.json et photos/traces.json, fichiers embarqués) ----------
// Les photos d'empreintes sont dans photos/traces/ ; sans photo, on montre le schéma de traces.js.
let photos = {};
let photosTraces = {};
async function chargerCredits(fichier, dossier) {
  try {
    const r = await fetch(`${fichier}?v=10`);
    if (!r.ok) return {};
    const d = await r.json();
    for (const liste of Object.values(d)) for (const p of liste) p.src = dossier + p.fichierLocal;
    return d;
  } catch {
    return {};
  }
}
const chargerPhotos = () => chargerCredits("photos/credits.json", "photos/");
const chargerTraces = () => chargerCredits("photos/traces.json", "photos/traces/");
const toutesPhotos = (id) => photos[id] || [];
const aPhoto = (e) => toutesPhotos(e.id).length > 0;
const tirerPhoto = (id, role) => tirer(toutesPhotos(id).filter((p) => !role || p.role === role), 1)[0] || null;

// ---------- État ----------
const etat = { vue: "accueil", segment: "theorie", theme: "tous", themeQ: "tous", quiz: null, fiche: null, filtreFiches: "tous", groupeFiches: null, recherche: "" };

// ---------- Génération des questions ----------
function qPhotoEspece(e) {
  const memeGroupe = ESPECES.filter((x) => x.groupe === e.groupe && x.id !== e.id);
  const autres = ESPECES.filter((x) => x.groupe !== e.groupe && estOiseau(x) === estOiseau(e));
  let leurres = tirer(memeGroupe, 2);
  leurres = leurres.concat(tirer(autres, 3 - leurres.length));
  return {
    type: "photo-espece", espece: e, photo: tirerPhoto(e.id),
    titre: "Quelle est cette espèce ?",
    choix: melanger([e, ...leurres]).map((x) => ({ cle: x.id, label: x.nom })),
    bonne: e.id,
  };
}

function qStatut(e) {
  const autres = tirer(Object.keys(STATUTS).filter((k) => k !== e.statut), 3);
  return {
    type: "statut", espece: e, photo: tirerPhoto(e.id),
    titre: "Quel est le statut de cet animal ?",
    // 4 réponses : le bon statut et 3 autres, dans l'ordre habituel.
    choix: Object.entries(STATUTS).filter(([k]) => k === e.statut || autres.includes(k)).map(([k, s]) => ({ cle: k, label: s.nom })),
    bonne: e.statut,
  };
}

// Photo dont on connaît le sexe ou l'âge : mâle, femelle ou jeune ?
function qSexe(e) {
  const roles = [...new Set(toutesPhotos(e.id).map((p) => p.role).filter(Boolean))];
  const role = tirer(roles, 1)[0];
  const choix = Object.keys(ROLES).map((r) => ({ cle: r, label: libelleRole(e, r) }));
  return {
    type: "sexe", espece: e, photo: tirerPhoto(e.id, role),
    titre: "Mâle, femelle ou jeune ?",
    sousTitre: e.nom,
    choix, bonne: role,
  };
}
const aRoles = (e) => new Set(toutesPhotos(e.id).map((p) => p.role).filter(Boolean)).size >= 2;

function qTrace(e) {
  const pris = new Set([e.trace]);
  const leurres = [];
  for (const x of melanger(ESPECES.filter((x) => x.trace && estOiseau(x) === estOiseau(e)))) {
    if (pris.has(x.trace)) continue;
    pris.add(x.trace);
    leurres.push(x);
    if (leurres.length === 3) break;
  }
  return {
    type: "trace", espece: e, photoTrace: tirer(photosTraces[e.id] || [], 1)[0] || null,
    titre: "Quel animal laisse cette empreinte ?",
    choix: melanger([e, ...leurres]).map((x) => ({ cle: x.id, label: x.nom })),
    bonne: e.id,
  };
}

// Nom propre utilisable en quiz : forme courte (« Verrat »), et pas le nom de l'espèce elle-même (« Daim »).
const nomQuiz = (e, role) => {
  const n = nomPropre(e, role).split(" (")[0];
  return n && motCle(n) !== motCle(e.nom) ? n : "";
};
// Nombre d'espèces qui partagent chaque mot (« Caneton » : tous les canards).
const partage = {};
for (const e of ESPECES) for (const r of Object.keys(ROLES)) {
  const n = nomQuiz(e, r);
  if (n) partage[`${r}:${motCle(n)}`] = (partage[`${r}:${motCle(n)}`] || 0) + 1;
}

// Vocabulaire : « Chevreuil : comment s'appelle la femelle ? » ou « La hase est la femelle de… ».
function qVocabulaire(e) {
  const roles = Object.keys(ROLES).filter((r) => nomQuiz(e, r));
  const role = tirer(roles, 1)[0];
  const bonne = nomQuiz(e, role);
  const libelle = { male: "le mâle", femelle: "la femelle", jeune: "le jeune" }[role];
  const memeMot = (x) => nomQuiz(x, role) && motCle(nomQuiz(x, role)) === motCle(bonne);
  // La question inverse n'a de sens que pour un mot propre à une ou deux espèces.
  if (partage[`${role}:${motCle(bonne)}`] > 2 || Math.random() < 0.5) {
    const vus = new Set([motCle(bonne)]);
    const leurres = [];
    for (const x of melanger(ESPECES.filter((x) => estOiseau(x) === estOiseau(e)))) {
      const n = nomQuiz(x, role);
      if (!n || vus.has(motCle(n))) continue;
      vus.add(motCle(n));
      leurres.push(n);
      if (leurres.length === 3) break;
    }
    return {
      type: "vocabulaire", espece: e,
      titre: `${e.nom} : comment appelle-t-on ${libelle} ?`,
      choix: melanger([bonne, ...leurres]).map((n) => ({ cle: n, label: n })),
      bonne,
    };
  }
  const leurres = tirer(ESPECES.filter((x) => x.id !== e.id && !memeMot(x) && estOiseau(x) === estOiseau(e)), 3);
  return {
    type: "vocabulaire", espece: e,
    titre: `« ${bonne} » désigne ${libelle} de quel animal ?`,
    choix: melanger([e, ...leurres]).map((x) => ({ cle: x.id, label: x.nom })),
    bonne: e.id,
    // Deux espèces peuvent partager le même mot (bouquin, hase) : les deux sont justes.
    justes: ESPECES.filter(memeMot).map((x) => x.id),
  };
}
const aVocabulaire = (e) => Object.keys(ROLES).some((r) => nomQuiz(e, r));

// Reproduction des mammifères : période ou durée de gestation.
function qReproduction(e) {
  const champ = Math.random() < 0.5 ? "periode" : "duree";
  const bonne = e.repro[champ];
  // « Rut en octobre » et « Accouplement en octobre » disent la même chose : on compare sans le premier mot.
  const fond = (t) => t.replace(/^(Rut|Accouplement|Reproduction)( surtout| principalement)? /, "").replace(/^Environ /, "");
  const vus = new Set([fond(bonne)]);
  const pool = [];
  for (const x of melanger(ESPECES.filter((x) => !estOiseau(x) && x.repro?.[champ]))) {
    if (vus.has(fond(x.repro[champ]))) continue;
    vus.add(fond(x.repro[champ]));
    pool.push(x.repro[champ]);
  }
  return {
    type: "reproduction", espece: e,
    titre: champ === "periode" ? `${e.nom} : quand a lieu la reproduction ?` : `${e.nom} : quelle est la durée de la gestation ?`,
    choix: melanger([bonne, ...tirer(pool, 3)]).map((n) => ({ cle: n, label: n })),
    bonne,
  };
}

// Questions de l'épreuve théorique, lues dans questions/*.md (voir questions.js).
let QUESTIONS = [];
let THEMES_Q = {};
function qSavoir(s) {
  return {
    type: "savoir", id: s.id, theme: s.t, eliminatoire: !!s.e, image: s.image,
    titre: s.q,
    choix: melanger(s.r.map((label, k) => ({ cle: String(k), label }))),
    bonne: "0",
    ex: s.ex,
  };
}

// Choisit des espèces en privilégiant celles qui ont été ratées ou jamais vues.
function choisir(liste, n) {
  const poids = (e) => {
    const s = stats.especes[e.id];
    if (!s) return 3;
    if (!s.dernier) return 5;
    return s.ok >= 2 ? 1 : 2;
  };
  const sac = [];
  for (const e of liste) for (let k = 0; k < poids(e); k++) sac.push(e);
  const res = [];
  for (const e of melanger(sac)) {
    if (!res.includes(e)) res.push(e);
    if (res.length === n) break;
  }
  return res;
}

// Tire n questions en privilégiant les ratées, puis les jamais vues.
function savoirsTries(n, filtre = () => true) {
  const priorite = (q) => {
    const st = stats.savoirs[q.id];
    return !st ? 1 : st.dernier ? 2 : 0;
  };
  return melanger(QUESTIONS.filter(filtre)).sort((a, b) => priorite(a) - priorite(b)).slice(0, n).map(qSavoir);
}

// Questions sur photo, comme à l'examen : espèce, statut, empreinte, mâle / femelle / jeune.
function questionsPhoto(n) {
  const avecPhoto = ESPECES.filter(aPhoto);
  const fab = [
    () => qPhotoEspece(choisir(avecPhoto, 1)[0]),
    () => qStatut(choisir(avecPhoto, 1)[0]),
    () => qTrace(choisir(ESPECES.filter((e) => photosTraces[e.id]?.length), 1)[0]),
    () => qSexe(choisir(ESPECES.filter(aRoles), 1)[0]),
  ];
  return melanger(fab).slice(0, n).map((f) => f());
}

// Quiz d'un thème de l'épreuve théorique : 10 questions, dont une part illustrée.
function quizTheorie(theme) {
  const duTheme = (q) => theme === "tous" || q.t === theme;
  if (theme === "faune") return melanger([...questionsPhoto(4), ...savoirsTries(6, duTheme)]);
  // Armes et sécurité : 3 situations illustrées au moins quand il y en a.
  const illustrees = savoirsTries(theme === "armes" ? 3 : theme === "tous" ? 2 : 0, (q) => duTheme(q) && q.image);
  const pris = new Set(illustrees.map((q) => q.id));
  const photos = theme === "tous" ? questionsPhoto(2) : [];
  return melanger([...photos, ...illustrees, ...savoirsTries(10 - illustrees.length - photos.length, (q) => duTheme(q) && !pris.has(q.id))]);
}

// Examen blanc au format officiel : 10 questions sur les 4 thèmes, dont une question de sécurité éliminatoire.
function examenOfficiel() {
  const elim = savoirsTries(1, (q) => q.e);
  elim.forEach((q) => { q.elimExamen = true; });
  const pris = new Set(elim.map((q) => q.id));
  const de = (theme, n) => {
    const l = savoirsTries(n, (q) => q.t === theme && !pris.has(q.id));
    l.forEach((q) => pris.add(q.id));
    return l;
  };
  // Faune : 3 questions sur photo. Armes : une situation illustrée et une autre question.
  const situation = savoirsTries(1, (q) => q.t === "armes" && q.image && !pris.has(q.id));
  situation.forEach((q) => pris.add(q.id));
  return melanger([...questionsPhoto(3), ...de("chasse", 2), ...de("reglementation", 2), ...situation, ...de("armes", 2 - situation.length), ...elim]);
}

const MODES = {
  photos: { nom: "Reconnaître l'espèce", desc: "Une photo, quatre noms", icone: "photo" },
  statut: { nom: "Tirer ou ne pas tirer ?", desc: "Chassable, ESOD, protégée…", icone: "cible" },
  sexe: { nom: "Mâle, femelle ou jeune ?", desc: "Brocard, chevrette, faon…", icone: "sexe" },
  traces: { nom: "Empreintes", desc: "Photos et schémas de traces", icone: "trace" },
  biologie: { nom: "Reproduction et vocabulaire", desc: "Rut, gestation, noms des jeunes", icone: "biologie" },
  examen: { nom: "Révision des espèces", desc: "20 questions mélangées", icone: "liste" },
  theorie: { nom: "Épreuve théorique", desc: "" },
  officiel: { nom: "Examen blanc", desc: "10 questions au format de l'examen, avec photos et situations de tir, dont une question de sécurité éliminatoire." },
  erreurs: { nom: "Espèces ratées", desc: "", icone: "erreur" },
  erreursQ: { nom: "Questions ratées", desc: "", icone: "erreur" },
};

function construireQuiz(mode) {
  const base = ESPECES.filter(THEMES[etat.theme].filtre);
  const avecPhoto = base.filter(aPhoto);
  let questions = [];
  if (mode === "photos") {
    questions = choisir(avecPhoto, 10).map(qPhotoEspece);
  } else if (mode === "statut") {
    questions = choisir(avecPhoto, 10).map(qStatut);
  } else if (mode === "sexe") {
    questions = choisir(base.filter(aRoles), 10).map(qSexe);
  } else if (mode === "traces") {
    // Surtout des photos d'empreintes, complétées par des schémas.
    const avecPhoto = base.filter((e) => e.trace && photosTraces[e.id]?.length);
    const pris = choisir(avecPhoto, 7);
    questions = melanger([...pris, ...choisir(base.filter((e) => e.trace && !pris.includes(e)), 10 - pris.length)]).map(qTrace);
  } else if (mode === "biologie") {
    const voc = base.filter(aVocabulaire);
    const rep = base.filter((e) => !estOiseau(e));
    questions = melanger([...choisir(voc, 6).map(qVocabulaire), ...choisir(rep, 4).map(qReproduction)]);
  } else if (mode === "theorie") {
    questions = quizTheorie(etat.themeQ);
  } else if (mode === "officiel") {
    questions = examenOfficiel();
  } else if (mode === "erreursQ") {
    questions = melanger(QUESTIONS.filter((q) => stats.savoirs[q.id] && !stats.savoirs[q.id].dernier)).slice(0, 10).map(qSavoir);
  } else if (mode === "erreurs") {
    const ratees = ESPECES.filter((e) => stats.especes[e.id] && !stats.especes[e.id].dernier && aPhoto(e));
    questions = melanger(ratees).slice(0, 10).map((e) => (Math.random() < 0.5 ? qPhotoEspece(e) : qStatut(e)));
  } else if (mode === "examen") {
    const tous = ESPECES.filter(aPhoto);
    questions = melanger([
      ...choisir(tous, 7).map(qPhotoEspece),
      ...choisir(tous, 5).map(qStatut),
      ...choisir(ESPECES.filter(aRoles), 2).map(qSexe),
      ...choisir(ESPECES.filter((e) => e.trace), 2).map(qTrace),
      ...choisir(ESPECES.filter(aVocabulaire), 1).map(qVocabulaire),
      ...choisir(ESPECES.filter((e) => !estOiseau(e)), 1).map(qReproduction),
    ]);
  }
  return { mode, questions, i: 0, score: 0, reponse: null };
}

// ---------- Rendu ----------
const app = () => $("#app");

// Couleur de chaque thème de l'épreuve théorique (classe t-<thème> dans app.css).
const THEMES_COULEUR = ["faune", "chasse", "reglementation", "armes"];
const classeTheme = (t) => `t-${THEMES_COULEUR.includes(t) ? t : "autre"}`;

// Icônes au trait (24 × 24), en currentColor.
const ICONES = {
  photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cible: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  sexe: '<circle cx="9" cy="14" r="4.5"/><path d="M12.5 10.5 19 4M14.5 4H19v4.5"/>',
  trace: '<ellipse cx="12" cy="15" rx="4" ry="3.5"/><circle cx="7" cy="9" r="1.8"/><circle cx="10.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="9" r="1.8"/>',
  biologie: '<path d="M12 20c-4 0-7-3-7-7 0-5 4-9 7-9s7 4 7 9c0 4-3 7-7 7z"/><path d="M12 9v6M9 12h6"/>',
  liste: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  erreur: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  fermer: '<path d="M6 6l12 12M18 6L6 18"/>',
  retour: '<path d="M15 5l-7 7 7 7"/>',
};
const icone = (nom, classe = "icone") => `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nom]}</svg>`;

function photoHtml(p, classe = "photo") {
  if (!p?.src) {
    return `<div class="${classe} photo-vide" role="img" aria-label="Photo indisponible"><span>Photo non disponible pour le moment</span></div>`;
  }
  return `<figure class="${classe}"><img src="${h(p.src)}" alt="" decoding="async"></figure>`;
}

function creditHtml(p) {
  if (!p?.src) return "";
  return `<p class="credit">Photo : ${h(p.auteur || "Wikimedia Commons")}${p.licence ? `, ${h(p.licence)}` : ""}${p.source ? ` · <a href="${h(p.source)}" target="_blank" rel="noopener">source</a>` : ""}</p>`;
}

const pastille = (e) => `<span class="pastille s-${e.statut}">${h(STATUTS[e.statut].court)}${e.esod ? ` ${e.esod}` : ""}</span>`;
const vignette = (e) => {
  const p = toutesPhotos(e.id)[0];
  return p ? `<img class="vignette" src="${h(p.src)}" alt="" loading="lazy">` : `<span class="vignette vignette-vide"></span>`;
};

// Part des questions d'un thème réussies à la dernière tentative.
function reussiteTheme(theme) {
  const qs = QUESTIONS.filter((q) => theme === "tous" || q.t === theme);
  if (!qs.length) return 0;
  return Math.round((qs.filter((q) => stats.savoirs[q.id]?.dernier).length / qs.length) * 100);
}
const ratees = {
  especes: () => ESPECES.filter((e) => stats.especes[e.id] && !stats.especes[e.id].dernier && aPhoto(e)).length,
  questions: () => QUESTIONS.filter((q) => stats.savoirs[q.id] && !stats.savoirs[q.id].dernier).length,
};
const ligneMode = (k, detail = MODES[k].desc) => `
  <button type="button" class="ligne" data-mode="${k}">
    <span class="ligne-icone">${icone(MODES[k].icone)}</span>
    <span class="ligne-texte"><b>${h(MODES[k].nom)}</b><small>${h(detail)}</small></span>
    ${icone("chevron", "chevron")}
  </button>`;

// ---------- Réviser ----------
function rendreAccueil() {
  const derniers = stats.sessions.filter((x) => x.mode === "officiel");
  const dernier = derniers[derniers.length - 1];
  const nbQ = ratees.questions(), nbE = ratees.especes();
  const segment = etat.segment || "theorie";
  const themes = Object.entries(THEMES_Q);

  app().innerHTML = `
    <header class="titre-page">
      <h1>Réviser</h1>
      <span class="badge">${QUESTIONS.length} questions · ${ESPECES.length} espèces</span>
    </header>

    <section class="carte-examen">
      <div>
        <b>Examen blanc</b>
        <small>Format officiel : 10 questions, dont une éliminatoire${dernier ? ` · dernier : ${dernier.score}/${dernier.total}` : ""}</small>
      </div>
      <button type="button" class="bouton compact" data-mode="officiel">Lancer</button>
    </section>

    <div class="segments" role="tablist">
      <button type="button" role="tab" class="segment" data-segment="theorie" aria-selected="${segment === "theorie"}">Épreuve théorique</button>
      <button type="button" role="tab" class="segment" data-segment="especes" aria-selected="${segment === "especes"}">Espèces</button>
    </div>

    ${segment === "theorie" ? `
    <section class="liste-cartes">
      ${themes.map(([k, nom], i) => {
        const n = QUESTIONS.filter((q) => q.t === k).length;
        const illus = QUESTIONS.filter((q) => q.t === k && q.image).length;
        return `
        <button type="button" class="ligne theme ${classeTheme(k)}" data-theorie="${h(k)}">
          <span class="num">${i + 1}</span>
          <span class="ligne-texte"><b>${h(nom)}</b><small>${n} questions${k === "faune" ? " · photos" : illus ? " · situations" : ""}</small></span>
          <span class="pct">${reussiteTheme(k)} %</span>
        </button>`;
      }).join("")}
      <button type="button" class="ligne theme t-tous" data-theorie="tous">
        <span class="num">${icone("liste")}</span>
        <span class="ligne-texte"><b>Toutes les questions</b><small>${QUESTIONS.length} questions mélangées</small></span>
        <span class="pct">${reussiteTheme("tous")} %</span>
      </button>
      ${nbQ ? ligneMode("erreursQ", `${nbQ} question${nbQ > 1 ? "s" : ""} à revoir`) : ""}
    </section>` : `
    <section>
      <div class="chips defile" role="group" aria-label="Groupe d'espèces">
        ${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="chip" data-theme="${k}" aria-pressed="${etat.theme === k}">${h(t.nom)}</button>`).join("")}
      </div>
    </section>
    <section class="liste-cartes">
      ${["photos", "statut", "sexe", "traces", "biologie", "examen"].map((k) => ligneMode(k)).join("")}
      ${nbE ? ligneMode("erreurs", `${nbE} espèce${nbE > 1 ? "s" : ""} à revoir`) : ""}
    </section>`}`;

  app().querySelectorAll("[data-segment]").forEach((b) =>
    b.addEventListener("click", () => { etat.segment = b.dataset.segment; rendreAccueil(); }));
  app().querySelectorAll("[data-theme]").forEach((b) =>
    b.addEventListener("click", () => { etat.theme = b.dataset.theme; rendreAccueil(); }));
  app().querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => demarrer(b.dataset.mode)));
  app().querySelectorAll("[data-theorie]").forEach((b) =>
    b.addEventListener("click", () => { etat.themeQ = b.dataset.theorie; demarrer("theorie"); }));
}

// Nom affiché en haut du quiz et sur l'écran de score.
const titreQuiz = (z) => z.mode === "theorie" ? (THEMES_Q[z.themeQ] || "Toutes les questions") : MODES[z.mode].nom;

function demarrer(mode) {
  etat.quiz = { ...construireQuiz(mode), themeQ: etat.themeQ };
  etat.vue = "quiz";
  rendre();
  window.scrollTo(0, 0);
}

const estJuste = (q, cle) => cle === q.bonne || (q.justes || []).includes(cle);

function explication(q) {
  if (q.type === "savoir") return `<p>${h(q.ex)}</p>`;
  const e = q.espece;
  let detail = "";
  if (q.type === "statut") detail = `<p>${h(e.chasse)}</p>`;
  else if (q.type === "sexe") detail = `<p>${h(e.sexes)}</p>`;
  else if (q.type === "trace") detail = `<p>${h(e.traces)}</p>${q.photoTrace ? creditHtml(q.photoTrace) : `<p class="petit">${h(TRACES[e.trace].nom)} (${h(TRACES[e.trace].taille)}), schéma simplifié.</p>`}`;
  else if (q.type === "vocabulaire") {
    const noms = Object.keys(ROLES).filter((r) => nomPropre(e, r)).map((r) => `${ROLES[r]} : ${nomPropre(e, r)}`);
    detail = `<p>${h(noms.join(" · "))}</p>`;
  } else if (q.type === "reproduction") detail = `<p>${h(e.repro.periode)}. Gestation : ${h(e.repro.duree)}. ${h(e.repro.jeunes)}.</p>`;
  else detail = `<ul class="signes">${e.signes.slice(0, 3).map((s) => `<li>${h(s)}</li>`).join("")}</ul>`;
  return `
    <p class="exp-nom"><strong>${h(e.nom)}</strong> <em class="latin">${h(e.latin)}</em> ${pastille(e)}</p>
    ${detail}
    <button type="button" class="lien" id="voir-fiche" data-id="${e.id}">Voir la fiche ›</button>
    ${q.photo ? creditHtml(q.photo) : ""}`;
}

// ---------- Quiz ----------
function rendreQuiz() {
  const z = etat.quiz;
  if (!z.questions.length) {
    app().innerHTML = `<div class="vide"><p>Aucune question disponible pour ce choix.</p><button class="bouton" id="retour">Retour</button></div>`;
    $("#retour").onclick = () => aller("accueil");
    return;
  }
  const q = z.questions[z.i];
  const repondu = z.reponse !== null;
  const juste = repondu && estJuste(q, z.reponse);
  const theme = q.type === "savoir" ? q.theme : "faune";

  let media = "";
  if (q.photo !== undefined) media = photoHtml(q.photo);
  else if (q.image) media = `<figure class="photo illustration"><img src="${h(q.image.src)}" alt="${h(q.image.alt)}"></figure>`;
  else if (q.type === "trace") media = q.photoTrace ? photoHtml(q.photoTrace) : `<div class="trace-grande">${TRACES[q.espece.trace].dessin}</div>`;

  const choix = q.choix.map((c, i) => {
    let etatChoix = "";
    if (repondu) {
      if (estJuste(q, c.cle)) etatChoix = "bon";
      else if (c.cle === z.reponse) etatChoix = "faux";
      else etatChoix = "neutre";
    }
    return `<button type="button" class="choix ${etatChoix}" data-cle="${h(c.cle)}" ${repondu ? "disabled" : ""}><span class="lettre">${"ABCD"[i] || ""}</span><span>${h(c.label)}</span></button>`;
  }).join("");

  app().innerHTML = `
    <div class="quiz-barre">
      <button type="button" class="bouton-icone" id="quitter" aria-label="Quitter">${icone("fermer")}</button>
      <span class="quiz-mode">${h(titreQuiz(z))}</span>
      <span class="quiz-compteur">${z.i + 1}/${z.questions.length}</span>
    </div>
    <div class="quiz-avance ${classeTheme(theme)}"><div style="width:${((z.i + (repondu ? 1 : 0)) / z.questions.length) * 100}%"></div></div>
    <div class="etiquettes">
      <span class="etiquette-theme ${classeTheme(theme)}">${h(q.type === "savoir" ? THEMES_Q[q.theme] || "" : "Faune et habitats")}</span>
      ${q.elimExamen ? `<span class="etiquette-elim">Question éliminatoire</span>` : ""}
    </div>
    ${media}
    ${q.sousTitre ? `<p class="question-espece">${h(q.sousTitre)}</p>` : ""}
    <h2 class="question">${h(q.titre)}</h2>
    <div class="liste-choix">${choix}</div>
    ${repondu ? `
      <div class="retour ${juste ? "ok" : "ko"}" role="status">
        <p class="verdict">${juste ? "✓ Bonne réponse" : "✗ Mauvaise réponse"}</p>
        ${explication(q)}
      </div>
      <button type="button" class="bouton" id="suivant">${z.i + 1 < z.questions.length ? "Question suivante" : "Voir mon résultat"}</button>` : ""}
  `;

  $("#quitter").onclick = () => aller("accueil");
  app().querySelectorAll(".choix").forEach((b) => b.addEventListener("click", () => repondre(b.dataset.cle)));
  if (repondu) {
    $("#suivant").onclick = suivante;
    const voir = $("#voir-fiche");
    if (voir) voir.onclick = () => ouvrirFiche(voir.dataset.id);
    $(".retour").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function repondre(cle) {
  const z = etat.quiz;
  if (z.reponse !== null) return;
  const q = z.questions[z.i];
  z.reponse = cle;
  const ok = estJuste(q, cle);
  if (ok) z.score++;
  if (q.type === "savoir") noter("savoirs", q.id, ok);
  else noter("especes", q.espece.id, ok);
  if (q.elimExamen && !ok) z.elimine = true;
  if (navigator.vibrate) try { navigator.vibrate(ok ? 15 : [30, 40, 30]); } catch {}
  rendreQuiz();
}

function suivante() {
  const z = etat.quiz;
  if (z.i + 1 < z.questions.length) {
    z.i++;
    z.reponse = null;
    rendreQuiz();
    window.scrollTo(0, 0);
  } else {
    stats.sessions.push({ date: new Date().toISOString(), mode: z.mode, titre: titreQuiz(z), score: z.score, total: z.questions.length, elimine: !!z.elimine });
    stats.sessions = stats.sessions.slice(-50);
    sauverStats();
    etat.vue = "score";
    rendre();
  }
}

function rendreScore() {
  const z = etat.quiz;
  const pct = Math.round((z.score / z.questions.length) * 100);
  const message = z.elimine ? "La question de sécurité est ratée : à l'examen, cette erreur suffit à échouer." : pct >= 90 ? "Excellent, tu connais ton sujet." : pct >= 70 ? "Bon résultat, encore un effort." : pct >= 50 ? "C'est un début. Relis les fiches et recommence." : "Il faut réviser : commence par les fiches.";
  app().innerHTML = `
    <section class="score ${z.elimine ? "elimine" : pct >= 70 ? "reussi" : ""}">
      <p class="surtitre">${h(titreQuiz(z))}</p>
      <div class="anneau" style="--p:${pct}"><span><b>${z.score}</b>/${z.questions.length}</span></div>
      ${z.elimine ? `<p class="verdict-score">Éliminé</p>` : ""}
      <p>${message}</p>
      <div class="actions">
        <button type="button" class="bouton" id="rejouer">Recommencer</button>
        <button type="button" class="bouton secondaire" id="accueil">Retour aux révisions</button>
      </div>
    </section>`;
  $("#rejouer").onclick = () => { etat.themeQ = z.themeQ; demarrer(z.mode); };
  $("#accueil").onclick = () => aller("accueil");
}

// ---------- Fiches ----------
const sansAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Photo d'illustration de chaque catégorie sur l'accueil des fiches.
const PHOTO_GROUPE = { grand: "cerf", carnivores: "renard", petits: "lievre", plaine: "faisan", migrateurs: "becasse", corvides: "pie", canards: "colvert", eau: "vanneau", rapaces: "buse" };
const photoCategorie = (id) => toutesPhotos(id)[0]?.src || "";

// Accueil des fiches : une tuile par catégorie et une tuile « Toutes les espèces ».
// Une catégorie choisie (etat.groupeFiches) affiche sa liste ; la recherche cherche dans toutes les espèces.
function rendreFiches() {
  const g = etat.groupeFiches;
  const f = etat.filtreFiches;
  const r = sansAccents(etat.recherche.trim());
  const accueil = !g && !r;
  const correspond = (e) => (f === "tous" || e.statut === f) && (!g || g === "tous" || r || e.groupe === g) &&
    (!r || sansAccents(`${e.nom} ${e.latin} ${e.aussi || ""}`).includes(r));
  const filtres = [["tous", "Toutes"], ...Object.entries(STATUTS).map(([k, s]) => [k, s.court])];
  const titre = r ? "Recherche" : g === "tous" ? "Toutes les espèces" : g ? GROUPES[g].nom : "Fiches";
  const tuile = (k, nom, n, photo) => `
    <button type="button" class="tuile-categorie ${k === "tous" ? "toutes" : ""}" data-groupe="${k}">
      ${photo ? `<img src="${h(photo)}" alt="" loading="lazy">` : ""}
      <span class="tuile-texte"><b>${h(nom)}</b><small>${n} espèce${n > 1 ? "s" : ""}</small></span>
    </button>`;

  app().innerHTML = `
    <header class="titre-page">
      ${accueil ? "" : `<button type="button" class="bouton-icone" id="categories" aria-label="Retour aux catégories">${icone("retour")}</button>`}
      <h1>${h(titre)}</h1>
      <span class="badge">${accueil ? `${ESPECES.length} espèces` : `${ESPECES.filter(correspond).length} espèces`}</span>
    </header>
    <input type="search" class="recherche" id="recherche" placeholder="Rechercher une espèce" value="${h(etat.recherche)}" autocomplete="off">
    ${accueil ? `
    <section class="categories">
      ${tuile("tous", "Toutes les espèces", ESPECES.length, photoCategorie("sanglier"))}
      ${Object.entries(GROUPES).map(([k, gr]) => tuile(k, gr.nom, ESPECES.filter((e) => e.groupe === k).length, photoCategorie(PHOTO_GROUPE[k]))).join("")}
    </section>` : `
    <div class="chips defile" role="group" aria-label="Statut">
      ${filtres.map(([k, n]) => `<button type="button" class="chip ${k !== "tous" ? "s-" + k : ""}" data-filtre="${k}" aria-pressed="${f === k}">${h(n)}</button>`).join("")}
    </div>
    <div id="liste-fiches">
    ${Object.entries(GROUPES).map(([k, gr]) => {
      const liste = ESPECES.filter((e) => e.groupe === k && correspond(e));
      if (!liste.length) return "";
      return `
      <section class="groupe">
        ${g && g !== "tous" && !r ? `<p class="petit">${h(gr.resume)}</p>` : `<h2>${h(gr.nom)} <span class="compte">${liste.length}</span></h2>`}
        <ul class="fiches">
          ${liste.map((e) => `
            <li><button type="button" class="fiche-ligne" data-id="${e.id}">
              ${vignette(e)}
              <span class="fiche-texte"><span class="fiche-nom">${h(e.nom)}${maitrisee(e.id) ? ` <span class="coche" title="Maîtrisée">✓</span>` : ""}</span><span class="fiche-sous">${h(e.latin)}</span></span>
              ${pastille(e)}
              ${icone("chevron", "chevron")}
            </button></li>`).join("")}
        </ul>
      </section>`;
    }).join("") || `<p class="intro">Aucune espèce ne correspond.</p>`}
    </div>`}`;

  app().querySelectorAll("[data-groupe]").forEach((b) => b.addEventListener("click", () => {
    etat.groupeFiches = b.dataset.groupe;
    etat.filtreFiches = "tous";
    rendreFiches();
    window.scrollTo(0, 0);
  }));
  $("#categories")?.addEventListener("click", () => {
    etat.groupeFiches = null;
    etat.recherche = "";
    rendreFiches();
    window.scrollTo(0, 0);
  });
  app().querySelectorAll("[data-filtre]").forEach((b) => b.addEventListener("click", () => {
    etat.filtreFiches = b.dataset.filtre;
    rendreFiches();
  }));
  const champ = $("#recherche");
  champ.addEventListener("input", () => {
    etat.recherche = champ.value;
    rendreFiches();
    const c = $("#recherche");
    c.focus();
    c.setSelectionRange(c.value.length, c.value.length);
  });
  app().querySelectorAll(".fiche-ligne").forEach((b) => b.addEventListener("click", () => ouvrirFiche(b.dataset.id)));
}

function ouvrirFiche(id) {
  etat.fiche = id;
  etat.vue = "fiche";
  rendre();
  window.scrollTo(0, 0);
}

const legende = (e, p) => (p?.role ? libelleRole(e, p.role) : "");

function rendreFiche() {
  const e = parId[etat.fiche];
  const liste = toutesPhotos(e.id);
  const s = stats.especes[e.id];
  const pos = ORDRE_FICHES.indexOf(e.id);
  const prec = parId[ORDRE_FICHES[pos - 1]];
  const suiv = parId[ORDRE_FICHES[pos + 1]];
  const oiseau = estOiseau(e);
  const noms = Object.keys(ROLES).filter((r) => nomPropre(e, r));
  const t = TRACES[e.trace];
  // Rubrique repliable ; l'identification est ouverte par défaut.
  const rubrique = (titre, contenu, ouverte = false) => `
    <details class="rubrique" ${ouverte ? "open" : ""}><summary>${titre}${icone("chevron", "chevron")}</summary><div class="rubrique-corps">${contenu}</div></details>`;

  app().innerHTML = `
    <div class="quiz-barre">
      <button type="button" class="bouton-icone" id="retour" aria-label="Retour aux fiches">${icone("retour")}</button>
      <span class="quiz-mode">${h(GROUPES[e.groupe].nom)}</span>
      <span class="quiz-compteur">${pos + 1}/${ORDRE_FICHES.length}</span>
    </div>

    <header class="fiche-tete">
      ${vignette(e)}
      <div>
        <h1 class="fiche-titre">${h(e.nom)}</h1>
        <p class="latin">${h(e.latin)}</p>
        ${e.aussi ? `<p class="petit">Aussi appelé ${h(e.aussi)}</p>` : ""}
      </div>
    </header>

    <div class="statut-bloc s-${e.statut}">
      <p><strong>${h(STATUTS[e.statut].nom)}${e.esod ? ` (groupe ${e.esod})` : ""}.</strong> ${h(e.chasse)}</p>
    </div>

    ${liste.length ? `<div class="carrousel" aria-label="Photos">
      ${liste.map((p) => `<figure class="diapo">
        <img src="${h(p.src)}" alt="" loading="lazy">
        ${legende(e, p) ? `<span class="photo-role">${h(legende(e, p))}</span>` : ""}
        <figcaption class="credit">${h(p.auteur || "Wikimedia Commons")}${p.licence ? `, ${h(p.licence)}` : ""}${p.source ? ` · <a href="${h(p.source)}" target="_blank" rel="noopener">source</a>` : ""}</figcaption>
      </figure>`).join("")}
    </div>` : ""}

    <dl class="chiffres">
      <div><dt>Taille</dt><dd>${h(e.taille)}</dd></div>
      <div><dt>Poids</dt><dd>${h(e.poids)}</dd></div>
    </dl>

    <div class="rubriques">
      ${rubrique("Identification", `<ul class="signes">${e.signes.map((x) => `<li>${h(x)}</li>`).join("")}</ul>`, true)}
      ${rubrique("Mâle, femelle et jeune", `
        ${noms.length ? `<dl class="noms">${noms.map((r) => `<div><dt>${ROLES[r]}</dt><dd>${h(nomPropre(e, r))}</dd></div>`).join("")}</dl>` : ""}
        <p>${h(e.sexes)}</p>`)}
      ${rubrique("Habitat et alimentation", `<p>${h(e.habitat)}</p><p>${h(e.regime)}</p>`)}
      ${rubrique("Reproduction", `
        <dl class="chiffres">
          <div><dt>${oiseau ? "Nidification" : "Période"}</dt><dd>${h(e.repro.periode)}</dd></div>
          <div><dt>${oiseau ? "Incubation" : "Gestation"}</dt><dd>${h(e.repro.duree)}</dd></div>
          <div><dt>${oiseau ? "Ponte" : "Jeunes"}</dt><dd>${h(e.repro.jeunes)}</dd></div>
        </dl>
        <p>${h(e.repro.texte)}</p>`)}
      ${rubrique("Particularités", `<p>${h(e.particularites)}</p>`)}
      ${rubrique("Traces", `
        ${(photosTraces[e.id] || []).map((p) => `${photoHtml(p, "photo photo-trace")}${creditHtml(p)}`).join("")}
        ${t && !photosTraces[e.id]?.length ? `<div class="trace-fiche"><div class="trace-petite">${t.dessin}</div><p class="petit"><strong>${h(t.nom)}</strong><br>${h(t.taille)} · schéma simplifié</p></div>` : ""}
        <p>${h(e.traces)}</p>`)}
      ${rubrique("Risques de confusion", `<p>${h(e.confusions)}</p>`)}
    </div>
    ${s ? `<p class="petit">Mes réponses sur cette espèce : ${s.ok} bonne${s.ok > 1 ? "s" : ""} sur ${s.total}</p>` : ""}

    <nav class="nav-fiches" aria-label="Autres fiches">
      <button type="button" class="nav-fiche" data-id="${prec?.id || ""}" ${prec ? "" : "disabled"}>
        <span class="nav-sens">‹ Précédente</span><span class="nav-nom">${h(prec?.nom || "")}</span>
      </button>
      <button type="button" class="nav-fiche suivante" data-id="${suiv?.id || ""}" ${suiv ? "" : "disabled"}>
        <span class="nav-sens">Suivante ›</span><span class="nav-nom">${h(suiv?.nom || "")}</span>
      </button>
    </nav>`;

  $("#retour").onclick = () => aller("fiches");
  app().querySelectorAll(".nav-fiche").forEach((b) => b.addEventListener("click", () => {
    if (!b.dataset.id) return;
    etat.fiche = b.dataset.id;
    rendreFiche();
    window.scrollTo(0, 0);
  }));
}

// ---------- Progrès ----------
function rendreProgres() {
  const nbM = ESPECES.filter((e) => maitrisee(e.id)).length;
  const examens = stats.sessions.filter((x) => x.mode === "officiel");
  const reussis = examens.filter((x) => !x.elimine && x.score >= 8).length;
  const meilleur = examens.reduce((m, x) => Math.max(m, x.score), 0);
  const nbQ = ratees.questions(), nbE = ratees.especes();
  const date = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const barre = (pct, classe) => `<div class="barre ${classe}"><div style="width:${pct}%"></div></div>`;

  app().innerHTML = `
    <header class="titre-page"><h1>Progrès</h1></header>

    <section class="stats">
      <div><b>${examens.length}</b><small>examens blancs</small></div>
      <div><b>${examens.length ? `${meilleur}/10` : "–"}</b><small>meilleur score</small></div>
      <div><b>${reussis}</b><small>réussis (8/10 et plus)</small></div>
    </section>

    <section class="carte">
      <h2>Épreuve théorique</h2>
      ${Object.entries(THEMES_Q).map(([k, nom]) => `
        <div class="progres-ligne"><span>${h(nom)}</span><b>${reussiteTheme(k)} %</b></div>
        ${barre(reussiteTheme(k), classeTheme(k))}`).join("")}
      <p class="petit">Part des questions du thème réussies la dernière fois qu'elles sont tombées.</p>
    </section>

    <section class="carte">
      <h2>Espèces</h2>
      <div class="progres-ligne"><span>Espèces maîtrisées</span><b>${nbM}/${ESPECES.length}</b></div>
      ${barre(Math.round((nbM / ESPECES.length) * 100), "t-faune")}
      <p class="petit">Une espèce est maîtrisée après au moins 2 bonnes réponses, dont la dernière.</p>
    </section>

    ${nbQ || nbE ? `<section class="liste-cartes">
      ${nbQ ? ligneMode("erreursQ", `${nbQ} question${nbQ > 1 ? "s" : ""} à revoir`) : ""}
      ${nbE ? ligneMode("erreurs", `${nbE} espèce${nbE > 1 ? "s" : ""} à revoir`) : ""}
    </section>` : ""}

    <section class="carte">
      <h2>Derniers entraînements</h2>
      ${stats.sessions.length ? `<ul class="historique">${stats.sessions.slice(-8).reverse().map((x) => `
        <li><span>${h(x.titre || MODES[x.mode]?.nom || "")}<small>${date(x.date)}</small></span><b class="${x.elimine ? "ko" : ""}">${x.elimine ? "Éliminé · " : ""}${x.score}/${x.total}</b></li>`).join("")}</ul>`
      : `<p class="petit">Aucun entraînement terminé pour l'instant.</p>`}
    </section>

    <button type="button" class="bouton secondaire" id="reinit">Effacer ma progression</button>
    <p id="confirmation" class="petit" hidden>Touche encore une fois pour confirmer.</p>`;

  app().querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => demarrer(b.dataset.mode)));
  let arme = false;
  $("#reinit").onclick = () => {
    if (!arme) { arme = true; $("#confirmation").hidden = false; return; }
    stats = statsVides();
    sauverStats();
    rendreProgres();
  };
}

// ---------- Infos ----------
async function prechargerPhotos(onAvance) {
  const liste = [...Object.values(photos), ...Object.values(photosTraces)].flat().map((p) => p.src);
  let fait = 0;
  for (let i = 0; i < liste.length; i += 6) {
    await Promise.all(liste.slice(i, i + 6).map((src) => fetch(src).catch(() => {})));
    fait = Math.min(liste.length, i + 6);
    onAvance(fait, liste.length);
  }
}

function rendreInfos() {
  const nbPhotos = Object.values(photos).flat().length;
  const nbTraces = Object.values(photosTraces).flat().length;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
  app().innerHTML = `
    <header class="titre-page"><h1>Infos</h1></header>

    <section class="carte">
      <h2>Installer sur iPhone</h2>
      ${standalone ? `<p>L'application est installée sur ton écran d'accueil.</p>` : `
      <ol class="etapes">
        <li>Ouvre cette page dans <strong>Safari</strong>.</li>
        <li>Touche le bouton <strong>Partager</strong> (carré avec une flèche vers le haut).</li>
        <li>Choisis <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.</li>
      </ol>`}
    </section>

    <section class="carte">
      <h2>Hors connexion</h2>
      <p>${nbPhotos} photos d'espèces et ${nbTraces} photos d'empreintes. Télécharge-les pour réviser sans réseau.</p>
      <button type="button" class="bouton" id="precharger">Télécharger les photos</button>
      <p id="etat-telechargement" class="petit" role="status"></p>
    </section>

    <section class="carte">
      <h2>Les statuts</h2>
      <dl class="noms">${Object.entries(STATUTS).map(([k, s]) => `<div><dt><span class="pastille s-${k}">${h(s.court)}</span></dt><dd>${h(s.resume)}</dd></div>`).join("")}</dl>
      <ul class="signes petit">${Object.values(GROUPES_ESOD).map((g) => `<li>${h(g)}</li>`).join("")}</ul>
      <p class="petit">Les listes d'espèces chassables et ESOD, les périodes de chasse et les quotas dépendent des arrêtés nationaux et préfectoraux, qui changent régulièrement : vérifie toujours les textes en vigueur dans ton département.</p>
    </section>

    <section class="carte">
      <h2>Ajouter des questions</h2>
      <p class="petit">Les questions sont dans le dossier <code>questions/</code> du dépôt GitHub, un fichier Markdown par thème. Modifie un fichier ou déposes-en un nouveau : l'application le charge à la prochaine ouverture avec du réseau. Le format est expliqué dans <code>questions/LISEZMOI.md</code>.</p>
    </section>

    <details class="carte rubrique">
      <summary>Sources et crédits photo${icone("chevron", "chevron")}</summary>
      <div class="rubrique-corps">
        <p class="petit">Contenu pédagogique rédigé pour la préparation à l'examen du permis de chasser, à compléter avec le manuel officiel. Sans photo d'empreinte libre, l'empreinte est montrée par un schéma simplifié. Photos sous licence libre provenant de Wikimedia Commons.</p>
        <ul class="credits">
          ${ESPECES.map((e) => {
            const liste = [...toutesPhotos(e.id), ...(photosTraces[e.id] || []).map((p) => ({ ...p, auteur: `empreinte : ${p.auteur || "Wikimedia Commons"}` }))];
            if (!liste.length) return "";
            return `<li><strong>${h(e.nom)}</strong> : ${liste.map((p) => `${h(p.auteur || "Wikimedia Commons")}${p.licence ? `, ${h(p.licence)}` : ""}${p.source ? ` (<a href="${h(p.source)}" target="_blank" rel="noopener">source</a>)` : ""}`).join(" ; ")}</li>`;
          }).join("")}
        </ul>
      </div>
    </details>`;

  $("#precharger").onclick = async () => {
    const etatEl = $("#etat-telechargement");
    etatEl.textContent = "Téléchargement…";
    await prechargerPhotos((f, t) => { etatEl.textContent = `${f} / ${t} photos téléchargées`; });
    etatEl.textContent = "Photos disponibles hors connexion.";
  };
}

function aller(vue) {
  etat.vue = vue;
  rendre();
  window.scrollTo(0, 0);
}

function rendre() {
  const onglet = { accueil: "accueil", quiz: "accueil", score: "accueil", fiches: "fiches", fiche: "fiches", progres: "progres", infos: "infos" }[etat.vue];
  document.querySelectorAll(".onglet").forEach((b) => b.setAttribute("aria-current", b.dataset.vue === onglet ? "page" : "false"));
  document.body.dataset.vue = etat.vue;
  ({ accueil: rendreAccueil, quiz: rendreQuiz, score: rendreScore, fiches: rendreFiches, fiche: rendreFiche, progres: rendreProgres, infos: rendreInfos })[etat.vue]();
}

// ---------- Démarrage ----------
document.querySelectorAll(".onglet").forEach((b) => b.addEventListener("click", () => {
  // Toucher « Fiches » alors qu'on y est déjà ramène aux catégories.
  if (b.dataset.vue === "fiches" && etat.vue === "fiches") { etat.groupeFiches = null; etat.recherche = ""; }
  aller(b.dataset.vue);
}));
rendre();
Promise.all([chargerPhotos(), chargerTraces(), chargerQuestions()]).then(([p, t, q]) => {
  photos = p;
  photosTraces = t;
  QUESTIONS = q.questions;
  THEMES_Q = q.themes;
  if (["accueil", "fiches", "fiche", "progres", "infos"].includes(etat.vue)) rendre();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
