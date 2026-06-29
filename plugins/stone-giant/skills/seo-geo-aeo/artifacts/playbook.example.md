---
# === Playbook contract (copy this shape) ==================================
# One living file per target, written to docs/seo/playbook.md. Items have STABLE
# ids (never renumber — `track` keys off them) and a status enum. Ordered by the
# prioritization ladder (tier, then reach ÷ effort). `track` updates status and
# appends evidence; it never rewrites an item's id.
schema_version: 1
target: https://example.com
updated: 2026-06-29
source_scorecard: scorecard-2026-06-29.md   # the assess run this plan derives from

# status ∈ open | in_progress | done | stale (no longer relevant) | wont_do
# tier   ∈ 1 (evidence-backed) | 2 (structurally sound) | 3 (plausible/unproven)
# effort ∈ S | M | L
items:
  - id: EVD-1
    title: Add 2–3 cited statistics to the /services page
    dimension: 3
    tier: 1
    basis: "GEO paper (KDD 2024) — statistics ≈ +30–35% PAWC"
    pages: [/services]
    change: "Replace vague claims with sourced numbers; cite the source inline."
    expected_signal: "AI-Overview citation eligibility on service-category queries"
    verify: "track dim 6 aio_mentions; re-run LLM Mentions search for the brand"
    effort: S
    status: open
  - id: ENT-1
    title: Add sameAs links + Organization schema to /about
    dimension: 4
    tier: 2
    basis: "Entity clarity recurs across Google + AEO guidance"
    pages: [/about]
    change: "Link LinkedIn/Crunchbase; emit Organization JSON-LD with sameAs."
    expected_signal: "Entity disambiguation; dim 4 + dim 5 grade lift"
    verify: "schema validator shows Organization+sameAs; track dim 4"
    effort: S
    status: open
  - id: EXT-1
    title: Front-load a 40–60 word answer under question-shaped H2s
    dimension: 2
    tier: 2
    basis: "Extractability — answer engines cite self-contained passages"
    pages: [/services, /blog/guide]
    change: "Lead each section with the direct answer, then elaborate."
    expected_signal: "Featured-snippet / AI-answer passage selection"
    verify: "manual SERP snippet check; track dim 2"
    effort: M
    status: open
  - id: LNK-1
    title: Pursue 3 link prospects from the competitor link gap
    dimension: 4
    tier: 2
    basis: "DataForSEO domain_intersection — domains linking rivals, not us"
    pages: []
    change: "Outreach to the 3 highest-rank gap domains with a relevant asset."
    expected_signal: "referring_domains up; dim 4 grade lift"
    verify: "track dim 4 referring_domains (same source: DataForSEO)"
    effort: L
    status: open
  - id: LLMS-1
    title: Add an llms.txt (cheap, low-confidence)
    dimension: 7
    tier: 3
    basis: "llms.txt — 97% never fetched; do only because it's ~free"
    pages: [/llms.txt]
    change: "Generate a minimal llms.txt index."
    expected_signal: "None promised — Tier 3; never lead with this"
    verify: "file present + well-formed"
    effort: S
    status: open
# ==========================================================================
---

# Playbook — example.com

Ordered by leverage (Tier 1 → 3, then reach ÷ effort). **A Tier-3 item never
outranks a Tier-1/2 item.** Apply items, then run `track` to score the result.

| ID | Item | Dim | Tier | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| EVD-1 | Add cited statistics to /services | 3 | 1 | S | open |
| ENT-1 | sameAs + Organization schema on /about | 4 | 2 | S | open |
| EXT-1 | Front-load answers under question H2s | 2 | 2 | M | open |
| LNK-1 | Pursue 3 competitor-gap link prospects | 4 | 2 | L | open |
| LLMS-1 | Add llms.txt (cheap, low-confidence) | 7 | 3 | S | open |

> This is plan-only — applying the changes is a separate step the user drives.
> The **frontmatter `items` list is the contract**; `track` keys off stable `id`s.
