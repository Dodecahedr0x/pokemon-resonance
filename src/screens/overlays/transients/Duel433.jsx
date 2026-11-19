// Duel local (#duel433r, v4.33 · 068) : écran de relais entre les deux joueurs, ou
// confirmation d'abandon. Les clics (data-dr433) restent dans le moteur.
export default function Duel433({ d }) {
  return (
    <div id="duel433r" className="dr433">
      {d.mode === 'abandon' ? (
        <div className={'dr433-c dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="dr433T">
          <p className="kick">Duel local</p>
          <h2 className="h1" id="dr433T">{d.nom} abandonne ?</h2>
          <p className="sub">{d.autre} remporte le duel.</p>
          <div className="dr433-a">
            <button type="button" className="b b-gold" data-dr433="forfait">Déclarer forfait</button>
            <button type="button" className="b b-ghost" data-dr433="non">Continuer le duel</button>
          </div>
        </div>
      ) : (
        <div className={'dr433-c dj' + d.j} role="dialog" aria-modal="true" aria-labelledby="dr433T">
          <p className="kick">Manche {d.round} / {d.lim} · Joueur {d.j}</p>
          <h2 className="h1" id="dr433T">Au tour de {d.nom}</h2>
          <p className="sub">{d.sub}</p>
          <div className="dr433-s">
            {d.s.map(x => (
              <span key={x.j} className={'dj' + x.j}><b>{x.nom}</b>{x.pv} % PV · {x.n} Pokémon</span>
            ))}
          </div>
          <button type="button" className="b b-gold b-lg" data-dr433="go">C’est parti</button>
        </div>
      )}
    </div>
  );
}
