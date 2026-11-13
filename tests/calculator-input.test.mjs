import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../calculator/index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map((match) => match[1]).at(-1);
assert.ok(script, 'calculator inline engine script exists');

const normalizerSource = script.match(/function normalizeExpression\\(raw\\)\\{[\\s\\S]*?\\nfunction preview\\(/)?.[0]
  ?.replace(/\\nfunction preview\\($/, '');
assert.ok(normalizerSource, 'expression normalizer exists');
const normalizeExpression = new Function(normalizerSource + '; return normalizeExpression;')();

test('calculator inline JavaScript parses', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('typed trigonometry accepts natural and function notation', () => {
  assert.equal(normalizeExpression('sin 60'), 'sin(60)');
  assert.equal(normalizeExpression('sin(60)'), 'sin(60)');
  assert.equal(normalizeExpression('\\\\sin(60)'), 'sin(60)');
  assert.equal(normalizeExpression('cos 60'), 'cos(60)');
  assert.equal(normalizeExpression('2sin 60'), '2*sin(60)');
  assert.equal(normalizeExpression('sin 60 + cos 60'), 'sin(60) + cos(60)');
});

test('degree markers and natural radicals are normalized', () => {
  assert.equal(normalizeExpression('sin 60°'), 'sin(60*pi/180)');
  assert.equal(normalizeExpression('sin(60°)'), 'sin((60*pi/180))');
  assert.equal(normalizeExpression('√81'), 'sqrt(81)');
  assert.equal(normalizeExpression('∛27'), 'cbrt(27)');
  assert.equal(normalizeExpression('2π'), '2*pi');
});

test('math input disables mobile spelling correction', () => {
  assert.match(html, /autocorrect="off"/);
  assert.match(html, /autocapitalize="off"/);
  assert.match(html, /spellcheck="false"/);
});
