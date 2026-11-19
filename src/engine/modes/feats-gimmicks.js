/* Feats journal and gimmick boards (added in v4.67). */

import { SCEN } from '../pokemon/pokemon.js';
import { writeLS } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { byUid, setMark, uAt } from '../combat/engine.js';
import { esc } from '../state/saves.js';
import { PREF, savePref } from '../ui/preferences.js';
import { sfx } from '../audio/sound-effects.js';
import { today } from '../state/economy.js';
import { renderParams } from '../ui/settings.js';
import { bossScene } from '../combat/resonance.js';

/** Announcement of the board gimmick at the start of the battle (event list, empty without a gimmick). */
export function announceGimmick(S) {
  const g = GIMMICKS[S.gimmickBoard];
  return g ? [{ e: 'msg', s: `Plateau « ${g.n} » : ${g.d}` }] : [];
}

function featsSummary(S, win) {
  const J = (S.stats && S.stats.journalStats) || { d: {}, t: {}, k: {} },
    al = S.units.filter(u => u.side === 'a'),
    X = (S.stats && S.stats.featStats) || {};
  let mvp = null;
  al.forEach(u => {
    const d = J.d[u.uid] || 0;
    if (d > 0 && (!mvp || d > mvp.d)) {
      mvp = { n: u.n, d, k: J.k[u.uid] || 0 };
    }
  });
  const tot = Object.values(J.d).reduce((a, b) => a + b, 0),
    kos = al.filter(u => u.ko).length,
    ex = [];
  if (win && !kos) {
    ex.push('Sans aucun KO');
  }
  if (win && S.round <= 4) {
    ex.push('Victoire éclair');
  }
  if (win && S.stats && S.stats.resonant >= 3) {
    ex.push(`${S.stats.resonant} Résonances déclenchées`);
  }
  if (win && mvp && tot && mvp.d / tot >= 0.7 && al.length > 1) {
    ex.push(`${mvp.n} a porté l’équipe`);
  }
  if (X.best && X.best.d >= 20) {
    ex.push(`Coup d’éclat : ${X.best.d} dégâts`);
  }
  if (S.stats && S.stats.rx >= 3) {
    ex.push(`${S.stats.rx} réactions en chaîne`);
  }
  return { mvp, best: X.best || null, rounds: S.round, kos, ex: ex.slice(0, 4) };
}

function gimmickPlace(S, n, _ev) {
  const g = GIMMICKS[S.gimmickBoard];
  if (!g) {
    return;
  }
  const freeOnes = Object.keys(S.tiles).filter(k => S.tiles[k] && !S.tiles[k].rock && !S.tiles[k].mark && !uAt(S, k));
  for (let i = 0; i < n && freeOnes.length; i++) {
    const k = freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0];
    setMark(S, k, g.mk);
  }
}

export const featsState = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('res-feats-journal') || 'null') || { n: 0, h: [], rec: { best: 0, fast: 0 } }
    );
  } catch (e) {
    return { n: 0, h: [], rec: { best: 0, fast: 0 } };
  }
};

const featsSave = s => {
  writeLS('res-feats-journal', s);
};

/* ---------- Gimmick boards ---------- */
export const GIMMICKS = {
  marais: { n: 'Marais', d: 'Des cases Trempées apparaissent sur le plateau.', mk: 'trempe', ini: 4, ch: 0 },
  fournaise: {
    n: 'Fournaise',
    d: 'Des cases Brûlantes, et une de plus toutes les 2 manches.',
    mk: 'brulant',
    ini: 3,
    ch: 2,
  },
  verglas: { n: 'Verglas', d: 'Des cases de Givre couvrent le plateau.', mk: 'givre', ini: 4, ch: 0 },
  orage: { n: 'Orage', d: 'Une case Chargée apparaît à chaque manche.', mk: 'charge', ini: 1, ch: 1 },
  seisme: {
    n: 'Terrain instable',
    d: 'Des cases Fissurées, et une de plus toutes les 2 manches.',
    mk: 'fissure',
    ini: 3,
    ch: 2,
  },
};

