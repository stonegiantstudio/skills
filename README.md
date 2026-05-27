# Stone Giant Studio Skills

Production-tested skills for Claude Code (and Cursor, Codex, Gemini CLI).

## Install

```bash
claude plugin add github:stonegiantstudio/skills
```

Or via skills.sh (works with Claude, Cursor, Codex, Gemini CLI):

```bash
npx skills add stonegiantstudio/skills
```

## Commands

### /stone-giant:park — End-of-Day Shutdown Ritual

Park your work at the end of the day. Captures context across branches,
stashes uncommitted changes, logs what you accomplished, and writes a
handoff note so you (or your future self) can pick up cold tomorrow.

```
/stone-giant:park              # Full shutdown ritual
/stone-giant:park quick        # Abbreviated version
/stone-giant:park review       # Resume where you left off
```

### /stone-giant:score — Artifact Scoring

Score any artifact — a plan, PRD, implementation, or document — on a
tailored 1-100 rubric. Pass a target score (e.g., `/stone-giant:score 90`)
to auto-iterate improvements until the target is met.

```
/stone-giant:score             # Score the current artifact
/stone-giant:score 90          # Auto-iterate to 90/100
/stone-giant:score 95 README.md  # Iterate a specific file
```

### /stone-giant:eval-npm — NPM Package Evaluation

Evaluate npm packages for maintenance health, community adoption, security
posture, and alternatives. Checks Socket.dev and OSV.dev for known
vulnerabilities before recommending.

```
/stone-giant:eval-npm date-fns vs dayjs vs moment
/stone-giant:eval-npm audit my package.json
```

## Auto-Triggered Skills

### npm-security-advisory

Runs automatically during eval-npm to pre-check packages for security
advisories, malware, and supply chain compromises via Socket.dev and OSV.dev.

## What are skills?

Skills are markdown files that give AI coding agents specialized capabilities.
They work across Claude Code, Cursor, Codex, Gemini CLI, and 50+ other agents
via the [agentskills.io](https://agentskills.io) spec. Install once, use
everywhere.

## License

[Apache-2.0](LICENSE)
