---
name: score
description: Score any artifact on a 1-100 rubric with auto-iteration to a target score. Builds a tailored rubric, identifies what would raise the score, and can auto-apply improvements. Built-in guardrails prevent gaming.
---


# Score

Evaluate the current artifact — a plan, PRD, implementation, markdown document, or any scoped work — against a tailored rubric and assign a score from 1 to 100.

## Parse Arguments

If `$ARGUMENTS` is `help`, display the usage guide and stop:

> **`/score`** — Score the current artifact on a 1-100 rubric
>
> **Usage:**
>
> - `/score` — score the most recent artifact, then ask if you want improvements
> - `/score <file>` — score a specific file (e.g., `/score src/utils.ts`)
> - `/score <target>` — score and auto-iterate until the target is reached (e.g., `/score 90`)
> - `/score <target> <file>` — iterate a specific file to the target score (e.g., `/score 90 src/utils.ts`)
> - `/score help` — show this help
>
> **Target score mode** automatically applies improvements and re-scores until the target is met (max 5 passes). Stops early on plateau or regression.

Otherwise, `$ARGUMENTS` may contain a **target score**, a **file path**, both, or neither.

**Parsing rules:**

1. A bare integer between 1-100 is a **target score** (e.g., `/score 94`)
2. A file path or description is the **artifact to score** (e.g., `/score src/utils.ts`)
3. Both can be combined — leading integer is the target, remainder is the artifact (e.g., `/score 90 src/utils.ts`)
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

Create a rubric **tailored to the artifact type**. Use 5-8 dimensions, each weighted to total 100 points. Choose dimensions appropriate to the artifact:

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

Present the score in this format:

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

Be honest. A score of 95 should be rare and earned. Most first drafts land in the 55-75 range, and that's normal.

**Self-evaluation bias:** If you wrote or generated the artifact being scored, call that out explicitly. Acknowledge the conflict of interest and be extra critical to compensate.

**Scoring someone else's work:** Frame everything constructively. The goal is to help, not to judge. Use language like "this could be strengthened by..." rather than "this is missing..." Lead with what's working before identifying gaps.

**Disagreement:** If the user disagrees with a dimension score, discuss it. If their reasoning is sound, adjust. The rubric is a conversation starter, not a final judgment.

## Anti-Gaming Guardrails

When chasing a target score, it is tempting to invent changes that look like improvements. Do not. A higher score on a worse artifact is a failure, not a success. **An honest 93 beats a gamed 96.**

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

**If the user agrees to re-weight:** show the revised rubric, reset the delta baseline for subsequent passes, and annotate the journey table (e.g., `Pass 3 (rubric reset): 78/100 — weights revised`). Deltas after a reset are measured from the new baseline, not the original.

## After Scoring

### Target Score Mode

When a target score is present, iterate automatically:

1. **Score** the artifact as normal (full rubric breakdown on the first pass).
2. **Filter suggestions through the Anti-Gaming Guardrails.** Discard any improvement that would require an anti-pattern. If all remaining improvements pass the filter, apply the highest-leverage ones — do not ask, just do it. If filtering leaves nothing meaningful and the score is within 5 points of the target, invoke **Diminishing Returns** and stop. If the gap is larger than 5 and no legitimate improvements remain, invoke **Rubric Re-examination** instead.
3. **Re-score** the improved artifact. For intermediate passes, show:
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

When no target score is provided, show the full rubric breakdown and ask:

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
