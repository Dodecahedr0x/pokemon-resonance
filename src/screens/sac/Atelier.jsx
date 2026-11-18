import { Fragment } from 'react';
import { ITEMS2, PROFILE } from '../../engine/011-05-etat-de-partie.js';
import { tc } from '../../engine/014-08-outils.js';
import { MV } from '../../engine/005-02-capacites.js';
import { SHOP, fmt, tLevel, today } from '../../engine/032-v4-00-socle.js';
import { peut454, txt454 } from '../../engine/084-4-54-colporteur-rencontres-de-route-missions-de.js';
import { COUT455, LJ455, RECETTES455, ciblesFusion455, commandes455, donneurs455, peutIn455, txtIn455, vitrine455 } from '../../engine/088-4-57-atelier-recettes-commandes-tirage-vitrine-c.js';
import { QO459, TROPH459, nbBadge459, qoIn459, qoOk459, qoRewTxt459, qoSt459, tpSt459 } from '../../engine/090-4-59-quetes-d-objets-et-trophees.js';
import { OEUF461, egPool461, egSt461 } from '../../engine/092-4-61-compagnon-ufs-d-elevage-expeditions.js';
import { TAL464, TALMAX464, TALRESET464, talPts464, talSpent464, talSt464 } from '../../engine/095-4-64-arbre-de-talents-du-dresseur.js';
import { Disque } from './Articles.jsx';

// Ligne d'atelier : texte à gauche, bouton du moteur à droite (data-at455, data-qo459…).
const Ligne = ({ cls = '', avant = null, children, bouton }) => (
  <article className={'v4-it ' + cls}>{avant}<div className="v4-it-t">{children}</div><div className="v4-buy">{bouton}</div></article>
);

/* ---------- Atelier (v4.57) : recettes, fusion de CT, commandes du jour ---------- */
function Atelier() {
  const fus = ciblesFusion455();
  return (
    <>
      <p className="v4-note">L’atelier du colporteur transforme vos objets. Les recettes, la fusion de CT et les commandes du jour s’y trouvent.</p>
      <h3 className="h3">Livre de recettes</h3>
      {RECETTES455.map(r => (
        <Ligne key={r.id} cls="at455-r" bouton={<button type="button" className="v4-btn" data-at455={'rec:' + r.id} disabled={!(peutIn455(r.in) && PROFILE.money >= r.m)}>Préparer</button>}>
          <b>{txtIn455(r.out)}</b><p>Avec : {txtIn455(r.in)}{r.m ? ` + ${fmt(r.m)} ₽` : ''}</p>
        </Ligne>
      ))}
      <h3 className="h3" style={{ marginTop: '14px' }}>Fusion de CT</h3>
      {fus.length ? (
        fus.map(k => {
          const d = donneurs455(k),
            ok = d && PROFILE.money >= 1000;
          return (
            <Ligne key={k} cls="at455-r" avant={<Disque it={SHOP[k]} />} bouton={<button type="button" className="v4-btn" data-at455={'fus:' + k} disabled={!ok}>Fusionner</button>}>
              <b>{SHOP[k].n}</b><p>{d ? 'Donne : ' + d.map(x => SHOP[x].sn).join(' et ') + ' + 1 000 ₽' : 'Il faut 2 autres CT dans le Sac.'}</p>
            </Ligne>
          );
        })
      ) : (
        <p className="v4-empty">Vous avez déjà toutes les CT.</p>
      )}
      <h3 className="h3" style={{ marginTop: '14px' }}>Commandes du jour</h3>
      {commandes455().map(c => (
        <Ligne key={c.id} cls={'at455-r' + (c.done ? ' own' : '')} bouton={<button type="button" className="v4-btn" data-at455={'cmd:' + c.id} disabled={!(!c.done && peutIn455(c.in))}>{c.done ? 'Livrée' : 'Livrer'}</button>}>
          <b>Commande : {txtIn455(c.in)}</b><p>Récompense : {txt454(c.rew)}{c.done ? ' · livrée' : ''}</p>
        </Ligne>
      ))}
    </>
  );
}

/* ---------- Tirage du colporteur (v4.57) ---------- */
function Tirage() {
  const st = LJ455('res-at455', { d: today(), cmd: {}, spin: 0 }),
    gratuit = st.spin === 0,
    reste = Math.max(0, 4 - st.spin);
  return (
    <>
      <h3 className="h3">Tirage du colporteur</h3>
      <p className="v4-note">Un tirage gratuit par jour. Ensuite, {fmt(COUT455)} ₽ le tirage (4 par jour au maximum). Le résultat est fixé à l’avance : inutile de recharger la page.</p>
      {st.last ? <p className="v4-note tir455">Dernier lot : <b>{st.last}</b></p> : null}
      <div className="tir455">
        <button type="button" className="v4-btn" data-at455="spin" disabled={!(reste > 0 && (gratuit || PROFILE.money >= COUT455))}>{reste <= 0 ? 'Revenez demain' : gratuit ? 'Tirage gratuit' : `Tirer · ${fmt(COUT455)} ₽`}</button>
        <small>Tirages restants aujourd’hui : {reste}</small>
      </div>
    </>
  );
}

