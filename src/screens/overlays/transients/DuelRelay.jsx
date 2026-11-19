// Local duel (#duel433r, v4.33 · 068): relay screen between the two players, or
// abandon confirmation. The clicks (data-forfeit-dialog) stay in the engine.
export default function DuelRelay({ d }) {
  return (
    <div id="duel433r" className="forfeit-dialog">
      {d.mode === 'abandon' ? (
        <div className={'forfeit-dialog-c dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="forfeit-dialog-t">
          <p className="kick">Duel local</p>
          <h2 className="h1" id="forfeit-dialog-t">
            {d.displayName} abandonne ?
          </h2>
          <p className="sub">{d.other} remporte le duel.</p>
          <div className="forfeit-dialog-a">
            <button type="button" className="b b-gold" data-forfeit-dialog="forfait">
              Déclarer forfait
            </button>
            <button type="button" className="b b-ghost" data-forfeit-dialog="non">
              Continuer le duel
            </button>
          </div>
        </div>
      ) : (
        <div className={'forfeit-dialog-c dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="forfeit-dialog-t">
          <p className="kick">
            Manche {d.round} / {d.lim} · Joueur {d.j}
          </p>
          <h2 className="h1" id="forfeit-dialog-t">
            Au tour de {d.displayName}
          </h2>
          <p className="sub">{d.sub}</p>
          <div className="forfeit-dialog-s">
            {d.s.map(x => (
              <span key={x.j} className={'dj' + x.j}>
                <b>{x.displayName}</b>
                {x.pv} % PV · {x.n} Pokémon
              </span>
            ))}
          </div>
          <button type="button" className="b b-gold b-lg" data-forfeit-dialog="go">
            C’est parti
          </button>
        </div>
      )}
    </div>
  );
}
