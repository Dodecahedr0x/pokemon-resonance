import { useLayoutEffect, useRef, useState } from 'react';
import { useKeyed } from '../../../lib/useKeyed.js';
import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/data/game-data.js';
import { BY, SCEN } from '../../../engine/pokemon/pokemon.js';
import { isCamp } from '../../../engine/state/game-state.js';
import { ARENAS, BADGES } from '../../../engine/modes/gyms.js';
import { medal } from '../../../engine/core/utils.js';
import { badgeSvg } from '../../../engine/modes/league.js';
import { B } from '../../../engine/combat/ui.js';
import { calmMotion } from '../../../engine/ui/preferences.js';
import { nextGoal } from '../../../engine/progression/campaign.js';
import { rewHtml } from '../../../engine/progression/battle-rewards.js';
import { leaderOf } from '../../../engine/progression/prestige.js';
import { towerRun } from '../../../engine/modes/resonance-tower.js';
import { duelUnder, duelTitle } from '../../../engine/modes/duel.js';
import { IMMERSION_ON } from '../../../engine/audio/immersion.js';
import { useBattleVersion } from './battleStore.js';

import Button from '../../../components/Button.jsx';
const NL = '\n  ';

// End-of-battle sheet (#cbResult), shown by finish() via the hidden attribute.
export default function Result() {
  const v = useBattleVersion('result');
  const S = useKeyed(() => B, [v]); // the finished battle, frozen for this sheet
  const card = useRef(null);
  // holographic edge, seal and confetti: applied on the next frame, once the sheet is visible
  const [deco, setDeco] = useState(null);
  useLayoutEffect(() => {
    if (!v || !S) {
      return;
    }
    const id = requestAnimationFrame(() => {
      const c = card.current;
      if (!c) {
        return;
      }
      const cs = getComputedStyle(c);
      const scrolls = /(auto|scroll)/.test(cs.overflowY) && c.scrollHeight > c.clientHeight + 2;
      setDeco({
        v,
        relics: cs.position === 'static',
        holo: !scrolls,
        confetti: c.classList.contains('is-win') && !calmMotion(),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [v, S]);
  return (
    <div className="modal battle-result" id="cbResult" hidden>
      {v && S ? <Sheet S={S} cardRef={card} decor={deco && deco.v === v ? deco : null} /> : null}
    </div>
  );
}

function Sheet({ S, cardRef, decor: deco }) {
  const win = S.over === 'win',
    evl = S.stats.evl || [],
    D = SCEN[S.sc],
    gy = D.gym != null,
    nb = !!(S.rew && S.rew.badgeNew),
    du = !!S.duel433;
  const L = leaderOf(S.sc);
  // victory (v4.48): flash, badge appearing, gold for a Champion
  const fx = win && IMMERSION_ON(),
    ia = ARENAS.findIndex(a => a.k === S.sc),
    nz = S._nuzlockeDeaths; // Nuzlocke (v4.51)
  const cls =
    `result-card ${win ? 'is-win' : 'is-loss'}` +
    (fx ? ' is-celebrating' : '') +
    (fx && /^(champ|jchamp|hchamp)$/.test(S.sc) ? ' is-champion' : '') +
    (nz ? ' is-nuzlocke' : '');
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
      style={deco && deco.relics ? { position: 'relative' } : undefined}
    >
      {fx && S.rew && S.rew.badgeNew && ia >= 0 ? (
        <div className="result-badge">
          <Html html={badgeSvg(ia, GYMS[ia].t, 'result-badge-svg')} />
        </div>
      ) : null}
      {S.rank ? (
        <div className={`result-rank is-rank-${S.rank.toLowerCase()}`} aria-label={`Rang ${S.rank}`}>
          <b>{S.rank}</b>
          <span>
            {S.rank === 'S' ? 'Parfait' : S.rank === 'A' ? 'Maîtrisé' : 'Victoire'}
            {S.rankNew ? ' · record' : ''}
          </span>
        </div>
      ) : null}
      <p className="kicker">{SCEN[S.sc].n}</p>
      <h2 className="title" id="resT">
        {du ? <Html html={duelTitle(S)} /> : win ? 'Victoire' : S.fled ? 'Il s’est enfui' : 'Défaite'}
      </h2>
      {L ? (
        <blockquote className="result-quote">
          <q>
            <Html html={win ? L.w : L.l} />
          </q>
          <cite>
            {L.n}, {L.t}
          </cite>
        </blockquote>
      ) : null}
      {win && gy ? (
        <div className={'result-badge-row' + (nb ? ' is-new' : '')}>
          <Html html={badgeSvg(D.gym, D.at, 'rb' + D.gym)} />
          <span>
            <b>Badge {D.at}</b>
            <em>{nb ? `Nouveau badge · ${BADGES.length} / 8` : 'Déjà dans la boîte à badges'}</em>
          </span>
        </div>
      ) : null}
      <p className="lead">
        {du ? (
          <Html html={duelUnder(S)} />
        ) : win ? (
          S.round <= 4 ? (
            'Une victoire nette : le plan a tenu dès les premières manches.'
          ) : (
            'Le plan a tenu.'
          )
        ) : S.fled ? (
          'Ses blessures restent : retrouvez-le sur la carte de Johto et finissez le travail.'
        ) : S.timeout ? (
          'Temps écoulé : l’adversaire a tenu sa position.'
        ) : (
          'L’adversaire a lu votre jeu. Changez de composition ou le moment de vos Éveils.'
        )}
      </p>
      {NL}
      <div className="result-stats">
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
        <div className="result-list">
          <h4>Éveils décisifs</h4>
          {evl.map(([a, b, r], i) => (
            <div key={i} className="result-row">
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
        <p className="empty">
          {du ? 'Aucun Éveil dans ce duel.' : 'Aucun Éveil ce combat : vos Pokémon ont gardé leur forme de départ.'}
        </p>
      )}
      {NL}
      <Html html={rewHtml(S.rew)} />
      {NL}
      {nz ? (
        <div className="nuzlocke-run">
          <h4>Nuzlocke</h4>
          {nz.names.length ? (
            <p>
              Tombé{nz.names.length > 1 ? 's' : ''} au combat, définitivement : <b>{nz.names.join(', ')}</b>.
            </p>
          ) : null}
          {nz.spared ? <p>{nz.spared} est votre dernier compagnon : il est épargné.</p> : null}
        </div>
      ) : null}
      <div className="result-actions">
        {tower ? (
          run && run.reward ? (
            <Button variant="primary" data-tdrn="reward">
              Récompense · étage {run.floor}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </Button>
          ) : (
            <Button variant="primary" data-tdrn="new">
              Nouvelle ascension
              <svg>
                <use href="#i-arrow" />
              </svg>
            </Button>
          )
        ) : gk && gk !== S.sc ? (
          <Button variant="primary" data-next={gk}>
            Suite : {gn}
            <svg>
              <use href="#i-arrow" />
            </svg>
          </Button>
        ) : null}
        <Button data-res="prep">{du ? 'Nouveau duel' : 'Changer d’équipe'}</Button>
        {gy ? <Button data-res="ligue">Voir les arènes</Button> : null}
        {tower ? null : (
          <Button variant="primary" data-res="again">
            {du ? 'Revanche' : 'Rejouer'}
          </Button>
        )}
      </div>
      {deco && deco.holo ? <i className="result-holo" aria-hidden="true" /> : null}
      {deco ? <i className="result-seal" aria-hidden="true" /> : null}
      {deco && deco.confetti ? (
        <span className="result-confetti" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <i
              key={i}
              style={{
                '--confetti-angle': `${Math.round(i * 22.5 + (i % 2) * 9)}deg`,
                '--confetti-distance': `${-80 - (i % 3) * 26}px`,
                '--confetti-delay': `${(0.32 + (i % 4) * 0.05).toFixed(2)}s`,
              }}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
