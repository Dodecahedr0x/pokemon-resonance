import { useMemo } from 'react';
import { Html } from '../../lib/html.jsx';
import { useEngineReady } from '../../engineReady.js';
import { useEquipe } from './equipeStore.js';
import { EL, MK, MX, RX, dexNo } from '../../engine/004-01-donnees.js';
import { MV, SHAPE, TAL } from '../../engine/005-02-capacites.js';
import { REGN } from '../../engine/008-v4-19-00-hoenn-donnees.js';
import { BY, NOTES, famOf } from '../../engine/009-03-pokemon.js';
import { ARR } from '../../engine/010-04-evolution-en-combat.js';
import { ITEMS2, LINK_N, LINK_T, PROFILE, inBox, isCamp, lvlOfPts, ownedItems } from '../../engine/011-05-etat-de-partie.js';
import { RC, ROLEFX, rIco } from '../../engine/012-06-recrues-roles-synergies.js';
import { markOf, medal, tb, tc } from '../../engine/014-08-outils.js';
import { BRANCHES } from '../../engine/021-14-moteur-combat.js';
import { STLN, branchNote, crestSmall, evoDiff, monEls, monMarks, nextOf, squad } from '../../engine/020-13-equipe-cartes.js';
import { HELD_IMG, ITM } from '../../engine/032-v4-00-socle.js';
import { capaciteApprise } from '../../engine/045-v4-6-01-ct-cs.js';
import { caractereHtml } from '../../engine/049-v4-10-01-identite.js';
import { RANGS, etoiles, rangId } from '../../engine/053-v4-14-01-resonance.js';
import { duoDe416 } from '../../engine/055-v4-16-01-johto-vivant.js';
import { lieuCapture421 } from '../../engine/061-v4-21-01-capture-partout.js';

// Fiche d'un Pokémon (#sheet / #sh). Ouverture, fermeture, focus et défilement : openSheet /
// closeSheet du moteur ; clics (data-close, data-open, data-rx, data-qa, data-eq) : écouteur du
// moteur sur #sheet, qui reste monté. Fermée, la fiche garde son dernier contenu (ancien DOM).
export default function Fiche() {
  const ready = useEngineReady();
  const { open, id, sheet } = useEquipe();
  const contenu = useMemo(() => (ready && id ? <Contenu id={id} /> : null), [ready, id, sheet]);
  return (
    <div className="sheet" id="sheet" hidden={!open}>
      <div className="scrim" data-close="" />
      <div
        className="sh"
        id="sh"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shName"
        style={ready && id ? { '--c': tc(BY[id].t[0]) } : undefined}
      >
        {contenu}
      </div>
    </div>
  );
}

const T = s => <Html html={s} />;

