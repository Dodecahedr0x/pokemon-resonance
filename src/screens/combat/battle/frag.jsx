import { Html } from '../../../lib/html.jsx';
import { itemize } from '../../../engine/041-illustrations.js';

// Fragment produced by an engine function, with illustrated held items
// (the old itemizeDom ran over the whole panel after its render).
export function Hi({ html }) {
  return <Html html={itemize(html)} />;
}

// Steps of the guided turn (v4.78), keys of flow478.step: foot of the bar (Foot) and panel timeline (Panel).
export const STEP = { deplacer: 'Déplacer', agir: 'Agir', extra: 'Terminer', fini: 'Fini' };

// The guided flow (v4.78) removes the ".bp-hint" tips from the panel when no mode is active.
export function withoutTip(html) {
  if (!html || !html.includes('bp-hint')) {
    return html;
  }
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('.bp-hint').forEach(h => h.remove());
  return t.innerHTML;
}
