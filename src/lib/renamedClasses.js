// Class names that were renamed, old → new. Players' Design Workshop CSS (saved in their preferences) may still
// target the old names, so its selectors are translated before it is applied. Add an entry for each renamed shared
// class a player is likely to have styled.
export const RENAMED_CLASSES = {
  b: 'button',
  'b-sm': 'button-small',
  'b-lg': 'button-large',
  'b-gold': 'button-primary',
  'b-ghost': 'button-ghost',
  ph: 'page-header',
  'ph-sm': 'page-header-wide',
  'v4-ph-page': 'page-header-wide',
  kick: 'kicker',
  h1: 'title',
  sub: 'lead',
  'v4-panel': 'card',
  'v4-ph': 'card-header',
  'v4-cnt': 'card-count',
  'v4-fld': 'form-field',
  'lbl-s': 'caption',
  h2: 'section-title',
  h3: 'card-title',
  sec: 'section',
  'sec-h': 'section-header',
  tb: 'type-badge',
  'tb-s': 'type-badge-icon',
  stt: 'status-badge',
  enp: 'energy-pips',
  rg: 'rank-tag',
  ri: 'role-icon',
  'mdl-a': 'medal-art',
  'rg-faible': 'rank-faible',
  'rg-moyen': 'rank-moyen',
  'rg-fort': 'rank-fort',
  'rg-expert': 'rank-expert',
  'v4-hero-slot': 'home-hero-slot',
  'v4-hero': 'home-hero',
  'hero-banner-on': 'has-backdrop',
  'hero-banner': 'home-hero-backdrop',
  'hero-banner-bg': 'home-hero-landscape',
  'hero-banner-tod': 'home-hero-daylight',
  'hero-banner-shade': 'home-hero-shade',
  'hero-banner-tag': 'home-hero-place',
  'hero-banner-comp': 'home-hero-companion',
  'hero-banner-sol': 'home-hero-companion-shadow',
  'hero-banner-n': 'home-hero-companion-name',
  'heroenv-s': 'home-hero-season',
  'heroenv-w': 'home-hero-weather',
  'heroenv-c': 'home-hero-forecast',
  'v4h-body': 'home-hero-body',
  'v4-kick': 'home-hero-kicker',
  'v4h-emb': 'home-hero-emblem',
  'v4h-title': 'home-hero-title',
  'v4h-sub': 'home-hero-lead',
  'v4h-chips': 'home-hero-chips',
  'v4h-cta': 'home-hero-actions',
  'v4-cta': 'home-hero-start',
  'v4-cta-ic': 'home-hero-start-icon',
  'v4h-prof': 'home-hero-professor',
};

const OLD_CLASS = new RegExp(
  `\\.(${Object.keys(RENAMED_CLASSES)
    .sort((a, b) => b.length - a.length)
    .join('|')})(?![\\w-])`,
  'g'
);

/** The same CSS with every old class selector replaced by its new name. */
export function renameClassesInCss(css) {
  return css.replace(OLD_CLASS, (_match, oldName) => '.' + RENAMED_CLASSES[oldName]);
}
