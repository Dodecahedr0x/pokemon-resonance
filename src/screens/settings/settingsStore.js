import { version } from '../../lib/store.js';

// Le moteur appelle renderParams() pour redessiner les Paramètres (affichage de la page,
// bouton d'un panneau, réinitialisation…) : la page React est alors reconstruite avec les
// réglages à jour.
export const [refreshSettings, useSettingsVersion] = version();
