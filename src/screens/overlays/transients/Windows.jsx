// Petites fenêtres « hp452 » (cadre commun : titre, bouton ×, corps .hp452-b).
// Les clics restent dans le moteur (écouteurs délégués data-b452, data-ev454…) ; le clic
// sur le fond est posé par le moteur sur le nœud renvoyé par overlay().

// Cadre commun. `k` : nom de l'attribut data-… du bouton de fermeture.
export function Window({ id, tid, k, titre: heading, children }) {
  return (
    <div id={id} className="hp452">
      <div className="hp452-c" role="dialog" aria-modal="true" aria-labelledby={tid}>
        <header>
          <h3 id={tid}>{heading}</h3>
          <button type="button" className="sh-x" {...{ ['data-' + k]: 'close' }} aria-label="Fermer">×</button>
        </header>
        <div className="hp452-b">{children}</div>
      </div>
    </div>
  );
}

// Bouton de choix (.ev454-c) : libellé, détail (<small>) si `eff` n'est pas null.
function Choice({ k, v, ok = true, l, eff = null }) {
  return (
    <button type="button" className="ev454-c" {...{ ['data-' + k]: v }} disabled={!ok}>
      <b>{l}</b>
      {eff != null ? <small>{eff}</small> : null}
    </button>
  );
}

// Aide du combat (#hp452, v4.52 · aide452 dans 082).
export function Help452({ d }) {
  return (
    <Window id="hp452" tid="hp452t" k="b452" titre="Aide du combat">
      {d.sel && (
        <section>
          <h4>{d.sel.n} · votre sélection</h4>
          {d.sel.roles.map(([r, fx], i) => (
            <p key={i}><b>{r}</b>{fx ? ` (${fx[0]}) : ${fx[1]}` : ''}</p>
          ))}
          {d.sel.tal && <p><b>Talent · {d.sel.tal[0]}.</b> {d.sel.tal[1]}</p>}
        </section>
      )}
      {d.terr.length > 0 && (
        <section>
          <h4>Sur ce plateau</h4>
          {d.terr.map(([n, t], i) => (
            <p key={i}><b>{n}.</b> {t}</p>
          ))}
        </section>
      )}
      {d.wx && (
        <section>
          <h4>Météo · {d.wx.n} ({d.wx.tours} manches)</h4>
          <p>{d.wx.d}</p>
        </section>
      )}
      <section>
        <h4>Réactions</h4>
        <details>
          <summary>Voir les {d.rx.length} réactions</summary>
          {d.rx.map(([n, t], i) => (
            <p key={i}><b>{n}.</b> {t}</p>
          ))}
        </details>
      </section>
      <section><h4>Astuces</h4><p>Un appui long sur une case (ou la loupe) donne son détail : terrain, dangers et Pokémon présent.</p></section>
    </Window>
  );
}

// Rencontre sur la route (#evs454, v4.54) ; `res` : issue après un choix (evPick454).
export function Ev454({ d }) {
  return (
    <Window id="evs454" tid="evt454" k="ev454" titre={d.t}>
      {d.res ? (
        <>
          <p><b>{d.res.ok ? 'Bonne nouvelle' : 'Pas de chance'}</b></p>
          <p>{d.res.txt}</p>
          <Choice k="ev454" v="close" l="Continuer" />
        </>
      ) : (
        <>
          <p>{d.x}</p>
          {d.c.map((c, j) => <Choice key={j} k="ev454" v={j} {...c} />)}
        </>
      )}
    </Window>
  );
}

// Lieu secret de la carte (#sc460, v4.60).
export function Sc460({ d }) {
  return (
    <Window id="sc460" tid="sct460" k="sc460" titre={d.n}>
      <p>{d.lore}</p>
      <p><b>{d.msg}</b></p>
      <Choice k="sc460" v="close" l="Continuer" />
    </Window>
  );
}

// Personnage de passage (#pn460, v4.60) ; `res` : réponse après un choix (pnPick460).
export function Pn460({ d }) {
  return (
    <Window id="pn460" tid="pnt460" k="pn460" titre={d.n}>
      {d.res != null ? (
        <>
          <p>{d.res}</p>
          <Choice k="pn460" v="close" l="Continuer" />
        </>
      ) : (
        <>
          <p>{d.x}</p>
          {d.c.map((c, j) => <Choice key={j} k="pn460" v={j} {...c} />)}
        </>
      )}
    </Window>
  );
}

