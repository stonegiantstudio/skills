#!/usr/bin/env node
// Sync root `skills/` (source of truth) into `plugins/stone-giant/skills/`
// (generated plugin distribution).
//
// Transforms applied to the generated plugin copies:
//   1. SKILL.md frontmatter: remove the top-level `name:` field
//      (Claude Code infers the skill name from the directory).
//   2. Command references: rewrite root-skill invocations to the plugin
//      namespace, e.g. `/park` -> `/stone-giant:park`. Only tokens that are
//      a leading-slash invocation of a known root skill are rewritten; paths,
//      URLs, and longer identifiers are left alone.
//
// Everything else (nested files like references/*.md, prose, frontmatter
// such as `description`, `allowed-tools`, `metadata`) is copied verbatim.
//
// Usage:
//   node scripts/sync-plugin-skills.mjs          # regenerate plugin skills
//   node scripts/sync-plugin-skills.mjs --check  # verify, exit 1 if stale

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "skills");
const OUT = join(ROOT, "plugins", "stone-giant", "skills");
const NS = "stone-giant";

const CHECK = process.argv.includes("--check");

/** Recursively list files under `dir` as paths relative to `dir`. */
function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full).map((p) => join(entry.name, p)));
    else if (entry.isFile()) out.push(entry.name);
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build the regex that matches `/skill` command invocations of known skills. */
function buildCommandRegex(skillNames) {
  // longest-first so `/sql-server-safety` wins over `/sql-server`
  const alt = [...skillNames].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
  // group 1: allowed preceding char (line start handled by `m` + `^`)
  // then `/<name>` not followed by a word char, hyphen, or slash (path/URL guard)
  return new RegExp("(^|[\\s`(*>\"'|])\\/(" + alt + ")(?![\\w/-])", "gm");
}

/** Remove the top-level `name:` line from a SKILL.md's YAML frontmatter. */
function stripName(md) {
  if (!md.startsWith("---\n")) return md;
  const end = md.indexOf("\n---", 4);
  if (end === -1) return md;
  const fm = md.slice(4, end);
  const rest = md.slice(end); // begins with "\n---"
  const newFm = fm.split("\n").filter((line) => !/^name:/.test(line)).join("\n");
  return "---\n" + newFm + rest;
}

/** Produce the generated plugin content for one source file. */
function transform(relPath, buf, cmdRe) {
  if (!relPath.endsWith(".md")) return buf; // copy non-markdown verbatim
  let text = buf.toString("utf8");
  text = text.replace(cmdRe, (_m, pre, name) => `${pre}/${NS}:${name}`);
  if (relPath.endsWith("SKILL.md")) text = stripName(text);
  return Buffer.from(text, "utf8");
}

/** Build the full map of generated plugin files: relPath -> Buffer. */
function generate() {
  const skillNames = readdirSync(SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const cmdRe = buildCommandRegex(skillNames);
  const files = new Map();
  for (const rel of listFiles(SRC)) {
    files.set(rel, transform(rel, readFileSync(join(SRC, rel)), cmdRe));
  }
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
    const onDisk = existsSync(OUT) ? listFiles(OUT) : [];
    for (const rel of onDisk) {
      if (!expected.has(rel)) problems.push(`stale (not generated): ${rel}`);
    }
    for (const [rel, buf] of expected) {
      const dest = join(OUT, rel);
      if (!existsSync(dest)) problems.push(`missing: ${rel}`);
      else if (!readFileSync(dest).equals(buf)) problems.push(`out of date: ${rel}`);
    }
    if (problems.length) {
      console.error("Plugin skills are out of sync with skills/ (run `npm run sync:plugin-skills`):");
      for (const p of problems.sort()) console.error("  - " + p);
      process.exit(1);
    }
    console.log(`Plugin skills are up to date (${expected.size} files).`);
    return;
  }

  // sync: regenerate from scratch so deletions in skills/ propagate
  rmSync(OUT, { recursive: true, force: true });
  for (const [rel, buf] of expected) {
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
  }
  console.log(`Synced ${expected.size} files from skills/ -> plugins/${NS}/skills/`);
}

main();
