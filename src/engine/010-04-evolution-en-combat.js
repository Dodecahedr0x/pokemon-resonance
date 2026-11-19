/* Section d'origine : 04-evolution-en-combat.js */

import { MON, NOTES } from './009-03-pokemon.js';

export let RECRUIT;


/* ===================== v0.8 : l’évolution se décide en combat ===================== */
export const BUDGET = 12;


const BASECOST = {
  bulbizarre: 1,
  salameche: 1, // v4.12 : même coût que les autres starters
  carapuce: 1,
  chenipan: 1,
  roucool: 1,
  pichu: 1,
  melo: 1,
  nosferapti: 1,
  psykokwak: 2,
  caninos: 2,
  ptitard: 1,
  abra: 1,
  machoc: 1,
  racaillou: 1,
  magneti: 2,
  kokiyas: 1,
  fantominus: 2,
  onix: 3, // v4.12 : le meilleur Rempart du jeu, 3 PC
  insecateur: 3,
  magicarpe: 1,
  lokhlass: 5, // v4.12 : Blizzard en zone + Absorb Eau, sans évolution à attendre
  evoli: 2,
  ronflex: 4,
  minidraco: 2, // v4.12 : la lignée des Dragons coûtait trop cher au départ
  germignon: 1,
  hericendre: 1,
  kaiminus: 1,
  wattouat: 1,
  malosse: 2, // v4.12 : Démolosse au bout, 2 PC
  embrylex: 2,
  // v4.13
  ramoloss: 2,
  debugant: 1,
  phanpy: 1,
  porygon: 2,
  pomdepik: 1,
  metamorph: 1,
  qulbutoke: 3,
  // v4.15
  hoothoot: 1,
  mimigal: 1,
  loupio: 1,
  natu: 1,
  marill: 1,
  granivol: 1,
  axoloto: 1,
  limagma: 1,
  marcacrin: 1,
  // v4.19
  arcko: 1,
  poussifeu: 1,
  gobou: 1,
  tarsal: 1,
  galekid: 1,
  draby: 2
};

