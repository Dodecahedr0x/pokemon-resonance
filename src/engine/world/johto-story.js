/* =====================================================================
   The Johto story: Admin Cobalt's Neo-Dissonance (added in v4.16).
   4 battles, after Johto badges 2, 4, 6 and 8; the last one opens the
   Plateau. Also the Johto location helpers (next step, locks, chapter,
   reward line, lead) and the Johto battle-rule dispatchers, which cover
   the story, the roaming beasts, the Dominant Pokémon and the Hoenn gyms.
   ===================================================================== */
import { BY, SCEN } from '../pokemon/pokemon.js';
import { ITEMS2, PROFILE } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { P, hasNx, nextId, say, setMark, transform } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { HELD_IMG, fmt } from '../state/economy.js';
import { ITM } from '../assets/item-icons.js';
import { PL } from './map.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { JCHAIN, JGYMS, PLACES_J } from './johto.js';
import { hoennSetup, hoennTick } from './hoenn.js';
import {
  TALIS,
  findRoamLegend,
  getRoamState,
  isRoamingActive,
  roamLegendInfo,
  setupRoaming,
} from './roaming-beasts.js';
import { dominantSetup, dominantTick } from './dominant-pokemon.js';

/** The next step in Johto: gyms and story intermixed. */
export function nextJohtoStep() {
  const J = PROFILE.johto || [],
    d = PROFILE.jdis || 0,
    T = JDIS[d];
  for (let i = 0; i < 8; i++) {
    if (T && T.jafter <= i && J.length >= T.jafter) {
      return [T.k, `Néo-Dissonance · ${T.n}`];
    }
    if (!J.includes(i)) {
      return ['j' + (i + 1), `Johto · Arène ${JGYMS[i]}`];
    }
  }
  if (T) {
    return [T.k, `Néo-Dissonance · ${T.n}`];
  }
  if (!PROFILE.jchamp) {
    return ['jchamp', 'Maître de Johto'];
  }
  return null;
}

export function johtoLock(k, D) {
  const J = (PROFILE.johto || []).length;
  if (D.jdis) {
    if (J < D.jafter) {
      return `La Néo-Dissonance frappera après votre ${D.jafter}e badge de Johto.`;
    }
    if ((PROFILE.jdis || 0) < D.jdis - 1) {
      return 'Battez d’abord le combat précédent de la Néo-Dissonance.';
    }
    return null;
  }
  if (D.roam) {
    return isRoamingActive() ? null : 'Les bêtes légendaires dorment encore sous la Tour Cendrée.';
  }
  if (D.jfinal && J >= 8 && (PROFILE.jdis || 0) < 4 && !PROFILE.jchamp) {
    return 'Arrêtez d’abord Cobalt au Relais du Plateau.';
  }
  return undefined; // the v4.15 rules apply
}

export function johtoChapterLive(k) {
  const D = SCEN[k];
  if (!D) {
    return null;
  }
  if (D.jdis) {
    const T = JDIS[D.jdis - 1];
    return { c: `Johto · Néo-Dissonance ${D.jdis} / 4`, t: T.lieu, who: T.who, L: T.L };
  }
  if (D.roam) {
    const L = findRoamLegend(D.roam);
    return { c: 'Johto · Bête errante', t: `${L.n}, ${L.title}`, who: L.n, L: roamLegendInfo(D.roam) };
  }
  return null;
}

/** Under a location's description: story rewards, state of a roaming beast. */
export function johtoExtraLine(k) {
  const D = SCEN[k];
  if (D.jdis) {
    const T = JDIS[D.jdis - 1];
    if ((PROFILE.jdis || 0) >= D.jdis) {
      return '';
    } // already defeated: no second bounty
    return `<div class="v4-rew"><span><span class="coin-icon" aria-hidden="true">₽</span>+${fmt(T.rew[0])}</span><span><span class="gem-icon"><svg><use href="#i-gem"/></svg></span>+${T.rew[1]}</span></div>`;
  }
  if (D.roam) {
    const r = getRoamState(D.roam),
      it = TALIS[D.roam];
    return `<div class="v4-rew"><span class="v4-rew-b rm-hp"><i style="width:${Math.round((r.hp || 1) * 100)}%"></i>PV ${Math.round((r.hp || 1) * 100)} %${r.seenFlags ? ` · vu ${r.seenFlags} fois` : ''}</span><span><img src="${ITM(HELD_IMG[it])}" alt="" loading="lazy">${ITEMS2[it].n}</span><span><span class="gem-icon"><svg><use href="#i-gem"/></svg></span>+12</span></div>`;
  }
  return '';
}

