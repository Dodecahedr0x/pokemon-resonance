import { POKEMON, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { formatNumber } from '../state/economy.js';
import { PL } from '../world/map.js';
import { PLACES_J } from '../world/johto.js';
import { PLACES_H } from '../world/hoenn.js';
import { SCENES } from '../progression/story-dialogues.js';
import { FAMILY_REGION_NAMES } from '../world/catch-anywhere.js';
import { adaptRival } from './rival-board-themes.js';
import { LEGS } from './legendaries.js';

/* The rival Kael Ferrand: four Kanto battles (added in v4.4), his return in Johto and Hoenn
   and the Echoes of Dissonance (added in v4.29). */

export const RIVAL = { n: 'Kael Ferrand', t: 'votre rival' };

/* his partner has the advantage over yours, as in the games */
export const RIVAL_LINE = {
  bulbizarre: ['salameche', 'reptincel', 'dracaufeu'],
  salameche: ['carapuce', 'carabaffe', 'tortank'],
  carapuce: ['bulbizarre', 'herbizarre', 'florizarre'],
  germignon: ['hericendre', 'feurisson', 'typhlosion'],
  hericendre: ['kaiminus', 'crocrodil', 'aligatueur'],
  kaiminus: ['germignon', 'macronium', 'meganium'],
};

export const RIVAL_KEYS = ['rv1', 'rv2', 'rv3', 'rv4'];

export const RIVAL_STEPS = [
  {
    after: 2,
    lv: 20,
    hb: 7,
    pb: 1,
    st: 0,
    team: ['nosferapti', 'abra'],
    q: 'Deux badges ? Pas mal. Mais mon partenaire et moi, on a choisi le même jour que toi. Montre-moi ce que tu vaux.',
    w: 'Tch… Ton équipe tient mieux que je pensais. La prochaine fois, je serai prêt.',
    l: 'Tu vois ? Choisir le bon type, c’est déjà la moitié du combat.',
  },
  {
    after: 4,
    lv: 28,
    hb: 13,
    pb: 2,
    st: 1,
    team: ['nosferalto', 'kadabra', 'malosse'],
    q: 'Mon partenaire s’est éveillé. Le tien aussi, j’espère. Sinon, ça va être rapide.',
    w: 'Encore toi… D’accord. Tu es vraiment devenu fort.',
    l: 'Tu t’es éveillé trop tard. Le timing, c’est tout.',
  },
  {
    after: 6,
    lv: 36,
    hb: 20,
    pb: 3,
    st: 1,
    team: ['nosferalto', 'kadabra', 'demolosse', 'minidraco'],
    q: 'J’ai étudié chacun de tes combats. Cette fois, j’ai un plan pour chacun de tes Pokémon.',
    w: 'Mon plan était parfait. C’est toi qui ne l’étais pas… enfin, qui l’étais trop.',
    l: 'Un plan pour chaque Pokémon. Je te l’avais dit.',
  },
  {
    after: 8,
    lv: 44,
    hb: 28,
    pb: 4,
    st: 2,
    team: ['nostenfer', 'alakazam', 'demolosse', 'draco'],
    q: 'Huit badges, toi aussi. Avant la Ligue, il reste une chose à régler : lequel de nous deux est le meilleur.',
    w: 'Va. Bats le Conseil 4. Et ne perds pas contre quelqu’un d’autre que moi.',
    l: 'La Ligue attendra. Reviens quand tu seras prêt à me battre.',
  },
];

export const RIVAL_POS = [
  [6, 2],
  [7, 1],
  [6, 4],
  [7, 3],
  [7, 5],
];

export const rivalIdx = k => RIVAL_KEYS.indexOf(k);

export function rivalStarter() {
  const b = PROFILE.box && PROFILE.box[0];
  return RIVAL_LINE[b] ? b : 'kaiminus';
}

export function rivalBuild() {
  if (RIVAL_CHALLENGES) {
    buildRival();
  } // Kael in Johto and Hoenn follows your partner (v4.29)
  const line = RIVAL_LINE[rivalStarter()];
  RIVAL_STEPS.forEach((R, i) => {
    const ace = line[R.st],
      k = RIVAL_KEYS[i];
    SCEN[k] = {
      n: `Rival · ${RIVAL.n}`,
      lvl: `Rival · combat ${i + 1} sur 4`,
      lim: 10,
      time: i % 2 ? 'nuit' : 'jour',
      bio: i < 2 ? 'gue' : 'roche',
      water: i % 2 ? ['4,2', '4,3'] : ['5,0'],
      rock: i < 2 ? ['3,4'] : ['3,1', '4,4'],
      hb: R.hb,
      pb: R.pb,
      lv: R.lv,
      rival: i + 1,
      style: 'rival',
      at: POKEMON[ace].t[0],
      d: `Kael revient avec ${POKEMON[ace].n}, qui a l’avantage du type sur votre partenaire de départ. Son équipe grandit en même temps que la vôtre.`,
      foes: [ace, ...R.team].map((id, j) => [id, RIVAL_POS[j]]),
    };
    OBST[k] = i < 2 ? { grass: ['2,2', '2,3'] } : { pil: ['4,2'], sand: ['2,1', '2,4'] };
  });
  try {
    adaptRival(); // Kael adapts to your team (v4.55)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- Kael in Johto and Hoenn, the Echoes of Dissonance (v4.29) ---------- */
export const RIVAL_CHALLENGES = {
  rv5: {
    reg: 2,
    after: 4,
    n: 'Rival · Kael à Johto',
    base: 'j5',
    team: ['noarfang', 'azumarill', 'demolosse'],
    water: ['5,0'],
    rock: ['3,1', '4,4'],
    obstacles: { pil: ['4,2'], sand: ['2,1', '2,4'] },
    x: 560,
    y: 330,
    rew: [5000, 25],
    q: 'Johto m’a endurci. Toi, tu as juste collectionné des badges. On va voir lequel de nous deux a vraiment progressé.',
    w: 'Encore toi… D’accord. Je file à Hoenn. Là-bas, personne ne te connaît.',
    l: 'Tu vois ? À Johto, c’est moi qui fais la loi.',
  },
  rv6: {
    reg: 3,
    after: 4,
    n: 'Rival · Kael à Hoenn',
    base: 'h5',
    team: ['galeking', 'drattak', 'noarfang'],
    water: ['4,0', '5,5'],
    rock: ['3,2'],
    obstacles: { pil: ['4,3'], grass: ['2,2', '2,3'] },
    x: 440,
    y: 470,
    rew: [6500, 30],
    q: 'Galeking, Drattak… et mon partenaire du premier jour. Cette fois, on ne joue plus.',
    w: '…Tu es meilleur que moi. Pour l’instant. Le Maître de Hoenn t’attend : ne perds pas contre lui.',
    l: 'Hoenn, c’est mon terrain maintenant.',
  },
  hd429: {
    reg: 3,
    after: 6,
    n: 'Les Échos de la Dissonance',
    base: 'h7',
    team: ['absol', 'tenefix', 'nostenfer', 'demolosse'],
    water: [],
    rock: ['3,1', '3,4'],
    obstacles: { pil: ['4,2'], grass: ['2,1', '2,4'] },
    x: 715,
    y: 445,
    rew: [7000, 35],
    who: 'Sirène',
    t: 'la voix des Échos',
    q: 'Les Échos n’obéissent qu’à une voix : la mienne. Notre brouilleur portera la Dissonance jusqu’au Plateau.',
    w: 'Les Échos se taisent… Cobalt avait tort. On ne contrôle pas la Résonance.',
    l: 'Écoute ce silence. Plus un losange, plus un Éveil.',
  },
};

export function rivalAce() {
  const L0 = RIVAL_LINE[rivalStarter()];
  return L0 ? L0[2] : 'aligatueur';
}

export function buildRival() {
  Object.entries(RIVAL_CHALLENGES).forEach(([k, R]) => {
    const b = SCEN[R.base];
    if (!b) {
      return;
    }
    const dis = k === 'hd429',
      team = (dis ? R.team : [rivalAce(), ...R.team]).filter(id => POKEMON[id]);
    SCEN[k] = {
      n: R.n,
      lvl: dis ? 'Hoenn · Dissonance' : `Rival · ${FAMILY_REGION_NAMES[R.reg]}`,
      lim: 11,
      time: dis ? 'nuit' : 'jour',
      bio: dis ? 'roche' : b.bio,
      rule: dis ? 'jbrouille' : undefined,
      water: R.water,
      rock: R.rock,
      hb: Math.round((b.hb || 20) * 1.08),
      pb: (b.pb || 3) + 1,
      lv: (b.lv || 50) + 2,
      style: dis ? 'boss' : 'rival',
      at: POKEMON[team[0]].t[0],
      rivalFight: k,
      d: dis
        ? 'Une cellule oubliée de la Dissonance brouille Hoenn : en fin de manche, votre Pokémon le plus chargé perd 1 losange. Éveillez vite vos Pokémon !'
        : `Kael revient avec ${POKEMON[team[0]].n} et une équipe de ${FAMILY_REGION_NAMES[R.reg]}. Il a progressé autant que vous.`,
      foes: team.map((id, j) => [id, RIVAL_POS[j]]),
    };
    OBST[k] = R.obstacles;
  });
}

export function lockRival(D) {
  if (!RIVAL_CHALLENGES || !D) {
    return null;
  }
  const R = RIVAL_CHALLENGES[D.rivalFight];
  if (!R) {
    return null;
  }
  const n = (R.reg === 2 ? PROFILE.johto : PROFILE.hoenn) || [];
  if (n.length < R.after) {
    return `${D.rivalFight === 'hd429' ? 'Les Échos se montreront' : 'Kael vous attend'} après ${R.after} badges de ${FAMILY_REGION_NAMES[R.reg]}.`;
  }
  return null;
}

export function scenarioLeader(sc) {
  if (!RIVAL_CHALLENGES) {
    return null;
  }
  const D = SCEN[sc];
  if (!D) {
    return null;
  }
  if (D.captureLegend) {
    const lg = LEGS.find(x => x.id === D.captureLegend);
    return lg
      ? { n: lg.n, t: lg.title, q: `${lg.n} ne fuit plus. Il vous observe… et vous attend.`, w: lg.w, l: lg.l }
      : null;
  }
  const R = RIVAL_CHALLENGES[sc];
  if (!R) {
    return null;
  }
  return sc === 'hd429'
    ? { n: R.who, t: R.t, q: R.q, w: R.w, l: R.l }
    : Object.assign({}, RIVAL, { q: R.q, w: R.w, l: R.l });
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  buildRival();

  PLACES_J.push({
    id: 'rv5',
    x: RIVAL_CHALLENGES.rv5.x,
    y: RIVAL_CHALLENGES.rv5.y,
    n: 'Kael',
    s: 'Rival · après 4 badges de Johto',
    grp: 'aventure',
    j: 1,
  });

  PLACES_H.push({
    id: 'rv6',
    x: RIVAL_CHALLENGES.rv6.x,
    y: RIVAL_CHALLENGES.rv6.y,
    n: 'Kael',
    s: 'Rival · après 4 badges de Hoenn',
    grp: 'aventure',
    j: 1,
  });

  PLACES_H.push({
    id: 'hd429',
    x: RIVAL_CHALLENGES.hd429.x,
    y: RIVAL_CHALLENGES.hd429.y,
    n: 'Grotte des Échos',
    s: 'Dissonance · Sirène',
    grp: 'aventure',
    j: 1,
  });

  [...PLACES_J, ...PLACES_H].forEach(p => (PL[p.id] = p));

  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (!win || !D.rivalFight || (PROFILE.rivalsMet || []).includes(D.rivalFight)) {
      return null;
    }
    PROFILE.rivalsMet = [...(PROFILE.rivalsMet || []), D.rivalFight];
    rew.rivalsMet = D.rivalFight;
    return RIVAL_CHALLENGES[D.rivalFight].rew;
  });

  HOOKS.battleResult.push(r =>
    r.rivalsMet
      ? `<div class="result-list"><h4>${r.rivalsMet === 'hd429' ? 'Dissonance' : 'Rival'}</h4><div class="result-row"><span>${r.rivalsMet === 'hd429' ? 'Les Échos de la Dissonance sont réduits au silence.' : `Kael est battu à ${FAMILY_REGION_NAMES[RIVAL_CHALLENGES[r.rivalsMet].reg]}.`}</span><b>+${formatNumber(RIVAL_CHALLENGES[r.rivalsMet].rew[0])} ₽ · +${RIVAL_CHALLENGES[r.rivalsMet].rew[1]} Éclats</b></div></div>`
      : ''
  );

  Object.assign(SCENES, {
    rv5: [
      ['kael', 'Te voilà à Johto aussi ? J’ai traversé la région à pied pendant que tu prenais le bateau.'],
      ['kael', 'Mon équipe a changé. J’ai capturé ce que Johto avait de plus coriace.'],
      [
        'prof',
        'Kael a beaucoup progressé… Frappez la même cible à plusieurs : les notes de Résonance feront la différence.',
      ],
    ],
    rv6: [
      ['kael', 'Je t’avais dit que je partais à Hoenn. Je n’avais pas dit que je t’attendrais.'],
      ['kael', 'Cette fois, mon partenaire du premier jour est au sommet de sa forme.'],
      ['prof', 'C’est son meilleur niveau. Ne le laissez pas encercler vos Pokémon !'],
    ],
    hd429: [
      [
        'vesper',
        'Attends ! C’est moi, Vesper. J’ai quitté la Dissonance après Johto… mais certains n’ont jamais reçu l’ordre d’arrêter.',
      ],
      ['sirene', 'Les Échos n’obéissent qu’à une voix : la mienne.'],
      [
        'vesper',
        'Son brouilleur vide les losanges de vos Pokémon à chaque fin de manche. Éveillez-les dès que possible !',
      ],
    ],
  });
}
