# skills.sh + Claude Code install: investigation & plan

**Status:** draft — findings confirmed, plan proposed, deeper research deferred.
**Date:** 2026-05-29
**CLI under test:** `skills` (`npx skills`) **v1.5.9**
**Context:** `npx skills add stonegiantstudio/skills` installs our four skills
(`park`, `score`, `eval-npm`, `npm-security-advisory`) for the universal agents
but they never become available in Claude Code.

---

## TL;DR

- Our repo is **correct and Claude-Code-compatible**. Nothing to fix in our content.
- The failure is an **upstream bug in the `skills` CLI** (`vercel-labs/skills`):
  when Claude Code is selected *alongside* universal agents, the CLI reports
  `symlink → Claude Code` in the summary but **never creates `.claude/skills/`**,
  so Claude Code has nothing to read.
- We can't fix the bare `npx skills add` command from our repo. What we own is
  **documentation** (steer Claude Code users to a path that works) and
  **filing the upstream bug**.

---

## How skill discovery works (the relevant facts)

Claude Code scans exactly two skill locations (plus `--add-dir` and nested
`.claude/skills/` in monorepos):

| Scope    | Path                                    | Availability        |
| -------- | --------------------------------------- | ------------------- |
| Personal | `~/.claude/skills/<name>/SKILL.md`      | All your projects   |
| Project  | `./.claude/skills/<name>/SKILL.md`      | This project only   |

Claude Code does **not** read `.agents/skills/` (the universal location).
Source: https://code.claude.com/docs/en/skills

The `skills` CLI install targets are chosen **entirely at runtime** — by
auto-detection, the interactive prompt, or the `--agent` flag. There is **no
repo-side manifest** (no `skills.sh.json` field, nothing) that lets a publisher
force a target. `claude-code` is a valid target that maps to `.claude/skills/`.

How the user's working global skills are actually wired (the pattern the CLI is
*supposed* to reproduce):

```
~/.claude/skills/adapt   -> ../../.agents/skills/adapt
~/.claude/skills/animate -> ../../.agents/skills/animate
...
```

Real files live in `~/.agents/skills/`; `~/.claude/skills/` holds symlinks so
Claude Code can see them.

---

## Root cause (confirmed in CLI source)

The behavior is **intentional CLI logic plus a misleading UI**, not a single
clean bug. Three pieces in `vercel-labs/skills` v1.5.9:

1. **Intentional skip** — `src/installer.ts:308-323`. On a **project** install
   (`!isGlobal`), for a non-universal agent (Claude Code), if the agent's config
   dir doesn't already exist in the repo (`.claude/`), the install is **skipped**
   (`skipped: true`) — by design, to avoid littering projects with `.claude/`,
   `.windsurf/`, `.kiro/` etc. for agents you don't use there. The skill is
   considered "available via `.agents/skills/`" — but Claude Code doesn't read
   that path, so for Claude Code specifically the skip means *not installed*.
   **The skip is gated on `!isGlobal` — global installs never skip.**
2. **Preview over-promises** — `src/add.ts:220` (`buildAgentSummaryLines` →
   `splitAgentsByType`) unconditionally lists Claude Code under `symlink →`,
   ignoring the skip rule. This is the `symlink → Claude Code` line in the
   confirmation prompt.
3. **Result silently drops it** — `src/add.ts:276` (`buildResultLines`) filters
   out `skipped` agents with no "skipped, and here's why / how to fix" message.

Net effect: the prompt promises a Claude Code symlink, the install quietly skips
it because `.claude/` is absent, and the result summary says nothing.

## The bug (reproduced)

**Symptom:** project-scope install selecting Claude Code + universal agents
creates `./.agents/skills/<name>` copies but **no `./.claude/skills/`**.

**Repro (clean temp dir):**

```bash
mkdir -p /tmp/sk2 && cd /tmp/sk2
npx -y skills add stonegiantstudio/skills --agent claude-code cursor amp -y
```

Observed:
- Summary printed `symlink → Claude Code` for every skill.
- Decisive check: `ls /tmp/sk2/.claude/skills/` → **No such file or directory.**
  The `.claude/skills/` directory is never created, so there is no symlink to be
  dangling — the step is skipped entirely, not merely pointed at the wrong place.

**Contrast — Claude Code as the *sole* target works:**

```bash
mkdir -p /tmp/cc && cd /tmp/cc
npx -y skills add stonegiantstudio/skills --agent claude-code -y --copy
# → ./.claude/skills/{eval-npm,npm-security-advisory,park,score}/SKILL.md  ✓
```

When `claude-code` is alone, the CLI writes **real copies** directly into
`.claude/skills/` and Claude Code picks them up.

**Conclusion:** the broken path is specifically *Claude Code bundled with
universal agents*. The symlink-into-`.claude/skills/` step is reported but not
executed. This is in `vercel-labs/skills`, not our repo.

---

## Solution (no code fix needed — verified)

Use a **global** install. The project-scope skip is `!isGlobal`-gated, so global
never skips Claude Code:

```bash
npx skills add stonegiantstudio/skills -g
```

**Verified** (2026-05-29, isolated `HOME=/tmp/fakehome`): this creates
`~/.claude/skills/{park,score,eval-npm,npm-security-advisory}` with real
`SKILL.md` files, which Claude Code reads. Invoke as `/park`, `/score`,
`/eval-npm` (`npm-security-advisory` auto-triggers).

