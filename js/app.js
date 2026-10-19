import { GROUPES, STATUTS, GROUPES_ESOD, ESPECES, SAVOIRS } from "./especes.js?v=1";
import { TRACES } from "./traces.js?v=1";

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

// ---------- Photos (photos/credits.json, fichiers embarqués dans photos/) ----------
let photos = {};
async function chargerPhotos() {
  try {
    const r = await fetch("photos/credits.json?v=1");
    if (!r.ok) return {};
    const d = await r.json();
    for (const liste of Object.values(d)) for (const p of liste) p.src = "photos/" + p.fichierLocal;
    return d;
  } catch {
    return {};
  }
}
const toutesPhotos = (id) => photos[id] || [];
const aPhoto = (e) => toutesPhotos(e.id).length > 0;
const tirerPhoto = (id, role) => tirer(toutesPhotos(id).filter((p) => !role || p.role === role), 1)[0] || null;

// ---------- État ----------
const etat = { vue: "accueil", theme: "tous", quiz: null, fiche: null, filtreFiches: "tous", recherche: "" };

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
  return {
    type: "statut", espece: e, photo: tirerPhoto(e.id),
    titre: "Quel est le statut de cet animal ?",
    choix: Object.entries(STATUTS).map(([k, s]) => ({ cle: k, label: s.nom })),
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
    type: "trace", espece: e,
    titre: "Quel animal laisse cette empreinte ?",
    choix: melanger([e, ...leurres]).map((x) => ({ cle: x.id, label: x.nom })),
    bonne: e.id,
  };
}

// Vocabulaire : « Chevreuil : comment s'appelle la femelle ? » ou « La hase est la femelle de… ».
function qVocabulaire(e) {
  const roles = Object.keys(ROLES).filter((r) => nomPropre(e, r));
  const role = tirer(roles, 1)[0];
  const bonne = nomPropre(e, role);
  const libelle = { male: "le mâle", femelle: "la femelle", jeune: "le jeune" }[role];
  const memeMot = (x) => nomPropre(x, role) && motCle(nomPropre(x, role)) === motCle(bonne);
  if (Math.random() < 0.5) {
    const vus = new Set([motCle(bonne)]);
    const leurres = [];
    for (const x of melanger(ESPECES)) {
      const n = nomPropre(x, role);
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
  const mot = bonne.split(" (")[0];
  return {
    type: "vocabulaire", espece: e,
    titre: `« ${mot} » désigne ${libelle} de quel animal ?`,
    choix: melanger([e, ...leurres]).map((x) => ({ cle: x.id, label: x.nom })),
    bonne: e.id,
    // Plusieurs espèces peuvent partager le même mot (bouquin, hase…) : toutes sont justes.
    justes: ESPECES.filter(memeMot).map((x) => x.id),
  };
}
const aVocabulaire = (e) => Object.keys(ROLES).some((r) => nomPropre(e, r));

// Reproduction des mammifères : période ou durée de gestation.
function qReproduction(e) {
  const champ = Math.random() < 0.5 ? "periode" : "duree";
  const bonne = e.repro[champ];
  const pool = [...new Set(ESPECES.filter((x) => !estOiseau(x) && x.repro?.[champ] && x.repro[champ] !== bonne).map((x) => x.repro[champ]))];
  return {
    type: "reproduction", espece: e,
    titre: champ === "periode" ? `${e.nom} : quand a lieu la reproduction ?` : `${e.nom} : quelle est la durée de la gestation ?`,
    choix: melanger([bonne, ...tirer(pool, 3)]).map((n) => ({ cle: n, label: n })),
    bonne,
  };
}

function qSavoir(i) {
  const s = SAVOIRS[i];
  return {
    type: "savoir", index: i,
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

function savoirsTries(n) {
  const idx = SAVOIRS.map((_, i) => i).sort((a, b) => {
    const sa = stats.savoirs[a], sb = stats.savoirs[b];
    const pa = !sa ? 1 : sa.dernier ? 2 : 0;
    const pb = !sb ? 1 : sb.dernier ? 2 : 0;
    return pa - pb || Math.random() - 0.5;
  });
  return idx.slice(0, n).map(qSavoir);
}

const MODES = {
  photos: { nom: "Reconnaître les espèces", desc: "Une photo, quatre noms : trouve la bonne espèce." },
  statut: { nom: "Tirer ou ne pas tirer ?", desc: "Chassable, ESOD, chasse suspendue ou protégée : reconnais l'animal et son statut." },
  sexe: { nom: "Mâle, femelle ou jeune ?", desc: "Distingue le brocard de la chevrette, le coq de la poule, le marcassin…" },
  traces: { nom: "Empreintes", desc: "Associe chaque empreinte à l'animal qui la laisse." },
  biologie: { nom: "Reproduction et vocabulaire", desc: "Rut, gestation, noms des mâles, femelles et jeunes." },
  savoirs: { nom: "Questions de connaissances", desc: `${SAVOIRS.length} questions sur la biologie, l'identification et les statuts.` },
  examen: { nom: "Examen blanc", desc: "20 questions mélangées sur toutes les espèces." },
  erreurs: { nom: "Revoir mes erreurs", desc: "" },
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
    questions = choisir(base.filter((e) => e.trace), 10).map(qTrace);
  } else if (mode === "biologie") {
    const voc = base.filter(aVocabulaire);
    const rep = base.filter((e) => !estOiseau(e));
    questions = melanger([...choisir(voc, 6).map(qVocabulaire), ...choisir(rep, 4).map(qReproduction)]);
  } else if (mode === "savoirs") {
    questions = savoirsTries(10);
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
      ...savoirsTries(2),
    ]);
  }
  return { mode, questions, i: 0, score: 0, reponse: null };
}

// ---------- Rendu ----------
const app = () => $("#app");

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
  return p ? `<img src="${h(p.src)}" alt="" loading="lazy">` : `<span class="vignette-vide"></span>`;
};

