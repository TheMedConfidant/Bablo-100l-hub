import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputPath = path.join(root, 'data', 'notion-ingestion-preview.json');

test('Notion manifest produces deterministic, blocked staging candidates', () => {
  const run = spawnSync(process.execPath, ['scripts/build-notion-ingestion-preview.mjs'], {
    cwd: root, encoding: 'utf8'
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.equal(preview.mode, 'metadata-only-staging-preview');
  assert.equal(preview.summary.sourceRecords, 26);
  assert.ok(preview.summary.resourceCandidates > 0);
  assert.equal(preview.summary.blockedCandidates, preview.summary.resourceCandidates);
  assert.equal(preview.safety.contentFetched, false);
  assert.equal(preview.safety.curriculumMappingsCreated, false);
  assert.equal(preview.safety.rightsCleared, false);
  assert.equal(preview.safety.resourcesPublished, false);
  for (const resource of preview.resources) {
    assert.ok(resource.source.pageId);
    assert.ok(resource.source.pageUrl.startsWith('https://app.notion.com/'));
    assert.deepEqual(resource.targetMappings, []);
    assert.equal(resource.publicationState, 'blocked');
    assert.equal(resource.reusePolicy, 'pending-review');
    assert.equal(resource.attestations.rights, 'not-yet-cleared');
    assert.equal(resource.attestations.curriculumFit, 'not-yet-mapped');
  }
});

test('Bowen-only source provenance is retained, not silently relabelled as FUTA', () => {
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const bowen = preview.resources.find(r => r.source.pageId === '3e91834f-bdba-8124-be25-c4d749158c67');
  assert.ok(bowen);
  assert.equal(bowen.provenance.institutionSlug, 'bowen-university');
  assert.deepEqual(bowen.targetMappings, []);
  const futa = preview.resources.find(r => r.source.pageId === '3ca1834f-bdba-8167-a959-cce677f5249e');
  assert.ok(futa);
  assert.equal(futa.provenance.institutionSlug, 'futa');
});

test('Bowen 200L Anatomy source provenance is retained', () => {
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const ambiguous = preview.resources.find(r => r.source.pageId === '4161834f-bdba-81fb-9245-e2f5193d69f1');
  assert.ok(ambiguous);
  assert.equal(ambiguous.provenance.institutionSlug, 'bowen-university');
  assert.equal(ambiguous.reusePolicy, 'pending-review');
});
