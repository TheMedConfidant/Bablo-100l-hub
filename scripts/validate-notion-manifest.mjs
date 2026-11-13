#!/usr/bin/env node
/**
 * Validate the source-aware Notion inventory before any ingestion.
 * This checks provenance completeness only; it does NOT publish resources,
 * approve reuse rights, or certify destination curriculum mappings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'data', 'notion-resource-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const errors = [];
const warnings = [];
const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(manifest.generatedAt || '')) errors.push('generatedAt must be YYYY-MM-DD');
if (!requiredText(manifest.authority)) errors.push('authority statement is missing');
if (!requiredText(manifest.ingestionPolicy)) errors.push('ingestionPolicy is missing');
if (!Array.isArray(manifest.sources)) errors.push('sources must be an array');

const seen = new Set();
for (const [index, source] of (manifest.sources || []).entries()) {
  const label = source?.title || `source #${index + 1}`;
  if (!requiredText(source?.id)) errors.push(`${label}: missing source id`);
  if (!requiredText(source?.title)) errors.push(`source #${index + 1}: missing title`);
  if (!/^https:\\/\\/app\\.notion\\.com\\//.test(source?.url || '')) errors.push(`${label}: source URL must be a Notion page URL`);
  if (!(Array.isArray(source?.types) && source.types.length) && !requiredText(source?.resourceType)) errors.push(`${label}: resource type metadata is missing`);
  if (source?.id && seen.has(source.id)) errors.push(`${label}: duplicate source id ${source.id}`);
  if (source?.id) seen.add(source.id);
  if (!requiredText(source?.institution) || /unconfirmed|mixed|personal/i.test(source.institution)) {
    warnings.push(`${label}: institution ownership needs review before publication`);
  }
  if (source?.exportStatus && /queued|indexed-not-row-exported/i.test(source.exportStatus)) {
    warnings.push(`${label}: source is indexed but content rows are not yet exported`);
  }
}
if (errors.length) {
  console.error('Notion manifest validation FAILED');
  errors.forEach((item) => console.error(' - ' + item));
  process.exitCode = 1;
} else {
  console.log(`Notion manifest provenance check passed (${manifest.sources.length} source records).`);
}
if (warnings.length) {
  console.warn(`Review warnings (${warnings.length}):`);
  warnings.forEach((item) => console.warn(' - ' + item));
}
console.log('This is an inventory check only. No resource is approved, mapped, or published by this script.');
