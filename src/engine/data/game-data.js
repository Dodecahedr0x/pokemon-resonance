/* ===================== DATA ===================== */
export const TYPES = {
  Normal: ['#A8A77A', 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17Zm0 4.5a4 4 0 1 1 0 8a4 4 0 1 1 0-8Z'],
  Feu: [
    '#EE8130',
    'M12.5 2c.8 3.6 5.5 6 5.5 11.2A6 6 0 0 1 6 13.4c0-2.3 1.2-4 2.4-5.1.1 2.1 1 3.2 2.1 3.4-.3-3.4.2-6.7 2-9.7Z',
  ],
  Eau: ['#6390F0', 'M12 2.5c-3.2 5-6.5 8.4-6.5 12a6.5 6.5 0 0 0 13 0c0-3.6-3.3-7-6.5-12Z'],
  Plante: ['#7AC74C', 'M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z'],
  Électrik: ['#F7D02C', 'M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-5.5Z'],
  Glace: ['#96D9D6', 'M12 2 18.5 12 12 22 5.5 12Z'],
  Combat: ['#C22E28', 'M6 7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V14a6 6 0 0 1-6 6 6 6 0 0 1-6-6Z'],
  Poison: [
    '#A33EA1',
    'M9 5.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9Zm7.5 7a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7ZM16.5 3a2.2 2.2 0 1 1 0 4.4a2.2 2.2 0 1 1 0-4.4Z',
  ],
  Sol: ['#E2BF65', 'M2 20 9 7l4 7.2L16 10l6 10Z'],
  Vol: [
    '#A98FF3',
    'M3 15c6.5-.8 10.5-5 12.5-11 1.3 5.2.3 9.2-2.7 12.3 3 .3 6.2-.8 9.2-2.8-2.2 4.5-7.2 7.5-12.5 7.5-3.2 0-5.4-2-6.5-6Z',
  ],
  Psy: [
    '#F95587',
    'M2 12c3-5 7-7.5 10-7.5s7 2.5 10 7.5c-3 5-7 7.5-10 7.5S5 17 2 12Zm10-3.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7Z',
  ],
  Insecte: ['#A6B91A', 'M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2Z'],
  Roche: ['#B6A136', 'M7.5 3.5h8.5l5 7.5-4.5 9.5h-9l-5-8.5Z'],
  Spectre: ['#735797', 'M5 21V11a7 7 0 0 1 14 0v10l-2.4-2-2.3 2-2.3-2-2.3 2-2.3-2Z'],
  Dragon: ['#6F35FC', 'M3 4l9 6 9-6-4 16-5-6-5 6Z'],
  Ténèbres: ['#705746', 'M15.5 3a9 9 0 1 0 5.8 15.2A7.8 7.8 0 0 1 15.5 3Z'],
  Acier: ['#B7B7CE', 'M7 3h10l5 9-5 9H7l-5-9Zm5 5a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z'],
  Fée: ['#D685AD', 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z'],
};

export const MARKS = [
  { id: 'trempe', n: 'Trempé', t: 'Eau' },
  { id: 'charge', n: 'Chargé', t: 'Électrik' },
  { id: 'brulant', n: 'Brûlant', t: 'Feu' },
  { id: 'enracine', n: 'Enraciné', t: 'Plante' },
  { id: 'givre', n: 'Givré', t: 'Glace' },
  { id: 'fissure', n: 'Fissuré', t: 'Sol' },
];

export const ELEMENT_TYPES = ['Eau', 'Électrik', 'Feu', 'Plante', 'Glace', 'Sol'];

export const MARK_REACTIONS = {
  trempe: ['ren', 'cc', 'vap', 'flo', 'gel', 'bou'],
  charge: ['cc', 'ren', 'sur', 0, 0, 'ter'],
  brulant: ['vap', 'sur', 'ren', 'emb', 'fon', 'cou'],
  enracine: ['flo', 0, 'emb', 'ren', 'bri', 'anc'],
  givre: ['ban', 0, 'fon', 0, 'ren', 'bri'],
  fissure: ['bou', 'ter', 'cou', 'anc', 0, 'sei'],
};

export const MOVE_CATEGORY_NAMES = { deg: 'Dégâts', ctl: 'Contrôle', ter: 'Terrain', sou: 'Soutien' };

export const REACTIONS = {
  cc: {
    n: 'Court-circuit',
    a: 'Circ',
    k: 'ctl',
    d: 'La décharge parcourt toutes les cases Trempées reliées. Chaque unité touchée est Paralysée 1 tour, alliés compris.',
    tip: 'Sortez vos Pokémon de l’eau avant de frapper : l’aperçu de résolution surligne les alliés touchés.',
    ex: ['magicarpe', 'pikachu'],
  },
  vap: {
    n: 'Vapeur',
    a: 'Vap',
    k: 'ter',
    d: 'Un brouillard couvre la case et ses voisines pendant 2 tours et bloque les lignes de vue. La marque disparaît.',
    tip: 'Couvrez l’avance d’un Pokémon fragile. Nosferapti voit au travers.',
    ex: ['carapuce', 'salameche'],
  },
  flo: {
    n: 'Floraison',
    a: 'Flor',
    k: 'sou',
    d: 'Soigne 20 % des PV des alliés adjacents. La case devient Enracinée.',
    tip: 'Le seul soin de zone du jeu : il se prépare à deux.',
    ex: ['carapuce', 'bulbizarre'],
  },
  gel: {
    n: 'Gel',
    a: 'Gel',
    k: 'ctl',
    d: 'La cible est Immobilisée 1 tour. La case devient glissante : on y glisse jusqu’au prochain obstacle.',
    tip: 'Gelez un ennemi au bord d’une Coulée, puis poussez-le.',
    ex: ['magicarpe', 'lokhlass'],
  },
  bou: {
    n: 'Boue',
    a: 'Boue',
    k: 'ctl',
    d: 'La case devient boueuse pendant 3 tours : −2 Mouvement à quiconque la traverse.',
    tip: 'Fermez un couloir sans y immobiliser un Pokémon.',
    ex: ['phanpy', 'carapuce'],
  },
  sur: {
    n: 'Surtension',
    a: 'Surt',
    k: 'deg',
    d: 'Explosion : dégâts ×1,3 sur la cible et sur les six cases voisines.',
    tip: 'Moiteur de Ramoloss l’empêche à 2 cases, y compris pour vous.',
    ex: ['pikachu', 'salameche'],
  },
  ter: {
    n: 'Mise à la terre',
    a: 'Terre',
    k: 'sou',
    d: 'La charge se dissipe dans le sol. Le lanceur gagne +2 Garde pendant 2 tours.',
    tip: 'Désamorcez un ennemi Chargé avant qu’il ne relaie une chaîne.',
    ex: ['pikachu', 'phanpy'],
  },
  emb: {
    n: 'Embrasement',
    a: 'Embr',
    k: 'deg',
    d: 'Le feu se propage à toutes les cases Enracinées reliées et les rend Brûlantes.',
    tip: 'Vos propres racines brûlent aussi : placez Bulbizarre en retrait.',
    ex: ['bulbizarre', 'salameche'],
  },
  fon: {
    n: 'Fonte',
    a: 'Fonte',
    k: 'deg',
    d: 'Choc thermique : dégâts ×1,5. La glace fond et la case devient Trempée.',
    tip: 'Elle relance la chaîne : une Fonte prépare un Court-circuit.',
    ex: ['lokhlass', 'salameche'],
  },
  cou: {
    n: 'Coulée',
    a: 'Lave',
    k: 'ter',
    d: 'La case devient lave pendant 2 tours : dégâts à qui la traverse ou y termine son tour.',
    tip: 'Combinez-la avec le Choc Mental de Ramoloss pour pousser un ennemi dedans.',
    ex: ['salameche', 'phanpy'],
  },
  bri: {
    n: 'Bris',
    a: 'Bris',
    k: 'deg',
    d: 'Dégâts ×2 sur une cible Givrée ou Enracinée. La marque est consommée.',
    tip: 'La conclusion naturelle d’un Gel ou d’une Banquise.',
    ex: ['lokhlass', 'debugant'],
  },
  anc: {
    n: 'Ancrage',
    a: 'Ancr',
    k: 'ctl',
    d: 'La cible ne peut plus être déplacée. Sur un allié : +2 Garde. Sur un ennemi : Mouvement réduit à 1.',
    tip: 'Ancrez votre Rempart avant un Choc Mental adverse.',
    ex: ['phanpy', 'bulbizarre'],
  },
  ban: {
    n: 'Banquise',
    a: 'Banq',
    k: 'ter',
    d: 'Le gel s’étend à toutes les cases Trempées reliées. Les unités dessus sont Immobilisées.',
    tip: 'Un Court-circuit glacé : même réseau d’eau, autre effet.',
    ex: ['lokhlass', 'carapuce'],
  },
  sei: {
    n: 'Onde sismique',
    a: 'Séis',
    k: 'ter',
    d: 'Chaque case voisine de la cible devient Fissurée.',
    tip: 'Prépare Boue, Coulée et Ancrage sur toute une zone.',
    ex: ['phanpy', 'debugant'],
  },
  ren: {
    n: 'Renfort',
    a: '+',
    k: 'ren',
    d: 'Même élément : la marque passe au niveau 2. Elle dure un tour de plus et la prochaine réaction inflige ×1,25.',
    tip: 'Utile pour garder une marque en place pendant que le Frappeur se positionne.',
    ex: null,
  },
};

export const ROLES = [
  { n: 'Frappeur', d: 'Consomme les marques et déclenche les réactions.' },
  { n: 'Déclencheur', d: 'Pose les marques à faible coût, souvent à distance.' },
  { n: 'Verrou', d: 'Ralentit, immobilise, détourne les attaques.' },
  { n: 'Rempart', d: 'Tient les cases clés et encaisse.' },
  { n: 'Éclaireur', d: 'Révèle, joue vite, ouvre la carte.' },
  { n: 'Relais', d: 'Copie, transfère, échange les positions.' },
];

export const CHAINS = [
  { n: 'Fonte → Court-circuit', need: ['fon', 'cc'] },
  { n: 'Banquise → Bris', need: ['ban', 'bri'] },
  { n: 'Gel → Bris', need: ['gel', 'bri'] },
  { n: 'Onde sismique → Boue', need: ['sei', 'bou'] },
  { n: 'Floraison → Embrasement', need: ['flo', 'emb'] },
  { n: 'Vapeur + Écholocation', need: ['vap'], mon: 'nosferapti' },
];

export const FAMS = [
  { e: 'Eau', from: ['Eau'], m: 'Trempé' },
  { e: 'Électrik', from: ['Électrik'], m: 'Chargé' },
  { e: 'Feu', from: ['Feu'], m: 'Brûlant' },
  { e: 'Plante', from: ['Plante', 'Insecte'], m: 'Enraciné' },
  { e: 'Glace', from: ['Glace'], m: 'Givré' },
  { e: 'Sol', from: ['Sol', 'Roche', 'Combat'], m: 'Fissuré' },
];

export const POSITIONAL_EFFECTS = [
  { t: 'Normal', n: 'Couverture', d: 'Prend un coup à la place d’un allié adjacent.' },
  { t: 'Vol', n: 'Courant', d: 'Pousse la cible d’une case dans l’axe de l’attaque.' },
  { t: 'Psy', n: 'Déplacement', d: 'Échange deux unités à portée.' },
  { t: 'Spectre', n: 'Traversée', d: 'Ignore unités et obstacles sur sa trajectoire.' },
  { t: 'Ténèbres', n: 'Embuscade', d: '+50 % si la cible n’a pas vu l’attaquant ce tour.' },
  { t: 'Poison', n: 'Contamination', d: 'Toxique sur la durée, se répand dans toute l’eau reliée.' },
  { t: 'Fée', n: 'Charme', d: 'La cible doit viser le Pokémon Fée à son prochain tour.' },
  { t: 'Acier', n: 'Aimant', d: 'Attire de 2 cases une unité Chargée.' },
  { t: 'Dragon', n: 'Fureur', d: 'Ignore les marques : ne déclenche ni ne subit de réaction.' },
];

export const GYMS = [
  {
    t: 'Roche',
    n: 'Arène Roche',
    r: 'Tout le plateau commence Fissuré.',
    l: 'Remparts et Ancrage.',
    s: ['S-02', 'S-03'],
  },
  {
    t: 'Eau',
    n: 'Arène Eau',
    r: 'La marée monte d’une rangée tous les 2 tours.',
    l: 'Court-circuit et tempo.',
    s: ['S-03', 'S-04'],
  },
  {
    t: 'Électrik',
    n: 'Arène Électrik',
    r: 'Cases conductrices : une Charge avance d’une case par tour.',
    l: 'Placement et tirs amis.',
    s: ['S-03', 'S-06'],
  },
  {
    t: 'Plante',
    n: 'Arène Plante',
    r: 'Des racines vivantes se déplacent et ferment les couloirs.',
    l: 'Embrasement et Floraison.',
    s: ['S-03', 'S-02'],
  },
  {
    t: 'Poison',
    n: 'Arène Poison',
    r: 'Brume toxique : le camp adverse se révèle colonne par colonne.',
    l: 'Éclaireurs et information.',
    s: ['S-06', 'S-02'],
  },
  {
    t: 'Psy',
    n: 'Arène Psy',
    r: 'Écran Psy : une manche sur deux, les adversaires gagnent +2 Garde.',
    l: 'Statuts, dégâts fixes et tempo.',
    s: ['S-05', 'S-06'],
  },
  {
    t: 'Feu',
    n: 'Arène Feu',
    r: 'Des Coulées de lave apparaissent toutes les 3 manches.',
    l: 'Fonte, Vapeur et contrôle de zone.',
    s: ['S-03', 'S-04'],
  },
  {
    t: 'Sol',
    n: 'Arène Sol',
    r: 'Un séisme déforme le plateau à chaque manche.',
    l: 'Mouvement et Relais.',
    s: ['S-02', 'S-04'],
  },
];

export const WEATHER = [
  { n: 'Pluie', mv: 'Danse Pluie', t: 'Eau', d: 'Trempé dure un tour de plus. Brûlant ne tient qu’un tour.' },
  { n: 'Soleil', mv: 'Zénith', t: 'Feu', d: 'Brûlant dure un tour de plus. Trempé s’évapore en fin de tour.' },
  { n: 'Grêle', mv: 'Grêle', t: 'Glace', d: 'Givré dure un tour de plus. Banquise s’étend d’une case supplémentaire.' },
  {
    n: 'Sable',
    mv: 'Tempête de Sable',
    t: 'Sol',
    d: 'Fissuré dure un tour de plus. 1 dégât par manche aux types autres que Roche, Sol et Acier.',
  },
];

export const EFFECTIVENESS_EXAMPLES = [
  ['Eau', 'Feu', '×2'],
  ['Feu', 'Eau', '×½'],
  ['Électrik', 'Sol', '×0'],
];

export const BSHAPE = [
  'M32 4 56 18v28L32 60 8 46V18Z',
  'M32 4c14 16 22 27 22 37a22 22 0 0 1-44 0c0-10 8-21 22-37Z',
  'M32 3 61 32 32 61 3 32Z',
  'M32 4c13 6 22 15 22 28S45 54 32 60C19 54 10 45 10 32S19 10 32 4Z',
  'M21 5h22l16 16v22L43 59H21L5 43V21Z',
  'M32 4 56 12v18c0 16-10 25-24 30C18 55 8 46 8 30V12Z',
  'M32 4 37 25 58 22 41 35 52 56 32 44 12 56 23 35 6 22 27 25Z',
  'M32 5 59 54H5Z',
];

export const dexNo = n => '#' + String(n).padStart(4, '0');

// Statements run at startup, in the original order (see index.js).
export function init() {
  REACTIONS.cc.tip =
    'Sortez vos Pokémon de l’eau avant de frapper. Les Pokémon Sol y sont insensibles, comme dans la table des types.';
}
