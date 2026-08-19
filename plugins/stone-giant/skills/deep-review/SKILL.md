---
description: Use when reviewing one or more GitHub PRs against a diff — bugs, security, intent mismatch, missing tests, YAGNI, over-engineering, and oversized diffs. Accepts a PR URL, owner/repo#N, or a PR number in the current repo.
---

# Deep Review

Review a GitHub pull request from the diff, not from the PR body's claims.
Cite file + evidence. No performative review.

## Parse arguments

`$ARGUMENTS` may be:

- `help` — show usage and stop
- a PR URL (`https://github.com/owner/repo/pull/123`)
- `owner/repo#123`
- a PR number (`123` or `#123`) in the current repo
- several of the above, space-separated
- empty — infer the open PR for the current branch; if unclear, ask

**Usage (show on `help`):**

> **`/stone-giant:deep-review`** — Review a GitHub PR from its diff
>
> - `/stone-giant:deep-review` — current-branch PR
> - `/stone-giant:deep-review 123` — PR #123 in this repo
> - `/stone-giant:deep-review owner/repo#123`
> - `/stone-giant:deep-review https://github.com/owner/repo/pull/123`
> - `/stone-giant:deep-review 12 13` — review #12 and #13 separately
> - `/stone-giant:deep-review help`

## Isolation

One worker per PR. Inputs for that worker: owner, repo, PR number, head SHA,
branch, that PR's diff. No shared context across reviews.

Label every finding with `#N`. If two PRs in the same run touch the same file,
say so in a **separate note**. Do not merge findings.

Never put PR A's code or commands on PR B's branch. Never two checkouts in the
same folder.

## Fetch — do not clone

Do not clone the repo to read a diff. Use the GitHub connector, `gh`, or the
GitHub API (`pulls`, files, reviews). Resolve owner/repo/number, then fetch
head SHA, branch, files, and the patch.

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

If a tenant/org isolation skill is installed, load it when the diff has
`orgId`, tenant, or isolation checks. Do not require one.

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

## Click-test

If the PR has a preview URL and the change is user-visible or critical, note
that a click-test is warranted. Do not clone, do not start localhost, and do
not write Playwright unless the user asked.

## Output

Start with the opener: PR `#N`, head SHA, skills loaded.

Then a verdict: `approve` / `request-changes` / `comment`.

Then, only sections that have items:

- **Blockers** — must fix before merge
- **Should-fix**
- **Nits**
- **Delete-list** — YAGNI / unused / extra deps
- **What is good**

Every item cites a file and the evidence. No filler praise. No review of
files the diff did not touch.

---

$ARGUMENTS
