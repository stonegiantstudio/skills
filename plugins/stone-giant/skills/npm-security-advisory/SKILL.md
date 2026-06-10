---
description: Security advisory pre-check for npm packages using Socket.dev and OSV.dev. Triggers when installing, updating, evaluating, or adding npm packages. Use BEFORE any install, update, or evaluate operation to detect compromised, malicious, or vulnerable packages and their transitive dependencies.
metadata:
  last_technique_review: "2026-05-18"
  technique_stale_after_days: "30"
---

# npm Security Advisory Pre-Check

Check npm packages against security advisory databases before installing, updating, or evaluating them. This is a mandatory first step — run it before any dependency operation.

## Run Context Detection (shared procedure)

Used by Step 0 below (and by `audit-security check-techniques` if that skill
is installed). Determines whether the user is in the skill's source repo (and
can land updates) or a consumer repo (and must send updates upstream).

**Procedure:**

1. Resolve this `SKILL.md`'s absolute path. The plugin loader knows it — pass `realpath` over the loader-provided path to dereference symlinks (some users symlink a development checkout into `~/.claude/plugins/`).
2. Resolve the cwd's git root: `git rev-parse --show-toplevel 2>/dev/null`. Pass through `realpath` as well.
3. Read the plugin manifest at `<plugin-root>/.claude-plugin/plugin.json` to get the `repository` URL.

**Modes:**

- **Source-repo mode** — the realpath of `SKILL.md` is inside the realpath of the cwd git root. The user can land updates directly. Edits to `SKILL.md` will be persisted to source control.
- **Consumer-repo mode** — any of: the SKILL.md path is outside the cwd git root; the cwd is not a git repo (`git rev-parse` returned empty); plugin-manifest lookup failed; or the realpath comparison errored. Consumer-repo is the **safe default** — when in doubt, treat the skill as read-only and route the user upstream. Local edits in this mode would be overwritten on the next plugin update.

The `repository` URL from the plugin manifest is surfaced in every report regardless of mode — in source-repo mode for the header, in consumer-repo mode as the primary call-to-action target.

## Step 0: Technique Freshness Preflight

The supply-chain threat landscape changes weekly. This skill's detection techniques are a snapshot — they have a `last_technique_review` date in the frontmatter. White-hat researchers regularly publish new attack patterns (new lifecycle-hook abuses, new exfiltration channels, new propagation mechanisms), and we need to know when our skill is behind.

Run **Run Context Detection** (above) before producing any warning text — the call-to-action wording depends on the mode.

Compute `days_since_review = today - last_technique_review` from the frontmatter.

- If `days_since_review <= technique_stale_after_days` (default 30), no warning. The skill is considered current.

- If `technique_stale_after_days < days_since_review <= 2 * technique_stale_after_days` (default 30–60), append a warning to the bottom of every report this skill produces. The warning text differs by run context:

  **Source-repo mode:**
  > ⚠️ **Technique catalog is stale.** This skill's detection rules were last reviewed `[last_technique_review]` ([N] days ago). Supply-chain attack techniques evolve faster than that. Review recent npm security advisories and update Step 4's detection rules to cover any new techniques. After reviewing, bump `last_technique_review` in this file's frontmatter to today's date.

  **Consumer-repo mode:**
  > ⚠️ **Technique catalog is stale.** This skill's detection rules were last reviewed `[last_technique_review]` ([N] days ago). The skill source is at `[repository URL]`. Review recent npm security advisories and file an issue against the source repo with any techniques not yet covered, or notify the skill maintainer. Do not edit `[local skill path]` directly — local edits will be overwritten on the next plugin update.

