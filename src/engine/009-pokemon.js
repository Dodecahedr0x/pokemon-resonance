/* Original section: 03-pokemon.js */

import { PKA } from './003-images.js';

export let MON, BY, FAMS30, PKT;


export function familyOf(id) {
  const b = BY[id].base;
  const f = MON.filter(m => m.base === b);
  return f.length ? f : [BY[b] || BY[id]]; // a legend is its own family (v4.29)
}

/* =====================================================================
   v4.12 · rebalancing (test bot: 5,600 battles, 30 families)
   Without announced intents, Pokémon fragile in melee suffered
   and a few 1-CP families were too profitable. Light tweaks:
   each family keeps its role, the "weak" ones remain useful.
   ===================================================================== */
const BALANCING = {
  salameche: { s: [2, 3, 2, 4, 3, 2] }, // Fire starter: a bit less fragile (and 1 CP, see BASECOST)
  hericendre: { s: [2, 3, 1, 4, 4, 2] }, // Johto Fire starter: +1 Power
  aligatueur: { s: [5, 5, 3, 3, 3, 2] }, // too sturdy for a 1-CP family: −1 Guard
  onix: { s: [3, 2, 5, 3, 3, 1] }, // true to the games: low HP, high Guard
  nosferapti: { s: [3, 2, 1, 5, 4, 2] }, // lasted too little for a Lock
  nostenfer: { s: [4, 5, 3, 5, 5, 3] },
  roucool: { s: [3, 2, 1, 4, 4, 2] },
  roucarnage: { s: [4, 4, 3, 5, 5, 3] },
  chenipan: { s: [3, 2, 2, 2, 2, 2] },
  melo: { s: [3, 1, 2, 2, 2, 2] },
  kadabra: { s: [3, 4, 1, 5, 3, 4] },
  insecateur: { s: [3, 5, 2, 5, 4, 1] }, // Melee Striker: +1 Power
  ronflex: { s: [5, 4, 4, 1, 2, 1] }, // never caught up with anyone: +1 Movement
  nosferalto: { s: [3, 4, 2, 5, 5, 2] },
  papilusion: { s: [3, 4, 2, 4, 4, 3] }, // still has no control (lesson of the Anatomy of an Awakening), but hits harder
  draco: { s: [4, 4, 3, 3, 3, 3] },
  wattouat: { mv: ['cageeclair', 'eclair'] }, // Thunder Shock instead of Tackle: it places and strikes from a distance
  crocrodil: { s: [4, 3, 2, 3, 3, 2] } // the Kaiminus family was still the most profitable at 1 CP
};

/* v4.13 · technical kits: own ability for each stage, sharp role, signature at the final form */
const KITS413 = {
  herbizarre: { ability: 'ecranpoudre' },
  florizarre: { mv: ['lancesoleil', 'synthese', 'vegeattak'] },
  reptincel: { ability: 'cran', r: 'Verrou', r2: 'Frappeur' },
  dracaufeu: { mv: ['lanceflammes', 'criailes', 'rafalefeu'], ability: 'forcesoleil' },
  carabaffe: { ability: 'coque', r: 'Frappeur', r2: 'Rempart' },
  tortank: { mv: ['hydrocanon', 'abri', 'hydroblast'], ability: 'cuvette' },
  papilusion: { mv: ['rayonsignal', 'volvie', 'ventargente'] },
  pikachu: { ability: 'paratonnerre' },
  raichu: { mv: ['tonnerre', 'viveatt', 'electacle'], ability: 'surfcaudal' },
  melo: { ability: 'gardeami' },
  melodelfe: { mv: ['pouvoirlunaire', 'voeu', 'gravite'], ability: 'inconscient' },
  nosferalto: { ability: 'regardvif' },
  nostenfer: { mv: ['ondefolie', 'criailes', 'poisoncroix'] },
  ptitard: { ability: 'glissade' },
  tartard: { mv: ['sacrifice', 'hydroqueue', 'poingdynamique'], ability: 'poingdefer' },
  tarpaud: { mv: ['dansepluie', 'vibraqua', 'requiem'] },
  abra: { ability: 'synchro' },
  alakazam: { mv: ['psyko', 'chocmental', 'vaguepsy'], ability: 'gardemagik' },
  magneton: { mv: ['tonnerre', 'aimant', 'elecanon'], ability: 'fermete' },
  spectrum: { r: 'Éclaireur', r2: 'Verrou' },
  ectoplasma: { mv: ['ballombre', 'hypnose', 'malediction'], ability: 'corpsmaudit' },
  steelix: { mv: ['queuedefer', 'seisme', 'gyroballe'], r: 'Frappeur', r2: 'Rempart' },
  cizayox: { mv: ['griffeacier', 'danselames', 'pistopoing'], ability: 'technicien', r2: 'Éclaireur' },
  leviator: { mv: ['hydrocanon', 'ouragan', 'dracoqueue'] },
  lokhlass: { mv: ['blizzard', 'grele', 'laserglace'] },
  aquali: { mv: ['surf', 'acidarmure', 'anneauhydro'] },
  voltali: { mv: ['tonnerre', 'cageeclair', 'changeeclair'] },
  pyroli: { mv: ['lanceflammes', 'danseflamme', 'feufollet'] },
  mentali: { mv: ['psyko', 'aurore', 'runeprotect'] },
  noctali: { mv: ['feinte', 'regardnoir', 'clairdelune'] },
  ronflex: { mv: ['plaquage', 'repos', 'cognobidon'] },
  draco: { ability: 'cran' },
  dracolosse: { mv: ['ultralaser', 'criailes', 'dansedraco'] },
  macronium: { ability: 'gardeami', r: 'Déclencheur', r2: 'Rempart' },
  meganium: { mv: ['dansefleur', 'protection', 'champherbu'], ability: 'regeforce', r: 'Relais', r2: 'Rempart' },
  feurisson: { ability: 'torche' },
  typhlosion: { mv: ['lanceflammes', 'meteores', 'eruption'], ability: 'gardemagik' },
  crocrodil: { ability: 'regardvif' },
  aligatueur: { mv: ['hydrocanon', 'machouille', 'aquajet'], ability: 'glissade', r: 'Éclaireur', r2: 'Frappeur' },
  demolosse: { mv: ['machouille', 'lanceflammes', 'poursuite'], ability: 'chasseur' },
  tyranocif: { mv: ['machouille', 'seisme', 'lamederoc'] }
};

/* v4.13 · families that can no longer be recruited: they remain opponents */
const OPPONENTS413 = ['roucool', 'roucoups', 'roucarnage', 'psykokwak', 'akwakwak', 'machoc', 'machopeur', 'mackogneur', 'racaillou', 'gravalanch', 'grolem', 'kokiyas', 'crustabri', 'wattouat', 'lainergie', 'pharamp', 'caninos', 'arcanin'];

export const EEVEE = { trempe: 'aquali', charge: 'voltali', brulant: 'pyroli', jour: 'mentali', nuit: 'noctali' };

export const PK_ART = no => PKA(no);

