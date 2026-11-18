/* Section d'origine : v4.39 : import de sauvegarde plus tolérant */

import { BY, PRESETS } from './009-03-pokemon.js';
import { BUDGET } from './010-04-evolution-en-combat.js';
import { RC } from './012-06-recrues-roles-synergies.js';
import { $, toast } from './014-08-outils.js';
import { TEAM_MAX } from './020-13-equipe-cartes.js';
import { SAVE_V, SV, __set_importData, __set_importSave, applySave, autoSave, closeSaves, importData, importSave, readCode, readText, validBattle, validSave } from './025-19-sauvegardes.js';


/* Avant : l’import refusait tout fichier dont l’équipe sortait du budget, contenait une espèce inconnue ou une autre version.
   Maintenant : on répare ce qui peut l’être (équipe filtrée, enveloppe {auto: …}, version), et le message dit pourquoi si ça échoue. */
function normSave439(s) {
  if (!s || typeof s !== 'object') return null;
  for (const k of ['auto', 'save', 'data', 'snapshot'])
    if (!s.squad && !s.profile && s[k] && typeof s[k] === 'object') s = s[k];
  if (!s || typeof s !== 'object' || (!Array.isArray(s.squad) && !s.profile)) return null;
  const o = Object.assign({}, s);
  o.v = SAVE_V;
  if (typeof o.savedAt !== 'string') o.savedAt = new Date().toISOString();
  if (!Array.isArray(o.badges)) o.badges = [];
  const keep = [],
    seen = new Set();
  let cost = 0;
  (Array.isArray(o.squad) ? o.squad : []).forEach(id => {
    if (!BY[id] || keep.length >= TEAM_MAX || seen.has(BY[id].base) || cost + RC(id) > BUDGET) return;
    seen.add(BY[id].base);
    cost += RC(id);
    keep.push(id);
  });
  o.squad = keep.length ? keep : [...PRESETS.orage.ids];
  return o;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

__set_importData(function (s) {
  const n = normSave439(s);
  if (!n) {
    toast('Fichier illisible : ce n’est pas une sauvegarde Résonance.');
    return false;
  }
  try {
    if (!validSave(n)) throw new Error('sauvegarde incomplète');
    autoSave();
    applySave(n, { leaveBattle: true });
    closeSaves();
    autoSave(true);
    toast(validBattle(SV.lastBattle) ? 'Partie importée : un combat en cours vous attend.' : 'Partie importée.');
    return true;
  } catch (e) {
    toast('Import impossible : ' + String((e && e.message) || 'sauvegarde invalide').slice(0, 80));
    return false;
  }
});


__set_importSave(async function (file) {
  if (!file) return;
  let s = null;
  try {
    s = readCode(await readText(file));
  } catch (e) {
    toast('Fichier illisible : ce n’est ni un fichier .json ni un code de sauvegarde.');
    const i = $('#svFile');
    if (i) i.value = '';
    return;
  }
  importData(s);
  const i = $('#svFile');
  if (i) i.value = '';
});
}
