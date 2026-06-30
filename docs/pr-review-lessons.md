# PR review lessons

Recurring mistake-classes caught in review, written as short checks so the
next `/deep-review` (or a human) catches them earlier. Grouped by lens tag.

## Capture gate

Add a finding here ONLY if all three hold:

1. It's a **recurring class** of mistake, not a one-off bug.
2. A **short written check** would catch it next time.
3. It's **not pure taste** and not already covered by a linter or CLAUDE.md.

Promote a lesson to CLAUDE.md (and delete it here) when it hits `(×3)` or is
prevention-critical. Most findings do not qualify — keep this short.

## [systems]

- When adding a tool/connector/data-source/dependency to a skill, **grep its name
  across every orchestration surface and thread it through all of them**, not just
  the obvious file. For a skill that means: frontmatter `description`, the `help`
  usage block, the Step-0 / ask list, per-dimension `feeds:`, the credentials
  table, README, and CHANGELOG. A late addition wired into only the connector +
  credentials table reads as "added" but agents following the orchestration layer
  never offer it. (seo-geo-aeo PR #7: DataForSEO half-integrated.) (×1)
- Example shell commands shipped in a skill are product surface — they must be
  correct AND complete. Paged APIs need pagination: `gh api` defaults to 30
  results/page, so an un-`--paginate`d jobs/issues/runs query silently truncates
  on exactly the large inputs the skill is meant to handle. (×1)

## [writing]

- Don't claim a skill is "grounded in how Google/Meta/etc. run CI at scale"
  when the basis is their *published* writeups — citing a company's paper is not
  insider knowledge of how they operate. Say "drawing on published engineering
  from X" or "cites X," not "how X runs Y." Applies to README copy, frontmatter
  descriptions, and PR bodies alike. (×1)
