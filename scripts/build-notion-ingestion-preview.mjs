#!/usr/bin/env node
/**
 * Convert the Notion source manifest into a deterministic ingestion preview.
 * Metadata-only: no content scraping, curriculum inference, rights clearance,
 * or publication occurs here. Output is a reviewable staging artifact.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'notion-resource-manifest.json'), 'utf8'));
const outputPath = path.join(root, 'data', 'notion-ingestion-preview.json');
const slugify = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const resourceTypes = new Set(['notes','flashcards','MCQs','questions','quizzes','practicals','past-papers','vignettes','image-bank','lecture-material','reference']);
const indexTypes = new Set(['course-catalogue','architecture','curriculum-map','course-index','workspace-index','flashcards-index','questions-index']);
const sources = [], resources = [], errors = [], keys = new Set();
for (const source of manifest.sources || []) {
  if (!source.id || !source.url || !source.title) { errors.push('A source is missing id, url or title.'); continue; }
  const types = [...new Set([...(source.types || []), ...(source.resourceType ? [source.resourceType] : [])])];
  const materialTypes = types.filter(type => resourceTypes.has(type));
  sources.push({
    sourceId: source.id, sourceUrl: source.url, title: source.title,
    sourceInstitution: source.institution || null, sourceProgramme: source.programme || null,
    sourceLevel: source.level || null, sourceSemester: source.semester || null,
    sourceCourse: source.course || null,
    sourceOnlyTypes: types.filter(type => indexTypes.has(type)),
    unknownTypes: types.filter(type => !resourceTypes.has(type) && !indexTypes.has(type))
  });
  for (const type of materialTypes) {
    const key = 'notion:' + source.id + ':' + type.toLowerCase();
    if (keys.has(key)) { errors.push('Duplicate resource key: ' + key); continue; }
    keys.add(key);
    const institutionKnown = Boolean(source.institution) && !/unconfirmed|mixed|personal/i.test(source.institution);
    const collectionIndexed = typeof source.dataSource === 'string' && source.dataSource.startsWith('collection://');
    resources.push({
      resourceKey: key, title: source.title,
      resourceType: type === 'MCQs' ? 'questions' : type,
      source: { provider: 'notion', pageId: source.id, pageUrl: source.url,
        dataSource: collectionIndexed ? source.dataSource : null,
        exportStatus: source.exportStatus || 'page-index-only', notes: source.notes || null },
      provenance: { institution: source.institution || null,
        institutionSlug: institutionKnown ? slugify(source.institution) : null,
        programme: source.programme || null, level: source.level || null,
        semester: source.semester || null, course: source.course || null },
      attestations: { contentQuality: 'user-confirmed-verified',
        rights: 'not-yet-cleared', curriculumFit: 'not-yet-mapped' },
      reusePolicy: 'pending-review', targetMappings: [],
      ingestionState: source.exportStatus === 'rows-exported' ? 'content-exported-review-required' :
        collectionIndexed ? 'collection-indexed-rows-not-exported' : 'source-indexed-content-not-extracted',
      publicationState: 'blocked'
    });
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const output = {
  schemaVersion: 1, generatedAt: manifest.generatedAt,
  generatedFrom: 'data/notion-resource-manifest.json', mode: 'metadata-only-staging-preview',
  safety: { contentFetched: false, curriculumMappingsCreated: false, rightsCleared: false,
    resourcesPublished: false,
    note: 'User-confirmed content verification does not imply rights clearance or destination curriculum alignment.' },
  summary: { sourceRecords: sources.length, resourceCandidates: resources.length,
    blockedCandidates: resources.length,
    candidatesByType: resources.reduce((a,r) => (a[r.resourceType]=(a[r.resourceType]||0)+1,a),{}) },
  sources, resources
};
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log('Generated ' + resources.length + ' metadata-only candidates from ' + sources.length + ' Notion sources.');
console.log('All candidates remain blocked pending extraction, rights review and explicit curriculum mapping.');
