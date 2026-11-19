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
import { init as uiPreferences } from './ui/preferences.js';
import { init as audioSoundEffects } from './audio/sound-effects.js';
import { init as combatBattlePrep } from './combat/battle-prep.js';
import { init as progressionCampaign } from './progression/campaign.js';
import { init as progressionTutorial } from './progression/tutorial.js';
import { init as modesGymScreen } from './modes/gym-screen.js';
import { init as combatMoveEffects } from './combat/move-effects.js';
import { init as uiGuide } from './ui/guide.js';
import { init as progressionPrestige } from './progression/prestige.js';
import { init as worldHomeJourney } from './world/home-journey.js';
import { init as assetsItemIcons } from './assets/item-icons.js';
import { init as itemsBallChoice } from './items/ball-choice.js';
import { init as itemsBattlePotions } from './items/battle-potions.js';
import { init as uiPhoneMenu } from './ui/phone-menu.js';
import { init as worldHome } from './world/home.js';
import { init as worldMap } from './world/map.js';
import { init as progressionPokedex } from './progression/pokedex.js';
import { init as progressionQuestsShop } from './progression/quests-shop.js';
import { init as uiSettings } from './ui/settings.js';
import { init as assetsIllustrations } from './assets/illustrations.js';
import { init as uiFrenchTypography } from './ui/french-typography.js';
import { init as uiImageFallback } from './ui/image-fallback.js';
import { init as pokemonShiny } from './pokemon/shiny.js';
import { init as combatLeaderStyles } from './combat/leader-styles.js';
import { init as modesLegendaries } from './modes/legendaries.js';
import { init as modesResonanceTower } from './modes/resonance-tower.js';
import { init as combatTacticalEngine } from './combat/tactical-engine.js';
import { init as movesTms } from './moves/tms.js';
import { init as combatLivingBoard } from './combat/living-board.js';
import { init as combatTactics } from './combat/tactics.js';
import { init as combatMutators } from './combat/mutators.js';
import { init as progressionCampaignChallenges } from './progression/campaign-challenges.js';
import { init as progressionAchievements } from './progression/achievements.js';
import { init as teamCharacters } from './team/characters.js';
import { init as progressionBaseCamp } from './progression/base-camp.js';
import { init as progressionExpeditions } from './progression/expeditions.js';
import { init as worldSeasons } from './world/seasons.js';
import { init as progressionTeamDissonance } from './progression/team-dissonance.js';
import { init as combatBestMoveReplay } from './combat/best-move-replay.js';
import { init as movesEpicTms } from './moves/epic-tms.js';
import { init as movesTechnicalRoster } from './moves/technical-roster.js';
import { init as combatResonance } from './combat/resonance.js';
import { init as worldJohto } from './world/johto.js';
import { init as worldJohtoStory } from './world/johto-story.js';
import { init as worldRoamingBeasts } from './world/roaming-beasts.js';
import { init as worldDominantPokemon } from './world/dominant-pokemon.js';
import { init as progressionDaycare } from './progression/daycare.js';
import { init as combatDuoTechniques } from './combat/duo-techniques.js';
import { init as modesFriendChallenges } from './modes/friend-challenges.js';
import { init as uiWhatsNew } from './ui/whats-new.js';
import { init as combatResonantForm } from './combat/resonant-form.js';
import { init as progressionCompanionPokemon } from './progression/companion-pokemon.js';
import { init as worldPokegear } from './world/pokegear.js';
import { init as progressionStoryDialogues } from './progression/story-dialogues.js';
import { init as progressionCampGarden } from './progression/camp-garden.js';
import { init as modesFriendsTournament } from './modes/friends-tournament.js';
import { init as modesFishing } from './modes/fishing.js';
import { init as modesSafari } from './modes/safari.js';
import { init as modesCoop } from './modes/coop.js';
import { init as worldHoenn } from './world/hoenn.js';
import { init as combatIntensity } from './combat/intensity.js';
import { init as progressionRegionalDex } from './progression/regional-dex.js';
import { init as combatQuickBattle } from './combat/quick-battle.js';
import { init as worldLivingHome } from './world/living-home.js';
import { init as uiTouchGestures } from './ui/touch-gestures.js';
import { init as uiBattleTips } from './ui/battle-tips.js';
import { init as modesRival } from './modes/rival.js';
import { init as progressionStoryScenes } from './progression/story-scenes.js';
import { init as modesLegendaryCaptures } from './modes/legendary-captures.js';
import { init as modesWeeklyChallenge } from './modes/weekly-challenge.js';
import { init as combatExpressivePokemon } from './combat/expressive-pokemon.js';
import { init as progressionCamp } from './progression/camp.js';
import { init as uiGameMode } from './ui/game-mode.js';
import { init as worldMapScroll } from './world/map-scroll.js';
import { init as toolsActionReplay } from './tools/action-replay.js';
import { init as combatDeployment } from './combat/deployment.js';
import { init as combatDoctrines } from './combat/doctrines.js';
import { init as progressionTacticalJournal } from './progression/tactical-journal.js';
import { init as combatFogOfWar } from './combat/fog-of-war.js';
import { init as modesRiddles } from './modes/riddles.js';
import { init as progressionFamilyMastery } from './progression/family-mastery.js';
import { init as modesDeepEcho } from './modes/deep-echo.js';
import { init as modesCustomArenas } from './modes/custom-arenas.js';
import { init as modesCampChallenges } from './modes/camp-challenges.js';
import { init as teamIndividuals } from './team/individuals.js';
import { init as teamSavedTeams } from './team/saved-teams.js';
import { init as teamSynergyFormations } from './team/synergy-formations.js';
import { init as uiAccessibility } from './ui/accessibility.js';
import { init as progressionPantheon } from './progression/pantheon.js';
import { init as modesDuel } from './modes/duel.js';
import { init as uiTutorialChapters } from './ui/tutorial-chapters.js';
import { init as combatCompactBattle } from './combat/compact-battle.js';
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
import { init as modesShadowBattles } from './modes/shadow-battles.js';
import { init as modesDailyChallenge } from './modes/daily-challenge.js';
import { init as modesChallengePrestige } from './modes/challenge-prestige.js';
import { init as modesChallengesHub } from './modes/challenges-hub.js';
import { init as modesTrainerOfTheWeek } from './modes/trainer-of-the-week.js';
import { init as modesShadowsRematch } from './modes/shadows-rematch.js';
import { init as modesRivalry } from './modes/rivalry.js';
import { init as modesChallengeWeather } from './modes/challenge-weather.js';
import { init as modesRelicShowcase } from './modes/relic-showcase.js';
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
  uiPreferences,
  audioSoundEffects,
  combatBattlePrep,
  progressionCampaign,
  progressionTutorial,
  modesGymScreen,
  combatMoveEffects,
  uiGuide,
  progressionPrestige,
  worldHomeJourney,
  assetsItemIcons,
  itemsBallChoice,
  itemsBattlePotions,
  uiPhoneMenu,
  worldHome,
  worldMap,
  progressionPokedex,
  progressionQuestsShop,
  uiSettings,
  assetsIllustrations,
  uiFrenchTypography,
  uiImageFallback,
  pokemonShiny,
  combatLeaderStyles,
  modesLegendaries,
  modesResonanceTower,
  combatTacticalEngine,
  movesTms,
  combatLivingBoard,
  combatTactics,
  combatMutators,
  progressionCampaignChallenges,
  progressionAchievements,
  teamCharacters,
  progressionBaseCamp,
  progressionExpeditions,
  worldSeasons,
  progressionTeamDissonance,
  combatBestMoveReplay,
  movesEpicTms,
  movesTechnicalRoster,
  combatResonance,
  worldJohto,
  worldJohtoStory,
  worldRoamingBeasts,
  worldDominantPokemon,
  progressionDaycare,
  combatDuoTechniques,
  modesFriendChallenges,
  uiWhatsNew,
  combatResonantForm,
  progressionCompanionPokemon,
  worldPokegear,
  progressionStoryDialogues,
  progressionCampGarden,
  modesFriendsTournament,
  modesFishing,
  modesSafari,
  modesCoop,
  worldHoenn,
  combatIntensity,
  progressionRegionalDex,
  combatQuickBattle,
  worldLivingHome,
  uiTouchGestures,
  uiBattleTips,
  modesRival,
  progressionStoryScenes,
  modesLegendaryCaptures,
  modesWeeklyChallenge,
  combatExpressivePokemon,
  progressionCamp,
  uiGameMode,
  worldMapScroll,
  toolsActionReplay,
  combatDeployment,
  combatDoctrines,
  progressionTacticalJournal,
  combatFogOfWar,
  modesRiddles,
  progressionFamilyMastery,
  modesDeepEcho,
  modesCustomArenas,
  modesCampChallenges,
  teamIndividuals,
  teamSavedTeams,
  teamSynergyFormations,
  uiAccessibility,
  progressionPantheon,
  modesDuel,
  uiTutorialChapters,
  combatCompactBattle,
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
  modesShadowBattles,
  modesDailyChallenge,
  modesChallengePrestige,
  modesChallengesHub,
  modesTrainerOfTheWeek,
  modesShadowsRematch,
  modesRivalry,
  modesChallengeWeather,
  modesRelicShowcase,
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
