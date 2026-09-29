#!/usr/bin/env node
// Read-only: the browsers automation tools have open, how much memory they
// hold, and which were abandoned by a launcher that died. Never stops anything.
// Exit 0 means nothing is abandoned; a session you still have open is listed,
// and is fine.
//   doctor.mjs [--json] [--min-age=<minutes>]     (default 2 minutes, the same as reap.mjs)
import { fileURLToPath } from "node:url";
import { findOrphans, parseMinAge, toolName } from "./lib/processes.mjs";
import { profileRoot } from "./lib/versions.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const unknown = args.filter((a) => a !== "--json" && !a.startsWith("--min-age"));
if (unknown.length) { console.error(`doctor: unknown argument ${unknown[0]}. Usage: doctor.mjs [--json] [--min-age=<minutes>]`); process.exit(2); }
let minAge;
try { minAge = parseMinAge(args); } catch (err) { console.error(`doctor: ${err.message}`); process.exit(2); }

let found;
try { found = findOrphans({ minAgeMinutes: minAge, profileRoot: profileRoot() }); } catch (err) {
  console.error(`doctor: could not read the process table: ${err.message}`);
  process.exit(2);
}
const { browsers, orphans, unverified, tools } = found;
const mb = (kb) => Math.round(kb / 1024);
const age = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m`);
const totalMb = mb(browsers.reduce((s, p) => s + p.totalRssKb, 0));
const reap = fileURLToPath(new URL("./reap.mjs", import.meta.url));
// Browser command lines hold only flags and paths; other tools' command lines
// can hold anything, so only their names are shown.
const brief = (p) => ({ pid: p.pid, ppid: p.ppid, ageSeconds: p.ageSeconds, mb: mb(p.totalRssKb), command: p.args.slice(0, 120) });

if (json) {
  console.log(JSON.stringify({
    browsers: browsers.map(brief), orphans: orphans.map(brief), unverified: unverified.map(brief),
    tools: tools.map((t) => ({ pid: t.pid, name: toolName(t.args) })), totalMb,
  }, null, 2));
} else {
  console.log(`${browsers.length} agent browsers (${browsers.reduce((s, p) => s + p.processes, 0)} processes), ${tools.length} agent tools, ${totalMb} MB`);
  for (const p of browsers) console.log(`  browser  pid ${p.pid}  ${age(p.ageSeconds)}  ${mb(p.totalRssKb)} MB  ${p.args.slice(0, 80)}`);
  for (const p of orphans) console.log(`  ORPHAN   pid ${p.pid}  its launcher is gone`);
  for (const p of unverified) console.log(`  UNREAD   pid ${p.pid}  could not read which program it runs, so it is left alone`);
  console.log(orphans.length
    ? `${orphans.length} abandoned browser(s). Fix: node ${reap} --yes`
    : "clean: no abandoned agent browsers");
}
process.exit(orphans.length ? 1 : 0);
