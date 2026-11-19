import { useEffect, useState } from 'react';
import SvgSprite from './components/SvgSprite.jsx';
import LaunchScreen from './components/LaunchScreen.jsx';
import Shell from './components/Shell.jsx';
import { setEngineReady as signalEngineReady } from './engineReady.js';

// Le moteur est chargé après le premier rendu ; les écrans relisent son état et se
// redessinent par leurs stores (useEngineReady, …Store.js), pas par l'état d'App.
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
