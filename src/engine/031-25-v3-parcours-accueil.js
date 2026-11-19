/* Section d'origine : 25-v3-parcours-accueil.js */

import { GYMS } from './004-01-donnees.js';
import { BY, SCEN } from './009-03-pokemon.js';
import { CAMP_START, PROFILE, defProfile, isCamp } from './011-05-etat-de-partie.js';
import { ARENAS, BADGES, TERR } from './013-07-arenes.js';
import { $, RM, ecrireLS, gp, medal, tc, toast } from './014-08-outils.js';
import { go } from './016-09-navigation.js';
import { encounter } from './017-10-accueil-route.js';
import { badgeSvg } from './019-12-ligue.js';
import { save, squad } from './020-13-equipe-cartes.js';
import { ELITE, scenLock } from './022-15-systemes-objets-liens-ia.js';
import { __set_scSel, launch, ouvrirCombat, scSel } from './024-17-interface-combat.js';
import { SAVE_V, applySave, autoSave, esc } from './025-19-sauvegardes.js';
import { TUTO, __set_PREPG, nextGoal, renderPrep } from './026-20-campagne-tutoriel-son.js';
import { AUTO, CHAP, leaderOf } from './030-24-prestige-mise-en-scene.js';
import { renderHome } from './036-v4-04-accueil.js';
import { LEGS, RIVAL, RIVAL_KEYS, legKey, legOf, rivalIdx, styleOf } from './043-v4-4-01-aventure-plus.js';
import { COLOSSES } from './047-v4-8-01-tactique.js';
import { dissonanceApres } from './050-v4-11-01-monde.js';
import { roamOk416 } from './055-v4-16-01-johto-vivant.js';
import { hProf419, hoennOuvert } from './059-v4-19-01-hoenn.js';
import { HLEG435 } from './071-v4-38-les-legendaires-de-hoenn.js';
import { confirmer430, partieEnCours430 } from './065-v4-30-01-camp-et-tactique.js';
import { refreshPrep } from '../screens/combat/prep/prepStore.js';
import { refreshAccueil } from '../screens/accueil/accueilStore.js';
import { closeIntroBox, openIntro, refreshIntro } from '../screens/overlays/shellOverlays.js';
import { cacherTip, montrerTip } from '../components/tipStore.js';

let TIPSEEN;


/* --- portraits : initiales sur la couleur du type (personnages originaux) --- */
export function avatar(name, type, cls = '') {
  const ini = String(name)
    .replace(/^(Prof\.|Professeure)\s+/, '')
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('');
  const c = type ? tc(type) : '#E3350D';
  return `<span class="av ${cls}" style="--c:${c}" aria-hidden="true"><b>${ini}</b>${type ? `<i><svg viewBox="0 0 24 24"><path d="${gp(type)}" fill="currentColor" fill-rule="evenodd"/></svg></i>` : ''}</span>`;
}


/* --- prochaine étape --- */
export function wonOf(k) {
  const s = SCEN[k];
  if (!s) return false;
  if (s.hoenn != null) return (PROFILE.hoenn || []).includes(s.hoenn); // Hoenn (v4.19)
  if (s.hfinal) return !!PROFILE.hchamp;
  if (s.jdis) return (PROFILE.jdis || 0) >= s.jdis; // Néo-Dissonance (v4.16)
  if (s.roam) return roamOk416(s.roam);
  if (s.ami != null) return false;
  if (s.johto != null) return (PROFILE.johto || []).includes(s.johto); // Johto (v4.15)
  if (s.jfinal) return !!PROFILE.jchamp;
  if (s.lac) return !!PROFILE.lac;
  if (s.gym != null) return BADGES.includes(s.gym);
  if (s.elite) return PROFILE.elite >= s.elite;
  if (k === 'champ') return PROFILE.elite >= 5;
  if (s.rival429) return (PROFILE.riv429 || []).includes(s.rival429); // v4.29
  if (s.rival) return PROFILE.rival >= s.rival;
  if (s.dissonance) return (PROFILE.dissonance || 0) >= s.dissonance;
  if (s.legend) return PROFILE.legends.includes(s.legend);
  if (s.tower) return false;
  return !!(PROFILE.ranks || {})[k];
}