export const NOTES = {
  // v4.19
  arcko: 'Éclaireur à 4 Mouvements dès le premier stade. Engrais : la Plante frappe plus fort quand il est blessé.',
  massko: '5 Mouvements : il prépare les cases Enracinées loin devant. Souplesse : jamais paralysé.',
  jungko: 'Lame-Feuille ignore la Garde : parfait contre les Remparts. Regard Vif : les entraves ne le gênent pas.',
  poussifeu: 'Frappeur Feu bon marché : Flammèche à 2 cases pose Brûlant.',
  galifeu: 'Feu et Combat : il brûle puis frappe fort au contact. Cran : plus fort sous un statut.',
  brasegali: 'Pied Brûleur repousse et brûle. Placez la cible sur une case Trempée pour la Vapeur.',
  gobou: 'Rempart Eau solide pour 1 PC. Pistolet à Eau trempe en ligne.',
  flobio: 'Eau et Sol : insensible à l’Électrik. Ampleur fissure toute une couronne autour de lui.',
  laggron: 'Ocroupi : zone Trempée et ralentie. Enchaînez avec un allié Électrik : Court-circuit géant.',
  tarsal: 'Relais fragile mais utile : Choc Mental repousse, Charme provoque à 3 cases.',
  kirlia: 'Téléport échange sa place avec une unité à 4 cases : il sauve un allié en danger.',
  gardevoir: 'Éclat Magique intimide toute une zone (−3 dégâts). Garde-Ami protège ses voisins.',
  tenefix: 'Ténèbres et Spectre : très peu de faiblesses. Ombre Portée provoque à 3 cases : il attire les coups.',
  galekid: 'Rempart Acier et Roche à 1 PC, très solide mais lent.',
  galegon: 'Fermeté : survit à un coup fatal. Armure lui donne +2 Garde.',
  galeking: 'Le Rempart le plus solide de Hoenn. Tête de Fer repousse au contact.',
  absol: 'Chasseur : ×1,3 sur une cible à moitié de ses PV. Danse-Lames puis Tranche-Nuit : il achève tout.',
  draby: 'Téméraire : il frappe fort mais s’expose. Deux Éveils jusqu’à Drattak.',
  drackhaus: 'Une coquille : +2 Garde avec Armure, presque immobile. Il attend son heure.',
  drattak: 'Piqué Draco frappe en ligne à 4 cases. Intimidation : ses voisins frappent moins fort en arrivant.',
  // v4.15
  hoothoot: 'Éclaireur bon marché : Hypnose endort à 2 cases, et il vise à travers le brouillard.',
  noarfang: 'Nocturne : ×1,25 la nuit. Extrasenseur désoriente sa cible : elle frappera ailleurs.',
  mimigal: 'Sécrétion englue à 2 cases. Il prépare le terrain avant son Éveil.',
  migalos: 'Toile Fatale empoisonne et englue. Chasseur : ×1,3 sur une cible à moitié de ses PV ou moins.',
  loupio: 'Eau et Électrik à la fois : il pose Trempé puis Chargé, de quoi préparer un Court-circuit à lui seul.',
  lanturn: 'Onde Abyssale charge toute une zone : enchaînez avec Surf. Les attaques Électrik le soignent.',
  natu: 'Petit, rapide, portée 3. Téléport échange sa place avec une unité à 4 cases pour sauver un allié.',
  xatu: 'Œil Solaire frappe en ligne jusqu’à 4 cases. Garde Magik : les dégâts indirects ne le touchent pas.',
  marill: 'Rempart Eau et Fée, insensible au Dragon. Isograisse amortit le Feu et la Glace.',
  azumarill: 'Force Pure : ×1,3 au contact. Câlinerie intimide sa cible (−3 dégâts pendant 2 manches).',
  granivol: 'Spore Coton ralentit, Vampigraine soigne. Chlorophylle : +2 Mouvement sous le Soleil.',
  floravol: 'Poudre Dodo endort au contact. 5 de Mouvement : il va partout.',
  cotovol: 'Envol Cotonneux frappe à 4 cases en priorité, puis il peut encore bouger. Le Pokémon le plus mobile du jeu.',
  axoloto: 'Absorb Eau : les attaques Eau le soignent au lieu de le blesser.',
  maraiste: 'Inconscient : il ignore les bonus de Garde. Bourbier ralentit une zone. Insensible à l’Électrik.',
  scarhino: 'Mégacorne : 14 de Puissance au contact et repousse. Cran : ×1,5 sous un statut.',
  limagma: 'Armumagma : jamais gelé. Un Rempart lent mais solide pour un premier stade.',
  volcaropod: 'Carapace Ardente : +2 Garde pendant 3 manches, cases voisines Brûlantes. Torche : le Feu le renforce.',
  marcacrin: 'Glace et Sol : il pose Givré et Fissuré. Regard Vif : les entraves ne le gênent pas.',
  cochignon: 'Avalanche : cône de 3 cases, Givré. Isograisse amortit le Feu et la Glace.',
  // v4.13
  ramoloss: 'Éveil : Flagadoss par défaut (Rempart qui se soigne), Roigada si un allié est à son contact (Relais qui désoriente).',
  debugant: 'Trois Éveils : Kicklee au-dessus de 50 % de PV, Tygnon en dessous, Kapoera s’il est entouré par 2 adversaires.',
  kicklee: 'Pied Voltige frappe à 2 cases. Visez toujours un Pokémon : une case vide le blesse.',
  tygnon: 'Mitra-Poing échoue s’il est touché pendant la manche avant d’agir. Couvrez-le avec un Rempart, ou faites-le agir en premier.',
  kapoera: 'Triple Pied : 3 coups, la Garde compte à chaque fois. Avec Technicien, il déchire les fragiles.',
  phanpy: 'Rempart bon marché, insensible aux Toiles. Donphan déroule ensuite sa Roulade.',
  donphan: 'Roulade grossit chaque manche où il l’enchaîne. Tour Rapide le libère des entraves et des pièges.',
  porygon: 'Conversion lui donne le type de la marque de sa case : posez une marque, changez de type, résistez.',
  porygon2: 'Adaptabilité + Conversion : ses attaques Normal prennent l’élément de sa case, avec le bonus de même type.',
  pomdepik: 'Pose des Picots dès la première manche. Fermeté : il survit une fois à un coup fatal.',
  foretress: 'Explosion vide le terrain autour de lui, alliés compris. Gardez-la pour le dernier carré.',
  metamorph: 'Morphing copie tout sauf les PV. Copiez le Pokémon adverse le plus dangereux, ou votre meilleur allié.',
  qulbutoke: 'Aucune attaque : Riposte au contact, Voile Miroir à distance, Prélèvem. Destin. Marque Ombre ralentit ses voisins.',
  magicarpe: 'Dans les jeux, Trempette ne fait rien. Ici, elle mouille trois cases et prépare la moitié des réactions.',
  chenipan: 'Sécrétion cloue un Pokémon au sol. Papilusion perd ce contrôle en échange de la puissance.',
  papilusion: 'Rayon Signal et Vol-Vie : plus de dégâts et de portée, mais plus aucun moyen d’immobiliser.',
  abra: 'Ne connaît que Téléport, comme dans les jeux. Placez un ennemi sur l’eau, Pikachu fait le reste.',
  alakazam: 'Psyko frappe fort, mais Alakazam a oublié Téléport : il ne déplace plus personne.',
  fantominus: 'Onde Folie : l’ennemi frappe son propre allié.',
  ectoplasma: 'Ectoplasma échange Onde Folie contre Hypnose : il endort au lieu de retourner.',
  evoli:
    'Son Éveil dépend de la case et de l’heure : Aquali sur l’eau, Pyroli dans les flammes, Mentali le jour, Noctali la nuit.',
  tetarte: 'Éveil : Tartard par défaut, Tarpaud sur une case Trempée ou sous la Pluie.',
  onix: 'Éveillé en Steelix, il perd Vol et Roche mais gagne le type Acier.',
  insecateur: 'Éveillé en Cizayox, il perd le type Vol : plus lent, mais bien plus solide.',
  pichu: 'Charme protège l’équipe dès le premier tour. Pikachu et Raichu perdent ce soutien.',
  tyranocif: 'Sable Volant : la tempête se lève dès son arrivée.',
  tarpaud: 'Crachin : la pluie tombe dès son arrivée.'
};

