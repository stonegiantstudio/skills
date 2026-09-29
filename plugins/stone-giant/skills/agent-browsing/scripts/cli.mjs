#!/usr/bin/env node
// Playwright CLI with this skill's defaults, so an agent cannot forget them:
// the pinned version, the headless shell, snapshots kept out of the repo, a
// 10-minute idle timeout, and sessions named for this git checkout. Commands
// that reach other sessions or the person's own browser are refused. The one
// exception is run-code: its code runs inside the CLI's own Node process, so
// it can do anything a shell can; it is allowed because the agent has a shell
// anyway, and it is the only way to time steps closer than a command apart.
//   cli.mjs open <url>    cli.mjs snapshot    cli.mjs close
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cliConfigPath, cliDir, cliGlobalHome, lockDir, recordedSandbox } from "./lib/versions.mjs";
import { isMain } from "./lib/main.mjs";
import { takeLock } from "./lib/lock.mjs";

const SESSION_COMMANDS = new Set([
  "open", "close", "goto", "type", "click", "dblclick", "fill", "drag", "drop", "hover", "select",
  "upload", "check", "uncheck", "snapshot", "find", "eval", "dialog-accept", "dialog-dismiss", "resize",
  "go-back", "go-forward", "reload", "press", "keydown", "keyup", "mousemove", "mousedown", "mouseup",
  "mousewheel", "screenshot", "pdf", "tab-list", "tab-new", "tab-close", "tab-select",
  "state-load", "state-save", "cookie-list", "cookie-get", "cookie-set", "cookie-delete", "cookie-clear",
  "localstorage-list", "localstorage-get", "localstorage-set", "localstorage-delete", "localstorage-clear",
  "sessionstorage-list", "sessionstorage-get", "sessionstorage-set", "sessionstorage-delete", "sessionstorage-clear",
  "set-color-scheme", "set-reduced-motion", "set-forced-colors", "set-contrast", "set-media",
  "clear-color-scheme", "clear-reduced-motion", "clear-forced-colors", "clear-contrast", "clear-media",
  "requests", "request", "request-headers", "request-body", "response-headers", "response-body",
  "route", "route-list", "unroute", "network-state-set", "console", "run-code",
  "tracing-start", "tracing-stop", "video-start", "video-stop", "video-chapter", "video-show-actions",
  "video-hide-actions", "recording-start", "recording-stop", "generate-locator", "highlight",
  "webmcp-list", "webmcp-call", "list", "delete-data",
]);

// Each reaches past this session: into the person's own Chrome (a profile,
// the extension, a CDP endpoint), into a visible window that never times out,
// into another browser than the headless shell, or, through a config file of
// the caller's choosing, into any of those. `list --all` reads every
// workspace's sessions and the person's own Chrome profiles.
const REFUSED_FLAGS = new Set(["headed", "extension", "cdp", "endpoint", "profile", "persistent", "browser", "config", "all"]);
const SESSION_TOKEN = /^(-s|--s|--session)(=(.*))?$/;
const SESSION_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const MAX_IDLE_MS = 3_600_000;

export function sessionName(root) {
  return `ab-${createHash("sha1").update(root).digest("hex").slice(0, 8)}`;
}

export function checkoutRoot(cwd) {
  try { return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10_000 }).trim(); }
  catch { return cwd; }
}

// A name given with -s lives under this checkout's prefix, so two checkouts'
// "-s=main" are two sessions and neither can close the other's. A name that
// already carries the prefix, as `list` prints it, is checked the same way:
// the CLI builds file paths from it.
export function scopedSession(name, checkout) {
  const own = name === checkout ? "" : name.startsWith(`${checkout}-`) ? name.slice(checkout.length + 1) : name;
  if (name !== checkout && !SESSION_NAME.test(own)) {
    throw new Error(`cli: a session name is letters, digits, - and _, at most 40 (got "${name}")`);
  }
  return own === "" ? checkout : `${checkout}-${own}`;
}

// Everything after a bare `--` is text for the command, never an option.
const splitAtEnd = (argv) => {
  const end = argv.indexOf("--");
  return end === -1 ? [argv, []] : [argv.slice(0, end), argv.slice(end)];
};

// Takes -s, --s and --session out of the options, in either form, and
// returns the one name they gave, if any.
export function takeSession(argv) {
  const [options, text] = splitAtEnd(argv);
  const rest = [];
  const names = [];
  for (let i = 0; i < options.length; i++) {
    const m = options[i].match(SESSION_TOKEN);
    if (!m) { rest.push(options[i]); continue; }
    if (m[2] !== undefined) names.push(m[3]);
    else if (i + 1 < options.length && !options[i + 1].startsWith("-")) names.push(options[++i]);
    else throw new Error(`cli: ${options[i]} needs a name`);
  }
  if (names.length > 1) throw new Error("cli: name one session, not several");
  return { rest: [...rest, ...text], name: names[0] };
}

