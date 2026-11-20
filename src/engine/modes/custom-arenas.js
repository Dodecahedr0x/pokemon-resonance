// Custom arenas (Camp › Arènes, added in v4.31): create a battle, share it through an ARN-… code.
import { GYMS } from '../data/game-data.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { ARENAS, TERR } from './gyms.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { openBattle } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { today } from '../state/economy.js';
import { RIVAL_POS } from './rival.js';
import { codeChecksum } from './friend-challenges.js';
import { migrateKeys } from '../../lib/saveMigration.js';
import { renderCampPage } from './camp-challenges.js';

export let GYM_EDITOR;
// read by the Camp tabs (src/screens/camp/tabs)
export { GYM_RULES, GYM_TERRAINS, gymShareCode };

export function gymClean(a) {
  if (!a || typeof a !== 'object') {
    return null;
  }
  const f = Array.isArray(a.f) ? a.f.filter(id => typeof id === 'string' && BY[id] && !BY[id].leg).slice(0, 5) : [];
  if (!f.length || !SCEN[a.t] || !SCEN[a.t].foes) {
    return null;
  }
  return {
    id: typeof a.id === 'string' && /^[a-z0-9]{4,12}$/.test(a.id) ? a.id : Math.random().toString(36).slice(2, 10),
    n:
      String(a.n || 'Arène')
        .replace(/[<>&"]/g, '')
        .slice(0, 22) || 'Arène',
    author: String(a.author || '')
      .replace(/[<>&"]/g, '')
      .slice(0, 14),
    t: a.t,
    r: typeof a.r === 'string' && GYM_RULES().some(x => x[0] === a.r) ? a.r : '',
    h: a.h === 'nuit' ? 'nuit' : 'jour',
    lim: [6, 8, 10, 12].includes(a.lim) ? a.lim : 10,
    hb: [0, 10, 20, 30].includes(a.hb) ? a.hb : 10,
    f,
  };
}

function GYM_RULES() {
  const rules = [['', 'Aucune']];
  ARENAS.forEach((A, i) => A.rule && GYMS[i] && rules.push([A.rule, `Arène ${GYMS[i].t}`]));
  return rules;
}

function GYM_TERRAINS() {
  return [...new Set([...TERR, ...ARENAS.map(A => A.k)])].filter(k => SCEN[k] && SCEN[k].foes).map(k => [k, SCEN[k].n]);
}

export function gymScene(a) {
  const b = SCEN[a.t];
  SCEN.perso431 = {
    n: a.n,
    lvl: `Arène personnalisée${a.author ? ' · ' + a.author : ''}`,
    lim: a.lim,
    time: a.h,
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    rule: a.r || undefined,
    hb: a.hb,
    pb: 3,
    lv: 50,
    at: BY[a.f[0]].t[0],
    foes: a.f.map((id, i) => [id, RIVAL_POS[i]]),
    catch: false,
    perso431: a.id,
    noProgress: 1,
    d: `Arène créée${a.author ? ' par ' + a.author : ''}. Ni progression ni capture : 200 ₽ par victoire (3 par jour).`,
  };
  OBST.perso431 = OBST[a.t] || {};
}

export function gymAfter(S, rew, win) {
  rew.perso431 = { win };
  if (!win) {
    return [0, 0];
  }
  const J = (PROFILE.gymJournal =
    PROFILE.gymJournal && PROFILE.gymJournal.d === today() ? PROFILE.gymJournal : { d: today(), n: 0 });
  if (J.n >= 3) {
    return [0, 0];
  }
  J.n++;
  rew.perso431.m = 200;
  return [200, 0];
}

function gymShareCode(a) {
  const o = { n: a.n, author: PROFILE.name || a.author || '', t: a.t, r: a.r, h: a.h, lim: a.lim, hb: a.hb, f: a.f };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `ARN-${b64}-${codeChecksum(b64)}`;
}

function readGym(txt) {
  const m = String(txt || '')
    .replace(/\s+/g, '')
    .match(/ARN-([A-Za-z0-9_-]+)-([a-z0-9]{4})/);
  if (!m) {
    return null;
  }
  if (codeChecksum(m[1]) !== m[2]) {
    return null;
  }
  try {
    const b = m[1].replace(/-/g, '+').replace(/_/g, '/');
    return gymClean(migrateKeys(JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))))));
  } catch (e) {
    return null;
  }
}

