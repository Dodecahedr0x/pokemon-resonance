import { $ } from '../core/utils.js';
import { goTo } from '../core/navigation.js';
import { __set_filt, renderFilters, renderGrid } from '../team/team.js';
import { battle, renderPanel, selectedScenario } from '../combat/ui.js';
import { PREFERENCES, savePref } from './preferences.js';
import { __set_PREPG, renderPrep } from '../combat/battle-prep.js';
import { openRule, setGuideTab } from '../../screens/guide/guideStore.js';

// Current tab, tab choice and targeted rule: React state (src/screens/guide/guideStore.js).
export function setGuide(k) {
  setGuideTab(k);
}

export function openGuide(k) {
  goTo('types');
  setGuideTab(k);
}

export function openGuideRule(c) {
  openGuide('bases');
  openRule(c);
}

// Analysis summary (#anaSum) and recruits panel (#dexCall): rendered by React
// (src/screens/team/Analysis.jsx, DexCall.jsx).

// Role details: the class stays on the container (the tutorial also adds its own);
// the role line and the « Détails » (Details) button are rendered by React (src/screens/combat/battle/Panel.jsx).
export function panelRoleInfo() {
  const p = $('#bPanel');
  if (!p || !battle) {
    return;
  }
  p.classList.toggle('is-info-off', !PREFERENCES.info);
}

// Startup statements, run in their original order (see index.js).
export function init() {
  /* ===================== v1.2: streamlined — a single Guide, screens devoted to the game ===================== */

  /* --- Tabbed Guide: the remembered tab is read by guideStore.js --- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-gt]');
    if (t) {
      setGuide(t.dataset.gt);
      return;
    }
    const g = e.target.closest('[data-guide]');
    if (g) {
      e.preventDefault();
      openGuide(g.dataset.guide);
    }
  });

  /* --- Preparation: Terrains, Gyms, League tabs --- */
  $('#scenList').addEventListener('click', e => {
    const t = e.target.closest('[data-pg]');
    if (!t) {
      return;
    }
    __set_PREPG({ g: t.dataset.pg, sc: selectedScenario });
    renderPrep();
  });

  /* --- Team: role filter as a list (options rendered by React, Team.jsx), collapsed analysis, compact panel --- */
  {
    const r = $('#dexRole');
    if (r) {
      r.addEventListener('change', e => {
        __set_filt(e.target.value);
        renderFilters();
        renderGrid();
      });
    }
  }

  if (PREFERENCES.info === undefined) {
    PREFERENCES.info = false;
  }

  $('#bPanel').addEventListener('click', e => {
    if (e.target.closest('[data-info]')) {
      PREFERENCES.info = !PREFERENCES.info;
      savePref();
      renderPanel();
    }
  });
}
