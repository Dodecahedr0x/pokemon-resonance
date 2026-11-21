/* Battle panel details: cell info, held items, fatigue, Bonds, combined techniques and capture. */

import { ELEMENT_TYPES, MARK_REACTIONS, REACTIONS } from '../data/game-data.js';
import { POKEMON } from '../pokemon/pokemon.js';
import { HELD_ITEMS, LINK_N } from '../state/game-state.js';
import { ROLE_EFFECTS, roleIcon } from '../pokemon/roles-synergies.js';
import { markOf, medal, reactionCategory } from '../core/utils.js';
import { parseCellKey, byUid, hexDistance, markAt } from './engine.js';
import { canCapture, canDuo, captureReq, duoOf, linkLvl } from './items-bonds-ai.js';
import { roleOf } from './synergies-obstacles.js';
import { battle, ui } from './ui.js';
import { SHOP } from '../state/economy.js';
import { CAP_K, __set_CAP_K, ballChips, ballFor } from '../items/ball-choice.js';
import { trapTip } from './tactics.js';

/* ---- cell info, items, fatigue, Bonds, capture, duos in the panel ---- */
export function tileTip(k) {
  const t = battle.tiles[k],
    o = [];
  if (t.pil) {
    return 'Pilier : infranchissable, bloque les tirs directs (cible unique et ligne). Couverture −40 % pour qui se tient derrière.';
  }
  if (t.rock) {
    o.push(
      'Rocher : infranchissable, couverture −40 % contre les tirs à distance, une capacité à cible unique peut y ricocher'
    );
  }
  if (t.w) {
    o.push('Eau : compte comme Trempé');
  }
  if (t.mark) {
    const m = markOf(t.mark.k);
    o.push(
      `${m.n}${t.mark.d < 90 ? ` : encore ${t.mark.d} manche${t.mark.d > 1 ? 's' : ''}` : ''}${t.mark.lv === 2 ? ' · renforcé ×1,25' : ''}`
    );
  }
  if (t.mud > 0) {
    o.push(`Boue : déplacement ×3, ${t.mud} manche${t.mud > 1 ? 's' : ''}`);
  }
  if (t.lava > 0) {
    o.push(`Lave : brûle ce qui s’y arrête, ${t.lava} manche${t.lava > 1 ? 's' : ''}`);
  }
  if (t.fog > 0) {
    o.push(t.fog > 2 ? 'Brume toxique : on ne vise pas à distance' : 'Brouillard : on ne vise pas à distance');
  }
  if (t.trap) {
    o.push(trapTip(t.trap));
  } // traps (v4.8)
  if (t.grass) {
    o.push('Hautes herbes : un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase');
  }
  if (t.sand && !t.w) {
    o.push('Sable : 2 Mouvements pour y entrer, sauf Sol, Roche, Acier et volants, qui y subissent −2 dégâts');
  }
  return o.length ? o.join(' · ') : 'Case libre';
}

export function tileCard() {
  if (!battle || ui.tile == null) {
    return '';
  }
  const k = ui.tile,
    t = battle.tiles[k];
  if (!t) {
    return '';
  }
  const [c, r] = parseCellKey(k),
    mk = t.mark ? markAt(battle, k) : t.w ? 'trempe' : null;
  let rx = '';
  if (mk) {
    const row = MARK_REACTIONS[mk];
    rx = ELEMENT_TYPES.map((e, i) =>
      row[i] && row[i] !== 'ren'
        ? `<span class="chip cat-${reactionCategory(row[i])}"><i></i>${e} → ${REACTIONS[row[i]].n}</span>`
        : ''
    ).join('');
  }
  return `<div class="battle-tile"><div class="battle-tile-head"><b>Case ${'ABCDEFGH'[c]}${r + 1}</b><button type="button" class="button button-small button-ghost" data-tile="x">Fermer</button></div><p>${tileTip(k)}</p>${rx ? `<div class="battle-tile-reactions">${rx}</div>` : ''}</div>`;
}

