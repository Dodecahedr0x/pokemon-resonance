import { useLayoutEffect, useRef, useState } from 'react';
import { useKeyed } from '../../../lib/useKeyed.js';
import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/004-data.js';
import { BY, SCEN } from '../../../engine/009-pokemon.js';
import { isCamp } from '../../../engine/011-game-state.js';
import { ARENAS, BADGES } from '../../../engine/013-gyms.js';
import { medal } from '../../../engine/014-utils.js';
import { badgeSvg } from '../../../engine/019-league.js';
import { B } from '../../../engine/024-combat-ui.js';
import { calm472, nextGoal, rewHtml } from '../../../engine/026-campaign-tutorial-sound.js';
import { leaderOf } from '../../../engine/030-prestige-staging.js';
import { towerRun } from '../../../engine/043-adventure-plus.js';
import { duelUnder433, duelTitle433 } from '../../../engine/068-duel-tutorial.js';
import { IM448 } from '../../../engine/079-immersion-sound-haptics.js';
import { useBattleVersion } from './battleStore.js';

const NL = '\n  ';

// End-of-battle sheet (#cbResult), shown by finish() via the hidden attribute.
export default function Result() {
  const v = useBattleVersion('result');
  const S = useKeyed(() => B, [v]); // the finished battle, frozen for this sheet
  const card = useRef(null);
  // holographic edge, seal and burst (v4.72): applied on the next frame, once the sheet is visible
  const [deco, setDeco] = useState(null);
  useLayoutEffect(() => {
    if (!v || !S) return;
    const id = requestAnimationFrame(() => {
      const c = card.current;
      if (!c) return;
      const cs = getComputedStyle(c);
      const scrolls = /(auto|scroll)/.test(cs.overflowY) && c.scrollHeight > c.clientHeight + 2;
      setDeco({ v, rel: cs.position === 'static', holo: !scrolls, gerbe: c.classList.contains('win') && !calm472() });
    });
    return () => cancelAnimationFrame(id);
  }, [v, S]);
  return (
    <div className="result" id="cbResult" hidden>
      {v && S ? <Sheet S={S} cardRef={card} deco={deco && deco.v === v ? deco : null} /> : null}
    </div>
  );
}

