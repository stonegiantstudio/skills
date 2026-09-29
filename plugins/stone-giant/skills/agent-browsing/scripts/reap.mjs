#!/usr/bin/env node
// Stop browsers an automation tool launched and then abandoned. A dry run
// unless --yes. What counts as one is decided in lib/processes.mjs; a person's
// own browsers and apps cannot qualify, and each target is proven again, down
// to the executable the operating system reports, right before any signal.
//   reap.mjs [--yes] [--min-age=<minutes>] [--quiet]     (default 2 minutes)
import { findOrphans, readOne, sameOrphan, executableName, parseMinAge } from "./lib/processes.mjs";
import { reapOrphans } from "./lib/reap.mjs";
import { profileRoot } from "./lib/versions.mjs";

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const quiet = args.includes("--quiet");
const say = (msg) => { if (!quiet) console.log(msg); };
const unknown = args.filter((a) => a !== "--yes" && a !== "--quiet" && !a.startsWith("--min-age"));
if (unknown.length) { console.error(`reap: unknown argument ${unknown[0]}. Usage: reap.mjs [--yes] [--min-age=<minutes>] [--quiet]`); process.exit(2); }

let minAge;
try { minAge = parseMinAge(args); } catch (err) { console.error(`reap: ${err.message}`); process.exit(2); }
if (yes && process.env.AGENT_BROWSING_PS_FILE) {
  console.error("reap: --yes reads the live process table only; AGENT_BROWSING_PS_FILE is for dry runs");
  process.exit(2);
}

const root = profileRoot();
let found;
try { found = findOrphans({ minAgeMinutes: minAge, profileRoot: root }); } catch (err) {
  console.error(`reap: could not read the process table: ${err.message}`);
  process.exit(2);
}
const { orphans, unverified, parentArgs, initIsPid1 } = found;
const mb = (p) => `${Math.round(p.totalRssKb / 1024)} MB`;
for (const p of unverified) say(`left pid ${p.pid}: could not read which program it runs`);
if (!orphans.length) { say("nothing to reap"); process.exit(0); }
if (!yes) {
  for (const p of orphans) say(`would stop pid ${p.pid} (${mb(p)}): ${p.args.slice(0, 80)}`);
  say("dry run: add --yes to stop them");
  process.exit(0);
}

const recheck = (p) => sameOrphan(p, readOne(p.pid), { profileRoot: root, parentArgs, initIsPid1, exeName: executableName });
const { stopped, skipped } = await reapOrphans(orphans, {
  recheck, kill: (pid, sig) => process.kill(pid, sig), sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
});
for (const p of stopped) say(`stopped pid ${p.pid} (${mb(p)})`);
for (const p of skipped) say(`left pid ${p.pid}: ${p.reason}`);
