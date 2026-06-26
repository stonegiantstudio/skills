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

## Diagnosing a slow LCP (for the playbook)
- The PSI **API** often returns an empty `largest-contentful-paint-element`
  audit. To see the actual element + its phase breakdown, run the **CLI**:
  `npx lighthouse <url> --view`.
- **If LCP ≈ FCP, the bottleneck is first-paint, not the element.** Fix FCP
  (render-blocking CSS/JS, main-thread contention) rather than the image. A
  common culprit is heavy third-party tags (GTM/GA/Ads) executing during render
  — defer them (Partytown / load after first paint), which drops FCP and LCP
  together. Check `server-response-time` (TTFB) first; if it's low, the cost is
  client-side.
- Lab LCP is noisy run-to-run (e.g. 2.6–3.2s) — optimize until lab is
  *consistently* under target, then trust field CrUX once traffic populates it.

## Provenance & freshness
- API/CLI/MCP → **measured** (note lab vs field: lab is synthetic, field is real
  CrUX data over 28 days). Screenshot → measured; record which run (mobile vs
  desktop — they differ).
