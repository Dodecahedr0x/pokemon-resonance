/* Section d'origine : v4.13-01-roster-technique.js */

import { TYPES } from './004-data.js';
import { MV } from './005-moves.js';
import { MKT, PKT } from './009-pokemon.js';
import { CROCHETS } from './015-hooks.js';
import { HOSTILE, NEEDU, P, byUid, damage, dmgOf, flies, rewardIn, hdist, heal, inReach, landed, markAt, nbrK, retarget, say, setMark, shove, stun, teff, uk } from './021-combat-engine.js';
import { FOURNISSEURS_DEGATS, FOURNISSEURS_ROLES } from './044-tactical-engine.js';
import { hourOf } from './046-living-board.js';
import { SOI412 } from './051-epic-tms.js';

export let PRE413;


/* ---------- après chaque cible touchée ---------- */
export function afterHit413(S, u, m, v, x, mk, typ, ev) {
  if (!(m.p || m.fix) || v === u) return;
  v.dtype = typ; // pour Conversion 2
  if (m.fx === 'onde' && v.side !== u.side) (S._ondes = S._ondes || []).push({ uid: v.uid, x });
  if (m.fx === 'triple' && !v.ko && v.side !== u.side) {
    let n = 1;
    for (let i = 0; i < 2 && !v.ko; i++) {
      const d = dmgOf(S, u, m, v, typ, 1);
      if (d > 0) {
        damage(S, v, d, ev, {});
        n++;
      }
    }
    if (n > 1) say(ev, `Triple Pied : ${n} coups !`);
  }
  if (v.tal === 'corpsmaudit' && v.side !== u.side && !u.ko && hdist(u.pos, v.pos) === 1) {
    if (u.tal === 'regardvif' || rune413(S, u)) return;
    u.web = Math.max(u.web, 2);
    say(ev, `Corps Maudit : ${u.n} est ralenti.`);
  }
}


/* ---------- fin de la capacité ---------- */
export function end413(S, u, m, k, v0, v1, dealt, ev) {
  if (S._ondes) {
    const L = S._ondes;
    S._ondes = null;
    L.forEach(o => {
      const w = byUid(S, o.uid);
      if (w && !w.ko) shove(S, w, o.x === k ? u.pos : P(k), 1, ev, false); // depuis le centre de la vague
    });
  }
  if (m.fx === 'gboost' && dealt > 0 && !u.ko) {
    u.boost = Math.max(u.boost, 2);
    say(ev, `${u.n} est Renforcé.`);
  }
  if (m.fx === 'elecanon') {
    if (v1 && v1.side !== u.side) stun(S, v1, 'PAR', ev);
    if (!u.ko) {
      u.skip = 1;
      u.badge = 'REC';
      say(ev, `${u.n} doit recharger.`);
    }
  }
  if (m.fx === 'changeeclair' && !u.ko) {
    const a = S.units
      .filter(o => !o.ko && o !== u && o.side === u.side && hdist(o.pos, u.pos) <= 4 && o.hp < o.mhp && !o.colosse && !o.seg)
      .sort((p, q) => p.hp / p.mhp - q.hp / q.mhp)[0];
    if (a) {
      const pa = u.pos;
      u.pos = a.pos;
      a.pos = pa;
      ev.push({ e: 'mv', u: u.uid }, { e: 'mv', u: a.uid });
      say(ev, `Change Éclair : ${u.n} échange sa place avec ${a.n}.`);
      landed(S, a, ev);
    }
  }
  if (m.fx === 'voltige' && !v0 && !u.ko) {
    say(ev, `${u.n} frappe le vide et s’écrase !`);
    damage(S, u, Math.max(1, Math.round(u.mhp * 0.25)), ev, { ind: true, reflet: true });
  }
  if (m.fx === 'escalade') {
    u.roulN = u.roulR === S.round - 1 ? Math.min(3, (u.roulN || 0) + 1) : 1;
    u.roulR = S.round;
  }
  if (m.fx === 'confond' && v1 && v1.side === 'e' && !v1.ko) retarget(S, v1, u, 'confuse', ev);
  if (m.fx === 'tourrapide' && !u.ko) {
    const lib = [u, ...S.units.filter(o => !o.ko && o.side === u.side && o !== u && hdist(o.pos, u.pos) === 1)];
    lib.forEach(o => {
      o.web = 0;
      o.root = 0;
    });
    let n = 0;
    [uk(u), ...nbrK(uk(u))].forEach(x => {
      const t = S.tiles[x];
      if (t && t.trap && t.trap.side !== u.side) {
        t.trap = null;
        n++;
        ev.push({ e: 'terrain', k: x });
      }
    });
    say(ev, `Tour Rapide : ${u.n} se libère${lib.length > 1 ? ' avec ses voisins' : ''}${n ? ` et détruit ${n} piège${n > 1 ? 's' : ''}` : ''}.`);
  }
  if (m.fx === 'explosion' && !u.ko) {
    u.hp = 0;
    u.ko = true;
    u.intent = null;
    ev.push({ e: 'ko', u: u.uid });
    say(ev, `${u.n} est K.O. après son Explosion.`);
    if (u.side === 'e') S.stats.ko++;
    else
      S.units.forEach(o => {
        if (o.side === 'a' && !o.ko && o !== u) rewardIn(S, o, 1, ev);
      });
  }
}


