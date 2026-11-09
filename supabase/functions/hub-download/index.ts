import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Download service is not configured." }, 500);

  const path = new URL(req.url).searchParams.get("path") || "";
  if (!path || path.length > 500 || path.startsWith("/") || path.includes("..") || path.includes("\\") || /[\u0000-\u001f]/.test(path)) {
    return json({ ok: false, error: "Invalid file path." }, 400);
  }

  const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };
  const recordUrl = new URL(supabaseUrl + "/rest/v1/uploads");
  recordUrl.searchParams.set("file_path", "eq." + path);
  recordUrl.searchParams.set("status", "eq.approved");
  recordUrl.searchParams.set("select", "file_path");
  recordUrl.searchParams.set("limit", "1");

  const recordResponse = await fetch(recordUrl, { headers });
  if (!recordResponse.ok) return json({ ok: false, error: "Could not verify file approval." }, 502);
  const records = await recordResponse.json().catch(() => []);
  if (!Array.isArray(records) || !records.length) return json({ ok: false, error: "This file is not approved or is unavailable." }, 404);

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const signResponse = await fetch(supabaseUrl + "/storage/v1/object/sign/hub-uploads/" + encodedPath, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!signResponse.ok) return json({ ok: false, error: "Could not prepare a secure download." }, 502);
  const signed = await signResponse.json().catch(() => ({}));
  const signedPath = String(signed.signedURL || signed.signedUrl || "");
  if (!signedPath) return json({ ok: false, error: "Secure download link was not returned." }, 502);

  const location = signedPath.startsWith("http")
    ? signedPath
    : new URL(signedPath.startsWith("/storage/v1/") ? signedPath : "/storage/v1" + (signedPath.startsWith("/") ? signedPath : "/" + signedPath), supabaseUrl).toString();

  return new Response(null, {
    status: 302,
    headers: { ...cors, Location: location, "Cache-Control": "no-store" },
  });
});
