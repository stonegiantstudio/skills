---
description: End-of-day shutdown ritual — park your work, clear your mind, start fresh tomorrow
---

# Park — Shutdown Ritual

Wind down the workday with a research-backed shutdown routine. Survey active
work, capture state for each workstream, decide tomorrow's first task, preserve
session context, and declare done.

## Why This Works

Unfinished tasks hijack working memory (Zeigarnik Effect, 1927). But making a
specific plan for when and how you'll finish them provides the same cognitive
relief as completing them (Masicampo & Baumeister, 2011 — "Consider It Done!").
Sophie Leroy's "Ready-to-Resume" plan research confirms: writing down where you
stopped and what comes next measurably reduces attention residue.

This ritual converts open loops into concrete plans so your brain releases them.
It also captures session context — decisions, discoveries, and hard-won
understanding — so closing a Claude Code session doesn't mean losing what was
learned.

Time: 5–10 minutes.

## Arguments

```text
/stone-giant:park              → Full ritual (all phases)
/stone-giant:park quick        → Skip reflection and session notes, abbreviated survey
/stone-giant:park review       → Read most recent active receipt + cross-session summary
/stone-giant:park review <id>  → Read a specific receipt (partial slug match, e.g. "auth-flow")
/stone-giant:park log          → Show park index (active + completed)
/stone-giant:park log --all    → Show all receipts including superseded/archived
/stone-giant:park punch        → Show all open items across active receipts
/stone-giant:park punch save   → Save punch list snapshot to .park/PUNCHLIST.md
/stone-giant:park triage       → Walk through stale/flagged receipts, decide their fate
```

## Interaction Budget

The entire ritual uses **at most 4 AskUserQuestion calls**. This is a hard
ceiling, not a target — fewer is better:

| Mode | Call 1 | Call 2 | Call 3 | Call 4 |
|------|--------|--------|--------|--------|
| **Full** | Survey confirmation | Workstream statuses | Next actions + tomorrow | Reflection |
| **Quick** | *(skip)* | Workstream statuses | Tomorrow's first task | *(skip)* |

Session context capture (Phase 5) is automated — no interaction needed. The
user reviews and approves the full receipt at the end.

## Receipt File Format

Every parking receipt is a markdown file with YAML frontmatter. The frontmatter
is the source of truth for the index, punch list, and lifecycle operations.

### Filename Convention

```text
YYYY-MM-DD-HHMMSS-slug.park.md
```

**Generation algorithm:**

1. Current datetime → `2026-05-27-183022`
2. Primary branch name → strip the first path segment if it's a conventional
   prefix, replace non-alphanumeric characters with hyphens, collapse runs of
   hyphens, truncate to 40 chars. Examples:
   - `feat/auth-flow` → `auth-flow`
   - `fix/s3_upload_timeout` → `s3-upload-timeout`
   - `chore/deps/update-react` → `deps-update-react`
   Strip only these prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`.
   Any non-ASCII characters are removed (branch names with unicode are rare but
   the slug should be filesystem-safe).
3. If no branch (non-git or detached HEAD), derive slug from the first workstream
   name using the same sanitization → `stripe-webhook-retry`
4. If still empty, use `session` → `2026-05-27-183022-session.park.md`
5. The `.park.md` extension makes receipts greppable and distinguishable

**Examples:**

```text
.park/2026-05-27-183022-auth-flow.park.md
.park/2026-05-27-091500-stripe-webhook-retry.park.md
.park/2026-05-26-170045-dashboard-layout.park.md
```

Multiple sessions on the same branch in one day are naturally unique because of
the HHMMSS component — no sequence numbers needed.

### Frontmatter Schema

```yaml
---
parked: 2026-05-27T18:30:22-04:00
last_confirmed: 2026-05-27T18:30:22-04:00
status: active
branch: feat/auth-flow
summary: Auth flow middleware, Stripe webhook retry logic
superseded_by: null
workstreams:
  - name: Auth flow
    state: mid-task
  - name: Stripe webhooks
    state: blocked