function Contenu({ id }) {
  const m = BY[id],
    base = BY[m.base];
  const prep = [],
    trig = [];
  monMarks(m).forEach(k =>
    MX[k].forEach(r => {
      if (r && r !== 'ren' && !prep.includes(r)) prep.push(r);
    })
  );
  monEls(m).forEach(e => {
    const i = EL.indexOf(e);
    MK.forEach(k => {
      const r = MX[k.id][i];
      if (r && r !== 'ren' && !trig.includes(r)) trig.push(r);
    });
  });
  const rl = arr =>
    arr.map(r => (
      <button key={r} type="button" className={`chip cat-${RX[r].k}`} data-rx={r}>
        <i />
        {RX[r].n}
      </button>
    ));
  const tl = TAL[m.tal],
    fam = famOf(id),
    nx = nextOf(m),
    rg = rangId(m.id);
  const pn = m.st > 1 ? branchNote(m.prev, id) : '';
  return (
    <>
      <div className="sh-hero">
        <div className="grab" />
        <button className="sh-x" type="button" data-close="" aria-label="Fermer la fiche">
          <svg>
            <use href="#i-x" />
          </svg>
        </button>
        <span className="sh-no">
          {dexNo(m.no)} · {REGN[m.gen] || 'Johto'} · stade {m.st}
        </span>
        <div className="sh-crest">{T(crestSmall(m))}</div>
        <h2 className="sh-name" id="shName">
          {m.n}
        </h2>
        <p className="sh-epi">
          {m.r} · {m.r2}
        </p>
        <p className="sh-role sh-rgp">
          <span className={`rg-ic rg rg-${rg}`}>{etoiles(rg)}</span>
          <span>
            <b>
              Rang {RANGS[rg].n} · {RANGS[rg].k}
            </b>{' '}
            · {T(RANGS[rg].d)}
          </span>
        </p>
        {ROLEFX[m.r] ? (
          <p className="sh-role">
            {T(rIco(m.r))}
            <span>
              <b>{ROLEFX[m.r].k}</b> · {T(ROLEFX[m.r].d)}
            </span>
          </p>
        ) : null}
        <div className="sh-tags">
          {m.t.map(t => (
            <Html key={t} html={tb(t)} />
          ))}
        </div>
      </div>
      <div className="sh-sec">
        <div className="stabs" role="tablist" aria-label="Stades de la famille">
          {fam.map(x => (
            <button key={x.id} type="button" role="tab" aria-selected={x.id === id} className={`stab${x.id === id ? ' on' : ''}`} data-open={x.id}>
              <Html html={medal(x.t, 'sm')} />
              <span>
                <b>{x.n}</b>
                <em>{x.st === 1 ? 'Recrue' : 'Éveil ' + (x.st - 1)}</em>
              </span>
            </button>
          ))}
        </div>
        {m.st === 1 ? (
          <p className="how ok">
            Se recrute pour {m.c} PC.{nx.length ? ' Il évolue en combat ; ses formes évoluées se recrutent aussi directement, plus cher.' : ''}
          </p>
        ) : (
          <>
            <p className="how">
              S’obtient en combat par l’Éveil de <b>{BY[m.prev].n}</b>
              {pn ? ' (' + pn + ')' : ''}.{' '}
              {inBox(id)
                ? `Recrue confirmée : se recrute aussi directement pour ${RC(id)} PC, sans Arrivée ni soin d’Éveil.`
                : `Se recrute directement (${RC(id)} PC) une fois ${base.n} capturé.`}
            </p>
            <Evd a={m.prev} b={id} from />
          </>
        )}
      </div>
      <Extras base={base} />
      <div className="sh-sec">
        <h4>
          Capacités<span>{m.mv.length}</span>
        </h4>
        {m.mv.map(x => (
          <MvCard key={x} id={x} />
        ))}
        {T(capaciteApprise(id))}
        {T(caractereHtml(id))}
        {tl ? (
          <div className="mvc tal">
            <div className="t">
              <b>{tl[0]}</b>
              <span className="chip">Talent</span>
            </div>
            <p>{T(tl[1])}</p>
          </div>
        ) : null}
      </div>
      {nx.length ? (
        <div className="sh-sec">
          <h4>
            Éveil suivant<span>{nx.length > 1 ? nx.length + ' voies' : 'irréversible'}</span>
          </h4>
          <p className="empty">
            {m.nx === 'eevee'
              ? 'Ses 5 évolutions sont au choix au moment de l’Éveil. En harmonie avec sa case (Trempée : Aquali, Chargée : Voltali, Brûlante : Pyroli) ou avec l’heure (Mentali le jour, Noctali la nuit), il garde 1 losange.'
              : BRANCHES[m.id]
                ? BRANCHES[m.id]
                    .map(b => `${BY[b.id].n} : ${/^PV/.test(b.why) ? b.why : b.why[0].toLowerCase() + b.why.slice(1)}${b.def ? ' (voie par défaut)' : ''}`)
                    .join(' · ') + '. Une seule sera prise.'
                : Array.isArray(m.nx)
                  ? 'Deux voies au choix : une seule sera prise.'
                  : 'Trois losanges d’énergie, 1 Voix et son action.'}
          </p>
          {nx.map(x => (
            <Evd key={x} a={id} b={x} />
          ))}
        </div>
      ) : null}
      <div className="sh-sec">
        <h4>
          Statistiques<span>PV en combat : {20 + m.s[0] * 8}</span>
        </h4>
        <div className="stats">
          {m.s.map((v, i) => (
            <div key={i} className="sr">
              <span>{STLN[i]}</span>
              <div className="sbar">
                <i style={{ width: `${v * 20}%`, animationDelay: `${i * 60}ms` }} />
              </div>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
      {NOTES[id] || prep.length || trig.length ? (
        <div className="sh-sec">
          <h4>Lecture tactique</h4>
          {NOTES[id] ? <p className="note">{T(NOTES[id])}</p> : null}
          {prep.length ? (
            <>
              <h4>Prépare</h4>
              <div className="presets">{rl(prep)}</div>
            </>
          ) : null}
          {trig.length ? (
            <>
              <h4>Déclenche</h4>
              <div className="presets">{rl(trig)}</div>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="sh-act">
        <Action m={m} base={base} id={id} />
      </div>
    </>
  );
}

// Recruter, remplacer ou retirer ce stade.
function Action({ m, base, id }) {
  const cur = squad.find(x => BY[x].base === base.id),
    onM = cur === id,
    ok = inBox(id);
  return (
    <button className={`b ${onM ? '' : 'b-gold'}`} type="button" data-qa={id} disabled={!onM && !ok}>
      {onM
        ? `Retirer ${m.n} de l’équipe`
        : ok
          ? `${cur ? 'Remplacer ' + BY[cur].n + ' par ' : 'Recruter '}${m.n} · ${RC(id)} PC`
          : m.st > 1 && isCamp() && inBox(base.id)
            ? `${m.n} : à éveiller en combat d’abord`
            : `${base.n} : à capturer${lieuCapture421(base.id) ? ' · ' + lieuCapture421(base.id) : ''}`}
    </button>
  );
}

// Carte d'une capacité (ancien mvCard).
function MvCard({ id }) {
  const m = MV[id];
  const sp = [m.p ? `Puissance ${m.p}` : m.fix ? `${m.fix} fixes` : 'Effet', SHAPE[m.sh] + (m.r ? ' ' + m.r : ''), m.mk ? markOf(m.mk).n : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="mvc">
      <div className="t">
        <b>{m.n}</b>
        {T(tb(m.t))}
      </div>
      <span className="mvs">{sp}</span>
      <p>{T(m.d)}</p>
    </div>
  );
}

// Ce que change un Éveil (ancien diffHtml). `from` : l'Éveil qui a mené à ce stade, en encart.
function Evd({ a, b, from }) {
  const D = evoDiff(a, b),
    B2 = BY[b],
    note = branchNote(a, b);
  const Tag = from ? 'div' : 'button';
  return (
    <Tag type={from ? undefined : 'button'} className={from ? 'evd from' : 'evd'} data-open={b}>
      <div className="evd-h">
        <Html html={medal(B2.t)} />
        <b>{B2.n}</b>
        {note ? <em>{note}</em> : null}
      </div>
      <ul>
        {D.gain.length ? (
          <li className="gain">
            <span>Gagne</span>
            {D.gain.map(x => MV[x].n).join(', ')}
          </li>
        ) : null}
        {D.lose.length ? (
          <li className="lose">
            <span>Perd</span>
            {D.lose.map(x => MV[x].n).join(', ')}
          </li>
        ) : null}
        {D.tg.length || D.tl.length ? (
          <li>
            <span>Types</span>
            {D.tg.length ? '+' + D.tg.join(', ') : ''}
            {D.tl.length ? (D.tg.length ? ' · ' : '') + '−' + D.tl.join(', ') : ''}
          </li>
        ) : null}
        {D.tal ? (
          <li>
            <span>Talent</span>
            {TAL[D.tal][0]}
          </li>
        ) : null}
        {D.role ? (
          <li>
            <span>Rôle</span>
            {D.role}
          </li>
        ) : null}
        <li>
          <span>PV max</span>
          {D.hp >= 0 ? '+' : ''}
          {D.hp}
        </li>
        {ARR[b] ? (
          <li className="arr">
            <span>Arrivée</span>
            {T(ARR[b][1])}
          </li>
        ) : null}
      </ul>
    </Tag>
  );
}

// Icône d'objet illustrée (ancien itemizeDom sur la fiche) ; sans image, on la masque.
function ItemImg({ k }) {
  const k2 = Object.keys(ITEMS2).find(x => ITEMS2[x].i === ITEMS2[k].i) || k;
  return <img className="it-img" src={ITM(HELD_IMG[k2])} alt="" loading="lazy" onError={e => (e.currentTarget.style.display = 'none')} />;
}

// Objet tenu, fatigue et liens (ancien sheetExtras, v1.0).
function Extras({ base }) {
  const own = inBox(base.id),
    its = ownedItems(),
    cur = PROFILE.equip[base.id],
    fat = isCamp() ? PROFILE.fatigue[base.id] || 0 : 0;
  const mates = Object.entries(PROFILE.links)
    .filter(([k]) => k.split('|').includes(base.id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <>
      <div className="sh-sec">
        <h4>
          Objet tenu
          <span>
            {its.length} disponible{its.length > 1 ? 's' : ''}
          </span>
        </h4>
        {own ? (
          its.length ? (
            <div className="eq-l">
              {its.map(k => {
                const holder = Object.keys(PROFILE.equip).find(x => PROFILE.equip[x] === k && x !== base.id);
                return (
                  <button key={k} type="button" className={`eq${cur === k ? ' on' : ''}`} data-eq={base.id} data-it={cur === k ? '' : k}>
                    <span className="it-ic">
                      <ItemImg k={k} />
                    </span>
                    <span>
                      <b>{ITEMS2[k].n}</b>
                      <em>
                        {T(ITEMS2[k].d)}
                        {holder ? ` · tenu par ${BY[holder].n}` : ''}
                      </em>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty">Aucun objet pour l’instant : les badges en rapportent, la Boutique en vend.</p>
          )
        ) : (
          <p className="empty">{base.n} doit d’abord être capturé.</p>
        )}
        {fat ? (
          <p className={`how${fat >= 70 ? '' : ' ok'}`}>
            Fatigue {fat} %{fat >= 70 ? ' : −1 Mouvement au prochain combat. Laissez-le se reposer un combat, ou faites-le évoluer.' : ''}
          </p>
        ) : null}
      </div>
      {mates.length ? (
        <div className="sh-sec">
          <h4>
            Liens<span>{mates.length}</span>
          </h4>
          {mates.map(([k, v]) => {
            const o = k.split('|').find(x => x !== base.id) || base.id,
              l = lvlOfPts(v),
              D = duoDe416(k);
            return (
              <div key={k} className="lk-row">
                <Html html={medal(BY[o].t, 'sm')} />
                <span>
                  <b>{BY[o].n}</b>
                  <em>
                    {l ? LINK_N[l] : 'Pas encore de palier'} · {v} point{v > 1 ? 's' : ''}
                    {D ? ` · duo : ${D.n}${l >= 3 ? '' : ' (palier Duo)'}` : ''}
                  </em>
                </span>
                <span className="lk-bar">
                  <i style={{ width: `${Math.min(100, (v / LINK_T[2]) * 100)}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
