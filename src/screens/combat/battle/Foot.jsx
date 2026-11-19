import { useRef } from 'react';
import { byUid, canEveil, foeEvo } from '../../../engine/021-14-moteur-combat.js';
import { B, ui } from '../../../engine/024-17-interface-combat.js';
import { acteurCourant } from '../../../engine/044-v4-5-01-moteur-tactique.js';
import { coopVivants418 } from '../../../engine/058-v4-18-01-peche-safari-coop.js';
import { tourAdverse428 } from '../../../engine/063-v4-28-01-captures-combat-accueil.js';
import { phaseEnigme431 } from '../../../engine/066-v4-31-01-defis-tactiques.js';
import { flow478 } from '../../../engine/112-v4-77-graphismes-peints-decors-et-textures-du-do.js';
import { getHost } from '../board/boardStore.js';
import Outils444 from '../board/Outils444.jsx';
import { pied as barreBas, useBattleVersion } from './battleStore.js';

const ETAPE = { deplacer: 'Déplacer', agir: 'Agir', extra: 'Terminer', fini: 'Fini' };

// Bouton de fin de tour, phase et étape : renderTop, puis les versions qui les réécrivaient
// (déploiement v4.30, énigme v4.31, duel v4.33, tour guidé v4.78), dans le même ordre.
function barre() {
  const foes = B.units.filter(u => u.side === 'e'),
    al = B.units.filter(u => u.side === 'a');
  const ready = al.filter(u => !u.ko && !u.acted).length,
    cur = B.ordre === 'vitesse' ? acteurCourant(B) : null;
  let disabled = (ui.busy && !tourAdverse428()) || !!B.over || !!ui.turbo428;
  let bouton = ui.cine ? (
    'Éveil…'
  ) : ui.busy ? (
    tourAdverse428() ? (
      ui.turbo428 ? (
        'Accéléré…'
      ) : (
        <>
          Passer <span className="cnt">»</span>
        </>
      )
    ) : (
      'Tour adverse…'
    )
  ) : cur ? (
    <>
      Terminer <span className="cnt">{cur.n}</span>
    </>
  ) : B.coop ? (
    <>
      {B.coop === 1 && coopVivants418(B, 2) ? 'Passer au J2' : 'Fin du tour'} <span className="cnt">J{B.coop}</span>
    </>
  ) : (
    <>
      Fin du tour
      {ready ? (
        <>
          {' '}
          <span className="cnt">
            {ready} prêt{ready > 1 ? 's' : ''}
          </span>
        </>
      ) : null}
    </>
  );
  const rdy = al.filter(u => !u.ko && canEveil(B, u)).length,
    warn = foes.filter(u => foeEvo(B, u)).length;
  let phase = ui.cine
    ? 'Un Pokémon évolue.'
    : ui.busy
      ? 'Les adversaires exécutent leurs attaques.'
      : warn
        ? `${warn} ennemi${warn > 1 ? 's' : ''} sous 50 % : évolution en fin de manche.`
        : rdy
          ? `${rdy} Pokémon prêt${rdy > 1 ? 's' : ''} à s’éveiller.`
          : ready
            ? 'À vous : déplacez, puis agissez.'
            : 'Tous vos Pokémon ont joué.';
  if (B.coop && !ui.busy && !ui.cine) phase = `Joueur ${B.coop} · ` + phase; // coop (v4.18)
  let joueur = null;
  // déploiement (v4.30)
  if (B.dep430 && !B.over) {
    disabled = false;
    bouton = 'Lancer le combat';
    phase = ui.dsel430 ? 'Touchez une case bleue.' : 'Placez vos Pokémon sur les cases bleues.';
  }
  // énigme (v4.31)
  if (B.sc === 'enigme431' && !B.over && !B.dep430) {
    bouton = 'Abandonner l’énigme';
    phase = phaseEnigme431();
  }
  // duel local (v4.33)
  const D = B.duel433;
  if (D && !B.over && !ui.cine) {
    if (ui.busy) bouton = 'Fin de manche…';
    else {
      const r = B.units.filter(u => u.side === 'a' && !u.ko && !u.acted).length;
      bouton = (
        <>
          {D.j === 1 ? `Passer à ${D.noms[1]}` : 'Fin de la manche'}
          {r ? (
            <>
              {' '}
              <span className="cnt">
                {r} prêt{r > 1 ? 's' : ''}
              </span>
            </>
          ) : null}
        </>
      );
      joueur = <b className={'dj' + D.j}>{D.noms[D.j - 1]}</b>;
      phase = phase.replace('À vous : ', '').replace('Tous vos Pokémon', 'Tous ses Pokémon');
    }
  }
  // tour guidé (v4.78) : plus de « Fin du tour » pendant votre phase
  const g = flow478.guide();
  let etape = null;
  if (g) {
    const n = flow478.restants(B).length,
      t = B.ordre === 'vitesse' ? 'À vous : déplacez, puis agissez.' : n ? `Encore ${n} Pokémon à jouer.` : 'Manche terminée.';
    phase = phase.replace(/(À vous : )?déplacez, puis agissez\./, t).replace(/Tous (vos|ses) Pokémon ont joué\./, t);
    const u = ui.sel && byUid(B, ui.sel);
    if (u && u.side === 'a' && !ui.selE)
      etape = (
        <>
          <b>{ETAPE[flow478.etape(B, u)]}</b> {u.n}
          {B.ordre !== 'vitesse' && n ? ` · encore ${n}` : ''}
        </>
      );
  }
  return { disabled, bouton, phase, joueur, g, etape };
}

