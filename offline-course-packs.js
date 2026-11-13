/* Bablo Hub P1 offline course-pack store.
 * Only explicitly published manifests with verified SHA-256 assets can be installed.
 * This store is separate from account/authentication and existing study progress.
 */
(function (global) {
  'use strict';
  const DB_NAME = 'bablo-course-packs';
  const DB_VERSION = 1;
  const STORE = 'packs';
  const MAX_PACK_BYTES = 40 * 1024 * 1024;
  const openDb = () => new Promise((resolve, reject) => {
    if (!global.indexedDB) return reject(new Error('IndexedDB is unavailable in this browser.'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open offline storage.'));
  });
  const transaction = async (mode, work) => {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode), store = tx.objectStore(STORE);
        let result;
        try { result = work(store, tx); } catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(result);
        tx.onerror = tx.onabort = () => reject(tx.error || new Error('Offline storage transaction failed.'));
      });
    } finally { db.close(); }
  };
  const digest = async buffer => {
    if (!global.crypto || !crypto.subtle) throw new Error('Secure SHA-256 verification is unavailable.');
    const bytes = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  };
  function validateManifest(m) {
    if (!m || m.schemaVersion !== 1 || m.status !== 'published' || m.institution !== 'Bowen University — College of Health Sciences (CoHES)' ||
        !/^[A-Z0-9-]{2,20}$/.test(String(m.courseCode || '')) || !Array.isArray(m.assets) || !m.assets.length ||
        !m.review || m.review.academic !== true || m.review.source !== true || !m.review.approvedBy) {
      throw new Error('This course pack has not passed the required publication checks.');
    }
    let total = 0;
    for (const a of m.assets) {
      if (!a || typeof a.url !== 'string' || !/^\.\//.test(a.url) || !/^[a-f0-9]{64}$/i.test(a.sha256 || '') ||
          !Number.isSafeInteger(a.bytes) || a.bytes < 0) throw new Error('The pack manifest contains an invalid asset record.');
      total += a.bytes;
    }
    if (total > MAX_PACK_BYTES) throw new Error('This pack exceeds the 40 MB safety limit. Split it into smaller packs.');
    return total;
  }
  async function estimate() {
    if (!navigator.storage || !navigator.storage.estimate) return { supported: false };
    const e = await navigator.storage.estimate();
    return { supported: true, usage: e.usage || 0, quota: e.quota || 0, available: Math.max(0, (e.quota || 0) - (e.usage || 0)) };
  }
  async function download(manifest) {
    const total = validateManifest(manifest);
    if (!navigator.onLine) throw new Error('Connect to the internet before downloading a course pack.');
    const space = await estimate();
    if (space.supported && space.available < total * 1.25) throw new Error('Not enough estimated browser storage. Free up space before downloading.');
    const assets = [];
    for (const asset of manifest.assets) {
      const url = new URL(asset.url, location.href);
      if (url.origin !== location.origin) throw new Error('Course-pack assets must be hosted by Bablo Hub.');
      const response = await fetch(url.href, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not download ' + asset.url + ' (' + response.status + ').');
      const blob = await response.blob();
      if (blob.size !== asset.bytes) throw new Error('File size check failed for ' + asset.url + '.');
      if (await digest(await blob.arrayBuffer()) !== asset.sha256.toLowerCase()) throw new Error('Integrity check failed for ' + asset.url + '.');
      assets.push({ url: asset.url, type: blob.type || 'application/octet-stream', blob });
    }
    const record = { id: manifest.id, courseCode: manifest.courseCode, title: manifest.title, institution: manifest.institution,
      version: manifest.version, installedAt: Date.now(), bytes: total, assets, source: manifest.source || null };
    await transaction('readwrite', store => store.put(record));
    return { id: record.id, bytes: total, installedAt: record.installedAt };
  }
  async function list() {
    return transaction('readonly', store => new Promise((resolve, reject) => {
      const r = store.getAll(); r.onsuccess = () => resolve((r.result || []).map(p => ({ id:p.id, courseCode:p.courseCode, title:p.title, version:p.version, installedAt:p.installedAt, bytes:p.bytes })));
      r.onerror = () => reject(r.error);
    }));
  }
  async function remove(id) {
    return transaction('readwrite', store => store.delete(String(id)));
  }
  async function getAsset(id, url) {
    const pack = await transaction('readonly', store => new Promise((resolve, reject) => {
      const r = store.get(String(id)); r.onsuccess = () => resolve(r.result || null); r.onerror = () => reject(r.error);
    }));
    const asset = pack && pack.assets.find(a => a.url === url);
    return asset ? asset.blob : null;
  }
  async function loadCatalogue() {
    const r = await fetch('./data/offline-course-packs.catalogue.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('Course catalogue is unavailable.');
    return r.json();
  }
  async function renderSettings() {
    const root = document.getElementById('app');
    if (!root || !/^#\/?settings/.test(location.hash || '')) return;
    if (root.querySelector('[data-bablo-course-packs]')) return;
    const card = document.createElement('section'); card.className = 'panel stack'; card.dataset.babloCoursePacks = '1';
    const heading = document.createElement('h2'); heading.textContent = 'Offline course packs';
    const intro = document.createElement('p'); intro.className = 'small muted'; intro.textContent = 'Download only reviewed course packs. Nothing downloads automatically, helping protect phone storage.';
    const status = document.createElement('p'); status.className = 'small muted'; status.textContent = 'Checking course-pack publication status…';
    const installed = document.createElement('div'); installed.className = 'stack';
    card.append(heading, intro, status, installed); root.appendChild(card);
    try {
      const [catalogue, publication, packs, space] = await Promise.all([loadCatalogue(), fetch('./data/offline-course-packs.manifests.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('Pack publication register is unavailable.'); return r.json(); }), list(), estimate()]);
      const ready = Array.isArray(publication.publishedManifests) ? publication.publishedManifests : [];
      status.textContent = (space.supported ? 'Estimated browser storage used: ' + ((space.usage/1048576).toFixed(1)) + ' MB. ' : '') +
        (ready.length ? ready.length + ' reviewed pack(s) available.' : 'No course pack is approved for offline download yet. Existing study data is not affected.');
      ready.forEach(manifest => {
        try { validateManifest(manifest); } catch (_) { return; }
        const row = document.createElement('div'); row.className = 'panel';
        const name = document.createElement('strong'); name.textContent = manifest.courseCode + ' · ' + manifest.title;
        const detail = document.createElement('p'); detail.className = 'tiny muted'; detail.textContent = 'Verified pack · ' + ((manifest.assets.reduce((n,a)=>n+a.bytes,0))/1048576).toFixed(1) + ' MB';
        const button = document.createElement('button'); button.className = 'btn primary'; button.textContent = 'Download for offline use';
        button.onclick = async () => { button.disabled = true; button.textContent = 'Verifying and saving…'; try { await download(manifest); detail.textContent = 'Downloaded and verified on this device.'; button.textContent = 'Downloaded'; } catch(e) { detail.textContent = e.message; button.disabled = false; button.textContent = 'Try download again'; } };
        row.append(name, detail, button); installed.appendChild(row);
      });
      if (packs.length) {
        const label = document.createElement('h3'); label.textContent = 'Downloaded on this device'; installed.appendChild(label);
        packs.forEach(pack => {
          const row = document.createElement('div'); row.className = 'panel';
          const name = document.createElement('strong'); name.textContent = pack.courseCode + ' · ' + pack.title;
          const detail = document.createElement('p'); detail.className = 'tiny muted'; detail.textContent = (pack.bytes/1048576).toFixed(1) + ' MB · version ' + pack.version;
          const removeButton = document.createElement('button'); removeButton.className = 'btn ghost'; removeButton.textContent = 'Remove this pack';
          removeButton.onclick = async () => { if (!confirm('Remove only this downloaded course pack from this device?')) return; removeButton.disabled = true; try { await remove(pack.id); row.remove(); } catch(e) { detail.textContent = e.message; removeButton.disabled = false; } };
          row.append(name, detail, removeButton); installed.appendChild(row);
        });
      }
    } catch (error) { status.textContent = error.message || 'Offline course-pack status is unavailable.'; }
  }
  global.BabloOfflinePacks = Object.freeze({ list, download, remove, getAsset, estimate, validateManifest, loadCatalogue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderSettings);
  else renderSettings();
  addEventListener('hashchange', renderSettings);
  new MutationObserver(renderSettings).observe(document.documentElement, { childList: true, subtree: true });
})(window);