export const SCEN = {
  gue: {
    n: 'Gué de la Brume',
    lvl: 'Initiation',
    lim: 10,
    time: 'jour',
    bio: 'gue',
    d: 'Trois jeunes Pokémon Eau tiennent la rivière. Sous 50 % de PV, ils évoluent en fin de manche.',
    water: ['4,0', '4,1', '4,2', '4,3', '4,4', '4,5'],
    rock: ['2,0', '2,5'],
    hb: 6,
    pb: 1,
    lv: 12,
    foes: [
      ['psykokwak', [6, 1]],
      ['kaiminus', [6, 3]],
      ['ptitard', [6, 5]]
    ],
    catch: true
  },
  roche: {
    // training ground: it must not bear the name of a gym
    n: 'Carrière de Roche',
    lvl: 'Confirmé',
    lim: 10,
    time: 'jour',
    bio: 'roche',
    d: 'Sol Fissuré, défenseurs blindés. Embrylex peut devenir Ymphect : ne le laissez pas à mi-vie.',
    water: [],
    rock: ['3,1', '4,4', '3,3'],
    fiss: true,
    hb: 20,
    pb: 4,
    lv: 20,
    foes: [
      ['racaillou', [6, 1]],
      ['onix', [6, 3]],
      ['embrylex', [7, 2]],
      ['racaillou', [6, 5]]
    ],
    catch: true
  },
  tour: {
    n: 'Tour Cendrée',
    lvl: 'Confirmé',
    lim: 10,
    time: 'nuit',
    bio: 'tour',
    d: 'La nuit tombe sur la tour en ruine. Spectrum peut devenir Ectoplasma et endormir vos voisins.',
    water: [],
    rock: ['3,0', '4,2', '3,4', '5,5'],
    hb: 18,
    pb: 4,
    lv: 24,
    foes: [
      ['fantominus', [6, 1]],
      ['malosse', [6, 3]],
      ['nosferapti', [6, 5]],
      ['spectrum', [7, 3]]
    ],
    catch: true
  },
  ligue: {
    n: 'Ligue · Exhibition',
    lvl: 'Expert',
    lim: 8,
    time: 'nuit',
    bio: 'ligue',
    d: 'Un match d’exhibition contre une équipe de la Ligue : Léviator ouvre, Draco, Têtarte, Pikachu et Caninos attendent leur moment.',
    water: ['4,2', '5,2', '4,3', '5,3'],
    rock: ['3,0', '3,5'],
    hb: 36,
    pb: 6,
    lv: 40,
    foes: [
      ['leviator', [6, 1]],
      ['draco', [7, 2]],
      ['tetarte', [6, 3]],
      ['pikachu', [6, 5]],
      ['caninos', [7, 4]]
    ]
  }
};

export const DEPLOY = [
  [1, 1],
  [0, 2],
  [1, 3],
  [0, 4]
];

export const PRESETS = {
  orage: { n: 'Orage', ids: ['magicarpe', 'pichu', 'magneti', 'phanpy'] },
  johto: { n: 'Johto', ids: ['kaiminus', 'hericendre', 'germignon', 'debugant'] },
  illusion: { n: 'Illusion', ids: ['abra', 'fantominus', 'melo', 'pichu'] },
  titans: { n: 'Titans', ids: ['embrylex', 'salameche', 'chenipan', 'magicarpe'] },
  forteresse: { n: 'Forteresse', ids: ['carapuce', 'onix', 'melo', 'pomdepik'] },
  technique: { n: 'Technique', ids: ['metamorph', 'qulbutoke', 'porygon', 'ramoloss'] }
};

export const WXN = { pluie: 'Pluie', soleil: 'Soleil', grele: 'Grêle', sable: 'Sable' };

export const WXT = { pluie: 'Eau', soleil: 'Feu', grele: 'Glace', sable: 'Sol' };

export const FAMT = {
  Eau: 'Eau',
  Électrik: 'Électrik',
  Feu: 'Feu',
  Plante: 'Plante',
  Insecte: 'Plante',
  Glace: 'Glace',
  Sol: 'Sol',
  Roche: 'Sol',
  Combat: 'Sol'
};

export const MKT = { trempe: 'Eau', charge: 'Électrik', brulant: 'Feu', enracine: 'Plante', givre: 'Glace', fissure: 'Sol' };

export const TCH = {
  Normal: [[], ['Roche', 'Acier'], ['Spectre']],
  Feu: [['Plante', 'Glace', 'Insecte', 'Acier'], ['Feu', 'Eau', 'Roche', 'Dragon'], []],
  Eau: [['Feu', 'Sol', 'Roche'], ['Eau', 'Plante', 'Dragon'], []],
  Électrik: [['Eau', 'Vol'], ['Électrik', 'Plante', 'Dragon'], ['Sol']],
  Plante: [['Eau', 'Sol', 'Roche'], ['Feu', 'Plante', 'Poison', 'Vol', 'Insecte', 'Dragon', 'Acier'], []],
  Glace: [['Plante', 'Sol', 'Vol', 'Dragon'], ['Feu', 'Eau', 'Glace', 'Acier'], []],
  Combat: [['Normal', 'Glace', 'Roche', 'Ténèbres', 'Acier'], ['Poison', 'Vol', 'Psy', 'Insecte', 'Fée'], ['Spectre']],
  Poison: [['Plante', 'Fée'], ['Poison', 'Sol', 'Roche', 'Spectre'], ['Acier']],
  Sol: [['Feu', 'Électrik', 'Poison', 'Roche', 'Acier'], ['Plante', 'Insecte'], ['Vol']],
  Vol: [['Plante', 'Combat', 'Insecte'], ['Électrik', 'Roche', 'Acier'], []],
  Psy: [['Combat', 'Poison'], ['Psy', 'Acier'], ['Ténèbres']],
  Insecte: [['Plante', 'Psy', 'Ténèbres'], ['Feu', 'Combat', 'Poison', 'Vol', 'Spectre', 'Acier', 'Fée'], []],
  Roche: [['Feu', 'Glace', 'Vol', 'Insecte'], ['Combat', 'Sol', 'Acier'], []],
  Spectre: [['Psy', 'Spectre'], ['Ténèbres'], ['Normal']],
  Dragon: [['Dragon'], ['Acier'], ['Fée']],
  Ténèbres: [['Psy', 'Spectre'], ['Combat', 'Ténèbres', 'Fée'], []],
  Acier: [['Glace', 'Roche', 'Fée'], ['Feu', 'Eau', 'Électrik', 'Acier'], []],
  Fée: [['Combat', 'Dragon', 'Ténèbres'], ['Feu', 'Poison', 'Acier'], []]
};

export const NEWS = [
  {
    n: 'L’évolution se joue en combat',
    tg: 'Concept',
    c: 'var(--gold)',
    i: 'M5 19 12 5l7 14M8 13h8',
    d: 'Personne n’évolue dans un menu : l’évolution se décide en plein combat. Les formes déjà éveillées se recrutent aussi, plus cher.'
  },
  {
    n: 'Énergie d’Éveil',
    tg: 'Tempo',
    c: 'var(--ally)',
    i: 'M12 2 20 12 12 22 4 12Z',
    d: 'Trois losanges par Pokémon. Fin de manche, réaction, coup encaissé, allié K.O. : chaque événement en remplit un.'
  },
  {
    n: 'Sans retour',
    tg: 'Choix décisif',
    c: 'var(--enemy)',
    i: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
    d: 'Papilusion gagne Rayon Signal mais perd Sécrétion pour de bon. Évoluer trop tôt peut coûter le combat.'
  },
  {
    n: 'Arrivées',
    tg: 'Terrain',
    c: '#A98FF3',
    i: 'M12 3 20 7.5v9L12 21l-8-4.5v-9Z',
    d: 'Chaque évolution change le terrain : Florizarre appelle le soleil, Papilusion endort ses voisins, Léviator repousse tout.'
  },
  {
    n: 'Rôles et synergies',
    tg: 'Équipe',
    c: 'var(--ok)',
    i: 'M12 3 19 6v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6Z',
    d: 'Le Rempart s’interpose, le Frappeur escorté frappe plus fort, l’Éclaireur se replie. Feu et Roche ouvrent la Forge.'
  },
  {
    n: 'Arène et obstacles',
    tg: 'Terrain',
    c: 'var(--gold)',
    i: 'M8 21V7h8v14M6 7h12M7 4h10',
    d: 'Les piliers bloquent les tirs, les rochers couvrent et font ricocher, les hautes herbes cachent, le sable ralentit.'
  }
];

