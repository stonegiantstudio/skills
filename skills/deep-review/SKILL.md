---
name: deep-review
description: Use when reviewing one or more GitHub PRs against a diff — bugs, security, intent mismatch, missing tests, YAGNI, over-engineering, and oversized diffs. Accepts a PR URL, owner/repo#N, or a PR number in the current repo. Read-only report.
---

# Deep Review

Review a GitHub pull request from the diff, not from the PR body's claims.
Read-only: do not edit code, commit, push, or post a GitHub review unless
the user asked. Cite `file:line`. No performative review.

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

Never put PR A's code or commands on PR B's branch. Never two checkouts in the
same folder.

## Fetch — do not clone

Do not clone the repo to read a diff. Use the GitHub connector, `gh`, or the
GitHub API (`pulls`, files, reviews). Resolve owner/repo/number, then fetch
head SHA, **the PR's base branch** (never assume `main`), files, and the patch.

If there is no PR yet and you are already inside a checkout, `git fetch` and
diff `origin/<default-or-stacked-base>...HEAD`. Do not clone to get a checkout.

Do not post a GitHub review comment unless the user asked.

## Load skills from the diff

After listing changed files (and a skim of the PR body), load **only** the
sibling skills this catalog already ships that the diff actually needs. Name
them in the review opener. Do not load the whole catalog.

| Diff looks like | Load |
| --- | --- |
| React Router routes, loaders, actions | `react-router-v7` |
| Drizzle schema / migrations | `drizzle-migrations` + `postgresql` |
| Raw SQL / schema (no Drizzle) | `postgresql` + `relational-db-theory` |
| Zod schemas | `zod-ninja` |
| Tests, `*.test.*`, Playwright/Vitest | `testing-ninja` |
| Auth / sessions | `better-auth` |
| Sign-up / sign-in UX | `signup-signin` |
| Email send / templates | `resend` |
| `package.json` / lockfile / new deps | `npm-security-advisory` |
| UI / CSS / layout | `design-ninja` |
| Dates, timezones, clocks | `dates-and-times` |
| Language-level JS/TS (no React) | `js-ninja` |
| Docs / README | `technical-writing` |
| CI workflows | `ci-performance` |

Skipping a lens because the diff does not warrant it is correct and silent.
Skipping one because the skill failed to resolve is a defect: name that lens
in the opener under **Lenses failed to load**.

Tag every finding with the lens(es) that raised it.

## Extra lenses

After the sibling table, load extras that are **already installed** and that
the diff actually needs:

- a tenant/org isolation skill, when the diff has `orgId`, tenant, or isolation checks
- `simplify`, `eval-npm`, or other installed skills that match the files
- any list the current repo keeps under `.claude/deep-review-lenses.md`
  (or a short "Deep review extra lenses" section in `CLAUDE.md` / `AGENTS.md`)

Do not require extras. Do not copy a second review protocol into the repo.
Extra lenses only — same skip/fail-to-load rules, same tags.

If `ponytail` or `thermo-nuclear-code-quality-review` happen to be installed,
using them is optional. This skill already inlines that intent.

## Always-on review

**Scope (YAGNI).** Does this need to exist? Reuse what is already in the tree.
Stdlib / native / already-installed deps before a new one. Shortest working
diff once you understand the flow. Flag unrequested abstractions, scaffolding
"for later", extra files, and extra dependencies. Deletion over addition.

**Quality.** Bugs, regressions, security holes, intent mismatch, missing tests
for new behavior. Look for a simpler structure that preserves behavior — fewer
branches, fewer layers, no file pushed past ~1000 lines without a reason.
Spaghetti conditionals in an unrelated flow are a design problem, not a nit.
Do not rubber-stamp "it works" that leaves the tree messier.

Never skip: trust-boundary validation, data-loss error handling, security,
accessibility basics.

Independently verify claims. Do not take the PR body at its word.

## Read the files

For each new or substantially-changed file, read the full file, not only the
hunk. A finding often lives in code the diff calls but did not touch.

## Click-test

If the PR has a preview URL and the change is user-visible or critical, note
that a click-test is warranted. Do not clone, do not start localhost, and do
not write Playwright unless the user asked.

## Edge cases

- **Empty diff** — nothing to review; stop.
- **Docs-only** — load `technical-writing` (and `writing-markdown` if installed);
  skip code lenses.
- **Dependency bump only** — load `npm-security-advisory` and `eval-npm` if
  present; skip the rest.
- **No PR yet** — review the branch diff against the resolved base; say that
  scope is inferred from the diff alone.

## Output

```text
# Deep PR review — #N "<title>"

**SHA:** <head>
**Base:** <base branch>
**Lenses loaded:** …
**Lenses failed to load:** … | none
**Verdict:** approve | request-changes | comment

## Blockers
### B1. <title> [lens]
<file:line> — evidence. Suggested fix.

## High
### H1. …

## Medium
### M1. …

## Nits
- **N1** [lens] <file:line> — one line

## Delete-list
- unused / extra dep / scaffolding that did not need to exist

## What's good
- <bullet>
```

Omit empty sections. Every item cites `file:line` and at least one lens tag.
No filler praise. No review of files the diff did not touch.

Blockers are merge-stoppers (bugs, security, broken intent, missing tests for
new behavior, trust-boundary holes). High compounds. Medium is dead ceremony.
Nits are not load-bearing.

---

$ARGUMENTS
