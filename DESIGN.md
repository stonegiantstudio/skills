# stonegiantstudio/skills — Design Guide

Public skills repo for Stone Giant Studio. This document covers repo
structure, skill extraction, distribution strategy, and launch plan.

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo name | `stonegiantstudio/skills` | Matches org, matches Anthropic/Vercel/Microsoft/Expo convention |
| Repo structure | Monorepo marketplace (one plugin, multiple skills) | Industry standard — Anthropic, Adobe, AWS, Expo all use this pattern |
| Visibility | Public | Skills are markdown — no secrets, no proprietary business logic |
| License | Apache-2.0 | Matches Anthropic's own skills repo; permissive, enterprise-friendly |
| Cross-platform | Claude Code + Cursor + Codex | Low effort (duplicate plugin.json into .cursor-plugin/ and .codex-plugin/) |
| Spec compliance | agentskills.io | Required for skills.sh listing and broad agent compatibility |
| Plugin name | `stone-giant` | More discoverable and professional for a public repo than `sgs` |
| park.md structure | Split into main + references | Main file covers the shutdown ritual; `references/park-subcommands.md` details review, log, punch, triage. Keeps main skill under the 500-line agentskills.io guideline |
| npm-security-advisory | Bundle in public repo | eval-npm depends on it (Step 0 reference); shipping without it breaks the flow |
| Versioning | Independent from private repo | Public starts at 1.0.0; private repo (currently 2.39.0) is the source of truth. Changes flow one direction: private → public |

## Initial Skills

Four commands extracted from the private `stone-giant-skills` repo:

| Skill | Private repo source | Public repo target | Lines | What it does |
|-------|--------------------|--------------------|-------|-------------|
| `park` | `plugins/sgs/commands/park.md` | `commands/park.md` + `references/park-subcommands.md` | 701 → ~400 + ~300 | End-of-day shutdown ritual — park work, capture context, start fresh tomorrow |
| `score` | `plugins/sgs/commands/score.md` | `commands/score.md` | 273 | Score any artifact on a 1-100 rubric with auto-iteration to a target score |
| `eval-npm` | `plugins/sgs/commands/eval-npm.md` | `commands/eval-npm.md` | 282 | Evaluate npm packages for maintenance health, adoption, and alternatives |
| `npm-security-advisory` | `plugins/sgs/skills/npm-security-advisory.md` | `skills/npm-security-advisory.md` | ~200 | Security pre-check for npm packages via Socket.dev and OSV.dev (dependency of eval-npm) |

### Extraction Notes

`park`, `score`, and `eval-npm` are **commands** (slash-invoked, in
`commands/*.md`) in the private repo. They stay as commands in the public
repo — that's the right distribution format since they're user-invoked, not
context-triggered. `npm-security-advisory` is a **skill** (auto-triggered
when eval-npm runs its security pre-check).

Extraction is a straight copy with these adjustments:

- Remove the `sgs:` namespace prefix — the plugin system adds it automatically
  from the plugin name. In the public repo the plugin is named `stone-giant`,
  so commands become `/stone-giant:park`, `/stone-giant:score`,
  `/stone-giant:eval-npm`.
- Split `park.md` into a main command file (~400 lines) and
  `references/park-subcommands.md` (~300 lines) covering the review, log,
  punch, and triage subcommands. This brings the main file under the
  agentskills.io 500-line guideline while keeping all content accessible.
- Bundle `npm-security-advisory` as a skill (auto-triggered, not
  slash-invoked) so eval-npm's Step 0 security check works out of the box.
- Review each file for remaining references to private skills not included
  in v1.0. Make any such references graceful (check if the skill is
  available before calling it).

## Repo Structure

```
skills/
├── .claude-plugin/
│   └── marketplace.json            # Root marketplace registry
├── .cursor-plugin/
│   └── marketplace.json            # Cursor cross-platform support
├── .codex-plugin/
│   └── marketplace.json            # OpenAI Codex cross-platform support
├── plugins/
│   └── stone-giant/
│       ├── .claude-plugin/
│       │   └── plugin.json         # Plugin manifest
│       ├── .cursor-plugin/
│       │   └── plugin.json
│       ├── .codex-plugin/
│       │   └── plugin.json
│       ├── commands/
│       │   ├── park.md
│       │   ├── score.md
│       │   └── eval-npm.md
│       ├── references/
│       │   └── park-subcommands.md # review, log, punch, triage details
│       └── skills/
│           └── npm-security-advisory.md
├── skills.sh.json                  # skills.sh grouping config
├── CHANGELOG.md
├── README.md
├── LICENSE
└── DESIGN.md                       # This file (remove before v1.0)
```

### Manifest Files

**`.claude-plugin/marketplace.json`** (root):
```json
{
  "marketplaceMetadata": {
    "name": "Stone Giant Studio Skills",
    "description": "Production-tested skills for Claude Code from Stone Giant Studio",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "id": "stone-giant",
      "name": "Stone Giant Studio",
      "description": "End-of-day shutdown ritual, artifact scoring, npm evaluation, and security pre-checks",
      "source": "./plugins/stone-giant",
      "version": "1.0.0"
    }
  ]
}
```

**`plugins/stone-giant/.claude-plugin/plugin.json`**:
```json
{
  "name": "stone-giant",
  "description": "Production-tested skills from Stone Giant Studio — shutdown rituals, artifact scoring, npm evaluation, and security pre-checks",
  "version": "1.0.0",
  "author": {
    "name": "Stone Giant Studio",
    "url": "https://stonegiantstudio.com"
  },
  "repository": "https://github.com/stonegiantstudio/skills",
  "license": "Apache-2.0",
  "keywords": ["productivity", "code-quality", "npm", "security", "developer-tools"]
}
```

