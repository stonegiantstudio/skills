# AI tells — the de-slop catalogue

Detection signals, the patterns under each, and the rewrite move for
every pattern. Loaded by both human-writing workflows: as the final
check on fresh prose when rewriting from the essence, and as the
mid-pipeline de-slop pass when editing in place.
The sweep pays twice: readers discount prose that pattern-matches as
machine output, and search engines punish thin scaled content hardest
in core updates.

## Refreshing this catalogue

This file is a distillation, not the living list. Upstream:
Wikipedia's "Signs of AI writing" (WP:AITELLS, maintained by
WikiProject AI Cleanup) and the detection literature — Kobak et al.
2024, arXiv:2406.07016 ("delve" at 28× expected rate across 14M PubMed
abstracts); Liang et al. 2024, arXiv:2403.07183 ("meticulous" 34.7× in
LLM-modified peer reviews); Matsui 2025 (135 tracked terms). A
periodic pass re-derives this file against upstream and drops tells
that stop being discriminative. Never copy
upstream text in (CC BY-SA vs. this repo's Apache-2.0); cite it and
re-derive the facts.

**Limits:** this catalogue targets human readers' perception. It does
not defeat ML classifiers, and does not try to.

**False positives:** judge by clusters, not isolated hits. Perfect
grammar is not a tell. Formal vocabulary is not a tell. One antithesis
in a 1,200-word post is fine; one per section is the fingerprint.

## Scope by skill

The one place that says which signals apply when a sibling skill is
active. Skills point here; none of them restate this.

- **human-writing** — every signal applies in full.
- **writing-marketing-copy** — Signals 1 and 3–6 apply in full. Signal
  2's persuasive scaffolds (the not-X-but-Y family, rule-of-three,
  setup-colon-payoff, coaching imperatives) are direct-response craft
  when used deliberately; sweep them only when they read as filler
  rather than persuasion. False agents are not a scaffold and apply in
  full: marketing copy is where they turn up most.
- **technical-writing** — procedures and reference keep a neutral
  register and skip voice work entirely. Explanation-type docs may
  pair with human-writing, keeping one term one meaning and no
  persuasive scaffolds.

## The deletion test

Remove the sentence; if the paragraph loses no facts, it was filler.
Apply it to every sentence that closes a paragraph or section — closers
are where filler concentrates.

**Apply it to trailing clauses too, not only to whole sentences.** A
flourish that would be conspicuous standing alone hides comfortably
after a comma: "..., and the missing item is the one nobody thinks to
look for." Delete from the comma and reread. If no fact left with the
clause, it was ornament. The test is register-independent: it
catches article scaffolds ("That's the catch.") and correspondence
padding ("We'll shape it from there.") alike, including forms no
lexicon sweep can see.

## The literal-question test

Ask the phrase a literal question. A phrase that means something
answers it. A phrase that only sounds right cannot.

- "will cost you more than it returns" — more than what, in what unit?
- "the missing item is the one nobody thinks to look for" — who is
  nobody?
- "Neither noticed." — neither what? Two sessions, and a session
  notices nothing.
- "a reader arriving cold" — how does a reader arrive cold? Two real
  idioms fused into one that denotes nothing.

Every example above cleared every sweep in this file. No word in any
of them is a tell; the shape is, and a grep matches words rather than
shapes. Run this test on anything that sounds finished. Move: answer
the question in the prose, or cut the phrase.

Paradox aphorisms (Signal 6) and false agents (Signal 2) are the two
named forms this test catches most often; it is not limited to them.

## Signal 1 — predictable vocabulary

LLMs over-select the same impressive-sounding words. Replacement moves
are per cluster; pick the plain word the sentence actually needs.

### Tier 1 lexicon — delete on sight (3+ independent catalogues)

| Cluster | Words | Move |
|---|---|---|
| Fake precision | crucial, pivotal, paramount, vital role | say why it matters, or cut |
| Fake craft | meticulous, intricate/intricacies, nuanced, bespoke, crafted | name the actual work done |
| Fake energy | vibrant, dynamic, groundbreaking, transformative, game-changer, revolutionize, supercharge | state the measurable change |
| Fake motion | delve, embark, journey (abstract), navigate (abstract), deep dive, unlock, harness, elevate, empower | name the concrete action: read, start, use |
| Fake scenery | tapestry, landscape (abstract), realm, ecosystem, treasure trove, beacon, nestled, "in the heart of" | name the place or the set of things |
| Latinate bloat | utilize, facilitate, leverage (verb), encompass, elucidate, streamline, foster, garner | use, help, include, explain, simplify |
| Grandeur | testament ("a testament to"), profound, unparalleled, unwavering, indelible, formidable, seminal | the fact, stated plainly, without the plaque |
| Machine polish | seamless(ly), robust, holistic, multifaceted, comprehensive, cutting-edge, ever-evolving, state-of-the-art | the specific property: fast, complete, current |
| Stage directions | showcase, underscore, unveil, boasts, "stands as / serves as / marks / represents" | is/are, shows, has |
| Padding adverbs | notably, particularly, significantly, ultimately | usually delete outright |

