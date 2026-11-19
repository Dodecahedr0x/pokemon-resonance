/* Section d'origine : 24-prestige-mise-en-scene.js */
import { getHost, hostSet } from '../screens/combat/board/boardStore.js';

import { GYMS } from './004-01-donnees.js';
import { SCEN } from './009-03-pokemon.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { ARENAS } from './013-07-arenes.js';
import { $, RM, tc } from './014-08-outils.js';
import { crochet } from './015-v4-8-00-crochets.js';
import { cur } from './016-09-navigation.js';
import { byUid, uk } from './021-14-moteur-combat.js';
import { ELITE } from './022-15-systemes-objets-liens-ia.js';
import { B, __set_scSel, backToPrep, clearAim, floatAt, renderAll, ui } from './024-17-interface-combat.js';
import { PREF, __set_PREPG, renderPrep } from './026-20-campagne-tutoriel-son.js';
import { fxOn } from './028-22-effets-attaque.js';
import { musStart } from './070-v4-35-musiques-par-theme-lecteur-de-pistes.js';
import { RIVAL, RIVAL_STEPS, legOf, rivalIdx, styleOf } from './043-v4-4-01-aventure-plus.js';
import { dissonanceDe } from './050-v4-11-01-monde.js';
import { chapJ415, leadJ415 } from './054-v4-15-01-johto.js';
import { leader429 } from './064-v4-29-01-qualite.js';
import { astuceVs448 } from './079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';
import { vsAv450 } from './080-v4-50-avatar-de-dresseur-rencontres-rares-heure.js';
import { fermer, majTemp, ouvrir } from '../screens/overlays/tempStore.js';

export let AUTO;
let LASTPH;


export function leaderOf(sc) {
  const jl = leadJ415(sc); // Johto (v4.15)
  if (jl) return jl;
  const l429 = leader429(sc); // Kael, Sirène, légendes à capturer (v4.29)
  if (l429) return l429;
  const i = ARENAS.findIndex(a => a.k === sc);
  if (i >= 0) return LEAD[i];
  const e = ELITE.indexOf(sc);
  if (e >= 0) return ELITE_L[e];
  if (sc === 'champ') return CHAMP_L;
  const ri = rivalIdx(sc);
  if (ri >= 0) return Object.assign({}, RIVAL, { q: RIVAL_STEPS[ri].q, w: RIVAL_STEPS[ri].w, l: RIVAL_STEPS[ri].l });
  const lg = legOf(sc);
  if (lg) return { n: lg.n, t: lg.title, q: lg.q, w: lg.w, l: lg.l };
  const ds = dissonanceDe(sc); // Team Dissonance (v4.11)
  if (ds) return { n: ds.who, t: ds.t, q: ds.q, w: ds.w, l: ds.l };
  return null;
}




/* --- Guide : l’univers, rendu par React (Univers.jsx) --- */


// Fenêtre temporaire (#vs, #hp452, #evs454…) : rendue par React (src/screens/overlays/Temporaires.jsx),
// à la fin du shell, dans l'ordre d'ouverture. Renvoie le nœud ; fermer(id) la retire.
export function overlay(id, data) {
  return ouvrir(id, data);
}


