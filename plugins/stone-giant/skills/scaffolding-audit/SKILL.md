---
description: Audit the local Claude Code setup (hooks, plugins, skills, MCP servers, CLAUDE.md) for scaffolding rot — customizations built for weaker models that now cost more than they return. Produces an evidence-based keep/trial/retire report; never deletes anything without approval. Use when the setup feels bloated, sessions carry too much injected context, tools overlap, or after a major model upgrade. Triggers on "scaffolding rot", "audit my setup", "prune my hooks/plugins/skills", "clean up claude config", "too many skills".
---

# Scaffolding Rot Audit

Agent scaffolding rots: prompt coercion, output-preprocessing wrappers, and
micro-skills written to compensate for a weaker model become pure cost —
context per session, conflicting instructions, silent failure modes,
maintenance — once the model no longer needs them. Meanwhile, a different
category ages well and must survive every purge.

This skill audits the machine's Claude Code configuration through that lens
and produces an evidence-based report. It is **read-only by default**: it
proposes, the human disposes.

## The classification principle

Classify every artifact by what it *encodes*, not by how useful it once was:

**Capability workarounds — ROT.** Built to compensate for model weakness;
the model improved, they didn't:

- Prompt coercion: "YOU MUST", "NOT NEGOTIABLE", red-flag tables, mandatory
  ceremony before acting. Written for models that ignored instructions;
  today they burn session context and fight other instructions.
- Output-preprocessing wrappers that pre-digest or filter tool results for
  the model. Modern models handle raw output; the wrapper adds a failure
  mode — a filter that eats the one line of evidence that mattered.
- Micro-skills wrapping what a plain sentence now achieves (single-verb
  design skills, one-liner transformations).
- Model-steering prose in CLAUDE.md ("think step by step", verbose
  behavioral coaching) as opposed to project rules.

**Invariants and knowledge — AGE WELL.** Encode intent, not capability:

- Permission and safety boundaries: guardrail hooks blocking force pushes,
  merges, production-database access. These protect against *any* agent,
  strong or weak.
- Domain rules and project conventions in CLAUDE.md (naming, architecture
  invariants, tenancy rules).
- Curated memory (facts about the user, the projects, hard-won lessons).
- Infrastructure hooks integrating external systems (orchestrators,
  notifiers, session tooling).
- Repo-level executable checks (linters, test harnesses) — they live with
  the code, not with the model.

## Step 1 — Inventory (read-only)

Collect and tabulate:

1. `~/.claude/settings.json`: every hook (event, matcher, command),
   `enabledPlugins`, `env`, permission rules. Repeat for the current
   project's `.claude/settings.json` and `.claude/settings.local.json`.
2. `~/.claude/hooks/` — read each script; summarize what it blocks or
   injects, and which category it falls in.
3. `~/.claude/skills/` plus plugin-provided skills — total count as listed
   in a session. Every listed skill costs context in every session.
4. Global and project `CLAUDE.md` — estimate what fraction is durable
   invariants versus model-steering prose.
5. Configured MCP servers — flag functional overlap explicitly (multiple
   browser-automation stacks, multiple second-opinion/review tools).
6. `~/.claude/commands/` and the memory directory (report contents;
   never modify).

## Step 2 — Usage evidence (no guessing)

Opinions don't retire tooling; usage data does:

- Scan session transcripts under `~/.claude/projects/` for the last 60
  days: count actual skill invocations by name, and note which hooks
  produced output that changed an outcome versus fired as noise.
- Any wrapper that claims to optimize tokens or output gets judged by its
  own metric (e.g. its `gain`/stats command), not by its README.
- For every pair of tools or skills answering the same need, note which
  one the transcripts show actually being used.
- A skill with zero invocations in 60 days is a retirement candidate; a
  hook that fired often but never changed an outcome is noise.

## Step 3 — Report, then act only with approval

Produce one table:

| artifact | category | evidence | recommendation |
| --- | --- | --- | --- |
| … | boundary / infra / knowledge / workaround / redundant | uses in 60d, last fired, per-session context cost | keep / trial-disable / retire / consolidate |

Rules of engagement:

- **Delete nothing in this run.** Propose reversible disables first
  (`enabledPlugins: false`, hook commented out) with a one-week re-check
  date; retire permanently only after the trial shows no degradation.
- **Never weaken permission or safety guardrails** (force-push blocks,
  merge blocks, production-database protections). Flag them as keep unless
  the human explicitly asks otherwise — and if one needs modernizing (e.g.
  allowing `--force-with-lease` while still blocking `--force`), propose
  the narrowed rule, don't remove the boundary.
- **Preserve memory directories and project CLAUDE.md invariants
  unconditionally.**
- Close with the single highest-value removal and the single
  highest-value keep, each justified in one sentence from the evidence.

## Why the periodic cadence matters

Model capability moves faster than local configuration. Scaffolding that
was net-positive six months ago can be net-negative today without any
change on your side — the model outgrew it. Re-run this audit after every
major model upgrade, or on a fixed six-month cadence, whichever comes
first. The categories that survive every audit (boundaries, invariants,
knowledge) are the ones worth investing in; everything else should be
treated as disposable by design.
