import { customCss } from '../../../engine/tools/design-workshop.js';

import Button from '../../../components/Button.jsx';
// Settings › Design workshop (v4.42): buttons #designActionA/r/b handled by the engine (engine/tools/design-workshop.js).
export default function DesignWorkshop() {
  return (
    <section className="card" id="design-action">
      <h3 className="card-title">Atelier design</h3>
      <p className="note">
        Collez ici un bloc de CSS (écrit par exemple avec ChatGPT) : il s’applique tout de suite sur cet appareil. «
        Brief pour ChatGPT » donne à votre IA tout ce qu’il lui faut sans lui faire lire le fichier du jeu.
      </p>
      <textarea
        id="design-action-t"
        rows="7"
        spellCheck="false"
        autoComplete="off"
        placeholder=":root{ --… } …"
        className="code-field"
        defaultValue={customCss()}
      />
      <div className="button-row">
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
      <textarea id="design-action-k" rows="8" readOnly hidden className="code-field settings-output" defaultValue="" />
    </section>
  );
}
