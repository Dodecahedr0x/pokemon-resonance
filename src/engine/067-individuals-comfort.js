/* Section d'origine : v4.32-01-individus-et-confort.js */

import { BY, PRESETS, familyOf } from './009-pokemon.js';
import { DIFFS, ITEMS2, PROFILE, inBox, isCamp, ownedItems } from './011-game-state.js';
import { synOf } from './012-recruits-roles-synergies.js';
import { fnv, toast } from './014-utils.js';
import { CROCHETS } from './015-hooks.js';
import { __set_squad, renderSquad, save, squad, validSquad } from './020-team-cards.js';
import { EMAX, say } from './021-combat-engine.js';
import { queueSave } from './025-saves.js';
import { PREF, renderPrep, savePref } from './026-campaign-tutorial-sound.js';
import { __set_TEAM_BAK } from './027-gym-on-screen.js';
import { today } from './032-v4-foundation.js';
import { renderParams } from './040-settings.js';
import { CARACTERES, onExpedition } from './049-identity.js';
import { CAMPT431 } from './066-tactical-challenges.js';

export let EQ_NOM432;


/* =====================================================================
   v4.32
   1. Nature et talent individuels : chaque Pokémon capturé reçoit une
      nature (parmi les caractères qui conviennent à sa famille) et un
      talent (lié à ses types), gardés à travers ses évolutions.
   2. Équipes enregistrées : vos équipes (Pokémon et objets tenus).
   3. Formations en synergie : huit nouvelles équipes conseillées.
   4. Accessibilité : texte, contraste, daltonisme, gaucher, animations.
   5. Panthéon : les équipes qui ont battu un Maître ou le gardien.
   ===================================================================== */
export function V432_0() {
  return { indiv432: {}, indiv432Init: 0, teams432: [], panth432: [] };
}