// parse is the pinned CLI's own argument parser (see loadParser), so the
// command checked here is the command the CLI runs. Returns what to run.
export function buildArgs(rawArgv, { parse, configPath, checkout }) {
  const [options, text] = splitAtEnd(rawArgv);
  const replace = options.includes("--replace");
  const { rest, name } = takeSession([...options.filter((a) => a !== "--replace"), ...text]);
  const session = name === undefined ? checkout : scopedSession(name, checkout);
  const args = [`-s=${session}`, ...rest];
  const parsed = parse(args);
  if (parsed.s !== session || "session" in parsed) {
    throw new Error("cli: could not read which session these arguments name. Write it as -s=<name>, and other flags as --flag=value.");
  }
  // The CLI prints help or its version and exits before running anything.
  if (parsed.help || parsed.h || parsed.version || parsed.v) return { args, command: undefined, session, replace };
  const command = parsed._[0];
  if (command === undefined) throw new Error("cli: name a command, for example: open <url>");
  if (!SESSION_COMMANDS.has(command)) {
    throw new Error(`cli: ${command} is refused: it acts beyond this checkout's sessions (other sessions, other agents' browsers, or a visible window).`);
  }
  const bad = Object.keys(parsed).find((k) => REFUSED_FLAGS.has(k));
  if (bad) throw new Error(`cli: --${bad} is refused: it reaches the person's own browser, a visible window, another browser than the headless shell, or other checkouts' sessions.`);
  const idle = parsed["idle-timeout"];
  if (idle !== undefined && !(/^\d+$/.test(String(idle)) && Number(idle) >= 1 && Number(idle) <= MAX_IDLE_MS)) {
    throw new Error(`cli: --idle-timeout is milliseconds, 1 to ${MAX_IDLE_MS}; a session that never idles out is how machines fill up.`);
  }
  if (command === "open") {
    args.push(`--config=${configPath}`);
    if (idle === undefined) args.push("--idle-timeout=600000");
  }
  return { args, command, session, replace };
}

// Whether `list --json` shows the session open. Output this code does not
// recognize is an error, never a "no": the CLI's own open would stop a live
// session of the same name.
export function sessionIsOpen(listJson, name) {
  const listed = JSON.parse(listJson);
  if (!Array.isArray(listed?.browsers)) throw new Error("unexpected output from list");
  return listed.browsers.some((b) => b.name === name && b.status === "open");
}

// A second `open` on a live session would stop it. Refused unless --replace,
// and refused too when the check itself cannot be made.
export function checkOpen({ command, session, replace }, isOpen) {
  if (command !== "open" || replace) return;
  let open;
  try { open = isOpen(session); } catch (err) {
    throw new Error(`cli: could not tell whether session ${session} is already open (${err.message}). Name your own with -s=<name>, or pass --replace to start it over.`);
  }
  if (open) {
    throw new Error(`cli: session ${session} is already open, perhaps by another agent in this checkout. Name your own with -s=<name>; --replace stops the open one and starts it over.`);
  }
}

// The CLI's own parser and the flags it treats as switches, read from the
// pinned install.
export function loadParser(dir = cliDir()) {
  const client = path.join(dir, "node_modules", "playwright-core", "lib", "tools", "cli-client");
  const { minimist } = createRequire(import.meta.url)(path.join(client, "minimist.js"));
  const help = JSON.parse(readFileSync(path.join(client, "help.json"), "utf8"));
  const boolean = [...help.booleanOptions, "all", "g", "help", "json", "raw", "version"];
  return (argv) => minimist(argv, { boolean, string: ["_"] });
}

// What the CLI and its browser inherit: no variables that reconfigure the
// session behind the flags checked above, never the preview secret, and a
// global config folder of our own in place of the person's.
export function childEnv(env, globalHome = cliGlobalHome(env)) {
  const out = Object.fromEntries(Object.entries(env).filter(([k]) =>
    !/^(PLAYWRIGHT_MCP_|PLAYWRIGHT_CLI_|PWTEST_)/.test(k) && k !== "PWDEBUG" && k !== "VERCEL_AUTOMATION_BYPASS_SECRET"));
  // The CLI's daily update notice suggests a global install, which would pull
  // an agent off the pinned version.
  return { ...out, PWTEST_CLI_GLOBAL_CONFIG: globalHome, NO_UPDATE_NOTIFIER: "1" };
}

function main() {
  const configPath = cliConfigPath();
  const bin = path.join(cliDir(), "node_modules", "@playwright", "cli", "playwright-cli.js");
  if (!existsSync(configPath) || !existsSync(bin)) {
    const setup = fileURLToPath(new URL("./setup.mjs", import.meta.url));
    console.error(`cli: the browser is not set up on this machine. Run once: node ${setup}`);
    return 2;
  }
  if (process.platform !== "linux" && recordedSandbox() === false) {
    console.error(`cli: ${configPath} turns Chromium's sandbox off, which only a Linux machine that blocks it needs. Run setup.mjs again here.`);
    return 2;
  }
  const env = childEnv(process.env);
  const isOpen = (name) => sessionIsOpen(execFileSync(process.execPath, [bin, "list", "--json"], { encoding: "utf8", env, timeout: 15_000 }), name);
  let plan;
  let release = () => {};
  try {
    plan = buildArgs(process.argv.slice(2), { parse: loadParser(), configPath, checkout: sessionName(checkoutRoot(process.cwd())) });
    if (plan.command === "open") {
      const held = takeLock(path.join(lockDir(), `${plan.session}.lock`));
      if (!held) throw new Error(`cli: another agent is opening session ${plan.session} right now. Name your own with -s=<name>.`);
      release = held;
    }
    checkOpen(plan, isOpen);
  } catch (err) { release(); console.error(err.message); return 2; }
  // The installed CLI, run directly: npx costs about a third of a second per call.
  try {
    const r = spawnSync(process.execPath, [bin, ...plan.args], { stdio: "inherit", env });
    return r.status ?? 1;
  } finally { release(); }
}

if (isMain(import.meta.url)) process.exit(main());
