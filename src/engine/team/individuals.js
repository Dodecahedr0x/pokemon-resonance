import { POKEMON, familyOf } from '../pokemon/pokemon.js';
import { DIFFICULTY_NAMES, HELD_ITEMS, PROFILE } from '../state/game-state.js';
import { fnvHash } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { MAX_ENERGY, pushMessage } from '../combat/engine.js';
import { queueSave } from '../state/saves.js';
import { CHARACTERS } from './characters.js';

/* =====================================================================
   Individual nature and ability (added in v4.32): each captured Pokémon
   receives a nature (among the characters that suit its family) and an
   ability (tied to its types), kept through its evolutions. Also holds
   the profile defaults and sanitizer of the v4.32 state (traits, saved
   teams, Pantheon).
   ===================================================================== */
export function INDIVIDUALS_COMFORT_0() {
  return { traits: {}, traitsInit: 0, savedTeams: [], pantheonlist: [] };
}

export function individualsComfortClean(p) {
  const o = INDIVIDUALS_COMFORT_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (p.traits && typeof p.traits === 'object') {
    Object.keys(p.traits).forEach(b => {
      const x = p.traits[b];
      if (POKEMON[b] && x && typeof x === 'object' && CHARACTERS[x.temperament] && ABILITY_DEFS[x.ability]) {
        o.traits[b] = { temperament: x.temperament, ability: x.ability };
      }
    });
  }
  o.traitsInit = p.traitsInit ? 1 : 0;
  if (Array.isArray(p.savedTeams)) {
    o.savedTeams = p.savedTeams
      .filter(t => t && typeof t === 'object' && Array.isArray(t.ids))
      .slice(0, 8)
      .map(t => {
        const it = {};
        if (t.it && typeof t.it === 'object') {
          Object.keys(t.it).forEach(
            b => POKEMON[b] && typeof t.it[b] === 'string' && HELD_ITEMS[t.it[b]] && (it[b] = t.it[b])
          );
        }
        return {
          n:
            String(t.n || 'Équipe')
              .replace(/[<>&"]/g, '')
              .slice(0, 20) || 'Équipe',
          ids: t.ids.filter(id => POKEMON[id]).slice(0, 4),
          it,
        };
      })
      .filter(t => t.ids.length);
  }
  if (Array.isArray(p.pantheonlist)) {
    o.pantheonlist = p.pantheonlist
      .filter(x => x && typeof x === 'object' && typeof x.k === 'string' && Array.isArray(x.t))
      .slice(0, 40)
      .map(x => ({
        d: typeof x.d === 'string' ? x.d.slice(0, 10) : '',
        k: x.k.slice(0, 12),
        n: String(x.n || '')
          .replace(/[<>&"]/g, '')
          .slice(0, 40),
        t: x.t.filter(id => POKEMON[id]).slice(0, 4),
        r: Number.isFinite(x.r) ? Math.max(0, Math.min(99, Math.floor(x.r))) : 0,
        rk: typeof x.rk === 'string' ? x.rk.slice(0, 2) : '',
        df: DIFFICULTY_NAMES[x.df] ? x.df : 'normal',
        md: typeof x.md === 'string' ? x.md.slice(0, 10) : '',
      }));
  }
  return o;
}

/** A family's three possible abilities: those of its types, from the base form to the last evolution. */
function familyTalents(b) {
  const types = new Set(familyOf(b).flatMap(m => m.t)),
    h = fnvHash(b),
    L = Object.keys(ABILITY_DEFS)
      .filter(k => ABILITY_DEFS[k][2].some(t => types.has(t)))
      .sort((x, y) => ((fnvHash(x + b) ^ h) >>> 0) - ((fnvHash(y + b) ^ h) >>> 0));
  ['robuste', 'elan', 'focus'].forEach(k => L.length < 3 && !L.includes(k) && L.push(k));
  return L.slice(0, 3);
}

/** The three natures that suit a family: based on the last evolution. */
function familyNatures(b) {
  const f = familyOf(b),
    m = f.slice().sort((x, y) => y.st - x.st)[0] || POKEMON[b],
    s = m.s || [3, 3, 3, 3, 3, 3],
    sc = {
      brave: s[1] * 2,
      tetu: s[1] * 2 - 1,
      prudent: s[2] * 2 + s[0] * 0.5,
      vif: (s[3] + s[4]) * 1.1,
      fougueux: f.length > 1 ? 7 + f.length : 2,
      docile: 5,
    };
  return Object.keys(sc)
    .sort((a, c) => sc[c] - sc[a])
    .slice(0, 3);
}

function characterHash(b) {
  const ks = Object.keys(CHARACTERS);
  let h = 7;
  for (const c of String(b)) {
    h = (h * 31 + c.charCodeAt(0)) % 9973;
  }
  return ks[h % ks.length];
}

/** Nature and ability of a family in your Box (rolled on its first appearance). */
export function individualOf(id) {
  const b = POKEMON[id] ? POKEMON[id].base : id;
  if (!POKEMON[b] || !PROFILE.box.includes(b)) {
    return null;
  }
  const I = (PROFILE.traits = PROFILE.traits || {});
  if (!PROFILE.traitsInit) {
    // families already present keep their pre-v4.32 character
    PROFILE.box.forEach(x => {
      if (!I[x] && POKEMON[x]) {
        I[x] = { temperament: characterHash(x), ability: familyTalents(x)[fnvHash(x) % 3] };
      }
    });
    PROFILE.traitsInit = 1;
    queueSave();
  }
  if (!I[b]) {
    const N = familyNatures(b),
      T = familyTalents(b);
    I[b] = { temperament: N[Math.floor(Math.random() * N.length)], ability: T[Math.floor(Math.random() * T.length)] };
    queueSave();
  }
  return I[b];
}

export function talentDamage(S, u, t, d) {
  if (!(d > 0)) {
    return d;
  }
  let f = 1;
  if (u && u.side === 'a') {
    if (u.unitAbility === 'rage' && u.hp < u.mhp / 2) {
      f *= 1.15;
    }
    if (u.unitAbility === 'opportun' && t && t.hp < t.mhp / 2) {
      f *= 1.15;
    }
  }
  if (t && t.side === 'a' && t.unitAbility === 'carapace') {
    f *= 0.9;
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}

export function talentMove(S, u) {
  return u && u.side === 'a' && u.unitAbility === 'elan' && S && S.round === 1 ? 1 : 0;
}

export function individualHtml(id) {
  const I = individualOf(id);
  if (!I) {
    return '';
  }
  const T = ABILITY_DEFS[I.ability];
  return `<div class="mvc car-mvc ability-card"><div class="t"><b>${T[0]}</b><span class="chip">Talent perso</span></div><p>${T[1]}</p></div>`;
}

/* ---------- 1. individual nature and ability ---------- */
const ABILITY_DEFS = {
  fermete: [
    'Fermeté',
    'Survit une fois par combat à un coup fatal (1 PV).',
    ['Roche', 'Sol', 'Acier', 'Combat', 'Normal'],
  ],
  regen: [
    'Régénération',
    'Récupère 8 % de ses PV à chaque fin de manche.',
    ['Eau', 'Plante', 'Normal', 'Fée', 'Poison'],
  ],
  elan: ['Élan', '+1 Mouvement pendant la première manche.', ['Vol', 'Électrik', 'Feu', 'Insecte', 'Combat']],
  focus: [
    'Concentration',
    'Commence chaque combat avec 1 losange de plus.',
    ['Psy', 'Spectre', 'Dragon', 'Fée', 'Glace'],
  ],
  rage: [
    'Rage',
    '+15 % de dégâts quand il lui reste moins de la moitié de ses PV.',
    ['Feu', 'Combat', 'Ténèbres', 'Dragon', 'Sol'],
  ],
  carapace: ['Carapace', '−10 % de dégâts subis.', ['Eau', 'Roche', 'Acier', 'Insecte', 'Glace']],
  opportun: [
    'Opportuniste',
    '+15 % de dégâts contre une cible sous la moitié de ses PV.',
    ['Ténèbres', 'Spectre', 'Poison', 'Vol', 'Électrik'],
  ],
  robuste: ['Robustesse', '+10 % de PV maximum.', ['Normal', 'Plante', 'Sol', 'Glace', 'Roche']],
  garde: ['Vigilance', 'Commence le combat sous Garde pendant 2 manches.', ['Acier', 'Psy', 'Fée', 'Normal', 'Eau']],
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push(S => {
    if ((S.restricted && S.sc !== 'echo431') || !S.temperament) {
      return;
    } // "Natures et talents" (Natures and abilities) setting
    S.units
      .filter(u => u.side === 'a')
      .forEach(u => {
        const I = individualOf(u.sp);
        if (!I) {
          return;
        }
        u.unitAbility = I.ability;
        if (I.ability === 'fermete') {
          u.sturdy = true;
        } else if (I.ability === 'focus') {
          u.en = Math.min(MAX_ENERGY, (u.en || 0) + 1);
        } else if (I.ability === 'robuste') {
          u.mhp = Math.round(u.mhp * 1.1);
          u.hp = Math.min(u.mhp, Math.round(u.hp * 1.1));
        } else if (I.ability === 'garde') {
          u.guard = Math.max(u.guard || 0, 2);
        }
      });
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.unitAbility !== 'regen' || u.ko || u.hp >= u.mhp || u.side !== 'a') {
        return;
      }
      const g = Math.max(1, Math.round(u.mhp * 0.08));
      u.hp = Math.min(u.mhp, u.hp + g);
      if (Array.isArray(ev)) {
        pushMessage(ev, `Régénération : ${u.n} récupère ${g} PV.`);
      }
    });
  });
}
