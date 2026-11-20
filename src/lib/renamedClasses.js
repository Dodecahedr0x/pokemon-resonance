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
