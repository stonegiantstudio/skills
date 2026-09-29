import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, realpathSync, symlinkSync, readFileSync, writeFileSync, utimesSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  buildArgs, sessionName, checkoutRoot, scopedSession, takeSession, childEnv, loadParser, sessionIsOpen, checkOpen,
} from "../scripts/cli.mjs";
import { takeLock } from "../scripts/lib/lock.mjs";
import { cliDir, cliConfig, sandboxSetting } from "../scripts/lib/versions.mjs";
import { tempDir } from "./temp.mjs";

const cli = fileURLToPath(new URL("../scripts/cli.mjs", import.meta.url));
// Stands in for the CLI's parser where the CLI is not installed (CI); it reads
// only the plain forms these tests use. The tests at the end run the real one.
const plainParse = (argv) => {
  const out = { _: [] };
  for (const a of argv) {
    let m;
    if ((m = a.match(/^-s=(.*)$/))) out.s = m[1];
    else if ((m = a.match(/^--([^=]+)=(.*)$/))) out[m[1]] = m[2];
    else if ((m = a.match(/^--(.+)$/))) out[m[1]] = true;
    else out._.push(a);
  }
  return out;
};
const defaults = { parse: plainParse, configPath: "/c/playwright-cli.json", checkout: "ab-1234abcd" };
const build = (argv, extra = {}) => buildArgs(argv, { ...defaults, ...extra }).args;

test("open gets the session, the config and a 10-minute idle timeout", () => {
  assert.deepEqual(build(["open", "https://example.com"]), [
    "-s=ab-1234abcd", "open", "https://example.com", "--config=/c/playwright-cli.json", "--idle-timeout=600000",
  ]);
});

test("other session commands get only the session", () => {
  assert.deepEqual(build(["snapshot"]), ["-s=ab-1234abcd", "snapshot"]);
  assert.deepEqual(build(["click", "e12"]), ["-s=ab-1234abcd", "click", "e12"]);
  assert.deepEqual(build(["--help"]), ["-s=ab-1234abcd", "--help"]);
});

test("a named session lives under this checkout's name, in every spelling of the flag", () => {
  for (const argv of [["-s=mine", "snapshot"], ["-s", "mine", "snapshot"], ["--s=mine", "snapshot"], ["--s", "mine", "snapshot"],
    ["--session", "mine", "snapshot"], ["--session=mine", "snapshot"], ["snapshot", "-s=mine"]]) {
    assert.deepEqual(build(argv), ["-s=ab-1234abcd-mine", "snapshot"], argv.join(" "));
  }
  assert.deepEqual(build(["-s=ab-1234abcd-mine", "close"]), ["-s=ab-1234abcd-mine", "close"], "a name from `list` works as is");
  assert.equal(scopedSession("ab-1234abcd", "ab-1234abcd"), "ab-1234abcd");
  for (const bad of ["../x", "a b", "", "-x", "x".repeat(41), "ab-1234abcd-", "ab-1234abcd-/../../x", "ab-1234abcd-a b",
    `ab-1234abcd-${"x".repeat(41)}`]) {
    assert.throws(() => scopedSession(bad, "ab-1234abcd"), /session name/, bad);
  }
  assert.throws(() => takeSession(["-s=a", "--session=b", "snapshot"]), /one session/);
  assert.throws(() => takeSession(["snapshot", "-s"]), /needs a name/);
});

test("the caller's idle timeout is kept when it is in range, and a session that never idles out is refused", () => {
  assert.deepEqual(build(["open", "x", "--idle-timeout=60000"]), ["-s=ab-1234abcd", "open", "x", "--idle-timeout=60000", "--config=/c/playwright-cli.json"]);
  for (const bad of ["0", "abc", "3600001", "-1"]) assert.throws(() => build(["open", "x", `--idle-timeout=${bad}`]), /idle-timeout/, bad);
});

