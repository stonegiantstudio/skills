---
# === Scorecard contract (copy this shape) =================================
# One file per `assess` run, written to the TARGET repo at
# docs/seo/scorecard-YYYY-MM-DD.md. Frontmatter is the machine-readable source
# of truth that `track` diffs; the body holds located, human-readable findings.
schema_version: 1
target: https://example.com
date: 2026-06-29
mode: full                      # quick (homepage + ≤6 pages) | full (all content pages)
overall: { grade: C, score: 62 }

# Every page the crawl actually visited — so a "missing X" finding is credible
# and `track` can diff coverage. type ∈ home|service|product|blog|about|contact|faq|other
pages_audited:
  - { url: /,                type: home,    notes: "H1 ok; meta description missing" }
  - { url: /services,        type: service, notes: "thin; no question-shaped headings" }
  - { url: /about,           type: about,   notes: "team present; no sameAs links" }
  - { url: /blog/guide,      type: blog,    notes: "strong evidence density" }

# One block per dimension (1–7). grade A–F + score 0–100 (see Grade bands in
# SKILL.md). metrics carry per-value provenance so `track` only diffs same-source.
# method ∈ api|mcp|screenshot|manual|estimated
dimensions:
  - id: 1
    name: crawlability_technical
    grade: B
    score: 78
    metrics:
      - { key: lcp_ms,            value: 2900, source: lighthouse, method: api,       date: 2026-06-29 }
      - { key: ai_bots_blocked,   value: 0,    source: robots_txt, method: api,       date: 2026-06-29 }
      - { key: titles_unique_pct, value: 75,   source: on-page,    method: api,       date: 2026-06-29 }
  - id: 2
    name: content_extractability
    grade: C
    score: 60
    metrics:
      - { key: question_headings, value: 2,    source: on-page,    method: api,       date: 2026-06-29 }
      - { key: direct_answer_paras, value: 1,  source: on-page,    method: estimated, date: 2026-06-29 }
  - id: 3
    name: evidence_density
    grade: B
    score: 80
    metrics:
      - { key: inline_citations,  value: 9,    source: on-page,    method: api,       date: 2026-06-29 }
  - id: 4
    name: entity_authority
    grade: D
    score: 45
    metrics:
      - { key: referring_domains, value: 12,   source: dataforseo, method: api,       date: 2026-06-29 }
      - { key: backlinks_spam,    value: 22,   source: dataforseo, method: api,       date: 2026-06-29 }
      - { key: sameas_links,      value: 0,    source: on-page,    method: api,       date: 2026-06-29 }
  - id: 5
    name: structured_data
    grade: C
    score: 55
    metrics:
      - { key: jsonld_types,      value: ["Organization"], source: schema, method: api, date: 2026-06-29 }
  - id: 6
    name: ai_surface_presence
    grade: D
    score: 40
    metrics:
      - { key: aio_mentions,      value: 3,    source: dataforseo, method: api,       date: 2026-06-29 }
      - { key: chatgpt_mentions,  value: 0,    source: dataforseo, method: api,       date: 2026-06-29 }
  - id: 7
    name: llms_txt
    grade: F
    score: 0
    metrics:
      - { key: present,           value: false, source: fetch,     method: api,       date: 2026-06-29 }
# ==========================================================================
---

# Scorecard — example.com — 2026-06-29

**Overall: C (62/100).** Solid technical base and evidence density; the gaps are
off-page authority (dim 4) and AI-surface presence (dim 6), plus on-page hygiene
(missing meta descriptions, only one H1-level question heading).

## Findings by dimension

### 1. Crawlability & technical — B (78)
- **`/` and `/services`: missing `<meta name="description">`** *(measured, on-page)* —
  3 of 4 crawled pages have unique titles; two lack a meta description entirely.
- AI crawlers (GPTBot, ClaudeBot, …) are **not** blocked in robots.txt *(measured)*.
- LCP 2.9 s on mobile *(measured, Lighthouse)* — just over the 2.5 s "good" line.

### 2. Content extractability — C (60)
- Only `/blog/guide` front-loads a direct answer; `/services` buries it *(estimated)*.
- Few question-shaped headings; see playbook item `EXT-1`.

### 4. Entity & authority — D (45)
- 12 referring domains, spam score 22 *(measured, DataForSEO)* — thin but clean.
- **No `sameAs` links** to Wikipedia/LinkedIn/Crunchbase on `/about` *(measured)*.

### 6. AI-surface presence — D (40)
- 3 Google AI-Overview mentions, 0 ChatGPT *(measured, DataForSEO LLM Mentions)* —
  competitors own the citations for the brand's core queries.

> Body is illustrative and trimmed. A real scorecard lists located findings for
> every scored dimension. The **frontmatter above is the contract** `track` reads.
