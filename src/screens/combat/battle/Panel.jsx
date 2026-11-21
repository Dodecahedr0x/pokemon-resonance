import { Html } from '../../../lib/html.jsx';
import { strength } from '../../../lib/power.js';
import { REACTIONS } from '../../../engine/data/game-data.js';
import { MOVES, SHAPE, ABILITIES } from '../../../engine/data/moves.js';
import { POKEMON, SCENARIOS } from '../../../engine/pokemon/pokemon.js';
import { ARRIVAL_EFFECTS } from '../../../engine/pokemon/evolution.js';
import { ROLE_EFFECTS, roleIcon } from '../../../engine/pokemon/roles-synergies.js';
import { veiled } from '../../../engine/modes/gyms.js';
import { markOf, medal, reactionCategory, typeBadge, typeColor } from '../../../engine/core/utils.js';
import {
  MAX_ENERGY,
  byUid,
  canAwaken,
  forcedTarget,
  damageOf,
  awakeningInfo,
  evoOpts,
  foeEvo,
  hasNx,
  moveType,
  targets,
  unitAt,
} from '../../../engine/combat/engine.js';
import { roleOf } from '../../../engine/combat/synergies-obstacles.js';
import { battle, energyPips, segmentedHpBar, ui } from '../../../engine/combat/ui.js';
import { PREFERENCES } from '../../../engine/ui/preferences.js';
import { catchBlock, duoBlock, tileCard, unitExtras } from '../../../engine/combat/battle-panel.js';
import { HEALS } from '../../../engine/items/battle-potions.js';
import { itemIcon } from '../../../engine/assets/item-icons.js';
import { SHOP, bagCount } from '../../../engine/state/economy.js';
import {
  COMBAT_ITEMS,
  BAG_MAX,
  hasXp,
  moveBlockedMessage,
  foeResonanceNotes,
  roleBadgeHtml,
  canUseBagItem,
  rankOfValue,
  rankLineHtml,
  rankTag,
  expertBlockHtml,
} from '../../../engine/combat/resonance.js';
import { resonanceBlockHtml } from '../../../engine/combat/resonant-form.js';
import { battleStatesHtml, vigilButtonHtml } from '../../../engine/combat/intensity.js';
import { turnFlow } from '../../../engine/combat/painted-board.js';
import { isEnemyTurn } from '../../../engine/combat/quick-battle.js';
import { useBattleVersion } from './battleStore.js';
import { STEP, Hi, withoutTip } from './frag.jsx';

import Button from '../../../components/Button.jsx';
const NL = '\n  ';

// Statuses that make the round pass (u.sn), based on the Pokémon's badge.
const STATE = { GEL: 'gelé', SOM: 'endormi', PAR: 'paralysé' };

// Command panel (#bPanel): sheet of the chosen Pokémon, an opponent, or a tile.
// The container's « is-info-off » class is still set by the engine (panelRoleInfo).
export default function Panel() {
  const v = useBattleVersion('panel');
  return (
    <div className="battle-panel" id="bPanel" aria-live="polite">
      {v && battle ? <Content /> : null}
    </div>
  );
}

function Content() {
  if (battle.over) {
    return null;
  }
  if (battle.deployPhase) {
    return <Placement />;
  }
  if (ui.busy && !ui.cutscene && (battle.phase === 'enemy' || isEnemyTurn())) {
    return <OpponentTurn />;
  }
  if (ui.busy) {
    return (
      <div className="battle-panel-wait">
        <span className="spin" />
        {ui.cutscene ? 'Évolution en cours…' : 'Les adversaires agissent…'}
      </div>
    );
  }
  const e = ui.selE && byUid(battle, ui.selE);
  if (e && !e.ko) {
    return <OpponentSheet e={e} />;
  }
  const u = ui.sel && byUid(battle, ui.sel);
  if (!u || u.ko) {
    return (
      <>
        <Hi html={tileCard()} />
        <p className="battle-hint">
          Touchez un de vos Pokémon pour le commander, ou un adversaire pour voir sa portée.
        </p>
      </>
    );
  }
  return <AllySheet u={u} />;
}

const tileOf = u => 'ABCDEFGH'[u.pos[0]] + (u.pos[1] + 1);