function rendreAccueil() {
  const nbM = ESPECES.filter((e) => maitrisee(e.id)).length;
  const nbErreurs = ESPECES.filter((e) => stats.especes[e.id] && !stats.especes[e.id].dernier && aPhoto(e)).length;
  const derniere = stats.sessions[stats.sessions.length - 1];
  const mode = (k, classe = "") => `
    <button type="button" class="mode ${classe}" data-mode="${k}">
      <span class="mode-nom">${h(MODES[k].nom)}</span>
      <span class="mode-desc">${h(MODES[k].desc)}</span>
    </button>`;
  app().innerHTML = `
    <header class="entete">
      <p class="surtitre">Permis de chasser · Épreuve théorique</p>
      <h1>Faune et chasse</h1>
      <p class="intro">Reconnais ${ESPECES.length} espèces : gibier, ESOD et espèces protégées.</p>
    </header>

    <section class="progres" aria-label="Progression">
      <div class="jauge"><div class="jauge-remplie" style="width:${Math.round((nbM / ESPECES.length) * 100)}%"></div></div>
      <p><strong>${nbM}</strong> espèce${nbM > 1 ? "s" : ""} maîtrisée${nbM > 1 ? "s" : ""} sur ${ESPECES.length}${derniere ? ` · dernier quiz : ${derniere.score}/${derniere.total}` : ""}</p>
    </section>

    <section aria-labelledby="t-theme">
      <h2 id="t-theme" class="etiquette">Thème travaillé</h2>
      <div class="chips" role="group">
        ${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="chip" data-theme="${k}" aria-pressed="${etat.theme === k}">${h(t.nom)}</button>`).join("")}
      </div>
    </section>

    <section class="modes" aria-label="Entraînements">
      ${mode("photos", "mode-principal")}
      ${mode("statut")}
      ${mode("sexe")}
      ${mode("traces")}
      ${mode("biologie")}
      ${mode("savoirs")}
      ${mode("examen")}
      ${nbErreurs ? `<button type="button" class="mode mode-erreurs" data-mode="erreurs">
        <span class="mode-nom">Revoir mes erreurs</span>
        <span class="mode-desc">${nbErreurs} espèce${nbErreurs > 1 ? "s" : ""} ratée${nbErreurs > 1 ? "s" : ""} à la dernière rencontre.</span>
      </button>` : ""}
    </section>`;

  app().querySelectorAll("[data-theme]").forEach((b) =>
    b.addEventListener("click", () => { etat.theme = b.dataset.theme; rendreAccueil(); }));
  app().querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => demarrer(b.dataset.mode)));
}

function demarrer(mode) {
  etat.quiz = construireQuiz(mode);
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
  else if (q.type === "trace") detail = `<p>${h(TRACES[e.trace].nom)} (${h(TRACES[e.trace].taille)}). ${h(e.traces)}</p>`;
  else if (q.type === "vocabulaire") {
    const noms = Object.keys(ROLES).filter((r) => nomPropre(e, r)).map((r) => `${ROLES[r]} : ${nomPropre(e, r)}`);
    detail = `<p>${h(noms.join(" · "))}</p>`;
  } else if (q.type === "reproduction") detail = `<p>${h(e.repro.periode)}. Gestation : ${h(e.repro.duree)}. ${h(e.repro.jeunes)}.</p>`;
  else detail = `<ul class="signes">${e.signes.slice(0, 3).map((s) => `<li>${h(s)}</li>`).join("")}</ul>`;
  return `
    <p class="exp-nom"><strong>${h(e.nom)}</strong> <em class="latin">${h(e.latin)}</em> ${pastille(e)}</p>
    ${detail}
    <button type="button" class="lien" id="voir-fiche" data-id="${e.id}">Voir la fiche</button>
    ${q.photo ? creditHtml(q.photo) : ""}`;
}

function rendreQuiz() {
  const z = etat.quiz;
  if (!z.questions.length) {
    app().innerHTML = `<div class="vide"><p>Aucune question disponible pour ce thème.</p><button class="bouton" id="retour">Retour</button></div>`;
    $("#retour").onclick = () => aller("accueil");
    return;
  }
  const q = z.questions[z.i];
  const repondu = z.reponse !== null;
  const juste = repondu && estJuste(q, z.reponse);

  let media = "";
  if (q.photo !== undefined) media = photoHtml(q.photo);
  else if (q.type === "trace") media = `<div class="trace-grande">${TRACES[q.espece.trace].dessin}</div>`;

  const choix = q.choix.map((c) => {
    let etatChoix = "";
    if (repondu) {
      if (estJuste(q, c.cle)) etatChoix = "bon";
      else if (c.cle === z.reponse) etatChoix = "faux";
      else etatChoix = "neutre";
    }
    return `<button type="button" class="choix ${etatChoix}" data-cle="${h(c.cle)}" ${repondu ? "disabled" : ""}><span>${h(c.label)}</span></button>`;
  }).join("");

  app().innerHTML = `
    <div class="quiz-barre">
      <button type="button" class="lien" id="quitter">Quitter</button>
      <span class="quiz-mode">${h(MODES[z.mode].nom)}</span>
      <span class="quiz-compteur">${z.i + 1}/${z.questions.length}</span>
    </div>
    <div class="quiz-avance"><div style="width:${(z.i / z.questions.length) * 100}%"></div></div>
    ${media}
    ${q.sousTitre ? `<p class="question-espece">${h(q.sousTitre)}</p>` : ""}
    <h2 class="question">${h(q.titre)}</h2>
    <div class="liste-choix">${choix}</div>
    ${repondu ? `
      <div class="retour ${juste ? "ok" : "ko"}" role="status">
        <p class="verdict">${juste ? "Bonne réponse" : "Raté"}</p>
        ${explication(q)}
      </div>
      <button type="button" class="bouton" id="suivant">${z.i + 1 < z.questions.length ? "Question suivante" : "Voir mon score"}</button>` : ""}
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
  if (q.type === "savoir") noter("savoirs", q.index, ok);
  else noter("especes", q.espece.id, ok);
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
    stats.sessions.push({ date: new Date().toISOString(), mode: z.mode, score: z.score, total: z.questions.length });
    stats.sessions = stats.sessions.slice(-50);
    sauverStats();
    etat.vue = "score";
    rendre();
  }
}