test("commands that reach beyond this checkout's sessions are refused", () => {
  for (const cmd of ["kill-all", "close-all", "attach", "detach", "show", "install", "install-browser", "pause-at", "resume", "step-over"]) {
    assert.throws(() => build([cmd]), /refused/, cmd);
  }
  assert.throws(() => build([]), /name a command/);
});

test("flags that reach the person's own browser, a visible window, or a config of the caller's choosing are refused", () => {
  for (const flag of ["--headed", "--extension=chrome", "--cdp=chrome", "--endpoint=ws://x", "--profile=/Users/me/Chrome",
    "--persistent", "--browser=chrome", "--config=/tmp/c.json"]) {
    assert.throws(() => build(["open", "x", flag]), /refused/, flag);
  }
  assert.throws(() => build(["list", "--all"]), /refused/, "list --all reads other workspaces and the person's Chrome profiles");
  assert.deepEqual(build(["list"]), ["-s=ab-1234abcd", "list"]);
});

test("after a bare --, everything is text for the command, --replace and -s included", () => {
  assert.deepEqual(build(["fill", "e5", "--", "--replace"]), ["-s=ab-1234abcd", "fill", "e5", "--", "--replace"]);
  assert.deepEqual(build(["type", "--", "-s"]), ["-s=ab-1234abcd", "type", "--", "-s"]);
  assert.equal(buildArgs(["open", "x", "--replace"], defaults).replace, true);
  assert.equal(buildArgs(["type", "--", "--replace"], defaults).replace, false);
});

const listed = readFileSync(new URL("./fixtures/cli-list.json", import.meta.url), "utf8");

test("the CLI's list output is read strictly: only a session listed as open is open", () => {
  assert.equal(sessionIsOpen(listed, "ab-1234abcd-mine"), true);
  assert.equal(sessionIsOpen(listed, "ab-1234abcd"), false, "listed, but closed");
  assert.equal(sessionIsOpen(listed, "ab-99999999"), false);
  assert.equal(sessionIsOpen('{"browsers":[]}', "ab-1234abcd"), false);
  assert.throws(() => sessionIsOpen('{"sessions":[]}', "x"), /unexpected/);
  assert.throws(() => sessionIsOpen("not json", "x"));
});

test("a second open over a live session is refused unless --replace, and so is one that cannot be checked", () => {
  const plan = (argv) => buildArgs(argv, defaults);
  const openHere = (name) => name === "ab-1234abcd";
  assert.throws(() => checkOpen(plan(["open", "x"]), openHere), /another agent/);
  assert.doesNotThrow(() => checkOpen(plan(["open", "x", "--replace"]), openHere));
  assert.doesNotThrow(() => checkOpen(plan(["open", "x", "-s=other"]), openHere));
  assert.doesNotThrow(() => checkOpen(plan(["snapshot"]), openHere), "only open is checked");
  const broken = () => { throw new Error("list timed out"); };
  assert.throws(() => checkOpen(plan(["open", "x"]), broken), /could not tell.*--replace/s);
  assert.doesNotThrow(() => checkOpen(plan(["open", "x", "--replace"]), broken));
});

test("one open at a time per session: a live holder keeps the lock, a dead or stale one loses it", () => {
  const file = path.join(tempDir(), "locks", "ab-1.lock");
  const release = takeLock(file, { pid: 111, isAlive: () => true });
  assert.equal(typeof release, "function");
  assert.equal(readFileSync(file, "utf8"), "111");
  assert.equal(takeLock(file, { pid: 222, isAlive: (p) => p === 111 }), null, "the holder is alive");
  release();
  assert.equal(existsSync(file), false);
  writeFileSync(file, "333");
  assert.equal(typeof takeLock(file, { pid: 444, isAlive: () => false }), "function", "the holder died");
  assert.equal(readFileSync(file, "utf8"), "444");
  const old = (Date.now() - 10 * 60_000) / 1000;
  utimesSync(file, old, old);
  assert.equal(typeof takeLock(file, { pid: 555, isAlive: () => true }), "function", "held longer than any open takes");
  writeFileSync(file, "garbage");
  assert.equal(typeof takeLock(file, { pid: 666, isAlive: () => true }), "function", "unreadable holder");
  assert.deepEqual(readdirSync(path.dirname(file)), ["ab-1.lock"], "no staging file left beside it");
});

