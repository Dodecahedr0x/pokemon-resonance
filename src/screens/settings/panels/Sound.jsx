import { PREFERENCES } from '../../../engine/ui/preferences.js';
import { Slider, Switch } from '../controls.jsx';

import CardHeader from '../../../components/CardHeader.jsx';
// Sound: music and effects, each with its own volume.
export default function Sound() {
  return (
    <section className="card v4-ps">
      <CardHeader icon="sound" title="Son" />
      <Switch
        k="music"
        on={PREFERENCES.music}
        lab="Musique"
        sub="Un thème par écran : accueil, camp, combat, boutique, victoire"
      />
      <Slider k="musVol" v={PREFERENCES.musVol} lab="Volume de la musique" />
      <Switch k="sound" on={PREFERENCES.sound} lab="Effets sonores" sub="Coups, réactions, évolutions, captures" />
      <Slider k="sfxVol" v={PREFERENCES.sfxVol} lab="Volume des effets" />
    </section>
  );
}
