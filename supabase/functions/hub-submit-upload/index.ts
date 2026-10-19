const ALLOWED = ['pdf','doc','docx','ppt','pptx','txt','html','htm'];
const MIME = [
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain','text/html','application/xhtml+xml','application/octet-stream'
];
const MAX_FILE = 10 * 1024 * 1024;
const MAX_PACK = 1024 * 1024;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-session-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ ok: false, error: 'Upload service is not configured.' }, 500);
  const headers = { apikey: key, Authorization: 'Bearer ' + key };
  const token = req.headers.get('x-session-token') || '';
  if (!/^[a-f0-9]{64}$/i.test(token)) return json({ ok: false, error: 'Please log in again.' }, 401);

  const sessRes = await fetch(url + '/rest/v1/hub_sessions?token=eq.' + encodeURIComponent(token) +
    '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=unique_id', { headers });
  const sess = sessRes.ok ? await sessRes.json().catch(() => []) : [];
  if (!Array.isArray(sess) || !sess.length || !sess[0].unique_id) {
    return json({ ok: false, error: 'Your session expired. Please log in again.' }, 401);
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ ok: false, error: 'Invalid upload form.' }, 400); }
  const file = form.get('file');
  const ext = String(form.get('ext') || '').toLowerCase();
  const course = String(form.get('course') || '').trim().slice(0, 80);
  const title = String(form.get('title') || '').trim().slice(0, 120);
  const nickname = String(form.get('nickname') || '').trim().slice(0, 30);
  const copyrightOk = String(form.get('copyright_ok') || '') === 'true';
  const rawPack = form.get('study_pack');

  if (!(file instanceof File)) return json({ ok: false, error: 'Choose a file first.' }, 400);
  if (!ALLOWED.includes(ext)) return json({ ok: false, error: 'Use PDF, Word, PowerPoint, TXT or HTML.' }, 400);
  if (!MIME.includes(file.type || 'application/octet-stream')) return json({ ok: false, error: 'That file type is not allowed.' }, 400);
  if (!course || title.length < 2 || !nickname) return json({ ok: false, error: 'Add the course, title and display name.' }, 400);
  if (!copyrightOk) return json({ ok: false, error: 'Confirm you have permission to share this document.' }, 400);
  if (file.size < 1 || file.size > MAX_FILE) return json({ ok: false, error: 'The file must be between 1 byte and 10 MB.' }, 413);
  if (typeof rawPack !== 'string' || rawPack.length < 2 || rawPack.length > MAX_PACK) {
    return json({ ok: false, error: 'The generated study pack is missing or too large. Try a shorter document.' }, 400);
  }

  let pack: Record<string, unknown>;
  try { pack = JSON.parse(rawPack); } catch { return json({ ok: false, error: 'The generated study pack is invalid. Try again.' }, 400); }
  const notes = pack.notes as { sections?: unknown[] } | undefined;
  if (!pack || typeof pack !== 'object' || !notes || !Array.isArray(notes.sections) ||
      !Array.isArray(pack.flashcards) || !Array.isArray(pack.questions) ||
      notes.sections.length > 120 || (pack.flashcards as unknown[]).length > 80 ||
      (pack.questions as unknown[]).length > 60) {
    return json({ ok: false, error: 'The generated study pack did not pass validation. Try again.' }, 400);
  }

  const uid = String(sess[0].unique_id);
  const path = uid + '/' + crypto.randomUUID() + '.' + ext;
  const mime = file.type || 'application/octet-stream';
  const storageUrl = url + '/storage/v1/object/hub-uploads/' + path;
  const stored = await fetch(storageUrl, {
    method: 'POST', headers: { ...headers, 'Content-Type': mime, 'x-upsert': 'false' },
    body: await file.arrayBuffer()
  });
  if (!stored.ok) return json({ ok: false, error: 'Could not store the file. Please try again.' }, 502);

  const uploadRes = await fetch(url + '/rest/v1/uploads?select=id', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ uid, nickname, course, title, file_path: path, mime, size_bytes: file.size, copyright_ok: true, status: 'pending' })
  });
  const uploads = uploadRes.ok ? await uploadRes.json().catch(() => []) : [];
  const uploadId = Array.isArray(uploads) && uploads[0] ? uploads[0].id : null;
  if (!uploadRes.ok || !uploadId) {
    await fetch(storageUrl, { method: 'DELETE', headers });
    return json({ ok: false, error: 'The file could not be queued for review. Please try again.' }, 502);
  }

  const packRes = await fetch(url + '/rest/v1/upload_study_packs', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ upload_id: uploadId, course, title, content: pack, status: 'pending' })
  });
  if (!packRes.ok) {
    await fetch(url + '/rest/v1/uploads?id=eq.' + encodeURIComponent(uploadId), { method: 'DELETE', headers });
    await fetch(storageUrl, { method: 'DELETE', headers });
    return json({ ok: false, error: 'The document was stored but its study pack could not be queued. Nothing was published; please try again.' }, 502);
  }
  return json({ ok: true, status: 'pending', generated: true });
});