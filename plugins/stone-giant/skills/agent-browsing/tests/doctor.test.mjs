import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { tempDir } from "./temp.mjs";

const doctor = fileURLToPath(new URL("../scripts/doctor.mjs", import.meta.url));
const mixed = fileURLToPath(new URL("./fixtures/ps-mixed.txt", import.meta.url));
const run = (psFile, extraEnv, ...args) => spawnSync(process.execPath, [doctor, ...args], {
  env: { ...process.env, AGENT_BROWSING_PS_FILE: psFile, AGENT_BROWSING_HOME: "/Users/dev/.cache/agent-browsing", AGENT_BROWSING_PID1: "/sbin/launchd", ...extraEnv },
  encoding: "utf8",
});

test("abandoned browsers make it exit 1 and name the fix by its full path", () => {
  const r = run(mixed, {});
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ORPHAN\s+pid 3001/);
  assert.ok(r.stdout.includes(`node ${path.join(path.dirname(doctor), "reap.mjs")} --yes`));
  for (const pid of [901, 903, 910, 912, 913, 919, 921, 4001]) assert.doesNotMatch(r.stdout, new RegExp(`pid ${pid}\\b`));
});

test("a machine with only a person's browsers and apps is clean", () => {
  const f = path.join(tempDir(), "ps.txt");
  writeFileSync(f, [
    "   901      1 10-02:00:00  410000 Mon Sep 28 13:47:00 2026 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "   910      1    05:00:00   90000 Mon Sep 28 13:47:00 2026 /Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    "",
  ].join("\n"));
  const r = run(f, {});
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^0 agent browsers/);
  assert.match(r.stdout, /clean/);
});

test("--json reports counts and short commands, and names tools without their command lines", () => {
  const j = JSON.parse(run(mixed, {}, "--json").stdout);
  assert.equal(j.orphans.length, 4);
  assert.equal(j.browsers.length, 5);
  assert.ok(j.browsers.every((b) => b.command.length <= 120));
  assert.deepEqual(j.tools, [
    { pid: 916, name: "@playwright/mcp" }, { pid: 2000, name: "playwright-cli" }, { pid: 6001, name: "chrome-devtools-mcp" },
  ]);
});

test("in a container whose launcher is pid 1, only browsers whose parent is really gone are abandoned", () => {
  const j = JSON.parse(run(mixed, { AGENT_BROWSING_PID1: "node server.js" }, "--json").stdout);
  assert.deepEqual(j.orphans.map((p) => p.pid).sort((a, b) => a - b), [4201, 5001]);
});

test("an unreadable process table, a bad --min-age or an unknown argument exits 2", () => {
  assert.equal(run("/nonexistent/ps.txt", {}).status, 2);
  assert.equal(run(mixed, {}, "--min-age=").status, 2);
  assert.equal(run(mixed, {}, "--jsn").status, 2);
});