export function johtoLead(sc) {
  const D = SCEN[sc];
  if (!D) {
    return null;
  }
  if (D.jdis) {
    return JDIS[D.jdis - 1].L;
  }
  if (D.roam) {
    return roamLegendInfo(D.roam);
  }
  return null;
}

/* ---------- story battle rules ---------- */
export function johtoSetup(S, r, ev) {
  if (r === 'jbrouille') {
    say(ev, 'Brouilleur : en fin de manche, votre Pokémon le plus chargé perd 1 losange.');
  }
  if (r === 'jcendre') {
    say(ev, 'Tour Cendrée : chaque manche, deux cases prennent feu.');
  }
  if (r === 'jonde') {
    say(ev, 'Antenne Rouge : à la fin des manches 1 et 3, les Pokémon de Cobalt évoluent de force.');
  }
  if (r === 'jmauvaise') {
    say(ev, 'Relais de Mauvaise Onde : les notes de Résonance s’effacent en fin de manche.');
  }
  if (r === 'jroam') {
    setupRoaming(S, ev);
  }
  hoennSetup(S, r, ev); // Hoenn gyms (v4.19)
  if (r === 'jdom') {
    dominantSetup(S, ev);
  }
}

export function johtoTick(S, r, ev) {
  if (S.over) {
    return;
  }
  const R = S.round,
    es = S.units.filter(u => u.side === 'e' && !u.ko),
    al = S.units.filter(u => u.side === 'a' && !u.ko);
  if (r === 'jbrouille') {
    const u = al.filter(a => (a.en || 0) > 0).sort((a, b) => b.en - a.en)[0];
    if (u) {
      u.en = Math.max(0, u.en - 1);
      say(ev, `Brouilleur : ${u.n} perd 1 losange.`);
    }
  }
  if (r === 'jcendre') {
    const freeOnes = Object.keys(S.tiles).filter(k => {
      const t = S.tiles[k],
        c = P(k)[0];
      return c >= 2 && c <= 5 && !t.rock && !t.w && !(t.mark && t.mark.k === 'brulant');
    });
    let n = 0;
    for (let i = 0; i < 2 && freeOnes.length; i++) {
      const k = freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0];
      setMark(S, k, 'brulant', null);
      n++;
    }
    if (n) {
      say(ev, `Tour Cendrée : ${n} case${n > 1 ? 's prennent' : ' prend'} feu.`);
      ev.push({ e: 'arena', r });
    }
  }
  if (r === 'jonde' && (R === 2 || R === 4)) {
    let n = 0;
    es.forEach(e => {
      if (e.seg || e.colossus || !hasNx(e)) {
        return;
      }
      const id = nextId(S, e);
      if (!id) {
        return;
      }
      transform(S, e, id, ev);
      n++;
    });
    say(
      ev,
      n ? `Antenne Rouge : ${n} Pokémon de Cobalt évoluent de force !` : 'Antenne Rouge : plus rien à faire évoluer.'
    );
  }
  if (r === 'jmauvaise') {
    const n = es.filter(e => e.notes).length;
    es.forEach(e => (e.notes = null));
    if (n) {
      say(ev, `Mauvaise Onde : ${n} note${n > 1 ? 's' : ''} de Résonance effacée${n > 1 ? 's' : ''}.`);
    }
  }
  if (r === 'jdom') {
    dominantTick(S, ev);
  }
  hoennTick(S, r, ev); // Hoenn gyms (v4.19)
}

