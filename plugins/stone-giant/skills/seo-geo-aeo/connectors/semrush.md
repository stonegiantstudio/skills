# Connector: Semrush

```
last_verified: 2026-06-25
feeds: dimension 4 (authority) + keyword/competitor targeting for the playbook
cost: paid SaaS (API is units-metered)
depth: API + MCP   # screenshot-parsing depth deferred to v2
```

**Unique data:** keyword positions + search volume, competitor keyword gaps,
backlink profile, and Authority Score — third-party estimates that complement
GSC's owned-site truth.

## Ingestion (preference order)

### 1. API (method=api)
- **Semrush API**: `domain_ranks` (Authority Score, organic traffic/keywords),
  `domain_organic` (ranking keywords), `backlinks_overview`.
  <https://developer.semrush.com/api/>. Units-metered — note cost before bulk
  pulls. User supplies the API key; do not discover it.

### 2. MCP (method=mcp)
- Hosted **`mcp.semrush.com`** (account auth) exposes Trends + Standard API
  tools. Use if connected.

### 3. Paste / screenshot (method=screenshot — v2)
- **Domain Overview** screen: Authority Score, Organic Traffic, Organic
  Keywords, Backlinks cards. Full screen-by-screen parsing is **v2**; for now,
  if a user pastes it, read those four cards and label `method=screenshot`.

## Provenance & freshness
- All Semrush metrics are **estimated** (modeled), never measured-owned-data —
  always tag `method=api` but note "third-party estimate" so `track` never diffs
  them against GSC measured positions.
