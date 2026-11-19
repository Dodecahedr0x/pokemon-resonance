/* Save fields of the v4.29 gameplay-quality release: seen tips, rivals met, challenge of the week. */

export function QUALITY_PASS_0() {
  return { seenTips: {}, rivalsMet: [], hebdo429: null };
}

export function qualityPassClean(p) {
  const o = QUALITY_PASS_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (p.seenTips && typeof p.seenTips === 'object') {
    Object.keys(p.seenTips).forEach(k => /^[a-z]{2,12}$/.test(k) && (o.seenTips[k] = 1));
  }
  if (Array.isArray(p.rivalsMet)) {
    o.rivalsMet = [...new Set(p.rivalsMet.filter(x => ['rv5', 'rv6', 'hd429'].includes(x)))];
  }
  const h = p.hebdo429;
  if (h && typeof h === 'object' && typeof h.w === 'string' && /^\d{4}-S\d\d$/.test(h.w)) {
    o.hebdo429 = {
      w: h.w,
      best: Number.isFinite(h.best) ? Math.max(0, Math.min(99999, Math.floor(h.best))) : 0,
      n: Number.isFinite(h.n) ? Math.max(0, Math.min(999, Math.floor(h.n))) : 0,
      rec: h.rec ? 1 : 0,
      win: h.win ? 1 : 0,
    };
  }
  return o;
}
