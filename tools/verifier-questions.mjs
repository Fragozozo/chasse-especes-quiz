// Vérifie les fichiers du dossier questions/ avec le même analyseur que l'app.
// Usage : node tools/verifier-questions.mjs
import { readdir, readFile, access } from "node:fs/promises";
import { analyser } from "../js/questions.js";

const dossier = new URL("../questions/", import.meta.url);
let total = 0, nbErreurs = 0;
const vues = new Map();
for (const f of (await readdir(dossier)).filter((n) => /\.md$/i.test(n) && !/^(lisezmoi|readme)\.md$/i.test(n)).sort()) {
  const a = analyser(await readFile(new URL(f, dossier), "utf8"), f);
  total += a.questions.length;
  console.log(`${f} : ${a.questions.length} questions (thème « ${a.nom} »), dont ${a.questions.filter((q) => q.e).length} éliminatoires`);
  for (const e of a.erreurs) { console.log("  ✗ " + e); nbErreurs++; }
  for (const q of a.questions) {
    if (q.image && !/^https?:/.test(q.image.src)) {
      const ok = await access(new URL("../" + q.image.src, import.meta.url)).then(() => true, () => false);
      if (!ok) { console.log(`  ✗ image introuvable : ${q.image.src} (« ${q.q} »)`); nbErreurs++; }
    }
    if (vues.has(q.q)) { console.log(`  ⚠ question en double avec ${vues.get(q.q)} : « ${q.q} »`); nbErreurs++; }
    vues.set(q.q, f);
  }
}
console.log(`\n${total} questions valides, ${nbErreurs} problème(s).`);
process.exitCode = nbErreurs ? 1 : 0;
