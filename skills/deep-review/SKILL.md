---
name: deep-review
description: Deep PR review through every relevant skill lens in one pass (read-only report). Accepts a PR URL, owner/repo#N, or a PR number in the current repo.
---

# Deep Review

Deep PR review using every skill perspective that fits the diff, in one
pass. Read-only — produces a structured report; does NOT edit code or
commit.

Use this when a branch is substantially done and you want a consolidated
critique that goes beyond a single-lens review.

**Versus the neighbours.** A cheap pre-PR lint (known repeats only, a few
lines of output) is the gate you run before opening. This skill is the
expensive architectural read, run once a branch is substantially done. An
acting review (auto-fix on a self-review, posted comments on someone else's
PR) is the tool you reach for when you want the review to _act_. This skill
never writes anything.

This file is the protocol. A repo that wants extra lenses (tenant rules,
local linters, a harness) lists those extras locally. It does not copy
this flow.

## Parse arguments

`$ARGUMENTS` may be:

- `help` — show usage and stop
- a PR URL (`https://github.com/owner/repo/pull/123`)
- `owner/repo#123`
- a PR number (`123` or `#123`) in the current repo
- several of the above, space-separated
- empty — infer the open PR for the current branch; if unclear, ask

**Usage (show on `help`):**

> **`/deep-review`** — Review a GitHub PR from its diff
>
> - `/deep-review` — current-branch PR
> - `/deep-review 123` — PR #123 in this repo
> - `/deep-review owner/repo#123`
> - `/deep-review https://github.com/owner/repo/pull/123`
> - `/deep-review 12 13` — review #12 and #13 separately
> - `/deep-review help`

## Isolation

One worker per PR. Inputs for that worker: owner, repo, PR number, head SHA,
branch, that PR's actual base, that PR's diff. No shared context across reviews.

Label every finding with `#N`. If two PRs in the same run touch the same file,
say so in a **separate note**. Do not merge findings.

If a checkout already exists, never put PR A's code or commands on PR B's branch,
and never two checkouts in the same folder. Do not create a checkout to satisfy
isolation.

## Skills this pass applies

Each skill contributes a distinct lens. Invoke every skill that could
plausibly apply to the diff — don't cherry-pick out of laziness, but
also don't force a lens onto changes it has nothing to say about. Match
the lens set to what the diff actually touches:

- Skip `stone-giant:design-ninja` and `impeccable` on a pure backend diff.
- Skip `stone-giant:react-router-v7` and `vercel-react-best-practices` on a
  non-React change.
- Skip the entire **data-layer** lens group on a pure-frontend diff
  with no schema, SQL, or tenant-scoped query changes.

Tag every finding with the lens(es) that raised it so the reader knows
which concern to weigh it against.

**Skipping a lens because the diff doesn't warrant it is correct and
silent. Skipping one because the skill failed to resolve is a defect, and
must be reported.** Those two look identical in the output otherwise, which
is how a review quietly loses half its coverage while still printing the
tags. Name any lens that failed to load in the report.

### Core lenses

Consider on most diffs (skip the frontend ones on a pure backend change,
per above):

| Skill                            | Lens                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `simplify`                       | Reuse, dead ceremony, duplicated logic, over-abstraction                                               |
| `stone-giant:react-router-v7`    | Route module exports, loader/action discipline, param validation, URL-as-state, no-useEffect mutations |
| `stone-giant:refactoring-legacy` | Orphaned code after feature replacement, dead tests, seams for future work                             |
| `stone-giant:design-ninja`       | Visual hierarchy, typography, spacing, tokens vs raw values, hydration-safe date rendering             |
| `stone-giant:testing-ninja`      | Test coverage for new logic, bug-reproducing tests, edge cases named in the workflow rules             |
| `impeccable`                     | Optional polish / distinctive design / a11y — skip if not installed                                    |
| `vercel-react-best-practices`    | Optional; hooks, keys, memoization, SSR safety, accessibility primitives                               |
| `stone-giant:js-ninja`           | No `any`, modern TS/JS idioms, defensive code at boundaries, nested-ternary smells                     |

