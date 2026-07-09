#!/usr/bin/env python3
"""Build the static errata site from data/errata/*.yaml into site/.

Zero template-engine dependency (stdlib + PyYAML). Inline math written as
``$...$`` in the YAML is rendered client-side by MathJax (CDN). Output is plain
static HTML suitable for GitHub Pages. Run: python scripts/build.py
"""
from __future__ import annotations

import html
import shutil
from datetime import date
from pathlib import Path

import yaml

_MONTHS = ["", "January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"]


def fmt_date(iso: str) -> str:
    """Render an ISO 'YYYY-MM-DD' string as e.g. 'July 9, 2026' (portable)."""
    try:
        d = date.fromisoformat(iso)
    except (TypeError, ValueError):
        return html.escape(str(iso))
    return f"{_MONTHS[d.month]} {d.day}, {d.year}"


def last_updated(doc: dict):
    """Latest of book.migrated and every erratum date (ISO strings sort chronologically)."""
    dates = [doc["book"].get("migrated")]
    for ed in doc["editions"]:
        for e in ed.get("errata", []):
            if e.get("date"):
                dates.append(e["date"])
    dates = [d for d in dates if d]
    return max(dates) if dates else None


def contributor_names(doc: dict) -> list[str]:
    """Union of legacy contributors and every erratum's reported_by, unique, name-sorted."""
    names = list(doc["book"].get("contributors", {}).get("legacy", []))
    for ed in doc["editions"]:
        for e in ed.get("errata", []):
            names.extend(e.get("reported_by") or [])
    seen = {n.strip(): None for n in names if n and n.strip()}
    return sorted(seen, key=str.lower)

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
.bib { background: var(--card); border: 1px solid var(--line); border-radius: 8px;
  padding: .8rem 1rem; margin: 0 0 1.2rem; font-size: .92rem; }
.bib dl { display: grid; grid-template-columns: max-content 1fr; gap: .2rem .8rem; margin: 0; }
.bib dt { color: var(--muted); }
.bib dd { margin: 0; }
.desc { margin: 0 0 1.2rem; }
ul.links { list-style: none; padding: 0; margin: 0 0 1.2rem;
  display: flex; flex-wrap: wrap; gap: .4rem .9rem; }
ul.links li::before { content: "\\2192"; color: var(--muted); margin-right: .35rem; }
.credit { color: var(--muted); font-size: .82rem; display: block; margin-top: .15rem; }
.contributors ul { columns: 2; column-gap: 2rem; padding-left: 1.2rem; margin: .4rem 0 0; }
@media (max-width: 520px) { .contributors ul { columns: 1; } }
.updated { color: var(--muted); font-size: .85rem; margin: 2rem 0 0; }
details.older { margin-top: 2rem; }
details.older > summary { cursor: pointer; font-weight: 600; color: var(--accent);
  padding: .6rem .2rem; border-top: 2px solid var(--line); list-style-position: inside; }
details.older > summary:hover { color: var(--fg); }
details.older[open] > summary { border-bottom: 1px solid var(--line); margin-bottom: .5rem; }
footer { margin-top: 1.5rem; color: var(--muted); font-size: .82rem; }
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
<footer>Generated from data maintained by Terence Tao at
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


