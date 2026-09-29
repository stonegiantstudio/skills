import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync, readdirSync, realpathSync, symlinkSync, writeFileSync, rmSync, cpSync, utimesSync } from "node:fs";
import path from "node:path";
import { scriptsHash, oldInstalls, installedVersion, installEnv, ensureInstalled, decideSandbox } from "../scripts/setup.mjs";
import { PLAYWRIGHT_VERSION, PLAYWRIGHT_CLI_VERSION } from "../scripts/lib/versions.mjs";
import { tempDir } from "./temp.mjs";

const setup = fileURLToPath(new URL("../scripts/setup.mjs", import.meta.url));
const scripts = path.dirname(setup);
const run = (env, ...args) => spawnSync(process.execPath, [setup, ...args], { env: { ...process.env, ...env }, encoding: "utf8" });

test("--check on an empty cache exits 3 and changes nothing", () => {
  const home = tempDir();
  const r = run({ AGENT_BROWSING_HOME: home }, "--check");
  assert.equal(r.status, 3);
  assert.match(r.stdout, /not set up/);
  assert.deepEqual(readdirSync(home), []);
});

test("an unknown argument is an error, never an install; --help prints the usage", () => {
  const home = tempDir();
  for (const bad of ["--chek", "check", "--check --link"]) {
    const r = run({ AGENT_BROWSING_HOME: home }, ...bad.split(" "));
    assert.equal(r.status, 2, bad);
    assert.match(r.stderr, /usage/);
  }
  assert.deepEqual(readdirSync(home), []);
  const help = run({ AGENT_BROWSING_HOME: home }, "--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--check/);
});

test("--link copies the scripts to a folder named by their fingerprint and points current at it", () => {
  const data = tempDir();
  const r = run({ XDG_DATA_HOME: data }, "--link");
  assert.equal(r.status, 0, r.stderr);
  const current = path.join(data, "agent-browsing", "current");
  assert.ok(existsSync(path.join(current, "scripts", "reap.mjs")));
  assert.equal(path.basename(realpathSync(current)), scriptsHash(scripts));
  assert.equal(scriptsHash(path.join(current, "scripts")), scriptsHash(scripts));
  assert.equal(run({ XDG_DATA_HOME: data }, "--link").status, 0, "running it again is harmless");
});

test("--link removes older copies and leftover staging, and keeps anything else in the folder", () => {
  const data = tempDir();
  const home = path.join(data, "agent-browsing");
  for (const d of ["0123456789", "abcdef0123", ".0123456789-AbC123", "notes"]) mkdirSync(path.join(home, d), { recursive: true });
  assert.equal(run({ XDG_DATA_HOME: data }, "--link").status, 0);
  assert.deepEqual(readdirSync(home).sort(), [scriptsHash(scripts), "current", "notes"].sort());
});

test("--link waits for another --link in progress, and takes over from one that died", () => {
  const data = tempDir();
  const home = path.join(data, "agent-browsing");
  mkdirSync(home, { recursive: true });
  writeFileSync(path.join(home, ".link.lock"), "999999999"); // a holder that no longer exists
  const r = run({ XDG_DATA_HOME: data }, "--link");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(existsSync(path.join(home, ".link.lock")), false, "released afterwards");
});

test("the install step installs only what is missing or wrong, through a staging folder, and a bad install leaves the old one", () => {
  const cache = tempDir();
  const dir = path.join(cache, "playwright-core-9.9.9");
  const calls = [];
  const fakeNpm = (version) => (prefix, spec) => {
    calls.push(spec);
    mkdirSync(path.join(prefix, "node_modules", "playwright-core"), { recursive: true });
    writeFileSync(path.join(prefix, "node_modules", "playwright-core", "package.json"), JSON.stringify({ version }));
  };
  mkdirSync(path.join(dir, "node_modules", "playwright-core"), { recursive: true }); // npm killed before package.json
  assert.equal(ensureInstalled(dir, "playwright-core", "9.9.9", fakeNpm("9.9.9")), true);
  assert.equal(installedVersion(dir, "playwright-core"), "9.9.9");
  assert.ok(existsSync(path.join(dir, ".agent-browsing-install")));
  assert.equal(ensureInstalled(dir, "playwright-core", "9.9.9", fakeNpm("9.9.9")), false, "already there: no download");
  assert.deepEqual(calls, ["playwright-core@9.9.9"]);
  assert.throws(() => ensureInstalled(dir, "playwright-core", "9.9.10", fakeNpm("1.0.0")), /did not install/);
  assert.equal(installedVersion(dir, "playwright-core"), "9.9.9", "the working install is kept");
  assert.deepEqual(readdirSync(cache), ["playwright-core-9.9.9"], "no staging folder left");
});

test("--link replaces a half-written copy instead of trusting its name", () => {
  const data = tempDir();
  const hashed = path.join(data, "agent-browsing", scriptsHash(scripts));
  cpSync(scripts, path.join(hashed, "scripts"), { recursive: true });
  rmSync(path.join(hashed, "scripts", "reap.mjs"));
  assert.equal(run({ XDG_DATA_HOME: data }, "--link").status, 0);
  assert.equal(scriptsHash(path.join(hashed, "scripts")), scriptsHash(scripts));
  assert.deepEqual(readdirSync(path.join(data, "agent-browsing")).sort(), [scriptsHash(scripts), "current"].sort(), "no staging folder left");
});

test("--check says so when the linked copy differs from these scripts", () => {
  const data = tempDir();
  const old = path.join(data, "agent-browsing", "0000000000");
  mkdirSync(path.join(old, "scripts"), { recursive: true });
  writeFileSync(path.join(old, "scripts", "reap.mjs"), "// an older version\n");
  symlinkSync(old, path.join(data, "agent-browsing", "current"));
  const r = run({ XDG_DATA_HOME: data, AGENT_BROWSING_HOME: tempDir() }, "--check");
  assert.match(r.stdout, /differs from these scripts/);
});

test("--link will not replace a folder or a file at current", () => {
  for (const make of [(p) => mkdirSync(p, { recursive: true }), (p) => { mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, "x"); }]) {
    const data = tempDir();
    make(path.join(data, "agent-browsing", "current"));
    const r = run({ XDG_DATA_HOME: data }, "--link");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not a link/);
  }
});