test("releasing a lock another process has since taken over leaves that lock alone", () => {
  const file = path.join(tempDir(), "locks", "ab-2.lock");
  const releaseA = takeLock(file, { pid: 111 });
  writeFileSync(file, "222"); // A was judged dead and B took over
  releaseA();
  assert.equal(readFileSync(file, "utf8"), "222");
});

test("the CLI inherits no variable that reconfigures the session, never the preview secret, and our global config folder", () => {
  const env = childEnv({
    PATH: "/bin", HOME: "/h", PLAYWRIGHT_MCP_BROWSER: "chrome", PLAYWRIGHT_MCP_HEADLESS: "false", PLAYWRIGHT_CLI_SESSION: "x",
    PWTEST_DAEMON_SESSION_DIR: "/tmp/x", PWTEST_CLI_GLOBAL_CONFIG: "/Users/me", PWDEBUG: "1", VERCEL_AUTOMATION_BYPASS_SECRET: "s3cret",
    PW_CHROMIUM_ATTACH_TO_OTHER: "1", PW_EXTENSION_MODE: "1", SELENIUM_REMOTE_URL: "http://grid.example:4444",
  });
  assert.deepEqual(env, { PATH: "/bin", HOME: "/h", PWTEST_CLI_GLOBAL_CONFIG: "/h/.cache/agent-browsing/cli-home", NO_UPDATE_NOTIFIER: "1" });
});

test("a session is named for the git checkout, so every folder in it shares one", () => {
  const repo = realpathSync(tempDir());
  execFileSync("git", ["init", "-q", repo]);
  mkdirSync(path.join(repo, "app"));
  assert.equal(checkoutRoot(path.join(repo, "app")), repo);
  assert.equal(sessionName(checkoutRoot(path.join(repo, "app"))), sessionName(checkoutRoot(repo)));
  assert.notEqual(sessionName("/work/a"), sessionName("/work/b"));
  assert.match(sessionName("/work/a"), /^ab-[0-9a-f]{8}$/);
  const outside = tempDir();
  assert.equal(checkoutRoot(outside), outside);
});

test("not set up: exit 2 with the setup command, run directly or through a symlink", () => {
  const empty = tempDir();
  const link = path.join(tempDir(), "scripts");
  symlinkSync(path.dirname(cli), link);
  for (const script of [cli, path.join(link, "cli.mjs")]) {
    const r = spawnSync(process.execPath, [script, "open", "https://example.com"], {
      env: { ...process.env, AGENT_BROWSING_HOME: empty }, encoding: "utf8",
    });
    assert.equal(r.status, 2, script);
    assert.match(r.stderr, /setup\.mjs/);
  }
});

test("a config that turns the sandbox off is refused off Linux, the one place it can be needed", () => {
  const home = tempDir();
  const bin = path.join(home, "playwright-cli-0.1.21", "node_modules", "@playwright", "cli");
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(bin, "playwright-cli.js"), "process.exit(0);");
  writeFileSync(path.join(home, "playwright-cli.json"), JSON.stringify(cliConfig({ AGENT_BROWSING_HOME: home }, false)));
  const r = spawnSync(process.execPath, [cli, "snapshot"], { env: { ...process.env, AGENT_BROWSING_HOME: home }, encoding: "utf8" });
  if (process.platform === "linux") {
    assert.doesNotMatch(r.stderr, /sandbox off/);
  } else {
    assert.equal(r.status, 2);
    assert.match(r.stderr, /sandbox off/);
  }
});

// The pinned CLI's own parser: what these arguments would actually run.
const installed = existsSync(path.join(cliDir(), "node_modules", "playwright-core", "lib", "tools", "cli-client", "minimist.js"));
const real = { skip: installed ? false : "the pinned CLI is not installed (run scripts/setup.mjs)" };