### Tier 2 — fine once, a fingerprint in clusters

An index, not the authority. Where a word also has an entry under
Related structures below, that entry carries the move and the
false-positive guard; this list only says the word is worth counting.

genuinely · really · truly · actually · honestly · frankly ·
additionally · enhance/enhancing · insights · potential · findings ·
compelling · distinctive · remarkable · innovative · imperative ·
thorough · strategically · actionable · invaluable · versatile ·
milestone · "driving force" · noteworthy · commendable · burgeoning ·
poised · pioneering · interplay · shed light

### Stock phrases — delete the sentence, not just the phrase

"In today's fast-paced world" · "in a world where…" · "Now more than
ever" · "As the landscape continues to evolve" · "Let's dive in" ·
"Let's face it" · "It's no secret that" · "Here's the thing/kicker/
catch" · "Be clear-eyed about…" · "Think of it this way" · "It's
important to note" · "It's worth noting" · "That being said" · "In
conclusion" · "In summary" · "At the end of the day" · "The bottom
line" · "Whether you're a [A] or a [B]" · "What does this mean for
you?" · "The good news?" · "Not all X are created equal" · "Here's
what you need to know" · "Stay ahead of the curve"

### Related structures

- **Copula avoidance** — "serves as," "boasts," "features" where "is"
  works. Move: plain is/are.
- **Synonym cycling** — constraints → norms → confines for one concept.
  Move: repeat the right word; spend variety on sentence shape.
- **Nominalization** — the action buried in a noun, usually ending
  `-tion`, `-ment`, `-ance`, `-ity`: "the implementation of the
  migration resulted in a reduction of latency." Move: put the action
  back in the verb — "migrating cut latency." Detection side of the
  Williams directive in `SKILL.md`. Not a tell when the noun names a
  thing instead of hiding an act: a deployment, a migration, and an
  authentication flow are objects in the system, and rewriting them
  into verbs costs precision.
- **Noun piles** — three or more nouns modifying each other:
  "customer engagement optimization framework," "content delivery
  performance baseline." Each noun makes the reader guess which one is
  the head. Move: break the stack with a verb or a preposition — "a
  framework for keeping customers engaged." Established compound terms
  are exempt: "content delivery network" and "cross site request
  forgery token" are names, not stacks.
- **Filler intensifiers** — genuinely, really, truly, actually. They
  assert conviction where evidence belongs, and the sentence keeps its
  meaning without them. Move: delete. Tier 2 rather than Tier 1 —
  speech runs on these, so one in a paragraph is voice and three is
  the fingerprint.
