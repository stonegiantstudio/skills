# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

[1.1.0]: https://github.com/stonegiantstudio/skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/stonegiantstudio/skills/releases/tag/v1.0.0
