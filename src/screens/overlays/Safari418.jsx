import { Html, parseStyle } from '../../lib/html.jsx';
import { Boite, Dialogue } from './Fenetre.jsx';
import { BY } from '../../engine/009-03-pokemon.js';
import { tb } from '../../engine/014-08-outils.js';
import { crestSmall } from '../../engine/020-13-equipe-cartes.js';
import { shinyStyle } from '../../engine/043-v4-4-01-aventure-plus.js';

// Parc Safari (#safari418). Le moteur (058) calcule l'état de la visite (chances de
// capture et de fuite, message) et garde les clics (data-safari418) et l'attribut hidden.
export default function Safari418() {
  return <Boite nom="safari" className="result exp-box" id="safari418" Carte={Carte} />;
}

// Jauge en pourcentage (capture, fuite).
function Jauge({ v, c }) {
  const p = Math.round(v * 100);
  return <span className="sf-j" style={{ background: `linear-gradient(90deg,${c} 0 ${p}%,rgba(255,255,255,.12) ${p}% 100%)` }} role="img" aria-label={`${p} %`} />;
}

function Carte({ pas, balls, pris, fini, x, hum, capt, fuite, msg }) {
  const m = x && BY[x.id];
  return (
    <Dialogue className="sv-card exp-card sf-card" titre="sfT" fermer={{ 'data-safari418': 'x' }}>
      <p className="kick">Parc Safari</p>
      <h2 className="h2" id="sfT">{x ? m.n : 'Les herbes du Parc'}</h2>
      <div className="sf-k">
        <span>{pas} pas</span>
        <span>{balls} Safari Balls</span>
        <span>{pris} capture{pris > 1 ? 's' : ''}</span>
      </div>
      {x ? (
        <>
          <div className={'sf-poke' + (x.sh ? ' shiny' : '')} style={x.sh ? parseStyle(shinyStyle(x.id)) : undefined}><Html html={crestSmall(m)} /></div>
          <div className="sh-tags">{m.t.map(t => <Html key={t} html={tb(t)} />)}</div>
          <p className="sf-h">{hum}</p>
          <div className="sf-m">
            <span>Capture</span>
            <Jauge v={capt} c="#7ac74c" />
            <span>Fuite</span>
            <Jauge v={fuite} c="#ee8130" />
          </div>
        </>
      ) : (
        <div className="sf-herbe" aria-hidden="true" />
      )}
      <p className="sf-msg" aria-live="polite"><Html html={msg} /></p>
      <div className="sf-a">
        {fini ? (
          <button type="button" className="b b-gold" data-safari418="sortir">Quitter le Parc</button>
        ) : x ? (
          <>
            <button type="button" className="b b-sm b-gold" data-safari418="ball" disabled={!balls}>Safari Ball</button>
            <button type="button" className="b b-sm" data-safari418="appat">Appât</button>
            <button type="button" className="b b-sm" data-safari418="caillou">Caillou</button>
            <button type="button" className="b b-sm b-ghost" data-safari418="fuir">Fuir</button>
          </>
        ) : (
          <>
            <button type="button" className="b b-gold" data-safari418="marcher">Avancer dans les herbes</button>
            <button type="button" className="b b-ghost" data-safari418="sortir">Quitter le Parc</button>
          </>
        )}
      </div>
    </Dialogue>
  );
}
