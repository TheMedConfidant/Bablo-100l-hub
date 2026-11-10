(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BabloFlashcardSync = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  const RATINGS = new Set(['again', 'hard', 'good', 'easy']);
  const DEFAULT_EVENT_LIMIT = 5000;

  function timestampOf(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function stableValue(value) {
    if (Array.isArray(value)) return '[' + value.map(stableValue).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableValue(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function createReviewEvent(input) {
    const x = input || {};
    const deviceId = String(x.deviceId || '').trim();
    const cardId = String(x.cardId || '').trim();
    const sequence = Number(x.sequence);
    const reviewedAt = timestampOf(x.reviewedAt);
    const rating = String(x.rating || '').toLowerCase();
    if (!deviceId || !cardId) throw new Error('A device ID and card ID are required.');
    if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error('A non-negative review sequence is required.');
    if (!RATINGS.has(rating)) throw new Error('Unsupported flashcard rating.');
    if (!reviewedAt) throw new Error('A valid review timestamp is required.');
    return {
      eventId: deviceId + ':' + sequence,
      cardId,
      rating,
      repetitions: Math.max(0, Number(x.repetitions) || 0),
      easeFactor: Math.max(1.3, Math.min(3, Number(x.easeFactor) || 2.3)),
      intervalDays: Math.max(0, Number(x.intervalDays) || 0),
      dueAt: timestampOf(x.dueAt),
      reviewedAt,
      deviceId
    };
  }

  function normaliseEvent(value) {
    if (!value || typeof value !== 'object') return null;
    const cardId = String(value.cardId || value.card_id || '').trim();
    if (!cardId) return null;
    const deviceId = String(value.deviceId || value.device_id || 'legacy').trim() || 'legacy';
    const reviewedAt = timestampOf(value.reviewedAt || value.reviewed_at ||
      (timestampOf(value.dueAt || value.due_at) - Math.max(0, Number(value.intervalDays || value.interval_days) || 0) * 86400000));
    const rating = RATINGS.has(String(value.rating || '').toLowerCase()) ? String(value.rating).toLowerCase() : 'good';
    const eventId = String(value.eventId || value.event_id ||
      ('legacy:' + deviceId + ':' + cardId + ':' + reviewedAt + ':' + rating));
    return {
      ...value,
      eventId,
      cardId,
      rating,
      deviceId,
      reviewedAt,
      dueAt: timestampOf(value.dueAt || value.due_at),
      repetitions: Math.max(0, Number(value.repetitions) || 0),
      easeFactor: Math.max(1.3, Math.min(3, Number(value.easeFactor) || 2.3)),
      intervalDays: Math.max(0, Number(value.intervalDays || value.interval_days) || 0)
    };
  }

  function compareEvents(a, b) {
    return a.reviewedAt - b.reviewedAt ||
      a.deviceId.localeCompare(b.deviceId) ||
      a.eventId.localeCompare(b.eventId);
  }

  function mergeReviewEvents(localEvents, remoteEvents, limit) {
    const max = Number.isSafeInteger(limit) && limit > 0 ? limit : DEFAULT_EVENT_LIMIT;
    const byId = new Map();
    [...(Array.isArray(localEvents) ? localEvents : []), ...(Array.isArray(remoteEvents) ? remoteEvents : [])]
      .map(normaliseEvent).filter(Boolean).forEach(event => {
        const old = byId.get(event.eventId);
        if (!old || stableValue(event) > stableValue(old)) byId.set(event.eventId, event);
      });
    return [...byId.values()].sort(compareEvents).slice(-max);
  }

  function latestReviewState(events) {
    const latest = {};
    mergeReviewEvents(events, []).forEach(event => {
      const old = latest[event.cardId];
      if (!old || compareEvents(old, event) <= 0) latest[event.cardId] = event;
    });
    return latest;
  }

  function legacyReviewsToEvents(reviewMap, deviceId) {
    const source = reviewMap && typeof reviewMap === 'object' ? reviewMap : {};
    return Object.keys(source).sort().map(cardId => {
      const old = source[cardId] || {};
      const dueAt = timestampOf(old.dueAt);
      const intervalDays = Math.max(0, Number(old.intervalDays) || 0);
      const reviewedAt = timestampOf(old.reviewedAt || (dueAt ? dueAt - intervalDays * 86400000 : 0));
      return normaliseEvent({
        ...old,
        eventId: 'legacy:' + String(deviceId || 'device') + ':' + cardId + ':' + reviewedAt,
        cardId,
        deviceId: String(deviceId || 'device'),
        reviewedAt
      });
    }).filter(Boolean);
  }

  return {
    RATINGS: [...RATINGS],
    DEFAULT_EVENT_LIMIT,
    createReviewEvent,
    mergeReviewEvents,
    latestReviewState,
    legacyReviewsToEvents
  };
});
