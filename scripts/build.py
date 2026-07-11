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
TEACHING = ROOT / "data" / "teaching"
PAPERS = ROOT / "data" / "papers"
CV = ROOT / "data" / "cv"
CONTACT = ROOT / "data" / "contact"
TRAVEL = ROOT / "data" / "travel"
PROJECTS = ROOT / "data" / "projects"
APPLETS = ROOT / "data" / "applets"
STATIC = ROOT / "static"
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
  --line:#e3e3e3; --accent:#7a1f1f; --stub-bg:#fff4e5; --stub-fg:#8a5a00; --card:#fafafa;
  --ok-bg:#e6f4ec; --ok-fg:#1f7a4d; --new-bg:#e7edfb; --new-fg:#2a4b9b; }
@media (prefers-color-scheme: dark) { :root { --fg:#e6e6e6; --bg:#151515; --muted:#9a9a9a;
  --line:#333; --accent:#e08a8a; --stub-bg:#3a2e12; --stub-fg:#e8c06a; --card:#1d1d1d;
  --ok-bg:#17321f; --ok-fg:#7fce9f; --new-bg:#1a2438; --new-fg:#9db4f0; } }
* { box-sizing: border-box; }
body { font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--fg); background: var(--bg); margin: 0; }
.wrap { max-width: 820px; margin: 0 auto; padding: 2.2rem 1.2rem 4rem; }
a { color: var(--accent); }
h1 { font-size: 1.9rem; margin: 0 0 .3rem; }
h2 { font-size: 1.25rem; margin: 2.2rem 0 .2rem; padding-bottom: .3rem; border-bottom: 2px solid var(--line); }
h3 { font-size: 1.05rem; margin: 1.5rem 0 .2rem; }
.sub { color: var(--muted); margin: 0 0 1.5rem; }
.positions { list-style: none; padding: .7rem 0 .7rem 1rem; margin: 0 0 1.6rem; border-left: 3px solid var(--accent); }
.positions li { margin: .25rem 0; line-height: 1.4; }
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
h2.linkgroup { margin: 2.4rem 0 .2rem; }
.search { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0 .6rem; }
.search input, .search select { font: inherit; padding: .45rem .6rem; border: 1px solid var(--line);
  border-radius: 6px; background: var(--bg); color: var(--fg); }
.search input { flex: 1 1 16rem; }
#chips { display: flex; flex-wrap: wrap; gap: .3rem; margin: .2rem 0 .6rem; }
.chip { font: inherit; font-size: .82rem; cursor: pointer; border: 1px solid var(--line);
  background: var(--card); color: var(--muted); border-radius: 999px; padding: .12rem .6rem; }
.chip.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.chip span { opacity: .6; }
#count { color: var(--muted); font-size: .85rem; margin: .2rem 0 .6rem; }
ol.works { list-style: none; margin: 0; padding: 0; }
ol.works > li { display: grid; grid-template-columns: 3.2rem 1fr; gap: .5rem;
  padding: .55rem .2rem; border-bottom: 1px solid var(--line); }
.wy { color: var(--muted); font-variant-numeric: tabular-nums; font-size: .9rem; }
.wt { font-weight: 600; }
.wa { color: var(--muted); }
.wv { color: var(--muted); font-size: .9rem; }
.kb { font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; color: var(--stub-fg);
  background: var(--stub-bg); border-radius: 4px; padding: .05rem .35rem; margin-left: .4rem; vertical-align: .1em; }
.wtags { display: block; margin-top: .1rem; }
.tg { font: inherit; font-size: .78rem; cursor: pointer; border: none; background: none;
  color: var(--accent); padding: 0 .35rem 0 0; }
.tg:hover { text-decoration: underline; }
.wl { display: block; margin-top: .1rem; font-size: .85rem; }
.wl .lk { margin-right: .7rem; }
.cv-head h1 { margin-bottom: .1rem; }
.postnom { font-size: .6em; font-weight: 400; color: var(--muted); letter-spacing: .04em; vertical-align: .12em; }
.cv-head .role { margin: 0; }
.cv-contact { color: var(--muted); font-size: .9rem; margin: .35rem 0 0; }
.cv-nav { margin: .8rem 0 1.6rem; font-size: .9rem; display: flex; gap: 1rem; flex-wrap: wrap; }
.cv-nav a.here { font-weight: 600; color: var(--fg); }
.cv section { margin: 0 0 1.4rem; }
.cv h2 { font-size: 1.15rem; }
.cv-list { margin: .4rem 0 0; }
.cv-list .row { display: grid; grid-template-columns: 7.5rem 1fr; gap: .2rem .9rem; padding: .18rem 0; }
.cv-list .dt { color: var(--muted); font-variant-numeric: tabular-nums; font-size: .9rem; }
.cv-list .dd { margin: 0; overflow-wrap: anywhere; }
.cv-list .dd .meta { color: var(--muted); }
.cv-bio p { max-width: 42rem; }
.cv-more { color: var(--muted); font-size: .9rem; }
.policies { margin: .4rem 0 0; padding-left: 1.4rem; }
.policies li { margin: .55rem 0; max-width: 44rem; }
.policies li .t { font-weight: 600; }
.contact-note { color: var(--muted); font-size: .9rem; margin: .5rem 0 0; max-width: 42rem; }
.travel .cx { text-decoration: line-through; color: var(--muted); }
.travel .tentative { color: var(--muted); }
.applets .app { display: grid; grid-template-columns: 1fr auto; gap: .1rem .8rem;
  padding: .55rem 0; border-top: 1px solid var(--line); }
.applets .app:first-of-type { border-top: 0; }
.applets .nm { grid-column: 1; grid-row: 1; font-weight: 600; }
.applets .ds { grid-column: 1; grid-row: 2; color: var(--muted); font-size: .95rem; }
.applets .src { grid-column: 1; grid-row: 3; color: var(--muted); font-size: .85rem; margin-top: .12rem; }
.applets .src .ai { font-style: italic; opacity: .85; }
.applets .pill { grid-column: 2; grid-row: 1; }
.applets .legend { color: var(--muted); font-size: .85rem; margin: .3rem 0 0; }
.pill { font-size: .66rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 700;
  padding: .12rem .5rem; border-radius: 999px; white-space: nowrap; height: fit-content; }
.pill.ported, .pill.live { color: var(--ok-fg); background: var(--ok-bg); }
.pill.original { color: var(--new-fg); background: var(--new-bg); }
.pill.to-port { color: var(--stub-fg); background: var(--stub-bg); }
.pill.retired { color: var(--muted); background: var(--card); border: 1px solid var(--line); }
@media print {
  .cv-nav, footer, .wrap > p:first-child { display: none; }
  .wrap { max-width: none; padding: 0; }
  body { font-size: 10.5pt; color: #000; background: #fff; }
  a { color: inherit; text-decoration: none; }
  h1 { font-size: 20pt; } .cv h2 { font-size: 13pt; border-color: #999; break-after: avoid; }
  .cv-list .row, .cv-pub { break-inside: avoid; }
  .cv-list .dt { color: #444; }
}
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
<footer>Generated from data maintained (with AI assistance) by Terence Tao at
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
        if sec.get("heading"):
            parts.append(f'<h2 class="linkgroup">{html.escape(sec["heading"])}</h2>')
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


_LINK_LABEL = {"arxiv": "arXiv", "journal": "journal", "discussion": "discussion",
               "slides": "slides", "pdf": "pdf", "note": "link", "blog": "blog", "applet": "interactive tool"}
_LINK_PRIO = {"journal": 0, "arxiv": 1, "pdf": 2, "note": 3, "discussion": 4, "slides": 5, "blog": 6, "applet": 7}

_PAPERS_JS = """
<script>
(function(){
  var list=document.getElementById('list');
  var works=[].slice.call(list.getElementsByClassName('work'));
  var q=document.getElementById('q'),kind=document.getElementById('kind'),sort=document.getElementById('sort');
  var count=document.getElementById('count'),active={};
  function chips(){[].forEach.call(document.querySelectorAll('.chip'),function(c){
    c.classList.toggle('on',!!active[c.getAttribute('data-t')]);});}
  function apply(){
    var terms=q.value.toLowerCase().split(/\\s+/).filter(Boolean),k=kind.value,tags=Object.keys(active),shown=0;
    works.forEach(function(el){
      var s=el.getAttribute('data-s'),ok=terms.every(function(t){return s.indexOf(t)>=0;});
      if(ok&&k&&el.getAttribute('data-kind')!==k)ok=false;
      if(ok&&tags.length){var et=' '+el.getAttribute('data-tags')+' ';
        ok=tags.every(function(t){return et.indexOf(' '+t+' ')>=0;});}
      el.style.display=ok?'':'none';if(ok)shown++;});
    count.textContent=shown+' of '+works.length+' works';chips();
    var p=new URLSearchParams();
    if(q.value)p.set('q',q.value);if(k)p.set('kind',k);
    if(tags.length)p.set('tag',tags.join(','));if(sort.value!=='year-desc')p.set('sort',sort.value);
    history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():''));
  }
  function doSort(){
    var v=sort.value,arr=works.slice();
    arr.sort(function(a,b){
      if(v==='title')return a.querySelector('.wt').textContent.localeCompare(b.querySelector('.wt').textContent);
      var ya=+a.getAttribute('data-year'),yb=+b.getAttribute('data-year');
      return v==='year-asc'?ya-yb:yb-ya;});
    arr.forEach(function(el){list.appendChild(el);});
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('.tg,.chip'):null;if(!b)return;
    if(b.tagName==='A')return;e.preventDefault();var t=b.getAttribute('data-t');
    if(active[t])delete active[t];else active[t]=1;apply();});
  q.addEventListener('input',apply);kind.addEventListener('change',apply);
  sort.addEventListener('change',function(){doSort();apply();});
  var pp=new URLSearchParams(location.search);
  if(pp.get('q'))q.value=pp.get('q');if(pp.get('kind'))kind.value=pp.get('kind');
  if(pp.get('sort'))sort.value=pp.get('sort');
  if(pp.get('author'))q.value=(q.value+' '+pp.get('author')).trim();
  if(pp.get('tag'))pp.get('tag').split(',').forEach(function(t){if(t)active[t]=1;});
  doSort();apply();
})();
</script>
"""


def render_work(w: dict) -> str:
    yr = w.get("year")
    links = w.get("links") or []
    ordered = sorted(links, key=lambda l: _LINK_PRIO.get(l["type"], 9))
    title = html.escape(w["title"])
    if ordered:
        title = f'<a href="{html.escape(ordered[0]["url"])}">{title}</a>'
    parts = [f'<span class="wt">{title}</span>']
    if w["kind"] != "paper":
        parts.append(f'<span class="kb">{html.escape(w["kind"].replace("-", " "))}</span>')
    co = w.get("coauthors") or []
    if co:
        parts.append(f' <span class="wa">with {html.escape(", ".join(co))}</span>')
    if w.get("venue"):
        parts.append(f' <span class="wv">{html.escape(w["venue"])}</span>')
    tags = w.get("tags", [])
    chips = "".join(f'<button class="tg" data-t="{html.escape(t)}">#{html.escape(t)}</button>' for t in tags)
    parts.append(f'<span class="wtags">{chips}</span>')
    if links:
        lk = "".join(f'<a class="lk" href="{html.escape(l["url"])}">{_LINK_LABEL.get(l["type"], l["type"])}</a>'
                     for l in ordered)
        parts.append(f'<span class="wl">{lk}</span>')
    hay = " ".join([w["title"], *co, w.get("venue", ""), w.get("journal", ""),
                    w.get("arxiv", ""), *tags]).lower()
    hay = html.escape(re.sub(r"\s+", " ", hay))
    ylabel = str(yr) if yr else "&mdash;"
    return (f'<li class="work" data-kind="{w["kind"]}" data-year="{yr or 0}" '
            f'data-tags="{html.escape(" ".join(tags))}" data-s="{hay}">'
            f'<span class="wy">{ylabel}</span><span class="wmain">{"".join(parts)}</span></li>')


def build_papers_page(doc: dict) -> tuple[str, str]:
    from collections import Counter
    works = doc.get("works", [])
    works = sorted(works, key=lambda w: (w.get("year") or 0), reverse=True)
    tagc = Counter(t for w in works for t in w.get("tags", []))
    kinds = sorted({w["kind"] for w in works})
    kopts = '<option value="">all kinds</option>' + "".join(
        f'<option value="{k}">{html.escape(k.replace("-", " "))}</option>' for k in kinds)
    chips = "".join(f'<button class="chip" data-t="{html.escape(t)}">{html.escape(t)} '
                    f'<span>{n}</span></button>' for t, n in tagc.most_common(28))
    parts = [
        '<p><a href="index.html">&larr; Home</a></p>',
        '<h1>Papers and preprints</h1>',
        f'<p class="sub">A searchable database of {len(works)} works &mdash; papers, expository '
        '&ldquo;short stories&rdquo;, and related writing. Search by title, coauthor, journal, arXiv, '
        'or tag; click a tag to filter.</p>',
        '<div class="search">',
        '<input id="q" type="search" placeholder="Search title, coauthor, journal, arXiv, tag…" '
        'autocomplete="off">',
        f'<select id="kind">{kopts}</select>',
        '<select id="sort"><option value="year-desc">newest first</option>'
        '<option value="year-asc">oldest first</option><option value="title">by title</option></select>',
        '</div>',
        f'<div id="chips">{chips}</div>',
        '<p id="count"></p>',
        '<ol id="list" class="works">',
        *[render_work(w) for w in works],
        '</ol>',
        _PAPERS_JS,
    ]
    return "papers", page("Papers and preprints — Terence Tao", "\n".join(parts))


def _cv_rows(items: list) -> str:
    rows = "".join(f'<div class="row"><span class="dt">{dt}</span>'
                   f'<span class="dd">{dd}</span></div>' for dt, dd in items)
    return f'<div class="cv-list">{rows}</div>'


def _cv_section(title: str, inner: str) -> str:
    return f'<section><h2>{html.escape(title)}</h2>{inner}</section>' if inner else ""


def _cv_pub(w: dict) -> str:
    ordered = sorted(w.get("links", []), key=lambda l: _LINK_PRIO.get(l["type"], 9))
    t = html.escape(w["title"])
    if ordered:
        t = f'<a href="{html.escape(ordered[0]["url"])}">{t}</a>'
    bits = [t]
    if w.get("coauthors"):
        bits.append("with " + html.escape(", ".join(w["coauthors"])))
    if w.get("venue"):
        bits.append(f'<span class="meta">{html.escape(w["venue"])}</span>')
    return ". ".join(bits)


# Conventional ordering of post-nominals: Commonwealth honours first, then society
# fellowships (Australian bodies before overseas). Any others fall back to the end.
_POSTNOM_ORDER = ["AC", "FAA", "FAustMS", "FRS"]


def _postnominals(cv: dict) -> str:
    letters = [a["postnominal"] for a in cv.get("awards", []) if a.get("postnominal")]
    letters = sorted(set(letters),
                     key=lambda x: (_POSTNOM_ORDER.index(x) if x in _POSTNOM_ORDER else len(_POSTNOM_ORDER), x))
    return " ".join(letters)


def _cv_header(cv: dict, here: str) -> str:
    p = cv.get("profile", {})
    name = html.escape(p.get("name", ""))
    post = _postnominals(cv) if here == "cv-long" else ""
    if post:
        name += f' <span class="postnom">{html.escape(post)}</span>'
    parts = ['<p><a href="index.html">&larr; Home</a></p>', '<div class="cv-head">',
             f'<h1>{name}</h1>']
    if p.get("title"):
        parts.append(f'<p class="role sub">{html.escape(p["title"])}, {html.escape(p.get("institution", ""))}</p>')
    contact = []
    if p.get("email"):
        contact.append(f'<a href="mailto:{html.escape(p["email"])}">{html.escape(p["email"])}</a>')
    if p.get("homepage"):
        contact.append(f'<a href="{html.escape(p["homepage"])}">{html.escape(p["homepage"])}</a>')
    if contact:
        parts.append(f'<p class="cv-contact">{" &middot; ".join(contact)}</p>')
    parts.append("</div>")
    nav = [("bio", "Biography"), ("cv-short", "Short CV"), ("cv-long", "Full CV")]
    links = "".join(f'<a href="{s}.html" class="{"here" if s == here else ""}">{html.escape(l)}</a>'
                    for s, l in nav)
    parts.append(f'<nav class="cv-nav">{links}</nav>')
    return "".join(parts)


def build_cv(cv: dict, works: list, books: list, courses: list) -> tuple[list, list]:
    """Return ([(slug, html)], [(filename, text)]) for the CV variant pages + plain-text bios."""
    prof = cv.get("profile", {})
    bio = prof.get("bio", {})
    by_arxiv = {w.get("arxiv"): w for w in works if w.get("arxiv")}
    papers = [w for w in works if w["kind"] == "paper"]

    def interests_block(long: bool) -> str:
        it = prof.get("interests", {})
        def fmt(lst):
            out = []
            for i in lst:
                n = html.escape(i["name"])
                out.append(f'<a href="papers.html?tag={html.escape(i["tag"])}">{n}</a>' if i.get("tag") else n)
            return out
        rows = []
        if it.get("primary"):
            rows.append(("Primary", "; ".join(fmt(it["primary"]))))
        if long and it.get("secondary"):
            rows.append(("Secondary", "; ".join(fmt(it["secondary"]))))
        return _cv_rows(rows)

    def education_block() -> str:
        rows = []
        for e in cv.get("education", []):
            dd = f'<strong>{html.escape(e["degree"])}</strong>, {html.escape(e["institution"])}'
            if e.get("advisor"):
                dd += f' <span class="meta">(advisor: {html.escape(e["advisor"])})</span>'
            if e.get("thesis"):
                th = e["thesis"]; tt = html.escape(th["title"])
                if th.get("url"):
                    tt = f'<a href="{html.escape(th["url"])}">{tt}</a>'
                dd += f'<br><span class="meta">Thesis: {tt}</span>'
            rows.append((html.escape(e["year"]), dd))
        return _cv_rows(rows)

    def appts_block() -> str:
        rows = []
        for a in cv.get("appointments", []):
            yr = a["start"] + ("&ndash;" + a["end"] if a.get("end") else "&ndash;")
            rows.append((yr, f'{html.escape(a["title"])}, {html.escape(a["institution"])}'))
        return _cv_rows(rows)

    def awards_block(long: bool) -> str:
        items = cv.get("awards", [])
        if not long:
            items = [a for a in items if a.get("highlight")]
        rows = []
        for a in items:
            name = html.escape(a["award"])
            if a.get("url"):
                name = f'<a href="{html.escape(a["url"])}">{name}</a>'
            rows.append((html.escape(a["year"]),
                         f'{name} <span class="meta">&mdash; {html.escape(a["organization"])}</span>'))
        return _cv_rows(rows)

    def books_block() -> str:
        rows = []
        for doc in sorted(books, key=lambda d: (d["book"].get("publication") or {}).get("first_published") or 0,
                          reverse=True):
            b = doc["book"]; y = (b.get("publication") or {}).get("first_published")
            t = f'<a href="{b["slug"]}.html">{html.escape(b["title"])}</a>'
            co = [a for a in b.get("authors", []) if a != "Terence Tao"]
            if co:
                t += " (with " + html.escape(", ".join(co)) + ")"
            pub = (b.get("publication") or {}).get("publisher")
            if pub:
                t += f' <span class="meta">&mdash; {html.escape(pub)}</span>'
            rows.append((str(y) if y else "", t))
        return _cv_rows(rows)

    def pubs_block(long: bool) -> str:
        if long:
            rows = [(str(w.get("year") or ""), _cv_pub(w))
                    for w in sorted(papers, key=lambda w: (w.get("year") or 0), reverse=True)]
            head = f'<p class="cv-more">{len(papers)} papers; the full, searchable list is on the ' \
                   '<a href="papers.html">papers page</a>.</p>'
            return head + _cv_rows(rows)
        sel = [by_arxiv[a] for a in (cv.get("selected", {}).get("publications") or []) if a in by_arxiv]
        rows = [(str(w.get("year") or ""), _cv_pub(w)) for w in sel]
        return _cv_rows(rows) + '<p class="cv-more">Selected from ' \
               f'<a href="papers.html">{len(papers)} papers</a>.</p>'

    def teaching_block() -> str:
        rows = []
        for c in sorted(courses, key=lambda c: (c["year"], _QUARTER_ORDER.get(c["quarter"], 0)), reverse=True):
            term = (c.get("term") or _QUARTER_NAME.get(c["quarter"], c["quarter"])) + f' {c["year"]}'
            inst = c.get("institution")
            dd = f'{html.escape(c["number"])}: {html.escape(c["title"])}'
            if inst and inst != "UCLA":
                dd += f' <span class="meta">({html.escape(inst)})</span>'
            rows.append((term, dd))
        return _cv_rows(rows)

    def students_block(long: bool) -> str:
        studs = cv.get("students", [])
        if not long:
            return f'<p>{len(studs)} doctoral and undergraduate students supervised (full list on the ' \
                   '<a href="cv-long.html">full CV</a>).</p>'
        rows = []
        for s in studs:
            nm = html.escape(s["name"])
            if s.get("url"):
                nm = f'<a href="{html.escape(s["url"])}">{nm}</a>'
            meta = html.escape(s["level"])
            if s.get("coadvisor"):
                meta += f', co-advised with {html.escape(s["coadvisor"])}'
            if s.get("institution"):
                meta += f', {html.escape(s["institution"])}'
            dd = f'{nm} <span class="meta">({meta})</span>'
            if s.get("thesis"):
                th = s["thesis"]; tt = html.escape(th["title"])
                if th.get("url"):
                    tt = f'<a href="{html.escape(th["url"])}">{tt}</a>'
                dd += f'<br><span class="meta">{tt}</span>'
            rows.append((html.escape(s["years"]), dd))
        return _cv_rows(rows)

    def service_block(long: bool) -> str:
        items = cv.get("service", [])
        if not long:
            items = [s for s in items if s.get("highlight")]
        rows = []
        for s in sorted(items, key=lambda s: s["start"], reverse=True):
            yr = s["start"] + ("&ndash;" + s["end"] if s.get("end") else "&ndash;")
            rows.append((yr, f'{html.escape(s["role"])} <span class="meta">&mdash; {html.escape(s["organization"])}</span>'))
        return _cv_rows(rows)

    def lectures_block() -> str:
        rows = []
        for l in cv.get("lectures", []):
            nm = html.escape(l["name"])
            if l.get("url"):
                nm = f'<a href="{html.escape(l["url"])}">{nm}</a>'
            dd = f'<strong>{nm}</strong>, {html.escape(l["venue"])}'
            if l.get("topic"):
                dd += f'<br><span class="meta">{html.escape(l["topic"])}</span>'
            rows.append((html.escape(l["date"]), dd))
        return _cv_rows(rows)

    def patents_block() -> str:
        rows = []
        for p in cv.get("patents", []):
            dd = html.escape(p["title"])
            if p.get("inventors"):
                dd += f' <span class="meta">({html.escape(", ".join(p["inventors"]))})</span>'
            meta = ", ".join(x for x in (p.get("number"), p.get("date")) if x)
            rows.append((html.escape(meta), dd))
        return _cv_rows(rows)

    def cv_page(short: bool) -> str:
        here = "cv-short" if short else "cv-long"
        body = [_cv_header(cv, here), '<div class="cv">']
        if bio.get("short"):
            body.append(_cv_section("Biography", f'<div class="cv-bio"><p>{html.escape(bio["short"])}</p></div>'))
        body.append(_cv_section("Research interests", interests_block(not short)))
        body.append(_cv_section("Education", education_block()))
        body.append(_cv_section("Appointments", appts_block()))
        body.append(_cv_section("Awards and honors" + ("" if not short else " (selected)"), awards_block(not short)))
        body.append(_cv_section("Books", books_block()))
        body.append(_cv_section("Publications" if not short else "Selected publications", pubs_block(not short)))
        if not short:
            body.append(_cv_section("Teaching", teaching_block()))
        body.append(_cv_section("Students", students_block(not short)))
        body.append(_cv_section("Professional service and editorial" + ("" if not short else " (selected)"),
                                service_block(not short)))
        if not short:
            body.append(_cv_section("Selected lectures", lectures_block()))
            body.append(_cv_section("Patents", patents_block()))
        body.append("</div>")
        title = f'{prof.get("name", "CV")} &mdash; {"Short CV" if short else "Curriculum Vitae"}'
        return page(title, "\n".join(body))

    def bio_page() -> str:
        body = [_cv_header(cv, "bio"), '<div class="cv cv-bio">']
        if bio.get("short"):
            body.append(_cv_section("Short biography",
                        f'<p>{html.escape(bio["short"])}</p>'
                        '<p class="cv-more">Plain text: <a href="bio-short.txt">bio-short.txt</a></p>'))
        if bio.get("long"):
            paras = "".join(f"<p>{html.escape(p)}</p>" for p in bio["long"].split("\n\n"))
            body.append(_cv_section("Extended biography",
                        paras + '<p class="cv-more">Plain text: <a href="bio-long.txt">bio-long.txt</a></p>'))
        body.append("</div>")
        return page(f'{prof.get("name", "")} &mdash; Biography', "\n".join(body))

    pages = [("bio", bio_page()), ("cv-short", cv_page(True)), ("cv-long", cv_page(False))]
    texts = []
    if bio.get("short"):
        texts.append(("bio-short.txt", bio["short"] + "\n"))
    if bio.get("long"):
        texts.append(("bio-long.txt", bio["long"] + "\n"))
    return pages, texts


_QUARTER_NAME = {"F": "Fall", "W": "Winter", "S": "Spring", "Su": "Summer"}
_QUARTER_ORDER = {"W": 1, "S": 2, "Su": 3, "F": 4}  # chronological within a year


def _trip_line(t: dict) -> str:
    place = html.escape(t["place"])
    if t.get("url"):
        place = f'<a href="{html.escape(t["url"])}">{place}</a>'
    if t.get("note"):
        place += f' <span class="meta">({html.escape(t["note"])})</span>'
    line = f'{html.escape(t["dates"])}: {place}'
    if t.get("cancelled"):
        return f'<span class="cx">{line}</span>'
    if t.get("tentative"):
        return f'<span class="tentative">{line}</span>'
    return line


def _travel_rows(trips: list, desc: bool) -> str:
    years: dict[int, list] = {}
    for t in trips:
        years.setdefault(t["year"], []).append(t)
    rows = [(str(y), "<br>".join(_trip_line(t) for t in years[y]))
            for y in sorted(years, reverse=desc)]
    return _cv_rows(rows)


def build_travel(travel: dict) -> str:
    body = ['<p><a href="index.html">&larr; Home</a></p>', '<div class="cv travel">',
            '<h1>Travel</h1>']
    up = travel.get("upcoming") or []
    if up:
        inner = ""
        if travel.get("note"):
            inner += f'<p class="cv-more">{html.escape(travel["note"])}</p>'
        inner += _travel_rows(up, desc=False)
        body.append(_cv_section("Upcoming", inner))
    past = travel.get("past") or []
    if past:
        body.append(_cv_section(f"Past trips ({len(past)})", _travel_rows(past, desc=True)))
    body.append("</div>")
    return page("Terence Tao — travel", "\n".join(body))


def build_contact(contact: dict, travel: dict | None = None) -> str:
    c = contact.get("contact", {})
    body = ['<p><a href="index.html">&larr; Home</a></p>', '<div class="cv contact">',
            '<h1>Contact and policies</h1>']
    if contact.get("preamble"):
        body.append(f'<div class="cv-bio"><p>{contact["preamble"]}</p></div>')

    def link(url, label=None):
        return f'<a href="{html.escape(url)}">{html.escape(label or url)}</a>'
    rows = []
    if c.get("office"):
        rows.append(("Office", html.escape(c["office"])))
    if c.get("mailing"):
        rows.append(("Mail", html.escape(c["mailing"])))
    if c.get("email"):
        rows.append(("Email", f'<a href="mailto:{html.escape(c["email"])}">{html.escape(c["email"])}</a>'))
    for lbl, key, short in [("Blog", "blog", None), ("Zoom", "zoom", None),
                            ("Mastodon", "mastodon", "@tao"), ("Bluesky", "bluesky", "@teorth")]:
        if c.get(key):
            rows.append((lbl, link(c[key], short or c[key].replace("https://", ""))))
    if c.get("pronouns"):
        rows.append(("Pronouns", html.escape(c["pronouns"])))
    body.append(_cv_rows(rows))
    if c.get("note"):
        body.append(f'<p class="contact-note">{html.escape(c["note"])}</p>')
    if contact.get("intro"):
        body.append(f'<section><p>{contact["intro"]}</p>')
        items = "".join(f'<li><span class="t">{html.escape(p["title"])}.</span> {p["body"]}</li>'
                        for p in contact.get("policies", []))
        body.append(f'<ol class="policies">{items}</ol></section>')
    if travel and (travel.get("upcoming")):
        inner = _travel_rows(travel["upcoming"], desc=False)
        inner += '<p class="cv-more"><a href="travel.html">Full travel history &rarr;</a></p>'
        body.append(_cv_section("Upcoming travel", inner))
    body.append("</div>")
    return page("Terence Tao — contact and policies", "\n".join(body))


def build_projects(projects: dict) -> str:
    def row(p):
        primary = p.get("url") or p["repo"]
        name = f'<a href="{html.escape(primary)}"><strong>{html.escape(p["name"])}</strong></a>'
        dd = f'{name} &mdash; {html.escape(p["description"])}'
        if p.get("url"):  # url is the project site; also surface the code repo
            dd += f' <span class="meta">[<a href="{html.escape(p["repo"])}">code</a>]</span>'
        return (str(p["launched"]), dd)

    items = projects.get("projects", [])
    body = ['<p><a href="index.html">&larr; Home</a></p>', '<div class="cv">',
            '<h1>Collaborative projects</h1>']
    if projects.get("description"):
        body.append(f'<div class="cv-bio"><p>{html.escape(projects["description"])}</p></div>')
    for status, heading in [("active", "Active"), ("inactive", "Completed or inactive")]:
        group = [p for p in items if p.get("status") == status]
        if not group:
            continue
        group.sort(key=lambda p: (-p["launched"], p["name"].lower()))
        body.append(_cv_section(heading, _cv_rows([row(p) for p in group])))
    body.append("</div>")
    return page("Terence Tao — collaborative projects", "\n".join(body))


_APPLET_STATUS = {"ported": "Ported", "live": "Live", "to-port": "To port", "retired": "Retired", "original": "Original"}


def build_applets(doc: dict) -> str:
    def row(a):
        nm = html.escape(a["name"])
        if a.get("url"):
            nm = f'<a href="{html.escape(a["url"])}">{nm}</a>'
        pill = f'<span class="pill {a["status"]}">{_APPLET_STATUS[a["status"]]}</span>'
        note = f' {html.escape(a["note"])}' if a.get("note") else ""
        java = "Java, " + str(a["year"]) if a.get("year") else "Java"
        # All sub-lines share one .src cell (it is pinned to grid-row 3, so
        # separate .src divs would overlap); stack them with <br>.
        lines = []
        if a.get("source"):
            lbl = "original applet" if a["status"] in ("to-port", "retired") else "original"
            lines.append(f'<a href="{html.escape(a["source"])}">{lbl}</a> ({java})')
        elif a.get("date"):
            lines.append(f'First published {html.escape(a["date"])} on this site.')
        elif a.get("year"):
            lines.append(java)
        # AI-use disclosure for the apps built in this repo.
        if a["status"] == "original":
            lines.append('<span class="ai">Coded with the assistance of Claude Code.</span>')
        elif a["status"] == "ported":
            lines.append('<span class="ai">Ported with the assistance of Claude Code.</span>')
        if a.get("writeup"):
            w = a["writeup"]
            wlbl = html.escape(w.get("label") or "The making of this app")
            lines.append(f'<a href="{html.escape(w["url"])}">{wlbl} &rarr;</a>')
        src = f'<div class="src">{"<br>".join(lines)}</div>' if lines else ""
        return (f'<div class="app"><div class="nm">{nm}</div>{pill}'
                f'<div class="ds">{html.escape(a["description"])}{note}</div>{src}</div>')

    applets = doc.get("applets", [])
    cats = []
    for a in applets:
        if a["category"] not in cats:
            cats.append(a["category"])
    body = ['<p><a href="index.html">&larr; Home</a></p>', '<div class="cv applets">',
            '<h1>Interactive tools</h1>']
    if doc.get("description"):
        body.append(f'<div class="cv-bio"><p>{html.escape(doc["description"])}</p></div>')
    body.append('<p class="legend"><strong>Status:</strong> Original = first published here &middot; '
                'Ported = runs here now &middot; Live = works elsewhere &middot; '
                'To port = old Java, not yet rebuilt &middot; Retired = superseded.</p>')
    notes = doc.get("category_notes") or {}
    for cat in cats:
        note = (f'<p class="legend">{html.escape(notes[cat])}</p>' if cat in notes else "")
        rows = "".join(row(a) for a in applets if a["category"] == cat)
        body.append(_cv_section(cat, note + rows))
    body.append("</div>")
    return page("Terence Tao — interactive tools", "\n".join(body))


def build_index(books: list[dict], links: list[dict] = (), teaching: dict | None = None,
                papers: dict | None = None, cv: dict | None = None,
                contact: dict | None = None, travel: dict | None = None,
                projects: dict | None = None, applets: dict | None = None) -> str:
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
            'generated from a database maintained by the author.</p>')
    if cv and cv.get("positions"):
        pitems = []
        for pos in cv["positions"]:
            org = html.escape(pos["organization"])
            if pos.get("url"):
                org = f'<a href="{html.escape(pos["url"])}">{org}</a>'
            pitems.append(f'<li><strong>{html.escape(pos["title"])}</strong>, {org}</li>')
        body += f'<ul class="positions">{"".join(pitems)}</ul>'
    nworks = len((papers or {}).get("works") or [])
    if nworks:
        body += ('<p class="desc"><a href="papers.html"><strong>Papers and preprints</strong></a> '
                 f'&mdash; a searchable, tag-organized database of {nworks} works.</p>')
    if cv:
        body += ('<p class="desc"><a href="bio.html"><strong>Biography and CV</strong></a> '
                 '&mdash; short and extended bios, plus short and full curriculum vitae.</p>')
    if contact:
        body += ('<p class="desc"><a href="contact.html"><strong>Contact and policies</strong></a> '
                 '&mdash; how to reach me, and my correspondence policies.</p>')
    if travel:
        npast = len((travel or {}).get("past") or [])
        body += ('<p class="desc"><a href="travel.html"><strong>Travel</strong></a> '
                 f'&mdash; upcoming engagements and a log of {npast} past trips.</p>')
    if projects:
        nproj = len((projects or {}).get("projects") or [])
        body += ('<p class="desc"><a href="projects.html"><strong>Collaborative projects</strong></a> '
                 f'&mdash; {nproj} active and completed online projects.</p>')
    if applets:
        napp = len((applets or {}).get("applets") or [])
        body += ('<p class="desc"><a href="applets.html"><strong>Interactive tools</strong></a> '
                 f'&mdash; {napp} experimental math apps and games, old and newly ported.</p>')
    for l in sorted(links, key=lambda d: d["title"].lower()):
        blurb = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", l.get("description", ""))
        blurb = f" &mdash; {html.escape(blurb)}" if blurb else ""
        body += (f'<p class="desc"><a href="{l["slug"]}.html">'
                 f'<strong>{html.escape(l["title"])}</strong></a>{blurb}</p>')
    body += ('<details class="section" id="books">'
             f'<summary>Books <span class="count">({len(books)})</span></summary>'
             f'<ul class="book-list">{"".join(rows)}</ul></details>')
    courses = (teaching or {}).get("courses") or []
    if courses:
        crows = []
        # Reverse chronological: newest term first.
        for c in sorted(courses, key=lambda c: (c["year"], _QUARTER_ORDER.get(c["quarter"], 0)),
                        reverse=True):
            termname = c.get("term") or _QUARTER_NAME.get(c["quarter"], c["quarter"])
            term = f'{termname} {c["year"]}'
            num = html.escape(c["number"])
            num = f'<a href="{html.escape(c["url"])}">{num}</a>' if c.get("url") else num
            inst = c.get("institution")
            title = html.escape(c["title"]) + (f" ({html.escape(inst)})" if inst and inst != "UCLA" else "")
            crows.append(f'<li><span class="year">{term}</span> {num}'
                         f'<span class="coauth"> &middot; {title}</span></li>')
        body += ('<details class="section" id="teaching">'
                 f'<summary>Teaching <span class="count">({len(courses)})</span></summary>'
                 f'<ul class="book-list">{"".join(crows)}</ul></details>')
    students = (cv or {}).get("students") or []
    if students:
        def is_current(s):
            y = str(s.get("years", "")).strip()
            return y.endswith("–") or y.endswith("-")

        def sname(s):
            nm = html.escape(s["name"])
            return f'<a href="{html.escape(s["url"])}">{nm}</a>' if s.get("url") else nm

        def co(s):
            return f'; co-advised with {html.escape(s["coadvisor"])}' if s.get("coadvisor") else ""
        current = [s for s in students if is_current(s)]
        former = [s for s in students if not is_current(s)]
        crows = []
        for s in sorted(current, key=lambda s: s["name"]):
            det = (f'{html.escape(s["level"])}, advanced to candidacy {s["atc"]}' if s.get("atc")
                   else f'{html.escape(s["level"])}, {html.escape(str(s.get("years", "")))}')
            crows.append(f'<li>{sname(s)}<span class="coauth"> &middot; {det}{co(s)}</span></li>')
        frows = []
        for s in reversed(former):
            th = s.get("thesis") or {}
            extra = html.escape(s["level"]) + co(s)
            if th.get("title"):
                tt = html.escape(th["title"])
                if th.get("url"):
                    tt = f'<a href="{html.escape(th["url"])}">{tt}</a>'
                extra += f' &mdash; {tt}'
            frows.append(f'<li><span class="year">{html.escape(str(s.get("years", "")))}</span> '
                         f'{sname(s)}<span class="coauth"> &middot; {extra}</span></li>')
        body += ('<details class="section" id="students">'
                 f'<summary>Students <span class="count">({len(current)} current)</span></summary>'
                 f'<ul class="book-list">{"".join(crows)}</ul>'
                 '<details class="section">'
                 f'<summary>Former students <span class="count">({len(former)})</span></summary>'
                 f'<ul class="book-list">{"".join(frows)}</ul></details></details>')
    editorial = [s for s in ((cv or {}).get("service") or []) if s.get("editorial")]
    if editorial:
        def jname(s):
            nm = html.escape(s["organization"])
            return f'<a href="{html.escape(s["url"])}">{nm}</a>' if s.get("url") else nm
        active = [s for s in editorial if not s.get("end")]
        prior = [s for s in editorial if s.get("end")]
        arows = []
        for s in sorted(active, key=lambda s: str(s.get("start", "")), reverse=True):
            arows.append(f'<li>{jname(s)}<span class="coauth"> &middot; '
                         f'{html.escape(s["role"])} (since {html.escape(str(s["start"]))})</span></li>')
        prows = []
        for s in sorted(prior, key=lambda s: (str(s.get("end", "")), str(s.get("start", ""))),
                        reverse=True):
            yr = f'{html.escape(str(s["start"]))}&ndash;{html.escape(str(s["end"]))}'
            prows.append(f'<li><span class="year">{yr}</span> {jname(s)}'
                         f'<span class="coauth"> &middot; {html.escape(s["role"])}</span></li>')
        note = (cv or {}).get("editorial_note")
        note_html = (f'<p class="sub"><a href="{html.escape(note["url"])}">'
                     f'{html.escape(note["text"])}</a></p>') if note else ""
        body += ('<details class="section" id="editorial">'
                 f'<summary>Editorial roles <span class="count">({len(active)} active)</span></summary>'
                 f'{note_html}'
                 f'<ul class="book-list">{"".join(arows)}</ul>'
                 '<details class="section">'
                 f'<summary>Former editorial roles <span class="count">({len(prior)})</span></summary>'
                 f'<ul class="book-list">{"".join(prows)}</ul></details></details>')
    # Open the <details> targeted by the URL hash (e.g. index.html#books).
    body += ('<script>function openHash(){var h=location.hash.slice(1);if(!h)return;'
             'var el=document.getElementById(h);if(!el)return;'
             "var d=el.tagName==='DETAILS'?el:el.closest('details');"
             'if(d){d.open=true;d.scrollIntoView();}}'
             "window.addEventListener('hashchange',openHash);openHash();</script>")
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
    teaching_files = sorted(TEACHING.glob("*.yaml")) if TEACHING.exists() else []
    teaching = yaml.safe_load(teaching_files[0].read_text(encoding="utf-8")) if teaching_files else None
    papers_files = sorted(PAPERS.glob("*.yaml")) if PAPERS.exists() else []
    papers = yaml.safe_load(papers_files[0].read_text(encoding="utf-8")) if papers_files else None
    if papers:
        slug, htmltext = build_papers_page(papers)
        (SITE / f"{slug}.html").write_text(htmltext, encoding="utf-8", newline="\n")
    cv_path = CV / "cv.yaml"
    cv = None
    if cv_path.exists():
        cv = yaml.safe_load(cv_path.read_text(encoding="utf-8"))
        # Merge the gitignored private overlay locally (never rendered on public pages).
        priv = CV / "private.yaml"
        if priv.exists():
            overlay = yaml.safe_load(priv.read_text(encoding="utf-8")) or {}
            cv.update({k: v for k, v in overlay.items() if k not in cv})
        cv_pages, cv_texts = build_cv(cv, (papers or {}).get("works") or [], books,
                                      (teaching or {}).get("courses") or [])
        for slug, htmltext in cv_pages:
            (SITE / f"{slug}.html").write_text(htmltext, encoding="utf-8", newline="\n")
        for name, text in cv_texts:
            (SITE / name).write_text(text, encoding="utf-8", newline="\n")
    travel_path = TRAVEL / "travel.yaml"
    travel = yaml.safe_load(travel_path.read_text(encoding="utf-8")) if travel_path.exists() else None
    if travel:
        (SITE / "travel.html").write_text(build_travel(travel), encoding="utf-8", newline="\n")
    contact_path = CONTACT / "contact.yaml"
    contact = None
    if contact_path.exists():
        contact = yaml.safe_load(contact_path.read_text(encoding="utf-8"))
        (SITE / "contact.html").write_text(build_contact(contact, travel), encoding="utf-8", newline="\n")
    projects_path = PROJECTS / "projects.yaml"
    projects = None
    if projects_path.exists():
        projects = yaml.safe_load(projects_path.read_text(encoding="utf-8"))
        (SITE / "projects.html").write_text(build_projects(projects), encoding="utf-8", newline="\n")
    applets_path = APPLETS / "applets.yaml"
    applets = None
    if applets_path.exists():
        applets = yaml.safe_load(applets_path.read_text(encoding="utf-8"))
        (SITE / "applets.html").write_text(build_applets(applets), encoding="utf-8", newline="\n")
    # Copy hand-authored static assets (e.g. the ported applet pages) verbatim into site/.
    if STATIC.exists():
        shutil.copytree(STATIC, SITE, dirs_exist_ok=True)
    (SITE / "index.html").write_text(
        build_index(books, linkdocs, teaching, papers, cv, contact, travel, projects, applets),
        encoding="utf-8", newline="\n")
    (SITE / ".nojekyll").write_text("", encoding="utf-8")  # serve files as-is on Pages
    ncourses = len((teaching or {}).get("courses") or [])
    nworks = len((papers or {}).get("works") or [])
    print(f"Built {len(books)} book page(s) + {len(linkdocs)} link page(s) + {nworks} works "
          f"+ {'CV + ' if cv else ''}index ({ncourses} courses) into {SITE}")


if __name__ == "__main__":
    main()