`impeccable` and `vercel-react-best-practices` are optional extras. Skip
silently if they are not installed.

### More siblings (this catalog)

Load only if the diff actually needs them. Do not load the whole catalog.

| Skill | Apply when |
| --- | --- |
| `stone-giant:drizzle-migrations` + `stone-giant:postgresql` | Drizzle schema, drizzle-kit, migrations/ |
| `stone-giant:postgresql` + `stone-giant:relational-db-theory` | Postgres SQL / schema (no Drizzle) |
| `stone-giant:sql-server` + `stone-giant:sql-server-safety` + `stone-giant:sql-server-performance` + `stone-giant:relational-db-theory` | T-SQL / Azure SQL (no Drizzle) |
| `stone-giant:kysely-orm` | Kysely query builder diffs |
| `stone-giant:zod-ninja` | Zod / Conform / form schemas |
| `stone-giant:better-auth` | Auth, sessions, OAuth |
| `stone-giant:signup-signin` | Sign-up / sign-in UX |
| `stone-giant:resend` | Email send, templates |
| `stone-giant:dates-and-times` | Dates, timezones, clocks |
| `stone-giant:technical-writing` | Docs / README |
| `stone-giant:writing-markdown` | Markdown structure; docs-only diffs |
| `stone-giant:ci-performance` | CI workflows, slow pipeline |
| `stone-giant:npm-security-advisory` | package.json / lockfile / new deps |
| `stone-giant:eval-npm` | evaluate new packages |

### Data-layer lenses (this catalog)

Apply only when the diff touches schema, SQL, migrations, or tenant-scoped
queries. The "Apply when" column is the trigger; if nothing in the diff
matches, skip the lens silently.

| Skill                                        | Lens                                                                               | Apply when                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `stone-giant:sql-server-safety`              | Division guards, error handling, silent failures, injection, transaction safety    | `.sql` T-SQL; TS with `db.query`/`db.execute`/`db.transaction`/`EXEC` |
| `stone-giant:sql-server-performance`         | SARGability, ESR index strategy, parameter sniffing, plan-affecting query patterns | T-SQL queries, stored procs, TVFs, views                              |
| `stone-giant:relational-db-theory`           | Normalization, keys, constraints, relational anti-patterns                         | schema / DDL changes                                                  |
| `stone-giant:sql-server`                     | SQL Server / Azure SQL types, naming, temporal tables, dynamic data masking        | SQL Server DDL                                                        |

**These are the exact, fully-qualified names — type them as written.** There
is deliberately no short-form/fallback tier: one name per lens is one thing to
keep true.

The prefix is load-bearing, and dropping it is not a harmless shorthand:
`stonegiantstudio/skills` publishes the same skills two ways — as the
`stone-giant` plugin, and as a `skills.sh` manifest that installs them
user-level under `~/.claude/skills/` with no namespace. Bare `react-router-v7`
resolves on a machine that used the second route and fails on one that used the
first. This file assumes **the plugin route** (see Setup below), so prefixes
stay.

If a name doesn't resolve, **say so in the report** rather than skipping
silently. A lens that didn't run is information the reader needs: it means the
review is thinner than its own tag list implies. Check
`claude plugin list` for a plugin in a `failed to load` state.

### Setup

The lenses are not vendored — each is a plugin you install once. Without them
this skill still runs and still prints tags, but most of its coverage is
missing:

```bash
claude plugin marketplace add stonegiantstudio/skills
claude plugin install stone-giant@stone-giant-studio-skills
```

The marketplace id (`stone-giant-studio-skills`) comes from the repo's
`.claude-plugin/marketplace.json`, not from the repo name — that mismatch
is the easiest part to get wrong. There is no `claude plugin add`;
registering the marketplace and installing from it are separate steps.

Restart Claude Code afterwards — newly installed plugin skills don't appear
mid-session.