export function vsIntro() {
  crochet('avantPresentation');
  if (!B) return;
  const D = SCEN[B.sc],
    L = leaderOf(B.sc),
    i = ARENAS.findIndex(a => a.k === B.sc),
    al = B.units.filter(u => u.side === 'a'),
    fo = B.units.filter(u => u.side === 'e');
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
              ? B.sc === 'champ'
                ? 'Ligue · Finale'
                : 'Ligue · Conseil 4'
              : D.wild
                ? 'Rencontre sauvage'
                : D.tuto
                  ? 'Prologue'
                  : D.duel433
                  ? 'Duel local'
                  : 'Terrain d’entraînement';
  const ri = i >= 0 ? i : ARENAS.findIndex(a => a.rule === D.rule); // règle de plateau reprise (légendes, Tour)
  const dur = RM ? 900 : PREF.fast ? 1400 : 2300;
  // rendu : src/screens/overlays/temporaires/Vs.jsx
  const o = overlay('vs', {
    cls: (RM ? ' rm' : '') + (PREF.fast ? ' fast' : ''),
    dur,
    k1: B.duel433 ? 'Joueur 1' : 'Votre équipe',
    al: al.map(u => u.t),
    av: vsAv450(), // emblème du dresseur (v4.50)
    nom1: B.duel433 ? B.duel433.noms[0] : PROFILE.name || 'Dresseur',
    em1: al.map(u => u.n).join(' · '),
    ac: D.at ? tc(D.at) : 'var(--gold)',
    kick,
    badge: i >= 0 ? i : null,
    foes: fo.slice(0, 5).map(u => u.t),
    nom2: B.duel433 ? B.duel433.noms[1] : L ? L.n : D.n,
    em2: B.duel433 ? 'Joueur 2' : L ? L.t : D.lvl || '',
    q: L ? L.q : null,
    rule: `${D.rule && GYMS[ri] ? GYMS[ri].r : D.n}${styleOf(B.sc) ? ` · Style : ${styleOf(B.sc).n}` : ''} · ${B.lim} manches`,
    tip: astuceVs448() // astuce sous la présentation (v4.48)
  });
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    if (o.isConnected) majTemp('vs', { out: true });
    setTimeout(
      () => {
        fermer(o);
        turnBanner();
      },
      RM ? 0 : 350
    );
  };
  o.addEventListener('click', close);
  setTimeout(close, dur);
}


export function turnBanner(txt, sub) {
  crochet('avantBandeau');
  if (!B || RM) return;
  const bd = $('#bBoard');
  if (!bd) return;
  // bandeau .tbn : rendu par React (Board.jsx) ; un nouveau bandeau remplace l'ancien
  const n = ((getHost().tbn || {}).n || 0) + 1;
  hostSet({
    tbn: {
      n,
      en: B.phase === 'enemy',
      fast: !!PREF.fast,
      txt: txt || 'Manche ' + B.round,
      sub: sub || (B.duel433 ? B.duel433.noms[B.duel433.j - 1] : B.phase === 'enemy' ? 'Tour adverse' : 'À vous')
    }
  });
  setTimeout(
    () => {
      const t = getHost().tbn;
      if (t && t.n === n) hostSet({ tbn: null });
    },
    PREF.fast ? 800 : 1300
  );
}


export function turnBanners() {
  if (!B) return;
  const k = B.sc + '|' + B.round + '|' + B.phase;
  if (LASTPH && LASTPH !== k && !B.over && !document.getElementById('vs')) {
    if (B.phase === 'enemy') turnBanner('Manche ' + B.round, 'Tour adverse');
    else turnBanner();
  }
  LASTPH = k;
}


/* --- Mots d’impact : super efficace, K.O. --- */
export function impactWords(ev) {
  if (!B || RM) return;
  let last = null;
  const later = [];
  ev.forEach(e => {
    if (e.e === 'dmg') last = e.u;
    else if (e.e === 'msg' && /super efficace/.test(e.s) && last) later.push(['Super efficace', 'f-se', last]);
    else if (e.e === 'ko') later.push(['K.O.', 'f-ko', e.u]);
  });
  const S0 = B;
  later.forEach(([t, c, id], j) =>
    setTimeout(
      () => {
        if (B !== S0) return;
        const u = byUid(B, id);
        if (u) floatAt(uk(u), t, c);
      },
      (ev.some(x => x.e === 'fx') && fxOn() ? 320 : 60) + j * 120
    )
  );
}


export function rankOf(S) {
  if (S.over !== 'win') return null;
  const lost = S.units.filter(u => u.side === 'a' && u.ko).length;
  if (!lost && S.round <= Math.ceil(S.lim * 0.5)) return 'S';
  if (lost <= 1 && S.round <= Math.ceil(S.lim * 0.75)) return 'A';
  return 'B';
}


// Fiche de résultat : rang, citation du dresseur, boutons de la Tour et « Suite » sont rendus
// par React (src/screens/combat/battle/Result.jsx) ; la scène d’après-combat part de finish().


function musNote(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}


