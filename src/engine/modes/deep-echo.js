// Deep Echo (Camp › Écho profond, added in v4.31): 8-floor branching expedition, HP carried over,
// a single life, relics, merchant and events.
import { POKEMON, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { goTo } from '../core/navigation.js';
import { squad } from '../team/team.js';
import { EMAX } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { B, __set_scSel, backToPrep, chooseBattle, launch } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { formatNumber } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { PROGRESS_KEYS, fingerprintRandom } from './weekly-challenge.js';
import { PANTHEON_STORE, pantheonEngrave } from '../progression/pantheon.js';
import { renderCampPage } from './camp-challenges.js';

// read by the Camp tabs (src/screens/camp/tabs)
export { RELIC_DEFS, ECHO_NODES, ECHO_EVENTS, randomRelic };

export function echoRun() {
  return PROFILE.echo431 && PROFILE.echo431.run;
}

function echoMap(seed) {
  const r = fingerprintRandom('echo-' + seed),
    T = ['combat', 'combat', 'elite', 'soin', 'marchand', 'evenement'],
    map = [];
  for (let f = 0; f < 8; f++) {
    if (f === 7) {
      map.push(['boss']);
    } else if (f === 0) {
      map.push(['combat', 'combat']);
    } else {
      const n = r() < 0.5 ? 2 : 3,
        nodes = [];
      while (nodes.length < n) {
        const t = T[Math.floor(r() * T.length)];
        if (nodes.filter(x => x === t).length < (t === 'combat' ? 2 : 1)) {
          nodes.push(t);
        }
      }
      if (!nodes.includes('combat') && !nodes.includes('elite')) {
        nodes[0] = 'combat';
      }
      map.push(nodes);
    }
  }
  return map;
}

function echoLeave() {
  const team = squad.slice(0, 4).filter(id => POKEMON[id]);
  if (team.length < 2) {
    return toast('Il faut au moins 2 Pokémon dans l’équipe.');
  }
  const X = (PROFILE.echo431 = PROFILE.echo431 || { best: 0, wins: 0, run: null }),
    seed = Math.floor(Math.random() * 2147483647);
  X.run = {
    seed,
    f: 0,
    team: team.map(id => [id, 1]),
    relics: [],
    echoes: 20,
    map: echoMap(seed),
    path: [],
    cur: -1,
    pv: 0,
    ev: '',
  };
  queueSave();
  toast('L’Écho profond s’ouvre : 8 étages, une seule vie.');
  renderCampPage();
}

export function echoScene(R, type) {
  const r = fingerprintRandom('echo-f' + R.seed + '-' + R.f + '-' + R.path.length),
    pool = ECHO_POOL[Math.min(7, R.f)].filter(k => SCEN[k] && SCEN[k].foes),
    bk = pool[Math.floor(r() * pool.length)] || 'gue',
    b = SCEN[bk],
    el = type === 'elite',
    D = Object.assign({}, b, {
      n: `Écho profond · étage ${R.f + 1}`,
      lvl: `${ECHO_NODES[type][0]} · étage ${R.f + 1} / 8`,
      d: `${el ? 'Adversaires renforcés : une relique à la clé. ' : type === 'boss' ? 'Le gardien de l’Écho profond. ' : ''}Vos PV sont conservés d’un combat à l’autre ; un Pokémon K.O. quitte l’expédition.`,
      catch: false,
      echo431: type,
      noProgress: 1,
      hb: Math.round((b.hb || 20) * (el ? 1.3 : 1)),
      pb: (b.pb || 3) + (el ? 1 : 0),
    });
  PROGRESS_KEYS.forEach(x => delete D[x]);
  SCEN.echo431 = D;
  OBST.echo431 = OBST[bk] || {};
}

function echoNode(i) {
  const R = echoRun();
  if (!R || R.ev) {
    return;
  }
  const floor = R.map[R.f],
    t = floor && floor[i];
  if (!t) {
    return;
  }
  R.cur = i;
  if (t === 'combat' || t === 'elite' || t === 'boss') {
    echoScene(R, t);
    queueSave();
    chooseBattle('echo431');
    launch();
    return;
  }
  if (t === 'soin') {
    R.team.forEach(x => x[1] > 0 && (x[1] = Math.min(1, x[1] + 0.5)));
    toast('La Source soigne votre équipe : +50 % de PV.');
    echoAdvance(R);
  } else if (t === 'marchand') {
    R.ev = 'marchand';
  } else if (t === 'evenement') {
    R.ev = ['autel', 'source', 'passe', 'pari'][Math.floor(fingerprintRandom('ev' + R.seed + R.f)() * 4)];
  }
  queueSave();
  renderCampPage();
}

function echoAdvance(R) {
  R.path.push(R.cur);
  R.cur = -1;
  R.f++;
  R.ev = '';
  const X = PROFILE.echo431;
  X.best = Math.max(X.best || 0, R.f);
  queueSave();
}

function randomRelic(R, n) {
  const relics = Object.keys(RELIC_DEFS).filter(k => !R.relics.includes(k)),
    r = fingerprintRandom('rel' + R.seed + R.f + R.relics.length);
  for (let i = relics.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [relics[i], relics[j]] = [relics[j], relics[i]];
  }
  return relics.slice(0, n);
}

function echoEnd(R, hasWon) {
  const X = PROFILE.echo431,
    f = hasWon ? 8 : R.f,
    m = f * 300 + (hasWon ? 2500 : 0),
    g = f * 2 + (hasWon ? 20 : 0);
  X.best = Math.max(X.best || 0, f);
  if (hasWon) {
    X.wins = (X.wins || 0) + 1;
  }
  X.run = null;
  return [m, g, f];
}

export function echoAfter(S, rew, win) {
  const R = echoRun();
  if (!R || R.cur < 0) {
    return [0, 0];
  }
  const type = R.map[R.f][R.cur],
    alive = R.team.filter(t => t[1] > 0),
    al = S.units.filter(u => u.side === 'a');
  al.forEach((u, i) => {
    const t = alive[i];
    if (!t) {
      return;
    }
    t[0] = POKEMON[u.id] ? u.id : t[0]; // an evolution in battle stays in effect during the expedition
    t[1] = u.ko ? 0 : Math.max(0.01, u.hp / u.mhp);
  });
  rew.echo431 = { type, f: R.f + 1, win };
  if (!win || !R.team.some(t => t[1] > 0)) {
    const [m, g, f] = echoEnd(R, false);
    rew.echo431.fin = { f, m, g };
    return [m, g];
  }
  if (R.relics.includes('baie')) {
    R.team.forEach(t => t[1] > 0 && (t[1] = Math.min(1, t[1] + 0.15)));
  }
  const payout = Math.round(
    (type === 'elite' ? 35 : type === 'boss' ? 0 : 15 + R.f * 3) * (R.relics.includes('aimant') ? 1.5 : 1)
  );
  R.echoes += payout;
  rew.echo431.echoes = payout;
  if (type === 'boss') {
    R.path.push(R.cur);
    const [m, g] = echoEnd(R, true);
    rew.echo431.fin = { f: 8, m, g, gagne: 1 };
    pantheonEngrave(
      'echo',
      PANTHEON_STORE.echo,
      S.units.filter(u => u.side === 'a').map(u => u.id),
      S
    ); // Pantheon (v4.32)
    return [m, g];
  }
  if (type === 'elite') {
    R.ev = 'relique';
  } else {
    echoAdvance(R);
  }
  if (type === 'elite') {
    R.path.push(R.cur);
    R.f++;
    R.cur = -1;
    PROFILE.echo431.best = Math.max(PROFILE.echo431.best || 0, R.f);
  }
  return [0, 0];
}

function echoChoice(k) {
  const R = echoRun();
  if (!R) {
    return;
  }
  const hp = f => R.team.forEach(t => t[1] > 0 && (t[1] = Math.max(0.05, Math.min(1, t[1] + f))));
  if (k === 'autel-ok') {
    hp(-0.2);
    const x = randomRelic(R, 1)[0];
    if (x) {
      R.relics.push(x);
    }
    toast(x ? `Relique : ${RELIC_DEFS[x][0]}.` : 'L’autel est vide.');
  } else if (k === 'source-pv') {
    hp(0.3);
  } else if (k === 'source-ech') {
    R.echoes += 25;
  } else if (k === 'passe-pv') {
    R.pv = Math.min(0.5, (R.pv || 0) + 0.1);
  } else if (k === 'passe-ech') {
    R.echoes += 30;
  } else if (k === 'pari-ok') {
    if (fingerprintRandom('pari' + R.seed + R.f)() < 0.5) {
      R.echoes += 60;
      toast('Pile : +60 Échos !');
    } else {
      hp(-0.2);
      toast('Face : chaque Pokémon perd 20 % de PV.');
    }
  } else if (k.startsWith('rel-')) {
    const x = k.slice(4);
    if (RELIC_DEFS[x] && !R.relics.includes(x)) {
      R.relics.push(x);
    }
    R.ev = '';
    queueSave();
    return renderCampPage();
  } else if (k.startsWith('achat-')) {
    const a = k.slice(6),
      price = { potion: 20, relique: 45, rappel: 60 }[a];
    if (!price || R.echoes < price) {
      return toast('Pas assez d’Échos.');
    }
    if (a === 'rappel' && !R.team.some(t => t[1] <= 0)) {
      return toast('Aucun Pokémon à rappeler.');
    }
    R.echoes -= price;
    if (a === 'potion') {
      hp(0.3);
    } else if (a === 'relique') {
      const x = randomRelic(R, 1)[0];
      if (x) {
        R.relics.push(x);
      }
      toast(x ? `Relique : ${RELIC_DEFS[x][0]}.` : 'Plus de relique à vendre.');
    } else if (a === 'rappel') {
      const t = R.team.find(y => y[1] <= 0);
      t[1] = 0.3;
      toast(`${POKEMON[t[0]].n} revient à 30 % de PV.`);
    }
    queueSave();
    return renderCampPage();
  }
  echoAdvance(R);
  renderCampPage();
}

const RELIC_DEFS = {
  plume: ['Plume vive', '+1 Mouvement pour toute l’équipe.'],
  braise: ['Cœur ardent', '+10 % de dégâts infligés.'],
  ecaille: ['Écaille', '−10 % de dégâts subis.'],
  diapason: ['Diapason', 'Chaque Pokémon commence avec 1 losange de plus.'],
  cloche: ['Cloche claire', '+1 Voix maximum.'],
  baie: ['Baie dorée', 'Après chaque combat, +15 % de PV.'],
  aimant: ['Aimant à Échos', '+50 % d’Échos gagnés.'],
  talisman: ['Talisman', 'Chaque Pokémon survit une fois à un coup fatal par combat.'],
};

const ECHO_POOL = [
  ['gue', 'roche', 'a1', 'a2'],
  ['a3', 'a4', 'tour', 'td1'],
  ['a5', 'a6', 'j1', 'j2'],
  ['a7', 'j3', 'j4', 'h1'],
  ['a8', 'j5', 'j6', 'h2', 'h3'],
  ['j7', 'h4', 'h5', 'jd2'],
  ['j8', 'h6', 'h7', 'jd4'],
  ['jchamp', 'hchamp', 'lgraikou', 'lgentei', 'lgsuicune'],
];

const ECHO_NODES = {
  combat: ['Combat', 'i-fight'],
  elite: ['Élite', 'i-star'],
  soin: ['Source', 'i-heal'],
  marchand: ['Marchand', 'i-shop'],
  evenement: ['Événement', 'i-quest'],
  boss: ['Gardien', 'i-trophy'],
};

const ECHO_EVENTS = {
  autel: [
    'Autel brisé',
    'Une relique repose sur un autel fissuré. La prendre coûte 20 % des PV de chaque Pokémon.',
    [
      ['Prendre la relique', 'autel-ok'],
      ['Passer son chemin', 'passer'],
    ],
  ],
  source: [
    'Source claire',
    'Une eau limpide chante doucement.',
    [
      ['Boire (+30 % de PV)', 'source-pv'],
      ['Remplir les gourdes (+25 Échos)', 'source-ech'],
    ],
  ],
  passe: [
    'Écho du passé',
    'Un souvenir de vos premiers combats vous revient.',
    [
      ['S’en inspirer (+10 % de PV max pour l’expédition)', 'passe-pv'],
      ['Le vendre (+30 Échos)', 'passe-ech'],
    ],
  ],
  pari: [
    'Le Pari',
    'Un dresseur masqué propose un jeu : pile, 60 Échos ; face, chaque Pokémon perd 20 % de PV.',
    [
      ['Jouer', 'pari-ok'],
      ['Refuser', 'passer'],
    ],
  ],
};

function onCombat(S) {
  if (S.sc !== 'echo431') {
    return;
  }
  const R = echoRun();
  if (!R) {
    return;
  }
  S.echo431 = 1;
  S.relicBag = R.relics.slice();
  const alive = R.team.filter(t => t[1] > 0),
    al = S.units.filter(u => u.side === 'a');
  al.forEach((u, i) => {
    const t = alive[i];
    if (!t) {
      return;
    }
    if (R.pv) {
      u.mhp = Math.round(u.mhp * (1 + R.pv));
    }
    u.hp = Math.max(1, Math.round(u.mhp * t[1]));
    if (S.relicBag.includes('diapason')) {
      u.en = Math.min(EMAX, (u.en || 0) + 1);
    }
    if (S.relicBag.includes('talisman')) {
      u.sturdy = true;
    }
  });
  if (S.relicBag.includes('cloche')) {
    S.vmax += 1;
    S.voice += 1;
  }
}

function onDeepEchoClick(e) {
  const b = e.target.closest('[data-echo431]');
  if (!b) {
    return;
  }
  const a = b.dataset.echo431;
  if (a === 'partir') {
    echoLeave();
  } else if (a === 'abandon') {
    const R = echoRun();
    if (!R) {
      return;
    }
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Confirmer l’abandon';
      return;
    }
    const [m, g, f] = echoEnd(R, false);
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
    toast(`Expédition abandonnée à l’étage ${f + 1} : ${formatNumber(m)} ₽ · ${g} Éclats.`);
    queueSave();
    renderWallet();
    renderCampPage();
  } else if (a.startsWith('n')) {
    echoNode(+a.slice(1));
  } else {
    echoChoice(a);
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push(onCombat);

  HOOKS.battleResult.push(r => {
    const e = r.echo431;
    if (!e) {
      return '';
    }
    if (e.fin) {
      return `<div class="result-list"><h4>Écho profond</h4><div class="result-row"><span>${e.fin.gagne ? 'Le gardien est vaincu : expédition réussie !' : `Expédition terminée à l’étage ${e.fin.f + (e.fin.gagne ? 0 : 1)}.`} Récompense : ${formatNumber(e.fin.m)} ₽ · ${e.fin.g} Éclats.</span><b>${e.fin.gagne ? '★' : ''}</b></div></div>`;
    }
    return `<div class="result-list"><h4>Écho profond</h4><div class="result-row"><span>Étage ${e.f} franchi${e.echoes ? ` · +${e.echoes} Échos` : ''}${e.type === 'elite' ? ' · une relique vous attend au Camp' : ''}. Vos PV sont conservés.</span><b>${e.f} / 8</b></div></div>`;
  });

  // after a Deep Echo battle: back to the expedition map (no « Rejouer » (Replay))
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest('#cbResult [data-res]');
      if (!b || !B || B.sc !== 'echo431') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      backToPrep();
      __set_scSel('gue');
      SCREEN_STATE.campTab = 'echo';
      goTo('camp');
    },
    true
  );

  document.addEventListener('click', onDeepEchoClick);
}
