/* =====================================================================
   The Daycare, as a pair (added in v4.16): two deposited Pokémon yield
   an egg of their family, with an inherited move and a better chance
   of being shiny.
   ===================================================================== */
import { MV } from '../data/moves.js';
import { BY, MON } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, medal, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { __set_squad, renderSquad, save, squad } from '../team/team.js';
import { queueSave } from '../state/saves.js';
import { ITEM_ICONS, ITM } from '../assets/item-icons.js';
import { shinyStyle } from '../pokemon/shiny.js';
import { ACHIEVEMENTS } from './achievements.js';
import { isFallen } from './campaign-challenges.js';
import { onExpedition } from './expeditions.js';
import { renderCampBase } from './base-camp.js';
import { multChroma } from '../world/seasons.js';
import { campOpen } from './camp.js';
import { svgDataUri } from '../world/roaming-beasts.js';

let PENS_SEL;
export { daycarePair, daycareParents, inheritableMoves }; // read by the Camp's Daycare (src/screens/camp)

const daycarePair = () => (campOpen() ? (PROFILE.pair || []).filter(id => PROFILE.box.includes(id)) : []);

export const isInDaycare = id => !!(campOpen() && BY[id] && daycarePair().includes(BY[id].base));

function breedCompatibleList(a, b) {
  if (!BY[a] || !BY[b] || a === b) {
    return false;
  }
  if (a === 'metamorph' || b === 'metamorph') {
    return a !== b;
  }
  return BY[a].t.some(t => BY[b].t.includes(t));
}

/** The mother gives the family; with Ditto, it is the other parent. */
function daycareParents() {
  const c = daycarePair();
  if (c.length < 2 || !breedCompatibleList(c[0], c[1])) {
    return null;
  }
  const motherRef = c[0] === 'metamorph' ? c[1] : c[0],
    father = motherRef === c[0] ? c[1] : c[0];
  return { mother: motherRef, father, meta: c.includes('metamorph') };
}

function movesetRows(b) {
  return MON.filter(m => m.base === b);
}

function inheritableMoves(motherRef, father) {
  if (father === 'metamorph') {
    return [];
  }
  const already = new Set(movesetRows(motherRef).flatMap(m => m.mv));
  return [...new Set(movesetRows(father).flatMap(m => m.mv))].filter(
    k => MV[k] && MV[k].p > 0 && !MV[k].sig && !MV[k].xp && !already.has(k)
  );
}

/** An egg from the pair: returns true if it hatched. */
export function hatchDaycareEgg(rew) {
  const P2 = daycareParents();
  if (!P2) {
    return false;
  }
  const { mother: motherRef, father: father, meta } = P2,
    L = inheritableMoves(motherRef, father),
    mv = L.length ? L[Math.floor(Math.random() * L.length)] : null,
    ch = Math.min(0.75, (1 / 16) * multChroma() * (meta ? 2 : 1)),
    sh = Math.random() < ch;
  if (mv) {
    PROFILE.inherited[motherRef] = mv;
  }
  if (sh && !PROFILE.shiny.includes(motherRef)) {
    PROFILE.shiny.push(motherRef);
  }
  if (!PROFILE.dex.includes(motherRef)) {
    PROFILE.dex.push(motherRef);
  }
  PROFILE.camp.oeuf = 0;
  PROFILE.oeufs = (PROFILE.oeufs || 0) + 1;
  rew.daycareEgg = { id: motherRef, father, mv, sh };
  return true;
}

export function inheritedMoveHtml(b) {
  const k = b && PROFILE.inherited && PROFILE.inherited[b];
  if (!k || !MV[k]) {
    return '';
  }
  return `<div class="mvc ct-mvc her-mvc"><div class="t"><b>${MV[k].n}</b><span class="chip">Héritée</span></div><p>${MV[k].t} · ${MV[k].p ? 'Puissance ' + MV[k].p + ' · ' : ''}${MV[k].d || ''} Capacité transmise à la Pension.</p></div>`;
}

// the base Camp's Daycare is rendered by React: src/screens/camp/CampBase.jsx

