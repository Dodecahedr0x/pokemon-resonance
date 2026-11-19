import { TYPES } from '../../../engine/004-01-donnees.js';
import { BY } from '../../../engine/009-03-pokemon.js';
import { PROFILE, isCamp } from '../../../engine/011-05-etat-de-partie.js';
import { DEFIS, DEFI_CONF } from '../../../engine/048-v4-9-01-rejouabilite.js';

// Interrupteur d'un défi (data-defi, géré par le moteur).
function Defi({ k, on }) {
  return (
    <label className="v4-sw">
      <span><b>{DEFIS[k][0]}</b><em>{DEFIS[k][1]}</em></span>
      <input type="checkbox" data-defi={k} defaultChecked={!!on} />
      <i aria-hidden="true" />
    </label>
  );
}

// Défis de campagne (defisHtml) : mono-type, équipe de 3, sans Éveil, Nuzlocke.
export default function DefisCampagne() {
  if (!isCamp())
    return (
      <section className="v4-panel v4-ps">
        <header className="v4-ph"><svg><use href="#i-trophy" /></svg><b>Défis de campagne</b></header>
        <p className="v4-ps-n">Les défis se jouent en Campagne.</p>
      </section>
    );
  const d = PROFILE.defis || {},
    tomb = (PROFILE.tombes || []).filter(b => BY[b]);
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph"><svg><use href="#i-trophy" /></svg><b>Défis de campagne</b></header>
      <p className="v4-ps-n">Chaque défi actif rapporte 1 Éclat par victoire, 4 par nouveau badge.</p>
      <label className="v4-fld"><span>Mono-type</span><select data-defi="mono" aria-label="Mono-type" defaultValue={d.mono || ''}>
        <option value="">Aucun</option>
        {Object.keys(TYPES).map(t => <option key={t} value={t}>{t}</option>)}
      </select></label>
      <Defi k="trio" on={d.trio} />
      <Defi k="sansEveil" on={d.sansEveil} />
      <div className="v4-sw nz"><span><b>Nuzlocke</b><em>{DEFIS.nuzlocke[1]}</em></span>{
        d.nuzlocke
          ? <button type="button" className="b b-sm b-ghost" data-nz="stop">Abandonner</button>
          : DEFI_CONF
            ? <span className="nz-c"><button type="button" className="b b-sm b-gold" data-nz="ok">Confirmer</button><button type="button" className="b b-sm b-ghost" data-nz="non">Annuler</button></span>
            : <button type="button" className="b b-sm" data-nz="on">Activer</button>
      }</div>
      {DEFI_CONF && !d.nuzlocke ? <p className="v4-ps-n nz-w">Attention : chaque Pokémon mis K.O. ne pourra plus combattre de toute la campagne. Confirmez pour commencer.</p> : null}
      {tomb.length ? <p className="v4-ps-n">Tombés au combat : {tomb.map(b => BY[b].n).join(', ')}{d.nuzlocke ? '' : ' (le Nuzlocke est abandonné : ils peuvent revenir)'}.</p> : null}
    </section>
  );
}
