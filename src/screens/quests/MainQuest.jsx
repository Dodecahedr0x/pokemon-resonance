import { Html } from '../../lib/html.jsx';
import { SCEN } from '../../engine/pokemon/pokemon.js';
import { PROFILE, isCamp } from '../../engine/state/game-state.js';
import { ARENAS } from '../../engine/modes/gyms.js';
import { ELITE, scenLock } from '../../engine/combat/items-bonds-ai.js';
import { nextGoal } from '../../engine/progression/campaign.js';
import { CHAP, leaderOf } from '../../engine/progression/prestige.js';
import { emblem, wonOf } from '../../engine/world/home-journey.js';
import { STATE_N, rewardLine } from '../../engine/world/map.js';
import { MAINQ } from '../../engine/progression/quests-shop.js';

import Button from '../../components/Button.jsx';
// A chapter of the main quest (formerly mainRow).
function Chapter({ k, gk }) {
  const C = CHAP(k) || { c: '', t: '' },
    L = leaderOf(k),
    lk = scenLock(k),
    won = k === 'tuto' ? !!PROFILE.tuto : wonOf(k),
    nx = k === gk,
    gi = ARENAS.findIndex(a => a.k === k),
    st = nx ? 'next' : won ? 'done' : lk ? 'lock' : 'open';
  return (
    <article className={`v4-qm s-${st}`}>
      <span className="v4-qm-ic">
        <Html html={emblem(k, 'sm')} />
      </span>
      <div className="v4-qm-t">
        <small>
          {C.c}
          {ELITE.includes(k) ? ' · ' + (ELITE.indexOf(k) + 1) + ' / 4' : ''}
        </small>
        <b>{k === 'tuto' || k === 'champ' ? C.t : SCEN[k].n}</b>
        <em>{L ? `Battre ${L.n}, ${L.t}` : 'Le combat guidé de la Professeure'}</em>
        {gi >= 0 && !won ? <Html html={rewardLine(k)} /> : null}
      </div>
      <div className="v4-qm-r">
        <em className={`v4-pill s-${st}`}>{STATE_N[st]}</em>
        {lk ? null : (
          <Button size="small" variant={nx ? 'primary' : undefined} data-v4fight={k}>
            {won ? 'Rejouer' : 'Y aller'}
          </Button>
        )}
      </div>
    </article>
  );
}

// « Principale » (Main) tab: the Campaign chapters, in order.
export default function MainQuest() {
  const gk = nextGoal()[0];
  return (
    <>
      {isCamp() ? null : (
        <div className="v4-note">
          Mode Libre : tous les combats sont ouverts et les Pokémon se capturent dans leur région. Les chapitres se
          suivent dans l’ordre en Campagne.{' '}
          <a className="button button-small" data-t="params" href="#params">
            Changer de mode : Paramètres
          </a>
        </div>
      )}
      {MAINQ().map(k => (
        <Chapter key={k} k={k} gk={gk} />
      ))}
    </>
  );
}
