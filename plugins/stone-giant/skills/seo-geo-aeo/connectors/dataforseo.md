# Connector: DataForSEO (pay-per-use core + two activated subscription products)

```
last_verified: 2026-06-29
feeds: dim 1/4/6 + keyword volume + competitor SERP/backlinks/AI-citation —
       the on-demand fill for everything GSC/GA4/Lighthouse/Bing-WMT can't reach
cost: pay-per-use wallet; two optional add-ons (Backlinks, LLM Mentions) each need
      a $100/mo activation — gate on it, fall back if absent (see Billing model)
```

**Unique data:** one DataForSEO account can stand in for much of what Semrush/Ahrefs
provide *and* adds AI-answer citations — SERP rankings, full backlink profiles,
keyword volume, competitor link/keyword gaps, and brand mentions inside ChatGPT /
Google AI Overviews — billed per call (cents), not a monthly seat. It's an
*alternative* to those tools, not a mandate: reach for whichever key the user has.
Its singular value is the data the free stack (GSC/GA4/Lighthouse) structurally
cannot give — anything about **competitors** or **AI-answer surfaces**.

## Billing model — read first (the gotcha)

Most of DataForSEO is **pure pay-per-use** with no commitment: SERP, keyword
volume, and all `dataforseo_labs/*`. Draw down a prepaid wallet per call.

**Two products require a $100/month minimum *commitment* to activate** — they are
**off by default** and a raw call returns an access error until activated:

- **Backlinks API** (`backlinks/*`) — $100/mo.
- **AI Optimization API → LLM Mentions** (`ai_optimization/llm_mentions/*`) — $100/mo.
- Activate both = **$200/mo**. The committed funds **stay in your wallet and are
  spendable on any DataForSEO API** — it's a spend *floor*, not a surcharge.
- Backlinks' minimum is **waived** when the API is used through DataForSEO's
  Make.com, n8n, or Google Sheets connector integrations (not via raw HTTP).

**These two are optional paid add-ons — gate on activation, never assume them.**
Follow the skill's "if there's a key, use the resource" rule: attempt the call; if it
returns an access error the product isn't activated, so **fall back gracefully** and
move on — for backlinks → Ahrefs/Semrush if those keys exist, else reason from
on-page; for AI mentions → the manual citation protocol in
`connectors/ai-visibility.md`. A missing activation is a degraded source, not a blocker.

**Decide on cadence, not access.** Both bill per call even when committed, so the real
question is *frequency*: a monthly portfolio track is single-digit dollars of actual
usage — the $100/mo is a floor you pay regardless. Commit a product's floor only when
planned monthly usage **across all DataForSEO APIs** (the floor is shared) clears it,
or when always-on access removes real friction. Otherwise reactivate for a single
month when a refresh is due, or — for backlinks only — route through the
no-commitment Make/n8n/Google-Sheets connector.

### What you actually get (validated on a real 4-domain run, ~$1.70 total)

One established site + three greenfield domains, to calibrate expectations:

- **Backlinks earns its keep only where a profile exists.** The established site
  returned rank 279 / 797 referring domains; the three new domains correctly returned
  ~0 — **absence reads as absence, not as bad data.** The high-value output was a
  **spam/PBN footprint GSC can't show**: free `blogspot.com` subdomains dominating the
  referring TLDs, a link-selling anchor (a Telegram "quarterlinks" channel), and
  hundreds of sitewide "Privacy Policy" footer links — i.e. **disavow candidates**.
  Read `referring_links_tld` (free-host concentration = PBN tell), `anchors`
  (link-scheme footprints + over-optimized exact-match), and `backlinks_spam_score`
  together; one `summary` + `anchors` pull per domain (~$0.04) surfaces it.
- **LLM Mentions is the standout for GEO.** The established brand showed **224 Google
  AI-Overview citations** (AI search volume ~30k) and named the exact winning queries
  *and* the **co-cited competitors** (marketplaces + niche peers) — reproducible
  monthly, which the manual protocol can't match at breadth. The same brand had only
  **1 ChatGPT mention**: the ChatGPT corpus is **US/EN-only and thin** — treat Google
  AI Overviews as the primary signal, ChatGPT as supplementary. Greenfield domains
  returned 0 mentions (expected — nothing to track yet).
