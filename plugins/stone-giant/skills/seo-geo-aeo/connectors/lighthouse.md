# Connector: Lighthouse / PageSpeed Insights

```
last_verified: 2026-06-26
feeds: dimension 1 (crawlability & technical — Core Web Vitals, technical SEO)
cost: free
```

**Unique data:** measured page-experience and technical-SEO scores — Core Web
Vitals (LCP, INP, CLS) plus Performance / SEO / Accessibility / Best-Practices
category scores.

## Ingestion (preference order)

### 1. CLI (method=api — local, most reliable free path)
- `npx lighthouse <url> --output=json --only-categories=seo,performance,accessibility`.
  Read `categories.*.score`. **No quota** — prefer this for the free path.

### 2. PageSpeed Insights API v5 (method=api)
- `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&category=seo&category=performance&key=$PAGESPEED_API_KEY`.
  Reads `lighthouseResult.categories.{performance,seo}.score` (0–1) +
  `loadingExperience.metrics` (field CWV).
  <https://developers.google.com/speed/docs/insights/v5/get-started>
- **The anonymous quota (no key) is tiny and routinely exhausted** — set
  `PAGESPEED_API_KEY` (free, ~25k/day) or use the CLI above. Field CWV only
  exists for pages with enough CrUX traffic; low-traffic pages return none
  (that is a data gap, not a failing score).

### 3. MCP (method=mcp)
- `priyankark/lighthouse-mcp` or `danielsogl/lighthouse-mcp-server` wrap the
  above (perf/a11y/SEO/security tools). Use if connected.

### 4. Paste / screenshot (method=screenshot)
- **PageSpeed Insights web UI** (pagespeed.web.dev): four gauges —
  **Performance / Accessibility / Best Practices / SEO** (0–100, color-coded) —
  and a **Core Web Vitals Assessment** (LCP / INP / CLS, Pass or Fail) from
  field data. Read gauge numbers and the pass/fail badges.

## Diagnosing a slow LCP — read the phase breakdown (validated)

The fix for a slow LCP depends entirely on **which of its four phases dominates**,
so get the breakdown *before* recommending anything. The PSI **API** usually
returns an empty `largest-contentful-paint-element` audit — run **local
Lighthouse** and parse the JSON (don't rely on `--view`; that just opens a
browser for a human):

```
npx lighthouse <url> --only-categories=performance --output=json --output-path=lh.json
```

Read `audits['largest-contentful-paint-element']` for the LCP element + its phase
table. (A `--view` HTML report also works — it embeds the full JSON in a
`<script id="__LIGHTHOUSE_JSON__">` tag you can extract.)

**Map the dominant phase to the fix:**

| Dominant phase | Meaning | Fix |
| --- | --- | --- |
| **TTFB** | server slow to respond | server/CDN; rare on modern hosts (check `server-response-time`) |
| **Load Delay** | resource discovered late | preload it / raise priority (`fetchpriority="high"`) |
| **Load Time** | resource is heavy | compress, modern format, right-size the image |
| **Render Delay** | fetched but paints late — a *rendering* problem, not loading | `decoding="async"` on the LCP image (switch to `sync`), an entrance/opacity animation gating its paint, or the element only rendering after hydration |

**Render Delay is the most misdiagnosed** — people preload an image that's already
loaded. A real case: an LCP hero image that was already `eager` + `fetchpriority="high"`
still had **78% render delay** because of `decoding="async"` + an entrance
animation; preloading would have done nothing.

Don't trust one PSI lab run — it's noisy (we saw the same page's LCP swing
2.6–8.4s across runs/tools). Use **local** Lighthouse for a controlled read, take
a median of a few, and treat **field CrUX** as the real arbiter once traffic
populates it (low-traffic pages have none — that's a data gap, not a pass/fail).

## Provenance & freshness
- API/CLI/MCP → **measured** (note lab vs field: lab is synthetic, field is real
  CrUX data over 28 days). Screenshot → measured; record which run (mobile vs
  desktop — they differ).
