// Save-data migration for the English property names (format version 2).
// Older saves (localStorage, cloud, exported codes, friend/challenge share codes) used French
// property names. migrateKeys() renames them recursively; it runs once over localStorage at
// startup, before the engine loads, and on every save or code that comes from outside.

/** Old (French) property name → current name. Generated from the property rename; do not edit. */
export const RENAMED_KEYS = {
  __carte471: '__map471', __combat473: '__battle473', __fr470: '__regional470',
  __habillage472: '__styling472', __monde473: '__world473', __ombre470: '__shadow470',
  __plateau471: '__board471', __son473: '__sound473', _ondes: '_waves', _pv449: '_hp449', achat: 'purchase',
  acteur430: 'actor430', actif: 'active', affaibli: 'weakened', aJouer: 'toPlay', amis: 'friends',
  anneau: 'ringTurns', appat: 'bait', apprises: 'learnedTms', apresActivation: 'afterActivation',
  apresJeton: 'afterToken', arenes431: 'gyms431', arrose: 'watered', au: 'author', autre: 'other',
  avant: 'before', avantBandeau: 'beforeBanner', avantChoixRoute: 'beforeRouteChoice',
  avantFinCombat: 'beforeBattleEnd', avantFinManche: 'beforeRoundEnd', avantJeton: 'beforeToken',
  avantLancement: 'beforeLaunch', avantPlateau: 'beforeBoard', avantPresentation: 'beforePresentation',
  avantRendu: 'beforeRender', avantVerdict: 'beforeVerdict', barrePv: 'hpBar', bdgVu433: 'badgeSeen433',
  bon: 'ideal', bouton: 'actionButton', bru: 'burn', butin430: 'loot430', cadeau: 'giftFlag',
  cadeaux: 'giftsClaimed', capacite: 'moveId', capt: 'caughtCount', car: 'temperament',
  caracteres: 'characters', caresse: 'petting', Carte: 'cardComponent', cat: 'category', chef: 'leader',
  choix: 'choice', choixRoute: 'routeChoice', cible: 'targetRef', cielBan: 'skyBanner', cine: 'cutscene',
  cle: 'keyItem', cles: 'keyList', cloue: 'pinned', coeurs: 'hearts', collecter: 'collect',
  colosse: 'colossus', colosses: 'colossi', combinerModificateurs: 'combineModifiers',
  comp417: 'companion417', cond: 'condition', connu: 'known', couple: 'pair', cout: 'upgradeCost',
  crans: 'stageShifts', creerEtat: 'createState', cts: 'tms', cumul: 'totals', cyc: 'cycle', dech: 'discard',
  deco: 'decor', defiBonus: 'challengeBonus', defis: 'challenges', degats: 'damage', deja: 'already',
  demarrer: 'begin', desob: 'disobedience', dest: 'destinationId', dipl428: 'diplomas428',
  dispo: 'available', dqMake: 'makeDailyChallenge', dqViol: 'dailyViolation', duree: 'duration',
  ech: 'echoes', ecrire: 'write', ennemi: 'isEnemy', entree: 'entrance', envoyer: 'send', epargne: 'spared',
  equip: 'equipment', equipe: 'teamNames', essai: 'attempt', etape: 'stepOf', etat: 'status',
  evos: 'awakenings', fams: 'families', ferm: 'sturdy', fermer: 'closeAttrs', feterBadge: 'celebrateBadge',
  fige: 'frozen', file: 'turnQueue', fileManche: 'queueRound', finCombat: 'battleEnd', finDeTour: 'endTurn',
  finir: 'finishUp', fixe: 'fixed', fixe431: 'fixed431', fondu: 'fade', forfait433: 'forfeit433',
  fos: 'fossils', fournir: 'provide', fuite: 'flee', fuite416: 'flee416', gagnes: 'winCount',
  gerbe: 'confetti', haut: 'isTop', herit: 'inherited', heure: 'timeOfDay', hist: 'history',
  histoireFinie: 'storyDone', hum: 'mood', ifile: 'queueIndex', interdit: 'forbidden', jeton: 'token',
  joues: 'played', joueur: 'player', jourInv: 'dayInv', koT: 'failText', lancement: 'launch',
  libelle: 'labelText', libres: 'freeSlots', lignes: 'lines', lire: 'readValue', loupe: 'magnifier',
  mere: 'mother', mort: 'fallen', mutEntr: 'trainingMutators', mutMov: 'mutatorMove', nom: 'displayName',
  nom1: 'name1', nom2: 'name2', noms: 'names', nouv: 'isNew', objN: 'itemsUsed', obst: 'obstacles',
  oeuf416: 'egg416', okT: 'successText', omb: 'shadowState', omb470: 'shadow470', ordre: 'order',
  ordreDuTour: 'turnOrder', OrdreParPhases: 'OrderByPhases', OrdreParVitesse: 'OrderBySpeed',
  ordrePhase: 'phaseOrder', ouvrir: 'openOverlay', partage: 'canShare', pas: 'stepCount', peches: 'catches',
  perdu: 'isLost', pere: 'father', peut: 'canAct', plateauRendu: 'boardRendered', plein: 'full',
  potager: 'garden', pret: 'ready', pret429: 'ready429', prevoir: 'forecast', priorite: 'priority',
  pris: 'isTaken', prix: 'price', prochain: 'nextUnit', programmerCharge: 'scheduleCharge',
  progres: 'progress', psn: 'poisoned', qTab: 'questTab', quete: 'questSteps', qui: 'giver',
  rang: 'rankIndex', rebatir: 'rebuild', reflet: 'reflect', refusLancement: 'launchRefusal',
  regionDe: 'regionOf', regle429: 'rule429', rel: 'relics', rel431: 'relics431', relais433: 'relay433',
  relance: 'retrigger', rempli: 'filled', rencontreRoute: 'routeEncounter', rend: 'renderCard',
  rendu: 'rendered', reso: 'resonant', reso417: 'resonance417', reso417e: 'resonance417e',
  resoMsg: 'resonanceMsg', resoPb: 'resonancePb', restants: 'remaining', resultat: 'battleResult',
  revenu: 'returned', riv429: 'rivals429', roulN: 'rolloutCount', roulR: 'rolloutRound',
  rst478: 'restart478', sacC: 'bagCategory', sacV: 'bagView', safariPris: 'safariTaken', saison: 'season',
  sansProgres431: 'noProgress431', semaineDef: 'weekDef', serie: 'runStreak', sous: 'underText',
  succes: 'achievements', svBusy: 'saveBusy', svCloud: 'saveCloud', tactique: 'tactics', taille: 'sizeValue',
  tal: 'ability', tal432: 'ability432', terr: 'terrainList', texte: 'bodyText', tirage: 'tiebreak',
  tombes: 'graves', tournoi417: 'tournament417', tours: 'roundCount', tous: 'forAll', tpv: 'hpText',
  trierParInitiative: 'sortByInitiative', unite: 'unitRef', unitesVivantes: 'aliveUnits',
  valeur: 'amountValue', verifier: 'verify', vfile: 'queueSpeeds', vies: 'lives', vigil: 'vigilance',
  vitrine: 'showcase', vivant: 'livingBoard', voix: 'voice', vu: 'seenFlags',
};

