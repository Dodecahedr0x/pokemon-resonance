import { MV } from '../data/moves.js';
import { BY, familyOf } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, toast } from '../core/utils.js';
import { openId, openSheet } from '../team/team.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { SHOP, bagN } from '../state/economy.js';
import { renderBag } from '../progression/quests-shop.js';
import { inheritedMoveHtml } from '../progression/daycare.js';

let TM_K;

/* ---------- game state ---------- */
/** family (base form) → learned move. Declared function: defProfile calls it as soon as it loads. */
export function TM0() {
  return { learnedTms: {} };
}

export function tmClean(p) {
  const o = TM0(),
    a = p && p.learnedTms;
  if (a && typeof a === 'object') {
    for (const b in a) {
      if (BY[b] && MV[a[b]]) {
        o.learnedTms[b] = a[b];
      }
    }
  }
  return o;
}

function compatible(k, base) {
  const M = MACHINES[k];
  if (!M || !BY[base]) {
    return false;
  }
  if (M.forAll) {
    return true;
  }
  if ((M.familles || []).some(f => BY[f] && BY[f].base === base)) {
    return true;
  }
  return familyTypes(base).some(t => M.types.includes(t));
}

/* ---------- in battle: the learned move is added to the form's two moves ---------- */
export function addLearned(S, learned) {
  if (!learned) {
    return;
  }
  S.units.forEach(u => {
    const m = u.side === 'a' && learned[u.sp];
    if (!m || !MV[m]) {
      return;
    }
    u.ctm = m;
    if (!u.mv.includes(m)) {
      u.mv.push(m);
    }
  });
}

function openLearning(k) {
  TM_K = k;
  renderLearning();
  $('#ctBox').hidden = false;
}

function renderLearning() {
  const k = TM_K,
    M = MACHINES[k],
    m = MV[M.mv],
    families = raisedFamilies().sort((a, b) => compatible(k, b) - compatible(k, a));
  // rendering: src/screens/overlays/TmBox.jsx
  paintOverlay('ct', {
    M,
    m,
    families: families.map(b => ({ b, ok: compatible(k, b), already: PROFILE.learnedTms[b] })),
  });
}

function learnTm(k, b) {
  const M = MACHINES[k];
  if (!M || !compatible(k, b) || !bagN(k)) {
    return;
  }
  const previous = PROFILE.learnedTms[b];
  PROFILE.learnedTms[b] = M.mv;
  if (!M.cs) {
    PROFILE.bag[k] = bagN(k) - 1;
    if (!PROFILE.bag[k]) {
      delete PROFILE.bag[k];
    }
  }
  sfx('ui');
  vibe(20);
  toast(`${BY[b].n} apprend ${MV[M.mv].n}${previous ? ` à la place de ${MV[previous].n}` : ''} !`);
  queueSave();
  $('#ctBox').hidden = true;
  renderBag();
}

function forgetTM(b) {
  if (!PROFILE.learnedTms[b]) {
    return;
  }
  toast(`${BY[b].n} oublie ${MV[PROFILE.learnedTms[b]].n}.`);
  delete PROFILE.learnedTms[b];
  queueSave();
}

/** In a Pokémon's sheet: its learned move. */
export function moveLearned(id) {
  const b = BY[id] && BY[id].base,
    a = b && PROFILE.learnedTms[b];
  if (!a) {
    return inheritedMoveHtml(b);
  } // inherited move (v4.16)
  const M = Object.values(MACHINES).find(x => x.mv === a);
  return (
    `<div class="mvc tm-move"><div class="t"><b>${MV[a].n}</b><span class="chip">${M ? M.num : 'Apprise'}</span></div><p>${MV[a].d}</p><button type="button" class="button button-small button-ghost" data-ctoubli="${b}">Oublier</button></div>` +
    inheritedMoveHtml(b)
  );
}

/* =====================================================================
   v4.6: TMs and HMs
   ---------------------------------------------------------------------
   The Shop sells TMs (Pokédollars, single use, as in generation 2)
   and HMs (Shards, reusable). From the Bag, a machine is taught to a
   compatible family: the move becomes its 3rd move, kept at all stages,
   Awakening included.
   A family has a single learned-move slot: learning another one
   replaces it.
   Compatibility: by the family's types (all stages combined),
   plus a few families known to learn it in the games.
   ===================================================================== */

