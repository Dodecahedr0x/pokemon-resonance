import { BY } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { today } from '../state/economy.js';
import { CAMP_TABS } from '../modes/camp-challenges.js';

/* =====================================================================
   Pantheon (added in v4.32): the teams that beat a Master or the
   guardian.
   ===================================================================== */
export function pantheonEngrave(k, n, team, S) {
  const L = (PROFILE.pantheonlist = PROFILE.pantheonlist || []);
  L.unshift({
    d: today(),
    k,
    n,
    t: team.filter(id => BY[id]).slice(0, 4),
    r: (S && S.round) || 0,
    rk: (S && S.rank) || '',
    df: (S && S.diff) || PROFILE.diff || 'normal',
    md: isCamp() ? 'campagne' : 'libre',
  });
  if (L.length > 40) {
    L.length = 40;
  }
}

// the Camp › Pantheon tab is rendered by React: src/screens/camp/tabs/Pantheon.jsx

export const PANTHEON_STORE = {
  champ: 'Champion de Kanto',
  jchamp: 'Maître de Johto',
  hchamp: 'Maître de Hoenn',
  echo: 'Gardien de l’Écho profond',
};

// Startup statements, run in their original order (see index.js).
export function init() {
  HOOKS.progress.push((S, rew, win) => {
    if (!win || !PANTHEON_STORE[S.sc]) {
      return null;
    }
    pantheonEngrave(
      S.sc,
      PANTHEON_STORE[S.sc],
      S.units.filter(u => u.side === 'a').map(u => u.id),
      S
    );
    rew.pantheonlist = PANTHEON_STORE[S.sc];
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.pantheonlist
      ? `<div class="result-list"><h4>Panthéon</h4><div class="result-row"><span>Votre équipe est gravée au Panthéon : ${r.pantheonlist}.</span><b>★</b></div></div>`
      : ''
  );

  if (!CAMP_TABS.some(x => x[0] === 'pantheon')) {
    CAMP_TABS.push(['pantheon', 'Panthéon']);
  }
}
