---
name: deep-review
description: Use when a PR is substantially ready and you want a multi-lens review of the diff (PR URL, owner/repo#N, or PR number). Not a single-lens pass and not a pre-PR lint.
allowed-tools: Bash Read Grep Glob WebFetch
---

# Deep Review

Deep PR review using every skill perspective that fits the diff, in one
pass. Read-only — produces a structured report; does NOT edit code or
commit.

Use this when a branch is substantially done and you want a consolidated
critique that goes beyond a single-lens review.

**Versus the cheaper shapes.** A pre-PR lint (known repeats only, a few
lines of output) is the gate you run before opening. An acting review
fixes what it finds. This skill is neither: it is the expensive
architectural read, run once, and it does not touch the tree.

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
- `--post` — also post the report to the PR (see Guardrails)
- empty — infer the open PR for the current branch; if unclear, ask

Resolve every target to an explicit **owner, repo, and number** before
fetching anything. The rest of this file writes that number as `<n>`, and
every command below takes it. A bare `gh pr view` or a bare `HEAD` reviews
whatever branch happens to be checked out, which is how `/deep-review 123`
silently reviews something other than #123.

**Usage (show on `help`):**

> **`/deep-review`** — Review a GitHub PR from its diff
>
> - `/deep-review` — current-branch PR
> - `/deep-review 123` — PR #123 in this repo
> - `/deep-review owner/repo#123`
> - `/deep-review https://github.com/owner/repo/pull/123`
> - `/deep-review 12 13` — review #12 and #13 separately
> - `/deep-review 123 --post` — also post the review to the PR
> - `/deep-review help`

## Isolation

One worker per PR. Inputs for that worker: owner, repo, PR number, head SHA,
branch, that PR's actual base, that PR's diff.

Label every finding with `#N`. If two PRs in the same run touch the same file,
say so in a **separate note**. Do not merge findings.

If a checkout already exists, never put PR A's code or commands on PR B's branch,
and never two checkouts in the same folder. Do not create a checkout to satisfy
isolation.

## Skills this pass applies

Each skill contributes a distinct lens. Invoke every skill that could
plausibly apply to the diff — don't cherry-pick out of laziness, but also
don't force a lens onto changes it has nothing to say against. The
**Apply when** column is the trigger: if nothing in the diff matches, skip
the lens.

Each lens owns its own rules. Load it and apply what it says; do not
review from a remembered summary of it. **What to check** below names the
concern, not the rule — a rule restated here is a second copy that drifts
from the skill it claims to quote.

| Lens | Apply when | What to check |
| --- | --- | --- |
| `simplify` | most diffs | Reuse, dead ceremony, duplicated logic, over-abstraction |
| `refactoring-legacy` | a feature was replaced or retired | Orphaned code, dead tests, half-finished expand/contract |
| `js-ninja` | any JS/TS | Type discipline, modern idioms, boundary defensiveness |
| `testing-ninja` | new logic, or a bug fix | Coverage for new branches; a fix carries a reproducing test |
| `react-router-v7` | React Router routes, loaders, actions | Route-module shape, loader/action discipline, param validation, URL-as-state |
| `design-ninja` | UI, visual, layout | Hierarchy, typography, tokens over raw values, hydration-safe rendering |
| `zod-ninja` | Zod / Conform / form schemas | Schema shape, cross-field validation |
| `better-auth` | auth, sessions, OAuth | Integration mechanics |
| `signup-signin` | sign-up / sign-in surfaces | Auth UX, copy, recovery affordances |
| `resend` | email send, templates | Send mechanics, template shape |
| `dates-and-times` | dates, timezones, clocks | Timezone correctness, clock injection |
| `technical-writing` | docs, README | Structure, accuracy, audience |
| `writing-markdown` | markdown structure; docs-only diffs | Formatting discipline |
| `ci-performance` | CI workflows, slow pipeline | Cache keys, job graph, wasted work |
| `npm-security-advisory` | package.json, lockfile, new deps | Advisories, compromised packages |
| `eval-npm` | a new package is introduced | Maintenance health, alternatives |
| `relational-db-theory` | schema / DDL changes | Normalization, keys, constraints, relational anti-patterns |
| `postgresql` | Postgres SQL or schema | Postgres types and features; JSONB vs column modeling |
| `drizzle-migrations` + `postgresql` | Drizzle schema, drizzle-kit, `migrations/` | Migration safety, schema drift |
| `kysely-orm` | Kysely query builder | Query builder idioms, type wiring |
| `sql-server` + `sql-server-safety` + `sql-server-performance` | T-SQL / Azure SQL | Types and naming; safety (guards, error handling, injection); SARGability and plan shape |
| `impeccable` *(external)* | UI polish, a11y | Distinctive design, accessibility |
| `vercel-react-best-practices` *(external)* | React | Hooks, keys, memoization, SSR safety, a11y primitives |

**Route data-layer work by dialect.** A Postgres diff does not get the
T-SQL lenses, and vice versa. Lead with the dialect the files actually
use; `relational-db-theory` applies to schema changes in any dialect.

Add these two cross-cutting audits on any diff, tagged `[deep-review]` —
they belong to this pass rather than to a sibling skill. Worked specimens
for both are in [`references/audit-specimens.md`](references/audit-specimens.md):

- **Framework-bypass audit.** Code that reimplements a framework primitive
  by hand must reproduce what the primitive did implicitly, verified
  against the framework's dispatch code — never inferred from a constant's
  name. For every new network call the diff adds, state what the server
  actually executes for that request and whether that cost is proportionate.
- **DRY / recombination audit.** Any fact represented in two places. When
  the diff adds a helper or field encoding a subtlety (a deliberate floor,
  a precision rule), grep for consumers that recombine its raw inputs —
  each site can silently undo the documented rationale. Also DRY across
  TS + SQL + config.

Tag every finding with the lens(es) that raised it so the reader knows
which concern to weigh it against.

**Skipping a lens because the diff doesn't warrant it is correct and
silent. Skipping one because the skill failed to resolve is a defect, and
must be reported.** Those two look identical in the output otherwise, which
is how a review quietly loses half its coverage while still printing the
tags. Name any lens that failed to load in the report. On the plugin
route, `claude plugin list` shows a plugin stuck in a `failed to load`
state.

### Lens names and install

**Type the lens names exactly as they appear in the table above.** This
file ships once per install route and the names are rewritten to match:
the skills.sh route resolves them bare, the plugin route resolves them
under `stone-giant:`. Whichever copy you are reading is already correct
for the route that installed it, so there is no prefix to add or strip
and no short-form fallback tier.

`simplify` is bundled with Claude Code; on other agents it is installed
like any other skill, or skipped. `impeccable` and
`vercel-react-best-practices` are external and optional — skip silently if
absent. **`vercel-react-best-practices` is not `vercel:react-best-practices`.**
Both exist and both are about React. This skill means the first: the Vercel
Engineering performance guidelines from `vercel-labs/agent-skills`. The
second is a TSX checklist from the official `vercel` plugin. Naming the
wrong one silently swaps the lens.

The lenses are not vendored. Without them this skill still runs and still
prints tags, but most of its coverage is missing — see the README for
install instructions and pick **one** route, not both.

## Extra lenses

After the table above, load extras that are **already installed** and that
the diff actually needs:

- extras the consuming repo already keeps: a file, or a short extra-lenses
  section in `AGENTS.md` / `CLAUDE.md` (`.claude/deep-review-lenses.md` is one
  example, not the only path)
- other installed skills that match the files

Do not require extras. Do not copy a second review protocol into the repo.
Extra lenses only — same skip/fail-to-load rules, same tags.

## Fetch

### Already in a checkout

Run this as **one** block, not as separate tool calls. `BASE` is a shell
variable: it does not survive into a second call, and a split block leaves
every later `origin/$BASE` expanding to `origin/` — which reviews the wrong
range or errors outright.

For an explicit PR number:

```bash
git fetch origin
BASE=$(gh pr view <n> --json baseRefName -q .baseRefName 2>/dev/null || echo main)
git fetch origin "pull/<n>/head"
HEAD_SHA=$(git rev-parse FETCH_HEAD)
git log "origin/$BASE..$HEAD_SHA" --oneline
git diff "origin/$BASE...$HEAD_SHA" --stat
git diff "origin/$BASE...$HEAD_SHA"
gh pr view <n> --json number,title,body,url,baseRefName,headRefOid
```

For the current branch (empty `$ARGUMENTS`):

```bash
git fetch origin
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)
git log "origin/$BASE..HEAD" --oneline
git diff "origin/$BASE...HEAD" --stat
git diff "origin/$BASE...HEAD"
gh pr view --json number,title,body,url,baseRefName,headRefOid 2>/dev/null || echo "no PR yet"
```

**Take the patch, not just the stat.** `--stat` gives filenames and counts;
the patch is the only thing that shows deleted lines, replaced logic, and
the previous shape of a modified function — which is where regressions
live. Read both, plus the full files (next section).

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

If no git worktree is available (an API-only worker, or a sandbox with no
tree), do not clone. Resolve owner/repo/number, then:

- Fetch the PR via `GET /repos/{owner}/{repo}/pulls/{n}` for number, title,
  body, url, baseRefName, and head SHA. Those fields do not come from `/files`.
- Paginate `GET /repos/{owner}/{repo}/pulls/{n}/files` — this carries the
  per-file `patch`, which is the equivalent of the `git diff` above.
- For every changed path (added, modified, or renamed), fetch the **full file**
  at the head SHA via `GET /repos/{owner}/{repo}/contents/{path}?ref={head}`
  (or the git blob/tree APIs). If `patch` is omitted (large file), still fetch
  the file. Do not stop at the hunk, including small edits.
- Paginate PR reviews, issue comments, and review comments.
- Surrounding files the hunk calls: fetch via the same contents/blob APIs
  (not a local Read). A read, not a tour.
- Same inputs as the checkout path: number, title, body, url, baseRefName,
  head SHA, the file list, the patch.

If a PR body is present, read it. Do not clone to get a checkout.

### Codex (if `codex` is on PATH)

If you are already in a checkout, kick off a Codex review in parallel
(always). As soon as you know the base branch, start an independent
second-opinion review in the background so it runs while you do the
multi-lens read — never serialize behind it:

```bash
codex --sandbox read-only review --base "$BASE"
```

**`--sandbox read-only` is load-bearing — do not drop it.** `codex review`
executes model-generated shell commands; without a read-only sandbox it runs
under workspace-write and _will edit your files_ (observed: a review rewrote
source mid-run). The flag makes codex structurally unable to write, so it
reviews by reading the diff (it won't run its own build/typecheck under
read-only — that's fine, the project's own gate covers that). `--sandbox` is
a global option and must precede the subcommand. A `[PROMPT]` can be passed
but a prompt can't _enforce_ read-only, so never rely on one for safety.

**Never interpolate a PR title into the command.** `--title` is ignored for
`--base` reviews, so the fix is to omit it. Pasting a title into a
double-quoted shell string runs any `$(...)` or backticks inside it at parse
time, before `codex` starts and outside anything `--sandbox` governs — and
on a public repo the title is written by whoever opened the PR. If you ever
do need a title, pass it as `"$PR_TITLE"` with the variable set by `gh` in
the same block, never pasted in.

**Report the tree delta; never revert it.** Snapshot `git status --porcelain`
before launching and compare after. With `--sandbox read-only` the two should
match. If they don't, **name the difference in the report and stop** — do not
`git checkout` anything. A blanket `git checkout .` destroys the caller's
unrelated uncommitted work, and reverting even a single path is still a tree
change, which this skill does not make (see Guardrails). A path that was
already dirty before the run does not show up in the delta at all, so
reverting on the delta is both destructive and incomplete.

If `codex` isn't on PATH or it errors (e.g. not logged in), note that in one
line in the report and proceed with our own review alone — never block on it.
When it finishes, fold its findings into the **Codex review** section.

If you are not in a checkout, skip Codex (it needs a tree) and proceed.

## Read the changed files end-to-end

Not just the diff hunks — a finding often hinges on code the diff didn't
touch but that the new code now calls. For each changed file (added, modified,
or renamed), read the full file (contents/blob if not in a checkout; Read if
you already are). Batch in parallel.

## Run the multi-lens pass

For each applicable lens, consider the diff through it and collect
findings. Do this as a single mental sweep over the diff, not as one
session per lens — most findings will match multiple lenses, and the
tag-set tells the reader which rules the finding trips.

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

Tag each finding with the lens(es) that raised it: `[simplify]`,
`[react-router-v7]`, `[refactor]`, `[design]`, `[impeccable]`,
`[react]`, `[js]`, `[db]`, `[deep-review]`, `[codex]`. A finding raised by
two lenses carries both tags — that's signal, not noise.

**Cite `file:line` for every finding.** A review without line numbers
is a wish list. `src/routes/invoice.ts:77` is an
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

Legend: [simplify] [react-router-v7] [refactor] [design] [impeccable] [react] [js] [db] [deep-review] [codex]

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

- **No edits, no commits, no pushes.** Unconditional. This skill never
  changes the tree — not to clean up after Codex, not to revert a stray
  write. If the user wants fixes, they'll ask.
- **Codex only with a read-only sandbox.** See Fetch for the invocation and
  the report-don't-revert rule.
- **Where the report lands.** Default is chat, always. Post to GitHub only
  when the user asked for it — `--post` in `$ARGUMENTS`, or an explicit
  request in the conversation. Do not infer permission from having
  `pull_requests:write`: a token that *can* post is not a user who *wants*
  a review posted under their name on someone else's PR. When posting, use
  `POST /repos/{owner}/{repo}/pulls/{n}/reviews` with that head `commit_id`.
  Posting the report is not acting-review: it does not edit the tree.
- **One review's synthesis stays in one thread.** Individual lookups ("how
  is X used elsewhere?") can go to a subagent, but the findings for a given
  PR are collected and written in one place, so they aren't diluted into a
  summary-of-summary. Reviewing several PRs in one run is the opposite
  case: give each PR its own worker, since they share no context.
- **Don't soft-pedal project-doc violations.** If the current repo has
  `CLAUDE.md` / `AGENTS.md` rules and the diff breaks them, call it a
  blocker, not a nit. The checklist exists because those mistakes keep
  happening.

## Edge cases

- **No PR yet** — review the branch diff against `origin/$BASE` anyway.
  Note that the PR body isn't available so scope is inferred from the diff.
- **Empty diff** — nothing to review; tell the user.
- **Dependency bump only** — most lenses don't apply; say so and load
  `npm-security-advisory` and `eval-npm` instead.
- **Docs-only diff** — `technical-writing` and `writing-markdown`; skip the
  code-centric lenses, keep `simplify` for cross-document consistency.
- **Migration / pure-SQL diff** — drop the frontend lenses and route by
  dialect per the table. Keep `simplify` for duplicated SQL and DRY across
  SQL + TS.
- **Preview URL / user-visible change** — note that a click-test is
  warranted. The worker does not click.

---

$ARGUMENTS
