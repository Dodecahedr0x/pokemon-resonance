import Button from '../../components/Button.jsx';
// « Débuter » (Getting started) tab: five steps and a glossary (fixed content).
export default function GettingStarted() {
  return (
    <>
      <div className="guide-intro">
        <h2 className="section-title">Débuter en 5 étapes</h2>
        <p className="description">
          Tout ce qu’il faut savoir pour gagner votre premier combat. Le reste se découvre en jouant.
        </p>
      </div>
      <ol className="guide-steps">
        <li style={{ '--c': '#E3350D' }}>
          <span className="guide-step-number" data-n={1}>
            1
          </span>
          <div>
            <b>Formez votre équipe</b>
            <p>
              Onglet <b>Équipe</b> : touchez « Recruter » sous 4 Pokémon. Vous disposez de <b>12 PC</b>. Un premier
              stade coûte peu et peut évoluer pendant le combat.
            </p>
          </div>
        </li>
        <li style={{ '--c': '#2A75BB' }}>
          <span className="guide-step-number" data-n={2}>
            2
          </span>
          <div>
            <b>Choisissez un combat</b>
            <p>
              Onglet <b>Combats</b> : choisissez Entraînement, Arènes ou Ligue, touchez un combat dans la liste, puis «
              Lancer le combat ».
            </p>
          </div>
        </li>
        <li style={{ '--c': '#E5484D' }}>
          <span className="guide-step-number" data-n={3}>
            3
          </span>
          <div>
            <b>Lisez les portées</b>
            <p>
              Touchez un adversaire : sa <b>zone rouge</b> montre tout ce qu’il peut frapper. Il choisit sa cible à son
              tour : sortez de sa portée, ou placez devant un Pokémon résistant.
            </p>
          </div>
        </li>
        <li style={{ '--c': '#3FA34D' }}>
          <span className="guide-step-number" data-n={4}>
            4
          </span>
          <div>
            <b>Bougez, puis attaquez</b>
            <p>
              Touchez votre Pokémon, une <b>case bleue</b> pour bouger, puis une capacité et une <b>case dorée</b>.
              L’aperçu affiche le résultat exact avant de confirmer.
            </p>
          </div>
        </li>
        <li style={{ '--c': '#F2B807' }}>
          <span className="guide-step-number" data-n={5}>
            5
          </span>
          <div>
            <b>Éveillez au bon moment</b>
            <p>
              Quand les <b>3 losanges</b> sont pleins, « Éveil » fait évoluer le Pokémon en plein combat. C’est
              définitif : gardez-le pour le moment décisif.
            </p>
          </div>
        </li>
      </ol>
      <div className="guide-start-actions">
        <Button size="large" variant="primary" data-hm="tuto">
          Jouer le combat guidé
          <svg>
            <use href="#i-arrow" />
          </svg>
        </Button>
        <Button data-gt="tuto433">Tutoriel complet</Button>
        <Button data-hm="intro">Revoir l’accueil de la Professeure</Button>
      </div>
      <div className="guide-glossary">
        <h3 className="card-title">Petit lexique</h3>
        <dl>
          <div>
            <dt>PC</dt>
            <dd>Points de commandement : 12 pour composer l’équipe.</dd>
          </div>
          <div>
            <dt>Manche</dt>
            <dd>Vous jouez tous vos Pokémon, puis les adversaires frappent.</dd>
          </div>
          <div>
            <dt>Voix</dt>
            <dd>Jetons par manche pour Esquiver, Relancer ou Éveiller.</dd>
          </div>
          <div>
            <dt>Éveil</dt>
            <dd>Évolution en combat, quand l’énergie est pleine.</dd>
          </div>
          <div>
            <dt>Marque</dt>
            <dd>Trace d’un type laissée sur une case. Un autre type la fait réagir.</dd>
          </div>
          <div>
            <dt>Badge</dt>
            <dd>Récompense d’arène. Huit badges ouvrent la Ligue.</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
