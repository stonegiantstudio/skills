# AI tells — the de-slop catalogue

Detection signals, the patterns under each, and the rewrite move for
every pattern. Loaded by the human-writing workflow's de-slop pass.
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

## Signal 2 — structural templates

The same scaffolds, whatever the topic.

- **Negative parallelism** — "It's not just X, it's Y" / "No X. No Y.
  Just Z." Move: state the positive claim. Maximum once per piece, only
  when the misconception is real.
- **Contrast scaffold one-liners** — "The difference is X." / "That's
  the catch." Deletion test: remove the sentence; if the paragraph
  loses no facts, it was scaffold. Sweep:
  `grep -inE "(^|[.!?] )(That's|Here's|This is|It's|The (key|point|catch|kicker|difference|takeaway|thing)) [^.!?]{0,45}[.!?]" draft.md`
  Hits carrying a concrete noun, number, or name may stay.
- **Rule-of-three padding** — triads whose third item adds nothing.
  Move: keep the one word that carries the weight.
- **Setup-colon-payoff** — "The result: …" / "The goal?" Move: a plain
  sentence.
- **One-word fragment drama** — "Speed. Precision. Mastery." Move: cut.
- **Coaching imperatives** — "Remember:", "Ask yourself…". Move: state
  the fact.
- **Thesis-preview openers** — "In this section we'll explore…". Move:
  start inside the idea.
- **Section-ending recaps** — restating the section at its close. Move:
  end on the last new fact.
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
  skill reads the table regardless). The suffix group catches
  inflections ("meticulously", "embarked"):
  `grep -inE "\b(crucial|pivotal|paramount|meticulous|intricate|intricac(y|ies)|nuanced|bespoke|crafted|vibrant|dynamic|groundbreaking|transformative|game-changer|revolutionize|supercharge|delve|embark|journey|navigate|unlock|harness|elevate|empower|tapestry|landscape|realm|ecosystem|nestled|beacon|utilize|facilitate|leverage|encompass|elucidate|streamline|foster|garner|testament|profound|unparalleled|unwavering|indelible|formidable|seminal|seamless|robust|holistic|multifaceted|comprehensive|cutting-edge|ever-evolving|state-of-the-art|showcase|underscore|unveil|boasts|notably|particularly|significantly|ultimately)(s|es|d|ed|ing|ly|ies)?\b" draft.md`

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
- **Pull-quote cadence** — lines engineered to be quoted.
  "Documentation isn't a chore — it's a love letter to your future
  self." Move: "Write the docs now. In six months you won't remember
  why you did any of this." Human profundity is plainer than it could
  be.

## Benchmark

<!-- Maintenance: this benchmark is stated only here. Other files
link to it; do not restate it elsewhere. -->

A real de-slop pass touches 25–40% of the draft (this repo's working
heuristic). Below that, the draft still reads as machine output. Do not over-sand:
deleting every distinctive sentence produces beige slop instead. The
goal is one human voice, which includes occasional flourish; the test
is whether the author would say it.
