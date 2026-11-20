// Rename CSS classes across src/: CSS selectors, JSX className values, class="…" inside HTML strings built by the
// engine, classList calls and selector strings (querySelector, closest, matches). Ordinary strings and identifiers
// that happen to spell a class name are left alone.
//
//   node tools/rename-classes/rename-classes.mjs '{"ph":"page-header","kick":"kicker"}'
//
// Prints what it changed per file; review the diff, then run Prettier and lint. Add the same pairs to
// src/lib/renamedClasses.js when players may have styled the old names in the Design Workshop.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('package.json'));
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const renames = JSON.parse(process.argv[2] || '{}');
const oldNames = Object.keys(renames).sort((a, b) => b.length - a.length);
if (!oldNames.length) {
  console.error('usage: rename-classes.mjs \'{"old":"new"}\'');
  process.exit(1);
}
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alternatives = oldNames.map(escapeRegex).join('|');
const selectorPattern = new RegExp(`\\.(${alternatives})(?![\\w-])`, 'g');
const tokenPattern = new RegExp(`(^|\\s)(${alternatives})(?=\\s|$)`, 'g');

const renameSelectors = text => text.replace(selectorPattern, (_m, name) => '.' + renames[name]);
const renameTokens = text => text.replace(tokenPattern, (_m, space, name) => space + renames[name]);

// Class names inside every class="…" / class='…' attribute of an HTML string. `state` carries an attribute that is
// still open across the ${} holes of a template literal.
function renameClassAttributes(text, state) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (state.quote) {
      const end = text.indexOf(state.quote, i);
      const stop = end === -1 ? text.length : end;
      out += renameTokens(text.slice(i, stop));
      if (end === -1) {
        return out;
      }
      out += state.quote;
      state.quote = null;
      i = end + 1;
      continue;
    }
    const match = /class=(\\?["'])/.exec(text.slice(i));
    if (!match) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, i + match.index + match[0].length);
    state.quote = match[1];
    i += match.index + match[0].length;
  }
  return out;
}

const SELECTOR_CALLS = new Set(['querySelector', 'querySelectorAll', 'closest', 'matches', '$', '$$']);
const CLASSLIST_CALLS = new Set(['add', 'remove', 'toggle', 'contains', 'replace']);

function processScript(file, source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const edits = new Map(); // start -> [end, text]
  const edit = (start, end, text) => {
    if (source.slice(start, end) !== text) {
      edits.set(start, [end, text]);
    }
  };
  const editString = (node, fn) => edit(node.start + 1, node.end - 1, fn(source.slice(node.start + 1, node.end - 1)));
  const editQuasis = (template, fn) =>
    template.quasis.forEach(q => edit(q.start, q.end, fn(source.slice(q.start, q.end))));
  // every string piece of an expression (concatenations, conditionals, templates)
  const eachPiece = (node, fn) => {
    if (!node) {
      return;
    }
    if (node.type === 'StringLiteral') {
      editString(node, fn);
    } else if (node.type === 'TemplateLiteral') {
      editQuasis(node, fn);
      node.expressions.forEach(e => eachPiece(e, fn));
    } else if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
      eachPiece(node.left, fn);
      eachPiece(node.right, fn);
    } else if (node.type === 'ConditionalExpression') {
      eachPiece(node.consequent, fn);
      eachPiece(node.alternate, fn);
    } else if (node.type === 'JSXExpressionContainer') {
      eachPiece(node.expression, fn);
    } else if (node.type === 'ArrayExpression') {
      node.elements.forEach(e => eachPiece(e, fn));
    }
  };

  traverse(ast, {
    JSXAttribute(p) {
      if (p.node.name.name === 'className') {
        eachPiece(p.node.value, renameTokens);
      }
    },
    StringLiteral(p) {
      if (/class=\\?["']/.test(p.node.value)) {
        editString(p.node, text => renameClassAttributes(text, {}));
      }
    },
    TemplateLiteral(p) {
      if (p.node.quasis.some(q => /class=\\?["']/.test(q.value.raw))) {
        const state = {};
        p.node.quasis.forEach(q => edit(q.start, q.end, renameClassAttributes(source.slice(q.start, q.end), state)));
      }
    },
    CallExpression(p) {
      const callee = p.node.callee;
      const name = callee.type === 'MemberExpression' ? callee.property.name : callee.name;
      const isClassList =
        callee.type === 'MemberExpression' &&
        callee.object.type === 'MemberExpression' &&
        callee.object.property.name === 'classList';
      if (isClassList && CLASSLIST_CALLS.has(name)) {
        p.node.arguments.forEach(a => eachPiece(a, renameTokens));
      } else if (SELECTOR_CALLS.has(name)) {
        eachPiece(p.node.arguments[0], renameSelectors);
      }
    },
  });

  if (!edits.size) {
    return source;
  }
  let out = source;
  [...edits.entries()]
    .sort((a, b) => b[0] - a[0])
    .forEach(([start, [end, text]]) => {
      out = out.slice(0, start) + text + out.slice(end);
    });
  return out;
}

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

let changedFiles = 0;
for (const file of walk('src')) {
  const source = fs.readFileSync(file, 'utf8');
  let out = source;
  if (file.endsWith('.css')) {
    // selectors only: declarations never contain ".name"
    out = source.replace(/([^{}]*)\{/g, (_m, selector) => renameSelectors(selector) + '{');
  } else if (/\.(js|jsx)$/.test(file)) {
    out = processScript(file, source);
  }
  if (out !== source) {
    fs.writeFileSync(file, out);
    changedFiles++;
    process.stdout.write(`changed ${file}\n`);
  }
}
process.stdout.write(`${changedFiles} files changed\n`);
