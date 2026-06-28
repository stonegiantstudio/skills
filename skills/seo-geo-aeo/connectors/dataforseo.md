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

## Competitor keyword-gap (validated method)

DataForSEO Labs finds competitors **even for small/new sites** where Semrush's
finder returns `NOTHING FOUND` (confirmed in testing). Steps:

1. `dataforseo_labs/google/competitors_domain/live` → competitor domains by
   keyword overlap. (Or `serp_competitors/live` with a keyword list — keyword-
   driven, also works on tiny sites.)
2. `dataforseo_labs/google/ranked_keywords/live` for the **target** → its keyword set.
3. Same per competitor, filtered to page 1
   (`filters: [["ranked_serp_element.serp_item.rank_group","<=",10]]`,
   `order_by: ["keyword_data.keyword_info.search_volume,desc"]`).
4. Gap = competitor's page-1 keywords the target doesn't rank for (or ranks > 20).

**Two rules, or the gap is garbage (learned the hard way):**
- **Gap only against *topically-focused* competitors.** High-overlap *generalists*
  (weebly, thoughtco, youtube, wikipedia) return their entire catalog — a real run
  surfaced "angelina jolie" and "pirate ships" as "gaps." Drop generalists; keep
  niche peers.
- **Apply a niche keyword filter** (a regex of the target's topic terms) to each
  competitor's keywords before gapping, as a second guard.
- Mega head-terms are usually owned by encyclopedic authorities (Wikipedia/RSC/gov)
  even when a niche peer also ranks — flag those **aspirational**, not targets.
  The sweet spot is mid-volume, niche-relevant terms a beatable peer ranks for.

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
