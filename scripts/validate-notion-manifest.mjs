#!/usr/bin/env node
/**
 * Validate source provenance before ingestion.
 * This does not publish resources, clear rights, or certify curriculum mappings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'notion-resource-manifest.json'), 'utf8'));
const errors = [];
const warnings = [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.generatedAt || '')) errors.push('generatedAt must be YYYY-MM-DD');
if (!hasText(manifest.authority)) errors.push('authority statement is missing');
if (!hasText(manifest.ingestionPolicy)) errors.push('ingestionPolicy is missing');
if (!Array.isArray(manifest.sources)) errors.push('sources must be an array');
const seen = new Set();
for (const [index, source] of (manifest.sources || []).entries()) {
  const label = source && source.title ? source.title : 'source #' + (index + 1);
  if (!hasText(source && source.id)) errors.push(label + ': missing source id');
  if (!hasText(source && source.title)) errors.push('source #' + (index + 1) + ': missing title');
  let validUrl = false;
  try { validUrl = new URL(source && source.url).hostname === 'app.notion.com'; } catch {}
  if (!validUrl) errors.push(label + ': source URL must be a Notion page URL');
  if (!(Array.isArray(source && source.types) && source.types.length) && !hasText(source && source.resourceType)) {
    errors.push(label + ': resource type metadata is missing');
  }
  if (source && source.id && seen.has(source.id)) errors.push(label + ': duplicate source id ' + source.id);
  if (source && source.id) seen.add(source.id);
  if (!hasText(source && source.institution) || /unconfirmed|mixed|personal/i.test((source && source.institution) || '')) {
    warnings.push(label + ': institution ownership needs review before publication');
  }
  if (source && source.exportStatus && /queued|indexed-not-row-exported/i.test(source.exportStatus)) {
    warnings.push(label + ': source is indexed but content rows are not yet exported');
  }
}
if (errors.length) {
  console.error('Notion manifest validation FAILED');
  errors.forEach(item => console.error(' - ' + item));
  process.exitCode = 1;
} else {
  console.log('Notion manifest provenance check passed (' + manifest.sources.length + ' source records).');
}
if (warnings.length) {
  console.warn('Review warnings (' + warnings.length + '):');
  warnings.forEach(item => console.warn(' - ' + item));
}
console.log('Inventory check only: no resource is approved, mapped, or published by this script.');
