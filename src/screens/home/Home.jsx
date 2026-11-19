import { useEngineReady } from '../../engineReady.js';
import { useHomeVersion } from './homeStore.js';
import SummaryBox from '../combat/prep/Summary.jsx';
import Hero from './Hero.jsx';
import Companion from './Companion.jsx';
import Banners from './Banners.jsx';
import Side from './Side.jsx';
import WhatsNew from './WhatsNew.jsx';
import Tiles from './Tiles.jsx';
import Footer from './Footer.jsx';
import TrainerCard from './TrainerCard.jsx';
import Friends from './Friends.jsx';

// Home page (#accueil), in the final layout of the old DOM: the v4 grid
// (.v4-home, formerly built at startup around the hero), then the old header and the
// shortcuts, hidden (.v4-off), the Friend Challenges and the old hidden "stage" sheet.
// The content is reread from the engine on every renderHome() (store); before the first render
// and while the engine is not ready, only the containers exist.
// Route 29 (#route) is not here: it lives in the Map page (Route.jsx).
export default function Home() {
  const ready = useEngineReady(),
    v = useHomeVersion(),
    on = ready || v > 0;
  return (
    <section className="page on" id="accueil" aria-labelledby="h-acc">
      <h1 className="vh" id="h-acc">Aventure</h1>
      <div className="v4-home">
        <div className="v4-hero-slot">
          <Hero on={on} />
          {on && <Companion />}
          {on && <Banners />}
        </div>
        <Side on={on} />
        <div className="v4-resume-slot">
          <SummaryBox id="resumeHome" />
        </div>
        {on && <WhatsNew />}
        <Tiles on={on} />
        <Footer on={on} />
      </div>
      <div className="hm-top v4-off">
        <div className="tcard" id="campBox">{on && <TrainerCard />}</div>
      </div>
      <div className="hm-quick v4-off">
        <button type="button" className="qk qk-grass" data-hm="wild"><span className="qk-ic"><svg><use href="#i-grass" /></svg></span><span><b>Hautes herbes</b><em>Rencontrer et capturer des Pokémon</em></span></button>
        <button type="button" className="qk qk-team" data-go="pokedex"><span className="qk-ic"><svg><use href="#i-team" /></svg></span><span><b>Mon équipe</b><em id="qkTeam">4 Pokémon, 12 PC</em></span></button>
        <button type="button" className="qk qk-guide" data-guide="debuter"><span className="qk-ic"><svg><use href="#i-book" /></svg></span><span><b>Comment jouer</b><em>5 étapes, 2 minutes</em></span></button>
      </div>
      <Friends on={on} />
      <div className="legacy" hidden aria-hidden="true">
        <div className="stage" id="stage">
          <div className="st-vis"><div className="st-no" id="stNo" /><svg className="crest" id="crest" viewBox="0 0 320 320" aria-hidden="true" /></div>
          <div className="st-meta"><div><div className="st-name" id="stName" /><div className="st-epi" id="stEpi" /><div className="st-types" id="stTypes" /></div>
            <div className="st-right"><span className="lb">Recrutement</span><b id="stCost" /><span className="lb" id="stRole" /></div></div>
          <div className="st-evo" id="stEvo" aria-label="Lignée d’évolution" />
          <p className="st-line" id="stLine" />
          <div className="st-dots" id="stDots" aria-label="Pokémon en vedette" />
        </div>
      </div>
    </section>
  );
}