test("an install counts only when the pinned version is really there, so a half-finished one is redone", () => {
  const home = tempDir();
  const pkgDir = (dir, pkg) => path.join(home, dir, "node_modules", ...pkg.split("/"));
  const put = (dir, pkg, version) => {
    mkdirSync(pkgDir(dir, pkg), { recursive: true });
    if (version) writeFileSync(path.join(pkgDir(dir, pkg), "package.json"), JSON.stringify({ version }));
  };
  put(`playwright-core-${PLAYWRIGHT_VERSION}`, "playwright-core", null); // npm killed before package.json
  put(`playwright-cli-${PLAYWRIGHT_CLI_VERSION}`, "@playwright/cli", PLAYWRIGHT_CLI_VERSION);
  writeFileSync(path.join(home, "playwright-cli.json"), "{}");
  assert.equal(installedVersion(path.join(home, `playwright-core-${PLAYWRIGHT_VERSION}`), "playwright-core"), null);
  assert.equal(run({ AGENT_BROWSING_HOME: home }, "--check").status, 3);
  put(`playwright-core-${PLAYWRIGHT_VERSION}`, "playwright-core", "1.0.0");
  assert.equal(run({ AGENT_BROWSING_HOME: home }, "--check").status, 3, "the wrong version");
  put(`playwright-core-${PLAYWRIGHT_VERSION}`, "playwright-core", PLAYWRIGHT_VERSION);
  assert.equal(run({ AGENT_BROWSING_HOME: home }, "--check").status, 3, "a config without the sandbox answer predates the check");
  writeFileSync(path.join(home, "playwright-cli.json"), JSON.stringify({ browser: { launchOptions: { chromiumSandbox: true } } }));
  assert.equal(run({ AGENT_BROWSING_HOME: home }, "--check").status, 0);
});

test("the sandbox goes off only when it is the sandbox that fails and the browser starts without it", () => {
  const probe = (on, off) => {
    const calls = [];
    const fn = (sandbox) => { calls.push(sandbox); return sandbox ? on : off; };
    return { fn, calls };
  };
  const ok = { ok: true, stderr: "" };
  const noSandbox = { ok: false, stderr: "FATAL: No usable sandbox! If you are running on Ubuntu 23.10+..." };
  const missingLib = { ok: false, stderr: "error while loading shared libraries: libnss3.so" };
  const mac = probe(noSandbox, ok);
  assert.deepEqual(decideSandbox("darwin", mac.fn), { sandbox: true });
  assert.deepEqual(mac.calls, [], "no test launch off Linux");
  assert.deepEqual(decideSandbox("linux", probe(ok, ok).fn), { sandbox: true });
  assert.deepEqual(decideSandbox("linux", probe(noSandbox, ok).fn), { sandbox: false });
  assert.deepEqual(decideSandbox("linux", probe(missingLib, missingLib).fn), { sandbox: true, error: missingLib.stderr });
  assert.deepEqual(decideSandbox("linux", probe(missingLib, ok).fn), { sandbox: true, error: missingLib.stderr }, "a slow or broken launch is not a missing sandbox");
  assert.equal(decideSandbox("linux", probe(noSandbox, missingLib).fn).sandbox, true, "it must start without the sandbox to turn it off");
});

test("cleanup takes only older installs setup made, never the output folder or a look-alike", () => {
  const cache = tempDir();
  const made = (name, marker = true) => {
    mkdirSync(path.join(cache, name));
    if (marker) writeFileSync(path.join(cache, name, ".agent-browsing-install"), "");
  };
  made("playwright-core-1.62.0");
  made("playwright-cli-0.1.20");
  made("playwright-core-1.63.0");
  made("playwright-cli-output");
  made("playwright-core-fork");
  made("playwright-core-1.61.0", false);
  made(".staging-playwright-core-1.63.0-AbC123", false);
  made(".staging-playwright-cli-0.1.21-XyZ789", false);
  made(".staging-something-else-QwE456", false);
  const hourAgo = (Date.now() - 2 * 3_600_000) / 1000;
  utimesSync(path.join(cache, ".staging-playwright-core-1.63.0-AbC123"), hourAgo, hourAgo);
  utimesSync(path.join(cache, ".staging-something-else-QwE456"), hourAgo, hourAgo);
  const keep = [path.join(cache, "playwright-core-1.63.0")];
  assert.deepEqual(oldInstalls(cache, keep).map((p) => path.basename(p)).sort(),
    [".staging-playwright-core-1.63.0-AbC123", "playwright-cli-0.1.20", "playwright-core-1.62.0"],
    "a staging folder another setup is still filling is left alone");
  assert.deepEqual(oldInstalls(path.join(cache, "missing"), keep), []);
});

test("the installers never see the preview secret, and never delete another install's browser builds", () => {
  assert.deepEqual(installEnv({ PATH: "/bin", VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret" }), { PATH: "/bin", PLAYWRIGHT_SKIP_BROWSER_GC: "1" });
});