- **The decision this implies:** unique, high-quality data — but it pays off **per
  established property with an active SEO/GEO workstream**, not as blanket portfolio
  insurance. Activate a site once it crosses from greenfield into "actively building
  authority / defending AI citations"; until then the manual/free fallbacks suffice.

## Auth (method=api)

HTTP Basic auth from env vars **`DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`**.
- **Never load the values into the session.** Reference the vars by name and let the
  shell expand them *inside* the request — `curl -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD"`
  — so the secret goes straight from the environment to curl and never appears in a
  command's output, the transcript, or context. Do **not** `printenv`/`echo`/`base64`
  a value to inspect it, build the header by hand, or write it to a file.
- To confirm presence without loading the value, test existence only and print a
  boolean: `[ -n "${DATAFORSEO_LOGIN:-}" ] && echo set || echo unset`.
- **Creds usually live in the project's `.env`, not exported in the shell** — a
  shell check (`printenv`, login/interactive shell) routinely shows them *unset even
  when present*. Don't conclude "missing" from that. Load them by **sourcing the
  documented `.env`** inside the request subshell — `set -a; source <repo>/.env; set
  +a` — then reference `$DATAFORSEO_LOGIN`/`$DATAFORSEO_PASSWORD`. **Source it, never
  `cat`/grep it** (sourcing loads the vars without printing them; grepping fishes
  unrelated secrets). Outbound calls need network, so in a sandboxed shell run the
  request with the sandbox disabled. If still unset after sourcing the documented
  `.env`, **ask** — don't hunt other files.
- Get both from the DataForSEO dashboard → **API Access** (the **API password may
  differ** from your dashboard login password).
- **Test against the free Sandbox first:** host `sandbox.dataforseo.com` returns
  **dummy data at $0** — wire and verify request/response parsing before spending.
  Live host: `api.dataforseo.com`. **Caveat:** sandbox validates *shape only*; it
  never returns real competitor links or mentions, so real insight = real charges.
  (Sandbox exists for SERP, Backlinks, LLM Responses/Scraper. **LLM Mentions and
  AI Keyword Data are live-only — no sandbox.**)
- Every response carries a live `cost` field — **reconcile actual spend against it
  after the first calls**, don't trust the rate card blindly.

## What it covers (endpoint → use)

- **SERP** — `serp/google/organic/live/advanced` → rankings for any keyword and
  competitor SERP ownership (aggregate by domain). **AI Overviews:** set
  `load_async_ai_overview: true`; **AI Mode:** `serp/google/ai_mode/...`.
- **Keyword volume** — `keywords_data/google_ads/search_volume/live` → real volume,
  up to ~700 keywords/request. `dataforseo_labs/*` for difficulty, ideas,
  ranked-keywords, and **competitors / domain-intersection** (keyword-gap; see
  "Competitor keyword-gap" below).
- **Backlinks** — `backlinks/*` (activated product) → dim-4 authority + competitor
  link gaps. See "Backlinks API" below.
- **LLM mentions** — `ai_optimization/llm_mentions/*` (activated product) → dim-6
  AI-citation tracking + competitor share-of-voice. See "AI Optimization API" below.

## Backlinks API (dim 4 — entity & authority; activated product)

The competitive/authority layer GSC can't give: GSC shows only *your own* links,
sampled, with no authority score. **All `backlinks/*` endpoints are live-only**
(single POST → ~2s JSON; no task queue). ~2T-link index, history back to Jan 2019.
`rank` is a PageRank-style score, default **0–1000** (`rank_scale:"one_hundred"`
for 0–100).

**The endpoints worth the activation** (the free stack cannot produce these):

1. **`backlinks/domain_intersection/live`** — *the headline deliverable.* Domains
   that link to your rivals **but not you** → a prioritized link-prospect list of
   sites already willing to link in your niche. (`page_intersection/live` =
   page-level, the exact pitchable referring URLs + anchors.)
2. **`backlinks/bulk_ranks/live`** — authority benchmark: client + up to 1,000
   competitors in **one ~$0.05 call**. Pair with `bulk_referring_domains/live` and
   `bulk_spam_score/live` to quantify the authority gap to close.
3. **`backlinks/summary/live`** — whole link profile in one row: `rank`,
   `backlinks`, `referring_domains`/`_ips`/`_subnets`, dofollow vs
   nofollow/sponsored/ugc split (`referring_links_attributes`), TLD/country/
   platform-type mix, `broken_backlinks`, `backlinks_spam_score`.
