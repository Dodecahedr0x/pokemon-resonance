// Dev-only: resolves a component's look in every variant and state, outside any screen.
//   await styleProbe('button-before', 'b', ['b-sm', 'b-lg', 'b-gold', 'b-gold b-sm', 'b-ghost'])
// Builds <button> and <a> samples at the end of <body>, forces :hover / :active / :focus-visible by copying every
// rule that uses them onto a class (same specificity, same layer, same position), adds disabled and
// aria-pressed variants, and saves each sample's computed style (and ::before / ::after) like styleSnapshot.
//   await styleProbeHtml('header-before', '<section class="page"><div class="ph">…</div></section>')
// does the same for any markup (add __hover / __active / __focus classes yourself to force states).
// Compare two probes with diff.js. Reload the page afterwards: the copied rules stay in the stylesheets.
const FORCED = { ':hover': '.__hover', ':active': '.__active', ':focus-visible': '.__focus' };

function forcePseudoClasses(list) {
  for (let i = list.cssRules.length - 1; i >= 0; i--) {
    const rule = list.cssRules[i];
    if (rule instanceof CSSStyleRule) {
      if (/:(hover|active|focus-visible)/.test(rule.selectorText)) {
        let sel = rule.selectorText;
        for (const [pseudo, cls] of Object.entries(FORCED)) {
          sel = sel.split(pseudo).join(cls);
        }
        try {
          list.insertRule(rule.cssText.replace(rule.selectorText, sel), i + 1);
        } catch {
          // a selector the copy cannot express: skip it
        }
      }
    } else if (rule.cssRules) {
      forcePseudoClasses(rule);
    }
  }
}

function probeHost() {
  if (!window.__pseudoForced) {
    for (const sheet of document.styleSheets) {
      try {
        forcePseudoClasses(sheet);
      } catch {
        // cross-origin sheet
      }
    }
    window.__pseudoForced = true;
  }
  document.getElementById('__probe')?.remove();
  const host = document.createElement('div');
  host.id = '__probe';
  document.body.append(host);
  return host;
}

async function styleProbeHtml(name, html) {
  probeHost().innerHTML = html;
  return window.styleSnapshot(name, '#__probe');
}

async function styleProbe(name, baseClass, variants) {
  const host = probeHost();
  const states = {
    base: [],
    hover: ['__hover'],
    active: ['__hover', '__active'],
    focus: ['__focus'],
    disabled: ['disabled'],
    'hover-disabled': ['__hover', 'disabled'],
    pressed: ['pressed'],
  };
  for (const tag of ['button', 'a']) {
    for (const variant of ['', ...variants]) {
      for (const [state, flags] of Object.entries(states)) {
        if (tag === 'a' && (flags.includes('disabled') || flags.includes('pressed'))) {
          continue;
        }
        const el = document.createElement(tag);
        if (tag === 'a') {
          el.href = '#probe';
        }
        el.className = [baseClass, variant, ...flags.filter(f => f.startsWith('__'))].join(' ').trim();
        el.disabled = flags.includes('disabled');
        if (flags.includes('pressed')) {
          el.setAttribute('aria-pressed', 'true');
        }
        el.dataset.probe = `${tag}.${[baseClass, ...variant.split(' ')].filter(Boolean).join('.')}:${state}`;
        el.textContent = 'Probe';
        host.append(el);
      }
    }
  }
  return window.styleSnapshot(name, '#__probe');
}

window.styleProbe = styleProbe;
window.styleProbeHtml = styleProbeHtml;
