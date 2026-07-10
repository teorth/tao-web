#!/usr/bin/env python3
"""One-shot: build data/travel/travel.yaml from the live tags.html past-trips
table (deterministic parse) plus the hand-entered upcoming list. Kept for
provenance; the YAML is maintained by hand thereafter.

Reproduce with:
    curl -sL https://www.math.ucla.edu/~tao/tags.html -o scratch_tags.html
    python scripts/gen_travel.py
"""
from __future__ import annotations
import re, html as H, urllib.parse as U
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scratch_tags.html"
OUT = ROOT / "data" / "travel" / "travel.yaml"


def unwrap(u: str) -> str:
    u = H.unescape(u)
    if "google.com/url" in u:
        q = U.parse_qs(U.urlparse(u).query).get("q")
        if q:
            return q[0]
    return u


def strip(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", H.unescape(t))).strip()


def norm_place(p: str) -> str:
    return re.sub(r"\s+-\s+", " – ", p).strip()


def parse_past() -> list[dict]:
    h = SRC.read_text(encoding="utf-8", errors="replace")
    i = h.find("Past trips"); j = h.find("</table>", i)
    lis = re.findall(r"<li\b[^>]*>(.*?)</li>", h[i:j], re.S)
    trips = []
    for li in lis:
        cancelled = bool(re.search(r'class="[^"]*\b(c8|c23)\b', li))
        a = re.search(r'href="([^"]+)"', li)
        text = strip(li)
        m = re.match(r"(\d{4})\s+(.*)", text)
        if not m:
            raise SystemExit(f"unparsed li: {text!r}")
        year, rest = int(m.group(1)), m.group(2)
        pm = re.match(r"(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$", rest)
        dates, place = (pm.group(1), pm.group(2)) if pm else (rest, "")
        t = {"year": year, "dates": dates.replace("-", "–").strip(),
             "place": norm_place(place)}
        if a:
            t["url"] = unwrap(a.group(1))
        if cancelled:
            t["cancelled"] = True
        trips.append(t)
    return trips


UPCOMING = [
    {"year": 2026, "dates": "Feb 21", "place": "Princeton"},
    {"year": 2026, "dates": "May 11–15", "place": "Providence"},
    {"year": 2026, "dates": "Jun 23–24", "place": "DC"},
    {"year": 2026, "dates": "Jun 28 – Jul 3", "place": "Montreal", "cancelled": True,
     "note": "very tentative"},
    {"year": 2026, "dates": "Jun 29", "place": "UC Riverside"},
    {"year": 2026, "dates": "Jul 23–30", "place": "Philadelphia"},
    {"year": 2026, "dates": "Sep 14–15", "place": "York Town", "tentative": True,
     "note": "very tentative"},
    {"year": 2026, "dates": "Nov 5–7", "place": "San Francisco"},
    {"year": 2027, "dates": "Winter quarter", "place": "UK", "tentative": True,
     "note": "very tentative"},
    {"year": 2027, "dates": "May 6", "place": "New York", "tentative": True,
     "note": "tentative"},
]

doc = {
    "title": "Travel",
    "note": "Due to a high workload and large volume of requests, I am currently "
            "declining almost all future invitations to travel.",
    "upcoming": UPCOMING,
    "past": parse_past(),
}

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", encoding="utf-8", newline="\n") as f:
    f.write("# Travel log. Past trips imported from the live tags.html table; "
            "upcoming maintained by hand.\n")
    yaml.safe_dump(doc, f, allow_unicode=True, sort_keys=False,
                   default_flow_style=False, width=1000)
print(f"wrote {OUT}: {len(doc['upcoming'])} upcoming, {len(doc['past'])} past")
