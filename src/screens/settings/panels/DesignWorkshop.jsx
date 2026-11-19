import { css442 } from '../../../engine/075-css-design-workshop.js';

// Settings › Design workshop (v4.42): buttons #ad442a/r/b handled by the engine (module 075).
const BOX = { width: '100%', boxSizing: 'border-box', font: '12px/1.4 monospace', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.35)', color: 'inherit' };

export default function WorkshopDesign() {
  return (
    <section className="v4-panel" id="ad442">
      <h3 className="h3">Atelier design</h3>
      <p className="v4-note">Collez ici un bloc de CSS (écrit par exemple avec ChatGPT) : il s’applique tout de suite sur cet appareil. « Brief pour ChatGPT » donne à votre IA tout ce qu’il lui faut sans lui faire lire le fichier du jeu.</p>
      <textarea id="ad442t" rows="7" spellCheck="false" autoComplete="off" placeholder=":root{ --… } …" style={{ ...BOX, resize: 'vertical' }} defaultValue={css442()} />
      <div className="sv-io">
        <button type="button" className="b b-sm b-gold" id="ad442a">Appliquer</button>
        <button type="button" className="b b-sm" id="ad442r">Retirer mon CSS</button>
        <button type="button" className="b b-sm" id="ad442b">Brief pour ChatGPT</button>
      </div>
      <textarea id="ad442k" rows="8" readOnly hidden style={{ ...BOX, marginTop: '8px' }} defaultValue="" />
    </section>
  );
}
