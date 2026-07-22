# Documentation

Long-form documentation for `@zanreal/search`, kept in the repository so it
versions with the code it describes.

These pages are also the source for the rendered documentation at
**<https://zanreal.com/docs>**. The site pulls this directory; there is no
second copy to keep in sync. Edit the files here.

## Layout

| File                | Contents                                                     |
| ------------------- | ------------------------------------------------------------ |
| `index.{en,pl}.mdx` | Overview, install, worked examples, field selection, weights |
| `api.{en,pl}.mdx`   | Every export, option and type, with defaults                 |
| `meta.json`         | Page order and section title for the docs site (English)     |
| `meta.pl.json`      | The same, for Polish                                         |

The `.en` and `.pl` suffixes carry the locale. Each locale is written
independently rather than translated, so the two versions differ in their
examples and emphasis by design - the Polish pages, for instance, cover
diacritic handling in a way the English ones have no reason to.

`meta.json` is consumed by the docs site to order pages within the section. It
has no effect when reading these files on GitHub, and nothing else in the
repository depends on it.

## Conventions

- **Links between pages are relative** (`./api.en.mdx`), so they resolve both on
  GitHub and on the docs site. Prefer that over absolute `zanreal.com` URLs.
- **Plain Markdown only.** These pages are read on GitHub at least as often as
  on the docs site, so they avoid renderer-specific MDX components and code-block
  annotations that would show up as literal text here.
- Code samples are checked against the library's actual behaviour rather than
  restating `README.md`. Where the two disagree, these pages describe what the
  code does.

## README or docs?

`README.md` is the landing page: what the package is, how to install it, and
enough to get a first search running. This directory is where behaviour is
documented in full - option semantics, defaults, caching, and the edge cases
that only turn up in real use.
