import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/game.css';
import './styles/living-map.css';
import './styles/living-board.css';
import './styles/skin.css';
import './styles/pokemon-combat.css';
import './styles/pokemon-world.css';
import './styles/painted-graphics.css';
import './styles/fluidity.css';
import './styles/combat-compact.css';
import './styles/phone.css';
import App from './App.jsx';

// Pas de <StrictMode> : le moteur manipule le DOM directement et ne doit démarrer qu'une fois.
createRoot(document.getElementById('root')).render(<App />);
