import { CHAINS, EL, MX, ROLES } from '../data/game-data.js';
import { MV } from '../data/moves.js';
import { BY, EEVEE, FAMT, MKT, PRESETS, familyOf } from '../pokemon/pokemon.js';
import { BUDGET, RECRUIT } from '../pokemon/evolution.js';
import { ITEMS2, PROFILE, inBox, ownedItems } from '../state/game-state.js';
import { RC } from '../pokemon/roles-synergies.js';
import { $, INK, RM, writeLS, typeGlyphPath, markOf, typeColor, toast } from '../core/utils.js';
import { cur } from '../core/navigation.js';
import { openRx } from '../data/types.js';
import { BRANCHES } from '../combat/engine.js';
import { B } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { renderPrep } from '../combat/battle-prep.js';
import { renderHome } from '../world/home.js';
import { artTag } from '../assets/illustrations.js';
import { challengeRefusal } from '../progression/campaign-challenges.js';
import { expRefusal } from '../progression/expeditions.js';
import { FAMILY_REGION_NAMES, captureSite, familyRegion } from '../world/catch-anywhere.js';
import { hideSheet, refreshFilters, refreshGrid, refreshTeam, showSheet } from '../../screens/team/teamStore.js';

export let squad, filt, openId, gen;
let ftype, q, lastFocus;
export function __set_squad(v) {
  return (squad = v);
}
export function __set_filt(v) {
  return (filt = v);
}

export function save() {
  writeLS('res8-squad', squad);
  queueSave();
}

export function monMarks(m) {
  return [...new Set(m.mv.map(id => MV[id].mk).filter(Boolean))];
}

export function monEls(m) {
  return [
    ...new Set(
      m.mv
        .map(id => MV[id])
        .filter(x => x.p || x.fix || x.mk)
        .map(x => FAMT[x.t])
        .filter(Boolean)
    ),
  ];
}

export function nextOf(m) {
  return !m.nx ? [] : m.nx === 'eevee' ? Object.values(EEVEE) : Array.isArray(m.nx) ? m.nx : [m.nx];
}

export function evoDiff(a, b) {
  const A = BY[a],
    B2 = BY[b],
    payout = B2.mv.filter(x => !A.mv.includes(x)),
    lose = A.mv.filter(x => !B2.mv.includes(x));
  const tg = B2.t.filter(t => !A.t.includes(t)),
    tl = A.t.filter(t => !B2.t.includes(t));
  return {
    gain: payout,
    lose,
    tg,
    tl,
    ability: A.ability !== B2.ability ? B2.ability : null,
    role: A.r !== B2.r ? B2.r : null,
    hp: (B2.s[0] - A.s[0]) * 8,
  };
}

function rxOf(ms) {
  const marks = new Map(),
    els = new Map(),
    add = (m, k, v) => {
      if (!m.has(k)) {
        m.set(k, []);
      }
      m.get(k).push(v);
    };
  ms.forEach(m => {
    monMarks(m).forEach(k => add(marks, k, m.n));
    monEls(m).forEach(e => add(els, e, m.n));
  });
  if (ms.some(m => m.ability === 'adaptabilite')) {
    [...marks.keys()].forEach(k => add(els, MKT[k], 'Évoli'));
  }
  const rx = new Map();
  marks.forEach((by, k) =>
    EL.forEach((e, i) => {
      const id = MX[k][i];
      if (!id || id === 'ren' || !els.has(e) || rx.has(id)) {
        return;
      }
      const tr = els.get(e).find(n => !by.includes(n)) || els.get(e)[0];
      rx.set(id, { by: by.find(n => n !== tr) || by[0], tr });
    })
  );
  return rx;
}

