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
  table, README, and CHANGELOG — including prose counts ("Thirty-four skills")
  near the top of README. (seo-geo-aeo PR #7: DataForSEO half-integrated;
  PR #9: README count not bumped when two skills were added.) (×2)
- **After centralizing a policy, delete every restatement — adding the canonical
  layer is half the job.** Check: grep for the policy's key phrases across the
  repo; each surviving copy either becomes a pointer to the canonical anchor or
  gets deleted. Two copies of a rule always drift into contradiction, and in a
  prose repo nothing but deletion enforces the boundary. (PR #9 cold reviews:
  benchmark ×3, sibling routing ×4, marketing's stale tells list; PR #8 review:
  credential protocol in six near-copies; PR #11: the README's install command
  was fixed while the doc it links to kept teaching the dead one.) (×4 — due for
  promotion, blocked on this repo having no CLAUDE.md to promote into)
- **When adding a skill, check description-level trigger overlap against the
  whole family — selection happens in descriptions, before anything loads.**
  Check: list the surfaces the new description claims ("landing pages",
  "READMEs", "UI strings") and grep the other descriptions for each; every
  double-claim either narrows or names the winner. Body-text arbitration
  cannot fix selection. (PR #9: human-writing collided with marketing,
  technical-writing, writing-markdown, and signup-signin — four collisions,
  one root cause.) (×2)
- **A derived artifact (regex from a table, list from a schema) must be tested
  against its source's own examples before shipping.** Check: run the derived
  form against the cases the source itself documents; a "convenience" that
  misses the source's canonical examples is worse than no convenience. (PR #9:
  Tier-1 sweep missed "meticulously" — cited in the skill's own worked
  example — twice, under two different regex designs.) (×1)
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