function musVoice(f, t, d, type, vol) {
  const ac = MUS.ac,
    o = ac.createOscillator(),
    g = ac.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(1.6, d * 0.3));
  g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g);
  g.connect(MUS.out);
  o.start(t);
  o.stop(t + d + 0.05);
}


function musTick() {
  if (!MUS.on || !MUS.ac) return;
  const t = MUS.ac.currentTime + 0.08,
    ch = MPROG[MUS.step % 4],
    bat = !!B && cur === 'combat' && !B.over;
  ch.forEach((n, i) => {
    musVoice(musNote(n - 12), t, 7.8, 'triangle', i ? 0.05 : 0.07);
    musVoice(musNote(n - 12) * 1.003, t, 7.8, 'sine', 0.03);
  });
  musVoice(musNote(ch[0] - 24), t, 7.8, 'sine', 0.09);
  const arp = bat ? [0, 2, 1, 3, 2, 1, 3, 0, 0, 2, 1, 3, 2, 3, 1, 2] : [0, 2, 1, 3];
  const step = bat ? 0.5 : 2;
  arp.forEach((j, i) => musVoice(musNote(ch[j] + 12), t + i * step, 0.9, 'sine', bat ? 0.035 : 0.025));
  MUS.step++;
  MUS.timer = setTimeout(musTick, 8000);
}


/* Nappe d’ambiance synthétisée : repli du lecteur de pistes (070) quand les fichiers audio manquent. */
export function musStartCore() {
  if (MUS.on) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    MUS.ac = MUS.ac || new C();
    if (MUS.ac.state === 'suspended') MUS.ac.resume();
    MUS.out = MUS.ac.createGain();
    const lp = MUS.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    MUS.out.connect(lp);
    lp.connect(MUS.ac.destination);
    MUS.out.gain.setValueAtTime(0, MUS.ac.currentTime);
    MUS.out.gain.linearRampToValueAtTime(0.55, MUS.ac.currentTime + 3);
    MUS.on = true;
    MUS.step = 0;
    musTick();
  } catch (e) {}
}


export function musPadStop() {
  if (!MUS.ac || !MUS.out) return;
  clearTimeout(MUS.timer);
  try {
    const o = MUS.out,
      t = MUS.ac.currentTime;
    o.gain.cancelScheduledValues(t);
    o.gain.setValueAtTime(o.gain.value, t);
    o.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => {
      try {
        o.disconnect();
      } catch (e) {}
    }, 1400);
  } catch (e) {}
}


export function musPadLevel() {
  try {
    if (MUS.on && MUS.out && MUS.ac) {
      const t = MUS.ac.currentTime,
        g = MUS.out.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.55 * PREF.musVol, t + 0.4);
    }
  } catch (e) {}
}

/* ===================== v2.0 PRESTIGE : univers, mise en scène, finitions ===================== */
/* --- Univers : la Ligue de la Résonance et ses maîtres (personnages originaux) --- */
export const LEAD = [
  {
    n: 'Bastien Grès',
    t: 'le Tailleur de la Faille',
    q: 'Ici, le sol se fend avant vous. Apprenez à vous ancrer.',
    w: 'Vous avez tenu la ligne. La roche s’en souviendra.',
    l: 'Une faille ne pardonne pas l’hésitation.'
  },
  {
    n: 'Maëva Lagune',
    t: 'la Marée lente',
    q: 'La marée ne se presse jamais. Elle gagne quand même.',
    w: 'Vous avez lu la marée avant qu’elle monte. Bien.',
    l: 'L’eau a fini par vous rejoindre.'
  },
  {
    n: 'Tobias Arc',
    t: 'l’Ingénieur des fronts',
    q: 'Deux lignes de courant. Une seule question : où serez-vous ?',
    w: 'Vous avez trouvé l’espace entre les éclairs.',
    l: 'Le courant passe toujours là où l’on attend.'
  },
  {
    n: 'Capucine Ronce',
    t: 'la Jardinière des haies',
    q: 'Mes racines bougent. Vous, resterez-vous en place ?',
    w: 'Vous avez traversé la haie sans vous y prendre.',
    l: 'Les racines ont été plus patientes que vous.'
  },
  {
    n: 'Vesper Nox',
    t: 'l’Ombre de la brume',
    q: 'On ne vise pas ce qu’on ne voit pas. Moi, je vous vois.',
    w: 'Vous avez avancé à l’aveugle sans trembler.',
    l: 'La brume garde ceux qui s’y perdent.'
  },
  {
    n: 'Iliane Prisme',
    t: 'la Gardienne de l’Écran',
    q: 'Une manche sur deux, mon Écran Psy vous arrête net. L’autre, il faudra frapper juste.',
    w: 'Vous avez frappé quand l’Écran tombait.',
    l: 'Vous vous êtes brisé contre mon Écran.'
  },
  {
    n: 'Rhéa Cendrine',
    t: 'la Forgeronne',
    q: 'La lave tombe là où je l’annonce. Écoutez, ou brûlez.',
    w: 'Vous avez écouté la forge. Le métal est à vous.',
    l: 'La forge ne répète jamais deux fois.'
  },
  {
    n: 'Gaspard Tellure',
    t: 'le Sismographe',
    q: 'Les rochers glissent. Les certitudes aussi.',
    w: 'Vous êtes restés debout quand tout a glissé.',
    l: 'Le plateau a bougé. Vous, trop tard.'
  }
];


