import { Html } from '../../../lib/html.jsx';
import { strength } from '../../../lib/power.js';
import { RX } from '../../../engine/004-data.js';
import { MV, SHAPE, TAL } from '../../../engine/005-moves.js';
import { BY, SCEN } from '../../../engine/009-pokemon.js';
import { ARR } from '../../../engine/010-in-battle-evolution.js';
import { ROLEFX, rIco } from '../../../engine/012-recruits-roles-synergies.js';
import { veiled } from '../../../engine/013-gyms.js';
import { markOf, medal, rxCat, tb, tc } from '../../../engine/014-utils.js';
import { EMAX, byUid, canAwaken, forcedTarget, dmgOf, eveilInfo, evoOpts, foeEvo, hasNx, mvType, targets, uAt } from '../../../engine/021-combat-engine.js';
import { roleOf } from '../../../engine/023-roles-synergies-obstacles.js';
import { B, enPips, segHp, ui } from '../../../engine/024-combat-ui.js';
import { PREF, catchBlock, duoBlock, tileCard, unitExtras } from '../../../engine/026-campaign-tutorial-sound.js';
import { HEALS, ITM, SHOP, bagN } from '../../../engine/032-v4-foundation.js';
import { COMBAT414, SAC_MAX, hasXp, blocked414, foeReso414, mrg414, objOk414, rankOfValue, rankLine414, rankTag, xpBlock414 } from '../../../engine/053-resonance.js';
import { resoBlock417 } from '../../../engine/057-companions-resonance.js';
import { battleStates420, vigilBtn420 } from '../../../engine/060-intense-combat.js';
import { flow478 } from '../../../engine/112-painted-graphics.js';
import { enemyTurn428 } from '../../../engine/063-combat-catches-home.js';
import { useBattleVersion } from './battleStore.js';
import { ETAPE, Hi, withoutTip } from './frag.jsx';

const NL = '\n  ';

// Statuts qui font passer la manche (u.sn), d'après le badge du Pokémon.
const ETAT = { GEL: 'gelé', SOM: 'endormi', PAR: 'paralysé' };

// Panneau de commande (#bPanel) : fiche du Pokémon choisi, d'un adversaire, ou d'une case.
// La classe « info-off » du conteneur reste posée par le moteur (panelRoleInfo).
export default function Panel() {
  const v = useBattleVersion('panel');
  return (
    <div className="bp" id="bPanel" aria-live="polite">
      {v && B ? <Content /> : null}
    </div>
  );
}

function Content() {
  if (B.over) return null;
  if (B.dep430) return <Placement />;
  if (ui.busy && !ui.cine && (B.phase === 'enemy' || enemyTurn428())) return <OpponentTurn />;
  if (ui.busy)
    return (
      <div className="bp-wait">
        <span className="spin" />
        {ui.cine ? 'Évolution en cours…' : 'Les adversaires agissent…'}
      </div>
    );
  const e = ui.selE && byUid(B, ui.selE);
  if (e && !e.ko) return <OpponentSheet e={e} />;
  const u = ui.sel && byUid(B, ui.sel);
  if (!u || u.ko)
    return (
      <>
        <Hi html={tileCard()} />
        <p className="bp-hint">Touchez un de vos Pokémon pour le commander, ou un adversaire pour voir sa portée.</p>
      </>
    );
  return <AllySheet u={u} />;
}

const tileOf = u => 'ABCDEFGH'[u.pos[0]] + (u.pos[1] + 1);

/* ---------- placement avant le combat (v4.30) : qui est où, qui est choisi ---------- */
// Les clics du panneau sont bloqués par le moteur pendant le déploiement : la liste se lit, on joue sur le plateau.
function Placement() {
  const al = B.units.filter(u => u.side === 'a' && !u.ko),
    sel = ui.dsel430 && byUid(B, ui.dsel430);
  return (
    <div className="dep-p">
      <div className="dep-h">
        <span className="dep-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </span>
        <div>
          <b>Placement</b>
          <span>{sel ? `Touchez une case de départ pour ${sel.n}.` : 'Touchez un Pokémon, puis une case de départ.'}</span>
        </div>
      </div>
      <ul className="dep-l">
        {al.map(u => (
          <li key={u.uid} className={sel === u ? 'on' : ''}>
            <Html html={medal(u.t, 'sm')} />
            <b>{u.n}</b>
            <span>{tileOf(u)}</span>
          </li>
        ))}
      </ul>
      <p className="bp-hint">Les deux premières colonnes sont à vous. Posé sur un allié, un Pokémon échange sa place avec lui.</p>
    </div>
  );
}

