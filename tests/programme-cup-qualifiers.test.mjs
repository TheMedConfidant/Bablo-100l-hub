import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const startMigration = readFileSync(new URL('../supabase/migrations/20261113144310_scope_exam_schedule_and_november_qualifiers.sql', import.meta.url), 'utf8');
const leaderboardMigration = readFileSync(new URL('../supabase/migrations/20261113151937_filter_november_qualifier_leaderboard_to_top_three_per_programme.sql', import.meta.url), 'utf8');
const agrMigration = readFileSync(new URL('../supabase/migrations/20261113151945_scope_agr101_exam_notice_to_mbbs_programme.sql', import.meta.url), 'utf8');

const qualMatch = html.match(/const QUAL = (\{[^}]+\});/);
assert.ok(qualMatch, 'qualification schedule config exists');
const QUAL = new Function('return (' + qualMatch[1] + ');')();

test('November qualifiers run all day on Saturday and Sunday', () => {
  assert.equal(QUAL.date, '2026-11-14');
  assert.equal(QUAL.sundayDate, '2026-11-15');
  assert.deepEqual(QUAL.A, [0, 1440]);
  assert.deepEqual(QUAL.B, [0, 1440]);
  assert.match(startMigration, /p_batch='A'.*date '2026-11-14'/s);
  assert.match(startMigration, /p_batch='B'.*date '2026-11-15'/s);
});

test('exactly three top performers per faculty/programme qualify', () => {
  assert.equal(QUAL.topN, 3);
  assert.match(html, /Three top performers per programme qualify/);
  assert.match(leaderboardMigration, /where q\.season = '2026-11'/);
  assert.match(leaderboardMigration, /row_number\(\) over \([\s\S]*partition by lower\(coalesce\(nullif\(trim\(q\.programme\)/);
  assert.match(leaderboardMigration, /where programme_rank <= 3/);
});

test('an account receives one attempt across the full weekend', () => {
  assert.match(startMigration, /exists\(select 1 from public\.qualifier_starts where uid=v_uid and season='2026-11'\)/);
  assert.match(startMigration, /exists\(select 1 from public\.qualifier_results where uid=v_uid and season='2026-11'\)/);
});

test('AGR 101 notice is restricted to the MBBS profile', () => {
  assert.match(agrMigration, /set programme = 'MBBS'/);
  assert.match(agrMigration, /id = 'test-agr101-2026'/);
});

test('profile uses one Faculty / Programme identity for Cup grouping', () => {
  assert.match(html, /Faculty \/ Programme/);
  assert.match(html, /faculty: details\.programme/);
  assert.match(leaderboardMigration, /partition by lower\(coalesce\(nullif\(trim\(q\.programme\)/);
});