function Sheet({ S, cardRef, deco }) {
  const win = S.over === 'win',
    evl = S.stats.evl || [],
    D = SCEN[S.sc],
    gy = D.gym != null,
    nb = !!(S.rew && S.rew.badgeNew),
    du = !!S.duel433;
  const L = leaderOf(S.sc);
  // victory (v4.48): flash, badge appearing, gold for a Champion
  const fx = win && IM448(),
    ia = ARENAS.findIndex(a => a.k === S.sc),
    nz = S._nzdead450; // Nuzlocke (v4.51)
  const cls =
    `res-card ${win ? 'win' : 'lose'}` +
    (fx ? ' fx448' : '') +
    (fx && /^(champ|jchamp|hchamp)$/.test(S.sc) ? ' gold448' : '') +
    (nz ? ' nz450d' : '');
  // Resonance Tower: go up or start over; elsewhere, the rest of the campaign
  const tower = S.sc === 'tdr',
    run = tower && towerRun();
  const [gk, gn] = !tower && isCamp() && win ? nextGoal() : [];
  return (
    <div
      ref={cardRef}
      className={cls}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resT"
      style={deco && deco.rel ? { position: 'relative' } : undefined}
    >
      {fx && S.rew && S.rew.badgeNew && ia >= 0 ? (
        <div className="rbadge448">
          <Html html={badgeSvg(ia, GYMS[ia].t, 'rb448')} />
        </div>
      ) : null}
      {S.rank ? (
        <div className={`rk-st rk-${S.rank}`} aria-label={`Rang ${S.rank}`}>
          <b>{S.rank}</b>
          <span>
            {S.rank === 'S' ? 'Parfait' : S.rank === 'A' ? 'Maîtrisé' : 'Victoire'}
            {S.rankNew ? ' · record' : ''}
          </span>
        </div>
      ) : null}
      <p className="kick">{SCEN[S.sc].n}</p>
      <h2 className="h1" id="resT">
        {du ? <Html html={duelTitle433(S)} /> : win ? 'Victoire' : S.fuite416 ? 'Il s’est enfui' : 'Défaite'}
      </h2>
      {L ? (
        <blockquote className="res-q">
          <q>
            <Html html={win ? L.w : L.l} />
          </q>
          <cite>
            {L.n}, {L.t}
          </cite>
        </blockquote>
      ) : null}
      {win && gy ? (
        <div className={'res-bdg' + (nb ? ' new' : '')}>
          <Html html={badgeSvg(D.gym, D.at, 'rb' + D.gym)} />
          <span>
            <b>Badge {D.at}</b>
            <em>{nb ? `Nouveau badge · ${BADGES.length} / 8` : 'Déjà dans la boîte à badges'}</em>
          </span>
        </div>
      ) : null}
      <p className="sub">
        {du ? (
          <Html html={duelUnder433(S)} />
        ) : win ? (
          S.round <= 4 ? (
            'Une victoire nette : le plan a tenu dès les premières manches.'
          ) : (
            'Le plan a tenu.'
          )
        ) : S.fuite416 ? (
          'Ses blessures restent : retrouvez-le sur la carte de Johto et finissez le travail.'
        ) : S.timeout ? (
          'Temps écoulé : l’adversaire a tenu sa position.'
        ) : (
          'L’adversaire a lu votre jeu. Changez de composition ou le moment de vos Éveils.'
        )}
      </p>
      {NL}
      <div className="res-k">
        <div>
          <b>{S.round}</b>
          <span>Manches</span>
        </div>
        <div>
          <b>{S.stats.evo}</b>
          <span>Éveils</span>
        </div>
        <div>
          <b>{S.stats.rx}</b>
          <span>Réactions</span>
        </div>
        <div>
          <b>{S.stats.ko}</b>
          <span>K.O. infligés</span>
        </div>
      </div>
      {NL}
      {evl.length ? (
        <div className="res-l">
          <h4>Éveils décisifs</h4>
          {evl.map(([a, b, r], i) => (
            <div key={i} className="rl">
              <Html html={medal(BY[a].t)} />
              <Html html={medal(BY[b].t)} />
              <span>
                {BY[a].n} → {BY[b].n}
              </span>
              <b>M{r}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">{du ? 'Aucun Éveil dans ce duel.' : 'Aucun Éveil ce combat : vos Pokémon ont gardé leur forme de départ.'}</p>
      )}
      {NL}
      <Html html={rewHtml(S.rew)} />
      {NL}
      {nz ? (
        <div className="nz450">
          <h4>Nuzlocke</h4>
          {nz.noms.length ? (
            <p>
              Tombé{nz.noms.length > 1 ? 's' : ''} au combat, définitivement : <b>{nz.noms.join(', ')}</b>.
            </p>
          ) : null}
          {nz.epargne ? <p>{nz.epargne} est votre dernier compagnon : il est épargné.</p> : null}
        </div>
      ) : null}
      <div className="res-a">
        {tower ? (
          run && run.reward ? (
            <button className="b b-gold" type="button" data-tdrn="reward">
              Récompense · étage {run.floor}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </button>
          ) : (
            <button className="b b-gold" type="button" data-tdrn="new">
              Nouvelle ascension
              <svg>
                <use href="#i-arrow" />
              </svg>
            </button>
          )
        ) : gk && gk !== S.sc ? (
          <button className="b b-gold" type="button" data-next={gk}>
            Suite : {gn}
            <svg>
              <use href="#i-arrow" />
            </svg>
          </button>
        ) : null}
        <button className="b" data-res="prep" type="button">
          {du ? 'Nouveau duel' : 'Changer d’équipe'}
        </button>
        {gy ? (
          <button className="b" data-res="ligue" type="button">
            Voir les arènes
          </button>
        ) : null}
        {tower ? null : (
          <button className="b b-gold" data-res="again" type="button">
            {du ? 'Revanche' : 'Rejouer'}
          </button>
        )}
      </div>
      {deco && deco.holo ? <i className="pk-holo" aria-hidden="true" /> : null}
      {deco ? <i className="pk-sceau" aria-hidden="true" /> : null}
      {deco && deco.gerbe ? (
        <span className="pk-gerbe" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <i
              key={i}
              style={{ '--a': `${Math.round(i * 22.5 + (i % 2) * 9)}deg`, '--r': `${-80 - (i % 3) * 26}px`, '--d': `${(0.32 + (i % 4) * 0.05).toFixed(2)}s` }}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