Other ways to get a **project**-scope Claude Code install despite the skip:
- Create `.claude/` in the repo first (e.g. `mkdir -p .claude`), then install —
  the skip only triggers when `.claude/` is absent.
- Use `--copy` (copy mode bypasses the skip and writes straight to
  `.claude/skills/`).

> `~/.claude/skills/` already exists and is watched, so new subdirs appear
> in-session without restart. (A brand-new top-level `.claude/skills/` created by
> a *project* install would need a restart to be watched.)

**Caveat — duplication:** the user already installed the `stone-giant` plugin
(`claude plugin add github:stonegiantstudio/skills`), which exposes the same
skills as `/sgs:park`, `/sgs:score`, etc. Running the skills.sh install *too*
produces a second copy under bare names. Pick one path per the strategy below.

---

## Plan

### 1. Documentation (we own this)

Make the README unambiguous about per-agent install paths:

- **Claude Code → the plugin.** `claude plugin add github:stonegiantstudio/skills`
  is Claude-native, robust, already documented, and does **not** touch the buggy
  symlink code. Gives `/sgs:*` commands.
- **All other agents → skills.sh.** `npx skills add stonegiantstudio/skills`
  for Cursor, Codex, Amp, Cline, Gemini CLI, etc.
- State explicitly: **pick one path for Claude Code, not both** (avoids the
  duplicate-copy problem).

Open decision (defer): do we want skills.sh to be the *single* installer for
everything including Claude Code? It works today via `-g` (global). The blocker
is only for *project*-scope installs into repos without a `.claude/` dir, and
only as a silent/misleading-UX issue, not a hard failure. Revisit alongside the
upstream PR below.

### 2. Upstream PR to `vercel-labs/skills` (the real code fix)

This cannot be fixed in our repo — it's the CLI's project-scope skip + UI. The
fix is small and lives in their repo. Two parts:

- **Honest reporting (low-risk, clearly correct):** the preview
  (`add.ts:220` `buildAgentSummaryLines`) should not list an agent under
  `symlink →` if it will be skipped; and the result (`add.ts:276`
  `buildResultLines`) should print a `skipped: <agent> (no .claude/ in project —
  use -g or create .claude/)` line instead of silently dropping it.
- **(Optional, debatable) behavior:** consider treating Claude Code (and other
  very common agents) as worth creating the config dir for in project scope, or
  prompt. This is a design call for the maintainers, so lead with the reporting
  fix.

Draft issue/PR title:
> Project install silently skips Claude Code when `.claude/` is absent, yet the
> confirmation prompt promises `symlink → Claude Code`

Draft body:
> **Version:** `skills` v1.5.9 (`npx skills`, 2026-05-29)
> **Scope:** project install (no `-g`)
>
> When `claude-code` is selected for a project install in a repo that has no
> `.claude/` directory, `installer.ts:308-323` skips the install by design (to
> avoid creating config dirs for unused agents) and returns `skipped: true`.
> But the confirmation prompt (`add.ts:220`) lists `symlink → Claude Code`, and
> the result summary (`add.ts:276`) filters skipped agents out silently. The
> user is told Claude Code will get the skills, then it's quietly not installed,
> with no hint that `-g` or an existing `.claude/` would fix it.
>
> **Repro:**
> ```bash
> mkdir -p /tmp/sk2 && cd /tmp/sk2   # note: no .claude/ here
> npx -y skills add stonegiantstudio/skills --agent claude-code cursor amp -y
> ls .claude/skills/   # → No such file or directory
> ```
>
> **Expected:** the prompt should not promise a symlink that will be skipped, and
> the result should explain the skip + the remedy (`-g`, or create `.claude/`).
>
> **Confirms the skip is the cause — these all install Claude Code correctly:**
> ```bash
> npx -y skills add stonegiantstudio/skills -g --agent claude-code -y      # global: never skips
> npx -y skills add stonegiantstudio/skills --agent claude-code -y --copy  # copy mode bypasses skip
> mkdir -p .claude && npx -y skills add stonegiantstudio/skills --agent claude-code -y  # .claude/ exists
> ```

### 3. Deeper research (deferred — to confirm before acting)

- [x] Global scope (`-g`) — **confirmed works.** Verified in isolated
      `HOME=/tmp/fakehome`: `~/.claude/skills/{park,score,eval-npm,
      npm-security-advisory}` created with real `SKILL.md` files. Skip is
      `!isGlobal`-gated.
- [x] Project scope without `.claude/` — **confirmed skipped** (cause:
      `installer.ts:308-323`).
- [ ] Does `skills experimental_sync -a claude-code` repair an existing
      `.agents/skills/` install by creating the missing `.claude/skills/`
      symlinks? (Possible no-reinstall fix for users already in this state.)
- [ ] Check open issues/PRs on `vercel-labs/skills` for v1.5.9 so we don't file
      a duplicate before opening the reporting-fix PR.
- [ ] Decide README strategy: plugin-for-Claude-Code (status quo) vs.
      skills.sh-`-g`-for-everything (now viable since global works).

---

## What is NOT the problem (ruled out)

- Our `SKILL.md` frontmatter — valid `name` + `description`; the sole-target
  install proves the content works in Claude Code.
- Our repo layout (`skills/<name>/SKILL.md`) — correct per the agentskills.io
  spec; the CLI resolves and installs all four skills.
- A missing repo manifest — there is no publisher-side knob for install targets;
  this can't be solved by adding a file to our repo.
