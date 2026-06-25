---
name: seo-geo-aeo
description: Audit and improve a site's visibility in search and AI answer engines (SEO, GEO, AEO). Use when asked to assess SEO/GEO/AEO, check AI-search / AI-Overview visibility, generate an optimization playbook, or track ranking and citation progress over time. Runs as `/seo-geo-aeo assess|playbook|track|refresh <target>` and reads data from Google Search Console, GA4, Lighthouse, Semrush, Ahrefs and more via API, MCP, or pasted screenshots. Methodology grounded in the GEO paper (KDD 2024), Google's AI-search guidance, and the primary sources in reference.md.
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

Invoked as `/seo-geo-aeo <mode> <target>`, or triggered automatically when the
user asks about SEO / GEO / AEO / AI-search visibility. `<target>` is a URL, a
sitemap URL, or a local site/repo path.

| Mode | Does | Writes |
| --- | --- | --- |
| `assess` | Audit current state across 7 scored dimensions | a dated **scorecard** |
| `playbook` | Turn the scorecard's gaps into a prioritized, evidence-weighted plan | a **playbook** |
| `track` | Diff a fresh assessment against the last scorecard + open playbook items | updates **history** + playbook status |
| `refresh` | Update *the skill's own knowledge* of the fast-moving GEO/AEO landscape | edits `reference.md` / `connectors/*` |
| `help` | Print the usage block below and stop | — |

`assess | playbook | track` operate on a **target site** and are **plan-only** —
they audit, plan, and track; they never edit the site. Applying playbook items
is a separate, explicit step the user drives. `refresh` operates on the skill
itself (see "Staying current").

Routing: on `help` (or `--help`/`-h`), print the usage block and stop. With no
mode **and** no target, print the usage block, then offer to run `assess`. With
a bare target and no mode: no prior scorecard → `assess`; one present → offer
`track`.

### Usage (`help`)

```text
/seo-geo-aeo — audit & improve search + AI-answer visibility (SEO/GEO/AEO)

  /seo-geo-aeo assess <url|path>   Score current state → docs/seo/scorecard-<date>.md
  /seo-geo-aeo playbook            Prioritized, evidence-tiered plan from the latest
                                   scorecard (plan-only — never edits your site)
  /seo-geo-aeo track               Diff a fresh assessment vs the last scorecard;
                                   update playbook status + docs/seo/history.md
  /seo-geo-aeo refresh             Web-sweep the volatile GEO/AEO landscape and
                                   update the skill's own reference/connectors
  /seo-geo-aeo help                Show this help

Data sources: Google Search Console, GA4, Lighthouse, schema, Semrush, Ahrefs —
read via API → MCP → pasted screenshot (degrades gracefully). Every metric is
tagged measured vs estimated. Progress lives in docs/seo/.
```

## Establish provenance first — ask before assuming

**Step 0 — ask, do not assume.** Before scoring, tell the user which sources
would sharpen the assessment and **ask which they can provide credentials for.**
A source is "unavailable" only after the user has been asked and declined or
omitted it — *never* because a key did not happen to be in the environment
already. Silently downgrading a source the user could have supplied is a bug, not
graceful degradation. Present the list (GSC, GA4, PageSpeed, Semrush, Ahrefs,
AI-visibility), note any already configured (see "Credentials & setup"), and ask
about the rest.

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

### Credentials & setup (.env)

Credentials are read from **exact, documented environment variables** — set them
once in the target project's `.env` (git-ignored) or your shell; `.env.example`
in this skill lists every name. Standard names:

| Source | Variable(s) |
| --- | --- |
| Google Search Console | `GSC_PROPERTY`, and `GSC_ACCESS_TOKEN` *or* `GSC_SERVICE_ACCOUNT_JSON` (path) |
| Google Analytics 4 | `GA4_PROPERTY_ID`, and `GA4_ACCESS_TOKEN` *or* `GA4_SERVICE_ACCOUNT_JSON` (path) |
| PageSpeed Insights | `PAGESPEED_API_KEY` (lifts the small anonymous quota — see lighthouse connector) |
| Semrush | `SEMRUSH_API_KEY` |
| Ahrefs | `AHREFS_API_TOKEN` |
| AI-visibility (optional) | `OTTERLY_API_KEY` |

**Security (non-negotiable).** Read each credential only by its **exact name**
(e.g. `printenv SEMRUSH_API_KEY`). Never list, dump, or grep the environment to
*discover* keys, and never `cat`/grep a `.env` to fish for them — that surfaces
unrelated secrets. If a documented var is unset, **ask the user** (they may
export it, add it to `.env`, or paste data instead); do not go looking. Never
echo a key's value or write it into a scorecard.

Connector specifics live in `connectors/<tool>.md` (loaded on demand): Google
Search Console, GA4, Lighthouse/PageSpeed, schema validation are documented to
full API+MCP+screenshot depth; Semrush, Ahrefs, and AI-visibility tools to
API/MCP depth. `connectors/_template.md` is the shape for adding a new one.

## The 7 assess dimensions

Each is scored A–F with located findings and per-metric provenance. The
connector(s) that can feed real data are noted; absent them, score by reasoning
and tag the result **estimated**.

1. **Crawlability & technical** — robots.txt (including the major AI-crawler
   user-agents — GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, … —
   are you blocking the ones you want indexed?), sitemap health, status codes,
   render/hydration, and Core Web Vitals / page experience.
   *Feeds: Lighthouse/PageSpeed, GSC (coverage, CWV), Ahrefs Site Audit.*
2. **Content extractability** — front-loaded answers, clean heading hierarchy,
   **question-shaped headings** that mirror conversational queries, and
   lists/tables that chunk cleanly into a citable passage. This is the genuine
   core of "AEO."
3. **Evidence density** — direct quotations, concrete statistics, and inline
   citations. The highest-leverage GEO levers (see the ladder); especially in
   fact-dense domains (health, law, finance).
4. **Entity & authority** — Organization/Author identity, `sameAs` links to
   Wikipedia/LinkedIn/Crunchbase, topical authority, E-E-A-T signals, and
   freshness (`dateModified`).
5. **Structured data** — JSON-LD validity (FAQPage, HowTo, QAPage, Article,
   Organization). *Labeled honestly: helps SEO and non-Google engines, but
   **Google does not require it** for AI features.* *Feeds: schema validator.*
6. **AI-surface presence** — is the brand/page actually cited in ChatGPT,
   Perplexity, Google AI Overviews/AI Mode, Claude? Default to the manual
   citation protocol in `connectors/ai-visibility.md` (prompts to run + record);
   an API hook is optional.
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

## Mode details & artifacts

State lives in the **target repo** under `docs/seo/` (visible, reviewable in PRs):

```
docs/seo/
  scorecard-YYYY-MM-DD.md   # one per assess run; frontmatter = machine-readable scores
  playbook.md               # living plan; items have stable IDs + status
  history.md                # append-only trend log, one row per assess
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
- **`refresh`** → see "Staying current."

`schema_version` in the scorecard frontmatter lets `track` migrate older
scorecards; prefer additive changes so old runs stay diffable.

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

## Reference

`reference.md` holds the primary sources behind every claim above (GEO paper,
Google's AI-optimization guide, Ahrefs' llms.txt data, the llms.txt spec,
follow-on literature, tool docs), with a "verify before quoting as first-party"
caveat. `connectors/*.md` hold the per-tool operational knowledge.
