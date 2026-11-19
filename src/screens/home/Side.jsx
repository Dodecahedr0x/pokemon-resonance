import { Html } from '../../lib/html.jsx';
import { BY, SCEN } from '../../engine/009-pokemon.js';
import { BUDGET } from '../../engine/010-in-battle-evolution.js';
import { PROFILE, isCamp } from '../../engine/011-game-state.js';
import { RC } from '../../engine/012-recruits-roles-synergies.js';
import { tc } from '../../engine/014-utils.js';
import { cost, squad } from '../../engine/020-team-cards.js';
import { emblem, goalInfo } from '../../engine/031-home-journey.js';
import { ART } from '../../engine/032-v4-foundation.js';
import { routeName } from '../../engine/054-johto.js';
import { REGION_NAMES421, freeBox421, regionNo421 } from '../../engine/061-catch-anywhere.js';

// Home column (.v4-aside): team (#v4Team) and main quest (#v4Quest).
export default function Side({ on }) {
  return (
    <aside className="v4-aside">
      <section className="v4-team v4-panel" id="v4Team" aria-label="Mon équipe">
        {on && <Team />}
      </section>
      <a className="v4-quest v4-panel" id="v4Quest" data-t="quetes" href="#quetes">
        {on && <Quest />}
      </a>
    </aside>
  );
}

function Team() {
  return (
    <>
      <header className="v4-ph">
        <svg><use href="#i-team" /></svg>
        <b>Mon équipe</b>
        <span className="v4-cnt">{squad.length} / 4</span>
        <span className="v4-pcs">{cost()} / {BUDGET} PC</span>
      </header>
      {'\n '}
      <div className="v4-team-g">
        {[0, 1, 2, 3].map(i => {
          const id = squad[i];
          if (!id)
            {return (
              <a key={i} className="v4-mon empty" data-t="pokedex" href="#pokedex">
                <span className="v4-plus"><svg><use href="#i-plus" /></svg></span>
                <span className="v4-mon-n">Recruter</span>
              </a>
            );}
          const m = BY[id],
            fat = isCamp() ? PROFILE.fatigue[m.base] || 0 : 0;
          return (
            <a key={i} className="v4-mon" data-t="pokedex" href="#pokedex" data-lp429={m.id} style={{ '--c': tc(m.t[0]), '--c2': tc(m.t[1] || m.t[0]) }}>
              <img src={ART(m.no)} alt="" loading="lazy" />
              <span className="v4-mon-n">{m.n}</span>
              <span className="v4-mon-l">{m.st > 1 ? 'Stade ' + m.st : 'Stade 1'} · {RC(id)} PC</span>
              <span className="v4-vit" title={`Forme ${100 - fat} %`}><i style={{ width: `${100 - fat}%` }} /></span>
            </a>
          );
        })}
      </div>
    </>
  );
}

function Quest() {
  const g = goalInfo(),
    C = g.C || { c: 'Aventure', t: g.n };
  if (!isCamp())
    {return (
      <>
        <span className="v4q-ic"><svg><use href="#i-quest" /></svg></span>
        <span className="v4q-t">
          <small>Mode Libre · {freeBox421()}</small>
          <b>Combats ouverts</b>
          <em>Capturez vos Pokémon sur la {routeName()} ({REGION_NAMES421[regionNo421()]}).</em>
        </span>
      </>
    );}
  return (
    <>
      <span className="v4q-ic"><Html html={emblem(g.k, 'xs')} /></span>
      <span className="v4q-t">
        <small>Quête principale · {C.c}</small>
        <b>Direction : {g.k === 'tuto' ? 'le laboratoire' : g.k === 'champ' ? 'la Finale' : SCEN[g.k].n}</b>
        <em>{g.L ? `Battre ${g.L.n}, ${g.L.t}` : 'Le combat guidé de la Professeure'}</em>
      </span>
      <svg className="v4q-go"><use href="#i-chevr" /></svg>
    </>
  );
}
