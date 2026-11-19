/* Section d'origine : v4.6-01-ct-cs.js */

import { MV } from './005-02-capacites.js';
import { BY, famOf } from './009-03-pokemon.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { $, toast } from './014-08-outils.js';
import { openId, openSheet } from './020-13-equipe-cartes.js';
import { queueSave } from './025-19-sauvegardes.js';
import { sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { SHOP, bagN } from './032-v4-00-socle.js';
import { renderBag } from './039-v4-07-quetes-boutique.js';
import { heritage416 } from './055-v4-16-01-johto-vivant.js';

export let MACHINES, avecApprise;
let typesFamille, famillesEleves, CT_K;


/* ---------- état de la partie ---------- */
/** famille (forme de base) → capacité apprise. Fonction déclarée : defProfile l'appelle dès le chargement. */
export function CT0() {
  return { apprises: {} };
}


export function ctClean(p) {
  const o = CT0(),
    a = p && p.apprises;
  if (a && typeof a === 'object') for (const b in a) if (BY[b] && MV[a[b]]) o.apprises[b] = a[b];
  return o;
}


function compatible(k, base) {
  const M = MACHINES[k];
  if (!M || !BY[base]) return false;
  if (M.tous) return true;
  if ((M.familles || []).some(f => BY[f] && BY[f].base === base)) return true;
  return typesFamille(base).some(t => M.types.includes(t));
}


/* ---------- en combat : la capacité apprise s'ajoute aux deux capacités de la forme ---------- */
export function ajouterApprises(S, apprises) {
  if (!apprises) return;
  S.units.forEach(u => {
    const m = u.side === 'a' && apprises[u.sp];
    if (!m || !MV[m]) return;
    u.ctm = m;
    if (!u.mv.includes(m)) u.mv.push(m);
  });
}


function ouvrirApprentissage(k) {
  CT_K = k;
  renderApprentissage();
  $('#ctBox').hidden = false;
}


function renderApprentissage() {
  const k = CT_K,
    M = MACHINES[k],
    m = MV[M.mv],
    fams = famillesEleves().sort((a, b) => compatible(k, b) - compatible(k, a));
  // rendu : src/screens/overlays/CtBox.jsx
  paintOverlay('ct', { M, m, fams: fams.map(b => ({ b, ok: compatible(k, b), deja: PROFILE.apprises[b] })) });
}


function apprendreCT(k, b) {
  const M = MACHINES[k];
  if (!M || !compatible(k, b) || !bagN(k)) return;
  const avant = PROFILE.apprises[b];
  PROFILE.apprises[b] = M.mv;
  if (!M.cs) {
    PROFILE.bag[k] = bagN(k) - 1;
    if (!PROFILE.bag[k]) delete PROFILE.bag[k];
  }
  sfx('ui');
  vibe(20);
  toast(`${BY[b].n} apprend ${MV[M.mv].n}${avant ? ` à la place de ${MV[avant].n}` : ''} !`);
  queueSave();
  $('#ctBox').hidden = true;
  renderBag();
}


function oublierCT(b) {
  if (!PROFILE.apprises[b]) return;
  toast(`${BY[b].n} oublie ${MV[PROFILE.apprises[b]].n}.`);
  delete PROFILE.apprises[b];
  queueSave();
}


/** Dans la fiche d'un Pokémon : sa capacité apprise. */
export function capaciteApprise(id) {
  const b = BY[id] && BY[id].base,
    a = b && PROFILE.apprises[b];
  if (!a) return heritage416(b); // capacité héritée (v4.16)
  const M = Object.values(MACHINES).find(x => x.mv === a);
  return `<div class="mvc ct-mvc"><div class="t"><b>${MV[a].n}</b><span class="chip">${M ? M.num : 'Apprise'}</span></div><p>${MV[a].d}</p><button type="button" class="b b-sm b-ghost" data-ctoubli="${b}">Oublier</button></div>` + heritage416(b);
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.6 : CT et CS
   ---------------------------------------------------------------------
   La Boutique vend des CT (Pokédollars, usage unique, comme en 2e
   génération) et des CS (Éclats, réutilisables). Depuis le Sac, une
   machine s'apprend à une famille compatible : la capacité devient sa
   3e capacité, gardée à tous les stades, Éveil compris.
   Une famille a un seul emplacement de capacité apprise : en apprendre
   une autre la remplace.
   Compatibilité : selon les types de la famille (tous stades confondus),
   plus quelques familles connues pour l'apprendre dans les jeux.
   ===================================================================== */

/* ---------- capacités des CS qui n'existaient pas encore ---------- */
Object.assign(MV, {
  coupe: {
    n: 'Coupe',
    t: 'Normal',
    p: 7,
    r: 1,
    sh: 'one',
    fx: 'cut',
    d: 'Au contact. Fauche les hautes herbes de la case visée.'
  },
  force: { n: 'Force', t: 'Normal', p: 9, r: 1, sh: 'one', fx: 'push', v: 2, d: 'Au contact, repousse de 2 cases.' },
  cascade: { n: 'Cascade', t: 'Eau', p: 9, r: 1, sh: 'one', mk: 'trempe', d: 'Au contact, Trempé.' }
});


/* ---------- les machines (numéros de Johto) ---------- */
MACHINES = {
  ct01: { num: 'CT01', mv: 'dynamopoing', p: 3000, types: ['Combat', 'Psy', 'Roche', 'Normal'] },
  ct11: { num: 'CT11', mv: 'zenith', p: 2000, tous: true },
  ct14: { num: 'CT14', mv: 'blizzard', p: 4000, types: ['Glace', 'Eau'] },
  ct18: { num: 'CT18', mv: 'dansepluie', p: 2000, tous: true },
  ct22: { num: 'CT22', mv: 'lancesoleil', p: 3500, types: ['Plante'] },
  ct23: { num: 'CT23', mv: 'queuedefer', p: 3000, types: ['Acier', 'Électrik', 'Dragon', 'Roche', 'Sol'] },
  ct26: { num: 'CT26', mv: 'seisme', p: 4000, types: ['Sol', 'Roche', 'Combat', 'Dragon', 'Normal'] },
  ct29: {
    num: 'CT29',
    mv: 'psyko',
    p: 3500,
    types: ['Psy', 'Spectre'],
    familles: ['ramoloss', 'lokhlass', 'melo', 'ptitard', 'ronflex', 'porygon']
  },
  ct30: { num: 'CT30', mv: 'ballombre', p: 3500, types: ['Spectre', 'Psy', 'Ténèbres'] },
  ct31: {
    num: 'CT31',
    mv: 'coudboue',
    p: 1500,
    types: ['Sol', 'Roche', 'Eau', 'Électrik', 'Feu', 'Normal', 'Combat', 'Poison']
  },
  ct37: { num: 'CT37', mv: 'sable', p: 2000, types: ['Sol', 'Roche', 'Acier'] },
  ct41: { num: 'CT41', mv: 'poingeclair', p: 3000, types: ['Électrik', 'Combat', 'Psy'] },
  cs01: {
    num: 'CS01',
    mv: 'coupe',
    g: 8,
    cs: true,
    types: ['Plante', 'Insecte', 'Normal', 'Feu', 'Eau', 'Sol', 'Ténèbres', 'Acier']
  },
  cs03: { num: 'CS03', mv: 'surf', g: 12, cs: true, types: ['Eau', 'Dragon'], familles: ['ronflex'] },
  cs04: {
    num: 'CS04',
    mv: 'force',
    g: 10,
    cs: true,
    types: ['Combat', 'Roche', 'Sol', 'Normal', 'Dragon', 'Feu', 'Eau']
  },
  cs07: { num: 'CS07', mv: 'cascade', g: 10, cs: true, types: ['Eau'] }
};


// elles se rangent dans la Boutique et le Sac comme les autres objets
for (const k in MACHINES) {
  const M = MACHINES[k],
    m = MV[M.mv];
  SHOP[k] = {
    n: `${M.num} · ${m.n}`,
    sn: M.num,
    d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : ''}${m.d}${M.cs ? ' Réutilisable.' : ' Usage unique.'}`,
    cat: 'machines',
    mv: M.mv,
    cs: !!M.cs,
    ...(M.g ? { g: M.g } : { p: M.p })
  };
}


/* ---------- compatibilité ---------- */
typesFamille = base => [...new Set(famOf(base).flatMap(m => m.t))];


/** Les familles à qui l'on peut apprendre : en Campagne celles du Box, en Libre toutes. */
famillesEleves = () => [
  ...new Set(PROFILE.box.map(id => BY[id] && BY[id].base).filter(Boolean)) // Libre aussi : les familles capturées (v4.21)
];


/** Après un Éveil, les capacités de la nouvelle forme, plus la capacité apprise. */
avecApprise = (u, mv) => {
  const o = u.ctm && !mv.includes(u.ctm) ? [...mv, u.ctm] : [...mv];
  if (u.hm && MV[u.hm] && !o.includes(u.hm)) o.push(u.hm); // capacité héritée (v4.16)
  return o;
};


/* ---------- Sac : apprendre ---------- */
// #ctBox : rendu par React (src/screens/overlays/CtBox.jsx)


CT_K = null;


document.addEventListener('click', e => {
  const ap = e.target.closest('[data-apprendre]');
  if (ap) return ouvrirApprentissage(ap.dataset.apprendre);
  const f = e.target.closest('[data-ctf]');
  if (f && CT_K) return apprendreCT(CT_K, f.dataset.ctf);
  const x = e.target.closest('[data-ct]');
  if (x || e.target.id === 'ctBox') {
    $('#ctBox').hidden = true;
    return;
  }
  const o = e.target.closest('[data-ctoubli]');
  if (o) {
    oublierCT(o.dataset.ctoubli);
    if (openId) openSheet(openId, true); // la fiche ouverte se met à jour
  }
});
}
