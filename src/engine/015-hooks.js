/* Section d'origine : v4.8-00-crochets.js */

/* =====================================================================
   Crochets (points d'extension)
   ---------------------------------------------------------------------
   Les nouveautés se branchent ici au lieu de modifier le moteur : chaque
   liste reçoit des fonctions (CROCHETS.x.push(f)), le moteur les appelle
   au bon moment, dans l'ordre d'inscription. Aucune fonction du moteur
   n'est remplacée après coup.
   Exception : les sections 4.58 à 4.71 (089, 092, 095 à 099, 103, 104) s'inscrivent
   en tête (unshift) sur progres, resultat et avantFinManche : elles passent avant
   les plus anciennes, la dernière inscrite en premier.

   Règles du combat (appelés par le moteur, une erreur remonte) :
   creation(S, opt, D0)      combat créé, avant les premières intentions adverses
   combat(S, opt, D0)        combat prêt (après objets, Liens, fatigue)
   avantFinManche(S, ev)     fin de manche, avant les effets (attaques chargées, pièges)
   avantVerdict(S, ev)       fin(S, ev) : avant de juger si le combat est gagné ou perdu
   progres(S, rew, win)      après un combat : renvoie [Pokédollars, Éclats] gagnés en plus
   resultat(rew)             lignes HTML ajoutées à l'écran de résultat

   Interface (appelés par crochet() : une nouveauté qui échoue n'interrompt pas le jeu) :
   degats(S, v, real, o)     jDmg430() : le Pokémon v vient de perdre real PV
   avantLancement()          launch() : avant la création du combat
   lancement(nouveau)        launch() : après ; nouveau = un combat vient d'être créé
   avantRendu()              renderAll() : avant de redessiner le combat
   rendu()                   renderAll() : après
   avantFinCombat()          finish() : combat terminé, avant le rang et la progression
   finCombat()               finish() : après
   journal(ev)               playLog(ev) : après la lecture des événements d'une action
   action(uid)               confirmAct() : après l'action du Pokémon uid
   avantPlateau()            buildBoard() : avant de construire le plateau
   plateau()                 buildBoard() : après
   plateauRendu()            renderBoard() : après
   avantJeton(u)             updTok(u) : avant de mettre à jour le jeton
   jeton(u)                  updTok(u) : position, anneau et classes du jeton à jour
   illustration(u)           updTok(u) : illustration du jeton à jour
   apresJeton(u)             updTok(u) : fin
   touche(uid)               un Pokémon vient de prendre un coup
   avantPresentation()       vsIntro() : avant la présentation des adversaires
   avantBandeau()            turnBanner() : avant le bandeau de manche
   heure(t)                  setTod(t) : l'heure du jour a changé
   page(avant)               show() : après ; avant = page précédente
   carte()                   renderMap() : après
   achat()                   buy() : après un achat qui a changé le porte-monnaie
   choixRoute(j)             evPick454(j) : après le choix j de la rencontre sur la route

   Filtres et refus (appelés par le moteur, une erreur remonte) :
   barrePv(html, u)          segHp(u) : renvoie la barre de PV d'un bandeau, transformée
   rencontreRoute(r)         ev454() : renvoie la rencontre du jour, éventuellement remplacée
   avantChoixRoute(j)        evPick454(j) : renvoyer true prend la main sur le choix j
   refusLancement()          launch() : renvoyer un message refuse de lancer le combat
   ===================================================================== */
export const CROCHETS = {
  creation: [],
  combat: [],
  avantFinManche: [],
  avantVerdict: [],
  progres: [],
  resultat: [],
  avantLancement: [],
  lancement: [],
  degats: [],
  avantRendu: [],
  rendu: [],
  avantFinCombat: [],
  finCombat: [],
  journal: [],
  action: [],
  avantPlateau: [],
  plateau: [],
  plateauRendu: [],
  avantJeton: [],
  jeton: [],
  illustration: [],
  apresJeton: [],
  touche: [],
  avantPresentation: [],
  avantBandeau: [],
  heure: [],
  page: [],
  carte: [],
  achat: [],
  choixRoute: [],
  barrePv: [],
  rencontreRoute: [],
  avantChoixRoute: [],
  refusLancement: []
};

export function hook(displayName, ...args) {
  for (const f of CROCHETS[displayName]) {
    try {
      f(...args);
    } catch (e) {
      console.error('[Résonance] crochet ' + displayName, e);
    }
  }
}
