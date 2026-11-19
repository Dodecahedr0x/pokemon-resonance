/* Original section: 20-campaign-tutorial-sound.js */
import { bdClass } from '../screens/combat/board/boardStore.js';

import { EL, GYMS, MX, RX } from './004-data.js';
import { MV } from './005-moves.js';
import { BY, SCEN } from './009-pokemon.js';
import { BADGE_REWARD, CAMP_START, ITEMS2, LINK_N, PROFILE, defProfile, isCamp, lvlOfPts } from './011-game-state.js';
import { ROLEFX, rIco } from './012-recruits-roles-synergies.js';
import { ARENAS, BADGES, winBadge } from './013-gyms.js';
import { $, $$, RM, writeLS, markOf, medal, rxCat, toast } from './014-utils.js';
import { go } from './016-navigation.js';
import { getCoach, hideCoach, hideStarter, openStarterBox, refreshStarter, showCoach } from '../screens/overlays/shellOverlays.js';
import { renderLeague } from './019-league.js';
import { renderSquad, squad } from './020-team-cards.js';
import { P, byUid, hdist, markAt } from './021-combat-engine.js';
import { ELITE, canCapture, canDuo, captureReq, champBuild, duoOf, linkLvl } from './022-items-bonds-ai.js';
import { roleOf } from './023-roles-synergies-obstacles.js';
import { B, __set_scSel, challenge, launch, scSel, ui } from './024-combat-ui.js';
import { SAVE_V, applySave, autoSave, closeSaves, queueSave, renderSummary } from './025-saves.js';
import { musStart, musStop, sfxJingle } from './070-theme-music-player.js';
import { renderSelection } from './031-home-journey.js';
import { renderHome } from './036-home.js';
import { CAP_K, SHOP, __set_CAP_K, ballChips, ballFor, dailyDone, dailyKey, fmt, today } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { itemize, preload } from './041-illustrations.js';
import { RIVAL, RIVAL_KEYS, aplusProgress, aplusRewHtml, rivalBuild } from './043-adventure-plus.js';
import { trapTip } from './047-tactics.js';
import { jNext416 } from './055-living-johto.js';
import { hNext419 } from './059-hoenn.js';
import { confirm430 } from './065-camp-tactics.js';

export let PREF, SFX, PREPG, TUTORIAL_STEPS;
let AC, tutorialI;
export function __set_PREPG(v) { return (PREPG = v); }
export function __set_tutorialI(v) { return (tutorialI = v); }

// Pokémon-style reduced animations (v4.72): system preference, accessibility setting or
// theme animations turned off. Same test as the local copies in modules 108 and 109.
export const calm472 = () => !!RM || document.documentElement.classList.contains('a11y-rm') || PREF.pk472a === 0;


export function savePref() {
  writeLS('res-pref', PREF);
  if (PREF.music) musStart();
  else musStop();
}


function ac() {
  if (!PREF.sound) return null;
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) {
    return null;
  }
}


export function tone(f, t0, dur, type, flying, f2) {
  const a = ac(),
    v = (flying || 0.08) * PREF.sfxVol; // adjustable effects volume (0 = muted)
  if (!a || !(v > 0)) return;
  const o = a.createOscillator(),
    g = a.createGain(),
    t = a.currentTime + t0;
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}


