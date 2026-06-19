---
name: dates-and-times
description: World-class date, time, and timezone handling based on Jon Skeet's NodaTime principles and the TC39 Temporal API (Stage 4 / ES2026). Triggers when working with Date objects, Temporal types, timestamps, timezone conversions, scheduling, or any temporal logic. Use to avoid the countless bugs caused by datetime mishandling.
---

# Dates and Times

Date and time handling is one of the most error-prone areas in software development. This skill applies battle-tested principles from Jon Skeet's NodaTime, the TC39 Temporal API (Stage 4 / ES2026), and hard-won industry experience.

## Core Philosophy

> "When an API can't make the right choice automatically and reliably, it should force the developer to make the choice." — Jon Skeet

**Know what you're representing.** The source of most datetime bugs is conflating different concepts:

| Concept | What It Represents | Temporal Type | Examples |
|---------|-------------------|---------------|----------|
| **Instant** | A point on the global timeline | `Temporal.Instant` | "When the server crashed", log timestamps |
| **Local date/time** | A date/time without timezone | `Temporal.PlainDateTime` | "December 25th at 3:00 PM" |
| **Zoned date/time** | Local time in a specific zone | `Temporal.ZonedDateTime` | "3:00 PM in Chicago", meeting times |
| **Date only** | A calendar date | `Temporal.PlainDate` | Birthdays, due dates, holidays |
| **Time only** | A time of day | `Temporal.PlainTime` | Store hours, alarm times |
| **Year-month** | A month in a year | `Temporal.PlainYearMonth` | Billing cycles, card expiry |
| **Month-day** | A recurring annual date | `Temporal.PlainMonthDay` | Birthdays, anniversaries |
| **Duration** | Elapsed time / calendar span | `Temporal.Duration` | "2 hours 30 minutes", "3 months" |

**Immutability principle:** Every Temporal operation returns a new object — nothing mutates. This eliminates an entire class of bugs caused by `Date`'s mutable API (e.g., passing a Date to a function that silently calls `.setDate()` on your original).

**Nanosecond precision:** `Temporal.Instant` measures elapsed nanoseconds since the Unix epoch (not milliseconds like `Date`). This matters when interoperating with systems that produce nanosecond timestamps (databases, tracing systems, other languages).

## The 34 Falsehoods

Programmers commonly believe these falsehoods about time:

