import { PREF } from '../../../engine/026-campaign-tutorial-sound.js';
import { Slider, Switch } from '../controls.jsx';

// Son : musique et effets, chacun avec son volume.
export default function Sound() {
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph"><svg><use href="#i-sound" /></svg><b>Son</b></header>
      <Switch k="music" on={PREF.music} lab="Musique" sub="Un thème par écran : accueil, camp, combat, boutique, victoire" />
      <Slider k="musVol" v={PREF.musVol} lab="Volume de la musique" />
      <Switch k="sound" on={PREF.sound} lab="Effets sonores" sub="Coups, réactions, évolutions, captures" />
      <Slider k="sfxVol" v={PREF.sfxVol} lab="Volume des effets" />
    </section>
  );
}
