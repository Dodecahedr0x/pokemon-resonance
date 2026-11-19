/* Original section: 00-erreurs.js */

// harmless browser warnings (ResizeObserver, error from another site, interrupted audio playback)
const BENIGN = /ResizeObserver loop|^Script error\.?$|play\(\) request|NotAllowedError|AbortError|The operation was aborted|interrupted by a (new load|call to pause)/i;


export function reportError(e, where) {
  if (BENIGN.test(String((e && (e.message || (e.reason && e.reason.message))) || e || '').trim())) return;
  const msg = String((e && (e.message || (e.reason && e.reason.message))) || e || 'erreur inconnue').slice(0, 220);
  const line = (where ? where + ' · ' : '') + msg;
  if (ERRS.includes(line) || ERRS.length > 6) return;
  ERRS.push(line);
  try {
    console.error('[Résonance]', line, e);
  } catch (x) {}
  if (!document.body) return;
  let box = document.getElementById('errBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'errBox';
    box.setAttribute('role', 'alert');
    box.style.cssText =
      'position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));max-height:46vh;overflow:auto;z-index:2147483647;padding:12px 14px;border-radius:14px;background:#2a0e14;border:1px solid #ff6b81;color:#ffe3e8;font:13px/1.45 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
    box.innerHTML =
      '<b style="display:block;margin-bottom:4px">Petit souci technique</b><span>Faites une capture de ce message pour le signaler (v4.77).</span><ul style="margin:6px 0 8px;padding-left:18px;word-break:break-word"></ul><button type="button" style="font:inherit;font-weight:700;padding:6px 14px;border-radius:999px;border:0;background:#ff6b81;color:#2a0e14">Fermer</button>';
    box.querySelector('button').addEventListener('click', () => box.remove());
    document.body.appendChild(box);
  }
  const li = document.createElement('li');
  li.textContent = line;
  box.querySelector('ul').appendChild(li);
}

/* ===================== TECHNICAL PROBLEMS =====================
   If something breaks, the game does not silently stay frozen or black:
   a small message is displayed at the bottom of the screen. A screenshot is enough to report it. */
const ERRS = [];

// Statements run at startup, in the original order (see index.js).
export function __init() {


window.addEventListener('error', e => reportError(e.error || e.message, e.lineno ? 'ligne ' + e.lineno : ''));


window.addEventListener('unhandledrejection', e => reportError(e.reason, 'promesse'));
}
