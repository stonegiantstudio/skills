# Stone Giant Studio Skills

Skills forged in production. Four tools we built for our own work, extracted
and published because every developer deserves them.

Works with Claude Code, Cursor, Codex, and Gemini CLI.

## Install

```bash
claude plugin add github:stonegiantstudio/skills
```

Or via [skills.sh](https://skills.sh) (works with 50+ agents):

```bash
npx skills add stonegiantstudio/skills
```

## Commands

### /stone-giant:park — Stop Thinking About Work

You close your laptop, but your brain keeps running. Half-finished PRs,
that one bug you didn't get to, the conversation context you'll lose when
this session ends. Psychologists call it the Zeigarnik Effect: unfinished
tasks hijack your attention until you make a concrete plan to finish them.

Park runs a 5-minute shutdown ritual grounded in that research. It surveys
your branches and stashes, captures where you stopped, locks in tomorrow's
first task, and preserves the decisions and discoveries from your current
session. Everything goes into a structured parking receipt that the next
session can read cold.

The result: your brain lets go. Tomorrow morning, you pick up exactly where
you left off.

```
/stone-giant:park              # Full shutdown ritual
/stone-giant:park quick        # Abbreviated version
/stone-giant:park review       # Resume where you left off
```

### /stone-giant:score — Know Exactly Where You Stand

"Is this good enough?" is the question that stalls shipping. You wrote the
plan, the doc, the implementation. Now you're squinting at it, unsure
whether to polish more or move on.

Score builds a rubric tailored to your specific artifact, weighted by what
actually matters (security gets more weight on an API, clarity gets more
weight on a landing page). It scores each dimension, tells you exactly what
would raise the number, and can auto-apply improvements until you hit your
target. Built-in guardrails prevent gaming: an honest 93 beats a padded 96.

Stop guessing. Set a target and let it iterate.

```
/stone-giant:score             # Score the current artifact
/stone-giant:score 90          # Auto-iterate to 90/100
/stone-giant:score 95 README.md  # Iterate a specific file
```

### /stone-giant:eval-npm — Pick Dependencies You Won't Regret

Every `npm install` is a bet. You're betting the maintainer won't disappear,
the package won't get compromised, and something better won't ship next
month. Most developers make that bet on gut feel and star counts.

Eval-npm makes it on data. It pulls maintenance health, download trends,
bundle size, TypeScript support, and security posture for every candidate.
It always expands your search: ask about one package, get a comparison
against the top 2-3 alternatives. The output is a weighted scorecard with
a clear recommendation, not a wall of stats to interpret yourself.

```
/stone-giant:eval-npm date-fns vs dayjs vs moment
/stone-giant:eval-npm audit my package.json
```

## Auto-Triggered Skills

### npm-security-advisory — Catch Threats Before the Feed Does

`npm audit` catches yesterday's vulnerabilities. This skill catches today's.

When eval-npm runs, it automatically triggers a security pre-check against
Socket.dev and OSV.dev. But the real value is in Step 4: metadata anomaly
detection that spots the signatures of a supply-chain attack during the
0-to-72-hour window before threat feeds catch up. A version published 6
hours ago by a new maintainer, with a `postinstall` script that didn't
exist before? That's the pattern. This skill flags it before `npm audit`
even knows there's a problem.

Covers 15 documented attack techniques, from lifecycle hook injection
(event-stream, 2018) to stolen-token rapid republish (Shai-Hulud, 2025).

## What are skills?

Skills are markdown files that give AI coding agents specialized capabilities.
They work across Claude Code, Cursor, Codex, Gemini CLI, and 50+ other
agents via the [agentskills.io](https://agentskills.io) spec. Install once,
use everywhere.

## License

[Apache-2.0](LICENSE)
