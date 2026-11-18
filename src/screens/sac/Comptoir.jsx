import { V4 } from '../../engine/032-v4-00-socle.js';
import { merciAffiche } from './sacStore.js';

// Habillage « monde Pokémon » (v4.73) : comptoir avec son vendeur en Boutique, sac à poches
// dans le Sac. La réplique du vendeur s'écrit lettre par lettre (moteur, module 109 : .pk-mart-dlg).

/* dessins originaux */
const Vendeur = () => (
  <svg className="pk-clerk" viewBox="0 0 120 120" aria-hidden="true"><path d="M26 122C26 94 40 82 60 82s34 12 34 40Z" fill="#2f6fd6" /><path d="M45 122V95h30v27Z" fill="#f2f5fb" /><path d="M51 103h18v8H51Z" fill="#d6dff0" /><path d="M52 82l8 10 8-10Z" fill="#f2f5fb" /><circle cx="60" cy="60" r="18" fill="#f3c9a4" /><path d="M42 60c0-10 6-15 18-15s18 5 18 15c-4-5-10-7-18-7s-14 2-18 7Z" fill="#3a2a1e" /><path d="M41 52c0-14 8-20 19-20s19 6 19 20Z" fill="#2f6fd6" /><path d="M39 50h42v5H39Z" fill="#1d4ea8" /><path d="M60 50h25a3.5 3.5 0 0 1 0 7H60Z" fill="#1d4ea8" /><circle cx="60" cy="42" r="5" fill="#fff" /><path d="M55 42h10" stroke="#e3262f" strokeWidth="2" /><circle cx="60" cy="42" r="1.6" fill="#fff" stroke="#151a22" strokeWidth=".8" /><circle cx="53" cy="62" r="2.1" fill="#2a1c12" /><circle cx="67" cy="62" r="2.1" fill="#2a1c12" /><path d="M54 69q6 5 12 0" fill="none" stroke="#8a4a2a" strokeWidth="1.8" strokeLinecap="round" /><circle cx="48" cy="67" r="2.6" fill="#f2a08a" opacity=".55" /><circle cx="72" cy="67" r="2.6" fill="#f2a08a" opacity=".55" /></svg>
);
const SacADos = () => (
  <svg className="pk-bagi" viewBox="0 0 120 120" aria-hidden="true"><path d="M38 34c0-14 10-22 22-22s22 8 22 22" fill="none" stroke="#8a4b1c" strokeWidth="7" strokeLinecap="round" /><rect x="22" y="30" width="76" height="80" rx="20" fill="#f0a73a" /><rect x="22" y="30" width="76" height="80" rx="20" fill="none" stroke="#7a3f12" strokeWidth="3" /><path d="M24 58h72" stroke="#c97a1d" strokeWidth="3" /><rect x="34" y="66" width="52" height="34" rx="10" fill="#e08a22" stroke="#7a3f12" strokeWidth="3" /><path d="M38 75h44" stroke="#ffe08a" strokeWidth="2.5" strokeDasharray="3 3" /><circle cx="60" cy="47" r="8" fill="#fff" stroke="#151a22" strokeWidth="2.5" /><path d="M52 47h16" stroke="#151a22" strokeWidth="2.5" /><circle cx="60" cy="47" r="2.6" fill="#fff" stroke="#151a22" strokeWidth="1.6" /><path d="M30 38q30-10 60 0" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="3" strokeLinecap="round" /></svg>
);

const POCHES = { balls: 'Poké Balls', soins: 'Soins', combat: 'Combat', held: 'Objets tenus', machines: 'CT et CS' };
const REPLIQUES = {
  balls: 'Bienvenue ! Nos Poké Balls viennent d’arriver. Que puis-je pour vous ?',
  soins: 'Potions et remèdes : de quoi soigner toute votre équipe entre deux combats.',
  combat: 'Ces objets changent le cours d’un combat. À utiliser au bon moment !',
  held: 'Un objet tenu accompagne votre Pokémon pendant tout le combat.',
  machines: 'Les CT apprennent de nouvelles capacités à vos Pokémon.',
  rares: 'Psst… le marchand rare ne passe pas souvent. Profitez-en !',
  ambu: 'Le colporteur change de marchandise chaque jour.',
  ate: 'À l’Atelier, on fabrique et on améliore. Ça se paie en Éclats.',
  jeux: 'Tentez votre chance au Tirage !',
  quetes: 'Les récompenses de quêtes se retirent ici.',
  trophees: 'Vos trophées méritent une belle vitrine.',
  oeufs: 'Un Œuf, ça se couve avec patience…',
  talents: 'Les Talents rendent vos Pokémon uniques.'
};

// `n` : nombre d'objets affichés dans la poche (Sac).
export default function Comptoir({ n }) {
  if (V4.sacV !== 'sac') {
    const ligne = merciAffiche() ? 'Merci pour votre achat ! Autre chose ?' : REPLIQUES[V4.sacC] || 'Bienvenue ! Que puis-je pour vous ?';
    return (
      <section className="pk-mart-ban" aria-label="Comptoir de la Boutique">
        <div className="pk-front" aria-hidden="true"><i className="pk-aw" /><span className="pk-sign"><i />BOUTIQUE</span><i className="pk-sh s1" /><i className="pk-sh s2" /><Vendeur /><i className="pk-cnt" /></div>
        <div className="dlgbox pk-mart-dlg"><span className="dlg-who">Vendeur</span><p>{ligne}</p></div>
      </section>
    );
  }
  const poche = POCHES[V4.sacC] || 'Objets';
  return (
    <section className="pk-bag-ban" aria-label="Sac">
      <SacADos />
      <span><b>Poche : {poche}</b><em>{n ? `${n} objet${n > 1 ? 's' : ''} différent${n > 1 ? 's' : ''} dans cette poche` : 'Cette poche est vide pour l’instant.'}</em></span>
    </section>
  );
}
