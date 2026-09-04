---
description: Score any artifact on a 1-100 rubric with auto-iteration to a target score (e.g. /stone-giant:score 90). A cold critic subagent that never sees the conversation builds a tailored rubric and scores; the main thread applies what would raise the score. Built-in guardrails prevent gaming.
---

# Score

Evaluate the current artifact — a plan, PRD, implementation, markdown document, or any scoped work — against a tailored rubric and assign a score from 1 to 100.

## The critic is cold

The scoring itself is done by a **fresh subagent that has never seen this conversation**. The session that wrote an artifact holds every assumption that shaped it, which is exactly the context a critic must not have: same context scoring itself is confirmation bias with a slash command. So the split is fixed:

- **The critic** (a subagent via the Agent tool, read-only, run in the foreground) receives only: the artifact (a file path, or the content inline for an in-conversation artifact), its type in one line, the rubric when one is already locked, and the **Scoring Guidelines** and **Anti-Gaming Guardrails** sections of this file. It receives no conversation history, no author reasoning, no prior pass's suggestions, and no hint of the target score. It returns the rubric (on the first pass), the per-dimension scores with notes, the "what would raise the score" list, and the verdict — nothing else.
- **The main thread** parses arguments, identifies the artifact, applies improvements, and re-dispatches the critic. It never scores.

The critic runs on the session's own model, never a smaller override: a critic weaker than the author waves work through. If the harness has no subagent capability, score in-thread and write `Critic: in-thread (no subagent available)` at the top of the report, so a reader knows the cold guarantee did not hold for this run.

**The critic brief.** Dispatch a read-only, general-purpose subagent in the foreground with exactly this, and nothing else:

> You are scoring an artifact you have never seen before. Artifact: `<absolute path, or the full content inline>`. Type: `<one line, e.g. "a Claude Code skill file" or "a PRD">`. For an implementation spanning files, the files are: `<list>`.
>
> First pass only: "Build the rubric per the section below."
> Every later pass instead: "Use this locked rubric, unchanged:" followed by the rubric table.
>
> `<paste the Build the Rubric section, without the example dimensions if the artifact type is obvious>`
> `<paste the Scoring Guidelines section>`
> `<paste the Anti-Gaming Guardrails section>`
>
> Return only: the rubric table (dimension, weight, score, notes), the "what would raise the score" list with point estimates, and a one-sentence verdict, in the Score and Report format. Do not return anything else.

The critic gets the sections pasted, not a path to this file, so it cannot read the parts meant for the main thread. Check its return before using it: the weights must total 100, every dimension must carry a score and a note, and the rubric on a later pass must match the locked one. On a bad return, re-dispatch once with the same brief; if the second return is also bad, fall back to in-thread scoring and label it as above.

## Parse Arguments

If `$ARGUMENTS` is `help`, display the usage guide and stop:

> **`/stone-giant:score`** — Score the current artifact on a 1-100 rubric
>
> **Usage:**
>
> - `/stone-giant:score` — score the most recent artifact, then ask if you want improvements
> - `/stone-giant:score <file>` — score a specific file (e.g., `/stone-giant:score src/utils.ts`)
> - `/stone-giant:score <target>` — score and auto-iterate until the target is reached (e.g., `/stone-giant:score 90`)
> - `/stone-giant:score <target> <file>` — iterate a specific file to the target score (e.g., `/stone-giant:score 90 src/utils.ts`)
> - `/stone-giant:score help` — show this help
>
> **Target score mode** automatically applies improvements and re-scores until the target is met (max 5 passes). Stops early on plateau or regression.

Otherwise, `$ARGUMENTS` may contain a **target score**, a **file path**, both, or neither.

**Parsing rules:**

1. A bare integer between 1-100 is a **target score** (e.g., `/stone-giant:score 94`)
2. A file path or description is the **artifact to score** (e.g., `/stone-giant:score src/utils.ts`)
3. Both can be combined — leading integer is the target, remainder is the artifact (e.g., `/stone-giant:score 90 src/utils.ts`)
4. No arguments — infer the artifact from context (see below) and use manual mode