/* ---------- Riposte, Voile Miroir, Prélèvement Destin ---------- */
export function reflections413(S, v, real, ev) {
  const a = S.lastAtk && byUid(S, S.lastAtk);
  if (!a || a === v || a.ko || a.side === v.side) return;
  const d = hdist(a.pos, v.pos);
  if (!v.ko && ((v.riposte > 0 && d === 1) || (v.miroir > 0 && d >= 2))) {
    say(ev, `${v.riposte > 0 && d === 1 ? 'Riposte' : 'Voile Miroir'} : ${v.n} renvoie le coup à ${a.n} !`);
    damage(S, a, Math.max(1, Math.round(real * 2)), ev, { reflet: true });
  }
  if (v.ko && v.destin > 0) {
    v.destin = 0;
    say(ev, `Prélèvem. Destin : ${a.n} paie le prix !`);
    damage(S, a, Math.max(1, Math.round(a.mhp * 0.5)), ev, { ind: true, reflet: true });
  }
}


/* ---------- Mouvement ---------- */
export function bonusMove413(S, u) {
  let b = 0;
  if (S.gravite > 0) b -= 1;
  if (u.agile > 0) b += 1;
  if (u.tal === 'surfcaudal' && markAt(S, uk(u)) === 'charge') b += 2;
  if (S.units.some(o => !o.ko && o.side !== u.side && o.tal === 'marqueombre' && hdist(o.pos, u.pos) === 1)) b -= 2;
  return b;
}


/* ---------- fin de manche ---------- */
export function durations413(S, ev) {
  S.units.forEach(u => {
    if (u.ko) return;
    if (u.tal === 'regeforce' && u.hp < u.mhp) heal(S, u, 3, ev);
    if (u.tal === 'cuvette' && S.wx && S.wx.k === 'pluie' && u.hp < u.mhp) heal(S, u, 4, ev);
    if (u.tal === 'forcesoleil' && S.wx && S.wx.k === 'soleil') {
      say(ev, `Force Soleil : ${u.n} brûle sous le soleil.`);
      damage(S, u, 2, ev, { ind: true });
    }
    if (!u.ko && S.champ && S.champ[u.side] > 0 && markAt(S, uk(u)) === 'enracine' && u.hp < u.mhp) heal(S, u, 4, ev);
    if (!u.ko && u.anneau > 0) {
      heal(S, u, Math.round(u.mhp * 0.1), ev);
      u.anneau--;
    }
    if (!u.ko && u.maudit > 0) {
      say(ev, `${u.n} souffre de la malédiction.`);
      damage(S, u, Math.max(1, Math.round(u.mhp * 0.12)), ev, { ind: true });
      u.maudit--;
    }
    if (!u.ko && u.requiem > 0 && --u.requiem === 0) {
      say(ev, `Requiem : le chant s’achève pour ${u.n} !`);
      damage(S, u, Math.max(1, Math.round(u.mhp * 0.4)), ev, { ind: true });
    }
    ['affaibli', 'agile', 'cogno'].forEach(f => {
      if (u[f] > 0) u[f]--;
    });
    u.riposte = 0;
    u.miroir = 0;
    u.destin = 0;
    u.touche = false; // Mitra-Poing : nouvelle manche
  });
  if (S.champ) for (const c in S.champ) if (S.champ[c] > 0 && --S.champ[c] === 0) say(ev, 'Le Champ Herbu se dissipe.');
  if (S.rune) for (const c in S.rune) if (S.rune[c] > 0 && --S.rune[c] === 0) say(ev, 'Rune Protect se dissipe.');
  if (S.gravite > 0 && --S.gravite === 0) {
    if (S.mut !== 'gravite') S.units.forEach(o => (o.cloue = false));
    say(ev, 'La Gravité se dissipe.');
  }
}


