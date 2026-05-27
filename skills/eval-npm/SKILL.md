---
name: eval-npm
description: Evaluate npm packages for maintenance health, community adoption, security posture, and alternatives. Runs security pre-checks via Socket.dev and OSV.dev. Always expands single-package queries into comparisons.
allowed-tools: Bash Read Grep Glob WebFetch WebSearch
---


# NPM Package Evaluator

Evaluate npm packages to find the best option for a given use case. Compare maintenance health, community adoption, and identify promising newcomers while avoiding abandoned projects.

## Instructions

### Step 0: Security Advisory Pre-Check

Before evaluating any packages, run the **npm-security-advisory** skill procedure against the target packages. The skill produces three classes of findings that factor into evaluation:

1. **Advisory hits** from Socket.dev/OSV/npm audit (known CVEs, known malware).
2. **Step 4 metadata anomalies** — supply-chain worm signals: `FRESH`, `SCRIPT_ADDED`, `CADENCE_BURST`, `PROVENANCE_REGRESSION`, `NEW_PUBLISHER`+`FRESH`, `IOC_MATCH`, `YANKED`, etc. These catch attacks before threat feeds do.
3. **Positive signals** like `PROVENANCE_OK` — surface these in the report as confidence-raising evidence.

- **Mode 1 (audit):** Check all packages from package.json. MALWARE/CRITICAL findings (advisory hit OR `IOC_MATCH` OR two combined HIGH Step 4 signals) automatically score 0 on the "Quality Signals: known security vulnerabilities" dimension and get flagged with a red flag. Individual HIGH Step 4 signals knock the dimension down by 3 points each. `PROVENANCE_OK` adds 1 point. **Do not skip evaluation** — the user needs the full picture to choose a replacement.
- **Mode 2 (compare):** Check all candidate packages. Advisory findings and Step 4 signals are surfaced in the comparison table — add a "Supply-chain signals" row alongside the existing "Security" row. A package with active MALWARE findings (advisory or `IOC_MATCH`) gets an automatic "DO NOT USE" recommendation. A package with `PROVENANCE_OK` gets a small ranking boost when alternatives are otherwise tied.

This command supports two modes:

### Mode 1: Package.json Audit

If the user says **"audit my package.json"**, **"check my dependencies"**, **"scan package.json"**, or provides a package.json file:

1. **Read the package.json** from the current directory or the provided file
2. **Extract all dependencies** from both `dependencies` and `devDependencies`
3. **Triage scan each package** - do a quick health check (not full evaluation):
   - Last publish date
   - Weekly downloads trend
   - Known vulnerabilities
   - Maintenance status (active/maintenance-mode/abandoned)

4. **Categorize results:**

For any packages flagged as problematic, use npmtrends to find alternatives:

- Search `[package-name] alternatives site:npmtrends.com` or
- Fetch `https://npmtrends.com/[flagged-pkg]-vs-[known-alternative]` to compare

```text
## Package.json Audit Results

### 🚨 Immediate Attention (Abandoned/Vulnerable)
Packages that are security risks or completely unmaintained:
| Package | Issue | Last Publish | Action |
|---------|-------|--------------|--------|
| left-pad | Abandoned | 3 years ago | Replace with native `.padStart()` |
| vulnerable-pkg | 2 CVEs | 6 months ago | Update or replace |

### ⚠️ Review Recommended (Aging/Declining)
Packages showing warning signs:
| Package | Concern | Better Alternative | Migration Effort |
|---------|---------|-------------------|------------------|
| moment | Maintenance mode | date-fns | Medium |
| request | Deprecated | got, axios, fetch | Medium |

### ✅ Healthy (No Action Needed)
[List packages that are actively maintained with no concerns]

### 📊 Summary
- Total packages: X
- Healthy: X (X%)
- Needs review: X (X%)
- Critical: X (X%)

### 🎯 Recommended Actions (Priority Order)
1. **URGENT**: [package] - [specific action]
2. **Soon**: [package] - [specific action]
3. **When convenient**: [package] - [specific action]
```

1. **Offer deep-dive**: "Want me to do a full evaluation on any of these packages?"

**Efficiency notes for large projects:**

- For projects with 30+ dependencies, batch searches (e.g., "[pkg1] [pkg2] [pkg3] npm maintenance status")
- Prioritize scanning: check obviously risky packages first (old, low downloads, unfamiliar names)
- Skip well-known healthy packages (react, typescript, eslint, etc.) unless specifically asked
- Focus effort on packages in `dependencies` over `devDependencies` (runtime risk > build risk)

### Mode 2: Package Evaluation

When the user provides package names or a category/problem to solve, perform a comprehensive evaluation:

### Step 1: Gather Package Candidates

If given a **category** (e.g., "date formatting", "state management"), search for the top packages in that space.

If given **specific package names**, evaluate those BUT ALSO:

- Search for "best alternatives to [package]" or "[package] vs"
- Identify the top 2-3 competitors in the same problem space
- Include any newer packages gaining traction
- **Always expand a single package query into a comparison** - the user needs context to make a good decision

For example:

- User asks about `moment` → also evaluate `date-fns`, `dayjs`, `luxon`
- User asks about `express` → also evaluate `fastify`, `hono`, `elysia`
- User asks about `lodash` → also evaluate `radash`, `remeda`, or native alternatives

### Step 2: Research Each Package

#### Primary data source: npmtrends.com

For package comparisons, fetch `https://npmtrends.com/[pkg1]-vs-[pkg2]-vs-[pkg3]` to get:

- Download trend graphs (visual trajectory over 1/6/12/24 months)
- Side-by-side stats table (stars, issues, updated, created, size, dependencies)
- Direct comparison of momentum

Example URLs to fetch:

- `https://npmtrends.com/date-fns-vs-dayjs-vs-moment-vs-luxon`
- `https://npmtrends.com/express-vs-fastify-vs-hono-vs-koa`
- `https://npmtrends.com/prisma-vs-drizzle-orm-vs-kysely`

**Always fetch npmtrends first** - it gives you most of the data in one request. Then supplement with additional searches for:

For each package, gather:

#### Maintenance Health (40% weight)

- Last publish date on npm (red flag if >1 year)
- Commit frequency in the last 6 months
- Open vs closed issues ratio
- PR merge velocity
- Number of active maintainers (bus factor risk if 1)
- Whether it's org-backed or solo maintained

#### Community Adoption (30% weight)

- Weekly npm downloads (and trend direction)
- GitHub stars
- Number of dependent packages (npm dependents)
- Stack Overflow question volume
- Discord/community presence

#### Quality Signals (20% weight)

- TypeScript support: native | @types | none
- Bundle size (check bundlephobia.com for frontend packages)
- Known security vulnerabilities
- Dependency count (prefer minimal)
- Documentation quality and examples
- Test coverage if visible

**Trajectory & Momentum (10% weight)** - npmtrends is the primary source for this

- Download trend graph: growing | stable | declining (look at 6-12 month view)
- Crossover points: is a newer package about to overtake an established one?
- Star velocity (recent stars vs total)
- Recent major releases or active roadmap
- Newer alternatives gaining traction

### Step 3: Red Flags to Identify

Explicitly call out packages with:

- ❌ No commits in 12+ months
- ❌ No npm publish in 12+ months
- ❌ Unaddressed security vulnerabilities
- ❌ Single maintainer who appears inactive
- ❌ Declining download trends
- ❌ Archived repository
- ❌ No TypeScript support (for TS projects)
- ❌ Massive bundle size relative to alternatives
- ❌ Excessive dependency tree

### Step 4: Identify Promising Newcomers

Use npmtrends to spot rising packages:

- Look for steep upward curves on newer packages
- Watch for "crossover moments" where a new package overtakes an established one
- Check if a package went from 0 to 100k+ downloads in under 2 years

Look for newer packages that:

- ✨ Were created in the last 2 years
- ✨ Show strong growth trajectory
- ✨ Are backed by known developers/companies
- ✨ Address pain points of established alternatives
- ✨ Have modern architecture (ESM, tree-shakeable, etc.)

### Step 5: Deliver Structured Output

Present findings in this format:

```text
## Package Evaluation: [Category/Use Case]

### Quick Verdict
[1-2 sentence recommendation]

**📈 View trends**: [npmtrends.com/pkg1-vs-pkg2-vs-pkg3](link)

### Score Summary

Rate each package 1-10 and calculate weighted score:

| Package | Maintenance (40%) | Adoption (30%) | Quality (20%) | Trajectory (10%) | **Total** |
|---------|-------------------|----------------|---------------|------------------|-----------|
| queried | 6                 | 8              | 7             | 4                | **6.4**   |
| alt-1   | 9                 | 7              | 9             | 8                | **8.2** ⭐ |
| alt-2   | 8                 | 6              | 8             | 9                | **7.5**   |

**If an alternative scores higher than the package the user asked about, lead with that finding.**

### Comparison Matrix

| Package | Downloads/wk | Stars | Last Publish | TS Support | Bundle | Verdict |
|---------|-------------|-------|--------------|------------|--------|---------|
| pkg-a   | 2.1M        | 45k   | 2 weeks ago  | Native     | 12kb   | ✅ Best |
| pkg-b   | 890k        | 23k   | 8 months ago | @types     | 45kb   | ⚠️ Aging |
| pkg-c   | 150k        | 5k    | 1 week ago   | Native     | 8kb    | 🌟 Rising |

### Detailed Analysis

#### [Package Name] - [Verdict Emoji] [One-word status]
- **Maintenance**: [assessment]
- **Adoption**: [assessment]
- **Quality**: [assessment]
- **Trajectory**: [assessment]
- **Best for**: [use case fit]
- **Watch out for**: [concerns]

### Recommendation

**🏆 Best Overall**: [package] because [reason]

**⚠️ Better Alternatives Exist**: If evaluating a package that scores lower than alternatives, prominently call this out:
> You asked about **[package]**, but **[better-package]** scores higher on [metrics]. Consider switching because [reasons]. Migration effort: [low/medium/high].

**For most projects**: [package] because [reason]

**If you need [specific thing]**: Consider [alternative] because [reason]

**Avoid**: [package] because [reason]

**Keep an eye on**: [newer package] which [promise]
```

### Step 6: Answer Follow-up Questions

Be prepared to:

- Deep dive on any specific package
- Compare specific features
- Check compatibility with user's stack
- Find migration guides between packages
- Identify packages for related needs

## Usage Examples

**Audit mode:**

- "audit my package.json"
- "check my dependencies for problems"
- "scan dependencies" (will look for package.json in current directory)
- "audit this package.json: [paste contents]"
- "which of my packages are abandoned?"

**Evaluation mode:**

- "Evaluate date libraries: date-fns vs dayjs vs luxon vs moment"
- "What's the best React form library in 2024?"
- "Compare ORMs for Node.js with Postgres"
- "Find me a lightweight carousel package"
- "Is lodash still worth using?"

$ARGUMENTS
