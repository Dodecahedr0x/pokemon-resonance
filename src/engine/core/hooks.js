/* =====================================================================
   Hooks (extension points)
   ---------------------------------------------------------------------
   Features plug in here instead of modifying the engine: each list
   receives functions (HOOKS.x.push(f)), the engine calls them at the
   right moment, in registration order. No engine function is replaced
   after the fact. A few later features register at the front (unshift)
   on progress, battleResult and beforeRoundEnd so they run first.

   Battle rules (called by the engine, an error propagates):
   creation(S, opt, D0)      battle created, before the opponents' first intents
   combat(S, opt, D0)        battle ready (after items, Bonds, fatigue)
   beforeRoundEnd(S, ev)     end of round, before the effects (charged attacks, traps)
   beforeVerdict(S, ev)      before judging whether the battle is won or lost
   progress(S, rew, win)     after a battle: returns the extra [Pokédollars, Shards] earned
   battleResult(rew)         HTML lines added to the result screen

   Interface (called by hook(): a feature that fails does not interrupt the game):
   damage(S, v, real, o)     Pokémon v has just lost real HP
   beforeLaunch()            launch(): before the battle is created
   launch(isNew)             launch(): after; isNew = a battle has just been created
   beforeRender()            renderAll(): before redrawing the battle
   rendered()                renderAll(): after
   beforeBattleEnd()         finish(): battle over, before the rank and progression
   battleEnd()               finish(): after
   journal(ev)               after reading the events of an action
   action(uid)               after the action of Pokémon uid
   beforeBoard()             buildBoard(): before building the board
   boardBuilt()              buildBoard(): after
   boardRendered()           renderBoard(): after
   beforeToken(u)            before updating a token
   token(u)                  token position, ring and classes up to date
   illustration(u)           token illustration up to date
   afterToken(u)             token update finished
   hit(uid)                  a Pokémon has just taken a hit
   beforePresentation()      before the opponents' presentation
   beforeBanner()            before the round banner
   timeOfDay(t)              the time of day has changed
   page(previous)            show(): after; previous = previous page
   mapRendered()             renderMap(): after
   purchase()                after a purchase that changed the wallet
   routeChoice(j)            after choice j of the route encounter

   Filters and refusals (called by the engine, an error propagates):
   hpBar(html, u)            returns the banner's HP bar, transformed
   routeEncounter(r)         returns the day's encounter, possibly replaced
   beforeRouteChoice(j)      returning true takes over choice j
   launchRefusal()           launch(): returning a message refuses to start the battle
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
  boardBuilt: [],
  boardRendered: [],
  beforeToken: [],
  token: [],
  illustration: [],
  afterToken: [],
  hit: [],
  beforePresentation: [],
  beforeBanner: [],
  timeOfDay: [],
  page: [],
  mapRendered: [],
  purchase: [],
  routeChoice: [],
  hpBar: [],
  routeEncounter: [],
  beforeRouteChoice: [],
  launchRefusal: [],
};

export function hook(name, ...args) {
  for (const f of HOOKS[name]) {
    try {
      f(...args);
    } catch (e) {
      console.error('[Resonance] hook ' + name, e);
    }
  }
}
