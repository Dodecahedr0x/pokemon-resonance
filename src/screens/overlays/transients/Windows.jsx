// Small « battleHelp » windows (shared frame: title, × button, .battleHelp-b body).
// Clicks stay in the engine (delegated listeners data-help-action, data-route-event…); the click
// on the backdrop is set by the engine on the node returned by overlay().

// Shared frame. `k`: name of the close button's data-… attribute.
export function Window({ id, tid, k, titre: heading, children }) {
  return (
    <div id={id} className="battle-help">
      <div className="battle-help-c" role="dialog" aria-modal="true" aria-labelledby={tid}>
        <header>
          <h3 id={tid}>{heading}</h3>
          <button type="button" className="sh-x" {...{ ['data-' + k]: 'close' }} aria-label="Fermer">
            ×
          </button>
        </header>
        <div className="battle-help-b">{children}</div>
      </div>
    </div>
  );
}

// Choice button (.routeEvent-c): label, detail (<small>) if `eff` is not null.
function Choice({ k, v, ok = true, l, eff = null }) {
  return (
    <button type="button" className="route-event-c" {...{ ['data-' + k]: v }} disabled={!ok}>
      <b>{l}</b>
      {eff != null ? <small>{eff}</small> : null}
    </button>
  );
}

// Battle help (#battleHelp, v4.52 · BattleHelp in 082).
export function BattleHelp({ d }) {
  return (
    <Window id="battle-help" tid="battle-help-t" k="help-action" titre="Aide du combat">
      {d.sel && (
        <section>
          <h4>{d.sel.n} · votre sélection</h4>
          {d.sel.roles.map(([r, fx], i) => (
            <p key={i}>
              <b>{r}</b>
              {fx ? ` (${fx[0]}) : ${fx[1]}` : ''}
            </p>
          ))}
          {d.sel.ability && (
            <p>
              <b>Talent · {d.sel.ability[0]}.</b> {d.sel.ability[1]}
            </p>
          )}
        </section>
      )}
      {d.terrainList.length > 0 && (
        <section>
          <h4>Sur ce plateau</h4>
          {d.terrainList.map(([n, t], i) => (
            <p key={i}>
              <b>{n}.</b> {t}
            </p>
          ))}
        </section>
      )}
      {d.wx && (
        <section>
          <h4>
            Météo · {d.wx.n} ({d.wx.roundCount} manches)
          </h4>
          <p>{d.wx.d}</p>
        </section>
      )}
      <section>
        <h4>Réactions</h4>
        <details>
          <summary>Voir les {d.rx.length} réactions</summary>
          {d.rx.map(([n, t], i) => (
            <p key={i}>
              <b>{n}.</b> {t}
            </p>
          ))}
        </details>
      </section>
      <section>
        <h4>Astuces</h4>
        <p>Un appui long sur une case (ou la loupe) donne son détail : terrain, dangers et Pokémon présent.</p>
      </section>
    </Window>
  );
}

// Encounter on the route (#eventChoice, v4.54); `res`: outcome after a choice (pickRouteChoice).
export function RouteEncounter({ d }) {
  return (
    <Window id="event-choice" tid="encounter-title" k="route-event" titre={d.t}>
      {d.res ? (
        <>
          <p>
            <b>{d.res.ok ? 'Bonne nouvelle' : 'Pas de chance'}</b>
          </p>
          <p>{d.res.txt}</p>
          <Choice k="route-event" v="close" l="Continuer" />
        </>
      ) : (
        <>
          <p>{d.x}</p>
          {d.c.map((c, j) => (
            <Choice key={j} k="route-event" v={j} {...c} />
          ))}
        </>
      )}
    </Window>
  );
}

// Secret place on the map (#secretPlaces, v4.60).
export function SecretPlace({ d }) {
  return (
    <Window id="secret-places" tid="secret-title" k="secret-places" titre={d.n}>
      <p>{d.lore}</p>
      <p>
        <b>{d.msg}</b>
      </p>
      <Choice k="secret-places" v="close" l="Continuer" />
    </Window>
  );
}

// Passing character (#passerby, v4.60); `res`: reply after a choice.
export function PassingNpc({ d }) {
  return (
    <Window id="passerby" tid="npc-title" k="passerby" titre={d.n}>
      {d.res != null ? (
        <>
          <p>{d.res}</p>
          <Choice k="passerby" v="close" l="Continuer" />
        </>
      ) : (
        <>
          <p>{d.x}</p>
          {d.c.map((c, j) => (
            <Choice key={j} k="passerby" v={j} {...c} />
          ))}
        </>
      )}
    </Window>
  );
}

