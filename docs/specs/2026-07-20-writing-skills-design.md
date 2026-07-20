# Design: human-writing restructure + technical-writing skill

Date: 2026-07-20
Branch: `feat/human-writing-skill`
Status: approved pending final spec review

## Problem

The imported `human-writing` skill (commit `db1c266`) is organized as ban
lists: ~130 banned words, ~30 stock phrases, and 18 banned structures come
first; the positive section is buried fourth of six. A writer following it
learns what to avoid before learning what to do. It also has no worked
example, no mechanical sweep beyond one grep, an em-dash rule it violates
itself, and no stated relationship to its sibling writing skills.

Separately, the repo has no technical-writing skill. `writing-markdown`
covers formatting and `writing-marketing-copy` covers persuasion; nothing
covers procedures, runbooks, READMEs, API docs, or doc structure.

## Decisions made

1. **Tells move to `references/ai-tells.md`.** `SKILL.md` becomes
   positive-first; the catalogue loads on demand for de-slop passes.
2. **technical-writing is a separate skill, built in this same branch.**
   STE's goals (voice suppression, zero ambiguity) are near-opposite to
   human-writing's (one identifiable voice); one skill cannot serve both.
3. **technical-writing is STE-informed but broad** — general docs work,
   with STE principles as the sentence discipline, not a strict STE
   implementation. The copyrighted STE dictionary is not reproduced.
4. **Community survey folded in** (see Inputs below) with a bloat guard:
   lexicon replacement moves are per-cluster, not per-word.

## Inputs

- Books: Zinsser (*On Writing Well*), Strunk & White (*Elements of
  Style*), Williams (*Style: Toward Clarity and Grace*), Pinker (*The
  Sense of Style*), Orwell ("Politics and the English Language"), Provost
  (rhythm passage), McPhee, Graham ("Write Like You Talk"). For
  technical-writing: *Docs for Developers*, Baker (*Every Page Is Page
  One*), IBM (*Developing Quality Technical Information*).
- Style guides: Google developer docs style guide, Microsoft Writing
  Style Guide, plainlanguage.gov, ASD-STE100 (principles only), Diátaxis.
- Community: blader/humanizer (pair every ban with a reconstruction move;
  false-positive guidance; voice calibration), harshaneel/humanize
  (organize tells by detection signal: burstiness, hedging, specificity,
  perplexity), anthropics doc-coauthoring (fresh-reader test), Vale
  prose linter (mechanical enforcement with Google/Microsoft/proselint
  packages).
- Evidence base already in the skill: WP:AITELLS, Kobak et al. 2024,
  Liang et al. 2024, Matsui 2025.

## Deliverable A: `skills/human-writing/` restructured

### `SKILL.md` (positive-first, ≤150 lines)

1. **Stance** — writing is clarity extended as a courtesy to one specific
   reader. The read-aloud test stays as the one test.
2. **Directives**, three legs, each attributed:
   - *Sentence mechanics (Strunk & White):* omit needless words; active
     voice; put statements in positive form; definite, specific, concrete
     language; end on the emphatic word; one topic per paragraph; plain
     is/are.
   - *Why the mechanics work (Williams, Pinker):* characters as subjects,
     actions as verbs; old information before new; end-focus; classic
     style (writer and reader as equals); the curse of knowledge as the
     root cause of unclear prose.
   - *Writer's posture (Zinsser, Graham, McPhee):* simplicity — strip
     every sentence to its cleanest components; write for one person;
     have a position and say it first; unity of voice, tense, pronoun;
     specifics over abstractions; experience markers including one
     failure note; rewriting is the writing.
   Existing "What human prose has" content merges into these legs.
3. **Voice calibration** (from blader/humanizer) — given a sample of the
   author's real writing, match its rhythm, word choices, and tics
   rather than imposing a default voice.
4. **Seven-pass workflow** kept; pass 4 becomes "de-slop pass — load
   `references/ai-tells.md`."
5. **Sibling boundary** — when writing-marketing-copy is active its
   persuasive structures get license, but the Tier-1 lexicon still
   applies. Explanation-type technical docs may load this skill;
   procedures and reference must not chase voice.
