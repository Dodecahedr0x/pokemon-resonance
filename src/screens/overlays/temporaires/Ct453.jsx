// Jauge de capture avec timing (#ct453, v4.53 · timing453 dans 083). Le moteur anime
// l'anneau (.ct453-g, style.transform à chaque image) et pose ses écouteurs sur le nœud ;
// `q` (résultat) change le texte et la classe.
const TXT = { perfect: 'Parfait !', ok: 'Bien joué !', skip: 'Lancer direct', miss: 'Trop tôt ou trop tard…' };

export default function Ct453({ d }) {
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