/* ---------- the machines (Johto numbers) ---------- */
export const MACHINES = {
  ct01: { num: 'CT01', mv: 'dynamopoing', p: 3000, types: ['Combat', 'Psy', 'Roche', 'Normal'] },
  ct11: { num: 'CT11', mv: 'zenith', p: 2000, forAll: true },
  ct14: { num: 'CT14', mv: 'blizzard', p: 4000, types: ['Glace', 'Eau'] },
  ct18: { num: 'CT18', mv: 'dansepluie', p: 2000, forAll: true },
  ct22: { num: 'CT22', mv: 'lancesoleil', p: 3500, types: ['Plante'] },
  ct23: { num: 'CT23', mv: 'queuedefer', p: 3000, types: ['Acier', 'Électrik', 'Dragon', 'Roche', 'Sol'] },
  ct26: { num: 'CT26', mv: 'seisme', p: 4000, types: ['Sol', 'Roche', 'Combat', 'Dragon', 'Normal'] },
  ct29: {
    num: 'CT29',
    mv: 'psyko',
    p: 3500,
    types: ['Psy', 'Spectre'],
    familles: ['ramoloss', 'lokhlass', 'melo', 'ptitard', 'ronflex', 'porygon'],
  },
  ct30: { num: 'CT30', mv: 'ballombre', p: 3500, types: ['Spectre', 'Psy', 'Ténèbres'] },
  ct31: {
    num: 'CT31',
    mv: 'coudboue',
    p: 1500,
    types: ['Sol', 'Roche', 'Eau', 'Électrik', 'Feu', 'Normal', 'Combat', 'Poison'],
  },
  ct37: { num: 'CT37', mv: 'sable', p: 2000, types: ['Sol', 'Roche', 'Acier'] },
  ct41: { num: 'CT41', mv: 'poingeclair', p: 3000, types: ['Électrik', 'Combat', 'Psy'] },
  cs01: {
    num: 'CS01',
    mv: 'coupe',
    g: 8,
    cs: true,
    types: ['Plante', 'Insecte', 'Normal', 'Feu', 'Eau', 'Sol', 'Ténèbres', 'Acier'],
  },
  cs03: { num: 'CS03', mv: 'surf', g: 12, cs: true, types: ['Eau', 'Dragon'], familles: ['ronflex'] },
  cs04: {
    num: 'CS04',
    mv: 'force',
    g: 10,
    cs: true,
    types: ['Combat', 'Roche', 'Sol', 'Normal', 'Dragon', 'Feu', 'Eau'],
  },
  cs07: { num: 'CS07', mv: 'cascade', g: 10, cs: true, types: ['Eau'] },
};

/* ---------- compatibility ---------- */
const familyTypes = base => [...new Set(familyOf(base).flatMap(m => m.t))];

/** The families that can be taught: in Campaign those in the Box, in Free mode all of them. */
const raisedFamilies = () => [
  ...new Set(PROFILE.box.map(id => BY[id] && BY[id].base).filter(Boolean)), // Free mode too: the captured families (v4.21)
];

/** After an Awakening, the new form's moves, plus the learned move. */
export const withLearned = (u, mv) => {
  const o = u.ctm && !mv.includes(u.ctm) ? [...mv, u.ctm] : [...mv];
  if (u.hm && MV[u.hm] && !o.includes(u.hm)) {
    o.push(u.hm);
  } // inherited move (v4.16)
  return o;
};

// Startup statements, run in their original order (see index.js).
export function init() {
  /* ---------- HM moves that did not exist yet ---------- */
  Object.assign(MV, {
    coupe: {
      n: 'Coupe',
      t: 'Normal',
      p: 7,
      r: 1,
      sh: 'one',
      fx: 'cut',
      d: 'Au contact. Fauche les hautes herbes de la case visée.',
    },
    force: { n: 'Force', t: 'Normal', p: 9, r: 1, sh: 'one', fx: 'push', v: 2, d: 'Au contact, repousse de 2 cases.' },
    cascade: { n: 'Cascade', t: 'Eau', p: 9, r: 1, sh: 'one', mk: 'trempe', d: 'Au contact, Trempé.' },
  });

  // they are stored in the Shop and the Bag like the other items
  for (const k in MACHINES) {
    const M = MACHINES[k],
      m = MV[M.mv];
    SHOP[k] = {
      n: `${M.num} · ${m.n}`,
      sn: M.num,
      d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : ''}${m.d}${M.cs ? ' Réutilisable.' : ' Usage unique.'}`,
      category: 'machines',
      mv: M.mv,
      cs: !!M.cs,
      ...(M.g ? { g: M.g } : { p: M.p }),
    };
  }

  /* ---------- Bag: learning ---------- */
  // #ctBox: rendered by React (src/screens/overlays/TmBox.jsx)

  TM_K = null;

  document.addEventListener('click', e => {
    const ap = e.target.closest('[data-apprendre]');
    if (ap) {
      return openLearning(ap.dataset.apprendre);
    }
    const f = e.target.closest('[data-ctf]');
    if (f && TM_K) {
      return learnTm(TM_K, f.dataset.ctf);
    }
    const x = e.target.closest('[data-ct]');
    if (x || e.target.id === 'ctBox') {
      $('#ctBox').hidden = true;
      return;
    }
    const o = e.target.closest('[data-ctoubli]');
    if (o) {
      forgetTM(o.dataset.ctoubli);
      if (openId) {
        openSheet(openId, true);
      } // the open sheet is updated
    }
  });
}