export default function Foot() {
  const v = useBattleVersion('foot');
  const pied = useRef(null);
  const x = v && B ? barre() : null;
  // l'étape masquée garde son dernier texte, comme l'ancien DOM
  if (x && x.etape) pied.current = x.etape;
  const Q = barreBas.qa,
    outils = getHost().bt444;
  return (
    <div className={barreBas.cls.join(' ')}>
      {/* attaques à portée de pouce (téléphone, v4.43) : créées au premier usage, puis masquées */}
      {Q && (
        <div id="qa443" className="qa443" role="toolbar" aria-label="Actions du Pokémon choisi" hidden={Q.hidden}>
          {Q.items.map((b, i) => (
            <button key={i} type="button" data-qa443={i} className={b.c + (b.on ? ' on' : '')} style={b.col ? { '--c': b.col } : undefined} disabled={b.disabled}>
              {b.col ? <i /> : null}
              {b.t}
            </button>
          ))}
        </div>
      )}
      <span className="phase" id="bPhase">
        {x && x.joueur ? (
          <>
            {x.joueur} · {x.phase}
          </>
        ) : (
          x && x.phase
        )}
      </span>
      {Q && Q.nom ? <span className="qa443-n">{Q.nom}</span> : null}
      <button className="b b-gold" id="bEnd" type="button" disabled={x ? x.disabled : undefined} style={x ? { display: x.g ? 'none' : '' } : undefined}>
        {x ? x.bouton : 'Fin du tour'}
      </button>
      {v > 0 && (
        <span id="fl478pied" className="fl478-pied" aria-live="polite" hidden={!(x && x.etape)}>
          {pied.current}
        </span>
      )}
      {v > 0 && (
        <span className="kbd" aria-hidden="true">
          <i>1</i>
          <i>2</i> capacités · <i>Entrée</i> confirmer · <i>Échap</i> annuler · <i>←</i>
          <i>→</i> Pokémon · <i>Espace</i> étape suivante
        </span>
      )}
      {/* barre d'outils du plateau, sous le pouce sur téléphone (v4.44) */}
      {outils && outils.foot && <Outils444 b={outils} />}
    </div>
  );
}
