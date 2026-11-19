import { useEffect, useRef } from 'react';
import { MV } from '../../engine/005-moves.js';
import { BY, SYS3 } from '../../engine/009-pokemon.js';
import { ARR } from '../../engine/010-in-battle-evolution.js';
import { RM, medal } from '../../engine/014-utils.js';
import { Html } from '../../lib/html.jsx';
import { setRuleOpen, useGuide } from './guideStore.js';

// Losanges d'énergie d'Éveil.
function Diamonds({ n }) {
  return (
    <span className="enp lg">
      {[0, 1, 2].map(i => <i key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

function Stadium({ mon, lost = [] }) {
  return (
    <div className="al">
      <Html html={medal(mon.t)} />
      <b>{mon.n}</b>
      <div className="amv">
        {mon.mv.map(id => <span key={id} className={lost.includes(id) ? 'am lost' : 'am'}>{MV[id].n}</span>)}
      </div>
    </div>
  );
}

// Anatomie d'un Éveil : cinq cartes, de Chenipan à Papilusion.
export function Anatomy() {
  const C = BY.chenipan, Y = BY.chrysacier, Pp = BY.papilusion, T = BY.tetarte;
  return (
    <>
      <article className="an orn"><span className="an-k">01</span><h3 className="h3">Remplir</h3><Diamonds n={2} /><p>Trois losanges par Pokémon. Chacun se gagne en jouant.</p><ul className="an-src"><li><b>+1</b>fin de manche</li><li><b>+1</b>réaction préparée ou déclenchée</li><li><b>+1</b>coup encaissé de 30 % des PV</li><li><b>+1</b>pour tous quand un allié tombe</li></ul></article>
      <article className="an orn"><span className="an-k">02</span><h3 className="h3">Choisir</h3><div className="an-br"><Html html={medal(T.t)} /><span className="an-fork"><i /><i /></span><span className="an-opts"><span><Html html={medal(BY.tartard.t, 'sm')} />Tartard</span><span><Html html={medal(BY.tarpaud.t, 'sm')} />Tarpaud</span></span></div><p>Têtarte devient Tarpaud sur l’eau ou sous la pluie, Tartard au contact d’un adversaire. Ramoloss et Debugant ont aussi plusieurs voies. Évoli lit la marque sous ses pieds et l’heure.</p></article>
      <article className="an orn"><span className="an-k">03</span><h3 className="h3">Arrivée</h3><div className="an-arr"><Html html={medal(Pp.t, 'lg')} /><span className="ring" /><span className="ring r2" /></div><p><b>Papilusion :</b> <Html html={ARR.papilusion[1]} /> <b>Léviator :</b> <Html html={ARR.leviator[1]} /></p></article>
      <article className="an orn wide"><span className="an-k">04</span><h3 className="h3">Renoncer</h3>
        <div className="an-line"><Stadium mon={C} lost={['charge']} /><span className="an-ar">→</span><Stadium mon={Y} lost={['armure', 'secretion']} /><span className="an-ar">→</span><Stadium mon={Pp} /></div>
        <p>Chaque stade remplace les capacités. Papilusion frappe à distance et soigne, mais <b>Sécrétion est perdue pour toujours</b> : plus personne ne ralentit l’ennemi.</p></article>
      <article className="an orn danger"><span className="an-k">05</span><h3 className="h3">L’ennemi aussi</h3><div className="an-foe"><span className="hp hseg"><i className="mid" style={{ width: '48%' }} /></span><em>48 %</em></div><p>Un ennemi qui finit la manche sous 50 % de PV évolue. Achevez-le d’un coup, ou gardez-le au-dessus de la moitié.</p></article>
    </>
  );
}

// Les huit systèmes de règles. Un code (« S-03 ») ailleurs dans le jeu déplie la règle et y fait défiler.
export function Rules() {
  const { openRules, focusRule } = useGuide();
  const refs = useRef({});
  useEffect(() => {
    if (!focusRule) return;
    refs.current[focusRule.code]?.scrollIntoView?.({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }, [focusRule]);
  return SYS3.map(s => (
    <details
      key={s.c}
      className="rule"
      id={'r-' + s.c}
      ref={el => { refs.current[s.c] = el; }}
      open={openRules.has(s.c)}
      onToggle={e => setRuleOpen(s.c, e.currentTarget.open)}
    >
      <summary><span className="cd">{s.c}</span><span><span className="nm">{s.n}</span><span className="o1"><Html html={s.one} /></span></span><svg className="chev"><use href="#i-chev" /></svg></summary>
      <div className="rule-b">
        <ul className="ticks">{s.pts.map(([t, n], i) => <li key={i} className={n ? 'nw' : undefined}><Html html={t} /></li>)}</ul>
        <div className="feeds"><span className="lbl">Alimente</span>{s.f.map(c => <button key={c} className="chip code-link" type="button" data-code={c}>{c}</button>)}</div>
      </div>
    </details>
  ));
}

// Onglet « Combat » : un tour en quatre temps, anatomie d’un Éveil, règles.
export default function Bases() {
  return (
    <>
      <div className="gd-intro"><h2 className="h2">Un tour en quatre temps</h2></div>
      <div className="howto">
        <div><span className="hn">1</span><b>Lire</b><p>Touchez un adversaire : la zone rouge montre sa portée.</p></div>
        <div><span className="hn">2</span><b>Bouger</b><p>Touchez un Pokémon, puis une case bleue.</p></div>
        <div><span className="hn">3</span><b>Agir</b><p>Capacité, case dorée, aperçu exact, confirmer.</p></div>
        <div><span className="hn">4</span><b>Éveiller</b><p>Trois losanges pleins : choisissez l’évolution. Il n’y a pas de retour.</p></div>
      </div>
      <div className="sec">
        <div className="sec-h"><div><p className="kick">Le cœur du jeu</p><h2 className="h2">Anatomie d’un Éveil</h2><p className="d">Chenipan sait entraver. Papilusion frappe fort. Aucun des deux ne fait les deux. Tout le combat tient dans ce choix.</p></div></div>
        <div className="anat" id="anat"><Anatomy /></div>
      </div>
      <div className="sec" id="regles">
        <div className="sec-h"><div><p className="kick">Règles</p><h2 className="h2">Huit systèmes imbriqués</h2><p className="d">Ouvrez une règle, touchez un code pour suivre le fil. Les points dorés sont nouveaux.</p></div></div>
        <div className="rules" id="rules"><Rules /></div>
      </div>
    </>
  );
}