## Distribution Strategy

### Channels (in priority order)

#### 1. GitHub Direct Install (Day 1)

Zero friction. Works as soon as the repo is public.

```bash
claude plugin add github:stonegiantstudio/skills
```

#### 2. Anthropic Plugin Directory (Day 1 — submit, ~1-2 week review)

Submit at [clau.de/plugin-directory-submission](https://clau.de/plugin-directory-submission).
This gets the plugin into the default marketplace that ships with every Claude
Code installation. Highest reach channel.

Also submit to the community marketplace via the same form.

#### 3. skills.sh (Automatic)

No submission needed. Once people install via `npx skills add
stonegiantstudio/skills`, it auto-appears on the
[skills.sh](https://skills.sh) leaderboard. The `npx skills` CLI is a
separate install channel from `claude plugin add` — supports Claude Code,
Cursor, Codex, Gemini CLI, and 50+ other agents.

Optionally add a `skills.sh.json` at root to control grouping:
```json
{
  "groups": [
    {
      "name": "Stone Giant Studio",
      "description": "Production-tested developer skills",
      "skills": ["park", "score", "eval-npm", "npm-security-advisory"]
    }
  ]
}
```

#### 4. Awesome Lists (Day 1 — submit PRs)

PR to these high-traffic curated lists:

- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) (62k stars)
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) (canonical curated list)
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) (13k stars)
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (cross-agent)

#### 5. claudemarketplaces.com (Automatic)

Auto-discovers public GitHub repos with `.claude-plugin/marketplace.json`
daily. No action needed beyond having the repo public.

### Cross-Platform Install Commands

```bash
# Claude Code
claude plugin add github:stonegiantstudio/skills

# skills.sh CLI (works with Claude, Cursor, Codex, Gemini CLI, etc.)
npx skills add stonegiantstudio/skills

# Specific skill only
npx skills add stonegiantstudio/skills --skill park

# Global install (all projects)
npx skills add stonegiantstudio/skills -g
```

## README Structure

The README is the landing page. It should be concise and scannable.

```
# Stone Giant Studio Skills

Production-tested skills for Claude Code (and Cursor, Codex, Gemini CLI).

## Install

\`\`\`bash
claude plugin add github:stonegiantstudio/skills
\`\`\`

Or via skills.sh (works with Claude, Cursor, Codex, Gemini CLI):

\`\`\`bash
npx skills add stonegiantstudio/skills
\`\`\`

## Commands

### /stone-giant:park — End-of-Day Shutdown Ritual
[2-3 sentence description, screenshot or example output]

### /stone-giant:score — Artifact Scoring
[2-3 sentence description, example output]

### /stone-giant:eval-npm — NPM Package Evaluation
[2-3 sentence description, example output]

## Auto-Triggered Skills

### npm-security-advisory
[1 sentence — runs automatically during eval-npm to check for vulnerabilities]

## What are skills?
[1 paragraph for people who landed here from a search]

## License
Apache-2.0
```

## Pre-Flight Checklist

Before making the repo public:

- [ ] Remove any references to private repos, internal URLs, or client names
- [ ] Review all four skills for references to private sibling skills not
      included in v1.0 — make any such references graceful (check availability
      before calling)
- [ ] Split `park.md` into main command (~400 lines) and
      `references/park-subcommands.md` (~300 lines)
- [ ] Verify `park.md` works standalone (references to `.park/` directory
      creation, memory system — should work in any project)
- [ ] Verify `score.md` works standalone (no private dependencies)
- [ ] Verify `eval-npm.md` works standalone with bundled
      `npm-security-advisory` (Socket.dev API should degrade gracefully
      without a token)
- [ ] Verify `npm-security-advisory.md` works standalone
- [ ] Run `npx skills-ref validate ./plugins/stone-giant` or validate
      manually against agentskills.io spec
- [ ] Test install: `claude --plugin-dir ./plugins/stone-giant` and run
      each command
- [ ] Add LICENSE file (Apache-2.0)
- [ ] Create CHANGELOG.md with the v1.0.0 initial release entry
- [ ] Add `skills.sh.json` at repo root
- [ ] Review README for accuracy

## Private → Public Sync Process

The private `stone-giant-skills` repo is the source of truth. The public repo
receives periodic extractions. Changes never flow public → private.

**Process for each extraction:**

1. Identify changed skills in the private repo since the last extraction
2. Copy updated files, applying the extraction adjustments (prefix removal,
   reference checks, park split)
3. Bump the public repo version in all manifest files
4. Update CHANGELOG.md with: public version, date, private repo version
   range covered, and a summary of changes
5. Tag the release (`git tag v1.x.0`) and push

## Future Skills

Candidates for future releases from the private repo (not in v1.0):

- `grill` — Interview-driven planning
- `rvw` — Multi-pass code review
- `tidy` — Full dependency maintenance
- `zen-break` — Mindful break suggestions
- `pomodoro` — Science-backed work intervals

**Evaluation criteria** — each candidate must pass all three before extraction:

- [ ] **Standalone viability** — no dependencies on private skills not already
      in the public repo. References to optional skills degrade gracefully.
- [ ] **General utility** — useful beyond Stone Giant projects. Solves a
      problem any developer would recognize.
- [ ] **Battle-tested** — used in at least 3 real sessions with no
      known bugs or rough edges.