---
```

| Field | Type | Required | Purpose |
|---|---|---|---|
| `parked` | ISO 8601 datetime with UTC offset | yes | When the receipt was created (e.g., `-04:00`, `+00:00`) |
| `last_confirmed` | ISO 8601 datetime with UTC offset | yes | Initially same as `parked`. Updated when triage "Still active" resets the timer |
| `status` | enum | yes | `active` / `completed` / `superseded` / `archived` |
| `branch` | string | yes | Primary git branch at park time. `"none"` if no repo |
| `summary` | string | yes | One-line summary (same text used in index) |
| `superseded_by` | string \| null | no | Filename of successor receipt |
| `workstreams` | array | yes | One entry per workstream from Phase 2 |

### Lifecycle States

```text
active ──→ completed    (all checklist items checked, or user marks done in triage)
active ──→ superseded   (newer receipt covers same branch/workstreams)
active ──→ archived     (user decides during triage: no longer relevant)
completed ──→ archived  (user cleans up, or after 30 days)
```

Only `active` receipts appear in the punch list. Only `active` and `completed`
appear in the default index view.

## Behavior

### Phase 1: Survey (Automated)

Silently gather context. Run these commands and synthesize — don't dump raw
output:

1. `git status` — uncommitted changes?
2. `git branch --list` — active local branches
3. `git log --oneline -10` — what was worked on today
4. `git stash list` — forgotten stashes
5. `git diff --stat` — scope of uncommitted changes
6. Quick scan for PICKUP/FIXME/TODO markers in recently changed files:
   `git diff --name-only HEAD~5 | head -20 | xargs -I{} grep -n 'TODO\|FIXME\|PICKUP\|HACK\|XXX' '{}' 2>/dev/null`

**If not in a git repository:** skip the git commands. Present what you know
from the conversation context and ask the user to describe their active work.
The ritual works without git — the survey is a convenience, not a requirement.

**If git is clean** (no uncommitted changes, no stashes, single branch): note
that and move directly to Phase 2 — the user may still have non-git workstreams
(Slack threads, design reviews, research, meeting follow-ups).

Synthesize into a brief snapshot. Group by workstream, not by git command:

```text
## Workday Survey

Here's what I can see:

**[Feature/branch name]** (`branch-name`, last commit `abc1234`)
- [N files changed, uncommitted / clean / staged]
- [Recent commit summary if relevant]

**[Another workstream if present]**
- [Status]

**[Stashed work]** (if any)
- `stash@{0}`: [description]