test("with the CLI's own parser, a refused command cannot hide behind a flag that takes a value", real, () => {
  const parse = loadParser();
  for (const argv of [["--s", "snapshot", "kill-all"], ["--session", "snapshot", "kill-all"], ["-js", "snapshot", "kill-all"],
    ["-s=x", "--json", "true", "kill-all"], ["--", "kill-all"], ["--raw", "attach", "x"], ["-g", "install"],
    ["-js", "someone-else", "close"], ["-s=ab-1234abcd-/../../x", "close"]]) {
    assert.throws(() => build(argv, { parse }), /refused|could not read which session|session name/, argv.join(" "));
  }
});

test("with the CLI's own parser, a bare -- cannot push the skill's config and idle timeout out of reach", real, () => {
  const parse = loadParser();
  for (const argv of [["open", "--idle-timeout=60000", "--"], ["open", "--"], ["open", "--", "https://example.com"]]) {
    const args = build(argv, { parse });
    const ran = parse(args);
    assert.equal(ran.config, "/c/playwright-cli.json", argv.join(" "));
    assert.ok(Number(ran["idle-timeout"]) >= 1, argv.join(" "));
    assert.equal(args.indexOf("--") > args.findIndex((a) => a.startsWith("--config=")), true, "our flags come before the --");
  }
});

test("with the CLI's own parser, refused flags are caught in every form, and ordinary commands pass", real, () => {
  const parse = loadParser();
  for (const argv of [["open", "x", "--no-headed"], ["open", "x", "--config", "/tmp/c.json"], ["open", "--browser", "chrome", "x"]]) {
    assert.throws(() => build(argv, { parse }), /refused/, argv.join(" "));
  }
  assert.deepEqual(build(["snapshot", "--filename", "kill-all"], { parse }), ["-s=ab-1234abcd", "snapshot", "--filename", "kill-all"]);
  assert.deepEqual(build(["--json", "snapshot"], { parse }), ["-s=ab-1234abcd", "--json", "snapshot"]);
  assert.deepEqual(build(["mousewheel", "0", "-100"], { parse }), ["-s=ab-1234abcd", "mousewheel", "0", "-100"]);
});