1. UTC offsets range from -12 to +12 (actually extends to +14)
2. One UTC offset equals one timezone (multiple zones share offsets)
3. Offsets are always whole hours (India: +5:30, Nepal: +5:45)
4. DST is always 1 hour (Lord Howe Island: 30 minutes)
5. DST follows March/October (southern hemisphere reverses this)
6. Time conversions are always unambiguous (DST creates gaps and overlaps)
7. "Just store UTC" solves everything (fails for future events)
8. Every location has an official timezone (poles don't)
9. Timezone abbreviations are unique ("CST" = 3 different zones)
10. GPS coordinates + UTC = local time (disputed territories overlap)

## Decision Framework

### What to Store

```
┌─────────────────────────────────────────────────────────────┐
│                    WHAT ARE YOU STORING?                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐    ┌───────────┐    ┌──────────┐
        │ INSTANT │    │ LOCAL TIME│    │ FUTURE   │
        │ (past)  │    │ (no zone) │    │ EVENT    │
        └────┬────┘    └─────┬─────┘    └────┬─────┘
             │               │               │
             ▼               ▼               ▼
      ┌────────────┐  ┌────────────┐  ┌─────────────────┐
      │ Store UTC  │  │ Store as-is│  │ Store local time│
      │ timestamptz│  │ No TZ info │  │ + timezone ID   │
      └────────────┘  └────────────┘  │ + derived UTC   │
                                      └─────────────────┘
```

### The Future Events Problem

**"Just store UTC" fails for future events** because timezone rules change.

```typescript
// ❌ WRONG: Conference in Amsterdam, June 2025
const conferenceStart = new Date("2025-06-15T09:00:00Z"); // Converted to UTC now

// What if Netherlands changes DST rules before June 2025?
// Your stored UTC is now WRONG - the organizer meant 9am LOCAL time
```

```typescript
// ✅ CORRECT: Store what the user actually specified
const conference = {
  localTime: "09:00",
  localDate: "2025-06-15",
  timezone: "Europe/Amsterdam",
  // Derived for querying (recalculate when tzdb updates)
  utcStart: "2025-06-15T07:00:00Z",
  tzdbVersion: "2024a"
};

// ✅ With Temporal: ZonedDateTime preserves both local time and timezone
const conferenceZdt = Temporal.ZonedDateTime.from(
  "2025-06-15T09:00:00+02:00[Europe/Amsterdam]"
);
// .toInstant() derives the UTC equivalent; recalculate when tzdb updates
```

## JavaScript/TypeScript Patterns

### Library Recommendations

| Library | Best For | Status |
|---------|----------|--------|
| **Temporal API** (native) | **New projects — use this first** | Stage 4 / ES2026. Chrome 144+, Firefox 139+, Edge 144+, Node 26+, TS 6.0+ |
| **date-fns + date-fns-tz** | Legacy codebases, tree-shakable | Stable, ~18kb |
| **Luxon** | Legacy codebases, heavy timezone work | Stable, ~20kb |
| **Day.js** | Moment replacement, minimal | Stable, ~6kb |

**Temporal is the default choice for new code.** It is natively available in modern browsers and runtimes — no polyfill needed. Only reach for date-fns or Luxon when supporting older environments without Temporal.

### The JavaScript Date Trap

```typescript
// ❌ These are DIFFERENT dates depending on your timezone
new Date("2024-12-25");           // Midnight LOCAL time
new Date("2024-12-25T00:00:00");  // Midnight LOCAL time
new Date("2024-12-25T00:00:00Z"); // Midnight UTC

// In UTC+10, the first two give you December 24th UTC!
```

### Safe Patterns with date-fns

```typescript
import { parseISO, format, addDays, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

// ✅ Parse ISO strings (always include Z or offset)
const instant = parseISO("2024-12-25T15:00:00Z");

// ✅ Format in user's timezone
const display = formatInTimeZone(
  instant,
  "America/Chicago",
  "MMM d, yyyy h:mm a"
); // "Dec 25, 2024 9:00 AM"

// ✅ Create a time in a specific timezone
const chicagoNoon = fromZonedTime(
  new Date(2024, 11, 25, 12, 0), // Dec 25, noon
  "America/Chicago"
);

// ✅ Safe date arithmetic
const nextWeek = addDays(instant, 7); // Handles DST correctly
```

### Safe Patterns with Luxon

```typescript
import { DateTime, Duration, Interval } from "luxon";

// ✅ Create in specific timezone
const meeting = DateTime.fromObject(
  { year: 2024, month: 12, day: 25, hour: 15 },
  { zone: "America/New_York" }
);

// ✅ Convert between timezones
const inTokyo = meeting.setZone("Asia/Tokyo");

// ✅ Handle ambiguous times (DST fall-back)
const ambiguous = DateTime.fromObject(
  { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
  { zone: "America/Chicago" }
);
// Luxon picks the first occurrence by default

// ✅ Format for display
meeting.toFormat("fff"); // "December 25, 2024, 3:00 PM EST"
```

### Safe Patterns with Temporal

```typescript
// ✅ Get current moment
const now = Temporal.Now.zonedDateTimeISO();       // Full local context
const instant = Temporal.Now.instant();             // UTC point in time

// ✅ Create from ISO strings (strict parsing — no ambiguity)
const zdt = Temporal.ZonedDateTime.from(
  "2026-06-15T09:00:00+02:00[Europe/Amsterdam]"
);
const inst = Temporal.Instant.from("2026-02-25T15:15:00Z");
const date = Temporal.PlainDate.from({ year: 2026, month: 3, day: 11 });

// ✅ Convert between timezones
const inLondon = inst.toZonedDateTimeISO("Europe/London");
const inNewYork = inst.toZonedDateTimeISO("America/New_York");

// ✅ Arithmetic — always returns new instance (immutable)
const nextWeek = date.add({ days: 7 });
const plus1h = zdt.add({ hours: 1 });
const threeMonthsAgo = date.subtract({ months: 3 });

// ✅ DST handled automatically
// London DST: 2026-03-29 01:00 → 02:00 (01:30 doesn't exist)
const preDST = Temporal.ZonedDateTime.from(
  "2026-03-29T00:30:00+00:00[Europe/London]"
);
const afterDST = preDST.add({ hours: 1 });
// → "2026-03-29T02:30:00+01:00[Europe/London]" (correct)

// ✅ Duration arithmetic
const duration = Temporal.Duration.from({ hours: 130, minutes: 20 });
duration.total({ unit: "seconds" }); // 469200

// ✅ Date-only — no timezone, no day-shift bugs
const birthday = Temporal.PlainDate.from("1990-05-15");
birthday.year;       // 1990
birthday.inLeapYear; // false

// ✅ Time-only
const storeOpen = Temporal.PlainTime.from("09:00");

// ✅ Non-Gregorian calendar arithmetic
const hebrewDate = Temporal.PlainDate.from("2026-03-11[u-ca=hebrew]");
hebrewDate.toLocaleString("en", { calendar: "hebrew" }); // "22 Adar 5786"
const nextHebrewMonth = hebrewDate.add({ months: 1 });
// → "22 Nisan 5786" (adds one Hebrew month, not Gregorian)

// ✅ Comparison
Temporal.PlainDate.compare(date, nextWeek); // -1 (date is earlier)

// ✅ Interop with legacy Date
const legacyDate = new Date("2024-12-25T15:00:00Z");
const fromLegacy = Temporal.Instant.fromEpochMilliseconds(legacyDate.getTime());
const backToLegacy = new Date(inst.epochMilliseconds);
```

### Date-Only Values

For dates without times (birthdays, due dates), avoid time components:

```typescript
// ✅ BEST: Temporal.PlainDate — no time component, no day-shift bugs
const birthDate = Temporal.PlainDate.from("1990-05-15");
// No timezone, no midnight ambiguity — it's always May 15

// ✅ GOOD: Store as string when using legacy Date
interface User {
  birthday: string; // "1990-05-15" - no time component
}

// ✅ Legacy workaround: noon UTC to prevent day-shift
function toNoonUTC(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// ❌ WRONG: Storing date-only as midnight
const bad = new Date("1990-05-15T00:00:00Z");
// In UTC+14, this displays as May 14!
```

## Database Patterns

### PostgreSQL

```sql
-- ✅ ALWAYS use timestamptz for instants
CREATE TABLE events (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- For future events: store local + zone + derived UTC
  local_start TIME NOT NULL,
  local_date DATE NOT NULL,
  timezone TEXT NOT NULL,  -- IANA: 'America/Chicago'
  starts_at TIMESTAMPTZ GENERATED ALWAYS AS (
    (local_date + local_start) AT TIME ZONE timezone
  ) STORED
);

-- ❌ NEVER store UTC in timestamp (without timezone)
-- The database can't know it's meant to be UTC
CREATE TABLE bad_events (
  created_at TIMESTAMP NOT NULL  -- Ambiguous!
);
```

### Querying Across Timezones

```sql
-- Get events happening "today" in user's timezone
SELECT * FROM events
WHERE (starts_at AT TIME ZONE 'America/Chicago')::date = CURRENT_DATE;

-- Get events in the next 24 hours (timezone-agnostic)
SELECT * FROM events
WHERE starts_at BETWEEN now() AND now() + INTERVAL '24 hours';
```

## Common Bugs and Fixes

### Bug: Date shifts by one day

```typescript
// User in Australia selects December 25
// Stored as midnight UTC = December 24 in US

// ✅ Fix (Temporal): PlainDate has no time — no shift possible
const due = Temporal.PlainDate.from("2024-12-25");

// ✅ Fix (legacy): Use noon UTC for date-only values
const dueLegacy = new Date(Date.UTC(2024, 11, 25, 12, 0, 0));
```

### Bug: DST causes duplicate/missing hours

```typescript
// 2:30 AM doesn't exist on DST spring-forward
// 1:30 AM happens twice on DST fall-back

// ✅ Fix (Temporal): ZonedDateTime resolves DST gaps automatically
const zdt = Temporal.ZonedDateTime.from(
  "2024-03-10T00:30:00-06:00[America/Chicago]"
);
const plus2h = zdt.add({ hours: 2 });
// Correctly skips the non-existent 2:00-3:00 AM gap

// ✅ Fix (Luxon):
import { DateTime } from "luxon";

const result = DateTime.fromObject(
  { year: 2024, month: 3, day: 10, hour: 2, minute: 30 },
  { zone: "America/Chicago" }
);

if (!result.isValid) {
  console.log("Invalid time:", result.invalidReason);
}
```

### Bug: Timezone abbreviations are ambiguous

```typescript
// ❌ "CST" could be Central, China, or Cuba Standard Time
const bad = "2024-12-25T10:00:00 CST";

// ✅ Always use IANA timezone names
const good = { time: "2024-12-25T10:00:00", zone: "America/Chicago" };
```

### Bug: Server timezone affects results

```typescript
// ❌ Server in UTC, user in Tokyo
new Date(2024, 11, 25, 9, 0); // Creates different instants!

// ✅ Fix (Temporal): Explicit timezone required
const meeting = Temporal.ZonedDateTime.from(
  "2024-12-25T09:00:00+09:00[Asia/Tokyo]"
);

// ✅ Fix (Luxon):
DateTime.fromObject(
  { year: 2024, month: 12, day: 25, hour: 9 },
  { zone: "Asia/Tokyo" }
);
```

## Testing Time-Dependent Code

```typescript
import { vi, describe, it, beforeEach, afterEach } from "vitest";

describe("time-dependent feature", () => {
  beforeEach(() => {
    // Pin time to known instant
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    // Note: Temporal.Now also respects vi.useFakeTimers() in Vitest,
    // so Temporal.Now.instant() returns the faked time
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles DST correctly", () => {
    // Test with times near DST boundaries
    vi.setSystemTime(new Date("2024-03-10T07:00:00Z")); // DST starts
    // ... test logic
  });

  it("handles year boundaries", () => {
    vi.setSystemTime(new Date("2024-12-31T23:59:59Z"));
    // ... test logic
  });
});
```

## Displaying Times to Users

```typescript
// ✅ Format with Temporal's toLocaleString()
const zdt = Temporal.ZonedDateTime.from(
  "2024-12-25T15:00:00-06:00[America/Chicago]"
);
zdt.toLocaleString("en-US", {
  dateStyle: "medium", timeStyle: "short", timeZoneName: "short"
}); // "Dec 25, 2024, 3:00 PM CST"

// ✅ Show timezone when it matters
"3:00 PM CST" // For single timezone audiences
"3:00 PM (Chicago)" // When timezone clarity needed
"Dec 25 at 9pm your time" // After converting to user's zone

// ✅ Use relative time for recency
"5 minutes ago"
"Yesterday at 3:00 PM"
"Last Tuesday"

// ✅ Show original timezone for events
"9:00 AM Pacific (12:00 PM your time)"
```

## Checklist

Before shipping datetime code, verify:

- [ ] Do I know if this is an instant, local time, or zoned time?
- [ ] Am I using the right Temporal type? (`Instant`, `ZonedDateTime`, `PlainDate`, `PlainTime`, etc.)
- [ ] For instants: Am I storing as UTC/timestamptz?
- [ ] For future events: Am I storing local time + timezone ID?
- [ ] For date-only: Am I using `Temporal.PlainDate` (or string/noon UTC in legacy code)?
- [ ] Am I using IANA timezone names, not abbreviations?
- [ ] Have I tested DST transitions (both spring and fall)?
- [ ] Have I tested year/month boundaries?
- [ ] Is the display timezone explicit to the user when it matters?
- [ ] Am I using Temporal (preferred) or a proper library (date-fns, Luxon) for arithmetic?

## References

- [Temporal API — Bloomberg Engineering](https://bloomberg.github.io/js-blog/post/temporal/) — Bloomberg's deep dive on Temporal (Stage 4 / ES2026)
- [MDN Temporal documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) — API reference
- [TC39 Temporal Proposal](https://tc39.es/proposal-temporal/docs/) — Official specification and cookbook
- [Storing UTC is not a silver bullet](https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/) — Jon Skeet
- [What's wrong with DateTime anyway?](https://blog.nodatime.org/2011/08/what-wrong-with-datetime-anyway.html) — NodaTime
- [Falsehoods programmers believe about time zones](https://www.zainrizvi.io/blog/falsehoods-programmers-believe-about-time-zones/)
- [Always use TIMESTAMPTZ](https://justatheory.com/2012/04/postgres-use-timestamptz/) — PostgreSQL best practices
- [Understanding Dates, Times, and Time Zones](https://learn.microsoft.com/en-us/shows/seth-on-the-road-codemash-2017/understanding-dates-times-time-zones-maggie-pint-matt-johnson-jon-skeet-u) — Maggie Pint, Matt Johnson, Jon Skeet
