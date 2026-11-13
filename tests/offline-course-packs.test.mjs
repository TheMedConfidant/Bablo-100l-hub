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
