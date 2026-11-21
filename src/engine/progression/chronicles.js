/* Chronicles (story in chapters) and offline mode (added in v4.62). */

import { $, writeLS, readLS, toast } from '../core/utils.js';
import { PREFERENCES, savePref } from '../ui/preferences.js';
import { savePurse } from '../state/economy.js';
import { renderParams } from '../ui/settings.js';
import { SCENES, __set_SCN, renderStoryScene } from './story-dialogues.js';
import { MUSIC } from '../audio/music.js';
import { applyReward } from '../world/route-events.js';
import { badgeTotal } from './item-quests.js';

/** Offline mode: music tracks kept in cache (urls = blob: addresses per track). */
export const OFFLINE_STATE = { cache: 'res-audio-462', urls: {}, status: '', n: 0 };

function chapterPlay(L, c) {
  __set_SCN({ k: c, c, i: 0, L, apres: true });
  renderStoryScene();
  $('#story-scene').hidden = false;
}

function chapterOpen(i) {
  const C = CHAPTERS[i];
  if (!C || badgeTotal() < C.min) {
    return;
  }
  const s = chapterState(),
    first = !s.read[i];
  chapterPlay(C.L, 'chronicle_' + i);
  if (first) {
    s.read[i] = 1;
    writeLS('res-chronicle', s);
    applyReward({ g: 2 });
    savePurse();
    toast('Chronique lue : +2 Éclats.');
    setTimeout(() => {
      try {
        renderParams();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }, 50);
  }
}

async function offlineLoad() {
  if (!offlineSupported()) {
    return;
  }
  try {
    const c = await caches.open(OFFLINE_STATE.cache);
    let n = 0;
    for (const [k, u] of chapterTracks()) {
      const r = await c.match(u);
      if (r) {
        const bl = await r.blob();
        OFFLINE_STATE.urls[k] = URL.createObjectURL(bl);
        n++;
      }
    }
    OFFLINE_STATE.n = n;
    OFFLINE_STATE.status = n ? 'prêt' : '';
    Object.keys(MUSIC.el).forEach(k => {
      const a = MUSIC.el[k];
      if (a && OFFLINE_STATE.urls[k] && a.paused && a.src !== OFFLINE_STATE.urls[k]) {
        a.src = OFFLINE_STATE.urls[k];
      }
    });
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

async function offlineDownload() {
  if (!offlineSupported()) {
    return toast('Le stockage hors ligne n’est pas disponible ici.');
  }
  OFFLINE_STATE.status = 'chargement';
  let ok = 0,
    ko = 0;
  try {
    const c = await caches.open(OFFLINE_STATE.cache),
      L = chapterTracks();
    for (let i = 0; i < L.length; i++) {
      const [, u] = L[i];
      OFFLINE_STATE.n = i;
      try {
        const r = await fetch(u);
        if (r && r.ok) {
          await c.put(u, r.clone());
          ok++;
        } else {
          ko++;
        }
      } catch (e) {
        ko++;
      }
      try {
        renderParams();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }
  } catch (e) {
    OFFLINE_STATE.status = 'erreur';
    return toast('Le stockage hors ligne a été refusé par l’appareil.');
  }
  await offlineLoad();
  OFFLINE_STATE.status = ok ? 'prêt' : 'erreur';
  PREFERENCES.offlinePack = ok ? 1 : 0;
  savePref();
  toast(
    ok
      ? `Musique hors ligne : ${ok} pistes enregistrées${ko ? `, ${ko} introuvables` : ''}.`
      : 'Aucune piste n’a pu être enregistrée.'
  );
  try {
    renderParams();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

async function offlineClear() {
  try {
    await caches.delete(OFFLINE_STATE.cache);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  Object.values(OFFLINE_STATE.urls).forEach(u => {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  });
  OFFLINE_STATE.urls = {};
  OFFLINE_STATE.n = 0;
  OFFLINE_STATE.status = '';
  PREFERENCES.offlinePack = 0;
  savePref();
  toast('Musique hors ligne supprimée.');
  try {
    renderParams();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

async function offlineSave() {
  try {
    const r = await fetch(location.href);
    if (!r.ok) {
      throw new Error('Fetch failed');
    }
    const bl = await r.blob(),
      a = document.createElement('a');
    a.href = URL.createObjectURL(bl);
    a.download = 'Pokemon_Resonance.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Jeu enregistré : ouvrez le fichier sans connexion.');
  } catch (e) {
    toast('Enregistrement impossible ici : utilisez le menu du navigateur (Ajouter à l’écran d’accueil).');
  }
}

/* ---------- 1. Chronicles ---------- */
export const CHAPTERS = [
  {
    t: 'Chapitre 1 · Le premier écho',
    min: 0,
    L: [
      [
        'prof',
        'Chaque Pokémon porte une note. Quand deux notes s’accordent, la Résonance naît. Voilà ce que je cherche à comprendre depuis vingt ans.',
      ],
      ['prof', 'Votre partenaire a répondu à votre voix dès le premier jour. C’est rare, et c’est précieux.'],
      ['kael', 'Alors c’est toi, la nouvelle recrue du Prof. Je m’appelle Kael. On verra bientôt qui entend le mieux.'],
    ],
  },
  {
    t: 'Chapitre 2 · Une note qui manque',
    min: 1,
    L: [
      [
        'prof',
        'Votre premier badge vibre dans la Résonance. Mais écoutez : il manque une note dans l’enregistrement de la région.',
      ],
      ['prof', 'Quelque chose efface les notes au fil des routes. Je l’appelle la Dissonance.'],
      [
        'kael',
        'Une Dissonance ? Ça ressemble à un prétexte pour me ralentir. Mais je viens avec toi, juste pour voir.',
      ],
    ],
  },
  {
    t: 'Chapitre 3 · Les fréquences brouillées',
    min: 2,
    L: [
      [
        'prof',
        'Les capteurs du labo captent des fréquences brouillées autour des arènes. Quelqu’un teste un brouilleur.',
      ],
      ['kael', 'Tu crois que les Champions sont impliqués ? Je n’y crois pas. Ils se battent pour leur ville.'],
      ['prof', 'Gardez l’oreille ouverte. Une Résonance sincère ne se force pas, et ne s’achète pas.'],
    ],
  },
  {
    t: 'Chapitre 4 · L’ombre d’Orphée',
    min: 3,
    L: [
      [
        'prof',
        'Il y a longtemps, un homme nommé Orphée Valcourt a cherché à contrôler la Résonance. Il a perdu son équipe, puis tout le reste.',
      ],
      ['orphee', 'On croit contrôler une mélodie. En réalité, c’est elle qui vous apprend à écouter.'],
      ['prof', 'Orphée a dissous sa propre équipe. Mais l’écho qu’il a laissé, lui, ne s’est jamais éteint.'],
    ],
  },
  {
    t: 'Chapitre 5 · Le silence de Kael',
    min: 4,
    L: [
      [
        'kael',
        'J’ai perdu un combat hier. Pas contre toi : contre moi-même. Mon Pokémon m’écoutait, et je n’entendais plus rien.',
      ],
      ['prof', 'La Résonance ne s’impose pas, Kael. Elle se partage.'],
      [
        'kael',
        'Alors apprends-moi. Je ne gagnerai peut-être jamais contre toi, mais je veux comprendre ce que tu entends.',
      ],
    ],
  },
  {
    t: 'Chapitre 6 · La Dissonance se réveille',
    min: 5,
    L: [
      [
        'prof',
        'Les capteurs s’affolent. La Dissonance n’est plus une rumeur : des habitants perdent la mémoire de leur propre musique.',
      ],
      ['kael', 'Ils veulent faire taire la région tout entière. Pourquoi ?'],
      ['prof', 'Parce qu’une région silencieuse n’a plus de défense. Il faut les arrêter avant la Ligue.'],
    ],
  },
  {
    t: 'Chapitre 7 · Les trois fréquences',
    min: 6,
    L: [
      [
        'prof',
        'Dans les archives, trois fréquences reviennent : l’écho, la tempête et le silence. La Dissonance cherche à les réunir.',
      ],
      [
        'orphee',
        'Je ne peux plus combattre. Mais je peux vous dire où écouter : là où le bruit s’arrête, la vérité commence.',
      ],
      ['kael', 'Alors on y va ensemble. Chacun avec son équipe, chacun avec sa note.'],
    ],
  },
  {
    t: 'Chapitre 8 · La Résonance finale',
    min: 8,
    L: [
      [
        'prof',
        'Huit badges, huit notes. Vous n’avez pas seulement gagné des combats : vous avez rendu leur voix à toute une région.',
      ],
      ['kael', 'Je n’ai pas gagné contre toi. Mais je t’entends enfin. C’est une victoire d’un autre genre.'],
      ['prof', 'La Ligue vous attend. Et quoi qu’il arrive, rappelez-vous : la Résonance vit tant qu’on l’écoute.'],
    ],
  },
];

export const CHAPTER_NAMES = {
  j1: 'Arrivée à Johto',
  jd1: 'La Team Dissonance',
  jd2: 'La tour en flammes',
  jd3: 'L’Antenne Rouge',
  jd4: 'Le Relais',
  jchamp: 'Le Champion de Johto',
  roam: 'La bête errante',
  rv5: 'Kael à Johto',
  h1: 'Arrivée à Hoenn',
  hchamp: 'Le Champion de Hoenn',
};

export const chapterState = () => readLS('res-chronicle', { read: {} });

/* ---------- 2. Offline mode (music in cache) ---------- */
export const offlineSupported = () => {
  try {
    return (
      typeof caches !== 'undefined' &&
      typeof fetch === 'function' &&
      typeof URL !== 'undefined' &&
      !!URL.createObjectURL
    );
  } catch (e) {
    return false;
  }
};

export const chapterTracks = () => Object.entries(MUSIC.src);

// Startup statements, run in their original order (see index.js).
export function init() {
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-chronicle]');
      if (!b || b.disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.chronicle;
      if (v[0] === 's') {
        const k = v.slice(1);
        if (SCENES[k]) {
          chapterPlay(SCENES[k], k);
        }
      } else {
        chapterOpen(+v);
      }
    },
    true
  );

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-offline-pack]');
      if (!b || b.disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.offlinePack;
      if (v === 'dl') {
        offlineDownload();
      } else if (v === 'rm') {
        offlineClear();
      } else if (v === 'jeu') {
        offlineSave();
      }
    },
    true
  );

  // « Chroniques » (Chronicles) and « Mode hors ligne » (Offline mode) panels: rendered by React (src/screens/settings/panels/)

  window.addEventListener('offline', () => toast('Vous êtes hors ligne : le jeu continue de fonctionner.'));

  setTimeout(() => offlineLoad(), 1500);
}
