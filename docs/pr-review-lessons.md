# PR review lessons

A short ledger of recurring mistake-classes caught in review, so they get caught
earlier next time. Add a finding ONLY if all three hold:

1. It's a **recurring class** of mistake, not a one-off bug.
2. A **short written check** would catch it next time.
3. It's **not pure taste** and not already covered by a linter or CLAUDE.md.

Promote to CLAUDE.md (and delete here) when a lesson hits `(×3)` or is
prevention-critical. Keep this short — when in doubt, leave it out.

## [systems]

- When adding a tool/connector/data-source/dependency to a skill, **grep its name
  across every orchestration surface and thread it through all of them**, not just
  the obvious file. For a skill that means: frontmatter `description`, the `help`
  usage block, the Step-0 / ask list, per-dimension `feeds:`, the credentials
  table, README, and CHANGELOG. A late addition wired into only the connector +
  credentials table reads as "added" but agents following the orchestration layer
  never offer it. (seo-geo-aeo PR #7: DataForSEO half-integrated.) (×1)
