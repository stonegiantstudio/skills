---
description: Audit and improve a site's visibility in search and AI answer engines (SEO, GEO, AEO). Use when asked to assess SEO/GEO/AEO, check AI-search / AI-Overview visibility, generate an optimization playbook, or track ranking and citation progress over time. Runs as `/stone-giant:seo-geo-aeo assess|playbook|track|competitors|compare|refresh <target>` and reads data from Google Search Console, GA4, Lighthouse, DataForSEO (pay-per-use SERP/backlinks/AI-mentions), Semrush, Ahrefs and more via API, MCP, or pasted screenshots. Methodology grounded in the GEO paper (KDD 2024), Google's AI-search guidance, and the primary sources in reference.md.
metadata:
  last_technique_review: "2026-06-25"
  technique_stale_after_days: "14"
---

# SEO / GEO / AEO

The whole game: **one body of work, two consumers, three surfaces.** Classic
search ranks *pages*; generative and answer engines cite *passages*. Both reward
the same substrate — crawlable, well-structured, genuinely authoritative content
— so you do not run three programs. You run one, and you **measure three
surfaces**: organic rank (SEO), citations inside AI answers (GEO), and
answer-box / featured presence (AEO).

Two rules keep this honest:

- **Evidence-ranked, not vibes.** The moves are quantified (see the ladder). Lead
  with what is measured; the field is full of confident tactics that do nothing.
- **Measure the surface, do not assume it.** Every number the skill reports is
  tagged **measured** (a tool produced it) or **estimated** (it was reasoned
  from the page). Never present an estimate as a fact. This is the discipline
  that makes multi-tool data trustworthy and progress-tracking real.

The credibility edge is **calibration**: Google's own guidance (2026) says AI
search is *still search* and that structured data and llms.txt are *not
required*; Ahrefs' server logs show 97% of llms.txt files are never fetched.
A skill that oversells those tactics is worse than useless. See "Honesty rails."

## Modes

Invoked as `/stone-giant:seo-geo-aeo <mode> <target>`, or triggered automatically when the
user asks about SEO / GEO / AEO / AI-search visibility. `<target>` is a URL, a
sitemap URL, or a local site/repo path.

| Mode | Does | Writes |
| --- | --- | --- |
| `assess` | Audit current state across 7 scored dimensions | a dated **scorecard** |
| `playbook` | Turn the scorecard's gaps into a prioritized, evidence-weighted plan | a **playbook** |
| `track` | Diff a fresh assessment against the last scorecard + open playbook items | updates **history** + playbook status |
| `competitors` | Discover the target's real SEO/GEO rivals (filtered, ranked), ready to feed `compare` | a dated **competitor list** |
| `compare` | Score the target **and** one or more competitor URLs on the same 7 dimensions, side by side | a dated **comparison** |
| `refresh` | Update *the skill's own knowledge* of the fast-moving GEO/AEO landscape | edits `reference.md` / `connectors/*` |
| `help` | Print the usage block below and stop | — |

