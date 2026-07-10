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
