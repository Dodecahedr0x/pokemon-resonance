/* Section d'origine : v4.77 : graphismes peints (décors et textures du dossier img/, plateau incliné en perspective) */

import { SCEN } from './009-03-pokemon.js';
import { $, RM, toast } from './014-08-outils.js';
import { BH, BW, K, __set_pRelance, byUid, pRelance, uk } from './021-14-moteur-combat.js';
import { B, BG, HC, HC0, HP, L, MQV, TILT, VB, VERT, __set_VERT, __set_buildBoard, __set_confirmAct, __set_hit, __set_renderAll, __set_renderBoard, __set_updTokCore, buildBoard, clearAim, confirmAct, hit, renderAll, renderBoard, tiltP, tiltS, ui, updTokCore } from './024-17-interface-combat.js';
import { PREF, TUTO, savePref, sfx } from './026-20-campagne-tutoriel-son.js';
import { FXK, FXS, __set_fxAttack, __set_fxGuard, fxAdd, fxAttack, fxGuard, fxOn, fxPrep } from './028-22-effets-attaque.js';
import { renderParams } from './040-v4-08-parametres.js';
import { __set_tokenArt, tokenArt } from './041-v4-1-01-illustrations.js';
import { acteurCourant } from './044-v4-5-01-moteur-tactique.js';
import { heureDe } from './046-v4-7-01-plateau-vivant.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { joueur418 } from './058-v4-18-01-peche-safari-coop.js';
import { dl428 } from './063-v4-28-01-captures-combat-accueil.js';
import { anim429, rejouer429 } from './064-v4-29-01-qualite.js';
import { TUTO433 } from './068-v4-33-01-duel-et-tutoriel.js';
import { refreshBattle } from '../screens/combat/battle/battleStore.js';
import { bdClass, bdRejouer, getHost, hostSet } from '../screens/combat/board/boardStore.js';
import { boardSet, getBoard, unitsDirty } from '../screens/combat/board/boardStore.js';

