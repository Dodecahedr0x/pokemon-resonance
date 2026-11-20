// Switch and slider of the Settings: same markup as the engine's SW() and SL().
// Uncontrolled fields: the engine listens to data-pref / data-vol at the document level.

// SW(k, on, lab, sub)
export function Switch({ k, on, lab, sub }) {
  return (
    <label className="settings-switch">
      <span>
        <b>{lab}</b>
        {sub ? <em>{sub}</em> : null}
      </span>
      <input type="checkbox" data-pref={k} defaultChecked={!!on} />
      <i aria-hidden="true" />
    </label>
  );
}

// SL(k, v, lab): volume from 0 to 1, displayed as a percentage.
export function Slider({ k, v, lab }) {
  const n = Math.round(v * 100);
  return (
    <label className="settings-slider">
      <span>{lab}</span>
      <input type="range" min="0" max="100" step="5" defaultValue={n} data-vol={k} aria-label={lab} />
      <b>{n} %</b>
    </label>
  );
}
