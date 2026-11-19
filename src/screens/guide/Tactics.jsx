import { ROLES } from '../../engine/004-data.js';
import { ROLEFX, SYN, rIco, synOf } from '../../engine/012-recruits-roles-synergies.js';
import { tc } from '../../engine/014-utils.js';
import { squad } from '../../engine/020-team-cards.js';
import { ACCORDS } from '../../engine/049-identity.js';
import { ECHOS, RANGS, stars } from '../../engine/053-resonance.js';
import { Html } from '../../lib/html.jsx';
import { useGuide } from './guideStore.js';

const OBSTACLES = [
  ['pil', 'Pilier', 'Infranchissable. Bloque les tirs directs (cible unique et ligne). Les zones passent par-dessus.'],
  ['rock', 'Rocher', 'Couverture : −40 % contre les tirs venant de l’autre côté. Une capacité à cible unique peut y ricocher vers l’ennemi le plus proche (−25 %).'],
  ['grass', 'Hautes herbes', 'Un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase.'],
  ['sand', 'Sable', '2 Mouvements pour y entrer. Sol, Roche, Acier et volants y sont chez eux : −2 dégâts subis.'],
  ['water', 'Eau', 'Compte comme Trempé : prépare Court-circuit, Banquise, Vapeur.'],
];

// Codex tactique : rôles, synergies (celles de l'équipe actuelle sont allumées), obstacles.
export function Codex() {
  useGuide(); // relu à chaque affichage du Guide : l'équipe a pu changer
  const act = synOf(squad).map(s => s.k);
  return (
    <>
      <div className="cx-c"><h4>Rôles</h4>
        {ROLES.map(r => {
          const R = ROLEFX[r.n];
          return <div key={r.n} className="cx-r"><Html html={rIco(r.n)} /><span><b>{r.n} · {R.k}</b><em><Html html={R.d} /></em></span></div>;
        })}
      </div>
      <div className="cx-c"><h4>Synergies de types<span>{act.length} active{act.length > 1 ? 's' : ''}</span></h4>
        {SYN.map(s => (
          <div key={s.k} className={`cx-r syn${act.includes(s.k) ? ' on' : ''}`}>
            <span className="syn-t">{s.t.map(t => <i key={t} style={{ background: tc(t) }} />)}</span>
            <span><b>{s.n}</b><em><Html html={s.d} /></em></span>
          </div>
        ))}
      </div>
      <div className="cx-c"><h4>Obstacles d’arène</h4>
        {OBSTACLES.map(([k, n, d]) => <div key={k} className="cx-r"><span className={`ob-i ob-${k}`} aria-hidden="true" /><span><b>{n}</b><em>{d}</em></span></div>)}
      </div>
    </>
  );
}

// Accords de Résonance (v4.10) : trois types dans la même manche déclenchent un effet d'équipe.
export function Chords() {
  return (
    <section className="acc-codex" aria-label="Accords de Résonance">
      <h3 className="h3">Accords de Résonance</h3>
      <p className="d">Avec la Tactique avancée : dans une même manche, trois attaques de vos Pokémon dont les types forment un accord déclenchent un effet d’équipe. Un accord par manche.</p>
      {ACCORDS.map(a => (
        <div key={a.n} className="acc-row">
          <span className="acc-t">{a.t.map(t => <i key={t} style={{ background: tc(t) }} title={t} />)}</span>
          <span><b>{a.n}</b> · {a.t.join(' + ')}<em><Html html={a.d} /></em></span>
        </div>
      ))}
    </section>
  );
}

// La Résonance en combat (v4.14) : rangs, attaques Expertes, notes et échos de type.
export function ResonanceInBattle() {
  return (
    <section className="acc-codex reso-codex" aria-label="La Résonance en combat">
      <h3 className="h3">La Résonance en combat</h3>
      <p className="d">Chaque Pokémon a un rang, selon son coût en PC : Faible (1), Moyen (2 et 3), Fort (4 et 5), Expert (6 et plus, et les légendaires). Un Éveil le fait monter de rang. Chaque rang a son rôle : avec trois rangs différents, l’équipe est en <b>Harmonie</b> et chaque Pokémon commence le combat avec 1 losange.</p>
      {Object.entries(RANGS).map(([k, r]) => (
        <div key={k} className="acc-row"><span className={`acc-t rg rg-${k}`}><Html html={stars(k)} /></span><span><b>{r.n} · {r.k}</b><em><Html html={r.d} /></em></span></div>
      ))}
      <p className="d"><b>Attaques classées.</b> Faibles (Puissance 6 ou moins), Moyennes (7 à 9), Fortes (10 et plus). Les capacités signature offensives et celles des légendaires sont <b>Expertes</b> : elles coûtent 2 losanges de Résonance (1 pour un Pokémon Expert). Un Pokémon au stade final remplit ses losanges pour elles, comme les autres pour l’Éveil.</p>
      <p className="d"><b>Notes de Résonance.</b> Chaque Pokémon différent qui frappe une même cible dans la manche y pose une note (deux pour un Pokémon Moyen). À la troisième : « Résonance ! » Ce coup fait ×1,5 et déclenche l’écho de son type, sauf si une réaction du terrain vient d’avoir lieu sur cette case. Les notes s’effacent en fin de manche.</p>
      {Object.entries(ECHOS).map(([t, d]) => (
        <div key={t} className="acc-row"><span className="acc-t"><i style={{ background: tc(t) }} title={t} /></span><span><b>Écho {t}</b><em><Html html={d} /></em></span></div>
      ))}
      <p className="d">Maîtres d’arène, rival, Conseil 4, Maître de la Ligue, légendaires et colosses se servent aussi des notes et des attaques Expertes. Sur les terrains et dans la Tour de Résonance, les adversaires ne les utilisent pas.</p>
    </section>
  );
}

export default function Tactics() {
  return (
    <>
      <div className="gd-intro"><h2 className="h2">Rôles, synergies, obstacles</h2><p className="d">Chaque rôle a sa mécanique, deux types complémentaires ouvrent une synergie, et le terrain change la portée des tirs.</p></div>
      <div className="codex" id="codex"><Codex /></div>
      <Chords />
      <ResonanceInBattle />
    </>
  );
}
