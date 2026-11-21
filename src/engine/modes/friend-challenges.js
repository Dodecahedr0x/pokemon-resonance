/* =====================================================================
   Friend challenges (added in v4.16): a trainer card to share (a text
   code), friends' teams to fight, a shared leaderboard on the Home screen.
   ===================================================================== */
import { MOVES } from '../data/moves.js';
import { POKEMON, SCEN } from '../pokemon/pokemon.js';
import { ITEMS2, PROFILE, isCamp, ownedItems } from '../state/game-state.js';
import { BADGES } from './gyms.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, fnvHash, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { hasNx } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { B, backToPrep, goFight } from '../combat/ui.js';
import { escapeHtml, queueSave } from '../state/saves.js';
import { familyOwned } from '../progression/trainer-stats.js';
import { today } from '../state/economy.js';
import { isShinyOwned } from '../pokemon/shiny.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { hasXp } from '../combat/resonance.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { weeklyProgress, sanitizeWeekly } from './weekly-challenge.js';
import { migrateKeys } from '../../lib/saveMigration.js';

let FRIEND_DEL, FRIEND_MODE;

export const friendScore = s => s.b * 100 + s.j * 120 + s.e * 60 + s.c * 400 + s.d * 10 + s.tb * 25 + s.sh * 15;

const FRIEND_POS = [
  [6, 1],
  [6, 3],
  [6, 5],
  [7, 2],
];

export function sanitizeFriend(a) {
  if (!a || typeof a !== 'object' || typeof a.id !== 'string' || !/^[a-z0-9]{6,12}$/.test(a.id)) {
    return null;
  }
  const t = (Array.isArray(a.t) ? a.t : [])
    .filter(x => Array.isArray(x) && POKEMON[x[0]] && !POKEMON[x[0]].isEnemy)
    .slice(0, 4)
    .map(x => [x[0], MOVES[x[1]] ? x[1] : 0, ITEMS2[x[2]] ? x[2] : 0, x[3] ? 1 : 0, MOVES[x[4]] ? x[4] : 0]);
  if (!t.length) {
    return null;
  }
  const s = a.s && typeof a.s === 'object' ? a.s : {},
    I = (v, M) => (Number.isFinite(v) ? Math.max(0, Math.min(M, Math.floor(v))) : 0);
  const jr =
    a.jr && typeof a.jr.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.jr.d)
      ? { d: a.jr.d, r: ['S', 'A', 'B'].includes(a.jr.r) ? a.jr.r : '', m: I(a.jr.m, 99) }
      : null;
  return {
    id: a.id,
    n:
      String(a.n || 'Dresseur')
        .replace(/[<>&"]/g, '')
        .slice(0, 14) || 'Dresseur',
    t,
    s: {
      b: I(s.b, 8),
      j: I(s.j, 8),
      e: I(s.e, 5),
      c: s.c ? 1 : 0,
      d: I(s.d, 999),
      tb: I(s.tb, 999),
      sh: I(s.sh, 999),
      w: I(s.w, 99999),
      m: s.m ? 1 : 0,
    },
    jr,
    dt: typeof a.dt === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.dt) ? a.dt : '',
    w: I(a.w, 9999),
    l: I(a.l, 9999),
    dw: typeof a.dw === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.dw) ? a.dw : '',
    wk: sanitizeWeekly(a.wk), // v4.29
  };
}

function playerStandings() {
  return {
    b: BADGES.length,
    j: (PROFILE.johto || []).length,
    e: Math.min(5, PROFILE.elite || 0),
    c: PROFILE.jchamp ? 1 : 0,
    d: familyOwned(),
    tb: (PROFILE.tdr && PROFILE.tdr.best) || 0,
    sh: (PROFILE.shiny || []).length,
    w: PROFILE.wins || 0,
    m: isCamp() ? 1 : 0,
  };
}

export function codeChecksum(s) {
  return fnvHash(s).toString(36).slice(-4).padStart(4, '0');
}

