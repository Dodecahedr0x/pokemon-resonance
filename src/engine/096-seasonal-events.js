/* Section d'origine : 4.65 : événements saisonniers mensuels */

import { BY, SCEN } from './009-pokemon.js';
import { ARENAS } from './013-gyms.js';
import { writeLS, toast } from './014-utils.js';
import { CROCHETS } from './015-hooks.js';
import { esc } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { savePurse, today } from './032-v4-foundation.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { FOURNISSEURS_DEGATS } from './044-tactical-engine.js';
import { reward454, txt454 } from './084-peddler-route-missions.js';
import { battleCount464 } from './095-trainer-talent-tree.js';



/** Bannière de saison de l'Accueil (#sa465, rendu : src/screens/accueil/Bannieres.jsx). */
export function saData465() {
  const S0 = sai465(),
    s = saSt465(),
    top = PAL465[PAL465.length - 1][0],
    pc = Math.min(100, Math.round((s.pts / top) * 100));
  return { S0, pts: s.pts, top, pc };
}


function saOpen465() {
  const S0 = sai465(),
    s = saSt465(),
    vd = featured465();
  const tiers = PAL465.map(([p, n, R], i) => ({ p, n, txt: txt454(R), ok: s.pts >= p, got: !!s.got[i] }));
  const gym = SCEN[vd] ? SCEN[vd].n : vd;
  // rendu : src/screens/overlays/temporaires/Fenetres.jsx (Sa465)
  const o = overlay('sa465o', { n: S0.n, d: S0.d, t: S0.t, arene: gym, tiers, won: s.won || 0 });
  o.addEventListener('click', e => {
    if (e.target === o) shut('sa465o');
  });
}

const SAI465 = [
  { n: 'Grand Froid', t: 'Glace', d: 'L’hiver s’installe : les Pokémon Glace sont à l’honneur.' },
  { n: 'Cœur de Fée', t: 'Fée', d: 'Un mois de douceur et de magie pour les Pokémon Fée.' },
  { n: 'Éveil de la Sève', t: 'Plante', d: 'Le printemps réveille les Pokémon Plante.' },
  { n: 'Grand Bourdonnement', t: 'Insecte', d: 'Les Pokémon Insecte sortent en essaim.' },
  { n: 'Grands Vents', t: 'Vol', d: 'Les courants d’air portent les Pokémon Vol.' },
  { n: 'Marées Vives', t: 'Eau', d: 'Les Pokémon Eau profitent des marées.' },
  { n: 'Canicule', t: 'Feu', d: 'La chaleur met les Pokémon Feu en pleine forme.' },
  { n: 'Orages d’été', t: 'Électrik', d: 'Les orages chargent les Pokémon Électrik.' },
  { n: 'Rochers en fête', t: 'Roche', d: 'Les Pokémon Roche tiennent bon avec l’automne qui arrive.' },
  { n: 'Nuit des Spectres', t: 'Spectre', d: 'Les Pokémon Spectre rôdent à l’approche d’Halloween.' },
  { n: 'Tournoi des Poings', t: 'Combat', d: 'Les Pokémon Combat défient tous les dresseurs.' },
  { n: 'Légende des Dragons', t: 'Dragon', d: 'Les Pokémon Dragon veillent sur les fêtes de fin d’année.' }
];


const PAL465 = [
  [5, 'Premiers pas', { m: 600, b: { potion: 2 } }],
  [10, 'Régulier', { g: 3 }],
  [18, 'Passionné', { m: 1500, b: { superpotion: 2 } }],
  [28, 'Expert', { g: 5, m: 1500 }],
  [40, 'Légende du mois', { g: 10, m: 3000 }]
];


const monthKey465 = () => today().slice(0, 7);


const monthIdx465 = () => Math.max(0, Math.min(11, (parseInt(today().slice(5, 7), 10) || 1) - 1));


const sai465 = () => SAI465[monthIdx465()];


const featured465 = () => ARENAS[(monthIdx465() * 3 + (parseInt(today().slice(0, 4), 10) || 0)) % ARENAS.length].k;


const saSt465 = () => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-sa465') || 'null');
  } catch (e) {
    s = null;
  }
  s = s || { won: 0 };
  if (s.m !== monthKey465()) {
    if (s.m && s.pts >= PAL465[PAL465.length - 1][0]) s.won = (s.won || 0) + 1;
    s = { m: monthKey465(), pts: 0, got: {}, won: s.won || 0 };
  }
  s.got = s.got || {};
  return s;
};


const saSave465 = s => {
  writeLS('res-sa465', s);
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

CROCHETS.combat.push(S => {
  if (battleCount464(S)) S.sa465 = sai465().t;
});


FOURNISSEURS_DEGATS.push({ id: 'saison465', fournir: (c, { S, u }) => !!u && u.side === 'a' && !!S && !!S.sa465 && BY[u.id] && BY[u.id].t.includes(S.sa465) && { mul: 1.05, libelle: 'Saison : ' + S.sa465 } });


CROCHETS.progres.unshift((S, rew, win) => {
  try {
    if (!win || !battleCount464(S)) return null;
    const t = sai465().t,
      s = saSt465();
    let n = 1;
    if (S.units.some(u => u.side === 'a' && BY[u.id] && BY[u.id].t.includes(t))) n += 1;
    if (S.sc === featured465()) n += 2;
    s.pts += n;
    saSave465(s);
    rew.sa465 = { n, tot: s.pts };
  } catch (e) {}
  return null;
});


CROCHETS.resultat.unshift(r => (r.sa465 ? `<div class="res-l"><h4>${esc(sai465().n)}</h4><div class="rl"><span>Points de saison : +${r.sa465.n}</span><b>${r.sa465.tot}</b></div></div>` : ''));


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-sa465]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const v = b.dataset.sa465;
    if (v === 'open') return saOpen465();
    if (v === 'close') return shut('sa465o');
    if (b.disabled) return;
    const s = saSt465(),
      i = +v,
      T = PAL465[i];
    if (!T || s.got[i] || s.pts < T[0]) return;
    s.got[i] = 1;
    if (i === PAL465.length - 1) s.won = (s.won || 0) + 0;
    saSave465(s);
    reward454(T[2]);
    sfx('win');
    vibe([30, 40, 30]);
    toast('Récompense de saison : ' + txt454(T[2]) + '.');
    savePurse();
    saOpen465();
    refreshHome(); // bannière #sa465
  },
  true
);

}