`simplify` ships with Claude Code. Two optional lenses are user-level
skills, installed with `skills.sh` rather than as plugins:

```bash
npx skills add pbakaus/impeccable -g -s impeccable
npx skills add vercel-labs/agent-skills -g -s vercel-react-best-practices
```

**`vercel-react-best-practices` is not `vercel:react-best-practices`.** Both
exist and both are about React. This skill means the first: the Vercel
Engineering performance guidelines, installed user-level from
`vercel-labs/agent-skills`. The second is a TSX review checklist from the
official `vercel` plugin (`vercel/vercel-plugin`), which this catalog does
not install. Naming the wrong one silently swaps the lens for a different
skill, which is why the bare name is written out in full everywhere it
appears.

**Don't install `stonegiantstudio/skills` both ways.** That repo also ships a
`skills.sh` manifest (`npx skills add stonegiantstudio/skills`), which installs
the same skills user-level under bare names. Running both gives you every skill
twice — `/stone-giant:park` _and_ `/park`.

## Extra lenses

After the tables above, load extras that are **already installed** and that
the diff actually needs:

- extras the consuming repo already keeps: a file, or a short extra-lenses
  section in `AGENTS.md` / `CLAUDE.md` (`.claude/deep-review-lenses.md` is one
  example, not the only path)
- other installed skills that match the files

Do not require extras. Do not copy a second review protocol into the repo.
Extra lenses only — same skip/fail-to-load rules, same tags.

## Fetch

### Already in a checkout

Resolve the base first, then issue the reads as separate tool calls in a
single message (not as one sequential script):

```bash
git fetch origin
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)
```

```bash
git log "origin/$BASE..HEAD" --oneline
```

```bash
git diff "origin/$BASE...HEAD" --stat
```

```bash
gh pr view --json number,title,body,url,baseRefName 2>/dev/null || echo "no PR yet"
```

**Always diff against `origin/$BASE`, never a bare `main`.** A local `main`
that hasn't been fetched is routinely days behind, and the diff then
includes every already-merged PR in between — a review pass spent on code
that already shipped, reporting findings against other people's landed
work. Resolving `baseRefName` from the PR (rather than assuming `main`)
also keeps stacked PRs pointing at their real base.

If a PR exists, read the body — it's the author's self-description and
sets the scope of what the diff is trying to do. If no PR exists, the
branch diff is the sole input.

### Not in a checkout

Do not clone. Resolve owner/repo/number, then:

- Paginate `GET /repos/{owner}/{repo}/pulls/{n}/files`.
- For every new or substantially-changed path, fetch the **full file** at the
  head SHA via `GET /repos/{owner}/{repo}/contents/{path}?ref={head}` (or the
  git blob/tree APIs). If `patch` is omitted (large file), still fetch the file.
- Fetch PR reviews, issue comments, and review comments.
- Surrounding files the hunk calls get a read, not a tour.
- Same inputs as the checkout path: number, title, body, url, baseRefName,
  head SHA, the file list, the patch.

If a PR body is present, read it. Do not clone to get a checkout.

### Codex (if `codex` is on PATH)

If you are already in a checkout, kick off a Codex review in parallel
(always). As soon as you know the base branch, start an independent
second-opinion review in the background so it runs while you do the
multi-lens read — never serialize behind it:

```bash
codex --sandbox read-only review --base <base-branch> --title "<PR title or branch name>"
```

