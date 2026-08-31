# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.5.0] — 2026-08-31

### Added

- **deep-review** — a public `/deep-review` skill: a multi-lens PR review
  that reads the diff rather than the description. It routes sibling
  skills by what the diff actually touches, runs an independent `codex`
  pass in parallel when a checkout is available, and reports blockers /
  high / medium / nits with a `file:line` on every finding. Read-only: it
  never edits, commits, or pushes, and it posts to GitHub only when asked
  with `--post`.
- **deep-review** — `references/audit-specimens.md` carries the worked
  incidents behind the two cross-cutting audits (framework-bypass and
  recombination), so the protocol states the rule and the specimen stays
  out of the context budget of every invocation.

### Changed

- **sync** — sibling-skill references in prose are now namespaced on the
  generated plugin copies the same way command invocations already were:
  `` `park` `` → `` `stone-giant:park` ``. Skills cite each other by name
  and those names only resolve namespaced on the plugin route, so every
  such citation was previously a dead name for plugin users. Source keeps
  bare names, which is what resolves on the skills.sh route. A backtick
  following a `/` is skipped so slash-separated identifier lists aren't
  rewritten.

### Fixed

- **sync** — `--check` now asserts the two surfaces it could not see, both
  of which have shipped wrong: `package.json` and `plugin.json` must carry
  the same version, and the README's headline skill count must match the
  number of `skills/` directories. An unbumped `plugin.json` makes
  `claude plugin update` a no-op, so a release could add a skill that no
  existing install would ever receive. A checklist did not hold this;
  the assertion does.

## [1.4.0] — 2026-07-30

### Added

- **human-writing** — `references/ai-tells.md` gains **paradox
  aphorisms** under Signal 6: the balanced, knowing formulation that
  sounds like insight and cannot be checked. "The missing item is the
  one nobody thinks to look for." "You don't know what you don't
  know." The shape carries the authority and the content is empty. No
  word in them is a tell, so they clear every lexicon sweep, which is
  how three of them reached a shipped PR description, a CHANGELOG
  entry, and `SKILL.md` itself before a human reader caught them.
- **human-writing** — `references/ai-tells.md` gains **the
  literal-question test**, a second test beside the deletion test. Ask
  a phrase a literal question; one that means something answers, one
  that only sounds right cannot. "Cost you more than it returns" —
  more than what? "Neither noticed" — neither what? "A reader arriving
  cold" — how does a reader arrive cold? Four came out of one
  evening's drafting, one of them into a public PR description, and
  every one cleared every grep in the file: no word in any of them is
  a tell, and a grep matches words rather than shapes. Both workflows
  now run it.
- **human-writing** — `references/ai-tells.md` gains **agentless
  punch** under Signal 2: the short landing sentence whose subject
  cannot perform its verb ("Neither noticed," "the system knows"). The
  rhythm pass asks for a short sentence after a long build, so the
  reach for one comes before there is a subject to put in it. This is
  the detection side of the Williams directive `SKILL.md` states,
  which had no entry — the same gap nominalization had in 1.3.0.
- **human-writing** — The deletion test now applies to trailing
  clauses, not only to whole sentences. Both flourishes that prompted
  this sat after a comma, where a test aimed at closing sentences
  never reached them. Delete from the comma and reread; if no fact
  left with the clause, it was ornament.

### Fixed

- **human-writing** — The rewrite workflow's reconcile step said to
  check that every essence-list item survived, without saying to check
  it against the written list. Reconciling from memory does not work: a
  draft reads complete whether or not it is. Two independent runs of the
  1.3.0 workflow on the same source each lost different items, and the
  losses surfaced only when the two drafts were compared. One dropped
  "map-of-content" (the Obsidian term of art) and an instruction worth
  keeping; the other dropped its opening orientation. Step 5 now walks
  the list item by item against the
  finished draft, and step 1 requires the list be written down and kept
  so there is something to check against.
- **human-writing** — Deliberate cuts now get struck from the essence
  list with a reason rather than silently omitted. The cut that
  prompted this removed a vague claim that had a usable instruction
  inside it. Writing the reason down exposed it.

## [1.3.0] — 2026-07-30

### Changed

- **human-writing** — Existing drafts are now **rewritten from their
  distilled essence by default** rather than edited in place. Editing
  preserves the draft's skeleton, and the skeleton is what reads as
  machine-written; the old workflow's first step said as much while
  prescribing pruning as the fix. A tells catalogue is also a detector,
  so aiming it at existing sentences produces avoidance rather than
  prose. `revise`, `tighten`, `edit only`, `light pass`, or any ask
  that signals preserve-my-sentences switches back to the in-place
  edit, as does fidelity-critical text (quotations, legal or medical
  wording, specifications) regardless of phrasing.
