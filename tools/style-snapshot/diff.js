// Compares two style snapshots taken with styleSnapshot() (see client.js):
//   node tools/style-snapshot/diff.js settings-before settings-after
// Prints every element whose box or computed style changed, and those that appeared or vanished.
// Exit code 1 when anything differs.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../.style-snapshots');
const load = name => JSON.parse(readFileSync(join(dir, name.replace(/\.json$/, '') + '.json'), 'utf8'));

const [beforeName, afterName] = process.argv.slice(2);
if (!beforeName || !afterName) {
  console.error('Usage: node tools/style-snapshot/diff.js <before> <after>');
  process.exit(2);
}
const before = load(beforeName);
const after = load(afterName);
if (before.viewport !== after.viewport) {
  console.warn(`Viewports differ: ${before.viewport} vs ${after.viewport}`);
}

const full = (snap, entry) => ({ ...snap.common, ...entry.style });
let changed = 0;
const lines = [];
for (const path of new Set([...Object.keys(before.elements), ...Object.keys(after.elements)])) {
  const a = before.elements[path];
  const b = after.elements[path];
  if (!a || !b) {
    lines.push(`${a ? '- removed' : '+ added  '} ${path}`);
    changed++;
    continue;
  }
  const diffs = [];
  if (a.box !== b.box) {
    diffs.push(`    box: ${a.box} -> ${b.box}`);
  }
  const sa = full(before, a);
  const sb = full(after, b);
  for (const prop of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
    if (sa[prop] !== sb[prop]) {
      diffs.push(`    ${prop}: ${sa[prop]} -> ${sb[prop]}`);
    }
  }
  if (diffs.length) {
    lines.push(`~ ${path}`, ...diffs);
    changed++;
  }
}
const total = Object.keys(after.elements).length;
lines.push(changed ? `${changed} of ${total} entries differ.` : `Identical: ${total} entries.`);
process.stdout.write(lines.join('\n') + '\n');
process.exit(changed ? 1 : 0);