/* ---------- tour adverse : qui a agi, qui agit, qui suit ---------- */
function OpponentTurn() {
  useBattleVersion('top');
  useBattleVersion('foot');
  const file = B.ordre === 'vitesse' && B.file ? B.file.map(id => byUid(B, id)) : B.units;
  const foes = file.filter(u => u && u.side === 'e' && !u.ko && !u.caught),
    cur = ui.act && byUid(B, ui.act),
    doneFlag = foes.filter(u => u.done && u !== cur).length,
    veil = veiled(B);
  return (
    <div className="ta-p">
      <div className="ta-h">
        <i aria-hidden="true" />
        <b>Tour adverse</b>
        <span>
          {Math.min(doneFlag + (cur ? 1 : 0), foes.length)} / {foes.length}
        </span>
      </div>
      <ol className="ta-l">
        {foes.map(u => {
          const st = u === cur ? 'now' : u.done ? 'done' : '';
          const m = u.intent && !veil ? MV[u.intent.mv] : null,
            v = m && uAt(B, u.intent.k);
          return (
            <li key={u.uid} className={st}>
              <Html html={medal(u.t, 'sm')} />
              <span className="ta-t">
                <b>{u.n}</b>
                {m ? ` · ${m.n} → ${v ? v.n : 'case vide'}` : B.jit ? ' · choisit sa cible' : veil && u.intent ? ' · intention voilée' : ''}
              </span>
              <em>{st === 'now' ? 'en cours' : st === 'done' ? 'a agi' : ''}</em>
            </li>
          );
        })}
      </ol>
      <p className="bp-hint">« Passer » joue le reste du tour adverse en accéléré.</p>
    </div>
  );
}

// Rôle et bouton « Détails » sous l'en-tête (v1.2).
function Role() {
  const u = (ui.selE && byUid(B, ui.selE)) || (ui.sel && byUid(B, ui.sel));
  if (!u || u.ko) return null;
  const r = roleOf(u),
    R = ROLEFX[r];
  return (
    <div className="bp-tr">
      {R ? (
        <span className={'tr' + (u.side === 'e' ? ' en' : '')} title={R.d}>
          <Html html={rIco(r)} />
          {r} · {R.k}
        </span>
      ) : null}
      <button type="button" className="tr-i" data-info="" aria-pressed={!!PREF.info}>
        {PREF.info ? 'Moins' : 'Détails'}
      </button>
    </div>
  );
}

function Header({ u, sous: under }) {
  return (
    <div className="bp-h">
      <Html html={medal(u.t)} />
      <div className="bp-id">
        <b>
          {u.n} <Html html={rankTag(rankOfValue(u))} />
        </b>
        <span>{under}</span>
      </div>
      <div className="bp-hp">
        <span>
          {u.hp} / {u.mhp}
        </span>
        <Html html={segHp(u)} />
      </div>
    </div>
  );
}

const powerLabel = m => strength(m, 'Puiss.');