function exportSquadCode() {
  if (!PROFILE.tid) {
    PROFILE.tid = (Math.random().toString(36).slice(2) + Date.now().toString(36))
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10);
  }
  const T = squad.slice(0, 4).map(id => {
    const b = POKEMON[id].base,
      it = PROFILE.equipment[b];
    return [
      id,
      PROFILE.learnedTms[b] || 0,
      it && ownedItems().includes(it) ? it : 0,
      isShinyOwned(b) ? 1 : 0,
      (PROFILE.inherited || {})[b] || 0,
    ];
  });
  const o = {
    v: 1,
    id: PROFILE.tid,
    n: PROFILE.name || 'Dresseur',
    t: T,
    s: playerStandings(),
    jr: PROFILE.jour && PROFILE.jour.d === today() ? PROFILE.jour : null,
    dt: today(),
    wk: weeklyProgress(), // weekly challenge (v4.29)
  };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `RES-${b64}-${codeChecksum(b64)}`;
}

function parseShareCode(txt) {
  const m = String(txt || '')
    .replace(/\s+/g, '')
    .match(/RES-([A-Za-z0-9_-]+)-([a-z0-9]{4})/);
  if (!m) {
    return { err: 'Aucun code de dresseur reconnu. Il commence par « RES- ».' };
  }
  if (codeChecksum(m[1]) !== m[2]) {
    return { err: 'Ce code est incomplet ou abîmé. Demandez à votre ami de le renvoyer.' };
  }
  try {
    const b = m[1].replace(/-/g, '+').replace(/_/g, '/'),
      o = migrateKeys(JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4))))));
    const a = sanitizeFriend(o);
    if (!a) {
      return { err: 'Ce code ne contient pas d’équipe utilisable.' };
    }
    return { a };
  } catch (e) {
    return { err: 'Ce code est illisible.' };
  }
}

function addFriendFromCode(txt) {
  const r = parseShareCode(txt);
  if (r.err) {
    return r.err;
  }
  const a = r.a;
  if (a.id === PROFILE.tid) {
    return 'C’est votre propre carte : partagez-la plutôt à vos amis !';
  }
  PROFILE.friends = PROFILE.friends || [];
  const i = PROFILE.friends.findIndex(x => x.id === a.id);
  if (i >= 0) {
    const o = PROFILE.friends[i];
    PROFILE.friends[i] = Object.assign(a, { w: o.w, l: o.l, dw: o.dw });
    queueSave();
    return `Carte de ${a.n} mise à jour.`;
  }
  if (PROFILE.friends.length >= 12) {
    return 'Votre carnet est plein (12 amis). Retirez-en un d’abord.';
  }
  PROFILE.friends.push(a);
  queueSave();
  return `${a.n} rejoint vos défis entre amis !`;
}

export function buildFriendTeam(i) {
  const A = (PROFILE.friends || [])[i];
  if (!A) {
    return false;
  }
  const s = A.s,
    pw = s.b + s.j + s.e + (s.c ? 2 : 0);
  SCEN.ami = {
    n: `Défi · ${A.n}`,
    lvl: `Défi entre amis · ${A.n}`,
    lim: 10,
    time: i % 2 ? 'nuit' : 'jour',
    bio: 'arene',
    ami: i + 1,
    at: POKEMON[A.t[0][0]].t[0],
    water: ['4,0'],
    rock: ['3,2', '4,4'],
    hb: 4 + Math.round(pw * 1.3),
    pb: Math.min(5, Math.floor(pw / 5)),
    lv: Math.min(64, 18 + pw * 2),
    d: `L’équipe de ${A.n}, telle qu’elle était sur sa carte${A.dt ? ' du ' + A.dt.split('-').reverse().join('/') : ''}. L’ordinateur la joue comme un vrai dresseur : capacités apprises, objets tenus, Résonance et attaques Expertes compris.`,
    foes: A.t.map((x, j) => (x[3] ? [x[0], FRIEND_POS[j], { shiny: true }] : [x[0], FRIEND_POS[j]])),
  };
  OBST.ami = {};
  return true;
}

