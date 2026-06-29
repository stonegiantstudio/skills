---
# === Competitors contract (copy this shape) ===============================
# One file per `competitors` run, written to the TARGET repo at
# docs/seo/competitors-YYYY-MM-DD.md. Ranked, filtered rival list that `compare`
# consumes (it reads the latest of these when no competitor URL is passed).
# Competitor sets are third-party/estimated (DataForSEO/Semrush/Ahrefs/SERP).
schema_version: 1
date: 2026-06-29
target: https://example.com
# Which discovery signals ran (depends on which keys exist).
signals_used: [keyword_overlap, shared_backlinks, serp_cooccurrence]
niche_filter: "executive assistant|staffing|recruiting|EA hiring"   # the topic regex

# Ranked best-first. class ∈ direct|content. winnable ∈ true|false (false = aspirational).
# signals = which discovery angle(s) surfaced it. overlap = relative strength 0–100.
competitors:
  - { domain: rival-a.com,   class: direct,  winnable: true,  overlap: 88,
      signals: [keyword_overlap, shared_backlinks, serp_cooccurrence],
      why: "same EA-staffing offering; ranks p1 for core terms; beatable authority" }
  - { domain: rival-b.com,   class: direct,  winnable: true,  overlap: 71,
      signals: [keyword_overlap, serp_cooccurrence],
      why: "smaller regional peer; out-rankable with on-page work" }
  - { domain: boldly.com,    class: content, winnable: false, overlap: 64,
      signals: [keyword_overlap, serp_cooccurrence],
      why: "ranks our topics but bigger brand — aspirational, not a near-term target" }

# Dropped as not-real-competitors (record WHY, so the filter is auditable and a
# reviewer can see nothing useful was silently cut).
excluded:
  - { domain: indeed.com,    reason: "marketplace generalist — co-occurs with everyone" }
  - { domain: reddit.com,    reason: "generalist forum" }
  - { domain: en.wikipedia.org, reason: "encyclopedic authority" }
# ==========================================================================
---

# Competitors — example.com — 2026-06-29

Discovery: keyword overlap + shared backlinks + SERP co-occurrence, filtered to the
niche (`executive assistant|staffing|recruiting`). 3 real rivals kept, 3 generalists
dropped (logged in `excluded`).

| # | Domain | Class | Winnable | Overlap | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | rival-a.com | direct | yes | 88 | Same offering; p1 on core terms; beatable |
| 2 | rival-b.com | direct | yes | 71 | Regional peer; out-rankable on-page |
| 3 | boldly.com | content | aspirational | 64 | Ranks our topics; bigger brand |

**Dropped (not competitors):** indeed.com, reddit.com, en.wikipedia.org — high
co-occurrence, zero head-to-head value.

> Next: `compare example.com rival-a.com rival-b.com` (top winnable rivals), or let
> `compare` read this file automatically. The **frontmatter `competitors` list is
> the contract** `compare` consumes.
