// Puissance affichée d'une capacité (MV[id]) : « Puissance 8 » (ou « Puiss. 8 » selon `mot`),
// « 12 fixes » pour les dégâts fixes, « Effet » sans dégâts.
export const puissance = (m, mot = 'Puissance') => (m.p ? mot + ' ' + m.p : m.fix ? m.fix + ' fixes' : 'Effet');
