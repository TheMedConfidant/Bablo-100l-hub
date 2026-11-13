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
  const manifest = read('notion-resource-manifest.json');
  const content = read('notion-content-pilot.json');
  const packNames = [
    'notion-100l-physics-chemistry-shared-pilot.json',
    'notion-200l-anatomy-shared-pilot.json',
    'notion-200l-course-maps.json',
    'notion-200l-physiology-biochemistry-topics.json',
    'notion-futa-bio101-notes.json',
    'bowen-200l-course-maps.json'
  ];
  const keys = new Set();
  let rawPageExports = 0;
  for (const name of packNames) {
    const pack = read(name);
    for (const item of pack.resources || []) {
      rawPageExports += 1;
      const id = String(item.notionPageId || item.pageId).replace(/-/g, '').toLowerCase();
      const source = manifest.sources.find(s => s.id.replace(/-/g, '').toLowerCase() === id);
      const type = item.resourceType || item.kind || source?.resourceType || source?.types?.[0];
      keys.add(id + ':' + String(type).toLowerCase());
    }
  }
  const expectedRows = content.datasets.reduce((sum, dataset) => sum + dataset.items.length, 0);

  assert.equal(preview.mode, 'content-exported-staging-only');
  assert.equal(preview.summary.pageResources, keys.size);
  assert.equal(preview.summary.duplicatePageExportsSkipped, rawPageExports - keys.size);
  assert.equal(preview.summary.databaseRows, expectedRows);
  assert.equal(preview.summary.blockedRecords, keys.size + expectedRows);
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

test('institution provenance and shared-reuse intent remain separate', () => {
  const preview = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const find = id => preview.resources.find(r => r.source.pageId === id);
  const futaNote = find('3d11834fbdba81fa9ff5e6c2f8ca8c93');
  assert.ok(futaNote);
  assert.equal(futaNote.provenance.institution, 'FUTA');
  const anatomy = find('4161834fbdba81fb9245e2f5193d69f1');
  assert.ok(anatomy);
  assert.equal(anatomy.provenance.institution, 'Bowen University');
  assert.equal(anatomy.provenance.programme, 'MBBS');
  assert.equal(anatomy.reuseIntent, 'candidate-shared-non-bowen');
  const generalChem = find('3c11834fbdba8136b014ce9446c8f18b');
  assert.ok(generalChem);
  assert.equal(generalChem.provenance.institution, null);
  assert.equal(generalChem.reuseIntent, 'candidate-shared-non-bowen');
  const physiology = find('3d11834fbdba81bab400ec6071d8df08');
  const biochemistry = find('3da1834fbdba81ceb2f8e898fe7e525b');
  assert.ok(physiology);
  assert.ok(biochemistry);
  assert.equal(physiology.provenance.course, 'Physiology');
  assert.equal(biochemistry.provenance.course, 'Biochemistry');
  assert.equal(physiology.reuseIntent, 'candidate-shared-non-bowen');
  const bowenMap = find('3ca1834fbdba8109954ed40cae3f52db');
  assert.ok(bowenMap);
  assert.equal(bowenMap.provenance.institution, 'Bowen University');
  assert.equal(bowenMap.provenance.programme, 'MBBS');
  assert.equal(bowenMap.reuseIntent, 'source-institution-only-unless-approved');
  const anatomyHub = find('3d11834fbdba81328612dc2d9aebb3fb');
  assert.ok(anatomyHub);
  assert.equal(anatomyHub.provenance.institution, 'Bowen University');
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

test('queued Notion database schemas are captured without pretending rows were exported', () => {
  const snapshot = read('notion-pending-datasource-schemas.json');
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.dataSources.length, 5);
  const byTitle = new Map(snapshot.dataSources.map(source => [source.title, source]));
  for (const source of snapshot.dataSources) {
    assert.ok(source.dataSourceUrl.startsWith('collection://'));
    assert.ok(source.pageUrl.startsWith('https://app.notion.com/'));
    assert.ok(Object.keys(source.schema).length > 0);
    assert.ok(source.sqliteTable.includes('CREATE TABLE'));
    assert.equal(source.exportState, 'schema-fetched-content-rows-not-exported');
    assert.equal(source.publicationState, 'blocked');
  }
  const chm = byTitle.get('CHM 101 MCQs');
  assert.ok(chm);
  for (const property of ['Question','Option A','Option B','Option C','Option D','Correct Answer','Explanation','Topic']) {
    assert.ok(chm.schema[property], 'CHM schema missing ' + property);
  }
  const phy = byTitle.get('PHY 101 MCQs');
  assert.ok(phy);
  assert.ok(phy.schema['Correct Answer']);
  assert.ok(phy.schema['Option D']);
  const bio = byTitle.get('BIO 101 (Bowen) Flashcards');
  assert.ok(bio.schema.Front);
  assert.ok(bio.schema.Back);
});