def render_edition(ed: dict) -> list[str]:
    """HTML parts for one edition: heading, count, and the errata list."""
    errata = ed.get("errata", [])
    stubs = sum(1 for e in errata if e.get("page") == "?")
    out = [f'<h2>{html.escape(ed["name"])}</h2>']
    cnt = f"{len(errata)} correction" + ("s" if len(errata) != 1 else "")
    if stubs:
        cnt += f" &middot; {stubs} awaiting a page number"
    out.append(f'<p class="count">{cnt}</p>')
    if not errata:
        out.append('<p class="sub">None recorded yet.</p>')
        return out
    out.append('<ol class="errata">')
    for e in errata:
        label, is_stub = render_page_token(e.get("page"))
        cls = "pg stub" if is_stub else "pg"
        loc = e.get("location")
        text = html.escape(e["text"])
        if loc:
            text = f"<em>{html.escape(loc)}:</em> " + text
        by = e.get("reported_by") or []
        dt = e.get("date")
        if by or dt:
            bits = []
            if by:
                bits.append("contributed by " + html.escape(", ".join(by)))
            if dt:
                bits.append(fmt_date(dt))
            text += f'<span class="credit">{" &middot; ".join(bits)}</span>'
        out.append(f'<li><span class="{cls}">{label}</span>'
                   f'<span class="txt">{text}</span></li>')
    out.append("</ol>")
    return out


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

    # Bibliographic data
    pub = book.get("publication") or {}
    rows = []
    if pub.get("publisher"):
        rows.append(("Publisher", html.escape(pub["publisher"])))
    if pub.get("first_published"):
        rows.append(("First published", html.escape(str(pub["first_published"]))))
    if pub.get("series"):
        rows.append(("Series", html.escape(pub["series"])))
    if pub.get("isbn"):
        rows.append(("ISBN", html.escape(pub["isbn"])))
    if pub.get("note"):
        rows.append(("", html.escape(pub["note"])))
    if rows:
        dl = "".join(f"<dt>{k}</dt><dd>{v}</dd>" if k else f'<dd style="grid-column:1/-1">{v}</dd>'
                     for k, v in rows)
        parts.append(f'<div class="bib"><dl>{dl}</dl></div>')

    if book.get("description"):
        parts.append(f'<p class="desc">{html.escape(book["description"])}</p>')

    links = book.get("links") or []
    if links:
        items = "".join(f'<li><a href="{html.escape(l["url"])}">{html.escape(l["title"])}</a></li>'
                        for l in links)
        parts.append(f'<ul class="links">{items}</ul>')

    # Editions: active ones inline; older (active: false) ones collapsed together.
    editions = doc["editions"]
    active = [ed for ed in editions if ed.get("active", True)]
    older = [ed for ed in editions if not ed.get("active", True)]
    for ed in active:
        parts.extend(render_edition(ed))
    if older:
        older_n = sum(len(ed.get("errata", [])) for ed in older)
        summary = (f"Show errata for {len(older)} older edition"
                   + ("s" if len(older) != 1 else "")
                   + f" ({older_n} correction" + ("s" if older_n != 1 else "") + ")")
        parts.append('<details class="older">')
        parts.append(f'<summary>{summary}</summary>')
        for ed in older:
            parts.extend(render_edition(ed))
        parts.append('</details>')

    # Contributors
    names = contributor_names(doc)
    contrib = book.get("contributors") or {}
    if names or contrib.get("note"):
        parts.append('<h2>Contributors</h2>')
        parts.append('<div class="contributors">')
        if contrib.get("note"):
            parts.append(f'<p class="sub">{html.escape(contrib["note"])}</p>')
        if names:
            lis = "".join(f"<li>{html.escape(n)}</li>" for n in names)
            parts.append(f"<ul>{lis}</ul>")
        parts.append('</div>')

    updated = last_updated(doc)
    if updated:
        parts.append(f'<p class="updated">Last updated: {fmt_date(updated)}.</p>')

    return slug, page(f"Errata — {book['title']}", "\n".join(parts))


def build_index(books: list[dict]) -> str:
    rows = []
    for doc in sorted(books, key=lambda d: d["book"]["title"].lower()):
        b = doc["book"]
        n = sum(len(ed.get("errata", [])) for ed in doc["editions"] if ed.get("active", True))
        rows.append(f'<li><a href="{b["slug"]}.html">{html.escape(b["title"])}</a>'
                    f' <span class="count">&mdash; {n} corrections</span></li>')
    body = ('<h1>Errata</h1>'
            '<p class="sub">Corrections to the books of Terence Tao, automatically generated from a '
            'database maintained by the author.</p>'
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
