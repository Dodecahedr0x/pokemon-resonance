import { createElement, Fragment } from 'react';
import { parseStyle } from '../../../lib/html.jsx';

// <SvgHtml html="…" /> : fragment SVG produit par une fonction du moteur (pièges, colosses,
// attaques chargées, terrain des stades…), analysé dans un <svg> pour garder l'espace de
// noms SVG, puis converti en éléments React sans enveloppe.
// Pas Html (lib/html.jsx) : celui-ci analyse hors <svg> et convertit les attributs autrement (« : », booléens, onerror).

const camel = s => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());

function convert(node, key) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;
  const props = { key };
  for (const { name, value } of node.attributes) {
    if (name === 'style') props.style = parseStyle(value);
    else if (name === 'class') props.className = value;
    else if (name.startsWith('data-') || name.startsWith('aria-')) props[name] = value;
    else if (name.includes('-') || name.includes(':')) props[camel(name)] = value;
    else props[name] = value;
  }
  return createElement(node.localName, props, ...[...node.childNodes].map((k, i) => convert(k, i)));
}

const cache = new Map();

export function svgToReact(html) {
  if (!html) return null;
  let out = cache.get(html);
  if (out === undefined) {
    const t = document.createElement('template');
    t.innerHTML = '<svg>' + html + '</svg>';
    out = [...t.content.firstChild.childNodes].map((n, i) => convert(n, i));
    if (cache.size > 2000) cache.clear();
    cache.set(html, out);
  }
  return out;
}

export function SvgHtml({ html }) {
  return createElement(Fragment, null, svgToReact(html));
}
