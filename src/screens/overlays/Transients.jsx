import { useTemporaries } from './tempStore.js';
import Vs from './transients/Vs.jsx';
import Duel433 from './transients/Duel433.jsx';
import Tm453 from './transients/Tm453.jsx';
import { Help452, Br466, Df468, Ev454, Npc460, Sa465, Sc460, Souv461, X2470, X470 } from './transients/Windows.jsx';

// Engine temporary windows (formerly overlay() on <body>), in opening order,
// at the end of the shell. Key = id + version: each opening starts from a fresh node.
const PAR_ID = {
  vs: Vs,
  hp452: Help452,
  evs454: Ev454,
  sc460: Sc460,
  pn460: Npc460,
  souv461: Souv461,
  sa465o: Sa465,
  br466o: Br466,
  df468o: Df468,
  x470o: X470,
  x2470o: X2470,
  duel433r: Duel433,
  ct453: Tm453
};

export default function Transients() {
  const listItems = useTemporaries();
  return listItems.map(({ id, data, v }) => {
    const C = PAR_ID[id];
    return C ? <C key={id + v} d={data} /> : null;
  });
}
