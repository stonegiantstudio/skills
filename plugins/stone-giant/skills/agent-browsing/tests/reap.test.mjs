import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { reapOrphans } from "../scripts/lib/reap.mjs";

const reap = fileURLToPath(new URL("../scripts/reap.mjs", import.meta.url));
const mixed = fileURLToPath(new URL("./fixtures/ps-mixed.txt", import.meta.url));
const fixtureEnv = { ...process.env, AGENT_BROWSING_PS_FILE: mixed, AGENT_BROWSING_HOME: "/Users/dev/.cache/agent-browsing", AGENT_BROWSING_PID1: "/sbin/launchd" };
const run = (...args) => spawnSync(process.execPath, [reap, ...args], { env: fixtureEnv, encoding: "utf8" });

// A fake process table for the pure function: which pids are still the same
// process, and which signals were sent. Nothing real is ever signalled here.
function fakeWorld({ exitsOnTerm = [], changed = [], refuses = [] } = {}) {
  const alive = new Set([1, 2, 3]);
  const sent = [];
  return {
    sent,
    recheck: (p) => alive.has(p.pid) && !changed.includes(p.pid),
    kill: (pid, sig) => {
      if (refuses.includes(pid)) throw Object.assign(new Error("not permitted"), { code: "EPERM" });
      sent.push(`${sig} ${pid}`);
      if (sig === "SIGKILL" || exitsOnTerm.includes(pid)) alive.delete(pid);
    },
    sleep: async (ms) => { clock += ms; },
    now: () => clock,
  };
}
let clock = 0;
const targets = [{ pid: 1 }, { pid: 2 }, { pid: 3 }];

test("every target is re-proven before any signal, and a changed one is left alone", async () => {
  const w = fakeWorld({ changed: [2], exitsOnTerm: [1, 3] });
  const r = await reapOrphans(targets, { ...w, graceMs: 300 });
  assert.deepEqual(w.sent, ["SIGTERM 1", "SIGTERM 3"]);
  assert.deepEqual(r.skipped.map((p) => [p.pid, p.reason]), [[2, "it changed since it was read"]]);
});

test("a target that ignores SIGTERM gets SIGKILL after the grace period, and only it", async () => {
  const w = fakeWorld({ exitsOnTerm: [1, 3] });
  await reapOrphans(targets, { ...w, graceMs: 300 });
  assert.deepEqual(w.sent, ["SIGTERM 1", "SIGTERM 2", "SIGTERM 3", "SIGKILL 2"]);
});

test("a signal that fails is reported as that, not as a changed process", async () => {
  const w = fakeWorld({ refuses: [2], exitsOnTerm: [1, 3] });
  const r = await reapOrphans(targets, { ...w, graceMs: 300 });
  assert.deepEqual(r.skipped.map((p) => [p.pid, p.reason]), [[2, "the signal failed (EPERM)"]]);
  assert.deepEqual(r.stopped.map((p) => p.pid), [1, 3]);
});

test("the grace period is wall time: slow rechecks shorten the wait rather than stretch it", async () => {
  let t = 0;
  let checks = 0;
  const sent = [];
  await reapOrphans([{ pid: 5 }], {
    recheck: () => { checks++; t += 400; return true; }, // each ps call takes 400 ms here
    kill: (pid, sig) => sent.push(`${sig} ${pid}`),
    sleep: async (ms) => { t += ms; },
    now: () => t,
    graceMs: 1000,
  });
  assert.deepEqual(sent, ["SIGTERM 5", "SIGKILL 5"]);
  assert.ok(checks <= 4, `${checks} rechecks for a one-second grace period`);
});

test("a pid reused during the wait never gets SIGKILL", async () => {
  const sent = [];
  let checks = 0;
  const r = await reapOrphans([{ pid: 7 }], {
    recheck: () => ++checks === 1, // the same process at first, then someone else's
    kill: (pid, sig) => sent.push(`${sig} ${pid}`),
    sleep: async () => {},
    graceMs: 300,
  });
  assert.deepEqual(sent, ["SIGTERM 7"]);
  assert.deepEqual(r.stopped.map((p) => p.pid), [7]);
});

test("a dry run over a saved table names exactly the orphans, never a person's process", () => {
  const r = run();
  assert.equal(r.status, 0);
  const named = [...r.stdout.matchAll(/would stop pid (\d+)/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
  assert.deepEqual(named, [3001, 4101, 4201, 5001]);
});

test("--yes is refused over a saved table, so a file can never become a kill list", () => {
  const r = run("--yes");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /dry runs/);
});

test("a bad --min-age or an unknown argument is an error, never a run", () => {
  for (const bad of ["--min-age=", "--min-age=soon", "--yse", "yes"]) {
    const r = run(bad);
    assert.equal(r.status, 2, bad);
    assert.doesNotMatch(r.stdout, /would stop/, bad);
  }
});
