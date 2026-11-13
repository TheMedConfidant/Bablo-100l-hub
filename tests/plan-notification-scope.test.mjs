import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf("const PLAN_KEY = 'plan';");
const end = html.indexOf('\nfunction downloadIcs(ev)', start);
assert.ok(start >= 0 && end > start, 'plan event migration and scoping code exists');
const source = html.slice(start, end);
function createPlan(profile, events, version = 3) {
  const DB = { profile, events, eventsVersion: version };
  let saves = 0;
  const api = new Function('DB', 'save', source + '; return { planEvents, PLAN_DEFAULTS, RETIRED_TEST_EVENT_IDS };')(DB, () => { saves += 1; });
  return { DB, saves: () => saves, visible: api.planEvents(), defaults: api.PLAN_DEFAULTS, retired: api.RETIRED_TEST_EVENT_IDS };
}

test('legacy Maths, COS and GST test reminders are removed on upgrade', () => {
  const old = [
    { id: 'mth-test', title: 'MTH 101 test' },
    { id: 'cos-test', title: 'COS 101 test' },
    { id: 'gst-test', title: 'GST 111 test' },
    { id: 'personal-study', title: 'Personal study block' }
  ];
  const state = createPlan({ institution: 'Bowen University', level: '100L', programme: 'MBBS' }, old);
  assert.equal(state.DB.eventsVersion, 4);
  assert.ok(!state.DB.events.some(e => ['mth-test', 'cos-test', 'gst-test'].includes(e.id)));
  assert.ok(state.DB.events.some(e => e.id === 'personal-study'));
});

test('default AGR reminder is visible only to Bowen MBBS 100L', () => {
  const mbbs = createPlan({ institution: 'Bowen University', level: '100L', programme: 'MBBS' }, []);
  const nursing = createPlan({ institution: 'Bowen University', level: '100L', programme: 'Nursing' }, []);
  const upper = createPlan({ institution: 'Bowen University', level: '200L', programme: 'MBBS' }, []);
  const futa = createPlan({ institution: 'FUTA', level: '100L', programme: 'MBBS' }, []);
  assert.ok(mbbs.visible.some(e => e.id === 'agr-test'));
  assert.ok(!nursing.visible.some(e => e.id === 'agr-test'));
  assert.ok(!upper.visible.some(e => e.id === 'agr-test'));
  assert.ok(!futa.visible.some(e => e.id === 'agr-test'));
});

test('personal events without a system scope are preserved for the account', () => {
  const event = { id: 'personal-event', title: 'My own revision session', date: '2026-11-16', time: '16:00' };
  const state = createPlan({ institution: 'FUTA', level: '300L', programme: 'BIO' }, [event]);
  assert.ok(state.visible.some(e => e.id === 'personal-event'));
});
