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
        if (m.add) {
          add += m.add;
        }
        if (m.mul != null) {
          mul *= m.mul;
        }
        if (m.stageShifts) {
          notches += m.stageShifts;
        }
        if (m.fixed != null) {
          isFixed = m.fixed;
        }
      }
      // multiplications are applied one by one, in provider order: the result is
      // identical, down to the last digit, to a hand-written calculation (x *= a; x *= b; …)
      let amount = base + add;
      for (const m of changes) {
        if (m.mul != null) {
          amount *= m.mul;
        }
      }
      if (isFixed != null) {
        amount = isFixed;
      }
      return { amountValue: amount, mul, add, stageShifts: notches, detail: changes };
    }

    /** Calls each provider and flattens the result (ignores empty ones). */
    function collect(providers, channel, ctx, subject) {
      const out = [];
      for (const f of providers) {
        if (!f || !f.provide) {
          continue;
        }
        const r = f.provide(channel, ctx, subject);
        if (!r) {
          continue;
        }
        for (const m of Array.isArray(r) ? r : [r]) {
          if (m) {
            out.push({ source: f.id, ...m });
          }
        }
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
      const key = new Map(units.map(u => [u, [c.priority(u), c.stat(u, 'vit'), c.rankIndex(u)]]));
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
      get status() {
        return this.c.status.roundCount;
      }
      static createState() {
        return { mode: 'phases', tour: 1, phase: 'a', played: [], charges: [], active: null };
      }
      begin() {
        this.c.bus.emit('tour:debut', { tour: 1 });
      }
      phaseOrder(camp) {
        return sortByInitiative(
          this.c,
          this.c.aliveUnits().filter(u => u.camp === camp && !this.status.played.includes(u.id))
        );
      }
      nextUnit() {
        const e = this.status;
        // charged moves go off at the start of their side's phase
        const ch = e.charges.find(x => this.c.unitRef(x.unitRef).camp === e.phase);
        if (ch) {
          e.charges = e.charges.filter(x => x !== ch);
          return { type: 'charge', charge: ch };
        }
        const remainder = this.phaseOrder(e.phase);
        if (remainder.length) {
          e.active = remainder[0].id;
          return { type: 'unite', unitRef: remainder[0], choice: remainder.map(u => u.id) }; // the player can choose another one: battle.activate(id)
        }
        if (e.phase === 'a') {
          e.phase = 'e';
          e.played = [];
          return this.nextUnit();
        }
        this.c.endTurn();
        Object.assign(e, { phase: 'a', played: [], tour: e.tour + 1 });
        if (!this.c.status.fin) {
          this.c.bus.emit('tour:debut', { tour: e.tour });
        }
        return { type: 'finDeTour', tour: e.tour - 1 };
      }
      afterActivation(u) {
        this.status.played.push(u.id);
        this.status.active = null;
      }
      charge(u) {
        return this.status.charges.find(ch => ch.unitRef === u.id) || null;
      }
      scheduleCharge(u, moveId, target) {
        const ch = { unitRef: u.id, moveId, targetRef: target };
        this.status.charges.push(ch);
        u.charge = moveId;
        return ch;
      }
      forecast() {
        return [...this.phaseOrder('a'), ...this.phaseOrder('e')].map(u => ({ type: 'unite', unitRef: u.id }));
      }
    }

    class OrderBySpeed {
      constructor(battle) {
        this.c = battle;
        this.mode = 'vitesse';
      }
      get status() {
        return this.c.status.roundCount;
      }
      static createState() {
        return { mode: 'vitesse', tour: 1, played: [], charges: [], active: null };
      }
      begin() {
        this.c.bus.emit('tour:debut', { tour: 1 });
      }
      /** Those who have not yet played this round, in the order they will play. */
      turnOrder() {
        return sortByInitiative(
          this.c,
          this.c.aliveUnits().filter(u => !this.status.played.includes(u.id))
        );
      }
      nextUnit() {
        const e = this.status,
          [u] = this.turnOrder();
        if (!u) {
          this.c.endTurn();
          Object.assign(e, { played: [], tour: e.tour + 1 });
          if (!this.c.status.fin) {
            this.c.bus.emit('tour:debut', { tour: e.tour });
          }
          return { type: 'finDeTour', tour: e.tour - 1 };
        }
        // a charged move goes off on its caster's next turn, in place of its action
        const ch = this.charge(u);
        if (ch) {
          e.charges = e.charges.filter(x => x !== ch);
          e.played.push(u.id);
          return { type: 'charge', charge: ch };
        }
        e.active = u.id;
        return { type: 'unite', unitRef: u };
      }
      afterActivation(u) {
        if (!this.status.played.includes(u.id)) {
          this.status.played.push(u.id);
        }
        this.status.active = null;
      }
      charge(u) {
        return this.status.charges.find(ch => ch.unitRef === u.id) || null;
      }
      scheduleCharge(u, moveId, target) {
        const ch = { unitRef: u.id, moveId, targetRef: target };
        this.status.charges.push(ch);
        u.charge = moveId;
        return ch;
      }
      forecast() {
        return this.turnOrder().map(u => ({ type: 'unite', unitRef: u.id }));
      }
    }

    return { OrderByPhases, OrderBySpeed, collect, combineModifiers, sortByInitiative };
  })();
}
