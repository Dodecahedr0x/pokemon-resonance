import { Html, parseStyle } from '../../lib/html.jsx';
import { Boite, Dialogue } from './Fenetre.jsx';
import { BY } from '../../engine/009-03-pokemon.js';
import { tb } from '../../engine/014-08-outils.js';
import { crestSmall } from '../../engine/020-13-equipe-cartes.js';
import { SPARK, shinyStyle } from '../../engine/043-v4-4-01-aventure-plus.js';
import { CROWN416 } from '../../engine/055-v4-16-01-johto-vivant.js';

// Pêche (#peche418) : attente, touche, prise. Le moteur (058) garde les minuteries,
// les clics (data-peche418) et l'attribut hidden ; après une prise chromatique, il
// recolore l'illustration (.pe-prise img, chromaArt425) juste après le rendu.
export default function Peche418() {
  return <Boite nom="peche" className="result exp-box pe418" id="peche418" Carte={Carte} />;
}

function Corps({ etat, id, sh, dom, connu }) {
  if (etat === 'attente')
    return (
      <>
        <div className="pe-eau"><span className="pe-bouchon" /></div>
        <p className="d">La ligne est à l’eau… Attendez que ça morde, puis ferrez vite !</p>
        <button type="button" className="b b-lg" disabled>Ça ne mord pas encore…</button>
      </>
    );
  if (etat === 'mord')
    return (
      <>
        <div className="pe-eau mord"><span className="pe-bouchon" /></div>
        <p className="pe-alerte">Ça mord !</p>
        <button type="button" className="b b-gold b-lg" data-peche418="ferrer">Ferrer !</button>
      </>
    );
  if (etat === 'rate')
    return (
      <>
        <div className="pe-eau" />
        <p className="d">Trop tard : il s’est échappé.</p>
        <button type="button" className="b b-gold" data-peche418="lancer">Relancer la ligne</button>
      </>
    );
  if (etat !== 'prise') return null;
  const m = BY[id];
  return (
    <>
      <div className={'pe-prise' + (sh ? ' shiny' : '')} style={sh ? parseStyle(shinyStyle(id)) : undefined}><Html html={crestSmall(m)} /></div>
      <p className="enc-t">
        {dom ? (
          <><Html html={CROWN416} />Un gros {m.n} Dominant !</>
        ) : sh ? (
          <><Html html={SPARK} /> Un {m.n} chromatique mord à l’hameçon !</>
        ) : (
          `Un ${m.n} mord à l’hameçon !`
        )}
      </p>
      <div className="sh-tags">{m.t.map(t => <Html key={t} html={tb(t)} />)}</div>
      <div className="enc-a">
        <button type="button" className="b" data-peche418="relacher">Relâcher</button>
        <button type="button" className="b b-gold" data-peche418="combat">{connu ? 'Combattre' : 'Combattre pour le capturer'}</button>
      </div>
    </>
  );
}

function Carte({ route, peches, ...p }) {
  return (
    <Dialogue className="sv-card exp-card pe-card" titre="peT" fermer={{ 'data-peche418': 'x' }}>
      <p className="kick">{route} · pêche</p>
      <h2 className="h2" id="peT">Pêche</h2>
      <Corps {...p} />
      <p className="pe-n">{peches} prise{peches > 1 ? 's' : ''} au total</p>
    </Dialogue>
  );
}
