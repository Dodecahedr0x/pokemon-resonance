import { useEngineReady } from '../../engineReady.js';
import { useHomeVersion } from './homeStore.js';
import SummaryBox from '../combat/prep/Summary.jsx';
import Hero from './Hero.jsx';
import Banners from './Banners.jsx';
import WhatsNew from './WhatsNew.jsx';
import Footer from './Footer.jsx';
import Friends from './Friends.jsx';

// Home page (#accueil, home.css): hero (next step), activity banners, battle in progress,
// what's new, the daily news (Footer) and the Friend Challenges.
// The team, the companion and the main quest have their own pages (Team, Quests), and the
// navigation bar already links every page, so Home does not repeat them.
// The content is reread from the engine on every renderHome() (store); before the first render
// and while the engine is not ready, only the containers exist.
// Route 29 (#route) is not here: it lives in the Map page (Route.jsx).
export default function Home() {
  const ready = useEngineReady(),
    v = useHomeVersion(),
    on = ready || v > 0;
  return (
    <section className="page on home-screen" id="accueil" aria-labelledby="h-acc">
      <h1 className="vh" id="h-acc">
        Aventure
      </h1>
      <div className="home-layout">
        <div className="home-hero-slot">
          <Hero on={on} />
          {on && <Banners />}
        </div>
        <div className="home-resume-slot">
          <SummaryBox id="resumeHome" />
        </div>
        {on && <WhatsNew />}
        <Footer on={on} />
      </div>
      <Friends on={on} />
    </section>
  );
}
