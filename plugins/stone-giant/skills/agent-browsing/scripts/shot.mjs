#!/usr/bin/env node
// One screenshot of a URL or a local file, then exit. Headless, a profile of
// its own under the skill's profile folder, and a pipe instead of a port. The
// browser is closed and the profile removed on success, failure, timeout, a
// signal or a crash. Only SIGKILL skips that: its browser dies with the pipe
// and its profile goes in a later run's sweep.
import path from "node:path";
import os from "node:os";
import { existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { playwrightDir, profileRoot, sandboxSetting } from "./lib/versions.mjs";
import { isMain } from "./lib/main.mjs";

const USAGE = "usage: shot.mjs <url|path> <out.png|out.jpg> [--viewport=1280x800] [--full-page] [--wait=<ms>] [--timeout=<seconds>]";
const SECRET_VAR = "VERCEL_AUTOMATION_BYPASS_SECRET";
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function parseArgs(argv) {
  const pos = argv.filter((a) => !a.startsWith("--"));
  if (pos.length !== 2) throw new Error(USAGE);
  const flags = argv.filter((a) => a.startsWith("--"));
  const known = /^--(viewport|wait|timeout)=|^--full-page$/;
  const bad = flags.find((f) => !known.test(f));
  if (bad) throw new Error(`unknown argument ${bad}. ${USAGE}`);
  const opt = (name, dflt) => (argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split("=")[1];
  const vm = opt("viewport", "1280x800").match(/^(\d{1,5})x(\d{1,5})$/);
  const [w, h] = vm ? [Number(vm[1]), Number(vm[2])] : [0, 0];
  if (!vm || w < 1 || h < 1 || w > 10000 || h > 10000) throw new Error("--viewport must look like 1280x800, each side 1 to 10000");
  const wait = opt("wait", "0");
  const timeout = opt("timeout", "30");
  if (!/^\d+$/.test(wait) || Number(wait) > 120000) throw new Error("--wait must be whole milliseconds, at most 120000");
  if (!/^\d+(\.\d+)?$/.test(timeout) || Number(timeout) <= 0 || Number(timeout) > 300) throw new Error("--timeout must be seconds, more than 0 and at most 300");
  return {
    target: pos[0], out: pos[1], viewport: { width: w, height: h },
    fullPage: argv.includes("--full-page"), waitMs: Number(wait), timeoutMs: Number(timeout) * 1000,
  };
}

// http:, https:, file:, data: and about: pass through; anything else is a
// path. A #fragment on a path is the page anchor (mockup.html#frame-D2 shoots
// one frame), unless a file with that exact name exists.
export function toUrl(target, cwd, home, exists = existsSync) {
  if (/^(https?|file|about):/i.test(target)) return new URL(target).href;
  if (/^data:/i.test(target)) return target;
  const hostAndPort = /^[^/\\\s]+:\d+(\/|$)/.test(target);
  if ((hostAndPort || /^[a-z][a-z0-9+.-]*:/i.test(target)) && !exists(path.resolve(cwd, target))) {
    throw new Error(`${target} is not a URL shot.mjs opens or a file here. For a server, write http://${target}`);
  }
  const expanded = target.startsWith("~/") ? path.join(home, target.slice(2)) : target;
  const whole = path.resolve(cwd, expanded);
  const hash = expanded.indexOf("#");
  if (hash > 0 && !exists(whole)) {
    return pathToFileURL(path.resolve(cwd, expanded.slice(0, hash))).href + expanded.slice(hash);
  }
  return pathToFileURL(whole).href;
}

// The Vercel bypass header goes only to a host listed exactly in
// AGENT_BROWSING_BYPASS_HOSTS (host, or host:port), over https unless the host
// is this machine. No wildcards: vercel.app project names are first come, first
// served, so anyone can register a name that matches a pattern like *-team.
export function bypassFor(url, env) {
  const secret = env[SECRET_VAR];
  if (!secret || !/^https?:/i.test(url)) return null;
  if (/[\r\n]/.test(secret)) throw new Error(`${SECRET_VAR} contains a line break`);
  const listed = (env.AGENT_BROWSING_BYPASS_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  if (listed.some((h) => h.includes("*"))) {
    throw new Error("AGENT_BROWSING_BYPASS_HOSTS takes exact hosts; a wildcard would match names anyone can register");
  }
  const u = new URL(url);
  if (!listed.some((h) => h === u.host || h === u.hostname)) return null;
  if (u.protocol !== "https:" && !LOCAL.has(u.hostname)) return null;
  return { origin: u.origin, headers: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" } };
}

// Requests to the target's own origin are fetched with the header and without
// following redirects; the browser follows any redirect as a new request,
// which, for another origin, carries no header. A fetch that fails aborts the
// request: left to escape, its error prints the request headers, secret and all.
export async function installBypass(context, bypass) {
  if (!bypass) return;
  await context.route((url) => url.origin === bypass.origin, async (route) => {
    try {
      const response = await route.fetch({ headers: { ...route.request().headers(), ...bypass.headers }, maxRedirects: 0 });
      await route.fulfill({ response });
    } catch {
      await route.abort().catch(() => {});
    }
  });
}

export function redact(text, secret) {
  return secret ? String(text).split(secret).join("[secret]") : String(text);
}

// What the browser process inherits: never the secret, and no debug switches
// that would log request headers.
export function browserEnv(env) {
  return Object.fromEntries(Object.entries(env).filter(([k]) => k !== SECRET_VAR && k !== "DEBUG" && k !== "PWDEBUG"));
}

// Profiles left by a run that was killed outright. No run lasts an hour
// (timeouts are capped), so an older one is stale.
export function sweepStaleProfiles(root, now = Date.now(), maxAgeMs = 3_600_000) {
  if (!existsSync(root)) return [];
  const removed = [];
  for (const d of readdirSync(root)) {
    const full = path.join(root, d);
    if (!d.startsWith("shot-")) continue;
    try {
      if (now - statSync(full).mtimeMs > maxAgeMs) { rmSync(full, { recursive: true, force: true }); removed.push(d); }
    } catch { /* removed meanwhile */ }
  }
  return removed;
}

const GRACE_MS = 5000;

async function main() {
  const secret = process.env[SECRET_VAR];
  const runId = process.env.AGENT_BROWSING_RUN_ID ?? "";
  let a, url, bypass;
  try {
    a = parseArgs(process.argv.slice(2));
    url = toUrl(a.target, process.cwd(), os.homedir());
    bypass = bypassFor(url, process.env);
    if (!/^[A-Za-z0-9_-]{0,32}$/.test(runId)) throw new Error("AGENT_BROWSING_RUN_ID is letters, digits, - and _, at most 32");
    // A FIFO or a device would block the write, and the exit, with it.
    if (existsSync(a.out) && !statSync(a.out).isFile()) throw new Error(`${a.out} exists and is not a regular file`);
  } catch (err) { console.error(`shot: ${redact(err.message, secret)}`); return 2; }

  const dir = playwrightDir();
  if (!existsSync(path.join(dir, "node_modules", "playwright-core"))) {
    const setup = fileURLToPath(new URL("./setup.mjs", import.meta.url));
    console.error(`shot: Playwright is not set up on this machine. Run once: node ${setup}`);
    return 2;
  }
  // Playwright's debug logging would print request headers, secret and all.
  delete process.env.DEBUG;
  delete process.env.PWDEBUG;
  const { chromium } = createRequire(path.join(dir, "package.json"))("playwright-core");

  mkdirSync(profileRoot(), { recursive: true });
  sweepStaleProfiles(profileRoot());
  // Created only once the handlers below are in place, so a signal can never
  // arrive between the two.
  let profile;
  // Never throws: a browser still writing can make one pass fail, and a throw
  // here would strand the exit. What survives goes in a later run's sweep.
  const removeProfile = () => {
    if (!profile) return;
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); } catch { /* swept later */ }
  };
  let launching;
  let context;
  let closing;
  // Closing waits for a launch in progress, then closes what it launched, all
  // within GRACE_MS. After that, or on a second signal, the process exits at
  // once: Playwright's exit handler kills the browser's whole process group,
  // and the profile is removed after it, by a handler added last.
  const cleanup = () => (closing ??= Promise.race([
    launching ? launching.then((c) => c.close()).catch(() => {}) : Promise.resolve(),
    new Promise((r) => setTimeout(r, GRACE_MS).unref()),
  ]).then(removeProfile));
  const exitNow = (code) => {
    process.on("exit", removeProfile);
    process.exit(code);
  };
  const stop = (code) => {
    if (closing) exitNow(code);
    cleanup().finally(() => exitNow(code));
  };
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT", "SIGUSR2"]) {
    process.on(sig, () => {
      if (!closing) console.error(`shot: ${sig}, closing the browser (again to stop at once)`);
      stop(128 + os.constants.signals[sig]);
    });
  }
  // An error thrown outside the steps below would otherwise print Playwright's
  // call log, request headers included, and skip the cleanup. Once closing
  // has begun, errors are its consequences (a pending call finding the
  // browser gone), so the reason for closing keeps its exit code.
  const crash = (err) => {
    if (closing) return;
    console.error(`shot: ${redact(String(err?.message ?? err).split("\n")[0], secret)}`);
    stop(1);
  };
  process.on("uncaughtException", crash);
  process.on("unhandledRejection", crash);
  // Launch, load and capture each get the full timeout, plus the wait, plus
  // five seconds; the deadline stays armed through cleanup.
  const limitMs = 3 * a.timeoutMs + a.waitMs + 5000;
  const deadline = setTimeout(() => {
    console.error(`shot: gave up after ${Math.round(limitMs / 1000)}s`);
    stop(1);
  }, limitMs);
  profile = mkdtempSync(path.join(profileRoot(), `shot-${runId}`));
  try {
    launching = chromium.launchPersistentContext(profile, {
      headless: true, timeout: a.timeoutMs, viewport: a.viewport, env: browserEnv(process.env),
      chromiumSandbox: sandboxSetting(), handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false,
    });
    context = await launching;
    await installBypass(context, bypass);
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto(url, { waitUntil: "load", timeout: a.timeoutMs });
    if (a.waitMs) await page.waitForTimeout(a.waitMs);
    await page.screenshot({ path: a.out, fullPage: a.fullPage, timeout: a.timeoutMs });
    console.log(`${a.out} (${a.viewport.width}x${a.viewport.height}${a.fullPage ? ", full page" : ""})`);
    return 0;
  } catch (err) {
    // First line only: Playwright's full message can echo request headers.
    console.error(`shot: ${redact(String(err.message).split("\n")[0], secret)}`);
    if (/No usable sandbox/i.test(String(err.message))) {
      console.error("shot: this machine can't give Chromium a sandbox; run setup.mjs again so it records that");
    }
    return 1;
  } finally {
    await cleanup();
    // As on the other exits: should closing have outlived its grace, the
    // profile goes again after Playwright's exit handler kills the browser.
    process.on("exit", removeProfile);
    clearTimeout(deadline);
  }
}

if (isMain(import.meta.url)) process.exit(await main());