export const ELITE_L = [
  {
    n: 'Séléné Voilée',
    t: 'Maîtresse des Ombres',
    q: 'Vos Pokémon ont peur du noir ? Les miens en viennent.',
    w: 'La lumière vous va bien.',
    l: 'L’ombre gagne toujours la dernière manche.'
  },
  {
    n: 'Hector Vaillant',
    t: 'Maître des Poings',
    q: 'Pas de détour. Contact, impact.',
    w: 'Un combat franc. Je n’en demandais pas plus.',
    l: 'Il fallait frapper avant moi.'
  },
  {
    n: 'Aldric Wyrm',
    t: 'Maître des Dragons',
    q: 'Un dragon n’évolue pas pour plaire. Il évolue pour vaincre.',
    w: 'Votre Éveil valait le mien.',
    l: 'Les dragons ne pardonnent pas la demi-mesure.'
  },
  {
    n: 'Ombeline Âtre',
    t: 'Maîtresse des Flammes noires',
    q: 'Le feu qui ne brille pas brûle plus longtemps.',
    w: 'Vous avez éteint ce qui ne se voyait pas.',
    l: 'Les braises couvaient sous vos pieds.'
  }
];


export const CHAMP_L = {
  n: 'Auriane Vale',
  t: 'Championne de la Résonance',
  q: 'J’ai lu vos dix derniers combats. Montrez-moi le onzième.',
  w: 'Vous n’avez pas joué le combat que j’avais lu. C’est ainsi qu’on devient Champion.',
  l: 'Vous avez joué exactement ce que j’attendais.'
};


const PROF = { n: 'Professeure Maëlle Sorbier', t: 'chercheuse en Résonance' };


export const UNIV = [
  [
    'La Résonance',
    'À Kanto et à Johto, les dresseurs l’ont constaté depuis longtemps : quand un Pokémon et son dresseur agissent au même tempo, une énergie monte entre eux. Trois pulsations, et le Pokémon franchit un stade, en plein combat, sans retour possible. Les chercheurs l’ont appelée la Résonance.'
  ],
  [
    'Le règlement de la Ligue',
    'La Ligue de la Résonance a bâti ses tournois sur ce phénomène. Chaque dresseur dispose de 12 points de commandement pour quatre Pokémon. Un premier stade coûte peu et peut s’éveiller. Une recrue confirmée, déjà éveillée lors d’anciens combats, coûte plus cher : la Ligue récompense ceux qui font confiance au combat.'
  ],
  [
    'Tout se lit, rien n’est tiré au sort',
    'Dans les arènes de la Ligue, il n’y a pas de coup critique ni d’esquive chanceuse. Chaque terrain annonce ses pièges, mais aucun adversaire ne dévoile son coup : il frappe là où vous êtes. Gagner, c’est lire les portées, placer, faire réagir les types et choisir le moment de l’Éveil.'
  ],
  [
    'Les notes de Résonance',
    'L’équipe de la Professeure Sorbier a mesuré autre chose : quand plusieurs Pokémon frappent la même cible au même tempo, leurs énergies s’accordent. Trois notes, et le coup résonne. La Ligue classe désormais les Pokémon en rangs, de Faible à Expert, et ses meilleurs dresseurs bâtissent des équipes où chaque rang a son rôle.'
  ]
];


