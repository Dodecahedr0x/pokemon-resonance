import { createElement, Fragment } from 'react';

// Convertit un fragment HTML de confiance (textes du jeu avec <b>, icônes produites par
// le moteur : medal(), tb(), badgeSvg()…) en vrais éléments React, sans élément
// enveloppe : la structure du DOM reste celle du moteur, donc le CSS s'applique pareil.

const RENAME = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  autocomplete: 'autoComplete',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  inputmode: 'inputMode',
  'xlink:href': 'xlinkHref',
};
const BOOLEAN = new Set(['disabled', 'hidden', 'open', 'checked', 'selected', 'multiple', 'required', 'autofocus', 'readonly']);
const camel = s => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());

export function parseStyle(css) {
  const out = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) continue;
    out[k.startsWith('--') ? k : camel(k)] = v;
  }
  return out;
}

// Image du médaillon (medal) : sans illustration, le médaillon garde son pictogramme de type.
function onImgError(e) {
  const img = e.currentTarget;
  img.parentNode?.classList.remove('pk');
  img.remove();
}

function convert(node, key) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;
  const svg = node.namespaceURI === 'http://www.w3.org/2000/svg';
  const props = { key };
  for (const { name, value } of node.attributes) {
    if (name === 'style') props.style = parseStyle(value);
    else if (name.startsWith('on')) {
      if (name === 'onerror' && node.localName === 'img') props.onError = onImgError;
    } else if (RENAME[name]) props[RENAME[name]] = BOOLEAN.has(name) ? true : value;
    else if (BOOLEAN.has(name)) props[name] = true;
    else if (svg && name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')) props[camel(name)] = value;
    else props[name] = value;
  }
  const kids = [...(node.localName === 'template' ? node.content.childNodes : node.childNodes)];
  return createElement(node.localName, props, ...kids.map((k, i) => convert(k, i)));
}

const cache = new Map();

export function htmlToReact(html) {
  if (html == null || html === '') return null;
  html = String(html);
  if (!html.includes('<') && !html.includes('&')) return html;
  let out = cache.get(html);
  if (out === undefined) {
    const t = document.createElement('template');
    t.innerHTML = html;
    const nodes = [...t.content.childNodes].map((n, i) => convert(n, i));
    out = nodes.length === 1 ? nodes[0] : nodes;
    if (cache.size > 2000) cache.clear();
    cache.set(html, out);
  }
  return out;
}

// <Html html="…" /> : le fragment, sans enveloppe.
export function Html({ html }) {
  return createElement(Fragment, null, htmlToReact(html));
}