/* ---------- placement before the battle (v4.30): who is where, who is chosen ---------- */
// Panel clicks are blocked by the engine during deployment: the list is read-only, you play on the board.
function Placement() {
  const al = battle.units.filter(u => u.side === 'a' && !u.ko),
    sel = ui.deploySel && byUid(battle, ui.deploySel);
  return (
    <div className="battle-placement">
      <div className="battle-placement-head">
        <span className="battle-placement-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </span>
        <div>
          <b>Placement</b>
          <span>
            {sel ? `Touchez une case de départ pour ${sel.n}.` : 'Touchez un Pokémon, puis une case de départ.'}
          </span>
        </div>
      </div>
      <ul className="battle-placement-list">
        {al.map(u => (
          <li key={u.uid} className={sel === u ? 'is-selected' : ''}>
            <Html html={medal(u.t, 'is-small')} />
            <b>{u.n}</b>
            <span>{tileOf(u)}</span>
          </li>
        ))}
      </ul>
      <p className="battle-hint">
        Les deux premières colonnes sont à vous. Posé sur un allié, un Pokémon échange sa place avec lui.
      </p>
    </div>
  );
}

/* ---------- opponent turn: who acted, who is acting, who follows ---------- */
function OpponentTurn() {
  useBattleVersion('top');
  useBattleVersion('foot');
  const file =
    battle.order === 'vitesse' && battle.turnQueue ? battle.turnQueue.map(id => byUid(battle, id)) : battle.units;
  const foes = file.filter(u => u && u.side === 'e' && !u.ko && !u.caught),
    cur = ui.act && byUid(battle, ui.act),
    doneFlag = foes.filter(u => u.done && u !== cur).length,
    veil = veiled(battle);
  return (
    <div className="battle-foe-turn">
      <div className="battle-foe-turn-head">
        <i aria-hidden="true" />
        <b>Tour adverse</b>
        <span>
          {Math.min(doneFlag + (cur ? 1 : 0), foes.length)} / {foes.length}
        </span>
      </div>
      <ol className="battle-foe-turn-list">
        {foes.map(u => {
          const st = u === cur ? 'acting' : u.done ? 'done' : '';
          const m = u.intent && !veil ? MOVES[u.intent.mv] : null,
            v = m && unitAt(battle, u.intent.k);
          return (
            <li key={u.uid} className={st && 'is-' + st}>
              <Html html={medal(u.t, 'is-small')} />
              <span className="battle-foe-turn-name">
                <b>{u.n}</b>
                {m
                  ? ` · ${m.n} → ${v ? v.n : 'case vide'}`
                  : battle.jit
                    ? ' · choisit sa cible'
                    : veil && u.intent
                      ? ' · intention voilée'
                      : ''}
              </span>
              <em>{st === 'acting' ? 'en cours' : st === 'done' ? 'a agi' : ''}</em>
            </li>
          );
        })}
      </ol>
      <p className="battle-hint">« Passer » joue le reste du tour adverse en accéléré.</p>
    </div>
  );
}

// Role and « Détails » (Details) button under the header (v1.2).
function Role() {
  const u = (ui.selE && byUid(battle, ui.selE)) || (ui.sel && byUid(battle, ui.sel));
  if (!u || u.ko) {
    return null;
  }
  const r = roleOf(u),
    R = ROLE_EFFECTS[r];
  return (
    <div className="battle-panel-role">
      {R ? (
        <span className={'battle-role-tag' + (u.side === 'e' ? ' is-enemy' : '')} title={R.d}>
          <Html html={roleIcon(r)} />
          {r} · {R.k}
        </span>
      ) : null}
      <button type="button" className="battle-panel-details" data-info="" aria-pressed={!!PREFERENCES.info}>
        {PREFERENCES.info ? 'Moins' : 'Détails'}
      </button>
    </div>
  );
}

function Header({ u, underText: under }) {
  return (
    <div className="battle-panel-head">
      <Html html={medal(u.t)} />
      <div className="battle-panel-title">
        <b>
          {u.n} <Html html={rankTag(rankOfValue(u))} />
        </b>
        <span>{under}</span>
      </div>
      <div className="battle-panel-hp">
        <span>
          {u.hp} / {u.mhp}
        </span>
        <Html html={segmentedHpBar(u)} />
      </div>
    </div>
  );
}

const powerLabel = m => strength(m, 'Puiss.');

