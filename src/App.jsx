import { useEffect, useState } from 'react';
import SvgSprite from './components/SvgSprite.jsx';
import LaunchScreen from './components/LaunchScreen.jsx';
import Shell from './components/Shell.jsx';
import { setEngineReady as signalEngineReady } from './engineReady.js';

// The engine is loaded after the first render; screens re-read its state and
// redraw through their stores (useEngineReady, …Store.js), not through App's state.
export default function App() {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    let alive = true;
    import('./engine/index.js').then(() => {
      signalEngineReady();
      document.documentElement.classList.add('rl-pret');
      if (alive) setEngineReady(true);
    });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <SvgSprite />
      <LaunchScreen engineReady={engineReady} />
      <Shell />
    </>
  );
}