- **Sincerity prefaces** — honestly, frankly, to be honest, truth be
  told. Distinct from the intensifiers above: these imply the
  surrounding prose was not candid, which is both false and unflattering
  to the writer. They carry no information in any position. Move:
  delete the word and start on the next one; the sentence is shorter
  every time. Sweep every grammatical position, not just the sentence
  opener — the adverbial use mid-clause ("comments honestly describing
  a compromise") is the one that survives a preface-only check. The
  adjective keeps its meaning and stays: an honest mistake, honest
  work.
  `grep -inE "\b(honest(ly)?|frankly|truth be told)\b" draft.md`

## Signal 2 — structural templates

The same scaffolds, whatever the topic.

- **The not-X-but-Y family** — the most recognizable current LLM
  construction. Four surface forms, one underlying move:
  - *Negative parallelism* — "It's not just X, it's Y."
  - *Corrective negation* — "X isn't about A. It's about B." The
    correction answers an objection no reader raised.
  - *Antithesis* — two clauses balanced on a hinge: "not with a bang
    but a whimper."
  - *Negative anaphora* — "No X. No Y. Just Z."

  Move: state the positive claim by itself and let it stand. Keep at
  most one instance per piece, and only where the misconception is one
  a real reader holds. Sweep catches the first three forms; negative
  anaphora needs the eye, since a bare "No" opening is too common to
  grep. Best-effort like the Tier-1 sweep — plain negation followed by
  a contrast ("we did not ship it but we learned") hits and is fine:
  `grep -inE "\b(not just|isn'?t (just|about)|is not (just|about)|not ([a-z]+ ){1,3}but)\b" draft.md`
- **Contrast scaffold one-liners** — "The difference is X." / "That's
  the catch." The deletion test (above) decides. Sweep:
  `grep -inE "(^|[.!?] )(That's|Here's|This is|It's|The (key|point|catch|kicker|difference|takeaway|thing)) [^.!?]{0,45}[.!?]" draft.md`
  Hits carrying a concrete noun, number, or name may stay.
- **Rule-of-three padding** — triads whose third item adds nothing.
  Move: keep the one word that carries the weight.
- **Setup-colon-payoff** — "The result: …" / "The goal?" Move: a plain
  sentence.
- **One-word fragment drama** — "Speed. Precision. Mastery." Move: cut.
- **False agents** — a non-person subject standing in for the person who
  decided or acted, in any clause, not only a short landing sentence. They
  turn up most in product copy: the product is the topic, so the writer
  puts the product, the page, or the table in the subject slot and gives
  it a person's verb.
  This is the detection side of the Williams directive in `SKILL.md`,
  characters as subjects and actions as verbs.
  - *Examples.* "Three of the games moved onto 3D boards." Games don't
    move; a team rebuilt them. Same with "the update reached six games,"
    "the post compares the options," "the app calls it a streak," "the
    pricing page added a free tier," "the system knows," "the process
    caught it." The short-landing form is **agentless punch**: "Neither
    noticed." Neither what? Two sessions, and a session notices nothing.
    A writer doing the rhythm pass reaches for a decisive short sentence
    before there is a subject to put in it.
  - *Pair test.* Read each clause's subject and verb alone ("games
    moved," "post compares") and ask: is a person's decision or action
    hiding behind this verb? If so, that person is the subject. Writers
    miss it most in second clauses ("…, and the questions match your
    level"), so test every clause, not only the openers. The test leaves
    evidence: list each clause whose subject is not a person, with keep
    or rewrite beside it. No list means the test did not run.
  - *Move.* Make the actor the subject: the writer's company ("we rebuilt
    three of the games in 3D"), the reader ("you score the same way"), or
    a named person or organization ("Google added WebGL to Chrome in
    version 9"). Don't escape into the passive ("three games were
    rebuilt"); it hides the actor instead of naming it. When the actor is
    unknown or beside the point, state the fact as a state: "the site has
    had a 3D mode since 2026."
  - *Not a tell.* States (is, has, contains, costs, lasts, depends on,
    takes a duration); literal physical events (the ball bounces, the
    paddle grows); characters acting inside a story or game; a publisher
    as speaker ("MDN notes"); quoted text; a tool or change as the cause
    of an effect ("caching cut p95 latency in half"). Software or a step
    doing its job also stays wherever no person made the call: in
    technical or instructional prose ("the function returns a list," "a
    grep matches words") and in product copy ("the app reminds you each
    evening"). The test targets the verbs that stand in for someone's
    decision.
  - *Sweep* (best-effort; proper names such as product names slip past
    any word list, so the pair test is the check):
    `grep -inE "\b((the|this|that|our|your|each|every|a|an|its|their|these|those|all|some|both|two|three|four|five|six|seven)\s+)?((new|free|old|latest|first|next|main|whole)\s+)?(tables?|charts?|posts?|pages?|articles?|guides?|sections?|lists?|panels?|switch(es)?|buttons?|updates?|releases?|games?|apps?|tools?|boards?|features?|tiers?|plans?|courses?|systems?|process(es)?|dashboards?|questions?|reports?|data|products?|platform|site)\s+(shows?|showed|covers?|covered|compares?|compared|moves?|moved|keeps?|kept|asks?|asked|calls?|called|lets?|uses?|used|offers?|offered|hands?|handed|brings?|brought|gives?|gave|reach(es)?|reached|walks?|walked|takes?|took|teach(es)?|taught|helps?|helped|makes?|made|wants?|wanted|knows?|knew|decides?|decided|builds?|built|catch(es)?|caught|notices?|noticed|match(es)?|matched|stays?|stayed|sits?|sat|draws?|drew)\b" draft.md`
- **Coaching imperatives** — "Remember:", "Ask yourself…". Move: state
  the fact.
- **Thesis-preview openers** — "In this section we'll explore…". Move:
  start inside the idea.
- **Section-ending recaps** — restating the section at its close. Move:
  end on the last new fact.
- **Social closers (correspondence register)** — the warm, contentless
  sentence that ends an email section: "We'll shape it from there,"
  "Whatever works for you," "Happy to adjust as needed." Email
  convention makes them invisible — they read as normal inside
  correspondence — but they fail the deletion test the same way
  scaffolds do: they never carried a fact. Move: end on the last
  concrete fact or the actual ask; at most one closer per message, in
  the author's own voice.
- **Bold-phrase-plus-colon bullets** as the default list shape, and
  perfectly parallel Title-Case headings. Move: vary list shapes; let
  headings be sentences when that reads better.

## Signal 3 — uniform rhythm and punctuation

- **Uniform sentence length** — three consecutive sentences in the same
  length band. Move: rewrite one; follow a long build with a short
  landing (Provost's demonstration).
- **Em-dash density** — detection signal: roughly 2 per 1,000 words as
  the baseline for edited human prose, with LLM drafts running several
  times that, often unspaced (word—word) in styles that space them.
  The numbers are this repo's working heuristics, not published
  findings; judge direction, not decimals. Move: comma, period, or
  parentheses unless the dash does work they cannot.
- **Tier-1 sweep** — a bulk-sweep convenience derived from the Tier-1
  table; the table is the authority (multiword phrases like "vital
  role" and "deep dive" live only there, and an agent following this
  skill reads the table regardless). Per-stem alternations cover the
  common inflections; treat the regex as best-effort, never as proof
  of a clean draft:
  `grep -inE "\b(crucial(ly)?|pivotal|paramount|meticulous(ly)?|intricate(ly)?|intricac(y|ies)|nuanced?|bespoke|craft(ed|ing)|vibrant|dynamic(ally)?|groundbreaking|transformativ(e|ely)|game-chang(er|ers|ing)|revolutioniz(e|es|ed|ing)|supercharg(e|es|ed|ing)|delv(e|es|ed|ing)|embark(s|ed|ing)?|journey(s|ed|ing)?|navigat(e|es|ed|ing)|unlock(s|ed|ing)?|harness(es|ed|ing)?|elevat(e|es|ed|ing)|empower(s|ed|ing|ment)?|tapestr(y|ies)|landscapes?|realms?|ecosystems?|nestled|beacons?|utiliz(e|es|ed|ing|ation)|facilitat(e|es|ed|ing|ion)|leverag(e|es|ed|ing)|encompass(es|ed|ing)?|elucidat(e|es|ed|ing)|streamlin(e|es|ed|ing)|foster(s|ed|ing)?|garner(s|ed|ing)?|testament|profound(ly)?|unparalleled|unwavering|indelibl[ey]|formidabl[ey]|seminal|seamless(ly)?|robust(ly|ness)?|holistic(ally)?|multifaceted|comprehensive(ly)?|cutting-edge|ever-evolving|state-of-the-art|showcas(e|es|ed|ing)|underscor(e|es|ed|ing)|unveil(s|ed|ing)?|boast(s|ed|ing)?|notably|particularly|significantly|ultimately)\b" draft.md`

## Signal 4 — reflexive hedging

- **Both-sides hedging** — "arguably," "may vary," perfectly balanced
  qualifications. Move: commit. One earned hedge beats ten reflexive
  ones.
- **Over-qualification** — "generally speaking," "in most cases," "it
  could be argued." Move: delete unless factually necessary.

## Signal 5 — missing specificity

- **Vague authority** — "experts argue," "industry reports." Move: name
  the expert or cut the claim.
- **Trailing "-ing" significance clauses** — "…, highlighting the
  importance of recall." Move: cut the clause or attribute the claim.
- **Abstraction stacks** — claims with no number, name, date, or
  sensory fact anywhere near them. Move: ground or cut.

## Signal 6 — significance inflation

- **Welded-on meaning** — "marks a pivotal moment," "reflects broader
  trends," "cementing its legacy." Move: show the fact; cut the
  meaning.
- **Paradox aphorisms** — a balanced, knowing formulation that sounds
  like insight and cannot be checked: "the missing item is the one
  nobody thinks to look for," "the hardest bugs are the ones you
  cannot see," "you don't know what you don't know." The shape carries
  the authority and the content is empty. No word in them is a tell,
  so they clear every lexicon sweep, and they favour trailing clauses
  where a deletion test aimed at closing sentences never reaches them.
  Move: cut the clause. If it was doing work, say the work plainly —
  "check against the written list, not from memory" beats any
  observation about what nobody thinks to look for.
- **Pull-quote cadence** — lines engineered to be quoted.
  "Documentation isn't a chore — it's a love letter to your future
  self." Move: "Write the docs now. In six months you won't remember
  why you did any of this."

## Benchmark

<!-- Maintenance: this benchmark is stated only here. Other files
link to it; do not restate it elsewhere. -->

A real de-slop pass touches 25–40% of the draft (this repo's working
heuristic). Below that, the draft still reads as machine output. Do not over-sand:
deleting every distinctive sentence produces beige slop instead. The
goal is one human voice, which includes occasional flourish; the test
is whether the author would say it.

**Scope: edit-in-place only.** The percentage assumes a retained
skeleton, so it means nothing under human-writing's default mode,
where the draft is rewritten from its distilled essence and every
sentence is new. Applying it there inverts its purpose — it would read
as a ceiling to stay under. In rewrite mode this catalogue is a check
on fresh prose, and the only target is that no signal survives.
