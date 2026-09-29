#!/usr/bin/env node
// Once per machine: the pinned playwright-core and Playwright CLI in a cache
// (never the project), a headless shell for each, the CLI's config, and a real
// screenshot to prove it. --link copies the scripts to a stable path for hooks
// and services; --check changes nothing.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync, mkdirSync, cpSync, rmSync, symlinkSync, mkdtempSync, statSync, writeFileSync,
  readdirSync, readFileSync, lstatSync, readlinkSync, renameSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAYWRIGHT_VERSION, PLAYWRIGHT_CLI_VERSION, cacheHome, playwrightDir, stableHome, cliConfigPath, cliConfig, cliDir,
} from "./lib/versions.mjs";
import { isMain } from "./lib/main.mjs";
import { waitForLock } from "./lib/lock.mjs";

const USAGE = `usage: setup.mjs            install, or repair, and verify with a screenshot
       setup.mjs --check    report whether this machine is set up; changes nothing
       setup.mjs --link     copy these scripts to ${path.join(stableHome(), "current")} for hooks and services`;
// Written into each install folder, so cleanup removes only folders setup made.
const MARKER = ".agent-browsing-install";
const INSTALL_DIR = /^playwright-(core|cli)-\d+\.\d+\.\d+$/;
// An install is built here and renamed into place once it is whole.
const STAGING_DIR = /^\.staging-playwright-(core|cli)-\d+\.\d+\.\d+-[A-Za-z0-9]{6}$/;
const HOUR = 3_600_000;

const here = path.dirname(fileURLToPath(import.meta.url));

// A fingerprint of the scripts in dir, so a linked copy is replaced when they
// change and a half-written copy is never taken for a finished one.
export function scriptsHash(dir) {
  const h = createHash("sha1");
  const walk = (d) => readdirSync(d, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else h.update(path.relative(dir, p)).update("\0").update(readFileSync(p));
    });
  walk(dir);
  return h.digest("hex").slice(0, 10);
}

function lstatSafe(p) {
  try { return lstatSync(p); } catch { return null; }
}

export function linkState(home = stableHome(), source = here) {
  const current = path.join(home, "current");
  const st = lstatSafe(current);
  if (!st) return { current, state: "missing" };
  if (!st.isSymbolicLink()) return { current, state: "not-a-link" };
  const scripts = path.join(home, path.basename(readlinkSync(current)), "scripts");
  if (!existsSync(scripts)) return { current, state: "stale" };
  return { current, state: scriptsHash(scripts) === scriptsHash(source) ? "current" : "stale" };
}

// The copy is written beside its final name and renamed into place, then the
// link is swapped the same way, so a hook never sees half of either. One
// --link at a time, so one checkout's cleanup never meets another's copy
// halfway to becoming current.
export function link(home = stableHome(), source = here) {
  const release = waitForLock(path.join(home, ".link.lock"), 30_000, { staleMs: 60_000 });
  if (!release) throw new Error(`another --link has held ${path.join(home, ".link.lock")} for 30 seconds`);
  try {
    const { current, state } = linkState(home, source);
    if (state === "not-a-link") throw new Error(`${current} is not a link. Move it aside and run --link again.`);
    const hash = scriptsHash(source);
    const target = path.join(home, hash);
    if (!existsSync(target) || scriptsHash(path.join(target, "scripts")) !== hash) {
      const staging = mkdtempSync(path.join(home, `.${hash}-`));
      cpSync(source, path.join(staging, "scripts"), { recursive: true });
      if (scriptsHash(path.join(staging, "scripts")) !== hash) {
        rmSync(staging, { recursive: true, force: true });
        throw new Error("the copied scripts do not match the originals");
      }
      rmSync(target, { recursive: true, force: true });
      renameSync(staging, target);
    }
    // A --link that was suspended long enough to lose the lock stops here,
    // rather than swapping or pruning under the one that took it over.
    const stillHeld = () => { if (!release.held()) throw new Error("another --link took over the lock; run --link again"); };
    stillHeld();
    const next = `${current}.${process.pid}`;
    rmSync(next, { force: true });
    symlinkSync(hash, next);
    renameSync(next, current);
    // Older copies, and staging a killed --link left. A hook already running a
    // copy has loaded its scripts, so removing the files under it is harmless.
    stillHeld();
    for (const e of readdirSync(home)) {
      if (e !== hash && /^\.?[0-9a-f]{10}(-[A-Za-z0-9]{6})?$/.test(e)) rmSync(path.join(home, e), { recursive: true, force: true });
    }
    return path.join(current, "scripts", "reap.mjs");
  } finally {
    release();
  }
}

