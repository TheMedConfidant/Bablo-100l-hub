import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function filterExamScheduleForProfile(rows) {');
const end = html.indexOf('\nasync function fetchPublicExamSchedule()', start);
assert.ok(start >= 0 && end > start, 'profile schedule filter exists');
const filterSource = html.slice(start, end);
const filterFor = (profile, rows) => new Function('DB', filterSource + '; return filterExamScheduleForProfile(rows);')({ profile })(rows);
const schedule = [
  { id: 'phy-100', institution_slug: 'bowen-university', academic_level: '100L', programme: null },
  { id: 'agr-mbbs', institution_slug: 'bowen-university', academic_level: '100L', programme: 'MBBS' },
  { id: 'phy-200', institution_slug: 'bowen-university', academic_level: '200L', programme: null },
  { id: 'futa-100', institution_slug: 'futa', academic_level: '100L', programme: null },
];

test('Bowen 100L profile sees only matching institution and level notices', () => {
  assert.deepEqual(filterFor({ institution: 'Bowen University', level: '100L', programme: 'Nursing' }, schedule).map(x => x.id), ['phy-100']);
});

test('programme-specific reminders stay inside the matching faculty/programme', () => {
  assert.deepEqual(filterFor({ institution: 'Bowen University', level: '100L', programme: 'MBBS' }, schedule).map(x => x.id), ['phy-100', 'agr-mbbs']);
  assert.deepEqual(filterFor({ institution: 'Bowen University', level: '100L', programme: 'Nursing' }, schedule).map(x => x.id), ['phy-100']);
});

test('Bowen 100L notices never leak to 200L or another university', () => {
  assert.deepEqual(filterFor({ institution: 'Bowen University', level: '200L', programme: 'MBBS' }, schedule), [schedule[2]]);
  assert.deepEqual(filterFor({ institution: 'FUTA', level: '100L', programme: 'BIO' }, schedule), [schedule[3]]);
});

test('missing profile identity fails closed instead of showing generic reminders', () => {
  assert.deepEqual(filterFor({}, schedule), []);
});
