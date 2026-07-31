---
name: human-writing
description: Write and edit prose with a human voice — clear, specific, and owned by one identifiable writer. Directives distilled from Zinsser, Strunk & White, Williams, and Pinker, plus a de-slop workflow for AI-flavored drafts. Use for blog posts, essays, voice and editing passes over existing prose, or when asked to "de-slop", "humanize", or fix "AI-sounding" text. Existing drafts are rewritten from their distilled essence by default, since the skeleton is what reads as machine-written; "revise", "tighten", or any ask to keep the author's own sentences switches to an in-place edit instead. For persuasion surfaces (landing pages, ads, email campaigns) use writing-marketing-copy, which pulls in this skill's ai-tells catalogue for its authenticity sweep; for documentation structure use technical-writing; for auth-flow microcopy use signup-signin.
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

## Working on an existing draft

Two workflows. **Rewriting from the essence is the default**; editing
in place is the switch.

Editing preserves the draft's skeleton, and the skeleton is what gives
a machine draft away. The edit workflow below opens by saying exactly
that, then prescribes pruning — which leaves the shape intact. A tells
catalogue is a detector besides: aimed at existing sentences it
produces avoidance, which is how a draft ends up beige rather than
human. The directives above compose only when they are writing, not
when they are arbitrating someone else's sentence.

### Choosing the mode

**Edit in place** when any of these hold:

- The request says `revise`, `tighten`, `edit only`, or `light pass`.
- The request signals preserve-my-sentences in any wording: "keep my
  phrasing," "don't rewrite it," "just clean it up a little." Intent
  governs; the words above are examples, not a magic list.
- The text is fidelity-critical regardless of phrasing: quoted
  material, legal, medical, or compliance wording, technical
  specifications, or anything that will be cited or diffed.

**Otherwise rewrite from the essence** — including the mixed case,
where someone drafted with a model and then worked the text over by
hand. Mixed drafts still carry the generated skeleton, so they get the
rewrite; what protects the author's contribution is the voice
distillation in step 3, which reads that draft as the voice sample.

When the mode is genuinely ambiguous and the draft may be the author's
own, ask. One question costs less than a voice overwritten.

### Rewrite from the essence (default)

1. **Distill the essence.** List every claim, number, name, date,
   quotation, and the spine of the argument. This list is the
   contract: nothing ships that is not on it, and nothing on it gets
   dropped. Write it down and keep it — step 5 checks the draft
   against it, and a list you are holding in your head is not
   something you can check anything against.
2. **Check the list against the source** before writing a sentence.
   Hedges, caveats, and attributions are load-bearing more often than
   they look — a qualifier someone added deliberately reads as
   removable right up until it is gone. Then fill the gaps: ask the
   author for the specifics the draft only gestures at, and cut every
   claim nobody can substantiate. A rewrite invents nothing, so an
   abstraction with no fact behind it has to leave rather than be
   restated in plainer words. If that empties the list, stop and say
   so — the draft had no content, and what the author needs is the
   question, not a shorter arrangement of nothing.
3. **Distill the voice.** The author's other writing, when available,
   is the calibration target. Without a sample, if the draft is the
   author's own prose, the draft is the sample — take its rhythm,
   characteristic word choices, punctuation habits, recurring tics.
   If the draft is machine-written there is no voice to carry; use the
   plainest register the content allows.
4. **Write fresh from the Directives.** Work from the essence list and
   the voice notes, not from the original's sentences. Rereading them
   mid-draft re-anchors you to the structure you are replacing, which
   is the failure this whole mode exists to avoid. While composing,
   vary sentence length and follow a long, clause-laden build with a
   short landing — rhythm is cheaper to build in than to retrofit.
   First person where true, one anecdote, one thing that went wrong.
5. **Reconcile against the written list, item by item.** Walk the
   list and find each item in the finished draft. Memory is what lets
   items go missing — a draft reads complete whether or not it is.
   Then the reverse: nothing in the draft that is off the list, and
   quoted material verbatim. Strike anything you cut on purpose, with
   its reason, so the cut is a decision rather than an omission.
   Writing the reason down often exposes a usable instruction inside
   a claim you were cutting for being vague.
6. **Read aloud** (the one test, above).
7. **De-slop sweep as a check.** Load `references/ai-tells.md` and
   sweep. Here the sweep confirms; it does not construct, and its
   benchmark does not apply — see that file's Benchmark note. Run its
   literal-question test on every phrase that sounds finished. A
   grep matches words rather than shapes, and a fresh draft invents
   its own flourishes rather than inheriting the original's.
8. **Voice pass (last).** Does the whole read as one specific person —
   and, when the source supplied the voice sample, as *that* person?
   A rewrite that passes every other check and sounds like nobody has
   failed.

### Edit in place (the switch)

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
   section — closers are where filler hides, in every register — and
   its literal-question test on every phrase that sounds finished.
   Worked demonstration: `references/examples.md`.
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
