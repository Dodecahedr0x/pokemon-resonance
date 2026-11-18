/* Section d'origine : v4.73 : combat façon Pokémon (entrée, Poké Balls, barres de PV, évolution, cérémonie du badge) */

import { clearOverlay, paintOverlay } from '../screens/overlays/dialogsStore.js';
import { GYMS } from './004-01-donnees.js';
import { SCEN } from './009-03-pokemon.js';
import { ARENAS, BADGES } from './013-07-arenes.js';
import { $, RM, el } from './014-08-outils.js';
import { badgeSvg } from './019-12-ligue.js';
import { uk } from './021-14-moteur-combat.js';
import { B, HC, L, __set_segHp, __set_updTok, segHp, updTok } from './024-17-interface-combat.js';
import { PREF, noise, tone, vibe } from './026-20-campagne-tutoriel-son.js';
import { AUTO, __set_turnBanner, __set_vsIntro, leaderOf, turnBanner, vsIntro } from './030-24-prestige-mise-en-scene.js';
import { boardSet, getBoard, tokCl, tokHas, unitsBatch } from '../screens/combat/board/boardStore.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const P = 'html:not(#pkz) body:not(#pkz)';
  const H = document.documentElement;
  const calme = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || PREF.pk472a === 0;
    } catch (e) {
      return false;
    }
  };
  const auto = () => {
    try {
      return typeof AUTO !== 'undefined' && !!AUTO;
    } catch (e) {
      return false;
    }
  };
  const vite = () => {
    try {
      return !!PREF.fast;
    } catch (e) {
      return false;
    }
  };

  /* ---------- sons maison (synthétisés, aucun son officiel) ---------- */
  const SONS = {
    whoosh: () => noise(0, 0.32, 0.05, 1600),
    envoi: () => {
      noise(0, 0.04, 0.05, 4200);
      tone(620, 0.02, 0.09, 'square', 0.022, 1320);
    },
    retour: () => tone(1500, 0, 0.26, 'sine', 0.035, 320)
  };
  const son = k => {
    try {
      if (!PREF.sound || RM || PREF.pk473s === 0) return;
      SONS[k] && SONS[k]();
    } catch (e) {}
  };
  window.__son473 = son;

  /* ---------- dessins : Poké Ball en SVG ---------- */
  const ballSvg = r =>
    `<path class="pk-sbt" d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z"/><path class="pk-sbb" d="M${-r} 0A${r} ${r} 0 0 0 ${r} 0Z"/><circle class="pk-sbn" r="${(r * 0.32).toFixed(2)}"/>`;
  const etincelles = (n, cls) => {
    let h = '';
    for (let i = 0; i < n; i++) h += `<circle class="${cls}" r="1.5" style="--a:${Math.round((360 / n) * i + 15)}deg"/>`;
    return h;
  };

  const css = document.createElement('style');
  css.id = 'resonance-v473-combat';
  css.textContent = `
/* ---------- 1. entrée en combat : écran qui se brise en bandes ---------- */
#pk-btr{position:fixed;inset:0;z-index:2147482000;pointer-events:none;display:none;overflow:hidden;contain:strict}
#pk-btr.go{display:block;animation:pkBtrOut .34s ease-in var(--o,.66s) forwards}
#pk-btr .pk-bd{position:absolute;left:-1px;right:-1px;height:calc(12.5% + 2px);top:calc(var(--n) * 12.5% - 1px);background:linear-gradient(180deg,#0d1626,#050910);transform:translateX(-102%);animation:pkBand .34s cubic-bezier(.6,0,.3,1) calc(var(--n) * 35ms + var(--d0,0s)) forwards}
#pk-btr .pk-bd:nth-child(even){transform:translateX(102%)}
#pk-btr.boss .pk-bd{background:linear-gradient(180deg,#2b1a06,#0d0803);box-shadow:inset 0 1px 0 rgba(255,211,90,.55),inset 0 -1px 0 rgba(255,211,90,.25)}
#pk-btr .pk-bc{position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;transform:scale(0) rotate(-200deg);background:radial-gradient(circle,#fff 0 12px,#151a22 13px 18px,transparent 19px),linear-gradient(180deg,#ff6a70 0,#e3262f 46%,#151a22 46% 54%,#f7f2e6 54%,#d4cab3 100%);box-shadow:0 0 0 4px #151a22,0 0 44px rgba(255,255,255,.55);animation:pkBtrBall .34s cubic-bezier(.2,1.4,.4,1) calc(var(--d0,0s) + .34s) forwards}
#pk-btr.boss .pk-bc{background:radial-gradient(circle,#fff8db 0 12px,#6b4a0e 13px 18px,transparent 19px),linear-gradient(180deg,#ffe68f 0,#f0b92e 46%,#6b4a0e 46% 54%,#f7d978 54%,#c8901c 100%);box-shadow:0 0 0 4px #6b4a0e,0 0 50px rgba(255,214,90,.7)}
#pk-btr .pk-fls{position:absolute;inset:0;background:#fff;opacity:0}
#pk-btr.sauvage{--d0:.42s;--o:.98s}
#pk-btr.sauvage .pk-fls{animation:pkFlash3 .42s linear forwards}
#pk-btr.sauvage .pk-bc{display:none}
#pk-btr.vite{--d0:0s!important;--o:.32s!important}
#pk-btr.vite .pk-bd{animation-duration:.22s;animation-delay:0s}
#pk-btr.vite .pk-bc,#pk-btr.vite .pk-fls{display:none}
@keyframes pkBand{to{transform:none}}
@keyframes pkBtrBall{to{transform:none}}
@keyframes pkBtrOut{to{opacity:0}}
@keyframes pkFlash3{0%,33%,66%,100%{opacity:0}16%,50%,83%{opacity:.9}}

/* ---------- 2. Poké Balls : envoi au début, retour au K.O. ---------- */
#bSvg .tok.pk-wait{opacity:0!important}
#bSvg .pk73fx{pointer-events:none}
#bSvg .pk73fx .pk-sbt{fill:#e3262f;stroke:#151a22;stroke-width:1.3}
#bSvg .pk73fx .pk-sbb{fill:#f7f2e6;stroke:#151a22;stroke-width:1.3}
#bSvg .pk73fx .pk-sbn{fill:#fff;stroke:#151a22;stroke-width:1.2}
#bSvg .pk-so{opacity:0;animation:pkSoIn .3s cubic-bezier(.5,0,.8,.6) var(--d,0s) forwards}
#bSvg .pk-so .pk-sbt{transform-box:fill-box;transform-origin:100% 100%;animation:pkSoT .26s ease-out calc(var(--d,0s) + .3s) forwards}
#bSvg .pk-so .pk-sbb,#bSvg .pk-so .pk-sbn{animation:pkSoB .26s ease-out calc(var(--d,0s) + .3s) forwards}
#bSvg .pk-so-fl{fill:#fff;opacity:0;animation:pkSoFl .46s ease-out calc(var(--d,0s) + .3s) forwards}
#bSvg .pk-spk{fill:#fff6c8;opacity:0;animation:pkSpk .5s ease-out calc(var(--d,0s) + .32s) forwards}
#bSvg .pk-wl-r{fill:none;stroke:#8be08a;stroke-width:2;opacity:0;animation:pkSoFl .5s ease-out var(--d,0s) forwards}
#bSvg .pk-lf{fill:#5fcf6a;opacity:0;animation:pkSpk .55s ease-out var(--d,0s) forwards}
#bSvg .tok.pk-rouge{filter:sepia(1) saturate(6) hue-rotate(-38deg) brightness(.92)}
#bSvg .pk-ko-r{fill:rgba(255,60,70,.45);stroke:#ff4b53;stroke-width:1.6;animation:pkKoR .55s ease-in forwards}
#bSvg .pk-ko-bm{fill:#ff6a70;transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:pkKoBm .55s ease-out .12s forwards}
#bSvg .pk-ko-b{opacity:0;animation:pkKoB .75s ease-out .32s forwards}
#bSvg .pk-poof{fill:rgba(220,230,240,.6);opacity:0;animation:pkSoFl .6s ease-out forwards}
@keyframes pkSoIn{0%{opacity:0;transform:translate(0,-34px) rotate(-200deg)}20%{opacity:1}100%{opacity:1;transform:none}}
@keyframes pkSoT{to{transform:translate(-2px,-6px) rotate(-60deg);opacity:0}}
@keyframes pkSoB{to{transform:translate(0,5px);opacity:0}}
@keyframes pkSoFl{0%{opacity:.95;transform:scale(.2)}100%{opacity:0;transform:scale(1.8)}}
@keyframes pkSpk{0%{opacity:1;transform:rotate(var(--a)) translate(0,-6px)}100%{opacity:0;transform:rotate(var(--a)) translate(0,-26px)}}
@keyframes pkKoR{0%{opacity:1;transform:scale(1.05)}100%{opacity:0;transform:scale(.1)}}
@keyframes pkKoBm{0%{transform:scaleY(0);opacity:1}55%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
@keyframes pkKoB{0%{opacity:0;transform:scale(.2)}25%{opacity:1;transform:scale(1.15)}40%{transform:rotate(-14deg)}55%{transform:rotate(10deg)}70%{opacity:1;transform:none}100%{opacity:0;transform:translate(0,-6px)}}

/* ---------- 3. barres de PV comme dans les jeux ---------- */
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg{position:relative;height:8px!important;margin-left:21px!important;border-radius:6px!important;overflow:visible!important;border:0!important;background:linear-gradient(180deg,#2a3443,#141a23)!important;box-shadow:0 0 0 1.5px #0a0e14,inset 0 1px 2px rgba(0,0,0,.65)!important}
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg::before{content:"PV";position:absolute;right:calc(100% + 3px);top:50%;transform:translateY(-50%);padding:1px 3px 0;border-radius:3px;background:linear-gradient(180deg,#ffd84d,#ef9f1c);color:#3a2300;font:900 7.5px/1.25 var(--f-d);letter-spacing:.02em;box-shadow:0 0 0 1px #0a0e14;pointer-events:none}
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg i{height:100%;border-radius:5px!important;background:linear-gradient(180deg,#9df79a 0 34%,#3fca5c 35% 100%)!important;box-shadow:inset 0 -1px 0 rgba(0,70,25,.35)!important}
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg i.mid{background:linear-gradient(180deg,#fff08a 0 34%,#e6b61d 35% 100%)!important}
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg i.lo{background:linear-gradient(180deg,#ff9c84 0 34%,#e3402c 35% 100%)!important}
${P} #cbBattle :is(.plate,.bp-hp) .hp.hseg .lag{border-radius:5px}
${P} #cbBattle .hp i.pk-dr{animation:pkDrain .8s cubic-bezier(.35,.1,.3,1) both}
/* correctif : « Évolue en fin de manche » ne déborde plus de la plaque */
${P} #cbBattle .plate .pl-b{max-width:100%}
${P} #cbBattle .plate .pl-s .it:has(.rdy,.evw){display:block!important;max-width:100%;white-space:normal!important;overflow:visible!important;text-align:center;line-height:1.15}
@keyframes pkDrain{0%,22%{width:var(--pa)}}

/* ---------- 8. évolution : vraie silhouette du Pokémon ---------- */
${P} .efx-orb{width:150px!important;height:150px!important;left:calc(50% - 75px)!important;top:calc(44% - 75px)!important}
${P} .efx-orb .medal.pk{width:124px!important;height:124px!important;background:transparent!important;box-shadow:none!important;border-color:transparent!important}
${P} .efx-orb .medal.pk::before,${P} .efx-orb .medal.pk::after{display:none!important}
${P} .efx-orb .medal.pk .mdl-a{width:120%!important;height:120%!important;transform:translate(-50%,-52%)!important}
${P} .efx-a{animation-name:pkFa!important}
${P} .efx-b{animation-name:pkFb!important}
${P} .efx::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle,#fff 0 1.4px,transparent 2px) 0 0/38px 44px,radial-gradient(circle,rgba(255,240,180,.95) 0 1px,transparent 1.6px) 19px 22px/52px 37px;animation:pkMontee 2.5s linear both}
${P} .evofx.fast .efx::after{animation-duration:1.3s}
@keyframes pkFa{0%,20%{opacity:1}23%{opacity:0}27%{opacity:1}30.5%{opacity:0}33.5%{opacity:1}36%{opacity:0}38.5%{opacity:1}40.5%{opacity:0}42.5%{opacity:1}44%{opacity:0}45.5%{opacity:1}46.8%{opacity:0}48%{opacity:1}49%{opacity:0}50%{opacity:1}51%,100%{opacity:0}}
@keyframes pkFb{0%,20%{opacity:0}23%{opacity:1}27%{opacity:0}30.5%{opacity:1}33.5%{opacity:0}36%{opacity:1}38.5%{opacity:0}40.5%{opacity:1}42.5%{opacity:0}44%{opacity:1}45.5%{opacity:0}46.8%{opacity:1}48%{opacity:0}49%{opacity:1}50%{opacity:0}51%,100%{opacity:1}}
@keyframes pkMontee{0%,14%{opacity:0;background-position:0 30px,19px 52px}22%{opacity:.8}54%{opacity:.8}64%,100%{opacity:0;background-position:0 -60px,19px -38px}}
@media (max-width:540px){${P} .efx-orb{width:130px!important;height:130px!important;left:calc(50% - 65px)!important;top:calc(44% - 65px)!important}${P} .efx-orb .medal.pk{width:108px!important;height:108px!important}}

/* ---------- 7. cérémonie du badge ---------- */
#pk-badge{position:fixed;inset:0;z-index:2147481000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 42%,rgba(60,14,26,.94),rgba(4,6,12,.96) 70%);animation:pkFonduIn .3s ease-out both;cursor:pointer}
#pk-badge[hidden]{display:none}
#pk-badge.out{animation:pkFonduOut .3s ease-in forwards}
#pk-badge .pk-bc-in{position:relative;display:grid;justify-items:center;gap:14px;text-align:center;max-width:340px}
#pk-badge .pk-bc-case{position:relative;width:170px;height:170px;display:grid;place-items:center;border-radius:28px;background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.07),transparent 60%),repeating-linear-gradient(45deg,rgba(255,255,255,.02) 0 2px,transparent 2px 4px),linear-gradient(180deg,#4a1322,#22070f);box-shadow:inset 0 4px 14px rgba(0,0,0,.8),0 0 0 2px #120408,0 0 0 5px rgba(212,170,90,.7),0 24px 50px -14px rgba(0,0,0,.9);outline:1.5px dashed rgba(255,215,140,.4);outline-offset:-10px}
#pk-badge .pk-bc-bdg{width:118px;height:118px;display:grid;place-items:center;animation:pkBadgeVol 1.1s cubic-bezier(.2,.9,.25,1.15) .15s both;filter:drop-shadow(0 6px 4px rgba(0,0,0,.7)) drop-shadow(0 0 22px rgba(255,214,110,.75))}
#pk-badge .pk-bc-bdg svg{width:100%;height:100%}
#pk-badge .pk-bc-case::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.55) 50%,transparent 62%) 160% 0/260% 100% no-repeat;mix-blend-mode:overlay;animation:pkReflet473 1s ease-out 1.25s both}
#pk-badge .pk-bc-gerbe{position:absolute;left:50%;top:50%;width:0;height:0}
#pk-badge .pk-bc-gerbe i{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#fff3b0;box-shadow:0 0 10px #ffd35a;opacity:0;animation:pkGerbe473 1s cubic-bezier(.15,.7,.3,1) 1.15s forwards;transform:rotate(var(--a))}
#pk-badge .pk-bc-gerbe i:nth-child(3n){background:#bff0ff;box-shadow:0 0 10px #6fdcff}
#pk-badge .pk-bc-t{margin:4px 0 0;font:800 20px/1.25 var(--f-d);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.8);animation:pkMonteIn .45s ease-out .9s both}
#pk-badge .pk-bc-t b{display:block;color:#ffd35a;font-size:26px}
#pk-badge .pk-bc-s{margin:0;font:600 13px/1.4 var(--f-b);color:#e8c9a8;animation:pkMonteIn .45s ease-out 1.05s both}
#pk-badge .pk-bc-k{margin:6px 0 0;font:700 10px/1 var(--f-m);letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.55);animation:pkMonteIn .4s ease-out 1.6s both}
@keyframes pkBadgeVol{0%{opacity:0;transform:perspective(600px) translateY(-140px) scale(.25) rotateY(-720deg)}70%{opacity:1;transform:perspective(600px) translateY(6px) scale(1.12) rotateY(10deg)}100%{opacity:1;transform:none}}
@keyframes pkReflet473{0%{background-position:160% 0}100%{background-position:-60% 0}}
@keyframes pkGerbe473{0%{opacity:0;transform:rotate(var(--a)) translateY(0) scale(.4)}12%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(-130px) scale(1)}}
@keyframes pkMonteIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pkFonduIn{from{opacity:0}to{opacity:1}}
@keyframes pkFonduOut{to{opacity:0}}

@media (prefers-reduced-motion:reduce){#pk-btr{display:none!important}#bSvg .pk73fx{display:none}#bSvg .tok.pk-wait{opacity:1!important}#cbBattle .hp i.pk-dr{animation:none!important}.efx::after{display:none}}
html.a11y-rm #pk-btr,html.a11y-rm #bSvg .pk73fx{display:none!important}
html.a11y-rm #bSvg .tok.pk-wait{opacity:1!important}
`;
  document.head.appendChild(css);

  /* ---------- 1. entrée en combat ---------- */
  // #pk-btr est rendu par React (src/screens/overlays/Effets.jsx) : ses bandes sont
  // posées par le store (paintOverlay('btr')), sa classe (go, boss, sauvage, vite) ici.
  const btr = document.getElementById('pk-btr');
  let tBtr = 0;
  const genre = b => {
    const D = SCEN[b.sc] || {};
    if (D.wild && !D.legend) return 'sauvage';
    let boss = !!(D.rival || D.legend || b.sc === 'champ' || D.gym != null);
    try {
      boss = boss || ARENAS.findIndex(a => a.k === b.sc) >= 0 || !!leaderOf(b.sc);
    } catch (e) {}
    return boss ? 'boss' : 'dresseur';
  };
  const transition = b => {
    if (calme() || auto()) return;
    btr.className = '';
    paintOverlay('btr', { on: true });
    void btr.offsetWidth;
    btr.className = 'go ' + genre(b) + (vite() ? ' vite' : '');
    son('whoosh');
    clearTimeout(tBtr);
    tBtr = setTimeout(() => {
      btr.className = '';
      clearOverlay('btr');
    }, vite() ? 700 : 1500);
  };

  /* ---------- 2. envoi des Pokémon et retour au K.O. ---------- */
  const ENTREE = new WeakMap();
  // calque des effets (React, dernier du plateau), créé au premier usage
  const couche = () => {
    if (!getBoard().pk) boardSet({ pk: true }, 'pk');
    return L.pk73 && L.pk73.isConnected ? L.pk73 : null;
  };
  const montrer = b => {
    try {
      if (!L || !L.u) return;
      unitsBatch(() => Object.values(L.u).forEach(T => tokCl(T, 'pk-wait', false))); // classes du jeton : Units.jsx
    } catch (e) {}
  };
  const preparer = b => {
    if (!b || calme() || auto() || !L || !L.u) return;
    ENTREE.set(b, 1);
    b.units.forEach(u => {
      const T = L.u[u.uid];
      if (T && !u.ko) tokCl(T, 'pk-wait', true);
    });
    setTimeout(() => {
      if (ENTREE.get(b) === 1) {
        ENTREE.set(b, 2);
        montrer(b);
      }
    }, 9000);
  };
  const envoyer = b => {
    const g = couche();
    if (!g || calme()) return montrer(b);
    const D = SCEN[b.sc] || {},
      wild = !!D.wild;
    const liste = b.units.filter(u => !u.ko && L.u[u.uid]);
    liste.sort((x, y) => (x.side === 'e' ? 0 : 1) - (y.side === 'e' ? 0 : 1));
    const pas = vite() ? 0.04 : 0.11;
    liste.forEach((u, i) => {
      const T = L.u[u.uid];
      let x, y;
      try {
        [x, y] = HC(uk(u));
      } catch (e) {
        tokCl(T, 'pk-wait', false);
        return;
      }
      const d = i * pas,
        sauvage = wild && u.side === 'e';
      const w = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
      w.style.setProperty('--d', d.toFixed(2) + 's');
      w.innerHTML = sauvage
        ? `<circle class="pk-wl-r" r="15"/>${etincelles(6, 'pk-lf')}`
        : `<circle class="pk-so-fl" r="17"/>${etincelles(6, 'pk-spk')}<g class="pk-so">${ballSvg(7)}</g>`;
      setTimeout(() => tokCl(T, 'pk-wait', false), (d + (sauvage ? 0.12 : 0.36)) * 1000);
      setTimeout(() => w.remove(), (d + 1.1) * 1000);
    });
    if (liste.length) son('envoi');
    setTimeout(() => montrer(b), liste.length * pas * 1000 + 900);
  };
  const retour = u => {
    const g = couche(),
      T = L.u && L.u[u.uid];
    if (!g || !T) return;
    let x, y;
    try {
      [x, y] = HC(uk(u));
    } catch (e) {
      return;
    }
    const D = (B && SCEN[B.sc]) || {},
      sauvage = !!D.wild && u.side === 'e';
    const w = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
    if (sauvage) w.innerHTML = '<circle class="pk-poof" r="14"/>';
    else {
      w.innerHTML = `<circle class="pk-ko-r" r="15"/><rect class="pk-ko-bm" x="-2" y="-42" width="4" height="42" rx="2"/><g transform="translate(0,-46)"><g class="pk-ko-b">${ballSvg(7.5)}</g></g>`;
      tokCl(T, 'pk-rouge', true);
      setTimeout(() => tokCl(T, 'pk-rouge', false), 800);
      son('retour');
    }
    setTimeout(() => w.remove(), 1300);
  };

  const _vs = vsIntro;
  __set_vsIntro(function () {
    try {
      if (B && !B.over) {
        preparer(B);
        transition(B);
      }
    } catch (e) {}
    return _vs.apply(this, arguments);
  });
  const _tb = turnBanner;
  __set_turnBanner(function () {
    try {
      if (B && ENTREE.get(B) === 1) {
        ENTREE.set(B, 2);
        envoyer(B);
      }
    } catch (e) {
      try {
        montrer(B);
      } catch (e2) {}
    }
    return _tb.apply(this, arguments);
  });
  const _ut = updTok;
  __set_updTok(function (u) {
    let avant = null;
    try {
      const T = L.u && L.u[u.uid];
      avant = T ? tokHas(T, 'ko') : null;
    } catch (e) {}
    const r = _ut.apply(this, arguments);
    try {
      if (avant === false && u.ko && !u.caught && !calme() && !auto()) retour(u);
    } catch (e) {}
    return r;
  });

  /* ---------- 3. les PV descendent progressivement ---------- */
  const _seg = segHp;
  __set_segHp(function (u) {
    const h = _seg.apply(this, arguments);
    try {
      if (calme()) return h;
      const m = /--a:([\d.]+)%;--b:([\d.]+)%;animation-delay:-(\d+)ms/.exec(h);
      if (!m) return h;
      return h.replace(/<i class="([^"]*)" style="width:([\d.]+)%">/, (x, c, w) => `<i class="${c} pk-dr" style="width:${w}%;--pa:${m[1]}%;animation-delay:-${m[3]}ms">`);
    } catch (e) {
      return h;
    }
  });

  /* ---------- 7. cérémonie du badge ---------- */
  const FETE = new WeakSet();
  // #pk-badge est rendu par React (src/screens/overlays/Effets.jsx) ; hidden et .out restent posés ici
  const bc = document.getElementById('pk-badge');
  let tBc = 0;
  const fermerBadge = () => {
    if (bc.hidden || bc.classList.contains('out')) return;
    clearTimeout(tBc);
    bc.classList.add('out');
    setTimeout(() => {
      bc.hidden = true;
      bc.classList.remove('out');
      clearOverlay('badge');
    }, 300);
  };
  bc.addEventListener('click', fermerBadge);
  document.addEventListener('keydown', e => {
    if (!bc.hidden && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) fermerBadge();
  });
  const feterBadge = () => {
    if (!B || !B.rew || !B.rew.badgeNew || FETE.has(B) || calme() || auto()) return;
    const D = SCEN[B.sc] || {};
    let i = typeof D.gym === 'number' ? D.gym : -1;
    if (i < 0) i = ARENAS.findIndex(a => a.k === B.sc);
    if (i < 0) return;
    FETE.add(B);
    let chef = '';
    try {
      const Lc = leaderOf(B.sc);
      if (Lc && Lc.n) chef = Lc.n;
    } catch (e) {}
    const nom = (GYMS[i] && GYMS[i].t) || D.at || '';
    paintOverlay('badge', { svg: badgeSvg(i, (GYMS[i] && GYMS[i].t) || nom, 'pkbc' + i), chef, nom, n: typeof BADGES !== 'undefined' ? BADGES.length : '' });
    bc.hidden = false;
    try {
      vibe([20, 40, 20, 40, 90]);
    } catch (e) {}
    clearTimeout(tBc);
    tBc = setTimeout(fermerBadge, vite() ? 2400 : 4200);
  };
  const res = $('#cbResult');
  if (res && window.MutationObserver)
    new MutationObserver(() => {
      try {
        if (!res.hidden && res.querySelector('.res-card')) setTimeout(feterBadge, 250);
      } catch (e) {}
    }).observe(res, { childList: true });

  window.__combat473 = { transition, envoyer, retour, feterBadge, ENTREE, genre };
})();
}
