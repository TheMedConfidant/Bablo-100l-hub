#!/usr/bin/env python3
"""Apply the safe Phase 1 Calendar/navigation diagnostics patch to Bablo Hub index.html.
Run: python apply_phase1_patch.py index.html
Creates index.phase1.html; it never overwrites the original.
"""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("Usage: python apply_phase1_patch.py path/to/index.html")

src = Path(sys.argv[1])
html = src.read_text(encoding="utf-8")
patched = html
changes = []

def replace_once(old, new, label):
    global patched
    if old not in patched:
        print(f"SKIP (anchor not found): {label}")
        return
    patched = patched.replace(old, new, 1)
    changes.append(label)
    print(f"PATCHED: {label}")

replace_once(
"""  const items = [['home', '#/', 'Home', 'home'], ['board', '#/board', 'Board', 'board'], ['social', '#/social', 'Social', 'social'], ['gpa', '#/gpa', 'GPA lab', 'gpa'], ['me', '#/me', 'Me', 'me']];""",
"""  const items = [['home', '#/', 'Home', 'home'], ['plan', '#/plan', 'Calendar', 'calendar'], ['board', '#/board', 'Board', 'board'], ['social', '#/social', 'Social', 'social'], ['me', '#/me', 'Me', 'me']];""",
"Add Calendar to bottom navigation")

replace_once(
"""const tab = { plan: 'home', programmes: 'board', weak: 'home', chess: null, home: 'home', course: 'home', setup: 'home', result: 'home', board: 'board', cup: 'board', social: 'social', gpa: 'gpa', me: 'me' }[v] || null;""",
"""const tab = { plan: 'plan', programmes: 'board', weak: 'home', chess: null, home: 'home', course: 'home', setup: 'home', result: 'home', board: 'board', cup: 'board', social: 'social', gpa: 'gpa', me: 'me' }[v] || null;""",
"Highlight Calendar tab when active")

replace_once(
"""  } catch (e) { console.error(e); mount(wrap(h('div', { class: 'panel stack' }, h('h2', null, 'Something went wrong'), h('p', { class: 'muted' }, 'Go back home and try again.'), h('a', { class: 'btn primary', href: '#/' }, 'Back home')))); }""",
"""  } catch (e) { console.error('Bablo route error:', e); mount(wrap(h('div', { class: 'panel stack' }, h('h2', null, 'This page hit an error'), h('p', { class: 'muted small' }, (e && e.message) ? e.message : 'Unknown page error'), h('a', { class: 'btn primary', href: '#/' }, 'Back home')))); }""",
"Show actual page error instead of generic message")

if not changes:
    raise SystemExit("No changes applied. This index.html may not match the source version; do not upload a generated file.")

dest = src.with_name("index.phase1.html")
dest.write_text(patched, encoding="utf-8")
print(f"\nCreated: {dest}")
print(f"Applied {len(changes)} patch(es). Original left untouched.")
print("Note: this is a limited Calendar/navigation diagnostic patch, not the chess challenge timer/reactions patch.")
