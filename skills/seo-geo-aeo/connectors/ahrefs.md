# Connector: Ahrefs

```
last_verified: 2026-06-25
feeds: dimension 1 (technical, via Site Audit), dimension 4 (authority, backlinks)
cost: paid SaaS (API requires a paid plan)
depth: API + MCP   # screenshot-parsing depth deferred to v2
```

**Unique data:** one of the largest backlink indexes — Domain Rating, referring
domains, backlink profile, organic keywords, content-gap analysis, and Site
Audit (technical crawl).

## Ingestion (preference order)

### 1. API (method=api)
- **Ahrefs API v3**, Site Explorer endpoints: domain-rating, backlinks,
  organic-keywords, plus Site Audit results.
  <https://docs.ahrefs.com/docs/api/reference/introduction>. Paid API plan
  required; key from `AHREFS_API_TOKEN`; if unset, **ask** — do not hunt.

### 2. MCP (method=mcp)
- Ahrefs MCP server (official) exposes keyword/backlink/competitive tools. Use
  if connected.

### 3. Paste / screenshot (method=screenshot — v2)
- **Site Explorer → Overview**: Domain Rating (DR), Backlinks, Referring
  domains, Organic keywords, Organic traffic cards. **Site Audit → Overview**:
  Health Score + issue counts (feeds dimension 1). Full parsing is **v2**; read
  those cards if pasted and label `method=screenshot`.

## Provenance & freshness
- Backlink/DR metrics are **measured** by Ahrefs' own crawl (real, not modeled);
  organic-keyword *positions* are estimated. Tag accordingly; keep estimated
  positions out of GSC same-source diffs.