function fightFriend(i) {
  if (!buildFriendTeam(i)) {
    return;
  }
  if (B) {
    backToPrep();
  }
  goFight('ami');
}

/** Friend challenges on the Home screen (#v4Amis, rendered by src/screens/home/Friends.jsx). */
export function friendsPanelData() {
  const L = PROFILE.friends || [],
    selfRef = {
      n: PROFILE.name || 'Vous',
      s: playerStandings(),
      jr: PROFILE.jour && PROFILE.jour.d === today() ? PROFILE.jour : null,
      me: true,
    },
    rows = [selfRef, ...L].map(a => Object.assign({ sc: friendScore(a.s) }, a)).sort((a, b) => b.sc - a.sc);
  const dayKey = a =>
    a.jr && a.jr.d === today() ? `✓${a.jr.r ? ' ' + a.jr.r : ''}${a.jr.m ? ' · ' + a.jr.m + ' m.' : ''}` : '—';
  return { L, rows, jour: dayKey, del: FRIEND_DEL };
}

/* trainer card / add a friend: rendered by React (src/screens/overlays/FriendBox.jsx) */
function renderFriendBox() {
  if (FRIEND_MODE === 'carte') {
    paintOverlay('ami', {
      mode: 'carte',
      displayName: PROFILE.name || '',
      code: squad.length ? exportSquadCode() : '',
      teamNames: squad.slice(0, 4).map(id => POKEMON[id].n),
      canShare: !!navigator.share,
    });
  } else if (FRIEND_MODE === 'ajout') {
    paintOverlay('ami', { mode: 'ajout' });
  }
}

