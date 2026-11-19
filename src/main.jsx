import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/game.css';
import './styles/carte-vivante.css';
import './styles/plateau-vivant.css';
import './styles/habillage.css';
import './styles/combat-pokemon.css';
import './styles/monde-pokemon.css';
import './styles/graphismes-peints.css';
import './styles/fluidite.css';
import './styles/combat-compact.css';
import './styles/telephone.css';
import App from './App.jsx';

// Pas de <StrictMode> : le moteur manipule le DOM directement et ne doit démarrer qu'une fois.
createRoot(document.getElementById('root')).render(<App />);
