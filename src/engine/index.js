/* Game engine startup.
   Module bodies only declare (constants, tables, functions); whatever must run at startup
   lives in each module's init(), called below in a fixed order (the order the features were
   added in, which later features rely on). A module without init (data only) is not listed. */
import { init as combatTurnCore } from './combat/turn-core.js';
import { init as coreErrors } from './core/errors.js';
import { init as assetsImages } from './assets/images.js';
import { init as dataGameData } from './data/game-data.js';
import { init as dataMoves } from './data/moves.js';
import { init as dataSignatureMoves } from './data/signature-moves.js';
import { init as dataJohto } from './data/johto.js';
import { init as dataHoenn } from './data/hoenn.js';
import { init as pokemonPokemon } from './pokemon/pokemon.js';
import { init as pokemonEvolution } from './pokemon/evolution.js';
import { init as stateGameState } from './state/game-state.js';
import { init as pokemonRolesSynergies } from './pokemon/roles-synergies.js';
import { init as modesGyms } from './modes/gyms.js';
import { init as coreUtils } from './core/utils.js';
import { init as coreNavigation } from './core/navigation.js';
import { init as worldHomeRoute } from './world/home-route.js';
import { init as modesLeague } from './modes/league.js';
import { init as teamTeam } from './team/team.js';
import { init as combatEngine } from './combat/engine.js';
import { init as combatItemsBondsAi } from './combat/items-bonds-ai.js';
import { init as combatSynergiesObstacles } from './combat/synergies-obstacles.js';
import { init as combatUi } from './combat/ui.js';
import { init as stateSaves } from './state/saves.js';
import { init as progressionCampaign } from './progression/campaign.js';
import { init as modesGymScreen } from './modes/gym-screen.js';
import { init as combatMoveEffects } from './combat/move-effects.js';
import { init as uiGuide } from './ui/guide.js';
import { init as progressionPrestige } from './progression/prestige.js';
import { init as worldHomeJourney } from './world/home-journey.js';
import { init as stateEconomy } from './state/economy.js';
import { init as coreInterface } from './core/interface.js';
import { init as worldHome } from './world/home.js';
import { init as worldMap } from './world/map.js';
import { init as progressionPokedex } from './progression/pokedex.js';
import { init as progressionQuestsShop } from './progression/quests-shop.js';
import { init as uiSettings } from './ui/settings.js';
import { init as assetsIllustrations } from './assets/illustrations.js';
import { init as uiPolish } from './ui/polish.js';
import { init as modesAdventure } from './modes/adventure.js';
import { init as combatTacticalEngine } from './combat/tactical-engine.js';
import { init as movesTms } from './moves/tms.js';
import { init as combatLivingBoard } from './combat/living-board.js';
import { init as combatTactics } from './combat/tactics.js';
import { init as progressionAchievementsChallenges } from './progression/achievements-challenges.js';
import { init as teamIdentity } from './team/identity.js';
import { init as worldSeasons } from './world/seasons.js';
import { init as movesEpicTms } from './moves/epic-tms.js';
import { init as movesTechnicalRoster } from './moves/technical-roster.js';
import { init as combatResonance } from './combat/resonance.js';
import { init as worldJohto } from './world/johto.js';
import { init as worldLivingJohto } from './world/living-johto.js';
import { init as uiWhatsNew } from './ui/whats-new.js';
import { init as progressionCompanions } from './progression/companions.js';
import { init as modesFishingSafariCoop } from './modes/fishing-safari-coop.js';
import { init as worldHoenn } from './world/hoenn.js';
import { init as combatIntensity } from './combat/intensity.js';
import { init as combatCatches } from './combat/catches.js';
import { init as progressionQuality } from './progression/quality.js';
import { init as progressionCamp } from './progression/camp.js';
import { init as modesTacticalChallenges } from './modes/tactical-challenges.js';
import { init as teamIndividuals } from './team/individuals.js';
import { init as modesDuel } from './modes/duel.js';
import { init as pokemonEevee } from './pokemon/eevee.js';
import { init as audioMusic } from './audio/music.js';
import { init as worldHoennLegendaries } from './world/hoenn-legendaries.js';
import { init as toolsDownloadGame } from './tools/download-game.js';
import { init as toolsDesignWorkshop } from './tools/design-workshop.js';
import { init as combatPhoneBoard } from './combat/phone-board.js';
import { init as combatBoardTools } from './combat/board-tools.js';
import { init as audioImmersion } from './audio/immersion.js';
import { init as worldRareEncounters } from './world/rare-encounters.js';
import { init as modesNuzlocke } from './modes/nuzlocke.js';
import { init as worldHomeWeather } from './world/home-weather.js';
import { init as combatTimedCatch } from './combat/timed-catch.js';
import { init as worldRouteEvents } from './world/route-events.js';
import { init as modesShadowEpisodes } from './modes/shadow-episodes.js';
import { init as modesRivalBoardThemes } from './modes/rival-board-themes.js';
import { init as itemsBallsHeldItems } from './items/balls-held-items.js';
import { init as itemsWorkshop } from './items/workshop.js';
import { init as itemsExtraHeldItems } from './items/extra-held-items.js';
import { init as progressionItemQuests } from './progression/item-quests.js';
import { init as worldSecretPlaces } from './world/secret-places.js';
import { init as progressionCompanionEggs } from './progression/companion-eggs.js';
import { init as progressionChronicles } from './progression/chronicles.js';
import { init as teamFormations } from './team/formations.js';
import { init as progressionTalentTree } from './progression/talent-tree.js';
import { init as modesSeasonalEvents } from './modes/seasonal-events.js';
import { init as modesBossRush } from './modes/boss-rush.js';
import { init as modesFeatsGimmicks } from './modes/feats-gimmicks.js';
import { init as modesDefenseGym } from './modes/defense-gym.js';
import { init as combatResultScreen } from './combat/result-screen.js';
import { init as progressionRegionRewards } from './progression/region-rewards.js';
import { init as pokemonRegionalForms } from './pokemon/regional-forms.js';
import { init as modesDailyChallenges } from './modes/daily-challenges.js';
import { init as modesMoreChallenges } from './modes/more-challenges.js';
import { init as worldLivingMap } from './world/living-map.js';
import { init as combatBoardTerrain } from './combat/board-terrain.js';
import { init as uiPokemonSkin } from './ui/pokemon-skin.js';
import { init as combatBattleStaging } from './combat/battle-staging.js';
import { init as uiDialogues } from './ui/dialogues.js';
import { init as worldMapFluidity } from './world/map-fluidity.js';
import { init as coreStartup } from './core/startup.js';
import { init as combatPaintedBoard } from './combat/painted-board.js';

