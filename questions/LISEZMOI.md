# Ajouter ou modifier des questions

Chaque fichier `.md` de ce dossier contient des questions de l'épreuve théorique. L'application lit
**tous** les fichiers `.md` du dossier (sauf celui-ci) : pour ajouter des questions, modifiez un fichier
existant ou déposez-en un nouveau, puis poussez-le sur GitHub. Les téléphones le chargent à la
prochaine ouverture de l'app avec du réseau.

## Fichiers de base

| Fichier | Thème |
| --- | --- |
| `faune.md` | Faune et habitats |
| `chasse.md` | Chasse |
| `reglementation.md` | Lois et réglementation |
| `armes.md` | Armes et sécurité |

Un nouveau fichier peut viser un thème existant en ajoutant une ligne `Thème : chasse` (ou `faune`,
`reglementation`, `armes`) près du début. Sans cette ligne, il forme un nouveau thème qui porte le nom
de son titre `# …`.

## Format d'une question

```markdown
## Le texte de la question ?

- [x] La bonne réponse
- [ ] Une mauvaise réponse
- [ ] Une autre mauvaise réponse
- [ ] Encore une mauvaise réponse

> L'explication affichée après la réponse (une ou plusieurs lignes commençant par >).
```

- Chaque question commence par `## ` suivi de la question.
- Exactement **4 réponses**, dont **une seule** cochée `[x]`. L'ordre n'a pas d'importance : l'app mélange
  les réponses. Une question qui ne respecte pas cette règle est ignorée.
- Ajoutez ` [éliminatoire]` à la fin de la question pour une question de sécurité éliminatoire
  (elle peut tomber comme question éliminatoire de l'examen blanc).
- Pour vérifier vos fichiers avant de les pousser : `node tools/verifier-questions.mjs`.