/* ---------- opponent ---------- */
function Intention({ e }) {
  if (battle.jit) {
    const F = e.force && forcedTarget(battle, e);
    return e.done ? (
      <p className="battle-hint">Il a déjà joué cette manche.</p>
    ) : e.badge || e.isLost ? (
      <p className="battle-intent">Neutralisé : il ne jouera pas cette manche.</p>
    ) : (
      <p className="battle-intent">
        Il choisira sa cible à son tour, selon vos positions. <b>Zone rouge</b> : tout ce qu’il peut frapper après
        s’être déplacé.
        {F ? (
          <>
            {' '}
            Cible imposée : <b>{F.n}</b>.
          </>
        ) : null}
      </p>
    );
  }
  if (e.intent && veiled(battle)) {
    return (
      <p className="battle-intent">
        Intention voilée par l’Arène Psy. Elle reste fixée : lisez sa position et sa portée.
      </p>
    );
  }
  if (e.intent) {
    const m = MOVES[e.intent.mv],
      v = unitAt(battle, e.intent.k);
    const est = v ? damageOf(battle, e, m, v, moveType(battle, e, m), 1) : 0;
    return (
      <p className="battle-intent">
        Vise <b>{v ? v.n : 'une case vide'}</b> avec <b>{m.n}</b>
        {v && est ? (
          <>
            {' '}
            · environ <b className="neg">−{est}</b>
          </>
        ) : null}
        . Déplacez la cible, endormez ou détournez l’attaquant pour l’annuler.
      </p>
    );
  }
  return <p className="battle-hint">Aucune attaque annoncée.</p>;
}

function OpponentSheet({ e }) {
  const tl = ABILITIES[e.ability],
    nx = hasNx(e) ? awakeningInfo(battle, e) : null,
    fe = foeEvo(battle, e);
  const role = roleOf(e),
    RF = ROLE_EFFECTS[role];
  return (
    <>
      <Header u={e} underText={`N.${e.lv} · ${e.t.join(' / ')}${tl ? ' · ' + tl[0] : ''}`} />
      <Role />
      {NL}
      {RF ? (
        <p className="battle-role-note is-enemy">
          <Html html={roleIcon(role)} />
          <span>
            <b>
              {role} · {RF.k}.
            </b>{' '}
            <Html html={RF.d.replace(/^[^:]+ : /, '')} />
          </span>
        </p>
      ) : null}
      <Intention e={e} />
      {nx ? (
        <div className={'battle-foe-evolution' + (fe ? ' is-imminent' : '')}>
          <Html html={medal(nx.t, 'is-small')} />
          <p>
            {fe ? (
              <>
                <b>Évolution imminente.</b> {e.n} est sous 50 % : il deviendra {nx.n} en fin de manche. Achevez-le
                avant.
              </>
            ) : (
              <>
                Sous 50 % de PV, {e.n} deviendra <b>{nx.n}</b> en fin de manche.{' '}
                {ARRIVAL_EFFECTS[nx.id] ? <Html html={'Arrivée : ' + ARRIVAL_EFFECTS[nx.id][1]} /> : null}
              </>
            )}
          </p>
        </div>
      ) : null}
      <Hi html={foeResonanceNotes(e)} />
      <Html html={catchBlock(e)} />
      <div className="battle-moves">
        {e.mv.map((id, i) => {
          const m = MOVES[id];
          return (
            <div key={i} className="battle-move is-static" style={{ '--c': typeColor(m.t) }}>
              <Html html={typeBadge(m.t)} />
              <b>
                {m.n}
                <Html html={roleBadgeHtml(m, e)} />
              </b>
              <span>
                {powerLabel(m)} · portée {m.r}
              </span>
            </div>
          );
        })}
      </div>
      {NL}
      <Button size="small" data-fc="1">
        Fermer
      </Button>
    </>
  );
}

