// Displayed Power of a move (MV[id]): "Puissance 8" (or "Puiss. 8" depending on `mot`),
// "12 fixes" for fixed damage, "Effet" without damage.
export const strength = (m, token = 'Puissance') => (m.p ? token + ' ' + m.p : m.fix ? m.fix + ' fixes' : 'Effet');
