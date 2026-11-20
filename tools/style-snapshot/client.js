// Dev-only style snapshot, injected by the Vite plugin next to this file.
// In the browser console (or through the preview tools):
//   await styleSnapshot('settings-before', '#params')
// records the computed style and box of every element (and its ::before / ::after) under the root,
// keyed by its position in the DOM (tag, id and child index, never class names, so renaming classes
// keeps the keys). The file lands in .style-snapshots/<name>.json; compare two with
//   node tools/style-snapshot/diff.js settings-before settings-after

const PSEUDOS = ['', '::before', '::after'];

function pathOf(el, root) {
  const parts = [];
  for (let n = el; n && n !== root.parentElement; n = n.parentElement) {
    const index = n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) : 0;
    parts.unshift(n.localName + (n.id ? '#' + n.id : '') + ':' + index);
  }
  return parts.join('>');
}

function readStyle(el, pseudo) {
  const cs = getComputedStyle(el, pseudo || null);
  if (pseudo && (cs.content === 'none' || cs.content === 'normal')) {
    return null;
  }
  const out = {};
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    if (!prop.startsWith('--')) {
      out[prop] = cs.getPropertyValue(prop);
    }
  }
  return out;
}

function box(el) {
  const r = el.getBoundingClientRect();
  const round = v => Math.round(v * 2) / 2;
  return [round(r.left + scrollX), round(r.top + scrollY), round(r.width), round(r.height)].join(' ');
}

async function styleSnapshot(name, rootSelector = '#root') {
  const root = document.querySelector(rootSelector);
  if (!root) {
    throw new Error('No element matches ' + rootSelector);
  }
  // Make two captures comparable: one-shot animations and transitions jump to their end state
  // (entry animations), looping ones freeze at their start and resume afterwards.
  const animations = document.getAnimations().filter(a => {
    if (a.effect?.getComputedTiming().iterations !== Infinity) {
      a.finish();
      return false;
    }
    a.pause();
    a.currentTime = 0;
    return true;
  });

  const entries = {};
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const path = pathOf(el, root);
    for (const pseudo of PSEUDOS) {
      const style = readStyle(el, pseudo);
      if (style) {
        entries[path + pseudo] = { style, box: pseudo ? undefined : box(el) };
      }
    }
  }
  animations.forEach(a => a.play());

  // Store each property's most common value once, and only the deviations per element.
  const counts = {};
  for (const { style } of Object.values(entries)) {
    for (const [prop, value] of Object.entries(style)) {
      const c = (counts[prop] ??= {});
      c[value] = (c[value] || 0) + 1;
    }
  }
  const common = {};
  for (const [prop, values] of Object.entries(counts)) {
    common[prop] = Object.entries(values).sort((a, b) => b[1] - a[1])[0][0];
  }
  const elements = {};
  for (const [path, { style, box: b }] of Object.entries(entries)) {
    const own = {};
    for (const [prop, value] of Object.entries(style)) {
      if (common[prop] !== value) {
        own[prop] = value;
      }
    }
    elements[path] = b ? { box: b, style: own } : { style: own };
  }

  const snapshot = { name, root: rootSelector, viewport: `${innerWidth}x${innerHeight}`, common, elements };
  const res = await fetch('/__style-snapshot?name=' + encodeURIComponent(name), {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) {
    throw new Error('Saving the snapshot failed: ' + res.status);
  }
  return `${name}: ${Object.keys(elements).length} entries at ${snapshot.viewport}`;
}

window.styleSnapshot = styleSnapshot;