export function noise(t0, dur, flying, lp) {
  const a = ac(),
    v = (flying || 0.12) * PREF.sfxVol;
  if (!a || !(v > 0)) return;
  const n = Math.floor(a.sampleRate * dur),
    buf = a.createBuffer(1, n, a.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(),
    f = a.createBiquadFilter(),
    g = a.createGain(),
    t = a.currentTime + t0;
  s.buffer = buf;
  f.type = 'lowpass';
  f.frequency.value = lp || 900;
  g.gain.value = v;
  s.connect(f);
  f.connect(g);
  g.connect(a.destination);
  s.start(t);
}


export function sfx(n) {
  if (PREF.sound && !RM) {
    try {
      SFX[n] && SFX[n]();
    } catch { /* Best effort: failure here is non-fatal. */ }
  }
  sfxJingle(n);
}


export function vibe(p) {
  if (PREF.vibe && navigator.vibrate) {
    try {
      navigator.vibrate(p);
    } catch { /* Best effort: failure here is non-fatal. */ }
  }
}


export function sfxEv(ev) {
  if (!PREF.sound && !PREF.vibe) return;
  let h = 0,
    k = 0,
    r = 0,
    c = 0,
    d = 0,
    al = false;
  ev.forEach(e => {
    if (e.e === 'dmg') {
      h++;
      const u = B && byUid(B, e.u);
      if (u && u.side === 'a') al = true;
    } else if (e.e === 'ko') k++;
    else if (e.e === 'rx') r++;
    else if (e.e === 'catch') c++;
    else if (e.e === 'duo') d++;
  });
  if (d) sfx('duo');
  else if (c) sfx('catch');
  else if (k) sfx('ko');
  else if (r) sfx('rx');
  else if (h) sfx('hit');
  if (k) vibe([40, 30, 40]);
  else if (al) vibe(25);
}


/* ---- cell info, items, fatigue, Bonds, capture, duos in the panel ---- */
export function tileTip(k) {
  const t = B.tiles[k],
    o = [];
  if (t.pil) {
    return 'Pilier : infranchissable, bloque les tirs directs (cible unique et ligne). Couverture −40 % pour qui se tient derrière.';
  }
  if (t.rock) {
    o.push(
      'Rocher : infranchissable, couverture −40 % contre les tirs à distance, une capacité à cible unique peut y ricocher'
    );
  }
  if (t.w) o.push('Eau : compte comme Trempé');
  if (t.mark) {
    const m = markOf(t.mark.k);
    o.push(
      `${m.n}${t.mark.d < 90 ? ` : encore ${t.mark.d} manche${t.mark.d > 1 ? 's' : ''}` : ''}${t.mark.lv === 2 ? ' · renforcé ×1,25' : ''}`
    );
  }
  if (t.mud > 0) o.push(`Boue : déplacement ×3, ${t.mud} manche${t.mud > 1 ? 's' : ''}`);
  if (t.lava > 0) o.push(`Lave : brûle ce qui s’y arrête, ${t.lava} manche${t.lava > 1 ? 's' : ''}`);
  if (t.fog > 0) {
    o.push(t.fog > 2 ? 'Brume toxique : on ne vise pas à distance' : 'Brouillard : on ne vise pas à distance');
  }
  if (t.trap) o.push(trapTip(t.trap)); // traps (v4.8)
  if (t.grass) o.push('Hautes herbes : un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase');
  if (t.sand && !t.w) {
    o.push('Sable : 2 Mouvements pour y entrer, sauf Sol, Roche, Acier et volants, qui y subissent −2 dégâts');
  }
  return o.length ? o.join(' · ') : 'Case libre';
}


export function tileCard() {
  if (!B || ui.tile == null) return '';
  const k = ui.tile,
    t = B.tiles[k];
  if (!t) return '';
  const [c, r] = P(k),
    mk = t.mark ? markAt(B, k) : t.w ? 'trempe' : null;
  let rx = '';
  if (mk) {
    const row = MX[mk];
    rx = EL.map((e, i) =>
      row[i] && row[i] !== 'ren' ? `<span class="chip cat-${rxCat(row[i])}"><i></i>${e} → ${RX[row[i]].n}</span>` : ''
    ).join('');
  }
  return `<div class="tile-i"><div class="ti-h"><b>Case ${'ABCDEFGH'[c]}${r + 1}</b><button type="button" class="b b-sm b-ghost" data-tile="x">Fermer</button></div><p>${tileTip(k)}</p>${rx ? `<div class="ti-rx">${rx}</div>` : ''}</div>`;
}


export function unitExtras(u) {
  const o = [];
  if (ui.undo && ui.undo.uid === u.uid && u.moved && !u.acted) {
    o.push(`<button type="button" class="b b-sm" data-undo="1">Annuler le déplacement</button>`);
  }
  if (u.item) {
    o.push(
      `<span class="ux it" title="${ITEMS2[u.item].d}"><svg viewBox="0 0 24 24"><path d="${ITEMS2[u.item].i}"/></svg>${ITEMS2[u.item].n}${u.item === 'ceinture' && !u.belt ? ' · utilisée' : ''}</span>`
    );
  }
  if (u.fat) o.push(`<span class="ux fa">Fatigué · −1 Mouvement</span>`);
  const mates = B.units.filter(x => x !== u && !x.ko && x.side === 'a' && linkLvl(B, u.sp, x.sp) > 0);
  mates.forEach(x => {
    const l = linkLvl(B, u.sp, x.sp),
      adj = hdist(x.pos, u.pos) === 1;
    o.push(
      `<span class="ux lk${adj && l >= 1 ? ' on' : ''}" title="Soutien : −1 dégât côte à côte. Synchro : +25 % sur les réactions préparées l’un pour l’autre. Duo : technique combinée.">Lien ${LINK_N[l]} · ${BY[x.sp].n}${adj ? ' · côte à côte' : ''}</span>`
    );
  });
  const role = roleOf(u),
    RF = ROLEFX[role],
    head = RF
      ? `<p class="bp-role">${rIco(role)}<span><b>${role} · ${RF.k}.</b> ${RF.d.replace(/^[^:]+ : /, '')}</span></p>`
      : '',
    hr =
      u.hr && u.acted && !u.moved
        ? `<p class="bp-hint hr">Frappe et repli : touchez une case bleue pour vous replier.</p>`
        : '';
  return head + hr + (o.length ? `<div class="bp-ux">${o.join('')}</div>` : '');
}


export function duoBlock(u) {
  if (!B || u.acted) return '';
  const L2 = B.units.filter(p => p !== u && p.side === 'a' && !p.ko && duoOf(B, u, p));
  if (!L2.length) return '';
  return `<div class="bp-duo">${L2.map(p => {
    const D = duoOf(B, u, p),
      ok = canDuo(B, u, p),
      why = p.acted
        ? `${p.n} a déjà agi`
        : hdist(u.pos, p.pos) > 2
          ? `${p.n} est trop loin (2 cases max)`
          : B.voix < 2
            ? 'il faut 2 Voix'
            : '';
    return `<button type="button" class="duo-b${ui.mode === 'duo' && ui.duo === p.uid ? ' on' : ''}" data-duo="${p.uid}" ${ok ? '' : 'disabled'}><span class="duo-m">${medal(u.t, 'sm')}${medal(p.t, 'sm')}</span><span><b>${D.n}</b><em>${ok ? D.d + ' 2 Voix, les deux agissent.' : why}</em></span></button>`;
  }).join('')}</div>`;
}


export function catchBlock(e) {
  if (B.noCatch) return '';
  __set_CAP_K(ballFor(e)); // the Ball offered by default
  const al = ui.sel && byUid(B, ui.sel),
    req = captureReq(B, al, e),
    ok = al && canCapture(B, al, e);
  return `<div class="bp-cap"><div class="cap-h"><b>Capture</b><span>${al ? `avec ${al.n}` : 'sélectionnez un allié'}</span></div>${ballChips()}<ul>${req
    .slice(1)
    .map(r => `<li class="${r.ok ? 'ok' : ''}">${r.t}</li>`)
    .join(
      ''
    )}</ul><button type="button" class="b b-sm ${ok ? 'b-gold' : ''}" data-cap="${e.uid}" ${ok ? '' : 'disabled'}>${SHOP[CAP_K].n} sur ${e.n}</button>${B.stats.caught.length ? '' : '<p class="bp-hint">Un Pokémon K.O. ne peut plus être capturé.</p>'}</div>`;
}


/* ---- end-of-battle progression ---- */
export function applyProgress(S) {
  const e0 = PROFILE.elite,
    forms0 = [...(PROFILE.forms || [])],
    D = SCEN[S.sc] || {},
    win = S.over === 'win',
    rew = { links: [], caught: [], items: [], gifts: [], tired: [], badgeNew: false };
  if (D.tuto) PROFILE.tuto = 1;
  const al = S.units.filter(u => u.side === 'a');
  Object.entries(D.pret429 ? {} : S.stats.pairs || {}).forEach(([k, v]) => { // rental team: no Bonds (v4.29)
    const [a, b] = k.split('|'),
      ua = al.find(u => u.sp === a),
      ub = al.find(u => u.sp === b),
      x2 = ua && ub && !ua.evolved && !ub.evolved,
      pts = v * (x2 ? 2 : 1),
      before = lvlOfPts(PROFILE.links[k] || 0);
    PROFILE.links[k] = (PROFILE.links[k] || 0) + pts;
    rew.links.push({ a, b, pts, x2, from: before, to: lvlOfPts(PROFILE.links[k]) });
  });
  (S.stats.caught || []).forEach(id => {
    const base = BY[id].base;
    PROFILE.caught++;
    if (!PROFILE.dex.includes(base)) PROFILE.dex.push(base);
    const nw = !PROFILE.box.includes(base); // Free mode too (v4.21)
    if (nw) PROFILE.box.push(base);
    rew.caught.push({ id, base, nw });
  });
  if (win && D.gym != null) {
    rew.badgeNew = winBadge(D.gym);
    if (rew.badgeNew) {
      const R = BADGE_REWARD[D.gym];
      if (isCamp() && R.item && !PROFILE.items.includes(R.item)) {
        PROFILE.items.push(R.item);
        rew.items.push(R.item);
      }
      const g = R.gift.find(id => !PROFILE.box.includes(id));
      if (g) {
        PROFILE.box.push(g);
        rew.gifts.push(g);
      }
    }
  }
  if (win && D.elite) {
    PROFILE.elite = Math.max(PROFILE.elite, D.elite);
    rew.elite = D.elite;
  }
  if (win && D.champ) {
    PROFILE.elite = 5;
    rew.champ = true;
  }
  if (isCamp() && !D.pret429) {
    const used = al.map(u => u.sp);
    PROFILE.box.forEach(id => {
      const f = PROFILE.fatigue[id] || 0;
      PROFILE.fatigue[id] = used.includes(id) ? Math.min(100, f + 30) : Math.max(0, f - 25);
      if (!PROFILE.fatigue[id]) delete PROFILE.fatigue[id];
    });
    rew.tired = used.filter(id => (PROFILE.fatigue[id] || 0) >= 70);
  }
  if (!D.tuto && !D.pret429) {
    const atk = [
        ...new Set(
          al.flatMap(u =>
            u.mv
              .map(id => MV[id])
              .filter(m => m.p || m.fix)
              .map(m => m.t)
          )
        )
      ],
      def = [...new Set(al.flatMap(u => u.t))];
    PROFILE.hist.push({ atk, def, rx: Object.assign({}, S.stats.rxk || {}) });
    if (PROFILE.hist.length > 10) PROFILE.hist = PROFILE.hist.slice(-10);
  }
  setTimeout(() => {
    renderSquad();
    renderLeague();
    renderHome();
  }, 0);
  // campaign: forms reached in battle become recruits
  rew.forms = [];
  if (isCamp() && !D.pret429) {
    PROFILE.forms = PROFILE.forms || [];
    (S.stats.evl || []).forEach(([, id]) => {
      if (BY[id] && BY[id].st > 1 && !PROFILE.forms.includes(id)) {
        PROFILE.forms.push(id);
        if (!forms0.includes(id)) rew.forms.push(id);
      }
    });
  }
  // end-of-battle gains: Pokédollars and Shards
  try {
    const lv = D.lv || 10,
      mul = { facile: 0.8, normal: 1, expert: 1.3 }[S.diff || PROFILE.diff] || 1;
    let m = D.tuto
        ? win
          ? 300
          : 100
        : win
          ? Math.round(((60 + lv * 8) * mul) / 10) * 10
          : Math.round(((15 + lv * 2) * mul) / 5) * 5,
      g = 0;
    if (win && rew.badgeNew) {
      m += 500;
      g += 10;
    }
    if (win && D.elite && PROFILE.elite > e0) m += 600;
    if (win && D.champ) {
      m += e0 < 5 ? 1500 : 600;
      if (e0 < 5) g += 20;
    }
    m += (rew.caught || []).length * 50;
    if (win && S.rank === 'S' && S.rankNew) g += 5;
    let daily = false;
    if (win && S.sc === dailyKey() && !dailyDone()) {
      m *= 2;
      g += 3;
      PROFILE.daily = { d: today(), w: 1 };
      daily = true;
    }
    PROFILE.money = Math.min(999999, PROFILE.money + m);
    PROFILE.gems = Math.min(99999, PROFILE.gems + g);
    Object.assign(rew, { money: m, gems: g, daily });
    setTimeout(renderWallet, 0);
  } catch { /* Best effort: failure here is non-fatal. */ }
  aplusProgress(S, rew); // shinies, rival, legends, Tower (v4.4)
  return rew;
}


export function rewHtml(r) {
  if (!r) return '';
  const o = [];
  if (r.caught.length) {
    o.push(
      `<div class="res-l"><h4>Capturés</h4>${r.caught.map(c => `<div class="rl">${medal(BY[c.id].t)}<span>${BY[c.id].n}${c.nw ? ` · ${BY[c.base].n} rejoint votre Box` : ''}</span><b>${c.nw ? 'Nouveau' : '✓'}</b></div>`).join('')}</div>`
    );
  }
  if (r.items.length || r.gifts.length) {
    o.push(
      `<div class="res-l"><h4>Récompenses d’arène</h4>${r.items.map(k => `<div class="rl"><span class="it-ic"><svg viewBox="0 0 24 24"><path d="${ITEMS2[k].i}"/></svg></span><span>${ITEMS2[k].n} · ${ITEMS2[k].d}</span><b>Objet</b></div>`).join('')}${r.gifts.map(id => `<div class="rl">${medal(BY[id].t)}<span>${BY[id].n} rejoint votre Box</span><b>Recrue</b></div>`).join('')}</div>`
    );
  }
  if (r.elite) {
    o.push(
      `<div class="res-l"><h4>Conseil 4</h4><div class="rl"><span>${r.elite < 4 ? `${r.elite} membre${r.elite > 1 ? 's' : ''} sur 4 vaincu${r.elite > 1 ? 's' : ''}.` : 'Le Conseil 4 est vaincu. Le Champion vous attend.'}</span><b>${r.elite} / 4</b></div></div>`
    );
  }
  if (r.champ) {
    o.push(
      `<div class="res-l champ"><h4>Maître de la Ligue</h4><div class="rl"><span>Vous avez battu un Champion qui avait étudié vos combats.</span><b>★</b></div></div>`
    );
  }
  if (r.links.length) {
    o.push(
      `<div class="res-l"><h4>Liens gagnés</h4>${r.links.map(l => `<div class="rl">${medal(BY[l.a].t)}${medal(BY[l.b].t)}<span>${BY[l.a].n} et ${BY[l.b].n}${l.x2 ? ' · ×2 sans évoluer' : ''}${l.to > l.from ? ` · palier ${LINK_N[l.to]} atteint` : ''}</span><b>+${l.pts}</b></div>`).join('')}</div>`
    );
  }
  if (r.tired.length) {
    o.push(
      `<p class="empty">Fatigués : ${r.tired.map(id => BY[id].n).join(', ')}. Ils perdront 1 Mouvement au prochain combat : faites tourner votre Box.</p>`
    );
  }
  let h = o.join('') + aplusRewHtml(r);
  if (r.money != null) {
    h =
      `<div class="res-l v4-gain"><h4>Gains</h4><div class="rl"><span class="v4-coin" aria-hidden="true">₽</span><span>${r.daily ? 'Défi du jour relevé : gains doublés' : 'Prime de combat'}</span><b>+${fmt(r.money)} ₽</b></div>${r.gems ? `<div class="rl"><span class="v4-gemi" aria-hidden="true"><svg><use href="#i-gem"/></svg></span><span>Éclats de Résonance</span><b>+${r.gems}</b></div>` : ''}</div>` +
      h;
  } // end-of-battle gains
  return itemize(h); // illustrated items
}


// Battles: the selection is rendered by React (src/screens/combat/prep), via renderSelection().
export function renderPrep() {
  rivalBuild();
  if (scSel === 'sauvage' && !SCEN.sauvage) __set_scSel(nextGoal()[0]);
  if (scSel === 'champ') champBuild();
  renderSummary();
  renderSelection();
  try {
    // team and opponent illustrations preloaded
    const S = SCEN[scSel];
    preload([...squad, ...(S && S.foes ? S.foes.map(f => f[0]) : [])]);
  } catch { /* Best effort: failure here is non-fatal. */ }
}


/* ---- League: Elite Four and Champion, rendered by React (src/screens/league/EliteCell.jsx) ---- */


/* ---- home: path ---- */
export function nextGoal() {
  if (PROFILE.tuto === 0 && PROFILE.battles === 0) return ['tuto', 'Premier combat guidé'];
  for (let i = 0; i < 8; i++) {
    // the rival returns after badges 2, 4 and 6 (Campaign)
    if (isCamp() && i && i % 2 === 0 && BADGES.length >= i && PROFILE.rival < i / 2) {
      return [RIVAL_KEYS[i / 2 - 1], 'Rival : ' + RIVAL.n];
    }
    // Team Dissonance strikes after badges 1, 3, 5 and 7 (Campaign, v4.11)
    if (isCamp() && i % 2 === 1 && BADGES.length >= i && (PROFILE.dissonance || 0) < (i + 1) / 2) {
      return ['td' + (i + 1) / 2, 'Team Dissonance'];
    }
    if (!BADGES.includes(i)) return [ARENAS[i].k, GYMS[i].n];
  }
  if (isCamp() && PROFILE.rival < 4) return ['rv4', 'Rival : ' + RIVAL.n];
  for (let i = 0; i < 4; i++) if (PROFILE.elite < i + 1) return [ELITE[i], SCEN[ELITE[i]].n];
  if (PROFILE.elite >= 5) {
    const jn = jNext416(); // Johto after Kanto (v4.15), with its story (v4.16)
    if (jn) return jn;
    const hn = hNext419(); // Hoenn after Johto (v4.19)
    if (hn) return hn;
  }
  return ['champ', PROFILE.elite >= 5 ? 'Champion (revanche)' : 'Champion de la Ligue'];
}


/* ---- new campaign: starter choice ---- */
// #starter is rendered by React (src/screens/overlays/Starter.jsx)
export function openStarter() {
  openStarterBox();
}


function tutorialOn() {
  return B && SCEN[B.sc] && SCEN[B.sc].tuto && tutorialI >= 0 && tutorialI < TUTORIAL_STEPS.length;
}


// Guided-battle coach: #coach is rendered by React (src/screens/overlays/Coach.jsx,
// with the Professor's portrait). Here, the choice of step and the highlighted cell.
// #bBoard is rendered by React: its class goes through the "host" state (boardStore.js)
function withoutHl() {
  bdClass('coach-hl', false);
  $$('.coach-hl').forEach(x => x.classList.remove('coach-hl'));
}


export function renderCoach() {
  if (!B || B.over) {
    // the coach disappears at the end of the battle or on abandon
    hideCoach();
    withoutHl();
    return;
  }
  withoutHl();
  if (!tutorialOn()) {
    hideCoach();
    return;
  }
  const s = TUTORIAL_STEPS[tutorialI];
  if (s.done() && tutorialI < TUTORIAL_STEPS.length - 1) {
    tutorialI++;
    return renderCoach();
  }
  const t = $(s.sel);
  if (t && t.id === 'bBoard') bdClass('coach-hl', true);
  else if (t) t.classList.add('coach-hl');
  const c = getCoach();
  if (c.k === String(tutorialI) && !c.hidden) return;
  showCoach(String(tutorialI), { n: tutorialI + 1, total: TUTORIAL_STEPS.length, t: s.t, d: s.d, last: tutorialI === TUTORIAL_STEPS.length - 1 });
}


/* ---- League: held items and combined techniques (v1.0) ---- */
// held items (#items) and combined techniques (#duos): rendered by the React Guide (League.jsx)

// Instructions run at startup, in the original order (see index.js).
export function __init() {

/* ===================== v1.0: progression, campaign, tutorial, comfort, sound ===================== */
/* ---- preferences for this device ---- */
PREF = (() => {
  const p = { sound: false, vibe: false, fast: false };
  try {
    Object.assign(p, JSON.parse(localStorage.getItem('res-pref') || '{}'));
  } catch { /* Best effort: failure here is non-fatal. */ }
  return p;
})();


/* ---- synthesized sound (no files) and vibrations ---- */
AC = null;


SFX = {
  ui: () => tone(880, 0, 0.06, 'triangle', 0.04),
  hit: () => {
    noise(0, 0.14, 0.14, 700);
    tone(140, 0, 0.12, 'sine', 0.08, 70);
  },
  rx: () => [1046, 1318, 1568].forEach((f, i) => tone(f, i * 0.05, 0.18, 'triangle', 0.05)),
  ko: () => {
    tone(392, 0, 0.18, 'square', 0.04, 196);
    tone(196, 0.16, 0.3, 'square', 0.035, 98);
  },
  evo: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.11, 0.4, 'triangle', 0.05));
    noise(0.55, 0.5, 0.05, 4000);
  },
  catch: () => {
    tone(660, 0, 0.08, 'square', 0.04);
    tone(660, 0.18, 0.08, 'square', 0.04);
    tone(990, 0.36, 0.3, 'triangle', 0.06);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.6 : 0.16, 'triangle', 0.06)),
  lose: () => [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.18, 0.3, 'sine', 0.05)),
  duo: () => {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.06, 0.25, 'sawtooth', 0.03));
    noise(0.3, 0.4, 0.06, 2500);
  }
};


