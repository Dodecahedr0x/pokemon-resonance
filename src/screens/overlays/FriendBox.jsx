import { useOverlay } from './dialogsStore.js';
import { Dialogue } from './Window.jsx';

import Button from '../../components/Button.jsx';
// Friend challenges (#amiBox): my trainer card, or adding a friend.
// The engine (055) keeps the clicks (data-ami), the input (#amiNom updates #amiCode),
// the error message (#amiErr.textContent) and the hidden attribute.
// Uncontrolled fields: the engine rereads and rewrites their value.
export default function FriendBox() {
  const s = useOverlay('ami');
  return (
    <div className="modal is-raised" id="amiBox" hidden>
      {s && (s.mode === 'carte' ? <MyCard key={s.v} {...s} /> : <Addition key={s.v} />)}
    </div>
  );
}

const CLOSE = { 'data-ami': 'x' };

function MyCard({ displayName: displayName, code, teamNames: team, canShare: sharing }) {
  return (
    <Dialogue className="dialog-card is-compact friend-card" titre="amiT" closeAttrs={CLOSE}>
      <p className="kicker">Défis entre amis</p>
      <h2 className="section-title" id="amiT">
        Ma carte de dresseur
      </h2>
      <label className="friend-label">
        Votre nom
        <input
          type="text"
          id="amiNom"
          maxLength={14}
          defaultValue={displayName}
          placeholder="Dresseur"
          autoComplete="off"
        />
      </label>
      {code ? (
        <>
          <p className="d">
            Votre équipe actuelle ({team.join(', ')}) et vos progrès tiennent dans ce code. Envoyez-le à vos amis : ils
            le collent dans « Ajouter un ami ».
          </p>
          <textarea id="amiCode" className="friend-code" readOnly rows={4} defaultValue={code} />
          <div className="friend-actions">
            <Button variant="primary" data-ami="copier">
              Copier le code
            </Button>
            {sharing && <Button data-ami="partager">Partager</Button>}
          </div>
          <p className="friend-note">
            Changez d’équipe ou progressez, puis renvoyez une nouvelle carte : vos amis verront la mise à jour.
          </p>
        </>
      ) : (
        <p className="d">Composez d’abord une équipe : c’est elle que vos amis affronteront.</p>
      )}
    </Dialogue>
  );
}

function Addition() {
  return (
    <Dialogue className="dialog-card is-compact friend-card" titre="amiT" closeAttrs={CLOSE}>
      <p className="kicker">Défis entre amis</p>
      <h2 className="section-title" id="amiT">
        Ajouter un ami
      </h2>
      <p className="d">
        Collez ici le code que votre ami vous a envoyé (il commence par « RES- »). Si vous l’avez déjà, sa carte est
        mise à jour.
      </p>
      <textarea id="amiColle" className="friend-code is-paste" rows={4} placeholder="RES-…" />
      <p className="friend-error" id="amiErr" aria-live="polite" />
      <div className="friend-actions">
        <Button variant="primary" data-ami="valider">
          Ajouter
        </Button>
      </div>
    </Dialogue>
  );
}