**`--sandbox read-only` is load-bearing — do not drop it.** `codex review`
executes model-generated shell commands; without a read-only sandbox it runs
under workspace-write and _will edit your files_ (observed: a review rewrote
source mid-run). The flag makes codex structurally unable to write, so it
reviews by reading the diff (it won't run its own build/typecheck under
read-only — that's fine, the project's own gate covers that). A `[PROMPT]` can be
passed but a prompt can't _enforce_ read-only, so never rely on one for
safety. **Never run a blanket `git checkout .` afterward** — the caller may
have unrelated uncommitted edits in the tree, and discarding those inside a
command whose headline promise is "read-only" is worse than the risk it
guards against. Instead, snapshot `git status --porcelain` before launching,
compare it to the post-run status, and revert only paths that appear in the
delta. With `--sandbox read-only` already making writes structurally
impossible, that delta should always be empty; if it isn't, revert those
paths and name them in the report — never revert silently, and never touch a
path outside the delta. If `codex` isn't on PATH or
it errors (e.g. not logged in), note that one line in the report and proceed
with our own review alone — never block on it. When it finishes, fold its
findings into the **Codex review** section of the report (see Output shape).

If you are not in a checkout, skip Codex (it needs a tree) and proceed.

## Read the changed files end-to-end

Not just the diff hunks — a finding often hinges on code the diff didn't
touch but that the new code now calls. For each new or substantially-changed
file, Read the full file. Batch reads in parallel.

## Run the multi-lens pass

For each applicable skill, consider the diff through that lens and collect
findings. Do this as a single mental sweep over the diff, not as one
session per lens — most findings will match multiple lenses, and the
tag-set tells the reader which rules the finding trips.

Specific things to check, mapped to skill:

- `stone-giant:react-router-v7` — Route modules export only `loader` /
  `action` / `middleware` / `headers` / `default`. No `useState` mirror of
  loader data, no `useEffect` for server mutations. Route params and search
  params in a loader or action go through a Zod schema — a raw
  `Number(params.x)`, `parseInt()`, or `url.searchParams.get()` is a smell.
  Use whatever validation helper the project already has; do not invent or
  require a `~/utils/validation` import that isn't there.

  **Framework-bypass audit:** any code that reimplements a framework
  primitive by hand (raw `fetch`/beacon instead of `fetcher.submit`, manual
  `FormData` instead of `<Form>`) must reproduce what the primitive did
  implicitly, verified against the framework's dispatch code — never
  inferred from a constant's name. The sharp case: fetchers rewrite their
  target to `${path}.data` (server runs ONLY the action); a raw POST to the
  bare route path is a _document_ request — action, then every loader in
  the matched tree, then a full HTML render — and `shouldRevalidate` can't
  stop it. For every new network call the diff adds, state what the server
  actually executes for that request (which action, which loaders, which
  procs) and whether that cost is proportionate to the intent.
- `stone-giant:design-ninja` — Design tokens honored over one-off hex
  values and timings. Dates rendered hydration-safe — never
  `new Date().toLocaleDateString()` in a component (that's a hydration
  mismatch). Use whatever date helper the project already has; do not
  invent or require a `displayDate()` import that isn't there.
- `stone-giant:refactoring-legacy` — After a feature replacement, are the
  old components deleted or left "for cleanup later"? Check for dead test
  files still importing retired components, and for the orphaned half of a
  half-finished expand/contract migration.
- **DRY / recombination audit** — Any fact represented in two places. A
  human-readable label derived from structured data gets exactly one
  formatter called by exactly one writer; "the store writes one format and
  the UI re-derives another" is the named anti-pattern. Also DRY across
  TS + SQL + config.

  **Recombination audit:** when the diff adds a shared helper or field
  that encodes a subtlety (a deliberate floor skipped, a precision rule),
  grep for consumers that recombine its raw inputs — each recombination
  site can silently undo the documented rationale (e.g. dividing an
  unfloored numerator by a floored denominator). Prefer shipping the
  derived quantity consumers actually want so the subtlety is decided
  once, inside the function that knows about it.
- `simplify` — Hand-rolled className joining instead of the project's
  existing `cn`/clsx helper (use whatever is already in the tree; do not
  require `~/utils/cn`). Helpers that reconstruct an object with the same
  keys. Nested ternaries a `Record` lookup would flatten. Local constants
  used once.
