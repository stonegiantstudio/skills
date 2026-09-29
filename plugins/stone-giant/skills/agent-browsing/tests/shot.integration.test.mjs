// Runs only where `node scripts/setup.mjs` has been done; elsewhere (CI) it
// reports as skipped rather than downloading a browser. Each run is tagged
// with its own id, so "nothing left running" looks only for this test's own
// browser, never at other agents' browsers on the machine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { existsSync, statSync, readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { playwrightDir, profileRoot, sandboxSetting } from "../scripts/lib/versions.mjs";
import { tempDir } from "./temp.mjs";

const ready = existsSync(path.join(playwrightDir(), "node_modules", "playwright-core"));
const skip = ready ? false : "run scripts/setup.mjs first";
const shot = fileURLToPath(new URL("../scripts/shot.mjs", import.meta.url));
const page = fileURLToPath(new URL("./fixtures/page with spaces.html", import.meta.url));

// This user's processes, and the tree a run's browser heads: the processes
// whose command line names the run's profile, and all their descendants
// (renderer and GPU processes do not carry the profile's name).
const ownProcs = () =>
  execFileSync("ps", ["-ww", "-U", String(process.getuid()), "-o", "pid=,ppid=,args="], { encoding: "utf8" })
    .split("\n").filter((l) => l.trim()).map((l) => {
      const [, pid, ppid, args] = l.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
      return { pid: Number(pid), ppid: Number(ppid), args };
    });
function treeOf(runId, procs = ownProcs()) {
  const tree = procs.filter((p) => p.args.includes(`shot-${runId}`));
  for (let i = 0; i < tree.length; i++) tree.push(...procs.filter((p) => p.ppid === tree[i].pid && !tree.includes(p)));
  return tree;
}
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

function runShot(args, env = {}, { interruptWhen, signals = ["SIGINT"] } = {}) {
  const [first, ...more] = signals;
  const runId = randomBytes(6).toString("hex");
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [shot, ...args], { env: { ...process.env, AGENT_BROWSING_RUN_ID: runId, ...env } });
    let stdout = "";
    let stderr = "";
    // Every process the run's browser had while it ran, so "nothing left"
    // covers its children too.
    const seen = new Map();
    const sample = setInterval(() => { for (const p of treeOf(runId)) seen.set(p.pid, p.args); }, 100);
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => {
      stderr += d;
      // Each further signal waits until the first has started the close.
      if (more.length && /closing the browser/.test(stderr)) child.kill(more.shift());
    });
    if (interruptWhen) {
      const poll = setInterval(() => {
        if (!interruptWhen(runId)) return;
        for (const p of treeOf(runId)) seen.set(p.pid, p.args);
        clearInterval(poll);
        child.kill(first);
      }, 50);
      child.on("exit", () => clearInterval(poll));
    }
    child.on("exit", (code) => {
      clearInterval(sample);
      resolve({ code, stdout, stderr, runId, seen, ms: Date.now() - started });
    });
  });
}

// What of a run is still running: any process its browser had, or any new
// one naming its profile.
const leftovers = (r) => [...new Set([...[...r.seen.keys()].filter(alive), ...treeOf(r.runId).map((p) => p.pid)])];
// The run's browser processes right now, for freezing or signalling.
const pidsOf = (runId) => treeOf(runId).map((p) => p.pid);
const profilesLeft = (runId) => (existsSync(profileRoot()) ? readdirSync(profileRoot()).filter((d) => d.startsWith(`shot-${runId}`)) : []);
const listen = (onRequest) => new Promise((resolve) => {
  const s = createServer(onRequest).listen(0, "127.0.0.1", () => resolve(s));
});
// A server that accepts the connection and never answers: a page that never
// loads. requested() turns true once the page has asked, which proves the
// browser finished launching and the page is loading.
async function silent(run) {
  let asked = false;
  const server = await listen(() => { asked = true; });
  try { return await run(`http://127.0.0.1:${server.address().port}/`, () => asked); }
  finally { server.closeAllConnections(); server.close(); }
}

test("a local file with spaces in its name is captured, and nothing of the run is left", { skip }, async () => {
  const out = path.join(tempDir(), "o.png");
  const r = await runShot([page, out]);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(statSync(out).size > 1000);
  assert.deepEqual(leftovers(r), []);
  assert.deepEqual(profilesLeft(r.runId), []);
});

test("a page that never loads times out, and nothing of the run is left", { skip }, () => silent(async (url) => {
  const out = path.join(tempDir(), "o.png");
  const r = await runShot([url, out, "--timeout=3"]);
  assert.equal(r.code, 1, r.stderr);
  assert.ok(r.ms < 20000, `took ${r.ms} ms to give up`);
  assert.deepEqual(leftovers(r), []);
  assert.deepEqual(profilesLeft(r.runId), []);
}));

