import { canal } from '../../lib/store.js';

// Fenêtres temporaires que le moteur ajoutait à la fin de <body> (ancien overlay() : #vs,
// #hp452, #evs454, #ct453…). Liste dans l'ordre d'ouverture : {id, data, v}.
// Rouvrir un id le retire puis l'ajoute à la fin, avec un nouveau `v` (rendu avec key={id+v} :
// nœud neuf, comme l'ancien remove() + appendChild).
// Rendu synchrone (flushSync) : juste après, le moteur relit le DOM ($('#hp452'), focus,
// querySelector) et y pose ses écouteurs.
let liste = [];
let n = 0;
const { emit, use } = canal();

// Ouvre (ou rouvre) la fenêtre `id` ; renvoie son nœud.
export function ouvrir(id, data = {}) {
  liste = liste.filter(x => x.id !== id).concat({ id, data, v: ++n });
  emit();
  return document.getElementById(id);
}

// Modifie les données de la fenêtre ouverte `id` (sans recréer le nœud).
export function majTemp(id, patch) {
  if (!liste.some(x => x.id === id)) return;
  liste = liste.map(x => (x.id === id ? { ...x, data: { ...x.data, ...patch } } : x));
  emit();
}

// Ferme la fenêtre `id` (ancien `.remove()`). Avec un nœud : seulement s'il est encore
// affiché (une fenêtre rouverte depuis a un nouveau nœud).
export function fermer(cible) {
  const id = typeof cible === 'string' ? cible : cible && cible.isConnected ? cible.id : null;
  if (!id || !liste.some(x => x.id === id)) return;
  liste = liste.filter(x => x.id !== id);
  emit();
}

export const useTemporaires = () => use(() => liste);