/* Daycare pair selection: rendered by React (src/screens/overlays/DaycareBox.jsx) */
function renderDaycareBox() {
  const available = PROFILE.box.filter(
    id => BY[id] && !squad.some(s => BY[s].base === id) && !onExpedition(id) && !isFallen(id)
  );
  const ok = PENS_SEL.length === 2 && breedCompatibleList(PENS_SEL[0], PENS_SEL[1]);
  paintOverlay('pens', {
    ok,
    L: available.map(id => {
      const i = PENS_SEL.indexOf(id);
      return { id, i, cp: PENS_SEL.length === 1 && i < 0 ? breedCompatibleList(PENS_SEL[0], id) : null };
    }),
  });
}

function onDaycareClick(e) {
  const p = e.target.closest('[data-pens]');
  if (p) {
    const k = p.dataset.pens;
    if (k === 'ouvrir') {
      PENS_SEL = [];
      renderDaycareBox();
      $('#pensBox').hidden = false;
    } else if (k === 'x') {
      $('#pensBox').hidden = true;
    } else if (k === 'rendre') {
      PROFILE.pair = [];
      toast('Le couple revient au camp.');
      queueSave();
      renderCampBase();
    } else if (k === 'ok' && PENS_SEL.length === 2 && breedCompatibleList(PENS_SEL[0], PENS_SEL[1])) {
      PROFILE.pair = [...PENS_SEL];
      __set_squad(squad.filter(s => !PENS_SEL.includes(BY[s].base)));
      $('#pensBox').hidden = true;
      toast(`${BY[PENS_SEL[0]].n} et ${BY[PENS_SEL[1]].n} s’installent à la Pension.`);
      save();
      queueSave();
      renderCampBase();
      try {
        renderSquad();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }
    return;
  }
  const pp = e.target.closest('[data-pens-p]');
  if (pp) {
    const id = pp.dataset.pensP,
      i = PENS_SEL.indexOf(id);
    if (i >= 0) {
      PENS_SEL.splice(i, 1);
    } else if (PENS_SEL.length < 2) {
      PENS_SEL.push(id);
    } else {
      PENS_SEL = [PENS_SEL[0], id];
    }
    renderDaycareBox();
    return;
  }
  if (e.target.id === 'pensBox') {
    $('#pensBox').hidden = true;
  }
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  Object.assign(ITEM_ICONS, {
    oeuf: svgDataUri(
      '<path d="M24 5c9 0 15 14 15 23a15 15 0 0 1-30 0C9 19 15 5 24 5Z" fill="#fff6e0" stroke="#8b6b3d" stroke-width="2"/><circle cx="18" cy="22" r="4" fill="#7ac74c"/><circle cx="30" cy="31" r="5" fill="#7ac74c"/><circle cx="27" cy="14" r="2.5" fill="#7ac74c"/>'
    ),
  });

  // #pensBox: rendered by React (src/screens/overlays/DaycareBox.jsx)

  PENS_SEL = [];

  /* ---------- hooks: battle creation ---------- */
  HOOKS.combat.push(S => {
    if (S.restricted) {
      return;
    } // fixed-rule battles (v4.31)
    // inherited move (Daycare)
    S.units.forEach(u => {
      if (u.side !== 'a') {
        return;
      }
      const k = (PROFILE.inherited || {})[u.sp];
      if (k && MV[k]) {
        u.hm = k;
        if (!u.mv.includes(k)) {
          u.mv.push(k);
        }
      }
    });
  });

  /* ---------- hooks: after the battle ---------- */
  HOOKS.battleResult.push(r => {
    if (!r.daycareEgg) {
      return '';
    }
    const x = r.daycareEgg;
    return `<div class="res-l"><h4>Pension</h4><div class="rl${x.sh ? ' shn' : ''}"${x.sh ? ` style="${shinyStyle(x.id)}"` : ''}>${medal(BY[x.id].t)}<span>Un œuf a éclos : un ${BY[x.id].n}${x.sh ? ' <b>chromatique</b>' : ''} !${x.mv ? ` Il hérite de <b>${MV[x.mv].n}</b> grâce à ${BY[x.father].n}.` : ''}</span><b><img class="res-egg" src="${ITM('oeuf')}" alt=""></b></div></div>`;
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'eleveur',
    n: 'Éleveur',
    d: 'Faire éclore un œuf de couple à la Pension.',
    t: 'Éleveur',
    ok: () => (PROFILE.oeufs || 0) >= 1,
  });

  document.addEventListener('click', onDaycareClick);
}