6. **Closing caution** — Orwell's sixth rule ("break any of these rules
   sooner than say anything outright barbarous") replaces the current
   "don't over-sand" paragraph.

Em-dash rule in SKILL.md becomes positive: let commas and periods do the
work; keep only the dash doing work they can't.

Frontmatter description (verbatim):

> Write and edit prose with a human voice — clear, specific, and owned by
> one identifiable writer. Directives distilled from Zinsser, Strunk &
> White, Williams, and Pinker, plus a de-slop workflow for AI-flavored
> drafts. Use for blog posts, landing pages, docs prose, emails, UI
> strings, or when asked to "de-slop", "humanize", or fix "AI-sounding"
> text.

### `references/ai-tells.md` (the catalogue, reorganized; ≤250 lines)

- Organized by **detection signal** (predictable vocabulary; uniform
  rhythm / burstiness; reflexive hedging; missing specificity; structural
  templates; significance inflation), so the catalogue teaches why tells
  cluster instead of demanding memorization.
- Lexicon tiers kept, grouped into semantic clusters with **one
  replacement move per cluster** (bloat guard: not per-word).
- Stock phrases and all 18 structures kept with their rewrite moves;
  grep sweeps kept.
- Em-dash density moves here as a detection signal (~2/1,000 words;
  unspaced setting), not a style law.
- New **false-positives section**: judge by clusters, not isolated hits;
  perfect grammar and formal vocabulary are not tells.
- Evidence base and the 25–40% editing benchmark kept.
- Honest-limits note: this catalogue targets human readers' perception,
  not ML classifiers.