- **human-writing** — The rewrite distills two things, not one. The
  essence list is the fidelity contract; the voice is calibrated from
  the author's other writing, or from the draft itself when the draft
  is the author's own, or dropped to the plainest register when the
  draft is machine-written. Rebuilding the structure no longer means
  discarding the person who wrote it.
- **human-writing** — `references/examples.md` is retitled and now
  shows its essence list. The worked example was already a rewrite —
  the After shares almost no phrasing with the Before, and every number
  in it came from the author on request — while presenting itself as an
  edit pass.
- **human-writing** — The 25–40% benchmark in `references/ai-tells.md`
  is scoped to edit-in-place. It assumes a retained skeleton, so under
  the new default it would misread as a ceiling to stay under.

### Added

- **human-writing** — `references/ai-tells.md` gains four detection
  entries under Signal 1's related structures. **Nominalization** (the
  action buried in a `-tion`/`-ment`/`-ance`/`-ity` noun) is the
  detection side of the Williams directive `SKILL.md` already states,
  which had no corresponding entry in the catalogue. **Noun piles**
  covers three-or-more-noun stacks. **Filler intensifiers**
  (genuinely, really, truly, actually) and **sincerity prefaces**
  (honestly, frankly, truth be told) were absent entirely; the latter
  sweeps every grammatical position, since the adverbial mid-clause
  use is what survives a preface-only check. All four carry
  false-positive exemptions — thing-nouns, established compound terms,
  one-per-paragraph conversational use, and the plain adjective.

### Changed

- **human-writing** — Signal 2's `negative parallelism` entry becomes
  **the not-X-but-Y family**, naming all four surface forms
  (negative parallelism, corrective negation, antithesis, negative
  anaphora) with a grep sweep. `antithesis` was referenced in the
  false-positives note without ever being defined. The Scope-by-skill
  cross-reference is updated to the new entry name.
- **human-writing** — The six intensifier and preface words join the
  Tier 2 list rather than Tier 1, whose documented bar is three or
  more independent catalogues.

### Fixed

- **README** — The Claude Code install command was `claude plugin add
  github:stonegiantstudio/skills`, which fails with `unknown command 'add'`.
  There is no `claude plugin add`; installing a plugin takes two steps —
  `claude plugin marketplace add` to register the marketplace, then
  `claude plugin install <plugin>@<marketplace>`. The install block now
  carries both, and names `stone-giant-studio-skills` explicitly, since the
  marketplace name comes from `.claude-plugin/marketplace.json` rather than
  the repo name.
- **docs/skills-sh-claude-code-install.md** — The install section links here,
  and the doc still taught the dead command plus the retired `/sgs:*`
  namespace. It now opens with a banner marking it a dated record and pointing
  at the README, and its plan section points at the README's install block
  instead of restating the commands.

## [1.2.0] — 2026-07-20

### Changed

- **writing-marketing-copy** — The Authenticity section's own AI-tells
  list is gone; the human-writing skill's references/ai-tells.md is now
  the single authority for the sweep. This replaces the absolute
  em-dash ban (and its checklist gate) with the catalogue's density
  heuristic: em dashes are permitted at roughly the edited-human
  baseline, and only their overuse is a tell.

### Added