The target score is consumed during parsing — it does not affect artifact identification. After extracting the target, use the remainder of `$ARGUMENTS` (if any) as the artifact specifier.

**Edge cases:**

- Target ≤ current score → skip iteration, congratulate the user, show the rubric
- Target > 95 → accept it but note: "Scores above 95 are rare and require near-flawless execution across all dimensions."
- Target < 30 → likely a mistake. Ask the user to confirm before proceeding.

## Determine Context

If the artifact wasn't specified in arguments, identify it from context in this order:

1. **Recent conversation** — a plan, PRD, implementation, or document was just produced or is actively being discussed
2. **Staged changes** — run `git diff --cached --name-only` to find work in progress
3. **Open files / recent edits** — check what was recently read or written in this session

**If the context is still unclear**, ask the user:

> What would you like me to score? For example:
>
> - A plan or PRD you just created
> - A specific file (give me the path)
> - The current implementation on this branch
> - A markdown document

Do not guess. Wait for the user to clarify before proceeding.

**Large artifacts:** For implementations spanning many files, focus on architecture and patterns rather than line-by-line review. List which files were evaluated so the user knows the scope.

**Artifacts too small to score:** If the artifact is a single line, trivial snippet, or otherwise too thin to meaningfully evaluate, say so and ask the user if they'd like to expand scope.

## Build the Rubric

The critic builds the rubric on the first pass and returns it; the main thread hands the same rubric back on every later pass so the dimensions and weights stay locked. Create a rubric **tailored to the artifact type**. Use 5-8 dimensions, each weighted to total 100 points. Choose dimensions appropriate to the artifact:

### Example Dimensions by Type

**Plans / PRDs:**

- Clarity & specificity
- Completeness (edge cases, error states)
- Feasibility & scope
- User impact / value articulation
- Success metrics / measurability
- Risk identification

**Code / Implementation:**

- Correctness & functionality
- Code quality & readability
- Error handling & edge cases
- Performance considerations
- Security
- Test coverage / testability

**Markdown / Documentation:**

- Structure & organization
- Clarity of writing
- Completeness
- Audience appropriateness
- Actionability (can someone act on this?)

**Design / UI:**

- Visual hierarchy & layout
- Consistency & design system adherence
- Accessibility
- Responsiveness
- User flow clarity

Adapt freely — the rubric should match the artifact, not the other way around.

**Weighting strategy:** Weight dimensions based on what matters most for the specific artifact. A security-critical API should weight security and error handling higher. A landing page should weight clarity and visual hierarchy higher. Do not default to equal splits.

## Score and Report

Present the critic's return as it came back, with a `Critic: subagent` or `Critic: in-thread (no subagent available)` line above it, in this format:

```text
## Score: XX/100

### Rubric Breakdown

| Dimension              | Weight | Score | Notes                        |
|------------------------|--------|-------|------------------------------|
| Clarity & specificity  | 20     | 17/20 | Strong, minor ambiguity in…  |
| Completeness           | 20     | 12/20 | Missing error states for…    |
| ...                    | ...    | ...   | ...                          |

### What Would Raise the Score

1. **+N points** — [specific, actionable improvement]
2. **+N points** — [specific, actionable improvement]
3. **+N points** — [specific, actionable improvement]

### Verdict

[One-sentence overall assessment]

---

**Score: XX/100**
```

## Scoring Guidelines

- **90-100** — Exceptional. Ready to ship / present as-is.
- **75-89** — Strong. A few targeted improvements away from great.
- **60-74** — Solid foundation. Notable gaps that need addressing.
- **40-59** — Needs work. Core structure is there but significant gaps remain.
- **Below 40** — Major rethink needed. Fundamental issues with approach or completeness.

