// Données du quiz : groupes d'espèces, statuts, fiches et questions de connaissances.
import { MAMMIFERES } from "./mammiferes.js";
import { OISEAUX } from "./oiseaux.js";

export const GROUPES = {
  grand: { nom: "Grand gibier", classe: "mammifere", resume: "Ongulés sauvages : sanglier, cervidés et bovidés de montagne. Le grand gibier est soumis au plan de chasse (sauf le sanglier dans certains départements)." },
  carnivores: { nom: "Carnivores", classe: "mammifere", resume: "Renard, blaireau, mustélidés (martre, fouine, putois, hermine, belette) et espèces introduites, ainsi que les grands prédateurs protégés." },
  petits: { nom: "Lièvres, lapins et rongeurs", classe: "mammifere", resume: "Lagomorphes (lapin, lièvres) et rongeurs, dont plusieurs espèces exotiques envahissantes." },
  plaine: { nom: "Gibier de plaine et de montagne", classe: "oiseau", resume: "Galliformes : faisans, perdrix, caille, et tétraonidés de montagne." },
  migrateurs: { nom: "Migrateurs terrestres", classe: "oiseau", resume: "Bécasse, pigeons, tourterelles, grives, merles et alouette." },
  corvides: { nom: "Corvidés et étourneau", classe: "oiseau", resume: "Corneille, corbeau freux, pie, geai et étourneau, souvent classés ESOD, et leurs cousins protégés." },
  canards: { nom: "Canards, oies et cygnes", classe: "oiseau", resume: "Anatidés : canards de surface, canards plongeurs, canards marins, oies et cygnes." },
  eau: { nom: "Limicoles et oiseaux d'eau", classe: "oiseau", resume: "Bécassines, chevaliers, courlis, pluviers, rallidés, et les grands échassiers protégés." },
  rapaces: { nom: "Rapaces", classe: "oiseau", resume: "Tous les rapaces, de jour comme de nuit, sont protégés en France." },
};

export const STATUTS = {
  chassable: { nom: "Gibier chassable", court: "Chassable", resume: "Espèce inscrite sur la liste nationale des espèces chassables, tirable pendant la période d'ouverture." },
  esod: { nom: "Chassable et ESOD", court: "ESOD", resume: "Espèce chassable, également classée « susceptible d'occasionner des dégâts » : elle peut aussi être piégée ou détruite hors période de chasse, selon les règles du département." },
  suspendue: { nom: "Chasse suspendue", court: "Suspendue", resume: "Espèce de la liste des chassables dont la chasse est suspendue (moratoire) ou interdite presque partout." },
  protegee: { nom: "Espèce protégée", court: "Protégée", resume: "Espèce protégée : la chasser, la capturer ou la détruire est interdit." },
};

// Les trois groupes d'ESOD.
export const GROUPES_ESOD = {
  1: "Groupe 1 : espèces exotiques envahissantes, classées sur tout le territoire (ragondin, rat musqué, raton laveur, chien viverrin, vison d'Amérique, bernache du Canada).",
  2: "Groupe 2 : liste fixée tous les 3 ans par arrêté ministériel, département par département (renard, fouine, martre, belette, corbeau freux, corneille noire, pie bavarde, geai des chênes, étourneau sansonnet).",
  3: "Groupe 3 : liste fixée chaque année par arrêté préfectoral, choisie parmi le lapin de garenne, le pigeon ramier et le sanglier.",
};

export const ESPECES = [...MAMMIFERES, ...OISEAUX];
