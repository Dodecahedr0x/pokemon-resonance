import { getHost, hostSet } from '../../screens/combat/board/boardStore.js';

import { GYMS } from '../data/game-data.js';
import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { ARENAS } from '../modes/gyms.js';
import { $, reducedMotion, typeColor } from '../core/utils.js';
import { hook } from '../core/hooks.js';
import { currentScreen } from '../core/navigation.js';
import { byUid, unitKey } from '../combat/engine.js';
import { ELITE } from '../combat/items-bonds-ai.js';
import { battle, __set_selectedScenario, backToPrep, clearAim, floatAt, renderAll, ui } from '../combat/ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { __set_PREPG, renderPrep } from '../combat/battle-prep.js';
import { effectsEnabled } from '../combat/move-effects.js';
import { musStart } from '../audio/music.js';
import { RIVAL, RIVAL_STEPS, rivalIdx, scenarioLeader } from '../modes/rival.js';
import { legOf } from '../modes/legendaries.js';
import { styleOf } from '../combat/leader-styles.js';
import { dissonanceOf } from './team-dissonance.js';
import { johtoChapter, johtoLeader } from '../world/johto.js';
import { versusTip } from '../audio/immersion.js';
import { versusAvatar } from '../world/rare-encounters.js';
import { shut, updateTemp, openOverlay } from '../../screens/overlays/tempStore.js';

export let isAutomatedRun;
let LASTPH;

export function leaderOf(sc) {
  const jl = johtoLeader(sc); // Johto (v4.15)
  if (jl) {
    return jl;
  }
  const leaderInfo = scenarioLeader(sc); // Kael, Sirène, legends to capture (v4.29)
  if (leaderInfo) {
    return leaderInfo;
  }
  const i = ARENAS.findIndex(a => a.k === sc);
  if (i >= 0) {
    return LEAGUE_MASTERS[i];
  }
  const e = ELITE.indexOf(sc);
  if (e >= 0) {
    return ELITE_L[e];
  }
  if (sc === 'champ') {
    return CHAMP_L;
  }
  const ri = rivalIdx(sc);
  if (ri >= 0) {
    return Object.assign({}, RIVAL, { q: RIVAL_STEPS[ri].q, w: RIVAL_STEPS[ri].w, l: RIVAL_STEPS[ri].l });
  }
  const lg = legOf(sc);
  if (lg) {
    return { n: lg.n, t: lg.title, q: lg.q, w: lg.w, l: lg.l };
  }
  const ds = dissonanceOf(sc); // Team Dissonance (v4.11)
  if (ds) {
    return { n: ds.who, t: ds.t, q: ds.q, w: ds.w, l: ds.l };
  }
  return null;
}

/* --- Guide: the universe, rendered by React (Universe.jsx) --- */

// Transient window (#vs, #battleHelp, #eventChoice…): rendered by React (src/screens/overlays/Transients.jsx),
// at the end of the shell, in opening order. Returns the node; close(id) removes it.
export function overlay(id, data) {
  return openOverlay(id, data);
}

export function vsIntro() {
  hook('beforePresentation');
  if (!battle) {
    return;
  }
  const D = SCENARIOS[battle.sc],
    L = leaderOf(battle.sc),
    i = ARENAS.findIndex(a => a.k === battle.sc),
    al = battle.units.filter(u => u.side === 'a'),
    fo = battle.units.filter(u => u.side === 'e');
  const kick =
    i >= 0
      ? `Arène ${i + 1} · Badge ${GYMS[i].t}`
      : D.rival
        ? `Rival · combat ${D.rival} sur 4`
        : D.legend
          ? 'Après-jeu · Légende'
          : D.tower
            ? D.lvl
            : L
              ? battle.sc === 'champ'
                ? 'Ligue · Finale'
                : 'Ligue · Conseil 4'
              : D.wild
                ? 'Rencontre sauvage'
                : D.tuto
                  ? 'Prologue'
                  : D.duel433
                    ? 'Duel local'
                    : 'Terrain d’entraînement';
  const ri = i >= 0 ? i : ARENAS.findIndex(a => a.rule === D.rule); // board rule carried over (legends, Tower)
  const dur = reducedMotion ? 900 : PREFERENCES.fast ? 1400 : 2300;
  // rendered: src/screens/overlays/transients/Vs.jsx
  const o = overlay('vs', {
    cls: (reducedMotion ? ' is-calm' : '') + (PREFERENCES.fast ? ' is-fast' : ''),
    dur,
    k1: battle.duel433 ? 'Joueur 1' : 'Votre équipe',
    al: al.map(u => u.t),
    av: versusAvatar(), // trainer emblem (v4.50)
    name1: battle.duel433 ? battle.duel433.names[0] : PROFILE.name || 'Dresseur',
    em1: al.map(u => u.n).join(' · '),
    ac: D.at ? typeColor(D.at) : 'var(--gold)',
    kick,
    badge: i >= 0 ? i : null,
    foes: fo.slice(0, 5).map(u => u.t),
    name2: battle.duel433 ? battle.duel433.names[1] : L ? L.n : D.n,
    em2: battle.duel433 ? 'Joueur 2' : L ? L.t : D.lvl || '',
    q: L ? L.q : null,
    rule: `${D.rule && GYMS[ri] ? GYMS[ri].r : D.n}${styleOf(battle.sc) ? ` · Style : ${styleOf(battle.sc).n}` : ''} · ${battle.lim} manches`,
    tip: versusTip(), // tip under the presentation (v4.48)
  });
  let done = false;
  const close = () => {
    if (done) {
      return;
    }
    done = true;
    if (o.isConnected) {
      updateTemp('vs', { out: true });
    }
    setTimeout(
      () => {
        shut(o);
        turnBanner();
      },
      reducedMotion ? 0 : 350
    );
  };
  o.addEventListener('click', close);
  setTimeout(close, dur);
}

