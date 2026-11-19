import { useEffect, useRef, useState } from 'react';

const LEAVE_MS = 740;

function launchSeen() {
  try { return !!sessionStorage.getItem('res-launch'); } catch { return false; }
}

// Remembers that the launch screen has been seen during this session.
function closeSplash() {
  try {
    sessionStorage.setItem('res-launch', '1');
    sessionStorage.setItem('res-splash', '1');
  } catch { /* Best effort: failure here is non-fatal. */ }
}

// Cinematic launch screen: only once per session.
export default function LaunchScreen({ engineReady }) {
  const [seen] = useState(launchSeen);
  const [phase, setPhase] = useState(seen ? 'gone' : 'shown'); // shown → leaving → gone
  const rootRef = useRef(null);

  useEffect(() => {
    if (phase === 'shown') rootRef.current?.querySelector('#resonance-enter')?.focus({ preventScroll: true });
    if (phase !== 'leaving') return;
    const t = setTimeout(() => {
      setPhase('gone');
      const first = document.getElementById('intro')?.querySelector('button,[tabindex="0"],input');
      first?.focus({ preventScroll: true });
    }, LEAVE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;

  const enter = () => {
    if (phase !== 'shown') return;
    closeSplash();
    document.body.classList.remove('resonance-launching');
    setPhase('leaving');
  };

  return (
    <div
      id="resonance-launch"
      ref={rootRef}
      className={phase === 'leaving' ? 'is-leaving' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Pokémon Résonance — écran de lancement"
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); enter(); } }}
    >
        <div className="rl-scene" aria-hidden="true" /><div className="rl-shade" aria-hidden="true" />
        <div className="rl-frame"><span className="rl-scroll">UNE NOUVELLE AVENTURE VOUS ATTEND</span>
          <div className="rl-copy"><p className="rl-kicker">KANTO · JOHTO · UNE AVENTURE VIVANTE</p><h1 className="rl-logo"><span className="v4-rl-pk">Pokémon</span><span className="v4-rl-res">Résonance</span><span className="v4-rl-live">Live your adventure</span></h1><p className="rl-desc">Partez à la découverte d’un monde vivant. Composez votre équipe, explorez les routes, maîtrisez les combats et écrivez votre propre légende.</p><button className="rl-enter" id="resonance-enter" type="button" onClick={enter}><span className="v4-rl-ic" aria-hidden="true"><svg><use href="#i-play" /></svg></span><span>Toucher pour commencer</span><svg className="v4-rl-ch" aria-hidden="true"><use href="#i-chevr" /></svg></button></div>
          <div className="rl-meta"><strong>LIVE YOUR ADVENTURE</strong>Pokémon Résonance · Édition cinématique</div>
        </div>
    </div>
  );
}
