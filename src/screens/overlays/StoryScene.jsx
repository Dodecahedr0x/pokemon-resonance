import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

import Button from '../../components/Button.jsx';
// Story scene (#storyScene): one line at a time. Clicks (data-scene) and hidden:
// engine (057, 064, 093). The text is then typed letter by letter by the engine
// (v4.73, 109), which adds .pk-dlg, .pk-fl and <span>s in the card: each line
// is a new render (key), so these additions do not bother React.
export default function StoryScene() {
  const s = useOverlay('scene');
  return (
    <div className="story-scene" id="story-scene" hidden>
      {s && <Card key={s.v} {...s} />}
    </div>
  );
}

function Card({ av, n, txt, i, nb, suite: next }) {
  return (
    <div className="sc-card" role="dialog" aria-modal="true" aria-label="Scène">
      <div className="sc-who">
        <Html html={av} />
        <b>
          <Html html={n} />
        </b>
      </div>
      <p className="sc-tx">
        <Html html={txt} />
      </p>
      <div className="sc-a">
        <Button size="small" variant="ghost" data-scene="passer">
          Passer
        </Button>
        <span className="sc-n">
          {i + 1} / {nb}
        </span>
        <Button size="small" variant="primary" data-scene="suite">
          {next}
        </Button>
      </div>
    </div>
  );
}
