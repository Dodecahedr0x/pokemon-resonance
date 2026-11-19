/* Game engine: original sections, one per module.
   Module bodies only declare; startup calls each __init()
   in the original file's order, so execution order stays identical.
   A module without __init (data only, hooks) does not appear here. */
import { __init as init001 } from './001-tactical-engine-turn-core.js';
import { __init as init002 } from './002-errors.js';
import { __init as init003 } from './003-images.js';
import { __init as init004 } from './004-data.js';
import { __init as init005 } from './005-moves.js';
import { __init as init006 } from './006-signature-moves.js';
import { __init as init007 } from './007-johto-data.js';
import { __init as init008 } from './008-hoenn-data.js';
import { __init as init009 } from './009-pokemon.js';
import { __init as init010 } from './010-in-battle-evolution.js';
import { __init as init011 } from './011-game-state.js';
import { __init as init012 } from './012-recruits-roles-synergies.js';
import { __init as init013 } from './013-gyms.js';
import { __init as init014 } from './014-utils.js';
import { __init as init016 } from './016-navigation.js';
import { __init as init017 } from './017-home-route.js';
import { __init as init019 } from './019-league.js';
import { __init as init020 } from './020-team-cards.js';
import { __init as init021 } from './021-combat-engine.js';
import { __init as init022 } from './022-items-bonds-ai.js';
import { __init as init023 } from './023-roles-synergies-obstacles.js';
import { __init as init024 } from './024-combat-ui.js';
import { __init as init025 } from './025-saves.js';
import { __init as init026 } from './026-campaign-tutorial-sound.js';
import { __init as init027 } from './027-gym-on-screen.js';
import { __init as init028 } from './028-move-effects.js';
import { __init as init029 } from './029-streamlined-guide.js';
import { __init as init030 } from './030-prestige-staging.js';
import { __init as init031 } from './031-home-journey.js';
import { __init as init032 } from './032-v4-foundation.js';
import { __init as init035 } from './035-interface.js';
import { __init as init036 } from './036-home.js';
import { __init as init037 } from './037-map.js';
import { __init as init038 } from './038-pokedex.js';
import { __init as init039 } from './039-quests-shop.js';
import { __init as init040 } from './040-settings.js';
import { __init as init041 } from './041-illustrations.js';
import { __init as init042 } from './042-polish.js';
import { __init as init043 } from './043-adventure-plus.js';
import { __init as init044 } from './044-tactical-engine.js';
import { __init as init045 } from './045-tms-hms.js';
import { __init as init046 } from './046-living-board.js';
import { __init as init047 } from './047-tactics.js';
import { __init as init048 } from './048-replayability.js';
import { __init as init049 } from './049-identity.js';
import { __init as init050 } from './050-world.js';
import { __init as init051 } from './051-epic-tms.js';
import { __init as init052 } from './052-technical-roster.js';
import { __init as init053 } from './053-resonance.js';
import { __init as init054 } from './054-johto.js';
import { __init as init055 } from './055-living-johto.js';
import { __init as init056 } from './056-polish-v4-16.js';
import { __init as init057 } from './057-companions-resonance.js';
import { __init as init058 } from './058-fishing-safari-coop.js';
import { __init as init059 } from './059-hoenn.js';
import { __init as init060 } from './060-intense-combat.js';
import { __init as init063 } from './063-combat-catches-home.js';
import { __init as init064 } from './064-quality.js';
import { __init as init065 } from './065-camp-tactics.js';
import { __init as init066 } from './066-tactical-challenges.js';
import { __init as init067 } from './067-individuals-comfort.js';
import { __init as init068 } from './068-duel-tutorial.js';
import { __init as init069 } from './069-calibration-eevee.js';
import { __init as init070 } from './070-theme-music-player.js';
import { __init as init071 } from './071-hoenn-legendaries.js';
import { __init as init074 } from './074-download-game.js';
import { __init as init075 } from './075-css-design-workshop.js';
import { __init as init076 } from './076-large-phone-board.js';
import { __init as init077 } from './077-fullscreen-tile-zoom.js';
import { __init as init079 } from './079-immersion-sound-haptics.js';
import { __init as init080 } from './080-trainer-avatar-rare-encounters.js';
import { __init as init081 } from './081-nuzlocke-mode.js';
import { __init as init082 } from './082-living-home-weather.js';
import { __init as init083 } from './083-timed-catch-status.js';
import { __init as init084 } from './084-peddler-route-missions.js';
import { __init as init085 } from './085-resonance-shadows-episodes.js';
import { __init as init086 } from './086-adaptive-rival-board-themes.js';
import { __init as init087 } from './087-balls-held-items.js';
import { __init as init088 } from './088-workshop-recipes.js';
import { __init as init089 } from './089-extra-held-items-tms.js';
import { __init as init090 } from './090-item-quests-trophies.js';
import { __init as init091 } from './091-phase-bosses-secret-places.js';
import { __init as init092 } from './092-companion-eggs-expeditions.js';
import { __init as init093 } from './093-chronicles-chapters.js';
import { __init as init094 } from './094-team-formations.js';
import { __init as init095 } from './095-trainer-talent-tree.js';
import { __init as init096 } from './096-seasonal-events.js';
import { __init as init097 } from './097-boss-rush-relics.js';
import { __init as init098 } from './098-feats-journal-gimmick-boards.js';
import { __init as init099 } from './099-defense-gym.js';
import { __init as init100 } from './100-scrollable-result-screen.js';
import { __init as init101 } from './101-region-complete-reward.js';
import { __init as init102 } from './102-regional-forms.js';
import { __init as init103 } from './103-shadow-battles-ancient.js';
import { __init as init104 } from './104-rivalry-weekly-trainer.js';
import { __init as init105 } from './105-living-map.js';
import { __init as init106 } from './106-living-board-terrain.js';
import { __init as init107 } from './107-pokemon-skin-pokedex.js';
import { __init as init108 } from './108-pokemon-style-combat.js';
import { __init as init109 } from './109-pokemon-world-dialogues.js';
import { __init as init110 } from './110-map-animation-fluidity.js';
import { __init as init111 } from './111-startup.js';
import { __init as init112 } from './112-painted-graphics.js';

const STARTUP = [
  init001,
  init002,
  init003,
  init004,
  init005,
  init006,
  init007,
  init008,
  init009,
  init010,
  init011,
  init012,
  init013,
  init014,
  init016,
  init017,
  init019,
  init020,
  init021,
  init022,
  init023,
  init024,
  init025,
  init026,
  init027,
  init028,
  init029,
  init030,
  init031,
  init032,
  init035,
  init036,
  init037,
  init038,
  init039,
  init040,
  init041,
  init042,
  init043,
  init044,
  init045,
  init046,
  init047,
  init048,
  init049,
  init050,
  init051,
  init052,
  init053,
  init054,
  init055,
  init056,
  init057,
  init058,
  init059,
  init060,
  init063,
  init064,
  init065,
  init066,
  init067,
  init068,
  init069,
  init070,
  init071,
  init074,
  init075,
  init076,
  init077,
  init079,
  init080,
  init081,
  init082,
  init083,
  init084,
  init085,
  init086,
  init087,
  init088,
  init089,
  init090,
  init091,
  init092,
  init093,
  init094,
  init095,
  init096,
  init097,
  init098,
  init099,
  init100,
  init101,
  init102,
  init103,
  init104,
  init105,
  init106,
  init107,
  init108,
  init109,
  init110,
  init111,
  init112,
];
for (const init of STARTUP) {
  init();
}
