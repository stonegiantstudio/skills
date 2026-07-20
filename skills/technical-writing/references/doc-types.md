# Doc types — structures and skeletons

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

Skeleton:

1. The question this page answers, stated as the reader would ask it.
2. Context and background; the trade-offs actually weighed.
3. Alternatives considered and why they lost.
4. Links to the reference for exact facts.