/* ---------- adversaire ---------- */
function Intention({ e }) {
  if (B.jit) {
    const F = e.force && forcedTarget(B, e);
    return e.done ? (
      <p className="bp-hint">Il a déjà joué cette manche.</p>
    ) : e.badge || e.perdu ? (
      <p className="bp-int">Neutralisé : il ne jouera pas cette manche.</p>
    ) : (
      <p className="bp-int">
        Il choisira sa cible à son tour, selon vos positions. <b>Zone rouge</b> : tout ce qu’il peut frapper après s’être
        déplacé.
        {F ? (
          <>
            {' '}
            Cible imposée : <b>{F.n}</b>.
          </>
        ) : null}
      </p>
    );
  }
  if (e.intent && veiled(B))
    return <p className="bp-int">Intention voilée par l’Arène Psy. Elle reste fixée : lisez sa position et sa portée.</p>;
  if (e.intent) {
    const m = MV[e.intent.mv],
      v = uAt(B, e.intent.k);
    const est = v ? dmgOf(B, e, m, v, mvType(B, e, m), 1) : 0;
    return (
      <p className="bp-int">
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
  return <p className="bp-hint">Aucune attaque annoncée.</p>;
}

function OpponentSheet({ e }) {
  const tl = TAL[e.tal],
    nx = hasNx(e) ? eveilInfo(B, e) : null,
    fe = foeEvo(B, e);
  const role = roleOf(e),
    RF = ROLEFX[role];
  return (
    <>
      <Header u={e} sous={`N.${e.lv} · ${e.t.join(' / ')}${tl ? ' · ' + tl[0] : ''}`} />
      <Role />
      {NL}
      {RF ? (
        <p className="bp-role en">
          <Html html={rIco(role)} />
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
        <div className={'bp-evw' + (fe ? ' on' : '')}>
          <Html html={medal(nx.t, 'sm')} />
          <p>
            {fe ? (
              <>
                <b>Évolution imminente.</b> {e.n} est sous 50 % : il deviendra {nx.n} en fin de manche. Achevez-le avant.
              </>
            ) : (
              <>
                Sous 50 % de PV, {e.n} deviendra <b>{nx.n}</b> en fin de manche.{' '}
                {ARR[nx.id] ? <Html html={'Arrivée : ' + ARR[nx.id][1]} /> : null}
              </>
            )}
          </p>
        </div>
      ) : null}
      <Hi html={foeReso414(e)} />
      <Html html={catchBlock(e)} />
      <div className="bp-mv">
        {e.mv.map((id, i) => {
          const m = MV[id];
          return (
            <div key={i} className="bm ro" style={{ '--c': tc(m.t) }}>
              <Html html={tb(m.t)} />
              <b>
                {m.n}
                <Html html={mrg414(m, e)} />
              </b>
              <span>
                {powerLabel(m)} · portée {m.r}
              </span>
            </div>
          );
        })}
      </div>
      {NL}
      <button type="button" className="b b-sm" data-fc="1">
        Fermer
      </button>
    </>
  );
}

/* ---------- aperçu exact d'une action ---------- */
function Preview({ v }) {
  const ew = v.diff.filter(d => d.evw);
  return (
    <div className="bp-pv">
      <div className="pv-h">
        <span>Aperçu exact</span>
        {v.rxs.map((r, i) => (
          <span key={i} className={`chip cat-${rxCat(r)}`}>
            <i />
            {RX[r].n}
          </span>
        ))}
      </div>
      {v.notes && v.notes.length ? (
        <div className="pv-notes">
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
            <li key={i} className={d.side === 'a' ? 'al' : 'fo'}>
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
                    <em className="stt">{d.st}</em>
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
                    <em className="enx">+{d.en} énergie</em>
                  </>
                ) : null}
                {d.evw ? (
                  <>
                    {' '}
                    <em className="evx">évoluera</em>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bp-hint">{v.wx ? 'La météo change pour 5 manches.' : 'Pas de dégâts directs : la marque ou l’effet est appliqué.'}</p>
      )}
      {v.diff.some(d => d.side === 'a' && d.dh < 0) ? <p className="warn-ff">Attention : un de vos Pokémon est touché.</p> : null}
      {ew.length ? (
        <p className="warn-ev">
          {ew.map(d => d.n).join(', ')} passe{ew.length > 1 ? 'nt' : ''} sous 50 % sans tomber : évolution en fin de manche.
        </p>
      ) : null}
      {v.over === 'win' ? <p className="win-ff">Cette action termine le combat.</p> : null}
      <div className="pv-act">
        <button type="button" className="b b-sm" data-pv="no">
          Annuler
        </button>
        <button type="button" className="b b-sm b-gold" data-pv="ok">
          Confirmer
        </button>
      </div>
    </div>
  );
}

/* ---------- énergie d'Éveil ---------- */
function Awakening({ u, s }) {
  if (!hasNx(u)) {
    // une ligne suffit quand le Pokémon n’évolue plus
    if (hasXp(u)) return <Hi html={s(xpBlock414(u) + resoBlock417(u))} />; // losanges (v4.14), Forme Résonante (v4.17)
    const rb417 = resoBlock417(u, true);
    if (rb417) return <Hi html={s(rb417)} />;
    const m = BY[u.id];
    return (
      <p className="bp-fin">
        {u.evo ? 'Stade final atteint en combat.' : m && m.st > 1 ? 'Recrue confirmée · stade final.' : 'Stade unique · puissant dès le départ.'}
      </p>
    );
  }
  const o = evoOpts(B, u),
    ce = canAwaken(B, u),
    full = u.en >= EMAX;
  const why = !full
    ? `Encore ${EMAX - u.en} : fin de manche, réaction, coup encaissé, allié K.O.`
    : u.sn
      ? 'Immobilisé cette manche.'
      : u.acted
        ? 'Action déjà utilisée : Relance pour éveiller.'
        : B.voix < 1
          ? 'Plus de Voix cette manche.'
          : 'Prêt. Choix irréversible.';
  return (
    <div className={'bp-en' + (full ? ' full' : '')}>
      <div className="en-h">
        <span className="lbl-s">Énergie d’Éveil</span>
        <Html html={enPips(u.en, 'lg')} />
      </div>
      {NL}
      <button type="button" className="evb" data-evo="open" disabled={!ce}>
        <span className="evb-m">
          {o.map((id, i) => (
            <Html key={i} html={medal(BY[id].t, 'sm')} />
          ))}
        </span>
        <span>
          <b>Éveiller{o.length === 1 ? ' en ' + BY[o[0]].n : ` · ${o.length} voies`}</b>
          <em>{why}</em>
        </span>
        <span className="evb-c">
          1 Voix
          <br />+ action
        </span>
      </button>
    </div>
  );
}

/* ---------- déroulé guidé (v4.78) : l'étape en cours et son bouton pour passer ---------- */
function Step({ u, st }) {
  const n = flow478.restants(B).length,
    cur = { deplacer: 0, agir: 1, extra: 2, fini: 3 }[st];
  let txt = '',
    bt = null;
  if (st === 'deplacer') {
    txt = `Touchez une case bleue pour déplacer ${u.n}, ou attaquez d’ici.`;
    bt = (
      <button type="button" className="b b-sm" data-vx="rester478">
        <b>Rester ici</b>
      </button>
    );
  } else if (st === 'agir') {
    const target = u.mv.some(id => targets(B, u, MV[id]).length);
    txt = target
      ? `Choisissez une capacité${canAwaken(B, u) ? ', ou éveillez-le' : ''}.`
      : `Aucune cible à portée${canAwaken(B, u) ? ' : éveillez-le, ou passez' : ''}.`;
    bt = (
      <button type="button" className="b b-sm" data-vx="passer478">
        <b>Passer l’action</b>
      </button>
    );
  } else if (st === 'extra') {
    txt = [flow478.repli(u) ? 'Touchez une case bleue pour vous replier.' : '', flow478.relance(B) ? 'Relance (2 Voix) : il rejoue tout de suite.' : '']
      .filter(Boolean)
      .join(' ');
    const next = flow478.restants(B).find(x => x !== u);
    bt = (
      <>
        <button type="button" className="b b-sm b-gold" data-vx="fin478">
          <b>Terminer {u.n}</b>
        </button>
        {B.ordre !== 'vitesse' ? <span className="fl478-suite">{next ? `Ensuite : ${next.n}` : 'Dernier Pokémon de la manche'}</span> : null}
      </>
    );
  } else if (u.sn) {
    txt = `${u.n} ${ETAT[u.badge] ? 'est ' + ETAT[u.badge] : 'ne peut pas agir'} : il passe cette manche.`;
  } else txt = `${u.n} a fini son tour.`;
  return (
    <div className="fl478" data-st={st}>
      <div className="fl478-h">
        <ol className="fl478-p">
          {[ETAPE.deplacer, ETAPE.agir, ETAPE.extra].flatMap((l, i) => [
            ...(i
              ? [
                  <li key={'s' + i} className="sep" aria-hidden="true">
                    ›
                  </li>
                ]
              : []),
            <li key={i} className={i < cur ? 'ok' : i === cur ? 'on' : ''}>
              {l}
            </li>
          ])}
        </ol>
        <span className="fl478-n">{B.ordre === 'vitesse' ? 'Ordre par Vitesse' : n ? `Encore ${n} à jouer` : 'Manche terminée'}</span>
      </div>
      <div className="fl478-r">
        <p>{txt}</p>
        {bt}
      </div>
    </div>
  );
}

/* ---------- Sac : objets utilisables en combat (v4.0, v4.14) ---------- */
function Bag({ u }) {
  if ((SCEN[B.sc] || {}).tuto || B.duel433 || ui.selE || u.side !== 'a') return null;
  const own = [...HEALS, ...COMBAT414].filter(k => bagN(k));
  if (!own.length) return null;
  return (
    <div className="v4-bagbar">
      <span className="lbl-s">
        Sac · {B.objN || 0} / {SAC_MAX}
      </span>
      {own.map(k => {
        const it = SHOP[k],
          info = it.heal ? `+${Math.round(it.heal * 100)} % PV` : it.voix ? `${it.voix} Voix` : 'Action';
        return (
          <button key={k} type="button" className="v4-use" data-use={k} title={it.d} disabled={!objOk414(B, u, k)}>
            <img src={ITM(it.img)} alt="" loading="lazy" />
            <b>{it.sn || it.n}</b>
            <span>
              {info} · ×{bagN(k)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Pokémon de votre équipe ---------- */
function AllySheet({ u }) {
  const tl = TAL[u.tal];
  // déroulé guidé : l'étape remplace les astuces quand aucun mode n'est actif
  const F = flow478,
    guide = F.actif() && !ui.busy && !ui.selE && u.side === 'a' && F.aJouer(B).includes(u),
    st = guide ? F.etape(B, u) : null,
    without = guide && !ui.mode,
    s = h => (without ? withoutTip(h) : h);
  let hint = null;
  if (ui.mode === 'duo')
    hint = ui.pv ? <Preview v={ui.pv} /> : <p className="bp-hint">Technique combinée : touchez une case dorée pour voir le résultat exact.</p>;
  else if (ui.mode === 'target')
    hint = ui.pv ? <Preview v={ui.pv} /> : <p className="bp-hint">Touchez une case dorée : l’aperçu affiche le résultat exact.</p>;
  else if (without) hint = null;
  else if (ui.mode === 'dodge') hint = <p className="bp-hint">Esquive : touchez une case verte voisine.</p>;
  else if (u.sn)
    hint = (
      <p className="bp-hint">
        {u.n} est {ETAT[u.badge] || ETAT.PAR} : il ne peut pas agir cette manche.
      </p>
    );
  else if (!u.acted && !u.moved) hint = <p className="bp-hint">Cases bleues : déplacement. Ou choisissez directement une capacité.</p>;
  else if (!u.acted) hint = <p className="bp-hint">Choisissez une capacité, ou éveillez-le depuis cette case.</p>;
  else hint = <p className="bp-hint">{u.n} a joué. Esquive et Relance restent possibles.</p>;
  const relHi = st === 'extra' && F.relance(B);
  return (
    <>
      <Header u={u} sous={`${u.t.join(' / ')}${tl ? ' · ' + tl[0] : ''}${u.evo ? ` · éveillé ×${u.evo}` : ''}`} />
      {guide ? <Step u={u} st={st} /> : null}
      <Role />
      {NL}
      <Hi html={s(tileCard())} />
      {tl ? (
        <p className="bp-tal">
          <b>{tl[0]}.</b> <Html html={tl[1]} />
        </p>
      ) : null}
      <Hi html={s(rankLine414(u) + unitExtras(u) + battleStates420(u))} />
      {NL}
      <Awakening u={u} s={s} />
      {NL}
      <div className="bp-mv">
        {u.mv.map((id, i) => {
          const m = MV[id],
            typ = mvType(B, u, m),
            n = targets(B, u, m).length;
          return (
            <button
              key={i}
              type="button"
              className={'bm' + (ui.mode === 'target' && ui.mi === i ? ' on' : '')}
              data-mi={i}
              disabled={!!(u.acted || !n)}
              style={{ '--c': tc(typ) }}
            >
              <Html html={tb(typ)} />
              <b>
                {m.n}
                <Html html={mrg414(m, u)} />
              </b>
              <span>
                {powerLabel(m)} · {SHAPE[m.sh]}
                {m.r ? ' ' + m.r : ''}
                {m.mk ? ' · ' + markOf(m.mk).n : ''}
              </span>
              <em>
                <Html html={n ? m.d : blocked414(B, u, m) || 'Aucune cible à portée.'} />
              </em>
            </button>
          );
        })}
      </div>
      <Hi html={s(duoBlock(u))} />
      {hint}
      {NL}
      <div className="bp-vx">
        <button type="button" className={'vx' + (ui.mode === 'dodge' ? ' on' : '')} data-vx="dodge" disabled={!!(B.voix < 1 || u.sn)}>
          <b>Esquive</b>
          <span>1 Voix · un pas</span>
        </button>
        <button
          type="button"
          className={'vx' + (relHi ? ' fl478-hi' : '')}
          data-vx="relance"
          disabled={!!(!u.acted || u.sn || B.relance || B.voix < 2)}
        >
          <b>Relance</b>
          <span>2 Voix · rejouer</span>
        </button>
        <Hi html={s(vigilBtn420(u))} />
      </div>
      <Bag u={u} />
    </>
  );
}
