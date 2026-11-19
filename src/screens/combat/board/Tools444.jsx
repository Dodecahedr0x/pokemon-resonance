// Board toolbar (v4.44): fullscreen, magnifier, high-contrast board, help.
// Large screen: corner of the board (#bBoard); phone: in the bottom bar (.bt-foot).
// State set by bar444 (engine, 077) in getHost().bt444; delegated engine clicks.

const IC = {
  fs: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  fsx: 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5',
  lp: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.3 15.3 20 20',
  ct: 'M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18'
};

function Ico({ d, full: fullAmount }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {fullAmount && <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />}
    </svg>
  );
}

export default function Tools444({ b }) {
  const fsT = b.fs ? 'Quitter le plein écran' : 'Plein écran';
  return (
    <div id="bt444" className={'bt444' + (b.foot ? ' in-foot' : '')}>
      <button type="button" data-b444="fs" className={b.fs ? 'on' : ''} aria-pressed={b.fs} aria-label={fsT} title={fsT}>
        <Ico d={b.fs ? IC.fsx : IC.fs} />
      </button>
      <button type="button" data-b444="lp" className={b.lp ? 'on' : ''} aria-pressed={b.lp} aria-label="Loupe : lire le détail d’une case" title="Loupe : touchez une case pour lire son détail (ou appui long)">
        <Ico d={IC.lp} />
      </button>
      <button type="button" data-b444="ct" className={b.ct ? 'on' : ''} aria-pressed={b.ct} aria-label="Plateau contrasté" title="Plateau contrasté">
        <Ico d={IC.ct} full />
      </button>
      <button type="button" data-b452="help" aria-label="Aide du combat" title="Aide : ce qui compte maintenant" style={{ font: '800 17px/1 var(--f-d)' }}>
        ?
      </button>
    </div>
  );
}
