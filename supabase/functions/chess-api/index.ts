import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bablo-100l-hub.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Vary": "Origin",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server environment: ${name}`);
  return value;
}

async function hubIdentity(token: string) {
  if (token.length < 32 || token.length > 256) return null;
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const query = new URLSearchParams({
    select: "unique_id,expires_at,hub_accounts(unique_id,nickname,programme,is_guest)",
    token: `eq.${token}`,
    expires_at: `gt.${new Date().toISOString()}`,
    limit: "1",
  });
  const response = await fetch(`${base}/rest/v1/hub_sessions?${query}`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Session validation service unavailable");
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || !rows[0].hub_accounts) return null;
  const account = Array.isArray(rows[0].hub_accounts) ? rows[0].hub_accounts[0] : rows[0].hub_accounts;
  if (!account || account.unique_id !== rows[0].unique_id) return null;
  return {
    uniqueId: account.unique_id,
    nickname: account.nickname,
    programme: account.programme,
    guest: account.is_guest,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.headers.get("origin") && request.headers.get("origin") !== corsHeaders["Access-Control-Allow-Origin"]) {
    return json({ ok: false, error: "Origin not allowed." }, 403);
  }
  if (request.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "bablo-chess-api", scope: "identity-only-scaffold" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  let body: Record<string, unknown>;
  try {
    const length = Number(request.headers.get("content-length") || "0");
    if (length > 4096) return json({ ok: false, error: "Request too large." }, 413);
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  if (body.action !== "identity") {
    return json({ ok: false, error: "Action not implemented until chess identity binding is verified." }, 501);
  }
  if (typeof body.token !== "string") return json({ ok: false, error: "Valid Hub session required." }, 401);
  try {
    const identity = await hubIdentity(body.token);
    if (!identity) return json({ ok: false, error: "Session expired or invalid. Please log in again." }, 401);
    return json({ ok: true, identity });
  } catch {
    return json({ ok: false, error: "Session validation temporarily unavailable." }, 503);
  }
});