test("a person's global Playwright config never reaches a session: the pinned resolver reads ours instead", real, async () => {
  const bundle = createRequire(import.meta.url)(path.join(cliDir(), "node_modules", "playwright-core", "lib", "coreBundle.js"));
  const globalConfig = (browser) => {
    const home = tempDir();
    mkdirSync(path.join(home, ".playwright"));
    writeFileSync(path.join(home, ".playwright", "cli.config.json"), JSON.stringify({ browser }));
    return home;
  };
  const launchOptions = { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--remote-debugging-port=9222"] };
  const withProfile = globalConfig({ userDataDir: "/Users/me/Library/Application Support/Google/Chrome", launchOptions });
  const withEndpoint = globalConfig({ cdpEndpoint: "http://localhost:9222", launchOptions });
  const config = path.join(tempDir(), "playwright-cli.json");
  writeFileSync(config, JSON.stringify(cliConfig()));
  const resolve = async (env) => (await bundle.tools.resolveCLIConfigForCLI(tempDir(), "x", { config }, env)).browser;
  // Even where a global file is read, ours asks for an isolated browser, so a
  // profile from it is refused rather than opened.
  await assert.rejects(resolve({ PWTEST_CLI_GLOBAL_CONFIG: withProfile }), /isolated/);
  // The control: the resolver still reads the global file from the folder this
  // variable names. If a release drops that, this fails before anything leaks.
  assert.equal((await resolve({ PWTEST_CLI_GLOBAL_CONFIG: withEndpoint })).cdpEndpoint, "http://localhost:9222");
  // As the daemon does it: a process whose home holds the file, resolving with
  // its own environment, once as inherited and once as cli.mjs passes it.
  const inChild = (home, viaCli) => {
    const script = `
      const { tools } = require(${JSON.stringify(path.join(cliDir(), "node_modules", "playwright-core", "lib", "coreBundle.js"))});
      import(${JSON.stringify(new URL("../scripts/cli.mjs", import.meta.url).href)}).then(async ({ childEnv }) => {
        if (${viaCli}) process.env = childEnv(process.env, ${JSON.stringify(tempDir())});
        const b = (await tools.resolveCLIConfigForCLI(${JSON.stringify(tempDir())}, "x", { config: ${JSON.stringify(config)} })).browser;
        console.log(JSON.stringify({ cdp: b.cdpEndpoint ?? null, exe: b.launchOptions.executablePath ?? null }));
      });`;
    const r = spawnSync(process.execPath, ["-e", script], { env: { ...process.env, HOME: home }, encoding: "utf8", timeout: 30_000 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
  };
  assert.equal(inChild(withEndpoint, false).cdp, "http://localhost:9222", "the control: a home's file is read");
  assert.deepEqual(inChild(withEndpoint, true), { cdp: null, exe: null });
  for (const home of [withProfile, withEndpoint]) {
    const ours = await resolve(childEnv({ HOME: home, PWTEST_CLI_GLOBAL_CONFIG: home }, tempDir()));
    assert.equal(ours.isolated, true);
    assert.equal(ours.userDataDir, undefined);
    assert.equal(ours.cdpEndpoint, undefined);
    assert.equal(ours.launchOptions.executablePath, undefined);
    assert.equal(ours.launchOptions.channel, "chromium-headless-shell");
    assert.equal(ours.launchOptions.headless, true);
    assert.ok(!(ours.launchOptions.args ?? []).some((a) => a.startsWith("--remote-debugging-port")));
  }
});

// Fixed names, so the CLI's per-session files are reused rather than piling up.
test("against the real CLI: a second open is refused while the first is live, and list reads as open", real, () => {
  const name = "cli-selftest";
  const run = (...argv) => spawnSync(process.execPath, [cli, ...argv], { encoding: "utf8", timeout: 60_000 });
  try {
    const first = run(`-s=${name}`, "open", "about:blank", "--replace");
    assert.equal(first.status, 0, first.stderr);
    const second = run(`-s=${name}`, "open", "about:blank");
    assert.equal(second.status, 2);
    assert.match(second.stderr, /already open/);
    // The session's browser runs with the sandbox setting setup recorded.
    const procs = execFileSync("ps", ["-ww", "-U", String(process.getuid()), "-o", "pid=,ppid=,args="], { encoding: "utf8" })
      .split("\n").filter((l) => l.trim()).map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/).slice(1));
    const daemon = procs.find(([, , args]) => args.includes("cliDaemon.js") && args.includes(`-${name} `));
    assert.ok(daemon, "the session's daemon");
    const browser = procs.find(([, ppid, args]) => ppid === daemon[0] && args.includes("--remote-debugging-pipe") && !/(^|\s)--type=/.test(args));
    assert.ok(browser, "the session's browser");
    assert.equal(/(^|\s)--no-sandbox(\s|$)/.test(browser[2]), !sandboxSetting());
  } finally {
    run(`-s=${name}`, "close");
  }
});

test("against the real CLI: two opens of one session at the same moment, and only one goes ahead", real, async () => {
  const name = "cli-selftest-race";
  const open = () => new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, `-s=${name}`, "open", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("exit", (code) => resolve({ code, stderr }));
  });
  try {
    spawnSync(process.execPath, [cli, `-s=${name}`, "close"], { timeout: 60_000 });
    const results = await Promise.all([open(), open()]);
    assert.deepEqual(results.map((r) => r.code).sort(), [0, 2], JSON.stringify(results));
    assert.match(results.find((r) => r.code === 2).stderr, /right now|already open/);
  } finally {
    spawnSync(process.execPath, [cli, `-s=${name}`, "close"], { timeout: 60_000 });
  }
});
