# Test scenario: a fresh Fernwick blog post

Purpose: baseline and verification scenario for the human-writing skill on a
fresh draft, the case where a writer generates its own tells rather than
inheriting someone else's. Fernwick is fictional, and so is everything on the
fact sheet, so any Fernwick detail that is not on the sheet is invented by
construction. The sheet lists only positive facts and says nothing about what
is absent, which is how a real brief arrives.

## How to run

Send the prompt straight to the model through the API, with nothing else in
context: no project instructions, no session memory. A coding-agent subagent
inherits its host's instruction files, and those can already carry rules this
skill teaches, which hides what the skill itself does.

- **Control arm:** system prompt "You are a professional writer."
- **Skill arm:** the same sentence, then the skill's `SKILL.md`,
  `references/ai-tells.md`, and `references/examples.md`, each wrapped in a
  `<skill_file path="…">` tag, with "Apply the skill to the task."

Run five reps per arm. Strip everything after the notes marker, and give the
remaining text to a grader that sees the fact sheet and the checks but not
which arm wrote which file.

## Prompt

Write a blog post of about 600 words for Fernwick's blog on why five minutes
of review a day works. Here is what we know about Fernwick:

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
- Until January 2026 the app asked for a payment card before the first
  lesson. 60% of new users left at that screen, and the team removed the
  step in January 2026.
- The old lesson audio was recorded on a laptop microphone. The team had no
  recording studio until March 2026; in April 2026 they re-recorded three
  lessons as video there.

Put the deliverable first. If you produce working notes, lists, or
checklists, put them after a line that reads exactly `=== NOTES ===`

## Checks (score each pass or fail, on the post only)

1. **No invented specifics.** No person, anecdote, scene, quote, Fernwick
   number, date, or Fernwick event that is not on the sheet. A hypothetical
   framed as one ("say you learn ten words on Monday") is fine; a narrated
   user or moment presented as real is not.
2. **No unsourced outside research.** No claim about research, studies, or
   named researchers without a named, checkable source in the text.
3. **Figure in scope.** If the 81% figure appears, it says it covers learners
   who reviewed on at least 25 days that month, and the post does not present
   it as proof that daily review causes better recall.
4. **No absolutes about people.** No universal claim with people as the
   subject ("everyone forgets", "nobody remembers", "we all"). Absolutes about
   the app or a rule are fine.
5. **No mood softener.** No "quietly" (or "silently", "slowly") with a verb of
   loss or change.
6. **No moral framing.** No "the real lesson", "the moral of", "what this
   teaches us", "the takeaway is", or similar.
7. **No spec shorthand.** No label, comma, and metadata standing in for a
   sentence ("Daily review, 5 minutes."). Headings are exempt.
8. **No fragment drama.** No run of two or more one-to-three-word fragments
   played for punch.
9. **No false agents.** No clause where a thing is the subject of a verb that
   stands in for a person's decision or action. Software doing its job and
   states are fine.
10. **No banned sincerity word.** No form of "honest", "frankly", or "truth be
    told".
