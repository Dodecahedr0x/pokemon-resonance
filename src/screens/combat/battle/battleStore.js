import { canal } from '../../../lib/store.js';

// Interface du combat autour du plateau. Chaque partie a sa version : le moteur l'incrémente
// là où il réécrivait l'ancien innerHTML, et la partie est reconstruite depuis B et ui.
//   top    : bandeau, synergies, règle d'arène, frise, plaques (renderTop)
//   foot   : phase et bouton de fin de tour (renderTop, puis fin de renderAll)
//   fast   : bouton « ×2 » (rapide428)
//   panel  : panneau de commande (renderPanel)
//   log    : journal (renderLog)
//   evo    : choix d'évolution (openEvoPick)
//   result : fiche de fin de combat (finish)
//   ti444  : fiche de case (v4.44, fiche444 et place444)
const versions = { top: 0, foot: 0, fast: 0, panel: 0, log: 0, evo: 0, result: 0, ti444: 0 };
const c = canal();

export function refreshBattle(...parts) {
  parts.forEach(k => versions[k]++);
  c.emit();
}

export const useBattleVersion = k => c.use(() => versions[k]);

// Choix d'évolution ouvert : le Pokémon qui évolue.
export const evoState = { u: null };

// Barre du bas (.bt-foot) : classes dans l'ordre où classList les posait (qa-on v4.43, f444 v4.44),
// attaques à portée de pouce (#qa443 et .qa443-n, v4.43) : null tant que la barre n'a pas servi.
//   qa : { hidden, nom, items: [{ t, c, col, on, disabled }] }
export const pied = { cls: ['bt-foot'], qa: null };

/** classList.toggle sur la barre du bas ; vrai si la classe a changé (à suivre de refreshBattle('foot')). */
export function footCls(nom, on) {
  const a = pied.cls.includes(nom);
  if (on === a) return false;
  pied.cls = on ? [...pied.cls, nom] : pied.cls.filter(c => c !== nom);
  return true;
}

// Fiche de case (#ti444, v4.44) : créée à la première ouverture, puis masquée.
export const fiche444 = { made: false, hidden: true, k: null, haut: false, top: undefined, bottom: undefined };
