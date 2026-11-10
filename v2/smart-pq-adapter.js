/* Bablo Hub V2 — adapter for the existing V1 question bank and local progress model.
 * Legacy question shape: {i,c,u,s,q,o,a,e}; DB.stats[id] = [attempts, correct];
 * DB.missed[id] = cumulative missed-answer count.
 * This adapter is pure: callers pass snapshots; it never reads/writes localStorage.
 */
(function (root) {
  "use strict";

  function mapLegacyQuestions(bank) {
    return (Array.isArray(bank) ? bank : []).filter(q => q && q.i != null).map(q => ({
      id: String(q.i),
      course: String(q.c || ""),
      topic: String(q.u || q.c || "General"),
      difficulty: q.difficulty || "medium",
      frequencyWeight: q.frequencyWeight || q.frequency || 1,
      tags: Array.isArray(q.tags) ? q.tags.slice() : [],
      source: q
    }));
  }

  function mapLegacyHistory(questions, stats, missed) {
    const statMap = stats && typeof stats === "object" ? stats : {};
    const missedMap = missed && typeof missed === "object" ? missed : {};
    const rows = [];
    (Array.isArray(questions) ? questions : []).forEach(q => {
      const raw = statMap[q.id];
      const attempts = Array.isArray(raw) ? Math.max(0, Math.floor(Number(raw[0]) || 0)) : 0;
      const correct = Array.isArray(raw) ? Math.max(0, Math.min(attempts, Math.floor(Number(raw[1]) || 0))) : 0;
      const wrongFromStats = attempts - correct;
      const wrong = Math.max(wrongFromStats, Math.max(0, Math.floor(Number(missedMap[q.id]) || 0)));
      const total = Math.max(attempts, correct + wrong);
      for (let i = 0; i < total; i++) {
        rows.push({ questionId: q.id, correct: i < correct, attemptedAt: null });
      }
    });
    return rows;
  }

  function buildFromLegacyState(options) {
    const o = options || {};
    if (!root.BabloSmartPQ || typeof root.BabloSmartPQ.buildSmartPQSet !== "function") {
      throw new Error("Load bablo-smart-pq-engine.js before the legacy adapter.");
    }
    const questions = mapLegacyQuestions(o.questionBank);
    const history = mapLegacyHistory(questions, o.stats, o.missed);
    const selected = root.BabloSmartPQ.buildSmartPQSet({
      questions,
      history,
      targetCount: o.targetCount,
      targetDifficulty: o.targetDifficulty,
      now: o.now,
      seed: o.seed
    });
    return Object.assign({}, selected, {
      sourceQuestionCount: questions.length,
      historyQuestionCount: new Set(history.map(h => h.questionId)).size,
      adapter: "bablo-v1-question-bank"
    });
  }

  const api = { mapLegacyQuestions, mapLegacyHistory, buildFromLegacyState };
  root.BabloV2LegacyPQAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