function rendreScore() {
  const z = etat.quiz;
  const pct = Math.round((z.score / z.questions.length) * 100);
  const message = pct >= 90 ? "Excellent, tu connais ton sujet." : pct >= 70 ? "Bon résultat, encore un effort." : pct >= 50 ? "C'est un début. Relis les fiches du thème." : "Il faut réviser : commence par les fiches.";
  app().innerHTML = `
    <section class="score">
      <p class="surtitre">${h(MODES[z.mode].nom)}</p>
      <p class="score-chiffre"><span>${z.score}</span>/${z.questions.length}</p>
      <p>${message}</p>
      <div class="actions">
        <button type="button" class="bouton" id="rejouer">Recommencer</button>
        <button type="button" class="bouton secondaire" id="accueil">Accueil</button>
      </div>
    </section>`;
  $("#rejouer").onclick = () => demarrer(z.mode);
  $("#accueil").onclick = () => aller("accueil");
}

// ---------- Fiches ----------
const sansAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function rendreFiches() {
  const f = etat.filtreFiches;
  const r = sansAccents(etat.recherche.trim());
  const correspond = (e) => (f === "tous" || e.statut === f) &&
    (!r || sansAccents(`${e.nom} ${e.latin} ${e.aussi || ""}`).includes(r));
  const filtres = [["tous", "Toutes"], ...Object.entries(STATUTS).map(([k, s]) => [k, s.court])];
  app().innerHTML = `
    <header class="entete compacte"><h1>Fiches</h1></header>
    <input type="search" class="recherche" id="recherche" placeholder="Rechercher une espèce" value="${h(etat.recherche)}" autocomplete="off">
    <div class="chips" role="group" aria-label="Statut">
      ${filtres.map(([k, n]) => `<button type="button" class="chip ${k !== "tous" ? "s-" + k : ""}" data-filtre="${k}" aria-pressed="${f === k}">${h(n)}</button>`).join("")}
    </div>
    <div id="liste-fiches">
    ${Object.entries(GROUPES).map(([k, g]) => {
      const liste = ESPECES.filter((e) => e.groupe === k && correspond(e));
      if (!liste.length) return "";
      return `
      <section class="groupe">
        <h2>${h(g.nom)} <span class="compte">${liste.length}</span></h2>
        <p class="groupe-resume">${h(g.resume)}</p>
        <ul class="fiches">
          ${liste.map((e) => `
            <li><button type="button" class="fiche-ligne" data-id="${e.id}">
              ${vignette(e)}
              <span class="fiche-texte"><span class="fiche-nom">${h(e.nom)}</span><span class="fiche-sous"><em>${h(e.latin)}</em></span></span>
              ${pastille(e)}
              ${maitrisee(e.id) ? `<span class="coche" title="Maîtrisée">✓</span>` : ""}
            </button></li>`).join("")}
        </ul>
      </section>`;
    }).join("") || `<p class="intro">Aucune espèce ne correspond.</p>`}
    </div>`;
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

function rendreFiche(photoChoisie) {
  const e = parId[etat.fiche];
  const liste = toutesPhotos(e.id);
  const photoFiche = photoChoisie || liste[0] || null;
  const s = stats.especes[e.id];
  const pos = ORDRE_FICHES.indexOf(e.id);
  const prec = parId[ORDRE_FICHES[pos - 1]];
  const suiv = parId[ORDRE_FICHES[pos + 1]];
  const oiseau = estOiseau(e);
  const noms = Object.keys(ROLES).filter((r) => nomPropre(e, r));
  const t = TRACES[e.trace];
  const section = (titre, contenu) => contenu ? `<section class="rubrique"><h2>${titre}</h2>${contenu}</section>` : "";

  app().innerHTML = `
    <div class="quiz-barre">
      <button type="button" class="lien" id="retour">‹ Fiches</button>
      <span class="quiz-mode"></span>
      <span class="quiz-compteur">${pos + 1}/${ORDRE_FICHES.length}</span>
    </div>
    <div class="photo-cadre">
      ${photoHtml(photoFiche)}
      ${legende(e, photoFiche) ? `<span class="photo-role">${h(legende(e, photoFiche))}</span>` : ""}
    </div>
    ${creditHtml(photoFiche)}
    ${liste.length > 1 ? `<div class="galerie" role="group" aria-label="Autres photos">
      ${liste.map((p, i) => `<button type="button" class="galerie-vignette" data-i="${i}" aria-pressed="${p === photoFiche}" aria-label="Photo ${i + 1}${p.role ? ` (${ROLES[p.role]})` : ""}"><img src="${h(p.src)}" alt="" loading="lazy">${p.role ? `<span>${h(ROLES[p.role])}</span>` : ""}</button>`).join("")}
    </div>` : ""}
    <header class="fiche-entete">
      <h1 class="fiche-titre">${h(e.nom)}</h1>
      <p class="latin">${h(e.latin)}${e.aussi ? ` · aussi appelé ${h(e.aussi)}` : ""}</p>
      <p>${pastille(e)} <span class="sous">${h(GROUPES[e.groupe].nom)}</span></p>
    </header>

    <div class="statut-bloc s-${e.statut}">
      <p><strong>${h(STATUTS[e.statut].nom)}.</strong> ${h(e.chasse)}</p>
      ${e.esod ? `<p class="petit">${h(GROUPES_ESOD[e.esod])}</p>` : ""}
    </div>

    <dl class="chiffres">
      <div><dt>Taille</dt><dd>${h(e.taille)}</dd></div>
      <div><dt>Poids</dt><dd>${h(e.poids)}</dd></div>
    </dl>

    ${section("Identification", `<ul class="signes">${e.signes.map((x) => `<li>${h(x)}</li>`).join("")}</ul>`)}
    ${section("Mâle, femelle et jeune", `
      ${noms.length ? `<dl class="noms">${noms.map((r) => `<div><dt>${ROLES[r]}</dt><dd>${h(nomPropre(e, r))}</dd></div>`).join("")}</dl>` : ""}
      <p>${h(e.sexes)}</p>`)}
    ${section("Habitat et alimentation", `<p>${h(e.habitat)}</p><p>${h(e.regime)}</p>`)}
    ${section("Reproduction", `
      <dl class="chiffres">
        <div><dt>${oiseau ? "Nidification" : "Période"}</dt><dd>${h(e.repro.periode)}</dd></div>
        <div><dt>${oiseau ? "Incubation" : "Gestation"}</dt><dd>${h(e.repro.duree)}</dd></div>
        <div><dt>${oiseau ? "Ponte" : "Jeunes"}</dt><dd>${h(e.repro.jeunes)}</dd></div>
      </dl>
      <p>${h(e.repro.texte)}</p>`)}
    ${section("Particularités", `<p>${h(e.particularites)}</p>`)}
    ${section("Traces", `
      ${t ? `<div class="trace-fiche"><div class="trace-petite">${t.dessin}</div><p class="petit"><strong>${h(t.nom)}</strong><br>${h(t.taille)} · schéma simplifié</p></div>` : ""}
      <p>${h(e.traces)}</p>`)}
    ${section("Risques de confusion", `<p>${h(e.confusions)}</p>`)}
    ${s ? `<p class="petit">Mes réponses : ${s.ok} bonne${s.ok > 1 ? "s" : ""} sur ${s.total}</p>` : ""}

    <nav class="nav-fiches" aria-label="Autres fiches">
      <button type="button" class="nav-fiche" data-id="${prec?.id || ""}" ${prec ? "" : "disabled"}>
        <span class="nav-sens">‹ Précédente</span><span class="nav-nom">${h(prec?.nom || "")}</span>
      </button>
      <button type="button" class="nav-fiche suivante" data-id="${suiv?.id || ""}" ${suiv ? "" : "disabled"}>
        <span class="nav-sens">Suivante ›</span><span class="nav-nom">${h(suiv?.nom || "")}</span>
      </button>
    </nav>`;

  $("#retour").onclick = () => aller("fiches");
  const ouvrir = (id) => {
    if (!id) return;
    etat.fiche = id;
    rendreFiche();
    window.scrollTo(0, 0);
  };
  app().querySelectorAll(".galerie-vignette").forEach((b) => b.addEventListener("click", () => rendreFiche(liste[Number(b.dataset.i)])));
  app().querySelectorAll(".nav-fiche").forEach((b) => b.addEventListener("click", () => ouvrir(b.dataset.id)));

  // Glisser vers la gauche ou la droite sur la photo pour changer de fiche.
  const zone = $(".photo", app());
  let x0 = null, y0 = null;
  zone?.addEventListener("touchstart", (ev) => { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
  zone?.addEventListener("touchend", (ev) => {
    if (x0 === null) return;
    const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) ouvrir(dx < 0 ? suiv?.id : prec?.id);
  });
}

// ---------- Infos ----------
async function prechargerPhotos(onAvance) {
  const liste = Object.values(photos).flat().map((p) => p.src);
  let fait = 0;
  for (let i = 0; i < liste.length; i += 6) {
    await Promise.all(liste.slice(i, i + 6).map((src) => fetch(src).catch(() => {})));
    fait = Math.min(liste.length, i + 6);
    onAvance(fait, liste.length);
  }
}

function rendreInfos() {
  const nbPhotos = Object.values(photos).flat().length;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
  app().innerHTML = `
    <header class="entete compacte"><h1>Infos</h1></header>

    <section class="bloc">
      <h2>Installer sur iPhone</h2>
      ${standalone ? `<p>L'application est installée sur ton écran d'accueil.</p>` : `
      <ol class="etapes">
        <li>Ouvre cette page dans <strong>Safari</strong>.</li>
        <li>Touche le bouton <strong>Partager</strong> (carré avec une flèche vers le haut).</li>
        <li>Choisis <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.</li>
      </ol>`}
    </section>

    <section class="bloc">
      <h2>Utilisation hors connexion</h2>
      <p>${nbPhotos} photos pour ${ESPECES.filter(aPhoto).length} espèces sur ${ESPECES.length}. Télécharge-les pour réviser sans réseau.</p>
      <button type="button" class="bouton" id="precharger">Télécharger les photos</button>
      <p id="etat-telechargement" class="petit" role="status"></p>
    </section>

    <section class="bloc">
      <h2>Les statuts</h2>
      <dl class="noms">${Object.entries(STATUTS).map(([k, s]) => `<div><dt><span class="pastille s-${k}">${h(s.court)}</span></dt><dd>${h(s.resume)}</dd></div>`).join("")}</dl>
      <ul class="signes petit">${Object.values(GROUPES_ESOD).map((g) => `<li>${h(g)}</li>`).join("")}</ul>
      <p class="petit">Les listes d'espèces chassables et ESOD, les périodes de chasse et les quotas dépendent des arrêtés nationaux et préfectoraux, qui changent régulièrement : vérifie toujours les textes en vigueur dans ton département (fédération départementale des chasseurs, préfecture).</p>
    </section>

    <section class="bloc">
      <h2>Ma progression</h2>
      <p>${stats.sessions.length} quiz terminés.</p>
      <button type="button" class="bouton secondaire" id="reinit">Effacer ma progression</button>
      <p id="confirmation" class="petit" hidden>Touche encore une fois pour confirmer.</p>
    </section>

    <section class="bloc">
      <h2>Sources et crédits photo</h2>
      <p class="petit">Contenu pédagogique rédigé pour la préparation à l'examen du permis de chasser, à compléter avec le manuel officiel de l'OFB. Les dessins d'empreintes sont des schémas simplifiés. Photos sous licence libre provenant de Wikimedia Commons ; chaque auteur est cité ci-dessous.</p>
      <ul class="credits">
        ${ESPECES.map((e) => {
          const liste = toutesPhotos(e.id);
          if (!liste.length) return "";
          return `<li><strong>${h(e.nom)}</strong> : ${liste.map((p) => `${h(p.auteur || "Wikimedia Commons")}${p.licence ? `, ${h(p.licence)}` : ""}${p.source ? ` (<a href="${h(p.source)}" target="_blank" rel="noopener">source</a>)` : ""}`).join(" ; ")}</li>`;
        }).join("")}
      </ul>
    </section>`;

  $("#precharger").onclick = async () => {
    const etatEl = $("#etat-telechargement");
    etatEl.textContent = "Téléchargement…";
    await prechargerPhotos((f, t) => { etatEl.textContent = `${f} / ${t} photos téléchargées`; });
    etatEl.textContent = "Photos disponibles hors connexion.";
  };
  let arme = false;
  $("#reinit").onclick = () => {
    if (!arme) { arme = true; $("#confirmation").hidden = false; return; }
    stats = statsVides();
    sauverStats();
    rendreInfos();
  };
}

function aller(vue) {
  etat.vue = vue;
  rendre();
  window.scrollTo(0, 0);
}

function rendre() {
  const onglet = { accueil: "accueil", quiz: "accueil", score: "accueil", fiches: "fiches", fiche: "fiches", infos: "infos" }[etat.vue];
  document.querySelectorAll(".onglet").forEach((b) => b.setAttribute("aria-current", b.dataset.vue === onglet ? "page" : "false"));
  document.body.dataset.vue = etat.vue;
  ({ accueil: rendreAccueil, quiz: rendreQuiz, score: rendreScore, fiches: rendreFiches, fiche: rendreFiche, infos: rendreInfos })[etat.vue]();
}

// ---------- Démarrage ----------
document.querySelectorAll(".onglet").forEach((b) => b.addEventListener("click", () => aller(b.dataset.vue)));
rendre();
chargerPhotos().then((p) => {
  photos = p;
  if (["fiches", "fiche", "infos"].includes(etat.vue)) rendre();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
