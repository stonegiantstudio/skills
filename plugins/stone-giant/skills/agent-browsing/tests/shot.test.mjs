import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdirSync, symlinkSync, utimesSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseArgs, toUrl, bypassFor, installBypass, redact, browserEnv, sweepStaleProfiles } from "../scripts/shot.mjs";
import { tempDir } from "./temp.mjs";

const shot = fileURLToPath(new URL("../scripts/shot.mjs", import.meta.url));
const runShot = (args, env = {}, script = shot) =>
  spawnSync(process.execPath, [script, ...args], { env: { ...process.env, ...env }, encoding: "utf8" });

test("a relative path with spaces becomes a correct file URL", () => {
  assert.equal(toUrl("docs/my page.html", "/work/repo", "/h"), "file:///work/repo/docs/my%20page.html");
});

test("~ expands to home, and URLs pass through", () => {
  assert.equal(toUrl("~/a.html", "/x", "/h"), "file:///h/a.html");
  assert.equal(toUrl("https://example.com/a?b=1", "/x", "/h"), "https://example.com/a?b=1");
  assert.equal(toUrl("http://localhost:5173/", "/x", "/h"), "http://localhost:5173/");
  assert.equal(toUrl("data:text/html,<h1>ok</h1>", "/x", "/h"), "data:text/html,<h1>ok</h1>");
});

