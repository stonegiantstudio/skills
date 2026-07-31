# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.2.1] — 2026-07-30

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

[unreleased]: https://github.com/stonegiantstudio/skills/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/stonegiantstudio/skills/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/stonegiantstudio/skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/stonegiantstudio/skills/releases/tag/v1.0.0
