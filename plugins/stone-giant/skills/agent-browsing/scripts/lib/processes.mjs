// Read the process table and decide which browsers an automation tool launched
// and then abandoned. Ownership is proven, never guessed from text:
//
//   1. It belongs to this user (ps -U), so nobody else's process is ever read.
//   2. The program itself is a Chromium-family browser, judged by the name of
//      the executable, not by any word elsewhere on its command line.
//   3. It was launched headless through a debugging PIPE, as whole arguments,
//      and holds no debugging PORT (a port means another tool may still be
//      driving it). People start browsers from Finder, the Dock or a shell;
//      only automation uses a pipe, and a headed window a person opened through
//      a tool is theirs to close.
//   4. Its --user-data-dir is a throwaway profile an automation tool creates:
//      Playwright's or Puppeteer's temp profile, or this skill's own folder.
//   5. Its launcher is gone. On macOS every app opened from Finder has launchd
//      as its parent, so "parent is 1" means nothing alone; rules 2 to 4 are what
//      make it mean "the launcher died" here. A pid 1 that is not an init system
//      (a container's own launcher) counts as alive, and a `systemd --user`
//      parent (a desktop session's reaper) counts as gone.
import { execFileSync } from "node:child_process";
import { readFileSync, readlinkSync } from "node:fs";
import path from "node:path";

const CHROMIUM = new Set([
  "chrome", "chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "google-chrome-beta",
  "google-chrome-unstable", "headless_shell", "chrome-headless-shell", "Google Chrome", "Google Chrome Beta",
  "Google Chrome Dev", "Google Chrome Canary", "Google Chrome for Testing", "Chromium", "msedge", "msedge-beta",
  "msedge-dev", "Microsoft Edge", "Microsoft Edge Beta", "Microsoft Edge Dev", "Microsoft Edge Canary",
]);
const TEMP_PROFILE_PREFIXES = ["playwright_chromiumdev_profile-", "puppeteer_dev_chrome_profile-"];
const INIT = new Set(["launchd", "systemd", "init", "tini", "docker-init", "dumb-init", "catatonit"]);
const TOOL_PROGRAMS = new Set(["node", "npx", "npm", "playwright-cli", "agent-browser", "chrome-devtools-mcp"]);
const TOOL_MARKERS = ["@playwright/cli", "playwright-cli", "cliDaemon.js", "@playwright/mcp", "agent-browser", "chrome-devtools-mcp"];
const LSTART = /[A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4}/;

export function etimeToSeconds(etime) {
  const [days, rest] = etime.includes("-") ? etime.split("-") : ["0", etime];
  const parts = rest.split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  const [h, m, s] = parts;
  return Number(days) * 86400 + h * 3600 + m * 60 + s;
}

// Lines of `ps -o pid=,ppid=,etime=,rss=,lstart=,args=`. lstart is the start
// time; together with args it identifies a process, since a pid can be reused.
export function parsePs(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const m = line.match(new RegExp(`^\\s*(\\d+)\\s+(\\d+)\\s+(\\S+)\\s+(\\d+)\\s+(${LSTART.source})\\s+(.*)$`));
    if (!m) continue;
    out.push({
      pid: Number(m[1]), ppid: Number(m[2]), ageSeconds: etimeToSeconds(m[3]),
      rssKb: Number(m[4]), started: m[5].replace(/\s+/g, " "), args: m[6],
    });
  }
  return out;
}

const PS_FIELDS = "pid=,ppid=,etime=,rss=,lstart=,args=";
// A hook must never hang on a stuck process table.
const run = (file, argv, timeout = 10_000) =>
  execFileSync(file, argv, { encoding: "utf8", env: { ...process.env, LC_ALL: "C" }, maxBuffer: 64 << 20, timeout });

