"use strict";
const assert = require("node:assert/strict");
const sync = require("./flashcard-sync.js");

const first = sync.createReviewEvent({
  deviceId: "device-a", sequence: 1, cardId: "BIO-001", rating: "good",
  repetitions: 2, easeFactor: 2.4, intervalDays: 3, dueAt: 4000, reviewedAt: 1000
});
const second = sync.createReviewEvent({
  deviceId: "device-b", sequence: 1, cardId: "BIO-001", rating: "again",
  repetitions: 0, easeFactor: 2.2, intervalDays: 0.01, dueAt: 9000, reviewedAt: 5000
});
const other = sync.createReviewEvent({
  deviceId: "device-a", sequence: 2, cardId: "CHM-004", rating: "easy",
  repetitions: 1, easeFactor: 2.5, intervalDays: 4, dueAt: 6000, reviewedAt: 2000
});

const merged = sync.mergeReviewEvents([first, other], [second]);
assert.equal(merged.length, 3, "concurrent device reviews are retained");
assert.equal(sync.mergeReviewEvents(merged, [first]).length, 3, "retrying an event is idempotent");
assert.equal(sync.latestReviewState(merged)["BIO-001"].eventId, second.eventId, "latest review wins for scheduling");
assert.deepEqual(
  sync.mergeReviewEvents([first], [second]),
  sync.mergeReviewEvents([second], [first]),
  "merge order does not change the result"
);

const legacy = sync.legacyReviewsToEvents({
  "OLD-1": { rating: "hard", intervalDays: 2, dueAt: 1728001000, repetitions: 1 }
}, "legacy-device");
assert.equal(legacy.length, 1, "legacy local review records are convertible");
assert.equal(legacy[0].cardId, "OLD-1");

const capped = sync.mergeReviewEvents([first, second, other], [], 2);
assert.equal(capped.length, 2, "event history respects its retention limit");
assert.ok(capped[0].reviewedAt <= capped[1].reviewedAt, "events remain chronologically ordered");
assert.equal(first.rating, "good", "merge does not mutate the original event");
assert.throws(() => sync.createReviewEvent({ deviceId: "d", sequence: 0, cardId: "x", rating: "unknown", reviewedAt: 1 }), /rating/);

console.log("PASS: flashcard event creation, concurrent merge, idempotency, deterministic ordering, latest state, legacy conversion and bounded history.");