- **human-writing** — Write prose with a human voice. Positive-first
  directives distilled from Zinsser, Strunk & White, Williams, and Pinker
  (sentence mechanics, why they work, the writer's posture), voice
  calibration, and a seven-pass editing workflow. The AI-tells catalogue
  (six detection signals, per-cluster replacement moves, false-positive
  guidance, grep sweeps, WP:AITELLS refresh note) moves to
  references/ai-tells.md, with a worked before/after pass in
  references/examples.md.
- **technical-writing** — Write documentation readers can follow.
  Sentence discipline distilled from ASD-STE100 principles (one
  instruction per sentence, active voice, one term one meaning, warnings
  before steps), the every-page-is-page-one reader model, Diátaxis doc
  types with skeleton templates, the IBM quality rubric, and an optional
  Vale mechanical gate with a starter config.
- **seo-geo-aeo** — Assess, plan, and track a site's visibility in search and
  AI answer engines (SEO, GEO, AEO). Six modes (`assess` → scorecard,
  `playbook` → prioritized plan, `track` → progress over time, `competitors` →
  discover/filter/rank rivals, `compare` → target-vs-competitor matrix, `refresh`
  → self-update against the fast-moving landscape), a measured-vs-estimated
  provenance discipline, a site-discovery crawl phase, per-dimension grade bands,
  copy-this-shape artifact schemas (scorecard/playbook examples), and on-demand
  connectors for Google Search Console, GA4, Lighthouse, on-page parse, schema,
  DataForSEO (pay-per-use SERP, backlinks, and LLM-mention/AI-Overview citations),
  Semrush, and Ahrefs via API, MCP, or pasted screenshots. Methodology grounded in
  the GEO paper (KDD 2024) and Google's
  AI-search guidance.
- **ci-performance** — Make a CI/CD pipeline faster: measure the critical
  path, then climb a stop-when-it-stops-paying ladder (cache deps, parallel
  jobs, shard tests, isolate per-shard resources, right-size runners, build +
  Docker layer cache, test selection, merge queue), with a primary-source
  reference file. Promoted from the private `stone-giant-skills` repo.

## [1.1.0] — 2026-06-17

### Changed

- Single-source-of-truth layout: contributors edit `skills/` and the canonical
  `.claude-plugin/` manifests; the plugin skill copies, the `.codex-plugin/` and
  `.cursor-plugin/` manifests, and the `skills.sh.json` skill list are all
  generated and should not be edited by hand
- Migrated plugin from legacy `commands/*.md` to the `skills/<name>/SKILL.md`
  directory format (current Claude Code plugin convention)
- README now documents per-agent install paths — Claude Code via the plugin,
  all other agents via skills.sh — with an explicit warning not to use both
- Moved nonstandard frontmatter keys under `metadata:` per the agentskills.io
  spec; all four skills pass `skills-ref validate`
- Enriched plugin skill descriptions to match the agentskills.io copies'
  trigger quality

### Added

- `scripts/sync-plugin-skills.mjs` (Node, zero dependencies) plus
  `npm run sync:plugin-skills` and `sync:plugin-skills:check` — generates all
  derivable files from their source of truth and verifies they are in sync:
  the plugin skill copies from `skills/` (strips frontmatter `name:`,
  namespaces `/skill` → `/stone-giant:skill`), the `.codex-plugin/` and
  `.cursor-plugin/` manifests from the canonical `.claude-plugin/` ones, and
  the `skills.sh.json` skill list (alphabetical, from the `skills/` directories)
- `.github/workflows/sync-check.yml` — CI runs `sync:plugin-skills:check` on
  every push and PR, so the source-of-truth invariant can't silently drift
- Twenty-eight skills migrated from the private toolchain, each shipped in both
  the plugin and agentskills.io formats. Engineering & design:
  - **react-router-v7** — React Router v7 framework-mode and general React
    patterns (loaders, actions, route modules, middleware, type-safe data)
  - **js-ninja** — language-level JavaScript/TypeScript and Node patterns
  - **zod-ninja** — Zod schema design for Conform / TanStack Form validation
  - **testing-ninja** — pragmatic, behavioral JS/TS/React testing
  - **design-ninja** — UI/UX patterns for hierarchy, type, color, and spacing
  - **drizzle-migrations** — Drizzle + PostgreSQL multi-environment migrations
  - **signup-signin** — auth UX (copy, error states, recovery) as a discipline
- Databases & data: **postgresql**, **sql-server**, **sql-server-safety**,
  **sql-server-performance**, **kysely-orm**, **relational-db-theory**
- Backend & infrastructure: **lambda** (AWS Lambda + CDK), **better-auth**,
  **resend**
- Agent discipline: **agent-operating-standard**, **agent-philosophy**,
  **refactoring-legacy**
- Writing, product & focus: **writing-markdown**, **writing-marketing-copy**,
  **product-wisdom**, **dates-and-times**, **zen-break**
- PDF: **pdf** (router), **pdf-extract**, **pdf-create**, **pdf-charts**
- `docs/skills-sh-claude-code-install.md` — investigation of the upstream
  skills CLI bug that silently skips Claude Code on project-scope installs
  (vercel-labs/skills#1138), with root cause, verified workarounds, and the
  reporting fix submitted upstream as vercel-labs/skills#1405

### Fixed

- `zod-ninja`: replaced `z.coerce.boolean()` in the Form Data section (it is
  `Boolean(value)`, so `"false"` → `true`) with an explicit parser, and
  replaced the "New v4 Features" examples that cited non-existent APIs
  (`.exactOptional()`, `.xor()`) with real Zod v4 features
- Sync script now rewrites `allowed-tools` to the YAML-list form for the plugin
  copy (the form the Claude Code spec expects), restoring `eval-npm`'s prior
  tool scoping; frontmatter splitting anchors on a full `---` line
- Removed and gitignored test-install artifacts (`.agents/`,
  `skills-lock.json`)

## [1.0.0] — 2026-05-27

Initial public release. Extracted from private `stone-giant-skills` repo.

### Added

- **park** — End-of-day shutdown ritual
- **score** — Artifact scoring with auto-iteration
- **eval-npm** — NPM package evaluation
- **npm-security-advisory** — Security pre-check for npm packages

[unreleased]: https://github.com/stonegiantstudio/skills/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/stonegiantstudio/skills/compare/v1.4.0...v1.5.0
[1.2.0]: https://github.com/stonegiantstudio/skills/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/stonegiantstudio/skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/stonegiantstudio/skills/releases/tag/v1.0.0