/* ---------- Vitrine des trouvailles (v4.57) ---------- */
function Vitrine() {
  const { seen, cts, cs } = vitrine455(),
    held = Object.keys(ITEMS2),
    nh = held.filter(k => PROFILE.items.includes(k)).length,
    toutes = [...cts, ...cs],
    nc = toutes.filter(k => seen[k]).length;
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
        {toutes.map((k, i) => (
          <span key={i} className={'vc455' + (seen[k] ? ' on' : '')} title={SHOP[k].n + (seen[k] ? '' : ' (à trouver)')} style={{ '--c': tc(MV[SHOP[k].mv].t) }}>{SHOP[k].sn.replace(/^(CT|CS|DT)/, '')}</span>
        ))}
      </div>
    </section>
  );
}

/* ---------- Quêtes d'objets (v4.59) ---------- */
function QuetesObjets() {
  const S = qoSt459(),
    nb = nbBadge459(),
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
          <Ligne key={q.id} cls={'qo459' + (done ? ' own' : '') + (lock ? ' lock' : '')} bouton={<button type="button" className="v4-btn" data-qo459={q.id} disabled={!!(done || lock || !qoOk459(q))}>{done ? 'Terminée' : lock ? 'Verrouillée' : 'Livrer'}</button>}>
            <b>{q.qui}</b>
            <p>{lock ? `Se présentera après ${q.min} badge${q.min > 1 ? 's' : ''}.` : q.txt}</p>
            {lock ? null : <em>Il faut : {need} · Récompense : {qoRewTxt459(q.rew)}</em>}
          </Ligne>
        );
      })}
    </>
  );
}

/* ---------- Boîte de trophées (v4.59) ---------- */
function Trophees() {
  const S = tpSt459();
  return (
    <>
      <h3 className="h3">Boîte de trophées</h3>
      {TROPH459.map(T => {
        const v = Math.min(T.v(), T.n),
          ok = T.v() >= T.n,
          done = S[T.id];
        return (
          <Ligne key={T.id} cls={'tp459' + (done ? ' own' : '')} bouton={<button type="button" className="v4-btn" data-tp459={T.id} disabled={!(ok && !done)}>{done ? 'Récupéré' : ok ? 'Réclamer' : '—'}</button>}>
            <b>{T.t} · {T.n}</b>
            <i className="tp459-b"><u style={{ width: `${Math.round((v / T.n) * 100)}%` }} /></i>
            <p>{v} / {T.n} · +{T.g} Éclat{T.g > 1 ? 's' : ''}</p>
          </Ligne>
        );
      })}
      <Vitrine />
    </>
  );
}

/* ---------- Œufs d'élevage (v4.61) ---------- */
function Oeufs() {
  const s = egSt461(),
    libre = egPool461().length;
  return (
    <>
      <h3 className="h3">Élevage</h3>
      <p className="v4-note">Les œufs éclosent en combattant, en entraînement comme en aventure. Trois œufs au maximum à la fois. Éclos : <b>{s.n}</b>. {libre ? '' : 'Vous possédez déjà toutes les familles.'}</p>
      {s.list.length ? (
        <>
          <h4 className="h3">En incubation ({s.list.length} / 3)</h4>
          {s.list.map((e, i) => {
            const O = OEUF461[e.k],
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
      {Object.keys(OEUF461).map(k => {
        const O = OEUF461[k],
          ok = s.list.length < 3 && peut454(O.cost) && libre;
        return (
          <Ligne key={k} cls="eg461" bouton={<button type="button" className="v4-btn" data-eg461={k} disabled={!ok}>{O.prix}</button>}>
            <b>{O.n}</b><p>{O.d}</p>
          </Ligne>
        );
      })}
    </>
  );
}

/* ---------- Talents du dresseur (v4.64) ---------- */
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
            <Ligne key={t.id} cls="tal464" bouton={<button type="button" className="v4-btn" data-tal464={t.id} disabled={r >= TALMAX464 || !pts}>{r >= TALMAX464 ? 'Max' : '+1'}</button>}>
              <b>{t.n} <span className="tal464-p">{[1, 2, 3].map(i => <i key={i} className={i <= r ? 'on' : ''} />)}</span></b>
              <p>{r ? t.d(r) : t.d(1)}{r < TALMAX464 && r ? <> <em>Rang suivant : {t.d(r + 1)}</em></> : null}</p>
            </Ligne>
          );
        })}
        </Fragment>
      ))}
      <div className="sv-io"><button type="button" className="b b-sm b-ghost" data-tal464="reset" disabled={!(spent && PROFILE.money >= TALRESET464)}>Réinitialiser · {TALRESET464} ₽</button></div>
    </>
  );
}

// Onglets « boutique » de l'atelier, dans l'ordre final des versions (v4.57, v4.59, v4.61, v4.64).
export default function OngletAtelier({ c }) {
  if (c === 'talents') return <Talents />;
  if (c === 'oeufs') return <Oeufs />;
  if (c === 'quetes') return <QuetesObjets />;
  if (c === 'trophees') return <Trophees />;
  if (c === 'jeux') return <Tirage />;
  return <Atelier />;
}