export function unitExtras(u) {
  const o = [];
  if (ui.undo && ui.undo.uid === u.uid && u.moved && !u.acted) {
    o.push(`<button type="button" class="button button-small" data-undo="1">Annuler le déplacement</button>`);
  }
  if (u.item) {
    o.push(
      `<span class="battle-unit-tag is-item" title="${HELD_ITEMS[u.item].d}"><svg viewBox="0 0 24 24"><path d="${HELD_ITEMS[u.item].i}"/></svg>${HELD_ITEMS[u.item].n}${u.item === 'ceinture' && !u.belt ? ' · utilisée' : ''}</span>`
    );
  }
  if (u.fat) {
    o.push(`<span class="battle-unit-tag is-tired">Fatigué · −1 Mouvement</span>`);
  }
  const mates = battle.units.filter(x => x !== u && !x.ko && x.side === 'a' && linkLvl(battle, u.sp, x.sp) > 0);
  mates.forEach(x => {
    const l = linkLvl(battle, u.sp, x.sp),
      adj = hexDistance(x.pos, u.pos) === 1;
    o.push(
      `<span class="battle-unit-tag is-link${adj && l >= 1 ? ' is-active' : ''}" title="Soutien : −1 dégât côte à côte. Synchro : +25 % sur les réactions préparées l’un pour l’autre. Duo : technique combinée.">Lien ${LINK_N[l]} · ${POKEMON[x.sp].n}${adj ? ' · côte à côte' : ''}</span>`
    );
  });
  const role = roleOf(u),
    RF = ROLE_EFFECTS[role],
    head = RF
      ? `<p class="battle-role-note">${roleIcon(role)}<span><b>${role} · ${RF.k}.</b> ${RF.d.replace(/^[^:]+ : /, '')}</span></p>`
      : '',
    hr =
      u.hr && u.acted && !u.moved
        ? `<p class="battle-hint is-retreat">Frappe et repli : touchez une case bleue pour vous replier.</p>`
        : '';
  return head + hr + (o.length ? `<div class="battle-unit-tags">${o.join('')}</div>` : '');
}

export function duoBlock(u) {
  if (!battle || u.acted) {
    return '';
  }
  const L2 = battle.units.filter(p => p !== u && p.side === 'a' && !p.ko && duoOf(battle, u, p));
  if (!L2.length) {
    return '';
  }
  return `<div class="battle-duos">${L2.map(p => {
    const D = duoOf(battle, u, p),
      ok = canDuo(battle, u, p),
      why = p.acted
        ? `${p.n} a déjà agi`
        : hexDistance(u.pos, p.pos) > 2
          ? `${p.n} est trop loin (2 cases max)`
          : battle.voice < 2
            ? 'il faut 2 Voix'
            : '';
    return `<button type="button" class="battle-duo${ui.mode === 'duo' && ui.duo === p.uid ? ' is-selected' : ''}" data-duo="${p.uid}" ${ok ? '' : 'disabled'}><span class="battle-duo-medals">${medal(u.t, 'is-small')}${medal(p.t, 'is-small')}</span><span><b>${D.n}</b><em>${ok ? D.d + ' 2 Voix, les deux agissent.' : why}</em></span></button>`;
  }).join('')}</div>`;
}

export function catchBlock(e) {
  if (battle.noCatch) {
    return '';
  }
  __set_CAP_K(ballFor(e)); // the Ball offered by default
  const al = ui.sel && byUid(battle, ui.sel),
    req = captureReq(battle, al, e),
    ok = al && canCapture(battle, al, e);
  return `<div class="battle-capture"><div class="battle-capture-head"><b>Capture</b><span>${al ? `avec ${al.n}` : 'sélectionnez un allié'}</span></div>${ballChips()}<ul>${req
    .slice(1)
    .map(r => `<li class="${r.ok ? 'is-met' : ''}">${r.t}</li>`)
    .join(
      ''
    )}</ul><button type="button" class="button button-small ${ok ? 'button-primary' : ''}" data-cap="${e.uid}" ${ok ? '' : 'disabled'}>${SHOP[CAP_K].n} sur ${e.n}</button>${battle.stats.caught.length ? '' : '<p class="battle-hint">Un Pokémon K.O. ne peut plus être capturé.</p>'}</div>`;
}
