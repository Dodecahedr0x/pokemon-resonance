import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';
import { migrateStorage } from './lib/saveMigration.js';

// No <StrictMode>: the engine manipulates the DOM directly and must only start once.
// Saves written with the old French property names are migrated before the engine reads them.
migrateStorage();

createRoot(document.getElementById('root')).render(<App />);
