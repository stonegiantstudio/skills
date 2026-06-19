# Stone Giant Studio Skills

We use these every day. Eleven skills pulled from our private toolchain and
published for anyone building with AI coding agents.

Works with Claude Code, Cursor, Codex, and Gemini CLI.

## Install

**Claude Code** — install the plugin:

```bash
claude plugin add github:stonegiantstudio/skills
```

Commands arrive namespaced: `/stone-giant:park`, `/stone-giant:score`,
`/stone-giant:eval-npm`.

**All other agents** — Cursor, Codex, Gemini CLI, Amp, Cline, and
[50+ more](https://skills.sh) — install via skills.sh:

```bash
npx skills add stonegiantstudio/skills
```

Pick **one** path for Claude Code, not both: installing both ways gives you
duplicate copies of every skill (`/stone-giant:park` *and* `/park`).

> **Why not skills.sh for Claude Code?** A project-scope `npx skills add`
> currently skips Claude Code silently when the repo has no `.claude/`
> directory — the CLI reports a symlink it never creates
> ([details](docs/skills-sh-claude-code-install.md)). If you prefer the
> skills.sh route anyway, install globally with
> `npx skills add stonegiantstudio/skills -g`, which works correctly.

After installing, try `/stone-giant:score 90` (plugin) or `/score 90`
(skills.sh) on whatever you're working on.

## Commands

### /stone-giant:park — Stop Thinking About Work

You close your laptop, but your brain keeps running. Half-finished PRs,
that one bug you didn't get to, the conversation context you'll lose when
this session ends. Psychologists call it the Zeigarnik Effect: unfinished
tasks hijack your attention until you make a concrete plan to finish them.

Park runs a 5-minute shutdown ritual grounded in that research. It captures
where you stopped, locks in tomorrow's first task, and writes a structured
receipt that the next session can read cold. The debugging breakthrough, the
architecture decision, the dead end you don't want to repeat: all of it
survives the session boundary.

The result: your brain lets go. Tomorrow morning, you pick up exactly where
you left off.

```text
/stone-giant:park              # Full shutdown ritual
/stone-giant:park quick        # Abbreviated version
/stone-giant:park review       # Resume where you left off
```

### /stone-giant:score — Know Exactly Where You Stand

"Is this good enough?" is the question that stalls shipping. You wrote the
plan, the doc, the implementation. Now you're squinting at it, unsure
whether to polish more or move on.

Score builds a rubric tailored to your specific artifact, weighted by what
actually matters (security gets more weight on an API, clarity gets more
weight on a landing page). It scores each dimension, tells you exactly what
would raise the number, and can auto-apply improvements until you hit your
target. Built-in guardrails prevent gaming: an honest 93 beats a padded 96.

Stop guessing. Set a target and let it iterate.

```text
/stone-giant:score             # Score the current artifact
/stone-giant:score 90          # Auto-iterate to 90/100
/stone-giant:score 95 README.md  # Iterate a specific file
```

### /stone-giant:eval-npm — Pick Dependencies You Won't Regret

Every `npm install` is a bet. You're betting the maintainer won't disappear,
the package won't get compromised, and something better won't ship next
month. Most developers make that bet on gut feel and star counts.

Eval-npm makes it on data. It pulls maintenance health, download trends,
bundle size, TypeScript support, and security posture for every candidate.
It always expands your search: ask about one package, get a comparison
against the top 2-3 alternatives with a weighted scorecard and a clear
recommendation.

```text
/stone-giant:eval-npm date-fns vs dayjs vs moment
/stone-giant:eval-npm audit my package.json
```

## Auto-Triggered Skills

### npm-security-advisory — Catch Threats Before the Feed Does

`npm audit` catches yesterday's vulnerabilities. This skill catches today's.

When eval-npm runs, it automatically triggers a security pre-check against
Socket.dev and OSV.dev. But the real value is metadata anomaly detection
that spots supply-chain attacks during the 0-to-72-hour window before
threat feeds catch up. A version published 6 hours ago by a new maintainer,
with a `postinstall` script that didn't exist before? That's the pattern.
This skill flags it before `npm audit` even knows there's a problem.

Covers 15 documented attack techniques, from lifecycle hook injection
(event-stream, 2018) to stolen-token rapid republish (Shai-Hulud, 2025).

## Engineering & Design Skills

These load automatically when you're working in the matching context — editing
a route module, writing a Zod schema, naming a test file. No command to
remember; the right expertise shows up when it's relevant.

### react-router-v7 — Framework-Mode React, Done Right

React Router v7 (the Remix successor) plus the general React patterns that go
with it: loaders and actions, route module shape, middleware, type-safe data
flow, revalidation, error boundaries, and the thin-routes/fat-models
architecture. Triggers on `react-router.config.ts`, route modules, and imports
from `react-router` or `@react-router/*`.

### js-ninja — Language-Level JS/TS Mastery

Modern JavaScript and TypeScript at the language level: async patterns, the
falsy gotchas, type narrowing, performance, and the battle-tested idioms that
separate working code from robust code. Hands off React patterns to
`react-router-v7` and schema design to `zod-ninja`.

### zod-ninja — Schemas That Validate the Real World

Zod schema design for form validation in React Router v7 apps using Conform or
TanStack Form — including cross-field rules and the action-layer input
validation that keeps bad data out of your handlers.

### testing-ninja — Tests Worth Keeping

Pragmatic testing for JS/TS, React, and React Router, optimized for
confidence-to-effort ratio. Behavioral tests over implementation-detail tests,
so your suite survives a refactor. Triggers on `*.test.ts(x)`, `*.spec.ts(x)`,
and Vitest/Playwright configs.

### design-ninja — Interfaces That Look Intentional

UI/UX patterns for visual hierarchy, typography, color, and spacing. Reach for
it when something "looks off" but you can't name why, or when you need a
defensible spacing and type scale instead of guesses.

### drizzle-migrations — Migrations Without the Foot-Guns

Drizzle ORM migrations against PostgreSQL across local, staging, and production
— schema syncing, `drizzle-kit` workflows, and the multi-environment discipline
that keeps the three databases from drifting apart.

### signup-signin — Auth UX as a Discipline

Sign-up and sign-in as a design-and-copy problem, not just an integration one.
Covers OTP, magic links, passkeys, forgot-password, recovery, and lockout —
the copy, error states, and recovery affordances — while deferring the
integration mechanics to your stack's auth skill.

## What are skills?

Skills are markdown files that teach AI coding agents how to do specific
things well. No binaries, no build step, no runtime dependencies. They work
across Claude Code, Cursor, Codex, Gemini CLI, and 50+ other agents via the
[agentskills.io](https://agentskills.io) spec. Install once, use everywhere.

## Repo Structure

This repo ships two formats from the same content:

- **`plugins/stone-giant/skills/`** for `claude plugin add` (Claude Code, Cursor, Codex)
- **`skills/`** for `npx skills add` ([agentskills.io](https://agentskills.io) spec, 50+ agents)

Both use the `skills/<name>/SKILL.md` directory convention. When updating
a skill, update both locations. The two copies differ intentionally:

- **Invocations:** plugin uses `/stone-giant:park`; agentskills.io uses `/park`
- **Frontmatter:** agentskills.io includes `name:` (required by spec); plugin omits it (Claude Code infers from directory). The `allowed-tools` format also differs between specs.

To check the copies haven't drifted beyond those intentional differences:

```bash
diff -r skills plugins/stone-giant/skills
```

## License

[Apache-2.0](LICENSE)
