import { POKEMON } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { $ } from '../core/utils.js';
import { battle } from '../combat/ui.js';
import { AUTO } from './prestige.js';
import { avatar } from '../world/home-journey.js';
import { SCENES, currentScene, __set_currentScene, renderStoryScene } from './story-dialogues.js';
import { rivalAce } from '../modes/rival.js';

/* Story scenes around the big battles: speakers, post-battle dialogue, Hoenn arrival and finale (added in v4.29). */

const POST_BATTLE_DIALOGUE = {
  champ: [['prof', 'Championne vaincue ! Kanto vous appartient… et Johto vous attend, au bout de la Route 29.']],
  jchamp: [['prof', 'Maître de Johto ! Kael vient de m’appeler : il est parti pour Hoenn. Vous devriez le suivre.']],
  rv5: [
    ['kael', 'Encore toi… Tu sais quoi ? Je file à Hoenn.'],
    ['prof', 'Votre rival n’abandonne jamais. On le reverra, j’en suis sûre.'],
  ],
  rv6: [
    ['kael', '…D’accord. Tu es meilleur que moi. Pour l’instant.'],
    ['kael', 'Le Maître de Hoenn t’attend. Si tu perds contre lui, je ne te le pardonnerai pas.'],
  ],
  hd429: [
    ['sirene', 'Les Échos se taisent… On ne contrôle pas la Résonance.'],
    ['vesper', 'Cette fois, c’est vraiment fini. Merci… Je vais aider le Prof. Sorbier à réparer ce qu’on a abîmé.'],
  ],
  hchamp: [
    ['prof', 'Maître de Hoenn ! Trois régions, une seule Résonance.'],
    [
      'prof',
      'On raconte que les légendes ne fuient plus devant vous… Ouvrez l’onglet « Légendes » des Quêtes : elles peuvent désormais être capturées.',
    ],
  ],
};

export function npcProfile(who) {
  if (who === 'kael') {
    const ace = POKEMON[rivalAce()];
    return { n: 'Kael Ferrand', av: avatar('Kael Ferrand', ace ? ace.t[0] : 'Normal', 'is-small') };
  }
  if (who === 'sirene') {
    return { n: 'Sirène', av: avatar('Sirène', 'Ténèbres', 'is-small') };
  }
  if (who === 'vesper') {
    return { n: 'Vesper', av: avatar('Vesper', 'Spectre', 'is-small') };
  }
  return null;
}

/** Post-battle scene: only once, after a victory. */
export function afterBattleScene(sc, win, force) {
  const c = 'apres-' + sc,
    Lg = POST_BATTLE_DIALOGUE[sc];
  if (
    !win ||
    !Lg ||
    (AUTO && !force) ||
    (PROFILE.scenes && PROFILE.scenes[c]) ||
    (currentScene && currentScene.c === c)
  ) {
    return;
  }
  if (sc === 'champ' && !isCamp()) {
    return;
  }
  afterBattleScene.seenFlags = afterBattleScene.seenFlags || {};
  if (afterBattleScene.seenFlags[c]) {
    return;
  }
  afterBattleScene.seenFlags[c] = 1;
  setTimeout(() => {
    if ((battle && !battle.over) || currentScene) {
      return;
    }
    __set_currentScene({ k: sc, c, i: 0, L: Lg, apres: true });
    renderStoryScene();
    $('#story-scene').hidden = false;
  }, 700);
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  if (!SCENES.h1) {
    SCENES.h1 = [
      ['prof', 'Hoenn ! Des volcans, des forêts tropicales et la mer à perte de vue.'],
      [
        'prof',
        'Huit arènes, chacune avec sa règle, et un Maître au Plateau. Lisez bien la règle avant de lancer le combat.',
      ],
    ];
  }

  if (!SCENES.hchamp) {
    SCENES.hchamp = [
      ['prof', 'Le Plateau de Hoenn… Huit badges, et Kael qui vous suit de près.'],
      ['prof', 'Le Maître change de tactique à chaque phase. Gardez des Voix et des soins pour la fin.'],
    ];
  }
}
