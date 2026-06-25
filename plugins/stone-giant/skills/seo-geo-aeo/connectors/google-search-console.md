# Connector: Google Search Console (GSC)

```
last_verified: 2026-06-25
feeds: dimensions 1 (technical/coverage), 2 (extractability via real queries), 6 (presence)
cost: free   # Google account + verified property
```

**Unique data:** the only source of *real* owned-site search data — actual
queries, impressions, clicks, CTR, average position, index coverage, and
per-URL inspection. This is the truth other tools estimate.

## Ingestion (preference order)

### 1. API (method=api)
- **Search Analytics:** `searchanalytics.query` on the Search Console API.
  Body dimensions: `query`, `page`, `date`; metrics returned: clicks,
  impressions, ctr, position. <https://developers.google.com/webmaster-tools/v1/searchanalytics/query>
- **URL Inspection:** `urlInspection.index.inspect` for index/coverage state of a URL.
- Auth scope: `https://www.googleapis.com/auth/webmasters.readonly`. User
  supplies an OAuth token or service-account with the property added — ask for
  it; do not hunt for credentials.

### 2. MCP (method=mcp)
- `ahonn/mcp-server-gsc` (`uvx mcp-server-gsc`) or `AminForou/mcp-gsc`. Tools
  expose search-analytics queries and URL inspection. Use if already connected.

### 3. Paste / screenshot / export (method=screenshot)
- **Performance tab** → four summary cards across the top: **Total clicks**,
  **Total impressions**, **Average CTR**, **Average position**. The table below
  has tabs (Queries / Pages / Countries / Devices); the **Queries** tab is
  `Query | Clicks | Impressions | CTR | Position`.
- **Indexing → Pages** report → "Indexed" vs "Not indexed" counts + reasons
  (feeds dimension 1 coverage).
- A CSV export of the Performance table parses the same way.
- Echo parsed numbers back before writing.

## Provenance & freshness
- `method=api`/`mcp` → **measured**. `method=screenshot` → measured but flag the
  date range shown (GSC defaults to last 3 months; data lags ~2 days).