- If `days_since_review > 2 * technique_stale_after_days` (default >60), prompt the calling command's user *before* running the scan. Same options either mode; only the framing differs:

  > ⛔ **Catalog severely stale ([N] days).** Running with detection rules this old defeats the purpose of the scan. Recommend reviewing recent npm security advisories first to surface missing techniques. *(Source: `[repository URL]` — updates land there, not in this repo.)*
  >
  > **(a)** Search for recent npm supply-chain advisories (last 60 days), compare against the Technique Catalog, and update Step 4 with any new techniques — then continue the scan
  > **(b)** Continue anyway — I accept the risk that recent techniques may go undetected
  > **(c)** Abort
  >
  > Which? (a/b/c)

  On (a), search for recent npm security advisories and supply-chain attack writeups, diff them against the Technique Catalog in this file, propose updates to Step 4 sub-steps and the catalog table, then resume the original scan. On (b), proceed but tag every report-section header with `[STALE CATALOG]`. On (c), exit cleanly. Never bypass this prompt silently.

**Output target:** the warning block goes in the `### Catalog Status` footer of the report template (see Step 8). On a clean report, the footer reads "Current (last reviewed [date])" instead. Always populate the footer — never omit it on the grounds that the catalog is fresh.

**No suppression.** The 30-day warning and 60-day prompt MUST NOT be silenced by a caller flag, environment variable, or option. The only way to clear them is to update `last_technique_review` in the source repo (which means the user actually reviewed the techniques). A bypass mechanism would defeat the purpose — staleness becomes invisible and the catalog drifts unbounded.

Implementations should read the frontmatter via standard YAML tools — do not hardcode the dates in the body of the file.

This preflight is non-blocking and never gates an actual security scan from running. The scan still produces full findings; the warning is appended to the report. A stale catalog is a known gap, not a reason to skip checking what we can.

## Package Manager Detection

Detect the project's package manager by checking for lock files:

- `bun.lockb` → use `bun`
- `pnpm-lock.yaml` → use `pnpm`
- `yarn.lock` → use `yarn`
- `package-lock.json` → use `npm`

Use the detected package manager for all commands below. `<pkg>` represents the detected package manager.

## Step 1: Collect Packages to Check

**Targeted mode** (specific packages passed as arguments):
- If the package is already installed, resolve its version from the lockfile or `<pkg> ls --json --depth=0`
- If the package is NOT yet installed (pre-install check), query the npm registry for the latest version: `npm view <package> version`
- Also check the named packages' direct dependencies

**Full scan mode** (no specific packages):
- Read `package.json` and extract all `dependencies` and `devDependencies`
- Resolve exact installed versions from the lockfile or `<pkg> ls --json --depth=0`

Build the package list as an array of `{name, version}` pairs.

## Step 2: Socket.dev Query (Primary)

> **Requires** the `SOCKET_API_KEY` environment variable. If not set, skip to Step 3 (OSV fallback).

Check if the key is available:

```bash
if [ -z "$SOCKET_API_KEY" ]; then echo "NO_KEY"; else echo "KEY_SET"; fi
```

If `KEY_SET`, proceed with Socket.dev queries.

### 2a. Batch Package Check (PURL Endpoint)

Build a PURL batch payload. PURL format: `pkg:npm/<package>@<version>`
For scoped packages, URL-encode the `@`: `pkg:npm/%40scope/name@version`

```bash
curl -s --max-time 15 -X POST "https://api.socket.dev/v0/purl?alerts=true&compact=true" \
  -H "Authorization: Bearer $SOCKET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"components": [{"purl": "pkg:npm/express@4.18.0"}, {"purl": "pkg:npm/react@18.2.0"}]}'
```

<!-- DEPRECATION NOTE: POST /v0/purl is deprecated, removal scheduled 2026-07-30.
     Revisit before July and migrate to the successor endpoint.
     See https://docs.socket.dev/reference for current endpoints. -->

Batch limit: 1024 PURLs per request. For larger projects, split into multiple requests.

**Parse the response.** For each package, extract:
- `score.supply_chain` — supply chain risk score (0-1, lower is worse)
- `alerts[]` — array of security alerts

**Sample Socket.dev response:**

```json
{
  "pkg:npm/express@4.18.0": {
    "score": {
      "supply_chain": 0.87,
      "quality": 0.92,
      "maintenance": 0.78,
      "vulnerability": 0.95,
      "license": 1.0
    },
    "alerts": [
      {
        "type": "mediumCVE",
        "severity": "medium",
        "key": "GHSA-xxxx-xxxx-xxxx",
        "props": { "summary": "Prototype pollution in qs" }
      }
    ]
  }
}
```

