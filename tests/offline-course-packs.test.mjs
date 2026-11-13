import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const manager = fs.readFileSync(new URL('../offline-course-manager.js', import.meta.url), 'utf8');

test('offline course manager is precached and loaded by the app shell', () => {
  assert.match(worker, /'\.\/offline-course-manager\.js'/);
  assert.match(worker, /<script src="\.\/offline-course-manager\.js" defer><\/script>/);
});

test('service worker supports independent save, remove and list operations', () => {
  for (const type of ['BABLO_CACHE_COURSE', 'BABLO_REMOVE_COURSE', 'BABLO_LIST_COURSES']) {
    assert.ok(worker.includes(type), 'missing worker message: ' + type);
  }
  assert.match(worker, /bablo-course-pack-v1-/);
  assert.match(worker, /await caches\.delete\(cacheName\)/);
});

test('course downloads reject cross-origin resources and oversized packs', () => {
  assert.match(worker, /u\.origin!==self\.location\.origin/);
  assert.match(worker, /paths\.length>250/);
  assert.match(worker, /length>25\*1024\*1024/);
});

test('client exposes course save, remove, list and UI attachment methods', () => {
  for (const method of ['saveCourse', 'removeCourse', 'listCourses', 'attachCourseButton']) {
    assert.match(manager, new RegExp(method));
  }
  assert.match(manager, /Study offline/);
  assert.match(manager, /Save course offline/);
  assert.match(manager, /Remove offline course/);
});

test('course removal does not clear account or study-progress stores', () => {
  const removeHandler = worker.slice(worker.indexOf("if(msg.type==='BABLO_REMOVE_COURSE')"), worker.indexOf("const paths="));
  assert.match(removeHandler, /caches\.delete\(cacheName\)/);
  assert.doesNotMatch(removeHandler, /localStorage|indexedDB|sessionStorage/);
});

test('course pages expose course-specific offline packs', async () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /offlineCoursePanel\(code\)/);
  assert.match(app, /offlineResourcesForCourse/);
  assert.match(app, /phy101-data\.js/);
  assert.match(app, /cos101plus-extracted\.js/);
  assert.match(app, /gst111-source-bank\.js/);
  assert.match(app, /data\/200l-anatomy-elbow-forearm\.json/);
  assert.match(app, /data\/bowen-200l-course-maps\.json/);
});

test('course-pack responses are not copied into the general runtime cache', () => {
  assert.match(worker, /bablo-course-pack-v1-/);
  assert.match(worker, /if\(await pack\.match\(req,\{ignoreSearch:true\}\)\)return/);
});

test('Settings exposes offline course pack management', () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /function offlineDownloadsPanel\(\)/);
  assert.match(app, /offlineDownloadsPanel\(\),/);
  assert.match(app, /removeCourse\(id\)/);
});

test('200L download controls use the removable course-pack manager without duplicate panels', () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /courseId:'bowen-200l-anatomy',resources:/);
  assert.match(app, /courseId:'bowen-200l-'\+String\(c\.code\)/);
  assert.doesNotMatch(app, /offlineCoursePanel\('200l-'/);
});
