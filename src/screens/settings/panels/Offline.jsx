import { OFFLINE_STATE, offlineSupported, chapterTracks } from '../../../engine/progression/chronicles.js';

import Button from '../../../components/Button.jsx';
// Offline mode (v4.62): music cached on the device.
// Buttons handled by the engine (delegated click on data-offline-pack).
export default function Offline() {
  const ok = offlineSupported(),
    n = OFFLINE_STATE.n,
    tot = chapterTracks().length,
    isReady = OFFLINE_STATE.status === 'prêt';
  const state =
    OFFLINE_STATE.status === 'chargement'
      ? `Téléchargement : ${n} / ${tot}…`
      : isReady
        ? `Musique hors ligne prête (${n} / ${tot} pistes).`
        : OFFLINE_STATE.status === 'erreur'
          ? 'Le téléchargement a échoué.'
          : 'Musique non téléchargée.';
  return (
    <section className="card" id="offline-panel">
      <h3 className="card-title">Mode hors ligne</h3>
      <p className="note">
        Le jeu et votre progression sont déjà sur votre appareil. Ce mode enregistre aussi la musique pour qu’elle joue
        sans connexion. Pour rouvrir le jeu sans réseau, enregistrez la page ou ajoutez-la à l’écran d’accueil depuis le
        menu du navigateur.
      </p>
      <p className="note">
        <b>{navigator.onLine === false ? 'Hors ligne' : 'En ligne'}</b>
        {` · ${state}${ok ? '' : ' Stockage indisponible sur cet appareil.'}`}
      </p>
      <div className="button-row">
        <Button
          size="small"
          variant={isReady ? undefined : 'primary'}
          data-offline-pack="dl"
          disabled={!(ok && OFFLINE_STATE.status !== 'chargement')}
        >
          {isReady ? 'Mettre à jour la musique' : 'Télécharger la musique'}
        </Button>
        <Button size="small" variant="ghost" data-offline-pack="rm" disabled={!isReady}>
          Supprimer
        </Button>
        <Button size="small" variant="ghost" data-offline-pack="jeu">
          Enregistrer le jeu
        </Button>
      </div>
    </section>
  );
}