### 2b. Threat Feed Cross-Reference

Query Socket's threat intelligence feed for recently discovered malicious packages:

```bash
curl -s --max-time 15 "https://api.socket.dev/v0/threat-feed" \
  -H "Authorization: Bearer $SOCKET_API_KEY"
```

Cross-reference the threat feed results against the project's dependency list. If any installed package (or its transitive deps) appears in the threat feed, classify as **MALWARE** tier regardless of what the PURL check returned. This catches the freshest threats — packages discovered as malicious in the last hours/days that may not yet be fully scored.

### Socket Error Handling

- **401/403** — API key invalid or insufficient permissions. Warn user, fall through to OSV.
- **429** — Quota exhausted. Warn user, fall through to OSV.
- **Timeout / network error** — Warn user, fall through to OSV.

## Step 3: OSV.dev Query (Fallback)

> Used when `SOCKET_API_KEY` is not set, or when Socket.dev is unreachable. OSV.dev is free and requires no authentication.

```bash
curl -s --max-time 15 -X POST "https://api.osv.dev/v1/querybatch" \
  -H "Content-Type: application/json" \
  -d '{"queries": [{"package": {"name": "express", "ecosystem": "npm"}, "version": "4.18.0"}, {"package": {"name": "react", "ecosystem": "npm"}, "version": "18.2.0"}]}'
```

Batch in groups of 50 queries per request.

**Parse each result's `vulns` array.** Key fields:

- `id` — advisory identifier (e.g., `GHSA-xxxx-xxxx-xxxx`)
- `summary` — human-readable description
- `severity[].score` — CVSS score (string, e.g., `"9.8"`)
- **Malware indicator:** if `affected[].database_specific.source` equals `"ghsa-malware"`, classify as **MALWARE**

**Sample OSV response:**

```json
{
  "results": [
    {
      "vulns": [
        {
          "id": "GHSA-xxxx-xxxx-xxxx",
          "summary": "Malicious code in bad-pkg",
          "severity": [{ "type": "CVSS_V3", "score": "9.8" }],
          "affected": [{
            "package": { "name": "bad-pkg", "ecosystem": "npm" },
            "database_specific": { "source": "ghsa-malware" }
          }]
        }
      ]
    }
  ]
}
```

## Step 4: Supply-Chain Worm Defense (Metadata Anomaly Checks)

Socket and OSV catch malware **after** it has been identified. They miss the 0-to-72-hour window when a Shai-Hulud-style worm is most active — the maintainer's npm token has been stolen, a malicious version has been published, and the threat feed hasn't caught up yet. This step fills that gap by looking at metadata anomalies that distinguish a worm-published version from a normal release.

Run these checks for every *target* version (the version about to be installed or updated to). In full-scan mode, run them against the currently-installed version of each package so existing compromises surface even when no upgrade is happening.

All `npm view` calls in this step support any registry — for monorepos using a private registry, the project's `.npmrc` is honored automatically.

### Batched Metadata Fetch & Cache

Fetch all the metadata Step 4 needs in a single call per package version:

```bash
npm view <pkg>@<version> --json
```

This returns `time`, `scripts`, `_npmUser`, `dist.tarball`, `dist.attestations`, `dist.signatures`, and `maintainers` in one response. Cache the result keyed by `<pkg>@<version>` for the duration of the skill invocation. Subsequent sub-steps (4a–4f) read from the cache instead of issuing separate `npm view <pkg>@<version> time.<version>` / `... scripts` / `... _npmUser` calls. Without batching, Step 4 issues ~5 HTTP requests per package and exceeds 500 requests on midsize projects; with batching it issues 1 per package per version. The illustrative commands in sub-steps below are the unbatched form for clarity — implementations should use the batched form.

