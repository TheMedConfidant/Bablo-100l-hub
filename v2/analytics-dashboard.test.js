const assert = require("node:assert/strict");
const { loadCourseAnalytics, renderCourseAnalytics } = require("./analytics-dashboard.js");

(async () => {
  let request;
  const fakeFetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({
      ok: true, days: 30, total_attempts: 6,
      courses: [
        { course: "CHM101", attempts: 4, average_accuracy: 45, best_accuracy: 70, latest_accuracy: 40, last_attempt_at: "2026-11-09T10:00:00Z" },
        { course: "BIO101", attempts: 2, average_accuracy: 80, best_accuracy: 90, latest_accuracy: 80, last_attempt_at: "2026-11-08T10:00:00Z" }
      ]
    }) };
  };
  const data = await loadCourseAnalytics({
    supabaseUrl: "https://example.supabase.co/", publishableKey: "public-test-key",
    sessionToken: "session-test-token", days: 30, fetch: fakeFetch
  });
  assert.equal(request.url, "https://example.supabase.co/rest/v1/rpc/hub_course_analytics");
  assert.equal(JSON.parse(request.options.body).p_token, "session-test-token");
  assert.equal(data.courses.length, 2);
  const html = renderCourseAnalytics(data);
  assert.match(html, /Priority review/);
  assert.match(html, /CHM101/);
  assert.match(html, /45\.0% average/);
  assert.match(html, /topic-level topic tracking|Topic-level insights/i);
  await assert.rejects(() => loadCourseAnalytics({}), /Sign in/);
  const denied = async () => ({ ok: false, status: 403 });
  await assert.rejects(() => loadCourseAnalytics({ supabaseUrl:"x", publishableKey:"k", sessionToken:"t", fetch:denied }), /session could not be verified/);
  console.log("PASS: Analytics RPC request, session-token handling, course summaries, weak-course review, empty credentials, and authorization errors.");
})().catch(e => { console.error(e); process.exit(1); });