export function readProcesses(env = process.env) {
  if (env.AGENT_BROWSING_PS_FILE) return parsePs(readFileSync(env.AGENT_BROWSING_PS_FILE, "utf8"));
  return parsePs(run("ps", ["-ww", "-U", String(process.getuid()), "-o", PS_FIELDS]));
}

// The same fields for one pid now, or null when it is gone.
export function readOne(pid) {
  try {
    return parsePs(run("ps", ["-ww", "-o", PS_FIELDS, "-p", String(pid)], 5000))[0] ?? null;
  } catch { return null; }
}

// The program's name: the text before its first flag, for executables whose
// path has spaces (Google Chrome.app), else the first word.
export function program(args) {
  const beforeFlags = args.split(/\s--?[A-Za-z]/)[0].trim();
  return path.basename(beforeFlags);
}

const hasArg = (args, arg) => new RegExp(`(^|\\s)${arg}(\\s|$)`).test(args);
const hasArgPrefix = (args, prefix) => new RegExp(`(^|\\s)${prefix}`).test(args);

// Chrome uses the last --user-data-dir it is given.
export function userDataDir(args) {
  const all = [...args.matchAll(/(?:^|\s)--user-data-dir=(.+?)(?=\s--|$)/g)];
  return all.length ? all[all.length - 1][1] : null;
}

export function isInit(args) {
  return INIT.has(path.basename(args.trim().split(/\s+/)[0] ?? ""));
}

// The saved-table override is for tests and dry runs only; a live run asks ps.
// When pid 1 cannot be read, it counts as a launcher, never as init.
export function pid1IsInit(env = process.env, readPid1 = () => run("ps", ["-o", "args=", "-p", "1"], 5000)) {
  if (env.AGENT_BROWSING_PS_FILE && env.AGENT_BROWSING_PID1) return isInit(env.AGENT_BROWSING_PID1);
  try { return isInit(readPid1()); }
  catch { return false; }
}

// Rules 2 to 4, for a browser's main process.
export function isAgentBrowserRoot(args, profileRoot) {
  if (!CHROMIUM.has(program(args))) return false;
  if (hasArgPrefix(args, "--type=") || !hasArg(args, "--remote-debugging-pipe") || hasArgPrefix(args, "--remote-debugging-port=")) return false;
  if (!hasArg(args, "--headless") && !hasArgPrefix(args, "--headless=")) return false;
  const dir = userDataDir(args);
  if (dir === null) return false;
  if (profileRoot && dir.startsWith(`${profileRoot}${path.sep}`)) return true;
  return TEMP_PROFILE_PREFIXES.some((p) => path.basename(dir).startsWith(p));
}

// A tool is node (or a tool's own binary) running one of the tools, judged by
// the executable and not by a word elsewhere: `less playwright-cli.json` and a
// shell whose command mentions the CLI are not tools.
const firstWord = (args) => path.basename(args.trim().split(/\s+/)[0] ?? "");

export function isAgentTool(args) {
  return TOOL_PROGRAMS.has(firstWord(args)) && !hasArg(args, "--remote-debugging-pipe") && TOOL_MARKERS.some((m) => args.includes(m));
}

export function toolName(args) {
  return TOOL_MARKERS.find((m) => args.includes(m)) ?? firstWord(args);
}

// Agent browser roots, each with its descendants' memory added in.
export function agentBrowsers(procs, profileRoot) {
  const children = new Map();
  for (const p of procs) {
    if (!children.has(p.ppid)) children.set(p.ppid, []);
    children.get(p.ppid).push(p);
  }
  const descendants = (pid) => (children.get(pid) ?? []).flatMap((c) => [c, ...descendants(c.pid)]);
  return procs
    .filter((p) => isAgentBrowserRoot(p.args, profileRoot))
    .map((p) => {
      const kids = descendants(p.pid);
      return { ...p, processes: 1 + kids.length, totalRssKb: p.rssKb + kids.reduce((s, c) => s + c.rssKb, 0) };
    });
}

