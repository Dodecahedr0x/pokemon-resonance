import { Fragment } from 'react';
import { ITEMS2, PROFILE } from '../../engine/011-game-state.js';
import { tc } from '../../engine/014-utils.js';
import { MV } from '../../engine/005-moves.js';
import { SHOP, fmt, tLevel, today } from '../../engine/032-v4-foundation.js';
import { can454, txt454 } from '../../engine/084-peddler-route-missions.js';
import { COST455, LJ455, RECIPES455, fusionTargets455, commands455, donors455, canIn455, txtIn455, showcase455 } from '../../engine/088-workshop-recipes.js';
import { QO459, TROPH459, badgeCount459, qoIn459, qoOk459, qoRewTxt459, qoSt459, tpSt459 } from '../../engine/090-item-quests-trophies.js';
import { EGG461, egPool461, egSt461 } from '../../engine/092-companion-eggs-expeditions.js';
import { TAL464, TALMAX464, TALRESET464, talPts464, talSpent464, talSt464 } from '../../engine/095-trainer-talent-tree.js';
import { Disc } from './Items.jsx';

// Workshop row: text on the left, engine button on the right (data-at455, data-qo459…).
const Line = ({ cls = '', before: previous = null, children, actionButton: button }) => (
  <article className={'v4-it ' + cls}>{previous}<div className="v4-it-t">{children}</div><div className="v4-buy">{button}</div></article>
);

/* ---------- Workshop (v4.57): recipes, TM fusion, daily orders ---------- */
function Workshop() {
  const fusionTargets = fusionTargets455();
  return (
    <>
      <p className="v4-note">L’atelier du colporteur transforme vos objets. Les recettes, la fusion de CT et les commandes du jour s’y trouvent.</p>
      <h3 className="h3">Livre de recettes</h3>
      {RECIPES455.map(r => (
        <Line key={r.id} cls="at455-r" actionButton={<button type="button" className="v4-btn" data-at455={'rec:' + r.id} disabled={!(canIn455(r.in) && PROFILE.money >= r.m)}>Préparer</button>}>
          <b>{txtIn455(r.out)}</b><p>Avec : {txtIn455(r.in)}{r.m ? ` + ${fmt(r.m)} ₽` : ''}</p>
        </Line>
      ))}
      <h3 className="h3" style={{ marginTop: '14px' }}>Fusion de CT</h3>
      {fusionTargets.length ? (
        fusionTargets.map(k => {
          const d = donors455(k),
            ok = d && PROFILE.money >= 1000;
          return (
            <Line key={k} cls="at455-r" before={<Disc it={SHOP[k]} />} actionButton={<button type="button" className="v4-btn" data-at455={'fus:' + k} disabled={!ok}>Fusionner</button>}>
              <b>{SHOP[k].n}</b><p>{d ? 'Donne : ' + d.map(x => SHOP[x].sn).join(' et ') + ' + 1 000 ₽' : 'Il faut 2 autres CT dans le Sac.'}</p>
            </Line>
          );
        })
      ) : (
        <p className="v4-empty">Vous avez déjà toutes les CT.</p>
      )}
      <h3 className="h3" style={{ marginTop: '14px' }}>Commandes du jour</h3>
      {commands455().map(c => (
        <Line key={c.id} cls={'at455-r' + (c.done ? ' own' : '')} actionButton={<button type="button" className="v4-btn" data-at455={'cmd:' + c.id} disabled={!(!c.done && canIn455(c.in))}>{c.done ? 'Livrée' : 'Livrer'}</button>}>
          <b>Commande : {txtIn455(c.in)}</b><p>Récompense : {txt454(c.rew)}{c.done ? ' · livrée' : ''}</p>
        </Line>
      ))}
    </>
  );
}

