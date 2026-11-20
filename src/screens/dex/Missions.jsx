import { ownedFam } from '../../engine/progression/trainer-stats.js';
import { DEXS } from '../../engine/progression/pokedex.js';
import { MISSION_TIERS, missionState, weekKey, rewardText, typeProgress } from '../../engine/world/route-events.js';

// Pokédex missions (#dexMission, v4.54): species tiers and specialists of the week.
// Claiming (data-dex-mission) is still handled by the engine.
export default function Missions() {
  const S = missionState(),
    n = DEXS.filter(m => ownedFam(m.id)).length;
  const pals = MISSION_TIERS.filter(p => !S.pal[p[0]]).slice(0, 2);
  const w = weekKey();
  return (
    <section id="dex-mission" className="dex-mission v4-panel">
      <h3>Missions du Pokédex</h3>
      {pals.map(([k, r]) => {
        const ok = n >= k;
        return (
          <div className={`dex-mission-row${ok ? ' is-ready' : ''}`} key={'p' + k}>
            <div>
              <b>{`Capturer ${k} espèces`}</b>
              <i>
                <u style={{ width: Math.min(100, (n / k) * 100) + '%' }} />
              </i>
              <small>{`${Math.min(n, k)} / ${k} · ${rewardText(r)}`}</small>
            </div>
            <button type="button" className="v4-btn" data-dex-mission={`p:${k}`} disabled={!ok}>
              {ok ? 'Réclamer' : '—'}
            </button>
          </div>
        );
      })}
      {typeProgress().map(({ t, n: need, own }) => {
        const done = S.ty[w + t],
          ok = own >= need;
        return (
          <div className={`dex-mission-row${ok && !done ? ' is-ready' : ''}${done ? ' is-done' : ''}`} key={'t' + t}>
            <div>
              <b>
                {`Spécialiste ${t} `}
                <em>cette semaine</em>
              </b>
              <i>
                <u style={{ width: Math.min(100, (own / need) * 100) + '%' }} />
              </i>
              <small>{`${Math.min(own, need)} / ${need} Pokémon de type ${t} · +1 Éclat`}</small>
            </div>
            <button type="button" className="v4-btn" data-dex-mission={`t:${t}`} disabled={!(ok && !done)}>
              {done ? 'Fait' : ok ? 'Réclamer' : '—'}
            </button>
          </div>
        );
      })}
    </section>
  );
}
