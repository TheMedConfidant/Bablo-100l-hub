/* Bablo Hub V2 — student analytics adapter.
 * Uses the existing session-validated hub_course_analytics RPC.
 * The host app must pass its current session token; never put it in a URL.
 */
(function (root) {
  "use strict";
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function formatDate(value) {
    if (!value) return "No recorded attempt";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Date unavailable" :
      d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  async function loadCourseAnalytics(options) {
    const o = options || {};
    if (!o.supabaseUrl || !o.publishableKey || !o.sessionToken) {
      throw new Error("Sign in to Bablo Hub to view your analytics.");
    }
    const days = Math.max(1, Math.min(3650, Math.floor(Number(o.days) || 365)));
    const fetcher = o.fetch || root.fetch;
    const response = await fetcher(String(o.supabaseUrl).replace(/\/$/, "") + "/rest/v1/rpc/hub_course_analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": o.publishableKey,
        "Authorization": "Bearer " + o.publishableKey
      },
      body: JSON.stringify({ p_token: o.sessionToken, p_days: days })
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Your session could not be verified. Sign in again.");
      throw new Error("Analytics could not be loaded. Please try again.");
    }
    const data = await response.json();
    if (!data || data.ok !== true || !Array.isArray(data.courses)) {
      throw new Error("The analytics service returned an unexpected response.");
    }
    return data;
  }
  function renderCourseAnalytics(data) {
    const courses = Array.isArray(data && data.courses) ? data.courses : [];
    const attempts = courses.reduce((sum, c) => sum + (Number(c.attempts) || 0), 0);
    const weighted = attempts ? courses.reduce((sum, c) => sum + (Number(c.average_accuracy) || 0) * (Number(c.attempts) || 0), 0) / attempts : 0;
    const best = courses.length ? Math.max.apply(null, courses.map(c => Number(c.best_accuracy) || 0)) : 0;
    const weak = courses.filter(c => Number(c.average_accuracy) < 60).sort((a, b) => a.average_accuracy - b.average_accuracy);
    const cards = courses.slice().sort((a, b) => (Number(a.average_accuracy) || 0) - (Number(b.average_accuracy) || 0)).map(function (c) {
      const accuracy = Math.max(0, Math.min(100, Number(c.average_accuracy) || 0));
      const bestScore = Math.max(0, Math.min(100, Number(c.best_accuracy) || 0));
      const latest = Math.max(0, Math.min(100, Number(c.latest_accuracy) || 0));
      const delta = latest - accuracy;
      const momentum = Math.abs(delta) < 0.5 ? 'In line with average' : (delta > 0 ? '↑ ' : '↓ ') + Math.abs(delta).toFixed(1) + ' points vs average';
      return '<article class="bablo-v2-course-card">' +
        '<div class="bablo-v2-course-head"><strong>' + escapeHtml(c.course) + '</strong><span>' + accuracy.toFixed(1) + '% average</span></div>' +
        '<div class="bablo-v2-track" role="progressbar" aria-label="' + escapeHtml(c.course) + ' average accuracy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + accuracy.toFixed(1) + '"><i style="width:' + accuracy + '%"></i></div>' +
        '<div class="bablo-v2-course-meta"><span>' + (Number(c.attempts) || 0) + ' attempts</span><span>Best ' + bestScore.toFixed(1) + '%</span><span>Latest ' + latest.toFixed(1) + '%</span></div>' +
        '<small>' + momentum + ' · Last attempt: ' + escapeHtml(formatDate(c.last_attempt_at)) + '</small></article>';
    }).join("");
    const weakHtml = weak.length
      ? '<ul>' + weak.slice(0, 5).map(c => '<li><strong>' + escapeHtml(c.course) + '</strong> — ' + Number(c.average_accuracy).toFixed(1) + '% average. Prioritise targeted practice and review.</li>').join("") + '</ul>'
      : '<p class="bablo-v2-muted">No course is currently below 60% in this period. Keep practising to build consistency.</p>';
    const mostPractised = courses.length ? courses.slice().sort((x, y) => (Number(y.attempts) || 0) - (Number(x.attempts) || 0))[0] : null;
    const strongest = courses.length ? courses.slice().sort((x, y) => (Number(y.average_accuracy) || 0) - (Number(x.average_accuracy) || 0))[0] : null;
    const momentum = attempts ? courses.reduce((sum, c) => sum + ((Number(c.latest_accuracy) || 0) - (Number(c.average_accuracy) || 0)) * (Number(c.attempts) || 0), 0) / attempts : 0;
    const momentumLabel = Math.abs(momentum) < 0.5 ? 'Steady' : (momentum > 0 ? 'Improving' : 'Needs attention');
    return '<section class="bablo-v2-analytics">' +
      '<style>.bablo-v2-analytics{color:var(--bablo-v2-text,#f4f6fa);font:14px/1.5 system-ui,sans-serif}.bablo-v2-analytics *{box-sizing:border-box}.bablo-v2-analytics .bablo-v2-muted{color:var(--bablo-v2-muted,#aab3c2)}.bablo-v2-analytics .bablo-v2-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.bablo-v2-analytics .bablo-v2-stat,.bablo-v2-analytics .bablo-v2-course-card,.bablo-v2-analytics .bablo-v2-weak{background:var(--bablo-v2-panel,#191d24);border:1px solid var(--bablo-v2-line,#303744);border-radius:14px;padding:13px}.bablo-v2-analytics .bablo-v2-stat small,.bablo-v2-analytics .bablo-v2-course-card small{display:block;color:var(--bablo-v2-muted,#aab3c2);font-size:11px}.bablo-v2-analytics .bablo-v2-stat strong{display:block;font-size:23px;margin-top:3px}.bablo-v2-analytics h3{font-size:15px;margin:18px 0 9px}.bablo-v2-analytics .bablo-v2-course-list{display:grid;gap:9px}.bablo-v2-analytics .bablo-v2-course-head,.bablo-v2-analytics .bablo-v2-course-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.bablo-v2-analytics .bablo-v2-course-head span{color:var(--bablo-v2-gold,#e4b95e)}.bablo-v2-analytics .bablo-v2-track{height:7px;background:#343b46;border-radius:99px;overflow:hidden;margin:9px 0}.bablo-v2-analytics .bablo-v2-track i{display:block;height:100%;background:var(--bablo-v2-gold,#e4b95e);border-radius:99px}.bablo-v2-analytics .bablo-v2-course-meta{color:var(--bablo-v2-muted,#aab3c2);font-size:11px;margin-bottom:6px}.bablo-v2-analytics ul{padding-left:20px}.bablo-v2-analytics li{margin:7px 0}.bablo-v2-analytics .bablo-v2-empty{padding:18px;text-align:center;border:1px dashed var(--bablo-v2-line,#303744);border-radius:14px;color:var(--bablo-v2-muted,#aab3c2)}@media(max-width:420px){.bablo-v2-analytics .bablo-v2-summary{grid-template-columns:1fr 1fr}.bablo-v2-analytics .bablo-v2-summary .bablo-v2-stat:last-child{grid-column:span 2}}</style>' +
      '<div class="bablo-v2-summary"><div class="bablo-v2-stat"><small>Total attempts</small><strong>' + attempts + '</strong></div>' +
      '<div class="bablo-v2-stat"><small>Weighted accuracy</small><strong>' + weighted.toFixed(1) + '%</strong></div>' +
      '<div class="bablo-v2-stat"><small>Courses practised</small><strong>' + courses.length + '</strong></div>' +
      '<div class="bablo-v2-stat"><small>Recent momentum</small><strong>' + momentumLabel + '</strong><small>Latest scores vs course averages</small></div></div>' +
      '<div class="bablo-v2-weak"><h3>Priority review</h3>' + weakHtml + '</div>' +
      (courses.length ? '<div class="bablo-v2-course-meta" style="margin:12px 0"><span>Most practised: <strong>' + escapeHtml(mostPractised.course) + '</strong> (' + (Number(mostPractised.attempts) || 0) + ' attempts)</span><span>Strongest average: <strong>' + escapeHtml(strongest.course) + '</strong> (' + (Number(strongest.average_accuracy) || 0).toFixed(1) + '%)</span></div>' : '') +
      '<h3>Course performance · ' + (Number(data.days) || 365) + ' days</h3>' +
      (cards ? '<div class="bablo-v2-course-list">' + cards + '</div>' : '<div class="bablo-v2-empty">No quiz attempts recorded for this period yet. Complete a practice session to start building your analytics.</div>') +
      '<p class="bablo-v2-muted" style="font-size:11px;margin-top:12px">Based on your saved quiz results. Topic-level insights will appear when question-level topic tracking is available.</p></section>';
  }
  async function mountCourseAnalytics(element, options) {
    if (!element) throw new Error("Analytics container was not found.");
    element.textContent = "Loading your analytics…";
    try {
      const data = await loadCourseAnalytics(options);
      element.innerHTML = renderCourseAnalytics(data);
      return data;
    } catch (error) {
      element.textContent = error.message || "Analytics unavailable.";
      throw error;
    }
  }
  const api = { loadCourseAnalytics, renderCourseAnalytics, mountCourseAnalytics };
  root.BabloV2Analytics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
