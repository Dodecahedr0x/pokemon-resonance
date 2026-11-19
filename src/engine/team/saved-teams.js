import { BY } from '../pokemon/pokemon.js';
import { PROFILE, inBox, ownedItems } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { __set_squad, renderSquad, save, squad, validSquad } from './team.js';
import { renderPrep } from '../combat/battle-prep.js';
import { __set_TEAM_BAK } from '../modes/gym-screen.js';
import { onExpedition } from '../progression/expeditions.js';

export let TEAM_NAME_EDIT;

/* =====================================================================
   Saved teams (added in v4.32): your teams (Pokémon and held items).
   ===================================================================== */

// "Mes équipes" (My teams) row of the Team screen: rendered by React (src/screens/team/DexCall.jsx)

function loadTeam(i) {
  const t = (PROFILE.savedTeams || [])[i];
  if (!t) {
    return;
  }
  const ok = t.ids.filter(id => inBox(id) && !onExpedition(id)),
    miss = t.ids.filter(id => !ok.includes(id));
  if (squad.length) {
    __set_TEAM_BAK([...squad]);
  }
  const s = [];
  ok.forEach(id => {
    if (validSquad([...s, id])) {
      s.push(id);
    }
  });
  __set_squad(s);
  Object.entries(t.it || {}).forEach(([b, it]) => {
    if (!ownedItems().includes(it) || !BY[b]) {
      return;
    }
    for (const k in PROFILE.equipment) {
      if (PROFILE.equipment[k] === it) {
        delete PROFILE.equipment[k];
      }
    }
    PROFILE.equipment[b] = it;
  });
  save();
  renderSquad();
  try {
    renderPrep();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  toast(miss.length ? `« ${t.n} » chargée sans ${miss.map(id => BY[id].n).join(', ')}.` : `Équipe « ${t.n} » chargée.`);
}

function onSavedTeamsClick(e) {
  const b = e.target.closest('[data-team-save]');
  if (!b) {
    return;
  }
  const a = b.dataset.teamSave,
    T = (PROFILE.savedTeams = PROFILE.savedTeams || []);
  if (a === 'nouv') {
    TEAM_NAME_EDIT = true;
    renderSquad();
    const i = document.getElementById('team-name');
    if (i) {
      i.focus();
    }
    return;
  }
  if (a === 'ok') {
    const v =
        ((document.getElementById('team-name') || {}).value || '')
          .replace(/[<>&"]/g, '')
          .trim()
          .slice(0, 20) || `Équipe ${T.length + 1}`,
      it = {};
    squad.forEach(id => {
      const bb = BY[id].base;
      if (PROFILE.equipment[bb]) {
        it[bb] = PROFILE.equipment[bb];
      }
    });
    if (squad.length && T.length < 8) {
      T.push({ n: v, ids: [...squad], it });
    }
    TEAM_NAME_EDIT = false;
    save();
    toast(`Équipe « ${v} » enregistrée.`);
  } else if (a === 'charger') {
    return loadTeam(+b.dataset.i);
  } else if (a === 'suppr') {
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Sûr ?';
      return;
    }
    T.splice(+b.dataset.i, 1);
    save();
  }
  renderSquad();
  try {
    renderPrep();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* in Battles: the saved teams (#savedSquadsBox) are rendered by React
   (src/screens/combat/prep/Team.jsx) */

// Startup statements, run in their original order (see index.js).
export function init() {
  TEAM_NAME_EDIT = false;

  document.addEventListener('click', onSavedTeamsClick);

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'team-name') {
      e.preventDefault();
      const b = document.querySelector('[data-team-save="ok"]');
      if (b) {
        b.click();
      }
    }
  });
}