/* ---------- Peddler's draw (v4.57) ---------- */
function Draw() {
  const st = LJ455('res-at455', { d: today(), cmd: {}, spin: 0 }),
    freeOfCharge = st.spin === 0,
    remainder = Math.max(0, 4 - st.spin);
  return (
    <>
      <h3 className="h3">Tirage du colporteur</h3>
      <p className="v4-note">Un tirage gratuit par jour. Ensuite, {fmt(COST455)} ₽ le tirage (4 par jour au maximum). Le résultat est fixé à l’avance : inutile de recharger la page.</p>
      {st.last ? <p className="v4-note tir455">Dernier lot : <b>{st.last}</b></p> : null}
      <div className="tir455">
        <button type="button" className="v4-btn" data-at455="spin" disabled={!(remainder > 0 && (freeOfCharge || PROFILE.money >= COST455))}>{remainder <= 0 ? 'Revenez demain' : freeOfCharge ? 'Tirage gratuit' : `Tirer · ${fmt(COST455)} ₽`}</button>
        <small>Tirages restants aujourd’hui : {remainder}</small>
      </div>
    </>
  );
}

/* ---------- Finds showcase (v4.57) ---------- */
function Showcase() {
  const { seen, tms: cts, cs } = showcase455(),
    held = Object.keys(ITEMS2),
    nh = held.filter(k => PROFILE.items.includes(k)).length,
    all = [...cts, ...cs],
    nc = all.filter(k => seen[k]).length;
  return (
    <section className="v4-panel vit455">
      <h3>Vitrine des trouvailles</h3>
      <p className="v4-note">Objets tenus : <b>{nh} / {held.length}</b> · CT et CS vues : <b>{nc} / {cts.length + cs.length}</b></p>
      <div className="vi455-g">
        {held.map(k => {
          const own = PROFILE.items.includes(k);
          return (
            <span key={k} className={'vi455' + (own ? ' on' : '')} title={ITEMS2[k].n + (own ? '' : ' (à trouver)')}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={ITEMS2[k].i} /></svg>
            </span>
          );
        })}
      </div>
      <div className="vc455-g">
        {all.map((k, i) => (
          <span key={i} className={'vc455' + (seen[k] ? ' on' : '')} title={SHOP[k].n + (seen[k] ? '' : ' (à trouver)')} style={{ '--c': tc(MV[SHOP[k].mv].t) }}>{SHOP[k].sn.replace(/^(CT|CS|DT)/, '')}</span>
        ))}
      </div>
    </section>
  );
}

/* ---------- Item quests (v4.59) ---------- */
function QuestItems() {
  const S = qoSt459(),
    nb = badgeCount459(),
    n = QO459.filter(q => S.done[q.id]).length;
  return (
    <>
      <h3 className="h3">Quêtes d’objets</h3>
      <p className="v4-note">Les habitants vous confient des services en échange d’objets rares. <b>{n} / {QO459.length}</b> quêtes terminées. De nouveaux habitants se présentent avec vos badges ({nb}).</p>
      {QO459.map(q => {
        const done = S.done[q.id],
          lock = nb < q.min,
          need = [txtIn455(qoIn459(q)), q.in.ct ? '1 CT de votre Sac' : ''].filter(Boolean).join(' + ');
        return (
          <Line key={q.id} cls={'qo459' + (done ? ' own' : '') + (lock ? ' lock' : '')} actionButton={<button type="button" className="v4-btn" data-qo459={q.id} disabled={!!(done || lock || !qoOk459(q))}>{done ? 'Terminée' : lock ? 'Verrouillée' : 'Livrer'}</button>}>
            <b>{q.giver}</b>
            <p>{lock ? `Se présentera après ${q.min} badge${q.min > 1 ? 's' : ''}.` : q.txt}</p>
            {lock ? null : <em>Il faut : {need} · Récompense : {qoRewTxt459(q.rew)}</em>}
          </Line>
        );
      })}
    </>
  );
}

/* ---------- Trophy case (v4.59) ---------- */
function Trophies() {
  const S = tpSt459();
  return (
    <>
      <h3 className="h3">Boîte de trophées</h3>
      {TROPH459.map(T => {
        const v = Math.min(T.v(), T.n),
          ok = T.v() >= T.n,
          done = S[T.id];
        return (
          <Line key={T.id} cls={'tp459' + (done ? ' own' : '')} actionButton={<button type="button" className="v4-btn" data-tp459={T.id} disabled={!(ok && !done)}>{done ? 'Récupéré' : ok ? 'Réclamer' : '—'}</button>}>
            <b>{T.t} · {T.n}</b>
            <i className="tp459-b"><u style={{ width: `${Math.round((v / T.n) * 100)}%` }} /></i>
            <p>{v} / {T.n} · +{T.g} Éclat{T.g > 1 ? 's' : ''}</p>
          </Line>
        );
      })}
      <Showcase />
    </>
  );
}

