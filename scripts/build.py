#!/usr/bin/env python3
"""Build the static errata site from data/errata/*.yaml into site/.

Zero template-engine dependency (stdlib + PyYAML). Inline math written as
``$...$`` in the YAML is rendered client-side by MathJax (CDN). Output is plain
static HTML suitable for GitHub Pages. Run: python scripts/build.py
"""
from __future__ import annotations

import html
import re
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
LINKS = ROOT / "data" / "links"
SITE = ROOT / "site"

_MDLINK = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')


def md_links(s: str) -> str:
    """Render a string with markdown [label](url) links to safe HTML."""
    out, last = [], 0
    for m in _MDLINK.finditer(s):
        out.append(html.escape(s[last:m.start()]))
        out.append(f'<a href="{html.escape(m.group(2))}">{html.escape(m.group(1))}</a>')
        last = m.end()
    out.append(html.escape(s[last:]))
    return "".join(out)

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
h3 { font-size: 1.05rem; margin: 1.5rem 0 .2rem; }
.sub { color: var(--muted); margin: 0 0 1.5rem; }
.count { color: var(--muted); font-size: .9rem; margin: .1rem 0 1rem; }
ol.errata { list-style: none; margin: 0; padding: 0; }
ol.errata > li { display: grid; grid-template-columns: 5.5rem 1fr; gap: .6rem;
  padding: .55rem .2rem; border-bottom: 1px solid var(--line); }
.pg { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg.stub { color: var(--stub-fg); background: var(--stub-bg); border-radius: 4px;
  padding: 0 .4rem; font-size: .82rem; align-self: start; }
.txt { overflow-wrap: anywhere; }
.book-list { list-style: none; padding: 0; margin: .6rem 0 0; }
.book-list li { padding: .6rem .8rem; border: 1px solid var(--line); border-radius: 8px;
  margin-bottom: .5rem; background: var(--card); }
.book-list .year { color: var(--muted); font-variant-numeric: tabular-nums;
  display: inline-block; min-width: 6.2rem; }
.book-list .coauth { color: var(--muted); font-size: .92rem; }
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
details.section { border-bottom: 1px solid var(--line); }
details.section > summary { cursor: pointer; font-weight: 600; color: var(--accent);
  padding: .7rem .2rem; list-style-position: inside; }
details.section > summary:hover { color: var(--fg); }
details.section > summary .count { color: var(--muted); font-weight: 400; font-size: .85rem; }
ul.linklist { list-style: none; padding: .2rem 0 .9rem; margin: 0; }
ul.linklist > li { padding: .35rem 0 .35rem 1.1rem; text-indent: -1.1rem; }
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
Corrections welcome as issues or pull requests.</footer>
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
    out = []
    if ed.get("name"):
        out.append(f'<h3>{html.escape(ed["name"])}</h3>')
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
             f'<h1>{html.escape(book["title"])}</h1>']
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

    # Errata section (only when the book actually has corrections). Active editions
    # render inline; older (active: false) ones collapse together.
    editions = doc.get("editions", [])
    active = [ed for ed in editions if ed.get("active", True)]
    older = [ed for ed in editions if not ed.get("active", True)]
    total = sum(len(ed.get("errata", [])) for ed in editions)
    if total:
        parts.append('<h2>Errata</h2>')
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
    else:
        parts.append('<p class="sub">No errata have been recorded for this book.</p>')

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

    return slug, page(book["title"], "\n".join(parts))


def build_links_page(doc: dict) -> tuple[str, str]:
    """Render a curated link-collection page: intro + collapsible sections."""
    slug = doc["slug"]
    parts = ['<p><a href="index.html">&larr; Home</a></p>',
             f'<h1>{html.escape(doc["title"])}</h1>']
    if doc.get("source"):
        parts.append(f'<p class="sub"><a href="{html.escape(doc["source"])}">original page</a></p>')
    if doc.get("description"):
        parts.append(f'<p class="desc">{md_links(doc["description"])}</p>')
    for sec in doc["sections"]:
        entries = sec.get("entries", [])
        cnt = f' <span class="count">({len(entries)})</span>' if entries else ""
        parts.append('<details class="section">')
        parts.append(f'<summary>{html.escape(sec["title"])}{cnt}</summary>')
        if sec.get("description"):
            parts.append(f'<p class="sub">{md_links(sec["description"])}</p>')
        if entries:
            lis = "".join(f'<li>{md_links(e)}</li>' for e in entries)
            parts.append(f'<ul class="linklist">{lis}</ul>')
        parts.append('</details>')
    return slug, page(doc["title"], "\n".join(parts))


def build_index(books: list[dict], links: list[dict] = ()) -> str:
    def pub_year(doc):
        return (doc["book"].get("publication") or {}).get("first_published")

    rows = []
    # Chronological by publication year; undated ("in preparation") last, then by title.
    for doc in sorted(books, key=lambda d: (pub_year(d) is None, pub_year(d) or 0,
                                            d["book"]["title"].lower())):
        b = doc["book"]
        y = pub_year(doc)
        yr = f'<span class="year">{y}</span>' if y else '<span class="year">in preparation</span>'
        n = sum(len(ed.get("errata", [])) for ed in doc.get("editions", []) if ed.get("active", True))
        tag = (f"{n} correction" + ("s" if n != 1 else "")) if n else "book details"
        coauth = [a for a in b.get("authors", []) if a != "Terence Tao"]
        auth = (f'<span class="coauth"> &middot; with {html.escape(", ".join(coauth))}</span>'
                if coauth else "")
        rows.append(f'<li>{yr} <a href="{b["slug"]}.html">{html.escape(b["title"])}</a>{auth}'
                    f'<span class="count"> &mdash; {tag}</span></li>')
    body = ('<h1>Terence Tao</h1>'
            '<p class="sub">Book pages (bibliographic details and errata) and other collected pages, '
            'generated from a database maintained by the author.</p>'
            '<details class="section">'
            f'<summary>Books <span class="count">({len(books)})</span></summary>'
            f'<ul class="book-list">{"".join(rows)}</ul></details>')
    if links:
        lrows = "".join(
            f'<li><a href="{l["slug"]}.html">{html.escape(l["title"])}</a></li>'
            for l in sorted(links, key=lambda d: d["title"].lower()))
        body += ('<details class="section">'
                 f'<summary>Other pages <span class="count">({len(links)})</span></summary>'
                 f'<ul class="book-list">{lrows}</ul></details>')
    return page("Terence Tao — books and errata", body)


def main() -> None:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    books = [yaml.safe_load(p.read_text(encoding="utf-8")) for p in sorted(DATA.glob("*.yaml"))]
    for doc in books:
        slug, htmltext = build_book(doc)
        (SITE / f"{slug}.html").write_text(htmltext, encoding="utf-8", newline="\n")
    linkdocs = ([yaml.safe_load(p.read_text(encoding="utf-8")) for p in sorted(LINKS.glob("*.yaml"))]
                if LINKS.exists() else [])
    for doc in linkdocs:
        slug, htmltext = build_links_page(doc)
        (SITE / f"{slug}.html").write_text(htmltext, encoding="utf-8", newline="\n")
    (SITE / "index.html").write_text(build_index(books, linkdocs), encoding="utf-8", newline="\n")
    (SITE / ".nojekyll").write_text("", encoding="utf-8")  # serve files as-is on Pages
    print(f"Built {len(books)} book page(s) + {len(linkdocs)} link page(s) + index into {SITE}")


if __name__ == "__main__":
    main()
