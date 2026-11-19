import { memo } from 'react';
import { useBoard, useHost } from './boardStore.js';
import Outils444 from './Outils444.jsx';
import { Cases, Decor, Eau, Lumiere, Peinture, Reperes, Socles, Terrain, Textures } from './Terrain.jsx';
import { PE, lref } from './partage.js';
import { CouchePk, Intentions, Loupe, Marques, Noms, Obstacles, Surbrillances } from './Calques.jsx';
import Defs from './Defs.jsx';
import EvoFx from './EvoFx.jsx';
import { Units } from './Units.jsx';

// Plateau de combat (#bBoard) : le SVG des cases et des Pokémon, la cinématique d'évolution.
// Les calques sont remontés à chaque construction (buildBoard), comme l'ancien svg.innerHTML = ''.
// Les jetons des Pokémon sont rendus par Units.jsx ; les calques vides (effets, nombres
// flottants) reçoivent les effets ponctuels du moteur, que React ne redessine jamais.

function Calques() {
  return (
    <>
      <Defs />
      <Peinture />
      <Socles />
      <Cases />
      <Textures />
      <Terrain />
      <Decor />
      <Eau />
      <Lumiere />
      <Reperes />
      <Marques />
      <Obstacles />
      <Surbrillances />
      <Intentions />
      <g style={PE} ref={lref('fx')} />
      <Units />
      <Obstacles front />
      <Noms />
      <g style={PE} ref={lref('fl')} />
      <Loupe />
      <CouchePk />
    </>
  );
}

// memo : un rendu du conteneur (classes, enfants) ne redessine pas le plateau
const Plateau = memo(function Plateau() {
  const S = useBoard('svg');
  return (
    <svg id="bSvg" viewBox={'0 0 ' + S.vb.join(' ')} role="img" aria-label="Plateau de combat" className={S.bio ? 'bio-' + S.bio : undefined}>
      {S.n > 0 && <Calques key={S.n} />}
    </svg>
  );
});
const Evo = memo(EvoFx);

// Conteneur #bBoard : classes, variables et data-ph suivent l'état « host » (boardStore.js).
// Les enfants hors du SVG sont dans l'ordre d'un début de combat normal (création au premier usage).
// La largeur (style.width, calibre434) reste posée par le moteur : React ne gère pas cette propriété.
function Board() {
  const H = useHost();
  return (
    <div className={H.cls.join(' ')} id="bBoard" data-ph={H.ph} style={{ '--ac': H.ac, '--bg477': H.bg477 }}>
      <Plateau />
      <Evo />
      <div className="b-ciel" aria-hidden="true" />
      {H.cs477 && (
        <div className="cs477" aria-hidden="true">
          <i />
          <i />
        </div>
      )}
      {H.amb477 && (
        <div key={H.amb477.k} className={'amb477 ' + H.amb477.h} data-k={H.amb477.k} aria-hidden="true" style={{ '--c': H.amb477.c }}>
          {H.amb477.items.map((s, i) => (
            <i key={i} style={s} />
          ))}
        </div>
      )}
      {H.ciel && <Ciel c={H.ciel} />}
      {H.bt444 && !H.bt444.foot && <Outils444 b={H.bt444} />}
      {H.wx448 && (
        <div id="wx448" aria-hidden="true" data-k={H.wx448} className={'wx448 wx448-' + H.wx448}>
          <i />
          <i />
        </div>
      )}
      {H.amb471 && (
        <div className="amb471" aria-hidden="true" data-k={H.amb471.k}>
          {H.amb471.items.map(([cls, s], i) => (
            <i key={i} className={cls} style={s} />
          ))}
        </div>
      )}
      {/* toile des effets d'attaque : dessinée et placée par le moteur (028, fxPrep) */}
      {H.fxc && <canvas className="fxc" aria-hidden="true" />}
      {H.cielBan && <CielBan b={H.cielBan} />}
      {H.tbn && (
        <div key={H.tbn.n} className={'tbn' + (H.tbn.en ? ' en' : '')} style={H.tbn.fast ? { animationDuration: '.8s' } : undefined}>
          <b>{H.tbn.txt}</b>
          <span>{H.tbn.sub}</span>
        </div>
      )}
      {H.fondu && <div key={H.fondu.n} className={'fondu477' + (H.fondu.va ? ' va' : '')} aria-hidden="true" style={{ backgroundImage: H.fondu.bg }} />}
    </div>
  );
}

// Ciel du combat (v4.30) : heure, météo, vent.
function Ciel({ c }) {
  return (
    <div id="ciel430" className="ciel430" aria-live="polite">
      <span className="ci430" style={{ '--c': c.co }} title={c.ti}>
        <svg>
          <use href={'#' + c.ic} />
        </svg>
      </span>
      {c.w && (
        <span className="ci430" style={{ '--c': c.w[1] }} title={c.w[2]}>
          <svg>
            <use href={'#' + c.w[0]} />
          </svg>
        </span>
      )}
      <b>{c.nom}</b>
      {c.vent && (
        <span className="ci430 v" style={{ '--c': '#cfe6ff' }} title="Vent">
          <svg>
            <use href="#i-vent" />
          </svg>
        </span>
      )}
    </div>
  );
}

// Annonce du ciel (v4.30) : l'heure ou la météo change.
function CielBan({ b }) {
  return (
    <div id="cielBan430" className={'cielban430' + (b.on ? ' on' : '')}>
      <span className="cb430-ic" style={{ '--c': b.ic[1] }}>
        <svg>
          <use href={'#' + b.ic[0]} />
        </svg>
      </span>
      <b>{b.titre}</b>
      {b.texte ? <em>{b.texte}</em> : null}
    </div>
  );
}

export default memo(Board);