/* IA adverse : quand aucune attaque ne porte, un Pokémon de soutien (Qulbutoké, Métamorph…)
   joue sa capacité plutôt que d’attendre. Ne change rien aux adversaires qui ont une attaque à portée. */
export function aiSupport413(S, e, opts, al, here) {
  let best = null;
  const prend = (sc, pk, mid, k) => {
    if (sc > 0 && (!best || sc > best.sc)) best = { sc, pk, mid, k };
  };
  const pv = e.hp / e.mhp,
    contact = al.filter(a => hdist(a.pos, e.pos) === 1).length,
    nearby = al.filter(a => hdist(a.pos, e.pos) <= 3).length;
  e.mv.forEach(mid => {
    const m = MV[mid];
    if (!m || m.p || m.fix || m.wx) return;
    if (m.sh === 'self') {
      const v =
        {
          riposte: contact ? 6 : 0,
          miroir: nearby > contact ? 5 : 0,
          destin: pv < 0.4 && nearby ? 7 : 0,
          cognobidon: pv > 0.6 && !(e.cogno > 0) && nearby ? 5 : 0,
          paresse: pv < 0.6 ? 6 : 0,
          clairdelune: pv < 0.6 ? 6 : 0,
          dansedraco: !(e.agile > 0) ? 3 : 0,
          anneauhydro: !(e.anneau > 0) && pv < 0.8 ? 4 : 0,
          runeprotect: !(S.rune && S.rune[e.side] > 0) ? 3 : 0,
          champherbu: !(S.champ && S.champ[e.side] > 0) ? 3 : 0,
          gravite: !(S.gravite > 0) && al.some(flies) ? 4 : 0,
          requiem: al.some(a => hdist(a.pos, e.pos) <= 2 && !(a.requiem > 0)) ? 5 : 0,
          conversion2: e.dtype && teff(e.dtype, e.t) >= 1 ? 4 : 0
        }[m.fx] || 0;
      prend(v, here, mid, here);
      return;
    }
    if (!['morphing', 'malediction', 'feufollet'].includes(m.fx) || (m.fx === 'morphing' && e.morph)) return;
    for (const pk in opts) {
      const sim = Object.assign({}, e, { pos: P(pk) });
      al.forEach(a => {
        if (!inReach(S, sim, m, uk(a)) || a.colosse || a.seg) return;
        if (m.fx === 'feufollet' && (a.bru > 0 || a.t.includes('Feu') || a.tal === 'torche')) return;
        if (m.fx === 'malediction' && (a.maudit > 0 || pv < 0.4)) return;
        prend((m.fx === 'morphing' ? 8 + a.s[1] : 5) - (pk === here ? 0 : 0.5), pk, mid, uk(a));
      });
    }
  });
  return best;
}

/* Mécaniques des capacités signature et des nouveaux talents. Tout passe par des
   tables (SOI412 / PRE413 / CIBLE412 / apresCoup413 / fin413) et par les fournisseurs
   de dégâts : les règles existantes ne changent pas. */
export const rune413 = (S, v) => !!(v && S && S.rune && S.rune[v.side] > 0);

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

NEEDU.push('morphing', 'malediction', 'feufollet', 'vantardise');


HOSTILE.push('malediction', 'feufollet');