for (const [what, signals, code] of [
  ["Ctrl-C", ["SIGINT"], 130],
  ["a second Ctrl-C while it is closing", ["SIGINT", "SIGINT"], 130],
  ["Ctrl-\\ (SIGQUIT)", ["SIGQUIT"], 131],
  ["SIGTERM", ["SIGTERM"], 143],
]) {
  test(`${what}, with the page loading: neither the browser nor its profile is left`, { skip }, () => silent(async (url, requested) => {
    const out = path.join(tempDir(), "o.png");
    const r = await runShot([url, out, "--timeout=30"], {}, { interruptWhen: requested, signals });
    assert.equal(r.code, code, r.stderr);
    assert.ok(r.ms < 15000, `took ${r.ms} ms to stop`);
    await new Promise((res) => setTimeout(res, 300));
    assert.deepEqual(leftovers(r), []);
    assert.deepEqual(profilesLeft(r.runId), []);
  }));
}

// Only the preview's own origin is routed, so a request to any other origin
// never meets the header (the route's unit test proves the match). What a local
// run can show is the redirect: the browser follows it as a new request. A
// third party the page itself loads cannot be shown here, because Chrome
// refuses requests to this machine from a page served through interception.
test("the bypass header reaches the preview's own requests, and not the origin it redirects to", { skip }, async () => {
  const seen = { preview: [], thirdParty: [] };
  const third = await listen((req, res) => {
    seen.thirdParty.push(req.headers["x-vercel-protection-bypass"] ?? null);
    res.setHeader("content-type", "text/html");
    res.end("<!doctype html><body>landed</body>");
  });
  const thirdOrigin = `http://127.0.0.1:${third.address().port}`;
  const preview = await listen((req, res) => {
    if (req.url === "/favicon.ico") { res.statusCode = 404; res.end(); return; }
    seen.preview.push([req.url, req.headers["x-vercel-protection-bypass"] ?? null]);
    if (req.url === "/away") { res.writeHead(302, { location: `${thirdOrigin}/landed` }); res.end(); return; }
    if (req.url === "/pixel.png") { res.end(""); return; }
    res.setHeader("content-type", "text/html");
    res.end('<!doctype html><body>preview<img src="/pixel.png"></body>');
  });
  const previewHost = `127.0.0.1:${preview.address().port}`;
  const env = { VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", AGENT_BROWSING_BYPASS_HOSTS: previewHost, DEBUG: "pw:*" };
  try {
    const out = path.join(tempDir(), "o.png");
    const loads = await runShot([`http://${previewHost}/`, out], env);
    assert.equal(loads.code, 0, loads.stderr);
    const redirects = await runShot([`http://${previewHost}/away`, out], env);
    assert.equal(redirects.code, 0, redirects.stderr);
    assert.deepEqual(seen.preview, [["/", "s3cret"], ["/pixel.png", "s3cret"], ["/away", "s3cret"]]);
    assert.deepEqual(seen.thirdParty, [null], "the redirect's target saw the header, or was never reached");
    for (const r of [loads, redirects]) assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);
  } finally {
    preview.close();
    third.close();
  }
});

test("a preview that drops the connection fails the run without printing the secret, and leaves nothing", { skip }, async () => {
  const preview = await listen((req) => { req.socket.destroy(); });
  const previewHost = `127.0.0.1:${preview.address().port}`;
  try {
    const out = path.join(tempDir(), "o.png");
    const r = await runShot([`http://${previewHost}/`, out, "--timeout=10"], {
      VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", AGENT_BROWSING_BYPASS_HOSTS: previewHost,
    });
    assert.equal(r.code, 1, r.stderr);
    assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);
    assert.ok(r.stderr.trim().split("\n").length <= 2, `more than a short error:\n${r.stderr}`);
    assert.deepEqual(leftovers(r), []);
    assert.deepEqual(profilesLeft(r.runId), []);
  } finally {
    preview.close();
  }
});

test("an image of the preview's that fails to load is a broken image, not a failed run", { skip }, async () => {
  const preview = await listen((req, res) => {
    if (req.url === "/broken.png") { req.socket.destroy(); return; }
    res.setHeader("content-type", "text/html");
    res.end('<!doctype html><body>preview<img src="/broken.png"></body>');
  });
  const previewHost = `127.0.0.1:${preview.address().port}`;
  try {
    const out = path.join(tempDir(), "o.png");
    const r = await runShot([`http://${previewHost}/`, out, "--timeout=10"], {
      VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", AGENT_BROWSING_BYPASS_HOSTS: previewHost,
    });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(statSync(out).size > 1000);
  } finally {
    preview.close();
  }
});

