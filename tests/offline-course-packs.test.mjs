import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
  assert.ok(worker.includes("committed=true;"));
  assert.ok(worker.includes("await caches.delete(previous).catch(()=>{})"));
});

test('an interrupted cache copy cannot replace the previously active course pack', () => {
  assert.ok(worker.includes("if(active!==newCacheName)await caches.delete(newCacheName)"));
  assert.ok(worker.includes("Your previous offline pack was kept"));
  assert.ok(worker.includes("if(committed){reply({ok:true"));
});


function createWorkerHarness(fetchImpl) {
  const stores = new Map();
  class MockCache {
    constructor() { this.entries = new Map(); }
    key(input) { return typeof input === 'string' ? new URL(input, 'https://bablo.test').href : input.url; }
    async put(request, response) { this.entries.set(this.key(request), response.clone()); }
    async match(request) { const response = this.entries.get(this.key(request)); return response ? response.clone() : undefined; }
    async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
    async delete(request) { return this.entries.delete(this.key(request)); }
  }
  const cacheStorage = {
    async open(name) { if (!stores.has(name)) stores.set(name, new MockCache()); return stores.get(name); },
    async has(name) { return stores.has(name); },
    async delete(name) { return stores.delete(name); },
    async keys() { return [...stores.keys()]; },
    async match(request) { for (const cache of stores.values()) { const hit = await cache.match(request); if (hit) return hit; } }
  };
  const listeners = {};
  const self = {
    location: { href: 'https://bablo.test/index.html', origin: 'https://bablo.test' },
    addEventListener(type, fn) { listeners[type] = fn; },
    clients: { claim: async () => {} }
  };
  const context = {
    self, caches: cacheStorage, navigator: {}, Request, Response, URL,
    AbortController, fetch: fetchImpl, setTimeout, clearTimeout, console,
    clients: { matchAll: async () => [], openWindow: async () => {} }
  };
  vm.runInNewContext(worker, context);
  async function message(data) {
    const replies = [];
    let pending;
    listeners.message({
      data, ports: [{ postMessage(value) { replies.push(value); } }],
      waitUntil(promise) { pending = promise; }
    });
    await pending;
    return replies;
  }
  return { message, stores, cacheStorage };
}

test('worker behavior: failed refresh preserves the previous active pack', async () => {
  let fail = false;
  const harness = createWorkerHarness(async request => {
    if (fail) throw new Error('simulated network loss');
    return new Response('course material', { status: 200, headers: { 'content-length': '15' } });
  });
  const first = await harness.message({ type: 'BABLO_CACHE_COURSE', courseId: 'bio-101', resources: ['/bio-101/notes.js'] });
  assert.equal(first.at(-1).ok, true);
  const metadata = await harness.cacheStorage.open('bablo-course-pack-meta-v1');
  const manifestRequest = new Request('https://bablo.test/__bablo_course_pack_meta__/bio-101');
  const manifest = await metadata.match(manifestRequest);
  const activeName = (await manifest.json()).cacheName;
  assert.equal(await harness.cacheStorage.has(activeName), true);

  fail = true;
  const second = await harness.message({ type: 'BABLO_CACHE_COURSE', courseId: 'bio-101', resources: ['/bio-101/notes.js'] });
  assert.equal(second.at(-1).ok, false);
  const after = await (await metadata.match(manifestRequest)).json();
  assert.equal(after.cacheName, activeName);
  assert.equal(await harness.cacheStorage.has(activeName), true);
});

test('worker behavior: course removal leaves unrelated caches untouched', async () => {
  const harness = createWorkerHarness(async () => new Response('material', { status: 200 }));
  await harness.message({ type: 'BABLO_CACHE_COURSE', courseId: 'bio-101', resources: ['/bio-101/notes.js'] });
  await harness.cacheStorage.open('unrelated-user-data-cache');
  const removed = await harness.message({ type: 'BABLO_REMOVE_COURSE', courseId: 'bio-101' });
  assert.equal(removed.at(-1).ok, true);
  assert.equal(await harness.cacheStorage.has('unrelated-user-data-cache'), true);
  assert.equal((await harness.cacheStorage.keys()).some(name => name.startsWith('bablo-course-pack-v1-bio-101')), false);
});