On `npm view` failure, retry once after 2 seconds. A second failure for a given package → tag `STEP4_UNAVAILABLE` for that package and continue with the rest of the scan.

### 4a. Publish Timestamp & Age

For each `{name, version}`, fetch the publish timestamp:

```bash
npm view <pkg>@<version> time.<version> --json
```

Compute `age = now - publish_timestamp`.

- `age < 72 hours` → tag `FRESH` (tier INFO). The skill only reports; callers decide whether to skip.
- `age >= 72 hours` → no tag.

### 4b. Lifecycle Script Diff

Shai-Hulud and similar worms need to execute on install. They almost always add a `postinstall`, `preinstall`, or `install` script — even if the package never had one. A lifecycle script that *appeared* in the target version is the single highest-confidence signal of a maintainer-account compromise.

For each *update*, fetch the scripts from both versions:

```bash
npm view <pkg>@<current-version> scripts --json
npm view <pkg>@<target-version> scripts --json
```

Compare:

- Target has `postinstall`/`preinstall`/`install` AND current did not → tag `SCRIPT_ADDED`. Tier escalates with `FRESH`:
  - `SCRIPT_ADDED` + `FRESH` → **HIGH** (warn, confirm). A version <72h old that added a lifecycle hook is the textbook worm signature.
  - `SCRIPT_ADDED` alone (target ≥72h) → INFO. Common in legitimate adoption of build helpers like `node-pre-gyp`, `node-gyp`, or post-install binary fetchers.
- Both have a lifecycle script and the *normalized* body changed → tag `SCRIPT_CHANGED`. Normalize by: strip comments, collapse whitespace, sort `npm run <x> && npm run <y>` clauses. If only the script *name* changed but the normalized body is identical, no tag. Tier:
  - `SCRIPT_CHANGED` + `FRESH` → HIGH (warn, confirm).
  - `SCRIPT_CHANGED` alone → INFO.
- Neither has a lifecycle script → no tag.

For *new installs* (no previous version): if the package has any lifecycle script, tag `SCRIPT_PRESENT` at tier INFO. Many legitimate packages have install scripts, so don't block — just surface it.

### 4c. Publish-Cadence Anomaly

A compromised maintainer account is often used to publish malicious versions across every package they own, in rapid succession. The signature: a package whose normal release cadence is months suddenly has 3+ releases in 24 hours.

Fetch the publish history:

```bash
npm view <pkg> time --json
```

From the last 10 stable versions (ignore prereleases like `-alpha`, `-beta`, `-rc`, `-next`):

1. `median_gap` = median gap between consecutive publish timestamps.
2. `current_gap` = gap between target version and the version immediately before it.
3. `burst_count` = number of versions published in the 24 hours before the target.

Flag conditions:

- `burst_count >= 3` → tag `CADENCE_BURST` (tier HIGH).
- `current_gap < median_gap * 0.1` AND `median_gap > 7 days` → tag `CADENCE_ANOMALY` (tier HIGH).

Skip these checks for packages with fewer than 5 historical stable versions (not enough signal).

### 4d. Provenance Attestation

npm provenance ties a package version to a public, attested CI build. Versions with provenance are dramatically harder to forge — a worm cannot publish a "provenance-attested" malicious version without also compromising the build pipeline.

```bash
npm view <pkg>@<version> --json
```

Look at `dist.attestations` (and optionally `dist.signatures`).

- Target has provenance → tag `PROVENANCE_OK` (tier INFO, positive signal).
- Current had provenance, target does not → tag `PROVENANCE_REGRESSION` (tier HIGH). A strong compromise signal: an attacker can't reproduce the legitimate CI build, so they publish without attestation.
- Neither has provenance → no tag (most packages don't have it yet, so absence isn't itself a signal).

### 4e. Maintainer & Publisher Anomaly

```bash
npm view <pkg> maintainers --json
npm view <pkg>@<version> _npmUser --json
```

Compare the *publisher* of the target version (`_npmUser`) against the publishers of the last 5 versions.