- `stone-giant:testing-ninja` — New logic shipped without tests. An
  untested new branch or helper is a real finding, not a nit. Check that
  a bug fix carries a test reproducing the bug.

  **Suite-noise delta:** run the touched test files and compare their
  stderr against base, not just pass counts — a green suite that gained
  unhandled errors/warnings is a finding. If the diff adds raw I/O to a
  component (a `fetch` outside the mocked fetcher, a timer, a beacon),
  every existing test that unmounts it now does real I/O at teardown;
  the noise is environment-dependent (ECONNREFUSED here, AbortError
  there), so "quiet locally" proves nothing — the I/O must be stubbed
  file-wide.
- `vercel-react-best-practices` (if loaded) — `useEffect` dependency
  correctness, rAF/interval cleanup, SSR-safe initial state, `role` +
  `tabIndex` coherence, `key` on list items, no mirror state.
- `stone-giant:js-ninja` — **Never `any`, ever** — `unknown` plus a type
  guard, or a real type. Defensive null-coalesce that can't happen for
  internal callers, helpers that are pure identity passes, `try`/`catch`
  without a reason, triple-OR disjunctions where one disjunct subsumes
  the others.

Data-layer checks — only when the diff touches schema, SQL, migrations,
or tenant-scoped queries:

- `stone-giant:sql-server-safety` — Unguarded division (`/ 0` → error or wrong
  result), `EXEC` with string-concatenated input (injection),
  multi-statement procs without `BEGIN TRAN`/error handling, swallowed
  errors (`TRY/CATCH` that returns success), `@@ROWCOUNT` read after an
  intervening statement.
- `stone-giant:sql-server-performance` — Non-SARGable predicates (function on an
  indexed column, leading-wildcard `LIKE`, implicit conversions),
  index column order against the ESR rule (Equality → Sort → Range),
  parameter-sniffing exposure, `SELECT *` in views/TVFs, row-by-row
  where set-based would do.
- `stone-giant:relational-db-theory` — Missing/incorrect keys, denormalization
  without cause, nullable columns that should be `NOT NULL`, missing
  FK constraints, repeating groups, EAV smell.
- `stone-giant:sql-server` — Type choices (`NVARCHAR(MAX)` by
  default, `money`, `float` for currency), naming convention drift,
  temporal-table / masking opportunities (SQL Server), JSONB vs
  column modeling (Postgres). Pick the one matching the project's DB.

## Cross-check project docs

Re-read `CLAUDE.md` / `AGENTS.md` **if present** at review time rather than
trusting a remembered list — they change, and a stale citation is worse
than none. Do not hardcode another repo's rules into this review. If those
files exist, their critical / non-negotiable sections are blockers, not
suggestions.

Two that are easy to miss because they aren't code-shaped:

- **NEVER GUESS AT DDL.** Any SQL referencing a table, column, or proc
  parameter must have been verified against the project's actual schema
  (checked-in migrations, schema files, or a live inspect the project
  already documents). A plausible-looking column name in a migration is
  a blocker, not a nit. Do not invent a schema-inspect command this
  catalog does not ship.
- **Never ignore a failing test or warning** because it was already broken.

Also scan any project memory / conventions file that exists for rules the
code can't express.

Independently verify claims. Do not take the PR body at its word.

## Categorize and tag

Severity buckets:

- **Blockers** — merge-stoppers: bugs, security, broken intent, missing tests
  for new behavior, trust-boundary holes, and violations of the project's own
  `CLAUDE.md` / `AGENTS.md` (if those files exist). Named rule references
  required when a project doc is the source.
- **High** — will ship a second bug or compound if ignored (duplicated source
  of truth, a11y anti-pattern, wasted effects).
- **Medium** — unused ceremony / extra layer that does not change behavior.
- **Nits** — not load-bearing.

Tag each finding with the skill(s) that raised it: `[simplify]`,
`[react-router-v7]`, `[refactor]`, `[design]`, `[impeccable]`,
`[react]`, `[js]`, `[db]`, `[codex]`. A finding raised by two lenses
carries both tags — that's signal, not noise.

