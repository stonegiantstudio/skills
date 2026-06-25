# Connector: Lighthouse / PageSpeed Insights

```
last_verified: 2026-06-25
feeds: dimension 1 (crawlability & technical — Core Web Vitals, technical SEO)
cost: free
```

**Unique data:** measured page-experience and technical-SEO scores — Core Web
Vitals (LCP, INP, CLS) plus Performance / SEO / Accessibility / Best-Practices
category scores.

## Ingestion (preference order)

### 1. API (method=api)
- **PageSpeed Insights API v5:**
  `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&category=seo&category=performance`.
  Optional API key (free, ~25k req/day). No local Chrome needed.
  <https://developers.google.com/speed/docs/insights/v5/get-started>
- Read `lighthouseResult.categories.{performance,seo}.score` (0–1) and
  `loadingExperience.metrics` for field CWV.

### 2. CLI (method=api — local)
- `npx lighthouse <url> --output=json --only-categories=seo,performance,accessibility`.
  Parse the same `categories.*.score` shape.

### 3. MCP (method=mcp)
- `priyankark/lighthouse-mcp` or `danielsogl/lighthouse-mcp-server` wrap the
  above (perf/a11y/SEO/security tools). Use if connected.

### 4. Paste / screenshot (method=screenshot)
- **PageSpeed Insights web UI** (pagespeed.web.dev): four gauges —
  **Performance / Accessibility / Best Practices / SEO** (0–100, color-coded) —
  and a **Core Web Vitals Assessment** (LCP / INP / CLS, Pass or Fail) from
  field data. Read gauge numbers and the pass/fail badges.

## Provenance & freshness
- API/CLI/MCP → **measured** (note lab vs field: lab is synthetic, field is real
  CrUX data over 28 days). Screenshot → measured; record which run (mobile vs
  desktop — they differ).