// Déroulé guidé du tour (v4.78) : étapes lues par le panneau et la barre du bas (src/screens/combat/battle).
export let flow478;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  /* Les images viennent du dossier img/ posé à côté du fichier, comme audio/.
     Sans ce dossier, ou en mode « Léger », rien ne change : plateau à plat de la v4.76. */
  const TEX = ['grass', 'stone', 'water', 'sand', 'ash', 'marble', 'rune', 'mud', 'lava'];
  const ETATS = ['wet', 'mud', 'lava', 'dep430z', 'fog431t']; // états d'une case dessinés sur la case : recopiés sur sa texture
  const OK = new Set();
  let artOk = false;
  const riche = () => artOk && PREF.gfx477 !== 'leger';
  const enCombat = () => B && L.tiles && !$('#cbBattle').hidden;
  const rebatir = () => {
    if (enCombat()) {
      buildBoard();
      renderAll();
    }
  };
  // une seule sonde : sans dossier img/, une seule requête échoue
  const charger = (t, ok, ko) => {
    const im = new Image();
    im.onload = () => {
      OK.add(t);
      if (ok) ok();
    };
    if (ko) im.onerror = ko;
    im.src = 'img/tex-' + t + '.webp';
  };
  charger(
    'grass',
    () => {
      artOk = true;
      document.body.classList.remove('no-art477');
      TEX.slice(1).forEach(t => charger(t, rebatir)); // sans effet hors combat
      rebatir();
    },
    () => document.body.classList.add('no-art477')
  );

  /* ---------- perspective : réglée à chaque construction du plateau ---------- */
  const LIP = 7; // épaisseur de la dalle de terre sous les cases (unités du viewBox, au premier rang)
  const regler = () => {
    TILT.on = false;
    if (!riche() || !B) return;
    __set_VERT(!!(MQV && MQV.matches));
    const [W, H] = VB(),
      S = BG.S,
      a = ((VERT ? 30 : 40) * Math.PI) / 180,
      pts = [];
    for (const k in B.tiles) {
      const [x, y] = HC0(k);
      for (let i = 0; i < 6; i++) pts.push([x + S * Math.cos((Math.PI / 3) * i), y + S * Math.sin((Math.PI / 3) * i)]);
    }
    Object.assign(TILT, { f: VERT ? 950 : 780, sn: Math.sin(a), cs: Math.cos(a), Hb: Math.max(...pts.map(p => p[1])), cx: W / 2, k: 1, ox: 0, oy: 0 });
    const pr = pts.map(p => tiltP(p[0], p[1])),
      xs = pr.map(p => p[0]),
      ys = pr.map(p => p[1]),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys),
      m = 12, // marge des côtés : repères A–H
      bas = 26, // sous le premier rang : socle + nom des Pokémon
      ciel = H * (VERT ? 0.1 : 0.14); // bande de décor laissée visible au-dessus du plateau
    const k = Math.min((W - 2 * m) / (x1 - x0), (H - ciel - bas) / (y1 - y0));
    TILT.k = k;
    TILT.ox = (W - (x1 - x0) * k) / 2 - x0 * k;
    TILT.oy = H - bas - y1 * k;
    TILT.on = true;
  };

  /* ---------- habillage du plateau construit ---------- */
  // arènes : le décor suit le type du champion (canyon pour Roche, tour mystique pour Spectre…), stade sinon
  const AT = { Roche: 'roche', Sol: 'roche', Combat: 'roche', Acier: 'roche', Spectre: 'tour', Dragon: 'tour', Psy: 'tour', Poison: 'tour', Ténèbres: 'tour' };
  const lieu = () => {
    const D = SCEN[B.sc];
    return D.bio === 'arene' ? AT[D.at] || 'ligue' : D.bio;
  };
  const fond = () => {
    const bio = lieu(),
      h = heureDe(B);
    return `url(img/bg-${bio}-${h}.webp),url(img/bg-${bio}-jour.webp),url(img/bg-gue-${h}.webp)`;
  };
  // brume de l'horizon et teinte de lune : réglées ici pour pouvoir changer d'heure en plein combat
  // (calques React : .lum477.n et les arrêts de #hz477 suivent l'état « night »)
  const teinter = nuit => boardSet({ night: nuit }, 'defs', 'tilt');
  // la nuit tombe (ou le jour se lève) pendant le combat : le décor peint passe en fondu, la lumière suit
  const changerHeure = () => {
    const bd = $('#bBoard'),
      h = heureDe(B);
    L.h477 = h;
    const avant = getComputedStyle(bd).backgroundImage;
    hostSet({ bg477: fond() });
    // .fondu477 (ancien décor qui s'efface) : rendu par React (Board.jsx)
    if (anim429() && avant && avant !== 'none') {
      const n = ((getHost().fondu || {}).n || 0) + 1,
        fd = { n, bg: avant, va: false };
      hostSet({ fondu: fd });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (getHost().fondu === fd) hostSet({ fondu: { ...fd, va: true } });
        })
      );
      setTimeout(() => {
        const f = getHost().fondu;
        if (f && f.n === n) hostSet({ fondu: null });
      }, 2200);
    }
    teinter(h === 'nuit');
    nuages();
    ambiance();
    eau(true); // reflets recolorés (lune ou soleil)
  };
  const habiller = () => {
    // classes, --bg477, nuages et poussière de #bBoard : rendus par React (état « host » de boardStore.js)
    bdClass('tilt477', TILT.on);
    if (!TILT.on) {
      hostSet({ bg477: undefined, cs477: false, amb477: null });
      return;
    }
    hostSet({ bg477: fond() });
    if (SCEN[B.sc].bio === 'arene') {
      const t = { roche: 'stone', tour: 'rune', ligue: 'marble' }[lieu()];
      if (OK.has(t)) L.txId = 'tx-' + t; // renderBoard pose ce motif sur chaque case
    }
    // textures peintes dans les motifs existants (renderBoard les choisit déjà par case)
    TEX.forEach(t => bdClass('has-' + t + '477', OK.has(t)));
    const tex477 = TEX.filter(t => OK.has(t)); // motifs remplacés par l'image (calque React <defs>)
    // dalle de terre : chaque case posée sur un socle plus sombre, visible côté joueur
    const lip = [];
    for (const k in B.tiles) {
      const [x, y] = HC(k),
        s = tiltS(x, y);
      lip.push(HP(x, y + LIP * s, BG.S - 1));
    }
    // la texture opaque recouvre la case : ses états (boue, lave, brouillard…) passent sur la texture
    const copier = k => {
      const c = ETATS.filter(e => L.t[k].classList.contains(e)).join(' '),
        v = c ? 'tx ' + c : 'tx';
      if (L.tx[k].getAttribute('class') !== v) L.tx[k].setAttribute('class', v);
    };
    for (const k in L.t) copier(k);
    if (window.MutationObserver) {
      if (L.mo477) L.mo477.disconnect();
      L.mo477 = new MutationObserver(ms => ms.forEach(m => m.target.dataset.k && L.tx[m.target.dataset.k] && copier(m.target.dataset.k)));
      L.mo477.observe(L.tiles, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    // repères A–H / 1–6 recalés au bord du plateau incliné
    const ax = [],
      lab = (txt, x, y) => ax.push([txt, x.toFixed(1), y.toFixed(1)]);
    for (let r = 0; r < BH; r++) {
      // en portrait, les rangées se lisent au fond du plateau (au-dessus de la dernière colonne)
      const [x, y] = HC(K(VERT ? BW - 1 : 0, r)),
        s = tiltS(x, y);
      if (VERT) lab(r + 1, x, y - BG.S * s - 3);
      else lab(r + 1, x - BG.S * s - 5, y + 2.5);
    }
    for (let c = 0; c < BW; c++) {
      const [x, y] = HC(K(c, 0)),
        s = tiltS(x, y);
      if (VERT) lab('ABCDEFGH'[c], x - BG.S * s - 5, y + 2.5);
      else lab('ABCDEFGH'[c], x, y - BG.S * s - 3);
    }
    // lumière d'ensemble : brume vers l'horizon, teinte de lune la nuit (calques fixes, rien ne bouge)
    // découpe #cp477 : socles et cases ; tout est dessiné par les calques React du plateau
    const H = VB()[1],
      nuit = heureDe(B) === 'nuit',
      fondY = HC(VERT ? K(BW - 1, 0) : K(0, 0))[1] - BG.S;
    boardSet({ tex477, lip, ax, hz: [fondY.toFixed(1), (fondY + (H - fondY) * 0.55).toFixed(1)], night: nuit }, 'defs', 'tilt');
    L.h477 = heureDe(B);
    nuages();
    ambiance();
    eau();
  };
  const bbAvant = buildBoard;
  __set_buildBoard(function () {
    try {
      regler();
    } catch (e) {
      TILT.on = false;
    }
    const r = bbAvant.apply(this, arguments);
    try {
      // nouveau combat : la caméra se pose sur le plateau pendant que l'écran de transition s'efface
      if (B !== bbAvant.dernier) {
        bbAvant.dernier = B;
        if (TILT.on && anim429()) {
          bdRejouer('entree477');
          bdClass('entree477', true);
          clearTimeout(bbAvant.t);
          bbAvant.t = setTimeout(() => bdClass('entree477', false), 1800);
        }
      }
    } catch (e) {}
    try {
      habiller();
    } catch (e) {
      try {
        console.warn('Plateau v4.77 : habillage impossible.', e);
      } catch (e2) {}
    }
    return r;
  });

  /* ---------- animations : saut pendant un déplacement, poussière à l'atterrissage ---------- */
  const tempo = () => (PREF.fast || ui.turbo428 ? 0.6 : 1); // même règle que --tk429 (combat rapide)
  const sauter = (T, x, y, s) => {
    if (!anim429()) return;
    const ms = 850 * tempo();
    rejouer429(T, 'hop477', ms);
    if (typeof fxOn !== 'function' || !fxOn() || !fxPrep()) return;
    const px = FXS.ox + x * FXS.s,
      py = FXS.oy + (y + 9 * s) * FXS.s,
      R = 15 * s * FXS.s;
    fxAdd(
      420,
      (c, p) => {
        const e = 1 - Math.pow(1 - p, 3);
        c.globalAlpha = 0.45 * (1 - p);
        c.fillStyle = '#e9dcc0';
        for (let i = 0; i < 7; i++) {
          const a = (Math.PI * 2 * i) / 7 + 0.4;
          c.beginPath();
          c.ellipse(px + Math.cos(a) * R * (0.6 + e * 0.7), py + Math.sin(a) * R * 0.45 * (0.6 + e * 0.7), R * 0.22 * (1 - p * 0.5), R * 0.12 * (1 - p * 0.5), 0, 0, Math.PI * 2);
          c.fill();
        }
      },
      ms * 0.82
    );
  };
  /* onde de choc couchée sur le sol sous le Pokémon touché, poussière plus forte au K.O. */
  const pied = u => {
    const [x, y] = HC(uk(u)),
      s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
    return [FXS.ox + x * FXS.s, FXS.oy + (y + 9 * s) * FXS.s, s * FXS.s];
  };
  const onde = (u, col) => {
    if (!TILT.on || !anim429() || typeof fxOn !== 'function' || !fxOn() || !fxPrep()) return;
    const [px, py, k] = pied(u);
    fxAdd(520, (c, p) => {
      const e = 1 - Math.pow(1 - p, 3),
        r = k * (10 + 22 * e);
      c.globalAlpha = 0.75 * (1 - p);
      c.strokeStyle = col;
      c.lineWidth = k * 2.4 * (1 - p) + 0.5;
      c.beginPath();
      c.ellipse(px, py, r, r * 0.45, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.25 * (1 - p);
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(px, py, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
      c.fill();
    });
  };
  const hitAvant = hit;
  __set_hit(function (uid) {
    const r = hitAvant.apply(this, arguments);
    try {
      const u = byUid(B, uid);
      if (u) onde(u, u.side === 'e' ? '#ff6a5a' : '#7cc0ff');
    } catch (e) {}
    return r;
  });
  const chute = u => {
    if (!TILT.on || !anim429() || typeof fxOn !== 'function' || !fxOn() || !fxPrep()) return;
    const [px, py, k] = pied(u),
      bits = Array.from({ length: 14 }, (_, i) => [(Math.PI * 2 * i) / 14 + Math.random() * 0.4, 0.6 + Math.random() * 0.6]);
    fxAdd(
      700,
      (c, p) => {
        const e = 1 - Math.pow(1 - p, 2.4);
        c.fillStyle = '#d9c9a6';
        bits.forEach(([a, v]) => {
          const d = k * 26 * v * e;
          c.globalAlpha = 0.5 * (1 - p);
          c.beginPath();
          c.ellipse(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.45 - k * 6 * Math.sin(p * Math.PI) * v, k * 4 * (1 - p * 0.6), k * 2.4 * (1 - p * 0.6), 0, 0, Math.PI * 2);
          c.fill();
        });
      },
      250
    );
  };

  /* ombres de nuages qui glissent sur le plateau, de jour (calque à part : seule la carte graphique travaille) */
  // .cs477 : rendu par React (Board.jsx)
  const nuages = () => {
    const on = !(!TILT.on || RM || heureDe(B) === 'nuit');
    if (getHost().cs477 !== on) hostSet({ cs477: on });
  };

  /* vie dans l'air : pollen ou poussière de jour, lucioles la nuit (transform et opacité seulement) */
  const AMB = {
    jour: { gue: '#fff1b8', roche: '#f2d7a6', tour: '#e2c8ff', ligue: '#ffe28a' },
    nuit: { gue: '#d8ff7a', roche: '#ffc27a', tour: '#c79bff', ligue: '#cfe0ff' }
  };
  // .amb477 : rendu par React (Board.jsx), recréé quand l'heure ou le lieu change (clé)
  const ambiance = () => {
    const n = getHost().amb477;
    const h = heureDe(B),
      l = lieu(),
      cle = h + '-' + l;
    if (!TILT.on || !anim429()) {
      if (n) hostSet({ amb477: null });
      return;
    }
    if (n && n.k === cle) return;
    const N = h === 'nuit' ? 12 : 16;
    const items = [];
    for (let i = 0; i < N; i++) {
      const r = (k => ((Math.sin(i * 127.1 + k * 311.7) * 43758.5453) % 1 + 1) % 1);
      items.push({
        left: (4 + r(1) * 92).toFixed(1) + '%',
        top: (14 + r(2) * 76).toFixed(1) + '%',
        '--dx': ((r(3) - 0.5) * 70).toFixed(0) + 'px',
        '--dy': (-18 - r(4) * 40).toFixed(0) + 'px',
        '--s': (0.6 + r(5) * 0.9).toFixed(2),
        animationDuration: (7 + r(6) * 8).toFixed(1) + 's',
        animationDelay: '-' + (r(7) * 15).toFixed(1) + 's'
      });
    }
    hostSet({ amb477: { k: cle, h, c: (AMB[h] || AMB.jour)[l] || AMB[h === 'nuit' ? 'nuit' : 'jour'].gue, items } });
  };

  /* reflet sur l'eau : une bande de lumière glisse sur les cases d'eau, des éclats scintillent ;
     suit la marée de l'Arène Eau (resynchronisé à chaque rendu du plateau) */
  // calque .eau477, dégradé #eau477g et découpe #eau477c : dessinés par React (état « eau ») ;
  // couleur (lune ou soleil) et animation fixées à la création, recréés au changement d'heure (neuf)
  const eau = neuf => {
    if (!TILT.on || !L.tiles || !B) return;
    const E = getBoard().eau,
      cles = Object.keys(B.tiles).filter(k => B.tiles[k].w && !B.tiles[k].rock),
      id = cles.join(',');
    if (E && !neuf) {
      if (E.id !== id) boardSet({ eau: { ...E, id, cles } }, 'defs', 'eau');
      return;
    }
    boardSet({ eau: { id, cles, nuit: heureDe(B) === 'nuit', fixe: !anim429() } }, 'defs', 'eau');
  };
  const rbAvant477 = renderBoard;
  __set_renderBoard(function () {
    const r = rbAvant477.apply(this, arguments);
    try {
      if (TILT.on && L.h477 && L.h477 !== heureDe(B)) changerHeure();
      eau();
    } catch (e) {}
    return r;
  });

  /* les Pokémon du fond passent derrière ceux de devant */
  // ordre des jetons : L.uo, rendu par Units.jsx (les jetons triés passent à la fin, comme appendChild)
  function trier() {
    if (!TILT.on || !L.units || !L.uo) return;
    const y = id => L.u[id] && L.u[id].y477,
      toks = L.uo.filter(id => y(id) != null),
      tri = toks.slice().sort((a, b) => y(a) - y(b));
    if (tri.every((n, i) => n === toks[i])) return;
    L.uo = L.uo.filter(id => y(id) == null).concat(tri);
    unitsDirty();
  }

  /* ---------- jetons : debout, plus petits au fond ---------- */
  const utAvant = updTokCore;
  __set_updTokCore(function (u) {
    const r = utAvant.apply(this, arguments);
    try {
      const T = TILT.on && L.u[u.uid];
      if (T) {
        const k = uk(u),
          [x, y] = HC(k),
          s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
        T.tr = `translate(${x}px,${y}px) scale(${s.toFixed(3)})`; // jeton : Units.jsx (glissement : transition CSS)
        unitsDirty();
        if (T.k477 && T.k477 !== k && !u.ko) sauter(T, x, y, s);
        T.k477 = k;
        if (u.ko && T.ko477 === false) chute(u);
        T.ko477 = !!u.ko;
        T.y477 = y;
        clearTimeout(trier.t);
        trier.t = setTimeout(trier, 950 * tempo()); // après le glissement : réinsérer coupe la transition
      }
    } catch (e) {}
    return r;
  });

  /* noms au-dessus de tous les Pokémon : un grand Pokémon devant ne cache plus le nom de celui de derrière */
  const nomHaut = T => {
    // calque .nms477 (React) : le nom passe dans son enveloppe .nmw477, qui suit les classes et la
    // position du jeton (NomsHauts, Units.jsx) ; nmO : ordre de passage
    if (!L.fl || !L.nm477 || !L.nm477.isConnected) return;
    if (!T.nmO) {
      T.nmO = nomHaut.n = (nomHaut.n || 0) + 1;
      unitsDirty();
    }
  };
  const utAvant2 = updTokCore;
  __set_updTokCore(function (u) {
    const r = utAvant2.apply(this, arguments);
    try {
      const T = TILT.on && L.u[u.uid];
      if (T) nomHaut(T);
    } catch (e) {}
    return r;
  });

  /* effets d'attaque à l'échelle de la profondeur (cible au fond = effet plus petit) */
  const prof = k => {
    if (!TILT.on || k == null) return 1;
    const [x, y] = HC(k);
    return Math.max(0.6, Math.min(1.4, tiltS(x, y)));
  };
  const avecProf = (k, f, haut) => {
    const oy = FXS.oy;
    FXS.zk = prof(k);
    // les tirs partent du corps du Pokémon debout, pas de l'anneau au sol (positions figées à l'appel)
    if (TILT.on && haut) FXS.oy = oy - 10 * FXS.zk * FXS.s;
    try {
      return f();
    } finally {
      FXS.zk = 1;
      FXS.oy = oy;
    }
  };
  const faAvant = fxAttack;
  __set_fxAttack(function (e, dur) {
    const sol = !e || e.st || e.sh === 'self' || e.sh === 'area' || e.sh === 'ring' || e.sh === 'cone' || e.from === e.k || FXK[e.t] === 'quake';
    return avecProf(e && (e.k != null ? e.k : e.from), () => faAvant.apply(this, [e, dur]), !sol);
  });
  const fgAvant = fxGuard;
  __set_fxGuard(function (e, dur) {
    let k = null;
    try {
      const g = byUid(B, e.u);
      if (g) k = uk(g);
    } catch (x) {}
    return avecProf(k, () => fgAvant.apply(this, [e, dur]));
  });

  /* illustration plus grande, pieds posés sur l'anneau au sol (attributs : la transformation sert déjà au miroir et au rebond) */
  const GEO = { plat: ['-17', '-22', '34'], debout: ['-23', '-35', '46'] };
  const taAvant = tokenArt;
  __set_tokenArt(function (u) {
    const r = taAvant.apply(this, arguments);
    try {
      const T = L.u && L.u[u.uid];
      // modèle du jeton, rendu par Units.jsx
      if (T && T.imOn && !T.w477 && T.b) {
        // l'illustration seule respire et saute (groupe .tok-st477) : l'anneau reste posé au sol
        T.w477 = true;
        unitsDirty();
      }
      if (T && T.imOn) {
        const g = GEO[TILT.on ? 'debout' : 'plat'];
        if (T.geo[1] !== g[1]) {
          T.geo = g;
          unitsDirty();
        }
      }
    } catch (e) {}
    return r;
  });

  /* ---------- styles ---------- */
  const css = document.createElement('style');
  css.id = 'resonance-v477-graphismes';
  css.textContent = `
html body #combat #bBoard.tilt477{background-color:#0b1520!important;background-image:linear-gradient(180deg,rgba(6,12,20,0) 30%,rgba(6,12,20,.25) 70%,rgba(6,12,20,.55)),var(--bg477),var(--resonance-landscape)!important;background-size:cover!important;background-position:center 34%!important;background-repeat:no-repeat!important}
#bBoard.tilt477 #bSvg{filter:drop-shadow(0 10px 14px rgba(0,0,0,.45))!important}
#bBoard.tilt477 #bSvg image.pv471,#bBoard.tilt477 #bSvg .wv471{display:none!important}
html body #bBoard.tilt477 #bSvg .tex471{display:inline!important}
html body #bBoard.tilt477 #bSvg .tx{opacity:1!important}
html body #bBoard.tilt477 #bSvg .hx{fill:#22301c!important;stroke:rgba(20,14,6,.55)!important;stroke-width:.9!important}
html body #bBoard.tilt477 #bSvg .hx.wet{fill:#2b5c96!important}
#bBoard.tilt477 #bSvg .bv{stroke:url(#bev);stroke-width:1.4;opacity:.9}
html body #bBoard.tilt477 #bSvg .tx.wet{opacity:.5!important}
html body #bBoard.tilt477 #bSvg .tx.dep430z{opacity:.45!important}
html body #bBoard.tilt477 #bSvg .tx.mud,html body #bBoard.tilt477 #bSvg .tx.lava{opacity:.35!important}
html body #bBoard.tilt477.has-mud477 #bSvg .tx.mud{fill:url(#tx-mud);opacity:1!important}
html body #bBoard.tilt477.has-lava477 #bSvg .tx.lava{fill:url(#tx-lava);opacity:1!important}
#bBoard.tilt477 #bSvg .tx.fog431t{filter:brightness(.42) saturate(.5)}
#bBoard.tilt477 #bSvg .gl{stroke:rgba(255,248,220,.10)}
#bBoard.tilt477 #bSvg .deco471,#bBoard.tilt477 #bSvg .tuft,#bBoard.tilt477 #bSvg .pebble,#bBoard.tilt477 #bSvg .field{display:none}
#bBoard.tilt477 .lip477 polygon{fill:#2a1d12;stroke:rgba(0,0,0,.35);stroke-width:.6}
/* jetons debout : anneaux couchés sur le sol, l'illustration se tient dessus */
#bBoard.tilt477 #bSvg .tok .tok-rdy,#bBoard.tilt477 #bSvg .tok .tok-halo,#bBoard.tilt477 #bSvg .tok .hp-bg,#bBoard.tilt477 #bSvg .tok .tok-ring,#bBoard.tilt477 #bSvg .tok .tok-rim{transform:translateY(8px) scale(1.12,.52)}
#bBoard.tilt477 #bSvg .tok .hp-arc{transform:translateY(8px) scale(1.12,.52) rotate(-90deg)}
#bBoard.tilt477 #bSvg .tok .tok-ring{fill-opacity:.38}
#bBoard.tilt477 #bSvg .tok .tok-sh{transform:translateY(-5px) scale(1.25,1.4);opacity:.85}
#bBoard.tilt477 #bSvg .tok.has-im .tok-gloss,#bBoard.tilt477 #bSvg .tok.has-im .tok-b>path{display:none}
#bBoard.tilt477 #bSvg .tok .bdg-s{transform:translate(0,-40px) rotate(-7deg)}
#bBoard.tilt477 #bSvg .tok .tok-ew{transform:translate(19px,-28px)}
#bSvg .nmw477{transition:transform .85s var(--ease),opacity .6s ease}
#bSvg .nmw477.ko{opacity:0;transition:opacity .6s ease .3s}
#bSvg .nmw477.hid,#bSvg .nmw477.pk-wait{opacity:0}
html body #bSvg .nmw477.fog431{opacity:0!important;transition:opacity .3s}
html body #bSvg .nmw477.enemy .tok-nm{fill:#ff9ba0!important}
html body #bSvg .nmw477.ally .tok-nm{fill:#a9d0ff!important}
#bBoard.tilt477 #bSvg .tok .tok-im{filter:drop-shadow(0 1.5px 1.2px rgba(0,0,0,.45))}
#bBoard.tilt477 .lum477 .nuit477{fill:#2a3a78;mix-blend-mode:multiply;opacity:0;transition:opacity 1.8s ease}
#bBoard.tilt477 .lum477.n .nuit477{opacity:.55}
#bBoard.tilt477{isolation:isolate}
#bBoard.tilt477 .fondu477{position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;background-size:cover;background-position:center 34%;background-repeat:no-repeat;transition:opacity 1.8s ease}
#bBoard.tilt477 .fondu477.va{opacity:0}
/* animations des Pokémon debout */
#bBoard.tilt477 #bSvg .tok:not(.lunge429):not(.hurt429):not(.ko) .tok-b{animation:none}
#bBoard.tilt477 #bSvg .tok-st477{transform-origin:0 11px;animation:vie477 3.4s ease-in-out infinite}
@keyframes vie477{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-1.4px) scale(.985,1.03)}}
#bBoard.tilt477 #bSvg .tok.hop477 .tok-st477{animation:hop477 calc(.85s * var(--tk429,1)) cubic-bezier(.3,.6,.4,1) 1}
@keyframes hop477{0%{transform:translateY(0) scale(1,1)}12%{transform:translateY(1px) scale(1.08,.9)}45%{transform:translateY(-11px) scale(.96,1.06)}82%{transform:translateY(0) scale(1.06,.92)}100%{transform:translateY(0) scale(1,1)}}
#bBoard.tilt477 #bSvg .tok.ko .tok-st477{animation:none;opacity:.55;transform:translateY(5px) scale(1,.8);transition:transform .6s ease-in,opacity .6s}
.calme429 #bBoard.tilt477 #bSvg .tok-st477{animation:none!important}
#bBoard .cs477{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;border-radius:inherit;mix-blend-mode:multiply}
#bBoard .cs477 i{position:absolute;width:70%;height:38%;border-radius:50%;background:radial-gradient(closest-side,rgba(40,48,70,.32),rgba(40,48,70,0));will-change:transform;animation:nuage477 46s linear infinite}
#bBoard .cs477 i+i{width:55%;height:30%;top:48%;animation-duration:61s;animation-delay:-30s}
#bBoard .cs477 i:first-child{top:22%}
#bBoard.tilt477 .eau477 .bande477{animation:bande477 4.5s linear infinite}
#bBoard.tilt477 .eau477.fixe .bande477{animation:none}
@keyframes bande477{to{transform:translate(var(--dx),var(--dy))}}
#bBoard.tilt477 .eau477 .gl477{fill:#f4fbff;opacity:0;transform-box:fill-box;transform-origin:center;animation:gl477 3s ease-in-out infinite}
#bBoard.tilt477 .eau477.fixe .gl477{animation:none;opacity:.35}
@keyframes gl477{0%{opacity:0;transform:scaleX(.3)}50%{opacity:1;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1.25)}}
#bBoard .amb477{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;border-radius:inherit}
#bBoard .amb477 i{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--c);box-shadow:0 0 6px 1.5px var(--c);opacity:0;will-change:transform,opacity;animation:amb477 10s ease-in-out infinite}
#bBoard .amb477.nuit i{width:4.5px;height:4.5px;box-shadow:0 0 10px 3px var(--c);animation-name:luciole477}
@keyframes amb477{0%{opacity:0;transform:translate(0,0) scale(var(--s))}25%{opacity:.9}75%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(var(--s))}}
@keyframes luciole477{0%{opacity:0;transform:translate(0,0) scale(var(--s))}20%{opacity:.95}35%{opacity:.25}50%{opacity:.9;transform:translate(calc(var(--dx)*.6),calc(var(--dy)*-.3)) scale(var(--s))}70%{opacity:.2}85%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy)*.4)) scale(var(--s))}}
@keyframes nuage477{from{transform:translateX(-80%)}to{transform:translateX(190%)}}
html body #bBoard.tilt477.entree477 #bSvg{animation:entree477 1s cubic-bezier(.2,.7,.2,1) .6s backwards;filter:none!important;will-change:transform,opacity}
@keyframes entree477{from{transform:perspective(900px) rotateX(24deg) translateY(-18px) scale(.9);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){#bBoard.tilt477 #bSvg .tok-st477,#bBoard .cs477 i{animation:none!important}#bBoard .amb477{display:none}#bBoard.tilt477 .eau477 .gl477{animation:none;opacity:.35}#bBoard.tilt477 .eau477 .bande477{animation:none}}
#bBoard.tilt477.bio-roche .lip477 polygon{fill:#4a2e18}
#bBoard.tilt477.bio-ligue .lip477 polygon,#bBoard.tilt477.bio-arene .lip477 polygon{fill:#8c7a5e}
#bBoard.tilt477.bio-tour .lip477 polygon{fill:#2a2236}
`;
  document.head.appendChild(css);

  /* ---------- Paramètres › Habillage Pokémon : Graphismes Riche / Léger ---------- */
  // bouton « Graphismes » de « Habillage Pokémon » : rendu par React (src/screens/settings/panels/HabillagePokemon.jsx)
  document.addEventListener('click', e => {
    if (!(e.target.closest && e.target.closest('[data-pk477]'))) return;
    PREF.gfx477 = PREF.gfx477 === 'leger' ? 'riche' : 'leger';
    savePref();
    renderParams();
    rebatir();
  });
  window.__gfx477 = { TILT, OK, riche, rebatir };
})();


/* ==== v4.78 : déroulé guidé du tour ====
   Chaque Pokémon suit Déplacer → Agir → Terminer. Chaque étape se saute d'un toucher
   explicite (« Rester ici », « Passer l'action », « Terminer ») ; la manche se termine
   seule quand tous ont fini : plus de « Fin du tour » à presser pendant votre phase.
   u.rst478 / u.fin478 : numéro de manche où le Pokémon est resté sur place / a fini. */
(() => {
  const actif = () => !!(B && !B.over && B.phase === 'player' && !B.dep430 && !ui.cine);
  // énigme : « Fin du tour » reste visible, c'est le bouton pour abandonner
  const guide = () => actif() && !ui.busy && B.sc !== 'enigme431';
  /** Les Pokémon que le joueur actif commande en ce moment. */
  function aJouer(S) {
    if (S.ordre === 'vitesse') {
      const c = acteurCourant(S);
      return c && c.side === 'a' ? [c] : [];
    }
    return S.units.filter(u => u.side === 'a' && !u.ko && (!S.coop || joueur418(u) === S.coop));
  }
  const repli = u => !!(u.hr && !u.moved);
  const relance = S => S.voix >= 2 && !S.relance;
  /** deplacer | agir | extra | fini */
  function etape(S, u) {
    if (!u || u.ko || u.sn || u.fin478 === S.round) return 'fini';
    if (!u.acted) return u.moved || u.rst478 === S.round ? 'agir' : 'deplacer';
    return repli(u) || relance(S) ? 'extra' : 'fini';
  }
  const restants = S => aJouer(S).filter(u => etape(S, u) !== 'fini');
  // panneau (étape en cours et bouton pour passer) et barre du bas : rendus par React (Panel.jsx, Foot.jsx)
  flow478 = { actif, guide, aJouer, repli, relance, etape, restants };

  /* ---------- boutons « Rester ici », « Passer l'action », « Terminer » ---------- */
  $('#bPanel').addEventListener('click', e => {
    const b = e.target.closest('[data-vx$="478"]');
    if (!b || !B || ui.busy || B.over) return;
    const u = ui.sel && byUid(B, ui.sel);
    if (!u || u.ko) return;
    if (b.dataset.vx === 'rester478') u.rst478 = B.round;
    else {
      u.fin478 = B.round;
      ui.undo = null; // le choix est fait : on ne revient plus sur le déplacement
    }
    clearAim();
    ui.tile = null;
    sfx('ui');
    renderAll();
  });

  /* ---------- Relance : le Pokémon repart de l'étape Déplacer ---------- */
  const relOld478 = pRelance;
  __set_pRelance(function (S, u) {
    const r = relOld478.apply(this, arguments);
    if (r && u) u.rst478 = 0;
    return r;
  });

  /* ---------- après une attaque : rester sur le Pokémon s'il lui reste un bonus ---------- */
  const caOld478 = confirmAct;
  __set_confirmAct(function () {
    const id = ui.sel,
      r = caOld478.apply(this, arguments);
    const u = B && byUid(B, id);
    if (u && actif() && !ui.busy && B.ordre !== 'vitesse' && etape(B, u) === 'extra' && ui.sel !== id) {
      ui.sel = id;
      renderAll();
    }
    return r;
  });

  /* ---------- au suivant : quand le Pokémon suivi a fini, on passe au prochain ---------- */
  function suivant478() {
    if (!actif() || ui.busy) {
      ui.fl478 = null;
      return;
    }
    if (ui.selE || ui.mode) return;
    const u = ui.sel && byUid(B, ui.sel),
      rest = restants(B);
    if (!rest.length) return;
    if (!u || u.ko || (etape(B, u) === 'fini' && ui.fl478 === u.uid)) {
      const L = aJouer(B),
        i = u ? L.indexOf(u) : -1;
      const nx = rest.find(x => L.indexOf(x) > i) || rest[0];
      ui.sel = nx.uid;
      clearAim();
    }
    const s = ui.sel && byUid(B, ui.sel);
    if (s && etape(B, s) !== 'fini') ui.fl478 = s.uid;
  }

  /* ---------- fin de manche automatique ---------- */
  let T478 = 0;
  const cle478 = () =>
    B ? [B.round, B.coop || 0, B.duel433 ? B.duel433.j : 0, B.ordre === 'vitesse' ? (acteurCourant(B) || {}).uid : ''].join(':') : '';
  const pret478 = () =>
    actif() &&
    !ui.busy &&
    !ui.mode &&
    !restants(B).length &&
    $('#evoPick').hidden &&
    (B.ordre !== 'vitesse' || ((acteurCourant(B) || {}).side === 'a'));
  function planifier478() {
    if (T478 || !pret478()) return;
    const S = B,
      k = cle478();
    T478 = setTimeout(() => {
      T478 = 0;
      if (B !== S || cle478() !== k || !pret478()) return;
      if (!B.coop && !B.duel433 && B.ordre !== 'vitesse' && B.sc !== 'enigme431') toast('Manche terminée : au tour des adversaires.');
      // par le bouton : les modes qui l'interceptent (énigme…) gardent leur règle. Clic sans
      // remontée : sinon l'écouteur « Passer » du document accélérerait aussitôt le tour adverse.
      $('#bEnd').dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    }, dl428(250, 500, 900));
  }

  /* ---------- barre du bas : plus de « Fin du tour » pendant votre phase ---------- */
  // la barre (bouton masqué, étape du Pokémon sur téléphone, phase) est calculée par Foot.jsx
  const pied478 = () => refreshBattle('foot');

  /* ---------- clavier : Espace (ou E) passe l'étape au lieu de finir le tour ---------- */
  window.addEventListener(
    'keydown',
    e => {
      if ((e.key !== ' ' && e.key !== 'e' && e.key !== 'E') || !B || !guide()) return;
      const cb = document.getElementById('cbBattle'),
        tg = e.target;
      if (!cb || cb.hidden || (tg && /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) || (tg && tg.isContentEditable)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const b = document.querySelector('#bPanel .fl478 [data-vx]');
      if (b) b.click();
    },
    true
  );

  const raOld478 = renderAll;
  __set_renderAll(function () {
    try {
      if (B) suivant478();
    } catch (e) {}
    const r = raOld478.apply(this, arguments);
    try {
      if (B) {
        pied478();
        planifier478();
      }
    } catch (e) {}
    return r;
  });

  /* ---------- textes du tutoriel et du guide ---------- */
  try {
    TUTO.forEach(s => {
      if (s.sel !== '#bEnd') return;
      s.t = 'Fin de manche';
      s.d = 'Chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tous ont joué, la manche se termine seule : les adversaires se déplacent, puis attaquent.';
      s.sel = '#bPanel';
    });
    const t0 = TUTO433.find(x => x.k === 'tour');
    if (t0)
      t0.d = t0.d.replace(
        'Quand tout le monde a joué, « Fin du tour » : les adversaires agissent à leur tour.',
        'Le panneau vous guide : chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tout le monde a joué, la manche se termine seule et les adversaires agissent.'
      );
    NEWS416.unshift(['i-play', 'Tour guidé', 'En combat, le panneau vous guide pour chaque Pokémon : déplacer, agir, terminer. La manche se termine seule quand tout le monde a joué.', null]);
    NEWS416.splice(8);
  } catch (e) {}

  window.__flow478 = { etape, restants, aJouer, jeu: () => ({ B, ui }) };
})();
}
