---
name: human-writing
description: Write and edit prose with a human voice — clear, specific, and owned by one identifiable writer. Directives distilled from Zinsser, Strunk & White, Williams, and Pinker, plus a de-slop workflow for AI-flavored drafts. Use for blog posts, essays, voice and editing passes over existing prose, or when asked to "de-slop", "humanize", or fix "AI-sounding" text. For persuasion surfaces (landing pages, ads, email campaigns) use writing-marketing-copy, which pulls in this skill's ai-tells catalogue for its authenticity sweep; for documentation structure use technical-writing; for auth-flow microcopy use signup-signin.
---

# Human writing

Writing is clarity extended as a courtesy to one specific reader. Every
directive below serves that reader; none of them serve the writer's wish
to sound impressive.

## The one test

**Read it aloud.** Fix everything you would not say to one specific
person across a table. Your breath finds uniform rhythm, your mouth
refuses "it is recommended that," and you hear yourself droning
"furthermore." Per sentence: would I say it this way to a friend? If
not, say it that way instead (Paul Graham's test, and Zinsser's before
him).

## Directives

### Sentence mechanics (Strunk & White)

- **Omit needless words.** Every word earns its place or goes.
- **Use the active voice.** The subject acts; the sentence moves.
- **Put statements in positive form.** Say what is, not what is not.
- **Prefer definite, specific, concrete language.** A number, a name, a
  date, a sensory fact.
- **End on the emphatic word.** The last position in a sentence carries
  the most weight; spend it on the point.
- **One topic per paragraph.** A new topic gets a new paragraph.
- **Use plain is/are.** Not "serves as," not "boasts," not "features."

### Why the mechanics work (Williams, Pinker)

- **Characters as subjects, actions as verbs.** "The committee decided"
  beats "a decision was reached by the committee." Readers parse
  who-did-what fastest when grammar mirrors it.
- **Old information before new.** Start sentences with what the reader
  already knows; land on what is new. Flow between sentences comes from
  this, not from connective words.
- **Write in classic style.** Writer and reader are equals looking at
  the same thing; the prose is a window, not a performance (Pinker).
- **Fight the curse of knowledge.** The root cause of unclear prose is
  forgetting what it was like not to know. State what the reader must
  already know; define terms on first use; test on a cold reader.

### The writer's posture (Zinsser, Graham, McPhee)

- **Simplify.** Strip every sentence to its cleanest components.
  Zinsser: "clutter is the disease of American writing."
- **Write for one person.** Not a committee, not a market segment.
- **Take a position and say it first.** The section's first sentence
  says what the section believes. Confidence varies with evidence, not
  uniformly.
- **Keep one voice.** One writer's word choices, one joke, one
  irritation, held across the whole piece. Unity of tense, mood, and
  pronoun.
- **Ground every abstraction.** A thousand details add up to one
  impression (McPhee). "Comprehensive integration" says nothing; "it
  connects to Slack, Salesforce, and HubSpot; setup takes 15 minutes"
  says everything.
- **Volunteer one failure.** "After 200 implementations, three patterns
  held; the first two attempts did not." Experience is specifics plus
  what went wrong.
- **Trust the reader.** Adjacent facts need no "furthermore";
  juxtaposition does the work, and the reader who infers the connection
  feels smart.
- **Rewriting is the writing.** The first draft finds the idea; the
  next drafts find the reader.

## Voice calibration

When the author's real writing is available (past posts, emails, docs),
match it: sentence rhythm, characteristic word choices, punctuation
habits, recurring tics. Calibrate to the author, never to a house
default. Without a sample, aim for the plainest register the content
allows.

## The workflow (editing an existing draft)

1. **Skeleton first.** Remove preview paragraphs, recap endings,
   symmetrical heading grids. Structure gives a draft away before any
   sentence does.
2. **Read aloud** (the one test, above). Mark everything that is not
   talk — the pass's output is the quoted list of marked sentences; no
   list means the pass did not run. When you wrote the draft yourself,
   wait long enough to read the words instead of your intent, or hand
   the read to a cold reader: a ten-second-old sentence gets confirmed,
   not read.
3. **Specificity pass.** Replace abstractions with numbers, names,
   dates — taken from the author or the source material, never
   invented. Ask the author for the missing specifics; cut what nobody
   can substantiate.
4. **De-slop pass.** Load `references/ai-tells.md` and sweep the draft
   against it; its benchmark says how much a real pass touches. Run
   its deletion test on every sentence that closes a paragraph or
   section — closers are where filler hides, in every register. Worked
   demonstration: `references/examples.md`.
5. **Experience pass.** First person where true, one anecdote, one
   thing that went wrong.
6. **Rhythm pass.** Vary sentence length; follow a long, clause-laden
   build with a short landing. Let commas and periods do the work; keep
   only the dash doing work they cannot.
7. **Voice pass (last).** Does the whole read as one specific person?

## When siblings load

Which signals apply under each sibling skill is defined once, in
`references/ai-tells.md` ("Scope by skill") — read it there rather
than from any skill's own text. `writing-markdown` governs formatting
and stacks cleanly with this skill.

## Caution

These directives are probabilistic, not laws. Technical senses of
flagged words stay ("navigate" for literal navigation). And Orwell's
sixth rule closes every list of rules, including this one: "Break any
of these rules sooner than say anything outright barbarous."
