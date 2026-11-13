import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let checked = 0;
for (let i = 0; i < tags.length; i++) {
  const attrs = tags[i][1] || '';
  const source = tags[i][2] || '';
  if (/\bsrc\s*=/.test(attrs) || /application\/ld\+json/i.test(attrs) || !source.trim()) continue;
  new vm.Script(source, { filename: 'index.html:inline-script-' + (i + 1) });
  checked++;
}
if (!checked) throw new Error('No inline JavaScript blocks were checked.');
console.log('Parsed ' + checked + ' inline JavaScript blocks.');