const STARTUP = [
  combatTurnCore,
  coreErrors,
  assetsImages,
  dataGameData,
  dataMoves,
  dataSignatureMoves,
  dataJohto,
  dataHoenn,
  pokemonPokemon,
  pokemonEvolution,
  stateGameState,
  pokemonRolesSynergies,
  modesGyms,
  coreUtils,
  coreNavigation,
  worldHomeRoute,
  modesLeague,
  teamTeam,
  combatEngine,
  combatItemsBondsAi,
  combatSynergiesObstacles,
  combatUi,
  stateSaves,
  progressionCampaign,
  modesGymScreen,
  combatMoveEffects,
  uiGuide,
  progressionPrestige,
  worldHomeJourney,
  stateEconomy,
  coreInterface,
  worldHome,
  worldMap,
  progressionPokedex,
  progressionQuestsShop,
  uiSettings,
  assetsIllustrations,
  uiPolish,
  modesAdventure,
  combatTacticalEngine,
  movesTms,
  combatLivingBoard,
  combatTactics,
  progressionAchievementsChallenges,
  teamIdentity,
  worldSeasons,
  movesEpicTms,
  movesTechnicalRoster,
  combatResonance,
  worldJohto,
  worldLivingJohto,
  uiWhatsNew,
  progressionCompanions,
  modesFishingSafariCoop,
  worldHoenn,
  combatIntensity,
  combatCatches,
  progressionQuality,
  progressionCamp,
  modesTacticalChallenges,
  teamIndividuals,
  modesDuel,
  pokemonEevee,
  audioMusic,
  worldHoennLegendaries,
  toolsDownloadGame,
  toolsDesignWorkshop,
  combatPhoneBoard,
  combatBoardTools,
  audioImmersion,
  worldRareEncounters,
  modesNuzlocke,
  worldHomeWeather,
  combatTimedCatch,
  worldRouteEvents,
  modesShadowEpisodes,
  modesRivalBoardThemes,
  itemsBallsHeldItems,
  itemsWorkshop,
  itemsExtraHeldItems,
  progressionItemQuests,
  worldSecretPlaces,
  progressionCompanionEggs,
  progressionChronicles,
  teamFormations,
  progressionTalentTree,
  modesSeasonalEvents,
  modesBossRush,
  modesFeatsGimmicks,
  modesDefenseGym,
  combatResultScreen,
  progressionRegionRewards,
  pokemonRegionalForms,
  modesDailyChallenges,
  modesMoreChallenges,
  worldLivingMap,
  combatBoardTerrain,
  uiPokemonSkin,
  combatBattleStaging,
  uiDialogues,
  worldMapFluidity,
  coreStartup,
  combatPaintedBoard,
];
for (const init of STARTUP) {
  init();
}
