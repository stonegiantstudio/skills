# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Migrated plugin from legacy `commands/*.md` to the `skills/<name>/SKILL.md`
  directory format (current Claude Code plugin convention)
- README now documents per-agent install paths — Claude Code via the plugin,
  all other agents via skills.sh — with an explicit warning not to use both
- Moved nonstandard frontmatter keys under `metadata:` per the agentskills.io
  spec; all four skills pass `skills-ref validate`
- Enriched plugin skill descriptions to match the agentskills.io copies'
  trigger quality

### Added

- `docs/skills-sh-claude-code-install.md` — investigation of the upstream
  skills CLI bug that silently skips Claude Code on project-scope installs
  (vercel-labs/skills#1138), with root cause, verified workarounds, and the
  reporting fix submitted upstream as vercel-labs/skills#1405

### Fixed

- Removed and gitignored test-install artifacts (`.agents/`,
  `skills-lock.json`)

## [1.0.0] — 2026-05-27

Initial public release. Extracted from private `stone-giant-skills` repo.

### Added

- **park** — End-of-day shutdown ritual
- **score** — Artifact scoring with auto-iteration
- **eval-npm** — NPM package evaluation
- **npm-security-advisory** — Security pre-check for npm packages

[1.0.0]: https://github.com/stonegiantstudio/skills/releases/tag/v1.0.0