export function goalInfo() {
  const [k, n] = nextGoal(),
    S = SCEN[k] || {},
    gi = ARENAS.findIndex(a => a.k === k);
  return { k, n, S, C: CHAP(k), L: leaderOf(k), gi, type: gi >= 0 ? GYMS[gi].t : S.at };
}


export function emblem(k, cls = '') {
  const s = SCEN[k] || {},
    gi = ARENAS.findIndex(a => a.k === k),
    L = leaderOf(k),
    legende = s.hleg435 || s.cap435 || s.legend || s.colosse || s.roam;
  if (legende) return `<span class="emb lgd ${cls}" style="--ac:${tc(s.at)}">${medal(BY[legende].t, 'lg')}</span>`;
  if (s.johto != null) return `<span class="emb bdg ${cls}" style="--ac:${tc(s.at)}">${badgeSvg(s.johto, s.at, 'ej' + cls + s.johto)}</span>`; // v4.15
  if (s.hoenn != null) return `<span class="emb bdg ${cls}" style="--ac:${tc(s.at)}">${badgeSvg(s.hoenn, s.at, 'eh' + cls + s.hoenn)}</span>`; // v4.19
  if (gi >= 0)
    return `<span class="emb bdg ${cls}" style="--ac:${tc(s.at)}">${badgeSvg(gi, s.at, 'em' + cls + gi)}</span>`;
  if (L) return avatar(L.n, s.at || 'Dragon', cls);
  const T = { gue: 'Eau', roche: 'Roche', tour: 'Spectre', ligue: 'Combat', arene: 'Normal' }[s.bio] || 'Normal';
  return `<span class="emb ter bio-${s.bio || 'gue'} ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${s.tuto ? '<use href="#i-book"/>' : `<path d="${gp(T)}" fill="currentColor" fill-rule="evenodd"/>`}</svg></span>`;
}


export function profMsg() {
  const g = goalInfo(),
    nm = PROFILE.name ? esc(PROFILE.name) : '';
  if (!squad.length)
    return `Votre équipe est vide${nm ? ', ' + nm : ''}. Choisissez quatre Pokémon dans l’onglet <b>Équipe</b>, puis revenez me voir.`;
  if (g.k === 'tuto')
    return `Bienvenue${nm ? ', ' + nm : ''} ! Votre premier combat est guidé : je vous explique chaque geste, pas à pas.`;
  if (g.gi >= 0)
    return `${g.gi ? 'Beau travail. ' : ''}Prochaine arène : <b>${g.L.n}</b>, ${g.L.t}. ${GYMS[g.gi].r}${styleOf(g.k) ? ` Son style : ${styleOf(g.k).d.charAt(0).toLowerCase() + styleOf(g.k).d.slice(1)}` : ' Préparez-vous en conséquence !'}`;
  if (rivalIdx(g.k) >= 0)
    return `Votre rival <b>${RIVAL.n}</b> vous attend. Son partenaire a l’avantage du type sur le vôtre : prévoyez de quoi le contrer.`;
  if (g.k === 'champ')
    return PROFILE.elite >= 5
      ? `Vous êtes Champion${nm ? ', ' + nm : ''} ! Auriane Vale attend sa revanche : elle a étudié vos derniers combats.`
      : `Le Conseil 4 est vaincu. Il ne reste qu’<b>Auriane Vale</b>, la Championne. Elle a lu tous vos combats.`;
  if (/^h[1-8]$|^hchamp$/.test(g.k)) return hProf419(g); // Hoenn (v4.19)
  if (/^jd\d$/.test(g.k))
    return `${g.k === 'jd1' ? 'Des ondes étranges brouillent Johto. ' : ''}La Néo-Dissonance refait surface : <b>${g.L.n}</b>, ${g.L.t}. ${SCEN[g.k].d}`;
  if (/^j[1-8]$|^jchamp$/.test(g.k))
    return g.k === 'jchamp'
      ? `Les huit badges de Johto sont à vous ! Le Maître de Johto, <b>${g.L.n}</b>, vous attend.`
      : `${g.k === 'j1' ? 'Bienvenue à Johto ! Une nouvelle région, huit nouvelles arènes. ' : 'Beau travail. '}Prochaine arène : <b>${g.L.n}</b>, ${g.L.t}.`;
  if (g.L) return `Les huit badges sont à vous ! Le Conseil 4 vous attend : <b>${g.L.n}</b>, ${g.L.t}.`;
  return 'Choisissez votre prochain combat.';
}