export function turnBanner(txt, sub) {
  hook('beforeBanner');
  if (!battle || reducedMotion) {
    return;
  }
  const bd = $('#bBoard');
  if (!bd) {
    return;
  }
  // .round-banner: rendered by React (Board.jsx); a new banner replaces the old one
  const n = ((getHost().roundBanner || {}).n || 0) + 1;
  hostSet({
    roundBanner: {
      n,
      isEnemy: battle.phase === 'enemy',
      fast: !!PREFERENCES.fast,
      title: txt || 'Manche ' + battle.round,
      sub:
        sub ||
        (battle.duel433
          ? battle.duel433.names[battle.duel433.j - 1]
          : battle.phase === 'enemy'
            ? 'Tour adverse'
            : 'À vous'),
    },
  });
  setTimeout(
    () => {
      const t = getHost().roundBanner;
      if (t && t.n === n) {
        hostSet({ roundBanner: null });
      }
    },
    PREFERENCES.fast ? 800 : 1300
  );
}

export function turnBanners() {
  if (!battle) {
    return;
  }
  const k = battle.sc + '|' + battle.round + '|' + battle.phase;
  if (LASTPH && LASTPH !== k && !battle.over && !document.getElementById('vs')) {
    if (battle.phase === 'enemy') {
      turnBanner('Manche ' + battle.round, 'Tour adverse');
    } else {
      turnBanner();
    }
  }
  LASTPH = k;
}

/* --- Impact words: super effective, K.O. --- */
export function impactWords(ev) {
  if (!battle || reducedMotion) {
    return;
  }
  let last = null;
  const later = [];
  ev.forEach(e => {
    if (e.e === 'dmg') {
      last = e.u;
    } else if (e.e === 'msg' && /super efficace/.test(e.s) && last) {
      later.push(['Super efficace', 'is-super-effective', last]);
    } else if (e.e === 'ko') {
      later.push(['K.O.', 'is-knockout', e.u]);
    }
  });
  const S0 = battle;
  later.forEach(([t, c, id], j) =>
    setTimeout(
      () => {
        if (battle !== S0) {
          return;
        }
        const u = byUid(battle, id);
        if (u) {
          floatAt(unitKey(u), t, c);
        }
      },
      (ev.some(x => x.e === 'fx') && effectsEnabled() ? 320 : 60) + j * 120
    )
  );
}

export function rankOf(S) {
  if (S.over !== 'win') {
    return null;
  }
  const lost = S.units.filter(u => u.side === 'a' && u.ko).length;
  if (!lost && S.round <= Math.ceil(S.lim * 0.5)) {
    return 'S';
  }
  if (lost <= 1 && S.round <= Math.ceil(S.lim * 0.75)) {
    return 'A';
  }
  return 'B';
}

// Result sheet: rank, trainer quote, Tower buttons and "Suite" (Continue) are rendered
// by React (src/screens/combat/battle/Result.jsx); the post-battle scene starts from finish().

function musNote(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function musVoice(f, t, d, type, flying) {
  const ac = MUSIC_STATE.ac,
    o = ac.createOscillator(),
    g = ac.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(flying, t + Math.min(1.6, d * 0.3));
  g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g);
  g.connect(MUSIC_STATE.out);
  o.start(t);
  o.stop(t + d + 0.05);
}

