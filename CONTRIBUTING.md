# Contributing

This site is maintained by the author (with AI assistance) and is not looking for
co-maintainers, but **corrections are very welcome**.

If you spot an error — a wrong page number in an erratum, a broken or outdated
link, an incorrect detail — please either:

- open an [issue](https://github.com/teorth/tao-web/issues), or
- submit a pull request editing the relevant `data/**/*.yaml` file.

Please edit the **YAML data**, not the generated HTML in `site/` (which is rebuilt
automatically). If you can, run `python scripts/validate.py` before submitting so
the change passes the schema check.

## Data fixes vs. code changes

For **content** — errata, links, an applet's data (e.g. a wrong dependency in a
paper diagram) — a pull request editing the YAML/data is welcome.

For changes to the **code** (the build scripts or the interactive applets under
`static/apps/`), please **open an issue rather than a pull request**. The codebase
is maintained primarily with AI assistance and is not optimized for direct human
maintainability; unreviewed code contributions — even good ones — can make it
harder to keep maintaining, so I would rather understand the underlying problem and
address it than merge a code change. The applets in particular are shared for
transparency, not as a base for derived works (see `LICENSE`).
