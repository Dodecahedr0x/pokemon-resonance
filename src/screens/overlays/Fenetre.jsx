import { useOverlay } from './dialogsStore.js';

// Fenêtre peinte par paintOverlay(nom, état) : un nouveau bloc par état (key). Le moteur garde
// les clics et l'attribut hidden : React ne rend `hidden` qu'au montage et ne le modifie plus.
export function Boite({ nom, className, id, Carte }) {
  const s = useOverlay(nom);
  return (
    <div className={className} id={id} hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

// Carte de dialogue « .sv-card » et son bouton de fermeture ; `fermer` : l'attribut data-* que
// l'écouteur du moteur reconnaît (ex. { 'data-ct': 'x' }), absent quand on ne peut pas fermer.
export function Dialogue({ className, titre, fermer, children }) {
  return (
    <div className={className} role="dialog" aria-modal="true" aria-labelledby={titre}>
      {fermer && <button className="sh-x" type="button" {...fermer} aria-label="Fermer"><svg><use href="#i-x" /></svg></button>}
      {children}
    </div>
  );
}
