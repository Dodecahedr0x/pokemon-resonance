// Capture gauge with timing (#ct453, v4.53 · timing453 in 083). The engine animates
// the ring (.ct453-g, style.transform at each frame) and attaches its listeners to the node;
// `q` (result) changes the text and the class.
const TXT = { perfect: 'Parfait !', ok: 'Bien joué !', skip: 'Lancer direct', miss: 'Trop tôt ou trop tard…' };

export default function Tm453({ d }) {
  return (
    <div id="ct453" role="dialog" aria-label="Lancer la Ball : touchez au bon moment" className={d.q ? 'res-' + d.q : undefined}>
      <div className="ct453-c">
        <p className="ct453-t">{d.q ? TXT[d.q] : 'Touchez quand l’anneau touche la cible'}</p>
        <div className="ct453-r"><i className="ct453-z" /><i className="ct453-g" /><i className="ct453-d" /></div>
        <button type="button" className="b b-gold ct453-b">Lancer !</button>
        <button type="button" className="ct453-s">Passer le timing</button>
      </div>
    </div>
  );
}