export function goalChips(S) {
  return `<span>N.${S.lv}</span><span>${S.lim} manches</span><span>${S.time === 'nuit' ? 'Nuit' : 'Jour'}</span>${S.foes ? `<span>${S.foes.length} adversaire${S.foes.length > 1 ? 's' : ''}</span>` : ''}`;
}


export function selItems(g) {
  if (g === 'arenes')
    return ARENAS.flatMap((a, i) => [
      ...(isCamp() && i % 2 ? [a.k, RIVAL_KEYS[(i - 1) / 2]] : [a.k]),
      ...dissonanceApres(i + 1) // Team Dissonance (v4.11)
    ]);
  // les Légendaires de Hoenn (v4.38) restent masqués tant que Hoenn est fermée
  if (g === 'apres') return ['tdr', ...LEGS.map(L => legKey(L.id)), ...(hoennOuvert() ? HLEG435.map(L => 'hl' + L.id) : [])];
  if (g === 'ligue') return [...ELITE, 'champ'];
  return [
    'tuto',
    ...TERR.filter(k => !['tuto', 'sauvage', 'champ'].includes(k) && !SCEN[k].elite),
    ...COLOSSES.map(C => C.k) // colosses (v4.8)
  ];
}


export function groupOf(k) {
  const D = SCEN[k] || {};
  if (D.hleg435 || D.cap435 || k === 'tdr' || legOf(k) || D.cap429) return 'apres';
  if (rivalIdx(k) >= 0 || /^td\d$/.test(k)) return 'arenes';
  return ELITE.includes(k) || k === 'champ' ? 'ligue' : ARENAS.some(a => a.k === k) ? 'arenes' : 'terrains';
}


function pickIn(g) {
  const it = selItems(g),
    gk = nextGoal()[0];
  if (it.includes(gk)) return gk;
  return it.find(k => !scenLock(k) && !wonOf(k)) || it.find(k => !scenLock(k)) || it[0];
}


/* cadre de sélection : onglets, liste, fiche du combat, équipe, doctrine (v4.30) et
   équipes enregistrées (v4.32) : rendu par React (src/screens/combat/prep) */
export function renderSelection() {
  if (!$('#scenList') || !SCEN[scSel]) return;
  refreshPrep();
  refreshAccueil(); // objectif de la barre latérale (#sideGoal, src/screens/accueil/ObjectifLateral.jsx)
}


// conseil rendu par React (src/components/Tip.jsx) après l'en-tête de l'écran
function tipFor(t) {
  if (!TIPS[t] || TIPSEEN[t]) return;
  montrerTip(t);
}


export function afterShow(t) {
  if (t === 'accueil') renderHome();
  tipFor(t);
}


// Accueil de la Professeure (#intro) : la carte de l'étape INTRO.i est rendue par React
// (src/screens/overlays/Intro.jsx), reconstruite de façon synchrone à chaque appel.
function renderIntro() {
  if (!document.getElementById('intro')) return;
  refreshIntro();
  const o = document.getElementById('intro');
  if (o) focusIntro(o);
}


function focusIntro(o) {
  const f = o.querySelector('#inName') || o.querySelector('.it-a .b-gold:not([disabled])');
  if (f) setTimeout(() => f.focus(), 40);
}


