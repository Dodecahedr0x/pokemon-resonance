import { useShell } from './shellStore.js';
import { PROFILE, isCamp } from '../engine/state/game-state.js';
import { gp, tc } from '../engine/core/utils.js';
import { fmt } from '../engine/state/economy.js';
import { tLevel } from '../engine/progression/trainer-stats.js';
import { displayedTitle } from '../engine/progression/achievements.js';
import { TRAINER_AVATAR } from '../engine/world/rare-encounters.js';

// Title of the displayed page (show()).
export function TbSec() {
  const { sec } = useShell();
  return (
    <span className="tb-sec" id="tbSec">
      {sec}
    </span>
  );
}

// Saves button: "in progress" indicator and "account" (svIndicator).
export function TbSave() {
  const { saveBusy: svBusy, saveCloud: svCloud } = useShell();
  return (
    <button
      type="button"
      className={'tb-save' + (svBusy ? ' busy' : '') + (svCloud ? ' cloud' : '')}
      id="tbSave"
      aria-label="Sauvegardes"
    >
      <svg>
        <use href="#i-save" />
      </svg>
      <i />
    </button>
  );
}

// Trainer emblem: initial, or chip of the chosen type (v4.50).
function Avatar() {
  const ini = (PROFILE.name || 'D').trim().charAt(0).toUpperCase() || 'D';
  const a = TRAINER_AVATAR();
  if (!a) {
    return (
      <span className="v4-av" id="v4Av">
        {ini}
      </span>
    );
  }
  const c = tc(a.e);
  const style = {
    background: `radial-gradient(circle at 35% 30%,color-mix(in srgb,${c} 55%,#fff),${c} 62%,color-mix(in srgb,${c} 45%,#000))`,
  };
  if (a.hex) {
    style.borderRadius = '30%';
  }
  style.position = 'relative';
  return (
    <span className="v4-av" id="v4Av" data-avatar-key={a.e + ini + (a.hex ? 'h' : '')} style={style}>
      <b style={{ font: '900 15px/1 var(--f-d)' }}>{ini}</b>
      <svg
        viewBox="0 0 24 24"
        width={11}
        height={11}
        style={{ position: 'absolute', right: '-1px', bottom: '-1px', filter: 'drop-shadow(0 1px 2px #000)' }}
      >
        <path d={gp(a.e)} fill="#fff" fillRule="evenodd" />
      </svg>
    </span>
  );
}

// Top bar (v4-03): trainer, Pokédollars, Shards, settings. Redrawn by renderWallet().
export function TopTrainer() {
  const { wallet } = useShell();
  const on = wallet > 0; // before the first renderWallet: empty template, like the old engine
  return (
    <div className="v4-tb">
      <a className="v4-trainer" data-t="params" href="#params" aria-label="Profil du dresseur">
        {on ? <Avatar /> : <span className="v4-av" id="v4Av" />}
        <span className="v4-tr-t">
          <b id="v4Name">{on ? PROFILE.name || 'Dresseur' : null}</b>
          <em id="v4Lvl">
            {on ? `${displayedTitle() || (isCamp() ? 'Campagne' : 'Mode Libre')} · Nv. ${tLevel()}` : null}
          </em>
        </span>
      </a>
      <a className="v4-wal" data-t="sac" href="#sac" aria-label="Pokédollars">
        <span className="coin-icon" aria-hidden="true">
          ₽
        </span>
        <b id="v4Money">{on ? fmt(PROFILE.money || 0) : '0'}</b>
      </a>
      <a className="v4-wal gem" data-t="sac" href="#sac" aria-label="Éclats de Résonance">
        <span className="gem-icon" aria-hidden="true">
          <svg>
            <use href="#i-gem" />
          </svg>
        </span>
        <b id="v4Gems">{on ? fmt(PROFILE.gems || 0) : '0'}</b>
      </a>
      <a className="v4-gear" data-t="params" href="#params" aria-label="Paramètres">
        <svg>
          <use href="#i-gear" />
        </svg>
      </a>
    </div>
  );
}
