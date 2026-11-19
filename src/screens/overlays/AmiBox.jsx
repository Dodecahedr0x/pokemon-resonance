import { useOverlay } from './dialogsStore.js';
import { Dialogue } from './Fenetre.jsx';

// Défis entre amis (#amiBox) : ma carte de dresseur, ou ajout d'un ami.
// Le moteur (055) garde les clics (data-ami), la saisie (#amiNom met à jour #amiCode),
// le message d'erreur (#amiErr.textContent) et l'attribut hidden.
// Champs non contrôlés : le moteur relit et réécrit leur valeur.
export default function AmiBox() {
  const s = useOverlay('ami');
  return (
    <div className="result exp-box" id="amiBox" hidden>
      {s && (s.mode === 'carte' ? <MaCarte key={s.v} {...s} /> : <Ajout key={s.v} />)}
    </div>
  );
}

const FERMER = { 'data-ami': 'x' };

function MaCarte({ nom, code, equipe, partage }) {
  return (
    <Dialogue className="sv-card exp-card am-card" titre="amiT" fermer={FERMER}>
      <p className="kick">Défis entre amis</p>
      <h2 className="h2" id="amiT">Ma carte de dresseur</h2>
      <label className="am-lb">Votre nom<input type="text" id="amiNom" maxLength={14} defaultValue={nom} placeholder="Dresseur" autoComplete="off" /></label>
      {code ? (
        <>
          <p className="d">Votre équipe actuelle ({equipe.join(', ')}) et vos progrès tiennent dans ce code. Envoyez-le à vos amis : ils le collent dans « Ajouter un ami ».</p>
          <textarea id="amiCode" className="am-code" readOnly rows={4} defaultValue={code} />
          <div className="am-a">
            <button type="button" className="b b-gold" data-ami="copier">Copier le code</button>
            {partage && <button type="button" className="b" data-ami="partager">Partager</button>}
          </div>
          <p className="am-nt">Changez d’équipe ou progressez, puis renvoyez une nouvelle carte : vos amis verront la mise à jour.</p>
        </>
      ) : (
        <p className="d">Composez d’abord une équipe : c’est elle que vos amis affronteront.</p>
      )}
    </Dialogue>
  );
}

function Ajout() {
  return (
    <Dialogue className="sv-card exp-card am-card" titre="amiT" fermer={FERMER}>
      <p className="kick">Défis entre amis</p>
      <h2 className="h2" id="amiT">Ajouter un ami</h2>
      <p className="d">Collez ici le code que votre ami vous a envoyé (il commence par « RES- »). Si vous l’avez déjà, sa carte est mise à jour.</p>
      <textarea id="amiColle" className="am-code" rows={4} placeholder="RES-…" />
      <p className="am-err" id="amiErr" aria-live="polite" />
      <div className="am-a">
        <button type="button" className="b b-gold" data-ami="valider">Ajouter</button>
      </div>
    </Dialogue>
  );
}
