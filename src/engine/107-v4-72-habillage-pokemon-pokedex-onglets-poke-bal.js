/* Section d'origine : v4.72 : habillage Pokémon (Pokédex, onglets Poké Ball, cartes de dresseur) */

import { $, $$, RM } from './014-08-outils.js';
import { __set_show, cur, show } from './016-09-navigation.js';
import { PREF, savePref } from './026-20-campagne-tutoriel-son.js';
import { renderParams } from './040-v4-08-parametres.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const P = 'html:not(#pkz) body:not(#pkz)';
  const H = document.documentElement;
  const on = k => PREF[k] !== 0;
  const calme = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || !on('pk472a');
    } catch (e) {
      return false;
    }
  };
  const appliquer = () => H.classList.toggle('pk-calme', !on('pk472a'));

  /* ---------- dessins : Poké Ball au trait et Poké Balls pleines ---------- */
  const trait = (c, o) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23${c}' stroke-opacity='${o}' stroke-width='2.6'%3E%3Ccircle cx='50' cy='50' r='46'/%3E%3Cpath d='M4 50h31M65 50h31'/%3E%3Ccircle cx='50' cy='50' r='15'/%3E%3Ccircle cx='50' cy='50' r='7'/%3E%3C/g%3E%3C/svg%3E")`;
  const coque = (h1, h2, b1 = '#f7f2e6', b2 = '#d4cab3', eq = '#151a22') =>
    `linear-gradient(180deg,${h1} 0%,${h2} 45%,${eq} 45% 55%,${b1} 55%,${b2} 100%)`;
  const ball = (r1, r2, haut, deco = '', bouton = '#fff', bord = '#151a22') =>
    `radial-gradient(circle at 50% 50%,${bouton} 0 ${r1}px,${bord} ${r1 + 0.6}px ${r2}px,transparent ${r2 + 0.6}px),` +
    `radial-gradient(circle at 32% 20%,rgba(255,255,255,.72) 0 ${(r1 * 0.32).toFixed(1)}px,transparent ${(r1 * 0.5).toFixed(1)}px),` +
    (deco ? deco + ',' : '') +
    haut;
  const ROUGE = coque('#ff7076', '#e3262f');
  const SUPER = coque('#6aa6ff', '#2a62e0');
  const HYPER = coque('#33363d', '#121418');
  const MASTER = coque('#a65ae0', '#6a27a3');
  const LUXE = coque('#30333a', '#14161a', '#30333a', '#14161a');
  const HONNEUR = coque('#ffffff', '#ebe5d8', '#f7f2e6', '#d4cab3', '#e3262f');
  const dSuper = 'radial-gradient(24% 13% at 22% 25%,#e3262f 96%,transparent 100%),radial-gradient(24% 13% at 78% 25%,#e3262f 96%,transparent 100%)';
  const dHyper = 'linear-gradient(90deg,transparent 20%,#ffcc2e 20% 33%,transparent 33% 67%,#ffcc2e 67% 80%,transparent 80%) center top/100% 45% no-repeat';
  const dMaster = 'radial-gradient(circle at 25% 29%,#ff86cc 0 3.4px,transparent 3.9px),radial-gradient(circle at 75% 29%,#ff86cc 0 3.4px,transparent 3.9px)';
  const dLuxe = 'linear-gradient(180deg,transparent 27%,#e8b938 27% 35%,transparent 35%) center top/100% 100% no-repeat';
  const MENU_BALL = {
    dex: ball(10, 12.5, ROUGE),
    quetes: ball(10, 12.5, SUPER, dSuper),
    sac: ball(10, 12.5, HYPER, dHyper),
    types: ball(10, 12.5, LUXE, dLuxe, '#fff', '#e8b938'),
    params: ball(10, 12.5, HONNEUR, '', '#fff', '#e3262f'),
    saves: ball(10, 12.5, MASTER, dMaster)
  };
  const ONGLETS = '.v4-tabs>button,.v4-reg>button,.gd-tabs>button,.v4-cats>button,.v4-seg>button,.scn-tabs>button,.stabs>.stab';
  const RAILS = '.v4-tabs,.v4-reg,.gd-tabs,.v4-cats,.v4-seg,.scn-tabs,.stabs';
  const ACTIF = ':is([aria-selected="true"],[aria-pressed="true"],.on)';
  const sel = (liste, suf = '') =>
    liste
      .split(',')
      .map(s => `${P} ${s}${suf}`)
      .join(',');

  const css = document.createElement('style');
  css.id = 'resonance-v472-habillage';
  css.textContent = `
:root{--pk-r1:#ff6c72;--pk-r2:#e3262f;--pk-r3:#a8131c;--pk-cr:#f7f2e6;--pk-ink:#151a22;--pk-cy:#6fdcff;--pk-or:#ffd35a}

/* ---------- fond : grande Poké Ball au trait ---------- */
#pk-fond{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;contain:strict}
#pk-fond i{position:absolute;width:118vmin;height:118vmin;right:-46vmin;bottom:-30vmin;background:${trait('8fd3ff', 0.07)} center/contain no-repeat;transform:rotate(-12deg)}
#pk-fond i+i{width:64vmin;height:64vmin;right:auto;left:-30vmin;bottom:auto;top:14vh;background-image:${trait('ffd35a', 0.06)};transform:rotate(18deg)}

/* ---------- barre du haut : tête de Pokédex ---------- */
${P} header.topbar{background:linear-gradient(180deg,rgba(11,27,50,.98),rgba(6,16,31,.95))!important}
${P} header.topbar::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(227,38,47,.9) 16%,#ffd35a 50%,rgba(227,38,47,.9) 84%,transparent)}
${P} a.logo{position:relative}
${P} a.logo .lg-ic{position:relative;border-radius:50%!important;background:radial-gradient(circle at 34% 30%,#e6fbff 0 2.5px,#8ee6ff 4px,#1a86d6 58%,#08386a 100%)!important;box-shadow:0 0 0 2px #e9eef5,0 0 0 3.5px #12161d,0 0 16px rgba(111,220,255,.55)!important;color:#fff!important;border:0!important}
${P} a.logo .lg-ic::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:1.5px solid rgba(111,220,255,.55);animation:pkHalo 2.8s ease-out infinite;pointer-events:none}
.topbar a.logo .pk-leds{position:absolute!important;top:7px;right:12px;display:flex!important;gap:4px;pointer-events:none;width:auto!important;height:auto!important;background:none!important;padding:0!important;margin:0!important;border:0!important}
.topbar a.logo .pk-leds i{display:block;flex:none;width:6px;height:6px;border-radius:50%;background:#ff4b53;box-shadow:0 0 6px #ff4b53;animation:pkLed 2.4s ease-in-out infinite}
.topbar a.logo .pk-leds i:nth-child(2){background:#ffd23a;box-shadow:0 0 6px #ffd23a;animation-delay:.4s}
.topbar a.logo .pk-leds i:nth-child(3){background:#46e07c;box-shadow:0 0 6px #46e07c;animation-delay:.8s}

/* ---------- barre du bas : Poké Balls ---------- */
${P} nav.bnav{background:linear-gradient(180deg,rgba(13,28,50,.97),rgba(5,12,24,.99))!important;border-top:0!important;box-shadow:0 -12px 30px -14px rgba(0,0,0,.85)!important}
${P} nav.bnav::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(227,38,47,.9) 18%,#ffd35a 50%,rgba(227,38,47,.9) 82%,transparent)}
${P} nav.bnav .bn .ic{position:relative;width:32px!important;height:32px!important;border-radius:50%!important;display:grid!important;place-items:center!important;margin-inline:auto;background:linear-gradient(90deg,rgba(150,190,235,.34) 0 20%,transparent 20% 80%,rgba(150,190,235,.34) 80%) center/100% 1.5px no-repeat!important;box-shadow:inset 0 0 0 1.5px rgba(150,190,235,.24)!important;transition:transform .2s ease}
${P} nav.bnav .bn .ic svg{width:16px!important;height:16px!important}
${P} nav.bnav .bn:active .ic{transform:scale(.9)}
${P} nav.bnav .bn[aria-current="page"] .ic{background:${ball(8.5, 11, ROUGE)}!important;box-shadow:0 0 0 1.5px #151a22,0 5px 14px -3px rgba(255,60,70,.7),0 0 18px rgba(255,205,90,.22)!important;color:#151a22!important;animation:pkSecoue .75s cubic-bezier(.3,1.4,.5,1) both}
${P} nav.bnav .bn[aria-current="page"] .ic svg{width:11px!important;height:11px!important;color:#151a22!important}
${P} nav.bnav .bn[aria-current="page"] .ic::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(255,211,90,.6);animation:pkHalo 1s ease-out .15s both;pointer-events:none}

/* ---------- en-tête de page : fiche de Pokédex ---------- */
${P} .ph{overflow-x:clip}
${P} .ph::before{content:"";position:absolute;right:4px;top:-6px;width:128px;height:128px;pointer-events:none;background:${trait('ffffff', 0.1)} center/contain no-repeat;transform:rotate(-15deg);z-index:0}
${P} .ph>*{position:relative;z-index:1}
${P} .kick::before{content:""!important;display:inline-block!important;width:7px!important;height:7px!important;min-width:7px;border-radius:50%!important;border:0!important;transform:none!important;background:radial-gradient(circle at 35% 32%,#ffc2c5,#ff3b44 55%,#9c0f17)!important;box-shadow:0 0 8px rgba(255,60,70,.95)!important;animation:pkLed 2.4s ease-in-out infinite;margin-right:7px;vertical-align:1px;flex:none}

/* ---------- onglets : capsules Poké Ball ---------- */
${sel(RAILS)}{background:linear-gradient(180deg,rgba(2,9,18,.74),rgba(6,16,30,.62))!important;border:1px solid rgba(130,185,240,.16)!important;box-shadow:inset 0 2px 9px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.04)!important;border-radius:18px!important;padding:5px!important;gap:5px!important}
${sel(ONGLETS)}{position:relative;border-radius:999px!important;border:1px solid transparent!important;background:transparent!important;color:#b9cbe0!important;box-shadow:none!important;transition:color .2s,transform .15s!important;-webkit-tap-highlight-color:transparent}
${sel(ONGLETS, ':active')}{transform:scale(.95)}
${sel(ONGLETS, ':not(:has(svg))::before')}{content:"";display:inline-block;flex:none;width:11px;height:11px;margin-right:7px;vertical-align:-1px;border-radius:50%;background:radial-gradient(circle,#0f141c 0 1.5px,rgba(185,203,224,.0) 1.6px 2.6px,transparent 2.7px),linear-gradient(180deg,rgba(185,203,224,.55) 0 42%,#0f141c 42% 58%,rgba(185,203,224,.3) 58%);box-shadow:0 0 0 1px rgba(185,203,224,.5);opacity:.6;transition:opacity .2s}
${sel(ONGLETS, ACTIF)}{background:radial-gradient(130% 120% at 50% -30%,rgba(255,255,255,.4),transparent 52%),linear-gradient(180deg,#ff676d 0%,#e3262f 52%,#b3141d 100%)!important;color:#fff!important;border-color:rgba(255,175,175,.6)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(80,0,8,.35),0 8px 18px -10px rgba(255,40,50,.95),0 0 0 1px rgba(60,0,6,.45)!important;text-shadow:0 1px 1px rgba(90,0,10,.5);animation:pkPop .45s cubic-bezier(.2,1.5,.4,1) both}
${sel(ONGLETS, ACTIF + ' svg')}{color:#fff!important}
${sel(ONGLETS, ACTIF + ':not(:has(svg))::before')}{opacity:1;background:radial-gradient(circle,#fff 0 1.6px,#151a22 1.7px 2.8px,transparent 2.9px),linear-gradient(180deg,#fff 0 42%,#151a22 42% 58%,#efe9dc 58%);box-shadow:0 0 0 1px #151a22,0 0 7px rgba(255,255,255,.7);animation:pkRoule .6s ease-out both}
${sel(ONGLETS, ACTIF + '::after')}{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.42) 50%,transparent 62%) 140% 0/260% 100% no-repeat;animation:pkReflet 1.1s ease-out .25s 1 both}
${P} .gd-tabs{border-radius:999px!important}

/* Combats : grandes cases de module */
${P} .sel-tabs{gap:8px!important}
${P} .sel-tabs>button{position:relative;border-radius:16px!important;background:linear-gradient(160deg,rgba(19,42,68,.95),rgba(8,20,36,.96))!important;border:1px solid rgba(130,185,240,.2)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;color:#c9d9ea!important;overflow:hidden;transition:transform .15s!important}
${P} .sel-tabs>button:active{transform:scale(.97)}
${P} .sel-tabs>button::before{content:"";position:absolute;right:-16px;top:50%;width:64px;height:64px;margin-top:-32px;pointer-events:none;background:${trait('8fd3ff', 0.14)} center/contain no-repeat}
${P} .sel-tabs>button[aria-selected="true"]{background:radial-gradient(120% 90% at 30% -20%,rgba(255,255,255,.32),transparent 55%),linear-gradient(165deg,#f0444b,#c0161f 60%,#8e0e16)!important;border-color:rgba(255,180,180,.6)!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 22px -12px rgba(255,40,50,.95)!important;animation:pkPop .45s cubic-bezier(.2,1.5,.4,1) both}
${P} .sel-tabs>button[aria-selected="true"]::before{background-image:${trait('ffffff', 0.32)};animation:pkTourne 9s linear infinite}
${P} .sel-tabs>button[aria-selected="true"] :is(svg,b,em){color:#fff!important}
${P} .sel-tabs>button[aria-selected="true"] em{opacity:.85}

/* ---------- panneaux : châssis de Pokédex ---------- */
${P} :is(.v4-panel,.v4-hero,.case)::before{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;z-index:2;border:2px solid;border-color:var(--pk-cy) var(--pk-or) var(--pk-or) var(--pk-cy);opacity:.8;-webkit-mask:radial-gradient(circle at 0 0,#000 0 18px,transparent 46px),radial-gradient(circle at 100% 100%,#000 0 18px,transparent 46px);mask:radial-gradient(circle at 0 0,#000 0 18px,transparent 46px),radial-gradient(circle at 100% 100%,#000 0 18px,transparent 46px)}
.pk-rise{animation:pkMonte .55s cubic-bezier(.2,.9,.3,1) both!important;animation-delay:calc(var(--pk-i,0)*60ms)!important}
.pk-fade{animation:pkFondu .45s ease-out both!important;animation-delay:calc(var(--pk-i,0)*50ms)!important}
${P} :is(.v4-panel,.v4-hero,.case).pk-scan::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:linear-gradient(180deg,transparent 0 42%,rgba(111,220,255,.07) 47%,rgba(111,220,255,.38) 50%,transparent 51%) 0 100%/100% 300% no-repeat;animation:pkScan 1.05s ease-out both;animation-delay:calc(var(--pk-i,0)*60ms + .12s)}

/* cartes de dresseur : statistiques, trophées, portefeuille */
${P} :is(.v4-stats,.v4-trophy,.v4-walbig){position:relative;box-shadow:inset 0 0 0 1px rgba(255,211,90,.32),inset 0 0 0 4px rgba(6,16,30,.55),inset 0 0 0 5px rgba(255,211,90,.14),0 18px 38px -18px rgba(0,0,0,.8)!important}
${P} .v4-stats::before{content:"Carte de dresseur";position:absolute;top:-8px;left:18px;padding:1px 8px;border-radius:6px;background:#0b1d30;border:1px solid rgba(255,211,90,.35);font:700 9px/1.4 var(--f-m);letter-spacing:.16em;text-transform:uppercase;color:#ffd35a;pointer-events:none;z-index:2}
${P} :is(.v4-stats,.v4-walbig)::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,235,170,.12) 42%,rgba(140,220,255,.12) 50%,rgba(255,160,220,.1) 58%,transparent 70%) 150% 0/300% 100% no-repeat;animation:pkReflet 1.4s ease-out .7s 1 both}

/* ---------- menu : une Poké Ball par rubrique ---------- */
${P} .v4-mi .v4-mi-ic{width:42px!important;height:42px!important;min-width:42px;border-radius:50%!important;border:0!important;display:grid!important;place-items:center!important;background:${MENU_BALL.dex}!important;box-shadow:0 0 0 1.5px #151a22,0 6px 14px -6px rgba(0,0,0,.8)!important;color:#151a22!important}
${P} .v4-mi .v4-mi-ic svg{width:12px!important;height:12px!important;color:#151a22!important}
${P} .v4-mi[data-t="quetes"] .v4-mi-ic{background:${MENU_BALL.quetes}!important}
${P} .v4-mi[data-t="sac"] .v4-mi-ic{background:${MENU_BALL.sac}!important}
${P} .v4-mi[data-t="types"] .v4-mi-ic{background:${MENU_BALL.types}!important;box-shadow:0 0 0 1.5px #e8b938,0 6px 14px -6px rgba(0,0,0,.8)!important}
${P} .v4-mi[data-t="params"] .v4-mi-ic{background:${MENU_BALL.params}!important}
${P} .v4-mi[data-v4saves] .v4-mi-ic{background:${MENU_BALL.saves}!important}
${P} .v4-mi:active .v4-mi-ic{animation:pkSecoue .6s cubic-bezier(.3,1.4,.5,1)}
${P} #v4Menu:not([hidden]) .v4-mi{animation:pkMonte .4s cubic-bezier(.2,.9,.3,1) both}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(2){animation-delay:.04s}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(3){animation-delay:.08s}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(4){animation-delay:.12s}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(5){animation-delay:.16s}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(6){animation-delay:.2s}
${P} #v4Menu:not([hidden]) .v4-mi:nth-child(n+7){animation-delay:.24s}

/* ---------- Pokédex : liste et boutons de mission ---------- */
${P} .v4-btn{border:1px solid rgba(255,236,160,.75)!important;border-radius:999px!important;padding:8px 14px!important;background:radial-gradient(120% 120% at 50% -30%,rgba(255,255,255,.55),transparent 55%),linear-gradient(180deg,#ffe877,#ffc12f)!important;color:#10213a!important;font:800 12px/1 var(--f-d)!important;box-shadow:inset 0 -2px 0 rgba(120,70,0,.25),0 6px 14px -8px rgba(255,190,40,.8)!important;cursor:pointer;white-space:nowrap}
${P} .v4-btn:active{transform:scale(.95)}
${P} .v4-btn:disabled{filter:grayscale(.8) brightness(.75);box-shadow:none!important}
${P} .v4-dl.on{background:radial-gradient(90% 120% at 0% 50%,rgba(227,38,47,.28),transparent 70%),linear-gradient(160deg,rgba(26,48,76,.95),rgba(10,22,40,.95))!important;border-color:rgba(255,120,125,.6)!important;box-shadow:inset 3px 0 0 #ff4b53,0 0 14px -4px rgba(255,60,70,.6)!important}
${P} .v4-dl.on::after{content:"";position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#ff4b53;box-shadow:0 0 8px #ff4b53;animation:pkLed 1.6s ease-in-out infinite;pointer-events:none}

/* ---------- messages : une petite Poké Ball qui roule ---------- */
${P} .toast::before{content:""!important;display:inline-block!important;flex:none!important;width:14px!important;height:14px!important;min-width:14px;border-radius:50%!important;border:0!important;background:${ball(2.6, 3.7, ROUGE)}!important;box-shadow:0 0 0 1px #151a22,0 0 8px rgba(255,80,90,.5)!important}
${P} .toast.on::before{animation:pkRoule .55s ease-out both}

/* ---------- boutons dorés : onde au toucher ---------- */
.pk-onde{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;pointer-events:none;border:2px solid rgba(255,255,255,.95);box-shadow:0 0 10px rgba(255,255,255,.6);animation:pkOnde .6s ease-out forwards;z-index:3}

/* ---------- écran de résultat : carte de dresseur holographique ---------- */
${P} #cbResult>.res-card>.pk-holo{position:absolute!important;inset:0!important;margin:0!important;width:auto!important;height:auto!important;border-radius:inherit;padding:2px;pointer-events:none;z-index:4!important;background:linear-gradient(115deg,#ffd35a,#fff4c4 14%,#7fd9ff 30%,#ffb2db 46%,#ffd35a 62%,#fff4c4 76%,#7fd9ff 90%,#ffd35a) 0 50%/300% 300%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:pkHolo 6s linear infinite}
${P} #cbResult>.res-card.lose>.pk-holo{background:linear-gradient(115deg,#9aa8b8,#eef3f8 20%,#7c8a9c 40%,#dfe7ef 60%,#9aa8b8 80%,#eef3f8) 0 50%/300% 300%}
${P} #cbResult>.res-card>.pk-sceau{position:absolute!important;top:16px!important;right:16px!important;left:auto!important;margin:0!important;width:50px!important;height:50px!important;border-radius:50%;pointer-events:none;z-index:5!important;background:${ball(7.5, 9.5, coque('#ffe68f', '#f0b92e', '#f7d978', '#c8901c', '#6b4a0e'), '', '#fff8db', '#6b4a0e')};box-shadow:0 0 0 2px rgba(107,74,14,.9),0 0 0 5px rgba(255,214,90,.25),0 6px 18px rgba(0,0,0,.5);animation:pkTampon .7s cubic-bezier(.2,1.3,.4,1) .45s both}
.pk-sceau::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:1.5px dashed rgba(255,220,120,.55);animation:pkTourne 14s linear infinite}
.lose .pk-sceau{filter:grayscale(1) brightness(1.05)}
${P} #cbResult>.res-card>.pk-gerbe{position:absolute!important;left:50%!important;top:120px!important;margin:0!important;width:0!important;height:0!important;pointer-events:none;z-index:5!important}
.pk-gerbe i{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#fff3b0;box-shadow:0 0 10px #ffd35a,0 0 3px #fff;transform:rotate(var(--a)) translateY(0) scale(.4);opacity:0;animation:pkGerbe .95s cubic-bezier(.15,.7,.3,1) var(--d,0s) forwards}
.pk-gerbe i:nth-child(3n){background:#bff0ff;box-shadow:0 0 10px #6fdcff}
.pk-gerbe i:nth-child(4n){background:#ffc2df;box-shadow:0 0 10px #ff86c0}
#cbResult>.res-card.win{animation:pkCarte .75s cubic-bezier(.2,1.1,.3,1) both!important}

/* ---------- fiche Pokémon (feuille du bas) ---------- */
${P} #sheet .sh{border-top:0!important}
${P} #sheet .sh::before{content:"";position:sticky;top:0;display:block;height:3px;margin-bottom:-3px;z-index:6;background:linear-gradient(90deg,#e3262f,#ffd35a 50%,#e3262f);pointer-events:none}

/* ---------- ouverture en Poké Ball entre les onglets ---------- */
#pk-iris{position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:none}
#pk-iris.go{display:block}
#pk-iris i{position:absolute;box-sizing:border-box;display:block;margin:0;padding:0;border-radius:0;opacity:1;box-shadow:none;transform:none}
#pk-iris .pk-h{left:0;right:0;height:50.5%}
#pk-iris .pk-ht{top:0;background:radial-gradient(120% 90% at 28% 8%,rgba(255,255,255,.34),transparent 46%),linear-gradient(180deg,#ff5b61,#d7212a 72%,#a3121a);border-bottom:7px solid #12161d}
#pk-iris .pk-hb{bottom:0;background:radial-gradient(120% 90% at 70% 100%,rgba(0,0,0,.12),transparent 50%),linear-gradient(180deg,#fbf7ee,#d9d0bc);border-top:7px solid #12161d}
#pk-iris .pk-hc{left:50%;top:50%;width:86px;height:86px;margin:-43px 0 0 -43px!important;border-radius:50%!important;background:radial-gradient(circle,#fff 0 21px,#dcd5c5 22px 26px,#12161d 27px 34px,#fbf7ee 35px);box-shadow:0 0 0 7px #12161d,0 0 34px rgba(255,255,255,.55)!important}
#pk-iris.go .pk-ht{animation:pkHaut .44s cubic-bezier(.65,0,.35,1) .14s both}
#pk-iris.go .pk-hb{animation:pkBas .44s cubic-bezier(.65,0,.35,1) .14s both}
#pk-iris.go .pk-hc{animation:pkBouton .52s ease-out both}

/* ---------- animations ---------- */
@keyframes pkTourne{to{transform:rotate(360deg)}}
@keyframes pkLed{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pkHalo{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.35);opacity:0}}
@keyframes pkSecoue{0%{transform:scale(.55) rotate(0)}30%{transform:scale(1.14) rotate(-16deg)}50%{transform:scale(1) rotate(11deg)}70%{transform:rotate(-6deg)}86%{transform:rotate(3deg)}100%{transform:scale(1) rotate(0)}}
@keyframes pkPop{0%{transform:scale(.9)}55%{transform:scale(1.05)}100%{transform:none}}
@keyframes pkRoule{0%{transform:translateX(-8px) rotate(-200deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes pkReflet{0%{background-position:140% 0}100%{background-position:-40% 0}}
@keyframes pkMonte{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}
@keyframes pkFondu{from{opacity:0}to{opacity:1}}
@keyframes pkScan{0%{background-position:0 100%;opacity:1}85%{opacity:1}100%{background-position:0 0;opacity:0}}
@keyframes pkOnde{to{transform:scale(13);opacity:0}}
@keyframes pkHolo{to{background-position:300% 50%}}
@keyframes pkTampon{0%{transform:scale(2.6) rotate(-35deg);opacity:0}60%{transform:scale(.9) rotate(6deg);opacity:1}100%{transform:none;opacity:1}}
@keyframes pkGerbe{0%{opacity:0;transform:rotate(var(--a)) translateY(0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(var(--r,-110px)) scale(1)}}
@keyframes pkCarte{0%{opacity:0;transform:perspective(900px) rotateY(-75deg) scale(.86)}60%{opacity:1;transform:perspective(900px) rotateY(8deg) scale(1.02)}100%{opacity:1;transform:none}}
@keyframes pkHaut{to{transform:translateY(-104%)}}
@keyframes pkBas{to{transform:translateY(104%)}}
@keyframes pkBouton{0%{transform:scale(1)}25%{transform:scale(1.12);filter:brightness(1.35)}100%{transform:scale(.25);opacity:0}}

/* ---------- calme : Réduire les animations ou effets animés coupés ---------- */
html.pk-calme #pk-fond i,html.pk-calme .ph::before,html.pk-calme .pk-leds i,html.pk-calme a.logo .lg-ic::after,html.pk-calme .kick::before,html.pk-calme .sel-tabs>button::before,html.pk-calme .pk-holo,html.pk-calme .pk-sceau::after,html.pk-calme :is(.v4-stats,.v4-walbig)::after{animation:none!important}
html.pk-calme ${ONGLETS.split(',').map(s => s + '::after').join(',html.pk-calme ')}{animation:none!important;display:none}
html.a11y-rm #pk-fond i,html.a11y-rm .ph::before,html.a11y-rm .pk-holo,html.a11y-rm .pk-gerbe{animation:none!important}
html.a11y-rm .pk-gerbe,html.pk-calme .pk-gerbe{display:none}
@media (prefers-reduced-motion:reduce){#pk-fond i,.ph::before,.pk-leds i,.pk-holo,.pk-sceau,.pk-sceau::after,.pk-gerbe i{animation:none!important}.pk-gerbe{display:none}}
`;
  document.head.appendChild(css);

  /* ---------- éléments ajoutés : #pk-fond et #pk-iris sont rendus par React
     (src/screens/overlays/Effets.jsx) ; la classe .go de l’iris reste posée ici ---------- */
  const iris = document.getElementById('pk-iris');

  // voyants du logo de la barre du haut (.pk-leds) : rendus par React (src/components/Shell.jsx)

  /* ---------- ouverture en Poké Ball (barre du bas et menu) ---------- */
  let tIris = 0;
  const ouvrir = () => {
    if (calme() || !on('pk472t')) return;
    iris.classList.remove('go');
    void iris.offsetWidth;
    iris.classList.add('go');
    clearTimeout(tIris);
    tIris = setTimeout(() => iris.classList.remove('go'), 700);
  };
  document.addEventListener(
    'click',
    e => {
      const a = e.target.closest && e.target.closest('.bnav [data-t],#v4Menu [data-t]');
      if (!a) return;
      let t = a.dataset.t;
      if (t === 'ligue') t = 'combat';
      if (t && t !== cur) ouvrir();
    },
    true
  );

  /* ---------- entrée des écrans : montée et balayage du scanner ---------- */
  const CAND = '.v4-panel,.v4-hero,.case,.sel-card,.gd-p,.gd-intro,.v4-it,.v4-qm,.cb-b,.v4-stats,.v4d-sec,.tip';
  let tEntree = 0;
  const entree = () => {
    if (calme()) return;
    const pg = $('.page.on');
    if (!pg) return;
    clearTimeout(tEntree);
    $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan'));
    const fixe = pg.id === 'combat';
    const vh = innerHeight * 1.25;
    const L = [...pg.querySelectorAll(CAND)].filter(x => {
      if (x.parentElement && x.parentElement.closest(CAND)) return false;
      const r = x.getBoundingClientRect();
      return r.width > 0 && r.top < vh;
    });
    L.slice(0, 12).forEach((x, i) => {
      x.style.setProperty('--pk-i', i);
      x.classList.add(fixe ? 'pk-fade' : 'pk-rise');
      if (x.matches('.v4-panel,.v4-hero,.case')) x.classList.add('pk-scan');
    });
    tEntree = setTimeout(() => $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan')), 1900);
  };
  const _show = show;
  __set_show(function (t) {
    const avant = cur;
    const r = _show.apply(this, arguments);
    try {
      if (cur !== avant) requestAnimationFrame(entree);
    } catch (e) {}
    return r;
  });

  /* ---------- onde au toucher sur les boutons dorés ---------- */
  document.addEventListener(
    'pointerdown',
    e => {
      const b = e.target.closest && e.target.closest('.b-gold,.v4-cta');
      if (!b || calme()) return;
      const cs = getComputedStyle(b);
      if (cs.overflow !== 'hidden' || cs.position === 'static') return;
      const r = b.getBoundingClientRect();
      const o = document.createElement('i');
      o.className = 'pk-onde';
      o.style.left = e.clientX - r.left + 'px';
      o.style.top = e.clientY - r.top + 'px';
      b.appendChild(o);
      setTimeout(() => o.remove(), 650);
    },
    { passive: true }
  );

  /* ---------- carte de résultat : bord holographique, sceau, gerbe : rendus par React (Result.jsx) ---------- */

  /* ---------- Paramètres : réglages de l'habillage ---------- */
  // panneau « Habillage Pokémon » : rendu par React (src/screens/settings/panels/HabillagePokemon.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pk472]');
    if (!b) return;
    const k = b.dataset.pk472 === 't' ? 'pk472t' : 'pk472a';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    appliquer();
    renderParams();
  });
  appliquer();

  try {
    NEWS416.unshift(['i-star', 'Habillage Pokémon', 'Onglets en capsules Poké Ball, barre du bas en Poké Balls, menu avec une Ball par rubrique, tête de Pokédex avec ses voyants, ouverture en Poké Ball entre les onglets et carte de résultat holographique. Réglable dans Paramètres.']);
    NEWS416.splice(8);
  } catch (e) {}
  window.__habillage472 = { ouvrir, entree };
})();
}