export const gimmickKey = () =>
  PREF.gimmickBoard === 'rand' || GIMMICKS[PREF.gimmickBoard] ? PREF.gimmickBoard : 'off';

function onProgress(S, rew, win) {
  try {
    if (!S.stats || (SCEN[S.sc] && SCEN[S.sc].tuto)) {
      return null;
    }
    const b = featsSummary(S, win),
      st = featsState();
    st.n += b.ex.length;
    st.rec.best = Math.max(st.rec.best, b.best ? b.best.d : 0);
    if (win && (!st.rec.fast || b.rounds < st.rec.fast)) {
      st.rec.fast = b.rounds;
    }
    st.h.unshift({
      d: today(),
      sc: (SCEN[S.sc] && SCEN[S.sc].n) || S.sc,
      w: win ? 1 : 0,
      mvp: b.mvp ? b.mvp.n : '',
      mdmg: b.mvp ? b.mvp.d : 0,
      best: b.best ? b.best.d : 0,
      r: b.rounds,
      ex: b.ex,
    });
    st.h = st.h.slice(0, 15);
    featsSave(st);
    rew.featsJournal = b;
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return null;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.damage.push((S, v, real, o) => {
    const a = S.lastActor && byUid(S, S.lastActor);
    if (a && a.side === 'a' && v.side === 'e' && !(o && o.ind) && real > 0) {
      const X = S.stats.featStats || (S.stats.featStats = { best: null });
      if (!X.best || real > X.best.d) {
        X.best = { d: real, by: a.n, on: v.n, r: S.round };
      }
    }
  });

  HOOKS.progress.unshift(onProgress);

  HOOKS.battleResult.unshift(r => {
    const b = r.featsJournal;
    if (!b || (!b.mvp && !b.ex.length)) {
      return '';
    }
    const l = [];
    if (b.mvp) {
      l.push(`Pokémon du combat : <b>${esc(b.mvp.n)}</b> (${b.mvp.d} dégâts${b.mvp.k ? `, ${b.mvp.k} KO` : ''})`);
    }
    if (b.best) {
      l.push(`Meilleur coup : ${b.best.d} dégâts (${esc(b.best.by)} sur ${esc(b.best.on)}, manche ${b.best.r})`);
    }
    l.push(
      `${b.rounds} manche${b.rounds > 1 ? 's' : ''}${b.kos ? `, ${b.kos} Pokémon tombé${b.kos > 1 ? 's' : ''}` : ''}`
    );
    return `<div class="res-l"><h4>Journal des exploits</h4><div class="rl"><span>${l.join('<br>')}${b.ex.length ? `<br><em class="feats-journal-e">${b.ex.map(esc).join(' · ')}</em>` : ''}</span></div></div>`;
  });

  HOOKS.combat.push(S => {
    const c = gimmickKey();
    if (c === 'off' || !S || S.restricted || S.bossRush || bossScene(S) || (SCEN[S.sc] && SCEN[S.sc].tuto)) {
      return;
    }
    S.gimmickBoard = c === 'rand' ? Object.keys(GIMMICKS)[Math.floor(Math.random() * Object.keys(GIMMICKS).length)] : c;
    gimmickPlace(S, GIMMICKS[S.gimmickBoard].ini);
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    const g = S.gimmickBoard && GIMMICKS[S.gimmickBoard];
    if (!g || !g.ch || S.round % g.ch) {
      return;
    }
    gimmickPlace(S, 1, ev);
  });

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-gimmick-board]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      PREF.gimmickBoard = b.dataset.gimmickBoard;
      savePref();
      sfx('ui');
      try {
        renderParams();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    },
    true
  );

  // "Gimmick Boards" and "Feats Journal" panels: rendered by React (src/screens/settings/panels/)
}
