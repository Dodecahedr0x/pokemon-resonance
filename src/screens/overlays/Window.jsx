import { useOverlay } from './dialogsStore.js';

// Window painted by paintOverlay(name, state): a new block per state (key). The engine keeps
// the clicks and the hidden attribute: React renders `hidden` only on mount and no longer changes it.
export function Box({ displayName: displayName, className, id, cardComponent: Card }) {
  const s = useOverlay(displayName);
  return (
    <div className={className} id={id} hidden>
      {s && <Card key={s.v} {...s} />}
    </div>
  );
}

// ".dialog-card" dialog card and its close button; `shut`: the data-* attribute that
// the engine's listener recognizes (e.g. { 'data-ct': 'x' }), absent when it cannot be closed.
export function Dialogue({ className, titre: heading, closeAttrs: shut, children }) {
  return (
    <div className={className} role="dialog" aria-modal="true" aria-labelledby={heading}>
      {shut && (
        <button className="dialog-close" type="button" {...shut} aria-label="Fermer">
          <svg>
            <use href="#i-x" />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}
