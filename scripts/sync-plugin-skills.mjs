#!/usr/bin/env node
// Generate every derivable file in this repo from its single source of truth,
// ending manual multi-copy maintenance.
//
// Source of truth -> generated output:
//   1. skills/<name>/SKILL.md (+ nested files)
//        -> plugins/stone-giant/skills/<name>/...   (Claude Code plugin)
//      Transforms on the generated plugin copies:
//        - SKILL.md frontmatter: drop the top-level `name:` field
//          (Claude Code infers the name from the directory).
//        - Command references: `/park` -> `/stone-giant:park` for every root
//          skill name. Paths, URLs, and longer identifiers are left alone.
//        - `allowed-tools`: the space-separated source string -> a YAML list
//          (the form the Claude Code plugin spec expects).
//   2. .claude-plugin/marketplace.json  (canonical)
//        -> .codex-plugin/marketplace.json, .cursor-plugin/marketplace.json
//   3. plugins/stone-giant/.claude-plugin/plugin.json  (canonical)
//        -> plugins/stone-giant/.codex-plugin/plugin.json,
//           plugins/stone-giant/.cursor-plugin/plugin.json
//   4. skills/ directory names -> skills.sh.json `groups[0].skills` (sorted)
//
// So: edit skills/ and the canonical .claude-plugin/ manifests, then run sync.
//
// Usage:
//   node scripts/sync-plugin-skills.mjs          # regenerate everything
//   node scripts/sync-plugin-skills.mjs --check  # verify, exit 1 if stale

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "skills");
const OUT = join(ROOT, "plugins", "stone-giant", "skills");
const NS = "stone-giant";
const CHECK = process.argv.includes("--check");

// Canonical manifest -> generated copies (paths relative to ROOT).
const MANIFEST_COPIES = [
  { from: ".claude-plugin/marketplace.json", to: [".codex-plugin/marketplace.json", ".cursor-plugin/marketplace.json"] },
  {
    from: "plugins/stone-giant/.claude-plugin/plugin.json",
    to: ["plugins/stone-giant/.codex-plugin/plugin.json", "plugins/stone-giant/.cursor-plugin/plugin.json"],
  },
];
const SKILLS_SH = "skills.sh.json";

/** Recursively list files under `dir`, relative to `dir`. */
function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full).map((p) => join(entry.name, p)));
    else if (entry.isFile()) out.push(entry.name);
  }
  return out;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Regex matching `/skill` command invocations of the given skill names. */
function buildCommandRegex(skillNames) {
  const alt = [...skillNames].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
  // preceding char (or line start via `m`), then `/<name>` not followed by a
  // word char, hyphen, or slash — so paths/URLs/longer ids are left alone.
  return new RegExp("(^|[\\s`(*>\"'|])\\/(" + alt + ")(?![\\w/-])", "gm");
}

/** Split a SKILL.md into { fm, rest } at the closing `---` fence, or null.
 *  Anchors on a full `---` line (followed by newline or EOF) so a frontmatter
 *  value whose line merely starts with `---` can't truncate it early. */
function splitFrontmatter(md) {
  if (!md.startsWith("---\n")) return null;
  const m = /\n---[ \t]*(?:\n|$)/.exec(md);
  if (!m || m.index < 3) return null;
  return { fm: md.slice(4, m.index), rest: md.slice(m.index) }; // rest begins "\n---"
}

/** Remove the top-level `name:` line from a SKILL.md's YAML frontmatter. */
function stripName(md) {
  const s = splitFrontmatter(md);
  if (!s) return md;
  return "---\n" + s.fm.split("\n").filter((l) => !/^name:/.test(l)).join("\n") + s.rest;
}

/** The Claude Code plugin spec wants `allowed-tools` as a YAML list; the
 *  agentskills.io source uses a space-separated string. Convert the string
 *  form (a list is left as-is). */
function allowedToolsToList(md) {
  const s = splitFrontmatter(md);
  if (!s) return md;
  const fm = s.fm.replace(/^allowed-tools:[ \t]+(\S.*)$/m, (_m, vals) => {
    const items = vals.trim().split(/[\s,]+/).filter(Boolean);
    return "allowed-tools:\n" + items.map((t) => `  - ${t}`).join("\n");
  });
  return "---\n" + fm + s.rest;
}

function transformSkillFile(relPath, buf, cmdRe) {
  if (!relPath.endsWith(".md")) return buf; // copy non-markdown verbatim
  let text = buf.toString("utf8").replace(cmdRe, (_m, pre, name) => `${pre}/${NS}:${name}`);
  if (relPath.endsWith("SKILL.md")) text = allowedToolsToList(stripName(text));
  return Buffer.from(text, "utf8");
}

/** Build map of every generated file: ROOT-relative path -> Buffer. */
function generate() {
  const files = new Map();

  // 1. plugin skill copies
  const skillNames = readdirSync(SRC, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const cmdRe = buildCommandRegex(skillNames);
  for (const rel of listFiles(SRC)) {
    files.set(join("plugins", NS, "skills", rel), transformSkillFile(rel, readFileSync(join(SRC, rel)), cmdRe));
  }

  // 2 & 3. platform manifest copies. Assumed byte-identical to the canonical
  // .claude-plugin/ file — there is no per-destination override layer, so a
  // platform-specific field would be overwritten by sync and its removal
  // enforced by --check. Add an override step here if a platform ever diverges.
  for (const { from, to } of MANIFEST_COPIES) {
    const canonical = readFileSync(join(ROOT, from));
    for (const t of to) files.set(t, canonical);
  }

  // 4. skills.sh.json — regenerate the first group's skill list (alphabetical).
  // This generator owns the skill list and only manages a single group; guard
  // so a future second group can't be silently clobbered.
  const conf = JSON.parse(readFileSync(join(ROOT, SKILLS_SH), "utf8"));
  if (!Array.isArray(conf.groups) || conf.groups.length !== 1) {
    throw new Error(
      `skills.sh.json: expected exactly one group, found ${conf.groups?.length}. ` +
        "Update sync-plugin-skills.mjs to handle multiple groups before adding one."
    );
  }
  conf.groups[0].skills = [...skillNames].sort();
  files.set(SKILLS_SH, Buffer.from(JSON.stringify(conf, null, 2) + "\n", "utf8"));

  return files;
}

function main() {
  if (!existsSync(SRC)) {
    console.error(`Source directory not found: ${SRC}`);
    process.exit(1);
  }
  const expected = generate();

  if (CHECK) {
    const problems = [];
    // stale plugin-skill files (OUT is fully managed by this script)
    if (existsSync(OUT)) {
      for (const rel of listFiles(OUT)) {
        if (!expected.has(join("plugins", NS, "skills", rel))) problems.push(`stale: plugins/${NS}/skills/${rel}`);
      }
    }
    for (const [rel, buf] of expected) {
      const dest = join(ROOT, rel);
      if (!existsSync(dest)) problems.push(`missing: ${rel}`);
      else if (!readFileSync(dest).equals(buf)) problems.push(`out of date: ${rel}`);
    }
    if (problems.length) {
      console.error("Generated files are out of sync (run `npm run sync:plugin-skills`):");
      for (const p of problems.sort()) console.error("  - " + p);
      process.exit(1);
    }
    console.log(`Generated files are up to date (${expected.size} files).`);
    return;
  }

  // sync: rebuild OUT from scratch so deleted skills propagate
  rmSync(OUT, { recursive: true, force: true });
  for (const [rel, buf] of expected) {
    const dest = join(ROOT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
  }
  console.log(`Synced ${expected.size} generated files from skills/ and the canonical manifests.`);
}

main();
