import { useEffect, useState } from 'react';
import { useEngineReady } from '../../engineReady.js';
import { setGuideTab, useGuide } from './guideStore.js';
import Bases from './Bases.jsx';
import Debuter from './Debuter.jsx';
import Ligue from './Ligue.jsx';
import Projet from './Projet.jsx';
import Reactions from './Reactions.jsx';
import Tactique from './Tactique.jsx';
import Tutoriel from './Tutoriel.jsx';
import Univers from './Univers.jsx';
import Tip from '../../components/Tip.jsx';

// Onglets visibles, dans l'ordre de la barre (« Projet » n'a pas d'onglet : on l'ouvre par lien).
const ONGLETS = [
  ['debuter', 'Débuter'],
  ['tuto433', 'Tutoriel'],
  ['bases', 'Combat'],
  ['reactions', 'Types'],
  ['tactique', 'Équipe'],
  ['ligue', 'Ligue'],
  ['univers', 'Univers'],
];

// Panneaux, dans l'ordre du DOM. `lazy` : rendu seulement une fois l'onglet ouvert.
const PANNEAUX = [
  { k: 'tuto433', C: Tutoriel, lazy: true },
  { k: 'debuter', C: Debuter },
  { k: 'bases', C: Bases },
  { k: 'reactions', C: Reactions },
  { k: 'tactique', C: Tactique, lazy: true },
  { k: 'ligue', C: Ligue },
  { k: 'univers', C: Univers, lazy: true },
  { k: 'projet', C: Projet },
];

// Écran Guide (#types). La classe « on » de la section est posée par la navigation du moteur.
export default function Guide() {
  const ready = useEngineReady();
  const { tab } = useGuide();
  const [ouverts, setOuverts] = useState(() => new Set([tab]));
  useEffect(() => {
    setOuverts(s => (s.has(tab) ? s : new Set(s).add(tab)));
  }, [tab]);

  return (
    <section className="page" id="types" aria-labelledby="h-ty">
      <div className="ph">
        <p className="kick">Guide du dresseur</p>
        <h1 className="h1" id="h-ty">Guide du dresseur</h1>
        <p className="sub">Commencez par « Débuter » : cinq étapes suffisent pour gagner votre premier combat.</p>
      </div>
      <Tip t="types" />
      <div className="gd-tabs" role="tablist" aria-label="Rubriques du guide">
        {ONGLETS.map(([k, label]) => (
          <button key={k} type="button" role="tab" className="gd-t" aria-selected={String(tab === k)} onClick={() => setGuideTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {PANNEAUX.map(({ k, C, lazy }) => (
        <div key={k} className="gd-p" data-gp={k} role="tabpanel" hidden={tab !== k}>
          {ready && (!lazy || ouverts.has(k) || tab === k) && <C />}
        </div>
      ))}
    </section>
  );
}
