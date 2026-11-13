import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../calculator/index.html', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const script = html.split('<script>').slice(1).map((block) => block.split('</script>')[0]).at(-1);
assert.ok(script, 'calculator inline engine script exists');

const start = script.indexOf('function normalizeExpression(raw){');
const end = script.indexOf('\nfunction preview()', start);
assert.ok(start >= 0 && end > start, 'expression normalizer exists');
const normalizeExpression = new Function(script.slice(start, end) + '; return normalizeExpression;')();

test('calculator inline JavaScript parses', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('typed trigonometry accepts natural and function notation', () => {
  assert.equal(normalizeExpression('sin 60'), 'sin(60)');
  assert.equal(normalizeExpression('sin(60)'), 'sin(60)');
  assert.equal(normalizeExpression('\\sin(60)'), 'sin(60)');
  assert.equal(normalizeExpression('cos 60'), 'cos(60)');
  assert.equal(normalizeExpression('2sin 60'), '2*sin(60)');
  assert.equal(normalizeExpression('sin 60 + cos 60'), 'sin(60) + cos(60)');
});

test('degree markers and natural radicals are normalized', () => {
  assert.equal(normalizeExpression('sin 60°'), 'sinDeg(60)');
  assert.equal(normalizeExpression('sin(60°)'), 'sinDeg(60)');
  assert.equal(normalizeExpression('sin 60° + cos 30°'), 'sinDeg(60) + cosDeg(30)');
  assert.equal(normalizeExpression('tan(45°)'), 'tanDeg(45)');
  assert.equal(normalizeExpression('√81'), 'sqrt(81)');
  assert.equal(normalizeExpression('∛27'), 'cbrt(27)');
  assert.equal(normalizeExpression('2π'), '2*pi');
});

test('math input disables mobile spelling correction', () => {
  assert.ok(html.includes('autocorrect="off"'));
  assert.ok(html.includes('autocapitalize="off"'));
  assert.ok(html.includes('spellcheck="false"'));
  assert.ok(html.includes('smart-mode="true"'));
  assert.ok(html.includes('data-insert="\\\\sec("'));
  assert.ok(html.includes('data-insert="\\\\csc("'));
  assert.ok(html.includes('data-insert="\\\\cot("'));
  assert.ok(html.includes('data-insert="floor("'));
  assert.ok(html.includes('data-insert="ceil("'));
});

test('calculator libraries are routed through the offline cache', () => {
  assert.ok(html.includes('./vendor/mathlive.min.js'));
  assert.ok(html.includes('./vendor/mathjs.js'));
  assert.ok(html.includes('./vendor/mathlive-static.css'));
  assert.ok(html.includes("MathfieldElement.fontsDirectory"));
  assert.ok(html.includes("MathfieldElement.soundsDirectory"));
  assert.ok(serviceWorker.includes("bablo-offline-v39-semester-profile"));
  assert.ok(serviceWorker.includes("function vendorURL(u)"));
  assert.ok(serviceWorker.includes("cdn.jsdelivr.net/npm/mathjs@14.8.1/lib/browser/math.js"));
  assert.ok(serviceWorker.includes("unpkg.com/mathlive@0.104.2/dist/"));
});

test('scientific calculator includes advanced workspaces', () => {
  for (const id of ['table', 'baseN', 'matrices', 'calculus']) {
    assert.ok(html.includes('data-tab="' + id + '"'));
    assert.ok(html.includes('id="' + id + '"'));
  }
  assert.ok(script.includes('window.math.isComplex(result)'));
  assert.ok(script.includes('window.math.det(a)'));
  assert.ok(script.includes('Simpson'));
  assert.ok(script.includes('sinDeg:x=>Math.sin(x*Math.PI/180)'));
  assert.ok(script.includes('cosDeg:x=>Math.cos(x*Math.PI/180)'));
});
