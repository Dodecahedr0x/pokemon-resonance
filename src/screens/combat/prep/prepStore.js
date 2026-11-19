import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderSelection() (via renderPrep) pour redessiner la sélection des
// combats, et renderResume() pour la carte « Combat en cours ». Chaque appel incrémente
// une version : React reconstruit le bloc, comme l'ancien innerHTML. Version 0 : le moteur
// n'a encore rien dessiné, le bloc garde le gabarit de départ.
// Rendu synchrone (flushSync) : le moteur peut relire le DOM juste après l'appel.
function store() {
  let version = 0;
  const listeners = new Set();
  const subscribe = l => (listeners.add(l), () => listeners.delete(l));
  const refresh = () => {
    version++;
    try {
      flushSync(() => listeners.forEach(l => l()));
    } catch {
      listeners.forEach(l => l());
    }
  };
  const use = () => useSyncExternalStore(subscribe, () => version);
  return [refresh, use];
}

export const [refreshPrep, usePrepVersion] = store();
export const [refreshResume, useResumeVersion] = store();
