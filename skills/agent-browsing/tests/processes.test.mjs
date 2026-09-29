import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  etimeToSeconds, parsePs, userDataDir, isInit, isAgentBrowserRoot, isAgentTool, toolName, agentBrowsers,
  launcherGone, sameOrphan, parseMinAge, findOrphans, pid1IsInit, executableName, liveParentArgs,
} from "../scripts/lib/processes.mjs";

const fixtureUrl = new URL("./fixtures/ps-mixed.txt", import.meta.url);
const procs = parsePs(readFileSync(fixtureUrl, "utf8"));
const byPid = (pid) => procs.find((p) => p.pid === pid);
const HOME = "/Users/dev/.cache/agent-browsing";
const root = `${HOME}/profiles`;
const browsers = agentBrowsers(procs, root);
const parentArgs = (pid) => byPid(pid)?.args ?? null;
// Apps opened from Finder and the Dock, a crash reporter, VS Code opened on a
// folder named like a browser, shell commands that mention the browser cache,
// browsers started by hand with a debugging port, a tool that opened the
// person's real Chrome profile, chrome-devtools-mcp's persistent window, and
// the second review's decoys: a node process and a grep carrying both flags as
// text, a browser another tool still drives over a port, a profile folder
// that only starts like ours, the pipe flag inside another argument, and from
// the third: a headed window a person opened through Playwright, and a
// browser whose last --user-data-dir, the one Chrome uses, is the person's.
const PEOPLE = [901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918,
  919, 920, 921, 922, 923, 924, 925, 4001, 5000];

test("etime: mm:ss, hh:mm:ss and dd-hh:mm:ss", () => {
  assert.equal(etimeToSeconds("05:00"), 300);
  assert.equal(etimeToSeconds("01:10:00"), 4200);
  assert.equal(etimeToSeconds("43-13:20:44"), 43 * 86400 + 13 * 3600 + 20 * 60 + 44);
});

test("parsePs reads the start time and keeps arguments with spaces whole", () => {
  assert.equal(procs.length, 38);
  assert.equal(byPid(902).args.includes("Google Chrome Helper (Renderer).app"), true);
  assert.equal(byPid(2001).started, "Mon Sep 28 13:47:00 2026");
  assert.equal(byPid(3001).ppid, 1);
});

test("the profile folder is read whole, spaces included", () => {
  assert.equal(userDataDir("x --remote-debugging-pipe --user-data-dir=/Users/a b/profiles/shot-1 --no-first-run"), "/Users/a b/profiles/shot-1");
  assert.equal(userDataDir("x --headless"), null);
  assert.equal(userDataDir("x --user-data-dir=/tmp/a --headless --user-data-dir=/Users/me/Chrome"), "/Users/me/Chrome", "Chrome uses the last one");
});

test("no process a person owns is ever an agent browser", () => {
  for (const pid of PEOPLE) {
    assert.equal(isAgentBrowserRoot(byPid(pid).args, root), false, `pid ${pid} matched: ${byPid(pid).args}`);
  }
});

test("browsers launched by automation, over a pipe with a throwaway profile, are agent browsers", () => {
  assert.deepEqual(browsers.map((b) => b.pid).sort((a, b) => a - b), [2001, 3001, 4101, 4201, 5001]);
});

test("a browser's children are counted in its memory, and never stand alone", () => {
  const b = browsers.find((x) => x.pid === 2001);
  assert.equal(b.processes, 3);
  assert.equal(b.totalRssKb, 150000 + 40000 + 60000);
  // Renderers carry --remote-debugging-pipe (seen live, 2026-09-28); 2003 also
  // repeats its parent's profile, and is still a child, never a root.
  assert.equal(browsers.some((x) => x.pid === 2002 || x.pid === 2003 || x.pid === 3002), false);
});

test("init is judged by the program's own name, never a word in its path", () => {
  assert.equal(isInit("/sbin/launchd"), true);
  assert.equal(isInit("/usr/lib/systemd/systemd --system"), true);
  assert.equal(isInit("/sbin/docker-init -- node server.js"), true);
  assert.equal(isInit("node /srv/init"), false);
  assert.equal(isInit("/opt/initializer/run"), false);
  assert.equal(isInit("sleep infinity"), false);
});

