#!/usr/bin/env python3
"""Import an errata page from terrytao.wordpress.com into a tao-web YAML file.

One-time migration helper (kept in the repo so each remaining book can be
imported the same way). It parses the WordPress markup, converts inline LaTeX
images back to ``$...$`` source, splits entries by edition, and preserves page
tokens faithfully -- including the ``Page ???`` stubs, which become ``page: "?"``.

Usage:
    # From a saved HTML file:
    python scripts/import_wordpress.py --html analysis-i.html --slug analysis-i \
        --title "Analysis I" > data/errata/analysis-i.yaml

    # Or fetch directly:
    python scripts/import_wordpress.py --url https://terrytao.wordpress.com/books/analysis-i/ \
        --slug analysis-i --title "Analysis I" > data/errata/analysis-i.yaml

The output is a *starting point* for a hand-maintained file: review it, then the
YAML becomes the ground truth and this script is no longer needed for that book.
"""
from __future__ import annotations

import argparse
import html as H
import re
import sys
from urllib.request import urlopen, Request

import yaml


def fetch(url: str) -> str:
    req = Request(url, headers={"User-Agent": "tao-web-importer"})
    with urlopen(req) as r:  # noqa: S310 (trusted, user-supplied URL)
        return r.read().decode("utf-8", "replace")


def img_to_latex(fragment: str) -> str:
    """Replace WordPress LaTeX <img> tags with ``$...$`` from their alt text."""
    return re.sub(
        r'<img[^>]*\balt="([^"]*)"[^>]*>',
        lambda m: f"${H.unescape(m.group(1)).strip()}$",
        fragment,
    )


def li_to_text(li: str) -> str:
    txt = img_to_latex(li)
    txt = re.sub(r"<[^>]+>", "", txt)          # drop remaining tags
    txt = H.unescape(txt)
    txt = txt.replace(" ", " ")            # nbsp -> space
    return re.sub(r"\s+", " ", txt).strip()


def split_page(text: str):
    """Return (page_token_or_None, remaining_text).

    ``page`` is the string after "Page " (e.g. "9", "x", "101, 133"), the
    literal ``"?"`` for a ``Page ???`` stub, or None when the entry has no page
    (e.g. a "General:" note)."""
    m = re.match(r"^Page\s+([^:]*?):\s*(.*)$", text, re.S)
    if not m:
        return None, text
    tok = m.group(1).strip()
    rest = m.group(2).strip()
    if "?" in tok:
        return "?", rest
    return tok, rest


def list_items(region: str):
    items = []
    for ul in re.finditer(r'<ul class="wp-block-list">(.*?)</ul>', region, re.S):
        items += re.findall(r"<li>(.*?)</li>", ul.group(1), re.S)
    return items


# Edition separators are centered paragraphs like "-- Errata to the fourth edition --".
# WordPress centers these either via a class (newer block editor) or an inline
# style (older posts); match both.
SEP_RE = re.compile(
    r'<p (?:class="[^"]*has-text-align-center[^"]*"|style="[^"]*text-align:\s*center[^"]*")[^>]*>(.*?)</p>',
    re.S,
)


def parse(raw: str):
    seps = []
    for m in SEP_RE.finditer(raw):
        label = li_to_text(m.group(1))
        if "errata" in label.lower():
            seps.append((m.start(), m.end(), label))
    if not seps:
        sys.exit("No '-- Errata to ... --' section headers found; check the markup.")

    # Content ends at the first sidebar/comment block after the last section.
    tail = min(
        x
        for x in (
            raw.find("<h3", seps[-1][1]),
            raw.find("<aside", seps[-1][1]),
            raw.find('id="comments"', seps[-1][1]),
        )
        if x != -1
    )
    bounds = [s[1] for s in seps] + [tail]

    editions = []
    for i, (_, _, label) in enumerate(seps):
        region = raw[bounds[i] : bounds[i + 1]]
        name = re.sub(r"^[-—\s]*Errata to (the )?", "", label, flags=re.I)
        name = re.sub(r"[-—\s]*$", "", name).strip().capitalize()
        eid = "-".join(re.findall(r"[a-z0-9]+", name.lower()))
        errata = []
        for n, li in enumerate(list_items(region), start=1):
            text = li_to_text(li)
            if not text:
                continue
            page, rest = split_page(text)
            errata.append(
                {"id": f"{eid}-{n:04d}", "page": page, "text": rest}
            )
        editions.append({"id": eid, "name": name, "errata": errata})
    return editions


class _Dumper(yaml.SafeDumper):
    pass


def _str_presenter(dumper, data):
    style = '"' if ("$" in data or ":" in data or data.startswith(("?", "*"))) else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style=style)


_Dumper.add_representer(str, _str_presenter)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--html", help="path to a saved errata HTML file")
    src.add_argument("--url", help="errata page URL to fetch")
    ap.add_argument("--slug", required=True, help="book slug, e.g. analysis-i")
    ap.add_argument("--title", required=True, help='book title, e.g. "Analysis I"')
    ap.add_argument("--author", action="append", default=None,
                    help="author (repeatable); defaults to Terence Tao")
    ap.add_argument("--source", help="canonical source URL to record in the file")
    ap.add_argument("--out", help="output YAML path (default: stdout, UTF-8)")
    args = ap.parse_args()

    raw = open(args.html, encoding="utf-8").read() if args.html else fetch(args.url)
    editions = parse(raw)

    doc = {
        "book": {
            "title": args.title,
            "slug": args.slug,
            "authors": args.author or ["Terence Tao"],
            "source": args.source or args.url or "",
        },
        "editions": editions,
    }
    total = sum(len(e["errata"]) for e in editions)
    stubs = sum(1 for e in editions for x in e["errata"] if x["page"] == "?")
    print(f"# Imported {total} errata ({stubs} stubs) across "
          f"{len(editions)} editions. Review before treating as ground truth.",
          file=sys.stderr)

    header = (f"# Imported from {doc['book']['source'] or args.url} by "
              f"scripts/import_wordpress.py -- review, then maintain by hand.\n")
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(header)
            yaml.dump(doc, fh, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=100)
    else:
        # Force UTF-8 even when stdout is redirected to a file on Windows.
        sys.stdout.reconfigure(encoding="utf-8", newline="\n")
        sys.stdout.write(header)
        yaml.dump(doc, sys.stdout, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=100)


if __name__ == "__main__":
    main()