export function analyze() {
  const ms = squad.map(id => BY[id]),
    all = ms.flatMap(m => familyOf(m.id));
  const rx = rxOf(ms),
    rxp = rxOf(all);
  const roles = ROLES.map(r =>
    Math.min(
      2,
      ms.reduce((a, m) => a + (m.r === r.n ? 1 : m.r2 === r.n ? 0.5 : 0), 0)
    )
  );
  const chains = CHAINS.filter(c => c.need.every(n => rxp.has(n)) && (!c.mon || all.some(m => m.id === c.mon)));
  const c = cost(),
    free = BUDGET - c,
    bonus = vBonus(),
    covered = roles.filter(v => v > 0).length;
  const flips = all.filter(m =>
    m.mv.some(id => ['turn', 'confuse', 'taunt', 'swap', 'sleep', 'root', 'web'].includes(MV[id].fx))
  ).length;
  const evo = ms.filter(m => m.nx).length,
    stages = ms.reduce((a, m) => a + Math.max(...familyOf(m.id).map(x => x.st)) - 1, 0);
  const score = ms.length
    ? Math.min(
        100,
        rx.size * 5 +
          (rxp.size - rx.size) * 3 +
          chains.length * 6 +
          covered * 5 +
          bonus * 4 +
          Math.min(flips, 4) * 3 +
          stages * 3
      )
    : 0;
  const al = [],
    has = n => ms.some(m => m.r === n || m.r2 === n);
  if (!ms.length) {
    al.push(['bad', 'Équipe vide : recrutez jusqu’à 4 Pokémon.']);
  } else {
    if (!has('Rempart')) {
      al.push(['bad', 'Aucun Rempart au départ : rien ne tient la ligne de front avant les premiers Éveils.']);
    }
    if (!rx.size) {
      al.push(['bad', 'Aucune réaction au premier stade : l’énergie d’Éveil montera lentement.']);
    }
    if (!evo) {
      al.push(['warn', 'Aucun Pokémon ne peut s’éveiller : pas de renversement possible en combat.']);
    } else {
      al.push([
        'ok',
        `${evo} Pokémon capable${evo > 1 ? 's' : ''} de s’éveiller, ${stages} Éveil${stages > 1 ? 's' : ''} possible${stages > 1 ? 's' : ''} au total.`,
      ]);
    }
    const lost = ms.filter(m =>
      nextOf(m).some(n =>
        evoDiff(m.id, n).lose.some(id => ['web', 'root', 'sleep', 'confuse', 'turn', 'taunt'].includes(MV[id].fx))
      )
    );
    if (lost.length) {
      al.push([
        'warn',
        `${lost.map(m => m.n).join(', ')} perd${lost.length > 1 ? 'ent' : ''} un contrôle en évoluant : éveillez au bon moment.`,
      ]);
    }
    if (rxp.size > rx.size) {
      al.push(['ok', `Les Éveils ouvrent ${rxp.size - rx.size} réaction${rxp.size - rx.size > 1 ? 's' : ''} de plus.`]);
    }
    if (bonus > 0) {
      al.push([
        'ok',
        `${free} point${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''} : +${bonus} Voix par manche${bonus >= 2 ? ' (plafond)' : ''}. Chaque tranche de 4 PC libres donne 1 Voix.`,
      ]);
    }
    const vet = ms.filter(m => m.st > 1);
    if (vet.length) {
      al.push([
        'ok',
        `${vet.map(m => m.n).join(', ')} : recrue${vet.length > 1 ? 's' : ''} confirmée${vet.length > 1 ? 's' : ''}, en jeu dès la première manche.`,
      ]);
    }
    if (ms.some(m => !m.nx)) {
      al.push([
        'ok',
        `${ms
          .filter(m => !m.nx)
          .map(m => m.n)
          .join(', ')} : stade unique, puissant d’emblée.`,
      ]);
    }
  }
  return { ms, rx, rxp, roles, chains, c, free, bonus, covered, score, al, stages };
}

