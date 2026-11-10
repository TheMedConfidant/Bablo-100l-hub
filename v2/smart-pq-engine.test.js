const assert = require("node:assert/strict");
const { buildSmartPQSet } = require("./smart-pq-engine.js");

const questions = [
  { id: "a1", course: "BIO101", topic: "Cell Biology", difficulty: "medium", frequencyWeight: 2 },
  { id: "a2", course: "BIO101", topic: "Cell Biology", difficulty: "hard", frequencyWeight: 2 },
  { id: "a3", course: "BIO101", topic: "Cell Biology", difficulty: "easy" },
  { id: "b1", course: "BIO101", topic: "Genetics", difficulty: "medium", frequencyWeight: 3 },
  { id: "b2", course: "BIO101", topic: "Genetics", difficulty: "easy" },
  { id: "c1", course: "BIO101", topic: "Ecology", difficulty: "medium" },
  { id: "c2", course: "BIO101", topic: "Ecology", difficulty: "hard" }
];
const now = Date.parse("2026-11-10T00:00:00Z");
const history = [
  { questionId: "a1", correct: false, attemptedAt: "2026-11-09T00:00:00Z", responseMs: 90000 },
  { questionId: "a1", correct: false, attemptedAt: "2026-11-09T01:00:00Z", responseMs: 85000 },
  { questionId: "a2", correct: false, attemptedAt: "2026-11-09T02:00:00Z", responseMs: 70000 },
  { questionId: "b1", correct: true, attemptedAt: "2026-11-09T03:00:00Z", responseMs: 30000 },
  { questionId: "b2", correct: true, attemptedAt: "2026-11-09T04:00:00Z", responseMs: 25000 },
  { questionId: "c1", correct: true, attemptedAt: "2026-11-09T05:00:00Z", responseMs: 25000 }
];

const first = buildSmartPQSet({ questions, history, targetCount: 5, now, seed: 42 });
const second = buildSmartPQSet({ questions, history, targetCount: 5, now, seed: 42 });
assert.equal(first.returned, 5, "returns requested number when enough questions exist");
assert.deepEqual(first.questions.map(x => x.question.id), second.questions.map(x => x.question.id), "seed makes ordering reproducible");
assert.equal(new Set(first.questions.map(x => x.question.id)).size, 5, "never selects a question twice");
assert.ok(first.questions.some(x => x.topic === "Cell Biology"), "weak topic receives priority");
assert.ok(first.questions.some(x => x.topic === "Genetics" || x.topic === "Ecology"), "selection preserves topic diversity");
assert.ok(first.questions.every(x => x.reason && Number.isFinite(x.priority)), "each item explains its priority");
assert.equal(buildSmartPQSet({ questions: [], history, targetCount: 10, now }).returned, 0, "handles empty banks");
assert.equal(buildSmartPQSet({ questions, history, targetCount: 200, now }).returned, questions.length, "caps output to available unique questions");
assert.ok(first.topicSummary.some(x => x.topic === "Cell Biology" && x.accuracy === 0), "topic accuracy is calculated correctly");

const calibrated = buildSmartPQSet({
  questions: [
    { id: "easy", topic: "Balanced", difficulty: "easy" },
    { id: "medium", topic: "Balanced", difficulty: "medium" },
    { id: "hard", topic: "Balanced", difficulty: "hard" }
  ],
  history: [], targetCount: 1, targetDifficulty: 3, now, seed: 9
});
assert.equal(calibrated.questions[0].difficulty, 3, "difficulty calibration favours the requested level");

console.log("PASS: Smart PQ ranking, repeat protection, deterministic ordering, weak-topic prioritisation, diversity, reasons, empty bank, and bounds.");
