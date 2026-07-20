---
description: Write and edit prose that reads as human, not AI-generated. Use when writing or reviewing any public-facing copy — blog posts, landing pages, marketing copy, docs, emails, UI strings — or when asked to "de-slop" text. Contains the banned-tells catalogue (lexical + structural) and the humanization workflow.
---

# Human writing — avoiding the AI tells

LLM prose regresses to the statistical middle: uniform sentence
lengths, a recognizable lexicon, contrast scaffolds, balanced hedging,
and significance inflation. Readers now recognize the pattern and
discount the content — and search engines increasingly do the same
(thin scaled content is what core updates punish hardest). The fix is
classical line editing plus a tell-deletion pass.

Evidence base: Wikipedia's "Signs of AI writing" editor catalogue
(WP:AITELLS); Kobak et al. 2024 (excess-word frequencies in 14M PubMed
abstracts — "delve" at 28× expected rate); Liang et al. 2024
("meticulous" 34.7× in LLM-modified peer reviews); Matsui 2025 (135
tracked terms); professional editors' humanization workflows.

## The one test that catches most of it

**Read it aloud.** Fix everything you would not say to one specific
person across a table. Your breath finds the uniform rhythm, your mouth
refuses "it is recommended that," and you hear yourself droning
"furthermore." Per-sentence: "Is this how I'd say it to a friend?" If
not, say it that way instead (Paul Graham's test).

## Banned lexicon

### Tier 1 — delete on sight (flagged by 3+ independent studies/catalogues)

delve · tapestry · testament ("a testament to") · crucial · pivotal ·
meticulous · intricate/intricacies · commendable · boasts · landscape
(abstract) · realm · leverage (verb) · foster · garner · vibrant ·
groundbreaking · transformative · multifaceted · seamless(ly) · robust ·
elevate · unlock · harness · embark · journey (abstract) ·
navigate/navigating (abstract) · game-changer · synergy · supercharge ·
treasure trove · beacon · shed light · deep dive · interplay ·
pioneering · paramount · holistic · nuanced · noteworthy · profound ·
unparalleled · unwavering · nestled · "in the heart of" · cutting-edge ·
ever-evolving · bespoke · indelible · elucidate · streamline · empower ·
revolutionize · utilize · facilitate · encompass · burgeoning ·
formidable · poised · unveil · underscore · showcase

### Tier 2 — fine once, a fingerprint in clusters

additionally · comprehensive · enhance/enhancing · insights · notably ·
particularly · significant · potential · findings · compelling ·
crafted · distinctive · remarkable · innovative · imperative ·
ultimately · thorough · strategically · actionable · invaluable ·
versatile · ecosystem · milestone · "vital role" · "driving force"

### Stock phrases — delete the sentence, not just the phrase

"In today's fast-paced world" · "in a world where…" · "Now more than
ever" · "As the landscape continues to evolve" · "Let's dive in" ·
"Let's face it" · "It's no secret that" · "Here's the thing/kicker/
catch" · "Be clear-eyed about…" · "Think of it this way" · "It's
important to note" · "It's worth noting" · "That being said" · "In
conclusion" · "In summary" · "At the end of the day" · "The bottom
line" · "Whether you're a [A] or a [B]" · "What does this mean for
you?" · "The good news?" · "Not all X are created equal" · "Here's what
you need to know" · "Stay ahead of the curve" · "plays a vital/crucial/
pivotal role" · "stands as / serves as / marks / represents" (use
is/are)

## Banned structures

Each named pattern, with the rewrite move:

1. **Negative parallelism** — "It's not just X, it's Y" / "This isn't
   about X. It's about Y." / "No X. No Y. Just Z." Maximum once per
   piece, and only when the misconception is real. Rewrite: state the
   positive claim. *"This isn't about memorization. It's about
   understanding."* → *"Students who understand the pattern stop
   needing to memorize it."*
2. **Contrast scaffold one-liners / meta-discourse** — "The difference
   is X." / "That's the catch." / "That's not our line." / "Here's the
   thing." Short deictic sentences that comment on the writing instead
   of the subject. **Deletion test:** remove the sentence; if the
   paragraph loses no facts, it was scaffold — delete it or fold its
   emphasis into the content sentence ("…that number is worth reading
   twice"). Mechanical sweep:
   `grep -oE "(^|[.!?] )(That's|That is|Here's|Here is|This is|It's|It is|The (key|point|catch|kicker|result|difference|takeaway|thing)[^a-z]) [^.!?]{0,45}[.!?]" draft.md`
   — hits carrying a concrete noun, number, or name may stay; hits
   carrying only emphasis get cut.
3. **Rule-of-three padding** — triads where the third item adds
   nothing. *"rigorous, demanding, and intellectually challenging"* →
   *"demanding."* Keep a triad only when all three items carry
   distinct weight.
4. **Setup-colon-payoff** — "The result: …" / "The catch: …" / "The
   goal?" Rewrite as a plain sentence.
5. **One-word fragment drama** — *"Speed. Precision. Mastery."* Cut.
6. **Coaching imperatives** — "Be clear-eyed about…", "Remember:",
   "Ask yourself…". Performative intimacy wrapping a generic claim.
   State the fact instead.
7. **Em-dash density** — budget ~2 per 1,000 words; each must do work
   a comma or period can't. (LLMs also set them unspaced — word—word —
   in styles that space them.)
