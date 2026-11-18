/* Section d'origine : v4.8-00-crochets.js */

export let CROCHETS;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.8 : crochets (points d'extension)
   ---------------------------------------------------------------------
   Les nouveautés se branchent ici au lieu de modifier le moteur à chaque
   fois. Chaque liste reçoit des fonctions ; le moteur les appelle au bon
   moment. Sans fonction enregistrée, rien ne change.

   creation(S, opt, D0)      combat créé, avant les premières intentions adverses
   combat(S, opt, D0)        combat prêt (après objets, Liens, fatigue)
   avantFinManche(S, ev)     fin de manche, avant les effets (attaques chargées, pièges)
   progres(S, rew, win)      après un combat : renvoie [Pokédollars, Éclats] gagnés en plus
   resultat(rew)             lignes HTML ajoutées à l'écran de résultat
   ===================================================================== */
CROCHETS = { creation: [], combat: [], avantFinManche: [], progres: [], resultat: [] };
}
