/* =====================================================================
   Story dialogues (added in v4.17): scenes before the big Johto battles.
   ===================================================================== */
import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { $ } from '../core/utils.js';
import { launch } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { AUTO, leaderOf } from './prestige.js';
import { PROF_AV, avatar } from '../world/home-journey.js';
import { npcProfile } from './story-scenes.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';

export let SCN;
export function __set_SCN(v) {
  return (SCN = v);
}

export const SCENES = {
  j1: [
    ['prof', 'Bienvenue à Johto ! Huit nouvelles arènes, et des Pokémon que vous n’avez jamais vus.'],
    ['prof', 'Votre première adversaire, Zéphyrine Altair, se bat avec le vent. Restez près des rochers.'],
    ['j1', 'Le vent ne se bat pas. Il pousse, et il attend que vous tombiez.'],
  ],
  jd1: [
    ['prof', 'Des ondes étranges brouillent la Route 32… On dirait la Team Dissonance. Mais Orphée l’avait dissoute !'],
    ['jd1', 'La Dissonance, dissoute ? Elle a juste changé de chef. Cobalt nous a promis une Résonance qui obéit.'],
    ['prof', 'Leur brouilleur aspire vos losanges. Ne les laissez pas s’accumuler sur un seul Pokémon !'],
  ],
  jd2: [
    ['jd2', 'Toi encore. Tu sens cette fumée ? La vieille tour brûle, et c’est moi qui l’ai voulu.'],
    ['prof', 'Vesper ! Sous cette tour dorment trois Pokémon légendaires… Le feu pourrait les réveiller !'],
    [
      'jd2',
      'Orphée nous avait dissous. Cobalt m’a rappelée. Je ne sais plus qui a raison… mais je sais encore me battre.',
    ],
  ],
  jd3: [
    ['jd3', 'L’Éveil ? Un caprice. Il faut attendre un lien, une émotion… Quelle perte de temps.'],
    ['jd3', 'Mon Antenne Rouge fait évoluer mes Pokémon quand je le décide. Regarde bien.'],
    ['prof', 'Frappez vite : à la fin des manches 1 et 3, ses Pokémon évolueront de force !'],
  ],
  jd4: [
    ['jd4', 'Le Relais est prêt. Une seule impulsion, et toute la Résonance de Johto se taira.'],
    ['orphee', 'Cobalt… La Dissonance devait s’éteindre avec moi. Arrête ça.'],
    ['jd4', 'Orphée a choisi le silence. Moi, je choisis le contrôle. Ta Résonance s’arrête ici, dans mon brouillage.'],
  ],
  jchamp: [
    ['prof', 'Les huit badges de Johto, et la Néo-Dissonance réduite au silence… Vous y êtes.'],
    ['jchamp', 'Kanto vous a couronné. Johto, lui, vous juge.'],
    [
      'prof',
      'Orion Céleste se sert de tout : notes de Résonance, attaques Expertes… et, s’il le faut, de la Forme Résonante.',
    ],
  ],
  roam: [
    [
      'prof',
      'Une silhouette immense bondit entre les arbres… Une bête légendaire, réveillée par l’incendie de la tour !',
    ],
    [
      'prof',
      'Elle s’enfuira au bout de 4 manches, mais ses blessures resteront. Usez-la, retrouvez-la, puis apaisez-la.',
    ],
  ],
};

const sceneKeyOf = k => (SCENARIOS[k] && SCENARIOS[k].roam ? 'roam' : k);

function npcScene(who, k) {
  if (who === 'prof') {
    return { n: 'Prof. Sorbier', av: PROF_AV };
  }
  if (who === 'orphee') {
    return { n: 'Orphée Valcourt', av: avatar('Orphée Valcourt', 'Ténèbres', 'is-small') };
  }
  const storyNpc = npcProfile(who); // Kael, Sirène, Vesper (v4.29)
  if (storyNpc) {
    return storyNpc;
  }
  const L = leaderOf(who) || leaderOf(k);
  const S = SCENARIOS[who] || SCENARIOS[k] || {};
  return L ? { n: L.n, av: avatar(L.n, S.at || 'Normal', 'is-small') } : { n: '…', av: PROF_AV };
}

export function storyScene(k, force) {
  const c = sceneKeyOf(k),
    L = SCENES[c];
  if (!L || (PROFILE.scenes && PROFILE.scenes[c]) || (!force && AUTO)) {
    return false;
  } // no scene during automated tests
  SCN = { k, c, i: 0, L };
  renderStoryScene();
  $('#story-scene').hidden = false;
  return true;
}

export function renderStoryScene() {
  if (!SCN) {
    return;
  }
  const [who, txt] = SCN.L[SCN.i],
    q = npcScene(who, SCN.k),
    last = SCN.i === SCN.L.length - 1;
  // rendered by src/screens/overlays/StoryScene.jsx
  paintOverlay('scene', {
    av: q.av,
    n: q.n,
    txt,
    i: SCN.i,
    nb: SCN.L.length,
    suite: last ? (SCN.apres ? 'Continuer' : 'Au combat !') : 'Suite',
  });
}

function closeStoryScene() {
  if (!SCN) {
    return;
  }
  PROFILE.scenes = PROFILE.scenes || {};
  PROFILE.scenes[SCN.c] = 1;
  const ap = SCN.apres;
  SCN = null;
  $('#story-scene').hidden = true;
  queueSave();
  if (!ap) {
    launch();
  } // a post-battle scene triggers nothing else (v4.29)
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  // #storyScene: rendered by React (src/screens/overlays/StoryScene.jsx)

  SCN = null;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-scene]');
    if (!b && e.target.id !== 'story-scene') {
      return;
    }
    if (!SCN) {
      return;
    }
    if (b && b.dataset.scene === 'passer') {
      return closeStoryScene();
    }
    if (SCN.i < SCN.L.length - 1) {
      SCN.i++;
      renderStoryScene();
    } else {
      closeStoryScene();
    }
  });
}