// Families visible with the current filters (read by the React grid).
export function visible() {
  const qq = norm(q);
  return RECRUIT.filter(m => {
    const f = familyOf(m.id);
    return (
      (filt === 'Tous' || f.some(x => x.r === filt || x.r2 === filt)) &&
      (gen === 'all' || String(m.gen) === gen) &&
      (!ftype || f.some(x => x.t.includes(ftype))) &&
      (!qq || f.some(x => norm(x.n).includes(qq) || x.mv.some(id => norm(MV[id].n).includes(qq))))
    );
  });
}

// Grid, counter and recruit inset: rendered by React (src/screens/team/Grid.jsx, DexCall.jsx).
export function renderGrid() {
  refreshGrid();
}

// Role and generation filters: rendered by React (src/screens/team/Team.jsx).
export function renderFilters() {
  refreshFilters();
  const r = $('#dexRole');
  if (r) {
    r.value = filt;
  }
}

// Dock, team banners and analysis: rendered by React (src/screens/team/Dock.jsx, Analysis.jsx).
function renderTeam() {
  refreshTeam();
}

export function renderSquad() {
  renderGrid();
  renderTeam();
  if (openId) {
    openSheet(openId, true);
  }
  if (cur === 'combat' && !B) {
    renderPrep();
  }
  if (cur === 'accueil') {
    renderHome();
  }
}

export function toggle(id, card) {
  const m = BY[id];
  if (!m) {
    return;
  }
  const same = squad.find(x => BY[x].base === m.base);
  if (same && (same === id || card)) {
    squad.splice(squad.indexOf(same), 1);
    toast(`${BY[same].n} quitte l’équipe.`);
    save();
    renderSquad();
    return;
  }
  if (!inBox(id)) {
    toast(
      `${BY[m.base].n} n’est pas dans votre Box : ${captureSite(id) ? `capturez-en un sur la ${captureSite(id)} (${FAMILY_REGION_NAMES[familyRegion(id)]})` : 'capturez-en un dans les hautes herbes'}.`
    );
    return;
  }
  const dr = challengeRefusal(id) || expRefusal(id); // campaign challenges (v4.9), expeditions (v4.10)
  if (dr) {
    toast(dr);
    return;
  }
  const rest = same ? cost() - RC(same) : cost();
  if (!same && squad.length >= TEAM_MAX) {
    toast(`Équipe complète : ${TEAM_MAX} Pokémon par combat. Retirez-en un d’abord.`);
    return;
  }
  if (rest + RC(id) > BUDGET) {
    toast(`Budget dépassé : il reste ${BUDGET - rest} PC, ${m.n} en coûte ${RC(id)}.`);
    return;
  }
  if (same) {
    squad[squad.indexOf(same)] = id;
    toast(`${m.n} remplace ${BY[same].n}.`);
  } else {
    squad.push(id);
    toast(`${m.n} rejoint l’équipe${m.st > 1 ? ' en recrue confirmée' : ''}.`);
  }
  save();
  renderSquad();
}

