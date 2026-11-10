/* Bablo Hub V2 — live bridge into the existing V1 practice session.
 * Reuses the authenticated account, BANK, DB progress and Core session runner.
 */
(function (root) {
  "use strict";
  root.startBabloSmartPQ = function (options) {
    if (!root.BabloV2LegacyPQAdapter || typeof startSession !== "function") {
      if (typeof toast === "function") toast("Smart PQ is still loading. Please try again.");
      return;
    }
    const result = root.BabloV2LegacyPQAdapter.buildFromLegacyState({
      questionBank: BANK,
      stats: DB.stats || {},
      missed: DB.missed || {},
      targetCount: options && options.targetCount || 20,
      targetDifficulty: options && options.targetDifficulty || 2
    });
    if (!result.returned) {
      if (typeof toast === "function") toast("No questions are available for Smart PQ yet.");
      return;
    }
    const ids = {};
    result.questions.forEach(item => { ids[item.question.id] = true; });
    startSession({
      course: "*",
      mode: "practice",
      n: result.returned,
      order: "shuffle",
      timerKind: "up",
      minutes: 0,
      ids: ids
    });
  };
})(window);
