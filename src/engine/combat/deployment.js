import { SCEN } from '../pokemon/pokemon.js';
import { $, toast } from '../core/utils.js';
import { bdClass, tokCl } from '../../screens/combat/board/boardStore.js';
import { HOOKS } from '../core/hooks.js';
import { BOARD_ROWS, cellKey, parseCellKey, byUid, unitAt } from './engine.js';
import { B, L, addLog, renderAll, ui } from './ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { sfx } from '../audio/sound-effects.js';
import { AUTO } from '../progression/prestige.js';
import { renderParams } from '../ui/settings.js';

/* =====================================================================
   Deployment (added in v4.30): before big battles, you place your
   Pokémon.
   ===================================================================== */
function isLargeBattle(D) {
  return (
    !D.tuto &&
    !!(
      D.gym != null ||
      D.elite ||
      D.champ ||
      D.rival ||
      D.rivalFight ||
      D.johto != null ||
      D.hoenn != null ||
      D.jfinal ||
      D.hfinal ||
      D.legend ||
      D.captureLegend ||
      D.jdis ||
      D.dissonance ||
      D.colossus ||
      D.hebdo429 ||
      D.ami ||
      D.lac ||
      D.tower
    )
  );
}

function deployZone(S) {
  const z = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c <= 1; c++) {
      const k = cellKey(c, r),
        t = S.tiles[k];
      if (!t || t.rock || t.lava > 0) {
        continue;
      }
      const u = unitAt(S, k);
      if (u && u.side !== 'a') {
        continue;
      }
      z.push(k);
    }
  }
  return z;
}

function deployTap(k) {
  if (!B || !B.deployPhase) {
    return;
  }
  const z = deployZone(B),
    u = unitAt(B, k),
    sel = ui.deploySel && byUid(B, ui.deploySel);
  if (u && u.side === 'a' && (!sel || sel === u)) {
    ui.deploySel = sel === u ? null : u.uid;
  } else if (sel && z.includes(k)) {
    if (u && u.side === 'a') {
      u.pos = [...sel.pos];
    } // swap places
    sel.pos = parseCellKey(k);
    ui.deploySel = null;
    sfx('ui');
  } else if (u && u.side === 'a') {
    ui.deploySel = u.uid;
  }
  renderAll();
}

function endDeployment() {
  if (!B || !B.deployPhase) {
    return;
  }
  B.deployPhase = 0;
  ui.deploySel = null;
  addLog('Déploiement terminé : à vous de jouer.', 'sys');
  sfx('ui');
  renderAll();
}

export function deployRender() {
  const on = !!(B && B.deployPhase && !B.over),
    z = on ? deployZone(B) : [];
  if (L.t) {
    for (const k in L.t) {
      L.t[k].classList.toggle('is-deploy-zone', on && z.includes(k));
    }
  }
  if (L.u) {
    for (const id in L.u) {
      const T = L.u[id];
      if (T) {
        tokCl(T, 'is-deploy-selected', on && ui.deploySel === id);
      } // token classes: Units.jsx
    }
  }
  bdClass('deploy-phase', on); // #bBoard class, rendered by React
  // « Lancer le combat » (Start battle) and the deployment phase: rendered by React (src/screens/combat/battle/Foot.jsx)
}

// Startup statements, run in their original order (see index.js).
export function init() {
  HOOKS.combat.push((S, opt, D0) => {
    D0 = D0 || SCEN[S.sc] || {};
    const pr = PREF.deployPhase || 'grands';
    if (pr === 'jamais' || D0.tuto || D0.enigme431 != null || D0.duel433 || S.coop || S.order === 'vitesse') {
      return;
    }
    if (pr === 'grands' && !isLargeBattle(D0)) {
      return;
    }
    if (AUTO && !window.__skipDeploy) {
      return;
    }
    S.deployPhase = 1;
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-deploy-phase]');
    if (!b) {
      return;
    }
    PREF.deployPhase = b.dataset.deployPhase;
    savePref();
    renderParams();
  });

  $('#bSvg').addEventListener(
    'click',
    e => {
      if (!B || !B.deployPhase || B.over) {
        return;
      }
      e.stopPropagation();
      const p = e.target.closest('[data-k]');
      if (p && !ui.busy) {
        deployTap(p.dataset.k);
      }
    },
    true
  );

  document.addEventListener(
    'click',
    e => {
      if (!B || !B.deployPhase || B.over) {
        return;
      }
      if (e.target.closest('#bEnd')) {
        e.preventDefault();
        e.stopPropagation();
        endDeployment();
      } else if (e.target.closest('#bPanel button,.battle-plate')) {
        e.preventDefault();
        e.stopPropagation();
        toast('Déploiement : placez vos Pokémon, puis « Lancer le combat ».');
      }
    },
    true
  );
}