/* ---------- capacités sur soi ---------- */
Object.assign(SOI412, {
  champherbu(S, u, ev) {
    nbrK(uk(u)).forEach(x => setMark(S, x, 'enracine', u.uid));
    S.champ = Object.assign({}, S.champ, { [u.side]: 3 });
    say(ev, 'Champ Herbu : les cases Enracinées soignent votre équipe pendant 3 manches.');
  },
  gravite(S, u, ev) {
    S.gravite = 4;
    S.units.forEach(o => (o.cloue = true));
    say(ev, 'Gravité : plus personne ne vole ni ne lévite pendant 4 manches, et chacun perd 1 Mouvement.');
  },
  dansedraco(S, u, ev) {
    u.boost = Math.max(u.boost, 2);
    u.agile = 2;
    say(ev, `${u.n} danse : Renforcé et +1 Mouvement pendant 2 manches.`);
  },
  anneauhydro(S, u, ev) {
    nbrK(uk(u)).forEach(x => setMark(S, x, 'trempe', u.uid));
    u.anneau = 4;
    say(ev, `${u.n} s’entoure d’un anneau d’eau.`);
  },
  runeprotect(S, u, ev) {
    S.rune = Object.assign({}, S.rune, { [u.side]: 3 });
    say(ev, 'Rune Protect : votre équipe est protégée des statuts et des entraves pendant 3 manches.');
  },
  clairdelune(S, u, ev) {
    heal(S, u, Math.round(u.mhp * (hourOf(S) === 'nuit' ? 0.5 : 0.3)), ev);
    u.guard = 2;
    say(ev, `${u.n} se baigne de clair de lune : +2 Garde.`);
  },
  cognobidon(S, u, ev) {
    const c = Math.floor(u.hp / 2);
    if (c < 1) {
      say(ev, `${u.n} est trop faible pour Cognobidon.`);
      return;
    }
    u.hp -= c;
    ev.push({ e: 'dmg', u: u.uid, v: c });
    u.cogno = 3;
    say(ev, `Cognobidon : ${u.n} sacrifie ${c} PV, ses attaques font ×2 pendant 3 manches.`);
  },
  requiem(S, u, ev) {
    const t = S.units.filter(o => !o.ko && o.side !== u.side && hdist(o.pos, u.pos) <= 2 && !(o.requiem > 0));
    t.forEach(o => (o.requiem = 3));
    say(
      ev,
      t.length
        ? `Requiem : ${t.map(o => o.n).join(', ')} ${t.length > 1 ? 'entendent' : 'entend'} le chant. Dans 3 manches…`
        : 'Requiem : personne n’est assez près pour entendre le chant.'
    );
  },
  paresse(S, u, ev) {
    heal(S, u, Math.round(u.mhp * 0.5), ev);
    u.guard = 2;
    say(ev, `${u.n} paresse : +2 Garde.`);
  },
  conversion(S, u, ev) {
    const mk = markAt(S, uk(u)),
      t = mk ? MKT[mk] : 'Normal';
    u.t = [t];
    PKT.set(u.t, u.id);
    say(ev, `Conversion : ${u.n} devient de type ${t}.`);
  },
  conversion2(S, u, ev) {
    if (!u.dtype) {
      say(ev, `${u.n} n’a encore reçu aucune attaque : Conversion 2 échoue.`);
      return;
    }
    let best = null,
      bv = 9;
    Object.keys(TYPES).forEach(t => {
      const e = teff(u.dtype, [t]);
      if (e < bv) {
        bv = e;
        best = t;
      }
    });
    if (!best || bv >= 1) {
      say(ev, 'Conversion 2 échoue.');
      return;
    }
    u.t = [best];
    PKT.set(u.t, u.id);
    say(ev, `Conversion 2 : ${u.n} devient de type ${best} et résiste au type ${u.dtype}.`);
  },
  riposte(S, u, ev) {
    u.riposte = 1;
    say(ev, `${u.n} se prépare à riposter au contact.`);
  },
  miroir(S, u, ev) {
    u.miroir = 1;
    say(ev, `${u.n} dresse un Voile Miroir contre les attaques à distance.`);
  },
  destin(S, u, ev) {
    u.destin = 1;
    say(ev, `${u.n} lie son destin à celui de son prochain agresseur.`);
  }
});


