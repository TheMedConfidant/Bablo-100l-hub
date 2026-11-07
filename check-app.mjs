import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

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
  assert.match(html, /<html\b/i, "HTML root element missing");
  assert.match(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, "Page title missing");
  assert.match(html, /name=["']description["']/i, "Meta description missing");
  pass("HTML document and basic SEO metadata");
} catch (e) { fail(e.message); }

if (html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs, body]) => !/\bsrc\s*=/i.test(attrs) && body.trim());
  if (!scripts.length) fail("No inline JavaScript blocks found");
  let syntaxErrors = 0;
  scripts.forEach(([, , body], i) => {
    try { new Function(body); }
    catch (e) { syntaxErrors++; console.error(`Inline script ${i + 1}: ${e.message}`); }
  });
  if (!syntaxErrors && scripts.length) pass(`JavaScript syntax (${scripts.length} inline blocks)`);
  else fail(`${syntaxErrors} inline JavaScript syntax error(s)`);

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
  if (/const tab = \{ plan: 'plan'/.test(html)) pass("Calendar has its own active navigation state");
  else fail("Calendar navigation active state regression detected");
  if (/function localDateKey\(/.test(html)) pass("Calendar uses a local-date helper");
  else fail("Calendar local-date helper missing");
}
if (html) {
  function extractFunction(name) {
    const start = html.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `Missing function: ${name}`);
    const open = html.indexOf("{", start);
    let depth = 0, quote = "", escaped = false;
    for (let i = open; i < html.length; i++) {
      const ch = html[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\\\") escaped = true;
        else if (ch === quote) quote = "";
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
      if (ch === "{") depth++;
      if (ch === "}" && --depth === 0) return html.slice(start, i + 1);
    }
    throw new Error(`Unclosed function: ${name}`);
  }
  try {
    const context = { DB: { statsLegacy: { legacyQ: [2, 1] }, statsByDevice: {
      phoneA: { sharedQ: [3, 2], phoneQ: [1, 1] },
      phoneB: { sharedQ: [2, 1], tabletQ: [4, 3] }
    } } };
    vm.createContext(context);
    vm.runInContext(extractFunction("mergeCounterMaps") + "\\n" + extractFunction("rebuildAggregateStats"), context);
    const merged = context.mergeCounterMaps({ q: [2, 1] }, { q: [3, 2], r: [1, 0] });
    assert.deepEqual(JSON.parse(JSON.stringify(merged)), { q: [3, 2], r: [1, 0] });
    context.rebuildAggregateStats();
    assert.deepEqual(JSON.parse(JSON.stringify(context.DB.stats)), {
      legacyQ: [2, 1], sharedQ: [5, 3], phoneQ: [1, 1], tabletQ: [4, 3]
    });
    pass("Cross-device counters merge without discarding other devices or legacy progress");
  } catch (e) { fail(`Cross-device analytics test: ${e.message}`); }
}
for (const p of ["robots.txt", "sitemap.xml"]) {
  try {
    const s = read(p);
    if (p === "robots.txt") assert.match(s, /Sitemap:/i, "robots.txt should declare sitemap");
    else assert.match(s, /<urlset\b|<sitemapindex\b/i, "sitemap root missing");
    pass(`${p} basic structure`);
  } catch (e) { fail(e.message); }
}
console.log("\\nStatic checks do not prove multiplayer, phone notifications, calendar persistence, or security work end-to-end.");
if (failed) process.exit(1);