// Older pinned installs of our own, which also keep their browser builds
// alive, and staging folders an interrupted setup left over an hour ago.
export function oldInstalls(cache, keep, now = Date.now()) {
  if (!existsSync(cache)) return [];
  const stale = (e) => {
    try { return now - statSync(path.join(cache, e)).mtimeMs > HOUR; } catch { return false; }
  };
  return readdirSync(cache)
    .filter((e) => (INSTALL_DIR.test(e) && existsSync(path.join(cache, e, MARKER))) || (STAGING_DIR.test(e) && stale(e)))
    .map((e) => path.join(cache, e))
    .filter((full) => !keep.includes(full));
}

// The version of pkg installed under dir, or null when it is missing or
// unreadable, as a half-finished install is.
export function installedVersion(dir, pkg) {
  try { return JSON.parse(readFileSync(path.join(dir, "node_modules", ...pkg.split("/"), "package.json"), "utf8")).version ?? null; }
  catch { return null; }
}

// What npm, the browser installer and the closing screenshot inherit. No
// installer needs the preview secret. Playwright's installer deletes browser
// builds no live install points to, which can include the build a project's
// own tests use, so that is switched off.
export function installEnv(env) {
  const { VERCEL_AUTOMATION_BYPASS_SECRET: _secret, ...inherited } = env;
  return { ...inherited, PLAYWRIGHT_SKIP_BROWSER_GC: "1" };
}

