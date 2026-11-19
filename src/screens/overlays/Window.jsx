import { useOverlay } from './dialogsStore.js';

// Fenêtre peinte par paintOverlay(nom, état) : un nouveau bloc par état (key). Le moteur garde
// les clics et l'attribut hidden : React ne rend `hidden` qu'au montage et ne le modifie plus.
export function Box({ nom: displayName, className, id, Carte: MapScreen }) {
  const s = useOverlay(displayName);
  return (
    <div className={className} id={id} hidden>
      {s && <MapScreen key={s.v} {...s} />}
    </div>
  );
}

// Carte de dialogue « .sv-card » et son bouton de fermeture ; `fermer` : l'attribut data-* que
// l'écouteur du moteur reconnaît (ex. { 'data-ct': 'x' }), absent quand on ne peut pas fermer.
export function Dialogue({ className, titre: heading, fermer: shut, children }) {
  return (
    <div className={className} role="dialog" aria-modal="true" aria-labelledby={heading}>
      {shut && <button className="sh-x" type="button" {...shut} aria-label="Fermer"><svg><use href="#i-x" /></svg></button>}
      {children}
    </div>
  );
}
