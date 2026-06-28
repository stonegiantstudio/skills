# Connector: DataForSEO (universal pay-per-use fill)

```
last_verified: 2026-06-27
feeds: dimensions 1, 4, 6 + keyword volume + competitor SERP — the on-demand fill
       for everything GSC/GA4/Lighthouse/Bing-WMT can't reach
cost: pay-per-use (no subscription; prepaid wallet drawn down per call)
```

**Unique data:** one pay-per-use account replaces most of Semrush *and* covers AI
Overviews — SERP rankings, backlinks, keyword volume, competitor data, and
AI-answer mentions — billed per call (cents), not a monthly seat. Reach for it on
demand for data the free stack can't give; for ~5 sites this runs single-digit
dollars/month.

## Auth (method=api)

HTTP Basic auth: `Authorization: Basic <base64("$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD")>`.
- Get both from the DataForSEO dashboard → **API Access** (the **API password may
  differ** from your dashboard login password). If unset, **ask** — never hunt env.
- **Test against the free Sandbox first:** host `sandbox.dataforseo.com` returns
  dummy data at **$0** — wire and verify the integration before spending. Live
  host: `api.dataforseo.com`.

## What it covers (endpoint → use)

- **SERP** — `serp/google/organic/live/advanced` → rankings for any keyword and
  competitor SERP ownership (aggregate results by domain). **AI Overviews:** set
  `load_async_ai_overview: true`; **AI Mode:** `serp/google/ai_mode/...`.
- **Backlinks** — `backlinks/summary`, `backlinks/backlinks`,
  `backlinks/referring_domains` → dim 4 authority; the cheap alternative to
  Ahrefs/Semrush for *competitor* backlink discovery.
- **Keyword volume** — `keywords_data/google_ads/search_volume/live` → real
  volume, up to ~700 keywords/request. `dataforseo_labs/*` for difficulty,
  ideas, ranked-keywords, and **competitors / domain-intersection** (the
  keyword-gap that the standard competitor-finder can't do on small sites).
- **LLM mentions** — `ai_optimization/*` LLM Mentions endpoints → GEO /
  AI-citation tracking (a paid alternative to the manual protocol).

## MCP
- Official `dataforseo/mcp-server-typescript`. Use it if connected instead of raw HTTP.

## Cost guard (pay-per-use — quote it before you spend)
Pricing is per call **+ per row** and **changes — check current rates.** Rough:
SERP ~$0.0006–0.002/query; backlinks ~$0.02/req + $0.00003/row; keyword volume
~$0.05/req (≤700 kw). **Before any large pull** (full backlink list, hundreds of
keywords, daily SERP loops) **estimate rows × price and tell the user the cost
first.** A monthly portfolio track is a few dollars; an unbounded loop is not.

## Provenance & freshness
- `method=api`, but the data is **estimated / third-party** (SERP positions,
  backlink index, and volume are modeled/sampled, not your owned data) — tag the
  source `dataforseo` and **never diff it against GSC measured** series. Sandbox
  responses are dummy — never record them as real.
