// ---- crypto (web push: RFC 8291 encryption + RFC 8292 VAPID) ----
const enc = new TextEncoder();
function b64uEnc(bytes: Uint8Array): string {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDec(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/'); const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
}
function cat(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0); const out = new Uint8Array(n); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
async function encryptPayload(p256dh: string, authSecret: string, plaintext: Uint8Array) {
  const uaPub = b64uDec(p256dh); const auth = b64uDec(authSecret);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const prkKey = await hmac(auth, shared);
  const ikm = (await hmac(prkKey, cat(enc.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])))).slice(0, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const aes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, cat(plaintext, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function vapidAuth(audience: string, pub: string, dB64u: string): Promise<string> {
  const pubRaw = b64uDec(pub);
  const jwk = { kty: 'EC', crv: 'P-256', d: dB64u, x: b64uEnc(pubRaw.slice(1, 33)), y: b64uEnc(pubRaw.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64uEnc(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64uEnc(enc.encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:admin@bablo.hub' })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body)));
  return head + '.' + body + '.' + b64uEnc(sig);
}
async function getKeys(url: string, key: string) {
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const got = await fetch(url + '/rest/v1/rpc/hub_push_keys', { method: 'POST', headers: H, body: '{}' }).then(r => r.json()).catch(() => null);
  if (got && got.public && got.private_d) return got;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pub = b64uEnc(cat(new Uint8Array([4]), b64uDec(jwk.x!), b64uDec(jwk.y!)));
  await fetch(url + '/rest/v1/rpc/hub_push_store_keys', { method: 'POST', headers: H, body: JSON.stringify({ p_public: pub, p_private: jwk.d }) });
  return await fetch(url + '/rest/v1/rpc/hub_push_keys', { method: 'POST', headers: H, body: '{}' }).then(r => r.json());
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!; const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  if (body.action === 'public') { const k = await getKeys(url, key); return json({ ok: true, public: k.public }); }
  if (body.action !== 'send') return json({ ok: false, error: 'Unknown action.' }, 400);
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const allowed = await fetch(url + '/rest/v1/rpc/hub_admin_check', { method: 'POST', headers: H, body: JSON.stringify({ p_token: body.token || '', p_pass: body.pass || '' }) }).then(r => r.json()).catch(() => false);
  if (allowed !== true) return json({ ok: false, error: 'Admin access denied.' }, 403);
  const title = String(body.title || 'Bablo Hub').slice(0, 60); const text = String(body.body || '').slice(0, 200); const target = String(body.url || './').slice(0, 200);
  const keys = await getKeys(url, key);
  const subs = await fetch(url + '/rest/v1/push_subscriptions?select=endpoint,p256dh,auth', { headers: H }).then(r => r.json()).catch(() => []);
  const payload = enc.encode(JSON.stringify({ title, body: text, url: target }));
  let sent = 0, removed = 0, failed = 0;
  for (const s of (Array.isArray(subs) ? subs : [])) {
    try {
      const endpointUrl = new URL(s.endpoint);
      const allowedHosts = new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'wns.windows.com', 'web.push.apple.com']);
      if (endpointUrl.protocol !== 'https:' || !allowedHosts.has(endpointUrl.hostname) || endpointUrl.username || endpointUrl.password) { failed++; continue; }
      const aud = endpointUrl.origin;
      const jwt = await vapidAuth(aud, keys.public, keys.private_d);
      const bodyBytes = await encryptPayload(s.p256dh, s.auth, payload);
      const r = await fetch(s.endpoint, { method: 'POST', headers: { TTL: '86400', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', Authorization: 'vapid t=' + jwt + ', k=' + keys.public }, body: bodyBytes });
      if (r.status === 404 || r.status === 410) { removed++; await fetch(url + '/rest/v1/push_subscriptions?endpoint=eq.' + encodeURIComponent(s.endpoint), { method: 'DELETE', headers: H }); }
      else if (r.ok) sent++; else failed++;
    } catch (e) { failed++; }
  }
  return json({ ok: true, sent, removed, failed, subscribers: Array.isArray(subs) ? subs.length : 0 });
});