export const CHAP = k => {
  const jc = chapJ415(k); // Johto (v4.15)
  if (jc) return jc;
  const i = ARENAS.findIndex(a => a.k === k);
  if (k === 'tuto') return { c: 'Prologue', t: 'Le premier éveil', who: PROF.n };
  if (i >= 0) return { c: `Chapitre ${i + 1}`, t: SCEN[k].n, who: LEAD[i].n, L: LEAD[i] };
  const e = ELITE.indexOf(k);
  if (e >= 0) return { c: 'Chapitre 9', t: 'Le Conseil 4', who: ELITE_L[e].n, L: ELITE_L[e] };
  if (k === 'champ') return { c: 'Final', t: 'La onzième bataille', who: CHAMP_L.n, L: CHAMP_L };
  if (rivalIdx(k) >= 0) return { c: 'Interlude', t: 'Le rival', who: RIVAL.n, L: leaderOf(k) };
  const lg = legOf(k);
  if (lg) return { c: 'Après-jeu', t: lg.n, who: lg.n, L: leaderOf(k) };
  if (k === 'tdr') return { c: 'Après-jeu', t: 'Tour de Résonance', who: 'La Tour' };
  if (dissonanceDe(k)) return { c: 'Interlude', t: 'Team Dissonance', who: dissonanceDe(k).who, L: leaderOf(k) };
  return null;
};


/* --- Barres de vie : la perte reste visible un instant --- */
export const HPM = {};


/* --- Rang de fin de combat et meilleur rang par terrain --- */
export const RK = ['B', 'A', 'S'];


/* --- Musique d’ambiance générative (option « Musique ») --- */
export const MUS = { ac: null, out: null, on: false, timer: 0, step: 0 };


const MPROG = [
  [57, 64, 69, 72],
  [53, 60, 65, 69],
  [48, 55, 64, 67],
  [55, 62, 67, 71]
];

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* --- Ligue, Conseil, parcours : les visages de la Ligue (réplique d'arène : src/screens/ligue/Arena.jsx) --- */


/* --- Superposition : ouverture (une fois par session), présentation de combat, bannières --- */
AUTO = !!navigator.webdriver || /jsdom/i.test(navigator.userAgent || '');


LASTPH = null;




$('#cbResult').addEventListener(
  'click',
  e => {
    const b = e.target.closest('[data-next]');
    if (!b) return;
    e.stopPropagation();
    backToPrep();
    __set_PREPG(null);
    __set_scSel(b.dataset.next);
    renderPrep();
  },
  true
);


/* --- Clavier : jouer sans souris --- */
document.addEventListener('keydown', e => {
  if (cur !== 'combat' || !B || B.over || ui.busy || e.altKey || e.ctrlKey || e.metaKey) return;
  const tg = e.target;
  if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) return;
  if (
    document.getElementById('vs') ||
    !$('#evoPick').hidden ||
    !$('#cbResult').hidden ||
    !$('#saves').hidden ||
    !$('#sheet').hidden
  )
    return;
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
    const al = B.units.filter(u => u.side === 'a' && !u.ko);
    if (!al.length) return;
    const i = al.findIndex(u => u.uid === ui.sel),
      n = al[(i + (k === 'ArrowRight' ? 1 : -1) + al.length) % al.length];
    ui.sel = n.uid;
    ui.selE = null;
    clearAim();
    renderAll();
    e.preventDefault();
    return;
  }
  if (k === ' ' && tg && tg.tagName === 'BUTTON') return;
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
});


document.addEventListener(
  'pointerdown',
  () => {
    if (PREF.music && !MUS.on) musStart();
  },
  { passive: true }
);
}