/* ---- preparation: terrains, gyms, League ---- */
PREPG = null;


document.addEventListener('click', e => {
  const b = e.target.closest('[data-chal]');
  if (b) challenge(b.dataset.chal);
});


document.addEventListener('click', e => {
  const g = e.target.closest('[data-goal]');
  if (g) {
    const k = g.dataset.goal;
    __set_scSel(k);
    go('combat');
    renderPrep();
    if (k === 'tuto' && squad.length) launch();
    return;
  }
  const c = e.target.closest('[data-camp]');
  if (c) {
    confirm430('Commencer une campagne ?', 'Vous choisirez votre partenaire, puis les chapitres s’enchaîneront depuis le premier badge.', openStarter); // v4.30
  }
});


$('#starter').addEventListener('click', e => {
  const d = e.target.closest('[data-sd]');
  if (d) {
    PROFILE.diff = d.dataset.sd;
    refreshStarter(); // difficulty buttons (aria-pressed)
    return;
  }
  const b = e.target.closest('[data-st]');
  if (!b) {
    if (e.target.id === 'starter') hideStarter();
    return;
  }
  if (b.dataset.st === 'x') {
    hideStarter();
    return;
  }
  const id = b.dataset.st,
    keep = { name: PROFILE.name, diff: PROFILE.diff };
  hideStarter();
  const box = [id, ...CAMP_START];
  applySave(
    {
      v: SAVE_V,
      savedAt: new Date().toISOString(),
      squad: box.slice(0, 4),
      badges: [],
      profile: Object.assign(defProfile(), keep, { mode: 'campagne', box, dex: [...box] }),
      battle: null
    },
    { leaveBattle: true }
  );
  closeSaves();
  autoSave(true);
  go('accueil');
  renderHome();
  toast(`Campagne lancée avec ${BY[id].n}. Commencez par le combat guidé ou la Route 29.`);
});


