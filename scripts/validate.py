#!/usr/bin/env python3
"""Validate every errata YAML file in data/errata/ against schema/errata.schema.json.

Also enforces a few cross-field rules the JSON Schema can't express (unique ids).
Exits non-zero on any problem so CI fails loudly. Run: python scripts/validate.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "errata.schema.json"
DATA = ROOT / "data" / "errata"
LINKS_SCHEMA = ROOT / "schema" / "links.schema.json"
LINKS = ROOT / "data" / "links"
TEACHING_SCHEMA = ROOT / "schema" / "teaching.schema.json"
TEACHING = ROOT / "data" / "teaching"


def validate_links() -> int:
    """Validate curated link-collection files against links.schema.json."""
    if not LINKS.exists():
        return 0
    validator = Draft7Validator(yaml.safe_load(LINKS_SCHEMA.read_text(encoding="utf-8")))
    problems = 0
    for path in sorted(LINKS.glob("*.yaml")):
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
        errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
        for err in errors:
            loc = "/".join(str(p) for p in err.path) or "(root)"
            print(f"{path.name}: {loc}: {err.message}")
            problems += 1
        n = sum(len(s.get("entries", [])) for s in doc.get("sections", []))
        print(f"  {path.name}: {len(doc.get('sections', []))} sections, {n} links "
              f"-> {'OK' if not errors else 'INVALID'}")
    return problems


def validate_teaching() -> int:
    """Validate the teaching course list against teaching.schema.json."""
    if not TEACHING.exists():
        return 0
    validator = Draft7Validator(yaml.safe_load(TEACHING_SCHEMA.read_text(encoding="utf-8")))
    problems = 0
    for path in sorted(TEACHING.glob("*.yaml")):
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
        errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
        for err in errors:
            loc = "/".join(str(p) for p in err.path) or "(root)"
            print(f"{path.name}: {loc}: {err.message}")
            problems += 1
        print(f"  {path.name}: {len(doc.get('courses', []))} courses "
              f"-> {'OK' if not errors else 'INVALID'}")
    return problems


def main() -> int:
    validator = Draft7Validator(yaml.safe_load(SCHEMA.read_text(encoding="utf-8")))
    files = sorted(DATA.glob("*.yaml"))
    if not files:
        print(f"No YAML files found in {DATA}", file=sys.stderr)
        return 1

    problems = 0
    for path in files:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
        errors = sorted(validator.iter_errors(doc), key=lambda e: e.path)
        for err in errors:
            loc = "/".join(str(p) for p in err.path) or "(root)"
            print(f"{path.name}: {loc}: {err.message}")
            problems += 1

        # Cross-field: erratum ids must be unique within a file.
        seen = {}
        for ed in doc.get("editions", []):
            for i, e in enumerate(ed.get("errata", [])):
                eid = e.get("id")
                if eid is None:
                    continue
                if eid in seen:
                    print(f"{path.name}: duplicate erratum id {eid!r}")
                    problems += 1
                seen[eid] = True

        n = sum(len(ed.get("errata", [])) for ed in doc.get("editions", []))
        stubs = sum(
            1 for ed in doc.get("editions", []) for e in ed.get("errata", [])
            if e.get("page") == "?"
        )
        status = "OK" if not errors else "INVALID"
        print(f"  {path.name}: {n} errata, {stubs} stubs -> {status}")

    problems += validate_links()
    problems += validate_teaching()

    if problems:
        print(f"\n{problems} problem(s) found.", file=sys.stderr)
        return 1
    print(f"\nAll {len(files)} errata file(s) + link page(s) valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
