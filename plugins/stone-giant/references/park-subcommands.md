---
description: Subcommand reference for the park shutdown ritual — review, log, punch, and triage
---

# Park Subcommands

Reference documentation for the `review`, `log`, `punch`, and `triage`
subcommands of the park skill. See [park.md](../commands/park.md) for the
main shutdown ritual.

## Shared Operations

These operations are used by multiple subcommands. Define them once here;
`punch`, `triage`, `review`, and `log` all reference them.

### Listing receipts

List all `.park/*.md` files and classify each:

- **New format** (`*.park.md` with YAML frontmatter): parse frontmatter for
  `parked`, `status`, `summary`, `branch`, `last_confirmed`.
- **Legacy format** (`YYYY-MM-DD.md` or `YYYY-MM-DD-N.md`, no frontmatter):
  infer `status: active`, `branch: unknown`, `parked` from the filename date.
  Tag as `(legacy)`.

Exclude `INDEX.md` and `PUNCHLIST.md` from the file list.

### Extracting open items from a receipt

Three sources, checked in order:

**Source 1 — Unchecked checkboxes:** Match lines matching `^\s*- \[ \] .+`.
Include nested unchecked items with their parent for context. Skip checked
items (`- [x]`).

**Source 2 — Next actions:** Match lines containing `Next →` in the Active
Work section. These are the specific next actions from Phase 3.

**Source 3 — Blocked items:** Match lines containing `Blocked on` or
`⏳ Blocked:` in the Active Work section.

**Deduplication:** If a "Next →" action also appears as a checkbox item, keep
only the checkbox version.

This extraction works identically for new-format and legacy receipts — both
contain Active Work sections with the same line patterns.

### Detecting staleness

Three signals, checked in order of reliability:

1. **Completion-based:** Parse the receipt body for `- [ ]` and `- [x]`
   patterns. If every checkbox is checked (and at least one exists):
   ```
   ⚑ All items checked — ready to mark completed
   ```
   If the receipt has no checkboxes at all, skip this signal (do not
   false-flag).

2. **Branch-based:** Run `git branch -r --list "origin/${branch}"` for each
   active receipt's `branch` field (assumes `origin` remote — most repos use
   this; if not, the check silently skips rather than false-flagging). If the
   branch doesn't exist remotely, check
   `git log --oneline --all --grep="Merge.*${branch}" -1` to determine if it
   was merged:
   ```
   ⚑ Branch merged into main — likely completed
   ⚑ Branch deleted — may be stale
   ```
   Skip for legacy files with `branch: unknown`.

3. **Time-based:** If `last_confirmed` (or `parked` for legacy files) is older
   than 7 days and status is still `active`:
   ```
   ⚑ Parked 12 days ago — still relevant?
   ```

**Where flags appear:**

- In `review` mode: alongside the receipt being reviewed
- In `log` mode: as a Flags column in the active receipts table
- In `triage` mode: flags drive which receipts are presented for decisions

## Index Regeneration

`.park/INDEX.md` is **generated from receipt frontmatter**, not manually
maintained. Regenerate it every time a receipt is saved or a status changes
(e.g., after triage).

**Algorithm:**

1. List and classify all receipts (see Shared Operations > Listing receipts)
2. Sort by `parked` descending (most recent first)
3. Group by status into sections
4. Write INDEX.md

**Format:**

```markdown
# Park Index

## Active

| Parked | Branch | Summary | Receipt |
|---|---|---|---|
| May 27, 6:30 PM | `feat/auth-flow` | Auth flow middleware, Stripe webhooks | [view](2026-05-27-183022-auth-flow.park.md) |
| May 26, 5:00 PM | `feat/dashboard` | Dashboard layout, chart component | [view](2026-05-26-170045-dashboard-layout.park.md) |

## Completed

| Parked | Branch | Summary | Receipt |
|---|---|---|---|
| May 25, 3:15 PM | `fix/s3-timeout` | S3 upload timeout, added retry logic | [view](2026-05-25-151500-s3-timeout.park.md) |

_3 receipts (2 active, 1 completed). 0 superseded, 0 archived (hidden)._
```

Superseded and archived receipts are omitted from the default view but counted
in the footer.

## The `review` Subcommand

When invoked as `/stone-giant:park review`:

1. Look for `.park/` directory in the project root. List and classify all
   receipts (Shared Operations > Listing receipts).