- **"Refreshing this catalogue" note at the top:** the file is a
  distillation, not the living list. Upstream sources: Wikipedia's
  "Signs of AI writing" (WP:AITELLS, community-maintained by WikiProject
  AI Cleanup) and the detection literature. A periodic pass re-derives
  against upstream and drops tells that stop being discriminative —
  same pattern as seo-geo-aeo's `refresh` mode. Upstream text is never
  copied in (CC BY-SA vs. this repo's Apache-2.0); it is cited as
  evidence and re-derived as facts.

### `references/examples.md` (new; ≤120 lines)

One worked before/after pass — the deliverable this skill has never had.
A ~250-word AI-flavored draft (written fresh for this file, so no
provenance issues), the edited result, and a per-edit annotation naming
the directive or tell applied. The example must demonstrate the 25–40%
editing benchmark and touch at least one item from each detection-signal
group. One example only (bloat guard); more can be added when real
de-slop sessions produce better material.

## Deliverable B: `skills/technical-writing/` (new)

### `SKILL.md` (≤120 lines)

1. **Sentence discipline** (STE principles distilled; dictionary not
   reproduced, stated explicitly): one instruction per sentence; one
   topic per paragraph; active voice; present tense for facts, imperative
   for steps; ~20-word cap procedural, ~25 descriptive; **one term, one
   meaning** (named as the deliberate inverse of literary variation);
   keep articles; warnings before the step they protect; vertical lists
   for sequences, one action per step.
2. **Reader model** (Baker, Pinker): every page is page one — readers
   arrive mid-document via search; each page must stand alone; the
   curse of knowledge is the default failure, so state what the reader
   must already know.
3. **Doc types (Diátaxis)**: tutorial / how-to / reference / explanation;
   pick one per document. Explanation may also load human-writing.
4. **Review steps**: (a) fresh-reader test — have someone (or a fresh
   agent session) follow the doc cold and note where they stall (from
   doc-coauthoring); (b) mechanical gate — if Vale is available, run it
   with the Google or Microsoft package; starter `.vale.ini` included.
5. **Routing note**: technical-writing for procedures/reference,
   human-writing for voice-ful prose, writing-markdown for formatting,
   writing-marketing-copy for persuasion.

Frontmatter description (verbatim):

> Write clear technical documentation — READMEs, runbooks, how-to
> guides, API references, procedures. Sentence discipline from ASD-STE100
> principles (one instruction per sentence, one term one meaning),
> Diátaxis doc types, and a fresh-reader review step. Use when writing or
> reviewing documentation, a runbook, a procedure, API docs, or a README.

### `references/doc-types.md` (≤200 lines)

Per-type structure, skeleton templates, and the IBM quality
characteristics (task orientation, accuracy, completeness, clarity,
retrievability) as a review rubric. Includes the starter `.vale.ini`
(Google package, Markdown scope) referenced from SKILL.md, with a note
that when Vale is absent the review falls back to the skill's own
checklist — the discipline must not depend on the tool.

## Risks and mitigations

- **Local shadow copy.** `~/.claude/skills/human-writing/` still exists
  on this machine and will duplicate the plugin copy once merged.
  Mitigation: delete the local copy after the PR merges (tracked in
  Mechanics).
- **Trigger overlap.** "Write copy for a landing page" could route to
  human-writing or writing-marketing-copy. Mitigation: descriptions
  drafted above keep persuasion words out of human-writing's triggers;
  the sibling-boundary section states precedence when both load.
- **Copyright.** Zinsser, Strunk & White, Williams, and Pinker are
  copyrighted; the STE dictionary is copyrighted. Verification step
  before commit: no quoted passage longer than a short attributed phrase;
  no reproduced word lists from STE; Orwell's rules are the only
  extended quotation (public-domain-adjacent, attributed).
- **Self-violation.** A style skill that breaks its own rules loses
  authority. Mitigation: mechanical self-check in Mechanics below.
- **Vale absence.** technical-writing must degrade gracefully — the
  checklist works with no tooling installed.

## Out of scope

- A 0–100 AI-tell scoring companion (the repo's `score` skill can take a
  rubric later).
- Shipping our tells as a Vale style package (possible follow-up).
- doc-coauthoring's full workflow (different genre of skill).
- Touching writing-marketing-copy or writing-markdown.

## Mechanics

- Branch: `feat/human-writing-skill` (import commit `db1c266` already on
  it). Separate commits: (1) human-writing restructure, (2)
  technical-writing skill; each with README + CHANGELOG updates and a
  `npm run sync:plugin-skills` run.
- Frontmatter descriptions route triggers: "de-slop", "humanize",
  "AI-sounding" → human-writing; "runbook", "API docs", "procedure",
  "README", "documentation" → technical-writing.
- README gets one differentiation sentence for human-writing (positive
  foundation + repo integration vs. the popular ban-list humanizers).
- **Self-check before each commit** — zero hits allowed on both
  SKILL.md files:

  ```sh
  # Tier-1 lexicon (word-boundary, case-insensitive; list from ai-tells.md)
  grep -inwE "delve|tapestry|pivotal|meticulous|seamless(ly)?|robust|leverage|foster|garner|vibrant|groundbreaking|transformative|multifaceted|elevate|unlock|harness|embark|holistic|nuanced|paramount|utilize|facilitate|underscore|showcase" \
    skills/human-writing/SKILL.md skills/technical-writing/SKILL.md
  # Contrast scaffolds (the deletion-test sweep from ai-tells.md)
  grep -inE "(^|[.!?] )(That's|Here's|This is|It's|The (key|point|catch|kicker|difference|takeaway|thing)) [^.!?]{0,45}[.!?]" \
    skills/human-writing/SKILL.md skills/technical-writing/SKILL.md
  ```

  Scope is the two SKILL.md files only: ai-tells.md contains the lists
  themselves, and examples.md's "before" draft contains tells by design —
  both are exempt by construction, not by exception-listing.
- After merge: delete `~/.claude/skills/human-writing/` (superseded by
  the plugin copy).

## Success criteria

- human-writing SKILL.md reads positive-first: directives precede any
  reference to tells, and a writer could follow it with
  references/ai-tells.md deleted and still produce good prose.
- Self-check passes: the ai-tells.md greps return zero prose hits on
  both SKILL.md files; em-dash use in SKILL.md survives the
  "comma-or-period test" it prescribes.
- examples.md demonstrates a 25–40% edit touching every detection-signal
  group, each edit annotated with the directive applied.
- Fresh-agent test for technical-writing: a session with only SKILL.md
  loaded can produce a runbook that names its doc type, keeps one action
  per step, and places warnings before steps — without STE knowledge or
  reproduced STE content.
- `npm run sync:plugin-skills:check` passes; both skills appear in
  skills.sh.json, README, CHANGELOG.