8. **Trailing "-ing" significance clauses** — "…, highlighting the
   importance of recall." Cut the clause or attribute the claim.
9. **Section-ending recaps** — closing each section by restating it.
   End on the last new fact.
10. **Thesis-preview openers (throat-clearing)** — "In this section
    we'll explore…". Start inside the idea: *"The cache was the bug.
    It usually is."*
11. **Copula avoidance** — "serves as," "boasts," "features" where
    "is" works. Plain is/are beats elegant substitutes.
12. **Synonym cycling (elegant variation)** — constraints → norms →
    confines for one concept. Repeat the right word; spend variety on
    sentence shape.
13. **Uniform rhythm** — three consecutive sentences in the same
    length band = rewrite one. Humans alternate a long, clause-laden
    build with a short landing.
14. **Both-sides hedging** — "arguably," "may vary," perfectly
    balanced qualifications. Commit. One earned hedge beats ten
    reflexive ones.
15. **Significance inflation** — "marks a pivotal moment," "reflects
    broader trends," "cementing its legacy." Show the fact; cut the
    welded-on meaning.
16. **Vague authority** — "experts argue," "industry reports." Name
    the expert or cut the claim.
17. **Bolded-phrase-plus-colon bullets** as the default list shape,
    and perfectly parallel Title-Case headings ("X and Y" × 4).
18. **Pull-quote cadence** — any line that sounds engineered to be
    quoted. *"Documentation isn't a chore — it's a love letter to your
    future self."* → *"Write the docs now. In six months you won't
    remember why you did any of this."* Human profundity is plainer
    than it could be.

## What human prose has (add these, not just delete tells)

- **Specifics over abstractions.** Every abstract claim gets a number,
  a name, a date, or a sensory fact — or gets cut. *"Comprehensive
  integration"* → *"It connects to Slack, Salesforce, and HubSpot.
  Setup takes 15 minutes."* (Zinsser: generalities mean nothing;
  McPhee: a thousand details add up to one impression.)
- **A position.** Say the thing the piece believes in the section's
  first sentence. Confidence varies with evidence, not uniformly.
- **Experience markers.** "After 200 implementations, three patterns…"
  — and what went wrong. AI drafts never volunteer failure; one
  failure note per piece is worth ten claims.
- **Controlled asides.** A parenthetical, a rhetorical question, an
  idiom — roughly one per few paragraphs. One per sentence reads like
  an AI told to be quirky.
- **Trust the reader.** Adjacent facts don't need "furthermore" —
  juxtaposition does the work, and the reader who infers the
  connection feels smart (Pinker's classic style).
- **One voice.** The word choices, the one joke, the thing the writer
  is irritated by — all belonging to the same identifiable person
  across the whole piece.

## The editing workflow (for an existing draft)

1. **Skeleton first** — remove preview paragraphs, recap endings,
   symmetrical heading grids, "challenges and future prospects"
   closers. AI structure is recognizable before a single phrase is.
2. **Read aloud**; mark everything that isn't talk.
3. **Specificity pass** — replace abstractions with numbers, names,
   dates; cut what can't be made concrete.
4. **Tell-deletion pass** — the lexicon and structure lists above.
5. **Experience pass** — first person where true, one anecdote, one
   thing that went wrong.
6. **Rhythm pass** — break length uniformity; add a fragment and one
   long run where the content earns it.
7. **Voice pass (last)** — does the whole read as one specific person?

Editors' benchmark: a real humanization pass touches 25–40% of the
draft. Below that, it still reads as AI.

## Cautions

- These are probabilistic signs, not proof — judge by density, not a
  single hit. One antithesis in a 1,200-word post is fine; one per
  section is the fingerprint.
- Don't over-sand. Deleting every distinctive sentence produces a
  different kind of slop (beige). The goal is one human voice, which
  includes occasional flourish — the test is whether you'd say it.
- Technical terms that overlap the ban list (e.g. "robust" in a stats
  context, "navigate" for literal navigation) are fine in their
  literal senses.
- When editing for a specific project, project copy rules (banned
  words, pricing canon, no-overclaim) stack on top of this skill, and
  facts/citations/links are never casualties of a style pass.