// A browser that stops answering: frozen with SIGSTOP, so closing it hangs.
for (const [what, signals, withinMs] of [
  ["one Ctrl-C waits out the grace period, then exits anyway", ["SIGINT"], 12000],
  ["a second Ctrl-C exits at once", ["SIGINT", "SIGINT"], 4000],
]) {
  test(`a browser that stops answering: ${what}, and nothing of the run is left`, { skip }, () => silent(async (url, requested) => {
    const out = path.join(tempDir(), "o.png");
    let runId;
    try {
      const r = await runShot([url, out, "--timeout=30"], {}, {
        signals,
        interruptWhen: (id) => {
          runId = id;
          if (!requested()) return false;
          for (const pid of pidsOf(id)) process.kill(pid, "SIGSTOP");
          return true;
        },
      });
      assert.equal(r.code, 130, r.stderr);
      assert.ok(r.ms < withinMs, `took ${r.ms} ms to stop`);
      await new Promise((res) => setTimeout(res, 300));
      assert.deepEqual(leftovers(r), []);
      assert.deepEqual(profilesLeft(r.runId), []);
    } finally {
      for (const pid of runId ? pidsOf(runId) : []) { try { process.kill(pid, "SIGKILL"); } catch { /* gone */ } }
    }
  }));
}

// A signal while the browser is still starting: the close waits for the launch,
// then closes what it launched. Repeated, because the window is short.
test("a Ctrl-C while the browser is still starting stops the run at once, and nothing of it is left", { skip }, () => silent(async (url) => {
  for (let i = 0; i < 3; i++) {
    const out = path.join(tempDir(), "o.png");
    const r = await runShot([url, out, "--timeout=30"], {}, { interruptWhen: (id) => pidsOf(id).length > 0 });
    assert.equal(r.code, 130, r.stderr);
    assert.ok(r.ms < 10000, `took ${r.ms} ms to stop`);
    await new Promise((res) => setTimeout(res, 300));
    assert.deepEqual(leftovers(r), []);
    assert.deepEqual(profilesLeft(r.runId), []);
  }
}));

test("a browser frozen while it starts: one Ctrl-C waits out the grace period, then exits, and nothing is left", { skip }, () => silent(async (url) => {
  const out = path.join(tempDir(), "o.png");
  let runId;
  try {
    const r = await runShot([url, out, "--timeout=30"], {}, {
      interruptWhen: (id) => {
        runId = id;
        const pids = pidsOf(id);
        if (!pids.length) return false;
        for (const pid of pids) process.kill(pid, "SIGSTOP");
        return true;
      },
    });
    assert.equal(r.code, 130, r.stderr);
    assert.ok(r.ms < 12000, `took ${r.ms} ms to stop`);
    await new Promise((res) => setTimeout(res, 300));
    assert.deepEqual(leftovers(r), []);
    assert.deepEqual(profilesLeft(r.runId), []);
  } finally {
    for (const pid of runId ? pidsOf(runId) : []) { try { process.kill(pid, "SIGKILL"); } catch { /* gone */ } }
  }
}));

test("the browser runs with the sandbox setting setup recorded: without it only where the machine has none", { skip }, () => silent(async (url, requested) => {
  const out = path.join(tempDir(), "o.png");
  let root = null;
  const r = await runShot([url, out, "--timeout=30"], {}, {
    interruptWhen: (id) => {
      if (!requested()) return false;
      root = treeOf(id).find((p) => p.args.includes("--remote-debugging-pipe") && !/(^|\s)--type=/.test(p.args));
      return true;
    },
  });
  assert.equal(r.code, 130, r.stderr);
  assert.ok(root, "the browser was seen");
  assert.equal(/(^|\s)--no-sandbox(\s|$)/.test(root.args), !sandboxSetting(), root.args.slice(0, 300));
  if (process.platform !== "linux") assert.equal(sandboxSetting(), true);
}));

test("a secret set for a host that is not listed sends nothing, and says so", { skip }, async () => {
  const seen = [];
  const server = await listen((req, res) => { seen.push(req.headers["x-vercel-protection-bypass"] ?? null); res.end("<!doctype html>ok"); });
  const host = `127.0.0.1:${server.address().port}`;
  try {
    const out = path.join(tempDir(), "o.png");
    const r = await runShot([`http://${host}/`, out], { VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", AGENT_BROWSING_BYPASS_HOSTS: "other.example.org" });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(seen.length > 0 && seen.every((h) => h === null));
    assert.match(r.stderr, new RegExp(`${host.replace(/\./g, "\\.")} is not in AGENT_BROWSING_BYPASS_HOSTS`));
    assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);
  } finally {
    server.close();
  }
});
