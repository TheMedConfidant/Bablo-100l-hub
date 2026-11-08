'use strict';

// Same-origin, read-only configuration endpoint for the browser analytics SDK.
// The PostHog project token is a public ingestion token, not an API secret.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = process.env.POSTHOG_PROJECT_TOKEN;
  const apiHost = process.env.POSTHOG_API_HOST;
  if (!token || !apiHost) return res.status(503).json({ enabled: false });
  return res.status(200).json({ enabled: true, token, apiHost });
};
