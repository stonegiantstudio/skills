---
name: business-feature-writing
description: Use when asked for a long-form article, profile, or narrative report in the style of the Wall Street Journal, Fortune, Forbes, or a business newspaper feature, about a company, a partnership, a deal, or a founder, and the piece must be built from a fixed record of emails, invoices, and documents rather than from interviews.
---

# Business feature writing

A business feature is a true story told in the newspaper's shape: a scene, then
the point, then the evidence in sections, then a line from the record to end on.
The reader is a stranger who knows the industry but not the people. Everything in
the piece traces to a source the writer can name.

**REQUIRED SUB-SKILL:** stone-giant:human-writing governs the sentences. This skill
governs what goes in and in what order. For a print PDF, pair with
stone-giant:pdf-create.

## Before writing: the provenance sheet

List every fact you will use, one line each, tagged with its source and one of
three grades:

- **documented**: an email, message, invoice, commit, or file, with its date
- **recalled**: a participant's memory, with who recalls it
- **inferred**: your own conclusion from documented facts

The piece may state documented facts plainly, must attribute recalled ones
("Mr. Bell recalls telling her..."), and must label inferred ones as such or
leave them out. Nothing enters the piece that is not on the sheet. That includes
connective tissue: how a spreadsheet failed, what someone felt, that an agreement
was reached "on the spot," that a customer was "relieved." If the record does not
say it, the sentence goes without it.

## The shape, in order

1. **Kicker**: section label, small caps.
2. **Headline**: a claim with a concrete noun in it, not a topic.
3. **Deck**: one or two sentences that add what the headline could not; never a
   restatement.
4. **Byline and dateline**: CITY, State, in caps.
5. **Scene lede**: one documented moment with a date, a place, and a person doing
   something. Two to three short paragraphs. A verbatim quotation from the record
   if one exists for that moment.
6. **Nut graf**, by the fourth paragraph, with four required parts: what the story
   is; why it is unusual; the headline numbers (money, years, people); and the
   customer's own reason for being in it, in one sentence, attributed if recalled
   ("Ms. Whitfield has said, in a conversation Mr. Bell recalls, that she never
   wanted a software business; she wanted her technicians to stop calling her at
   6 a.m."). A nut graf missing the fourth part is not finished.
7. **Sections with subheads**, in the order the events happened. Each section opens
   on its most concrete fact. Each carries at least one dated quotation or number.
8. **The mistake**: one thing that went wrong, told with its date, its cause, and
   how long the fix took. A feature without one reads as a press release.
9. **The money**: a table if there are more than four figures. Rates, totals, and
   what changed when.
10. **What each side wanted**, in their own words where the record has them. The
    customer is a protagonist with motives, not the backdrop for the vendor.
11. **Kicker ending**: the last paragraph is a documented quotation or a dated fact
    that stands for the whole. No moral, no summary, no forward-looking flourish.
12. **Sidebar** (optional): "By the numbers" and a dated timeline, each entry one
    line with its date first.

## House conventions

| Rule | Form |
|---|---|
| Second reference to a person | Write the honorific as part of the name every time after the first: "Mr. Bell proposed," "Ms. Whitfield agreed." A bare surname ("Bell proposed") is wire-service style, not this style. This is the rule drafts break most often; the checklist has a mechanical test for it. |
| Attribution verb | "wrote," "said," "recalls." Not "shared," "noted," "explained." |
| Quotations | Verbatim, including punctuation and capitalization. Date every one in the text or the sentence before it. |
| Dates | Month abbreviated with a day: Sept. 7, 2026. Full month name without a day: September 2026. |
| Numbers | Numerals for money, hours, counts, percentages. Spell out one through nine elsewhere. |
| Company on first reference | Full name, what it does, where it is, how big it is. |
| Dashes | None in the prose. Use a comma, a period, or a colon. The one dash in the piece is the dateline separator: PLANO, Texas — On the afternoon of... |
| Time references | Absolute. "In August 2024," never "last month" or "recently." |
| Rhetorical questions | None. |
| Characterizing sentences | None. "The arrangement had outgrown its origins" and "what held it together was smaller than the figure suggests" are the writer's opinion. Let a dated fact or a quotation carry the judgment. |
| The word "finally" | None. It editorializes about the pace of events. |

## Common mistakes, from the baseline test

| What the draft did | Fix |
|---|---|
| Invented how the old process failed, to make the lede vivid | State only what the record says the old process was. Vividness comes from the date and the name. |
| Wrote "agreed on the spot" for a verbal agreement whose timing is unknown | "agreed verbally." |
| Dropped the one recalled fact because it was not documented, twice in testing, even with a reminder | It is the fourth required part of the nut graf. Write the nut graf as four sentences and check that the fourth is the customer's motive. |
| Put the nut graf in the last paragraph | Move it to paragraph three or four. The ending gets a quotation instead. |
| Bare surnames on second reference, in three of three test drafts | Honorifics, verified by searching the draft for each surname. |
| Closed by relocating an event to make a tidy loop | End on a dated fact or quotation. Chronology is not negotiable for a closing line. |
| Em dashes for asides | Commas or a new sentence. |

## Checklist before delivering

- Every quotation matches its source character for character, and its date is in the text.
- Every fact not marked documented is attributed or absent.
- Nut graf is in the first four paragraphs and contains the headline numbers.
- Honorifics on every second reference. Mechanical test: for each surname in the piece, find every occurrence after the first; each must be immediately preceded by "Mr." or "Ms." Fix each one before delivering. Three test drafts in a row failed this by eye and passed it only with the search.
- One mistake told plainly. Both parties' motives present.
- Last paragraph is a quotation or a dated fact.
- Fairness pass: read every sentence about a named person as if they will read it. Private plans, health, security incidents at their company, and details lifted from someone's personal notes stay out unless they are the story. A fact meant as praise (the software was easy enough to run a meeting on cold) must not arrive as a dig at the person (he opened it at 12:40 a.m. and looked for two minutes).
- Run the stone-giant:human-writing de-slop sweep as the final pass.
- Test file for this skill: `tests/scenario-larkspur.md`. A new draft of the skill is verified by running that scenario with the skill and scoring the twelve checks.
