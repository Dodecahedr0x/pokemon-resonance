import { Component } from 'react';
import { Html } from '../../lib/html.jsx';
import { useIntro } from './shellOverlays.js';
import { BY } from '../../engine/009-pokemon.js';
import { DIFFS, STARTERS } from '../../engine/011-game-state.js';
import { medal, tc } from '../../engine/014-utils.js';
import { reportError } from '../../engine/002-errors.js';
import { INTRO, PROF_AV } from '../../engine/031-home-journey.js';

// The Professor's welcome (#intro): showIntro() (031) opens it, renderIntro() redraws
// the step (INTRO.i), closeIntro() removes it. Clicks and Enter: engine listeners on #intro.
export default function Intro() {
  const { open, v } = useIntro();
  if (!open) return null;
  return (
    <Guard>
      <div id="intro" className="intro"><MapScreen key={v} /></div>
    </Guard>
  );
}

// Never an empty veil in front of the game: if the card cannot be drawn, nothing is
// shown and the problem is reported (former try/catch of showIntro).
class Guard extends Component {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch(e) {
    reportError(e, 'intro');
  }
  render() {
    return this.state.err ? null : this.props.children;
  }
}

const Fl = () => <svg><use href="#i-arrow" /></svg>;

function Body({ i }) {
  if (i === 0) return <p>Bonjour, et bienvenue dans la <b>Ligue de la Résonance</b> ! Je suis la Professeure <b>Maëlle Sorbier</b>.</p>;
  if (i === 1)
    return (
      <>
        <p>Ici, les Pokémon n’évoluent pas dans un menu : ils évoluent <b>en plein combat</b>, quand leur énergie de Résonance est pleine. Retenez trois choses :</p>
        <div className="it-cards">
          <div style={{ '--c': '#2A75BB' }}><b data-n="1">1</b><span>Choisissez <strong>4 Pokémon</strong></span></div>
          <div style={{ '--c': '#E5484D' }}><b data-n="2">2</b><span>Touchez un adversaire : sa <strong>zone rouge</strong> montre sa portée</span></div>
          <div style={{ '--c': '#F2B807' }}><b data-n="3">3</b><span><strong>Éveillez</strong> au bon moment : il évolue en plein combat</span></div>
        </div>
      </>
    );
  if (i === 2)
    return (
      <>
        <p>Et vous, comment vous appelez-vous ?</p>
        <label className="it-name"><input id="inName" type="text" maxLength={14} autoComplete="off" placeholder="Votre prénom" defaultValue={INTRO.name} /></label>
      </>
    );
  if (i === 3)
    return (
      <>
        <p>Enchantée, <b>{INTRO.name || 'Dresseur'}</b> ! Choisissez votre <b>partenaire</b>. Il vous suivra toute l’aventure ; les autres Pokémon se capturent dans les hautes herbes.</p>
        <div className="it-st">
          {STARTERS.map(id => {
            const m = BY[id];
            return (
              <button key={id} type="button" className={'it-o' + (INTRO.st === id ? ' on' : '')} data-in-st={id} style={{ '--c': tc(m.t[0]) }}>
                <Html html={medal(m.t, 'lg')} />
                <b>{m.n}</b>
                <em>{m.t.join(' / ')}</em>
              </button>
            );
          })}
        </div>
        <div className="it-diff">
          <span>Difficulté</span>
          {Object.entries(DIFFS).map(([k, n]) => (
            <button key={k} type="button" className="b b-sm" data-in-d={k} aria-pressed={INTRO.diff === k}>{n}</button>
          ))}
        </div>
      </>
    );
  const m = BY[INTRO.st] || { n: 'votre partenaire' };
  return (
    <>
      <p>Excellent choix ! <b>{m.n}</b> vous attend, avec Magicarpe, Métamorph et Chenipan.</p>
      <p>Votre premier combat est <b>guidé</b> : je vous montre chaque geste. Prêt ?</p>
    </>
  );
}

function Actions({ i }) {
  if (i === 0) return <button type="button" className="b b-gold b-lg" data-in="next">Enchanté !<Fl /></button>;
  if (i === 1) return <button type="button" className="b b-gold b-lg" data-in="next">Compris<Fl /></button>;
  if (i === 2) return <button type="button" className="b b-gold b-lg" data-in="name">Valider<Fl /></button>;
  if (i === 3) {
    const st = INTRO.st && BY[INTRO.st];
    return (
      <>
        <button type="button" className="b b-gold b-lg" data-in="start" disabled={!st}>{st ? 'Choisir ' + st.n : 'Choisissez un Pokémon'}<Fl /></button>
        <button type="button" className="it-libre" data-in="libre">Jouer plutôt en mode Libre : tous les combats ouverts{st ? ', avec ' + st.n : ''}</button>
      </>
    );
  }
  return (
    <>
      <button type="button" className="b" data-in="later">Plus tard</button>
      <button type="button" className="b b-gold b-lg" data-in="go">Lancer le combat guidé<Fl /></button>
    </>
  );
}

function MapScreen() {
  const i = INTRO.i;
  return (
    <div className="it-card" role="dialog" aria-modal="true" aria-label="Accueil de la Professeure">
      {i < 3 && <button type="button" className="it-skip" data-in="skip">Passer l’introduction</button>}
      <div className="it-prof">
        <Html html={PROF_AV} />
        <div className="it-dots">{[0, 1, 2, 3, 4].map(k => <i key={k} className={k <= i ? 'on' : ''} />)}</div>
      </div>
      <div className="dlgbox lg"><span className="dlg-who">Prof. Sorbier</span><Body i={i} /></div>
      <div className="it-a"><Actions i={i} /></div>
    </div>
  );
}
