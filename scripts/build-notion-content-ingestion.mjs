#!/usr/bin/env node
/**
 * Normalize exported Notion content into a source-aware staging feed.
 * This never maps, clears rights, seeds Supabase, or publishes resources.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const outputPath = path.join(root, 'data', 'notion-content-ingestion-preview.json');
const manifest = read('notion-resource-manifest.json');
const sourceById = new Map((manifest.sources || []).map(s => [String(s.id).replace(/-/g, '').toLowerCase(), s]));
const resources = [];
const rows = [];
const errors = [];
const seenResourceKeys = new Map();
const seenRowKeys = new Set();
let duplicatePageExportsSkipped = 0;
const normalizeId = value => String(value || '').replace(/-/g, '').toLowerCase();
const pageIdFromUrl = value => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'app.notion.com') return null;
    const segments = url.pathname.split('/').filter(Boolean);
    const candidate = segments.length === 1 ? segments[0] :
      (segments.length === 2 && segments[0] === 'p' ? segments[1] : null);
    if (!candidate || !/^(?:[a-f0-9]{32}|[a-f0-9-]{36})$/i.test(candidate)) return null;
    return normalizeId(candidate);
  } catch { return null; }
};
const required = value => typeof value === 'string' && value.trim().length > 0;
const addResource = (item, context = {}) => {
  const pageUrl = item.notionUrl || item.sourceUrl || context.sourceUrl || null;
  const pageId = normalizeId(item.notionPageId || item.pageId || pageIdFromUrl(pageUrl));
  if (!pageId || !required(pageUrl) || !required(item.title) && !required(context.title) ||
      !required(item.content)) {
    errors.push('A page resource is missing a valid Notion page ID, URL, title, or content.');
    return;
  }
  if (pageIdFromUrl(pageUrl) !== pageId) {
    errors.push('Page ID does not match its source URL: ' + pageId);
    return;
  }
  const source = sourceById.get(pageId);
  if (!source) {
    errors.push('Page resource is not represented in the source manifest: ' + pageId);
    return;
  }
  const resourceType = item.resourceType || item.kind || source.resourceType ||
    (Array.isArray(source.types) ? source.types[0] : null);
  if (!required(resourceType)) {
    errors.push('Resource type is missing for source page: ' + pageId);
    return;
  }
  const key = 'notion:' + pageId + ':' + String(resourceType).toLowerCase();
  if (seenResourceKeys.has(key)) {
    const previous = seenResourceKeys.get(key);
    if (previous.content === item.content && previous.pageUrl === pageUrl) {
      duplicatePageExportsSkipped += 1;
      return;
    }
    errors.push('Conflicting duplicate page export: ' + key);
    return;
  }
  seenResourceKeys.set(key, { content: item.content, pageUrl });
  const originInstitution = source.institution || item.institution || context.institution || null;
  const explicitSharedPilot = context.reuseIntent === 'candidate-shared-non-bowen';
  resources.push({
    resourceKey: key,
    title: item.title || context.title || source.title,
    resourceType,
    contentFormat: item.contentFormat || 'notion-markdown',
    content: item.content,
    topic: item.topic || context.topic || null,
    source: {
      provider: 'notion',
      pageId,
      pageUrl,
      sourceContainerPage: context.containerPage || null,
      dataSource: source.dataSource || null
    },
    provenance: {
      institution: originInstitution,
      programme: source.programme || item.programmeCode || context.programme || null,
      level: source.level || item.academicLevel || context.academicLevel || null,
      semester: source.semester || item.semester || context.semester || null,
      course: source.course || item.course || item.courseCode || context.course || null,
      originalTitle: source.title
    },
    reuseIntent: explicitSharedPilot ? 'candidate-shared-non-bowen' :
      originInstitution ? 'source-institution-only-unless-approved' : 'general-library-candidate',
    attestations: {
      contentQuality: 'user-confirmed-verified',
      rights: 'not-yet-cleared',
      curriculumFit: 'not-yet-mapped'
    },
    targetMappings: [],
    publicationState: 'blocked'
  });
};
const pagePacks = [
  { file: 'notion-100l-physics-chemistry-shared-pilot.json', reuseIntent: 'candidate-shared-non-bowen' },
  { file: 'notion-200l-anatomy-shared-pilot.json', reuseIntent: 'candidate-shared-non-bowen' },
  { file: 'notion-200l-course-maps.json', reuseIntent: 'candidate-shared-non-bowen' },
  { file: 'notion-200l-physiology-biochemistry-topics.json', reuseIntent: 'candidate-shared-non-bowen' },
  { file: 'notion-futa-bio101-notes.json', reuseIntent: 'institution-exclusive' },
  { file: 'bowen-200l-course-maps.json', reuseIntent: 'institution-exclusive' }
];
for (const pack of pagePacks) {
  const data = read(pack.file);
  const identity = data.academicIdentity || {};
  for (const item of data.resources || []) {
    addResource(item, {
      reuseIntent: pack.reuseIntent,
      academicLevel: data.academicLevel || identity.level,
      course: data.course || identity.course,
      programme: identity.programme,
      institution: identity.institution,
      topic: data.topic
    });
  }
}
const contentPilot = read('notion-content-pilot.json');
for (const dataset of contentPilot.datasets || []) {
  if (!Array.isArray(dataset.items) || dataset.itemCount !== dataset.items.length) {
    errors.push(dataset.key + ': itemCount does not match exported items.');
    continue;
  }
  const parentId = pageIdFromUrl(dataset.sourceNotionPage);
  const parent = parentId ? sourceById.get(parentId) : null;
  if (!parent) {
    errors.push(dataset.key + ': source container page is missing from the manifest.');
    continue;
  }
  for (const item of dataset.items) {
    if (!required(item.id) || !required(item.sourceUrl)) {
      errors.push(dataset.key + ': row is missing stable ID or source URL.');
      continue;
    }
    const sourceRowId = pageIdFromUrl(item.sourceUrl);
    if (!sourceRowId) {
      errors.push(dataset.key + '/' + item.id + ': invalid row source URL.');
      continue;
    }
    const key = 'notion-row:' + dataset.sourceNotionDataSource + ':' + item.id;
    if (seenRowKeys.has(key)) { errors.push('Duplicate source row key: ' + key); continue; }
    seenRowKeys.add(key);
    let payload;
    if (dataset.resourceType === 'flashcards') {
      if (!required(item.front) || !required(item.back)) {
        errors.push(dataset.key + '/' + item.id + ': flashcard requires front and back.');
        continue;
      }
      payload = {
        front: item.front, back: item.back, topic: item.topic || null,
        bloom: item.bloom || null, pareto: item.pareto || null, format: item.format || null
      };
    } else if (dataset.resourceType === 'questions') {
      const options = item.options || {};
      if (!required(item.question) || !['A','B','C','D'].every(k => required(options[k])) ||
          !['A','B','C','D'].includes(item.correctAnswer) || !required(item.explanation)) {
        errors.push(dataset.key + '/' + item.id + ': MCQ requires question, four options, valid answer and explanation.');
        continue;
      }
      payload = {
        question: item.question, options, correctAnswer: item.correctAnswer,
        explanation: item.explanation, topic: item.topic || null,
        bloom: item.bloom || null, difficulty: item.difficulty || null,
        pareto: item.pareto || null
      };
    } else {
      errors.push(dataset.key + ': unsupported row resource type ' + dataset.resourceType);
      continue;
    }
    rows.push({
      rowKey: key,
      datasetKey: dataset.key,
      resourceType: dataset.resourceType,
      payload,
      source: {
        provider: 'notion',
        containerPageId: parentId,
        containerPageUrl: dataset.sourceNotionPage,
        dataSource: dataset.sourceNotionDataSource,
        rowPageId: sourceRowId,
        rowPageUrl: item.sourceUrl
      },
      provenance: {
        institution: dataset.institution || parent.institution || null,
        programme: dataset.programme || parent.programme || null,
        level: dataset.level || parent.level || null,
        semester: dataset.semester || parent.semester || null,
        course: dataset.courseCode || parent.course || null
      },
      attestations: {
        contentQuality: 'user-confirmed-verified',
        rights: 'not-yet-cleared',
        curriculumFit: 'not-yet-mapped'
      },
      targetMappings: [],
      publicationState: 'blocked'
    });
  }
}
if (errors.length) {
  console.error('Notion content ingestion validation FAILED:');
  errors.forEach(error => console.error(' - ' + error));
  process.exit(1);
}
const report = {
  schemaVersion: 1,
  generatedAt: contentPilot.exportedAt,
  mode: 'content-exported-staging-only',
  safety: {
    contentFetched: true,
    rightsCleared: false,
    curriculumMappingsCreated: false,
    resourcesPublished: false,
    note: 'Content is preserved from existing reviewed exports. User verification is not treated as rights clearance or destination curriculum approval.'
  },
  summary: {
    manifestSources: manifest.sources.length,
    pageResources: resources.length,
    duplicatePageExportsSkipped,
    databaseRows: rows.length,
    rowsByType: rows.reduce((a, r) => (a[r.resourceType] = (a[r.resourceType] || 0) + 1, a), {}),
    pageResourcesByType: resources.reduce((a, r) => (a[r.resourceType] = (a[r.resourceType] || 0) + 1, a), {}),
    blockedRecords: resources.length + rows.length
  },
  resources,
  rows
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log('Validated ' + resources.length + ' page resources, skipped ' + duplicatePageExportsSkipped +
  ' identical duplicate exports, and validated ' + rows.length + ' database rows.');
console.log('All ' + report.summary.blockedRecords + ' records remain blocked pending rights review and explicit curriculum mapping.');