// pkg@version in dir, unless it is already there at that version. Installed
// into a staging folder beside it and renamed into place, so a run killed
// halfway leaves nothing that looks installed. npmInstall(prefix, spec) does
// the download.
export function ensureInstalled(dir, pkg, version, npmInstall) {
  if (installedVersion(dir, pkg) === version) return false;
  const parent = path.dirname(dir);
  mkdirSync(parent, { recursive: true });
  const staging = mkdtempSync(path.join(parent, `.staging-${path.basename(dir)}-`));
  try {
    npmInstall(staging, `${pkg}@${version}`);
    if (installedVersion(staging, pkg) !== version) throw new Error(`npm did not install ${pkg}@${version}`);
    writeFileSync(path.join(staging, MARKER), "made by agent-browsing setup.mjs\n");
    rmSync(dir, { recursive: true, force: true });
    renameSync(staging, dir);
    return true;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

// Whether Chromium's sandbox can stay on here. probe(sandbox) launches the
// headless shell and returns { ok, stderr }. It is off only when a sandboxed
// launch fails for want of the sandbox itself and an unsandboxed one starts;
// any other failure (a missing library, a slow machine) keeps it on, and is
// returned so setup can say what went wrong.
export function decideSandbox(platform, probe) {
  if (platform !== "linux") return { sandbox: true };
  const on = probe(true);
  if (on.ok) return { sandbox: true };
  const forWantOfSandbox = /No usable sandbox|Failed to move to new namespace|user namespaces?/i.test(on.stderr);
  if (forWantOfSandbox && probe(false).ok) return { sandbox: false };
  return { sandbox: true, error: on.stderr.split("\n").find((l) => l.trim()) ?? "no output" };
}

function install() {
  const core = playwrightDir();
  const cli = cliDir();
  const MINUTE = 60_000;
  const env = installEnv(process.env);
  const run = (file, argv, minutes) => execFileSync(file, argv, { stdio: "inherit", env, timeout: minutes * MINUTE });
  const npmInstall = (prefix, spec) =>
    run("npm", ["install", "--prefix", prefix, "--no-audit", "--no-fund", "--silent", "--ignore-scripts", spec], 10);
  const ensure = (dir, pkg, version) => ensureInstalled(dir, pkg, version, npmInstall);
  try {
    ensure(core, "playwright-core", PLAYWRIGHT_VERSION);
    ensure(cli, "@playwright/cli", PLAYWRIGHT_CLI_VERSION);
    // Each package's own installer, so each gets the browser build it was made
    // for (the CLI bundles its own Playwright), and no npx warning is printed.
    run(process.execPath, [path.join(core, "node_modules", "playwright-core", "cli.js"), "install", "--only-shell", "chromium"], 15);
    run(process.execPath, [path.join(cli, "node_modules", "playwright-core", "cli.js"), "install", "--only-shell", "chromium"], 15);
  } catch (err) {
    throw new Error(`an install step failed or ran out of time: ${String(err.message).split("\n")[0]}`);
  }
  // Ubuntu 23.10 and later block the user namespaces Chromium's sandbox
  // needs; a test launch tells whether this machine is one of them.
  const probeLaunch = (withSandbox) => {
    const code = `require(${JSON.stringify(path.join(core, "node_modules", "playwright-core"))}).chromium` +
      `.launch({ channel: "chromium-headless-shell", chromiumSandbox: ${withSandbox}, timeout: 60000 })` +
      ".then((b) => b.close()).then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1); })";
    const r = spawnSync(process.execPath, ["-e", code], { env, encoding: "utf8", timeout: 2 * MINUTE });
    return { ok: r.status === 0, stderr: r.stderr ?? "" };
  };
  const { sandbox, error } = decideSandbox(process.platform, probeLaunch);
  if (!sandbox) console.log("Chromium's sandbox: off, because this machine blocks the user namespaces it needs");
  if (error) console.log(`Chromium's sandbox: on; a test launch failed for another reason: ${error}`);
  mkdirSync(cliConfig().outputDir, { recursive: true });
  writeFileSync(cliConfigPath(), `${JSON.stringify(cliConfig(undefined, sandbox), null, 2)}\n`);
  for (const old of oldInstalls(cacheHome(), [core, cli])) rmSync(old, { recursive: true, force: true });

  const tmp = mkdtempSync(path.join(tmpdir(), "agent-browsing-"));
  const out = path.join(tmp, "check.png");
  const r = spawnSync(process.execPath, [path.join(here, "shot.mjs"), "data:text/html,<h1>ok</h1>", out, "--timeout=30"],
    { encoding: "utf8", env, timeout: 3 * MINUTE });
  const ok = r.status === 0 && existsSync(out) && statSync(out).size >= 100;
  rmSync(tmp, { recursive: true, force: true });
  if (!ok) {
    // Without its config, --check reports this machine as not set up.
    rmSync(cliConfigPath(), { force: true });
    throw new Error(`the browser did not produce a screenshot.\n${r.stderr ?? ""}`);
  }
}

// The config must also carry the sandbox answer, which setup has written
// since the sandbox check was added.
function installed() {
  let config = null;
  try { config = JSON.parse(readFileSync(cliConfigPath(), "utf8")); } catch { /* missing or unreadable */ }
  return installedVersion(playwrightDir(), "playwright-core") === PLAYWRIGHT_VERSION &&
    installedVersion(cliDir(), "@playwright/cli") === PLAYWRIGHT_CLI_VERSION &&
    typeof config?.browser?.launchOptions?.chromiumSandbox === "boolean";
}

function main(args) {
  const known = new Set(["--check", "--link", "--help", "-h"]);
  const unknown = args.find((a) => !known.has(a));
  if (unknown) { console.error(`setup: unknown argument ${unknown}\n${USAGE}`); return 2; }
  if (args.length > 1) { console.error(`setup: one option at a time\n${USAGE}`); return 2; }
  const mode = args[0];
  if (mode === "--help" || mode === "-h") { console.log(USAGE); return 0; }
  try {
    if (mode === "--link") { console.log(`linked: ${link()}`); return 0; }
    if (mode === "--check") {
      console.log(installed()
        ? `set up: playwright-core ${PLAYWRIGHT_VERSION} and Playwright CLI ${PLAYWRIGHT_CLI_VERSION} in ${cacheHome()}`
        : `not set up: run node ${fileURLToPath(import.meta.url)}`);
      const { current, state } = linkState();
      if (state === "stale") console.log(`the linked copy at ${current} differs from these scripts: run --link again`);
      return installed() ? 0 : 3;
    }
    install();
  } catch (err) { console.error(`setup: ${err.message}`); return 1; }
  console.log(`set up: playwright-core ${PLAYWRIGHT_VERSION} and Playwright CLI ${PLAYWRIGHT_CLI_VERSION}, headless shell verified`);
  if (linkState().state === "stale") console.log("the linked copy differs from these scripts: run --link again");
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
