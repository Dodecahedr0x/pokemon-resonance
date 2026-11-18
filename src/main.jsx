import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/game.css';
import App from './App.jsx';

// Pas de <StrictMode> : le moteur manipule le DOM directement et ne doit démarrer qu'une fois.
createRoot(document.getElementById('root')).render(<App />);
