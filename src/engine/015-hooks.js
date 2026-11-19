/* Original section: v4.8-00-hooks.js */

/* =====================================================================
   Hooks (extension points)
   ---------------------------------------------------------------------
   New features plug in here instead of modifying the engine: each
   list receives functions (CROCHETS.x.push(f)), the engine calls them
   at the right moment, in registration order. No engine function
   is replaced after the fact.
   Exception: sections 4.58 to 4.71 (089, 092, 095 to 099, 103, 104) register
   at the front (unshift) on progres, resultat and avantFinManche: they run before
   the oldest ones, the last one registered running first.

   Battle rules (called by the engine, an error propagates):
   creation(S, opt, D0)      battle created, before the opponents' first intents
   combat(S, opt, D0)        battle ready (after items, Bonds, fatigue)
   avantFinManche(S, ev)     end of round, before the effects (charged attacks, traps)
   avantVerdict(S, ev)       fin(S, ev): before judging whether the battle is won or lost
   progres(S, rew, win)      after a battle: returns the extra [Pokédollars, Shards] earned
   resultat(rew)             HTML lines added to the result screen

   Interface (called by hook(): a feature that fails does not interrupt the game):
   degats(S, v, real, o)     journalDamage(): Pokémon v has just lost real HP
   avantLancement()          launch(): before the battle is created
   lancement(nouveau)        launch(): after; nouveau = a battle has just been created
   avantRendu()              renderAll(): before redrawing the battle
   rendu()                   renderAll(): after
   avantFinCombat()          finish(): battle over, before the rank and progression
   finCombat()               finish(): after
   journal(ev)               playLog(ev): after reading the events of an action
   action(uid)               confirmAct(): after the action of Pokémon uid
   avantPlateau()            buildBoard(): before building the board
   plateau()                 buildBoard(): after
   plateauRendu()            renderBoard(): after
   avantJeton(u)             updTok(u): before updating the token
   jeton(u)                  updTok(u): token position, ring and classes up to date
   illustration(u)           updTok(u): token illustration up to date
   apresJeton(u)             updTok(u): end
   touche(uid)               a Pokémon has just taken a hit
   avantPresentation()       vsIntro(): before the opponents' presentation
   avantBandeau()            turnBanner(): before the round banner
   heure(t)                  setTod(t): the time of day has changed
   page(avant)               show(): after; avant = previous page
   carte()                   renderMap(): after
   achat()                   buy(): after a purchase that changed the wallet
   choixRoute(j)             pickRouteChoice(j): after choice j of the route encounter

   Filters and refusals (called by the engine, an error propagates):
   barrePv(html, u)          segHp(u): returns the banner's HP bar, transformed
   rencontreRoute(r)         routeEvent(): returns the day's encounter, possibly replaced
   avantChoixRoute(j)        pickRouteChoice(j): returning true takes over choice j
   refusLancement()          launch(): returning a message refuses to start the battle
   ===================================================================== */
export const HOOKS = {
  creation: [],
  combat: [],
  beforeRoundEnd: [],
  beforeVerdict: [],
  progress: [],
  battleResult: [],
  beforeLaunch: [],
  launch: [],
  damage: [],
  beforeRender: [],
  rendered: [],
  beforeBattleEnd: [],
  battleEnd: [],
  journal: [],
  action: [],
  beforeBoard: [],
  plateau: [],
  boardRendered: [],
  beforeToken: [],
  token: [],
  illustration: [],
  afterToken: [],
  touche: [],
  beforePresentation: [],
  beforeBanner: [],
  timeOfDay: [],
  page: [],
  carte: [],
  purchase: [],
  routeChoice: [],
  hpBar: [],
  routeEncounter: [],
  beforeRouteChoice: [],
  launchRefusal: [],
};

export function hook(displayName, ...args) {
  for (const f of HOOKS[displayName]) {
    try {
      f(...args);
    } catch (e) {
      console.error('[Resonance] hook ' + displayName, e);
    }
  }
}