export const ARR = {
  // v4.19
  massko: [[{ k: 'ring', mk: 'enracine' }], 'des lianes jaillissent autour de lui.'],
  jungko: [[{ k: 'ring', mk: 'enracine' }, { k: 'boost' }], 'la forêt l’accueille : il est Renforcé.'],
  galifeu: [[{ k: 'ring', mk: 'brulant' }], 'ses coups de pied embrasent le sol.'],
  brasegali: [[{ k: 'ring', mk: 'brulant' }, { k: 'boost' }], 'ses poignets s’enflamment : il est Renforcé.'],
  flobio: [[{ k: 'ring', mk: 'trempe' }], 'la boue gicle autour de lui.'],
  laggron: [[{ k: 'ring', mk: 'trempe' }, { k: 'guard' }], 'il s’ancre dans la vase : +2 Garde.'],
  kirlia: [[{ k: 'guard', who: 'allies' }], 'sa danse protège ses voisins : +2 Garde.'],
  gardevoir: [[{ k: 'guard', who: 'allies' }, { k: 'confuse' }], 'un voile psychique protège ses alliés et trouble ses ennemis.'],
  galegon: [[{ k: 'guard' }], 'sa carapace durcit : +2 Garde.'],
  galeking: [[{ k: 'roar', v: 1 }, { k: 'guard' }], 'il rugit et repousse ses voisins.'],
  drackhaus: [[{ k: 'guard' }], 'il se referme dans sa coquille : +2 Garde.'],
  drattak: [[{ k: 'roar', v: 1 }, { k: 'boost' }], 'il prend son envol dans un rugissement.'],
  // v4.15
  noarfang: [[{ k: 'confuse' }], 'son regard désoriente ses voisins.'],
  migalos: [[{ k: 'root' }], 'des fils de soie collent ses voisins au sol.'],
  lanturn: [[{ k: 'ring', mk: 'charge' }], 'ses antennes chargent les cases voisines.'],
  xatu: [[{ k: 'guard', who: 'allies' }], 'il a vu le coup venir : +2 Garde à ses voisins.'],
  azumarill: [[{ k: 'ring', mk: 'trempe' }, { k: 'boost' }], 'une bulle éclate : il est Renforcé.'],
  floravol: [[{ k: 'ring', mk: 'enracine' }], 'ses spores enracinent les cases voisines.'],
  cotovol: [[{ k: 'roar', v: 1 }], 'une bourrasque de coton repousse ses voisins.'],
  maraiste: [[{ k: 'ring', mk: 'fissure' }], 'le sol se change en bourbier autour de lui.'],
  volcaropod: [[{ k: 'ring', mk: 'brulant' }, { k: 'guard' }], 'sa coquille durcit : +2 Garde, cases voisines Brûlantes.'],
  cochignon: [[{ k: 'ring', mk: 'givre' }], 'le sol gèle autour de lui.'],
  // v4.13
  flagadoss: [[{ k: 'ring', mk: 'trempe' }, { k: 'guard' }], 'une vague l’enveloppe : +2 Garde.'],
  roigada: [[{ k: 'guard', who: 'allies' }], 'il protège sa cour : +2 Garde à ses voisins.'],
  kicklee: [[{ k: 'roar', v: 1 }], 'un coup de pied repousse les adversaires au contact.'],
  tygnon: [[{ k: 'guard' }], 'garde levée : +2 Garde.'],
  kapoera: [[{ k: 'confuse' }], 'il tournoie et désoriente ses voisins.'],
  donphan: [[{ k: 'ring', mk: 'fissure' }], 'le sol se fissure autour de lui.'],
  porygon2: [[{ k: 'boost' }], 'mise à jour terminée : ses attaques sont renforcées.'],
  foretress: [[{ k: 'guard' }], 'sa coquille d’acier se referme : +2 Garde.'],
  herbizarre: [[{ k: 'ring', mk: 'enracine' }], 'des racines jaillissent autour de lui.'],
  florizarre: [[{ k: 'wx', w: 'soleil' }], 'le soleil perce pendant 5 manches.'],
  reptincel: [[{ k: 'ring', mk: 'brulant' }], 'les cases voisines s’embrasent.'],
  dracaufeu: [
    [
      { k: 'roar', v: 1 },
      { k: 'ring', mk: 'brulant' }
    ],
    'un rugissement de flammes repousse les ennemis voisins.'
  ],
  carabaffe: [[{ k: 'ring', mk: 'trempe' }], 'une vague trempe les cases voisines.'],
  tortank: [[{ k: 'guard', who: 'allies' }], 'ses canons couvrent les alliés voisins : +2 Garde.'],
  chrysacier: [[{ k: 'guard' }], 'sa carapace durcit : +2 Garde.'],
  papilusion: [[{ k: 'sleep' }], 'une dernière poudre endort les ennemis voisins.'],
  roucoups: [[{ k: 'roar', v: 1 }], 'une bourrasque repousse les ennemis voisins.'],
  roucarnage: [[{ k: 'roar', v: 2 }], 'une tempête repousse les ennemis voisins de 2 cases.'],
  pikachu: [[{ k: 'ring', mk: 'charge' }], 'l’air autour de lui se charge.'],
  raichu: [[{ k: 'ring', mk: 'charge' }, { k: 'boost' }], 'décharge autour de lui, dégâts ×1,5 pendant 2 manches.'],
  melofee: [[{ k: 'heal', p: 0.2, r: 1 }], 'une lumière lunaire soigne les alliés voisins.'],
  melodelfe: [[{ k: 'heal', p: 0.25, r: 2 }], 'la pleine lune soigne les alliés à 2 cases.'],
  nosferalto: [[{ k: 'fog' }], 'un nuage noir couvre la zone.'],
  nostenfer: [[{ k: 'confuse' }], 'ses ultrasons détournent les ennemis voisins.'],
  akwakwak: [[{ k: 'ring', mk: 'trempe' }], 'une onde d’eau trempe les cases voisines.'],
  arcanin: [[{ k: 'roar', v: 1 }, { k: 'boost' }], 'un hurlement repousse, dégâts ×1,5.'],
  tetarte: [[{ k: 'ring', mk: 'trempe' }], 'une spirale d’eau trempe les cases voisines.'],
  tartard: [[{ k: 'boost' }], 'posture de combat : dégâts ×1,5 pendant 2 manches.'],
  tarpaud: [[{ k: 'ring', mk: 'trempe' }], 'la pluie tombe et trempe les cases voisines.'],
  kadabra: [[{ k: 'roar', v: 2 }], 'une onde psychique repousse les ennemis voisins.'],
  alakazam: [[{ k: 'confuse' }], 'il brouille les esprits : les ennemis voisins changent de cible.'],
  machopeur: [[{ k: 'boost' }], 'dégâts ×1,5 pendant 2 manches.'],
  mackogneur: [[{ k: 'boost' }, { k: 'guard' }], 'quatre bras : dégâts ×1,5 et +2 Garde.'],
  gravalanch: [[{ k: 'ring', mk: 'fissure' }], 'le sol se fissure autour de lui.'],
  grolem: [[{ k: 'ring', mk: 'fissure' }, { k: 'guard' }], 'le sol se fissure, +2 Garde.'],
  magneton: [[{ k: 'ring', mk: 'charge' }], 'un champ magnétique charge les cases voisines.'],
  crustabri: [[{ k: 'ring', mk: 'givre' }, { k: 'guard' }], 'le givre recouvre les cases voisines, +2 Garde.'],
  spectrum: [[{ k: 'fog' }], 'les ombres couvrent la zone.'],
  ectoplasma: [[{ k: 'sleep' }], 'un regard hypnotique endort les ennemis voisins.'],
  steelix: [[{ k: 'ring', mk: 'fissure' }, { k: 'guard' }], 'son corps d’acier fend le sol, +2 Garde.'],
  cizayox: [[{ k: 'boost' }, { k: 'guard' }], 'pinces d’acier : dégâts ×1,5 et +2 Garde.'],
  leviator: [
    [
      { k: 'roar', v: 1 },
      { k: 'ring', mk: 'trempe' }
    ],
    'une colère déchaînée repousse et trempe les alentours.'
  ],
  aquali: [[{ k: 'ring', mk: 'trempe' }], 'l’eau monte autour de lui.'],
  voltali: [[{ k: 'ring', mk: 'charge' }], 'l’air crépite autour de lui.'],
  pyroli: [[{ k: 'ring', mk: 'brulant' }], 'les flammes l’entourent.'],
  mentali: [[{ k: 'roar', v: 2 }], 'une onde psychique repousse les ennemis voisins.'],
  noctali: [[{ k: 'root', v: 2 }], 'ses anneaux brillent : les ennemis voisins sont figés.'],
  draco: [[{ k: 'ring', mk: 'charge' }], 'son orbe charge les cases voisines.'],
  dracolosse: [[{ k: 'roar', v: 2 }], 'un battement d’ailes repousse les ennemis de 2 cases.'],
  macronium: [[{ k: 'guard', who: 'allies' }], 'un parfum protecteur : +2 Garde aux alliés voisins.'],
  meganium: [[{ k: 'heal', p: 0.2, r: 2 }], 'un parfum apaisant soigne les alliés à 2 cases.'],
  feurisson: [[{ k: 'ring', mk: 'brulant' }], 'ses flammes dorsales embrasent les cases voisines.'],
  typhlosion: [
    [
      { k: 'wx', w: 'soleil' },
      { k: 'ring', mk: 'brulant' }
    ],
    'une explosion de flammes fait briller le soleil.'
  ],
  crocrodil: [[{ k: 'root', v: 2 }], 'ses crocs bloquent les ennemis voisins.'],
  aligatueur: [[{ k: 'roar', v: 1 }, { k: 'boost' }], 'un rugissement repousse, dégâts ×1,5.'],
  lainergie: [[{ k: 'ring', mk: 'charge' }], 'sa laine charge les cases voisines.'],
  pharamp: [[{ k: 'ring', mk: 'charge' }, { k: 'guard' }], 'sa queue illumine le terrain, +2 Garde.'],
  demolosse: [
    [
      { k: 'ring', mk: 'brulant' },
      { k: 'roar', v: 1 }
    ],
    'un hurlement de feu repousse et embrase.'
  ],
  ymphect: [[{ k: 'ring', mk: 'fissure' }, { k: 'guard' }], 'sa coquille fend le sol, +2 Garde.'],
  tyranocif: [[{ k: 'roar', v: 1 }], 'il rugit et lève une tempête de sable.']
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

MON.forEach(m => {
  if (BASECOST[m.id] != null) m.c = BASECOST[m.id];
});


RECRUIT = MON.filter(m => m.st === 1 && !m.ennemi);
 // v4.13 : sans les familles devenues adversaires

Object.assign(NOTES, {
  magicarpe: 'Recrutez-le pour 1 point. Gardez-le en vie trois manches : son Éveil en Léviator renverse le combat.',
  chenipan: 'Sécrétion ralentit l’ennemi. Évoluer, c’est renoncer à ce contrôle pour la puissance de Papilusion.',
  tetarte: 'Choix décisif à l’Éveil : Tartard, combattant, ou Tarpaud, qui fait tomber la pluie.'
});
}
