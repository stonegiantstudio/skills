# Writing Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `skills/human-writing/` positive-first and add a new `skills/technical-writing/` skill, per `docs/specs/2026-07-20-writing-skills-design.md`.

**Architecture:** Each skill is a `SKILL.md` plus `references/` files under `skills/<name>/`. `scripts/sync-plugin-skills.mjs` generates the plugin copies and `skills.sh.json`; `README.md` and `CHANGELOG.md` are hand-maintained. Every task ends with a passing self-check and a commit.

**Tech Stack:** Markdown skill files, Node sync script (`npm run sync:plugin-skills`), grep-based self-checks.

## Global Constraints

- Branch: `feat/human-writing-skill`. Do not push without asking the user.
- Size budgets (from the spec): human-writing `SKILL.md` ≤150 lines; `ai-tells.md` ≤250; `examples.md` ≤120; technical-writing `SKILL.md` ≤120; `doc-types.md` ≤200.
- **Self-check greps** (run against both `SKILL.md` files; zero hits required; `ai-tells.md` and `examples.md` are exempt by construction):

  ```sh
  grep -inwE "delve|tapestry|pivotal|meticulous|seamless(ly)?|robust|leverage|foster|garner|vibrant|groundbreaking|transformative|multifaceted|elevate|unlock|harness|embark|holistic|nuanced|paramount|utilize|facilitate|underscore|showcase" \
    skills/human-writing/SKILL.md skills/technical-writing/SKILL.md
  grep -inE "(^|[.!?] )(That's|Here's|This is|It's|The (key|point|catch|kicker|difference|takeaway|thing)) [^.!?]{0,45}[.!?]" \
    skills/human-writing/SKILL.md skills/technical-writing/SKILL.md
  ```

- After any change under `skills/` or the canonical manifests, run `npm run sync:plugin-skills` before committing, and stage the regenerated files.
- No quoted passage from a copyrighted source longer than a short attributed phrase. No STE dictionary content. Orwell's rules are the only extended quotation.
- Commit messages: conventional prefixes, no "honestly"-style framing, matter-of-fact body.

---

### Task 1: Rewrite `skills/human-writing/SKILL.md` positive-first

**Files:**
- Modify: `skills/human-writing/SKILL.md` (full replacement)

**Interfaces:**
- Produces: `references/ai-tells.md` and `references/examples.md` are referenced by path; Tasks 2–3 must create exactly those filenames.

- [ ] **Step 1: Replace the file with this exact content**

````markdown
---
name: human-writing
description: Write and edit prose with a human voice — clear, specific, and owned by one identifiable writer. Directives distilled from Zinsser, Strunk & White, Williams, and Pinker, plus a de-slop workflow for AI-flavored drafts. Use for blog posts, landing pages, docs prose, emails, UI strings, or when asked to "de-slop", "humanize", or fix "AI-sounding" text.
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
2. **Read aloud.** Mark everything that is not talk.
3. **Specificity pass.** Replace abstractions with numbers, names,
   dates; cut what cannot be made concrete.
4. **De-slop pass.** Load `references/ai-tells.md` and sweep the draft
   against it. Worked demonstration: `references/examples.md`.
5. **Experience pass.** First person where true, one anecdote, one
   thing that went wrong.
6. **Rhythm pass.** Vary sentence length; follow a long, clause-laden
   build with a short landing. Let commas and periods do the work; keep
   only the dash doing work they cannot.
7. **Voice pass (last).** Does the whole read as one specific person?

A real pass touches 25–40% of the draft. Below that, it still reads as
machine output.

## When siblings load

- With `writing-marketing-copy`: persuasive structures get license, but
  the Tier-1 lexicon in `references/ai-tells.md` still applies.
- With `technical-writing`: explanation-type docs may use both;
  procedures and reference sections keep a neutral register and skip
  voice work.
- `writing-markdown` governs formatting; it stacks cleanly with this
  skill.

## Caution

These directives are probabilistic, not laws. Technical senses of
flagged words stay ("navigate" for literal navigation). And Orwell's
sixth rule closes every list of rules, including this one: "Break any
of these rules sooner than say anything outright barbarous."
````

- [ ] **Step 2: Run the self-check greps from Global Constraints**

Run both greps with only `skills/human-writing/SKILL.md` as the target (technical-writing does not exist yet).
Expected: no output, exit code 1 from grep (no matches).

- [ ] **Step 3: Verify the positive-first criterion and budget**

Run: `wc -l skills/human-writing/SKILL.md`
Expected: ≤150 lines. Confirm by reading: all Directives sections appear before the first mention of `ai-tells.md`.

- [ ] **Step 4: Sync and commit**