test("the launcher is gone when the parent is missing, is init, or is a desktop session's reaper", () => {
  const gone = (pid, initIsPid1 = true) => launcherGone(byPid(pid), { parentArgs, initIsPid1 });
  assert.equal(gone(2001), false); // its CLI daemon (2000) is alive
  assert.equal(gone(3001), true);  // re-parented to launchd
  assert.equal(gone(4201), true);  // parent 9999 is not in the table
  assert.equal(gone(5001), true);  // re-parented to systemd --user
  // In a container whose own launcher is pid 1, a parent of 1 is alive.
  assert.equal(gone(3001, false), false);
  assert.equal(launcherGone({ ppid: 7 }, { parentArgs: () => "/usr/lib/systemd/systemd --system", initIsPid1: true }), false);
});

test("every Chrome and Edge channel is recognized, and nothing else by its name", () => {
  const flags = "--headless --remote-debugging-pipe --user-data-dir=/tmp/playwright_chromiumdev_profile-x";
  for (const exe of ["/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary", "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    "/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev", "/opt/google/chrome-unstable/google-chrome-unstable", "/usr/bin/msedge-beta"]) {
    assert.equal(isAgentBrowserRoot(`${exe} ${flags}`, root), true, exe);
  }
  assert.equal(isAgentBrowserRoot(`/Applications/Brave Browser.app/Contents/MacOS/Brave Browser ${flags}`, root), false);
});

test("in a live run, a candidate whose executable is not a browser is dropped, and one that cannot be read is set apart", () => {
  const exe = { 2001: "chrome-headless-shell", 3001: "node", 4101: "Google Chrome", 4201: null, 5001: "headless_shell" };
  const found = findOrphans({
    env: { AGENT_BROWSING_PS_FILE: fixtureUrl.pathname, AGENT_BROWSING_PID1: "/sbin/launchd" }, minAgeMinutes: 2, profileRoot: root,
    exeName: (pid) => exe[pid] ?? null,
  });
  assert.deepEqual(found.browsers.map((p) => p.pid).sort((a, b) => a - b), [2001, 4101, 5001]);
  assert.deepEqual(found.orphans.map((p) => p.pid).sort((a, b) => a - b), [4101, 5001]);
  assert.deepEqual(found.unverified.map((p) => p.pid), [4201]);
});

test("a live parent that cannot be read is still a launcher; only one the OS says is gone is gone", () => {
  const timedOut = () => null; // ps gave up under load
  assert.equal(liveParentArgs(2000, { isAlive: () => true, read: timedOut }), "");
  assert.equal(launcherGone({ ppid: 2000 }, { parentArgs: (pid) => liveParentArgs(pid, { isAlive: () => true, read: timedOut }), initIsPid1: true }), false);
  assert.equal(liveParentArgs(2000, { isAlive: () => false, read: () => { throw new Error("never asked"); } }), null);
  assert.equal(liveParentArgs(5000, { isAlive: () => true, read: () => ({ args: "/usr/lib/systemd/systemd --user" }) }), "/usr/lib/systemd/systemd --user");
  assert.equal(liveParentArgs(process.pid), liveParentArgs(process.pid, { isAlive: () => true }), "this process is alive");
});

test("findOrphans: agent browsers whose launcher is gone and that are old enough", () => {
  const at = (min, pid1 = "/sbin/launchd") => findOrphans({
    env: { AGENT_BROWSING_PS_FILE: fixtureUrl.pathname, AGENT_BROWSING_PID1: pid1 }, minAgeMinutes: min, profileRoot: root,
  }).orphans.map((p) => p.pid).sort((a, b) => a - b);
  assert.deepEqual(at(2), [3001, 4101, 4201, 5001]);
  assert.deepEqual(at(30), [3001, 4101, 4201]); // 5001 is ten minutes old
  assert.deepEqual(at(2, "node server.js"), [4201, 5001]);
});

test("AGENT_BROWSING_PID1 is read only with a saved table, never in a live run", () => {
  assert.equal(pid1IsInit({ AGENT_BROWSING_PID1: "/sbin/launchd" }, () => "node server.js"), false);
  assert.equal(pid1IsInit({ AGENT_BROWSING_PID1: "node server.js" }, () => "/sbin/launchd\n"), true);
  assert.equal(pid1IsInit({ AGENT_BROWSING_PS_FILE: fixtureUrl.pathname, AGENT_BROWSING_PID1: "node server.js" }), false);
  assert.equal(pid1IsInit({ AGENT_BROWSING_PS_FILE: fixtureUrl.pathname, AGENT_BROWSING_PID1: "/sbin/launchd" }), true);
});

test("sameOrphan re-proves identity and ownership just before a signal", () => {
  const p = byPid(3001);
  const ctx = { profileRoot: root, parentArgs, initIsPid1: true, exeName: () => "headless_shell" };
  assert.equal(sameOrphan(p, { ...p }, ctx), true);
  assert.equal(sameOrphan(p, null, ctx), false, "gone");
  assert.equal(sameOrphan(p, { ...p, started: "Mon Sep 28 14:00:00 2026" }, ctx), false, "a reused pid");
  assert.equal(sameOrphan(p, { ...p, args: `${p.args} --x` }, ctx), false, "changed arguments");
  assert.equal(sameOrphan(p, { ...p, ppid: 2000 }, ctx), false, "a live launcher adopted it");
  assert.equal(sameOrphan(p, { ...p }, { ...ctx, exeName: () => "node" }), false, "the OS says it is not a browser");
  assert.equal(sameOrphan(p, { ...p }, { ...ctx, exeName: () => null }), false, "the executable cannot be read");
});

test("--min-age takes a number of minutes; anything else is an error, never zero", () => {
  assert.equal(parseMinAge([]), 2);
  assert.equal(parseMinAge(["--min-age=0.5"]), 0.5);
  assert.equal(parseMinAge(["--json", "--min-age=10"]), 10);
  for (const bad of ["--min-age=", "--min-age", "--min-age=soon", "--min-age=-1", "--min-age=1e3"]) {
    assert.throws(() => parseMinAge([bad]), /minutes/, bad);
  }
});

test("a tool is judged by its executable: a shell or pager that mentions one is not a tool", () => {
  assert.equal(isAgentTool(byPid(2000).args), true);
  assert.equal(toolName(byPid(2000).args), "playwright-cli");
  assert.equal(isAgentTool(byPid(6001).args), true);
  assert.equal(isAgentTool(byPid(917).args), false); // bash -lc "npx @playwright/cli ..."
  assert.equal(isAgentTool("/bin/zsh -c npx --yes @playwright/cli@0.1.21 open https://example.com"), false);
  assert.equal(isAgentTool("less /Users/dev/.cache/agent-browsing/playwright-cli.json"), false);
  assert.equal(isAgentTool(byPid(2001).args), false);
});

test("the live pid-1 check reads pid 1, and one it cannot read is a launcher, never init", () => {
  assert.equal(pid1IsInit({}, () => "/usr/lib/systemd/systemd --system\n"), true);
  assert.equal(pid1IsInit({}, () => "sleep infinity\n"), false);
  assert.equal(pid1IsInit({}, () => { throw new Error("ps failed"); }), false);
});

test("the executable is the one the OS runs, not the argv[0] a process claims", { skip: ["darwin", "linux"].includes(process.platform) ? false : "reads /proc or lsof" }, async () => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const decoy = spawn(process.execPath, ["-e", "setTimeout(() => {}, 20000)"], { argv0: chrome, stdio: "ignore" });
  try {
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(executableName(decoy.pid), path.basename(realpathSync(process.execPath)));
    assert.equal(executableName(2 ** 22 + 7), null, "a pid that does not exist");
    assert.equal(executableName(decoy.pid, "win32"), null, "a platform it cannot read fails closed");
  } finally {
    decoy.kill();
  }
});
