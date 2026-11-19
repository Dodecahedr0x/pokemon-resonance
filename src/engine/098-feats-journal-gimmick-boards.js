/* Original section: 4.67: feats journal and gimmick boards */

import { SCEN } from './009-pokemon.js';
import { writeLS } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { byUid, setMark, uAt } from './021-combat-engine.js';
import { esc } from './025-saves.js';
import { PREF, savePref, sfx } from './026-campaign-tutorial-sound.js';
import { today } from './032-v4-foundation.js';
import { renderParams } from './040-settings.js';
import { bossScene } from './053-resonance.js';


/** Announcement of the board gimmick at the start of the battle (event list, empty without a gimmick). */
export function announceGim467(S) {
  const g = GIM467[S.gim467];
  return g ? [{ e: 'msg', s: `Plateau « ${g.n} » : ${g.d}` }] : [];
}


function jxBilan467(S, win) {
  const J = (S.stats && S.stats.j430) || { d: {}, t: {}, k: {} },
    al = S.units.filter(u => u.side === 'a'),
    X = (S.stats && S.stats.x467) || {};
  let mvp = null;
  al.forEach(u => {
    const d = J.d[u.uid] || 0;
    if (d > 0 && (!mvp || d > mvp.d)) mvp = { n: u.n, d, k: J.k[u.uid] || 0 };
  });
  const tot = Object.values(J.d).reduce((a, b) => a + b, 0),
    kos = al.filter(u => u.ko).length,
    ex = [];
  if (win && !kos) ex.push('Sans aucun KO');
  if (win && S.round <= 4) ex.push('Victoire éclair');
  if (win && S.stats && S.stats.reso >= 3) ex.push(`${S.stats.reso} Résonances déclenchées`);
  if (win && mvp && tot && mvp.d / tot >= 0.7 && al.length > 1) ex.push(`${mvp.n} a porté l’équipe`);
  if (X.best && X.best.d >= 20) ex.push(`Coup d’éclat : ${X.best.d} dégâts`);
  if (S.stats && S.stats.rx >= 3) ex.push(`${S.stats.rx} réactions en chaîne`);
  return { mvp, best: X.best || null, rounds: S.round, kos, ex: ex.slice(0, 4) };
}


function gimPlace467(S, n, ev) {
  const g = GIM467[S.gim467];
  if (!g) return;
  const freeOnes = Object.keys(S.tiles).filter(k => S.tiles[k] && !S.tiles[k].rock && !S.tiles[k].mark && !uAt(S, k));
  for (let i = 0; i < n && freeOnes.length; i++) {
    const k = freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0];
    setMark(S, k, g.mk);
  }
}

export const jxSt467 = () => {
  try {
    return JSON.parse(localStorage.getItem('res-jx467') || 'null') || { n: 0, h: [], rec: { best: 0, fast: 0 } };
  } catch (e) {
    return { n: 0, h: [], rec: { best: 0, fast: 0 } };
  }
};


const jxSave467 = s => {
  writeLS('res-jx467', s);
};

/* ---------- Gimmick boards ---------- */
export const GIM467 = {
  marais: { n: 'Marais', d: 'Des cases Trempées apparaissent sur le plateau.', mk: 'trempe', ini: 4, ch: 0 },
  fournaise: { n: 'Fournaise', d: 'Des cases Brûlantes, et une de plus toutes les 2 manches.', mk: 'brulant', ini: 3, ch: 2 },
  verglas: { n: 'Verglas', d: 'Des cases de Givre couvrent le plateau.', mk: 'givre', ini: 4, ch: 0 },
  orage: { n: 'Orage', d: 'Une case Chargée apparaît à chaque manche.', mk: 'charge', ini: 1, ch: 1 },
  seisme: { n: 'Terrain instable', d: 'Des cases Fissurées, et une de plus toutes les 2 manches.', mk: 'fissure', ini: 3, ch: 2 }
};

export const gimKey467 = () => (PREF.gim467 === 'rand' || GIM467[PREF.gim467] ? PREF.gim467 : 'off');

// Statements run at startup, in the original order (see index.js).
export function __init() {

HOOKS.degats.push((S, v, real, o) => {
  const a = S.acteur430 && byUid(S, S.acteur430);
  if (a && a.side === 'a' && v.side === 'e' && !(o && o.ind) && real > 0) {
    const X = S.stats.x467 || (S.stats.x467 = { best: null });
    if (!X.best || real > X.best.d) X.best = { d: real, by: a.n, on: v.n, r: S.round };
  }
});


HOOKS.progres.unshift((S, rew, win) => {
  try {
    if (!S.stats || (SCEN[S.sc] && SCEN[S.sc].tuto)) return null;
    const b = jxBilan467(S, win),
      st = jxSt467();
    st.n += b.ex.length;
    st.rec.best = Math.max(st.rec.best, b.best ? b.best.d : 0);
    if (win && (!st.rec.fast || b.rounds < st.rec.fast)) st.rec.fast = b.rounds;
    st.h.unshift({ d: today(), sc: (SCEN[S.sc] && SCEN[S.sc].n) || S.sc, w: win ? 1 : 0, mvp: b.mvp ? b.mvp.n : '', mdmg: b.mvp ? b.mvp.d : 0, best: b.best ? b.best.d : 0, r: b.rounds, ex: b.ex });
    st.h = st.h.slice(0, 15);
    jxSave467(st);
    rew.jx467 = b;
  } catch { /* Best effort: failure here is non-fatal. */ }
  return null;
});


HOOKS.resultat.unshift(r => {
  const b = r.jx467;
  if (!b || (!b.mvp && !b.ex.length)) return '';
  const l = [];
  if (b.mvp) l.push(`Pokémon du combat : <b>${esc(b.mvp.n)}</b> (${b.mvp.d} dégâts${b.mvp.k ? `, ${b.mvp.k} KO` : ''})`);
  if (b.best) l.push(`Meilleur coup : ${b.best.d} dégâts (${esc(b.best.by)} sur ${esc(b.best.on)}, manche ${b.best.r})`);
  l.push(`${b.rounds} manche${b.rounds > 1 ? 's' : ''}${b.kos ? `, ${b.kos} Pokémon tombé${b.kos > 1 ? 's' : ''}` : ''}`);
  return `<div class="res-l"><h4>Journal des exploits</h4><div class="rl"><span>${l.join('<br>')}${b.ex.length ? `<br><em class="jx467-e">${b.ex.map(esc).join(' · ')}</em>` : ''}</span></div></div>`;
});


HOOKS.combat.push(S => {
  const c = gimKey467();
  if (c === 'off' || !S || S.fixe431 || S.br466 || bossScene(S) || (SCEN[S.sc] && SCEN[S.sc].tuto)) return;
  S.gim467 = c === 'rand' ? Object.keys(GIM467)[Math.floor(Math.random() * Object.keys(GIM467).length)] : c;
  gimPlace467(S, GIM467[S.gim467].ini);
});


HOOKS.avantFinManche.push((S, ev) => {
  const g = S.gim467 && GIM467[S.gim467];
  if (!g || !g.ch || S.round % g.ch) return;
  gimPlace467(S, 1, ev);
});




document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-gim467]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    PREF.gim467 = b.dataset.gim467;
    savePref();
    sfx('ui');
    try {
      renderParams();
    } catch { /* Best effort: failure here is non-fatal. */ }
  },
  true
);


// "Gimmick Boards" and "Feats Journal" panels: rendered by React (src/screens/settings/panels/)

}
