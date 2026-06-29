# Connector: On-page SEO (local HTML parse)

```
last_verified: 2026-06-29
feeds: dim 1 (technical/on-page) + dim 2 (extractability)
cost: free (parse the fetched HTML — no external call, no key)
```

**Unique data:** the classic on-page signals that fall between Lighthouse (CWV)
and the schema validator (JSON-LD) — title tags, meta descriptions, heading
hierarchy, canonical/robots meta, Open Graph / Twitter cards, image alt text,
internal-link/anchor quality, and URL structure. All of it is readable **directly
from the page HTML** the crawl already fetched (see "Phase 1 — Site discovery" in
`SKILL.md`); no API and no credential. Like `schema.md`, this is a parse, not a
service.

## Ingestion (method=api — local parse)

For each crawled page, extract from the served HTML:

| Signal | Where | What "good" looks like |
| --- | --- | --- |
| **Title tag** | `<title>` | present, unique across pages, ~30–60 chars, primary term near the front |
| **Meta description** | `<meta name="description">` | present, unique, ~120–160 chars, not duplicated sitewide |
| **H1** | `<h1>` | exactly one, descriptive; headings nest h1→h2→h3 without skips |
| **Canonical** | `<link rel="canonical">` | present, self-referential or intentional; not pointing off-site by accident |
| **Robots meta / X-Robots** | `<meta name="robots">`, response header | not `noindex`/`nofollow` on pages you want indexed |
| **Open Graph / Twitter** | `<meta property="og:*">`, `<meta name="twitter:*">` | `og:title`/`og:description`/`og:image` present (drives social + some AI-answer cards) |
| **Image alt text** | `<img alt>` | meaningful alt on content images; flag the % missing |
| **Internal links** | `<a href>` to same host | content links use descriptive anchors (not "click here"); key pages are reachable |
| **URL structure** | the path | readable, hyphenated, shallow; no session IDs / deep param chains |
| **Lang / viewport** | `<html lang>`, `<meta name="viewport">` | `lang` set; responsive viewport present (cross-check Lighthouse) |

**Report sitewide patterns, not just one page:** duplicate titles, missing meta
descriptions across N pages, and global alt-text gaps are the findings that move a
score — a single page in isolation hides them. This is why the on-page pass runs
*after* Phase 1 discovery, over the page map, not over one URL.

## What it feeds

- **Dim 1 (Crawlability & technical):** title/meta/canonical/robots/URL/lang — the
  indexability and on-page-signal half of the dimension that CWV alone misses.
- **Dim 2 (Content extractability):** heading hierarchy and H1 singularity overlap
  with the AEO checklist; share findings, don't double-count.

## Honesty rail

These are **classic SEO hygiene**, not AI-specific magic — Tier 2 at best (sound,
lightly quantified). A perfect on-page profile does not by itself produce AI
citations; it removes the technical reasons a page is *ignored*. Score it, fix the
cheap gaps (a missing `<title>` is inexcusable), but don't sell meta tags as a GEO
lever — they aren't one.

## Provenance & freshness
- `method=api` (local parse of the page you fetched), tagged **measured** — it is
  the page's own served markup, not a third-party estimate. Re-parse on each
  `assess`; nothing is cached.
