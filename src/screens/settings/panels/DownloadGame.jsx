// Settings › « Télécharger le jeu » (Download the game) (v4.41): the click on #downloadB is handled by the engine (engine/tools/download-game.js).
export default function DownloadGame() {
  return (
    <section className="v4-panel" id="download">
      <h3 className="h3">Télécharger le jeu</h3>
      <p className="v4-note">
        Le fichier HTML complet de la version actuelle, pour le garder ou le modifier avec un autre outil (design,
        textes…). Les musiques restent hébergées avec le lien.
      </p>
      <button type="button" className="b b-sm b-gold" id="download-b">
        Télécharger le fichier HTML
      </button>
    </section>
  );
}
