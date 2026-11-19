import { useTemporaries } from './tempStore.js';
import Vs from './transients/Vs.jsx';
import DuelRelay from './transients/DuelRelay.jsx';
import TimingGauge from './transients/TimingGauge.jsx';
import {
  BattleHelp,
  BossRush,
  DefenseGym,
  RouteEncounter,
  PassingNpc,
  SeasonEvent,
  SecretPlace,
  CompanionKeepsakes,
  X2470,
  ChallengesHub,
} from './transients/Windows.jsx';

// Engine temporary windows (formerly overlay() on <body>), in opening order,
// at the end of the shell. Key = id + version: each opening starts from a fresh node.
const PAR_ID = {
  vs: Vs,
  battleHelp: BattleHelp,
  eventChoice: RouteEncounter,
  secretPlaces: SecretPlace,
  passerby: PassingNpc,
  souvenirs: CompanionKeepsakes,
  seasonEventO: SeasonEvent,
  bossRushO: BossRush,
  defenseGymO: DefenseGym,
  dailyChallengesO: ChallengesHub,
  x2470o: X2470,
  duel433r: DuelRelay,
  timedCatch: TimingGauge,
};

export default function Transients() {
  const listItems = useTemporaries();
  return listItems.map(({ id, data, v }) => {
    const C = PAR_ID[id];
    return C ? <C key={id + v} d={data} /> : null;
  });
}