/* ---------- capacités sur une cible, sans dégâts ---------- */
PRE413 = {
  malediction(S, u, m, v, ev) {
    if (v.side === u.side) return;
    damage(S, u, Math.max(1, Math.round(u.mhp * 0.25)), ev, { ind: true, reflet: true });
    if (u.ko) return;
    v.maudit = 4;
    say(ev, `Malédiction : ${v.n} est maudit et s’affaiblira pendant 4 manches.`);
  },
  feufollet(S, u, m, v, ev) {
    if (v.side === u.side) return;
    if (v.t.includes('Feu') || v.tal === 'torche') {
      say(ev, `${v.n} ne craint pas les flammes.`);
      return;
    }
    if (rune413(S, v)) {
      say(ev, `Rune Protect : ${v.n} est protégé.`);
      return;
    }
    v.bru = Math.max(v.bru, 3);
    v.affaibli = 3;
    ev.push({ e: 'st', u: v.uid, s: 'BRÛ' });
    say(ev, `${v.n} est brûlé : il frappera moins fort.`);
  },
  vantardise(S, u, m, v, ev) {
    if (v.side !== u.side) retarget(S, v, u, 'confuse', ev);
    v.boost = Math.max(v.boost, 2);
    say(ev, `${v.n} se gonfle d’orgueil : Renforcé pendant 2 manches.`);
  },
  morphing(S, u, m, v, ev) {
    if (v === u || v.colosse || v.seg) {
      say(ev, 'Morphing échoue.');
      return;
    }
    u.t = [...v.t];
    u.s = [u.s[0], ...v.s.slice(1)];
    u.mv = v.mv.filter(x => x !== 'morphing' && MV[x]);
    if (u.ctm && !u.mv.includes(u.ctm)) u.mv.push(u.ctm);
    u.tal = v.tal;
    u.morph = v.id;
    PKT.set(u.t, v.id); // il prend aussi son apparence
    ev.push({ e: 'st', u: u.uid, s: 'MORPH' });
    say(ev, `Morphing : ${u.n} prend l’apparence de ${v.n} !`);
  }
};


/* ---------- dégâts : signatures et talents ---------- */
FOURNISSEURS_DEGATS.push(
  { id: 'eruption', fournir: (c, { u, m }) => m.fx === 'eruption' && { mul: 0.6 + 0.8 * (u.hp / u.mhp), libelle: 'Éruption' } },
  {
    id: 'gyro',
    fournir: (c, { u, m, t }) => m.fx === 'gyro' && { mul: Math.max(1, Math.min(2, 1 + 0.25 * ((t.s[3] || 0) - (u.s[3] || 0)))), libelle: 'Gyroballe' }
  },
  { id: 'escalade', fournir: (c, { S, u, m }) => m.fx === 'escalade' && u.roulR === S.round - 1 && u.roulN > 0 && { mul: 1 + 0.5 * u.roulN, libelle: 'Roulade' } },
  { id: 'technicien', fournir: (c, { u, m }) => u.tal === 'technicien' && m.p > 0 && m.p <= 7 && { mul: 1.5, libelle: 'Technicien' } },
  { id: 'poingdefer', fournir: (c, { u, m }) => u.tal === 'poingdefer' && m.r === 1 && m.p > 0 && { mul: 1.2, libelle: 'Poing de Fer' } },
  { id: 'chasseur', fournir: (c, { u, t }) => u.tal === 'chasseur' && t.hp <= t.mhp / 2 && { mul: 1.3, libelle: 'Chasseur' } },
  { id: 'temeraire', fournir: (c, { u, m }) => u.tal === 'temeraire' && (m.fx === 'recoil' || m.fx === 'voltige') && { mul: 1.3, libelle: 'Téméraire' } },
  { id: 'forcesoleil', fournir: (c, { S, u, typ }) => u.tal === 'forcesoleil' && typ === 'Feu' && S.wx && S.wx.k === 'soleil' && { mul: 1.5, libelle: 'Force Soleil' } },
  { id: 'cogno', fournir: (c, { u }) => u.cogno > 0 && { mul: 2, libelle: 'Cognobidon' } },
  { id: 'poursuite', fournir: (c, { S, m, t }) => m.fx === 'poursuite' && t.mvR === S.round && { mul: 1.5, libelle: 'Poursuite' } }
);


FOURNISSEURS_ROLES.push({
  id: 'gardeami',
  fournir: (c, { S, t }) =>
    S.units.some(o => !o.ko && o !== t && o.side === t.side && o.tal === 'gardeami' && hdist(o.pos, t.pos) === 1) && { add: -2, libelle: 'Garde-Ami' }
});


/* Téléchargement : entre en combat avec +2 Garde */
CROCHETS.creation.push(S => {
  S.units.forEach(u => {
    if (u.tal === 'telechargement') u.guard = Math.max(u.guard, 2);
  });
});
}
