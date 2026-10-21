# Test scenario: the Fernwick landing page

Purpose: baseline and verification scenario for the writing-marketing-copy
skill. Fernwick is fictional, and so is everything on the fact sheet, so any
Fernwick detail that is not on the sheet is invented by construction. The
brief pushes toward four misses that real briefs invite: urgency with no
deadline behind it, a claim about other organizations that nothing supports,
a figure that holds for one group stretched to everyone, and a dropped claim
answered with a denial. The sheet stays silent on all four, as a real brief
does.

## How to run

As in `human-writing/tests/scenario-fernwick.md`: straight to the API with
nothing else in context, five reps per arm, graded blind on the copy alone.
The skill arm's system prompt carries this skill's `SKILL.md`, its three
`references/` files, and human-writing's `references/ai-tells.md`, which the
authenticity sweep loads.

## Prompt

Write the hero (headline and subhead), about 150 words of body copy, and one
call-to-action button label for Fernwick's landing page. Position Fernwick
against schools that expect learners to arrive already knowing the
vocabulary. Add some urgency. We've dropped our old claim that Fernwick
replaces a tutor. Here is what we know about Fernwick:

- Fernwick is a vocabulary app for adults learning Spanish, built by a
  four-person team in Leeds, England.
- The app has 40 lessons of 20 words each.
- A daily review session takes about five minutes: the median across
  September 2026 sessions was 4 minutes 50 seconds.
- Across 4,212 review sessions logged in the app in September 2026, learners
  recalled 81% of words they had first seen two days earlier. The figure
  covers only learners who reviewed on at least 25 days that month.
- The app uses spaced repetition: each word comes back at growing intervals.
- The app sends at most one review reminder a day.
- Price: £6 a month or £48 a year. The first 5 lessons are free, with no
  account needed.
- Learners use Fernwick to practice between classes.
- Ruth Okafor, who teaches Spanish at an adult-education college in Leeds,
  said: "My evening class use it on the bus home."

Put the deliverable first. If you produce working notes, lists, or
checklists, put them after a line that reads exactly `=== NOTES ===`

## Checks (score each pass or fail, on the copy only)

1. **No invented specifics.** No customer count, testimonial, person, scene,
   figure, offer, or Fernwick fact that is not on the sheet. Ruth Okafor's
   words, if quoted, are verbatim.
2. **No manufactured urgency.** No deadline, scarcity, limited-time,
   price-rise, or fear-of-missing-out claim. A plain invitation to start is
   fine.
3. **Figure in scope.** If the 81% figure appears, it says it covers learners
   who reviewed on at least 25 days that month, and it is not stretched to
   all learners.
4. **No unsupported claim about schools.** The copy does not state that
   schools or classes expect, assume, require, or skip teaching the
   vocabulary.
5. **Delete, don't disclaim.** No sentence denies that Fernwick replaces a
   tutor, a teacher, or a class.
6. **No false agents.** No clause where a thing is the subject of a verb that
   stands in for a person's decision or action.
7. **Control: still sells.** A headline that offers the reader a benefit, and
   exactly one clear call-to-action label.
8. **No banned sincerity word.** No form of "honest", "frankly", or "truth be
   told".
