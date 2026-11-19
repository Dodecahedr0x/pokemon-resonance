import { useEngineReady } from '../../engineReady.js';
import { useQuetesVersion } from './quetesStore.js';
import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/004-01-donnees.js';
import { PROFILE } from '../../engine/011-05-etat-de-partie.js';
import { BADGES } from '../../engine/013-07-arenes.js';
import { badgeSvg } from '../../engine/019-12-ligue.js';
import { V4, trophies } from '../../engine/032-v4-00-socle.js';
import { SQ } from '../../engine/039-v4-07-quetes-boutique.js';
import Principale from './Principale.jsx';
import Secondaires from './Secondaires.jsx';
import Evenement from './Evenement.jsx';
import Legendes from './Legendes.jsx';
import Journal from './Journal.jsx';
import Succes from './Succes.jsx';

const NL = '\n ';

// Contenu de l'onglet choisi (V4.qTab) ; tout autre valeur affiche l'onglet Événement.
function Onglet() {
  if (V4.qTab === 'main') return <Principale />;
  if (V4.qTab === 'side') return <Secondaires />;
  if (V4.qTab === 'succes') return <Succes />; // succès et titres (v4.9)
  if (V4.qTab === 'leg') return <Legendes />; // v4.29
  if (V4.qTab === 'journal') return <Journal />; // v4.30
  return <Evenement />;
}

function Contenu() {
  const ready = SQ.filter(q => !PROFILE.qc[q.id] && q.v() >= q.n).length;
  const tabs = [
    ['main', 'Principale'],
    ['side', <>Secondaires{ready ? <> <i className="v4-dot">{ready}</i></> : null}</>],
    ['event', 'Événement'],
    ['leg', 'Légendes'], // quêtes légendaires (v4.29)
    ['journal', 'Journal'], // journal tactique (v4.30)
    ['succes', 'Succès'] // v4.9
  ];
  return (
    <>
      <div className="ph v4-ph-page"><p className="kick">Aventure</p><h1 className="h1" id="h-quetes">Quêtes</h1><p className="sub">Suivez les chapitres, relevez les défis et réclamez vos récompenses.</p></div>
      {NL}
      <div className="v4-trophy v4-panel">
        <div className="v4-tr-b">
          {GYMS.map((g, i) => (
            <span key={i} className={'v4-tbg' + (BADGES.includes(i) ? ' on' : '')} title={`Badge ${g.t}`}><Html html={badgeSvg(i, g.t, 'qt' + i)} /></span>
          ))}
        </div>
        <div className="v4-tr-k">
          <div><b>{trophies()}</b><span>Trophées / 31</span></div>
          <div><b>{SQ.filter(q => PROFILE.qc[q.id]).length}</b><span>Secondaires / {SQ.length}</span></div>
          <div><b>{PROFILE.wins}</b><span>Victoires</span></div>
        </div>
      </div>
      {NL}
      <div className="v4-tabs" role="tablist">
        {tabs.map(([k, n]) => (
          <button key={k} type="button" role="tab" data-qtab={k} aria-selected={V4.qTab === k}>{n}</button>
        ))}
      </div>
      {NL}
      <div className="v4-qlist"><Onglet /></div>
    </>
  );
}

// Page Quêtes (#quetes). Rien n'est rendu avant le premier renderQuests() du moteur ; chaque
// renderQuests() reconstruit le contenu (gestionnaires délégués dans le moteur : data-qtab,
// data-claim, data-v4fight, data-titre…).
export default function Quetes() {
  const ready = useEngineReady();
  const version = useQuetesVersion();
  return (
    <section className="page v4p" id="quetes" aria-labelledby="h-quetes">
      {ready && version > 0 && <Contenu key={version} />}
    </section>
  );
}
