import { ROLES } from '../../engine/data/game-data.js';
import { ROLEFX, SYNERGIES, rIco, synOf } from '../../engine/pokemon/roles-synergies.js';
import { typeColor } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { CHORDS } from '../../engine/combat/resonance-chords.js';
import { ECHOS, RANKS, stars } from '../../engine/combat/resonance.js';
import { Html } from '../../lib/html.jsx';
import { useGuide } from './guideStore.js';

const OBSTACLES = [
  ['pil', 'Pilier', 'Infranchissable. Bloque les tirs directs (cible unique et ligne). Les zones passent par-dessus.'],
  [
    'rock',
    'Rocher',
    'Couverture : −40 % contre les tirs venant de l’autre côté. Une capacité à cible unique peut y ricocher vers l’ennemi le plus proche (−25 %).',
  ],
  ['grass', 'Hautes herbes', 'Un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase.'],
  ['sand', 'Sable', '2 Mouvements pour y entrer. Sol, Roche, Acier et volants y sont chez eux : −2 dégâts subis.'],
  ['water', 'Eau', 'Compte comme Trempé : prépare Court-circuit, Banquise, Vapeur.'],
];

// Tactical codex: roles, synergies (those of the current team are lit), obstacles.
export function Codex() {
  useGuide(); // re-read each time the Guide is shown: the team may have changed
  const act = synOf(squad).map(s => s.k);
  return (
    <>
      <div className="guide-codex-card">
        <h4>Rôles</h4>
        {ROLES.map(r => {
          const R = ROLEFX[r.n];
          return (
            <div key={r.n} className="guide-codex-row">
              <Html html={rIco(r.n)} />
              <span>
                <b>
                  {r.n} · {R.k}
                </b>
                <em>
                  <Html html={R.d} />
                </em>
              </span>
            </div>
          );
        })}
      </div>
      <div className="guide-codex-card">
        <h4>
          Synergies de types
          <span>
            {act.length} active{act.length > 1 ? 's' : ''}
          </span>
        </h4>
        {SYNERGIES.map(s => (
          <div key={s.k} className={`guide-codex-row is-synergy${act.includes(s.k) ? ' is-active' : ''}`}>
            <span className="synergy-types">
              {s.t.map(t => (
                <i key={t} style={{ background: typeColor(t) }} />
              ))}
            </span>
            <span>
              <b>{s.n}</b>
              <em>
                <Html html={s.d} />
              </em>
            </span>
          </div>
        ))}
      </div>
      <div className="guide-codex-card">
        <h4>Obstacles d’arène</h4>
        {OBSTACLES.map(([k, n, d]) => (
          <div key={k} className="guide-codex-row">
            <span className={`guide-obstacle is-${k}`} aria-hidden="true" />
            <span>
              <b>{n}</b>
              <em>{d}</em>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// Resonance Chords (v4.10): three types in the same round trigger a team effect.
export function Chords() {
  return (
    <section className="guide-chords" aria-label="Accords de Résonance">
      <h3 className="card-title">Accords de Résonance</h3>
      <p className="d">
        Avec la Tactique avancée : dans une même manche, trois attaques de vos Pokémon dont les types forment un accord
        déclenchent un effet d’équipe. Un accord par manche.
      </p>
      {CHORDS.map(a => (
        <div key={a.n} className="guide-chord">
          <span className="guide-chord-tag">
            {a.t.map(t => (
              <i key={t} style={{ background: typeColor(t) }} title={t} />
            ))}
          </span>
          <span>
            <b>{a.n}</b> · {a.t.join(' + ')}
            <em>
              <Html html={a.d} />
            </em>
          </span>
        </div>
      ))}
    </section>
  );
}

// Resonance in battle (v4.14): ranks, Expert attacks, notes and type echoes.
export function ResonanceInBattle() {
  return (
    <section className="guide-chords is-resonance" aria-label="La Résonance en combat">
      <h3 className="card-title">La Résonance en combat</h3>
      <p className="d">
        Chaque Pokémon a un rang, selon son coût en PC : Faible (1), Moyen (2 et 3), Fort (4 et 5), Expert (6 et plus,
        et les légendaires). Un Éveil le fait monter de rang. Chaque rang a son rôle : avec trois rangs différents,
        l’équipe est en <b>Harmonie</b> et chaque Pokémon commence le combat avec 1 losange.
      </p>
      {Object.entries(RANKS).map(([k, r]) => (
        <div key={k} className="guide-chord">
          <span className={`guide-chord-tag rank-tag rank-${k}`}>
            <Html html={stars(k)} />
          </span>
          <span>
            <b>
              {r.n} · {r.k}
            </b>
            <em>
              <Html html={r.d} />
            </em>
          </span>
        </div>
      ))}
      <p className="d">
        <b>Attaques classées.</b> Faibles (Puissance 6 ou moins), Moyennes (7 à 9), Fortes (10 et plus). Les capacités
        signature offensives et celles des légendaires sont <b>Expertes</b> : elles coûtent 2 losanges de Résonance (1
        pour un Pokémon Expert). Un Pokémon au stade final remplit ses losanges pour elles, comme les autres pour
        l’Éveil.
      </p>
      <p className="d">
        <b>Notes de Résonance.</b> Chaque Pokémon différent qui frappe une même cible dans la manche y pose une note
        (deux pour un Pokémon Moyen). À la troisième : « Résonance ! » Ce coup fait ×1,5 et déclenche l’écho de son
        type, sauf si une réaction du terrain vient d’avoir lieu sur cette case. Les notes s’effacent en fin de manche.
      </p>
      {Object.entries(ECHOS).map(([t, d]) => (
        <div key={t} className="guide-chord">
          <span className="guide-chord-tag">
            <i style={{ background: typeColor(t) }} title={t} />
          </span>
          <span>
            <b>Écho {t}</b>
            <em>
              <Html html={d} />
            </em>
          </span>
        </div>
      ))}
      <p className="d">
        Maîtres d’arène, rival, Conseil 4, Maître de la Ligue, légendaires et colosses se servent aussi des notes et des
        attaques Expertes. Sur les terrains et dans la Tour de Résonance, les adversaires ne les utilisent pas.
      </p>
    </section>
  );
}

export default function Tactics() {
  return (
    <>
      <div className="guide-intro">
        <h2 className="section-title">Rôles, synergies, obstacles</h2>
        <p className="d">
          Chaque rôle a sa mécanique, deux types complémentaires ouvrent une synergie, et le terrain change la portée
          des tirs.
        </p>
      </div>
      <div className="guide-codex" id="codex">
        <Codex />
      </div>
      <Chords />
      <ResonanceInBattle />
    </>
  );
}
