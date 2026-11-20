import { Fragment } from 'react';
import { ITEMS2, PROFILE } from '../../engine/state/game-state.js';
import { tc } from '../../engine/core/utils.js';
import { MV } from '../../engine/data/moves.js';
import { SHOP, fmt, today } from '../../engine/state/economy.js';
import { tLevel } from '../../engine/progression/trainer-stats.js';
import { canAfford, rewardText } from '../../engine/world/route-events.js';
import {
  FUSION_COST,
  loadToday,
  RECIPES,
  tmFusionTargets,
  dailyOrders,
  fusionDonors,
  hasIngredients,
  ingredientsText,
  tmShowcase,
} from '../../engine/items/workshop.js';
import {
  QUESTS,
  TROPHIES,
  badgeTotal,
  questCost,
  questUnlocked,
  questRewardText,
  questState,
  trophyState,
} from '../../engine/progression/item-quests.js';
import { EGG_SHOP, eggPool, eggState } from '../../engine/progression/companion-eggs.js';
import {
  TALENTS,
  TALENT_MAX,
  TALENT_RESET_COST,
  talentPoints,
  talentSpent,
  talentState,
} from '../../engine/progression/talent-tree.js';
import { Disc } from './Items.jsx';
import { space } from '../../lib/theme.js';

import Button from '../../components/Button.jsx';
// Workshop row: text on the left, engine button on the right (data-craft-bench, data-quest-log…).
// Styles: workshop.css and the shared item row.
const Line = ({ cls = '', before: previous = null, children, actionButton: button }) => (
  <article className={('item-row ' + cls).trim()}>
    {previous}
    <div className="item-row-text">{children}</div>
    <div>{button}</div>
  </article>
);

/* ---------- Workshop (v4.57): recipes, TM fusion, daily orders ---------- */
function Workshop() {
  const fusionTargets = tmFusionTargets();
  return (
    <>
      <p className="note">
        L’atelier du colporteur transforme vos objets. Les recettes, la fusion de CT et les commandes du jour s’y
        trouvent.
      </p>
      <h3 className="card-title">Livre de recettes</h3>
      {RECIPES.map(r => (
        <Line
          key={r.id}

          actionButton={
            <button
              type="button"
              className="pill-button"
              data-craft-bench={'rec:' + r.id}
              disabled={!(hasIngredients(r.in) && PROFILE.money >= r.m)}
            >
              Préparer
            </button>
          }
        >
          <b>{ingredientsText(r.out)}</b>
          <p>
            Avec : {ingredientsText(r.in)}
            {r.m ? ` + ${fmt(r.m)} ₽` : ''}
          </p>
        </Line>
      ))}
      <h3 className="card-title" style={{ marginTop: space.md }}>
        Fusion de CT
      </h3>
      {fusionTargets.length ? (
        fusionTargets.map(k => {
          const d = fusionDonors(k),
            ok = d && PROFILE.money >= 1000;
          return (
            <Line
              key={k}

              before={<Disc it={SHOP[k]} />}
              actionButton={
                <button type="button" className="pill-button" data-craft-bench={'fus:' + k} disabled={!ok}>
                  Fusionner
                </button>
              }
            >
              <b>{SHOP[k].n}</b>
              <p>
                {d
                  ? 'Donne : ' + d.map(x => SHOP[x].sn).join(' et ') + ' + 1 000 ₽'
                  : 'Il faut 2 autres CT dans le Sac.'}
              </p>
            </Line>
          );
        })
      ) : (
        <p className="empty-state">Vous avez déjà toutes les CT.</p>
      )}
      <h3 className="card-title" style={{ marginTop: space.md }}>
        Commandes du jour
      </h3>
      {dailyOrders().map(c => (
        <Line
          key={c.id}
          cls={c.done ? 'is-owned' : ''}
          actionButton={
            <button
              type="button"
              className="pill-button"
              data-craft-bench={'cmd:' + c.id}
              disabled={!(!c.done && hasIngredients(c.in))}
            >
              {c.done ? 'Livrée' : 'Livrer'}
            </button>
          }
        >
          <b>Commande : {ingredientsText(c.in)}</b>
          <p>
            Récompense : {rewardText(c.rew)}
            {c.done ? ' · livrée' : ''}
          </p>
        </Line>
      ))}
    </>
  );
}