const JDIS = [
  {
    k: 'jd1',
    jafter: 2,
    lieu: 'Puits aux Ondes',
    x: 300,
    y: 455,
    n: 'Sbires de la Néo-Dissonance',
    who: 'Les Sbires',
    pl: true,
    t: 'la Néo-Dissonance, aux ordres de Cobalt',
    rule: 'jbrouille',
    lv: 49,
    hb: 26,
    pb: 4,
    time: 'nuit',
    bio: 'gue',
    at: 'Ténèbres',
    water: ['4,0', '5,0'],
    rock: ['3,3'],
    foes: [
      ['nosferalto', [6, 1]],
      ['demolosse', [6, 3]],
      ['migalos', [6, 5]],
      ['noctali', [7, 2]],
    ],
    rew: [1800, 6],
    q: 'La Dissonance, dissoute ? Elle a juste changé de chef. Cobalt nous a promis une Résonance qui obéit.',
    w: 'Les balises sont grillées… Cobalt va devoir tout recommencer.',
    l: 'Bzzz. Plus de losanges, plus de Résonance. Simple.',
    d: 'Des Sbires en uniforme gris et rouge plantent des balises dans les herbes. Leur brouilleur aspire la Résonance : en fin de manche, votre Pokémon le plus chargé perd 1 losange.',
  },
  {
    k: 'jd2',
    jafter: 4,
    lieu: 'Tour Cendrée',
    x: 300,
    y: 190,
    n: 'Admin Vesper',
    who: 'Vesper',
    t: 'Admin de la Néo-Dissonance, la voix de l’ombre',
    rule: 'jcendre',
    mut: 'eclipse',
    lv: 53,
    hb: 30,
    pb: 5,
    time: 'nuit',
    bio: 'tour',
    at: 'Spectre',
    water: [],
    rock: ['3,1', '3,4'],
    foes: [
      ['ectoplasma', [6, 2]],
      ['demolosse', [7, 1]],
      ['noctali', [6, 4]],
      ['nostenfer', [7, 3]],
    ],
    rew: [2600, 8],
    q: 'Orphée nous avait dissous. Cobalt m’a rappelée. Je ne sais plus qui a raison… mais je sais encore me battre.',
    w: 'Les flammes… Trois ombres se sont réveillées sous la tour, et elles fuient à travers Johto. Ce n’est pas ce que je voulais.',
    l: 'Le feu et la nuit. Rien d’autre.',
    d: 'Vesper a mis le feu à la vieille tour pour couvrir la fuite de la Néo-Dissonance. Éclipse : Spectre et Ténèbres frappent plus fort, vos tirs portent moins loin. Chaque manche, deux cases prennent feu.',
  },
  {
    k: 'jd3',
    jafter: 6,
    lieu: 'Antenne Rouge',
    x: 515,
    y: 160,
    n: 'Admin Cobalt',
    who: 'Cobalt',
    t: 'l’ingénieur, chef de la Néo-Dissonance',
    rule: 'jonde',
    lv: 55,
    hb: 22,
    pb: 4,
    time: 'jour',
    bio: 'ligue',
    at: 'Électrik',
    water: ['5,0', '5,5'],
    rock: ['3,2'],
    foes: [
      ['magneti', [6, 1]],
      ['embrylex', [6, 3]],
      ['minidraco', [6, 5]],
      ['loupio', [7, 2]],
    ],
    rew: [3200, 10],
    q: 'L’Éveil ? Un caprice. Avec mon antenne, plus besoin de lien : ils évoluent quand JE le décide.',
    w: 'L’antenne grésille… Qu’importe. Le Relais est prêt. Rendez-vous au pied du Plateau.',
    l: 'Voilà ce qu’est une évolution maîtrisée.',
    d: 'L’Antenne Rouge force les Pokémon de Cobalt à évoluer : à la fin des manches 1 et 3, tous ceux qui le peuvent évoluent d’un coup. Frappez avant qu’ils ne grandissent.',
  },
  {
    k: 'jd4',
    jafter: 8,
    lieu: 'Relais du Plateau',
    x: 770,
    y: 290,
    n: 'Cobalt, le Relais',
    who: 'Cobalt',
    t: 'chef de la Néo-Dissonance',
    rule: 'jmauvaise',
    lv: 60,
    hb: 46,
    pb: 8,
    time: 'nuit',
    bio: 'arene',
    at: 'Acier',
    water: ['4,0', '4,5'],
    rock: ['3,2', '3,3'],
    foes: [
      ['steelix', [6, 2], { boss: true, hb: 80, pb: 8 }],
      ['magneton', [7, 1]],
      ['scarhino', [6, 4]],
      ['migalos', [7, 3]],
    ],
    rew: [4500, 16],
    q: 'Orphée a choisi le silence. Moi, je choisis le contrôle. Ta Résonance s’arrête ici, dans mon brouillage.',
    w: 'Orphée Valcourt surgit et coupe le Relais : « C’est fini, Cobalt. » La Néo-Dissonance se tait pour de bon.',
    l: 'Plus de notes, plus de Résonance. Juste du bruit.',
    d: 'Le Relais brouille la Résonance : en fin de manche, toutes les notes posées sur les adversaires s’effacent. Enchaînez vos coups dans la même manche.',
  },
].filter(T => T.foes.every(([id]) => BY[id]));

