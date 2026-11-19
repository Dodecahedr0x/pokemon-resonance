// Paramètres › « Télécharger le jeu » (v4.41) : le clic sur #dl441b est géré par le moteur (module 074).
export default function TelechargerJeu() {
  return (
    <section className="v4-panel" id="dl441">
      <h3 className="h3">Télécharger le jeu</h3>
      <p className="v4-note">Le fichier HTML complet de la version actuelle, pour le garder ou le modifier avec un autre outil (design, textes…). Les musiques restent hébergées avec le lien.</p>
      <button type="button" className="b b-sm b-gold" id="dl441b">Télécharger le fichier HTML</button>
    </section>
  );
}
