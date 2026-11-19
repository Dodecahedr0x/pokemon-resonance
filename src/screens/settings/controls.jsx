// Interrupteur et curseur des Paramètres : même balisage que SW() et SL() du moteur.
// Champs non contrôlés : le moteur écoute data-pref / data-vol au niveau du document.

// SW(k, on, lab, sub)
export function Switch({ k, on, lab, sub }) {
  return (
    <label className="v4-sw">
      <span><b>{lab}</b>{sub ? <em>{sub}</em> : null}</span>
      <input type="checkbox" data-pref={k} defaultChecked={!!on} />
      <i aria-hidden="true" />
    </label>
  );
}

// SL(k, v, lab) : volume de 0 à 1, affiché en pourcentage.
export function Slider({ k, v, lab }) {
  const n = Math.round(v * 100);
  return (
    <label className="v4-sl">
      <span>{lab}</span>
      <input type="range" min="0" max="100" step="5" defaultValue={n} data-vol={k} aria-label={lab} />
      <b>{n} %</b>
    </label>
  );
}