// Instructions run at startup, in the original order (see index.js).
export function init() {
  JDIS.forEach((T, i) => {
    T.L = { n: T.who, t: T.t, q: T.q, w: T.w, l: T.l };
    SCEN[T.k] = {
      n: T.n,
      lvl: `Néo-Dissonance · combat ${i + 1} sur 4`,
      lim: 11,
      time: T.time,
      bio: T.bio,
      jdis: i + 1,
      jafter: T.jafter,
      style: i === 3 ? 'boss' : null,
      at: T.at,
      mut: T.mut || null,
      rule: T.rule,
      water: T.water,
      rock: T.rock,
      hb: T.hb,
      pb: T.pb,
      lv: T.lv,
      d: T.d,
      foes: T.foes,
    };
    OBST[T.k] = i === 0 ? { grass: ['2,2', '3,2', '2,3'] } : {};
    PLACES_J.push({ id: T.k, x: T.x, y: T.y, n: T.lieu, s: `Néo-Dissonance · ${T.who}`, grp: 'aventure', j: 1 });
  });
  JCHAIN.splice(JCHAIN.indexOf('j3'), 0, 'jd1');
  JCHAIN.splice(JCHAIN.indexOf('j5'), 0, 'jd2');
  JCHAIN.splice(JCHAIN.indexOf('j7'), 0, 'jd3');
  JCHAIN.splice(JCHAIN.indexOf('jchamp'), 0, 'jd4');
  PLACES_J.forEach(p => (PL[p.id] = p));
  /* ---------- hooks: after the battle ---------- */
  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {},
      o = [0, 0];
    if (win && D.jdis && (PROFILE.jdis || 0) < D.jdis) {
      PROFILE.jdis = D.jdis;
      const T = JDIS[D.jdis - 1];
      o[0] += T.rew[0];
      o[1] += T.rew[1];
      rew.jdis = D.jdis;
    }
    return o[0] || o[1] ? o : null;
  });
  HOOKS.battleResult.push(r => {
    if (!r.jdis) {
      return '';
    }
    const T = JDIS[r.jdis - 1];
    return `<div class="res-l"><h4>Néo-Dissonance</h4><div class="rl"><span>${T.who} ${T.pl ? 'sont battus' : 'est battu'} (${r.jdis} / 4). « ${T.w} »${r.jdis === 2 ? ' <b>Raikou, Entei et Suicune errent désormais sur la carte de Johto.</b>' : ''}${r.jdis === 4 ? ' <b>Le Plateau de Johto vous est ouvert.</b>' : ''}</span><b>${r.jdis} / 4</b></div></div>`;
  });
  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'neodis',
    n: 'Onde coupée',
    d: 'Vaincre la Néo-Dissonance à Johto.',
    t: 'Briseur d’ondes',
    ok: () => (PROFILE.jdis || 0) >= 4,
    p: () => [PROFILE.jdis || 0, 4],
  });
}
