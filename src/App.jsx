import { useEffect, useState } from 'react';
import SvgSprite from './components/SvgSprite.jsx';
import LaunchScreen from './components/LaunchScreen.jsx';
import Shell from './components/Shell.jsx';
import { setEngineReady as signalEngineReady } from './engineReady.js';

// Le shell est rendu une seule fois : le moteur écrit ensuite dans ses conteneurs
// (#accueil, #combat, #sheet…). Rien ici ne doit provoquer un nouveau rendu de <Shell>.
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