Score strictly. A score of 95 should be rare and earned. Most first drafts land in the 55-75 range, and that's normal.

**Self-evaluation bias:** The cold critic exists to remove it: the critic does not know who wrote the artifact or why. If the critic is running in-thread because no subagent is available, and the session wrote the artifact, say so at the top of the report and score with the extra severity the conflict demands.

**Scoring someone else's work:** Frame everything constructively. The goal is to help, not to judge. Use language like "this could be strengthened by..." rather than "this is missing..." Lead with what's working before identifying gaps.

**Disagreement:** If the user disagrees with a dimension score, discuss it. If their reasoning is sound, re-dispatch the critic with the user's argument appended to the brief as `The author disputes <dimension>: <their reasoning>` and let it re-score; the main thread does not edit a score by hand. The rubric is a conversation starter, not a final judgment.

## Anti-Gaming Guardrails

When chasing a target score, it is tempting to invent changes that look like improvements. Do not. A higher score on a worse artifact is a failure, not a success. **A real 93 beats a gamed 96.**

**Never introduce any of these to raise a score:**

- **Tests that don't test behavior** — snapshot tests of static output, assertions on implementation details, tests with no meaningful assertion, tests of trivial getters/setters, tests that duplicate what the type system already proves.
- **Abstractions without a second caller** — extracting helpers, interfaces, or base classes for a single use site. Wait for the second caller.
- **Defensive code for impossible states** — null checks on values that can't be null, try/catch around code that can't throw, validation at trusted internal boundaries, fallbacks for scenarios that can't happen.
- **Comments restating the code** — explaining what well-named identifiers already say. Comments justify non-obvious *why*, not *what*.
- **Documentation padding** — adding sections for completeness alone, restating obvious information, fabricating "edge cases" that don't actually exist.
- **Speculative features or config** — flags, hooks, or options with no concrete caller. YAGNI.
- **Renaming and reshuffling** — surface-level churn that moves the score without changing substance.

**Before applying any suggestion**, test it against this list. If a suggestion would only raise the score by introducing one of these anti-patterns, **discard it** — even if it would close the gap to the target. Prefer stopping short over gaming the rubric.

## Diminishing Returns

When you are close to the target but the remaining improvements are cosmetic, forced, or would trigger an anti-pattern, **stop and tell the user**:

> The artifact is at XX/100. Closing the remaining N points would require [specific change], which I don't recommend because [anti-pattern triggered / rubric miscalibrated / genuine ceiling reached]. Options:
>
> 1. **Accept XX/100** as the ceiling for this artifact
> 2. **Restructure** — incremental polish has hit its ceiling; a rewrite might unlock a higher score. Concretely: for **code**, reconsider the architecture or abstractions; for **plans/PRDs**, reorganize around different primary dimensions (e.g., user journey vs. technical components); for **docs**, shift structure or audience (tutorial vs. reference). Want me to attempt one?
> 3. **Re-examine the rubric** — the current weighting may not fit this artifact (see below)
> 4. **Override** and continue anyway (not recommended — I will flag each gamed change)
>
> Which would you like?

Do not continue until the user chooses.

## Rubric Re-examination

The rubric is locked across passes for consistency — but if every remaining suggestion feels forced, the rubric itself may be miscalibrated for this artifact. Signals:

- The lowest-scoring dimension is structurally capped (e.g., heavy weight on "test coverage" for a 20-line pure function where a test would be trivial).
- Every suggestion to raise that dimension appears on the anti-gaming list.
- The current score already reflects the artifact's real ceiling and further gains require inventing substance that isn't needed.

When you see these signals, surface them explicitly rather than iterating further. Offer to re-weight the rubric with the user's input, then re-score. Do not silently adjust weights mid-run — that hides the problem.

**If the user agrees to re-weight:** show the revised rubric, dispatch a fresh critic with it as the locked rubric, reset the delta baseline for subsequent passes, and annotate the journey table (e.g., `Pass 3 (rubric reset): 78/100 — weights revised`). Deltas after a reset are measured from the new baseline, not the original.

