#!/usr/bin/env python3
"""Build the static errata site from data/errata/*.yaml into site/.

Zero template-engine dependency (stdlib + PyYAML). Inline math written as
``$...$`` in the YAML is rendered client-side by MathJax (CDN). Output is plain
static HTML suitable for GitHub Pages. Run: python scripts/build.py
"""
from __future__ import annotations

import html
import shutil
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "errata"
SITE = ROOT / "site"

CSS = """
:root { color-scheme: light dark; --fg:#1a1a1a; --bg:#fff; --muted:#666;
  --line:#e3e3e3; --accent:#7a1f1f; --stub-bg:#fff4e5; --stub-fg:#8a5a00; --card:#fafafa; }
@media (prefers-color-scheme: dark) { :root { --fg:#e6e6e6; --bg:#151515; --muted:#9a9a9a;
  --line:#333; --accent:#e08a8a; --stub-bg:#3a2e12; --stub-fg:#e8c06a; --card:#1d1d1d; } }
* { box-sizing: border-box; }
body { font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--fg); background: var(--bg); margin: 0; }
.wrap { max-width: 820px; margin: 0 auto; padding: 2.2rem 1.2rem 4rem; }
a { color: var(--accent); }
h1 { font-size: 1.9rem; margin: 0 0 .3rem; }
h2 { font-size: 1.25rem; margin: 2.2rem 0 .2rem; padding-bottom: .3rem; border-bottom: 2px solid var(--line); }
.sub { color: var(--muted); margin: 0 0 1.5rem; }
.count { color: var(--muted); font-size: .9rem; margin: .1rem 0 1rem; }
ol.errata { list-style: none; margin: 0; padding: 0; }
ol.errata > li { display: grid; grid-template-columns: 5.5rem 1fr; gap: .6rem;
  padding: .55rem .2rem; border-bottom: 1px solid var(--line); }
.pg { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg.stub { color: var(--stub-fg); background: var(--stub-bg); border-radius: 4px;
  padding: 0 .4rem; font-size: .82rem; align-self: start; }
.txt { overflow-wrap: anywhere; }
.book-list { list-style: none; padding: 0; }
.book-list li { padding: .6rem .8rem; border: 1px solid var(--line); border-radius: 8px;
  margin-bottom: .5rem; background: var(--card); }
footer { margin-top: 3rem; color: var(--muted); font-size: .82rem; }
"""

MATHJAX = """
<script>window.MathJax={tex:{inlineMath:[['$','$']],displayMath:[['$$','$$']]},
  options:{skipHtmlTags:['script','style']}};</script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
"""


def page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>{CSS}</style>
{MATHJAX}
</head>
<body><div class="wrap">
{body}
<footer>Generated from structured source at
<a href="https://github.com/teorth/tao-web">github.com/teorth/tao-web</a>.
Corrections and page numbers welcome as issues or pull requests.</footer>
</div></body></html>
"""


def render_page_token(tok) -> tuple[str, bool]:
    """Return (label, is_stub) for the page cell."""
    if tok == "?":
        return ("p. ?", True)
    if tok is None:
        return ("", False)
    return (f"p. {html.escape(str(tok))}", False)


def build_book(doc: dict) -> tuple[str, str]:
    book = doc["book"]
    slug = book["slug"]
    parts = [f'<p><a href="index.html">&larr; All books</a></p>',
             f'<h1>Errata &mdash; {html.escape(book["title"])}</h1>']
    authors = ", ".join(book.get("authors", [])) or "Terence Tao"
    parts.append(f'<p class="sub">{html.escape(authors)}'
                 + (f' &middot; <a href="{html.escape(book["source"])}">original page</a>'
                    if book.get("source") else "") + "</p>")
    if book.get("notes"):
        parts.append(f"<p>{html.escape(book['notes'])}</p>")

    total = 0
    for ed in doc["editions"]:
        errata = ed.get("errata", [])
        total += len(errata)
        stubs = sum(1 for e in errata if e.get("page") == "?")
        parts.append(f'<h2>{html.escape(ed["name"])}</h2>')
        cnt = f"{len(errata)} correction" + ("s" if len(errata) != 1 else "")
        if stubs:
            cnt += f" &middot; {stubs} awaiting a page number"
        parts.append(f'<p class="count">{cnt}</p>')
        if not errata:
            parts.append("<p class=\"sub\">None recorded yet.</p>")
            continue
        parts.append('<ol class="errata">')
        for e in errata:
            label, is_stub = render_page_token(e.get("page"))
            cls = "pg stub" if is_stub else "pg"
            loc = e.get("location")
            text = html.escape(e["text"])
            if loc:
                text = f"<em>{html.escape(loc)}:</em> " + text
            parts.append(f'<li><span class="{cls}">{label}</span>'
                         f'<span class="txt">{text}</span></li>')
        parts.append("</ol>")

    return slug, page(f"Errata — {book['title']}", "\n".join(parts))


def build_index(books: list[dict]) -> str:
    rows = []
    for doc in sorted(books, key=lambda d: d["book"]["title"].lower()):
        b = doc["book"]
        n = sum(len(ed.get("errata", [])) for ed in doc["editions"])
        rows.append(f'<li><a href="{b["slug"]}.html">{html.escape(b["title"])}</a>'
                    f' <span class="count">&mdash; {n} corrections</span></li>')
    body = ('<h1>Errata</h1>'
            '<p class="sub">Corrections to the books of Terence Tao, generated from a '
            'structured source of truth.</p>'
            f'<ul class="book-list">{"".join(rows)}</ul>')
    return page("Errata — Terence Tao", body)


def main() -> None:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    books = [yaml.safe_load(p.read_text(encoding="utf-8")) for p in sorted(DATA.glob("*.yaml"))]
    for doc in books:
        slug, htmltext = build_book(doc)
        (SITE / f"{slug}.html").write_text(htmltext, encoding="utf-8", newline="\n")
    (SITE / "index.html").write_text(build_index(books), encoding="utf-8", newline="\n")
    (SITE / ".nojekyll").write_text("", encoding="utf-8")  # serve files as-is on Pages
    print(f"Built {len(books)} book page(s) + index into {SITE}")


if __name__ == "__main__":
    main()