// Companion keepsakes (#souvenirs, v4.61): one keepsake per heart.
export function CompanionKeepsakes({ d }) {
  return (
    <Window id="souvenirs" tid="keepsake-title" k="buddy" titre={'Souvenirs de ' + d.n}>
      {d.rows.map((t, k) => {
        const i = k + 1;
        return t != null ? (
          <p key={i}>
            <b>{'♥'.repeat(i)}</b> {t}
          </p>
        ) : (
          <p key={i} className="buddy-l">
            <b>{'♥'.repeat(i)}</b> Un souvenir se débloquera à {i} cœur{i > 1 ? 's' : ''}.
          </p>
        );
      })}
      <Choice k="buddy" v="close" l="Fermer" />
    </Window>
  );
}

// Monthly seasonal event (#seasonEventO, v4.65).
export function SeasonEvent({ d }) {
  return (
    <Window id="season-event-o" tid="season-title" k="season-event" titre={d.n}>
      <p>{d.d}</p>
      <p>
        <b>Bonus du mois :</b> vos Pokémon de type {d.t} infligent +5 % de dégâts.
      </p>
      <p>
        <b>Points :</b> 1 par victoire, +1 avec un Pokémon {d.t} dans l’équipe, +2 dans le combat vedette : {d.arene}.
      </p>
      {d.tiers.map((x, i) => (
        <article key={i} className="v4-it">
          <div className="v4-it-t">
            <b>
              {x.n} · {x.p} pts
            </b>
            <p>{x.txt}</p>
          </div>
          <div className="v4-buy">
            <button type="button" className="v4-btn" data-season-event={i} disabled={!(x.ok && !x.got)}>
              {x.got ? 'Reçu' : x.ok ? 'Récupérer' : 'Verrouillé'}
            </button>
          </div>
        </article>
      ))}
      <p className="v4-note">Saisons complétées : {d.won}. L’événement change chaque mois.</p>
    </Window>
  );
}

// Boss Rush (#bossRushO, v4.66): locked, before a run, or run in progress.
export function BossRush({ d }) {
  return (
    <Window id="boss-rush-o" tid="boss-rush-title" k="boss-rush" titre="Boss Rush">
      {d.mode === 'lock' ? (
        <p>Le Boss Rush se débloque avec 5 badges.</p>
      ) : d.mode === 'new' ? (
        <>
          <p>
            Enchaînez <b>5 boss</b> d’arène à la suite avec la même équipe. Vos PV ne se régénèrent pas entre les
            combats, et un Pokémon tombé ne revient pas. Après chaque boss, choisissez <b>une relique</b> parmi trois.
            Record : <b>{d.best}</b> · terminés : <b>{d.won}</b>.
          </p>
          <Choice k="boss-rush" v="start" l="Commencer un run" eff={'Équipe actuelle · ' + d.teamNames} />
        </>
      ) : (
        <>
          <p>
            Boss{' '}
            <b>
              {d.i + 1} / {d.total}
            </b>{' '}
            · {d.eq}
          </p>
          {d.relics.length > 0 && (
            <p>
              <b>Reliques :</b> {d.relics.join(', ')}
            </p>
          )}
          {d.pend ? (
            <>
              <p>
                <b>Choisissez une relique :</b>
              </p>
              {d.pend.map(r => (
                <Choice key={r.id} k="boss-rush" v={'rel:' + r.id} l={r.n} eff={r.d} />
              ))}
            </>
          ) : (
            <Choice k="boss-rush" v="go" l={`Lancer le boss ${d.i + 1} : ${d.boss}`} />
          )}
          <button type="button" className="b b-sm b-ghost" data-boss-rush="abandon">
            Abandonner le run
          </button>
        </>
      )}
    </Window>
  );
}

// Defense gym (#defenseGymO, v4.68).
export function DefenseGym({ d }) {
  return (
    <Window id="defense-gym-o" tid="defense-gym-title" k="defense-gym" titre="Arène de défense">
      <p>{d.d}</p>
      <p>
        Record : <b>{d.best}</b> vague{d.best > 1 ? 's' : ''} · défenses réussies : <b>{d.won}</b>.
      </p>
      {d.ok ? (
        <Choice
          k="defense-gym"
          v="go"
          l="Défendre"
          eff="Votre équipe actuelle · récompenses selon les vies restantes"
        />
      ) : (
        <p>Débloquée avec 3 badges.</p>
      )}
    </Window>
  );
}

