import { Html } from '../../lib/html.jsx';
import { SCEN } from '../../engine/009-03-pokemon.js';
import { PROFILE, isCamp } from '../../engine/011-05-etat-de-partie.js';
import { ARENAS } from '../../engine/013-07-arenes.js';
import { ELITE, scenLock } from '../../engine/022-15-systemes-objets-liens-ia.js';
import { nextGoal } from '../../engine/026-20-campagne-tutoriel-son.js';
import { CHAP, leaderOf } from '../../engine/030-24-prestige-mise-en-scene.js';
import { emblem, wonOf } from '../../engine/031-25-v3-parcours-accueil.js';
import { STATE_N, rewardLine } from '../../engine/037-v4-05-carte.js';
import { MAINQ } from '../../engine/039-v4-07-quetes-boutique.js';

// Un chapitre de la quête principale (ancien mainRow).
function Chapitre({ k, gk }) {
  const C = CHAP(k) || { c: '', t: '' },
    L = leaderOf(k),
    lk = scenLock(k),
    won = k === 'tuto' ? !!PROFILE.tuto : wonOf(k),
    nx = k === gk,
    gi = ARENAS.findIndex(a => a.k === k),
    st = nx ? 'next' : won ? 'done' : lk ? 'lock' : 'open';
  return (
    <article className={`v4-qm s-${st}`}>
      <span className="v4-qm-ic"><Html html={emblem(k, 'sm')} /></span>
      <div className="v4-qm-t">
        <small>{C.c}{ELITE.includes(k) ? ' · ' + (ELITE.indexOf(k) + 1) + ' / 4' : ''}</small>
        <b>{k === 'tuto' || k === 'champ' ? C.t : SCEN[k].n}</b>
        <em>{L ? `Battre ${L.n}, ${L.t}` : 'Le combat guidé de la Professeure'}</em>
        {gi >= 0 && !won ? <Html html={rewardLine(k)} /> : null}
      </div>
      <div className="v4-qm-r">
        <em className={`v4-pill s-${st}`}>{STATE_N[st]}</em>
        {lk ? null : <button type="button" className={'b b-sm' + (nx ? ' b-gold' : '')} data-v4fight={k}>{won ? 'Rejouer' : 'Y aller'}</button>}
      </div>
    </article>
  );
}

// Onglet « Principale » : les chapitres de la Campagne, dans l'ordre.
export default function Principale() {
  const gk = nextGoal()[0];
  return (
    <>
      {isCamp() ? null : (
        <div className="v4-note">Mode Libre : tous les combats sont ouverts et les Pokémon se capturent dans leur région. Les chapitres se suivent dans l’ordre en Campagne. <a className="b b-sm" data-t="params" href="#params">Changer de mode : Paramètres</a></div>
      )}
      {MAINQ().map(k => <Chapitre key={k} k={k} gk={gk} />)}
    </>
  );
}