```bash
npm run sync:plugin-skills
git add skills/human-writing plugins/stone-giant/skills/human-writing
git commit -m "refactor(human-writing): restructure positive-first around Zinsser, Strunk & White, Williams, Pinker

SKILL.md now leads with directives (sentence mechanics, why they work,
the writer's posture), voice calibration, and the editing workflow. The
tells catalogue moves to references/ai-tells.md in the next commit; the
workflow's de-slop pass points there."
```

---

### Task 2: Create `skills/human-writing/references/ai-tells.md`

**Files:**
- Create: `skills/human-writing/references/ai-tells.md`

**Interfaces:**
- Consumes: referenced by `SKILL.md` workflow pass 4 (Task 1).
- Produces: the grep sweeps quoted in Global Constraints live here verbatim.

- [ ] **Step 1: Create the file with this exact content**

````markdown
# AI tells — the de-slop catalogue

Detection signals, the patterns under each, and the rewrite move for
every pattern. Loaded by the human-writing workflow's de-slop pass.

## Refreshing this catalogue

This file is a distillation, not the living list. Upstream:
Wikipedia's "Signs of AI writing" (WP:AITELLS, maintained by
WikiProject AI Cleanup) and the detection literature — Kobak et al.
2024 ("delve" at 28× expected rate across 14M PubMed abstracts), Liang
et al. 2024 ("meticulous" 34.7× in LLM-modified peer reviews), Matsui
2025 (135 tracked terms). A periodic pass re-derives this file against
upstream and drops tells that stop being discriminative. Never copy
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
| Padding adverbs | notably, particularly, significantly, ultimately, seamlessly | usually delete outright |

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
- **Em-dash density** — detection signal: ~2 per 1,000 words is the
  human baseline in edited prose; LLM drafts run 3–5×, often unspaced
  (word—word) in styles that space them. Move: comma, period, or
  parentheses unless the dash does work they cannot.
- **Tier-1 sweep:**
  `grep -inwE "delve|tapestry|pivotal|meticulous|seamless(ly)?|robust|leverage|foster|garner|vibrant|groundbreaking|transformative|multifaceted|elevate|unlock|harness|embark|holistic|nuanced|paramount|utilize|facilitate|underscore|showcase" draft.md`

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

A real de-slop pass touches 25–40% of the draft. Below that, the draft
still reads as machine output. Do not over-sand: deleting every
distinctive sentence produces beige slop instead. The goal is one human
voice, which includes occasional flourish; the test is whether the
author would say it.
````

- [ ] **Step 2: Verify budget and required content**

Run: `wc -l skills/human-writing/references/ai-tells.md`
Expected: ≤250 lines.
Confirm by reading: refresh note present at top; all six signals present; both grep sweeps present verbatim (they must match Global Constraints); false-positives paragraph present.

- [ ] **Step 3: Sync and commit**

```bash
npm run sync:plugin-skills
git add skills/human-writing plugins/stone-giant/skills/human-writing
git commit -m "feat(human-writing): add references/ai-tells.md, the de-slop catalogue

The former ban lists, reorganized by detection signal (vocabulary,
structure, rhythm, hedging, specificity, inflation) with a replacement
move per cluster, false-positive guidance, grep sweeps, and a refresh
note naming WP:AITELLS and the detection literature as upstream."
```

---

### Task 3: Create `references/examples.md`, update README and CHANGELOG

**Files:**
- Create: `skills/human-writing/references/examples.md`
- Modify: `README.md` (human-writing line)
- Modify: `CHANGELOG.md` (human-writing entry)

**Interfaces:**
- Consumes: directive names from Task 1, signal names from Task 2 (annotations must use them exactly).

- [ ] **Step 1: Create the file with this exact content**

````markdown
# Worked example — one full de-slop pass

Before (247 words, written for this file as a typical AI draft), after
(the edited result), and the annotations. The pass touches ~35% of the
draft, inside the 25–40% benchmark.

## Before

> In today's fast-paced development landscape, choosing the right
> caching strategy is crucial. It's not just about performance — it's
> about delivering a seamless user experience. Let's delve into how we
> approached this challenge.
>
> Our team embarked on a comprehensive evaluation of the available
> options. We meticulously compared Redis, Memcached, and in-process
> caching, carefully weighing the intricate trade-offs of each
> approach. Ultimately, we selected Redis for its robust feature set
> and vibrant ecosystem.
>
> The results were transformative. Response times improved
> significantly, highlighting the importance of a well-designed caching
> layer. Additionally, our infrastructure costs decreased, underscoring
> the value of this pivotal architectural decision.
>
> It's worth noting that caching isn't a silver bullet. There are
> nuanced considerations around invalidation — arguably the hardest
> problem in computer science. Whether you're a startup or an
> enterprise, it's important to carefully evaluate your specific needs.
>
> In conclusion, our journey to a better caching strategy was a
> testament to the power of methodical engineering. The landscape will
> continue to evolve, but the fundamentals remain paramount.

