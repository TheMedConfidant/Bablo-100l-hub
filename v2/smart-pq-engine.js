/* Bablo Hub V2 — Smart PQ selection engine.
 * Pure client-side ranking logic. No network calls, account identifiers, or writes.
 * Adapter contract: questions [{id, course, topic, difficulty, frequencyWeight, tags}]
 * history [{questionId, correct, attemptedAt, responseMs}]
 */
(function (root) {
  "use strict";

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function normaliseDifficulty(value) {
    const v = String(value || "medium").toLowerCase();
    if (["easy", "beginner"].includes(v)) return 1;
    if (["hard", "advanced"].includes(v)) return 3;
    return 2;
  }
  function stableHash(value) {
    let h = 2166136261;
    const s = String(value);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededRandom(seed) {
    let state = (Number(seed) >>> 0) || 0x6d2b79f5;
    return function () {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildSmartPQSet(options) {
    const opts = options || {};
    const questions = Array.isArray(opts.questions) ? opts.questions : [];
    const history = Array.isArray(opts.history) ? opts.history : [];
    const targetCount = clamp(Math.floor(Number(opts.targetCount) || 20), 1, 200);
    const targetDifficulty = clamp(Number(opts.targetDifficulty) || 2, 1, 3);
    const now = Number(opts.now) || Date.now();
    const random = seededRandom(opts.seed == null ? stableHash(questions.length + ":" + targetCount) : opts.seed);
    const byId = new Map();
    const topicStats = new Map();

    history.forEach(function (attempt) {
      if (!attempt || attempt.questionId == null) return;
      const id = String(attempt.questionId);
      const date = Number(new Date(attempt.attemptedAt || 0));
      const validDate = Number.isFinite(date) && date > 0 ? date : 0;
      const row = byId.get(id) || { attempts: 0, wrong: 0, correct: 0, lastAt: 0, responseMs: [] };
      row.attempts++;
      if (attempt.correct === true) row.correct++;
      else if (attempt.correct === false) row.wrong++;
      row.lastAt = Math.max(row.lastAt, validDate);
      if (Number.isFinite(Number(attempt.responseMs)) && Number(attempt.responseMs) > 0) row.responseMs.push(Number(attempt.responseMs));
      byId.set(id, row);
    });

    questions.forEach(function (q) {
      const topic = String(q.topic || q.course || "General");
      const stats = topicStats.get(topic) || { attempts: 0, correct: 0, wrong: 0, seen: 0, total: 0 };
      stats.total++;
      const h = byId.get(String(q.id));
      if (h) {
        stats.seen++;
        stats.attempts += h.attempts;
        stats.correct += h.correct;
        stats.wrong += h.wrong;
      }
      topicStats.set(topic, stats);
    });

    const scored = questions.filter(q => q && q.id != null).map(function (q) {
      const id = String(q.id);
      const topic = String(q.topic || q.course || "General");
      const h = byId.get(id);
      const t = topicStats.get(topic) || { attempts: 0, correct: 0, wrong: 0, seen: 0, total: 1 };
      const accuracy = t.attempts ? t.correct / t.attempts : 0.5;
      const topicWeakness = 1 - accuracy;
      const topicCoverageGap = 1 - (t.seen / Math.max(1, t.total));
      const questionWrongRate = h && h.attempts ? h.wrong / h.attempts : 0;
      const questionUnseen = h ? 0 : 1;
      const daysSince = h && h.lastAt ? Math.max(0, (now - h.lastAt) / 86400000) : 365;
      const due = h ? clamp(daysSince / 14, 0, 1) : 1;
      const difficulty = normaliseDifficulty(q.difficulty);
      const frequency = clamp(Number(q.frequencyWeight) || 1, 0.5, 3);
      const repeatedMistake = h ? clamp(h.wrong / Math.max(1, h.attempts), 0, 1) : 0;
      const averageResponseMs = h && h.responseMs.length
        ? h.responseMs.reduce((sum, value) => sum + value, 0) / h.responseMs.length : 0;
      const slowResponse = clamp(averageResponseMs / 120000, 0, 1);
      const difficultyFit = 1 - Math.abs(difficulty - targetDifficulty) / 2;
      const score =
        topicWeakness * 0.28 +
        questionWrongRate * 0.22 +
        topicCoverageGap * 0.17 +
        questionUnseen * 0.12 +
        due * 0.09 +
        (frequency - 0.5) / 2.5 * 0.06 +
        difficultyFit * 0.04 +
        slowResponse * 0.02;
      return {
        question: q,
        topic: topic,
        score: score + random() * 0.0001,
        reason: questionUnseen ? "Not yet attempted" :
          questionWrongRate >= 0.5 ? "Repeated mistakes" :
          topicWeakness >= 0.45 ? "Weak topic" :
          topicCoverageGap >= 0.5 ? "Topic needs coverage" :
          due >= 0.7 ? "Due for revision" : "Strengthen recall",
        difficulty: difficulty,
        frequency: frequency,
        repeatedMistake: repeatedMistake,
        slowResponse: slowResponse
      };
    });

    const selected = [];
    const usedIds = new Set();
    const topicCounts = new Map();
    const maxPerTopic = Math.max(2, Math.ceil(targetCount * 0.4));
    while (selected.length < targetCount && selected.length < scored.length) {
      let bestIndex = -1;
      let bestValue = -Infinity;
      for (let i = 0; i < scored.length; i++) {
        const item = scored[i];
        const id = String(item.question.id);
        if (usedIds.has(id)) continue;
        const count = topicCounts.get(item.topic) || 0;
        const diversityPenalty = count >= maxPerTopic ? 0.35 * (count - maxPerTopic + 1) : 0;
        const value = item.score - diversityPenalty;
        if (value > bestValue) { bestValue = value; bestIndex = i; }
      }
      if (bestIndex < 0) break;
      const chosen = scored[bestIndex];
      usedIds.add(String(chosen.question.id));
      topicCounts.set(chosen.topic, (topicCounts.get(chosen.topic) || 0) + 1);
      selected.push({
        question: chosen.question,
        priority: Number(chosen.score.toFixed(4)),
        reason: chosen.reason,
        topic: chosen.topic,
        difficulty: chosen.difficulty
      });
    }

    return {
      questions: selected,
      requested: targetCount,
      returned: selected.length,
      generatedAt: new Date(now).toISOString(),
      strategy: "weakness + mistakes + coverage + spaced review + topic diversity",
      topicSummary: Array.from(topicStats.entries()).map(function (entry) {
        const s = entry[1];
        return {
          topic: entry[0],
          accuracy: s.attempts ? Number((s.correct / s.attempts * 100).toFixed(1)) : null,
          attemptedQuestions: s.seen,
          availableQuestions: s.total
        };
      }).sort((a, b) => (a.accuracy == null ? -1 : a.accuracy) - (b.accuracy == null ? -1 : b.accuracy))
    };
  }

  const api = { buildSmartPQSet: buildSmartPQSet };
  root.BabloSmartPQ = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