function closeIntro() {
  try {
    localStorage.setItem('res-intro', '1');
  } catch (e) {}
  closeIntroBox();
}


export function showIntro(force) {
  if (!force) {
    try {
      if (localStorage.getItem('res-intro')) return;
    } catch (e) {}
    if (AUTO || PROFILE.battles > 0 || PROFILE.name || isCamp()) return;
  }
  Object.assign(INTRO, { i: 0, name: PROFILE.name || '', diff: PROFILE.diff || 'normal', st: null });
  openIntro();
  // carte impossible à dessiner : Intro.jsx n'affiche rien (jamais un voile vide) et signale le souci
  const o = document.getElementById('intro');
  if (!o) return;
  focusIntro(o);
  if (o._introL) return; // déjà ouvert : écouteurs en place
  o._introL = 1;
  o.addEventListener('click', e => {
    const s = e.target.closest('[data-in-st]');
    if (s) {
      INTRO.st = s.dataset.inSt;
      renderIntro();
      return;
    }
    const d = e.target.closest('[data-in-d]');
    if (d) {
      INTRO.diff = d.dataset.inD;
      renderIntro();
      return;
    }
    const b = e.target.closest('[data-in]');
    if (!b) return;
    const a = b.dataset.in;
    if (a === 'next') {
      INTRO.i++;
      renderIntro();
    } else if (a === 'name') {
      const v = (o.querySelector('#inName') || {}).value || '';
      INTRO.name = v.trim().slice(0, 14);
      INTRO.i = 3;
      renderIntro();
    } else if (a === 'start' && INTRO.st) {
      if (partieEnCours430() && !INTRO.ok430) {
        // revoir l’accueil ne doit pas effacer une partie sans prévenir (v4.30)
        confirmer430('Recommencer l’aventure ?', 'Choisir un partenaire ici lance une nouvelle campagne.', () => {
          INTRO.ok430 = 1;
          b.click();
        });
        return;
      }
      INTRO.ok430 = 0;
      startCampaign(INTRO.st, INTRO.name, INTRO.diff);
      INTRO.i = 4;
      renderIntro();
    } else if (a === 'go') {
      closeIntro();
      ouvrirCombat('tuto');
      launch();
    } else if (a === 'skip' && INTRO.i < 3) {
      // passer la présentation mène au choix du partenaire : la Campagne (et ses captures) commence toujours
      INTRO.i = 3;
      renderIntro();
    } else if (a === 'later' || a === 'skip' || a === 'libre') {
      if (a === 'libre' && INTRO.st && !isCamp() && !PROFILE.box.includes(INTRO.st)) {
        PROFILE.box.push(INTRO.st); // le partenaire choisi suit aussi en Libre (v4.21)
        save();
      }
      closeIntro();
      go('accueil');
      renderHome();
    }
  });
  o.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'inName') {
      e.preventDefault();
      o.querySelector('[data-in="name"]').click();
    }
  });
}


function startCampaign(id, name, diff) {
  const keep = { name: name || PROFILE.name || '', diff: diff || PROFILE.diff };
  const box = [id, ...CAMP_START];
  applySave(
    {
      v: SAVE_V,
      savedAt: new Date().toISOString(),
      squad: box.slice(0, 4),
      badges: [],
      profile: Object.assign(defProfile(), keep, { mode: 'campagne', box, dex: [...box] }),
      battle: null
    },
    { leaveBattle: true }
  );
  try {
    autoSave(true);
  } catch (e) {}
  renderHome();
}

export const PROF_AV = `<span class="pav" aria-hidden="true"><b>MS</b><i><svg viewBox="0 0 24 24"><path d="M2.5 12.5h4l2.2-5.2 3.4 10.4 3.2-10.4 2.2 5.2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></i></span>`;


export const S2n = g => (g.gi >= 0 ? `Arène ${g.gi + 1} · ${GYMS[g.gi].t}` : g.S.n || g.n);


