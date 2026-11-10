"use strict";
const assert = require("node:assert/strict");
const engine = require("./smart-pq-engine.js");
globalThis.BabloSmartPQ = engine;
const adapter = require("./smart-pq-adapter.js");

const bank = [
  { i: "q1", c: "BIO", u: "Cells", q: "Q1", o: ["a","b"], a: 0 },
  { i: "q2", c: "BIO", u: "Cells", q: "Q2", o: ["a","b"], a: 1, difficulty: "hard" },
  { i: "q3", c: "CHM", u: "Acids", q: "Q3", o: ["a","b"], a: 0 }
];
const mapped = adapter.mapLegacyQuestions(bank);
assert.equal(mapped.length, 3);
assert.equal(mapped[0].id, "q1");
assert.equal(mapped[0].topic, "Cells");

const history = adapter.mapLegacyHistory(mapped, {
  q1: [4, 1],
  q2: [2, 2]
}, { q1: 3 });
assert.equal(history.filter(x => x.questionId === "q1").length, 4);
assert.equal(history.filter(x => x.questionId === "q1" && x.correct).length, 1);
assert.equal(history.filter(x => x.questionId === "q1" && !x.correct).length, 3);
assert.equal(history.filter(x => x.questionId === "q2" && x.correct).length, 2);

const result = adapter.buildFromLegacyState({
  questionBank: bank,
  stats: { q1: [4, 1], q2: [2, 2] },
  missed: { q1: 3 },
  targetCount: 2,
  seed: 7,
  now: 1800000000000
});
assert.equal(result.returned, 2);
assert.equal(new Set(result.questions.map(x => x.question.id)).size, 2);
assert.equal(result.sourceQuestionCount, 3);
assert.equal(result.adapter, "bablo-v1-question-bank");
assert.ok(result.questions.some(x => x.question.id === "q1"));
console.log("Smart PQ legacy adapter tests passed.");