## After

> We rebuilt our caching layer last quarter. The p95 on the dashboard
> API was 900ms; it needed to be under 200ms.
>
> We tried three options. In-process caching was fastest but died on
> every deploy — twelve times a day. Memcached fixed that but lacks the
> sorted sets our leaderboard queries need. Redis has them, so Redis
> won, mostly by elimination.
>
> The p95 dropped to 140ms and the RDS bill fell 30% because the read
> replicas went from three to one.
>
> Invalidation is still the hard part. We got it wrong twice: stale
> session data the first week, then a cache stampede when a popular key
> expired during a traffic spike. Key-versioning fixed the first;
> jittered TTLs fixed the second.
>
> The strategy is unglamorous: cache reads behind a version key, jitter
> every TTL, and measure before touching anything else.

## Annotations

| Edit | Tell removed (signal) | Directive applied |
|---|---|---|
| Opening rewritten around 900ms → 200ms | "In today's fast-paced…" stock opener (S1); thesis-preview (S2) | Take a position and say it first; start inside the idea |
| "crucial… seamless… delve" cut | Tier-1 lexicon (S1) | Prefer definite, specific, concrete language |
| "It's not just about X — it's about Y" cut | Negative parallelism (S2) | Put statements in positive form |
| Vendor comparison rewritten with failure modes | "meticulously… intricate" (S1); no specifics (S5) | Ground every abstraction; volunteer one failure |
| "The results were transformative" → measured numbers | Significance inflation (S6); "highlighting the importance" trailing clause (S5) | End on the emphatic word |
| "It's worth noting… arguably… Whether you're a…" cut | Stock phrases, both-sides hedging (S1, S4) | Commit; write for one person |
| "In conclusion… testament… landscape… paramount" cut | Recap ending (S2); Tier-1 lexicon (S1) | End on the last new fact |
| Sentence lengths varied; two short landings added | Uniform rhythm (S3) | Rhythm pass |
````

- [ ] **Step 2: Update README.md**

Replace the line added at import time:

```markdown
- **human-writing** — prose that doesn't read as AI: the banned-tells catalogue and a de-slopping workflow
```

with:

```markdown
- **human-writing** — prose with a human voice, built on Zinsser, Strunk & White, Williams, and Pinker; the de-slop tells catalogue is the reference, not the skill
```

- [ ] **Step 3: Update CHANGELOG.md**

Replace the existing `[Unreleased] > Added` human-writing entry (the one starting `- **human-writing** — Write and edit prose that reads as human rather than`) with:

```markdown
- **human-writing** — Write prose with a human voice. Positive-first
  directives distilled from Zinsser, Strunk & White, Williams, and Pinker
  (sentence mechanics, why they work, the writer's posture), voice
  calibration, and a seven-pass editing workflow. The AI-tells catalogue
  (six detection signals, per-cluster replacement moves, false-positive
  guidance, grep sweeps, WP:AITELLS refresh note) moves to
  references/ai-tells.md, with a worked before/after pass in
  references/examples.md.
```

- [ ] **Step 4: Verify budget, sync, commit**

Run: `wc -l skills/human-writing/references/examples.md` — expected ≤120 lines.

```bash
npm run sync:plugin-skills
git add skills/human-writing plugins/stone-giant/skills/human-writing README.md CHANGELOG.md
git commit -m "feat(human-writing): add worked before/after example; update README and CHANGELOG

One annotated de-slop pass touching ~35% of a 247-word draft, each edit
naming the tell removed and the directive applied."
```

---

### Task 4: Create `skills/technical-writing/SKILL.md`

**Files:**
- Create: `skills/technical-writing/SKILL.md`

**Interfaces:**
- Produces: `references/doc-types.md` referenced by path; Task 5 must create exactly that filename.

- [ ] **Step 1: Create the file with this exact content**

````markdown
---
name: technical-writing
description: Write clear technical documentation — READMEs, runbooks, how-to guides, API references, procedures. Sentence discipline from ASD-STE100 principles (one instruction per sentence, one term one meaning), Diátaxis doc types, and a fresh-reader review step. Use when writing or reviewing documentation, a runbook, a procedure, API docs, or a README.
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

Structures and skeletons: `references/doc-types.md`. Explanation-type
docs may also load `human-writing` for voice; procedures and reference
keep a neutral register.

## Review