/* --- Combats : un seul cadre (onglet → liste → fiche) --- */
// SELG et k2n : lus par la sélection des combats (React)
export const SELG = [
  ['terrains', 'Entraînement', 'i-fight'],
  ['arenes', 'Arènes', 'i-league'],
  ['ligue', 'Ligue', 'i-star'],
  ['apres', 'Après-jeu', 'i-trophy']
];


export const k2n = k => (k === 'champ' ? 'Finale' : k === 'tuto' ? 'Combat guidé' : (SCEN[k] || {}).n || '');


/* --- première visite d’un écran : un conseil de la Professeure --- */
// lu par src/components/Tip.jsx
export const TIPS = {
  pokedex:
    'Touchez <b>Recruter</b> sous un Pokémon pour l’ajouter. Quatre Pokémon et 12 PC au maximum : la jauge en haut vous guide.',
  combat: 'Choisissez un onglet, puis un combat dans la liste. Le bouton doré lance la partie avec votre équipe.',
  types: 'Commencez par <b>Débuter</b> : cinq étapes, deux minutes de lecture.'
};


/* --- accueil de la Professeure (premier lancement) --- */
// étape de l'accueil de la Professeure, lue par Intro.jsx
export const INTRO ={ i: 0, name: '', diff: 'normal', st: null };

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== v3.0 « Pokémon » : un chemin clair, un cadre de sélection, un accueil qui guide ===================== */


/* --- raccourcis de l’accueil et du guide --- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-hm]');
  if (!b) return;
  const k = b.dataset.hm;
  if (k === 'wild') {
    go('accueil');
    const r = $('#route');
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => encounter(), RM ? 0 : 450);
  } else if (k === 'tuto') {
    ouvrirCombat('tuto');
    if (squad.length) launch();
    else toast('Choisissez d’abord un Pokémon dans l’onglet Équipe.');
  } else if (k === 'intro') showIntro(true);
});


$('#selTabs').addEventListener('click', e => {
  const t = e.target.closest('[data-pg]');
  if (!t) return;
  const g = t.dataset.pg;
  if (groupOf(scSel) !== g) __set_scSel(pickIn(g));
  __set_PREPG({ g, sc: scSel });
  renderPrep();
});


/* --- tutoriel : des consignes plus simples, la Professeure en coach --- */
{
  const T2 = {
    'Lisez la menace': [
      'La portée adverse',
      'Touchez un adversaire : la zone rouge montre tout ce qu’il peut frapper ce tour-ci. Il choisira sa cible au dernier moment, comme un vrai dresseur.'
    ],
    'Déplacez-vous': [
      'Bougez',
      'Touchez un de vos Pokémon (en bas), puis une case bleue pour le déplacer. Gardez vos fragiles hors de la zone rouge !'
    ],
    Attaquez: [
      'Attaquez',
      'Touchez une capacité, puis une case dorée. L’aperçu montre le résultat exact : touchez « Confirmer ».'
    ],
    'Énergie d’Éveil': [
      'L’Éveil',
      'Les 3 losanges de votre Pokémon se remplissent au fil du combat. Pleins, touchez « Éveiller » : il évolue sur-le-champ, pour de bon.'
    ],
    'Terminez la manche': [
      'Fin du tour',
      'Quand vos Pokémon ont joué, touchez « Fin du tour ». Les adversaires se déplacent et attaquent à leur tour.'
    ]
  };
  TUTO.forEach(s => {
    const n = T2[s.t];
    if (n) {
      s.t = n[0];
      s.d = n[1];
    }
  });
}


TIPSEEN = {};


try {
  TIPSEEN = JSON.parse(localStorage.getItem('res-tips') || '{}') || {};
} catch (e) {}


document.addEventListener('click', e => {
  const b = e.target.closest('[data-tipok]');
  if (!b) return;
  TIPSEEN[b.dataset.tipok] = 1;
  ecrireLS('res-tips', TIPSEEN);
  cacherTip(b.dataset.tipok);
});


/* résultat : la boîte à badges vit désormais dans l’onglet Arènes (« Voir les arènes », Result.jsx) */
}
