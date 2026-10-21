# Faune et chasse : quiz du permis

Application web installable (PWA) pour réviser la reconnaissance des espèces animales en vue de l'examen
du permis de chasser : gibier, espèces susceptibles d'occasionner des dégâts (ESOD) et espèces protégées.
Fonctionne sur iPhone, hors connexion après la première visite.

En ligne : https://fragozozo.github.io/chasse-especes-quiz/

## Contenu
- 127 espèces : grand gibier, carnivores, lièvres, lapins et rongeurs, gibier de plaine et de montagne,
  migrateurs terrestres, corvidés, canards et oies, limicoles et oiseaux d'eau, rapaces.
- Pour chaque espèce, une fiche : statut (chassable, ESOD, chasse suspendue, protégée), taille et poids,
  identification, mâle / femelle / jeune et leur nom, habitat, alimentation, reproduction, particularités,
  empreinte (photo pour 32 espèces, schéma simplifié sinon), risques de confusion.
- 3 à 5 photos par espèce, en distinguant mâle, femelle et jeune quand c'est utile.
- Entraînements, sur toutes les espèces ou par thème (groupe, ESOD, espèces protégées) : reconnaître
  l'espèce, tirer ou ne pas tirer (statut), mâle / femelle / jeune, empreintes, reproduction et vocabulaire,
  questions de connaissances, examen blanc de 20 questions, révision des erreurs.

## Photos
Photos sous licence libre issues de Wikimedia Commons, choisies à la main, avec auteur et licence
affichés dans l'app (onglet Infos et sous chaque photo).

1. `node tools/candidats-photos.mjs <dossier>` cherche des candidates pour chaque espèce et télécharge
   des vignettes (`--ajout <id> "<recherche>"` pour en ajouter, par exemple des jeunes).
2. `python3 tools/planche.py <dossier> planche.jpg <id> …` fabrique une planche contact pour les comparer.
3. Noter les photos gardées dans `tools/selection.json` (numéro + `m` mâle, `f` femelle, `j` jeune).
4. `python3 tools/installer-photos.py <dossier>` les installe dans `photos/` et écrit `photos/credits.json`.

Photos d'empreintes : même démarche avec `--traces` (`node tools/candidats-photos.mjs <autre dossier> --traces`,
choix dans `tools/selection-traces.json`, puis `python3 tools/installer-photos.py <autre dossier> --traces`,
qui remplit `photos/traces/` et `photos/traces.json`). Sans photo, l'app montre le schéma de `js/traces.js`.

## Lancer en local
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000.

## Installer sur iPhone
Ouvrir l'adresse dans Safari, bouton Partager, puis « Sur l'écran d'accueil ».

## Structure
- `index.html`, `css/app.css`, `js/app.js` : interface et quiz
- `js/mammiferes.js`, `js/oiseaux.js` : fiches des espèces ; `js/especes.js` : groupes, statuts, questions
- `js/traces.js` : dessins des empreintes
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et mode hors ligne (`tools/icone.py` dessine l'icône)
- `photos/` : photos et crédits

## Avertissement
Les listes d'espèces chassables et ESOD, les périodes et les quotas dépendent d'arrêtés nationaux et
préfectoraux qui changent : vérifier les textes en vigueur dans son département. À compléter avec le
manuel officiel de l'OFB.