export function crestSmall(m) {
  const a = typeColor(m.t[0]),
    Lc = 2 * Math.PI * 84,
    gid = 'g' + m.id + (crestSmall.n = (crestSmall.n || 0) + 1);
  let ticks = '';
  for (let i = 0; i < 48; i++) {
    const r = (i * 7.5 * Math.PI) / 180,
      mj = i % 4 === 0,
      r1 = mj ? 89 : 92;
    ticks += `<line x1="${(100 + r1 * Math.cos(r)).toFixed(1)}" y1="${(100 + r1 * Math.sin(r)).toFixed(1)}" x2="${(100 + 97 * Math.cos(r)).toFixed(1)}" y2="${(100 + 97 * Math.sin(r)).toFixed(1)}" class="cr-tick${mj ? ' mj' : ''}"/>`;
  }
  const svg = `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="${gid}" cx="38%" cy="30%" r="75%"><stop offset="0" style="stop-color:color-mix(in srgb,${a} 45%,#fff)"/><stop offset=".3" stop-color="${a}"/><stop offset="1" style="stop-color:color-mix(in srgb,${a} 50%,#000)"/></radialGradient><linearGradient id="${gid}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E1AC"/><stop offset=".4" stop-color="#B68D48"/><stop offset=".65" stop-color="#F0D59C"/><stop offset="1" stop-color="#6B4F22"/></linearGradient></defs>
  <g class="cr-spin" style="transform-origin:100px 100px">${ticks}</g><circle class="cr-costbg" cx="100" cy="100" r="84"/><circle class="cr-cost" cx="100" cy="100" r="84" transform="rotate(-90 100 100)" stroke-dasharray="${((Lc * m.c) / 4 - 5).toFixed(1)} ${Lc.toFixed(1)}"/>
  <circle cx="100" cy="100" r="69" fill="url(#${gid}r)"/><circle cx="100" cy="100" r="65" fill="#0B0D12"/><circle cx="100" cy="100" r="62" fill="url(#${gid})"/><circle cx="100" cy="100" r="62" fill="none" stroke="rgba(255,255,255,.28)"/><path d="${typeGlyphPath(m.t[0])}" transform="translate(70 70) scale(2.5)" fill="${INK}" fill-rule="evenodd"/><ellipse cx="86" cy="72" rx="30" ry="13" transform="rotate(-24 86 72)" fill="rgba(255,255,255,.22)"/></svg>`;
  return `<span class="crest-pk pk">${svg}${artTag(m, 'crest-a')}</span>`; // the illustration at the center of the crest
}

export function branchNote(a, b) {
  const A = BY[a];
  if (A.nx === 'eevee') {
    const k = Object.keys(EEVEE).find(x => EEVEE[x] === b);
    return 'au choix · harmonie : ' + (k === 'jour' ? 'le jour' : k === 'nuit' ? 'la nuit' : `case ${markOf(k).n}`); // v4.34
  }
  const br = (BRANCHES[a] || []).find(x => x.id === b); // v4.13: path condition
  if (br) {
    return /^PV/.test(br.why) ? br.why : br.why[0].toLowerCase() + br.why.slice(1);
  }
  if (Array.isArray(A.nx)) {
    return b === A.nx[1] ? 'appelle la pluie' : 'combattant';
  }
  return '';
}

// A Pokémon's sheet: content rendered by React (src/screens/team/Sheet.jsx).
export function openSheet(id, refresh) {
  const sh = $('#sh'),
    closed = $('#sheet').hidden;
  if (!refresh) {
    lastFocus = document.activeElement;
  }
  openId = id;
  showSheet(id);
  if (closed) {
    document.body.style.overflow = 'hidden';
    sh.scrollTop = 0;
    setTimeout(() => {
      const x = sh.querySelector('.team-sheet-close');
      if (x) {
        x.focus();
      }
    }, 50);
  } else if (!refresh) {
    sh.scrollTop = 0;
  }
}

function closeSheet() {
  hideSheet();
  document.body.style.overflow = '';
  openId = null;
  if (lastFocus && lastFocus.focus) {
    lastFocus.focus();
  }
}

/* v1.0: held items, fatigue, Bonds in the Pokédex */
function equip(id, it) {
  if (it && !ownedItems().includes(it)) {
    return;
  }
  for (const k in PROFILE.equipment) {
    if (PROFILE.equipment[k] === it) {
      delete PROFILE.equipment[k];
    }
  }
  if (it) {
    PROFILE.equipment[id] = it;
  } else {
    delete PROFILE.equipment[id];
  }
  save();
  renderSquad();
  toast(it ? `${BY[id].n} tient ${ITEMS2[it].n}.` : `${BY[id].n} ne tient plus d’objet.`);
}

/* ===================== POKÉDEX & TEAM v0.8: family cards ===================== */
export const STLN = ['PV', 'Puissance', 'Garde', 'Vitesse', 'Mouvement', 'Portée'];

