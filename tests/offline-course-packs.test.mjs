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
  assert.match(worker, /await caches\.delete\(name\)/);
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
  assert.match(removeHandler, /caches\.delete\(name\)/);
  assert.doesNotMatch(removeHandler, /localStorage|indexedDB|sessionStorage/);
});

test('course pages expose course-specific offline packs', async () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /offlineCoursePanel\(code\)/);
  assert.match(app, /offlineResourcesForCourse/);
  assert.match(app, /A verified offline pack is not available for this course yet/);
  assert.match(app, /phy101-data\.js/);
  assert.match(app, /cos101plus-extracted\.js/);
  assert.match(app, /gst111-source-bank\.js/);
  assert.match(app, /data\/200l-anatomy-elbow-forearm\.json/);
  assert.match(app, /data\/bowen-200l-course-maps\.json/);
});

test('courses without a separate asset bundle still cache the app shell and embedded course data', () => { const app=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'); assert.match(app,/return \[\.\.\.new Set\(common\.concat\(extras\)\)\]/); });

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
  assert.match(app, /offlineCoursePanel\('200l-ANATOMY'/);
  assert.match(app, /offlineCoursePanel\('200l-'\+c\.code/);
  assert.doesNotMatch(app, /courseId:'bowen-200l-/);
});

test('removing a course also removes unshared runtime duplicates but preserves shared files', () => {
  const handler = worker.slice(worker.indexOf("if(msg.type==='BABLO_REMOVE_COURSE')"), worker.indexOf("const paths="));
  assert.match(handler, /removedKeys\.push\(\.\.\.await cache\.keys\(\)\)/);
  assert.match(handler, /protectedUrls\.has\(request\.url\)/);
  assert.match(handler, /otherNames/);
  assert.match(handler, /runtime\.delete\(request/);
});

test('failed course-pack refresh preserves the previously saved pack', () => {
  assert.match(worker, /bablo-course-pack-stage-/);
  assert.match(worker, /await caches\.delete\(stageName\)/);
  assert.match(worker, /Your previous offline pack was kept/);
  assert.match(worker, /for\(const request of await staging\.keys\(\)\)/);
});

test('every declared offline course asset exists in the repository', () => {
  const assets = [
    'SOC101-data.js', 'phy101-data.js',
    'mts-maths-topics.js', 'mts-maths-induction-extra.js',
    'thermochemistry-data.js', 'chm-practicals-native.js',
    'cos-101-plus-bank.js', 'cos101plus-extracted.js',
    'gst111-curated-pack.js', 'gst111-native-bank.js',
    'gst111-native-resources.js', 'gst111-source-bank.js',
    'agr-101-food-security.html', 'mls101-data.js',
    'data/200l-anatomy-elbow-forearm.json', 'data/bowen-200l-course-maps.json'
  ];
  for (const asset of assets) {
    assert.ok(fs.existsSync(new URL('../' + asset, import.meta.url)), 'missing offline asset: ' + asset);
  }
});

test('Settings cache cleanup includes removable course packs and abandoned staging caches', () => {
  const cleanup = worker.slice(worker.indexOf("Clear Bablo offline cache"), worker.indexOf("})();</script><script id=\"bablo-startup-guard\""));
  assert.match(cleanup, /bablo-course-pack-v1-/);
  assert.match(cleanup, /bablo-course-pack-stage-/);
});

test('course-pack refresh stages a complete immutable cache before atomically switching its manifest', () => {
  assert.ok(worker.includes("response=await timedFetch(request,20000,'reload')"));
  assert.ok(worker.includes("await staging.put(request,response.clone())"));
  assert.ok(worker.includes("newCacheName=COURSE_PREFIX+id+'--'+Date.now()"));
  assert.ok(worker.includes("await next.put(request,response)"));
  assert.ok(worker.includes("await meta.put(metaKey"));
  assert.ok(worker.includes("const previous=await activeCourseCache(id)"));
});

test('an interrupted cache copy cannot replace the previously active course pack', () => {
  assert.ok(worker.includes("if(active!==newCacheName)await caches.delete(newCacheName)"));
  assert.ok(worker.includes("Your previous offline pack was kept"));
});
