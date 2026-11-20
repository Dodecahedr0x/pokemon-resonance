import Button from '../../../components/Button.jsx';
// Local duel (#duel433r, v4.33 · 068): relay screen between the two players, or
// abandon confirmation. The clicks (data-forfeit-dialog) stay in the engine.
export default function DuelRelay({ d }) {
  return (
    <div id="duel433r" className="duel-relay">
      {d.mode === 'abandon' ? (
        <div className={'duel-relay-card dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="forfeit-dialog-t">
          <p className="kicker">Duel local</p>
          <h2 className="title" id="forfeit-dialog-t">
            {d.displayName} abandonne ?
          </h2>
          <p className="lead">{d.other} remporte le duel.</p>
          <div className="duel-relay-actions">
            <Button variant="primary" data-forfeit-dialog="forfait">
              Déclarer forfait
            </Button>
            <Button variant="ghost" data-forfeit-dialog="non">
              Continuer le duel
            </Button>
          </div>
        </div>
      ) : (
        <div className={'duel-relay-card dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="forfeit-dialog-t">
          <p className="kicker">
            Manche {d.round} / {d.lim} · Joueur {d.j}
          </p>
          <h2 className="title" id="forfeit-dialog-t">
            Au tour de {d.displayName}
          </h2>
          <p className="lead">{d.sub}</p>
          <div className="duel-relay-scores">
            {d.s.map(x => (
              <span key={x.j} className={'dj' + x.j}>
                <b>{x.displayName}</b>
                {x.pv} % PV · {x.n} Pokémon
              </span>
            ))}
          </div>
          <Button size="large" variant="primary" data-forfeit-dialog="go">
            C’est parti
          </Button>
        </div>
      )}
    </div>
  );
}
