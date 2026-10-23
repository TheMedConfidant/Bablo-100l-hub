import test from "node:test";
import assert from "node:assert/strict";
import { createChessApiClient } from "./chess-api-client.js";

const session = "x".repeat(48);
function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test("sends Hub session in header and never in request body", async () => {
  let request;
  const client = createChessApiClient({
    endpoint: "https://example.test/functions/v1/chess-api",
    getSessionToken: () => session,
    fetchImpl: async (url, init) => {
      request = { url, init };
      return response({ ok: true, player_id: "player-1" });
    },
  });
  const result = await client.identity();
  assert.equal(result.player_id, "player-1");
  assert.equal(request.init.headers["x-hub-session"], session);
  assert.equal(JSON.parse(request.init.body).token, undefined);
  assert.equal(JSON.parse(request.init.body).action, "identity");
  assert.equal(request.init.cache, "no-store");
});

test("refuses to call the server when there is no valid Hub session", async () => {
  let called = false;
  const client = createChessApiClient({
    endpoint: "https://example.test/functions/v1/chess-api",
    getSessionToken: () => null,
    fetchImpl: async () => { called = true; return response({ ok: true }); },
  });
  await assert.rejects(client.identity(), /Please log in to Bablo Hub again/);
  assert.equal(called, false);
});

test("maps online actions to server-authoritative API requests", async () => {
  const requests = [];
  const client = createChessApiClient({
    endpoint: "https://example.test/functions/v1/chess-api",
    getSessionToken: () => session,
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return response({ ok: true });
    },
  });
  await client.createGame({ timeControl: "5+0", rated: true });
  await client.acceptGame("ABC123");
  await client.move("game-id", "e2e4");
  await client.resign("game-id");
  await client.sendMessage("game-id", "Good game");
  assert.deepEqual(requests, [
    { action: "create_game", time_control: "5+0", rated: true },
    { action: "accept_game", code: "ABC123" },
    { action: "move", game_id: "game-id", uci: "e2e4" },
    { action: "finish", game_id: "game-id", reason: "resign" },
    { action: "send_message", game_id: "game-id", message: "Good game" },
  ]);
});

test("surfaces a safe API error when the server rejects a request", async () => {
  const client = createChessApiClient({
    endpoint: "https://example.test/functions/v1/chess-api",
    getSessionToken: () => session,
    fetchImpl: async () => response({ ok: false, error: "It is not your turn." }, 409),
  });
  await assert.rejects(client.move("game-id", "e7e5"), /It is not your turn/);
});

test("rejects malformed server responses", async () => {
  const client = createChessApiClient({
    endpoint: "https://example.test/functions/v1/chess-api",
    getSessionToken: () => session,
    fetchImpl: async () => ({ ok: true, json: async () => { throw new Error("not json"); } }),
  });
  await assert.rejects(client.identity(), /invalid response/);
});
