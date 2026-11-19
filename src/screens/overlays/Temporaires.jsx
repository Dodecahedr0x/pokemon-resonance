import { useTemporaires } from './tempStore.js';
import Vs from './temporaires/Vs.jsx';
import Duel433 from './temporaires/Duel433.jsx';
import Ct453 from './temporaires/Ct453.jsx';
import { Aide452, Br466, Df468, Ev454, Pn460, Sa465, Sc460, Souv461, X2470, X470 } from './temporaires/Fenetres.jsx';

// Fenêtres temporaires du moteur (ancien overlay() sur <body>), dans l'ordre d'ouverture,
// à la fin du shell. Clé = id + version : chaque ouverture repart d'un nœud neuf.
const PAR_ID = {
  vs: Vs,
  hp452: Aide452,
  evs454: Ev454,
  sc460: Sc460,
  pn460: Pn460,
  souv461: Souv461,
  sa465o: Sa465,
  br466o: Br466,
  df468o: Df468,
  x470o: X470,
  x2470o: X2470,
  duel433r: Duel433,
  ct453: Ct453
};

export default function Temporaires() {
  const liste = useTemporaires();
  return liste.map(({ id, data, v }) => {
    const C = PAR_ID[id];
    return C ? <C key={id + v} d={data} /> : null;
  });
}