/* ---------- Breeding eggs (v4.61) ---------- */
function Eggs() {
  const s = egSt461(),
    isFree = egPool461().length;
  return (
    <>
      <h3 className="h3">Élevage</h3>
      <p className="v4-note">Les œufs éclosent en combattant, en entraînement comme en aventure. Trois œufs au maximum à la fois. Éclos : <b>{s.n}</b>. {isFree ? '' : 'Vous possédez déjà toutes les familles.'}</p>
      {s.list.length ? (
        <>
          <h4 className="h3">En incubation ({s.list.length} / 3)</h4>
          {s.list.map((e, i) => {
            const O = EGG461[e.k],
              p = Math.round(((e.tot - e.left) / e.tot) * 100);
            return (
              <article key={i} className="v4-it eg461">
                <div className="v4-it-t"><b>{O.n}</b><p>Éclosion dans {e.left} combat{e.left > 1 ? 's' : ''}.</p><div className="cp-bar"><i style={{ width: `${p}%` }} /></div></div>
              </article>
            );
          })}
        </>
      ) : null}
      <h4 className="h3">Acheter un œuf</h4>
      {Object.keys(EGG461).map(k => {
        const O = EGG461[k],
          ok = s.list.length < 3 && can454(O.cost) && isFree;
        return (
          <Line key={k} cls="eg461" actionButton={<button type="button" className="v4-btn" data-eg461={k} disabled={!ok}>{O.price}</button>}>
            <b>{O.n}</b><p>{O.d}</p>
          </Line>
        );
      })}
    </>
  );
}

/* ---------- Trainer abilities (v4.64) ---------- */
function Talents() {
  const st = talSt464(),
    pts = talPts464(),
    spent = talSpent464();
  return (
    <>
      <h3 className="h3">Talents du dresseur</h3>
      <p className="v4-note">Chaque niveau de dresseur donne 1 point. Niveau {tLevel()} : <b>{pts}</b> point{pts > 1 ? 's' : ''} à dépenser, {spent} dépensé{spent > 1 ? 's' : ''}. Les talents ne comptent pas dans les combats à règles fixes.</p>
      {TAL464.map(B => (
        <Fragment key={B.b}>
        <h4 className="h3">{B.n}</h4>
        {B.t.map(t => {
          const r = st[t.id];
          return (
            <Line key={t.id} cls="tal464" actionButton={<button type="button" className="v4-btn" data-tal464={t.id} disabled={r >= TALMAX464 || !pts}>{r >= TALMAX464 ? 'Max' : '+1'}</button>}>
              <b>{t.n} <span className="tal464-p">{[1, 2, 3].map(i => <i key={i} className={i <= r ? 'on' : ''} />)}</span></b>
              <p>{r ? t.d(r) : t.d(1)}{r < TALMAX464 && r ? <> <em>Rang suivant : {t.d(r + 1)}</em></> : null}</p>
            </Line>
          );
        })}
        </Fragment>
      ))}
      <div className="sv-io"><button type="button" className="b b-sm b-ghost" data-tal464="reset" disabled={!(spent && PROFILE.money >= TALRESET464)}>Réinitialiser · {TALRESET464} ₽</button></div>
    </>
  );
}

// Workshop "shop" tabs, in the final order of the versions (v4.57, v4.59, v4.61, v4.64).
export default function WorkshopTab({ c }) {
  if (c === 'talents') return <Talents />;
  if (c === 'oeufs') return <Eggs />;
  if (c === 'quetes') return <QuestItems />;
  if (c === 'trophees') return <Trophies />;
  if (c === 'jeux') return <Draw />;
  return <Workshop />;
}