/* ---------- exact preview of an action ---------- */
function Preview({ v }) {
  const ew = v.diff.filter(d => d.evw);
  return (
    <div className="battle-preview">
      <div className="battle-preview-head">
        <span>Aperçu exact</span>
        {v.rxs.map((r, i) => (
          <span key={i} className={`chip cat-${reactionCategory(r)}`}>
            <i />
            {REACTIONS[r].n}
          </span>
        ))}
      </div>
      {v.notes && v.notes.length ? (
        <div className="battle-preview-notes">
          {v.notes.map((n, i) => (
            <span key={i}>
              <Html html={n} />
            </span>
          ))}
        </div>
      ) : null}
      {v.diff.length ? (
        <ul>
          {v.diff.map((d, i) => (
            <li key={i} className={d.side === 'a' ? 'is-ally' : 'is-foe'}>
              <span>{d.n}</span>
              <span>
                {d.dh < 0 ? <b className="neg">{d.dh}</b> : d.dh > 0 ? <b className="pos">+{d.dh}</b> : null}
                {d.ko ? (
                  <>
                    {' '}
                    <b className="neg">K.O.</b>
                  </>
                ) : null}
                {d.st ? (
                  <>
                    {' '}
                    <em className="status-badge">{d.st}</em>
                  </>
                ) : null}
                {d.can ? (
                  <>
                    {' '}
                    <em>attaque annulée</em>
                  </>
                ) : null}
                {d.ret ? (
                  <>
                    {' '}
                    <em>attaque détournée</em>
                  </>
                ) : null}
                {d.mv && !d.dh ? (
                  <>
                    {' '}
                    <em>déplacé</em>
                  </>
                ) : null}
                {d.en > 0 ? (
                  <>
                    {' '}
                    <em className="is-energy">+{d.en} énergie</em>
                  </>
                ) : null}
                {d.evw ? (
                  <>
                    {' '}
                    <em className="is-evolving">évoluera</em>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="battle-hint">
          {v.wx ? 'La météo change pour 5 manches.' : 'Pas de dégâts directs : la marque ou l’effet est appliqué.'}
        </p>
      )}
      {v.diff.some(d => d.side === 'a' && d.dh < 0) ? (
        <p className="battle-preview-warning">Attention : un de vos Pokémon est touché.</p>
      ) : null}
      {ew.length ? (
        <p className="battle-preview-evolution">
          {ew.map(d => d.n).join(', ')} passe{ew.length > 1 ? 'nt' : ''} sous 50 % sans tomber : évolution en fin de
          manche.
        </p>
      ) : null}
      {v.over === 'win' ? <p className="battle-preview-win">Cette action termine le combat.</p> : null}
      <div className="battle-preview-actions">
        <Button size="small" data-pv="no">
          Annuler
        </Button>
        <Button size="small" variant="primary" data-pv="ok">
          Confirmer
        </Button>
      </div>
    </div>
  );
}

/* ---------- Awakening energy ---------- */
function Awakening({ u, s }) {
  if (!hasNx(u)) {
    // one line is enough when the Pokémon no longer evolves
    if (hasXp(u)) {
      return <Hi html={s(expertBlockHtml(u) + resonanceBlockHtml(u))} />;
    } // diamonds (v4.14), Resonant Form (v4.17)
    const resonanceHtml = resonanceBlockHtml(u, true);
    if (resonanceHtml) {
      return <Hi html={s(resonanceHtml)} />;
    }
    const m = POKEMON[u.id];
    return (
      <p className="battle-final-stage">
        {u.evo
          ? 'Stade final atteint en combat.'
          : m && m.st > 1
            ? 'Recrue confirmée · stade final.'
            : 'Stade unique · puissant dès le départ.'}
      </p>
    );
  }
  const o = evoOpts(battle, u),
    ce = canAwaken(battle, u),
    full = u.en >= MAX_ENERGY;
  const why = !full
    ? `Encore ${MAX_ENERGY - u.en} : fin de manche, réaction, coup encaissé, allié K.O.`
    : u.sn
      ? 'Immobilisé cette manche.'
      : u.acted
        ? 'Action déjà utilisée : Relance pour éveiller.'
        : battle.voice < 1
          ? 'Plus de Voix cette manche.'
          : 'Prêt. Choix irréversible.';
  return (
    <div className={'battle-energy' + (full ? ' is-full' : '')}>
      <div className="battle-energy-head">
        <span className="caption">Énergie d’Éveil</span>
        <Html html={energyPips(u.en, 'is-large')} />
      </div>
      {NL}
      <button type="button" className="battle-awaken" data-evo="open" disabled={!ce}>
        <span className="battle-awaken-medals">
          {o.map((id, i) => (
            <Html key={i} html={medal(POKEMON[id].t, 'is-small')} />
          ))}
        </span>
        <span>
          <b>Éveiller{o.length === 1 ? ' en ' + POKEMON[o[0]].n : ` · ${o.length} voies`}</b>
          <em>{why}</em>
        </span>
        <span className="battle-awaken-cost">
          1 Voix
          <br />+ action
        </span>
      </button>
    </div>
  );
}

/* ---------- guided walkthrough (v4.78): the current step and its skip button ---------- */
function Step({ u, st }) {
  const n = turnFlow.remaining(battle).length,
    cur = { deplacer: 0, agir: 1, extra: 2, fini: 3 }[st];
  let txt = '',
    bt = null;
  if (st === 'deplacer') {
    txt = `Touchez une case bleue pour déplacer ${u.n}, ou attaquez d’ici.`;
    bt = (
      <Button size="small" data-vx="stay-put">
        <b>Rester ici</b>
      </Button>
    );
  } else if (st === 'agir') {
    const target = u.mv.some(id => targets(battle, u, MOVES[id]).length);
    txt = target
      ? `Choisissez une capacité${canAwaken(battle, u) ? ', ou éveillez-le' : ''}.`
      : `Aucune cible à portée${canAwaken(battle, u) ? ' : éveillez-le, ou passez' : ''}.`;
    bt = (
      <Button size="small" data-vx="skip-action">
        <b>Passer l’action</b>
      </Button>
    );
  } else if (st === 'extra') {
    txt = [
      turnFlow.repli(u) ? 'Touchez une case bleue pour vous replier.' : '',
      turnFlow.retrigger(battle) ? 'Relance (2 Voix) : il rejoue tout de suite.' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const next = turnFlow.remaining(battle).find(x => x !== u);
    bt = (
      <>
        <Button size="small" variant="primary" data-vx="finished-round">
          <b>Terminer {u.n}</b>
        </Button>
        {battle.order !== 'vitesse' ? (
          <span className="turn-guide-suite">{next ? `Ensuite : ${next.n}` : 'Dernier Pokémon de la manche'}</span>
        ) : null}
      </>
    );
  } else if (u.sn) {
    txt = `${u.n} ${STATE[u.badge] ? 'est ' + STATE[u.badge] : 'ne peut pas agir'} : il passe cette manche.`;
  } else {
    txt = `${u.n} a fini son tour.`;
  }
  return (
    <div className="turn-guide" data-st={st}>
      <div className="turn-guide-head">
        <ol className="turn-guide-steps">
          {[STEP.deplacer, STEP.agir, STEP.extra].flatMap((l, i) => [
            ...(i
              ? [
                  <li key={'s' + i} className="is-separator" aria-hidden="true">
                    ›
                  </li>,
                ]
              : []),
            <li key={i} className={i < cur ? 'is-done' : i === cur ? 'is-current' : ''}>
              {l}
            </li>,
          ])}
        </ol>
        <span className="turn-guide-count">
          {battle.order === 'vitesse' ? 'Ordre par Vitesse' : n ? `Encore ${n} à jouer` : 'Manche terminée'}
        </span>
      </div>
      <div className="turn-guide-row">
        <p>{txt}</p>
        {bt}
      </div>
    </div>
  );
}

/* ---------- Bag: items usable in battle (v4.0, v4.14) ---------- */
function Bag({ u }) {
  if ((SCENARIOS[battle.sc] || {}).tuto || battle.duel433 || ui.selE || u.side !== 'a') {
    return null;
  }
  const own = [...HEALS, ...COMBAT_ITEMS].filter(k => bagCount(k));
  if (!own.length) {
    return null;
  }
  return (
    <div className="battle-bag">
      <span className="caption">
        Sac · {battle.itemsUsed || 0} / {BAG_MAX}
      </span>
      {own.map(k => {
        const it = SHOP[k],
          info = it.heal ? `+${Math.round(it.heal * 100)} % PV` : it.voice ? `${it.voice} Voix` : 'Action';
        return (
          <button
            key={k}
            type="button"
            className="battle-bag-item"
            data-use={k}
            title={it.d}
            disabled={!canUseBagItem(battle, u, k)}
          >
            <img src={itemIcon(it.img)} alt="" loading="lazy" />
            <b>{it.sn || it.n}</b>
            <span>
              {info} · ×{bagCount(k)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Pokémon of your team ---------- */
function AllySheet({ u }) {
  const tl = ABILITIES[u.ability];
  // guided walkthrough: the step replaces the tips when no mode is active
  const F = turnFlow,
    guide = F.active() && !ui.busy && !ui.selE && u.side === 'a' && F.toPlay(battle).includes(u),
    st = guide ? F.stepOf(battle, u) : null,
    without = guide && !ui.mode,
    s = h => (without ? withoutTip(h) : h);
  let hint = null;
  if (ui.mode === 'duo') {
    hint = ui.pv ? (
      <Preview v={ui.pv} />
    ) : (
      <p className="battle-hint">Technique combinée : touchez une case dorée pour voir le résultat exact.</p>
    );
  } else if (ui.mode === 'target') {
    hint = ui.pv ? (
      <Preview v={ui.pv} />
    ) : (
      <p className="battle-hint">Touchez une case dorée : l’aperçu affiche le résultat exact.</p>
    );
  } else if (without) {
    hint = null;
  } else if (ui.mode === 'dodge') {
    hint = <p className="battle-hint">Esquive : touchez une case verte voisine.</p>;
  } else if (u.sn) {
    hint = (
      <p className="battle-hint">
        {u.n} est {STATE[u.badge] || STATE.PAR} : il ne peut pas agir cette manche.
      </p>
    );
  } else if (!u.acted && !u.moved) {
    hint = <p className="battle-hint">Cases bleues : déplacement. Ou choisissez directement une capacité.</p>;
  } else if (!u.acted) {
    hint = <p className="battle-hint">Choisissez une capacité, ou éveillez-le depuis cette case.</p>;
  } else {
    hint = <p className="battle-hint">{u.n} a joué. Esquive et Relance restent possibles.</p>;
  }
  const relHi = st === 'extra' && F.retrigger(battle);
  return (
    <>
      <Header u={u} underText={`${u.t.join(' / ')}${tl ? ' · ' + tl[0] : ''}${u.evo ? ` · éveillé ×${u.evo}` : ''}`} />
      {guide ? <Step u={u} st={st} /> : null}
      <Role />
      {NL}
      <Hi html={s(tileCard())} />
      {tl ? (
        <p className="battle-ability">
          <b>{tl[0]}.</b> <Html html={tl[1]} />
        </p>
      ) : null}
      <Hi html={s(rankLineHtml(u) + unitExtras(u) + battleStatesHtml(u))} />
      {NL}
      <Awakening u={u} s={s} />
      {NL}
      <div className="battle-moves">
        {u.mv.map((id, i) => {
          const m = MOVES[id],
            typ = moveType(battle, u, m),
            n = targets(battle, u, m).length;
          return (
            <button
              key={i}
              type="button"
              className={'battle-move' + (ui.mode === 'target' && ui.mi === i ? ' is-selected' : '')}
              data-mi={i}
              disabled={!!(u.acted || !n)}
              style={{ '--c': typeColor(typ) }}
            >
              <Html html={typeBadge(typ)} />
              <b>
                {m.n}
                <Html html={roleBadgeHtml(m, u)} />
              </b>
              <span>
                {powerLabel(m)} · {SHAPE[m.sh]}
                {m.r ? ' ' + m.r : ''}
                {m.mk ? ' · ' + markOf(m.mk).n : ''}
              </span>
              <em>
                <Html html={n ? m.d : moveBlockedMessage(battle, u, m) || 'Aucune cible à portée.'} />
              </em>
            </button>
          );
        })}
      </div>
      <Hi html={s(duoBlock(u))} />
      {hint}
      {NL}
      <div className="battle-voice-actions">
        <button
          type="button"
          className={'battle-voice-action' + (ui.mode === 'dodge' ? ' is-active' : '')}
          data-vx="dodge"
          disabled={!!(battle.voice < 1 || u.sn)}
        >
          <b>Esquive</b>
          <span>1 Voix · un pas</span>
        </button>
        <button
          type="button"
          className={'battle-voice-action' + (relHi ? ' turn-guide-hi' : '')}
          data-vx="relance"
          disabled={!!(!u.acted || u.sn || battle.retrigger || battle.voice < 2)}
        >
          <b>Relance</b>
          <span>2 Voix · rejouer</span>
        </button>
        <Hi html={s(vigilButtonHtml(u))} />
      </div>
      <Bag u={u} />
    </>
  );
}