`assess | playbook | track | competitors | compare` operate on a **target site**
and are **plan-only** — they audit, plan, and track; they never edit the site (or
the competitors'). Applying playbook items is a separate, explicit step the user
drives. `refresh` operates on the skill itself (see "Staying current").

The competitive loop is a pipeline: **`competitors` (discover) → `compare` (score
head-to-head) → `playbook` (turn beatable gaps into items).**

Routing: on `help` (or `--help`/`-h`), print the usage block and stop. With no
mode **and** no target, print the usage block, then offer to run `assess`. With
a bare target and no mode: no prior scorecard → `assess`; one present → offer
`track`.

**Target resolution (all modes).** `assess` takes an explicit `<url|path>`.
`playbook` and `track` operate on existing `docs/seo/` state and resolve the target
in this order: **explicit argument → the `target` in the latest `docs/seo/`
scorecard under the cwd git root → ask.** This is how `playbook`/`track` know which
repo's `docs/seo/` to read when the cwd is the *code* repo but the audited site is
elsewhere; never guess — if no scorecard and no argument, ask. **`competitors`** takes
the target the same way and needs no other argument. **`compare` needs a target plus
at least one competitor**; resolve competitors in this order: **explicit URL
arguments → the latest `docs/seo/competitors-<date>.md` → run `competitors` on the
fly → ask.** That is the pipe: `competitors` writes the list, `compare` consumes it.

### Usage (`help`)

```text
/stone-giant:seo-geo-aeo — audit & improve search + AI-answer visibility (SEO/GEO/AEO)

  /stone-giant:seo-geo-aeo assess <url|path>   Score current state → docs/seo/scorecard-<date>.md
  /stone-giant:seo-geo-aeo playbook            Prioritized, evidence-tiered plan from the latest
                                   scorecard (plan-only — never edits your site)
  /stone-giant:seo-geo-aeo track               Diff a fresh assessment vs the last scorecard;
                                   update playbook status + docs/seo/history.md
  /stone-giant:seo-geo-aeo competitors <url|path>
                                   Discover real rivals (filtered, ranked) →
                                   docs/seo/competitors-<date>.md (feeds compare)
  /stone-giant:seo-geo-aeo compare <target> [competitor…]
                                   Score the target and competitor URLs on the same
                                   7 dimensions → docs/seo/comparison-<date>.md
                                   (competitors default to the latest discovery list)
  /stone-giant:seo-geo-aeo refresh             Web-sweep the volatile GEO/AEO landscape and
                                   update the skill's own reference/connectors
  /stone-giant:seo-geo-aeo help                Show this help

Data sources: Google Search Console, GA4, Lighthouse, on-page parse, schema,
DataForSEO (pay-per-use — no subscription needed), Semrush, Ahrefs — read via
API → MCP → pasted screenshot (degrades gracefully). Every metric is tagged
measured vs estimated. Progress lives in docs/seo/.
```

## Establish provenance first — ask before assuming

**Step 0 — ask, do not assume.** Before scoring, tell the user which sources
would sharpen the assessment and **ask which they can provide credentials for.**
A source is "unavailable" only after the user has been asked and declined or
omitted it — *never* because a key did not happen to be in the environment
already. Silently downgrading a source the user could have supplied is a bug, not
graceful degradation. Present the list (GSC, GA4, PageSpeed, **DataForSEO**,
Semrush, Ahrefs, AI-visibility), note any already configured (see "Credentials &
setup"), and ask about the rest.

- **DataForSEO is the pay-per-use default for competitor, backlink, and
  AI-citation data** — it needs no Semrush/Ahrefs subscription (just a prepaid
  wallet, cents per call), so for users *without* those seats it is the recommended
  way to feed dimensions 4 and 6. Offer it first to subscription-less users;
  it does not replace Semrush/Ahrefs for those who already have them (use whichever
  key exists — see `connectors/dataforseo.md` for the two endpoints that need a
  $100/mo activation vs the pay-per-use core).
- **Set expectations on paid tools:** Semrush/Ahrefs are wired to **API/MCP only**;
  without a key the user can still paste a screenshot/export, but there is no
  silent fallback to scraping them. On-page signals and crawl data are always free
  (local parse — no key).

Then, for each dimension, determine *how* its data will arrive, in this
preference order — and **degrade gracefully**, never block:

1. **API** (ideal) — structured, dated, repeatable. The connector file names the
   endpoint + scope + its env var.
2. **MCP** — if a server for that tool is already connected, call it.
3. **Paste / screenshot / CSV export** — the connector file knows what each
   tool's key screen looks like and where the numbers sit, so a pasted image or
   export is parseable. This keeps every source usable with zero paid access.
4. **Reason from the page** — last resort; the value is tagged **estimated**.

Record provenance per metric: `{value, source, method: api|mcp|screenshot|manual|estimated, date}`.
`track` only ever diffs **same-source** series — it will not compare a Semrush
*estimated* position against a GSC *measured* one.

**Report grand totals, not summed top-N.** When a source exposes a property/grand
total (GSC clicks & impressions, GA4 sessions), query *that*, not the sum of a
top-N breakdown — a top-10 query sum silently omits the long tail and undercounts
(a real GSC run: top-10 sum = 19 impressions vs the true total of 938). Pull
breakdowns separately, with a high row limit, only when you need them.

### Credentials & setup (.env)

Credentials are read from **exact, documented environment variables** — set them
once in the target project's `.env` (git-ignored) or your shell; `.env.example`
in this skill lists every name. Standard names:

| Source | Variable(s) |
| --- | --- |
| Google Search Console | `GSC_PROPERTY`, and `GSC_ACCESS_TOKEN` *or* `GSC_SERVICE_ACCOUNT_JSON` (path) |
| Google Analytics 4 | `GA4_PROPERTY_ID`, and `GA4_ACCESS_TOKEN` *or* `GA4_SERVICE_ACCOUNT_JSON` (path) |
| PageSpeed Insights | `PAGESPEED_API_KEY` (lifts the small anonymous quota — see lighthouse connector) |
| DataForSEO | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` — one account ≈ SERP + keyword volume + competitor backlinks + LLM-mention/AI-Overview citations. Core is pay-per-use; **Backlinks API and LLM Mentions are optional add-ons that each need a $100/mo activation** — gate on it, fall back if absent (see the connector) |
| Semrush | `SEMRUSH_API_KEY` |
| Ahrefs | `AHREFS_API_TOKEN` |
| AI-visibility (optional) | `OTTERLY_API_KEY` |

**Security (non-negotiable).** Credentials live in env vars and **their values must
never enter the session.** Reference each var **by name** and let the shell expand
it *inside* the request command (`curl -u "$SEMRUSH_API_KEY:"`, `--header
"Authorization: Bearer $AHREFS_API_TOKEN"`), so the secret goes from the environment
straight to the tool and never appears in any command's output or context. Do **not**
`printenv`/`echo`/`cat` a value to inspect it — not even to "check" it. To confirm a
var is present, test existence only and print a boolean: `[ -n "${VAR:-}" ] && echo
set || echo unset`. Never list, dump, or grep the environment to *discover* keys, and
never `cat`/grep a `.env` to fish for them — that surfaces unrelated secrets. If a var
isn't in the shell, try running the request from a login shell (`zsh -lc '...'`) so it
inherits the user's exported env; if still unset, **ask the user** — do not go looking.
Never write a key's value into a scorecard.

Connector specifics live in `connectors/<tool>.md` (loaded on demand): Google
Search Console, GA4, Lighthouse/PageSpeed, on-page parse, and schema validation are
documented to full API+MCP+screenshot depth; DataForSEO, Semrush, Ahrefs, and
AI-visibility tools to API/MCP depth. On-page and schema are **free local parses**
(no key). `connectors/_template.md` is the shape for adding a new one.

## Phase 1 — Site discovery (before scoring)

**Never score a single landing page and call it a site audit.** A finding like
"missing About page" or "no FAQ content" is only credible *after* a crawl proves
the page genuinely isn't there. So `assess` discovers the site first, then scores
over the page map:

1. Fetch the target URL, then `/robots.txt` and `/sitemap.xml` (or the sitemap
   named in robots.txt). Respect robots directives.
2. Build a **page map** from nav, footer, and sitemap links (same-host only).
3. Pick the scope:
   - **`assess quick`** — homepage + up to ~6 highest-signal pages (services,
     pricing, about, a flagship blog post). The 30-second smoke test.
   - **`assess full`** (default) — all content pages; skip only legal, login, and
     thank-you/utility pages.
4. **Never mark a content type "missing" unless it's absent across the whole
   crawl.** Tie dim-2/3/4 findings to specific crawled URLs.
5. Record every visited page in the scorecard's `pages_audited` table (url, type,
   note) — this is what makes a "missing X" finding defensible and lets `track`
   diff coverage between runs.

The on-page pass (`connectors/on-page.md`) runs over this page map, so sitewide
patterns (duplicate titles, missing meta descriptions) surface instead of hiding
in a one-URL view.

## Grade bands (A–F, applied per dimension)

Letter grades must mean the same thing across runs, or `track` diffs are noise.
Anchor to observable thresholds where a metric exists; otherwise apply these bands:

| Grade | Score | Meaning |
| --- | --- | --- |
| **A** | 90–100 | Exemplary — measured-strong, no material gaps for this dimension |
| **B** | 75–89 | Strong — minor, low-effort gaps only |
| **C** | 60–74 | Adequate — several real gaps; partial coverage |
| **D** | 40–59 | Weak — major gaps; the dimension is underbuilt |
| **F** | 0–39 | Absent or actively harmful (signal missing, or e.g. AI bots blocked unintentionally, CWV poor) |

Anchor examples (prefer measured thresholds over vibes): **dim 1** A = all Core Web
Vitals "good" *and* no unintended crawl blocks; F = CWV poor *or* indexable pages
`noindex`'d / wanted AI bots blocked. **dim 6** A = brand cited across multiple
engines on its core queries; F = zero citations anywhere with competitors owning
them. When a dimension is scored from reasoning rather than a tool, the grade is
tagged **estimated** alongside its band.

## The 7 assess dimensions

Each is scored A–F (see "Grade bands") with located findings and per-metric
provenance. The connector(s) that can feed real data are noted; absent them, score
by reasoning and tag the result **estimated**.

> The inline *Feeds:* notes below are point-of-use pointers. The **authoritative
> source-of-truth for which connector feeds which dimension is each connector's own
> `feeds:` header** (`connectors/<tool>.md`); if the two ever disagree, the connector
> wins, and a newly added connector declares its `feeds:` there first. This keeps the
> mapping from drifting as connectors are added.

1. **Crawlability, technical & on-page** — robots.txt (including the major
   AI-crawler user-agents — GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
   CCBot, … — are you blocking the ones you want indexed?), sitemap health, status
   codes, render/hydration, Core Web Vitals / page experience, **and the classic
   on-page signals**: title tags (present/unique/length), meta descriptions,
   canonical + robots meta, H1 singularity, Open Graph/Twitter cards, image alt
   text, internal-link/anchor quality, and URL structure. *Feeds:
   Lighthouse/PageSpeed, GSC (coverage, CWV), **on-page parse**, Ahrefs Site Audit.*
2. **Content extractability** — front-loaded answers, clean heading hierarchy,
   **question-shaped headings** that mirror conversational queries, and
   lists/tables that chunk cleanly into a citable passage. This is the genuine
   core of "AEO." Score it as a procedural checklist of **located findings**:
   direct-answer paragraphs (40–60 words under a question heading), "X is…"
   definition patterns, list/table snippet eligibility, FAQ/HowTo eligibility
   (cross-ref dim 5 — weight as Tier 2/3, no schema hype), and a single clean H1
   per page. *Feeds: on-page parse.*
3. **Evidence density** — direct quotations, concrete statistics, and inline
   citations. The highest-leverage GEO levers (see the ladder); especially in
   fact-dense domains (health, law, finance).
4. **Entity & authority** — Organization/Author identity, `sameAs` links to
   Wikipedia/LinkedIn/Crunchbase, topical authority, E-E-A-T signals, and
   freshness (`dateModified`). **Look for E-E-A-T on the Phase-1 page map** — About,
   Team/author bios, Contact, consistent NAP (name/address/phone), testimonials —
   rather than asserting it from the homepage alone. Off-page authority (backlink
   rank, referring-domain count, anchor health, **competitor link gap**) is the
   part GSC can't show. *Feeds: DataForSEO Backlinks, Ahrefs, Semrush, on-page parse.*
5. **Structured data** — JSON-LD validity (FAQPage, HowTo, QAPage, Article,
   Organization). *Labeled honestly: helps SEO and non-Google engines, but
   **Google does not require it** for AI features.* *Feeds: schema validator.*
6. **AI-surface presence** — is the brand/page actually cited in ChatGPT,
   Perplexity, Google AI Overviews/AI Mode, Claude? Default to the manual
   citation protocol in `connectors/ai-visibility.md` (prompts to run + record);
   an API hook is optional. *Feeds (optional): DataForSEO **LLM Mentions** for
   indexed brand citations + competitor share-of-voice across Google AI Overviews
   & ChatGPT, and **LLM Responses** for Perplexity/Gemini/Claude.*
7. **llms.txt** — present and well-formed? *Labeled **low-confidence**: cheap to
   add, but 97% are never fetched and no major provider commits to it.* Never
   ranked above dimensions 1–4.

## The prioritization ladder (evidence × reach ÷ effort)

`playbook` orders gaps by leverage. Lead with high-evidence, high-reach,
low-effort moves; defer speculative ones. Each play carries an **evidence tier**
so the user never over-invests in the unproven.

**Tier 1 — evidence-backed** (the GEO paper, KDD 2024, measured tactic lift in
**Position-Adjusted Word Count (PAWC)** over the GEO-Bench query set; headline
"up to 40%" visibility). The paper's top-performing levers — quotations,
statistics, and cited sources — each land a **30–40% relative improvement** on
PAWC; numbers below are approximate (verify exact rows against the paper's
Table 1):

1. **Add direct quotations** from authoritative sources — the **single strongest
   lever** (~+40%).
2. **Add statistics / concrete numbers** to claims — a top-three lever (~+30–35%).
3. **Cite credible sources** inline — a top-three lever (~+30%).
4. **Improve fluency / clarity** of the prose — strong (~+30%).
5. **Do NOT keyword-stuff** — it measurably *hurts* generative visibility (~−8%).
   The clean break from classic SEO instinct.
6. **Domain-tailor:** quote/stat/cite tactics dominate in fact-dense domains;
   weight them there.

**Tier 2 — structurally sound** (recurs across Google, AEO guides, toolkits;
strong reasoning, lighter quantification): front-load answers; question-shaped
headings; clean chunkable structure; entity clarity (`sameAs`); first-hand,
non-commodity content; crawlability for AI bots.

**Tier 3 — plausible / unproven** (do only when cheap, never lead with):
JSON-LD for AI features (helps elsewhere; not required by Google), `llms.txt`,
chasing inauthentic mentions.

A Tier-3 play never outranks a Tier-1/2 play in the playbook. When two plays tie
on tier, break by reach (pages affected) ÷ effort.

### Winnability — check who owns the SERP before targeting a keyword

A high-volume term you rank #50 for is worthless if encyclopedic authorities
(Wikipedia, RSC, gov) own page 1 — that's effort you can't convert. Before
committing a keyword to the playbook, judge **winnability**: run a competitor
keyword-gap (see `connectors/dataforseo.md`) or a SERP-ownership check, and
prioritize terms where the page-1 set is **beatable** *and* matches your content
type. Two cautions, both learned in practice:

- **Gap only against topically-focused competitors.** A gap against high-overlap
  *generalists* returns their whole catalog, not relevant opportunities.
- **The most actionable gaps are mid-volume, niche-relevant terms you have an
  asset for but don't rank.** (Real find: a site ranked nowhere for "interactive
  periodic table" despite *having* an interactive periodic table — pure on-page
  upside.) Mega head-terms owned by authorities are aspirational, not targets.

## Mode details & artifacts

State lives in the **target repo** under `docs/seo/` (visible, reviewable in PRs):

```
docs/seo/
  scorecard-YYYY-MM-DD.md   # one per assess run; frontmatter = machine-readable scores
  playbook.md               # living plan; items have stable IDs + status
  history.md                # append-only trend log, one row per assess
  competitors-YYYY-MM-DD.md # one per competitors run; ranked, filtered rival list
  comparison-YYYY-MM-DD.md  # one per compare run; target vs competitors, side by side
```

- **`assess`** → writes `scorecard-<date>.md`. Frontmatter carries
  `schema_version`, the target, each dimension's grade + score, and per-metric
  provenance, so later diffs are exact. Body holds located findings.
- **`playbook`** → reads the latest scorecard, writes/updates `playbook.md`:
  ordered items, each with a stable ID, the tier + basis (cite the source), the
  pages affected, the concrete change, the expected signal, and how to verify.
  Plan-only — it never edits the site.
- **`track`** → runs a fresh `assess` (or reads a fresh scorecard), diffs
  same-source series against the prior scorecard, marks playbook items
  done/in-progress/stale, appends a `history.md` row, and names the next-best
  move. Closes the loop: assess → playbook → (user applies) → track.
- **`competitors`** → discovers, filters, and ranks the target's real rivals and
  writes `competitors-<date>.md` (see "Competitor discovery mode"). Plan-only.
  Contract: `artifacts/competitors.example.md`. Feeds `compare`.
- **`compare`** → scores the target and each competitor URL on the same 7
  dimensions and writes `comparison-<date>.md` (see "Compare mode"). Plan-only —
  it never edits any site. Contract: `artifacts/comparison.example.md`.
- **`refresh`** → see "Staying current."

`schema_version` in the scorecard frontmatter lets `track` migrate older
scorecards; prefer additive changes so old runs stay diffable.

### Artifact schemas (copy the shape — don't improvise)

Two agents must produce **compatible** artifacts or `track` diffs turn to noise.
The contracts are defined by example, in this skill's `artifacts/`:

- **`artifacts/scorecard.example.md`** — the scorecard frontmatter schema
  (`schema_version`, `target`, `date`, `mode`, `overall`, a **`pages_audited`**
  table, and per-dimension `grade`/`score`/`metrics[]` where each metric carries
  `{key, value, source, method, date}` provenance). Copy it verbatim and fill in.
- **`artifacts/playbook.example.md`** — the playbook item schema (**stable `id`**,
  `dimension`, `tier`, `basis`, `pages`, `change`, `expected_signal`, `verify`,
  `effort`, `status` enum). Never renumber an `id` — `track` keys off it.
- **`history.md` row** — append one Markdown-table row per assess:
  `| date | overall grade | overall score | per-dim grades (1–7) | note |`.
  Append-only; never rewrite past rows.
- **`artifacts/competitors.example.md`** — the `competitors` output: a ranked
  `competitors` list (class, winnable flag, signals, overlap) plus an `excluded`
  list recording *why* each generalist was dropped. `compare` reads the latest one.
- **`artifacts/comparison.example.md`** — the `compare` output: a per-dimension
  `matrix` (target + each competitor) and a `beatable_gaps` list. Competitor cells
  use public/third-party sources only (no GSC/GA4).

These examples live in the skill, not the target repo. On `assess`/`playbook`, read
the relevant example, then write the real artifact into the target's `docs/seo/`.

## Competitor discovery mode (find rivals to compare)

`competitors <target>` finds the target's **real** SEO/GEO rivals, filters out the
noise, ranks them, and writes `competitors-<date>.md` — the input `compare`
consumes. The hard part isn't finding candidates; it's **discarding the ones that
aren't competitors**, a lesson the keyword-gap method already learned the hard way.

**Procedure:**

1. **Multi-signal discovery (use whichever connector keys exist; blend the signals).**
   Each angle is blind to what the others surface, so combine them:
   - **Keyword overlap** — DataForSEO `dataforseo_labs/google/competitors_domain`
     (or Semrush/Ahrefs competitor finders). Domains ranking for the same terms.
   - **Shared backlinks** — DataForSEO `backlinks/competitors`. Sites with
     overlapping referring-domain profiles. **Weight this signal below keyword
     overlap for *offering* peers:** it skews to high-authority publishers and
     marketplaces that link to everyone (a real run surfaced Forbes, HBR, Indeed,
     even `esa.int` as top "competitors"). It's better at finding who shares your
     *link sources* than who shares your *business*.
   - **SERP co-occurrence** — `serp_competitors` with the target's core keywords,
     **or the free fallback**: take the target's top queries (from GSC if available,
     else its own keywords), run each SERP, and collect the domains that recur on
     page 1. Works even on tiny/new sites where finders return nothing.
2. **Filter the generalists out (non-negotiable).** High-overlap *generalists*
   co-occur with everyone and are **not** competitors. Drop, by class:
   - **Encyclopedic / reference:** Wikipedia, `.gov`, `.edu`, ThoughtCo, Quora.
   - **Business publications:** Forbes, HBR, Entrepreneur, Inc, Medium — they rank
     for and link to every niche (all surfaced in a real run; none are peers).
   - **Social / UGC / platforms:** Reddit, YouTube, Pinterest, Facebook, Spotify,
     Steam, site-builders (Weebly).
   - **Marketplaces / aggregators:** Indeed, ZipRecruiter, Amazon.
   - **Name-collision domains:** different business sharing a brand token
     (`projectkampfire.com` vs `projectcampfire.io`) — same name, unrelated; drop.

   Then apply a **niche keyword filter** (a regex of the target's topic terms) so
   only topically-relevant domains survive. **Log every exclusion with a reason** so
   the cut is auditable (see `artifacts/competitors.example.md`).
3. **Classify each survivor:** **direct** (same offering/business) vs **content**
   (ranks for your topics, different business) — both are valid `compare` targets,
   but label them.
4. **Rank by relevance × winnability.** Relevance = overlap depth + topical fit;
   winnability = is the page-1 set *beatable* (a peer you can out-rank) vs an
   authority you can't. Mark unbeatable authorities **aspirational**, not targets
   (same rule as the prioritization ladder's Winnability check).
5. **Output** (`artifacts/competitors.example.md` is the contract): a ranked list,
   each with the discovery signal(s) that surfaced it, direct/content class,
   winnable/aspirational flag, and a one-line "why." Then **offer to pipe the top N
   straight into `compare`** — that's the loop.

Provenance: competitor sets are third-party/estimated (DataForSEO/Semrush/Ahrefs or
SERP-derived); tag them so, and never present a discovered competitor as a measured
fact about the target.

## Compare mode (target vs competitors)

`compare <target> <competitor…>` scores the target **and** each competitor on the
same 7 dimensions and writes a side-by-side `comparison-<date>.md`. It answers
"where do rivals beat us, and which gaps are worth closing?" — turning the
competitor data the connectors already expose into a ranked head-to-head.

**Procedure:**

1. **Crawl each site** through Phase 1 (target + every competitor) — own page map
   per site. Same scope rule: `quick` (homepage + ≤6 pages) or `full`.
2. **Score the 7 dimensions per site**, reusing the assess logic and grade bands.
3. **Lean on the competitor-native connectors** — these are the comparison's spine
   and the part the free stack can't do:
   - **Authority:** DataForSEO `bulk_ranks` / `bulk_referring_domains` across all
     sites in one call (dim 4).
   - **Link gap:** `domain_intersection` — who links to rivals but not the target.
   - **AI share-of-voice:** LLM Mentions `cross_aggregated_metrics` — mention counts
     per site on the same query universe (dim 6).
   - **Keyword gap + winnability:** the methods in `connectors/dataforseo.md`.
4. **Provenance asymmetry — handle it honestly (this is the discipline, not a bug).**
   Owned-only sources (**GSC, GA4**) exist for the target but **never for
   competitors**. So competitor dimension scores draw on **public/third-party
   sources only** (on-page parse, Lighthouse, DataForSEO, schema) and are tagged
   accordingly. **Never compare the target's *measured* GSC figure against a
   competitor's *estimated* one** — compare same-source rows (e.g. Lighthouse LCP vs
   Lighthouse LCP, DataForSEO rank vs DataForSEO rank). Where only the target has a
   source, mark the competitor cell `n/a (owned-only source)`, don't fabricate it.
5. **Output** (`artifacts/comparison.example.md` is the contract): a grade matrix
   (rows = 7 dimensions, columns = target + each competitor), the head-to-head
   **deltas** where a competitor leads, and a short **"biggest beatable gaps"**
   list — winnable dimensions where a competitor is ahead — which feeds straight
   into `playbook`. Plan-only; it never edits any site.

## Honesty rails (calibration)

Bake these into every assessment and playbook — they are the differentiator:

- **Google (2026): AI search is still search.** No AI-specific files or markup
  are required; structured data is *not required* for AI Overviews/AI Mode;
  there is no ideal content length. Optimizing for AI ≈ doing SEO well.
- **llms.txt is low-confidence.** 97% never fetched (Ahrefs server logs); no
  major provider commits to crawling it; one Google voice likened it to the
  dead keywords meta tag. Present it as cheap-and-optional, never a silver
  bullet.
- **Schema's real value is SEO + non-Google engines**, not Google AI features.
- **Vendor "Nx citation lift" figures are not independently verified.** Cite the
  GEO paper's measured numbers; flag vendor claims as vendor claims.

## Staying current (`refresh`)

GEO/AEO moves monthly; this skill must not rot. Knowledge is split by decay rate:

- **Durable** (rarely changes): the GEO-paper tactic hierarchy, extractability
  principles, the provenance discipline. `refresh` leaves these alone.
- **Volatile** (the refresh target): the answer-engine roster, Google/Bing's
  stated stance, the research frontier, connector APIs/MCP names, llms.txt
  adoption signals.

On `assess`/`track`, if `last_technique_review` is older than
`technique_stale_after_days`, **suggest** a refresh. `refresh` runs a scoped web
sweep over this **volatile-surfaces checklist**, updates `reference.md` /
`connectors/*`, and bumps the date:

1. New or updated GEO/AEO research (arXiv, KDD/ICLR/WWW) superseding the tactic numbers?
2. Google / Bing AI-search guidance changed?
3. New answer engine to add to dimension 6, or a defunct one to drop?
4. Connector API or MCP tool-name changes (per `connectors/*` `last_verified`)?
5. llms.txt adoption — any shift in real provider support?

`refresh` only edits the volatile layer, **cites the source for every changed
claim**, and produces a reviewable diff. An automated/scheduled refresh must open
a **human-reviewed PR** — never auto-merge a knowledge change.

**Run-context guard (do this before `refresh` edits anything).** `refresh` writes
to `reference.md` / `connectors/*` — but only the skill's **source repo** should be
edited; in a consumer install those files are plugin copies that get overwritten on
the next update. Detect which you're in:

1. `realpath` this `SKILL.md` (dereference symlinks — some users symlink a dev
   checkout into `~/.claude/plugins/`).
2. `git rev-parse --show-toplevel` for the cwd git root; `realpath` it too.
3. **Source-repo mode** — `SKILL.md`'s realpath is inside the cwd git root: edits
   persist to source control; proceed (edit `skills/` source, then run the sync).
4. **Consumer-repo mode** (the safe default — any of: SKILL.md outside the git root,
   cwd not a git repo, or the check errored): **do not edit the installed files.**
   Surface the findings and the upstream repo URL (from the plugin manifest) so the
   user can land the update there. When in doubt, treat the skill as read-only.

## Reference

`reference.md` holds the primary sources behind every claim above (GEO paper,
Google's AI-optimization guide, Ahrefs' llms.txt data, the llms.txt spec,
follow-on literature, tool docs), with a "verify before quoting as first-party"
caveat. `connectors/*.md` hold the per-tool operational knowledge.