const VERSION_KEY = 'res-keys';
const VERSION = '2';

// Dictionaries keyed by content ids (achievement and tip ids): their keys are data, not
// property names, and some ids look like renamed fields (amis, vigil, reso…).
const ID_DICTS = new Set(['succes', 'achievements', 'tips429']);
// localStorage entries that are such a dictionary at top level.
const ID_DICT_ENTRIES = new Set(['res-tips']);

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Returns a copy of value with every renamed property key updated. Arrays and primitives are kept. */
export function migrateKeys(value) {
  if (Array.isArray(value)) return value.map(migrateKeys);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const k of Object.keys(value)) {
    const nk = has(RENAMED_KEYS, k) ? RENAMED_KEYS[k] : k;
    if (nk !== k && has(value, nk)) continue; // already migrated: the new key wins
    const v = value[k];
    out[nk] = ID_DICTS.has(k) || ID_DICTS.has(nk) ? migrateDictValues(v) : migrateKeys(v);
  }
  return out;
}

// An id-keyed dictionary keeps its keys; its values are migrated normally.
function migrateDictValues(dict) {
  if (!dict || typeof dict !== 'object' || Array.isArray(dict)) return migrateKeys(dict);
  const out = {};
  for (const k of Object.keys(dict)) out[k] = migrateKeys(dict[k]);
  return out;
}

/** Migrates every JSON entry the game keeps in localStorage, once. */
export function migrateStorage() {
  try {
    if (localStorage.getItem(VERSION_KEY) === VERSION) return;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('res') || ID_DICT_ENTRIES.has(k)) continue;
      const raw = localStorage.getItem(k);
      if (!raw || (raw[0] !== '{' && raw[0] !== '[')) continue;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue; // not JSON: a plain string value
      }
      const next = JSON.stringify(migrateKeys(parsed));
      if (next !== raw) localStorage.setItem(k, next);
    }
    localStorage.setItem(VERSION_KEY, VERSION);
  } catch (e) {
    console.warn('[Resonance] save migration failed', e);
  }
}
