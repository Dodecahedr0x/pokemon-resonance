import { Html } from '../../../lib/html.jsx';
import { itemize } from '../../../engine/041-v4-1-01-illustrations.js';

// Fragment produit par une fonction du moteur, avec les objets tenus illustrés
// (l'ancien itemizeDom passait sur tout le panneau après son rendu).
export function Hi({ html }) {
  return <Html html={itemize(html)} />;
}

// Étapes du tour guidé (v4.78), clés de flow478.etape : pied de la barre (Foot) et frise du panneau (Panel).
export const ETAPE = { deplacer: 'Déplacer', agir: 'Agir', extra: 'Terminer', fini: 'Fini' };

// Le déroulé guidé (v4.78) retire les astuces « .bp-hint » du panneau quand aucun mode n'est actif.
export function sansAstuce(html) {
  if (!html || !html.includes('bp-hint')) return html;
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('.bp-hint').forEach(h => h.remove());
  return t.innerHTML;
}
