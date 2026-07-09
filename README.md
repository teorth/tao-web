# tao-web

Structured source of truth for content currently maintained by hand on
[terrytao.wordpress.com](https://terrytao.wordpress.com/) and
[math.ucla.edu/~tao](https://www.math.ucla.edu/~tao/), starting with **book errata**.

Each book's errata live in one YAML file. A build step renders them to a static
site published via GitHub Pages, so the data is edited once and the page is
generated — no more hand-syncing HTML, and page-number stubs are tracked
explicitly instead of buried in prose.

## Layout

```
data/errata/<slug>.yaml      # ground truth: one file per book
schema/errata.schema.json    # contract every YAML file must satisfy
scripts/validate.py          # check all YAML against the schema (CI gate)
scripts/build.py             # YAML -> static HTML into site/
scripts/import_wordpress.py  # one-time migration helper per book
site/                        # generated output (gitignored; built in CI)
.github/workflows/deploy.yml # validate + build + publish to Pages on push to main
```

## Data model

A file is a `book` plus a list of `editions`, each with `errata`. Each erratum
is primarily a `page` token and a `text` correction (inline math in `$...$`):

```yaml
book:
  title: Analysis I
  slug: analysis-i
editions:
  - id: fourth-edition
    name: Fourth edition
    errata:
      - id: fourth-edition-0004
        page: "9"                 # exact printed token; "x" for front matter, "101, 133" for spans
        text: "In Example 1.2.12, final paragraph, $4 x^{-2}$ should be $4 x^{-3}$."
      - id: fourth-edition-0071
        page: "?"                 # KNOWN location, page number not yet filled in (a stub)
        text: "In Exercise 11.9.1, ..."
```

`page: "?"` marks a stub — a correction whose page number is still unknown.
`page: null` is for entries with no page concept (e.g. a `General:` note). The
build highlights stubs and the validator counts them, so they are easy to find
and resolve in batches. Optional enrichment fields (`location`, `change.from`/
`change.to`, `reported_by`, `status`, `fixed_in`) are documented in the schema.

## Working on it

```bash
pip install -r requirements.txt
python scripts/validate.py     # must pass before pushing
python scripts/build.py        # writes site/; open site/index.html to preview
```

Everyday edits are just changes to the YAML (add a correction, fill a stub page
number), validated and previewed with the two commands above. Pushing to `main`
revalidates and republishes automatically.

## Migrating another book

```bash
python scripts/import_wordpress.py --url https://terrytao.wordpress.com/books/<slug>/ \
  --slug <slug> --title "<Title>" --out data/errata/<slug>.yaml
```

Review the generated file, then it becomes the ground truth.