function onCustomArenasClick(e) {
  const b = e.target.closest('[data-gym-arena]');
  if (!b) {
    return;
  }
  const a = b.dataset.gymArena,
    i = +b.dataset.i,
    A = (PROFILE.customGyms = PROFILE.customGyms || []);
  if (a === 'new') {
    if (A.length >= 12) {
      return toast('12 arènes au plus : supprimez-en une.');
    }
    GYM_EDITOR = {
      i: -1,
      a: { n: 'Mon arène', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix', 'racaillou', '', '', ''] },
    };
  } else if (a === 'edit' && A[i]) {
    GYM_EDITOR = { i, a: Object.assign({}, A[i], { f: [...A[i].f, '', '', '', '', ''].slice(0, 5) }) };
  } else if (a === 'annuler') {
    GYM_EDITOR = null;
  } else if (a === 'save' && GYM_EDITOR) {
    const c = gymClean(
      Object.assign({}, GYM_EDITOR.a, { f: GYM_EDITOR.a.f.filter(Boolean), author: PROFILE.name || '' })
    );
    if (!c) {
      return toast('Choisissez au moins un adversaire.');
    }
    if (GYM_EDITOR.i >= 0) {
      A[GYM_EDITOR.i] = Object.assign(c, { id: A[GYM_EDITOR.i].id });
    } else {
      A.unshift(c);
    }
    GYM_EDITOR = null;
    queueSave();
    toast('Arène enregistrée.');
  } else if (a === 'suppr' && A[i]) {
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Confirmer';
      return;
    }
    A.splice(i, 1);
    queueSave();
  } else if (a === 'code' && A[i]) {
    GYM_EDITOR = { code: i };
  } else if (a === 'copier' && A[i]) {
    const t = gymShareCode(A[i]);
    try {
      navigator.clipboard.writeText(t).then(
        () => toast('Code copié.'),
        () => toast('Sélectionnez le code et copiez-le.')
      );
    } catch (er) {
      toast('Sélectionnez le code et copiez-le.');
    }
    return;
  } else if (a === 'import') {
    const v = (document.getElementById('gym-code') || {}).value,
      c = readGym(v);
    if (!c) {
      return toast('Code d’arène illisible. Il commence par « ARN- ».');
    }
    if (A.length >= 12) {
      return toast('12 arènes au plus : supprimez-en une.');
    }
    A.unshift(c);
    queueSave();
    toast(`Arène « ${c.n} » ajoutée.`);
  } else if (a === 'jouer' && A[i]) {
    gymScene(A[i]);
    openBattle('perso431');
    return;
  }
  renderCampPage();
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.battleResult.push(r =>
    r.perso431
      ? `<div class="result-list"><h4>Arène personnalisée</h4><div class="result-row"><span>${r.perso431.win ? (r.perso431.m ? 'Victoire récompensée' : 'Victoire (déjà 3 récompenses aujourd’hui)') : 'Défaite'}</span><b>${r.perso431.m ? '+200 ₽' : ''}</b></div></div>`
      : ''
  );

  GYM_EDITOR = null;

  document.addEventListener('change', e => {
    const x = e.target.closest('[data-ar]');
    if (!x || !GYM_EDITOR || !GYM_EDITOR.a) {
      return;
    }
    const k = x.dataset.ar,
      E = GYM_EDITOR.a;
    if (/^f\d$/.test(k)) {
      E.f[+k[1]] = x.value;
    } else if (k === 'lim' || k === 'hb') {
      E[k] = +x.value;
    } else {
      E[k] = x.value;
    }
  });

  document.addEventListener('input', e => {
    const x = e.target.closest('[data-ar="n"]');
    if (x && GYM_EDITOR && GYM_EDITOR.a) {
      GYM_EDITOR.a.n = x.value;
    }
  });

  document.addEventListener('click', onCustomArenasClick);
}