test("a host written without its scheme is an error that says how to write it, not a page that fails", () => {
  assert.throws(() => toUrl("localhost:5173/", "/x", "/h", () => false), /http:\/\/localhost:5173\//);
  assert.throws(() => toUrl("javascript:alert(1)", "/x", "/h", () => false), /not a URL/);
  assert.throws(() => toUrl("127.0.0.1:5173/", "/x", "/h", () => false), /http:\/\/127\.0\.0\.1:5173\//);
  assert.throws(() => toUrl("[::1]:8080", "/x", "/h", () => false), /http:\/\/\[::1\]:8080/);
  assert.equal(toUrl("docs/a:1.html", "/x", "/h", () => false), "file:///x/docs/a:1.html", "a path with a colon further on is a path");
  assert.equal(toUrl("about:blank", "/x", "/h"), "about:blank");
  assert.equal(toUrl("a:b.html", "/x", "/h", (p) => p === "/x/a:b.html"), "file:///x/a:b.html", "a file by that name is a file");
  assert.equal(runShot(["localhost:5173/", "o.png"]).status, 2);
});

test("a run id that is not a plain word is refused, so a profile can never land outside the swept folder", () => {
  const r = runShot(["a.html", "o.png"], { AGENT_BROWSING_RUN_ID: "../../x" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /AGENT_BROWSING_RUN_ID/);
});

test("a #fragment on a local path becomes the page anchor, so one frame of a mockup can be shot", () => {
  const none = () => false;
  assert.equal(toUrl("docs/a b.html#frame-D2", "/work/repo", "/h", none), "file:///work/repo/docs/a%20b.html#frame-D2");
  const hashFile = (p) => p === "/work/repo/odd#name.html";
  assert.equal(toUrl("odd#name.html", "/work/repo", "/h", hashFile), "file:///work/repo/odd%23name.html");
});

test("arguments parse, and anything malformed or out of range is an error", () => {
  const a = parseArgs(["a.html", "out.png", "--viewport=390x844", "--full-page", "--wait=500", "--timeout=10"]);
  assert.deepEqual(a.viewport, { width: 390, height: 844 });
  assert.equal(a.fullPage, true);
  assert.equal(a.waitMs, 500);
  assert.equal(a.timeoutMs, 10000);
  assert.equal(parseArgs(["a.html", "out.png", "--timeout=300"]).timeoutMs, 300000);
  for (const [flag, why] of [
    ["--viewport=wide", /viewport/], ["--viewport=0x0", /viewport/], ["--viewport=20000x10", /viewport/],
    ["--timeout=30s", /timeout/], ["--timeout=0", /timeout/], ["--timeout=1000000", /timeout/],
    ["--wait=abc", /wait/], ["--wait=999999", /wait/], ["--fullpage", /unknown/],
  ]) assert.throws(() => parseArgs(["a.html", "out.png", flag]), why, flag);
  assert.throws(() => parseArgs(["a.html"]), /usage/);
});

test("bad arguments and a malformed URL exit 2, as documented", () => {
  assert.equal(runShot(["a.html", "o.png", "--timeout=30s"]).status, 2);
  assert.equal(runShot(["a.html", "o.png", "--viewport=0x0"]).status, 2);
  assert.equal(runShot(["http://[::1", "o.png"]).status, 2);
});

test("an output that exists and is not a regular file is refused, since a FIFO would hang the exit", () => {
  const dir = tempDir();
  const r = runShot(["a.html", dir]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /not a regular file/);
});

test("run through a symlink, as Claude Code loads the skill, the script still runs", () => {
  const link = path.join(tempDir(), "scripts");
  symlinkSync(path.dirname(shot), link);
  const r = runShot(["a.html", "o.png", "--timeout=30s"], {}, path.join(link, "shot.mjs"));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /timeout/);
});

test("the bypass secret goes only to hosts listed exactly, over https unless the host is this machine", () => {
  const env = { VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret" };
  // Nothing is listed: no host gets it, a Vercel preview included.
  assert.equal(bypassFor("https://app-git-x-myteam.vercel.app/path", env), null);
  const listed = { ...env, AGENT_BROWSING_BYPASS_HOSTS: "app-git-x-myteam.vercel.app, preview.example.org, 127.0.0.1:4100" };
  const b = bypassFor("https://app-git-x-myteam.vercel.app/path", listed);
  assert.equal(b.origin, "https://app-git-x-myteam.vercel.app");
  assert.deepEqual(b.headers, { "x-vercel-protection-bypass": "s3cret", "x-vercel-set-bypass-cookie": "true" });
  assert.equal(bypassFor("https://preview.example.org/x", listed).origin, "https://preview.example.org");
  assert.equal(bypassFor("http://127.0.0.1:4100/", listed).origin, "http://127.0.0.1:4100");
  assert.equal(bypassFor("https://someone-else.vercel.app/", listed), null);
  assert.equal(bypassFor("https://app-git-x-myteam.vercel.app.evil.com/", listed), null);
  assert.equal(bypassFor("https://x.preview.example.org/", listed), null, "a subdomain is another host");
  assert.equal(bypassFor("http://preview.example.org/", listed), null, "plain http off this machine");
  assert.equal(bypassFor("http://127.0.0.1:4101/", listed), null);
  assert.equal(bypassFor("file:///a.html", listed), null);
  assert.equal(bypassFor("https://preview.example.org/", { AGENT_BROWSING_BYPASS_HOSTS: "preview.example.org" }), null);
  for (const wild of ["*-myteam.vercel.app", "*", "*.example.org"]) {
    assert.throws(() => bypassFor("https://a-myteam.vercel.app/", { ...env, AGENT_BROWSING_BYPASS_HOSTS: wild }), /exact hosts/, wild);
  }
  assert.throws(() => bypassFor("https://preview.example.org/", { ...listed, VERCEL_AUTOMATION_BYPASS_SECRET: "a\nb" }), /line break/);
});

test("the route covers the target origin alone, fetches without following redirects, and adds the headers", async () => {
  const routes = [];
  await installBypass({ route: async (match, handler) => routes.push({ match, handler }) }, {
    origin: "https://a-myteam.vercel.app", headers: { "x-vercel-protection-bypass": "s3cret" },
  });
  assert.equal(routes.length, 1);
  const { match, handler } = routes[0];
  assert.equal(match(new URL("https://a-myteam.vercel.app/x?y=1")), true);
  assert.equal(match(new URL("https://checkout.stripe.com/pay")), false);
  assert.equal(match(new URL("http://a-myteam.vercel.app/")), false);
  let fetched, fulfilled;
  await handler({
    request: () => ({ headers: () => ({ accept: "*/*" }) }),
    fetch: async (o) => { fetched = o; return "the response"; },
    fulfill: async (o) => { fulfilled = o; },
  });
  assert.deepEqual(fetched, { headers: { accept: "*/*", "x-vercel-protection-bypass": "s3cret" }, maxRedirects: 0 });
  assert.deepEqual(fulfilled, { response: "the response" });
  const none = [];
  await installBypass({ route: async (p) => none.push(p) }, null);
  assert.deepEqual(none, []);
});

test("the browser inherits neither the secret nor the switches that log request headers", () => {
  const env = browserEnv({ PATH: "/bin", VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", DEBUG: "pw:*", PWDEBUG: "1", HOME: "/h" });
  assert.deepEqual(env, { PATH: "/bin", HOME: "/h" });
});

test("an error that echoes the secret is redacted", () => {
  assert.equal(redact("header x-vercel-protection-bypass: s3cret rejected", "s3cret"), "header x-vercel-protection-bypass: [secret] rejected");
  assert.equal(redact("nothing to hide", undefined), "nothing to hide");
});

test("profiles left by a killed run are swept after an hour; recent ones and other folders stay", () => {
  const root = tempDir();
  for (const d of ["shot-old", "shot-new", "keep-me"]) mkdirSync(path.join(root, d));
  const twoHoursAgo = (Date.now() - 2 * 3_600_000) / 1000;
  utimesSync(path.join(root, "shot-old"), twoHoursAgo, twoHoursAgo);
  utimesSync(path.join(root, "keep-me"), twoHoursAgo, twoHoursAgo);
  assert.deepEqual(sweepStaleProfiles(root), ["shot-old"]);
  assert.deepEqual(readdirSync(root).sort(), ["keep-me", "shot-new"]);
  assert.deepEqual(sweepStaleProfiles(path.join(root, "missing")), []);
});

test("not set up: exit 2 with the setup command, no download, and no secret in the output", () => {
  const empty = tempDir();
  const r = runShot(["https://a-myteam.vercel.app", path.join(empty, "o.png")], {
    AGENT_BROWSING_HOME: empty, VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret", AGENT_BROWSING_BYPASS_HOSTS: "a-myteam.vercel.app",
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /setup\.mjs/);
  assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);
  assert.equal(existsSync(path.join(empty, "profiles")), false);
});