function musTick() {
  if (!MUSIC_STATE.on || !MUSIC_STATE.ac) {
    return;
  }
  const t = MUSIC_STATE.ac.currentTime + 0.08,
    ch = MPROG[MUSIC_STATE.step % 4],
    bat = !!battle && currentScreen === 'combat' && !battle.over;
  ch.forEach((n, i) => {
    musVoice(musNote(n - 12), t, 7.8, 'triangle', i ? 0.05 : 0.07);
    musVoice(musNote(n - 12) * 1.003, t, 7.8, 'sine', 0.03);
  });
  musVoice(musNote(ch[0] - 24), t, 7.8, 'sine', 0.09);
  const arp = bat ? [0, 2, 1, 3, 2, 1, 3, 0, 0, 2, 1, 3, 2, 3, 1, 2] : [0, 2, 1, 3];
  const step = bat ? 0.5 : 2;
  arp.forEach((j, i) => musVoice(musNote(ch[j] + 12), t + i * step, 0.9, 'sine', bat ? 0.035 : 0.025));
  MUSIC_STATE.step++;
  MUSIC_STATE.timer = setTimeout(musTick, 8000);
}

/* Synthesized ambient pad: fallback of the track player (070) when the audio files are missing. */
export function musStartCore() {
  if (MUSIC_STATE.on) {
    return;
  }
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) {
      return;
    }
    MUSIC_STATE.ac = MUSIC_STATE.ac || new C();
    if (MUSIC_STATE.ac.state === 'suspended') {
      MUSIC_STATE.ac.resume();
    }
    MUSIC_STATE.out = MUSIC_STATE.ac.createGain();
    const lp = MUSIC_STATE.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    MUSIC_STATE.out.connect(lp);
    lp.connect(MUSIC_STATE.ac.destination);
    MUSIC_STATE.out.gain.setValueAtTime(0, MUSIC_STATE.ac.currentTime);
    MUSIC_STATE.out.gain.linearRampToValueAtTime(0.55, MUSIC_STATE.ac.currentTime + 3);
    MUSIC_STATE.on = true;
    MUSIC_STATE.step = 0;
    musTick();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export function musPadStop() {
  if (!MUSIC_STATE.ac || !MUSIC_STATE.out) {
    return;
  }
  clearTimeout(MUSIC_STATE.timer);
  try {
    const o = MUSIC_STATE.out,
      t = MUSIC_STATE.ac.currentTime;
    o.gain.cancelScheduledValues(t);
    o.gain.setValueAtTime(o.gain.value, t);
    o.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => {
      try {
        o.disconnect();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }, 1400);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export function musPadLevel() {
  try {
    if (MUSIC_STATE.on && MUSIC_STATE.out && MUSIC_STATE.ac) {
      const t = MUSIC_STATE.ac.currentTime,
        g = MUSIC_STATE.out.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.55 * PREFERENCES.musVol, t + 0.4);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ===================== v2.0 PRESTIGE: universe, staging, finishing touches ===================== */
/* --- Universe: the Resonance League and its masters (original characters) --- */
export const LEAGUE_MASTERS = [
  {
    n: 'Bastien Grès',
    t: 'le Tailleur de la Faille',
    q: 'Ici, le sol se fend avant vous. Apprenez à vous ancrer.',
    w: 'Vous avez tenu la ligne. La roche s’en souviendra.',
    l: 'Une faille ne pardonne pas l’hésitation.',
  },
  {
    n: 'Maëva Lagune',
    t: 'la Marée lente',
    q: 'La marée ne se presse jamais. Elle gagne quand même.',
    w: 'Vous avez lu la marée avant qu’elle monte. Bien.',
    l: 'L’eau a fini par vous rejoindre.',
  },
  {
    n: 'Tobias Arc',
    t: 'l’Ingénieur des fronts',
    q: 'Deux lignes de courant. Une seule question : où serez-vous ?',
    w: 'Vous avez trouvé l’espace entre les éclairs.',
    l: 'Le courant passe toujours là où l’on attend.',
  },
  {
    n: 'Capucine Ronce',
    t: 'la Jardinière des haies',
    q: 'Mes racines bougent. Vous, resterez-vous en place ?',
    w: 'Vous avez traversé la haie sans vous y prendre.',
    l: 'Les racines ont été plus patientes que vous.',
  },
  {
    n: 'Vesper Nox',
    t: 'l’Ombre de la brume',
    q: 'On ne vise pas ce qu’on ne voit pas. Moi, je vous vois.',
    w: 'Vous avez avancé à l’aveugle sans trembler.',
    l: 'La brume garde ceux qui s’y perdent.',
  },
  {
    n: 'Iliane Prisme',
    t: 'la Gardienne de l’Écran',
    q: 'Une manche sur deux, mon Écran Psy vous arrête net. L’autre, il faudra frapper juste.',
    w: 'Vous avez frappé quand l’Écran tombait.',
    l: 'Vous vous êtes brisé contre mon Écran.',
  },
  {
    n: 'Rhéa Cendrine',
    t: 'la Forgeronne',
    q: 'La lave tombe là où je l’annonce. Écoutez, ou brûlez.',
    w: 'Vous avez écouté la forge. Le métal est à vous.',
    l: 'La forge ne répète jamais deux fois.',
  },
  {
    n: 'Gaspard Tellure',
    t: 'le Sismographe',
    q: 'Les rochers glissent. Les certitudes aussi.',
    w: 'Vous êtes restés debout quand tout a glissé.',
    l: 'Le plateau a bougé. Vous, trop tard.',
  },
];

export const ELITE_L = [
  {
    n: 'Séléné Voilée',
    t: 'Maîtresse des Ombres',
    q: 'Vos Pokémon ont peur du noir ? Les miens en viennent.',
    w: 'La lumière vous va bien.',
    l: 'L’ombre gagne toujours la dernière manche.',
  },
  {
    n: 'Hector Vaillant',
    t: 'Maître des Poings',
    q: 'Pas de détour. Contact, impact.',
    w: 'Un combat franc. Je n’en demandais pas plus.',
    l: 'Il fallait frapper avant moi.',
  },
  {
    n: 'Aldric Wyrm',
    t: 'Maître des Dragons',
    q: 'Un dragon n’évolue pas pour plaire. Il évolue pour vaincre.',
    w: 'Votre Éveil valait le mien.',
    l: 'Les dragons ne pardonnent pas la demi-mesure.',
  },
  {
    n: 'Ombeline Âtre',
    t: 'Maîtresse des Flammes noires',
    q: 'Le feu qui ne brille pas brûle plus longtemps.',
    w: 'Vous avez éteint ce qui ne se voyait pas.',
    l: 'Les braises couvaient sous vos pieds.',
  },
];

export const CHAMP_L = {
  n: 'Auriane Vale',
  t: 'Championne de la Résonance',
  q: 'J’ai lu vos dix derniers combats. Montrez-moi le onzième.',
  w: 'Vous n’avez pas joué le combat que j’avais lu. C’est ainsi qu’on devient Champion.',
  l: 'Vous avez joué exactement ce que j’attendais.',
};

const PROF = { n: 'Professeure Maëlle Sorbier', t: 'chercheuse en Résonance' };

export const UNIVERSE_PAGES = [
  [
    'La Résonance',
    'À Kanto et à Johto, les dresseurs l’ont constaté depuis longtemps : quand un Pokémon et son dresseur agissent au même tempo, une énergie monte entre eux. Trois pulsations, et le Pokémon franchit un stade, en plein combat, sans retour possible. Les chercheurs l’ont appelée la Résonance.',
  ],
  [
    'Le règlement de la Ligue',
    'La Ligue de la Résonance a bâti ses tournois sur ce phénomène. Chaque dresseur dispose de 12 points de commandement pour quatre Pokémon. Un premier stade coûte peu et peut s’éveiller. Une recrue confirmée, déjà éveillée lors d’anciens combats, coûte plus cher : la Ligue récompense ceux qui font confiance au combat.',
  ],
  [
    'Tout se lit, rien n’est tiré au sort',
    'Dans les arènes de la Ligue, il n’y a pas de coup critique ni d’esquive chanceuse. Chaque terrain annonce ses pièges, mais aucun adversaire ne dévoile son coup : il frappe là où vous êtes. Gagner, c’est lire les portées, placer, faire réagir les types et choisir le moment de l’Éveil.',
  ],
  [
    'Les notes de Résonance',
    'L’équipe de la Professeure Sorbier a mesuré autre chose : quand plusieurs Pokémon frappent la même cible au même tempo, leurs énergies s’accordent. Trois notes, et le coup résonne. La Ligue classe désormais les Pokémon en rangs, de Faible à Expert, et ses meilleurs dresseurs bâtissent des équipes où chaque rang a son rôle.',
  ],
];

export const chapterOf = k => {
  const jc = johtoChapter(k); // Johto (v4.15)
  if (jc) {
    return jc;
  }
  const i = ARENAS.findIndex(a => a.k === k);
  if (k === 'tuto') {
    return { c: 'Prologue', t: 'Le premier éveil', who: PROF.n };
  }
  if (i >= 0) {
    return { c: `Chapitre ${i + 1}`, t: SCENARIOS[k].n, who: LEAGUE_MASTERS[i].n, L: LEAGUE_MASTERS[i] };
  }
  const e = ELITE.indexOf(k);
  if (e >= 0) {
    return { c: 'Chapitre 9', t: 'Le Conseil 4', who: ELITE_L[e].n, L: ELITE_L[e] };
  }
  if (k === 'champ') {
    return { c: 'Final', t: 'La onzième bataille', who: CHAMP_L.n, L: CHAMP_L };
  }
  if (rivalIdx(k) >= 0) {
    return { c: 'Interlude', t: 'Le rival', who: RIVAL.n, L: leaderOf(k) };
  }
  const lg = legOf(k);
  if (lg) {
    return { c: 'Après-jeu', t: lg.n, who: lg.n, L: leaderOf(k) };
  }
  if (k === 'tdr') {
    return { c: 'Après-jeu', t: 'Tour de Résonance', who: 'La Tour' };
  }
  if (dissonanceOf(k)) {
    return { c: 'Interlude', t: 'Team Dissonance', who: dissonanceOf(k).who, L: leaderOf(k) };
  }
  return null;
};

/* --- Health bars: the loss stays visible for a moment --- */
export const HP_BAR_MOTION = {};

/* --- End-of-battle rank and best rank per terrain --- */
export const RANKS = ['B', 'A', 'S'];

/* --- Generative ambient music ("Musique" option) --- */
export const MUSIC_STATE = { ac: null, out: null, on: false, timer: 0, step: 0 };

const MPROG = [
  [57, 64, 69, 72],
  [53, 60, 65, 69],
  [48, 55, 64, 67],
  [55, 62, 67, 71],
];

function onBattleShortcutKeydown(e) {
  if (currentScreen !== 'combat' || !battle || battle.over || ui.busy || e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }
  const tg = e.target;
  if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) {
    return;
  }
  if (
    document.getElementById('vs') ||
    !$('#evoPick').hidden ||
    !$('#cbResult').hidden ||
    !$('#saves').hidden ||
    !$('#sheet').hidden
  ) {
    return;
  }
  const P = $('#bPanel'),
    k = e.key;
  if (k >= '1' && k <= '4') {
    const b = P.querySelector(`[data-mi="${+k - 1}"]:not([disabled])`);
    if (b) {
      b.click();
      e.preventDefault();
    }
    return;
  }
  if (k === 'Enter') {
    const b = P.querySelector('[data-pv="ok"]');
    if (b) {
      b.click();
      e.preventDefault();
    }
    return;
  }
  if (k === 'Escape') {
    if (ui.mode || ui.selE) {
      clearAim();
      ui.selE = null;
      renderAll();
      e.preventDefault();
    }
    return;
  }
  if (k === 'ArrowRight' || k === 'ArrowLeft') {
    const al = battle.units.filter(u => u.side === 'a' && !u.ko);
    if (!al.length) {
      return;
    }
    const i = al.findIndex(u => u.uid === ui.sel),
      n = al[(i + (k === 'ArrowRight' ? 1 : -1) + al.length) % al.length];
    ui.sel = n.uid;
    ui.selE = null;
    clearAim();
    renderAll();
    e.preventDefault();
    return;
  }
  if (k === ' ' && tg && tg.tagName === 'BUTTON') {
    return;
  }
  if (k === ' ' || k === 'e' || k === 'E') {
    const b = $('#bEnd');
    if (b && !b.disabled) {
      b.click();
      e.preventDefault();
    }
    return;
  }
  if (k === 'v' || k === 'V') {
    const b = P.querySelector('[data-evo="open"]:not([disabled])');
    if (b) {
      b.click();
      e.preventDefault();
    }
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* --- League, Council, journey: the League's faces (gym line: src/screens/league/Arena.jsx) --- */

  /* --- Overlay: opening (once per session), battle presentation, banners --- */
  isAutomatedRun = !!navigator.webdriver || /jsdom/i.test(navigator.userAgent || '');

  LASTPH = null;

  $('#cbResult').addEventListener(
    'click',
    e => {
      const b = e.target.closest('[data-next]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      backToPrep();
      __set_PREPG(null);
      __set_selectedScenario(b.dataset.next);
      renderPrep();
    },
    true
  );

  /* --- Keyboard: playing without a mouse --- */
  document.addEventListener('keydown', onBattleShortcutKeydown);

  document.addEventListener(
    'pointerdown',
    () => {
      if (PREFERENCES.music && !MUSIC_STATE.on) {
        musStart();
      }
    },
    { passive: true }
  );
}