export const TEAM_MAX = 4;

export const validSquad = s =>
  Array.isArray(s) &&
  s.length <= TEAM_MAX &&
  s.every(id => BY[id]) &&
  new Set(s.map(id => BY[id].base)).size === s.length &&
  s.reduce((a, id) => a + RC(id), 0) <= BUDGET;

export const cost = () => squad.reduce((a, id) => a + RC(id), 0);

export const vBonus = () => Math.min(2, Math.floor((BUDGET - cost()) / 4));

export const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Instructions run at startup, in the original order (see index.js).
export function init() {
  ((squad = []), (filt = 'Tous'), (gen = 'all'), (ftype = ''), (q = ''), (lastFocus = null), (openId = null));

  try {
    const s = JSON.parse(localStorage.getItem('res8-squad') || 'null');
    if (validSquad(s)) {
      squad = s;
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }

  if (!squad.length) {
    squad = [...PRESETS.orage.ids];
  }

  $('#sheet').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) {
      closeSheet();
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) {
      openSheet(o.dataset.open, true);
      return;
    }
    const r = e.target.closest('[data-rx]');
    if (r) {
      closeSheet();
      openRx(r.dataset.rx);
      return;
    }
    const qq = e.target.closest('[data-qa]');
    if (qq) {
      toggle(qq.dataset.qa);
      return;
    }
    const eq = e.target.closest('[data-eq]');
    if (eq) {
      equip(eq.dataset.eq, eq.dataset.it || '');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#sheet').hidden) {
      closeSheet();
    }
  });

  $('#dexGrid').addEventListener('click', e => {
    const sg = e.target.closest('[data-stg]');
    if (sg) {
      toggle(sg.dataset.stg);
      return;
    }
    const qa = e.target.closest('[data-qa]');
    if (qa) {
      toggle(qa.dataset.qa, true);
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) {
      openSheet(o.dataset.open);
    }
  });

  /* holographic shine that follows the pointer (--hx / --hy, read by Grid's foil and glare) */
  if (!RM && window.matchMedia && matchMedia('(hover:hover)').matches) {
    $('#dexGrid').addEventListener('pointermove', e => {
      const c = e.target.closest('.team-card');
      if (!c) {
        return;
      }
      const r = c.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width,
        y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
    });
    $('#dexGrid').addEventListener('pointerout', e => {
      const c = e.target.closest('.team-card');
      if (!c || c.contains(e.relatedTarget)) {
        return;
      }
      ['--hx', '--hy'].forEach(p => c.style.removeProperty(p));
    });
  }

  $('#genSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-gen]');
    if (!b) {
      return;
    }
    gen = b.dataset.gen;
    renderFilters();
    renderGrid();
  });

  // #dexType options: rendered by React (Team.jsx)
  $('#dexType').addEventListener('change', e => {
    ftype = e.target.value;
    renderGrid();
  });

  $('#dexQ').addEventListener('input', e => {
    q = e.target.value;
    renderGrid();
  });

  $('#ana').addEventListener('click', e => {
    const p = e.target.closest('[data-p]');
    if (p) {
      const pr = p.dataset.p === 'clear' ? [] : [...PRESETS[p.dataset.p].ids],
        miss = pr.filter(id => !inBox(id));
      squad = pr.filter(id => inBox(id));
      save();
      renderSquad();
      toast(
        p.dataset.p === 'clear'
          ? 'Équipe vidée.'
          : miss.length
            ? `Équipe « ${PRESETS[p.dataset.p].n} » chargée sans ${miss.map(id => BY[id].n).join(', ')} : à capturer d’abord.`
            : `Équipe « ${PRESETS[p.dataset.p].n} » chargée.`
      );
      return;
    }
    const r = e.target.closest('[data-rx]');
    if (r) {
      openRx(r.dataset.rx);
    }
  });
}