async function copyShareCode() {
  const ta = $('#amiCode');
  if (!ta) {
    return;
  }
  const txt = ta.value;
  try {
    await navigator.clipboard.writeText(txt);
    toast('Code copié : collez-le dans un message à vos amis.');
    return;
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, txt.length);
    if (document.execCommand('copy')) {
      toast('Code copié : collez-le dans un message à vos amis.');
      return;
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  toast('Le code est sélectionné : appuyez longuement dessus pour le copier.');
}

function onCombat(S, opt, D0) {
  if (S.restricted) {
    return;
  } // fixed-rule battles (v4.31)
  D0 = D0 || SCEN[S.sc] || {};
  // a friend's team: its learned moves and its items
  if (D0.ami) {
    const A = (PROFILE.friends || [])[D0.ami - 1];
    if (A) {
      A.t.forEach((x, j) => {
        const u = S.units.find(e => e.uid === 'e' + j);
        if (!u) {
          return;
        }
        [x[1], x[4]].forEach(k => k && MOVES[k] && !u.mv.includes(k) && u.mv.push(k));
        if (x[1]) {
          u.ctm = x[1];
        }
        if (x[4]) {
          u.hm = x[4];
        }
        const it = x[2];
        if (it && ITEMS2[it]) {
          u.item = it;
          if (it === 'ceinture') {
            u.belt = true;
          }
          if (it === 'bandeau') {
            u.pb = (u.pb || 0) + 2;
          }
          if (it === 'crinorage') {
            u.pb = (u.pb || 0) + 1;
          }
          if (it === 'lentille' && (hasNx(u) || hasXp(u))) {
            u.en = 1;
          }
        }
      });
    }
  }
}

function onFriendChallengesClick(e) {
  const a = e.target.closest('[data-ami]');
  if (a) {
    const k = a.dataset.ami;
    if (k === 'carte' || k === 'ajout') {
      FRIEND_MODE = k;
      renderFriendBox();
      $('#amiBox').hidden = false;
      queueSave();
      return;
    }
    if (k === 'x') {
      $('#amiBox').hidden = true;
      refreshHome();
      return;
    }
    if (k === 'copier') {
      return void copyShareCode();
    }
    if (k === 'partager') {
      const ta = $('#amiCode');
      if (ta && navigator.share) {
        navigator
          .share({
            text: `Affronte mon équipe dans Pokémon Résonance ! Colle ce code dans « Défis entre amis » : ${ta.value}`,
          })
          .catch(() => copyShareCode());
      }
      return;
    }
    if (k === 'valider') {
      const ta = $('#amiColle'),
        msg = addFriendFromCode(ta ? ta.value : ''),
        ok = /rejoint|mise à jour/.test(msg);
      if (ok) {
        $('#amiBox').hidden = true;
        toast(msg);
        refreshHome();
      } else {
        const er = $('#amiErr');
        if (er) {
          er.textContent = msg;
        }
      }
      return;
    }
  }
  if (e.target.id === 'amiBox') {
    $('#amiBox').hidden = true;
    return;
  }
  const f = e.target.closest('[data-ami-fight]');
  if (f) {
    FRIEND_DEL = -1;
    if (!squad.length) {
      return void toast('Composez d’abord une équipe.');
    }
    return void fightFriend(+f.dataset.amiFight);
  }
  const d = e.target.closest('[data-ami-del]');
  if (d) {
    const i = +d.dataset.amiDel;
    if (FRIEND_DEL === i) {
      const A = PROFILE.friends[i];
      PROFILE.friends.splice(i, 1);
      FRIEND_DEL = -1;
      queueSave();
      if (A) {
        toast(`${A.n} est retiré de vos défis.`);
      }
    } else {
      FRIEND_DEL = i;
    }
    refreshHome();
  }
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  // a safe value as long as no challenge is running
  SCEN.ami = Object.assign({}, SCEN.gue, { n: 'Défi entre amis', ami: 0 });

  /* ---------- hooks: battle creation ---------- */
  HOOKS.combat.push(onCombat);

  /* ---------- hooks: after the battle ---------- */
  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {},
      o = [0, 0];
    // Daily challenge: your result, for the friends leaderboard
    if (rew.daily) {
      PROFILE.jour = { d: today(), r: S.rank || '', m: S.round };
    }
    // friend challenge
    if (D.ami) {
      const A = (PROFILE.friends || [])[D.ami - 1];
      if (A) {
        if (win) {
          A.w = (A.w || 0) + 1;
        } else {
          A.l = (A.l || 0) + 1;
        }
        const prem = win && A.dw !== today();
        if (prem) {
          A.dw = today();
          o[1] += 3;
        }
        rew.ami = { n: A.n, win, w: A.w, l: A.l, prem };
      }
    }
    return o[0] || o[1] ? o : null;
  });

  HOOKS.battleResult.push(r => {
    if (!r.ami) {
      return '';
    }
    return `<div class="result-list"><h4>Défi entre amis</h4><div class="result-row"><span>${r.ami.win ? 'Victoire' : 'Défaite'} contre l’équipe de ${escapeHtml(r.ami.n)} · ${r.ami.w} victoire${r.ami.w > 1 ? 's' : ''}, ${r.ami.l} défaite${r.ami.l > 1 ? 's' : ''}${r.ami.prem ? ' · première victoire du jour : +3 Éclats' : ''}.</span><b>${r.ami.w}–${r.ami.l}</b></div></div>`;
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'amis',
    n: 'Entre amis',
    d: 'Battre l’équipe d’un ami.',
    ok: () => (PROFILE.friends || []).some(a => a.w > 0),
  });

  /* ---------- the Home screen ---------- */
  // #v4Amis: rendered by React after .hm-quick (src/screens/home/Friends.jsx)
  // #amiBox: rendered by React (src/screens/overlays/FriendBox.jsx)

  FRIEND_DEL = -1;

  FRIEND_MODE = null;

  document.addEventListener('click', onFriendChallengesClick);

  document.addEventListener('input', e => {
    if (e.target.id !== 'amiNom') {
      return;
    }
    PROFILE.name = e.target.value.replace(/[<>&"]/g, '').slice(0, 14);
    const ta = $('#amiCode');
    if (ta && squad.length) {
      ta.value = exportSquadCode();
    }
    queueSave();
  });
}