- Target version published by an account that has never published this package before AND `FRESH` is also tagged → tag `NEW_PUBLISHER` (tier HIGH). A new maintainer publishing an old, stable version is fine; a new maintainer publishing a brand-new version is the worm signature.
- Otherwise → no tag.

### 4f. Known-IoC Heuristics (Lifecycle Scripts + Tarball Payload)

Worm payloads almost always live in a JS file inside the tarball, *not* in `package.json` scripts — the `postinstall` script is just `node bundle.js` and the real damage is in `bundle.js`. Step 4f scans both layers.

**Layer 1 — lifecycle script body** (from 4b, no extra fetch). Run pattern matches against the normalized script source.

**Layer 2 — tarball payload** (only when 4b tagged `SCRIPT_ADDED` or `SCRIPT_CHANGED`, or when 4a tagged `FRESH`). Otherwise, layer 2 is too expensive to run on every package.

Layer 2 procedure:

1. From the cached `npm view` response, read `dist.tarball` (a tgz URL).
2. Download the tarball: `curl -sL --max-time 30 -o /tmp/<pkg>-<version>.tgz <dist.tarball>`. Cap at 50 MB; abort and tag `TARBALL_OVERSIZED` (tier INFO) on larger packages.
3. List entries without extracting: `tar -tzf /tmp/<pkg>-<version>.tgz`.
4. Identify suspect-named files: `bundle.js`, `setup_bun.js`, `processor.js`, `dist/bundle.js`, `worm.js`, `index.payload.js`, plus any JS file >500KB (worms are typically minified+packed and unusually large).
5. Extract only those files: `tar -xzf /tmp/<pkg>-<version>.tgz -C /tmp/<pkg>-scan/ <suspect-paths>`.
6. Run pattern matches against the extracted contents.

**Patterns (apply to lifecycle script source AND extracted tarball files):**

| Pattern | Description |
|---|---|
| `node\s+(bundle\|setup_bun\|processor\|worm)\.js` in script | Bundled-payload execution |
| `gist\.githubusercontent\.com\|pastebin\.com\|raw\.githubusercontent\.com/[^/]+/[^/]+/[a-f0-9]{40}` | Fetching code from raw-content hosts |
| Base64 strings ≥ 1024 chars (single token) | Embedded payload blob |
| String `"Shai-Hulud"`, `"shai-hulud"`, `"shai_hulud"` | Worm self-signature |
| `trufflehog`, `gitleaks` binary refs in non-test files | Credential-scanner abuse |
| `process\.env` enumerated AND POSTed to an external URL | Env exfiltration (look for `Object.keys(process.env)` or `JSON.stringify(process.env)` near `fetch(` / `XMLHttpRequest` / `https.request`) |
| `npm publish` / `npm token` shell-out from a runtime file | Self-propagation primitive |
| Embedded private SSH key headers (`-----BEGIN OPENSSH PRIVATE KEY-----`) | Credential staging |

A match → tag `IOC_MATCH` at tier **MALWARE** (HARD STOP). Include the matched pattern name in the report so the user can verify. Override requires explicit user confirmation that names the specific pattern matched — this prevents a careless "y" from approving an actual worm.

**False-positive guardrail.** A handful of legitimate packages match individual patterns (esbuild fetches platform binaries from a CDN; some packages ship trufflehog as a dev-time tool). When the ONLY match is `gist/pastebin fetch` from a binary CDN owned by the package's verified maintainer (e.g., a github.com release URL under the package's repo org), demote to HIGH instead of MALWARE. Verify the org match against `repository.url` in the cached `npm view` response.

### 4g. Yanked / Retracted Version Detection

When a malicious version is identified by the ecosystem, npm typically unpublishes or deprecates it. Your lockfile still pins to the bad version though — `npm install` will fail, but more dangerously, a CI cache may still have the tarball locally.

For each *currently-installed* version, check that it still exists in the registry:

```bash
npm view <pkg> versions --json
```