## After Scoring

### Target Score Mode

When a target score is present, iterate automatically:

1. **Score** the artifact by dispatching the cold critic (full rubric breakdown on the first pass).
2. **Filter suggestions through the Anti-Gaming Guardrails.** Discard any improvement that would require an anti-pattern. If all remaining improvements pass the filter, apply the highest-leverage ones — do not ask, just do it. If filtering leaves nothing meaningful and the score is within 5 points of the target, invoke **Diminishing Returns** and stop. If the gap is larger than 5 and no legitimate improvements remain, invoke **Rubric Re-examination** instead.
3. **Re-score** the improved artifact by dispatching a fresh critic with the locked rubric; the previous critic's notes are not passed along. For intermediate passes, show:
   - The new score with delta: `## Score: XX/100 (+N)`
   - A brief summary of what was changed (2-3 sentences)
   - The next set of improvements to apply (already filtered)
4. **Repeat** steps 2-3 until the score meets or exceeds the target, or a stopping rule fires.

**How to apply improvements by artifact type:**

- **Code** — edit the files directly. Run tests/linters if available to confirm nothing broke.
- **Plans / PRDs / Markdown** — rewrite the document in place, expanding weak sections, adding missing content, and tightening language.
- **In-conversation artifacts** (not yet written to a file) — output the improved version inline.

**Rubric consistency:** Use the same dimensions and weights across all passes. The rubric is set on the first pass and locked. Only the scores and notes change on subsequent passes. This ensures deltas are meaningful.

**Stopping rules (check in order — first match wins):**

- **Success** — score meets or exceeds the target. Show the full final rubric breakdown.
- **Diminishing returns** — every remaining suggestion would trigger an anti-pattern, or the only path to the target is a structural rewrite. Invoke the Diminishing Returns prompt and wait for the user's choice. This rule takes precedence over "continue iterating" even when under the iteration cap.
- **Rubric miscalibration** — the signals in Rubric Re-examination are present. Pause, surface the miscalibration, and offer to re-weight.
- **Regression** — a pass lowers the score. Revert the changes, report what happened, and stop. Ask the user how to proceed.
- **Plateau** — delta is < 2 for two consecutive passes. Stop early; the artifact is near its ceiling without a structural rethink.
- **Iteration cap** — stop after 5 improvement passes. Report the best score achieved and what remains.

**Journey summary** — after reaching the target (or stopping), present:

```text
## Score Journey

| Pass    | Score  | Delta | Summary                        |
|---------|--------|-------|--------------------------------|
| Initial | 68/100 | —     | First draft evaluation         |
| Pass 2  | 79/100 | +11   | Added error handling, examples |
| Pass 3  | 84/100 | +5    | Improved clarity, edge cases   |
| Pass 4  | 93/100 | +9    | Tightened structure, coverage  |
| Final   | 95/100 | +2    | Polished language, consistency |
```

Then summarize in natural language, e.g.:

> Initial draft scored 68. Improvements brought it to 79, 84, and 93. The final pass pushed the score to 95/100.

End with:

> Ready to continue?

### Manual Mode (No Target)

When no target score is provided, dispatch the cold critic once, show the full rubric breakdown, and ask:

> Want me to rewrite this to address the improvements above?

If they say yes, **filter the improvements through the Anti-Gaming Guardrails first** — the same filter applies in manual mode. A user-approved rewrite is still subject to the guardrails; discard any suggestion that would introduce an anti-pattern and explain why. Then make the remaining improvements and **re-score** the updated version. Show deltas from the previous score:

```text
## Score: XX/100 (+N from previous)
```

Include deltas on individual dimensions that changed:

```text
| Completeness | 20 | 18/20 (+6) | Now covers edge cases for… |
```

This makes progress visible and reinforces the feedback loop.

---

$ARGUMENTS
