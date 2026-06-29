# Connector: <Tool name>

Copy this file to `connectors/<tool>.md` to teach the skill a new data source.
Keep it operational — the goal is that `assess`/`track` can pull real numbers,
or parse a pasted screenshot, without guessing.

```
last_verified: YYYY-MM-DD      # bump when you confirm the API/screens still match; refresh re-checks this
feeds: dimensions N, M         # which of the 7 assess dimensions this informs
cost: free | api-key | paid SaaS
```

**Unique data:** what this tool gives that others do not (one or two lines).

## Ingestion (preference order — always degrade gracefully)

### 1. API (method=api)
- Endpoint / SDK and the exact call.
- Auth scope (and how the user supplies it — never discover keys from env).
- Metric → response field map.
- *Local-only connectors:* if the data comes from a **local parse** of fetched
  content (HTML/JSON-LD) use `method=parse`; from a **plain file fetch**
  (llms.txt/robots.txt) use `method=fetch`. Reserve `method=api` for an external
  structured API. (Full enum + meanings in `SKILL.md`.)

### 2. MCP (method=mcp)
- Server repo + install, and the tool names to call.

### 3. Paste / screenshot / export (method=screenshot)
- Which screen or export holds the numbers.
- **Where each metric sits**, precisely enough to read a pasted image
  (e.g. "top-left summary card labeled X").
- Echo parsed values back to the user for confirmation before writing them.

## Provenance & freshness
- Default `method` when this connector is used (`api|mcp|parse|fetch|screenshot|
  manual|estimated` — see `SKILL.md`; everything except `estimated` is *measured*),
  and any caveat (e.g. estimated vs measured, sampling, date lag).
