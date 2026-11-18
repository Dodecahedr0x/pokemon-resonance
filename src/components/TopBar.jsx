import { useShell } from './shellStore.js';
import { PROFILE, isCamp } from '../engine/011-05-etat-de-partie.js';
import { gp, tc } from '../engine/014-08-outils.js';
import { fmt, tLevel } from '../engine/032-v4-00-socle.js';
import { titreAffiche } from '../engine/048-v4-9-01-rejouabilite.js';
import { AVT450 } from '../engine/080-v4-50-avatar-de-dresseur-rencontres-rares-heure.js';

// Titre de la page affichée (show()).
export function TbSec() {
  const { sec } = useShell();
  return <span className="tb-sec" id="tbSec">{sec}</span>;
}

// Bouton Sauvegardes : voyant « en cours » et « compte » (svIndicator).
export function TbSave() {
  const { svBusy, svCloud } = useShell();
  return (
    <button type="button" className={'tb-save' + (svBusy ? ' busy' : '') + (svCloud ? ' cloud' : '')} id="tbSave" aria-label="Sauvegardes"><svg><use href="#i-save" /></svg><i /></button>
  );
}

// Emblème du dresseur : initiale, ou pastille du type choisi (v4.50).
function Avatar() {
  const ini = (PROFILE.name || 'D').trim().charAt(0).toUpperCase() || 'D';
  const a = AVT450();
  if (!a) return <span className="v4-av" id="v4Av">{ini}</span>;
  const c = tc(a.e);
  const style = { background: `radial-gradient(circle at 35% 30%,color-mix(in srgb,${c} 55%,#fff),${c} 62%,color-mix(in srgb,${c} 45%,#000))` };
  if (a.hex) style.borderRadius = '30%';
  style.position = 'relative';
  return (
    <span className="v4-av" id="v4Av" data-k450={a.e + ini + (a.hex ? 'h' : '')} style={style}>
      <b style={{ font: '900 15px/1 var(--f-d)' }}>{ini}</b>
      <svg viewBox="0 0 24 24" width={11} height={11} style={{ position: 'absolute', right: '-1px', bottom: '-1px', filter: 'drop-shadow(0 1px 2px #000)' }}><path d={gp(a.e)} fill="#fff" fillRule="evenodd" /></svg>
    </span>
  );
}

// Barre du haut (v4-03) : dresseur, Pokédollars, Éclats, réglages. Redessinée par renderWallet().
export function TopTrainer() {
  const { wallet } = useShell();
  const on = wallet > 0; // avant le premier renderWallet : gabarit vide, comme l'ancien moteur
  return (
    <div className="v4-tb">
      <a className="v4-trainer" data-t="params" href="#params" aria-label="Profil du dresseur">{on ? <Avatar /> : <span className="v4-av" id="v4Av" />}<span className="v4-tr-t"><b id="v4Name">{on ? PROFILE.name || 'Dresseur' : null}</b><em id="v4Lvl">{on ? `${titreAffiche() || (isCamp() ? 'Campagne' : 'Mode Libre')} · Nv. ${tLevel()}` : null}</em></span></a>
      <a className="v4-wal" data-t="sac" href="#sac" aria-label="Pokédollars"><span className="v4-coin" aria-hidden="true">₽</span><b id="v4Money">{on ? fmt(PROFILE.money || 0) : '0'}</b></a>
      <a className="v4-wal gem" data-t="sac" href="#sac" aria-label="Éclats de Résonance"><span className="v4-gemi" aria-hidden="true"><svg><use href="#i-gem" /></svg></span><b id="v4Gems">{on ? fmt(PROFILE.gems || 0) : '0'}</b></a>
      <a className="v4-gear" data-t="params" href="#params" aria-label="Paramètres"><svg><use href="#i-gear" /></svg></a>
    </div>
  );
}