/* ---- tutorial: first guided battle ---- */
TUTORIAL_STEPS = [
  {
    t: 'Lisez la menace',
    d: 'Touchez un adversaire : la zone rouge montre tout ce qu’il peut frapper après s’être déplacé. Il choisit sa cible à son tour.',
    sel: '#bBoard',
    done: () => false
  },
  {
    t: 'Déplacez-vous',
    d: 'Touchez un de vos Pokémon, puis une case bleue. Approchez pour frapper, ou reculez hors de la zone rouge.',
    sel: '#bBoard',
    done: () => B.units.some(u => u.side === 'a' && u.moved)
  },
  {
    t: 'Attaquez',
    d: 'Choisissez une capacité, touchez une case dorée : l’aperçu donne le résultat exact. Touchez « Confirmer ».',
    sel: '#bPanel',
    done: () => B.units.some(u => u.side === 'a' && u.acted && !u.sn)
  },
  {
    t: 'Énergie d’Éveil',
    d: 'Les trois losanges se remplissent en fin de manche, en réagissant et en encaissant. Pleins, le bouton Éveil fait évoluer le Pokémon : c’est irréversible.',
    sel: '#bPanel',
    done: () => false
  },
  {
    t: 'Terminez la manche',
    d: 'Quand vos Pokémon ont joué, touchez « Fin du tour » : les adversaires se déplacent, puis attaquent.',
    sel: '#bEnd',
    done: () => B.round > 1
  },
  {
    t: 'Les Voix et la capture',
    d: 'Esquive (1 Voix) et Relance (2 Voix) sauvent une manche. Sous 25 % de PV et immobilisé, un Pokémon sauvage peut être capturé au contact.',
    sel: '#bPanel',
    done: () => false
  }
];


tutorialI = -1;


$('#coach').addEventListener('click', e => {
  const b = e.target.closest('[data-co]');
  if (!b) return;
  if (b.dataset.co === 'skip') {
    tutorialI = -1;
    PROFILE.tuto = 1;
    queueSave();
  } else {
    tutorialI++;
    if (tutorialI >= TUTORIAL_STEPS.length) {
      tutorialI = -1;
      PROFILE.tuto = 1;
      queueSave();
    }
  }
  renderCoach();
});


}