4. **`backlinks/anchors/live`** — anchor-text health. Over-optimized exact-match
   commercial anchors = penalty risk (invisible in GSC); branded/URL/generic is
   the natural baseline.
5. **`backlinks/competitors/live`** — discovers *real* SEO rivals by shared link
   profile (often not who the client thinks). Run before intersection to pick targets.

**Also available:** `backlinks/backlinks` (row-per-link, with `is_new`/`is_lost`/
`is_broken`, `anchor`, `dofollow`, per-link rank & spam), `referring_domains`,
`referring_networks` (IP/subnet concentration → PBN detection), `domain_pages`
(which of *your* pages attract links; filter `is_broken` for **broken-link-
building** — reclaim equity, or pitch replacements for competitors' dead pages),
`history` (monthly profile since 2019), `timeseries_new_lost_summary` and
`bulk_new_lost_*` (link velocity / negative-SEO spikes).

**Key metric reads:** many `referring_domains` >> many `backlinks` from few domains
(sitewide/footer inflation); low subnet diversity vs domain count = link-network
risk; dofollow share = equity-passing portion; `broken_backlinks` to your 4xx/5xx
= recoverable equity.

**Example — competitor link gap (the deliverable):** *(request shape validated live)*
```json
[{ "targets": { "1": "competitor1.com", "2": "competitor2.com" },
   "exclude_targets": ["clientsite.com"],
   "filters": ["1.rank", ">", 200],
   "order_by": ["1.rank,desc"], "limit": 100 }]
```
**Example — authority benchmark (one cheap call):** *(validated live)*
```json
[{ "targets": ["clientsite.com","competitor1.com","competitor2.com"],
   "rank_scale": "one_thousand" }]
```

## AI Optimization API — LLM Mentions + LLM Responses (dim 6; activated product)

The paid, repeatable alternative to the manual citation protocol in
`connectors/ai-visibility.md`. Four sub-groups under `ai_optimization/`:

**LLM Mentions** (`llm_mentions/*`, activated product, **live-only, no sandbox**) —
an **indexed corpus** of question→answer→sources records you *query* (~2s, no live
model call). Measures how often a brand/domain/keyword appears in LLM answers, and
**which sources those answers cite**. Coverage: **`platform: google`** (AI
Overviews) and **`platform: chat_gpt`**. ⚠️ **ChatGPT data is US + English only**;
Google supports the broader location/language list. No documented sentiment field —
don't promise sentiment.
- `llm_mentions/search/live` — raw mention rows: `question`, `answer` (markdown),
  **`sources`** (the citations: domain/url/title/position), `ai_search_volume` +
  12-mo `monthly_searches`, `first_response_at`/`last_response_at` (recency),
  `brand_entities`, `fan_out_queries`. Target = up to 10 domain/keyword entities
  with include/exclude `search_filter` and `search_scope`.
- `llm_mentions/aggregated_metrics/live` — `mentions` counts + `ai_search_volume`
  grouped by platform / source-domain / brand-entity → the **monthly trend** primitive.
- `llm_mentions/cross_aggregated_metrics/live` — **competitor share-of-voice**: 2–10
  target sets compared on the same query universe. The standout feature vs manual
  prompting.
- `llm_mentions/top_domains/live` / `top_pages/live` — which domains/pages the AI
  cites **instead of you** → content-gap targets.

**LLM Responses** (`{chat_gpt|claude|gemini|perplexity}/llm_responses/*`) — fires a
**live model call** for your exact prompt. The answer text + citations live in
`items[].sections[]` (`.text` and `.annotations[].{title,url}`), alongside token
counts and the passed-through provider cost (`money_spent`). Use it to cover the
engines **Mentions can't**: Perplexity, Gemini, Claude. Live or Standard (task) mode;
Perplexity is live-only. Sandbox exists. *(Validated: Perplexity `model_name:"sonar"`
with `web_search:true` returned a cited answer for ~$0.006, $0.005 of it provider
passthrough.)*

**Example — Perplexity citation check (`perplexity/llm_responses/live`, validated):**
```json
[{ "user_prompt": "best executive assistant staffing firms",
   "model_name": "sonar", "web_search": true, "max_output_tokens": 256 }]
```
Parse `items[].sections[].annotations[].url` for your brand domain (cited y/n).

**AI Keyword Data** (`ai_keyword_data/keywords_search_volume/live`) — `ai_search_volume`
(how often a prompt/keyword is used in AI tools) + 12-mo history, ≤1,000 keywords/call.
**LLM Scraper** (`{chat_gpt|gemini}/llm_scraper/*`) — scrapes the real consumer
ChatGPT/Gemini search UI (closest to what a user sees).

**Monthly GEO track (repeatable):** on a fixed prompt + competitor set, run (1)
`cross_aggregated_metrics/live` once for `google` and once for `chat_gpt`, (2)
`search/live` for the answers+sources citing the brand, (3) `top_domains/live` for
who's cited instead, (4) `keywords_search_volume/live` for AI volume of the priority
questions, (5) `{perplexity|gemini|claude}/llm_responses/live` for the uncovered
engines (mini models, `web_search:true`, small `max_output_tokens`, parse
`annotations` for the brand domain). Tag every call (`tag:"geo-track-YYYY-MM"`).
Persist per platform: `mentions`, brand share-of-voice (brand ÷ competitor total),
`ai_search_volume`-weighted citation rate, top competing source domains, cited y/n
per Responses prompt.

**Example — brand citation check (`search/live`):**
```json
[{ "platform": "google", "location_code": 2840, "language_code": "en",
   "target": [ { "domain": "yourbrand.com", "search_scope": ["sources"] },
               { "keyword": "yourbrand", "search_scope": ["answer"],
                 "match_type": "partial_match" } ],
   "order_by": ["ai_search_volume,desc"], "limit": 100 }]
```
**Example — competitor share-of-voice (`cross_aggregated_metrics/live`):**
```json
[{ "platform": "google", "location_code": 2840, "language_code": "en",
   "targets": [ { "aggregation_key": "brand",      "target": [{ "domain": "yourbrand.com" }] },
                { "aggregation_key": "competitor", "target": [{ "domain": "rival.com" }] } ] }]
```
Read each key's `total.sources_domain[].mentions` for side-by-side citation counts;
run once per `platform`. **Caveat:** Perplexity `sonar` is validated; confirm exact
Gemini/Claude/ChatGPT `model_name` strings via each platform's
`{platform}/llm_responses/models` before scripting LLM Responses.

## Competitor keyword-gap (validated method)

DataForSEO Labs finds competitors **even for small/new sites** where Semrush's
finder returns `NOTHING FOUND` (confirmed in testing). Steps:

1. `dataforseo_labs/google/competitors_domain/live` → competitor domains by keyword
   overlap. (Or `serp_competitors/live` with a keyword list — keyword-driven, also
   works on tiny sites.)
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

Pricing is per call **+ per row** and **changes — check the response `cost` field.**
Current rough rates:
- **SERP** ~$0.0006–0.002/query.
- **Keyword volume** ~$0.05/req (≤700 kw).
- **Backlinks** `$0.02/req + $0.00003/row` ($0.03/1k rows). `summary`, `bulk_*`,
  `competitors` are near-flat (~$0.02–0.05, few rows). The row-heavy ones —
  `backlinks/backlinks`, `page_intersection` — paginate over potentially millions
  of links; **cap with `limit`, `mode:"one_per_domain"`, and `filters`** (filtering
  & sorting are free).
- **LLM Mentions** `$0.10/req + $0.001/row` (a 100-row `search` ≈ $0.20; aggregate
  endpoints ≈ $0.10). Cheap — pull liberally.
- **LLM Responses** `$0.0006/task + the provider's token cost` (passed through as
  `money_spent`). The DataForSEO markup is trivial; **the model tokens are the real
  cost** — cap `max_output_tokens`, prefer `*-mini` models for monitoring.

**Before any large pull** (full backlink list, hundreds of keywords, daily SERP
loops) **estimate rows × price and tell the user the cost first.** A monthly
portfolio track is a few dollars; an unbounded loop is not.

## Provenance & freshness
- `method=api`, but the data is **estimated / third-party** (SERP positions,
  backlink index, volume, and the LLM-mentions corpus are modeled/sampled/indexed,
  not your owned data) — tag the source `dataforseo` and **never diff it against GSC
  measured** series. Sandbox responses are dummy — never record them as real.
- LLM Mentions `first_response_at`/`last_response_at` give the recency window of
  each captured answer; the corpus is indexed, not real-time.