// Rule 5. parentArgs(pid) is the parent's command line, or null when it is gone.
export function launcherGone(p, { parentArgs, initIsPid1 }) {
  if (p.ppid === 1) return initIsPid1;
  const parent = parentArgs(p.ppid);
  if (parent === null) return true;
  return program(parent) === "systemd" && hasArg(parent, "--user");
}

// The executable the operating system says a pid is running, by name: /proc
// on Linux, and on macOS the first text mapping lsof reports. Not argv[0],
// which any process can set to anything (ps -o comm shows it). null when it
// cannot be read, which fails the check.
export function executableName(pid, platform = process.platform) {
  try {
    // A binary replaced or removed since launch reads as "chrome (deleted)"; it is still Chrome.
    if (platform === "linux") return path.basename(readlinkSync(`/proc/${pid}/exe`)).replace(/ \(deleted\)$/, "");
    if (platform === "darwin") {
      // By full path: a hook or cron job may run with a PATH that lacks /usr/sbin.
      const mapped = run("/usr/sbin/lsof", ["-a", "-p", String(pid), "-d", "txt", "-Fn"], 5000).split("\n").find((l) => l.startsWith("n"));
      return mapped ? path.basename(mapped.slice(1)) : null;
    }
  } catch { /* gone, or not readable */ }
  return null;
}

// Right before a signal: the pid is still the same process (start time and
// command line unchanged), the operating system says it is running a
// Chromium-family executable, it still matches every rule, and its launcher is
// still gone.
export function sameOrphan(before, now, { profileRoot, parentArgs, initIsPid1, exeName }) {
  return Boolean(now && now.started === before.started && now.args === before.args &&
    CHROMIUM.has(exeName(now.pid) ?? "") &&
    isAgentBrowserRoot(now.args, profileRoot) && launcherGone(now, { parentArgs, initIsPid1 }));
}

export function parseMinAge(argv, dflt = 2) {
  const given = argv.find((a) => a.startsWith("--min-age"));
  if (given === undefined) return dflt;
  const m = given.match(/^--min-age=(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error("--min-age must be a number of minutes, for example --min-age=2");
  return Number(m[1]);
}

// The whole reading, shared by doctor.mjs and reap.mjs. In a live run each
// candidate's executable is read from the OS too, so what doctor and the dry
// run name is what reap would act on; one whose executable cannot be read is
// set apart as unverified and left alone. A saved table has no executables to
// read, so exeName is null there unless a test passes one.
// A live parent's command line for launcherGone: null only when the OS says
// the pid is gone. A parent that is alive but cannot be read (ps timed out
// under load) is "" and counts as a launcher still running.
export function liveParentArgs(pid, { isAlive = pidAlive, read = readOne } = {}) {
  if (!isAlive(pid)) return null;
  return read(pid)?.args ?? "";
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === "EPERM"; }
}

export function findOrphans({ env = process.env, minAgeMinutes = 2, profileRoot, exeName }) {
  const procs = readProcesses(env);
  const fromFile = Boolean(env.AGENT_BROWSING_PS_FILE);
  const readExe = exeName === undefined ? (fromFile ? null : executableName) : exeName;
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const parentArgs = fromFile ? (pid) => byPid.get(pid)?.args ?? null : (pid) => liveParentArgs(pid);
  const initIsPid1 = pid1IsInit(env);
  const unverified = [];
  const browsers = agentBrowsers(procs, profileRoot).filter((p) => {
    if (!readExe) return true;
    const exe = readExe(p.pid);
    if (exe === null) unverified.push(p);
    return exe !== null && CHROMIUM.has(exe);
  });
  const orphans = browsers.filter((p) => p.ageSeconds >= minAgeMinutes * 60 && launcherGone(p, { parentArgs, initIsPid1 }));
  const tools = procs.filter((p) => isAgentTool(p.args));
  return { procs, browsers, orphans, unverified, tools, parentArgs, initIsPid1 };
}
