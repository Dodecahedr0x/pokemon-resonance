/* Original section: v4.13-00-signature-moves.js */

import { MV, TAL } from './005-moves.js';

// Startup statements, run in their original order (see index.js).
export function __init() {

/* =====================================================================
   v4.13: technical roster
   Every final form gains a signature move (3rd move), abilities
   change at each stage, roles are settled, and branching
   Awakenings multiply (Politoed, Slowking, Debugant).
   ===================================================================== */
Object.assign(MV, {
  vegeattak: { n: 'Végé-Attak', t: 'Plante', p: 14, r: 3, sh: 'line', mk: 'enracine', fx: 'recharge', sig: 1, d: 'Signature. Ligne de 3, Enraciné, puis une manche de repos.' },
  rafalefeu: { n: 'Rafale Feu', t: 'Feu', p: 14, r: 1, sh: 'cone', mk: 'brulant', fx: 'recharge', sig: 1, d: 'Signature. Cône de 3 cases, Brûlant, puis une manche de repos.' },
  hydroblast: { n: 'Hydroblast', t: 'Eau', p: 12, r: 4, sh: 'line', mk: 'trempe', fx: 'push', v: 1, sig: 1, d: 'Signature. Ligne de 4, Trempé, repousse la cible visée.' },
  champherbu: { n: 'Champ Herbu', t: 'Plante', p: 0, r: 0, sh: 'self', fx: 'champherbu', sig: 1, d: 'Signature. Les 6 cases autour deviennent Enracinées ; pendant 3 manches, vos Pokémon sur une case Enracinée récupèrent 4 PV par manche.' },
  eruption: { n: 'Éruption', t: 'Feu', p: 12, r: 2, sh: 'area', mk: 'brulant', fx: 'eruption', sig: 1, d: 'Signature. Zone de 7 cases à 2 cases, Brûlant, alliés compris. ×1,4 à pleins PV, ×1 à mi-PV, ×0,6 à bout de forces.' },
  aquajet: { n: 'Aqua-Jet', t: 'Eau', p: 8, r: 3, sh: 'one', prio: 1, mk: 'trempe', fx: 'frappefuite', sig: 1, d: 'Signature. Portée 3, Trempé, priorité. Il peut encore se déplacer après avoir frappé.' },
  ventargente: { n: 'Vent Argenté', t: 'Insecte', p: 9, r: 3, sh: 'line', fx: 'gboost', sig: 1, d: 'Signature. Ligne de 3. Si elle touche, Papilusion est Renforcé (×1,5) pendant 2 manches.' },
  electacle: { n: 'Électacle', t: 'Électrik', p: 15, r: 1, sh: 'one', mk: 'charge', fx: 'recoil', sig: 1, d: 'Signature. Au contact, Chargé. Énorme, mais 25 % des dégâts en retour.' },
  gravite: { n: 'Gravité', t: 'Psy', p: 0, r: 0, sh: 'self', fx: 'gravite', sig: 1, d: 'Signature. Pendant 4 manches, plus personne ne vole ni ne lévite (le Sol touche tout le monde) et chacun perd 1 Mouvement.' },
  poisoncroix: { n: 'Poison-Croix', t: 'Poison', p: 11, r: 1, sh: 'one', fx: 'toxik', sig: 1, d: 'Signature. Au contact. Empoisonne : −3 PV par manche, 3 manches ; sur une case Trempée, le poison gagne l’eau reliée.' },
  vaguepsy: { n: 'Vague Psy', t: 'Psy', p: 10, r: 3, sh: 'area', fx: 'onde', sig: 1, d: 'Signature. Zone de 7 cases à 3 cases : chaque unité touchée est repoussée d’une case depuis le centre.' },
  elecanon: { n: 'Élécanon', t: 'Électrik', p: 9, r: 3, sh: 'one', mk: 'charge', fx: 'elecanon', sig: 1, d: 'Signature. Portée 3, Chargé : la cible est paralysée à coup sûr. Magnéton doit ensuite recharger.' },
  malediction: { n: 'Malédiction', t: 'Spectre', p: 0, r: 3, sh: 'one', fx: 'malediction', sig: 1, d: 'Signature. Ectoplasma sacrifie 25 % de ses PV : la cible perd 12 % de ses PV max à chaque fin de manche, 4 manches.' },
  gyroballe: { n: 'Gyroballe', t: 'Acier', p: 9, r: 1, sh: 'one', fx: 'gyro', sig: 1, d: 'Signature. Au contact. Plus la cible est rapide comparée à Steelix, plus le coup est fort (jusqu’à ×2).' },
  pistopoing: { n: 'Pisto-Poing', t: 'Acier', p: 7, r: 1, sh: 'one', prio: 2, fx: 'frappefuite', sig: 1, d: 'Signature. Au contact, priorité. Il peut encore se déplacer après avoir frappé.' },
  dracoqueue: { n: 'Draco-Queue', t: 'Dragon', p: 10, r: 1, sh: 'one', fx: 'push', v: 2, sig: 1, d: 'Signature. Au contact, aucune réaction, repousse de 2 cases.' },
  dansedraco: { n: 'Danse Draco', t: 'Dragon', p: 0, r: 0, sh: 'self', fx: 'dansedraco', sig: 1, d: 'Signature. Renforcé (×1,5) et +1 Mouvement pendant 2 manches.' },
  anneauhydro: { n: 'Anneau Hydro', t: 'Eau', p: 0, r: 0, sh: 'self', fx: 'anneauhydro', sig: 1, d: 'Signature. Les cases autour deviennent Trempées ; Aquali récupère 10 % de ses PV à chaque fin de manche, 4 manches.' },
  changeeclair: { n: 'Change Éclair', t: 'Électrik', p: 9, r: 3, sh: 'one', mk: 'charge', fx: 'changeeclair', sig: 1, d: 'Signature. Portée 3, Chargé, puis Voltali échange sa place avec l’allié le plus blessé (à 4 cases).' },
  feufollet: { n: 'Feu Follet', t: 'Feu', p: 0, r: 2, sh: 'one', fx: 'feufollet', sig: 1, d: 'Signature. Brûle la cible 3 manches ; brûlée ainsi, elle inflige 3 dégâts de moins.' },
  runeprotect: { n: 'Rune Protect', t: 'Psy', p: 0, r: 0, sh: 'self', fx: 'runeprotect', sig: 1, d: 'Signature. Pendant 3 manches, vos Pokémon sont protégés des statuts, brûlures, poisons et entraves.' },
  clairdelune: { n: 'Clair de Lune', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'clairdelune', sig: 1, d: 'Signature. Récupère 50 % des PV la nuit, 30 % le jour, et gagne +2 Garde.' },
  cognobidon: { n: 'Cognobidon', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'cognobidon', sig: 1, d: 'Signature. Perd la moitié de ses PV actuels : ses attaques font ×2 pendant 3 manches.' },
  laserglace: { n: 'Laser Glace', t: 'Glace', p: 9, r: 3, sh: 'line', mk: 'givre', sig: 1, d: 'Signature. Ligne de 3, Givré.' },
  lamederoc: { n: 'Lame de Roc', t: 'Roche', p: 13, r: 1, sh: 'one', fx: 'percegarde', sig: 1, d: 'Signature. Au contact, ignore toute la Garde de la cible.' },
  poursuite: { n: 'Poursuite', t: 'Ténèbres', p: 9, r: 2, sh: 'one', fx: 'poursuite', sig: 1, d: 'Signature. Portée 2. ×1,5 si la cible s’est déplacée cette manche.' },
  poingdynamique: { n: 'Poing Dynamique', t: 'Combat', p: 11, r: 1, sh: 'one', fx: 'confond', sig: 1, d: 'Signature. Au contact. La cible, désorientée, frappera l’unité la plus proche d’elle.' },
  requiem: { n: 'Requiem', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'requiem', sig: 1, d: 'Signature. Les adversaires à 2 cases entendent le chant : dans 3 manches, ils perdent 40 % de leurs PV max.' },
  paresse: { n: 'Paresse', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'paresse', sig: 1, d: 'Signature. Récupère 50 % des PV et gagne +2 Garde pendant 2 manches.' },
  vantardise: { n: 'Vantardise', t: 'Normal', p: 0, r: 2, sh: 'one', fx: 'vantardise', sig: 1, d: 'Signature. La cible, désorientée, frappera l’unité la plus proche d’elle… mais elle est Renforcée 2 manches.' },
  piedvoltige: { n: 'Pied Voltige', t: 'Combat', p: 16, r: 2, sh: 'one', fx: 'voltige', sig: 1, d: 'Signature. Saute à 2 cases. Si la case visée est vide, Kicklee s’écrase et perd 25 % de ses PV.' },
  mitrapoing: { n: 'Mitra-Poing', t: 'Combat', p: 20, r: 1, sh: 'one', fx: 'mitra', sig: 1, d: 'Signature. Au contact, dévastateur. Échoue si Tygnon est touché pendant la manche avant d’agir.' },
  triplepied: { n: 'Triple Pied', t: 'Combat', p: 5, r: 1, sh: 'one', fx: 'triple', sig: 1, d: 'Signature. Au contact, frappe 3 fois (la Garde compte à chaque coup).' },
  roulade: { n: 'Roulade', t: 'Roche', p: 7, r: 1, sh: 'one', fx: 'escalade', sig: 1, d: 'Signature. Au contact. Chaque manche où Donphan l’enchaîne, elle frappe plus fort (×1,5, ×2, ×2,5).' },
  explosion: { n: 'Explosion', t: 'Normal', p: 22, r: 0, sh: 'ring', fx: 'explosion', sig: 1, d: 'Signature. Les 6 cases autour, alliés compris, puis Foretress est K.O.' },
  conversion2: { n: 'Conversion 2', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'conversion2', sig: 1, d: 'Signature. Prend un type qui résiste au dernier type d’attaque qui l’a touché.' },
  conversion: { n: 'Conversion', t: 'Normal', p: 0, r: 0, sh: 'self', fx: 'conversion', d: 'Prend le type de la marque de sa case (Trempé = Eau, Brûlant = Feu…). Sans marque, redevient Normal.' },
  morphing: { n: 'Morphing', t: 'Normal', p: 0, r: 3, sh: 'one', fx: 'morphing', sig: 1, d: 'Copie une unité à 3 cases : types, statistiques (sauf les PV), capacités et talent, jusqu’à la fin du combat. Métamorph peut aussitôt utiliser une capacité copiée.' },
  riposte: { n: 'Riposte', t: 'Combat', p: 0, r: 0, sh: 'self', fx: 'riposte', sig: 1, d: 'Jusqu’à la fin de la manche, renvoie ×2 les dégâts des attaques reçues au contact.' },
  voilemiroir: { n: 'Voile Miroir', t: 'Psy', p: 0, r: 0, sh: 'self', fx: 'miroir', sig: 1, d: 'Jusqu’à la fin de la manche, renvoie ×2 les dégâts des attaques reçues à distance.' },
  destin: { n: 'Prélèvem. Destin', t: 'Spectre', p: 0, r: 0, sh: 'self', fx: 'destin', d: 'Jusqu’à la fin de la manche : si Qulbutoké est mis K.O., son attaquant perd 50 % de ses PV max.' },
  tourrapide: { n: 'Tour Rapide', t: 'Normal', p: 6, r: 1, sh: 'one', fx: 'tourrapide', d: 'Au contact. Libère le lanceur et ses alliés au contact des entraves, et détruit les pièges adverses autour de lui.' },
  triplattaque: { n: 'Triplattaque', t: 'Normal', p: 11, r: 3, sh: 'one', d: 'Portée 3. Avec Adaptabilité, prend l’élément de sa case.' }
});


Object.assign(TAL, {
  souplesse: ['Souplesse', 'Ne peut pas être paralysé.'],
  marqueombre: ['Marque Ombre', 'Les adversaires à son contact perdent 2 Mouvement.'],
  regeforce: ['Régé-Force', 'Récupère 3 PV à chaque fin de manche.'],
  poingdefer: ['Poing de Fer', 'Ses attaques au contact font ×1,2.'],
  technicien: ['Technicien', 'Ses attaques de puissance 7 ou moins font ×1,5.'],
  telechargement: ['Téléchargement', 'Entre en combat avec +2 Garde pendant 2 manches.'],
  forcesoleil: ['Force Soleil', 'Feu ×1,5 sous le Soleil, mais perd 2 PV par manche au Soleil.'],
  cuvette: ['Cuvette', 'Récupère 4 PV par manche sous la Pluie.'],
  paratonnerre: ['Paratonnerre', 'Les attaques Électrik ne le blessent pas : elles le renforcent.'],
  surfcaudal: ['Surf Caudal', '+2 Mouvement en partant d’une case Chargée.'],
  gardeami: ['Garde-Ami', 'Ses alliés au contact subissent 2 dégâts de moins.'],
  inconscient: ['Inconscient', 'Ignore les bonus de Garde de la cible (Armure, Protection, Ancrage, Coque).'],
  chasseur: ['Chasseur', '×1,3 contre une cible à la moitié de ses PV ou moins.'],
  corpsmaudit: ['Corps Maudit', 'Qui le frappe au contact est ralenti (−3 Mouvement, 2 manches).'],
  temeraire: ['Téméraire', 'Ses attaques à risque (contrecoup, Pied Voltige) font ×1,3.']
});
}
