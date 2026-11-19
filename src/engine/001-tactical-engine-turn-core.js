/* Original section: tactical engine (core, turns) */

export let MT;

// Instructions run at startup, in the original order (see index.js).
export function __init() {
MT = (() => {

/* ==== tactical-engine/core.js ==== */
/* =====================================================================
   CORE: modifiers. A system that wants to influence a calculation (rain
   on Water damage, night on critical hits, mud on speed) provides a
   modifier. The calculation knows nothing about weather: it asks
   "what modifies this channel?" and applies the list.
   ===================================================================== */

/* ---------- Modifiers ----------
   A modifier: { source, libelle, mul?, add?, crans?, fixe? }
   - mul   : multiplies the value (rain: ×1.5 on Water)
   - add   : added before the multiplications (a role: +1 Mobility)
   - crans : Pokémon-style stages (critical, accuracy)
   - fixe  : forces a value (Thunder in the rain: accuracy 100%)
   The "providers" are objects { id, fournir(channel, ctx, subject) } that return
   a modifier, a list of modifiers or nothing.                                   */
function combineModifiers(base, changes) {
  let add = 0,
    mul = 1,
    notches = 0,
    isFixed = null;
  for (const m of changes) {
    if (m.add) add += m.add;
    if (m.mul != null) mul *= m.mul;
    if (m.crans) notches += m.crans;
    if (m.fixe != null) isFixed = m.fixe;
  }
  // multiplications are applied one by one, in provider order: the result is
  // identical, down to the last digit, to a hand-written calculation (x *= a; x *= b; …)
  let amount = base + add;
  for (const m of changes) if (m.mul != null) amount *= m.mul;
  if (isFixed != null) amount = isFixed;
  return { valeur: amount, mul, add, crans: notches, detail: changes };
}

/** Calls each provider and flattens the result (ignores empty ones). */
function collect(providers, channel, ctx, subject) {
  const out = [];
  for (const f of providers) {
    if (!f || !f.fournir) continue;
    const r = f.fournir(channel, ctx, subject);
    if (!r) continue;
    for (const m of Array.isArray(r) ? r : [r]) if (m) out.push({ source: f.id, ...m });
  }
  return out;
}

/* ==== tactical-engine/turns.js ==== */
/* =====================================================================
   TURN MANAGEMENT: who plays, and in what order
   ---------------------------------------------------------------------
   Two interchangeable strategies (same interface):

   ▸ OrderByPhases — Resonance's classic system
     All allies play in the order chosen by the player, then the
     opponents in order (priority of their announced attack, then Speed).

   ▸ OrderBySpeed — the order of the Pokémon games, applied to the board
     Each round, ALL Pokémon (allies and opponents mixed) play
     once, from fastest to slowest. An announced priority attack
     (Quick Attack) goes first; a negative-priority attack goes last.
     Speed tie: broken by battle.rankNo(u) (the round's draw).

   These strategies know nothing about the data: they ask the
   battle for stat(u, 'vit'), priority(u) and rankNo(u). That is what lets
   them plug as-is into the game's engine (see 044-tactical-engine.js).
   ===================================================================== */

/** Initiative: priority of the announced attack, then effective Speed, then rank (tiebreak). */
function sortByInitiative(c, units) {
  const key = new Map(units.map(u => [u, [c.priorite(u), c.stat(u, 'vit'), c.rang(u)]]));
  return [...units].sort((a, b) => {
    const A = key.get(a),
      B = key.get(b);
    return B[0] - A[0] || B[1] - A[1] || A[2] - B[2];
  });
}

class OrderByPhases {
  constructor(battle) {
    this.c = battle;
    this.mode = 'phases';
  }
  get etat() {
    return this.c.etat.tours;
  }
  static creerEtat() {
    return { mode: 'phases', tour: 1, phase: 'a', joues: [], charges: [], actif: null };
  }
  demarrer() {
    this.c.bus.emit('tour:debut', { tour: 1 });
  }
  ordrePhase(camp) {
    return sortByInitiative(
      this.c,
      this.c.unitesVivantes().filter(u => u.camp === camp && !this.etat.joues.includes(u.id))
    );
  }
  prochain() {
    const e = this.etat;
    // charged moves go off at the start of their side's phase
    const ch = e.charges.find(x => this.c.unite(x.unite).camp === e.phase);
    if (ch) {
      e.charges = e.charges.filter(x => x !== ch);
      return { type: 'charge', charge: ch };
    }
    const remainder = this.ordrePhase(e.phase);
    if (remainder.length) {
      e.actif = remainder[0].id;
      return { type: 'unite', unite: remainder[0], choix: remainder.map(u => u.id) }; // the player can choose another one: battle.activate(id)
    }
    if (e.phase === 'a') {
      e.phase = 'e';
      e.joues = [];
      return this.prochain();
    }
    this.c.finDeTour();
    Object.assign(e, { phase: 'a', joues: [], tour: e.tour + 1 });
    if (!this.c.etat.fin) this.c.bus.emit('tour:debut', { tour: e.tour });
    return { type: 'finDeTour', tour: e.tour - 1 };
  }
  apresActivation(u) {
    this.etat.joues.push(u.id);
    this.etat.actif = null;
  }
  charge(u) {
    return this.etat.charges.find(ch => ch.unite === u.id) || null;
  }
  programmerCharge(u, moveId, target) {
    const ch = { unite: u.id, capacite: moveId, cible: target };
    this.etat.charges.push(ch);
    u.charge = moveId;
    return ch;
  }
  prevoir() {
    return [...this.ordrePhase('a'), ...this.ordrePhase('e')].map(u => ({ type: 'unite', unite: u.id }));
  }
}

class OrderBySpeed {
  constructor(battle) {
    this.c = battle;
    this.mode = 'vitesse';
  }
  get etat() {
    return this.c.etat.tours;
  }
  static creerEtat() {
    return { mode: 'vitesse', tour: 1, joues: [], charges: [], actif: null };
  }
  demarrer() {
    this.c.bus.emit('tour:debut', { tour: 1 });
  }
  /** Those who have not yet played this round, in the order they will play. */
  ordreDuTour() {
    return sortByInitiative(
      this.c,
      this.c.unitesVivantes().filter(u => !this.etat.joues.includes(u.id))
    );
  }
  prochain() {
    const e = this.etat,
      [u] = this.ordreDuTour();
    if (!u) {
      this.c.finDeTour();
      Object.assign(e, { joues: [], tour: e.tour + 1 });
      if (!this.c.etat.fin) this.c.bus.emit('tour:debut', { tour: e.tour });
      return { type: 'finDeTour', tour: e.tour - 1 };
    }
    // a charged move goes off on its caster's next turn, in place of its action
    const ch = this.charge(u);
    if (ch) {
      e.charges = e.charges.filter(x => x !== ch);
      e.joues.push(u.id);
      return { type: 'charge', charge: ch };
    }
    e.actif = u.id;
    return { type: 'unite', unite: u };
  }
  apresActivation(u) {
    if (!this.etat.joues.includes(u.id)) this.etat.joues.push(u.id);
    this.etat.actif = null;
  }
  charge(u) {
    return this.etat.charges.find(ch => ch.unite === u.id) || null;
  }
  programmerCharge(u, moveId, target) {
    const ch = { unite: u.id, capacite: moveId, cible: target };
    this.etat.charges.push(ch);
    u.charge = moveId;
    return ch;
  }
  prevoir() {
    return this.ordreDuTour().map(u => ({ type: 'unite', unite: u.id }));
  }
}

return { OrdreParPhases: OrderByPhases, OrdreParVitesse: OrderBySpeed, collecter: collect, combinerModificateurs: combineModifiers, trierParInitiative: sortByInitiative };
})();
}