// Souvenirs du compagnon (#souv461, v4.61) : un souvenir par cœur.
export function Souv461({ d }) {
  return (
    <Window id="souv461" tid="souvt461" k="cp461" titre={'Souvenirs de ' + d.n}>
      {d.rows.map((t, k) => {
        const i = k + 1;
        return t != null ? (
          <p key={i}><b>{'♥'.repeat(i)}</b> {t}</p>
        ) : (
          <p key={i} className="cp461-l"><b>{'♥'.repeat(i)}</b> Un souvenir se débloquera à {i} cœur{i > 1 ? 's' : ''}.</p>
        );
      })}
      <Choice k="cp461" v="close" l="Fermer" />
    </Window>
  );
}

// Événement saisonnier du mois (#sa465o, v4.65).
export function Sa465({ d }) {
  return (
    <Window id="sa465o" tid="sat465" k="sa465" titre={d.n}>
      <p>{d.d}</p>
      <p><b>Bonus du mois :</b> vos Pokémon de type {d.t} infligent +5 % de dégâts.</p>
      <p><b>Points :</b> 1 par victoire, +1 avec un Pokémon {d.t} dans l’équipe, +2 dans le combat vedette : {d.arene}.</p>
      {d.tiers.map((x, i) => (
        <article key={i} className="v4-it">
          <div className="v4-it-t"><b>{x.n} · {x.p} pts</b><p>{x.txt}</p></div>
          <div className="v4-buy">
            <button type="button" className="v4-btn" data-sa465={i} disabled={!(x.ok && !x.got)}>{x.got ? 'Reçu' : x.ok ? 'Récupérer' : 'Verrouillé'}</button>
          </div>
        </article>
      ))}
      <p className="v4-note">Saisons complétées : {d.won}. L’événement change chaque mois.</p>
    </Window>
  );
}

// Boss Rush (#br466o, v4.66) : verrouillé, avant un run, ou run en cours.
export function Br466({ d }) {
  return (
    <Window id="br466o" tid="brt466" k="br466" titre="Boss Rush">
      {d.mode === 'lock' ? (
        <p>Le Boss Rush se débloque avec 5 badges.</p>
      ) : d.mode === 'new' ? (
        <>
          <p>Enchaînez <b>5 boss</b> d’arène à la suite avec la même équipe. Vos PV ne se régénèrent pas entre les combats, et un Pokémon tombé ne revient pas. Après chaque boss, choisissez <b>une relique</b> parmi trois. Record : <b>{d.best}</b> · terminés : <b>{d.won}</b>.</p>
          <Choice k="br466" v="start" l="Commencer un run" eff={'Équipe actuelle · ' + d.equipe} />
        </>
      ) : (
        <>
          <p>Boss <b>{d.i + 1} / {d.total}</b> · {d.eq}</p>
          {d.rel.length > 0 && <p><b>Reliques :</b> {d.rel.join(', ')}</p>}
          {d.pend ? (
            <>
              <p><b>Choisissez une relique :</b></p>
              {d.pend.map(r => <Choice key={r.id} k="br466" v={'rel:' + r.id} l={r.n} eff={r.d} />)}
            </>
          ) : (
            <Choice k="br466" v="go" l={`Lancer le boss ${d.i + 1} : ${d.boss}`} />
          )}
          <button type="button" className="b b-sm b-ghost" data-br466="abandon">Abandonner le run</button>
        </>
      )}
    </Window>
  );
}

// Arène de défense (#df468o, v4.68).
export function Df468({ d }) {
  return (
    <Window id="df468o" tid="dft468" k="df468" titre="Arène de défense">
      <p>{d.d}</p>
      <p>Record : <b>{d.best}</b> vague{d.best > 1 ? 's' : ''} · défenses réussies : <b>{d.won}</b>.</p>
      {d.ok ? <Choice k="df468" v="go" l="Défendre" eff="Votre équipe actuelle · récompenses selon les vies restantes" /> : <p>Débloquée avec 3 badges.</p>}
    </Window>
  );
}

