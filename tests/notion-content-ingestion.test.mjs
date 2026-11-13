import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputPath = path.join(root, 'data', 'notion-content-ingestion-preview.json');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));

test('existing Notion exports normalize into source-aware blocked records', () => {
  const run = spawnSync(process.execPath, ['scripts/build-notion-content-ingestion.mjs'], {
    cwd: root, encoding: 'utf8'
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const shared100 = read('notion-100l-physics-chemistry-shared-pilot.json');
  const anatomy = read('notion-200l-anatomy-shared-pilot.json');
  const futa = read('notion-futa-bio101-notes.json');
  const content = read('notion-content-pilot.json');
  const expectedPages = shared100.resources.length + anatomy.resources.length + futa.resources.length;
  const expectedRows = content.datasets.reduce((sum, dataset) => sum + dataset.items.length, 0);

  assert.equal(preview.mode, 'content-exported-staging-only');
  assert.equal(preview.summary.pageResources, expectedPages);
  assert.equal(preview.summary.databaseRows, expectedRows);
  assert.equal(preview.summary.blockedRecords, expectedPages + expectedRows);
  assert.equal(preview.safety.contentFetched, true);
  assert.equal(preview.safety.rightsCleared, false);
  assert.equal(preview.safety.curriculumMappingsCreated, false);
  assert.equal(preview.safety.resourcesPublished, false);
  for (const record of [...preview.resources, ...preview.rows]) {
    assert.deepEqual(record.targetMappings, []);
    assert.equal(record.publicationState, 'blocked');
    assert.equal(record.attestations.rights, 'not-yet-cleared');
    assert.equal(record.attestations.curriculumFit, 'not-yet-mapped');
    assert.ok(record.source.pageUrl || record.source.rowPageUrl);
  }
});

test('institution provenance is retained across Bowen, FUTA and general-library exports', () => {
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const futaNote = preview.resources.find(r => r.source.pageId === '3d11834fbdba81fa9ff5e6c2f8ca8c93');
  assert.ok(futaNote);
  assert.equal(futaNote.provenance.institution, 'FUTA');
  const anatomy = preview.resources.find(r => r.source.pageId === '4161834fbdba81fb9245e2f5193d69f1');
  assert.ok(anatomy);
  assert.equal(anatomy.provenance.institution, 'Bowen University');
  assert.equal(anatomy.provenance.programme, 'MBBS');
  assert.equal(anatomy.reuseIntent, 'candidate-shared-non-bowen');
  const generalChem = preview.resources.find(r => r.source.pageId === '3c11834fbdba8136b014ce9446c8f18b');
  assert.ok(generalChem);
  assert.equal(generalChem.provenance.institution, null);
  assert.equal(generalChem.reuseIntent, 'candidate-shared-non-bowen');
  const futaFlashcards = preview.rows.find(r => r.datasetKey === 'futa-bio101-flashcards');
  const bowenQuestions = preview.rows.find(r => r.datasetKey === 'bowen-cohes-bio101-mcqs');
  assert.ok(futaFlashcards);
  assert.equal(futaFlashcards.provenance.institution, 'FUTA');
  assert.ok(bowenQuestions);
  assert.equal(bowenQuestions.provenance.institution, 'Bowen University');
  assert.equal(bowenQuestions.provenance.programme, 'CoHES');
});

test('typed MCQ and flashcard records meet required data contracts', () => {
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const flashcards = preview.rows.filter(r => r.resourceType === 'flashcards');
  const questions = preview.rows.filter(r => r.resourceType === 'questions');
  assert.ok(flashcards.length > 0);
  assert.ok(questions.length > 0);
  for (const row of flashcards) {
    assert.ok(row.payload.front);
    assert.ok(row.payload.back);
  }
  for (const row of questions) {
    assert.ok(row.payload.question);
    assert.deepEqual(Object.keys(row.payload.options).sort(), ['A','B','C','D']);
    assert.ok(['A','B','C','D'].includes(row.payload.correctAnswer));
    assert.ok(row.payload.explanation);
  }
  assert.equal(new Set(preview.rows.map(r => r.rowKey)).size, preview.rows.length);
  assert.equal(new Set(preview.resources.map(r => r.resourceKey)).size, preview.resources.length);
});
