/* Section d'origine : v4.73 : monde Pokémon (dialogues, silhouettes, cartes, boîte à badges, Boutique, Sac, sons) */

import { PROFILE } from './011-05-etat-de-partie.js';
import { RM } from './014-08-outils.js';
import { __set_show, cur, show } from './016-09-navigation.js';
import { PREF, noise, savePref, tone } from './026-20-campagne-tutoriel-son.js';
import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { __set_buy, buy, renderBag } from './039-v4-07-quetes-boutique.js';
import { marquerAchat } from '../screens/sac/sacStore.js';
import { renderParams } from './040-v4-08-parametres.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { refreshGrid } from '../screens/equipe/equipeStore.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const P = 'html:not(#pkz) body:not(#pkz)';
  const H = document.documentElement;
  const on = k => PREF[k] !== 0;
  const calme = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || PREF.pk472a === 0;
    } catch (e) {
      return false;
    }
  };
  const texteDirect = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || !on('pk473t') || (typeof AUTO !== 'undefined' && !!AUTO);
    } catch (e) {
      return true;
    }
  };

  /* ---------- 10. sons d'interface maison (synthétisés) ---------- */
  const SONS = {
    bip: () => {
      tone(1760, 0, 0.035, 'square', 0.016);
      tone(2349, 0.045, 0.04, 'square', 0.016);
    },
    ball: () => {
      noise(0, 0.03, 0.045, 5200);
      tone(540, 0, 0.04, 'square', 0.02, 270);
      tone(880, 0.06, 0.07, 'triangle', 0.03, 1320);
    },
    caisse: () => {
      tone(1318, 0, 0.07, 'triangle', 0.04);
      tone(1760, 0.08, 0.18, 'triangle', 0.04);
    },
    suite: () => tone(1175, 0, 0.05, 'square', 0.015)
  };
  const son = k => {
    try {
      if (!PREF.sound || RM || !on('pk473s')) return;
      SONS[k] && SONS[k]();
    } catch (e) {}
  };
  const ONGLETS = '.v4-tabs>button,.v4-reg>button,.gd-tabs>button,.v4-cats>button,.v4-seg>button,.scn-tabs>button,.stabs>.stab,.sel-tabs>button';
  document.addEventListener(
    'click',
    e => {
      const t = e.target;
      if (!t || !t.closest) return;
      const nav = t.closest('.bnav [data-t],#v4Menu [data-t]');
      if (nav) {
        let k = nav.dataset.t;
        if (k === 'ligue') k = 'combat';
        if (k && k !== cur) son('ball');
        return;
      }
      const o = t.closest(ONGLETS);
      if (o && o.getAttribute('aria-selected') !== 'true' && o.getAttribute('aria-pressed') !== 'true') return son('bip');
      if (t.closest('[data-scene="suite"],[data-co]')) son('suite');
    },
    true
  );

  /* comptoir de la Boutique et sac à poches : rendus par React (src/screens/sac/Comptoir.jsx) */

  const css = document.createElement('style');
  css.id = 'resonance-v473-monde';
  css.textContent = `
/* ---------- 4. boîtes de dialogue classiques ---------- */
${P} .pk-dlg{position:relative!important;background:linear-gradient(180deg,#ffffff,#edf1f7)!important;color:#273142!important;border:0!important;border-radius:12px!important;box-shadow:0 0 0 2.5px #f8fafc,0 0 0 5.5px #3a72c4,0 0 0 7px #0d1f3c,0 16px 30px -14px rgba(0,0,0,.85)!important;text-shadow:none!important;backdrop-filter:none!important}
${P} .pk-dlg :is(p,em,q,small,span:not(.pav):not(.dlg-who):not(.tb):not(.pk-c):not(.pk-tw)):not(.pav *):not(.tb *):not(button *):not(.it-cards *){color:#273142!important;text-shadow:none!important}
${P} .pk-dlg :is(b,strong):not(.pav *):not(button *):not(.it-cards *){color:#cf2f2b!important;text-shadow:none!important}
${P} .pk-dlg .dlg-who{position:absolute!important;left:12px;top:-12px;z-index:2;display:inline-block!important;margin:0!important;padding:3px 9px 2px!important;border-radius:6px!important;background:linear-gradient(180deg,#5a93e6,#2c5fae)!important;color:#fff!important;font:800 9.5px/1.25 var(--f-d)!important;letter-spacing:.1em!important;text-transform:uppercase;box-shadow:0 0 0 2px #0d1f3c!important;opacity:1!important}
${P} .pk-dlg .dlg-who::before,${P} .pk-dlg .dlg-who::after{display:none!important}
${P} .pk-dlg .pk-fl{display:inline-block;position:relative;width:0;height:0;margin-left:7px;vertical-align:middle;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #e3262f;filter:drop-shadow(0 1px 0 #7a0d12);animation:pkFleche .9s ease-in-out infinite;pointer-events:none}
${P} .pk-dlg .pk-fl.abs{position:absolute;right:12px;bottom:10px;margin:0}
${P} .pk-dlg.pk-typing .pk-fl{visibility:hidden}
${P} .pk-typing .pk-c{visibility:hidden}
${P} .pk-typing .pk-c.v{visibility:visible}
@keyframes pkFleche{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}

/* Prof. Sorbier sur l'Accueil */
${P} .v4h-prof{align-items:center!important;background:transparent!important;border:0!important;padding:10px 4px 4px!important}
${P} .v4h-prof>p.pk-dlg{flex:1;margin:8px 0 0!important;padding:14px 16px 13px!important;font-size:13.5px!important;line-height:1.5!important}
/* conseils du Professeur */
${P} .tip .dlgbox.pk-dlg{padding:15px 30px 13px 14px!important;margin-top:8px}
/* scènes d'histoire */
${P} #scene417 .sc-card.pk-dlg{padding:16px 16px 14px!important;animation:pkDlgIn .32s cubic-bezier(.2,1,.4,1) both!important}
${P} #scene417 .sc-card.pk-dlg .sc-who>b{color:#1d4ea8!important;font-family:var(--f-d)!important;letter-spacing:.04em}
${P} #scene417 .sc-card.pk-dlg .sc-tx{font-size:16.5px!important;line-height:1.55!important;font-weight:500;color:#1f2836!important}
${P} #scene417 .sc-card.pk-dlg .sc-n{color:#6a7688!important}
${P} .pk-dlg .b-ghost{color:#2c5fae!important;background:transparent!important;border:1.5px solid rgba(44,95,174,.45)!important;box-shadow:none!important}
/* coach du tutoriel */
${P} #coach .co-in.pk-dlg{padding:12px 14px!important}
${P} #coach .co-in.pk-dlg>b{color:#1d4ea8!important}
${P} #coach .co-in.pk-dlg .co-n{color:#6a7688!important}
${P} #coach .co-in.pk-dlg p{color:#273142!important}
/* astuces en combat */
${P} #tip429.pk-dlg{padding:12px 14px!important}
${P} #tip429.pk-dlg small{color:#2c5fae!important;font-weight:800;letter-spacing:.06em}
${P} #tip429.pk-dlg>div>b{color:#1d4ea8!important}
/* réplique du champion avant le combat */
${P} .sel-card .dlgbox.pk-dlg{padding:12px 30px 13px 14px!important;margin:6px 2px}
/* introduction */
${P} .intro .dlgbox.pk-dlg{padding:20px 22px 22px!important;margin-top:10px}
@keyframes pkDlgIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}

/* ---------- 5. silhouettes des Pokémon pas encore capturés ---------- */
${P} .v4-dl.unk img{filter:brightness(0) drop-shadow(0 0 1.5px rgba(150,205,255,.85))!important;opacity:1!important}
${P} .v4-dl.unk::before{content:"?";position:absolute;left:34px;top:5px;z-index:2;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#e3262f;color:#fff;font:900 11px/1 var(--f-d);box-shadow:0 0 0 1.5px #151a22;pointer-events:none}
${P} #dex4Card:not(.own448) .v4d-art img{filter:brightness(0) drop-shadow(0 0 2px rgba(150,205,255,.85)) drop-shadow(0 0 16px rgba(111,220,255,.3))!important}
${P} #dex4Card:not(.own448) .v4d-art::after{content:"?"!important;position:absolute!important;display:grid!important;place-items:center;inset:auto 12px 12px auto!important;width:38px!important;height:38px!important;border-radius:50%!important;background:#e3262f!important;color:#fff!important;font:900 24px/1 var(--f-d)!important;box-shadow:0 0 0 2.5px #151a22,0 6px 14px rgba(0,0,0,.5)!important;opacity:1!important;animation:none!important;z-index:4}
${P} .fcard.locked .pokemon-art-sprite{filter:brightness(0) drop-shadow(0 0 2px rgba(150,205,255,.8))!important}

/* ---------- 6. cartes à collectionner ---------- */
${P} #pokedex .fcard{--pk-cadre:linear-gradient(145deg,#f6d2ae,#a8642e 28%,#ffe2c2 52%,#7a4320 78%,#e0a874)}
${P} #pokedex .fcard:has(.fc-rg.rg-moyen){--pk-cadre:linear-gradient(145deg,#ffffff,#97a3b2 28%,#f2f6fa 52%,#66727f 78%,#dfe6ee)}
${P} #pokedex .fcard:has(.fc-rg.rg-fort){--pk-cadre:linear-gradient(145deg,#fff4b8,#c8901c 28%,#fff0a5 52%,#8e6c31 78%,#f0d59c)}
${P} #pokedex .fcard:has(.fc-rg.rg-expert),${P} #pokedex .fcard.pk-shiny{--pk-cadre:linear-gradient(145deg,#ffd35a,#ff7ac8 24%,#7fd9ff 48%,#9cff9c 72%,#ffd35a)}
${P} #pokedex .fcard .fc-in{border:3px solid transparent!important;background:radial-gradient(110% 62% at 50% 26%,color-mix(in srgb,var(--c) 40%,transparent),transparent 66%) padding-box,linear-gradient(165deg,color-mix(in srgb,var(--c) 30%,#0c1a2b) 0%,#0a1524 52%,color-mix(in srgb,var(--c2) 24%,#08111d) 100%) padding-box,var(--pk-cadre) border-box!important}
${P} #pokedex .fcard .fc-art{background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--c) 30%,transparent),transparent 64%),repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.035) 0 6deg,transparent 6deg 14deg)!important;border-radius:12px}
${P} #pokedex .fcard:is(.pk-shiny,:has(.fc-rg.rg-expert)) .fc-foil{opacity:.5!important;background:linear-gradient(115deg,transparent 15%,rgba(255,120,200,.45) 30%,rgba(120,220,255,.45) 45%,rgba(150,255,150,.4) 60%,rgba(255,220,100,.45) 75%,transparent 90%) 0 0/250% 250%!important;mix-blend-mode:color-dodge;animation:pkHoloFoil 7s linear infinite!important}
${P} #pokedex .fcard .pk-shn{position:absolute;right:8px;top:30px;z-index:6;padding:2px 7px;border-radius:999px;background:linear-gradient(90deg,#ffd35a,#ff9ad5,#8fe3ff);color:#2a1630;font:800 9px/1.4 var(--f-d);letter-spacing:.06em;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 12px rgba(255,180,230,.6);pointer-events:none}
@keyframes pkHoloFoil{to{background-position:250% 250%}}

/* ---------- 7. boîte à badges en velours ---------- */
${P} :is(.tc-bdg,.v4-tr-b){position:relative;padding:12px!important;border-radius:14px!important;border:0!important;background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.07),transparent 60%),repeating-linear-gradient(45deg,rgba(255,255,255,.02) 0 2px,transparent 2px 4px),linear-gradient(180deg,#43111f,#22070f)!important;box-shadow:inset 0 3px 10px rgba(0,0,0,.8),0 0 0 2px #120408,0 0 0 4px rgba(200,160,80,.55),0 10px 24px -12px rgba(0,0,0,.85)!important;outline:1.5px dashed rgba(255,215,140,.38);outline-offset:-7px;gap:8px!important}
${P} :is(.tcb,.v4-tbg){position:relative;border:0!important;border-radius:50%!important;background:radial-gradient(circle at 50% 42%,#14060b,#2b0c16 72%)!important;box-shadow:inset 0 3px 6px rgba(0,0,0,.9),0 1px 0 rgba(255,220,180,.12)!important;filter:none!important;overflow:visible}
${P} :is(.tcb,.v4-tbg):not(.on) svg{opacity:.18;filter:grayscale(1) brightness(.6)}
${P} :is(.tcb,.v4-tbg).on svg{filter:drop-shadow(0 2px 1.5px rgba(0,0,0,.8)) drop-shadow(0 0 5px rgba(255,220,140,.4))!important}
${P} :is(.tcb,.v4-tbg).on::after{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.85) 50%,transparent 62%) 170% 0/280% 100% no-repeat;mix-blend-mode:overlay;animation:pkLueur 1.1s ease-out both}
${P} :is(.tcb,.v4-tbg).on:nth-child(2)::after{animation-delay:.12s}${P} :is(.tcb,.v4-tbg).on:nth-child(3)::after{animation-delay:.24s}${P} :is(.tcb,.v4-tbg).on:nth-child(4)::after{animation-delay:.36s}${P} :is(.tcb,.v4-tbg).on:nth-child(5)::after{animation-delay:.48s}${P} :is(.tcb,.v4-tbg).on:nth-child(6)::after{animation-delay:.6s}${P} :is(.tcb,.v4-tbg).on:nth-child(7)::after{animation-delay:.72s}${P} :is(.tcb,.v4-tbg).on:nth-child(n+8)::after{animation-delay:.84s}
@keyframes pkLueur{from{background-position:170% 0}to{background-position:-70% 0}}

/* ---------- 9. Boutique : comptoir, vendeur, étagères ---------- */
${P} .pk-mart-ban{position:relative;margin:2px 0 18px;display:grid;gap:14px}
${P} .pk-front{position:relative;height:172px;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#e9f1fb 0 38%,#d3e1f2 38% 100%);box-shadow:0 0 0 2px #0d1f3c,0 0 0 4px rgba(120,180,255,.35),0 18px 34px -16px rgba(0,0,0,.85)}
${P} .pk-front .pk-aw{position:absolute;left:0;right:0;top:0;height:30px;z-index:3;background:repeating-linear-gradient(90deg,#2f6fd6 0 24px,#f4f7fc 24px 48px);-webkit-mask:radial-gradient(12px 10px at 12px 20px,#000 98%,transparent) 0 0/24px 30px repeat-x,linear-gradient(#000 0 0) 0 0/100% 20px no-repeat;mask:radial-gradient(12px 10px at 12px 20px,#000 98%,transparent) 0 0/24px 30px repeat-x,linear-gradient(#000 0 0) 0 0/100% 20px no-repeat;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}
${P} .pk-front .pk-sign{position:absolute;right:12px;top:38px;z-index:3;display:flex;align-items:center;gap:7px;padding:5px 11px 5px 7px;border-radius:9px;background:linear-gradient(180deg,#3b7fe0,#1d4ea8);color:#fff;font:900 12px/1 var(--f-d);letter-spacing:.14em;box-shadow:0 0 0 2px #0d1f3c,0 4px 10px rgba(0,0,0,.35)}
${P} .pk-front .pk-sign i{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#fff 0 2.4px,#151a22 2.6px 3.8px,transparent 4px),linear-gradient(180deg,#ff6a70 0 46%,#151a22 46% 54%,#fff 54%);box-shadow:0 0 0 1.5px #151a22}
${P} .pk-front .pk-sh{position:absolute;left:14px;right:14px;height:7px;z-index:1;background:linear-gradient(180deg,#b8834f,#7c5226);border-radius:2px;box-shadow:0 3px 4px rgba(0,0,0,.25)}
${P} .pk-front .pk-sh.s1{top:72px}${P} .pk-front .pk-sh.s2{top:112px}
${P} .pk-front .pk-sh::before{content:"";position:absolute;left:4px;right:4px;bottom:7px;height:18px;background:radial-gradient(circle at 50% 60%,#e3262f 0 5px,transparent 5.5px) 0 0/30px 18px repeat-x,radial-gradient(circle at 50% 60%,#5fb3ff 0 4.5px,transparent 5px) 15px 0/30px 18px repeat-x;-webkit-mask:linear-gradient(90deg,#000 0 30%,transparent 30% 70%,#000 70%);mask:linear-gradient(90deg,#000 0 30%,transparent 30% 70%,#000 70%)}
${P} .pk-front .pk-sh.s2::before{background:linear-gradient(180deg,transparent 4px,#9b59d0 4px 16px,transparent 16px) 3px 0/26px 18px repeat-x,linear-gradient(180deg,transparent 7px,#4fc46b 7px 16px,transparent 16px) 16px 0/26px 18px repeat-x}
${P} .pk-front .pk-clerk{position:absolute;left:36%;bottom:40px;z-index:2;width:112px;height:112px;margin-left:-56px;transform-origin:50% 100%;animation:pkSalut 3.6s ease-in-out infinite}
${P} .pk-front .pk-cnt{position:absolute;left:0;right:0;bottom:0;height:46px;z-index:3;background:linear-gradient(180deg,#f7fbff 0 7px,#2f6fd6 7px 11px,#c9d8ee 11px 100%);box-shadow:0 -2px 6px rgba(0,0,0,.18)}
${P} .pk-front .pk-cnt::after{content:"";position:absolute;left:36%;top:-12px;width:40px;height:14px;margin-left:-82px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#4b5563,#2b313b);box-shadow:inset 0 2px 0 rgba(255,255,255,.25)}
${P} .pk-mart-dlg{padding:14px 30px 13px 14px!important;margin:0 4px!important}
${P} .pk-mart-dlg p{margin:0;font-size:14px;line-height:1.5}
@keyframes pkSalut{0%,78%,100%{transform:rotate(0)}84%{transform:rotate(-3deg)}90%{transform:rotate(2.5deg)}95%{transform:rotate(-1deg)}}
${P} #sac.pk-mart .v4-items .v4-it{position:relative;background:linear-gradient(180deg,rgba(18,40,66,.92),rgba(9,22,40,.95))!important;box-shadow:inset 0 -6px 0 #7c5226,inset 0 -7px 0 #b8834f,0 10px 20px -14px rgba(0,0,0,.8)!important;padding-bottom:16px!important}
${P} #sac.pk-mart .v4-items .v4-it .v4-it-im{background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.18),rgba(255,255,255,.03) 70%)!important;border-radius:50%!important;box-shadow:inset 0 0 0 1.5px rgba(160,210,255,.25)!important}
${P} #sac.pk-mart .v4-items [data-buy]{position:relative;clip-path:polygon(12px 0,100% 0,100% 100%,12px 100%,0 50%);padding-left:18px!important;border-radius:4px!important;background:linear-gradient(180deg,#ffe877,#f5b82a)!important;color:#3a2600!important;box-shadow:none!important}
${P} #sac.pk-mart .v4-items [data-buy]::before{content:"";position:absolute;left:8px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#7a5200}

/* ---------- 9. Sac : sac à dos et poches ---------- */
${P} .pk-bag-ban{display:flex;align-items:center;gap:14px;margin:2px 0 16px;padding:12px 16px;border-radius:18px;background:radial-gradient(120% 100% at 0% 50%,rgba(240,167,58,.22),transparent 60%),linear-gradient(160deg,#3a2414,#1d120a)!important;box-shadow:0 0 0 2px #120a05,0 0 0 4px rgba(214,150,70,.45),0 16px 30px -16px rgba(0,0,0,.85)}
${P} .pk-bag-ban .pk-bagi{width:76px;height:76px;flex:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45));transform-origin:50% 90%;animation:pkSac .6s cubic-bezier(.3,1.5,.5,1) both}
${P} .pk-bag-ban b{display:block;font:800 17px/1.2 var(--f-d);color:#ffe2b0}
${P} .pk-bag-ban em{display:block;margin-top:3px;font:600 12.5px/1.35 var(--f-b);font-style:normal;color:#d9b48a}
@keyframes pkSac{0%{transform:scale(.8) rotate(-8deg)}60%{transform:scale(1.06) rotate(4deg)}100%{transform:none}}
${P} #sac.pk-bag .v4-cats{background:linear-gradient(180deg,#5a3a20,#3a2414)!important;border:0!important;border-radius:16px!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.6),0 0 0 2px #1d120a!important;outline:1.5px dashed rgba(255,214,150,.45);outline-offset:-5px;padding:7px!important}
${P} #sac.pk-bag .v4-cats>button{border-radius:12px 12px 8px 8px!important;background:linear-gradient(180deg,#8a5a30,#6b4322)!important;color:#ffe6c4!important;border:0!important;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,220,170,.2)!important;text-shadow:0 1px 0 rgba(0,0,0,.4)}
${P} #sac.pk-bag .v4-cats>button::before{display:none!important}
${P} #sac.pk-bag .v4-cats>button[aria-pressed="true"]{background:linear-gradient(180deg,#f3b65a,#d98a2b)!important;color:#3a1d06!important;text-shadow:none;box-shadow:inset 0 2px 0 rgba(255,240,200,.6),0 0 0 2px #ffe08a,0 6px 14px -6px rgba(255,170,60,.8)!important}
${P} #sac.pk-bag .v4-cats>button[aria-pressed="true"] svg{color:#3a1d06!important}
${P} #sac.pk-bag .v4-cats>button::after{display:none!important}

html.pk-calme .pk-dlg .pk-fl,html.pk-calme .pk-front .pk-clerk,html.pk-calme #pokedex .fcard .fc-foil{animation:none!important}
html.a11y-rm .pk-dlg .pk-fl,html.a11y-rm .pk-front .pk-clerk,html.a11y-rm .pk-bag-ban .pk-bagi,html.a11y-rm :is(.tcb,.v4-tbg).on::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.pk-dlg .pk-fl,.pk-front .pk-clerk,.pk-bag-ban .pk-bagi,#pokedex .fcard .fc-foil{animation:none!important}}
`;
  document.head.appendChild(css);

  /* ---------- 4. texte qui s'écrit lettre par lettre ---------- */
  // [élément tapé, boîte encadrée, flèche absolue ?]
  const DLG = [
    ['#scene417 .sc-tx', e => e.closest('.sc-card'), false],
    ['#coach .co-in p', e => e.closest('.co-in'), false],
    ['#tip429 p', e => e.closest('#tip429'), false],
    ['.tip .dlgbox', e => e, true],
    ['.v4h-prof > p', e => e, false],
    ['.intro .dlgbox', e => e, true],
    ['.sel-card .dlgbox', e => e, true],
    ['.pk-mart-dlg', e => e, true]
  ];
  const SKIP = '.dlg-who,button,input,select,textarea,label,svg,.pk-fl,.pav,.b';
  const VU = new Set();
  const JOBS = new Map();
  const visible = e => !!(e.offsetParent || (e.getClientRects && e.getClientRects().length));
  const cle = e => e.textContent.replace(/\s+/g, ' ').trim();
  const finir = j => {
    if (j.fini) return;
    j.fini = true;
    cancelAnimationFrame(j.raf);
    j.wraps.forEach(([w, t]) => {
      if (w.parentNode) w.parentNode.replaceChild(document.createTextNode(t), w);
    });
    if (j.box) j.box.classList.remove('pk-typing');
    JOBS.delete(j.el);
  };
  const ecrire = (e, box) => {
    const k = cle(e);
    if (!k) return;
    if (VU.has(k)) return;
    VU.add(k);
    if (texteDirect()) return;
    const nodes = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.data.trim()) continue;
      const s = n.parentElement && n.parentElement.closest(SKIP);
      if (s && e.contains(s)) continue;
      nodes.push(n);
    }
    if (!nodes.length) return;
    const spans = [],
      wraps = [];
    nodes.forEach(t => {
      const w = document.createElement('span');
      w.className = 'pk-tw';
      const txt = t.data;
      for (const ch of txt) {
        const c = document.createElement('span');
        c.className = 'pk-c';
        c.textContent = ch;
        w.appendChild(c);
        spans.push(c);
      }
      t.parentNode.replaceChild(w, t);
      wraps.push([w, txt]);
    });
    const j = { el: e, box, spans, wraps, k: 0, t0: performance.now(), ms: PREF.fast ? 11 : Math.max(8, Math.min(26, 2600 / spans.length)), fini: false, raf: 0 };
    if (box) box.classList.add('pk-typing');
    JOBS.set(e, j);
    const tick = now => {
      if (j.fini) return;
      if (!e.isConnected) return finir(j);
      // au plus ~22 mises à jour par seconde : plusieurs lettres à la fois, moins de recalculs
      if (now - (j.last || 0) < 45 && j.k) {
        j.raf = requestAnimationFrame(tick);
        return;
      }
      j.last = now;
      const k2 = Math.min(spans.length, Math.floor((now - j.t0) / j.ms) + 1);
      for (let i = j.k; i < k2; i++) spans[i].classList.add('v');
      j.k = k2;
      if (k2 >= spans.length) return finir(j);
      j.raf = requestAnimationFrame(tick);
    };
    j.raf = requestAnimationFrame(tick);
  };
  // toucher la boîte termine le texte ; dans une scène, le premier toucher ne fait pas avancer
  document.addEventListener(
    'click',
    e => {
      if (!JOBS.size || !e.target || !e.target.closest) return;
      for (const j of [...JOBS.values()]) {
        const zone = j.box || j.el;
        const scene = j.el.closest('#scene417');
        if (scene && scene.contains(e.target)) {
          if (e.target.closest('[data-scene="passer"]')) {
            finir(j);
            return;
          }
          finir(j);
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (zone && zone.contains(e.target) && !e.target.closest('button,a,input,select,textarea')) finir(j);
      }
    },
    true
  );

  /* ---------- passe commune après chaque changement d'écran ---------- */
  let rafScan = 0;
  const planifier = () => {
    if (!rafScan) rafScan = requestAnimationFrame(scan);
  };
  function scan() {
    rafScan = 0;
    try {
      for (const [sel, boxOf, abs] of DLG) {
        document.querySelectorAll(sel).forEach(e => {
          const box = boxOf(e);
          if (!box) return;
          if (!box.classList.contains('pk-dlg')) box.classList.add('pk-dlg');
          const hote = abs ? box : e;
          if (!hote.querySelector(':scope > .pk-fl')) hote.insertAdjacentHTML('beforeend', `<i class="pk-fl${abs ? ' abs' : ''}" aria-hidden="true"></i>`);
          // texte déjà écrit une fois : on ne lit pas la mise en page (évite un recalcul forcé à chaque changement du DOM)
          if (JOBS.has(e) || VU.has(cle(e)) || !visible(e)) return;
          ecrire(e, box);
        });
      }
      // cartes : chromatiques capturés
      const sh = (PROFILE && PROFILE.shiny) || [];
      // seulement quand le Pokédex est affiché (sinon des centaines de cartes relues à chaque action de combat)
      // la grille React (Grille.jsx) rend pk-shiny et « ✦ Chromatique » : on la redessine si elle a pris du retard
      if (
        cur === 'pokedex' &&
        [...document.querySelectorAll('#pokedex .fcard')].some(c => {
          const b = c.querySelector('[data-open]');
          const id = b && b.dataset.open;
          return c.classList.contains('pk-shiny') !== !!(id && sh.includes(id));
        })
      )
        refreshGrid();
    } catch (e) {}
  }
  if (window.MutationObserver) new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  const _show = show;
  __set_show(function () {
    const r = _show.apply(this, arguments);
    planifier();
    return r;
  });

  /* ---------- 9. Boutique et Sac ---------- */
  // comptoir, sac à poches et classes pk-mart / pk-bag : React (src/screens/sac) et renderBag()
  const _buy = buy;
  __set_buy(function () {
    const avant = PROFILE.money + ':' + PROFILE.gems;
    const r = _buy.apply(this, arguments);
    try {
      if (PROFILE.money + ':' + PROFILE.gems !== avant) {
        marquerAchat();
        son('caisse');
        if (cur === 'sac') renderBag();
      }
    } catch (e) {}
    return r;
  });

  /* ---------- Paramètres : réglages ajoutés à « Habillage Pokémon » ---------- */
  // boutons ajoutés à « Habillage Pokémon » : rendus par React (src/screens/settings/panels/HabillagePokemon.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pk473]');
    if (!b) return;
    const k = b.dataset.pk473 === 't' ? 'pk473t' : 'pk473s';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    renderParams();
    if (k === 'pk473s' && on(k)) son('bip');
  });

  try {
    NEWS416.unshift(['i-star', 'Le monde Pokémon', 'Entrée en combat qui brise l’écran, Pokémon qui sortent de leur Poké Ball et y retournent au K.O., barres de PV comme dans les jeux, dialogues lettre par lettre, silhouettes des Pokémon à capturer, cartes à collectionner, boîte à badges en velours avec sa cérémonie, Boutique avec son vendeur, Sac à poches et sons d’interface.']);
    NEWS416.splice(8);
  } catch (e) {}
  planifier();
  window.__monde473 = { scan, ecrire, finir, JOBS, VU, son };
})();
}
