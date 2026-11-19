// Puissance affichée d'une capacité (MV[id]) : « Puissance 8 » (ou « Puiss. 8 » selon `mot`),
// « 12 fixes » pour les dégâts fixes, « Effet » sans dégâts.
export const strength = (m, token = 'Puissance') => (m.p ? token + ' ' + m.p : m.fix ? m.fix + ' fixes' : 'Effet');