**Cite `file:line` for every finding.** A review without line numbers
is a wish list. `app/modules/forecast/portfolio/phase-row.tsx:77` is an
actionable finding; "the mobile file" is not.

Close with a **What's good** section. A pure-criticism review misses
the thing worth keeping: record successes too, not just corrections.

## Output shape

```text
# Deep PR review — #<N> "<title>"

**SHA:** <head>
**Base:** <base branch>
**Lenses loaded:** …
**Lenses failed to load:** … | none
**Verdict:** approve | request-changes | comment

**Overall:** <one paragraph — what the PR does well and what's missing>

Legend: [simplify] [react-router-v7] [refactor] [design] [impeccable] [react] [js] [db] [codex]

## Blockers
### B1. <short title> [tags]
<file:line refs, explanation, suggested fix>

## High
### H1. <short title> [tags]
<file:line refs, explanation, suggested fix>

## Medium
### M1. <short title> [tags]
<file:line refs, explanation, suggested fix>

## Nits
- **N1** [tag] <file:line> — one line

## Codex review (parallel pass)
<Synthesis of the independent `codex review` output. De-duplicate against the
findings above: where Codex and our pass agree, note the agreement (higher
confidence); where Codex caught something we missed, fold it in as a real
finding tagged [codex] and severity-rate it like any other; where Codex is
wrong or out of scope, say so and why. If Codex was unavailable (not installed
/ not logged in / errored / no checkout), state that in one line here. Omit
this section only if Codex was never attempted and was never expected
(not on PATH and not in a checkout).>

## Delete-list
- unused / extra dep / scaffolding that did not need to exist

## What's good
- <bullet>
```

Omit empty finding sections. Every item cites `file:line` and at least one
lens tag. No filler praise. No review of files the diff did not touch.

## Guardrails

- **No edits.** This is review-only. If the user wants fixes, they'll ask.
  (Running `codex` is fine only with `--sandbox read-only` — it executes
  shell commands and will edit your tree without that flag; see the
  invocation note in Fetch. Never blanket `git checkout .` afterward —
  snapshot `git status --porcelain` before and after, and revert only the
  delta, naming it in the report.)
- **No commits, no pushes, no PR comments** unless the user asked. The
  review lands in chat, not on GitHub.
- **No delegation of the whole review.** Individual lookups (e.g. "how
  is X used elsewhere?") can go to a explore/subagent; the synthesis
  stays in the main thread so the findings aren't diluted by a
  summary-of-summary.
- **Codex only with a read-only sandbox.** See Fetch.
- **Don't soft-pedal project-doc violations.** If the current repo has
  `CLAUDE.md` / `AGENTS.md` rules and the diff breaks them, call it a
  blocker, not a nit. The checklist exists because those mistakes keep
  happening.

## Edge cases

- **No PR yet** — review the branch diff against `origin/$BASE` (resolved
  from the stacked/default base, never assumed `main`) anyway. Note that
  the PR body isn't available so scope is inferred from the diff.
- **Empty diff** — nothing to review; tell the user.
- **Dependency bump only** — most skills don't apply; say so and
  load `stone-giant:npm-security-advisory` and `stone-giant:eval-npm` instead.
- **Docs-only diff** — invoke `stone-giant:technical-writing` and
  `stone-giant:writing-markdown` and skip the code-centric lenses; keep
  `simplify` for cross-document consistency.
- **Migration / pure-SQL diff** — drop the frontend lenses entirely and
  lead with the data-layer group (`stone-giant:sql-server-safety`,
  `stone-giant:sql-server-performance`,
  `stone-giant:relational-db-theory`, `stone-giant:sql-server`, plus
  `stone-giant:drizzle-migrations` / `stone-giant:postgresql` when the
  files say so). Keep `simplify` for duplicated SQL and DRY across
  SQL + TS.

- **Preview URL / user-visible change** — note that a click-test is warranted.
  The worker does not click.

---

$ARGUMENTS
