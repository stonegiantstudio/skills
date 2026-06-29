---
# === Comparison contract (copy this shape) ================================
# One file per `compare` run, written to the TARGET repo at
# docs/seo/comparison-YYYY-MM-DD.md. Scores the target + competitors on the same
# 7 dimensions. Frontmatter is the machine-readable matrix; body holds the
# head-to-head read. Competitor cells use ONLY public/third-party sources —
# owned-only sources (GSC, GA4) are n/a for competitors (see Compare mode).
schema_version: 1
date: 2026-06-29
mode: quick                       # quick (homepage + ≤6 pages each) | full
target: https://example.com
competitors:
  - https://rival-a.com
  - https://rival-b.com

# Per-dimension grade/score for each site. method/source provenance is recorded
# in each site's own scorecard; here we carry the comparable grade + score only.
# Competitor scores never use owned-only sources (GSC/GA4) — see `notes`.
matrix:
  - dim: 1   # crawlability_technical
    target:   { grade: B, score: 78 }
    rival-a:  { grade: A, score: 91 }
    rival-b:  { grade: C, score: 64 }
    notes: "Lighthouse-vs-Lighthouse (same source). Target LCP 2.9s > rival-a 1.8s."
  - dim: 4   # entity_authority
    target:   { grade: D, score: 45 }
    rival-a:  { grade: B, score: 80 }
    rival-b:  { grade: C, score: 58 }
    notes: "DataForSEO bulk_ranks/referring_domains (same source across all three)."
  - dim: 6   # ai_surface_presence
    target:   { grade: D, score: 40 }
    rival-a:  { grade: B, score: 82 }
    rival-b:  { grade: D, score: 38 }
    notes: "LLM Mentions cross_aggregated: rival-a owns 6x the AIO citations."

# Winnable dimensions where a competitor leads — the feed into `playbook`.
beatable_gaps:
  - { dim: 1, behind: rival-a, gap: "LCP 2.9s vs 1.8s", winnable: true,  why: "pure CWV fix, on-page" }
  - { dim: 4, behind: rival-a, gap: "45 vs 80 authority", winnable: true,  why: "link gap shows 12 reachable domains" }
  - { dim: 6, behind: rival-a, gap: "40 vs 82 AI SoV",    winnable: true,  why: "follows from dim 3/4 gains" }
# ==========================================================================
---

# Comparison — example.com vs rival-a.com, rival-b.com — 2026-06-29

**Read:** rival-a is ahead on authority (dim 4) and AI presence (dim 6) and edges
us on CWV (dim 1); rival-b is beatable across the board. The biggest *winnable*
gap is dim 4 — the DataForSEO link gap surfaces 12 domains already linking rival-a
that the target could reach.

## Grade matrix

| Dimension | example.com | rival-a | rival-b |
| --- | --- | --- | --- |
| 1 Crawl/technical/on-page | B (78) | **A (91)** | C (64) |
| 2 Extractability | C (60) | B (75) | C (62) |
| 3 Evidence density | B (80) | B (78) | D (44) |
| 4 Entity & authority | D (45) | **B (80)** | C (58) |
| 5 Structured data | C (55) | C (57) | D (40) |
| 6 AI-surface presence | D (40) | **B (82)** | D (38) |
| 7 llms.txt | F (0) | F (0) | F (0) |

*Bold = a competitor materially leads the target. Cells compare same-source rows
only; owned-only signals (GSC/GA4) are excluded from competitor columns.*

## Biggest beatable gaps (→ playbook)

1. **Dim 4 authority — behind rival-a (45 vs 80).** Pursue the link-gap domains.
2. **Dim 1 LCP — behind rival-a (2.9s vs 1.8s).** Pure on-page CWV fix.
3. **Dim 6 AI presence — behind rival-a (40 vs 82).** Downstream of dim 3/4 gains.

> Plan-only. Hand these to `playbook` to turn into tiered, verifiable items.
> The **frontmatter `matrix` + `beatable_gaps` are the contract.**