// Hub « Défis » (#x470o, v4.71 · 103). Les retours à la ligne du gabarit d'origine sont gardés.
export function X470({ d }) {
  const nl = '\n';
  return (
    <Window id="x470o" tid="x470t" k="x470" titre="Défis du jour">
      {nl}
      {d.omb.fin ? (
        <p><b>Les Ombres de Résonance</b> · histoire terminée</p>
      ) : (
        <>
          <p><b>Les Ombres de Résonance</b> · épisode {d.omb.e + 1}/4</p>
          <Choice k="x470" v="omb" ok={d.omb.dispo} l={d.omb.dispo ? d.omb.titre : 'Épisode verrouillé'} eff={d.omb.dispo ? 'Affronter les Ombres · récompense et suite de l’histoire' : d.omb.req} />
        </>
      )}
      {nl}
      <p><b>Défi quotidien</b> · type interdit : <b>{d.interdit}</b> · série {d.streak} (record {d.best}, {d.tot} réussis)</p>
      {nl}
      <Choice k="x470" v="dq" ok={!d.fait} l={d.fait ? 'Défi du jour réussi' : 'Lancer le défi du jour'} eff="Récompense : argent, Éclats et un spécimen ancien" />
      {nl}
      <p><b>Laboratoire</b> · spécimens anciens : {d.fos}</p>
      {nl}
      <Choice k="x470" v="rev" ok={!(d.fos < 1 || !d.libres)} l="Ressusciter un spécimen" eff={d.libres ? 'Consomme 1 spécimen · espèce rare au hasard' : 'Toutes les espèces rares sont déjà à vous'} />
      {nl}
      <p><b>Prestige</b> · niveau {d.pre.n}{d.pre.on ? ' (actif)' : ''}</p>
      {nl}
      {d.preOk ? (
        <>
          <Choice k="x470" v="pre+" ok={d.pre.n < 5} l="Monter de niveau" eff="Adversaires +2 PV par niveau · +150 ₽ par niveau à chaque victoire" />
          <Choice k="x470" v="pre" l={(d.pre.on ? 'Désactiver' : 'Activer') + ' le prestige'} />
        </>
      ) : (
        <p>Débloqué avec 8 badges ou la Ligue.</p>
      )}
      {nl}
    </Window>
  );
}

// Hub « Plus de défis » (#x2470o, v4.71 · 104). Retours à la ligne du gabarit d'origine gardés.
export function X2470({ d }) {
  const nl = '\n';
  return (
    <Window id="x2470o" tid="x2470t" k="x2470" titre="Défis de dresseur">
      {nl}
      <p><b>Rivalité</b></p>
      {d.lignes.map((t, i) => <p key={i} className="x2470-r">{t}</p>)}
      {nl}
      <p><b>Météo du jour</b> · {d.meteo} · {d.bonus}</p>
      {nl}
      <Choice k="x2470" v="wk" ok={!d.fini} l={d.fini ? 'Dresseur de la semaine vaincu' : d.wn + ' · Dresseur de la semaine'} eff="Équipe de la semaine · récompense unique · 2 000 ₽ et 5 Éclats" />
      {nl}
      <p><b>Vitrine de reliques</b> · {d.nb}/{d.vitrine.length}{d.nb >= 3 ? ' · +1 Éclat par victoire' : ''}</p>
      {nl}
      <div className="x2470-v">
        {d.vitrine.map((v, i) => (
          <span key={i} className={'x2470-c' + (v.on ? ' on' : '')} title={v.on ? v.d : 'À trouver en Boss Rush'}>{v.on ? v.n : '???'}</span>
        ))}
      </div>
      {nl}
      {d.histoireFinie ? (
        <Choice k="x2470" v="inv" ok={!d.jourInv} l={d.jourInv ? 'Revanche faite aujourd’hui' : 'Ombres inversées · revanche de Vaskar'} eff="Plus dure : niveau 44 · 1 500 ₽ et 2 Éclats" />
      ) : (
        <p>La revanche de Vaskar se débloque après la fin de l’histoire des Ombres.</p>
      )}
      {nl}
      <p><b>Entraînement de Ball</b> · record {d.ctBest}/10 · {d.ctRest} séance(s) restante(s) aujourd’hui</p>
      {nl}
      <Choice k="x2470" v="ct" l="Lancer une séance" eff="Cinq lancers : Éclat parfait 2 pts, bon 1 pt · 8 pts ou plus : Poké Ball et 200 ₽" />
      {nl}
    </Window>
  );
}
