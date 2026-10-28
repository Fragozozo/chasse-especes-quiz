# Faune et chasse — PWA (HTML/JS sans framework)

Application d'entraînement à la reconnaissance des espèces pour l'examen du permis de chasser :
fiches détaillées et quiz. Projet frère de `~/Developer/chasse-quiz-app` (chiens de chasse, repo
`Fragozozo/chasse-quiz`), dont il reprend la structure et le style. Interface et commentaires en français.

## Règles du projet

- Écrire une même chose toujours de la même façon : les quiz comparent les chaînes (noms des jeunes, périodes…).
- `noms` (mâle, femelle, jeune) : mettre un vrai mot du vocabulaire (« Brocard », « Laie ») ; sinon « Mâle »,
  « Femelle », « Jeune » ou « X (mâle) », que les quiz de vocabulaire ignorent.
- Statuts : `chassable`, `esod` (+ `esod: 1|2|3`), `suspendue` (moratoire), `protegee`. Les textes
  réglementaires changent : vérifier sur des sources officielles avant de modifier un statut.
- Photos : uniquement Wikimedia Commons sous licence libre, vérifiées à l'œil (espèce exacte, animal sauvage,
  pas d'animal de zoo évident, rôle mâle / femelle / jeune sûr, sinon pas de rôle). Crédits obligatoires.
- Questions de l'épreuve théorique : fichiers `questions/*.md` (format dans `questions/LISEZMOI.md`), que
  l'utilisateur édite lui-même. L'app liste le dossier via l'API GitHub (repli : dernière liste connue, puis
  les 4 fichiers de base). Lancer `node tools/verifier-questions.mjs` après toute modification. Questions
  rédigées pour l'app : ne jamais recopier l'ouvrage officiel de la FNC (protégé par le droit d'auteur).
- Chaque changement de fichier servi : monter la version (`?v=` dans index.html, app.js, sw.js et `VERSION`
  du service worker) pour que les iPhone récupèrent la nouvelle version.
- Le projet utilise git avec le remote GitHub `Fragozozo/chasse-especes-quiz` (GitHub Pages sur `main`) :
  un commit par évolution, message en français.

## Commandes

    python3 -m http.server 8000                       # aperçu local
    node tools/candidats-photos.mjs <dossier>         # photos candidates (voir README)
    python3 tools/installer-photos.py <dossier>       # installe tools/selection.json dans photos/
    python3 tools/icone.py                            # régénère les icônes

`gh` est installé et connecté au compte `Fragozozo`.
