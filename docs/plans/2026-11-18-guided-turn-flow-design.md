# Guided turn flow — design

Date: 2026-11-18 · Baseline: v4.77

## Goal

In combat, the interface walks the player through every action of the round.
The round can no longer be ended while a Pokémon still has something to do:
« Fin du tour » disappears during the player phase and the round ends by itself
once every Pokémon is done. Skipping is always an explicit tap.

## Steps per Pokémon

`stepOf(u)` derives the step from the existing flags (`moved`, `acted`, `sn`,
`hr`, `ko`) plus one new flag `u.done` (reset at round start):

| Step | When | Panel |
|---|---|---|
| Déplacer | not moved, not acted, can act | blue tiles + « Rester ici » (attacking directly stays allowed) |
| Agir | moved or stayed, not acted | moves, Éveil when ready, + « Passer l'action » |
| Extra | acted, and Éclaireur can retreat or Relance is affordable | that option + « Terminer » |
| Fini | `done`, KO, or `sn` | — |

- Panel header shows the stepper (`① Déplacer › ② Agir › ③ Fini`) and how many
  Pokémon are left.
- Esquive stays a side button (available almost always; prompting it would nag).
- When a Pokémon reaches Fini, the next unfinished one is selected; tapping any
  other unfinished Pokémon switches to it.

## End of round

- `checkAutoEnd()` runs after every player action. When nothing is left, a short
  banner (« Manche terminée », ~0.6 s, after animations) then the existing
  `endTurn()`.
- A move alone never ends the round, so move undo (`ui.undo`) keeps working.
- During the enemy phase `#bEnd` stays as « Passer » (speed-up).

## Modes

- Vitesse order: « Terminer » is replaced by the steps; when the current ally is
  Fini the flow calls `finTourVitesse()`.
- Coop / local duel: when the active player has nothing left, `endTurn()` hands
  over through `coopPasse418` / `duelPasse433`; banner names the next player.

## Edge cases

- `sn` (frozen, asleep, paralysed): Fini at once, panel says why.
- No target in range: Agir shows only « Passer l'action », never auto-skipped.
- KO during own action: Fini, flow moves on.
- Éveil consumes the action → Extra step can offer Relance.

## Also

- Auto-end goes through a non-bubbling click on `#bEnd`, so capture handlers
  (énigme: ending the round = losing) still apply and the document « Passer »
  listener does not fast-forward the enemy turn.
- In énigme mode `#bEnd` stays visible: it is the « Abandonner l'énigme » button.
- Keyboard: Space / E presses the current step's skip button.
- Phone: the panel is off-screen, so a step label (« Agir Salamèche · encore 2 »)
  replaces `#bEnd` in the bottom bar.

- Tutorial step « Terminez la manche » rewritten (no more `#bEnd`).
- `#bPhase` says « Encore N Pokémon à jouer ».
- README section.

## Testing

Browser: solo, Vitesse-order and coop battles; rounds using Rester, Passer,
Relance, Éveil, Éclaireur retreat and a frozen Pokémon; the round must end only
once every Pokémon is done.
