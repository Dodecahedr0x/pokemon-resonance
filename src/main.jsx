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
import { migrateStorage } from './lib/saveMigration.js';

// No <StrictMode>: the engine manipulates the DOM directly and must only start once.
// Saves written with the old French property names are migrated before the engine reads them.
migrateStorage();

createRoot(document.getElementById('root')).render(<App />);
