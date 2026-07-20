---
description: Write clear technical documentation — READMEs, runbooks, how-to guides, API references, procedures. Sentence discipline from ASD-STE100 principles (one instruction per sentence, one term one meaning), Diátaxis doc types, and a fresh-reader review step. Use when writing or reviewing documentation, a runbook, a procedure, API docs, or a README. For explanation-style docs that want a human voice, pair with human-writing; for persuasion, use writing-marketing-copy instead.
---

# Technical writing

Documentation succeeds when a reader completes their task and fails when
they stall. Every rule here reduces stalls.

## Sentence discipline

Distilled from the principles of ASD-STE100 Simplified Technical
English. (The STE specification and its dictionary are copyrighted;
this skill applies the principles and reproduces none of the content.)

- **One instruction per sentence.** "Save the file. Restart the
  service." Never "save the file and then you can restart the service."
- **One topic per paragraph.**
- **Active voice, always naming the actor.** "The scheduler retries the
  job" — not "the job is retried."
- **Present tense for facts, imperative for steps.** "The cache expires
  after 60 seconds." "Delete the cache key."
- **Short sentences.** About 20 words for procedures, about 25 for
  description. Split anything longer.
- **One term, one meaning.** Pick one name per concept and repeat it.
  In literary prose, repeating a word is a flaw; in documentation,
  varying it is the flaw. A reader who sees "endpoint," "route," and
  "URL" must ask whether they name three things or one.
- **Keep the articles.** "Insert the pin in the housing" — not "insert
  pin in housing." Telegraphic style saves nothing and costs clarity.
- **Warnings before the step they protect.** A reader mid-command does
  not scroll ahead.
- **Vertical lists for sequences, one action per step.** Number steps
  only when order matters.

Worked demonstration of every rule on one runbook:
`references/examples.md`.

## The reader model

- **Every page is page one** (Baker). Readers arrive mid-document from
  search. Each page states its purpose, its prerequisites, and where it
  sits — without assuming the reader saw any other page.
- **Fight the curse of knowledge** (Pinker). State what the reader must
  already know. Define each term on first use or link its definition.
  The author's familiarity is the main source of reader stalls.

## Doc types (Diátaxis)

Pick one type per document; do not blend.

| Type | Reader's mode | Answers |
|---|---|---|
| Tutorial | learning by doing | "teach me" |
| How-to guide | working, has a goal | "show me the steps" |
| Reference | working, needs facts | "tell me exactly" |
| Explanation | studying | "help me understand" |

Structures and skeletons: `references/doc-types.md`. How this skill
pairs with its siblings is arbitrated in one place: the "Scope by
skill" section of the `human-writing` skill's `references/ai-tells.md`.

## Review

1. **Fresh-reader test.** Give the doc to someone who was not in the
   room — a colleague or a fresh agent session with no other context.
   They follow it cold and mark every stall. Each stall is a defect in
   the doc, not in the reader.
2. **Quality rubric.** Score against the IBM characteristics in
   `references/review.md`: task orientation, accuracy, completeness,
   clarity, retrievability.
3. **Mechanical gate (optional).** If Vale is installed, run it with
   the Google or Microsoft style package; a starter `.vale.ini` is in
   `references/review.md`. When Vale is absent, the rubric alone is
   the gate — the discipline does not depend on the tool.
