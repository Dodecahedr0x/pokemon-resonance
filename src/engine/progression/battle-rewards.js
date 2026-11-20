/* End-of-battle progression: Bonds, captures, badges, League, fatigue, forms, gains, and the rewards summary. */

import { MV } from '../data/moves.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { BADGE_REWARD, ITEMS2, LINK_N, PROFILE, isCamp, lvlOfPts } from '../state/game-state.js';
import { winBadge } from '../modes/gyms.js';
import { medal } from '../core/utils.js';
import { renderLeague } from '../modes/league.js';
import { renderSquad } from '../team/team.js';
import { renderHome } from '../world/home.js';
import { fmt, today } from '../state/economy.js';
import { dailyDone, dailyKey } from '../modes/daily-battle.js';
import { renderWallet } from '../ui/wallet.js';
import { itemize } from '../assets/illustrations.js';
import { aplusProgress, aplusRewHtml } from '../modes/adventure-profile.js';

/* ---- end-of-battle progression ---- */
export function applyProgress(S) {
  const e0 = PROFILE.elite,
    forms0 = [...(PROFILE.forms || [])],
    D = SCEN[S.sc] || {},
    win = S.over === 'win',
    rew = { links: [], caught: [], items: [], gifts: [], tired: [], badgeNew: false };
  if (D.tuto) {
    PROFILE.tuto = 1;
  }
  const al = S.units.filter(u => u.side === 'a');
  Object.entries(D.rentalTeam ? {} : S.stats.pairs || {}).forEach(([k, v]) => {
    // rental team: no Bonds (v4.29)
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
    if (!PROFILE.dex.includes(base)) {
      PROFILE.dex.push(base);
    }
    const nw = !PROFILE.box.includes(base); // Free mode too (v4.21)
    if (nw) {
      PROFILE.box.push(base);
    }
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
  if (isCamp() && !D.rentalTeam) {
    const used = al.map(u => u.sp);
    PROFILE.box.forEach(id => {
      const f = PROFILE.fatigue[id] || 0;
      PROFILE.fatigue[id] = used.includes(id) ? Math.min(100, f + 30) : Math.max(0, f - 25);
      if (!PROFILE.fatigue[id]) {
        delete PROFILE.fatigue[id];
      }
    });
    rew.tired = used.filter(id => (PROFILE.fatigue[id] || 0) >= 70);
  }
  if (!D.tuto && !D.rentalTeam) {
    const atk = [
        ...new Set(
          al.flatMap(u =>
            u.mv
              .map(id => MV[id])
              .filter(m => m.p || m.fix)
              .map(m => m.t)
          )
        ),
      ],
      def = [...new Set(al.flatMap(u => u.t))];
    PROFILE.history.push({ atk, def, rx: Object.assign({}, S.stats.rxk || {}) });
    if (PROFILE.history.length > 10) {
      PROFILE.history = PROFILE.history.slice(-10);
    }
  }
  setTimeout(() => {
    renderSquad();
    renderLeague();
    renderHome();
  }, 0);
  // campaign: forms reached in battle become recruits
  rew.forms = [];
  if (isCamp() && !D.rentalTeam) {
    PROFILE.forms = PROFILE.forms || [];
    (S.stats.evl || []).forEach(([, id]) => {
      if (BY[id] && BY[id].st > 1 && !PROFILE.forms.includes(id)) {
        PROFILE.forms.push(id);
        if (!forms0.includes(id)) {
          rew.forms.push(id);
        }
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
    if (win && D.elite && PROFILE.elite > e0) {
      m += 600;
    }
    if (win && D.champ) {
      m += e0 < 5 ? 1500 : 600;
      if (e0 < 5) {
        g += 20;
      }
    }
    m += (rew.caught || []).length * 50;
    if (win && S.rank === 'S' && S.rankNew) {
      g += 5;
    }
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
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  aplusProgress(S, rew); // shinies, rival, legends, Tower (v4.4)
  return rew;
}

export function rewHtml(r) {
  if (!r) {
    return '';
  }
  const o = [];
  if (r.caught.length) {
    o.push(
      `<div class="result-list"><h4>Capturés</h4>${r.caught.map(c => `<div class="result-row">${medal(BY[c.id].t)}<span>${BY[c.id].n}${c.nw ? ` · ${BY[c.base].n} rejoint votre Box` : ''}</span><b>${c.nw ? 'Nouveau' : '✓'}</b></div>`).join('')}</div>`
    );
  }
  if (r.items.length || r.gifts.length) {
    o.push(
      `<div class="result-list"><h4>Récompenses d’arène</h4>${r.items.map(k => `<div class="result-row"><span class="it-ic"><svg viewBox="0 0 24 24"><path d="${ITEMS2[k].i}"/></svg></span><span>${ITEMS2[k].n} · ${ITEMS2[k].d}</span><b>Objet</b></div>`).join('')}${r.gifts.map(id => `<div class="result-row">${medal(BY[id].t)}<span>${BY[id].n} rejoint votre Box</span><b>Recrue</b></div>`).join('')}</div>`
    );
  }
  if (r.elite) {
    o.push(
      `<div class="result-list"><h4>Conseil 4</h4><div class="result-row"><span>${r.elite < 4 ? `${r.elite} membre${r.elite > 1 ? 's' : ''} sur 4 vaincu${r.elite > 1 ? 's' : ''}.` : 'Le Conseil 4 est vaincu. Le Champion vous attend.'}</span><b>${r.elite} / 4</b></div></div>`
    );
  }
  if (r.champ) {
    o.push(
      `<div class="result-list is-champion"><h4>Maître de la Ligue</h4><div class="result-row"><span>Vous avez battu un Champion qui avait étudié vos combats.</span><b>★</b></div></div>`
    );
  }
  if (r.links.length) {
    o.push(
      `<div class="result-list"><h4>Liens gagnés</h4>${r.links.map(l => `<div class="result-row">${medal(BY[l.a].t)}${medal(BY[l.b].t)}<span>${BY[l.a].n} et ${BY[l.b].n}${l.x2 ? ' · ×2 sans évoluer' : ''}${l.to > l.from ? ` · palier ${LINK_N[l.to]} atteint` : ''}</span><b>+${l.pts}</b></div>`).join('')}</div>`
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
      `<div class="result-list is-gains"><h4>Gains</h4><div class="result-row"><span class="coin-icon" aria-hidden="true">₽</span><span>${r.daily ? 'Défi du jour relevé : gains doublés' : 'Prime de combat'}</span><b>+${fmt(r.money)} ₽</b></div>${r.gems ? `<div class="result-row"><span class="gem-icon" aria-hidden="true"><svg><use href="#i-gem"/></svg></span><span>Éclats de Résonance</span><b>+${r.gems}</b></div>` : ''}</div>` +
      h;
  } // end-of-battle gains
  return itemize(h); // illustrated items
}