// « Défis » (Challenges) hub (#dailyChallengesO, v4.71 · 103). The original template's line breaks are kept.
export function ChallengesHub({ d }) {
  const nl = '\n';
  return (
    <Window id="daily-challenges-o" tid="daily-challenges-t" k="daily-challenges" titre="Défis du jour">
      {nl}
      {d.shadowState.fin ? (
        <p>
          <b>Les Ombres de Résonance</b> · histoire terminée
        </p>
      ) : (
        <>
          <p>
            <b>Les Ombres de Résonance</b> · épisode {d.shadowState.e + 1}/4
          </p>
          <Choice
            k="daily-challenges"
            v="omb"
            ok={d.shadowState.available}
            l={d.shadowState.available ? d.shadowState.titre : 'Épisode verrouillé'}
            eff={
              d.shadowState.available ? 'Affronter les Ombres · récompense et suite de l’histoire' : d.shadowState.req
            }
          />
        </>
      )}
      {nl}
      <p>
        <b>Défi quotidien</b> · type interdit : <b>{d.forbidden}</b> · série {d.streak} (record {d.best}, {d.tot}{' '}
        réussis)
      </p>
      {nl}
      <Choice
        k="daily-challenges"
        v="dq"
        ok={!d.fait}
        l={d.fait ? 'Défi du jour réussi' : 'Lancer le défi du jour'}
        eff="Récompense : argent, Éclats et un spécimen ancien"
      />
      {nl}
      <p>
        <b>Laboratoire</b> · spécimens anciens : {d.fossils}
      </p>
      {nl}
      <Choice
        k="daily-challenges"
        v="rev"
        ok={!(d.fossils < 1 || !d.freeSlots)}
        l="Ressusciter un spécimen"
        eff={d.freeSlots ? 'Consomme 1 spécimen · espèce rare au hasard' : 'Toutes les espèces rares sont déjà à vous'}
      />
      {nl}
      <p>
        <b>Prestige</b> · niveau {d.pre.n}
        {d.pre.on ? ' (actif)' : ''}
      </p>
      {nl}
      {d.preOk ? (
        <>
          <Choice
            k="daily-challenges"
            v="pre+"
            ok={d.pre.n < 5}
            l="Monter de niveau"
            eff="Adversaires +2 PV par niveau · +150 ₽ par niveau à chaque victoire"
          />
          <Choice k="daily-challenges" v="pre" l={(d.pre.on ? 'Désactiver' : 'Activer') + ' le prestige'} />
        </>
      ) : (
        <p>Débloqué avec 8 badges ou la Ligue.</p>
      )}
      {nl}
    </Window>
  );
}

// « Plus de défis » (More challenges) hub (#x2470o, v4.71 · 104). Original template's line breaks kept.
export function X2470({ d }) {
  const nl = '\n';
  return (
    <Window id="x2470o" tid="x2470t" k="x2470" titre="Défis de dresseur">
      {nl}
      <p>
        <b>Rivalité</b>
      </p>
      {d.lines.map((t, i) => (
        <p key={i} className="x2470-r">
          {t}
        </p>
      ))}
      {nl}
      <p>
        <b>Météo du jour</b> · {d.meteo} · {d.bonus}
      </p>
      {nl}
      <Choice
        k="x2470"
        v="wk"
        ok={!d.fini}
        l={d.fini ? 'Dresseur de la semaine vaincu' : d.wn + ' · Dresseur de la semaine'}
        eff="Équipe de la semaine · récompense unique · 2 000 ₽ et 5 Éclats"
      />
      {nl}
      <p>
        <b>Vitrine de reliques</b> · {d.nb}/{d.showcase.length}
        {d.nb >= 3 ? ' · +1 Éclat par victoire' : ''}
      </p>
      {nl}
      <div className="x2470-v">
        {d.showcase.map((v, i) => (
          <span key={i} className={'x2470-c' + (v.on ? ' on' : '')} title={v.on ? v.d : 'À trouver en Boss Rush'}>
            {v.on ? v.n : '???'}
          </span>
        ))}
      </div>
      {nl}
      {d.storyDone ? (
        <Choice
          k="x2470"
          v="inv"
          ok={!d.dayInv}
          l={d.dayInv ? 'Revanche faite aujourd’hui' : 'Ombres inversées · revanche de Vaskar'}
          eff="Plus dure : niveau 44 · 1 500 ₽ et 2 Éclats"
        />
      ) : (
        <p>La revanche de Vaskar se débloque après la fin de l’histoire des Ombres.</p>
      )}
      {nl}
      <p>
        <b>Entraînement de Ball</b> · record {d.ctBest}/10 · {d.ctRest} séance(s) restante(s) aujourd’hui
      </p>
      {nl}
      <Choice
        k="x2470"
        v="ct"
        l="Lancer une séance"
        eff="Cinq lancers : Éclat parfait 2 pts, bon 1 pt · 8 pts ou plus : Poké Ball et 200 ₽"
      />
      {nl}
    </Window>
  );
}