- Installed version absent from the `versions` array → tag `YANKED` (tier **HIGH**). Recommend: update to the latest unaffected version, or pin to a known-good prior version. This is a signal that the ecosystem has retracted what you have installed.
- Installed version still present but marked deprecated → tag `DEPRECATED_INSTALLED` (tier INFO). Check `npm view <pkg>@<version> deprecated` for the deprecation message; surface it.

### Technique Catalog (Covered Techniques)

The catalog below is the authoritative list of supply-chain attack techniques this skill detects. Periodic reviews should diff recent advisory writeups against this list to identify newly-published techniques the skill does not yet cover.

| Technique | Detection sub-step | First documented |
|---|---|---|
| Stolen-token rapid republish (0-72h window) | 4a `FRESH` | Shai-Hulud, Sep 2025 |
| Lifecycle hook injection (postinstall added) | 4b `SCRIPT_ADDED` | event-stream, Nov 2018 |
| Lifecycle hook body swap | 4b `SCRIPT_CHANGED` | ua-parser-js, Oct 2021 |
| Maintainer-account propagation burst | 4c `CADENCE_BURST` | Shai-Hulud, Sep 2025 |
| Slow-cadence anomaly publish | 4c `CADENCE_ANOMALY` | Generic |
| Provenance attestation regression | 4d `PROVENANCE_REGRESSION` | npm provenance launch, 2023 |
| New publisher on fresh version | 4e `NEW_PUBLISHER` | Generic account-takeover |
| Bundled tarball payload (bundle.js / setup_bun.js) | 4f Layer 2 IoC scan | Shai-Hulud 2.0, Nov 2025 |
| Credential-scanner abuse (trufflehog/gitleaks in deps) | 4f IoC pattern | Shai-Hulud, Sep 2025 |
| Environment exfiltration via fetch | 4f IoC pattern | Multiple, ongoing |
| Raw-content host fetch from install script | 4f IoC pattern | Generic |
| Embedded SSH private key staging | 4f IoC pattern | Multiple, ongoing |
| Self-propagation primitive (`npm publish` shell-out) | 4f IoC pattern | Shai-Hulud, Sep 2025 |
| Yanked-version installed (post-incident) | 4g `YANKED` | Generic remediation gap |
| Transitive-dep compromise (axios → plain-crypto-js pattern) | Step 6 + Step 4 on transitive | axios, Mar 2026 |

**Maintainer contract.** All catalog edits happen in the skill's source repository (see `repository` in `<plugin-root>/.claude-plugin/plugin.json`), not in consuming app repos. The catalog is the source of truth: a technique is "covered" only if it has a row.

When adding a new technique, all of the following must change together:

1. **Step 4 sub-step body** — define the detection logic, the signal tag(s), and false-positive guardrails.
2. **Tier mapping table in Step 8** — add a row mapping each new signal tag to its tier and action. A new signal without a tier row is unscored and effectively invisible.
3. **Technique Catalog row** (this section) — record the human-readable technique name, sub-step reference, and first-documented date.
4. **`last_technique_review` frontmatter** — bump to today's date.
5. **Regression spot-check** — before landing, run the updated skill against a small sample of known-legitimate, widely-used packages that match the new pattern's surface (e.g., for a new lifecycle-script signal: `esbuild`, `node-pre-gyp`, `puppeteer`, `playwright` — packages with legitimate install scripts) and confirm no false positives. Document the sample in the PR description.

Removing a row without updating Step 4 is a bug. Updating Step 4 without updating the catalog or tier table is also a bug — the change won't surface in reports.

## Step 5: Package Manager Audit (Complementary — Always Runs)

Regardless of whether Socket or OSV was used, also run the built-in audit:

```bash
<pkg> audit --json
```

Parse the output and merge findings with results from Step 2/3. Deduplicate by advisory ID across all sources.

**Note:** The JSON output format differs by package manager. Key differences:
- **npm** — `advisories` object keyed by advisory ID, each with `severity`, `title`, `module_name`
- **pnpm** — `advisories` object similar to npm but may include `metadata.vulnerabilities` summary
- **bun** — may not support `--json` flag; fall back to parsing text output or skip this step for bun