export const SYS3 = [
  {
    c: 'S-01',
    n: 'Budget de commandement',
    one: '12 points pour 4 Pokémon : premiers stades ou recrues confirmées.',
    pts: [
      ['Un premier stade coûte 1 à 4 points : Magicarpe 1, Évoli 2, Insécateur 3, Ronflex 4. Il évolue en combat.', 1],
      [
        'Une forme déjà éveillée se recrute aussi, plus cher : Ymphect 3, Alakazam 6, Dracaufeu 7. Une seule forme par famille.',
        1
      ],
      ['Chaque tranche de 4 points libres donne +1 Voix par manche, plafonné à +2.']
    ],
    f: ['S-02', 'S-05']
  },
  {
    c: 'S-02',
    n: 'Rôles et synergies',
    one: 'Six rôles, chacun avec sa mécanique. Dix synergies de types.',
    pts: [
      [
        'Rempart : s’interpose devant un allié. Frappeur : +25 % escorté par un Rempart. Éclaireur : frappe et se replie. Verrou : +25 % sur les cibles altérées. Déclencheur : marques plus longues. Relais : soigne ses voisins.',
        1
      ],
      ['Le rôle change en évoluant : Chenipan est un Verrou, Papilusion un Frappeur.'],
      [
        'Deux Pokémon portant deux types complémentaires ouvrent une synergie : Feu et Roche donnent la Forge, Ténèbres et Acier l’Acier trempé.',
        1
      ]
    ],
    f: ['S-03', 'S-08']
  },
  {
    c: 'S-03',
    n: 'Marques et réactions',
    one: '6 marques, 14 réactions, 4 météos.',
    pts: [
      ['La table des types classique s’applique avant toute réaction.'],
      ['Une marque par case, 2 manches. Un autre élément la consomme et déclenche la réaction, alliés compris.'],
      ['Préparer ou déclencher une réaction remplit un losange d’énergie.', 1]
    ],
    f: ['S-04', 'S-08']
  },
  {
    c: 'S-04',
    n: 'Tempo',
    one: 'Vous jouez, puis les ennemis ripostent selon la situation.',
    pts: [
      ['Chaque adversaire choisit sa cible au moment d’agir : il frappe là où vous êtes, pas là où vous étiez.'],
      ['Vos quatre Pokémon agissent dans l’ordre de votre choix, puis les ennemis agissent par Vitesse.']
    ],
    f: ['S-03', 'S-05']
  },
  {
    c: 'S-05',
    n: 'Voix du dresseur',
    one: '3 Voix par manche, les ordres de l’animé.',
    pts: [
      ['Esquive (1) : un pas de côté, même après avoir agi.'],
      [
        'Relance (2) : un Pokémon rejoue, une fois par manche. Juste après un Éveil, elle permet d’utiliser aussitôt les nouvelles capacités.',
        1
      ],
      ['Éveil (1) : coûte aussi l’action du Pokémon.', 1]
    ],
    f: ['S-04', 'S-08']
  },
  {
    c: 'S-06',
    n: 'Lecture du terrain',
    one: 'Aucun coup critique, aucune précision aléatoire.',
    pts: [
      ['Touchez un adversaire : sa zone de menace s’affiche. Hors de portée, vous êtes à l’abri.'],
      ['L’aperçu montre le résultat exact avant de valider.']
    ],
    f: ['S-02', 'S-05']
  },
  {
    c: 'S-07',
    n: 'Liens et duos',
    one: 'Les duos qui réagissent ensemble progressent ensemble.',
    pts: [
      ['Une réaction préparée par l’un et déclenchée par l’autre donne +1 Lien.'],
      ['Palier 3 : une technique combinée propre au duo.']
    ],
    f: ['S-01', 'S-08']
  },
  {
    c: 'S-08',
    n: 'Éveil',
    one: 'Évoluer en plein combat, sans retour possible.',
    pts: [
      [
        'Énergie : +1 par fin de manche, par réaction préparée ou déclenchée, par coup encaissé de 30 % des PV, et pour chaque allié K.O. Trois losanges pleins ouvrent l’Éveil.',
        1
      ],
      [
        'Le nouveau stade remplace capacités, types et talent, soigne 30 % des PV et produit une Arrivée qui change le terrain.',
        1
      ],
      [
        'Branches : Têtarte, Ramoloss et Debugant prennent la voie que la situation ouvre (case, voisins, PV) ; Évoli choisit librement parmi ses 5 évolutions (en harmonie avec sa case ou l’heure, il garde 1 losange). Les ennemis évoluent seuls sous 50 % de PV.',
        1
      ]
    ],
    f: ['S-01', 'S-03']
  }
];