export function v432Clean(p) {
  const o = V432_0();
  if (!p || typeof p !== 'object') return o;
  if (p.indiv432 && typeof p.indiv432 === 'object')
    Object.keys(p.indiv432).forEach(b => {
      const x = p.indiv432[b];
      if (BY[b] && x && typeof x === 'object' && CARACTERES[x.car] && TALENTS432[x.tal]) o.indiv432[b] = { car: x.car, tal: x.tal };
    });
  o.indiv432Init = p.indiv432Init ? 1 : 0;
  if (Array.isArray(p.teams432))
    o.teams432 = p.teams432
      .filter(t => t && typeof t === 'object' && Array.isArray(t.ids))
      .slice(0, 8)
      .map(t => {
        const it = {};
        if (t.it && typeof t.it === 'object') Object.keys(t.it).forEach(b => BY[b] && typeof t.it[b] === 'string' && ITEMS2[t.it[b]] && (it[b] = t.it[b]));
        return { n: String(t.n || 'Équipe').replace(/[<>&"]/g, '').slice(0, 20) || 'Équipe', ids: t.ids.filter(id => BY[id]).slice(0, 4), it };
      })
      .filter(t => t.ids.length);
  if (Array.isArray(p.panth432))
    o.panth432 = p.panth432
      .filter(x => x && typeof x === 'object' && typeof x.k === 'string' && Array.isArray(x.t))
      .slice(0, 40)
      .map(x => ({
        d: typeof x.d === 'string' ? x.d.slice(0, 10) : '',
        k: x.k.slice(0, 12),
        n: String(x.n || '').replace(/[<>&"]/g, '').slice(0, 40),
        t: x.t.filter(id => BY[id]).slice(0, 4),
        r: Number.isFinite(x.r) ? Math.max(0, Math.min(99, Math.floor(x.r))) : 0,
        rk: typeof x.rk === 'string' ? x.rk.slice(0, 2) : '',
        df: DIFFS[x.df] ? x.df : 'normal',
        md: typeof x.md === 'string' ? x.md.slice(0, 10) : ''
      }));
  return o;
}


/** Les trois talents possibles d’une famille : ceux de ses types, de la forme de base à la dernière évolution. */
function familyTalents432(b) {
  const types = new Set(familyOf(b).flatMap(m => m.t)),
    h = fnv(b),
    L = Object.keys(TALENTS432)
      .filter(k => TALENTS432[k][2].some(t => types.has(t)))
      .sort((x, y) => ((fnv(x + b) ^ h) >>> 0) - ((fnv(y + b) ^ h) >>> 0));
  ['robuste', 'elan', 'focus'].forEach(k => L.length < 3 && !L.includes(k) && L.push(k));
  return L.slice(0, 3);
}


/** Les trois natures qui conviennent à une famille : d’après la dernière évolution. */
function naturesFamily432(b) {
  const f = familyOf(b),
    m = f.slice().sort((x, y) => y.st - x.st)[0] || BY[b],
    s = m.s || [3, 3, 3, 3, 3, 3],
    sc = {
      brave: s[1] * 2,
      tetu: s[1] * 2 - 1,
      prudent: s[2] * 2 + s[0] * 0.5,
      vif: (s[3] + s[4]) * 1.1,
      fougueux: f.length > 1 ? 7 + f.length : 2,
      docile: 5
    };
  return Object.keys(sc)
    .sort((a, c) => sc[c] - sc[a])
    .slice(0, 3);
}


function characterHash432(b) {
  const ks = Object.keys(CARACTERES);
  let h = 7;
  for (const c of String(b)) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return ks[h % ks.length];
}


/** Nature et talent d’une famille de votre Box (tirés à sa première apparition). */
export function individualOf432(id) {
  const b = BY[id] ? BY[id].base : id;
  if (!BY[b] || !PROFILE.box.includes(b)) return null;
  const I = (PROFILE.indiv432 = PROFILE.indiv432 || {});
  if (!PROFILE.indiv432Init) {
    // les familles déjà présentes gardent leur caractère d’avant la v4.32
    PROFILE.box.forEach(x => {
      if (!I[x] && BY[x]) I[x] = { car: characterHash432(x), tal: familyTalents432(x)[fnv(x) % 3] };
    });
    PROFILE.indiv432Init = 1;
    queueSave();
  }
  if (!I[b]) {
    const N = naturesFamily432(b),
      T = familyTalents432(b);
    I[b] = { car: N[Math.floor(Math.random() * N.length)], tal: T[Math.floor(Math.random() * T.length)] };
    queueSave();
  }
  return I[b];
}


export function talDmg432(S, u, t, d) {
  if (!(d > 0)) return d;
  let f = 1;
  if (u && u.side === 'a') {
    if (u.tal432 === 'rage' && u.hp < u.mhp / 2) f *= 1.15;
    if (u.tal432 === 'opportun' && t && t.hp < t.mhp / 2) f *= 1.15;
  }
  if (t && t.side === 'a' && t.tal432 === 'carapace') f *= 0.9;
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}


export function talMov432(S, u) {
  return u && u.side === 'a' && u.tal432 === 'elan' && S && S.round === 1 ? 1 : 0;
}


export function individualHtml432(id) {
  const I = individualOf432(id);
  if (!I) return '';
  const T = TALENTS432[I.tal];
  return `<div class="mvc car-mvc tal432"><div class="t"><b>${T[0]}</b><span class="chip">Talent perso</span></div><p>${T[1]}</p></div>`;
}


// rangée « Mes équipes » de l'écran Équipe : rendue par React (src/screens/equipe/DexCall.jsx)


function loadTeam432(i) {
  const t = (PROFILE.teams432 || [])[i];
  if (!t) return;
  const ok = t.ids.filter(id => inBox(id) && !onExpedition(id)),
    miss = t.ids.filter(id => !ok.includes(id));
  if (squad.length) __set_TEAM_BAK([...squad]);
  let s = [];
  ok.forEach(id => {
    if (validSquad([...s, id])) s.push(id);
  });
  __set_squad(s);
  Object.entries(t.it || {}).forEach(([b, it]) => {
    if (!ownedItems().includes(it) || !BY[b]) return;
    for (const k in PROFILE.equip) if (PROFILE.equip[k] === it) delete PROFILE.equip[k];
    PROFILE.equip[b] = it;
  });
  save();
  renderSquad();
  try {
    renderPrep();
  } catch (e) {}
  toast(miss.length ? `« ${t.n} » chargée sans ${miss.map(id => BY[id].n).join(', ')}.` : `Équipe « ${t.n} » chargée.`);
}


/* dans Combats : les équipes enregistrées (#eqPrep432) sont rendues par React
   (src/screens/combat/prep/Team.jsx) */


/* ---------- 4. accessibilité ---------- */
function a11y432() {
  const h = document.documentElement,
    t = PREF.txt432 || 'normal';
  h.classList.toggle('a11y-t1', t === 'grand');
  h.classList.toggle('a11y-t2', t === 'tgrand');
  h.classList.toggle('a11y-hc', !!PREF.hc432);
  h.classList.toggle('a11y-cb', !!PREF.cb432);
  h.classList.toggle('a11y-lh', !!PREF.lh432);
  h.classList.toggle('a11y-rm', !!PREF.rm432);
}


export function engrave432(k, n, team, S) {
  const L = (PROFILE.panth432 = PROFILE.panth432 || []);
  L.unshift({ d: today(), k, n, t: team.filter(id => BY[id]).slice(0, 4), r: (S && S.round) || 0, rk: (S && S.rank) || '', df: (S && S.diff) || PROFILE.diff || 'normal', md: isCamp() ? 'campagne' : 'libre' });
  if (L.length > 40) L.length = 40;
}


// l’onglet Camp › Panthéon est rendu par React : src/screens/camp/tabs/Pantheon.jsx

/* ---------- 1. nature et talent individuels ---------- */
const TALENTS432 = {
  fermete: ['Fermeté', 'Survit une fois par combat à un coup fatal (1 PV).', ['Roche', 'Sol', 'Acier', 'Combat', 'Normal']],
  regen: ['Régénération', 'Récupère 8 % de ses PV à chaque fin de manche.', ['Eau', 'Plante', 'Normal', 'Fée', 'Poison']],
  elan: ['Élan', '+1 Mouvement pendant la première manche.', ['Vol', 'Électrik', 'Feu', 'Insecte', 'Combat']],
  focus: ['Concentration', 'Commence chaque combat avec 1 losange de plus.', ['Psy', 'Spectre', 'Dragon', 'Fée', 'Glace']],
  rage: ['Rage', '+15 % de dégâts quand il lui reste moins de la moitié de ses PV.', ['Feu', 'Combat', 'Ténèbres', 'Dragon', 'Sol']],
  carapace: ['Carapace', '−10 % de dégâts subis.', ['Eau', 'Roche', 'Acier', 'Insecte', 'Glace']],
  opportun: ['Opportuniste', '+15 % de dégâts contre une cible sous la moitié de ses PV.', ['Ténèbres', 'Spectre', 'Poison', 'Vol', 'Électrik']],
  robuste: ['Robustesse', '+10 % de PV maximum.', ['Normal', 'Plante', 'Sol', 'Glace', 'Roche']],
  garde: ['Vigilance', 'Commence le combat sous Garde pendant 2 manches.', ['Acier', 'Psy', 'Fée', 'Normal', 'Eau']]
};


/* ---------- 5. Panthéon ---------- */
export const PANTH432 = { champ: 'Champion de Kanto', jchamp: 'Maître de Johto', hchamp: 'Maître de Hoenn', echo: 'Gardien de l’Écho profond' };

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

CROCHETS.combat.push(S => {
  if ((S.fixe431 && S.sc !== 'echo431') || !S.car) return; // réglage « Natures et talents »
  S.units
    .filter(u => u.side === 'a')
    .forEach(u => {
      const I = individualOf432(u.sp);
      if (!I) return;
      u.tal432 = I.tal;
      if (I.tal === 'fermete') u.ferm = true;
      else if (I.tal === 'focus') u.en = Math.min(EMAX, (u.en || 0) + 1);
      else if (I.tal === 'robuste') {
        u.mhp = Math.round(u.mhp * 1.1);
        u.hp = Math.min(u.mhp, Math.round(u.hp * 1.1));
      } else if (I.tal === 'garde') u.guard = Math.max(u.guard || 0, 2);
    });
});


CROCHETS.avantFinManche.push((S, ev) => {
  S.units.forEach(u => {
    if (u.tal432 !== 'regen' || u.ko || u.hp >= u.mhp || u.side !== 'a') return;
    const g = Math.max(1, Math.round(u.mhp * 0.08));
    u.hp = Math.min(u.mhp, u.hp + g);
    if (Array.isArray(ev)) say(ev, `Régénération : ${u.n} récupère ${g} PV.`);
  });
});


/* ---------- 2. équipes enregistrées ---------- */
EQ_NOM432 = false;


document.addEventListener('click', e => {
  const b = e.target.closest('[data-eq432]');
  if (!b) return;
  const a = b.dataset.eq432,
    T = (PROFILE.teams432 = PROFILE.teams432 || []);
  if (a === 'nouv') {
    EQ_NOM432 = true;
    renderSquad();
    const i = document.getElementById('eqNom432');
    if (i) i.focus();
    return;
  }
  if (a === 'ok') {
    const v = ((document.getElementById('eqNom432') || {}).value || '').replace(/[<>&"]/g, '').trim().slice(0, 20) || `Équipe ${T.length + 1}`,
      it = {};
    squad.forEach(id => {
      const bb = BY[id].base;
      if (PROFILE.equip[bb]) it[bb] = PROFILE.equip[bb];
    });
    if (squad.length && T.length < 8) T.push({ n: v, ids: [...squad], it });
    EQ_NOM432 = false;
    save();
    toast(`Équipe « ${v} » enregistrée.`);
  } else if (a === 'charger') return loadTeam432(+b.dataset.i);
  else if (a === 'suppr') {
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Sûr ?';
      return;
    }
    T.splice(+b.dataset.i, 1);
    save();
  }
  renderSquad();
  try {
    renderPrep();
  } catch (er) {}
});


document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id === 'eqNom432') {
    e.preventDefault();
    const b = document.querySelector('[data-eq432="ok"]');
    if (b) b.click();
  }
});


/* ---------- 3. formations en synergie ---------- */
Object.assign(PRESETS, {
  grandorage: { n: 'Grand orage', ids: ['scarhino', 'ramoloss', 'hoothoot', 'loupio'], s432: 'Tempête, Escadrille, Dojo' },
  cieldraco: { n: 'Ciel draconique', ids: ['evoli', 'scarhino', 'hoothoot', 'minidraco'], s432: 'Escadrille, Dojo, Ciel draconique' },
  forge: { n: 'Forge volcanique', ids: ['hoothoot', 'onix', 'limagma', 'scarhino'], s432: 'Forge, Escadrille, Dojo' },
  jardin: { n: 'Jardin gelé', ids: ['lokhlass', 'marill', 'fantominus', 'bulbizarre'], s432: 'Toxines, Banquise, Bénédiction' },
  brume: { n: 'Brume toxique', ids: ['granivol', 'fantominus', 'porygon', 'scarhino'], s432: 'Escadrille, Dojo, Toxines' },
  lumiere: { n: 'Lame et lumière', ids: ['tarsal', 'absol', 'magneti', 'bulbizarre'], s432: 'Acier trempé, Bénédiction' },
  abysses: { n: 'Abysses', ids: ['natu', 'axoloto', 'lokhlass', 'tenefix'], s432: 'Esprit, Banquise' },
  oragedraco: { n: 'Orage draconique', ids: ['draby', 'lokhlass', 'pichu', 'hoothoot'], s432: 'Tempête, Ciel draconique' }
});


Object.keys(PRESETS).forEach(k => {
  const P = PRESETS[k];
  P.ids = P.ids.filter(id => BY[id]);
  if (!P.s432) P.s432 = synOf(P.ids).map(x => x.n).join(', ');
});


a11y432();


document.addEventListener('click', e => {
  const b = e.target.closest('[data-txt432]');
  if (!b) return;
  PREF.txt432 = b.dataset.txt432;
  savePref();
  a11y432();
  renderParams();
});


document.addEventListener('change', e => {
  const p = e.target.closest('[data-pref]');
  if (p && /432$/.test(p.dataset.pref)) {
    if (p.dataset.pref === 'rm432') PREF.anim429 = !p.checked;
    savePref();
    a11y432();
  }
});


CROCHETS.progres.push((S, rew, win) => {
  if (!win || !PANTH432[S.sc]) return null;
  engrave432(
    S.sc,
    PANTH432[S.sc],
    S.units.filter(u => u.side === 'a').map(u => u.id),
    S
  );
  rew.panth432 = PANTH432[S.sc];
  return null;
});


CROCHETS.resultat.push(r => (r.panth432 ? `<div class="res-l"><h4>Panthéon</h4><div class="rl"><span>Votre équipe est gravée au Panthéon : ${r.panth432}.</span><b>★</b></div></div>` : ''));


if (!CAMPT431.some(x => x[0] === 'pantheon')) CAMPT431.push(['pantheon', 'Panthéon']);

}