**[Markers found]** (if any)
- file.ts:42 — TODO: handle edge case
```

**Full mode:** After the survey, ask (Call 1):

> "Does this cover your active work, or is there something else you've been
> working on today?"

**Quick mode:** Present the survey and move on without asking.

### Phase 2: Park Each Workstream (Interactive)

Use **one AskUserQuestion call** (Call 2) to capture all workstream statuses.
Include one question per workstream, up to 4. If there are more than 4
workstreams, prioritize by: uncommitted changes first, then most recent
activity, then stashes. Mention deprioritized workstreams in the survey output
so nothing is lost.

Each question:

**"[Workstream name]?"**

| Option | Meaning |
|--------|---------|
| **Done for now** | No open threads, can wait |
| **Mid-task** | Stopped in the middle of something |
| **Blocked** | Waiting on someone or something external |
| **Needs attention tomorrow** | Time-sensitive or high priority |

**If zero workstreams detected:** Ask one open-ended question: "What were you
working on today?" Accept whatever the user provides and proceed.

### Phase 3: Next Actions + Tomorrow (Interactive)

**Call 3.** Batch these into one AskUserQuestion with up to 3 questions:

- One question per workstream needing a next action (max 2) — those marked
  **Mid-task**, **Needs attention**, or **Blocked**
- One question for tomorrow's first task

**Next action questions:** Push for specificity. The mechanism only works when
the plan is specific enough that your brain trusts it:

- Not "continue working on auth" → "add refresh token rotation to
  `middleware/auth.ts:47`"
- Not "finish the PR" → "address the two review comments on error handling,
  then request re-review from Sarah"
- Not "fix the bug" → "reproduce the race condition with the test in
  `payment.test.ts`, then check whether the lock is released on the error path"

If a workstream has an obvious next action from the survey (e.g., a PICKUP
marker or a failing test), pre-fill it as the default option.

For **Blocked** items, frame the question as: "What unblocks [workstream]?"

**Tomorrow's first task:** Pre-populate options from workstreams that need
attention. AskUserQuestion always provides an "Other" escape hatch.

**Quick mode:** Skip the next-action questions. Call 3 has only the tomorrow
question. Include a "Check calendar first — meetings/deadlines" option.

**Full mode:** If there are fewer than 3 next-action questions, include a
calendar question ("Anything on tomorrow's calendar that affects your plan?") as
the last question in Call 3 — this stays within the 4-question AskUserQuestion
limit. If Call 3 is already full (3 questions), skip the calendar check and note
"Calendar: not checked (3 workstreams)" in the receipt so it's transparent about
why it was skipped.

### Phase 4: Quick Reflect (Optional — skip in quick mode)

Call 4. One question. Thirty seconds:

**"Anything from today worth noting?"**

| Option | Frame |
|--------|-------|
| **A win** | Something that went well or felt good |
| **A learning** | Something you'd do differently next time |
| **A concern** | Something nagging — saying it out loud helps |
| **Nothing — wrap it up** | Some days are just days. No guilt. |

If they pick anything except "Nothing," capture their brief note. One sentence
is fine. Don't probe, don't coach, don't therapize.

### Phase 5: Session Context Capture (Automated)

Review the current conversation and extract knowledge that would be expensive to
re-derive in a new session. This phase requires **no user interaction** — Claude
generates the notes automatically and includes them in the receipt for the user
to review before saving.

**What to capture:**

- **Decisions and rationale** — "Chose X over Y because Z." Architecture
  choices, library selections, approach decisions, and the reasoning behind
  them. The rationale is the valuable part — the decision alone can be seen in
  the code.
- **Technical discoveries** — "The 500 error was caused by a missing index on
  `users.email`." Debugging breakthroughs, root causes found, performance
  findings, surprising behavior uncovered.
- **Context gathered** — Research results, information from external sources,
  stakeholder requirements discussed, constraints identified. Anything the user
  explained about their system that isn't in the code or docs.
- **Patterns established** — "Routes follow thin-routes/fat-models." Coding
  conventions agreed on, naming patterns chosen, file organization decisions.
- **Dead ends** — "Tried approach X, failed because Y." These prevent the next
  session from re-treading the same ground.

**What NOT to capture:**

- Anything already in the code, git history, or CLAUDE.md
- Ephemeral task state (already captured in Active Work section)
- Raw conversation content — distill, don't transcribe
- Trivial decisions that wouldn't survive a week

**Format:** Short bullet points. Each note should be self-contained — readable
by someone (or a future Claude session) with no prior context. Lead with the
fact, not the story.

**If the session was trivial** (a quick question, a single small fix, nothing
that required significant reasoning or discovery): skip this phase. Not every
session produces knowledge worth persisting. If in doubt, err toward omitting —
a sparse session notes section is worse than none.

**Quick mode:** Skip this phase entirely.

### Phase 6: Seal (Generative)

Generate the **Parking Receipt** — a structured summary of everything captured.
**Only include sections that have content:**

- **Active Work** and **Tomorrow Morning** — always included
- **Today's Note** — include only if the user chose a reflection option in
  Phase 4 (not "Nothing," not skipped)
- **Session Notes** — include only if Phase 5 produced notes (not skipped, not
  a trivial session)

A quick-mode receipt with one workstream should be 8 lines, not a template full
of empty headers.

```text
---
parked: [ISO 8601 datetime with UTC offset]
last_confirmed: [same as parked on creation]
status: active
branch: [branch-name]
summary: [one-line summary of the day's work]
superseded_by: null
workstreams:
  - name: [Workstream 1]
    state: [done | mid-task | blocked | needs-attention]
  - name: [Workstream 2]
    state: [state]
---

## 🅿️ Parking Receipt — [Day of Week], [Month Day]

### Active Work
- [ ] **[Workstream 1]** (`branch-name` @ `abc1234`) — Mid-task. Next → [action]
- [ ] **[Workstream 2]** (`branch-name`) — Blocked on [what]. Check → [who/what]
- [x] **[Workstream 3]** — Done for now.

### Tomorrow Morning
**Start with:** [First task from Phase 3]
**Watch for:** [Calendar items, if any were flagged]

### Today's Note
[Reflection from Phase 4]

### Session Notes
- Chose [X] over [Y] because [rationale]
- Root cause of [bug]: [finding]
- [Pattern/convention] established for [area]
- Tried [approach] — didn't work because [reason]

---
Shutdown complete.
```

**Checkbox convention:** Every workstream line in Active Work uses a checkbox.
`- [ ]` for workstreams that are mid-task, blocked, or need attention (open
work). `- [x]` for workstreams marked "Done for now" (closed). This gives
staleness detection and the punch list a single, consistent item model to
parse — the same `- [ ]` / `- [x]` pattern drives completion checks, punch
extraction, and cross-session counts.

Include branch names and abbreviated commit hashes — these are the breadcrumbs
that make `review` mode useful the next morning.

Display the receipt, then ask in plain text (not an AskUserQuestion call —
this stays within the 4-call budget):

> "Want me to save this to `.park/`?"

Accept yes/no. Don't over-formalize the save prompt — the ritual's interactive
work is done.

If saving:

1. Create `.park/` directory if it doesn't exist
2. Generate the filename using the convention above
3. Write the receipt (frontmatter + body)
4. Regenerate `.park/INDEX.md` (see [park-subcommands.md](../references/park-subcommands.md#index-regeneration))
5. Run staleness detection on other active receipts. If any are flagged, note:
   "You have N older active receipts that may be completed. Run `/stone-giant:park triage`
   to review."
6. If `.gitignore` exists and doesn't already contain `.park`, append `.park/`
   (parking receipts are personal, not for the repo)
7. Confirm the path

### Closing

End with exactly:

> **Shutdown complete.** See you tomorrow.

This is a cognitive boundary marker. After this, the only correct response to a
work thought is to recall that the ritual is complete and the plan is captured.

If the user has the `zen-break` skill installed, optionally suggest one
transition activity (a short walk, change of clothes, a few breaths) as the
bridge between work and personal time. One sentence.


## Subcommands

The `review`, `log`, `punch`, and `triage` subcommands are documented in
[park-subcommands.md](../references/park-subcommands.md).

## Design Principles

- **Respect decision fatigue.** Pre-populate options from git state. Simple
  choices, not open-ended questions.
- **Specificity is the mechanism.** Vague plans don't close loops. Push for
  concrete next actions with file names and line numbers.
- **Brevity over thoroughness.** Five focused minutes beats thirty anxious
  minutes of "wrapping up."
- **The receipt is the product.** The tangible artifact is what lets the brain
  let go. Display it clearly.
- **Session notes preserve momentum.** Closing a Claude Code session shouldn't
  mean losing hard-won context. The notes bridge the gap between sessions.
- **The punch list catches drift.** Individual receipts serve day-to-day; the
  punch list surfaces what's still open across all sessions. A finite list
  meant to reach zero.
- **Triage prevents junk drawers.** Silent accumulation of active receipts
  degrades trust in the system. Forced keep/kill/defer decisions keep the
  index honest.
- **Don't be precious.** If someone says "nothing to note," accept it. No
  guilt, no coaching, no "are you sure?"

## Anti-Patterns

- Don't turn this into a standup or status report — it's for the user, not an
  audience
- Don't add items to the user's task list — only capture what they tell you
- Don't offer productivity advice or time management coaching — run the ritual
- Don't make reflection mandatory — some days are just days
- Don't open new work — if you spot a bug during survey, note it as a marker
  and move on. Now is not the time
- Don't be chatty between phases — momentum matters more than encouragement
- Don't exceed the interaction budget — if you're about to make a 5th
  AskUserQuestion call, consolidate or drop
- Don't transcribe the conversation into session notes — distill the knowledge.
  Five sharp bullets beat two paragraphs of narrative
- Don't duplicate what's already in the code, git history, or CLAUDE.md — the
  notes capture what ISN'T persisted elsewhere
- Don't auto-transition receipt statuses — flags inform, the user decides
- Don't silently drop items when superseding — always offer migration

---

$ARGUMENTS
