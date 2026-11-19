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
  'battle-help': BattleHelp,
  'event-choice': RouteEncounter,
  'secret-places': SecretPlace,
  passerby: PassingNpc,
  souvenirs: CompanionKeepsakes,
  'season-event-o': SeasonEvent,
  'boss-rush-o': BossRush,
  'defense-gym-o': DefenseGym,
  'daily-challenges-o': ChallengesHub,
  x2470o: X2470,
  duel433r: DuelRelay,
  'timed-catch': TimingGauge,
};

export default function Transients() {
  const listItems = useTemporaries();
  return listItems.map(({ id, data, v }) => {
    const C = PAR_ID[id];
    return C ? <C key={id + v} d={data} /> : null;
  });
}
