import Button from '../../../components/Button.jsx';
// Settings › « Télécharger le jeu » (Download the game) (v4.41): the click on #downloadB is handled by the engine (engine/tools/download-game.js).
export default function DownloadGame() {
  return (
    <section className="card" id="download">
      <h3 className="card-title">Télécharger le jeu</h3>
      <p className="note">
        Le fichier HTML complet de la version actuelle, pour le garder ou le modifier avec un autre outil (design,
        textes…). Les musiques restent hébergées avec le lien.
      </p>
      <Button size="small" variant="primary" id="download-b">
        Télécharger le fichier HTML
      </Button>
    </section>
  );
}
