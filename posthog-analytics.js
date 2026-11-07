(function () {
  'use strict';
  if (window.__BABLO_POSTHOG_BOOTSTRAPPED__) return;
  window.__BABLO_POSTHOG_BOOTSTRAPPED__ = true;

  var allowed = {
    page_view: 'bablo_page_view',
    quiz_start: 'bablo_quiz_started',
    quiz_complete: 'bablo_quiz_completed'
  };
  var queue = [];
  var client = null;

  function safeProps(type, input) {
    input = input && typeof input === 'object' ? input : {};
    var props = { app: 'Bablo Hub', feature_area: 'learning' };
    if (type === 'page_view' && typeof input.page === 'string') {
      props.page = input.page.slice(0, 40);
    }
    if ((type === 'quiz_start' || type === 'quiz_complete')) {
      if (typeof input.feature === 'string') props.mode = input.feature.slice(0, 24);
      if (typeof input.page === 'string') props.course = input.page.slice(0, 24);
    }
    return props;
  }

  function send(type, input) {
    var eventName = allowed[type];
    if (!eventName) return;
    var item = { event: eventName, properties: safeProps(type, input) };
    if (client) {
      try { client.capture(item.event, item.properties); } catch (_) {}
    } else if (queue.length < 20) {
      queue.push(item);
    }
  }

  function loadSdk(config) {
    if (!config || !config.enabled || !config.token || !config.apiHost) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = config.apiHost.replace(/\/$/, '') + '/static/array.js';
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      if (!window.posthog || typeof window.posthog.init !== 'function') return;
      window.posthog.init(config.token, {
        api_host: config.apiHost,
        defaults: '2026-05-30',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_persistence: true,
        person_profiles: 'never',
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false
        }
      });
      client = window.posthog;
      while (queue.length) {
        var item = queue.shift();
        try { client.capture(item.event, item.properties); } catch (_) {}
      }
      try {
        var page = (location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0] || 'home');
        send('page_view', { page: page });
      } catch (_) {}
    };
    script.onerror = function () { /* Analytics must never block the learning app. */ };
    (document.head || document.documentElement).appendChild(script);
  }

  // The existing Hub already emits anonymous, coarse-grained action events.
  // Mirror only a small allowlist; never send IDs, names, answers, or free text.
  var attempts = 0;
  var timer = setInterval(function () {
    attempts += 1;
    if (typeof window.trackEvent === 'function') {
      clearInterval(timer);
      var original = window.trackEvent;
      window.trackEvent = function (type, properties) {
        try { original.apply(this, arguments); } catch (_) {}
        send(type, properties);
      };
    } else if (attempts >= 40) {
      clearInterval(timer);
    }
  }, 250);

  fetch('/api/posthog-config', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(loadSdk)
    .catch(function () { /* No network/config: app continues without analytics. */ });
})();