2. Find the most recent receipt with `status: active` (not just the most recent
   file — a completed receipt shouldn't be the default)
3. Display it with a header: **"Here's where you left off:"**
4. If the receipt includes **Session Notes**, treat them as working context for
   this conversation. Summarize the key points up front: "From your last
   session, I know that [decisions/findings]." This is the payoff — the new
   session inherits what the old session learned without the user re-explaining
5. If the receipt references git branches, check whether they still exist and
   note any that have been merged or deleted since parking
6. Run staleness detection (Shared Operations > Detecting staleness) and show
   flags for the reviewed receipt
7. If there are other active receipts, extract their open items (Shared
   Operations > Extracting open items) for counts, and show a
   **cross-session summary** below
   the main receipt:

   ```text
   ### Also active
   - **Dashboard layout** (parked yesterday) — 3 open items
   - **Auth flow** (parked 2 days ago) — 1 item, blocked on external dep

   Run `/stone-giant:park punch` for the combined view.
   ```

8. If any active receipts have staleness flags, mention triage: "1 older
   receipt may be ready to close — run `/stone-giant:park triage` when you have a
   moment."
9. After displaying, ask: **"Ready to pick up where you left off, or has the
   plan changed?"**

This closes the loop: park at night, review in the morning. The session notes
mean the new conversation starts with the context the old one earned.

If no `.park/` directory or no active files found, say so and offer to start
fresh.

### `review <id>` Variant

When a specific receipt identifier is given (e.g., `/stone-giant:park review auth-flow`):

1. Match the argument against receipt filenames — first try exact match, then
   match against the slug portion after the timestamp
2. If multiple files match, show the matches and ask the user to pick:
   ```
   Multiple receipts match "auth-flow":
   1. 2026-05-27-091500-auth-flow.park.md (today)
   2. 2026-05-26-120030-auth-flow.park.md (yesterday)
   Which one?
   ```
3. Display the matched receipt with the same format as the default review

## The `log` Subcommand

When invoked as `/stone-giant:park log`:

1. Regenerate and read `.park/INDEX.md`
2. Display the index grouped by status (Active, Completed)
3. Show staleness flags inline for active receipts
4. If the user asks about a specific date, read that receipt and display it

When invoked as `/stone-giant:park log --all`:

- Include Superseded and Archived sections in the output

If no index exists, say so and suggest running `/stone-giant:park` first.

## The `punch` Subcommand

When invoked as `/stone-giant:park punch`:

1. List and classify all receipts (see Shared Operations > Listing receipts),
   then filter to `status: active` (includes legacy files, which are always
   active)
2. Extract open items from each receipt (see Shared Operations > Extracting
   open items)
3. Group by source receipt, ordered by recency
4. Display the punch list

When invoked as `/stone-giant:park punch save`:

- Write the punch list to `.park/PUNCHLIST.md` (always overwrites — the punch
  list is a generated snapshot, not authored content)
- Append a timestamp footer: `_Generated YYYY-MM-DD at H:MM PM. Run
  /stone-giant:park punch save to refresh._`

### Punch List Format

```text
## Punch List — 7 open items across 3 sessions

### Auth flow (parked May 27)
_from 2026-05-27-183022-auth-flow.park.md_
- [ ] Add refresh token rotation to `middleware/auth.ts:47`
- ⏳ Blocked: waiting on Sarah's API spec for `/users/me`

### Dashboard layout (parked May 26)
_from 2026-05-26-170045-dashboard-layout.park.md_
- [ ] Fix chart responsive breakpoints below 768px
- [ ] Add empty state for no-data scenario

---
_7 items across 3 sessions. Oldest: 2 days. Run `/stone-giant:park triage` to clean up._
```

**When the punch list is empty:** "No open items across any active receipts.
Your slate is clean." If there are active receipts with all items checked,
suggest triage.

## The `triage` Subcommand

When invoked as `/stone-giant:park triage`:

1. List and classify all receipts (Shared Operations > Listing receipts),
   filter to active, then run staleness detection (Shared Operations >
   Detecting staleness)
2. If zero flags: "All active receipts look current. Nothing to triage." Exit.
3. For flagged receipts, use **one AskUserQuestion call** with one question per
   flagged receipt (max 4). Prioritize: all-items-checked first, then
   branch-merged, then oldest.

**Each question:**

**"[Summary] (parked [relative date]) — [flag reason]"**

| Option | Action |
|---|---|
| **Mark completed** | Set `status: completed` in frontmatter |
| **Still active** | Update `last_confirmed` to now (resets the 7-day staleness timer) |
| **Archive it** | Set `status: archived` in frontmatter |
| **Superseded** | Set `status: superseded` (triggers follow-up — see below) |

### Superseded Follow-Up

When a receipt is marked superseded, handle the follow-up as a **plain-text
exchange** (not an AskUserQuestion call), the same way Phase 6's save prompt
works. This keeps the triage AskUserQuestion to one call while still resolving
the details:

1. Ask in plain text: "Which receipt supersedes this one?" List active receipts
   as numbered options. Accept the number or a partial slug match. Write the
   chosen successor's filename into the `superseded_by` field in the old
   receipt's frontmatter (this is how the link between receipts is recorded).
2. If the superseded receipt has unchecked items, show them and ask in plain
   text: "These items are still open. Migrate them to the successor, drop them,
   or already covered?"

| Option | Action |
|---|---|
| **Migrate to successor** | Append items to the successor receipt under a "Carried Forward" section |
| **Drop them** | Items abandoned — they disappear from the punch list |
| **Already covered** | Items exist in successor in some form — no action |

If "Migrate to successor," append to the successor receipt:

```text
### Carried Forward
_From 2026-05-26-120030-auth-flow.park.md (superseded)_
- [ ] Set up Better Auth provider config
```

### After Triage

4. Apply the chosen transitions to each receipt's frontmatter
5. Regenerate INDEX.md
6. If `.park/PUNCHLIST.md` exists, note: "Your saved punch list is now out of
   date. Run `/stone-giant:park punch save` to refresh."
7. Report: "Completed N, archived N. M active receipts remain."

## Legacy File Handling

Old receipts using the previous naming convention (`YYYY-MM-DD.md` or
`YYYY-MM-DD-N.md`) are handled gracefully:

- Detected by: no `.park.` infix in filename, no HHMMSS component, no slug
- Treated as: `status: active`, `branch: unknown`, summary extracted from
  content
- Included in index with a `(legacy)` annotation
- Not auto-migrated — they appear in triage and age out through normal
  lifecycle decisions

