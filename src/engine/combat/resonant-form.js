/* =====================================================================
   Resonant Form (added in v4.17): once per battle, a final-stage Pokémon
   whose gauge is full enters resonance for 3 rounds (+2 Power,
   +1 Movement, +20 % damage, statuses cleared at the end of the round).
   Masters (Champion, Johto Master) and your friends' teams can use it too.
   ===================================================================== */
import { BY, SCEN } from '../pokemon/pokemon.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { EMAX, byUid, endStep, hasNx, heal, say } from './engine.js';
import { B, cinematic, clearAim, enPips, finish, renderAll, ui } from './ui.js';
import { playEv } from './move-effects.js';
import { DAMAGE_PROVIDERS } from './tactical-engine.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';

const RESO_TURNS = 3;

/** Can an ally aim for the Resonant Form (final stage, not a legend, not yet used)? */
export function resonanceCandidate(S, u) {
  return !!(
    S &&
    u &&
    u.side === 'a' &&
    !u.ko &&
    !hasNx(u) &&
    !(BY[u.id] && (BY[u.id].leg || BY[u.id].isEnemy)) &&
    !u.seg &&
    !u.colossus &&
    !S.resonantUnit
  );
}

function canTriggerResonance(S, u) {
  return !!(resonanceCandidate(S, u) && S.phase === 'player' && !u.sn && u.en >= EMAX && S.voice >= 1);
}

function startResonantForm(S, u, ev, strongSpot) {
  u.resonant = RESO_TURNS;
  u.pb = (u.pb || 0) + (strongSpot ? 2 : 1);
  u.resonancePb = strongSpot ? 2 : 1;
  const h = Math.max(1, Math.round(u.mhp * (strongSpot ? 0.2 : 0.1)));
  heal(S, u, h, ev);
  u.badge = null;
  u.skip = 0;
  u.burn = 0;
  u.web = 0;
  u.root = 0;
  ev.push({ e: 'resonanceBurst', u: u.uid });
  say(ev, `${u.n} entre en Forme Résonante !`);
}

/** The player triggers the Resonant Form: 1 Voice and the whole gauge; the action stays free. */
function playerResonance(S, u) {
  if (!canTriggerResonance(S, u)) {
    return null;
  }
  const ev = [];
  S.voice -= 1;
  S.stats.voice += 1;
  S.resonantUnit = u.uid;
  S.stats.resonant = (S.stats.resonant || 0) + 1;
  u.en = 0;
  startResonantForm(S, u, ev, true);
  return endStep(S, ev);
}

/** Masters and your friends' teams use it too, once, when their best Pokémon starts to fade. */
function opponentResonance(S, ev) {
  const D = SCEN[S.sc] || {};
  if (S.resonantUnitE || !(D.champ || D.jfinal || D.hfinal || D.ami)) {
    return;
  }
  const e = S.units
    .filter(x => x.side === 'e' && !x.ko && !x.seg && !hasNx(x) && x.hp <= x.mhp * 0.5)
    .sort((a, b) => b.mhp - a.mhp)[0];
  if (!e) {
    return;
  }
  S.resonantUnitE = e.uid;
  startResonantForm(S, e, ev, false);
}

/** The battle panel block. */
export function resonanceBlockHtml(u, gauge) {
  if (!B || u.side !== 'a' || hasNx(u)) {
    return '';
  }
  if (u.resonant > 0) {
    return `<div class="battle-energy is-resonant is-full"><div class="battle-energy-head"><span class="caption">Forme Résonante</span><b class="battle-energy-turns">${u.resonant} manche${u.resonant > 1 ? 's' : ''}</b></div><p class="battle-hint">+2 Puissance, +1 Mouvement, +20 % de dégâts, entraves dissipées en fin de manche.</p></div>`;
  }
  if (!resonanceCandidate(B, u)) {
    return '';
  }
  const ok = canTriggerResonance(B, u),
    why =
      u.en < EMAX
        ? `Encore ${EMAX - u.en} losange${EMAX - u.en > 1 ? 's' : ''}`
        : u.sn
          ? 'Immobilisé cette manche'
          : B.voice < 1
            ? 'Plus de Voix'
            : 'Prêt · une fois par combat';
  return `${gauge ? `<div class="battle-energy${u.en >= EMAX ? ' is-full' : ''}"><div class="battle-energy-head"><span class="caption">Résonance</span>${enPips(u.en, 'lg')}</div></div>` : ''}<button type="button" class="battle-awaken is-resonant" data-resonance-burst ${ok ? '' : 'disabled'}><span class="battle-awaken-medals"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.4L21 9l-5 4.4 1.6 6.6L12 16.6 6.4 20 8 13.4 3 9l6.4-.6Z" fill="currentColor"/></svg></span><span><b>Forme Résonante</b><em>${why}</em></span><span class="battle-awaken-cost">1 Voix<br>+ jauge</span></button>`;
}

async function onResonantFormClick(e) {
  const b = e.target.closest('[data-resonance-burst]');
  if (!b || !B) {
    return;
  }
  const u = ui.sel && byUid(B, ui.sel);
  if (!u || !canTriggerResonance(B, u)) {
    return;
  }
  ui.undo = null;
  ui.busy = true;
  clearAim();
  renderAll();
  try {
    await cinematic(u.n, u.t, `${u.n} · Forme Résonante`, u.t, 'a', u.uid);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const ev = playerResonance(B, u);
  ui.busy = false;
  renderAll();
  if (!ev) {
    return;
  }
  playEv(ev);
  if (B.over) {
    return void finish();
  }
  toast(`${u.n} résonne pour ${RESO_TURNS} manches : son action reste libre.`);
  renderAll();
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  DAMAGE_PROVIDERS.push({
    id: 'formeresonante',
    provide: (c, { u }) => u.resonant > 0 && { mul: u.side === 'a' ? 1.2 : 1.1, labelText: 'Forme Résonante' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.ko || !(u.resonant > 0)) {
        return;
      }
      if (u.badge || u.burn || u.web || u.root) {
        u.badge = null;
        u.skip = 0;
        u.burn = 0;
        u.web = 0;
        u.root = 0;
        say(ev, `La résonance de ${u.n} dissipe ses entraves.`);
      }
      u.resonant--;
      if (u.resonant <= 0) {
        u.pb = Math.max(0, (u.pb || 0) - (u.resonancePb || 0));
        u.resonancePb = 0;
        say(ev, `La Forme Résonante de ${u.n} s’estompe.`);
      }
    });
    opponentResonance(S, ev);
  });

  document.addEventListener('click', onResonantFormClick);

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'resonant',
    n: 'Forme Résonante',
    d: 'Déclencher la Forme Résonante.',
    ok: c => (c.S.stats.resonant || 0) > 0,
  });
}