/* ---------- Peddler's draw (v4.57) ---------- */
function Draw() {
  const st = loadToday('res-craft-bench', { d: today(), cmd: {}, spin: 0 }),
    freeOfCharge = st.spin === 0,
    remainder = Math.max(0, 4 - st.spin);
  return (
    <>
      <h3 className="card-title">Tirage du colporteur</h3>
      <p className="note">
        Un tirage gratuit par jour. Ensuite, {fmt(FUSION_COST)} ₽ le tirage (4 par jour au maximum). Le résultat est
        fixé à l’avance : inutile de recharger la page.
      </p>
      {st.last ? (
        <p className="note workshop-draw-last">
          Dernier lot : <b>{st.last}</b>
        </p>
      ) : null}
      <div className="workshop-draw">
        <button
          type="button"
          className="pill-button"
          data-craft-bench="spin"
          disabled={!(remainder > 0 && (freeOfCharge || PROFILE.money >= FUSION_COST))}
        >
          {remainder <= 0 ? 'Revenez demain' : freeOfCharge ? 'Tirage gratuit' : `Tirer · ${fmt(FUSION_COST)} ₽`}
        </button>
        <small>Tirages restants aujourd’hui : {remainder}</small>
      </div>
    </>
  );
}

/* ---------- Finds showcase (v4.57) ---------- */
function Showcase() {
  const { seen, tms: cts, cs } = tmShowcase(),
    held = Object.keys(ITEMS2),
    nh = held.filter(k => PROFILE.items.includes(k)).length,
    all = [...cts, ...cs],
    nc = all.filter(k => seen[k]).length;
  return (
    <section className="card workshop-showcase">
      <h3>Vitrine des trouvailles</h3>
      <p className="note">
        Objets tenus :{' '}
        <b>
          {nh} / {held.length}
        </b>{' '}
        · CT et CS vues :{' '}
        <b>
          {nc} / {cts.length + cs.length}
        </b>
      </p>
      <div className="workshop-showcase-items">
        {held.map(k => {
          const own = PROFILE.items.includes(k);
          return (
            <span
              key={k}
              className={'workshop-showcase-item' + (own ? ' is-on' : '')}
              title={ITEMS2[k].n + (own ? '' : ' (à trouver)')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d={ITEMS2[k].i} />
              </svg>
            </span>
          );
        })}
      </div>
      <div className="workshop-showcase-tms">
        {all.map((k, i) => (
          <span
            key={i}
            className={'workshop-showcase-tm' + (seen[k] ? ' is-on' : '')}
            title={SHOP[k].n + (seen[k] ? '' : ' (à trouver)')}
            style={{ '--c': tc(MV[SHOP[k].mv].t) }}
          >
            {SHOP[k].sn.replace(/^(CT|CS|DT)/, '')}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- Item quests (v4.59) ---------- */
function QuestItems() {
  const S = questState(),
    nb = badgeTotal(),
    n = QUESTS.filter(q => S.done[q.id]).length;
  return (
    <>
      <h3 className="card-title">Quêtes d’objets</h3>
      <p className="note">
        Les habitants vous confient des services en échange d’objets rares.{' '}
        <b>
          {n} / {QUESTS.length}
        </b>{' '}
        quêtes terminées. De nouveaux habitants se présentent avec vos badges ({nb}).
      </p>
      {QUESTS.map(q => {
        const done = S.done[q.id],
          lock = nb < q.min,
          need = [ingredientsText(questCost(q)), q.in.ct ? '1 CT de votre Sac' : ''].filter(Boolean).join(' + ');
        return (
          <Line
            key={q.id}
            cls={'workshop-quest' + (done ? ' is-owned' : '') + (lock ? ' is-locked' : '')}
            actionButton={
              <button
                type="button"
                className="pill-button"
                data-quest-log={q.id}
                disabled={!!(done || lock || !questUnlocked(q))}
              >
                {done ? 'Terminée' : lock ? 'Verrouillée' : 'Livrer'}
              </button>
            }
          >
            <b>{q.giver}</b>
            <p>{lock ? `Se présentera après ${q.min} badge${q.min > 1 ? 's' : ''}.` : q.txt}</p>
            {lock ? null : (
              <em>
                Il faut : {need} · Récompense : {questRewardText(q.rew)}
              </em>
            )}
          </Line>
        );
      })}
    </>
  );
}

/* ---------- Trophy case (v4.59) ---------- */
function Trophies() {
  const S = trophyState();
  return (
    <>
      <h3 className="card-title">Boîte de trophées</h3>
      {TROPHIES.map(T => {
        const v = Math.min(T.v(), T.n),
          ok = T.v() >= T.n,
          done = S[T.id];
        return (
          <Line
            key={T.id}
            cls={done ? 'is-owned' : ''}
            actionButton={
              <button type="button" className="pill-button" data-trophy-room={T.id} disabled={!(ok && !done)}>
                {done ? 'Récupéré' : ok ? 'Réclamer' : '—'}
              </button>
            }
          >
            <b>
              {T.t} · {T.n}
            </b>
            <i className="workshop-trophy-bar">
              <u style={{ width: `${Math.round((v / T.n) * 100)}%` }} />
            </i>
            <p>
              {v} / {T.n} · +{T.g} Éclat{T.g > 1 ? 's' : ''}
            </p>
          </Line>
        );
      })}
      <Showcase />
    </>
  );
}

/* ---------- Breeding eggs (v4.61) ---------- */
function Eggs() {
  const s = eggState(),
    isFree = eggPool().length;
  return (
    <>
      <h3 className="card-title">Élevage</h3>
      <p className="note">
        Les œufs éclosent en combattant, en entraînement comme en aventure. Trois œufs au maximum à la fois. Éclos :{' '}
        <b>{s.n}</b>. {isFree ? '' : 'Vous possédez déjà toutes les familles.'}
      </p>
      {s.list.length ? (
        <>
          <h4 className="card-title">En incubation ({s.list.length} / 3)</h4>
          {s.list.map((e, i) => {
            const O = EGG_SHOP[e.k],
              p = Math.round(((e.tot - e.left) / e.tot) * 100);
            return (
              <article key={i} className="item-row workshop-egg">
                <div className="item-row-text">
                  <b>{O.n}</b>
                  <p>
                    Éclosion dans {e.left} combat{e.left > 1 ? 's' : ''}.
                  </p>
                  <div className="cp-bar">
                    <i style={{ width: `${p}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </>
      ) : null}
      <h4 className="card-title">Acheter un œuf</h4>
      {Object.keys(EGG_SHOP).map(k => {
        const O = EGG_SHOP[k],
          ok = s.list.length < 3 && canAfford(O.cost) && isFree;
        return (
          <Line
            key={k}
            cls="workshop-egg"
            actionButton={
              <button type="button" className="pill-button" data-egg-shop={k} disabled={!ok}>
                {O.price}
              </button>
            }
          >
            <b>{O.n}</b>
            <p>{O.d}</p>
          </Line>
        );
      })}
    </>
  );
}

/* ---------- Trainer abilities (v4.64) ---------- */
function Talents() {
  const st = talentState(),
    pts = talentPoints(),
    spent = talentSpent();
  return (
    <>
      <h3 className="card-title">Talents du dresseur</h3>
      <p className="note">
        Chaque niveau de dresseur donne 1 point. Niveau {tLevel()} : <b>{pts}</b> point{pts > 1 ? 's' : ''} à dépenser,{' '}
        {spent} dépensé{spent > 1 ? 's' : ''}. Les talents ne comptent pas dans les combats à règles fixes.
      </p>
      {TALENTS.map(B => (
        <Fragment key={B.b}>
          <h4 className="card-title">{B.n}</h4>
          {B.t.map(t => {
            const r = st[t.id];
            return (
              <Line
                key={t.id}
                cls="workshop-talent"
                actionButton={
                  <button
                    type="button"
                    className="pill-button"
                    data-talent-tree={t.id}
                    disabled={r >= TALENT_MAX || !pts}
                  >
                    {r >= TALENT_MAX ? 'Max' : '+1'}
                  </button>
                }
              >
                <b>
                  {t.n}{' '}
                  <span className="workshop-talent-pips">
                    {[1, 2, 3].map(i => (
                      <i key={i} className={i <= r ? 'is-on' : undefined} />
                    ))}
                  </span>
                </b>
                <p>
                  {r ? t.d(r) : t.d(1)}
                  {r < TALENT_MAX && r ? (
                    <>
                      {' '}
                      <em>Rang suivant : {t.d(r + 1)}</em>
                    </>
                  ) : null}
                </p>
              </Line>
            );
          })}
        </Fragment>
      ))}
      <div className="button-row">
        <Button
          size="small"
          variant="ghost"
          data-talent-tree="reset"
          disabled={!(spent && PROFILE.money >= TALENT_RESET_COST)}
        >
          Réinitialiser · {TALENT_RESET_COST} ₽
        </Button>
      </div>
    </>
  );
}

// Workshop "shop" tabs, in the final order of the versions (v4.57, v4.59, v4.61, v4.64).
export default function WorkshopTab({ c }) {
  if (c === 'talents') {
    return <Talents />;
  }
  if (c === 'oeufs') {
    return <Eggs />;
  }
  if (c === 'quetes') {
    return <QuestItems />;
  }
  if (c === 'trophees') {
    return <Trophies />;
  }
  if (c === 'jeux') {
    return <Draw />;
  }
  return <Workshop />;
}
