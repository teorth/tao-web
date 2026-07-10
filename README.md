# tao-web

The structured source of truth for [Terence Tao's](https://www.math.ucla.edu/~tao/)
web content — book errata, papers, CV, teaching, contact/policies, travel,
collaborative projects, and curated links. The data lives as YAML, is validated
against JSON Schema, and is rendered to a static site published at
**<https://teorth.github.io/tao-web/>** via GitHub Pages. The YAML is the ground
truth; the pages are generated (with AI assistance).

## Layout

```
data/<type>/*.yaml    # ground truth, one directory per content type
schema/*.schema.json  # the contract each data file must satisfy
scripts/validate.py   # validate all data against the schemas (CI gate)
scripts/build.py      # render YAML -> static HTML into site/
site/                 # generated output (gitignored; built in CI)
.github/workflows/    # validate + build + publish to Pages on push to main
```

## Content types

Each type is a directory under `data/` with a matching `schema/<type>.schema.json`
that documents every field:

| type       | what it holds                                                     |
|------------|-------------------------------------------------------------------|
| `errata`   | book bibliographic details and errata (one file per book)         |
| `papers`   | a searchable, tag-organized database of papers, short stories, …  |
| `cv`       | profile, bio, education, awards, service → bio + short/full CV     |
| `teaching` | the course list                                                   |
| `contact`  | contact details and correspondence policies                       |
| `travel`   | upcoming and past trips                                            |
| `projects` | collaborative / formalization projects                            |
| `links`    | curated link collections (e.g. Mastodon posts)                    |

A record is plain YAML; e.g. one erratum is a `page` token plus a `text`
correction (with inline math in `$...$`), where `page: "?"` marks a known
location whose page number is not yet filled in.

## Working on it

```bash
pip install -r requirements.txt
python scripts/validate.py   # must pass before pushing
python scripts/build.py      # writes site/; open site/index.html to preview
```

Everyday edits are just YAML changes; pushing to `main` revalidates and
republishes automatically. Edit the data, never the generated HTML in `site/`.

## Corrections

This repository is maintained by the author (with AI assistance) and is not
looking for co-maintainers, but corrections are welcome — please open an
[issue](https://github.com/teorth/tao-web/issues) or a pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

Copyright © Terence Tao. All rights reserved — see [LICENSE](LICENSE). This
content is not intended for reuse or forking; you are welcome to read the site
and to use the errata to correct your own copies of the relevant works.