## Step 6: Transitive Dependency Check

For each top-level package, discover its direct dependencies:

```bash
<pkg> ls <package-name> --json --depth=1
```

Collect all depth-1 dependencies discovered across all top-level packages. Then run Steps 2, 3, and 4 against these transitive dependencies (same batch process). Check depth 1 only — this is a deliberate tradeoff: deeper checks are exponentially expensive, and the immediate dependency layer catches the most common attack vector.

**Run Step 4 against transitive deps too** — a Shai-Hulud variant frequently compromises a small leaf utility (a logger, a tinycolor helper) that is pulled in by a well-known package. The top-level package itself looks fine; the freshness/lifecycle/IoC anomalies live one layer down.

**Example — axios compromise (2026-03-30):** The axios package itself was not malicious, but its compromised version added a dependency on `plain-crypto-js@4.2.1`, which contained credential-stealing malware. A depth-1 transitive check catches this: axios passes the top-level check, but `<pkg> ls axios --json --depth=1` reveals `plain-crypto-js`, which the Socket threat feed or OSV GHSA-malware entry flags as MALWARE. Result: the entire axios update is blocked.

## Step 7: Check .security-ignore

If a `.security-ignore` file exists in the project root, load it. Format:

```
# Package + advisory pairs to suppress (one per line)
express GHSA-xxxx-xxxx-xxxx   # Known false positive, verified 2026-03-31
lodash GHSA-yyyy-yyyy-yyyy    # Accepted risk, mitigated by input validation
```

Matching advisories are moved to a "Suppressed" section in the report — never silently hidden.

**Security note:** The `.security-ignore` file itself can be an attack vector — a malicious PR could add ignore entries to suppress alerts. Changes to this file should always be reviewed carefully in PRs.

## Step 8: Classify and Report

### Alert Type to Tier Mapping

**From Socket.dev alerts:**

| Socket Alert Type | Tier | Action |
|---|---|---|
| Known Malware | MALWARE | HARD STOP |
| Possible Typosquat | MALWARE | HARD STOP |
| Threat feed match | MALWARE | HARD STOP |
| Critical CVE | CRITICAL | HARD STOP |
| Protestware | HIGH | Warn, confirm |
| Obfuscated Code | HIGH | Warn, confirm |
| High CVE | HIGH | Warn, confirm |
| supply_chain score < 0.3 | HIGH | Warn, confirm |
| Medium/Low CVE | INFO | Report, proceed |
| Telemetry | INFO | Report, proceed |
| Deprecated | INFO | Report, proceed |

**From OSV.dev:**

| Condition | Tier | Action |
|---|---|---|
| `database_specific.source` = `"ghsa-malware"` | MALWARE | HARD STOP |
| CVSS >= 9.0 | CRITICAL | HARD STOP |
| CVSS >= 7.0 | HIGH | Warn, confirm |
| CVSS < 7.0 | INFO | Report, proceed |

**From Step 4 (worm-defense metadata anomalies):**

| Signal | Tier | Action |
|---|---|---|
| `IOC_MATCH` | MALWARE | HARD STOP (override requires user-typed pattern name) |
| `SCRIPT_ADDED` + `FRESH` | HIGH | Warn, confirm |
| `SCRIPT_CHANGED` + `FRESH` | HIGH | Warn, confirm |
| `CADENCE_BURST` | HIGH | Warn, confirm |
| `CADENCE_ANOMALY` | HIGH | Warn, confirm |
| `PROVENANCE_REGRESSION` | HIGH | Warn, confirm |
| `NEW_PUBLISHER` + `FRESH` | HIGH | Warn, confirm |
| `YANKED` | HIGH | Warn — installed version no longer in registry; remediate |
| `SCRIPT_ADDED` (alone, target ≥72h) | INFO | Report |
| `SCRIPT_CHANGED` (alone, target ≥72h) | INFO | Report |
| `FRESH` (alone) | INFO | Report (callers may quarantine) |
| `SCRIPT_PRESENT` (new install) | INFO | Report |
| `DEPRECATED_INSTALLED` | INFO | Report deprecation message |
| `PROVENANCE_OK` | INFO | Report (positive signal) |
| `TARBALL_OVERSIZED` | INFO | Report (scan skipped on package >50MB) |
| `STEP4_UNAVAILABLE` | INFO | Report and surface — never silently skip |

