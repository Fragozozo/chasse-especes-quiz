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

// Questions de connaissances : la première réponse est la bonne (mélangées à l'affichage).
export const SAVOIRS = [
  { q: "Quel cervidé est le seul de France à porter des bois palmés ?", r: ["Le daim", "Le cerf élaphe", "Le chevreuil", "Le cerf sika"], ex: "Les bois du daim s'élargissent en palettes appelées empaumures." },
  { q: "Les bois des cervidés…", r: ["tombent et repoussent chaque année", "poussent toute la vie sans tomber", "sont portés par les deux sexes", "sont faits de kératine comme les cornes"], ex: "Les bois sont des os qui tombent chaque année. Les cornes (chamois, mouflon, bouquetin) sont permanentes et portées par un étui de kératine." },
  { q: "À quelle période le brocard perd-il ses bois ?", r: ["D'octobre à décembre", "De février à avril", "En juillet-août", "Il ne les perd jamais"], ex: "Le chevreuil perd ses bois en fin d'automne et les refait pendant l'hiver ; le cerf les perd de février à avril." },
  { q: "Qu'appelle-t-on l'ovo-implantation différée ?", r: ["Un arrêt du développement de l'embryon pendant plusieurs mois", "Une gestation très courte", "La ponte d'œufs dans le nid d'une autre espèce", "Deux portées dans la même année"], ex: "Chez le chevreuil, le blaireau, la martre, la fouine ou l'hermine, l'embryon reste en sommeil avant de se fixer, ce qui allonge la gestation." },
  { q: "Quand a lieu le rut du chevreuil ?", r: ["De mi-juillet à mi-août", "De mi-septembre à mi-octobre", "En novembre-décembre", "En mars-avril"], ex: "Le rut du chevreuil est estival ; celui du cerf a lieu à l'automne (brame)." },
  { q: "Comment s'appelle le cri du cerf pendant le rut ?", r: ["Le brame", "L'aboi", "Le chevrotement", "La croule"], ex: "Le chevreuil aboie, la bécassine chevrote en vol et la bécasse fait sa croule au printemps." },
  { q: "Quelle est la durée de gestation de la laie ?", r: ["Environ 3 mois, 3 semaines et 3 jours", "Environ 8 mois", "Environ 10 mois", "Environ 6 semaines"], ex: "Soit environ 115 jours." },
  { q: "Comment appelle-t-on le marcassin quand il perd sa livrée rayée ?", r: ["Bête rousse", "Ragot", "Daguet", "Hère"], ex: "Le marcassin rayé devient bête rousse vers 5-6 mois, puis bête noire après 1 an. Le ragot est un mâle de 2 à 3 ans." },
  { q: "Qu'est-ce qu'un daguet ?", r: ["Un jeune cerf qui porte ses premiers bois sans ramification", "Une jeune biche", "Un vieux sanglier solitaire", "Un jeune chamois"], ex: "Dans sa deuxième année, le jeune cerf porte deux tiges simples, les « dagues »." },
  { q: "À quoi reconnaît-on une chevrette d'un brocard en hiver, de dos ?", r: ["À son miroir en forme de cœur avec un pinceau de poils", "À ses bois", "À sa queue plus longue", "À son pelage roux"], ex: "Le miroir du brocard a la forme d'un haricot ; en hiver, il a perdu ses bois ou ils sont en velours." },
  { q: "Laquelle de ces espèces porte des cornes chez les deux sexes ?", r: ["Le chamois", "Le chevreuil", "Le daim", "Le cerf élaphe"], ex: "Chez les cervidés, seuls les mâles portent des bois. Mâle et femelle du chamois et de l'isard portent des crochets." },
  { q: "Où vit l'isard ?", r: ["Dans les Pyrénées", "Dans les Alpes", "Dans les Vosges", "En Corse"], ex: "L'isard est le chamois des Pyrénées. Le chamois vit dans les Alpes, le Jura et les Vosges." },
  { q: "Quelle trace montre toujours deux gardes marquées en arrière des pinces, plus écartées que celles-ci ?", r: ["Le sanglier", "Le chevreuil", "Le cerf", "Le mouflon"], ex: "Chez le cerf, les gardes ne marquent qu'en terrain meuble et restent dans l'axe des pinces." },
  { q: "Comment distinguer l'empreinte d'un renard de celle d'un chien ?", r: ["Celle du renard est ovale : on peut tracer une croix entre les pelotes", "Celle du renard montre cinq doigts", "Celle du renard n'a pas de griffes", "Il n'y a aucune différence"], ex: "L'empreinte du chien est plus ronde et ses doigts plus écartés." },
  { q: "Combien de doigts marque le blaireau ?", r: ["Cinq, avec de longues griffes", "Quatre, sans griffes", "Trois", "Deux sabots"], ex: "Son empreinte large aux cinq doigts alignés ressemble à une petite empreinte d'ours." },
  { q: "Où le lièvre met-il bas ?", r: ["À même le sol, dans un gîte", "Dans un terrier creusé", "Dans un nid perché", "Dans une rabouillère"], ex: "Les levrauts naissent poilus et les yeux ouverts. La lapine met bas dans une rabouillère, petit terrier à part." },
  { q: "Lequel de ces signes distingue le lièvre du lapin de garenne ?", r: ["Ses oreilles plus longues que la tête, à bout noir", "Sa queue blanche", "Son pelage gris", "Ses petites pattes arrière"], ex: "Le lièvre est aussi plus grand, avec de longues pattes arrière et des yeux jaune-orangé." },
  { q: "Quelle maladie a décimé les lapins de garenne à partir de 1952 ?", r: ["La myxomatose", "La rage", "La tularémie", "La gale"], ex: "Depuis la fin des années 1980, la maladie hémorragique virale (VHD) touche aussi les lapins." },
  { q: "Comment différencier la fouine de la martre ?", r: ["La fouine a une bavette blanche divisée en deux, la martre une bavette jaune arrondie", "La fouine est plus grande", "La martre vit dans les greniers", "La fouine a la queue noire au bout"], ex: "La fouine a aussi la truffe claire et vit près des maisons ; la martre est forestière." },
  { q: "À quoi reconnaît-on le vison d'Europe (protégé) du vison d'Amérique (ESOD) ?", r: ["Le vison d'Europe a la lèvre supérieure et la lèvre inférieure blanches", "Le vison d'Europe est roux", "Le vison d'Amérique a un masque facial", "Le vison d'Europe a la queue annelée"], ex: "Le vison d'Amérique n'a du blanc qu'au menton (lèvre inférieure)." },
  { q: "Quelle est la différence entre hermine et belette ?", r: ["L'hermine a toujours le bout de la queue noir", "La belette est plus grande", "La belette devient blanche en hiver", "L'hermine n'a pas de ventre blanc"], ex: "La belette est plus petite et sa queue courte n'a pas de bout noir." },
  { q: "Quelle queue est annelée de noir ?", r: ["Celle du raton laveur", "Celle du chien viverrin", "Celle du blaireau", "Celle du ragondin"], ex: "La genette et le chat forestier (protégés) ont aussi une queue annelée." },
  { q: "Quel rongeur aquatique a des incisives orange et une queue ronde presque nue ?", r: ["Le ragondin", "Le rat musqué", "Le castor", "La loutre"], ex: "Le rat musqué a une queue aplatie sur les côtés ; le castor, une queue large et plate." },
  { q: "Qu'est-ce qu'une espèce ESOD ?", r: ["Une espèce susceptible d'occasionner des dégâts", "Une espèce en danger", "Une espèce de gibier d'eau", "Une espèce soumise au plan de chasse"], ex: "Ce terme a remplacé celui de « nuisible » en 2016." },
  { q: "Quelles espèces forment le groupe 1 des ESOD ?", r: ["Les espèces exotiques envahissantes", "Les corvidés", "Le lapin, le pigeon ramier et le sanglier", "Les mustélidés"], ex: "Ragondin, rat musqué, raton laveur, chien viverrin, vison d'Amérique et bernache du Canada, classés sur tout le territoire." },
  { q: "Parmi quelles espèces le préfet choisit-il le groupe 3 des ESOD ?", r: ["Lapin de garenne, pigeon ramier et sanglier", "Renard, fouine et martre", "Ragondin et rat musqué", "Pie, corneille et geai"], ex: "La liste du groupe 3 est fixée chaque année par arrêté préfectoral." },
  { q: "Quel corvidé, souvent confondu avec la corneille, est protégé ?", r: ["Le choucas des tours", "Le corbeau freux", "La pie bavarde", "Le geai des chênes"], ex: "Le choucas est plus petit, avec la nuque grise et l'œil clair. Le grand corbeau est aussi protégé." },
  { q: "À quoi reconnaît-on un corbeau freux adulte ?", r: ["À la base de son bec nue et blanchâtre", "À sa nuque grise", "À sa queue en losange", "À son bec jaune"], ex: "La corneille noire a la base du bec couverte de plumes. Le jeune freux lui ressemble la première année." },
  { q: "Comment distinguer la bécasse de la bécassine des marais ?", r: ["La bécasse a des barres en travers sur la tête, la bécassine des raies dans la longueur", "La bécassine est plus grande", "La bécasse vit dans les marais", "La bécassine a un bec courbé"], ex: "La bécasse vit dans les bois, la bécassine dans les marais." },
  { q: "Qu'appelle-t-on la « croule » de la bécasse ?", r: ["Son vol de parade au crépuscule au printemps", "Sa migration d'automne", "Son nid", "Son cri d'alarme"], ex: "Le mâle survole les bois à la tombée du jour en poussant des cris." },
  { q: "Quel est le seul canard de surface au miroir blanc ?", r: ["Le canard chipeau", "Le canard colvert", "La sarcelle d'hiver", "Le canard pilet"], ex: "Le miroir du colvert est bleu-violet, celui de la sarcelle d'hiver vert." },
  { q: "Comment s'envole un canard plongeur ?", r: ["Il court sur l'eau avant de décoller", "Il décolle à la verticale", "Il plonge puis s'envole", "Il ne vole pas"], ex: "Les canards de surface (colvert, sarcelles) s'envolent à la verticale." },
  { q: "Quel oiseau protégé à tête verte peut être confondu avec un colvert mâle ?", r: ["Le tadorne de Belon", "Le canard souchet", "La sarcelle d'hiver", "Le fuligule milouin"], ex: "Le tadorne a le corps blanc, une bande rousse sur la poitrine et un bec rouge." },
  { q: "Quel grand oiseau protégé vole en V comme les oies, mais le cou et les pattes tendus ?", r: ["La grue cendrée", "Le héron cendré", "Le cygne tuberculé", "Le grand cormoran"], ex: "Le héron vole le cou replié en S." },
  { q: "Quel trait distingue la perdrix rouge de la bartavelle ?", r: ["Le collier noir de la perdrix rouge se défait en mouchetures sur la poitrine", "La bartavelle a le bec noir", "La perdrix rouge a les pattes grises", "La bartavelle n'a pas de collier"], ex: "La bartavelle a un collier noir net et vit en montagne." },
  { q: "Chez la perdrix grise, comment reconnaît-on la poule ?", r: ["Aux barres claires en travers des plumes d'épaule (croix de Lorraine)", "À son fer à cheval plus marqué", "À sa queue noire", "À ses pattes rouges"], ex: "Le coq a un fer à cheval brun-roux bien marqué sur le ventre." },
  { q: "Quel galliforme est migrateur ?", r: ["La caille des blés", "La perdrix grise", "Le faisan de Colchide", "Le tétras lyre"], ex: "La caille passe l'hiver en Afrique." },
  { q: "Quelles espèces de la liste des chassables font l'objet d'un moratoire (chasse suspendue) ?", r: ["Tourterelle des bois, courlis cendré, barge à queue noire", "Pigeon ramier, alouette, grive", "Colvert, sarcelle, foulque", "Bécasse, bécassine, vanneau"], ex: "Ces espèces sont en déclin : leur chasse est suspendue même si elles restent sur la liste." },
  { q: "Les rapaces…", r: ["sont tous protégés", "sont chassables en hiver", "sont classés ESOD", "peuvent être tirés s'ils attaquent le gibier"], ex: "Aucun rapace, diurne ou nocturne, ne peut être chassé ou détruit." },
  { q: "Quel oiseau protégé ressemble à un épervier en vol ?", r: ["Le coucou gris", "La grive draine", "Le pigeon colombin", "La tourterelle turque"], ex: "Gris dessus et barré dessous, le coucou a la même silhouette fine et la longue queue." },
  { q: "À quoi reconnaît-on un pigeon ramier en vol ?", r: ["À la barre blanche en travers de chaque aile", "À son croupion blanc", "À sa petite taille", "À sa queue noire"], ex: "Le biset a le croupion blanc ; le colombin n'a pas de blanc." },
  { q: "Quelle grive a le dessous des ailes roux et un sourcil blanc marqué ?", r: ["La grive mauvis", "La grive draine", "La grive musicienne", "La grive litorne"], ex: "La musicienne a le dessous des ailes ocre ; la draine et la litorne l'ont blanc." },
  { q: "Que signifie un animal « nidifuge » ?", r: ["Ses petits quittent le nid dès la naissance", "Il ne construit pas de nid", "Il pond dans le nid des autres", "Il fuit son nid en cas de danger"], ex: "Poussins de perdrix, canetons et levrauts sont nidifuges ; lapereaux et oisillons de passereaux sont nidicoles." },
  { q: "Quelle espèce dépose des crottes torsadées bien en vue sur une pierre ou une souche ?", r: ["Le renard", "Le blaireau", "Le lièvre", "Le chevreuil"], ex: "Le blaireau dépose ses crottes dans de petits trous (latrines)." },
  { q: "Comment s'appelle le terrier du blaireau ?", r: ["Une blaireautière", "Une garenne", "Une catiche", "Une rabouillère"], ex: "La catiche est le gîte de la loutre ; la garenne, l'ensemble des terriers de lapins." },
  { q: "Quel animal laisse des arbres rongés en forme de crayon au bord des rivières ?", r: ["Le castor", "Le ragondin", "Le rat musqué", "La loutre"], ex: "Le castor d'Europe est protégé." },
  { q: "Laquelle de ces espèces est protégée ?", r: ["Le chat forestier", "Le putois", "Le raton laveur", "La fouine"], ex: "Ne jamais tirer un chat en forêt : le chat forestier ressemble à un chat tigré." },
  { q: "Quel grand mammifère est protégé en France ?", r: ["Le bouquetin des Alpes", "Le mouflon", "Le chamois", "Le cerf sika"], ex: "Le bouquetin a été sauvé de l'extinction et réintroduit." },
];
