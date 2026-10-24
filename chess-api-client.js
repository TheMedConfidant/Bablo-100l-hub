/**
 * Preview-safe client for the server-authoritative chess API.
 * This module intentionally does not access Supabase tables directly.
 * Supply the Hub session token through getSessionToken; never persist it here.
 */
export function createChessApiClient({ endpoint, getSessionToken, fetchImpl = fetch }) {
  if (!endpoint || typeof endpoint !== "string") throw new TypeError("Chess API endpoint is required.");
  if (typeof getSessionToken !== "function") throw new TypeError("getSessionToken must be a function.");

  async function call(action, fields = {}) {
    const token = await getSessionToken();
    if (typeof token !== "string" || token.length < 32) {
      throw new Error("Please log in to Bablo Hub again before playing online.");
    }
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-session": token,
      },
      cache: "no-store",
      body: JSON.stringify({ action, ...fields }),
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Chess service returned an invalid response.");
    }
    if (!response.ok || payload?.ok !== true) {
      throw new Error(typeof payload?.error === "string" ? payload.error : "Chess request failed.");
    }
    return payload;
  }

  return Object.freeze({
    identity: () => call("identity"),
    createGame: ({ timeControl = "10+0", rated = false, targetUniqueId = "" } = {}) => {
      const target = typeof targetUniqueId === "string" ? targetUniqueId.trim().toUpperCase() : "";
      if (target && !/^[A-Z]{2,4}-[0-9]{4,6}$/.test(target)) {
        return Promise.reject(new Error("Enter a valid Bablo Hub ID, such as COH-1234."));
      }
      return call("create_game", {
        time_control: timeControl,
        rated: Boolean(rated),
        ...(target ? { target_unique_id: target } : {}),
      });
    },
    acceptGame: (code) => call("accept_game", { code }),
    state: (gameId) => call("state", { game_id: gameId }),
    move: (gameId, uci) => {
      if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
        return Promise.reject(new Error("Move must use UCI format."));
      }
      return call("move", { game_id: gameId, uci });
    },
    resign: (gameId) => call("finish", { game_id: gameId, reason: "resign" }),
    messages: (gameId) => call("messages", { game_id: gameId }),
    sendMessage: (gameId, message) => {
      const clean = typeof message === "string" ? message.trim() : "";
      if (!clean || clean.length > 200) {
        return Promise.reject(new Error("Messages must be 1–200 characters."));
      }
      return call("send_message", { game_id: gameId, message: clean });
    },
  });
}