**Combining signals.** When a package has two or more HIGH-tier Step 4 signals (e.g., `FRESH` + `SCRIPT_ADDED` + `NEW_PUBLISHER`, or `CADENCE_BURST` + `PROVENANCE_REGRESSION`), promote the package to **CRITICAL** tier. Each signal individually has noise; two or more together is the worm signature.

### Tier Actions

- **MALWARE** — HARD STOP. Do not install, update, or proceed. Alert the user immediately with full details. Recommend immediate removal if already installed.
- **CRITICAL** — HARD STOP. Alert the user. Recommend immediate remediation or replacement.
- **HIGH** — WARN. Present findings and ask the user for explicit confirmation before proceeding.
- **INFO** — INFORM. Include in the report summary. Proceed normally.

### Report Format (Findings)

```
## Security Advisory Check

**Source:** Socket.dev + <pkg> audit (or OSV.dev + <pkg> audit if no Socket key) + Step 4 metadata checks
**Packages scanned:** X | **Transitive deps checked:** Y

### BLOCKED — Malware / Critical (N found)

| Package | Version | Advisory | Source | Details |
|---------|---------|----------|--------|---------|
| bad-pkg | 1.2.3 | GHSA-xxxx | Socket: Known Malware | DO NOT INSTALL |

### Warnings — High Severity (N found)

| Package | Version | Advisory / Signal | Source | Summary |
|---------|---------|-------------------|--------|---------|
| pkg-a   | 2.0.0   | SCRIPT_ADDED       | Step 4b | Target added postinstall; previous version had none |

### Worm-Defense Signals — Informational (N found)

| Package | Version | Signal | Detail |
|---------|---------|--------|--------|
| pkg-b   | 3.1.0   | FRESH  | Published 14h ago — caller may quarantine |
| pkg-c   | 1.4.0   | PROVENANCE_OK | Signed by GitHub Actions attestation |

### Informational CVEs (N found)

| Package | Version | Advisory | CVSS | Summary |
|---------|---------|----------|------|---------|

### Suppressed (N entries in .security-ignore)

| Package | Advisory | Reason |
|---------|----------|--------|

### Clean

All other packages passed security checks.

### Catalog Status

[Always present. Populated by Step 0 — shows the staleness-warning block when applicable,
or "Current (last reviewed [date])" when within the threshold. Never omit this section,
even on a clean report — users need to see whether the clean result was produced by a
current or stale catalog.]
```

### Report Format (No Findings)

```
## Security Advisory Check — All Clear

**Source:** Socket.dev + <pkg> audit
**Packages scanned:** X | **Transitive deps checked:** Y
No security advisories, malware, or supply chain risks detected.

### Catalog Status

[Same slot as in the findings template — always present, even on All Clear.]
```

## Fallback Chain

If any source is unreachable, degrade gracefully:

1. Try Socket.dev → if unreachable/401/403/429, warn and continue to next source
2. Try OSV.dev → if unreachable, warn and continue
3. Always attempt Step 4 (metadata anomaly checks) — uses only the npm registry, which is independent of Socket/OSV reachability. Step 4 is the *only* defense against fresh attacks, so it must not be skipped because a different source failed.
4. Always run `<pkg> audit --json`
5. If Socket, OSV, AND `<pkg> audit` ALL fail → do NOT silently proceed. Ask the user: "All advisory databases are unreachable. Proceed without external security check? (Step 4 metadata checks have still run if the npm registry was reachable.)"
6. If the npm registry itself is unreachable → Step 4 reports `STEP4_UNAVAILABLE`. Surface this prominently; do not let it be lost in a "clean" report.

Always include `--max-time 15` on `curl` calls to avoid hanging on unresponsive endpoints.
