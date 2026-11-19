import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/004-data.js';
import { BY } from '../../engine/009-pokemon.js';
import { PROFILE, isCamp } from '../../engine/011-game-state.js';
import { BADGES } from '../../engine/013-gyms.js';
import { medal, tc } from '../../engine/014-utils.js';
import { badgeSvg } from '../../engine/019-league.js';
import { squad } from '../../engine/020-team-cards.js';

// Carte de dresseur (#campBox, ancien trainerCard). Masquée depuis la v4 (.hm-top.v4-off),
// mais toujours tenue à jour.
export default function CarteDresseur() {
  const c = isCamp(),
    nm = PROFILE.name || 'Dresseur';
  return (
    <>
      <div className="tc-h">
        <span className="tc-av">{nm.slice(0, 1).toUpperCase()}</span>
        <div className="tc-n">
          <p className="kick">{c ? 'Aventure' : 'Mode libre'}</p>
          <h2 className="h2">{nm}</h2>
        </div>
        {c ? null : <button type="button" className="b b-sm b-gold" data-camp="new">Commencer l’aventure</button>}
      </div>
      {'\n  '}
      <div className="tc-sec"><span className="lbl-s">Badges</span><b>{BADGES.length} / 8</b></div>
      {'\n  '}
      <div className="tc-bdg">
        {GYMS.map((g, i) => {
          const on = BADGES.includes(i);
          return (
            <span key={i} className={'tcb' + (on ? ' on' : '')} title={`${g.n}${on ? ' · obtenu' : ''}`}>
              {on ? <Html html={badgeSvg(i, g.t, 'tc' + i)} /> : <i style={{ '--c': tc(g.t) }} />}
            </span>
          );
        })}
      </div>
      {'\n  '}
      <div className="tc-sec">
        <span className="lbl-s">Ligue</span>
        <span className="tc-lg">
          {[1, 2, 3, 4].map(i => (
            <i key={i} className={PROFILE.elite >= i ? 'on' : ''}>{i}</i>
          ))}
          <i className={'ch' + (PROFILE.elite >= 5 ? ' on' : '')}>★</i>
        </span>
      </div>
      {'\n  '}
      <div className="tc-k">
        <div><b>{PROFILE.wins}</b><span>Victoires</span></div>
        <div><b>{PROFILE.caught}</b><span>Captures</span></div>
        <div><b>{PROFILE.box.length}</b><span>Pokémon</span></div>
      </div>
      {'\n  '}
      <a className="tc-team" href="#pokedex" data-go="pokedex">
        <span className="tc-m">
          {Array.from({ length: 4 }, (_, i) => (squad[i] ? <Html key={i} html={medal(BY[squad[i]].t, 'sm')} /> : <i key={i} />))}
        </span>
        <span>{squad.length ? squad.map(id => BY[id].n).join(' · ') : 'Équipe vide : touchez pour choisir'}</span>
      </a>
    </>
  );
}