1. **Fresh-reader test.** Give the doc to someone who was not in the
   room — a colleague or a fresh agent session with no other context.
   They follow it cold and mark every stall. Each stall is a defect in
   the doc, not in the reader.
2. **Quality rubric.** Score against the IBM characteristics in
   `references/doc-types.md`: task orientation, accuracy, completeness,
   clarity, retrievability.
3. **Mechanical gate (optional).** If Vale is installed, run it with
   the Google or Microsoft style package; a starter `.vale.ini` is in
   `references/doc-types.md`. When Vale is absent, the rubric alone is
   the gate — the discipline does not depend on the tool.

## When siblings load

- `human-writing` — voice-ful prose (blog posts, explanations).
- `writing-markdown` — markdown formatting and lint rules.
- `writing-marketing-copy` — persuasion. Marketing claims do not
  belong in documentation.
````

- [ ] **Step 2: Run the self-check greps from Global Constraints**

Run both greps against both SKILL.md files (both now exist).
Expected: no output from either grep.

- [ ] **Step 3: Verify budget**

Run: `wc -l skills/technical-writing/SKILL.md`
Expected: ≤120 lines.

- [ ] **Step 4: Sync and commit**

```bash
npm run sync:plugin-skills
git add skills/technical-writing plugins/stone-giant/skills/technical-writing skills.sh.json
git commit -m "feat: add technical-writing skill

Sentence discipline distilled from ASD-STE100 principles (one
instruction per sentence, one term one meaning, warnings before steps),
the every-page-is-page-one reader model, Diátaxis doc types, and a
review flow of fresh-reader test, IBM quality rubric, and an optional
Vale gate. The STE dictionary is not reproduced."
```

---

### Task 5: Create `references/doc-types.md`, update README and CHANGELOG

**Files:**
- Create: `skills/technical-writing/references/doc-types.md`
- Modify: `README.md` (add technical-writing line)
- Modify: `CHANGELOG.md` (add technical-writing entry)

**Interfaces:**
- Consumes: doc-type names and rubric names from Task 4 (must match exactly).

- [ ] **Step 1: Create the file with this exact content**

````markdown
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
````

- [ ] **Step 2: Update README.md**

Directly under the human-writing line (from Task 3), add:

```markdown
- **technical-writing** — documentation that readers can follow: STE-derived sentence discipline, Diátaxis doc types, fresh-reader review
```

- [ ] **Step 3: Update CHANGELOG.md**

In `[Unreleased] > Added`, directly under the human-writing entry, add:

```markdown
- **technical-writing** — Write documentation readers can follow.
  Sentence discipline distilled from ASD-STE100 principles (one
  instruction per sentence, active voice, one term one meaning, warnings
  before steps), the every-page-is-page-one reader model, Diátaxis doc
  types with skeleton templates, the IBM quality rubric, and an optional
  Vale mechanical gate with a starter config.
```

- [ ] **Step 4: Verify budget, sync, commit**

Run: `wc -l skills/technical-writing/references/doc-types.md` — expected ≤200 lines.

```bash
npm run sync:plugin-skills
git add skills/technical-writing plugins/stone-giant/skills/technical-writing README.md CHANGELOG.md
git commit -m "feat(technical-writing): add doc-type skeletons, review rubric, Vale starter config

Per-type structure for tutorial, how-to, reference, and explanation;
the IBM quality characteristics as a scored rubric; a starter .vale.ini
with the Google package and a no-tool fallback."
```

---

### Task 6: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Sync check**

Run: `npm run sync:plugin-skills:check`
Expected: "Generated files are up to date."

- [ ] **Step 2: Full self-check**

Run both Global Constraints greps against both SKILL.md files.
Expected: no output. Also verify by reading: every em-dash in both SKILL.md files survives the comma-or-period test.

- [ ] **Step 3: Fresh-agent runbook test**

Dispatch a subagent whose prompt contains only `skills/technical-writing/SKILL.md`'s content plus: "Write a runbook for restarting a stuck queue worker (assume a systemd service named worker; drain jobs first; a warning applies before the restart step)." Verify the output: names its doc type, one action per step, warning placed before the restart step, active voice, consistent terminology.
Expected: all four properties hold. If any fail, the SKILL.md discipline section is unclear — fix the wording, re-run, and amend Task 4's commit reasoning in a follow-up commit.

- [ ] **Step 4: Spec success-criteria sweep**

Read `docs/specs/2026-07-20-writing-skills-design.md` "Success criteria" and confirm each holds. The post-merge criterion (delete `~/.claude/skills/human-writing/`) waits for the merge; note it for the user rather than doing it now.

- [ ] **Step 5: Report**

Summarize commits and verification results to the user. Ask before pushing or opening a PR.
