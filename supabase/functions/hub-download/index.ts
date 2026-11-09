import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-session-token, x-admin-passcode",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function validPath(path: string) {
  return !!path && path.length <= 500 && !path.startsWith("/") && !path.includes("..") &&
    !path.includes("\\") && !/[\u0000-\u001f]/.test(path);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Download service is not configured." }, 500);

  let path = "", adminPreview = false;
  if (req.method === "GET") path = new URL(req.url).searchParams.get("path") || "";
  else {
    let body: { path?: string } = {};
    try { body = await req.json(); } catch { return json({ ok: false, error: "Invalid request body." }, 400); }
    path = String(body.path || "");
    const token = req.headers.get("x-session-token") || "";
    const pass = req.headers.get("x-admin-passcode") || "";
    if (!/^[a-f0-9]{64}$/i.test(token) || !pass || pass.length > 256) return json({ ok: false, error: "Admin verification is required." }, 401);
    const check = await fetch(supabaseUrl + "/rest/v1/rpc/hub_admin_check", {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token, p_pass: pass }),
    });
    const verified = check.ok ? await check.json().catch(() => null) : null;
    if (!verified || verified.ok !== true) return json({ ok: false, error: "Admin verification failed." }, 403);
    adminPreview = true;
  }
  if (!validPath(path)) return json({ ok: false, error: "Invalid file path." }, 400);

  const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };
  const recordUrl = new URL(supabaseUrl + "/rest/v1/uploads");
  recordUrl.searchParams.set("file_path", "eq." + path);
  if (!adminPreview) recordUrl.searchParams.set("status", "eq.approved");
  recordUrl.searchParams.set("select", "file_path,status");
  recordUrl.searchParams.set("limit", "1");
  const recordResponse = await fetch(recordUrl, { headers });
  if (!recordResponse.ok) return json({ ok: false, error: "Could not verify file approval." }, 502);
  const records = await recordResponse.json().catch(() => []);
  if (!Array.isArray(records) || !records.length) return json({ ok: false, error: "This file is not approved or is unavailable." }, 404);

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const signResponse = await fetch(supabaseUrl + "/storage/v1/object/sign/hub-uploads/" + encodedPath, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!signResponse.ok) return json({ ok: false, error: "Could not prepare a secure download." }, 502);
  const signed = await signResponse.json().catch(() => ({}));
  const signedPath = String(signed.signedURL || signed.signedUrl || "");
  if (!signedPath) return json({ ok: false, error: "Secure download link was not returned." }, 502);
  const location = signedPath.startsWith("http") ? signedPath :
    new URL(signedPath.startsWith("/storage/v1/") ? signedPath : "/storage/v1" + (signedPath.startsWith("/") ? signedPath : "/" + signedPath), supabaseUrl).toString();
  if (adminPreview) return json({ ok: true, url: location, expires_in: 300 });
  return new Response(null, { status: 302, headers: { ...cors, Location: location, "Cache-Control": "no-store" } });
});