// Statements executed at startup, in the original order (see index.js).
export function __init() {

/* ===================== POKÉDEX v0.7: Kanto + Johto ===================== */
MON = [
  [
    'bulbizarre',
    'Bulbizarre',
    ['Plante', 'Poison'],
    1,
    'Déclencheur',
    'Rempart',
    [3, 2, 3, 2, 2, 2],
    ['vampigraine', 'fouet'],
    'engrais',
    'herbizarre',
    1
  ],
  [
    'herbizarre',
    'Herbizarre',
    ['Plante', 'Poison'],
    2,
    'Verrou',
    'Déclencheur',
    [4, 3, 3, 2, 2, 2],
    ['poudredodo', 'vampigraine'],
    'engrais',
    'florizarre',
    2
  ],
  [
    'florizarre',
    'Florizarre',
    ['Plante', 'Poison'],
    4,
    'Frappeur',
    'Rempart',
    [5, 4, 4, 2, 2, 3],
    ['lancesoleil', 'synthese'],
    'chlorophylle',
    null,
    3
  ],
  [
    'salameche',
    'Salamèche',
    ['Feu'],
    1,
    'Frappeur',
    'Déclencheur',
    [2, 3, 1, 4, 3, 2],
    ['flammeche', 'griffe'],
    'brasier',
    'reptincel',
    4
  ],
  [
    'reptincel',
    'Reptincel',
    ['Feu'],
    2,
    'Frappeur',
    'Verrou',
    [3, 4, 2, 4, 3, 2],
    ['flammeche', 'brouillard'],
    'brasier',
    'dracaufeu',
    5
  ],
  [
    'dracaufeu',
    'Dracaufeu',
    ['Feu', 'Vol'],
    5,
    'Frappeur',
    'Éclaireur',
    [4, 5, 3, 4, 4, 3],
    ['lanceflammes', 'criailes'],
    'brasier',
    null,
    6
  ],
  [
    'carapuce',
    'Carapuce',
    ['Eau'],
    1,
    'Rempart',
    'Déclencheur',
    [3, 2, 3, 2, 2, 2],
    ['pistolet', 'repli'],
    'torrent',
    'carabaffe',
    7
  ],
  [
    'carabaffe',
    'Carabaffe',
    ['Eau'],
    2,
    'Rempart',
    'Frappeur',
    [4, 3, 4, 2, 2, 3],
    ['vibraqua', 'morsure'],
    'torrent',
    'tortank',
    8
  ],
  [
    'tortank',
    'Tortank',
    ['Eau'],
    4,
    'Rempart',
    'Frappeur',
    [5, 4, 5, 2, 2, 3],
    ['hydrocanon', 'abri'],
    'torrent',
    null,
    9
  ],
  [
    'chenipan',
    'Chenipan',
    ['Insecte'],
    1,
    'Verrou',
    'Rempart',
    [2, 1, 2, 2, 2, 2],
    ['secretion', 'charge'],
    'ecranpoudre',
    'chrysacier',
    10
  ],
  [
    'chrysacier',
    'Chrysacier',
    ['Insecte'],
    1,
    'Rempart',
    'Verrou',
    [3, 1, 5, 1, 1, 2],
    ['armure', 'secretion'],
    'mue',
    'papilusion',
    11
  ],
  [
    'papilusion',
    'Papilusion',
    ['Insecte', 'Vol'],
    3,
    'Frappeur',
    'Éclaireur',
    [3, 3, 2, 4, 4, 3],
    ['rayonsignal', 'volvie'],
    'oeilcompose',
    null,
    12
  ],
  [
    'roucool',
    'Roucool',
    ['Normal', 'Vol'],
    1,
    'Relais',
    'Éclaireur',
    [2, 1, 1, 4, 4, 2],
    ['tornade', 'jetsable'],
    'regardvif',
    'roucoups',
    16
  ],
  [
    'roucoups',
    'Roucoups',
    ['Normal', 'Vol'],
    2,
    'Relais',
    'Frappeur',
    [3, 2, 2, 4, 5, 2],
    ['criailes', 'viveatt'],
    'regardvif',
    'roucarnage',
    17
  ],
  [
    'roucarnage',
    'Roucarnage',
    ['Normal', 'Vol'],
    3,
    'Relais',
    'Frappeur',
    [4, 3, 3, 5, 5, 3],
    ['cyclone', 'criailes'],
    'regardvif',
    null,
    18
  ],
  [
    'pichu',
    'Pichu',
    ['Électrik'],
    1,
    'Verrou',
    'Déclencheur',
    [1, 1, 1, 5, 3, 3],
    ['eclair', 'charme'],
    'statik',
    'pikachu',
    172
  ],
  [
    'pikachu',
    'Pikachu',
    ['Électrik'],
    2,
    'Frappeur',
    'Déclencheur',
    [2, 3, 1, 5, 3, 3],
    ['eclair', 'viveatt'],
    'statik',
    'raichu',
    25
  ],
  [
    'raichu',
    'Raichu',
    ['Électrik'],
    3,
    'Frappeur',
    'Éclaireur',
    [3, 4, 2, 5, 4, 3],
    ['tonnerre', 'viveatt'],
    'statik',
    null,
    26
  ],
  [
    'melo',
    'Mélo',
    ['Fée'],
    1,
    'Verrou',
    'Relais',
    [2, 1, 2, 2, 2, 2],
    ['charme', 'berceuse'],
    'gardemagik',
    'melofee',
    173
  ],
  [
    'melofee',
    'Mélofée',
    ['Fée'],
    2,
    'Rempart',
    'Verrou',
    [3, 2, 2, 2, 2, 3],
    ['berceuse', 'voeu'],
    'gardemagik',
    'melodelfe',
    35
  ],
  [
    'melodelfe',
    'Mélodelfe',
    ['Fée'],
    3,
    'Frappeur',
    'Relais',
    [4, 4, 3, 2, 2, 3],
    ['pouvoirlunaire', 'voeu'],
    'gardemagik',
    null,
    36
  ],
  [
    'nosferapti',
    'Nosferapti',
    ['Poison', 'Vol'],
    1,
    'Éclaireur',
    'Verrou',
    [2, 1, 1, 5, 4, 2],
    ['ultrason', 'vampirisme'],
    'echolocation',
    'nosferalto',
    41
  ],
  [
    'nosferalto',
    'Nosferalto',
    ['Poison', 'Vol'],
    2,
    'Éclaireur',
    'Frappeur',
    [3, 3, 2, 5, 5, 2],
    ['ultrason', 'morsure'],
    'echolocation',
    'nostenfer',
    42
  ],
  [
    'nostenfer',
    'Nostenfer',
    ['Poison', 'Vol'],
    4,
    'Verrou',
    'Frappeur',
    [4, 4, 3, 5, 5, 3],
    ['ondefolie', 'criailes'],
    'attention',
    null,
    169
  ],
  [
    'psykokwak',
    'Psykokwak',
    ['Eau'],
    2,
    'Verrou',
    'Relais',
    [3, 2, 2, 3, 3, 2],
    ['chocmental', 'pistolet'],
    'moiteur',
    'akwakwak',
    54
  ],
  [
    'akwakwak',
    'Akwakwak',
    ['Eau'],
    3,
    'Frappeur',
    'Verrou',
    [4, 4, 3, 4, 3, 2],
    ['surf', 'chocmental'],
    'moiteur',
    null,
    55
  ],
  [
    'caninos',
    'Caninos',
    ['Feu'],
    2,
    'Frappeur',
    'Rempart',
    [3, 3, 2, 3, 3, 2],
    ['zenith', 'crocsfeu'],
    'intimidation',
    'arcanin',
    58
  ],
  [
    'arcanin',
    'Arcanin',
    ['Feu'],
    4,
    'Frappeur',
    'Éclaireur',
    [4, 5, 3, 4, 4, 4],
    ['vitesseextreme', 'crocsfeu'],
    'intimidation',
    null,
    59
  ],
  [
    'ptitard',
    'Ptitard',
    ['Eau'],
    1,
    'Déclencheur',
    'Relais',
    [2, 1, 2, 3, 3, 2],
    ['dansepluie', 'bulles'],
    'absorbeau',
    'tetarte',
    60
  ],
  [
    'tetarte',
    'Têtarte',
    ['Eau'],
    2,
    'Verrou',
    'Déclencheur',
    [3, 3, 3, 3, 3, 2],
    ['hypnose', 'hydroqueue'],
    'absorbeau',
    ['tartard', 'tarpaud'],
    61
  ],
  [
    'tartard',
    'Tartard',
    ['Eau', 'Combat'],
    4,
    'Frappeur',
    'Rempart',
    [5, 4, 4, 2, 2, 1],
    ['sacrifice', 'hydroqueue'],
    'absorbeau',
    null,
    62
  ],
  [
    'tarpaud',
    'Tarpaud',
    ['Eau'],
    4,
    'Déclencheur',
    'Rempart',
    [5, 3, 4, 3, 3, 3],
    ['dansepluie', 'vibraqua'],
    'crachin',
    null,
    186
  ],
  ['abra', 'Abra', ['Psy'], 1, 'Relais', 'Éclaireur', [1, 1, 1, 4, 2, 4], ['teleport'], 'attention', 'kadabra', 63],
  [
    'kadabra',
    'Kadabra',
    ['Psy'],
    2,
    'Relais',
    'Frappeur',
    [2, 4, 1, 5, 3, 4],
    ['teleport', 'chocmental'],
    'attention',
    'alakazam',
    64
  ],
  [
    'alakazam',
    'Alakazam',
    ['Psy'],
    4,
    'Frappeur',
    'Verrou',
    [3, 5, 2, 5, 3, 4],
    ['psyko', 'chocmental'],
    'attention',
    null,
    65
  ],
  [
    'machoc',
    'Machoc',
    ['Combat'],
    1,
    'Frappeur',
    'Verrou',
    [3, 3, 2, 2, 2, 1],
    ['balayage', 'frappeatlas'],
    'cran',
    'machopeur',
    66
  ],
  [
    'machopeur',
    'Machopeur',
    ['Combat'],
    3,
    'Frappeur',
    'Rempart',
    [4, 4, 3, 2, 2, 1],
    ['poingkarate', 'frappeatlas'],
    'cran',
    'mackogneur',
    67
  ],
  [
    'mackogneur',
    'Mackogneur',
    ['Combat'],
    4,
    'Frappeur',
    'Rempart',
    [4, 5, 3, 2, 2, 1],
    ['dynamopoing', 'coupcroix'],
    'annulegarde',
    null,
    68
  ],
  [
    'racaillou',
    'Racaillou',
    ['Roche', 'Sol'],
    1,
    'Rempart',
    'Déclencheur',
    [4, 2, 4, 1, 2, 1],
    ['coudboue', 'sable'],
    'fermete',
    'gravalanch',
    74
  ],
  [
    'gravalanch',
    'Gravalanch',
    ['Roche', 'Sol'],
    2,
    'Rempart',
    'Frappeur',
    [4, 3, 5, 1, 2, 2],
    ['ampleur', 'jetpierres'],
    'fermete',
    'grolem',
    75
  ],
  [
    'grolem',
    'Grolem',
    ['Roche', 'Sol'],
    4,
    'Rempart',
    'Frappeur',
    [5, 4, 5, 1, 2, 2],
    ['seisme', 'eboulement'],
    'fermete',
    null,
    76
  ],
  [
    'magneti',
    'Magnéti',
    ['Électrik', 'Acier'],
    2,
    'Déclencheur',
    'Verrou',
    [2, 2, 3, 2, 2, 4],
    ['cageeclair', 'aimant'],
    'magnepiege',
    'magneton',
    81
  ],
  [
    'magneton',
    'Magnéton',
    ['Électrik', 'Acier'],
    3,
    'Frappeur',
    'Verrou',
    [3, 4, 4, 2, 2, 4],
    ['tonnerre', 'aimant'],
    'magnepiege',
    null,
    82
  ],
  [
    'kokiyas',
    'Kokiyas',
    ['Eau'],
    1,
    'Verrou',
    'Rempart',
    [2, 2, 4, 2, 2, 1],
    ['claquoir', 'repli'],
    'coque',
    'crustabri',
    90
  ],
  [
    'crustabri',
    'Crustabri',
    ['Eau', 'Glace'],
    4,
    'Rempart',
    'Déclencheur',
    [3, 4, 5, 2, 2, 3],
    ['blizzard', 'ondeboreale'],
    'coque',
    null,
    91
  ],
  [
    'fantominus',
    'Fantominus',
    ['Spectre', 'Poison'],
    2,
    'Verrou',
    'Frappeur',
    [2, 2, 1, 4, 3, 3],
    ['ondefolie', 'lechouille'],
    'levitation',
    'spectrum',
    92
  ],
  [
    'spectrum',
    'Spectrum',
    ['Spectre', 'Poison'],
    3,
    'Verrou',
    'Frappeur',
    [3, 4, 2, 4, 4, 3],
    ['ondefolie', 'ballombre'],
    'levitation',
    'ectoplasma',
    93
  ],
  [
    'ectoplasma',
    'Ectoplasma',
    ['Spectre', 'Poison'],
    4,
    'Frappeur',
    'Verrou',
    [3, 5, 2, 5, 4, 3],
    ['ballombre', 'hypnose'],
    'levitation',
    null,
    94
  ],
  [
    'onix',
    'Onix',
    ['Roche', 'Sol'],
    2,
    'Rempart',
    'Verrou',
    [4, 2, 5, 3, 3, 1],
    ['etreinte', 'jetpierres'],
    'fermete',
    'steelix',
    95
  ],
  [
    'steelix',
    'Steelix',
    ['Acier', 'Sol'],
    4,
    'Rempart',
    'Frappeur',
    [5, 4, 5, 1, 2, 1],
    ['queuedefer', 'seisme'],
    'fermete',
    null,
    208
  ],
  [
    'insecateur',
    'Insécateur',
    ['Insecte', 'Vol'],
    3,
    'Frappeur',
    'Éclaireur',
    [3, 4, 2, 5, 4, 1],
    ['tranche', 'taillade'],
    'essaim',
    'cizayox',
    123
  ],
  [
    'cizayox',
    'Cizayox',
    ['Insecte', 'Acier'],
    4,
    'Frappeur',
    'Rempart',
    [4, 5, 4, 3, 3, 1],
    ['griffeacier', 'danselames'],
    'essaim',
    null,
    212
  ],
  [
    'magicarpe',
    'Magicarpe',
    ['Eau'],
    1,
    'Déclencheur',
    'Éclaireur',
    [2, 1, 1, 4, 4, 2],
    ['trempette', 'charge'],
    'glissade',
    'leviator',
    129
  ],
  [
    'leviator',
    'Léviator',
    ['Eau', 'Vol'],
    5,
    'Frappeur',
    'Verrou',
    [5, 5, 3, 3, 3, 3],
    ['hydrocanon', 'ouragan'],
    'intimidation',
    null,
    130
  ],
  [
    'lokhlass',
    'Lokhlass',
    ['Eau', 'Glace'],
    4,
    'Verrou',
    'Déclencheur',
    [5, 3, 3, 2, 3, 3],
    ['blizzard', 'grele'],
    'absorbeau',
    null,
    131
  ],
  [
    'evoli',
    'Évoli',
    ['Normal'],
    2,
    'Relais',
    'Déclencheur',
    [3, 2, 2, 3, 3, 3],
    ['meteores', 'relais'],
    'adaptabilite',
    'eevee',
    133
  ],
  [
    'aquali',
    'Aquali',
    ['Eau'],
    4,
    'Rempart',
    'Déclencheur',
    [5, 3, 3, 2, 3, 2],
    ['surf', 'acidarmure'],
    'absorbeau',
    null,
    134
  ],
  [
    'voltali',
    'Voltali',
    ['Électrik'],
    4,
    'Frappeur',
    'Verrou',
    [3, 4, 2, 5, 4, 3],
    ['tonnerre', 'cageeclair'],
    'absorbvolt',
    null,
    135
  ],
  [
    'pyroli',
    'Pyroli',
    ['Feu'],
    4,
    'Frappeur',
    'Verrou',
    [3, 5, 3, 3, 3, 2],
    ['lanceflammes', 'danseflamme'],
    'torche',
    null,
    136
  ],
  [
    'mentali',
    'Mentali',
    ['Psy'],
    4,
    'Frappeur',
    'Relais',
    [3, 5, 2, 5, 3, 4],
    ['psyko', 'aurore'],
    'synchro',
    null,
    196
  ],
  [
    'noctali',
    'Noctali',
    ['Ténèbres'],
    4,
    'Rempart',
    'Verrou',
    [5, 2, 5, 3, 3, 3],
    ['feinte', 'regardnoir'],
    'attention',
    null,
    197
  ],
  [
    'ronflex',
    'Ronflex',
    ['Normal'],
    4,
    'Rempart',
    'Verrou',
    [5, 4, 4, 1, 1, 1],
    ['plaquage', 'repos'],
    'isograisse',
    null,
    143
  ],
  [
    'minidraco',
    'Minidraco',
    ['Dragon'],
    2,
    'Frappeur',
    'Verrou',
    [3, 3, 2, 3, 3, 2],
    ['dracorage', 'ouragan'],
    'mue',
    'draco',
    147
  ],
  [
    'draco',
    'Draco',
    ['Dragon'],
    3,
    'Verrou',
    'Frappeur',
    [4, 3, 3, 3, 3, 3],
    ['cageeclair', 'ouragan'],
    'mue',
    'dracolosse',
    148
  ],
  [
    'dracolosse',
    'Dracolosse',
    ['Dragon', 'Vol'],
    5,
    'Frappeur',
    'Rempart',
    [5, 5, 4, 3, 4, 3],
    ['ultralaser', 'criailes'],
    'attention',
    null,
    149
  ],
  [
    'germignon',
    'Germignon',
    ['Plante'],
    1,
    'Rempart',
    'Déclencheur',
    [3, 2, 3, 2, 2, 2],
    ['fouet', 'protection'],
    'engrais',
    'macronium',
    152
  ],
  [
    'macronium',
    'Macronium',
    ['Plante'],
    2,
    'Rempart',
    'Frappeur',
    [4, 3, 4, 2, 2, 3],
    ['tranchherbe', 'synthese'],
    'engrais',
    'meganium',
    153
  ],
  [
    'meganium',
    'Méganium',
    ['Plante'],
    4,
    'Rempart',
    'Frappeur',
    [5, 4, 5, 2, 2, 2],
    ['dansefleur', 'protection'],
    'engrais',
    null,
    154
  ],
  [
    'hericendre',
    'Héricendre',
    ['Feu'],
    1,
    'Éclaireur',
    'Frappeur',
    [2, 2, 1, 4, 4, 2],
    ['flammeche', 'brouillard'],
    'brasier',
    'feurisson',
    155
  ],
  [
    'feurisson',
    'Feurisson',
    ['Feu'],
    2,
    'Frappeur',
    'Éclaireur',
    [3, 3, 2, 4, 4, 2],
    ['rouedefeu', 'brouillard'],
    'brasier',
    'typhlosion',
    156
  ],
  [
    'typhlosion',
    'Typhlosion',
    ['Feu'],
    4,
    'Frappeur',
    'Éclaireur',
    [4, 5, 3, 4, 4, 3],
    ['lanceflammes', 'meteores'],
    'brasier',
    null,
    157
  ],
  [
    'kaiminus',
    'Kaiminus',
    ['Eau'],
    1,
    'Verrou',
    'Frappeur',
    [3, 2, 2, 3, 3, 2],
    ['pistolet', 'grimace'],
    'torrent',
    'crocrodil',
    158
  ],
  [
    'crocrodil',
    'Crocrodil',
    ['Eau'],
    2,
    'Frappeur',
    'Verrou',
    [4, 3, 3, 3, 3, 2],
    ['morsure', 'hydroqueue'],
    'torrent',
    'aligatueur',
    159
  ],
  [
    'aligatueur',
    'Aligatueur',
    ['Eau'],
    4,
    'Frappeur',
    'Rempart',
    [5, 5, 4, 3, 3, 2],
    ['hydrocanon', 'machouille'],
    'torrent',
    null,
    160
  ],
  [
    'wattouat',
    'Wattouat',
    ['Électrik'],
    1,
    'Déclencheur',
    'Verrou',
    [2, 1, 2, 2, 2, 3],
    ['cageeclair', 'charge'],
    'statik',
    'lainergie',
    179
  ],
  [
    'lainergie',
    'Lainergie',
    ['Électrik'],
    2,
    'Verrou',
    'Déclencheur',
    [3, 3, 3, 2, 2, 3],
    ['eclair', 'sporecoton'],
    'statik',
    'pharamp',
    180
  ],
  [
    'pharamp',
    'Pharamp',
    ['Électrik'],
    4,
    'Frappeur',
    'Rempart',
    [5, 5, 4, 2, 2, 2],
    ['poingeclair', 'tonnerre'],
    'statik',
    null,
    181
  ],
  [
    'malosse',
    'Malosse',
    ['Ténèbres', 'Feu'],
    1,
    'Verrou',
    'Frappeur',
    [2, 2, 1, 4, 3, 2],
    ['flammeche', 'hurlement'],
    'torche',
    'demolosse',
    228
  ],
  [
    'demolosse',
    'Démolosse',
    ['Ténèbres', 'Feu'],
    4,
    'Frappeur',
    'Éclaireur',
    [4, 5, 3, 4, 4, 3],
    ['machouille', 'lanceflammes'],
    'torche',
    null,
    229
  ],
  [
    'embrylex',
    'Embrylex',
    ['Roche', 'Sol'],
    1,
    'Rempart',
    'Déclencheur',
    [3, 2, 3, 2, 2, 1],
    ['morsure', 'sable'],
    'cran',
    'ymphect',
    246
  ],
  [
    'ymphect',
    'Ymphect',
    ['Roche', 'Sol'],
    2,
    'Rempart',
    'Verrou',
    [4, 3, 5, 1, 1, 2],
    ['eboulement', 'sable'],
    'mue',
    'tyranocif',
    247
  ],
  [
    'tyranocif',
    'Tyranocif',
    ['Roche', 'Ténèbres'],
    5,
    'Frappeur',
    'Rempart',
    [5, 5, 5, 2, 2, 2],
    ['machouille', 'seisme'],
    'sablevolant',
    null,
    248
  ],
  // v4.13: technical families
  ['ramoloss', 'Ramoloss', ['Eau', 'Psy'], 2, 'Verrou', 'Rempart', [4, 2, 3, 1, 2, 2], ['chocmental', 'pistolet'], 'moiteur', ['flagadoss', 'roigada'], 79],
  ['flagadoss', 'Flagadoss', ['Eau', 'Psy'], 4, 'Rempart', 'Frappeur', [5, 4, 5, 1, 2, 2], ['vibraqua', 'chocmental', 'paresse'], 'regeforce', null, 80],
  ['roigada', 'Roigada', ['Eau', 'Psy'], 4, 'Relais', 'Verrou', [5, 3, 4, 2, 2, 3], ['psyko', 'surf', 'vantardise'], 'attention', null, 199],
  ['debugant', 'Debugant', ['Combat'], 1, 'Frappeur', 'Verrou', [2, 3, 2, 3, 3, 1], ['balayage', 'charge'], 'cran', ['kicklee', 'tygnon', 'kapoera'], 236],
  ['kicklee', 'Kicklee', ['Combat'], 4, 'Frappeur', 'Éclaireur', [3, 5, 2, 4, 4, 2], ['coupcroix', 'balayage', 'piedvoltige'], 'temeraire', null, 106],
  ['tygnon', 'Tygnon', ['Combat'], 4, 'Rempart', 'Frappeur', [4, 4, 4, 3, 3, 1], ['poingeclair', 'dynamopoing', 'mitrapoing'], 'poingdefer', null, 107],
  ['kapoera', 'Kapoera', ['Combat'], 4, 'Éclaireur', 'Relais', [3, 4, 3, 4, 4, 1], ['tourrapide', 'balayage', 'triplepied'], 'technicien', null, 237],
  ['phanpy', 'Phanpy', ['Sol'], 1, 'Rempart', 'Déclencheur', [3, 3, 3, 2, 3, 1], ['charge', 'coudboue'], 'regardvif', 'donphan', 231],
  ['donphan', 'Donphan', ['Sol'], 4, 'Rempart', 'Frappeur', [5, 5, 5, 2, 3, 1], ['seisme', 'tourrapide', 'roulade'], 'fermete', null, 232],
  ['porygon', 'Porygon', ['Normal'], 2, 'Relais', 'Déclencheur', [3, 3, 3, 2, 3, 3], ['meteores', 'conversion'], 'telechargement', 'porygon2', 137],
  ['porygon2', 'Porygon2', ['Normal'], 4, 'Frappeur', 'Relais', [4, 4, 4, 3, 3, 3], ['triplattaque', 'conversion', 'conversion2'], 'adaptabilite', null, 233],
  ['pomdepik', 'Pomdepik', ['Insecte'], 1, 'Déclencheur', 'Rempart', [3, 2, 4, 1, 2, 2], ['picots', 'charge'], 'fermete', 'foretress', 204],
  ['foretress', 'Foretress', ['Insecte', 'Acier'], 4, 'Rempart', 'Déclencheur', [4, 4, 5, 1, 1, 2], ['piegederoc', 'tourrapide', 'explosion'], 'coque', null, 205],
  ['metamorph', 'Métamorph', ['Normal'], 1, 'Relais', 'Éclaireur', [3, 2, 2, 3, 3, 2], ['morphing'], 'souplesse', null, 132],
  ['qulbutoke', 'Qulbutoké', ['Psy'], 3, 'Rempart', 'Verrou', [5, 1, 3, 2, 2, 1], ['riposte', 'voilemiroir', 'destin'], 'marqueombre', null, 202],
  // v4.15: Johto
  ['hoothoot', 'Hoothoot', ['Normal', 'Vol'], 1, 'Éclaireur', 'Verrou', [3, 2, 2, 3, 4, 2], ['tornade', 'hypnose'], 'echolocation', 'noarfang', 163],
  ['noarfang', 'Noarfang', ['Normal', 'Vol'], 4, 'Verrou', 'Éclaireur', [4, 3, 3, 3, 4, 3], ['hypnose', 'volcs', 'extrasenseur'], 'nocturne', null, 164],
  ['mimigal', 'Mimigal', ['Insecte', 'Poison'], 1, 'Déclencheur', 'Verrou', [3, 2, 2, 2, 3, 2], ['secretion', 'vampirisme'], 'essaim', 'migalos', 167],
  ['migalos', 'Migalos', ['Insecte', 'Poison'], 4, 'Verrou', 'Frappeur', [4, 4, 3, 3, 3, 3], ['toilegluante', 'taillade', 'toilefatale'], 'chasseur', null, 168],
  ['loupio', 'Loupio', ['Eau', 'Électrik'], 1, 'Déclencheur', 'Rempart', [3, 2, 2, 2, 3, 2], ['bulles', 'eclair'], 'echolocation', 'lanturn', 170],
  ['lanturn', 'Lanturn', ['Eau', 'Électrik'], 4, 'Déclencheur', 'Rempart', [5, 3, 3, 2, 3, 3], ['surf', 'tonnerre', 'ondeabyssale'], 'absorbvolt', null, 171],
  ['natu', 'Natu', ['Psy', 'Vol'], 1, 'Éclaireur', 'Relais', [2, 3, 2, 3, 4, 3], ['chocmental', 'teleport'], 'synchro', 'xatu', 177],
  ['xatu', 'Xatu', ['Psy', 'Vol'], 4, 'Relais', 'Frappeur', [4, 4, 3, 3, 4, 4], ['psyko', 'teleport', 'oeilsolaire'], 'gardemagik', null, 178],
  ['marill', 'Marill', ['Eau', 'Fée'], 1, 'Rempart', 'Frappeur', [3, 2, 3, 2, 3, 1], ['bulles', 'charme'], 'isograisse', 'azumarill', 183],
  ['azumarill', 'Azumarill', ['Eau', 'Fée'], 4, 'Frappeur', 'Rempart', [5, 3, 3, 2, 3, 1], ['cascade', 'pouvoirlunaire', 'calinerie'], 'forcepure', null, 184],
  ['granivol', 'Granivol', ['Plante', 'Vol'], 1, 'Éclaireur', 'Verrou', [2, 1, 2, 4, 4, 2], ['sporecoton', 'vampigraine'], 'chlorophylle', 'floravol', 187],
  ['floravol', 'Floravol', ['Plante', 'Vol'], 2, 'Verrou', 'Éclaireur', [3, 2, 2, 4, 5, 2], ['poudredodo', 'volvie', 'tornade'], 'engrais', 'cotovol', 188],
  ['cotovol', 'Cotovol', ['Plante', 'Vol'], 3, 'Éclaireur', 'Verrou', [4, 3, 3, 5, 6, 2], ['sporecoton', 'tranchherbe', 'envolcoton'], 'ecranpoudre', null, 189],
  ['axoloto', 'Axoloto', ['Eau', 'Sol'], 1, 'Rempart', 'Déclencheur', [3, 2, 2, 2, 3, 2], ['pistolet', 'coudboue'], 'absorbeau', 'maraiste', 194],
  ['maraiste', 'Maraiste', ['Eau', 'Sol'], 4, 'Rempart', 'Verrou', [5, 3, 4, 2, 3, 2], ['seisme', 'cascade', 'bourbier'], 'inconscient', null, 195],
  ['scarhino', 'Scarhino', ['Insecte', 'Combat'], 4, 'Frappeur', 'Rempart', [4, 5, 3, 2, 3, 1], ['taillade', 'balayage', 'megacorne'], 'cran', null, 214],
  ['limagma', 'Limagma', ['Feu'], 1, 'Rempart', 'Déclencheur', [3, 2, 3, 1, 2, 2], ['flammeche', 'jetpierres'], 'armuremagma', 'volcaropod', 218],
  ['volcaropod', 'Volcaropod', ['Feu', 'Roche'], 4, 'Rempart', 'Déclencheur', [4, 3, 5, 1, 2, 2], ['lanceflammes', 'eboulement', 'carapaceardente'], 'torche', null, 219],
  ['marcacrin', 'Marcacrin', ['Glace', 'Sol'], 1, 'Frappeur', 'Rempart', [3, 2, 2, 2, 3, 1], ['poudreneige', 'coudboue'], 'regardvif', 'cochignon', 220],
  ['cochignon', 'Cochignon', ['Glace', 'Sol'], 4, 'Frappeur', 'Rempart', [5, 4, 3, 2, 3, 1], ['seisme', 'ondeboreale', 'avalanche'], 'isograisse', null, 221],
  // v4.19: Hoenn
  ['arcko', 'Arcko', ['Plante'], 1, 'Éclaireur', 'Frappeur', [3, 2, 2, 4, 4, 2], ['fouet', 'viveatt'], 'engrais', 'massko', 252],
  ['massko', 'Massko', ['Plante'], 2, 'Éclaireur', 'Frappeur', [3, 3, 2, 5, 5, 2], ['fouet', 'tranchherbe', 'viveatt'], 'souplesse', 'jungko', 253],
  ['jungko', 'Jungko', ['Plante'], 3, 'Frappeur', 'Éclaireur', [4, 4, 3, 5, 5, 2], ['tranchherbe', 'volvie', 'lamefeuille'], 'regardvif', null, 254],
  ['poussifeu', 'Poussifeu', ['Feu'], 1, 'Frappeur', 'Déclencheur', [3, 3, 2, 3, 3, 2], ['flammeche', 'griffe'], 'brasier', 'galifeu', 255],
  ['galifeu', 'Galifeu', ['Feu', 'Combat'], 2, 'Frappeur', 'Déclencheur', [4, 4, 2, 3, 4, 1], ['rouedefeu', 'poingkarate', 'griffe'], 'cran', 'brasegali', 256],
  ['brasegali', 'Braségali', ['Feu', 'Combat'], 3, 'Frappeur', 'Éclaireur', [5, 5, 3, 3, 4, 1], ['lanceflammes', 'dynamopoing', 'piedbruleur'], 'temeraire', null, 257],
  ['gobou', 'Gobou', ['Eau'], 1, 'Rempart', 'Déclencheur', [3, 2, 3, 2, 3, 2], ['pistolet', 'coudboue'], 'torrent', 'flobio', 258],
  ['flobio', 'Flobio', ['Eau', 'Sol'], 2, 'Rempart', 'Déclencheur', [4, 3, 3, 2, 3, 2], ['vibraqua', 'coudboue', 'ampleur'], 'moiteur', 'laggron', 259],
  ['laggron', 'Laggron', ['Eau', 'Sol'], 3, 'Rempart', 'Frappeur', [6, 4, 4, 2, 3, 2], ['surf', 'seisme', 'ocroupi'], 'regeforce', null, 260],
  ['tarsal', 'Tarsal', ['Psy', 'Fée'], 1, 'Relais', 'Verrou', [2, 2, 1, 3, 3, 3], ['chocmental', 'charme'], 'attention', 'kirlia', 280],
  ['kirlia', 'Kirlia', ['Psy', 'Fée'], 2, 'Relais', 'Verrou', [3, 3, 2, 3, 3, 3], ['psyko', 'teleport', 'charme'], 'synchro', 'gardevoir', 281],
  ['gardevoir', 'Gardevoir', ['Psy', 'Fée'], 3, 'Relais', 'Frappeur', [4, 4, 3, 3, 3, 4], ['psyko', 'pouvoirlunaire', 'eclatmagique'], 'gardeami', null, 282],
  ['tenefix', 'Ténéfix', ['Ténèbres', 'Spectre'], 3, 'Verrou', 'Rempart', [4, 3, 4, 2, 3, 2], ['feinte', 'ondefolie', 'ombreportee'], 'corpsmaudit', null, 302],
  ['galekid', 'Galekid', ['Acier', 'Roche'], 1, 'Rempart', 'Frappeur', [3, 2, 4, 1, 2, 1], ['griffeacier', 'jetpierres'], 'coque', 'galegon', 304],
  ['galegon', 'Galegon', ['Acier', 'Roche'], 2, 'Rempart', 'Frappeur', [4, 3, 5, 1, 2, 1], ['griffeacier', 'eboulement', 'armure'], 'fermete', 'galeking', 305],
  ['galeking', 'Galeking', ['Acier', 'Roche'], 3, 'Rempart', 'Frappeur', [6, 4, 6, 1, 2, 1], ['queuedefer', 'eboulement', 'tetedefer'], 'poingdefer', null, 306],
  ['absol', 'Absol', ['Ténèbres'], 4, 'Frappeur', 'Éclaireur', [4, 5, 2, 4, 4, 1], ['machouille', 'danselames', 'tranchenuit'], 'chasseur', null, 359],
  ['draby', 'Draby', ['Dragon'], 2, 'Frappeur', 'Rempart', [3, 3, 3, 2, 3, 2], ['dracorage', 'morsure'], 'temeraire', 'drackhaus', 371],
  ['drackhaus', 'Drackhaus', ['Dragon'], 2, 'Rempart', 'Frappeur', [4, 3, 5, 2, 2, 2], ['ouragan', 'armure', 'morsure'], 'coque', 'drattak', 372],
  ['drattak', 'Drattak', ['Dragon', 'Vol'], 4, 'Frappeur', 'Éclaireur', [5, 5, 3, 4, 5, 2], ['ouragan', 'volcs', 'piquedraco'], 'intimidation', null, 373]
].map(a => ({
  id: a[0],
  n: a[1],
  t: a[2],
  c: a[3],
  r: a[4],
  r2: a[5],
  s: a[6],
  mv: a[7],
  ability: a[8],
  nx: a[9],
  no: a[10]
}));


BY = Object.fromEntries(MON.map(m => [m.id, m]));


for (const id in BALANCING) if (BY[id]) Object.assign(BY[id], BALANCING[id]);


for (const id in KITS413) if (BY[id]) Object.assign(BY[id], KITS413[id]);


OPPONENTS413.forEach(id => {
  if (BY[id]) BY[id].isEnemy = true;
});


/* families, stages, generations */
(function () {
  const prev = {};
  MON.forEach(m => {
    const nx = m.nx === 'eevee' ? Object.values(EEVEE) : Array.isArray(m.nx) ? m.nx : m.nx ? [m.nx] : [];
    nx.forEach(x => (prev[x] = m.id));
  });
  MON.forEach(m => {
    let b = m.id,
      st = 1;
    while (prev[b]) {
      b = prev[b];
      st++;
    }
    m.base = b;
    m.st = st;
    m.prev = prev[m.id] || null;
    m.gen = m.no <= 151 ? 1 : m.no <= 251 ? 2 : 3; // Hoenn (v4.19)
  });
})();


FAMS30 = [...new Set(MON.filter(m => !m.isEnemy).map(m => m.base))];

 // v4.13: playable families
/* v4.1 · Pokémon illustrations in the medallions, from the first display */
PKT = new WeakMap();


MON.forEach(m => PKT.set(m.t, m.id));
}
