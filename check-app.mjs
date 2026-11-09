import fs from "node:fs";
import assert from "node:assert/strict";

let failed = false;
const pass = (s) => console.log(`PASS: ${s}`);
const fail = (s) => { failed = true; console.error(`FAIL: ${s}`); };
const read = (p) => {
  assert.ok(fs.existsSync(p), `Required file missing: ${p}`);
  return fs.readFileSync(p, "utf8");
};

let html = "";
try {
  html = read("index.html");
  assert.ok(html.length > 5000, "index.html looks unexpectedly small");
  assert.match(html, /<html\\b/i, "HTML root element missing");
  assert.match(html, /<title\\b[^>]*>[\\s\\S]*?<\\/title>/i, "Page title missing");
  assert.match(html, /name=["']description["']/i, "Meta description missing");
  pass("HTML document and basic SEO metadata");
} catch (e) { fail(e.message); }

if (html) {
  const scripts = [...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script\\s*>/gi)]
    .filter(([, attrs, body]) => !/\\bsrc\\s*=/i.test(attrs) && body.trim());
  let jsonLdCount = 0, syntaxErrors = 0, jsCount = 0;
  scripts.forEach(([, attrs, body], i) => {
    if (/application\\/ld\\+json/i.test(attrs)) {
      jsonLdCount++;
      try { JSON.parse(body); } catch (e) { syntaxErrors++; console.error(`JSON-LD ${i + 1}: ${e.message}`); }
      return;
    }
    jsCount++;
    try { new Function(body); }
    catch (e) { syntaxErrors++; console.error(`Inline script ${i + 1}: ${e.message}`); }
  });
  if (jsonLdCount) pass(`JSON-LD structured data (${jsonLdCount} block)`);
  else fail("JSON-LD structured data missing");
  if (!syntaxErrors && jsCount) pass(`JavaScript syntax (${jsCount} inline blocks)`);
  else fail(`${syntaxErrors} inline script/JSON syntax error(s)`);

  for (const [label, re] of [
    ["chess marker", /chess/i],
    ["calendar marker", /calendar/i],
    ["quiz marker", /quiz/i],
    ["Glass theme", /Glass/i],
    ["Pink theme", /Pink/i],
    ["Purple theme", /Purple/i],
    ["Classic theme", /Classic/i],
  ]) {
    if (re.test(html)) pass(label);
    else fail(`Expected marker missing: ${label}`);
  }
  if (/const tab = \\{ plan: 'time'/.test(html)) pass("Time hub has its own active navigation state");
  else fail("Time navigation active state regression detected");
  if (/function planCalendar\\(/.test(html) && /function planView\\(/.test(html)) pass("Event planner and calendar view are present");
  else fail("Event planner/calendar view missing");
  if (/function premiumPricingView\\(/.test(html) && /₦500/.test(html)) pass("Premium pricing and Naira rates are present");
  else fail("Premium pricing page missing");
  if (/hub_submit_scores/.test(html)) pass("Leaderboard uses the session-validated score RPC");
  else fail("Leaderboard still lacks the secure score RPC");
  if (/BONUS_COS101/.test(html) && /function cosBonusView\\(/.test(html)) pass("COS history bonus and timeline renderer are present");
  else fail("COS history bonus is missing");
  if (/function premiumPricingView\\(/.test(html) && /PREMIUM_ITEM_PRICE = 500/.test(html)) pass("Premium pricing page and ₦500 item price are present");
  else fail("Premium pricing page missing");
  if (!/service_role|sk_live_|sk_test_/i.test(html)) pass("No server-side payment/database secret is embedded in the client");
  else fail("A server-side secret appears in client HTML");
}
for (const p of ["robots.txt", "sitemap.xml"]) {
  try {
    const s = read(p);
    if (p === "robots.txt") assert.match(s, /Sitemap:/i, "robots.txt should declare sitemap");
    else assert.match(s, /<urlset\\b|<sitemapindex\\b/i, "sitemap root missing");
    pass(`${p} basic structure`);
  } catch (e) { fail(e.message); }
}
console.log("\\nStatic checks do not prove multiplayer, hotspot networking, push delivery, payment processing, or security work end-to-end.");
if (failed) process.exit(1);
