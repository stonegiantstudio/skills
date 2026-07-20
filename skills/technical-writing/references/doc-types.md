# Doc types — structures, skeletons, review rubric

## Tutorial (learning by doing)

The reader wants competence, not coverage. One happy path, working end
to end, no branches.

Skeleton:

1. What you will build, with a screenshot or output sample up front.
2. Prerequisites, each with a version and a check command.
3. Numbered steps. Each step: the action, the exact command or code,
   the expected output, and what it means.
4. One "it worked" checkpoint the reader can verify.
5. Where to go next (link the how-to guides).

Rules: never explain alternatives mid-tutorial; never say "you could
also." Every reader runs the same path.

## How-to guide (working toward a goal)

The reader has a task and context. Assume competence; skip teaching.

Skeleton:

1. Goal, one sentence. Prerequisites, one line each.
2. Numbered steps for one specific goal ("rotate the signing key," not
   "manage keys").
3. Variants as separate short sections, only when genuinely needed.

Rules: name the doc after the task the reader searches for.

## Reference (needs exact facts)

Structure mirrors the product, not the reader's journey. Consistency
beats elegance: every entry has the same shape.

Skeleton per entry: name · signature/shape · parameters (name, type,
default, constraints) · return/result · errors · one minimal example.

Rules: no persuasion, no tutorials, no opinions. Generate from source
where possible so it cannot drift.

## Explanation (studying, wants understanding)

The one type where voice helps — may load `human-writing`.

Skeleton:

1. The question this page answers, stated as the reader would ask it.
2. Context and background; the trade-offs actually weighed.
3. Alternatives considered and why they lost.
4. Links to the reference for exact facts.

## Review rubric (IBM quality characteristics)

Score each 1–5; anything under 4 names a concrete fix.

| Characteristic | Question |
|---|---|
| Task orientation | Does every section serve a task the reader has? |
| Accuracy | Has each command and claim been executed or verified? |
| Completeness | Are prerequisites, errors, and cleanup covered? |
| Clarity | Would the fresh-reader test pass with zero stalls? |
| Retrievability | Can a searcher land mid-doc and orient in one screen? |

## Starter `.vale.ini`

```ini
StylesPath = .vale/styles
MinAlertLevel = suggestion

Packages = Google

[*.md]
BasedOnStyles = Vale, Google
```

Install the package with `vale sync`, then run `vale docs/`. Swap
`Google` for `Microsoft` if the project follows that guide. When Vale
is not installed, review against the rubric above; the tool is a
convenience, not the standard.
