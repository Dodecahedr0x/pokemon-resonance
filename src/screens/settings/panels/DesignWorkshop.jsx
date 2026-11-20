import { customCss } from '../../../engine/tools/design-workshop.js';
import { space } from '../../../lib/theme.js';

import Button from '../../../components/Button.jsx';
// Settings › Design workshop (v4.42): buttons #designActionA/r/b handled by the engine (engine/tools/design-workshop.js).
const BOX = {
  width: '100%',
  boxSizing: 'border-box',
  font: '12px/1.4 monospace',
  padding: space.sm,
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,.25)',
  background: 'rgba(0,0,0,.35)',
  color: 'inherit',
};

export default function DesignWorkshop() {
  return (
    <section className="v4-panel" id="design-action">
      <h3 className="h3">Atelier design</h3>
      <p className="v4-note">
        Collez ici un bloc de CSS (écrit par exemple avec ChatGPT) : il s’applique tout de suite sur cet appareil. «
        Brief pour ChatGPT » donne à votre IA tout ce qu’il lui faut sans lui faire lire le fichier du jeu.
      </p>
      <textarea
        id="design-action-t"
        rows="7"
        spellCheck="false"
        autoComplete="off"
        placeholder=":root{ --… } …"
        style={{ ...BOX, resize: 'vertical' }}
        defaultValue={customCss()}
      />
      <div className="sv-io">
        <Button size="small" variant="primary" id="design-action-a">
          Appliquer
        </Button>
        <Button size="small" id="design-action-r">
          Retirer mon CSS
        </Button>
        <Button size="small" id="design-action-b">
          Brief pour ChatGPT
        </Button>
      </div>
      <textarea id="design-action-k" rows="8" readOnly hidden className="settings-output" style={BOX} defaultValue="" />
    </section>
  );
}
