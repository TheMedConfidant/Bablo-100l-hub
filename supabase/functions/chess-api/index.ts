import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Chess } from "https://esm.sh/chess.js@1.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bablo-100l-hub.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info, x-hub-session",
  "Vary": "Origin",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server environment: ${name}`);
  return value;
}
const baseUrl = () => env("SUPABASE_URL").replace(/\/$/, "");
const dbHeaders = () => {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
};
async function db(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, {
    ...init, headers: { ...dbHeaders(), ...(init.headers ?? {}) }, signal: AbortSignal.timeout(7000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database request failed (${response.status}).`);
  return text ? JSON.parse(text) : null;
}
async function hubIdentity(token: string) {
  if (token.length < 32 || token.length > 256) return null;
  const sessionQuery = new URLSearchParams({
    select: "unique_id", token: `eq.${token}`,
    expires_at: `gt.${new Date().toISOString()}`, limit: "1",
  });
  const sessions = await db(`hub_sessions?${sessionQuery}`);
  if (!Array.isArray(sessions) || sessions.length !== 1 || typeof sessions[0].unique_id !== "string") return null;
  const accountQuery = new URLSearchParams({
    select: "unique_id,nickname,programme,is_guest", unique_id: `eq.${sessions[0].unique_id}`, limit: "1",
  });
  const accounts = await db(`hub_accounts?${accountQuery}`);
  if (!Array.isArray(accounts) || accounts.length !== 1 || accounts[0].unique_id !== sessions[0].unique_id) return null;
  return accounts[0];
}
async function playerFor(account: { unique_id: string }) {
  const filter = new URLSearchParams({ select: "player_id", account_unique_id: `eq.${account.unique_id}`, limit: "1" });
  let rows = await db(`chess_players?${filter}`);
  if (!Array.isArray(rows) || !rows.length) {
    await db("chess_players", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ account_unique_id: account.unique_id }),
    });
    rows = await db(`chess_players?${filter}`);
  }
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Chess profile setup failed.");
  return rows[0].player_id as string;
}
function replayMoves(value: string | null | undefined) {
  const chess = new Chess();
  const moves = (value ?? "").trim() ? (value ?? "").trim().split(/\s+/) : [];
  for (const uci of moves) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error("Stored move history is invalid.");
    const from = uci.slice(0, 2), to = uci.slice(2, 4), promotion = uci[4];
    const legal = chess.moves({ verbose: true }).some((m: any) =>
      m.from === from && m.to === to && (m.promotion ?? "") === (promotion ?? ""));
    if (!legal || !chess.move({ from, to, ...(promotion ? { promotion } : {}) })) {
      throw new Error("Stored move history contains an illegal move.");
    }
  }
  return { chess, moves };
}
function terminalResult(chess: Chess): string | null {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) return chess.turn() === "w" ? "0-1" : "1-0";
  return "1/2-1/2";
}
const GAME_SELECT = "id,code,white_player_id,black_player_id,white_nick,black_nick,status,moves,result,time_control,rated,updated_at";
async function getGame(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const q = new URLSearchParams({ select: GAME_SELECT, id: `eq.${id}`, limit: "1" });
  const rows = await db(`chess_games?${q}`);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  const origin = request.headers.get("origin");
  if (origin && origin !== corsHeaders["Access-Control-Allow-Origin"]) return json({ ok: false, error: "Origin not allowed." }, 403);
  if (request.method === "GET") return json({ ok: true, service: "bablo-chess-api", scope: "preview-only" });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  let body: Record<string, unknown>;
  try {
    const length = Number(request.headers.get("content-length") || "0");
    if (length > 4096) return json({ ok: false, error: "Request too large." }, 413);
    body = await request.json();
  } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }

  const token = request.headers.get("x-hub-session") || (typeof body.token === "string" ? body.token : "");
  if (!token) return json({ ok: false, error: "Valid Hub session required." }, 401);
  try {
    const account = await hubIdentity(token);
    if (!account) return json({ ok: false, error: "Session expired or invalid. Please log in again." }, 401);
    if (account.is_guest) return json({ ok: false, error: "Sign in with a full Bablo Hub account to play online." }, 403);
    const playerId = await playerFor(account);
    const nick = String(account.nickname || "Bablo player").trim().slice(0, 48) || "Bablo player";
    const action = String(body.action || "");

    if (action === "identity") return json({ ok: true, player_id: playerId, nickname: nick, programme: account.programme ?? null });

    if (action === "create_game") {
      const timeControl = String(body.time_control ?? "10+0");
      const allowed = ["1+0", "2+1", "3+0", "3+2", "5+0", "10+0", "10+5", "15+10", "unlimited"];
      if (!allowed.includes(timeControl)) return json({ ok: false, error: "Unsupported time control." }, 400);
      const rows = await db("chess_games", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          code: crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase(),
          white_nick: nick, white_player_id: playerId, black_player_id: null,
          status: "waiting", moves: "", time_control: timeControl,
          rated: Boolean(body.rated) && timeControl !== "unlimited",
        }),
      });
      return json({ ok: true, game: rows?.[0] ?? null }, 201);
    }

    if (action === "accept_game") {
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code)) return json({ ok: false, error: "Invalid challenge code." }, 400);
      const q = new URLSearchParams({ select: GAME_SELECT, code: `eq.${code}`, status: "eq.waiting", limit: "1" });
      const waiting = await db(`chess_games?${q}`);
      const game = Array.isArray(waiting) ? waiting[0] : null;
      if (!game) return json({ ok: false, error: "Challenge is no longer available." }, 404);
      if (game.white_player_id === playerId) return json({ ok: false, error: "You cannot accept your own challenge." }, 409);
      const updateQ = new URLSearchParams({ id: `eq.${game.id}`, status: "eq.waiting", black_player_id: "is.null", select: GAME_SELECT });
      const changed = await db(`chess_games?${updateQ}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ black_player_id: playerId, black_nick: nick, status: "active", updated_at: new Date().toISOString() }),
      });
      if (!Array.isArray(changed) || !changed.length) return json({ ok: false, error: "Another player accepted this challenge first." }, 409);
      return json({ ok: true, game: changed[0] });
    }

    const gameId = String(body.game_id ?? "");
    const game = await getGame(gameId);
    if (!game || (game.white_player_id !== playerId && game.black_player_id !== playerId)) {
      return json({ ok: false, error: "Game not found for this chess profile." }, 404);
    }
    if (action === "state") return json({ ok: true, game });
    if (action === "messages") {
      const q = new URLSearchParams({ select: "id,nick,body,created_at", game_id: `eq.${gameId}`, order: "created_at.asc", limit: "100" });
      return json({ ok: true, messages: await db(`chess_messages?${q}`) });
    }
    if (action === "send_message") {
      if (game.status !== "active") return json({ ok: false, error: "Chat is closed for this game." }, 409);
      const message = String(body.message ?? "").trim();
      if (!message || message.length > 240) return json({ ok: false, error: "Messages must be 1–240 characters." }, 400);
      const inserted = await db("chess_messages", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ game_id: gameId, nick, body: message }),
      });
      return json({ ok: true, message: inserted?.[0] ?? null }, 201);
    }
    if (action === "move") {
      if (game.status !== "active") return json({ ok: false, error: "Game is not active." }, 409);
      const { chess, moves } = replayMoves(game.moves);
      const currentPlayer = chess.turn() === "w" ? game.white_player_id : game.black_player_id;
      if (currentPlayer !== playerId) return json({ ok: false, error: "It is not your turn." }, 409);
      const uci = String(body.uci ?? "");
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return json({ ok: false, error: "Move must use UCI format." }, 400);
      const from = uci.slice(0, 2), to = uci.slice(2, 4), promotion = uci[4];
      const legal = chess.moves({ verbose: true }).some((m: any) =>
        m.from === from && m.to === to && (m.promotion ?? "") === (promotion ?? ""));
      if (!legal || !chess.move({ from, to, ...(promotion ? { promotion } : {}) })) return json({ ok: false, error: "Illegal move." }, 422);
      const nextMoves = [...moves, uci].join(" ");
      const result = terminalResult(chess);
      // Compare-and-swap prevents stale clients from overwriting a newer move.
      const updateQ = new URLSearchParams({
        id: `eq.${gameId}`, status: "eq.active", moves: `eq.${game.moves ?? ""}`, select: GAME_SELECT,
      });
      const changed = await db(`chess_games?${updateQ}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ moves: nextMoves, ...(result ? { status: "finished", result } : {}), updated_at: new Date().toISOString() }),
      });
      if (!Array.isArray(changed) || !changed.length) return json({ ok: false, error: "Game changed on the server. Refresh and retry." }, 409);
      return json({ ok: true, game: changed[0], fen: chess.fen(), check: chess.isCheck(), result });
    }
    if (action === "finish") {
      if (game.status !== "active") return json({ ok: false, error: "Game already finished or not active." }, 409);
      if (body.reason !== "resign") return json({ ok: false, error: "Only resignation is supported for now." }, 400);
      const result = playerId === game.white_player_id ? "0-1" : "1-0";
      const q = new URLSearchParams({ id: `eq.${gameId}`, status: "eq.active", select: GAME_SELECT });
      const changed = await db(`chess_games?${q}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "finished", result, updated_at: new Date().toISOString() }),
      });
      if (!Array.isArray(changed) || !changed.length) return json({ ok: false, error: "Game already finished." }, 409);
      return json({ ok: true, game: changed[0] });
    }
    return json({ ok: false, error: "Unknown or unsupported chess action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const unavailable = /service unavailable|Database request failed|Missing server environment/.test(message);
    return json({ ok: false, error: unavailable ? "Chess service is temporarily unavailable." : "Chess request could not be completed." }, unavailable ? 503 : 500);
  }
});
