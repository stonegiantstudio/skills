# Stone Giant Studio Skills

We use these every day. Thirty-four skills pulled from our private toolchain and
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

### /stone-giant:seo-geo-aeo — Get Found by Search and AI Answers

Your content can rank on Google and still be invisible to ChatGPT, Perplexity,
and AI Overviews. They cite *passages*, not pages, and reward different things —
and most "AI SEO" advice is guesswork. This skill runs on evidence instead.

It assesses your current state across seven scored dimensions, turns the gaps
into a prioritized playbook — led by the moves a peer-reviewed study actually
measured (adding quotations lifts AI visibility most; keyword-stuffing *hurts*)
— and tracks progress across runs. It reads real data from Google Search
Console, GA4, Lighthouse, DataForSEO (pay-per-use SERP, backlinks, and AI-answer
citations — no subscription needed), Semrush, and Ahrefs via API, MCP, or a pasted
screenshot, and labels every number measured or estimated so you never act on a
guess. It stays honest where the field is hype: Google says structured data and
llms.txt aren't required, and it tells you so.

```text
/stone-giant:seo-geo-aeo assess https://yoursite.com   # score current state
/stone-giant:seo-geo-aeo playbook                       # prioritized plan
/stone-giant:seo-geo-aeo track                          # progress over time
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

### ci-performance — Make CI Faster Without Guessing

A slow pipeline taxes every push, all day. The reflex is to throw a bigger
runner at it, which buys latency you pay for by the minute and usually changes
nothing, because the bottleneck was never CPU.

This skill measures the critical path first, then walks a
stop-when-it-stops-paying ladder: cache dependencies, cancel superseded runs,
split serial jobs, shard the suite, isolate per-shard state, right-size the
runner, cache build and Docker layers, gate no-op work on a diff, run only
affected tests, add a merge queue. Every rung says when it pays and when to
stop, grounded in how Google, Meta, Uber, and Shopify run CI at scale.

On a real Vitest + SQLite pipeline it cut code-gate feedback from ~3.4 min to
~1.5 min by sharding and parallelizing, with the bigger runner explicitly
rejected.

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

## More Skills

The rest of the published set, also auto-triggered by context. Each is generic,
production-tested knowledge — no stack-specific assumptions.

**Databases & data**

- **postgresql** — PostgreSQL schema design, types, indexing, and JSONB patterns
- **sql-server** — SQL Server / Azure SQL design, T-SQL, temporal tables, masking
- **sql-server-safety** — T-SQL patterns that prevent production incidents (division guards, transaction safety, injection)
- **sql-server-performance** — query tuning: SARGability, the ESR index rule, parameter sniffing, execution plans
- **kysely-orm** — type-safe SQL query building and migrations with Kysely
- **relational-db-theory** — database-agnostic theory: normalization, keys, constraints, anti-patterns

**Backend & infrastructure**

- **lambda** — AWS Lambda + CDK: handlers, event sources, cold-start optimization, IaC patterns
- **better-auth** — Better Auth integration: OAuth, sessions, adapters, security
- **resend** — transactional email with Resend: sending, webhooks, templates, deliverability

**Agent discipline**

- **agent-operating-standard** — reliability and safety standard for autonomous coding agents
- **agent-philosophy** — the CS-canon reasoning (Brooks, Dijkstra, Ousterhout) behind the standard
- **refactoring-legacy** — test-first legacy refactoring: characterization tests, seams, Fowler's catalog

**Writing, product & focus**

- **writing-markdown** — lint-compliant, well-structured markdown
- **writing-marketing-copy** — persuasive copy grounded in Ogilvy, Halbert, Schwartz, Bernbach
- **product-wisdom** — PM frameworks and counterintuitive truths for prioritization and strategy
- **dates-and-times** — correct date/time/timezone handling (NodaTime principles, TC39 Temporal)
- **zen-break** — mindful breaks during long sessions

**PDF**

- **pdf** — router that delegates to the PDF sub-skills below
- **pdf-extract** — extract content from PDFs with context, page refs, and pattern matching
- **pdf-create** — professional PDF creation with typography and print-quality layout
- **pdf-charts** — print-ready charts and data visualizations for PDF reports

## What are skills?

Skills are markdown files that teach AI coding agents how to do specific
things well. No binaries, no build step, no runtime dependencies. They work
across Claude Code, Cursor, Codex, Gemini CLI, and 50+ other agents via the
[agentskills.io](https://agentskills.io) spec. Install once, use everywhere.

## Repo Structure

This repo ships two formats from the same content:

- **`skills/`** — the **source of truth**. The agentskills.io format consumed by
  `npx skills add` (Claude Code, Cursor, Codex, Gemini CLI, and 50+ agents).
- **`plugins/stone-giant/skills/`** — **generated** plugin output for
  `claude plugin add`. Do not edit by hand.

Both use the `skills/<name>/SKILL.md` directory convention.

### Contributing

Edit only the **source-of-truth** files, then regenerate:

```bash
npm run sync:plugin-skills
```

The sources you edit by hand are:

- **`skills/<name>/SKILL.md`** — the skills themselves.
- **`.claude-plugin/marketplace.json`** and
  **`plugins/stone-giant/.claude-plugin/plugin.json`** — the canonical
  manifests (e.g. for a version bump).

Everything else is **generated** — don't edit it by hand:

- `plugins/stone-giant/skills/` (the plugin skill copies)
- `.codex-plugin/` and `.cursor-plugin/` manifests (copies of the
  `.claude-plugin/` ones)
- the skill list in `skills.sh.json` — sync owns this list and sorts it
  **alphabetically** from the `skills/` directories, so don't hand-curate its
  order (the group `name`/`description` remain yours to edit)

Commit the regenerated files alongside your source change. To verify everything
is in sync (e.g. in review or CI):

```bash
npm run sync:plugin-skills:check
```

The sync ([`scripts/sync-plugin-skills.mjs`](scripts/sync-plugin-skills.mjs),
Node, no dependencies) copies the platform manifests verbatim, rebuilds the
`skills.sh.json` list alphabetically from the `skills/` directories, and copies
every skill into the plugin tree with two plugin-format transforms:

- **Invocations** are namespaced: `/park` → `/stone-giant:park` (for every
  skill name under `skills/`). Paths, URLs, and longer identifiers are left
  untouched.
- **Frontmatter** drops the top-level `name:` field (Claude Code infers the
  name from the directory); `skills/` keeps it, as the agentskills.io spec
  requires. `allowed-tools` is also rewritten from the space-separated source
  string into the YAML list the plugin spec expects.

## License

[Apache-2.0](LICENSE)
