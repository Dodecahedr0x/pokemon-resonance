import { useEffect } from 'react';
import SvgSprite from './components/SvgSprite.jsx';
import LaunchScreen from './components/LaunchScreen.jsx';
import Shell from './components/Shell.jsx';
import { setEngineReady as signalEngineReady } from './engineReady.js';

// The engine is loaded after the first render; screens re-read its state and
// redraw through their stores (useEngineReady, …Store.js), not through App's state.
export default function App() {
  useEffect(() => {
    import('./engine/index.js').then(() => {
      signalEngineReady();
      document.documentElement.classList.add('engine-ready');
    });
  }, []);

  return (
    <>
      <SvgSprite />
      <LaunchScreen />
      <Shell />
    </>
  );
}
