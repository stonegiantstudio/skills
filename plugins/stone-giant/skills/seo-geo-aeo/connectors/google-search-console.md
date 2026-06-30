# Connector: Google Search Console (GSC)

```
last_verified: 2026-06-26
feeds: dimensions 1 (technical/coverage), 2 (extractability via real queries), 6 (presence)
cost: free   # Google account + verified property
```

**Unique data:** the only source of *real* owned-site search data — actual
queries, impressions, clicks, CTR, average position, index coverage, and
per-URL inspection. This is the truth other tools estimate.

## Ingestion (preference order)

### 1. API (method=api)

**Auth — service account → bearer token (the real mechanics).**
`GSC_SERVICE_ACCOUNT_JSON` is a key *file*; you must mint a signed token from it,
not pass it as a key. With `google-auth`:

```python
from google.oauth2 import service_account
from google.auth.transport.requests import Request
c = service_account.Credentials.from_service_account_file(
    json_path, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
c.refresh(Request()); token = c.token   # -> header "Authorization: Bearer <token>"
```

(`GSC_ACCESS_TOKEN`, if set, is already a bearer token — use it directly.)
**Gotcha:** the service-account *email* must be added as a user on the property
in Search Console first, or every call 403s — the key file alone is not access.

**Resolve the property before querying.** `GET .../webmasters/v3/sites`
(`sites.list`) and pick the entry whose `siteUrl` contains the domain — it
returns the exact identifier (`sc-domain:example.com` for a Domain property,
`https://example.com/` for URL-prefix). Use it verbatim (URL-encoded in the
path); don't assume the form from `GSC_PROPERTY`.

**Headline totals: query with NO dimensions.** For the property grand totals
(clicks, impressions, CTR, avg position), POST `searchanalytics.query` with **no
`dimensions`** — one grand-total row. Do **not** sum a top-N
`dimensions:["query"]` result and report it as the total: top-N omits the long
tail and undercounts badly (a real run summed 19 impressions from the top 10 vs a
true total of 938). Add `dimensions` only for *breakdowns*, with a high
`rowLimit` (e.g. 1000) when you need the full set.
- **URL Inspection:** `urlInspection.index.inspect` for index/coverage of a URL.
- Endpoint: <https://developers.google.com/webmaster-tools/v1/searchanalytics/query>
- Scope `https://www.googleapis.com/auth/webmasters.readonly`. Credentials from
  `GSC_PROPERTY` + `GSC_SERVICE_ACCOUNT_JSON` (or `GSC_ACCESS_TOKEN`). Check presence
  by sourcing the project `.env`, not the bare shell (see SKILL.md's presence check);
  if absent there, **ask** — never hunt the environment for keys.

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
